"use client";

import { useCallback, useEffect, useState } from "react";

import {
    abrirComanda as abrirComandaApi,
    listarComandas as listarComandasApi,
    obterComandaPorId
} from "@/services/comandas.service";

import {
    listarMesas as listarMesasApi
} from "@/services/mesas.service";

/**
 * Centraliza listagem, filtros e ações relacionadas
 * às comandas.
 */
export function useComandas({
    carregarLista = true
} = {}) {
    const [comandas, setComandas] = useState([]);
    const [loading, setLoading] = useState(carregarLista);

    const [page, setPageInternal] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [statusFilter, setStatusFilterInternal] =
        useState("");

    const [lastUpdate, setLastUpdate] = useState(null);

    /*
     * Mesas utilizadas especificamente no cadastro
     * de uma nova comanda.
     */
    const [mesasDisponiveis, setMesasDisponiveis] =
        useState([]);

    const [loadingMesas, setLoadingMesas] =
        useState(false);

    /**
     * Carrega as comandas utilizando os filtros atuais.
     */
    const carregarComandas = useCallback(
        async ({ silencioso = false } = {}) => {
            if (!silencioso) {
                setLoading(true);
            }

            try {
                const response = await listarComandasApi({
                    pagina: page,
                    status: statusFilter,
                    limite: 30
                });

                const payload =
                    response?.data ||
                    response;

                const paginacao =
                    payload?.paginacao ||
                    {};

                setComandas(
                    Array.isArray(payload?.comandas)
                        ? payload.comandas
                        : []
                );

                setTotalPages(
                    paginacao.total_paginas || 1
                );

                setTotalRecords(
                    paginacao.total_registros || 0
                );

                setLastUpdate(new Date());

                if (
                    paginacao.pagina_atual &&
                    paginacao.pagina_atual !== page
                ) {
                    setPageInternal(
                        paginacao.pagina_atual
                    );
                }
            } catch (error) {
                console.error(
                    "Erro ao carregar comandas:",
                    error
                );

                setComandas([]);

                throw error;
            } finally {
                if (!silencioso) {
                    setLoading(false);
                }
            }
        },
        [
            page,
            statusFilter
        ]
    );

    /**
     * Carrega somente mesas:
     *
     * - ativas;
     * - livres;
     * - disponíveis para receber uma nova comanda.
     *
     * O backend suporta no máximo 120 por consulta,
     * quantidade mais que suficiente para o formulário.
     */
    const carregarMesasDisponiveis =
        useCallback(async () => {
            setLoadingMesas(true);

            try {
                const response =
                    await listarMesasApi({
                        pagina: 1,
                        situacao: "livres",
                        limite: 120
                    });

                const payload =
                    response?.data ||
                    response;

                const lista =
                    Array.isArray(payload?.mesas)
                        ? payload.mesas
                        : [];

                setMesasDisponiveis(lista);

                return lista;
            } catch (error) {
                console.error(
                    "Erro ao carregar mesas disponíveis:",
                    error
                );

                setMesasDisponiveis([]);

                throw error;
            } finally {
                setLoadingMesas(false);
            }
        }, []);

    /**
     * Carregamento inicial da tela de comandas.
     */
    useEffect(() => {
        if (!carregarLista) {
            return undefined;
        }

        carregarComandas().catch(() => { });

        return undefined;
    }, [
        carregarLista,
        carregarComandas
    ]);

    /**
     * Atualização automática da tela operacional.
     */
    useEffect(() => {
        if (!carregarLista) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            carregarComandas({
                silencioso: true
            }).catch(() => { });
        }, 30000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [
        carregarLista,
        carregarComandas
    ]);

    const setPage = useCallback((novaPagina) => {
        setPageInternal(novaPagina);
    }, []);

    const setStatusFilter = useCallback((novoStatus) => {
        setStatusFilterInternal(novoStatus);
        setPageInternal(1);
    }, []);

    /**
     * Busca uma comanda específica.
     */
    const buscarComandaPorId =
        useCallback(async (id) => {
            const response =
                await obterComandaPorId(id);

            return (
                response?.data?.comanda ||
                response?.comanda ||
                response
            );
        }, []);

    /**
     * Abre uma nova comanda.
     */
    const abrirComanda = useCallback(
        async (payload) => {
            const response =
                await abrirComandaApi(payload);

            /*
             * Caso essa função seja chamada de uma tela
             * que também exiba a listagem, atualizamos
             * os cards após a abertura.
             */
            if (carregarLista) {
                await carregarComandas({
                    silencioso: true
                });
            }

            return response;
        },
        [
            carregarLista,
            carregarComandas
        ]
    );

    return {
        comandas,
        loading,

        page,
        setPage,
        totalPages,
        totalRecords,

        statusFilter,
        setStatusFilter,

        lastUpdate,

        mesasDisponiveis,
        loadingMesas,

        listarComandas: carregarComandas,
        carregarMesasDisponiveis,

        buscarComandaPorId,
        abrirComanda
    };
}