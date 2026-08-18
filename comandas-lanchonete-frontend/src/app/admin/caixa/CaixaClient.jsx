"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Can from "@/components/ui/can/Can";
import { abrirCaixa, fecharCaixa, obterCaixaAtual } from "@/services/caixa.service";
import { listarComandasParaReceber, receberComanda } from "@/services/comandas.service";
import styles from "./CaixaClient.module.css";

const METODOS = ["Dinheiro", "Pix", "Cartão de Débito", "Cartão de Crédito"];

function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function mensagemErro(error) {
    return error?.response?.data?.message || "Não foi possível concluir a operação.";
}

export default function CaixaClient() {
    const [estado, setEstado] = useState(null);
    const [comandas, setComandas] = useState([]);
    const [saldoInicial, setSaldoInicial] = useState("0");
    const [saldoContado, setSaldoContado] = useState("");
    const [metodos, setMetodos] = useState({});
    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState(false);
    const [aviso, setAviso] = useState(null);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setAviso(null);

        try {
            const respostaCaixa = await obterCaixaAtual();
            setEstado(respostaCaixa.data);

            if (respostaCaixa.data?.caixa_aberto) {
                const pendentes = await listarComandasParaReceber();
                setComandas(pendentes);
            } else {
                setComandas([]);
                setSaldoContado("");
            }
        } catch (error) {
            setAviso({ tipo: "erro", texto: mensagemErro(error) });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const resumo = estado?.resumo;
    const caixa = estado?.caixa;
    const diferencaPrevista = useMemo(() => {
        if (saldoContado === "" || !resumo) return null;
        return Number(saldoContado) - Number(resumo.saldo_esperado || 0);
    }, [saldoContado, resumo]);

    async function handleAbrir(event) {
        event.preventDefault();
        setProcessando(true);
        setAviso(null);

        try {
            await abrirCaixa(saldoInicial);
            setAviso({ tipo: "sucesso", texto: "Caixa aberto com sucesso." });
            await carregar();
        } catch (error) {
            setAviso({ tipo: "erro", texto: mensagemErro(error) });
        } finally {
            setProcessando(false);
        }
    }

    async function handleReceber(comanda) {
        const metodo = metodos[comanda.id] || METODOS[0];
        setProcessando(true);
        setAviso(null);

        try {
            await receberComanda(comanda.id, metodo);
            setAviso({
                tipo: "sucesso",
                texto: `Comanda #${comanda.id} recebida em ${metodo}.`
            });
            await carregar();
        } catch (error) {
            setAviso({ tipo: "erro", texto: mensagemErro(error) });
        } finally {
            setProcessando(false);
        }
    }

    async function handleFechar(event) {
        event.preventDefault();
        setProcessando(true);
        setAviso(null);

        try {
            await fecharCaixa(saldoContado);
            setAviso({ tipo: "sucesso", texto: "Caixa fechado com sucesso." });
            setSaldoInicial("0");
            await carregar();
        } catch (error) {
            setAviso({ tipo: "erro", texto: mensagemErro(error) });
        } finally {
            setProcessando(false);
        }
    }

    if (carregando && !estado) {
        return <div className={styles.card}>Carregando caixa...</div>;
    }

    return (
        <div className={styles.wrapper}>
            {aviso && (
                <div className={`${styles.aviso} ${aviso.tipo === "erro" ? styles.erro : styles.sucesso}`}>
                    {aviso.texto}
                </div>
            )}

            {!estado?.caixa_aberto ? (
                <section className={styles.card}>
                    <h2>Caixa fechado</h2>
                    <p>Informe o dinheiro inicial disponível para troco.</p>
                    <Can perform="caixas.abrir">
                        <form className={styles.formLinha} onSubmit={handleAbrir}>
                            <label>
                                Saldo inicial
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={saldoInicial}
                                    onChange={(event) => setSaldoInicial(event.target.value)}
                                    required
                                />
                            </label>
                            <button type="submit" disabled={processando}>Abrir caixa</button>
                        </form>
                    </Can>
                </section>
            ) : (
                <>
                    <section className={styles.resumoGrid}>
                        <div className={styles.cardResumo}>
                            <span>Saldo inicial</span>
                            <strong>{moeda(caixa?.saldo_inicial)}</strong>
                        </div>
                        <div className={styles.cardResumo}>
                            <span>Vendas do turno</span>
                            <strong>{moeda(resumo?.total_faturado)}</strong>
                        </div>
                        <div className={styles.cardResumo}>
                            <span>Dinheiro em vendas</span>
                            <strong>{moeda(resumo?.total_dinheiro)}</strong>
                        </div>
                        <div className={styles.cardResumo}>
                            <span>Dinheiro esperado</span>
                            <strong>{moeda(resumo?.saldo_esperado)}</strong>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <h2>Receber comandas</h2>
                                <p>Recebimento integral em um único método por comanda.</p>
                            </div>
                            <button className={styles.secundario} type="button" onClick={carregar} disabled={processando}>
                                Atualizar
                            </button>
                        </div>

                        {comandas.length === 0 ? (
                            <p className={styles.vazio}>Nenhuma comanda pendente para receber.</p>
                        ) : (
                            <div className={styles.lista}>
                                {comandas.map((comanda) => (
                                    <div className={styles.comanda} key={comanda.id}>
                                        <div>
                                            <strong>Comanda #{comanda.id} · Mesa {comanda.numero_mesa}</strong>
                                            <span>{comanda.cliente_nome || "Sem nome"} · {comanda.status}</span>
                                        </div>
                                        <strong>{moeda(comanda.valor_total)}</strong>
                                        <select
                                            value={metodos[comanda.id] || METODOS[0]}
                                            onChange={(event) => setMetodos((atual) => ({
                                                ...atual,
                                                [comanda.id]: event.target.value
                                            }))}
                                        >
                                            {METODOS.map((metodo) => (
                                                <option key={metodo} value={metodo}>{metodo}</option>
                                            ))}
                                        </select>
                                        <Can perform="comandas.fechar">
                                            <button
                                                type="button"
                                                disabled={processando}
                                                onClick={() => handleReceber(comanda)}
                                            >
                                                Receber
                                            </button>
                                        </Can>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className={styles.card}>
                        <h2>Resumo por pagamento</h2>
                        <div className={styles.pagamentos}>
                            {(resumo?.por_metodo || []).length === 0 ? (
                                <span>Nenhuma venda recebida neste turno.</span>
                            ) : resumo.por_metodo.map((item) => (
                                <div key={item.metodo_pagamento}>
                                    <span>{item.metodo_pagamento}</span>
                                    <strong>{moeda(item.total)}</strong>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={styles.card}>
                        <h2>Fechar caixa</h2>
                        <p>
                            Conte somente o dinheiro físico da gaveta. O esperado é saldo inicial + vendas em Dinheiro.
                        </p>
                        <Can perform="caixas.fechar">
                            <form className={styles.formLinha} onSubmit={handleFechar}>
                                <label>
                                    Dinheiro contado
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={saldoContado}
                                        onChange={(event) => setSaldoContado(event.target.value)}
                                        required
                                    />
                                </label>
                                <div className={styles.diferenca}>
                                    <span>Diferença prevista</span>
                                    <strong>{diferencaPrevista === null ? "—" : moeda(diferencaPrevista)}</strong>
                                </div>
                                <button type="submit" disabled={processando || comandas.length > 0}>
                                    Fechar caixa
                                </button>
                            </form>
                        </Can>
                        {comandas.length > 0 && (
                            <small>Receba ou cancele todas as comandas pendentes antes de fechar.</small>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
