export function resolverApiUrl(configurada, localizacao) {
    const apiAtual = configurada || 'http://localhost:3001/api';

    if (!localizacao?.hostname) {
        return apiAtual;
    }

    const hostRemoto = !['localhost', '127.0.0.1'].includes(localizacao.hostname);

    if (!hostRemoto) {
        return apiAtual;
    }

    try {
        const url = new URL(apiAtual);
        const apontaParaLocalhost = ['localhost', '127.0.0.1'].includes(url.hostname);

        if (!apontaParaLocalhost) {
            return apiAtual;
        }

        url.hostname = localizacao.hostname;
        return url.toString().replace(/\/$/, '');
    } catch {
        return apiAtual;
    }
}
