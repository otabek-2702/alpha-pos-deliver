/* ============================================================
   COURIER APP · payment collection
   Exports: QRCode · CollectSheet · CashSheet · SplitSheet · QRPayScreen
   API matches screens.jsx (OrderDetail flow state machine).
   Translator passed as `T` prop; copy keys live in app/i18n.js.
   ============================================================ */
const { useState: usePS, useEffect: usePE, useMemo: usePM } = React;

// ---------- QR matrix → SVG ----------
function QRCode({ payload, size }) {
  size = size || 224;
  const grid = usePM(() => PAY.qrMatrix(payload, 29), [payload]);
  const n = grid.length;
  const cell = size / n;
  const rects = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c]) {
        rects.push(<rect key={r + "-" + c} x={(c * cell).toFixed(2)} y={(r * cell).toFixed(2)}
          width={(cell + 0.4).toFixed(2)} height={(cell + 0.4).toFixed(2)} rx={(cell * 0.16).toFixed(2)} />);
      }
    }
  }
  return (
    <svg viewBox={"0 0 " + size + " " + size} width={size} height={size} shapeRendering="crispEdges">
      <g fill="#0E1219">{rects}</g>
    </svg>
  );
}

// ---------- method chooser (bottom sheet) ----------
function CollectSheet({ order, T, onClose, onPick }) {
  const tr = T || ((k) => k);
  const rows = [
    { m: "cash",  icon: "banknote", tone: "cash",  t: tr("cash"),          s: tr("cash_sub") },
    { m: "qr",    icon: "qr",       tone: "qr",    t: tr("qr_card"),       s: tr("qr_sub") },
    { m: "split", icon: "layers",   tone: "split", t: tr("split_payment"), s: tr("split_sub") },
  ];
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grip"></div>
        <div className="sheet__title">{tr("collect_payment")}</div>
        <div className="sheet__sub">{tr("choose_method")} · {fmt.moneySom(order.total)}</div>
        <div className="ca-stack">
          {rows.map((r) => (
            <div className="paymethod" key={r.m} onClick={() => onPick(r.m)}>
              <div className={"paymethod__icon t-" + r.tone}><Icon name={r.icon} size={23} /></div>
              <div className="paymethod__main">
                <div className="paymethod__t">{r.t}</div>
                <div className="paymethod__s">{r.s}</div>
              </div>
              <Icon name="chevright" size={18} style={{ color: "var(--text-tertiary)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- cash received (keypad + change) ----------
function CashSheet({ order, T, onClose, onConfirm }) {
  const tr = T || ((k) => k);
  const due = order.total;
  const [entered, setEntered] = usePS("");
  const val = parseInt(entered || "0", 10);
  const diff = val - due;
  const presets = [...new Set([due, Math.ceil(due / 50000) * 50000, Math.ceil(due / 100000) * 100000])].filter((p) => p > 0);

  function press(d) {
    if (d === "del") return setEntered((e) => e.slice(0, -1));
    if (d === "000") return setEntered((e) => (e === "" ? e : (e + "000")).slice(0, 9));
    setEntered((e) => (e + d).replace(/^0+/, "").slice(0, 9));
  }

  return (
    <div className="pay">
      <div className="pay__head">
        <div className="iconbtn" onClick={onClose}><Icon name="chevleft" size={22} /></div>
        <div className="pay__title">{tr("cash_received")}</div>
      </div>
      <div className="pay__body">
        <div className="pay__amount-l">{tr("amount_to_collect")}</div>
        <div className="pay__order mono" style={{ fontSize: 15, marginTop: 2 }}>#{order.id} · {fmt.moneySom(due)}</div>

        <div className="amt-display">
          <span className="amt-display__v mono">{val ? fmt.money(val) : "0"}</span>
          <span className="amt-display__cur"> so'm</span>
        </div>

        <div className="amt-chips">
          <button className={"amt-chip" + (val === due ? " is-on" : "")} onClick={() => setEntered(String(due))}>{tr("exact")}</button>
          {presets.map((p) => (
            <button key={p} className={"amt-chip" + (val === p ? " is-on" : "")} onClick={() => setEntered(String(p))}>{fmt.money(p)}</button>
          ))}
        </div>

        {val > 0 && (
          <div className={"change-banner " + (diff >= 0 ? "ok" : "short")}>
            <span className="change-banner__l">{diff >= 0 ? tr("change_due", { v: "" }).replace(/\s*$/, "") : tr("amount_to_collect")}</span>
            <span className="change-banner__v mono">{fmt.money(Math.abs(diff))}</span>
          </div>
        )}

        <div className="keypad">
          {["1","2","3","4","5","6","7","8","9","000","0","del"].map((k) => (
            <button key={k} className={"key" + (k === "del" || k === "000" ? " key--fn" : "")} onClick={() => press(k)}>
              {k === "del" ? <Icon name="delete" size={20} /> : k}
            </button>
          ))}
        </div>
      </div>
      <div className="pay__foot">
        <button className="btn btn--success" disabled={val < due} onClick={() => onConfirm(val)}>
          <Icon name="checkcircle" size={20} /> {tr("confirm_cash")}
        </button>
      </div>
    </div>
  );
}

// ---------- split (cash part + QR part) ----------
function SplitSheet({ order, T, onClose, onContinueQR }) {
  const tr = T || ((k) => k);
  const total = order.total;
  const [cash, setCash] = usePS(Math.round(total / 2 / 1000) * 1000);
  const qr = Math.max(0, total - cash);
  const cashPct = total ? (cash / total) * 100 : 0;
  const bump = (d) => setCash((c) => Math.max(0, Math.min(total, c + d)));

  return (
    <div className="pay">
      <div className="pay__head">
        <div className="iconbtn" onClick={onClose}><Icon name="chevleft" size={22} /></div>
        <div className="pay__title">{tr("split_payment")}</div>
      </div>
      <div className="pay__body" style={{ justifyContent: "flex-start" }}>
        <div className="pay__amount-l" style={{ marginTop: 8 }}>{tr("amount_due")}</div>
        <div className="pay__amount mono">{fmt.money(total)} <span style={{ fontSize: 18, color: "var(--text-tertiary)" }}>so'm</span></div>

        <div className="split-meter" style={{ marginTop: 22, width: "100%" }}>
          <div className="split-meter__cash" style={{ width: cashPct + "%" }}></div>
          <div className="split-meter__qr" style={{ width: (100 - cashPct) + "%" }}></div>
        </div>

        <div className="ca-stack" style={{ width: "100%", marginTop: 22, textAlign: "left" }}>
          <div className="split-row">
            <div className="field__label" style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span className="paymethod__icon t-cash" style={{ width: 20, height: 20, flex: "0 0 20px", borderRadius: 5 }}><Icon name="banknote" size={12} /></span>
              {tr("cash_part")}
            </div>
            <div className="split-input">
              <button className="iconbtn" style={{ width: 34, height: 34, flex: "0 0 34px" }} onClick={() => bump(-10000)}><Icon name="minus" size={16} /></button>
              <input value={fmt.money(cash)} readOnly style={{ textAlign: "center" }} />
              <button className="iconbtn" style={{ width: 34, height: 34, flex: "0 0 34px" }} onClick={() => bump(10000)}><Icon name="plus" size={16} /></button>
            </div>
          </div>
          <div className="split-row">
            <div className="field__label" style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span className="paymethod__icon t-qr" style={{ width: 20, height: 20, flex: "0 0 20px", borderRadius: 5 }}><Icon name="qr" size={12} /></span>
              {tr("qr_part")}
            </div>
            <div className="split-input">
              <input value={fmt.money(qr)} readOnly style={{ textAlign: "center" }} />
            </div>
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-tertiary)", display: "flex", gap: 6 }}>
            <Icon name="info" size={14} style={{ flex: "0 0 14px", marginTop: 2 }} />
            <span>{tr("split_note")}</span>
          </div>
        </div>
      </div>
      <div className="pay__foot">
        <button className="btn btn--primary" disabled={qr <= 0} onClick={() => onContinueQR(cash)}>
          <Icon name="qr" size={20} /> {tr("continue_qr", { v: fmt.money(qr) })}
        </button>
      </div>
    </div>
  );
}

// ---------- full-screen QR pay with live waiting → paid ----------
function QRPayScreen({ order, amount, T, qrResult, splitCash, onBack, onPaid }) {
  const tr = T || ((k) => k);
  const [status, setStatus] = usePS("waiting"); // waiting | paid
  const [nonce, setNonce] = usePS(0);
  const [method, setMethod] = usePS(null);
  const payload = usePM(() => PAY.payLink(order, "payme") + "&n=" + nonce + "&amt=" + amount, [order, nonce, amount]);

  // simulate PayTechUZ webhook → WebSocket "payment.paid"
  usePE(() => {
    if (status !== "waiting" || qrResult === "Waiting") return;
    const prov = PAY.PROVIDERS[Math.floor(Math.random() * PAY.PROVIDERS.length)];
    const tm = setTimeout(() => { setMethod(prov.name); setStatus("paid"); }, 4600);
    return () => clearTimeout(tm);
  }, [status, nonce, qrResult]);

  function settleCash() { setMethod(tr("cash")); setStatus("paid"); }

  if (status === "paid") {
    return <PaidView amount={amount} method={method} order={order} splitCash={splitCash} T={tr}
                     onDone={() => onPaid(method)} />;
  }

  return (
    <div className="pay">
      <div className="pay__head">
        <div className="iconbtn" onClick={onBack}><Icon name="chevleft" size={22} /></div>
        <div className="pay__title">{tr("collect_payment")}</div>
      </div>
      <div className="pay__body">
        <div className="pay__amount-l">{tr("amount_due")}</div>
        <div className="pay__amount mono">{fmt.money(amount)} <span style={{ fontSize: 18, color: "var(--text-tertiary)" }}>so'm</span></div>
        <div className="pay__order">#{order.id} · {order.customer.name}{splitCash ? " · +" + fmt.money(splitCash) + " " + tr("cash") : ""}</div>

        <div className="qrcard">
          <QRCode payload={payload} />
          <div className="qrcard__logo">A</div>
        </div>

        <div className="pay__scan-t">{tr("scan_to_pay")}</div>
        <div className="pay__providers">
          {PAY.PROVIDERS.map((p) => (
            <span className="provchip" key={p.key}>
              <span className="provchip__m" style={{ background: p.bg, color: p.fg }}>{p.mark}</span>
              {p.name}
            </span>
          ))}
        </div>

        <div className="pay__waiting"><span className="spinner"></span> {tr("waiting_payment")}</div>
        <div className="pay__rt"><Icon name="shield" size={12} style={{ verticalAlign: "-2px" }} /> {tr("secure_note")}</div>
      </div>
      <div className="pay__foot">
        <button className="btn btn--success btn--sm" onClick={settleCash}>
          <Icon name="banknote" size={18} /> {tr("mark_paid_cash")}
        </button>
      </div>
    </div>
  );
}

// ---------- paid success ----------
function PaidView({ amount, method, order, splitCash, T, onDone }) {
  const tr = T || ((k) => k);
  usePE(() => { const tm = setTimeout(onDone, 4200); return () => clearTimeout(tm); }, []);
  const grand = amount + (splitCash || 0);
  return (
    <div className="pay pay--paid">
      <div className="pay__head">
        <span style={{ flex: 1 }}></span>
        <div className="iconbtn" onClick={onDone}><Icon name="close" size={20} /></div>
      </div>
      <div className="pay__body" style={{ justifyContent: "flex-start" }}>
        <div className="paid-burst"><div className="paid-burst__ring"><Icon name="check" size={48} weight={2.6} /></div></div>
        <div style={{ color: "rgba(255,255,255,.85)", fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase", fontSize: 13 }}>{tr("payment_received")}</div>
        <div className="paid-amount mono">{fmt.money(grand)} so'm</div>
        <div className="paid-via"><Icon name="checkcircle" size={18} /> {tr("paid_via", { m: method || "—" })}</div>
        <div className="paid-receipt">
          <div className="paid-receipt__row"><span>{tr("amount_due")}</span><b>{fmt.money(amount)}</b></div>
          {splitCash ? <div className="paid-receipt__row"><span>{tr("cash_part")}</span><b>{fmt.money(splitCash)}</b></div> : null}
          <div className="paid-receipt__row"><span>#{order.id}</span><b>{method}</b></div>
          <div className="paid-receipt__row"><span>{tr("fiscal_receipt")}</span><b>✓</b></div>
        </div>
      </div>
      <div className="pay__foot">
        <button className="btn" style={{ background: "#fff", color: "var(--success-strong)" }} onClick={onDone}>
          <Icon name="check" size={20} /> {tr("done")}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { QRCode, CollectSheet, CashSheet, SplitSheet, QRPayScreen, PaidView });
