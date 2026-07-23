import api from "@/lib/api";

/**
 * Lista todas as categorias cadastradas
 */
export const listarCategoriasAdmin = async ({ search = '', page = 1, statusFilter = 'all', sortColumn = 'id', sortDirection = 'ASC' }) => {
    // Traduzindo a lógica do frontend para os parâmetros que seu backend espera
    let excluidos = 'mixed';
    if (statusFilter === 'false') excluidos = 'false'; // Apenas ativas
    if (statusFilter === 'true') excluidos = 'true';   // Apenas inativas

    const response = await api.get("/categorias/admin", {
        params: {
            search,
            page,
            limit: 10,
            sort: sortColumn,
            order: sortDirection,
            excluidos,       // Filtro de Soft Delete
            status: 'todos'  // Seu fallback de status
        }
    });
    
    // Retornamos o response.data inteiro para que o Hook tenha acesso ao array de categorias E ao "meta" (para a paginação)
    return response.data; 
};

export const listarCategoriasCliente = async () => {
    const response = await api.get("/categorias", {
        params: {
            excluidos: 'false', // Exige explicitamente apenas os ativos
            // limit: 100 // Opcional: Se quiser carregar todas de uma vez para o cliente
        }
    });
    return response.data;
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
    const { data } = await api.patch(`/categorias/${id}`, dados);
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