import api from "@/lib/api";


export async function listarUsuarios(page = 1, search = "") {
    const response = await api.get("/usuarios", {
        params: { page, search }
    });

    console.log(response);


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
    const response = await api.put(`/usuarios/${id}`, payload);
    return response.data;
}

export async function deletarUsuario(id) {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
}