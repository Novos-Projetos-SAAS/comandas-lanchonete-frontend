import {
    lerRascunho,
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

function fingerprintItens(itens) {
    return JSON.stringify(itens.map(({ produto_id, quantidade, observacao }) => ({ produto_id, quantidade, observacao })));
}

export function criarControladorEnvioPedido({ storage, usuarioId, comandaId, gerarChave, request }) {
    let promisePendente = null;
    let ultimaChave = null;
    let ultimoFingerprint = null;

    function enviar(rascunho) {
        if (promisePendente) return promisePendente;
        if (!Array.isArray(rascunho?.itens) || rascunho.itens.length === 0) return Promise.resolve(null);

        const itens = normalizarItens(rascunho.itens);
        const fingerprint = fingerprintItens(itens);
        const salvo = lerRascunho(storage, usuarioId, comandaId);
        const chaveSalva = fingerprintItens(normalizarItens(salvo.itens)) === fingerprint ? salvo.idempotency_key : null;
        const chave = rascunho.idempotency_key || chaveSalva ||
            (ultimoFingerprint === fingerprint ? ultimaChave : null) || gerarChave();
        const rascunhoComChave = { ...rascunho, itens, idempotency_key: chave };
        const payload = {
            comanda_id: comandaId,
            idempotency_key: chave,
            itens: itens.map(({ produto_id, quantidade, observacao }) => ({ produto_id, quantidade, observacao }))
        };

        salvarRascunho(storage, usuarioId, comandaId, rascunhoComChave);
        ultimaChave = chave;
        ultimoFingerprint = fingerprint;
        promisePendente = Promise.resolve()
            .then(() => request(payload))
            .then(resultado => {
                limparRascunho(storage, usuarioId, comandaId);
                ultimaChave = null;
                ultimoFingerprint = null;
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
            if (status !== 'Aberta') {
                limparRascunho(storage, usuarioId, comandaId);
                ultimaChave = null;
                ultimoFingerprint = null;
            }
        }
    };
}
