import api from '@/lib/api';
import Cookies from 'js-cookie';

const OITO_HORAS_EM_DIAS = 8 / 24;

function opcoesTokenCookie() {
    return {
        expires: OITO_HORAS_EM_DIAS,
        secure: typeof window !== 'undefined'
            ? window.location.protocol === 'https:'
            : process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    };
}

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

        const token = resposta.data?.data?.token;
        const usuario = resposta.data?.data?.usuario;

        if (!token || !usuario?.id) {
            const erroCustomizado = new Error('Resposta de autenticação inválida');
            erroCustomizado.response = resposta;
            throw erroCustomizado;
        }

        // Cookie first-party do frontend. O interceptor do Axios usa este JWT
        // como Authorization Bearer já na primeira chamada para /auth/me.
        Cookies.set('token', token, opcoesTokenCookie());

        return usuario;
    },

    async getMe() {
        const resposta = await api.get('/auth/me');
        return resposta.data;
    },

    async logout() {
        try {
            await api.post('/auth/logout');
        } finally {
            Cookies.remove('token', { path: '/' });
        }
    }
};
