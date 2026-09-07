import {
    chaveStorageRascunho,
    limparRascunho,
    normalizarObservacao,
    salvarRascunho
} from './admin-order-draft.mjs';

function normalizarItens(itens) {
    return itens.map(item => ({
        ...item,
        observacao: normalizarObservacao(item.observacao)
    }));
}

export function criarControladorEnvioPedido({ storage, usuarioId, comandaId, gerarChave, request }) {
    let promisePendente = null;

    function enviar(rascunho) {
        if (promisePendente) return promisePendente;
        if (!Array.isArray(rascunho?.itens) || rascunho.itens.length === 0) return Promise.resolve(null);

        const chave = rascunho.idempotency_key || gerarChave();
        const itens = normalizarItens(rascunho.itens);
        const rascunhoComChave = { ...rascunho, itens, idempotency_key: chave };
        const payload = {
            comanda_id: comandaId,
            idempotency_key: chave,
            itens: itens.map(({ produto_id, quantidade, observacao }) => ({ produto_id, quantidade, observacao }))
        };

        salvarRascunho(storage, usuarioId, comandaId, rascunhoComChave);
        promisePendente = Promise.resolve()
            .then(() => request(payload))
            .then(resultado => {
                limparRascunho(storage, usuarioId, comandaId);
                return resultado;
            })
            .finally(() => {
                promisePendente = null;
            });
        return promisePendente;
    }

    return {
        enviar,
        estaEnviando: () => promisePendente !== null,
        limparSeComandaFechada: status => {
            if (status !== 'Aberta') limparRascunho(storage, usuarioId, comandaId);
        }
    };
}
