"use client";

import { useState } from "react";
import { useLogin } from "@/hooks/useLogin";
import styles from "./page.module.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    
    const { handleLogin, loading } = useLogin();

    const onSubmit = async (e) => {
        e.preventDefault();
        await handleLogin(email, senha);
    };

    const toggleTema = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <main className={styles.container}>
            <button 
                onClick={toggleTema} 
                style={{ position: 'absolute', top: 20, right: 20, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.85rem' }}
            >
                Alternar Tema
            </button>

            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <h1 className={styles.logo}>
                        Resenha <span className={styles.logoHighlight}>Espetos</span>
                    </h1>
                    <p className={styles.subtitle}>Acesse o painel gerencial</p>
                </div>

                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                        <label htmlFor="senha">Senha</label>
                        <input 
                            id="senha"
                            type="password" 
                            className={styles.input}
                            placeholder="••••••••" 
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
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