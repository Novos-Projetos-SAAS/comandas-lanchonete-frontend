export function criarCoordenadorComanda({ carregar, aoIniciar, aoAplicar, aoErro, aoFinalizar }) {
    let geracao = 0;
    let idCarregando = null;

    const iniciar = (id, { preservarConteudo = false } = {}) => {
        const minhaGeracao = ++geracao;
        if (!preservarConteudo) {
            idCarregando = id;
            aoIniciar?.(id);
        }
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
                if (minhaGeracao !== geracao) return;
                if (!preservarConteudo || String(idCarregando) === String(id)) {
                    aoFinalizar?.(id);
                    idCarregando = null;
                }
            });
    };

    return { iniciar, invalidar: () => { geracao += 1; idCarregando = null; } };
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
