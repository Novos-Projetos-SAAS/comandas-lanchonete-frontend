"use client";

import { useState, useEffect } from "react";
import { Bell, Clock3, Info, MapPin, Pencil, Power, Printer, RefreshCw, Save, Settings2, ShieldCheck, Store, Timer, UserRound, X } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/hooks/useAuth";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
import styles from "./ConfiguracoesClient.module.css";

const formatarDataHora = (data) => {
    if (!data) return "Ainda não registrado";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(data));
};

const DADOS_EMPRESA_BASE = {
    nome: "",
    razaoSocial: "",
    documentoTipo: "cnpj",
    documento: "",
    contato: "",
    endereco: ""
};

/**
 * Tela funcional de abertura e fechamento do estabelecimento.
 * As demais seções são apenas informativas até possuírem suporte no backend.
 */
export default function ConfiguracoesClient() {
    const { hasPermission } = useAuth();
    const {
        statusLoja,
        loading,
        actionLoading,
        erro,
        carregarConfiguracoes,
        alterarFuncionamento,

        dadosEmpresa: dadosEmpresaSalvos,
        empresaCadastrada,
        carregandoEmpresa,
        salvandoEmpresa,
        erroEmpresa,
        carregarDadosEmpresa,
        salvarEmpresa
    } = useConfiguracoes();

    const [dadosEmpresa, setDadosEmpresa] = useState(() => ({
        ...DADOS_EMPRESA_BASE
    }));

    const [editandoEmpresa, setEditandoEmpresa] = useState(false);

    /**
     * Quando o hook terminar de buscar os dados no banco,
     * transfere os dados para o estado editável do formulário.
     */
    useEffect(() => {
        setDadosEmpresa({
            ...DADOS_EMPRESA_BASE,
            ...dadosEmpresaSalvos
        });

        /*
         * Se já existe cadastro, inicia com os campos bloqueados.
         * Se ainda não existe cadastro, inicia permitindo o preenchimento.
         */
        setEditandoEmpresa(!empresaCadastrada);
    }, [
        dadosEmpresaSalvos,
        empresaCadastrada
    ]);

    const podeAlterarStatus = hasPermission("loja.status");
    const estaAberta = Boolean(statusLoja?.esta_aberta);

    const camposEmpresaBloqueados =
        empresaCadastrada && !editandoEmpresa;


    const handleDadosEmpresaChange = (event) => {
        const { name, value } = event.target;

        setDadosEmpresa((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    /**
 * Libera os campos para alteração.
 */
    const iniciarEdicaoEmpresa = () => {
        setEditandoEmpresa(true);
    };

    /**
     * Cancela a edição e restaura os últimos dados recebidos do banco.
     */
    const cancelarEdicaoEmpresa = () => {
        setDadosEmpresa({
            ...DADOS_EMPRESA_BASE,
            ...dadosEmpresaSalvos
        });

        setEditandoEmpresa(false);
    };

    const salvarDadosEmpresa = async (event) => {
        event.preventDefault();
        if (empresaCadastrada && !editandoEmpresa) {
            return;
        }

        try {
            const dadosParaSalvar = {
                nome: dadosEmpresa.nome.trim(),
                razaoSocial: dadosEmpresa.razaoSocial.trim(),
                documentoTipo: dadosEmpresa.documentoTipo,
                documento: dadosEmpresa.documento.replace(/\D/g, ""),
                contato: dadosEmpresa.contato.trim(),
                endereco: dadosEmpresa.endereco.trim()
            };

            const resultado = await salvarEmpresa(dadosParaSalvar);

            /*
             * Atualiza o formulário com a resposta real do banco.
             */
            setDadosEmpresa(resultado.empresa);
            setEditandoEmpresa(false);

            await Swal.fire({
                title: "Dados da empresa salvos",
                text:
                    resultado.response?.message ||
                    "As informações foram salvas no banco de dados.",
                icon: "success",
                confirmButtonColor: "var(--brand-orange)"
            });
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível salvar",
                text:
                    error.response?.data?.message ||
                    "Verifique os dados informados e tente novamente.",
                icon: "error",
                confirmButtonColor: "var(--brand-red)"
            });
        }
    };

    const confirmarAlteracao = async () => {
        if (!podeAlterarStatus || actionLoading || !statusLoja) return;

        let motivo = null;

        if (estaAberta) {
            const confirmacao = await Swal.fire({
                title: "Fechar estabelecimento?",
                html: `
                    <p>Novas comandas e novos pedidos serão bloqueados.</p>
                    <p style="margin-top: 8px;">Comandas abertas continuarão disponíveis para consulta, pagamento e finalização.</p>
                `,
                input: "textarea",
                inputLabel: "Motivo do fechamento (opcional)",
                inputPlaceholder: "Ex.: encerramento do expediente",
                inputAttributes: { maxlength: "255" },
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "var(--brand-orange)",
                cancelButtonColor: "var(--text-secondary)",
                confirmButtonText: "Sim, fechar",
                cancelButtonText: "Cancelar"
            });

            if (!confirmacao.isConfirmed) return;
            motivo = confirmacao.value?.trim() || null;
        } else {
            const confirmacao = await Swal.fire({
                title: "Abrir estabelecimento?",
                text: "Novas comandas, pedidos e atendimentos pelo cardápio serão liberados.",
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "var(--status-success)",
                cancelButtonColor: "var(--text-secondary)",
                confirmButtonText: "Sim, abrir",
                cancelButtonText: "Cancelar"
            });

            if (!confirmacao.isConfirmed) return;
        }

        try {
            const response = await alterarFuncionamento({
                estaAberta: !estaAberta,
                motivo
            });

            await Swal.fire({
                title: !estaAberta ? "Estabelecimento aberto" : "Estabelecimento fechado",
                text: response?.message || "Status atualizado com sucesso.",
                icon: "success",
                confirmButtonColor: "var(--brand-orange)"
            });
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível alterar",
                text: error.response?.data?.message || "Verifique sua conexão e tente novamente.",
                icon: "error",
                confirmButtonColor: "var(--brand-red)"
            });

            // Recarrega para resolver alterações simultâneas feitas por outro administrador.
            carregarConfiguracoes({ silencioso: true }).catch(() => { });
        }
    };

    if (loading || carregandoEmpresa) {
        return (
            <div className={styles.loadingCard}>
                <RefreshCw size={24} className={styles.spinning} />
                Carregando configurações...
            </div>
        );
    }

    if (erro || erroEmpresa || !statusLoja) {
        return (
            <div className={styles.errorCard}>
                <Info size={30} />
                <div>
                    <strong>Configurações indisponíveis</strong>
                    <p>
                        {erro ||
                            erroEmpresa ||
                            "Não foi possível carregar as configurações do estabelecimento."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        carregarConfiguracoes().catch(() => { });
                        carregarDadosEmpresa().catch(() => { });
                    }}
                >
                    Tentar novamente
                </button>
            </div>
        );
    }



    return (
        <div className={styles.wrapper}>
            <section
                className={`${styles.operationCard} `}
                aria-live="polite"
            >
                <div className={styles.operationHeader}>
                    <div className={styles.sectionTitle}>
                        <Store size={20} />
                    </div>

                    <div>
                        <h3>Estabelecimento</h3>
                    </div>
                    <span className={styles.statusBadge}>
                        <span className={styles.statusDot} />
                        {statusLoja.status}
                    </span>

                </div>

                <p className={styles.operationDescription}>
                    {estaAberta
                        ? "Novas comandas, pedidos e atendimentos pelo QR Code estão liberados."
                        : "Novas comandas e novos pedidos estão bloqueados. Comandas existentes ainda podem ser finalizadas."}
                </p>

                <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                        <Clock3 size={19} />
                        <div>
                            <span>Última alteração</span>
                            <strong>{formatarDataHora(statusLoja.atualizado_em)}</strong>
                        </div>
                    </div>
                    <div className={styles.detailItem}>
                        <UserRound size={19} />
                        <div>
                            <span>Alterado por</span>
                            <strong>{statusLoja.alterado_por?.nome || "Sistema"}</strong>
                        </div>
                    </div>
                    <div className={styles.detailItem}>
                        <Timer size={19} />
                        <div>
                            <span>{estaAberta ? "Aberto em" : "Fechado em"}</span>
                            <strong>
                                {formatarDataHora(estaAberta ? statusLoja.aberto_em : statusLoja.fechado_em)}
                            </strong>
                        </div>
                    </div>
                </div>

                {
                    !estaAberta && statusLoja.motivo_fechamento && (
                        <div className={styles.reasonBox}>
                            <Info size={18} />
                            <div>
                                <span>Motivo informado</span>
                                <strong>{statusLoja.motivo_fechamento}</strong>
                            </div>
                        </div>
                    )
                }

                <div className={styles.operationFooter}>
                    <div className={styles.permissionInfo}>
                        <ShieldCheck size={18} />
                        {podeAlterarStatus
                            ? "Você possui permissão para alterar o funcionamento."
                            : "Somente usuários com permissões podem realizar esta alteração."}
                    </div>

                    <button
                        type="button"
                        className={estaAberta ? styles.closeButton : styles.openButton}
                        onClick={confirmarAlteracao}
                        disabled={!podeAlterarStatus || actionLoading}
                        title={!podeAlterarStatus ? "Permissão para esta ação necessária" : undefined}
                    >
                        <Power size={19} />
                        {actionLoading
                            ? "Alterando..."
                            : estaAberta
                                ? "Fechar estabelecimento"
                                : "Abrir estabelecimento"}
                    </button>
                </div>
            </section >

            <section className={styles.companyCard}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <Store size={20} />

                        <div>
                            <h3>Dados da empresa</h3>

                            <p>
                                {empresaCadastrada && !editandoEmpresa
                                    ? "Os dados estão cadastrados. Clique em Editar para realizar alterações."
                                    : "Cadastre ou atualize as informações principais do estabelecimento."}
                            </p>
                        </div>
                    </div>
                </div>

                <form
                    className={styles.companyForm}
                    onSubmit={salvarDadosEmpresa}
                >
                    <div className={styles.formGrid}>
                        <label className={styles.field}>
                            <span>Nome</span>

                            <input
                                type="text"
                                name="nome"
                                value={dadosEmpresa.nome}
                                onChange={handleDadosEmpresaChange}
                                disabled={camposEmpresaBloqueados || salvandoEmpresa}
                                placeholder="Nome da empresa"
                                maxLength={120}
                                required
                            />
                        </label>

                        <label className={styles.field}>
                            <span>Razão social</span>

                            <input
                                type="text"
                                name="razaoSocial"
                                value={dadosEmpresa.razaoSocial}
                                onChange={handleDadosEmpresaChange}
                                disabled={camposEmpresaBloqueados || salvandoEmpresa}
                                placeholder="Razão social"
                                maxLength={160}
                                required
                            />
                        </label>

                        <label className={styles.field}>
                            <span>Tipo de documento</span>

                            <select
                                name="documentoTipo"
                                value={dadosEmpresa.documentoTipo}
                                onChange={handleDadosEmpresaChange}
                                disabled={camposEmpresaBloqueados || salvandoEmpresa}
                            >
                                <option value="cnpj">CNPJ</option>
                                <option value="cpf">CPF</option>
                            </select>
                        </label>

                        <label className={styles.field}>
                            <span>
                                {dadosEmpresa.documentoTipo === "cnpj"
                                    ? "CNPJ"
                                    : "CPF"}
                            </span>

                            <input
                                type="text"
                                name="documento"
                                value={dadosEmpresa.documento}
                                onChange={handleDadosEmpresaChange}
                                disabled={camposEmpresaBloqueados || salvandoEmpresa}
                                placeholder={
                                    dadosEmpresa.documentoTipo === "cnpj"
                                        ? "00.000.000/0000-00"
                                        : "000.000.000-00"
                                }
                                maxLength={
                                    dadosEmpresa.documentoTipo === "cnpj"
                                        ? 18
                                        : 14
                                }
                                required
                            />
                        </label>

                        <label className={styles.field}>
                            <span>Contato</span>

                            <input
                                type="tel"
                                name="contato"
                                value={dadosEmpresa.contato}
                                onChange={handleDadosEmpresaChange}
                                disabled={camposEmpresaBloqueados || salvandoEmpresa}
                                placeholder="(00) 00000-0000"
                                maxLength={20}
                                required
                            />
                        </label>

                        <label className={styles.field}>
                            <span>Endereço</span>

                            <input
                                type="text"
                                name="endereco"
                                value={dadosEmpresa.endereco}
                                onChange={handleDadosEmpresaChange}
                                disabled={camposEmpresaBloqueados || salvandoEmpresa}
                                placeholder="Rua, número, bairro, cidade"
                                maxLength={255}
                                required
                            />
                        </label>
                    </div>


                    <div className={styles.operationFooter}>
                        {empresaCadastrada && !editandoEmpresa && (
                            <button
                                type="button"
                                className={styles.editCompanyButton}
                                onClick={iniciarEdicaoEmpresa}
                            >
                                <Pencil size={17} />
                                Editar
                            </button>
                        )}
                        {(!empresaCadastrada || editandoEmpresa) && (
                            <div className={styles.formActions}>
                                {empresaCadastrada && (
                                    <button
                                        type="button"
                                        className={styles.btnCancel}
                                        onClick={cancelarEdicaoEmpresa}
                                        disabled={salvandoEmpresa}
                                    >
                                        <X size={17} />
                                        Cancelar
                                    </button>
                                    
                                )}

                                <button
                                    type="submit"
                                    className={styles.btnSave}
                                    disabled={salvandoEmpresa}
                                >
                                    {salvandoEmpresa ? (
                                        <>
                                            <RefreshCw
                                                size={17}
                                                className={styles.spinning}
                                            />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={17} />

                                            {empresaCadastrada
                                                ? "Salvar alterações"
                                                : "Salvar dados da empresa"}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                    </div>
                </form>
            </section>

        </div >
    );
}
