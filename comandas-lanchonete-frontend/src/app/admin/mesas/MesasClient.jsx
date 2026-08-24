"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Clock3, Filter, Plus, Search, Trash2, Users } from "lucide-react";
import Swal from "sweetalert2";
import Can from "@/components/ui/can/Can";
import Pagination from "@/components/ui/pagination";
import ActionMenu from "@/components/ui/actionMenu";
import { useMesas } from "@/hooks/useMesas";
import styles from "./MesasClient.module.css";

const formatarMoeda = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

const formatarTempo = minutos => {
    if (minutos === null || minutos === undefined) return "Sem atividade";
    if (minutos < 1) return "agora";
    if (minutos < 60) return `há ${minutos} min`;

    const horas = Math.floor(minutos / 60);
    const restante = minutos % 60;

    return restante ? `há ${horas}h ${restante}min` : `há ${horas}h`;
};

function obterVisualMesa(mesa) {
    if (!mesa.ativo) return { label: "Inativa", cardClass: styles.cardInactive };
    if (mesa.precisa_atencao) return { label: "Atenção", cardClass: styles.cardAttention };
    if (mesa.status === "Livre") return { label: "Livre", cardClass: styles.cardFree };
    if (mesa.status === "Fechando") return { label: "Fechando", cardClass: styles.cardClosing };
    return { label: "Ocupada", cardClass: styles.cardOccupied };
}

