import test from 'node:test';
import assert from 'node:assert/strict';
import { montarPlacaQr } from './qr-placard.mjs';

test('monta os dados da plaquinha de QR para impressão', () => {
    const placa = montarPlacaQr({ numeroMesa: 5, estabelecimento: '  Resenha Espetos  ' });
    assert.equal(placa.largura, 1200);
    assert.equal(placa.altura, 1500);
    assert.equal(placa.titulo, 'Mesa 5');
    assert.equal(placa.estabelecimento, 'Resenha Espetos');
    assert.equal(placa.instrucao, 'Escaneie para acessar o cardápio');
    assert.equal(placa.nomeArquivo, 'mesa-05-placa-qrcode.png');
    assert.deepEqual(placa.recorte, { x: 45, y: 45, largura: 1110, altura: 1410 });
    assert.deepEqual(placa.qr, { x: 240, y: 510, tamanho: 720 });
});

test('usa nome genérico quando o estabelecimento não está configurado', () => {
    const placa = montarPlacaQr({ numeroMesa: 12, estabelecimento: '   ' });
    assert.equal(placa.estabelecimento, 'Estabelecimento');
    assert.equal(placa.nomeArquivo, 'mesa-12-placa-qrcode.png');
});
