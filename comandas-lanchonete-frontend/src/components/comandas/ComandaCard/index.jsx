"use client";

import Link from "next/link";
import { memo } from "react";
import {
    ChevronRight,
    UserRound
} from "lucide-react";
import styles from "./index.module.css";

const formatarMoeda=valor=>new Intl.NumberFormat("pt-BR",{
    style:"currency",
    currency:"BRL"
}).format(Number(valor||0));

function obterVisualComanda(status){
    switch(status){
        case "Aberta":
            return {
                label:"Aberta",
                className:styles.cardOpen
            };

        case "Aguardando Pagamento":
            return {
                label:"Aguardando pagamento",
                className:styles.cardWaiting
            };

        case "Paga":
            return {
                label:"Paga",
                className:styles.cardPaid
            };

        case "Cancelada":
            return {
                label:"Cancelada",
                className:styles.cardCanceled
            };

        default:
            return {
                label:status||"Não informado",
                className:styles.cardDefault
            };
    }
}

function ComandaCard({comanda}){
    const visual=obterVisualComanda(comanda.status);

    return (
        <article
            className={`${styles.orderCard} ${visual.className}`}
        >
            <div className={styles.statusBar}>
                <span className={styles.status}>
                    <i />
                    {visual.label}
                </span>

                <span className={styles.commandId}>
                    #{comanda.id}
                </span>
            </div>

            <div className={styles.cardContent}>
                <div className={styles.tableArea}>
                    <span>Mesa</span>
                    <strong>
                        {comanda.numero_mesa}
                    </strong>
                </div>

                <div className={styles.customer}>
                    <UserRound size={16} />

                    <div>
                        <span>Cliente</span>

                        <strong>
                            {comanda.cliente_nome||"Não informado"}
                        </strong>
                    </div>
                </div>
            </div>

            <div className={styles.cardFooter}>
                <div className={styles.total}>
                    <span>Total</span>

                    <strong>
                        {formatarMoeda(comanda.valor_total)}
                    </strong>
                </div>

                <Link
                    href={`/admin/comandas/${comanda.id}`}
                    className={styles.manageButton}
                >
                    Gerenciar
                    <ChevronRight size={16} />
                </Link>
            </div>
        </article>
    );
}

export default memo(ComandaCard);