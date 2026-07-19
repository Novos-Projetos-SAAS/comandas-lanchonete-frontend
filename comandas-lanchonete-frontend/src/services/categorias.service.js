import api from "@/lib/api";

/**
 * Lista todas as categorias cadastradas
 */
export const listarCategorias = async () => {
    const { data } = await api.get("/categorias");
    return data;
};

/**
 * Busca uma categoria específica pelo ID
 */
export const listarCategoriaPorId = async (id) => {
    const { data } = await api.get(`/categorias/${id}`);
    return data;
};

/**
 * Cria uma nova categoria
 * @param {Object} dados - Objeto contendo nome, descrição, etc.
 */
export const criarCategoria = async (dados) => {
    const { data } = await api.post("/categorias", dados);
    return data;
};

/**
 * Atualiza os dados de uma categoria existente
 */
export const editarCategoria = async (id, dados) => {
    const { data } = await api.put(`/categorias/${id}`, dados);
    return data;
};

/**
 * Inativa uma categoria (Soft Delete/Toggle)
 */
export const inativarCategoria = async (id) => {
    const { data } = await api.patch(`/categorias/${id}/inativar`);
    return data;
};

/**
 * Reativa uma categoria que estava inativa
 */
export const reativarCategoria = async (id) => {
    const { data } = await api.patch(`/categorias/${id}/reativar`);
    return data;
};