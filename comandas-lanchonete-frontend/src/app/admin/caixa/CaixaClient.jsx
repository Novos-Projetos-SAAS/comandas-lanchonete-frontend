"use client"

import { useCaixa } from "@/hooks/useCaixa";
import { Loader2 } from "lucide-react";
import AberturaCaixa from "@/components/paineis/aberturaCaixa";
import PainelCaixaAberto from "@/components/paineis/caixaAberto";
import styles from "./CaixaClient.module.css"; // Continua usando o mesmo CSS que criamos

export default function CaixaClient() {
    const { 
        isAberto, 
        isLoadingInit, 
        abrirCaixa, 
        fecharCaixa, 
        caixaAtual, 
        movimentacoes,
        registrarMovimentoManual,
        isActionLoading
    } = useCaixa();

    // 1. Loading Inicial
    if (isLoadingInit) {
        return (
            <div className={styles.loadingWrapper}>
                <Loader2 className={styles.spinner} size={40} />
                <p>Verificando status do caixa...</p>
            </div>
        );
    }

    // 2. Caixa Fechado
    if (!isAberto) {
        return (
            <AberturaCaixa 
                onAbrir={abrirCaixa} 
                isLoading={isActionLoading} 
            />
        );
    }

    // 3. Caixa Aberto
    return (
        <PainelCaixaAberto 
            caixa={caixaAtual}
            movimentacoes={movimentacoes}
            onFechar={fecharCaixa}
            onRegistrarMovimento={registrarMovimentoManual}
            isLoading={isActionLoading}
        />
    );
}