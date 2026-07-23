import api from "@/lib/api";

export async function listarCargos() {
    const response = await api.get("/cargos");
    return response.data;
}