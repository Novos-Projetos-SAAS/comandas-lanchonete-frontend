export function criarCoordenadorComanda({ carregar, aoIniciar, aoAplicar, aoErro, aoFinalizar }) {
    let geracao = 0;

    const iniciar = id => {
        const minhaGeracao = ++geracao;
        aoIniciar?.(id);
        return Promise.resolve()
            .then(() => carregar(id))
            .then(dados => {
                if (minhaGeracao === geracao) aoAplicar?.(dados, id);
                return dados;
            })
            .catch(error => {
                if (minhaGeracao === geracao) aoErro?.(error, id);
                throw error;
            })
            .finally(() => {
                if (minhaGeracao === geracao) aoFinalizar?.(id);
            });
    };

    return { iniciar, invalidar: () => { geracao += 1; } };
}

export function estadoVisualComanda({ loading, erro, comandaAtual }) {
    if (erro) return 'erro';
    if (loading || !comandaAtual) return 'loading';
    return 'conteudo';
}

export function normalizarDadosComanda(dados) {
    const comanda = dados?.comanda || null;
    return {
        comanda,
        itens: Array.isArray(dados?.itens) ? dados.itens : [],
        erro: comanda ? '' : 'Comanda não encontrada.'
    };
}
