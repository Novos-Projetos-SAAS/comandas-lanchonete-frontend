"use client";

import { useState, useCallback } from "react";
import { 
    gerarConvite as gerarConviteApi, 
    consumirConvite as consumirConviteApi 
} from "@/services/convites.service";

export function useConvites() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [conviteGerado, setConviteGerado] = useState(null);

    const gerarConvite = useCallback(async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const response = await gerarConviteApi(payload);
            const dadosConvite = response?.data?.data || response?.data || response;
            setConviteGerado(dadosConvite);
            return dadosConvite;
        } catch (err) {
            const mensagemErro = err.response?.data?.message || err.message || "Erro ao gerar convite.";
            setError(mensagemErro);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const consumirConvite = useCallback(async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const response = await consumirConviteApi(payload);
            const resultado = response?.data?.data || response?.data || response;
            return resultado;
        } catch (err) {
            const mensagemErro = err.response?.data?.message || err.message || "Erro ao realizar cadastro por convite.";
            setError(mensagemErro);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const limparConvite = useCallback(() => {
        setConviteGerado(null);
        setError(null);
    }, []);

    return {
        loading,
        error,
        conviteGerado,
        gerarConvite,
        consumirConvite,
        limparConvite
    };
}