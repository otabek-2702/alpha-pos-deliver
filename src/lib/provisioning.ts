/* ============================================================
   Courier login QR — payload contract + parser.

   The POS (till) generates a login QR when a manager creates a
   courier. It encodes JSON:
     { v: 1, server: "http://192.168.1.10:8000", token: "<one-time claim>" }
   - `server`   : backend base URL the app should talk to (saved via serverConfig).
   - `token`    : preferred — a one-time claim the app exchanges for a courier
                  token at POST /auth/courier/login { qr: token }.
   - `email`/`password` : fallback credentials if a claim flow isn't used.

   A bare URL string (no JSON) is tolerated too — it just sets the server, and
   the courier then signs in with phone + password.
   ============================================================ */

export interface CourierProvisioning {
  server: string;
  token?: string;
  email?: string;
  password?: string;
}

export function parseCourierQr(raw: string): CourierProvisioning | null {
  const text = (raw || '').trim();
  if (!text) return null;

  // Bare URL or host:port → server only.
  if (/^https?:\/\//i.test(text) || /^[\w.-]+:\d+$/.test(text)) {
    return { server: text };
  }

  try {
    const obj = JSON.parse(text) as Record<string, unknown>;
    const server = typeof obj.server === 'string' ? obj.server.trim() : '';
    if (!server) return null;
    const out: CourierProvisioning = { server };
    if (typeof obj.token === 'string') out.token = obj.token;
    if (typeof obj.email === 'string') out.email = obj.email;
    if (typeof obj.password === 'string') out.password = obj.password;
    return out;
  } catch {
    return null;
  }
}
