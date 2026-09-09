import test from 'node:test';
import assert from 'node:assert/strict';
import { criarNotificacoesService } from './notificacoes-api.mjs';

test('cliente HTTP usa os verbos, rotas e corpos da Central', async () => {
    const chamadas = [];
    const cliente = {
        get: async (...args) => (chamadas.push(['get', ...args]), { data: args[0] }),
        patch: async (...args) => (chamadas.push(['patch', ...args]), { data: args[0] }),
        put: async (...args) => (chamadas.push(['put', ...args]), { data: args[1] })
    };
    const service = criarNotificacoesService(cliente);
    const preferencias = { tocar_som: false };

    assert.deepEqual(await service.listar({ estado: 'pendentes' }), '/notificacoes');
    assert.equal(await service.resumo(), '/notificacoes/resumo');
    assert.equal(await service.marcarLida(12), '/notificacoes/12/lida');
    assert.equal(await service.marcarTodasLidas(), '/notificacoes/lidas');
    assert.equal(await service.obterPreferencias(), '/notificacoes/preferencias');
    assert.deepEqual(await service.salvarPreferencias(preferencias), preferencias);
    assert.deepEqual(chamadas, [
        ['get', '/notificacoes', { params: { estado: 'pendentes' } }],
        ['get', '/notificacoes/resumo'],
        ['patch', '/notificacoes/12/lida'],
        ['patch', '/notificacoes/lidas'],
        ['get', '/notificacoes/preferencias'],
        ['put', '/notificacoes/preferencias', preferencias]
    ]);
});
