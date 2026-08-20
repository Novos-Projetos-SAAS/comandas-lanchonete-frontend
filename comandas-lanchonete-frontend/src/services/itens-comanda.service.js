import api from "@/lib/api";

export async function listarItensComanda(comandaId) {
    const response = await api.get(`/itens-comanda/comanda/${comandaId}`);
    return response.data;
}

export async function adicionarItemComanda({ comanda_id, produto_id, quantidade, observacao }) {
    const response = await api.post("/itens-comanda/admin", { comanda_id, produto_id, quantidade, observacao, origem: "Garçom" });
    return response.data;
}

export async function removerItemComanda(itemId) {
    const response = await api.delete(`/itens-comanda/${itemId}`);
    return response.data;
}

export async function listarFilaCozinha() {
    const response = await api.get("/itens-comanda/fila/cozinha");
    return response.data;
}

export async function atualizarStatusItem(itemId, status_pedido) {
    const response = await api.patch(`/itens-comanda/${itemId}/status`, { status_pedido });
    return response.data;
}