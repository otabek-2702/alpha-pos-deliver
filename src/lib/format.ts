/* ============================================================
   Currency / number formatting — ported from courier-data.js.
   UZS grouped with spaces, lowercase "so'm" suffix, signed with
   a real minus glyph (−) for negatives.

   Grouping is done manually (not toLocaleString) so it's identical
   across Hermes, Node and jest — the prototype's ru-RU grouping
   uses a space every 3 digits, which is what we reproduce.
   ============================================================ */

/** Group an integer with a space every 3 digits (e.g. 145000 → "145 000"). */
export function money(n: number): string {
  const rounded = Math.round(Math.abs(n));
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return n < 0 ? '-' + grouped : grouped;
}

export function moneySom(n: number): string {
  return money(n) + " so'm";
}

/** Signed with a typographic minus (−) like the prototype's `signed()`. */
export function signed(n: number): string {
  return (n < 0 ? '−' : '+') + money(Math.abs(n));
}

export const SUM = "so'm";
