'use client';

import { useState } from "react";
import { useParams } from 'next/navigation';
import Link from "next/link";
import { Lock, Eye, EyeOff, Check, X, ShieldCheck, AlertCircle, Moon, Sun, ArrowLeft } from 'lucide-react';
import Swal from "sweetalert2";
import { usePasswordRecovery } from "@/hooks/usePasswordDiscovery"; // Ou usePasswordRecovery
import styles from './page.module.css';

export default function ResetPasswordPage() {
    const params = useParams();
    const token = params?.token;
    
    const { performReset, loading, error } = usePasswordRecovery();

    const [passwords, setPasswords] = useState({
        password: "",
        confirmPassword: ""
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [temaDark, setTemaDark] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const toggleTema = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const novoTema = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', novoTema);
        setTemaDark(novoTema === 'dark');
    };

    // Regras de Força de Senha (12 caracteres, maiúscula, minúscula, número e especial)
    const passwordRules = {
        length: passwords.password.length >= 12,
        capital: /[A-Z]/.test(passwords.password),
        lower: /[a-z]/.test(passwords.password),
        number: /\d/.test(passwords.password),
        special: /[\W_]/.test(passwords.password),
    };

    const isPasswordValid = Object.values(passwordRules).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isPasswordValid) {
            Swal.fire({
                title: "Senha Fraca",
                text: "Sua nova senha precisa atender a todos os requisitos de segurança da lista.",
                icon: "warning",
                confirmButtonColor: "#ea580c"
            });
            return;
        }

        if (passwords.password !== passwords.confirmPassword) {
            Swal.fire({
                title: "Senhas Divergentes",
                text: "O campo de confirmação deve ser exatamente igual à nova senha digitada.",
                icon: "error",
                confirmButtonColor: "#dc2626"
            });
            return;
        }

        await performReset(token, passwords.password);
    };

    // 🟢 TELA DE TOKEN INVÁLIDO (Mantendo o design limpo do sistema)
    if (!token) {
        return (
            <main className={styles.container}>
                <div className={styles.loginCard} style={{ textAlign: "center", gap: "1.5rem" }}>
                    <div className={styles.iconWrapper} style={{ margin: "0 auto" }}>
                        <AlertCircle size={28} color="#dc2626" />
                    </div>
                    <h2 className={styles.title} style={{ color: "#dc2626" }}>Token Inválido</h2>
                    <p className={styles.subtitle}>
                        O link de redefinição não foi encontrado ou já expirou. Por favor, solicite uma nova recuperação.
                    </p>
                    <Link href="/forgot" className={styles.btnSubmit} style={{ textDecoration: "none", display: "block" }}>
                        Solicitar novo link
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            {/* Botão flutuante de tema idêntico ao Login */}
            <button 
                onClick={toggleTema} 
                className={styles.themeToggleBtn}
                title="Alternar entre modo claro e escuro"
                type="button"
            >
                {temaDark ? <Sun size={18} /> : <Moon size={18} />}
                <span>Alternar Tema</span>
            </button>

            <div className={styles.loginCard}>
                
                {/* 🟢 CABEÇALHO CENTRALIZADO */}
                <header className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <ShieldCheck size={26} />
                    </div>
                    <h1 className={styles.title}>Criar nova senha</h1>
                    <p className={styles.subtitle}>
                        Escolha uma senha forte e segura para proteger o acesso à sua conta.
                    </p>
                </header>

                <form className={styles.form} onSubmit={handleSubmit}>
                    
                    {/* 🟢 CAMPO NOVA SENHA COM INPUT NATIVO */}
                    <div className={styles.formGroup}>
                        <label htmlFor="password">Nova Senha</label>
                        <div className={styles.inputWrapper}>
                            <input 
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className={styles.input}
                                value={passwords.password}
                                onChange={handleChange}
                                placeholder="••••••••••••"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Ocultar senha" : "Ver senha"}
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Checklist Dinâmico de Segurança */}
                        {passwords.password.length > 0 && (
                            <div className={styles.requirementsList}>
                                <PasswordRequirement label="Mínimo de 12 caracteres" met={passwordRules.length} />
                                <PasswordRequirement label="Pelo menos uma letra maiúscula" met={passwordRules.capital} />
                                <PasswordRequirement label="Pelo menos uma letra minúscula" met={passwordRules.lower} />
                                <PasswordRequirement label="Pelo menos um número" met={passwordRules.number} />
                                <PasswordRequirement label="Pelo menos um caractere especial (!@#$...)" met={passwordRules.special} />
                            </div>
                        )}
                    </div>

                    {/* 🟢 CAMPO CONFIRMAR SENHA COM INPUT NATIVO */}
                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                        <div className={styles.inputWrapper}>
                            <input 
                                id="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                name="confirmPassword"
                                className={styles.input}
                                value={passwords.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••••••"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowConfirm(!showConfirm)}
                                title={showConfirm ? "Ocultar senha" : "Ver senha"}
                                tabIndex="-1"
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className={styles.errorAlert}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className={styles.btnSubmit} 
                        disabled={loading || !isPasswordValid}
                    >
                        {loading ? "Salvando nova senha..." : "Redefinir Senha"}
                    </button>

                    <Link href="/login" className={styles.btnBack}>
                        <ArrowLeft size={16} />
                        <span>Voltar para o Login</span>
                    </Link>
                </form>
            </div>

            {/* 🟢 RODAPÉ MOVIDO PARA FORA DO CARD */}
            <footer className={styles.footer}>
                <span>© 2026 • Sistema de Gestão Resenha Espetos</span>
            </footer>
        </main>
    );
}

// Subcomponente de Item do Checklist
function PasswordRequirement({ label, met }) {
    return (
        <div className={`${styles.reqItem} ${met ? styles.reqMet : styles.reqPending}`}>
            {met ? <Check size={14} className={styles.iconMet} /> : <X size={14} className={styles.iconPending} />}
            <span>{label}</span>
        </div>
    );
}