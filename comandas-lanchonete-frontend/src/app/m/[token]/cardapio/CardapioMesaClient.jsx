"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Loader2,
    Minus,
    Plus,
    ReceiptText,
    RefreshCw,
    ShoppingBag,
    Trash2,
    UtensilsCrossed
} from "lucide-react";
import Swal from "sweetalert2";
import {
    criarPedidoPublico,
    obterCardapioPublico,
    obterMeusPedidos,
    obterResumoComanda,
    obterSessaoAtual,
    solicitarContaPublica
} from "@/services/publico.service";
import {
    carrinhoStorageKey,
    rotuloStatusPedido,
    sessaoStorageKey
} from "@/lib/public-session.mjs";
import styles from "./cardapio.module.css";

const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

function mensagemErro(error) {
    return error?.response?.data?.message || "Não foi possível concluir esta operação.";
}

function statusClass(status) {
    if (status === "Entregue") return styles.statusDelivered;
    if (status === "Pronto") return styles.statusReady;
    if (status === "Preparando") return styles.statusPreparing;
    return styles.statusPending;
}

export default function CardapioMesaClient() {
    const params = useParams();
    const router = useRouter();
    const qrToken = useMemo(() => {
        const valor = Array.isArray(params?.token) ? params.token[0] : params?.token;
        return typeof valor === "string" ? decodeURIComponent(valor) : "";
    }, [params]);

    const [sessionToken, setSessionToken] = useState("");
    const [sessao, setSessao] = useState(null);
    const [cardapio, setCardapio] = useState(null);
    const [pedidos, setPedidos] = useState([]);
    const [resumo, setResumo] = useState(null);
    const [carrinho, setCarrinho] = useState([]);
    const [aba, setAba] = useState("cardapio");
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [atualizando, setAtualizando] = useState(false);
    const [sessaoEncerrada, setSessaoEncerrada] = useState(false);
    const [idempotencyKey, setIdempotencyKey] = useState("");

    const limparSessao = useCallback(() => {
        if (!qrToken) return;
        window.localStorage.removeItem(sessaoStorageKey(qrToken));
        window.localStorage.removeItem(carrinhoStorageKey(qrToken));
        setSessionToken("");
        setCarrinho([]);
    }, [qrToken]);

    const tratarErroSessao = useCallback((error) => {
        const status = error?.response?.status;

        if ([401, 410].includes(status)) {
            limparSessao();
            setSessaoEncerrada(true);
            return true;
        }

        if (status === 409 && error?.response?.data?.message?.includes("comanda ativa")) {
            limparSessao();
            router.replace(`/m/${encodeURIComponent(qrToken)}`);
            return true;
        }

        return false;
    }, [limparSessao, qrToken, router]);

    const carregarOperacional = useCallback(async (token, silencioso = false) => {
        try {
            if (silencioso) setAtualizando(true);

            const [pedidosAtualizados, resumoAtualizado] = await Promise.all([
                obterMeusPedidos(token),
                obterResumoComanda(token)
            ]);

            setPedidos(pedidosAtualizados);
            setResumo(resumoAtualizado);

            if (resumoAtualizado?.requer_confirmacao_acompanhamento) {
                limparSessao();
                router.replace(`/m/${encodeURIComponent(qrToken)}`);
            }
        } catch (error) {
            tratarErroSessao(error);
        } finally {
            if (silencioso) setAtualizando(false);
        }
    }, [limparSessao, qrToken, router, tratarErroSessao]);

    useEffect(() => {
        if (!qrToken) return;

        let ativo = true;

        async function iniciar() {
            const tokenSalvo = window.localStorage.getItem(sessaoStorageKey(qrToken));

            if (!tokenSalvo) {
                router.replace(`/m/${encodeURIComponent(qrToken)}`);
                return;
            }

            setSessionToken(tokenSalvo);

            try {
                const [sessaoAtual, cardapioAtual, pedidosAtuais, resumoAtual] = await Promise.all([
                    obterSessaoAtual(tokenSalvo),
                    obterCardapioPublico(tokenSalvo),
                    obterMeusPedidos(tokenSalvo),
                    obterResumoComanda(tokenSalvo)
                ]);

                if (!ativo) return;

                if (resumoAtual?.requer_confirmacao_acompanhamento) {
                    limparSessao();
                    router.replace(`/m/${encodeURIComponent(qrToken)}`);
                    return;
                }

                setSessao(sessaoAtual);
                setCardapio(cardapioAtual);
                setPedidos(pedidosAtuais);
                setResumo(resumoAtual);

                const carrinhoSalvo = window.localStorage.getItem(carrinhoStorageKey(qrToken));
                if (carrinhoSalvo) {
                    try {
                        const parsed = JSON.parse(carrinhoSalvo);
                        if (parsed?.sessionToken === tokenSalvo && Array.isArray(parsed?.itens)) {
                            setCarrinho(parsed.itens);
                        } else {
                            window.localStorage.removeItem(carrinhoStorageKey(qrToken));
                        }
                    } catch {
                        window.localStorage.removeItem(carrinhoStorageKey(qrToken));
                    }
                }
            } catch (error) {
                if (!tratarErroSessao(error)) {
                    await Swal.fire({
                        title: "Não foi possível carregar o cardápio",
                        text: mensagemErro(error),
                        icon: "error"
                    });
                    router.replace(`/m/${encodeURIComponent(qrToken)}`);
                }
            } finally {
                if (ativo) setLoading(false);
            }
        }

        iniciar();

        return () => {
            ativo = false;
        };
    }, [limparSessao, qrToken, router, tratarErroSessao]);

    useEffect(() => {
        if (!sessionToken || sessaoEncerrada) return;

        const intervalo = setInterval(() => {
            carregarOperacional(sessionToken, true);
        }, 12000);

        return () => clearInterval(intervalo);
    }, [carregarOperacional, sessaoEncerrada, sessionToken]);

    useEffect(() => {
        if (!sessionToken || !qrToken) return;

        if (!carrinho.length) {
            window.localStorage.removeItem(carrinhoStorageKey(qrToken));
            return;
        }

        window.localStorage.setItem(
            carrinhoStorageKey(qrToken),
            JSON.stringify({ sessionToken, itens: carrinho })
        );
    }, [carrinho, qrToken, sessionToken]);

    const podePedir = Boolean(
        cardapio?.loja?.esta_aberta &&
        resumo?.pode_pedir !== false &&
        resumo?.status !== "Aguardando Pagamento"
    );

    const quantidadeCarrinho = carrinho.reduce((total, item) => total + item.quantidade, 0);
    const subtotal = carrinho.reduce((total, item) => total + item.preco * item.quantidade, 0);

    function alterarCarrinho(callback) {
        setIdempotencyKey("");
        setCarrinho(callback);
    }

    function adicionarProduto(produto) {
        if (!podePedir) return;

        alterarCarrinho(atual => {
            const existente = atual.find(item => item.produto_id === produto.id);

            if (existente) {
                return atual.map(item => item.produto_id === produto.id
                    ? { ...item, quantidade: Math.min(50, item.quantidade + 1) }
                    : item);
            }

            return [
                ...atual,
                {
                    produto_id: produto.id,
                    nome: produto.nome,
                    preco: Number(produto.preco),
                    quantidade: 1,
                    observacao: ""
                }
            ];
        });
    }

    function alterarQuantidade(produtoId, delta) {
        alterarCarrinho(atual => atual
            .map(item => item.produto_id === produtoId
                ? { ...item, quantidade: Math.max(0, Math.min(50, item.quantidade + delta)) }
                : item)
            .filter(item => item.quantidade > 0));
    }

    function alterarObservacao(produtoId, observacao) {
        alterarCarrinho(atual => atual.map(item => item.produto_id === produtoId
            ? { ...item, observacao: observacao.slice(0, 255) }
            : item));
    }

    function removerItem(produtoId) {
        alterarCarrinho(atual => atual.filter(item => item.produto_id !== produtoId));
    }

    async function confirmarPedido() {
        if (!carrinho.length || !sessionToken || enviando) return;

        const confirmacao = await Swal.fire({
            title: "Confirmar pedido?",
            html: `<strong>${quantidadeCarrinho} item(ns)</strong><br>Subtotal exibido: ${moeda.format(subtotal)}<br><small>Os preços serão recalculados pelo sistema antes da confirmação.</small>`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Confirmar pedido",
            cancelButtonText: "Revisar carrinho"
        });

        if (!confirmacao.isConfirmed) return;

        const chave = idempotencyKey || crypto.randomUUID();
        if (!idempotencyKey) setIdempotencyKey(chave);

        try {
            setEnviando(true);
            await criarPedidoPublico(sessionToken, {
                idempotency_key: chave,
                itens: carrinho.map(item => ({
                    produto_id: item.produto_id,
                    quantidade: item.quantidade,
                    observacao: item.observacao || null
                }))
            });

            setCarrinho([]);
            setIdempotencyKey("");
            await carregarOperacional(sessionToken);
            setAba("pedidos");

            await Swal.fire({
                title: "Pedido confirmado",
                text: "Seu pedido foi enviado para a cozinha.",
                icon: "success",
                timer: 1800,
                showConfirmButton: false
            });
        } catch (error) {
            if (!tratarErroSessao(error)) {
                await Swal.fire({
                    title: "Pedido não confirmado",
                    text: mensagemErro(error),
                    icon: "error"
                });
            }
        } finally {
            setEnviando(false);
        }
    }

    async function solicitarConta() {
        const confirmacao = await Swal.fire({
            title: "Solicitar a conta?",
            text: "Novos pedidos ficarão bloqueados após esta solicitação.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Solicitar conta",
            cancelButtonText: "Cancelar"
        });

        if (!confirmacao.isConfirmed) return;

        try {
            setEnviando(true);
            const novoResumo = await solicitarContaPublica(sessionToken);
            setResumo(novoResumo);
            setCarrinho([]);
            setIdempotencyKey("");

            await Swal.fire({
                title: "Conta solicitada",
                text: "Um funcionário dará continuidade ao atendimento.",
                icon: "success"
            });
        } catch (error) {
            if (!tratarErroSessao(error)) {
                await Swal.fire({ title: "Não foi possível solicitar", text: mensagemErro(error), icon: "error" });
            }
        } finally {
            setEnviando(false);
        }
    }

    if (loading) {
        return <main className={styles.centerState}><Loader2 className={styles.spinner} /> Carregando cardápio...</main>;
    }

    if (sessaoEncerrada) {
        return (
            <main className={styles.centerState}>
                <CheckCircle2 size={44} />
                <h1>Sessão encerrada</h1>
                <p>Escaneie novamente o QR Code da mesa para continuar.</p>
                <button type="button" onClick={() => router.replace("/")}>Voltar e ler QR Code</button>
            </main>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span>Mesa {sessao?.mesa?.numero || cardapio?.mesa?.numero}</span>
                    <strong>Olá, {sessao?.nome}</strong>
                </div>
                <button
                    type="button"
                    className={styles.refresh}
                    onClick={() => carregarOperacional(sessionToken, true)}
                    aria-label="Atualizar pedidos"
                >
                    <RefreshCw size={18} className={atualizando ? styles.spinner : ""} />
                </button>
            </header>

            {!cardapio?.loja?.esta_aberta && (
                <div className={styles.storeClosed}>
                    O estabelecimento está fechado para novos pedidos. Você ainda pode consultar o cardápio.
                </div>
            )}

            {resumo?.status === "Aguardando Pagamento" && (
                <div className={styles.accountRequested}>
                    Conta solicitada. Novos pedidos estão bloqueados enquanto o atendimento é finalizado.
                </div>
            )}

            <nav className={styles.tabs} aria-label="Navegação do atendimento">
                <button type="button" className={aba === "cardapio" ? styles.active : ""} onClick={() => setAba("cardapio")}>
                    <UtensilsCrossed size={17} /> Cardápio
                </button>
                <button type="button" className={aba === "pedidos" ? styles.active : ""} onClick={() => setAba("pedidos")}>
                    <ShoppingBag size={17} /> Meus pedidos
                    {pedidos.length > 0 && <b>{pedidos.length}</b>}
                </button>
                <button type="button" className={aba === "conta" ? styles.active : ""} onClick={() => setAba("conta")}>
                    <ReceiptText size={17} /> Conta
                </button>
            </nav>

            <main className={styles.content}>
                {aba === "cardapio" && (
                    <div className={styles.menuLayout}>
                        <section className={styles.menu}>
                            <div className={styles.sectionTitle}>
                                <div>
                                    <span>Escolha seus itens</span>
                                    <h1>Cardápio</h1>
                                </div>
                            </div>

                            {cardapio?.categorias?.map(categoria => (
                                <section className={styles.category} key={categoria.id}>
                                    <div className={styles.categoryTitle}>
                                        <div>
                                            <h2>{categoria.nome}</h2>
                                            {categoria.descricao && <p>{categoria.descricao}</p>}
                                        </div>
                                        <ChevronDown size={18} />
                                    </div>

                                    <div className={styles.products}>
                                        {categoria.produtos.map(produto => (
                                            <article className={styles.productCard} key={produto.id}>
                                                <div>
                                                    <h3>{produto.nome}</h3>
                                                    {produto.descricao && <p>{produto.descricao}</p>}
                                                    <strong>{moeda.format(Number(produto.preco))}</strong>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => adicionarProduto(produto)}
                                                    disabled={!podePedir}
                                                    aria-label={`Adicionar ${produto.nome}`}
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </section>

                        <aside className={styles.cart}>
                            <div className={styles.cartHeader}>
                                <div>
                                    <span>Seu carrinho</span>
                                    <strong>{quantidadeCarrinho} item(ns)</strong>
                                </div>
                                <ShoppingBag />
                            </div>

                            {!carrinho.length ? (
                                <div className={styles.emptyCart}>Adicione itens do cardápio para montar seu pedido.</div>
                            ) : (
                                <div className={styles.cartItems}>
                                    {carrinho.map(item => (
                                        <article className={styles.cartItem} key={item.produto_id}>
                                            <div className={styles.cartItemTop}>
                                                <div>
                                                    <strong>{item.nome}</strong>
                                                    <span>{moeda.format(item.preco * item.quantidade)}</span>
                                                </div>
                                                <button type="button" onClick={() => removerItem(item.produto_id)} aria-label={`Remover ${item.nome}`}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className={styles.quantityControl}>
                                                <button type="button" onClick={() => alterarQuantidade(item.produto_id, -1)}><Minus size={16} /></button>
                                                <span>{item.quantidade}</span>
                                                <button type="button" onClick={() => alterarQuantidade(item.produto_id, 1)}><Plus size={16} /></button>
                                            </div>

                                            <textarea
                                                value={item.observacao}
                                                onChange={event => alterarObservacao(item.produto_id, event.target.value)}
                                                placeholder="Observação do item (opcional)"
                                                maxLength={255}
                                            />
                                        </article>
                                    ))}
                                </div>
                            )}

                            <div className={styles.cartTotal}>
                                <span>Subtotal exibido</span>
                                <strong>{moeda.format(subtotal)}</strong>
                            </div>
                            <small>O valor definitivo será recalculado pelo sistema ao confirmar.</small>

                            <button
                                type="button"
                                className={styles.orderButton}
                                disabled={!carrinho.length || !podePedir || enviando}
                                onClick={confirmarPedido}
                            >
                                {enviando ? <Loader2 className={styles.spinner} size={19} /> : <CheckCircle2 size={19} />}
                                Confirmar pedido
                            </button>
                        </aside>
                    </div>
                )}

                {aba === "pedidos" && (
                    <section className={styles.ordersSection}>
                        <div className={styles.sectionTitle}>
                            <div>
                                <span>Acompanhamento</span>
                                <h1>Meus pedidos</h1>
                                <p>Aqui aparecem somente os pedidos feitos neste participante/dispositivo.</p>
                            </div>
                        </div>

                        {!pedidos.length ? (
                            <div className={styles.emptyState}>Você ainda não confirmou nenhum pedido.</div>
                        ) : (
                            <div className={styles.ordersList}>
                                {pedidos.map(pedido => (
                                    <article className={styles.orderCard} key={pedido.id}>
                                        <header>
                                            <div>
                                                <span>Pedido #{pedido.id}</span>
                                                <strong>{pedido.solicitante_nome}</strong>
                                            </div>
                                            <span className={`${styles.orderStatus} ${statusClass(pedido.status)}`}>
                                                {rotuloStatusPedido(pedido.status)}
                                            </span>
                                        </header>

                                        <div className={styles.orderItems}>
                                            {pedido.itens.map(item => (
                                                <div key={item.id}>
                                                    <span>{item.quantidade}x {item.produto_nome}</span>
                                                    <b>{moeda.format(item.preco_unitario * item.quantidade)}</b>
                                                    {item.observacao && <small>{item.observacao}</small>}
                                                </div>
                                            ))}
                                        </div>

                                        <footer>
                                            <span><Clock3 size={14} /> {new Date(pedido.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                                            <strong>{moeda.format(Number(pedido.total || 0))}</strong>
                                        </footer>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {aba === "conta" && (
                    <section className={styles.accountSection}>
                        <div className={styles.accountCard}>
                            <ReceiptText size={36} />
                            <span>Resumo da mesa</span>
                            <h1>{moeda.format(Number(resumo?.valor_total || 0))}</h1>
                            <p>
                                Este é o valor total atual da comanda da mesa. Por privacidade, os itens dos outros participantes não são detalhados aqui.
                            </p>

                            {resumo?.existe ? (
                                <div className={styles.accountMeta}>
                                    <span>Status</span>
                                    <strong>{resumo.status === "Aguardando Pagamento" ? "Conta solicitada" : resumo.status}</strong>
                                </div>
                            ) : (
                                <div className={styles.accountMeta}>
                                    <span>Status</span>
                                    <strong>Nenhum pedido confirmado</strong>
                                </div>
                            )}

                            <button
                                type="button"
                                className={styles.requestBill}
                                disabled={!resumo?.pode_solicitar_conta || enviando}
                                onClick={solicitarConta}
                            >
                                {enviando ? <Loader2 className={styles.spinner} size={19} /> : <ReceiptText size={19} />}
                                Solicitar conta
                            </button>
                        </div>
                    </section>
                )}
            </main>

            <button type="button" className={styles.backHome} onClick={() => router.push("/")}>
                <ArrowLeft size={15} /> Início
            </button>
        </div>
    );
}
