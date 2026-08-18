import api from "@/lib/api";

export async function obterCaixaAtual() {
    const response = await api.get("/caixa/atual");
    return response.data;
}

export async function abrirCaixa(saldoInicial) {
    const response = await api.post("/caixa/abrir", {
        saldo_inicial: Number(saldoInicial || 0)
    });
    return response.data;
}

export async function fecharCaixa(saldoContado) {
    const response = await api.patch("/caixa/fechar", {
        saldo_contado: Number(saldoContado)
    });
    return response.data;
}
