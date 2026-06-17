/* ============================================================
   COURIER APP · shared components
   ============================================================ */

// ---- step → label + badge tone ----
function stepBadge(step) {
  switch (step) {
    case "ASSIGNED":  return { label: "Preparing", tone: "warning", dot: true };
    case "READY":     return { label: "Ready", tone: "success", dot: true };
    case "PICKED_UP": return { label: "Picked up", tone: "info", dot: true };
    case "ON_WAY":    return { label: "On the way", tone: "primary", dot: true };
    case "DELIVERED": return { label: "Delivered", tone: "neutral", dot: false };
    default:          return { label: step, tone: "neutral", dot: false };
  }
}

function Badge({ tone, dot, className, children }) {
  return (
    <span className={"badge t-" + tone + (dot ? " badge--dot" : "") + (className ? " " + className : "")}>{children}</span>
  );
}

// ---- the courier's primary action for a given step ----
function nextAction(step) {
  switch (step) {
    case "ASSIGNED":  return { label: "Waiting for kitchen", icon: "clock", variant: "ghost", disabled: true, next: "READY" };
    case "READY":     return { label: "Picked up order", icon: "check", variant: "dark", next: "PICKED_UP" };
    case "PICKED_UP": return { label: "Start delivery", icon: "navigation", variant: "primary", next: "ON_WAY" };
    case "ON_WAY":    return { label: "Mark as delivered", icon: "checkcircle", variant: "success", next: "DELIVERED" };
    case "DELIVERED": return { label: "Delivered", icon: "checkcircle", variant: "ghost", disabled: true, next: null };
    default:          return { label: "—", icon: "check", variant: "ghost", disabled: true, next: null };
  }
}

// ---- stylized map preview (SVG placeholder, not a real tile map) ----
function MapView({ order }) {
  const a = order.address;
  return (
    <div className="mapview">
      <svg className="mapview__grid" viewBox="0 0 402 170" preserveAspectRatio="xMidYMid slice">
        <g stroke="#C5D2C8" strokeWidth="9" opacity="0.9" fill="none">
          <path d="M-10 40 H420" /><path d="M-10 120 H420" />
          <path d="M70 -10 V180" /><path d="M260 -10 V180" />
        </g>
        <g stroke="#D4DDD7" strokeWidth="4" fill="none">
          <path d="M-10 80 H420" /><path d="M160 -10 V180" /><path d="M340 -10 V180" />
        </g>
        <rect x="90" y="52" width="48" height="48" fill="#D8E2DA" rx="3" />
        <rect x="280" y="92" width="44" height="40" fill="#D8E2DA" rx="3" />
        <rect x="18" y="92" width="38" height="44" fill="#D8E2DA" rx="3" />
      </svg>
      <svg className="mapview__route" viewBox="0 0 402 170" preserveAspectRatio="none">
        <path d="M70 120 L70 80 L260 80 L260 40" fill="none" stroke="var(--primary)"
              strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="2 11" opacity="0.9" />
      </svg>
      <div className="mapview__me" style={{ left: "17.4%", top: "70.6%" }}>
        <div className="mapview__me-ring"></div>
        <div className="mapview__me-dot"></div>
      </div>
      <div className="mapview__pin" style={{ left: "64.7%", top: "23.5%" }}>
        <Icon name="pin" size={34} weight={2} />
      </div>
      <div className="mapview__badge"><Icon name="store" size={13} /> Drop-off</div>
      {a.distanceKm != null && (
        <div className="mapview__dist"><Icon name="navigation" size={12} /> {a.distanceKm} km</div>
      )}
    </div>
  );
}

// ---- navigation app handoff sheet ----
const NAV_APPS = [
  { key: "yandexnav", name: "Yandex Navigator", sub: "Build route & start driving", logo: "Y", bg: "#FFCC00", fg: "#1A1A1A" },
  { key: "yandexmaps", name: "Yandex Maps", sub: "Open location on the map", logo: "Я", bg: "#FF3333", fg: "#fff" },
  { key: "google", name: "Google Maps", sub: "Navigate with Google", logo: "G", bg: "#1A73E8", fg: "#fff" },
  { key: "2gis", name: "2GIS", sub: "Detailed city navigation", logo: "2", bg: "#19AA1E", fg: "#fff" },
];

