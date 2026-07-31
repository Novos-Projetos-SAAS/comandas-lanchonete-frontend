"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Store, Utensils } from "lucide-react";
import { obterCardapioPublico } from "@/services/cardapio.service";
import styles from "./page.module.css";

const formatarMoeda = (valor) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
}).format(Number(valor || 0));

/**
 * Cardápio público aberto pelo QR Code da mesa.
 * O polling mantém o aviso de funcionamento sincronizado sem nova dependência.
 */
export default function CardapioClient() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let ativo = true;

        const carregar = async ({ silencioso = false } = {}) => {
            if (!token) {
                if (ativo) {
                    setErro("O link do cardápio não possui o token da mesa.");
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await obterCardapioPublico(token);

                if (ativo) {
                    setDados(response?.data || response);
                    setErro("");
                }
            } catch (error) {
                if (ativo && !silencioso) {
                    setErro(error.response?.data?.message || "Não foi possível abrir este cardápio.");
                }
            } finally {
                if (ativo && !silencioso) setLoading(false);
            }
        };

        carregar();

        // Atualiza o estado da loja caso outro administrador abra ou feche o estabelecimento.
        const intervalId = window.setInterval(() => {
            carregar({ silencioso: true });
        }, 30000);

        return () => {
            ativo = false;
            window.clearInterval(intervalId);
        };
    }, [token]);

    if (loading) return <div className={styles.loading}>Carregando cardápio...</div>;

    if (erro || !dados) {
        return (
            <div className={styles.errorCard}>
                <AlertTriangle size={40} />
                <h1>Cardápio indisponível</h1>
                <p>{erro}</p>
            </div>
        );
    }

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>Resenha Espetos</span>
                    <h1>Nosso cardápio</h1>
                    <p>Mesa {dados.mesa.numero}</p>
                </div>
                <Utensils size={42} />
            </header>

            {!dados.loja.esta_aberta && (
                <div className={styles.closedBanner} role="status" aria-live="polite">
                    <Store size={20} />
                    <div>
                        <strong>O estabelecimento está fechado no momento</strong>
                        <span>
                            Você pode consultar nosso cardápio, mas novos pedidos estão temporariamente indisponíveis.
                        </span>
                    </div>
                </div>
            )}

            {dados.categorias.length === 0 ? (
                <div className={styles.emptyState}>Nenhum item disponível no momento.</div>
            ) : (
                dados.categorias.map((categoria) => (
                    <section key={categoria.id} className={styles.categorySection}>
                        <div className={styles.categoryHeading}>
                            <h2>{categoria.nome}</h2>
                            {categoria.descricao && <p>{categoria.descricao}</p>}
                        </div>

                        <div className={styles.productsGrid}>
                            {categoria.produtos.map((produto) => (
                                <article key={produto.id} className={styles.productCard}>
                                    <div>
                                        <h3>{produto.nome}</h3>
                                        <p>{produto.descricao || "Consulte nossa equipe para mais informações."}</p>
                                    </div>
                                    <strong>{formatarMoeda(produto.preco)}</strong>
                                </article>
                            ))}
                        </div>
                    </section>
                ))
            )}
        </main>
    );
}
