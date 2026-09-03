"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Ban, CreditCard, Loader2, ReceiptText } from "lucide-react";
import Swal from "sweetalert2";
import Can from "@/components/ui/can/Can";
import Table from "@/components/ui/table";
import { cancelarVenda, obterVendaPorId } from "@/services/vendas.service";
import styles from "./page.module.css";

const formatCurrency = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));
const formatDate = valor => valor ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor)) : "-";

export default function VendaDetalhesClient() {
    const params = useParams();
    const id = params?.id;
    const [venda, setVenda] = useState(null);
    const [itens, setItens] = useState([]);
    const [pagamentos, setPagamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelando, setCancelando] = useState(false);

    const carregar = useCallback(async () => {
        try {
            setLoading(true);
            const resultado = await obterVendaPorId(id);
            setVenda(resultado.data?.venda || null);
            setItens(resultado.data?.itens || []);
            setPagamentos(resultado.data?.pagamentos || []);
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Venda não encontrada", text: error.response?.data?.message || "Não foi possível carregar esta venda.", confirmButtonColor: "#ef4444" });
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) carregar();
    }, [id, carregar]);

    const handleCancelar = async () => {
        const resposta = await Swal.fire({
            title: `Cancelar Venda #${venda.id}?`,
            text: "O cancelamento criará os estornos no mesmo caixa da venda.",
            icon: "warning",
            input: "textarea",
            inputLabel: "Motivo do cancelamento",
            inputPlaceholder: "Ex: lançamento incorreto",
            inputAttributes: { maxlength: "255" },
            inputValidator: valor => !valor?.trim() || valor.trim().length < 3 ? "Informe um motivo com pelo menos 3 caracteres." : undefined,
            showCancelButton: true,
            confirmButtonText: "Cancelar e estornar",
            cancelButtonText: "Voltar",
            confirmButtonColor: "#ef4444"
        });

        if (!resposta.isConfirmed) return;

        try {
            setCancelando(true);
            await cancelarVenda(venda.id, resposta.value.trim());
            await Swal.fire({ icon: "success", title: "Venda cancelada", text: "Os estornos foram registrados no caixa.", confirmButtonColor: "#10b981" });
            await carregar();
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Não foi possível cancelar", text: error.response?.data?.message || "Erro ao cancelar a venda.", confirmButtonColor: "#ef4444" });
        } finally {
            setCancelando(false);
        }
    };

    if (loading) return <div className={styles.loading}><Loader2 size={22} className={styles.spinner} />Carregando venda...</div>;

    if (!venda) {
        return (
            <div className={styles.errorCard}>
                <ReceiptText size={34} />
                <strong>Venda indisponível</strong>
                <Link href="/admin/vendas">Voltar ao histórico</Link>
            </div>
        );
    }

    const resumoPagamento = pagamentos.length > 1 ? `${pagamentos.length} formas` : pagamentos[0]?.metodo_pagamento_nome || venda.metodo_pagamento;
    const totalItens = itens.reduce((total, item) => total + Number(item.quantidade), 0);
    const valorRecebidoExibido = pagamentos.length ? pagamentos.reduce((total, pagamento) => total + Number(pagamento.valor_recebido ?? pagamento.valor), 0) : Number(venda.valor_recebido || 0);
    const trocoExibido = pagamentos.length ? pagamentos.reduce((total, pagamento) => total + Number(pagamento.troco || 0), 0) : Number(venda.troco || 0);
    const pagamentosTabela = pagamentos.length > 0 ? pagamentos : [{ id: "resumo", metodo_pagamento_nome: venda.metodo_pagamento || "Não informado", valor: venda.valor_total, valor_recebido: venda.valor_recebido, troco: venda.troco }];

    const itemColumns = [
        { header: "Produto", accessor: "produto_nome", render: value => <strong className={styles.primaryText}>{value}</strong> },
        { header: "Qtd.", accessor: "quantidade" },
        { header: "Unitário", accessor: "preco_unitario", render: value => formatCurrency(value) },
        { header: "Observação", accessor: "observacao", render: value => <span className={styles.mutedText}>{value || "-"}</span> },
        { header: "Subtotal", accessor: "subtotal", className: styles.right, render: value => <strong>{formatCurrency(value)}</strong> }
    ];

    const paymentColumns = [
        {
            header: "Forma",
            accessor: "metodo_pagamento_nome",
            render: value => <span className={styles.paymentName}><CreditCard size={16} />{value || "Não informado"}</span>
        },
        { header: "Valor aplicado", accessor: "valor", render: value => formatCurrency(value) },
        { header: "Recebido", accessor: "valor_recebido", render: value => value !== null && value !== undefined ? formatCurrency(value) : "-" },
        { header: "Troco", accessor: "troco", render: value => Number(value || 0) > 0 ? formatCurrency(value) : "-" },
        { header: "Total", accessor: "valor", className: styles.right, render: value => <strong>{formatCurrency(value)}</strong> }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/admin/vendas" className={styles.backButton} aria-label="Voltar para o histórico de vendas">
                    <ArrowLeft size={24} />
                </Link>

                <div>
                    <h1 className={styles.title}>Venda rápida #{venda.id}</h1>
                    <p className={styles.subtitle}>Registro da venda realizada em {formatDate(venda.criado_em)}.</p>
                </div>
            </div>

            <div className={styles.statusBar}>
                <div className={styles.statusText}>
                    <strong className={`${styles.statusBadge} ${venda.status === "Cancelada" ? styles.statusCanceled : styles.statusDone}`}>{venda.status}</strong>
                    <span>{venda.status === "Cancelada" ? "Esta venda foi cancelada e permanece disponível apenas para conferência." : "Venda finalizada e registrada no histórico do caixa."}</span>
                </div>

                {venda.status === "Finalizada" && (
                    <Can perform="vendas.cancelar">
                        <button type="button" className={`${styles.statusButton} ${styles.dangerButton}`} onClick={handleCancelar} disabled={cancelando}>
                            {cancelando ? <Loader2 size={17} className={styles.spinner} /> : <Ban size={17} />}
                            Cancelar venda
                        </button>
                    </Can>
                )}
            </div>

            <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                    <span>Pagamento</span>
                    <strong>{resumoPagamento || "Não informado"}</strong>
                </div>
                <div className={styles.summaryItem}>
                    <span>Operador</span>
                    <strong>{venda.usuario_nome || "Não informado"}</strong>
                </div>
                <div className={styles.summaryItem}>
                    <span>Caixa</span>
                    <strong>#{venda.caixa_id}</strong>
                </div>
                <div className={styles.summaryItem}>
                    <span>Total</span>
                    <strong>{formatCurrency(venda.valor_total)}</strong>
                </div>
            </div>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Itens da venda</h2>
                        <span>{totalItens} item(ns)</span>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <Table columns={itemColumns} data={itens} isLoading={false} />
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Pagamentos</h2>
                        <span>{pagamentos.length || 1} lançamento(s)</span>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <Table columns={paymentColumns} data={pagamentosTabela} isLoading={false} />
                </div>

                <div className={styles.paymentSummary}>
                    <div><span>Valor recebido</span><strong>{formatCurrency(valorRecebidoExibido)}</strong></div>
                    <div><span>Troco total</span><strong>{formatCurrency(trocoExibido)}</strong></div>
                    <div><span>Total da venda</span><strong>{formatCurrency(venda.valor_total)}</strong></div>
                </div>
            </section>

            {(venda.observacao || venda.status === "Cancelada") && (
                <section className={styles.notes}>
                    {venda.observacao && <div><span>Observação</span><p>{venda.observacao}</p></div>}
                    {venda.status === "Cancelada" && <div><span>Cancelamento</span><p>{venda.motivo_cancelamento || "Motivo não informado."}</p><small>{formatDate(venda.cancelado_em)}</small></div>}
                </section>
            )}
        </div>
    );
}
