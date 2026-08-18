import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";

import ComandasClient from "./ComandasClient";

import styles from "./page.module.css";

export const metadata = {
    title: "Pedidos / Comandas | Admin"
};

export default function ComandasPage() {
    return (
        <Can
            perform="comandas.listar"
            fallback={<AccessDenied />}
        >
            <div className={styles.container}>
                <div className={styles.heading}>
                    <div>
                        <h1 className={styles.title}>
                            Pedidos / Comandas
                        </h1>
                    </div>
                </div>

                <ComandasClient />
            </div>
        </Can>
    );
}