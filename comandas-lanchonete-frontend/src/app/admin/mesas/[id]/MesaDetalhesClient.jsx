"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    AlertTriangle,
    ArrowLeft,
    Clock,
    ExternalLink,
    Hash,
    QrCode,
    RefreshCw,
    ShoppingBasket,
    User,
    Wallet
} from "lucide-react";
import Swal from "sweetalert2";
import MesaForm from "@/components/forms/mesas";
import { useAuth } from "@/hooks/useAuth";
import { useMesas } from "@/hooks/useMesas";
import styles from "./page.module.css";

// Funções de apresentação ficam fora do componente para evitar recriações desnecessárias.
const formatarMoeda = (valor) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
}).format(Number(valor || 0));

const formatarData = (data) => {
    if (!data) return "Não informado";
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(data));
};

const formatarTempo = (minutos) => {
    if (minutos === null || minutos === undefined) return "Sem atividade registrada";
    if (minutos < 1) return "Agora";
    if (minutos < 60) return `${minutos} min`;
    return `${Math.floor(minutos / 60)}h ${minutos % 60}min`;
};

/**
 * Exibe dados cadastrais, situação operacional, comanda e QR Code da mesa.
 * O modo view/edit é definido pela query string e validado pela permissão do usuário.
 */
export default function MesaDetalhesClient() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { hasPermission } = useAuth();
    const { buscarMesaPorId, atualizarMesa, buscarQrCode } = useMesas({ carregarLista: false });

    const [mesa, setMesa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [qrCode, setQrCode] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);

    // O ID vem da rota dinâmica /admin/mesas/[id].
    const id = params?.id;
    // Mesmo com ?mode=edit, a edição só é liberada para quem possui mesas.editar.
    const modoSolicitado = searchParams.get("mode") === "edit" ? "edit" : "view";
    const podeEditar = hasPermission("mesas.editar");
    const modo = modoSolicitado === "edit" && podeEditar ? "edit" : "view";

    // Consulta os dados mais recentes sempre que a tela abre ou é atualizada manualmente.
    const carregarMesa = async () => {
        setLoading(true);
        setErro("");

        try {
            const dados = await buscarMesaPorId(id);
            setMesa(dados);
        } catch (error) {
            console.error("Erro ao carregar mesa:", error);
            setErro(error.response?.data?.message || "Não foi possível carregar os dados da mesa.");
        } finally {
            setLoading(false);
        }
    };

    // Recarrega a mesa quando o identificador da rota mudar.
    useEffect(() => {
        if (!id) return;
        carregarMesa();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Salva somente o número da mesa e retorna a tela ao modo de visualização.
    const handleSave = async (payload) => {
        try {
            await atualizarMesa(id, payload);
            await Swal.fire({
                title: "Mesa atualizada!",
                text: "O número da mesa foi salvo com sucesso.",
                icon: "success",
                iconColor: "var(--brand-blue)",
                confirmButtonColor: "var(--brand-orange)"
            });

            await carregarMesa();
            router.replace(`/admin/mesas/${id}?mode=view`);
        } catch (error) {
            await Swal.fire({
                title: "Erro ao atualizar",
                text: error.response?.data?.message || "Verifique os dados e tente novamente.",
                icon: "error",
                iconColor: "var(--brand-red)",
                confirmButtonColor: "var(--brand-red)"
            });
            throw error;
        }
    };

    // O QR Code é gerado sob demanda para evitar trabalho desnecessário no carregamento inicial.
    const handleQrCode = async () => {
        setQrLoading(true);
        try {
            const dados = await buscarQrCode(id);
            setQrCode(dados);
        } catch (error) {
            await Swal.fire({
                title: "QR Code indisponível",
                text: error.response?.data?.message || "Não foi possível gerar o QR Code desta mesa.",
                icon: "error",
                iconColor: "var(--brand-red)",
                confirmButtonColor: "var(--brand-red)"
            });
        } finally {
            setQrLoading(false);
        }
    };

    if (loading) {
        return <div className={styles.loadingCard}>Carregando informações da mesa...</div>;
    }

    if (erro || !mesa) {
        return (
            <div className={styles.errorCard}>
                <AlertTriangle size={36} />
                <strong>{erro || "Mesa não encontrada."}</strong>
                <Link href="/admin/mesas">Voltar para o mapa de mesas</Link>
            </div>
        );
    }

    // Traduz os dados do backend para a classe visual correspondente.
    const classeSituacao = !mesa.ativo
        ? styles.statusInactive
        : mesa.precisa_atencao
            ? styles.statusAttention
            : mesa.status === "Livre"
                ? styles.statusFree
                : styles.statusOccupied;

    const textoSituacao = !mesa.ativo
        ? "Mesa inativa"
        : mesa.precisa_atencao
            ? "Mesa ocupada precisando de atenção"
            : mesa.status === "Livre"
                ? "Mesa livre"
                : `Mesa ${mesa.status.toLowerCase()}`;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/admin/mesas" className={styles.backButton} title="Voltar para mesas">
                    <ArrowLeft size={24} />
                </Link>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>{modo === "edit" ? "Editar Mesa" : `Mesa ${mesa.numero}`}</h1>
                    <p className={styles.subtitle}>Cadastro, situação operacional e dados da comanda atual.</p>
                </div>
                <button type="button" className={styles.reloadButton} onClick={carregarMesa} title="Atualizar dados">
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Banner principal mostra o estado operacional mais importante. */}
            <div className={`${styles.statusBanner} ${classeSituacao}`}>
                {mesa.precisa_atencao ? <AlertTriangle size={21} /> : <Clock size={21} />}
                <div>
                    <strong>{textoSituacao}</strong>
                    <span>
                        {mesa.precisa_atencao
                            ? `${formatarTempo(mesa.minutos_sem_pedido)} sem novo pedido.`
                            : mesa.ativo
                                ? "Status atualizado automaticamente pelo sistema."
                                : "Esta mesa não aceita novas comandas."}
                    </span>
                </div>
            </div>

            {/* Formulário compartilhado entre visualização e edição. */}
            <MesaForm
                initialData={mesa}
                mode={modo}
                allowEdit={podeEditar}
                onSave={handleSave}
                onCancel={() => router.push("/admin/mesas")}
            />

            {/* Dados da comanda ativa retornados pelo endpoint de mesas. */}
            <section className={styles.operationalSection}>
                <div className={styles.sectionHeading}>
                    <div>
                        <h2>Informações operacionais</h2>
                        <p>Dados em tempo real da mesa e da comanda vinculada.</p>
                    </div>
                </div>

                <div className={styles.infoGrid}>
                    <div className={styles.infoCard}>
                        <Hash size={20} />
                        <span>Comanda atual</span>
                        <strong>{mesa.comanda ? `#${mesa.comanda.id}` : "Nenhuma"}</strong>
                    </div>
                    <div className={styles.infoCard}>
                        <User size={20} />
                        <span>Cliente</span>
                        <strong>{mesa.comanda?.cliente_nome || "Não informado"}</strong>
                    </div>
                    <div className={styles.infoCard}>
                        <ShoppingBasket size={20} />
                        <span>Itens pedidos</span>
                        <strong>{mesa.comanda?.total_itens || 0}</strong>
                    </div>
                    <div className={styles.infoCard}>
                        <Wallet size={20} />
                        <span>Valor da comanda</span>
                        <strong>{formatarMoeda(mesa.comanda?.valor_total)}</strong>
                    </div>
                    <div className={styles.infoCard}>
                        <Clock size={20} />
                        <span>Comanda aberta em</span>
                        <strong>{formatarData(mesa.comanda?.criado_em)}</strong>
                    </div>
                    <div className={styles.infoCard}>
                        <Clock size={20} />
                        <span>Último pedido</span>
                        <strong>{formatarData(mesa.ultimo_pedido_em)}</strong>
                    </div>
                </div>
            </section>

            {/* QR Code para o cardápio de autoatendimento da mesa. */}
            <section className={styles.qrSection}>
                <div className={styles.sectionHeading}>
                    <div>
                        <h2>QR Code da mesa</h2>
                        <p>Utilizado para abrir o cardápio de autoatendimento desta mesa.</p>
                    </div>
                    {mesa.ativo && !qrCode && (
                        <button type="button" className={styles.qrButton} onClick={handleQrCode} disabled={qrLoading}>
                            <QrCode size={18} />
                            {qrLoading ? "Gerando..." : "Exibir QR Code"}
                        </button>
                    )}
                </div>

                {!mesa.ativo ? (
                    <p className={styles.qrUnavailable}>Reative a mesa para utilizar o QR Code.</p>
                ) : qrCode ? (
                    <div className={styles.qrContent}>
                        <div className={styles.qrImageWrapper}>
                            <Image
                                src={qrCode.imagem}
                                alt={`QR Code da Mesa ${mesa.numero}`}
                                width={260}
                                height={260}
                                unoptimized
                            />
                        </div>
                        <div className={styles.qrDetails}>
                            <strong>Mesa {qrCode.numero}</strong>
                            <p>O cliente pode apontar a câmera do celular para acessar o cardápio.</p>
                            <a href={qrCode.url_link} target="_blank" rel="noreferrer">
                                Abrir link do cardápio <ExternalLink size={15} />
                            </a>
                        </div>
                    </div>
                ) : (
                    <p className={styles.qrPlaceholder}>Clique em “Exibir QR Code” para gerar a imagem.</p>
                )}
            </section>
        </div>
    );
}
