/* ============================================================
   CNN visuals — animated sliding-window convolution + a
   feature-map flow diagram (image → conv → pool → dense).
   Exposes window.CNNConvViz and window.CNNFlow.
   ============================================================ */
(function () {
  const { useState, useRef, useEffect } = React;
  const fmt = window.fmt;
  const C = window.NN.CNN;

  function gray(v) { const g = Math.round(v * 255); return `rgb(${g},${g},${g})`; }
  function heat(v, max) { const a = Math.max(0, Math.min(1, v / (max || 1))); return `rgba(var(--pos-rgb),${0.12 + a * 0.7})`; }

  /* ---- animated convolution: slide the kernel, fill the feature map ---- */
  function CNNConvViz({ trace }) {
    const out = trace.conv.length;           // 4
    const total = out * out;                 // 16 positions
    const [pos, setPos] = useState(total - 1);
    const [playing, setPlaying] = useState(false);
    const timer = useRef(null);
    const r = Math.floor(pos / out), c = pos % out;

    function play() {
      if (playing) return; setPlaying(true); setPos(0);
      let p = 0;
      timer.current = setInterval(() => {
        p += 1;
        if (p >= total) { clearInterval(timer.current); setPlaying(false); setPos(total - 1); }
        else setPos(p);
      }, 600);
    }
    useEffect(() => () => clearInterval(timer.current), []);

    const fmMax = Math.max(...trace.conv.flat().map((v) => Math.abs(v)), 1);
    // current patch terms
    const terms = [];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) terms.push({ img: trace.img[r + a][c + b], k: C.kernel[a][b] });
    const sum = terms.reduce((s, t) => s + t.img * t.k, 0);

    return (
      <div className="cnn-viz">
        <div className="nn-diagram-bar">
          <button className="tf-headbtn is-on" onClick={play} disabled={playing}>▶ Slide the kernel</button>
          <button className="tf-headbtn" onClick={() => setPos((p) => Math.max(0, p - 1))} disabled={playing}>‹</button>
          <button className="tf-headbtn" onClick={() => setPos((p) => Math.min(total - 1, p + 1))} disabled={playing}>›</button>
          <span className="nn-diagram-hint">Position {pos + 1}/{total} — the 3×3 window multiplies the kernel and sums to one output cell.</span>
        </div>
        <div className="cnn-viz-row">
          <div>
            <div className="cnn-cap">input image · 6×6</div>
            <div className="cnn-grid" style={{ gridTemplateColumns: "repeat(6, 30px)" }}>
              {trace.img.map((row, i) => row.map((v, j) => {
                const inWin = i >= r && i < r + 3 && j >= c && j < c + 3;
                return <div key={i + "-" + j} className={"cnn-cell" + (inWin ? " in-win" : "")} style={{ background: gray(v) }}>
                  <span style={{ color: v > 0.5 ? "#111" : "#eee" }}>{fmt(v)}</span>
                </div>;
              }))}
            </div>
          </div>
          <div className="cnn-arrow">⊛<small>kernel</small></div>
          <div>
            <div className="cnn-cap">feature map · 4×4</div>
            <div className="cnn-grid" style={{ gridTemplateColumns: `repeat(${out}, 34px)` }}>
              {trace.conv.map((row, i) => row.map((v, j) => {
                const done = i * out + j <= pos;
                const cur = i === r && j === c;
                return <div key={i + "-" + j} className={"cnn-cell fm" + (cur ? " cur" : "")} style={{ background: done ? heat(v, fmMax) : "var(--line-soft)" }}>
                  {done ? <span>{fmt(v)}</span> : ""}
                </div>;
              }))}
            </div>
          </div>
        </div>
        <div className="cnn-calc">
          <b>Output cell (r{r}, c{c})</b> = Σ (patch × kernel):
          <div className="cnn-terms">
            {terms.map((t, i) => (<span key={i} className="nn-term">{i > 0 && <i>+</i>}<span>{fmt(t.img)}</span>×<span>{fmt(t.k)}</span></span>))}
            <span className="nn-eqs">= {fmt(sum)}</span>
          </div>
        </div>
      </div>
    );
  }

  /* ---- feature-map flow (network-style overview) ---- */
  function gridMini(data, max, key, label, shape) {
    const n = data[0].length;
    return (
      <div className="cnn-mini" key={key}>
        <div className="cnn-cap">{label}</div>
        <div className="cnn-grid sm" style={{ gridTemplateColumns: `repeat(${n}, 16px)` }}>
          {data.map((row, i) => row.map((v, j) => (
            <div key={i + "-" + j} className="cnn-cell xs" style={{ background: max === "gray" ? gray(v) : heat(v, max) }} />
          )))}
        </div>
        <div className="cnn-shape">{shape}</div>
      </div>
    );
  }
  function CNNFlow({ trace }) {
    const fmMax = Math.max(...trace.act.flat(), 1);
    const poolMax = Math.max(...trace.pool.flat(), 1);
    return (
      <div className="cnn-flow">
        {gridMini(trace.img, "gray", "img", "image", "6×6")}
        <div className="cnn-arrow sm">conv ⊛</div>
        {gridMini(trace.act, fmMax, "fm", "feature map", "4×4")}
        <div className="cnn-arrow sm">pool ▾</div>
        {gridMini(trace.pool, poolMax, "pool", "pooled", "2×2")}
        <div className="cnn-arrow sm">flatten →</div>
        <div className="cnn-mini">
          <div className="cnn-cap">dense</div>
          <div className="cnn-bars">
            {trace.p.map((pv, i) => (
              <div key={i} className="cnn-bar"><div className="cnn-bar-fill" style={{ height: (pv * 56 + 6) + "px" }} /><span>{C.labels[i]}</span></div>
            ))}
          </div>
          <div className="cnn-shape">2 classes</div>
        </div>
      </div>
    );
  }

  window.CNNConvViz = CNNConvViz;
  window.CNNFlow = CNNFlow;

  /* ---- full architecture as tensor "volume" blocks ---- */
  function CNNArchViz() {
    const W = 760, H = 240;
    const vol = (x, yc, w, h, depth, color, key) => {
      const off = 3.2, rects = [];
      for (let d = depth - 1; d >= 0; d--) {
        rects.push(<rect key={key + d} x={x + d * off} y={yc - h / 2 - d * off} width={w} height={h} rx="3"
          fill={`rgba(${color}, ${0.18 + (1 - d / depth) * 0.35})`} stroke={`rgba(${color},.7)`} strokeWidth="1" />);
      }
      return <g key={key}>{rects}</g>;
    };
    const lbl = (x, y, t, sub) => (<g key={"l" + x + t}><text x={x} y={y} textAnchor="middle" className="cnn-arch-t">{t}</text>{sub && <text x={x} y={y + 13} textAnchor="middle" className="cnn-arch-s">{sub}</text>}</g>);
    const op = (x, y, t) => <text key={"o" + x + "-" + y} x={x} y={y} textAnchor="middle" className="cnn-arch-op">{t}</text>;
    const yc = 120;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="cnn-archviz">
        {vol(40, yc, 46, 46, 1, "120,120,140", "v0")}
        {lbl(63, 185, "input", "6×6×1")}
        {op(140, yc - 6, "conv")}{op(140, yc + 10, "3×3")}
        {vol(180, yc, 38, 38, 4, "var(--pos-rgb)", "v1")}
        {lbl(205, 185, "conv 1 + ReLU", "4×4×4")}
        {op(280, yc - 2, "pool")}
        {vol(310, yc, 22, 22, 4, "var(--pos-rgb)", "v2")}
        {lbl(328, 185, "pool 1", "2×2×4")}
        {op(380, yc - 6, "conv")}{op(380, yc + 10, "×N")}
        {vol(410, yc, 18, 18, 8, "124,92,255", "v3")}
        {lbl(432, 185, "deeper blocks", "richer features")}
        {op(500, yc, "flatten")}
        <rect x={538} y={yc - 50} width="14" height="100" rx="3" fill="rgba(var(--neon-rgb),.25)" stroke="rgba(var(--neon-rgb),.7)" />
        {lbl(545, 185, "flatten", "vector")}
        {op(600, yc, "FFN")}
        <g>{[0, 1, 2, 3].map((i) => <circle key={i} cx={640} cy={yc - 33 + i * 22} r="7" fill="rgba(var(--pos-rgb),.3)" stroke="rgba(var(--pos-rgb),.7)" />)}</g>
        {lbl(640, 185, "dense (FFN)", "hidden")}
        {op(688, yc, "softmax")}
        <g>{[0, 1].map((i) => <circle key={i} cx={722} cy={yc - 11 + i * 22} r="8" fill="rgba(var(--neon-rgb),.35)" stroke="var(--neon)" />)}</g>
        {lbl(722, 185, "output", "2 classes")}
        {/* arrows baseline */}
        <line x1="30" y1={yc + 70} x2={W - 20} y2={yc + 70} stroke="var(--line)" strokeDasharray="2 4" />
        <text x={W / 2} y={yc + 86} textAnchor="middle" className="cnn-arch-s">feature extraction (conv blocks) → classification (FFN)</text>
      </svg>
    );
  }
  window.CNNArchViz = CNNArchViz;
})();
