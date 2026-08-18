import CaixaClient from "./CaixaClient";
import styles from "./page.module.css";

export const metadata = {
    title: "Caixa | PDV",
    description: "Gestão de caixa e movimentações do turno",
};

export default function CaixaPage() {
    return (
        <div className={styles.pageContainer}>
            <CaixaClient />
        </div>
    );
}