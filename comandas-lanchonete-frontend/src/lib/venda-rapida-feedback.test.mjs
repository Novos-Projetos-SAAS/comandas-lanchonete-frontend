import test from 'node:test';
import assert from 'node:assert/strict';
import {
    agendarFeedbackVendaConcluida,
    criarOpcoesFeedbackVendaConcluida
} from './venda-rapida-feedback.mjs';

test('feedback de venda concluida aguarda o modal fechar e some em 2 segundos', () => {
    const chamadas = [];
    let tarefaAgendada = null;

    agendarFeedbackVendaConcluida({
        mostrar: opcoes => chamadas.push(opcoes),
        agendar: (tarefa, atraso) => {
            tarefaAgendada = tarefa;
            chamadas.push({ atraso });
        }
    });

    assert.deepEqual(chamadas, [{ atraso: 100 }]);
    tarefaAgendada();
    assert.equal(chamadas[1].timer, 2000);
    assert.equal(chamadas[1].showConfirmButton, false);
});

test('feedback permite mensagem html e mantém fechamento automático', () => {
    const opcoes = criarOpcoesFeedbackVendaConcluida({ html: '<b>R$ 10,00</b>' });

    assert.equal(opcoes.html, '<b>R$ 10,00</b>');
    assert.equal(opcoes.timer, 2000);
    assert.equal(opcoes.showConfirmButton, false);
});
