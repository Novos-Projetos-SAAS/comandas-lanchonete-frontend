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

    const fetchUsuarios = useCallback(async (pagina = page, termo = search) => {
        try {
            const response = await listarUsuariosApi(pagina, termo);
            
            // 🟢 Ajustado para ler exatamente o contrato do seu backend:
            // response.data.data.usuarios -> O array de usuários
            // response.data.data.paginacao.total_paginas -> O total de páginas
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
    }, [page, search]);

    useEffect(() => {
        let isMounted = true;

        async function carregar() {
            try {
                const response = await listarUsuariosApi(page, search);
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
    }, [page, search]);

    const setPage = useCallback((novaPagina) => {
        setLoading(true);
        setPageInternal(novaPagina);
    }, []);

    const setSearch = useCallback((novoTermo) => {
        setLoading(true);
        setSearchInternal(novoTermo);
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
            await fetchUsuarios(1, search);
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
            await fetchUsuarios(page, search);
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
            await fetchUsuarios(page, search);
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
        listarUsuarios: fetchUsuarios,
        buscarUsuarioPorId,
        criarUsuario,
        atualizarUsuario,
        deletarUsuario
    };
}