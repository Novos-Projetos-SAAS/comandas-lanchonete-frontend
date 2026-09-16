import test from 'node:test';
import assert from 'node:assert/strict';
import { criarRuntimeNotificacoes } from './notifications-runtime.mjs';

function criarSocketFalso() {
    const handlers = new Map();
    return {
        on(evento, handler) { handlers.set(evento, handler); },
        off(evento) { handlers.delete(evento); },
        emitir(evento, payload) { handlers.get(evento)?.(payload); },
        conectado: false
    };
}

function adiar() {
    let resolver;
    const promise = new Promise(resolve => { resolver = resolve; });
    return { promise, resolver };
}

async function esperarQuantidade(lista, quantidade) {
    for (let tentativa = 0; tentativa < 20 && lista.length < quantidade; tentativa += 1) {
        await Promise.resolve();
    }
    assert.ok(lista.length >= quantidade, `esperava ${quantidade} respostas, recebeu ${lista.length}`);
}

function criarServico({ lista, resumo = { nao_lidas_pendentes: 0 }, preferencias, falhar = false } = {}) {
    return {
        listar: async () => {
            if (falhar) throw new Error('rede');
            return { notificacoes: lista || [] };
        },
        resumo: async () => resumo,
        obterPreferencias: async () => preferencias || { notificacoes_ativas: true }
    };
}

test('eventos antes do bootstrap entram uma vez e não alertam', async () => {
    const socket = criarSocketFalso();
    const esperaLista = adiar();
    const estados = [];
    const alertas = [];
    const runtime = criarRuntimeNotificacoes({
        socket,
        conectar: () => {},
        service: {
            listar: () => esperaLista.promise,
            resumo: async () => ({ nao_lidas_pendentes: 0 }),
            obterPreferencias: async () => ({ notificacoes_ativas: true })
        },
        aoEstado: estado => estados.push(estado),
        aoAlerta: notificacao => alertas.push(notificacao)
    });

    runtime.iniciar();
    socket.emitir('notificacao_nova', { id: 2, criado_em: '2026-09-09T10:02:00.000Z' });
    esperaLista.resolver({ notificacoes: [{ id: 1, criado_em: '2026-09-09T10:01:00.000Z' }] });
    socket.emitir('connect');
    await runtime.quandoOcioso();

    assert.deepEqual(estados.at(-1).notificacoes.map(item => item.id), [2, 1]);
    assert.equal(alertas.length, 0);
});

test('mutações socket durante refresh vencem snapshot HTTP anterior', async () => {
    const socket = criarSocketFalso();
    const esperaLista = adiar();
    const estados = [];
    const runtime = criarRuntimeNotificacoes({
        socket,
        conectar: () => {},
        service: {
            listar: () => esperaLista.promise,
            resumo: async () => ({ nao_lidas_pendentes: 1 }),
            obterPreferencias: async () => ({ notificacoes_ativas: true, tocar_som: true })
        },
        aoEstado: estado => estados.push(estado)
    });

    runtime.iniciar();
    socket.emitir('notificacao_lida', { notificacao_id: 7, lida_em: 'L' });
    socket.emitir('notificacao_resolvida', { id: 7, resolvida_em: 'R' });
    socket.emitir('notificacoes_preferencias_atualizadas', { notificacoes_ativas: false, tocar_som: false });
    esperaLista.resolver({ notificacoes: [{ id: 7, criado_em: '2026-09-09T10:00:00.000Z', lida_em: null, resolvida_em: null }] });
    socket.emitir('connect');
    await runtime.quandoOcioso();

    const estado = estados.at(-1);
    assert.equal(estado.notificacoes[0].lida_em, 'L');
    assert.equal(estado.notificacoes[0].resolvida_em, 'R');
    assert.equal(estado.preferencias.notificacoes_ativas, false);
});

test('falha inicial recupera o protocolo completo na reconexão sem alertar backlog', async () => {
    const socket = criarSocketFalso();
    const estados = [];
    const alertas = [];
    let falhar = true;
    const runtime = criarRuntimeNotificacoes({
        socket,
        conectar: () => {},
        service: {
            listar: async () => {
                if (falhar) throw new Error('rede');
                return { notificacoes: [{ id: 9, criado_em: '2026-09-09T10:00:00.000Z' }] };
            },
            resumo: async () => ({ nao_lidas_pendentes: 1 }),
            obterPreferencias: async () => ({ notificacoes_ativas: true })
        },
        aoEstado: estado => estados.push(estado),
        aoAlerta: notificacao => alertas.push(notificacao)
    });

    runtime.iniciar();
    socket.emitir('connect');
    await runtime.quandoOcioso();
    assert.equal(runtime.prontoParaAlertar(), false);

    falhar = false;
    socket.emitir('notificacao_nova', { id: 10, criado_em: '2026-09-09T10:01:00.000Z' });
    socket.emitir('connect');
    await runtime.quandoOcioso();

    assert.equal(runtime.prontoParaAlertar(), true);
    assert.deepEqual(estados.at(-1).notificacoes.map(item => item.id), [10, 9]);
    assert.equal(alertas.length, 0);
});

