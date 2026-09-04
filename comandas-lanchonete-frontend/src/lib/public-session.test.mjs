import test from 'node:test';
import assert from 'node:assert/strict';

const modulo = await import('./public-session.mjs').catch(() => ({}));
const {
    extrairQrToken,
    rotuloStatusPedido,
    gerarIdempotencyKey
} = modulo;

test('expõe utilitários essenciais do fluxo público', () => {
    assert.equal(typeof extrairQrToken, 'function');
    assert.equal(typeof rotuloStatusPedido, 'function');
    assert.equal(typeof gerarIdempotencyKey, 'function');
});

test('fluxo público não expõe helpers de localStorage', () => {
    assert.equal(modulo.sessaoStorageKey, undefined);
    assert.equal(modulo.carrinhoStorageKey, undefined);
});

test('extrairQrToken aceita URL nova /m/token', () => {
    assert.equal(
        extrairQrToken('https://exemplo.com/m/12345678-abcd-efgh'),
        '12345678-abcd-efgh'
    );
});

test('extrairQrToken aceita link legado /cardapio?token=', () => {
    assert.equal(
        extrairQrToken('https://exemplo.com/cardapio?token=12345678-abcd-efgh'),
        '12345678-abcd-efgh'
    );
});

test('extrairQrToken rejeita QR que não pertence ao fluxo da mesa', () => {
    assert.equal(extrairQrToken('https://google.com/'), null);
    assert.equal(extrairQrToken('texto qualquer'), null);
});

test('rotuloStatusPedido traduz o estado interno para o cliente', () => {
    assert.equal(rotuloStatusPedido('Pendente'), 'Confirmado');
    assert.equal(rotuloStatusPedido('Preparando'), 'Em preparo');
    assert.equal(rotuloStatusPedido('Pronto'), 'Pronto');
    assert.equal(rotuloStatusPedido('Entregue'), 'Entregue');
});

test('gera chave de idempotência quando randomUUID não existe no navegador', () => {
    const cryptoCompat = {
        getRandomValues(bytes) {
            for (let i = 0; i < bytes.length; i += 1) bytes[i] = i + 1;
            return bytes;
        }
    };

    const chave = gerarIdempotencyKey(cryptoCompat);

    assert.match(chave, /^[0-9a-f-]{36}$/);
    assert.equal(chave.length, 36);
});
