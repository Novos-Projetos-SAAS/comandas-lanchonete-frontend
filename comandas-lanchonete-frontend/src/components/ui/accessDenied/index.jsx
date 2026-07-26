"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldX } from "lucide-react";
import styles from "./index.module.css";

/**
 * Estado padrão exibido quando o componente Can bloqueia uma rota protegida.
 */
export default function AccessDenied() {
    const router = useRouter();

    // router.back() devolve o usuário à última página permitida visitada.

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconWrapper}>
                    <ShieldX size={42} className={styles.icon} />
                </div>
                <h1 className={styles.title}>Acesso não permitido</h1>
                <p className={styles.message}>
                    Seu usuário não possui permissão para acessar esta área do sistema.
                </p>
                <button type="button" className={styles.button} onClick={() => router.back()}>
                    <ArrowLeft size={17} style={{ marginRight: 8 }} /> Voltar
                </button>
            </div>
        </div>
    );
}
