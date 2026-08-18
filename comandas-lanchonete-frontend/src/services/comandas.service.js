import api from "@/lib/api";

/**
 * Lista as comandas cadastradas.
 *
 * O backend aceita:
 * - status
 * - mesa_id
 * - pagina
 * - limite
 */
export async function listarComandas({
    pagina = 1,
    status = "",
    mesaId = "",
    limite = 30
} = {}) {
    const params = {
        pagina,
        limite
    };

    if (status) {
        params.status = status;
    }

    if (mesaId) {
        params.mesa_id = mesaId;
    }

    const response = await api.get(
        "/comandas",
        {
            params
        }
    );

    return response.data;
}

/**
 * Busca uma comanda específica.
 */
export async function obterComandaPorId(id) {
    const response = await api.get(
        `/comandas/${id}`
    );

    return response.data;
}

/**
 * Abre uma nova comanda pelo painel administrativo.
 *
 * O backend será responsável por:
 * - validar se o caixa está aberto;
 * - verificar a mesa;
 * - mudar a mesa para ocupada;
 * - criar a comanda;
 * - definir status Aberta;
 * - definir valor inicial 0;
 * - registrar o log.
 */
export async function abrirComanda(payload) {
    const response = await api.post(
        "/comandas/abrir",
        payload
    );

    return response.data;
}