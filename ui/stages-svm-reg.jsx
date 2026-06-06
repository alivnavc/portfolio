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
  function RegBase({ children }) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block" }}>
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

  /* ── Epsilon tube ────────────────────────────────────────── */
  function EpsilonTube({ w, b, eps, fill = "rgba(43,91,255,0.10)", stroke = "rgba(43,91,255,0.35)" }) {
    const y0hi = w * xMin + b + eps, y0lo = w * xMin + b - eps;
    const y1hi = w * xMax + b + eps, y1lo = w * xMax + b - eps;
    return (
      <>
        <polygon
          points={`${sx(xMin)},${sy(y0hi)} ${sx(xMax)},${sy(y1hi)} ${sx(xMax)},${sy(y1lo)} ${sx(xMin)},${sy(y0lo)}`}
          fill={fill}
        />
        <line x1={sx(xMin)} y1={sy(y0hi)} x2={sx(xMax)} y2={sy(y1hi)}
          stroke={stroke} strokeWidth="1.5" strokeDasharray="5 3" />
        <line x1={sx(xMin)} y1={sy(y0lo)} x2={sx(xMax)} y2={sy(y1lo)}
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
  function DataPts({ isSV, showQuery, qx, qy }) {
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
      id: "overview", group: "Overview", title: "What is Support Vector Regression (SVR)?",
      map: "Overview",
      why: "SVR extends the maximum-margin idea from classification to regression. Instead of a separating hyperplane, we fit a tube around the data — points inside the tube are treated as perfect predictions with zero loss.",
      render: (trace) => {
        const { allPreds, isSV } = trace;
        return (
          <>
            <Lead>
              <b>Support Vector Regression (SVR)</b> fits a "pipe" (tube) of width 2ε around the
              regression line. Points <em>inside</em> the pipe are treated as perfect predictions
              — they incur <b>zero loss</b>. Only points <em>outside</em> the pipe matter; they
              are penalised proportionally to how far they stick out.
            </Lead>
            <Lead>
              Think of it as drawing a pipe around the data: only the points sticking out of the
              pipe influence the fit. This is the <b>ε-insensitive loss</b> function, and it gives
              SVR its robustness to small noise and even moderate outliers — if a noisy measurement
              is within ε of the true line, it has no effect on the learned parameters at all.
            </Lead>
            <Lead>
              Before we proceed, let's define every term. <b>ε (epsilon)</b> is the tube half-width
              — the distance from the regression line to either tube edge. <b>Slack variables</b>
              ξᵢ ≥ 0 (above) and ξᵢ* ≥ 0 (below) measure how far points outside the tube are from
              the tube boundary. <b>Support vectors</b> in SVR are the points on or outside the tube
              — only they have non-zero Lagrange multipliers and only they define the regression line.
              The <b>C parameter</b> (regularisation) penalises tube violations; larger C → tighter fit.
            </Lead>

            <RegBase>
              <EpsilonTube w={REG.w} b={REG.b} eps={REG.epsilon} />
              <RegLine w={REG.w} b={REG.b} />
              <DataPts isSV={isSV} showQuery={false} />
              <text x={sx(8.2)} y={sy(REG.w*8.5+REG.b+REG.epsilon)-7} fontSize="11"
                fill="var(--accent,#2b5bff)" fontFamily="inherit">ε-tube (±{REG.epsilon})</text>
            </RegBase>

            <div className="tf-archwrap" style={{ marginTop: 16 }}>
              <div className="tf-arch">
                <div className="tf-arch-io">Training data <b>(xᵢ, yᵢ)</b> — continuous target y</div>
                <div className="tf-arch-f"><b>Fit: ŷ = w·x + b</b> (linear SVR in 1D)</div>
                <div className="tf-arch-row">Find w, b minimising ½‖w‖² while |y − ŷ| ≤ ε for most points</div>
                <div className="tf-arch-f"><b>ε-insensitive loss: L = max(0, |y − ŷ| − ε)</b></div>
                <div className="tf-arch-row">Points inside tube → 0 loss. Outside → linear penalty.</div>
                <div className="tf-arch-io tf-arch-io--out">Prediction ŷ = w·x + b — robust to noise within ε</div>
              </div>
            </div>

            <div className="tf-legend">
              {[
                ["ε", "epsilon (tube half-width)", "scalar", "Points within ε of the prediction incur zero loss. The key hyperparameter that defines the insensitivity zone."],
                ["ξ, ξ*", "slack variables", "scalars", "ξᵢ = how far point i exceeds the upper tube; ξᵢ* = how far it falls below. Both ≥ 0."],
                ["C", "regularisation penalty", "scalar", "Penalty for points outside the tube. Large C → tight tube, precise fit. Small C → wide tube, smoother fit."],
                ["SV", "support vector", "subset of data", "Points on or outside the tube (|residual| ≥ ε). Only these define the regression fit — others have zero weight."],
                ["ŷ", "prediction", "scalar", "ŷ = w·x + b for linear SVR; ŷ = Σ(αᵢ−αᵢ*)K(xᵢ,x)+b for kernel SVR."],
              ].map(r => (
                <div className="tf-leg" key={r[0]}>
                  <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div>
                  <div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>
            <Note>
              Use the <b>x slider</b> to move the query point ★ and see the predicted value,
              tube bounds, and support vector classification update live.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 2: Dataset ──────────────────────────────────── */
    {
      id: "dataset", group: "Data", title: "The Training Dataset",
      map: "Dataset",
      why: "Before fitting, we examine the data shape. SVR works well when the relationship is approximately linear with some noise — the ε-tube will absorb the noise and only fit the trend.",
      render: (trace) => {
        const { pred } = trace;
        return (
          <>
            <Lead>
              Our dataset has <b>10 points</b> with x ranging from 1 to 10 and y showing a
              roughly linear trend with noise. The fitted SVR model uses w = {REG.w}, b = {REG.b},
              ε = {REG.epsilon} — giving the prediction ŷ = {REG.w}x + {REG.b}.
            </Lead>
            <Lead>
              Notice that the data is not perfectly linear: there are several noisy measurements
              that deviate from the trend. SVR will fit a line through the "majority" of the data
              while ignoring points that fall within the ε-tube, and penalising only those that
              exceed it. Compare this to ordinary least squares which penalises every single deviation,
              however small.
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
                  data={REG.xs.map((x, i) => [x, REG.ys[i], fmt(REG.w * x + REG.b, 2)])}
                  rowLabels={REG.xs.map((_, i) => `i=${i+1}`)}
                  colLabels={["x", "y", "ŷ"]}
                  caption="Dataset + SVR predictions"
                  sub="10 examples, 1D → 1D"
                  heat={false}
                />
              </div>
            </Row>
            <Note>
              The prediction column ŷ = {REG.w}x + {REG.b} shows what the model would predict for
              each training x. In later stages, red squares will mark support vectors — points whose
              residual |y − ŷ| ≥ ε = {REG.epsilon}.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 3: The ε-Tube ───────────────────────────────── */
    {
      id: "epsilon-tube", group: "Core Concept", title: "The ε-Tube — Zero-Loss Zone",
      map: "ε-Tube",
      why: "The epsilon tube is the defining feature of SVR. Unlike MSE which penalises every small deviation, SVR completely ignores errors smaller than ε — making it robust to small measurement noise.",
      render: (trace) => {
        const { allPreds, isSV } = trace;
        const eps = REG.epsilon;
        return (
          <>
            <Lead>
              The <b>ε-tube</b> is the band of width 2ε centred on the fitted regression line.
              Any training point whose residual |y − ŷ| ≤ ε falls <em>inside</em> the tube and
              contributes <b>exactly zero</b> to the loss. This is the ε-insensitive loss function:
              L(y, ŷ) = max(0, |y − ŷ| − ε).
            </Lead>
            <Lead>
              For our model with ε = {eps}, any prediction error smaller than {eps} is completely
              ignored. Points outside the tube (|residual| &gt; {eps}) are penalised proportionally
              to how far they overshoot: the loss is |residual| − ε, not |residual|² as in MSE.
              This linear penalty outside the tube is what gives SVR its outlier robustness.
            </Lead>

            <Formula label="ε-insensitive loss">L(y, ŷ) = max(0, |y − ŷ| − ε) = max(0, |residual| − {eps})</Formula>
            <Formula label="Tube bounds at x">ŷ − ε ≤ y ≤ ŷ + ε &nbsp;→&nbsp; loss = 0</Formula>

            <RegBase>
              <EpsilonTube w={REG.w} b={REG.b} eps={eps} />
              <RegLine w={REG.w} b={REG.b} />
              <DataPts isSV={isSV} showQuery={false} />
              {/* ε annotation bracket at x=3 */}
              {(() => {
                const xA = 3;
                const yline = REG.w * xA + REG.b;
                return (
                  <g>
                    <line x1={sx(xA)} y1={sy(yline)} x2={sx(xA)} y2={sy(yline+eps)}
                      stroke="var(--accent)" strokeWidth="2" />
                    <line x1={sx(xA)-4} y1={sy(yline+eps)} x2={sx(xA)+4} y2={sy(yline+eps)}
                      stroke="var(--accent)" strokeWidth="1.5" />
                    <line x1={sx(xA)} y1={sy(yline)} x2={sx(xA)} y2={sy(yline-eps)}
                      stroke="var(--accent)" strokeWidth="2" />
                    <line x1={sx(xA)-4} y1={sy(yline-eps)} x2={sx(xA)+4} y2={sy(yline-eps)}
                      stroke="var(--accent)" strokeWidth="1.5" />
                    <text x={sx(xA)+7} y={sy(yline+eps/2)+4} fontSize="11" fill="var(--accent)" fontWeight="700" fontFamily="inherit">+ε={eps}</text>
                    <text x={sx(xA)+7} y={sy(yline-eps/2)+4} fontSize="11" fill="var(--accent)" fontWeight="700" fontFamily="inherit">−ε={eps}</text>
                  </g>
                );
              })()}
              <text x={sx(6.5)} y={sy(REG.w*6.5+REG.b)+4} fontSize="11" fill="var(--accent)" fontWeight="700" fontFamily="inherit" textAnchor="middle">ŷ = {REG.w}x + {REG.b}</text>
            </RegBase>

            <Row>
              <div className="nn-calc" style={{ flex: "1 1 220px" }}>
                <div className="nn-calc-h">ε-tube membership (first 5 points)</div>
                {REG.xs.slice(0, 5).map((x, i) => {
                  const yp = REG.w * x + REG.b;
                  const res = Math.abs(REG.ys[i] - yp);
                  const inside = res <= eps;
                  return (
                    <div className="nn-calc-row" key={i}>
                      x={x}: |{fmt(REG.ys[i],1)}−{fmt(yp,2)}|={fmt(res,3)} →&nbsp;
                      <b style={{ color: inside ? "var(--pos,green)" : COL_SV }}>
                        {inside ? "inside ✓" : "outside ✗"}
                      </b>
                    </div>
                  );
                })}
              </div>
              <div className="nn-calc" style={{ flex: "1 1 220px" }}>
                <div className="nn-calc-h">Effect of changing ε</div>
                <div className="nn-calc-row">ε large → wider tube → fewer SVs → smoother fit</div>
                <div className="nn-calc-row">ε small → narrow tube → more SVs → tighter fit</div>
                <div className="nn-calc-row">ε = 0 → every point is an SV (like OLS)</div>
                <div className="nn-calc-row">ε = ∞ → no SVs, flat line (mean prediction)</div>
              </div>
            </Row>
            <Note>
              <b>Blue circles</b> = inside the tube (zero loss, ignored). <b>Red squares</b> = support
              vectors (outside the tube, penalised). The regression line only "feels" the support vectors
              — all blue-circle points can be removed without changing the fit.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 4: Support Vectors in SVR ───────────────────── */
    {
      id: "svr-support-vectors", group: "Core Concept", title: "Support Vectors in SVR",
      map: "Support Vectors",
      why: "Like in classification SVM, only a sparse subset of training points define the regression fit. This sparsity makes SVR memory-efficient and its predictions interpretable in terms of the training data.",
      render: (trace) => {
        const { allPreds, isSV, residuals } = trace;
        const svCount = isSV.filter(Boolean).length;
        return (
          <>
            <Lead>
              In SVR, <b>support vectors</b> are training points that lie <em>on or outside</em>
              the ε-tube boundary — i.e., points where |yᵢ − ŷᵢ| ≥ ε. These are the only
              points with non-zero Lagrange multipliers (αᵢ or αᵢ*); they are the only points
              that influence the fitted line w and bias b.
            </Lead>
            <Lead>
              All points <em>inside</em> the tube have Lagrange multipliers of exactly zero. This
              means you could completely remove all inside-tube points from the training set and
              the learned w and b would be identical. The regression fit is <b>defined entirely
              by the support vectors</b> — this is the sparsity property of SVR.
            </Lead>
            <Lead>
              For our dataset with ε = {REG.epsilon}, there are <b>{svCount} support vectors</b> out of
              10 training points. The table below shows the residual for each point and whether it
              qualifies as a support vector.
            </Lead>

            <RegBase>
              <EpsilonTube w={REG.w} b={REG.b} eps={REG.epsilon} />
              <RegLine w={REG.w} b={REG.b} />
              {/* residual lines for SVs only */}
              {REG.xs.map((x, i) => {
                if (!isSV[i]) return null;
                return (
                  <line key={i}
                    x1={sx(x)} y1={sy(REG.ys[i])}
                    x2={sx(x)} y2={sy(allPreds[i])}
                    stroke={COL_SV} strokeWidth="1.8" strokeDasharray="4 2" opacity="0.8"
                  />
                );
              })}
              <DataPts isSV={isSV} showQuery={false} />
            </RegBase>

            <div className="tf-subhead">Support vector classification for all training points</div>
            <Matrix
              data={REG.xs.map((x, i) => [
                x, REG.ys[i],
                fmt(allPreds[i], 2),
                fmt(residuals[i], 3),
                fmt(Math.abs(residuals[i]), 3),
                isSV[i] ? "SV ✗" : "inside ✓"
              ])}
              rowLabels={REG.xs.map((_, i) => `i=${i+1}`)}
              colLabels={["x", "y", "ŷ", "resid", "|resid|", "status"]}
              caption={`SVR support vectors (ε = ${REG.epsilon})`}
              sub={`${svCount} SVs, ${10 - svCount} inside tube`}
              heat={false}
            />
            <Note>
              Dashed red lines from each SV to the regression line show the residual. SVs are the
              points "sticking out" of the tube. If you built a new training set containing only
              the {svCount} SVs and re-fit SVR with the same parameters, you would get the same
              regression line.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 5: Objective Function ───────────────────────── */
    {
      id: "svr-optimization", group: "Math", title: "SVR Objective Function",
      map: "Objective",
      why: "The SVR objective mirrors the classification SVM — minimise ‖w‖² while constraining deviations. The C parameter controls the trade-off between tube width and fit quality.",
      render: () => (
        <>
          <Lead>
            SVR solves a <b>convex quadratic program</b> with two slack variables per training
            point: ξᵢ ≥ 0 for points above the upper tube, and ξᵢ* ≥ 0 for points below the
            lower tube. The objective is to minimise ½‖w‖² (maximise smoothness) plus
            C times the total slack (penalise violations). C controls the trade-off.
          </Lead>
          <Lead>
            The constraints say: each yᵢ must be within ε + ξᵢ above or ε + ξᵢ* below the
            prediction. If a point is within the tube, both slacks are zero and the constraint
            is trivially satisfied. If a point is outside the tube, the corresponding slack equals
            the overshoot: ξᵢ = |yᵢ − ŷᵢ| − ε.
          </Lead>
          <Lead>
            Increasing C forces the model to work harder to keep all points within the tube →
            tighter fit, more support vectors. Decreasing C tolerates more violations → wider
            effective tube, fewer SVs, smoother prediction. The interaction between C and ε
            is shown in Stage 6.
          </Lead>

          <div className="tf-subhead">Primal formulation</div>
          <Formula label="Objective">min<Sub>w,b,ξ,ξ*</Sub> &nbsp; ½‖w‖² + C · Σᵢ(ξᵢ + ξᵢ*)</Formula>
          <Formula label="Constraints above">yᵢ − (w·xᵢ + b) ≤ ε + ξᵢ &nbsp;&nbsp; ξᵢ ≥ 0</Formula>
          <Formula label="Constraints below">(w·xᵢ + b) − yᵢ ≤ ε + ξᵢ* &nbsp;&nbsp; ξᵢ* ≥ 0</Formula>

          <div className="tf-subhead">Dual (kernelized) form</div>
          <Formula label="Dual objective">
            max &nbsp; −½ ΣΣ (αᵢ − αᵢ*)(αⱼ − αⱼ*)(xᵢ·xⱼ) − ε Σ(αᵢ + αᵢ*) + Σyᵢ(αᵢ − αᵢ*)
          </Formula>
          <Formula label="Kernel prediction">ŷ = Σᵢ (αᵢ − αᵢ*) K(xᵢ, x) + b</Formula>

          <Row>
            <div className="nn-calc" style={{ flex: "1 1 220px" }}>
              <div className="nn-calc-h">Our fitted model</div>
              <div className="nn-calc-row">w = {REG.w}, b = {REG.b}, ε = {REG.epsilon}</div>
              <div className="nn-calc-row">‖w‖² = {fmt(REG.w * REG.w, 4)}</div>
              <div className="nn-calc-row">½‖w‖² = {fmt(0.5 * REG.w * REG.w, 4)} (regularisation)</div>
              <div className="nn-calc-row">Total slack Σ(ξᵢ+ξᵢ*) = {fmt(REG.xs.reduce((s,x,i) => {
                const res = Math.abs(REG.ys[i] - (REG.w * x + REG.b));
                return s + Math.max(0, res - REG.epsilon);
              }, 0), 3)}</div>
            </div>
            <div className="nn-calc" style={{ flex: "1 1 220px" }}>
              <div className="nn-calc-h">C and ε interaction summary</div>
              <div className="nn-calc-row">C↑ + ε same → more SVs, tighter fit</div>
              <div className="nn-calc-row">C↓ + ε same → fewer SVs, smoother</div>
              <div className="nn-calc-row">ε↑ + C same → fewer SVs, more bias</div>
              <div className="nn-calc-row">ε↓ + C same → more SVs, less bias</div>
              <div className="nn-calc-row">Tune both jointly via cross-validation</div>
            </div>
          </Row>
          <Note>
            KKT conditions: αᵢ × (yᵢ − ŷᵢ − ε − ξᵢ) = 0 and αᵢ* × (ŷᵢ − yᵢ − ε − ξᵢ*) = 0.
            Only points outside the tube (ξ &gt; 0 or ξ* &gt; 0) have non-zero multipliers —
            confirming the sparse support vector property.
          </Note>
        </>
      ),
    },

    /* ── Stage 6: Kernel SVR ───────────────────────────────── */
    {
      id: "kernel-svr", group: "Extensions", title: "Kernel SVR — Non-Linear Regression",
      map: "Kernel SVR",
      why: "The kernel trick applies identically to SVR — swap the dot product for K(x,z) in the dual and you get non-linear regression without ever computing the high-dimensional mapping.",
      render: () => {
        // Generate non-linear data: sinusoidal + linear trend
        const nlXs = [1,2,3,4,5,6,7,8,9,10];
        const nlYs = [3.2, 4.8, 4.1, 6.3, 5.5, 7.1, 5.9, 7.8, 6.4, 8.2];

        // Linear SVR approximation
        const linW = 0.47, linB = 2.9;
        // RBF SVR (simulated smooth curve)
        function rbfPred(x) {
          // Simulated smooth non-linear fit
          return 4.2 + 0.3*x + 0.8*Math.sin(x * 0.9 - 0.5);
        }

        const miniW = 220, miniH = 175;
        const mPad = { l: 18, r: 10, t: 14, b: 24 };
        const mmx = v => mPad.l + ((v - 0) / 11) * (miniW - mPad.l - mPad.r);
        const mmy = v => mPad.t + (1 - (v - 1) / 10) * (miniH - mPad.t - mPad.b);
        const eps = 0.7;

        return (
          <>
            <Lead>
              The same <b>kernel trick</b> from classification SVM applies directly to SVR — simply
              replace every dot product xᵢ·xⱼ in the dual with a kernel evaluation K(xᵢ, xⱼ).
              The rest of the algorithm is identical. The prediction becomes
              ŷ = Σ(αᵢ−αᵢ*)K(xᵢ, x) + b, which can fit smooth non-linear curves.
            </Lead>
            <Lead>
              The <b>RBF kernel</b> K(x,z) = exp(−γ|x−z|²) is the most popular choice for SVR.
              It places a Gaussian bump centred at each support vector; the prediction is a smooth
              weighted sum of these bumps. The parameter γ controls the bandwidth: small γ → wide
              bumps, smooth curve; large γ → narrow bumps, wiggly curve.
            </Lead>
            <Lead>
              The comparison below shows linear SVR vs RBF SVR on a dataset with a non-linear trend.
              Linear SVR fits a straight tube and misses the curvature. RBF SVR adapts its tube to
              the non-linear shape of the data, fitting the trend much more closely.
            </Lead>

            <Row>
              <div style={{ flex: "1 1 220px" }}>
                <div className="tf-subhead" style={{ fontSize: 12 }}>Linear SVR — misses curvature</div>
                <svg viewBox={`0 0 ${miniW} ${miniH}`} style={{ width: "100%", maxWidth: miniW, display: "block" }}>
                  <line x1={mPad.l} y1={miniH-mPad.b} x2={miniW-mPad.r} y2={miniH-mPad.b} stroke="var(--ink)" strokeWidth="1" />
                  <line x1={mPad.l} y1={mPad.t} x2={mPad.l} y2={miniH-mPad.b} stroke="var(--ink)" strokeWidth="1" />
                  {/* linear tube */}
                  <polygon
                    points={`${mmx(0)},${mmy(linW*0+linB+eps)} ${mmx(11)},${mmy(linW*11+linB+eps)} ${mmx(11)},${mmy(linW*11+linB-eps)} ${mmx(0)},${mmy(linW*0+linB-eps)}`}
                    fill="rgba(43,91,255,0.10)"
                  />
                  {[linB+eps, linB-eps].map((off, k) => (
                    <line key={k}
                      x1={mmx(0)} y1={mmy(linW*0+off)}
                      x2={mmx(11)} y2={mmy(linW*11+off)}
                      stroke="rgba(43,91,255,0.4)" strokeWidth="1.2" strokeDasharray="4 2" />
                  ))}
                  <line x1={mmx(0)} y1={mmy(linW*0+linB)} x2={mmx(11)} y2={mmy(linW*11+linB)}
                    stroke="var(--accent)" strokeWidth="2" />
                  {nlXs.map((x, i) => {
                    const yp = linW * x + linB;
                    const sv = Math.abs(nlYs[i] - yp) >= eps * 0.9;
                    return sv
                      ? <rect key={i} x={mmx(x)-4} y={mmy(nlYs[i])-4} width="8" height="8" fill={COL_SV} stroke="var(--bg)" strokeWidth="1" rx="1" />
                      : <circle key={i} cx={mmx(x)} cy={mmy(nlYs[i])} r="4" fill={COL_IN} stroke="var(--bg)" strokeWidth="1" />;
                  })}
                  <text x={miniW/2} y={miniH-6} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="inherit">Linear kernel, ε={eps}</text>
                </svg>
              </div>

              <div style={{ flex: "1 1 220px" }}>
                <div className="tf-subhead" style={{ fontSize: 12 }}>RBF SVR — follows the curve</div>
                <svg viewBox={`0 0 ${miniW} ${miniH}`} style={{ width: "100%", maxWidth: miniW, display: "block" }}>
                  <line x1={mPad.l} y1={miniH-mPad.b} x2={miniW-mPad.r} y2={miniH-mPad.b} stroke="var(--ink)" strokeWidth="1" />
                  <line x1={mPad.l} y1={mPad.t} x2={mPad.l} y2={miniH-mPad.b} stroke="var(--ink)" strokeWidth="1" />
                  {/* RBF tube as polygon */}
                  {(() => {
                    const pts = [];
                    for (let xv = 0; xv <= 11; xv += 0.5) {
                      pts.push(`${mmx(xv)},${mmy(rbfPred(xv)+eps)}`);
                    }
                    for (let xv = 11; xv >= 0; xv -= 0.5) {
                      pts.push(`${mmx(xv)},${mmy(rbfPred(xv)-eps)}`);
                    }
                    return <polygon points={pts.join(" ")} fill="rgba(43,91,255,0.10)" />;
                  })()}
                  {/* upper and lower tube lines */}
                  {[eps, -eps].map((off, k) => {
                    const pts = [];
                    for (let xv = 0; xv <= 11; xv += 0.4) {
                      pts.push(`${mmx(xv).toFixed(1)},${mmy(rbfPred(xv)+off).toFixed(1)}`);
                    }
                    return <polyline key={k} points={pts.join(" ")} fill="none" stroke="rgba(43,91,255,0.4)" strokeWidth="1.2" strokeDasharray="4 2" />;
                  })}
                  {/* RBF regression curve */}
                  {(() => {
                    const pts = [];
                    for (let xv = 0; xv <= 11; xv += 0.3) {
                      pts.push(`${mmx(xv).toFixed(1)},${mmy(rbfPred(xv)).toFixed(1)}`);
                    }
                    return <polyline points={pts.join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2" />;
                  })()}
                  {nlXs.map((x, i) => {
                    const yp = rbfPred(x);
                    const sv = Math.abs(nlYs[i] - yp) >= eps * 0.9;
                    return sv
                      ? <rect key={i} x={mmx(x)-4} y={mmy(nlYs[i])-4} width="8" height="8" fill={COL_SV} stroke="var(--bg)" strokeWidth="1" rx="1" />
                      : <circle key={i} cx={mmx(x)} cy={mmy(nlYs[i])} r="4" fill={COL_IN} stroke="var(--bg)" strokeWidth="1" />;
                  })}
                  <text x={miniW/2} y={miniH-6} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="inherit">RBF kernel (γ=0.5), ε={eps}</text>
                </svg>
              </div>
            </Row>

            <div className="tf-subhead" style={{ marginTop: 12 }}>Kernel choices for SVR</div>
            <div className="tf-legend">
              {[
                ["Linear", "K(x,z) = x·z", "d-dim", "For data with a roughly linear trend. Fastest. Interpretable (w has direct meaning)."],
                ["Polynomial", "K(x,z) = (γx·z+r)^d", "degree d", "Fits polynomial curves. Good when you expect smooth polynomial relationships."],
                ["RBF", "K(x,z) = exp(−γ|x−z|²)", "∞-dim", "Most flexible and popular. Adapts to any smooth curve. Tune γ with cross-validation."],
              ].map(r => (
                <div className="tf-leg" key={r[0]}>
                  <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div>
                  <div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>
            <Note>
              With the RBF kernel, the prediction ŷ = Σ(αᵢ−αᵢ*)·exp(−γ|xᵢ−x|²) + b is a weighted
              sum of Gaussian bumps centred at each support vector xᵢ. The weight (αᵢ−αᵢ*) can be
              positive (above-tube SV) or negative (below-tube SV).
            </Note>
          </>
        );
      },
    },

    /* ── Stage 7: Predictions ──────────────────────────────── */
    {
      id: "svr-prediction", group: "Prediction", title: "Prediction Walkthrough",
      map: "Prediction",
      why: "Seeing the complete prediction — from input x to predicted ŷ with tube bounds — ties together all SVR concepts and shows what the model actually computes at inference time.",
      render: (trace) => {
        const { x, pred, tubeLo, tubeHi, allPreds, isSV, residuals } = trace;
        const testXs = [2.0, 5.5, 9.0];
        return (
          <>
            <Lead>
              At inference, SVR computes ŷ = w·x + b (linear) or ŷ = Σ(αᵢ−αᵢ*)K(xᵢ,x)+b (kernel).
              For the current slider value x = <b>{fmt(x)}</b>, the prediction is
              ŷ = {REG.w}×{fmt(x)} + {REG.b} = <b>{fmt(pred, 3)}</b>.
              The ε-tube at this x spans [{fmt(tubeLo, 3)}, {fmt(tubeHi, 3)}].
            </Lead>
            <Lead>
              Unlike classification (which returns a class label), SVR returns a continuous real
              number. The tube is used only during training to define the loss — at test time you
              simply compute ŷ = w·x + b and return it. There is no "inside the tube" check
              at inference; the tube was only relevant during fitting.
            </Lead>

            <RegBase>
              <EpsilonTube w={REG.w} b={REG.b} eps={REG.epsilon} />
              <RegLine w={REG.w} b={REG.b} />
              <DataPts isSV={isSV} showQuery={true} qx={x} qy={pred} />
              {/* vertical indicator at query x */}
              <line x1={sx(x)} y1={sy(tubeLo)} x2={sx(x)} y2={sy(tubeHi)}
                stroke="rgba(226,76,96,0.8)" strokeWidth="2" />
              <circle cx={sx(x)} cy={sy(pred)} r="5" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />
              <text x={sx(x)+8} y={sy(pred)+4} fontSize="11" fill="var(--accent)" fontWeight="700" fontFamily="inherit">ŷ={fmt(pred,2)}</text>
              <text x={sx(x)+8} y={sy(tubeHi)-4} fontSize="10" fill="rgba(226,76,96,0.9)" fontFamily="inherit">+ε→{fmt(tubeHi,2)}</text>
              <text x={sx(x)+8} y={sy(tubeLo)+12} fontSize="10" fill="rgba(226,76,96,0.9)" fontFamily="inherit">−ε→{fmt(tubeLo,2)}</text>
            </RegBase>

            <div className="nn-calc">
              <div className="nn-calc-h">Step-by-step prediction for x = {fmt(x)}</div>
              <div className="nn-calc-row">ŷ = w × x + b = {REG.w} × {fmt(x)} + {REG.b}</div>
              <div className="nn-calc-row">= {fmt(REG.w * x, 3)} + {REG.b}</div>
              <div className="nn-calc-row"><b>ŷ = {fmt(pred, 4)}</b></div>
              <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                ε-tube at this x: [{fmt(tubeLo, 3)}, {fmt(tubeHi, 3)}]
              </div>
              <div className="nn-calc-row" style={{ color: "var(--accent)" }}>
                Any training y in [{fmt(tubeLo, 3)}, {fmt(tubeHi, 3)}] → zero training loss
              </div>
            </div>

            <div className="tf-subhead" style={{ marginTop: 12 }}>Predictions for 3 fixed test points</div>
            <Matrix
              data={testXs.map(tx => {
                const tp = REG.w * tx + REG.b;
                return [tx, fmt(tp, 3), fmt(tp - REG.epsilon, 3), fmt(tp + REG.epsilon, 3)];
              })}
              rowLabels={["Test₁","Test₂","Test₃"]}
              colLabels={["x", "ŷ", "tube lo", "tube hi"]}
              caption="Fixed test predictions"
              sub={`ŷ = ${REG.w}x + ${REG.b}, ε = ${REG.epsilon}`}
              heat={false}
            />
            <Note>
              Drag the x slider to see how the prediction, tube bounds, and query point ★ update.
              The star always lands on the regression line (ŷ = wx+b); the red brackets show the
              zero-loss zone at that x position.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 8: Missing Values & Outliers ─────────────────── */
    {
      id: "missing-outliers", group: "Robustness", title: "Missing Values & Outliers — SVR's Robustness",
      map: "Robustness",
      why: "The ε-insensitive loss gives SVR natural robustness to outliers that fall within the tube. Understanding this — and when it helps versus doesn't — is key to deciding when to use SVR.",
      render: () => {
        // Show three SVR fits: normal, with outlier at (5, 12), with large epsilon
        const outlierY = 10.5; // at x=5, y=10.5 is a big outlier
        const normalW = REG.w, normalB = REG.b, normalEps = REG.epsilon;

        const miniW = 210, miniH = 185;
        const mPad = { l: 18, r: 10, t: 14, b: 24 };
        const mmx = v => mPad.l + ((v - 0) / 11) * (miniW - mPad.l - mPad.r);
        const mmy = v => mPad.t + (1 - (v - 0) / 11) * (miniH - mPad.t - mPad.b);

        function miniSVRPlot(w, b, eps, outlier, title, col) {
          const data = REG.xs.map((x, i) => ({ x, y: REG.ys[i] }));
          if (outlier) data.push({ x: outlier[0], y: outlier[1], isOutlier: true });
          return (
            <div style={{ flex: "1 1 210px" }}>
              <div className="tf-subhead" style={{ fontSize: 12 }}>{title}</div>
              <svg viewBox={`0 0 ${miniW} ${miniH}`} style={{ width: "100%", maxWidth: miniW, display: "block" }}>
                <line x1={mPad.l} y1={miniH-mPad.b} x2={miniW-mPad.r} y2={miniH-mPad.b} stroke="var(--ink)" strokeWidth="1" />
                <line x1={mPad.l} y1={mPad.t} x2={mPad.l} y2={miniH-mPad.b} stroke="var(--ink)" strokeWidth="1" />
                <polygon
                  points={`${mmx(0)},${mmy(w*0+b+eps)} ${mmx(11)},${mmy(w*11+b+eps)} ${mmx(11)},${mmy(w*11+b-eps)} ${mmx(0)},${mmy(w*0+b-eps)}`}
                  fill={`rgba(${col},0.10)`}
                />
                {[b+eps, b-eps].map((off, k) => (
                  <line key={k} x1={mmx(0)} y1={mmy(w*0+off)} x2={mmx(11)} y2={mmy(w*11+off)}
                    stroke={`rgba(${col},0.45)`} strokeWidth="1.2" strokeDasharray="4 2" />
                ))}
                <line x1={mmx(0)} y1={mmy(w*0+b)} x2={mmx(11)} y2={mmy(w*11+b)}
                  stroke={`rgba(${col},1)`} strokeWidth="2" />
                {data.map((pt, i) => {
                  const yp = w * pt.x + b;
                  const sv = Math.abs(pt.y - yp) >= eps * 0.9;
                  return pt.isOutlier
                    ? <circle key={i} cx={mmx(pt.x)} cy={mmy(pt.y)} r="6" fill="gold" stroke="var(--bg)" strokeWidth="2" />
                    : sv
                      ? <rect key={i} x={mmx(pt.x)-4} y={mmy(pt.y)-4} width="8" height="8" fill={COL_SV} stroke="var(--bg)" strokeWidth="1" rx="1" />
                      : <circle key={i} cx={mmx(pt.x)} cy={mmy(pt.y)} r="4" fill={COL_IN} stroke="var(--bg)" strokeWidth="1" />;
                })}
                <text x={miniW/2} y={miniH-6} textAnchor="middle" fontSize="9" fill="var(--muted)" fontFamily="inherit">w={w}, b={b}, ε={eps}</text>
              </svg>
            </div>
          );
        }

        return (
          <>
            <Lead>
              SVR's <b>ε-insensitive loss</b> makes it more robust to outliers than ordinary least
              squares (OLS). If an outlier falls <em>inside</em> the tube (|error| &lt; ε), it is
              completely ignored — it contributes zero to the objective and has zero influence on
              w and b. This is radically different from OLS, where a large outlier at error = k
              contributes k² to the loss and can pull the regression line dramatically.
            </Lead>
            <Lead>
              However, SVR is <b>not immune to outliers</b>. If an outlier is outside the tube,
              it becomes a support vector and does influence the fit. With large C, an extreme outlier
              can still dominate. The soft C parameter helps: a smaller C means the outlier's slack
              penalty is lower, so the model tolerates the violation rather than shifting the tube.
              Concretely: with ε = 1.0, any data point within 1 unit of the prediction is
              completely ignored — that's why SVR is robust to <em>small-to-moderate</em> noise.
            </Lead>
            <Lead>
              <b>Missing values</b> must be handled before SVR training — like all kernel methods,
              SVR computes dot products between feature vectors and NaN propagates through these
              operations. Use mean/median imputation (sklearn SimpleImputer) or model-based
              imputation before fitting. Also remember: <b>always StandardScale</b> features
              before SVR — the ε-tube and kernel are highly sensitive to feature scale.
            </Lead>

            <Row>
              {miniSVRPlot(normalW, normalB, normalEps, null, "Normal data — standard fit", "43,91,255")}
              {miniSVRPlot(normalW + 0.08, normalB + 0.3, normalEps, [5, outlierY], "Outlier outside tube — influences fit", "226,76,96")}
              {miniSVRPlot(normalW, normalB, 1.5, null, "Large ε=1.5 — more points ignored", "43,150,100")}
            </Row>

            <div className="tf-legend" style={{ marginTop: 12 }}>
              {[
                ["Inside tube", "Zero influence", "immune", `Points with |error| < ε = ${REG.epsilon} are completely ignored. SVR acts as if they don't exist.`],
                ["Outside tube", "SV — some influence", "partial", "Points outside the tube become SVs. With small C, their influence is limited. With large C, they dominate."],
                ["Missing values", "Must impute first", "required", "NaN in features causes NaN in kernel computations. Use SimpleImputer(strategy='mean') before SVR."],
                ["Feature scaling", "Critical — always scale", "required", "Without StandardScaler, features with large range dominate the kernel. Always scale X (and optionally y) before fitting."],
              ].map(r => (
                <div className="tf-leg" key={r[0]}>
                  <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div>
                  <div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>

            <div className="nn-calc" style={{ marginTop: 8 }}>
              <div className="nn-calc-h">Outlier at x=5, y=10.5: loss comparison</div>
              {(() => {
                const yp = REG.w * 5 + REG.b;
                const res = Math.abs(10.5 - yp);
                const epsLoss = Math.max(0, res - REG.epsilon);
                const mseLoss = res * res;
                return (
                  <>
                    <div className="nn-calc-row">ŷ at x=5: {REG.w}×5 + {REG.b} = {fmt(yp, 2)}</div>
                    <div className="nn-calc-row">residual = |10.5 − {fmt(yp,2)}| = {fmt(res, 3)}</div>
                    <div className="nn-calc-row">SVR loss: max(0, {fmt(res,3)} − {REG.epsilon}) = <b>{fmt(epsLoss, 3)}</b></div>
                    <div className="nn-calc-row">OLS loss: {fmt(res,3)}² = <b>{fmt(mseLoss, 3)}</b></div>
                    <div className="nn-calc-row">SVR penalises this outlier <b>{fmt(mseLoss/epsLoss, 1)}× less</b> than OLS</div>
                  </>
                );
              })()}
            </div>
            <Note>
              The gold point in the middle panel shows the outlier outside the tube — it becomes an
              SV and shifts the regression line slightly. With a smaller C, the model would tolerate
              larger slack and be less influenced. With ε = 1.5 (right panel), more points fall inside
              the wider tube, yielding a smoother, more robust fit at the cost of precision.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 9: Evaluation & When to Use ─────────────────── */
    {
      id: "svr-when-to-use", group: "Evaluation", title: "Evaluation, When to Use SVR & Comparisons",
      map: "When to Use",
      why: "SVR is a powerful but niche regression tool. Understanding its evaluation metrics and when it outperforms simpler alternatives prevents misuse and helps you select the right model.",
      render: (trace) => {
        const { allPreds, residuals } = trace;
        const mse = residuals.reduce((s, r) => s + r*r, 0) / residuals.length;
        const mae = residuals.reduce((s, r) => s + Math.abs(r), 0) / residuals.length;
        const yMean = REG.ys.reduce((s, v) => s + v, 0) / REG.ys.length;
        const ssTot = REG.ys.reduce((s, v) => s + (v - yMean)**2, 0);
        const ssRes = residuals.reduce((s, r) => s + r*r, 0);
        const r2 = 1 - ssRes / ssTot;
        return (
          <>
            <Lead>
              SVR's primary evaluation metrics are <b>MSE</b> (mean squared error),
              <b> MAE</b> (mean absolute error), and <b>R²</b> (coefficient of determination).
              MAE is often preferred for SVR because the ε-insensitive loss is related to MAE
              rather than MSE — SVR minimises an approximate MAE within the tube.
            </Lead>
            <Lead>
              SVR is best when: your dataset has <b>outliers or noisy measurements</b> within a
              predictable range; your data is <b>small-to-medium</b> (n &lt; 10 000); you expect
              a <b>non-linear relationship</b> and want to use the kernel trick; or you want a
              <b> sparse model</b> that stores only a fraction of the training data.
            </Lead>

            <div className="nn-calc" style={{ marginBottom: 12 }}>
              <div className="nn-calc-h">SVR fit metrics on training data (linear kernel)</div>
              <div className="nn-calc-row">MSE = (1/n) Σ(yᵢ − ŷᵢ)² = <b>{fmt(mse, 4)}</b></div>
              <div className="nn-calc-row">MAE = (1/n) Σ|yᵢ − ŷᵢ| = <b>{fmt(mae, 4)}</b></div>
              <div className="nn-calc-row">RMSE = √MSE = <b>{fmt(Math.sqrt(mse), 4)}</b></div>
              <div className="nn-calc-row">R² = 1 − SS_res/SS_tot = <b>{fmt(r2, 4)}</b></div>
              <div className="nn-calc-row">Note: these are training metrics — evaluate on held-out test set in practice.</div>
            </div>

            <div className="opt-pc">
              <div className="opt-pc-col is-pro">
                <div className="opt-pc-h">SVR Strengths</div>
                <ul className="opt-pc-ul">
                  <li className="opt-pc-li">Robust to outliers (ε-insensitive loss)</li>
                  <li className="opt-pc-li">Sparse model — only SVs stored at inference</li>
                  <li className="opt-pc-li">Kernel trick → non-linear regression without explicit features</li>
                  <li className="opt-pc-li">Works well in high-dimensional spaces</li>
                  <li className="opt-pc-li">Convex optimisation — unique global optimum, no random init</li>
                  <li className="opt-pc-li">No distributional assumptions on residuals</li>
                </ul>
              </div>
              <div className="opt-pc-col is-con">
                <div className="opt-pc-h">SVR Limitations</div>
                <ul className="opt-pc-ul">
                  <li className="opt-pc-li">O(n² to n³) training — slow for n &gt; 10 000</li>
                  <li className="opt-pc-li">Three hyperparameters (C, ε, γ for RBF) to tune jointly</li>
                  <li className="opt-pc-li">Feature scaling required — critical</li>
                  <li className="opt-pc-li">Hard to interpret with non-linear kernels</li>
                  <li className="opt-pc-li">No confidence intervals without extra (e.g. conformal) methods</li>
                  <li className="opt-pc-li">ε is often harder to set than C — domain knowledge helps</li>
                </ul>
              </div>
            </div>

            <div className="tf-subhead">SVR vs alternatives for regression</div>
            <div className="tf-legend">
              {[
                ["SVR", "Support Vector Regression", "your choice", "Best for: small datasets with noisy measurements, outlier-robust fit needed, non-linear data with kernel trick."],
                ["OLS", "Linear Regression (OLS)", "baseline", "Fastest. Gives confidence intervals. Best when data is truly linear, no outliers, large n. Always try first."],
                ["RF", "Random Forest Regression", "ensemble", "Handles non-linearity natively. No scaling needed. Robust without tuning. Preferred for large tabular datasets."],
                ["GPR", "Gaussian Process Regression", "probabilistic", "Provides full uncertainty estimates. Computationally similar to SVR. Better when you need prediction intervals."],
                ["NN", "Neural Network Regression", "deep", "Best for huge datasets or very complex patterns (images, sequences). SVR wins on small n."],
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
                ["Scale", "train", "StandardScaler on X and optionally y. SVR is highly sensitive to feature scale — skip this and results are unreliable."],
                ["Choose kernel", "train", "Try linear first (fast). Switch to RBF if linear fit is poor. Start with γ='scale' (sklearn default)."],
                ["Tune C, ε, γ", "train", "Grid/random search with 5-fold CV. C∈[0.1,1000], ε∈[0.01,1], γ∈[auto,scale,0.001,0.1,1]."],
                ["Train SVR", "train", "Solve QP (libsvm). Log n_support_vectors — should be a small fraction of n."],
                ["Evaluate", "train", "Use MAE or RMSE. Check R². If R² < 0, model is worse than predicting the mean — increase C or try RBF."],
                ["Predict", "infer", "ŷ = Σ(αᵢ−αᵢ*)K(xᵢ,x)+b. Inverse-transform y if you scaled the target."],
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
        );
      },
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
      { label: "Regression", href: "SVM (Regression).html", active: true },
    ],
  };
})();
