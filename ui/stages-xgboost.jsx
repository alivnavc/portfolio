/* ============================================================
   XGBoost — stages-xgboost.jsx  (12 stages)
   Requires: window.ML_XGB (from model/ml-xgboost.js)
             window.{ Matrix, V, Sub, Sup, Formula, Lead, Note,
                      Row, Arrow, Tag, fmt } (from matrix.jsx)
   ============================================================ */
(function () {
  const { V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState, useRef, useEffect } = React;
  const { XGB, runXGB } = window.ML_XGB;

  // ── SVG chart dimensions ──
  const W = 460, H = 240;
  const PAD = { l: 50, r: 20, t: 18, b: 38 };
  const xMin = 0, xMax = 36, yMin = 0, yMax = 10;

  const sx = v => PAD.l + ((v - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const sy = v => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  // ── Scatter axes ──
  function ScatterAxes({ xLabel = "age (years)", yLabel = "price ($100k)" }) {
    const xTicks = [0, 5, 10, 15, 20, 25, 30, 35];
    const yTicks = [0, 2, 4, 6, 8, 10];
    return (
      <>
        {yTicks.map(v => (
          <line key={v} x1={PAD.l} y1={sy(v)} x2={W - PAD.r} y2={sy(v)}
            stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />
        ))}
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--ink)" strokeWidth="1.4" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--ink)" strokeWidth="1.4" />
        {xTicks.map(v => (
          <g key={v}>
            <line x1={sx(v)} y1={H - PAD.b} x2={sx(v)} y2={H - PAD.b + 4} stroke="var(--ink)" strokeWidth="1" />
            <text x={sx(v)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--muted)">{v}</text>
          </g>
        ))}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PAD.l - 4} y1={sy(v)} x2={PAD.l} y2={sy(v)} stroke="var(--ink)" strokeWidth="1" />
            <text x={PAD.l - 6} y={sy(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{v}</text>
          </g>
        ))}
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 2} textAnchor="middle" fontSize="11" fill="var(--muted)">{xLabel}</text>
        <text x={12} y={(PAD.t + H - PAD.b) / 2} textAnchor="middle" fontSize="11" fill="var(--muted)"
          transform={`rotate(-90, 12, ${(PAD.t + H - PAD.b) / 2})`}>{yLabel}</text>
      </>
    );
  }

  // ── data dots ──
  const PT_COLOR = "#2B5BFF";
  function DataDots() {
    return (
      <>
        {XGB.xs.map((x, i) => (
          <circle key={i} cx={sx(x)} cy={sy(XGB.ys[i])} r="5"
            fill={PT_COLOR} opacity="0.85" stroke="white" strokeWidth="1.2" />
        ))}
      </>
    );
  }

  // ── step-function prediction line ──
  function StepLine({ preds, color = "var(--accent)", strokeWidth = 2.5 }) {
    const sorted = XGB.xs.map((x, i) => ({ x, p: preds[i] })).sort((a, b) => a.x - b.x);
    const segments = [];
    for (let i = 0; i < sorted.length; i++) {
      const x0 = i === 0 ? xMin : (sorted[i - 1].x + sorted[i].x) / 2;
      const x1 = i === sorted.length - 1 ? xMax : (sorted[i].x + sorted[i + 1].x) / 2;
      segments.push({ x0, x1, p: sorted[i].p });
    }
    return (
      <>
        {segments.map((seg, i) => (
          <line key={i}
            x1={sx(seg.x0)} y1={sy(Math.max(yMin, Math.min(yMax, seg.p)))}
            x2={sx(seg.x1)} y2={sy(Math.max(yMin, Math.min(yMax, seg.p)))}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" opacity="0.9" />
        ))}
        {segments.slice(0, -1).map((seg, i) => (
          <line key={"v" + i}
            x1={sx((sorted[i].x + sorted[i + 1].x) / 2)}
            y1={sy(Math.max(yMin, Math.min(yMax, seg.p)))}
            x2={sx((sorted[i].x + sorted[i + 1].x) / 2)}
            y2={sy(Math.max(yMin, Math.min(yMax, segments[i + 1].p)))}
            stroke={color} strokeWidth={strokeWidth} opacity="0.5" />
        ))}
      </>
    );
  }

  // ── MSE progress bars ──
  function MSEBars({ rounds, initMSE }) {
    const allEntries = [{ label: "Init (F₀)", mse: initMSE }, ...rounds.map((r, i) => ({ label: `After T${i + 1}`, mse: r.mse }))];
    const maxMSE = allEntries[0].mse;
    return (
      <div style={{ margin: "12px 0" }}>
        {allEntries.map((entry, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)", width: 80, flexShrink: 0 }}>{entry.label}</span>
            <div style={{ flex: 1, background: "var(--line-soft)", borderRadius: 4, height: 14, overflow: "hidden", maxWidth: 280 }}>
              <div style={{
                height: "100%", borderRadius: 4,
                width: `${(entry.mse / maxMSE) * 100}%`,
                background: i === 0 ? "#e0492e" : `hsl(${140 + i * 30}, 60%, 42%)`,
                transition: "width 0.4s ease"
              }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: "var(--num-font)", color: "var(--ink)", width: 58, flexShrink: 0 }}>
              {entry.mse.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── XGBoost tree diagram ──
  function XGBTreeSvg({ threshold, leftWeight, rightWeight, leftLabel, rightLabel }) {
    const W2 = 320, H2 = 160;
    const midX = W2 / 2;
    const rootY = 36, childY = 110;
    const leftX = 72, rightX = W2 - 72;
    const lCol = leftWeight >= 0 ? "#1f9e6b" : "#e0492e";
    const rCol = rightWeight >= 0 ? "#1f9e6b" : "#e0492e";
    return (
      <svg width={W2} height={H2} style={{ overflow: "visible" }}>
        <line x1={midX} y1={rootY + 18} x2={leftX} y2={childY - 18} stroke="var(--line)" strokeWidth="1.5" />
        <line x1={midX} y1={rootY + 18} x2={rightX} y2={childY - 18} stroke="var(--line)" strokeWidth="1.5" />
        <text x={(midX + leftX) / 2 - 10} y={(rootY + childY) / 2 + 2} fontSize="10" fill="var(--muted)" fontStyle="italic">yes</text>
        <text x={(midX + rightX) / 2 + 10} y={(rootY + childY) / 2 + 2} fontSize="10" fill="var(--muted)" fontStyle="italic">no</text>
        <rect x={midX - 78} y={rootY - 18} width={156} height={36} rx="8"
          fill="var(--panel-solid)" stroke="var(--accent)" strokeWidth="2" />
        <text x={midX} y={rootY + 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">
          age ≤ {threshold}?
        </text>
        <rect x={leftX - 44} y={childY - 18} width={88} height={36} rx="8"
          fill={`${lCol}18`} stroke={lCol} strokeWidth="1.5" />
        <text x={leftX} y={childY - 2} textAnchor="middle" fontSize="12" fontWeight="700" fill={lCol}>
          w* = {fmt(leftWeight, 4)}
        </text>
        <text x={leftX} y={childY + 12} textAnchor="middle" fontSize="9" fill="var(--muted)">{leftLabel}</text>
        <rect x={rightX - 44} y={childY - 18} width={88} height={36} rx="8"
          fill={`${rCol}18`} stroke={rCol} strokeWidth="1.5" />
        <text x={rightX} y={childY - 2} textAnchor="middle" fontSize="12" fontWeight="700" fill={rCol}>
          w* = {fmt(rightWeight, 4)}
        </text>
        <text x={rightX} y={childY + 12} textAnchor="middle" fontSize="9" fill="var(--muted)">{rightLabel}</text>
      </svg>
    );
  }

  // ── renderInput: sliders for eta, lambda, gamma, nTrees ──
  function renderInput(input, setInput) {
    const sliders = [
      { key: "eta",    label: "η (learning rate)", min: 0.1, max: 0.5, step: 0.1,  fmt: v => v.toFixed(1) },
      { key: "lambda", label: "λ (L2 reg)",        min: 0.0, max: 5.0, step: 0.5,  fmt: v => v.toFixed(1) },
      { key: "gamma",  label: "γ (min gain)",       min: 0.0, max: 2.0, step: 0.25, fmt: v => v.toFixed(2) },
      { key: "nTrees", label: "Trees",              min: 1,   max: 3,   step: 1,    fmt: v => v },
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {sliders.map(s => (
          <div key={s.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)" }}>
              <span>{s.label}</span>
              <span style={{ fontFamily: "var(--num-font)", color: "var(--ink)", fontWeight: 600 }}>{s.fmt(input[s.key])}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={input[s.key]}
              onChange={e => setInput({ ...input, [s.key]: +e.target.value })}
              style={{ width: "100%" }} />
          </div>
        ))}
      </div>
    );
  }

  // ── comparison table helper ──
  function CompareRow({ label, gbm, xgb, highlight }) {
    return (
      <tr style={{ borderBottom: "1px solid var(--line-soft)", background: highlight ? "rgba(43,91,255,.05)" : "transparent" }}>
        <td style={{ padding: "7px 10px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{label}</td>
        <td style={{ padding: "7px 10px", fontSize: 13, fontFamily: "var(--num-font)", color: "var(--muted)" }}>{gbm}</td>
        <td style={{ padding: "7px 10px", fontSize: 13, fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: highlight ? 700 : 400 }}>{xgb}</td>
      </tr>
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 1: Overview — What is XGBoost?
  // ────────────────────────────────────────────────────────
  const stageOverview = {
    id: "overview", group: "Overview", title: "XGBoost — eXtreme Gradient Boosting",
    map: "Overview",
    why: "XGBoost won dozens of Kaggle competitions. Understanding why it beats vanilla GBM requires knowing exactly what it changes: second-order gradients, built-in regularization, and a smarter split criterion.",
    render: () => (
      <>
        <Lead>
          <b>XGBoost</b> (eXtreme Gradient Boosting) was created by Tianqi Chen at the University of
          Washington and open-sourced in 2014. It dominated machine learning competitions for years
          and remains one of the most effective algorithms for structured tabular data. The "extreme"
          refers to its engineering optimizations — parallelized feature evaluation, cache-aware
          computation, sparsity handling — but also to its mathematical improvements over vanilla GBM.
        </Lead>
        <Lead>
          Vanilla Gradient Boosting (GBM) builds trees sequentially, each fitting the <b>residuals</b> of
          the previous ensemble. XGBoost does the same, but replaces the residual-fitting step with a
          richer optimization using both the <b>first-order gradient</b> (the direction) and the
          <b> second-order gradient / hessian</b> (the curvature). This is Newton's method applied to
          tree building, and it leads to better-calibrated step sizes and built-in regularization.
        </Lead>

        <div style={{ margin: "18px 0 10px" }}>
          <div className="tf-subhead">GBM vs XGBoost — key differences</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", minWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["Feature", "GBM (vanilla)", "XGBoost"].map(h => (
                    <th key={h} style={{ padding: "7px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="Gradients used" gbm="1st order only (residuals)" xgb="1st AND 2nd order (Newton)" highlight />
                <CompareRow label="Regularization" gbm="None (or manual)" xgb="L1 (α) + L2 (λ) built-in" highlight />
                <CompareRow label="Split criterion" gbm="Variance reduction" xgb="Similarity Score formula" highlight />
                <CompareRow label="Leaf value" gbm="mean(residuals)" xgb="-ΣG / (ΣH + λ)" highlight />
                <CompareRow label="Missing values" gbm="Crashes / manual imputation" xgb="Learned optimal direction" />
                <CompareRow label="Feature selection" gbm="None built-in" xgb="colsample_bytree" />
                <CompareRow label="Tree pruning" gbm="None" xgb="Gain < γ → prune" />
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ margin: "18px 0 10px" }}>
          <div className="tf-subhead">XGBoost pipeline</div>
          <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", margin: "10px 0" }}>
            {[
              { label: "F₀ = mean(y)", sub: "initial pred", color: "#94A2BC" },
              null,
              { label: "g, h", sub: "gradients + hessians", color: "#f59e0b" },
              null,
              { label: "Similarity Scores", sub: "find best split", color: "#2B5BFF" },
              null,
              { label: "w* = -G/(H+λ)", sub: "regularized leaf", color: "#7c5cff" },
              null,
              { label: "F += η·w*(x)", sub: "update", color: "#1f9e6b" },
              null,
              { label: "repeat ×T", sub: "T trees", color: "#1f9e6b" },
            ].map((item, i) =>
              item === null ? (
                <div key={i} style={{ fontSize: 18, color: "var(--faint)", padding: "0 3px" }}>→</div>
              ) : (
                <div key={i} style={{
                  padding: "7px 10px", borderRadius: 8, textAlign: "center", minWidth: 88,
                  background: `${item.color}18`, border: `1.5px solid ${item.color}44`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.label}</div>
                  {item.sub && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{item.sub}</div>}
                </div>
              )
            )}
          </div>
        </div>

        <div className="tf-legend">
          {[
            ["Gradient (gᵢ)", "First derivative of the loss w.r.t. F(xᵢ). For MSE: gᵢ = F(xᵢ) − yᵢ (same direction as GBM residuals, just sign-flipped). Tells you WHICH DIRECTION to correct."],
            ["Hessian (hᵢ)", "Second derivative of the loss w.r.t. F(xᵢ). For MSE: hᵢ = 1 (constant). In other losses like log-loss, hᵢ varies per point. Tells you HOW LARGE the correction step should be."],
            ["Similarity Score", "XGBoost's split criterion: SS = (ΣGᵢ)² / (ΣHᵢ + λ). The numerator rewards 'agreement' among gradients. The λ in the denominator penalizes noisy or small groups."],
            ["Regularized leaf weight", "w* = −ΣGᵢ / (ΣHᵢ + λ). The λ shrinks the leaf value toward 0, preventing extreme predictions on small leaves. When λ=0 this equals the GBM mean-residual formula."],
            ["γ (gamma)", "Minimum gain threshold. If adding a split improves the Similarity Score by less than γ, XGBoost prunes that split entirely. Acts as automatic tree pruning."],
          ].map(([name, desc]) => (
            <div className="tf-leg" key={name}>
              <div className="tf-leg-name">{name}</div>
              <div className="tf-leg-desc">{desc}</div>
            </div>
          ))}
        </div>

        <Note>
          We use the SAME toy dataset as the GBM Regression page (6 houses, age → price) so you can
          compare the two algorithms step-by-step with identical numbers. The differences in leaf
          weights and split scoring will be explicit and numerical.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 2: Same Dataset, Different Math
  // ────────────────────────────────────────────────────────
  const stageDataset = {
    id: "dataset", group: "Data", title: "Same dataset — house age vs price",
    map: "Dataset",
    why: "Using the identical 6-house dataset as GBM lets us compare algorithms on equal footing. Every difference you see in the numbers comes purely from the math, not the data.",
    render: (trace) => {
      const F0 = trace.F0;
      const yMean = XGB.ys.reduce((a, b) => a + b, 0) / XGB.ys.length;
      return (
        <>
          <Lead>
            Our toy dataset has <b>6 houses</b>. One feature: <b>age (years)</b>.
            Target: <b>price ($100k)</b>. Older houses are cheaper — clear downward trend.
            This is the exact same dataset used in the GBM Regression explainer, which means
            every number we compute can be directly compared between the two algorithms.
          </Lead>
          <Lead>
            The <b>starting prediction F₀ = mean(y) = {fmt(F0, 4)}</b> is identical to GBM.
            From this point forward, the algorithms diverge: XGBoost uses the Similarity Score
            for splitting and the regularized leaf formula w* = −G/(H+λ) instead of mean(residuals).
          </Lead>

          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
            <ScatterAxes />
            <DataDots />
            <line x1={PAD.l} y1={sy(F0)} x2={W - PAD.r} y2={sy(F0)}
              stroke="#94A2BC" strokeWidth="2" strokeDasharray="6 3" />
            <text x={W - PAD.r - 4} y={sy(F0) - 6} textAnchor="end" fontSize="10" fill="#94A2BC" fontWeight="600">
              F₀ = {fmt(F0, 3)}
            </text>
          </svg>

          <div className="tf-subhead" style={{ marginTop: 12 }}>Training data</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", maxWidth: 440 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["#", "age", "price y", "F₀", "y − F₀ (residual)"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {XGB.xs.map((x, i) => {
                  const res = XGB.ys[i] - F0;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "5px 10px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{i + 1}</td>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{x}</td>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: 600 }}>{XGB.ys[i]}</td>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(F0, 4)}</td>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: res >= 0 ? "#1f9e6b" : "#e0492e", fontWeight: 600 }}>{fmt(res, 4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="nn-calc" style={{ marginTop: 12 }}>
            <div className="nn-calc-h">Initial statistics</div>
            <div className="nn-calc-row">
              F₀ = mean(y) = ({XGB.ys.join(" + ")}) / {XGB.ys.length} = <b>{fmt(yMean, 4)}</b>
            </div>
            <div className="nn-calc-row">
              Initial MSE = {fmt(trace.initMSE, 4)} — this is what we want to reduce
            </div>
          </div>

          <Note>
            The initial prediction F₀ = {fmt(F0, 4)} is the same for GBM and XGBoost.
            The divergence begins in Step 3 when we compute gradients and hessians
            instead of just plain residuals.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 3: First-Order vs Second-Order Gradients
  // ────────────────────────────────────────────────────────
  const stageGradients = {
    id: "gradients", group: "Core Math", title: "First-order vs second-order gradients",
    map: "g and h",
    why: "This is the most important stage. XGBoost's advantage over GBM comes from using Newton's method — the hessian tells you how confidently to step, not just which direction.",
    render: (trace) => {
      const F0 = trace.F0;
      return (
        <>
          <Lead>
            <b>GBM fits residuals</b>: rᵢ = yᵢ − F(xᵢ). That is the negative first-order gradient
            of MSE loss. XGBoost is more principled: it explicitly computes both the
            <b> first-order gradient gᵢ</b> and the <b>second-order gradient (hessian) hᵢ</b>.
            The hessian measures how sharply the loss curves at the current prediction — it tells
            you how large the optimal correction step should be.
          </Lead>
          <Lead>
            Think of it as the difference between <b>gradient descent</b> (only uses slope)
            and <b>Newton's method</b> (uses slope AND curvature). Newton's method reaches the
            minimum faster because it takes better-calibrated steps. For MSE, hᵢ = 1 for every
            point, so the advantage shows most when using other losses (log-loss, Huber). But the
            regularized leaf formula w* = −G/(H+λ) still benefits even when all hᵢ = 1.
          </Lead>

          <div className="nn-calc" style={{ margin: "16px 0 10px" }}>
            <div className="nn-calc-h">Taylor expansion of loss</div>
            <div className="nn-calc-row">L(F + Δ) ≈ L(F) + gᵢ·Δ + ½·hᵢ·Δ²</div>
            <div className="nn-calc-row">Optimal step (no regularization): Δ* = −gᵢ / hᵢ</div>
            <div className="nn-calc-row">For MSE: L = ½(y−F)²</div>
            <div className="nn-calc-row">gᵢ = ∂L/∂F = F − y  (sign-flipped residual)</div>
            <div className="nn-calc-row">hᵢ = ∂²L/∂F² = 1  (constant for MSE)</div>
          </div>

          <div className="tf-subhead" style={{ marginTop: 16 }}>Gradients and hessians for our 6 houses</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", maxWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["house", "age", "price y", "F₀", "gᵢ = F₀ − y", "hᵢ = 1", "−gᵢ (= residual)"].map(h => (
                    <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {XGB.xs.map((x, i) => {
                  const g = F0 - XGB.ys[i];
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "5px 8px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{i + 1}</td>
                      <td style={{ padding: "5px 8px", fontFamily: "var(--num-font)" }}>{x}</td>
                      <td style={{ padding: "5px 8px", fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: 600 }}>{XGB.ys[i]}</td>
                      <td style={{ padding: "5px 8px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(F0, 4)}</td>
                      <td style={{ padding: "5px 8px", fontFamily: "var(--num-font)", color: g < 0 ? "#1f9e6b" : "#e0492e", fontWeight: 700 }}>{fmt(g, 4)}</td>
                      <td style={{ padding: "5px 8px", fontFamily: "var(--num-font)", color: "var(--muted)" }}>1</td>
                      <td style={{ padding: "5px 8px", fontFamily: "var(--num-font)", color: -g < 0 ? "#e0492e" : "#1f9e6b" }}>{fmt(-g, 4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div style={{ background: "rgba(148,162,188,.1)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94A2BC", marginBottom: 6 }}>GBM approach</div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7 }}>
                Fits residuals rᵢ = yᵢ − F(xᵢ)<br />
                Leaf value = mean(residuals)<br />
                No hessian, no regularization<br />
                One number per sample
              </div>
            </div>
            <div style={{ background: "rgba(43,91,255,.07)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>XGBoost approach</div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7 }}>
                Uses gᵢ AND hᵢ per sample<br />
                Leaf value = −ΣG/(ΣH+λ)<br />
                λ regularizes the leaf weight<br />
                Two numbers per sample
              </div>
            </div>
          </div>

          <Note>
            For MSE loss all hessians are 1, so the hessian advantage shows mainly through the
            regularization in the denominator. For other losses (e.g. log-loss for classification),
            hᵢ varies per point and XGBoost's Newton-step approach gives meaningfully different
            leaf weights than GBM.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 4: Similarity Score — split criterion
  // ────────────────────────────────────────────────────────
  const stageSimilarity = {
    id: "similarity", group: "Core Math", title: "Similarity Score — XGBoost's split criterion",
    map: "Similarity Score",
    why: "XGBoost doesn't use variance reduction to find the best split. It uses a regularized formula — Similarity Score — that incorporates λ so that noisy or small groups get penalized.",
    render: (trace) => {
      const F0 = trace.F0;
      const lambda = trace.cfg.lambda;
      const gradients = XGB.ys.map(y => F0 - y);
      const hessians = XGB.ys.map(() => 1);
      // threshold 12.5: houses 0,1 (age ≤ 12.5), houses 2,3,4,5 (age > 12.5)
      const thr = 12.5;
      const leftIdx = XGB.xs.map((x, i) => i).filter(i => XGB.xs[i] <= thr);
      const rightIdx = XGB.xs.map((x, i) => i).filter(i => XGB.xs[i] > thr);
      const Gall = gradients.reduce((a, b) => a + b, 0);
      const Hall = hessians.reduce((a, b) => a + b, 0);
      const GL = leftIdx.reduce((s, i) => s + gradients[i], 0);
      const HL = leftIdx.reduce((s, i) => s + hessians[i], 0);
      const GR = rightIdx.reduce((s, i) => s + gradients[i], 0);
      const HR = rightIdx.reduce((s, i) => s + hessians[i], 0);
      const ssRoot = (Gall * Gall) / (Hall + lambda);
      const ssLeft = (GL * GL) / (HL + lambda);
      const ssRight = (GR * GR) / (HR + lambda);
      const gain = ssLeft + ssRight - ssRoot;
      return (
        <>
          <Lead>
            GBM finds the best split using <b>variance reduction</b> — the split that most reduces
            the variance of residuals in each child node. XGBoost uses a different criterion called
            the <b>Similarity Score</b>. The formula looks different but captures the same intuition:
            a good split creates groups where the gradients all point the same direction (high
            agreement = high |ΣG|), and the group is large enough to be trustworthy.
          </Lead>
          <Lead>
            The <b>λ regularization term</b> in the denominator is the key addition. It penalizes
            the score for groups with few samples or high variance in their gradients. A split that
            creates a node with only 1 sample gets a lower Similarity Score than GBM would give it —
            preventing XGBoost from overfitting to individual noisy points.
          </Lead>

          <div className="nn-calc" style={{ margin: "16px 0 10px" }}>
            <div className="nn-calc-h">Similarity Score formula</div>
            <div className="nn-calc-row">SS(node) = (ΣGᵢ)² / (ΣHᵢ + λ)</div>
            <div className="nn-calc-row">Gain = SS(left) + SS(right) − SS(root) − γ</div>
            <div className="nn-calc-row">Best split = threshold with maximum Gain</div>
          </div>

          <div className="tf-subhead" style={{ marginTop: 16 }}>Worked example: threshold = 12.5 (λ = {fmt(lambda, 1)})</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", maxWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["group", "houses", "ΣGᵢ", "ΣHᵢ", "SS = G²/(H+λ)"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--line-soft)", background: "rgba(43,91,255,.04)" }}>
                  <td style={{ padding: "5px 10px", fontWeight: 600, color: "var(--ink)" }}>Root</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontSize: 12 }}>all 6</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{fmt(Gall, 4)}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{Hall}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontWeight: 700 }}>{fmt(ssRoot, 4)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line-soft)", background: "rgba(31,158,107,.04)" }}>
                  <td style={{ padding: "5px 10px", fontWeight: 600, color: "#1f9e6b" }}>Left (≤ 12.5)</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontSize: 12 }}>{leftIdx.map(i => `h${i + 1}`).join(", ")}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{fmt(GL, 4)}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{HL}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontWeight: 700, color: "#1f9e6b" }}>{fmt(ssLeft, 4)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line-soft)", background: "rgba(224,73,46,.04)" }}>
                  <td style={{ padding: "5px 10px", fontWeight: 600, color: "#e0492e" }}>Right (> 12.5)</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontSize: 12 }}>{rightIdx.map(i => `h${i + 1}`).join(", ")}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{fmt(GR, 4)}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{HR}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontWeight: 700, color: "#e0492e" }}>{fmt(ssRight, 4)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="nn-calc" style={{ marginTop: 12 }}>
            <div className="nn-calc-h">Gain calculation</div>
            <div className="nn-calc-row">Gain = SS_left + SS_right − SS_root − γ</div>
            <div className="nn-calc-row">= {fmt(ssLeft, 4)} + {fmt(ssRight, 4)} − {fmt(ssRoot, 4)} − {fmt(trace.cfg.gamma, 2)}</div>
            <div className="nn-calc-row"><b>Gain = {fmt(gain - trace.cfg.gamma, 4)}</b></div>
          </div>

          <Note>
            GBM would find this same split (age = 12.5) using variance reduction, because for simple
            data with one feature the best split is the same. The difference is that XGBoost's Gain
            formula incorporates λ — so with λ = {fmt(lambda, 1)}, the denominator penalizes groups
            with few samples. Try changing λ with the slider to see how the Similarity Scores shift.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 5: Leaf Weights — regularized formula
  // ────────────────────────────────────────────────────────
  const stageLeafWeights = {
    id: "leaf-weights", group: "Core Math", title: "Leaf weights — the regularized formula",
    map: "Leaf Weights",
    why: "This is where XGBoost and GBM produce visibly different numbers. The λ in the denominator shrinks leaf weights toward 0 — the key regularization mechanism.",
    render: (trace) => {
      const F0 = trace.F0;
      const lambda = trace.cfg.lambda;
      const gradients = XGB.ys.map(y => F0 - y);
      const hessians = XGB.ys.map(() => 1);
      const thr = 12.5;
      const leftIdx = XGB.xs.map((x, i) => i).filter(i => XGB.xs[i] <= thr);
      const rightIdx = XGB.xs.map((x, i) => i).filter(i => XGB.xs[i] > thr);
      const GL = leftIdx.reduce((s, i) => s + gradients[i], 0);
      const HL = leftIdx.length;
      const GR = rightIdx.reduce((s, i) => s + gradients[i], 0);
      const HR = rightIdx.length;
      const xgbLeft = -GL / (HL + lambda);
      const xgbRight = -GR / (HR + lambda);
      const residuals = XGB.ys.map(y => y - F0);
      const rLeft = leftIdx.map(i => residuals[i]);
      const rRight = rightIdx.map(i => residuals[i]);
      const gbmLeft = rLeft.reduce((a, b) => a + b, 0) / rLeft.length;
      const gbmRight = rRight.reduce((a, b) => a + b, 0) / rRight.length;
      const xgbLeft0 = -GL / (HL + 0);
      const xgbRight0 = -GR / (HR + 0);
      return (
        <>
          <Lead>
            Once XGBoost finds the best split, it must assign a <b>leaf weight w*</b> to each leaf.
            GBM uses the mean of the residuals: w = ΣRᵢ / n. XGBoost uses the regularized formula:
            w* = −ΣGᵢ / (ΣHᵢ + λ). The "+λ" in the denominator is the only difference, but it has
            a significant effect: larger λ shrinks the leaf weight toward zero.
          </Lead>
          <Lead>
            Think of the denominator ΣHᵢ + λ as an "effective sample count with a prior." When a leaf
            has only 2 samples (ΣHᵢ = 2 for MSE), adding λ=1 effectively says "trust this leaf as if
            it had 3 samples pointing toward zero." With λ=5, the regularization overwhelms the data
            on small leaves. This prevents the common overfitting scenario where a single unusual
            house dominates a leaf's prediction.
          </Lead>

          <div className="nn-calc" style={{ margin: "16px 0 10px" }}>
            <div className="nn-calc-h">Left leaf (age ≤ 12.5): houses {leftIdx.map(i => i + 1).join(", ")}</div>
            <div className="nn-calc-row">ΣGᵢ = {leftIdx.map(i => fmt(gradients[i], 3)).join(" + ")} = {fmt(GL, 4)}</div>
            <div className="nn-calc-row">ΣHᵢ = {HL} (MSE: each hᵢ = 1)</div>
            <div className="nn-calc-row">GBM:  w = mean(residuals) = {fmt(gbmLeft, 4)}</div>
            <div className="nn-calc-row"><b>XGB (λ={fmt(lambda, 1)}): w* = −{fmt(GL, 4)} / ({HL} + {fmt(lambda, 1)}) = {fmt(xgbLeft, 4)}</b></div>
          </div>

          <div className="nn-calc" style={{ margin: "10px 0" }}>
            <div className="nn-calc-h">Right leaf (age > 12.5): houses {rightIdx.map(i => i + 1).join(", ")}</div>
            <div className="nn-calc-row">ΣGᵢ = {rightIdx.map(i => fmt(gradients[i], 3)).join(" + ")} = {fmt(GR, 4)}</div>
            <div className="nn-calc-row">ΣHᵢ = {HR}</div>
            <div className="nn-calc-row">GBM:  w = mean(residuals) = {fmt(gbmRight, 4)}</div>
            <div className="nn-calc-row"><b>XGB (λ={fmt(lambda, 1)}): w* = −{fmt(GR, 4)} / ({HR} + {fmt(lambda, 1)}) = {fmt(xgbRight, 4)}</b></div>
          </div>

          <div className="tf-subhead" style={{ marginTop: 16 }}>Comparison: GBM leaf vs XGBoost leaf</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", maxWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["leaf", "GBM (mean resid)", "XGB λ=0", "XGB λ=1", `XGB λ=${fmt(lambda, 1)}`].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "5px 10px", fontWeight: 600 }}>Left</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(gbmLeft, 4)}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{fmt(xgbLeft0, 4)}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{fmt(-GL / (HL + 1), 4)}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: 700 }}>{fmt(xgbLeft, 4)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "5px 10px", fontWeight: 600 }}>Right</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(gbmRight, 4)}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{fmt(xgbRight0, 4)}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{fmt(-GR / (HR + 1), 4)}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: 700 }}>{fmt(xgbRight, 4)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Note>
            When λ=0, XGBoost leaf weights equal GBM leaf weights exactly.
            As λ increases, the XGBoost leaf weights shrink toward zero.
            This is beneficial: without regularization, a leaf with 1 sample would get
            a leaf weight equal to the full residual of that single point — highly overfit.
            With λ=1, that weight is halved; with λ=9 it's 10× smaller.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 6: Round 1 — Full Tree Building
  // ────────────────────────────────────────────────────────
  const stageRound1 = {
    id: "round1", group: "Boosting", title: "Round 1 — full tree building",
    map: "Tree 1",
    why: "See the complete first round: all threshold candidates scored, the winner selected, leaf weights assigned, and predictions updated. MSE drops after just one tree.",
    render: (trace) => {
      if (!trace.rounds || trace.rounds.length === 0) return <Lead>Run with at least 1 tree.</Lead>;
      const r = trace.rounds[0];
      return (
        <>
          <Lead>
            Round 1 computes gradients gᵢ = F₀ − yᵢ for all 6 houses, sweeps all
            {" "}{r.thresholdResults ? r.thresholdResults.length : 5} candidate thresholds to find
            the highest Gain, assigns regularized leaf weights w* = −G/(H+λ), then updates each
            prediction: F₁(xᵢ) = F₀ + η × w*(xᵢ).
          </Lead>

          <div className="tf-subhead" style={{ marginTop: 14 }}>All threshold candidates — Gain sweep</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", maxWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["threshold", "SS_left", "SS_right", "SS_root", "Gain", "best?"].map(h => (
                    <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(r.thresholdResults || []).map((row, i) => {
                  const isBest = Math.abs(row.threshold - r.splitThreshold) < 0.001;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)", background: isBest ? "rgba(43,91,255,.08)" : "transparent" }}>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: isBest ? 700 : 400, color: isBest ? "var(--accent-ink)" : "var(--ink)" }}>{row.threshold}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{fmt(row.ssLeft, 4)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{fmt(row.ssRight, 4)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{fmt(r.similarityRoot, 4)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: isBest ? 700 : 400, color: isBest ? "var(--accent-ink)" : "var(--ink)" }}>{fmt(row.gain, 4)}</td>
                      <td style={{ padding: "4px 8px", fontSize: 12, color: "var(--accent-ink)" }}>{isBest ? "★ best" : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tf-subhead" style={{ marginTop: 16 }}>Best split → tree structure</div>
          <div style={{ margin: "10px 0" }}>
            <XGBTreeSvg
              threshold={r.splitThreshold}
              leftWeight={r.leftLeafWeight}
              rightWeight={r.rightLeafWeight}
              leftLabel={`ages ${r.leftIndices.map(i => XGB.xs[i]).join(", ")}`}
              rightLabel={`ages ${r.rightIndices.map(i => XGB.xs[i]).join(", ")}`}
            />
          </div>

          <div className="tf-subhead" style={{ marginTop: 12 }}>Updated predictions after Round 1</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", maxWidth: 580 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["house", "age", "y", "F₀", "w*(x)", "F₁ = F₀ + η×w*", "new gᵢ"].map(h => (
                    <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {XGB.xs.map((x, i) => {
                  const isLeft = r.leftIndices.includes(i);
                  const w = isLeft ? r.leftLeafWeight : r.rightLeafWeight;
                  const newPred = r.predictions[i];
                  const newG = newPred - XGB.ys[i];
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "4px 8px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{i + 1}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{x}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: 600 }}>{XGB.ys[i]}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(trace.F0, 4)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: isLeft ? "#1f9e6b" : "#e0492e" }}>{fmt(w, 4)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: 700 }}>{fmt(newPred, 4)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: newG < 0 ? "#1f9e6b" : "#e0492e" }}>{fmt(newG, 4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
            <div className="nn-calc" style={{ flex: 1, minWidth: 200 }}>
              <div className="nn-calc-h">MSE improvement</div>
              <div className="nn-calc-row">Before: MSE = {fmt(trace.initMSE, 4)}</div>
              <div className="nn-calc-row"><b>After T1: MSE = {fmt(r.mse, 4)}</b></div>
              <div className="nn-calc-row">Reduction: {fmt(((trace.initMSE - r.mse) / trace.initMSE) * 100, 1)}%</div>
            </div>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, marginTop: 12 }}>
            <ScatterAxes />
            <StepLine preds={trace.initPreds} color="#94A2BC" strokeWidth={1.5} />
            <StepLine preds={r.predictions} color="var(--accent)" />
            <DataDots />
          </svg>

          <Note>
            The grey line = F₀ (initial mean). The blue line = F₁ after Round 1.
            MSE dropped from {fmt(trace.initMSE, 4)} to {fmt(r.mse, 4)}.
            The tree correctly moved predictions for young houses up and old houses down.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 7: Regularization — L1, L2, γ
  // ────────────────────────────────────────────────────────
  const stageRegularization = {
    id: "regularization", group: "Regularization", title: "Regularization — L1 (α), L2 (λ), and γ",
    map: "Regularization",
    why: "Regularization is one of XGBoost's defining advantages. Without it, leaf weights can be extreme and the model overfits. With it, the model generalizes better — and you have three independent knobs to tune.",
    render: (trace) => {
      const lambda = trace.cfg.lambda;
      const F0 = trace.F0;
      const gradients = XGB.ys.map(y => F0 - y);
      // Compute leaf weights for different lambda values
      const thr = 12.5;
      const leftIdx = XGB.xs.map((x, i) => i).filter(i => XGB.xs[i] <= thr);
      const rightIdx = XGB.xs.map((x, i) => i).filter(i => XGB.xs[i] > thr);
      const GL = leftIdx.reduce((s, i) => s + gradients[i], 0);
      const HL = leftIdx.length;
      const GR = rightIdx.reduce((s, i) => s + gradients[i], 0);
      const HR = rightIdx.length;
      const lambdas = [0, 0.5, 1, 2, 5];
      return (
        <>
          <Lead>
            XGBoost has three regularization mechanisms that work independently. <b>L2 (λ)</b>
            is added to the leaf weight denominator, shrinking all leaf values. <b>L1 (α)</b> can
            set leaf weights to exactly zero, effectively pruning leaves (only in the full
            objective). <b>γ (gamma)</b> is a minimum gain threshold — any split whose Gain is below
            γ is discarded. Together they give you fine-grained control over model complexity.
          </Lead>

          <div className="tf-legend" style={{ marginTop: 14 }}>
            {[
              ["L2 regularization (λ)", "Adds λ/2 × Σwⱼ² to the loss. Effect in the tree: changes the leaf formula to w* = −G/(H+λ). With λ=0 you get GBM. With λ=5 the leaf weights are much smaller. Analogous to ridge regression."],
              ["L1 regularization (α)", "Adds α × Σ|wⱼ| to the loss. Unlike L2, L1 can force leaf weights to exactly 0. Useful for very sparse data where most leaves should be irrelevant. Analogous to Lasso regression."],
              ["γ (gamma)", "Minimum gain threshold. A split is only accepted if Gain > γ. Low γ (e.g. 0) = accept almost all splits (deep trees). High γ (e.g. 2) = only accept splits with clear signal (shallow trees). Natural tree pruning."],
            ].map(([name, desc]) => (
              <div className="tf-leg" key={name}>
                <div className="tf-leg-name">{name}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>

          <div className="tf-subhead" style={{ marginTop: 16 }}>How λ affects leaf weights (left leaf, threshold=12.5)</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", maxWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["λ value", "left w* = −G/(H+λ)", "right w* = −G/(H+λ)", "effect"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lambdas.map(lam => {
                  const wL = -GL / (HL + lam);
                  const wR = -GR / (HR + lam);
                  const isCurrent = Math.abs(lam - lambda) < 0.01;
                  return (
                    <tr key={lam} style={{ borderBottom: "1px solid var(--line-soft)", background: isCurrent ? "rgba(43,91,255,.08)" : "transparent" }}>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontWeight: isCurrent ? 700 : 400, color: isCurrent ? "var(--accent-ink)" : "var(--ink)" }}>{lam}</td>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontWeight: isCurrent ? 700 : 400 }}>{fmt(wL, 4)}</td>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontWeight: isCurrent ? 700 : 400 }}>{fmt(wR, 4)}</td>
                      <td style={{ padding: "5px 10px", fontSize: 12, color: "var(--muted)" }}>
                        {lam === 0 ? "= GBM (no regularization)" : lam >= 5 ? "heavily shrunk" : "mildly shrunk"}
                        {isCurrent ? " ← current" : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tf-subhead" style={{ marginTop: 16 }}>How γ affects split acceptance</div>
          <div style={{ background: "var(--panel-soft)", borderRadius: 10, padding: "12px 16px", fontSize: 13, lineHeight: 1.8 }}>
            {[0, 0.5, 1, 2, 5].map(g => {
              const gainR1 = trace.rounds && trace.rounds[0] ? trace.rounds[0].gain : 0;
              const accepted = gainR1 > g;
              return (
                <div key={g} style={{ display: "flex", gap: 12, alignItems: "center", padding: "4px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  <span style={{ fontFamily: "var(--num-font)", width: 60, color: "var(--muted)" }}>γ = {g}</span>
                  <span style={{ color: accepted ? "#1f9e6b" : "#e0492e", fontWeight: 700, width: 80 }}>
                    {accepted ? "accepted" : "pruned"}
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>
                    Gain = {trace.rounds && trace.rounds[0] ? fmt(trace.rounds[0].gain, 4) : "—"}, threshold = {g}
                  </span>
                </div>
              );
            })}
          </div>

          <Note>
            In practice: start with λ=1 (XGBoost default). Increase if the model overfits on small data.
            γ is best tuned via cross-validation — set it equal to roughly 10% of the typical gain value
            you see in round 1 as a starting point.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 8: Missing Values — learned optimal direction
  // ────────────────────────────────────────────────────────
  const stageMissing = {
    id: "missing", group: "Features", title: "Missing values — learned optimal direction",
    map: "Missing",
    why: "Missing values in real datasets are extremely common. GBM cannot handle them natively. XGBoost learns the best direction to route missing values at every split — no imputation needed.",
    render: () => {
      const F0 = XGB.ys.reduce((a, b) => a + b, 0) / XGB.ys.length;
      const modXS = [5, 10, null, 20, 25, 30]; // house 3 has missing age
      const modYS = XGB.ys;
      return (
        <>
          <Lead>
            Real-world datasets almost always have missing values. Vanilla GBM crashes if you pass
            it NaN — you must impute (fill in) missing values before training. XGBoost handles
            missing values natively by learning, at each split, whether missing values should
            go to the left child or the right child — whichever gives a higher Gain.
          </Lead>
          <Lead>
            The algorithm is simple: for each split candidate, compute the Gain twice — once routing
            missing values left, once routing them right. Keep whichever gives the higher Gain.
            At prediction time, any missing feature is routed the same learned direction. This is
            not just imputation — it is an <b>optimal, data-driven handling</b> that can differ
            by feature and by split.
          </Lead>

          <div className="tf-subhead" style={{ marginTop: 14 }}>Modified dataset — house 3 has missing age</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", maxWidth: 420 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["house", "age", "price", "note"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modXS.map((x, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)", background: x === null ? "rgba(224,73,46,.06)" : "transparent" }}>
                    <td style={{ padding: "5px 10px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{i + 1}</td>
                    <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: x === null ? "#e0492e" : "var(--ink)", fontWeight: x === null ? 700 : 400 }}>
                      {x === null ? "NaN" : x}
                    </td>
                    <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: 600 }}>{modYS[i]}</td>
                    <td style={{ padding: "5px 10px", fontSize: 12, color: x === null ? "#e0492e" : "var(--muted)" }}>
                      {x === null ? "MISSING — which direction?" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="nn-calc" style={{ marginTop: 14 }}>
            <div className="nn-calc-h">XGBoost missing value algorithm for split threshold = 12.5</div>
            <div className="nn-calc-row">Option A: route missing → LEFT (treat house 3 as age ≤ 12.5)</div>
            <div className="nn-calc-row">  Left group = houses 1, 2, 3 → Gain_A = SS(1,2,3) + SS(4,5,6) − SS(all) − γ</div>
            <div className="nn-calc-row">Option B: route missing → RIGHT (treat house 3 as age > 12.5)</div>
            <div className="nn-calc-row">  Right group = houses 3, 4, 5, 6 → Gain_B = SS(1,2) + SS(3,4,5,6) − SS(all) − γ</div>
            <div className="nn-calc-row">Choose: whichever of Gain_A, Gain_B is higher</div>
            <div className="nn-calc-row">Remember direction: all future NaN ages route the same way</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div style={{ background: "rgba(148,162,188,.1)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94A2BC", marginBottom: 6 }}>GBM (vanilla)</div>
              <ul style={{ fontSize: 13, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
                <li>NaN → crashes with error</li>
                <li>Must impute before training</li>
                <li>Mean imputation loses info</li>
                <li>Imputation is arbitrary</li>
              </ul>
            </div>
            <div style={{ background: "rgba(43,91,255,.07)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>XGBoost</div>
              <ul style={{ fontSize: 13, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
                <li>NaN handled natively</li>
                <li>Learns best direction per split</li>
                <li>Different features → different directions</li>
                <li>No imputation needed</li>
              </ul>
            </div>
          </div>

          <Note>
            In practice, XGBoost's native NaN handling is one of its most practically important
            features. On real datasets with 10–30% missing values, it consistently outperforms
            models that require imputation — because the "missingness itself" is often informative
            (e.g., a user who didn't fill in their age is systematically different).
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 9: Column Subsampling
  // ────────────────────────────────────────────────────────
  const stageColsample = {
    id: "colsample", group: "Features", title: "Column subsampling — colsample_bytree",
    map: "Subsampling",
    why: "Subsampling features per tree is the same trick Random Forest uses — it injects diversity, reduces correlation between trees, and speeds up training on high-dimensional data.",
    render: () => (
      <>
        <Lead>
          XGBoost inherits a trick from Random Forest: at each tree (or even each split),
          randomly select a fraction of features to consider. With our toy data we have only
          1 feature (age), so subsampling doesn't change anything. But imagine having 100 features
          (age, location, size, condition, school rating…). Evaluating all 100 at every node is
          slow and creates correlated trees. Evaluating a random 30 creates faster, more diverse trees.
        </Lead>
        <Lead>
          XGBoost supports two sampling axes: <b>colsample_bytree</b> (sample features once per tree),
          <b> colsample_bylevel</b> (sample at each depth level), and <b>colsample_bynode</b> (sample
          at each node). Combined with <b>subsample</b> (fraction of rows to use per tree), you
          can control how much randomness is injected into the ensemble — just like the bootstrap
          sampling in Random Forest, but more finely tuned.
        </Lead>

        <div style={{ margin: "16px 0 10px" }}>
          <div className="tf-subhead">Hypothetical 3-feature example</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", maxWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["tree", "features available", "colsample_bytree=0.67", "effect"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["T1", "age, size, location", "age, location", "size never considered in T1"],
                  ["T2", "age, size, location", "size, location", "age never considered in T2"],
                  ["T3", "age, size, location", "age, size", "location never considered in T3"],
                ].map(([t, all, sample, effect]) => (
                  <tr key={t} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                    <td style={{ padding: "5px 10px", fontWeight: 700, color: "var(--accent-ink)" }}>{t}</td>
                    <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontSize: 12 }}>{all}</td>
                    <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontSize: 12, color: "#1f9e6b" }}>{sample}</td>
                    <td style={{ padding: "5px 10px", fontSize: 12, color: "var(--muted)" }}>{effect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tf-legend" style={{ marginTop: 14 }}>
          {[
            ["colsample_bytree (0–1)", "Fraction of columns to sample PER TREE. With 100 features and colsample_bytree=0.5, each tree sees 50 randomly selected features. Default: 1.0 (all features)."],
            ["subsample (0–1)", "Fraction of ROWS to sample per tree (without replacement — unlike Random Forest which uses replacement). With subsample=0.8, each tree trains on 80% of rows. Adds row-level diversity."],
            ["min_child_weight", "Minimum sum of hessians (ΣH) in a leaf. For MSE this equals the minimum number of samples in a leaf. Equivalent to min_samples_leaf in sklearn. Prevents tiny, overfit leaves."],
          ].map(([name, desc]) => (
            <div className="tf-leg" key={name}>
              <div className="tf-leg-name">{name}</div>
              <div className="tf-leg-desc">{desc}</div>
            </div>
          ))}
        </div>

        <Note>
          On this toy dataset (1 feature, 6 samples), colsample_bytree and subsample are
          not very meaningful — every tree sees the same data. Their benefit is most visible
          with 50+ features and thousands of rows, where correlated trees are a real problem.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 10: Rounds 2 & 3 — Sequential Learning
  // ────────────────────────────────────────────────────────
  const stageRounds23 = {
    id: "rounds23", group: "Boosting", title: "Rounds 2 & 3 — gradients shrink each round",
    map: "T2 & T3",
    why: "Each round operates on smaller gradients than the previous. This is why boosting converges — the corrections get smaller and smaller as the residuals shrink.",
    render: (trace) => {
      const rounds = trace.rounds || [];
      return (
        <>
          <Lead>
            After Round 1, the predictions are closer to the true values, so the gradients
            (gᵢ = F₁(xᵢ) − yᵢ) are smaller. Round 2 builds a new tree on these smaller gradients.
            Round 3 operates on even smaller gradients. The XGBoost leaf weights w* = −G/(H+λ)
            shrink automatically because |G| decreases each round.
          </Lead>
          <Lead>
            Compare each round: the split threshold may stay the same (the same feature split is
            still optimal) but the leaf weights shrink. This self-regulating behavior is why
            XGBoost is more stable than GBM — the regularization and Newton-step optimization
            both push the corrections toward being "just right", not too large and not too small.
          </Lead>

          <MSEBars rounds={rounds} initMSE={trace.initMSE} />

          {rounds.map((r, ri) => (
            <div key={ri} style={{ marginBottom: 20 }}>
              <div className="tf-subhead">Tree {r.treeNum} — gradient summary</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", maxWidth: 560 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--line)" }}>
                      {["house", "age", "y", `F${ri} (before)`, "gᵢ", `w*(leaf)`, `F${ri + 1} (after)`].map(h => (
                        <th key={h} style={{ padding: "4px 7px", textAlign: "left", color: "var(--muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {XGB.xs.map((x, i) => {
                      const prevPred = ri === 0 ? trace.F0 : rounds[ri - 1].predictions[i];
                      const isLeft = r.leftIndices.includes(i);
                      const w = isLeft ? r.leftLeafWeight : r.rightLeafWeight;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                          <td style={{ padding: "3px 7px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{i + 1}</td>
                          <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)" }}>{x}</td>
                          <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: 600 }}>{XGB.ys[i]}</td>
                          <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(prevPred, 4)}</td>
                          <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)", color: r.gradients[i] < 0 ? "#1f9e6b" : "#e0492e" }}>{fmt(r.gradients[i], 4)}</td>
                          <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)", color: isLeft ? "#1f9e6b" : "#e0492e" }}>{fmt(w, 4)}</td>
                          <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)", fontWeight: 700 }}>{fmt(r.predictions[i], 4)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Split: age ≤ {r.splitThreshold} | Left w* = {fmt(r.leftLeafWeight, 4)} | Right w* = {fmt(r.rightLeafWeight, 4)} | MSE = {fmt(r.mse, 4)}
              </div>
            </div>
          ))}

          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, marginTop: 8 }}>
            <ScatterAxes />
            <StepLine preds={trace.initPreds} color="#94A2BC" strokeWidth={1.5} />
            {rounds.map((r, ri) => (
              <StepLine key={ri} preds={r.predictions}
                color={ri === 0 ? "#f59e0b" : ri === 1 ? "#7c5cff" : "#1f9e6b"}
                strokeWidth={ri === rounds.length - 1 ? 2.5 : 1.8} />
            ))}
            <DataDots />
          </svg>

          <Note>
            Each subsequent line is closer to the data points.
            The corrections get progressively smaller each round — this is the
            hallmark of a well-regularized boosting model. The learning rate η = {fmt(trace.cfg.eta, 1)} controls
            how much each round moves the predictions.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 11: XGBoost vs GBM — direct comparison
  // ────────────────────────────────────────────────────────
  const stageComparison = {
    id: "comparison", group: "Comparison", title: "XGBoost vs GBM — direct comparison",
    map: "XGB vs GBM",
    why: "Side-by-side comparison on identical data shows exactly when and why XGBoost produces different predictions. The differences are most visible in the leaf weights.",
    render: (trace) => {
      const rounds = trace.rounds || [];
      return (
        <>
          <Lead>
            We run 3 rounds of GBM (mean-residual leaves, no regularization) and 3 rounds of
            XGBoost (regularized leaves, λ = {fmt(trace.cfg.lambda, 1)}) on the same 6-house dataset.
            For this simple data the final predictions are similar — both models fit well.
            The differences appear in the leaf weights: XGBoost's are shrunk toward zero by λ.
          </Lead>
          <Lead>
            On more complex data (more features, noise, missing values), XGBoost's regularization
            would visibly reduce overfitting. The core message: XGBoost is a strictly more
            general algorithm. With λ=0 and γ=0, it reduces exactly to vanilla GBM.
          </Lead>

          <div className="tf-subhead" style={{ marginTop: 14 }}>Leaf weight comparison — Round 1</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", maxWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["leaf", "GBM (mean resid.)", `XGB (λ=${fmt(trace.cfg.lambda, 1)})`, "difference", "effect"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rounds[0] && (
                  <>
                    <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "5px 10px", fontWeight: 600 }}>Left</td>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(rounds[0].leftLeafWeightGBM, 4)}</td>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: 700 }}>{fmt(rounds[0].leftLeafWeight, 4)}</td>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "#e0492e" }}>{fmt(rounds[0].leftLeafWeight - rounds[0].leftLeafWeightGBM, 4)}</td>
                      <td style={{ padding: "5px 10px", fontSize: 12, color: "var(--muted)" }}>XGB more conservative</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "5px 10px", fontWeight: 600 }}>Right</td>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(rounds[0].rightLeafWeightGBM, 4)}</td>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: 700 }}>{fmt(rounds[0].rightLeafWeight, 4)}</td>
                      <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "#e0492e" }}>{fmt(rounds[0].rightLeafWeight - rounds[0].rightLeafWeightGBM, 4)}</td>
                      <td style={{ padding: "5px 10px", fontSize: 12, color: "var(--muted)" }}>XGB more conservative</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="tf-subhead" style={{ marginTop: 16 }}>Final predictions — all 6 houses</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", maxWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["house", "age", "true price", "GBM pred (η×GBM leaves)", "XGB pred", "XGB error"].map(h => (
                    <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {XGB.xs.map((x, i) => {
                  const xgbPred = rounds.length > 0 ? rounds[rounds.length - 1].predictions[i] : trace.F0;
                  // Reconstruct GBM predictions manually: eta × gbm leaf each round
                  let gbmPred = trace.F0;
                  for (const r of rounds) {
                    const isLeft = r.leftIndices.includes(i);
                    gbmPred += trace.cfg.eta * (isLeft ? r.leftLeafWeightGBM : r.rightLeafWeightGBM);
                  }
                  const xgbErr = xgbPred - XGB.ys[i];
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "4px 8px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{i + 1}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{x}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: 600 }}>{XGB.ys[i]}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(gbmPred, 4)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: 700 }}>{fmt(xgbPred, 4)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: Math.abs(xgbErr) < 0.2 ? "#1f9e6b" : "#e0492e" }}>{fmt(xgbErr, 4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tf-subhead" style={{ marginTop: 16 }}>4 reasons XGBoost usually wins</div>
          <div className="tf-legend">
            {[
              ["1. Regularization", "λ (L2), α (L1), γ prevent overfitting. GBM has no built-in regularization — you must rely on low learning rate and early stopping alone."],
              ["2. Second-order gradients", "Newton's method step sizes are better calibrated than plain gradient descent. Fewer rounds needed for the same convergence. Benefits most on non-MSE losses."],
              ["3. Missing values", "Learned optimal direction per split. No imputation required. Real data almost always has missing values — this is a significant practical advantage."],
              ["4. Parallel feature evaluation", "XGBoost evaluates all feature splits in parallel across CPU threads. Much faster than serial GBM on large datasets with many features."],
            ].map(([name, desc]) => (
              <div className="tf-leg" key={name}>
                <div className="tf-leg-name">{name}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>

          <Note>
            For this 6-point, 1-feature toy dataset the GBM and XGBoost predictions are nearly
            identical. XGBoost's advantage is most visible on: (1) noisy data where regularization
            prevents memorizing noise, (2) high-dimensional data where column subsampling helps,
            and (3) data with missing values.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 12: Hyperparameters & When to Use
  // ────────────────────────────────────────────────────────
  const stageHyperparams = {
    id: "hyperparams", group: "Practical", title: "Hyperparameters & when to use XGBoost",
    map: "Hyperparams",
    why: "Knowing WHEN to use XGBoost and which hyperparameters matter most saves hours of tuning. The rough rule: structured tabular data → XGBoost. Unstructured data → neural networks.",
    render: () => (
      <>
        <Lead>
          XGBoost has many hyperparameters, but in practice only 4–6 matter for most problems.
          The defaults are carefully chosen — start with them and tune via cross-validation.
          The most impactful parameters are <b>n_estimators</b> (trees), <b>eta</b> (learning rate),
          <b> max_depth</b>, and <b>lambda</b> (L2 regularization). The others provide additional
          control but rarely dominate.
        </Lead>

        <div className="tf-subhead" style={{ marginTop: 14 }}>Key hyperparameters</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", minWidth: 540 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                {["parameter", "default", "effect", "tune?"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["n_estimators", "100", "Number of trees. More = lower bias, higher variance, slower.", "Yes — with early stopping"],
                ["eta (learning rate)", "0.3", "Shrinks each tree's contribution. Lower = better generalization, needs more trees.", "Yes — key parameter"],
                ["max_depth", "6", "Maximum tree depth. Deeper = more expressive, more overfit.", "Yes — 3-8 typical"],
                ["lambda (L2)", "1.0", "Shrinks leaf weights. Increase if overfitting.", "Yes — tune from 0.5 to 5"],
                ["alpha (L1)", "0.0", "Can set leaf weights to 0. Useful for sparse data.", "Sometimes"],
                ["gamma", "0.0", "Min gain to accept a split. Prunes weak splits.", "Sometimes — 0 to 2"],
                ["subsample", "1.0", "Row subsampling fraction per tree. Adds randomness.", "Often — 0.7-0.9"],
                ["colsample_bytree", "1.0", "Feature subsampling fraction per tree.", "Often with many features"],
                ["min_child_weight", "1", "Min ΣH in a leaf. Prevents tiny overfit leaves.", "Sometimes"],
              ].map(([p, d, e, t]) => (
                <tr key={p} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontSize: 12, color: "var(--accent-ink)", fontWeight: 600 }}>{p}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "var(--muted)" }}>{d}</td>
                  <td style={{ padding: "5px 10px", fontSize: 12, color: "var(--ink)" }}>{e}</td>
                  <td style={{ padding: "5px 10px", fontSize: 12, color: t.startsWith("Yes") ? "#1f9e6b" : "var(--muted)", fontWeight: t.startsWith("Yes") ? 600 : 400 }}>{t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tf-subhead" style={{ marginTop: 20 }}>XGBoost vs other algorithms</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 10 }}>
          {[
            {
              title: "XGBoost vs GBM",
              color: "#94A2BC",
              items: ["Use XGBoost: almost always", "GBM simpler to understand", "XGBoost: regularization, missing values", "GBM: when you want transparent residuals"]
            },
            {
              title: "XGBoost vs Random Forest",
              color: "#f59e0b",
              items: ["XGBoost usually better on tabular", "RF simpler, less tuning", "RF parallelizes across trees natively", "XGBoost: when you need top accuracy"]
            },
            {
              title: "XGBoost vs Neural Nets",
              color: "#7c5cff",
              items: ["XGBoost wins: structured tabular data", "NNs win: images, text, audio", "XGBoost: faster to train, more interpretable", "NNs: can learn from raw features"]
            },
          ].map(({ title, color, items }) => (
            <div key={title} style={{ background: `${color}12`, borderRadius: 10, padding: "12px 14px", border: `1px solid ${color}30` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 8 }}>{title}</div>
              <ul style={{ fontSize: 12, color: "var(--ink)", margin: 0, padding: "0 0 0 14px", lineHeight: 1.8 }}>
                {items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(43,91,255,.07)", borderRadius: 10, padding: "14px 16px", marginTop: 16, border: "1.5px solid rgba(43,91,255,.2)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 8 }}>The rough rule</div>
          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.8 }}>
            <b>Structured tabular data</b> (CSVs, databases, feature-engineered inputs) →
            try XGBoost (or LightGBM) first. It will usually beat everything else with reasonable tuning.<br /><br />
            <b>Unstructured data</b> (images, text, audio, raw sequences) →
            neural networks. XGBoost cannot learn feature representations from pixels or tokens.<br /><br />
            <b>When in doubt</b>: run a quick XGBoost baseline (default params, 100 trees, eta=0.1).
            If it's not competitive in 10 minutes, consider a neural network. If it is, tune it.
          </div>
        </div>

        <Note>
          XGBoost, LightGBM, and CatBoost are all variations on gradient boosting with second-order
          gradients. LightGBM is often faster on large datasets (grows trees leaf-wise, not level-wise).
          CatBoost handles categorical features natively without encoding. For most tabular problems,
          the three are interchangeable; XGBoost is most widely understood and documented.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE REGISTRY
  // ────────────────────────────────────────────────────────
  const STAGES = [
    stageOverview,
    stageDataset,
    stageGradients,
    stageSimilarity,
    stageLeafWeights,
    stageRound1,
    stageRegularization,
    stageMissing,
    stageColsample,
    stageRounds23,
    stageComparison,
    stageHyperparams,
  ];

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "XGBoost",
    subtitle: "extreme gradient boosting — how it improves on vanilla GBM",
    cur: "XGBoost",
    category: "Classification & Regression",
    run: (input) => window.ML_XGB.runXGB(input),
    default: { eta: 0.3, lambda: 1.0, gamma: 0.0, nTrees: 3 },
    renderInput,
    modeLinks: [
      { label: "GBM Regression", href: "Gradient Boosting (Regression).html", active: false },
      { label: "GBM Classification", href: "Gradient Boosting (Classification).html", active: false },
      { label: "XGBoost", href: "XGBoost.html", active: true },
    ],
  };
})();
