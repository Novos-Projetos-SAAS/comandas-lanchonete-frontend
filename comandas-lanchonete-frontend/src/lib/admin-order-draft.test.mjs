import test from 'node:test';
import assert from 'node:assert/strict';

import {
    normalizarObservacao,
    criarRascunhoVazio,
    adicionarItemRascunho,
    editarItemRascunho,
    removerItemRascunho,
    calcularTotaisRascunho,
    chaveStorageRascunho,
    lerRascunho,
    salvarRascunho,
    limparRascunho
} from './admin-order-draft.mjs';

const produto = { id: 7, nome: 'X-Salada', preco: 12.5 };
const outroProduto = { id: 8, nome: 'Suco', preco: 6 };

function storageFake(initial = {}) {
    const values = new Map(Object.entries(initial));
    return {
        getItem: key => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key),
        values
    };
}

test('normaliza observação vazia para null sem mudar caixa', () => {
    assert.equal(normalizarObservacao('  Sem cebola '), 'Sem cebola');
    assert.equal(normalizarObservacao('   '), null);
    assert.equal(normalizarObservacao(null), null);
});

test('adiciona múltiplos produtos e consolida somente produto e observação idênticos', () => {
    const primeiro = adicionarItemRascunho(criarRascunhoVazio(), produto, 1, '  Sem cebola ', () => 'linha-1');
    const somado = adicionarItemRascunho(primeiro, produto, 2, 'Sem cebola', () => 'linha-2');
    const caixaDiferente = adicionarItemRascunho(somado, produto, 1, 'sem cebola', () => 'linha-3');
    const comOutro = adicionarItemRascunho(caixaDiferente, outroProduto, 1, '', () => 'linha-4');

    assert.equal(comOutro.itens.length, 3);
    assert.deepEqual(comOutro.itens[0], {
        linha_id: 'linha-1', produto_id: 7, nome: 'X-Salada', preco_estimado: 12.5,
        quantidade: 3, observacao: 'Sem cebola'
    });
    assert.equal(comOutro.idempotency_key, null);
    assert.equal(comOutro.itens[1].observacao, 'sem cebola');
    assert.equal(comOutro.itens[2].observacao, null);
});

test('impõe quantidade inteira entre 1 e 50 ao adicionar e editar', () => {
    assert.throws(() => adicionarItemRascunho(criarRascunhoVazio(), produto, 0, null, () => 'x'), RangeError);
    assert.throws(() => adicionarItemRascunho(criarRascunhoVazio(), produto, 51, null, () => 'x'), RangeError);
    const draft = adicionarItemRascunho(criarRascunhoVazio(), produto, 1, null, () => 'x');
    assert.throws(() => editarItemRascunho(draft, 'x', { quantidade: 0 }), RangeError);
    assert.throws(() => editarItemRascunho(draft, 'x', { quantidade: 51 }), RangeError);
});

test('edita quantidade e observação, consolidando linhas que passam a coincidir', () => {
    let draft = adicionarItemRascunho(criarRascunhoVazio(), produto, 1, null, () => 'a');
    draft = adicionarItemRascunho(draft, produto, 2, 'Molho', () => 'b');
    draft = editarItemRascunho(draft, 'a', { quantidade: 3, observacao: ' Molho ' });

    assert.equal(draft.itens.length, 1);
    assert.equal(draft.itens[0].linha_id, 'b');
    assert.equal(draft.itens[0].quantidade, 5);
    assert.equal(draft.itens[0].observacao, 'Molho');
    assert.equal(draft.idempotency_key, null);
});

test('remove item e calcula quantidade total e subtotal', () => {
    let draft = adicionarItemRascunho(criarRascunhoVazio(), produto, 2, null, () => 'a');
    draft = adicionarItemRascunho(draft, outroProduto, 3, null, () => 'b');
    assert.deepEqual(calcularTotaisRascunho(draft.itens), { quantidade: 5, subtotal: 43 });
    draft = removerItemRascunho(draft, 'a');
    assert.equal(draft.itens.length, 1);
    assert.equal(removerItemRascunho(draft, 'missing').itens.length, 1);
});

test('isola storage por usuário e comanda e usa chave estável', () => {
    assert.equal(chaveStorageRascunho(4, 9), 'lanchonete:pedido-rascunho:4:9');
    assert.notEqual(chaveStorageRascunho(4, 9), chaveStorageRascunho(5, 9));
});

test('JSON inválido ou storage indisponível retorna rascunho vazio', () => {
    const storage = storageFake({ [chaveStorageRascunho(4, 9)]: '{invalido' });
    assert.deepEqual(lerRascunho(storage, 4, 9), criarRascunhoVazio());
    assert.deepEqual(lerRascunho(null, 4, 9), criarRascunhoVazio());
});

test('salva e restaura no F5 itens e chave, e limpar remove o registro', () => {
    const storage = storageFake();
    let draft = adicionarItemRascunho(criarRascunhoVazio(), produto, 2, null, () => 'linha-1');
    draft = { ...draft, idempotency_key: 'chave-envio' };
    salvarRascunho(storage, 4, 9, draft);
    assert.deepEqual(lerRascunho(storage, 4, 9), draft);
    limparRascunho(storage, 4, 9);
    assert.deepEqual(lerRascunho(storage, 4, 9), criarRascunhoVazio());
});

