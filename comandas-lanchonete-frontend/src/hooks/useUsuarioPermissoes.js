"use client";

import { useState, useCallback, useMemo } from "react";
// 🟢 Importando as funções diretamente, sem o objeto agrupado!
import { listarTodas, buscarPorUsuario, sincronizar } from "@/services/permissoes.service";
import Swal from "sweetalert2";

export function useUsuarioPermissoes(userId) {
    const [todasPermissoes, setTodasPermissoes] = useState({});
    const [permissoesSelecionadas, setPermissoesSelecionadas] = useState(new Set());
    const [permissoesIniciais, setPermissoesIniciais] = useState(new Set());
    
    const [loading, setLoading] = useState(true);
    const [acessoNegado, setAcessoNegado] = useState(false);

    // 🟢 Busca as permissões gerais e as do usuário simultaneamente
    const fetchPermissoes = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setAcessoNegado(false);

        try {
            // Chamando as funções diretamente
            const [todasRes, usuarioRes] = await Promise.all([
                listarTodas(),
                buscarPorUsuario(userId)
            ]);

            // 1. Agrupa as permissões por módulo caso o backend devolva um array plano
            let agrupadas = {};
            if (Array.isArray(todasRes)) {
                todasRes.forEach(perm => {
                    const modulo = perm.modulo || perm.nome.split(".")[0] || "Geral";
                    if (!agrupadas[modulo]) agrupadas[modulo] = [];
                    agrupadas[modulo].push(perm);
                });
            } else {
                agrupadas = todasRes; // Se já vier agrupado em objeto { modulo: [...] }
            }
            setTodasPermissoes(agrupadas);

            // 2. Transforma as permissões do usuário em um Set de nomes/chaves
            const listaUsuario = Array.isArray(usuarioRes) 
                ? usuarioRes.map(p => typeof p === 'object' ? p.nome : p)
                : [];
            
            const setInicial = new Set(listaUsuario);
            setPermissoesSelecionadas(new Set(setInicial));
            setPermissoesIniciais(new Set(setInicial));

        } catch (error) {
            console.error("Erro ao carregar permissões:", error);
            if (error.response?.status === 403) {
                setAcessoNegado(true);
            } else {
                Swal.fire({
                    title: "Erro de Carregamento",
                    text: "Não foi possível carregar a lista de acessos deste usuário.",
                    icon: "error",
                    iconColor: "#dc2626",
                    confirmButtonColor: "#dc2626"
                });
            }
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // 🟢 Alterna uma permissão no Set
    const handleToggle = useCallback((nomePermissao) => {
        setPermissoesSelecionadas(prev => {
            const novoSet = new Set(prev);
            if (novoSet.has(nomePermissao)) {
                novoSet.delete(nomePermissao);
            } else {
                novoSet.add(nomePermissao);
            }
            return novoSet;
        });
    }, []);

    // 🟢 Verifica em tempo real se o usuário mexeu em algum switch
    const hasUnsavedChanges = useMemo(() => {
        if (permissoesSelecionadas.size !== permissoesIniciais.size) return true;
        for (let perm of permissoesSelecionadas) {
            if (!permissoesIniciais.has(perm)) return true;
        }
        return false;
    }, [permissoesSelecionadas, permissoesIniciais]);

    // 🟢 Envia as alterações para a API
    const handleSave = async () => {
        try {
            const arrayPermissoes = Array.from(permissoesSelecionadas);
            // Chamando a função de sincronizar diretamente
            await sincronizar(userId, arrayPermissoes);

            setPermissoesIniciais(new Set(permissoesSelecionadas));

            await Swal.fire({
                title: "Acessos Atualizados!",
                text: "As permissões do usuário foram salvas com sucesso.",
                icon: "success",
                iconColor: "#16a34a",
                confirmButtonColor: "#16a34a"
            });

            return true;
        } catch (error) {
            Swal.fire({
                title: "Erro ao Salvar",
                text: error.response?.data?.message || "Ocorreu uma falha ao tentar atualizar os acessos.",
                icon: "error",
                iconColor: "#dc2626",
                confirmButtonColor: "#dc2626"
            });
            return false;
        }
    };

    return {
        todasPermissoes,
        permissoesSelecionadas,
        loading,
        hasUnsavedChanges,
        acessoNegado,
        fetchPermissoes,
        handleToggle,
        handleSave
    };
}