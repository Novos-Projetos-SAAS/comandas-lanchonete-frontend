import { useCallback, useEffect, useMemo, useState } from 'react';
import { listarProdutos, listarCategoriasProduto } from '@/services/produtos.service';
import { listarMetodosPagamentoAtivos } from '@/services/metodos-pagamento.service';

const parseMoney = valor => {
    const numero = Number(String(valor ?? '').replace(',', '.'));
    return Number.isFinite(numero) ? numero : 0;
};

export function useVendaRapida({ aberto, onFinalizar }) {
    const [busca, setBusca] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [metodosPagamento, setMetodosPagamento] = useState([]);
    const [carrinho, setCarrinho] = useState([]);
    const [formaPagamento, setFormaPagamento] = useState('');
    const [valorRecebido, setValorRecebido] = useState('');
    const [observacao, setObservacao] = useState('');
    const [loadingCatalogo, setLoadingCatalogo] = useState(false);
    const [erroCatalogo, setErroCatalogo] = useState('');
    const [erroOpcoes, setErroOpcoes] = useState('');

    const carregarOpcoes = useCallback(async () => {
        try {
            setErroOpcoes('');
            const [resCategorias, resMetodos] = await Promise.all([listarCategoriasProduto(), listarMetodosPagamentoAtivos()]);
            setCategorias(resCategorias.data?.categorias || []);
            setMetodosPagamento(resMetodos.data?.metodos || []);
        } catch (error) {
            setErroOpcoes(error.response?.data?.message || 'Não foi possível carregar categorias ou formas de pagamento.');
        }
    }, []);

    const carregarProdutos = useCallback(async () => {
        try {
            setLoadingCatalogo(true);
            setErroCatalogo('');
            const resultado = await listarProdutos({ pagina: 1, termo: busca, ativo: 'ativos', categoriaId, limite: 100 });
            setProdutos(resultado.data?.produtos || []);
        } catch (error) {
            setProdutos([]);
            setErroCatalogo(error.response?.data?.message || 'Não foi possível carregar os produtos.');
        } finally {
            setLoadingCatalogo(false);
        }
    }, [busca, categoriaId]);

    useEffect(() => {
        if (!aberto) return;
        carregarOpcoes();
    }, [aberto, carregarOpcoes]);

    useEffect(() => {
        if (!aberto) return;
        const timer = setTimeout(carregarProdutos, 350);
        return () => clearTimeout(timer);
    }, [aberto, carregarProdutos]);

    const adicionarProduto = produto => {
        setCarrinho(atual => {
            const existente = atual.find(item => item.produto_id === produto.id);
            if (existente) return atual.map(item => item.produto_id === produto.id ? { ...item, quantidade: Math.min(item.quantidade + 1, 999) } : item);
            return [...atual, { produto_id: produto.id, nome: produto.nome, preco_unitario: Number(produto.preco), quantidade: 1, observacao: '' }];
        });
    };

    const alterarQuantidade = (produtoId, quantidade) => {
        const valor = Math.max(1, Math.min(Number(quantidade) || 1, 999));
        setCarrinho(atual => atual.map(item => item.produto_id === produtoId ? { ...item, quantidade: valor } : item));
    };

    const alterarObservacaoItem = (produtoId, valor) => setCarrinho(atual => atual.map(item => item.produto_id === produtoId ? { ...item, observacao: valor } : item));
    const removerProduto = produtoId => setCarrinho(atual => atual.filter(item => item.produto_id !== produtoId));

    const totalCentavos = useMemo(() => carrinho.reduce((total, item) => total + Math.round(Number(item.preco_unitario) * 100) * item.quantidade, 0), [carrinho]);
    const total = totalCentavos / 100;
    const isDinheiro = formaPagamento.trim().toLowerCase() === 'dinheiro';
    const valorRecebidoNumero = parseMoney(valorRecebido);
    const troco = isDinheiro ? Math.max(valorRecebidoNumero - total, 0) : 0;
    const valorDinheiroValido = !isDinheiro || valorRecebidoNumero >= total;
    const podeFinalizar = carrinho.length > 0 && Boolean(formaPagamento) && valorDinheiroValido;

    const resetar = () => {
        setBusca('');
        setCategoriaId('');
        setCarrinho([]);
        setFormaPagamento('');
        setValorRecebido('');
        setObservacao('');
        setErroCatalogo('');
        setErroOpcoes('');
    };

    const finalizar = async () => {
        if (!podeFinalizar) return false;
        const sucesso = await onFinalizar({
            forma_pagamento: formaPagamento,
            valor_recebido: isDinheiro ? valorRecebidoNumero : null,
            observacao: observacao.trim() || null,
            itens: carrinho.map(item => ({ produto_id: item.produto_id, quantidade: item.quantidade, observacao: item.observacao.trim() || null }))
        });
        if (sucesso) resetar();
        return sucesso;
    };

    return {
        busca,
        setBusca,
        categoriaId,
        setCategoriaId,
        produtos,
        categorias,
        metodosPagamento,
        carrinho,
        formaPagamento,
        setFormaPagamento,
        valorRecebido,
        setValorRecebido,
        observacao,
        setObservacao,
        loadingCatalogo,
        erroCatalogo,
        erroOpcoes,
        adicionarProduto,
        alterarQuantidade,
        alterarObservacaoItem,
        removerProduto,
        total,
        isDinheiro,
        troco,
        podeFinalizar,
        finalizar,
        resetar
    };
}
