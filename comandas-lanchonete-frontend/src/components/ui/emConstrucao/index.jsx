import { ChefHat, Sparkles } from 'lucide-react';
import styles from './index.module.css';

export default function EmConstrucao({ 
    titulo = "Estamos preparando algo delicioso!", 
    subtitulo = "Nossa página inicial está recebendo um tempero especial. Muito em breve teremos novidades, relatórios de vendas e informativos por aqui."
}) {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                {/* Ícone de chef que conversa com o tema do sistema */}
                <ChefHat size={48} strokeWidth={1.5} />
            </div>
            
            <h2 className={styles.title}>{titulo}</h2>
            
            <p className={styles.subtitle}>
                {subtitulo}
            </p>

            <div className={styles.badge}>
                <span>Em Construção</span>
                <Sparkles size={14} style={{ color: '#ea580c' }} />
            </div>
            
            {/* FUTURAMENTE: Inserir aqui os componentes <Informativos /> ou <CarrosselOfertas /> */}
        </div>
    );
}