export default function MesasClient() {
    const {
        mesas,
        resumo,
        loading,
        actionLoading,
        page,
        setPage,
        totalPages,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        inativarMesa,
        reativarMesa
    } = useMesas();

    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        if (inputValue === search) return;

        const timeout = window.setTimeout(() => {
            setSearch(inputValue);
            setPage(1);
        }, 400);

        return () => window.clearTimeout(timeout);
    }, [inputValue, search, setPage, setSearch]);

    const handleInativar = async mesa => {
        if (mesa.status !== "Livre") {
            await Swal.fire({
                title: "Mesa em uso",
                text: "Finalize ou cancele a comanda antes de inativar esta mesa.",
                icon: "warning",
                confirmButtonColor: "var(--brand-orange)"
            });
            return;
        }

        const resultado = await Swal.fire({
            title: `Inativar Mesa ${mesa.numero}?`,
            text: "Ela ficará indisponível para novas comandas.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Inativar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "var(--brand-orange)"
        });

        if (!resultado.isConfirmed) return;

        try {
            await inativarMesa(mesa.id);
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível inativar",
                text: error.response?.data?.message || "Tente novamente.",
                icon: "error",
                confirmButtonColor: "var(--brand-red)"
            });
        }
    };

    const handleReativar = async mesa => {
        try {
            await reativarMesa(mesa.id);
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível reativar",
                text: error.response?.data?.message || "Tente novamente.",
                icon: "error",
                confirmButtonColor: "var(--brand-red)"
            });
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={17} />
                    <input
                        type="search"
                        placeholder="Buscar mesa..."
                        value={inputValue}
                        onChange={event => setInputValue(event.target.value.replace(/\D/g, ""))}
                        inputMode="numeric"
                    />
                </div>

                <div className={styles.filterWrapper}>
                    <Filter size={17} />
                    <select
                        value={statusFilter}
                        onChange={event => setStatusFilter(event.target.value)}
                    >
                        <option value="todas">Todas ({resumo.total})</option>
                        <option value="livres">Livres ({resumo.livres})</option>
                        <option value="ocupadas">Ocupadas ({resumo.ocupadas})</option>
                        <option value="atencao">Atenção ({resumo.atencao})</option>
                        <option value="inativas">Inativas ({resumo.inativas})</option>
                    </select>
                </div>

                <Can perform="mesas.criar">
                    <Link href="/admin/mesas/cadastro" className={styles.addButton}>
                        <Plus size={18} />
                        Nova mesa
                    </Link>
                </Can>
            </div>

            <div className={styles.legend}>
                <span><i className={styles.legendFree} /> Livre</span>
                <span><i className={styles.legendOccupied} /> Ocupada</span>
                <span><i className={styles.legendClosing} /> Fechando</span>
                <span><i className={styles.legendAttention} /> Atenção</span>
                <span><i className={styles.legendInactive} /> Inativa</span>
            </div>

            {loading ? (
                <div className={styles.cardsGrid}>
                    {Array.from({ length: 12 }).map((_, index) => (
                        <div key={index} className={styles.skeletonCard} />
                    ))}
                </div>
            ) : mesas.length === 0 ? (
                <div className={styles.emptyState}>
                    <Users size={36} />
                    <strong>Nenhuma mesa encontrada</strong>
                    <span>Altere os filtros ou cadastre uma nova mesa.</span>
                </div>
            ) : (
                <div className={styles.cardsGrid}>
                    {mesas.map(mesa => {
                        const visual = obterVisualMesa(mesa);
                        const processando = actionLoading === mesa.id;
                        const ocupada = mesa.ativo && mesa.status !== "Livre";
                        const comanda = mesa.comanda;

                        return (
                            <article key={mesa.id} className={`${styles.tableCard} ${visual.cardClass}`}>
                                <div className={styles.cardHeader}>
                                    <Link href={`/admin/mesas/${mesa.id}?mode=view`} className={styles.tableTitle}>

                                        Mesa<p className={`${styles.tableTitle} ${styles.numberTable}`}> {mesa.numero}</p>
                                    </Link>

                                    <div className={styles.headerRight}>
                                        <span className={styles.statusText}>{visual.label}</span>

                                        <ActionMenu
                                            item={mesa}
                                            basePath="/admin/mesas"
                                            permissionPrefix="mesas"
                                            viewPermission={null}
                                            editPermission="mesas.editar"
                                            archivePermission="mesas.status"
                                            reactivatePermission="mesas.status"
                                            archiveDisabled={mesa.ativo && mesa.status !== "Livre"}
                                            archiveDisabledTitle={mesa.status !== "Livre" ? "A mesa precisa estar livre para ser inativada" : ""}
                                            isProcessing={processando}
                                            onArchive={(id, nome, mesaCompleta) => handleInativar(mesaCompleta)}
                                            onReactivate={(id, nome, mesaCompleta) => handleReativar(mesaCompleta)}
                                        />
                                    </div>
                                </div>

                                <Link href={`/admin/mesas/${mesa.id}?mode=view`} className={styles.cardBody}>
                                    {!mesa.ativo ? (
                                        <div className={styles.centerState}>
                                            <Trash2 size={19} />
                                            <strong>Indisponível</strong>
                                        </div>
                                    ) : mesa.status === "Livre" ? (
                                        <div className={styles.centerState}>
                                            <Users size={19} />
                                            <strong>Livre</strong>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={styles.consumptionRow}>
                                                <span>Consumo</span>
                                                <strong>{formatarMoeda(comanda?.valor_total)}</strong>
                                            </div>

                                            <div className={styles.infoRow}>
                                                <span>Cliente</span>
                                                <strong>{comanda?.cliente_nome || "Não informado"}</strong>
                                            </div>

                                        </>
                                    )}
                                </Link>


                                <div className={`${mesa.precisa_atencao ? styles.attentionFlag : ''}`}>
                                    {mesa.precisa_atencao && (
                                        <>
                                            <AlertTriangle size={13} />
                                            Sem novo pedido há {mesa.minutos_sem_pedido} min
                                        </>
                                    )}
                                </div>

                                {ocupada && comanda && (
                                    <Link href={`/admin/comandas/${comanda.id}`} className={styles.comandaLink}>
                                        Comanda #{comanda.id}
                                    </Link>
                                )}

                            </article>
                        );
                    })}
                </div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
}