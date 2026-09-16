"use client";

import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth.service.js";
import { rotaPublica } from "@/lib/route-access.mjs";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [permissoes, setPermissoes] = useState([]);
    const [isReady, setIsReady] = useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const isRotaPublica = rotaPublica(pathname);

    const logoutRequest = useCallback(async () => {
        try {
            await authService.logout();
        } catch {
        } finally {
            setUser(null);
            setPermissoes([]);
            router.replace('/login');
        }
    }, [router]);

    const buscarDadosUsuario = useCallback(async () => {
        try {
            const resposta = await authService.getMe();
            const usuarioFresco = resposta.data?.usuario || resposta.usuario;

            if (!usuarioFresco?.id) {
                throw new Error("Usuário não encontrado na resposta");
            }

            setUser(usuarioFresco);

            const listaPermissoes = usuarioFresco.permissoes || resposta.data?.permissoes || [];
            setPermissoes(listaPermissoes);
        } catch (error) {
            if (error.response?.status !== 401) {
                console.error('Erro ao validar sessão:', error.message);
            }

            try {
                await authService.logout();
            } catch {
            }

            setUser(null);
            setPermissoes([]);
            router.replace('/login');
        } finally {
            setIsReady(true);
        }
    }, [router]);

    useEffect(() => {
        let ativo = true;

        if (isRotaPublica) {
            setIsReady(true);
            return () => {
                ativo = false;
            };
        }

        setIsReady(false);

        const inicializarSessao = async () => {
            if (ativo) {
                await buscarDadosUsuario();
            }
        };

        inicializarSessao();

        return () => {
            ativo = false;
        };
    }, [isRotaPublica, buscarDadosUsuario]);

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
            {(isRotaPublica || isReady) ? children : null}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);
