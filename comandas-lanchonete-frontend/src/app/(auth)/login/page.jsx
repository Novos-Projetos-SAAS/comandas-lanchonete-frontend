"use client";

import { useState } from "react";
import Link from "next/link";
import { useLogin } from "@/hooks/useLogin";
import { Moon, Sun, Eye, EyeOff } from "lucide-react";
import styles from "./page.module.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [temaDark, setTemaDark] = useState(false);
    
    // 🟢 Novo estado para controlar a visibilidade da senha
    const [showPassword, setShowPassword] = useState(false);
    
    const { handleLogin, loading } = useLogin();

    const onSubmit = async (e) => {
        e.preventDefault();
        await handleLogin(email, senha);
    };

    const toggleTema = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const novoTema = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', novoTema);
        setTemaDark(novoTema === 'dark');
    };

    return (
        <main className={styles.container}>
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
                <header className={styles.header}>
                    <h1 className={styles.logo}>
                        Resenha <span className={styles.logoHighlight}>Espetos</span>
                    </h1>
                    <p className={styles.subtitle}>Acesse o painel gerencial</p>
                </header>

                <form onSubmit={onSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email">E-mail</label>
                        <input 
                            id="email"
                            type="email" 
                            className={styles.input}
                            placeholder="admin@resenha.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <div className={styles.labelRow}>
                            <label htmlFor="senha">Senha</label>
                            <Link href="/forgot" className={styles.forgotLink}>
                                Esqueceu a senha?
                            </Link>
                        </div>
                        
                        {/* 🟢 Container relativo para posicionar o olhinho perfeitamente dentro do input */}
                        <div className={styles.inputWrapper}>
                            <input 
                                id="senha"
                                type={showPassword ? "text" : "password"} 
                                className={styles.input}
                                placeholder="••••••••" 
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                autoComplete="current-password"
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
                    </div>
                    
                    <button 
                        type="submit" 
                        className={styles.btnSubmit}
                        disabled={loading}
                    >
                        {loading ? "Autenticando..." : "Entrar no Sistema"}
                    </button>
                </form>
            </div>
        </main>
    );
}