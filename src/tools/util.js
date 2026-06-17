/**
 * Small helpers shared by tool handlers: unwrap the server envelope, apply
 * client-side token-saving filters (mirrors the CLI's --top/--fields in
 * shumi-cli/src/lib/typedCmd.js), and shape the MCP result.
 */

/** Unwrap the `{ data, meta }` envelope to its payload, keeping `meta` aside. */
export function unwrap(env) {
  if (env && typeof env === 'object' && 'data' in env) return env.data;
  return env;
}

function pick(obj, keep) {
  const out = {};
  for (const k of keep) if (k in obj) out[k] = obj[k];
  return out;
}

/**
 * --top / --fields equivalents. `top` slices an array (or the first
 * array-valued field of an object); `fields` whitelists top-level keys.
 */
export function applyFilters(data, { top, fields } = {}) {
  let d = data;
  if (top && Array.isArray(d)) {
    d = d.slice(0, top);
  } else if (top && d && typeof d === 'object') {
    for (const k of Object.keys(d)) {
      if (Array.isArray(d[k])) {
        d = { ...d, [k]: d[k].slice(0, top) };
        break;
      }
    }
  }
  if (fields) {
    const keep = new Set(
      String(fields)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    if (Array.isArray(d)) {
      d = d.map((row) => (row && typeof row === 'object' ? pick(row, keep) : row));
    } else if (d && typeof d === 'object') {
      d = pick(d, keep);
    }
  }
  return d;
}

/**
 * Build an MCP CallToolResult with BOTH a text block (compact JSON, optionally
 * led by a one-line summary — for clients/models without structured support and
 * for backward compatibility) AND `structuredContent` (the typed envelope, for
 * clients that consume structured output). Compact, not pretty-printed, to save
 * tokens on every call. `structuredContent` is always an object so it validates
 * against the permissive shared output schema.
 */
export function result(data, { summary, meta } = {}) {
  const json = JSON.stringify(data);
  const text = summary ? `${summary}\n${json}` : json;
  const structuredContent = meta === undefined ? { data } : { data, meta };
  return { content: [{ type: 'text', text }], structuredContent };
}

/** Run a summarizer defensively — a formatting bug must never fail the tool. */
export function safe(fn, data) {
  try {
    return fn(data);
  } catch {
    return undefined;
  }
}
