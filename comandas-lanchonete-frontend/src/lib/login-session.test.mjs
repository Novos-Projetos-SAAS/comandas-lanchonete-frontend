import test from 'node:test';
import assert from 'node:assert/strict';
import { autenticarRenovandoSocket } from './login-session.mjs';

test('login invalida o socket público depois de autenticar e antes de atualizar a sessão', async () => {
    const ordem = [];
    const usuario = { id: 7 };

    const resultado = await autenticarRenovandoSocket({
        autenticar: async () => { ordem.push('autenticar'); return usuario; },
        descartarSocket: () => { ordem.push('descartar-socket'); },
        atualizarSessao: async () => { ordem.push('atualizar-sessao'); }
    });

    assert.equal(resultado, usuario);
    assert.deepEqual(ordem, ['autenticar', 'descartar-socket', 'atualizar-sessao']);
});
