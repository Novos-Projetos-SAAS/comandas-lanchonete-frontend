"use client";

import { useCallback, useEffect, useState } from "react";
import {
    listarMesas as listarMesasApi,
    obterMesaPorId,
    criarMesa as criarMesaApi,
    atualizarMesa as atualizarMesaApi,
    atualizarClienteMesa as atualizarClienteMesaApi,
    zerarCronometroMesa as zerarCronometroMesaApi,
    alterarStatusMesa as alterarStatusMesaApi,
    inativarMesa as inativarMesaApi,
    reativarMesa as reativarMesaApi,
    obterQrCodeMesa
} from "@/services/mesas.service";

const RESUMO_INICIAL = {
    total: 0,
    livres: 0,
    ocupadas: 0,
    atencao: 0,
    inativas: 0
};

/**
 * Centraliza listagem, filtros e ações do módulo de mesas.
 * carregarLista=false evita consultas desnecessárias nas páginas de cadastro e detalhes.
 */
export function useMesas({ carregarLista = true } = {}) {
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

    // Busca a página atual e mantém resumo e paginação sincronizados.
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
            const paginacao = payload?.paginacao || {};

            setMesas(Array.isArray(payload?.mesas) ? payload.mesas : []);
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

    useEffect(() => {
        if (!carregarLista) return undefined;

        carregarMesas().catch(() => {});
        return undefined;
    }, [carregarLista, carregarMesas]);

    // Recalcula automaticamente o tempo de atenção a cada minuto.
    useEffect(() => {
        if (!carregarLista) return undefined;

        const intervalId = window.setInterval(() => {
            carregarMesas({ silencioso: true }).catch(() => {});
        }, 60000);

        return () => window.clearInterval(intervalId);
    }, [carregarLista, carregarMesas]);

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

    const buscarMesaPorId = useCallback(async (id) => {
        const response = await obterMesaPorId(id);
        return response?.data?.mesa || response?.mesa || response;
    }, []);

    // Executa uma ação e, quando necessário, atualiza silenciosamente a listagem.
    const executarAcao = useCallback(async (chave, acao) => {
        setActionLoading(chave);

        try {
            const response = await acao();
            if (carregarLista) await carregarMesas({ silencioso: true });
            return response;
        } finally {
            setActionLoading(null);
        }
    }, [carregarLista, carregarMesas]);

    const criarMesa = useCallback((payload) => (
        executarAcao("create", () => criarMesaApi(payload))
    ), [executarAcao]);

    const atualizarMesa = useCallback((id, payload) => (
        executarAcao(id, () => atualizarMesaApi(id, payload))
    ), [executarAcao]);

    const atualizarCliente = useCallback((id, clienteNome) => (
        executarAcao(id, () => atualizarClienteMesaApi(id, clienteNome))
    ), [executarAcao]);

    const zerarCronometro = useCallback((id) => (
        executarAcao(id, () => zerarCronometroMesaApi(id))
    ), [executarAcao]);

    const alterarStatus = useCallback((id, status) => (
        executarAcao(id, () => alterarStatusMesaApi(id, status))
    ), [executarAcao]);

    const inativarMesa = useCallback((id) => (
        executarAcao(id, () => inativarMesaApi(id))
    ), [executarAcao]);

    const reativarMesa = useCallback((id) => (
        executarAcao(id, () => reativarMesaApi(id))
    ), [executarAcao]);

    const buscarQrCode = useCallback(async (id) => {
        const response = await obterQrCodeMesa(id);
        return response?.data || response;
    }, []);

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
        atualizarCliente,
        zerarCronometro,
        alterarStatus,
        inativarMesa,
        reativarMesa,
        buscarQrCode
    };
}
