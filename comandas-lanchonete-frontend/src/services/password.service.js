import api from "@/lib/api";

export async function forgotPassword(email) {
    const response = await api.post('/auth/password/forgot', { email });
    return response.data;
}

export async function resetPassword(token, senha) {
    const response = await api.post(`/auth/password/reset/${token}`, { senha });
    return response.data;
}

