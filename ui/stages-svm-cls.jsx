/* ============================================================
   SVM Classification — 11 explainer stages
   Requires: window.ML_SVM (from model/ml-svm.js)
             window.{ Matrix, V, Sub, Sup, Formula, Lead, Note,
                      Row, Arrow, Tag, fmt } (from matrix.jsx)
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState } = React;
  const CLS = window.ML_SVM.SVM_CLS;

  /* ── SVG coordinate helpers ─────────────────────────────── */
  const W = 440, H = 340;
  const PAD = { l: 36, r: 16, t: 16, b: 36 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const DX = 14, DY = 14; // data range 0-14 (need room for x1+x2=13 margin line)

  const sx = v => PAD.l + (v / DX) * plotW;
  const sy = v => PAD.t + plotH - (v / DY) * plotH;

  // Hyperplane constants: x1+x2=10, margin lines at 7 and 13
  // w=[1/3,1/3], b=-10/3 → scaled so SVs have functional margin = ±1
  const HP_C = 10, MARGIN_POS_C = 13, MARGIN_NEG_C = 7;
  const W_VEC = [1/3, 1/3];
  const B_SCALAR = -10/3;
  const NORM_W = Math.sqrt(2) / 3;  // ||w|| = sqrt((1/3)² + (1/3)²)
  const MARGIN = 2 / NORM_W;        // ≈ 4.243 × 3 / sqrt(2) = 3*sqrt(2)

  // colors
  const COL_NEG = "rgba(226,76,96,1)";
  const COL_POS = "rgba(43,91,255,1)";

  /* ── Clamp line to SVG viewport ─────────────────────────── */
  function clipLine(x0, y0, x1, y1, xMin, xMax, yMin, yMax) {
    const dx = x1 - x0, dy = y1 - y0;
    let tMin = 0, tMax = 1;
    const clip = (p, q) => {
      if (Math.abs(p) < 1e-9) return q >= 0;
      const t = q / p;
      if (p < 0) { if (t > tMax) return false; if (t > tMin) tMin = t; }
      else        { if (t < tMin) return false; if (t < tMax) tMax = t; }
      return true;
    };
    if (!clip(-dx, x0 - xMin)) return null;
    if (!clip(dx, xMax - x0)) return null;
    if (!clip(-dy, y0 - yMin)) return null;
    if (!clip(dy, yMax - y0)) return null;
    if (tMin > tMax) return null;
    return [x0 + tMin*dx, y0 + tMin*dy, x0 + tMax*dx, y0 + tMax*dy];
  }

  /* ── Hyperplane line for x1+x2=C → x2 = C - x1 ─────────── */
  function hyperplaneLine(C, color, dashed, width) {
    const l = clipLine(
      sx(0), sy(C), sx(DX), sy(C - DX),
      PAD.l, W - PAD.r, PAD.t, H - PAD.b
    );
    if (!l) return null;
    return (
      <line x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]}
        stroke={color} strokeWidth={width || 2}
        strokeDasharray={dashed ? "6 3" : undefined}
        strokeLinecap="round" />
    );
  }

  /* ── Margin band polygon ─────────────────────────────────── */
  function marginBand(cLo, cHi, fill) {
    const pLo = clipLine(sx(0), sy(cLo), sx(DX), sy(cLo-DX), PAD.l, W-PAD.r, PAD.t, H-PAD.b);
    const pHi = clipLine(sx(0), sy(cHi), sx(DX), sy(cHi-DX), PAD.l, W-PAD.r, PAD.t, H-PAD.b);
    if (!pLo || !pHi) return null;
    const pts = `${pHi[0]},${pHi[1]} ${pHi[2]},${pHi[3]} ${pLo[2]},${pLo[3]} ${pLo[0]},${pLo[1]}`;
    return <polygon points={pts} fill={fill || "rgba(43,91,255,0.08)"} />;
  }

  /* ── Scatter base (axes + grid) ─────────────────────────── */
  function ScatterBase({ children }) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block" }}>
        {[2,4,6,8,10,12,14].map(v => (
          <g key={v}>
            <line x1={PAD.l} y1={sy(v)} x2={W-PAD.r} y2={sy(v)} stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />
            <line x1={sx(v)} y1={PAD.t} x2={sx(v)} y2={H-PAD.b} stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />
          </g>
        ))}
        <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="var(--ink)" strokeWidth="1.5" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H-PAD.b} stroke="var(--ink)" strokeWidth="1.5" />
        {[0,2,4,6,8,10,12,14].map(v => (
          <g key={v}>
            <line x1={PAD.l-3} y1={sy(v)} x2={PAD.l} y2={sy(v)} stroke="var(--ink)" strokeWidth="1" />
            <text x={PAD.l-5} y={sy(v)+4} textAnchor="end" fontSize="9" fill="var(--ink-2,#666)" fontFamily="inherit">{v}</text>
            <line x1={sx(v)} y1={H-PAD.b} x2={sx(v)} y2={H-PAD.b+3} stroke="var(--ink)" strokeWidth="1" />
            <text x={sx(v)} y={H-PAD.b+13} textAnchor="middle" fontSize="9" fill="var(--ink-2,#666)" fontFamily="inherit">{v}</text>
          </g>
        ))}
        <text x={W/2} y={H-3} textAnchor="middle" fontSize="11" fill="var(--muted,#888)" fontFamily="inherit">x₁</text>
        <text x={11} y={H/2} textAnchor="middle" fontSize="11" fill="var(--muted,#888)" fontFamily="inherit" transform={`rotate(-90,11,${H/2})`}>x₂</text>
        {children}
      </svg>
    );
  }

  /* ── Data points ─────────────────────────────────────────── */
  // Real SVs: (4,3) neg, (7,6) and (6,7) pos
  const SV_SET = new Set(['4,3','7,6','6,7']);
  function DataPoints({ highlightSVs = false, showQuery = true, query = null, dimOthers = false }) {
    return (
      <>
        {CLS.data.map(([x1, x2, lbl], i) => {
          const key = `${x1},${x2}`;
          const isSV = SV_SET.has(key);
          const col = lbl === 1 ? COL_POS : COL_NEG;
          const opacity = dimOthers && !isSV ? 0.3 : 1;
          return (
            <g key={i} opacity={opacity}>
              {highlightSVs && isSV ? (
                <>
                  <rect x={sx(x1)-7} y={sy(x2)-7} width="14" height="14"
                    fill={col} stroke="var(--bg)" strokeWidth="2" rx="2" />
                  <rect x={sx(x1)-10} y={sy(x2)-10} width="20" height="20"
                    fill="none" stroke={col} strokeWidth="1.5" rx="3" opacity="0.6" />
                </>
              ) : (
                <circle cx={sx(x1)} cy={sy(x2)} r="6" fill={col} stroke="var(--bg)" strokeWidth="1.5" />
              )}
            </g>
          );
        })}
        {showQuery && query && (
          <text x={sx(query[0])} y={sy(query[1])+5} textAnchor="middle" fontSize="18" fill="var(--accent,#2b5bff)">★</text>
        )}
      </>
    );
  }

  /* ── renderInput ─────────────────────────────────────────── */
  function renderInput(input, setInput) {
    return (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">x₁</span>
          <input type="range" min="0" max="14" step="0.5" value={input.x1}
            onChange={e => setInput({ ...input, x1: parseFloat(e.target.value) })} />
          <span className="nn-slider-v">{fmt(input.x1)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">x₂</span>
          <input type="range" min="0" max="14" step="0.5" value={input.x2}
            onChange={e => setInput({ ...input, x2: parseFloat(e.target.value) })} />
          <span className="nn-slider-v">{fmt(input.x2)}</span>
        </label>
      </>
    );
  }

  /* ── STAGES ──────────────────────────────────────────────── */
  const STAGES = [

    /* ── Stage 1: Overview ─────────────────────────────────── */
    {
      id: "overview", group: "Overview", title: "What is an SVM?",
      map: "Overview",
      why: "SVMs introduce the key idea of maximizing margin — choosing the hyperplane that is as far as possible from all training points. This geometric insight makes SVMs robust and theoretically well-founded.",
      render: (trace) => (
        <>
          <Lead>
            A <b>Support Vector Machine</b> finds the hyperplane that separates two classes
            with the <b>widest possible margin</b>. Among all lines that correctly separate the data,
            the SVM picks the one that maximizes the distance to the nearest points.
          </Lead>

          <div style={{ maxWidth: W }}>
            <ScatterBase>
              {/* poor candidate lines */}
              {hyperplaneLine(9.0, "rgba(180,180,180,0.5)", true, 1.5)}
              {(() => {
                const pts = clipLine(sx(0), sy(12), sx(14), sy(3), PAD.l, W-PAD.r, PAD.t, H-PAD.b);
                if (!pts) return null;
                return <line x1={pts[0]} y1={pts[1]} x2={pts[2]} y2={pts[3]}
                  stroke="rgba(180,180,180,0.5)" strokeWidth="1.5" strokeDasharray="6 3" />;
              })()}
              {/* optimal hyperplane x1+x2=10 */}
              {marginBand(MARGIN_NEG_C, MARGIN_POS_C)}
              {hyperplaneLine(MARGIN_NEG_C, "var(--accent,#2b5bff)", true, 1.2)}
              {hyperplaneLine(MARGIN_POS_C, "var(--accent,#2b5bff)", true, 1.2)}
              {hyperplaneLine(HP_C, "var(--accent,#2b5bff)", false, 2.5)}
              <DataPoints showQuery={false} />
              <text x={sx(1)} y={sy(11)} fontSize="11" fill="rgba(140,140,140,0.9)" fontFamily="inherit">poor separators</text>
              <text x={sx(2)} y={sy(3)} fontSize="11" fill="var(--accent,#2b5bff)" fontWeight="700" fontFamily="inherit">max-margin ✓</text>
            </ScatterBase>
          </div>

          <div className="tf-archwrap" style={{ marginTop: 16 }}>
            <div className="tf-arch">
              <div className="tf-arch-io">Training data <b>X</b>, labels <b>y ∈ {"{-1, +1}"}</b></div>
              <div className="tf-arch-f"><b>Find: w, b</b> (hyperplane parameters)</div>
              <div className="tf-arch-row">Maximize margin <b>2/‖w‖</b> subject to y_i(w·x_i + b) ≥ 1</div>
              <div className="tf-arch-f"><b>Quadratic Programming</b></div>
              <div className="tf-arch-io tf-arch-io--out">Decision boundary <b>w·x + b = 0</b> — predict sign(w·x + b)</div>
            </div>
          </div>

          <div className="tf-legend">
            {[
              ["w", "weight vector", "d-dim", "normal to the separating hyperplane — direction of maximum separation"],
              ["b", "bias", "scalar", "shifts the hyperplane parallel to itself"],
              ["margin", "2/‖w‖", "scalar", "perpendicular width of the gap between the two margin lines"],
              ["SV", "support vector", "subset of X", "training points that lie exactly on the margin lines — they define the boundary"],
              ["f(x)", "w·x + b", "scalar", "functional value — positive = class +1 side, negative = class −1 side"],
            ].map(r => (
              <div className="tf-leg" key={r[0]}>
                <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>
          <Note>
            Use the <b>x₁ and x₂ sliders</b> above to move the query point ★ — every computation updates live.
          </Note>
        </>
      ),
    },

    /* ── Stage 2: Dataset ──────────────────────────────────── */
    {
      id: "dataset", group: "Data", title: "The Training Dataset",
      map: "Dataset",
      why: "Understanding the data geometry is the first step. SVM works best when classes are linearly separable — here we have 10 perfectly separable 2D points.",
      render: (trace) => (
        <>
          <Lead>
            Our dataset has <b>10 points</b> in 2D, split into two classes:
            <span style={{ color: COL_NEG }}> Class −1 (red)</span> in the lower-left and
            <span style={{ color: COL_POS }}> Class +1 (blue)</span> in the upper-right.
            The query point ★ is set by the sliders.
          </Lead>
          <Row>
            <div style={{ flex: "1 1 440px" }}>
              <ScatterBase>
                <DataPoints showQuery={true} query={trace.query} />
              </ScatterBase>
            </div>
            <div style={{ flex: "0 0 240px" }}>
              <div className="tf-subhead">Training points</div>
              <Matrix
                data={CLS.data.map(([x1, x2, y]) => [x1, x2, y])}
                rowLabels={CLS.data.map((_, i) => `x⁽${i+1}⁾`)}
                colLabels={["x₁", "x₂", "y"]}
                caption="Training set"
                sub="10 examples, 2 classes"
                heat={false}
              />
            </div>
          </Row>
          <Note>
            The two classes are clearly separated. Class −1 points have x₁+x₂ ≤ 7;
            Class +1 points have x₁+x₂ ≥ 13. The gap in between is where the optimal hyperplane lives.
          </Note>
        </>
      ),
    },

    /* ── Stage 3: The Margin ───────────────────────────────── */
    {
      id: "margin", group: "Core Concept", title: "The Margin — Why Widest Is Best",
      map: "Margin",
      why: "The margin is the key quantity SVM maximizes. A larger margin means the classifier generalizes better — it has more room to tolerate noise and small shifts in the data.",
      render: () => {
        return (
          <>
            <Lead>
              The <b>margin</b> is the perpendicular distance between the two margin lines.
              Hyperplane: <b>x₁+x₂=10</b> (w=[1/3,1/3], b=−10/3).
              Margin lines: x₁+x₂=7 (class −1) and x₁+x₂=13 (class +1).
              Margin width = 2/‖w‖ ≈ <b>{fmt(MARGIN, 3)}</b>.
            </Lead>

            <Formula label="Margin width">
              margin = <b>2 / ‖w‖</b> = 2 / (√2/3) = 6/√2 = 3√2 ≈ <b>{fmt(MARGIN, 4)}</b>
            </Formula>

            <ScatterBase>
              {marginBand(MARGIN_NEG_C, MARGIN_POS_C)}
              {hyperplaneLine(MARGIN_NEG_C, "var(--accent,#2b5bff)", true, 1.5)}
              {hyperplaneLine(MARGIN_POS_C, "var(--accent,#2b5bff)", true, 1.5)}
              {hyperplaneLine(HP_C, "var(--accent,#2b5bff)", false, 2.5)}
              <DataPoints showQuery={false} />
              {/* margin bracket: vertical line at x1=5 between x1+x2=7 and x1+x2=13 */}
              {(() => {
                // perpendicular segment at midpoint of hyperplane
                // direction of w: [1/√2, 1/√2]. At midpoint of hyperplane, say x1=5, x2=5
                // to margin lines: dist = 3/sqrt(2) each way (half margin = MARGIN/2)
                const mx = 5, my = HP_C - mx; // point on hyperplane
                const dx = MARGIN / 2 / Math.sqrt(2), dy = MARGIN / 2 / Math.sqrt(2);
                return (
                  <g>
                    <line x1={sx(mx-dx)} y1={sy(my-dy)} x2={sx(mx+dx)} y2={sy(my+dy)}
                      stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2" />
                    <text x={sx(mx)+5} y={sy(my)+4} fontSize="11" fill="var(--accent)" fontWeight="700" fontFamily="inherit">
                      margin≈{fmt(MARGIN,2)}
                    </text>
                  </g>
                );
              })()}
              <text x={sx(1)} y={sy(6)} fontSize="10" fill="var(--accent,#2b5bff)" fontFamily="inherit">w·x+b=−1</text>
              <text x={sx(3)} y={sy(7.5)} fontSize="10" fill="var(--accent,#2b5bff)" fontFamily="inherit">w·x+b=0</text>
              <text x={sx(1)} y={sy(12.5)} fontSize="10" fill="var(--accent,#2b5bff)" fontFamily="inherit">w·x+b=+1</text>
            </ScatterBase>

            <Row>
              <div className="nn-calc" style={{ flex: "1 1 220px" }}>
                <div className="nn-calc-h">Scaled solution (unit functional margin)</div>
                <div className="nn-calc-row">w = [1/3, 1/3],  b = −10/3</div>
                <div className="nn-calc-row">‖w‖ = √(2/9) = √2/3 ≈ {fmt(NORM_W, 4)}</div>
                <div className="nn-calc-row">margin = 2/‖w‖ = 3√2 ≈ <b>{fmt(MARGIN, 4)}</b></div>
              </div>
              <div className="nn-calc" style={{ flex: "1 1 220px" }}>
                <div className="nn-calc-h">Margin lines</div>
                <div className="nn-calc-row" style={{ color: COL_POS }}>Positive margin: x₁+x₂ = 13</div>
                <div className="nn-calc-row" style={{ color: COL_NEG }}>Negative margin: x₁+x₂ = 7</div>
                <div className="nn-calc-row">All +1 points: w·x+b ≥ +1</div>
                <div className="nn-calc-row">All −1 points: w·x+b ≤ −1</div>
              </div>
            </Row>
            <Note>
              Maximizing the margin ↔ minimizing ‖w‖. The scaling (w=[1/3,1/3]) ensures the closest
              training points have functional margin exactly 1 — the standard SVM normalization.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 4: Support Vectors ──────────────────────────── */
    {
      id: "support-vectors", group: "Core Concept", title: "Support Vectors — The Defining Points",
      map: "Support Vectors",
      why: "Only the support vectors — points on the margin lines — matter. The entire boundary is determined by just 3 of the 10 training points. This sparsity makes SVMs memory-efficient.",
      render: () => {
        // Verify: w·x+b for SVs
        const svData = [
          [4,3,-1, (1/3)*4+(1/3)*3-10/3],
          [7,6,+1, (1/3)*7+(1/3)*6-10/3],
          [6,7,+1, (1/3)*6+(1/3)*7-10/3],
        ];
        return (
          <>
            <Lead>
              <b>Support vectors</b> are training points that lie exactly on the margin lines (w·x+b = ±1).
              For our dataset, there are <b>3 support vectors</b>: one from class −1, two from class +1.
              Only these 3 points determine the entire hyperplane.
            </Lead>

            <ScatterBase>
              {marginBand(MARGIN_NEG_C, MARGIN_POS_C)}
              {hyperplaneLine(MARGIN_NEG_C, "var(--accent,#2b5bff)", true, 1.5)}
              {hyperplaneLine(MARGIN_POS_C, "var(--accent,#2b5bff)", true, 1.5)}
              {hyperplaneLine(HP_C, "var(--accent,#2b5bff)", false, 2.5)}
              <DataPoints highlightSVs={true} dimOthers={true} showQuery={false} />
              <text x={sx(4)+13} y={sy(3)+4} fontSize="11" fontWeight="700" fill={COL_NEG} fontFamily="inherit">SV (−1)</text>
              <text x={sx(7)+13} y={sy(6)+4} fontSize="11" fontWeight="700" fill={COL_POS} fontFamily="inherit">SV (+1)</text>
              <text x={sx(6)+13} y={sy(7)+4} fontSize="11" fontWeight="700" fill={COL_POS} fontFamily="inherit">SV (+1)</text>
            </ScatterBase>

            <div className="tf-subhead">Functional margins for support vectors</div>
            <Matrix
              data={svData.map(([x1,x2,y,fm]) => [x1, x2, y, fmt(fm, 4)])}
              rowLabels={["SV₁","SV₂","SV₃"]}
              colLabels={["x₁", "x₂", "y", "w·x+b"]}
              caption="Support vectors — w·x+b = ±1"
              sub="3 SVs define the entire boundary"
              heat={false}
            />

            <Note>
              The <b>squares</b> mark support vectors; dimmed circles are non-support vectors.
              Moving any dimmed point (as long as it stays outside the margin) has
              <em> zero effect</em> on the learned boundary — a unique property of SVMs.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 5: Decision Function ────────────────────────── */
    {
      id: "decision-fn", group: "Prediction", title: "Decision Function f(x) = w·x + b",
      map: "Decision Fn",
      why: "The decision function is what the trained SVM uses at test time. Its sign tells the class and its magnitude tells confidence — far from the boundary = confident, near = uncertain.",
      render: (trace) => {
        const { query, dist, label } = trace;
        const [x1, x2] = query;
        const distNorm = dist / NORM_W;
        return (
          <>
            <Lead>
              For any point x, compute <b>f(x) = w·x + b</b>.
              If f(x) ≥ 0 → class <b style={{ color: COL_POS }}>+1</b>;
              if f(x) &lt; 0 → class <b style={{ color: COL_NEG }}>−1</b>.
              Signed distance from hyperplane = f(x)/‖w‖.
            </Lead>

            <ScatterBase>
              {marginBand(MARGIN_NEG_C, MARGIN_POS_C)}
              {hyperplaneLine(MARGIN_NEG_C, "var(--accent,#2b5bff)", true, 1.2)}
              {hyperplaneLine(MARGIN_POS_C, "var(--accent,#2b5bff)", true, 1.2)}
              {hyperplaneLine(HP_C, "var(--accent,#2b5bff)", false, 2.5)}
              <DataPoints showQuery={true} query={query} />
              {/* foot of perpendicular from query to hyperplane x1+x2=10 */}
              {(() => {
                const t = (HP_C - x1 - x2) / 2;
                const fx = x1 + t, fy = x2 + t;
                if (fx < 0 || fx > DX || fy < 0 || fy > DY) return null;
                return (
                  <line x1={sx(x1)} y1={sy(x2)} x2={sx(fx)} y2={sy(fy)}
                    stroke={label > 0 ? COL_POS : COL_NEG} strokeWidth="2" strokeDasharray="5 2" />
                );
              })()}
            </ScatterBase>

            <div className="nn-calc">
              <div className="nn-calc-h">Calculation for query ★ = ({fmt(x1)}, {fmt(x2)})</div>
              <div className="nn-calc-row">f(x) = w₁·x₁ + w₂·x₂ + b</div>
              <div className="nn-calc-row">= (1/3)×{fmt(x1)} + (1/3)×{fmt(x2)} − 10/3</div>
              <div className="nn-calc-row">= ({fmt(x1)}+{fmt(x2)}−10)/3 = {fmt(x1+x2-10)}/3</div>
              <div className="nn-calc-row"><b>= {fmt(dist, 4)}</b></div>
              <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                Signed distance = f(x)/‖w‖ = {fmt(dist,4)} / {fmt(NORM_W,4)} = <b>{fmt(distNorm, 3)}</b>
              </div>
              <div className="nn-calc-row">
                Predicted class:{" "}
                <b style={{ color: label > 0 ? COL_POS : COL_NEG, fontSize: "1.1em" }}>
                  {label > 0 ? "+1 (Class B)" : "−1 (Class A)"}
                </b>
              </div>
            </div>

            <Note>
              Move the sliders to push ★ across the hyperplane. Watch f(x) change sign and the
              class flip. Points with |f(x)| = 1 are on the margin lines. f(x) = 0 is on the hyperplane.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 6: Optimization Problem ────────────────────── */
    {
      id: "optimization", group: "Math", title: "The Optimization Problem",
      map: "Optimization",
      why: "The clean mathematical form of SVM makes it solvable with standard quadratic programming. The dual form is especially useful as it enables the kernel trick.",
      render: (trace) => {
        const { margins } = trace;
        return (
          <>
            <Lead>
              SVM maximizes margin ↔ minimizes ‖w‖². Constraints: all points correctly classified
              with functional margin ≥ 1. This is a <b>convex quadratic program</b> — global optimum guaranteed.
            </Lead>

            <div className="tf-subhead">Primal formulation</div>
            <Formula label="Objective">min<Sub>w,b</Sub>&nbsp;<b>½ ‖w‖²</b></Formula>
            <Formula label="Constraints">y<Sub>i</Sub>(w·x<Sub>i</Sub> + b) ≥ 1 &nbsp; for all i = 1…n</Formula>

            <div className="tf-subhead">Dual formulation</div>
            <Formula label="Dual">max<Sub>α</Sub>&nbsp; Σ α<Sub>i</Sub> − ½ ΣΣ α<Sub>i</Sub>α<Sub>j</Sub>y<Sub>i</Sub>y<Sub>j</Sub>(x<Sub>i</Sub>·x<Sub>j</Sub>)</Formula>
            <Formula label="KKT">w = Σ α<Sub>i</Sub>y<Sub>i</Sub>x<Sub>i</Sub> &nbsp;&nbsp; α<Sub>i</Sub>(y<Sub>i</Sub>(w·x<Sub>i</Sub>+b)−1) = 0</Formula>

            <div className="tf-subhead">Functional margins for all training points</div>
            <Matrix
              data={CLS.data.map(([x1, x2, y], i) => [x1, x2, y, fmt(margins[i], 3)])}
              rowLabels={CLS.data.map((_, i) => `x⁽${i+1}⁾`)}
              colLabels={["x₁", "x₂", "y", "y·f(x)"]}
              caption="Functional margins — all ≥ 1 for hard-margin SVM"
              sub="SVs have margin exactly = 1"
              heat={false}
            />

            <Row>
              <div className="nn-calc" style={{ flex: "1 1 220px" }}>
                <div className="nn-calc-h">Why the dual form?</div>
                <div className="nn-calc-row">Solution: w = Σ αᵢyᵢxᵢ (sparse!)</div>
                <div className="nn-calc-row">Only SVs have αᵢ &gt; 0</div>
                <div className="nn-calc-row">Data enters only via dot products</div>
                <div className="nn-calc-row">→ enables the kernel trick (Stage 8)</div>
              </div>
              <div className="nn-calc" style={{ flex: "1 1 220px" }}>
                <div className="nn-calc-h">Our solution</div>
                <div className="nn-calc-row">w = [1/3, 1/3]  (‖w‖ = {fmt(NORM_W, 4)})</div>
                <div className="nn-calc-row">b = −10/3 ≈ {fmt(-10/3, 4)}</div>
                <div className="nn-calc-row">½‖w‖² = {fmt(0.5*NORM_W*NORM_W, 4)}</div>
                <div className="nn-calc-row">Margin = 3√2 ≈ {fmt(MARGIN, 3)}</div>
                <div className="nn-calc-row">SVs: (4,3), (7,6), (6,7)</div>
              </div>
            </Row>
            <Note>
              Functional margins ≥ 1 for all points confirms the constraints are satisfied.
              The 3 support vectors have margin exactly = 1 (active constraints).
            </Note>
          </>
        );
      },
    },

    /* ── Stage 7: Soft Margin ──────────────────────────────── */
    {
      id: "soft-margin", group: "Extensions", title: "Soft Margin — The C Parameter",
      map: "Soft Margin (C)",
      why: "Real data is rarely perfectly separable. Slack variables allow controlled violations. C lets you trade off between a wide margin and fewer misclassifications.",
      render: () => (
        <>
          <Lead>
            The <b>soft-margin SVM</b> adds slack variables ξᵢ ≥ 0 to allow margin violations.
            C controls the penalty: large C = strict (hard) margin, small C = wide (soft) margin.
          </Lead>

          <Formula label="Primal (soft)">min<Sub>w,b,ξ</Sub>&nbsp; ½‖w‖² + C · Σξᵢ</Formula>
          <Formula label="Constraints">y<Sub>i</Sub>(w·x<Sub>i</Sub> + b) ≥ 1 − ξᵢ &nbsp;&nbsp; ξᵢ ≥ 0</Formula>

          <ScatterBase>
            {marginBand(MARGIN_NEG_C, MARGIN_POS_C)}
            {hyperplaneLine(MARGIN_NEG_C, "var(--accent,#2b5bff)", true, 1.5)}
            {hyperplaneLine(MARGIN_POS_C, "var(--accent,#2b5bff)", true, 1.5)}
            {hyperplaneLine(HP_C, "var(--accent,#2b5bff)", false, 2.5)}
            {/* Simulated violating point inside margin */}
            <circle cx={sx(8)} cy={sy(8)} r="7" fill={COL_NEG} stroke="var(--bg)" strokeWidth="2" />
            <circle cx={sx(8)} cy={sy(8)} r="12" fill="none" stroke={COL_NEG} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7" />
            <text x={sx(8)+15} y={sy(8)+4} fontSize="11" fill={COL_NEG} fontWeight="700" fontFamily="inherit">ξ &gt; 0</text>
            <DataPoints showQuery={false} />
          </ScatterBase>

          <div className="tf-subhead">Effect of C</div>
          <div className="tf-legend">
            {[
              ["C→∞", "Hard margin", "strict", "No violations allowed. Sensitive to outliers. May overfit noisy data."],
              ["C large", "Tight margin", "strict-ish", "Heavy penalty → fewer violations, narrower effective margin."],
              ["C small", "Wide margin", "lenient", "Tolerates violations → wider margin, better generalization."],
              ["C→0", "Max-margin", "soft", "Ignores violations; maximizes margin regardless of data."],
            ].map(r => (
              <div className="tf-leg" key={r[0]}>
                <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">Soft margin advantages</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">Works on non-linearly separable data</li>
                <li className="opt-pc-li">Robust to outliers and noise</li>
                <li className="opt-pc-li">C easy to tune via cross-validation</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">Considerations</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">C is a critical hyperparameter</li>
                <li className="opt-pc-li">Hinge loss: L = max(0, 1 − yf(x))</li>
                <li className="opt-pc-li">Balance C with kernel γ for best results</li>
              </ul>
            </div>
          </div>
          <Note>
            ξᵢ = 0 → satisfied; 0 &lt; ξᵢ ≤ 1 → inside margin (correct class, wrong side);
            ξᵢ &gt; 1 → misclassified. The total Σξᵢ is an upper bound on training errors.
          </Note>
        </>
      ),
    },

    /* ── Stage 8: Kernel Trick ─────────────────────────────── */
    {
      id: "kernel-trick", group: "Extensions", title: "The Kernel Trick — Non-Linear SVMs",
      map: "Kernel Trick",
      why: "The kernel trick is SVM's superpower. It gives non-linear decision boundaries without ever computing the high-dimensional mapping explicitly.",
      render: () => (
        <>
          <Lead>
            Data not linearly separable in 2D can become separable in higher dimensions.
            The <b>kernel trick</b> computes dot products in that high-dimensional space
            <em> implicitly</em> — K(x,z) = φ(x)·φ(z) — without ever materializing φ(x).
          </Lead>

          <div className="tf-subhead">XOR problem — not linearly separable in 2D</div>
          <Row>
            <svg viewBox="0 0 200 180" style={{ width: 200, flex: "none", display: "block" }}>
              <line x1="20" y1="160" x2="190" y2="160" stroke="var(--ink)" strokeWidth="1.5" />
              <line x1="20" y1="10" x2="20" y2="160" stroke="var(--ink)" strokeWidth="1.5" />
              {[[1,1,"neg"],[2,2,"neg"],[1,2,"pos"],[2,1,"pos"]].map(([x,y,cls],i) => (
                <circle key={i} cx={20+x*60} cy={160-y*60} r="10"
                  fill={cls==="pos" ? COL_POS : COL_NEG} stroke="var(--bg)" strokeWidth="2" />
              ))}
              <text x="105" y="175" textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="inherit">x₁</text>
              <text x="10" y="90" textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="inherit" transform="rotate(-90,10,90)">x₂</text>
              <text x="105" y="24" textAnchor="middle" fontSize="11" fill={COL_NEG} fontWeight="700" fontFamily="inherit">NOT linearly separable</text>
            </svg>
            <div style={{ flex: "1", fontSize: 13 }}>
              <div className="nn-calc">
                <div className="nn-calc-h">How the kernel trick works</div>
                <div className="nn-calc-row">Map x → φ(x) in higher-dim space</div>
                <div className="nn-calc-row">Hyperplane in φ-space → non-linear boundary in original space</div>
                <div className="nn-calc-row">Kernel: K(x,z) = φ(x)·φ(z)</div>
                <div className="nn-calc-row">Replace x·z with K(x,z) in dual form</div>
                <div className="nn-calc-row"><b>Never compute φ(x) explicitly!</b></div>
                <div className="nn-calc-row">Prediction: f(x) = Σ αᵢyᵢK(xᵢ,x) + b</div>
              </div>
            </div>
          </Row>

          <div className="tf-subhead">Common kernels</div>
          <div className="tf-legend">
            {[
              ["Linear", "K(x,z) = x·z", "low-dim", "No mapping. Same as standard SVM. Good baseline for high-dim data (text, genes)."],
              ["Polynomial", "K(x,z) = (γx·z + r)^d", "medium", "Captures feature interactions up to degree d."],
              ["RBF", "K(x,z) = exp(−γ‖x−z‖²)", "∞-dim", "Most popular. Creates smooth Gaussian-shaped boundaries. See Stage 9."],
              ["Sigmoid", "K(x,z) = tanh(γx·z + r)", "neural", "Mimics a single hidden-layer net. Not always positive definite."],
            ].map(r => (
              <div className="tf-leg" key={r[0]}>
                <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>
          <Note>
            Polynomial kernel K(x,z) = (x·z)² maps XOR data to 3D where it IS linearly separable.
            The 3D dot product is computed using only 2D features — that's the trick.
          </Note>
        </>
      ),
    },

    /* ── Stage 9: RBF Kernel ───────────────────────────────── */
    {
      id: "rbf-kernel", group: "Extensions", title: "RBF Kernel — Gaussian Bumps",
      map: "RBF Kernel",
      why: "The RBF kernel is the default choice for non-linear SVM. Understanding how γ controls decision boundary smoothness helps you tune without overfitting.",
      render: () => {
        const gammas = [0.1, 0.5, 2.0];
        const cols = ["#2b5bff", "#06a3c7", "#e0518f"];
        const RW = 380, RH = 200;
        const rPad = { l: 44, r: 16, t: 16, b: 36 };
        const rX = v => rPad.l + ((v + 3) / 6) * (RW - rPad.l - rPad.r);
        const rY = v => rPad.t + (1 - v) * (RH - rPad.t - rPad.b);
        return (
          <>
            <Lead>
              The <b>RBF (Radial Basis Function) kernel</b> places a Gaussian bump around each SV.
              γ controls the width: small γ → wide bumps (smooth boundary), large γ → narrow bumps (complex).
            </Lead>
            <Formula label="RBF kernel">K(x, z) = exp(−γ ‖x − z‖²)</Formula>

            <div className="tf-subhead">RBF profile K(x, 0) for different γ</div>
            <svg viewBox={`0 0 ${RW} ${RH}`} style={{ width: "100%", maxWidth: RW, display: "block" }}>
              <line x1={rPad.l} y1={RH-rPad.b} x2={RW-rPad.r} y2={RH-rPad.b} stroke="var(--ink)" strokeWidth="1.5" />
              <line x1={rPad.l} y1={rPad.t} x2={rPad.l} y2={RH-rPad.b} stroke="var(--ink)" strokeWidth="1.5" />
              {[-2,-1,0,1,2].map(v => (
                <g key={v}>
                  <line x1={rX(v)} y1={RH-rPad.b} x2={rX(v)} y2={RH-rPad.b+3} stroke="var(--ink)" strokeWidth="1" />
                  <text x={rX(v)} y={RH-rPad.b+13} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="inherit">{v}</text>
                </g>
              ))}
              {[0, 0.5, 1].map(v => (
                <g key={v}>
                  <line x1={rPad.l-3} y1={rY(v)} x2={rPad.l} y2={rY(v)} stroke="var(--ink)" strokeWidth="1" />
                  <text x={rPad.l-5} y={rY(v)+4} textAnchor="end" fontSize="10" fill="var(--muted)" fontFamily="inherit">{v}</text>
                </g>
              ))}
              {gammas.map((g, gi) => {
                const pts = [];
                for (let xv = -3; xv <= 3; xv += 0.1) {
                  pts.push(`${rX(xv).toFixed(1)},${rY(Math.exp(-g*xv*xv)).toFixed(1)}`);
                }
                return <polyline key={gi} points={pts.join(" ")} fill="none" stroke={cols[gi]} strokeWidth="2.5" />;
              })}
              {gammas.map((g, gi) => (
                <text key={gi} x={rX(1.2)} y={rY(Math.exp(-g*1.44))-6}
                  fontSize="11" fill={cols[gi]} fontFamily="inherit">γ={g}</text>
              ))}
              <text x={RW/2} y={RH-4} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="inherit">‖x − z‖</text>
              <text x={11} y={RH/2} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="inherit" transform={`rotate(-90,11,${RH/2})`}>K(x,z)</text>
            </svg>

            <div className="tf-legend">
              {[
                ["γ small", "Wide bump", "smooth", "Each SV influences a large region. Smooth, global boundary. Risk: underfitting."],
                ["γ large", "Narrow bump", "complex", "Each SV influences only nearby points. Complex, local boundary. Risk: overfitting."],
                ["γ optimal", "Cross-validate", "tuning", "Grid search or RandomizedSearchCV. Tune jointly with C."],
              ].map(r => (
                <div className="tf-leg" key={r[0]}>
                  <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div>
                  <div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>
            <Note>
              RBF maps to an <b>infinite-dimensional</b> feature space, yet is computed in O(d) time.
              It's equivalent to a Gaussian kernel density estimate over the support vectors.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 10: Prediction walkthrough ─────────────────── */
    {
      id: "prediction", group: "Prediction", title: "Full Prediction Walkthrough",
      map: "Prediction",
      why: "Seeing the complete computation from raw input to predicted class — including signed distance and confidence — ties together all the SVM concepts.",
      render: (trace) => {
        const { query, dist, label, marginDist } = trace;
        const [x1, x2] = query;
        const distNorm = dist / NORM_W;
        const insideMargin = Math.abs(dist) < 1;
        return (
          <>
            <Lead>
              For query ★ = ({fmt(x1)}, {fmt(x2)}), here is the complete step-by-step prediction
              from raw inputs to class label and confidence score.
            </Lead>

            <ScatterBase>
              {marginBand(MARGIN_NEG_C, MARGIN_POS_C)}
              {hyperplaneLine(MARGIN_NEG_C, "var(--accent,#2b5bff)", true, 1.2)}
              {hyperplaneLine(MARGIN_POS_C, "var(--accent,#2b5bff)", true, 1.2)}
              {hyperplaneLine(HP_C, "var(--accent,#2b5bff)", false, 2.5)}
              <DataPoints showQuery={true} query={query} />
              {(() => {
                const t = (HP_C - x1 - x2) / 2;
                const fx = x1 + t, fy = x2 + t;
                if (fx < 0 || fx > DX || fy < 0 || fy > DY) return null;
                return (
                  <g>
                    <line x1={sx(x1)} y1={sy(x2)} x2={sx(fx)} y2={sy(fy)}
                      stroke={label > 0 ? COL_POS : COL_NEG} strokeWidth="2.5" strokeDasharray="5 2" />
                    <circle cx={sx(fx)} cy={sy(fy)} r="4" fill="var(--accent)" />
                    <text x={sx((x1+fx)/2)+5} y={sy((x2+fy)/2)-5} fontSize="11" fontWeight="700"
                      fill={label > 0 ? COL_POS : COL_NEG} fontFamily="inherit">d={fmt(distNorm,2)}</text>
                  </g>
                );
              })()}
            </ScatterBase>

            <div className="nn-calc">
              <div className="nn-calc-h">Step 1 — Compute f(x)</div>
              <div className="nn-calc-row">f(x) = (1/3)×{fmt(x1)} + (1/3)×{fmt(x2)} − 10/3</div>
              <div className="nn-calc-row">= ({fmt(x1)} + {fmt(x2)} − 10) / 3 = {fmt(x1+x2-10)}/3</div>
              <div className="nn-calc-row"><b>= {fmt(dist, 4)}</b></div>
            </div>
            <div className="nn-calc" style={{ marginTop: 8 }}>
              <div className="nn-calc-h">Step 2 — Signed distance from hyperplane</div>
              <div className="nn-calc-row">d = f(x) / ‖w‖ = {fmt(dist,4)} / {fmt(NORM_W,4)}</div>
              <div className="nn-calc-row"><b>= {fmt(distNorm, 4)}</b></div>
            </div>
            <div className="nn-calc" style={{ marginTop: 8 }}>
              <div className="nn-calc-h">Step 3 — Decision rule</div>
              <div className="nn-calc-row">
                f(x) = {fmt(dist,4)} → {dist >= 0 ? "≥ 0 → class +1" : "< 0 → class −1"}
              </div>
              <div className="nn-calc-row">
                Predicted: <b style={{ color: label > 0 ? COL_POS : COL_NEG, fontSize: "1.1em" }}>
                  {label > 0 ? "+1 (Class B)" : "−1 (Class A)"}
                </b>
              </div>
              <div className="nn-calc-row">
                Confidence (‖distance‖ from boundary): <b>{fmt(Math.abs(distNorm), 3)}</b>
                {insideMargin ? " ← inside margin (uncertain)" : " ← outside margin (confident)"}
              </div>
            </div>
            <Note>
              Drag sliders to push ★ across the hyperplane — watch f(x) change sign.
              Points with |f(x)| = 1 are exactly on the margin lines.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 11: When to Use ─────────────────────────────── */
    {
      id: "when-to-use", group: "Evaluation", title: "When to Use SVM — Pros, Cons & Comparisons",
      map: "When to Use",
      why: "Knowing when SVM is the right tool prevents both underuse and overuse. The comparison with alternatives helps you choose the best model for your task.",
      render: () => (
        <>
          <Lead>
            SVMs shine in <b>high-dimensional, low-sample</b> settings (text, genomics) and when the
            data is nearly linearly separable. They struggle with very large datasets.
          </Lead>

          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">SVM Strengths</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">Effective in high-dimensional spaces (d &gt; n)</li>
                <li className="opt-pc-li">Memory-efficient — only SVs stored at inference</li>
                <li className="opt-pc-li">Versatile: linear, RBF, polynomial kernels</li>
                <li className="opt-pc-li">Unique global optimum — no local minima</li>
                <li className="opt-pc-li">Robust to outliers via soft margin</li>
                <li className="opt-pc-li">Strong theoretical foundation (VC theory)</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">SVM Limitations</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">Slow on large datasets — O(n² to n³)</li>
                <li className="opt-pc-li">Requires feature scaling (critical)</li>
                <li className="opt-pc-li">C and γ require cross-validation</li>
                <li className="opt-pc-li">No native probability output (needs Platt scaling)</li>
                <li className="opt-pc-li">Multi-class = one-vs-one or one-vs-rest</li>
                <li className="opt-pc-li">RBF kernel is a black box</li>
              </ul>
            </div>
          </div>

          <div className="tf-subhead">SVM vs alternatives for classification</div>
          <div className="tf-legend">
            {[
              ["SVM", "Support Vector Machine", "your choice", "Best for high-dim data, clear margins, small-medium datasets. Kernel trick for non-linear boundaries."],
              ["LR", "Logistic Regression", "baseline", "Simpler, faster, outputs probabilities. Prefer when n is large or interpretability matters."],
              ["RF", "Random Forest", "ensemble", "Handles non-linearity natively. Less tuning. Better for very large n."],
              ["NN", "Neural Network", "deep", "Best for raw images/text/audio. Needs lots of data and compute. SVM often beats shallow NNs on small datasets."],
              ["KNN", "k-Nearest Neighbors", "lazy", "Simple, no training. But O(n) inference and poor in high-dim (curse of dimensionality)."],
            ].map(r => (
              <div className="tf-leg" key={r[0]}>
                <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <div className="tf-lifecycle">
            {[
              ["Preprocess", "train", "Scale features (StandardScaler). Encode labels as ±1."],
              ["Kernel choice", "train", "Start with RBF. Try linear for high-dim text/gene data."],
              ["Tune C, γ", "train", "Grid search with 5-fold CV. C∈[0.01,1000], γ∈[0.0001,10]."],
              ["Train SVM", "train", "Solve QP. Store only support vectors (αᵢ > 0)."],
              ["Predict", "infer", "f(x) = Σ αᵢyᵢK(xᵢ,x) + b → sign gives class."],
            ].map(([label, phase, desc]) => (
              <div key={label} className={`tf-life tf-life--${phase}`}>
                <span className="tf-life-label">{label}</span>
                <span className="tf-life-desc">{desc}</span>
              </div>
            ))}
          </div>

          <Note icon="★">
            You've completed the SVM Classification walkthrough. Switch to <b>SVM (Regression)</b> above
            to see how the same maximum-margin principle extends to regression with the ε-insensitive tube.
          </Note>
        </>
      ),
    },
  ];

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "Support Vector Machine",
    subtitle: "maximum-margin classification with the kernel trick",
    cur: "SVM (Classification)",
    category: "Classification",
    run: (input) => window.ML_SVM.runSVMCls(input),
    default: { x1: 5.5, x2: 5.5 },
    renderInput,
    modeLinks: [
      { label: "Classification", href: "SVM (Classification).html", active: true },
      { label: "Regression (SVR)", href: "SVM (Regression).html", active: false },
    ],
  };
})();
