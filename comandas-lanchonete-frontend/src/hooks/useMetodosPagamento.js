"use client";

import { useCallback, useEffect, useState } from "react";
import { listarMetodosPagamentoAtivos } from "@/services/metodos-pagamento.service";

export function useMetodosPagamento({ carregarAutomaticamente = true } = {}) {
    const [metodosPagamento, setMetodosPagamento] = useState([]);
    const [loadingMetodosPagamento, setLoadingMetodosPagamento] = useState(false);
    const [erroMetodosPagamento, setErroMetodosPagamento] = useState("");

    const carregarMetodosPagamento = useCallback(async ({ silencioso = false } = {}) => {
        if (!silencioso) setLoadingMetodosPagamento(true);

        try {
            setErroMetodosPagamento("");
            const response = await listarMetodosPagamentoAtivos();
            const metodos = response?.data?.metodos || response?.metodos || [];
            const ativos = Array.isArray(metodos) ? metodos.filter(metodo => metodo.ativo !== false) : [];
            setMetodosPagamento(ativos);
            return ativos;
        } catch (error) {
            setMetodosPagamento([]);
            setErroMetodosPagamento(error.response?.data?.message || "Não foi possível carregar os métodos de pagamento.");
            throw error;
        } finally {
            if (!silencioso) setLoadingMetodosPagamento(false);
        }
    }, []);

    useEffect(() => {
        if (!carregarAutomaticamente) return;
        carregarMetodosPagamento().catch(() => {});
    }, [carregarAutomaticamente, carregarMetodosPagamento]);

    return { metodosPagamento, loadingMetodosPagamento, erroMetodosPagamento, carregarMetodosPagamento };
}
