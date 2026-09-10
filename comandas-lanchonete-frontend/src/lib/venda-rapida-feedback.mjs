export const ATRASO_FEEDBACK_VENDA_RAPIDA_MS = 100;
export const DURACAO_FEEDBACK_VENDA_RAPIDA_MS = 2000;

export function criarOpcoesFeedbackVendaConcluida(opcoes = {}) {
    const {
        html,
        text = 'A venda rápida foi registrada com sucesso.',
        didOpen
    } = opcoes;

    return {
        icon: 'success',
        title: 'Venda concluída',
        ...(html ? { html } : { text }),
        timer: DURACAO_FEEDBACK_VENDA_RAPIDA_MS,
        showConfirmButton: false,
        timerProgressBar: true,
        ...(didOpen ? { didOpen } : {})
    };
}

export function agendarFeedbackVendaConcluida({ mostrar, opcoes = {}, agendar = setTimeout }) {
    return agendar(
        () => mostrar(criarOpcoesFeedbackVendaConcluida(opcoes)),
        ATRASO_FEEDBACK_VENDA_RAPIDA_MS
    );
}
