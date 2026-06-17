/* ============================================================
   COURIER APP · root
   ============================================================ */

const ACCENTS = {
  "#3A5BDB": { hover: "#2E49B8", active: "#263EA0", weak: "#EDF0FD", weak2: "#DEE4FB", border: "#C7D1F7", ring: "rgba(58,91,219,.28)" },
  "#0E8F57": { hover: "#0B7A49", active: "#09653C", weak: "#E6F4EC", weak2: "#CFEADb", border: "#BDE3CD", ring: "rgba(14,143,87,.26)" },
  "#E0823C": { hover: "#C76E2B", active: "#A85A22", weak: "#FBF0E5", weak2: "#F6E1CC", border: "#F0D2B2", ring: "rgba(224,130,60,.26)" },
  "#7A5AE0": { hover: "#6747C9", active: "#553AAD", weak: "#F0ECFC", weak2: "#E3DBF9", border: "#D2C6F2", ring: "rgba(122,90,224,.26)" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#3A5BDB",
  "dark": false,
  "lang": "EN",
  "orderState": "Assigned",
  "addressMode": "Auto",
  "qrDemo": "Auto-pay"
}/*EDITMODE-END*/;

const STATE_MAP = { "Assigned": "ASSIGNED", "Ready": "READY", "On the way": "ON_WAY", "Delivered": "DELIVERED" };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState("orders");
  const [overlay, setOverlay] = useState(null); // {type:'detail',order} | {type:'notifications'}
  const [online, setOnline] = useState(CDB.courier.online);
  const [shareLoc, setShareLoc] = useState(true);
  const [push, setPush] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [orderCount, setOrderCount] = useState(CDB.active.length);

  // candidate for the "new order arrives" demo
  const incomingCandidate = {
    id: 64, total: 96000, fee: 16000, payment: "UNPAID",
    customer: { name: "Aziza M." },
    address: { text: "Yunusobod 4-kvartal, 12-uy", distanceKm: 2.1 },
  };

  function simulateIncoming() { setIncoming(incomingCandidate); }
  function acceptIncoming() { setIncoming(null); setOrderCount((c) => c + 1); }

  // featured order state preview (drives the first active order)
  CDB.active[0].step = STATE_MAP[t.orderState] || "ASSIGNED";

  const T = makeT(t.lang || "EN");
  const addrMode = t.addressMode === "Text" ? "text" : "map";
  const unread = CDB.notifications.filter((n) => n.unread).length;

  // ---- accent + theme css vars ----
  const acc = ACCENTS[t.accent] || ACCENTS["#3A5BDB"];
  const vars = {
    "--primary": t.accent,
    "--primary-hover": acc.hover,
    "--primary-active": acc.active,
    "--primary-ring": acc.ring,
  };
  if (!t.dark) {
    vars["--primary-weak"] = acc.weak;
    vars["--primary-weak-2"] = acc.weak2;
    vars["--primary-border"] = acc.border;
  }

  function demoPush() {
    setPush({
      icon: "scooter", title: "New order #58 assigned",
      body: "Kitchen is preparing it — get ready to pick up.",
      bg: t.accent,
    });
  }

  function handleOrderPaid(order, method) {
    setPush({
      icon: "wallet", title: T("payment_received") + " · #" + order.id,
      body: fmt.money(order.total) + " so'm · " + (method || ""),
      bg: "var(--success)",
    });
  }

  function screen() {
    if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;
    if (overlay && overlay.type === "detail") {
      return <OrderDetail key={overlay.order.id + "-" + overlay.order.step}
                          order={overlay.order} addressMode={addrMode} T={T} qrResult={t.qrDemo}
                          onBack={() => setOverlay(null)} onPush={demoPush} onPaid={handleOrderPaid} />;
    }
    if (overlay && overlay.type === "notifications") {
      return <NotificationsScreen onBack={() => setOverlay(null)} onDemo={demoPush} />;
    }
    if (tab === "orders")
      return <OrdersScreen online={online} setOnline={setOnline} unread={unread}
                onBell={() => setOverlay({ type: "notifications" })}
                onBalance={() => setTab("cash")}
                onOpen={{ detail: (o) => setOverlay({ type: "detail", order: o }), profile: () => setTab("profile") }} />;
    if (tab === "today") return <TodayScreen />;
    if (tab === "cash") return <CashScreen T={T} />;
    if (tab === "profile")
      return <ProfileScreen online={online} setOnline={setOnline} shareLoc={shareLoc} setShareLoc={setShareLoc}
                onLogout={() => { setLoggedIn(false); setTab("orders"); setOverlay(null); }} onDemo={demoPush} />;
  }

  const showTabs = loggedIn && !overlay;

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px 0" }}>
      <div style={vars} data-theme={t.dark ? "dark" : undefined}>
        <IOSDevice dark={t.dark}>
          <div className="ca">
            {push && <PushBanner data={push} onClose={() => setPush(null)}
                       onOpen={() => { setPush(null); if (loggedIn) setOverlay({ type: "notifications" }); }} />}
            {screen()}
            {showTabs && <TabBar active={tab} onChange={(k) => { setTab(k); setOverlay(null); }} unread={unread} orderCount={orderCount} T={T} />}
            {loggedIn && incoming && (
              <IncomingOrderSheet order={incoming} T={T}
                onAccept={acceptIncoming} onDismiss={() => setIncoming(null)} />
            )}
          </div>
        </IOSDevice>
      </div>

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor label="Accent" value={t.accent}
          options={["#3A5BDB", "#0E8F57", "#E0823C", "#7A5AE0"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
        <TweakSection label="Localization" />
        <TweakRadio label="Language" value={t.lang}
          options={["UZ", "RU", "EN"]}
          onChange={(v) => setTweak("lang", v)} />
        <TweakSection label="Preview" />
        <TweakRadio label="Order stage" value={t.orderState}
          options={["Assigned", "Ready", "On the way", "Delivered"]}
          onChange={(v) => setTweak("orderState", v)} />
        <TweakRadio label="Address" value={t.addressMode}
          options={["Auto", "Text"]}
          onChange={(v) => setTweak("addressMode", v)} />
        <TweakRadio label="QR demo" value={t.qrDemo}
          options={["Auto-pay", "Waiting"]}
          onChange={(v) => setTweak("qrDemo", v)} />
        <TweakSection label="Motion demo" />
        <TweakButton label="Simulate new order" onClick={simulateIncoming} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
