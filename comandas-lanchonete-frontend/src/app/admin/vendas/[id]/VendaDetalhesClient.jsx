"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Ban, Banknote, Loader2, ReceiptText, UserRound, WalletCards } from "lucide-react";
import Swal from "sweetalert2";
import Can from "@/components/ui/can/Can";
import { cancelarVenda, obterVendaPorId } from "@/services/vendas.service";
import styles from "./page.module.css";

const formatCurrency = valor => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));
const formatDate = valor => valor ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor)) : '-';

export default function VendaDetalhesClient() {
    const params = useParams();
    const id = params?.id;
    const [venda, setVenda] = useState(null);
    const [itens, setItens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelando, setCancelando] = useState(false);

    const carregar = useCallback(async () => {
        try {
            setLoading(true);
            const resultado = await obterVendaPorId(id);
            setVenda(resultado.data?.venda || null);
            setItens(resultado.data?.itens || []);
        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Venda não encontrada', text: error.response?.data?.message || 'Não foi possível carregar esta venda.', confirmButtonColor: '#ef4444' });
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
            text: 'O cancelamento criará um estorno no mesmo caixa da venda.',
            icon: 'warning',
            input: 'textarea',
            inputLabel: 'Motivo do cancelamento',
            inputPlaceholder: 'Ex: lançamento incorreto',
            inputAttributes: { maxlength: '255' },
            inputValidator: valor => !valor?.trim() || valor.trim().length < 3 ? 'Informe um motivo com pelo menos 3 caracteres.' : undefined,
            showCancelButton: true,
            confirmButtonText: 'Cancelar e estornar',
            cancelButtonText: 'Voltar',
            confirmButtonColor: '#ef4444'
        });
        if (!resposta.isConfirmed) return;

        try {
            setCancelando(true);
            await cancelarVenda(venda.id, resposta.value.trim());
            await Swal.fire({ icon: 'success', title: 'Venda cancelada', text: 'O estorno foi registrado no caixa.', confirmButtonColor: '#10b981' });
            await carregar();
        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Não foi possível cancelar', text: error.response?.data?.message || 'Erro ao cancelar a venda.', confirmButtonColor: '#ef4444' });
        } finally {
            setCancelando(false);
        }
    };

    if (loading) return <div className={styles.loading}><Loader2 size={30} className={styles.spinner} /><span>Carregando venda...</span></div>;
    if (!venda) return <div className={styles.notFound}><ReceiptText size={34} /><strong>Venda indisponível</strong><Link href="/admin/vendas">Voltar ao histórico</Link></div>;

    return (
        <div className={styles.container}>
            <div className={styles.topbar}><Link href="/admin/vendas" className={styles.back}><ArrowLeft size={17} />Voltar</Link>{venda.status === 'Finalizada' && <Can perform="vendas.cancelar"><button type="button" className={styles.cancelSale} onClick={handleCancelar} disabled={cancelando}>{cancelando ? <Loader2 size={17} className={styles.spinner} /> : <Ban size={17} />}Cancelar venda</button></Can>}</div>
            <div className={styles.header}><div><span>Venda rápida</span><h1>Venda #{venda.id}</h1><p>{formatDate(venda.criado_em)}</p></div><span className={`${styles.status} ${venda.status === 'Cancelada' ? styles.canceled : styles.done}`}>{venda.status}</span></div>

            <div className={styles.summary}>
                <div><WalletCards size={18} /><span>Pagamento<strong>{venda.metodo_pagamento}</strong></span></div>
                <div><UserRound size={18} /><span>Operador<strong>{venda.usuario_nome || 'Não informado'}</strong></span></div>
                <div><Banknote size={18} /><span>Caixa<strong>#{venda.caixa_id}</strong></span></div>
                <div><ReceiptText size={18} /><span>Total<strong>{formatCurrency(venda.valor_total)}</strong></span></div>
            </div>

            <section className={styles.card}>
                <div className={styles.cardHeader}><div><h2>Itens da venda</h2><span>{itens.reduce((total, item) => total + Number(item.quantidade), 0)} item(ns)</span></div></div>
                <div className={styles.tableWrapper}><table><thead><tr><th>Produto</th><th>Qtd.</th><th>Unitário</th><th>Observação</th><th className={styles.right}>Subtotal</th></tr></thead><tbody>{itens.map(item => <tr key={item.id}><td><strong>{item.produto_nome}</strong></td><td>{item.quantidade}</td><td>{formatCurrency(item.preco_unitario)}</td><td>{item.observacao || '-'}</td><td className={styles.right}><strong>{formatCurrency(item.subtotal)}</strong></td></tr>)}</tbody></table></div>
                <div className={styles.paymentSummary}><div><span>Valor recebido</span><strong>{formatCurrency(venda.valor_recebido)}</strong></div><div><span>Troco</span><strong>{formatCurrency(venda.troco)}</strong></div><div className={styles.grandTotal}><span>Total</span><strong>{formatCurrency(venda.valor_total)}</strong></div></div>
            </section>

            {(venda.observacao || venda.status === 'Cancelada') && <section className={styles.notes}>{venda.observacao && <div><span>Observação</span><p>{venda.observacao}</p></div>}{venda.status === 'Cancelada' && <div><span>Cancelamento</span><p>{venda.motivo_cancelamento || 'Motivo não informado.'}</p><small>{formatDate(venda.cancelado_em)}</small></div>}</section>}
        </div>
    );
}
