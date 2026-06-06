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
  const HAM_BG = "rgba(31,158,107,.10)";
  const SPAM_BG = "rgba(224,73,46,.10)";
  const clsColor = label => label === 1 ? SPAM_COL : HAM_COL;
  const clsBg = label => label === 1 ? SPAM_BG : HAM_BG;
  const clsName = label => label === 1 ? "spam" : "ham";

  // ── SVG scatter for 2D classification ──
  const SW = 340, SH = 220;
  const SPAD = { l: 48, r: 16, t: 16, b: 38 };
  const ssx = v => SPAD.l + v * (SW - SPAD.l - SPAD.r);
  const ssy = v => SH - SPAD.b - v * (SH - SPAD.t - SPAD.b);

  function ClsScatter({ probs, title, highlightIdx }) {
    const data = BOOST_CLS.data;
    return (
      <div>
        {title && <div className="tf-subhead">{title}</div>}
        <svg viewBox={`0 0 ${SW} ${SH}`} style={{ width: "100%", maxWidth: SW }}>
          {[0, 0.25, 0.5, 0.75, 1.0].map(v => (
            <line key={v} x1={SPAD.l} y1={ssy(v)} x2={SW - SPAD.r} y2={ssy(v)}
              stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />
          ))}
          <line x1={SPAD.l} y1={SH - SPAD.b} x2={SW - SPAD.r} y2={SH - SPAD.b} stroke="var(--ink)" strokeWidth="1.2" />
          <line x1={SPAD.l} y1={SPAD.t} x2={SPAD.l} y2={SH - SPAD.b} stroke="var(--ink)" strokeWidth="1.2" />
          {[0, 0.25, 0.5, 0.75, 1.0].map(v => (
            <g key={v}>
              <line x1={ssx(v)} y1={SH - SPAD.b} x2={ssx(v)} y2={SH - SPAD.b + 4} stroke="var(--ink)" strokeWidth="1" />
              <text x={ssx(v)} y={SH - SPAD.b + 14} textAnchor="middle" fontSize="9" fill="var(--muted)">{v.toFixed(2)}</text>
            </g>
          ))}
          <text x={SPAD.l - 6} y={ssy(0) + 4} textAnchor="end" fontSize="9" fill="var(--muted)">0</text>
          <text x={SPAD.l - 6} y={ssy(1) + 4} textAnchor="end" fontSize="9" fill="var(--muted)">1</text>
          <text x={(SPAD.l + SW - SPAD.r) / 2} y={SH - 2} textAnchor="middle" fontSize="10" fill="var(--muted)">word_count</text>
          <text x={12} y={(SPAD.t + SH - SPAD.b) / 2} textAnchor="middle" fontSize="10" fill="var(--muted)"
            transform={`rotate(-90,12,${(SPAD.t + SH - SPAD.b) / 2})`}>has_link</text>
          {data.map((d, i) => {
            const p = probs ? probs[i] : null;
            const label = d[2];
            const predicted = p !== null ? (p >= 0.5 ? 1 : 0) : label;
            const correct = predicted === label;
            const isHighlighted = highlightIdx === i;
            return (
              <g key={i}>
                <circle
                  cx={ssx(d[0])} cy={ssy(d[1])} r={isHighlighted ? 9 : 7}
                  fill={clsColor(label)} opacity="0.85"
                  stroke={isHighlighted ? "#333" : (correct ? "white" : "#333")}
                  strokeWidth={isHighlighted ? 3 : (correct ? 1.5 : 2.5)}
                />
                {p !== null && (
                  <text x={ssx(d[0]) + 10} y={ssy(d[1]) - 4} fontSize="9" fill="var(--muted)">{fmt(p, 2)}</text>
                )}
              </g>
            );
          })}
        </svg>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: HAM_COL, display: "inline-block" }} />
            ham (0) — legitimate
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: SPAM_COL, display: "inline-block" }} />
            spam (1) — junk
          </span>
          {probs && <span style={{ fontSize: 10 }}>numbers = P(spam)</span>}
        </div>
      </div>
    );
  }

  // ── log-loss bar ──
  function LossBar({ rounds }) {
    const maxLoss = rounds[0].loss;
    return (
      <div style={{ margin: "10px 0" }}>
        {rounds.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)", width: 76, flexShrink: 0 }}>
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
            <span style={{ fontSize: 12, fontFamily: "var(--num-font)", color: "var(--ink)", width: 58, flexShrink: 0 }}>
              {r.loss.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── classification stump SVG ──
  function ClsStumpSvg({ stump, featureNames }) {
    const W2 = 270, H2 = 140;
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
        <rect x={midX - 74} y={rootY - 16} width={148} height={32} rx="8"
          fill="var(--panel-solid)" stroke="var(--accent)" strokeWidth="2" />
        <text x={midX} y={rootY + 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">
          {feat} ≤ {stump.threshold}?
        </text>
        <rect x={leftX - 38} y={childY - 16} width={76} height={32} rx="8"
          fill={stump.leftVal >= 0 ? "rgba(224,73,46,.12)" : "rgba(31,158,107,.12)"}
          stroke={stump.leftVal >= 0 ? SPAM_COL : HAM_COL} strokeWidth="1.5" />
        <text x={leftX} y={childY - 1} textAnchor="middle" fontSize="11" fontWeight="700"
          fill={stump.leftVal >= 0 ? SPAM_COL : HAM_COL}>
          {fmt(stump.leftVal, 3)}
        </text>
        <text x={leftX} y={childY + 13} textAnchor="middle" fontSize="9" fill="var(--muted)">
          {stump.leftVal >= 0 ? "→ spam signal" : "→ ham signal"}
        </text>
        <rect x={rightX - 38} y={childY - 16} width={76} height={32} rx="8"
          fill={stump.rightVal >= 0 ? "rgba(224,73,46,.12)" : "rgba(31,158,107,.12)"}
          stroke={stump.rightVal >= 0 ? SPAM_COL : HAM_COL} strokeWidth="1.5" />
        <text x={rightX} y={childY - 1} textAnchor="middle" fontSize="11" fontWeight="700"
          fill={stump.rightVal >= 0 ? SPAM_COL : HAM_COL}>
          {fmt(stump.rightVal, 3)}
        </text>
        <text x={rightX} y={childY + 13} textAnchor="middle" fontSize="9" fill="var(--muted)">
          {stump.rightVal >= 0 ? "→ spam signal" : "→ ham signal"}
        </text>
      </svg>
    );
  }

  // ── prob bars ──
  function ProbBars({ ham, spam }) {
    return (
      <div style={{ marginTop: 10 }}>
        {[["ham", ham, HAM_COL], ["spam", spam, SPAM_COL]].map(([name, p, col]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--ink)", width: 36 }}>{name}</span>
            <div style={{ flex: 1, background: "var(--line-soft)", borderRadius: 4, height: 18, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${p * 100}%`, background: col, borderRadius: 4, transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: "var(--num-font)", color: col, fontWeight: 700, width: 44 }}>
              {(p * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 1: Overview
  // ────────────────────────────────────────────────────────
  const stageOverview = {
    id: "overview", group: "Overview", title: "Gradient Boosting for classification",
    map: "Overview",
    why: "Classification boosting uses the same sequential tree-building as regression, but swaps MSE for log-loss. The 'residuals' become 'pseudo-residuals' — gradients of the log-loss.",
    render: () => (
      <>
        <Lead>
          Gradient Boosting for <b>classification</b> is the same "student who studies their wrong
          answers" idea as regression — but with a different definition of "wrong." In regression,
          error is measured by the gap between predicted price and actual price (MSE). In
          classification, we cannot directly measure error in probability space the same way.
          Instead, we use <b>log-loss</b> (cross-entropy): a loss that grows unboundedly when
          you make confident wrong predictions, and is zero only when you are perfectly certain
          and correct.
        </Lead>
        <Lead>
          Because we use a different loss, the "residuals" are slightly different — they are
          called <b>pseudo-residuals</b>: the gradient of the log-loss with respect to the
          current prediction. Remarkably, for log-loss they work out to
          <b> yᵢ − P(y=1|xᵢ)</b> — almost identical to ordinary residuals, just with
          a probability instead of a raw prediction. This makes gradient boosting a unified
          framework: change the loss, change the pseudo-residuals, keep everything else the same.
        </Lead>

        <div style={{ margin: "16px 0 10px" }}>
          <div className="tf-subhead">Classification boosting pipeline</div>
          <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", margin: "10px 0" }}>
            {[
              { label: "F₀ = log-odds", sub: "log(p/(1−p))", color: "#94A2BC" },
              null,
              { label: "pseudo-resid.", sub: "y − σ(F)", color: "#f59e0b" },
              null,
              { label: "Tree 1", sub: "fit pseudo-r.", color: "#2B5BFF" },
              null,
              { label: "F₁ = F₀+η·T₁", sub: "log-odds update", color: "#7c5cff" },
              null,
              { label: "σ(F₁)", sub: "probability", color: SPAM_COL },
              null,
              { label: "⋯ more trees", sub: "", color: "var(--muted)" },
            ].map((item, i) =>
              item === null ? (
                <div key={i} style={{ fontSize: 18, color: "var(--faint)", padding: "0 3px" }}>→</div>
              ) : (
                <div key={i} style={{
                  padding: "7px 10px", borderRadius: 8, textAlign: "center", minWidth: 80,
                  background: item.color === "var(--muted)" ? "transparent" : `${item.color}18`,
                  border: `1.5px solid ${item.color === "var(--muted)" ? "transparent" : item.color + "44"}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.label}</div>
                  {item.sub && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{item.sub}</div>}
                </div>
              )
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
          <div style={{ background: "var(--accent-soft)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>Same as Regression</div>
            <ul style={{ fontSize: 13, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.75 }}>
              <li>Sequential tree building</li>
              <li>Fit pseudo-residuals (gradients) each round</li>
              <li>Shrink each tree's contribution by η</li>
              <li>Final = sum of all tree outputs</li>
            </ul>
          </div>
          <div style={{ background: "rgba(224,73,46,.08)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: SPAM_COL, marginBottom: 6 }}>Different from Regression</div>
            <ul style={{ fontSize: 13, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.75 }}>
              <li>Loss = log-loss (not MSE)</li>
              <li>Output F(x) = log-odds (not price)</li>
              <li>σ(F(x)) → probability ∈ (0, 1)</li>
              <li>Threshold 0.5 → class label</li>
            </ul>
          </div>
        </div>

        <div className="tf-legend" style={{ marginTop: 12 }}>
          {[
            ["Log-loss", "The loss function for binary classification: L = −[y·log(p) + (1−y)·log(1−p)]. It grows to ∞ when you predict 0.01 for a positive example. This extreme penalty forces the model to be well-calibrated."],
            ["Pseudo-residuals", "The gradient of log-loss w.r.t. F(x): rᵢ = yᵢ − σ(F(xᵢ)) = yᵢ − P(y=1|xᵢ). For a spam email (y=1) predicted with P=0.3, pseudo-residual = 1 − 0.3 = +0.7 (push probability up)."],
            ["Log-odds (logit)", "F(x) is in log-odds space: F = log(p/(1−p)). We add tree outputs in log-odds space, then convert to probability using σ. This is because log-odds add linearly, but probabilities do not."],
            ["Sigmoid σ", "σ(z) = 1/(1+e^−z). Converts any real number to (0,1). σ(0)=0.5, σ(2)≈0.88, σ(−2)≈0.12. All log-odds predictions pass through sigmoid to become probabilities."],
          ].map(([name, desc]) => (
            <div className="tf-leg" key={name}>
              <div className="tf-leg-name">{name}</div>
              <div className="tf-leg-desc">{desc}</div>
            </div>
          ))}
        </div>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 2: Dataset
  // ────────────────────────────────────────────────────────
  const stageDataset = {
    id: "dataset", group: "Data", title: "Dataset — email spam detection",
    map: "Dataset",
    why: "8 emails with 2 features. Small enough to trace every calculation. The same algorithm works on millions of emails with thousands of features.",
    render: (trace) => (
      <>
        <Lead>
          Our toy dataset contains <b>8 emails</b> described by two features:
          <b> word_count</b> (normalized 0–1, representing how many words the email contains
          relative to a typical email) and <b>has_link</b> (binary: 1 if the email contains
          a URL, 0 otherwise). The label is <span style={{ color: HAM_COL, fontWeight: 700 }}>ham = 0</span> (legitimate)
          or <span style={{ color: SPAM_COL, fontWeight: 700 }}>spam = 1</span> (junk).
        </Lead>
        <Lead>
          Looking at the scatter plot, there is a general pattern: high word count or having
          a link tends to correlate with spam. But email #4 is a tricky case — it has a link
          but is actually legitimate (ham). This kind of overlap is why we need multiple trees:
          one simple split cannot perfectly separate all points.
        </Lead>

        <Row>
          <div>
            <div className="tf-subhead">Training data</div>
            <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth: 300 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["#", "word_count", "has_link", "label"].map(h => (
                    <th key={h} style={{ padding: "5px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BOOST_CLS.data.map((d, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)", background: d[2] === 0 ? HAM_BG : SPAM_BG }}>
                    <td style={{ padding: "4px 10px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{i + 1}</td>
                    <td style={{ padding: "4px 10px", fontFamily: "var(--num-font)" }}>{d[0].toFixed(2)}</td>
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
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.6 }}>
              {BOOST_CLS.data.filter(d => d[2] === 1).length} spam,{" "}
              {BOOST_CLS.data.filter(d => d[2] === 0).length} ham
              → class balance: 50/50
            </div>
          </div>
          <ClsScatter probs={null} title="2D scatter plot (no probabilities yet)" />
        </Row>

        <Note>
          Email #4 (word_count=0.4, has_link=1, ham) is the hardest case.
          It looks like spam based on has_link=1, but it's legitimate. Gradient boosting
          will eventually learn to handle this edge case through multiple rounds of refinement.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 3: Initial Log-Odds (Step 0)
  // ────────────────────────────────────────────────────────
  const stageInit = {
    id: "init", group: "Boosting", title: "Step 0 — initial prediction: log-odds of class frequency",
    map: "Init pred",
    why: "Just like regression starts with the mean, classification starts with the log-odds of the training class frequency. With 50/50 split, log-odds = 0, P(spam) = 0.5 for all emails.",
    render: (trace) => {
      const r0 = trace.rounds[0];
      const initLO = trace.initLogOdds;
      const initP = sigmoid(initLO);
      const nSpam = BOOST_CLS.data.filter(d => d[2] === 1).length;
      const nTotal = BOOST_CLS.data.length;
      const p0 = nSpam / nTotal;

      // Draw sigmoid annotation
      const sigPts = [];
      for (let z = -3; z <= 3; z += 0.15) {
        const x = 40 + ((z + 3) / 6) * 220;
        const y = 160 - sigmoid(z) * 120;
        sigPts.push(`${x},${y}`);
      }

      return (
        <>
          <Lead>
            Before any tree, we need a starting prediction. For classification, we predict
            the <b>log-odds of the positive class frequency</b>. With 4 spam emails out of 8
            total, the proportion is p = 4/8 = 0.5. Log-odds = log(p/(1−p)) = log(1) = 0.
            Every email starts with the same prediction: F₀ = 0, which gives P(spam) = σ(0) = 0.5.
          </Lead>
          <Lead>
            The <b>log-odds</b> (also called the "logit") is defined as log(p/(1−p)).
            When p = 0.5, log-odds = 0. When p = 0.9 (mostly spam), log-odds = log(9) ≈ 2.2.
            When p = 0.1 (mostly ham), log-odds = log(1/9) ≈ −2.2. Log-odds can be any
            real number; we convert back to probability using the sigmoid function σ(z) = 1/(1+e^−z).
          </Lead>

          <Formula label="Initial log-odds F₀">
            F₀ = log(p / (1−p)) = log({p0.toFixed(2)} / {(1 - p0).toFixed(2)}) = log({fmt(p0 / (1 - p0), 2)}) = <b>{fmt(initLO, 4)}</b>
          </Formula>
          <Formula label="Initial probability">
            P(spam) = σ(F₀) = σ({fmt(initLO, 4)}) = 1 / (1 + e⁰) = <b>{fmt(initP, 4)}</b>
          </Formula>

          <Row>
            <div>
              <div className="tf-subhead">Sigmoid σ(z) = 1/(1+e^−z)</div>
              <svg viewBox="0 0 300 185" style={{ width: "100%", maxWidth: 300 }}>
                <polyline points={sigPts.join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2.2" />
                <line x1={40} y1={10} x2={40} y2={165} stroke="var(--line)" strokeWidth="1" />
                <line x1={40} y1={165} x2={260} y2={165} stroke="var(--line)" strokeWidth="1" />
                {[-3, -2, -1, 0, 1, 2, 3].map(z => (
                  <g key={z}>
                    <line x1={40 + ((z + 3) / 6) * 220} y1={165} x2={40 + ((z + 3) / 6) * 220} y2={168} stroke="var(--line)" strokeWidth="1" />
                    <text x={40 + ((z + 3) / 6) * 220} y={179} textAnchor="middle" fontSize="9" fill="var(--muted)">{z}</text>
                  </g>
                ))}
                {[0, 0.25, 0.5, 0.75, 1.0].map(p => (
                  <g key={p}>
                    <text x={34} y={160 - p * 120 + 4} textAnchor="end" fontSize="9" fill="var(--muted)">{p.toFixed(2)}</text>
                    <line x1={37} y1={160 - p * 120} x2={40} y2={160 - p * 120} stroke="var(--line)" strokeWidth="1" />
                  </g>
                ))}
                <line x1={40 + (3 / 6) * 220} y1={10} x2={40 + (3 / 6) * 220} y2={165}
                  stroke="var(--faint)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={40 + (3 / 6) * 220} cy={160 - 0.5 * 120} r="4" fill={SPAM_COL} />
                <text x={40 + (3 / 6) * 220 + 5} y={160 - 0.5 * 120 - 5} fontSize="9" fill={SPAM_COL}>F₀=0 → p=0.5</text>
                <text x={150} y={183} textAnchor="middle" fontSize="9" fill="var(--muted)">log-odds F(x)</text>
              </svg>
            </div>
            <div>
              <div className="tf-subhead">Initial pseudo-residuals (y − P)</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth: 260 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--line)" }}>
                      {["#", "label y", "P(spam)", "pseudo-r. = y−p"].map(h => (
                        <th key={h} style={{ padding: "4px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BOOST_CLS.data.map((d, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)", background: d[2] === 0 ? HAM_BG : SPAM_BG }}>
                        <td style={{ padding: "3px 8px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{i + 1}</td>
                        <td style={{ padding: "3px 8px", fontWeight: 700, color: clsColor(d[2]) }}>{clsName(d[2])}</td>
                        <td style={{ padding: "3px 8px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(initP, 3)}</td>
                        <td style={{ padding: "3px 8px", fontFamily: "var(--num-font)", fontWeight: 700,
                          color: r0.residuals[i] >= 0 ? "#1f9e6b" : "#e0492e" }}>
                          {fmt(r0.residuals[i], 3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Row>

          <Note>
            Spam emails (y=1) have pseudo-residual = 1 − 0.5 = +0.5 (push P(spam) up).
            Ham emails (y=0) have pseudo-residual = 0 − 0.5 = −0.5 (push P(spam) down).
            With perfectly balanced classes, all pseudo-residuals have equal magnitude. Tree 1 will learn which emails need which direction.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 4: Pseudo-Residuals deep dive
  // ────────────────────────────────────────────────────────
  const stagePseudoResid = {
    id: "pseudoresid", group: "Boosting", title: "Pseudo-residuals — gradient of log-loss",
    map: "Pseudo-resid.",
    why: "Pseudo-residuals are the core mechanic. Understanding their formula explains why gradient boosting for classification is so similar to regression.",
    render: (trace) => {
      const r0 = trace.rounds[0];
      const initP = sigmoid(trace.initLogOdds);

      // examples to illustrate gradient behavior
      const examples = [
        { y: 1, p: 0.9, desc: "spam, correctly predicted (high P)" },
        { y: 1, p: 0.3, desc: "spam, wrongly predicted (low P)" },
        { y: 0, p: 0.1, desc: "ham, correctly predicted (low P)" },
        { y: 0, p: 0.7, desc: "ham, wrongly predicted (high P)" },
      ];

      return (
        <>
          <Lead>
            The <b>pseudo-residual</b> rᵢ = yᵢ − P(y=1|xᵢ) is the gradient of the log-loss
            with respect to the log-odds prediction F(x). This derivation is worth spelling out:
            for a single sample, L = −[y·log(σ(F)) + (1−y)·log(1−σ(F))].
            Taking ∂L/∂F and simplifying using the sigmoid derivative gives:
            ∂L/∂F = σ(F) − y = P − y. The <em>negative</em> gradient is therefore y − P.
            Fitting trees to these values is literally gradient descent in function space.
          </Lead>
          <Lead>
            The beauty of this formula: the pseudo-residual's magnitude tells you how much
            the model needs to correct its prediction. For a spam email predicted with P=0.9,
            the pseudo-residual is 1 − 0.9 = 0.1 (small, already good). For a spam email
            predicted with P=0.1, the pseudo-residual is 1 − 0.1 = 0.9 (large, badly wrong).
            <b> Correctly classified, confident predictions automatically get small updates.</b>
          </Lead>

          <Formula label="Log-loss gradient (negative)">
            r = −∂L/∂F = y − σ(F(x)) = y − P(y=1|x) = "pseudo-residual"
          </Formula>

          <div className="tf-subhead">Pseudo-residual behavior in 4 cases</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["true y", "P(spam)", "pseudo-resid. y−p", "magnitude", "action needed"].map(h => (
                    <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {examples.map((ex, i) => {
                  const r = ex.y - ex.p;
                  const isCorrect = (ex.p >= 0.5 ? 1 : 0) === ex.y;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)", background: isCorrect ? "rgba(31,158,107,.06)" : "rgba(224,73,46,.06)" }}>
                      <td style={{ padding: "4px 8px", fontWeight: 700, color: clsColor(ex.y) }}>{clsName(ex.y)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{ex.p.toFixed(2)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: 700,
                        color: r >= 0 ? "#1f9e6b" : "#e0492e" }}>
                        {r >= 0 ? "+" : ""}{fmt(r, 2)}
                      </td>
                      <td style={{ padding: "4px 8px", fontSize: 11, color: "var(--muted)" }}>
                        {Math.abs(r) < 0.15 ? "tiny" : Math.abs(r) < 0.4 ? "moderate" : "large"}
                      </td>
                      <td style={{ padding: "4px 8px", fontSize: 11, color: isCorrect ? HAM_COL : SPAM_COL }}>
                        {isCorrect ? "already good — small update" : r > 0 ? "push P(spam) UP" : "push P(spam) DOWN"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tf-subhead" style={{ marginTop: 12 }}>Our training data: initial pseudo-residuals</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["#", "label y", "wc", "has_link", "F₀", "P = σ(F₀)", "r = y−P", "Tree 1 should…"].map(h => (
                    <th key={h} style={{ padding: "4px 7px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BOOST_CLS.data.map((d, i) => {
                  const r = r0.residuals[i];
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)", background: d[2] === 0 ? HAM_BG : SPAM_BG }}>
                      <td style={{ padding: "3px 7px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{i + 1}</td>
                      <td style={{ padding: "3px 7px", fontWeight: 700, color: clsColor(d[2]) }}>{clsName(d[2])}</td>
                      <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)" }}>{d[0].toFixed(2)}</td>
                      <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)" }}>{d[1]}</td>
                      <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(trace.initLogOdds, 3)}</td>
                      <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)" }}>{fmt(sigmoid(trace.initLogOdds), 3)}</td>
                      <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)", fontWeight: 700,
                        color: r >= 0 ? "#1f9e6b" : "#e0492e" }}>
                        {fmt(r, 3)}
                      </td>
                      <td style={{ padding: "3px 7px", fontSize: 10, color: r > 0 ? SPAM_COL : HAM_COL }}>
                        {r > 0 ? "push P(spam) ↑" : "push P(spam) ↓"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 5: Round 1 — First Stump
  // ────────────────────────────────────────────────────────
  const stageTree1 = {
    id: "tree1", group: "Boosting", title: "Round 1 — first stump on pseudo-residuals",
    map: "Round 1",
    why: "Tree 1 learns the main signal: high word_count → spam, low word_count → ham. The split at 0.55 captures most of the class pattern in one decision.",
    render: (trace) => {
      const stump = BOOST_CLS.stumps[0];
      const r0 = trace.rounds[0];
      const r1 = trace.rounds[Math.min(1, trace.rounds.length - 1)];
      const eta = BOOST_CLS.eta;

      const leftResids = r0.residuals.filter((_, i) => BOOST_CLS.data[i][0] <= stump.threshold);
      const rightResids = r0.residuals.filter((_, i) => BOOST_CLS.data[i][0] > stump.threshold);

      return (
        <>
          <Lead>
            Tree 1 is a decision stump trained on the pseudo-residuals. It finds the split that
            best predicts these residuals. The winning split is <b>word_count ≤ 0.55</b>:
            emails with low word count (mostly ham, negative pseudo-residuals) go left;
            emails with high word count (mostly spam, positive pseudo-residuals) go right.
            Each leaf gets the <b>mean pseudo-residual</b> of its members.
          </Lead>
          <Lead>
            After finding Tree 1, we update in log-odds space:
            <b> F₁(x) = F₀(x) + η × T₁(x)</b> = 0 + 0.5 × T₁(x).
            Then we convert to probability: P₁(spam) = σ(F₁(x)). Emails landing in the
            right leaf (high word count) jump from P=0.5 to σ(0 + 0.5×0.875) ≈ σ(0.4375) ≈ 0.608.
            Emails in the left leaf drop to σ(0 + 0.5×(−0.875)) ≈ σ(−0.4375) ≈ 0.392.
          </Lead>

          <Row>
            <div>
              <div className="tf-subhead">Stump 1 structure</div>
              <ClsStumpSvg stump={stump} featureNames={BOOST_CLS.features} />
            </div>
            <div>
              <div className="tf-subhead">Leaf value calculation</div>
              <div className="nn-calc" style={{ minWidth: 240 }}>
                <div className="nn-calc-h">Left (word_count ≤ {stump.threshold}, n={leftResids.length})</div>
                <div className="nn-calc-row" style={{ fontSize: 11 }}>
                  pseudo-resids: [{leftResids.map(r => fmt(r, 2)).join(", ")}]
                </div>
                <div className="nn-calc-row">
                  mean ≈ <b style={{ color: HAM_COL }}>{fmt(stump.leftVal, 3)}</b> → push P(spam) down
                </div>
                <div className="nn-calc-h" style={{ marginTop: 8 }}>Right (word_count &gt; {stump.threshold}, n={rightResids.length})</div>
                <div className="nn-calc-row" style={{ fontSize: 11 }}>
                  pseudo-resids: [{rightResids.map(r => fmt(r, 2)).join(", ")}]
                </div>
                <div className="nn-calc-row">
                  mean ≈ <b style={{ color: SPAM_COL }}>{fmt(stump.rightVal, 3)}</b> → push P(spam) up
                </div>
              </div>
            </div>
          </Row>

          <div className="tf-subhead" style={{ marginTop: 10 }}>Per-email update after T1</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 11.5, width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["label", "wc", "T₁(x)", "F₁ = F₀+η·T₁", "P₁=σ(F₁)", "new p-resid.", "correct?"].map(h => (
                    <th key={h} style={{ padding: "4px 7px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BOOST_CLS.data.map((d, i) => {
                  const t1val = d[0] <= stump.threshold ? stump.leftVal : stump.rightVal;
                  const correct = (r1.probs[i] >= 0.5 ? 1 : 0) === d[2];
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)", background: d[2] === 0 ? HAM_BG : SPAM_BG }}>
                      <td style={{ padding: "3px 7px", fontWeight: 700, color: clsColor(d[2]) }}>{clsName(d[2])}</td>
                      <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)" }}>{d[0].toFixed(2)}</td>
                      <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)",
                        color: t1val >= 0 ? SPAM_COL : HAM_COL }}>{fmt(t1val, 3)}</td>
                      <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)" }}>{fmt(r1.logOdds[i], 3)}</td>
                      <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)", fontWeight: 600 }}>{fmt(r1.probs[i], 3)}</td>
                      <td style={{ padding: "3px 7px", fontFamily: "var(--num-font)", fontSize: 11,
                        color: r1.residuals[i] >= 0 ? "#1f9e6b" : "#e0492e" }}>{fmt(r1.residuals[i], 3)}</td>
                      <td style={{ padding: "3px 7px", fontSize: 14 }}>{correct ? "✓" : "✗"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <LossBar rounds={trace.rounds.slice(0, 2)} />

          <ClsScatter probs={r1.probs} title="Probabilities after Round 1" />
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 6: Rounds 2 & 3
  // ────────────────────────────────────────────────────────
  const stageMoreTrees = {
    id: "moretrees", group: "Boosting", title: "Rounds 2 & 3 — progressive refinement",
    map: "Rounds 2 & 3",
    why: "Each additional tree targets the remaining errors. The probabilities sharpen (move closer to 0 or 1). Log-loss decreases each round.",
    render: (trace) => {
      const allRounds = trace.rounds;
      return (
        <>
          <Lead>
            Round 2 adds a split on <b>has_link ≤ 0.5</b>. Emails without a link get a small
            downward correction; emails with a link get a small upward correction. This addresses
            the has_link feature that Tree 1 completely ignored. After Round 2, email #4
            (ham with a link) gets a slight downward correction — the model is beginning to
            recognize the "ham despite having a link" pattern.
          </Lead>
          <Lead>
            Round 3 adds a fine-grained split on <b>word_count ≤ 0.35</b>, targeting the
            very-short emails that are definitively ham. The leaf values in Round 3 are tiny
            (±0.15) compared to Round 1 (±0.875) — the big corrections were made first,
            and now we're fine-tuning. This is gradient descent converging: big steps early,
            tiny steps later.
          </Lead>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, margin: "12px 0" }}>
            {BOOST_CLS.stumps.map((stump, t) => {
              const active = t < Math.min(trace.input.nTrees, 3);
              return (
                <div key={t} style={{ opacity: active ? 1 : 0.35 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: active ? "var(--accent-ink)" : "var(--muted)", marginBottom: 6 }}>
                    Tree {t + 1} {!active ? "(inactive)" : ""}
                  </div>
                  <ClsStumpSvg stump={stump} featureNames={BOOST_CLS.features} />
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    Leaves: {fmt(stump.leftVal, 3)} / {fmt(stump.rightVal, 3)}
                    {" "}(max |{fmt(Math.max(Math.abs(stump.leftVal), Math.abs(stump.rightVal)), 3)}|)
                  </div>
                </div>
              );
            })}
          </div>

          <div className="tf-subhead">Pseudo-residuals comparison across rounds</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>email</th>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>label</th>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "#94A2BC", fontWeight: 600 }}>p-resid₀</th>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "#f59e0b", fontWeight: 600 }}>p-resid₁</th>
                  {allRounds.length > 2 && <th style={{ padding: "5px 8px", textAlign: "left", color: "#2B5BFF", fontWeight: 600 }}>p-resid₂</th>}
                  {allRounds.length > 3 && <th style={{ padding: "5px 8px", textAlign: "left", color: "#1f9e6b", fontWeight: 600 }}>p-resid₃</th>}
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>trend</th>
                </tr>
              </thead>
              <tbody>
                {BOOST_CLS.data.map((d, i) => {
                  const r0resid = allRounds[0].residuals[i];
                  const r1resid = allRounds.length > 1 ? allRounds[1].residuals[i] : null;
                  const r2resid = allRounds.length > 2 ? allRounds[2].residuals[i] : null;
                  const r3resid = allRounds.length > 3 ? allRounds[3].residuals[i] : null;
                  const shrinking = r2resid !== null && Math.abs(r2resid) < Math.abs(r0resid);
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)", background: d[2] === 0 ? HAM_BG : SPAM_BG }}>
                      <td style={{ padding: "3px 8px", fontFamily: "var(--num-font)", color: "var(--faint)" }}>{i + 1}</td>
                      <td style={{ padding: "3px 8px", fontWeight: 700, color: clsColor(d[2]) }}>{clsName(d[2])}</td>
                      <td style={{ padding: "3px 8px", fontFamily: "var(--num-font)", color: "#94A2BC" }}>{fmt(r0resid, 3)}</td>
                      <td style={{ padding: "3px 8px", fontFamily: "var(--num-font)", color: "#f59e0b" }}>{r1resid !== null ? fmt(r1resid, 3) : "—"}</td>
                      {allRounds.length > 2 && <td style={{ padding: "3px 8px", fontFamily: "var(--num-font)", color: "#2B5BFF" }}>{r2resid !== null ? fmt(r2resid, 3) : "—"}</td>}
                      {allRounds.length > 3 && <td style={{ padding: "3px 8px", fontFamily: "var(--num-font)", color: "#1f9e6b" }}>{r3resid !== null ? fmt(r3resid, 3) : "—"}</td>}
                      <td style={{ padding: "3px 8px", fontSize: 12 }}>{shrinking ? "↓ shrinking" : "→"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tf-subhead" style={{ marginTop: 10 }}>Log-loss reduction per round</div>
          <LossBar rounds={allRounds} />

          <ClsScatter probs={allRounds[allRounds.length - 1].probs} title={`Probabilities after ${trace.input.nTrees} tree(s) — sharper predictions`} />
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 6c: Sequential Trees — Probability Evolution
  // ────────────────────────────────────────────────────────

  function SeqTreesClsSVG() {
    // ── Actual values from BOOST_CLS / ml-boosting.js ──
    // η = 0.5, initLogOdds = 0, initProb = 0.5
    // Stump 1: word_count ≤ 0.55, leftVal=-0.875, rightVal=+0.875
    // Stump 2: has_link   ≤ 0.5,  leftVal=-0.3,   rightVal=+0.3
    // Stump 3: word_count ≤ 0.35, leftVal=-0.15,  rightVal=+0.1
    // Log-losses: [0.6931, 0.4981, 0.4714, 0.4606]
    //
    // Training emails (index 0-7):
    // wc=[0.2,0.3,0.5,0.4, 0.6,0.8,0.7,0.9]
    // lk=[0,  0,  0,  1,   1,  1,  0,  1]
    // y= [0,  0,  0,  0,   1,  1,  1,  1]  (0=ham,1=spam)

    const SVG_W = 860, SVG_H = 720;
    const T1_Y  = 30;
    const P1_Y  = 198;
    const T2_Y  = 268;
    const P2_Y  = 436;
    const T3_Y  = 506;
    const FIN_Y = 674;

    const TREE_COLORS = ["#2b5bff", "#e0851e", "#1f9e6b"];
    const TREE_BG     = ["rgba(43,91,255,.07)", "rgba(224,133,30,.07)", "rgba(31,158,107,.07)"];
    const TREE_LEAF   = ["rgba(43,91,255,.13)", "rgba(224,133,30,.13)", "rgba(31,158,107,.13)"];

    const data = BOOST_CLS.data; // [wc, link, label]
    const ys   = data.map(d => d[2]);
    const eta  = BOOST_CLS.eta; // 0.5
    const initLO = 0.0;

    const sig = (x) => 1 / (1 + Math.exp(-x));

    // logOdds and probs at each round
    const lo0 = data.map(() => initLO);
    const p0  = lo0.map(sig);
    const r0  = ys.map((y, i) => y - p0[i]);

    const s1  = BOOST_CLS.stumps[0]; // wc <= 0.55
    const lo1 = lo0.map((lo, i) => lo + eta * (data[i][s1.feature] <= s1.threshold ? s1.leftVal : s1.rightVal));
    const p1  = lo1.map(sig);
    const r1  = ys.map((y, i) => y - p1[i]);

    const s2  = BOOST_CLS.stumps[1]; // has_link <= 0.5
    const lo2 = lo1.map((lo, i) => lo + eta * (data[i][s2.feature] <= s2.threshold ? s2.leftVal : s2.rightVal));
    const p2  = lo2.map(sig);
    const r2  = ys.map((y, i) => y - p2[i]);

    const s3  = BOOST_CLS.stumps[2]; // wc <= 0.35
    const lo3 = lo2.map((lo, i) => lo + eta * (data[i][s3.feature] <= s3.threshold ? s3.leftVal : s3.rightVal));
    const p3  = lo3.map(sig);

    const featNames = BOOST_CLS.features; // ["word_count","has_link"]
    const treeTitles = [
      "Tree 1 — trained on initial pseudo-residuals",
      "Tree 2 — trained on Round 1 pseudo-residuals",
      "Tree 3 — trained on Round 2 pseudo-residuals",
    ];
    const splitLabels = [
      `word_count ≤ ${s1.threshold} ?`,
      `has_link ≤ ${s2.threshold} ?`,
      `word_count ≤ ${s3.threshold} ?`,
    ];

    // ── helper: draw stump ──
    function Stump({ treeIdx, sectionY, stump, splitLabel }) {
      const col    = TREE_COLORS[treeIdx];
      const bg     = TREE_BG[treeIdx];
      const leafBg = TREE_LEAF[treeIdx];
      const SX     = 30;
      const midX   = SX + 130;
      const rootY  = sectionY + 44;
      const childY = sectionY + 122;
      const leftX  = SX + 44;
      const rightX = SX + 216;
      return (
        <>
          <rect x={SX} y={sectionY} width={500} height={150}
            rx="10" fill={bg} stroke={col} strokeWidth="1.5" opacity="0.7" />
          <rect x={SX} y={sectionY} width={500} height={28}
            rx="10" fill={col} opacity="0.9" />
          <text x={SX + 250} y={sectionY + 18} textAnchor="middle"
            fontSize="13" fontWeight="700" fill="white">{treeTitles[treeIdx]}</text>
          <line x1={midX} y1={rootY + 18} x2={leftX} y2={childY - 18}
            stroke={col} strokeWidth="2" />
          <line x1={midX} y1={rootY + 18} x2={rightX} y2={childY - 18}
            stroke={col} strokeWidth="2" />
          <text x={(midX + leftX) / 2 - 14} y={(rootY + childY) / 2 + 2}
            fontSize="11" fill={col} fontStyle="italic" fontWeight="600">Yes, ≤</text>
          <text x={(midX + rightX) / 2 + 10} y={(rootY + childY) / 2 + 2}
            fontSize="11" fill={col} fontStyle="italic" fontWeight="600">No, &gt;</text>
          {/* root */}
          <rect x={midX - 88} y={rootY - 18} width={176} height={36}
            rx="8" fill="white" stroke={col} strokeWidth="2.5" />
          <text x={midX} y={rootY + 6} textAnchor="middle"
            fontSize="13" fontWeight="800" fill={col}>{splitLabel}</text>
          {/* left leaf: log-odds update */}
          <rect x={leftX - 52} y={childY - 18} width={104} height={38}
            rx="8" fill={leafBg} stroke={col} strokeWidth="1.8" />
          <text x={leftX} y={childY - 3} textAnchor="middle"
            fontSize="11" fontWeight="700"
            fill={stump.leftVal >= 0 ? SPAM_COL : HAM_COL}>
            log-odds: {stump.leftVal >= 0 ? "+" : ""}{stump.leftVal.toFixed(3)}
          </text>
          <text x={leftX} y={childY + 13} textAnchor="middle"
            fontSize="9.5" fill={stump.leftVal >= 0 ? SPAM_COL : HAM_COL}>
            {stump.leftVal >= 0 ? "push P(spam) UP" : "push P(spam) DOWN"}
          </text>
          {/* right leaf */}
          <rect x={rightX - 52} y={childY - 18} width={104} height={38}
            rx="8" fill={leafBg} stroke={col} strokeWidth="1.8" />
          <text x={rightX} y={childY - 3} textAnchor="middle"
            fontSize="11" fontWeight="700"
            fill={stump.rightVal >= 0 ? SPAM_COL : HAM_COL}>
            log-odds: {stump.rightVal >= 0 ? "+" : ""}{stump.rightVal.toFixed(3)}
          </text>
          <text x={rightX} y={childY + 13} textAnchor="middle"
            fontSize="9.5" fill={stump.rightVal >= 0 ? SPAM_COL : HAM_COL}>
            {stump.rightVal >= 0 ? "push P(spam) UP" : "push P(spam) DOWN"}
          </text>
        </>
      );
    }

    // ── helper: probability evolution mini panel ──
    function ProbPanel({ treeIdx, sectionY, probsBefore, probsAfter }) {
      const col = TREE_COLORS[treeIdx];
      const PX  = 546;
      const PY2 = sectionY + 4;
      const barMaxH = 100;
      const barW    = 24;
      const barSpacing = 296 / data.length;

      return (
        <>
          <rect x={PX} y={PY2} width={296} height={148} rx="8"
            fill="white" stroke={col} strokeWidth="1.2" opacity="0.85" />
          <text x={PX + 148} y={PY2 + 16} textAnchor="middle"
            fontSize="11" fontWeight="700" fill={col}>P(spam) before → after</text>
          {/* 0.5 threshold dashed line */}
          <line x1={PX + 8} y1={PY2 + 16 + (1 - 0.5) * barMaxH}
            x2={PX + 288} y2={PY2 + 16 + (1 - 0.5) * barMaxH}
            stroke="#aaa" strokeWidth="0.8" strokeDasharray="3 2" />
          <text x={PX + 292} y={PY2 + 16 + (1 - 0.5) * barMaxH + 4}
            fontSize="8" fill="#aaa">0.5</text>
          {data.map((d, i) => {
            const bx    = PX + 12 + i * barSpacing;
            const pb    = probsBefore[i];
            const pa    = probsAfter[i];
            const isSpam = d[2] === 1;
            const correct = (pa >= 0.5) === isSpam;
            const dotCol = correct ? "#1f9e6b" : "#e0492e";
            const barH = Math.max(3, pa * barMaxH);
            return (
              <g key={i}>
                {/* before dot */}
                <circle cx={bx + barW / 2} cy={PY2 + 16 + (1 - pb) * barMaxH}
                  r="3" fill="#bbb" opacity="0.7" />
                {/* after bar */}
                <rect x={bx} y={PY2 + 16 + barMaxH - barH}
                  width={barW} height={barH}
                  fill={isSpam ? SPAM_COL : HAM_COL}
                  rx="2" opacity={correct ? 0.8 : 0.4} />
                {/* arrow from before to after */}
                <line x1={bx + barW / 2} y1={PY2 + 16 + (1 - pb) * barMaxH}
                  x2={bx + barW / 2} y2={PY2 + 16 + barMaxH - barH}
                  stroke={dotCol} strokeWidth="1" opacity="0.6"
                  markerEnd="url(#arr)" />
                {/* email index label */}
                <text x={bx + barW / 2} y={PY2 + 132} textAnchor="middle"
                  fontSize="8.5" fill={isSpam ? SPAM_COL : HAM_COL} fontWeight="700">
                  {isSpam ? "S" : "H"}
                </text>
                {/* P value above bar */}
                <text x={bx + barW / 2} y={PY2 + 14 + barMaxH - barH}
                  textAnchor="middle" fontSize="8" fill={dotCol} fontWeight="600">
                  {pa.toFixed(2)}
                </text>
              </g>
            );
          })}
        </>
      );
    }

    // ── helper: pseudo-residual shrink band ──
    function PseudoBand({ topY, residBefore, residAfter, labelAfter, col }) {
      const BAR_AREA_X = 30;
      const BAR_AREA_W = 500;
      const nPts = residBefore.length;
      const barW = 22;
      const barSpacing = BAR_AREA_W / nPts;
      const maxAbs = Math.max(...residBefore.map(Math.abs), 0.1);
      const barMaxH = 24;

      const barX = (i) => BAR_AREA_X + i * barSpacing + (barSpacing - barW) / 2;
      const barH = (r, ref) => Math.max(2, (Math.abs(r) / ref) * barMaxH);

      return (
        <>
          <text x={BAR_AREA_X + 4} y={topY + 14}
            fontSize="10.5" fontWeight="700" fill="#555">Pseudo-residuals before (grayed):</text>
          {residBefore.map((r, i) => (
            <rect key={i}
              x={barX(i)} y={topY + 18 - barH(r, maxAbs)}
              width={barW} height={barH(r, maxAbs)}
              fill={r >= 0 ? SPAM_COL : HAM_COL} rx="2" opacity="0.25" />
          ))}
          <text x={BAR_AREA_X + BAR_AREA_W / 2} y={topY + 34}
            textAnchor="middle" fontSize="11" fill={col} fontWeight="700">
            ↓ pseudo-residuals shrink: y − P̂ is smaller when P̂ is closer to y
          </text>
          <text x={BAR_AREA_X + 4} y={topY + 48}
            fontSize="10.5" fontWeight="700" fill="#555">{labelAfter}</text>
          {residAfter.map((r, i) => (
            <rect key={i}
              x={barX(i)} y={topY + 52 - barH(r, maxAbs)}
              width={barW} height={barH(r, maxAbs)}
              fill={r >= 0 ? SPAM_COL : HAM_COL} rx="2" opacity="0.75" />
          ))}
          {data.map((d, i) => (
            <text key={i} x={barX(i) + barW / 2} y={topY + 62}
              textAnchor="middle" fontSize="8.5"
              fill={d[2] === 1 ? SPAM_COL : HAM_COL} fontWeight="600">
              {d[2] === 1 ? "S" : "H"}
            </text>
          ))}
        </>
      );
    }

    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: "100%", maxWidth: SVG_W, display: "block", fontFamily: "var(--ui-font)" }}>

        {/* arrow marker def */}
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#888" opacity="0.6" />
          </marker>
        </defs>

        {/* ── TREE 1 ── */}
        <Stump treeIdx={0} sectionY={T1_Y} stump={s1} splitLabel={splitLabels[0]} />
        <ProbPanel treeIdx={0} sectionY={T1_Y} probsBefore={p0} probsAfter={p1} />

        {/* ── PSEUDO-RESIDUAL BAND 1 ── */}
        <rect x={20} y={P1_Y} width={820} height={68} rx="8"
          fill="rgba(148,162,188,.06)" stroke="var(--line)" strokeWidth="1" />
        <PseudoBand topY={P1_Y + 4} residBefore={r0} residAfter={r1}
          labelAfter="After Round 1 (smaller magnitudes):" col={TREE_COLORS[0]} />

        {/* ── TREE 2 ── */}
        <Stump treeIdx={1} sectionY={T2_Y} stump={s2} splitLabel={splitLabels[1]} />
        <ProbPanel treeIdx={1} sectionY={T2_Y} probsBefore={p1} probsAfter={p2} />

        {/* ── PSEUDO-RESIDUAL BAND 2 ── */}
        <rect x={20} y={P2_Y} width={820} height={68} rx="8"
          fill="rgba(148,162,188,.06)" stroke="var(--line)" strokeWidth="1" />
        <PseudoBand topY={P2_Y + 4} residBefore={r1} residAfter={r2}
          labelAfter="After Round 2 (even smaller):" col={TREE_COLORS[1]} />

        {/* ── TREE 3 ── */}
        <Stump treeIdx={2} sectionY={T3_Y} stump={s3} splitLabel={splitLabels[2]} />
        <ProbPanel treeIdx={2} sectionY={T3_Y} probsBefore={p2} probsAfter={p3} />

        {/* ── FINAL FORMULA ── */}
        <rect x={20} y={FIN_Y} width={820} height={44} rx="10"
          fill="rgba(43,91,255,.06)" stroke="#2b5bff" strokeWidth="2" />
        <text x={430} y={FIN_Y + 19} textAnchor="middle"
          fontSize="14" fontWeight="800" fill="#2b5bff">
          F(x) = F₀ + η·T₁(x) + η·T₂(x) + η·T₃(x) → P(spam) = σ(F(x))
        </text>
        <text x={430} y={FIN_Y + 37} textAnchor="middle"
          fontSize="11" fill="#555">
          Log-loss: 0.6931 → 0.4981 → 0.4714 → 0.4606 &nbsp;|&nbsp; Leaf magnitudes shrink: 0.875 → 0.3 → 0.15
        </text>
      </svg>
    );
  }

  const stageSeqTrees = {
    id: "seq-trees", group: "Training",
    title: "3 Sequential Stumps — Probabilities Sharpen Each Round",
    map: "Seq Trees",
    why: "Seeing all 3 trees laid out sequentially — with the pseudo-residuals flowing between them — makes the 'student studying wrong answers' analogy concrete and visual.",
    render: () => (
      <>
        <Lead>
          Each tree in gradient boosting classification sees a <b>different target</b>: the
          pseudo-residuals from the previous round. Tree 1 sees large pseudo-residuals
          (±0.5) — everyone starts at P(spam) = 0.5. It makes big log-odds updates (±0.875),
          splitting on <b>word_count ≤ 0.55</b>. After Round 1, probabilities spread apart.
          Tree 2 and Tree 3 make progressively smaller corrections as the model converges.
        </Lead>
        <Lead>
          The right-side panels for each tree show the probabilities <b>before (gray dots) and
          after (colored bars)</b> that round. Green/red bars = ham/spam emails. Faded bars =
          currently misclassified (P on wrong side of 0.5). Watch the bars spread toward 0
          and 1 across the three rounds.
        </Lead>
        <SeqTreesClsSVG />
        <Note>
          The leaf values shrink automatically each round: 0.875 (Tree 1) → 0.3 (Tree 2)
          → 0.15 (Tree 3). This happens because pseudo-residuals shrink when the model's
          probability estimates improve. No hyperparameter controls this — it is a natural
          consequence of fitting residuals of residuals.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 6b: Boost Animation (Classification)
  // ────────────────────────────────────────────────────────

  // Hardcoded trace data derived from BOOST_CLS / ml-boosting.js
  const ANIM_CLS = {
    data: [
      [0.2, 0, 0],[0.3, 0, 0],[0.5, 0, 0],[0.4, 1, 0],
      [0.6, 1, 1],[0.8, 1, 1],[0.7, 0, 1],[0.9, 1, 1],
    ],
    ys: [0, 0, 0, 0, 1, 1, 1, 1],
    initLogOdds: 0.0,
    initProb: 0.5,
    // probs[round][pointIdx]
    probs: [
      [0.5000, 0.5000, 0.5000, 0.5000, 0.5000, 0.5000, 0.5000, 0.5000],
      [0.3923, 0.3923, 0.3923, 0.3923, 0.6077, 0.6077, 0.6077, 0.6077],
      [0.3572, 0.3572, 0.3572, 0.4286, 0.6428, 0.6428, 0.5714, 0.6428],
      [0.3402, 0.3402, 0.3688, 0.4409, 0.6542, 0.6542, 0.5836, 0.6542],
    ],
    pseudoResiduals: [
      [-0.5000, -0.5000, -0.5000, -0.5000,  0.5000,  0.5000,  0.5000,  0.5000],
      [-0.3923, -0.3923, -0.3923, -0.3923,  0.3923,  0.3923,  0.3923,  0.3923],
      [-0.3572, -0.3572, -0.3572, -0.4286,  0.3572,  0.3572,  0.4286,  0.3572],
      [-0.3402, -0.3402, -0.3688, -0.4409,  0.3458,  0.3458,  0.4164,  0.3458],
    ],
    losses: [0.6931, 0.4981, 0.4714, 0.4606],
    stumps: [
      { feature: 0, threshold: 0.55, leftVal: -0.875, rightVal:  0.875, label: 'word_count ≤ 0.55' },
      { feature: 1, threshold: 0.5,  leftVal: -0.3,   rightVal:  0.3,   label: 'has_link ≤ 0.5' },
      { feature: 0, threshold: 0.35, leftVal: -0.15,  rightVal:  0.1,   label: 'word_count ≤ 0.35' },
    ],
    labels: ['ham', 'ham', 'ham', 'ham', 'spam', 'spam', 'spam', 'spam'],
    // Decision boundary x for word_count (threshold of stump 1) shown in left panel
    boundary: [0.55, 0.55, 0.55, 0.35],
  };

  function BoostingClsAnim() {
    const [phase, setPhase] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1200);
    const MAX_PHASE = 8;

    useEffect(() => {
      if (!playing || phase >= MAX_PHASE) { setPlaying(false); return; }
      const t = setTimeout(() => setPhase(p => p + 1), speed);
      return () => clearTimeout(t);
    }, [playing, phase, speed]);

    // Map phase → round data index
    // 0: init probs, 1: pseudo-residuals, 2: stump1, 3: after round1,
    // 4: pseudo-resid2, 5: stump2+3, 6: after round2+3, 7: final, 8: boundary
    const roundForPhase = [0, 0, 0, 1, 1, 2, 3, 3, 3];
    const roundIdx = roundForPhase[phase] || 0;
    const curProbs = ANIM_CLS.probs[roundIdx];
    const curResids = ANIM_CLS.pseudoResiduals[roundIdx];
    const curLoss = ANIM_CLS.losses[roundIdx];
    const initLoss = ANIM_CLS.losses[0];
    const finalLoss = ANIM_CLS.losses[3];

    // SVG layout
    const TW = 860, TH = 480;
    const PW = 260, PH = 380;
    const PY = 60;
    const P1X = 20, P2X = 300, P3X = 580;
    const CL = 44, CR = 10, CT = 30, CB = 40;
    const CW = PW - CL - CR, CH = PH - CT - CB;

    // Scatter plot coords (word_count × has_link)
    const ssx = (v, ox) => ox + CL + v * CW;
    const ssy = (v) => PY + CT + (1 - v) * CH;

    // Prob bar panel: bar per email, y from 0 to 1
    const barW2 = Math.max(8, CW / ANIM_CLS.data.length - 4);
    const prx = (i, ox) => ox + CL + (i + 0.5) * (CW / ANIM_CLS.data.length);
    const pry0 = PY + CT + CH; // y=0
    const pry1 = PY + CT;      // y=1
    const prH = (p) => Math.abs(p) * CH;

    // Whether we show pseudo-residuals instead of probs in middle panel
    const showPseudoResid = phase === 1 || phase === 4;
    const rMin = -1, rMax = 1;
    const rry = (v) => PY + CT + (1 - (v - rMin) / (rMax - rMin)) * CH;

    // Active stump for right panel
    const stumpPhaseMap = [null, null, 0, 0, 1, 1, 2, null, null];
    const activeStumpIdx = stumpPhaseMap[phase];
    const activeStump = activeStumpIdx !== null ? ANIM_CLS.stumps[activeStumpIdx] : null;

    // Phase descriptions
    const phaseDescs = [
      "Phase 0 — All probabilities start at 0.5. F₀ = 0 (log-odds). No class separation yet.",
      "Phase 1 — Computing pseudo-residuals: spam emails push P up (+0.5), ham emails push P down (−0.5).",
      "Phase 2 — Stump 1 is being learned. Best split: word_count ≤ 0.55 separates most emails.",
      "Phase 3 — After Round 1: spam probs rise to 0.61, ham probs fall to 0.39. Log-loss: 0.693 → 0.498.",
      "Phase 4 — New pseudo-residuals computed. Magnitude shrinks — the model is improving.",
      "Phase 5 — Stumps 2 & 3 target finer details: has_link and very-short-email patterns.",
      "Phase 6 — After 3 rounds: probabilities sharpen. Most emails clearly lean toward correct class.",
      "Phase 7 — Final state: confident predictions (closer to 0 or 1). Log-loss: 0.693 → 0.461.",
      "Phase 8 — Decision boundary: bold line at word_count = 0.55. Misclassified points marked ✗.",
    ];

    // Log-loss progress bar
    const lossPct = Math.max(0, Math.min(100,
      ((initLoss - curLoss) / (initLoss - finalLoss)) * 100
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
          <button style={btnStyle(false)} onClick={() => { setPhase(0); setPlaying(false); }}>⟳ Reset</button>
          <button style={btnStyle(false)} onClick={() => setPhase(p => Math.max(0, p - 1))}>← Prev</button>
          <button style={btnStyle(false)} onClick={() => setPhase(p => Math.min(MAX_PHASE, p + 1))}>Next →</button>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>
            Phase {phase + 1} of {MAX_PHASE + 1}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>Speed:</span>
          {[[2000, 'Slow'], [1200, 'Normal'], [600, 'Fast']].map(([ms, lbl]) => (
            <button key={ms} style={btnStyle(speed === ms)} onClick={() => setSpeed(ms)}>{lbl}</button>
          ))}
        </div>

        {/* Log-Loss Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>Log-Loss progress</span>
          <div style={{ flex: 1, background: 'var(--line-soft)', borderRadius: 6, height: 14, overflow: 'hidden', maxWidth: 400 }}>
            <div style={{
              height: '100%', borderRadius: 6,
              width: `${lossPct}%`,
              background: `hsl(${130 + lossPct * 0.5}, 60%, 42%)`,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <span style={{ fontSize: 12, fontFamily: 'var(--num-font)', color: 'var(--ink)', flexShrink: 0, minWidth: 100 }}>
            Log-Loss = {curLoss.toFixed(4)}
          </span>
        </div>

        {/* Main SVG — 3 panels */}
        <svg viewBox={`0 0 ${TW} ${TH}`} style={{ width: '100%', maxWidth: TW, display: 'block' }}>
          {/* Panel backgrounds */}
          {[P1X, P2X, P3X].map((ox, pi) => (
            <rect key={pi} x={ox} y={PY - 10} width={PW} height={PH + 20}
              rx="8" fill="var(--panel-solid)" stroke="var(--line)" strokeWidth="1" opacity="0.6" />
          ))}

          {/* ─── Panel 1: Scatter plot with decision boundary ─── */}
          {/* Axes */}
          <line x1={ssx(0, P1X)} y1={ssy(0)} x2={ssx(1, P1X)} y2={ssy(0)} stroke="var(--line)" strokeWidth="1.2" />
          <line x1={ssx(0, P1X)} y1={ssy(0)} x2={ssx(0, P1X)} y2={ssy(1)} stroke="var(--line)" strokeWidth="1.2" />
          {[0, 0.25, 0.5, 0.75, 1.0].map(v => (
            <g key={v}>
              <text x={ssx(v, P1X)} y={ssy(0) + 14} textAnchor="middle" fontSize="9" fill="var(--muted)">{v.toFixed(2)}</text>
            </g>
          ))}
          {[0, 0.5, 1.0].map(v => (
            <g key={v}>
              <text x={ssx(0, P1X) - 5} y={ssy(v) + 4} textAnchor="end" fontSize="9" fill="var(--muted)">{v.toFixed(1)}</text>
            </g>
          ))}
          <text x={P1X + PW / 2} y={PY + PH + 16} textAnchor="middle" fontSize="10" fill="var(--muted)">word_count</text>
          <text x={P1X + 10} y={PY + PH / 2} textAnchor="middle" fontSize="10" fill="var(--muted)"
            transform={`rotate(-90,${P1X + 10},${PY + PH / 2})`}>has_link</text>

          {/* Panel 1 title */}
          <text x={P1X + PW / 2} y={PY - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">
            {phase === 0 ? 'Initial: P(spam) = 0.5 for all' : phase >= 8 ? 'Final decision boundary' : `After Round ${roundIdx}`}
          </text>

          {/* Decision boundary line */}
          {phase >= 3 && (
            <line
              x1={ssx(ANIM_CLS.stumps[0].threshold, P1X)}
              y1={ssy(0)}
              x2={ssx(ANIM_CLS.stumps[0].threshold, P1X)}
              y2={ssy(1)}
              stroke={phase >= 8 ? '#2B5BFF' : 'var(--accent)'}
              strokeWidth={phase >= 8 ? 3 : 1.5}
              strokeDasharray={phase >= 8 ? '' : '5 3'}
              opacity={phase >= 8 ? 1 : 0.6}
            />
          )}
          {phase >= 8 && (
            <text x={ssx(ANIM_CLS.stumps[0].threshold, P1X) + 4} y={PY + CT + 12}
              fontSize="10" fill="#2B5BFF" fontWeight="700">
              boundary
            </text>
          )}

          {/* Data points */}
          {ANIM_CLS.data.map((d, i) => {
            const predicted = phase >= 3 ? (curProbs[i] >= 0.5 ? 1 : 0) : null;
            const correct = predicted !== null ? predicted === d[2] : true;
            return (
              <g key={i}>
                <circle
                  cx={ssx(d[0], P1X)}
                  cy={ssy(d[1])}
                  r="7"
                  fill={d[2] === 1 ? SPAM_COL : HAM_COL}
                  stroke={phase >= 8 && !correct ? '#333' : 'white'}
                  strokeWidth={phase >= 8 && !correct ? 2.5 : 1.5}
                  opacity="0.9"
                />
                {phase >= 8 && (
                  <text x={ssx(d[0], P1X) + 9} y={ssy(d[1]) + 4} fontSize="11" fill={correct ? '#1f9e6b' : '#e0492e'} fontWeight="700">
                    {correct ? '✓' : '✗'}
                  </text>
                )}
                {phase >= 3 && phase < 8 && (
                  <text x={ssx(d[0], P1X) + 9} y={ssy(d[1]) - 2} fontSize="9" fill="var(--muted)">
                    {curProbs[i].toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}

          {/* ─── Panel 2: Probability or pseudo-residual bars ─── */}
          {/* Panel 2 title + log-loss counter */}
          <text x={P2X + PW / 2} y={PY - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">
            {showPseudoResid ? 'Pseudo-residuals = y − P̂' : 'P(spam) probability bars'}
          </text>
          <text x={P2X + PW / 2} y={PY - 2} textAnchor="middle" fontSize="10"
            fill={phase >= 3 ? '#1f9e6b' : 'var(--muted)'}>
            Log-Loss = {curLoss.toFixed(4)}
          </text>

          {showPseudoResid ? (
            <>
              {/* Zero line */}
              <line x1={P2X + CL} y1={rry(0)} x2={P2X + PW - CR} y2={rry(0)} stroke="var(--ink)" strokeWidth="1.5" />
              {/* y-axis ticks */}
              {[-1, -0.5, 0, 0.5, 1].map(v => (
                <g key={v}>
                  <line x1={P2X + CL - 3} y1={rry(v)} x2={P2X + CL} y2={rry(v)} stroke="var(--line)" strokeWidth="1" />
                  <text x={P2X + CL - 5} y={rry(v) + 4} textAnchor="end" fontSize="9" fill="var(--muted)">{v.toFixed(1)}</text>
                </g>
              ))}
              {/* Pseudo-residual bars */}
              {curResids.map((r, i) => {
                const barTop = rry(Math.max(0, r));
                const barBot = rry(Math.min(0, r));
                const barH2 = Math.max(1, Math.abs(barBot - barTop));
                return (
                  <g key={i}>
                    <rect
                      x={prx(i, P2X) - barW2 / 2}
                      y={barTop}
                      width={barW2}
                      height={barH2}
                      fill={r >= 0 ? SPAM_COL : HAM_COL}
                      rx="2"
                      opacity="0.8"
                      style={{ transition: 'height 0.5s ease, y 0.5s ease' }}
                    />
                    <text x={prx(i, P2X)} y={pry0 + 14} textAnchor="middle" fontSize="9" fill="var(--muted)">{i + 1}</text>
                  </g>
                );
              })}
              <text x={P2X + CL - 5} y={rry(0) + 14} textAnchor="end" fontSize="9" fill="var(--muted)">0</text>
            </>
          ) : (
            <>
              {/* y=0 and y=1 lines */}
              <line x1={P2X + CL} y1={pry0} x2={P2X + PW - CR} y2={pry0} stroke="var(--line)" strokeWidth="1.2" />
              <line x1={P2X + CL} y1={pry1} x2={P2X + PW - CR} y2={pry1} stroke="var(--line)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
              {/* Decision threshold line */}
              <line x1={P2X + CL} y1={pry0 - CH / 2} x2={P2X + PW - CR} y2={pry0 - CH / 2}
                stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <text x={P2X + PW - CR} y={pry0 - CH / 2 - 3} textAnchor="end" fontSize="9" fill="var(--accent)">0.5 threshold</text>
              {/* y-axis */}
              {[0, 0.25, 0.5, 0.75, 1.0].map(v => (
                <g key={v}>
                  <text x={P2X + CL - 5} y={pry0 - v * CH + 4} textAnchor="end" fontSize="9" fill="var(--muted)">{v.toFixed(2)}</text>
                  <line x1={P2X + CL - 3} y1={pry0 - v * CH} x2={P2X + CL} y2={pry0 - v * CH} stroke="var(--line)" strokeWidth="1" />
                </g>
              ))}
              {/* Probability bars */}
              {curProbs.map((p, i) => {
                const barH3 = p * CH;
                const isSpam = ANIM_CLS.ys[i] === 1;
                const correct = (p >= 0.5) === isSpam;
                return (
                  <g key={i}>
                    <rect
                      x={prx(i, P2X) - barW2 / 2}
                      y={pry0 - barH3}
                      width={barW2}
                      height={Math.max(1, barH3)}
                      fill={p >= 0.5 ? SPAM_COL : HAM_COL}
                      rx="2"
                      opacity={correct ? 0.85 : 0.5}
                      style={{ transition: 'height 0.5s ease, y 0.5s ease' }}
                    />
                    <text x={prx(i, P2X)} y={pry0 + 14} textAnchor="middle" fontSize="9"
                      fill={isSpam ? SPAM_COL : HAM_COL} fontWeight="700">
                      {isSpam ? 'S' : 'H'}
                    </text>
                    <text x={prx(i, P2X)} y={pry0 - barH3 - 3} textAnchor="middle" fontSize="8" fill="var(--muted)">
                      {p.toFixed(2)}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* ─── Panel 3: Stump structure ─── */}
          {/* Panel 3 title */}
          <text x={P3X + PW / 2} y={PY - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">
            {phase === 0 ? 'No tree yet'
              : phase === 1 ? 'Computing pseudo-residuals'
              : activeStump ? `Stump ${activeStumpIdx + 1}: ${activeStump.label}`
              : phase >= 7 ? 'All 3 stumps ensemble'
              : 'Stumps learned so far'}
          </text>

          {/* Phase 0: empty placeholder */}
          {phase === 0 && (
            <>
              <rect x={P3X + 30} y={PY + 40} width={PW - 60} height={PH - 80} rx="8"
                fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="6 4" opacity="0.4" />
              <text x={P3X + PW / 2} y={PY + PH / 2 - 10} textAnchor="middle" fontSize="13" fill="var(--faint)">
                Tree 1
              </text>
              <text x={P3X + PW / 2} y={PY + PH / 2 + 8} textAnchor="middle" fontSize="11" fill="var(--faint)">
                not yet trained
              </text>
            </>
          )}

          {/* Phase 1: pseudo-residual formula */}
          {phase === 1 && (
            <>
              <rect x={P3X + 20} y={PY + 40} width={PW - 40} height={60} rx="8"
                fill="rgba(245,158,11,.12)" stroke="#f59e0b" strokeWidth="1.5" />
              <text x={P3X + PW / 2} y={PY + 68} textAnchor="middle" fontSize="12" fill="var(--ink)">
                r = y − P̂
              </text>
              <text x={P3X + PW / 2} y={PY + 88} textAnchor="middle" fontSize="10" fill="var(--muted)">
                spam (y=1): 1 − 0.5 = +0.5
              </text>
              <text x={P3X + PW / 2} y={PY + 108} textAnchor="middle" fontSize="10" fill="var(--muted)">
                ham (y=0): 0 − 0.5 = −0.5
              </text>
              <text x={P3X + PW / 2} y={PY + 140} textAnchor="middle" fontSize="11" fill="var(--ink)" fontWeight="700">
                All equal magnitude:
              </text>
              <text x={P3X + PW / 2} y={PY + 158} textAnchor="middle" fontSize="11" fill="var(--muted)">
                +0.5 for spam, −0.5 for ham
              </text>
              <text x={P3X + PW / 2} y={PY + 180} textAnchor="middle" fontSize="10" fill="var(--muted)">
                Tree 1 will learn this pattern
              </text>
            </>
          )}

          {/* Active single stump (phases 2, 3, 4, 5) */}
          {activeStump && (() => {
            const midX = P3X + PW / 2;
            const rootY = PY + 60;
            const childY = PY + 160;
            const leftX = P3X + 65;
            const rightX = P3X + PW - 65;
            const feat = ANIM_CLS.stumps[activeStumpIdx].label;
            return (
              <>
                <line x1={midX} y1={rootY + 16} x2={leftX} y2={childY - 16} stroke="var(--line)" strokeWidth="1.5" />
                <line x1={midX} y1={rootY + 16} x2={rightX} y2={childY - 16} stroke="var(--line)" strokeWidth="1.5" />
                <text x={(midX + leftX) / 2 - 8} y={(rootY + childY) / 2} fontSize="10" fill="var(--muted)" fontStyle="italic">yes</text>
                <text x={(midX + rightX) / 2 + 10} y={(rootY + childY) / 2} fontSize="10" fill="var(--muted)" fontStyle="italic">no</text>
                <rect x={midX - 78} y={rootY - 18} width={156} height={36} rx="8"
                  fill="var(--panel-solid)" stroke="var(--accent)" strokeWidth="2" />
                <text x={midX} y={rootY + 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">
                  {activeStump.label}?
                </text>
                <rect x={leftX - 38} y={childY - 16} width={76} height={32} rx="8"
                  fill={activeStump.leftVal >= 0 ? 'rgba(224,73,46,.12)' : 'rgba(31,158,107,.12)'}
                  stroke={activeStump.leftVal >= 0 ? SPAM_COL : HAM_COL} strokeWidth="1.5" />
                <text x={leftX} y={childY - 1} textAnchor="middle" fontSize="11" fontWeight="700"
                  fill={activeStump.leftVal >= 0 ? SPAM_COL : HAM_COL}>
                  {activeStump.leftVal.toFixed(3)}
                </text>
                <text x={leftX} y={childY + 13} textAnchor="middle" fontSize="9" fill="var(--muted)">
                  {activeStump.leftVal >= 0 ? '→ spam signal' : '→ ham signal'}
                </text>
                <rect x={rightX - 38} y={childY - 16} width={76} height={32} rx="8"
                  fill={activeStump.rightVal >= 0 ? 'rgba(224,73,46,.12)' : 'rgba(31,158,107,.12)'}
                  stroke={activeStump.rightVal >= 0 ? SPAM_COL : HAM_COL} strokeWidth="1.5" />
                <text x={rightX} y={childY - 1} textAnchor="middle" fontSize="11" fontWeight="700"
                  fill={activeStump.rightVal >= 0 ? SPAM_COL : HAM_COL}>
                  {activeStump.rightVal.toFixed(3)}
                </text>
                <text x={rightX} y={childY + 13} textAnchor="middle" fontSize="9" fill="var(--muted)">
                  {activeStump.rightVal >= 0 ? '→ spam signal' : '→ ham signal'}
                </text>
                {/* Loss reduction below stump */}
                {phase >= 3 && (
                  <>
                    <text x={midX} y={childY + 52} textAnchor="middle" fontSize="10" fill="var(--muted)">
                      Loss after T{activeStumpIdx + 1}: {ANIM_CLS.losses[activeStumpIdx + 1].toFixed(4)}
                    </text>
                    <text x={midX} y={childY + 66} textAnchor="middle" fontSize="10" fill="#1f9e6b">
                      ↓ {((1 - ANIM_CLS.losses[activeStumpIdx + 1] / ANIM_CLS.losses[0]) * 100).toFixed(1)}% reduction
                    </text>
                  </>
                )}
              </>
            );
          })()}

          {/* Phase 7-8: all 3 stumps stacked compact */}
          {(phase === 7 || phase === 8) && (
            <>
              {ANIM_CLS.stumps.map((s, t) => {
                const sy0 = PY + 20 + t * 110;
                const smidX = P3X + PW / 2;
                return (
                  <g key={t}>
                    <rect x={smidX - 68} y={sy0} width={136} height={26} rx="6"
                      fill="var(--panel-solid)" stroke="var(--accent)" strokeWidth="1.5" />
                    <text x={smidX} y={sy0 + 13} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink)">
                      T{t + 1}: {s.label}
                    </text>
                    <line x1={smidX} y1={sy0 + 26} x2={smidX - 28} y2={sy0 + 46} stroke="var(--line)" strokeWidth="1" />
                    <line x1={smidX} y1={sy0 + 26} x2={smidX + 28} y2={sy0 + 46} stroke="var(--line)" strokeWidth="1" />
                    <text x={smidX - 28} y={sy0 + 58} textAnchor="middle" fontSize="10" fontWeight="700"
                      fill={s.leftVal >= 0 ? SPAM_COL : HAM_COL}>
                      {s.leftVal > 0 ? '+' : ''}{s.leftVal.toFixed(3)}
                    </text>
                    <text x={smidX + 28} y={sy0 + 58} textAnchor="middle" fontSize="10" fontWeight="700"
                      fill={s.rightVal >= 0 ? SPAM_COL : HAM_COL}>
                      {s.rightVal > 0 ? '+' : ''}{s.rightVal.toFixed(3)}
                    </text>
                  </g>
                );
              })}
              <text x={P3X + PW / 2} y={PY + 370} textAnchor="middle" fontSize="11" fill="var(--ink)" fontWeight="700">
                Log-Loss: {ANIM_CLS.losses[0].toFixed(4)} → {ANIM_CLS.losses[3].toFixed(4)}
              </text>
              <text x={P3X + PW / 2} y={PY + 388} textAnchor="middle" fontSize="10" fill="var(--muted)">
                ({((1 - ANIM_CLS.losses[3] / ANIM_CLS.losses[0]) * 100).toFixed(1)}% reduction)
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

  const stageBoostClsAnim = {
    id: "boost-animation", group: "Training", title: "Watch Probabilities Sharpen — Animated",
    map: "Boost Animation",
    why: "This animation shows HOW classification boosting works: each stump adjusts log-odds, pseudo-residuals shrink each round, and probability bars visibly sharpen toward 0 or 1.",
    render: () => <BoostingClsAnim />,
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 7: Full Ensemble & Prediction
  // ────────────────────────────────────────────────────────
  const stageEnsemble = {
    id: "ensemble", group: "Boosting", title: "Full ensemble — F(x) = F₀ + Σ η·Tₜ(x) → P(spam)",
    map: "Ensemble",
    why: "The ensemble produces log-odds, which convert to probability via sigmoid, then threshold to class. Use the sliders to classify any new email.",
    render: (trace, ctx) => {
      const { input, setInput } = ctx;
      const qp = trace.queryProb;
      const ql = trace.queryLabel;
      return (
        <>
          <Lead>
            For a new email, we sum all tree predictions in log-odds space, then apply
            sigmoid to get P(spam). If P(spam) ≥ 0.5, we predict spam; otherwise ham.
            The key insight: we never add probabilities directly — we add log-odds and
            convert at the end. Log-odds are real numbers that add linearly; probabilities
            do not (0.7 + 0.7 = 1.4, which is not a valid probability).
          </Lead>

          <Formula label="Ensemble (log-odds)">
            F(x) = F₀ + η·T₁(x) + η·T₂(x) + η·T₃(x)
          </Formula>
          <Formula label="Final probability">
            P(spam|x) = σ(F(x)) = 1 / (1 + exp(−F(x)))
          </Formula>

          <div className="nn-calc" style={{ marginBottom: 14 }}>
            <div className="nn-calc-h">Prediction for word_count={input.f0.toFixed(2)}, has_link={input.f1} ({input.nTrees} tree(s))</div>
            <div className="nn-calc-row">F₀ = {fmt(trace.initLogOdds, 3)} (initial log-odds)</div>
            {BOOST_CLS.stumps.slice(0, input.nTrees).map((stump, t) => {
              const x = stump.feature === 0 ? input.f0 : input.f1;
              const val = x <= stump.threshold ? stump.leftVal : stump.rightVal;
              const leaf = x <= stump.threshold ? "left" : "right";
              const featName = BOOST_CLS.features[stump.feature];
              return (
                <div key={t} className="nn-calc-row">
                  + η·T{t+1}({featName}={fmt(x, 2)}) = {BOOST_CLS.eta}×{fmt(val, 3)} ({leaf}) = <b>{fmt(BOOST_CLS.eta * val, 3)}</b>
                </div>
              );
            })}
            <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 4 }}>
              Total log-odds F = <b>{fmt(trace.queryLogOdds, 3)}</b>
            </div>
            <div className="nn-calc-row">
              P(spam) = σ({fmt(trace.queryLogOdds, 3)}) = <b className="nn-calc-res">{fmt(qp, 4)}</b>
            </div>
            <div className="nn-calc-row">
              {fmt(qp, 3)} {qp >= 0.5 ? "≥" : "<"} 0.5 →{" "}
              <b style={{ color: clsColor(ql) }}>predict {clsName(ql).toUpperCase()}</b>
            </div>
          </div>

          <div style={{
            marginBottom: 16, padding: "14px 16px", borderRadius: 10,
            background: clsBg(ql), border: `2px solid ${clsColor(ql)}44`
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: clsColor(ql) }}>
              Prediction: {clsName(ql).toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              Confidence: {(Math.max(qp, 1 - qp) * 100).toFixed(1)}% | Training accuracy: {(trace.accuracy * 100).toFixed(0)}%
            </div>
          </div>

          <ProbBars ham={1 - qp} spam={qp} />

          <div className="tf-subhead" style={{ marginTop: 14 }}>All training predictions</div>
          <ClsScatter probs={trace.rounds[trace.rounds.length - 1].probs} title="" />
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 8: Log-Loss Deep Dive
  // ────────────────────────────────────────────────────────
  const stageLogLoss = {
    id: "logloss", group: "Concepts", title: "Log-loss — why confident wrong predictions are catastrophic",
    map: "Log-Loss",
    why: "Log-loss penalizes confident wrong predictions enormously. Understanding this explains why probability calibration matters and why log-loss is the right loss for classification.",
    render: () => {
      // draw log-loss curves
      const lx = p => 44 + p * 290;
      const ly = v => 14 + Math.min(160, (v / 5.5) * 160);
      const pts0 = [], pts1 = [];
      for (let i = 1; i <= 99; i++) {
        const p = i / 100;
        pts0.push(`${lx(p)},${ly(-Math.log(1 - p))}`);  // y=0 curve
        pts1.push(`${lx(p)},${ly(-Math.log(p))}`);       // y=1 curve
      }

      // detailed loss table
      const lossExamples = [
        { y: 1, p: 0.99, desc: "spam, very confident correct" },
        { y: 1, p: 0.80, desc: "spam, confident correct" },
        { y: 1, p: 0.50, desc: "spam, uncertain" },
        { y: 1, p: 0.20, desc: "spam, wrong" },
        { y: 1, p: 0.01, desc: "spam, very confident WRONG" },
        { y: 0, p: 0.01, desc: "ham, very confident correct" },
        { y: 0, p: 0.50, desc: "ham, uncertain" },
        { y: 0, p: 0.99, desc: "ham, very confident WRONG" },
      ];

      return (
        <>
          <Lead>
            <b>Log-loss</b> (also called binary cross-entropy) is defined as
            L = −[y·log(p) + (1−y)·log(1−p)]. The crucial property: when you confidently
            predict the wrong class, the loss is astronomically large. If you predict P(spam)=0.99
            for a ham email: L = −log(1−0.99) = −log(0.01) = 4.6. If you predict P(spam)=0.999:
            L = −log(0.001) = 6.9. The logarithm grows without bound as p → 0 or p → 1
            in the wrong direction.
          </Lead>
          <Lead>
            This extreme penalty forces the model to be <b>well-calibrated</b>: it cannot just
            assign probabilities of 0.99 everywhere and be done. Each confident prediction that
            turns out to be wrong creates a massive pseudo-residual, pulling the model back hard.
            This is why log-loss is the right choice for classification — it measures not just
            "did we get the right class?" but "how confident and how correct are we?"
          </Lead>

          <div className="tf-subhead">Log-loss curves: L = −log(p) if y=1, L = −log(1−p) if y=0</div>
          <svg viewBox="0 0 350 210" style={{ width: "100%", maxWidth: 350 }}>
            <polyline points={pts1.join(" ")} fill="none" stroke={SPAM_COL} strokeWidth="2.2" />
            <polyline points={pts0.join(" ")} fill="none" stroke={HAM_COL} strokeWidth="2.2" />
            <line x1={44} y1={10} x2={44} y2={185} stroke="var(--line)" strokeWidth="1" />
            <line x1={44} y1={185} x2={334} y2={185} stroke="var(--line)" strokeWidth="1" />
            {[0, 0.25, 0.5, 0.75, 1.0].map(v => (
              <g key={v}>
                <text x={lx(v)} y={200} textAnchor="middle" fontSize="9" fill="var(--muted)">{v.toFixed(2)}</text>
                <line x1={lx(v)} y1={185} x2={lx(v)} y2={188} stroke="var(--line)" strokeWidth="1" />
              </g>
            ))}
            {[0, 1, 2, 3, 4, 5].map(v => (
              <g key={v}>
                <text x={38} y={ly(v) + 4} textAnchor="end" fontSize="9" fill="var(--muted)">{v}</text>
                <line x1={41} y1={ly(v)} x2={44} y2={ly(v)} stroke="var(--line)" strokeWidth="1" />
              </g>
            ))}
            <text x={189} y={208} textAnchor="middle" fontSize="9" fill="var(--muted)">predicted P(spam)</text>
            <text x={14} y={100} textAnchor="middle" fontSize="9" fill="var(--muted)" transform="rotate(-90,14,100)">log-loss</text>
            <text x={320} y={80} fontSize="9" fill={SPAM_COL} fontWeight="700">y=1 (spam)</text>
            <text x={320} y={145} fontSize="9" fill={HAM_COL} fontWeight="700">y=0 (ham)</text>
            {/* highlight the catastrophic region */}
            <line x1={lx(0.99)} y1={14} x2={lx(0.99)} y2={185} stroke={HAM_COL} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <text x={lx(0.99) - 2} y={30} textAnchor="end" fontSize="8" fill={HAM_COL}>p=0.99 for ham → loss=4.6!</text>
          </svg>

          <div className="tf-subhead" style={{ marginTop: 12 }}>Loss values — the confidence penalty</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["true y", "P(spam)", "log-loss L", "level", "verdict"].map(h => (
                    <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lossExamples.map((ex, i) => {
                  const p = Math.max(1e-9, Math.min(1 - 1e-9, ex.p));
                  const loss = -(ex.y * Math.log(p) + (1 - ex.y) * Math.log(1 - p));
                  const isGood = loss < 0.3;
                  const isBad = loss > 2.5;
                  return (
                    <tr key={i} style={{
                      borderBottom: "1px solid var(--line-soft)",
                      background: isBad ? "rgba(224,73,46,.1)" : isGood ? "rgba(31,158,107,.08)" : undefined
                    }}>
                      <td style={{ padding: "4px 8px", fontWeight: 700, color: clsColor(ex.y) }}>{clsName(ex.y)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{ex.p.toFixed(2)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: isBad ? 700 : 400,
                        color: isBad ? "#e0492e" : isGood ? "#1f9e6b" : "var(--ink)" }}>
                        {fmt(loss, 3)}
                      </td>
                      <td style={{ padding: "4px 8px", fontSize: 11, color: isBad ? "#e0492e" : isGood ? "#1f9e6b" : "var(--muted)" }}>
                        {isBad ? "catastrophic" : isGood ? "excellent" : "moderate"}
                      </td>
                      <td style={{ padding: "4px 8px", fontSize: 11, color: "var(--muted)" }}>{ex.desc}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Note>
            Log-loss = 0.693 corresponds to the completely uninformative prediction P = 0.5.
            Any loss below 0.693 means the model is doing better than chance.
            In our toy problem, the initial log-loss is exactly 0.693 (since all probabilities start at 0.5).
            Watch it decrease as we add trees.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 9: Missing Values & Outliers
  // ────────────────────────────────────────────────────────
  const stageMissing = {
    id: "robustness", group: "Concepts", title: "Missing values & outliers in classification",
    map: "Robustness",
    why: "Classification-specific robustness issues. Outliers in features are less dangerous than in regression, but class imbalance and label noise are important classification-specific concerns.",
    render: () => {
      // log-loss under label noise example
      const noisyExamples = [
        { y: 1, p: 0.9, noisy: false, loss: -Math.log(0.9) },
        { y: 0, p: 0.9, noisy: true, loss: -Math.log(0.1) },  // label flipped
      ];

      return (
        <>
          <Lead>
            For classification, <b>missing feature values</b> are handled the same way as in
            regression boosting: standard GBM requires imputation; XGBoost and LightGBM learn
            the best default split direction for missing values. In email spam detection, if
            word_count is missing for an email, XGBoost learns whether to route that email
            left or right at each split based on which direction minimizes log-loss.
          </Lead>
          <Lead>
            Outliers in the <em>features</em> (x) are less dangerous for gradient boosting than
            for linear models — trees split on thresholds, so a word_count of 1000.0 versus 1.0
            ends up in the same leaf as any value above the threshold. However, <b>label noise</b>
            (mislabeled training examples) is a serious problem. A mislabeled spam email (labeled
            as ham) will always have a large pseudo-residual in the wrong direction, and the
            model will waste capacity trying to fix an unfixable error.
          </Lead>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "14px 0" }}>
            <div style={{ background: "var(--accent-soft)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 8 }}>Missing Feature Values</div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7 }}>
                <b>Standard GBM:</b> impute with 0, mean, or a separate "missing" category for categoricals.
              </div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, marginTop: 8 }}>
                <b>XGBoost / LightGBM:</b> at each split, the algorithm tries routing missing values left AND right, picks whichever reduces log-loss more. Learns automatically, no manual imputation.
              </div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, marginTop: 8 }}>
                <b>Practical tip:</b> if you use XGBoost, pass NaN directly. Do not impute — you would destroy the signal that "this feature was missing."
              </div>
            </div>
            <div style={{ background: "rgba(224,73,46,.08)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e0492e", marginBottom: 8 }}>Class Imbalance & Label Noise</div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7 }}>
                <b>Class imbalance</b> (e.g. 1% spam, 99% ham): the initial log-odds F₀ = log(0.01/0.99) ≈ −4.6, so all predictions start near P=0.01. Fix: use <code>scale_pos_weight</code> in XGBoost or adjust class weights.
              </div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, marginTop: 8 }}>
                <b>Label noise</b> (mislabeled examples): creates permanently large pseudo-residuals. The model spends rounds chasing noise. Fix: clean labels, use soft labels, or use a robust loss like focal loss.
              </div>
            </div>
          </div>

          <div className="tf-subhead">Effect of a mislabeled example</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", maxWidth: 520 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["scenario", "true y", "P(spam) after 3 rounds", "log-loss", "pseudo-resid."].map(h => (
                    <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { scenario: "spam, correctly labeled", y: 1, p: 0.85 },
                  { scenario: "ham, correctly labeled", y: 0, p: 0.15 },
                  { scenario: "spam, MISLABELED as ham", y: 0, p: 0.85, noisy: true },
                  { scenario: "ham, MISLABELED as spam", y: 1, p: 0.15, noisy: true },
                ].map((ex, i) => {
                  const p = Math.max(1e-9, Math.min(1-1e-9, ex.p));
                  const loss = -(ex.y * Math.log(p) + (1 - ex.y) * Math.log(1 - p));
                  const resid = ex.y - ex.p;
                  return (
                    <tr key={i} style={{
                      borderBottom: "1px solid var(--line-soft)",
                      background: ex.noisy ? "rgba(224,73,46,.1)" : "rgba(31,158,107,.06)"
                    }}>
                      <td style={{ padding: "4px 8px", fontSize: 11, color: ex.noisy ? "#e0492e" : "var(--ink)", fontWeight: ex.noisy ? 700 : 400 }}>{ex.scenario}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", fontWeight: 700, color: clsColor(ex.y) }}>{ex.y}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)" }}>{ex.p.toFixed(2)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: ex.noisy ? "#e0492e" : "#1f9e6b", fontWeight: ex.noisy ? 700 : 400 }}>{fmt(loss, 3)}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "var(--num-font)", color: ex.noisy ? "#e0492e" : "var(--muted)", fontWeight: ex.noisy ? 700 : 400 }}>{fmt(resid, 3)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Note>
            Mislabeled examples create large pseudo-residuals that persist across all rounds —
            the model can never fix them because the label is wrong. With 5% label noise,
            your model's ceiling accuracy is ~95%, no matter how many trees you add.
            Always audit your training labels for classification tasks.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 10: Evaluation & XGBoost
  // ────────────────────────────────────────────────────────
  const stageEval = {
    id: "eval", group: "Concepts", title: "Evaluation & XGBoost — full classification metrics",
    map: "Evaluation",
    why: "Accuracy alone is misleading for classification. Precision, recall, F1, and AUC-ROC tell the full story. XGBoost's improvements make it the go-to for tabular classification.",
    render: (trace) => {
      const finalRound = trace.rounds[trace.rounds.length - 1];
      const ys = BOOST_CLS.data.map(d => d[2]);
      const preds = finalRound.probs.map(p => p >= 0.5 ? 1 : 0);

      const tp = preds.filter((p, i) => p === 1 && ys[i] === 1).length;
      const fp = preds.filter((p, i) => p === 1 && ys[i] === 0).length;
      const tn = preds.filter((p, i) => p === 0 && ys[i] === 0).length;
      const fn = preds.filter((p, i) => p === 0 && ys[i] === 1).length;
      const acc = (tp + tn) / ys.length;
      const prec = tp / (tp + fp) || 0;
      const rec = tp / (tp + fn) || 0;
      const f1 = 2 * prec * rec / (prec + rec) || 0;

      return (
        <>
          <Lead>
            For classification we need metrics beyond accuracy. If 99% of emails are ham,
            a model that always predicts "ham" gets 99% accuracy — useless. Instead, we use
            <b> precision</b> (of emails predicted spam, how many actually are?),
            <b> recall</b> (of all actual spam, how many did we catch?), <b>F1</b> (harmonic
            mean of precision and recall), and <b>AUC-ROC</b> (area under the precision-recall
            tradeoff curve — measures overall discriminative ability).
          </Lead>
          <Lead>
            XGBoost is the dominant choice for tabular classification. Its second-order gradients
            compute more precise leaf values; L1/L2 regularization controls complexity; native
            missing value handling eliminates imputation; column subsampling adds diversity.
            Feature importance from XGBoost — the total gain each feature contributes across
            all splits across all trees — is one of the most interpretable ML tools available.
          </Lead>

          <div className="nn-calc">
            <div className="nn-calc-h">Classification metrics on training data ({trace.input.nTrees} tree(s))</div>
            <div className="nn-calc-row">
              Confusion matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}
            </div>
            <div className="nn-calc-row">Accuracy = (TP+TN)/n = ({tp}+{tn})/{ys.length} = <b>{fmt(acc, 3)}</b> ({(acc * 100).toFixed(0)}%)</div>
            <div className="nn-calc-row">Precision = TP/(TP+FP) = {tp}/({tp}+{fp}) = <b>{fmt(prec, 3)}</b></div>
            <div className="nn-calc-row">Recall = TP/(TP+FN) = {tp}/({tp}+{fn}) = <b>{fmt(rec, 3)}</b></div>
            <div className="nn-calc-row">F1 = 2·P·R/(P+R) = <b>{fmt(f1, 3)}</b></div>
            <div className="nn-calc-row">Log-loss = <b>{fmt(finalRound.loss, 4)}</b></div>
          </div>

          <div className="tf-subhead" style={{ marginTop: 14 }}>Precision vs Recall trade-off</div>
          <div className="tf-legend">
            {[
              ["High precision", "When a spam filter catches a message, it really is spam. Low false positives. Set threshold > 0.5."],
              ["High recall", "Almost no actual spam gets through (low false negatives). May misclassify some ham. Set threshold < 0.5."],
              ["F1 score", "Harmonic mean of precision and recall. Balances the two. Best single metric when classes are imbalanced."],
              ["AUC-ROC", "Area under ROC curve. Measures ability to discriminate between classes at all thresholds. 0.5 = random, 1.0 = perfect. Threshold-independent."],
            ].map(([n, d]) => (
              <div className="tf-leg" key={n}>
                <div className="tf-leg-name">{n}</div>
                <div className="tf-leg-desc">{d}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "14px 0" }}>
            <div style={{ background: "var(--accent-soft)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 8 }}>XGBoost feature importance</div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7 }}>
                For each feature, XGBoost sums the <b>gain</b> (improvement in loss) from all splits
                that use that feature, across all trees. Higher gain = more important feature.
              </div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, marginTop: 8 }}>
                In our model: word_count is used in Trees 1 and 3; has_link in Tree 2.
                word_count likely has higher total gain since Tree 1 (largest gain) used it.
              </div>
            </div>
            <div style={{ background: "rgba(124,92,255,.08)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7c5cff", marginBottom: 8 }}>XGBoost for classification</div>
              <ul style={{ fontSize: 12, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.75 }}>
                <li><code>objective="binary:logistic"</code> → binary classification</li>
                <li><code>objective="multi:softprob"</code> → multiclass</li>
                <li><code>eval_metric="logloss"</code></li>
                <li><code>scale_pos_weight</code> for class imbalance</li>
                <li><code>early_stopping_rounds</code> — stop when val-logloss stalls</li>
              </ul>
            </div>
          </div>

          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1f9e6b", marginBottom: 6 }}>GBM strengths for classification</div>
              <ul style={{ fontSize: 13, margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
                <li>Best accuracy on tabular classification (consistently top-2 on Kaggle)</li>
                <li>Handles class imbalance with scale_pos_weight</li>
                <li>Outputs well-calibrated probabilities</li>
                <li>Feature importance is interpretable and meaningful</li>
                <li>Works out-of-the-box with minimal preprocessing</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e0492e", marginBottom: 6 }}>Watch out for…</div>
              <ul style={{ fontSize: 13, margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
                <li>Label noise — creates persistent wrong gradients</li>
                <li>Extreme class imbalance without weighting</li>
                <li>Sequential training — harder to parallelize than Random Forest</li>
                <li>Many hyperparameters to tune (use Optuna or Bayesian search)</li>
                <li>Probability calibration may need Platt scaling for production</li>
              </ul>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14, fontSize: 12 }}>
            {[
              { name: "XGBoost", notes: "Binary & multiclass. Scale_pos_weight for imbalance. GPU training. The standard." },
              { name: "LightGBM", notes: "Leaf-wise growth. Fastest on large datasets. DART mode for regularization." },
              { name: "CatBoost", notes: "Best on datasets with many categorical features. Less tuning needed. Great probability calibration." },
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

  // ────────────────────────────────────────────────────────
  //  ASSEMBLE STAGES
  // ────────────────────────────────────────────────────────
  window.ML_STAGES = [
    stageOverview,
    stageDataset,
    stageInit,
    stagePseudoResid,
    stageTree1,
    stageMoreTrees,
    stageSeqTrees,
    stageBoostClsAnim,
    stageEnsemble,
    stageLogLoss,
    stageMissing,
    stageEval,
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
      { label: "Classification", href: "Gradient Boosting (Classification).html", active: true },
      { label: "Regression", href: "Gradient Boosting (Regression).html", active: false },
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
