/* ============================================================
   SVM Regression (SVR) — 9 explainer stages
   Requires: window.ML_SVM (from model/ml-svm.js)
             window.{ Matrix, V, Sub, Sup, Formula, Lead, Note,
                      Row, Arrow, Tag, fmt } (from matrix.jsx)
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState } = React;
  const REG = window.ML_SVM.SVM_REG;

  /* ── SVG helpers ─────────────────────────────────────────── */
  const W = 460, H = 300;
  const PAD = { l: 44, r: 20, t: 20, b: 40 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const xMin = 0, xMax = 11, yMin = 0, yMax = 10;

  const sx = v => PAD.l + ((v - xMin) / (xMax - xMin)) * plotW;
  const sy = v => PAD.t + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const COL_SV = "rgba(226,76,96,1)";
  const COL_IN = "rgba(43,91,255,0.55)";

  /* ── RegBase: axes + grid ────────────────────────────────── */
  function RegBase({ children, w = W, h = H }) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxWidth: w, display: "block" }}>
        {[2,4,6,8,10].map(v => (
          <g key={v}>
            <line x1={PAD.l} y1={sy(v)} x2={W-PAD.r} y2={sy(v)} stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />
            <line x1={sx(v)} y1={PAD.t} x2={sx(v)} y2={H-PAD.b} stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />
          </g>
        ))}
        <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="var(--ink)" strokeWidth="1.5" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H-PAD.b} stroke="var(--ink)" strokeWidth="1.5" />
        {[1,2,3,4,5,6,7,8,9,10].map(v => (
          <g key={v}>
            <line x1={sx(v)} y1={H-PAD.b} x2={sx(v)} y2={H-PAD.b+3} stroke="var(--ink)" strokeWidth="1" />
            <text x={sx(v)} y={H-PAD.b+14} textAnchor="middle" fontSize="10" fill="var(--muted,#888)" fontFamily="inherit">{v}</text>
          </g>
        ))}
        {[0,2,4,6,8,10].map(v => (
          <g key={v}>
            <line x1={PAD.l-3} y1={sy(v)} x2={PAD.l} y2={sy(v)} stroke="var(--ink)" strokeWidth="1" />
            <text x={PAD.l-5} y={sy(v)+4} textAnchor="end" fontSize="10" fill="var(--muted,#888)" fontFamily="inherit">{v}</text>
          </g>
        ))}
        <text x={W/2} y={H-4} textAnchor="middle" fontSize="11" fill="var(--muted,#888)" fontFamily="inherit">x</text>
        <text x={11} y={H/2} textAnchor="middle" fontSize="11" fill="var(--muted,#888)" fontFamily="inherit" transform={`rotate(-90,11,${H/2})`}>y</text>
        {children}
      </svg>
    );
  }

  /* ── Epsilon tube path ───────────────────────────────────── */
  function EpsilonTube({ w, b, eps, color = "rgba(43,91,255,0.10)", stroke = "rgba(43,91,255,0.35)" }) {
    const x0 = xMin, x1 = xMax;
    const y0hi = w * x0 + b + eps, y0lo = w * x0 + b - eps;
    const y1hi = w * x1 + b + eps, y1lo = w * x1 + b - eps;
    return (
      <>
        <polygon
          points={`${sx(x0)},${sy(y0hi)} ${sx(x1)},${sy(y1hi)} ${sx(x1)},${sy(y1lo)} ${sx(x0)},${sy(y0lo)}`}
          fill={color}
        />
        <line x1={sx(x0)} y1={sy(y0hi)} x2={sx(x1)} y2={sy(y1hi)}
          stroke={stroke} strokeWidth="1.5" strokeDasharray="5 3" />
        <line x1={sx(x0)} y1={sy(y0lo)} x2={sx(x1)} y2={sy(y1lo)}
          stroke={stroke} strokeWidth="1.5" strokeDasharray="5 3" />
      </>
    );
  }

  /* ── Regression line ─────────────────────────────────────── */
  function RegLine({ w, b, color = "var(--accent,#2b5bff)", width = 2.5 }) {
    return (
      <line
        x1={sx(xMin)} y1={sy(w * xMin + b)}
        x2={sx(xMax)} y2={sy(w * xMax + b)}
        stroke={color} strokeWidth={width} strokeLinecap="round"
      />
    );
  }

  /* ── Data points ─────────────────────────────────────────── */
  function DataPts({ allPreds, isSV, showQuery, qx, qy }) {
    return (
      <>
        {REG.xs.map((x, i) => {
          const sv = isSV ? isSV[i] : false;
          return (
            <g key={i}>
              {sv ? (
                <>
                  <rect x={sx(x)-6} y={sy(REG.ys[i])-6} width="12" height="12"
                    fill={COL_SV} stroke="var(--bg)" strokeWidth="1.5" rx="2" />
                  <rect x={sx(x)-9} y={sy(REG.ys[i])-9} width="18" height="18"
                    fill="none" stroke={COL_SV} strokeWidth="1.2" rx="3" opacity="0.6" />
                </>
              ) : (
                <circle cx={sx(x)} cy={sy(REG.ys[i])} r="5.5"
                  fill={COL_IN} stroke="var(--bg)" strokeWidth="1.5" />
              )}
            </g>
          );
        })}
        {showQuery && qy !== undefined && (
          <text x={sx(qx)} y={sy(qy)+5} textAnchor="middle" fontSize="18" fill="var(--accent,#2b5bff)">★</text>
        )}
      </>
    );
  }

  /* ── renderInput ─────────────────────────────────────────── */
  function renderInput(input, setInput) {
    return (
      <label className="nn-slider">
        <span className="nn-slider-l">x</span>
        <input type="range" min="1" max="10" step="0.5" value={input.x}
          onChange={e => setInput({ ...input, x: parseFloat(e.target.value) })} />
        <span className="nn-slider-v">{fmt(input.x)}</span>
      </label>
    );
  }

  /* ── STAGES ──────────────────────────────────────────────── */
  const STAGES = [

    /* ── Stage 1: Overview ─────────────────────────────────── */
    {
      id: "overview", group: "Overview", title: "What is SVR?",
      map: "Overview",
      why: "SVR extends the maximum-margin idea from classification to regression. Instead of a separating hyperplane, we fit a tube around the data — points inside the tube are treated as correct.",
      render: (trace) => {
        const { allPreds, isSV } = trace;
        return (
          <>
            <Lead>
              <b>Support Vector Regression (SVR)</b> fits a tube of width 2ε around the data.
              Points <em>inside</em> the tube contribute zero loss.
              Points <em>outside</em> the tube become support vectors and drive the fit.
            </Lead>

            <RegBase>
              <EpsilonTube w={REG.w} b={REG.b} eps={REG.epsilon} />
              <RegLine w={REG.w} b={REG.b} />
              <DataPts allPreds={allPreds} isSV={isSV} showQuery={false} />
              {/* tube label */}
              <text x={sx(9)} y={sy(REG.w*9+REG.b+REG.epsilon)-6} fontSize="11"
                fill="var(--accent,#2b5bff)" fontFamily="inherit">ε-tube (±{REG.epsilon})</text>
            </RegBase>

            <div className="tf-archwrap" style={{ marginTop: 16 }}>
              <div className="tf-arch">
                <div className="tf-arch-io">
                  Training data <b>(xᵢ, yᵢ)</b> — continuous target y
                </div>
                <div className="tf-arch-f"><b>Fit: ŷ = w·x + b</b> (linear SVR)</div>
                <div className="tf-arch-row">
                  Find w, b that minimizes ½‖w‖² while keeping |y − ŷ| ≤ ε
                </div>
                <div className="tf-arch-f"><b>ε-insensitive loss</b></div>
                <div className="tf-arch-row">Points inside tube → 0 loss. Outside → linear penalty.</div>
                <div className="tf-arch-io tf-arch-io--out">
                  Prediction ŷ = w·x + b — smooth, robust to outliers
                </div>
              </div>
            </div>

            <div className="tf-legend">
              {[
                ["ε", "epsilon", "scalar", "Tube half-width. Points within ε of the prediction incur zero loss."],
                ["ξ", "slack (above)", "scalar", "How far a point exceeds the upper tube boundary."],
                ["ξ*", "slack (below)", "scalar", "How far a point falls below the lower tube boundary."],
                ["C", "regularization", "scalar", "Penalty for points outside the tube. Larger C → tighter fit."],
                ["SV", "support vector", "subset", "Points on or outside the tube. Only these define the regression fit."],
              ].map(r => (
                <div className="tf-leg" key={r[0]}>
                  <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div>
                  <div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>
            <Note>
              Use the <b>x slider</b> to move the query point ★ and see the predicted value and tube bounds update live.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 2: Dataset ──────────────────────────────────── */
    {
      id: "dataset", group: "Data", title: "The Training Dataset",
      map: "Dataset",
      why: "Before fitting, we examine the data to understand its shape. SVR works well when the relationship is approximately linear and there are some outliers we want to be robust to.",
      render: (trace) => {
        const { pred } = trace;
        return (
          <>
            <Lead>
              Our dataset has <b>10 points</b> with a roughly linear trend (x goes 1 to 10).
              The query point ★ is controlled by the x slider — the predicted y is computed from ŷ = {REG.w}x + {REG.b}.
            </Lead>
            <Row>
              <div style={{ flex: "1 1 460px" }}>
                <RegBase>
                  {REG.xs.map((x, i) => (
                    <circle key={i} cx={sx(x)} cy={sy(REG.ys[i])} r="6"
                      fill="var(--accent,#2b5bff)" stroke="var(--bg)" strokeWidth="1.5" opacity="0.7" />
                  ))}
                  <text x={sx(trace.x)} y={sy(pred)+5} textAnchor="middle" fontSize="18" fill="var(--accent,#2b5bff)">★</text>
                </RegBase>
              </div>
              <div style={{ flex: "0 0 220px" }}>
                <Matrix
                  data={REG.xs.map((x, i) => [x, REG.ys[i]])}
                  rowLabels={REG.xs.map((_, i) => `x⁽${i+1}⁾`)}
                  colLabels={["x", "y"]}
                  caption="Training set"
                  sub="10 examples"
                  heat={false}
                />
              </div>
            </Row>
            <Note>
              The data shows a noisy linear trend — SVR will fit a line through the "middle" of the tube,
              robust to the noisy points. Red squares (in later stages) will mark the support vectors.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 3: Epsilon Tube ─────────────────────────────── */
    {
      id: "epsilon-tube", group: "Core Concept", title: "The ε-Tube — Zero-Loss Zone",
      map: "ε-Tube",
      why: "The epsilon tube is the defining feature of SVR. Unlike MSE which penalizes every small deviation, SVR completely ignores errors smaller than ε — making it robust to small noise.",
      render: (trace) => {
        const { allPreds, isSV } = trace;
        const eps = REG.epsilon;
        return (
          <>
            <Lead>
              The <b>ε-tube</b> (epsilon-tube) is a band of width 2ε around the fitted line.
              Any point within this band incurs <b>zero penalty</b>.
              Only points outside the tube contribute to the loss.
            </Lead>

            <Formula label="No-loss condition">
              |y − ŷ| ≤ ε = {eps} &nbsp;→&nbsp; <b>loss = 0</b>
            </Formula>

            <RegBase>
              <EpsilonTube w={REG.w} b={REG.b} eps={eps} />
              <RegLine w={REG.w} b={REG.b} />
              <DataPts allPreds={allPreds} isSV={isSV} showQuery={false} />
              {/* ε annotation */}
              {(() => {
                const xA = 3;
                const yline = REG.w * xA + REG.b;
                return (
                  <g>
                    <line x1={sx(xA)} y1={sy(yline)} x2={sx(xA)} y2={sy(yline+eps)}
                      stroke="var(--accent)" strokeWidth="2" />
                    <line x1={sx(xA)} y1={sy(yline)} x2={sx(xA)} y2={sy(yline-eps)}
                      stroke="var(--accent)" strokeWidth="2" />
                    <text x={sx(xA)+5} y={sy(yline+eps/2)+4} fontSize="11" fill="var(--accent)" fontWeight="700" fontFamily="inherit">ε={eps}</text>
                    <text x={sx(xA)+5} y={sy(yline-eps/2)+4} fontSize="11" fill="var(--accent)" fontWeight="700" fontFamily="inherit">ε={eps}</text>
                  </g>
                );
              })()}
              <text x={sx(7)} y={sy(REG.w*7+REG.b)+4} fontSize="11" fill="var(--accent)" fontWeight="700" fontFamily="inherit" textAnchor="middle">ŷ = {REG.w}x + {REG.b}</text>
            </RegBase>

            <Row>
              <div className="nn-calc" style={{ flex: "1 1 220px" }}>
                <div className="nn-calc-h">ε-tube bounds at each x</div>
                {REG.xs.slice(0,5).map((x, i) => {
                  const yp = REG.w * x + REG.b;
                  const inside = Math.abs(REG.ys[i] - yp) <= eps;
                  return (
                    <div className="nn-calc-row" key={i}>
                      x={x}: ŷ={fmt(yp,2)}, tube=[{fmt(yp-eps,2)}, {fmt(yp+eps,2)}] →{" "}
                      <b style={{ color: inside ? "var(--pos,green)" : "var(--neg,red)" }}>
                        {inside ? "inside ✓" : "outside ✗"}
                      </b>
                    </div>
                  );
                })}
              </div>
              <div className="nn-calc" style={{ flex: "1 1 220px" }}>
                <div className="nn-calc-h">Effect of ε</div>
                <div className="nn-calc-row">ε large → more points inside → fewer SVs</div>
                <div className="nn-calc-row">ε large → smoother, less precise fit</div>
                <div className="nn-calc-row">ε small → more SVs → tighter fit</div>
                <div className="nn-calc-row">ε=0 → every point is an SV (like MSE)</div>
              </div>
            </Row>
            <Note>
              Blue circles = points inside the tube (zero loss). Red squares = support vectors (outside tube).
              The <b>regression line only "feels" the support vectors</b> — all other points are irrelevant.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 4: Epsilon-insensitive Loss ─────────────────── */
    {
      id: "eps-loss", group: "Core Concept", title: "ε-Insensitive Loss Function",
      map: "ε-Loss",
      why: "The ε-insensitive loss function is what gives SVR its robustness. Unlike squared loss which grows quadratically, this loss is zero in the tube and grows linearly outside — less sensitive to outliers.",
      render: () => {
        // SVG of loss function
        const LW = 380, LH = 220;
        const lPad = { l: 50, r: 20, t: 20, b: 40 };
        const eps = REG.epsilon;
        const xRng = 3, yRng = 3;
        const lx = v => lPad.l + ((v + xRng) / (2 * xRng)) * (LW - lPad.l - lPad.r);
        const ly = v => lPad.t + (1 - v / yRng) * (LH - lPad.t - lPad.b);

        const epsLoss = (r) => Math.max(0, Math.abs(r) - eps);
        const mseLoss = (r) => Math.min(r * r / 2, yRng - 0.1);

        const ptsEps = [], ptsMse = [];
        for (let r = -xRng; r <= xRng; r += 0.05) {
          ptsEps.push(`${lx(r).toFixed(1)},${ly(epsLoss(r)).toFixed(1)}`);
          ptsMse.push(`${lx(r).toFixed(1)},${ly(mseLoss(r)).toFixed(1)}`);
        }

        return (
          <>
            <Lead>
              The <b>ε-insensitive loss</b> L(y, ŷ) is flat within the tube (zero penalty) and grows
              linearly outside. Compare this to MSE which grows quadratically — SVR is much less sensitive
              to large residuals (outliers).
            </Lead>

            <Formula label="ε-insensitive loss">
              L(y, ŷ) = max(0, |y − ŷ| − ε)
            </Formula>
            <Formula label="ε = {REG.epsilon}">
              L = max(0, |residual| − {REG.epsilon})
            </Formula>

            <svg viewBox={`0 0 ${LW} ${LH}`} style={{ width: "100%", maxWidth: LW, display: "block" }}>
              {/* grid */}
              {[-2,-1,0,1,2].map(v => (
                <g key={v}>
                  <line x1={lx(v)} y1={lPad.t} x2={lx(v)} y2={LH-lPad.b} stroke="var(--line)" strokeWidth="0.5" strokeDasharray="3 3" />
                  <line x1={lPad.l-3} y1={lx(v)*(LH-lPad.t-lPad.b)/(LW-lPad.l-lPad.r)} x2={lPad.l} y2={lx(v)*(LH-lPad.t-lPad.b)/(LW-lPad.l-lPad.r)} />
                </g>
              ))}
              <line x1={lPad.l} y1={LH-lPad.b} x2={LW-lPad.r} y2={LH-lPad.b} stroke="var(--ink)" strokeWidth="1.5" />
              <line x1={lPad.l} y1={lPad.t} x2={lPad.l} y2={LH-lPad.b} stroke="var(--ink)" strokeWidth="1.5" />
              {[-2,-1,0,1,2].map(v => (
                <g key={v}>
                  <line x1={lx(v)} y1={LH-lPad.b} x2={lx(v)} y2={LH-lPad.b+3} stroke="var(--ink)" strokeWidth="1" />
                  <text x={lx(v)} y={LH-lPad.b+14} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="inherit">{v}</text>
                </g>
              ))}
              {[0,1,2].map(v => (
                <g key={v}>
                  <line x1={lPad.l-3} y1={ly(v)} x2={lPad.l} y2={ly(v)} stroke="var(--ink)" strokeWidth="1" />
                  <text x={lPad.l-5} y={ly(v)+4} textAnchor="end" fontSize="10" fill="var(--muted)" fontFamily="inherit">{v}</text>
                </g>
              ))}
              {/* ε zone shading */}
              <rect x={lx(-eps)} y={lPad.t} width={lx(eps)-lx(-eps)} height={LH-lPad.t-lPad.b}
                fill="rgba(43,91,255,0.08)" />
              <line x1={lx(-eps)} y1={lPad.t} x2={lx(-eps)} y2={LH-lPad.b} stroke="rgba(43,91,255,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1={lx(eps)} y1={lPad.t} x2={lx(eps)} y2={LH-lPad.b} stroke="rgba(43,91,255,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x={lx(0)} y={lPad.t+12} textAnchor="middle" fontSize="10" fill="rgba(43,91,255,0.7)" fontFamily="inherit">ε-zone (0 loss)</text>
              {/* MSE curve */}
              <polyline points={ptsMse.join(" ")} fill="none" stroke="rgba(226,76,96,0.6)" strokeWidth="2" />
              {/* ε-insensitive loss */}
              <polyline points={ptsEps.join(" ")} fill="none" stroke="var(--accent,#2b5bff)" strokeWidth="2.5" />
              {/* legend */}
              <line x1={LW-110} y1={40} x2={LW-90} y2={40} stroke="var(--accent)" strokeWidth="2.5" />
              <text x={LW-88} y={44} fontSize="11" fill="var(--accent)" fontFamily="inherit">ε-insensitive</text>
              <line x1={LW-110} y1={58} x2={LW-90} y2={58} stroke="rgba(226,76,96,0.7)" strokeWidth="2" />
              <text x={LW-88} y={62} fontSize="11" fill="rgba(226,76,96,0.9)" fontFamily="inherit">MSE (½r²)</text>
              <text x={LW/2} y={LH-4} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="inherit">residual (y − ŷ)</text>
              <text x={11} y={LH/2} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="inherit" transform={`rotate(-90,11,${LH/2})`}>loss</text>
            </svg>

            <Row>
              <div className="nn-calc" style={{ flex: "1 1 220px" }}>
                <div className="nn-calc-h">Loss comparison at r = 1.5 (ε = {eps})</div>
                <div className="nn-calc-row">ε-loss: max(0, |1.5| − {eps}) = <b>{fmt(Math.max(0, 1.5 - eps), 3)}</b></div>
                <div className="nn-calc-row">MSE:   ½ × 1.5² = <b>{fmt(0.5 * 1.5 * 1.5, 3)}</b></div>
                <div className="nn-calc-row">At r = 0.3:</div>
                <div className="nn-calc-row">ε-loss: max(0, 0.3 − {eps}) = <b>{fmt(Math.max(0, 0.3 - eps), 3)} (zero!)</b></div>
                <div className="nn-calc-row">MSE:   ½ × 0.09 = <b>0.045</b></div>
              </div>
              <div className="nn-calc" style={{ flex: "1 1 220px" }}>
                <div className="nn-calc-h">Key properties</div>
                <div className="nn-calc-row">Flat zone [−ε, ε] → sparsity (fewer SVs)</div>
                <div className="nn-calc-row">Linear growth outside → robust to outliers</div>
                <div className="nn-calc-row">Differentiable everywhere except ±ε</div>
                <div className="nn-calc-row">Hinge loss = max(0, 1 − margin) is analogous in SVM-CLS</div>
              </div>
            </Row>
            <Note>
              The flat region in ε-loss is why SVR is robust: an outlier at residual = 5 incurs
              only loss = 5 − ε, whereas MSE would give loss = 12.5. This makes SVR
              significantly less influenced by individual noisy measurements.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 5: Support Vectors ──────────────────────────── */
    {
      id: "svr-support-vectors", group: "Core Concept", title: "SVR Support Vectors",
      map: "Support Vectors",
      why: "Like classification SVMs, only a subset of training points — those on or outside the tube — determine the regression fit. This sparsity is a key advantage.",
      render: (trace) => {
        const { allPreds, isSV, residuals } = trace;
        return (
          <>
            <Lead>
              SVR support vectors are points that lie <b>on or outside the ε-tube</b>.
              They are the only points with non-zero Lagrange multipliers.
              The fitted line is determined entirely by these points.
            </Lead>

            <RegBase>
              <EpsilonTube w={REG.w} b={REG.b} eps={REG.epsilon} />
              <RegLine w={REG.w} b={REG.b} />
              {/* residual lines for SVs */}
              {REG.xs.map((x, i) => {
                if (!isSV[i]) return null;
                return (
                  <line key={i}
                    x1={sx(x)} y1={sy(REG.ys[i])}
                    x2={sx(x)} y2={sy(allPreds[i])}
                    stroke={COL_SV} strokeWidth="1.5" strokeDasharray="4 2" opacity="0.7"
                  />
                );
              })}
              <DataPts allPreds={allPreds} isSV={isSV} showQuery={false} />
            </RegBase>

            <div className="tf-subhead">Point classification</div>
            <Matrix
              data={REG.xs.map((x, i) => [x, REG.ys[i], fmt(allPreds[i], 2), fmt(residuals[i], 3), isSV[i] ? "SV ✗" : "inside ✓"])}
              rowLabels={REG.xs.map((_, i) => `i=${i+1}`)}
              colLabels={["x", "y", "ŷ", "residual", "status"]}
              caption="Support vector classification"
              sub={`${isSV.filter(Boolean).length} SVs, ${isSV.filter(v=>!v).length} inside tube`}
              heat={false}
            />

            <Note>
              Red squares mark support vectors — points where |residual| ≥ ε.
              If you removed all blue-circle points, the fitted line would be identical.
              This sparsity means SVR predictions are O(n_sv × d), not O(n × d).
            </Note>
          </>
        );
      },
    },

    /* ── Stage 6: Optimization ─────────────────────────────── */
    {
      id: "svr-optimization", group: "Math", title: "SVR Optimization Problem",
      map: "Optimization",
      why: "The SVR optimization problem mirrors the classification SVM — minimize ‖w‖² while constraining deviations. The C parameter balances tube width against fit quality.",
      render: () => (
        <>
          <Lead>
            SVR solves a quadratic program with <b>two slack variables per point</b> —
            one for each side of the tube. C controls the trade-off between a flat (wide-tube)
            and a tight-fit solution.
          </Lead>

          <div className="tf-subhead">Primal formulation</div>
          <Formula label="Objective">
            min<Sub>w,b,ξ,ξ*</Sub> &nbsp; ½‖w‖² + C · Σ(ξᵢ + ξᵢ*)
          </Formula>
          <Formula label="Constraints">
            yᵢ − (w·xᵢ + b) ≤ ε + ξᵢ &nbsp;&nbsp;
            (w·xᵢ + b) − yᵢ ≤ ε + ξᵢ* &nbsp;&nbsp;
            ξᵢ, ξᵢ* ≥ 0
          </Formula>

          <div className="tf-subhead">Dual (kernelized) form</div>
          <Formula label="Dual">
            max &nbsp; −½ ΣΣ (αᵢ − αᵢ*)(αⱼ − αⱼ*)(xᵢ·xⱼ) − ε Σ(αᵢ + αᵢ*) + Σyᵢ(αᵢ − αᵢ*)
          </Formula>
          <Formula label="Prediction">
            ŷ = Σ (αᵢ − αᵢ*) K(xᵢ, x) + b
          </Formula>

          {/* Effect of C visualization */}
          <div className="tf-subhead">Effect of C on the fit</div>
          <Row>
            {[
              { C: "small", w: 0.2, b: 4.5, eps: 1.5, label: "C small → wide tube, smooth" },
              { C: "large", w: 0.42, b: 3.4, eps: 0.5, label: "C large → tight tube, precise" },
            ].map((cfg) => {
              const sw = 240, sh = 180;
              const sPad = { l: 20, r: 10, t: 14, b: 24 };
              const ssx = v => sPad.l + ((v - 0) / 11) * (sw - sPad.l - sPad.r);
              const ssy = v => sPad.t + (1 - (v - 0) / 10) * (sh - sPad.t - sPad.b);
              return (
                <div key={cfg.C} style={{ flex: "1 1 240px" }}>
                  <div className="tf-subhead" style={{ fontSize: 12 }}>{cfg.label}</div>
                  <svg viewBox={`0 0 ${sw} ${sh}`} style={{ width: "100%", maxWidth: sw, display: "block" }}>
                    <line x1={sPad.l} y1={sh-sPad.b} x2={sw-sPad.r} y2={sh-sPad.b} stroke="var(--ink)" strokeWidth="1" />
                    <line x1={sPad.l} y1={sPad.t} x2={sPad.l} y2={sh-sPad.b} stroke="var(--ink)" strokeWidth="1" />
                    {/* tube */}
                    <polygon
                      points={`${ssx(0)},${ssy(cfg.w*0+cfg.b+cfg.eps)} ${ssx(11)},${ssy(cfg.w*11+cfg.b+cfg.eps)} ${ssx(11)},${ssy(cfg.w*11+cfg.b-cfg.eps)} ${ssx(0)},${ssy(cfg.w*0+cfg.b-cfg.eps)}`}
                      fill="rgba(43,91,255,0.10)"
                    />
                    {[cfg.b+cfg.eps, cfg.b-cfg.eps].map((off, k) => (
                      <line key={k}
                        x1={ssx(0)} y1={ssy(cfg.w*0+off)}
                        x2={ssx(11)} y2={ssy(cfg.w*11+off)}
                        stroke="rgba(43,91,255,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
                    ))}
                    <line x1={ssx(0)} y1={ssy(cfg.w*0+cfg.b)} x2={ssx(11)} y2={ssy(cfg.w*11+cfg.b)}
                      stroke="var(--accent)" strokeWidth="2" />
                    {REG.xs.map((x, i) => {
                      const yp = cfg.w * x + cfg.b;
                      const sv = Math.abs(REG.ys[i] - yp) >= cfg.eps * 0.9;
                      return sv
                        ? <rect key={i} x={ssx(x)-5} y={ssy(REG.ys[i])-5} width="10" height="10" fill={COL_SV} stroke="var(--bg)" strokeWidth="1" rx="2" />
                        : <circle key={i} cx={ssx(x)} cy={ssy(REG.ys[i])} r="4" fill="rgba(43,91,255,0.5)" stroke="var(--bg)" strokeWidth="1" />;
                    })}
                    <text x={sw/2} y={sh-6} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="inherit">ε={cfg.eps}, w={cfg.w}</text>
                  </svg>
                </div>
              );
            })}
          </Row>

          <Note>
            Large C penalizes tube violations heavily → narrow tube, more SVs, higher complexity.
            Small C is lenient → wide tube, fewer SVs, smoother fit. Tune C and ε together
            using cross-validation.
          </Note>
        </>
      ),
    },

    /* ── Stage 7: Prediction Visualization ────────────────── */
    {
      id: "svr-prediction", group: "Prediction", title: "Prediction Walkthrough",
      map: "Prediction",
      why: "Seeing the complete prediction — from input x to predicted ŷ, with tube bounds and residual — ties together all SVR concepts and shows what the model actually outputs.",
      render: (trace) => {
        const { x, pred, tubeLo, tubeHi, allPreds, isSV, residuals } = trace;
        const inside = pred - REG.epsilon <= trace.cfg.ys[Math.round(x) - 1] &&
                       trace.cfg.ys[Math.round(x) - 1] <= pred + REG.epsilon;
        return (
          <>
            <Lead>
              For the current query x = <b>{fmt(x)}</b>, SVR predicts ŷ = {REG.w}·{fmt(x)} + {REG.b} = <b>{fmt(pred, 3)}</b>.
              The ε-tube spans [{fmt(tubeLo, 3)}, {fmt(tubeHi, 3)}].
            </Lead>

            <RegBase>
              <EpsilonTube w={REG.w} b={REG.b} eps={REG.epsilon} />
              <RegLine w={REG.w} b={REG.b} />
              <DataPts allPreds={allPreds} isSV={isSV} showQuery={true} qx={x} qy={pred} />
              {/* vertical indicator line */}
              <line x1={sx(x)} y1={sy(tubeLo)} x2={sx(x)} y2={sy(tubeHi)}
                stroke="rgba(226,76,96,0.8)" strokeWidth="2" />
              <circle cx={sx(x)} cy={sy(pred)} r="5" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />
              <text x={sx(x)+8} y={sy(pred)+4} fontSize="11" fill="var(--accent)" fontWeight="700" fontFamily="inherit">ŷ={fmt(pred,2)}</text>
              <text x={sx(x)+8} y={sy(tubeHi)-3} fontSize="10" fill="rgba(226,76,96,0.9)" fontFamily="inherit">+ε={fmt(tubeHi,2)}</text>
              <text x={sx(x)+8} y={sy(tubeLo)+12} fontSize="10" fill="rgba(226,76,96,0.9)" fontFamily="inherit">−ε={fmt(tubeLo,2)}</text>
            </RegBase>

            <div className="nn-calc">
              <div className="nn-calc-h">Step-by-step prediction for x = {fmt(x)}</div>
              <div className="nn-calc-row">ŷ = w · x + b = {REG.w} × {fmt(x)} + {REG.b}</div>
              <div className="nn-calc-row">= {fmt(REG.w * x, 3)} + {REG.b}</div>
              <div className="nn-calc-row"><b>ŷ = {fmt(pred, 4)}</b></div>
              <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                ε-tube: [{fmt(tubeLo, 3)}, {fmt(tubeHi, 3)}]
              </div>
              <div className="nn-calc-row">
                Query x is at a predicted value of <b>{fmt(pred, 3)}</b>
              </div>
              <div className="nn-calc-row" style={{ color: "var(--accent)" }}>
                Any y in [{fmt(tubeLo, 3)}, {fmt(tubeHi, 3)}] would incur <b>zero loss</b>
              </div>
            </div>
            <Note>
              Drag the x slider to see the prediction update. The query ★ always lands on the regression
              line (ŷ = wx+b), and the red brackets show the ε-tube at that x value.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 8: Effect of ε and C ────────────────────────── */
    {
      id: "effect-eps-c", group: "Hyperparameters", title: "Effect of ε and C",
      map: "ε vs C",
      why: "Both ε and C control the bias-variance trade-off in SVR. Understanding their combined effect lets you tune the model systematically without just guessing.",
      render: () => {
        const configs = [
          { eps: 0.3, C: "large", w: 0.42, b: 3.4, label: "ε=0.3" },
          { eps: 1.2, C: "large", w: 0.38, b: 3.6, label: "ε=1.2" },
        ];
        const cfgC = [
          { eps: 0.8, C: "small", w: 0.25, b: 4.0, label: "C small" },
          { eps: 0.8, C: "large", w: 0.42, b: 3.3, label: "C large" },
        ];
        const mkMini = (cfgs, titleRow) => {
          return cfgs.map((cfg) => {
            const ms = 220, msh = 170;
            const mp = { l: 18, r: 10, t: 14, b: 22 };
            const mmx = v => mp.l + v / 11 * (ms - mp.l - mp.r);
            const mmy = v => mp.t + (1 - v / 10) * (msh - mp.t - mp.b);
            const svCount = REG.xs.filter((x, i) => Math.abs(REG.ys[i] - (cfg.w * x + cfg.b)) >= cfg.eps * 0.9).length;
            return (
              <div key={cfg.label} style={{ flex: "1 1 220px" }}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: "var(--accent)" }}>{cfg.label} — {svCount} SVs</div>
                <svg viewBox={`0 0 ${ms} ${msh}`} style={{ width: "100%", maxWidth: ms, display: "block" }}>
                  <line x1={mp.l} y1={msh-mp.b} x2={ms-mp.r} y2={msh-mp.b} stroke="var(--ink)" strokeWidth="1" />
                  <line x1={mp.l} y1={mp.t} x2={mp.l} y2={msh-mp.b} stroke="var(--ink)" strokeWidth="1" />
                  <polygon
                    points={`${mmx(0)},${mmy(cfg.w*0+cfg.b+cfg.eps)} ${mmx(11)},${mmy(cfg.w*11+cfg.b+cfg.eps)} ${mmx(11)},${mmy(cfg.w*11+cfg.b-cfg.eps)} ${mmx(0)},${mmy(cfg.w*0+cfg.b-cfg.eps)}`}
                    fill="rgba(43,91,255,0.10)"
                  />
                  {[cfg.b+cfg.eps, cfg.b-cfg.eps].map((off, k) => (
                    <line key={k} x1={mmx(0)} y1={mmy(cfg.w*0+off)} x2={mmx(11)} y2={mmy(cfg.w*11+off)}
                      stroke="rgba(43,91,255,0.4)" strokeWidth="1.2" strokeDasharray="4 2" />
                  ))}
                  <line x1={mmx(0)} y1={mmy(cfg.w*0+cfg.b)} x2={mmx(11)} y2={mmy(cfg.w*11+cfg.b)}
                    stroke="var(--accent)" strokeWidth="1.8" />
                  {REG.xs.map((x, i) => {
                    const yp = cfg.w * x + cfg.b;
                    const sv = Math.abs(REG.ys[i] - yp) >= cfg.eps * 0.9;
                    return sv
                      ? <rect key={i} x={mmx(x)-4} y={mmy(REG.ys[i])-4} width="8" height="8" fill={COL_SV} stroke="var(--bg)" strokeWidth="1" rx="1" />
                      : <circle key={i} cx={mmx(x)} cy={mmy(REG.ys[i])} r="3.5" fill="rgba(43,91,255,0.5)" stroke="var(--bg)" strokeWidth="1" />;
                  })}
                </svg>
              </div>
            );
          });
        };

        return (
          <>
            <Lead>
              Two key hyperparameters control SVR: <b>ε</b> (tube width) and <b>C</b> (violation penalty).
              Their interaction determines how many support vectors you get and how tight the fit is.
            </Lead>

            <div className="tf-subhead">Effect of ε (with C fixed)</div>
            <Row>{mkMini(configs, true)}</Row>

            <div className="tf-subhead" style={{ marginTop: 16 }}>Effect of C (with ε fixed = {REG.epsilon})</div>
            <Row>{mkMini(cfgC, true)}</Row>

            <div className="tf-legend" style={{ marginTop: 16 }}>
              {[
                ["ε↑", "Larger tube", "smoother", "More points inside → fewer SVs → smoother, potentially underfitting."],
                ["ε↓", "Tighter tube", "complex", "More SVs → tighter fit → potentially overfitting noisy data."],
                ["C↑", "Large penalty", "precise", "Forces points outside tube to be few → narrow tube → complex boundary."],
                ["C↓", "Small penalty", "robust", "Tolerates more violations → wider effective margin → smoother fit."],
              ].map(r => (
                <div className="tf-leg" key={r[0]}>
                  <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div>
                  <div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>
            <Note>
              Typical practice: use a grid search over C ∈ [0.01, 1000] and ε ∈ [0.01, 1]
              with 5-fold cross-validation. RMSE or MAE are better metrics than MSE for SVR.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 9: When to Use ──────────────────────────────── */
    {
      id: "svr-when-to-use", group: "Evaluation", title: "When to Use SVR — Pros, Cons & Comparisons",
      map: "When to Use",
      why: "SVR is a powerful but niche tool. Understanding where it excels versus alternatives prevents over- or under-using it in practice.",
      render: () => (
        <>
          <Lead>
            SVR excels when you need <b>robust regression on small-to-medium datasets</b> with
            potential outliers and you want a sparse model. For large datasets or complex non-linear
            patterns, other approaches may be preferred.
          </Lead>

          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">SVR Strengths</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">Robust to outliers (ε-insensitive loss)</li>
                <li className="opt-pc-li">Sparse model — only SVs stored</li>
                <li className="opt-pc-li">Kernel trick → non-linear regression</li>
                <li className="opt-pc-li">Works well in high-dimensional spaces</li>
                <li className="opt-pc-li">Convex optimization — unique global optimum</li>
                <li className="opt-pc-li">No distributional assumptions on residuals</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">SVR Limitations</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">O(n² to n³) training — slow on large datasets</li>
                <li className="opt-pc-li">Three hyperparameters (C, ε, γ) to tune</li>
                <li className="opt-pc-li">Feature scaling required (critical)</li>
                <li className="opt-pc-li">Hard to interpret (especially with kernels)</li>
                <li className="opt-pc-li">No confidence intervals without extra work</li>
              </ul>
            </div>
          </div>

          <div className="tf-subhead">SVR vs alternatives for regression</div>
          <div className="tf-legend">
            {[
              ["SVR", "Support Vector Regression", "your choice", "Best for small datasets with outliers. Kernel trick for non-linearity. Sparse predictions."],
              ["LR", "Linear Regression", "baseline", "Fastest. Best when relationship is truly linear and data is clean. OLS gives confidence intervals."],
              ["RF", "Random Forest Regression", "ensemble", "Handles non-linearity natively. Robust without tuning. Better for large n or tabular data."],
              ["GPR", "Gaussian Process Regression", "probabilistic", "Provides uncertainty estimates. Computationally similar to SVR. Better for small datasets needing uncertainty."],
              ["NN", "Neural Network Regression", "deep", "Best for very large datasets or complex patterns (images, sequences). Needs more data than SVR."],
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
              ["Scale", "train", "StandardScaler on X and y. SVR is highly sensitive to feature scale."],
              ["Choose kernel", "train", "RBF for non-linear, linear for high-dim. Start simple."],
              ["Tune C, ε, γ", "train", "Grid/random search. C∈[0.1,1000], ε∈[0.01,1], γ∈[auto,scale,custom]."],
              ["Train SVR", "train", "Solve QP. Store only support vectors (sparse model)."],
              ["Predict", "infer", "ŷ = Σ(αᵢ−αᵢ*)K(xᵢ,x)+b. Inverse-transform if y was scaled."],
            ].map(([label, phase, desc]) => (
              <div key={label} className={`tf-life tf-life--${phase}`}>
                <span className="tf-life-label">{label}</span>
                <span className="tf-life-desc">{desc}</span>
              </div>
            ))}
          </div>

          <Note icon="★">
            You've completed the SVR walkthrough. Switch to <b>SVM (Classification)</b> above
            to see how the same max-margin principle creates a decision boundary between two classes.
          </Note>
        </>
      ),
    },
  ];

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "Support Vector Regression",
    subtitle: "maximum-margin regression with an ε-insensitive tube",
    cur: "SVM (Regression)",
    category: "Regression",
    run: (input) => window.ML_SVM.runSVMReg(input),
    default: { x: 5.0 },
    renderInput,
    modeLinks: [
      { label: "Classification", href: "SVM (Classification).html", active: false },
      { label: "Regression (SVR)", href: "SVM (Regression).html", active: true },
    ],
  };
})();
