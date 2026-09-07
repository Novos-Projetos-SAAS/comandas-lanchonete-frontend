import api from '@/lib/api';

export async function criarPedidoAdmin(payload) {
    const response = await api.post('/pedidos/admin', payload);
    return response.data?.data;
}
