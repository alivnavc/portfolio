/* ============================================================
   NNDiagram — interactive ANN graph for the ANN explainer.
   Input(3) -> hidden(4, ReLU) -> output(2, softmax).
   - edges colored by weight sign, width by magnitude
   - click any neuron -> inline panel with full calculation
   - "Play forward pass" animates activation left -> right
   - optional gradient overlay (backward mode)
   Exposes window.NNDiagram.
   ============================================================ */
(function () {
  const { useState, useRef, useEffect } = React;
  const fmt = window.fmt;
  const C = window.NN.ANN;

  const LAYOUT = {
    w: 660, h: 380, R: 24,
    xs: [90, 330, 570],
    inN: 3, hidN: 4, outN: 2,
  };
  function ys(n, h, pad) { // vertical centers for n nodes
    const top = pad, bot = h - pad, span = bot - top;
    if (n === 1) return [h / 2];
    return Array.from({ length: n }, (_, i) => top + (span * i) / (n - 1));
  }

  function NNDiagram({ trace, mode }) {
    const L = LAYOUT;
    const [sel, setSel] = useState(null);       // {layer, idx}
    const [phase, setPhase] = useState(mode === "backward" ? 99 : 99); // 99 = fully shown
    const [playing, setPlaying] = useState(false);
    const timer = useRef(null);

    const inY = ys(L.inN, L.h, 60);
    const hY = ys(L.hidN, L.h, 40);
    const outY = ys(L.outN, L.h, 110);
    const back = mode === "backward";

    const x = trace.x, z1 = trace.z1, a1 = trace.a1, z2 = trace.z2, p = trace.p;

    // gradients (for backward mode) — softmax+CE wrt true class 0 (cat) by default
    const target = (trace.target != null) ? trace.target : 0;
    const y = [0, 0]; y[target] = 1;
    const dz2 = p.map((pv, i) => pv - y[i]);
    const da1 = a1.map((_, i) => dz2[0] * C.W2[i][0] + dz2[1] * C.W2[i][1]);
    const dz1 = z1.map((zv, i) => da1[i] * (zv > 0 ? 1 : 0));

    const [dir, setDir] = useState("fwd");
    function play(direction) {
      if (playing) return;
      setDir(direction); setPlaying(true); setPhase(0);
      let ph = 0;
      timer.current = setInterval(() => {
        ph += 1; setPhase(ph);
        if (ph >= 4) { clearInterval(timer.current); setPlaying(false); setPhase(99); }
      }, 1100);
    }
    useEffect(() => () => clearInterval(timer.current), []);

    // forward reveals left→right; backward reveals right→left
    const nodeOn = (layer) => dir === "bwd" || phase === 99 || phase >= (layer === 0 ? 0 : layer === 1 ? 2 : 4);
    const edgeOn = (from) => phase === 99 || (dir === "fwd" ? phase >= (from === 0 ? 1 : 3) : phase >= (from === 0 ? 4 : 2));
    // gradient labels: always in backward mode, or progressively during a backprop animation (output first)
    const gradReveal = (layer) => back || (dir === "bwd" && (phase === 99 || phase >= (layer === 2 ? 1 : 3)));

    const [hov, setHov] = useState(null);  // {layer, idx} hovered node
    function edge(x1, y1, x2, y2, w, key, lit) {
      const mag = Math.min(Math.abs(w), 1);
      const col = w >= 0 ? "var(--pos-rgb)" : "var(--neg-rgb)";
      const mx = (x1 + x2) / 2;
      const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
      return (
        <g key={key}>
          <path d={d} fill="none"
            stroke={`rgba(${col}, ${lit ? 0.95 : 0.12 + mag * 0.28})`}
            strokeWidth={lit ? 2.5 + mag * 2 : 1 + mag * 2.2}
            style={{ transition: "stroke .35s, stroke-width .25s" }} />
          {lit && (
            <path d={d} fill="none" className="nn-flow"
              stroke={dir === "bwd" ? "var(--neon)" : `rgba(${col},.95)`} strokeWidth={2.5}
              strokeDasharray="2 9" strokeLinecap="round"
              style={{ animationDirection: dir === "bwd" ? "reverse" : "normal" }} />
          )}
        </g>
      );
    }
    const litEdge = null;

    function Node({ cx, cy, val, label, layer, idx, color }) {
      const isSel = sel && sel.layer === layer && sel.idx === idx;
      const on = nodeOn(layer);
      const grad = (layer === 1 ? dz1[idx] : layer === 2 ? dz2[idx] : null);
      const showGrad = gradReveal(layer) && grad != null;
      const fillv = val == null ? 0 : Math.min(Math.abs(val), 1);
      return (
        <g style={{ cursor: layer === 0 ? "default" : "pointer", opacity: on ? 1 : 0.25, transition: "opacity .5s" }}
          onClick={() => layer !== 0 && setSel(isSel ? null : { layer, idx })}
          onMouseEnter={() => setHov({ layer, idx })} onMouseLeave={() => setHov(null)}>
          <circle cx={cx} cy={cy} r={L.R}
            fill={val >= 0 ? `rgba(${color},${0.12 + fillv * 0.5})` : `rgba(var(--neg-rgb),${0.12 + fillv * 0.5})`}
            stroke={isSel ? "var(--neon)" : showGrad ? "var(--neon)" : `rgba(${color},.6)`} strokeWidth={isSel || showGrad ? 3 : 1.5}
            style={{ filter: isSel ? "drop-shadow(0 0 8px rgba(var(--neon-rgb),.6))" : (on && phase !== 99 ? "drop-shadow(0 0 6px rgba(var(--neon-rgb),.5))" : "none"), transition: "stroke .4s" }} />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
            fontFamily="var(--num-font)" fontSize="12" fontWeight="700" fill="var(--ink)">{val == null ? "" : fmt(val)}</text>
          <text x={cx} y={cy + L.R + 14} textAnchor="middle" fontFamily="var(--ui-font)" fontSize="11" fontWeight="600" fill="var(--muted)">{label}</text>
          {showGrad && (
            <text x={cx} y={cy - L.R - 7} textAnchor="middle" fontFamily="var(--num-font)" fontSize="10.5" fontWeight="800" fill="var(--neon)">∂{fmt(grad)}</text>
          )}
        </g>
      );
    }

    // calculation panel for selected neuron
    function Panel() {
      if (!sel) return null;
      if (sel.layer === 1) {
        const j = sel.idx;
        const terms = x.map((xi, i) => ({ a: xi, b: C.W1[i][j] }));
        const reluD = z1[j] > 0 ? 1 : 0;
        return (
          <div className="nn-calc">
            <div className="nn-calc-h">Hidden neuron h{j}</div>
            <div className="nn-calc-fwd">FORWARD</div>
            <div className="nn-calc-row"><b>1. Weighted sum</b> z₁[{j}] = Σ xᵢ·W₁[i][{j}] + b₁[{j}]</div>
            <div className="nn-calc-terms">
              {terms.map((t, i) => (<span key={i} className="nn-term">{i > 0 && <i>+</i>}<span>{fmt(t.a)}</span>×<span>{fmt(t.b)}</span></span>))}
              <span className="nn-term"><i>+</i><span>{fmt(C.b1[j])}</span><em>(bias)</em></span>
            </div>
            <div className="nn-calc-eq">= {fmt(z1[j])}</div>
            <div className="nn-calc-row"><b>2. Activation</b> a₁[{j}] = ReLU(z₁[{j}]) = max(0, {fmt(z1[j])}) <b className="nn-calc-res">= {fmt(a1[j])}</b></div>
            <div className="nn-calc-bwd">BACKWARD · chain rule</div>
            <div className="nn-calc-row"><b>∂L/∂a₁[{j}]</b> = Σₖ ∂L/∂z₂[k]·W₂[{j}][k]</div>
            <div className="nn-calc-terms">
              {dz2.map((g, k) => (<span key={k} className="nn-term">{k > 0 && <i>+</i>}<span>{fmt(g)}</span>×<span>{fmt(C.W2[j][k])}</span></span>))}
              <span className="nn-eqs">= {fmt(da1[j])}</span>
            </div>
            <div className="nn-calc-row"><b>∂L/∂z₁[{j}]</b> = ∂L/∂a₁[{j}] · ReLU′(z₁[{j}]) = {fmt(da1[j])} × {reluD} <b className="nn-calc-res">= {fmt(dz1[j])}</b></div>
            <div className="nn-calc-note">ReLU′ = {reluD} because z₁ {z1[j] > 0 ? "> 0 (neuron fired)" : "≤ 0 (neuron dead → no gradient)"}. Each weight's gradient: ∂L/∂W₁[i][{j}] = xᵢ · ∂L/∂z₁[{j}].</div>
          </div>
        );
      }
      const j = sel.idx;
      const terms = a1.map((av, i) => ({ a: av, b: C.W2[i][j] }));
      const ex = z2.map((z) => Math.exp(z)); const s = ex.reduce((a, b) => a + b, 0);
      return (
        <div className="nn-calc">
          <div className="nn-calc-h">Output neuron "{C.labels[j]}"</div>
          <div className="nn-calc-fwd">FORWARD</div>
          <div className="nn-calc-row"><b>1. Weighted sum</b> z₂[{j}] = Σ a₁ᵢ·W₂[i][{j}] + b₂[{j}]</div>
          <div className="nn-calc-terms">
            {terms.map((t, i) => (<span key={i} className="nn-term">{i > 0 && <i>+</i>}<span>{fmt(t.a)}</span>×<span>{fmt(t.b)}</span></span>))}
            <span className="nn-term"><i>+</i><span>{fmt(C.b2[j])}</span><em>(bias)</em></span>
          </div>
          <div className="nn-calc-eq">= {fmt(z2[j])}</div>
          <div className="nn-calc-row"><b>2. Softmax</b> e^{fmt(z2[j])} / Σe^z = {fmt(ex[j])} / {fmt(s)} <b className="nn-calc-res">= {fmt(p[j])}</b></div>
          <div className="nn-calc-bwd">BACKWARD · chain rule</div>
          <div className="nn-calc-row"><b>∂L/∂z₂[{j}]</b> = P[{j}] − y[{j}] = {fmt(p[j])} − {y[j]} <b className="nn-calc-res">= {fmt(dz2[j])}</b></div>
          <div className="nn-calc-note">(true label = "{C.labels[target]}".) This neat form is why softmax pairs with cross-entropy loss. Each weight's gradient: ∂L/∂W₂[i][{j}] = a₁ᵢ · ∂L/∂z₂[{j}].</div>
        </div>
      );
    }

    return (
      <div className="nn-diagram">
        <div className="nn-diagram-bar">
          <button className="tf-headbtn is-on" onClick={() => play("fwd")} disabled={playing}>▶ Play forward pass</button>
          <button className="tf-headbtn" onClick={() => play("bwd")} disabled={playing}>◀ Play backprop</button>
          <span className="nn-diagram-hint">Hover a neuron to light its connections; click for the full math. Play to animate the flow.</span>
        </div>
        <svg viewBox={`0 0 ${L.w} ${L.h}`} className="nn-svg">
          {/* layer labels */}
          <text x={L.xs[0]} y={20} textAnchor="middle" className="nn-layerlbl">INPUT</text>
          <text x={L.xs[1]} y={20} textAnchor="middle" className="nn-layerlbl">HIDDEN · ReLU</text>
          <text x={L.xs[2]} y={20} textAnchor="middle" className="nn-layerlbl">OUTPUT · softmax</text>
          {/* edges input->hidden */}
          {inY.map((y1, i) => hY.map((y2, j) => {
            const a = sel || hov;
            const lit = a ? (a.layer === 1 ? a.idx === j : a.layer === 0 ? a.idx === i : false) : false;
            return edgeOn(0) ? edge(L.xs[0], y1, L.xs[1], y2, C.W1[i][j], "e0-" + i + "-" + j, lit) : null;
          }))}
          {/* edges hidden->output */}
          {hY.map((y1, i) => outY.map((y2, j) => {
            const a = sel || hov;
            const lit = a ? (a.layer === 2 ? a.idx === j : a.layer === 1 ? a.idx === i : false) : false;
            return edgeOn(1) ? edge(L.xs[1], y1, L.xs[2], y2, C.W2[i][j], "e1-" + i + "-" + j, lit) : null;
          }))}
          {/* nodes */}
          {inY.map((cy, i) => <Node key={"in" + i} cx={L.xs[0]} cy={cy} val={x[i]} label={C.featNames[i]} layer={0} idx={i} color="var(--pos-rgb)" />)}
          {hY.map((cy, j) => <Node key={"h" + j} cx={L.xs[1]} cy={cy} val={a1[j]} label={"h" + j} layer={1} idx={j} color="var(--pos-rgb)" />)}
          {outY.map((cy, j) => <Node key={"o" + j} cx={L.xs[2]} cy={cy} val={p[j]} label={C.labels[j]} layer={2} idx={j} color="var(--pos-rgb)" />)}
        </svg>
        <Panel />
      </div>
    );
  }

  window.NNDiagram = NNDiagram;
})();
