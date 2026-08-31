import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import VendasClient from "./VendasClient";
import styles from "./page.module.css";

export const metadata = { title: "Vendas Rápidas | Admin" };

export default function VendasPage() {
    return <Can perform="vendas.listar" fallback={<AccessDenied />}>
        <div className={styles.container}>
            <div className={styles.heading}>
                <div>
                    <div className={styles.titleRow}>
                        <Link href="/admin/caixa" className={styles.backToCaixa} aria-label="Voltar para o caixa">
                            <ArrowLeft size={22} />
                        </Link>
                        <h1 className={styles.title}>Vendas Rápidas</h1>
                    </div>
                    <p className={styles.subtitle}>Histórico das vendas realizadas diretamente no balcão.</p>
                </div>
            </div>
            <VendasClient />
        </div>
    </Can>;
}
