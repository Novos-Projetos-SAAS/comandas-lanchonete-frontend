const MIN_QUANTIDADE = 1;
const MAX_QUANTIDADE = 50;

export function normalizarObservacao(valor) {
    if (typeof valor !== 'string') return null;
    const normalizada = valor.trim();
    return normalizada || null;
}

export function criarRascunhoVazio() {
    return { itens: [], idempotency_key: null };
}

function quantidadeValida(valor) {
    return Number.isInteger(valor) && valor >= MIN_QUANTIDADE && valor <= MAX_QUANTIDADE;
}

function exigirQuantidade(valor) {
    if (!quantidadeValida(valor)) throw new RangeError('A quantidade deve ser um inteiro entre 1 e 50.');
}

function produtoId(produto) {
    return produto?.id ?? produto?.produto_id;
}

function precoProduto(produto) {
    return Number(produto?.preco_estimado ?? produto?.preco_unitario ?? produto?.preco ?? 0);
}

function novaLinha(produto, quantidade, observacao, linhaId) {
    return {
        linha_id: linhaId,
        produto_id: produtoId(produto),
        nome: produto?.nome ?? produto?.produto_nome ?? '',
        preco_estimado: precoProduto(produto),
        quantidade,
        observacao: normalizarObservacao(observacao)
    };
}

function chaveLinha(item) {
    return `${String(item.produto_id)}\u0000${item.observacao ?? ''}`;
}

function rascunhoMutado(itens) {
    return { itens, idempotency_key: null };
}

export function adicionarItemRascunho(rascunho, produto, quantidade, observacao, gerarLinhaId) {
    exigirQuantidade(quantidade);
    const linha = novaLinha(produto, quantidade, observacao, gerarLinhaId());
    const itens = (rascunho?.itens ?? []).map(item => ({ ...item }));
    const existente = itens.find(item => chaveLinha(item) === chaveLinha(linha));
    if (existente) {
        if (existente.quantidade + quantidade > MAX_QUANTIDADE) throw new RangeError('A quantidade máxima é 50.');
        existente.quantidade += quantidade;
    } else {
        itens.push(linha);
    }
    return rascunhoMutado(itens);
}

export function editarItemRascunho(rascunho, linhaId, patch = {}) {
    const itens = (rascunho?.itens ?? []).map(item => ({ ...item }));
    const index = itens.findIndex(item => item.linha_id === linhaId);
    if (index < 0) return rascunhoMutado(itens);
    const atual = itens[index];
    const quantidade = patch.quantidade ?? atual.quantidade;
    exigirQuantidade(quantidade);
    const editado = {
        ...atual,
        quantidade,
        observacao: patch.observacao === undefined ? atual.observacao : normalizarObservacao(patch.observacao)
    };
    const outro = itens.findIndex((item, i) => i !== index && chaveLinha(item) === chaveLinha(editado));
    if (outro >= 0) {
        if (itens[outro].quantidade + editado.quantidade > MAX_QUANTIDADE) throw new RangeError('A quantidade máxima é 50.');
        itens[outro].quantidade += editado.quantidade;
        itens.splice(index, 1);
    } else {
        itens[index] = editado;
    }
    return rascunhoMutado(itens);
}

export function removerItemRascunho(rascunho, linhaId) {
    const itens = (rascunho?.itens ?? []).filter(item => item.linha_id !== linhaId).map(item => ({ ...item }));
    return rascunhoMutado(itens);
}

export function calcularTotaisRascunho(itens = []) {
    const quantidade = itens.reduce((total, item) => total + Number(item.quantidade || 0), 0);
    const subtotal = itens.reduce((total, item) => total + Number(item.preco_estimado || 0) * Number(item.quantidade || 0), 0);
    return { quantidade, subtotal: Math.round((subtotal + Number.EPSILON) * 100) / 100 };
}

export function chaveStorageRascunho(usuarioId, comandaId) {
    return `lanchonete:pedido-rascunho:${usuarioId}:${comandaId}`;
}

function rascunhoValido(valor) {
    return valor && Array.isArray(valor.itens) && Object.prototype.hasOwnProperty.call(valor, 'idempotency_key')
        ? { itens: valor.itens.map(item => ({ ...item })), idempotency_key: valor.idempotency_key ?? null }
        : criarRascunhoVazio();
}

export function lerRascunho(storage, usuarioId, comandaId) {
    try {
        if (!storage || typeof storage.getItem !== 'function') return criarRascunhoVazio();
        const bruto = storage.getItem(chaveStorageRascunho(usuarioId, comandaId));
        return bruto ? rascunhoValido(JSON.parse(bruto)) : criarRascunhoVazio();
    } catch {
        return criarRascunhoVazio();
    }
}

export function salvarRascunho(storage, usuarioId, comandaId, rascunho) {
    try {
        storage?.setItem?.(chaveStorageRascunho(usuarioId, comandaId), JSON.stringify(rascunhoValido(rascunho)));
    } catch {
        // Storage cheio, indisponível ou bloqueado não deve interromper o pedido.
    }
    return rascunho;
}

export function limparRascunho(storage, usuarioId, comandaId) {
    try {
        storage?.removeItem?.(chaveStorageRascunho(usuarioId, comandaId));
    } catch {
        // Storage indisponível não deve interromper o pedido.
    }
}

