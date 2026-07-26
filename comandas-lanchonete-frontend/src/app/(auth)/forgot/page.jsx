'use client';

import { useState } from "react";
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import Swal from "sweetalert2";
import InputForm from "@/components/ui/inputForm";
import { usePasswordRecovery } from "@/hooks/usePasswordDiscovery"; // Ou usePasswordRecovery
import { validateEmail } from "@/utils/validators";
import styles from './page.module.css';

export default function ForgotPage() {
    const { requestRecovery, loading, error, successMessage } = usePasswordRecovery();
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            Swal.fire({
                title: "E-mail Inválido",
                text: "Por favor, insira um endereço de e-mail válido para prosseguir.",
                icon: "warning",
                confirmButtonColor: "#ea580c"
            });
            return;
        }

        await requestRecovery(email);
    };

    return (
        <main className={styles.pageContainer}>
            <div className={styles.card}>
                
                {/* 🟢 SEPARAÇÃO TOTAL: Se tiver mensagem de sucesso, mostra SÓ A TELA DE SUCESSO */}
                {successMessage ? (
                    <div className={styles.feedbackBox}>
                        <div className={styles.successIconWrapper}>
                            <CheckCircle2 size={56} className={styles.successIcon} />
                        </div>
                        <h2 className={styles.feedbackTitle}>E-mail Enviado!</h2>
                        <p className={styles.feedbackText}>{successMessage}</p>
                        
                        <Link href="/login" className={styles.btnPrimary}>
                            Voltar para o Login
                        </Link>
                    </div>
                ) : (
                    /* 🟢 TELA DE FORMULÁRIO (Header movido para CÁ DENTRO) */
                    <div className={styles.formContainer}>
                        <header className={styles.header}>
                            <div className={styles.iconWrapper}>
                                <KeyRound size={24} />
                            </div>
                            <h1 className={styles.title}>Recuperar senha</h1>
                            <p className={styles.subtitle}>
                                Informe seu e-mail para receber um link de redefinição.
                            </p>
                        </header>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.inputGroup}>
                                <InputForm
                                    label="E-mail cadastrado"
                                    icon={Mail}
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="exemplo@resenhaespetos.com.br"
                                    required
                                />
                            </div>

                            {error && (
                                <div className={styles.errorAlert}>
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className={styles.btnPrimary} 
                                disabled={loading}
                            >
                                {loading ? "Enviando link..." : "Enviar link de recuperação"}
                            </button>

                            <Link href="/login" className={styles.btnBack}>
                                <ArrowLeft size={16} />
                                <span>Voltar para o Login</span>
                            </Link>
                        </form>
                    </div>
                )}
            </div>

            <footer className={styles.footer}>
                <span>© 2026 • Sistema de Gestão Resenha Espetos</span>
            </footer>
        </main>
    );
}