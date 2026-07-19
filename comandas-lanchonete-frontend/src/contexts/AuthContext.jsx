"use client"

import { createContext, useState, useEffect, useContext, useCallback } from "react"
import Cookies from "js-cookie";
import { authService } from "@/services/auth.service.js"
import { useRouter, usePathname } from "next/navigation"

export const AuthContext = createContext();


export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [permissoes, setPermissoes] = useState([]);

    // isReady bloqueia a tela até o Next.js saber se o cara tá logado ou não
    const [isReady, setIsReady] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    const logoutRequest = useCallback(() => {
        authService.logout();
        setUser(null);
        setPermissoes([]);
    }, []);

    const buscarDadosUsuario = useCallback(async () => {
    try {
        const resposta = await authService.getMe();
        const usuarioFresco = resposta.data?.usuario || resposta.usuario;

        if (usuarioFresco && usuarioFresco.id) {
            setUser(usuarioFresco);
            localStorage.setItem('usuario', JSON.stringify(usuarioFresco));
            setPermissoes(usuarioFresco.permissoes || []);
            setIsReady(true); 
        } else {
            throw new Error("Usuário não encontrado na resposta");
        }
    } catch (error) {
        console.error('🚨 Erro ao validar sessão:', error.message);
        
        // Limpa os dados de sessão
        authService.logout();
        setUser(null);
        setPermissoes([]);
        
        // 🟢 TRAVA DE SEGURANÇA: Só redireciona se NÃO estiver na tela de login
        if (pathname !== '/login') {
            router.push('/login');
        }
        
        setIsReady(true); // Libera a tela para renderizar o login em paz
    }
    }, [pathname, router]); // Adicione pathname e router nas dependências do useCallback
    
    useEffect(() => {

        console.log("♻️ useEffect disparado"); // 🟢 LOG DE DISPARO
        let isMounted = true;

        const inicializarSessao = async () => {
            if (isMounted) {
                await buscarDadosUsuario();
            }
        };

        inicializarSessao();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Função de checagem de permissão pronta para uso
    const hasPermission = useCallback((permissionName) => {
        if (!permissionName) return true;
        if (!user) return false;

        // 🟢 CORREÇÃO: Verifique o cargo_id que você já tem no objeto user
        // Se o seu admin no banco tem cargo_id = 1, use isso:
        if (user.cargo_id === 1) return true;

        // 🟢 Garantir que permissoes é um array antes de testar
        const lista = Array.isArray(permissoes) ? permissoes : [];

        return lista.includes(permissionName);
    }, [permissoes, user]);

    return (
        <AuthContext.Provider value={{
            user,
            permissoes,
            hasPermission,
            isReady,
            refreshSession: buscarDadosUsuario,
            logoutRequest,
            login: authService.login
        }}>
            {/* A tela fica preta/vazia até o isReady ser true, evitando "flashes" de tela de erro */}
            {isReady ? children : null}
        </AuthContext.Provider>
    );
}


// O Hook que você exportou embaixo (Substitui a necessidade de criar um arquivo useAuth.js)
export const useAuthContext = () => useContext(AuthContext);