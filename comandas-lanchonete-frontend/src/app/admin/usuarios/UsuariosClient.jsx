'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUsuarios } from "@/hooks/useUsuarios";
import { Plus, Search, Eye, Edit, Trash2, UserCheck, UserX, Shield, Filter } from "lucide-react";
import tableStyles from "@/components/ui/table/index.module.css"; 
import styles from "./UsuariosClient.module.css"; 

export default function UsuariosClient() {
    const router = useRouter();
    const { 
        usuarios, 
        loading, 
        page, 
        setPage, 
        totalPages, 
        search, 
        setSearch, 
        deletarUsuario 
    } = useUsuarios();

    const [termSearch, setTermSearch] = useState(search);
    const [statusFilter, setStatusFilter] = useState("todos"); // 'todos', 'ativos', 'inativos'

    const handleSearchChange = (e) => {
        const valor = e.target.value;
        setTermSearch(valor);
        setSearch(valor);
        setPage(1); 
    };

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        setPage(1);
    };

    // 🟢 Filtra os usuários no client-side com base no select de status
    const usuariosFiltrados = usuarios.filter((user) => {
        if (statusFilter === "ativos") return user.ativo === true;
        if (statusFilter === "inativos") return user.ativo === false;
        return true; // 'todos'
    });

    const handleDelete = async (id, nome) => {
        if (window.confirm(`Tem certeza que deseja inativar/remover o usuário "${nome}"?`)) {
            try {
                await deletarUsuario(id);
            } catch (error) {
                alert("Erro ao remover usuário. Verifique se há permissões necessárias.");
            }
        }
    };

    return (
        <div className={styles.wrapper}>
            {/* 🟢 BARRA SUPERIOR: Busca e Select de Filtro de Status */}
            <div className={styles.headerBar}>
                <div className={styles.filtersGroup}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            value={termSearch}
                            onChange={handleSearchChange}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.selectWrapper}>
                        <Filter size={18} className={styles.filterIcon} />
                        <select
                            value={statusFilter}
                            onChange={handleStatusChange}
                            className={styles.statusSelect}
                        >
                            <option value="todos">Todos os status</option>
                            <option value="ativos">Ativos</option>
                            <option value="inativos">Inativos</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/admin/usuarios/cadastro")}
                    className={styles.newButton}
                >
                    <Plus size={18} /> Novo Usuário
                </button>
            </div>

            {/* 🟢 TABELA DE USUÁRIOS */}
            <div className={tableStyles.container}>
                <table className={tableStyles.table}>
                    <thead className={tableStyles.thead}>
                        <tr>
                            <th className={tableStyles.th}>ID</th>
                            <th className={tableStyles.th}>Nome</th>
                            <th className={tableStyles.th}>E-mail (Login)</th>
                            <th className={tableStyles.th}>Cargo</th>
                            <th className={tableStyles.th}>Status</th>
                            <th className={`${tableStyles.th} ${styles.centerText}`}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr key={index} className={tableStyles.tr}>
                                    <td className={tableStyles.td}><div className={`${tableStyles.skeletonBar} ${styles.skeletonId}`} /></td>
                                    <td className={tableStyles.td}><div className={`${tableStyles.skeletonBar} ${styles.skeletonNome}`} /></td>
                                    <td className={tableStyles.td}><div className={`${tableStyles.skeletonBar} ${styles.skeletonEmail}`} /></td>
                                    <td className={tableStyles.td}><div className={`${tableStyles.skeletonBar} ${styles.skeletonCargo}`} /></td>
                                    <td className={tableStyles.td}><div className={`${tableStyles.skeletonBar} ${styles.skeletonStatus}`} /></td>
                                    <td className={tableStyles.td}><div className={`${tableStyles.skeletonBar} ${styles.skeletonAcoes}`} /></td>
                                </tr>
                            ))
                        ) : !Array.isArray(usuariosFiltrados) || usuariosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={tableStyles.empty}>
                                    Nenhum usuário encontrado.
                                </td>
                            </tr>
                        ) : (
                            usuariosFiltrados.map((user) => (
                                <tr key={user.id} className={tableStyles.dataRow}>
                                    <td className={`${tableStyles.td} ${styles.boldText}`}>#{user.id}</td>
                                    <td className={tableStyles.td}>{user.nome}</td>
                                    <td className={`${tableStyles.td} ${styles.secondaryText}`}>{user.email}</td>
                                    <td className={tableStyles.td}>
                                        <span className={styles.badgeCargo}>
                                            {user.cargo_nome || user.cargo || `Cargo #${user.cargo_id}`}
                                        </span>
                                    </td>
                                    <td className={tableStyles.td}>
                                        {user.ativo ? (
                                            <span className={styles.statusAtivo}>
                                                <UserCheck size={16} /> Ativo
                                            </span>
                                        ) : (
                                            <span className={styles.statusInativo}>
                                                <UserX size={16} /> Inativo
                                            </span>
                                        )}
                                    </td>
                                    <td className={`${tableStyles.td} ${styles.centerText}`}>
                                        <div className={styles.actionGroup}>
                                            <button
                                                onClick={() => router.push(`/admin/usuarios/${user.id}?mode=view`)}
                                                title="Visualizar"
                                                className={`${styles.actionBtn} ${styles.viewBtn}`}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => router.push(`/admin/usuarios/${user.id}`)}
                                                title="Editar"
                                                className={`${styles.actionBtn} ${styles.editBtn}`}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => router.push(`/admin/usuarios/${user.id}/permissoes`)}
                                                title="Permissões"
                                                className={`${styles.actionBtn} ${styles.reactBtn}`}
                                            >
                                                <Shield size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id, user.nome)}
                                                title="Excluir / Inativar"
                                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 🟢 PAGINAÇÃO */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className={styles.btnPage}
                    >
                        Anterior
                    </button>
                    <span className={styles.pageInfo}>
                        Página {page} de {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className={styles.btnPage}
                    >
                        Próxima
                    </button>
                </div>
            )}
        </div>
    );
}