import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const paginaUrl = new URL('../app/admin/notificacoes/page.jsx', import.meta.url);
const cssUrl = new URL('../app/admin/notificacoes/page.module.css', import.meta.url);

test('central de notificacoes segue a largura e o titulo padrao do admin', () => {
    const pagina = fs.readFileSync(paginaUrl, 'utf8');
    const css = fs.readFileSync(cssUrl, 'utf8');

    assert.match(pagina, /className=\{styles\.pageTitle\}/);
    assert.match(css, /\.container\s*\{[^}]*width:\s*100%\s*;[^}]*padding:\s*0\s*;/s);
    assert.doesNotMatch(css, /max-width:\s*1280px\s*;/);
    assert.match(css, /\.pageTitle\s*\{[^}]*font-size:\s*1\.75rem\s*;[^}]*font-weight:\s*700\s*;/s);
});

test('notificacoes nao lidas usam uma cor de fundo por tipo', () => {
    const pagina = fs.readFileSync(paginaUrl, 'utf8');
    const css = fs.readFileSync(cssUrl, 'utf8');

    assert.match(pagina, /data-type=\{notificacao\.tipo\}/);
    assert.match(css, /\.unread\[data-type="NOVO_PEDIDO"\]/);
    assert.match(css, /\.unread\[data-type="PEDIDO_PRONTO"\]/);
    assert.match(css, /\.unread\[data-type="CONTA_SOLICITADA"\]/);
    assert.match(css, /\.notification\s*\{[^}]*background:\s*transparent\s*;/s);
});
