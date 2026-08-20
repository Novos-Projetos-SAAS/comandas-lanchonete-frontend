import api from "@/lib/api";

export async function listarMetodosPagamentoAtivos() {
    const response = await api.get("/metodos-pagamento", { params: { ativo: true, pagina: 1, limite: 100 } });
    return response.data;
}