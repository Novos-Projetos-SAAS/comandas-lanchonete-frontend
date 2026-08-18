"use client";

import Link from "next/link";

import {
    useEffect,
    useRef,
    useState
} from "react";

import Can from "@/components/ui/can/Can";

import {
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    RotateCcw,
    Shield
} from "lucide-react";

import styles from "./index.module.css";


export default function ActionMenu({
    item,
    basePath,
    permissionPrefix,

    showPermissions = false,

    onArchive,
    onReactivate,

    isLast = false,
    isProcessing = false,

    /*
     * Permissões customizadas.
     *
     * Quando não forem informadas, o componente
     * continua usando o padrão antigo.
     */
    viewPermission,
    editPermission,
    archivePermission,
    reactivatePermission,

    /*
     * Permite esconder ações específicas.
     */
    showView = true,
    showEdit = true,
    showStatus = true,

    /*
     * Permite bloquear a ação de inativar.
     *
     * Exemplo em mesas:
     * archiveDisabled={mesa.status !== "Livre"}
     */
    archiveDisabled = false,
    archiveDisabledTitle = "",

    /*
     * Permite personalizar textos sem alterar
     * o comportamento padrão.
     */
    viewLabel = "Visualizar",
    editLabel = "Editar",
    archiveLabel = "Inativar",
    reactivateLabel = "Reativar"
}) {

    const [isOpen, setIsOpen] =
        useState(false);

    const [menuStyle, setMenuStyle] =
        useState({});

    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);


    /*
     * Mantém compatibilidade com os lugares que
     * já utilizam permissionPrefix.
     */
    const permissaoVisualizar =
        viewPermission === undefined
            ? `${permissionPrefix}.visualizar`
            : viewPermission;

    const permissaoEditar =
        editPermission === undefined
            ? `${permissionPrefix}.editar`
            : editPermission;

    const permissaoInativar =
        archivePermission === undefined
            ? `${permissionPrefix}.deletar`
            : archivePermission;

    const permissaoReativar =
        reactivatePermission === undefined
            ? `${permissionPrefix}.reativar`
            : reactivatePermission;


    /*
     * Fecha ao clicar fora.
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);


    /*
     * Calcula automaticamente se o menu deve
     * abrir para cima ou para baixo.
     */
    useEffect(() => {
        if (
            !isOpen ||
            !buttonRef.current
        ) {
            setMenuStyle({});
            return;
        }

        const rect =
            buttonRef.current.getBoundingClientRect();

        const estimatedHeight =
            dropdownRef.current?.offsetHeight ||
            200;

        const spaceBelow =
            window.innerHeight -
            rect.bottom;

        const spaceAbove =
            rect.top;

        const openUp =
            isLast ||
            (
                spaceBelow <
                    estimatedHeight + 12 &&
                spaceAbove >
                    estimatedHeight + 12
            );

        const MENU_WIDTH = 160;
        const H_MARGIN = 8;

        const left = Math.min(
            Math.max(
                H_MARGIN,
                rect.left
            ),
            window.innerWidth -
                MENU_WIDTH -
                H_MARGIN
        );

        const nextStyle = {
            position: "fixed",
            left: `${left}px`,
            zIndex: 99999,
            minWidth: `${MENU_WIDTH}px`
        };

        if (openUp) {
            const top = Math.max(
                H_MARGIN,
                rect.top -
                    estimatedHeight -
                    6
            );

            nextStyle.top =
                `${top}px`;

        } else {
            nextStyle.top =
                `${rect.bottom + 6}px`;
        }

        setMenuStyle(nextStyle);

    }, [
        isOpen,
        isLast
    ]);


    if (
        !item ||
        !item.id
    ) {
        return null;
    }


    /*
     * Executa a inativação.
     *
     * O terceiro parâmetro é o próprio objeto.
     *
     * Isso NÃO quebra usos antigos:
     *
     * (id, nome) => ...
     *
     * simplesmente ignorará o terceiro argumento.
     */
    const handleArchive = () => {
        if (
            archiveDisabled ||
            isProcessing
        ) {
            return;
        }

        onArchive?.(
            item.id,
            item.nome,
            item
        );

        setIsOpen(false);
    };


    const handleReactivate = () => {
        if (isProcessing) {
            return;
        }

        onReactivate?.(
            item.id,
            item.nome,
            item
        );

        setIsOpen(false);
    };


    /*
     * Renderiza uma ação com ou sem Can.
     *
     * null significa que a ação não necessita
     * de uma permissão específica nesta interface.
     */
    const renderComPermissao = (
        permission,
        content
    ) => {
        if (!permission) {
            return content;
        }

        return (
            <Can perform={permission}>
                {content}
            </Can>
        );
    };


    return (
        <div
            className={styles.wrapper}
            ref={menuRef}
        >
            <button
                ref={buttonRef}
                type="button"
                className={styles.menuButton}
                onClick={() => {
                    setIsOpen(
                        (current) => !current
                    );
                }}
                title="Ações"
                aria-label="Ações"
                aria-expanded={isOpen}
                disabled={isProcessing}
            >
                <MoreVertical size={18} />
            </button>


            {isOpen && (
                <div
                    ref={dropdownRef}
                    className={styles.dropdown}
                    style={menuStyle}
                >

                    {/* ================================
                        VISUALIZAR
                    ================================= */}

                    {showView &&
                        renderComPermissao(
                            permissaoVisualizar,

                            <Link
                                href={
                                    `${basePath}/${item.id}?mode=view`
                                }
                                className={styles.item}
                                onClick={() => {
                                    setIsOpen(false);
                                }}
                            >
                                <Eye size={16} />

                                <span>
                                    {viewLabel}
                                </span>
                            </Link>
                        )}


                    {/* ================================
                        EDITAR
                    ================================= */}

                    {showEdit &&
                        renderComPermissao(
                            permissaoEditar,

                            <Link
                                href={
                                    `${basePath}/${item.id}?mode=edit`
                                }
                                className={styles.item}
                                onClick={() => {
                                    setIsOpen(false);
                                }}
                            >
                                <Edit size={16} />

                                <span>
                                    {editLabel}
                                </span>
                            </Link>
                        )}


                    {/* ================================
                        STATUS
                    ================================= */}

                    {showStatus && (
                        item.ativo ? (

                            renderComPermissao(
                                permissaoInativar,

                                <button
                                    type="button"
                                    className={`
                                        ${styles.item}
                                        ${styles.danger}
                                        ${
                                            archiveDisabled
                                                ? styles.disabled
                                                : ""
                                        }
                                    `}
                                    onClick={
                                        handleArchive
                                    }
                                    disabled={
                                        archiveDisabled ||
                                        isProcessing
                                    }
                                    title={
                                        archiveDisabled
                                            ? archiveDisabledTitle
                                            : archiveLabel
                                    }
                                >
                                    <Trash2 size={16} />

                                    <span>
                                        {archiveLabel}
                                    </span>
                                </button>
                            )

                        ) : (

                            renderComPermissao(
                                permissaoReativar,

                                <button
                                    type="button"
                                    className={`
                                        ${styles.item}
                                        ${styles.success}
                                    `}
                                    onClick={
                                        handleReactivate
                                    }
                                    disabled={
                                        isProcessing
                                    }
                                >
                                    <RotateCcw size={16} />

                                    <span>
                                        {reactivateLabel}
                                    </span>
                                </button>
                            )
                        )
                    )}


                    {/* ================================
                        PERMISSÕES
                    ================================= */}

                    {showPermissions && (
                        <Can
                            perform={
                                `${permissionPrefix}.visualizar`
                            }
                        >
                            <Link
                                href={
                                    `${basePath}/${item.id}/permissoes`
                                }
                                className={styles.item}
                                style={{
                                    color: "#8b5cf6"
                                }}
                                onClick={() => {
                                    setIsOpen(false);
                                }}
                            >
                                <Shield size={16} />

                                <span>
                                    Permissões
                                </span>
                            </Link>
                        </Can>
                    )}

                </div>
            )}
        </div>
    );
}