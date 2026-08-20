"use client";

import { useEffect, useMemo, useState } from "react";
import { ChefHat, Clock, Loader2, RefreshCw, Utensils } from "lucide-react";
import Swal from "sweetalert2";
import { listarFilaCozinha, atualizarStatusItem } from "@/services/itens-comanda.service";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css";

const formatarHora = data => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(data));

const tempoEspera = data => {
    const minutos = Math.max(0, Math.floor((Date.now() - new Date(data).getTime()) / 60000));
    if (minutos < 1) return "Agora";
    if (minutos < 60) return `${minutos} min`;
    return `${Math.floor(minutos / 60)}h ${minutos % 60}min`;
};

export default function CozinhaClient() {
    const { hasPermission } = useAuth();
    const [fila, setFila] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const podeAlterar = hasPermission("cozinha.status");

    const carregarFila = async (silencioso = false) => {
        try {
            if (!silencioso) setLoading(true);

            const response = await listarFilaCozinha();
            setFila(response?.data?.fila || []);

        } catch (error) {
            if (!silencioso) await Swal.fire({ title: "Erro ao carregar cozinha", text: error.response?.data?.message || "Não foi possível carregar os pedidos.", icon: "error", confirmButtonColor: "var(--brand-red)" });
        } finally {
            if (!silencioso) setLoading(false);
        }
    };

    useEffect(() => {
        carregarFila();

        const intervalo = setInterval(() => carregarFila(true), 10000);

        return () => clearInterval(intervalo);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pendentes = useMemo(() => fila.filter(item => item.status_pedido === "Pendente"), [fila]);
    const preparando = useMemo(() => fila.filter(item => item.status_pedido === "Preparando"), [fila]);

    const alterarStatus = async (item, status) => {
        try {
            setActionLoading(item.item_id);

            await atualizarStatusItem(item.item_id, status);
            await carregarFila(true);

        } catch (error) {
            await Swal.fire({ title: "Não foi possível atualizar", text: error.response?.data?.message || "Erro ao alterar o status.", icon: "error", confirmButtonColor: "var(--brand-red)" });
        } finally {
            setActionLoading(null);
        }
    };

    const renderPedido = item => (
        <article className={styles.orderCard} key={item.item_id}>
            <div className={styles.cardHeader}>
                <div>
                    <strong>Mesa {item.numero_mesa}</strong>
                    <span>Comanda #{item.comanda_id}</span>
                </div>

                <span className={styles.time}><Clock size={14} /> {tempoEspera(item.criado_em)}</span>
            </div>

            <div className={styles.product}>
                <span className={styles.quantity}>{item.quantidade}x</span>

                <div>
                    <strong>{item.produto_nome}</strong>
                    {item.observacao && <p>{item.observacao}</p>}
                </div>
            </div>

            <div className={styles.meta}>
                <span>{item.origem}</span>
                <span>{formatarHora(item.criado_em)}</span>
            </div>

            {podeAlterar && (
                <button type="button" disabled={actionLoading === item.item_id} onClick={() => alterarStatus(item, item.status_pedido === "Pendente" ? "Preparando" : "Entregue")}>
                    {actionLoading === item.item_id ? <Loader2 size={17} className={styles.spinner} /> : item.status_pedido === "Pendente" ? <ChefHat size={17} /> : <Utensils size={17} />}
                    {item.status_pedido === "Pendente" ? "Iniciar preparo" : "Marcar entregue"}
                </button>
            )}
        </article>
    );

    if (loading) return <div className={styles.loading}><Loader2 className={styles.spinner} /> Carregando cozinha...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Cozinha</h1>
                    <p>Pedidos ativos para produção.</p>
                </div>

                <button type="button" className={styles.refresh} onClick={() => carregarFila()}><RefreshCw size={18} /> Atualizar</button>
            </div>

            <div className={styles.board}>
                <section className={styles.column}>
                    <div className={styles.columnHeader}>
                        <span>Pendentes</span>
                        <strong>{pendentes.length}</strong>
                    </div>

                    <div className={styles.cards}>
                        {pendentes.length ? pendentes.map(renderPedido) : <div className={styles.empty}>Nenhum pedido pendente.</div>}
                    </div>
                </section>

                <section className={styles.column}>
                    <div className={styles.columnHeader}>
                        <span>Em preparo</span>
                        <strong>{preparando.length}</strong>
                    </div>

                    <div className={styles.cards}>
                        {preparando.length ? preparando.map(renderPedido) : <div className={styles.empty}>Nenhum pedido em preparo.</div>}
                    </div>
                </section>
            </div>
        </div>
    );
}