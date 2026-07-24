"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    listarUsuarios as listarUsuariosApi, 
    obterUsuarioPorId, 
    criarUsuario as criarUsuarioApi, 
    atualizarUsuario as atualizarUsuarioApi, 
    deletarUsuario as deletarUsuarioApi 
} from "@/services/usuarios.service";

export function useUsuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPageInternal] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearchInternal] = useState("");
    const [statusFilter, setStatusFilterInternal] = useState("all"); // 🟢 Estado do filtro no Hook

    const fetchUsuarios = useCallback(async (pagina = page, termo = search, status = statusFilter) => {
        try {
            // 🟢 Passa os 3 parâmetros corretamente para a API
            const response = await listarUsuariosApi(pagina, termo, status);
            
            const payloadData = response?.data?.data || response?.data || response;
            const itensBrutos = payloadData?.usuarios || payloadData?.data || payloadData;
            const itens = Array.isArray(itensBrutos) ? itensBrutos : [];
            
            const total = payloadData?.paginacao?.total_paginas || payloadData?.totalPages || 1;
            
            setUsuarios(itens);
            setTotalPages(total);
        } catch (error) {
            console.error("🔴 Erro ao listar usuários no Hook:", error);
            setUsuarios([]);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        let isMounted = true;

        async function carregar() {
            setLoading(true);
            try {
                const response = await listarUsuariosApi(page, search, statusFilter);
                if (isMounted) {
                    const payloadData = response?.data?.data || response?.data || response;
                    const itensBrutos = payloadData?.usuarios || payloadData?.data || payloadData;
                    const itens = Array.isArray(itensBrutos) ? itensBrutos : [];
                    const total = payloadData?.paginacao?.total_paginas || payloadData?.totalPages || 1;
                    
                    setUsuarios(itens);
                    setTotalPages(total);
                }
            } catch (error) {
                if (isMounted) {
                    console.error("🔴 Erro ao listar usuários no Hook:", error);
                    setUsuarios([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        carregar();

        return () => {
            isMounted = false;
        };
    }, [page, search, statusFilter]); // 🟢 Reage a mudanças na página, busca e status

    const setPage = useCallback((novaPagina) => {
        setPageInternal((prev) => {
            if (prev !== novaPagina) {
                setLoading(true);
                return novaPagina;
            }
            return prev;
        });
    }, []);

    const setSearch = useCallback((novoTermo) => {
        setSearchInternal((prev) => {
            if (prev !== novoTermo) {
                setLoading(true);
                return novoTermo;
            }
            return prev;
        });
    }, []);

    const setStatusFilter = useCallback((novoStatus) => {
        setStatusFilterInternal((prev) => {
            if (prev !== novoStatus) {
                setLoading(true);
                setPageInternal(1); // 🟢 Volta para página 1 ao filtrar por status
                return novoStatus;
            }
            return prev;
        });
    }, []);

    const buscarUsuarioPorId = async (id) => {
        try {
            return await obterUsuarioPorId(id);
        } catch (error) {
            console.error("🔴 Erro ao buscar usuário por ID no Hook:", error);
            throw error;
        }
    };

    const criarUsuario = async (payload) => {
        setLoading(true);
        try {
            const resultado = await criarUsuarioApi(payload);
            await fetchUsuarios(1, search, statusFilter);
            return resultado;
        } catch (error) {
            setLoading(false);
            console.error("🔴 Erro ao criar usuário no Hook:", error);
            throw error;
        }
    };

    const atualizarUsuario = async (id, payload) => {
        setLoading(true);
        try {
            const resultado = await atualizarUsuarioApi(id, payload);
            await fetchUsuarios(page, search, statusFilter);
            return resultado;
        } catch (error) {
            setLoading(false);
            console.error("🔴 Erro ao atualizar usuário no Hook:", error);
            throw error;
        }
    };

    const deletarUsuario = async (id) => {
        setLoading(true);
        try {
            await deletarUsuarioApi(id);
            await fetchUsuarios(page, search, statusFilter);
        } catch (error) {
            setLoading(false);
            console.error("🔴 Erro ao deletar usuário no Hook:", error);
            throw error;
        }
    };

    return {
        usuarios,
        loading,
        page,
        setPage,
        totalPages,
        search,
        setSearch,
        statusFilter,     // 🟢 Exportado para o Client
        setStatusFilter,  // 🟢 Exportado para o Client
        listarUsuarios: fetchUsuarios,
        buscarUsuarioPorId,
        criarUsuario,
        atualizarUsuario,
        deletarUsuario
    };
}