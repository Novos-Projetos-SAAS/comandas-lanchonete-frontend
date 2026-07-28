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
import ActionMenu from "@/components/ui/actionMenu";
import Pagination from "@/components/ui/pagination";
import { useProdutos } from "@/hooks/useProdutos";
import styles from "./AlimentosClient.module.css";

const formatarMoeda = (valor) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
}).format(Number(valor || 0));

const formatarData = (data) => {
    if (!data) return "—";
    return new Intl.DateTimeFormat("pt-BR").format(new Date(data));
};

/**
 * Lista administrativa com busca, filtros e ações protegidas por permissão.
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
        totalRecords,
        setSearch,
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,
        alternarStatus
    } = useProdutos();

    const [inputValue, setInputValue] = useState("");

    /**
     * Aguarda alguns milissegundos antes de pesquisar para evitar
     * uma requisição a cada tecla digitada pelo usuário.
     */
    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setSearch(inputValue);
            setPage(1);
        }, 450);

        return () => window.clearTimeout(timeoutId);
    }, [inputValue, setPage, setSearch]);

    /**
     * Confirma e executa a ativação ou inativação do produto.
     * A permissão também deve continuar sendo validada pelo backend.
     */
    const alterarDisponibilidade = async (produto, ativar) => {
        const confirmacao = await Swal.fire({
            title: ativar ? "Reativar produto?" : "Inativar produto?",
            text: ativar
                ? `"${produto.nome}" voltará a aparecer no cardápio.`
                : `"${produto.nome}" deixará de aparecer no cardápio público.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "var(--brand-orange)",
            cancelButtonColor: "var(--text-secondary)",
            confirmButtonText: ativar ? "Sim, reativar" : "Sim, inativar",
            cancelButtonText: "Cancelar"
        });

        if (!confirmacao.isConfirmed) return;

        try {
            await alternarStatus(produto.id, ativar);
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível alterar",
                text: error.response?.data?.message || "Tente novamente.",
                icon: "error",
                confirmButtonColor: "var(--brand-red)"
            });
        }
    };

    /**
     * O ActionMenu utiliza callbacks no formato (id, nome).
     * Estes adaptadores reaproveitam a mesma função usada no desktop.
     */
    const inativarProduto = (id, nome) => {
        return alterarDisponibilidade({ id, nome }, false);
    };

    const reativarProduto = (id, nome) => {
        return alterarDisponibilidade({ id, nome }, true);
    };

    const columns = [
        { header: "ID", accessor: "id" },
        {
            header: "Produto",
            accessor: "nome",
            render: (_, produto) => (
                <div className={styles.productCell}>
                    {produto.nome}
                </div>
            )
        },
        { header: "Categoria", accessor: "categoria_nome" },
        {
            header: "Preço",
            accessor: "preco",
            render: (valor) => <strong>{formatarMoeda(valor)}</strong>
        },
        {
            header: "Status",
            accessor: "ativo",
            render: (_, produto) => (
                <span>
                    {produto.ativo ? "Ativo" : "Inativo"}
                </span>
            )
        },
        {
            header: "Ações",
            accessor: "acoes",
            className: styles.actionCell,
            render: (_, produto, index) => {
                /*
                 * Nos dois últimos registros o ActionMenu abre para cima,
                 * evitando que o menu seja cortado pelo final da tabela.
                 */
                const isLastItems = index >= produtos.length - 2;

                return (
                    <>
                        {/* No desktop, as ações ficam visíveis diretamente. */}
                        <div className={styles.desktopActions}>
                            <Link
                                href={`/admin/alimentos/${produto.id}?mode=view`}
                                className={`${styles.actionLink} ${styles.viewAction}`}
                                title="Visualizar"
                                aria-label={`Visualizar ${produto.nome}`}
                            >
                                <Eye size={18} />
                            </Link>

                            <Can perform="alimentos.editar">
                                <Link
                                    href={`/admin/alimentos/${produto.id}?mode=edit`}
                                    className={`${styles.actionLink} ${styles.editAction}`}
                                    title="Editar"
                                    aria-label={`Editar ${produto.nome}`}
                                >
                                    <Edit size={18} />
                                </Link>
                            </Can>

                            <Can perform="alimentos.status">
                                {produto.ativo ? (
                                    <button
                                        type="button"
                                        className={`${styles.actionButton} ${styles.dangerAction}`}
                                        onClick={() => alterarDisponibilidade(produto, false)}
                                        disabled={actionLoading === produto.id}
                                        title="Inativar"
                                        aria-label={`Inativar ${produto.nome}`}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={`${styles.actionButton} ${styles.reactivateAction}`}
                                        onClick={() => alterarDisponibilidade(produto, true)}
                                        disabled={actionLoading === produto.id}
                                        title="Reativar"
                                        aria-label={`Reativar ${produto.nome}`}
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                )}
                            </Can>
                        </div>

                        {/* No mobile, o componente reutilizável controla os três pontinhos. */}
                        <div className={styles.mobileActions}>
                            <ActionMenu
                                item={produto}
                                basePath="/admin/alimentos"
                                permissionPrefix="alimentos"
                                onArchive={inativarProduto}
                                onReactivate={reativarProduto}
                                isLast={isLastItems}
                            />
                        </div>
                    </>
                );
            }
        }
    ];

    return (
        <div className={styles.wrapper}>
            <div className={styles.actionsBar}>
                <div className={styles.filtersGroup}>
                    <div className={styles.fieldWrapper}>
                        <Search size={18} />
                        <input
                            value={inputValue}
                            onChange={(event) => setInputValue(event.target.value)}
                            placeholder="Buscar produto, descrição ou categoria..."
                        />
                    </div>

                    <div className={styles.fieldWrapper}>
                        <Filter size={18} />
                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(event.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="todos">Todos os status</option>
                            <option value="ativos">Ativos</option>
                            <option value="inativos">Inativos</option>
                        </select>
                    </div>

                    <select
                        className={styles.categorySelect}
                        value={categoryFilter}
                        onChange={(event) => {
                            setCategoryFilter(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Todas as categorias</option>
                        {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id}>
                                {categoria.nome}
                            </option>
                        ))}
                    </select>
                </div>

                <Can perform="alimentos.criar">
                    <Link href="/admin/alimentos/cadastro" className={styles.addButton}>
                        <Plus size={18} /> Novo produto
                    </Link>
                </Can>
            </div>

            <div className={styles.tableContainer}>
                <Table
                    columns={columns}
                    data={produtos}
                    isLoading={loading}
                />
            </div>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}