function NavSheet({ order, onClose }) {
  const a = order.address;
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grip"></div>
        <div className="sheet__title">Open route in…</div>
        <div className="sheet__sub">{a.text}</div>
        {NAV_APPS.map((app) => (
          <div className="napp" key={app.key} onClick={onClose}>
            <div className="napp__logo" style={{ background: app.bg, color: app.fg }}>{app.logo}</div>
            <div className="napp__main">
              <div className="napp__t">{app.name}</div>
              <div className="napp__s">{app.sub}</div>
            </div>
            <Icon name="external" size={18} style={{ color: "var(--text-tertiary)" }} />
          </div>
        ))}
        <div style={{ height: 4 }}></div>
        <div className="napp" onClick={onClose}>
          <div className="napp__logo" style={{ background: "var(--surface-inset)", color: "var(--text-secondary)" }}>
            <Icon name="copy" size={20} />
          </div>
          <div className="napp__main">
            <div className="napp__t">Copy address</div>
            <div className="napp__s">{a.coords ? "Coordinates + text" : "Text address"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- iOS-style push banner ----
function PushBanner({ data, onClose, onOpen }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 5200);
    return () => clearTimeout(t);
  }, [data]);
  return (
    <div className="push" onClick={onOpen}>
      <div className="push__card">
        <div className="push__icon" style={data.bg ? { background: data.bg } : null}>
          <Icon name={data.icon || "scooter"} size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span className="push__app">Alpha Courier</span>
            <span className="push__at">now</span>
          </div>
          <div className="push__t">{data.title}</div>
          <div className="push__b">{data.body}</div>
        </div>
      </div>
    </div>
  );
}

// ---- bottom tab bar ----
function TabBar({ active, onChange, unread, orderCount, T }) {
  const tr = T || ((k) => k);
  const tabs = [
    { key: "orders", label: tr("nav_orders"), icon: "receipt" },
    { key: "today", label: tr("nav_today"), icon: "chart" },
    { key: "cash", label: tr("nav_cash"), icon: "wallet" },
    { key: "profile", label: tr("nav_profile"), icon: "user" },
  ];
  const idx = Math.max(0, tabs.findIndex((x) => x.key === active));

  // badge bump when orderCount increases
  const prev = React.useRef(orderCount || 0);
  const [bump, setBump] = React.useState(false);
  React.useEffect(() => {
    if ((orderCount || 0) > prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 650);
      prev.current = orderCount;
      return () => clearTimeout(t);
    }
    prev.current = orderCount;
  }, [orderCount]);

  return (
    <div className="tabbar">
      <div className="tab__ind" style={{ width: "calc((100% - 20px) / 4)", left: 10, transform: "translateX(" + idx * 100 + "%)" }}>
        <span></span>
      </div>
      {tabs.map((t) => (
        <button key={t.key} className={"tab" + (active === t.key ? " is-active" : "")}
                onClick={() => onChange(t.key)}>
          {t.key === "orders" && orderCount > 0 && (
            <span className={"tab__badge" + (bump ? " is-bump" : "")}>{orderCount}</span>
          )}
          <Icon name={t.icon} size={24} weight={active === t.key ? 2 : 1.7} />
          <span className="tab__l">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, {
  stepBadge, Badge, nextAction, MapView, NavSheet, NAV_APPS, PushBanner, TabBar, IncomingOrderSheet,
});

// ---- incoming-order sheet (springs up; countdown ring; hold-to-accept) ----
function IncomingOrderSheet({ order, T, onAccept, onDismiss }) {
  const tr = T || ((k) => k);
  return (
    <div className="incoming-scrim" onClick={onDismiss}>
      <div className="incoming" onClick={(e) => e.stopPropagation()}>
        <div className="incoming__grip"></div>
        <div className="incoming__head">
          <RingCountdown seconds={20} onExpire={onDismiss} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="incoming__title">{tr("new_order")} #{order.id}</div>
            <div className="incoming__sub">{order.address.text}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="ocard__total mono">{fmt.money(order.total)}</div>
            <div className="ocard__fee">+{fmt.money(order.fee)}</div>
          </div>
        </div>
        <div className="incoming__body">
          <div className="ocard__addr" style={{ marginBottom: 10 }}>
            <Icon name="scooter" size={16} />
            <div>{order.address.distanceKm} km · {order.customer.name}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {order.payment === "UNPAID"
              ? <Badge tone="warning" dot={false}><Icon name="banknote" size={11} /> {tr("collect_cash")}</Badge>
              : <Badge tone="success" dot={false}>{tr("paid")}</Badge>}
            <Badge tone="primary" dot>{tr("not_ready_yet")}</Badge>
          </div>
        </div>
        <div className="ca-stack">
          <HoldButton label={tr("hold_to_accept")} doneLabel={tr("accepted")} onComplete={onAccept} />
          <button className="btn btn--ghost btn--sm" onClick={onDismiss}>{tr("decline")}</button>
        </div>
      </div>
    </div>
  );
}
