import { useState, useCallback } from "react";
import { 
    listarCategorias, 
    listarCategoriaPorId, 
    criarCategoria, 
    editarCategoria, 
    inativarCategoria, 
    reativarCategoria 
} from "@/services/categorias.service.js";

export const useCategorias = () => {
    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const carregarTudo = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listarCategorias();
            setLista(data.data || data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const criar = async (dados) => {
        setLoading(true);
        try {
            await criarCategoria(dados);
            await carregarTudo(); // Atualiza a lista após criar
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const editar = async (id, dados) => {
        setLoading(true);
        try {
            await editarCategoria(id, dados);
            await carregarTudo();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const alternarStatus = async (id, ativo) => {
        setLoading(true);
        try {
            if (ativo) await inativarCategoria(id);
            else await reativarCategoria(id);
            await carregarTudo();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        lista,
        loading,
        error,
        carregarTudo,
        criar,
        editar,
        alternarStatus
    };
};