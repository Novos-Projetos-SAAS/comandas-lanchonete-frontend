"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, Loader2, PackageSearch, Plus, ShoppingBasket, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import InputForm from "@/components/ui/inputForm";
import { useVendaRapida } from "@/hooks/useVendaRapida";
import styles from "./index.module.css";

const QUANTIDADES = Array.from({ length: 8 }, (_, index) => index + 1);
const formatCurrency = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

export default function ModalVendaRapida({ open, onClose, onFinalizar, isLoading }) {
    const venda = useVendaRapida({ aberto: open, onFinalizar });
    const [mostrarResumoMobile, setMostrarResumoMobile] = useState(false);

    const totalUnidades = useMemo(() => venda.carrinho.reduce((total, item) => total + Number(item.quantidade), 0), [venda.carrinho]);

    const handleClose = async () => {
        if (isLoading) return;

        if (venda.carrinho.length > 0) {
            const resposta = await Swal.fire({
                title: "Descartar venda em andamento?",
                text: "Os itens selecionados serão removidos.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Descartar",
                cancelButtonText: "Continuar venda",
                confirmButtonColor: "var(--brand-red)"
            });
            if (!resposta.isConfirmed) return;
        }

        venda.resetar();
        setMostrarResumoMobile(false);
        onClose();
    };

    useEffect(() => {
        if (!open) return;
        setMostrarResumoMobile(false);
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = event => {
            if (event.key !== "Escape" || isLoading) return;
            if (mostrarResumoMobile) setMostrarResumoMobile(false);
            else if (venda.carrinho.length === 0) onClose();
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, mostrarResumoMobile, isLoading, venda.carrinho.length, onClose]);

    if (!open) return null;

    const handlePesquisa = event => {
        venda.setTermo(event.target.value);
        venda.setPagina(1);
    };

    const handleAdicionar = produto => {
        const quantidade = Number(venda.quantidades[produto.id] || 1);
        venda.adicionarProduto(produto);
        toast.success(`${quantidade}x ${produto.nome} adicionado`, { id: `venda-produto-${produto.id}`, duration: 1400 });
    };

    const handleRemover = item => {
        venda.removerProduto(item.produto_id);
        toast(`${item.quantidade}x ${item.nome} removido`, { icon: "↩", duration: 1300 });
    };

    const mudarPagina = novaPagina => {
        if (novaPagina < 1 || novaPagina > venda.paginacao.total_paginas || venda.loadingCatalogo) return;
        venda.setPagina(novaPagina);
    };

    const handleFinalizar = async () => {
        const sucesso = await venda.finalizar();
        if (sucesso) {
            setMostrarResumoMobile(false);
            onClose();
        }
    };

    const handleAcaoMobile = () => {
        if (!venda.carrinho.length) return handleClose();
        setMostrarResumoMobile(true);
    };

    const primeiroPagamento = venda.pagamentos[0];
    const saldoPagamentoLabel = venda.restanteCentavos === 0 ? "Pagamento completo" : venda.restanteCentavos > 0 ? "Restante" : "Excedente";

    return (
        <div className={styles.overlay} onMouseDown={event => event.target === event.currentTarget && venda.carrinho.length === 0 && onClose()}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-venda-rapida">
                <header className={styles.header}>
                    <div>
                        <h2 id="titulo-venda-rapida">{mostrarResumoMobile ? "Resumo da venda" : "Venda Rápida"}</h2>
                        <p>{mostrarResumoMobile ? "Confira os produtos e pagamentos antes de receber." : "Busque produtos do cardápio e adicione ao carrinho."}</p>
                    </div>
                    <button type="button" className={styles.closeButton} onClick={handleClose} disabled={isLoading} title="Fechar"><X size={22} /></button>
                </header>

                <div className={`${styles.desktopSearch} ${mostrarResumoMobile ? styles.hiddenMobile : ""}`}>
                    <div className={styles.searchArea}>
                        <InputForm
                            name="buscar-produto-venda-rapida"
                            type="search"
                            placeholder="Buscar produto, descrição ou categoria..."
                            value={venda.termo}
                            onChange={handlePesquisa}
                            autoFocus
                            autoComplete="off"
                        />
                    </div>
                </div>

                <div className={styles.content}>
                    <section className={`${styles.productsSection} ${mostrarResumoMobile ? styles.hiddenMobile : ""}`}>
                        <div className={styles.sectionHeader}>
                            <div><strong>Produtos disponíveis</strong></div>
                        </div>

                        <div className={styles.productsList}>
                            {venda.loadingCatalogo ? (
                                <div className={styles.state}><Loader2 size={26} className={styles.spinner} /><span>Carregando produtos...</span></div>
                            ) : venda.erroCatalogo ? (
                                <div className={styles.state}><PackageSearch size={32} /><strong>Não foi possível carregar</strong><span>{venda.erroCatalogo}</span></div>
                            ) : venda.produtos.length === 0 ? (
                                <div className={styles.state}><PackageSearch size={32} /><strong>Nenhum produto encontrado</strong><span>Tente pesquisar utilizando outro termo.</span></div>
                            ) : (
                                venda.produtos.map(produto => (
                                    <div className={styles.productRow} key={produto.id}>
                                        <div className={styles.productInfo}>
                                            <strong>{produto.nome}</strong>
                                            <span>{produto.categoria_nome || "Sem categoria"}</span>
                                        </div>

                                        <strong className={styles.productPrice}>{formatCurrency(produto.preco)}</strong>

                                        <select
                                            value={venda.quantidades[produto.id] || 1}
                                            onChange={event => venda.alterarQuantidadeSelecao(produto.id, event.target.value)}
                                            aria-label={`Quantidade de ${produto.nome}`}
                                        >
                                            {QUANTIDADES.map(quantidade => <option key={quantidade} value={quantidade}>{quantidade}</option>)}
                                        </select>

                                        <button type="button" className={styles.addButton} onClick={() => handleAdicionar(produto)}>
                                            <Plus size={17} />Adicionar
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={styles.pagination}>
                            <button type="button" onClick={() => mudarPagina(venda.pagina - 1)} disabled={venda.pagina <= 1 || venda.loadingCatalogo}><ChevronLeft size={18} /></button>
                            <span>Página <strong>{venda.pagina}</strong> de <strong>{venda.paginacao.total_paginas}</strong></span>
                            <button type="button" onClick={() => mudarPagina(venda.pagina + 1)} disabled={venda.pagina >= venda.paginacao.total_paginas || venda.loadingCatalogo}><ChevronRight size={18} /></button>
                        </div>
                    </section>

                    <aside className={`${styles.summary} ${mostrarResumoMobile ? styles.summaryMobileVisible : ""}`}>
                        <div className={styles.summaryHeader}>
                            <div><ShoppingBasket size={20} /><strong>Resumo</strong></div>
                            <span>{totalUnidades} {totalUnidades === 1 ? "item" : "itens"}</span>
                        </div>

                        <div className={styles.summaryItems}>
                            {venda.carrinho.length === 0 ? (
                                <div className={styles.emptySummary}>
                                    <ShoppingBasket size={32} />
                                    <strong>Nenhum produto adicionado</strong>
                                    <span>Os produtos adicionados nesta tela aparecerão aqui.</span>
                                </div>
                            ) : (
                                venda.carrinho.map(item => (
                                    <div className={styles.summaryItem} key={item.produto_id}>
                                        <CheckCircle2 size={18} className={styles.checkIcon} />
                                        <div className={styles.summaryItemInfo}>
                                            <strong>{item.quantidade}x {item.nome}</strong>
                                            <span>{formatCurrency(Number(item.preco_unitario) * Number(item.quantidade))}</span>
                                            <input
                                                className={styles.itemNote}
                                                value={item.observacao}
                                                onChange={event => venda.alterarObservacaoItem(item.produto_id, event.target.value)}
                                                placeholder="Observação do item"
                                                maxLength={255}
                                            />
                                        </div>
                                        <button type="button" onClick={() => handleRemover(item)} title="Remover da venda"><Trash2 size={16} /></button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={styles.paymentSection}>
                            <div className={styles.paymentTitle}><CreditCard size={18} /><strong>Pagamento</strong></div>

                            {venda.erroOpcoes && <div className={styles.optionError}>{venda.erroOpcoes}</div>}

                            <label className={styles.splitToggle}>
                                <input type="checkbox" checked={venda.dividirPagamento} onChange={event => venda.alternarDivisaoPagamento(event.target.checked)} />
                                <span>Dividir pagamento</span>
                            </label>

                            {!venda.dividirPagamento ? (
                                <div className={styles.singlePayment}>
                                    <label className={styles.field}>
                                        <span>Forma de pagamento</span>
                                        <select
                                            value={primeiroPagamento?.metodo_pagamento_id || ""}
                                            onChange={event => venda.alterarPagamento(primeiroPagamento.chave, "metodo_pagamento_id", event.target.value)}
                                            disabled={venda.loadingMetodosPagamento}
                                        >
                                            <option value="">Selecione</option>
                                            {venda.metodosPagamento.map(metodo => <option key={metodo.id} value={metodo.id}>{metodo.nome}</option>)}
                                        </select>
                                    </label>

                                    {venda.metodoEhDinheiro(primeiroPagamento?.metodo_pagamento_id) && (
                                        <label className={styles.field}>
                                            <span>Valor recebido</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={primeiroPagamento.valor_recebido}
                                                onChange={event => venda.alterarPagamento(primeiroPagamento.chave, "valor_recebido", event.target.value)}
                                                placeholder={formatCurrency(venda.total)}
                                            />
                                            {venda.obterTrocoPagamento(primeiroPagamento) > 0 && <small className={styles.cashChange}>Troco: <strong>{formatCurrency(venda.obterTrocoPagamento(primeiroPagamento))}</strong></small>}
                                        </label>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.splitPayments}>
                                    {venda.pagamentos.map((pagamento, index) => (
                                        <div className={styles.paymentRow} key={pagamento.chave}>
                                            <div className={styles.paymentRowHeader}>
                                                <strong>Pagamento {index + 1}</strong>
                                                {venda.pagamentos.length > 1 && (
                                                    <button type="button" onClick={() => venda.removerPagamento(pagamento.chave)} title="Remover pagamento"><Trash2 size={15} /></button>
                                                )}
                                            </div>

                                            <div className={styles.paymentGrid}>
                                                <label className={styles.field}>
                                                    <span>Forma</span>
                                                    <select
                                                        value={pagamento.metodo_pagamento_id}
                                                        onChange={event => venda.alterarPagamento(pagamento.chave, "metodo_pagamento_id", event.target.value)}
                                                    >
                                                        <option value="">Selecione</option>
                                                        {venda.metodosPagamento.map(metodo => <option key={metodo.id} value={metodo.id}>{metodo.nome}</option>)}
                                                    </select>
                                                </label>

                                                <label className={styles.field}>
                                                    <span>Valor</span>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={pagamento.valor}
                                                        onChange={event => venda.alterarPagamento(pagamento.chave, "valor", event.target.value)}
                                                        placeholder="0,00"
                                                    />
                                                </label>
                                            </div>

                                            {venda.metodoEhDinheiro(pagamento.metodo_pagamento_id) && (
                                                <label className={styles.field}>
                                                    <span>Valor recebido em dinheiro</span>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={pagamento.valor_recebido}
                                                        onChange={event => venda.alterarPagamento(pagamento.chave, "valor_recebido", event.target.value)}
                                                        placeholder="0,00"
                                                    />
                                                    {venda.obterTrocoPagamento(pagamento) > 0 && <small className={styles.cashChange}>Troco: <strong>{formatCurrency(venda.obterTrocoPagamento(pagamento))}</strong></small>}
                                                </label>
                                            )}
                                        </div>
                                    ))}

                                    <button type="button" className={styles.addPaymentButton} onClick={venda.adicionarPagamento} disabled={venda.pagamentos.length >= 50}>
                                        <Plus size={16} />Adicionar forma de pagamento
                                    </button>

                                    <div className={`${styles.paymentBalance} ${venda.restanteCentavos === 0 ? styles.paymentComplete : venda.restanteCentavos < 0 ? styles.paymentExceeded : ""}`}>
                                        <span>{saldoPagamentoLabel}</span>
                                        <strong>{formatCurrency(Math.abs(venda.restante))}</strong>
                                    </div>
                                </div>
                            )}

                            <label className={styles.field}>
                                <span>Observação da venda</span>
                                <textarea value={venda.observacao} onChange={event => venda.setObservacao(event.target.value)} placeholder="Opcional" maxLength={255} rows={2} />
                            </label>
                        </div>

                        <div className={styles.summaryFooter}>
                            <div className={styles.summaryTotal}>
                                <span>Total da venda</span>
                                <strong>{formatCurrency(venda.total)}</strong>
                            </div>

                            <button type="button" className={styles.backProductsButton} onClick={() => setMostrarResumoMobile(false)}>
                                <ArrowLeft size={17} />Voltar aos produtos
                            </button>

                            <button type="button" className={styles.finishButton} onClick={handleFinalizar} disabled={!venda.podeFinalizar || isLoading}>
                                {isLoading ? <><Loader2 size={17} className={styles.spinner} />Recebendo...</> : `Receber ${formatCurrency(venda.total)}`}
                            </button>
                        </div>
                    </aside>
                </div>

                {!mostrarResumoMobile && (
                    <div className={styles.mobileFooter}>
                        <button type="button" onClick={handleAcaoMobile}>
                            {venda.carrinho.length ? <ShoppingBasket size={19} /> : <X size={19} />}
                            {venda.carrinho.length ? `Ver resumo (${totalUnidades})` : "Fechar"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
