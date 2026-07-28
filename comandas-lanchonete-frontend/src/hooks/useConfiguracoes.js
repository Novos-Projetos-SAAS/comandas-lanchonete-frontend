"use client";

import { useCallback, useEffect, useState } from "react";
import {
    alterarStatusLoja,
    obterConfiguracoesLoja
} from "@/services/configuracoes.service";

/**
 * Centraliza carregamento, atualização e polling da tela de configurações.
 * O intervalo permite perceber alterações feitas por outro administrador.
 */
export function useConfiguracoes() {
    const [statusLoja, setStatusLoja] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [erro, setErro] = useState("");

    const carregarConfiguracoes = useCallback(async ({ silencioso = false } = {}) => {
        if (!silencioso) setLoading(true);

        try {
            const response = await obterConfiguracoesLoja();
            const status = response?.data?.status || response?.status || response?.data || response;

            setStatusLoja(status);
            setErro("");
            return status;
        } catch (error) {
            if (!silencioso) {
                setErro(error.response?.data?.message || "Não foi possível carregar as configurações.");
            }
            throw error;
        } finally {
            if (!silencioso) setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarConfiguracoes().catch(() => {});

        const intervalId = window.setInterval(() => {
            carregarConfiguracoes({ silencioso: true }).catch(() => {});
        }, 30000);

        return () => window.clearInterval(intervalId);
    }, [carregarConfiguracoes]);

    const alterarFuncionamento = useCallback(async ({ estaAberta, motivo }) => {
        setActionLoading(true);

        try {
            const response = await alterarStatusLoja({ estaAberta, motivo });
            const status = response?.data?.status || response?.status || response?.data || response;

            setStatusLoja(status);
            setErro("");
            return response;
        } finally {
            setActionLoading(false);
        }
    }, []);

    return {
        statusLoja,
        loading,
        actionLoading,
        erro,
        carregarConfiguracoes,
        alterarFuncionamento
    };
}
