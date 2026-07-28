"use client";

import {
    Bell,
    Clock3,
    Info,
    MapPin,
    Power,
    Printer,
    RefreshCw,
    Settings2,
    ShieldCheck,
    Store,
    Timer,
    UserRound
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/hooks/useAuth";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
import styles from "./ConfiguracoesClient.module.css";

const formatarDataHora = (data) => {
    if (!data) return "Ainda não registrado";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(data));
};

/**
 * Tela funcional de abertura e fechamento do estabelecimento.
 * As demais seções são apenas informativas até possuírem suporte no backend.
 */
export default function ConfiguracoesClient() {
    const { hasPermission } = useAuth();
    const {
        statusLoja,
        loading,
        actionLoading,
        erro,
        carregarConfiguracoes,
        alterarFuncionamento
    } = useConfiguracoes();

    const podeAlterarStatus = hasPermission("loja.status");
    const estaAberta = Boolean(statusLoja?.esta_aberta);

    const confirmarAlteracao = async () => {
        if (!podeAlterarStatus || actionLoading || !statusLoja) return;

        let motivo = null;

        if (estaAberta) {
            const confirmacao = await Swal.fire({
                title: "Fechar estabelecimento?",
                html: `
                    <p>Novas comandas e novos pedidos serão bloqueados.</p>
                    <p style="margin-top: 8px;">Comandas abertas continuarão disponíveis para consulta, pagamento e finalização.</p>
                `,
                input: "textarea",
                inputLabel: "Motivo do fechamento (opcional)",
                inputPlaceholder: "Ex.: encerramento do expediente",
                inputAttributes: { maxlength: "255" },
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "var(--brand-orange)",
                cancelButtonColor: "var(--text-secondary)",
                confirmButtonText: "Sim, fechar",
                cancelButtonText: "Cancelar"
            });

            if (!confirmacao.isConfirmed) return;
            motivo = confirmacao.value?.trim() || null;
        } else {
            const confirmacao = await Swal.fire({
                title: "Abrir estabelecimento?",
                text: "Novas comandas, pedidos e atendimentos pelo cardápio serão liberados.",
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "var(--status-success)",
                cancelButtonColor: "var(--text-secondary)",
                confirmButtonText: "Sim, abrir",
                cancelButtonText: "Cancelar"
            });

            if (!confirmacao.isConfirmed) return;
        }

        try {
            const response = await alterarFuncionamento({
                estaAberta: !estaAberta,
                motivo
            });

            await Swal.fire({
                title: !estaAberta ? "Estabelecimento aberto" : "Estabelecimento fechado",
                text: response?.message || "Status atualizado com sucesso.",
                icon: "success",
                confirmButtonColor: "var(--brand-orange)"
            });
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível alterar",
                text: error.response?.data?.message || "Verifique sua conexão e tente novamente.",
                icon: "error",
                confirmButtonColor: "var(--brand-red)"
            });

            // Recarrega para resolver alterações simultâneas feitas por outro administrador.
            carregarConfiguracoes({ silencioso: true }).catch(() => {});
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingCard}>
                <RefreshCw size={24} className={styles.spinning} />
                Carregando configurações...
            </div>
        );
    }

    if (erro || !statusLoja) {
        return (
            <div className={styles.errorCard}>
                <Info size={30} />
                <div>
                    <strong>Configurações indisponíveis</strong>
                    <p>{erro || "Não foi possível encontrar o status do estabelecimento."}</p>
                </div>
                <button type="button" onClick={() => carregarConfiguracoes()}>
                    Tentar novamente
                </button>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <section
                className={`${styles.operationCard} ${estaAberta ? styles.openCard : styles.closedCard}`}
                aria-live="polite"
            >
                <div className={styles.operationHeader}>
                    <div className={styles.iconBox}>
                        <Store size={30} />
                    </div>
                    <div>
                        <span className={styles.eyebrow}>Funcionamento do estabelecimento</span>
                        <h2>{estaAberta ? "Estabelecimento aberto" : "Estabelecimento fechado"}</h2>
                    </div>
                    <span className={styles.statusBadge}>
                        <span className={styles.statusDot} />
                        {statusLoja.status}
                    </span>
                </div>

                <p className={styles.operationDescription}>
                    {estaAberta
                        ? "Novas comandas, pedidos e atendimentos pelo QR Code estão liberados."
                        : "Novas comandas e novos pedidos estão bloqueados. Comandas existentes ainda podem ser finalizadas."}
                </p>

                <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                        <Clock3 size={19} />
                        <div>
                            <span>Última alteração</span>
                            <strong>{formatarDataHora(statusLoja.atualizado_em)}</strong>
                        </div>
                    </div>
                    <div className={styles.detailItem}>
                        <UserRound size={19} />
                        <div>
                            <span>Alterado por</span>
                            <strong>{statusLoja.alterado_por?.nome || "Sistema"}</strong>
                        </div>
                    </div>
                    <div className={styles.detailItem}>
                        <Timer size={19} />
                        <div>
                            <span>{estaAberta ? "Aberto em" : "Fechado em"}</span>
                            <strong>
                                {formatarDataHora(estaAberta ? statusLoja.aberto_em : statusLoja.fechado_em)}
                            </strong>
                        </div>
                    </div>
                </div>

                {!estaAberta && statusLoja.motivo_fechamento && (
                    <div className={styles.reasonBox}>
                        <Info size={18} />
                        <div>
                            <span>Motivo informado</span>
                            <strong>{statusLoja.motivo_fechamento}</strong>
                        </div>
                    </div>
                )}

                <div className={styles.operationFooter}>
                    <div className={styles.permissionInfo}>
                        <ShieldCheck size={18} />
                        {podeAlterarStatus
                            ? "Você possui permissão para alterar o funcionamento."
                            : "Somente usuários com loja.status podem realizar esta alteração."}
                    </div>

                    <button
                        type="button"
                        className={estaAberta ? styles.closeButton : styles.openButton}
                        onClick={confirmarAlteracao}
                        disabled={!podeAlterarStatus || actionLoading}
                        title={!podeAlterarStatus ? "Permissão loja.status necessária" : undefined}
                    >
                        <Power size={19} />
                        {actionLoading
                            ? "Alterando..."
                            : estaAberta
                                ? "Fechar estabelecimento"
                                : "Abrir estabelecimento"}
                    </button>
                </div>
            </section>

            <section className={styles.futureGrid} aria-label="Configurações futuras">
                <article className={styles.futureCard}>
                    <div className={styles.futureIcon}><MapPin size={22} /></div>
                    <div>
                        <div className={styles.futureTitleRow}>
                            <h3>Informações do estabelecimento</h3>
                            <span>Em breve</span>
                        </div>
                        <p>Nome, telefone, endereço e mensagem exibida no cardápio.</p>
                    </div>
                </article>

                <article className={styles.futureCard}>
                    <div className={styles.futureIcon}><Settings2 size={22} /></div>
                    <div>
                        <div className={styles.futureTitleRow}>
                            <h3>Atendimento</h3>
                            <span>Em breve</span>
                        </div>
                        <p>Tempo de atenção das mesas e regras de pedidos por atendentes e clientes.</p>
                    </div>
                </article>

                <article className={styles.futureCard}>
                    <div className={styles.futureIcon}><Bell size={22} /></div>
                    <div>
                        <div className={styles.futureTitleRow}>
                            <h3>Notificações</h3>
                            <span>Em breve</span>
                        </div>
                        <p>Preferências de avisos operacionais para salão, cozinha e caixa.</p>
                    </div>
                </article>

                <article className={styles.futureCard}>
                    <div className={styles.futureIcon}><Printer size={22} /></div>
                    <div>
                        <div className={styles.futureTitleRow}>
                            <h3>Impressão e sistema</h3>
                            <span>Em breve</span>
                        </div>
                        <p>Configuração de impressoras, comprovantes e preferências gerais.</p>
                    </div>
                </article>
            </section>
        </div>
    );
}
