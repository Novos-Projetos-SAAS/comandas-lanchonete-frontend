"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listarProdutos } from "@/services/produtos.service";
import { useMetodosPagamento } from "@/hooks/useMetodosPagamento";
import { deCentavos, formatarValorInput, paraCentavos, parseMoney } from "@/hooks/venda-rapida.utils";

const PAGINA_INICIAL = { total_registros: 0, pagina_atual: 1, total_paginas: 1 };
const criarPagamento = (chave, valor = "") => ({ chave, metodo_pagamento_id: "", valor, valor_recebido: "" });

export function useVendaRapida({ aberto, onFinalizar }) {
    const [termo, setTermo] = useState("");
    const [pagina, setPagina] = useState(1);
    const [produtos, setProdutos] = useState([]);
    const [paginacao, setPaginacao] = useState(PAGINA_INICIAL);
    const [quantidades, setQuantidades] = useState({});
    const [carrinho, setCarrinho] = useState([]);
    const [observacao, setObservacao] = useState("");
    const [pagamentos, setPagamentos] = useState([criarPagamento(1)]);
    const [loadingCatalogo, setLoadingCatalogo] = useState(false);
    const [erroCatalogo, setErroCatalogo] = useState("");
    const proximaChavePagamento = useRef(2);

    const { metodosPagamento, loadingMetodosPagamento, erroMetodosPagamento, carregarMetodosPagamento } = useMetodosPagamento({ carregarAutomaticamente: false });

    const totalCentavos = useMemo(() => carrinho.reduce((total, item) => total + Math.round(Number(item.preco_unitario) * 100) * Number(item.quantidade), 0), [carrinho]);
    const total = deCentavos(totalCentavos);

    const metodoEhDinheiro = useCallback(metodoId => {
        const metodo = metodosPagamento.find(item => Number(item.id) === Number(metodoId));
        return String(metodo?.nome || "").trim().toLowerCase() === "dinheiro";
    }, [metodosPagamento]);

    const carregarProdutos = useCallback(async () => {
        try {
            setLoadingCatalogo(true);
            setErroCatalogo("");
            const resultado = await listarProdutos({ pagina, termo, ativo: "ativos", limite: 10, somenteComPreco: true });
            const lista = resultado?.data?.produtos || [];
            setProdutos(lista.filter(produto => Number(produto.preco) > 0));
            setPaginacao(resultado?.data?.paginacao || PAGINA_INICIAL);
        } catch (error) {
            setProdutos([]);
            setPaginacao(PAGINA_INICIAL);
            setErroCatalogo(error.response?.data?.message || "Não foi possível carregar os produtos.");
        } finally {
            setLoadingCatalogo(false);
        }
    }, [pagina, termo]);

    useEffect(() => {
        if (!aberto) return;
        setTermo("");
        setPagina(1);
        setProdutos([]);
        setPaginacao(PAGINA_INICIAL);
        setQuantidades({});
        setCarrinho([]);
        setObservacao("");
        setPagamentos([criarPagamento(1)]);
        setErroCatalogo("");
        proximaChavePagamento.current = 2;
        carregarMetodosPagamento({ silencioso: true }).catch(() => {});
    }, [aberto, carregarMetodosPagamento]);

    useEffect(() => {
        if (!aberto) return;
        let ativo = true;
        const timer = setTimeout(async () => {
            if (ativo) await carregarProdutos();
        }, termo ? 350 : 0);
        return () => {
            ativo = false;
            clearTimeout(timer);
        };
    }, [aberto, termo, pagina, carregarProdutos]);

    const alterarQuantidadeSelecao = (produtoId, quantidade) => setQuantidades(anterior => ({ ...anterior, [produtoId]: Number(quantidade) }));

    const adicionarProduto = produto => {
        if (Number(produto?.preco) <= 0) return;
        const quantidade = Number(quantidades[produto.id] || 1);
        setCarrinho(atual => {
            const existente = atual.find(item => item.produto_id === produto.id);
            if (existente) return atual.map(item => item.produto_id === produto.id ? { ...item, quantidade: Math.min(Number(item.quantidade) + quantidade, 999) } : item);
            return [...atual, { produto_id: produto.id, nome: produto.nome, preco_unitario: Number(produto.preco), quantidade, observacao: "" }];
        });
        setQuantidades(anterior => ({ ...anterior, [produto.id]: 1 }));
    };

    const alterarObservacaoItem = (produtoId, valor) => setCarrinho(atual => atual.map(item => item.produto_id === produtoId ? { ...item, observacao: valor } : item));
    const removerProduto = produtoId => setCarrinho(atual => atual.filter(item => item.produto_id !== produtoId));

    const prepararRecebimento = () => {
        setPagamentos([criarPagamento(1, formatarValorInput(totalCentavos))]);
        proximaChavePagamento.current = 2;
    };

    const alterarPagamento = (chave, campo, valor) => {
        setPagamentos(atual => {
            const lista = atual.map(pagamento => {
                if (pagamento.chave !== chave) return pagamento;
                const atualizado = { ...pagamento, [campo]: valor };
                if (campo === "metodo_pagamento_id" && !metodoEhDinheiro(valor)) atualizado.valor_recebido = "";
                return atualizado;
            });

            if (campo === "valor" && lista.length > 1) {
                const indiceAlterado = lista.findIndex(item => item.chave === chave);
                const indiceUltimo = lista.length - 1;
                if (indiceAlterado !== indiceUltimo) {
                    const usado = lista.slice(0, -1).reduce((soma, pagamento) => soma + paraCentavos(pagamento.valor), 0);
                    lista[indiceUltimo] = { ...lista[indiceUltimo], valor: formatarValorInput(Math.max(totalCentavos - usado, 0)) };
                }
            }

            return lista;
        });
    };

    const adicionarPagamento = () => {
        setPagamentos(atual => {
            if (atual.length >= 50) return atual;
            const chave = proximaChavePagamento.current++;
            const usado = atual.reduce((soma, pagamento) => soma + paraCentavos(pagamento.valor), 0);
            return [...atual, criarPagamento(chave, formatarValorInput(Math.max(totalCentavos - usado, 0)))];
        });
    };

    const removerPagamento = chave => {
        setPagamentos(atual => {
            if (atual.length <= 1) return atual;
            const lista = atual.filter(item => item.chave !== chave);
            if (lista.length === 1) return [{ ...lista[0], valor: formatarValorInput(totalCentavos) }];

            const indiceUltimo = lista.length - 1;
            const usado = lista.slice(0, -1).reduce((soma, pagamento) => soma + paraCentavos(pagamento.valor), 0);
            lista[indiceUltimo] = { ...lista[indiceUltimo], valor: formatarValorInput(Math.max(totalCentavos - usado, 0)) };
            return lista;
        });
    };

    const totalPagamentosCentavos = useMemo(() => pagamentos.reduce((soma, pagamento) => soma + paraCentavos(pagamento.valor), 0), [pagamentos]);
    const restanteCentavos = totalCentavos - totalPagamentosCentavos;
    const restante = deCentavos(restanteCentavos);

    const obterTrocoPagamento = pagamento => {
        if (!pagamento || !metodoEhDinheiro(pagamento.metodo_pagamento_id)) return 0;
        return deCentavos(Math.max(paraCentavos(pagamento.valor_recebido) - paraCentavos(pagamento.valor), 0));
    };

    const pagamentosValidos = useMemo(() => {
        if (!pagamentos.length || totalCentavos <= 0 || totalPagamentosCentavos !== totalCentavos) return false;
        return pagamentos.every(pagamento => {
            const valorCentavos = paraCentavos(pagamento.valor);
            if (!pagamento.metodo_pagamento_id || valorCentavos <= 0) return false;
            if (!metodoEhDinheiro(pagamento.metodo_pagamento_id)) return true;
            return paraCentavos(pagamento.valor_recebido) >= valorCentavos;
        });
    }, [pagamentos, totalCentavos, totalPagamentosCentavos, metodoEhDinheiro]);

    const podeFinalizar = carrinho.length > 0 && pagamentosValidos;

    const resetar = () => {
        setTermo("");
        setPagina(1);
        setProdutos([]);
        setPaginacao(PAGINA_INICIAL);
        setQuantidades({});
        setCarrinho([]);
        setObservacao("");
        setPagamentos([criarPagamento(1)]);
        setErroCatalogo("");
        proximaChavePagamento.current = 2;
    };

    const finalizar = async () => {
        if (!podeFinalizar) return false;

        const pagamentosPayload = pagamentos.map(pagamento => ({
            metodo_pagamento_id: Number(pagamento.metodo_pagamento_id),
            valor: parseMoney(pagamento.valor),
            valor_recebido: metodoEhDinheiro(pagamento.metodo_pagamento_id) ? parseMoney(pagamento.valor_recebido) : null
        }));

        const sucesso = await onFinalizar({
            observacao: observacao.trim() || null,
            pagamentos: pagamentosPayload,
            itens: carrinho.map(item => ({
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                observacao: item.observacao.trim() || null
            }))
        });

        if (sucesso) resetar();
        return sucesso;
    };

    return {
        termo, setTermo, pagina, setPagina, produtos, paginacao, quantidades, alterarQuantidadeSelecao,
        carrinho, observacao, setObservacao, pagamentos, alterarPagamento, adicionarPagamento, removerPagamento,
        prepararRecebimento, metodosPagamento, metodoEhDinheiro, obterTrocoPagamento, loadingMetodosPagamento,
        loadingCatalogo, erroCatalogo, erroOpcoes: erroMetodosPagamento, adicionarProduto, alterarObservacaoItem,
        removerProduto, total, totalCentavos, totalPagamentos: deCentavos(totalPagamentosCentavos), restante,
        restanteCentavos, pagamentosValidos, podeFinalizar, finalizar, resetar
    };
}