import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import ConfiguracoesClient from "./ConfiguracoesClient";
import styles from "./page.module.css";

export const metadata = { title: "Configurações | Admin" };

/**
 * A página exige loja.configurar para consulta.
 * A permissão loja.status é verificada separadamente na ação de abrir ou fechar.
 */
export default function ConfiguracoesPage() {
    return (
        <Can perform="loja.configurar" fallback={<AccessDenied />}>
            <div className="page-container">
                <h1 className={styles.pageTitle}>Configurações</h1>
                <ConfiguracoesClient />
            </div>
        </Can>
    );
}
