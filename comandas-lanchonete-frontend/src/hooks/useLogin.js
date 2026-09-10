import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useAuth } from "./useAuth"; // 🟢 Olha o motor sendo importado aqui!
import { descartarSocket } from "@/lib/socket";
import { autenticarRenovandoSocket } from "@/lib/login-session.mjs";

export function useLogin() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    
    // Trazemos as funções brutas lá do motor
    const { login, refreshSession } = useAuth();

    async function handleLogin(email, senha) {
        setLoading(true);

        try {
            // 1. O motor faz o trabalho sujo de ir na API e salvar os Cookies
            const usuario = await autenticarRenovandoSocket({
                autenticar: () => login(email, senha),
                descartarSocket,
                atualizarSessao: refreshSession
            });

            const userRole = usuario.cargo?.nome || usuario.cargo || usuario.cargo_id;

            // 3. Mostra o alerta bonito
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                }
            });

            Toast.fire({
                icon: "success",
                title: `Bem-vindo, ${usuario.nome}!`
            });

            // 4. Manda o usuário para a rota certa
            if (userRole === "admin" || userRole === 'atendente' || userRole === 'entregador' || userRole === 1 || userRole === 2) {
                router.push("/admin"); 
            } else {
                router.push("/");
            }

        } catch (error) {

            console.error('Erro: ', error)

            const status = error.response?.status;
            const msg = error.response?.data?.message || "Erro ao conectar com o servidor.";

            if (status === 401 || status === 403 || status === 404) {
                Swal.fire({
                    icon: "error",
                    title: "Acesso Negado",
                    text: msg,
                    confirmButtonColor: "#ea580c"
                });
                return;
            }

            Swal.fire({
                icon: "error",
                title: "Erro no Servidor",
                text: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
                confirmButtonColor: "#d33"
            });

        } finally {
            setLoading(false);
        }
    }
    
    return { handleLogin, loading };
}
