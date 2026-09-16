import test from 'node:test';
import assert from 'node:assert/strict';
import { criarNotificacoesService } from './notificacoes-api.mjs';

test('cliente HTTP usa os verbos, rotas e envelopes reais da Central', async () => {
    const chamadas = [];
    const cliente = {
        get: async (...args) => {
            chamadas.push(['get', ...args]);
            if (args[0] === '/notificacoes') return { data: { notificacoes: [{ id: 1 }], paginacao: { pagina: 1 } } };
            if (args[0] === '/notificacoes/resumo') return { data: { nao_lidas_pendentes: 2 } };
            return { data: { preferencias: { tocar_som: false } } };
        },
        patch: async (...args) => {
            chamadas.push(['patch', ...args]);
            return args[0] === '/notificacoes/lidas'
                ? { data: { atualizadas: 3 } }
                : { data: { notificacao: { id: 12, lida_em: 'agora' } } };
        },
        put: async (...args) => (chamadas.push(['put', ...args]), { data: { preferencias: args[1] } })
    };
    const service = criarNotificacoesService(cliente);
    const preferencias = { tocar_som: false };

    assert.deepEqual(await service.listar({ estado: 'pendentes' }), {
        notificacoes: [{ id: 1 }],
        paginacao: { pagina: 1 }
    });
    assert.deepEqual(await service.resumo(), { nao_lidas_pendentes: 2 });
    assert.deepEqual(await service.marcarLida(12), { id: 12, lida_em: 'agora' });
    assert.equal(await service.marcarTodasLidas(), 3);
    assert.deepEqual(await service.obterPreferencias(), preferencias);
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

test('cliente HTTP propaga rejeições do transporte', async () => {
    const erro = new Error('offline');
    const service = criarNotificacoesService({
        get: async () => { throw erro; }
    });

    await assert.rejects(service.resumo(), erro);
});
