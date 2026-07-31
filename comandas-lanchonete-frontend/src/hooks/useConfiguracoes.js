"use client";

import { useCallback, useEffect, useState } from "react";
import {
    alterarStatusLoja,
    atualizarDadosEmpresa,
    obterConfiguracoesLoja,
    obterDadosEmpresa
} from "@/services/configuracoes.service";

const DADOS_EMPRESA_VAZIOS = {
    nome: "",
    razaoSocial: "",
    documentoTipo: "cnpj",
    documento: "",
    contato: "",
    endereco: ""
};

/**
 * Converte a resposta snake_case do backend
 * para o camelCase utilizado pelo formulário.
 */
function normalizarDadosEmpresa(empresa) {
    if (!empresa) {
        return { ...DADOS_EMPRESA_VAZIOS };
    }

    return {
        nome: empresa.nome || "",
        razaoSocial: empresa.razao_social || "",
        documentoTipo: empresa.documento_tipo || "cnpj",
        documento: empresa.documento || "",
        contato: empresa.contato || "",
        endereco: empresa.endereco || ""
    };
}

/**
 * Centraliza as funcionalidades da página de configurações:
 *
 * - busca o status da loja;
 * - abre ou fecha o estabelecimento;
 * - busca os dados da empresa;
 * - cadastra ou atualiza os dados da empresa.
 */
export function useConfiguracoes() {
    const [statusLoja, setStatusLoja] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [erro, setErro] = useState("");

    const [dadosEmpresa, setDadosEmpresa] = useState(DADOS_EMPRESA_VAZIOS);
    const [carregandoEmpresa, setCarregandoEmpresa] = useState(true);
    const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
    const [erroEmpresa, setErroEmpresa] = useState("");
    const [empresaCadastrada, setEmpresaCadastrada] = useState(false);

    /**
     * Carrega o status de abertura ou fechamento.
     */
    const carregarConfiguracoes = useCallback(
        async ({ silencioso = false } = {}) => {
            if (!silencioso) {
                setLoading(true);
            }

            try {
                const response = await obterConfiguracoesLoja();

                const status =
                    response?.data?.status ||
                    response?.status ||
                    response?.data ||
                    response;

                setStatusLoja(status);
                setErro("");

                return status;
            } catch (error) {
                if (!silencioso) {
                    setErro(
                        error.response?.data?.message ||
                        "Não foi possível carregar as configurações."
                    );
                }

                throw error;
            } finally {
                if (!silencioso) {
                    setLoading(false);
                }
            }
        },
        []
    );

    /**
     * Busca os dados atuais da empresa.
     *
     * Caso ainda não exista cadastro, o backend retorna null
     * e o formulário será preenchido com valores vazios.
     */
    const carregarDadosEmpresa = useCallback(async () => {
        setCarregandoEmpresa(true);

        try {
            const response = await obterDadosEmpresa();

            const empresa =
                response?.data?.empresa ??
                response?.empresa ??
                null;

            const empresaNormalizada = normalizarDadosEmpresa(empresa);

            setEmpresaCadastrada(Boolean(empresa?.id));
            setDadosEmpresa(empresaNormalizada);
            setErroEmpresa("");

            return empresaNormalizada;
        } catch (error) {
            setErroEmpresa(
                error.response?.data?.message ||
                "Não foi possível carregar os dados da empresa."
            );

            throw error;
        } finally {
            setCarregandoEmpresa(false);
        }
    }, []);

    /**
     * Executa o carregamento inicial.
     *
     * O polling de 30 segundos continua atualizando somente
     * o funcionamento da loja, como já acontecia anteriormente.
     */
    useEffect(() => {
        carregarConfiguracoes().catch(() => { });
        carregarDadosEmpresa().catch(() => { });

        const intervalId = window.setInterval(() => {
            carregarConfiguracoes({
                silencioso: true
            }).catch(() => { });
        }, 30000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [
        carregarConfiguracoes,
        carregarDadosEmpresa
    ]);

    /**
     * Abre ou fecha o estabelecimento.
     */
    const alterarFuncionamento = useCallback(
        async ({ estaAberta, motivo }) => {
            setActionLoading(true);

            try {
                const response = await alterarStatusLoja({
                    estaAberta,
                    motivo
                });

                const status =
                    response?.data?.status ||
                    response?.status ||
                    response?.data ||
                    response;

                setStatusLoja(status);
                setErro("");

                return response;
            } finally {
                setActionLoading(false);
            }
        },
        []
    );

    /**
     * Envia os dados da empresa ao backend.
     */
    const salvarEmpresa = useCallback(async (dados) => {
        setSalvandoEmpresa(true);

        try {
            const response = await atualizarDadosEmpresa(dados);

            const empresa =
                response?.data?.empresa ??
                response?.empresa ??
                null;

            const empresaNormalizada = normalizarDadosEmpresa(empresa);

            setEmpresaCadastrada(Boolean(empresa?.id));
            setDadosEmpresa(empresaNormalizada);
            setErroEmpresa("");

            return {
                response,
                empresa: empresaNormalizada
            };
        } finally {
            setSalvandoEmpresa(false);
        }
    }, []);

    return {
        statusLoja,
        loading,
        actionLoading,
        erro,
        carregarConfiguracoes,
        alterarFuncionamento,

        dadosEmpresa,
        empresaCadastrada,
        carregandoEmpresa,
        salvandoEmpresa,
        erroEmpresa,
        carregarDadosEmpresa,
        salvarEmpresa
    };
}