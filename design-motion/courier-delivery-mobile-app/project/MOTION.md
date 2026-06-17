# Alpha POS — Courier App · MOTION SPEC

A coding agent can reproduce the motion layer 1:1 from this document. It maps every
animation to its **trigger**, **what moves**, **duration**, and **easing**. The layer is
purely additive over the existing prototype — no screen, layout, token, copy, scope, or
language was changed.

## Principles
- **Palette:** motion color is `--primary` (brand blue) and `--success` (green) only. Never rainbow.
- **Springs over linear.** Shared curves (defined in `styles/motion.css`):
  - `--ease-spring: cubic-bezier(.34,1.56,.64,1)` — overshoot pop (accept, badge, tab icon, roll-in)
  - `--ease-spring-soft: cubic-bezier(.22,1,.36,1)` — settle, no overshoot (odometer, bars)
  - `--ease-out: cubic-bezier(.16,1,.3,1)` — entrances, draws, ripples
- **Timing:** micro-interactions 150–300ms; celebrations < ~1s.
- **Reduced motion:** every keyframe lives inside `@media (prefers-reduced-motion: no-preference)`.
  Every base (un-animated) state is the **visible end-state**, so `prefers-reduced-motion: reduce`
  renders final content instantly. JS animators (`Odometer`, `CountUp`, `GoalBar`, `RingCountdown`,
  `HoldButton`, `PullToRefresh`) check the reduced-motion media query **and** `document.hidden`
  and jump straight to the final value when either holds (this also keeps backgrounded tabs and
  screenshots fully legible).

## Files
- `styles/motion.css` — all keyframes, the reduced-motion gate, global press-scale, stagger, static structure.
- `app/motion.jsx` — JS primitives, attached to `window`: `useReducedMotion, Odometer, CountUp, DrawCheck, RingCountdown, HoldButton, GoalBar, RollDigits, Skeleton, SkeletonOrderCard, PullToRefresh`.
- Wiring lives in `app/components.jsx` (TabBar, MapView, IncomingOrderSheet), `app/screens.jsx` (Orders, Today, OrderDetail, Cash), `app/payments.jsx` (QR/Cash/Split/Paid), `app/app.jsx` (incoming trigger, tab-badge count, motion-demo tweak).

---

## GLOBAL
| Animation | Trigger | What moves | Duration / Easing |
|---|---|---|---|
| **Button press-scale** | `:active` on `.btn .iconbtn .key .amt-chip .paymethod .napp .tab .seg__btn .ocard .balance-pill .lrow .provchip` | `transform: scale()` -> 0.90-0.985 by element, spring-back on release | 180ms `--ease-spring` |
| **List/content entrance (stagger)** | mount of any child of `.ca-scroll .ca-stack`, `.kgrid`, NavSheet rows | `transform: translateY(10px->0)` (transform-only so paused/hidden state stays visible) | 420ms `--ease-out`, stagger ~60ms via `:nth-child` delays |
| **Skeleton shimmer** | `.skel` present (loaders) | gradient sweep `translateX(-100%->100%)` | 1.3s ease-in-out loop |

## NEW ORDER ARRIVES  (`IncomingOrderSheet`, `RingCountdown`, `HoldButton`)
| Animation | Trigger | What moves | Duration / Easing |
|---|---|---|---|
| **Sheet springs up** | new order appears (`incoming` set; demo via Tweaks -> "Simulate new order") | `.incoming` `transform: translateY(100%->0)` (`@keyframes sheetup`) | 340ms `--ease-spring` |
| **Accept-countdown ring** | sheet mount | SVG `circle` `stroke-dashoffset` depletes over the window; mono seconds tick in `--font-mono`; color shifts `--primary -> --warning (<=6s) -> --error (<=3s)` | per-100ms tick; stroke 150ms linear, color 300ms |
| **Near-zero urgency** | `left <= 5s` | `.ring-countdown.is-urgent` `transform: scale(1<->1.04)` pulse | 500ms ease-in-out loop |
| **Press-and-hold accept** | pointer/touch down on `HoldButton` | `.hold__fill` `transform: scaleX(0->1)` fills with `--primary`; on full -> snaps to **drawn checkmark** (`DrawCheck`, white) | fill = `holdMs` 850ms linear; check pop 400ms `--ease-spring` |
| **Orders tab badge bump + glow** | `orderCount` increases (on accept) | `.tab__badge.is-bump` `transform: scale(1->1.5->1)` + one-time `::after` glow ring `scale(.7->2.2)` fade | bump 500ms `--ease-spring`; glow 600ms `--ease-out` |

## LIVE COUNTS
| Animation | Trigger | What moves | Duration / Easing |
|---|---|---|---|
| **Odometer rolling digits** | Orders quick-stats mount / value change | per-digit `.odo__roll` `transform: translateY(-d em)` rolls a 0-9 column | 620ms `--ease-spring-soft` |
| **KPI count-up** | Today KPI tiles mount (`CountUp`) | numeric tween 0->value (rAF, easeOutCubic), staggered with `.kgrid` `:nth-child` entrance | 900ms; stagger ~60ms |
| **Daily-goal bar fill** | Orders mount / deliveries change (`GoalBar`) | `.goalbar__fill` `width: 0->pct%` spring | 600ms `--ease-spring-soft` |

