import test from 'node:test';
import assert from 'node:assert/strict';

import { criarControladorEnvioPedido } from './admin-order-submit.mjs';
import { chaveStorageRascunho, lerRascunho } from './admin-order-draft.mjs';

const usuarioId = 4;
const comandaId = 9;
const rascunho = {
    itens: [{ linha_id: 'linha-1', produto_id: 7, nome: 'X-Salada', preco_estimado: 12.5, quantidade: 2, observacao: ' Sem cebola ' }],
    idempotency_key: null
};

function storageFake() {
    const values = new Map();
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key),
        values
    };
}

function criarControlador({ storage = storageFake(), gerarChave = () => 'chave-1', request = async () => ({ id: 1 }) } = {}) {
    return {
        storage,
        controlador: criarControladorEnvioPedido({ storage, usuarioId, comandaId, gerarChave, request })
    };
}

test('persiste uma chave antes da rede e envia somente o payload normalizado', async () => {
    const storage = storageFake();
    let persistidoAntesDaRequest;
    let payload;
    const { controlador } = criarControlador({
        storage,
        request: async valor => {
            persistidoAntesDaRequest = lerRascunho(storage, usuarioId, comandaId);
            payload = valor;
            return { id: 1 };
        }
    });

    await controlador.enviar(rascunho);

    assert.deepEqual(persistidoAntesDaRequest, {
        itens: [{ linha_id: 'linha-1', produto_id: 7, nome: 'X-Salada', preco_estimado: 12.5, quantidade: 2, observacao: 'Sem cebola' }],
        idempotency_key: 'chave-1'
    });
    assert.deepEqual(payload, {
        comanda_id: 9,
        idempotency_key: 'chave-1',
        itens: [{ produto_id: 7, quantidade: 2, observacao: 'Sem cebola' }]
    });
    assert.equal(storage.getItem(chaveStorageRascunho(usuarioId, comandaId)), null);
});

test('mantém a chave salva após timeout e a reutiliza no retry', async () => {
    const storage = storageFake();
    const payloads = [];
    let tentativa = 0;
    const { controlador } = criarControlador({
        storage,
        request: async payload => {
            payloads.push(payload);
            tentativa += 1;
            if (tentativa === 1) throw new Error('timeout');
            return { id: 1 };
        }
    });

    await assert.rejects(controlador.enviar(rascunho), /timeout/);
    const salvo = lerRascunho(storage, usuarioId, comandaId);
    assert.equal(salvo.idempotency_key, 'chave-1');
    await controlador.enviar(salvo);

    assert.deepEqual(payloads.map(payload => payload.idempotency_key), ['chave-1', 'chave-1']);
    assert.equal(storage.getItem(chaveStorageRascunho(usuarioId, comandaId)), null);
});

test('mantém o rascunho salvo após erro da request', async () => {
    const { storage, controlador } = criarControlador({ request: async () => { throw new Error('indisponível'); } });

    await assert.rejects(controlador.enviar(rascunho), /indisponível/);

    assert.equal(lerRascunho(storage, usuarioId, comandaId).idempotency_key, 'chave-1');
});

test('gera outra chave quando uma mutação zerou a chave do rascunho', async () => {
    const storage = storageFake();
    const payloads = [];
    let chaves = 0;
    const { controlador } = criarControlador({
        storage,
        gerarChave: () => `chave-${++chaves}`,
        request: async payload => { payloads.push(payload); throw new Error('erro'); }
    });

    await assert.rejects(controlador.enviar(rascunho), /erro/);
    await assert.rejects(controlador.enviar({ ...rascunho, itens: [...rascunho.itens], idempotency_key: null }), /erro/);

    assert.deepEqual(payloads.map(payload => payload.idempotency_key), ['chave-1', 'chave-2']);
});

test('compartilha a mesma promise para envios concorrentes', async () => {
    let resolver;
    let chamadas = 0;
    const { controlador } = criarControlador({
        request: () => {
            chamadas += 1;
            return new Promise(resolve => { resolver = resolve; });
        }
    });

    const primeira = controlador.enviar(rascunho);
    const segunda = controlador.enviar(rascunho);
    assert.strictEqual(primeira, segunda);
    assert.equal(controlador.estaEnviando(), true);
    await Promise.resolve();
    resolver({ id: 1 });
    await primeira;
    assert.equal(chamadas, 1);
    assert.equal(controlador.estaEnviando(), false);
});

test('não envia rascunho vazio', async () => {
    let chamadas = 0;
    const { controlador } = criarControlador({ request: async () => { chamadas += 1; } });

    assert.equal(await controlador.enviar({ itens: [], idempotency_key: null }), null);
    assert.equal(chamadas, 0);
});

test('limpa o rascunho quando a comanda deixa de estar Aberta', () => {
    for (const status of ['Paga', 'Cancelada', 'Aguardando Pagamento']) {
        const storage = storageFake();
        storage.setItem(chaveStorageRascunho(usuarioId, comandaId), JSON.stringify({ ...rascunho, idempotency_key: 'chave-1' }));
        const { controlador } = criarControlador({ storage });
        controlador.limparSeComandaFechada(status);
        assert.equal(storage.getItem(chaveStorageRascunho(usuarioId, comandaId)), null);
    }
});
