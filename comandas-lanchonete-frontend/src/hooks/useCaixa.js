"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { abrir, buscarStatusAtual, fechar, listarMovimentacoes, registrarMovimento, registrarVendaRapida } from "@/services/caixas.service";
import { agendarFeedbackVendaConcluida } from "@/lib/venda-rapida-feedback.mjs";

const formatCurrency = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));
const elevarAlerta = () => { const container = Swal.getContainer(); if (container) container.style.zIndex = "10000000"; };
const fireCaixaAlert = options => Swal.fire({ ...options, didOpen: elevarAlerta });

export function useCaixa() {
    const [caixaAtual, setCaixaAtual] = useState(null);
    const [isAberto, setIsAberto] = useState(false);
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isVendaLoading, setIsVendaLoading] = useState(false);

    const carregarMovimentacoes = useCallback(async () => {
        const resMov = await listarMovimentacoes();
        setMovimentacoes(resMov.data?.movimentacoes || []);
    }, []);

    const carregarDadosDoCaixa = useCallback(async () => {
        try {
            setIsLoadingInit(true);
            const resStatus = await buscarStatusAtual();

            if (resStatus.data.caixa_aberto) {
                setCaixaAtual(resStatus.data.caixa);
                setIsAberto(true);
                await carregarMovimentacoes();
            } else {
                setCaixaAtual(null);
                setIsAberto(false);
                setMovimentacoes([]);
            }
        } catch (error) {
            await fireCaixaAlert({ icon: "error", title: "Não foi possível carregar o caixa", text: error.response?.data?.message || "Verifique a conexão com o servidor.", confirmButtonColor: "#ea580c" });
        } finally {
            setIsLoadingInit(false);
        }
    }, [carregarMovimentacoes]);

    useEffect(() => {
        carregarDadosDoCaixa();
    }, [carregarDadosDoCaixa]);

    const abrirCaixa = async saldoInicial => {
        try {
            setIsActionLoading(true);
            await abrir(saldoInicial);
            await carregarDadosDoCaixa();
            await fireCaixaAlert({ icon: "success", title: "Caixa aberto", text: "O caixa está pronto para operar.", confirmButtonColor: "#10b981" });
            return true;
        } catch (error) {
            await fireCaixaAlert({ icon: "error", title: "Erro ao abrir caixa", text: error.response?.data?.message || "Erro ao abrir o caixa.", confirmButtonColor: "#ef4444" });
            return false;
        } finally {
            setIsActionLoading(false);
        }
    };

    const fecharCaixa = async () => {
        try {
            setIsActionLoading(true);
            const res = await fechar();
            await carregarDadosDoCaixa();
            await fireCaixaAlert({
                icon: "success",
                title: "Caixa encerrado",
                html: `Faturamento líquido: <b>${formatCurrency(res.data.caixaFechado.total_faturado)}</b><br/>Dinheiro esperado na gaveta: <b>${formatCurrency(res.data.caixaFechado.saldo_final_gaveta)}</b>`,
                confirmButtonColor: "#10b981"
            });
            return true;
        } catch (error) {
            await fireCaixaAlert({ icon: "warning", title: "Não foi possível encerrar", text: error.response?.data?.message || "Erro ao fechar o caixa.", confirmButtonColor: "#ea580c" });
            return false;
        } finally {
            setIsActionLoading(false);
        }
    };

    const registrarMovimentoManual = async dadosMovimento => {
        try {
            setIsActionLoading(true);
            await registrarMovimento(dadosMovimento);
            await carregarMovimentacoes();
            await fireCaixaAlert({ icon: "success", title: "Movimentação registrada", timer: 1600, showConfirmButton: false });
            return true;
        } catch (error) {
            await fireCaixaAlert({ icon: "error", title: "Falha na movimentação", text: error.response?.data?.message || "Erro ao registrar movimentação.", confirmButtonColor: "#ef4444" });
            return false;
        } finally {
            setIsActionLoading(false);
        }
    };

    const realizarVendaRapida = async dados => {
        try {
            setIsVendaLoading(true);
            const resultado = await registrarVendaRapida(dados);
            await carregarMovimentacoes();

            const venda = resultado.data?.venda;
            const pagamentos = resultado.data?.pagamentos || [];
            const resumoPagamentos = pagamentos.length
                ? pagamentos.map(pagamento => `${pagamento.metodo_pagamento_nome}: <b>${formatCurrency(pagamento.valor)}</b>${Number(pagamento.troco || 0) > 0 ? ` — Troco: <b>${formatCurrency(pagamento.troco)}</b>` : ""}`).join("<br/>")
                : venda?.metodo_pagamento || "";

            agendarFeedbackVendaConcluida({
                mostrar: opcoes => Swal.fire(opcoes),
                opcoes: {
                    html: `Venda #${venda?.id || ""}<br/><b>${formatCurrency(venda?.valor_total)}</b>${resumoPagamentos ? `<br/><br/>${resumoPagamentos}` : ""}`,
                    didOpen: elevarAlerta
                }
            });

            return true;
        } catch (error) {
            await fireCaixaAlert({ icon: "error", title: "Não foi possível finalizar a venda", text: error.response?.data?.message || "Erro ao registrar a venda rápida.", confirmButtonColor: "#ef4444" });
            return false;
        } finally {
            setIsVendaLoading(false);
        }
    };

    return {
        caixaAtual,
        isAberto,
        movimentacoes,
        isLoadingInit,
        isActionLoading,
        isVendaLoading,
        abrirCaixa,
        fecharCaixa,
        registrarMovimentoManual,
        realizarVendaRapida,
        recarregarCaixa: carregarDadosDoCaixa,
        recarregarMovimentacoes: carregarMovimentacoes
    };
}
