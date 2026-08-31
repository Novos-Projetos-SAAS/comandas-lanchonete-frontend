"use client";

import Link from "next/link";
import {
    useMemo,
    useState
} from "react";
import {
    Filter,
    Plus,
    ReceiptText,
    Search
} from "lucide-react";
import Pagination from "@/components/ui/pagination";
import Can from "@/components/ui/can/Can";
import ComandaCard from "@/components/comandas/ComandaCard";
import { useComandas } from "@/hooks/useComandas";
import styles from "./ComandasClient.module.css";

export default function ComandasClient(){
    const [busca,setBusca]=useState("");

    const {
        comandas,
        loading,
        page,
        setPage,
        totalPages,
        statusFilter,
        setStatusFilter
    }=useComandas();

    const comandasFiltradas=useMemo(()=>{
        const termo=busca.trim().toLowerCase();

        if(!termo)return comandas;

        return comandas.filter(comanda=>{
            const id=String(comanda.id||"").toLowerCase();
            const mesa=String(comanda.numero_mesa||"").toLowerCase();
            const cliente=String(comanda.cliente_nome||"").toLowerCase();

            return (
                id.includes(termo)||
                mesa.includes(termo)||
                cliente.includes(termo)
            );
        });
    },[
        busca,
        comandas
    ]);

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <div className={styles.filters}>
                    <label className={styles.search}>
                        <Search size={17} />

                        <input
                            type="search"
                            placeholder="Buscar mesa, comanda ou cliente"
                            value={busca}
                            onChange={event=>setBusca(event.target.value)}
                            aria-label="Buscar comandas"
                        />
                    </label>

                    <label className={styles.filter}>
                        <Filter size={17} />

                        <select
                            value={statusFilter}
                            onChange={event=>{
                                setBusca("");
                                setStatusFilter(event.target.value);
                            }}
                            aria-label="Filtrar comandas por status"
                        >
                            <option value="">
                                Todas
                            </option>

                            <option value="Aberta">
                                Abertas
                            </option>

                            <option value="Aguardando Pagamento">
                                Aguardando pagamento
                            </option>

                            <option value="Paga">
                                Pagas
                            </option>

                            <option value="Cancelada">
                                Canceladas
                            </option>
                        </select>
                    </label>
                </div>

                <Can perform="comandas.abrir">
                    <Link
                        href="/admin/comandas/cadastro"
                        className={styles.newButton}
                    >
                        <Plus size={18} />
                        Nova comanda
                    </Link>
                </Can>
            </div>

            <div className={styles.legend}>
                <span>
                    <i className={styles.legendOpen} />
                    Aberta
                </span>

                <span>
                    <i className={styles.legendPaid} />
                    Paga
                </span>

                <span>
                    <i className={styles.legendCanceled} />
                    Cancelada
                </span>

                <span>
                    <i className={styles.legendWaiting} />
                    Aguardando pagamento
                </span>
            </div>

            {loading?(
                <div className={styles.cardsGrid}>
                    {Array.from({
                        length:8
                    }).map((_,index)=>(
                        <div
                            key={index}
                            className={styles.skeletonCard}
                        />
                    ))}
                </div>
            ):comandasFiltradas.length===0?(
                <div className={styles.emptyState}>
                    <ReceiptText size={34} />

                    <strong>
                        Nenhuma comanda encontrada
                    </strong>

                    <span>
                        {busca
                            ?`Nenhum resultado para "${busca}".`
                            :"Não existem comandas para este filtro."
                        }
                    </span>
                </div>
            ):(
                <div className={styles.cardsGrid}>
                    {comandasFiltradas.map(comanda=>(
                        <ComandaCard
                            key={comanda.id}
                            comanda={comanda}
                        />
                    ))}
                </div>
            )}

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}