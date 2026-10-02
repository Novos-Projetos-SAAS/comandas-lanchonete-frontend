const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
fs.mkdirSync("../hig-evidence", { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    await page.route("**/api/**", route => {
      const url = route.request().url();
      const data = url.includes("/categorias/admin") ? { data: [{ id: 1, nome: "Lanches", descricao: "Lanches da casa", ativo: true }] } : url.includes("/auth/me")
        ? { usuario: { id: 1, nome: "Auditoria", cargo_id: 1, permissoes: [] } }
        : url.includes("/publico/estabelecimento")
          ? { estabelecimento: { nome: "Resenha", loja: { esta_aberta: true }, atendimento: { aceitando_pedidos: true } } }
          : { produtos: [], categorias: [], notificacoes: [], total_nao_lidas: 0, paginacao: { total_paginas: 1 } };
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success", data }) });
    });
    await page.goto("http://localhost:3100/login");
    await page.locator("#senha").waitFor();
    const eye = page.locator('button[title="Ver senha"]');
    assert.equal(await eye.evaluate(el => el.tabIndex), 0, "Mostrar senha precisa ser acessível por Tab");
    await page.locator("#senha").focus();
    await page.keyboard.press("Tab");
    assert.equal(await eye.evaluate(el => el === document.activeElement), true);
    for (const dark of [false, true]) {
      await page.evaluate(dark => document.documentElement.dataset.theme = dark ? "dark" : "light", dark);
      const result = await page.locator('button[type="submit"]').evaluate(el => {
        const css = getComputedStyle(el);
        return { background: css.backgroundColor, color: css.color };
      });
      console.log("Login " + (dark ? "dark" : "light") + ": " + JSON.stringify(result));
    }
    await page.screenshot({ path: "../hig-evidence/login-dark-mobile.png", fullPage: true });
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.locator('button[type="submit"]').evaluate(el => getComputedStyle(el).transitionDuration), "0s");

    await page.goto("http://localhost:3100/");
    const trigger = page.getByRole("button", { name: /Ler QR/i }).first();
    await trigger.waitFor();
    await trigger.click();
    const modal = page.getByRole("dialog", { name: "Leia o QR Code da mesa" });
    await modal.waitFor();
    assert.equal(await page.locator("[data-rht-toaster]").evaluate(el => !el.closest("[inert]")), true, "Anúncios de erro continuam acessíveis no modal");
    assert.equal(await modal.evaluate(el => el.contains(document.activeElement)), true, "Foco inicial no modal");
    await page.screenshot({ path: "../hig-evidence/qr-mobile.png", fullPage: true });
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      assert.equal(await modal.evaluate(el => el.contains(document.activeElement)), true, "Tab contido no modal");
    }
    await page.keyboard.press("Shift+Tab");
    assert.equal(await modal.evaluate(el => el.contains(document.activeElement)), true);
    await page.keyboard.press("Escape");
    await modal.waitFor({ state: "hidden" });
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true, "Foco devolvido ao acionador");
    assert.equal(await page.locator("[inert]").count(), 0, "Background liberado");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("http://localhost:3100/admin/categorias");
    const sort = page.getByRole("button", { name: "Ordenar por Nome" });
    await sort.waitFor();
    await sort.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => [...document.querySelectorAll("th")].some(el => el.textContent.includes("Nome") && el.getAttribute("aria-sort") === "ascending"));
    await page.keyboard.press("Space");
    await page.waitForFunction(() => [...document.querySelectorAll("th")].some(el => el.textContent.includes("Nome") && el.getAttribute("aria-sort") === "descending"));

    const quickSale = page.getByRole("button", { name: "Venda Rápida" });
    await quickSale.click();
    const saleDialog = page.getByRole("dialog", { name: "Venda Rápida", exact: true });
    await saleDialog.waitFor();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      assert.equal(await saleDialog.evaluate(el => el.contains(document.activeElement)), true);
    }
    await page.keyboard.press("Escape");
    await saleDialog.waitFor({ state: "hidden" });
    assert.equal(await quickSale.evaluate(el => el === document.activeElement), true);

    await page.goto("http://localhost:3100/admin/categorias/cadastro");
    await page.locator("#nome").waitFor();
    await page.getByRole("button", { name: "Cadastrar Categoria", exact: true }).click();
    assert.equal(await page.locator("#nome").getAttribute("aria-invalid"), "true");
    const errorId = await page.locator("#nome").getAttribute("aria-describedby");
    assert.equal(await page.locator("#" + errorId).getAttribute("role"), "alert");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => document.documentElement.style.fontSize = "200%");
    const errorStyle = await page.locator("#" + errorId).evaluate(el => ({ position: getComputedStyle(el).position, wrap: getComputedStyle(el).whiteSpace }));
    assert.equal(errorStyle.position, "static");
    assert.equal(errorStyle.wrap, "normal");
    assert.equal(await page.locator("#nome").evaluate(el => el.getBoundingClientRect().right <= innerWidth), true, "Campo ampliado cabe no viewport");
    assert.equal(await page.locator("#" + errorId).evaluate(el => el.getBoundingClientRect().right <= innerWidth), true, "Erro ampliado cabe no viewport");
    await page.screenshot({ path: "../hig-evidence/form-large-text-mobile.png", fullPage: true });

    const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await desktop.route("**/api/**", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success", data: { usuario: { id: 1, nome: "Auditoria", cargo_id: 1 } } }) }));
    await desktop.goto("http://localhost:3100/admin/mesas/cadastro");
    const save = desktop.locator('button[type="submit"]');
    await save.waitFor();
    assert.ok((await save.boundingBox()).height >= 44, "Altura do botão em desktop sem ponteiro coarse");
    await desktop.emulateMedia({ reducedMotion: "reduce" });
    await desktop.evaluate(() => document.documentElement.dataset.theme = "dark");
    await save.hover();
    assert.equal(await save.evaluate(el => getComputedStyle(el).color), "rgb(255, 255, 255)", "Texto do botão no hover escuro");
    assert.equal(await save.evaluate(el => getComputedStyle(el).backgroundColor), "rgb(173, 67, 12)");
    await desktop.close();
    console.log("PASS: login keyboard, reduced motion, QR/quick sale modal focus and restoration, keyboard table sort, field errors at 200% text");

  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
