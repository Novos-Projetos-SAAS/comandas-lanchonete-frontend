import api from '@/lib/api';
import Cookies from 'js-cookie';

export const authService = {
    async login(email, senha) {
        const resposta = await api.post('/auth/login', { email, senha }, {
            validateStatus: (status) => {
                // Aceita sucesso (200-299) E erros de autorização (401, 403, 404) como respostas normais do Axios
                return (status >= 200 && status < 300) || status === 401 || status === 403 || status === 404;
            }
        });


        // 🟢 Se não for sucesso (ex: deu 401), lançamos um erro limpo e controlado 
        // em formato de objeto JavaScript que o Next.js entende sem explodir a tela
        if (resposta.status !== 200) {
            const erroCustomizado = new Error("Falha na autenticação");
            erroCustomizado.response = resposta; // Anexa a resposta para o seu catch do hook ler!
            throw erroCustomizado;
        }

        const token = resposta.data.data.token;
        const usuario = resposta.data.data.usuario;

        // Salva o token no Cookie (expira em 1 dia, por exemplo)
        Cookies.set('token', token, { expires: 1 });

        // Se quiser salvar a permissão (role) também no cookie, como o seu api.js limpa:
        Cookies.set('role', usuario.cargo_id, { expires: 1 });

        // Salva os dados não-sensíveis (nome, email) no localStorage para a interface exibir
        localStorage.setItem('usuario', JSON.stringify(usuario));

        return usuario;
    },

    async getMe() {
        // Bate na rota do backend para pegar os dados frescos do usuário logado
        const resposta = await api.get('/auth/me');
        return resposta.data; // Retorna os dados atualizados
    },

    async logout() {
        try {
            // Tenta avisar o backend
            await api.post('/auth/logout');
        } catch (error) {
            // 🟢 SE O ERRO FOR 401 (Unauthorized), significa que a sessão já estava morta.
            // Não precisamos printar aviso nenhum no console nesse caso específico!
            if (error.response?.status !== 401) {
                console.warn('⚠️ Erro ao notificar backend sobre o logout:', error.message);
            }
        } finally {
            // A limpeza local continua garantida e blindada aconteça o que acontecer
            Cookies.remove('token', { path: '/' });
            Cookies.remove('role', { path: '/' });
            localStorage.removeItem('usuario');
        }
    }
};