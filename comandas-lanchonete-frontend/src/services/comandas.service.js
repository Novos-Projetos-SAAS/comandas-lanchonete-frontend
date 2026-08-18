import api from "@/lib/api";

async function listarPorStatus(status) {
    const response = await api.get("/comandas", {
        params: { status, pagina: 1, limite: 50 }
    });
    return response.data?.data?.comandas || [];
}

export async function listarComandasParaReceber() {
    const [abertas, aguardando] = await Promise.all([
        listarPorStatus("Aberta"),
        listarPorStatus("Aguardando Pagamento")
    ]);

    return [...abertas, ...aguardando].sort(
        (a, b) => new Date(a.criado_em) - new Date(b.criado_em)
    );
}

export async function receberComanda(id, metodoPagamento) {
    const response = await api.patch(`/comandas/${id}/fechar`, {
        metodo_pagamento: metodoPagamento
    });
    return response.data;
}
