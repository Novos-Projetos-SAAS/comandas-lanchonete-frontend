import api from "@/lib/api";

export async function listarComandas({ pagina = 1, status = "", mesaId = "", limite = 30 } = {}) {
    const params = { pagina, limite };

    if (status) params.status = status;
    if (mesaId) params.mesa_id = mesaId;

    const response = await api.get("/comandas", { params });

    return response.data;
}

export async function obterComandaPorId(id) {
    const response = await api.get(`/comandas/${id}`);

    return response.data;
}

export async function abrirComanda(payload) {
    const response = await api.post("/comandas/abrir", payload);

    return response.data;
}

export async function solicitarPagamento(id) {
    const response = await api.patch(`/comandas/${id}/solicitar-pagamento`);

    return response.data;
}

export async function fecharComanda(id, metodo_pagamento) {
    const response = await api.patch(`/comandas/${id}/fechar`, { metodo_pagamento });

    return response.data;
}

export async function cancelarComanda(id) {
    const response = await api.patch(`/comandas/${id}/cancelar`);

    return response.data;
}