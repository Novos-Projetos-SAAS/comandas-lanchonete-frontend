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
            <div className="page-container">
                <h1 className={styles.pageTitle}>Alimentos</h1>
                <AlimentosClient />
            </div>
        </Can>
    );
}
