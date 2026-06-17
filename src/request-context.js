import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request context, used only by the remote Streamable HTTP transport so
 * each request's own bearer token flows through to the upstream coinrotator-ai
 * call. For stdio there is no store, so token resolution falls back to env /
 * config file (see config.js getToken).
 */
const storage = new AsyncLocalStorage();

export function runWithRequest(ctx, fn) {
  return storage.run(ctx, fn);
}

export function currentRequest() {
  return storage.getStore() || null;
}
