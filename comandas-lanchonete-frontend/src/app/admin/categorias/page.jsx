import CategoriasClient from "./CategoriasClient.jsx";
import Can from "@/components/ui/can/Can.jsx";
import AccessDenied from "@/components/ui/accessDenied";
import styles from "./page.module.css";


export const metadata = { title: "Categorias | Admin" };

export default function CategoriasPage() {
    return (
        <Can perform="categorias_alimentos.listar" fallback={<AccessDenied />}>
            <div className="page-container">
                <h1 className={styles.pageTitle}>Categorias de Alimentos</h1>
                <CategoriasClient />
            </div>
        </Can>
    );
}