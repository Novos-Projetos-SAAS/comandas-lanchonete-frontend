"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useCategorias } from "@/hooks/useCategorias.js"; // Confirme se o nome do arquivo é este mesmo

import Table from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import Can from "@/components/ui/can/Can.jsx";

import { Plus, Search, Edit, Trash2, RotateCcw, Filter, Eye, MoreVertical } from "lucide-react";
import Swal from "sweetalert2";
import styles from "./CategoriasClient.module.css";

export default function CategoriasClient() {
    const {
        categorias, loading, page, setPage, totalPages,
        sortColumn, sortDirection, statusFilter, setStatusFilter,
        setSearch, handleSort, alternarStatus // 🟢 Importamos a ação direto do Hook
    } = useCategorias();

    const [inputValue, setInputValue] = useState("");

    const [menuOpenId, setMenuOpenId] = useState(null);

    // Fecha os 3 pontinhos se o usuário clicar fora ou der scroll na tabela
    useEffect(() => {
        const closeMenu = () => setMenuOpenId(null);
        window.addEventListener('click', closeMenu);
        window.addEventListener('scroll', closeMenu, true);
        return () => {
            window.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', closeMenu, true);
        };
    }, []);

    const toggleMenu = (e, id) => {
        e.stopPropagation(); // Impede que o clique feche o menu imediatamente
        setMenuOpenId(menuOpenId === id ? null : id);
    };

    // Debounce para busca
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setSearch(inputValue);
            setPage(1);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [inputValue, setSearch, setPage]);

    // 🟢 Função de inativar usando o hook
    const handleArchiveCategoria = async (id, nome) => {
        const result = await Swal.fire({
            title: 'Inativar Categoria?',
            text: `A categoria "${nome}" ficará indisponível.`,
            icon: 'warning',
            iconColor: '#ea580c', // Ícone Laranja
            showCancelButton: true,
            confirmButtonColor: '#ea580c', // Botão Laranja
            cancelButtonColor: '#a1a1aa', // Cinza neutro
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sim, inativar!'
        });

        if (result.isConfirmed) {
            try {
                // Passa 'false' para inativar
                await alternarStatus(id, false);

                // Modal de sucesso
                Swal.fire({
                    title: 'Inativada!',
                    text: 'Categoria inativada com sucesso.',
                    icon: 'success',
                    iconColor: '#16a34a', // Ícone Verde
                    confirmButtonColor: '#16a34a' // Botão Verde
                });
            } catch (error) {
                // Modal de erro
                Swal.fire({
                    title: 'Erro',
                    text: 'Falha ao inativar a categoria.',
                    icon: 'error',
                    iconColor: '#dc2626', // Ícone Vermelho
                    confirmButtonColor: '#dc2626' // Botão Vermelho
                });
            }
        }
    };

    // 🟢 Função de reativar usando o hook
    const handleReactivateCategoria = async (id, nome) => {
        try {
            // Passa 'true' para reativar
            await alternarStatus(id, true);

            // Modal de sucesso
            Swal.fire({
                title: 'Reativada!',
                text: 'Categoria reativada com sucesso.',
                icon: 'success',
                iconColor: '#16a34a', // Ícone Verde
                confirmButtonColor: '#16a34a' // Botão Verde
            });
        } catch (error) {
            // Modal de erro
            Swal.fire({
                title: 'Erro',
                text: 'Falha ao reativar a categoria.',
                icon: 'error',
                iconColor: '#dc2626', // Ícone Vermelho
                confirmButtonColor: '#dc2626' // Botão Vermelho
            });
        }
    };

    const columns = [
        { header: "ID", accessor: "id" },
        { header: "Nome", accessor: "nome" },
        { header: "Descrição", accessor: "descricao" },
        {
            header: "Status",
            accessor: "ativo",
            render: (_, item) => (
                <span className={!item.ativo ? styles.statusInativo : styles.statusAtivo}>
                    {!item.ativo ? "Inativo" : "Ativo"}
                </span>
            )
        },
        {
            header: "Ações",
            accessor: "id",
            render: (_, item) => (
                <>
                    {/* 🟢 VISÃO DESKTOP (Botões Normais) */}
                    <div className={styles.desktopActions}>
                        <Link href={`/admin/categorias/${item.id}`} className={`${styles.actionBtn} ${styles.viewBtn}`} title="Visualizar">
                            <Eye size={18} />
                        </Link>

                        <Can perform="categorias_alimentos.editar">
                            <Link href={`/admin/categorias/${item.id}?mode=edit`} className={`${styles.actionBtn} ${styles.editBtn}`} title="Editar">
                                <Edit size={18} />
                            </Link>
                        </Can>

                        {!item.ativo ? (
                            <button className={`${styles.actionBtn} ${styles.reactBtn}`} onClick={() => handleReactivateCategoria(item.id, item.nome)} title="Reativar">
                                <RotateCcw size={18} />
                            </button>
                        ) : (
                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleArchiveCategoria(item.id, item.nome)} title="Inativar">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>

                    {/* 🟢 VISÃO MOBILE (Os 3 pontinhos) */}
                    <div className={styles.mobileActions}>
                        <button className={styles.actionBtn} onClick={(e) => toggleMenu(e, item.id)}>
                            <MoreVertical size={20} />
                        </button>

                        {menuOpenId === item.id && (
                            <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                                <Link href={`/admin/categorias/${item.id}`} className={styles.dropdownItem}>
                                    <Eye size={16} className={styles.viewBtn} /> Visualizar
                                </Link>

                                <Can perform="categorias_alimentos.editar">
                                    <Link href={`/admin/categorias/${item.id}?mode=edit`} className={styles.dropdownItem}>
                                        <Edit size={16} className={styles.editBtn} /> Editar
                                    </Link>
                                </Can>

                                {!item.ativo ? (
                                    <button className={styles.dropdownItem} onClick={() => { handleReactivateCategoria(item.id, item.nome); setMenuOpenId(null); }}>
                                        <RotateCcw size={16} className={styles.reactBtn} /> Reativar
                                    </button>
                                ) : (
                                    <button className={styles.dropdownItem} onClick={() => { handleArchiveCategoria(item.id, item.nome); setMenuOpenId(null); }}>
                                        <Trash2 size={16} className={styles.deleteBtn} /> Inativar
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )
        }
    ];

    return (
        <div className={styles.wrapper}>

            <div className={styles.actionsBar}>

                {/* 🟢 Aplicamos o visual com ícones dentro dos inputs que fizemos no CSS */}
                <div className={styles.filtersGroup}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Buscar categorias..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                    </div>

                    <div className={styles.selectWrapper}>
                        <Filter size={18} className={styles.filterIcon} />
                        <select
                            className={styles.statusSelect}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="false">Ativas</option>
                            <option value="true">Inativas</option>
                            <option value="all">Todas</option>
                        </select>
                    </div>
                </div>

                <Can perform="categorias_alimentos.criar">
                    <Link href="/admin/categorias/cadastro" className={styles.newButton}>
                        <Plus size={20} /> Nova Categoria
                    </Link>
                </Can>
            </div>

            <Table
                columns={columns}
                data={categorias}
                isLoading={loading}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
            />

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}