test('falha inicial publica erro e retry HTTP recupera dados sem liberar alertas', async () => {
    const socket = criarSocketFalso();
    const estados = [];
    const alertas = [];
    const prontidoes = [];
    const erros = [];
    let chamadas = 0;
    const runtime = criarRuntimeNotificacoes({
        socket,
        conectar: () => {},
        service: {
            listar: async () => {
                chamadas += 1;
                if (chamadas === 1) throw new Error('rede indisponível');
                return { notificacoes: [{ id: 9, criado_em: '2026-09-09T10:00:00.000Z' }] };
            },
            resumo: async () => ({ nao_lidas_pendentes: 1 }),
            obterPreferencias: async () => ({ notificacoes_ativas: true })
        },
        aoEstado: estado => estados.push(estado),
        aoAlerta: notificacao => alertas.push(notificacao),
        aoProntidao: pronto => prontidoes.push(pronto),
        aoErro: erro => erros.push(erro)
    });

    runtime.iniciar();
    await runtime.quandoOcioso();

    assert.equal(runtime.prontoParaAlertar(), false);
    assert.equal(prontidoes.at(-1), false);
    assert.equal(erros.at(-1)?.message, 'rede indisponível');

    socket.emitir('notificacao_nova', { id: 10, criado_em: '2026-09-09T10:01:00.000Z' });
    await runtime.tentarNovamente();

    assert.equal(runtime.prontoParaAlertar(), false);
    assert.equal(prontidoes.at(-1), false);
    assert.equal(erros.at(-1), null);
    assert.deepEqual(estados.at(-1).notificacoes.map(item => item.id), [10, 9]);
    assert.equal(alertas.length, 0);
});

test('primeiro connect posterior ao retry faz refresh antes de liberar alertas', async () => {
    const socket = criarSocketFalso();
    const estados = [];
    const alertas = [];
    const erros = [];
    let chamadas = 0;
    const runtime = criarRuntimeNotificacoes({
        socket,
        conectar: () => {},
        service: {
            listar: async () => {
                chamadas += 1;
                if (chamadas === 1) throw new Error('rede indisponível');
                return { notificacoes: [{ id: 9, criado_em: '2026-09-09T10:00:00.000Z' }] };
            },
            resumo: async () => ({ nao_lidas_pendentes: 1 }),
            obterPreferencias: async () => ({ notificacoes_ativas: true })
        },
        aoEstado: estado => estados.push(estado),
        aoAlerta: notificacao => alertas.push(notificacao),
        aoErro: erro => erros.push(erro)
    });

    runtime.iniciar();
    await runtime.quandoOcioso();
    await runtime.tentarNovamente();

    assert.equal(runtime.prontoParaAlertar(), false);
    assert.equal(erros.at(-1), null);

    socket.emitir('connect');
    await runtime.quandoOcioso();

    assert.equal(runtime.prontoParaAlertar(), true);
    assert.equal(erros.at(-1), null);
    assert.deepEqual(estados.at(-1).notificacoes.map(item => item.id), [9]);
    assert.equal(alertas.length, 0);
});

test('parar remove handlers e descarta o socket da sessão anterior', async () => {
    const socketA = criarSocketFalso();
    let descartado = 0;
    const runtime = criarRuntimeNotificacoes({
        socket: socketA,
        conectar: () => {},
        descartarSocket: () => { descartado += 1; },
        service: criarServico(),
        aoEstado: () => {}
    });

    runtime.iniciar();
    runtime.parar();
    socketA.emitir('notificacao_nova', { id: 1 });

    assert.equal(descartado, 1);
    assert.equal(runtime.prontoParaAlertar(), false);
});

