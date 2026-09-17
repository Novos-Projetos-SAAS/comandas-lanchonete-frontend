export function montarPlacaQr({ numeroMesa, estabelecimento }) {
    const numero = String(numeroMesa ?? '').trim();
    const numeroArquivo = numero.padStart(2, '0');
    const nomeEstabelecimento = typeof estabelecimento === 'string' && estabelecimento.trim() ? estabelecimento.trim() : 'Estabelecimento';

    return {
        largura: 1200,
        altura: 1500,
        titulo: `Mesa ${numero}`,
        estabelecimento: nomeEstabelecimento,
        instrucao: 'Escaneie para acessar o cardápio',
        nomeArquivo: `mesa-${numeroArquivo}-placa-qrcode.png`,
        recorte: { x: 45, y: 45, largura: 1110, altura: 1410 },
        qr: { x: 240, y: 510, tamanho: 720 }
    };
}
