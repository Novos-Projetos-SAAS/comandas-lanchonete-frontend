"use client";

import { Loader2 } from "lucide-react";
import { useCaixa } from "@/hooks/useCaixa";
import AberturaCaixa from "@/components/paineis/aberturaCaixa";
import PainelCaixaAberto from "@/components/paineis/caixaAberto";
import styles from "./CaixaClient.module.css";

export default function CaixaClient() {
    const { isAberto, isLoadingInit, abrirCaixa, fecharCaixa, caixaAtual, movimentacoes, registrarMovimentoManual, realizarVendaRapida, isActionLoading, isVendaLoading } = useCaixa();

    if (isLoadingInit) return <div className={styles.loadingWrapper}><Loader2 className={styles.spinner} size={40} /><p>Verificando status do caixa...</p></div>;
    if (!isAberto) return <AberturaCaixa onAbrir={abrirCaixa} isLoading={isActionLoading} />;

    return <PainelCaixaAberto caixa={caixaAtual} movimentacoes={movimentacoes} onFechar={fecharCaixa} onRegistrarMovimento={registrarMovimentoManual} onVendaRapida={realizarVendaRapida} isLoading={isActionLoading} isVendaLoading={isVendaLoading} />;
}
