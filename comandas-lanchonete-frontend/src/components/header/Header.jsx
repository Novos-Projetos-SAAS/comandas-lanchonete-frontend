"use client";

import { Menu, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import styles from "./Header.module.css";

export default function Header({ toggleMenu }) {
    const { user, logoutRequest } = useAuth();

    const toggleTema = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className={styles.header}>
            <button className={styles.menuBtn} onClick={toggleMenu}>
                <Menu size={24} />
            </button>

            <div className={styles.headerActions}>
                <button className={styles.iconBtn} onClick={toggleTema} title="Alternar Tema">
                    <Sun size={20} className={styles.sunIcon} />
                    <Moon size={20} className={styles.moonIcon} />
                </button>
                
                <div className={styles.userInfo}>
                    <span className={styles.userName}>Olá, {user?.nome || 'Usuário'}</span>
                </div>

                <button className={styles.logoutBtn} onClick={logoutRequest} title="Sair">
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}