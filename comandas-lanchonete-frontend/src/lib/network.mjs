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

export function resolverApiUrl(configurada, localizacao) {
    const apiAtual = configurada || 'http://localhost:3001/api';

    if (!localizacao?.hostname) {
        return apiAtual;
    }

    try {
        const url = new URL(apiAtual);
        const hostPagina = localizacao.hostname;
        const paginaNaLan = ipv4Privado(hostPagina);
        const apiLocalOuLan = ['localhost', '127.0.0.1'].includes(url.hostname) || ipv4Privado(url.hostname);

        if (paginaNaLan && apiLocalOuLan && url.hostname !== hostPagina) {
            url.hostname = hostPagina;
            return url.toString().replace(/\/$/, '');
        }

        return apiAtual;
    } catch {
        return apiAtual;
    }
}
