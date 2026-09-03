import api from '@/lib/api';

function headersSessao(sessionToken) {
    return {
        headers: {
            'X-Session-Token': sessionToken
        }
    };
}

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

export async function obterSessaoAtual(sessionToken) {
    const response = await api.get('/publico/sessoes/me', headersSessao(sessionToken));
    return response.data?.data?.sessao;
}

export async function obterCardapioPublico(sessionToken) {
    const response = await api.get('/publico/cardapio', headersSessao(sessionToken));
    return response.data?.data;
}

export async function criarPedidoPublico(sessionToken, payload) {
    const response = await api.post('/publico/pedidos', payload, headersSessao(sessionToken));
    return response.data?.data;
}

export async function obterMeusPedidos(sessionToken) {
    const response = await api.get('/publico/pedidos/me', headersSessao(sessionToken));
    return response.data?.data?.pedidos || [];
}

export async function obterResumoComanda(sessionToken) {
    const response = await api.get('/publico/comanda/resumo', headersSessao(sessionToken));
    return response.data?.data?.resumo;
}

export async function solicitarContaPublica(sessionToken) {
    const response = await api.post(
        '/publico/comanda/solicitar-conta',
        {},
        headersSessao(sessionToken)
    );
    return response.data?.data?.resumo;
}
