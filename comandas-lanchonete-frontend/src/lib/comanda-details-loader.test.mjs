import test from 'node:test';
import assert from 'node:assert/strict';

import { criarCoordenadorComanda, estadoVisualComanda } from './comanda-details-loader.mjs';

test('prioriza erro de carga sobre loading quando não há comanda para o id atual', () => {
    assert.equal(estadoVisualComanda({ loading: false, erro: 'Falha', comandaAtual: false }), 'erro');
});

test('aplica somente a carga da geração mais recente quando respostas chegam fora de ordem', async () => {
    const pendentes = [];
    const aplicados = [];
    const coordenador = criarCoordenadorComanda({
        carregar: id => new Promise((resolve, reject) => pendentes.push({ id, resolve, reject })),
        aoAplicar: dados => aplicados.push(dados),
        aoErro: error => { throw error; }
    });

    const antiga = coordenador.iniciar('1');
    const atual = coordenador.iniciar('2');
    await Promise.resolve();
    pendentes[0].resolve({ id: '1' });
    pendentes[1].resolve({ id: '2' });
    await Promise.all([antiga, atual]);

    assert.deepEqual(aplicados, [{ id: '2' }]);
});

test('invalidar impede aplicar resposta pendente após desmontagem', async () => {
    let resolver;
    const aplicados = [];
    const coordenador = criarCoordenadorComanda({
        carregar: () => new Promise(resolve => { resolver = resolve; }),
        aoAplicar: dados => aplicados.push(dados)
    });
    const carga = coordenador.iniciar('1');
    coordenador.invalidar();
    await Promise.resolve();
    resolver({ id: '1' });
    await carga;
    assert.deepEqual(aplicados, []);
});
