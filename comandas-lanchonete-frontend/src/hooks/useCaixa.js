import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2'; // 🟢 Importando o SweetAlert
import { 
    buscarStatusAtual, 
    abrir, 
    fechar, 
    listarMovimentacoes, 
    registrarMovimento 
} from '@/services/caixas.service';

export function useCaixa() {
    const [caixaAtual, setCaixaAtual] = useState(null);
    const [isAberto, setIsAberto] = useState(false);
    const [movimentacoes, setMovimentacoes] = useState([]);
    
    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const carregarDadosDoCaixa = useCallback(async () => {
        try {
            setIsLoadingInit(true);
            
            const resStatus = await buscarStatusAtual();
            
            if (resStatus.data.caixa_aberto) {
                setCaixaAtual(resStatus.data.caixa);
                setIsAberto(true);
                
                const resMov = await listarMovimentacoes();
                setMovimentacoes(resMov.data.movimentacoes || []);
            } else {
                setCaixaAtual(null);
                setIsAberto(false);
                setMovimentacoes([]);
            }
        } catch (error) {
            console.error("Erro ao carregar caixa:", error);
            Swal.fire({
                icon: 'error',
                title: 'Ops!',
                text: 'Falha ao carregar informações do caixa. Verifique sua conexão.',
                confirmButtonColor: '#ea580c'
            });
        } finally {
            setIsLoadingInit(false);
        }
    }, []);

    useEffect(() => {
        carregarDadosDoCaixa();
    }, [carregarDadosDoCaixa]);

    const abrirCaixa = async (saldoInicial) => {
        try {
            setIsActionLoading(true);
            await abrir(saldoInicial);
            await carregarDadosDoCaixa(); 
            
            Swal.fire({
                icon: 'success',
                title: 'Caixa Aberto!',
                text: 'O caixa foi aberto com sucesso e está pronto para operar.',
                confirmButtonColor: '#10b981'
            });
            return true;
        } catch (error) {
            const msg = error.response?.data?.message || "Erro ao abrir o caixa.";
            Swal.fire({
                icon: 'error',
                title: 'Erro ao Abrir Caixa',
                text: msg,
                confirmButtonColor: '#ef4444'
            });
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
            
            Swal.fire({
                icon: 'success',
                title: 'Caixa Encerrado!',
                text: `O saldo final calculado é de R$ ${res.data.caixaFechado.total_faturado}`,
                confirmButtonColor: '#10b981'
            });
            return true;
        } catch (error) {
            const msg = error.response?.data?.message || "Erro ao fechar o caixa.";
            // 🔴 Agora aquele erro das comandas abertas vai aparecer lindamente na tela!
            Swal.fire({
                icon: 'warning', // warning é legal aqui porque é uma regra de negócio, não falha no servidor
                title: 'Atenção!',
                text: msg,
                confirmButtonColor: '#ea580c'
            });
            return false;
        } finally {
            setIsActionLoading(false);
        }
    };

    const registrarMovimentoManual = async (dadosMovimento) => {
        try {
            setIsActionLoading(true);
            await registrarMovimento(dadosMovimento);
            
            const resMov = await listarMovimentacoes();
            setMovimentacoes(resMov.data.movimentacoes || []);
            
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'Movimentação registrada com sucesso no extrato.',
                timer: 2000,
                showConfirmButton: false // Some sozinho depois de 2 segundos para não travar a operação
            });
            return true;
        } catch (error) {
            const msg = error.response?.data?.message || "Erro ao registrar movimentação.";
            Swal.fire({
                icon: 'error',
                title: 'Falha na Movimentação',
                text: msg,
                confirmButtonColor: '#ef4444'
            });
            return false
        } finally {
            setIsActionLoading(false);
        }
    };

    return {
        caixaAtual,
        isAberto,
        movimentacoes,
        isLoadingInit,
        isActionLoading,
        abrirCaixa,
        fecharCaixa,
        registrarMovimentoManual,
        recarregarCaixa: carregarDadosDoCaixa
    };
}