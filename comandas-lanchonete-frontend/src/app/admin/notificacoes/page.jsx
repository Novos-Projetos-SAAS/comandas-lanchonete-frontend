"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import {
    destinoNotificacao,
    estadoVisualNotificacao,
    filtrarNotificacoes,
    prepararPreferenciasAtualizadas
} from "@/lib/notifications.mjs";
import styles from "./page.module.css";

const FILTROS_ESTADO = [
    ["todas", "Todas"],
    ["nao_lidas", "Não lidas"],
    ["pendentes", "Pendentes"],
    ["resolvidas", "Resolvidas"]
];

const FILTROS_TIPO = [
    ["NOVO_PEDIDO", "Novo pedido"],
    ["PEDIDO_PRONTO", "Pedido pronto"],
    ["CONTA_SOLICITADA", "Conta solicitada"]
];

const CAMPOS_PREFERENCIA = [
    ["notificacoes_ativas", "Ativar notificações", "Controla os alertas; o histórico continua disponível."],
    ["mostrar_badge", "Mostrar badge", "Exibe a quantidade de notificações pendentes no sino."],
    ["mostrar_toast", "Mostrar avisos", "Mostra um aviso visual quando uma nova notificação chegar."],
    ["tocar_som", "Tocar som", "Toca um som curto para novas notificações."]
];

function formatarData(data) {
    const valor = new Date(data);
    if (Number.isNaN(valor.getTime())) return "Data indisponível";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(valor);
}

export default function NotificacoesPage() {
    const [estado, setEstado] = useState("todas");
    const [tipo, setTipo] = useState(null);
    const [preferenciaSalvando, setPreferenciaSalvando] = useState(null);
    const [notificacaoAbrindo, setNotificacaoAbrindo] = useState(null);
    const [tentandoNovamente, setTentandoNovamente] = useState(false);
    const { notificacoes, preferencias, loading, erro, marcarLida, salvarPreferencias, tentarNovamente } = useNotifications();
    const { hasPermission } = useAuth();
    const router = useRouter();
    const filtradas = filtrarNotificacoes(notificacoes, { estado, tipo });

    const abrirNotificacao = async notificacao => {
        if (notificacaoAbrindo !== null) return;

        setNotificacaoAbrindo(notificacao.id);
        try {
            await marcarLida(notificacao.id);
            router.push(destinoNotificacao(notificacao, hasPermission));
        } catch {
            toast.error("Não foi possível abrir a notificação. Tente novamente.");
        } finally {
            setNotificacaoAbrindo(null);
        }
    };

    const alternarPreferencia = async campo => {
        if (preferenciaSalvando !== null) return;

        setPreferenciaSalvando(campo);
        try {
            await salvarPreferencias(prepararPreferenciasAtualizadas(preferencias, campo));
        } catch {
            toast.error("Não foi possível atualizar as preferências. O estado foi recarregado.");
        } finally {
            setPreferenciaSalvando(null);
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

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Central de notificações</h1>
                    <p>Acompanhe os avisos operacionais dos últimos 30 dias.</p>
                </div>
            </header>

            <section className={styles.content} aria-label="Histórico de notificações">
                <div className={styles.history}>
                    <div className={styles.filters}>
                        <fieldset className={styles.filterGroup}>
                            <legend className={styles.filterLegend}>Filtrar por estado</legend>
                            {FILTROS_ESTADO.map(([valor, rotulo]) => (
                                <button
                                    type="button"
                                    key={valor}
                                    className={estado === valor ? styles.filterActive : styles.filter}
                                    aria-pressed={estado === valor}
                                    onClick={() => setEstado(valor)}
                                >
                                    {rotulo}
                                </button>
                            ))}
                        </fieldset>
                        <fieldset className={styles.filterGroup}>
                            <legend className={styles.filterLegend}>Filtrar por tipo</legend>
                            <button
                                type="button"
                                className={tipo === null ? styles.filterActive : styles.filter}
                                aria-pressed={tipo === null}
                                onClick={() => setTipo(null)}
                            >
                                Todos os tipos
                            </button>
                            {FILTROS_TIPO.map(([valor, rotulo]) => (
                                <button
                                    type="button"
                                    key={valor}
                                    className={tipo === valor ? styles.filterActive : styles.filter}
                                    aria-pressed={tipo === valor}
                                    onClick={() => setTipo(valor)}
                                >
                                    {rotulo}
                                </button>
                            ))}
                        </fieldset>
                    </div>

                    {erro ? (
                        <div className={styles.error} role="alert" aria-live="assertive">
                            <p>Não foi possível carregar as notificações. Verifique a conexão e tente novamente.</p>
                            <button type="button" onClick={() => { void repetirCarregamento(); }} disabled={tentandoNovamente}>
                                {tentandoNovamente ? "Tentando novamente..." : "Tentar novamente"}
                            </button>
                        </div>
                    ) : loading ? (
                        <p className={styles.loading} role="status">Carregando notificações...</p>
                    ) : filtradas.length === 0 ? (
                        <p className={styles.empty}>Nenhuma notificação encontrada para estes filtros.</p>
                    ) : (
                        <div className={styles.notificationList}>
                            {filtradas.map(notificacao => {
                                const estadoVisual = estadoVisualNotificacao(notificacao);
                                const classes = [styles.notification, styles[estadoVisual]];
                                const abrindo = notificacaoAbrindo === notificacao.id;

                                return (
                                    <button
                                        type="button"
                                        key={notificacao.id}
                                        className={classes.join(" ")}
                                        onClick={() => { void abrirNotificacao(notificacao); }}
                                        disabled={notificacaoAbrindo !== null}
                                    >
                                        <span className={styles.notificationHeader}>
                                            <strong>{notificacao.titulo}</strong>
                                            <time dateTime={notificacao.criado_em}>{formatarData(notificacao.criado_em)}</time>
                                        </span>
                                        <span className={styles.message}>{notificacao.mensagem}</span>
                                        <span className={styles.status}>
                                            {estadoVisual === "resolved" ? "Resolvida" : estadoVisual === "unread" ? "Não lida" : "Lida"}
                                            {abrindo && " · Abrindo..."}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <aside className={styles.preferences} aria-labelledby="preferencias-title">
                    <h2 id="preferencias-title">Preferências</h2>
                    <p>Escolha como deseja receber novos alertas.</p>
                    <div className={styles.preferenceList}>
                        {CAMPOS_PREFERENCIA.map(([campo, rotulo, descricao]) => (
                            <label className={styles.preference} key={campo}>
                                <span>
                                    <strong>{rotulo}</strong>
                                    <small>{descricao}</small>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={Boolean(preferencias?.[campo])}
                                    disabled={preferenciaSalvando !== null}
                                    onChange={() => { void alternarPreferencia(campo); }}
                                />
                            </label>
                        ))}
                    </div>
                </aside>
            </section>
        </main>
    );
}
