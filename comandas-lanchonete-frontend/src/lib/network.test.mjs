import test from 'node:test';
import assert from 'node:assert/strict';
import { resolverApiUrl } from './network.mjs';

test('troca localhost pelo host da rede preservando a porta configurada', () => {
    assert.equal(
        resolverApiUrl('http://localhost:3001/api', {
            protocol: 'http:',
            hostname: '192.168.0.225'
        }),
        'http://192.168.0.225:3001/api'
    );
});

test('também preserva outras portas configuradas', () => {
    assert.equal(
        resolverApiUrl('http://127.0.0.1:3333/api', {
            protocol: 'http:',
            hostname: '10.0.0.5'
        }),
        'http://10.0.0.5:3333/api'
    );
});

test('mantém uma API remota explicitamente configurada', () => {
    assert.equal(
        resolverApiUrl('https://api.exemplo.com/api', {
            protocol: 'https:',
            hostname: 'app.exemplo.com'
        }),
        'https://api.exemplo.com/api'
    );
});
