#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createShumiServer } from '../src/server.js';

/**
 * stdio entry point — the default. Run locally via `npx -y @shumi-ai/mcp`.
 * Auth comes from the SHUMI_TOKEN env var (or a prior `shumi login`).
 *
 * Nothing must be written to stdout except MCP protocol frames; diagnostics go
 * to stderr.
 */
async function main() {
  const server = createShumiServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('shumi-mcp: stdio server ready\n');
}

main().catch((err) => {
  process.stderr.write(`shumi-mcp: fatal: ${err?.stack || err}\n`);
  process.exit(1);
});
