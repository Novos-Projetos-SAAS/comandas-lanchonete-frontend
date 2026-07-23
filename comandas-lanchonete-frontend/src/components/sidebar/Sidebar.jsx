"use client";

import {
    LayoutDashboard, ClipboardList, ChefHat, Utensils,
    Tags, Package, Users, Settings, X
} from "lucide-react";
import ItemSidebar from "./ItemSidebar.jsx";
import Can from "../ui/can/Can.jsx";
import styles from "./Sidebar.module.css";
import { usePathname } from "next/navigation.js";

export default function Sidebar({ isOpen, fecharMenu }) {
    const menuItems = [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Pedidos / Comandas", href: "/admin/comandas", icon: ClipboardList, permissao: "comandas.listar" },
        { label: "Cozinha (KDS)", href: "/admin/cozinha", icon: ChefHat, permissao: "cozinha.fila" },
        { label: "Caixa", href: "/admin/caixa", icon: Tags, permissao: "caixas.visualizar" },
        { label: "Cardápio / Alimentos", href: "/admin/alimentos", icon: Utensils, permissao: "alimentos.listar" },
        { label: "Categorias", href: "/admin/categorias", icon: Tags, permissao: "categorias_alimentos.listar" }, // Ajustado para bater com sua URL real se necessário
        { label: "Mesas", href: "/admin/mesas", icon: Package, permissao: "mesas.listar" },
        { label: "Relatórios", href: "/admin/relatorios", icon: Package, permissao: "relatorios.vendas" },
        { label: "Usuários", href: "/admin/usuarios", icon: Users, permissao: "usuarios.listar" },
        { label: "Configurações", href: "/admin/configuracoes", icon: Settings, permissao: "loja.configurar" },
    ];

    const pathname = usePathname();

    return (
        <>
            {/* Overlay escuro para mobile */}
            {isOpen && <div className={styles.overlay} onClick={fecharMenu}></div>}

            <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.logo}>
                        Resenha <span>Espetos</span>
                    </h2>
                    <button className={styles.closeBtn} onClick={fecharMenu}>
                        <X size={24} />
                    </button>
                </div>

                <nav className={styles.navContainer}>
                    {menuItems.map((item, index) => {
                        // 🟢 Lógica movida para DENTRO do map, onde o 'item' existe de verdade
                        const isActive = item.href === '/admin'
                            ? pathname === '/admin' // Se for o dashboard, a rota tem que ser EXATA
                            : pathname.startsWith(item.href);

                        const renderLink = () => (
                            <ItemSidebar
                                key={`item-${index}`}
                                label={item.label}
                                icon={item.icon}
                                href={item.href}
                                isActive={isActive} // 🟢 Passamos a prop para o componente pintar o fundo
                                onClick={fecharMenu} 
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