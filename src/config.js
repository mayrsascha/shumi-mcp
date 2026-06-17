import { homedir, hostname, userInfo, platform, arch } from 'node:os';
import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { currentRequest } from './request-context.js';

/**
 * Configuration for the Shumi MCP server. Intentionally mirrors the shumi CLI
 * (`shumi-cli/src/lib/config.js`) so the MCP wrapper authenticates and routes
 * exactly like the CLI — same base URL, same token resolution, same device id.
 *
 * The MCP server is a THIN wrapper over the coinrotator-ai `/api/cli/*` surface;
 * all gating/tiers/x402 live server-side, so there is no billing logic here.
 */

// Data/CLI surface talks to coinrotator-ai (Fastify on Render). Override with
// SHUMI_API_URL for preview deploys / self-hosting.
const DEFAULT_API_URL = 'https://coinrotator-ai.onrender.com/api/cli';
const API_URL = (process.env.SHUMI_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

// Where users mint shumi_sk_* keys (Dynamic.xyz wallet auth -> JWT -> keys).
const KEYS_URL = (process.env.SHUMI_KEYS_URL || 'https://coinrotator.app/api/keys').replace(/\/$/, '');

const CONFIG_FILE = join(homedir(), '.shumi', 'config.json');

function readConfig() {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

/**
 * Deterministic device id from stable machine properties — same machine always
 * produces the same id, so server-side analytics/quota track consistently.
 * Matches the CLI fingerprint so a machine looks identical across surfaces.
 */
function getMachineFingerprint() {
  const data = [hostname(), userInfo().username, platform(), arch(), homedir()].join('|');
  return createHash('sha256').update(data).digest('hex').slice(0, 24);
}

export function getDeviceId() {
  return getMachineFingerprint();
}

/**
 * Resolve the bearer token. Priority:
 *   1. Per-request token (remote HTTP transport — each caller's own key)
 *   2. SHUMI_TOKEN env var (the headless / stdio MCP-config path)
 *   3. ~/.shumi/config.json token from a prior `shumi login` (DX nicety:
 *      a logged-in CLI user gets the MCP server working with zero extra setup)
 * Returns null when absent or expired.
 */
export function getToken() {
  const requestToken = currentRequest()?.token;
  if (requestToken) return requestToken;
  if (process.env.SHUMI_TOKEN) return process.env.SHUMI_TOKEN;
  const config = readConfig();
  if (!config.token) return null;
  if (config.expiresAt && new Date(config.expiresAt) < new Date()) return null;
  return config.token;
}

export function getWalletAddress() {
  return process.env.SHUMI_WALLET || readConfig().walletAddress || null;
}

export { API_URL, KEYS_URL };
