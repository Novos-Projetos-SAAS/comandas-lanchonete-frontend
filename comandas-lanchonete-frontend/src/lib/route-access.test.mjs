import test from 'node:test';
import assert from 'node:assert/strict';

const modulo = await import('./route-access.mjs').catch(() => ({}));
const { rotaPublica } = modulo;

test('expõe o helper de rota pública', () => {
    assert.equal(typeof rotaPublica, 'function');
});

test('home e fluxo QR são públicos', () => {
    assert.equal(rotaPublica('/'), true);
    assert.equal(rotaPublica('/cardapio'), true);
    assert.equal(rotaPublica('/cardapio?token=abc'), true);
    assert.equal(rotaPublica('/m/abc'), true);
    assert.equal(rotaPublica('/m/abc/cardapio'), true);
});

test('rotas administrativas continuam protegidas', () => {
    assert.equal(rotaPublica('/admin'), false);
    assert.equal(rotaPublica('/admin/cozinha'), false);
});
