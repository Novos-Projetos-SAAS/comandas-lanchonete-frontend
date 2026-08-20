"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2, Plus, Trash2, XCircle } from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "@/hooks/useAuth";
import { listarProdutos } from "@/services/produtos.service";
import { adicionarItemComanda, listarItensComanda, removerItemComanda } from "@/services/itens-comanda.service";
import { cancelarComanda, fecharComanda, solicitarPagamento } from "@/services/comandas.service";

import styles from "./index.module.css";

const METODOS_PAGAMENTO = ["Dinheiro", "Pix", "Cartão de Débito", "Cartão de Crédito"];

const formatarMoeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

export default function ComandaMesa({ comanda, onAtualizar }) {
    const { hasPermission } = useAuth();

    const [itens, setItens] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [produtoId, setProdutoId] = useState("");
    const [quantidade, setQuantidade] = useState(1);
    const [observacao, setObservacao] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const podeAdicionar = hasPermission("itens_comanda.adicionar") && hasPermission("alimentos.listar");
    const podeRemover = hasPermission("itens_comanda.remover");
    const podeReceber = hasPermission("comandas.fechar");
    const podeCancelar = hasPermission("comandas.cancelar");

    const carregarItens = async () => {
        const response = await listarItensComanda(comanda.id);

        setItens(response?.data?.itens || []);
    };

    const carregarProdutos = async () => {
        if (!podeAdicionar) return;

        const response = await listarProdutos({ pagina: 1, ativo: "ativos", limite: 100 });

        setProdutos(response?.data?.produtos || []);
    };

    const carregarDados = async () => {
        try {
            setLoading(true);

            await carregarItens();

            if (comanda.status === "Aberta") await carregarProdutos();

        } catch (error) {
            console.error("Erro ao carregar comanda:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!comanda?.id) return;

        carregarDados();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [comanda?.id, comanda?.status]);

    const handleAdicionar = async (event) => {
        event.preventDefault();

        const produto = Number(produtoId);
        const qtd = Number(quantidade);

        if (!produto || !Number.isInteger(qtd) || qtd <= 0) {
            return Swal.fire({ title: "Dados inválidos", text: "Selecione um produto e informe uma quantidade válida.", icon: "warning", confirmButtonColor: "var(--brand-orange)" });
        }

        try {
            setActionLoading(true);

            await adicionarItemComanda({ comanda_id: comanda.id, produto_id: produto, quantidade: qtd, observacao: observacao.trim() || null });

            setProdutoId("");
            setQuantidade(1);
            setObservacao("");

            await carregarItens();
            await onAtualizar();

        } catch (error) {
            await Swal.fire({ title: "Não foi possível adicionar", text: error.response?.data?.message || "Erro ao adicionar produto.", icon: "error", confirmButtonColor: "var(--brand-red)" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemover = async (item) => {
        const confirmacao = await Swal.fire({
            title: "Remover item?",
            text: `${item.quantidade}x ${item.produto_nome} será removido da comanda.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Remover",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "var(--brand-red)"
        });

        if (!confirmacao.isConfirmed) return;

        try {
            setActionLoading(true);

            await removerItemComanda(item.id);
            await carregarItens();
            await onAtualizar();

        } catch (error) {
            await Swal.fire({ title: "Não foi possível remover", text: error.response?.data?.message || "Erro ao remover item.", icon: "error", confirmButtonColor: "var(--brand-red)" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSolicitarPagamento = async () => {
        const confirmacao = await Swal.fire({
            title: "Solicitar pagamento?",
            html: `A comanda será enviada para pagamento.<br><strong>Total: ${formatarMoeda(comanda.valor_total)}</strong>`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Solicitar pagamento",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "var(--brand-orange)"
        });

        if (!confirmacao.isConfirmed) return;

        try {
            setActionLoading(true);

            await solicitarPagamento(comanda.id);
            await onAtualizar();

        } catch (error) {
            await Swal.fire({ title: "Não foi possível solicitar", text: error.response?.data?.message || "Erro ao solicitar pagamento.", icon: "error", confirmButtonColor: "var(--brand-red)" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReceber = async () => {
        const opcoes = Object.fromEntries(METODOS_PAGAMENTO.map(metodo => [metodo, metodo]));

        const resultado = await Swal.fire({
            title: "Receber comanda",
            html: `Total a receber: <strong>${formatarMoeda(comanda.valor_total)}</strong>`,
            input: "select",
            inputOptions: opcoes,
            inputPlaceholder: "Selecione o pagamento",
            showCancelButton: true,
            confirmButtonText: "Confirmar pagamento",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "var(--brand-orange)",
            inputValidator: value => !value ? "Selecione o método de pagamento." : undefined
        });

        if (!resultado.isConfirmed) return;

        try {
            setActionLoading(true);

            await fecharComanda(comanda.id, resultado.value);

            await Swal.fire({ title: "Pagamento realizado!", text: `${formatarMoeda(comanda.valor_total)} recebido em ${resultado.value}.`, icon: "success", confirmButtonColor: "var(--brand-orange)" });

            await onAtualizar();

        } catch (error) {
            await Swal.fire({ title: "Pagamento não realizado", text: error.response?.data?.message || "Erro ao receber a comanda.", icon: "error", confirmButtonColor: "var(--brand-red)" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelar = async () => {
        const confirmacao = await Swal.fire({
            title: "Cancelar comanda?",
            text: "A comanda será cancelada e a mesa ficará livre.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Cancelar comanda",
            cancelButtonText: "Voltar",
            confirmButtonColor: "var(--brand-red)"
        });

        if (!confirmacao.isConfirmed) return;

        try {
            setActionLoading(true);

            await cancelarComanda(comanda.id);
            await Swal.fire({ title: "Comanda cancelada", icon: "success", confirmButtonColor: "var(--brand-orange)" });

            await onAtualizar();

        } catch (error) {
            await Swal.fire({ title: "Não foi possível cancelar", text: error.response?.data?.message || "Erro ao cancelar a comanda.", icon: "error", confirmButtonColor: "var(--brand-red)" });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <section className={styles.wrapper}><div className={styles.loading}><Loader2 size={20} className={styles.spinner} /> Carregando comanda...</div></section>;

    return (
        <section className={styles.wrapper}>
            <div className={styles.header}>
                <div>
                    <h2>Comanda #{comanda.id}</h2>
                    <p>{comanda.status}</p>
                </div>

                <strong className={styles.total}>{formatarMoeda(comanda.valor_total)}</strong>
            </div>

            {comanda.status === "Aberta" && podeAdicionar && (
                <form className={styles.addForm} onSubmit={handleAdicionar}>
                    <select value={produtoId} onChange={e => setProdutoId(e.target.value)} disabled={actionLoading} required>
                        <option value="">Selecione um produto</option>

                        {produtos.map(produto => (
                            <option key={produto.id} value={produto.id}>{produto.nome} — {formatarMoeda(produto.preco)}</option>
                        ))}
                    </select>

                    <input type="number" min="1" step="1" value={quantidade} onChange={e => setQuantidade(e.target.value)} disabled={actionLoading} />

                    <input type="text" maxLength="255" placeholder="Observação opcional" value={observacao} onChange={e => setObservacao(e.target.value)} disabled={actionLoading} />

                    <button type="submit" disabled={actionLoading}><Plus size={18} /> Adicionar</button>
                </form>
            )}

            <div className={styles.items}>
                {itens.length === 0 ? (
                    <div className={styles.empty}>Nenhum item lançado nesta comanda.</div>
                ) : (
                    itens.map(item => (
                        <div className={styles.item} key={item.id}>
                            <div>
                                <strong>{item.quantidade}x {item.produto_nome}</strong>
                                <span>{formatarMoeda(Number(item.preco_unitario) * Number(item.quantidade))}</span>
                                {item.observacao && <small>{item.observacao}</small>}
                            </div>

                            {comanda.status === "Aberta" && podeRemover && (
                                <button type="button" className={styles.removeButton} onClick={() => handleRemover(item)} disabled={actionLoading} title="Remover item">
                                    <Trash2 size={17} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className={styles.footer}>
                <div>
                    <span>Total da comanda</span>
                    <strong>{formatarMoeda(comanda.valor_total)}</strong>
                </div>

                <div className={styles.actions}>
                    {podeCancelar && <button type="button" className={styles.cancelButton} onClick={handleCancelar} disabled={actionLoading}><XCircle size={18} /> Cancelar</button>}

                    {comanda.status === "Aberta" && podeReceber && (
                        <button type="button" className={styles.paymentButton} onClick={handleSolicitarPagamento} disabled={actionLoading || Number(comanda.valor_total) <= 0}>
                            <CreditCard size={18} /> Solicitar pagamento
                        </button>
                    )}

                    {comanda.status === "Aguardando Pagamento" && podeReceber && (
                        <button type="button" className={styles.paymentButton} onClick={handleReceber} disabled={actionLoading}>
                            <CreditCard size={18} /> Receber {formatarMoeda(comanda.valor_total)}
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}