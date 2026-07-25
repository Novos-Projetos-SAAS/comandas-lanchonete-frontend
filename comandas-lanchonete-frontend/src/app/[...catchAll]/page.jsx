import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import styles from './page.module.css';

export default function CatchAllNotFound() {
    return (
        <main className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconWrapper}>
                    <AlertTriangle size={48} strokeWidth={1.5} />
                </div>
                
                <h1 className={styles.title}>404</h1>
                <h2 className={styles.subtitle}>Página não encontrada</h2>
                
                <p className={styles.description}>
                    A URL que você tentou acessar não existe no sistema, foi removida ou você não possui permissão para visualizá-la.
                </p>
                
                <Link href="/admin" className={styles.btnReturn}>
                    <ArrowLeft size={18} />
                    <span>Voltar para o Painel</span>
                </Link>
            </div>
        </main>
    );
}