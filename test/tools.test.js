import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TYPED_TOOLS, toolCatalog } from '../src/tools/index.js';
import { applyFilters, unwrap } from '../src/tools/util.js';

function byName(name) {
  const def = TYPED_TOOLS.find((d) => d.name === name);
  assert.ok(def, `tool ${name} exists`);
  return def;
}

test('lookup_coin routes by identifier kind', () => {
  const t = byName('lookup_coin');
  assert.deepEqual(t.build({ by: 'symbol', identifier: 'BTC' }), { route: 'coin/lookup', query: { symbol: 'BTC' } });
  assert.deepEqual(t.build({ by: 'name', identifier: 'Bitcoin' }), { route: 'coin/by-name/Bitcoin' });
  assert.deepEqual(t.build({ by: 'id', identifier: 'bitcoin' }), { route: 'coin/by-id/bitcoin' });
  assert.deepEqual(t.build({ by: 'contract', identifier: '0xabc', chain: 'ethereum' }), {
    route: 'coin/by-contract/0xabc',
    query: { chain: 'ethereum' },
  });
});

test('lookup_coin requires chain for contract lookups', () => {
  const t = byName('lookup_coin');
  assert.throws(() => t.build({ by: 'contract', identifier: '0xabc' }), /chain is required/);
});

test('scan_trends maps state -> action', () => {
  const t = byName('scan_trends');
  assert.deepEqual(t.build({ state: 'aligned', limit: 5 }), { route: 'trends', query: { action: 'aligned', interval: undefined, limit: 5 } });
});

test('get_regime switches to history when symbol provided', () => {
  const t = byName('get_regime');
  assert.deepEqual(t.build({ view: 'active' }), { route: 'regime', query: { action: 'active' } });
  assert.deepEqual(t.build({ view: 'active', symbol: 'ETH' }), { route: 'regime', query: { action: 'history', symbol: 'ETH' } });
});

test('get_pair_suggestions requires both tokens for signal mode', () => {
  const t = byName('get_pair_suggestions');
  assert.throws(() => t.build({ mode: 'signal', token_a: 'ETH' }), /token_a and token_b/);
  assert.deepEqual(t.build({ mode: 'signal', token_a: 'ETH', token_b: 'SOL' }), {
    route: 'pairs',
    query: { action: 'signal', tokenA: 'ETH', tokenB: 'SOL' },
  });
});

test('get_category builds nested route', () => {
  const t = byName('get_category');
  assert.deepEqual(t.build({ name: 'Layer 2', view: 'coins' }), { route: 'category/coins/Layer%202' });
});

test('every typed tool has a description and a build fn', () => {
  for (const t of TYPED_TOOLS) {
    assert.ok(typeof t.description === 'string' && t.description.length > 10, `${t.name} description`);
    assert.equal(typeof t.build, 'function', `${t.name} build`);
  }
});

test('unwrap pulls the data field out of the envelope', () => {
  assert.deepEqual(unwrap({ data: { a: 1 }, meta: {} }), { a: 1 });
  assert.deepEqual(unwrap({ a: 1 }), { a: 1 });
});

test('applyFilters: top slices arrays and fields whitelists keys', () => {
  assert.deepEqual(applyFilters([1, 2, 3, 4], { top: 2 }), [1, 2]);
  assert.deepEqual(applyFilters({ items: [1, 2, 3] }, { top: 2 }), { items: [1, 2] });
  assert.deepEqual(applyFilters([{ a: 1, b: 2 }], { fields: 'a' }), [{ a: 1 }]);
});

test('toolCatalog lists coin risk and the nlp tools', () => {
  const c = toolCatalog();
  assert.ok(c.typed.some((t) => t.name === 'get_coin_risk'));
  assert.ok(c.nlp.some((t) => t.name === 'ask_shumi'));
});
