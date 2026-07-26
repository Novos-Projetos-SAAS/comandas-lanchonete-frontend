import { Suspense } from "react";

import CadastroRestritoClient from "./CadastroRestritoClient";

import styles from "./page.module.css";

export const metadata = {
    title: "Concluir Cadastro | Sistema",
    description: "Conclua seu cadastro no sistema através do convite de sua equipe."
};

export default function CadastroRestritoPage() {
    return (
        <main className={styles.mainContainer}>
            <Suspense fallback={<div className={styles.loadingCard}>Carregando convite...</div>}>
                <CadastroRestritoClient />
            </Suspense>
        </main>
    );
}