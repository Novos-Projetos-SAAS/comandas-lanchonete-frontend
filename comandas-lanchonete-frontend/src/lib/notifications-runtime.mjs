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
    aoErro = () => {}
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
            const lidaEm = evento.lida_em || new Date().toISOString();
            return notificacoes.map(item => item.lida_em ? item : { ...item, lida_em: lidaEm });
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
        publicar({ ...estado, notificacoes, resumo: { ...estado.resumo, nao_lidas_pendentes: contarBadge(notificacoes) } });
        aoAlerta(notificacao, estado.preferencias);
    };

    const receberLeitura = evento => {
        if (!pronto || carregando) {
            journal.push({ tipo: 'lida', evento });
            return;
        }
        const notificacoes = aplicarMutacaoNaLista(estado.notificacoes, evento);
        publicar({ ...estado, notificacoes, resumo: { ...estado.resumo, nao_lidas_pendentes: contarBadge(notificacoes) } });
    };

    const receberResolucao = evento => {
        if (!pronto || carregando) {
            journal.push({ tipo: 'resolvida', evento });
            return;
        }
        const notificacoes = aplicarMutacaoNaLista(estado.notificacoes, { ...evento, resolvida_em: evento?.resolvida_em });
        publicar({ ...estado, notificacoes, resumo: { ...estado.resumo, nao_lidas_pendentes: contarBadge(notificacoes) } });
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
            const [listaResposta, resumo, preferenciasHttp] = await Promise.all([
                service.listar({ pagina: 1, limite: 50 }),
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
            let notificacoes = mesclarNotificacoes(
                listaDaResposta(listaResposta),
                pronto ? novas : [...novasDoProtocolo.values()]
            );
            for (const item of pronto ? mutacoes : mutacoesDoProtocolo) {
                notificacoes = aplicarMutacaoNaLista(notificacoes, item.evento);
            }
            const preferencias = {
                ...PREFERENCIAS_PADRAO,
                ...preferenciasHttp,
                ...(pronto ? preferenciasMaisRecentes : preferenciasDoProtocolo)
            };
            publicar({
                notificacoes,
                resumo: { ...(resumo || {}), nao_lidas_pendentes: contarBadge(notificacoes) },
                preferencias
            });
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

    return {
        iniciar() {
            if (ativo) return;
            ativo = true;
            definirPronto(false);
            socket.on('notificacao_nova', receberNova);
            socket.on('notificacao_lida', receberLeitura);
            socket.on('notificacao_resolvida', receberResolucao);
            socket.on('notificacoes_preferencias_atualizadas', receberPreferencias);
            socket.on('connect', aoConectar);
            bootstrapInicial = enfileirar(carregarFonteDeVerdade).catch(error => {
                definirErro(error);
                definirPronto(false);
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
            return enfileirar(geracaoDaExecucao => concluirProtocoloSilencioso(geracaoDaExecucao))
                .catch(() => false);
        }
    };
}
