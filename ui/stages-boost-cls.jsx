/* ============================================================
   Gradient Boosting — Classification stages (10 stages)
   Requires: window.ML_BOOST (from model/ml-boosting.js)
             window.{ Matrix, V, Sub, Sup, Formula, Lead, Note,
                      Row, Arrow, Tag, fmt } (from matrix.jsx)
   ============================================================ */
(function () {
  const { V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState, useRef, useEffect } = React;
  const { BOOST_CLS, runBoostCls, sigmoid } = window.ML_BOOST;

  // ── color scheme ──
  const HAM_COL = "#1f9e6b";
  const SPAM_COL = "#e0492e";
  const HAM_BG = "rgba(31,158,107,.12)";
  const SPAM_BG = "rgba(224,73,46,.12)";
  const clsColor = label => label === 1 ? SPAM_COL : HAM_COL;
  const clsBg = label => label === 1 ? SPAM_BG : HAM_BG;
  const clsName = label => label === 1 ? "spam" : "ham";

  // ── SVG scatter for 2D classification ──
  const SW = 340, SH = 220;
  const SPAD = { l: 48, r: 16, t: 16, b: 38 };
  const ssx = v => SPAD.l + v * (SW - SPAD.l - SPAD.r);
  const ssy = v => SH - SPAD.b - v * (SH - SPAD.t - SPAD.b);

  function ClsScatter({ probs, title }) {
    const data = BOOST_CLS.data;
    return (
      <div>
        {title && <div className="tf-subhead">{title}</div>}
        <svg viewBox={`0 0 ${SW} ${SH}`} style={{ width: "100%", maxWidth: SW }}>
          {/* grid */}
          {[0, 0.25, 0.5, 0.75, 1.0].map(v => (
            <line key={v} x1={SPAD.l} y1={ssy(v)} x2={SW - SPAD.r} y2={ssy(v)}
              stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />
          ))}
          {/* axes */}
          <line x1={SPAD.l} y1={SH - SPAD.b} x2={SW - SPAD.r} y2={SH - SPAD.b} stroke="var(--ink)" strokeWidth="1.2" />
          <line x1={SPAD.l} y1={SPAD.t} x2={SPAD.l} y2={SH - SPAD.b} stroke="var(--ink)" strokeWidth="1.2" />
          {/* x ticks */}
          {[0, 0.25, 0.5, 0.75, 1.0].map(v => (
            <g key={v}>
              <line x1={ssx(v)} y1={SH - SPAD.b} x2={ssx(v)} y2={SH - SPAD.b + 4} stroke="var(--ink)" strokeWidth="1" />
              <text x={ssx(v)} y={SH - SPAD.b + 14} textAnchor="middle" fontSize="9" fill="var(--muted)">{v.toFixed(2)}</text>
            </g>
          ))}
          {/* y label: has_link */}
          <text x={SPAD.l - 6} y={ssy(0) + 4} textAnchor="end" fontSize="9" fill="var(--muted)">0</text>
          <text x={SPAD.l - 6} y={ssy(1) + 4} textAnchor="end" fontSize="9" fill="var(--muted)">1</text>
          {/* axis labels */}
          <text x={(SPAD.l + SW - SPAD.r) / 2} y={SH - 2} textAnchor="middle" fontSize="10" fill="var(--muted)">word_count</text>
          <text x={12} y={(SPAD.t + SH - SPAD.b) / 2} textAnchor="middle" fontSize="10" fill="var(--muted)"
            transform={`rotate(-90,12,${(SPAD.t + SH - SPAD.b) / 2})`}>has_link</text>
          {/* data points */}
          {data.map((d, i) => {
            const p = probs ? probs[i] : 0.5;
            const label = d[2];
            const predicted = p >= 0.5 ? 1 : 0;
            const correct = predicted === label;
            return (
              <g key={i}>
                <circle
                  cx={ssx(d[0])} cy={ssy(d[1])}
                  r={7}
                  fill={clsColor(label)} opacity="0.85"
                  stroke={correct ? "white" : "#333"}
                  strokeWidth={correct ? 1.5 : 2.5}
                />
                <text x={ssx(d[0]) + 9} y={ssy(d[1]) - 4} fontSize="9" fill="var(--muted)">{fmt(p, 2)}</text>
              </g>
            );
          })}
        </svg>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: HAM_COL, display: "inline-block" }} />
            ham (0)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: SPAM_COL, display: "inline-block" }} />
            spam (1)
          </span>
          {probs && <span>numbers = P(spam)</span>}
        </div>
      </div>
    );
  }

  // ── Log-loss bar ──
  function LossBar({ rounds }) {
    const maxLoss = rounds[0].loss;
    return (
      <div style={{ margin: "10px 0" }}>
        {rounds.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)", width: 72, flexShrink: 0 }}>
              {i === 0 ? "Init (F₀)" : `After T${i}`}
            </span>
            <div style={{ flex: 1, background: "var(--line-soft)", borderRadius: 4, height: 14, overflow: "hidden", maxWidth: 260 }}>
              <div style={{
                height: "100%", borderRadius: 4,
                width: `${(r.loss / maxLoss) * 100}%`,
                background: i === 0 ? "#e0492e" : `hsl(${140 + i * 30}, 60%, 42%)`,
                transition: "width 0.4s ease"
              }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: "var(--num-font)", color: "var(--ink)", width: 52, flexShrink: 0 }}>
              {r.loss.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── classification stump SVG ──
  function ClsStumpSvg({ stump, featureNames }) {
    const W2 = 260, H2 = 140;
    const midX = W2 / 2;
    const rootY = 32, childY = 100;
    const leftX = 60, rightX = W2 - 60;
    const feat = featureNames[stump.feature];
    return (
      <svg width={W2} height={H2} style={{ overflow: "visible" }}>
        <line x1={midX} y1={rootY + 16} x2={leftX} y2={childY - 16} stroke="var(--line)" strokeWidth="1.5" />
        <line x1={midX} y1={rootY + 16} x2={rightX} y2={childY - 16} stroke="var(--line)" strokeWidth="1.5" />
        <text x={(midX + leftX) / 2 - 10} y={(rootY + childY) / 2 + 2} fontSize="9" fill="var(--muted)" fontStyle="italic">yes</text>
        <text x={(midX + rightX) / 2 + 8} y={(rootY + childY) / 2 + 2} fontSize="9" fill="var(--muted)" fontStyle="italic">no</text>
        {/* root */}
        <rect x={midX - 72} y={rootY - 16} width={144} height={32} rx="8"
          fill="var(--panel-solid)" stroke="var(--accent)" strokeWidth="2" />
        <text x={midX} y={rootY + 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">
          {feat} ≤ {stump.threshold}?
        </text>
        {/* left leaf */}
        <rect x={leftX - 38} y={childY - 16} width={76} height={32} rx="8"
          fill={stump.leftVal >= 0 ? "rgba(224,73,46,.12)" : "rgba(31,158,107,.12)"}
          stroke={stump.leftVal >= 0 ? SPAM_COL : HAM_COL} strokeWidth="1.5" />
        <text x={leftX} y={childY - 1} textAnchor="middle" fontSize="11" fontWeight="700"
          fill={stump.leftVal >= 0 ? SPAM_COL : HAM_COL}>
          {fmt(stump.leftVal, 3)}
        </text>
        <text x={leftX} y={childY + 13} textAnchor="middle" fontSize="9" fill="var(--muted)">
          {stump.leftVal >= 0 ? "→ spam" : "→ ham"}
        </text>
        {/* right leaf */}
        <rect x={rightX - 38} y={childY - 16} width={76} height={32} rx="8"
          fill={stump.rightVal >= 0 ? "rgba(224,73,46,.12)" : "rgba(31,158,107,.12)"}
          stroke={stump.rightVal >= 0 ? SPAM_COL : HAM_COL} strokeWidth="1.5" />
        <text x={rightX} y={childY - 1} textAnchor="middle" fontSize="11" fontWeight="700"
          fill={stump.rightVal >= 0 ? SPAM_COL : HAM_COL}>
          {fmt(stump.rightVal, 3)}
        </text>
        <text x={rightX} y={childY + 13} textAnchor="middle" fontSize="9" fill="var(--muted)">
          {stump.rightVal >= 0 ? "→ spam" : "→ ham"}
        </text>
      </svg>
    );
  }

  // ── prob bar display ──
  function ProbBars({ ham, spam }) {
    return (
      <div className="tf-probs" style={{ marginTop: 10 }}>
        {[["ham", ham, HAM_COL], ["spam", spam, SPAM_COL]].map(([name, p, col]) => (
          <div key={name} className="tf-prob">
            <span style={{ fontSize: 12, color: "var(--ink)", width: 36 }}>{name}</span>
            <div style={{ flex: 1, background: "var(--line-soft)", borderRadius: 4, height: 18, overflow: "hidden" }}>
              <div className="tf-prob-fill" style={{ width: `${p * 100}%`, background: col }} />
            </div>
            <span className="tf-prob-val">{(p * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGES
  // ────────────────────────────────────────────────────────
  window.ML_STAGES = [

    // ── Stage 1: Overview ──
    {
      id: "overview", group: "Overview", title: "Gradient Boosting for classification",
      map: "Overview",
      why: "Classification boosting uses the same sequential tree-building as regression, but with log-loss instead of MSE. Understanding this connection is crucial.",
      render: (trace) => (
        <>
          <Lead>
            Gradient Boosting for <b>classification</b> works exactly like regression boosting,
            but uses <b>log-loss</b> as the loss function. Instead of predicting prices, we predict
            <b> log-odds</b> and convert to probabilities via the sigmoid function.
          </Lead>

          <div style={{ margin: "18px 0 10px" }}>
            <div className="tf-subhead">Boosting pipeline for classification</div>
            <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", margin: "12px 0" }}>
              {[
                { label: "log-odds₀", sub: "log(p/(1-p))", color: "#94A2BC" },
                null,
                { label: "Pseudo-resid.", sub: "y − P(y=1)", color: "#f59e0b" },
                null,
                { label: "Tree 1", sub: "fit residuals", color: "#2B5BFF" },
                null,
                { label: "Update", sub: "lo += η·T₁", color: "#7c5cff" },
                null,
                { label: "σ(log-odds)", sub: "= probability", color: SPAM_COL },
                null,
                { label: "⋯ more trees", sub: "", color: "var(--muted)" },
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
            <div style={{ background: "var(--accent-soft)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>Same as Regression</div>
              <ul style={{ fontSize: 13, margin: 0, padding: "0 0 0 16px", lineHeight: 1.7 }}>
                <li>Sequential tree building</li>
                <li>Fit pseudo-residuals (gradients)</li>
                <li>Shrink with learning rate η</li>
                <li>Final = sum of all trees</li>
              </ul>
            </div>
            <div style={{ background: "rgba(224,73,46,.08)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: SPAM_COL, marginBottom: 6 }}>Different from Regression</div>
              <ul style={{ fontSize: 13, margin: 0, padding: "0 0 0 16px", lineHeight: 1.7 }}>
                <li>Loss = log-loss (not MSE)</li>
                <li>Output = log-odds (not price)</li>
                <li>σ(log-odds) → probability</li>
                <li>Threshold 0.5 → class label</li>
              </ul>
            </div>
          </div>
          <Note>
            The "gradient" in gradient boosting refers to fitting the <b>gradient of the loss</b>.
            For MSE: gradient = residual. For log-loss: gradient = y − P(y=1) = pseudo-residual.
            Same algorithm, different loss function!
          </Note>
        </>
      ),
    },

    // ── Stage 2: Dataset ──
    {
      id: "dataset", group: "Data", title: "Dataset — email spam detection",
      map: "Dataset",
      why: "8 emails with 2 features: normalized word count and whether the email has a link. Ham = legitimate, Spam = junk.",
      render: (trace) => (
        <>
          <Lead>
            We have 8 emails described by <b>word_count</b> (normalized 0–1) and
            <b> has_link</b> (0 or 1). Labels: <span style={{ color: HAM_COL, fontWeight: 700 }}>ham=0</span> (legitimate),
            <span style={{ color: SPAM_COL, fontWeight: 700 }}> spam=1</span> (junk).
          </Lead>
          <Row>
            <div>
              <div className="tf-subhead">Training data</div>
              <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth: 280 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    {["#", "word_count", "has_link", "label"].map(h => (
                      <th key={h} style={{ padding: "5px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BOOST_CLS.data.map((d, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "4px 10px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{i + 1}</td>
                      <td style={{ padding: "4px 10px", fontFamily: "var(--num-font)" }}>{d[0].toFixed(1)}</td>
                      <td style={{ padding: "4px 10px", fontFamily: "var(--num-font)" }}>{d[1]}</td>
                      <td style={{ padding: "4px 10px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                          color: clsColor(d[2]), background: clsBg(d[2])
                        }}>
                          {clsName(d[2])}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ClsScatter probs={null} title="2D scatter plot" />
          </Row>
          <Note>
            The data is <b>linearly separable</b> at a high level: high word count or has_link → spam.
            But there's overlap (email 4: has_link but is ham). Gradient boosting will handle this gracefully.
          </Note>
        </>
      ),
    },

    // ── Stage 3: Log-Loss ──
    {
      id: "logloss", group: "Math", title: "Log-loss — the right loss for probabilities",
      map: "Log-Loss",
      why: "Unlike MSE, log-loss properly penalizes confident wrong predictions. Using MSE for probabilities creates a flat gradient near 0 and 1, slowing learning.",
      render: (trace) => {
        // draw log-loss curve
        const lx = p => 44 + p * 280;
        const ly = (l) => 10 + Math.min(170, (l / 5) * 160);
        const pts0 = [], pts1 = [];
        const eps = 1e-6;
        for (let i = 1; i <= 99; i++) {
          const p = i / 100;
          pts0.push(`${lx(p)},${ly(-Math.log(1 - p))}`);  // y=0 curve
          pts1.push(`${lx(p)},${ly(-Math.log(p))}`);       // y=1 curve
        }
        return (
          <>
            <Lead>
              For binary classification we use <b>log-loss</b> (cross-entropy).
              The gradient of log-loss with respect to log-odds is simply <b>y − p</b> — the
              pseudo-residual. This is why it looks so similar to regression!
            </Lead>
            <Formula label="Log-Loss L">
              L = −[y · log(p) + (1−y) · log(1−p)]
            </Formula>
            <Formula label="Pseudo-residual (gradient)">
              r = −∂L/∂F = y − p = y − σ(F(x))
            </Formula>
            <div className="tf-subhead" style={{ marginTop: 8 }}>Log-loss curves</div>
            <svg viewBox="0 0 340 200" style={{ width: "100%", maxWidth: 340 }}>
              <polyline points={pts1.join(" ")} fill="none" stroke={SPAM_COL} strokeWidth="2.2" />
              <polyline points={pts0.join(" ")} fill="none" stroke={HAM_COL} strokeWidth="2.2" />
              <line x1={44} y1={10} x2={44} y2={185} stroke="var(--line)" strokeWidth="1" />
              <line x1={44} y1={185} x2={324} y2={185} stroke="var(--line)" strokeWidth="1" />
              {[0, 0.25, 0.5, 0.75, 1.0].map(v => (
                <g key={v}>
                  <text x={lx(v)} y={199} textAnchor="middle" fontSize="9" fill="var(--muted)">{v.toFixed(2)}</text>
                  <line x1={lx(v)} y1={185} x2={lx(v)} y2={188} stroke="var(--line)" strokeWidth="1" />
                </g>
              ))}
              <text x={184} y={200} textAnchor="middle" fontSize="9" fill="var(--muted)">predicted probability p</text>
              <text x={334} y={55} fontSize="9" fill={SPAM_COL}>y=1</text>
              <text x={334} y={140} fontSize="9" fill={HAM_COL}>y=0</text>
            </svg>
            <div className="tf-legend" style={{ marginTop: 10 }}>
              {[
                ["y=1 (spam), high p", "Low loss — model correctly confident it's spam"],
                ["y=1 (spam), low p", "High loss — model wrongly confident it's ham. Loss → ∞ as p → 0"],
                ["y=0 (ham), low p", "Low loss — correctly confident it's ham"],
                ["Gradient = y−p", "When y=1 and p=0.3: gradient = 0.7 (push probability UP). When y=0 and p=0.6: gradient = -0.6 (push DOWN)."],
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

    // ── Stage 4: Initial prediction ──
    {
      id: "init", group: "Boosting", title: "Step 0 — initial log-odds from class frequency",
      map: "Init pred",
      why: "We start with the log-odds of the class frequency. With 4 spam out of 8 emails, p=0.5, so log-odds=0 and σ(0)=0.5 — equal probability for all examples.",
      render: (trace) => {
        const r0 = trace.rounds[0];
        const initLO = trace.initLogOdds;
        const initP = sigmoid(initLO);
        return (
          <>
            <Lead>
              Before any tree, we predict the <b>log-odds of the class frequency</b>.
              With 4 spam / 8 total → p = 0.5 → log-odds = log(0.5/0.5) = 0.
              Every email starts with <b>P(spam) = σ(0) = 0.5</b>.
            </Lead>
            <Formula label="Initial log-odds">
              F₀ = log(p/(1−p)) = log({(4/8).toFixed(2)} / {(4/8).toFixed(2)}) = <b>{fmt(initLO, 3)}</b>
            </Formula>
            <Formula label="Initial probability">
              σ(F₀) = σ({fmt(initLO, 3)}) = 1/(1+e⁰) = <b>{fmt(initP, 3)}</b>
            </Formula>
            <div className="tf-subhead">Initial pseudo-residuals (y − p)</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    {["#", "label y", "F₀", "P(spam)", "pseudo-resid. r = y − p"].map(h => (
                      <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BOOST_CLS.data.map((d, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)", background: d[2] === 0 ? HAM_BG : SPAM_BG }}>
                      <td style={{ padding: "4px 8px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{i + 1}</td>
                      <td style={{ padding: "4px 8px", fontWeight: 700, color: clsColor(d[2]) }}>{clsName(d[2])}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(initLO, 3)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{fmt(initP, 3)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: 700,
                        color: r0.residuals[i] >= 0 ? "#1f9e6b" : "#e0492e" }}>
                        {fmt(r0.residuals[i], 3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Note>
              Spam examples have positive pseudo-residuals (+0.5) — we need to push their
              probability UP. Ham examples have negative residuals (−0.5) — push DOWN.
              This is exactly what Tree 1 will learn to do.
            </Note>
          </>
        );
      },
    },

    // ── Stage 5: Tree 1 ──
    {
      id: "tree1", group: "Boosting", title: "Tree 1 — split on word_count ≤ 0.55",
      map: "Tree 1",
      why: "Tree 1 finds the most informative split for the pseudo-residuals. word_count ≤ 0.55 separates ham (mostly low word count) from spam (high word count).",
      render: (trace) => {
        const stump = BOOST_CLS.stumps[0];
        const r0 = trace.rounds[0];
        return (
          <>
            <Lead>
              Tree 1 is a stump trained on the pseudo-residuals. It splits on
              <b> word_count ≤ 0.55</b>. Left leaf (low word count, mostly ham) = negative value
              → push P(spam) down. Right leaf (high word count, mostly spam) = positive → push P(spam) up.
            </Lead>
            <Row>
              <div>
                <div className="tf-subhead">Stump 1 structure</div>
                <ClsStumpSvg stump={stump} featureNames={BOOST_CLS.features} />
              </div>
              <div>
                <div className="tf-subhead">Leaf averages</div>
                <div className="nn-calc" style={{ minWidth: 230 }}>
                  <div className="nn-calc-h">Left (word_count ≤ 0.55, n=4)</div>
                  <div className="nn-calc-row">
                    residuals: {r0.residuals.filter((_, i) => BOOST_CLS.data[i][0] <= 0.55).map(r => fmt(r, 2)).join(", ")}
                  </div>
                  <div className="nn-calc-row">
                    avg = <b style={{ color: HAM_COL }}>{fmt(stump.leftVal, 3)}</b> → push ham down
                  </div>
                  <div className="nn-calc-h" style={{ marginTop: 8 }}>Right (word_count > 0.55, n=4)</div>
                  <div className="nn-calc-row">
                    residuals: {r0.residuals.filter((_, i) => BOOST_CLS.data[i][0] > 0.55).map(r => fmt(r, 2)).join(", ")}
                  </div>
                  <div className="nn-calc-row">
                    avg = <b style={{ color: SPAM_COL }}>{fmt(stump.rightVal, 3)}</b> → push spam up
                  </div>
                </div>
              </div>
            </Row>
            <div className="tf-subhead">Predictions per email after T1</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    {["label", "word_c", "T1(x)", "new log-odds", "new P(spam)", "correct?"].map(h => (
                      <th key={h} style={{ padding: "4px 7px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BOOST_CLS.data.map((d, i) => {
                    const r1 = trace.rounds[Math.min(1, trace.rounds.length - 1)];
                    const correct = (r1.probs[i] >= 0.5 ? 1 : 0) === d[2];
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)", background: d[2] === 0 ? HAM_BG : SPAM_BG }}>
                        <td style={{ padding: "3px 7px", fontWeight: 700, color: clsColor(d[2]) }}>{clsName(d[2])}</td>
                        <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)" }}>{d[0].toFixed(1)}</td>
                        <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)",
                          color: d[0] <= 0.55 ? HAM_COL : SPAM_COL }}>
                          {fmt(d[0] <= 0.55 ? stump.leftVal : stump.rightVal, 3)}
                        </td>
                        <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)" }}>
                          {fmt(r1.logOdds[i], 3)}
                        </td>
                        <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)", fontWeight: 600 }}>
                          {fmt(r1.probs[i], 3)}
                        </td>
                        <td style={{ padding: "3px 7px", fontSize: 14 }}>{correct ? "✓" : "✗"}</td>
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

    // ── Stage 6: Probability update ──
    {
      id: "probupdate", group: "Boosting", title: "Probability update — log-odds → sigmoid → probability",
      map: "Prob update",
      why: "We work in log-odds space but interpret results as probabilities. The sigmoid function converts any real number to a valid probability (0,1).",
      render: (trace) => {
        const r0 = trace.rounds[0];
        const r1 = trace.rounds[Math.min(1, trace.rounds.length - 1)];
        const stump = BOOST_CLS.stumps[0];
        const eta = BOOST_CLS.eta;
        // draw sigmoid
        const sigPts = [];
        for (let z = -4; z <= 4; z += 0.1) {
          const x = 40 + ((z + 4) / 8) * 260;
          const y = 170 - sigmoid(z) * 130;
          sigPts.push(`${x},${y}`);
        }
        return (
          <>
            <Lead>
              New log-odds = old log-odds + η × T₁(x). Then apply sigmoid to get probability.
              This is why gradient boosting for classification works in <b>log-odds space</b> —
              trees add log-odds, not probabilities (which don't add linearly).
            </Lead>
            <Formula label="Update">
              F₁(x) = F₀ + η·T₁(x) &nbsp;→&nbsp; P(spam) = σ(F₁(x))
            </Formula>
            <div className="tf-subhead">Sigmoid function</div>
            <svg viewBox="0 0 320 190" style={{ width: "100%", maxWidth: 320 }}>
              <polyline points={sigPts.join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2.2" />
              <line x1={40} y1={10} x2={40} y2={175} stroke="var(--line)" strokeWidth="1" />
              <line x1={40} y1={175} x2={300} y2={175} stroke="var(--line)" strokeWidth="1" />
              {[-4, -2, 0, 2, 4].map(z => (
                <g key={z}>
                  <line x1={40 + ((z + 4) / 8) * 260} y1={175} x2={40 + ((z + 4) / 8) * 260} y2={178} stroke="var(--line)" strokeWidth="1" />
                  <text x={40 + ((z + 4) / 8) * 260} y={188} textAnchor="middle" fontSize="9" fill="var(--muted)">{z}</text>
                </g>
              ))}
              {[0, 0.25, 0.5, 0.75, 1.0].map(p => (
                <g key={p}>
                  <text x={34} y={170 - p * 130 + 4} textAnchor="end" fontSize="9" fill="var(--muted)">{p.toFixed(2)}</text>
                  <line x1={37} y1={170 - p * 130} x2={40} y2={170 - p * 130} stroke="var(--line)" strokeWidth="1" />
                </g>
              ))}
              <text x={170} y={200} textAnchor="middle" fontSize="9" fill="var(--muted)">log-odds F(x)</text>
              <text x={10} y={90} textAnchor="middle" fontSize="9" fill="var(--muted)" transform="rotate(-90,10,90)">P(spam)</text>
              <line x1={40 + (4 / 8) * 260} y1={10} x2={40 + (4 / 8) * 260} y2={175}
                stroke="var(--faint)" strokeWidth="1" strokeDasharray="3 3" />
              <text x={40 + (4 / 8) * 260 + 4} y={25} fontSize="9" fill="var(--faint)">log-odds=0 → p=0.5</text>
            </svg>
            <div className="tf-subhead">Update example: email 1 (ham, wc=0.2)</div>
            <div className="nn-calc">
              <div className="nn-calc-h">Step-by-step for email 1</div>
              <div className="nn-calc-row">Initial log-odds: F₀ = {fmt(trace.initLogOdds, 3)}</div>
              <div className="nn-calc-row">T₁(word_count=0.2) = {fmt(stump.leftVal, 3)} (left leaf)</div>
              <div className="nn-calc-row">F₁ = {fmt(trace.initLogOdds, 3)} + {eta} × {fmt(stump.leftVal, 3)} = <b>{fmt(r1.logOdds[0], 3)}</b></div>
              <div className="nn-calc-row">P(spam) = σ({fmt(r1.logOdds[0], 3)}) = <b>{fmt(r1.probs[0], 4)}</b> → predict <b style={{ color: HAM_COL }}>ham ✓</b></div>
            </div>
          </>
        );
      },
    },

    // ── Stage 7: Trees 2 & 3 ──
    {
      id: "moretrees", group: "Boosting", title: "Trees 2 & 3 — progressive refinement",
      map: "Trees 2 & 3",
      why: "Each additional tree targets the remaining errors. The scatter plots show how the predicted probabilities converge toward the true labels.",
      render: (trace) => {
        return (
          <>
            <Lead>
              Tree 2 splits on <b>has_link ≤ 0.5</b> (presence of a link). Tree 3 splits on
              <b> word_count ≤ 0.35</b>. Each refinement reduces log-loss. The nTrees slider
              lets you see the effect live.
            </Lead>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "12px 0" }}>
              {BOOST_CLS.stumps.map((stump, t) => (
                t < Math.min(trace.input.nTrees, 3) ? (
                  <div key={t}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>Tree {t + 1}</div>
                    <ClsStumpSvg stump={stump} featureNames={BOOST_CLS.features} />
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                      Leaf values: {fmt(stump.leftVal, 3)} / {fmt(stump.rightVal, 3)}
                    </div>
                  </div>
                ) : (
                  <div key={t} style={{ opacity: 0.35, filter: "grayscale(1)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Tree {t + 1} (inactive)</div>
                    <ClsStumpSvg stump={stump} featureNames={BOOST_CLS.features} />
                  </div>
                )
              ))}
            </div>
            <div className="tf-subhead">Log-loss reduction per round</div>
            <LossBar rounds={trace.rounds} />
            <div className="tf-subhead">Scatter with current probabilities</div>
            <ClsScatter probs={trace.rounds[trace.rounds.length - 1].probs} title="" />
          </>
        );
      },
    },

    // ── Stage 8: Final prediction ──
    {
      id: "predict", group: "Boosting", title: "Final prediction — full ensemble inference",
      map: "Predict",
      why: "At inference, we sum up all tree predictions in log-odds space, apply sigmoid, and threshold at 0.5 to get the class label.",
      render: (trace, ctx) => {
        const { input, setInput } = ctx;
        const qp = trace.queryProb;
        const ql = trace.queryLabel;
        return (
          <>
            <Lead>
              For a new email with <b>word_count = {trace.input.f0.toFixed(2)}</b> and
              <b> has_link = {trace.input.f1}</b>, we sum all active tree predictions in
              log-odds space, apply sigmoid, and classify.
            </Lead>
            <div className="nn-input-bar" style={{ marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
              <label className="nn-slider">
                <span className="nn-slider-l">word_count</span>
                <input type="range" min="0" max="1" step="0.05" value={input.f0}
                  onChange={e => setInput({ ...input, f0: parseFloat(e.target.value) })} />
                <span className="nn-slider-v">{input.f0.toFixed(2)}</span>
              </label>
              <label className="nn-slider">
                <span className="nn-slider-l">has_link</span>
                <input type="range" min="0" max="1" step="1" value={input.f1}
                  onChange={e => setInput({ ...input, f1: parseInt(e.target.value) })} />
                <span className="nn-slider-v">{input.f1}</span>
              </label>
            </div>
            <div className="nn-calc">
              <div className="nn-calc-h">Ensemble computation ({input.nTrees} tree(s))</div>
              <div className="nn-calc-row">F₀ = log-odds = {fmt(trace.initLogOdds, 3)}</div>
              {BOOST_CLS.stumps.slice(0, input.nTrees).map((stump, t) => {
                const feat = input.f0 <= (stump.feature === 0 ? stump.threshold : 999) && input.f1 <= (stump.feature === 1 ? stump.threshold : 999);
                const x = stump.feature === 0 ? input.f0 : input.f1;
                const val = x <= stump.threshold ? stump.leftVal : stump.rightVal;
                return (
                  <div key={t} className="nn-calc-row">
                    + η·T{t+1}({BOOST_CLS.features[stump.feature]}={x.toFixed(2)}) = {BOOST_CLS.eta}×{fmt(val, 3)} = <b>{fmt(BOOST_CLS.eta * val, 3)}</b>
                  </div>
                );
              })}
              <div className="nn-calc-row">Total log-odds = <b>{fmt(trace.queryLogOdds, 3)}</b></div>
              <div className="nn-calc-row">P(spam) = σ({fmt(trace.queryLogOdds, 3)}) = <b className="nn-calc-res">{fmt(qp, 4)}</b></div>
              <div className="nn-calc-row">
                {qp.toFixed(4)} {qp >= 0.5 ? "≥" : "<"} 0.5 →&nbsp;
                <b style={{ color: clsColor(ql) }}>predict {clsName(ql).toUpperCase()}</b>
              </div>
            </div>
            <div className="tf-subhead" style={{ marginTop: 12 }}>Probability output</div>
            <ProbBars ham={1 - qp} spam={qp} />
            <div style={{
              marginTop: 12, padding: "12px 16px", borderRadius: 10,
              background: clsBg(ql), border: `2px solid ${clsColor(ql)}33`
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: clsColor(ql) }}>
                Prediction: {clsName(ql).toUpperCase()}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Confidence: {fmt(ql === 1 ? qp : 1 - qp, 1, 3)} | Training accuracy: {(trace.accuracy * 100).toFixed(0)}%
              </div>
            </div>
          </>
        );
      },
    },

    // ── Stage 9: XGBoost differences ──
    {
      id: "xgboost", group: "Concepts", title: "XGBoost — second-order gradient boosting",
      map: "XGBoost",
      why: "XGBoost is the most widely used gradient boosting implementation. Its key improvements over vanilla GB make it faster and more accurate.",
      render: (trace) => (
        <>
          <Lead>
            <b>XGBoost</b> (Extreme Gradient Boosting) extends vanilla gradient boosting with
            second-order gradients (Hessian), regularization on leaf values, and tree pruning.
            This makes it substantially faster and more accurate in practice.
          </Lead>
          <div className="tf-subhead">Key formula difference</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "12px 0" }}>
            <div style={{ background: "var(--accent-soft)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 8 }}>Vanilla GB leaf value</div>
              <div style={{ fontFamily: "var(--num-font)", fontSize: 13, color: "var(--ink)", lineHeight: 2 }}>
                w = mean(pseudo-residuals)<br />
                w = (1/n) Σ rᵢ
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>First-order only</div>
            </div>
            <div style={{ background: "rgba(124,92,255,.08)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7c5cff", marginBottom: 8 }}>XGBoost leaf value</div>
              <div style={{ fontFamily: "var(--num-font)", fontSize: 13, color: "var(--ink)", lineHeight: 2 }}>
                w = −ΣGᵢ / (ΣHᵢ + λ)<br />
                G = ∂L/∂F, H = ∂²L/∂F²
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>Second-order (Newton step)</div>
            </div>
          </div>
          <div className="tf-legend">
            {[
              ["Second-order gradient (Hessian)", "H = ∂²L/∂F² normalizes the gradient step. For log-loss: H = p(1−p). Acts like a variable learning rate — confident predictions get smaller updates."],
              ["L2 regularization λ", "λ in the denominator shrinks leaf values toward zero. Prevents extreme predictions from small leaf samples."],
              ["Column subsampling", "Like random forests, XGBoost can randomly select a subset of features for each tree — reduces overfitting and speeds up training."],
              ["Tree pruning (γ)", "A minimum gain threshold γ: if a split doesn't improve the objective by γ, the node is pruned. Prevents unnecessary splits."],
              ["Sparsity-aware splits", "XGBoost handles missing values natively by learning a default direction for each split — no imputation needed."],
            ].map(([n, d]) => (
              <div className="tf-leg" key={n}>
                <div className="tf-leg-name">{n}</div>
                <div className="tf-leg-desc">{d}</div>
              </div>
            ))}
          </div>
        </>
      ),
    },

    // ── Stage 10: Comparison ──
    {
      id: "compare", group: "Concepts", title: "Comparison — GB vs RF vs Neural Networks",
      map: "Comparison",
      why: "Each algorithm has its sweet spot. Understanding trade-offs helps you pick the right tool.",
      render: (trace) => (
        <>
          <Lead>
            Gradient Boosting, Random Forests, and Neural Networks are the three dominant ML
            paradigms for tabular data. Here's how they compare across key dimensions.
          </Lead>
          <div style={{ overflowX: "auto", margin: "12px 0" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", minWidth: 480 }}>
              <thead>
                <tr style={{ background: "var(--accent-soft)", borderBottom: "2px solid var(--line)" }}>
                  {["Dimension", "Gradient Boosting", "Random Forest", "Neural Network"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "var(--accent-ink)", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Accuracy (tabular)", "★★★★★", "★★★★☆", "★★★☆☆"],
                  ["Training speed", "Medium", "Fast (parallel)", "Slow"],
                  ["Interpretability", "Moderate", "Moderate", "Low"],
                  ["Hyperparams to tune", "Many (3–5 key)", "Few (1–2)", "Very many"],
                  ["Missing values", "Handles natively (XGBoost)", "Needs imputation", "Needs imputation"],
                  ["Overfitting risk", "High (without tuning)", "Low", "High"],
                  ["Tiny datasets", "Risky", "Good", "Poor"],
                  ["Image / text / audio", "No", "No", "★★★★★"],
                  ["Online learning", "No (batch only)", "No (batch only)", "Yes (SGD)"],
                ].map(([dim, gb, rf, nn]) => (
                  <tr key={dim} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                    <td style={{ padding: "6px 10px", fontWeight: 600, color: "var(--ink)" }}>{dim}</td>
                    <td style={{ padding: "6px 10px", color: "var(--accent-ink)" }}>{gb}</td>
                    <td style={{ padding: "6px 10px", color: "#1f9e6b" }}>{rf}</td>
                    <td style={{ padding: "6px 10px", color: "var(--muted)" }}>{nn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="opt-pc" style={{ marginTop: 12 }}>
            <div className="opt-pc-col is-pro">
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1f9e6b", marginBottom: 6 }}>Gradient Boosting strengths</div>
              <ul style={{ fontSize: 13, margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
                <li>Best accuracy on tabular data (Kaggle winner)</li>
                <li>Handles mixed feature types naturally</li>
                <li>Feature importances are interpretable</li>
                <li>XGBoost handles sparse data / missing values</li>
                <li>Less preprocessing needed than neural networks</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e0492e", marginBottom: 6 }}>Gradient Boosting weaknesses</div>
              <ul style={{ fontSize: 13, margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
                <li>Sequential training — can't be fully parallelized</li>
                <li>Many hyperparameters to tune carefully</li>
                <li>Sensitive to outliers (use huber loss instead)</li>
                <li>Poor on high-dimensional sparse data (text/images)</li>
                <li>No built-in uncertainty quantification</li>
              </ul>
            </div>
          </div>
          <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 10, background: "var(--accent-soft)", fontSize: 13, color: "var(--ink)" }}>
            <b>Practical rule:</b> Start with gradient boosting (XGBoost or LightGBM) for any tabular classification/regression task.
            It's almost always among the top-2 methods. Only move to neural networks when you have very large datasets,
            embeddings, or non-tabular modalities.
          </div>
        </>
      ),
    },
  ];

  // ── META ──
  window.ML_META = {
    title: "Gradient Boosting",
    subtitle: "Classification — log-loss with pseudo-residuals",
    cur: "Gradient Boosting (Classification)",
    category: "Ensemble Methods",
    run: runBoostCls,
    default: { ...BOOST_CLS.default },
    modeLinks: [
      { label: "Regression", href: "Gradient Boosting (Regression).html", active: false },
      { label: "Classification", href: "Gradient Boosting (Classification).html", active: true },
    ],
    renderInput: (input, setInput, trace) => (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">word_count</span>
          <input type="range" min="0" max="1" step="0.05" value={input.f0}
            onChange={e => setInput({ ...input, f0: parseFloat(e.target.value) })} />
          <span className="nn-slider-v">{input.f0.toFixed(2)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">has_link</span>
          <input type="range" min="0" max="1" step="1" value={input.f1}
            onChange={e => setInput({ ...input, f1: parseInt(e.target.value) })} />
          <span className="nn-slider-v">{input.f1}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">nTrees</span>
          <input type="range" min="1" max="3" step="1" value={input.nTrees}
            onChange={e => setInput({ ...input, nTrees: parseInt(e.target.value) })} />
          <span className="nn-slider-v">{input.nTrees}</span>
        </label>
        <span style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 4 }}>
          P(spam): <b style={{ color: trace.queryLabel === 1 ? "#e0492e" : "#1f9e6b" }}>
            {(trace.queryProb * 100).toFixed(1)}%
          </b>
          &nbsp;→&nbsp;
          <b style={{ color: trace.queryLabel === 1 ? "#e0492e" : "#1f9e6b" }}>
            {trace.queryLabel === 1 ? "SPAM" : "HAM"}
          </b>
        </span>
      </>
    ),
  };
})();
