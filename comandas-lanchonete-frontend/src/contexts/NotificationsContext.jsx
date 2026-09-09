"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { conectarSocket, obterSocket } from '@/lib/socket';
import {
    aplicarEventoNotificacao,
    contarBadge,
    deveMostrarToast,
    deveTocarSom,
    mesclarNotificacoes
} from '@/lib/notifications.mjs';
import { criarControleCooldownSom, tocarSomNotificacao } from '@/lib/notification-sound.mjs';
import { notificacoesService } from '@/services/notificacoes.service.js';
import { useAuth } from '@/hooks/useAuth';

export const NotificationsContext = createContext(undefined);

const PREFERENCIAS_PADRAO = {
    notificacoes_ativas: true,
    mostrar_badge: true,
    mostrar_toast: true,
    tocar_som: true
};

function listaDaResposta(resposta) {
    return Array.isArray(resposta) ? resposta : resposta?.notificacoes || [];
}

function resumoDaResposta(resposta) {
    return resposta || { nao_lidas_pendentes: 0 };
}

function idDoEvento(evento) {
    return evento?.id ?? evento?.notificacao_id;
}

export function NotificationsProvider({ children }) {
    const { hasPermission } = useAuth();
    const pathname = usePathname();
    const [notificacoes, setNotificacoes] = useState([]);
    const [resumo, setResumo] = useState({ nao_lidas_pendentes: 0 });
    const [preferencias, setPreferencias] = useState(PREFERENCIAS_PADRAO);
    const [loading, setLoading] = useState(true);
    const notificacoesRef = useRef([]);
    const resumoRef = useRef({ nao_lidas_pendentes: 0 });
    const preferenciasRef = useRef(PREFERENCIAS_PADRAO);
    const pathnameRef = useRef(pathname);
    const hasPermissionRef = useRef(hasPermission);
    const cooldownSom = useRef(criarControleCooldownSom());

    useEffect(() => {
        pathnameRef.current = pathname;
        hasPermissionRef.current = hasPermission;
    }, [hasPermission, pathname]);

    const substituirNotificacoes = useCallback((proximas, resumoAtualizado) => {
        notificacoesRef.current = proximas;
        setNotificacoes(proximas);
        if (resumoAtualizado) {
            resumoRef.current = resumoAtualizado;
            setResumo(resumoAtualizado);
        }
    }, []);

    const recarregar = useCallback(async ({ fila = [] } = {}) => {
        const [listaResposta, proximoResumo, proximasPreferencias] = await Promise.all([
            notificacoesService.listar({ pagina: 1, limite: 50 }),
            notificacoesService.resumo(),
            notificacoesService.obterPreferencias()
        ]);
        const listaHttp = listaDaResposta(listaResposta);
        const eventosDaFila = typeof fila === 'function' ? fila() : fila;
        const listaMesclada = eventosDaFila.length > 0
            ? mesclarNotificacoes(listaHttp, eventosDaFila)
            : mesclarNotificacoes(notificacoesRef.current, listaHttp);

        preferenciasRef.current = { ...PREFERENCIAS_PADRAO, ...proximasPreferencias };
        setPreferencias(preferenciasRef.current);
        substituirNotificacoes(listaMesclada, resumoDaResposta(proximoResumo));
        return listaMesclada;
    }, [substituirNotificacoes]);

    const marcarLida = useCallback(async id => {
        const anterior = notificacoesRef.current;
        const lidaEm = new Date().toISOString();
        const atualizadas = aplicarEventoNotificacao(anterior, { tipo: 'lida', id, lida_em: lidaEm });
        substituirNotificacoes(atualizadas, {
            ...resumoRef.current,
            nao_lidas_pendentes: contarBadge(atualizadas)
        });

        try {
            const relacao = await notificacoesService.marcarLida(id);
            const confirmadas = aplicarEventoNotificacao(notificacoesRef.current, {
                tipo: 'lida',
                id,
                lida_em: relacao?.lida_em || lidaEm
            });
            substituirNotificacoes(confirmadas, {
                ...resumoRef.current,
                nao_lidas_pendentes: contarBadge(confirmadas)
            });
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
        const anteriores = preferenciasRef.current;
        preferenciasRef.current = { ...anteriores, ...novas };
        setPreferencias(preferenciasRef.current);

        try {
            const persistidas = await notificacoesService.salvarPreferencias(novas);
            preferenciasRef.current = { ...PREFERENCIAS_PADRAO, ...persistidas };
            setPreferencias(preferenciasRef.current);
            return preferenciasRef.current;
        } catch (error) {
            await recarregar();
            throw error;
        }
    }, [recarregar]);

    useEffect(() => {
        let ativo = true;
        let prontoParaAlertar = false;
        let primeiroConnect = true;
        const filaBootstrap = new Map();
        let resolverPrimeiroConnect;
        const primeiroConnectConcluido = new Promise(resolve => {
            resolverPrimeiroConnect = resolve;
        });

        const atualizarComEvento = evento => {
            const atualizadas = aplicarEventoNotificacao(notificacoesRef.current, evento);
            substituirNotificacoes(atualizadas, {
                ...resumoRef.current,
                nao_lidas_pendentes: contarBadge(atualizadas)
            });
        };

        const aoReceberNova = notificacao => {
            if (!notificacao?.id) return;

            if (!prontoParaAlertar) {
                filaBootstrap.set(Number(notificacao.id), notificacao);
                return;
            }

            atualizarComEvento({ tipo: 'nova', notificacao });
            const preferenciasAtuais = preferenciasRef.current;
            if (deveMostrarToast({
                notificacao,
                preferencias: preferenciasAtuais,
                pathname: pathnameRef.current,
                hasPermission: hasPermissionRef.current
            })) {
                toast(notificacao.mensagem, { icon: '🔔' });
            }
            if (deveTocarSom(preferenciasAtuais) && cooldownSom.current.tentar()) {
                tocarSomNotificacao();
            }
        };

        const aoReceberLeitura = evento => {
            if (evento?.todas) {
                const lidaEm = evento.lida_em || new Date().toISOString();
                const atualizadas = notificacoesRef.current.map(item => item.lida_em ? item : { ...item, lida_em: lidaEm });
                substituirNotificacoes(atualizadas, { ...resumoRef.current, nao_lidas_pendentes: contarBadge(atualizadas) });
                return;
            }
            const id = idDoEvento(evento);
            if (id != null) atualizarComEvento({ tipo: 'lida', id, lida_em: evento.lida_em });
        };

        const aoReceberResolucao = notificacao => {
            const id = idDoEvento(notificacao);
            if (id != null) {
                atualizarComEvento({ tipo: 'resolvida', id, resolvida_em: notificacao.resolvida_em });
            }
        };

        const aoReceberPreferencias = novas => {
            preferenciasRef.current = { ...PREFERENCIAS_PADRAO, ...novas };
            setPreferencias(preferenciasRef.current);
        };

        const aoConectar = () => {
            if (primeiroConnect) {
                primeiroConnect = false;
                resolverPrimeiroConnect();
                return;
            }
            recarregar().catch(() => {});
        };

        const socket = obterSocket();

        socket.on('notificacao_nova', aoReceberNova);
        socket.on('notificacao_lida', aoReceberLeitura);
        socket.on('notificacao_resolvida', aoReceberResolucao);
        socket.on('notificacoes_preferencias_atualizadas', aoReceberPreferencias);
        socket.on('connect', aoConectar);
        conectarSocket();
        if (socket.connected) aoConectar();

        const inicializar = async () => {
            try {
                await recarregar({ fila: () => [...filaBootstrap.values()] });
                if (!ativo) return;

                await primeiroConnectConcluido;
                if (!ativo) return;

                await recarregar({ fila: () => [...filaBootstrap.values()] });
                filaBootstrap.clear();
                if (!ativo) return;
                prontoParaAlertar = true;
            } catch {
                // A próxima conexão/reconexão tenta recuperar a fonte de verdade novamente.
            } finally {
                if (ativo) setLoading(false);
            }
        };

        inicializar();

        return () => {
            ativo = false;
            resolverPrimeiroConnect();
            socket.off('notificacao_nova', aoReceberNova);
            socket.off('notificacao_lida', aoReceberLeitura);
            socket.off('notificacao_resolvida', aoReceberResolucao);
            socket.off('notificacoes_preferencias_atualizadas', aoReceberPreferencias);
            socket.off('connect', aoConectar);
        };
    }, [recarregar, substituirNotificacoes]);

    const valor = useMemo(() => ({
        notificacoes,
        resumo,
        preferencias,
        loading,
        marcarLida,
        marcarTodasLidas,
        salvarPreferencias,
        recarregar
    }), [loading, marcarLida, marcarTodasLidas, notificacoes, preferencias, recarregar, resumo, salvarPreferencias]);

    return <NotificationsContext.Provider value={valor}>{children}</NotificationsContext.Provider>;
}
