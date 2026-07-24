'use client'

import Link from "next/link";
import { useState, useEffect } from "react";
import { useUsuarios } from "@/hooks/useUsuarios"; 

import Table from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import Can from "@/components/ui/can/Can.jsx";

import { Plus, Search, Edit, Trash2, RotateCcw, Filter, Eye, MoreVertical, Shield } from "lucide-react";
import Swal from "sweetalert2";
import styles from "./UsuariosClient.module.css"; 

export default function UsuariosClient() {
    const { 
        usuarios, 
        loading, 
        page, 
        setPage, 
        totalPages, 
        search,
        setSearch, 
        statusFilter,     // 🟢 Puxado direto do hook
        setStatusFilter,  // 🟢 Puxado direto do hook
        deletarUsuario,
        atualizarUsuario 
    } = useUsuarios();

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
        e.stopPropagation(); 
        setMenuOpenId(menuOpenId === id ? null : id);
    };

    // 🟢 Debounce com proteção contra loops no recarregamento
    useEffect(() => {
        if (inputValue === search) return; 

        const delayDebounceFn = setTimeout(() => {
            setSearch(inputValue);
            setPage(1);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [inputValue, search, setSearch, setPage]);

    // 🟢 Inativar usuário com SweetAlert2
    const handleArchiveUsuario = async (id, nome) => {
        const result = await Swal.fire({
            title: 'Inativar Usuário?',
            text: `O usuário "${nome}" perderá o acesso ao sistema.`,
            icon: 'warning',
            iconColor: '#ea580c', 
            showCancelButton: true,
            confirmButtonColor: '#ea580c', 
            cancelButtonColor: '#a1a1aa', 
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sim, inativar!'
        });

        if (result.isConfirmed) {
            try {
                await deletarUsuario(id);

                Swal.fire({
                    title: 'Inativado!',
                    text: 'Usuário inativado com sucesso.',
                    icon: 'success',
                    iconColor: '#16a34a', 
                    confirmButtonColor: '#16a34a' 
                });
            } catch (error) {
                Swal.fire({
                    title: 'Erro',
                    text: error.response?.data?.message || 'Falha ao inativar o usuário.',
                    icon: 'error',
                    iconColor: '#dc2626', 
                    confirmButtonColor: '#dc2626' 
                });
            }
        }
    };

    // 🟢 Reativar usuário com SweetAlert2
    const handleReactivateUsuario = async (id, nome) => {
        try {
            await atualizarUsuario(id, { ativo: true });

            Swal.fire({
                title: 'Reativado!',
                text: `O acesso de "${nome}" foi restaurado com sucesso.`,
                icon: 'success',
                iconColor: '#16a34a', 
                confirmButtonColor: '#16a34a' 
            });
        } catch (error) {
            Swal.fire({
                title: 'Erro',
                text: error.response?.data?.message || 'Falha ao reativar o usuário.',
                icon: 'error',
                iconColor: '#dc2626', 
                confirmButtonColor: '#dc2626' 
            });
        }
    };

    const columns = [
        { 
            header: "ID", 
            accessor: "id",
            render: (val) => <span className={styles.boldText}>{val}</span>
        },
        { header: "Nome", accessor: "nome" },
        { 
            header: "E-mail (Login)", 
            accessor: "email",
            render: (val) => <span className={styles.secondaryText}>{val}</span>
        },
        {
            header: "Cargo",
            accessor: "cargo_id",
            render: (_, item) => (
                <span className={styles.badgeCargo} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={14} />
                    {item.cargo_nome || item.cargo?.nome || item.cargo || `Cargo #${item.cargo_id}`}
                </span>
            )
        },
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
                    {/* 🟢 VISÃO DESKTOP */}
                    <div className={styles.desktopActions}>
                        <Link href={`/admin/usuarios/${item.id}?mode=view`} className={`${styles.actionBtn} ${styles.viewBtn}`} title="Visualizar">
                            <Eye size={18} />
                        </Link>

                        <Can perform="usuarios.editar">
                            <Link href={`/admin/usuarios/${item.id}?mode=edit`} className={`${styles.actionBtn} ${styles.editBtn}`} title="Editar">
                                <Edit size={18} />
                            </Link>
                        </Can>

                        <Can perform="usuarios.editar">
                            <Link href={`/admin/usuarios/${item.id}/permissoes`} className={`${styles.actionBtn} ${styles.reactBtn}`} title="Permissões">
                                <Shield size={18} />
                            </Link>
                        </Can>

                        {!item.ativo ? (
                            <button className={`${styles.actionBtn} ${styles.reactBtn}`} onClick={() => handleReactivateUsuario(item.id, item.nome)} title="Reativar">
                                <RotateCcw size={18} />
                            </button>
                        ) : (
                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleArchiveUsuario(item.id, item.nome)} title="Inativar">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>

                    {/* 🟢 VISÃO MOBILE (3 pontinhos) */}
                    <div className={styles.mobileActions}>
                        <button className={styles.actionBtn} onClick={(e) => toggleMenu(e, item.id)}>
                            <MoreVertical size={20} />
                        </button>

                        {menuOpenId === item.id && (
                            <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                                <Link href={`/admin/usuarios/${item.id}?mode=view`} className={styles.dropdownItem}>
                                    <Eye size={16} className={styles.viewBtn} /> Visualizar
                                </Link>

                                <Can perform="usuarios.editar">
                                    <Link href={`/admin/usuarios/${item.id}?mode=edit`} className={styles.dropdownItem}>
                                        <Edit size={16} className={styles.editBtn} /> Editar
                                    </Link>
                                </Can>

                                <Can perform="usuarios.editar">
                                    <Link href={`/admin/usuarios/${item.id}/permissoes`} className={styles.dropdownItem}>
                                        <Shield size={16} className={styles.reactBtn} /> Permissões
                                    </Link>
                                </Can>

                                {!item.ativo ? (
                                    <button className={styles.dropdownItem} onClick={() => { handleReactivateUsuario(item.id, item.nome); setMenuOpenId(null); }}>
                                        <RotateCcw size={16} className={styles.reactBtn} /> Reativar
                                    </button>
                                ) : (
                                    <button className={styles.dropdownItem} onClick={() => { handleArchiveUsuario(item.id, item.nome); setMenuOpenId(null); }}>
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
                <div className={styles.filtersGroup}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Buscar por nome ou e-mail..."
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
                            <option value="all">Todos os status</option>
                            <option value="true">Ativos</option>
                            <option value="false">Inativos</option>
                        </select>
                    </div>
                </div>

                <Can perform="usuarios.criar">
                    <Link href="/admin/usuarios/cadastro" className={styles.newButton}>
                        <Plus size={20} /> Novo Usuário
                    </Link>
                </Can>
            </div>

            {/* 🟢 Tabela recebendo os dados diretamente sem filtro no client-side */}
            <Table
                columns={columns}
                data={usuarios}
                isLoading={loading}
            />

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}