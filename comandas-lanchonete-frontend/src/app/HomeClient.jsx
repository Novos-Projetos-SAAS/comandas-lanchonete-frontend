"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Camera,
    Clock3,
    ExternalLink,
    Loader2,
    MapPin,
    MessageCircle,
    Phone,
    QrCode,
    ShieldCheck
} from "lucide-react";
import QrScannerModal from "@/components/public/QrScannerModal";
import { obterEstabelecimentoPublico } from "@/services/publico.service";
import styles from "./page.module.css";

function formatarWhatsapp(numero) {
    return String(numero || "").replace(/\D/g, "");
}

function formatarHorarios(horarios) {
    if (!horarios || typeof horarios !== "object") return [];

    return Object.entries(horarios)
        .filter(([, valor]) => valor)
        .map(([dia, valor]) => ({ dia, valor: typeof valor === "string" ? valor : String(valor) }));
}

export default function HomeClient() {
    const router = useRouter();
    const [estabelecimento, setEstabelecimento] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scannerAberto, setScannerAberto] = useState(false);

    useEffect(() => {
        let ativo = true;

        obterEstabelecimentoPublico()
            .then(dados => {
                if (ativo) setEstabelecimento(dados);
            })
            .catch(() => {
                if (ativo) {
                    setEstabelecimento({
                        nome: "Lanchonete",
                        descricao: "Faça seu pedido diretamente da mesa pelo QR Code.",
                        loja: { esta_aberta: false, status: "Indisponível" },
                        atendimento: {
                            aceitando_pedidos: false,
                            mensagem: "No momento não estamos recebendo pedidos."
                        }
                    });
                }
            })
            .finally(() => {
                if (ativo) setLoading(false);
            });

        return () => {
            ativo = false;
        };
    }, []);

    const horarios = useMemo(
        () => formatarHorarios(estabelecimento?.horarios),
        [estabelecimento?.horarios]
    );

    const whatsapp = formatarWhatsapp(estabelecimento?.whatsapp);
    const aberta = Boolean(estabelecimento?.loja?.esta_aberta);
    const atendimento = estabelecimento?.atendimento;
    const recebendoPedidos = atendimento?.aceitando_pedidos !== false;

    const abrirMesa = token => {
        setScannerAberto(false);
        router.push(`/m/${encodeURIComponent(token)}`);
    };

    if (loading) {
        return (
            <main className={styles.loadingPage}>
                <Loader2 className={styles.spinner} />
                <span>Carregando estabelecimento...</span>
            </main>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.topbar}>
                <a href="#inicio" className={styles.brand} aria-label="Início">
                    {estabelecimento?.logo_url ? (
                        <span
                            className={styles.logoImage}
                            style={{ backgroundImage: `url(${estabelecimento.logo_url})` }}
                            role="img"
                            aria-label={`Logo ${estabelecimento.nome}`}
                        />
                    ) : (
                        <span className={styles.logoFallback}>{estabelecimento?.nome?.slice(0, 1) || "L"}</span>
                    )}
                    <strong>{estabelecimento?.nome}</strong>
                </a>

                <button type="button" className={styles.headerScan} onClick={() => setScannerAberto(true)}>
                    <QrCode size={18} /> Ler QR
                </button>
            </header>

            <main id="inicio">
                <section className={styles.hero}>
                    <div
                        className={styles.cover}
                        style={estabelecimento?.capa_url
                            ? { backgroundImage: `linear-gradient(90deg, rgba(20,12,8,.88), rgba(20,12,8,.42)), url(${estabelecimento.capa_url})` }
                            : undefined}
                    >
                        <div className={styles.heroContent}>
                            <span className={`${styles.status} ${aberta ? styles.open : styles.closed}`}>
                                <span /> {aberta ? "Aberto agora" : "Fechado no momento"}
                            </span>

                            <h1>{estabelecimento?.nome}</h1>
                            <p>
                                {estabelecimento?.descricao ||
                                    "Seu atendimento começa na mesa. Leia o QR Code para acessar o cardápio e fazer pedidos."}
                            </p>

                            {!recebendoPedidos && (
                                <div className={styles.closedMessage}>
                                    {atendimento?.mensagem || estabelecimento?.mensagem_fechado || "No momento não estamos recebendo pedidos."}
                                </div>
                            )}

                            <div className={styles.heroActions}>
                                <button type="button" className={styles.primary} onClick={() => setScannerAberto(true)}>
                                    <Camera size={20} /> {recebendoPedidos ? "Escanear QR Code" : "Ver atendimento"}
                                </button>

                                {whatsapp && (
                                    <a
                                        className={styles.secondary}
                                        href={`https://wa.me/${whatsapp}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <MessageCircle size={19} /> WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.stepsSection}>
                    <div className={styles.sectionHeading}>
                        <span>Atendimento na mesa</span>
                        <h2>Seu pedido começa pelo QR Code</h2>
                        <p>Sem cadastro e sem precisar instalar aplicativo.</p>
                    </div>

                    <div className={styles.steps}>
                        <article>
                            <span className={styles.stepIcon}><QrCode /></span>
                            <strong>1. Leia o QR</strong>
                            <p>Use o código disponível na sua própria mesa.</p>
                        </article>
                        <article>
                            <span className={styles.stepIcon}><ShieldCheck /></span>
                            <strong>2. Confirme a mesa</strong>
                            <p>O sistema valida o QR e identifica onde você está.</p>
                        </article>
                        <article>
                            <span className={styles.stepIcon}><Camera /></span>
                            <strong>3. Faça seu pedido</strong>
                            <p>O cardápio só é liberado depois da leitura válida.</p>
                        </article>
                    </div>
                </section>

                <section className={styles.infoSection}>
                    <div className={styles.infoMain}>
                        <span>Informações</span>
                        <h2>Antes de chegar, confira os detalhes</h2>
                    </div>

                    <div className={styles.infoGrid}>
                        {estabelecimento?.endereco && (
                            <article>
                                <MapPin />
                                <div>
                                    <strong>Endereço</strong>
                                    <p>{estabelecimento.endereco}</p>
                                </div>
                            </article>
                        )}

                        {estabelecimento?.telefone && (
                            <article>
                                <Phone />
                                <div>
                                    <strong>Contato</strong>
                                    <p>{estabelecimento.telefone}</p>
                                </div>
                            </article>
                        )}

                        <article>
                            <Clock3 />
                            <div>
                                <strong>Funcionamento</strong>
                                {horarios.length ? (
                                    <ul className={styles.hoursList}>
                                        {horarios.map(item => (
                                            <li key={item.dia}><span>{item.dia}</span><b>{item.valor}</b></li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>{aberta ? "Estabelecimento aberto agora." : "Consulte nossos horários de atendimento."}</p>
                                )}
                            </div>
                        </article>
                    </div>
                </section>

                <section className={styles.finalCta}>
                    <QrCode size={42} />
                    <div>
                        <span>Já está em uma de nossas mesas?</span>
                        <h2>{recebendoPedidos ? "Leia o QR Code da sua mesa para começar." : "Atendimento de pedidos indisponível agora."}</h2>
                        <p>{recebendoPedidos
                            ? "O cardápio e os pedidos não ficam disponíveis sem uma leitura válida."
                            : atendimento?.mensagem || "Aguarde a liberação do atendimento para iniciar pedidos."}</p>
                    </div>
                    <button type="button" onClick={() => setScannerAberto(true)}>
                        {recebendoPedidos ? "Ler QR Code" : "Ver status"}
                    </button>
                </section>
            </main>

            <footer className={styles.footer}>
                <strong>{estabelecimento?.nome}</strong>
                <span>Atendimento digital na mesa</span>
                <a href="/admin">Área administrativa <ExternalLink size={13} /></a>
            </footer>

            <QrScannerModal
                aberto={scannerAberto}
                onClose={() => setScannerAberto(false)}
                onToken={abrirMesa}
                atendimento={atendimento}
            />
        </div>
    );
}
