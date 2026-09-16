import test from 'node:test';
import assert from 'node:assert/strict';
import { criarAuthorizationBearer } from './auth-token.mjs';

test('gera Authorization Bearer quando existe token', () => {
    assert.equal(
        criarAuthorizationBearer('jwt-exemplo'),
        'Bearer jwt-exemplo'
    );
});

test('não gera Authorization quando token está ausente ou vazio', () => {
    assert.equal(criarAuthorizationBearer(), null);
    assert.equal(criarAuthorizationBearer('   '), null);
});
