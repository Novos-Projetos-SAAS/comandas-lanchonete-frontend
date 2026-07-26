import api from "@/lib/api"; // 🟢 Seu interceptor Axios ou wrapper de fetch configurado

// 1. Busca todas as permissões cadastradas no sistema
export async function listarTodas() {
    const response = await api.get("/permissoes");
    return response.data?.data || response.data || [];
}

// 2. Busca apenas as permissões que um usuário específico possui
export async function buscarPorUsuario(usuarioId) {
    const response = await api.get(`/usuarios/${usuarioId}/permissoes`);
    return response.data?.data || response.data || [];
}

// 3. Atualiza (sincroniza) as permissões do usuário
export async function sincronizar(usuarioId, permissoesArray) {
    const response = await api.patch(`/usuarios/${usuarioId}/permissoes`, {
        permissoes: permissoesArray
    });
    return response.data?.data || response.data;
}
