"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, PackageSearch, Plus, ShoppingBasket, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import InputForm from "@/components/ui/inputForm";
import { listarProdutos } from "@/services/produtos.service";
import { criarPedidoAdmin } from "@/services/pedidos.service";
import { calcularTotaisRascunho, criarRascunhoVazio } from "@/lib/admin-order-draft.mjs";
import { criarSessaoPedido, enviarPedidoComAtualizacao, formatarErroPedido } from "@/lib/admin-order-submit.mjs";
import { gerarIdempotencyKey } from "@/lib/public-session.mjs";
import styles from "./index.module.css";

const QUANTIDADES = Array.from({ length: 50 }, (_, index) => index + 1);
const ESTADO_SERVIDOR = { rascunho: criarRascunhoVazio(), enviando: false };
const estadoServidor = () => ESTADO_SERVIDOR;
// O acesso também fica protegido quando o navegador bloqueia localStorage.
const storage = {
    getItem: chave => globalThis.localStorage?.getItem(chave),
    setItem: (chave, valor) => globalThis.localStorage?.setItem(chave, valor),
    removeItem: chave => globalThis.localStorage?.removeItem(chave)
};
const formatarMoeda = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

export default function ProdutosComandaModal(props) {
    if (props.usuarioId == null || props.comandaId == null) return null;
    return <CarrinhoComanda key={props.usuarioId + ":" + props.comandaId} {...props} />;
}

