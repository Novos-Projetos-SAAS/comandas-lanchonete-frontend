export function criarAuthorizationBearer(token) {
    const valor = typeof token === 'string' ? token.trim() : '';
    return valor ? `Bearer ${valor}` : null;
}
