import { Suspense } from "react";
import CardapioClient from "./CardapioClient";
import styles from "./page.module.css";

export const metadata = { title: "Cardápio | Resenha Espetos" };

export default function CardapioPage() {
    return (
        <Suspense fallback={<div className={styles.loading}>Carregando cardápio...</div>}>
            <CardapioClient />
        </Suspense>
    );
}
