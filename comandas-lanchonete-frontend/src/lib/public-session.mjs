const TOKEN_MIN_LENGTH = 8;
const TOKEN_MAX_LENGTH = 255;

function tokenValido(token) {
    return typeof token === 'string' &&
        token.length >= TOKEN_MIN_LENGTH &&
        token.length <= TOKEN_MAX_LENGTH &&
        !/\s/.test(token);
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

function chaveToken(qrToken) {
    if (typeof qrToken !== 'string' || !qrToken.trim()) {
        throw new Error('QR Token inválido para armazenamento local.');
    }

    return encodeURIComponent(qrToken.trim());
}

export function sessaoStorageKey(qrToken) {
    return `lanchonete:publico:${chaveToken(qrToken)}:sessao`;
}

export function carrinhoStorageKey(qrToken) {
    return `lanchonete:publico:${chaveToken(qrToken)}:carrinho`;
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
