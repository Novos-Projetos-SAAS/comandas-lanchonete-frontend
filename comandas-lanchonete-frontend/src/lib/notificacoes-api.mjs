export function criarNotificacoesService(cliente) {
    return {
        async listar(params) {
            const response = await cliente.get('/notificacoes', { params });
            return response.data;
        },
        async resumo() {
            const response = await cliente.get('/notificacoes/resumo');
            return response.data;
        },
        async marcarLida(id) {
            const response = await cliente.patch(`/notificacoes/${id}/lida`);
            return response.data.notificacao;
        },
        async marcarTodasLidas() {
            const response = await cliente.patch('/notificacoes/lidas');
            return response.data.atualizadas;
        },
        async obterPreferencias() {
            const response = await cliente.get('/notificacoes/preferencias');
            return response.data.preferencias;
        },
        async salvarPreferencias(preferencias) {
            const response = await cliente.put('/notificacoes/preferencias', preferencias);
            return response.data.preferencias;
        }
    };
}
