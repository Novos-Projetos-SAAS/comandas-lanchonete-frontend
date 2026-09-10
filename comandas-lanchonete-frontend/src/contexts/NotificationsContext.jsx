"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { descartarSocket, conectarSocket, obterSocket } from '@/lib/socket';
import { aplicarEventoNotificacao, contarBadge, deveMostrarToast, deveTocarSom } from '@/lib/notifications.mjs';
import { criarRuntimeNotificacoes } from '@/lib/notifications-runtime.mjs';
import { criarControleCooldownSom, tocarSomNotificacao } from '@/lib/notification-sound.mjs';
import { notificacoesService } from '@/services/notificacoes.service.js';
import { useAuth } from '@/hooks/useAuth';

export const NotificationsContext = createContext(undefined);

const PREFERENCIAS_PADRAO = { notificacoes_ativas: true, mostrar_badge: true, mostrar_toast: true, tocar_som: true };

export function NotificationsProvider({ children }) {
    const { hasPermission, user } = useAuth();
    const pathname = usePathname();
    const [notificacoes, setNotificacoes] = useState([]);
    const [resumo, setResumo] = useState({ nao_lidas_pendentes: 0 });
    const [preferencias, setPreferencias] = useState(PREFERENCIAS_PADRAO);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const notificacoesRef = useRef([]);
    const resumoRef = useRef({ nao_lidas_pendentes: 0 });
    const preferenciasRef = useRef(PREFERENCIAS_PADRAO);
    const pathnameRef = useRef(pathname);
    const hasPermissionRef = useRef(hasPermission);
    const runtimeRef = useRef(null);
    const cooldownSom = useRef(criarControleCooldownSom());

    useEffect(() => {
        pathnameRef.current = pathname;
        hasPermissionRef.current = hasPermission;
    }, [hasPermission, pathname]);

    const receberEstado = useCallback(estado => {
        notificacoesRef.current = estado.notificacoes;
        resumoRef.current = estado.resumo;
        preferenciasRef.current = estado.preferencias;
        setNotificacoes(estado.notificacoes);
        setResumo(estado.resumo);
        setPreferencias(estado.preferencias);
    }, []);

    const substituirNotificacoes = useCallback((proximas, resumoAtualizado) => {
        notificacoesRef.current = proximas;
        setNotificacoes(proximas);
        if (resumoAtualizado) {
            resumoRef.current = resumoAtualizado;
            setResumo(resumoAtualizado);
        }
        runtimeRef.current?.atualizarEstadoParcial({
            notificacoes: proximas,
            resumo: resumoAtualizado || resumoRef.current
        });
    }, []);

    const recarregar = useCallback(async () => {
        await runtimeRef.current?.recarregarSilenciosamente();
        return notificacoesRef.current;
    }, []);

    const tentarNovamente = useCallback(async () => runtimeRef.current?.tentarNovamente(), []);

    const marcarLida = useCallback(async id => {
        const lidaEm = new Date().toISOString();
        const atualizadas = aplicarEventoNotificacao(notificacoesRef.current, { tipo: 'lida', id, lida_em: lidaEm });
        substituirNotificacoes(atualizadas, { ...resumoRef.current, nao_lidas_pendentes: contarBadge(atualizadas) });
        try {
            const relacao = await notificacoesService.marcarLida(id);
            const confirmadas = aplicarEventoNotificacao(notificacoesRef.current, { tipo: 'lida', id, lida_em: relacao?.lida_em || lidaEm });
            substituirNotificacoes(confirmadas, { ...resumoRef.current, nao_lidas_pendentes: contarBadge(confirmadas) });
            return relacao;
        } catch (error) {
            await recarregar();
            throw error;
        }
    }, [recarregar, substituirNotificacoes]);

    const marcarTodasLidas = useCallback(async () => {
        const lidaEm = new Date().toISOString();
        const atualizadas = notificacoesRef.current.map(item => item.lida_em ? item : { ...item, lida_em: lidaEm });
        substituirNotificacoes(atualizadas, { ...resumoRef.current, nao_lidas_pendentes: 0 });
        try {
            return await notificacoesService.marcarTodasLidas();
        } catch (error) {
            await recarregar();
            throw error;
        }
    }, [recarregar, substituirNotificacoes]);

    const salvarPreferencias = useCallback(async novas => {
        preferenciasRef.current = { ...preferenciasRef.current, ...novas };
        setPreferencias(preferenciasRef.current);
        runtimeRef.current?.atualizarEstadoParcial({ preferencias: preferenciasRef.current });
        try {
            const persistidas = await notificacoesService.salvarPreferencias(novas);
            preferenciasRef.current = { ...PREFERENCIAS_PADRAO, ...persistidas };
            setPreferencias(preferenciasRef.current);
            runtimeRef.current?.atualizarEstadoParcial({ preferencias: preferenciasRef.current });
            return preferenciasRef.current;
        } catch (error) {
            await recarregar();
            throw error;
        }
    }, [recarregar]);

    useEffect(() => {
        if (!user?.id) return undefined;
        const runtime = criarRuntimeNotificacoes({
            socket: obterSocket(), conectar: conectarSocket, descartarSocket, service: notificacoesService,
            aoEstado: receberEstado,
            aoProntidao: pronto => {
                setLoading(!pronto);
                if (pronto) setErro(null);
            },
            aoErro: erroAtual => {
                setErro(erroAtual);
                if (erroAtual) setLoading(false);
            },
            aoAlerta: (notificacao, preferenciasAtuais) => {
                if (deveMostrarToast({ notificacao, preferencias: preferenciasAtuais, pathname: pathnameRef.current, hasPermission: hasPermissionRef.current })) {
                    toast(notificacao.mensagem, { icon: '🔔' });
                }
                if (deveTocarSom(preferenciasAtuais) && cooldownSom.current.tentar()) tocarSomNotificacao();
            }
        });
        runtimeRef.current = runtime;
        runtime.iniciar();
        return () => {
            runtime.parar();
            if (runtimeRef.current === runtime) runtimeRef.current = null;
        };
    }, [receberEstado, user?.id]);

    const valor = useMemo(() => ({
        notificacoes, resumo, preferencias, loading, erro, marcarLida, marcarTodasLidas,
        salvarPreferencias, recarregar, tentarNovamente
    }), [erro, loading, marcarLida, marcarTodasLidas, notificacoes, preferencias, recarregar, resumo, salvarPreferencias, tentarNovamente]);

    return <NotificationsContext.Provider value={valor}>{children}</NotificationsContext.Provider>;
}
