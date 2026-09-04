"use client";

import Link from "next/link";
import styles from "./Sidebar.module.css";

export default function ItemSidebar({ label, icon: Icon, href, isActive, onClick, compacto = false }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            aria-label={label}
            title={compacto ? label : undefined}
        >
            <Icon className={styles.navIcon} size={20} />
            <span className={styles.navLabel}>{label}</span>
        </Link>
    );
}