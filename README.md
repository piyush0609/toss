# hull

Share HTML artifacts with access-controlled links. Self-hosted on Cloudflare's free tier — no credit card required.

```
hull share ./report.html --expires 24h
# → https://hull-you.piyush-sinha.workers.dev/a/abc123?t=eyJ...
```

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/piyush0609/hull/main/install.sh | sh
```

The installer detects your OS/arch, downloads the latest binary from [GitHub Releases](https://github.com/piyush0609/hull/releases), and installs it to `/usr/local/bin` (or `~/.local/bin`).

**Fallback:** If the binary download fails, it falls back to `npm install -g hull-cli`.

**Requirements for deploy:**
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)
- A Cloudflare account with a [workers.dev subdomain](https://dash.cloudflare.com/workers/onboarding)

> **Note:** `hull deploy` calls Wrangler, which requires Node.js. The hull binary itself has no runtime dependencies.

## Quick Start

### 1. Check your setup

```bash
hull doctor
```

### 2. Deploy your hull

```bash
hull deploy
# Choose a subdomain, e.g. "you"
```

This creates:
- A Cloudflare Worker (`hull-you`)
- A D1 database (`hull-db-you`) for metadata
- A KV namespace (`hull-kv-you`) for file storage

### 3. Share a file

```bash
hull share ./index.html --expires 24h
```

Options:
- `--expires 1h|24h|7d|30d` — link lifetime (required)
- `--clipboard` — copy link to clipboard
- `--json` — output JSON

### 4. Share a folder

```bash
hull share ./my-site --expires 7d
```

Uploads all files recursively. The first `index.html` found (or first `.html`) becomes the entry point. All other files are served as static assets with proper MIME types and cookie-based auth.

### 5. Manage artifacts

```bash
hull list          # Show all shared artifacts
hull revoke <id>   # Delete an artifact
hull info          # Show endpoint, subdomain, artifact count
hull destroy       # Tear down everything
```

## How It Works

| Component | Purpose |
|-----------|---------|
| **Cloudflare Worker** | Edge compute — upload, serve, list, delete |
| **D1** | SQLite metadata (id, name, size, expiry) |
| **KV** | File storage (25MB/value limit) |
| **JWT** | Share links are self-contained signed tokens with expiry |

### Auth Model

- **Upload** — hex owner token (stored in `~/.hull/config.json`)
- **Share links** — HS256 JWT with `sub` (artifact ID) and `exp` (expiry)
- **Folder sub-files** — HttpOnly cookie scoped to `/a/{id}` set on first HTML load

### Security Headers

Served HTML includes:
- `Content-Security-Policy` — strict CSP for React apps
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Cache-Control: private, no-store` (HTML never cached)

Static assets get `Cache-Control: public, max-age=86400, immutable`.

## Commands

| Command | Description |
|---------|-------------|
| `hull deploy` | Deploy infrastructure to Cloudflare |
| `hull share <file> --expires <duration>` | Share an HTML file or folder |
| `hull list` | List all artifacts with expiry status |
| `hull revoke <id>` | Permanently delete an artifact |
| `hull info` | Show endpoint, subdomain, KV ID, artifact count |
| `hull destroy` | Delete worker, D1, KV, and local config |
| `hull doctor` | Check prerequisites |

## Configuration

Stored in `~/.hull/config.json`:

```json
{
  "endpoint": "https://hull-you.piyush-sinha.workers.dev",
  "ownerToken": "...",
  "subdomain": "you",
  "kvId": "..."
}
```

## Limitations

- **25MB total per upload** (Cloudflare KV limit)
- **KV eventual consistency** — newly shared links may 404 for 1–60 seconds in some regions
- **No background cleanup** — expired artifacts stay in KV/D1 until revoked or destroyed

## Rate Limiting

The upload endpoint has no built-in rate limiting. For production use, consider adding Cloudflare Rate Limiting rules or a D1-backed IP throttle.

## Generating a Skill

If you want to turn a shared HTML artifact into a reusable [Claude skill](https://docs.anthropic.com/en/docs/skills), save the artifact's source as a self-contained HTML file and share it:

```bash
hull share ./skill-dashboard.html --expires 30d
```

The link can then be referenced in a skill's `SKILL.md` as a live demo or embedded tool. For fully offline skills, copy the HTML into the skill directory instead.

## Development

```bash
git clone https://github.com/piyush0609/hull.git
cd hull
npm install
npm run build
npm test
```

Build standalone binaries:
```bash
npm run build:bin   # or ./build.sh
```

## License

MIT
