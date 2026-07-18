"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

export default function ItemSidebar({ label, icon: Icon, href, onClick }) {
    const pathname = usePathname();
    
    // Verifica se a rota atual bate com o href (ou se é sub-rota, como /admin/pedidos/novo)
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
        >
            <Icon className={styles.navIcon} size={20} />
            <span className={styles.navLabel}>{label}</span>
        </Link>
    );
}