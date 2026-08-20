"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CircleDollarSign, Clock3, Hash, ReceiptText, RefreshCw, Store, UserRound, Utensils, Plus, Search, ShoppingBasket, Clock, Open, Filter } from "lucide-react";
import Swal from "sweetalert2";
import Pagination from "@/components/ui/pagination";
import { useComandas } from "@/hooks/useComandas";
import Can from "@/components/ui/can/Can";
import styles from "./ComandasClient.module.css";

const formatarMoeda = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

const formatarDataHora = data => {
    if (!data) return "Não informado";
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data));
};

const calcularTempoAberta = data => {
    if (!data) return "";
    const inicio = new Date(data);
    const agora = new Date();
    const diferenca = Math.max(0, agora.getTime() - inicio.getTime());
    const minutos = Math.floor(diferenca / 60000);

    if (minutos < 1) return "Agora";
    if (minutos < 60) return `${minutos} min`;

    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    if (horas < 24) return minutosRestantes ? `${horas}h ${minutosRestantes}min` : `${horas}h`;

    const dias = Math.floor(horas / 24);
    return `${dias}d ${horas % 24}h`;
};

function obterVisualComanda(status) {
    switch (status) {
        case "Aberta": return { label: "Aberta", cardClass: styles.cardOpen, badgeClass: styles.badgeOpen };
        case "Aguardando Pagamento": return { label: "Aguardando pagamento", cardClass: styles.cardWaiting, badgeClass: styles.badgeWaiting };
        case "Paga": return { label: "Paga", cardClass: styles.cardPaid, badgeClass: styles.badgePaid };
        case "Cancelada": return { label: "Cancelada", cardClass: styles.cardCanceled, badgeClass: styles.badgeCanceled };
        default: return { label: status || "Não informado", cardClass: "", badgeClass: styles.badgeDefault };
    }
}

export default function ComandasClient() {
    const [busca, setBusca] = useState("");
    const { comandas, loading, page, setPage, totalPages, totalRecords, statusFilter, setStatusFilter, lastUpdate, listarComandas } = useComandas();

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
            await Swal.fire({ title: "Não foi possível atualizar", text: error.response?.data?.message || "Não foi possível carregar as comandas.", icon: "error", confirmButtonColor: "var(--brand-red)" });
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.actionsBar}>
                <div className={styles.filtersGroup}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input type="search" className={styles.searchInput} placeholder="Buscar comanda, mesa ou cliente..." value={busca} onChange={event => setBusca(event.target.value)} aria-label="Buscar comandas" />
                    </div>

                    <div className={styles.selectWrapper}>
                        <Filter size={18} className={styles.filterIcon} />

                        <select id="status-comanda" className={styles.statusSelect} value={statusFilter} onChange={event => { setBusca(""); setStatusFilter(event.target.value); }} aria-label="Filtrar comandas por status">
                            <option value="Aberta">Abertas</option>
                            <option value="Aguardando Pagamento">Aguardando pagamento</option>
                            <option value="Paga">Pagas</option>
                            <option value="Cancelada">Canceladas</option>
                            <option value="">Todas</option>
                        </select>
                    </div>
                </div>

                <Can perform="comandas.abrir">
                    <Link href="/admin/comandas/cadastro" className={styles.newButton}><Plus size={20} /> Nova Comanda</Link>
                </Can>
            </div>

            <div className={styles.listInfo}>
                <span>
                    {busca ? (
                        <><strong>{comandasFiltradas.length}</strong>{" "}{comandasFiltradas.length === 1 ? "resultado encontrado" : "resultados encontrados"}</>
                    ) : (
                        <><strong>{totalRecords}</strong>{" "}{totalRecords === 1 ? "comanda encontrada" : "comandas encontradas"}</>
                    )}
                </span>

                {lastUpdate && <span>Atualizado às {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>}
            </div>

            {loading ? (
                <div className={styles.cardsGrid}>
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div key={index} className={styles.skeletonCard}>
                            <div className={styles.skeletonLineLarge} />
                            <div className={styles.skeletonLine} />
                            <div className={styles.skeletonLine} />
                            <div className={styles.skeletonLineShort} />
                        </div>
                    ))}
                </div>
            ) : comandasFiltradas.length === 0 ? (
                <div className={styles.emptyState}>
                    <ReceiptText size={42} />
                    <strong>Nenhuma comanda encontrada</strong>
                    <p>{busca ? `Nenhum resultado encontrado para "${busca}".` : "Não existem comandas para o status selecionado."}</p>
                </div>
            ) : (
                <div className={styles.cardsGrid}>
                    {comandasFiltradas.map(comanda => {
                        const visual = obterVisualComanda(comanda.status);

                        return (
                            <article key={comanda.id} className={`${styles.orderCard} ${visual.cardClass}`}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.commandNumber}><Hash size={15} /> Comanda {comanda.id}</div>

                                    <span className={`${styles.statusBadge} ${visual.badgeClass}`}>
                                        {(() => {
                                            switch (comanda.status) {
                                                case "Aberta": return <ShoppingBasket size={15} />;
                                                case "Aguardando Pagamento": return <Clock size={15} />;
                                                case "Paga": return <CircleDollarSign size={15} />;
                                                case "Cancelada": return <RefreshCw size={15} />;
                                                default: return null;
                                            }
                                        })()}
                                        {visual.label}
                                    </span>
                                </div>

                                <div className={styles.cardBody}>
                                    <div>
                                        <span className={styles.tableLabel}>Mesa</span>
                                        <h2 className={styles.tableNumber}>{comanda.numero_mesa}</h2>
                                    </div>

                                    <div className={styles.infoRow}>
                                        <UserRound size={17} />
                                        <div>
                                            <span>Cliente</span>
                                            <strong>{comanda.cliente_nome || "Não informado"}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.totalArea}>
                                    <div>
                                        <span>Valor da comanda</span>
                                        <strong>{formatarMoeda(comanda.valor_total)}</strong>
                                    </div>
                                    <CircleDollarSign size={24} />
                                </div>

                                <div className={styles.cardFooter}>
                                    <Link href={`/admin/comandas/${comanda.id}`} className={styles.manageButton}><ReceiptText size={17} /> Gerenciar comanda</Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
}