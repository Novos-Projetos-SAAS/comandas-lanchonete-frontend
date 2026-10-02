import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const light = css.match(/:root\s*\{([^}]+)\}/)[1];
const dark = css.match(/\[data-theme="dark"\]\s*\{([^}]+)\}/)[1];
function token(block, name, fallback) {
    return block.match(new RegExp("--" + name + ":\\s*(#[0-9a-f]{6})", "i"))?.[1] || fallback;
}
function luminance(hex) {
    const rgb = hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255)
        .map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}
function contrast(a, b) {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + .05) / (low + .05);
}
for (const [theme, block] of [["light", light], ["dark", light + dark]]) {
    // Last declaration wins, as in the CSS cascade.
    const get = (name, fallback) => token(block.split("\n").reverse().join("\n"), name, fallback);
    test(theme + ": primary actions and normal accent text meet 4.5:1", () => {
        const orange = get("brand-orange");
        const background = get("bg-surface");
        const button = get("action-bg", orange);
        const ratioButton = contrast("#ffffff", button);
        const ratioText = contrast(orange, background);
        assert.ok(ratioButton >= 4.5, "white/action contrast: " + ratioButton.toFixed(2));
        assert.ok(ratioText >= 4.5, "accent/surface contrast: " + ratioText.toFixed(2));
    });
}

test("command and table status labels meet 4.5:1 against their colored strips", () => {
    for (const file of ["../components/comandas/ComandaCard/index.module.css", "../app/admin/mesas/MesasClient.module.css"]) {
        const source = readFileSync(new URL(file, import.meta.url), "utf8");
        for (const match of source.matchAll(/--(?:status|mesa)-(?:open|waiting|paid|canceled|default|free|occupied|closing|attention|inactive)\s*:\s*(#[0-9a-f]{6})/gi)) {
            const ratio = contrast("#ffffff", match[1]);
            assert.ok(ratio >= 4.5, file + " " + match[0] + ": " + ratio.toFixed(2));
        }
    }
});
test("SweetAlert action token remains readable in dark mode", () => {
    const source = readFileSync(new URL("../components/modals/vendaRapida/index.jsx", import.meta.url), "utf8");
    const name = source.match(/confirmButtonColor: "var\(--([a-z-]+)\)"/)?.[1];
    const color = token(dark, name, token(light, name));
    assert.ok(contrast("#ffffff", color) >= 4.5);
});
