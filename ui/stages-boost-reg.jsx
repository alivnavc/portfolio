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
  function StepLine({ preds, color = "var(--accent)", label }) {
    // build step-function path from sorted (x, pred) pairs
    const sorted = BOOST_REG.xs.map((x, i) => ({ x, p: preds[i] })).sort((a, b) => a.x - b.x);
    // draw horizontal segments
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
            stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
        ))}
        {segments.slice(0, -1).map((seg, i) => (
          <line key={"v" + i}
            x1={sx((sorted[i].x + sorted[i + 1].x) / 2)}
            y1={sy(Math.max(yMin, Math.min(yMax, seg.p)))}
            x2={sx((sorted[i].x + sorted[i + 1].x) / 2)}
            y2={sy(Math.max(yMin, Math.min(yMax, segments[i + 1].p)))}
            stroke={color} strokeWidth="2.5" opacity="0.5" />
        ))}
      </>
    );
  }

  // ── residual bars ──
  function ResidualBars({ residuals }) {
    return (
      <>
        {BOOST_REG.xs.map((x, i) => {
          const r = residuals[i];
          const yBase = sy(0);
          const yTip = sy(r);
          const col = r >= 0 ? "#1f9e6b" : "#e0492e";
          return (
            <line key={i} x1={sx(x)} y1={yBase} x2={sx(x)} y2={yTip}
              stroke={col} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          );
        })}
        <line x1={PAD.l} y1={sy(0)} x2={W - PAD.r} y2={sy(0)}
          stroke="var(--faint)" strokeWidth="1" strokeDasharray="4 3" />
      </>
    );
  }

  // ── MSE progress bars ──
  function MSEBars({ rounds }) {
    const maxMSE = rounds[0].mse;
    const barW = 280;
    return (
      <div style={{ margin: "12px 0" }}>
        {rounds.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)", width: 68, flexShrink: 0 }}>
              {i === 0 ? "Init (F₀)" : `After T${i}`}
            </span>
            <div style={{ flex: 1, background: "var(--line-soft)", borderRadius: 4, height: 14, overflow: "hidden", maxWidth: barW }}>
              <div style={{
                height: "100%", borderRadius: 4,
                width: `${(r.mse / maxMSE) * 100}%`,
                background: i === 0 ? "#e0492e" : `hsl(${140 + i * 30}, 60%, 42%)`,
                transition: "width 0.4s ease"
              }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: "var(--num-font)", color: "var(--ink)", width: 52, flexShrink: 0 }}>
              {r.mse.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── stump diagram SVG ──
  function StumpSvg({ stump, label, showPreds, xs }) {
    const W2 = 260, H2 = 140;
    const midX = W2 / 2;
    const rootY = 32, childY = 100;
    const leftX = 60, rightX = W2 - 60;
    const isLeft = xs ? xs.map(x => x <= stump.threshold) : [];
    return (
      <svg width={W2} height={H2} style={{ overflow: "visible" }}>
        <line x1={midX} y1={rootY + 16} x2={leftX} y2={childY - 16} stroke="var(--line)" strokeWidth="1.5" />
        <line x1={midX} y1={rootY + 16} x2={rightX} y2={childY - 16} stroke="var(--line)" strokeWidth="1.5" />
        <text x={(midX + leftX) / 2 - 12} y={(rootY + childY) / 2 + 2} fontSize="10" fill="var(--muted)" fontStyle="italic">yes</text>
        <text x={(midX + rightX) / 2 + 8} y={(rootY + childY) / 2 + 2} fontSize="10" fill="var(--muted)" fontStyle="italic">no</text>
        {/* root */}
        <rect x={midX - 68} y={rootY - 16} width={136} height={32} rx="8"
          fill="var(--panel-solid)" stroke="var(--accent)" strokeWidth="2" />
        <text x={midX} y={rootY + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">
          age ≤ {stump.threshold}?
        </text>
        {/* left leaf */}
        <rect x={leftX - 38} y={childY - 16} width={76} height={32} rx="8"
          fill={stump.leftVal >= 0 ? "rgba(31,158,107,.15)" : "rgba(224,73,46,.12)"}
          stroke={stump.leftVal >= 0 ? "#1f9e6b" : "#e0492e"} strokeWidth="1.5" />
        <text x={leftX} y={childY - 1} textAnchor="middle" fontSize="11" fontWeight="700"
          fill={stump.leftVal >= 0 ? "#1f9e6b" : "#e0492e"}>
          {fmt(stump.leftVal, 3)}
        </text>
        <text x={leftX} y={childY + 12} textAnchor="middle" fontSize="9" fill="var(--muted)">age ≤ {stump.threshold}</text>
        {/* right leaf */}
        <rect x={rightX - 38} y={childY - 16} width={76} height={32} rx="8"
          fill={stump.rightVal >= 0 ? "rgba(31,158,107,.15)" : "rgba(224,73,46,.12)"}
          stroke={stump.rightVal >= 0 ? "#1f9e6b" : "#e0492e"} strokeWidth="1.5" />
        <text x={rightX} y={childY - 1} textAnchor="middle" fontSize="11" fontWeight="700"
          fill={stump.rightVal >= 0 ? "#1f9e6b" : "#e0492e"}>
          {fmt(stump.rightVal, 3)}
        </text>
        <text x={rightX} y={childY + 12} textAnchor="middle" fontSize="9" fill="var(--muted)">age > {stump.threshold}</text>
        {label && <text x={midX} y={H2 - 2} textAnchor="middle" fontSize="10" fill="var(--faint)">{label}</text>}
      </svg>
    );
  }

  // ── color palette for multi-round lines ──
  const ROUND_COLORS = ["#94A2BC", "#f59e0b", "#2B5BFF"];

  // ────────────────────────────────────────────────────────
  //  STAGES
  // ────────────────────────────────────────────────────────
  window.ML_STAGES = [

    // ── Stage 1: Overview ──
    {
      id: "overview", group: "Overview", title: "Gradient Boosting — sequential ensemble learning",
      map: "Overview",
      why: "Understand the high-level idea before diving into the math. Boosting is fundamentally different from bagging — it's sequential, not parallel.",
      render: (trace) => (
        <>
          <Lead>
            <b>Gradient Boosting</b> builds an ensemble of weak learners (usually shallow trees) <em>one at a time</em>.
            Each new tree corrects the <b>residual errors</b> left by all previous trees. The key idea:
            instead of fitting the original targets, fit the <em>gradients of the loss</em>.
          </Lead>

          {/* Architecture flow */}
          <div style={{ margin: "20px 0 10px" }}>
            <div className="tf-subhead">Sequential boosting pipeline</div>
            <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", margin: "12px 0" }}>
              {[
                { label: "Initial pred", sub: "F₀ = mean(y)", color: "#94A2BC" },
                null,
                { label: "Residuals", sub: "r = y − F₀", color: "#f59e0b" },
                null,
                { label: "Tree 1", sub: "fit residuals", color: "#2B5BFF" },
                null,
                { label: "Update", sub: "F₁ = F₀ + η·T₁", color: "#7c5cff" },
                null,
                { label: "Tree 2", sub: "fit new resid.", color: "#2B5BFF" },
                null,
                { label: "⋯", sub: "", color: "var(--muted)" },
                null,
                { label: "Final", sub: "F = Σ η·Tₜ", color: "#1f9e6b" },
              ].map((item, i) =>
                item === null ? (
                  <div key={i} style={{ fontSize: 18, color: "var(--faint)", padding: "0 2px" }}>→</div>
                ) : (
                  <div key={i} style={{
                    padding: "7px 10px", borderRadius: 8, textAlign: "center", minWidth: 72,
                    background: item.color === "var(--muted)" ? "transparent" : `${item.color}18`,
                    border: `1.5px solid ${item.color === "var(--muted)" ? "transparent" : item.color + "44"}`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.label}</div>
                    {item.sub && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{item.sub}</div>}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="tf-legend">
            {[
              ["Sequential", "Trees are built one after another — each tree knows about all previous trees."],
              ["Residual fitting", "Each tree is trained on the errors (residuals) of the current ensemble, not the original targets."],
              ["Learning rate η", "Each tree's contribution is shrunk by η < 1 to prevent overfitting."],
              ["Weak learners", "Shallow trees (depth 1–3) are ideal — they correct one mistake at a time."],
            ].map(([name, desc]) => (
              <div className="tf-leg" key={name}>
                <div className="tf-leg-name">{name}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div style={{ background: "var(--accent-soft)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>Gradient Boosting</div>
              <ul style={{ fontSize: 13, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.7 }}>
                <li>Trees built sequentially</li>
                <li>Each corrects previous errors</li>
                <li>Fits gradients of loss function</li>
                <li>Learning rate controls step size</li>
              </ul>
            </div>
            <div style={{ background: "rgba(31,158,107,.08)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1f9e6b", marginBottom: 6 }}>Random Forest (comparison)</div>
              <ul style={{ fontSize: 13, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.7 }}>
                <li>Trees built in parallel</li>
                <li>Each trained independently</li>
                <li>Diversity from random sampling</li>
                <li>Vote/average at the end</li>
              </ul>
            </div>
          </div>
        </>
      ),
    },

    // ── Stage 2: Dataset ──
    {
      id: "dataset", group: "Data", title: "Dataset — house age vs. price",
      map: "Dataset",
      why: "We need to understand the data before building our model. With only 8 points and a 1D feature, we can visualize every boosting step clearly.",
      render: (trace) => (
        <>
          <Lead>
            Our training data has 8 houses described by <b>age (years)</b>. We want to predict
            <b> price ($100k)</b>. Older houses tend to cost less — a clear downward trend.
            Move the slider to set the query age.
          </Lead>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
            <ScatterAxes />
            <DataDots queryX={trace.input.x} />
          </svg>
          <div className="tf-subhead" style={{ marginTop: 12 }}>Training data</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["#", "age", "price ($100k)"].map(h => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>The goal is to predict price for a house of <b>age = {trace.input.x}</b> years.
            After training, our ensemble will output a single number — the predicted price.
          </Note>
        </>
      ),
    },

    // ── Stage 3: Initial Prediction ──
    {
      id: "init", group: "Boosting", title: "Step 0 — initial prediction: mean of targets",
      map: "Init pred",
      why: "Gradient boosting starts with the simplest possible prediction: the mean. This is the constant that minimizes MSE before seeing any features.",
      render: (trace) => {
        const r0 = trace.rounds[0];
        const initP = trace.initPred;
        return (
          <>
            <Lead>
              Before any tree, we predict the <b>global mean</b> of all training targets.
              This is F₀(x) = mean(y) = {fmt(initP)}. All 8 houses get the same prediction,
              resulting in <b>large residuals</b> (vertical bars).
            </Lead>
            <Formula label="F₀(x)">
              F₀(x) = mean(y) = ({BOOST_REG.ys.join(" + ")}) / 8 = <b>{fmt(initP)}</b>
            </Formula>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
              <ScatterAxes />
              {/* flat prediction line */}
              <line x1={PAD.l} y1={sy(initP)} x2={W - PAD.r} y2={sy(initP)}
                stroke="#94A2BC" strokeWidth="2.5" strokeDasharray="6 3" opacity="0.8" />
              <text x={W - PAD.r - 4} y={sy(initP) - 5} textAnchor="end" fontSize="10" fill="#94A2BC" fontWeight="600">
                F₀ = {fmt(initP)}
              </text>
              {/* residual lines */}
              {BOOST_REG.xs.map((x, i) => (
                <line key={i}
                  x1={sx(x)} y1={sy(initP)} x2={sx(x)} y2={sy(BOOST_REG.ys[i])}
                  stroke={BOOST_REG.ys[i] > initP ? "#1f9e6b" : "#e0492e"}
                  strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              ))}
              <DataDots queryX={trace.input.x} />
            </svg>
            <div className="tf-subhead">Initial residuals (y − F₀)</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    {["age", "true y", "F₀", "residual r = y − F₀"].map(h => (
                      <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BOOST_REG.xs.map((x, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{x}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{BOOST_REG.ys[i]}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(initP)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: 700,
                        color: r0.residuals[i] >= 0 ? "#1f9e6b" : "#e0492e" }}>
                        {fmt(r0.residuals[i], 3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="nn-calc" style={{ marginTop: 10 }}>
              <div className="nn-calc-h">Initial MSE</div>
              <div className="nn-calc-row">
                MSE = (1/n) Σ(y − F₀)² = <b>{fmt(r0.mse, 4)}</b> — this is what we must reduce.
              </div>
            </div>
          </>
        );
      },
    },

    // ── Stage 4: Residuals ──
    {
      id: "residuals", group: "Boosting", title: "Residuals = the gradient signal",
      map: "Residuals",
      why: "In gradient boosting with MSE loss, the negative gradient equals the residuals. This is what makes it 'gradient' boosting — we follow the gradient of the loss.",
      render: (trace) => {
        const r0 = trace.rounds[0];
        // residual SVG — y-axis is residuals
        const rMin = -4, rMax = 4;
        const sry = v => PAD.t + (1 - (v - rMin) / (rMax - rMin)) * (H - PAD.t - PAD.b);
        return (
          <>
            <Lead>
              The <b>residual</b> rᵢ = yᵢ − F₀(xᵢ) tells us: how much does the prediction need to
              increase (positive) or decrease (negative)? In MSE, this equals the <b>negative gradient</b> of the loss.
              The next tree will be trained to predict these residuals.
            </Lead>
            <Formula label="Gradient of MSE">
              −∂L/∂F = −∂[(y−F)²/2]/∂F = (y − F) = residual
            </Formula>
            <div className="tf-subhead">Residual plot (F₀ errors)</div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
              <ScatterAxes yLabel="residual (y − F₀)" xLabel="age (years)" />
              {/* zero line */}
              <line x1={PAD.l} y1={sry(0)} x2={W - PAD.r} y2={sry(0)}
                stroke="var(--faint)" strokeWidth="1" strokeDasharray="4 3" />
              {BOOST_REG.xs.map((x, i) => {
                const r = r0.residuals[i];
                return (
                  <g key={i}>
                    <line x1={sx(x)} y1={sry(0)} x2={sx(x)} y2={sry(r)}
                      stroke={r >= 0 ? "#1f9e6b" : "#e0492e"} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
                    <circle cx={sx(x)} cy={sry(r)} r="4"
                      fill={r >= 0 ? "#1f9e6b" : "#e0492e"} />
                    <text x={sx(x)} y={sry(r) + (r >= 0 ? -7 : 14)} textAnchor="middle" fontSize="9" fill="var(--muted)">
                      {fmt(r, 2)}
                    </text>
                  </g>
                );
              })}
              {/* y-axis ticks for residuals */}
              {[-3, -2, -1, 0, 1, 2, 3].map(v => (
                <g key={v}>
                  <line x1={PAD.l - 4} y1={sry(v)} x2={PAD.l} y2={sry(v)} stroke="var(--ink)" strokeWidth="1" />
                  <text x={PAD.l - 6} y={sry(v) + 4} textAnchor="end" fontSize="9" fill="var(--muted)">{v}</text>
                </g>
              ))}
            </svg>
            <div className="tf-legend" style={{ marginTop: 12 }}>
              {[
                ["Green bars (positive)", "Model predicted too low — next tree should push prediction UP"],
                ["Red bars (negative)", "Model predicted too high — next tree should push prediction DOWN"],
                ["Tree 1 will fit these", "Tree 1 is a regression tree trained on {(xᵢ, rᵢ)} pairs, not (xᵢ, yᵢ)"],
              ].map(([n, d]) => (
                <div className="tf-leg" key={n}>
                  <div className="tf-leg-name">{n}</div>
                  <div className="tf-leg-desc">{d}</div>
                </div>
              ))}
            </div>
          </>
        );
      },
    },

    // ── Stage 5: Tree 1 ──
    {
      id: "tree1", group: "Boosting", title: "Tree 1 — fit the residuals with a stump",
      map: "Tree 1",
      why: "The first tree splits data at age=16 — young houses have positive residuals (underpredicted) and old houses have negative residuals (overpredicted). One split captures this pattern.",
      render: (trace) => {
        const stump = BOOST_REG.stumps[0];
        const r0 = trace.rounds[0];
        return (
          <>
            <Lead>
              Tree 1 is a <b>decision stump</b> (depth-1 tree) trained to predict the residuals from Step 0.
              It finds the best split: <b>age ≤ 16</b>. Left leaf = average residual for young houses,
              right leaf = average residual for old houses.
            </Lead>
            <Row>
              <div>
                <div className="tf-subhead">Stump 1 structure</div>
                <StumpSvg stump={stump} label="splits at age=16" />
              </div>
              <div>
                <div className="tf-subhead">Leaf averages</div>
                <div className="nn-calc" style={{ minWidth: 220 }}>
                  <div className="nn-calc-h">Left leaf (age ≤ 16, n=4)</div>
                  <div className="nn-calc-row">
                    residuals: {r0.residuals.filter((_, i) => BOOST_REG.xs[i] <= 16).map(r => fmt(r, 2)).join(", ")}
                  </div>
                  <div className="nn-calc-row">
                    avg = <b style={{ color: "#1f9e6b" }}>{fmt(stump.leftVal, 3)}</b>
                  </div>
                  <div className="nn-calc-h" style={{ marginTop: 8 }}>Right leaf (age > 16, n=4)</div>
                  <div className="nn-calc-row">
                    residuals: {r0.residuals.filter((_, i) => BOOST_REG.xs[i] > 16).map(r => fmt(r, 2)).join(", ")}
                  </div>
                  <div className="nn-calc-row">
                    avg = <b style={{ color: "#e0492e" }}>{fmt(stump.rightVal, 3)}</b>
                  </div>
                </div>
              </div>
            </Row>
            <div className="tf-subhead" style={{ marginTop: 8 }}>Tree 1 predictions for each point</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    {["age", "residual rᵢ", "tree1(xᵢ)", "correct direction?"].map(h => (
                      <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BOOST_REG.xs.map((x, i) => {
                    const pred = x <= stump.threshold ? stump.leftVal : stump.rightVal;
                    const correct = (r0.residuals[i] >= 0 && pred >= 0) || (r0.residuals[i] < 0 && pred < 0);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                        <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{x}</td>
                        <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)",
                          color: r0.residuals[i] >= 0 ? "#1f9e6b" : "#e0492e", fontWeight: 600 }}>
                          {fmt(r0.residuals[i], 3)}
                        </td>
                        <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)",
                          color: pred >= 0 ? "#1f9e6b" : "#e0492e" }}>
                          {fmt(pred, 3)}
                        </td>
                        <td style={{ padding: "4px 8px", fontSize: 14 }}>{correct ? "✓" : "✗"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        );
      },
    },

    // ── Stage 6: Update after Tree 1 ──
    {
      id: "update1", group: "Boosting", title: "Update — F₁ = F₀ + η × Tree 1",
      map: "After T1",
      why: "We don't add the full tree prediction — we scale it by η=0.5 (learning rate). This shrinkage prevents any single tree from dominating and overfitting.",
      render: (trace) => {
        const r0 = trace.rounds[0];
        const r1 = trace.rounds[Math.min(1, trace.rounds.length - 1)];
        const stump = BOOST_REG.stumps[0];
        const eta = BOOST_REG.eta;
        return (
          <>
            <Lead>
              We update predictions: <b>F₁(x) = F₀(x) + η × T₁(x)</b>. With η=0.5, houses with
              age ≤ 16 gain +{fmt(eta * stump.leftVal, 3)} and houses with age > 16 gain {fmt(eta * stump.rightVal, 3)}.
              The flat line becomes a <b>step function</b>.
            </Lead>
            <Formula label="Update rule">
              F₁(x) = F₀(x) + <b>η</b> × T₁(x) = {fmt(trace.initPred)} + <b>{eta}</b> × T₁(x)
            </Formula>
            <div className="tf-subhead">Prediction before and after Tree 1</div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
              <ScatterAxes />
              {/* old flat line */}
              <line x1={PAD.l} y1={sy(trace.initPred)} x2={W - PAD.r} y2={sy(trace.initPred)}
                stroke="#94A2BC" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />
              <text x={PAD.l + 4} y={sy(trace.initPred) - 5} fontSize="10" fill="#94A2BC">F₀</text>
              {/* new step line */}
              <StepLine preds={r1.preds} color="#f59e0b" />
              <DataDots queryX={trace.input.x} />
              {/* residual bars after update */}
              {BOOST_REG.xs.map((x, i) => (
                <line key={i}
                  x1={sx(x)} y1={sy(r1.preds[i])} x2={sx(x)} y2={sy(BOOST_REG.ys[i])}
                  stroke={r1.residuals[i] >= 0 ? "#1f9e6b" : "#e0492e"}
                  strokeWidth="2" strokeLinecap="round" opacity="0.5" />
              ))}
            </svg>
            <div className="tf-subhead">MSE reduced</div>
            <MSEBars rounds={trace.rounds.slice(0, 2)} />
            <div className="nn-calc">
              <div className="nn-calc-h">Update for age = {trace.input.x}</div>
              <div className="nn-calc-row">T₁({trace.input.x}) = {trace.input.x <= stump.threshold ? fmt(stump.leftVal, 3) + " (left leaf)" : fmt(stump.rightVal, 3) + " (right leaf)"}</div>
              <div className="nn-calc-row">F₁({trace.input.x}) = {fmt(trace.initPred)} + {eta} × {trace.input.x <= stump.threshold ? fmt(stump.leftVal, 3) : fmt(stump.rightVal, 3)} = <b>{fmt(trace.rounds[Math.min(1, trace.rounds.length - 1)].preds[BOOST_REG.xs.findIndex(x => x === trace.input.x)] ?? (trace.initPred + eta * (trace.input.x <= stump.threshold ? stump.leftVal : stump.rightVal)), 3)}</b></div>
            </div>
          </>
        );
      },
    },

    // ── Stage 7: Tree 2 ──
    {
      id: "tree2", group: "Boosting", title: "Tree 2 — fit residuals after F₁",
      map: "Tree 2",
      why: "After Tree 1, residuals are smaller but not zero. Tree 2 looks at the new residuals and finds the next best split, refining the ensemble further.",
      render: (trace) => {
        const stump2 = BOOST_REG.stumps[1];
        const r1 = trace.rounds[Math.min(1, trace.rounds.length - 1)];
        const r2 = trace.rounds[Math.min(2, trace.rounds.length - 1)];
        return (
          <>
            <Lead>
              After updating F₁, we compute new residuals and train <b>Tree 2</b> on them.
              Tree 2 splits at <b>age ≤ 10</b>, targeting the finer structure still missed.
              Leaf values are now much smaller — we've already corrected the major error.
            </Lead>
            <Row>
              <div>
                <div className="tf-subhead">Stump 2 structure</div>
                <StumpSvg stump={stump2} label="splits at age=10" />
              </div>
              <div>
                <div className="tf-subhead">Residuals after F₁</div>
                <div className="nn-calc" style={{ minWidth: 220 }}>
                  <div className="nn-calc-h">New residuals (smaller!)</div>
                  {r1.residuals.map((r, i) => (
                    <div key={i} className="nn-calc-row" style={{ fontSize: 11 }}>
                      age={BOOST_REG.xs[i]}: r = <b style={{ color: r >= 0 ? "#1f9e6b" : "#e0492e" }}>{fmt(r, 3)}</b>
                    </div>
                  ))}
                </div>
              </div>
            </Row>
            <div className="tf-subhead">Prediction after Trees 1 + 2</div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
              <ScatterAxes />
              <StepLine preds={r1.preds} color="#f59e0b" />
              <StepLine preds={r2.preds} color="#2B5BFF" />
              <DataDots queryX={trace.input.x} />
            </svg>
            <div style={{ display: "flex", gap: 16, fontSize: 12, margin: "6px 0 10px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 20, height: 2, background: "#f59e0b", display: "inline-block" }} />
                After T1
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 20, height: 2, background: "#2B5BFF", display: "inline-block" }} />
                After T2
              </span>
            </div>
            <MSEBars rounds={trace.rounds.slice(0, 3)} />
          </>
        );
      },
    },

    // ── Stage 8: Full ensemble ──
    {
      id: "ensemble", group: "Boosting", title: "Full ensemble — 3 trees combined",
      map: "Ensemble",
      why: "With the nTrees slider you can see how each additional tree refines the prediction curve. The step function becomes a closer approximation of the true underlying pattern.",
      render: (trace, ctx) => {
        const { input, setInput } = ctx;
        const activeRound = trace.rounds[trace.rounds.length - 1];
        const allMSEs = trace.rounds.map(r => r.mse);
        return (
          <>
            <Lead>
              The final ensemble is <b>F(x) = F₀ + η·T₁ + η·T₂ + η·T₃</b>. Use the nTrees
              slider (in the header) to see each tree's contribution. Each tree adds a refinement
              to the step function, bringing MSE down progressively.
            </Lead>
            <div className="tf-subhead">Ensemble prediction curve</div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
              <ScatterAxes />
              {/* show each active round's line with fading opacity */}
              {trace.rounds.slice(1).map((r, t) => (
                <StepLine key={t} preds={r.preds}
                  color={ROUND_COLORS[t] || "#2B5BFF"} />
              ))}
              <DataDots queryX={input.x} />
              {/* final prediction marker */}
              <circle cx={sx(input.x)} cy={sy(Math.max(yMin, Math.min(yMax, trace.queryPred)))} r={7}
                fill="#e0492e" stroke="white" strokeWidth="2" />
              <text x={sx(input.x) + 10} y={sy(Math.max(yMin, Math.min(yMax, trace.queryPred))) - 6}
                fontSize="11" fill="#e0492e" fontWeight="700">
                {fmt(trace.queryPred)} $100k
              </text>
            </svg>
            <div className="tf-subhead">MSE reduction per round</div>
            <MSEBars rounds={trace.rounds} />
            <div className="nn-calc">
              <div className="nn-calc-h">Prediction for age = {input.x} with {input.nTrees} tree(s)</div>
              <div className="nn-calc-row">F₀ = {fmt(trace.initPred)}</div>
              {trace.rounds.slice(1).map((r, t) => {
                const stump = BOOST_REG.stumps[t];
                const sp = input.x <= stump.threshold ? stump.leftVal : stump.rightVal;
                return (
                  <div key={t} className="nn-calc-row">
                    + η × T{t + 1}({input.x}) = {BOOST_REG.eta} × {fmt(sp, 3)} = <b>{fmt(BOOST_REG.eta * sp, 3)}</b>
                  </div>
                );
              })}
              <div className="nn-calc-row">
                <b>= {fmt(trace.queryPred, 3)} $100k</b>
              </div>
            </div>
          </>
        );
      },
    },

    // ── Stage 9: Learning Rate ──
    {
      id: "eta", group: "Concepts", title: "Learning rate η — shrinkage prevents overfitting",
      map: "Learning rate",
      why: "The learning rate is one of the most important hyperparameters. Too high → overfit fast with few trees. Too low → need many trees but generalizes better.",
      render: (trace) => {
        // Show conceptual illustration with 3 eta values
        const etas = [1.0, 0.5, 0.1];
        const etaColors = ["#e0492e", "#2B5BFF", "#1f9e6b"];
        return (
          <>
            <Lead>
              The learning rate <b>η</b> multiplies each tree's contribution: F(x) += η × T(x).
              A small η forces the model to take small steps — many trees cover the loss landscape
              smoothly rather than jumping over the optimum.
            </Lead>
            <div className="tf-subhead">Effect of η on convergence</div>
            <svg viewBox="0 0 420 180" style={{ width: "100%", maxWidth: 420 }}>
              {/* conceptual loss curves */}
              {etas.map((eta, ei) => {
                // simulate a decay curve
                const pts = [];
                let loss = 3.8;
                for (let t = 0; t <= 30; t++) {
                  const decay = eta === 1.0 ? (t === 0 ? 3.8 : t < 5 ? 3.8 * Math.exp(-1.2 * t) + (t > 3 ? Math.sin(t) * 0.2 : 0) : 0.02 + Math.random() * 0.3) :
                    eta === 0.5 ? 3.8 * Math.exp(-0.35 * t) + 0.08 :
                    3.8 * Math.exp(-0.07 * t) + 0.25;
                  pts.push([t, Math.max(0, decay)]);
                }
                const lx = t => 40 + (t / 30) * 360;
                const ly = v => 160 - Math.min(155, (v / 4) * 155);
                const polyline = pts.map(([t, v]) => `${lx(t)},${ly(v)}`).join(" ");
                return (
                  <polyline key={ei} points={polyline} fill="none"
                    stroke={etaColors[ei]} strokeWidth="2.2" opacity="0.85" />
                );
              })}
              {/* axes */}
              <line x1={40} y1={5} x2={40} y2={165} stroke="var(--line)" strokeWidth="1" />
              <line x1={40} y1={165} x2={400} y2={165} stroke="var(--line)" strokeWidth="1" />
              <text x={220} y={178} textAnchor="middle" fontSize="10" fill="var(--muted)">number of trees</text>
              <text x={14} y={90} textAnchor="middle" fontSize="10" fill="var(--muted)" transform="rotate(-90,14,90)">MSE</text>
              {/* legend */}
              {etas.map((eta, ei) => (
                <g key={ei}>
                  <line x1={50 + ei * 120} y1={22} x2={68 + ei * 120} y2={22} stroke={etaColors[ei]} strokeWidth="2.5" />
                  <text x={72 + ei * 120} y={26} fontSize="10" fill={etaColors[ei]} fontWeight="600">η={eta}</text>
                </g>
              ))}
            </svg>
            <div className="tf-legend" style={{ marginTop: 12 }}>
              {[
                ["η = 1.0 (red)", "Full step — converges fast but may oscillate or overfit. Fewer trees needed."],
                ["η = 0.5 (blue)", "Balanced — our setting. Converges smoothly with 3–10 trees."],
                ["η = 0.1 (green)", "Small steps — very smooth convergence but needs 50–300+ trees for best accuracy."],
                ["Rule of thumb", "Smaller η always needs more trees. XGBoost default is η=0.3; scikit-learn default is 0.1."],
              ].map(([n, d]) => (
                <div className="tf-leg" key={n}>
                  <div className="tf-leg-name">{n}</div>
                  <div className="tf-leg-desc">{d}</div>
                </div>
              ))}
            </div>
            <Note>
              The shrinkage introduced by η makes gradient boosting more <b>regularized</b>.
              It's mathematically equivalent to L2 regularization applied to the tree weights.
            </Note>
          </>
        );
      },
    },

    // ── Stage 10: Hyperparameters ──
    {
      id: "hyperparams", group: "Concepts", title: "Hyperparameters & when to use gradient boosting",
      map: "Hyperparams",
      why: "Knowing when to use gradient boosting vs alternatives is as important as knowing how it works.",
      render: (trace) => (
        <>
          <Lead>
            Gradient boosting is one of the most powerful ML algorithms for structured/tabular data.
            It wins many Kaggle competitions. But it has important hyperparameters to tune and specific
            scenarios where it excels — and where other approaches win.
          </Lead>
          <div className="tf-subhead">Key hyperparameters</div>
          <div className="tf-legend">
            {[
              ["n_estimators", "Number of boosting rounds (trees). More trees → lower training error, risk of overfitting. Use early stopping to find the right value. Typical: 100–1000."],
              ["learning_rate η", "Shrinkage factor per tree (0 < η ≤ 1). Smaller = better generalization but slower. Typical: 0.01–0.3."],
              ["max_depth", "Max depth of each tree. Depth 1 = stumps, depth 3–5 captures interactions. Typical: 3–6."],
              ["subsample", "Fraction of training data used per tree. < 1.0 adds stochasticity (like random forest). Typical: 0.7–1.0."],
              ["min_samples_leaf", "Minimum samples in a leaf node. Higher = simpler trees, less overfitting."],
            ].map(([n, d]) => (
              <div className="tf-leg is-learned" key={n}>
                <div className="tf-leg-name">{n}</div>
                <div className="tf-leg-desc">{d}</div>
              </div>
            ))}
          </div>
          <div className="tf-subhead" style={{ marginTop: 16 }}>When to use gradient boosting</div>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1f9e6b", marginBottom: 8 }}>Use it when…</div>
              <ul style={{ fontSize: 13, margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
                <li>Tabular / structured data</li>
                <li>Mixed numerical + categorical features</li>
                <li>You need high accuracy on a leaderboard</li>
                <li>Missing values present (XGBoost handles natively)</li>
                <li>Moderate dataset size (10k–10M rows)</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e0492e", marginBottom: 8 }}>Skip it when…</div>
              <ul style={{ fontSize: 13, margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
                <li>Image, text, or sequence data → use Neural Networks</li>
                <li>Very small datasets (< 200 rows) → use Linear/KNN</li>
                <li>You need full probabilistic uncertainty → use Bayesian methods</li>
                <li>Online/streaming learning → gradient boosting is batch-only</li>
                <li>Extreme speed requirements at inference time</li>
              </ul>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14, fontSize: 12 }}>
            {[
              { name: "XGBoost", notes: "2nd-order gradients, regularization, column subsampling, GPU" },
              { name: "LightGBM", notes: "Histogram-based splits, leaf-wise growth, fastest on large datasets" },
              { name: "CatBoost", notes: "Handles categoricals natively, ordered boosting reduces target leakage" },
            ].map(pkg => (
              <div key={pkg.name} style={{ background: "var(--accent-soft)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontWeight: 700, color: "var(--accent-ink)", marginBottom: 4 }}>{pkg.name}</div>
                <div style={{ color: "var(--muted)", lineHeight: 1.5 }}>{pkg.notes}</div>
              </div>
            ))}
          </div>
        </>
      ),
    },
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
          pred: <b style={{ color: "var(--accent-ink)" }}>{fmt(trace.queryPred)} $100k</b>
          &nbsp;|&nbsp;MSE: <b>{fmt(trace.mse, 3)}</b>
        </span>
      </>
    ),
  };
})();
