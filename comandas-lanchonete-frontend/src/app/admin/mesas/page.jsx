import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import MesasClient from "./MesasClient";
import styles from "./page.module.css";

// Metadados usados pelo Next.js no título da aba.
export const metadata = { title: "Mesas | Admin" };

/**
 * Página de entrada do módulo.
 * O componente Can impede o acesso sem a permissão mesas.listar.
 */
export default function MesasPage() {
    return (
        <Can perform="mesas.listar" fallback={<AccessDenied />}>
            <div className={styles.container}>
                <div className={styles.heading}>
                    <div>
                        <h1 className={styles.title}>Mapa de Mesas</h1>
                        <p className={styles.subtitle}>
                            Acompanhe a ocupação do salão e identifique rapidamente mesas que precisam de atenção.
                        </p>
                    </div>
                </div>

                {/* Toda a lógica interativa da listagem fica no Client Component. */}
                <MesasClient />
            </div>
        </Can>
    );
}
