"use client";

import Link from "next/link";

import { useState, useRef, useEffect } from "react";

import Can from "@/components/ui/can/Can";

import { MoreVertical, Eye, Edit, Trash2, RotateCcw, Shield } from "lucide-react";

import styles from "./index.module.css";

export default function ActionMenu({
    item,
    basePath,
    permissionPrefix,
    showPermissions = false,
    onArchive,
    onReactivate,
    isLast
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState({});
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen || !buttonRef.current) {
            setMenuStyle({});
            return;
        }

        const rect = buttonRef.current.getBoundingClientRect();
        const estimatedHeight = dropdownRef.current?.offsetHeight || 200;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUp = isLast || (spaceBelow < estimatedHeight + 12 && spaceAbove > estimatedHeight + 12);
        const MENU_WIDTH = 160;
        const H_MARGIN = 8;

        const left = Math.min(
            Math.max(H_MARGIN, rect.left),
            window.innerWidth - MENU_WIDTH - H_MARGIN
        );

        const nextStyle = {
            position: 'fixed',
            left: `${left}px`,
            zIndex: 99999,
            minWidth: `${MENU_WIDTH}px`
        };

        if (openUp) {
            const top = Math.max(H_MARGIN, rect.top - estimatedHeight - 6);
            nextStyle.top = `${top}px`;
        } else {
            nextStyle.top = `${rect.bottom + 6}px`;
        }

        setMenuStyle(nextStyle);
    }, [isOpen, isLast]);

    if (!item || !item.id) return null;

    return (
        <div className={styles.wrapper} ref={menuRef}>
            <button
                ref={buttonRef}
                className={styles.menuButton}
                onClick={() => setIsOpen(!isOpen)}
                title="Ações"
            >
                <MoreVertical size={18} />
            </button>

            {isOpen && (
                <div ref={dropdownRef} className={styles.dropdown} style={menuStyle}>

                    <Can perform={`${permissionPrefix}.visualizar`}>
                        <Link
                            href={`${basePath}/${item.id}?mode=view`} // Alterado usu_id para id
                            className={styles.item}
                            onClick={() => setIsOpen(false)}
                        >
                            <Eye size={16} />
                            <span>Visualizar</span>
                        </Link>
                    </Can>

                    <Can perform={`${permissionPrefix}.editar`}>
                        <Link
                            href={`${basePath}/${item.id}?mode=edit`} // Alterado usu_id para id
                            className={styles.item}
                            onClick={() => setIsOpen(false)}
                        >
                            <Edit size={16} />
                            <span>Editar</span>
                        </Link>
                    </Can>

                    {item.ativo ? (
                        <Can perform={`${permissionPrefix}.deletar`}>
                            <button
                                type="button"
                                className={`${styles.item} ${styles.danger}`}
                                onClick={() => {
                                    onArchive(item.id, item.nome);
                                    setIsOpen(false);
                                }}
                            >
                                <Trash2 size={16} />
                                <span>Inativar</span>
                            </button>
                        </Can>
                    ) : (
                        <Can perform={`${permissionPrefix}.reativar`}>
                            <button
                                type="button"
                                className={`${styles.item} ${styles.success}`}
                                onClick={() => {
                                    onReactivate(item.id, item.nome);
                                    setIsOpen(false);
                                }}
                            >
                                <RotateCcw size={16} />
                                <span>Reativar</span>
                            </button>
                        </Can>
                    )}

                    {showPermissions && (
                        <Can perform={`${permissionPrefix}.visualizar`}>
                            <Link
                                href={`${basePath}/${item.id}/permissoes`} // Alterado usu_id para id
                                className={styles.item}
                                style={{ color: '#8b5cf6' }}
                                onClick={() => setIsOpen(false)}
                            >
                                <Shield size={16} />
                                <span>Permissões</span>
                            </Link>
                        </Can>
                    )}

                </div>
            )}
        </div>
    );
};