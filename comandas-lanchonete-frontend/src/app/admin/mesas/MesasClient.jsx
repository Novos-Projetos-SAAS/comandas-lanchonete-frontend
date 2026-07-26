"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Clock,
    Edit,
    Eye,
    Filter,
    MoreVertical,
    Plus,
    RefreshCw,
    RotateCcw,
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
            label: "Precisa de atenção",
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
    const [menuOpenId, setMenuOpenId] = useState(null);

    // Fecha o menu de três pontos ao clicar ou rolar fora dele.
    useEffect(() => {
        const fecharMenu = () => setMenuOpenId(null);
        window.addEventListener("click", fecharMenu);
        window.addEventListener("scroll", fecharMenu, true);

        return () => {
            window.removeEventListener("click", fecharMenu);
            window.removeEventListener("scroll", fecharMenu, true);
        };
    }, []);

    // Debounce: aguarda a digitação terminar antes de consultar o backend.
    useEffect(() => {
        if (inputValue === search) return undefined;

        const timeoutId = window.setTimeout(() => {
            setSearch(inputValue);
            setPage(1);
        }, 450);

        return () => window.clearTimeout(timeoutId);
    }, [inputValue, search, setPage, setSearch]);

    // Evita recriar a configuração dos contadores quando o resumo não mudou.
    const resumoCards = useMemo(() => ([
        { label: "Livres", value: resumo.livres, className: styles.summaryFree, filter: "livres" },
        { label: "Ocupadas", value: resumo.ocupadas, className: styles.summaryOccupied, filter: "ocupadas" },
        { label: "Atenção", value: resumo.atencao, className: styles.summaryAttention, filter: "atencao" },
        { label: "Inativas", value: resumo.inativas, className: styles.summaryInactive, filter: "inativas" }
    ]), [resumo]);

    /**
     * Transforma os cards do resumo em atalhos de filtro.
     * O setter do hook também volta automaticamente para a primeira página.
     */
    const filtrarPeloResumo = (filtro) => {
        setStatusFilter(filtro);
        setMenuOpenId(null);
    };

    // Alterna somente o menu de ações do card selecionado.
    const toggleMenu = (event, id) => {
        event.stopPropagation();
        setMenuOpenId((atual) => atual === id ? null : id);
    };

    // Atualização manual mantém a mesma listagem e filtros atuais.
    const handleAtualizar = async () => {
        try {
            await listarMesas();
        } catch (error) {
            await Swal.fire({
                title: "Falha ao atualizar",
                text: error.response?.data?.message || "Não foi possível atualizar o mapa de mesas.",
                icon: "error",
                iconColor: "var(--brand-red)",
                confirmButtonColor: "var(--brand-red)"
            });
        }
    };

    // A mesa só pode ser inativada quando estiver livre, protegendo comandas abertas.
    const handleInativar = async (mesa) => {
        setMenuOpenId(null);

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
        setMenuOpenId(null);

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
            <section className={styles.summaryGrid} aria-label="Resumo e filtros rápidos das mesas">
                {resumoCards.map((item) => {
                    const filtroAtivo = statusFilter === item.filter;

                    return (
                        <div
                            key={item.label}
                            className={`${styles.summaryCard} ${item.className}`}
                            role="button"
                            tabIndex={0}
                            aria-pressed={filtroAtivo}
                            aria-label={`Filtrar mesas: ${item.label}`}
                            title={`Mostrar somente mesas ${item.label.toLowerCase()}`}
                            onClick={() => filtrarPeloResumo(item.filter)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    filtrarPeloResumo(item.filter);
                                }
                            }}
                            style={{
                                cursor: "pointer",
                                outline: filtroAtivo ? "2px solid currentColor" : undefined,
                                outlineOffset: filtroAtivo ? "2px" : undefined
                            }}
                        >
                            <span className={styles.summaryValue}>{item.value}</span>
                            <span className={styles.summaryLabel}>{item.label}</span>
                        </div>
                    );
                })}
            </section>

            {/* Pesquisa, filtro, atualização e cadastro. */}
            <div className={styles.actionsBar}>
                <div className={styles.filtersGroup}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} className={styles.inputIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Buscar número da mesa..."
                            value={inputValue}
                            onChange={(event) => setInputValue(event.target.value.replace(/\D/g, ""))}
                            inputMode="numeric"
                        />
                    </div>

                    <div className={styles.selectWrapper}>
                        <Filter size={18} className={styles.inputIcon} />
                        <select
                            className={styles.statusSelect}
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                        >
                            <option value="todas">Todas as mesas</option>
                            <option value="livres">Livres</option>
                            <option value="ocupadas">Ocupadas</option>
                            <option value="atencao">Precisando de atenção</option>
                            <option value="inativas">Inativas</option>
                        </select>
                    </div>
                </div>

                <div className={styles.actionsGroup}>
                    <button
                        type="button"
                        className={styles.refreshButton}
                        onClick={handleAtualizar}
                        disabled={loading}
                        title="Atualizar mapa de mesas"
                    >
                        <RefreshCw size={18} className={loading ? styles.spinning : ""} />
                        <span>Atualizar</span>
                    </button>

                    <Can perform="mesas.criar">
                        <Link href="/admin/mesas/cadastro" className={styles.addButton}>
                            <Plus size={19} />
                            Nova mesa
                        </Link>
                    </Can>
                </div>
            </div>

            {/* Legenda rápida para interpretação das cores. */}
            <div className={styles.legend}>
                <span><i className={styles.legendFree} /> Livre</span>
                <span><i className={styles.legendOccupied} /> Ocupada</span>
                <span><i className={styles.legendAttention} /> Atenção: 30+ minutos</span>
                <span><i className={styles.legendInactive} /> Inativa</span>
            </div>

            <div className={styles.listInfo}>
                <span>{totalRecords} {totalRecords === 1 ? "mesa encontrada" : "mesas encontradas"}</span>
                {lastUpdate && (
                    <span>Atualizado às {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                )}
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
                            <article key={mesa.id} className={`${styles.tableCard} ${visual.cardClass}`}>
                                <div className={styles.cardTop}>
                                    <span className={`${styles.statusBadge} ${visual.badgeClass}`}>
                                        <StatusIcon size={14} />
                                        {visual.label}
                                    </span>

                                    <div className={styles.menuContainer}>
                                        <button
                                            type="button"
                                            className={styles.menuButton}
                                            onClick={(event) => toggleMenu(event, mesa.id)}
                                            aria-label={`Ações da Mesa ${mesa.numero}`}
                                            aria-expanded={menuOpenId === mesa.id}
                                        >
                                            <MoreVertical size={20} />
                                        </button>

                                        {menuOpenId === mesa.id && (
                                            <div className={styles.dropdownMenu} onClick={(event) => event.stopPropagation()}>
                                                <Link href={`/admin/mesas/${mesa.id}?mode=view`} className={styles.dropdownItem}>
                                                    <Eye size={16} /> Visualizar
                                                </Link>

                                                <Can perform="mesas.editar">
                                                    <Link href={`/admin/mesas/${mesa.id}?mode=edit`} className={styles.dropdownItem}>
                                                        <Edit size={16} /> Editar
                                                    </Link>
                                                </Can>

                                                <Can perform="mesas.status">
                                                    {!mesa.ativo ? (
                                                        <button
                                                            type="button"
                                                            className={styles.dropdownItem}
                                                            onClick={() => handleReativar(mesa)}
                                                            disabled={estaProcessando}
                                                        >
                                                            <RotateCcw size={16} /> Reativar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className={`${styles.dropdownItem} ${styles.dangerItem} ${mesa.status !== "Livre" ? styles.blockedItem : ""}`}
                                                            onClick={() => handleInativar(mesa)}
                                                            disabled={estaProcessando}
                                                            title={mesa.status !== "Livre" ? "Clique para entender por que a mesa não pode ser inativada" : "Inativar mesa"}
                                                        >
                                                            <Trash2 size={16} /> Inativar
                                                        </button>
                                                    )}
                                                </Can>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.tableNumberArea}>
                                    <span className={styles.tableLabel}>Mesa</span>
                                    <strong className={styles.tableNumber}>{String(mesa.numero).padStart(2, "0")}</strong>
                                </div>

                                <div className={styles.cardDetails}>
                                    {!mesa.ativo ? (
                                        <p className={styles.mainMessage}>Sem uso no sistema</p>
                                    ) : mesa.status === "Livre" ? (
                                        <p className={styles.mainMessage}>Disponível para atendimento</p>
                                    ) : (
                                        <>
                                            <div className={styles.detailLine}>
                                                <Users size={15} />
                                                <span>{mesa.comanda?.cliente_nome || "Cliente não informado"}</span>
                                            </div>
                                            <div className={styles.detailLine}>
                                                <Utensils size={15} />
                                                <span>
                                                    Comanda #{mesa.comanda?.id || "—"} · {mesa.comanda?.total_itens || 0} itens
                                                </span>
                                            </div>
                                            <div className={`${styles.detailLine} ${mesa.precisa_atencao ? styles.attentionText : ""}`}>
                                                <Clock size={15} />
                                                <span>{formatarTempo(mesa.minutos_sem_pedido)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className={styles.cardFooter}>
                                    <span className={styles.totalValue}>
                                        {mesa.comanda ? formatarMoeda(mesa.comanda.valor_total) : "Sem comanda"}
                                    </span>
                                    <Link href={`/admin/mesas/${mesa.id}?mode=view`} className={styles.viewLink}>
                                        Detalhes <Eye size={15} />
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