import api from "@/lib/api";

export const buscarStatusAtual = async () => {
    const response = await api.get('/caixa/atual');
    return response.data;
};

export const abrir = async saldo_inicial => {
    const response = await api.post('/caixa/abrir', { saldo_inicial });
    return response.data;
};

export const fechar = async () => {
    const response = await api.patch('/caixa/fechar');
    return response.data;
};

export const listarMovimentacoes = async () => {
    const response = await api.get('/caixa/movimentacoes');
    return response.data;
};

export const registrarMovimento = async dados => {
    const response = await api.post('/caixa/movimentacao', dados);
    return response.data;
};

export const registrarVendaRapida = async dados => {
    const response = await api.post('/caixa/venda-rapida', dados);
    return response.data;
};
