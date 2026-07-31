import api from "@/lib/api";

/**
 * Consulta administrativa com histórico da última abertura ou fechamento.
 */
export async function obterConfiguracoesLoja() {
    const response = await api.get('/status-loja/configuracoes');
    return response.data;
}

/**
 * Altera somente o funcionamento do estabelecimento.
 * O backend valida novamente a permissão loja.status.
 */
export async function alterarStatusLoja({ estaAberta, motivo = null }) {
    const response = await api.patch('/status-loja', {
        esta_aberta: estaAberta,
        motivo
    });

    return response.data;
}

/**
 * Consulta pública e enxuta para páginas que não dependem de autenticação.
 */
export async function obterStatusPublicoLoja() {
    const response = await api.get('/status-loja');
    return response.data;
}

/**
 * Busca os dados cadastrais da empresa.
 */
export async function obterDadosEmpresa() {
    const response = await api.get("/dados-empresa");
    return response.data;
}

/**
 * Cadastra ou atualiza os dados da empresa.
 *
 * O formulário trabalha com camelCase.
 * O backend e o banco trabalham com snake_case.
 */
export async function atualizarDadosEmpresa({
    nome,
    razaoSocial,
    documentoTipo,
    documento,
    contato,
    endereco
}) {
    const response = await api.patch("/dados-empresa", {
        nome,
        razao_social: razaoSocial,
        documento_tipo: documentoTipo,
        documento,
        contato,
        endereco
    });

    return response.data;
}