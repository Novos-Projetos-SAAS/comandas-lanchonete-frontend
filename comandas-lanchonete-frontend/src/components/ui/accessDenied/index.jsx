import Link from "next/link";

import { ShieldAlert, ArrowLeft } from "lucide-react";

import styles from "./index.module.css";

export default function AccessDenied() {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconWrapper}>
                    <ShieldAlert size={56} className={styles.icon} strokeWidth={1.5} />
                </div>
                <h2 className={styles.title}>Acesso Restrito</h2>
                <p className={styles.message}>
                    Você não possui as permissões necessárias para visualizar este conteúdo. 
                    Se você acha que isso é um erro, por favor, contate o administrador do sistema.
                </p>
                <Link href="/admin" className={styles.button}>
                    <ArrowLeft size={18} />
                    <span>Voltar ao Dashboard</span>
                </Link>
            </div>
        </div>
    );
}