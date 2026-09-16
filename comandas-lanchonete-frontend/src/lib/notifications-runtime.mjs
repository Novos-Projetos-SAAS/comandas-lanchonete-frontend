import { aplicarEventoNotificacao, contarBadge, mesclarNotificacoes } from './notifications.mjs';

const PREFERENCIAS_PADRAO = {
    notificacoes_ativas: true,
    mostrar_badge: true,
    mostrar_toast: true,
    tocar_som: true
};

function listaDaResposta(resposta) {
    return Array.isArray(resposta) ? resposta : resposta?.notificacoes || [];
}

async function listarTodoHistorico(service) {
    const limite = 100;
    const primeira = await service.listar({ pagina: 1, limite });
    const totalPaginas = Math.max(Number(primeira?.paginacao?.total_paginas || 1), 1);
    const paginas = [listaDaResposta(primeira)];
    for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
        paginas.push(listaDaResposta(await service.listar({ pagina, limite })));
    }
    return mesclarNotificacoes(...paginas);
}

function ajustarResumoPorMudanca(resumo, anteriores, posteriores) {
    const delta = contarBadge(posteriores) - contarBadge(anteriores);
    return {
        ...(resumo || {}),
        nao_lidas_pendentes: Math.max(0, Number(resumo?.nao_lidas_pendentes || 0) + delta)
    };
}

function idDoEvento(evento) {
    return evento?.id ?? evento?.notificacao_id;
}

