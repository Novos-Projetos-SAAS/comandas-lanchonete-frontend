import test from 'node:test';
import assert from 'node:assert/strict';
import { criarControleCooldownSom } from './notification-sound.mjs';

test('cooldown bloqueia sons por 3 segundos e libera depois', () => {
    let agora = 1000;
    const controle = criarControleCooldownSom({ intervaloMs: 3000, agora: () => agora });

    assert.equal(controle.tentar(), true);
    agora = 3999;
    assert.equal(controle.tentar(), false);
    agora = 4000;
    assert.equal(controle.tentar(), true);
});
