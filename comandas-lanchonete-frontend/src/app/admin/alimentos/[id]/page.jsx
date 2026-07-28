import { Suspense } from "react";
import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import ProdutoDetalhesClient from "./ProdutoDetalhesClient";
import styles from "./page.module.css";

export const metadata = { title: "Detalhes do Produto | Admin" };

export default function ProdutoDetalhesPage() {
    return (
        <Can perform="alimentos.listar" fallback={<AccessDenied />}>
            <Suspense fallback={<div className={styles.loading}>Carregando produto...</div>}>
                <ProdutoDetalhesClient />
            </Suspense>
        </Can>
    );
}
