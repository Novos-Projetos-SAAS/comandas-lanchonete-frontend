import api from '@/lib/api';

export async function obterEstabelecimentoPublico() {
    const response = await api.get('/publico/estabelecimento');
    return response.data?.data?.estabelecimento;
}

export async function obterMesaPublica(qrToken) {
    const response = await api.get(`/publico/mesas/${encodeURIComponent(qrToken)}`);
    return response.data?.data;
}

export async function criarSessaoPublica({ qr_token, nome, acompanhado = false }) {
    const response = await api.post('/publico/sessoes', {
        qr_token,
        nome,
        acompanhado
    });
    return response.data?.data;
}

export async function obterSessaoAtual() {
    const response = await api.get('/publico/sessoes/me');
    return response.data?.data?.sessao;
}

export async function obterCardapioPublico() {
    const response = await api.get('/publico/cardapio');
    return response.data?.data;
}

export async function criarPedidoPublico(payload) {
    const response = await api.post('/publico/pedidos', payload);
    return response.data?.data;
}

export async function obterMeusPedidos() {
    const response = await api.get('/publico/pedidos/me');
    return response.data?.data?.pedidos || [];
}

export async function obterResumoComanda() {
    const response = await api.get('/publico/comanda/resumo');
    return response.data?.data?.resumo;
}

export async function solicitarContaPublica() {
    const response = await api.post('/publico/comanda/solicitar-conta', {});
    return response.data?.data?.resumo;
}
