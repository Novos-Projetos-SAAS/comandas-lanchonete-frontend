import api from '@/lib/api';
import Cookies from 'js-cookie';

export const authService = {
    async login(email, senha) {
        const resposta = await api.post('/auth/login', { email, senha });
        
        console.log(resposta);
        

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

    logout() {
        Cookies.remove('token');
        Cookies.remove('role');
        localStorage.removeItem('usuario');
        // window.location.href = '/login';
    }
};