import api from "@/lib/api";


export async function listarUsuarios(pagina = 1, termo = "", ativo = "all") {
    const params = { pagina };
    
    // Só envia o termo se o usuário tiver digitado algo
    if (termo) params.termo = termo;
    
    // Se não for "all", envia "true" ou "false" para o backend filtrar
    if (ativo !== "all") params.ativo = ativo;

    const response = await api.get("/usuarios", { params });
    return response.data;
}

export async function obterUsuarioPorId(id) {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
}

export async function criarUsuario(payload) {
    const response = await api.post("/usuarios", payload);
    return response.data;
}

export async function atualizarUsuario(id, payload) {
    const response = await api.patch(`/usuarios/${id}`, payload);
    return response.data;
}

export async function deletarUsuario(id) {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
}