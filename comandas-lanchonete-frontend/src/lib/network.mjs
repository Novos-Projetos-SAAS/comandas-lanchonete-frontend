export function resolverApiUrl(configurada, localizacao) {
    const apiAtual = configurada || 'http://localhost:3333/api';

    if (!localizacao?.hostname) {
        return apiAtual;
    }

    const hostRemoto = !['localhost', '127.0.0.1'].includes(localizacao.hostname);
    const apontaParaLocalhost = /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(apiAtual);

    if (hostRemoto && apontaParaLocalhost) {
        return `${localizacao.protocol || 'http:'}//${localizacao.hostname}:3333/api`;
    }

    return apiAtual;
}
