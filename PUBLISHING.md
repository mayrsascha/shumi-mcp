# Publishing & distribution runbook (Phase 1)

The code artifacts are ready. The steps below are the outward-facing actions that
need accounts/credentials. Do them in order. **Decide the namespace first** — it
threads through npm, `server.json`, and the registry.

## 0. Namespace + repo owner (decided)

- Registry name: **`ai.shumi/mcp`**, verified by a **DNS TXT record on `shumi.ai`**.
- Repo: **`github.com/mayrsascha/shumi-mcp`** (DNS verification decouples the name
  from the GitHub owner, so the repo can live under the current account).
- `package.json` (`mcpName`) and `server.json` (`name`) are already set to
  `ai.shumi/mcp`; both repository URLs point at `mayrsascha/shumi-mcp`.

## 1. GitHub repo

```bash
cd /Users/saschamayr/Projects/shumi-mcp
git add -A && git commit -m "feat: Shumi MCP server (Phase 0 + Phase 1 artifacts)"
gh repo create mayrsascha/shumi-mcp --public --source=. --remote=origin --push
```

## 2. npm publish (`@shumi-ai/mcp`)

Requires being a member of the `@shumi-ai` npm org with publish rights.

```bash
npm login
npm publish        # publishConfig.access=public is already set
# verify
npx -y @shumi-ai/mcp   # should start the stdio server (needs SHUMI_TOKEN to call tools)
```

## 3. Official MCP Registry

```bash
# install the publisher CLI (Go) — see modelcontextprotocol/registry releases
mcp-publisher login dns --domain shumi.ai   # prints a TXT record to add to shumi.ai DNS
mcp-publisher publish                        # reads ./server.json (name: ai.shumi/mcp)
```
Smithery, Glama, and MCPfinder auto-aggregate from the registry within ~24h.

## 4. Render (hosted Streamable HTTP)

Either: New → Blueprint → point at this repo (`render.yaml`), then set the
`sync:false` env vars (`SHUMI_MCP_PUBLIC_URL`, `SHUMI_MCP_ALLOWED_ORIGINS`).
Or deploy via the Render API/MCP once the repo is connected.
Verify: `GET https://<service>.onrender.com/health` → `{ "ok": true }`.

## 5. Smithery (verified hosted listing — the #1 ranking lever)

`smithery.yaml` + `Dockerfile` are in place (container runtime, HTTP). Connect the
GitHub repo on smithery.ai and deploy; users supply their `shumiToken` via the
config schema (the server maps it to the upstream key). Alternatively, list the
Render URL as a remote server.

## 6. Other registries

- mcp.so — submit/comment on the tracking issue.
- PulseMCP — submit via the site form.
- Glama — claim the auto-crawled listing.
- `punkpeye/awesome-mcp-servers` — PR under the Finance/Crypto section.

Listing copy lives in `llms.txt` and `README.md`; keep it in the product voice
(no payment-processor names, no forbidden words, no "signals service" framing).
