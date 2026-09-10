"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { destinoNotificacao, selecionarRecentes, valorBadge } from "@/lib/notifications.mjs";
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
    const { notificacoes, preferencias, marcarLida, marcarTodasLidas } = useNotifications();
    const { hasPermission } = useAuth();
    const router = useRouter();
    const badge = valorBadge({ notificacoes, preferencias });
    const recentes = selecionarRecentes(notificacoes, 10);

    const abrirNotificacao = async notificacao => {
        setMarcandoId(notificacao.id);
        try {
            await marcarLida(notificacao.id);
            setAberto(false);
            router.push(destinoNotificacao(notificacao, hasPermission));
        } finally {
            setMarcandoId(null);
        }
    };

    const abrirCentral = () => {
        setAberto(false);
        router.push("/admin/notificacoes");
    };

    return (
        <div className={styles.wrapper}>
            <button
                type="button"
                className={styles.bellButton}
                aria-label="Notificações"
                aria-expanded={aberto}
                aria-haspopup="dialog"
                onClick={() => setAberto(valor => !valor)}
            >
                <Bell size={20} aria-hidden="true" />
                {badge > 0 && <span className={styles.badge}>{badge > 99 ? "99+" : badge}</span>}
            </button>

            {aberto && (
                <section className={styles.dropdown} role="dialog" aria-label="Notificações recentes">
                    <div className={styles.dropdownHeader}>
                        <strong>Notificações</strong>
                        <button type="button" className={styles.markAllButton} onClick={marcarTodasLidas}>
                            Marcar todas como lidas
                        </button>
                    </div>

                    <div className={styles.list}>
                        {recentes.length === 0 ? (
                            <p className={styles.empty}>Nenhuma notificação recente.</p>
                        ) : recentes.map(notificacao => {
                            const classes = [styles.notification];
                            if (!notificacao.lida_em) classes.push(styles.unread);
                            if (notificacao.resolvida_em) classes.push(styles.resolved);

                            return (
                                <button
                                    type="button"
                                    key={notificacao.id}
                                    className={classes.join(" ")}
                                    onClick={() => abrirNotificacao(notificacao)}
                                    disabled={marcandoId === notificacao.id}
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

                    <button type="button" className={styles.allNotificationsButton} onClick={abrirCentral}>
                        Ver todas
                    </button>
                </section>
            )}
        </div>
    );
}
