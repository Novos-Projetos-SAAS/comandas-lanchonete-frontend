"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronDown, CircleDot, CreditCard, Hash, Loader2, Plus, ShoppingBasket, Trash2, UserRound, Utensils, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/hooks/useAuth";
import { obterComandaPorId, solicitarPagamento, fecharComanda, cancelarComanda } from "@/services/comandas.service";
import { listarItensComanda, removerItemComanda } from "@/services/itens-comanda.service";
import { listarMetodosPagamentoAtivos } from "@/services/metodos-pagamento.service";
import ProdutosComandaModal from "@/components/modals/produtosComanda";
import styles from "./page.module.css";

const LIMITE_ITENS = 4;
const formatarMoeda = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

export default function ComandaDetalhesClient() {
    const params = useParams();
    const { hasPermission } = useAuth();

    const [comanda, setComanda] = useState(null);
    const [itens, setItens] = useState([]);
    const [metodosPagamento, setMetodosPagamento] = useState([]);
    const [modalProdutosAberto, setModalProdutosAberto] = useState(false);
    const [mostrarTodosItens, setMostrarTodosItens] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [erro, setErro] = useState("");

    const id = params?.id;
    const podeAdicionar = hasPermission("itens_comanda.adicionar") && hasPermission("alimentos.listar");
    const podeRemover = hasPermission("itens_comanda.remover");
    const podeReceber = hasPermission("comandas.fechar");
    const podeCancelar = hasPermission("comandas.cancelar");
    const temMaisItens = itens.length > LIMITE_ITENS;
    const itensVisiveis = mostrarTodosItens ? itens : itens.slice(0, LIMITE_ITENS);
    const itemPreview = !mostrarTodosItens && temMaisItens ? itens[LIMITE_ITENS] : null;

    const statusClasse = {
        Aberta: styles.statusOpen,
        "Aguardando Pagamento": styles.statusWaiting,
        Paga: styles.statusPaid,
        Cancelada: styles.statusCanceled
    }[comanda?.status] || styles.statusDefault;

    const carregarComanda = async () => {
        const response = await obterComandaPorId(id);
        const dados = response?.data?.comanda || response?.comanda;
        setComanda(dados);
        return dados;
    };

    const carregarItens = async () => {
        const response = await listarItensComanda(id);
        const dados = response?.data?.itens || response?.itens || [];
        setItens(dados);
        return dados;
    };

    const carregarDados = async () => {
        try {
            setLoading(true);
            setErro("");
            await carregarComanda();
            await carregarItens();
        } catch (error) {
            setErro(error.response?.data?.message || "Não foi possível carregar a comanda.");
        } finally {
            setLoading(false);
        }
    };

    const atualizar = async () => {
        await carregarComanda();
        await carregarItens();
    };

    const carregarMetodosPagamento = async () => {
        if (metodosPagamento.length) return metodosPagamento;
        const response = await listarMetodosPagamentoAtivos();
        const metodos = response?.data?.metodos || response?.metodos || [];
        setMetodosPagamento(metodos);
        return metodos;
    };

    useEffect(() => {
        if (id) carregarDados();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleRemover = async item => {
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
            await atualizar();
        } catch (error) {
            await Swal.fire({ title: "Erro ao remover", text: error.response?.data?.message || "Não foi possível remover o item.", icon: "error", confirmButtonColor: "var(--brand-red)" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSolicitarPagamento = async () => {
        const confirmacao = await Swal.fire({
            title: "Solicitar pagamento?",
            html: `A comanda ficará bloqueada para novos itens.<br><strong>Total: ${formatarMoeda(comanda.valor_total)}</strong>`,
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
            await atualizar();
        } catch (error) {
            await Swal.fire({ title: "Não foi possível solicitar", text: error.response?.data?.message || "Erro ao solicitar pagamento.", icon: "error", confirmButtonColor: "var(--brand-red)" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReceber = async () => {
        try {
            const metodos = await carregarMetodosPagamento();

            if (!metodos.length) {
                await Swal.fire({ title: "Sem métodos de pagamento", text: "Nenhum método de pagamento ativo foi encontrado.", icon: "warning", confirmButtonColor: "var(--brand-orange)" });
                return;
            }

            const opcoes = Object.fromEntries(metodos.map(metodo => [metodo.nome, metodo.nome]));

            const resultado = await Swal.fire({
                title: "Receber comanda",
                html: `Valor total: <strong>${formatarMoeda(comanda.valor_total)}</strong>`,
                input: "select",
                inputOptions: opcoes,
                inputPlaceholder: "Selecione o método",
                showCancelButton: true,
                confirmButtonText: "Confirmar pagamento",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "var(--brand-orange)",
                inputValidator: value => !value ? "Selecione um método de pagamento." : undefined
            });

            if (!resultado.isConfirmed) return;

            setActionLoading(true);
            await fecharComanda(comanda.id, resultado.value);

            await Swal.fire({ title: "Pagamento realizado!", text: `${formatarMoeda(comanda.valor_total)} recebido em ${resultado.value}.`, icon: "success", confirmButtonColor: "var(--brand-orange)" });

            await atualizar();
        } catch (error) {
            await Swal.fire({ title: "Pagamento não realizado", text: error.response?.data?.message || "Erro ao receber a comanda.", icon: "error", confirmButtonColor: "var(--brand-red)" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelar = async () => {
        const confirmacao = await Swal.fire({
            title: "Cancelar comanda?",
            text: "A comanda será cancelada e a mesa será liberada.",
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
            await atualizar();
        } catch (error) {
            await Swal.fire({ title: "Erro ao cancelar", text: error.response?.data?.message || "Não foi possível cancelar a comanda.", icon: "error", confirmButtonColor: "var(--brand-red)" });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className={styles.loading}><Loader2 size={24} className={styles.spinner} /> Carregando comanda...</div>;

    if (erro || !comanda) {
        return (
            <div className={styles.error}>
                <strong>{erro || "Comanda não encontrada."}</strong>
                <Link href="/admin/comandas">Voltar para comandas</Link>
            </div>
        );
    }

    const renderItem = (item, preview = false) => (
        <div className={`${styles.itemRow} ${preview ? styles.previewItem : ""}`} key={item.id}>
            <div className={styles.itemQuantity}>{item.quantidade}x</div>

            <div className={styles.itemInfo}>
                <strong>{item.produto_nome}</strong>
                <span>{item.observacao || "Sem observação"} • {item.status_pedido}</span>
            </div>

            <div className={styles.itemPrice}>
                <span>{formatarMoeda(item.preco_unitario)} cada</span>
                <strong>{formatarMoeda(Number(item.preco_unitario) * Number(item.quantidade))}</strong>
            </div>

            {comanda.status === "Aberta" && podeRemover && !preview && (
                <button type="button" className={styles.removeButton} onClick={() => handleRemover(item)} disabled={actionLoading}><Trash2 size={18} /></button>
            )}
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <Link href="/admin/comandas" className={styles.backButton}><ArrowLeft size={21} /></Link>

                <div className={styles.titleArea}>
                    <div className={styles.titleLine}>
                        <h1>Comanda <span>#{comanda.id}</span></h1>
                    </div>
                </div>
            </div>

            <div className={styles.summaryGrid}>
                <div className={`${styles.summaryCard} ${styles.mesaCard}`}><Hash size={22} /><span>Mesa</span><strong>{comanda.numero_mesa}</strong></div>

                <div className={`${styles.summaryCard} ${styles.itensCard}`}><ShoppingBasket size={22} /><span>Itens</span><strong>{itens.reduce((total, item) => total + Number(item.quantidade), 0)}</strong></div>

                <div className={`${styles.summaryCard} ${styles.clienteCard}`}><UserRound size={22} /><span>Cliente</span><strong>{comanda.cliente_nome || "Não informado"}</strong></div>

                <div className={`${styles.summaryCard} ${styles.statusCard} ${statusClasse}`}><CircleDot size={22} /><span>Status</span><strong>{comanda.status}</strong></div>
            </div>

            {comanda.status === "Aberta" && podeAdicionar && (
                <section className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <div><h2>Pesquise produtos do cardápio e inclua novos itens na comanda.</h2></div>

                        <button type="button" className={styles.openProductsButton} onClick={() => setModalProdutosAberto(true)} disabled={actionLoading}><Plus size={18} /> Adicionar produtos</button>
                    </div>
                </section>
            )}

            <section className={styles.section}>
                <div className={styles.sectionTitle}>
                    <div>
                        <h2>Itens da comanda</h2>
                        <p>Produtos lançados durante este atendimento.</p>
                    </div>
                </div>

                <div className={`${styles.itemsWrapper} ${temMaisItens && !mostrarTodosItens ? styles.itemsWrapperExpandable : ""}`}>
                    <div className={styles.itemsList}>
                        {itens.length === 0 ? (
                            <div className={styles.emptyItems}><Utensils size={30} /><span>Nenhum item lançado.</span></div>
                        ) : (
                            <>
                                {itensVisiveis.map(item => renderItem(item))}
                                {itemPreview && <div className={styles.previewWrapper}>{renderItem(itemPreview, true)}</div>}
                            </>
                        )}
                    </div>

                    {temMaisItens && !mostrarTodosItens && (
                        <div className={styles.previewFade}>
                            <button type="button" className={styles.expandItemsButton} onClick={() => setMostrarTodosItens(true)} title={`Mostrar mais ${itens.length - LIMITE_ITENS} itens`}>
                                <ChevronDown size={22} />
                            </button>
                        </div>
                    )}
                </div>

                {temMaisItens && mostrarTodosItens && (
                    <button type="button" className={styles.showLessButton} onClick={() => setMostrarTodosItens(false)}>Mostrar menos</button>
                )}
            </section>

            <section className={styles.checkout}>
                <div className={styles.checkoutTotal}>
                    <span>Total da comanda</span>
                    <strong>{formatarMoeda(comanda.valor_total)}</strong>
                </div>

                <div className={styles.actions}>
                    {podeCancelar && ["Aberta", "Aguardando Pagamento"].includes(comanda.status) && <button type="button" className={styles.cancelButton} onClick={handleCancelar} disabled={actionLoading}><XCircle size={19} /> Cancelar comanda</button>}
                    {comanda.status === "Aberta" && podeReceber && <button type="button" className={styles.paymentButton} onClick={handleSolicitarPagamento} disabled={actionLoading || Number(comanda.valor_total) <= 0}><CreditCard size={19} /> Solicitar pagamento</button>}
                    {comanda.status === "Aguardando Pagamento" && podeReceber && <button type="button" className={styles.paymentButton} onClick={handleReceber} disabled={actionLoading}><CreditCard size={19} /> Receber {formatarMoeda(comanda.valor_total)}</button>}
                </div>
            </section>

            <ProdutosComandaModal aberto={modalProdutosAberto} onFechar={() => setModalProdutosAberto(false)} comandaId={comanda.id} onAtualizar={atualizar} />
        </div>
    );
}