test('primeiro connect faz refresh silencioso antes de liberar alertas', async () => {
    const socket = criarSocketFalso();
    let leituras = 0;
    const alertas = [];
    const runtime = criarRuntimeNotificacoes({
        socket,
        conectar: () => {},
        service: {
            listar: async () => {
                leituras += 1;
                return { notificacoes: [{ id: leituras, criado_em: `2026-09-09T10:0${leituras}:00.000Z` }] };
            },
            resumo: async () => ({ nao_lidas_pendentes: 1 }),
            obterPreferencias: async () => ({ notificacoes_ativas: true })
        },
        aoEstado: () => {},
        aoAlerta: notificacao => alertas.push(notificacao)
    });

    runtime.iniciar();
    socket.emitir('notificacao_nova', { id: 9, criado_em: '2026-09-09T10:09:00.000Z' });
    socket.emitir('connect');
    await runtime.quandoOcioso();

    assert.equal(leituras, 2);
    assert.equal(runtime.prontoParaAlertar(), true);
    assert.equal(alertas.length, 0);
});

test('troca de A para B não deixa eventos do socket A atingirem a sessão B', async () => {
    const socketA = criarSocketFalso();
    const socketB = criarSocketFalso();
    const estadosB = [];
    const runtimeA = criarRuntimeNotificacoes({ socket: socketA, conectar: () => {}, service: criarServico(), aoEstado: () => {} });
    runtimeA.iniciar();
    runtimeA.parar();

    const runtimeB = criarRuntimeNotificacoes({ socket: socketB, conectar: () => {}, service: criarServico(), aoEstado: estado => estadosB.push(estado) });
    runtimeB.iniciar();
    socketA.emitir('notificacao_nova', { id: 1, criado_em: '2026-09-09T10:00:00.000Z' });
    socketB.emitir('connect');
    await runtimeB.quandoOcioso();

    assert.ok(estadosB.every(estado => !estado.notificacoes.some(item => item.id === 1)));
    runtimeB.parar();
});

test('preserva o resumo global ao reconciliar eventos durante refresh', async () => {
    const socket = criarSocketFalso();
    const esperaLista = adiar();
    const estados = [];
    const runtime = criarRuntimeNotificacoes({
        socket,
        conectar: () => {},
        service: {
            listar: () => esperaLista.promise,
            resumo: async () => ({ nao_lidas_pendentes: 99, origem: 'http' }),
            obterPreferencias: async () => ({ notificacoes_ativas: true })
        },
        aoEstado: estado => estados.push(estado)
    });

    runtime.iniciar();
    socket.emitir('notificacao_nova', { id: 2, criado_em: '2026-09-09T10:02:00.000Z', lida_em: null, resolvida_em: null });
    socket.emitir('notificacao_lida', { notificacao_id: 1, lida_em: 'L' });
    socket.emitir('notificacao_resolvida', { id: 1, resolvida_em: 'R' });
    esperaLista.resolver({ notificacoes: [{ id: 1, criado_em: '2026-09-09T10:01:00.000Z', lida_em: null, resolvida_em: null }] });
    socket.emitir('connect');
    await runtime.quandoOcioso();

    const estado = estados.at(-1);
    assert.equal(estado.resumo.origem, 'http');
    assert.equal(estado.resumo.nao_lidas_pendentes, 99);
    assert.equal(estado.notificacoes.find(item => item.id === 1).lida_em, 'L');
    assert.equal(estado.notificacoes.find(item => item.id === 1).resolvida_em, 'R');
});

test('carrega todas as páginas dos últimos 30 dias e mantém o resumo global', async () => {
    const socket = criarSocketFalso();
    const paginas = [];
    const estados = [];
    const runtime = criarRuntimeNotificacoes({
        socket,
        conectar: () => {},
        service: {
            listar: async ({ pagina, limite }) => {
                paginas.push([pagina, limite]);
                return pagina === 1
                    ? {
                        notificacoes: Array.from({ length: 50 }, (_, indice) => ({
                            id: indice + 1,
                            lida_em: 'L',
                            resolvida_em: null,
                            criado_em: `2026-09-09T10:${String(indice).padStart(2, '0')}:00.000Z`
                        })),
                        paginacao: { pagina_atual: 1, total_paginas: 2 }
                    }
                    : {
                        notificacoes: [{ id: 51, lida_em: null, resolvida_em: null, criado_em: '2026-09-08T10:00:00.000Z' }],
                        paginacao: { pagina_atual: 2, total_paginas: 2 }
                    };
            },
            resumo: async () => ({ nao_lidas_pendentes: 1 }),
            obterPreferencias: async () => ({ notificacoes_ativas: true })
        },
        aoEstado: estado => estados.push(estado)
    });

    runtime.iniciar();
    await runtime.quandoOcioso();

    assert.deepEqual(paginas, [[1, 100], [2, 100]]);
    assert.equal(estados.at(-1).notificacoes.length, 51);
    assert.equal(estados.at(-1).resumo.nao_lidas_pendentes, 1);
});

