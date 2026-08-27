"use client";

import { useEffect, useRef } from "react";
import { Loader2, Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";
import { useVendaRapida } from "@/hooks/useVendaRapida";
import styles from "./index.module.css";

const formatCurrency = valor => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));

export default function ModalVendaRapida({ open, onClose, onFinalizar, isLoading }) {
    const buscaRef = useRef(null);
    const venda = useVendaRapida({ aberto: open, onFinalizar });

    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => buscaRef.current?.focus(), 50);
        return () => clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleEscape = event => {
            if (event.key === 'Escape' && !isLoading && venda.carrinho.length === 0) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [open, isLoading, venda.carrinho.length, onClose]);

    if (!open) return null;

    const handleClose = async () => {
        if (isLoading) return;
        if (venda.carrinho.length > 0) {
            const resposta = await Swal.fire({ title: 'Descartar venda em andamento?', text: 'Os itens selecionados serão removidos.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Descartar', cancelButtonText: 'Continuar venda', confirmButtonColor: '#ef4444' });
            if (!resposta.isConfirmed) return;
        }
        venda.resetar();
        onClose();
    };

    const handleFinalizar = async () => {
        const sucesso = await venda.finalizar();
        if (sucesso) onClose();
    };

    return (
        <div className={styles.overlay} role="presentation">
            <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="venda-rapida-title">
                <header className={styles.header}>
                    <div>
                        <span className={styles.eyebrow}>PDV de balcão</span>
                        <h2 id="venda-rapida-title">Venda Rápida</h2>
                    </div>
                    <button type="button" className={styles.iconButton} onClick={handleClose} disabled={isLoading} aria-label="Fechar venda rápida"><X size={20} /></button>
                </header>

                <div className={styles.content}>
                    <div className={styles.catalogColumn}>
                        <div className={styles.sectionHeading}>
                            <div><strong>Produtos</strong><span>Toque para adicionar</span></div>
                            <span className={styles.resultCount}>{venda.produtos.length}</span>
                        </div>
                        <div className={styles.filters}>
                            <label className={styles.searchBox}>
                                <Search size={18} />
                                <input ref={buscaRef} type="search" value={venda.busca} onChange={event => venda.setBusca(event.target.value)} placeholder="Buscar produto" aria-label="Buscar produto" />
                            </label>
                            <select value={venda.categoriaId} onChange={event => venda.setCategoriaId(event.target.value)} className={styles.select} aria-label="Filtrar por categoria">
                                <option value="">Todas as categorias</option>
                                {venda.categorias.map(categoria => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
                            </select>
                        </div>

                        <div className={styles.productList}>
                            {venda.loadingCatalogo ? (
                                <div className={styles.state}><Loader2 className={styles.spinner} size={24} /><span>Carregando produtos...</span></div>
                            ) : venda.erroCatalogo ? (
                                <div className={styles.stateError}>{venda.erroCatalogo}</div>
                            ) : venda.produtos.length === 0 ? (
                                <div className={styles.state}><Search size={24} /><span>Nenhum produto encontrado.</span></div>
                            ) : venda.produtos.map(produto => (
                                <button type="button" key={produto.id} className={styles.productItem} onClick={() => venda.adicionarProduto(produto)}>
                                    <div><strong>{produto.nome}</strong><span>{produto.categoria_nome || 'Sem categoria'}</span></div>
                                    <b>{formatCurrency(produto.preco)}</b>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.cartColumn}>
                        <div className={styles.sectionHeading}>
                            <div><strong>Venda</strong><span>{venda.carrinho.length ? `${venda.carrinho.length} produto(s)` : 'Carrinho vazio'}</span></div>
                            <ShoppingCart size={20} />
                        </div>

                        <div className={styles.cartList}>
                            {venda.carrinho.length === 0 ? (
                                <div className={styles.emptyCart}><ShoppingCart size={28} /><strong>Nenhum item</strong><span>Selecione um produto para começar.</span></div>
                            ) : venda.carrinho.map(item => (
                                <div className={styles.cartItem} key={item.produto_id}>
                                    <div className={styles.cartTop}>
                                        <div><strong>{item.nome}</strong><span>{formatCurrency(item.preco_unitario)} cada</span></div>
                                        <button type="button" className={styles.removeButton} onClick={() => venda.removerProduto(item.produto_id)} aria-label={`Remover ${item.nome}`}><Trash2 size={17} /></button>
                                    </div>
                                    <div className={styles.cartControls}>
                                        <div className={styles.quantityControl}>
                                            <button type="button" onClick={() => item.quantidade === 1 ? venda.removerProduto(item.produto_id) : venda.alterarQuantidade(item.produto_id, item.quantidade - 1)} aria-label={`Diminuir quantidade de ${item.nome}`}><Minus size={15} /></button>
                                            <input type="number" min="1" max="999" value={item.quantidade} onChange={event => venda.alterarQuantidade(item.produto_id, event.target.value)} aria-label={`Quantidade de ${item.nome}`} />
                                            <button type="button" onClick={() => venda.alterarQuantidade(item.produto_id, item.quantidade + 1)} aria-label={`Aumentar quantidade de ${item.nome}`}><Plus size={15} /></button>
                                        </div>
                                        <strong>{formatCurrency(item.preco_unitario * item.quantidade)}</strong>
                                    </div>
                                    <input className={styles.itemNote} value={item.observacao} onChange={event => venda.alterarObservacaoItem(item.produto_id, event.target.value)} placeholder="Observação do item (opcional)" maxLength={255} />
                                </div>
                            ))}
                        </div>

                        <div className={styles.paymentArea}>
                            {venda.erroOpcoes && <div className={styles.optionError}>{venda.erroOpcoes}</div>}
                            <label className={styles.field}><span>Forma de pagamento</span><select value={venda.formaPagamento} onChange={event => { venda.setFormaPagamento(event.target.value); venda.setValorRecebido(''); }}><option value="">Selecione</option>{venda.metodosPagamento.map(metodo => <option key={metodo.id} value={metodo.nome}>{metodo.nome}</option>)}</select></label>
                            {venda.isDinheiro && <label className={styles.field}><span>Valor recebido</span><div className={styles.moneyInput}><span>R$</span><input type="text" inputMode="decimal" value={venda.valorRecebido} onChange={event => venda.setValorRecebido(event.target.value)} placeholder="0,00" /></div>{venda.troco > 0 && <small>Troco: <strong>{formatCurrency(venda.troco)}</strong></small>}</label>}
                            <label className={styles.field}><span>Observação da venda</span><textarea value={venda.observacao} onChange={event => venda.setObservacao(event.target.value)} placeholder="Opcional" maxLength={255} rows={2} /></label>
                        </div>
                    </div>
                </div>

                <footer className={styles.footer}>
                    <div className={styles.totalBlock}><span>Total</span><strong>{formatCurrency(venda.total)}</strong></div>
                    <div className={styles.footerActions}>
                        <button type="button" className={styles.cancelButton} onClick={handleClose} disabled={isLoading}>Cancelar</button>
                        <button type="button" className={styles.payButton} onClick={handleFinalizar} disabled={!venda.podeFinalizar || isLoading}>{isLoading ? <><Loader2 size={18} className={styles.spinner} />Recebendo...</> : `Receber ${formatCurrency(venda.total)}`}</button>
                    </div>
                </footer>
            </section>
        </div>
    );
}
