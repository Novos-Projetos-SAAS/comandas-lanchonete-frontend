import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import VendasClient from "./VendasClient";
import styles from "./page.module.css";

export const metadata = { title: "Vendas Rápidas | Admin" };

export default function VendasPage() {
    return (
        <Can perform="vendas.listar" fallback={<AccessDenied />}>
            <div className="page-container">
                <div className={styles.titleRow}>
                    <Link href="/admin/caixa" className={styles.backToCaixa} aria-label="Voltar para o caixa">
                        <ArrowLeft size={22} />
                    </Link>
                    <h1 className={styles.pageTitle}>Vendas Rápidas</h1>
                </div>
                <VendasClient />
            </div>
        </Can>
    );
}
