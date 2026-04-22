# Hull CLI Skill

Self-host HTML artifact sharing on Cloudflare. Generate time-expiring links for HTML files and folders. No third-party service required.

---

name: hull-cli
description: Deploy and manage a self-hosted HTML sharing service on Cloudflare Workers. Share HTML files or folders with time-controlled links via CLI. Ideal for sharing reports, demos, prototypes, and static sites with expiry.
license: MIT
compatibility: Node.js 18+, npm, Wrangler CLI, Cloudflare account
metadata:
  author: Hull
  version: "0.1.0"
  requires: ["node", "npm", "wrangler"]

---

## Overview

Hull deploys a complete sharing infrastructure to your Cloudflare account:

- **Cloudflare Worker** — Edge compute for upload, serve, list, delete
- **D1 Database** — Metadata storage (id, name, size, expiry)
- **KV Storage** — File storage (25MB/value limit)
- **JWT Share Links** — Self-contained signed tokens with enforced expiry

One `hull deploy` sets everything up. No credit card required.

## When to Use This Skill

Use hull when:

- Sharing HTML reports, demos, or prototypes with controlled expiry
- Sharing folders containing static sites (HTML + CSS + JS + assets)
- Needing self-hosted sharing without relying on third-party services
- Working in environments where data residency matters
- Sharing content that should auto-expire (1h to 30d)

Don't use when:

- You need permanent/long-term hosting (hull max expiry is 30d)
- You're sharing files larger than 25MB total
- You need real-time collaboration or editing
- You want public discovery / explore features

## Prerequisites

1. Node.js 18+ installed
2. npm installed
3. Wrangler CLI installed: `npm install -g wrangler`
4. Cloudflare account with workers.dev subdomain registered
5. Authenticated with Wrangler: `wrangler login`

Verify prerequisites:
```bash
hull doctor
```

## Installation

```bash
npm install -g hull-cli
```

Or via install script:
```bash
curl -fsSL https://raw.githubusercontent.com/YOURUSER/hull-cli/main/install.sh | sh
```

## Quick Start

### 1. Deploy infrastructure

```bash
hull deploy
```

You'll be prompted for a subdomain (e.g., `yourname`). This creates:
- Worker: `hull-yourname`
- D1 database: `hull-db-yourname`
- KV namespace: `hull-kv-yourname`

### 2. Share a file

```bash
hull share ./index.html --expires 24h
```

Output:
```
Link:     https://hull-yourname.YOURSUBDOMAIN.workers.dev/a/abc123?t=eyJ...
Expires:  24h
Revoke:   hull revoke abc123
```

Options:
- `--expires 1h|24h|7d|30d` — required
- `--clipboard` — copy link to clipboard
- `--json` — output JSON

### 3. Share a folder

```bash
hull share ./my-site --expires 7d
```

Uploads all files recursively. The first `index.html` (or first `.html`) becomes the entry point. All other files are served as static assets with proper MIME types and cookie-based authentication.

### 4. Manage artifacts

```bash
hull list           # Show all shared artifacts with expiry status
hull info           # Show endpoint, subdomain, KV ID, artifact count
hull revoke <id>    # Permanently delete an artifact
hull destroy        # Tear down all infrastructure
```

## Command Reference

| Command | Description |
|---------|-------------|
| `hull deploy` | Deploy worker, D1, and KV to Cloudflare |
| `hull share <file> --expires <duration>` | Share an HTML file or folder |
| `hull list` | List artifacts with size and expiry |
| `hull revoke <id>` | Delete an artifact from KV and D1 |
| `hull info` | Show endpoint, subdomain, KV ID, count |
| `hull destroy` | Delete worker, D1, KV, and local config |
| `hull doctor` | Check Node, Wrangler, auth, subdomain |

## Security Model

### Upload Authentication
- Hex owner token stored in `~/.hull/config.json`
- Required in `Authorization: Bearer <token>` header for all uploads

### Share Links
- HS256 JWT with `sub` (artifact ID) and `exp` (Unix expiry)
- Self-contained — no database lookup needed to validate
- Max TTL enforced: 90 days

### Folder Sub-files
- HttpOnly cookie `hull_tok` scoped to `/a/{id}`
- Set on first HTML load, used for subsequent asset requests
- Cookie expires with the JWT

### Headers
Served HTML includes:
- `Content-Security-Policy` — strict CSP for React apps
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Cache-Control: private, no-store` (HTML never cached)

Static assets get `Cache-Control: public, max-age=86400, immutable`.

## Configuration

Stored in `~/.hull/config.json`:

```json
{
  "endpoint": "https://hull-yourname.SUBDOMAIN.workers.dev",
  "ownerToken": "...",
  "subdomain": "yourname",
  "kvId": "..."
}
```

## Limitations

- **25MB total per upload** (Cloudflare KV limit)
- **Max expiry 30d** (JWT enforcement)
- **KV eventual consistency** — newly shared links may 404 for 1–60s in some regions
- **No background cleanup** — expired artifacts stay in KV/D1 until revoked
- **No password protection** — links are the only access control
- **No custom paths** — artifact IDs are UUIDs

## Error Handling

### "No hull found. Run hull deploy first."
You haven't deployed yet. Run `hull deploy`.

### "Upload failed: 401"
Owner token mismatch. Check `~/.hull/config.json` or re-deploy.

### "Upload failed: 400"
Invalid expiry or missing name parameter.

### "File size exceeds 25MB"
Total content too large for KV. Reduce assets or split into multiple shares.

### Link 404s immediately after upload
KV eventual consistency. Wait 10–60 seconds and retry.

## Best Practices

1. **Use appropriate TTLs** — Don't use 30d for temporary content
2. **Revoke when done** — Don't wait for expiry; clean up early
3. **Avoid dotfiles** — Hidden files and dev folders (node_modules, .git) are automatically skipped
4. **Check size before sharing** — Large folders with images may exceed 25MB
5. **Keep config safe** — `~/.hull/config.json` contains your owner token
6. **Test links** — Wait a few seconds after upload before sharing the link

## Example Workflows

### Share a generated report

```bash
# Generate report
node generate-report.js > report.html

# Share with 24h expiry
hull share ./report.html --expires 24h --clipboard
```

### Share a React build folder

```bash
npm run build
hull share ./dist --expires 7d
```

### Share a one-time demo

```bash
hull share ./demo.html --expires 1h --clipboard
# Share link, then revoke after the meeting:
hull revoke <id-from-list>
```

### Automated CI sharing

```bash
# In CI pipeline
hull share ./coverage-report/index.html --expires 1d --json | jq -r '.url'
```

## Troubleshooting

### Wrangler not found
```bash
npm install -g wrangler
wrangler login
```

### No workers.dev subdomain
Visit https://dash.cloudflare.com/workers/onboarding to register one.

### Destroy failed partially
If destroy leaves resources behind, clean up manually via Cloudflare dashboard or re-run `hull destroy`.

### Multiple hulls on same account
Each subdomain gets isolated resources. Deploy with different subdomains for separate projects.