export function criarRuntimeNotificacoes({
    socket,
    conectar,
    descartarSocket = () => {},
    service,
    aoEstado = () => {},
    aoAlerta = () => {},
    aoProntidao = () => {},
    aoDadosProntos = () => {},
    aoErro = () => {},
    aoErroTransporte = () => {}
}) {
    let ativo = false;
    let pronto = false;
    let primeiroConnect = true;
    let carregando = false;
    let trabalho = Promise.resolve();
    let bootstrapInicial = Promise.resolve();
    let sequencia = Promise.resolve();
    let geracao = 0;
    let estado = {
        notificacoes: [],
        resumo: { nao_lidas_pendentes: 0 },
        preferencias: PREFERENCIAS_PADRAO
    };
    const filaNovas = new Map();
    const novasDoProtocolo = new Map();
    const journal = [];
    const mutacoesDoProtocolo = [];
    let preferenciasDoSocket = null;
    let preferenciasDoProtocolo = null;

    const definirPronto = valor => {
        pronto = valor;
        if (ativo) aoProntidao(pronto);
    };

    const definirErro = erro => {
        if (ativo) aoErro(erro);
    };

    const publicar = proximo => {
        estado = proximo;
        if (ativo) aoEstado(estado);
    };

    const enfileirar = tarefa => {
        const geracaoDaExecucao = geracao;
        const proxima = sequencia
            .catch(() => {})
            .then(() => ativo && geracaoDaExecucao === geracao
                ? tarefa(geracaoDaExecucao)
                : undefined);
        sequencia = proxima;
        trabalho = proxima;
        return proxima;
    };

    const aplicarMutacaoNaLista = (notificacoes, evento) => {
        if (evento?.todas) {
            const porId = new Map((evento.notificacoes || []).map(relacao => [
                Number(relacao.notificacao_id ?? relacao.id),
                relacao.lida_em
            ]));
            return notificacoes.map(item => porId.has(Number(item.id))
                ? { ...item, lida_em: porId.get(Number(item.id)) }
                : item);
        }
        const id = idDoEvento(evento);
        if (id == null) return notificacoes;
        const tipo = evento.resolvida_em !== undefined ? 'resolvida' : 'lida';
        return aplicarEventoNotificacao(notificacoes, {
            tipo,
            id,
            lida_em: evento.lida_em,
            resolvida_em: evento.resolvida_em
        });
    };

    const receberNova = notificacao => {
        if (!notificacao?.id) return;
        if (!pronto || carregando) {
            filaNovas.set(Number(notificacao.id), notificacao);
            return;
        }
        const notificacoes = aplicarEventoNotificacao(estado.notificacoes, { tipo: 'nova', notificacao });
        publicar({
            ...estado,
            notificacoes,
            resumo: ajustarResumoPorMudanca(estado.resumo, estado.notificacoes, notificacoes)
        });
        aoAlerta(notificacao, estado.preferencias);
    };

    const receberLeitura = evento => {
        if (!pronto || carregando) {
            journal.push({ tipo: 'lida', evento });
            return;
        }
        const notificacoes = aplicarMutacaoNaLista(estado.notificacoes, evento);
        publicar({
            ...estado,
            notificacoes,
            resumo: ajustarResumoPorMudanca(estado.resumo, estado.notificacoes, notificacoes)
        });
    };

    const receberResolucao = evento => {
        if (!pronto || carregando) {
            journal.push({ tipo: 'resolvida', evento });
            return;
        }
        const notificacoes = aplicarMutacaoNaLista(estado.notificacoes, { ...evento, resolvida_em: evento?.resolvida_em });
        publicar({
            ...estado,
            notificacoes,
            resumo: ajustarResumoPorMudanca(estado.resumo, estado.notificacoes, notificacoes)
        });
    };

    const receberPreferencias = preferencias => {
        preferenciasDoSocket = { ...preferenciasDoSocket, ...preferencias };
        if (!pronto || carregando) return;
        publicar({ ...estado, preferencias: { ...PREFERENCIAS_PADRAO, ...estado.preferencias, ...preferenciasDoSocket } });
        preferenciasDoSocket = null;
    };

    const carregarFonteDeVerdade = async geracaoDaExecucao => {
        carregando = true;
        try {
            const [notificacoesHttp, resumoHttp, preferenciasHttp] = await Promise.all([
                listarTodoHistorico(service),
                service.resumo(),
                service.obterPreferencias()
            ]);
            if (!ativo || geracaoDaExecucao !== geracao) return false;
            const novas = [...filaNovas.values()];
            const mutacoes = journal.splice(0);
            const preferenciasMaisRecentes = preferenciasDoSocket;
            filaNovas.clear();
            preferenciasDoSocket = null;
            if (!pronto) {
                for (const nova of novas) novasDoProtocolo.set(Number(nova.id), nova);
                mutacoesDoProtocolo.push(...mutacoes);
                preferenciasDoProtocolo = { ...preferenciasDoProtocolo, ...preferenciasMaisRecentes };
            }
            let notificacoes = notificacoesHttp;
            let resumo = { ...(resumoHttp || {}) };
            for (const nova of pronto ? novas : [...novasDoProtocolo.values()]) {
                const anteriores = notificacoes;
                notificacoes = aplicarEventoNotificacao(notificacoes, { tipo: 'nova', notificacao: nova });
                resumo = ajustarResumoPorMudanca(resumo, anteriores, notificacoes);
            }
            for (const item of pronto ? mutacoes : mutacoesDoProtocolo) {
                const anteriores = notificacoes;
                notificacoes = aplicarMutacaoNaLista(notificacoes, item.evento);
                resumo = ajustarResumoPorMudanca(resumo, anteriores, notificacoes);
            }
            const preferencias = {
                ...PREFERENCIAS_PADRAO,
                ...preferenciasHttp,
                ...(pronto ? preferenciasMaisRecentes : preferenciasDoProtocolo)
            };
            publicar({
                notificacoes,
                resumo,
                preferencias
            });
            aoDadosProntos(true);
            return true;
        } finally {
            carregando = false;
        }
    };

    const limparAcumuladores = () => {
        filaNovas.clear();
        novasDoProtocolo.clear();
        journal.length = 0;
        preferenciasDoSocket = null;
        mutacoesDoProtocolo.length = 0;
        preferenciasDoProtocolo = null;
    };

    const concluirProtocoloSilencioso = async (geracaoDaExecucao, { aguardarBootstrap = false } = {}) => {
        try {
            if (aguardarBootstrap) {
                const bootstrapConcluido = await bootstrapInicial;
                if (!bootstrapConcluido) return false;
            }
            definirErro(null);
            const primeiraFonte = await carregarFonteDeVerdade(geracaoDaExecucao);
            if (!primeiraFonte || !ativo || geracaoDaExecucao !== geracao) return false;
            if (!aguardarBootstrap) {
                const segundaFonte = await carregarFonteDeVerdade(geracaoDaExecucao);
                if (!segundaFonte || !ativo || geracaoDaExecucao !== geracao) return false;
            }
            limparAcumuladores();
            definirPronto(true);
            return true;
        } catch (error) {
            if (ativo && geracaoDaExecucao === geracao) {
                definirErro(error);
                definirPronto(false);
            }
            return false;
        }
    };

    const aoConectar = () => {
        if (!ativo) return;
        aoErroTransporte(null);
        if (primeiroConnect) {
            primeiroConnect = false;
            definirPronto(false);
            enfileirar(geracaoDaExecucao => concluirProtocoloSilencioso(geracaoDaExecucao, { aguardarBootstrap: true }))
                .catch(() => {})
            return;
        }
        definirPronto(false);
        enfileirar(geracaoDaExecucao => concluirProtocoloSilencioso(geracaoDaExecucao))
            .catch(() => {});
    };

    const aoFalharConexao = erro => {
        if (!ativo) return;
        definirPronto(false);
        aoErroTransporte(erro);
    };

    return {
        iniciar() {
            if (ativo) return;
            ativo = true;
            definirPronto(false);
            aoDadosProntos(false);
            socket.on('notificacao_nova', receberNova);
            socket.on('notificacao_lida', receberLeitura);
            socket.on('notificacao_resolvida', receberResolucao);
            socket.on('notificacoes_preferencias_atualizadas', receberPreferencias);
            socket.on('connect', aoConectar);
            socket.on('connect_error', aoFalharConexao);
            bootstrapInicial = enfileirar(carregarFonteDeVerdade).catch(error => {
                definirErro(error);
                definirPronto(false);
                aoDadosProntos(false);
                return false;
            });
            conectar(socket);
            if (socket.conectado || socket.connected) aoConectar();
        },

        parar() {
            if (!ativo) return;
            ativo = false;
            geracao += 1;
            pronto = false;
            socket.off('notificacao_nova', receberNova);
            socket.off('notificacao_lida', receberLeitura);
            socket.off('notificacao_resolvida', receberResolucao);
            socket.off('notificacoes_preferencias_atualizadas', receberPreferencias);
            socket.off('connect', aoConectar);
            socket.off('connect_error', aoFalharConexao);
            descartarSocket();
        },

        prontoParaAlertar() {
            return pronto;
        },

        quandoOcioso() {
            return trabalho.catch(() => {});
        },

        atualizarEstadoParcial(parcial) {
            estado = { ...estado, ...parcial };
        },

        recarregarSilenciosamente() {
            return enfileirar(carregarFonteDeVerdade).catch(() => {});
        },

        tentarNovamente() {
            definirErro(null);
            definirPronto(false);
            const conectado = Boolean(socket.connected || socket.conectado);
            const tentativa = enfileirar(geracaoDaExecucao => conectado
                ? concluirProtocoloSilencioso(geracaoDaExecucao)
                : carregarFonteDeVerdade(geracaoDaExecucao));
            if (!conectado) bootstrapInicial = tentativa;
            return tentativa
                .then(concluido => {
                    if (concluido && conectado) primeiroConnect = false;
                    return concluido;
                })
                .catch(() => false);
        }
    };
}
