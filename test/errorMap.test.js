import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../src/http-client.js';
import { errorPayload, toMcpError } from '../src/errorMap.js';

test('401 maps to AUTH_REQUIRED with a login hint', () => {
  const { error } = errorPayload(new ApiError(401, { error: { code: 'AUTH_REQUIRED', message: 'nope' } }));
  assert.equal(error.code, 'AUTH_REQUIRED');
  assert.match(error.hint, /SHUMI_TOKEN/);
});

test('429 maps to RATE_LIMITED with an upgrade hint', () => {
  const { error } = errorPayload(new ApiError(429, {}));
  assert.equal(error.code, 'RATE_LIMITED');
  assert.match(error.hint, /Upgrade|fund/i);
});

test('402 maps to PAYMENT_REQUIRED', () => {
  const { error } = errorPayload(new ApiError(402, {}));
  assert.equal(error.code, 'PAYMENT_REQUIRED');
});

test('server-provided hint is preserved verbatim', () => {
  const { error } = errorPayload(new ApiError(403, { error: { code: 'AUTH_INVALID', message: 'bad key', hint: 'rotate it' } }));
  assert.equal(error.code, 'AUTH_INVALID');
  assert.equal(error.hint, 'rotate it');
});

test('500 maps to UPSTREAM_5XX', () => {
  const { error } = errorPayload(new ApiError(503, {}));
  assert.equal(error.code, 'UPSTREAM_5XX');
});

test('network error (status 0) maps to NETWORK', () => {
  const { error } = errorPayload(new ApiError(0, { error: { code: 'NETWORK', message: 'down' } }));
  assert.equal(error.code, 'NETWORK');
});

test('toMcpError returns an isError result with JSON text', () => {
  const r = toMcpError(new ApiError(429, {}));
  assert.equal(r.isError, true);
  assert.equal(r.content[0].type, 'text');
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.error.code, 'RATE_LIMITED');
});
