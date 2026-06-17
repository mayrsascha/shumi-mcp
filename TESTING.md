# Testing — be 1000% sure before the registry

Run these in order. Steps 1–4 are the bar to clear before submitting to the
Official MCP Registry. You need an **Access or Pro** `shumi_sk_*` key for a full
green sweep (a free key has only 3 lifetime queries, so it will show `QUOTA`
after 3 calls — which still proves gating works).

## 1. Unit tests + a clean start (no network)

```bash
npm ci
npm test                 # error-map + route-building unit tests
SHUMI_TOKEN= node verify-live.mjs   # no token → every tool should report AUTH (clean error path)
```
Expect: tests pass; `tools/list: 23`; `typed tools missing outputSchema: none`;
summary all `AUTH`; `VERDICT: ✓ no protocol errors`.

## 2. End-to-end data path — LOCAL stdio (with a real key)

```bash
SHUMI_TOKEN=shumi_sk_realkey node verify-live.mjs --nlp
```
Expect: a row per tool, mostly `OK structured` (and `OK text` for the two NLP
tools), `ERROR=0`, `VERDICT: ✓ ... Data path verified.` This is the call that
closes the gap we never proved before (the old local token was expired).

## 3. End-to-end — the DEPLOYED server (what the world will hit)

```bash
SHUMI_TOKEN=shumi_sk_realkey node verify-live.mjs --remote --nlp
# hits https://shumi-mcp.onrender.com/mcp
```
Same expectation, over Streamable HTTP against Render. This proves the hosted
transport, session handling, and Bearer auth end-to-end. (Bump Render to Starter
first so a cold start doesn't skew the run.)

## 4. The PUBLISHED artifact works via npx (catch packaging bugs)

This simulates exactly what a user gets from `npx -y @shumi-ai/mcp`, using the
real tarball the registry/npm will serve — catches missing `files`, bad paths,
or dep issues before you publish.

```bash
npm pack                                   # -> shumi-ai-mcp-0.1.0.tgz
mkdir -p /tmp/mcp-pack && cd /tmp/mcp-pack
npm i /path/to/shumi-mcp/shumi-ai-mcp-0.1.0.tgz
SHUMI_TOKEN=shumi_sk_realkey npx shumi-mcp &   # should print "stdio server ready"
# then point the verify harness or Inspector at it, or just confirm it starts
```
Also: `npm pack --dry-run` and confirm the file list is only `bin/ src/
server.json README.md package.json` (no tests, no verify script).

## 5. MCP Inspector (visual / interactive)

```bash
SHUMI_TOKEN=shumi_sk_realkey npm run inspect      # local stdio
# remote: open the Inspector, choose Streamable HTTP, URL https://shumi-mcp.onrender.com/mcp,
#         add header Authorization: Bearer shumi_sk_realkey
```
Check: every tool lists with a readable description + enum'd params; calling a
tool returns structured output; the auth/quota error shows the upgrade hint.

## 6. Real clients (the actual UX)

- **Claude Code:** `claude mcp add --transport http shumi https://shumi-mcp.onrender.com/mcp --header "Authorization: Bearer shumi_sk_realkey"` → `claude mcp list` → ask it a crypto question.
- **Cursor / Claude Desktop (stdio):** add the `npx @shumi-ai/mcp` block from the README with `SHUMI_TOKEN`; restart; confirm tools appear and one call works.

## 7. Registry manifest sanity

```bash
node -e "const a=require('./package.json').mcpName,b=require('./server.json').name;if(a!==b)throw new Error('mcpName != server.json name');console.log('namespace match:',a)"
```
`mcp-publisher` validates `server.json` against the registry schema on publish;
fix anything it flags before confirming.

## Bulletproof bar
Submit only when: step 1 is green, steps 2 **and** 3 show `ERROR=0` with real
`OK`s, step 4 starts clean from the tarball, and step 6 works in at least one
real client.
