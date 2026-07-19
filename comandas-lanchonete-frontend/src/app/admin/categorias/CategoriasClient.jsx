"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useCategorias } from "@/hooks/useCategorias.js";
// import { toggleCategoriaStatus } from "@/services/categoriasAlimentosService.js";

import Table from "@/components/ui/table";
// import ActionMenu from "@/components/ui/actionMenu";
import Pagination from "@/components/ui/pagination";
import Can from "@/components/ui/can/Can.jsx";

import { Plus, Search, Edit, Trash2, RotateCcw, Filter, Eye } from "lucide-react";
import Swal from "sweetalert2";
import styles from "./CategoriasClient.module.css";

export default function CategoriasClient() {
    const {
        categorias, loading, page, setPage, totalPages,
        sortColumn, sortDirection, statusFilter, setStatusFilter,
        setSearch, handleSort, refrescarLista
    } = useCategorias();

    const [inputValue, setInputValue] = useState("");

    // Debounce para busca
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setSearch(inputValue);
            setPage(1);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [inputValue, setSearch, setPage]);

    const handleArchiveCategoria = async (id, nome) => {
        const result = await Swal.fire({
            title: 'Inativar Categoria?',
            text: `A categoria "${nome}" ficará indisponível.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--brand-orange)',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sim, inativar!'
        });

        if (result.isConfirmed) {
            try {
                await toggleCategoriaStatus(id, false);
                refrescarLista();
            } catch (error) { Swal.fire('Erro', 'Falha ao inativar.', 'error'); }
        }
    };

    const handleReactivateCategoria = async (id, nome) => {
        try {
            await toggleCategoriaStatus(id, true);
            refrescarLista();
        } catch (error) { Swal.fire('Erro', 'Falha ao reativar.', 'error'); }
    };

    const columns = [
        { header: "ID", accessor: "id" },
        { header: "Nome", accessor: "nome" },
        { header: "Limite Escolhas", accessor: "limite_escolhas" },
        { 
            header: "Status", 
            accessor: "deletado_em",
            render: (_, item) => (
                <span className={item.deletado_em ? styles.statusInativo : styles.statusAtivo}>
                    {item.deletado_em ? "Inativo" : "Ativo"}
                </span>
            )
        },
        {
            header: "Ações",
            accessor: "id",
            render: (_, item) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Can perform="categorias_alimentos.editar">
                        <Link href={`/admin/categorias-alimentos/${item.id}?mode=edit`}><Edit size={18}/></Link>
                    </Can>
                    {item.deletado_em ? (
                        <button onClick={() => handleReactivateCategoria(item.id, item.nome)}><RotateCcw size={18}/></button>
                    ) : (
                        <button onClick={() => handleArchiveCategoria(item.id, item.nome)}><Trash2 size={18}/></button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className={styles.wrapper}>
            <div className={styles.actionsBar}>
                <input 
                    placeholder="Buscar categorias..." 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="false">Ativas</option>
                    <option value="true">Inativas</option>
                    <option value="all">Todas</option>
                </select>
                <Can perform="categorias_alimentos.criar">
                    <Link href="/admin/categorias-alimentos/cadastro" className={styles.newButton}>
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