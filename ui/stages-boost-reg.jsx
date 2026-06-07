/* ============================================================
   Gradient Boosting — Regression stages (10 stages)
   Requires: window.ML_BOOST (from model/ml-boosting.js)
             window.{ Matrix, V, Sub, Sup, Formula, Lead, Note,
                      Row, Arrow, Tag, fmt } (from matrix.jsx)
   ============================================================ */
(function () {
  const { V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState, useRef, useEffect } = React;
  const { BOOST_REG, runBoostReg } = window.ML_BOOST;

  // ── SVG chart dimensions ──
  const W = 460, H = 240;
  const PAD = { l: 50, r: 20, t: 18, b: 38 };
  const xMin = 0, xMax = 46, yMin = 0, yMax = 10;

  const sx = v => PAD.l + ((v - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const sy = v => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  // ── scatter axes ──
  function ScatterAxes({ xLabel = "age (years)", yLabel = "price ($100k)" }) {
    const xTicks = [0, 10, 20, 30, 40];
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

  // ── data points ──
  const PT_COLOR = "#2B5BFF";
  function DataDots({ queryX }) {
    return (
      <>
        {BOOST_REG.xs.map((x, i) => (
          <circle key={i} cx={sx(x)} cy={sy(BOOST_REG.ys[i])} r="5"
            fill={PT_COLOR} opacity="0.85" stroke="white" strokeWidth="1.2" />
        ))}
        {queryX !== undefined && (
          <g>
            <circle cx={sx(queryX)} cy={H - PAD.b} r="6" fill="none" stroke="#e0492e" strokeWidth="2" strokeDasharray="3 2" />
            <circle cx={sx(queryX)} cy={H - PAD.b} r="3" fill="#e0492e" />
            <line x1={sx(queryX)} y1={PAD.t} x2={sx(queryX)} y2={H - PAD.b}
              stroke="#e0492e" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
            <text x={sx(queryX) + 8} y={PAD.t + 12} fontSize="11" fill="#e0492e" fontWeight="600">age={queryX}</text>
          </g>
        )}
      </>
    );
  }

  // ── step-function prediction line ──
  function StepLine({ preds, color = "var(--accent)", strokeWidth = 2.5 }) {
    const sorted = BOOST_REG.xs.map((x, i) => ({ x, p: preds[i] })).sort((a, b) => a.x - b.x);
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

  // ── residual bars ──
  function ResidualBars({ residuals, preds }) {
    return (
      <>
        {BOOST_REG.xs.map((x, i) => {
          const r = residuals[i];
          const baseY = preds ? sy(preds[i]) : sy(BOOST_REG.ys[i] - r);
          const tipY = preds ? sy(BOOST_REG.ys[i]) : sy(BOOST_REG.ys[i]);
          const col = r >= 0 ? "#1f9e6b" : "#e0492e";
          return (
            <line key={i} x1={sx(x)} y1={baseY} x2={sx(x)} y2={tipY}
              stroke={col} strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
          );
        })}
      </>
    );
  }

  // ── MSE progress bars ──
  function MSEBars({ rounds }) {
    const maxMSE = rounds[0].mse;
    return (
      <div style={{ margin: "12px 0" }}>
        {rounds.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)", width: 72, flexShrink: 0 }}>
              {i === 0 ? "Init (F₀)" : `After T${i}`}
            </span>
            <div style={{ flex: 1, background: "var(--line-soft)", borderRadius: 4, height: 14, overflow: "hidden", maxWidth: 280 }}>
              <div style={{
                height: "100%", borderRadius: 4,
                width: `${(r.mse / maxMSE) * 100}%`,
                background: i === 0 ? "#e0492e" : `hsl(${140 + i * 30}, 60%, 42%)`,
                transition: "width 0.4s ease"
              }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: "var(--num-font)", color: "var(--ink)", width: 58, flexShrink: 0 }}>
              {r.mse.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── decision stump SVG ──
  function StumpSvg({ stump, label }) {
    const W2 = 260, H2 = 140;
    const midX = W2 / 2;
    const rootY = 32, childY = 100;
    const leftX = 60, rightX = W2 - 60;
    return (
      <svg width={W2} height={H2} style={{ overflow: "visible" }}>
        <line x1={midX} y1={rootY + 16} x2={leftX} y2={childY - 16} stroke="var(--line)" strokeWidth="1.5" />
        <line x1={midX} y1={rootY + 16} x2={rightX} y2={childY - 16} stroke="var(--line)" strokeWidth="1.5" />
        <text x={(midX + leftX) / 2 - 12} y={(rootY + childY) / 2 + 2} fontSize="10" fill="var(--muted)" fontStyle="italic">yes</text>
        <text x={(midX + rightX) / 2 + 8} y={(rootY + childY) / 2 + 2} fontSize="10" fill="var(--muted)" fontStyle="italic">no</text>
        <rect x={midX - 68} y={rootY - 16} width={136} height={32} rx="8"
          fill="var(--panel-solid)" stroke="var(--accent)" strokeWidth="2" />
        <text x={midX} y={rootY + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">
          age ≤ {stump.threshold}?
        </text>
        <rect x={leftX - 38} y={childY - 16} width={76} height={32} rx="8"
          fill={stump.leftVal >= 0 ? "rgba(31,158,107,.15)" : "rgba(224,73,46,.12)"}
          stroke={stump.leftVal >= 0 ? "#1f9e6b" : "#e0492e"} strokeWidth="1.5" />
        <text x={leftX} y={childY - 1} textAnchor="middle" fontSize="11" fontWeight="700"
          fill={stump.leftVal >= 0 ? "#1f9e6b" : "#e0492e"}>
          {fmt(stump.leftVal, 3)}
        </text>
        <text x={leftX} y={childY + 12} textAnchor="middle" fontSize="9" fill="var(--muted)">age ≤ {stump.threshold}</text>
        <rect x={rightX - 38} y={childY - 16} width={76} height={32} rx="8"
          fill={stump.rightVal >= 0 ? "rgba(31,158,107,.15)" : "rgba(224,73,46,.12)"}
          stroke={stump.rightVal >= 0 ? "#1f9e6b" : "#e0492e"} strokeWidth="1.5" />
        <text x={rightX} y={childY - 1} textAnchor="middle" fontSize="11" fontWeight="700"
          fill={stump.rightVal >= 0 ? "#1f9e6b" : "#e0492e"}>
          {fmt(stump.rightVal, 3)}
        </text>
        <text x={rightX} y={childY + 12} textAnchor="middle" fontSize="9" fill="var(--muted)">age &gt; {stump.threshold}</text>
        {label && <text x={midX} y={H2 - 2} textAnchor="middle" fontSize="10" fill="var(--faint)">{label}</text>}
      </svg>
    );
  }

  // ── color palette for multi-round lines ──
  const ROUND_COLORS = ["#94A2BC", "#f59e0b", "#2B5BFF"];

  // ── small inline chart legend ──
  function LineLegend({ items }) {
    return (
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--muted)", margin: "6px 0 10px", flexWrap: "wrap" }}>
        {items.map(([col, label]) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 18, height: 2.5, background: col, display: "inline-block", borderRadius: 2 }} />
            {label}
          </span>
        ))}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 1: Overview
  // ────────────────────────────────────────────────────────
  const stageOverview = {
    id: "overview", group: "Overview", title: "Gradient Boosting — sequential ensemble learning",
    map: "Overview",
    why: "Boosting is fundamentally different from bagging (Random Forest). Random Forest builds trees in parallel and averages them. Boosting builds trees one at a time, each correcting the errors of all previous trees.",
    render: () => (
      <>
        <Lead>
          <b>Gradient Boosting</b> is best understood through an analogy: imagine a student
          who takes a practice test, then only studies the questions they got wrong. The next
          practice test, they again focus exclusively on their new mistakes. Round after round,
          they zero in on their weak spots. That is exactly how gradient boosting works — each
          new tree studies only what the current ensemble got wrong.
        </Lead>
        <Lead>
          This is the key difference from <b>Random Forest</b>. Random Forest grows hundreds
          of trees <em>independently and in parallel</em>, then averages their votes. Each tree
          is equally ignorant of the others. Gradient Boosting grows trees <em>sequentially</em>:
          Tree 2 cannot start until Tree 1 has made predictions, because Tree 2 must fit the
          <b> residuals</b> (errors) left behind by Tree 1. This sequential dependency is what
          makes boosting so powerful — and why it is harder to parallelize than Random Forest.
        </Lead>

        <div style={{ margin: "18px 0 10px" }}>
          <div className="tf-subhead">Sequential boosting pipeline</div>
          <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", margin: "10px 0" }}>
            {[
              { label: "F₀ = mean(y)", sub: "initial pred", color: "#94A2BC" },
              null,
              { label: "residuals", sub: "r = y − F₀", color: "#f59e0b" },
              null,
              { label: "Tree 1", sub: "fit residuals", color: "#2B5BFF" },
              null,
              { label: "F₁ = F₀ + η·T₁", sub: "update", color: "#7c5cff" },
              null,
              { label: "new residuals", sub: "r = y − F₁", color: "#f59e0b" },
              null,
              { label: "Tree 2 …", sub: "fit new resid.", color: "#2B5BFF" },
              null,
              { label: "F = Σ η·Tₜ", sub: "final ensemble", color: "#1f9e6b" },
            ].map((item, i) =>
              item === null ? (
                <div key={i} style={{ fontSize: 18, color: "var(--faint)", padding: "0 3px" }}>→</div>
              ) : (
                <div key={i} style={{
                  padding: "7px 10px", borderRadius: 8, textAlign: "center", minWidth: 80,
                  background: item.color === "var(--muted)" ? "transparent" : `${item.color}18`,
                  border: `1.5px solid ${item.color + "44"}`,
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
            ["Weak learner", "A shallow decision tree — often just one split (a 'stump'). It is deliberately simple so that it only corrects one pattern at a time, leaving room for future trees."],
            ["Residual", "The error left by the current ensemble: rᵢ = yᵢ − F(xᵢ). Positive residual = we under-predicted. Negative = we over-predicted. The next tree fits these residuals directly."],
            ["Additive model", "F(x) = F₀ + η·T₁(x) + η·T₂(x) + … We keep adding trees. Each adds a small correction. The final answer is the sum of all corrections."],
            ["Learning rate η", "A number between 0 and 1 (e.g. 0.5). We multiply each tree's output by η before adding it. This 'shrinkage' prevents any single tree from dominating and overfitting."],
            ["Ensemble", "The combined model — all trees together. One stump is weak. 100 stumps, each correcting the last, can be extremely powerful."],
          ].map(([name, desc]) => (
            <div className="tf-leg" key={name}>
              <div className="tf-leg-name">{name}</div>
              <div className="tf-leg-desc">{desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          <div style={{ background: "var(--accent-soft)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>Gradient Boosting</div>
            <ul style={{ fontSize: 13, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.75 }}>
              <li>Trees built <b>sequentially</b></li>
              <li>Each tree fits the <b>residuals</b> of all previous trees</li>
              <li>Output = sum of all tree predictions × η</li>
              <li>Must tune learning rate and number of trees</li>
              <li>Prone to overfitting without regularization</li>
            </ul>
          </div>
          <div style={{ background: "rgba(31,158,107,.08)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1f9e6b", marginBottom: 6 }}>Random Forest (comparison)</div>
            <ul style={{ fontSize: 13, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.75 }}>
              <li>Trees built <b>in parallel</b>, independently</li>
              <li>Each tree trained on a <b>bootstrap sample</b></li>
              <li>Diversity from random feature subsets</li>
              <li>Final prediction = average of all trees</li>
              <li>Naturally resistant to overfitting</li>
            </ul>
          </div>
        </div>

        <Note>
          The "gradient" in Gradient Boosting comes from the fact that fitting residuals is
          equivalent to following the <b>negative gradient of the MSE loss</b>. This means
          the framework generalizes to any differentiable loss — just swap out the loss function
          (as we do in the Classification variant using log-loss).
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 2: Dataset
  // ────────────────────────────────────────────────────────
  const stageDataset = {
    id: "dataset", group: "Data", title: "Dataset — house age vs. price",
    map: "Dataset",
    why: "With 8 points and one feature, we can visualize every boosting step in detail. Real boosting datasets have thousands of rows and dozens of features — the math is identical.",
    render: (trace) => (
      <>
        <Lead>
          Our toy dataset contains <b>8 houses</b>. Each house has one feature: its <b>age in years</b>.
          The target we want to predict is <b>price in $100k</b>. Older houses tend to be cheaper —
          there is a clear downward trend. With just one feature, we can draw every step of
          the boosting process on a simple 2D chart.
        </Lead>
        <Lead>
          This is a <b>regression</b> problem: we want to predict a continuous number (price),
          not a category. Gradient boosting for regression uses <b>Mean Squared Error (MSE)</b>
          as its loss function. We will watch the MSE shrink with each additional tree.
          The query age (red dashed line) is controlled by the slider — try different ages to
          see how the ensemble's prediction changes.
        </Lead>

        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
          <ScatterAxes />
          <DataDots queryX={trace.input.x} />
        </svg>

        <div className="tf-subhead" style={{ marginTop: 12 }}>Training data</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", maxWidth: 380 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                {["#", "age (years)", "price ($100k)", "trend"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BOOST_REG.xs.map((x, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "5px 10px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{i + 1}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{x}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: 600 }}>{BOOST_REG.ys[i]}</td>
                  <td style={{ padding: "5px 10px", fontSize: 12, color: "var(--muted)" }}>
                    {BOOST_REG.ys[i] > 5 ? "expensive (young)" : "cheap (old)"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="nn-calc" style={{ marginTop: 12 }}>
          <div className="nn-calc-h">Quick statistics</div>
          <div className="nn-calc-row">
            mean age = {fmt(BOOST_REG.xs.reduce((a, b) => a + b, 0) / BOOST_REG.xs.length, 1)} years
          </div>
          <div className="nn-calc-row">
            mean price = {fmt(BOOST_REG.ys.reduce((a, b) => a + b, 0) / BOOST_REG.ys.length, 3)} $100k — this is our starting prediction (F₀)
          </div>
          <div className="nn-calc-row">
            price range: {Math.min(...BOOST_REG.ys)} – {Math.max(...BOOST_REG.ys)} $100k
          </div>
        </div>

        <Note>
          Goal: predict price for a house of <b>age = {trace.input.x}</b> years.
          Before any tree, the best constant prediction is the mean price.
          The boosting rounds will progressively refine this.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 3: Initial Prediction (Step 0)
  // ────────────────────────────────────────────────────────
  const stageInit = {
    id: "init", group: "Boosting", title: "Step 0 — initial prediction: the mean",
    map: "Init pred",
    why: "Before any tree, predict the global mean of y. This is the constant that minimizes MSE over the training set. All residuals measure how far this constant is from each true value.",
    render: (trace) => {
      const r0 = trace.rounds[0];
      const initP = trace.initPred;
      const ySum = BOOST_REG.ys.reduce((a, b) => a + b, 0);
      return (
        <>
          <Lead>
            Before we build a single tree, we need a <b>starting prediction</b>.
            The best constant prediction that minimizes MSE is the <b>mean of all y-values</b>.
            So F₀(x) = ȳ for every single training point, regardless of age. The prediction
            is a perfectly horizontal line — it ignores all feature information entirely.
          </Lead>
          <Lead>
            Once we have F₀, we compute the <b>residuals</b>: rᵢ = yᵢ − F₀(xᵢ).
            A positive residual means we under-predicted (actual price was higher than the mean).
            A negative residual means we over-predicted (actual price was lower than the mean).
            These residuals are exactly what Tree 1 will try to learn.
          </Lead>

          <Formula label="F₀(x)">
            F₀(x) = mean(y) = ({BOOST_REG.ys.join(" + ")}) / {BOOST_REG.ys.length} = {fmt(ySum, 1)} / {BOOST_REG.ys.length} = <b>{fmt(initP, 3)}</b>
          </Formula>

          <div className="tf-subhead">Initial prediction (flat line) and residuals</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
            <ScatterAxes />
            <line x1={PAD.l} y1={sy(initP)} x2={W - PAD.r} y2={sy(initP)}
              stroke="#94A2BC" strokeWidth="2.5" strokeDasharray="7 4" opacity="0.85" />
            <text x={W - PAD.r - 4} y={sy(initP) - 6} textAnchor="end" fontSize="10" fill="#94A2BC" fontWeight="600">
              F₀ = {fmt(initP, 2)}
            </text>
            {BOOST_REG.xs.map((x, i) => (
              <line key={i}
                x1={sx(x)} y1={sy(initP)} x2={sx(x)} y2={sy(BOOST_REG.ys[i])}
                stroke={BOOST_REG.ys[i] > initP ? "#1f9e6b" : "#e0492e"}
                strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
            ))}
            <DataDots queryX={trace.input.x} />
          </svg>
          <LineLegend items={[["#94A2BC", "F₀ = mean(y)"], ["#1f9e6b", "positive residual (under-predicted)"], ["#e0492e", "negative residual (over-predicted)"]]} />

          <div className="tf-subhead">Initial residuals table</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["age", "true y", "F₀ = mean", "residual r = y − F₀", "interpretation"].map(h => (
                    <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BOOST_REG.xs.map((x, i) => {
                  const r = r0.residuals[i];
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{x}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{BOOST_REG.ys[i]}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(initP, 3)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: 700,
                        color: r >= 0 ? "#1f9e6b" : "#e0492e" }}>
                        {fmt(r, 3)}
                      </td>
                      <td style={{ padding: "4px 8px", fontSize: 11, color: "var(--muted)" }}>
                        {r > 0.5 ? "much too low" : r < -0.5 ? "much too high" : "close"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="nn-calc" style={{ marginTop: 10 }}>
            <div className="nn-calc-h">Initial MSE — before any tree</div>
            <div className="nn-calc-row">
              MSE = (1/n) Σ(yᵢ − F₀)² = (1/{BOOST_REG.ys.length}) Σ rᵢ² = <b>{fmt(r0.mse, 4)}</b>
            </div>
            <div className="nn-calc-row" style={{ color: "var(--muted)", fontSize: 11 }}>
              This is our baseline. We must reduce this with each boosting round.
            </div>
          </div>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 4: Round 1 — First Stump
  // ────────────────────────────────────────────────────────
  const stageTree1 = {
    id: "tree1", group: "Boosting", title: "Round 1 — first stump fits the residuals",
    map: "Round 1",
    why: "Tree 1 is NOT trained on the original y-values. It is trained on the residuals r = y − F₀. This is the central mechanic of gradient boosting.",
    render: (trace) => {
      const stump = BOOST_REG.stumps[0];
      const r0 = trace.rounds[0];
      const r1 = trace.rounds[Math.min(1, trace.rounds.length - 1)];
      const eta = BOOST_REG.eta;

      const leftResids = r0.residuals.filter((_, i) => BOOST_REG.xs[i] <= stump.threshold);
      const rightResids = r0.residuals.filter((_, i) => BOOST_REG.xs[i] > stump.threshold);
      const leftAvg = leftResids.reduce((a, b) => a + b, 0) / leftResids.length;
      const rightAvg = rightResids.reduce((a, b) => a + b, 0) / rightResids.length;

      return (
        <>
          <Lead>
            Tree 1 is a <b>decision stump</b> — a tree with exactly one split (depth = 1).
            It is trained on the <em>residuals</em> from Step 0, not on the original prices.
            Think of it as asking: "Given a house's age, what correction do we need to make
            to our current prediction?" The best single split is at <b>age = 16</b>:
            young houses need a positive correction (we're predicting too low) and old
            houses need a negative correction (we're predicting too high).
          </Lead>
          <Lead>
            Each leaf value is the <b>mean of the residuals</b> in that leaf. This is the optimal
            constant prediction for that leaf under MSE loss. After finding Tree 1, we update:
            <b> F₁(x) = F₀(x) + η × T₁(x)</b>. The learning rate η = {eta} shrinks the
            correction so we don't overshoot.
          </Lead>

          <Row>
            <div>
              <div className="tf-subhead">Stump 1 structure</div>
              <StumpSvg stump={stump} label="trained on residuals r₀" />
            </div>
            <div>
              <div className="tf-subhead">Leaf value calculation</div>
              <div className="nn-calc" style={{ minWidth: 230 }}>
                <div className="nn-calc-h">Left leaf: age ≤ {stump.threshold} (n={leftResids.length})</div>
                <div className="nn-calc-row" style={{ fontSize: 11 }}>
                  residuals: [{leftResids.map(r => fmt(r, 2)).join(", ")}]
                </div>
                <div className="nn-calc-row">
                  avg = {fmt(leftAvg, 3)} ≈ <b style={{ color: "#1f9e6b" }}>{fmt(stump.leftVal, 3)}</b>
                </div>
                <div className="nn-calc-h" style={{ marginTop: 8 }}>Right leaf: age > {stump.threshold} (n={rightResids.length})</div>
                <div className="nn-calc-row" style={{ fontSize: 11 }}>
                  residuals: [{rightResids.map(r => fmt(r, 2)).join(", ")}]
                </div>
                <div className="nn-calc-row">
                  avg = {fmt(rightAvg, 3)} ≈ <b style={{ color: "#e0492e" }}>{fmt(stump.rightVal, 3)}</b>
                </div>
              </div>
            </div>
          </Row>

          <div className="tf-subhead" style={{ marginTop: 10 }}>Prediction after update: F₁ = F₀ + η·T₁</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
            <ScatterAxes />
            <line x1={PAD.l} y1={sy(trace.initPred)} x2={W - PAD.r} y2={sy(trace.initPred)}
              stroke="#94A2BC" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.55" />
            <text x={PAD.l + 4} y={sy(trace.initPred) - 5} fontSize="9" fill="#94A2BC" opacity="0.7">F₀</text>
            <StepLine preds={r1.preds} color="#f59e0b" />
            <ResidualBars residuals={r1.residuals} preds={r1.preds} />
            <DataDots queryX={trace.input.x} />
          </svg>
          <LineLegend items={[["#94A2BC", "F₀ (baseline mean)"], ["#f59e0b", "F₁ after T1"]]} />

          <div className="tf-subhead">Per-point update table</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["age", "true y", "F₀", "T₁(x)", "η·T₁", "F₁ = F₀+η·T₁", "new resid."].map(h => (
                    <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BOOST_REG.xs.map((x, i) => {
                  const t1 = x <= stump.threshold ? stump.leftVal : stump.rightVal;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{x}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{BOOST_REG.ys[i]}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(trace.initPred, 3)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: t1 >= 0 ? "#1f9e6b" : "#e0492e" }}>{fmt(t1, 3)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{fmt(eta * t1, 3)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#f59e0b", fontWeight: 600 }}>{fmt(r1.preds[i], 3)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: 700,
                        color: r1.residuals[i] >= 0 ? "#1f9e6b" : "#e0492e", fontSize: 11 }}>
                        {fmt(r1.residuals[i], 3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <MSEBars rounds={trace.rounds.slice(0, 2)} />
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 5: Round 2 — Second Stump
  // ────────────────────────────────────────────────────────
  const stageTree2 = {
    id: "tree2", group: "Boosting", title: "Round 2 — second stump on new residuals",
    map: "Round 2",
    why: "After round 1, the residuals are smaller but not zero. Tree 2 targets the remaining errors — the finer structure that Tree 1 missed. Residuals keep shrinking.",
    render: (trace) => {
      const stump2 = BOOST_REG.stumps[1];
      const r1 = trace.rounds[Math.min(1, trace.rounds.length - 1)];
      const r2 = trace.rounds[Math.min(2, trace.rounds.length - 1)];
      const eta = BOOST_REG.eta;

      const leftResids2 = r1.residuals.filter((_, i) => BOOST_REG.xs[i] <= stump2.threshold);
      const rightResids2 = r1.residuals.filter((_, i) => BOOST_REG.xs[i] > stump2.threshold);

      return (
        <>
          <Lead>
            After round 1, the residuals are smaller — the big error (young vs. old houses)
            has already been corrected. Now Tree 2 focuses on the <em>remaining</em> errors.
            It finds a different split: <b>age ≤ 10</b>. Very young houses (age ≤ 10) still have
            a small positive residual; the rest have a small negative residual. The leaf values
            are much smaller than before — we're making finer corrections.
          </Lead>
          <Lead>
            This is exactly the "studying your wrong answers" analogy. After round 1 you
            got most questions right. Round 2 focuses only on the ones you still missed.
            The corrections get smaller and smaller as the model converges.
          </Lead>

          <Row>
            <div>
              <div className="tf-subhead">Stump 2 structure</div>
              <StumpSvg stump={stump2} label="trained on residuals r₁" />
            </div>
            <div>
              <div className="tf-subhead">Residuals after F₁ (smaller!)</div>
              <div className="nn-calc" style={{ minWidth: 230 }}>
                <div className="nn-calc-h">Left leaf: age ≤ {stump2.threshold} (n={leftResids2.length})</div>
                <div className="nn-calc-row" style={{ fontSize: 11 }}>
                  [{leftResids2.map(r => fmt(r, 2)).join(", ")}]
                </div>
                <div className="nn-calc-row">
                  avg ≈ <b style={{ color: stump2.leftVal >= 0 ? "#1f9e6b" : "#e0492e" }}>{fmt(stump2.leftVal, 3)}</b>
                </div>
                <div className="nn-calc-h" style={{ marginTop: 8 }}>Right leaf: age > {stump2.threshold} (n={rightResids2.length})</div>
                <div className="nn-calc-row" style={{ fontSize: 11 }}>
                  [{rightResids2.map(r => fmt(r, 2)).join(", ")}]
                </div>
                <div className="nn-calc-row">
                  avg ≈ <b style={{ color: stump2.rightVal >= 0 ? "#1f9e6b" : "#e0492e" }}>{fmt(stump2.rightVal, 3)}</b>
                </div>
              </div>
            </div>
          </Row>

          <div className="tf-subhead">Predictions after Trees 1 + 2</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
            <ScatterAxes />
            <StepLine preds={r1.preds} color="#f59e0b" strokeWidth={1.5} />
            <StepLine preds={r2.preds} color="#2B5BFF" strokeWidth={2.5} />
            <ResidualBars residuals={r2.residuals} preds={r2.preds} />
            <DataDots queryX={trace.input.x} />
          </svg>
          <LineLegend items={[["#f59e0b", "F₁ after T1"], ["#2B5BFF", "F₂ after T2 (new residuals shown)"]]} />

          <div className="tf-subhead">Residuals comparison: round 0 vs round 1 vs round 2</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["age", "true y", "F₀ resid.", "F₁ resid.", "F₂ resid.", "trend"].map(h => (
                    <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BOOST_REG.xs.map((x, i) => {
                  const r0resid = trace.rounds[0].residuals[i];
                  const r1resid = trace.rounds[Math.min(1, trace.rounds.length - 1)].residuals[i];
                  const r2resid = r2.residuals[i];
                  const shrinking = Math.abs(r2resid) < Math.abs(r1resid) && Math.abs(r1resid) < Math.abs(r0resid);
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{x}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{BOOST_REG.ys[i]}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "var(--muted)", fontSize: 11 }}>{fmt(r0resid, 3)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#f59e0b", fontSize: 11 }}>{fmt(r1resid, 3)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: 700,
                        color: Math.abs(r2resid) < 0.3 ? "#1f9e6b" : "#2B5BFF" }}>
                        {fmt(r2resid, 3)}
                      </td>
                      <td style={{ padding: "4px 8px", fontSize: 13 }}>{shrinking ? "↓ shrinking" : "→"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <MSEBars rounds={trace.rounds.slice(0, 3)} />
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 6: Round 3 — Third Stump + Residual Table
  // ────────────────────────────────────────────────────────
  const stageTree3 = {
    id: "tree3", group: "Boosting", title: "Round 3 — residuals shrink toward zero",
    map: "Round 3",
    why: "The third stump makes even finer corrections. The full residuals-per-round table shows the core idea: each round, the errors get smaller. This is gradient descent on the loss.",
    render: (trace) => {
      const stump3 = BOOST_REG.stumps[2];
      const r2 = trace.rounds[Math.min(2, trace.rounds.length - 1)];
      const r3 = trace.rounds[Math.min(3, trace.rounds.length - 1)];

      return (
        <>
          <Lead>
            Round 3 makes even smaller corrections. The split is at <b>age = 30</b>, with leaf
            values of ±{fmt(Math.abs(stump3.leftVal), 3)} — much smaller than Tree 1's ±{fmt(Math.abs(BOOST_REG.stumps[0].leftVal), 3)}.
            This pattern always holds: early trees make big corrections, later trees fine-tune.
            It is gradient descent in function space — each step is smaller than the last.
          </Lead>
          <Lead>
            The table below is the heart of gradient boosting. Read each row left to right:
            you can see the prediction improving after each tree, and the residual column shrinking.
            Eventually (with enough trees and a small enough η), all residuals converge to near-zero.
          </Lead>

          <Row>
            <div>
              <div className="tf-subhead">Stump 3 structure</div>
              <StumpSvg stump={stump3} label="trained on residuals r₂" />
            </div>
            <div>
              <div className="tf-subhead">Leaf values getting smaller</div>
              <div className="nn-calc" style={{ minWidth: 230 }}>
                {[0, 1, 2].map(t => {
                  const s = BOOST_REG.stumps[t];
                  return (
                    <div key={t}>
                      <div className="nn-calc-h" style={t > 0 ? { marginTop: 6 } : {}}>Tree {t + 1} leaves</div>
                      <div className="nn-calc-row" style={{ fontSize: 11 }}>
                        left: <b style={{ color: s.leftVal >= 0 ? "#1f9e6b" : "#e0492e" }}>{fmt(s.leftVal, 3)}</b>
                          right: <b style={{ color: s.rightVal >= 0 ? "#1f9e6b" : "#e0492e" }}>{fmt(s.rightVal, 3)}</b>
                          <span style={{ color: "var(--muted)" }}>(magnitude ~{fmt(Math.max(Math.abs(s.leftVal), Math.abs(s.rightVal)), 2)})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Row>

          <div className="tf-subhead" style={{ marginTop: 12 }}>Full residuals-per-round table (watch them shrink)</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 11.5, width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>age</th>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>true y</th>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "#94A2BC", fontWeight: 600 }}>F₀ pred</th>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "#94A2BC", fontWeight: 600 }}>resid₀</th>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "#f59e0b", fontWeight: 600 }}>F₁ pred</th>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "#f59e0b", fontWeight: 600 }}>resid₁</th>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "#2B5BFF", fontWeight: 600 }}>F₂ pred</th>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "#2B5BFF", fontWeight: 600 }}>resid₂</th>
                  {trace.rounds.length > 3 && <th style={{ padding: "5px 8px", textAlign: "left", color: "#1f9e6b", fontWeight: 600 }}>F₃ pred</th>}
                  {trace.rounds.length > 3 && <th style={{ padding: "5px 8px", textAlign: "left", color: "#1f9e6b", fontWeight: 600 }}>resid₃</th>}
                </tr>
              </thead>
              <tbody>
                {BOOST_REG.xs.map((x, i) => {
                  const rds = trace.rounds;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{x}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: 600 }}>{BOOST_REG.ys[i]}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(rds[0].preds[i], 3)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#94A2BC", fontSize: 11 }}>{fmt(rds[0].residuals[i], 3)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#f59e0b" }}>{rds.length > 1 ? fmt(rds[1].preds[i], 3) : "—"}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#f59e0b", fontSize: 11 }}>{rds.length > 1 ? fmt(rds[1].residuals[i], 3) : "—"}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#2B5BFF" }}>{rds.length > 2 ? fmt(rds[2].preds[i], 3) : "—"}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#2B5BFF", fontSize: 11 }}>{rds.length > 2 ? fmt(rds[2].residuals[i], 3) : "—"}</td>
                      {rds.length > 3 && <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#1f9e6b" }}>{fmt(rds[3].preds[i], 3)}</td>}
                      {rds.length > 3 && <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#1f9e6b", fontSize: 11 }}>{fmt(rds[3].residuals[i], 3)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tf-subhead" style={{ marginTop: 10 }}>MSE reduction across all rounds</div>
          <MSEBars rounds={trace.rounds} />
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 6c: Sequential Trees — Full Structure
  // ────────────────────────────────────────────────────────

  function SeqTreesSVG() {
    // ── Actual values from BOOST_REG / ml-boosting.js ──
    // η = 0.5, initPred = 4.8625
    // Stump 1: age ≤ 16, left=+1.95, right=-2.425  → after: MSE 5.4998→1.9251
    // Stump 2: age ≤ 10, left=+0.425, right=-0.475  → after: MSE 1.9251→1.4726
    // Stump 3: age ≤ 30, left=+0.12, right=-0.38   → after: MSE 1.4726→1.2852
    //
    // Training points:
    // xs=[5,7,10,12,20,28,35,42], ys=[8.2,7.5,6.8,5.7,3.8,2.9,2.2,1.8]
    // Residuals after F0 (=4.8625):
    //   [3.3375,2.6375,1.9375,0.8375,-1.0625,-1.9625,-2.6625,-3.0625]
    // Residuals after T1:
    //   [2.3625,1.6625,0.9625,-0.1375,0.15,-0.75,-1.45,-1.85]
    // Residuals after T2:
    //   [2.15,1.45,0.75,0.1,0.3875,-0.5125,-1.2125,-1.6125]
    // Residuals after T3:
    //   [2.09,1.39,0.69,0.04,0.3275,-0.5725,-1.0225,-1.4225]

    const SVG_W = 860, SVG_H = 720;
    // Section Y positions
    const T1_Y = 30;     // Tree 1 section top
    const R1_Y = 195;    // Residual band 1 top
    const T2_Y = 265;    // Tree 2 section top
    const R2_Y = 430;    // Residual band 2 top
    const T3_Y = 500;    // Tree 3 section top
    const FIN_Y = 668;   // Final formula

    const TREE_COLORS = ["#2b5bff", "#e0851e", "#1f9e6b"];
    const TREE_BG     = ["rgba(43,91,255,.07)", "rgba(224,133,30,.07)", "rgba(31,158,107,.07)"];
    const TREE_LEAF   = ["rgba(43,91,255,.13)", "rgba(224,133,30,.13)", "rgba(31,158,107,.13)"];

    const xs   = [5,7,10,12,20,28,35,42];
    const ys   = [8.2,7.5,6.8,5.7,3.8,2.9,2.2,1.8];
    const initPred = 4.8625;
    const eta = 0.5;

    const resid0 = xs.map((_, i) => ys[i] - initPred);
    // After T1: preds += 0.5 * (age<=16 ? 1.95 : -2.425)
    const preds1 = xs.map((x, i) => initPred + eta * (x <= 16 ? 1.95 : -2.425));
    const resid1 = xs.map((x, i) => ys[i] - preds1[i]);
    // After T2: preds += 0.5 * (age<=10 ? 0.425 : -0.475)
    const preds2 = preds1.map((p, i) => p + eta * (xs[i] <= 10 ? 0.425 : -0.475));
    const resid2 = xs.map((x, i) => ys[i] - preds2[i]);
    // After T3: preds += 0.5 * (age<=30 ? 0.12 : -0.38)
    const preds3 = preds2.map((p, i) => p + eta * (xs[i] <= 30 ? 0.12 : -0.38));
    const resid3 = xs.map((x, i) => ys[i] - preds3[i]);

    // ── helper: draw a decision stump ──
    function Stump({ treeIdx, sectionY, stump }) {
      const col   = TREE_COLORS[treeIdx];
      const bg    = TREE_BG[treeIdx];
      const leafBg = TREE_LEAF[treeIdx];
      const STUMP_X = 30;
      const midX  = STUMP_X + 130;
      const rootY = sectionY + 44;
      const childY= sectionY + 120;
      const leftX = STUMP_X + 44;
      const rightX= STUMP_X + 216;
      const treeTitles = [
        "Tree 1 — trained on F₀ residuals",
        "Tree 2 — trained on F₁ residuals",
        "Tree 3 — trained on F₂ residuals",
      ];
      return (
        <>
          {/* section background */}
          <rect x={STUMP_X} y={sectionY} width={500} height={150}
            rx="10" fill={bg} stroke={col} strokeWidth="1.5" opacity="0.7" />
          {/* tree title bar */}
          <rect x={STUMP_X} y={sectionY} width={500} height={28}
            rx="10" fill={col} opacity="0.9" />
          <text x={STUMP_X + 250} y={sectionY + 18} textAnchor="middle"
            fontSize="13" fontWeight="700" fill="white">{treeTitles[treeIdx]}</text>
          {/* connector lines */}
          <line x1={midX} y1={rootY + 18} x2={leftX} y2={childY - 18}
            stroke={col} strokeWidth="2" />
          <line x1={midX} y1={rootY + 18} x2={rightX} y2={childY - 18}
            stroke={col} strokeWidth="2" />
          {/* branch labels */}
          <text x={(midX + leftX) / 2 - 16} y={(rootY + childY) / 2 + 2}
            fontSize="11" fill={col} fontStyle="italic" fontWeight="600">Yes, ≤</text>
          <text x={(midX + rightX) / 2 + 10} y={(rootY + childY) / 2 + 2}
            fontSize="11" fill={col} fontStyle="italic" fontWeight="600">No, ></text>
          {/* root node */}
          <rect x={midX - 80} y={rootY - 18} width={160} height={36}
            rx="8" fill="white" stroke={col} strokeWidth="2.5" />
          <text x={midX} y={rootY + 6} textAnchor="middle"
            fontSize="14" fontWeight="800" fill={col}>
            age ≤ {stump.threshold} ?
          </text>
          {/* left leaf */}
          <rect x={leftX - 46} y={childY - 18} width={92} height={36}
            rx="8" fill={leafBg} stroke={col} strokeWidth="1.8" />
          <text x={leftX} y={childY - 2} textAnchor="middle"
            fontSize="12" fontWeight="700" fill={col}>
            predict: {stump.leftVal >= 0 ? "+" : ""}{stump.leftVal.toFixed(3)}
          </text>
          <text x={leftX} y={childY + 13} textAnchor="middle"
            fontSize="9.5" fill="#666">age ≤ {stump.threshold}</text>
          {/* right leaf */}
          <rect x={rightX - 46} y={childY - 18} width={92} height={36}
            rx="8" fill={leafBg} stroke={col} strokeWidth="1.8" />
          <text x={rightX} y={childY - 2} textAnchor="middle"
            fontSize="12" fontWeight="700" fill={col}>
            predict: {stump.rightVal >= 0 ? "+" : ""}{stump.rightVal.toFixed(3)}
          </text>
          <text x={rightX} y={childY + 13} textAnchor="middle"
            fontSize="9.5" fill="#666">age > {stump.threshold}</text>
        </>
      );
    }

    // ── helper: mini example table for 3 chosen points ──
    function MiniTable({ treeIdx, sectionY, stump, residualsBefore }) {
      const col = TREE_COLORS[treeIdx];
      const sampleIdxs = [0, 3, 5]; // age=5, age=12, age=28
      const TX = 546;
      const TY = sectionY + 4;
      return (
        <>
          <rect x={TX} y={TY} width={296} height={148} rx="8"
            fill="white" stroke={col} strokeWidth="1.2" opacity="0.85" />
          <text x={TX + 148} y={TY + 17} textAnchor="middle"
            fontSize="11" fontWeight="700" fill={col}>3 example predictions</text>
          {/* header row */}
          {["age", "resid in", "T(x)", "η·T(x)"].map((h, hi) => (
            <text key={hi} x={TX + 18 + hi * 68} y={TY + 33}
              fontSize="10" fontWeight="700" fill="#555">{h}</text>
          ))}
          <line x1={TX + 8} y1={TY + 37} x2={TX + 288} y2={TY + 37}
            stroke={col} strokeWidth="0.8" opacity="0.5" />
          {sampleIdxs.map((si, row) => {
            const age = xs[si];
            const rBefore = residualsBefore[si];
            const tPred = age <= stump.threshold ? stump.leftVal : stump.rightVal;
            const etaTp = eta * tPred;
            const rowY = TY + 52 + row * 32;
            return (
              <g key={row}>
                <text x={TX + 18} y={rowY} fontSize="12" fontWeight="700" fill="#333">{age}</text>
                <text x={TX + 86} y={rowY} fontSize="11"
                  fill={rBefore >= 0 ? "#1f9e6b" : "#e0492e"} fontWeight="600">
                  {rBefore >= 0 ? "+" : ""}{rBefore.toFixed(3)}
                </text>
                <text x={TX + 154} y={rowY} fontSize="11"
                  fill={tPred >= 0 ? "#1f9e6b" : "#e0492e"} fontWeight="600">
                  {tPred >= 0 ? "+" : ""}{tPred.toFixed(3)}
                </text>
                <text x={TX + 222} y={rowY} fontSize="11"
                  fill={etaTp >= 0 ? "#1f9e6b" : "#e0492e"} fontWeight="700">
                  {etaTp >= 0 ? "+" : ""}{etaTp.toFixed(3)}
                </text>
                <line x1={TX + 8} y1={rowY + 5} x2={TX + 288} y2={rowY + 5}
                  stroke="#ddd" strokeWidth="0.7" />
              </g>
            );
          })}
        </>
      );
    }

    // ── helper: residual bar strip between trees ──
    function ResidBand({ topY, residBefore, residAfter, labelBefore, labelAfter, col }) {
      const BAR_AREA_X = 30;
      const BAR_AREA_W = 500;
      const nPts = residBefore.length;
      const barW = 22;
      const barSpacing = BAR_AREA_W / nPts;
      const maxAbs = Math.max(...residBefore.map(Math.abs), 0.1);
      const barMaxH = 26;

      const barX = (i) => BAR_AREA_X + i * barSpacing + (barSpacing - barW) / 2;
      const barH = (r) => Math.max(2, (Math.abs(r) / maxAbs) * barMaxH);
      const barCol = (r) => r >= 0 ? "#1f9e6b" : "#e0492e";

      return (
        <>
          {/* Before label */}
          <text x={BAR_AREA_X + 4} y={topY + 16}
            fontSize="10.5" fontWeight="700" fill="#555">{labelBefore}</text>
          {/* Before bars */}
          {residBefore.map((r, i) => (
            <rect key={i}
              x={barX(i)} y={topY + 22 - barH(r)}
              width={barW} height={barH(r)}
              fill={barCol(r)} rx="2" opacity="0.75" />
          ))}
          {/* Arrow */}
          <text x={BAR_AREA_X + BAR_AREA_W / 2} y={topY + 38}
            textAnchor="middle" fontSize="11" fill={col} fontWeight="700">
            ↓ new residuals = old − η·T(x)  
            (MSE reduced by {(((maxAbs**2) - Math.max(...residAfter.map(r=>r*r), 0.01))/maxAbs**2 * 100).toFixed(0)}% avg |r|)
          </text>
          {/* After label */}
          <text x={BAR_AREA_X + 4} y={topY + 50}
            fontSize="10.5" fontWeight="700" fill="#555">{labelAfter}</text>
          {/* After bars */}
          {residAfter.map((r, i) => (
            <rect key={i}
              x={barX(i)} y={topY + 56 - barH(r) * (Math.abs(r) / maxAbs)}
              width={barW} height={Math.max(2, (Math.abs(r) / maxAbs) * barMaxH * (Math.abs(r) / maxAbs))}
              fill={barCol(r)} rx="2" opacity="0.55" />
          ))}
          {/* x-axis labels: ages */}
          {xs.map((x, i) => (
            <text key={i} x={barX(i) + barW / 2} y={topY + 64}
              textAnchor="middle" fontSize="8.5" fill="#888">{x}</text>
          ))}
        </>
      );
    }

    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: "100%", maxWidth: SVG_W, display: "block", fontFamily: "var(--ui-font)" }}>

        {/* ── TREE 1 ── */}
        <Stump treeIdx={0} sectionY={T1_Y} stump={BOOST_REG.stumps[0]} />
        <MiniTable treeIdx={0} sectionY={T1_Y} stump={BOOST_REG.stumps[0]} residualsBefore={resid0} />

        {/* ── RESIDUAL BAND 1 ── */}
        <rect x={20} y={R1_Y} width={820} height={68} rx="8"
          fill="rgba(148,162,188,.06)" stroke="var(--line)" strokeWidth="1" />
        <ResidBand
          topY={R1_Y + 4}
          residBefore={resid0} residAfter={resid1}
          labelBefore="Residuals before T1 (large):"
          labelAfter="Residuals after T1 (shrunk):"
          col={TREE_COLORS[0]} />

        {/* ── TREE 2 ── */}
        <Stump treeIdx={1} sectionY={T2_Y} stump={BOOST_REG.stumps[1]} />
        <MiniTable treeIdx={1} sectionY={T2_Y} stump={BOOST_REG.stumps[1]} residualsBefore={resid1} />

        {/* ── RESIDUAL BAND 2 ── */}
        <rect x={20} y={R2_Y} width={820} height={68} rx="8"
          fill="rgba(148,162,188,.06)" stroke="var(--line)" strokeWidth="1" />
        <ResidBand
          topY={R2_Y + 4}
          residBefore={resid1} residAfter={resid2}
          labelBefore="Residuals before T2:"
          labelAfter="Residuals after T2 (smaller still):"
          col={TREE_COLORS[1]} />

        {/* ── TREE 3 ── */}
        <Stump treeIdx={2} sectionY={T3_Y} stump={BOOST_REG.stumps[2]} />
        <MiniTable treeIdx={2} sectionY={T3_Y} stump={BOOST_REG.stumps[2]} residualsBefore={resid2} />

        {/* ── FINAL FORMULA ── */}
        <rect x={20} y={FIN_Y} width={820} height={44} rx="10"
          fill="rgba(43,91,255,.06)" stroke="#2b5bff" strokeWidth="2" />
        <text x={430} y={FIN_Y + 19} textAnchor="middle"
          fontSize="14" fontWeight="800" fill="#2b5bff">
          F(x) = ȳ + η·T₁(x) + η·T₂(x) + η·T₃(x)
        </text>
        <text x={430} y={FIN_Y + 37} textAnchor="middle"
          fontSize="11" fill="#555">
          = {fmt(initPred, 3)} + 0.5·T₁(x) + 0.5·T₂(x) + 0.5·T₃(x)  |  MSE: 5.500 → 1.925 → 1.473 → 1.285
        </text>
      </svg>
    );
  }

  const stageSeqTrees = {
    id: "seq-trees", group: "Training",
    title: "3 Sequential Trees — Each Targets the Previous Errors",
    map: "Seq Trees",
    why: "Seeing all 3 trees laid out sequentially — with the residuals flowing between them — makes the 'student studying wrong answers' analogy concrete and visual.",
    render: () => (
      <>
        <Lead>
          The <b>key mechanic of gradient boosting</b> is the chain: each tree sees only the
          errors the previous ensemble could not fix. Tree 1 makes big corrections (leaf values ≈
          ±1.95 / −2.43) because the initial residuals are large. Tree 2 corrects what Tree 1
          missed (leaf values ≈ ±0.43 / −0.48). Tree 3 fine-tunes further (±0.12 / −0.38).
          This is the "student studying wrong answers" pattern — each round, the student
          focuses only on what they still got wrong.
        </Lead>
        <Lead>
          The residual bars between each tree make the shrinkage visible. After Tree 1, the
          biggest errors (young houses under-predicted, old houses over-predicted) are fixed.
          After Tree 2, only subtle patterns remain. After Tree 3, MSE has dropped from
          5.500 → 1.285 — a <b>77% reduction</b> in 3 stumps.
        </Lead>
        <SeqTreesSVG />
        <Note>
          The leaf values get smaller with every round because the residuals we are fitting
          get smaller. Tree 1's leaves (±1.95, −2.43) reflect large initial errors;
          Tree 3's leaves (±0.12, −0.38) reflect the fine-grained residuals that remain.
          This automatic magnitude decay is a natural form of regularization.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 6b: Boost Animation
  // ────────────────────────────────────────────────────────

  // Hardcoded trace data derived from BOOST_REG / ml-boosting.js
  const ANIM_REG = {
    xs:      [5,    7,    10,   12,   20,   28,   35,   42  ],
    ys:      [8.2,  7.5,  6.8,  5.7,  3.8,  2.9,  2.2,  1.8 ],
    initPred: 4.8625,
    // preds[round][pointIdx]  (round 0 = after F0, rounds 1-3 after each stump)
    preds: [
      [4.8625, 4.8625, 4.8625, 4.8625, 4.8625, 4.8625, 4.8625, 4.8625],
      [5.8375, 5.8375, 5.8375, 5.8375, 3.6500, 3.6500, 3.6500, 3.6500],
      [6.0500, 6.0500, 6.0500, 5.6000, 3.4125, 3.4125, 3.4125, 3.4125],
      [6.1100, 6.1100, 6.1100, 5.6600, 3.4725, 3.4725, 3.2225, 3.2225],
    ],
    residuals: [
      [ 3.3375,  2.6375,  1.9375,  0.8375, -1.0625, -1.9625, -2.6625, -3.0625],
      [ 2.3625,  1.6625,  0.9625, -0.1375,  0.1500, -0.7500, -1.4500, -1.8500],
      [ 2.1500,  1.4500,  0.7500,  0.1000,  0.3875, -0.5125, -1.2125, -1.6125],
      [ 2.0900,  1.3900,  0.6900,  0.0400,  0.3275, -0.5725, -1.0225, -1.4225],
    ],
    mses: [5.4998, 1.9251, 1.4726, 1.2852],
    stumps: [
      { threshold: 16, leftVal: 1.95,  rightVal: -2.425 },
      { threshold: 10, leftVal: 0.425, rightVal: -0.475 },
      { threshold: 30, leftVal: 0.12,  rightVal: -0.38  },
    ],
  };

  // Extra fast-forward rounds simulated by continuing shrinkage
  (function buildExtraRounds() {
    // Simulate rounds 4-10 with decaying residuals (approximation for animation)
    for (let t = 3; t < 10; t++) {
      const prevPreds = ANIM_REG.preds[t];
      const factor = 0.88; // ~12% shrink per extra round
      const newPreds = prevPreds.map((p, i) => {
        const r = ANIM_REG.ys[i] - p;
        return p + 0.5 * r * 0.18; // small step toward truth
      });
      const newRes = ANIM_REG.ys.map((y, i) => y - newPreds[i]);
      const mse = ANIM_REG.ys.reduce((s, y, i) => s + (y - newPreds[i]) ** 2, 0) / ANIM_REG.ys.length;
      ANIM_REG.preds.push(newPreds);
      ANIM_REG.residuals.push(newRes);
      ANIM_REG.mses.push(mse);
    }
  })();

  function BoostingAnim() {
    const [phase, setPhase] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1200);
    const MAX_PHASE = 7;

    useEffect(() => {
      if (!playing || phase >= MAX_PHASE) { setPlaying(false); return; }
      const t = setTimeout(() => setPhase(p => p + 1), speed);
      return () => clearTimeout(t);
    }, [playing, phase, speed]);

    // Which round's data to show in each phase
    // Phase 0: round 0 data, phase 2: round 1, phase 4: round 2, phase 6: round 3
    const roundForPhase = [0, 0, 1, 1, 2, 2, 3, 3];
    const roundIdx = Math.min(roundForPhase[phase] || 0, ANIM_REG.preds.length - 1);
    const curPreds = ANIM_REG.preds[roundIdx];
    const curResids = ANIM_REG.residuals[roundIdx];
    const curMSE = ANIM_REG.mses[roundIdx];
    const initMSE = ANIM_REG.mses[0];
    const finalMSE3 = ANIM_REG.mses[3];

    // SVG panel layout: 860 × 480 total, 3 horizontal panels
    const TW = 860, TH = 480;
    const PW = 260, PH = 380;
    const PY = 60;
    const P1X = 20, P2X = 300, P3X = 580;
    // Internal chart coords within each panel
    const CL = 40, CR = 10, CT = 30, CB = 40;
    const CW = PW - CL - CR, CH = PH - CT - CB;
    const xMin = 0, xMax = 46, yMin = 0, yMax = 10;
    const px = (v, ox) => ox + CL + ((v - xMin) / (xMax - xMin)) * CW;
    const py2 = v => PY + CT + (1 - (v - yMin) / (yMax - yMin)) * CH;

    // Residual bar chart: each bar's center x, height = residual value
    // Use a sub-chart inside middle panel with y-axis from -4 to +4
    const rMin = -4, rMax = 4;
    const ry = v => PY + CT + (1 - (v - rMin) / (rMax - rMin)) * CH;
    const rx = (i, ox) => ox + CL + (i + 0.5) * (CW / ANIM_REG.xs.length);
    const barW = Math.max(8, CW / ANIM_REG.xs.length - 4);

    // Build step-function polyline points for left panel
    function stepPoints(predsArr, ox) {
      const sorted = ANIM_REG.xs.map((x, i) => ({ x, p: predsArr[i] })).sort((a, b) => a.x - b.x);
      const pts = [];
      for (let i = 0; i < sorted.length; i++) {
        const x0 = i === 0 ? xMin : (sorted[i - 1].x + sorted[i].x) / 2;
        const x1 = i === sorted.length - 1 ? xMax : (sorted[i].x + sorted[i + 1].x) / 2;
        const yv = Math.max(yMin, Math.min(yMax, sorted[i].p));
        pts.push(`${px(x0, ox)},${py2(yv)}`);
        pts.push(`${px(x1, ox)},${py2(yv)}`);
      }
      return pts.join(' ');
    }

    // Phase descriptions
    const phaseDescs = [
      "Phase 0 — Start: predict mean ȳ = 4.863 for everyone. Residuals = true − prediction.",
      "Phase 1 — Stump 1 is being learned. It splits at age ≤ 16 to reduce the big errors.",
      "Phase 2 — Stump 1 applied: F₁ = F₀ + η·T₁. Residual bars shrink. MSE: 5.50 → 1.93.",
      "Phase 3 — Stump 2 is being learned. It now splits at age ≤ 10 for finer corrections.",
      "Phase 4 — Stump 2 applied: F₂ = F₁ + η·T₂. Bars shrink further. MSE: 1.93 → 1.47.",
      "Phase 5 — Stump 3 is being learned. Tiny leaf values ±0.12–0.38 for final fine-tuning.",
      "Phase 6 — Stump 3 applied: F₃ = F₀ + η·T₁ + η·T₂ + η·T₃. MSE: 5.50 → 1.29.",
      "Phase 7 — More rounds: error keeps falling as each stump corrects the remaining residuals.",
    ];

    // Stump display for right panel
    const stumpPhaseMap = [null, 0, 0, 1, 1, 2, 2, null];
    const activeStump = stumpPhaseMap[phase] !== null ? ANIM_REG.stumps[stumpPhaseMap[phase]] : null;
    const stumpLabel = phase >= 1 && phase <= 6 ? `Stump ${stumpPhaseMap[phase] + 1}` : null;
    const stumpApplied = [false, false, true, true, true, true, true, true][phase];

    // Fast-forward round for phase 7
    const [ff, setFf] = useState(3);
    useEffect(() => {
      if (phase !== 7) { setFf(3); return; }
      if (ff >= 9) return;
      const t = setTimeout(() => setFf(f => f + 1), 320);
      return () => clearTimeout(t);
    }, [phase, ff]);

    const displayRound = phase === 7 ? ff : roundIdx;
    const displayPreds = ANIM_REG.preds[Math.min(displayRound, ANIM_REG.preds.length - 1)];
    const displayResids = ANIM_REG.residuals[Math.min(displayRound, ANIM_REG.residuals.length - 1)];
    const displayMSE = ANIM_REG.mses[Math.min(displayRound, ANIM_REG.mses.length - 1)];

    // MSE progress bar fill % — 0 = initMSE, 100 = final low MSE
    const msePct = Math.max(0, Math.min(100,
      ((initMSE - displayMSE) / (initMSE - (ANIM_REG.mses[ANIM_REG.mses.length - 1] || 0.5))) * 100
    ));

    const btnStyle = (active) => ({
      padding: '4px 11px', borderRadius: 6, border: '1.5px solid var(--line)',
      background: active ? 'var(--accent)' : 'var(--panel-solid)',
      color: active ? 'white' : 'var(--ink)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
    });

    return (
      <div style={{ fontFamily: 'var(--ui-font)' }}>
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <button style={btnStyle(playing)} onClick={() => { if (phase >= MAX_PHASE) setPhase(0); setPlaying(true); }}>
            ▶ Play
          </button>
          <button style={btnStyle(false)} onClick={() => setPlaying(false)}>⏸ Pause</button>
          <button style={btnStyle(false)} onClick={() => { setPhase(0); setPlaying(false); setFf(3); }}>⟳ Reset</button>
          <button style={btnStyle(false)} onClick={() => setPhase(p => Math.max(0, p - 1))}>← Prev</button>
          <button style={btnStyle(false)} onClick={() => setPhase(p => Math.min(MAX_PHASE, p + 1))}>Next →</button>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>
            Phase {phase + 1} of {MAX_PHASE + 1}
            {phase === 7 ? ` — Round ${displayRound + 1}` : phase <= 6 ? ` — ${['initial prediction','learning stump','applying stump'][Math.floor(phase / 2) < 3 ? (phase === 0 ? 0 : phase % 2 === 1 ? 1 : 2) : 2]}` : ''}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>Speed:</span>
          {[[2000, 'Slow'], [1200, 'Normal'], [600, 'Fast']].map(([ms, lbl]) => (
            <button key={ms} style={btnStyle(speed === ms)} onClick={() => setSpeed(ms)}>{lbl}</button>
          ))}
        </div>

        {/* MSE Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>MSE progress</span>
          <div style={{ flex: 1, background: 'var(--line-soft)', borderRadius: 6, height: 14, overflow: 'hidden', maxWidth: 400 }}>
            <div style={{
              height: '100%', borderRadius: 6,
              width: `${msePct}%`,
              background: `hsl(${130 + msePct * 0.5}, 60%, 42%)`,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <span style={{ fontSize: 12, fontFamily: 'var(--num-font)', color: 'var(--ink)', flexShrink: 0, minWidth: 80 }}>
            MSE = {displayMSE.toFixed(4)}
          </span>
        </div>

        {/* Main SVG — 3 panels */}
        <svg viewBox={`0 0 ${TW} ${TH}`} style={{ width: '100%', maxWidth: TW, display: 'block' }}>
          {/* ─── Panel backgrounds ─── */}
          {[P1X, P2X, P3X].map((ox, pi) => (
            <rect key={pi} x={ox} y={PY - 10} width={PW} height={PH + 20}
              rx="8" fill="var(--panel-solid)" stroke="var(--line)" strokeWidth="1" opacity="0.6" />
          ))}

          {/* ─── Panel 1: scatter + step function ─── */}
          {/* Axes */}
          <line x1={px(xMin, P1X)} y1={py2(yMin)} x2={px(xMax, P1X)} y2={py2(yMin)} stroke="var(--line)" strokeWidth="1.2" />
          <line x1={px(xMin, P1X)} y1={py2(yMin)} x2={px(xMin, P1X)} y2={py2(yMax)} stroke="var(--line)" strokeWidth="1.2" />
          {[0, 2, 4, 6, 8, 10].map(v => (
            <g key={v}>
              <line x1={px(xMin, P1X) - 3} y1={py2(v)} x2={px(xMin, P1X)} y2={py2(v)} stroke="var(--line)" strokeWidth="1" />
              <text x={px(xMin, P1X) - 5} y={py2(v) + 4} textAnchor="end" fontSize="9" fill="var(--muted)">{v}</text>
            </g>
          ))}
          {[0, 10, 20, 30, 40].map(v => (
            <g key={v}>
              <text x={px(v, P1X)} y={py2(yMin) + 14} textAnchor="middle" fontSize="9" fill="var(--muted)">{v}</text>
            </g>
          ))}
          <text x={P1X + PW / 2} y={PY + PH + 16} textAnchor="middle" fontSize="10" fill="var(--muted)">age</text>
          <text x={P1X + 10} y={PY + PH / 2} textAnchor="middle" fontSize="10" fill="var(--muted)"
            transform={`rotate(-90,${P1X + 10},${PY + PH / 2})`}>price</text>

          {/* Panel 1 title */}
          <text x={P1X + PW / 2} y={PY - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">
            {phase === 0 ? 'Start: predict mean = ȳ' : `F${displayRound}: step function prediction`}
          </text>

          {/* Flat mean line (shown faded after phase 0) */}
          {phase === 0 && (
            <line x1={px(xMin, P1X)} y1={py2(ANIM_REG.initPred)} x2={px(xMax, P1X)} y2={py2(ANIM_REG.initPred)}
              stroke="#94A2BC" strokeWidth="2.5" strokeDasharray="6 3" />
          )}
          {phase > 0 && (
            <line x1={px(xMin, P1X)} y1={py2(ANIM_REG.initPred)} x2={px(xMax, P1X)} y2={py2(ANIM_REG.initPred)}
              stroke="#94A2BC" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.35" />
          )}

          {/* Step function */}
          {phase >= 2 && (
            <polyline points={stepPoints(displayPreds, P1X)}
              fill="none"
              stroke={displayRound >= 3 ? '#1f9e6b' : displayRound === 2 ? '#2B5BFF' : '#f59e0b'}
              strokeWidth="2.5" strokeLinejoin="round" />
          )}

          {/* Data points */}
          {ANIM_REG.xs.map((x, i) => (
            <circle key={i} cx={px(x, P1X)} cy={py2(ANIM_REG.ys[i])} r="5"
              fill="#2B5BFF" stroke="white" strokeWidth="1.2" opacity="0.9" />
          ))}

          {/* F0 label */}
          {phase === 0 && (
            <text x={px(xMax, P1X) - 4} y={py2(ANIM_REG.initPred) - 5} textAnchor="end"
              fontSize="10" fill="#94A2BC" fontWeight="700">F₀ = 4.86</text>
          )}

          {/* ─── Panel 2: residual bars ─── */}
          {/* Zero line */}
          <line x1={rx(-0.5, P2X)} y1={ry(0)} x2={rx(ANIM_REG.xs.length - 0.5, P2X)} y2={ry(0)}
            stroke="var(--ink)" strokeWidth="1.5" />
          {/* Axis ticks */}
          {[-3, -2, -1, 0, 1, 2, 3].map(v => (
            <g key={v}>
              <line x1={P2X + CL - 3} y1={ry(v)} x2={P2X + CL} y2={ry(v)} stroke="var(--line)" strokeWidth="1" />
              <text x={P2X + CL - 5} y={ry(v) + 4} textAnchor="end" fontSize="9" fill="var(--muted)">{v}</text>
            </g>
          ))}
          <text x={P2X + PW / 2} y={PY + PH + 16} textAnchor="middle" fontSize="10" fill="var(--muted)">training point</text>
          <text x={P2X + 10} y={PY + PH / 2} textAnchor="middle" fontSize="10" fill="var(--muted)"
            transform={`rotate(-90,${P2X + 10},${PY + PH / 2})`}>residual</text>

          {/* Panel 2 title */}
          <text x={P2X + PW / 2} y={PY - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">
            {phase <= 1 ? 'Residuals = true − prediction' : `Residuals after Round ${displayRound}`}
          </text>
          {phase >= 2 && (
            <text x={P2X + PW / 2} y={PY - 2} textAnchor="middle" fontSize="10" fill="var(--muted)">
              MSE = {displayMSE.toFixed(4)}
            </text>
          )}

          {/* Residual bars */}
          {displayResids.map((r, i) => {
            const barTop = ry(Math.max(0, r));
            const barBot = ry(Math.min(0, r));
            const barH = Math.abs(barBot - barTop);
            return (
              <rect key={i}
                x={rx(i, P2X) - barW / 2}
                y={barTop}
                width={barW}
                height={Math.max(1, barH)}
                fill={r >= 0 ? '#1f9e6b' : '#e0492e'}
                opacity="0.8"
                rx="2"
                style={{ transition: 'y 0.5s ease, height 0.5s ease' }}
              />
            );
          })}

          {/* ─── Panel 3: stump display ─── */}
          {/* Panel 3 title */}
          <text x={P3X + PW / 2} y={PY - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">
            {phase === 0 ? 'No stump yet'
              : phase === 7 ? 'Stumps 1–3 repeating'
              : activeStump ? `${stumpLabel}: ${stumpApplied ? 'applied ✓' : 'being learned…'}`
              : 'Ensemble accumulated'}
          </text>

          {/* Stump SVG nodes rendered inside right panel */}
          {activeStump && (() => {
            const midX = P3X + PW / 2;
            const rootY = PY + 60;
            const childY = PY + 150;
            const leftX = P3X + 65;
            const rightX = P3X + PW - 65;
            return (
              <>
                <line x1={midX} y1={rootY + 16} x2={leftX} y2={childY - 16} stroke="var(--line)" strokeWidth="1.5" />
                <line x1={midX} y1={rootY + 16} x2={rightX} y2={childY - 16} stroke="var(--line)" strokeWidth="1.5" />
                <text x={(midX + leftX) / 2 - 8} y={(rootY + childY) / 2} fontSize="10" fill="var(--muted)" fontStyle="italic">yes</text>
                <text x={(midX + rightX) / 2 + 10} y={(rootY + childY) / 2} fontSize="10" fill="var(--muted)" fontStyle="italic">no</text>
                <rect x={midX - 68} y={rootY - 16} width={136} height={32} rx="8"
                  fill="var(--panel-solid)" stroke="var(--accent)" strokeWidth="2" />
                <text x={midX} y={rootY + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">
                  age ≤ {activeStump.threshold}?
                </text>
                <rect x={leftX - 38} y={childY - 16} width={76} height={32} rx="8"
                  fill={activeStump.leftVal >= 0 ? 'rgba(31,158,107,.15)' : 'rgba(224,73,46,.12)'}
                  stroke={activeStump.leftVal >= 0 ? '#1f9e6b' : '#e0492e'} strokeWidth="1.5" />
                <text x={leftX} y={childY - 1} textAnchor="middle" fontSize="11" fontWeight="700"
                  fill={activeStump.leftVal >= 0 ? '#1f9e6b' : '#e0492e'}>
                  {activeStump.leftVal.toFixed(3)}
                </text>
                <text x={leftX} y={childY + 12} textAnchor="middle" fontSize="9" fill="var(--muted)">age ≤ {activeStump.threshold}</text>
                <rect x={rightX - 38} y={childY - 16} width={76} height={32} rx="8"
                  fill={activeStump.rightVal >= 0 ? 'rgba(31,158,107,.15)' : 'rgba(224,73,46,.12)'}
                  stroke={activeStump.rightVal >= 0 ? '#1f9e6b' : '#e0492e'} strokeWidth="1.5" />
                <text x={rightX} y={childY - 1} textAnchor="middle" fontSize="11" fontWeight="700"
                  fill={activeStump.rightVal >= 0 ? '#1f9e6b' : '#e0492e'}>
                  {activeStump.rightVal.toFixed(3)}
                </text>
                <text x={rightX} y={childY + 12} textAnchor="middle" fontSize="9" fill="var(--muted)">age > {activeStump.threshold}</text>
              </>
            );
          })()}

          {/* Phase 0: empty stump placeholder */}
          {phase === 0 && (
            <>
              <rect x={P3X + 30} y={PY + 40} width={PW - 60} height={PH - 80} rx="8"
                fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="6 4" opacity="0.4" />
              <text x={P3X + PW / 2} y={PY + PH / 2 - 10} textAnchor="middle" fontSize="13" fill="var(--faint)">
                Stump 1
              </text>
              <text x={P3X + PW / 2} y={PY + PH / 2 + 8} textAnchor="middle" fontSize="11" fill="var(--faint)">
                not yet trained
              </text>
            </>
          )}

          {/* Phase 7 fast-forward: show all 3 stumps stacked small */}
          {phase === 7 && (
            <>
              {ANIM_REG.stumps.map((s, t) => {
                const sy0 = PY + 20 + t * 110;
                const smidX = P3X + PW / 2;
                const active7 = true;
                return (
                  <g key={t} opacity={active7 ? 1 : 0.3}>
                    <rect x={smidX - 58} y={sy0} width={116} height={26} rx="6"
                      fill="var(--panel-solid)" stroke="var(--accent)" strokeWidth="1.5" />
                    <text x={smidX} y={sy0 + 13} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink)">
                      T{t + 1}: age ≤ {s.threshold}
                    </text>
                    <text x={smidX - 28} y={sy0 + 55} textAnchor="middle" fontSize="10" fontWeight="700"
                      fill={s.leftVal >= 0 ? '#1f9e6b' : '#e0492e'}>
                      {s.leftVal > 0 ? '+' : ''}{s.leftVal.toFixed(3)}
                    </text>
                    <text x={smidX + 28} y={sy0 + 55} textAnchor="middle" fontSize="10" fontWeight="700"
                      fill={s.rightVal >= 0 ? '#1f9e6b' : '#e0492e'}>
                      {s.rightVal > 0 ? '+' : ''}{s.rightVal.toFixed(3)}
                    </text>
                    <line x1={smidX} y1={sy0 + 26} x2={smidX - 28} y2={sy0 + 44} stroke="var(--line)" strokeWidth="1" />
                    <line x1={smidX} y1={sy0 + 26} x2={smidX + 28} y2={sy0 + 44} stroke="var(--line)" strokeWidth="1" />
                  </g>
                );
              })}
              <text x={P3X + PW / 2} y={PY + 360} textAnchor="middle" fontSize="11" fontWeight="700"
                fill="var(--accent-ink)">
                Round {displayRound + 1} of 10
              </text>
            </>
          )}

          {/* MSE annotation on right panel for phase 6+ */}
          {phase >= 6 && (
            <>
              <text x={P3X + PW / 2} y={PY + PH - 50} textAnchor="middle" fontSize="11" fill="var(--ink)">
                MSE: {ANIM_REG.mses[0].toFixed(2)} → {displayMSE.toFixed(4)}
              </text>
              <text x={P3X + PW / 2} y={PY + PH - 32} textAnchor="middle" fontSize="10" fill="var(--muted)">
                reduction: {((1 - displayMSE / ANIM_REG.mses[0]) * 100).toFixed(1)}%
              </text>
            </>
          )}
        </svg>

        {/* Floating annotation box */}
        <div style={{
          marginTop: 8, padding: '10px 14px', borderRadius: 8,
          background: 'var(--accent-soft)', border: '1.5px solid var(--accent)',
          fontSize: 13, color: 'var(--ink)', lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 700, color: 'var(--accent-ink)', marginRight: 8 }}>
            Phase {phase + 1}/{MAX_PHASE + 1}:
          </span>
          {phaseDescs[phase]}
        </div>
      </div>
    );
  }

  const stageBoostAnim = {
    id: "boost-animation", group: "Training", title: "Watch Boosting Correct Residuals — Animated",
    map: "Boost Animation",
    why: "This animation shows HOW gradient boosting actually works step by step: each stump targets the residual errors of the previous ensemble, and residual bars visibly shrink each round.",
    render: () => <BoostingAnim />,
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 7: Full Ensemble
  // ────────────────────────────────────────────────────────
  const stageEnsemble = {
    id: "ensemble", group: "Boosting", title: "Full ensemble — additive model F = F₀ + Σ η·Tₜ",
    map: "Ensemble",
    why: "The final model is a sum of all trees, each weighted by η. The step-function approximation improves with more trees. Use the nTrees slider to see each tree's contribution.",
    render: (trace, ctx) => {
      const { input } = ctx;
      return (
        <>
          <Lead>
            The final prediction is the <b>additive sum of all trees</b>:
            F(x) = F₀ + η·T₁(x) + η·T₂(x) + η·T₃(x). Each tree adds a small piecewise-constant
            correction to the running prediction. Together, they build a step function that
            closely approximates the true underlying pattern in the data.
          </Lead>
          <Lead>
            Use the <b>nTrees slider</b> (in the header) to add trees one at a time and watch
            the prediction curve evolve. Notice how the first tree makes the biggest jump,
            and later trees make increasingly subtle refinements. The red dot marks the
            ensemble's prediction for your query age.
          </Lead>

          <Formula label="Additive model">
            F(x) = F₀ + η·T₁(x) + η·T₂(x) + η·T₃(x) = {fmt(trace.initPred)} + {BOOST_REG.eta}·T₁(x) + {BOOST_REG.eta}·T₂(x) + {BOOST_REG.eta}·T₃(x)
          </Formula>

          <div className="tf-subhead">Ensemble prediction curve vs training data</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
            <ScatterAxes />
            {trace.rounds.slice(1).map((r, t) => (
              <StepLine key={t} preds={r.preds}
                color={ROUND_COLORS[t] || "#2B5BFF"}
                strokeWidth={t === trace.rounds.length - 2 ? 3 : 1.8} />
            ))}
            <DataDots queryX={input.x} />
            <circle cx={sx(input.x)} cy={sy(Math.max(yMin, Math.min(yMax, trace.queryPred)))} r={8}
              fill="#e0492e" stroke="white" strokeWidth="2.5" />
            <text x={sx(input.x) + 11} y={sy(Math.max(yMin, Math.min(yMax, trace.queryPred))) - 6}
              fontSize="11" fill="#e0492e" fontWeight="700">
              {fmt(trace.queryPred, 2)} $100k
            </text>
          </svg>
          <LineLegend items={[
            ["#94A2BC", "After T1"],
            ["#f59e0b", "After T2"],
            ["#2B5BFF", "After T3"],
            ["#e0492e", `Query (age=${input.x})`],
          ]} />

          <div className="nn-calc">
            <div className="nn-calc-h">Prediction breakdown for age = {input.x} ({input.nTrees} tree(s))</div>
            <div className="nn-calc-row">F₀ = {fmt(trace.initPred, 3)} (mean of training y)</div>
            {trace.rounds.slice(1).map((r, t) => {
              const stump = BOOST_REG.stumps[t];
              const sp = input.x <= stump.threshold ? stump.leftVal : stump.rightVal;
              const leaf = input.x <= stump.threshold ? "left" : "right";
              return (
                <div key={t} className="nn-calc-row">
                  + η×T{t+1}(age={input.x}) = {BOOST_REG.eta}×{fmt(sp, 3)} ({leaf} leaf) = <b>{fmt(BOOST_REG.eta * sp, 3)}</b>
                </div>
              );
            })}
            <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 4 }}>
              Final prediction F({input.x}) = <b className="nn-calc-res">{fmt(trace.queryPred, 3)} $100k</b>
            </div>
          </div>

          <div className="tf-subhead" style={{ marginTop: 12 }}>MSE reduction across rounds</div>
          <MSEBars rounds={trace.rounds} />
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 8: Learning Rate
  // ────────────────────────────────────────────────────────
  const stageEta = {
    id: "eta", group: "Concepts", title: "Learning rate η — shrinkage prevents overfitting",
    map: "Learning rate",
    why: "η is one of the most important hyperparameters in gradient boosting. It controls the trade-off between convergence speed and generalization quality.",
    render: () => {
      const etas = [1.0, 0.5, 0.1];
      const etaColors = ["#e0492e", "#2B5BFF", "#1f9e6b"];
      return (
        <>
          <Lead>
            The <b>learning rate η</b> (also called "shrinkage") multiplies each tree's contribution
            before adding it to the ensemble: F(x) += η × T(x). With η = 1.0, we add the full
            tree prediction. With η = 0.1, we add only 10% of it. Why not always use η = 1.0?
            Because large steps overshoot the optimum and cause overfitting — just like gradient
            descent in neural networks needs a small step size to converge stably.
          </Lead>
          <Lead>
            The golden rule: <b>smaller η always needs more trees</b>. η = 0.1 with 100 trees
            often generalizes better than η = 1.0 with 10 trees, even though both reach
            similar training error. The many small steps explore the loss landscape more
            smoothly, finding a flatter minimum that generalizes better to new data.
            XGBoost default is η = 0.3; scikit-learn GBM default is η = 0.1.
          </Lead>

          <div className="tf-subhead">Effect of η on loss convergence</div>
          <svg viewBox="0 0 420 200" style={{ width: "100%", maxWidth: 420 }}>
            {etas.map((eta, ei) => {
              const pts = [];
              for (let t = 0; t <= 40; t++) {
                let loss;
                if (eta === 1.0) {
                  loss = t === 0 ? 4.0 : t < 3 ? 4.0 * Math.exp(-1.5 * t) + Math.sin(t * 0.9) * 0.15 : 0.35 + Math.sin(t * 0.5) * 0.12;
                } else if (eta === 0.5) {
                  loss = 4.0 * Math.exp(-0.38 * t) + 0.06;
                } else {
                  loss = 4.0 * Math.exp(-0.09 * t) + 0.02;
                }
                pts.push([t, Math.max(0, loss)]);
              }
              const lx = t => 44 + (t / 40) * 350;
              const ly = v => 175 - Math.min(165, (v / 4.5) * 165);
              const polyline = pts.map(([t, v]) => `${lx(t)},${ly(v)}`).join(" ");
              return <polyline key={ei} points={polyline} fill="none" stroke={etaColors[ei]} strokeWidth="2.2" opacity="0.9" />;
            })}
            <line x1={44} y1={10} x2={44} y2={178} stroke="var(--line)" strokeWidth="1" />
            <line x1={44} y1={178} x2={394} y2={178} stroke="var(--line)" strokeWidth="1" />
            <text x={219} y={196} textAnchor="middle" fontSize="10" fill="var(--muted)">number of trees</text>
            <text x={15} y={95} textAnchor="middle" fontSize="10" fill="var(--muted)" transform="rotate(-90,15,95)">training MSE</text>
            {etas.map((eta, ei) => (
              <g key={ei}>
                <line x1={56 + ei * 110} y1={24} x2={76 + ei * 110} y2={24} stroke={etaColors[ei]} strokeWidth="2.5" />
                <text x={80 + ei * 110} y={28} fontSize="10" fill={etaColors[ei]} fontWeight="700">η = {eta}</text>
              </g>
            ))}
            <text x={250} y={50} fontSize="9" fill="#e0492e">oscillates / overfits</text>
            <text x={250} y={90} fontSize="9" fill="#2B5BFF">balanced</text>
            <text x={200} y={140} fontSize="9" fill="#1f9e6b">slow but smooth</text>
          </svg>

          <div className="tf-legend" style={{ marginTop: 12 }}>
            {[
              ["η = 1.0 (red)", "Full step — fast but oscillates and overfits training data. Early stopping essential. Few trees needed but test error can be poor."],
              ["η = 0.5 (blue)", "Our dataset's setting. Converges cleanly with 3–10 trees. Balanced trade-off between speed and generalization."],
              ["η = 0.1 (green)", "Small shrinkage — very smooth convergence. Needs 50–300+ trees for best accuracy, but generalizes excellently. Standard production setting."],
              ["Rule of thumb", "Always pair small η with large n_estimators. Use early stopping (monitor validation loss) to find the right number of trees automatically."],
              ["Mathematical view", "Shrinkage is equivalent to L2 regularization on the tree weights. Smaller η = stronger regularization = less overfitting."],
            ].map(([n, d]) => (
              <div className="tf-leg" key={n}>
                <div className="tf-leg-name">{n}</div>
                <div className="tf-leg-desc">{d}</div>
              </div>
            ))}
          </div>

          <Note>
            With η = 0.5 and 3 trees, our toy model achieves MSE = {fmt(runBoostReg({ x: 15, nTrees: 3 }).mse, 4)}.
            With real data, tuning η and n_estimators together (via cross-validation) is the
            most impactful hyperparameter optimization you can do.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 9: Missing Values & Outliers
  // ────────────────────────────────────────────────────────
  const stageMissing = {
    id: "robustness", group: "Concepts", title: "Missing values & outliers — practical robustness",
    map: "Robustness",
    why: "Real-world data is messy. Understanding how boosting handles (or fails to handle) missing values and outliers is essential for production use.",
    render: (trace) => {
      // Show effect of an outlier on residuals
      const outlierY = 12.0; // an outlier price way above trend
      const outlierX = 7;    // age 7 with price 12 (far above expected ~8.2)
      const initPredVal = trace.initPred;
      const outlierResid = outlierY - initPredVal;

      // loss comparison table
      const preds = [3.0, 3.5, 4.0, 4.5, 5.0];
      const trueY = 8.0;
      return (
        <>
          <Lead>
            Two practical challenges: <b>missing feature values</b> and <b>outliers in y</b>.
            Standard GBM (scikit-learn) requires imputation before training — you must fill
            in missing values with the mean, median, or a learned value. <b>XGBoost</b> handles
            missing values natively by learning, at each split, the best default direction
            for samples with a missing feature value. This is one of XGBoost's biggest
            practical advantages.
          </Lead>
          <Lead>
            Outliers in y are more dangerous. MSE loss squares the residuals, so a single
            extreme outlier creates a residual that is orders of magnitude larger than normal points.
            The boosting algorithm will spend many rounds trying to correct that one point,
            at the cost of accuracy on all other points. The solution: use a <b>robust loss function</b>
            like Huber loss (smooth combination of MSE and MAE) or quantile loss (predicts medians).
          </Lead>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "14px 0" }}>
            <div style={{ background: "var(--accent-soft)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 8 }}>Missing Values</div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7 }}>
                <b>Standard GBM:</b> impute first (mean/median). Missing values are never seen during training.
              </div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, marginTop: 8 }}>
                <b>XGBoost:</b> at each split, learn the optimal default direction for missing values.
                If feature is missing, route left or right — whichever minimizes loss. No imputation needed.
              </div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, marginTop: 8 }}>
                <b>LightGBM:</b> same approach as XGBoost. Both handle sparse features natively.
              </div>
            </div>
            <div style={{ background: "rgba(224,73,46,.08)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e0492e", marginBottom: 8 }}>Outliers in y</div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7 }}>
                Imagine a house priced at $12m (age=7). Its residual after F₀ = {fmt(outlierResid, 2)}.
                All other residuals are below 3.0. This outlier <b>dominates</b> the gradient signal.
              </div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, marginTop: 8 }}>
                <b>Fix:</b> use Huber loss L(r) = r²/2 if |r| ≤ δ, else δ|r| − δ²/2.
                For large residuals, Huber loss grows <em>linearly</em> (not quadratically), capping the influence of outliers.
              </div>
            </div>
          </div>

          <div className="tf-subhead">Why MSE is sensitive to outliers — loss comparison</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", maxWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["pred F(x)", "true y", "residual r", "MSE loss (r²)", "MAE loss (|r|)", "Huber (δ=1)"].map(h => (
                    <th key={h} style={{ padding: "5px 8px", color: "var(--muted)", fontWeight: 600, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preds.map(p => {
                  const r = trueY - p;
                  const mse = r * r;
                  const mae = Math.abs(r);
                  const delta = 1.0;
                  const huber = Math.abs(r) <= delta ? r * r / 2 : delta * (Math.abs(r) - delta / 2);
                  const isOutlier = Math.abs(r) > 4;
                  return (
                    <tr key={p} style={{ borderBottom: "1px solid var(--line-soft)", background: isOutlier ? "rgba(224,73,46,.06)" : undefined }}>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{p.toFixed(1)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{trueY}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#e0492e", fontWeight: isOutlier ? 700 : 400 }}>{fmt(r, 2)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: isOutlier ? "#e0492e" : "var(--ink)", fontWeight: isOutlier ? 700 : 400 }}>{fmt(mse, 2)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{fmt(mae, 2)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#1f9e6b" }}>{fmt(huber, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Note>
            In XGBoost, set <code>objective="reg:pseudohubererror"</code> or use quantile regression
            (<code>objective="reg:quantileerror"</code>) to get outlier-robust predictions.
            For scikit-learn GBM: <code>loss="huber"</code>. Always inspect your target variable
            for extreme outliers before boosting — they can wreck your model.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 10: Evaluation & XGBoost
  // ────────────────────────────────────────────────────────
  const stageEval = {
    id: "eval", group: "Concepts", title: "Evaluation & XGBoost — going beyond vanilla GBM",
    map: "Evaluation",
    why: "Knowing the right evaluation metrics and understanding how XGBoost improves on vanilla GBM is essential for using boosting effectively in practice.",
    render: (trace) => {
      // R² calculation on our toy data
      const finalPreds = trace.preds;
      const yMean = BOOST_REG.ys.reduce((a, b) => a + b, 0) / BOOST_REG.ys.length;
      const ssTot = BOOST_REG.ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
      const ssRes = BOOST_REG.ys.reduce((s, y, i) => s + (y - finalPreds[i]) ** 2, 0);
      const r2 = 1 - ssRes / ssTot;

      return (
        <>
          <Lead>
            For regression, the primary metrics are <b>MSE</b> (Mean Squared Error),
            <b> RMSE</b> (Root MSE, same units as y), and <b>R²</b> (coefficient of determination).
            R² = 1 − SS_res/SS_tot measures how much variance the model explains.
            R² = 1.0 is a perfect fit; R² = 0 means the model does no better than predicting
            the mean (which is exactly what F₀ does). Our 3-tree model achieves R² = {fmt(r2, 3)}.
          </Lead>
          <Lead>
            <b>XGBoost</b> (Chen & Guestrin, 2016) is the most widely deployed gradient boosting
            implementation. It extends vanilla GBM with four key improvements: (1) second-order
            gradients for better leaf value estimation, (2) L1/L2 regularization on leaf weights,
            (3) native missing value handling, and (4) parallel column subsampling like Random Forest.
            These improvements make XGBoost substantially more accurate and faster than scikit-learn's GBM.
          </Lead>

          <div className="nn-calc" style={{ marginTop: 4 }}>
            <div className="nn-calc-h">Evaluation on toy data (3 trees, η={BOOST_REG.eta})</div>
            <div className="nn-calc-row">MSE = {fmt(trace.mse, 4)}</div>
            <div className="nn-calc-row">RMSE = √{fmt(trace.mse, 4)} = {fmt(Math.sqrt(trace.mse), 3)} $100k</div>
            <div className="nn-calc-row">R² = 1 − {fmt(ssRes, 3)} / {fmt(ssTot, 3)} = <b>{fmt(r2, 3)}</b> (explains {(r2 * 100).toFixed(1)}% of variance)</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "14px 0" }}>
            <div style={{ background: "var(--accent-soft)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 8 }}>Vanilla GBM (scikit-learn)</div>
              <ul style={{ fontSize: 12, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.75 }}>
                <li>First-order gradients only</li>
                <li>No built-in regularization</li>
                <li>Requires imputation for missing values</li>
                <li>Single-threaded tree building</li>
                <li>Simple, easy to understand</li>
              </ul>
            </div>
            <div style={{ background: "rgba(124,92,255,.08)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7c5cff", marginBottom: 8 }}>XGBoost improvements</div>
              <ul style={{ fontSize: 12, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.75 }}>
                <li>Second-order gradients (Hessian) — Newton step</li>
                <li>L1 + L2 regularization on leaf weights (α, λ)</li>
                <li>Missing value handling — learned default direction</li>
                <li>Column subsampling per tree / per split</li>
                <li>GPU training, distributed computing</li>
              </ul>
            </div>
          </div>

          <div className="tf-subhead">XGBoost leaf value formula</div>
          <Formula label="XGBoost leaf">
            w* = −ΣGᵢ / (ΣHᵢ + λ)  where G = ∂L/∂F (gradient), H = ∂²L/∂F² (Hessian), λ = L2 regularization
          </Formula>
          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
            For MSE loss: Gᵢ = Fᵢ − yᵢ (residual), Hᵢ = 1. So XGBoost leaf = −Σ(Fᵢ−yᵢ)/(n+λ),
            which equals the mean residual regularized toward zero. For log-loss: Hᵢ = pᵢ(1−pᵢ),
            so confident predictions get smaller updates — automatic "confidence-aware" learning rate.
          </div>

          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1f9e6b", marginBottom: 6 }}>When GBM/XGBoost wins</div>
              <ul style={{ fontSize: 13, margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
                <li>Tabular / structured data</li>
                <li>Kaggle-style competitions</li>
                <li>Mixed numerical + categorical features</li>
                <li>Missing values in features</li>
                <li>When precision matters more than training speed</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e0492e", marginBottom: 6 }}>When Random Forest wins</div>
              <ul style={{ fontSize: 13, margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
                <li>Quick baseline needed (less tuning)</li>
                <li>Small datasets (RF less prone to overfit)</li>
                <li>Training speed is a priority</li>
                <li>Interpretability via feature importances</li>
                <li>No validation set for early stopping</li>
              </ul>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14, fontSize: 12 }}>
            {[
              { name: "XGBoost", notes: "2nd-order gradients, regularization, GPU. The original Kaggle workhorse." },
              { name: "LightGBM", notes: "Histogram-based splits, leaf-wise growth. Fastest on large datasets (>100k rows)." },
              { name: "CatBoost", notes: "Native categoricals, ordered boosting. Best out-of-the-box without tuning." },
            ].map(pkg => (
              <div key={pkg.name} style={{ background: "var(--accent-soft)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontWeight: 700, color: "var(--accent-ink)", marginBottom: 4 }}>{pkg.name}</div>
                <div style={{ color: "var(--muted)", lineHeight: 1.5 }}>{pkg.notes}</div>
              </div>
            ))}
          </div>
        </>
      );
    },
  };

  const stageHyperparams = {
    id: "hyperparams",
    group: "Practical",
    title: "Hyperparameters & when to use",
    map: "Hyperparams",
    why: "GBM has more hyperparameters than Random Forest — but with a methodical tuning strategy you can reliably reach state-of-the-art performance.",
    render: () => (
      <>
        <Lead>Gradient Boosting is the algorithm behind XGBoost, LightGBM, and CatBoost — the models that win Kaggle competitions. sklearn's GradientBoostingRegressor is the textbook implementation. The two most important knobs: n_estimators (how many trees) and learning_rate (how much each tree contributes). They interact: smaller learning_rate needs more trees.</Lead>
        <div style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-ink)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
          The golden rule: <strong>lower learning_rate + more trees = better generalization</strong> (but slower training). Use learning_rate=0.05–0.1 with n_estimators=200–500 as a starting point, then fine-tune.
        </div>
        <div className="tf-subhead">Key hyperparameters</div>
        <div className="tf-legend">
          {[
            ["n_estimators", "Number of boosting rounds", "Default 100. More trees → lower bias, but risk of overfitting if learning_rate is too high. Monitor validation loss vs n_estimators. Use early stopping if available."],
            ["learning_rate", "Shrinkage / step size", "Default 0.1. Scales each tree's contribution. Lower = more trees needed but better generalization. Typical range: 0.01–0.3. Always tune together with n_estimators."],
            ["max_depth", "Depth per tree", "Default 3. GBM trees are intentionally shallow (3–5). Deeper trees → higher variance → overfitting. Unlike RF, GBM is sensitive to depth."],
            ["subsample", "Row subsampling fraction", "Default 1.0 (all rows). Set 0.5–0.8 for Stochastic GBM — adds randomness, reduces overfitting, slightly faster. Similar to dropout."],
            ["min_samples_leaf", "Min samples per leaf", "Default 1. Increase to 5–20 on noisy datasets. Strong regularizer — more effective than max_depth for GBM."],
            ["max_features", "Features per split", "Default None (all). Set 'sqrt' or 0.5–0.8 to add column subsampling — reduces correlation between trees."],
            ["loss", "Loss function to minimize", "'squared_error' (default). 'absolute_error' for outlier-robust regression. 'huber' = blend of both — best when outliers exist but aren't extreme."],
            ["validation_fraction + n_iter_no_change", "Early stopping", "Set validation_fraction=0.1, n_iter_no_change=10 to stop automatically when validation loss stops improving. Essential with many trees."],
          ].map(([sym, name, desc]) => (
            <div className="tf-leg" key={sym}>
              <div className="tf-leg-top"><span className="tf-sym" style={{ fontSize: 10.5 }}>{sym}</span></div>
              <div className="tf-leg-name">{name}</div>
              <div className="tf-leg-desc">{desc}</div>
            </div>
          ))}
        </div>
        <div className="tf-subhead">Pros vs Cons</div>
        <div className="opt-pc">
          <div className="opt-pc-col is-pro">
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#2e7d32" }}>Advantages</div>
            {[
              "Best-in-class accuracy on tabular data",
              "Handles mixed feature types naturally",
              "Built-in feature importance scores",
              "Flexible loss functions (MSE, MAE, Huber)",
              "Robust to outliers in input features",
            ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
          </div>
          <div className="opt-pc-col is-con">
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
            {[
              "Slow training — sequential, not parallelizable",
              "Many interacting hyperparameters to tune",
              "Sensitive to learning_rate + n_estimators interaction",
              "Can overfit on noisy small datasets",
              "Not interpretable (black box)",
            ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✗ {t}</div>)}
          </div>
        </div>
        <div className="tf-subhead">When to use (decision guide)</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Scenario</th>
                <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Best choice</th>
                <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Why</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Maximum accuracy on structured/tabular data", "XGBoost / LightGBM", "Modern GBM implementations with regularization + faster training"],
                ["Need interpretable model", "Linear Regression or single Decision Tree", "GBM is a black box"],
                ["Fast training required", "Random Forest or LightGBM", "RF parallelizes; LightGBM uses histogram splits"],
                ["Outliers in target variable", "GBM with loss='huber'", "Huber loss is robust to extreme residuals"],
                ["Very large dataset (> 1M rows)", "LightGBM", "Histogram-based approach is 10–100x faster than sklearn GBM"],
                ["Small dataset (< 500 rows)", "Random Forest or Ridge Regression", "GBM needs enough data to benefit from sequential correction"],
              ].map(([sc, ch, wh], i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                  <td style={{ padding: "7px 12px" }}>{sc}</td>
                  <td style={{ padding: "7px 12px", fontWeight: 600 }}>{ch}</td>
                  <td style={{ padding: "7px 12px", color: "#555" }}>{wh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  ASSEMBLE STAGES
  // ────────────────────────────────────────────────────────
  window.ML_STAGES = [
    stageOverview,
    stageDataset,
    stageInit,
    stageTree1,
    stageTree2,
    stageTree3,
    stageSeqTrees,
    stageBoostAnim,
    stageEnsemble,
    stageEta,
    stageMissing,
    stageEval,
    stageHyperparams,
  ];

  // ── META ──
  window.ML_META = {
    title: "Gradient Boosting",
    subtitle: "Regression — sequential residual fitting",
    cur: "Gradient Boosting (Regression)",
    category: "Ensemble Methods",
    run: runBoostReg,
    default: { ...BOOST_REG.default },
    modeLinks: [
      { label: "Regression", href: "Gradient Boosting (Regression).html", active: true },
      { label: "Classification", href: "Gradient Boosting (Classification).html", active: false },
    ],
    renderInput: (input, setInput, trace) => (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">age (x)</span>
          <input type="range" min="5" max="42" step="1" value={input.x}
            onChange={e => setInput({ ...input, x: parseInt(e.target.value) })} />
          <span className="nn-slider-v">{input.x} yr</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">nTrees</span>
          <input type="range" min="1" max="3" step="1" value={input.nTrees}
            onChange={e => setInput({ ...input, nTrees: parseInt(e.target.value) })} />
          <span className="nn-slider-v">{input.nTrees}</span>
        </label>
        <span style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 4 }}>
          pred: <b style={{ color: "var(--accent-ink)" }}>{fmt(trace.queryPred, 2)} $100k</b>
           | MSE: <b>{fmt(trace.mse, 4)}</b>
        </span>
      </>
    ),
  };
})();
