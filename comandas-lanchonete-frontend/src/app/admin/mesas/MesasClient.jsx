"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    AlertTriangle,
    Eye,
    Filter,
    Plus,
    Search,
    Trash2,
    Utensils,
    Users
} from "lucide-react";
import Swal from "sweetalert2";
import Can from "@/components/ui/can/Can";
import Pagination from "@/components/ui/pagination";
import { useMesas } from "@/hooks/useMesas";
import styles from "./MesasClient.module.css";
import ActionMenu from "@/components/ui/actionMenu";

// Funções de apresentação ficam fora do componente para não serem recriadas a cada renderização.
const formatarMoeda = (valor) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
}).format(Number(valor || 0));

const formatarTempo = (minutos) => {
    if (minutos === null || minutos === undefined) return "Sem atividade registrada";
    if (minutos < 1) return "Atividade agora";
    if (minutos === 1) return "1 minuto sem novo pedido";
    if (minutos < 60) return `${minutos} minutos sem novo pedido`;

    const horas = Math.floor(minutos / 60);
    const restante = minutos % 60;
    return restante ? `${horas}h ${restante}min sem novo pedido` : `${horas}h sem novo pedido`;
};

/**
 * Define o estado visual do card seguindo uma ordem de prioridade:
 * inativa -> atenção -> livre -> ocupada.
 * Isso evita que uma mesa inativa ou em alerta receba a cor errada.
 */
function obterVisualMesa(mesa) {
    if (!mesa.ativo) {
        return {
            label: "Inativa",
            cardClass: styles.cardInactive,
            badgeClass: styles.badgeInactive,
            icon: Trash2
        };
    }

    if (mesa.precisa_atencao) {
        return {
            label: "Atenção",
            cardClass: styles.cardAttention,
            badgeClass: styles.badgeAttention,
            icon: AlertTriangle
        };
    }

    if (mesa.status === "Livre") {
        return {
            label: "Livre",
            cardClass: styles.cardFree,
            badgeClass: styles.badgeFree,
            icon: Users
        };
    }

    return {
        label: mesa.status === "Fechando" ? "Fechando conta" : "Ocupada",
        cardClass: styles.cardOccupied,
        badgeClass: styles.badgeOccupied,
        icon: Utensils
    };
}

