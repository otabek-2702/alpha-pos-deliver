/* ============================================================
   QRCode — renders the deterministic matrix (lib/qr.ts) as SVG,
   ported from app/payments.jsx QRCode. PRODUCTION must encode the
   real pay-link from the backend's create_payment (§3).
   ============================================================ */
import React, { useMemo } from 'react';
import Svg, { G, Rect } from 'react-native-svg';
import { qrMatrix } from '@/lib/qr';

export function QRCode({ payload, size = 232 }: { payload: string; size?: number }) {
  const grid = useMemo(() => qrMatrix(payload, 29), [payload]);
  const n = grid.length;
  const cell = size / n;

  const rects: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r]![c]) {
        rects.push(
          <Rect
            key={`${r}-${c}`}
            x={Number((c * cell).toFixed(2))}
            y={Number((r * cell).toFixed(2))}
            width={Number((cell + 0.4).toFixed(2))}
            height={Number((cell + 0.4).toFixed(2))}
            rx={Number((cell * 0.16).toFixed(2))}
          />,
        );
      }
    }
  }

  return (
    <Svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <G fill="#0E1219">{rects}</G>
    </Svg>
  );
}
