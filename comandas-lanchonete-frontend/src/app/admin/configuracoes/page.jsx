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
            <div className={styles.container}>
                <div className={styles.heading}>
                    <div>
                        <h1 className={styles.title}>Configurações</h1>
                        <p className={styles.subtitle}>
                            Gerencie o funcionamento e as preferências do estabelecimento.
                        </p>
                    </div>
                </div>

                <ConfiguracoesClient />
            </div>
        </Can>
    );
}
