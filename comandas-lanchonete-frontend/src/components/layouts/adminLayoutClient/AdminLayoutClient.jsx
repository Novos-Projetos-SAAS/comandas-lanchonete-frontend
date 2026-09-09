"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header";
import Sidebar from "@/components/sidebar/Sidebar.jsx";
import styles from "./adminLayout.module.css";
import { useAuth } from "@/hooks/useAuth";
import { NotificationsProvider } from "@/contexts/NotificationsContext.jsx";

export default function AdminLayoutClient({ children }) {
    const [menuAberto, setMenuAberto] = useState(false);
    const { isReady, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isReady && !user) {
            router.replace("/login");
        }
    }, [isReady, user, router]);

    if (!isReady) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-background)', color: 'var(--text-primary)' }}>
                Carregando painel...
            </div>
        );
    }
    if (!user) {
        return null;
    }

    return (
        <NotificationsProvider>
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
        </NotificationsProvider>
    );
}
