import test from 'node:test';
import assert from 'node:assert/strict';
import {
    contarBadge,
    selecionarRecentes,
    filtrarNotificacoes,
    destinoNotificacao,
    deveMostrarToast,
    deveTocarSom,
    aplicarEventoNotificacao,
    mesclarNotificacoes
} from './notifications.mjs';

const base = {
    preferencias: {
        notificacoes_ativas: true,
        mostrar_badge: true,
        mostrar_toast: true,
        tocar_som: true
    }
};

test('badge conta somente não lidas e não resolvidas', () => {
    const itens = [
        { id: 1, lida_em: null, resolvida_em: null },
        { id: 2, lida_em: 'x', resolvida_em: null },
        { id: 3, lida_em: null, resolvida_em: 'x' }
    ];

    assert.equal(contarBadge(itens), 1);
});

test('dropdown mantém somente 10 mais recentes sem alterar a lista original', () => {
    const itens = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        criado_em: new Date(2026, 8, 1, 0, i).toISOString()
    }));

    const recentes = selecionarRecentes(itens);

    assert.equal(recentes.length, 10);
    assert.equal(recentes[0].id, 12);
    assert.equal(itens[0].id, 1);
});

test('filtros de estado e tipo são combináveis', () => {
    const itens = [
        { id: 1, tipo: 'NOVO_PEDIDO', lida_em: null, resolvida_em: null },
        { id: 2, tipo: 'PEDIDO_PRONTO', lida_em: null, resolvida_em: 'x' }
    ];

    assert.deepEqual(
        filtrarNotificacoes(itens, { estado: 'pendentes', tipo: 'NOVO_PEDIDO' }).map(x => x.id),
        [1]
    );
});

test('conta solicitada prioriza comanda quando pode fechar', () => {
    const notificacao = { tipo: 'CONTA_SOLICITADA', comanda_id: 77 };

    assert.equal(
        destinoNotificacao(notificacao, permissao => permissao === 'comandas.fechar'),
        '/admin/comandas/77'
    );
    assert.equal(
        destinoNotificacao(notificacao, permissao => permissao === 'caixas.visualizar'),
        '/admin/caixa'
    );
});

test('toast é suprimido na tela diretamente relacionada mas som continua permitido', () => {
    const notificacao = { tipo: 'PEDIDO_PRONTO', comanda_id: 77 };

    assert.equal(
        deveMostrarToast({
            notificacao,
            preferencias: base.preferencias,
            pathname: '/admin/comandas/77'
        }),
        false
    );
    assert.equal(deveTocarSom(base.preferencias), true);
});

test('toast de conta solicitada é suprimido no Caixa para usuário somente com acesso ao Caixa', () => {
    assert.equal(
        deveMostrarToast({
            notificacao: { tipo: 'CONTA_SOLICITADA', comanda_id: 77 },
            preferencias: base.preferencias,
            pathname: '/admin/caixa',
            hasPermission: permissao => permissao === 'caixas.visualizar'
        }),
        false
    );
});

test('toast de conta solicitada não é suprimido no Caixa quando a Comanda é o destino prioritário', () => {
    assert.equal(
        deveMostrarToast({
            notificacao: { tipo: 'CONTA_SOLICITADA', comanda_id: 77 },
            preferencias: base.preferencias,
            pathname: '/admin/caixa',
            hasPermission: permissao => ['comandas.fechar', 'caixas.visualizar'].includes(permissao)
        }),
        true
    );
});

test('toast respeita a chave geral e a preferência específica', () => {
    const notificacao = { tipo: 'NOVO_PEDIDO' };

    assert.equal(
        deveMostrarToast({
            notificacao,
            preferencias: { ...base.preferencias, notificacoes_ativas: false },
            pathname: '/admin'
        }),
        false
    );
    assert.equal(
        deveMostrarToast({
            notificacao,
            preferencias: { ...base.preferencias, mostrar_toast: false },
            pathname: '/admin'
        }),
        false
    );
});

test('nova notificação entra no topo sem duplicar id', () => {
    const estado = [{ id: 1, titulo: 'A' }];
    const nova = { id: 2, titulo: 'B' };

    assert.deepEqual(
        aplicarEventoNotificacao(estado, { tipo: 'nova', notificacao: nova }).map(item => item.id),
        [2, 1]
    );
    assert.deepEqual(
        aplicarEventoNotificacao([nova, ...estado], { tipo: 'nova', notificacao: nova }).map(item => item.id),
        [2, 1]
    );
});

test('evento de leitura e resolução atualiza item existente', () => {
    const estado = [{ id: 4, lida_em: null, resolvida_em: null }];
    const lido = aplicarEventoNotificacao(estado, { tipo: 'lida', id: 4, lida_em: 'L' });
    const resolvido = aplicarEventoNotificacao(lido, { tipo: 'resolvida', id: 4, resolvida_em: 'R' });

    assert.equal(resolvido[0].lida_em, 'L');
    assert.equal(resolvido[0].resolvida_em, 'R');
});

test('bootstrap mescla HTTP e eventos concorrentes sem perder nem duplicar notificações', () => {
    const http = [
        { id: 1, criado_em: '2026-09-09T10:00:00.000Z' },
        { id: 2, criado_em: '2026-09-09T10:01:00.000Z' }
    ];
    const filaSocket = [
        { id: 2, criado_em: '2026-09-09T10:01:00.000Z' },
        { id: 3, criado_em: '2026-09-09T10:02:00.000Z' }
    ];

    assert.deepEqual(mesclarNotificacoes(http, filaSocket).map(item => item.id), [3, 2, 1]);
});
