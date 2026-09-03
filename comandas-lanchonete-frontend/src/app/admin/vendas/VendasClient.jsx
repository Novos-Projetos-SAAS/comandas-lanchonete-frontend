"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, Filter, MoreVertical, Search } from "lucide-react";
import Swal from "sweetalert2";
import Table from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import Can from "@/components/ui/can/Can";
import { useMetodosPagamento } from "@/hooks/useMetodosPagamento";
import { listarVendas } from "@/services/vendas.service";
import styles from "./VendasClient.module.css";

const formatCurrency = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));
const formatDate = valor => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor));

export default function VendasClient() {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [busca, setBusca] = useState("");
    const [status, setStatus] = useState("");
    const [metodoPagamento, setMetodoPagamento] = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [menuOpenId, setMenuOpenId] = useState(null);

    const { metodosPagamento: metodos } = useMetodosPagamento();

    useEffect(() => {
        const closeMenu = () => setMenuOpenId(null);
        window.addEventListener("click", closeMenu);
        window.addEventListener("scroll", closeMenu, true);

        return () => {
            window.removeEventListener("click", closeMenu);
            window.removeEventListener("scroll", closeMenu, true);
        };
    }, []);

    const toggleMenu = (event, id) => {
        event.stopPropagation();
        setMenuOpenId(menuOpenId === id ? null : id);
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                const resultado = await listarVendas({ pagina: page, limite: 20, termo: busca, status, metodoPagamento, dataInicio, dataFim });
                setVendas(resultado.data?.vendas || []);
                setTotalPages(resultado.data?.paginacao?.total_paginas || 1);
            } catch (error) {
                setVendas([]);
                setTotalPages(1);
                await Swal.fire({
                    icon: "error",
                    title: "Não foi possível carregar as vendas",
                    text: error.response?.data?.message || "Tente novamente.",
                    confirmButtonColor: "#ef4444"
                });
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [page, busca, status, metodoPagamento, dataInicio, dataFim]);

    const columns = [
        {
            header: "Venda",
            accessor: "id",
            render: (_, venda) => <strong>#{venda.id}</strong>
        },
        {
            header: "Data",
            accessor: "criado_em",
            render: valor => formatDate(valor)
        },
        {
            header: "Operador",
            accessor: "usuario_nome",
            render: valor => valor || "Não informado"
        },
        {
            header: "Pagamento",
            accessor: "metodo_pagamento",
            render: valor => valor || "Não informado"
        },
        {
            header: "Status",
            accessor: "status",
            render: valor => (
                <span className={`${styles.status} ${valor === "Cancelada" ? styles.statusCanceled : styles.statusDone}`}>
                    {valor}
                </span>
            )
        },
        {
            header: "Total",
            accessor: "valor_total",
            className: styles.right,
            render: valor => <strong className={styles.total}>{formatCurrency(valor)}</strong>
        },
        {
            header: "Ações",
            accessor: "id",
            className: styles.actionColumn,
            render: (_, venda) => (
                <>
                    <div className={styles.desktopActions}>
                        <Can perform="vendas.visualizar">
                            <Link href={`/admin/vendas/${venda.id}`} className={`${styles.actionBtn} ${styles.viewBtn}`} title="Visualizar">
                                <Eye size={18} />
                            </Link>
                        </Can>
                    </div>

                    <div className={styles.mobileActions}>
                        <button className={styles.actionBtn} onClick={event => toggleMenu(event, venda.id)} aria-expanded={menuOpenId === venda.id} title="Abrir ações">
                            <MoreVertical size={20} />
                        </button>

                        {menuOpenId === venda.id && (
                            <div className={styles.dropdownMenu} onClick={event => event.stopPropagation()}>
                                <Can perform="vendas.visualizar">
                                    <Link href={`/admin/vendas/${venda.id}`} className={styles.dropdownItem}>
                                        <Eye size={16} className={styles.viewBtn} /> Visualizar
                                    </Link>
                                </Can>
                            </div>
                        )}
                    </div>
                </>
            )
        }
    ];

    return (
        <div className={styles.wrapper}>
            <div className={styles.actionsBar}>
                <div className={styles.filtersGroup}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            type="search"
                            aria-label="Buscar vendas"
                            value={busca}
                            placeholder="Buscar vendas..."
                            onChange={event => {
                                setBusca(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <div className={styles.selectWrapper}>
                        <Filter size={18} className={styles.filterIcon} />
                        <select
                            className={styles.statusSelect}
                            aria-label="Filtrar vendas por status"
                            value={status}
                            onChange={event => {
                                setStatus(event.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">Todos os status</option>
                            <option value="Finalizada">Finalizadas</option>
                            <option value="Cancelada">Canceladas</option>
                        </select>
                    </div>

                    <div className={styles.selectWrapper}>
                        <Filter size={18} className={styles.filterIcon} />
                        <select
                            className={styles.statusSelect}
                            aria-label="Filtrar vendas por pagamento"
                            value={metodoPagamento}
                            onChange={event => {
                                setMetodoPagamento(event.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">Todos os pagamentos</option>
                            {metodos.map(metodo => <option key={metodo.id} value={metodo.nome}>{metodo.nome}</option>)}
                        </select>
                    </div>

                    <div className={styles.dateWrapper}>
                        <span className={styles.dateLabel}>De</span>
                        <input
                            className={styles.dateInput}
                            type="date"
                            value={dataInicio}
                            aria-label="Data inicial"
                            onChange={event => {
                                setDataInicio(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <div className={styles.dateWrapper}>
                        <span className={styles.dateLabel}>Até</span>
                        <input
                            className={styles.dateInput}
                            type="date"
                            value={dataFim}
                            min={dataInicio || undefined}
                            aria-label="Data final"
                            onChange={event => {
                                setDataFim(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            <Table columns={columns} data={vendas} isLoading={loading} />

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
}
