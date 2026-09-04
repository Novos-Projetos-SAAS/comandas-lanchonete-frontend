"use client";

import { useState } from "react";
import {
    LayoutDashboard, ClipboardList, ChefHat, Utensils,
    Tags, Package, Users, Settings, X, ChevronLeft, ChevronRight
} from "lucide-react";
import ItemSidebar from "./ItemSidebar.jsx";
import Can from "../ui/can/Can.jsx";
import styles from "./Sidebar.module.css";
import { usePathname } from "next/navigation.js";

export default function Sidebar({ isOpen, fecharMenu }) {
    const [recolhida, setRecolhida] = useState(false);

    const menuItems = [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Pedidos / Comandas", href: "/admin/comandas", icon: ClipboardList, permissao: "comandas.listar" },
        { label: "Cozinha (KDS)", href: "/admin/cozinha", icon: ChefHat, permissao: "cozinha.fila" },
        { label: "Caixa", href: "/admin/caixa", icon: Tags, permissao: "caixas.visualizar" },
        { label: "Alimentos", href: "/admin/alimentos", icon: Utensils, permissao: "alimentos.listar" },
        { label: "Categorias", href: "/admin/categorias", icon: Tags, permissao: "categorias_alimentos.listar" },
        { label: "Mesas", href: "/admin/mesas", icon: Package, permissao: "mesas.listar" },
        { label: "Relatórios", href: "/admin/relatorios", icon: Package, permissao: "relatorios.vendas" },
        { label: "Usuários", href: "/admin/usuarios", icon: Users, permissao: "usuarios.listar" },
        { label: "Configurações", href: "/admin/configuracoes", icon: Settings, permissao: "loja.configurar" },
    ];

    const pathname = usePathname();

    return (
        <>
            {isOpen && <div className={styles.overlay} onClick={fecharMenu}></div>}

            <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} ${recolhida ? styles.sidebarCollapsed : ''}`}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.logo}>
                        Resenha <span>Espetos</span>
                    </h2>

                    <button
                        type="button"
                        className={styles.collapseBtn}
                        onClick={() => setRecolhida(atual => !atual)}
                        aria-label={recolhida ? "Expandir menu lateral" : "Recolher menu lateral"}
                        title={recolhida ? "Expandir menu lateral" : "Recolher menu lateral"}
                    >
                        {recolhida ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>

                    <button type="button" className={styles.closeBtn} onClick={fecharMenu} aria-label="Fechar menu">
                        <X size={24} />
                    </button>
                </div>

                <nav className={styles.navContainer}>
                    {menuItems.map((item, index) => {
                        const isActive = item.href === '/admin'
                            ? pathname === '/admin'
                            : pathname.startsWith(item.href);

                        const renderLink = () => (
                            <ItemSidebar
                                key={`item-${index}`}
                                label={item.label}
                                icon={item.icon}
                                href={item.href}
                                isActive={isActive}
                                onClick={fecharMenu}
                                compacto={recolhida}
                            />
                        );

                        if (item.permissao) {
                            return (
                                <Can key={`can-${index}`} perform={item.permissao}>
                                    {renderLink()}
                                </Can>
                            );
                        }

                        return renderLink();
                    })}
                </nav>
            </aside>
        </>
    );
}