test('leitura em lote aplica somente os ids confirmados pelo backend', async () => {
    const socket = criarSocketFalso();
    const esperaLista = adiar();
    const estados = [];
    const runtime = criarRuntimeNotificacoes({
        socket,
        conectar: () => {},
        service: {
            listar: () => esperaLista.promise,
            resumo: async () => ({ nao_lidas_pendentes: 2 }),
            obterPreferencias: async () => ({ notificacoes_ativas: true })
        },
        aoEstado: estado => estados.push(estado)
    });

    runtime.iniciar();
    socket.emitir('notificacao_lida', {
        todas: true,
        atualizadas: 1,
        notificacoes: [{ notificacao_id: 1, lida_em: 'L' }]
    });
    socket.emitir('notificacao_nova', {
        id: 2,
        lida_em: null,
        resolvida_em: null,
        criado_em: '2026-09-09T10:02:00.000Z'
    });
    esperaLista.resolver({
        notificacoes: [
            { id: 1, lida_em: null, resolvida_em: null, criado_em: '2026-09-09T10:01:00.000Z' },
            { id: 2, lida_em: null, resolvida_em: null, criado_em: '2026-09-09T10:02:00.000Z' }
        ]
    });
    await runtime.quandoOcioso();

    const estado = estados.at(-1);
    assert.equal(estado.notificacoes.find(item => item.id === 1).lida_em, 'L');
    assert.equal(estado.notificacoes.find(item => item.id === 2).lida_em, null);
});

test('HTTP libera os dados sem liberar alertas quando o socket não conecta', async () => {
    const socket = criarSocketFalso();
    const dadosProntos = [];
    const prontidoes = [];
    const errosTransporte = [];
    const runtime = criarRuntimeNotificacoes({
        socket,
        conectar: () => {},
        service: criarServico({ lista: [{ id: 1 }] }),
        aoDadosProntos: pronto => dadosProntos.push(pronto),
        aoProntidao: pronto => prontidoes.push(pronto),
        aoErroTransporte: erro => errosTransporte.push(erro)
    });

    runtime.iniciar();
    await runtime.quandoOcioso();
    socket.emitir('connect_error', new Error('socket indisponível'));

    assert.equal(dadosProntos.at(-1), true);
    assert.equal(runtime.prontoParaAlertar(), false);
    assert.equal(prontidoes.at(-1), false);
    assert.equal(errosTransporte.at(-1)?.message, 'socket indisponível');
});

test('serializa recarregamentos para resposta antiga não publicar após a nova', async () => {
    const socket = criarSocketFalso();
    const estados = [];
    const respostas = [];
    let chamadas = 0;
    const service = {
        listar: () => {
            chamadas += 1;
            const espera = adiar();
            respostas.push(espera);
            return espera.promise;
        },
        resumo: async () => ({ nao_lidas_pendentes: 0 }),
        obterPreferencias: async () => ({ notificacoes_ativas: true })
    };
    const runtime = criarRuntimeNotificacoes({ socket, conectar: () => {}, service, aoEstado: estado => estados.push(estado) });

    runtime.iniciar();
    await esperarQuantidade(respostas, 1);
    respostas[0].resolver({ notificacoes: [] });
    socket.emitir('connect');
    await esperarQuantidade(respostas, 2);
    respostas[1].resolver({ notificacoes: [] });
    await runtime.quandoOcioso();

    const primeiro = runtime.recarregarSilenciosamente();
    const segundo = runtime.recarregarSilenciosamente();
    await esperarQuantidade(respostas, 3);
    assert.equal(chamadas, 3);
    respostas[2].resolver({ notificacoes: [{ id: 3, criado_em: '2026-09-09T10:03:00.000Z' }] });
    await esperarQuantidade(respostas, 4);
    assert.equal(chamadas, 4);
    respostas[3].resolver({ notificacoes: [{ id: 4, criado_em: '2026-09-09T10:04:00.000Z' }] });
    await Promise.all([primeiro, segundo]);

    assert.deepEqual(estados.at(-1).notificacoes.map(item => item.id), [4]);
});

test('stop invalida HTTP pendente sem publicar estado posterior', async () => {
    const socket = criarSocketFalso();
    const esperaLista = adiar();
    const estados = [];
    const runtime = criarRuntimeNotificacoes({
        socket,
        conectar: () => {},
        service: { listar: () => esperaLista.promise, resumo: async () => ({}), obterPreferencias: async () => ({}) },
        aoEstado: estado => estados.push(estado)
    });

    runtime.iniciar();
    runtime.parar();
    esperaLista.resolver({ notificacoes: [{ id: 1, criado_em: '2026-09-09T10:00:00.000Z' }] });
    await Promise.resolve();

    assert.equal(estados.length, 0);
});
