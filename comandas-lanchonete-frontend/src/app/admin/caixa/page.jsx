import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import CaixaClient from "./CaixaClient";
import styles from "./page.module.css";

export const metadata = { title: "Caixa | Admin" };

export default function CaixaPage() {
    return (
        <Can perform="caixas.visualizar" fallback={<AccessDenied />}>
            <div className={styles.container}>
                <div>
                    <h1 className={styles.title}>Caixa</h1>
                    <p className={styles.subtitle}>
                        Abertura, recebimentos e fechamento simples do turno.
                    </p>
                </div>
                <CaixaClient />
            </div>
        </Can>
    );
}
