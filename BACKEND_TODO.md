# Backend tasks — Alfa POS courier

> **Living list.** When a task here is built + verified, it gets **deleted** from this file
> (not archived). So this file always shows only what's LEFT to build. History lives in git.

---

## Multi-tenant courier login + server discovery (security)

**Context.** Each restaurant runs its **own** server (own URL). The courier app must NOT hardcode
a server URL, and must NOT send raw phone/password to a server it just picked. Instead, at login
the app asks a **central broker** ("our backend"), which authenticates the link and returns
**which server to talk to + a token**. The app then talks only to that restaurant's server.

**DECIDED:** couriers are **per-restaurant** (a courier belongs to one restaurant). The central
broker is a **pure router** — it does NOT hold courier passwords and is NOT an identity provider.
Login happens by scanning the desktop's QR link; central only maps the one-time `code` to the
right tenant and relays a signed claim token. No global courier directory.

### Pieces to build

**1. Central broker** — one instance for all restaurants (e.g. `https://provision.alfapos.uz`):
- **Tenant registry**: `Tenant { id, name, server_url, ws_url, shared_secret / public_key, status }`.
- `POST /provision/register` `{ tenant_id, code, courier_id, expires_at }` — called by a tenant
  server when the desktop links a courier device (authenticated by the tenant's secret). Central
  stores `code → { tenant, courier, exp }`.
- `POST /provision/claim` `{ code, device_id }` → validate the one-time code (TTL ~5 min, single
  use) → return `{ server_url, ws_url, claim_token, branch }`. `claim_token` = short-lived token
  **signed by central**, bound to `courier_id` + `device_id`.

**2. Tenant server** (the existing `alpha_pos_server`, one per restaurant):
- On desktop **"link courier device"**: mint a one-time `code`, register it with central
  (`/provision/register`), show a **QR** encoding the `code` (central URL is baked into the app),
  or `{ central_url, code }`.
- `POST /auth/courier/claim` `{ claim_token, device_id }` → verify central's signature on
  `claim_token` (offline, via central's public key / shared secret) → create the courier session →
  return `{ token }` (the same long-lived courier token the app already uses everywhere).

**3. App** (I'll do this side once the contract is fixed):
- Login = scan QR (`code`) → central `/provision/claim` → `{ server_url, ws_url, claim_token }` →
  tenant `/auth/courier/claim` → `{ token }`. Store `{ serverUrl, wsUrl, token }` in secure-store;
  every later REST/WS call uses that `serverUrl`/`wsUrl`.
- Manual `code` entry fallback. "Relink / switch restaurant" path. Handle `server_url` change.

### Security
- One-time, short-TTL `code` + `claim_token`; both bound to `device_id`.
- `claim_token` signed by central so the tenant verifies it **offline** (no central round-trip).
- Central ↔ tenant auth via shared secret (HMAC) or mTLS.
- App stores only the tenant token + URLs — never any central credential.

### Open questions for the dev (need answers before I wire the app)
1. `claim_token`: asymmetric **JWT** (ship central's public key to tenants) or **shared-secret HMAC**?
2. QR payload: just `{ code }` (central URL baked into the app) or `{ central_url, code }`?
3. Keep the tenant token scheme as `Authorization: Token <key>` (current) — yes/no?
4. Does the desktop POS already have a "link courier device" action, or is that new too?
5. How does a restaurant get registered with central (tenant `server_url`/`ws_url` + secret) —
   manual onboarding, or a self-register endpoint?
