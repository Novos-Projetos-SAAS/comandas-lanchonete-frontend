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
