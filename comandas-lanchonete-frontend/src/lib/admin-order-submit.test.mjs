import test from 'node:test';
import assert from 'node:assert/strict';

import { criarControladorEnvioPedido } from './admin-order-submit.mjs';
import * as envio from './admin-order-submit.mjs';
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
    let chaves = 0;
    const { controlador } = criarControlador({
        storage,
        gerarChave: () => `chave-${++chaves}`,
        request: async payload => {
            payloads.push(payload);
            tentativa += 1;
            if (tentativa === 1) throw new Error('timeout');
            return { id: 1 };
        }
    });

    await assert.rejects(controlador.enviar(rascunho), /timeout/);
    assert.equal(lerRascunho(storage, usuarioId, comandaId).idempotency_key, 'chave-1');
    await controlador.enviar(rascunho);

    assert.deepEqual(payloads.map(payload => payload.idempotency_key), ['chave-1', 'chave-1']);
    assert.equal(storage.getItem(chaveStorageRascunho(usuarioId, comandaId)), null);
    assert.deepEqual(rascunho, {
        itens: [{ linha_id: 'linha-1', produto_id: 7, nome: 'X-Salada', preco_estimado: 12.5, quantidade: 2, observacao: ' Sem cebola ' }],
        idempotency_key: null
    });
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
    await assert.rejects(controlador.enviar({
        ...rascunho,
        itens: [{ ...rascunho.itens[0], quantidade: 3 }],
        idempotency_key: null
    }), /erro/);

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

test('preserva a chave e libera o envio quando request lança sincronamente', async () => {
    const { storage, controlador } = criarControlador({
        request: () => { throw new Error('falha síncrona'); }
    });

    const envio = controlador.enviar(rascunho);
    assert.equal(controlador.estaEnviando(), true);
    await assert.rejects(envio, /falha síncrona/);

    assert.equal(lerRascunho(storage, usuarioId, comandaId).idempotency_key, 'chave-1');
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

test('formata detalhes por índice/produto com fallback e preserva rascunho após erro', async () => {
    const erro = { response: { data: { message: 'Pedido inválido', details: [
        { indice: 0, produto_id: 7, mensagem: 'Indisponível' },
        { indice: 1, produto_id: 8, mensagem: 'Sem preço' }
    ] } } };
    const { controlador, storage } = criarControlador({ request: async () => { throw erro; } });
    await assert.rejects(controlador.enviar(rascunho), e => e === erro);
    assert.equal(typeof envio.formatarErroPedido, 'function');
    assert.equal(envio.formatarErroPedido(erro), 'Item 1 · Produto 7: Indisponível\nItem 2 · Produto 8: Sem preço');
    assert.equal(envio.formatarErroPedido({ response: { data: { details: [{}], message: 'Falha' } } }), 'Falha');
    assert.equal(envio.formatarErroPedido(new Error('timeout')), 'Não foi possível enviar o pedido. Tente novamente.');
    assert.equal(lerRascunho(storage, usuarioId, comandaId).itens[0].quantidade, 2);
    assert.equal(lerRascunho(storage, usuarioId, comandaId).idempotency_key, 'chave-1');
});

test('sessão restaura, edita localmente, consolida observação e invalida chave mesmo ao desfazer edição', async () => {
    assert.equal(typeof envio.criarSessaoPedido, 'function');
    const storage = storageFake();
    let chaves = 0;
    const payloads = [];
    const sessao = envio.criarSessaoPedido({ storage, usuarioId, comandaId, gerarChave: () => `id-${++chaves}`,
        request: async payload => { payloads.push(payload); throw new Error('timeout'); } });
    sessao.adicionar({ id: 7, nome: 'X', preco: 10 }, 1);
    sessao.adicionar({ id: 8, nome: 'Suco', preco: 6 }, 2);
    sessao.remover(sessao.getSnapshot().rascunho.itens[1].linha_id);
    await assert.rejects(sessao.enviar(), /timeout/);
    const chave = sessao.getSnapshot().rascunho.idempotency_key;
    const linha = sessao.getSnapshot().rascunho.itens[0].linha_id;
    sessao.editar(linha, { observacao: 'Molho' });
    assert.equal(sessao.getSnapshot().rascunho.idempotency_key, null);
    sessao.adicionar({ id: 7, nome: 'X', preco: 10 }, 1);
    sessao.editar(linha, { observacao: null });
    assert.equal(sessao.getSnapshot().rascunho.itens.length, 1);
    assert.equal(sessao.getSnapshot().rascunho.itens[0].quantidade, 2);
    sessao.editar(sessao.getSnapshot().rascunho.itens[0].linha_id, { quantidade: 1 });
    await assert.rejects(sessao.enviar(), /timeout/);
    assert.notEqual(payloads[1].idempotency_key, chave);
    const restaurada = envio.criarSessaoPedido({ storage, usuarioId, comandaId, gerarChave: () => 'outra', request: async () => ({ id: 1 }) });
    assert.deepEqual(restaurada.getSnapshot().rascunho, sessao.getSnapshot().rascunho);
});

test('sessão bloqueia edição e envio concorrentes e limpa estado e storage no sucesso', async () => {
    assert.equal(typeof envio.criarSessaoPedido, 'function');
    const storage = storageFake();
    let resolver;
    let chamadas = 0;
    const sessao = envio.criarSessaoPedido({ storage, usuarioId, comandaId, gerarChave: () => 'id',
        request: () => { chamadas++; return new Promise(resolve => { resolver = resolve; }); } });
    sessao.adicionar({ id: 7, nome: 'X', preco: 10 }, 1);
    const primeira = sessao.enviar();
    assert.strictEqual(sessao.enviar(), primeira);
    assert.equal(sessao.getSnapshot().enviando, true);
    sessao.adicionar({ id: 8, nome: 'Suco', preco: 6 }, 2);
    assert.equal(sessao.getSnapshot().rascunho.itens.length, 1);
    await Promise.resolve();
    resolver({ id: 1 });
    await primeira;
    assert.equal(chamadas, 1);
    assert.deepEqual(sessao.getSnapshot(), { rascunho: { itens: [], idempotency_key: null }, enviando: false });
    assert.equal(storage.getItem(chaveStorageRascunho(usuarioId, comandaId)), null);
});

test('status não Aberta limpa memória e storage e não permite adicionar ou enviar', async () => {
    assert.equal(typeof envio.criarSessaoPedido, 'function');
    for (const status of ['Paga', 'Cancelada', 'Aguardando Pagamento']) {
        const storage = storageFake();
        let chamadas = 0;
        const sessao = envio.criarSessaoPedido({ storage, usuarioId, comandaId, gerarChave: () => 'id', request: async () => { chamadas++; } });
        sessao.adicionar({ id: 7, nome: 'X', preco: 10 }, 1);
        sessao.definirStatus(status);
        sessao.adicionar({ id: 7, nome: 'X', preco: 10 }, 1);
        assert.equal(await sessao.enviar(), null);
        assert.equal(chamadas, 0);
        assert.equal(sessao.getSnapshot().rascunho.itens.length, 0);
        assert.equal(storage.getItem(chaveStorageRascunho(usuarioId, comandaId)), null);
    }
});
