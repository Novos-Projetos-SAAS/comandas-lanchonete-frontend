import api from "@/lib/api";

/**
 * Camada HTTP do módulo de mesas.
 * Nenhuma regra de interface fica aqui: cada função apenas monta a requisição e devolve o payload.
 */
export async function listarMesas({
    pagina = 1,
    termo = "",
    situacao = "todas",
    limite = 24
} = {}) {
    // Parâmetros seguem os nomes esperados pelo controller do backend.
    const params = { pagina, limite, situacao };

    if (termo.trim()) params.termo = termo.trim();

    const response = await api.get("/mesas", { params });
    return response.data;
}

// Retorna os detalhes operacionais e cadastrais de uma mesa.
export async function obterMesaPorId(id) {
    const response = await api.get(`/mesas/${id}`);
    return response.data;
}

// Cria uma nova mesa com o número informado.
export async function criarMesa(payload) {
    const response = await api.post("/mesas", payload);
    return response.data;
}

// Atualiza o número da mesa mantendo as demais regras no backend.
export async function atualizarMesa(id, payload) {
    const response = await api.patch(`/mesas/${id}`, payload);
    return response.data;
}

// Soft delete: a mesa continua no banco, mas fica indisponível.
export async function inativarMesa(id) {
    const response = await api.patch(`/mesas/${id}/inativar`);
    return response.data;
}

// Remove a marca de inativação e devolve a mesa ao uso.
export async function reativarMesa(id) {
    const response = await api.patch(`/mesas/${id}/reativar`);
    return response.data;
}

// Solicita ao backend o link e a imagem Base64 do QR Code.
export async function obterQrCodeMesa(id) {
    const response = await api.get(`/mesas/${id}/qrcode`);
    return response.data;
}
