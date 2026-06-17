/* ============================================================
   ALPHA POS — COURIER APP · mock data
   Currency: UZS (so'm). Order model mirrors the admin panel:
   status PREPARING/READY/.. · payment PAID/UNPAID.
   Courier-facing lifecycle: ASSIGNED → READY → PICKED_UP → ON_WAY → DELIVERED
   ============================================================ */
(function () {
  // ---- formatting helpers ----
  function money(n) {
    return Math.round(n).toLocaleString("ru-RU").replace(/\u00A0/g, " ");
  }
  function moneySom(n) { return money(n) + " so'm"; }
  function signed(n) { return (n < 0 ? "−" : "+") + money(Math.abs(n)); }

  // ---- courier profile ----
  var courier = {
    first: "Jasur",
    last: "Rakhimov",
    initials: "JR",
    phone: "+998 90 123 45 67",
    vehicle: "Scooter",
    plate: "01 A 777 BC",
    id: "CR-118",
    branch: "Alpha — Chilonzor",
    rating: 4.9,
    online: true,
  };

  // ---- courier lifecycle steps (in order) ----
  var STEPS = ["ASSIGNED", "READY", "PICKED_UP", "ON_WAY", "DELIVERED"];
  var STEP_LABEL = {
    ASSIGNED: "Assigned",
    READY: "Ready for pickup",
    PICKED_UP: "Picked up",
    ON_WAY: "On the way",
    DELIVERED: "Delivered",
  };

  // ---- active orders (in process) ----
  // address.coords present → show map; address.text present → show text; both → both.
  var active = [
    {
      id: 58, step: "ASSIGNED", payment: "UNPAID", total: 113000, fee: 15000,
      placedAt: "19:35", etaReady: "~6 min",
      customer: { name: "Nigora A.", phone: "+998 93 412 88 01" },
      address: {
        text: "Bunyodkor ko'chasi 12, kv. 34, 2-qavat",
        landmark: "near Chilonzor metro",
        coords: { lat: 41.2853, lng: 69.2034 },
        distanceKm: 2.4,
      },
      lines: [
        { name: "Pitsa tovuqli katta", qty: 1, price: 85000 },
        { name: "Toster", qty: 1, price: 28000 },
      ],
    },
    {
      id: 56, step: "READY", payment: "PAID", total: 76000, fee: 12000,
      placedAt: "19:31", etaReady: "Ready now",
      customer: { name: "Sardor T.", phone: "+998 90 700 14 22" },
      address: {
        text: "Mukimiy 45, ofis 3",
        landmark: "Biznes-tsentr, 1-podyezd",
        coords: { lat: 41.2789, lng: 69.2102 },
        distanceKm: 1.6,
      },
      lines: [
        { name: "Non kabob big", qty: 1, price: 56000 },
        { name: "Lester", qty: 1, price: 20000 },
      ],
    },
    {
      id: 62, step: "ON_WAY", payment: "UNPAID", total: 145000, fee: 18000,
      placedAt: "19:18", etaReady: "Ready",
      customer: { name: "Dilshod K.", phone: "+998 97 333 50 19" },
      address: {
        text: "Qatortol 88, xususiy uy, ko'k darvoza",
        landmark: "after the school, blue gate",
        coords: null,            // text-only address
        distanceKm: 3.1,
      },
      lines: [
        { name: "Lavash katta", qty: 2, price: 72000 },
        { name: "Lester", qty: 1, price: 1000 },
      ],
    },
  ];

  // ---- completed today ----
  var completed = [
    { id: 51, total: 145000, fee: 18000, payment: "PAID", deliveredAt: "16:48", minutes: 19,
      customer: { name: "Madina R." }, area: "Novza" },
    { id: 48, total: 38000, fee: 10000, payment: "PAID", deliveredAt: "15:58", minutes: 24,
      customer: { name: "Otabek S." }, area: "Chilonzor 9" },
    { id: 44, total: 92000, fee: 14000, payment: "PAID", deliveredAt: "14:40", minutes: 21,
      customer: { name: "Kamola N." }, area: "Mirzo Ulug'bek" },
    { id: 41, total: 210000, fee: 22000, payment: "PAID", deliveredAt: "13:15", minutes: 26,
      customer: { name: "Jahongir A." }, area: "Sergeli" },
  ];

  // ---- today stats ----
  var stats = {
    deliveries: 4,
    earnings: 64000,          // delivery fees earned today
    cashCollected: 383000,    // cash handled
    avgMinutes: 22,
    activeHours: "5h 12m",
    distanceKm: 31,
    byHour: [                 // for the mini bar chart
      { h: "10", n: 0 }, { h: "11", n: 1 }, { h: "12", n: 0 }, { h: "13", n: 1 },
      { h: "14", n: 1 }, { h: "15", n: 0 }, { h: "16", n: 1 }, { h: "17", n: 0 },
      { h: "18", n: 0 }, { h: "19", n: 0 },
    ],
  };

  // ---- balance / ledger ----
  // Balance goes negative while holding UNPAID assigned orders (cash he must
  // collect & hand in). Settled (paid by cashier) or cancelled → restored.
  var held = active.filter(function (o) { return o.payment === "UNPAID"; });
  var heldTotal = held.reduce(function (s, o) { return s + o.total; }, 0);
  var balance = -heldTotal;   // e.g. -(113000 + 145000) = -258000

  var ledger = [
    { at: "19:35", kind: "hold",   order: 62, amount: -145000, label: "Order #62 assigned — unpaid" },
    { at: "19:34", kind: "hold",   order: 58, amount: -113000, label: "Order #58 assigned — unpaid" },
    { at: "18:10", kind: "settle", order: 44, amount: +92000,  label: "Order #44 paid · cashier" },
    { at: "17:02", kind: "cancel", order: 40, amount: +56000,  label: "Order #40 cancelled · cashier" },
    { at: "16:30", kind: "settle", order: 41, amount: +210000, label: "Order #41 paid · cashier" },
  ];

  // ---- notifications ----
  var notifications = [
    { id: "n1", icon: "scooter", tone: "primary", title: "New order #58 assigned",
      body: "Kitchen is preparing — get ready to pick up.", at: "19:35", unread: true, order: 58 },
    { id: "n2", icon: "checkcircle", tone: "success", title: "Order #56 is ready",
      body: "Ready for pickup at the counter.", at: "19:32", unread: true, order: 56 },
    { id: "n3", icon: "banknote", tone: "warning", title: "Order #62 — collect cash",
      body: "Unpaid · collect 145 000 so'm on delivery.", at: "19:18", unread: false, order: 62 },
    { id: "n4", icon: "wallet", tone: "success", title: "Order #44 marked paid",
      body: "+92 000 cleared from your balance.", at: "18:10", unread: false, order: 44 },
    { id: "n5", icon: "close", tone: "error", title: "Order #40 cancelled",
      body: "Cancelled by cashier · +56 000 restored.", at: "17:02", unread: false, order: 40 },
  ];

  // ---- PayTechUZ-backed providers (one interface, many rails) ----
  // brand colors used only as small logo chips, not app surfaces.
  var providers = [
    { key: "payme",  name: "Payme",     bg: "#27C7C7", fg: "#0A2E2E", logo: "P", link: "https://checkout.paycom.uz/" },
    { key: "click",  name: "Click",     bg: "#0EA5E0", fg: "#FFFFFF", logo: "C", link: "https://my.click.uz/services/pay/" },
    { key: "uzum",   name: "Uzum Bank", bg: "#7B33FF", fg: "#FFFFFF", logo: "U", link: "https://www.uzumbank.uz/open/" },
    { key: "paynet", name: "Paynet",    bg: "#16B364", fg: "#FFFFFF", logo: "₽", link: "https://paynet.uz/pay/" },
  ];
  // Bank-issued unified QR (mandatory from 2026-07-01) — one code, every bank app.
  var unifiedQR = { key: "unified_qr", name: "Unified QR", bg: "#0F1722", fg: "#FFFFFF", logo: "≡", link: "https://qr.uzcard.uz/" };

  var PAYMENT_STATUS = ["pending", "paid", "failed", "refunded", "partial"];

  // ---- shift / reconciliation (drives the Earnings tab) ----
  var shift = {
    startedAt: "14:00",
    cashCollected: 383000,   // COD cash physically held → owed to company
    cardQrCollected: 421000, // auto-settled straight to company
    fees: 64000,             // courier earns
    bonuses: 25000,          // peak-hour / streak bonus
    tips: 12000,
    settled: false,
  };
  shift.owedToCompany = shift.cashCollected;
  shift.payout = shift.fees + shift.bonuses + shift.tips;       // company owes courier
  shift.totalCollected = shift.cashCollected + shift.cardQrCollected;
  shift.netHandIn = shift.owedToCompany - shift.payout;         // hand in cash minus payout

  window.fmt = { money: money, moneySom: moneySom, signed: signed };
  window.CDB = {
    providers: providers,
    unifiedQR: unifiedQR,
    PAYMENT_STATUS: PAYMENT_STATUS,
    shift: shift,
    courier: courier,
    STEPS: STEPS,
    STEP_LABEL: STEP_LABEL,
    active: active,
    completed: completed,
    stats: stats,
    balance: balance,
    held: held,
    heldTotal: heldTotal,
    ledger: ledger,
    notifications: notifications,
  };
})();
