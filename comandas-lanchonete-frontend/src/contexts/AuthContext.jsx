// "use client"

// import { createContext, useState, useEffect, useContext, useCallback } from "react"

// import { useRouter, usePathname } from "next/navigation"

// import { authService } from "@/services/auth.service.js"

// import Cookies from "js-cookie";

// export const AuthContext = createContext();

// export function AuthProvider({ children }) {
//     const [user, setUser] = useState(null);
//     const [permissoes, setPermissoes] = useState([]);

//     // isReady bloqueia a tela até o Next.js saber se o cara tá logado ou não
//     const [isReady, setIsReady] = useState(false);

//     const router = useRouter();
//     const pathname = usePathname();

//     const logoutRequest = useCallback(() => {
//         authService.logout();
//         setUser(null);
//         setPermissoes([]);
//     }, []);

//     const buscarDadosUsuario = useCallback(async () => {

//         const rotasPublicas = ['/login', '/cadastro-restrito', '/esqueci-senha'];
//         const isRotaPublica = rotasPublicas.some(rota => pathname?.startsWith(rota));

//         try {
//             const resposta = await authService.getMe();
//             const usuarioFresco = resposta.data?.usuario || resposta.usuario;

//             if (usuarioFresco && usuarioFresco.id) {
//                 setUser(usuarioFresco);
//                 localStorage.setItem('usuario', JSON.stringify(usuarioFresco));
//                 setPermissoes(usuarioFresco.permissoes || []);
//                 setIsReady(true);
//             } else {
//                 throw new Error("Usuário não encontrado na resposta");
//             }
//         } catch (error) {
//             if (error.response && error.response.status === 401) {
//                 console.warn('⚠️ Usuário não autenticado. Redirecionando para o login.');
//             } else {
//                 console.error('🚨 Erro ao validar sessão:', error.message);
//             }

//             authService.logout();
//             setUser(null);
//             setPermissoes([]);

//             if (!isRotaPublica) {
//                 console.warn('🔄 Rota protegida. Redirecionando para o login...');
//                 router.push('/login');
//             }

//             // if (pathname !== '/login') {
//             //     router.push('/login');
//             // }

//             setIsReady(true);
//         }
//     }, [pathname, router]); // Adicione pathname e router nas dependências do useCallback

//     useEffect(() => {

//         console.log("♻️ useEffect disparado"); // 🟢 LOG DE DISPARO
//         let isMounted = true;

//         const inicializarSessao = async () => {
//             if (isMounted) {
//                 await buscarDadosUsuario();
//             }
//         };

//         inicializarSessao();

//         return () => {
//             isMounted = false;
//         };
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [buscarDadosUsuario]);

//     // Função de checagem de permissão pronta para uso
//     const hasPermission = useCallback((permissionName) => {
//         if (!permissionName) return true;
//         if (!user) return false;

//         // 🟢 CORREÇÃO: Verifique o cargo_id que você já tem no objeto user
//         // Se o seu admin no banco tem cargo_id = 1, use isso:
//         if (Number(user.cargo_id) === 1) return true;

//         // 🟢 Garantir que permissoes é um array antes de testar
//         const lista = Array.isArray(permissoes) ? permissoes : [];

//         return lista.includes(permissionName);
//     }, [permissoes, user]);

//     return (
//         <AuthContext.Provider value={{
//             user,
//             permissoes,
//             hasPermission,
//             isReady,
//             refreshSession: buscarDadosUsuario,
//             logoutRequest,
//             login: authService.login
//         }}>
//             {/* A tela fica preta/vazia até o isReady ser true, evitando "flashes" de tela de erro */}
//             {isReady ? children : null}
//         </AuthContext.Provider>
//     );
// }


// // O Hook que você exportou embaixo (Substitui a necessidade de criar um arquivo useAuth.js)
// export const useAuthContext = () => useContext(AuthContext);

"use client"

import { createContext, useState, useEffect, useContext, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/services/auth.service.js"
import Cookies from "js-cookie";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [permissoes, setPermissoes] = useState([]);
    const [isReady, setIsReady] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    const logoutRequest = useCallback(() => {
        authService.logout();
        setUser(null);
        setPermissoes([]);
    }, []);

    const buscarDadosUsuario = useCallback(async () => {
        const rotasPublicas = ['/login', '/cadastro-restrito', '/esqueci-senha'];
        const isRotaPublica = rotasPublicas.some(rota => pathname?.startsWith(rota));

        try {
            const resposta = await authService.getMe();
            const usuarioFresco = resposta.data?.usuario || resposta.usuario;

            if (usuarioFresco && usuarioFresco.id) {
                setUser(usuarioFresco);
                localStorage.setItem('usuario', JSON.stringify(usuarioFresco));
                
                // 🟢 Garantindo que extraímos o array correto (seja da propriedade solta ou de dentro do user)
                const listaPermissoes = usuarioFresco.permissoes || resposta.data?.permissoes || [];
                setPermissoes(listaPermissoes);
                
                setIsReady(true);
            } else {
                throw new Error("Usuário não encontrado na resposta");
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.warn('⚠️ Usuário não autenticado.');
            } else {
                console.error('🚨 Erro ao validar sessão:', error.message);
            }

            authService.logout();
            setUser(null);
            setPermissoes([]);

            if (!isRotaPublica) {
                console.warn('🔄 Rota protegida. Redirecionando para o login...');
                router.push('/login');
            }

            setIsReady(true);
        }
    }, [pathname, router]);

    useEffect(() => {
        console.log("♻️ useEffect disparado");
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
    }, [buscarDadosUsuario]);

    // Função de checagem de permissão pronta para uso
    const hasPermission = useCallback((permissionName) => {
        if (!permissionName) return true;
        if (!user) return false;

        // 🟢 BLINDAGEM DE TIPAGEM: Number() resolve problemas de "1" === 1
        if (Number(user.cargo_id) === 1) return true;

        // 🟢 BLINDAGEM DE FONTE: Lê do estado ou direto do objeto user como fallback
        const lista = Array.isArray(permissoes) && permissoes.length > 0 
            ? permissoes 
            : (Array.isArray(user.permissoes) ? user.permissoes : []);

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
            {isReady ? children : null}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);