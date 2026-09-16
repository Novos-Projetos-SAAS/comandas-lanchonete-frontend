import api from '@/lib/api';

export const authService = {
    async login(email, senha) {
        const resposta = await api.post('/auth/login', { email, senha }, {
            validateStatus: (status) => {
                return (status >= 200 && status < 300) || status === 401 || status === 403 || status === 404;
            }
        });

        if (resposta.status !== 200) {
            const erroCustomizado = new Error('Falha na autenticação');
            erroCustomizado.response = resposta;
            throw erroCustomizado;
        }

        const usuario = resposta.data?.data?.usuario;

        if (!usuario?.id) {
            const erroCustomizado = new Error('Resposta de autenticação inválida');
            erroCustomizado.response = resposta;
            throw erroCustomizado;
        }

        return usuario;
    },

    async getMe() {
        const resposta = await api.get('/auth/me');
        return resposta.data;
    },

    async logout() {
        await api.post('/auth/logout');
    }
};
