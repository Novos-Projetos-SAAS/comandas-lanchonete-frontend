import api from "@/lib/api";


// Busca se o caixa está aberto e os dados dele
export const buscarStatusAtual = async () => {
    const response = await api.get('/caixa/atual');
    return response.data;
};

// Abre um novo caixa
export const abrir = async (saldo_inicial) => {
    const response = await api.post('/caixa/abrir', { saldo_inicial });
    return response.data;
};

// Fecha o caixa atual
export const fechar = async () => {
    const response = await api.patch('/caixa/fechar');
    return response.data;
};

// Lista o extrato (sangrias, suprimentos, vendas) do caixa logado
export const listarMovimentacoes = async () => {
    const response = await api.get('/caixa/movimentacoes');
    return response.data;
};

// Registra uma sangria ou suprimento
export const registrarMovimento = async (dados) => {
    // dados = { tipo, categoria, valor, observacao }
    const response = await api.post('/caixa/movimentacao', dados);
    return response.data;
};