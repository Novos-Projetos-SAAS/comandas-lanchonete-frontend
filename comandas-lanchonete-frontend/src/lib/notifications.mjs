function obterData(item) {
    const valor = new Date(item?.criado_em).getTime();
    return Number.isNaN(valor) ? 0 : valor;
}

export function contarBadge(notificacoes) {
    return (notificacoes || []).filter(item => !item.lida_em && !item.resolvida_em).length;
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
        if (hasPermission('comandas.fechar')) {
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
    const estaNoCaixaDaConta = notificacao?.tipo === 'CONTA_SOLICITADA' && pathname === '/admin/caixa';

    return pathname !== destino && !estaNoCaixaDaConta;
}

export function deveTocarSom(preferencias) {
    return Boolean(preferencias?.notificacoes_ativas && preferencias?.tocar_som);
}
