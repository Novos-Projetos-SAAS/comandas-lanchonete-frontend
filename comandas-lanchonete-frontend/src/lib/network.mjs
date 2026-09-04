function ipv4Privado(hostname = '') {
    const partes = String(hostname).split('.').map(Number);

    if (partes.length !== 4 || partes.some(parte => !Number.isInteger(parte) || parte < 0 || parte > 255)) {
        return false;
    }

    const [a, b] = partes;

    return a === 10 ||
        (a === 192 && b === 168) ||
        (a === 172 && b >= 16 && b <= 31);
}

function hostLocalOuPrivado(hostname = '') {
    return ['localhost', '127.0.0.1'].includes(hostname) || ipv4Privado(hostname);
}

export function resolverApiUrl(configurada, localizacao) {
    const apiAtual = configurada || 'http://localhost:3001/api';

    if (String(apiAtual).startsWith('/')) {
        return apiAtual;
    }

    if (!localizacao?.hostname) {
        return apiAtual;
    }

    try {
        const url = new URL(apiAtual);
        const hostPagina = localizacao.hostname;
        const paginaNaLan = ipv4Privado(hostPagina);
        const apiLocalOuLan = hostLocalOuPrivado(url.hostname);

        if (
            localizacao.protocol === 'https:' &&
            url.protocol === 'http:' &&
            apiLocalOuLan
        ) {
            return '/api';
        }

        if (paginaNaLan && apiLocalOuLan && url.hostname !== hostPagina) {
            url.hostname = hostPagina;
            return url.toString().replace(/\/$/, '');
        }

        return apiAtual;
    } catch {
        return apiAtual;
    }
}
