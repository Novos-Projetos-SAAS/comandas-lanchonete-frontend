"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { forgotPassword, resetPassword } from "@/services/password.service";
import Swal from "sweetalert2";

export const usePasswordRecovery = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    
    const router = useRouter();

    /**
     * 1. Solicitação do link de recuperação por e-mail
     * @param {string} email 
     */
    const requestRecovery = useCallback(async (email) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await forgotPassword(email);
            
            // Define a mensagem que fará o componente da página renderizar o card de sucesso
            setSuccessMessage(
                "Se o e-mail informado estiver cadastrado no sistema, você receberá uma mensagem em instantes com as instruções para redefinição."
            );
        } catch (err) {
            // Extrai a mensagem de erro limpa da resposta do nosso errorHandler do backend
            const mensagemErro = err.response?.data?.message || "Não foi possível processar a solicitação no momento. Tente novamente mais tarde.";
            setError(mensagemErro);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * 2. Efetivação da troca de senha
     * @param {string} token - Token obtido pela URL [token]
     * @param {string} novaSenha - Nova senha validada no front-end
     */
    const performReset = useCallback(async (token, novaSenha) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await resetPassword(token, novaSenha);
            
            // Feedback visual de sucesso usando o nosso SweetAlert2 padrão da marca
            await Swal.fire({
                title: "Senha Alterada!",
                text: "Sua nova senha foi salva com sucesso. Você já pode acessar o painel.",
                icon: "success",
                confirmButtonColor: "#ea580c",
                confirmButtonText: "Ir para o Login",
                timer: 4000,
                timerProgressBar: true
            });

            // Redireciona o usuário para a tela de autenticação
            router.push("/login");
        } catch (err) {
            const mensagemErro = err.response?.data?.message || "Não foi possível redefinir a senha. O link pode estar expirado ou já ter sido utilizado.";
            setError(mensagemErro);
            
            // Alerta visual de falha caso o token já tenha vencido no banco (após 1 hora)
            Swal.fire({
                title: "Falha na Redefinição",
                text: mensagemErro,
                icon: "error",
                confirmButtonColor: "#dc2626"
            });
        } finally {
            setLoading(false);
        }
    }, [router]);

    /**
     * 3. Utilitário para limpar os estados manuais (para botões de "tentar novamente")
     */
    const clearState = useCallback(() => {
        setError(null);
        setSuccessMessage(null);
    }, []);

    return {
        loading,
        error,
        successMessage,
        requestRecovery,
        performReset,
        clearState
    };
};