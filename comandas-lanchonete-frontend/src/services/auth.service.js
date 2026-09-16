import api from '@/lib/api';

export const authService = {
    async login(email, senha) {
        const resposta = await api.post('/auth/login', {
            email,
            senha
        });

        return resposta.data.data.usuario;
    },

    async getMe() {
        const resposta = await api.get('/auth/me');
        return resposta.data;
    },

    async logout() {
        await api.post('/auth/logout');
    }
};