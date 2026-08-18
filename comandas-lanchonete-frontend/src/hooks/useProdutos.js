"use client";

import { useCallback, useEffect, useState } from "react";
import {
    listarProdutos as listarProdutosApi,
    obterProdutoPorId,
    listarCategoriasProduto,
    criarProduto as criarProdutoApi,
    atualizarProduto as atualizarProdutoApi,
    inativarProduto as inativarProdutoApi,
    reativarProduto as reativarProdutoApi
} from "@/services/produtos.service";

/**
 * Hook do cardápio administrativo.
 * Reúne paginação, filtros, categorias e operações de manutenção.
 */
export function useProdutos({ carregarLista = true } = {}) {
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(carregarLista);
    const [actionLoading, setActionLoading] = useState(null);
    const [page, setPageInternal] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [search, setSearchInternal] = useState("");
    const [statusFilter, setStatusFilterInternal] = useState("todos");
    const [categoryFilter, setCategoryFilterInternal] = useState("");

    const carregarCategorias = useCallback(async () => {
        const response = await listarCategoriasProduto();
        const payload = response?.data || response;
        const lista = payload?.categorias || payload?.data?.categorias || [];

        setCategorias(Array.isArray(lista) ? lista : []);
        return lista;
    }, []);

    const carregarProdutos = useCallback(async () => {
        setLoading(true);

        try {
            const response = await listarProdutosApi({
                pagina: page,
                termo: search,
                ativo: statusFilter,
                categoriaId: categoryFilter,
                limite: 10
            });

            const payload = response?.data || response;
            const paginacao = payload?.paginacao || {};

            setProdutos(Array.isArray(payload?.produtos) ? payload.produtos : []);
            setTotalPages(paginacao.total_paginas || 1);
            setTotalRecords(paginacao.total_registros || 0);
        } catch (error) {
            console.error("Erro ao listar produtos:", error);
            setProdutos([]);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, categoryFilter]);

    useEffect(() => {
        if (!carregarLista) return undefined;

        Promise.all([
            carregarProdutos(),
            carregarCategorias()
        ]).catch(() => {});

        return undefined;
    }, [carregarLista, carregarProdutos, carregarCategorias]);

    const setPage = useCallback((novaPagina) => {
        setPageInternal(novaPagina);
    }, []);

    const setSearch = useCallback((novoTermo) => {
        setSearchInternal(novoTermo);
        setPageInternal(1);
    }, []);

    const setStatusFilter = useCallback((novoStatus) => {
        setStatusFilterInternal(novoStatus);
        setPageInternal(1);
    }, []);

    const setCategoryFilter = useCallback((novaCategoria) => {
        setCategoryFilterInternal(novaCategoria);
        setPageInternal(1);
    }, []);

    const executarAcao = useCallback(async (chave, acao) => {
        setActionLoading(chave);

        try {
            const response = await acao();
            if (carregarLista) await carregarProdutos();
            return response;
        } finally {
            setActionLoading(null);
        }
    }, [carregarLista, carregarProdutos]);

    const buscarProdutoPorId = useCallback(async (id) => {
        const response = await obterProdutoPorId(id);
        return response?.data?.produto || response?.produto || response?.data || response;
    }, []);

    const criarProduto = useCallback((payload) => (
        executarAcao("create", () => criarProdutoApi(payload))
    ), [executarAcao]);

    const atualizarProduto = useCallback((id, payload) => (
        executarAcao(id, () => atualizarProdutoApi(id, payload))
    ), [executarAcao]);

    const alternarStatus = useCallback((id, ativo) => (
        executarAcao(id, () => ativo ? reativarProdutoApi(id) : inativarProdutoApi(id))
    ), [executarAcao]);

    return {
        produtos,
        categorias,
        loading,
        actionLoading,
        page,
        setPage,
        totalPages,
        totalRecords,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,
        carregarProdutos,
        carregarCategorias,
        buscarProdutoPorId,
        criarProduto,
        atualizarProduto,
        alternarStatus
    };
}
