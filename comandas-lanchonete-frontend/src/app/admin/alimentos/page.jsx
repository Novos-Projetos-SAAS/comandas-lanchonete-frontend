import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import AlimentosClient from "./AlimentosClient";
import styles from "./page.module.css";

export const metadata = { title: "Alimentos | Admin" };

/**
 * Entrada protegida do cardápio administrativo.
 */
export default function AlimentosPage() {
    return (
        <Can perform="alimentos.listar" fallback={<AccessDenied />}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Alimentos</h1>
                    </div>
                </div>

                <AlimentosClient />
            </div>
        </Can>
    );
}
