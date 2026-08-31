"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Filter, ReceiptText, Search } from "lucide-react";
import Swal from "sweetalert2";
import Pagination from "@/components/ui/pagination";
import Can from "@/components/ui/can/Can";
import { useMetodosPagamento } from "@/hooks/useMetodosPagamento";
import { listarVendas } from "@/services/vendas.service";
import styles from "./page.module.css";

const formatCurrency = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));
const formatDate = valor => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor));

export default function VendasClient() {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [busca, setBusca] = useState("");
    const [status, setStatus] = useState("");
    const [metodoPagamento, setMetodoPagamento] = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");

    const { metodosPagamento: metodos } = useMetodosPagamento();

    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                const resultado = await listarVendas({ pagina: page, limite: 20, termo: busca, status, metodoPagamento, dataInicio, dataFim });
                setVendas(resultado.data?.vendas || []);
                setTotalPages(resultado.data?.paginacao?.total_paginas || 1);
                setTotalRecords(resultado.data?.paginacao?.total_registros || 0);
            } catch (error) {
                setVendas([]);
                setTotalPages(1);
                setTotalRecords(0);
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

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <label className={styles.search}>
                    <Search size={17} />
                    <input
                        type="search"
                        aria-label="Buscar vendas"
                        value={busca}
                        placeholder="Buscar #ID, operador ou pagamento"
                        onChange={event => {
                            setBusca(event.target.value);
                            setPage(1);
                        }}
                    />
                </label>

                <label className={styles.filter}>
                    <Filter size={17} />
                    <select
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
                </label>

                <label className={styles.filter}>
                    <select
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
                </label>

                <label className={styles.dateFilter}>
                    <span>De</span>
                    <input
                        type="date"
                        value={dataInicio}
                        aria-label="Data inicial"
                        onChange={event => {
                            setDataInicio(event.target.value);
                            setPage(1);
                        }}
                    />
                </label>

                <label className={styles.dateFilter}>
                    <span>Até</span>
                    <input
                        type="date"
                        value={dataFim}
                        min={dataInicio || undefined}
                        aria-label="Data final"
                        onChange={event => {
                            setDataFim(event.target.value);
                            setPage(1);
                        }}
                    />
                </label>
            </div>

            <div className={styles.meta}>
                <span><strong>{totalRecords}</strong> {totalRecords === 1 ? "venda" : "vendas"}</span>
            </div>

            {loading ? (
                <div className={styles.skeletonList}>
                    {Array.from({ length: 6 }).map((_, index) => <div className={styles.skeleton} key={index} />)}
                </div>
            ) : vendas.length === 0 ? (
                <div className={styles.empty}>
                    <ReceiptText size={32} />
                    <strong>Nenhuma venda encontrada</strong>
                    <span>Ajuste os filtros ou realize uma nova Venda Rápida no Caixa.</span>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.salesTable}>
                        <thead>
                            <tr>
                                <th>Venda</th>
                                <th>Data</th>
                                <th>Operador</th>
                                <th>Pagamento</th>
                                <th>Status</th>
                                <th className={styles.right}>Total</th>
                                <th className={styles.actionColumn}>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendas.map(venda => (
                                <tr key={venda.id}>
                                    <td><strong>#{venda.id}</strong></td>
                                    <td>{formatDate(venda.criado_em)}</td>
                                    <td>{venda.usuario_nome || "Não informado"}</td>
                                    <td>{venda.metodo_pagamento || "Não informado"}</td>
                                    <td>
                                        <span className={`${styles.status} ${venda.status === "Cancelada" ? styles.statusCanceled : styles.statusDone}`}>
                                            {venda.status}
                                        </span>
                                    </td>
                                    <td className={styles.right}><strong className={styles.total}>{formatCurrency(venda.valor_total)}</strong></td>
                                    <td className={styles.actionColumn}>
                                        <Can perform="vendas.visualizar">
                                            <Link href={`/admin/vendas/${venda.id}`} className={styles.manage}>
                                                Detalhes
                                                <ChevronRight size={16} />
                                            </Link>
                                        </Can>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
}
