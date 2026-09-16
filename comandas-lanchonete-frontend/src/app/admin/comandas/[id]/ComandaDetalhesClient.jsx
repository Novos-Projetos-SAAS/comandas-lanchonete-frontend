"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronDown, CircleDot, CreditCard, Hash, Loader2, Plus, ReceiptText, ShoppingBasket, Trash2, UserRound, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/hooks/useAuth";
import { obterComandaPorId, solicitarPagamento, fecharComanda, cancelarComanda } from "@/services/comandas.service";
import { listarItensComanda, removerItemComanda } from "@/services/itens-comanda.service";
import { useMetodosPagamento } from "@/hooks/useMetodosPagamento";
import { obterSocket } from "@/lib/socket";
import { criarCoordenadorComanda, estadoVisualComanda, normalizarDadosComanda } from "@/lib/comanda-details-loader.mjs";
import ProdutosComandaModal from "@/components/modals/produtosComanda";
import styles from "./page.module.css";

const LIMITE_ITENS = 4;
const formatarMoeda = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

export default function ComandaDetalhesClient() {
    const params = useParams();
    const { user, hasPermission } = useAuth();
    const [comanda, setComanda] = useState(null);
    const [itens, setItens] = useState([]);
    const [modalProdutosAberto, setModalProdutosAberto] = useState(false);
    const [mostrarTodosItens, setMostrarTodosItens] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [erro, setErro] = useState("");
    const { metodosPagamento, carregarMetodosPagamento } = useMetodosPagamento({ carregarAutomaticamente: false });

    const id = params?.id;
    const [carregador] = useState(() => criarCoordenadorComanda({
            carregar: async comandaId => {
                const [resComanda, resItens] = await Promise.all([obterComandaPorId(comandaId), listarItensComanda(comandaId)]);
                return {
                    comanda: resComanda?.data?.comanda || resComanda?.comanda,
                    itens: resItens?.data?.itens || resItens?.itens || []
                };
            },
            aoIniciar: () => { setLoading(true); setErro(""); },
            aoAplicar: dados => {
                const normalizados = normalizarDadosComanda(dados);
                setComanda(normalizados.comanda);
                setItens(normalizados.itens);
                setErro(normalizados.erro);
            },
            aoErro: error => setErro(error.response?.data?.message || "Não foi possível carregar a comanda."),
            aoFinalizar: () => setLoading(false)
    }));
    const podeAdicionar = hasPermission("itens_comanda.adicionar") && hasPermission("alimentos.listar");
    const podeRemover = hasPermission("itens_comanda.remover");
    const podeReceber = hasPermission("comandas.fechar");
    const podeCancelar = hasPermission("comandas.cancelar");
    const totalItens = itens.reduce((total, item) => total + Number(item.quantidade), 0);
    const temMaisItens = itens.length > LIMITE_ITENS;
    const itensVisiveis = mostrarTodosItens ? itens : itens.slice(0, LIMITE_ITENS);
    const itemPreview = !mostrarTodosItens && temMaisItens ? itens[LIMITE_ITENS] : null;

    const statusClasse = {
        Aberta: styles.statusOpen,
        "Aguardando Pagamento": styles.statusWaiting,
        Paga: styles.statusPaid,
        Cancelada: styles.statusCanceled
    }[comanda?.status] || styles.statusDefault;

    const atualizar = useCallback(() => {
        if (!id) return Promise.resolve();
        return carregador.iniciar(id, { preservarConteudo: true });
    }, [carregador, id]);

    useEffect(() => {
        if (!id) return undefined;
        const carga = carregador.iniciar(id);
        carga.catch(() => {});
        return () => carregador.invalidar();
    }, [carregador, id]);

    useEffect(() => {
        if (!id) return undefined;

        const socket = obterSocket();
        if (!socket) return undefined;

        const entrarNaSala = () => {
            socket.emit("entrar_sala", "comandas");
        };

        const handleComandaAtualizada = dados => {
            const comandaId = dados?.id ?? dados?.comanda_id;

            if (!comandaId || String(comandaId) !== String(id)) return;

            atualizar().catch(() => {});
        };

        socket.on("connect", entrarNaSala);
        socket.on("comanda_atualizada", handleComandaAtualizada);

        if (!socket.connected) {
            socket.connect();
        } else {
            entrarNaSala();
        }

        return () => {
            socket.off("connect", entrarNaSala);
            socket.off("comanda_atualizada", handleComandaAtualizada);
        };
    }, [id, atualizar]);

    const handleRemover = async item => {
        const confirmacao = await Swal.fire({
            title: "Remover item?",
            text: `${item.quantidade}x ${item.produto_nome} será removido da comanda.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Remover",
            cancelButtonText: "Voltar",
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
            html: `Depois disso não será possível adicionar novos itens.<br><br><strong>Total: ${formatarMoeda(comanda.valor_total)}</strong>`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Solicitar pagamento",
            cancelButtonText: "Voltar",
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
            const metodos = metodosPagamento.length ? metodosPagamento : await carregarMetodosPagamento();

            if (!metodos.length) {
                await Swal.fire({ title: "Sem métodos de pagamento", text: "Nenhum método de pagamento ativo foi encontrado.", icon: "warning", confirmButtonColor: "var(--brand-orange)" });
                return;
            }

            const opcoes = Object.fromEntries(metodos.map(metodo => [metodo.nome, metodo.nome]));

            const resultado = await Swal.fire({
                title: "Receber comanda",
                html: `Total a receber:<br><strong style="font-size:1.5rem">${formatarMoeda(comanda.valor_total)}</strong>`,
                input: "select",
                inputOptions: opcoes,
                inputPlaceholder: "Selecione o método",
                showCancelButton: true,
                confirmButtonText: "Confirmar pagamento",
                cancelButtonText: "Voltar",
                confirmButtonColor: "var(--brand-orange)",
                inputValidator: value => !value ? "Selecione um método de pagamento." : undefined
            });

            if (!resultado.isConfirmed) return;

            setActionLoading(true);
            await fecharComanda(comanda.id, resultado.value);

            await Swal.fire({
                title: "Pagamento realizado!",
                text: `${formatarMoeda(comanda.valor_total)} recebido em ${resultado.value}.`,
                icon: "success",
                confirmButtonColor: "var(--brand-orange)"
            });

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

    const comandaAtual = comanda && String(comanda.id) === String(id);
    const estadoVisual = estadoVisualComanda({ loading, erro, comandaAtual });
    if (estadoVisual === "loading") return <div className={styles.loading}><Loader2 size={24} className={styles.spinner} /> Carregando comanda...</div>;

    if (estadoVisual === "erro" || !comanda) {
        return (
            <div className={styles.error}>
                <strong>{erro || "Comanda não encontrada."}</strong>
                <Link href="/admin/comandas">Voltar para comandas</Link>
            </div>
        );
    }

    const renderItem = (item, preview = false) => (
        <div className={`${styles.itemRow} ${preview ? styles.previewItem : ""}`} key={item.id}>
            <div className={styles.quantity}>{item.quantidade}x</div>

            <div className={styles.itemContent}>
                <div className={styles.itemTop}>
                    <strong>{item.produto_nome}</strong>
                    <strong>{formatarMoeda(Number(item.preco_unitario) * Number(item.quantidade))}</strong>
                </div>

                <div className={styles.itemBottom}>
                    <span>{formatarMoeda(item.preco_unitario)} cada</span>
                    {item.observacao && <span>• {item.observacao}</span>}
                    <span>• {item.status_pedido}</span>
                </div>
            </div>

            {comanda.status === "Aberta" && podeRemover && !preview && (
                <button type="button" className={styles.removeButton} onClick={() => handleRemover(item)} disabled={actionLoading} title="Remover item">
                    <Trash2 size={17} />
                </button>
            )}
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <Link href="/admin/comandas" className={styles.backButton} title="Voltar">
                    <ArrowLeft size={21} />
                </Link>
                <h2 className={styles.topTitle}> Comanda </h2>
            </div>

            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <Hash size={20} />
                    <div>
                        <span>Mesa</span>
                        <strong>{comanda.numero_mesa}</strong>
                    </div>
                </div>

                <div className={styles.summaryCard}>
                    <ReceiptText size={20} />
                    <div>
                        <span>Comanda</span>
                        <strong>#{comanda.id}</strong>
                    </div>
                </div>

                <div className={`${styles.summaryCard} ${styles.statusCard}`}>
                    <CircleDot size={20} className={statusClasse} />
                    <div>
                        <span>Status</span>
                        <strong className={statusClasse}>{comanda.status}</strong>
                    </div>
                </div>

                <div className={styles.summaryCard}>
                    <UserRound size={20} />
                    <div>
                        <span>Cliente</span>
                        <strong>{comanda.cliente_nome || "Não informado"}</strong>
                    </div>
                </div>
            </div>

            <div className={styles.layout}>
                <main className={styles.order}>
                    <div className={styles.orderHeader}>
                        <div>
                            <h2>Pedido</h2>
                            <span>{totalItens} {totalItens === 1 ? "item" : "itens"}</span>
                        </div>

                        {comanda.status === "Aberta" && podeAdicionar && (
                            <button type="button" className={styles.addButton} onClick={() => setModalProdutosAberto(true)} disabled={actionLoading}>
                                <Plus size={18} />
                                Adicionar produtos
                            </button>
                        )}
                    </div>

                    <div className={`${styles.itemsWrapper} ${temMaisItens && !mostrarTodosItens ? styles.itemsWrapperExpandable : ""}`}>
                        <div className={styles.itemsList}>
                            {itens.length === 0 ? (
                                <div className={styles.emptyItems}>
                                    <ShoppingBasket size={32} />
                                    <strong>Nenhum produto ainda</strong>
                                    <span>Comece adicionando produtos à comanda.</span>

                                    {comanda.status === "Aberta" && podeAdicionar && (
                                        <button type="button" onClick={() => setModalProdutosAberto(true)}>
                                            <Plus size={17} />
                                            Adicionar produto
                                        </button>
                                    )}
                                </div>
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
                        <button type="button" className={styles.showLessButton} onClick={() => setMostrarTodosItens(false)}>
                            Mostrar menos
                        </button>
                    )}
                </main>

                <aside className={styles.checkout}>
                    <div className={styles.checkoutTitle}>
                        <ReceiptText size={19} />
                        <strong>Resumo</strong>
                    </div>

                    <div className={styles.resumeRows}>
                        <div>
                            <span>Mesa</span>
                            <strong>{comanda.numero_mesa}</strong>
                        </div>

                        <div>
                            <span>Quantidade</span>
                            <strong>{totalItens} {totalItens === 1 ? "item" : "itens"}</strong>
                        </div>
                    </div>

                    <div className={styles.total}>
                        <span>Total da comanda</span>
                        <strong>{formatarMoeda(comanda.valor_total)}</strong>
                    </div>

                    <div className={styles.actions}>
                        {comanda.status === "Aberta" && podeReceber && (
                            <button type="button" className={styles.paymentButton} onClick={handleSolicitarPagamento} disabled={actionLoading || Number(comanda.valor_total) <= 0}>
                                <CreditCard size={19} />
                                Solicitar pagamento
                            </button>
                        )}

                        {comanda.status === "Aguardando Pagamento" && podeReceber && (
                            <button type="button" className={styles.paymentButton} onClick={handleReceber} disabled={actionLoading}>
                                <CreditCard size={19} />
                                Receber {formatarMoeda(comanda.valor_total)}
                            </button>
                        )}

                        {podeCancelar && ["Aberta", "Aguardando Pagamento"].includes(comanda.status) && (
                            <button type="button" className={styles.cancelButton} onClick={handleCancelar} disabled={actionLoading}>
                                <XCircle size={18} />
                                Cancelar comanda
                            </button>
                        )}
                    </div>
                </aside>
            </div>

            <ProdutosComandaModal aberto={modalProdutosAberto} onFechar={() => setModalProdutosAberto(false)} comandaId={comanda.id} usuarioId={user?.id} statusComanda={comanda.status} onAtualizar={atualizar} />
        </div>
    );
}
