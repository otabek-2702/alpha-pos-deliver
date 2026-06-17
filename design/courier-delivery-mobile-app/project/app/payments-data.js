/* ============================================================
   COURIER APP · payments — data + QR generator
   (i18n lives in app/i18n.js · this file only holds data/helpers)
   ============================================================ */
(function () {
  // ---- providers (PayTechUZ unified set) ----
  var PROVIDERS = [
    { key: "payme",  name: "Payme",  bg: "#33C5BE", fg: "#fff", mark: "P" },
    { key: "click",  name: "Click",  bg: "#00A6E9", fg: "#fff", mark: "C" },
    { key: "uzum",   name: "Uzum",   bg: "#7000FF", fg: "#fff", mark: "U" },
    { key: "paynet", name: "Paynet", bg: "#0A8F3C", fg: "#fff", mark: "P" },
  ];

  // dynamic pay-link payload encoded into the QR (amount in tiyin)
  function payLink(order, provider) {
    var base = {
      payme:  "https://checkout.paycom.uz/",
      click:  "https://my.click.uz/services/pay?",
      uzum:   "https://www.uzumbank.uz/open-service?",
      paynet: "https://paynet.uz/checkout/",
    }[provider] || "https://pay.alphapos.uz/";
    var tiyin = order.total * 100;
    return base + "id=ALP" + order.id + "&a=" + tiyin + "&t=" + Date.now().toString(36);
  }

  // deterministic QR-style matrix (faithful-looking placeholder, not spec QR)
  function qrMatrix(str, size) {
    size = size || 29;
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    function rnd() { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; }
    var m = [], r, c;
    for (r = 0; r < size; r++) { m.push(new Array(size).fill(0)); }
    function finder(or, oc) {
      for (var rr = 0; rr < 7; rr++) for (var cc = 0; cc < 7; cc++) {
        var edge = (rr === 0 || rr === 6 || cc === 0 || cc === 6);
        var core = (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
        m[or + rr][oc + cc] = -((edge || core) ? 1 : 2); // reserved (neg)
      }
    }
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
    for (r = 0; r < size; r++) for (c = 0; c < size; c++) {
      if (m[r][c] < 0) { m[r][c] = (m[r][c] === -1) ? 1 : 0; continue; }
      m[r][c] = rnd() > 0.5 ? 1 : 0;
    }
    return m;
  }

  // ---- today's shift reconciliation (mock) ----
  var recon = {
    collectedCash: 383000,   // cash physically collected on COD orders
    qrCollected: 221000,     // settled via QR / card
    deliveryFees: 64000,
    bonuses: 15000,
    tips: 8000,
    cashOrders: 3,
    qrOrders: 2,
    shiftStart: "14:05",
    handoverCode: "ALP-4471",
  };
  recon.netEarnings = recon.deliveryFees + recon.bonuses + recon.tips;
  recon.cashInHand = recon.collectedCash;          // owed to company (to hand in)
  recon.netPayout = recon.netEarnings;             // paid out to courier

  window.PAY = {
    PROVIDERS: PROVIDERS,
    payLink: payLink,
    qrMatrix: qrMatrix,
    recon: recon,
    LANGS: ["UZ", "RU", "EN"],
  };
})();
