import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const paginaUrl = new URL('../app/admin/comandas/[id]/page.jsx', import.meta.url);
const layoutCssUrl = new URL('../app/admin/comandas/[id]/page.layout.module.css', import.meta.url);

test('detalhes da comanda usam a mesma largura e padding de Alimentos e Categorias', () => {
    const pagina = fs.readFileSync(paginaUrl, 'utf8');
    const css = fs.existsSync(layoutCssUrl) ? fs.readFileSync(layoutCssUrl, 'utf8') : '';

    assert.match(pagina, /page\.layout\.module\.css/);
    assert.match(pagina, /className=\{styles\.comandaLayout\}/);
    assert.match(css, /max-width:\s*1400px\s*;/);
    assert.match(css, /padding:\s*2rem\s*;/);
});
