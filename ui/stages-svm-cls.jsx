/* ============================================================
   SVM Classification — 10 explainer stages
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
  const DX = 14, DY = 14;

  const sx = v => PAD.l + (v / DX) * plotW;
  const sy = v => PAD.t + plotH - (v / DY) * plotH;

  const HP_C = 10, MARGIN_POS_C = 13, MARGIN_NEG_C = 7;
  const W_VEC = [1/3, 1/3];
  const B_SCALAR = -10/3;
  const NORM_W = Math.sqrt(2) / 3;
  const MARGIN = 2 / NORM_W;

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
  const SV_SET = new Set(['4,3','7,6','6,7']);
  function DataPoints({ highlightSVs = false, showQuery = true, query = null, dimOthers = false }) {
    return (
      <>
        {CLS.data.map(([x1, x2, lbl], i) => {
          const key = `${x1},${x2}`;
          const isSV = SV_SET.has(key);
          const col = lbl === 1 ? COL_POS : COL_NEG;
          const opacity = dimOthers && !isSV ? 0.25 : 1;
          return (
            <g key={i} opacity={opacity}>
              {highlightSVs && isSV ? (
                <>
                  <rect x={sx(x1)-7} y={sy(x2)-7} width="14" height="14"
                    fill={col} stroke="var(--bg)" strokeWidth="2" rx="2" />
                  <rect x={sx(x1)-11} y={sy(x2)-11} width="22" height="22"
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
      id: "overview", group: "Overview", title: "What is a Support Vector Machine?",
      map: "Overview",
      why: "SVMs introduce the key insight of maximizing margin — choosing the hyperplane that is as far as possible from all training points. This geometric foundation makes SVMs theoretically elegant and practically robust.",
      render: (trace) => (
        <>
          <Lead>
            A <b>Support Vector Machine (SVM)</b> is a supervised learning algorithm that finds
            the <b>hyperplane</b> separating two classes with the <b>widest possible margin</b>.
            Think of it as building the widest possible highway between two cities: you want the
            road to be as far from both city borders as possible, so a car slightly off-course won't
            crash into anyone.
          </Lead>
          <Lead>
            Before we go further, let's define every term precisely. A <b>hyperplane</b> is a flat
            subspace of one dimension lower than the ambient space — in 2D it is a line, in 3D a plane,
            in nD an (n−1)-dimensional surface. The <b>decision boundary</b> is that hyperplane: points
            on one side are predicted class +1, points on the other side class −1. The <b>margin</b>
            is the perpendicular distance between the two parallel "gutter" lines that run through
            the nearest training points on each side. <b>Support vectors</b> are those nearest training
            points — the points that literally "support" and define the margin.
          </Lead>
          <Lead>
            When two classes can be separated by a straight line (or hyperplane), the data is
            <b> linearly separable</b> — the simple case we start with. When not, we use a
            <b> soft margin</b> (controlled by a parameter <b>C</b>) that allows a few points
            to violate the margin. When the data is not separable even with soft margin, we use the
            <b> kernel trick</b> to project the data into a higher-dimensional space where it
            becomes linearly separable.
          </Lead>
          <Lead>
            The full SVM pipeline: (1) represent the hyperplane as w·x + b = 0 where <b>w</b> is
            the weight vector (normal to the plane) and <b>b</b> is the bias; (2) scale w so the
            nearest points satisfy w·x+b = ±1; (3) solve the convex quadratic program that
            maximizes margin 2/‖w‖, equivalently minimizes ½‖w‖²; (4) predict sign(w·x+b) for
            any new point.
          </Lead>

          <div style={{ maxWidth: W }}>
            <ScatterBase>
              {hyperplaneLine(8.5, "rgba(180,180,180,0.5)", true, 1.5)}
              {(() => {
                const pts = clipLine(sx(0), sy(12.5), sx(14), sy(2), PAD.l, W-PAD.r, PAD.t, H-PAD.b);
                if (!pts) return null;
                return <line x1={pts[0]} y1={pts[1]} x2={pts[2]} y2={pts[3]}
                  stroke="rgba(180,180,180,0.5)" strokeWidth="1.5" strokeDasharray="6 3" />;
              })()}
              {marginBand(MARGIN_NEG_C, MARGIN_POS_C)}
              {hyperplaneLine(MARGIN_NEG_C, "var(--accent,#2b5bff)", true, 1.3)}
              {hyperplaneLine(MARGIN_POS_C, "var(--accent,#2b5bff)", true, 1.3)}
              {hyperplaneLine(HP_C, "var(--accent,#2b5bff)", false, 2.5)}
              <DataPoints showQuery={false} />
              <text x={sx(0.5)} y={sy(10.8)} fontSize="11" fill="rgba(140,140,140,0.9)" fontFamily="inherit">poor separators</text>
              <text x={sx(1.5)} y={sy(2.8)} fontSize="11" fill="var(--accent,#2b5bff)" fontWeight="700" fontFamily="inherit">max-margin ✓</text>
            </ScatterBase>
          </div>

          <div className="tf-archwrap" style={{ marginTop: 16 }}>
            <div className="tf-arch">
              <div className="tf-arch-io">Training data <b>X</b> (n×d), labels <b>y ∈ {"{−1, +1}"}</b></div>
              <div className="tf-arch-f"><b>Find: w (d-dim), b (scalar)</b></div>
              <div className="tf-arch-row">Maximise margin <b>2/‖w‖</b> subject to yᵢ(w·xᵢ + b) ≥ 1 ∀i</div>
              <div className="tf-arch-f"><b>Quadratic Programming → unique global optimum</b></div>
              <div className="tf-arch-io tf-arch-io--out">Predict <b>sign(w·x + b)</b> — +1 if f(x) ≥ 0, else −1</div>
            </div>
          </div>

          <div className="tf-legend">
            {[
              ["w", "weight vector", "d-dim", "Normal to the hyperplane. Its direction points toward class +1. Magnitude encodes margin width."],
              ["b", "bias", "scalar", "Shifts the hyperplane parallel to itself. Together with w, fully describes the decision boundary."],
              ["margin", "2/‖w‖", "scalar", "Perpendicular width of the gap between the two margin (gutter) lines. SVM maximises this."],
              ["SV", "support vector", "subset of X", "Training points lying exactly on the margin lines (w·x+b = ±1). They define the entire boundary."],
              ["C", "regularisation", "scalar", "Soft-margin penalty. Large C → narrow margin, few violations. Small C → wide margin, tolerates violations."],
              ["K(x,z)", "kernel function", "scalar", "Computes dot product in high-dim space implicitly. Enables non-linear decision boundaries."],
            ].map(r => (
              <div className="tf-leg" key={r[0]}>
                <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>
          <Note>
            Use the <b>x₁ and x₂ sliders</b> to move the query point ★ — every stage updates live
            with exact numbers computed from your chosen point.
          </Note>
        </>
      ),
    },

    /* ── Stage 2: Dataset ──────────────────────────────────── */
    {
      id: "dataset", group: "Data", title: "The Training Dataset",
      map: "Dataset",
      why: "Understanding the data geometry is the first step. SVM works best when classes are linearly separable — here we have 10 perfectly separable 2D points that illustrate the core idea without noise complications.",
      render: (trace) => (
        <>
          <Lead>
            Our dataset has <b>10 points</b> in 2D, split into two classes.
            <span style={{ color: COL_NEG }}> Class −1 (red, "Class A")</span> clusters in the
            lower-left; <span style={{ color: COL_POS }}>Class +1 (blue, "Class B")</span> clusters
            in the upper-right. The query point ★ is set by the sliders.
          </Lead>
          <Lead>
            The data is <b>linearly separable</b>: you can draw a straight line between the two
            classes without any misclassifications. This is the simplest case for SVM. In practice
            most datasets are not perfectly separable, which is why we introduce soft margin (Stage 6)
            and kernels (Stage 7). But understanding the linearly separable case first gives you the
            intuition for everything else.
          </Lead>
          <Lead>
            Notice the natural gap: all Class −1 points satisfy x₁+x₂ ≤ 7, and all Class +1 points
            satisfy x₁+x₂ ≥ 13. The gap between 7 and 13 is where the optimal hyperplane lives.
            The SVM's job is to find the line x₁+x₂ = c that maximises the distance to both clusters.
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
                caption="Training set (n=10, d=2)"
                sub="5 per class, linearly separable"
                heat={false}
              />
            </div>
          </Row>
          <Note>
            The clear gap between the two clusters is what makes this dataset easy for SVM.
            Class −1: x₁+x₂ ranges from 4 to 7. Class +1: x₁+x₂ ranges from 13 to 15.
            The optimal boundary lies at x₁+x₂ = 10, exactly halfway (in margin terms) between the two groups.
          </Note>
        </>
      ),
    },

    /* ── Stage 3: What is a Hyperplane? ────────────────────── */
    {
      id: "hyperplane", group: "Core Concept", title: "What is a Hyperplane? — The Decision Boundary",
      map: "Hyperplane",
      why: "The hyperplane is the geometric heart of SVM. Understanding how w and b parameterise it — and how sign(w·x+b) gives the class — is the foundation for everything else.",
      render: (trace) => {
        const { query, dist, label } = trace;
        const [x1, x2] = query;
        return (
          <>
            <Lead>
              In 2D, a <b>hyperplane is simply a line</b>: w₁x₁ + w₂x₂ + b = 0. In 3D it is a
              flat plane. In nD it is an (n−1)-dimensional surface. The equation w·x + b = 0
              defines the <b>decision boundary</b> — points exactly on this surface are equidistant
              from both margin lines.
            </Lead>
            <Lead>
              The <b>decision rule</b> is: predict class +1 if w·x + b ≥ 0, class −1 otherwise.
              Equivalently, sign(w·x + b) gives the class. The signed value f(x) = w·x + b tells
              you not just the class but also which side of the hyperplane you're on and how far away
              you are (after dividing by ‖w‖).
            </Lead>
            <Lead>
              There are infinitely many hyperplanes that correctly separate the data — they all have
              different margins. The grey dashed lines below are valid separators, but they're close
              to some points. The blue solid line is the <b>maximum-margin hyperplane</b>: it is the
              one that places itself as far as possible from both classes simultaneously.
            </Lead>

            <Formula label="Decision rule">
              f(x) = <b>w·x + b</b> = w₁x₁ + w₂x₂ + b &nbsp;→&nbsp; class = sign(f(x))
            </Formula>

            <ScatterBase>
              {/* several candidate hyperplanes */}
              {hyperplaneLine(9.0, "rgba(160,160,160,0.55)", true, 1.5)}
              {hyperplaneLine(11.0, "rgba(160,160,160,0.45)", true, 1.5)}
              {(() => {
                // a tilted line: x2 = -1.5*x1 + 16 → re-parameterised as passing through (4,10) and (8,4)
                const pts = clipLine(sx(3), sy(11.5), sx(10), sy(1), PAD.l, W-PAD.r, PAD.t, H-PAD.b);
                if (!pts) return null;
                return <line x1={pts[0]} y1={pts[1]} x2={pts[2]} y2={pts[3]}
                  stroke="rgba(160,160,160,0.45)" strokeWidth="1.5" strokeDasharray="5 3" />;
              })()}
              {/* margin band */}
              {marginBand(MARGIN_NEG_C, MARGIN_POS_C)}
              {hyperplaneLine(MARGIN_NEG_C, "var(--accent,#2b5bff)", true, 1.3)}
              {hyperplaneLine(MARGIN_POS_C, "var(--accent,#2b5bff)", true, 1.3)}
              {hyperplaneLine(HP_C, "var(--accent,#2b5bff)", false, 2.5)}
              <DataPoints showQuery={true} query={trace.query} />
              <text x={sx(0.5)} y={sy(9.5)} fontSize="10" fill="rgba(130,130,130,0.9)" fontFamily="inherit">candidates (valid, sub-optimal)</text>
              <text x={sx(4)} y={sy(4.5)} fontSize="11" fill="var(--accent,#2b5bff)" fontWeight="700" fontFamily="inherit">max-margin boundary</text>
            </ScatterBase>

            <div className="nn-calc" style={{ marginTop: 12 }}>
              <div className="nn-calc-h">Our hyperplane: w = [1/3, 1/3], b = −10/3</div>
              <div className="nn-calc-row">Equation: (1/3)x₁ + (1/3)x₂ − 10/3 = 0 &nbsp;→&nbsp; x₁ + x₂ = 10</div>
              <div className="nn-calc-row">Class +1 side: x₁ + x₂ &gt; 10 &nbsp; (w·x+b &gt; 0)</div>
              <div className="nn-calc-row">Class −1 side: x₁ + x₂ &lt; 10 &nbsp; (w·x+b &lt; 0)</div>
              <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                For ★ = ({fmt(x1)}, {fmt(x2)}): &nbsp; f(x) = ({fmt(x1)}+{fmt(x2)}−10)/3 = <b>{fmt(dist,4)}</b>
              </div>
              <div className="nn-calc-row">
                → Predicted class: <b style={{ color: label > 0 ? COL_POS : COL_NEG }}>{label > 0 ? "+1 (Class B)" : "−1 (Class A)"}</b>
              </div>
            </div>
            <Note>
              The weight vector <b>w = [1/3, 1/3]</b> points in the direction [1,1], which is
              perpendicular to the hyperplane x₁+x₂ = 10. Multiplying w by any positive constant
              gives the same hyperplane — that's why we normalise to make the functional margin exactly 1.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 4: The Margin ───────────────────────────────── */
    {
      id: "margin", group: "Core Concept", title: "The Margin — Why Widest is Best",
      map: "Margin",
      why: "The margin is the quantity SVM maximizes. A larger margin means the classifier can tolerate more noise — small perturbations in the data will not flip the prediction. This generalisation bound is one of SVM's key theoretical guarantees.",
      render: () => (
        <>
          <Lead>
            The <b>margin</b> is the total perpendicular width of the strip between the two
            <b> gutter lines</b> w·x+b = +1 and w·x+b = −1. Points on these lines are the support
            vectors. The width of the margin is 2/‖w‖ — to maximise it we must minimise ‖w‖.
          </Lead>
          <Lead>
            Minimising ‖w‖ is equivalent to minimising ½‖w‖² (a smooth, convex function), which
            leads to a <b>convex quadratic program</b> — a well-studied optimisation problem with a
            guaranteed unique global minimum. There are no local minima to get stuck in, unlike
            neural networks.
          </Lead>
          <Lead>
            For our dataset with w = [1/3, 1/3], the norm is ‖w‖ = √(1/9 + 1/9) = √2/3 ≈ {fmt(NORM_W, 4)}.
            The margin is 2/‖w‖ = 6/√2 = 3√2 ≈ <b>{fmt(MARGIN, 4)}</b> — that's the perpendicular width
            of the shaded band in the chart.
          </Lead>

          <Formula label="Margin width">margin = <b>2 / ‖w‖</b> = 2 / (√2/3) = 6/√2 = 3√2 ≈ <b>{fmt(MARGIN, 4)}</b></Formula>
          <Formula label="Optimisation">Maximise margin &nbsp;↔&nbsp; Minimise <b>½ ‖w‖²</b> subject to yᵢ(w·xᵢ + b) ≥ 1 for all i</Formula>

          <ScatterBase>
            {marginBand(MARGIN_NEG_C, MARGIN_POS_C)}
            {hyperplaneLine(MARGIN_NEG_C, COL_NEG, true, 1.8)}
            {hyperplaneLine(MARGIN_POS_C, COL_POS, true, 1.8)}
            {hyperplaneLine(HP_C, "var(--accent,#2b5bff)", false, 2.5)}
            <DataPoints showQuery={false} />
            {/* perpendicular margin bracket at x1=5, x2=5 on hyperplane */}
            {(() => {
              const mx = 5, my = HP_C - mx;
              const hw = MARGIN / 2 / Math.sqrt(2);
              return (
                <g>
                  <line x1={sx(mx-hw)} y1={sy(my-hw)} x2={sx(mx+hw)} y2={sy(my+hw)}
                    stroke="var(--ink)" strokeWidth="2" strokeDasharray="4 2" />
                  <circle cx={sx(mx-hw)} cy={sy(my-hw)} r="3" fill={COL_NEG} />
                  <circle cx={sx(mx+hw)} cy={sy(my+hw)} r="3" fill={COL_POS} />
                  <text x={sx(mx)+6} y={sy(my)-2} fontSize="11" fill="var(--accent)" fontWeight="700" fontFamily="inherit">
                    margin ≈ {fmt(MARGIN,2)}
                  </text>
                </g>
              );
            })()}
            <text x={sx(0.5)} y={sy(MARGIN_NEG_C-0.6)} fontSize="10" fill={COL_NEG} fontFamily="inherit">w·x+b = −1</text>
            <text x={sx(0.5)} y={sy(HP_C-0.5)} fontSize="10" fill="var(--accent,#2b5bff)" fontFamily="inherit">w·x+b = 0</text>
            <text x={sx(0.5)} y={sy(MARGIN_POS_C-0.5)} fontSize="10" fill={COL_POS} fontFamily="inherit">w·x+b = +1</text>
          </ScatterBase>

          <Row>
            <div className="nn-calc" style={{ flex: "1 1 220px" }}>
              <div className="nn-calc-h">Our solution (unit functional margin)</div>
              <div className="nn-calc-row">w = [1/3, 1/3]</div>
              <div className="nn-calc-row">‖w‖ = √(1/9 + 1/9) = √2/3 ≈ {fmt(NORM_W, 4)}</div>
              <div className="nn-calc-row">½‖w‖² = {fmt(0.5 * NORM_W * NORM_W, 5)} (minimised)</div>
              <div className="nn-calc-row"><b>Margin = 2/‖w‖ = {fmt(MARGIN, 4)}</b></div>
            </div>
            <div className="nn-calc" style={{ flex: "1 1 220px" }}>
              <div className="nn-calc-h">Gutter lines</div>
              <div className="nn-calc-row" style={{ color: COL_POS }}>Positive gutter: x₁+x₂ = 13</div>
              <div className="nn-calc-row" style={{ color: COL_NEG }}>Negative gutter: x₁+x₂ = 7</div>
              <div className="nn-calc-row">Gap between gutters = 6 (in x₁+x₂ units)</div>
              <div className="nn-calc-row">Perpendicular distance = 6/√2 = {fmt(MARGIN, 3)}</div>
            </div>
          </Row>
          <Note>
            Maximising the margin is <em>exactly</em> minimising ‖w‖² because margin = 2/‖w‖.
            The constraint yᵢ(w·xᵢ+b) ≥ 1 ensures all training points are on the correct side
            and at least a functional margin of 1 from the boundary.
          </Note>
        </>
      ),
    },

    /* ── Stage 5: Support Vectors ──────────────────────────── */
    {
      id: "support-vectors", group: "Core Concept", title: "Support Vectors — The Defining Points",
      map: "Support Vectors",
      why: "Support vectors are the only training points that matter — you can remove all others without changing the solution. This sparsity gives SVMs memory efficiency and a clean geometric story.",
      render: () => {
        const svData = [
          { pt: [4,3,-1], fm: (1/3)*4+(1/3)*3-10/3 },
          { pt: [7,6,+1], fm: (1/3)*7+(1/3)*6-10/3 },
          { pt: [6,7,+1], fm: (1/3)*6+(1/3)*7-10/3 },
        ];
        return (
          <>
            <Lead>
              <b>Support vectors</b> are training points that lie exactly on the gutter lines
              w·x+b = +1 or w·x+b = −1. For our 10-point dataset there are only <b>3 support vectors</b>:
              one from class −1 at (4,3) and two from class +1 at (7,6) and (6,7).
            </Lead>
            <Lead>
              These 3 points <em>completely determine</em> the hyperplane. You can move, add, or
              remove any of the other 7 points (as long as they stay on the correct side of the
              margin) without changing w or b at all. This is why SVMs are considered
              <b> sparse</b> models — at inference time you only need the support vectors, not the
              entire training set.
            </Lead>
            <Lead>
              Verify: for each support vector, compute w·x+b and check it equals ±1.
              The numbers below confirm this exactly (the small deviation from ±1.000 is just
              floating-point rounding).
            </Lead>

            <ScatterBase>
              {marginBand(MARGIN_NEG_C, MARGIN_POS_C)}
              {hyperplaneLine(MARGIN_NEG_C, COL_NEG, true, 1.8)}
              {hyperplaneLine(MARGIN_POS_C, COL_POS, true, 1.8)}
              {hyperplaneLine(HP_C, "var(--accent,#2b5bff)", false, 2.5)}
              <DataPoints highlightSVs={true} dimOthers={true} showQuery={false} />
              <text x={sx(4)+13} y={sy(3)+4} fontSize="11" fontWeight="700" fill={COL_NEG} fontFamily="inherit">SV₁ (−1)</text>
              <text x={sx(7)+13} y={sy(6)+4} fontSize="11" fontWeight="700" fill={COL_POS} fontFamily="inherit">SV₂ (+1)</text>
              <text x={sx(6)+13} y={sy(7)+4} fontSize="11" fontWeight="700" fill={COL_POS} fontFamily="inherit">SV₃ (+1)</text>
            </ScatterBase>

            <div className="tf-subhead">Verification: w·x+b = ±1 for each support vector</div>
            <Matrix
              data={svData.map(({ pt: [x1, x2, y], fm }) => [x1, x2, y, fmt(fm, 5), Math.abs(fm - y) < 0.01 ? "✓" : "✗"])}
              rowLabels={["SV₁","SV₂","SV₃"]}
              colLabels={["x₁", "x₂", "y", "w·x+b", "= ±1?"]}
              caption="Support vectors — functional margin exactly ±1"
              sub="Only these 3 of 10 points define the boundary"
              heat={false}
            />

            <div className="nn-calc" style={{ marginTop: 8 }}>
              <div className="nn-calc-h">Detailed check for SV₁ = (4, 3), class −1</div>
              <div className="nn-calc-row">w·x+b = (1/3)×4 + (1/3)×3 − 10/3</div>
              <div className="nn-calc-row">= 4/3 + 3/3 − 10/3 = (4+3−10)/3 = −3/3 = <b>−1.000 ✓</b></div>
              <div className="nn-calc-row">Functional margin = y × (w·x+b) = (−1) × (−1) = <b>+1 ✓</b></div>
            </div>
            <Note>
              <b>Squares</b> = support vectors; dimmed circles are non-support vectors.
              The KKT (Karush-Kuhn-Tucker) conditions of the optimisation guarantee that
              only support vectors have non-zero Lagrange multipliers αᵢ &gt; 0 — confirming their
              special role.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 6: Soft Margin & C ──────────────────────────── */
    {
      id: "soft-margin", group: "Extensions", title: "Soft Margin — The C Parameter",
      map: "Soft Margin (C)",
      why: "Real data is almost never perfectly separable. The soft-margin SVM generalises the hard-margin case with slack variables and the C hyperparameter, making SVMs practical for real-world use.",
      render: () => (
        <>
          <Lead>
            Real-world data is rarely perfectly separable. The <b>soft-margin SVM</b> extends
            the hard-margin case by introducing <b>slack variables</b> ξᵢ ≥ 0. Each ξᵢ measures
            how much point i violates the margin: ξᵢ = 0 means fully outside (or on) the margin;
            0 &lt; ξᵢ ≤ 1 means inside the margin but on the correct side;
            ξᵢ &gt; 1 means misclassified.
          </Lead>
          <Lead>
            The <b>C parameter</b> (regularisation strength) controls the trade-off between
            margin width and total slack. Large C: heavy penalty for violations → narrow margin,
            few violations, risk of overfitting. Small C: light penalty → wide margin, more
            violations allowed, better generalisation. C is typically tuned by cross-validation
            over a logarithmic grid like C ∈ {"{0.001, 0.01, 0.1, 1, 10, 100}"}.
          </Lead>
          <Lead>
            The total slack Σξᵢ is an upper bound on the number of training errors. The objective
            balances two competing goals: maximise the margin (minimise ½‖w‖²) AND minimise
            total violations (minimise C·Σξᵢ). The chart below simulates a point that violates
            the margin — its slack value ξ is the distance it intrudes.
          </Lead>

          <Formula label="Primal (soft margin)">min<Sub>w,b,ξ</Sub>&nbsp; ½‖w‖² + C · Σξᵢ</Formula>
          <Formula label="Constraints">yᵢ(w·xᵢ + b) ≥ 1 − ξᵢ &nbsp;&nbsp; ξᵢ ≥ 0 &nbsp;&nbsp; ∀i = 1…n</Formula>

          <ScatterBase>
            {marginBand(MARGIN_NEG_C, MARGIN_POS_C)}
            {hyperplaneLine(MARGIN_NEG_C, "var(--accent,#2b5bff)", true, 1.5)}
            {hyperplaneLine(MARGIN_POS_C, "var(--accent,#2b5bff)", true, 1.5)}
            {hyperplaneLine(HP_C, "var(--accent,#2b5bff)", false, 2.5)}
            {/* Simulated violating point inside margin */}
            <circle cx={sx(8)} cy={sy(8)} r="7" fill={COL_NEG} stroke="var(--bg)" strokeWidth="2" />
            <circle cx={sx(8)} cy={sy(8)} r="13" fill="none" stroke={COL_NEG} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7" />
            <text x={sx(8)+16} y={sy(8)+4} fontSize="11" fill={COL_NEG} fontWeight="700" fontFamily="inherit">ξ &gt; 0 (violation)</text>
            {/* draw slack arrow from gutter to point */}
            {(() => {
              // Point (8,8) is class -1 (NEG), it should be on the x1+x2 ≤ 7 side
              // distance from margin line x1+x2=7: (8+8-7)/sqrt(2) = 9/sqrt(2) violation
              const footT = (MARGIN_NEG_C - 8 - 8) / 2; // t where foot is on gutter line
              const fx = 8 + footT, fy = 8 + footT;
              return (
                <line x1={sx(8)} y1={sy(8)} x2={sx(fx)} y2={sy(fy)}
                  stroke={COL_NEG} strokeWidth="2" strokeDasharray="4 2" opacity="0.8" />
              );
            })()}
            <DataPoints showQuery={false} />
          </ScatterBase>

          <div className="tf-subhead">Effect of C on the decision boundary</div>
          <div className="tf-legend">
            {[
              ["C → ∞", "Hard margin", "strict", "No violations allowed. Sensitive to outliers — one outlier can dominate by becoming an SV. May not converge if data is inseparable."],
              ["C large", "Tight margin", "precise", "Heavy penalty → few violations, narrower effective margin. Prone to overfitting on noisy data."],
              ["C ~ 1", "Balanced", "default", "Good starting point. Balance between wide margin and few errors. Tune via cross-validation."],
              ["C small", "Wide margin", "robust", "Generous penalty tolerance → wide margin, more misclassifications allowed. Better generalisation on noisy data."],
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
                <li className="opt-pc-li">Robust to outliers (ξ absorbs violations)</li>
                <li className="opt-pc-li">C is easy to tune via cross-validation</li>
                <li className="opt-pc-li">Σξᵢ bounds the training error count</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">Considerations</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">C is a critical hyperparameter — must be tuned</li>
                <li className="opt-pc-li">Hinge loss: L = max(0, 1 − yf(x))</li>
                <li className="opt-pc-li">Balance C with kernel γ for RBF kernel SVMs</li>
                <li className="opt-pc-li">Large violations (ξ &gt; 1) are misclassifications</li>
              </ul>
            </div>
          </div>
          <Note>
            Interpretation guide: ξᵢ = 0 → point satisfies constraint fully (outside margin);
            0 &lt; ξᵢ ≤ 1 → inside the margin but correctly classified;
            ξᵢ &gt; 1 → misclassified. Total Σξᵢ ≥ (number of training errors).
          </Note>
        </>
      ),
    },

    /* ── Stage 7: Kernel Trick ─────────────────────────────── */
    {
      id: "kernel-trick", group: "Extensions", title: "The Kernel Trick — Non-Linear SVMs",
      map: "Kernel Trick",
      why: "The kernel trick is SVM's most powerful feature. It gives non-linear decision boundaries without ever computing the high-dimensional mapping explicitly — saving both memory and computation.",
      render: () => {
        // Mini XOR scatter
        const xorPts = [[60,120,"neg"],[120,60,"neg"],[60,60,"pos"],[120,120,"pos"]];
        return (
          <>
            <Lead>
              Sometimes data that is <b>not linearly separable</b> in the original feature space
              becomes linearly separable in a higher-dimensional space. For example, the XOR pattern
              (shown below) cannot be separated by any line in 2D, but in 3D (with feature x₁x₂ added)
              it becomes trivially separable.
            </Lead>
            <Lead>
              The <b>kernel trick</b> exploits this without ever computing the mapping φ(x) explicitly.
              A <b>kernel function</b> K(xᵢ, xⱼ) = φ(xᵢ)·φ(xⱼ) computes the dot product in
              high-dimensional space using only the original low-dimensional features. Since the SVM
              dual objective and prediction formula only need dot products, you can swap x·z → K(x,z)
              and get a non-linear SVM for free.
            </Lead>
            <Lead>
              The prediction formula becomes f(x) = Σ αᵢyᵢK(xᵢ, x) + b. The RBF (Gaussian) kernel
              K(x,z) = exp(−γ‖x−z‖²) implicitly maps to an <b>infinite-dimensional</b> feature space
              yet is computed in O(d) time — that's the remarkable power of the trick.
            </Lead>

            <Row>
              <div style={{ flex: "0 0 220px" }}>
                <div className="tf-subhead" style={{ marginBottom: 4 }}>XOR — not linearly separable</div>
                <svg viewBox="0 0 200 190" style={{ width: 200, display: "block" }}>
                  <line x1="20" y1="165" x2="185" y2="165" stroke="var(--ink)" strokeWidth="1.5" />
                  <line x1="20" y1="15" x2="20" y2="165" stroke="var(--ink)" strokeWidth="1.5" />
                  {xorPts.map(([cx,cy,cls],i) => (
                    <circle key={i} cx={cx} cy={cy} r="11"
                      fill={cls==="pos" ? COL_POS : COL_NEG} stroke="var(--bg)" strokeWidth="2" />
                  ))}
                  <text x="103" y="180" textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="inherit">x₁</text>
                  <text x="10" y="93" textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="inherit" transform="rotate(-90,10,93)">x₂</text>
                  <text x="103" y="27" textAnchor="middle" fontSize="10" fill={COL_NEG} fontWeight="700" fontFamily="inherit">Not separable in 2D</text>
                  <text x="38" y="143" fontSize="9" fill="var(--muted)" fontFamily="inherit">(1,−1)</text>
                  <text x="103" y="143" fontSize="9" fill="var(--muted)" fontFamily="inherit">(−1,−1)</text>
                  <text x="38" y="43" fontSize="9" fill="var(--muted)" fontFamily="inherit">(1,+1)</text>
                  <text x="103" y="43" fontSize="9" fill="var(--muted)" fontFamily="inherit">(−1,+1)</text>
                </svg>
              </div>

              <div style={{ flex: "1" }}>
                <div className="nn-calc" style={{ marginBottom: 8 }}>
                  <div className="nn-calc-h">How the kernel trick works (step by step)</div>
                  <div className="nn-calc-row">1. Write SVM dual: max Σαᵢ − ½ ΣΣ αᵢαⱼyᵢyⱼ(xᵢ·xⱼ)</div>
                  <div className="nn-calc-row">2. Replace dot product: (xᵢ·xⱼ) → K(xᵢ, xⱼ)</div>
                  <div className="nn-calc-row">3. Solve QP in terms of αᵢ (same algorithm!)</div>
                  <div className="nn-calc-row">4. Predict: f(x) = Σ αᵢyᵢK(xᵢ, x) + b</div>
                  <div className="nn-calc-row"><b>φ(x) is never computed explicitly.</b></div>
                </div>
                <div className="nn-calc">
                  <div className="nn-calc-h">XOR fix with polynomial kernel K(x,z) = (x·z)²</div>
                  <div className="nn-calc-row">Maps [x₁,x₂] → [x₁², x₁x₂, x₂²] (3D)</div>
                  <div className="nn-calc-row">In 3D, XOR IS linearly separable!</div>
                  <div className="nn-calc-row">The 2D "boundary" is a circle (not a line)</div>
                </div>
              </div>
            </Row>

            <div className="tf-subhead" style={{ marginTop: 12 }}>Common kernels</div>
            <div className="tf-legend">
              {[
                ["Linear", "K(x,z) = x·z", "d-dim", "No mapping. Same as standard SVM. Preferred for high-dimensional sparse data like text (TF-IDF) and gene expressions."],
                ["Polynomial", "K(x,z) = (γx·z + r)^d", "O(d^d)", "Captures feature interactions up to degree d. Good for image data. Slow for large d."],
                ["RBF", "K(x,z) = exp(−γ‖x−z‖²)", "∞-dim", "Most popular default. Places a Gaussian bump around each SV. Smooth, universal approximator. Tune γ carefully."],
                ["Sigmoid", "K(x,z) = tanh(γx·z + r)", "neural", "Mimics a single hidden-layer neural network. Not always a valid kernel (not always positive definite)."],
              ].map(r => (
                <div className="tf-leg" key={r[0]}>
                  <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div>
                  <div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>
            <Note>
              A function K is a valid kernel if and only if it is a symmetric positive semi-definite
              function (Mercer's theorem). This guarantees the implicit feature space exists and the
              dual QP remains convex.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 8: Predictions ──────────────────────────────── */
    {
      id: "prediction", group: "Prediction", title: "Full Prediction Walkthrough",
      map: "Prediction",
      why: "Seeing the complete computation from raw input to predicted class — with actual numbers — ties together every SVM concept and shows exactly what happens at inference time.",
      render: (trace) => {
        const { query, dist, label } = trace;
        const [x1, x2] = query;
        const distNorm = dist / NORM_W;
        const insideMargin = Math.abs(dist) < 1;

        // Three fixed test points
        const testPts = [[3, 2], [7, 6], [11, 9]];
        return (
          <>
            <Lead>
              At inference, the trained SVM only needs the support vectors (and learned αᵢ values)
              to compute f(x) = w·x + b, then returns sign(f(x)) as the class. For a linear kernel
              this simplifies to f(x) = w₁x₁ + w₂x₂ + b with w = [1/3, 1/3] and b = −10/3.
            </Lead>
            <Lead>
              The <b>signed distance</b> from the hyperplane is d = f(x)/‖w‖. A point far from the
              boundary (large |d|) is confidently classified; a point near the boundary (small |d|)
              is uncertain. The margin zone is |d| ≤ 3/√2 ≈ {fmt(MARGIN/2, 2)} (half the margin width).
            </Lead>

            <ScatterBase>
              {marginBand(MARGIN_NEG_C, MARGIN_POS_C)}
              {hyperplaneLine(MARGIN_NEG_C, "var(--accent,#2b5bff)", true, 1.2)}
              {hyperplaneLine(MARGIN_POS_C, "var(--accent,#2b5bff)", true, 1.2)}
              {hyperplaneLine(HP_C, "var(--accent,#2b5bff)", false, 2.5)}
              <DataPoints showQuery={true} query={query} />
              {/* foot of perpendicular from query to hyperplane */}
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
              <div className="nn-calc-h">Live prediction for ★ = ({fmt(x1)}, {fmt(x2)})</div>
              <div className="nn-calc-row">f(x) = (1/3)×{fmt(x1)} + (1/3)×{fmt(x2)} − 10/3</div>
              <div className="nn-calc-row">= ({fmt(x1)} + {fmt(x2)} − 10) / 3 = {fmt(x1+x2-10,3)}/3</div>
              <div className="nn-calc-row"><b>f(x) = {fmt(dist, 4)}</b></div>
              <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                Signed distance = f(x) / ‖w‖ = {fmt(dist,4)} / {fmt(NORM_W,4)} = <b>{fmt(distNorm,4)}</b>
              </div>
              <div className="nn-calc-row">
                Class = sign({fmt(dist,4)}) = <b style={{ color: label > 0 ? COL_POS : COL_NEG }}>
                  {label > 0 ? "+1 (Class B)" : "−1 (Class A)"}
                </b>
                {insideMargin ? " ← inside margin (uncertain)" : " ← outside margin (confident)"}
              </div>
            </div>

            <div className="tf-subhead" style={{ marginTop: 12 }}>Predictions for 3 fixed test points</div>
            <Matrix
              data={testPts.map(([px, py]) => {
                const fv = (1/3)*px + (1/3)*py - 10/3;
                const cls = fv >= 0 ? +1 : -1;
                const d = fv / NORM_W;
                return [px, py, fv, d, cls > 0 ? "+1 (B)" : "−1 (A)"];
              })}
              rowLabels={["Test₁","Test₂","Test₃"]}
              colLabels={["x₁","x₂","f(x)","dist","class"]}
              caption="Fixed test point predictions"
              sub="dist = signed distance from hyperplane"
              heat={false}
            />
            <Note>
              The dashed line from ★ to the blue dot on the hyperplane shows the perpendicular distance
              d. When ★ is on the hyperplane, d = 0 and f(x) = 0. On the margin lines, |f(x)| = 1
              and |d| = 1/‖w‖ = {fmt(1/NORM_W, 3)}.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 9: Missing Values & Outliers ────────────────── */
    {
      id: "missing-outliers", group: "Robustness", title: "Missing Values & Outliers",
      map: "Robustness",
      why: "SVM is highly sensitive to outliers because a single bad point can become a support vector and completely shift the hyperplane. Understanding this helps you preprocess data correctly.",
      render: () => {
        // Show the normal SVM and then one with an outlier at (8, 9) class -1
        // This point has w·x+b = (8+9-10)/3 = 7/3 > 0 — on the wrong side — so it would force
        // a new hyperplane. We show both boundaries side-by-side.
        const outlierPt = [8, 9, -1];
        const normalData = CLS.data;

        const miniW = 210, miniH = 220;
        const mPad = { l: 20, r: 10, t: 16, b: 24 };
        const msx = v => mPad.l + (v / DX) * (miniW - mPad.l - mPad.r);
        const msy = v => mPad.t + (miniH - mPad.t - mPad.b) - (v / DY) * (miniH - mPad.t - mPad.b);

        function miniHPLine(C, color, dashed, mw) {
          const l = clipLine(msx(0), msy(C), msx(DX), msy(C-DX), mPad.l, miniW-mPad.r, mPad.t, miniH-mPad.b);
          if (!l) return null;
          return <line x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]}
            stroke={color} strokeWidth={mw||1.8} strokeDasharray={dashed?"5 3":undefined} strokeLinecap="round" />;
        }

        return (
          <>
            <Lead>
              SVMs are <b>very sensitive to outliers</b> because a single outlier can become a
              support vector and completely change the hyperplane. This is because the margin is
              defined by the nearest points on each side — move one of those points and the entire
              boundary shifts.
            </Lead>
            <Lead>
              <b>Missing values</b> are a separate problem: SVMs require complete feature vectors —
              there is no built-in mechanism to handle NaN values. Before training you must
              <b> impute</b> missing values (mean/median/mode imputation, k-NN imputation, or
              model-based imputation). Missing values left as NaN will cause errors or silently
              produce incorrect dot products.
            </Lead>
            <Lead>
              The soft-margin parameter C partially mitigates outlier sensitivity: a small C
              allows the outlier to have slack (ξ &gt; 0) without shifting the hyperplane much.
              With C → ∞ (hard margin), even one misplaced point forces the boundary to accommodate it.
              The charts below show the dramatic effect of one outlier on the learned boundary.
            </Lead>

            <Row>
              <div style={{ flex: "1 1 210px" }}>
                <div className="tf-subhead" style={{ fontSize: 12 }}>Normal dataset — 3 SVs</div>
                <svg viewBox={`0 0 ${miniW} ${miniH}`} style={{ width: "100%", maxWidth: miniW, display: "block" }}>
                  <line x1={mPad.l} y1={miniH-mPad.b} x2={miniW-mPad.r} y2={miniH-mPad.b} stroke="var(--ink)" strokeWidth="1" />
                  <line x1={mPad.l} y1={mPad.t} x2={mPad.l} y2={miniH-mPad.b} stroke="var(--ink)" strokeWidth="1" />
                  {/* margin band */}
                  {(() => {
                    const pLo = clipLine(msx(0),msy(7),msx(DX),msy(7-DX),mPad.l,miniW-mPad.r,mPad.t,miniH-mPad.b);
                    const pHi = clipLine(msx(0),msy(13),msx(DX),msy(13-DX),mPad.l,miniW-mPad.r,mPad.t,miniH-mPad.b);
                    if (!pLo||!pHi) return null;
                    const pts = `${pHi[0]},${pHi[1]} ${pHi[2]},${pHi[3]} ${pLo[2]},${pLo[3]} ${pLo[0]},${pLo[1]}`;
                    return <polygon points={pts} fill="rgba(43,91,255,0.08)" />;
                  })()}
                  {miniHPLine(7, "var(--accent)", true, 1.2)}
                  {miniHPLine(13, "var(--accent)", true, 1.2)}
                  {miniHPLine(10, "var(--accent)", false, 2)}
                  {normalData.map(([x1, x2, lbl], i) => {
                    const key = `${x1},${x2}`;
                    const isSV = SV_SET.has(key);
                    const col = lbl === 1 ? COL_POS : COL_NEG;
                    return isSV
                      ? <rect key={i} x={msx(x1)-5} y={msy(x2)-5} width="10" height="10" fill={col} stroke="var(--bg)" strokeWidth="1.5" rx="2" />
                      : <circle key={i} cx={msx(x1)} cy={msy(x2)} r="4.5" fill={col} stroke="var(--bg)" strokeWidth="1.5" />;
                  })}
                  <text x={miniW/2} y={miniH-6} textAnchor="middle" fontSize="9" fill="var(--muted)" fontFamily="inherit">margin = {fmt(MARGIN,2)}</text>
                </svg>
              </div>

              <div style={{ flex: "1 1 210px" }}>
                <div className="tf-subhead" style={{ fontSize: 12 }}>With outlier (8,9) class −1 — boundary shifts!</div>
                <svg viewBox={`0 0 ${miniW} ${miniH}`} style={{ width: "100%", maxWidth: miniW, display: "block" }}>
                  <line x1={mPad.l} y1={miniH-mPad.b} x2={miniW-mPad.r} y2={miniH-mPad.b} stroke="var(--ink)" strokeWidth="1" />
                  <line x1={mPad.l} y1={mPad.t} x2={mPad.l} y2={miniH-mPad.b} stroke="var(--ink)" strokeWidth="1" />
                  {/* shifted boundary at x1+x2 = ~11.5, margin lines at ~8.5 and ~14.5 */}
                  {(() => {
                    const pLo = clipLine(msx(0),msy(8.5),msx(DX),msy(8.5-DX),mPad.l,miniW-mPad.r,mPad.t,miniH-mPad.b);
                    const pHi = clipLine(msx(0),msy(14.5),msx(DX),msy(14.5-DX),mPad.l,miniW-mPad.r,mPad.t,miniH-mPad.b);
                    if (!pLo||!pHi) return null;
                    const pts = `${pHi[0]},${pHi[1]} ${pHi[2]},${pHi[3]} ${pLo[2]},${pLo[3]} ${pLo[0]},${pLo[1]}`;
                    return <polygon points={pts} fill="rgba(226,76,96,0.08)" />;
                  })()}
                  {miniHPLine(8.5, "rgba(226,76,96,0.6)", true, 1.2)}
                  {miniHPLine(14.5, "rgba(226,76,96,0.6)", true, 1.2)}
                  {miniHPLine(11.5, "rgba(226,76,96,0.9)", false, 2)}
                  {normalData.map(([x1, x2, lbl], i) => (
                    <circle key={i} cx={msx(x1)} cy={msy(x2)} r="4" fill={lbl===1?COL_POS:COL_NEG} stroke="var(--bg)" strokeWidth="1.5" opacity="0.7" />
                  ))}
                  {/* outlier */}
                  <circle cx={msx(outlierPt[0])} cy={msy(outlierPt[1])} r="6" fill={COL_NEG} stroke="gold" strokeWidth="2.5" />
                  <text x={msx(8)+10} y={msy(9)+4} fontSize="10" fill="gold" fontWeight="700" fontFamily="inherit">outlier!</text>
                  <text x={miniW/2} y={miniH-6} textAnchor="middle" fontSize="9" fill="rgba(226,76,96,0.9)" fontFamily="inherit">boundary shifted by 1.5 units</text>
                </svg>
              </div>
            </Row>

            <div className="tf-legend" style={{ marginTop: 12 }}>
              {[
                ["Outlier effect", "SV displacement", "high risk", "One outlier near the boundary becomes an SV and shifts the hyperplane. Hard margin (C→∞) is worst affected."],
                ["Soft margin fix", "Slack ξ > 0", "mitigated", "Small C lets the outlier incur slack instead of shifting the boundary. Effectively ignores extreme outliers."],
                ["Missing values", "Must impute", "required", "SVMs require complete feature vectors. Use mean/median imputation or sklearn SimpleImputer before training."],
                ["Feature scaling", "Critical", "always", "SVMs are not scale-invariant. Always StandardScale (zero mean, unit variance) before fitting. Unscaled features dominate the kernel."],
              ].map(r => (
                <div className="tf-leg" key={r[0]}>
                  <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div>
                  <div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>
            <Note>
              The gold-outlined point (8,9) has functional value f(8,9) = (8+9−10)/3 = 7/3 ≈ 2.33 — it's
              on the wrong side of the original boundary entirely. As a new support vector it forces the
              hyperplane to shift from x₁+x₂=10 toward x₁+x₂≈11.5, reducing the margin for the
              original well-separated data.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 10: Strengths, Weaknesses & When to Use ────── */
    {
      id: "when-to-use", group: "Evaluation", title: "Strengths, Weaknesses & When to Use SVM",
      map: "When to Use",
      why: "Knowing when SVM is the right tool prevents both underuse and overuse. The comparison with logistic regression, random forest, and neural networks helps you choose the right model for your task and dataset.",
      render: () => (
        <>
          <Lead>
            SVMs shine in <b>high-dimensional, small-sample</b> settings — text classification,
            bioinformatics (gene expression), image recognition with hand-crafted features. The
            kernel trick enables non-linear boundaries without changing the core algorithm.
            When n &gt; 50 000 or the relationship is extremely complex, alternatives may be better.
          </Lead>
          <Lead>
            The key distinguishing feature of SVM versus logistic regression is the
            <b> margin-maximisation objective</b>. Logistic regression minimises log-loss and can
            predict probabilities directly; SVM maximises geometric margin and requires Platt scaling
            for probability outputs. For high-dimensional sparse data (text), linear SVM (liblinear)
            is often faster and comparably accurate to logistic regression.
          </Lead>

          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">SVM Strengths</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">Effective in high-dimensional spaces (d &gt;&gt; n)</li>
                <li className="opt-pc-li">Memory-efficient — stores only SVs at inference</li>
                <li className="opt-pc-li">Versatile: linear, RBF, polynomial, sigmoid kernels</li>
                <li className="opt-pc-li">Unique global optimum — convex QP, no local minima</li>
                <li className="opt-pc-li">Strong theoretical foundation (VC dimension / PAC theory)</li>
                <li className="opt-pc-li">Robust to outliers with soft margin (small C)</li>
                <li className="opt-pc-li">Works well when n is small and d is large (text, genes)</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">SVM Limitations</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">Slow on large datasets — O(n² to n³) training</li>
                <li className="opt-pc-li">Requires feature scaling (critical — always StandardScale)</li>
                <li className="opt-pc-li">C, kernel type, and γ all require cross-validation</li>
                <li className="opt-pc-li">No native probability output (needs Platt scaling)</li>
                <li className="opt-pc-li">Multi-class needs one-vs-one or one-vs-rest decomposition</li>
                <li className="opt-pc-li">RBF kernel is a black box — poor interpretability</li>
                <li className="opt-pc-li">Missing values must be handled before fitting</li>
              </ul>
            </div>
          </div>

          <div className="tf-subhead">SVM vs alternatives — when to use each</div>
          <div className="tf-legend">
            {[
              ["SVM", "Support Vector Machine", "your choice", "Best for: high-dim sparse data (text/genes), small-medium n, clear margin between classes, non-linear data with RBF kernel."],
              ["LR", "Logistic Regression", "baseline", "Best for: large n, need probability output, interpretability important, data is roughly linearly separable. Faster to train."],
              ["RF", "Random Forest", "ensemble", "Best for: tabular data, non-linear patterns, handles missing values natively, n large, want feature importances."],
              ["NN", "Neural Network", "deep", "Best for: raw images/text/audio, huge datasets, complex hierarchical patterns. Overkill for small n — SVM often wins."],
              ["KNN", "k-Nearest Neighbours", "lazy", "Simple baseline, no training. But O(n) inference and broken in high dimensions (curse of dimensionality)."],
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
              ["Preprocess", "train", "StandardScale X. Encode labels as ±1. Impute missing values. Balanced classes or use class_weight."],
              ["Kernel choice", "train", "Start with linear kernel for high-dim text/gene data. Try RBF for moderate-dim non-linear data."],
              ["Tune C, γ", "train", "Grid/random search with 5-fold CV. C ∈ [0.01, 1000], γ ∈ [0.0001, 10] (log scale)."],
              ["Train SVM", "train", "Solve QP (libsvm/liblinear). Store only support vectors (αᵢ > 0). Log: number of SVs."],
              ["Evaluate", "train", "Accuracy, F1, AUC-ROC. Use Platt scaling if probabilities needed. Check n_support_vectors."],
              ["Predict", "infer", "f(x) = Σ αᵢyᵢK(xᵢ,x) + b → sign gives class. Only O(n_sv × d) per prediction."],
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
      { label: "Regression", href: "SVM (Regression).html", active: false },
    ],
  };
})();
