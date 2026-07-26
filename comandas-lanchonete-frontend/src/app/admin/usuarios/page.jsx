import UsuariosClient from "./UsuariosClient";
import Can from "@/components/ui/can/Can.jsx";
import AccessDenied from "@/components/ui/accessDenied";

import styles from "./page.module.css";

export const metadata = { title: "Categorias | Admin" };

export default function CategoriasPage() {
    return (
        <Can perform="usuarios.listar" fallback={<AccessDenied />}>
            <div className="page-container">
                <h1 className={styles.pageTitle}>Usuários</h1>
                <UsuariosClient />
            </div>
        </Can>
    );
}