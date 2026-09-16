"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import {
    destinoNotificacao,
    estadoVisualNotificacao,
    podeInteragirComNotificacoes,
    selecionarRecentes,
    valorBadge
} from "@/lib/notifications.mjs";
import styles from "./NotificationBell.module.css";

function formatarData(data) {
    if (!data) return null;

    const valor = new Date(data);
    if (Number.isNaN(valor.getTime())) return null;

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(valor);
}

export default function NotificationBell() {
    const [aberto, setAberto] = useState(false);
    const [marcandoId, setMarcandoId] = useState(null);
    const [marcandoTodas, setMarcandoTodas] = useState(false);
    const [erroAcao, setErroAcao] = useState(null);
    const [tentandoNovamente, setTentandoNovamente] = useState(false);
    const gatilhoRef = useRef(null);
    const painelRef = useRef(null);
    const acaoEmAndamentoRef = useRef(false);
    const pathnameAnteriorRef = useRef(null);
    const dropdownId = useId();
    const {
        notificacoes, resumo, preferencias, loading, erro, erroRealtime,
        marcarLida, marcarTodasLidas, tentarNovamente
    } = useNotifications();
    const { hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const badge = valorBadge({ resumo, preferencias });
    const recentes = selecionarRecentes(notificacoes, 10);
    const processando = marcandoId !== null || marcandoTodas;
    const podeInteragir = podeInteragirComNotificacoes({ loading, processando });

    const fecharDropdown = useCallback(({ restaurarFoco = true } = {}) => {
        setAberto(false);
        if (restaurarFoco) {
            requestAnimationFrame(() => gatilhoRef.current?.focus());
        }
    }, []);

    useEffect(() => {
        if (!aberto) return undefined;

        painelRef.current?.focus();
        const aoClicarFora = evento => {
            const dentroDoGatilho = gatilhoRef.current?.contains(evento.target);
            const dentroDoPainel = painelRef.current?.contains(evento.target);
            if (!dentroDoGatilho && !dentroDoPainel) fecharDropdown();
        };
        const aoPressionarTecla = evento => {
            if (evento.key === "Escape") {
                evento.preventDefault();
                fecharDropdown();
            }
        };

        document.addEventListener("pointerdown", aoClicarFora);
        document.addEventListener("keydown", aoPressionarTecla);
        return () => {
            document.removeEventListener("pointerdown", aoClicarFora);
            document.removeEventListener("keydown", aoPressionarTecla);
        };
    }, [aberto, fecharDropdown]);

    useEffect(() => {
        if (pathnameAnteriorRef.current !== null && pathnameAnteriorRef.current !== pathname) {
            fecharDropdown();
        }
        pathnameAnteriorRef.current = pathname;
    }, [fecharDropdown, pathname]);

    const abrirNotificacao = async notificacao => {
        if (!podeInteragir || acaoEmAndamentoRef.current) return;

        acaoEmAndamentoRef.current = true;
        setMarcandoId(notificacao.id);
        setErroAcao(null);
        try {
            await marcarLida(notificacao.id);
            fecharDropdown({ restaurarFoco: false });
            router.push(destinoNotificacao(notificacao, hasPermission));
        } catch {
            setErroAcao("Não foi possível marcar a notificação como lida. Tente novamente.");
        } finally {
            acaoEmAndamentoRef.current = false;
            setMarcandoId(null);
        }
    };

    const abrirCentral = () => {
        fecharDropdown({ restaurarFoco: false });
        router.push("/admin/notificacoes");
    };

    const marcarTodas = async () => {
        if (!podeInteragir || acaoEmAndamentoRef.current) return;

        acaoEmAndamentoRef.current = true;
        setMarcandoTodas(true);
        setErroAcao(null);
        try {
            await marcarTodasLidas();
        } catch {
            setErroAcao("Não foi possível marcar todas as notificações como lidas. Tente novamente.");
        } finally {
            acaoEmAndamentoRef.current = false;
            setMarcandoTodas(false);
        }
    };

    const repetirCarregamento = async () => {
        if (tentandoNovamente) return;
        setTentandoNovamente(true);
        try {
            await tentarNovamente();
        } finally {
            setTentandoNovamente(false);
        }
    };

    const erroVisivel = erroAcao
        || (erro ? "Não foi possível carregar as notificações." : null)
        || (erroRealtime ? "Tempo real indisponível; o histórico continua acessível." : null);

    return (
        <div className={styles.wrapper}>
            <button
                type="button"
                className={styles.bellButton}
                aria-label="Notificações"
                aria-expanded={aberto}
                aria-haspopup="dialog"
                aria-controls={dropdownId}
                ref={gatilhoRef}
                onClick={() => {
                    if (aberto) fecharDropdown();
                    else {
                        setErroAcao(null);
                        setAberto(true);
                    }
                }}
            >
                <Bell size={20} aria-hidden="true" />
                {badge > 0 && <span className={styles.badge}>{badge > 99 ? "99+" : badge}</span>}
            </button>

            {aberto && (
                <section
                    id={dropdownId}
                    ref={painelRef}
                    className={styles.dropdown}
                    role="dialog"
                    aria-label="Notificações recentes"
                    aria-busy={loading || processando}
                    tabIndex={-1}
                >
                    <div className={styles.dropdownHeader}>
                        <strong>Notificações</strong>
                        <button
                            type="button"
                            className={styles.markAllButton}
                            onClick={() => { void marcarTodas(); }}
                            disabled={!podeInteragir}
                        >
                            Marcar todas como lidas
                        </button>
                    </div>

                    <div className={styles.list}>
                        {loading ? (
                            <p className={styles.loading} role="status">Carregando notificações...</p>
                        ) : recentes.length === 0 ? (
                            <p className={styles.empty}>Nenhuma notificação recente.</p>
                        ) : recentes.map(notificacao => {
                            const classes = [styles.notification];
                            const estadoVisual = estadoVisualNotificacao(notificacao);
                            if (estadoVisual === "unread") classes.push(styles.unread);
                            if (estadoVisual === "resolved") classes.push(styles.resolved);

                            return (
                                <button
                                    type="button"
                                    key={notificacao.id}
                                    className={classes.join(" ")}
                                    onClick={() => { void abrirNotificacao(notificacao); }}
                                    disabled={!podeInteragir}
                                >
                                    <span className={styles.notificationTitle}>{notificacao.titulo}</span>
                                    <span className={styles.notificationMessage}>{notificacao.mensagem}</span>
                                    <span className={styles.notificationMeta}>
                                        {formatarData(notificacao.criado_em)}
                                        {notificacao.resolvida_em && " · Resolvida"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {erroVisivel && (
                        <div className={styles.error} role="alert" aria-live="assertive">
                            <p>{erroVisivel}</p>
                            {(erro || erroRealtime) && (
                                <button type="button" onClick={() => { void repetirCarregamento(); }} disabled={tentandoNovamente}>
                                    {tentandoNovamente ? "Tentando..." : "Tentar novamente"}
                                </button>
                            )}
                        </div>
                    )}

                    <button type="button" className={styles.allNotificationsButton} onClick={abrirCentral}>
                        Ver todas
                    </button>
                </section>
            )}
        </div>
    );
}
