import test from 'node:test';
import assert from 'node:assert/strict';
import { resolverApiUrl } from './network.mjs';

test('usa NEXT_PUBLIC_API_URL quando configurada', () => {
    assert.equal(
        resolverApiUrl('https://api.exemplo.com/api'),
        'https://api.exemplo.com/api'
    );
});

test('usa /api como fallback same-origin sem IP fixo', () => {
    assert.equal(resolverApiUrl(undefined), '/api');
    assert.equal(resolverApiUrl(''), '/api');
});
