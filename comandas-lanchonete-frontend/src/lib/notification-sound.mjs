export function criarControleCooldownSom({ intervaloMs = 3000, agora = () => Date.now() } = {}) {
    let ultimoSomEm = null;

    return {
        tentar() {
            const momentoAtual = agora();
            if (ultimoSomEm !== null && momentoAtual - ultimoSomEm < intervaloMs) return false;

            ultimoSomEm = momentoAtual;
            return true;
        }
    };
}

export function tocarSomNotificacao() {
    if (typeof window === 'undefined') return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    osc.addEventListener?.('ended', () => ctx.close());
}
