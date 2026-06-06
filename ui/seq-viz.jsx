/* ============================================================
   RNN / LSTM visual diagrams:
     window.SeqUnroll({type, trace})  — cells unrolled across time
     window.CellInternal({type, trace}) — inside one cell
     window.LayerStack({type})        — stacked recurrent layers
   type: "rnn" | "lstm"
   ============================================================ */
(function () {
  const fmt = window.fmt;

  /* ---- unrolled chain across time ---- */
  function SeqUnroll({ type, trace }) {
    const isL = type === "lstm";
    const steps = trace.steps;
    const n = steps.length;
    const W = 130, gap = 24, x0 = 70, cellY = 120, cellW = 84, cellH = 64;
    const totalW = x0 + n * (cellW + gap) + 40;
    const H = 250;
    const cx = (t) => x0 + t * (cellW + gap);
    const col = isL ? "124,92,255" : "var(--pos-rgb)";
    return (
      <svg viewBox={`0 0 ${Math.max(totalW, 560)} ${H}`} className="seq-svg">
        {/* cell-state line (LSTM only) */}
        {isL && <line x1="20" y1="46" x2={totalW - 20} y2="46" stroke="rgba(124,92,255,.5)" strokeWidth="2.5" />}
        {isL && <text x="24" y="38" className="seq-lbl" fill="#5b3fe0">cell state c →</text>}
        {/* hidden-state line */}
        <line x1="20" y1={cellY + cellH + 18} x2={totalW - 20} y2={cellY + cellH + 18} stroke="rgba(var(--pos-rgb),.4)" strokeWidth="2" />
        <text x="24" y={cellY + cellH + 34} className="seq-lbl">hidden state h →</text>
        {steps.map((s, t) => {
          const x = cx(t);
          return (
            <g key={t}>
              {/* input arrow */}
              <line x1={x + cellW / 2} y1={H - 30} x2={x + cellW / 2} y2={cellY + cellH} stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#sarr)" />
              <text x={x + cellW / 2} y={H - 16} textAnchor="middle" className="seq-x">x{t + 1}=[{s.x.map((v) => fmt(v)).join(",")}]</text>
              {/* cell box */}
              <rect x={x} y={cellY} width={cellW} height={cellH} rx="9" fill={`rgba(${col},.12)`} stroke={`rgba(${col},.7)`} strokeWidth="1.6" />
              <text x={x + cellW / 2} y={cellY + 22} textAnchor="middle" className="seq-cell">{isL ? "LSTM" : "RNN"}</text>
              <text x={x + cellW / 2} y={cellY + 40} textAnchor="middle" className="seq-cell-sub">cell</text>
              <text x={x + cellW / 2} y={cellY + 55} textAnchor="middle" className="seq-t">t{t + 1}</text>
              {/* h up into cell */}
              <line x1={x + cellW / 2} y1={cellY + cellH} x2={x + cellW / 2} y2={cellY + cellH + 18} stroke={`rgba(${col},.5)`} strokeWidth="1.5" />
              {/* h value above */}
              <text x={x + cellW / 2} y={cellY - 8} textAnchor="middle" className="seq-h">h{t + 1}=[{s.h.map((v) => fmt(v)).join(",")}]</text>
              <line x1={x + cellW / 2} y1={cellY} x2={x + cellW / 2} y2={cellY - 4} stroke={`rgba(${col},.5)`} strokeWidth="1.5" />
            </g>
          );
        })}
        <defs><marker id="sarr" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 z" fill="var(--muted)" /></marker></defs>
      </svg>
    );
  }

  /* ---- internal mechanics of one cell ---- */
  function CellInternal({ type, trace }) {
    if (type !== "lstm") {
      // RNN: x and h_prev combine -> +b -> tanh -> h
      return (
        <svg viewBox="0 0 560 220" className="seq-svg">
          <rect x="20" y="60" width="520" height="120" rx="14" fill="rgba(var(--pos-rgb),.05)" stroke="rgba(var(--pos-rgb),.4)" strokeDasharray="4 3" />
          <text x="40" y="50" className="seq-lbl">inside one RNN cell</text>
          <g className="seq-io"><rect x="40" y="150" width="84" height="30" rx="6" fill="rgba(var(--pos-rgb),.18)" /><text x="82" y="170" textAnchor="middle" className="seq-box">xₜ</text></g>
          <g className="seq-io"><rect x="40" y="90" width="84" height="30" rx="6" fill="rgba(120,120,140,.18)" /><text x="82" y="110" textAnchor="middle" className="seq-box">hₜ₋₁</text></g>
          <line x1="124" y1="105" x2="200" y2="120" stroke="var(--muted)" strokeWidth="1.5" /><line x1="124" y1="165" x2="200" y2="130" stroke="var(--muted)" strokeWidth="1.5" />
          <rect x="200" y="105" width="120" height="40" rx="8" fill="rgba(var(--pos-rgb),.14)" stroke="rgba(var(--pos-rgb),.6)" /><text x="260" y="129" textAnchor="middle" className="seq-box">·Wxh + ·Whh + b</text>
          <line x1="320" y1="125" x2="370" y2="125" stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#sarr2)" />
          <rect x="370" y="105" width="70" height="40" rx="8" fill="rgba(31,158,107,.16)" stroke="#1f9e6b" /><text x="405" y="129" textAnchor="middle" className="seq-box">tanh</text>
          <line x1="440" y1="125" x2="500" y2="125" stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#sarr2)" />
          <text x="520" y="129" textAnchor="middle" className="seq-box" fill="var(--accent-ink)">hₜ</text>
          <defs><marker id="sarr2" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 z" fill="var(--muted)" /></marker></defs>
        </svg>
      );
    }
    // LSTM cell schematic
    const G = (x, y, w, label, cls, fill) => (
      <g><rect x={x} y={y} width={w} height="26" rx="6" fill={fill} stroke="currentColor" className={"seq-gate " + cls} /><text x={x + w / 2} y={y + 18} textAnchor="middle" className="seq-box">{label}</text></g>
    );
    const opc = (x, y, t) => (<g><circle cx={x} cy={y} r="11" fill="var(--panel-solid)" stroke="var(--muted)" /><text x={x} y={y + 4} textAnchor="middle" className="seq-op">{t}</text></g>);
    return (
      <svg viewBox="0 0 620 280" className="seq-svg">
        <rect x="20" y="20" width="580" height="210" rx="14" fill="rgba(124,92,255,.05)" stroke="rgba(124,92,255,.4)" strokeDasharray="4 3" />
        {/* cell-state highway */}
        <line x1="20" y1="55" x2="600" y2="55" stroke="#7c5cff" strokeWidth="3" />
        <text x="30" y="46" className="seq-lbl" fill="#5b3fe0">cₜ₋₁ ───────────────► cₜ  (cell state)</text>
        {opc(250, 55, "×")} {opc(360, 55, "+")}
        {/* forget gate up to × */}
        {G(210, 150, 80, "σ  forget f", "f", "rgba(224,73,46,.16)")}
        <line x1="250" y1="150" x2="250" y2="66" stroke="#c23a22" strokeWidth="1.5" markerEnd="url(#sa3)" />
        {/* input gate + candidate up to + */}
        {G(310, 150, 46, "σ  i", "i", "rgba(31,158,107,.16)")}
        {G(366, 150, 56, "tanh g", "g", "rgba(43,91,255,.16)")}
        {opc(350, 110, "×")}
        <line x1="333" y1="150" x2="345" y2="120" stroke="#178055" strokeWidth="1.5" /><line x1="394" y1="150" x2="358" y2="118" stroke="#2b5bff" strokeWidth="1.5" />
        <line x1="350" y1="99" x2="355" y2="66" stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#sa3)" />
        {/* output gate */}
        {G(470, 150, 80, "σ  output o", "o", "rgba(124,92,255,.16)")}
        {opc(510, 100, "×")}
        <rect x="486" y="74" width="48" height="22" rx="5" fill="rgba(124,92,255,.12)" stroke="#7c5cff" /><text x="510" y="90" textAnchor="middle" className="seq-box">tanh</text>
        <line x1="490" y1="55" x2="510" y2="74" stroke="#7c5cff" strokeWidth="1.5" />
        <line x1="510" y1="111" x2="510" y2="150" stroke="#5b3fe0" strokeWidth="1.5" />
        <line x1="510" y1="96" x2="510" y2="89" stroke="#5b3fe0" strokeWidth="1.5" />
        {/* hidden line */}
        <line x1="20" y1="200" x2="600" y2="200" stroke="rgba(124,92,255,.4)" strokeWidth="2" />
        <text x="30" y="218" className="seq-lbl">hₜ₋₁ ──► gates ;  hₜ = o × tanh(cₜ) ──► out</text>
        {/* input */}
        <text x="120" y="250" textAnchor="middle" className="seq-x">xₜ + hₜ₋₁ feed all 4 gates</text>
        <line x1="120" y1="240" x2="250" y2="176" stroke="var(--muted)" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="120" y1="240" x2="330" y2="176" stroke="var(--muted)" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="120" y1="240" x2="510" y2="176" stroke="var(--muted)" strokeWidth="1" strokeDasharray="2 2" />
        <defs><marker id="sa3" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 z" fill="var(--muted)" /></marker></defs>
      </svg>
    );
  }

  /* ---- stacked recurrent layers ---- */
  function LayerStack({ type }) {
    const isL = type === "lstm";
    const n = 4, layers = 2, x0 = 80, gap = 24, cellW = 70, cellH = 40;
    const cx = (t) => x0 + t * (cellW + gap);
    const W = x0 + n * (cellW + gap) + 30, H = 230;
    const col = isL ? "124,92,255" : "var(--pos-rgb)";
    const rowY = [150, 70];
    return (
      <svg viewBox={`0 0 ${Math.max(W, 520)} ${H}`} className="seq-svg">
        <text x="20" y="20" className="seq-lbl">2 stacked layers — layer 1's hidden states are layer 2's inputs</text>
        {[0, 1].map((L) => (
          <g key={L}>
            <text x="24" y={rowY[L] + 26} className="seq-t">L{L + 1}</text>
            {Array.from({ length: n }).map((_, t) => (
              <g key={t}>
                <rect x={cx(t)} y={rowY[L]} width={cellW} height={cellH} rx="7" fill={`rgba(${col},.12)`} stroke={`rgba(${col},.7)`} />
                <text x={cx(t) + cellW / 2} y={rowY[L] + 25} textAnchor="middle" className="seq-cell-sub">{isL ? "LSTM" : "RNN"} t{t + 1}</text>
                {t < n - 1 && <line x1={cx(t) + cellW} y1={rowY[L] + cellH / 2} x2={cx(t + 1)} y2={rowY[L] + cellH / 2} stroke={`rgba(${col},.6)`} strokeWidth="1.6" markerEnd="url(#sa4)" />}
                {L === 0 && <line x1={cx(t) + cellW / 2} y1={rowY[0]} x2={cx(t) + cellW / 2} y2={rowY[1] + cellH} stroke="var(--muted)" strokeWidth="1.4" markerEnd="url(#sa4)" />}
                {L === 0 && <line x1={cx(t) + cellW / 2} y1={rowY[0] + cellH} x2={cx(t) + cellW / 2} y2={H - 26} stroke="var(--muted)" strokeWidth="1" />}
              </g>
            ))}
          </g>
        ))}
        {Array.from({ length: n }).map((_, t) => <text key={t} x={cx(t) + cellW / 2} y={H - 12} textAnchor="middle" className="seq-x">x{t + 1}</text>)}
        <text x={cx(n - 1) + cellW + 4} y={rowY[1] + 25} className="seq-x" fill="var(--accent-ink)">→ output</text>
        <defs><marker id="sa4" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 z" fill="var(--muted)" /></marker></defs>
      </svg>
    );
  }

  window.SeqUnroll = SeqUnroll;
  window.CellInternal = CellInternal;
  window.LayerStack = LayerStack;
})();
