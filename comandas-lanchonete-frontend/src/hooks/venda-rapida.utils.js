export function parseMoney(valor) {
    const texto = String(valor ?? "").trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : 0;
}

export function paraCentavos(valor) {
    return Math.round(parseMoney(valor) * 100);
}

export function deCentavos(valor) {
    return Number((Number(valor || 0) / 100).toFixed(2));
}

export function formatarValorInput(centavos) {
    return deCentavos(centavos).toFixed(2).replace(".", ",");
}
