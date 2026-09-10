"use client";

import Link from "next/link";
import styles from "./Sidebar.module.css";

export default function ItemSidebar({ label, icon: Icon, href, isActive, onClick, compacto = false }) {
    const className = `${styles.navItem} ${!href ? styles.navButton : ''} ${isActive ? styles.navItemActive : ''}`;
    const content = (
        <>
            <Icon className={styles.navIcon} size={20} />
            <span className={styles.navLabel}>{label}</span>
        </>
    );

    if (!href) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={className}
                aria-label={label}
                title={compacto ? label : undefined}
            >
                {content}
            </button>
        );
    }

    return (
        <Link
            href={href}
            onClick={onClick}
            className={className}
            aria-label={label}
            title={compacto ? label : undefined}
        >
            {content}
        </Link>
    );
}