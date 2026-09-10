function obterData(item) {
    const valor = new Date(item?.criado_em).getTime();
    return Number.isNaN(valor) ? 0 : valor;
}

export function contarBadge(notificacoes) {
    return (notificacoes || []).filter(item => !item.lida_em && !item.resolvida_em).length;
}

export function valorBadge({ resumo, preferencias } = {}) {
    if (!preferencias?.notificacoes_ativas || !preferencias?.mostrar_badge) return null;
    return Number(resumo?.nao_lidas_pendentes || 0);
}

export function estadoVisualNotificacao(notificacao) {
    if (notificacao?.resolvida_em) return 'resolved';
    return notificacao?.lida_em ? 'read' : 'unread';
}

export function podeInteragirComNotificacoes({ loading, processando } = {}) {
    return !loading && !processando;
}

export function prepararPreferenciasAtualizadas(preferencias, campo) {
    return {
        [campo]: !preferencias?.[campo]
    };
}

export function reconciliarPreferenciasPersistidas(atuais, persistidas, patch) {
    const camposPersistidos = Object.fromEntries(
        Object.keys(patch || {}).map(campo => [campo, persistidas?.[campo]])
    );
    return { ...atuais, ...camposPersistidos };
}

export function selecionarRecentes(notificacoes, limite = 10) {
    return [...(notificacoes || [])]
        .sort((a, b) => obterData(b) - obterData(a))
        .slice(0, limite);
}

export function filtrarNotificacoes(notificacoes, { estado = 'todas', tipo = null } = {}) {
    return (notificacoes || []).filter(notificacao => {
        const correspondeEstado = {
            todas: true,
            nao_lidas: !notificacao.lida_em,
            pendentes: !notificacao.resolvida_em,
            resolvidas: Boolean(notificacao.resolvida_em)
        }[estado] ?? true;
        const correspondeTipo = !tipo || notificacao.tipo === tipo;

        return correspondeEstado && correspondeTipo;
    });
}

export function destinoNotificacao(notificacao, hasPermission = () => false) {
    if (notificacao?.tipo === 'NOVO_PEDIDO') return '/admin/cozinha';

    if (notificacao?.tipo === 'PEDIDO_PRONTO') {
        return notificacao.comanda_id != null
            ? `/admin/comandas/${notificacao.comanda_id}`
            : '/admin/comandas';
    }

    if (notificacao?.tipo === 'CONTA_SOLICITADA') {
        if (hasPermission('comandas.fechar') && hasPermission('comandas.listar')) {
            return notificacao.comanda_id != null
                ? `/admin/comandas/${notificacao.comanda_id}`
                : '/admin/comandas';
        }
        if (hasPermission('caixas.visualizar')) return '/admin/caixa';
    }

    return '/admin/notificacoes';
}

export function deveMostrarToast({ notificacao, preferencias, pathname, hasPermission } = {}) {
    if (!preferencias?.notificacoes_ativas || !preferencias?.mostrar_toast) return false;

    const destino = destinoNotificacao(notificacao, hasPermission || (() => true));

    return pathname !== destino;
}

export function deveTocarSom(preferencias) {
    return Boolean(preferencias?.notificacoes_ativas && preferencias?.tocar_som);
}

export function mesclarNotificacoes(...listas) {
    const porId = new Map();
    for (const lista of listas) {
        for (const item of lista || []) {
            if (item?.id != null) porId.set(Number(item.id), item);
        }
    }
    return [...porId.values()].sort(
        (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
    );
}

export function aplicarEventoNotificacao(estado, evento) {
    const notificacoes = estado || [];

    if (evento?.tipo === 'nova' && evento.notificacao?.id != null) {
        return [
            evento.notificacao,
            ...notificacoes.filter(item => Number(item.id) !== Number(evento.notificacao.id))
        ];
    }

    if (evento?.tipo === 'lida' || evento?.tipo === 'resolvida') {
        const campo = evento.tipo === 'lida' ? 'lida_em' : 'resolvida_em';
        return notificacoes.map(item => Number(item.id) === Number(evento.id)
            ? { ...item, [campo]: evento[campo] }
            : item);
    }

    return notificacoes;
}
