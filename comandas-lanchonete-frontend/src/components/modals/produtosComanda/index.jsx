"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Loader2, PackageSearch, Plus, ShoppingBasket, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import InputForm from "@/components/ui/inputForm";
import { listarProdutos } from "@/services/produtos.service";
import { adicionarItemComanda, removerItemComanda } from "@/services/itens-comanda.service";
import styles from "./index.module.css";

const QUANTIDADES = Array.from({ length: 8 }, (_, index) => index + 1);
const formatarMoeda = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

export default function ProdutosComandaModal({ aberto, onFechar, comandaId, onAtualizar }) {
    const [termo, setTermo] = useState("");
    const [pagina, setPagina] = useState(1);
    const [produtos, setProdutos] = useState([]);
    const [paginacao, setPaginacao] = useState({ total_registros: 0, pagina_atual: 1, total_paginas: 1 });
    const [quantidades, setQuantidades] = useState({});
    const [resumo, setResumo] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adicionandoId, setAdicionandoId] = useState(null);
    const [removendoId, setRemovendoId] = useState(null);
    const [erroBusca, setErroBusca] = useState("");
    const [mostrarResumoMobile, setMostrarResumoMobile] = useState(false);

    const totalResumo = useMemo(() => resumo.reduce((total, item) => total + Number(item.preco) * Number(item.quantidade), 0), [resumo]);
    const totalUnidades = useMemo(() => resumo.reduce((total, item) => total + Number(item.quantidade), 0), [resumo]);

    useEffect(() => {
        if (!aberto) return;
        setTermo("");
        setPagina(1);
        setProdutos([]);
        setQuantidades({});
        setResumo([]);
        setErroBusca("");
        setMostrarResumoMobile(false);
    }, [aberto]);

    useEffect(() => {
        if (!aberto) return;

        let ativo = true;

        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                setErroBusca("");

                const response = await listarProdutos({ pagina, termo, ativo: "ativos", limite: 10 });

                if (!ativo) return;

                setProdutos(response?.data?.produtos || []);
                setPaginacao(response?.data?.paginacao || { total_registros: 0, pagina_atual: 1, total_paginas: 1 });
            } catch (error) {
                if (!ativo) return;
                setProdutos([]);
                setErroBusca(error.response?.data?.message || "Não foi possível carregar os produtos.");
            } finally {
                if (ativo) setLoading(false);
            }
        }, termo ? 350 : 0);

        return () => {
            ativo = false;
            clearTimeout(timer);
        };
    }, [aberto, termo, pagina]);

    useEffect(() => {
        if (!aberto) return;

        const handleKeyDown = event => {
            if (event.key === "Escape") {
                if (mostrarResumoMobile) setMostrarResumoMobile(false);
                else onFechar();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [aberto, mostrarResumoMobile, onFechar]);

    const handlePesquisa = event => {
        setTermo(event.target.value);
        setPagina(1);
    };

    const handleQuantidade = (produtoId, quantidade) => {
        setQuantidades(anterior => ({ ...anterior, [produtoId]: Number(quantidade) }));
    };

    const handleAdicionar = async produto => {
        const quantidade = Number(quantidades[produto.id] || 1);

        try {
            setAdicionandoId(produto.id);

            const response = await adicionarItemComanda({
                comanda_id: comandaId,
                produto_id: produto.id,
                quantidade,
                observacao: null
            });

            const itemCriado = response?.data?.item || response?.item;

            setResumo(anterior => [
                ...anterior,
                {
                    itemId: itemCriado?.id,
                    produtoId: produto.id,
                    nome: produto.nome,
                    preco: produto.preco,
                    quantidade
                }
            ]);

            setQuantidades(anterior => ({
                ...anterior,
                [produto.id]: 1
            }));

            toast.success(`${quantidade}x ${produto.nome} adicionado`, {
                id: `produto-${produto.id}`,
                duration: 1800
            });

            if (onAtualizar) Promise.resolve(onAtualizar()).catch(() => {});
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível adicionar",
                text: error.response?.data?.message || "Erro ao adicionar o produto.",
                icon: "error",
                confirmButtonColor: "var(--brand-red)"
            });
        } finally {
            setAdicionandoId(null);
        }
    };

    const handleRemover = async item => {
        if (!item.itemId) return;

        try {
            setRemovendoId(item.itemId);

            await removerItemComanda(item.itemId);

            setResumo(anterior => anterior.filter(produto => produto.itemId !== item.itemId));

            toast(`${item.quantidade}x ${item.nome} removido`, {
                icon: "↩",
                duration: 1500
            });

            if (onAtualizar) Promise.resolve(onAtualizar()).catch(() => {});
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível remover",
                text: error.response?.data?.message || "Erro ao remover o produto.",
                icon: "error",
                confirmButtonColor: "var(--brand-red)"
            });
        } finally {
            setRemovendoId(null);
        }
    };

    const mudarPagina = novaPagina => {
        if (novaPagina < 1 || novaPagina > paginacao.total_paginas || loading) return;
        setPagina(novaPagina);
    };

    const handleAcaoMobile = () => {
        if (!resumo.length) return onFechar();
        setMostrarResumoMobile(true);
    };

    if (!aberto) return null;

    return (
        <div className={styles.overlay} onMouseDown={event => event.target === event.currentTarget && onFechar()}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-modal-produtos">
                <header className={styles.header}>
                    <div>
                        <h2 id="titulo-modal-produtos">{mostrarResumoMobile ? "Resumo do pedido" : "Adicionar produtos"}</h2>
                        <p>{mostrarResumoMobile ? "Confira os produtos adicionados à comanda." : "Busque produtos do cardápio e adicione à comanda."}</p>
                    </div>

                    <button type="button" className={styles.closeButton} onClick={onFechar} title="Fechar"><X size={22} /></button>
                </header>

                <div className={`${styles.desktopSearch} ${mostrarResumoMobile ? styles.hiddenMobile : ""}`}>
                    <div className={styles.searchArea}>
                        <InputForm
                            name="buscar-produto-comanda"
                            type="search"
                            placeholder="Buscar produto, descrição ou categoria..."
                            value={termo}
                            onChange={handlePesquisa}
                            autoFocus
                            autoComplete="off"
                        />
                    </div>
                </div>

                <div className={styles.content}>
                    <section className={`${styles.productsSection} ${mostrarResumoMobile ? styles.hiddenMobile : ""}`}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <strong>Produtos disponíveis</strong>
                            </div>

                           
                        </div>

                        <div className={styles.productsList}>
                            {loading ? (
                                <div className={styles.state}>
                                    <Loader2 size={26} className={styles.spinner} />
                                    <span>Carregando produtos...</span>
                                </div>
                            ) : erroBusca ? (
                                <div className={styles.state}>
                                    <PackageSearch size={32} />
                                    <strong>Não foi possível carregar</strong>
                                    <span>{erroBusca}</span>
                                </div>
                            ) : produtos.length === 0 ? (
                                <div className={styles.state}>
                                    <PackageSearch size={32} />
                                    <strong>Nenhum produto encontrado</strong>
                                    <span>Tente pesquisar utilizando outro termo.</span>
                                </div>
                            ) : (
                                produtos.map(produto => (
                                    <div className={styles.productRow} key={produto.id}>
                                        <div className={styles.productInfo}>
                                            <strong>{produto.nome}</strong>
                                            <span>{produto.categoria_nome || "Sem categoria"}</span>
                                        </div>

                                        <strong className={styles.productPrice}>{formatarMoeda(produto.preco)}</strong>

                                        <select
                                            value={quantidades[produto.id] || 1}
                                            onChange={event => handleQuantidade(produto.id, event.target.value)}
                                            disabled={adicionandoId === produto.id}
                                            aria-label={`Quantidade de ${produto.nome}`}
                                        >
                                            {QUANTIDADES.map(quantidade => (
                                                <option key={quantidade} value={quantidade}>{quantidade}</option>
                                            ))}
                                        </select>

                                        <button
                                            type="button"
                                            className={styles.addButton}
                                            onClick={() => handleAdicionar(produto)}
                                            disabled={adicionandoId === produto.id}
                                        >
                                            {adicionandoId === produto.id ? <Loader2 size={17} className={styles.spinner} /> : <Plus size={17} />}
                                            Adicionar
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={styles.pagination}>
                            <button type="button" onClick={() => mudarPagina(pagina - 1)} disabled={pagina <= 1 || loading}><ChevronLeft size={18} /></button>
                            <span>Página <strong>{pagina}</strong> de <strong>{paginacao.total_paginas}</strong></span>
                            <button type="button" onClick={() => mudarPagina(pagina + 1)} disabled={pagina >= paginacao.total_paginas || loading}><ChevronRight size={18} /></button>
                        </div>
                    </section>

                    <aside className={`${styles.summary} ${mostrarResumoMobile ? styles.summaryMobileVisible : ""}`}>
                        <div className={styles.summaryHeader}>
                            <div><ShoppingBasket size={20} /><strong>Resumo</strong></div>
                            <span>{totalUnidades} {totalUnidades === 1 ? "item" : "itens"}</span>
                        </div>

                        <div className={styles.summaryItems}>
                            {resumo.length === 0 ? (
                                <div className={styles.emptySummary}>
                                    <ShoppingBasket size={32} />
                                    <strong>Nenhum produto adicionado</strong>
                                    <span>Os produtos adicionados nesta tela aparecerão aqui.</span>
                                </div>
                            ) : (
                                resumo.map(item => (
                                    <div className={styles.summaryItem} key={item.itemId}>
                                        <CheckCircle2 size={18} className={styles.checkIcon} />

                                        <div className={styles.summaryItemInfo}>
                                            <strong>{item.quantidade}x {item.nome}</strong>
                                            <span>{formatarMoeda(Number(item.preco) * Number(item.quantidade))}</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemover(item)}
                                            disabled={removendoId === item.itemId}
                                            title="Remover da comanda"
                                        >
                                            {removendoId === item.itemId ? <Loader2 size={16} className={styles.spinner} /> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={styles.summaryFooter}>
                            <div className={styles.summaryTotal}>
                                <span>Total adicionado</span>
                                <strong>{formatarMoeda(totalResumo)}</strong>
                            </div>

                            <button type="button" className={styles.backProductsButton} onClick={() => setMostrarResumoMobile(false)}>
                                <ArrowLeft size={17} />
                                Voltar aos produtos
                            </button>

                            <button type="button" className={styles.finishButton} onClick={onFechar}>Concluir</button>
                        </div>
                    </aside>
                </div>

                {!mostrarResumoMobile && (
                    <div className={styles.mobileFooter}>
                        <button type="button" onClick={handleAcaoMobile}>
                            {resumo.length ? <ShoppingBasket size={19} /> : <X size={19} />}
                            {resumo.length ? `Ver resumo (${totalUnidades})` : "Fechar"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}