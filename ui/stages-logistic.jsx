/* Logistic Regression — interactive ML explainer stages (full rewrite) */
(function () {
  const { Matrix, V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState, useRef, useEffect } = React;
  const LOG = window.ML_LOG.LOG;
  const sigmoid = window.ML_LOG.sigmoid;

  /* ─── shared SVG layout constants ─── */
  const W_SVG = 500, H_SVG = 230;
  const PAD = { l: 48, r: 22, t: 20, b: 36 };
  const innerW = W_SVG - PAD.l - PAD.r;
  const innerH = H_SVG - PAD.t - PAD.b;

  /* map hours (1–6) → SVG x */
  const sx = h => PAD.l + ((h - 1) / 5) * innerW;
  /* map probability (0–1) → SVG y */
  const sy = p => PAD.t + (1 - p) * innerH;

  /* ─── reusable SVG components ─── */

  function Axes({ xLabel = "hours studied", yLabel = "P(pass)", yTicks = [0, 0.25, 0.5, 0.75, 1.0] }) {
    const xTicks = [1, 2, 3, 4, 5, 6];
    return (
      <>
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.3" />
        <line x1={PAD.l} y1={PAD.t + innerH} x2={PAD.l + innerW} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.3" />
        {xTicks.map(h => (
          <g key={h}>
            <line x1={sx(h)} y1={PAD.t + innerH} x2={sx(h)} y2={PAD.t + innerH + 5} stroke="var(--line)" />
            <text x={sx(h)} y={PAD.t + innerH + 15} textAnchor="middle" className="reg-axl">{h}</text>
          </g>
        ))}
        {yTicks.map(p => (
          <g key={p}>
            <line x1={PAD.l - 5} y1={sy(p)} x2={PAD.l} y2={sy(p)} stroke="var(--line)" />
            <text x={PAD.l - 8} y={sy(p) + 4} textAnchor="end" className="reg-axl">{p.toFixed(2)}</text>
            {p > 0 && p < 1 && (
              <line x1={PAD.l} y1={sy(p)} x2={PAD.l + innerW} y2={sy(p)}
                stroke="var(--faint,#e8e8e8)" strokeWidth="0.7" strokeDasharray="4 4" />
            )}
          </g>
        ))}
        <text x={PAD.l + innerW / 2} y={H_SVG - 2} textAnchor="middle" className="reg-axl">{xLabel}</text>
        <text x={10} y={PAD.t + innerH / 2} textAnchor="middle" className="reg-axl"
          transform={`rotate(-90, 10, ${PAD.t + innerH / 2})`}>{yLabel}</text>
      </>
    );
  }

  function DataDots({ highlightX = -1, r = 6 }) {
    return (
      <>
        {LOG.xs.map((xi, i) => {
          const isHL = Math.abs(xi - highlightX) < 0.01;
          const col = LOG.ys[i] === 1 ? "rgba(31,158,107,0.88)" : "rgba(224,73,46,0.88)";
          return (
            <circle key={i} cx={sx(xi)}
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

  function SigmoidCurve({ w, b, color = "var(--accent)", sw = 2.6 }) {
    const pts = [];
    for (let h = 0.6; h <= 6.4; h += 0.07) {
      const p = sigmoid(w * h + b);
      pts.push(`${sx(h).toFixed(1)},${sy(p).toFixed(1)}`);
    }
    return <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />;
  }

  /* ══════════════════════════════════════════════
     STAGE 1 — Overview
  ══════════════════════════════════════════════*/
  function StageOverview({ trace }) {
    const { wLin, bLin } = trace;
    const linY = h => wLin * h + bLin;
    const clampedLinY = h => Math.min(1.22, Math.max(-0.22, linY(h)));
    const linPts = [0.5, 6.5].map(h => `${sx(h).toFixed(1)},${sy(clampedLinY(h)).toFixed(1)}`).join(" ");

    return (
      <>
        <Lead>
          Imagine you are a teacher trying to predict which students will pass an exam. You know
          how many hours each student studied. This is a <b>binary classification</b> problem:
          the output is one of exactly two classes — <b>pass (1) or fail (0)</b>. The question is:
          what mathematical model maps hours studied to a valid probability of passing?
        </Lead>
        <Lead>
          The naive answer is linear regression — draw a straight line through the data. But linear
          regression predicts <b>any real number</b>. A student who studied 10 hours would get a
          predicted probability of 1.4, and one who studied 0 hours might get −0.3. Both are
          nonsensical as probabilities, which must live in <b>[0, 1]</b>. The chart below shows
          exactly this problem on our toy dataset.
        </Lead>

        <div className="tf-subhead">The problem with linear regression for classification</div>
        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="reg-chart" style={{ width: "100%", maxWidth: W_SVG }}>
          <Axes yLabel="predicted value" />
          <rect x={PAD.l} y={PAD.t} width={innerW} height={sy(1) - PAD.t} fill="rgba(224,73,46,0.07)" />
          <text x={PAD.l + innerW - 6} y={PAD.t + 13} textAnchor="end" className="reg-axl" fill="#e0492e">nonsensical &gt; 1</text>
          <rect x={PAD.l} y={sy(0)} width={innerW} height={PAD.t + innerH - sy(0)} fill="rgba(224,73,46,0.07)" />
          <text x={PAD.l + innerW - 6} y={PAD.t + innerH - 5} textAnchor="end" className="reg-axl" fill="#e0492e">nonsensical &lt; 0</text>
          <polyline points={linPts} fill="none" stroke="#e0851e" strokeWidth="2.2" strokeDasharray="5 4" />
          <text x={sx(5.6)} y={sy(clampedLinY(5.6)) - 9} className="reg-axl" fill="#e0851e">linear fit</text>
          <DataDots highlightX={-1} r={6} />
        </svg>

        <Lead>
          <b>Logistic regression</b> solves this cleanly. Instead of outputting z = w·x + b directly,
          it wraps that linear combination through the <b>sigmoid function</b> σ(z) = 1/(1+e⁻ᶻ),
          which squashes any real number into (0, 1). The result is always a valid probability.
          Training finds the weight w and bias b that make those probabilities align with the observed
          pass/fail labels.
        </Lead>

        <div className="tf-archwrap">
          <div className="tf-arch">
            <div className="tf-arch-io">hours studied x<span>input feature — a real number</span></div>
            <div className="tf-arch-f">z = w · x + b</div>
            <div className="tf-arch-row">z — the logit (log-odds), any real number</div>
            <div className="tf-arch-f">σ(z) = 1 / (1 + e⁻ᶻ)</div>
            <div className="tf-arch-io tf-arch-io--out">P(pass | x) ∈ (0, 1)<span>a valid probability — always</span></div>
          </div>
        </div>

        <div className="tf-subhead">The full training pipeline</div>
        <div className="tf-lifecycle">
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>1</span> Forward pass</div>
            <p>For each training example x, compute <b>z = wx + b</b>, then <b>p̂ = σ(z)</b>. This gives a
              predicted probability of passing. No randomness — the same weights always give the same output.</p>
          </div>
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>2</span> Compute BCE loss</div>
            <p>Measure how wrong the prediction is using <b>Binary Cross-Entropy loss</b>.
              If the true label is 1 and p̂ is near 0, the loss is enormous. If p̂ is near 1, the loss
              is nearly 0. Loss is averaged over all n training examples.</p>
          </div>
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>3</span> Compute gradients</div>
            <p>Use calculus to compute ∂L/∂w and ∂L/∂b — the slope of the loss surface with respect
              to each parameter. For logistic regression + BCE, these gradients simplify beautifully
              to mean[(p̂−y)·x] and mean[p̂−y].</p>
          </div>
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>4</span> Gradient descent update</div>
            <p>Nudge the parameters in the direction that reduces loss: <b>w ← w − η·∂L/∂w</b> and
              <b> b ← b − η·∂L/∂b</b>. Repeat from step 1 until the loss stops decreasing.
              η (eta) is the <b>learning rate</b>.</p>
          </div>
          <div className="tf-life tf-life--infer">
            <div className="tf-life-h"><span>5</span> Predict (inference)</div>
            <p>With the learned w* and b*, compute p̂ = σ(w*x + b*) for any new x. Apply a
              <b> threshold</b> (default 0.5): if p̂ ≥ 0.5, predict pass; else predict fail.
              The threshold can be adjusted for different precision/recall tradeoffs.</p>
          </div>
        </div>

        <div className="tf-legend">
          {[
            ["x", "input feature", "hours studied — the raw numeric input to the model"],
            ["z = wx+b", "logit / log-odds", "the linear combination; can be any real number"],
            ["σ(z)", "sigmoid function", "maps ℝ → (0,1); the squashing step that gives a valid probability"],
            ["P(y=1|x)", "conditional probability", "probability of passing given x hours studied"],
            ["w, b", "learned parameters", "weight and bias — the values gradient descent optimises"],
            ["η", "learning rate", "step size for gradient descent updates; typically 0.01–0.3"],
          ].map(r => (
            <div className="tf-leg" key={r[0]}>
              <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span></div>
              <div className="tf-leg-name">{r[1]}</div>
              <div className="tf-leg-desc">{r[2]}</div>
            </div>
          ))}
        </div>

        <Note>Use the <b>sliders</b> in the top bar to change hours studied (x), weight (w), and
          bias (b) — every chart and calculation on every stage updates live to reflect your chosen
          parameters.</Note>
      </>
    );
  }

  /* ══════════════════════════════════════════════
     STAGE 2 — Dataset
  ══════════════════════════════════════════════*/
  function StageDataset({ trace }) {
    const passes = LOG.ys.filter(y => y === 1).length;
    const fails = LOG.ys.filter(y => y === 0).length;

    return (
      <>
        <Lead>
          Before we can train any model, we need <b>labelled examples</b> — pairs of (input, output)
          that demonstrate the pattern we want to learn. Our toy dataset has <b>7 students</b>.
          Each studied between 1 and 6 hours for an exam, and we know whether they passed or failed.
          The <b>feature</b> (input) is hours studied; the <b>label</b> (output) is 0 (fail) or 1 (pass).
        </Lead>

        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="reg-chart" style={{ width: "100%", maxWidth: W_SVG }}>
          <Axes yLabel="label (0=fail, 1=pass)" />
          <line x1={PAD.l} y1={sy(0.5)} x2={PAD.l + innerW} y2={sy(0.5)}
            stroke="var(--faint,#e8e8e8)" strokeWidth="1" strokeDasharray="4 4" />
          <text x={PAD.l + 10} y={sy(0.24)} className="reg-axl" fill="rgba(224,73,46,0.75)">FAIL zone</text>
          <text x={PAD.l + 10} y={sy(0.76)} className="reg-axl" fill="rgba(31,158,107,0.75)">PASS zone</text>
          <DataDots highlightX={trace.x} r={7} />
          {LOG.xs.map((xi, i) => (
            <text key={i} x={sx(xi)}
              y={LOG.ys[i] === 1 ? sy(0.97) - 13 : sy(0.03) + 19}
              textAnchor="middle" className="reg-axl"
              fill={LOG.ys[i] === 1 ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)"}>
              {LOG.ys[i] === 1 ? "pass" : "fail"}
            </text>
          ))}
        </svg>

        <Lead>
          Notice the pattern: students who studied <b>3.5 hours or more all passed</b>; those who
          studied <b>2.5 hours or less all failed</b>. The dataset is <b>linearly separable</b> —
          a single vertical line around 3 hours cleanly divides the two classes. Logistic regression
          will find this boundary automatically during training, without us telling it where it is.
        </Lead>

        <div className="tf-subhead">All 7 training examples</div>
        <div className="nn-calc">
          <div className="nn-calc-h">Dataset: hours studied → exam outcome</div>
          <div className="nn-calc-row" style={{ fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
            <span style={{ width: 36, display: "inline-block" }}>#</span>
            <span style={{ width: 100, display: "inline-block" }}>x (hours)</span>
            <span style={{ width: 80, display: "inline-block" }}>y (label)</span>
            <span>outcome</span>
          </div>
          {LOG.xs.map((xi, i) => (
            <div className="nn-calc-row" key={i}
              style={{ background: Math.abs(xi - trace.x) < 0.01 ? "rgba(var(--accent-rgb,99,102,241),0.09)" : undefined }}>
              <span style={{ width: 36, display: "inline-block", opacity: 0.45 }}>{i + 1}</span>
              <span style={{ width: 100, display: "inline-block" }}><b>{xi.toFixed(1)} h</b></span>
              <span style={{ width: 80, display: "inline-block" }}>{LOG.ys[i]}</span>
              <span style={{ color: LOG.ys[i] === 1 ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)", fontWeight: 700 }}>
                {LOG.ys[i] === 1 ? "✓ pass" : "✗ fail"}
              </span>
            </div>
          ))}
        </div>

        <div className="tf-lifecycle">
          <div className="tf-life tf-life--infer">
            <div className="tf-life-h"><span>{passes}</span> Passes (y = 1)</div>
            <p>Four students passed — those who studied 3.5 h, 4.5 h, 5.5 h, and 6 h. The model
              should output a probability close to <b>1</b> for these examples after training.</p>
          </div>
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>{fails}</span> Fails (y = 0)</div>
            <p>Three students failed — those who studied 1 h, 1.5 h, and 2.5 h. The model should
              output a probability close to <b>0</b> for these after training.</p>
          </div>
        </div>

        <div className="tf-subhead">Key terminology</div>
        <div className="tf-legend">
          {[
            ["Feature (x)", "The input variable used to make the prediction. Here: hours studied. In general, you can have many features (x₁, x₂, …, xₙ)."],
            ["Label (y)", "The true output we want to predict. For binary classification y ∈ {0, 1}. Here: 0 = fail, 1 = pass."],
            ["Binary classification", "The task of assigning examples to one of exactly two classes. Logistic regression is the canonical tool for this."],
            ["Linear separability", "A dataset is linearly separable if a straight line (or hyperplane in high dimensions) can perfectly divide the two classes."],
            ["Class imbalance", "When one class is much more frequent than the other. Our dataset is 4:3 — roughly balanced. Imbalanced data requires special handling (resampling, weighted loss, F1 over accuracy)."],
          ].map(r => (
            <div className="tf-leg" key={r[0]}>
              <div className="tf-leg-name">{r[0]}</div>
              <div className="tf-leg-desc">{r[1]}</div>
            </div>
          ))}
        </div>

        <Note>In real-world problems you'd have hundreds or thousands of examples and many features.
          The mathematics is identical — just more dimensions. Our 7-point dataset lets every step
          be visible and traceable by hand.</Note>
      </>
    );
  }

  /* ══════════════════════════════════════════════
     STAGE 3 — The Sigmoid Function
  ══════════════════════════════════════════════*/
  function StageSigmoid({ trace }) {
    /* sigmoid chart runs from z = -8 to +8 */
    const SW = W_SVG, SH = H_SVG;
    const sxSig = z => PAD.l + ((z + 8) / 16) * innerW;
    const sySig = p => PAD.t + (1 - p) * innerH;

    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const z = -8 + 16 * i / 120;
      pts.push(`${sxSig(z).toFixed(1)},${sySig(sigmoid(z)).toFixed(1)}`);
    }

    const { z, prob } = trace;
    const zC = Math.max(-7.9, Math.min(7.9, z));
    const xTicks = [-8, -6, -4, -2, 0, 2, 4, 6, 8];
    const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

    return (
      <>
        <Lead>
          The <b>sigmoid function</b> (also called the <b>logistic function</b> — hence the name
          "logistic regression") is defined as σ(z) = 1 / (1 + e⁻ᶻ). Feed it any real number z and
          it hands back a number strictly between 0 and 1. This is the mathematical trick that turns
          an unconstrained linear combination into a valid probability.
        </Lead>
        <Lead>
          Imagine z as a "confidence score". A very large positive z — say, z = 8 — means the model
          is extremely confident the label is 1: σ(8) ≈ 0.9997. A very negative z, say z = −8, means
          the model is extremely confident the label is 0: σ(−8) ≈ 0.0003. Exactly at z = 0, the
          model is completely uncertain: σ(0) = 0.5. This point — the 50/50 crossover — is the
          <b> decision boundary</b>. The orange dot below tracks your current query point.
        </Lead>

        <Formula label="sigmoid / logistic function">σ(z) = 1 / (1 + e<Sup>−z</Sup>)</Formula>

        <svg viewBox={`0 0 ${SW} ${SH}`} className="reg-chart" style={{ width: "100%", maxWidth: SW }}>
          {/* axes */}
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.3" />
          <line x1={PAD.l} y1={PAD.t + innerH} x2={PAD.l + innerW} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.3" />
          {/* reference lines */}
          <line x1={PAD.l} y1={sySig(0.5)} x2={PAD.l + innerW} y2={sySig(0.5)}
            stroke="var(--faint,#ddd)" strokeWidth="1" strokeDasharray="5 4" />
          <line x1={sxSig(0)} y1={PAD.t} x2={sxSig(0)} y2={PAD.t + innerH}
            stroke="var(--faint,#ddd)" strokeWidth="1" strokeDasharray="5 4" />
          {/* ticks */}
          {xTicks.map(x => (
            <g key={x}>
              <line x1={sxSig(x)} y1={PAD.t + innerH} x2={sxSig(x)} y2={PAD.t + innerH + 5} stroke="var(--line)" />
              <text x={sxSig(x)} y={PAD.t + innerH + 15} textAnchor="middle" className="reg-axl">{x}</text>
            </g>
          ))}
          {yTicks.map(p => (
            <g key={p}>
              <line x1={PAD.l - 5} y1={sySig(p)} x2={PAD.l} y2={sySig(p)} stroke="var(--line)" />
              <text x={PAD.l - 8} y={sySig(p) + 4} textAnchor="end" className="reg-axl">{p.toFixed(2)}</text>
            </g>
          ))}
          <text x={PAD.l + innerW / 2} y={SH - 2} textAnchor="middle" className="reg-axl">z (logit)</text>
          <text x={10} y={PAD.t + innerH / 2} textAnchor="middle" className="reg-axl"
            transform={`rotate(-90, 10, ${PAD.t + innerH / 2})`}>σ(z)</text>
          {/* sigmoid curve */}
          <polyline points={pts.join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2.8" strokeLinejoin="round" />
          {/* σ(0) = 0.5 annotation */}
          <circle cx={sxSig(0)} cy={sySig(0.5)} r="5" fill="var(--accent)" />
          <text x={sxSig(0) + 9} y={sySig(0.5) - 7} className="reg-axl" fill="var(--accent)">σ(0) = 0.5</text>
          {/* asymptote annotations */}
          <text x={PAD.l + innerW - 6} y={sySig(0.98)} textAnchor="end" className="reg-axl" fill="rgba(31,158,107,0.85)">→ 1</text>
          <text x={PAD.l + innerW - 6} y={sySig(0.03)} textAnchor="end" className="reg-axl" fill="rgba(224,73,46,0.85)">→ 0</text>
          {/* current z point */}
          <line x1={sxSig(zC)} y1={PAD.t} x2={sxSig(zC)} y2={sySig(prob)}
            stroke="#e0851e" strokeWidth="1.6" strokeDasharray="3 3" />
          <line x1={PAD.l} y1={sySig(prob)} x2={sxSig(zC)} y2={sySig(prob)}
            stroke="#e0851e" strokeWidth="1.6" strokeDasharray="3 3" />
          <circle cx={sxSig(zC)} cy={sySig(prob)} r="6" fill="#e0851e" />
          <text x={sxSig(zC) + 9} y={sySig(prob) - 8} className="reg-axl" fill="#e0851e">
            z={fmt(zC)} → {(prob * 100).toFixed(1)}%
          </text>
        </svg>

        <Lead>
          Notice the S-shape: the curve is very flat near z = −8 and z = +8 (the model is
          already very confident), and steepest at z = 0. This means gradients are largest when the
          model is uncertain — exactly when there is the most to learn. The derivative of σ is
          σ(z)·(1−σ(z)), which achieves its maximum of 0.25 at z = 0.
        </Lead>

        <div className="nn-calc">
          <div className="nn-calc-h">Live computation for x = {trace.x.toFixed(1)} h (current query)</div>
          <div className="nn-calc-row">Step 1 — linear combination:&nbsp;
            z = {fmt(trace.w)} · {trace.x.toFixed(1)} + ({fmt(trace.b)}) = <b>{fmt(trace.z)}</b></div>
          <div className="nn-calc-row">Step 2 — apply sigmoid:&nbsp;
            σ({fmt(trace.z)}) = 1 / (1 + e<sup>−({fmt(trace.z)})</sup>) = <b className="nn-calc-res">{(trace.prob * 100).toFixed(3)}%</b></div>
          <div className="nn-calc-row">Interpretation:&nbsp;
            <span style={{ color: trace.pred === 1 ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)", fontWeight: 700 }}>
              {(trace.prob * 100).toFixed(1)}% probability of passing
            </span>
          </div>
        </div>

        <div className="tf-legend">
          {[
            ["σ(z) → 0 as z → −∞", "Very negative logit: the model is almost certain the label is 0 (fail). The further left, the more confident."],
            ["σ(0) = 0.5", "Zero logit: the model is completely uncertain — a perfect 50/50 coin flip. This is the decision boundary."],
            ["σ(z) → 1 as z → +∞", "Very positive logit: the model is almost certain the label is 1 (pass)."],
            ["σ′(z) = σ(z)·(1−σ(z))", "The derivative is elegant and efficient to compute during backpropagation. It vanishes near the extremes — the saturation problem."],
          ].map(r => (
            <div className="tf-leg" key={r[0]}>
              <div className="tf-leg-name">{r[0]}</div>
              <div className="tf-leg-desc">{r[1]}</div>
            </div>
          ))}
        </div>

        <Note>Sigmoid was used in early neural networks as an activation function, but it was
          largely replaced by ReLU in deep nets because its gradients saturate near 0 and 1,
          slowing learning in deep stacks. For logistic regression's output layer, it remains
          the correct choice.</Note>
      </>
    );
  }

  /* ══════════════════════════════════════════════
     STAGE 4 — Decision Boundary
  ══════════════════════════════════════════════*/
  function StageDecisionBoundary({ trace }) {
    const { w, b, boundary } = trace;

    return (
      <>
        <Lead>
          Once we have the model P(pass|x) = σ(wx+b), we need to convert that probability into
          a hard class prediction. We do this with a <b>threshold</b>: by default, if P(pass) ≥ 0.5,
          predict pass; otherwise, predict fail. The point where P(pass) = exactly 0.5 is called
          the <b>decision boundary</b>.
        </Lead>
        <Lead>
          Mathematically, σ(z) = 0.5 happens exactly when z = 0, because σ(0) = 1/(1+e⁰) = 1/2.
          So the decision boundary is the value of x where the logit z = wx+b = 0. Solving:
          <b> x* = −b / w</b>. With the current weights, x* = {fmt(boundary)} hours. Anything above
          that predicts pass; anything below predicts fail.
        </Lead>

        <Formula label="decision boundary">w·x + b = 0 &nbsp;→&nbsp; x* = −b/w = −({fmt(b)}) / {fmt(w)} = <b>{fmt(boundary)}</b> h</Formula>

        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="reg-chart" style={{ width: "100%", maxWidth: W_SVG }}>
          <Axes yLabel="P(pass)" />
          {/* shaded regions */}
          {boundary !== null && boundary >= 1 && boundary <= 6 && (
            <>
              <rect x={PAD.l} y={PAD.t} width={Math.max(0, sx(boundary) - PAD.l)} height={innerH}
                fill="rgba(224,73,46,0.06)" />
              <rect x={sx(boundary)} y={PAD.t} width={Math.max(0, PAD.l + innerW - sx(boundary))} height={innerH}
                fill="rgba(31,158,107,0.06)" />
            </>
          )}
          {/* 0.5 line */}
          <line x1={PAD.l} y1={sy(0.5)} x2={PAD.l + innerW} y2={sy(0.5)}
            stroke="var(--faint,#ddd)" strokeWidth="1" strokeDasharray="4 3" />
          <text x={PAD.l + 6} y={sy(0.5) - 5} className="reg-axl" fill="var(--faint,#aaa)">0.5 threshold</text>
          {/* sigmoid curve */}
          <SigmoidCurve w={w} b={b} />
          {/* decision boundary */}
          {boundary !== null && (
            <>
              <line x1={sx(boundary)} y1={PAD.t} x2={sx(boundary)} y2={PAD.t + innerH}
                stroke="#e0851e" strokeWidth="2.2" strokeDasharray="5 4" />
              <text x={sx(boundary) + 6} y={PAD.t + 15} className="reg-axl" fill="#e0851e">x*={fmt(boundary)}</text>
              <text x={sx(boundary) - 6} y={PAD.t + 30} textAnchor="end" className="reg-axl" fill="rgba(224,73,46,0.85)">← fail</text>
              <text x={sx(boundary) + 6} y={PAD.t + 30} className="reg-axl" fill="rgba(31,158,107,0.85)">pass →</text>
            </>
          )}
          {/* data dots */}
          <DataDots highlightX={trace.x} r={6} />
          {/* query point */}
          <line x1={sx(trace.x)} y1={PAD.t} x2={sx(trace.x)} y2={sy(trace.prob)}
            stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx={sx(trace.x)} cy={sy(trace.prob)} r="5" fill="var(--accent)" />
        </svg>

        <div className="nn-calc">
          <div className="nn-calc-h">Decision boundary derivation (current weights)</div>
          <div className="nn-calc-row">σ(wx + b) = 0.5 &nbsp;⟺&nbsp; wx + b = 0 &nbsp;⟺&nbsp; x* = −b/w</div>
          <div className="nn-calc-row">x* = −({fmt(b)}) / {fmt(w)} = <b className="nn-calc-res">{fmt(boundary)} h</b></div>
          <div className="nn-calc-row">
            x = {trace.x.toFixed(1)} h is {trace.x > (boundary || 0) ? "to the right of" : "to the left of"} the boundary
            → predict <b style={{ color: trace.pred === 1 ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)" }}>
              {trace.pred === 1 ? "PASS" : "FAIL"}
            </b>
          </div>
        </div>

        <div className="tf-lifecycle">
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>←</span> Left of x* (predict fail)</div>
            <p>P(pass) &lt; 0.5. At 1 h: P = {fmt(sigmoid(w * 1 + b))}. At 2 h: P = {fmt(sigmoid(w * 2 + b))}.
              The further left, the closer to 0 — the model is increasingly confident it's a fail.</p>
          </div>
          <div className="tf-life tf-life--infer">
            <div className="tf-life-h"><span>→</span> Right of x* (predict pass)</div>
            <p>P(pass) &gt; 0.5. At 4 h: P = {fmt(sigmoid(w * 4 + b))}. At 6 h: P = {fmt(sigmoid(w * 6 + b))}.
              The further right, the closer to 1 — the model becomes increasingly certain.</p>
          </div>
        </div>

        <Lead>
          One key insight: logistic regression always produces a <b>linear</b> decision boundary —
          a vertical line in 1D, a line in 2D, a plane in 3D, and a hyperplane in higher dimensions.
          This is both its strength (simple, interpretable) and its limitation (it can't learn
          curved or spiral boundaries without feature engineering or a different model).
        </Lead>

        <Note>The default threshold of 0.5 is not sacred. In medical screening you might lower it
          to 0.3 so you don't miss true positives (at the cost of more false alarms). This
          precision/recall tradeoff is exactly what the ROC curve, explored in the Evaluation
          stage, visualises.</Note>
      </>
    );
  }

  /* ══════════════════════════════════════════════
     STAGE 5 — Binary Cross-Entropy Loss
  ══════════════════════════════════════════════*/
  function StageBCELoss({ trace }) {
    const { loss, losses, probs } = trace;
    const maxLoss = Math.max(...losses, 0.01);

    const LW = W_SVG, LH = H_SVG;
    const lsy = l => PAD.t + (1 - Math.min(l / 5, 1)) * innerH;
    const lsx = p => PAD.l + p * innerW;

    const bceTrue = [], bceFalse = [];
    for (let p = 0.005; p <= 0.995; p += 0.01) {
      bceTrue.push(`${lsx(p).toFixed(1)},${lsy(-Math.log(p)).toFixed(1)}`);
      bceFalse.push(`${lsx(p).toFixed(1)},${lsy(-Math.log(1 - p)).toFixed(1)}`);
    }

    return (
      <>
        <Lead>
          We need a way to measure how wrong our model is — a single number that goes up when we
          are wrong and down when we are right. For binary classification, the correct loss is
          <b> Binary Cross-Entropy (BCE)</b>, also called <b>log loss</b>. It comes directly from
          maximum likelihood estimation: we want to find the w and b that make the observed labels
          as probable as possible under our model.
        </Lead>
        <Lead>
          The intuition is logarithmic punishment. If the true label is 1 and our model says
          P(pass) = 0.99, that's great — loss ≈ 0.01. But if our model confidently says P(pass) = 0.01
          when the truth is 1, then −log(0.01) ≈ 4.6 — a massive penalty. The model pays dearly
          for being <b>confidently wrong</b>. This asymmetry is why BCE is far superior to MSE
          for probability outputs.
        </Lead>

        <Formula label="BCE loss (one example)">L = −[ y · log(p̂) + (1−y) · log(1−p̂) ]</Formula>
        <Formula label="BCE loss (full dataset — average)">L = −(1/n) Σᵢ [ yᵢ · log(p̂ᵢ) + (1−yᵢ) · log(1−p̂ᵢ) ]</Formula>

        <div className="tf-subhead">Why not MSE? — the loss landscape matters</div>
        <div className="tf-lifecycle">
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>✗</span> MSE for classification</div>
            <p>MSE = mean[(p̂−y)²] applied to logistic regression creates a <b>non-convex</b> loss
              surface with many local minima. Gradient descent can get stuck. Also, MSE doesn't
              penalise confident wrong predictions strongly enough.</p>
          </div>
          <div className="tf-life tf-life--infer">
            <div className="tf-life-h"><span>✓</span> BCE for classification</div>
            <p>BCE gives a <b>convex</b> loss surface — a single bowl with one global minimum.
              Gradient descent always finds it. BCE also has a natural connection to maximum
              likelihood under a Bernoulli model — the statistically correct choice.</p>
          </div>
        </div>

        <div className="tf-subhead">BCE loss shape: green = when y=1, red = when y=0</div>
        <svg viewBox={`0 0 ${LW} ${LH}`} className="reg-chart" style={{ width: "100%", maxWidth: LW }}>
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.3" />
          <line x1={PAD.l} y1={PAD.t + innerH} x2={PAD.l + innerW} y2={PAD.t + innerH} stroke="var(--line)" strokeWidth="1.3" />
          {[0, 0.25, 0.5, 0.75, 1.0].map(p => (
            <g key={p}>
              <line x1={lsx(p)} y1={PAD.t + innerH} x2={lsx(p)} y2={PAD.t + innerH + 5} stroke="var(--line)" />
              <text x={lsx(p)} y={PAD.t + innerH + 15} textAnchor="middle" className="reg-axl">{p}</text>
              {p > 0 && p < 1 && <line x1={lsx(p)} y1={PAD.t} x2={lsx(p)} y2={PAD.t + innerH} stroke="var(--faint,#eee)" strokeWidth="0.6" strokeDasharray="4 4" />}
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5].map(l => (
            <g key={l}>
              <line x1={PAD.l - 5} y1={lsy(l)} x2={PAD.l} y2={lsy(l)} stroke="var(--line)" />
              <text x={PAD.l - 8} y={lsy(l) + 4} textAnchor="end" className="reg-axl">{l}</text>
              {l > 0 && <line x1={PAD.l} y1={lsy(l)} x2={PAD.l + innerW} y2={lsy(l)} stroke="var(--faint,#eee)" strokeWidth="0.6" strokeDasharray="4 3" />}
            </g>
          ))}
          <text x={lsx(0.5)} y={LH - 2} textAnchor="middle" className="reg-axl">predicted probability p̂</text>
          <text x={10} y={PAD.t + innerH / 2} textAnchor="middle" className="reg-axl"
            transform={`rotate(-90, 10, ${PAD.t + innerH / 2})`}>BCE loss</text>
          <polyline points={bceTrue.join(" ")} fill="none" stroke="rgba(31,158,107,0.92)" strokeWidth="2.5" />
          <text x={lsx(0.82)} y={lsy(0.25)} className="reg-axl" fill="rgba(31,158,107,0.92)">y=1: −log(p̂)</text>
          <polyline points={bceFalse.join(" ")} fill="none" stroke="rgba(224,73,46,0.92)" strokeWidth="2.5" />
          <text x={lsx(0.15)} y={lsy(0.25)} className="reg-axl" fill="rgba(224,73,46,0.92)">y=0: −log(1−p̂)</text>
        </svg>

        <Lead>
          For y=1 (green curve), notice that as p̂ → 0 (we predict fail when the truth is pass),
          the loss −log(p̂) → ∞. As p̂ → 1 (we correctly predict pass), loss → 0. The curve is
          steep near p̂ = 0 and flat near p̂ = 1. For y=0 (red curve) it's the mirror image:
          loss = −log(1−p̂), which explodes as p̂ → 1 (confident wrong prediction).
        </Lead>

        <div className="tf-subhead">Per-example losses (w={fmt(trace.w)}, b={fmt(trace.b)})</div>
        <div className="nn-calc">
          <div className="nn-calc-h">Average BCE loss across all 7 examples = <b>{fmt(loss)}</b></div>
          <div className="nn-calc-row" style={{ fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
            <span style={{ width: 52, display: "inline-block" }}>x (h)</span>
            <span style={{ width: 32, display: "inline-block" }}>y</span>
            <span style={{ width: 70, display: "inline-block" }}>p̂ = σ(wx+b)</span>
            <span style={{ width: 80, display: "inline-block" }}>loss</span>
            <span>magnitude</span>
          </div>
          {LOG.xs.map((xi, i) => {
            const li = losses[i];
            const barW = Math.round(Math.min(li / maxLoss * 90, 90));
            return (
              <div className="nn-calc-row" key={i}
                style={{ background: Math.abs(xi - trace.x) < 0.01 ? "rgba(var(--accent-rgb,99,102,241),0.09)" : undefined }}>
                <span style={{ width: 52, display: "inline-block" }}>{xi.toFixed(1)}</span>
                <span style={{ width: 32, display: "inline-block" }}>{LOG.ys[i]}</span>
                <span style={{ width: 70, display: "inline-block" }}>{fmt(probs[i])}</span>
                <span style={{ width: 80, display: "inline-block", fontWeight: 700 }}>{fmt(li)}</span>
                <span style={{
                  display: "inline-block", width: barW + "px", height: "8px",
                  background: li > 0.5 ? "rgba(224,73,46,0.7)" : "rgba(31,158,107,0.55)",
                  borderRadius: 3
                }} />
              </div>
            );
          })}
        </div>

        <div className="tf-subhead">Step-by-step BCE for example i=4 (x=3.5 h, y=1)</div>
        <div className="nn-calc">
          <div className="nn-calc-h">Manual BCE calculation</div>
          <div className="nn-calc-row">z = {fmt(trace.w)} × 3.5 + ({fmt(trace.b)}) = {fmt(trace.w * 3.5 + trace.b)}</div>
          <div className="nn-calc-row">p̂ = σ({fmt(trace.w * 3.5 + trace.b)}) = {fmt(sigmoid(trace.w * 3.5 + trace.b))}</div>
          <div className="nn-calc-row">y = 1 → loss = −log(p̂) = −log({fmt(sigmoid(trace.w * 3.5 + trace.b))}) = <b>{fmt(-Math.log(Math.max(sigmoid(trace.w * 3.5 + trace.b), 1e-9)))}</b></div>
          <div className="nn-calc-row">Interpretation: {sigmoid(trace.w * 3.5 + trace.b) > 0.5 ? "Model correctly predicted pass — small loss ✓" : "Model wrongly predicted fail — large loss ✗"}</div>
        </div>

        <Note>BCE loss is strictly convex in w and b for logistic regression. This guarantees that
          gradient descent finds the unique global minimum — no worrying about getting stuck in
          local minima, unlike neural network training.</Note>
      </>
    );
  }

  /* ══════════════════════════════════════════════
     STAGE 6 — Gradients
  ══════════════════════════════════════════════*/
  function StageGradients({ trace }) {
    const { w, b, dw, db, residuals, probs } = trace;
    const n = LOG.xs.length;
    const eta = 0.1;

    return (
      <>
        <Lead>
          Having measured the loss, we now need to know <b>how to improve</b> the weights. The
          gradient ∂L/∂w tells us: "if I increase w by a tiny amount ε, how much does the loss
          change?" If the gradient is positive, increasing w increases loss — so we should decrease
          w. The gradient always points <b>uphill</b>; we want to go downhill.
        </Lead>
        <Lead>
          For logistic regression with BCE loss, the chain rule of calculus gives a wonderfully
          elegant result. The gradient of the loss with respect to the logit z is simply p̂ − y —
          the prediction error. Then ∂L/∂w = mean[(p̂−y)·x] and ∂L/∂b = mean[p̂−y]. This is
          structurally identical to the gradient for linear regression, even though we used a
          completely different loss function. The sigmoid and BCE "cancel" each other in a
          beautiful way.
        </Lead>

        <Formula label="gradient of BCE w.r.t. w">∂L/∂w = (1/n) Σ (p̂<Sub>i</Sub> − y<Sub>i</Sub>) · x<Sub>i</Sub></Formula>
        <Formula label="gradient of BCE w.r.t. b">∂L/∂b = (1/n) Σ (p̂<Sub>i</Sub> − y<Sub>i</Sub>)</Formula>

        <div className="tf-subhead">Chain rule derivation (why the gradient is so clean)</div>
        <div className="nn-calc">
          <div className="nn-calc-h">Deriving ∂L/∂w via chain rule</div>
          <div className="nn-calc-row">L = −[y·log(σ(z)) + (1−y)·log(1−σ(z))]</div>
          <div className="nn-calc-row">∂L/∂z = σ(z) − y = p̂ − y  &nbsp;(this simplification is the key elegance)</div>
          <div className="nn-calc-row">∂z/∂w = x  &nbsp;(since z = wx + b)</div>
          <div className="nn-calc-row">∂L/∂w = ∂L/∂z · ∂z/∂w = (p̂ − y) · x  &nbsp;(chain rule)</div>
          <div className="nn-calc-row" style={{ fontWeight: 700 }}>Average over n examples: ∂L/∂w = (1/n) Σ (p̂ᵢ − yᵢ) · xᵢ</div>
        </div>

        <div className="tf-subhead">Residuals and gradient contributions (current weights)</div>
        <div className="nn-calc">
          <div className="nn-calc-h">Per-example residuals (p̂ − y): positive = predicted too high, negative = too low</div>
          <div className="nn-calc-row" style={{ fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
            <span style={{ width: 52, display: "inline-block" }}>x (h)</span>
            <span style={{ width: 32, display: "inline-block" }}>y</span>
            <span style={{ width: 72, display: "inline-block" }}>p̂</span>
            <span style={{ width: 80, display: "inline-block" }}>p̂ − y</span>
            <span style={{ width: 96, display: "inline-block" }}>(p̂−y)·x</span>
          </div>
          {LOG.xs.map((xi, i) => {
            const res = residuals[i];
            const contrib = res * xi;
            const resCol = res > 0.02 ? "rgba(224,73,46,0.9)" : res < -0.02 ? "rgba(31,158,107,0.9)" : "inherit";
            return (
              <div className="nn-calc-row" key={i}>
                <span style={{ width: 52, display: "inline-block" }}>{xi.toFixed(1)}</span>
                <span style={{ width: 32, display: "inline-block" }}>{LOG.ys[i]}</span>
                <span style={{ width: 72, display: "inline-block" }}>{fmt(probs[i])}</span>
                <span style={{ width: 80, display: "inline-block", color: resCol, fontWeight: 700 }}>{fmt(res)}</span>
                <span style={{ width: 96, display: "inline-block" }}>{fmt(contrib)}</span>
              </div>
            );
          })}
          <div className="nn-calc-row" style={{ fontWeight: 700, borderTop: "1px solid var(--line)" }}>
            <span style={{ width: 52 + 32 + 72, display: "inline-block" }}>mean (n={n}) →</span>
            <span style={{ width: 80, display: "inline-block" }}>∂L/∂b = <b>{fmt(db)}</b></span>
            <span style={{ width: 96, display: "inline-block" }}>∂L/∂w = <b>{fmt(dw)}</b></span>
          </div>
        </div>

        <div className="tf-subhead">One gradient descent step (η = {eta})</div>
        <div className="nn-calc">
          <div className="nn-calc-h">Parameter update: new = old − η · gradient</div>
          <div className="nn-calc-row">
            w_new = {fmt(w)} − {eta} × {fmt(dw)} = <b className="nn-calc-res">{fmt(w - eta * dw)}</b>
            &nbsp;<span style={{ opacity: 0.6 }}>(change: {fmt(-eta * dw)})</span>
          </div>
          <div className="nn-calc-row">
            b_new = {fmt(b)} − {eta} × {fmt(db)} = <b className="nn-calc-res">{fmt(b - eta * db)}</b>
            &nbsp;<span style={{ opacity: 0.6 }}>(change: {fmt(-eta * db)})</span>
          </div>
        </div>

        <div className="tf-lifecycle">
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>∂</span> Why this elegance?</div>
            <p>The BCE loss and the sigmoid function are <b>conjugate</b> — they are designed for
              each other. When composed, the exponentials and logarithms cancel, leaving the clean
              form p̂ − y. This is not a coincidence: BCE is the log-likelihood of a Bernoulli
              distribution, and sigmoid is its canonical link function.</p>
          </div>
          <div className="tf-life tf-life--infer">
            <div className="tf-life-h"><span>↓</span> Gradient direction</div>
            <p>If ∂L/∂w &gt; 0, the loss surface slopes upward in the w direction — decrease w.
              If ∂L/∂w &lt; 0, slope is downward — increase w. Gradient descent subtracts the
              gradient, always moving downhill on the loss surface.</p>
          </div>
        </div>

        <Note>These gradients average over all n examples simultaneously (full-batch gradient
          descent). In practice, <b>mini-batch SGD</b> computes gradients on a random subset of
          examples (e.g. 32 at a time), which adds helpful noise that can escape shallow local
          minima in non-convex problems like neural networks.</Note>
      </>
    );
  }

  /* ══════════════════════════════════════════════
     STAGE 7 — Gradient Descent
  ══════════════════════════════════════════════*/
  function StageGradientDescent({ trace }) {
    const [wTrain, setWTrain] = useState(0.5);
    const [bTrain, setBTrain] = useState(-1.5);
    const [epoch, setEpoch] = useState(0);
    const [history, setHistory] = useState([]);
    const eta = 0.3;
    const n = LOG.xs.length;

    function computeAll(w, b) {
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
      const { dw, db, loss, acc } = computeAll(wTrain, bTrain);
      const newW = wTrain - eta * dw;
      const newB = bTrain - eta * db;
      setWTrain(newW);
      setBTrain(newB);
      const newEpoch = epoch + 1;
      setEpoch(newEpoch);
      setHistory(h => [...h.slice(-24), { epoch: newEpoch, loss: loss.toFixed(4), acc: (acc * 100).toFixed(0) + "%", w: fmt(newW), b: fmt(newB) }]);
    }

    function run20() {
      let w = wTrain, b = bTrain, e = epoch;
      const newHistory = [...history];
      for (let step = 0; step < 20; step++) {
        const { dw, db, loss, acc } = computeAll(w, b);
        w = w - eta * dw;
        b = b - eta * db;
        e++;
        newHistory.push({ epoch: e, loss: loss.toFixed(4), acc: (acc * 100).toFixed(0) + "%", w: fmt(w), b: fmt(b) });
      }
      setWTrain(w); setBTrain(b); setEpoch(e);
      setHistory(newHistory.slice(-25));
    }

    function reset() { setWTrain(0.5); setBTrain(-1.5); setEpoch(0); setHistory([]); }

    const { loss: curLoss, acc: curAcc } = computeAll(wTrain, bTrain);
    const boundary = wTrain !== 0 ? -bTrain / wTrain : null;

    /* SVG for loss curve */
    const lossVals = history.map(h => parseFloat(h.loss));
    const maxL = Math.max(...lossVals, 1);
    const LCW = W_SVG, LCH = 140;
    const lcPad = { l: 48, r: 18, t: 14, b: 30 };
    const lcInnerW = LCW - lcPad.l - lcPad.r;
    const lcInnerH = LCH - lcPad.t - lcPad.b;
    const lcsx = (i) => lcPad.l + (i / Math.max(lossVals.length - 1, 1)) * lcInnerW;
    const lcsy = (l) => lcPad.t + (1 - l / maxL) * lcInnerH;
    const lossPts = lossVals.map((l, i) => `${lcsx(i).toFixed(1)},${lcsy(l).toFixed(1)}`).join(" ");

    return (
      <>
        <Lead>
          <b>Gradient descent</b> is the engine that trains the model. We start at some initial
          weights (here: w=0.5, b=−1.5, essentially random guesses) and repeatedly move a small
          step in the direction that reduces the BCE loss. Each full pass over all 7 training
          examples is one <b>epoch</b>. Click "One epoch" to step through the training process
          and watch the sigmoid curve fit the data.
        </Lead>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <button className="tf-headbtn is-on" onClick={stepOnce}>▶ One epoch</button>
          <button className="tf-headbtn is-on" onClick={run20}>⏩ 20 epochs</button>
          <button className="tf-headbtn" onClick={reset}>↺ Reset</button>
          <span className="nn-slider-v" style={{ marginLeft: 6, fontSize: "0.88em" }}>
            epoch <b>{epoch}</b> · loss = <b>{curLoss.toFixed(4)}</b> · acc = <b>{(curAcc * 100).toFixed(0)}%</b>
          </span>
        </div>

        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="reg-chart" style={{ width: "100%", maxWidth: W_SVG }}>
          <Axes yLabel="P(pass)" />
          <line x1={PAD.l} y1={sy(0.5)} x2={PAD.l + innerW} y2={sy(0.5)}
            stroke="var(--faint,#ddd)" strokeWidth="1" strokeDasharray="4 3" />
          <SigmoidCurve w={wTrain} b={bTrain} />
          {boundary !== null && boundary >= 0.5 && boundary <= 6.5 && (
            <>
              <line x1={sx(Math.max(1, Math.min(6, boundary)))} y1={PAD.t}
                x2={sx(Math.max(1, Math.min(6, boundary)))} y2={PAD.t + innerH}
                stroke="#e0851e" strokeWidth="2" strokeDasharray="5 4" />
              <text x={sx(Math.max(1, Math.min(6, boundary))) + 5} y={PAD.t + 15}
                className="reg-axl" fill="#e0851e">x*={fmt(boundary)}</text>
            </>
          )}
          <DataDots highlightX={-1} r={6} />
          {/* show target fitted curve faintly */}
          <SigmoidCurve w={LOG.default.w} b={LOG.default.b} color="rgba(99,102,241,0.2)" sw={1.5} />
        </svg>
        <div style={{ fontSize: "0.78em", opacity: 0.55, marginTop: 4, marginBottom: 12 }}>
          Faint line = target fitted curve (w={LOG.default.w}, b={LOG.default.b})
        </div>

        <div className="nn-calc">
          <div className="nn-calc-h">Current parameters vs. converged target</div>
          <div className="nn-calc-row">
            w = <b>{fmt(wTrain)}</b> (target: {LOG.default.w}) &nbsp;|&nbsp;
            b = <b>{fmt(bTrain)}</b> (target: {LOG.default.b})
          </div>
          <div className="nn-calc-row">
            loss = <b>{fmt(curLoss)}</b> &nbsp;|&nbsp;
            accuracy = <b>{(curAcc * 100).toFixed(0)}%</b> ({Math.round(curAcc * n)}/{n} correct)
          </div>
        </div>

        {lossVals.length > 1 && (
          <>
            <div className="tf-subhead">Loss curve</div>
            <svg viewBox={`0 0 ${LCW} ${LCH}`} className="reg-chart" style={{ width: "100%", maxWidth: LCW }}>
              <line x1={lcPad.l} y1={lcPad.t} x2={lcPad.l} y2={lcPad.t + lcInnerH} stroke="var(--line)" strokeWidth="1.2" />
              <line x1={lcPad.l} y1={lcPad.t + lcInnerH} x2={lcPad.l + lcInnerW} y2={lcPad.t + lcInnerH} stroke="var(--line)" strokeWidth="1.2" />
              <polyline points={lossPts} fill="none" stroke="var(--accent)" strokeWidth="2.3" strokeLinejoin="round" />
              <text x={lcPad.l + lcInnerW / 2} y={LCH - 3} textAnchor="middle" className="reg-axl">epoch</text>
              <text x={11} y={lcPad.t + lcInnerH / 2} textAnchor="middle" className="reg-axl"
                transform={`rotate(-90, 11, ${lcPad.t + lcInnerH / 2})`}>BCE loss</text>
              {lossVals.length > 0 && (
                <circle cx={lcsx(lossVals.length - 1)} cy={lcsy(lossVals[lossVals.length - 1])} r="4" fill="var(--accent)" />
              )}
            </svg>
          </>
        )}

        {history.length > 0 && (
          <>
            <div className="tf-subhead">Training log (last {Math.min(history.length, 25)} epochs)</div>
            <div className="nn-calc">
              <div className="nn-calc-row" style={{ fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
                <span style={{ width: 56, display: "inline-block" }}>epoch</span>
                <span style={{ width: 70, display: "inline-block" }}>loss</span>
                <span style={{ width: 60, display: "inline-block" }}>acc</span>
                <span style={{ width: 56, display: "inline-block" }}>w</span>
                <span>b</span>
              </div>
              {history.slice(-10).map((h, i) => (
                <div className="nn-calc-row" key={i}>
                  <span style={{ width: 56, display: "inline-block" }}>{h.epoch}</span>
                  <span style={{ width: 70, display: "inline-block" }}>{h.loss}</span>
                  <span style={{ width: 60, display: "inline-block" }}>{h.acc}</span>
                  <span style={{ width: 56, display: "inline-block" }}>{h.w}</span>
                  <span>{h.b}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="tf-lifecycle">
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>η</span> Learning rate η = {eta}</div>
            <p>Each step: w ← w − {eta}·∂L/∂w. A large η converges faster but may overshoot the
              minimum (oscillate). A small η is stable but slow. η = 0.3 is aggressive for this
              toy problem; real problems typically use 0.001–0.01.</p>
          </div>
          <div className="tf-life tf-life--infer">
            <div className="tf-life-h"><span>↻</span> Convergence</div>
            <p>The BCE loss for logistic regression is <b>strictly convex</b> — there is exactly
              one global minimum. Gradient descent is guaranteed to find it (given small enough η).
              This dataset typically converges within 20–30 epochs to 100% training accuracy.</p>
          </div>
        </div>

        <Note>The fitted weights w={LOG.default.w}, b={LOG.default.b} give 100% training accuracy
          because the data is linearly separable. In noisy real-world data, the loss never reaches
          zero — the model finds the best linear boundary it can.</Note>
      </>
    );
  }

  /* ══════════════════════════════════════════════
     STAGE 8 — Predictions (inference)
  ══════════════════════════════════════════════*/
  function StagePredictions({ trace, ctx }) {
    const { input, setInput } = ctx;
    const { w, b, probs, preds, accuracy, correct } = trace;

    // confusion matrix with fitted weights
    const wF = LOG.wFit, bF = LOG.bFit;
    const fitProbs = LOG.xs.map(xi => sigmoid(wF * xi + bF));
    const fitPreds = fitProbs.map(p => p >= 0.5 ? 1 : 0);
    let tp = 0, fp = 0, tn = 0, fn = 0;
    LOG.ys.forEach((y, i) => {
      if (y === 1 && fitPreds[i] === 1) tp++;
      else if (y === 0 && fitPreds[i] === 1) fp++;
      else if (y === 0 && fitPreds[i] === 0) tn++;
      else fn++;
    });

    return (
      <>
        <Lead>
          Training is done. We have learned weights w* = {LOG.wFit} and b* = {LOG.bFit}. Now we
          use them to <b>predict on new inputs</b>. This is called <b>inference</b>. The process
          is simple: compute z* = w*·x + b*, then p̂ = σ(z*), then apply the threshold. Move
          the hours slider to see the probability update in real time.
        </Lead>

        <div style={{ marginBottom: 16 }}>
          <label className="nn-slider">
            <span className="nn-slider-l">hours studied (x)</span>
            <input type="range" min="1" max="6" step="0.1" value={input.x}
              onChange={e => setInput({ ...input, x: parseFloat(e.target.value) })} />
            <span className="nn-slider-v">{input.x.toFixed(1)} h</span>
          </label>
        </div>

        <div className="nn-calc">
          <div className="nn-calc-h">Inference for x = {trace.x.toFixed(1)} hours (learned weights: w*={fmt(trace.w)}, b*={fmt(trace.b)})</div>
          <div className="nn-calc-row">z* = {fmt(trace.w)} × {trace.x.toFixed(1)} + ({fmt(trace.b)}) = <b>{fmt(trace.z)}</b></div>
          <div className="nn-calc-row">p̂ = σ({fmt(trace.z)}) = 1 / (1 + e<sup>−{fmt(trace.z)}</sup>) = <b className="nn-calc-res">{(trace.prob * 100).toFixed(2)}%</b></div>
          <div className="nn-calc-row">
            threshold: {fmt(trace.prob)} {trace.prob >= 0.5 ? "≥" : "<"} 0.5 →
            <b style={{ marginLeft: 8, color: trace.pred === 1 ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)", fontSize: "1.05em" }}>
              {trace.pred === 1 ? "✓ PREDICT PASS" : "✗ PREDICT FAIL"}
            </b>
          </div>
        </div>

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

        <div className="tf-subhead">All training predictions with current weights</div>
        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="reg-chart" style={{ width: "100%", maxWidth: W_SVG }}>
          <Axes yLabel="P(pass)" />
          <line x1={PAD.l} y1={sy(0.5)} x2={PAD.l + innerW} y2={sy(0.5)}
            stroke="var(--faint,#ddd)" strokeWidth="1" strokeDasharray="4 3" />
          <SigmoidCurve w={w} b={b} />
          {trace.boundary !== null && (
            <line x1={sx(Math.max(1, Math.min(6, trace.boundary)))} y1={PAD.t}
              x2={sx(Math.max(1, Math.min(6, trace.boundary)))} y2={PAD.t + innerH}
              stroke="#e0851e" strokeWidth="1.8" strokeDasharray="5 4" />
          )}
          <DataDots highlightX={trace.x} r={6} />
          {LOG.xs.map((xi, i) => {
            const ok = preds[i] === LOG.ys[i];
            return (
              <text key={i} x={sx(xi)} y={LOG.ys[i] === 1 ? sy(0.97) - 13 : sy(0.03) + 18}
                textAnchor="middle" className="reg-axl"
                fill={ok ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)"}>
                {ok ? "✓" : "✗"}
              </text>
            );
          })}
        </svg>

        <div className="tf-subhead">Confusion matrix (fitted weights w={LOG.wFit}, b={LOG.bFit})</div>
        <div className="nn-calc">
          <div className="nn-calc-h">How well does the trained model classify all 7 examples?</div>
          <div className="nn-calc-row" style={{ fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
            <span style={{ width: 52, display: "inline-block" }}>x (h)</span>
            <span style={{ width: 36, display: "inline-block" }}>y</span>
            <span style={{ width: 72, display: "inline-block" }}>p̂</span>
            <span style={{ width: 60, display: "inline-block" }}>pred</span>
            <span>result</span>
          </div>
          {LOG.xs.map((xi, i) => {
            const ok = preds[i] === LOG.ys[i];
            return (
              <div className="nn-calc-row" key={i}
                style={{ background: Math.abs(xi - trace.x) < 0.01 ? "rgba(var(--accent-rgb,99,102,241),0.09)" : undefined }}>
                <span style={{ width: 52, display: "inline-block" }}>{xi.toFixed(1)}</span>
                <span style={{ width: 36, display: "inline-block" }}>{LOG.ys[i]}</span>
                <span style={{ width: 72, display: "inline-block" }}>{fmt(probs[i])}</span>
                <span style={{ width: 60, display: "inline-block" }}>{preds[i]}</span>
                <span style={{ color: ok ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)", fontWeight: 700 }}>
                  {ok ? (LOG.ys[i] === 1 ? "TP ✓" : "TN ✓") : (LOG.ys[i] === 1 ? "FN ✗" : "FP ✗")}
                </span>
              </div>
            );
          })}
          <div className="nn-calc-row" style={{ fontWeight: 700, borderTop: "1px solid var(--line)" }}>
            Accuracy: {(accuracy * 100).toFixed(0)}% ({correct}/{LOG.xs.length} correct)
            &nbsp;· TP={tp} FP={fp} TN={tn} FN={fn}
          </div>
        </div>

        <div className="tf-legend">
          {[
            ["True Positive (TP)", "True label = pass, predicted = pass. Model correctly identified a passing student."],
            ["True Negative (TN)", "True label = fail, predicted = fail. Model correctly identified a failing student."],
            ["False Positive (FP)", "True label = fail, predicted = pass. The model wrongly said the student would pass."],
            ["False Negative (FN)", "True label = pass, predicted = fail. The model wrongly said the student would fail — often the more dangerous error in medical contexts."],
          ].map(r => (
            <div className="tf-leg" key={r[0]}>
              <div className="tf-leg-name">{r[0]}</div>
              <div className="tf-leg-desc">{r[1]}</div>
            </div>
          ))}
        </div>

        <Note>Our model achieves 100% accuracy on this dataset because the data is perfectly linearly
          separable. On overlapping, noisy real-world data, you would expect some misclassifications
          even with the best logistic regression model.</Note>
      </>
    );
  }

  /* ══════════════════════════════════════════════
     STAGE 9 — Evaluation
  ══════════════════════════════════════════════*/
  function StageEvaluation({ trace }) {
    const { probs, preds, accuracy, correct } = trace;
    const n = LOG.xs.length;
    let tp = 0, fp = 0, tn = 0, fn = 0;
    LOG.ys.forEach((y, i) => {
      if (y === 1 && preds[i] === 1) tp++;
      else if (y === 0 && preds[i] === 1) fp++;
      else if (y === 0 && preds[i] === 0) tn++;
      else fn++;
    });
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;

    /* ROC curve: vary threshold from 1 to 0 */
    const rocPts = [];
    for (let th = 1.0; th >= 0; th -= 0.02) {
      const p_ = probs.map(p => p >= th ? 1 : 0);
      let rTP = 0, rFP = 0, rTN = 0, rFN = 0;
      LOG.ys.forEach((y, i) => {
        if (y === 1 && p_[i] === 1) rTP++;
        else if (y === 0 && p_[i] === 1) rFP++;
        else if (y === 0 && p_[i] === 0) rTN++;
        else rFN++;
      });
      const tpr = rTP + rFN > 0 ? rTP / (rTP + rFN) : 0;
      const fpr = rFP + rTN > 0 ? rFP / (rFP + rTN) : 0;
      rocPts.push({ fpr, tpr });
    }

    const RW = W_SVG, RH = H_SVG;
    const rocPad = { l: 48, r: 22, t: 20, b: 36 };
    const rocInnerW = RW - rocPad.l - rocPad.r;
    const rocInnerH = RH - rocPad.t - rocPad.b;
    const rocX = fpr => rocPad.l + fpr * rocInnerW;
    const rocY = tpr => rocPad.t + (1 - tpr) * rocInnerH;
    const rocPath = rocPts.map((p, i) => `${i === 0 ? "M" : "L"}${rocX(p.fpr).toFixed(1)},${rocY(p.tpr).toFixed(1)}`).join(" ");

    return (
      <>
        <Lead>
          <b>Accuracy</b> alone can be misleading. Imagine a cancer screening dataset where 99% of
          people are healthy. A model that always predicts "healthy" achieves 99% accuracy — but it
          is completely useless. We need metrics that reveal <b>how the model fails</b>, not just
          how often it is right.
        </Lead>
        <Lead>
          The four fundamental quantities — TP, FP, TN, FN — from the confusion matrix give rise to
          a rich family of metrics. Each answers a different question about model quality, and the
          right metric depends on what mistakes are most costly in your application.
        </Lead>

        <div className="nn-calc">
          <div className="nn-calc-h">Evaluation metrics (current weights)</div>
          <div className="nn-calc-row">Confusion: TP={tp} · FP={fp} · TN={tn} · FN={fn}</div>
          <div className="nn-calc-row">
            Accuracy = (TP+TN) / n = ({tp}+{tn}) / {n} = <b>{(accuracy * 100).toFixed(1)}%</b>
          </div>
          <div className="nn-calc-row">
            Precision = TP / (TP+FP) = {tp} / {tp + fp} = <b>{(precision * 100).toFixed(1)}%</b>
            &nbsp;<span style={{ opacity: 0.6 }}>— of predicted passes, how many actually passed?</span>
          </div>
          <div className="nn-calc-row">
            Recall = TP / (TP+FN) = {tp} / {tp + fn} = <b>{(recall * 100).toFixed(1)}%</b>
            &nbsp;<span style={{ opacity: 0.6 }}>— of actual passes, how many did we catch?</span>
          </div>
          <div className="nn-calc-row">
            F1 = 2·Precision·Recall / (P+R) = <b>{(f1 * 100).toFixed(1)}%</b>
            &nbsp;<span style={{ opacity: 0.6 }}>— harmonic mean of precision and recall</span>
          </div>
        </div>

        <div className="tf-subhead">ROC curve — visualising the precision/recall tradeoff</div>
        <svg viewBox={`0 0 ${RW} ${RH}`} className="reg-chart" style={{ width: "100%", maxWidth: RW }}>
          <line x1={rocPad.l} y1={rocPad.t} x2={rocPad.l} y2={rocPad.t + rocInnerH} stroke="var(--line)" strokeWidth="1.3" />
          <line x1={rocPad.l} y1={rocPad.t + rocInnerH} x2={rocPad.l + rocInnerW} y2={rocPad.t + rocInnerH} stroke="var(--line)" strokeWidth="1.3" />
          {[0, 0.25, 0.5, 0.75, 1.0].map(v => (
            <g key={v}>
              <line x1={rocPad.l - 4} y1={rocY(v)} x2={rocPad.l} y2={rocY(v)} stroke="var(--line)" />
              <text x={rocPad.l - 7} y={rocY(v) + 4} textAnchor="end" className="reg-axl">{v.toFixed(1)}</text>
              <line x1={rocX(v)} y1={rocPad.t + rocInnerH} x2={rocX(v)} y2={rocPad.t + rocInnerH + 4} stroke="var(--line)" />
              <text x={rocX(v)} y={rocPad.t + rocInnerH + 14} textAnchor="middle" className="reg-axl">{v.toFixed(1)}</text>
              {v > 0 && v < 1 && (
                <line x1={rocPad.l} y1={rocY(v)} x2={rocPad.l + rocInnerW} y2={rocY(v)}
                  stroke="var(--faint,#eee)" strokeWidth="0.6" strokeDasharray="4 4" />
              )}
            </g>
          ))}
          {/* random classifier diagonal */}
          <line x1={rocX(0)} y1={rocY(0)} x2={rocX(1)} y2={rocY(1)}
            stroke="var(--faint,#ccc)" strokeWidth="1.3" strokeDasharray="5 4" />
          <text x={rocX(0.55)} y={rocY(0.45)} className="reg-axl" fill="var(--faint,#aaa)">random</text>
          {/* ROC curve */}
          <path d={rocPath} fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinejoin="round" />
          {/* AUC label */}
          <text x={rocX(0.15)} y={rocY(0.85)} className="reg-axl" fill="var(--accent)" fontWeight="600">AUC ≈ 1.0</text>
          <text x={rocPad.l + rocInnerW / 2} y={RH - 3} textAnchor="middle" className="reg-axl">False Positive Rate (FPR)</text>
          <text x={11} y={rocPad.t + rocInnerH / 2} textAnchor="middle" className="reg-axl"
            transform={`rotate(-90, 11, ${rocPad.t + rocInnerH / 2})`}>True Positive Rate (Recall)</text>
        </svg>

        <Lead>
          The ROC curve plots the True Positive Rate (recall) against the False Positive Rate as
          the classification threshold varies from 1 (predict nothing positive) to 0 (predict
          everything positive). A perfect classifier hugs the top-left corner — high recall,
          near-zero false alarms. The Area Under the Curve (AUC) summarises this: 1.0 is perfect,
          0.5 is random guessing.
        </Lead>

        <div className="tf-legend">
          {[
            ["Accuracy", "Best when classes are balanced. Misleading for imbalanced datasets — a model predicting the majority class always looks good."],
            ["Precision", "Of all predicted positives, what fraction are real? High precision = few false alarms. Use when false positives are costly (e.g. spam filter)."],
            ["Recall (Sensitivity)", "Of all real positives, what fraction did we catch? High recall = few missed cases. Use when false negatives are costly (e.g. cancer screening)."],
            ["F1 Score", "Harmonic mean of precision and recall. Balanced metric; better than accuracy for imbalanced data."],
            ["AUC-ROC", "Threshold-independent summary of model discrimination. 1.0 = perfect, 0.5 = random. Use to compare models without committing to a threshold."],
          ].map(r => (
            <div className="tf-leg" key={r[0]}>
              <div className="tf-leg-name">{r[0]}</div>
              <div className="tf-leg-desc">{r[1]}</div>
            </div>
          ))}
        </div>

        <Note>The choice of threshold (default 0.5) directly affects precision and recall. In
          clinical diagnosis, lowering the threshold to 0.2 catches more true positives (higher
          recall) at the cost of more false alarms (lower precision). This is a domain decision,
          not a model decision — always consider the cost of each error type in your application.</Note>
      </>
    );
  }

  /* ══════════════════════════════════════════════
     STAGE 10 — Assumptions & When to Use
  ══════════════════════════════════════════════*/
  function StageAssumptions() {
    return (
      <>
        <Lead>
          Logistic regression is one of the most powerful <b>baseline models</b> in all of machine
          learning. It trains in milliseconds, produces calibrated probabilities, and its coefficients
          are directly interpretable as changes in log-odds. But it has core assumptions that must
          hold — or at least approximately hold — for it to work well.
        </Lead>
        <Lead>
          The most important assumption is that the <b>decision boundary is linear</b> in the input
          features. If the true boundary is a circle, a spiral, or any non-linear shape, logistic
          regression will struggle. The fix is either to engineer non-linear features (x², x·x₂, etc.)
          before fitting, or to use a model that learns non-linear boundaries (decision trees,
          random forests, neural networks).
        </Lead>

        <div className="tf-subhead">Core assumptions</div>
        <div className="tf-legend">
          {[
            ["Linear decision boundary", "The log-odds are linear in the features: log(p/(1−p)) = w·x + b. The decision boundary is a hyperplane. Non-linear boundaries require feature engineering or a different model."],
            ["Binary (or categorical) output", "Each example belongs to exactly one class. For continuous outputs use linear regression. For multi-class use softmax logistic regression."],
            ["No severe multicollinearity", "Highly correlated features inflate coefficient variance and make individual weights hard to interpret — though predictions remain numerically stable. Use L2 regularisation to mitigate."],
            ["Sufficient sample size", "Needs roughly 10–20 examples per feature for reliable estimation. With many features and few examples, use L1/L2 regularisation aggressively."],
            ["Limited outlier impact", "More robust than linear regression (sigmoid saturates), but extreme feature outliers can still shift the boundary. Scale or clip extreme values."],
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
              <li><b>Interpretable weights:</b> each coefficient is the change in log-odds per unit of that feature. Easy to explain to non-technical stakeholders.</li>
              <li><b>Calibrated probabilities:</b> the output is a genuine probability, not just a ranking score. Useful for risk-scoring applications.</li>
              <li><b>Convex loss:</b> BCE + logistic is strictly convex — one global minimum, reliable convergence, no hyperparameter tuning of depth/architecture.</li>
              <li><b>Fast to train:</b> even on millions of examples, logistic regression trains quickly with SGD or L-BFGS.</li>
              <li><b>Regularisation is straightforward:</b> L1 (Lasso) does automatic feature selection; L2 (Ridge) reduces variance.</li>
              <li><b>Strong baseline:</b> always run logistic regression first. If it achieves &gt;90% accuracy, you may not need anything more complex.</li>
            </ul>
          </div>
          <div className="opt-pc-col is-con">
            <div className="opt-pc-h">Weaknesses</div>
            <ul>
              <li><b>Linear boundary only:</b> cannot learn curved, spiral, or hierarchical decision boundaries without manual feature engineering.</li>
              <li><b>Feature engineering required</b> for non-linear problems — polynomial and interaction terms must be added explicitly.</li>
              <li><b>Sensitive to irrelevant features:</b> adds noise to the gradient signal. Use L1 regularisation for automatic feature selection.</li>
              <li><b>Not suited for high-dimensional unstructured data:</b> images, audio, and raw text require deep neural networks that learn features automatically.</li>
              <li><b>Multicollinearity inflates variance</b> of individual coefficients (though predictions remain stable).</li>
            </ul>
          </div>
        </div>

        <div className="tf-subhead">When to prefer logistic regression vs. alternatives</div>
        <div className="tf-legend">
          {[
            ["Use logistic regression when:", "The boundary is roughly linear, you need calibrated probabilities, interpretability is required (medical, legal, financial), or the dataset is small (<10,000 examples)."],
            ["Use SVM when:", "You want a maximum-margin boundary and don't need probability outputs. With kernels, SVMs can learn non-linear boundaries efficiently."],
            ["Use Random Forest / XGBoost when:", "Non-linear interactions between features matter, you have mixed data types, and you need more predictive power without manual feature engineering."],
            ["Use a neural network when:", "The input is high-dimensional and unstructured (images, text, audio), the dataset is very large, or the relationship between inputs and outputs is deeply hierarchical."],
            ["Use Naive Bayes when:", "The dataset is tiny, training speed is paramount, or the strong feature independence assumption holds (e.g. text classification with bag-of-words)."],
          ].map(r => (
            <div className="tf-leg" key={r[0]}>
              <div className="tf-leg-name">{r[0]}</div>
              <div className="tf-leg-desc">{r[1]}</div>
            </div>
          ))}
        </div>

        <div className="tf-subhead">Impact of missing values and outliers</div>
        <div className="tf-lifecycle">
          <div className="tf-life tf-life--train">
            <div className="tf-life-h"><span>?</span> Missing values</div>
            <p>Logistic regression cannot handle missing values natively — you must impute them
              first (mean/median imputation, or model-based imputation). Missing completely at
              random (MCAR) is fine; missing not at random (MNAR) can introduce bias.</p>
          </div>
          <div className="tf-life tf-life--infer">
            <div className="tf-life-h"><span>!</span> Outliers</div>
            <p>Because sigmoid saturates, extreme z values contribute tiny gradients — this acts
              as a form of soft outlier robustness. However, extreme <b>feature</b> values still
              cause large z values and can dominate the gradient signal. Always check distributions
              and standardise features (mean 0, std 1) before training.</p>
          </div>
        </div>

        <Note>Rule of thumb: <b>always start with logistic regression</b>. It gives you a
          calibrated baseline, reveals which features carry signal (non-zero weights), and
          its accuracy on held-out data tells you whether the problem is even linearly separable.
          Only reach for a more complex model if logistic regression clearly underfits.</Note>
      </>
    );
  }

  /* ── renderInput (top-bar sliders) ── */
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
        <span className="nn-slider-v" style={{ marginLeft: 8, fontSize: "0.84em", opacity: 0.7 }}>
          P(pass) =&nbsp;
          <b style={{ color: trace && trace.pred === 1 ? "rgba(31,158,107,1)" : "rgba(224,73,46,1)" }}>
            {trace ? (trace.prob * 100).toFixed(1) : "–"}%
          </b>
        </span>
      </>
    );
  }

  /* ── stage definitions ── */
  const STAGES = [
    {
      id: "overview",
      group: "Overview",
      title: "Why not linear regression for classification?",
      map: "Overview",
      why: "The core intuition: what goes wrong when we naively use linear regression for a yes/no problem, and why the sigmoid function solves it perfectly.",
      render: (t) => <StageOverview trace={t} />,
    },
    {
      id: "dataset",
      group: "Overview",
      title: "The dataset: hours studied → pass / fail",
      map: "Dataset",
      why: "Every supervised model needs labelled examples. Understanding the data — its features, labels, and class distribution — before training is essential.",
      render: (t) => <StageDataset trace={t} />,
    },
    {
      id: "sigmoid",
      group: "Forward pass",
      title: "1 · The sigmoid function",
      map: "Sigmoid σ(z)",
      why: "Sigmoid is the heart of logistic regression — it maps any real number to a valid probability. Its S-shape, properties, and derivative are all crucial.",
      render: (t) => <StageSigmoid trace={t} />,
    },
    {
      id: "boundary",
      group: "Forward pass",
      title: "2 · Decision boundary",
      map: "Decision boundary",
      why: "The boundary x* = −b/w divides feature space into two class regions. Understanding it reveals logistic regression's core assumption and limitation.",
      render: (t) => <StageDecisionBoundary trace={t} />,
    },
    {
      id: "loss",
      group: "Training",
      title: "3 · Binary Cross-Entropy loss",
      map: "BCE Loss",
      why: "BCE loss is the statistically correct objective for probability outputs — convex, interpretable, and it punishes confident wrong predictions far more than MSE would.",
      render: (t) => <StageBCELoss trace={t} />,
    },
    {
      id: "gradients",
      group: "Training",
      title: "4 · Gradients",
      map: "Gradients",
      why: "Gradient computation reveals how much each parameter contributed to the error — and elegantly simplifies to mean[(p̂−y)·x], the same form as linear regression.",
      render: (t) => <StageGradients trace={t} />,
    },
    {
      id: "training",
      group: "Training",
      title: "5 · Gradient descent & convergence",
      map: "Training",
      why: "Watch the model learn from scratch. Step through epochs to see the sigmoid curve fit the data and the loss converge to its minimum.",
      render: (t) => <StageGradientDescent trace={t} />,
    },
    {
      id: "predictions",
      group: "Inference",
      title: "6 · Predictions with learned weights",
      map: "Predictions",
      why: "With trained w* and b* in hand, inference is a single forward pass: compute σ(w*x+b*) and apply the threshold. The confusion matrix reveals exactly where the model succeeds and fails.",
      render: (t, ctx) => <StagePredictions trace={t} ctx={ctx} />,
    },
    {
      id: "evaluation",
      group: "Inference",
      title: "7 · Evaluation: accuracy, precision, recall, F1, AUC",
      map: "Evaluation",
      why: "Accuracy alone misleads on imbalanced data. Precision, recall, F1, and the ROC curve each answer a different question about model quality and error tradeoffs.",
      render: (t) => <StageEvaluation trace={t} />,
    },
    {
      id: "assumptions",
      group: "Context",
      title: "8 · Assumptions & when to use logistic regression",
      map: "When to use",
      why: "Every model has a regime where it excels and one where it fails. Knowing the assumptions of logistic regression makes you a more effective practitioner.",
      render: () => <StageAssumptions />,
    },
    {
      id: "hyperparams",
      group: "Practical",
      title: "Hyperparameters & when to use Logistic Regression",
      map: "Hyperparams",
      why: "Logistic regression is the first model to try for classification. It's fast, gives calibrated probabilities, and its hyperparameters teach you about regularization trade-offs applicable to every model.",
      render: () => (
        <>
          <Lead>Logistic regression's most important hyperparameter is C — the inverse regularization strength. Small C = strong regularization = simple model. Large C = weak regularization = complex model that fits training data closely. C = 1/lambda from the loss formulation.</Lead>
          <Note>C is the inverse of regularization strength. If Ridge Regression uses alpha, Logistic uses C = 1/alpha. This trips up many practitioners: <b>smaller C = more regularization</b> (opposite of alpha).</Note>
          <div className="tf-subhead">Key hyperparameters</div>
          <div className="tf-legend">
            {[
              ["C", "Inverse regularization strength", "Default 1.0. Smaller = stronger regularization. Try C in [0.001, 0.01, 0.1, 1, 10, 100] via cross-validation. If training accuracy >> validation accuracy → decrease C (more regularization)."],
              ["penalty", "Regularization type", "'l2' (default, Ridge) shrinks coefficients. 'l1' (Lasso) produces sparse models (feature selection). 'elasticnet' = mix of both. 'none' = no regularization (risky on noisy data)."],
              ["solver", "Optimization algorithm", "'lbfgs' (default, good for multiclass). 'saga' for L1 or large datasets. 'liblinear' for small binary classification. Rarely matters on well-scaled data."],
              ["max_iter", "Max gradient steps", "Default 100. If you get ConvergenceWarning, increase to 500 or 1000. Scale your features first — convergence is much faster."],
              ["class_weight", "Handle class imbalance", "'balanced' auto-weights samples by class frequency. Essential when one class is rare (fraud detection, medical diagnosis)."],
              ["multi_class", "Multi-class strategy", "'auto' (default). 'ovr' = one-vs-rest (N binary classifiers). 'multinomial' = joint softmax. Softmax is usually better for many classes."],
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
              {["Fast training — scales to large datasets with saga solver", "Calibrated probability outputs by default (unlike SVM)", "Interpretable coefficients — log-odds per feature", "Works well on small datasets with proper regularization", "Natural multi-class extension via softmax (multinomial)", "Less prone to overfitting than trees on small data"].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
              {["Assumes a linear decision boundary in feature space", "Can't model XOR-type or complex non-linear separations", "Needs scaled features for gradient-based solvers to converge well", "Collinear features make coefficients unstable (use Ridge/L2)", "No built-in non-linearity — requires feature engineering"].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✗ {t}</div>)}
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
                  ["Need probability estimates (not just class labels)", "Logistic Regression", "Probabilities are well-calibrated by default"],
                  ["Linear decision boundary is sufficient", "Logistic Regression", "Fastest and most interpretable when linearity holds"],
                  ["High-dimensional sparse data (text/NLP)", "Logistic Regression + L1", "L1 does implicit feature selection; scales to millions of features"],
                  ["Complex non-linear boundary", "Random Forest / SVM (RBF kernel)", "Tree ensembles or kernel methods capture non-linearity"],
                  ["Small dataset, clear margin", "SVM", "SVM maximizes margin — more robust with few samples"],
                  ["Maximize AUC on imbalanced data", "Logistic + class_weight='balanced'", "Simple and effective baseline for imbalanced classification"],
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
    modeLinks: [
      { label: "Regression", href: "Linear Regression.html", active: false },
      { label: "Classification", href: "Logistic Regression.html", active: true },
    ],
  };
})();