## ORDER DELIVERED  (`OrderDetail`)
| Animation | Trigger | What moves | Duration / Easing |
|---|---|---|---|
| **Status-pill morph** | `step` changes (header `Badge key={step}`) | `.badge.is-morph` label+color crossfade `opacity / translateY(-3px->0)` | 400ms `--ease-out` |
| **Delivered celebration** | advance to `DELIVERED` (`celebrate` true ~1.3s) | `.celebrate` overlay `fadeIn`; `DrawCheck` self-draws (ring + tick `stroke-dashoffset`) and `pop` scales in; one `.ripple` `--success` ring `scale(.5->2.4)` fade | overlay 200ms; check draw 2x500ms; pop 450ms `--ease-spring`; ripple 800ms `--ease-out` |
| **+fee float-up** | same | `.floatup` "+<amount> so'm" `translateY(6px->-34px)` + opacity in->out | 1.1s `--ease-out` |
| **Delivered card leaves list** | (class ready) `.ocard--leaving` | `translateX(0->40px)` + opacity->0 + `max-height->0` collapse | 500ms `--ease-out` |

## QR / PAYMENT  (`payments.jsx`)
| Animation | Trigger | What moves | Duration / Easing |
|---|---|---|---|
| **QR breathing pulse** | QR waiting (`.qrcard.is-waiting`) | box-shadow ring `0->10px` `--primary` tint breathes | 2.6s ease-in-out loop |
| **QR scanning shimmer** | QR waiting (`.qr-shimmer`, skipped in reduced motion) | conic-gradient ring `rotate(360deg)` masked to the QR edge | 2.2s linear loop |
| **Paid: QR -> checkmark** | webhook/cash settle -> `status==="paid"` | `.paid-burst` pops; `DrawCheck` (`--success-strong`) self-draws; white `.ripple` ring expands; "Payment received" + rows slide up (`enterUp`, staggered) | pop 450ms `--ease-spring`; draw 2x500ms; ripple 800ms; rows 400ms + stagger |
| **Cash change-due tween** | entered amount changes (`change-banner__v key={diff}`) | `.is-tween` `scale(1.12->1)` + opacity | 300ms `--ease-out` |
| **Numpad key press** | `:active` on `.key` | `transform: scale(.92)` spring-back | 180ms `--ease-spring` |
| **Split two-segment bar** | cash amount adjusts | `.split-meter__cash` / `__qr` `width` transition (cash then QR) | 500ms `--ease-spring-soft` |

## SHIFT / TOGGLES / MAP
| Animation | Trigger | What moves | Duration / Easing |
|---|---|---|---|
| **Settle: cash sweeps to zero** | confirm settle (`cashNow->0`) | `Odometer` rolls "Cash in hand" digits down to 0 | 620ms `--ease-spring-soft` |
| **Handover code roll-in** | handover sheet opens (`RollDigits`) | each char `.roll-digit` `rotateX(-90deg->0)` + opacity, sequential | 500ms `--ease-spring`, 50ms steps |
| **Online toggle color sweep** | toggle on | `.switch.is-on` knob `translateX` + brief `switchSweep` saturate; existing 180ms transition | knob 180ms `cubic-bezier(.3,1.3,.5,1)`; sweep 300ms |
| **Online breathing dot** | while online | `.shift-toggle.is-on .shift-toggle__dot` box-shadow `3px<->6px` `--success` halo | 2.4s ease-in-out loop |
| **Map live-location ring** | `MapView` with coords | `.mapview__me-ring` `scale(.7->3)` + fade, expanding from courier marker | 1.8s `--ease-out` loop |
| **Map route draw** | `MapView` with coords | route `path` `stroke-dashoffset 360->0` draws toward destination | 1.4s `--ease-out`, 200ms delay |
| **NavSheet apps stagger** | sheet opens | `.sheet .napp` `enterUp` sequential | 340ms `--ease-out`, ~50ms steps |

## TAB BAR
| Animation | Trigger | What moves | Duration / Easing |
|---|---|---|---|
| **Active icon spring** | tab becomes active | active `.tab .ic` `translateY/scale` overshoot (`tabPop`) | 420ms `--ease-spring` |
| **Sliding indicator** | active tab changes | `.tab__ind` `transform: translateX(index x 100%)` | 340ms `--ease-spring` |

## PULL-TO-REFRESH  (`PullToRefresh`, Orders list)
| Animation | Trigger | What moves | Duration / Easing |
|---|---|---|---|
| **Pull indicator** | drag down at scrollTop 0 | branded ring grows/rotates with drag (`stroke-dashoffset` + `rotate`); over threshold -> spins (`.ptr__ring`) and shows skeleton cards ~1s, then restores | rotate follows drag; spin 700ms linear; release height 260ms `--ease-spring-soft` |

---

### Reproduction notes for a coding agent
1. Keep the reduced-motion contract: declare keyframes only inside `@media (prefers-reduced-motion: no-preference)`; make the base style the final visible state. JS animators must early-return to the final value when `matchMedia('(prefers-reduced-motion: reduce)').matches` **or** `document.hidden`.
2. Never animate an element's *visibility* (`opacity:0` held state) for content that must always be legible — `enterUp` is transform-only for this reason.
3. All durations/easings above are the source of truth; the spring curves are the three CSS vars at the top of `styles/motion.css`.
4. Color is restricted to `--primary` and `--success` (+ `--warning`/`--error` only for the countdown urgency shift).
