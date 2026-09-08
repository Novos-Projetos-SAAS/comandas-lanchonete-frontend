import test from 'node:test';
import assert from 'node:assert/strict';

import { criarCoordenadorComanda, estadoVisualComanda, normalizarDadosComanda } from './comanda-details-loader.mjs';

test('prioriza erro de carga sobre loading quando não há comanda para o id atual', () => {
    assert.equal(estadoVisualComanda({ loading: false, erro: 'Falha', comandaAtual: false }), 'erro');
    assert.equal(estadoVisualComanda({ loading: false, erro: '', comandaAtual: false }), 'loading');
    assert.equal(estadoVisualComanda({ loading: false, erro: '', comandaAtual: true }), 'conteudo');
});

test('normaliza resposta válida e transforma resposta sem comanda em erro explícito', () => {
    assert.deepEqual(normalizarDadosComanda({ comanda: { id: 2 }, itens: [{ id: 1 }] }), { comanda: { id: 2 }, itens: [{ id: 1 }], erro: '' });
    assert.deepEqual(normalizarDadosComanda({ comanda: undefined, itens: [] }), { comanda: null, itens: [], erro: 'Comanda não encontrada.' });
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

test('refresh da mesma comanda encerra o loading da carga inicial obsoleta', async () => {
    const pendentes = [];
    const estado = { loading: false, comanda: null };
    const coordenador = criarCoordenadorComanda({
        carregar: id => new Promise(resolve => pendentes.push({ id, resolve })),
        aoIniciar: () => { estado.loading = true; },
        aoAplicar: dados => { estado.comanda = dados; },
        aoFinalizar: () => { estado.loading = false; }
    });

    const inicial = coordenador.iniciar('1');
    await Promise.resolve();
    const refresh = coordenador.iniciar('1', { preservarConteudo: true });
    await Promise.resolve();
    pendentes[1].resolve({ id: '1', versao: 'atual' });
    await refresh;

    assert.deepEqual(estado, { loading: false, comanda: { id: '1', versao: 'atual' } });

    pendentes[0].resolve({ id: '1', versao: 'antiga' });
    await inicial;
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

test('atualização bem-sucedida em segundo plano mantém o modal montado até o fechamento', async () => {
    let modalMontado = true;
    const eventos = [];
    const coordenador = criarCoordenadorComanda({
        carregar: async () => ({ id: '1' }),
        aoIniciar: () => { modalMontado = false; },
        aoAplicar: () => eventos.push('atualizar')
    });

    await coordenador.iniciar('1', { preservarConteudo: true });
    eventos.push(modalMontado ? 'fechar' : 'modal-desmontado');

    assert.deepEqual(eventos, ['atualizar', 'fechar']);
});
