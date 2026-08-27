import api from "@/lib/api";

export async function listarVendas({ pagina = 1, limite = 20, termo = "", status = "", metodoPagamento = "", dataInicio = "", dataFim = "" } = {}) {
    const params = { pagina, limite };
    if (termo.trim()) params.termo = termo.trim();
    if (status) params.status = status;
    if (metodoPagamento) params.metodo_pagamento = metodoPagamento;
    if (dataInicio) params.data_inicio = dataInicio;
    if (dataFim) params.data_fim = dataFim;
    const response = await api.get('/vendas', { params });
    return response.data;
}

export async function obterVendaPorId(id) {
    const response = await api.get(`/vendas/${id}`);
    return response.data;
}

export async function cancelarVenda(id, motivo) {
    const response = await api.patch(`/vendas/${id}/cancelar`, { motivo });
    return response.data;
}
