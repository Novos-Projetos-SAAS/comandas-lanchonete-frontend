import api from '@/lib/api';
import Cookies from 'js-cookie';

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

        const token = resposta.data.data.token;
        const usuario = resposta.data.data.usuario;

        Cookies.set('token', token, { expires: 1 });
        Cookies.set('role', usuario.cargo_id, { expires: 1 });

        return usuario;
    },

    async getMe() {
        const resposta = await api.get('/auth/me');
        return resposta.data;
    },

    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            if (error.response?.status !== 401) {
                console.warn('⚠️ Erro ao notificar backend sobre o logout:', error.message);
            }
        } finally {
            Cookies.remove('token', { path: '/' });
            Cookies.remove('role', { path: '/' });
        }
    }
};
