import { Suspense } from "react";
import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import MesaDetalhesClient from "./MesaDetalhesClient";
import styles from "./page.module.css";

// Metadados usados pelo Next.js no título da aba.
export const metadata = { title: "Detalhes da Mesa | Admin" };

/**
 * Carrega a tela de detalhes dentro de Suspense porque ela lê parâmetros da URL.
 */
export default function MesaDetalhesPage() {
    return (
        <Can perform="mesas.listar" fallback={<AccessDenied />}>
            {/* Suspense fornece uma resposta visual enquanto os parâmetros são resolvidos. */}
            <Suspense fallback={<div className={styles.loadingCard}>Carregando dados da mesa...</div>}>
                <MesaDetalhesClient />
            </Suspense>
        </Can>
    );
}
