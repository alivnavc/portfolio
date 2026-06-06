/* Logistic Regression explainer stages */
(function () {
  const { V, Sub, Sup, Formula, DotTip, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState, useRef, useEffect } = React;
  const LOG = window.ML_LOG.LOG;
  const sigmoid = window.ML_LOG.sigmoid;

  /* ── helpers ── */
  const W_SVG = 500, H_SVG = 220;
  const PAD = { l: 44, r: 20, t: 18, b: 34 };
  const innerW = W_SVG - PAD.l - PAD.r;
  const innerH = H_SVG - PAD.t - PAD.b;

  // map hours (1–6) to SVG x
  const sx = (h) => PAD.l + ((h - 1) / 5) * innerW;
  // map probability (0–1) to SVG y
  const sy = (p) => PAD.t + (1 - p) * innerH;

  // axis helpers
  function Axes({ xLabel = "hours studied", yLabel = "P(pass)" }) {
    const ticks = [1, 2, 3, 4, 5, 6];
    const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
    return (
      <>
        {/* axes */}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.2" />
        <line x1={PAD.l} y1={PAD.t + innerH} x2={PAD.l + innerW} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.2" />
        {/* x ticks */}
        {ticks.map(h => (
          <g key={h}>
            <line x1={sx(h)} y1={PAD.t + innerH} x2={sx(h)} y2={PAD.t + innerH + 4} stroke="var(--line)" />
            <text x={sx(h)} y={PAD.t + innerH + 14} textAnchor="middle" className="reg-axl">{h}</text>
          </g>
        ))}
        {/* y ticks */}
        {yTicks.map(p => (
          <g key={p}>
            <line x1={PAD.l - 4} y1={sy(p)} x2={PAD.l} y2={sy(p)} stroke="var(--line)" />
            <text x={PAD.l - 8} y={sy(p) + 4} textAnchor="end" className="reg-axl">{p.toFixed(2)}</text>
            {p > 0 && p < 1 && <line x1={PAD.l} y1={sy(p)} x2={PAD.l + innerW} y2={sy(p)} stroke="var(--faint,#e8e8e8)" strokeWidth="0.7" strokeDasharray="4 4" />}
          </g>
        ))}
        {/* labels */}
        <text x={PAD.l + innerW / 2} y={H_SVG - 2} textAnchor="middle" className="reg-axl">{xLabel}</text>
        <text x={10} y={PAD.t + innerH / 2} textAnchor="middle" className="reg-axl" transform={`rotate(-90, 10, ${PAD.t + innerH / 2})`}>{yLabel}</text>
      </>
    );
  }

  // scatter plot dots
  function DataDots({ highlightX, r = 6 }) {
    return (
      <>
        {LOG.xs.map((xi, i) => {
          const isHL = Math.abs(xi - highlightX) < 0.01;
          const col = LOG.ys[i] === 1
            ? "rgba(31,158,107,0.85)"
            : "rgba(224,73,46,0.85)";
          return (
            <circle
              key={i}
              cx={sx(xi)}
              cy={LOG.ys[i] === 1 ? sy(0.97) : sy(0.03)}
              r={isHL ? r + 3 : r}
              fill={col}
              stroke={isHL ? "var(--accent)" : col}
              strokeWidth={isHL ? 2.5 : 0}
            />
          );
        })}
      </>
    );
  }

  /* ─────────────────────────────────────────────
     STAGE 1 — Overview / Why not linear regression
  ───────────────────────────────────────────────*/
  function Stage1Overview({ trace }) {
    const { wLin, bLin } = trace;
    // linear regression line: extend to show nonsensical values
    const linY = (h) => wLin * h + bLin;
    const clampedLinY = (h) => Math.min(1.2, Math.max(-0.2, linY(h)));
    // polyline for linear regression
    const linPts = [0.5, 6.5].map(h => `${sx(h).toFixed(1)},${sy(clampedLinY(h)).toFixed(1)}`).join(" ");

    return (
      <>
        <Lead>
          Suppose you want to predict <b>pass / fail</b> from hours studied. Why not just use
          linear regression? Because linear regression predicts <b>any real number</b> — it can give
          you P = 1.4 or P = −0.3, which make no sense as probabilities. We need an output
          <b> constrained to [0, 1]</b>. That's exactly what <b>logistic regression</b> provides.
        </Lead>

        <div className="tf-archwrap">
          <div className="tf-arch">
            <div className="tf-arch-io">hours studied<span>input feature x</span></div>
            <div className="tf-arch-f"><b>z = w·x + b</b></div>
            <div className="tf-arch-row">z — the log-odds (logit)</div>
            <div className="tf-arch-f"><b>σ(z) = 1 / (1 + e⁻ᶻ)</b></div>
            <div className="tf-arch-io tf-arch-io--out">P(pass) ∈ (0, 1)<span>probability output</span></div>
          </div>
        </div>

        <div className="tf-subhead">The problem with linear regression for classification</div>
        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="reg-chart" style={{ width: "100%", maxWidth: W_SVG }}>
          <Axes yLabel="predicted value" />
          {/* danger zone above 1 */}
          <rect x={PAD.l} y={PAD.t} width={innerW} height={sy(1) - PAD.t} fill="rgba(224,73,46,0.07)" />
          <text x={PAD.l + innerW - 4} y={PAD.t + 12} textAnchor="end" className="reg-axl" fill="#e0492e">nonsensical &gt; 1</text>
          {/* danger zone below 0 */}
          <rect x={PAD.l} y={sy(0)} width={innerW} height={PAD.t + innerH - sy(0)} fill="rgba(224,73,46,0.07)" />
          <text x={PAD.l + innerW - 4} y={PAD.t + innerH - 4} textAnchor="end" className="reg-axl" fill="#e0492e">nonsensical &lt; 0</text>
          {/* linear regression line */}
          <polyline points={linPts} fill="none" stroke="#e0851e" strokeWidth="2" strokeDasharray="5 4" />
          <text x={sx(5.8)} y={sy(clampedLinY(5.8)) - 8} className="reg-axl" fill="#e0851e">linear fit</text>
          {/* data dots (jittered on y for clarity) */}
          <DataDots highlightX={-1} r={6} />
        </svg>

        <div className="tf-lifecycle">
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>✗</span> Linear regression</div>
            <p>Output can exceed 1 or go below 0. Also extremely sensitive to outliers — adding one
              distant point changes predictions for all others. No natural probability interpretation.</p>
          </div>
          <div className="tf-life tf-life--infer">
            <div className="tf-life-h"><span>✓</span> Logistic regression</div>
            <p>The sigmoid function squashes <em>any</em> real-valued <b>z</b> into (0, 1). You
              always get a valid probability. A natural threshold at 0.5 gives a decision boundary.</p>
          </div>
        </div>

        <div className="tf-legend">
          {[
            ["x", "input feature", "hours studied — a real number"],
            ["z = wx+b", "logit / log-odds", "the linear combination before squashing"],
            ["σ(z)", "sigmoid function", "maps ℝ → (0,1) — the squashing step"],
            ["P(y=1|x)", "conditional probability", "probability of passing given hours studied"],
            ["w, b", "parameters (learned)", "weight and bias — adjusted during training"],
          ].map(r => (
            <div className={"tf-leg" + (r[0] === "w, b" ? " is-learned" : "")} key={r[0]}>
              <div className="tf-leg-top">
                <span className={"tf-sym" + (r[0] === "w, b" ? " is-learned" : "")}>{r[0]}</span>
              </div>
              <div className="tf-leg-name">{r[1]}</div>
              <div className="tf-leg-desc">{r[2]}</div>
            </div>
          ))}
        </div>

        <Note>Use the <b>hours slider</b> in the top bar to change the query point — every chart
          and calculation on every stage updates live.</Note>
      </>
    );
  }

  /* ─────────────────────────────────────────────
     STAGE 2 — The Dataset
  ───────────────────────────────────────────────*/
  function Stage2Dataset({ trace }) {
    const passes = LOG.ys.filter(y => y === 1).length;
    const fails = LOG.ys.filter(y => y === 0).length;

    return (
      <>
        <Lead>
          Our toy dataset has <b>7 students</b>. Each studied between 1 and 6 hours for an exam.
          The label is binary: <b>0 = fail, 1 = pass</b>. The goal is to learn the hours threshold
          that separates passes from fails.
        </Lead>

        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="reg-chart" style={{ width: "100%", maxWidth: W_SVG }}>
          <Axes yLabel="label (0=fail, 1=pass)" />
          {/* horizontal divider at 0.5 */}
          <line x1={PAD.l} y1={sy(0.5)} x2={PAD.l + innerW} y2={sy(0.5)} stroke="var(--faint,#e8e8e8)" strokeWidth="1" strokeDasharray="4 4" />
          {/* fail/pass zones */}
          <text x={PAD.l + 8} y={sy(0.25)} className="reg-axl" fill="rgba(224,73,46,0.7)">FAIL zone</text>
          <text x={PAD.l + 8} y={sy(0.75)} className="reg-axl" fill="rgba(31,158,107,0.7)">PASS zone</text>
          <DataDots highlightX={trace.x} r={7} />
          {/* label each dot */}
          {LOG.xs.map((xi, i) => (
            <text key={i} x={sx(xi)} y={LOG.ys[i] === 1 ? sy(0.97) - 14 : sy(0.03) + 18}
              textAnchor="middle" className="reg-axl"
              fill={LOG.ys[i] === 1 ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)"}>
              {LOG.ys[i] === 1 ? "pass" : "fail"}
            </text>
          ))}
        </svg>

        <div className="tf-subhead">All 7 training examples</div>
        <div className="nn-calc">
          <div className="nn-calc-h">Dataset: hours studied → exam outcome</div>
          <div className="nn-calc-row" style={{ fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
            <span style={{ width: 40, display: "inline-block" }}>#</span>
            <span style={{ width: 100, display: "inline-block" }}>hours (x)</span>
            <span style={{ width: 80, display: "inline-block" }}>label (y)</span>
            <span>outcome</span>
          </div>
          {LOG.xs.map((xi, i) => (
            <div className="nn-calc-row" key={i}
              style={{ background: Math.abs(xi - trace.x) < 0.01 ? "rgba(var(--accent-rgb,99,102,241),0.08)" : undefined }}>
              <span style={{ width: 40, display: "inline-block", opacity: 0.5 }}>{i + 1}</span>
              <span style={{ width: 100, display: "inline-block" }}><b>{xi.toFixed(1)} h</b></span>
              <span style={{ width: 80, display: "inline-block" }}>{LOG.ys[i]}</span>
              <span style={{ color: LOG.ys[i] === 1 ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)", fontWeight: 600 }}>
                {LOG.ys[i] === 1 ? "✓ pass" : "✗ fail"}
              </span>
            </div>
          ))}
        </div>

        <div className="tf-lifecycle">
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>{passes}</span> Passes (y=1)</div>
            <p>Students who studied <b>3.5 h or more</b> all passed. The model needs to learn this
              threshold from data — it sees hours and outcomes, not the rule explicitly.</p>
          </div>
          <div className="tf-life tf-life--infer">
            <div className="tf-life-h"><span>{fails}</span> Fails (y=0)</div>
            <p>Students who studied <b>2.5 h or less</b> all failed. There's a clear <b>decision
              boundary</b> somewhere around 3 hours — logistic regression will find it.</p>
          </div>
        </div>

        <Note>In real problems you'd have many more examples and features. The math is
          identical — just more dimensions. Our 7-point toy dataset lets us visualise every step
          cleanly.</Note>
      </>
    );
  }

  /* ─────────────────────────────────────────────
     STAGE 3 — Sigmoid Function
  ───────────────────────────────────────────────*/
  function Stage3Sigmoid({ trace }) {
    const SW = 500, SH = 220;
    const sxSig = (x) => PAD.l + ((x + 8) / 16) * innerW;
    const sySig = (p) => PAD.t + (1 - p) * innerH;

    // generate 80 points from -8 to 8
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const x = -8 + 16 * i / 80;
      const y = sigmoid(x);
      pts.push(`${sxSig(x).toFixed(1)},${sySig(y).toFixed(1)}`);
    }
    const sigPts = pts.join(" ");

    // current z value
    const { z, prob } = trace;
    const zClamped = Math.max(-8, Math.min(8, z));

    const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
    const xTicks = [-8, -6, -4, -2, 0, 2, 4, 6, 8];

    return (
      <>
        <Lead>
          The <b>sigmoid function</b> σ(x) = 1/(1 + e⁻ˣ) maps any real number to the open
          interval <b>(0, 1)</b>. It is the key ingredient: whatever linear combination z = wx+b
          produces, sigmoid converts it to a valid probability. At z = 0, σ(0) = 0.5 exactly — the
          decision boundary. As z → +∞, σ → 1; as z → −∞, σ → 0.
        </Lead>

        <Formula label="sigmoid function">σ(z) = 1 / (1 + e<Sup>−z</Sup>)</Formula>

        <svg viewBox={`0 0 ${SW} ${SH}`} className="reg-chart" style={{ width: "100%", maxWidth: SW }}>
          {/* axes */}
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.2" />
          <line x1={PAD.l} y1={PAD.t + innerH} x2={PAD.l + innerW} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.2" />
          {/* y=0.5 dashed reference */}
          <line x1={PAD.l} y1={sySig(0.5)} x2={PAD.l + innerW} y2={sySig(0.5)}
            stroke="var(--faint,#e0e0e0)" strokeWidth="1" strokeDasharray="4 3" />
          {/* x=0 reference */}
          <line x1={sxSig(0)} y1={PAD.t} x2={sxSig(0)} y2={PAD.t + innerH}
            stroke="var(--faint,#e0e0e0)" strokeWidth="1" strokeDasharray="4 3" />
          {/* ticks */}
          {xTicks.map(x => (
            <g key={x}>
              <line x1={sxSig(x)} y1={PAD.t + innerH} x2={sxSig(x)} y2={PAD.t + innerH + 4} stroke="var(--line)" />
              <text x={sxSig(x)} y={PAD.t + innerH + 14} textAnchor="middle" className="reg-axl">{x}</text>
            </g>
          ))}
          {yTicks.map(p => (
            <g key={p}>
              <line x1={PAD.l - 4} y1={sySig(p)} x2={PAD.l} y2={sySig(p)} stroke="var(--line)" />
              <text x={PAD.l - 8} y={sySig(p) + 4} textAnchor="end" className="reg-axl">{p.toFixed(2)}</text>
            </g>
          ))}
          {/* axis labels */}
          <text x={PAD.l + innerW / 2} y={SH - 2} textAnchor="middle" className="reg-axl">z (logit)</text>
          <text x={10} y={PAD.t + innerH / 2} textAnchor="middle" className="reg-axl"
            transform={`rotate(-90, 10, ${PAD.t + innerH / 2})`}>σ(z)</text>
          {/* sigmoid curve */}
          <polyline points={sigPts} fill="none" stroke="var(--accent)" strokeWidth="2.8" strokeLinejoin="round" />
          {/* σ(0) = 0.5 annotation */}
          <circle cx={sxSig(0)} cy={sySig(0.5)} r="5" fill="var(--accent)" />
          <text x={sxSig(0) + 8} y={sySig(0.5) - 6} className="reg-axl" fill="var(--accent)">σ(0)=0.5</text>
          {/* asymptote annotations */}
          <text x={PAD.l + innerW - 4} y={sySig(0.98)} textAnchor="end" className="reg-axl" fill="rgba(31,158,107,0.8)">→ 1</text>
          <text x={PAD.l + innerW - 4} y={sySig(0.04)} textAnchor="end" className="reg-axl" fill="rgba(224,73,46,0.8)">→ 0</text>
          {/* current z point */}
          {zClamped >= -8 && zClamped <= 8 && (
            <>
              <line x1={sxSig(zClamped)} y1={PAD.t} x2={sxSig(zClamped)} y2={sySig(prob)}
                stroke="#e0851e" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1={PAD.l} y1={sySig(prob)} x2={sxSig(zClamped)} y2={sySig(prob)}
                stroke="#e0851e" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx={sxSig(zClamped)} cy={sySig(prob)} r="6" fill="#e0851e" />
              <text x={sxSig(zClamped) + 8} y={sySig(prob) - 8} className="reg-axl" fill="#e0851e">
                z={fmt(zClamped)} → {(prob * 100).toFixed(1)}%
              </text>
            </>
          )}
        </svg>

        <div className="tf-legend">
          {[
            ["σ(z) → 0 as z → −∞", "Very negative logit means almost certainly class 0 (fail)"],
            ["σ(0) = 0.5", "When z=0, the model is completely uncertain — 50/50. This is the decision boundary."],
            ["σ(z) → 1 as z → +∞", "Very positive logit means almost certainly class 1 (pass)"],
            ["Derivative: σ(z)·(1−σ(z))", "Maximum slope at z=0 is 0.25 — gradients can vanish in deep sigmoid nets"],
          ].map(r => (
            <div className="tf-leg" key={r[0]}>
              <div className="tf-leg-name">{r[0]}</div>
              <div className="tf-leg-desc">{r[1]}</div>
            </div>
          ))}
        </div>

        <div className="nn-calc">
          <div className="nn-calc-h">Live computation for current query point (x = {trace.x.toFixed(1)} hours)</div>
          <div className="nn-calc-row">z = w·x + b = {fmt(trace.w)}·{trace.x.toFixed(1)} + ({fmt(trace.b)}) = <b>{fmt(trace.z)}</b></div>
          <div className="nn-calc-row">σ(z) = 1 / (1 + e<sup>−{fmt(trace.z)}</sup>) = <b className="nn-calc-res">{(trace.prob * 100).toFixed(2)}%</b></div>
        </div>

        <Note>The sigmoid curve is S-shaped (a.k.a. <b>logistic curve</b> — hence "logistic
          regression"). It was originally used in biology to model population growth.</Note>
      </>
    );
  }

  /* ─────────────────────────────────────────────
     STAGE 4 — Linear Combination (logit)
  ───────────────────────────────────────────────*/
  function Stage4Logit({ trace }) {
    const { w, b } = trace;
    // z values across all hours
    const zPts = [];
    for (let h = 1; h <= 6; h += 0.1) {
      const z = w * h + b;
      zPts.push({ h, z });
    }
    const zMin = Math.min(...zPts.map(p => p.z));
    const zMax = Math.max(...zPts.map(p => p.z));
    const zRange = zMax - zMin || 1;

    // SVG dimensions for z chart
    const syZ = (z) => PAD.t + ((zMax - z) / zRange) * innerH;
    const polyZ = zPts.map(p => `${sx(p.h).toFixed(1)},${syZ(p.z).toFixed(1)}`).join(" ");

    // y tick values
    const zStep = Math.ceil(zRange / 4);
    const zTicks = [];
    for (let z = Math.ceil(zMin); z <= Math.ceil(zMax); z += zStep) zTicks.push(z);

    return (
      <>
        <Lead>
          Before sigmoid, we compute the <b>linear combination</b> z = w·x + b. This is called the
          <b> logit</b> or <b>log-odds</b> because z = log(p/(1−p)). A positive z means the model
          leans toward class 1; negative toward class 0. The larger |z|, the more confident the
          prediction.
        </Lead>

        <Formula label="logit (log-odds)">z = <V>w</V>·x + <V>b</V> = log( p / (1−p) )</Formula>

        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="reg-chart" style={{ width: "100%", maxWidth: W_SVG }}>
          {/* axes */}
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.2" />
          <line x1={PAD.l} y1={PAD.t + innerH} x2={PAD.l + innerW} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.2" />
          {/* z=0 reference line */}
          {zMin <= 0 && zMax >= 0 && (
            <line x1={PAD.l} y1={syZ(0)} x2={PAD.l + innerW} y2={syZ(0)}
              stroke="var(--faint,#e0e0e0)" strokeWidth="1" strokeDasharray="4 3" />
          )}
          {/* y ticks */}
          {zTicks.map(z => (
            <g key={z}>
              <line x1={PAD.l - 4} y1={syZ(z)} x2={PAD.l} y2={syZ(z)} stroke="var(--line)" />
              <text x={PAD.l - 8} y={syZ(z) + 4} textAnchor="end" className="reg-axl">{z}</text>
            </g>
          ))}
          {/* x ticks */}
          {[1, 2, 3, 4, 5, 6].map(h => (
            <g key={h}>
              <line x1={sx(h)} y1={PAD.t + innerH} x2={sx(h)} y2={PAD.t + innerH + 4} stroke="var(--line)" />
              <text x={sx(h)} y={PAD.t + innerH + 14} textAnchor="middle" className="reg-axl">{h}</text>
            </g>
          ))}
          {/* axis labels */}
          <text x={PAD.l + innerW / 2} y={H_SVG - 2} textAnchor="middle" className="reg-axl">hours studied</text>
          <text x={10} y={PAD.t + innerH / 2} textAnchor="middle" className="reg-axl"
            transform={`rotate(-90, 10, ${PAD.t + innerH / 2})`}>z (logit)</text>
          {/* z=0 label */}
          {zMin <= 0 && zMax >= 0 && (
            <text x={PAD.l + 4} y={syZ(0) - 4} className="reg-axl" fill="var(--faint,#aaa)">z=0 (boundary)</text>
          )}
          {/* line */}
          <polyline points={polyZ} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
          {/* current x point */}
          <circle cx={sx(trace.x)} cy={syZ(trace.z)} r="6" fill="#e0851e" />
          <text x={sx(trace.x) + 8} y={syZ(trace.z) - 6} className="reg-axl" fill="#e0851e">
            z={fmt(trace.z)}
          </text>
        </svg>

        <div className="tf-subhead">Log-odds interpretation</div>
        <div className="nn-calc">
          <div className="nn-calc-h">For x = {trace.x.toFixed(1)} hours (current query)</div>
          <div className="nn-calc-row">z = {fmt(w)} × {trace.x.toFixed(1)} + ({fmt(b)}) = <b>{fmt(trace.z)}</b></div>
          <div className="nn-calc-row">
            odds = p/(1−p) = e<sup>z</sup> = e<sup>{fmt(trace.z)}</sup> = <b>{Math.exp(trace.z).toFixed(3)}</b>
          </div>
          <div className="nn-calc-row">
            p = σ(z) = <b>{(trace.prob * 100).toFixed(2)}%</b> →
            prediction: <b style={{ color: trace.pred === 1 ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)" }}>
              {trace.pred === 1 ? "pass" : "fail"}
            </b>
          </div>
        </div>

        <div className="tf-legend">
          {[
            ["z > 0", "Positive log-odds → odds > 1 → model predicts class 1 (pass)"],
            ["z = 0", "Equal log-odds → odds = 1 → 50/50 uncertainty → decision boundary"],
            ["z < 0", "Negative log-odds → odds < 1 → model predicts class 0 (fail)"],
            ["log-odds are linear in x", "The log-odds change by w for every unit increase in hours studied"],
          ].map(r => (
            <div className="tf-leg" key={r[0]}>
              <div className="tf-leg-name">{r[0]}</div>
              <div className="tf-leg-desc">{r[1]}</div>
            </div>
          ))}
        </div>

        <Note>Logistic regression is called "regression" because it models the log-odds as a
          <b> linear</b> function of the inputs — even though the end goal is classification.</Note>
      </>
    );
  }

  /* ─────────────────────────────────────────────
     STAGE 5 — Hypothesis / Interactive prediction
  ───────────────────────────────────────────────*/
  function Stage5Hypothesis({ trace, ctx }) {
    const { input, setInput } = ctx;

    return (
      <>
        <Lead>
          The <b>hypothesis</b> of logistic regression is P(y=1|x) = σ(wx+b). It reads as:
          "the probability that the student passes, given they studied x hours". Move the slider to
          see the probability update live — this <em>is</em> the model running inference.
        </Lead>

        <Formula label="hypothesis">P(y=1 | x) = σ(w·x + b) = σ(<b>{fmt(trace.w)}</b>·x + <b>{fmt(trace.b)}</b>)</Formula>

        <div className="nn-input-bar" style={{ marginBottom: 16 }}>
          <label className="nn-slider">
            <span className="nn-slider-l">hours studied (x)</span>
            <input type="range" min="1" max="6" step="0.1" value={input.x}
              onChange={e => setInput({ ...input, x: parseFloat(e.target.value) })} />
            <span className="nn-slider-v">{input.x.toFixed(1)} h</span>
          </label>
        </div>

        <div className="nn-calc">
          <div className="nn-calc-h">Step-by-step for x = {trace.x.toFixed(1)} hours</div>
          <div className="nn-calc-row">
            Step 1 — linear combination:&nbsp;
            z = {fmt(trace.w)} × {trace.x.toFixed(1)} + ({fmt(trace.b)}) = <b>{fmt(trace.z)}</b>
          </div>
          <div className="nn-calc-row">
            Step 2 — sigmoid:&nbsp;
            σ({fmt(trace.z)}) = 1 / (1 + e<sup>−({fmt(trace.z)})</sup>) = <b className="nn-calc-res">{(trace.prob * 100).toFixed(2)}%</b>
          </div>
          <div className="nn-calc-row">
            Step 3 — decision (threshold 0.5):&nbsp;
            {trace.prob.toFixed(4)} {trace.prob >= 0.5 ? "≥" : "<"} 0.5 →
            <b style={{ color: trace.pred === 1 ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)", marginLeft: 6 }}>
              {trace.pred === 1 ? "predict PASS" : "predict FAIL"}
            </b>
          </div>
        </div>

        <div className="tf-subhead">Probability output</div>
        <div className="tf-probs">
          {LOG.labels.map((lbl, i) => {
            const p = i === 1 ? trace.prob : 1 - trace.prob;
            return (
              <div className={"tf-prob" + (i === trace.pred ? " is-top" : "")} key={lbl}>
                <span className="tf-prob-word">{lbl}</span>
                <div className="tf-prob-track">
                  <div className="tf-prob-fill" style={{ width: (p * 100).toFixed(1) + "%" }} />
                </div>
                <span className="tf-prob-val">{(p * 100).toFixed(1)}%</span>
              </div>
            );
          })}
        </div>

        <div className="tf-predict-out">
          <span>prediction</span>
          <b className="tf-predict-next" style={{ color: trace.pred === 1 ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)" }}>
            {LOG.labels[trace.pred]}
          </b>
        </div>

        <div className="tf-subhead">All 7 training predictions</div>
        <div className="nn-calc">
          {LOG.xs.map((xi, i) => {
            const pi = trace.probs[i];
            const ok = trace.preds[i] === LOG.ys[i];
            return (
              <div className="nn-calc-row" key={i}
                style={{ background: Math.abs(xi - trace.x) < 0.01 ? "rgba(var(--accent-rgb,99,102,241),0.08)" : undefined }}>
                <span style={{ minWidth: 80, display: "inline-block" }}>x={xi.toFixed(1)}h</span>
                <span style={{ minWidth: 80, display: "inline-block" }}>P={fmt(pi)}</span>
                <span style={{ minWidth: 80, display: "inline-block" }}>pred={trace.preds[i]}</span>
                <span style={{ color: ok ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)", fontWeight: 600 }}>
                  {ok ? "✓ correct" : "✗ wrong"}
                </span>
              </div>
            );
          })}
          <div className="nn-calc-row" style={{ fontWeight: 700 }}>
            Accuracy: {(trace.accuracy * 100).toFixed(0)}% ({trace.correct}/{LOG.xs.length} correct)
          </div>
        </div>

        <Note>At fitted weights (w={LOG.default.w}, b={LOG.default.b}), the model achieves
          <b> 100% accuracy</b> on this simple dataset. The decision boundary is at x={fmt(-LOG.default.b / LOG.default.w)} hours.</Note>
      </>
    );
  }

  /* ─────────────────────────────────────────────
     STAGE 6 — Decision Boundary
  ───────────────────────────────────────────────*/
  function Stage6Boundary({ trace }) {
    const { w, b, boundary } = trace;

    // sigmoid curve over hours 1–6
    const sigPts = [];
    for (let h = 0.8; h <= 6.2; h += 0.08) {
      const z = w * h + b;
      const p = sigmoid(z);
      sigPts.push(`${sx(h).toFixed(1)},${sy(p).toFixed(1)}`);
    }

    return (
      <>
        <Lead>
          The <b>decision boundary</b> is the value of x where P(y=1|x) = 0.5, i.e. where z = 0.
          Solving w·x + b = 0 gives x* = −b/w. Everything to the <b>right</b> is predicted "pass";
          to the <b>left</b> is "fail". Logistic regression always gives a <b>linear</b> decision
          boundary in feature space.
        </Lead>

        <Formula label="decision boundary">w·x + b = 0  →  x* = −b / w = −({fmt(b)}) / {fmt(w)} = <b>{fmt(boundary)}</b> hours</Formula>

        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="reg-chart" style={{ width: "100%", maxWidth: W_SVG }}>
          <Axes yLabel="P(pass)" />
          {/* shade: left = fail, right = pass */}
          {boundary !== null && boundary >= 1 && boundary <= 6 && (
            <>
              <rect x={PAD.l} y={PAD.t} width={sx(boundary) - PAD.l} height={innerH}
                fill="rgba(224,73,46,0.06)" />
              <rect x={sx(boundary)} y={PAD.t} width={PAD.l + innerW - sx(boundary)} height={innerH}
                fill="rgba(31,158,107,0.06)" />
            </>
          )}
          {/* 0.5 reference line */}
          <line x1={PAD.l} y1={sy(0.5)} x2={PAD.l + innerW} y2={sy(0.5)}
            stroke="var(--faint,#e0e0e0)" strokeWidth="1" strokeDasharray="4 3" />
          <text x={PAD.l + 4} y={sy(0.5) - 4} className="reg-axl" fill="var(--faint,#aaa)">0.5 threshold</text>
          {/* sigmoid curve */}
          <polyline points={sigPts} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
          {/* decision boundary vertical */}
          {boundary !== null && (
            <>
              <line x1={sx(boundary)} y1={PAD.t} x2={sx(boundary)} y2={PAD.t + innerH}
                stroke="#e0851e" strokeWidth="2" strokeDasharray="5 4" />
              <text x={sx(boundary) + 5} y={PAD.t + 14} className="reg-axl" fill="#e0851e">
                x*={fmt(boundary)}
              </text>
              <text x={sx(boundary) - 5} y={PAD.t + 28} textAnchor="end" className="reg-axl" fill="rgba(224,73,46,0.8)">
                ← fail
              </text>
              <text x={sx(boundary) + 5} y={PAD.t + 28} className="reg-axl" fill="rgba(31,158,107,0.8)">
                pass →
              </text>
            </>
          )}
          {/* data dots */}
          <DataDots highlightX={trace.x} r={6} />
          {/* current x query */}
          <line x1={sx(trace.x)} y1={PAD.t} x2={sx(trace.x)} y2={sy(trace.prob)}
            stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx={sx(trace.x)} cy={sy(trace.prob)} r="5" fill="var(--accent)" />
        </svg>

        <div className="tf-lifecycle">
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>✗</span> Left of boundary (x &lt; {fmt(boundary)})</div>
            <p>P(pass) &lt; 0.5. The model predicts <b>fail</b>. The further left, the more
              confident (P → 0). Examples: 1 h studied → P={fmt(sigmoid(w * 1 + b))}, 2 h → P={fmt(sigmoid(w * 2 + b))}.</p>
          </div>
          <div className="tf-life tf-life--infer">
            <div className="tf-life-h"><span>✓</span> Right of boundary (x &gt; {fmt(boundary)})</div>
            <p>P(pass) &gt; 0.5. The model predicts <b>pass</b>. The further right, the more
              confident (P → 1). Examples: 4 h → P={fmt(sigmoid(w * 4 + b))}, 6 h → P={fmt(sigmoid(w * 6 + b))}.</p>
          </div>
        </div>

        <Note>For 2D input (two features), the decision boundary is a <b>line</b>. For higher
          dimensions it's a <b>hyperplane</b>. Non-linear boundaries require feature engineering or
          a different model (SVM with kernels, neural networks).</Note>
      </>
    );
  }

  /* ─────────────────────────────────────────────
     STAGE 7 — Binary Cross-Entropy Loss
  ───────────────────────────────────────────────*/
  function Stage7Loss({ trace }) {
    const { loss, losses } = trace;

    // show a curve: loss vs predicted probability for y=1 and y=0
    const LW = W_SVG, LH = H_SVG;
    const lsy = (l) => PAD.t + (1 - Math.min(l / 5, 1)) * innerH;
    const lsx = (p) => PAD.l + p * innerW;
    const bceTrue = []; // y=1
    const bceFalse = []; // y=0
    for (let p = 0.01; p <= 0.99; p += 0.01) {
      bceTrue.push(`${lsx(p).toFixed(1)},${lsy(-Math.log(p)).toFixed(1)}`);
      bceFalse.push(`${lsx(p).toFixed(1)},${lsy(-Math.log(1 - p)).toFixed(1)}`);
    }

    const maxLoss = Math.max(...losses);

    return (
      <>
        <Lead>
          For binary classification we use <b>Binary Cross-Entropy (BCE) loss</b>. It penalises the
          model heavily when it is <em>confidently wrong</em> (e.g. predicts P=0.99 when the true
          label is 0). When the model is correct and confident, the loss approaches 0.
        </Lead>

        <Formula label="BCE loss">
          L = − [ y · log(p) + (1−y) · log(1−p) ]
        </Formula>

        <div className="tf-subhead">Loss shape: why confident wrong predictions hurt most</div>
        <svg viewBox={`0 0 ${LW} ${LH}`} className="reg-chart" style={{ width: "100%", maxWidth: LW }}>
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.2" />
          <line x1={PAD.l} y1={PAD.t + innerH} x2={PAD.l + innerW} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.2" />
          {[0, 0.25, 0.5, 0.75, 1.0].map(p => (
            <g key={p}>
              <line x1={lsx(p)} y1={PAD.t + innerH} x2={lsx(p)} y2={PAD.t + innerH + 4} stroke="var(--line)" />
              <text x={lsx(p)} y={PAD.t + innerH + 14} textAnchor="middle" className="reg-axl">{p}</text>
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5].map(l => (
            <g key={l}>
              <line x1={PAD.l - 4} y1={lsy(l)} x2={PAD.l} y2={lsy(l)} stroke="var(--line)" />
              <text x={PAD.l - 8} y={lsy(l) + 4} textAnchor="end" className="reg-axl">{l}</text>
              {l > 0 && <line x1={PAD.l} y1={lsy(l)} x2={PAD.l + innerW} y2={lsy(l)} stroke="var(--faint,#eee)" strokeWidth="0.7" strokeDasharray="4 3" />}
            </g>
          ))}
          <text x={lsx(0.5)} y={LH - 2} textAnchor="middle" className="reg-axl">predicted probability p</text>
          <text x={10} y={PAD.t + innerH / 2} textAnchor="middle" className="reg-axl"
            transform={`rotate(-90, 10, ${PAD.t + innerH / 2})`}>loss</text>
          {/* y=1 curve: -log(p) */}
          <polyline points={bceTrue.join(" ")} fill="none" stroke="rgba(31,158,107,0.9)" strokeWidth="2.5" />
          <text x={lsx(0.9)} y={lsy(0.12)} className="reg-axl" fill="rgba(31,158,107,0.9)">y=1</text>
          {/* y=0 curve: -log(1-p) */}
          <polyline points={bceFalse.join(" ")} fill="none" stroke="rgba(224,73,46,0.9)" strokeWidth="2.5" />
          <text x={lsx(0.1)} y={lsy(0.12)} className="reg-axl" fill="rgba(224,73,46,0.9)">y=0</text>
        </svg>

        <div className="tf-subhead">Per-example losses (current weights: w={fmt(trace.w)}, b={fmt(trace.b)})</div>
        <div className="nn-calc">
          <div className="nn-calc-h">
            Average BCE loss = <b>{fmt(loss)}</b>
          </div>
          <div className="nn-calc-row" style={{ fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
            <span style={{ width: 56, display: "inline-block" }}>x (h)</span>
            <span style={{ width: 36, display: "inline-block" }}>y</span>
            <span style={{ width: 64, display: "inline-block" }}>p̂</span>
            <span style={{ width: 80, display: "inline-block" }}>loss</span>
            <span>bar</span>
          </div>
          {LOG.xs.map((xi, i) => {
            const li = losses[i];
            return (
              <div className="nn-calc-row" key={i}
                style={{ background: Math.abs(xi - trace.x) < 0.01 ? "rgba(var(--accent-rgb,99,102,241),0.08)" : undefined }}>
                <span style={{ width: 56, display: "inline-block" }}>{xi.toFixed(1)}</span>
                <span style={{ width: 36, display: "inline-block" }}>{LOG.ys[i]}</span>
                <span style={{ width: 64, display: "inline-block" }}>{fmt(trace.probs[i])}</span>
                <span style={{ width: 80, display: "inline-block" }}><b>{fmt(li)}</b></span>
                <span style={{ display: "inline-block", width: Math.min(li / maxLoss * 80, 80) + "px", height: "8px", background: li > 1 ? "rgba(224,73,46,0.7)" : "rgba(31,158,107,0.5)", borderRadius: 3 }} />
              </div>
            );
          })}
        </div>

        <div className="tf-legend">
          {[
            ["y=1, p→0", "Predicting very low probability when truth is 1 → loss → ∞. The model pays dearly for this mistake."],
            ["y=1, p→1", "Predicting high probability when truth is 1 → loss → 0. Correct and confident — great."],
            ["y=0, p→1", "Predicting very high probability when truth is 0 → loss → ∞. Symmetric penalty."],
            ["y=0, p→0", "Predicting low probability when truth is 0 → loss → 0. Correct and confident."],
          ].map(r => (
            <div className="tf-leg" key={r[0]}>
              <div className="tf-leg-name">{r[0]}</div>
              <div className="tf-leg-desc">{r[1]}</div>
            </div>
          ))}
        </div>

        <Note>BCE loss comes from maximum likelihood estimation — minimising BCE is equivalent to
          maximising the <b>log-likelihood</b> of the observed labels under the model. Unlike MSE,
          BCE gives well-behaved gradients for probability outputs.</Note>
      </>
    );
  }

  /* ─────────────────────────────────────────────
     STAGE 8 — Gradient Computation
  ───────────────────────────────────────────────*/
  function Stage8Gradient({ trace }) {
    const { w, b, dw, db, residuals } = trace;
    const n = LOG.xs.length;

    return (
      <>
        <Lead>
          To improve the model, we compute <b>how much the loss changes</b> when we nudge w and b.
          The gradients of BCE loss for logistic regression have an elegantly simple form:
          ∂L/∂w = mean[(p̂−y)·x] and ∂L/∂b = mean[p̂−y]. The term (p̂−y) is the <b>residual</b>
          — how far the prediction is from the truth.
        </Lead>

        <Formula label="gradients">
          ∂L/∂w = (1/n) Σ (p̂<Sub>i</Sub> − y<Sub>i</Sub>) · x<Sub>i</Sub>
          &nbsp;&nbsp;·&nbsp;&nbsp;
          ∂L/∂b = (1/n) Σ (p̂<Sub>i</Sub> − y<Sub>i</Sub>)
        </Formula>

        <div className="tf-subhead">Residuals (p̂ − y) for all training examples</div>
        <div className="nn-calc">
          <div className="nn-calc-h">Residual matrix (p̂ − y) — positive means prediction too high, negative too low</div>
          <div className="nn-calc-row" style={{ fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
            <span style={{ width: 56, display: "inline-block" }}>x (h)</span>
            <span style={{ width: 36, display: "inline-block" }}>y</span>
            <span style={{ width: 72, display: "inline-block" }}>p̂</span>
            <span style={{ width: 80, display: "inline-block" }}>p̂−y</span>
            <span style={{ width: 90, display: "inline-block" }}>(p̂−y)·x</span>
          </div>
          {LOG.xs.map((xi, i) => {
            const res = residuals[i];
            const contrib = res * xi;
            return (
              <div className="nn-calc-row" key={i}>
                <span style={{ width: 56, display: "inline-block" }}>{xi.toFixed(1)}</span>
                <span style={{ width: 36, display: "inline-block" }}>{LOG.ys[i]}</span>
                <span style={{ width: 72, display: "inline-block" }}>{fmt(trace.probs[i])}</span>
                <span style={{ width: 80, display: "inline-block", color: res > 0.01 ? "rgba(224,73,46,0.9)" : res < -0.01 ? "rgba(31,158,107,0.9)" : undefined, fontWeight: 600 }}>
                  {fmt(res)}
                </span>
                <span style={{ width: 90, display: "inline-block" }}>{fmt(contrib)}</span>
              </div>
            );
          })}
          <div className="nn-calc-row" style={{ fontWeight: 700, borderTop: "1px solid var(--line)" }}>
            <span style={{ width: 56 + 36 + 72, display: "inline-block" }}>mean →</span>
            <span style={{ width: 80, display: "inline-block" }}>∂L/∂b = <b>{fmt(db)}</b></span>
            <span style={{ width: 90, display: "inline-block" }}>∂L/∂w = <b>{fmt(dw)}</b></span>
          </div>
        </div>

        <div className="tf-subhead">Gradient update directions</div>
        <div className="nn-calc">
          <div className="nn-calc-h">Gradient descent step (η = 0.1)</div>
          <div className="nn-calc-row">
            w_new = w − η·∂L/∂w = {fmt(w)} − 0.1 × {fmt(dw)} = <b className="nn-calc-res">{fmt(w - 0.1 * dw)}</b>
          </div>
          <div className="nn-calc-row">
            b_new = b − η·∂L/∂b = {fmt(b)} − 0.1 × {fmt(db)} = <b className="nn-calc-res">{fmt(b - 0.1 * db)}</b>
          </div>
        </div>

        <div className="tf-lifecycle">
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>∂</span> Why this gradient form?</div>
            <p>For logistic regression with BCE loss, the chain rule telescopes beautifully:
              ∂L/∂z = p̂ − y, and ∂z/∂w = x, ∂z/∂b = 1. The gradient of the loss w.r.t.
              the logit is simply the <b>prediction error</b>. This is why BCE + sigmoid is a
              natural pairing.</p>
          </div>
          <div className="tf-life tf-life--infer">
            <div className="tf-life-h"><span>↓</span> Gradient sign</div>
            <p>If ∂L/∂w &gt; 0, increasing w increases loss — so we <b>decrease</b> w (subtract
              the gradient × η). If &lt; 0, we increase w. The gradient always points uphill,
              so we go the opposite direction.</p>
          </div>
        </div>

        <Note>These gradients are for a single example. In practice we use <b>mini-batch gradient
          descent</b> — average the gradients over a batch of examples before updating, for
          stability.</Note>
      </>
    );
  }

  /* ─────────────────────────────────────────────
     STAGE 9 — Training & Convergence
  ───────────────────────────────────────────────*/
  function Stage9Training({ trace }) {
    const [wTrain, setWTrain] = useState(0.5);
    const [bTrain, setBTrain] = useState(-1.5);
    const [epoch, setEpoch] = useState(0);
    const [history, setHistory] = useState([]);
    const animRef = useRef(null);

    const eta = 0.3;
    const n = LOG.xs.length;

    function computeGrads(w, b) {
      const dw = (1 / n) * LOG.xs.reduce((s, xi, i) => s + (sigmoid(w * xi + b) - LOG.ys[i]) * xi, 0);
      const db = (1 / n) * LOG.xs.reduce((s, xi, i) => s + (sigmoid(w * xi + b) - LOG.ys[i]), 0);
      const loss = -LOG.xs.reduce((s, xi, i) => {
        const pi = sigmoid(w * xi + b);
        return s + LOG.ys[i] * Math.log(Math.max(pi, 1e-9)) + (1 - LOG.ys[i]) * Math.log(Math.max(1 - pi, 1e-9));
      }, 0) / n;
      const acc = LOG.xs.filter((xi, i) => (sigmoid(w * xi + b) >= 0.5 ? 1 : 0) === LOG.ys[i]).length / n;
      return { dw, db, loss, acc };
    }

    function stepOnce() {
      const { dw, db, loss, acc } = computeGrads(wTrain, bTrain);
      const newW = wTrain - eta * dw;
      const newB = bTrain - eta * db;
      setWTrain(newW);
      setBTrain(newB);
      setEpoch(e => e + 1);
      setHistory(h => [...h.slice(-19), { epoch: epoch + 1, loss: loss.toFixed(4), acc: (acc * 100).toFixed(0) + "%" }]);
    }

    function reset() {
      setWTrain(0.5); setBTrain(-1.5); setEpoch(0); setHistory([]);
    }

    const { loss: curLoss, acc: curAcc } = computeGrads(wTrain, bTrain);
    const boundary = wTrain !== 0 ? -bTrain / wTrain : null;

    // sigmoid curve with current trained weights
    const sigPts = [];
    for (let h = 0.8; h <= 6.2; h += 0.1) {
      const p = sigmoid(wTrain * h + bTrain);
      sigPts.push(`${sx(h).toFixed(1)},${sy(p).toFixed(1)}`);
    }

    return (
      <>
        <Lead>
          Watch the model <b>learn from scratch</b>. We start with random weights (w=0.5, b=−1.5)
          and apply gradient descent steps. Each click is one <b>epoch</b> — one full pass over all
          7 examples. The sigmoid curve and decision boundary update to show the evolving model.
        </Lead>

        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <button className="tf-headbtn is-on" onClick={stepOnce}>▶ One epoch (step)</button>
          <button className="tf-headbtn" onClick={reset}>↺ Reset</button>
          <span className="nn-slider-v" style={{ padding: "0 8px", lineHeight: "32px" }}>
            epoch {epoch} · loss={curLoss.toFixed(4)} · acc={(curAcc * 100).toFixed(0)}%
          </span>
        </div>

        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="reg-chart" style={{ width: "100%", maxWidth: W_SVG }}>
          <Axes yLabel="P(pass)" />
          <line x1={PAD.l} y1={sy(0.5)} x2={PAD.l + innerW} y2={sy(0.5)}
            stroke="var(--faint,#e0e0e0)" strokeWidth="1" strokeDasharray="4 3" />
          <polyline points={sigPts} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
          {boundary !== null && boundary >= 1 && boundary <= 6 && (
            <>
              <line x1={sx(boundary)} y1={PAD.t} x2={sx(boundary)} y2={PAD.t + innerH}
                stroke="#e0851e" strokeWidth="2" strokeDasharray="5 4" />
              <text x={sx(boundary) + 5} y={PAD.t + 14} className="reg-axl" fill="#e0851e">x*={fmt(boundary)}</text>
            </>
          )}
          <DataDots highlightX={-1} r={6} />
        </svg>

        <div className="nn-calc">
          <div className="nn-calc-h">Current trained parameters</div>
          <div className="nn-calc-row">w = <b>{fmt(wTrain)}</b> (target: {LOG.default.w}) · b = <b>{fmt(bTrain)}</b> (target: {LOG.default.b})</div>
          <div className="nn-calc-row">loss = <b>{fmt(curLoss)}</b> · accuracy = <b>{(curAcc * 100).toFixed(0)}%</b></div>
        </div>

        {history.length > 0 && (
          <>
            <div className="tf-subhead">Training history (last {history.length} epochs)</div>
            <div className="nn-calc">
              <div className="nn-calc-row" style={{ fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
                <span style={{ width: 64, display: "inline-block" }}>epoch</span>
                <span style={{ width: 80, display: "inline-block" }}>loss</span>
                <span>accuracy</span>
              </div>
              {history.map((h, i) => (
                <div className="nn-calc-row" key={i}>
                  <span style={{ width: 64, display: "inline-block" }}>{h.epoch}</span>
                  <span style={{ width: 80, display: "inline-block" }}>{h.loss}</span>
                  <span>{h.acc}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="tf-lifecycle">
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>η</span> Learning rate = {eta}</div>
            <p>Each step: w ← w − {eta}·∂L/∂w, b ← b − {eta}·∂L/∂b. Large η converges
              faster but may overshoot. Small η is stable but slow. This toy problem converges in
              ~20 epochs.</p>
          </div>
          <div className="tf-life tf-life--infer">
            <div className="tf-life-h"><span>↻</span> Epochs</div>
            <p>One epoch = one gradient update using all n={n} examples (full-batch gradient
              descent). For large datasets, <b>mini-batch SGD</b> splits data into batches of
              e.g. 32 examples per step.</p>
          </div>
        </div>

        <Note>The fitted weights w={LOG.default.w}, b={LOG.default.b} give 100% training accuracy
          here because the data is linearly separable. In practice, logistic regression minimises
          loss; perfect accuracy is not always possible.</Note>
      </>
    );
  }

  /* ─────────────────────────────────────────────
     STAGE 10 — Multi-class: Softmax
  ───────────────────────────────────────────────*/
  function Stage10Softmax() {
    const K = 4;
    const labels = ["A", "B", "C", "D"];
    const logits = [2.1, -0.5, 1.3, 0.8];
    const exps = logits.map(z => Math.exp(z));
    const sumExp = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(e => e / sumExp);
    const maxIdx = probs.indexOf(Math.max(...probs));

    return (
      <>
        <Lead>
          Logistic regression naturally extends to <b>K classes</b> via the <b>softmax</b> function.
          Instead of one weight vector w and bias b, we have one per class. The model computes K
          logits z₁…z_K and converts them to probabilities that sum to 1. This is exactly what the
          <b> output layer of an ANN</b> does for multi-class classification.
        </Lead>

        <div className="tf-archwrap">
          <div className="tf-arch">
            <div className="tf-arch-io">input features x<span>1 or more numbers</span></div>
            <div className="tf-arch-f"><b>z_k = w_k · x + b_k for each class k</b></div>
            <div className="tf-arch-row">z₁, z₂, …, z_K (raw logits)</div>
            <div className="tf-arch-f"><b>softmax: P(k) = e^z_k / Σ e^z_j</b></div>
            <div className="tf-arch-io tf-arch-io--out">P(class 1), …, P(class K)<span>probabilities summing to 1</span></div>
          </div>
        </div>

        <Formula label="softmax">
          P(y=k | x) = e<Sup>z_k</Sup> / Σ<Sub>j=1</Sub><Sup>K</Sup> e<Sup>z_j</Sup>
        </Formula>

        <div className="tf-subhead">Worked example: K=4 classes, logits z = [2.1, −0.5, 1.3, 0.8]</div>
        <div className="nn-calc">
          <div className="nn-calc-h">Softmax computation step by step</div>
          <div className="nn-calc-row">
            exp(z) = [{exps.map(e => e.toFixed(3)).join(", ")}]
          </div>
          <div className="nn-calc-row">
            sum = {sumExp.toFixed(3)}
          </div>
          {labels.map((l, i) => (
            <div className="nn-calc-row" key={l}>
              P({l}) = {exps[i].toFixed(3)} / {sumExp.toFixed(3)} = <b>{(probs[i] * 100).toFixed(1)}%</b>
              {i === maxIdx ? " ← predicted class" : ""}
            </div>
          ))}
          <div className="nn-calc-row" style={{ fontWeight: 700 }}>
            Sum of probabilities: {probs.reduce((a, b) => a + b, 0).toFixed(4)} ≈ 1.0 ✓
          </div>
        </div>

        <div className="tf-probs">
          {labels.map((l, i) => (
            <div className={"tf-prob" + (i === maxIdx ? " is-top" : "")} key={l}>
              <span className="tf-prob-word">Class {l}</span>
              <div className="tf-prob-track">
                <div className="tf-prob-fill" style={{ width: (probs[i] * 100).toFixed(1) + "%" }} />
              </div>
              <span className="tf-prob-val">{(probs[i] * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>

        <div className="tf-subhead">Binary sigmoid vs multi-class softmax</div>
        <div className="tf-legend">
          {[
            ["Binary (K=2) → Sigmoid", "One weight vector, one bias. Output: P(y=1). Logit z = w·x+b. Use when there are exactly 2 classes."],
            ["Multi-class (K>2) → Softmax", "K weight vectors, K biases. Output: P(y=0)…P(y=K-1), summing to 1. Use for mutually exclusive classes."],
            ["Multi-label → K sigmoids", "When an example can belong to multiple classes simultaneously (e.g. image tags), use one sigmoid per label independently."],
            ["Connection to ANN", "The output layer of a neural network IS multi-class logistic regression — the final linear layer followed by softmax."],
          ].map(r => (
            <div className="tf-leg" key={r[0]}>
              <div className="tf-leg-name">{r[0]}</div>
              <div className="tf-leg-desc">{r[1]}</div>
            </div>
          ))}
        </div>

        <Note>For K=2 with softmax, P(y=1) = e^z₁/(e^z₀+e^z₁) which is equivalent to sigmoid.
          Softmax is a strict generalisation — it reduces to sigmoid for 2 classes.</Note>
      </>
    );
  }

  /* ─────────────────────────────────────────────
     STAGE 11 — Assumptions & When to Use
  ───────────────────────────────────────────────*/
  function Stage11Assumptions() {
    return (
      <>
        <Lead>
          Logistic regression is a powerful, interpretable baseline for classification — but it has
          key <b>assumptions</b> that must hold for reliable results. Understanding them tells you
          when to use it and when to reach for a more complex model.
        </Lead>

        <div className="tf-subhead">Core assumptions</div>
        <div className="tf-legend">
          {[
            ["Linear decision boundary", "The log-odds are linear in the features. The boundary is a hyperplane in feature space. Non-linear boundaries require feature engineering (polynomial terms, interactions) or a different model."],
            ["Binary / categorical output", "Designed for classification. Each example belongs to one class. For continuous outputs, use linear regression instead."],
            ["Feature independence (soft)", "Each feature contributes independently to the log-odds. Highly correlated features (multicollinearity) inflate variance of estimates but don't invalidate predictions."],
            ["Large enough sample", "Needs ~10–20 examples per feature to estimate reliably. Small datasets relative to features risk overfitting; use regularisation (L1/L2)."],
            ["No extreme outliers", "Logistic regression is more robust than linear regression, but extreme outliers in features can still distort the boundary."],
            ["Linearly separable is fine, but not required", "Unlike SVMs, logistic regression doesn't require linear separability. It will converge to an approximate boundary even when classes overlap."],
          ].map(r => (
            <div className="tf-leg" key={r[0]}>
              <div className="tf-leg-name">{r[0]}</div>
              <div className="tf-leg-desc">{r[1]}</div>
            </div>
          ))}
        </div>

        <div className="tf-subhead">Pros & cons</div>
        <div className="opt-pc">
          <div className="opt-pc-col is-pro">
            <div className="opt-pc-h">Strengths</div>
            <ul>
              <li><b>Interpretable</b> — each weight is the change in log-odds per unit feature increase. Easy to explain to stakeholders.</li>
              <li><b>Probabilistic output</b> — calibrated probabilities, not just a class label.</li>
              <li><b>Fast to train</b> — convex loss with a unique global minimum. Converges reliably.</li>
              <li><b>Low variance</b> on small datasets compared to complex models.</li>
              <li><b>Regularisation</b> (L1/L2) is straightforward and highly effective.</li>
              <li><b>Strong baseline</b> — always run logistic regression before complex models.</li>
            </ul>
          </div>
          <div className="opt-pc-col is-con">
            <div className="opt-pc-h">Weaknesses</div>
            <ul>
              <li><b>Linear boundary only</b> — can't learn curved or complex decision boundaries without feature engineering.</li>
              <li><b>Feature engineering required</b> for non-linear problems (polynomial features, interactions).</li>
              <li><b>Not robust</b> to irrelevant features — adds noise. Use L1 (LASSO) to do feature selection.</li>
              <li><b>Multicollinearity</b> inflates coefficient variance (though predictions remain stable).</li>
              <li><b>Not suited for image/audio/text</b> without heavy preprocessing — deep nets do this automatically.</li>
            </ul>
          </div>
        </div>

        <div className="tf-subhead">When to use logistic regression</div>
        <div className="tf-legend">
          {[
            ["Use it when: linearly separable or close", "Medical diagnosis (with known risk factors), credit scoring, spam filtering with hand-crafted features, A/B test outcome modelling."],
            ["Use it when: interpretability matters", "Clinical settings, regulated industries, marketing attribution — anywhere you need to explain the model's decision."],
            ["Use it when: small dataset", "With <1000 examples, deep learning overfits badly. Logistic regression with regularisation generalises better."],
            ["Use SVM instead when:", "You want a maximum-margin boundary and don't need calibrated probabilities. SVMs can use kernels for non-linear boundaries."],
            ["Use Random Forest / XGBoost when:", "Non-linear interactions matter, features include mixed types, you need more predictive power without feature engineering."],
            ["Use deep learning when:", "High-dimensional unstructured inputs (images, text, audio), very large datasets, or complex feature hierarchies are needed."],
          ].map(r => (
            <div className="tf-leg" key={r[0]}>
              <div className="tf-leg-name">{r[0]}</div>
              <div className="tf-leg-desc">{r[1]}</div>
            </div>
          ))}
        </div>

        <Note>Rule of thumb: <b>always start with logistic regression</b>. It trains in seconds,
          gives interpretable weights, and its accuracy on the training set tells you whether the
          problem is even linearly separable. If it achieves &gt;90% accuracy, you may not need
          anything more complex.</Note>
      </>
    );
  }

  /* ── renderInput ── */
  function renderInput(input, setInput, trace) {
    return (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">{LOG.featName}</span>
          <input type="range" min="1" max="6" step="0.1" value={input.x}
            onChange={e => setInput({ ...input, x: parseFloat(e.target.value) })} />
          <span className="nn-slider-v">{input.x.toFixed(1)} h</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">weight w</span>
          <input type="range" min="0.5" max="5" step="0.1" value={input.w}
            onChange={e => setInput({ ...input, w: parseFloat(e.target.value) })} />
          <span className="nn-slider-v">{fmt(input.w)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">bias b</span>
          <input type="range" min="-12" max="0" step="0.1" value={input.b}
            onChange={e => setInput({ ...input, b: parseFloat(e.target.value) })} />
          <span className="nn-slider-v">{fmt(input.b)}</span>
        </label>
        <span className="nn-slider-v" style={{ marginLeft: 8, fontSize: "0.85em", opacity: 0.7 }}>
          P(pass) = <b style={{ color: trace && trace.pred === 1 ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)" }}>
            {trace ? (trace.prob * 100).toFixed(1) : "–"}%
          </b>
        </span>
      </>
    );
  }

  /* ── stage definitions ── */
  const STAGES = [
    {
      id: "overview", group: "Overview", title: "Why not linear regression for classification?", map: "Overview",
      why: "The starting intuition: what goes wrong when we naively apply linear regression to a yes/no problem — and why the sigmoid function solves it.",
      render: (t) => <Stage1Overview trace={t} />,
    },
    {
      id: "dataset", group: "Overview", title: "The dataset: hours studied → pass/fail", map: "Dataset",
      why: "Every supervised ML model needs labelled examples. Here we have 7 students — studying the data first reveals the pattern the model must learn.",
      render: (t) => <Stage2Dataset trace={t} />,
    },
    {
      id: "sigmoid", group: "Forward pass", title: "1 · The sigmoid function", map: "Sigmoid",
      why: "Sigmoid is the heart of logistic regression — it maps any real number to a valid probability. Understanding its shape and properties is essential.",
      render: (t) => <Stage3Sigmoid trace={t} />,
    },
    {
      id: "logit", group: "Forward pass", title: "2 · Linear combination (logit)", map: "Logit z=wx+b",
      why: "Before sigmoid, we compute a linear combination z = wx+b called the logit. Its sign determines the predicted class; its magnitude determines confidence.",
      render: (t) => <Stage4Logit trace={t} />,
    },
    {
      id: "hypothesis", group: "Forward pass", title: "3 · Hypothesis: P(y=1|x) = σ(wx+b)", map: "Hypothesis",
      why: "The hypothesis ties it together: move the hours slider and watch the probability and prediction update live. This is the complete forward pass.",
      render: (t, ctx) => <Stage5Hypothesis trace={t} ctx={ctx} />,
    },
    {
      id: "boundary", group: "Forward pass", title: "4 · Decision boundary", map: "Decision boundary",
      why: "The decision boundary divides the feature space into regions where the model predicts each class. For logistic regression it's always a hyperplane.",
      render: (t) => <Stage6Boundary trace={t} />,
    },
    {
      id: "loss", group: "Training", title: "5 · Binary cross-entropy loss", map: "BCE Loss",
      why: "Training needs a scalar error signal. BCE loss is the correct loss for probability outputs — it heavily penalises confident wrong predictions.",
      render: (t) => <Stage7Loss trace={t} />,
    },
    {
      id: "gradient", group: "Training", title: "6 · Gradient computation", map: "Gradients",
      why: "Gradients tell us which direction to nudge each weight to reduce the loss. For logistic regression + BCE, they take a beautifully simple form.",
      render: (t) => <Stage8Gradient trace={t} />,
    },
    {
      id: "training", group: "Training", title: "7 · Training & convergence", map: "Training",
      why: "Watch the model learn from scratch! Click 'One epoch' repeatedly to see the weights converge and the sigmoid curve fit the data.",
      render: (t) => <Stage9Training trace={t} />,
    },
    {
      id: "softmax", group: "Extensions", title: "8 · Multi-class: softmax", map: "Softmax",
      why: "Logistic regression generalises to K classes via softmax — the same operation used in the output layer of neural networks.",
      render: (t) => <Stage10Softmax />,
    },
    {
      id: "assumptions", group: "Context", title: "9 · Assumptions & when to use", map: "When to use",
      why: "Every model has a domain where it shines and one where it struggles. Knowing these helps you choose the right tool and interpret results correctly.",
      render: (t) => <Stage11Assumptions />,
    },
  ];

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "Logistic Regression",
    subtitle: "binary classification via the sigmoid function, step by step",
    cur: "Logistic Regression",
    category: "ML Algorithms",
    run: window.ML_LOG.runLogistic,
    default: window.ML_LOG.LOG.default,
    renderInput,
  };
})();
