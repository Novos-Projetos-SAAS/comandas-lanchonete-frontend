// src/app/admin/page.jsx
"use client";

// import EmConstrucao from '@/components/EmConstrucao/emConstrucao';
import { Package, ChefHat, DollarSign, TrendingUp } from 'lucide-react';
import styles from './page.module.css';

export default function Dashboard() {
    return (
        <main className={styles.container}>

            {/* <section style={{ width: '100%', marginTop: '2rem' }}>
                <EmConstrucao />
            </section> */}
            
            <header className={styles.header}>
                <div>
                    <h1>Resumo do Dia</h1>
                    <p>Acompanhe o movimento da sua cozinha hoje.</p>
                </div>
            </header>

            {/* 👇 Cartões de resumo adaptados para as variáveis do Resenha */}
            <div className={styles.gridCards}>
                <div className={styles.card}>
                    <div className={styles.cardIcon} style={{ backgroundColor: 'rgba(var(--brand-blue-rgb), 0.1)', color: 'var(--brand-blue)' }}>
                        <Package size={24} />
                    </div>
                    <div className={styles.cardInfo}>
                        <span>Pedidos Hoje</span>
                        <strong>14</strong>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon} style={{ backgroundColor: 'rgba(var(--brand-orange-rgb), 0.1)', color: 'var(--brand-orange)' }}>
                        <ChefHat size={24} />
                    </div>
                    <div className={styles.cardInfo}>
                        <span>Em Preparo</span>
                        <strong>5</strong>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon} style={{ backgroundColor: 'rgba(var(--brand-red-rgb), 0.1)', color: 'var(--brand-red)' }}>
                        <DollarSign size={24} />
                    </div>
                    <div className={styles.cardInfo}>
                        <span>Faturamento</span>
                        <strong>R$ 485,50</strong>
                    </div>
                </div>
            </div>

            <section className={styles.content}>
                <div className={styles.placeholderBox}>
                    <TrendingUp size={48} color="var(--border-color)" />
                    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
                        Os gráficos e listagens aparecerão aqui
                    </p>
                </div>
            </section>
        </main>
    );
}