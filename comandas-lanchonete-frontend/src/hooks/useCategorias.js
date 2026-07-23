import { useState, useEffect, useCallback } from "react";
import { 
    listarCategoriasAdmin, 
    listarCategoriasCliente, 
    listarCategoriaPorId, 
    criarCategoria, 
    editarCategoria, 
    inativarCategoria, // 🟢 Importações atualizadas
    reativarCategoria  // 🟢 Importações atualizadas
} from "@/services/categorias.service.js";

export const useCategorias = () => {
    // Estados de Listagem e Paginação
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false); // Para botões de salvar/deletar
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Estados de Filtros e Ordenação
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("false"); // Padrão: mostra só ativas
    const [sortColumn, setSortColumn] = useState("id");
    const [sortDirection, setSortDirection] = useState("ASC");

    // ==========================================
    // LER (Listar todos)
    // ==========================================
    const refrescarLista = useCallback(async () => {
        setLoading(true);
        try {
            const response = await listarCategoriasAdmin({ 
                search, page, statusFilter, sortColumn, sortDirection 
            });

            console.log(response);
            
            setCategorias(response.data?.data || response.data || []);
            setTotalPages(response.meta?.totalPages || response.data?.meta?.totalPages || 1);
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, sortColumn, sortDirection]);

    // Carregamento inicial e reações a filtros
    useEffect(() => {
        const timer = setTimeout(() => {
            refrescarLista();
        }, 0);
        
        return () => clearTimeout(timer);
    }, [refrescarLista]);

    // Lógica para clicar nas colunas da tabela e ordenar
    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
        } else {
            setSortColumn(column);
            setSortDirection("ASC");
        }
    };

    // ==========================================
    // LER (Por ID) - Para o formulário de edição
    // ==========================================
    const obterPorId = async (id) => {
        setActionLoading(true);
        try {
            return await listarCategoriaPorId(id);
        } catch (error) {
            console.error("Erro ao buscar categoria por ID:", error);
            throw error;
        } finally {
            setActionLoading(false);
        }
    };

    // ==========================================
    // CRIAR
    // ==========================================
    const criar = async (dados) => {
        setActionLoading(true);
        try {
            const response = await criarCategoria(dados);
            await refrescarLista(); // Atualiza a tabela na mesma hora
            return response;
        } catch (error) {
            console.error("Erro ao criar categoria:", error);
            throw error;
        } finally {
            setActionLoading(false);
        }
    };

    // ==========================================
    // ATUALIZAR (Editar)
    // ==========================================
    const editar = async (id, dados) => {
        setActionLoading(true);
        try {
            const response = await editarCategoria(id, dados);
            await refrescarLista(); // Atualiza a tabela na mesma hora
            return response;
        } catch (error) {
            console.error("Erro ao editar categoria:", error);
            throw error;
        } finally {
            setActionLoading(false);
        }
    };

    // ==========================================
    // STATUS (Inativar/Reativar - Soft Delete)
    // ==========================================
    const alternarStatus = async (id, status) => {
        setActionLoading(true);
        try {
            let response;
            
            // 🟢 Lógica roteadora: se status for true, reativa. Se for false, inativa.
            if (status) {
                response = await reativarCategoria(id);
            } else {
                response = await inativarCategoria(id);
            }

            await refrescarLista(); // A linha some/aparece da tabela automaticamente
            return response;
        } catch (error) {
            console.error("Erro ao alterar status:", error);
            throw error;
        } finally {
            setActionLoading(false);
        }
    };

    // Retornamos tudo que os componentes podem precisar
    return {
        // Estados
        categorias, 
        loading, 
        actionLoading, 
        page, 
        totalPages,
        sortColumn, 
        sortDirection, 
        statusFilter, 
        
        // Ações de Estado (Setters)
        setPage, 
        setStatusFilter,
        setSearch, 
        handleSort, 
        
        // Ações da API (CRUD)
        refrescarLista,
        obterPorId,
        criar,
        editar,
        alternarStatus
    };
};