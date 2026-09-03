"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Loader2,
    QrCode,
    ShieldAlert,
    UsersRound
} from "lucide-react";
import {
    criarSessaoPublica,
    obterMesaPublica,
    obterSessaoAtual
} from "@/services/publico.service";
import { sessaoStorageKey } from "@/lib/public-session.mjs";
import styles from "./mesa.module.css";

function mensagemErro(error) {
    return error?.response?.data?.message || "Não foi possível validar esta mesa.";
}

export default function MesaEntryClient() {
    const params = useParams();
    const router = useRouter();
    const token = useMemo(() => {
        const valor = Array.isArray(params?.token) ? params.token[0] : params?.token;
        return typeof valor === "string" ? decodeURIComponent(valor) : "";
    }, [params]);

    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState("");
    const [nome, setNome] = useState("");
    const [confirmouAcompanhamento, setConfirmouAcompanhamento] = useState(false);
    const [negouAcompanhamento, setNegouAcompanhamento] = useState(false);

    useEffect(() => {
        if (!token) return;

        let ativo = true;

        async function iniciar() {
            try {
                const storageKey = sessaoStorageKey(token);
                const sessaoSalva = window.localStorage.getItem(storageKey);

                if (sessaoSalva) {
                    try {
                        await obterSessaoAtual(sessaoSalva);
                        router.replace(`/m/${encodeURIComponent(token)}/cardapio`);
                        return;
                    } catch (error) {
                        if ([401, 410].includes(error?.response?.status)) {
                            window.localStorage.removeItem(storageKey);
                        }
                    }
                }

                const resultado = await obterMesaPublica(token);
                if (ativo) setDados(resultado);
            } catch (error) {
                if (ativo) setErro(mensagemErro(error));
            } finally {
                if (ativo) setLoading(false);
            }
        }

        iniciar();

        return () => {
            ativo = false;
        };
    }, [router, token]);

    const estadoMesa = dados?.mesa?.estado;
    const podeInformarNome = estadoMesa === "livre" ||
        (estadoMesa === "ocupada" && confirmouAcompanhamento);

    async function criarSessao(event) {
        event.preventDefault();
        setErro("");

        if (nome.trim().length < 2) {
            setErro("Informe como podemos te chamar.");
            return;
        }

        try {
            setEnviando(true);
            const resultado = await criarSessaoPublica({
                qr_token: token,
                nome: nome.trim(),
                acompanhado: estadoMesa === "ocupada"
            });

            window.localStorage.setItem(sessaoStorageKey(token), resultado.token);
            router.replace(`/m/${encodeURIComponent(token)}/cardapio`);
        } catch (error) {
            setErro(mensagemErro(error));

            if (error?.response?.status === 409 && estadoMesa === "livre") {
                try {
                    const atualizado = await obterMesaPublica(token);
                    setDados(atualizado);
                    setConfirmouAcompanhamento(false);
                } catch {}
            }
        } finally {
            setEnviando(false);
        }
    }

    if (loading) {
        return (
            <main className={styles.centerState}>
                <Loader2 className={styles.spinner} />
                <span>Validando QR Code da mesa...</span>
            </main>
        );
    }

    if (!dados || erro && !dados) {
        return (
            <main className={styles.centerState}>
                <ShieldAlert size={42} />
                <h1>Não foi possível acessar esta mesa</h1>
                <p>{erro || "QR Code inválido ou indisponível."}</p>
                <button type="button" onClick={() => router.replace("/")}>Voltar para o início</button>
            </main>
        );
    }

    if (["fechando", "indisponivel"].includes(estadoMesa)) {
        return (
            <main className={styles.page}>
                <section className={styles.card}>
                    <span className={styles.iconWarn}><ShieldAlert /></span>
                    <p className={styles.kicker}>Mesa {dados.mesa.numero}</p>
                    <h1>Precisamos verificar esta mesa</h1>
                    <p className={styles.description}>
                        {dados.mensagem || "Esta mesa não está disponível para novos pedidos no momento."}
                    </p>
                    <div className={styles.notice}>Avise um funcionário para vir até a sua mesa.</div>
                    <button type="button" className={styles.secondary} onClick={() => router.replace("/")}>
                        <ArrowLeft size={18} /> Voltar
                    </button>
                </section>
            </main>
        );
    }

    if (estadoMesa === "ocupada" && !confirmouAcompanhamento) {
        return (
            <main className={styles.page}>
                <section className={styles.card}>
                    <span className={styles.icon}><UsersRound /></span>
                    <p className={styles.kicker}>Mesa {dados.mesa.numero}</p>
                    <h1>Esta mesa já possui atendimento</h1>
                    <p className={styles.description}>
                        Esta Mesa <strong>{dados.mesa.numero}</strong> está no nome de <strong>{dados.comanda?.titular_nome}</strong>.
                        Vocês estão acompanhados?
                    </p>

                    {negouAcompanhamento ? (
                        <div className={styles.blocked}>
                            <ShieldAlert size={25} />
                            <div>
                                <strong>Não vamos liberar pedidos neste dispositivo.</strong>
                                <p>Caso vocês não estejam juntos, avise os funcionários para virem até a sua mesa.</p>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.actions}>
                            <button type="button" className={styles.primary} onClick={() => setConfirmouAcompanhamento(true)}>
                                <CheckCircle2 size={19} /> Sim, estamos juntos
                            </button>
                            <button type="button" className={styles.secondary} onClick={() => setNegouAcompanhamento(true)}>
                                Não conheço esta pessoa
                            </button>
                        </div>
                    )}

                    {negouAcompanhamento && (
                        <button type="button" className={styles.secondary} onClick={() => setNegouAcompanhamento(false)}>
                            Voltar
                        </button>
                    )}
                </section>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <span className={styles.icon}><QrCode /></span>
                <p className={styles.kicker}>Mesa identificada</p>
                <h1>Você está na Mesa {dados.mesa.numero}</h1>
                <p className={styles.description}>
                    {estadoMesa === "ocupada"
                        ? `Você será adicionado ao atendimento de ${dados.comanda?.titular_nome}, mas seus pedidos continuarão identificados pelo seu nome.`
                        : "Seu nome identifica os pedidos feitos neste dispositivo. A mesa só será ocupada quando o primeiro pedido for confirmado."}
                </p>

                {podeInformarNome && (
                    <form className={styles.form} onSubmit={criarSessao}>
                        <label htmlFor="nome-cliente">Como podemos te chamar?</label>
                        <input
                            id="nome-cliente"
                            type="text"
                            value={nome}
                            onChange={event => setNome(event.target.value)}
                            placeholder="Seu nome"
                            minLength={2}
                            maxLength={80}
                            autoComplete="given-name"
                            autoFocus
                        />

                        {erro && <div className={styles.error}>{erro}</div>}

                        <button type="submit" className={styles.primary} disabled={enviando}>
                            {enviando ? <Loader2 className={styles.spinner} size={19} /> : <CheckCircle2 size={19} />}
                            Começar pedido
                        </button>
                    </form>
                )}

                <button type="button" className={styles.linkButton} onClick={() => router.replace("/")}>
                    <ArrowLeft size={16} /> Escanear outro QR Code
                </button>
            </section>
        </main>
    );
}
