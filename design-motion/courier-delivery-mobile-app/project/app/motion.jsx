/* ============================================================
   ALPHA POS — COURIER APP · MOTION primitives (JS)
   Reusable, reduced-motion-aware. Attached to window for use
   across screens.jsx / components.jsx / payments.jsx / app.jsx.
   Load AFTER icons/components, BEFORE payments/screens/app.
   ============================================================ */
const { useState: mState, useEffect: mEffect, useRef: mRef } = React;

// ---- prefers-reduced-motion hook ----
function useReducedMotion() {
  const [r, setR] = mState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false);
  mEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const h = (e) => setR(e.matches);
    mq.addEventListener ? mq.addEventListener("change", h) : mq.addListener(h);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", h) : mq.removeListener(h));
  }, []);
  return r;
}

// ---- Odometer: rolling mono digits (rolls from 0 on mount, re-rolls on change) ----
function Odometer({ value, format, className, delay }) {
  const reduce = useReducedMotion();
  const fmtFn = format || ((n) => fmt.money(n));
  const target = fmtFn(value);
  const zeros = target.replace(/\d/g, "0");
  const [cur, setCur] = mState(reduce ? target : zeros);
  mEffect(() => {
    if (reduce || (typeof document !== "undefined" && document.hidden)) { setCur(target); return; }
    const id = setTimeout(() => setCur(target), 30 + (delay || 0));
    return () => clearTimeout(id);
  }, [target, reduce]);
  const src = cur.length === target.length ? cur : zeros;
  return (
    <span className={"odo " + (className || "")}>
      {target.split("").map((ch, i) => {
        if (!/\d/.test(ch)) return <span className="odo__sep" key={i}>{ch}</span>;
        const d = parseInt(src[i] || "0", 10);
        return (
          <span className="odo__col" key={i}>
            <span className="odo__roll" style={{ transform: "translateY(-" + d + "em)" }}>
              {[0,1,2,3,4,5,6,7,8,9].map((n) => <span className="odo__d" key={n}>{n}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}

// ---- CountUp: numeric tween from 0 → value (for KPIs) ----
function CountUp({ value, format, duration, className }) {
  const reduce = useReducedMotion();
  const fmtFn = format || ((n) => fmt.money(Math.round(n)));
  const [n, setN] = mState(reduce ? value : 0);
  const raf = mRef(0);
  mEffect(() => {
    if (reduce || (typeof document !== "undefined" && document.hidden)) { setN(value); return; }
    const dur = duration || 900;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, reduce]);
  return <span className={className}>{fmtFn(n)}</span>;
}

// ---- DrawCheck: self-drawing checkmark (ring + tick) ----
function DrawCheck({ size, stroke, pop }) {
  const s = size || 64;
  const col = stroke || "var(--success)";
  return (
    <svg className={"draw-check" + (pop ? " is-pop" : "")} width={s} height={s} viewBox="0 0 52 52" fill="none">
      <circle className="draw-check__ring" cx="26" cy="26" r="24" stroke={col} strokeWidth="3" />
      <path className="draw-check__tick" d="M15 27 l7 7 l15 -16" stroke={col} strokeWidth="4"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---- RingCountdown: depleting circular ring + mono seconds ----
function RingCountdown({ seconds, onExpire }) {
  const reduce = useReducedMotion();
  const total = seconds || 20;
  const [left, setLeft] = mState(total);
  mEffect(() => {
    if (reduce) return;
    setLeft(total);
    const start = Date.now();
    const iv = setInterval(() => {
      const l = Math.max(0, total - (Date.now() - start) / 1000);
      setLeft(l);
      if (l <= 0) { clearInterval(iv); onExpire && onExpire(); }
    }, 100);
    return () => clearInterval(iv);
  }, []);
  const r = 28, circ = 2 * Math.PI * r;
  const frac = left / total;
  const urgent = left <= 5;
  const color = left <= 3 ? "var(--error)" : left <= 6 ? "var(--warning)" : "var(--primary)";
  return (
    <div className={"ring-countdown" + (urgent ? " is-urgent" : "")}>
      <svg width="64" height="64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--surface-inset)" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)}
                style={{ transition: "stroke-dashoffset .15s linear, stroke .3s ease" }} />
      </svg>
      <div className="ring-countdown__num" style={{ color }}>{Math.ceil(left)}</div>
    </div>
  );
}

// ---- HoldButton: press-and-hold fill → drawn checkmark ----
function HoldButton({ label, doneLabel, onComplete, holdMs }) {
  const reduce = useReducedMotion();
  const ms = holdMs || 850;
  const [p, setP] = mState(0);
  const [done, setDone] = mState(false);
  const raf = mRef(0);
  const start = mRef(0);
  function finish() {
    cancelAnimationFrame(raf.current); setP(1); setDone(true);
    setTimeout(() => onComplete && onComplete(), 440);
  }
  function begin(e) {
    e.preventDefault();
    if (done) return;
    if (reduce) { finish(); return; }
    start.current = Date.now();
    const tick = () => {
      const f = Math.min(1, (Date.now() - start.current) / ms);
      setP(f);
      if (f >= 1) finish(); else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }
  function end() { if (done) return; cancelAnimationFrame(raf.current); setP(0); }
  return (
    <button className={"hold" + (p > 0 && !done ? " is-filling" : "") + (done ? " is-done" : "")}
            onMouseDown={begin} onMouseUp={end} onMouseLeave={end}
            onTouchStart={begin} onTouchEnd={end}>
      <span className="hold__fill" style={{ transform: "scaleX(" + p + ")" }}></span>
      {done
        ? <span className="hold__label hold__check"><DrawCheck size={22} stroke="#fff" pop /> {doneLabel || "Accepted"}</span>
        : <span className="hold__label"><Icon name="check" size={20} /> {label}</span>}
    </button>
  );
}

// ---- GoalBar: spring fill ----
function GoalBar({ value, max }) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const [w, setW] = mState(reduce ? pct : 0);
  mEffect(() => {
    if (reduce || (typeof document !== "undefined" && document.hidden)) { setW(pct); return; }
    const id = setTimeout(() => setW(pct), 80);
    return () => clearTimeout(id);
  }, [pct, reduce]);
  return <div className="goalbar"><div className="goalbar__fill" style={{ width: w + "%" }}></div></div>;
}

// ---- RollDigits: split-flap reveal for handover code ----
function RollDigits({ text }) {
  const reduce = useReducedMotion();
  if (reduce) return <span>{text}</span>;
  return (
    <span>
      {String(text).split("").map((c, i) => <span className="roll-digit" key={i}>{c}</span>)}
    </span>
  );
}

// ---- Skeleton bits ----
function Skeleton({ w, h, r, style }) {
  return <div className="skel" style={Object.assign({ width: w || "100%", height: h || 12, borderRadius: r || 6 }, style || {})}></div>;
}
function SkeletonOrderCard() {
  return (
    <div className="card" style={{ padding: "var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Skeleton w={52} h={18} />
        <Skeleton w={80} h={22} r={6} />
        <span style={{ flex: 1 }}></span>
        <Skeleton w={38} h={14} />
      </div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
        <Skeleton w="85%" h={13} />
        <Skeleton w="55%" h={13} />
      </div>
    </div>
  );
}

// ---- PullToRefresh: pointer-driven, branded ring → skeletons ----
function PullToRefresh({ onRefresh, skeleton, children }) {
  const reduce = useReducedMotion();
  const [pull, setPull] = mState(0);
  const [refreshing, setRefreshing] = mState(false);
  const startY = mRef(null);
  const ref = mRef(null);
  const THRESH = 64;

  function down(e) {
    const el = ref.current;
    if (!el || el.scrollTop > 2 || refreshing) { startY.current = null; return; }
    startY.current = (e.touches ? e.touches[0].clientY : e.clientY);
  }
  function move(e) {
    if (startY.current == null) return;
    const y = (e.touches ? e.touches[0].clientY : e.clientY);
    const dy = y - startY.current;
    if (dy <= 0) { setPull(0); return; }
    if (ref.current.scrollTop > 2) { startY.current = null; setPull(0); return; }
    setPull(Math.min(THRESH + 24, dy * 0.5));
  }
  function up() {
    if (startY.current == null) return;
    if (pull >= THRESH && !reduce) {
      setRefreshing(true); setPull(THRESH);
      setTimeout(() => { setRefreshing(false); setPull(0); onRefresh && onRefresh(); }, 1000);
    } else { setPull(0); }
    startY.current = null;
  }

  const rot = Math.min(360, (pull / THRESH) * 320);
  return (
    <div className="ca-scroll" ref={ref}
         onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up}
         onTouchStart={down} onTouchMove={move} onTouchEnd={up}
         style={{ position: "relative" }}>
      <div style={{ height: pull, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: startY.current == null ? "height .26s var(--ease-spring-soft)" : "none" }}>
        <svg className={refreshing ? "ptr__ring" : ""} width="22" height="22" viewBox="0 0 24 24"
             style={{ opacity: Math.min(1, pull / 40) }}>
          <circle cx="12" cy="12" r="9" fill="none" stroke="var(--primary)" strokeWidth="2.5"
                  strokeLinecap="round" strokeDasharray="56" strokeDashoffset={refreshing ? 14 : 56 - (rot / 360) * 56}
                  transform={"rotate(" + rot + " 12 12)"} />
        </svg>
      </div>
      {refreshing && skeleton ? skeleton : children}
    </div>
  );
}

Object.assign(window, {
  useReducedMotion, Odometer, CountUp, DrawCheck, RingCountdown,
  HoldButton, GoalBar, RollDigits, Skeleton, SkeletonOrderCard, PullToRefresh,
});
