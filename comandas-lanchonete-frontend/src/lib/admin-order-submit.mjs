import {
    adicionarItemRascunho,
    criarRascunhoVazio,
    editarItemRascunho,
    lerRascunho,
    limparRascunho,
    normalizarObservacao,
    removerItemRascunho,
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
        invalidarChave: () => {
            ultimaChave = null;
            ultimoFingerprint = null;
        },
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

export function formatarErroPedido(error) {
    const dados = error?.response?.data;
    const detalhes = Array.isArray(dados?.details) ? dados.details : [];
    const mensagens = detalhes.filter(item => typeof item?.mensagem === 'string' && item.mensagem.trim()).map(item => {
        const indice = Number.isInteger(item.indice) ? `Item ${item.indice + 1}` : '';
        const produto = item.produto_id != null ? `Produto ${item.produto_id}` : '';
        const contexto = [indice, produto].filter(Boolean).join(' · ');
        return contexto ? `${contexto}: ${item.mensagem}` : item.mensagem;
    });
    return mensagens.join('\n') || dados?.message || 'Não foi possível enviar o pedido. Tente novamente.';
}

export async function enviarPedidoComAtualizacao({ sessao, ativo, onSucesso, onAtualizar, onAtualizacaoErro, onFechar }) {
    if (sessao.estaEnviando()) return false;
    const resultado = await sessao.enviar();
    if (!resultado) return false;
    if (ativo && !ativo()) return false;
    onSucesso?.();
    try {
        await onAtualizar?.();
    } catch (error) {
        onAtualizacaoErro?.(error);
    }
    onFechar?.();
    return true;
}

// A sessão vive por usuário/comanda; fechar a apresentação não altera o rascunho.
export function criarSessaoPedido(opcoes) {
    const { storage, usuarioId, comandaId, gerarChave } = opcoes;
    const controlador = criarControladorEnvioPedido(opcoes);
    let estado = { rascunho: lerRascunho(storage, usuarioId, comandaId), enviando: false };
    let status = 'Aberta';
    let pendente = null;
    const assinantes = new Set();
    const publicar = (rascunho, enviando = estado.enviando) => {
        estado = { rascunho, enviando };
        assinantes.forEach(assinante => assinante());
    };
    const editar = transformar => {
        if (status !== 'Aberta' || pendente) return;
        const novo = transformar(estado.rascunho);
        controlador.invalidarChave();
        salvarRascunho(storage, usuarioId, comandaId, novo);
        publicar(novo);
    };
    return {
        getSnapshot: () => estado,
        subscribe: assinante => {
            assinantes.add(assinante);
            return () => assinantes.delete(assinante);
        },
        estaEnviando: () => pendente !== null,
        adicionar: (produto, quantidade) => editar(rascunho => adicionarItemRascunho(rascunho, produto, quantidade, null, gerarChave)),
        editar: (linhaId, patch) => editar(rascunho => editarItemRascunho(rascunho, linhaId, patch)),
        remover: linhaId => editar(rascunho => removerItemRascunho(rascunho, linhaId)),
        definirStatus: novoStatus => {
            status = novoStatus;
            controlador.limparSeComandaFechada(status);
            if (status !== 'Aberta') publicar(criarRascunhoVazio());
        },
        enviar: () => {
            if (pendente) return pendente;
            if (status !== 'Aberta' || !estado.rascunho.itens.length) return Promise.resolve(null);
            const rascunho = { ...estado.rascunho, idempotency_key: estado.rascunho.idempotency_key || gerarChave() };
            pendente = controlador.enviar(rascunho).then(resultado => {
                publicar(criarRascunhoVazio(), true);
                return resultado;
            }).finally(() => {
                pendente = null;
                publicar(estado.rascunho, false);
            });
            publicar(rascunho, true);
            return pendente;
        }
    };
}
