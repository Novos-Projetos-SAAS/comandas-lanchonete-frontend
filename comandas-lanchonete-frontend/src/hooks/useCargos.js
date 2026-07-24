"use client";

import { useState, useEffect, useCallback } from "react";
import { listarCargos as listarCargosApi } from "@/services/cargos.service"; 

export function useCargos() {
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCargos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listarCargosApi();
            
            // 🟢 Blindagem: Procura o array de cargos em qualquer nível da resposta da API
            const payload = data?.data?.cargos || data?.data || data?.cargos || data;
            const lista = Array.isArray(payload) ? payload : [];
            
            setCargos(lista);
            return lista;
        } catch (error) {
            console.error("🔴 Erro ao listar cargos no Hook:", error);
            setCargos([]);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function carregar() {
            try {
                const data = await listarCargosApi();
                if (isMounted) {
                    const payload = data?.data?.cargos || data?.data || data?.cargos || data;
                    const lista = Array.isArray(payload) ? payload : [];
                    setCargos(lista);
                }
            } catch (error) {
                if (isMounted) {
                    console.error("🔴 Erro ao listar cargos no Hook:", error);
                    setCargos([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        carregar();

        return () => {
            isMounted = false;
        };
    }, []);

    return {
        cargos,
        loading,
        listarCargos: fetchCargos
    };
}