"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
    Edit,
    Eye,
    Filter,
    Plus,
    RotateCcw,
    Search,
    Trash2
} from "lucide-react";

import Swal from "sweetalert2";

import Can from "@/components/ui/can/Can";
import Table from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";

import { useProdutos } from "@/hooks/useProdutos";

import styles from "./AlimentosClient.module.css";
import ActionMenu from "@/components/ui/actionMenu";


/**
 * Formata valores monetários.
 */
const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(Number(valor || 0));
};


/**
 * Página administrativa de alimentos.
 *
 * Mantém o mesmo padrão utilizado na página
 * de categorias:
 *
 * - busca;
 * - filtros;
 * - botão de cadastro;
 * - tabela;
 * - ações desktop;
 * - menu mobile;
 * - paginação.
 */
export default function AlimentosClient() {
    const {
        produtos,
        categorias,

        loading,
        actionLoading,

        page,
        setPage,
        totalPages,

        setSearch,

        statusFilter,
        setStatusFilter,

        categoryFilter,
        setCategoryFilter,

        alternarStatus
    } = useProdutos();


    /**
     * Valor digitado no campo de pesquisa.
     *
     * Ele é separado de "search" para permitir
     * o debounce antes de chamar o backend.
     */
    const [inputValue, setInputValue] =
        useState("");


    /**
     * Debounce da pesquisa.
     *
     * Aguarda 500ms depois da última digitação
     * antes de atualizar a consulta.
     */
    useEffect(() => {
        const timeoutId =
            window.setTimeout(() => {
                setSearch(inputValue);
                setPage(1);
            }, 500);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [
        inputValue,
        setSearch,
        setPage
    ]);


    /**
     * Inativa um produto.
     */
    const handleArchiveProduto = async (
        id,
        nome
    ) => {
        const result = await Swal.fire({
            title: "Inativar produto?",

            text:
                `"${nome}" deixará de aparecer no cardápio.`,

            icon: "warning",

            iconColor:
                "var(--brand-orange)",

            showCancelButton: true,

            confirmButtonColor:
                "var(--brand-orange)",

            cancelButtonColor:
                "var(--text-secondary)",

            cancelButtonText:
                "Cancelar",

            confirmButtonText:
                "Sim, inativar!"
        });


        if (!result.isConfirmed) {
            return;
        }


        try {
            await alternarStatus(
                id,
                false
            );


            await Swal.fire({
                title: "Inativado!",

                text:
                    "Produto inativado com sucesso.",

                icon: "success",

                iconColor:
                    "var(--status-success)",

                confirmButtonColor:
                    "var(--status-success)"
            });

        } catch (error) {
            await Swal.fire({
                title: "Erro",

                text:
                    error.response?.data?.message ||
                    "Falha ao inativar o produto.",

                icon: "error",

                iconColor:
                    "var(--brand-red)",

                confirmButtonColor:
                    "var(--brand-red)"
            });
        }
    };


    /**
     * Reativa um produto.
     */
    const handleReactivateProduto = async (
        id,
        nome
    ) => {
        try {
            await alternarStatus(
                id,
                true
            );


            await Swal.fire({
                title: "Reativado!",

                text:
                    "Produto reativado com sucesso.",

                icon: "success",

                iconColor:
                    "var(--status-success)",

                confirmButtonColor:
                    "var(--status-success)"
            });

        } catch (error) {
            await Swal.fire({
                title: "Erro",

                text:
                    error.response?.data?.message ||
                    "Falha ao reativar o produto.",

                icon: "error",

                iconColor:
                    "var(--brand-red)",

                confirmButtonColor:
                    "var(--brand-red)"
            });
        }
    };


    /**
     * Colunas da tabela.
     */
    const columns = [
        {
            header: "ID",
            accessor: "id"
        },

        {
            header: "Produto",
            accessor: "nome"
        },

        {
            header: "Categoria",
            accessor: "categoria_nome"
        },

        {
            header: "Preço",
            accessor: "preco",

            render: (valor) => (
                <span>
                    {formatarMoeda(valor)}
                </span>
            )
        },

        {
            header: "Status",
            accessor: "ativo",

            render: (_, produto) => (
                <span
                    className={
                        produto.ativo
                            ? styles.statusAtivo
                            : styles.statusInativo
                    }
                >
                    {produto.ativo
                        ? "Ativo"
                        : "Inativo"}
                </span>
            )
        },

        {
            header: "Ações",
            accessor: "id",

            render: (_, produto) => (
                <>
                    {/* =================================================
                DESKTOP
            ================================================= */}

                    <div className={styles.desktopActions}>

                        <Link
                            href={`/admin/alimentos/${produto.id}?mode=view`}
                            className={`
                        ${styles.actionBtn}
                        ${styles.viewBtn}
                    `}
                            title="Visualizar"
                        >
                            <Eye size={18} />
                        </Link>


                        <Can perform="alimentos.editar">
                            <Link
                                href={`/admin/alimentos/${produto.id}?mode=edit`}
                                className={`
                            ${styles.actionBtn}
                            ${styles.editBtn}
                        `}
                                title="Editar"
                            >
                                <Edit size={18} />
                            </Link>
                        </Can>


                        <Can perform="alimentos.status">
                            {!produto.ativo ? (

                                <button
                                    type="button"
                                    className={`
                                ${styles.actionBtn}
                                ${styles.reactBtn}
                            `}
                                    onClick={() => {
                                        handleReactivateProduto(
                                            produto.id,
                                            produto.nome
                                        );
                                    }}
                                    disabled={
                                        actionLoading === produto.id
                                    }
                                    title="Reativar"
                                >
                                    <RotateCcw size={18} />
                                </button>

                            ) : (

                                <button
                                    type="button"
                                    className={`
                                ${styles.actionBtn}
                                ${styles.deleteBtn}
                            `}
                                    onClick={() => {
                                        handleArchiveProduto(
                                            produto.id,
                                            produto.nome
                                        );
                                    }}
                                    disabled={
                                        actionLoading === produto.id
                                    }
                                    title="Inativar"
                                >
                                    <Trash2 size={18} />
                                </button>

                            )}
                        </Can>

                    </div>


                    {/* =================================================
                MOBILE
            ================================================= */}

                    <div className={styles.mobileActions}>
                        <ActionMenu
                            item={produto}
                            basePath="/admin/alimentos"
                            permissionPrefix="alimentos"

                            viewPermission={null}
                            editPermission="alimentos.editar"

                            archivePermission="alimentos.status"
                            reactivatePermission="alimentos.status"

                            isProcessing={
                                actionLoading === produto.id
                            }

                            onArchive={
                                handleArchiveProduto
                            }

                            onReactivate={
                                handleReactivateProduto
                            }
                        />
                    </div>
                </>
            )
        }
    ];


    return (
        <div className={styles.wrapper}>

            {/* =====================================================
                BARRA DE AÇÕES
            ===================================================== */}

            <div className={styles.actionsBar}>

                {/* =================================================
                    FILTROS
                ================================================= */}

                <div
                    className={
                        styles.filtersGroup
                    }
                >

                    {/* Pesquisa */}

                    <div
                        className={
                            styles.searchWrapper
                        }
                    >
                        <Search
                            size={18}
                            className={
                                styles.searchIcon
                            }
                        />

                        <input
                            type="search"
                            className={
                                styles.searchInput
                            }
                            placeholder="Buscar produto, descrição ou categoria..."
                            value={inputValue}
                            onChange={(event) => {
                                setInputValue(
                                    event.target.value
                                );
                            }}
                        />
                    </div>


                    {/* Status */}

                    <div
                        className={
                            styles.selectWrapper
                        }
                    >
                        <Filter
                            size={18}
                            className={
                                styles.filterIcon
                            }
                        />

                        <select
                            className={
                                styles.statusSelect
                            }
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(
                                    event.target.value
                                );

                                setPage(1);
                            }}
                        >
                            <option value="todos">
                                Todos os status
                            </option>

                            <option value="ativos">
                                Ativos
                            </option>

                            <option value="inativos">
                                Inativos
                            </option>
                        </select>
                    </div>


                    {/* Categoria */}

                    <div
                        className={
                            styles.selectWrapper
                        }
                    >
                        <Filter
                            size={18}
                            className={
                                styles.filterIcon
                            }
                        />

                        <select
                            className={
                                styles.statusSelect
                            }
                            value={categoryFilter}
                            onChange={(event) => {
                                setCategoryFilter(
                                    event.target.value
                                );

                                setPage(1);
                            }}
                        >
                            <option value="">
                                Todas as categorias
                            </option>

                            {categorias.map(
                                (categoria) => (
                                    <option
                                        key={
                                            categoria.id
                                        }
                                        value={
                                            categoria.id
                                        }
                                    >
                                        {categoria.nome}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                </div>


                {/* =================================================
                    NOVO PRODUTO
                ================================================= */}

                <Can perform="alimentos.criar">
                    <Link
                        href="/admin/alimentos/cadastro"
                        className={
                            styles.newButton
                        }
                    >
                        <Plus size={20} />

                        Novo Produto
                    </Link>
                </Can>

            </div>


            {/* =====================================================
                TABELA
            ===================================================== */}

            <Table
                columns={columns}
                data={produtos}
                isLoading={loading}
            />


            {/* =====================================================
                PAGINAÇÃO
            ===================================================== */}

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />

        </div>
    );
}