import api from "@/lib/api";

/**
 * Camada HTTP do módulo de mesas.
 * Cada função representa uma rota protegida do backend.
 */
export async function listarMesas({
    pagina = 1,
    termo = "",
    situacao = "todas",
    limite = 24
} = {}) {
    const params = { pagina, limite, situacao };

    if (termo.trim()) params.termo = termo.trim();

    const response = await api.get("/mesas", { params });
    return response.data;
}

// Retorna os dados cadastrais e operacionais de uma mesa.
export async function obterMesaPorId(id) {
    const response = await api.get(`/mesas/${id}`);
    return response.data;
}

// Cria uma nova mesa.
export async function criarMesa(payload) {
    const response = await api.post("/mesas", payload);
    return response.data;
}

// Atualiza o número cadastral da mesa.
export async function atualizarMesa(id, payload) {
    const response = await api.patch(`/mesas/${id}`, payload);
    return response.data;
}

// Atualiza o cliente da comanda ativa sem alterar o cronômetro.
export async function atualizarClienteMesa(id, clienteNome) {
    const response = await api.patch(`/mesas/${id}/cliente`, {
        cliente_nome: clienteNome
    });
    return response.data;
}

// Registra uma nova interação manual e reinicia o tempo de atenção.
export async function zerarCronometroMesa(id) {
    const response = await api.patch(`/mesas/${id}/zerar-cronometro`);
    return response.data;
}

// Altera o status operacional ou ativa/inativa pelo select de detalhes.
export async function alterarStatusMesa(id, status) {
    const response = await api.patch(`/mesas/${id}/status`, { status });
    return response.data;
}

// Soft delete: a mesa permanece no banco, mas fica indisponível.
export async function inativarMesa(id) {
    const response = await api.patch(`/mesas/${id}/inativar`);
    return response.data;
}

// Reativa a mesa e a devolve ao status Livre.
export async function reativarMesa(id) {
    const response = await api.patch(`/mesas/${id}/reativar`);
    return response.data;
}

// Solicita o link e a imagem Base64 do QR Code.
export async function obterQrCodeMesa(id) {
    const response = await api.get(`/mesas/${id}/qrcode`);
    return response.data;
}
