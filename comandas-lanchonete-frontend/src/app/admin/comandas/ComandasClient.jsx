"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Filter, Plus, ReceiptText, Search, UserRound } from "lucide-react";
import Swal from "sweetalert2";
import Pagination from "@/components/ui/pagination";
import Can from "@/components/ui/can/Can";
import { useComandas } from "@/hooks/useComandas";
import styles from "./ComandasClient.module.css";

const formatarMoeda = valor => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
}).format(Number(valor || 0));

function obterVisualComanda(status) {
    switch (status) {
        case "Aberta":
            return {
                label: "Aberta",
                className: styles.cardOpen
            };
        case "Aguardando Pagamento":
            return {
                label: "Aguardando pagamento",
                className: styles.cardWaiting
            };
        case "Paga":
            return {
                label: "Paga",
                className: styles.cardPaid
            };
        case "Cancelada":
            return {
                label: "Cancelada",
                className: styles.cardCanceled
            };
        default:
            return {
                label: status || "Não informado",
                className: styles.cardDefault
            };
    }
}

export default function ComandasClient() {
    const [busca, setBusca] = useState("");

    const {
        comandas,
        loading,
        page,
        setPage,
        totalPages,
        totalRecords,
        statusFilter,
        setStatusFilter,
        lastUpdate,
        listarComandas
    } = useComandas();

    const comandasFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        if (!termo) return comandas;

        return comandas.filter(comanda => {
            const id = String(comanda.id || "").toLowerCase();
            const mesa = String(comanda.numero_mesa || "").toLowerCase();
            const cliente = String(comanda.cliente_nome || "").toLowerCase();

            return id.includes(termo) || mesa.includes(termo) || cliente.includes(termo);
        });
    }, [busca, comandas]);

    const handleAtualizar = async () => {
        try {
            await listarComandas();
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível atualizar",
                text: error.response?.data?.message || "Não foi possível carregar as comandas.",
                icon: "error",
                confirmButtonColor: "var(--brand-red)"
            });
        }
    };

    const quantidadeExibida = busca ? comandasFiltradas.length : totalRecords;

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <div className={styles.filters}>
                    <label className={styles.search}>
                        <Search size={17} />
                        <input
                            type="search"
                            placeholder="Buscar mesa, comanda ou cliente"
                            value={busca}
                            onChange={event => setBusca(event.target.value)}
                            aria-label="Buscar comandas"
                        />
                    </label>

                    <label className={styles.filter}>
                        <Filter size={17} />
                        <select
                            value={statusFilter}
                            onChange={event => {
                                setBusca("");
                                setStatusFilter(event.target.value);
                                setPage(1);
                            }}
                            aria-label="Filtrar comandas por status"
                        >
                            <option value="">Todas</option>
                            <option value="Aberta">Abertas</option>
                            <option value="Aguardando Pagamento">Aguardando pagamento</option>
                            <option value="Paga">Pagas</option>
                            <option value="Cancelada">Canceladas</option>
                        </select>
                    </label>
                </div>

                <Can perform="comandas.abrir">
                    <Link href="/admin/comandas/cadastro" className={styles.newButton}>
                        <Plus size={18} />
                        Nova comanda
                    </Link>
                </Can>
            </div>

            <div className={styles.legend}>
                <span><i className={styles.legendOpen} /> Aberta</span>
                <span><i className={styles.legendPaid} /> Paga</span>
                <span><i className={styles.legendCanceled} /> Cancelada</span>
                <span><i className={styles.legendWaiting} /> Aguardando pagamento</span>
            </div>

            {loading ? (
                <div className={styles.cardsGrid}>
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className={styles.skeletonCard} />
                    ))}
                </div>
            ) : comandasFiltradas.length === 0 ? (
                <div className={styles.emptyState}>
                    <ReceiptText size={34} />
                    <strong>Nenhuma comanda encontrada</strong>
                    <span>
                        {busca
                            ? `Nenhum resultado para "${busca}".`
                            : "Não existem comandas para este filtro."}
                    </span>
                </div>
            ) : (
                <div className={styles.cardsGrid}>
                    {comandasFiltradas.map(comanda => {
                        const visual = obterVisualComanda(comanda.status);

                        return (
                            <article
                                key={comanda.id}
                                className={`${styles.orderCard} ${visual.className}`}
                            >
                                <div className={styles.statusBar}>
                                    <span className={styles.status}>
                                        <i />
                                        {visual.label}
                                    </span>

                                    <span className={styles.commandId}>
                                        #{comanda.id}
                                    </span>
                                </div>

                                <div className={styles.cardContent}>
                                    <div className={styles.tableArea}>
                                        <span>Mesa</span>
                                        <strong>{comanda.numero_mesa}</strong>
                                    </div>

                                    <div className={styles.customer}>
                                        <UserRound size={16} />
                                        <div>
                                            <span>Cliente</span>
                                            <strong>
                                                {comanda.cliente_nome || "Não informado"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    <div className={styles.total}>
                                        <span>Total</span>
                                        <strong>
                                            {formatarMoeda(comanda.valor_total)}
                                        </strong>
                                    </div>

                                    <Link
                                        href={`/admin/comandas/${comanda.id}`}
                                        className={styles.manageButton}
                                    >
                                        Gerenciar
                                        <ChevronRight size={16} />
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}