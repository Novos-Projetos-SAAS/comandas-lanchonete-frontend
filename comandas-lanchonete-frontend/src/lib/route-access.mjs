const ROTAS_PUBLICAS_EXATAS = new Set([
    '/',
    '/login',
    '/auth/login',
    '/forgot',
    '/auth/forgot',
    '/reset',
    '/auth/reset',
    '/cadastro-restrito',
    '/cardapio',
    '/esqueci-senha'
]);

const PREFIXOS_PUBLICOS = [
    '/m/',
    '/auth/reset/'
];

export function rotaPublica(pathname = '') {
    const caminho = String(pathname || '').split('?')[0] || '/';

    if (ROTAS_PUBLICAS_EXATAS.has(caminho)) {
        return true;
    }

    return PREFIXOS_PUBLICOS.some(prefixo => caminho.startsWith(prefixo));
}
