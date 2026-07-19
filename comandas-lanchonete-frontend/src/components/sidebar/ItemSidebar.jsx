"use client";

import Link from "next/link";
import styles from "./Sidebar.module.css";

// 🟢 Adicionamos o isActive aqui nas props
export default function ItemSidebar({ label, icon: Icon, href, isActive, onClick }) {
    
    return (
        <Link
            href={href}
            onClick={onClick}
            // 🟢 Usa o isActive que veio lá do Sidebar para pintar de laranja
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
        >
            <Icon className={styles.navIcon} size={20} />
            <span className={styles.navLabel}>{label}</span>
        </Link>
    );
}