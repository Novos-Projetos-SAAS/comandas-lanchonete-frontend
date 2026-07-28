import api from "@/lib/api";

/**
 * Consulta pública e somente de leitura utilizada pelo QR Code.
 */
export async function obterCardapioPublico(token) {
    const response = await api.get("/cardapio", {
        params: { token }
    });

    return response.data;
}
