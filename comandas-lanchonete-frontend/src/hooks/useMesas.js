"use client";

import { useCallback, useEffect, useState } from "react";
import {
    listarMesas as listarMesasApi,
    obterMesaPorId,
    criarMesa as criarMesaApi,
    atualizarMesa as atualizarMesaApi,
    inativarMesa as inativarMesaApi,
    reativarMesa as reativarMesaApi,
    obterQrCodeMesa
} from "@/services/mesas.service";

// Estado inicial usado antes da primeira resposta da API ou após uma falha.
const RESUMO_INICIAL = {
    total: 0,
    livres: 0,
    ocupadas: 0,
    atencao: 0,
    inativas: 0
};

/**
 * Hook responsável por todo o estado do módulo de mesas.
 * Pode ser usado com carregarLista=false em páginas que precisam apenas das ações da API.
 */
export function useMesas({ carregarLista = true } = {}) {
    // Estado da listagem e dos filtros.
    const [mesas, setMesas] = useState([]);
    const [resumo, setResumo] = useState(RESUMO_INICIAL);
    const [loading, setLoading] = useState(carregarLista);
    const [actionLoading, setActionLoading] = useState(null);
    const [page, setPageInternal] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [search, setSearchInternal] = useState("");
    const [statusFilter, setStatusFilterInternal] = useState("todas");
    const [lastUpdate, setLastUpdate] = useState(null);

    // Busca a página atual, aplica filtros no backend e atualiza resumo/paginação.
    const carregarMesas = useCallback(async ({ silencioso = false } = {}) => {
        if (!silencioso) setLoading(true);

        try {
            const response = await listarMesasApi({
                pagina: page,
                termo: search,
                situacao: statusFilter,
                limite: 24
            });

            const payload = response?.data || response;
            const lista = Array.isArray(payload?.mesas) ? payload.mesas : [];
            const paginacao = payload?.paginacao || {};

            setMesas(lista);
            setResumo(payload?.resumo || RESUMO_INICIAL);
            setTotalPages(paginacao.total_paginas || 1);
            setTotalRecords(paginacao.total_registros || 0);
            setLastUpdate(new Date());

            if (paginacao.pagina_atual && paginacao.pagina_atual !== page) {
                setPageInternal(paginacao.pagina_atual);
            }
        } catch (error) {
            console.error("Erro ao listar mesas:", error);
            setMesas([]);
            throw error;
        } finally {
            if (!silencioso) setLoading(false);
        }
    }, [page, search, statusFilter]);

    // Carregamento inicial da listagem.
    useEffect(() => {
        if (!carregarLista) return undefined;

        carregarMesas().catch(() => {});
        return undefined;
    }, [carregarLista, carregarMesas]);

    // Atualização silenciosa a cada minuto para recalcular mesas em atenção.
    useEffect(() => {
        if (!carregarLista) return undefined;

        const intervalId = window.setInterval(() => {
            carregarMesas({ silencioso: true }).catch(() => {});
        }, 60000);

        return () => window.clearInterval(intervalId);
    }, [carregarLista, carregarMesas]);

    // Setters evitam atualizações quando o valor recebido já é o atual.
    const setPage = useCallback((novaPagina) => {
        setPageInternal((paginaAtual) => paginaAtual === novaPagina ? paginaAtual : novaPagina);
    }, []);

    const setSearch = useCallback((novoTermo) => {
        setSearchInternal((termoAtual) => termoAtual === novoTermo ? termoAtual : novoTermo);
    }, []);

    const setStatusFilter = useCallback((novoStatus) => {
        setStatusFilterInternal((statusAtual) => statusAtual === novoStatus ? statusAtual : novoStatus);
        setPageInternal(1);
    }, []);

    // Ações abaixo normalizam o formato de resposta e controlam loading por operação.
    const buscarMesaPorId = useCallback(async (id) => {
        const response = await obterMesaPorId(id);
        return response?.data?.mesa || response?.mesa || response;
    }, []);

    const criarMesa = useCallback(async (payload) => {
        setActionLoading("create");
        try {
            const response = await criarMesaApi(payload);
            if (carregarLista) await carregarMesas({ silencioso: true });
            return response;
        } finally {
            setActionLoading(null);
        }
    }, [carregarLista, carregarMesas]);

    const atualizarMesa = useCallback(async (id, payload) => {
        setActionLoading(id);
        try {
            const response = await atualizarMesaApi(id, payload);
            if (carregarLista) await carregarMesas({ silencioso: true });
            return response;
        } finally {
            setActionLoading(null);
        }
    }, [carregarLista, carregarMesas]);

    const inativarMesa = useCallback(async (id) => {
        setActionLoading(id);
        try {
            const response = await inativarMesaApi(id);
            if (carregarLista) await carregarMesas({ silencioso: true });
            return response;
        } finally {
            setActionLoading(null);
        }
    }, [carregarLista, carregarMesas]);

    const reativarMesa = useCallback(async (id) => {
        setActionLoading(id);
        try {
            const response = await reativarMesaApi(id);
            if (carregarLista) await carregarMesas({ silencioso: true });
            return response;
        } finally {
            setActionLoading(null);
        }
    }, [carregarLista, carregarMesas]);

    const buscarQrCode = useCallback(async (id) => {
        const response = await obterQrCodeMesa(id);
        return response?.data || response;
    }, []);

    // API pública consumida pelas páginas e componentes do módulo.
    return {
        mesas,
        resumo,
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
        lastUpdate,
        listarMesas: carregarMesas,
        buscarMesaPorId,
        criarMesa,
        atualizarMesa,
        inativarMesa,
        reativarMesa,
        buscarQrCode
    };
}
