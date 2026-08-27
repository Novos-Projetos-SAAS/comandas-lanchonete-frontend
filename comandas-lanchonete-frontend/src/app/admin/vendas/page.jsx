import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import VendasClient from "./VendasClient";
import styles from "./page.module.css";

export const metadata = { title: "Vendas Rápidas | Admin" };

export default function VendasPage() {
    return <Can perform="vendas.listar" fallback={<AccessDenied />}><div className={styles.container}><div className={styles.heading}><div><h1 className={styles.title}>Vendas Rápidas</h1><p className={styles.subtitle}>Histórico das vendas realizadas diretamente no balcão.</p></div></div><VendasClient /></div></Can>;
}
