const TOKEN_MIN_LENGTH = 8;
const TOKEN_MAX_LENGTH = 255;

function tokenValido(token) {
    return typeof token === 'string' &&
        token.length >= TOKEN_MIN_LENGTH &&
        token.length <= TOKEN_MAX_LENGTH &&
        !/\s/.test(token);
}

function uuidComRandomValues(cryptoImpl) {
    const bytes = new Uint8Array(16);
    cryptoImpl.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0'));

    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

export function gerarIdempotencyKey(cryptoImpl = globalThis.crypto) {
    if (typeof cryptoImpl?.randomUUID === 'function') {
        return cryptoImpl.randomUUID();
    }

    if (typeof cryptoImpl?.getRandomValues === 'function') {
        return uuidComRandomValues(cryptoImpl);
    }

    return `pedido-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

export function extrairQrToken(valor) {
    if (typeof valor !== 'string' || !valor.trim()) return null;

    const texto = valor.trim();

    try {
        const url = new URL(texto, 'https://qr.local');
        const tokenQuery = url.searchParams.get('token')?.trim();

        if (tokenValido(tokenQuery)) {
            return tokenQuery;
        }

        const matchMesa = url.pathname.match(/^\/m\/([^/]+)\/?$/i);

        if (matchMesa) {
            const tokenPath = decodeURIComponent(matchMesa[1]).trim();
            return tokenValido(tokenPath) ? tokenPath : null;
        }
    } catch {
        return null;
    }

    return null;
}

export function rotuloStatusPedido(status) {
    const rotulos = {
        Pendente: 'Confirmado',
        Preparando: 'Em preparo',
        Pronto: 'Pronto',
        Entregue: 'Entregue'
    };

    return rotulos[status] || status || 'Confirmado';
}
