export function resolverApiUrl(configurada) {
    const apiUrl = String(configurada || '').trim();
    return apiUrl || '/api';
}
