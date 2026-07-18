"use client";

import { useState } from "react";
import Header from "@/components/Header/Header";
import Sidebar from "@/components/sidebar/Sidebar.jsx";
import styles from "./adminLayout.module.css";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLayoutClient({ children }) {
    const [menuAberto, setMenuAberto] = useState(false);
    const { isReady, user } = useAuth();

    if (!isReady) return <div>Carregando...</div>;
    if (!user) return <div>🚨 Usuário não encontrado!</div>;

    return (
        <div className={styles.layoutContainer}>
            {menuAberto && <div className={styles.backdrop} onClick={() => setMenuAberto(false)}></div>}
            
            <Sidebar isOpen={menuAberto} fecharMenu={() => setMenuAberto(false)} />

            <main className={styles.mainContent}>
                <Header toggleMenu={() => setMenuAberto(true)} />
                <div className={styles.pageContent}>
                    {children}
                </div>
            </main>
        </div>
    );
}