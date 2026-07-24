import api from "@/lib/api";

/**
 * Gera um novo link de convite temporário para cadastro.
 * @param {Object} payload - { cargo_id: number }
 */
export async function gerarConvite(payload) {
    const response = await api.post("/convites/gerar", payload);
    return response.data;
}

/**
 * Consome um token de convite e cadastra o novo usuário.
 * @param {Object} payload - { token, nome, email, senha }
 */
export async function consumirConvite(payload) {
    const response = await api.post("/convites/consumir", payload);
    return response.data;
}