function CarrinhoComanda({ aberto, onFechar, comandaId, usuarioId, statusComanda, onAtualizar }) {
    const [sessao] = useState(() => criarSessaoPedido({
        storage, usuarioId, comandaId, gerarChave: gerarIdempotencyKey, request: criarPedidoAdmin
    }));
    const { rascunho, enviando } = useSyncExternalStore(sessao.subscribe, sessao.getSnapshot, estadoServidor);
    const resumo = rascunho.itens;
    const { quantidade: totalUnidades, subtotal: totalResumo } = calcularTotaisRascunho(resumo);
    const bloqueado = enviando || statusComanda !== "Aberta";
    const [termo, setTermo] = useState("");
    const [pagina, setPagina] = useState(1);
    const [produtos, setProdutos] = useState([]);
    const [paginacao, setPaginacao] = useState({ total_paginas: 1 });
    const [quantidades, setQuantidades] = useState({});
    const [loading, setLoading] = useState(false);
    const [erroBusca, setErroBusca] = useState("");
    const [mostrarResumoMobile, setMostrarResumoMobile] = useState(false);
    const montado = useRef(false);
    const callbacks = useRef({ onAtualizar, onFechar });

    useEffect(() => {
        montado.current = true;
        return () => { montado.current = false; };
    }, []);
    useEffect(() => { callbacks.current = { onAtualizar, onFechar }; }, [onAtualizar, onFechar]);
    useEffect(() => { sessao.definirStatus(statusComanda); }, [sessao, statusComanda]);

    useEffect(() => {
        if (!aberto) return;
        let ativo = true;
        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                setErroBusca("");
                const response = await listarProdutos({ pagina, termo, ativo: "ativos", limite: 10, somenteComPreco: true });
                if (!ativo) return;
                setProdutos((response?.data?.produtos || []).filter(produto => Number(produto.preco) > 0));
                setPaginacao(response?.data?.paginacao || { total_paginas: 1 });
            } catch (error) {
                if (!ativo) return;
                setProdutos([]);
                setErroBusca(error.response?.data?.message || "Não foi possível carregar os produtos.");
            } finally {
                if (ativo) setLoading(false);
            }
        }, termo ? 350 : 0);
        return () => { ativo = false; clearTimeout(timer); };
    }, [aberto, termo, pagina]);

    useEffect(() => {
        if (!aberto) return;
        const handleKeyDown = event => {
            if (event.key === "Escape") {
                if (mostrarResumoMobile) setMostrarResumoMobile(false);
                else onFechar();
            }
        };
        const overflowAnterior = document.body.style.overflow;
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = overflowAnterior;
        };
    }, [aberto, mostrarResumoMobile, onFechar]);

    const handleAdicionar = produto => {
        try {
            sessao.adicionar(produto, Number(quantidades[produto.id] || 1));
            setQuantidades(anterior => ({ ...anterior, [produto.id]: 1 }));
        } catch (error) { toast.error(error.message); }
    };
    const handleEditar = (item, patch, campo) => {
        try { sessao.editar(item.linha_id, patch); }
        catch (error) {
            if (campo) campo.value = item.observacao || "";
            toast.error(error.message);
        }
    };
    const handleEnviar = async () => {
        try {
            await enviarPedidoComAtualizacao({
                sessao,
                onSucesso: () => { if (montado.current) toast.success("Pedido enviado para a cozinha."); },
                onAtualizar: () => callbacks.current.onAtualizar?.(),
                onAtualizacaoErro: () => { if (montado.current) toast.error("Pedido enviado. Não foi possível atualizar a comanda; recarregue a página."); },
                onFechar: () => { if (montado.current) callbacks.current.onFechar(); }
            });
        }
        catch (error) {
            if (montado.current) await Swal.fire({
                title: "Não foi possível enviar", text: formatarErroPedido(error),
                icon: "error", confirmButtonColor: "var(--brand-red)"
            });
        }
    };

    if (!aberto) return null;

    return (
        <div className={styles.overlay} onMouseDown={event => event.target === event.currentTarget && onFechar()}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-modal-produtos">
                <header className={styles.header}>
                    <div>
                        <h2 id="titulo-modal-produtos">{mostrarResumoMobile ? "Resumo do pedido" : "Adicionar produtos"}</h2>
                        <p>{mostrarResumoMobile ? "Confira o carrinho antes de enviar à cozinha." : "Busque produtos do cardápio e monte seu pedido."}</p>
                    </div>
                    <button type="button" className={styles.closeButton} onClick={onFechar} title="Fechar"><X size={22} /></button>
                </header>
                <div className={styles.desktopSearch + " " + (mostrarResumoMobile ? styles.hiddenMobile : "")}>
                    <div className={styles.searchArea}>
                        <InputForm name="buscar-produto-comanda" type="search" placeholder="Buscar produto, descrição ou categoria..."
                            value={termo} onChange={event => { setTermo(event.target.value); setPagina(1); }} autoFocus autoComplete="off" />
                    </div>
                </div>
                <div className={styles.content}>
                    <section className={styles.productsSection + " " + (mostrarResumoMobile ? styles.hiddenMobile : "")}>
                        <div className={styles.sectionHeader}><div><strong>Produtos disponíveis</strong></div></div>
                        <div className={styles.productsList}>
                            {loading ? (
                                <div className={styles.state}><Loader2 size={26} className={styles.spinner} /><span>Carregando produtos...</span></div>
                            ) : erroBusca ? (
                                <div className={styles.state}><PackageSearch size={32} /><strong>Não foi possível carregar</strong><span>{erroBusca}</span></div>
                            ) : produtos.length === 0 ? (
                                <div className={styles.state}><PackageSearch size={32} /><strong>Nenhum produto encontrado</strong><span>Tente pesquisar utilizando outro termo.</span></div>
                            ) : produtos.map(produto => (
                                <div className={styles.productRow} key={produto.id}>
                                    <div className={styles.productInfo}><strong>{produto.nome}</strong><span>{produto.categoria_nome || "Sem categoria"}</span></div>
                                    <strong className={styles.productPrice}>{formatarMoeda(produto.preco)}</strong>
                                    <select value={quantidades[produto.id] || 1} disabled={bloqueado} aria-label={"Quantidade de " + produto.nome}
                                        onChange={event => setQuantidades(anterior => ({ ...anterior, [produto.id]: Number(event.target.value) }))}>
                                        {QUANTIDADES.map(quantidade => <option key={quantidade} value={quantidade}>{quantidade}</option>)}
                                    </select>
                                    <button type="button" className={styles.addButton} onClick={() => handleAdicionar(produto)} disabled={bloqueado}>
                                        <Plus size={17} />Adicionar
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className={styles.pagination}>
                            <button type="button" onClick={() => setPagina(pagina - 1)} disabled={pagina <= 1 || loading} aria-label="Página anterior"><ChevronLeft size={18} /></button>
                            <span>Página <strong>{pagina}</strong> de <strong>{paginacao.total_paginas}</strong></span>
                            <button type="button" onClick={() => setPagina(pagina + 1)} disabled={pagina >= paginacao.total_paginas || loading} aria-label="Próxima página"><ChevronRight size={18} /></button>
                        </div>
                    </section>
                    <aside className={styles.summary + " " + (mostrarResumoMobile ? styles.summaryMobileVisible : "")} aria-busy={enviando}>
                        <div className={styles.summaryHeader}>
                            <div><ShoppingBasket size={20} /><strong>Resumo</strong></div><span>{totalUnidades} unidades</span>
                        </div>
                        <div className={styles.summaryItems}>
                            {resumo.length === 0 ? (
                                <div className={styles.emptySummary}><ShoppingBasket size={32} /><strong>Nenhum produto adicionado</strong><span>Os produtos do seu carrinho aparecerão aqui.</span></div>
                            ) : resumo.map(item => (
                                <div className={styles.summaryItem} key={item.linha_id}>
                                    <div className={styles.summaryItemInfo}>
                                        <strong>{item.nome}</strong>
                                        <span>Subtotal estimado: {formatarMoeda(calcularTotaisRascunho([item]).subtotal)}</span>
                                    </div>
                                    <button type="button" onClick={() => sessao.remover(item.linha_id)} disabled={bloqueado} title={"Remover " + item.nome + " do carrinho"}><Trash2 size={16} /></button>
                                    <label className={styles.lineEditor}>Quantidade
                                        <select value={item.quantidade} disabled={bloqueado} onChange={event => handleEditar(item, { quantidade: Number(event.target.value) })}>
                                            {QUANTIDADES.map(quantidade => <option key={quantidade} value={quantidade}>{quantidade}</option>)}
                                        </select>
                                    </label>
                                    <label className={styles.observation}>Observação
                                        <textarea defaultValue={item.observacao || ""} maxLength={255} rows={2} disabled={bloqueado}
                                            placeholder="Ex.: sem cebola" onChange={event => handleEditar(item, { observacao: event.target.value }, event.currentTarget)} />
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className={styles.summaryFooter}>
                            <div className={styles.summaryTotal}><span>Valor estimado</span><strong>{formatarMoeda(totalResumo)}</strong></div>
                            <p className={styles.estimateNote}>{totalUnidades} unidades. O preço final será atualizado no envio.</p>
                            <button type="button" className={styles.backProductsButton} onClick={() => setMostrarResumoMobile(false)}><ArrowLeft size={17} />Voltar aos produtos</button>
                            <button type="button" className={styles.finishButton} onClick={handleEnviar} disabled={!resumo.length || bloqueado}>
                                {enviando && <Loader2 size={18} className={styles.spinner} />}{enviando ? "Enviando..." : "Enviar pedido"}
                            </button>
                        </div>
                    </aside>
                </div>
                {!mostrarResumoMobile && (
                    <div className={styles.mobileFooter}>
                        <button type="button" onClick={() => setMostrarResumoMobile(true)}><ShoppingBasket size={19} />Ver resumo ({totalUnidades}) · {formatarMoeda(totalResumo)}</button>
                    </div>
                )}
            </div>
        </div>
    );
}
