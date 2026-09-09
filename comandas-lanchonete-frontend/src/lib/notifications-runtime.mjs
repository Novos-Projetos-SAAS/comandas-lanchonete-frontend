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
    aoProntidao = () => {}
}) {
    let ativo = false;
    let pronto = false;
    let primeiroConnect = true;
    let carregando = false;
    let trabalho = Promise.resolve();
    let bootstrapInicial = Promise.resolve();
    let estado = {
        notificacoes: [],
        resumo: { nao_lidas_pendentes: 0 },
        preferencias: PREFERENCIAS_PADRAO
    };
    const filaNovas = new Map();
    const journal = [];
    let preferenciasDoSocket = null;

    const definirPronto = valor => {
        pronto = valor;
        if (ativo) aoProntidao(pronto);
    };

    const publicar = proximo => {
        estado = proximo;
        if (ativo) aoEstado(estado);
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
        if (carregando) {
            journal.push({ tipo: 'lida', evento });
            return;
        }
        const notificacoes = aplicarMutacaoNaLista(estado.notificacoes, evento);
        publicar({ ...estado, notificacoes, resumo: { ...estado.resumo, nao_lidas_pendentes: contarBadge(notificacoes) } });
    };

    const receberResolucao = evento => {
        if (carregando) {
            journal.push({ tipo: 'resolvida', evento });
            return;
        }
        const notificacoes = aplicarMutacaoNaLista(estado.notificacoes, { ...evento, resolvida_em: evento?.resolvida_em });
        publicar({ ...estado, notificacoes, resumo: { ...estado.resumo, nao_lidas_pendentes: contarBadge(notificacoes) } });
    };

    const receberPreferencias = preferencias => {
        preferenciasDoSocket = { ...preferenciasDoSocket, ...preferencias };
        if (carregando) return;
        publicar({ ...estado, preferencias: { ...PREFERENCIAS_PADRAO, ...estado.preferencias, ...preferenciasDoSocket } });
        preferenciasDoSocket = null;
    };

    const carregarFonteDeVerdade = async () => {
        carregando = true;
        try {
            const [listaResposta, resumo, preferenciasHttp] = await Promise.all([
                service.listar({ pagina: 1, limite: 50 }),
                service.resumo(),
                service.obterPreferencias()
            ]);
            let notificacoes = mesclarNotificacoes(
                estado.notificacoes,
                listaDaResposta(listaResposta),
                [...filaNovas.values()]
            );
            for (const item of journal) {
                notificacoes = aplicarMutacaoNaLista(notificacoes, item.evento);
            }
            const preferencias = {
                ...PREFERENCIAS_PADRAO,
                ...preferenciasHttp,
                ...preferenciasDoSocket
            };
            publicar({
                notificacoes,
                resumo: resumo || { nao_lidas_pendentes: contarBadge(notificacoes) },
                preferencias
            });
        } finally {
            carregando = false;
        }
    };

    const executarProtocoloCompleto = async () => {
        definirPronto(false);
        await carregarFonteDeVerdade();
        await carregarFonteDeVerdade();
        filaNovas.clear();
        journal.length = 0;
        preferenciasDoSocket = null;
        definirPronto(true);
    };

    const aoConectar = () => {
        if (!ativo) return;
        if (primeiroConnect) {
            primeiroConnect = false;
            trabalho = bootstrapInicial
                .then(() => carregarFonteDeVerdade())
                .then(() => {
                    filaNovas.clear();
                    journal.length = 0;
                    preferenciasDoSocket = null;
                    definirPronto(true);
                })
                .catch(() => { definirPronto(false); });
            return;
        }
        trabalho = executarProtocoloCompleto().catch(() => { definirPronto(false); });
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
            conectar(socket);
            bootstrapInicial = carregarFonteDeVerdade().catch(error => {
                definirPronto(false);
                throw error;
            });
            if (socket.conectado || socket.connected) aoConectar();
        },

        parar() {
            if (!ativo) return;
            ativo = false;
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
            trabalho = carregarFonteDeVerdade().catch(() => {});
            return trabalho;
        }
    };
}