export default function MesasClient() {
    // O hook centraliza paginação, filtros, atualização automática e chamadas da API.
    const {
        mesas,
        resumo,
        loading,
        actionLoading,
        page,
        setPage,
        totalPages,
        totalRecords,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        lastUpdate,
        listarMesas,
        inativarMesa,
        reativarMesa
    } = useMesas();

    const [inputValue, setInputValue] = useState("");

    // Debounce: aguarda a digitação terminar antes de consultar o backend.
    useEffect(() => {
        if (inputValue === search) return undefined;

        const timeoutId = window.setTimeout(() => {
            setSearch(inputValue);
            setPage(1);
        }, 450);

        return () => window.clearTimeout(timeoutId);
    }, [inputValue, search, setPage, setSearch]);


    // A mesa só pode ser inativada quando estiver livre, protegendo comandas abertas.
    const handleInativar = async (mesa) => {

        if (mesa.status !== "Livre") {
            await Swal.fire({
                title: "Mesa em uso",
                text: "Finalize ou cancele a comanda antes de inativar esta mesa.",
                icon: "warning",
                iconColor: "var(--brand-orange)",
                confirmButtonColor: "var(--brand-orange)"
            });
            return;
        }

        const result = await Swal.fire({
            title: `Inativar Mesa ${mesa.numero}?`,
            text: "Ela ficará em cinza escuro e indisponível para novas comandas.",
            icon: "warning",
            iconColor: "var(--brand-orange)",
            showCancelButton: true,
            confirmButtonColor: "var(--brand-orange)",
            cancelButtonColor: "var(--text-secondary)",
            confirmButtonText: "Sim, inativar",
            cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) return;

        try {
            await inativarMesa(mesa.id);
            await Swal.fire({
                title: "Mesa inativada!",
                text: `A Mesa ${mesa.numero} não poderá ser utilizada até ser reativada.`,
                icon: "success",
                iconColor: "var(--brand-blue)",
                confirmButtonColor: "var(--brand-orange)"
            });
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível inativar",
                text: error.response?.data?.message || "Tente novamente em alguns instantes.",
                icon: "error",
                iconColor: "var(--brand-red)",
                confirmButtonColor: "var(--brand-red)"
            });
        }
    };

    // Reativa uma mesa inativa e atualiza a lista por meio do hook.
    const handleReativar = async (mesa) => {

        try {
            await reativarMesa(mesa.id);
            await Swal.fire({
                title: "Mesa reativada!",
                text: `A Mesa ${mesa.numero} já está disponível no sistema.`,
                icon: "success",
                iconColor: "var(--brand-blue)",
                confirmButtonColor: "var(--brand-orange)"
            });
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível reativar",
                text: error.response?.data?.message || "Tente novamente em alguns instantes.",
                icon: "error",
                iconColor: "var(--brand-red)",
                confirmButtonColor: "var(--brand-red)"
            });
        }
    };

    return (
        <div className={styles.wrapper}>
            {/*
                Além de exibirem os totais, os cards do resumo funcionam como filtros rápidos.
                Enter e Espaço também ativam o filtro para manter a navegação acessível por teclado.
            */}
            {/* Pesquisa, filtro e ações principais */}
            <div className={styles.toolbar}>
                <div className={styles.searchContainer}>
                    <div className={styles.searchWrapper}>
                        <Search
                            size={18}
                            className={styles.searchIcon}
                        />


                        <input
                            type="search"
                            className={styles.searchInput}
                            placeholder="Buscar número da mesa..."
                            value={inputValue}
                            onChange={(event) => {
                                setInputValue(
                                    event.target.value.replace(/\D/g, "")
                                );
                            }}
                            inputMode="numeric"
                            aria-label="Buscar mesa pelo número"
                        />
                    </div>
                </div>

                <div className={styles.selectWrapper}>
                    <Filter
                        size={18}
                        className={styles.filterIcon}
                    />

                    <select
                        className={styles.statusSelect}
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(event.target.value);
                            
                        }}
                        aria-label="Filtrar mesas por situação"
                    >
                        <option value="todas">
                            Todas as mesas ({resumo.total})
                        </option>

                        <option value="livres">
                            Livres ({resumo.livres})
                        </option>

                        <option value="ocupadas">
                            Ocupadas ({resumo.ocupadas})
                        </option>

                        <option value="atencao">
                            Precisando de atenção ({resumo.atencao})
                        </option>

                        <option value="inativas">
                            Inativas ({resumo.inativas})
                        </option>
                    </select>
                </div>

                <div className={styles.toolbarActions}>


                    <Can perform="mesas.criar">
                        <Link
                            href="/admin/mesas/cadastro"
                            className={styles.addButton}
                        >
                            <Plus size={18} />
                            Nova mesa
                        </Link>
                    </Can>
                </div>
            </div>

            {/* Alterna entre skeleton, estado vazio e grade real de mesas. */}
            {loading ? (
                <div className={styles.cardsGrid} aria-label="Carregando mesas">
                    {Array.from({ length: 12 }).map((_, index) => (
                        <div key={index} className={styles.skeletonCard} />
                    ))}
                </div>
            ) : mesas.length === 0 ? (
                <div className={styles.emptyState}>
                    <Utensils size={42} />
                    <h2>Nenhuma mesa encontrada</h2>
                    <p>Altere os filtros ou cadastre uma nova mesa para começar.</p>
                </div>
            ) : (
                <div className={styles.cardsGrid}>
                    {mesas.map((mesa) => {
                        const visual = obterVisualMesa(mesa);
                        const StatusIcon = visual.icon;
                        const estaProcessando = actionLoading === mesa.id;
                        return (
                            <article
                                key={mesa.id}
                                className={`
                                    ${styles.tableCard}
                                    ${visual.cardClass}
                                `}
                            >
                                {/* Cabeçalho */}
                                <div className={styles.cardHeader}>
                                    <div>
                                        <span className={styles.tableLabel}>
                                            Mesa
                                        </span>

                                        <h2 className={styles.tableNumber}>
                                            {String(mesa.numero).padStart(2, "0")}
                                        </h2>
                                    </div>

                                    <div className={styles.cardHeaderActions}>
                                        <span className={`${styles.statusBadge} ${visual.badgeClass}`} >
                                            <StatusIcon size={13} />
                                            {visual.label}
                                        </span>

                                        {/* <div className={styles.menuContainer}>
                                            <button
                                                type="button"
                                                className={styles.menuButton}
                                                onClick={(event) => {
                                                    toggleMenu(event, mesa.id);
                                                }}
                                                aria-label={`Ações da Mesa ${mesa.numero}`}
                                                aria-expanded={
                                                    menuOpenId === mesa.id
                                                }
                                            >
                                                <MoreVertical size={19} />
                                            </button>

                                            {menuOpenId === mesa.id && (

                                                <div className={styles.dropdownMenu} onClick={(event) => { event.stopPropagation(); }}>
                                                    <Link href={`/admin/mesas/${mesa.id}?mode=view`} className={styles.dropdownItem}>
                                                        <Eye size={16} />
                                                        Visualizar
                                                    </Link>

                                                    <Can perform="mesas.editar">
                                                        <Link
                                                            href={`/admin/mesas/${mesa.id}?mode=edit`}
                                                            className={styles.dropdownItem}
                                                        >
                                                            <Edit size={16} />
                                                            Editar
                                                        </Link>
                                                    </Can>

                                                    <Can perform="mesas.status">
                                                        {!mesa.ativo ? (
                                                            <button
                                                                type="button"
                                                                className={
                                                                    styles.dropdownItem
                                                                }
                                                                onClick={() => {
                                                                    handleReativar(mesa);
                                                                }}
                                                                disabled={estaProcessando}
                                                            >
                                                                <RotateCcw size={16} />
                                                                Reativar
                                                            </button>
                                                        ) : (
                                                            <button className={`${styles.dropdownItem}${styles.dangerItem} ${mesa.status !== "Livre" ? styles.blockedItem : ""}`} onClick={() => { handleInativar(mesa); }} disabled={estaProcessando}
                                                                title={mesa.status !== "Livre" ? "A mesa precisa estar livre para ser inativada" : "Inativar mesa"}
                                                            >
                                                                <Trash2 size={16} className={styles.deleteBtn} /> Inativar
                                                            </button>
                                                        )}
                                                    </Can>
                                                </div>
                                            )}
                                        </div> */}

                                        <ActionMenu
                                            item={mesa}
                                            basePath="/admin/mesas"
                                            permissionPrefix="mesas"

                                            viewPermission={null}
                                            editPermission="mesas.editar"

                                            archivePermission="mesas.status"
                                            reactivatePermission="mesas.status"

                                            archiveDisabled={
                                                mesa.ativo &&
                                                mesa.status !== "Livre"
                                            }

                                            archiveDisabledTitle={
                                                mesa.status !== "Livre"
                                                    ? "A mesa precisa estar livre para ser inativada"
                                                    : ""
                                            }

                                            isProcessing={
                                                estaProcessando
                                            }

                                            onArchive={(
                                                id,
                                                nome,
                                                mesaCompleta
                                            ) => {
                                                handleInativar(
                                                    mesaCompleta
                                                );
                                            }}

                                            onReactivate={(
                                                id,
                                                nome,
                                                mesaCompleta
                                            ) => {
                                                handleReativar(
                                                    mesaCompleta
                                                );
                                            }}
                                        />
                                    </div>
                                </div>



                                {/* Informações da mesa */}
                                <div className={styles.cardDetails}>
                                    {!mesa.ativo ? (
                                        <div className={styles.infoRow}>
                                            <Trash2 size={17} />

                                            <div>
                                                <span>Situação</span>
                                                <strong>
                                                    Mesa indisponível
                                                </strong>
                                            </div>
                                        </div>
                                    ) : mesa.status === "Livre" ? (
                                        <div className={styles.infoRow}>
                                            <Users size={17} />

                                            <div>
                                                <span>Situação</span>
                                                <strong>
                                                    Disponível para atendimento
                                                </strong>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={styles.infoRow}>
                                                <Users size={17} />

                                                <div>
                                                    <span>Cliente</span>

                                                    <strong>
                                                        {mesa.comanda?.cliente_nome || "Não informado"}
                                                    </strong>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Identificação da comanda */}
                                {/* {mesa.comanda && (
                                    <div className={styles.commandNumber}>
                                        <Utensils size={14} />
                                        Comanda #{mesa.comanda.id}
                                    </div>
                                )} */}



                                {/* Rodapé */}
                                <div className={styles.cardFooter}>
                                    <Link
                                        href={`/admin/mesas/${mesa.id}?mode=view`}
                                        className={styles.manageButton}
                                    >
                                        <Eye size={16} />
                                        Visualizar mesa
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Paginação é controlada pelo hook e preserva filtros/pesquisa. */}
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}