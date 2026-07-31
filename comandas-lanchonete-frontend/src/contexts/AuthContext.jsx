// "use client"

// import { createContext, useState, useEffect, useContext, useCallback } from "react"
// import { useRouter, usePathname } from "next/navigation"
// import { authService } from "@/services/auth.service.js"
// 
// export const AuthContext = createContext();

// export function AuthProvider({ children }) {
//     const [user, setUser] = useState(null);
//     const [permissoes, setPermissoes] = useState([]);
//     const [isReady, setIsReady] = useState(false);

//     const router = useRouter();
//     const pathname = usePathname();

//     const logoutRequest = useCallback(() => {
//         authService.logout();
//         setUser(null);
//         setPermissoes([]);
//         router.replace('/login');
//     }, [router]);

//     const buscarDadosUsuario = useCallback(async () => {
//         const rotasPublicas = [
//             '/login',
//             '/auth/login',
//             '/forgot',
//             '/auth/forgot',
//             '/reset',
//             '/auth/reset',
//             '/cadastro-restrito',
//             '/esqueci-senha'
//         ];
//         const isRotaPublica = rotasPublicas.some(rota => pathname?.startsWith(rota));

//         try {
//             const resposta = await authService.getMe();
//             const usuarioFresco = resposta.data?.usuario || resposta.usuario;

//             if (usuarioFresco && usuarioFresco.id) {
//                 setUser(usuarioFresco);
//                 localStorage.setItem('usuario', JSON.stringify(usuarioFresco));

//                 // 🟢 Garantindo que extraímos o array correto (seja da propriedade solta ou de dentro do user)
//                 const listaPermissoes = usuarioFresco.permissoes || resposta.data?.permissoes || [];
//                 setPermissoes(listaPermissoes);

//                 setIsReady(true);
//             } else {
//                 throw new Error("Usuário não encontrado na resposta");
//             }
//         } catch (error) {
//             if (error.response && error.response.status === 401) {
//                 console.warn('⚠️ Usuário não autenticado.');
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

//             setIsReady(true);
//         }
//     }, [pathname, router]);

//     useEffect(() => {
//         console.log("♻️ useEffect disparado");
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
//     }, [buscarDadosUsuario]);

//     // Função de checagem de permissão pronta para uso
//     const hasPermission = useCallback((permissionName) => {
//         if (!permissionName) return true;
//         if (!user) return false;

//         // 🟢 BLINDAGEM DE TIPAGEM: Number() resolve problemas de "1" === 1
//         if (Number(user.cargo_id) === 1) return true;

//         // 🟢 BLINDAGEM DE FONTE: Lê do estado ou direto do objeto user como fallback
//         const lista = Array.isArray(permissoes) && permissoes.length > 0
//             ? permissoes
//             : (Array.isArray(user.permissoes) ? user.permissoes : []);

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
//             {isReady ? children : null}
//         </AuthContext.Provider>
//     );
// }

// export const useAuthContext = () => useContext(AuthContext);

"use client"

import { createContext, useState, useEffect, useContext, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/services/auth.service.js"

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [permissoes, setPermissoes] = useState([]);
    const [isReady, setIsReady] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    // 🟢 1. LOGOUT AGORA É ASYNC: Aguarda o service limpar o backend e os cookies com segurança
    const logoutRequest = useCallback(async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.warn("⚠️ Erro ao comunicar logout com o backend, limpando estado local...");
        } finally {
            setUser(null);
            setPermissoes([]);
            router.replace('/login');
        }
    }, [router]);

    const buscarDadosUsuario = useCallback(async () => {
        // 🟢 2. Rotas públicas atualizadas (suporta prefixos e rotas dinâmicas como /auth/reset/token)
        const rotasPublicas = [
            '/login',
            '/auth/login',
            '/forgot',
            '/auth/forgot',
            '/reset',
            '/auth/reset',
            '/cadastro-restrito',
            '/cardapio',
            '/esqueci-senha'
        ];
        
        // Verifica se a rota atual começa com alguma rota pública cadastrada
        const isRotaPublica = rotasPublicas.some(rota => pathname?.startsWith(rota));

        try {
            const resposta = await authService.getMe();
            const usuarioFresco = resposta.data?.usuario || resposta.usuario;

            if (usuarioFresco && usuarioFresco.id) {
                setUser(usuarioFresco);
                localStorage.setItem('usuario', JSON.stringify(usuarioFresco));

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

            // 🟢 3. Garante que o logout de limpeza utilize o novo método assíncrono do service
            try {
                await authService.logout();
            } catch (err) {
                // Silencia caso falhe a rede no catch
            }

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

        if (Number(user.cargo_id) === 1) return true;

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