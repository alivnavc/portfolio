/* ============================================================
   Naive Bayes (Classification) — all 11 explainer stages
   Requires: window.ML_NB (from model/ml-naive-bayes.js)
             window.{ Matrix, V, Sub, Sup, Formula, Lead, Note,
                      Row, Arrow, Tag, fmt, TipLayer }
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState, useRef, useEffect } = React;
  const NB = window.ML_NB.NB;

  /* ── feature label helper ─────────────────────────────────── */
  const fLabel = f => f.replace(/_/g, ' ');

  /* ── toggle input controls ───────────────────────────────── */
  function renderInput(input, setInput) {
    return NB.features.map(f => (
      <label className="nn-slider" key={f}>
        <span className="nn-slider-l">{fLabel(f)}</span>
        <button
          style={{
            padding: '4px 10px', borderRadius: 8, border: '1px solid var(--line)',
            background: input[f] ? 'var(--accent)' : 'var(--panel-solid)',
            color: input[f] ? '#fff' : 'var(--muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer'
          }}
          onClick={() => setInput({ ...input, [f]: input[f] ? 0 : 1 })}
        >
          {input[f] ? 'yes' : 'no'}
        </button>
      </label>
    ));
  }

  /* ── Bar chart for class distribution ───────────────────── */
  function ClassBarChart({ counts, labels, colors }) {
    const max = Math.max(...counts, 1);
    const W = 200, H = 100;
    const barW = 50, gap = 30, padL = 30, padB = 30, padT = 10;
    const scaleY = v => padT + (H - padB - padT) - ((v / max) * (H - padB - padT));

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
        {counts.map((c, i) => {
          const x = padL + i * (barW + gap);
          const y = scaleY(c);
          const barH = H - padB - y;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH}
                fill={colors[i]} rx="4" opacity="0.85" />
              <text x={x + barW / 2} y={y - 5} textAnchor="middle"
                fontSize="13" fontWeight="700" fill={colors[i]} fontFamily="inherit">{c}</text>
              <text x={x + barW / 2} y={H - 8} textAnchor="middle"
                fontSize="11" fill="var(--ink-2)" fontFamily="inherit">{labels[i]}</text>
            </g>
          );
        })}
        <line x1={padL - 4} y1={padT} x2={padL - 4} y2={H - padB}
          stroke="var(--ink)" strokeWidth="1.5" />
        <line x1={padL - 4} y1={H - padB} x2={W - 10} y2={H - padB}
          stroke="var(--ink)" strokeWidth="1.5" />
        {[0, max / 2, max].map(v => (
          <g key={v}>
            <line x1={padL - 8} y1={scaleY(v)} x2={padL - 4} y2={scaleY(v)}
              stroke="var(--ink)" strokeWidth="1" />
            <text x={padL - 10} y={scaleY(v) + 4} textAnchor="end"
              fontSize="9" fill="var(--ink-2)" fontFamily="inherit">{v}</text>
          </g>
        ))}
      </svg>
    );
  }

  /* ── Probability bar chart (horizontal) ──────────────────── */
  function ProbBars({ values, labels, colors, title, maxVal }) {
    const max = maxVal || Math.max(...values, 0.01);
    const W = 320, H = labels.length * 34 + 20;
    const padL = 110, padR = 60, padT = 10;
    const barH = 18, rowH = 34;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
        {title && (
          <text x={W / 2} y={padT - 2} textAnchor="middle" fontSize="11"
            fill="var(--ink-2)" fontFamily="inherit" fontWeight="600">{title}</text>
        )}
        {labels.map((lbl, i) => {
          const y = padT + i * rowH;
          const barW = ((values[i] / max) * (W - padL - padR));
          return (
            <g key={lbl}>
              <text x={padL - 6} y={y + barH / 2 + 4} textAnchor="end"
                fontSize="11" fill="var(--ink-2)" fontFamily="inherit">{lbl}</text>
              <rect x={padL} y={y} width={Math.max(barW, 2)} height={barH}
                fill={colors[i % colors.length]} rx="3" opacity="0.85" />
              <text x={padL + barW + 5} y={y + barH / 2 + 4}
                fontSize="11" fontWeight="700" fill={colors[i % colors.length]} fontFamily="inherit">
                {(values[i] * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  /* ── Bayesian network SVG ─────────────────────────────────── */
  function BayesianNetwork({ showFeatureEdges }) {
    const W = 340, H = 180;
    const classX = W / 2, classY = 40, r = 24;
    const featureXs = [50, 130, 210, 290];
    const featureY = 140;
    const features = NB.features;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
        <circle cx={classX} cy={classY} r={r} fill="var(--accent)" opacity="0.15" stroke="var(--accent)" strokeWidth="2" />
        <text x={classX} y={classY + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--accent)" fontFamily="inherit">Class</text>
        {features.map((f, i) => {
          const fx = featureXs[i], fy = featureY;
          const dx = fx - classX, dy = fy - classY;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / len, uy = dy / len;
          return (
            <g key={f}>
              <line
                x1={classX + ux * r} y1={classY + uy * r}
                x2={fx - ux * 20} y2={fy - uy * 20}
                stroke="var(--accent)" strokeWidth="1.5"
                markerEnd="url(#arrowNB)" opacity="0.7"
              />
              <circle cx={fx} cy={fy} r={20} fill="var(--panel-solid)" stroke="var(--line)" strokeWidth="1.5" />
              <text x={fx} y={fy - 4} textAnchor="middle" fontSize="8" fill="var(--ink-2)" fontFamily="inherit">x{i + 1}</text>
              <text x={fx} y={fy + 7} textAnchor="middle" fontSize="7" fill="var(--ink-2)" fontFamily="inherit">
                {f.split('_').slice(0, 2).join(' ')}
              </text>
            </g>
          );
        })}
        {showFeatureEdges && (
          <g opacity="0.35">
            {[0, 1, 2].map(i => (
              <line key={i}
                x1={featureXs[i] + 20} y1={featureY}
                x2={featureXs[i + 1] - 20} y2={featureY}
                stroke="var(--neg)" strokeWidth="1.5" strokeDasharray="4 3" />
            ))}
          </g>
        )}
        <defs>
          <marker id="arrowNB" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L0,8 L8,4 Z" fill="var(--accent)" opacity="0.7" />
          </marker>
        </defs>
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--ink-2)" fontFamily="inherit">
          {showFeatureEdges ? 'real correlations (ignored by Naive Bayes)' : 'no edges between features = independence assumption'}
        </text>
      </svg>
    );
  }

  /* ── Posterior probability bars ──────────────────────────── */
  function PosteriorBars({ posteriors, labels }) {
    const colors = ['#1f9e6b', '#e0518f'];
    return (
      <div className="tf-probs">
        {labels.map((lbl, i) => (
          <div className="tf-prob" key={lbl}>
            <div className="tf-prob-word">{lbl}</div>
            <div className="tf-prob-fill" style={{ width: `${(posteriors[i] * 100).toFixed(1)}%`, background: colors[i] }} />
            <div className="tf-prob-val">{(posteriors[i] * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    );
  }

  /* ── Log-scale illustration SVG ──────────────────────────── */
  function LogScaleViz() {
    const W = 420, H = 130;
    const products = [0.5, 0.71, 0.29, 0.14]; // illustrative P values
    const logSum = products.reduce((s, p) => s + Math.log(p), 0);
    const rawProduct = products.reduce((p, v) => p * v, 1);
    const padL = 20, padR = 20, padT = 20, padB = 30;

    // show bar of raw product (tiny) vs log sum
    const barMaxW = W - padL - padR;
    const rawFrac = rawProduct / 1.0;
    const logFrac = (logSum + 10) / 10; // normalize log sum for display

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
        <text x={padL} y={padT} fontSize="11" fill="var(--ink-2)" fontFamily="inherit" fontWeight="600">
          Raw product: {products.join(' × ')}
        </text>
        <text x={padL} y={padT + 14} fontSize="10" fill="var(--ink-2)" fontFamily="inherit">
          = {rawProduct.toFixed(6)} ← very small, underflow risk
        </text>
        <rect x={padL} y={padT + 20} width={Math.max(barMaxW * rawFrac * 200, 3)} height={16}
          fill="#e0518f" rx="3" opacity="0.8" />

        <text x={padL} y={padT + 55} fontSize="11" fill="var(--ink-2)" fontFamily="inherit" fontWeight="600">
          Log sum: log({products.join(') + log(')})
        </text>
        <text x={padL} y={padT + 69} fontSize="10" fill="var(--ink-2)" fontFamily="inherit">
          = {products.map(p => Math.log(p).toFixed(3)).join(' + ')} = {logSum.toFixed(4)} ← numerically stable
        </text>
        <rect x={padL} y={padT + 75} width={barMaxW * 0.65} height={16}
          fill="#1f9e6b" rx="3" opacity="0.8" />

        <text x={padL} y={H - 6} fontSize="10" fill="var(--ink-2)" fontFamily="inherit">
          Both encode the same relative ranking — log-space is safe from floating-point underflow
        </text>
      </svg>
    );
  }

  /* ── STAGES ──────────────────────────────────────────────── */
  const STAGES = [

    /* ── Stage 1: Overview ─────────────────────────────────── */
    {
      id: "overview",
      group: "Overview",
      title: "What is Naive Bayes?",
      map: "Overview",
      why: "Naive Bayes is one of the most effective and widely-used classifiers in spite of its simple probabilistic assumptions. Understanding it builds intuition for probabilistic reasoning and Bayesian thinking.",
      render: (trace) => (
        <>
          <Lead>
            <b>Naive Bayes</b> is a probabilistic classifier based on <b>Bayes' theorem</b>. Given
            an email described by features like "has_link" or "has_money", it computes
            <V> P(spam | features)</V> and <V>P(ham | features)</V> and picks the higher one.
            It's called "naive" because it assumes all features are <b>conditionally independent</b> given
            the class — a simplification that rarely holds exactly, yet works remarkably well in practice.
          </Lead>

          <Lead>
            Think of it like a doctor diagnosing a disease based on independent test results.
            The doctor looks at each test (fever? cough? fatigue?) separately and combines the
            evidence — not worrying about correlations between symptoms. Despite this simplification,
            experienced diagnosticians (and Naive Bayes) get the right answer most of the time.
          </Lead>

          <div className="tf-archwrap">
            <div className="tf-arch">
              <div className="tf-arch-io">
                Input <b>x</b> = [has_link, has_money, is_short, known_sender]
                <span>binary feature vector — one email to classify</span>
              </div>
              <div className="tf-arch-f"><b>Step 1 — Priors: P(ham) and P(spam) from training counts</b></div>
              <div className="tf-arch-row">
                <span className="tf-sym">prior P(C)</span> — class frequency in training data
              </div>
              <div className="tf-arch-f"><b>Step 2 — Likelihoods: P(feature | class) per feature</b></div>
              <div className="tf-arch-row">
                <span className="tf-sym">likelihood P(x|C)</span> — product of per-feature probabilities (naive assumption)
              </div>
              <div className="tf-arch-f"><b>Step 3 — Log-posterior: log P(C) + Σ log P(xⱼ|C)</b></div>
              <div className="tf-arch-row">
                <span className="tf-sym">log-space</span> — avoids numerical underflow from small products
              </div>
              <div className="tf-arch-io tf-arch-io--out">
                Predicted class — argmax P(C | x)
                <span>the class with the highest posterior probability</span>
              </div>
            </div>
          </div>

          <div className="tf-subhead">Symbol key</div>
          <div className="tf-legend">
            {[
              ["x", "feature vector", "[binary]", "the input email's 4 binary features (0 or 1 each)"],
              ["C", "class variable", "ham/spam", "the target label we are predicting"],
              ["P(C)", "prior", "scalar", "baseline probability of each class from training data — before seeing any features"],
              ["P(x|C)", "likelihood", "scalar", "probability of observing these features given the class — estimated from training counts"],
              ["P(C|x)", "posterior", "scalar", "the probability we want: P(class | this email's features) — Bayes' theorem inverts the likelihood"],
              ["α", "Laplace smoothing", "=1", "pseudocount added to every count to prevent zero probabilities"],
            ].map(r => (
              <div className="tf-leg" key={r[0]}>
                <div className="tf-leg-top">
                  <span className="tf-sym">{r[0]}</span>
                  <span className="tf-leg-shape">{r[2]}</span>
                </div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <div className="tf-subhead">Training vs Inference</div>
          <div className="tf-lifecycle">
            <div className="tf-life tf-life--train">
              <div className="tf-life-head">Training — O(n·d)</div>
              <div className="tf-life-body">
                Count class frequencies → priors P(C)<br />
                Count feature-class co-occurrences → likelihoods P(xⱼ|C)<br />
                Apply Laplace smoothing (α=1)<br />
                <b>Store: 2 priors + 4×2 likelihood table = 10 numbers</b>
              </div>
            </div>
            <div className="tf-life tf-life--infer">
              <div className="tf-life-head">Inference — O(d·K)</div>
              <div className="tf-life-body">
                For each class C: log P(C) + Σⱼ log P(xⱼ|C)<br />
                Compare log-posteriors → pick highest<br />
                Normalize → calibrated probabilities<br />
                <b>Predict: argmax P(C|x)</b>
              </div>
            </div>
          </div>

          <Note>
            Toggle the <b>feature buttons</b> above to change the email being classified.
            Every number on every step recomputes live. Press <b>Next →</b> to walk through
            the full algorithm step by step.
          </Note>
        </>
      ),
    },

    /* ── Stage 2: Dataset ──────────────────────────────────── */
    {
      id: "dataset",
      group: "Data",
      title: "The Training Dataset — 10 Labeled Emails",
      map: "Dataset",
      why: "We need labeled examples to estimate prior and likelihood probabilities. Understanding the data helps us see what the model can learn and where it might fail.",
      render: (trace) => {
        const { cfg } = trace;
        const hamRows = cfg.data.filter(r => r[4] === 0);
        const spamRows = cfg.data.filter(r => r[4] === 1);

        return (
          <>
            <Lead>
              Our dataset contains <b>10 emails</b>, each described by 4 binary features.
              Exactly 5 are <b>ham</b> (legitimate) and 5 are <b>spam</b>. Each feature is
              either 0 (absent) or 1 (present). These counts are all the model needs —
              no gradient descent, no matrix factorizations, just counting.
            </Lead>

            <Lead>
              Imagine you receive 100 emails per day. You want to learn which word patterns,
              links, or sender cues predict spam. Naive Bayes formalizes that intuition:
              count how often each clue appears in spam vs ham, and use those frequencies
              as probabilities at prediction time.
            </Lead>

            <Row>
              <div style={{ flex: '1 1 400px' }}>
                <div className="tf-subhead">All 10 training emails</div>
                <Matrix
                  data={cfg.data.map(r => [...r.slice(0, 4), r[4]])}
                  rowLabels={cfg.data.map((_, i) => `email ${i + 1}`)}
                  colLabels={[...cfg.features.map(fLabel), 'label']}
                  caption="Training data"
                  sub="10 emails × 4 binary features + class label (0=ham, 1=spam)"
                  heat={false}
                  cellTip={(i, j, v) => {
                    if (j === 4) return (
                      <div>
                        <div className="tf-tip-title">Email {i + 1} class</div>
                        <div className="tf-tip-sum">{v === 0 ? 'ham (legitimate)' : 'spam'}</div>
                      </div>
                    );
                    return (
                      <div>
                        <div className="tf-tip-title">{fLabel(cfg.features[j])}</div>
                        <div className="tf-tip-sum">{v === 1 ? 'yes — feature present' : 'no — feature absent'}</div>
                      </div>
                    );
                  }}
                />
              </div>
              <div style={{ flex: '0 0 220px' }}>
                <div className="tf-subhead">Class distribution</div>
                <ClassBarChart
                  counts={[5, 5]}
                  labels={['ham', 'spam']}
                  colors={['#1f9e6b', '#e0518f']}
                />
                <div className="nn-calc" style={{ marginTop: 12 }}>
                  <div className="nn-calc-h">Class counts</div>
                  <div className="nn-calc-row" style={{ color: '#1f9e6b' }}>Ham: 5 / 10 = 50%</div>
                  <div className="nn-calc-row" style={{ color: '#e0518f' }}>Spam: 5 / 10 = 50%</div>
                  <div className="nn-calc-row">Perfectly balanced dataset</div>
                </div>
              </div>
            </Row>

            <div className="tf-subhead">What each feature means</div>
            <div className="tf-legend">
              {[
                ["has_link", "Contains a URL or hyperlink", "binary", "Spam often includes links to phishing or ad sites. But ham can have links too (e.g., newsletters)."],
                ["has_money", "Contains money-related words ($, free, win, etc.)", "binary", "Strong spam indicator — many phishing emails promise financial gain."],
                ["is_short", "Email body is very short (< 30 words)", "binary", "Spam often uses short punchy messages. Legitimate business email is usually longer."],
                ["known_sender", "Sender is in your contacts list", "binary", "Very strong ham indicator — spam rarely comes from known contacts."],
              ].map(r => (
                <div className="tf-leg" key={r[0]}>
                  <div className="tf-leg-top">
                    <span className="tf-sym">{r[0]}</span>
                    <span className="tf-leg-shape">{r[2]}</span>
                  </div>
                  <div className="tf-leg-name">{r[1]}</div>
                  <div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>

            <div className="tf-subhead">Feature presence per class — raw counts</div>
            <Row>
              {cfg.features.map((f, fi) => {
                const hamCount = hamRows.filter(r => r[fi] === 1).length;
                const spamCount = spamRows.filter(r => r[fi] === 1).length;
                const signal = Math.abs(spamCount - hamCount) >= 3 ? 'strong signal' : Math.abs(spamCount - hamCount) >= 2 ? 'moderate signal' : 'weak signal';
                return (
                  <div key={f} className="nn-calc" style={{ flex: '1 1 130px' }}>
                    <div className="nn-calc-h">{fLabel(f)}</div>
                    <div className="nn-calc-row" style={{ color: '#1f9e6b' }}>ham: {hamCount}/5 = {(hamCount/5*100).toFixed(0)}%</div>
                    <div className="nn-calc-row" style={{ color: '#e0518f' }}>spam: {spamCount}/5 = {(spamCount/5*100).toFixed(0)}%</div>
                    <div className="nn-calc-row" style={{ color: 'var(--ink-2)', fontSize: 11 }}>{signal}</div>
                  </div>
                );
              })}
            </Row>

            <Note>
              Notice that <b>known_sender</b> is 1 in every ham email and 0 in every spam email —
              it is a perfectly discriminative feature in this toy dataset. <b>has_link</b> appears
              once in ham and four times in spam — strong but not perfect. Laplace smoothing
              (Stage 7) handles any zero-count edge cases safely.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 3: Bayes' Theorem from Scratch ──────────────── */
    {
      id: "bayes-theorem",
      group: "Theory",
      title: "Bayes' Theorem from Scratch — All Terms Defined",
      map: "Bayes' Theorem",
      why: "Bayes' theorem is the mathematical backbone of this classifier. Understanding all four terms — prior, likelihood, evidence, posterior — is essential before using the formula.",
      render: (trace) => (
        <>
          <Lead>
            Before stating Bayes' theorem, let's define every term precisely.
            These four concepts appear throughout statistics and machine learning —
            understanding them here unlocks Bayesian reasoning everywhere.
          </Lead>

          <div className="tf-subhead">The four key terms — defined first</div>
          <div className="tf-legend">
            {[
              ["P(C)", "Prior", "before data", "Our belief about the class BEFORE seeing any features. P(spam) = how often emails are spam in general. In our dataset: P(spam)=0.5."],
              ["P(x|C)", "Likelihood", "from training", "The probability of seeing these features GIVEN a class. P(fever|flu) = how often flu patients have fever. We estimate this from labeled training data."],
              ["P(C|x)", "Posterior", "what we want", "Our UPDATED belief about the class AFTER seeing the features. P(flu|fever) = probability you have flu given you have a fever. This is what we predict."],
              ["P(x)", "Evidence", "normalizer", "The total probability of seeing these features regardless of class. P(fever) = P(fever|flu)P(flu) + P(fever|healthy)P(healthy). Same for all classes, so we can ignore it when comparing."],
            ].map(r => (
              <div className="tf-leg" key={r[0]}>
                <div className="tf-leg-top">
                  <span className="tf-sym">{r[0]}</span>
                  <span className="tf-leg-shape">{r[2]}</span>
                </div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <Formula label="Bayes' Theorem">
            <span style={{ fontSize: '1.15em' }}>
              <V>P</V>(<V>C</V> | <V>x</V>) ={' '}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 2 }}>
                  <V>P</V>(<V>x</V> | <V>C</V>)  ×  <V>P</V>(<V>C</V>)
                </span>
                <span style={{ paddingTop: 4 }}><V>P</V>(<V>x</V>)</span>
              </span>
                =  
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '2px solid var(--accent)', paddingBottom: 2, color: 'var(--accent)' }}>
                  likelihood × prior
                </span>
                <span style={{ paddingTop: 4, color: 'var(--muted)' }}>evidence</span>
              </span>
            </span>
          </Formula>

          <div className="tf-subhead">Medical analogy first — P(flu | fever)</div>
          <Lead>
            Let's walk through Bayes' theorem with a concrete medical example before applying
            it to spam. This makes the "inversion" of conditional probability concrete and
            memorable.
          </Lead>

          <Row>
            <div className="nn-calc" style={{ flex: '1 1 220px' }}>
              <div className="nn-calc-h">Known facts (from population data)</div>
              <div className="nn-calc-row">P(flu) = 0.05 — 5% of people have flu</div>
              <div className="nn-calc-row">P(fever | flu) = 0.90 — 90% of flu patients have fever</div>
              <div className="nn-calc-row">P(fever | no flu) = 0.15 — 15% of others also have fever</div>
            </div>
            <div className="nn-calc" style={{ flex: '1 1 220px' }}>
              <div className="nn-calc-h">Step 1 — compute P(fever) (evidence)</div>
              <div className="nn-calc-row">P(fever) = P(fever|flu)×P(flu) + P(fever|¬flu)×P(¬flu)</div>
              <div className="nn-calc-row">= 0.90 × 0.05 + 0.15 × 0.95</div>
              <div className="nn-calc-row">= 0.045 + 0.1425 = <b>0.1875</b></div>
            </div>
            <div className="nn-calc" style={{ flex: '1 1 220px' }}>
              <div className="nn-calc-h">Step 2 — apply Bayes' theorem</div>
              <div className="nn-calc-row">P(flu | fever) = P(fever|flu) × P(flu) / P(fever)</div>
              <div className="nn-calc-row">= 0.90 × 0.05 / 0.1875</div>
              <div className="nn-calc-row">= 0.045 / 0.1875 = <b>0.24</b></div>
              <div className="nn-calc-row" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                Despite 90% sensitivity, only 24% chance you have flu if you have fever!
              </div>
            </div>
          </Row>

          <div className="tf-subhead">Why P(flu|fever) = 24%, not 90%?</div>
          <div className="nn-calc">
            <div className="nn-calc-h">The base rate (prior) matters enormously</div>
            <div className="nn-calc-row">P(fever|flu) = 0.90 tells you: "if you have flu, you're likely to have fever"</div>
            <div className="nn-calc-row">P(flu|fever) = 0.24 tells you: "if you have fever, it's probably not flu" — because flu is rare (5%)</div>
            <div className="nn-calc-row">Imagine 1000 people: 50 have flu (50×0.90=45 get fever) + 950 healthy (950×0.15=143 get fever)</div>
            <div className="nn-calc-row">Of 188 people with fever: only 45 have flu → 45/188 ≈ <b>24%</b>. Bayes gives the same answer.</div>
          </div>

          <div className="tf-subhead">Now applying to spam classification</div>
          <Row>
            <div className="nn-calc" style={{ flex: '1 1 220px' }}>
              <div className="nn-calc-h" style={{ color: '#e0518f' }}>P(spam | has_link=1)</div>
              <div className="nn-calc-row">= P(has_link=1|spam) × P(spam) / P(has_link=1)</div>
              <div className="nn-calc-row">Numerator: 0.71 × 0.50 = 0.357</div>
              <div className="nn-calc-row">P(has_link=1) = 0.71×0.5 + 0.29×0.5 = 0.50</div>
              <div className="nn-calc-row"><b>= 0.357 / 0.50 = 0.714</b></div>
            </div>
            <div className="nn-calc" style={{ flex: '1 1 220px' }}>
              <div className="nn-calc-h" style={{ color: 'var(--muted)' }}>Why skip P(x) in practice?</div>
              <div className="nn-calc-row">We want: argmax_C P(C|x)</div>
              <div className="nn-calc-row">P(x) is identical for all classes C</div>
              <div className="nn-calc-row">So we just compare numerators:</div>
              <div className="nn-calc-row"><b>P(C|x) ∝ P(x|C) · P(C)</b></div>
              <div className="nn-calc-row" style={{ color: 'var(--ink-2)', fontSize: 11 }}>
                Then normalize to get true probabilities
              </div>
            </div>
            <div style={{ flex: '1 1 340px' }}>
              <div className="tf-subhead">Bayesian network</div>
              <BayesianNetwork showFeatureEdges={false} />
            </div>
          </Row>

          <Note>
            The key insight: Bayes' theorem <b>inverts</b> conditional probability.
            We can measure P(features|class) from training data (easy), but we want
            P(class|features) at test time. Bayes' theorem flips it — that's its superpower.
          </Note>
        </>
      ),
    },

    /* ── Stage 4: Prior Probability ────────────────────────── */
    {
      id: "priors",
      group: "Theory",
      title: "Prior Probability P(C) — Before Seeing Any Features",
      map: "Priors P(C)",
      why: "The prior captures our baseline belief about each class before observing any features. In spam filtering, if 90% of emails are ham, that prior heavily influences predictions.",
      render: (trace) => {
        const { priors, classCounts, cfg } = trace;

        return (
          <>
            <Lead>
              The <b>prior probability</b> P(C) is the simplest thing: just the fraction of
              training examples belonging to each class. It answers "even before reading a
              single word, how likely is this email to be spam?" If your inbox is 90% ham,
              that's your prior — a strong starting assumption before looking at any features.
            </Lead>

            <Lead>
              Imagine you receive 100 emails. Before opening any of them, you already know
              from past experience that about 50 are spam and 50 are ham. That 50% estimate is
              your <b>prior</b>. It will get updated (via Bayes' theorem) once you look at features.
            </Lead>

            <Formula label="Prior probability — from counts">
              <V>P</V>(<V>C</V>) ={' '}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 2 }}>count of class C in training set</span>
                <span style={{ paddingTop: 4 }}>total number of training examples</span>
              </span>
            </Formula>

            <Row>
              <div style={{ flex: '0 0 200px' }}>
                <div className="tf-subhead">Class distribution</div>
                <ClassBarChart
                  counts={classCounts}
                  labels={cfg.labels}
                  colors={['#1f9e6b', '#e0518f']}
                />
              </div>
              <div style={{ flex: '1 1 280px' }}>
                <div className="nn-calc">
                  <div className="nn-calc-h">Step-by-step prior computation</div>
                  <div className="nn-calc-row">Total training emails n = {cfg.data.length}</div>
                  <div className="nn-calc-row" style={{ color: '#1f9e6b' }}>
                    Ham count = {classCounts[0]} emails
                  </div>
                  <div className="nn-calc-row" style={{ color: '#e0518f' }}>
                    Spam count = {classCounts[1]} emails
                  </div>
                  <div className="nn-calc-row" style={{ borderTop: '1px solid var(--line)', paddingTop: 6 }}>
                  </div>
                  <div className="nn-calc-row" style={{ color: '#1f9e6b' }}>
                    P(ham) = {classCounts[0]} / {cfg.data.length} = <b>{fmt(priors[0], 4)}</b>
                  </div>
                  <div className="nn-calc-row" style={{ color: '#e0518f' }}>
                    P(spam) = {classCounts[1]} / {cfg.data.length} = <b>{fmt(priors[1], 4)}</b>
                  </div>
                  <div className="nn-calc-row" style={{ color: 'var(--ink-2)', fontSize: 11 }}>
                    Check: {fmt(priors[0],2)} + {fmt(priors[1],2)} = 1.00 ✓
                  </div>
                </div>
              </div>
              <div style={{ flex: '1 1 220px' }}>
                <div className="tf-subhead">Log-space priors</div>
                <div className="nn-calc">
                  <div className="nn-calc-h">Convert to log for inference</div>
                  <div className="nn-calc-row" style={{ color: '#1f9e6b' }}>
                    log P(ham) = log({fmt(priors[0],2)}) = <b>{fmt(Math.log(priors[0]), 4)}</b>
                  </div>
                  <div className="nn-calc-row" style={{ color: '#e0518f' }}>
                    log P(spam) = log({fmt(priors[1],2)}) = <b>{fmt(Math.log(priors[1]), 4)}</b>
                  </div>
                  <div className="nn-calc-row" style={{ color: 'var(--ink-2)', fontSize: 11 }}>
                    Equal priors → equal log-priors → prior doesn't tip the scales here
                  </div>
                </div>
              </div>
            </Row>

            <div className="tf-subhead">What if the dataset were imbalanced?</div>
            <Row>
              <div className="nn-calc" style={{ flex: '1 1 200px' }}>
                <div className="nn-calc-h">Scenario: 9 ham, 1 spam out of 10</div>
                <div className="nn-calc-row" style={{ color: '#1f9e6b' }}>P(ham) = 9/10 = <b>0.900</b></div>
                <div className="nn-calc-row" style={{ color: '#e0518f' }}>P(spam) = 1/10 = <b>0.100</b></div>
                <div className="nn-calc-row" style={{ color: 'var(--ink-2)' }}>
                  Strong prior → model biased toward ham even with spam-like features. The prior "anchors" the prediction.
                </div>
              </div>
              <div className="nn-calc" style={{ flex: '1 1 200px' }}>
                <div className="nn-calc-h">Scenario: 1 ham, 9 spam out of 10</div>
                <div className="nn-calc-row" style={{ color: '#1f9e6b' }}>P(ham) = 1/10 = <b>0.100</b></div>
                <div className="nn-calc-row" style={{ color: '#e0518f' }}>P(spam) = 9/10 = <b>0.900</b></div>
                <div className="nn-calc-row" style={{ color: 'var(--ink-2)' }}>
                  Almost everything predicted spam. Good for high-recall spam filter, bad for precision. Fix: class weights or threshold tuning.
                </div>
              </div>
            </Row>

            <Note>
              In our balanced dataset P(ham) = P(spam) = {fmt(priors[0], 2)}, so the prior contributes
              equally to both classes — it does not tip the scales. The <b>likelihood</b> (next stage)
              is what distinguishes ham from spam here.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 5: Likelihood ────────────────────────────────── */
    {
      id: "likelihood",
      group: "Theory",
      title: "Likelihood P(xⱼ | C) — Feature Probabilities per Class",
      map: "Likelihood",
      why: "The likelihood table is the heart of Naive Bayes training. It captures how diagnostic each feature is for each class — high P(feature|spam) means that feature is strong evidence for spam.",
      render: (trace) => {
        const { likelihoods, likelihoodCounts, classCounts, cfg } = trace;

        return (
          <>
            <Lead>
              The <b>likelihood</b> P(xⱼ=1 | C) answers: "among all emails in class C,
              what fraction have feature j present?" For binary features (0 or 1), there are
              two values per feature per class. We use <b>Laplace smoothing</b> (α=1) to
              prevent any probability from being exactly zero.
            </Lead>

            <Lead>
              Think of it as building a frequency table from your training emails.
              For spam: "how often did spam emails contain a link? A money word? A short body?"
              Each answer becomes a probability in the likelihood table — the model's learned
              knowledge about what spam looks like.
            </Lead>

            <Formula label="Laplace-smoothed likelihood (binary features)">
              <V>P</V>(<V>x</V><Sub>j</Sub>=1 | <V>C</V>) ={' '}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 2 }}>
                  count(<V>x</V><Sub>j</Sub>=1, <V>C</V>) + α
                </span>
                <span style={{ paddingTop: 4 }}>count(<V>C</V>) + 2α</span>
              </span>
                where α = 1 (Laplace)
            </Formula>

            <div className="tf-subhead">Step-by-step: P(has_link=1 | spam)</div>
            <div className="nn-calc">
              <div className="nn-calc-h">Full worked example with α=1</div>
              <div className="nn-calc-row">Step 1: Count spam emails with has_link=1 → <b>{likelihoodCounts[1][0]}</b> out of {classCounts[1]} spam emails</div>
              <div className="nn-calc-row">Step 2: Apply Laplace → numerator = {likelihoodCounts[1][0]} + 1 = <b>{likelihoodCounts[1][0]+1}</b></div>
              <div className="nn-calc-row">Step 3: Denominator = {classCounts[1]} + 2×1 = <b>{classCounts[1]+2}</b></div>
              <div className="nn-calc-row">Step 4: P(has_link=1 | spam) = {likelihoodCounts[1][0]+1} / {classCounts[1]+2} = <b>{fmt(likelihoods[1][0], 4)}</b></div>
              <div className="nn-calc-row">Meaning: A spam email has a <b>{(likelihoods[1][0]*100).toFixed(0)}%</b> chance of containing a link</div>
            </div>

            <div className="tf-subhead">Full 4×2 likelihood table P(xⱼ=1 | C)</div>
            <Matrix
              data={cfg.features.map((_, fi) => [
                likelihoods[0][fi],
                likelihoods[1][fi],
                likelihoodCounts[0][fi],
                likelihoodCounts[1][fi],
              ])}
              rowLabels={cfg.features.map(fLabel)}
              colLabels={['P(·|ham)', 'P(·|spam)', 'ham count', 'spam count']}
              caption="Likelihood table (Laplace α=1)"
              sub="all 4 features × 2 classes — hover cells for full computation"
              heat={true}
              cellTip={(i, j, v) => {
                if (j < 2) {
                  const cls = j === 0 ? 'ham' : 'spam';
                  const cnt = likelihoodCounts[j][i];
                  const total = classCounts[j];
                  return (
                    <div>
                      <div className="tf-tip-title">P({fLabel(cfg.features[i])}=1 | {cls})</div>
                      <div className="tf-tip-calc">({cnt} + 1) / ({total} + 2)</div>
                      <div className="tf-tip-sum">= <b>{fmt(v, 4)}</b></div>
                    </div>
                  );
                }
                return (
                  <div>
                    <div className="tf-tip-title">Raw count</div>
                    <div className="tf-tip-sum">{v} emails with this feature in {j === 2 ? 'ham' : 'spam'}</div>
                  </div>
                );
              }}
            />

            <div className="tf-subhead">Interpreting the likelihood table</div>
            <Row>
              {cfg.features.map((f, fi) => {
                const hamP = likelihoods[0][fi];
                const spamP = likelihoods[1][fi];
                const ratio = spamP / hamP;
                const favors = ratio > 1.3 ? 'spam' : ratio < 0.7 ? 'ham' : 'neither strongly';
                return (
                  <div key={f} className="nn-calc" style={{ flex: '1 1 140px' }}>
                    <div className="nn-calc-h">{fLabel(f)}</div>
                    <div className="nn-calc-row" style={{ color: '#1f9e6b' }}>P(·|ham) = {fmt(hamP, 2)}</div>
                    <div className="nn-calc-row" style={{ color: '#e0518f' }}>P(·|spam) = {fmt(spamP, 2)}</div>
                    <div className="nn-calc-row">ratio: {fmt(ratio, 2)}×</div>
                    <div className="nn-calc-row" style={{ color: 'var(--ink-2)', fontSize: 11 }}>favors {favors}</div>
                  </div>
                );
              })}
            </Row>

            <Note>
              Without Laplace smoothing, <b>P(known_sender=1 | spam)</b> would be 0/5 = 0 —
              and one zero in the product sends the posterior to zero regardless of all other
              evidence. α=1 gives every outcome a minimum floor of probability.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 6: Independence Assumption ──────────────────── */
    {
      id: "independence",
      group: "Theory",
      title: 'The "Naive" Assumption — Conditional Independence',
      map: "Independence",
      why: "This is the most important conceptual insight in Naive Bayes: despite being mathematically wrong for most real data, assuming independence usually works surprisingly well in practice.",
      render: (trace) => (
        <>
          <Lead>
            The "naive" in Naive Bayes refers to the <b>conditional independence assumption</b>:
            given the class, each feature is assumed to be independent of every other feature.
            This means the joint probability of all features factors into a product of individual
            feature probabilities. Without this assumption, computing the joint distribution
            over all feature combinations would require exponential storage.
          </Lead>

          <Lead>
            In our email example: given that an email is spam, does knowing it has a link
            tell us anything new about whether it has money words? Naive Bayes says "no" —
            each feature is separately conditioned on the class only. In reality, spam emails
            often have both links and money words together (correlation), but ignoring this
            often doesn't hurt the final prediction.
          </Lead>

          <Formula label="Exact joint likelihood (exponential complexity)">
            <V>P</V>(<V>x</V><Sub>1</Sub>, <V>x</V><Sub>2</Sub>, …, <V>x</V><Sub>d</Sub> | <V>C</V>) = requires 2<Sup>d</Sup> parameters per class
          </Formula>

          <Formula label="Naive Bayes independence assumption (linear complexity)">
            <V>P</V>(<V>x</V><Sub>1</Sub>, …, <V>x</V><Sub>d</Sub> | <V>C</V>) ≈{' '}
            <span style={{ fontSize: '1.15em' }}>∏</span>
            <Sub>j=1</Sub><Sup>d</Sup>&nbsp;
            <V>P</V>(<V>x</V><Sub>j</Sub> | <V>C</V>)
            &nbsp;&nbsp; — only d parameters per class needed
          </Formula>

          <Row>
            <div style={{ flex: '1 1 340px' }}>
              <div className="tf-subhead">Naive Bayes model — no feature edges</div>
              <BayesianNetwork showFeatureEdges={false} />
            </div>
            <div style={{ flex: '1 1 340px' }}>
              <div className="tf-subhead">Reality — features correlated (ignored)</div>
              <BayesianNetwork showFeatureEdges={true} />
            </div>
          </Row>

          <div className="tf-subhead">Concrete example: checking independence violation</div>
          <div className="nn-calc">
            <div className="nn-calc-h">has_link AND has_money joint probability in spam</div>
            <div className="nn-calc-row">From data: spam emails with BOTH has_link=1 AND has_money=1: <b>3</b> out of 5</div>
            <div className="nn-calc-row">True joint: P(has_link=1, has_money=1 | spam) = 3/5 = <b>0.600</b></div>
            <div className="nn-calc-row">Naive assumption: P(has_link|spam) × P(has_money|spam)</div>
            <div className="nn-calc-row">= {fmt(trace.likelihoods[1][0], 3)} × {fmt(trace.likelihoods[1][1], 3)} = <b>{fmt(trace.likelihoods[1][0] * trace.likelihoods[1][1], 3)}</b></div>
            <div className="nn-calc-row" style={{ color: 'var(--ink-2)' }}>
              {fmt(trace.likelihoods[1][0] * trace.likelihoods[1][1], 3)} ≠ 0.600 — the assumption is violated, but the prediction often correct anyway
            </div>
          </div>

          <div className="tf-subhead">Why it often doesn't matter</div>
          <div className="tf-legend">
            {[
              ["1", "Decision boundary still correct", "practical", "Naive Bayes needs to rank classes correctly, not estimate perfect probabilities. Even with wrong joint probabilities, argmax P(C|x) is often the right class."],
              ["2", "Symmetric correlations cancel", "empirical", "If feature correlations affect both classes equally, the errors cancel out in the posterior ratio. The bias is often harmless."],
              ["3", "Implicit regularization", "theoretical", "The independence prior reduces model variance, which helps on small datasets where a more expressive model would overfit."],
              ["4", "Text classification wins", "domain", "In spam/text, features like word frequencies are genuinely semi-independent given the topic class, making the assumption less wrong."],
            ].map(r => (
              <div className="tf-leg" key={r[0]}>
                <div className="tf-leg-top">
                  <span className="tf-sym">{r[0]}</span>
                  <span className="tf-leg-shape">{r[2]}</span>
                </div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <Note>
            Expanding the joint likelihood into a product of 4 terms reduces the number of
            parameters from 2<Sup>4</Sup>−1=15 per class to just 4 per class.
            With d=100,000 word features, this savings is absolutely critical.
          </Note>
        </>
      ),
    },

    /* ── Stage 7: Laplace Smoothing ─────────────────────────── */
    {
      id: "laplace",
      group: "Theory",
      title: "Laplace Smoothing — Solving the Zero-Frequency Problem",
      map: "Laplace Smoothing",
      why: "A single unseen feature combination can zero out the entire posterior. Laplace smoothing is the simplest fix — it prevents catastrophic failure without requiring complex approximations.",
      render: (trace) => {
        const { likelihoodCounts, classCounts, likelihoods, cfg } = trace;

        return (
          <>
            <Lead>
              Here's a critical failure mode: if a feature-class combination <b>never appears</b>
              in the training data, its estimated probability is 0. One zero in the product of
              likelihoods sends the entire posterior to zero — no matter how strong all the other
              evidence is. This is the <b>zero-frequency problem</b>, and it can make the classifier
              completely useless on new data.
            </Lead>

            <Lead>
              The fix is elegant: add a small pseudocount α (usually 1) to every count before
              dividing. This is <b>Laplace smoothing</b>. Intuition: before collecting any data,
              pretend you saw one extra example of every outcome. This gives a minimum probability
              floor to everything, while barely affecting features with large counts.
            </Lead>

            <div className="tf-subhead">The zero-frequency catastrophe — without smoothing</div>
            <div className="nn-calc">
              <div className="nn-calc-h" style={{ color: 'var(--neg)' }}>Danger: known_sender appears 0 times in spam</div>
              <div className="nn-calc-row">Spam emails with known_sender=1: <b>0</b> out of {classCounts[1]}</div>
              <div className="nn-calc-row">Raw P(known_sender=1 | spam) = 0 / {classCounts[1]} = <b style={{ color: 'var(--neg)' }}>0.000</b></div>
              <div className="nn-calc-row">log P(known_sender=1 | spam) = log(0) = <b style={{ color: 'var(--neg)' }}>−∞</b></div>
              <div className="nn-calc-row">log P(spam|x) = log P(spam) + ... + (−∞) = <b style={{ color: 'var(--neg)' }}>−∞</b></div>
              <div className="nn-calc-row" style={{ color: 'var(--neg)', fontWeight: 700 }}>
                Result: model ALWAYS predicts ham if known_sender=1, ignoring all other features. Useless!
              </div>
            </div>

            <Formula label="Without Laplace (broken for zero counts)">
              <V>P</V>(<V>x</V><Sub>j</Sub>=1 | <V>C</V>) ={' '}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '1px solid var(--neg)', paddingBottom: 2, color: 'var(--neg)' }}>count(<V>x</V><Sub>j</Sub>=1, <V>C</V>)</span>
                <span style={{ paddingTop: 4 }}>count(<V>C</V>)</span>
              </span>
              &nbsp;&nbsp;→&nbsp;&nbsp; can be <b style={{ color: 'var(--neg)' }}>0</b>
            </Formula>

            <Formula label="With Laplace smoothing α=1 (fixed)">
              <V>P</V>(<V>x</V><Sub>j</Sub>=1 | <V>C</V>) ={' '}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '1px solid var(--accent)', paddingBottom: 2 }}>
                  count(<V>x</V><Sub>j</Sub>=1, <V>C</V>) + <b>α</b>
                </span>
                <span style={{ paddingTop: 4 }}>count(<V>C</V>) + <b>|V|·α</b></span>
              </span>
              &nbsp; (|V|=2 for binary: present/absent)
            </Formula>

            <div className="tf-subhead">Effect of different α values on P(known_sender=1 | spam)</div>
            <div className="nn-calc">
              <div className="nn-calc-h">Raw spam count for known_sender=1: {likelihoodCounts[1][3]} out of {classCounts[1]}</div>
              {[0, 0.5, 1, 2, 5, 10].map(alpha => {
                const cnt = likelihoodCounts[1][3];
                const total = classCounts[1];
                const p = alpha === 0 ? cnt / total : (cnt + alpha) / (total + 2 * alpha);
                return (
                  <div key={alpha} className="nn-calc-row"
                    style={{ color: alpha === 0 ? 'var(--neg)' : alpha === 1 ? 'var(--accent)' : 'inherit' }}>
                    α={alpha}: ({cnt}+{alpha}) / ({total}+{2*alpha}) = <b>{fmt(p, 4)}</b>
                    {alpha === 0 ? '  ← ZERO — breaks the model' : ''}
                    {alpha === 1 ? '  ← standard Laplace' : ''}
                    {alpha === 10 ? '  ← heavy smoothing, pulls toward 0.5' : ''}
                  </div>
                );
              })}
            </div>

            <div className="tf-subhead">Smoothed vs raw likelihoods — comparison</div>
            <Row>
              {cfg.features.map((f, fi) => {
                const hamRaw = likelihoodCounts[0][fi] / classCounts[0];
                const spamRaw = likelihoodCounts[1][fi] / classCounts[1];
                const hamSmooth = likelihoods[0][fi];
                const spamSmooth = likelihoods[1][fi];
                return (
                  <div key={f} className="nn-calc" style={{ flex: '1 1 130px' }}>
                    <div className="nn-calc-h">{fLabel(f)}</div>
                    <div className="nn-calc-row" style={{ fontSize: 11, color: 'var(--ink-2)' }}>ham raw: {fmt(hamRaw, 2)} → smooth: {fmt(hamSmooth, 2)}</div>
                    <div className="nn-calc-row" style={{ fontSize: 11, color: hamRaw === 0 || spamRaw === 0 ? 'var(--neg)' : 'var(--ink-2)' }}>
                      spam raw: {fmt(spamRaw, 2)} → smooth: {fmt(spamSmooth, 2)}
                      {spamRaw === 0 ? ' ←ZERO' : ''}
                    </div>
                  </div>
                );
              })}
            </Row>

            <Note>
              Larger α values push all probabilities toward 0.5 (uniform prior), adding more
              regularization but potentially washing out strong signals. α=1 is the standard
              default — it corresponds to a Dirichlet(1,1) prior, or "add one fake example per outcome."
            </Note>
          </>
        );
      },
    },

    /* ── Stage 8: Log Probabilities ─────────────────────────── */
    {
      id: "log-probs",
      group: "Theory",
      title: "Log Probabilities — Numerical Stability",
      map: "Log Probs",
      why: "Products of small probabilities underflow to zero on computers. Working in log-space turns multiplications into additions, preventing this failure on any sized dataset.",
      render: (trace) => {
        const { priors, likelihoods, logPosts, x, cfg } = trace;

        // Build illustrative product chain
        const exampleProbs = [priors[1], likelihoods[1][0], likelihoods[1][1], likelihoods[1][2], likelihoods[1][3]];
        const exampleLabels = ['P(spam)', 'P(link|spam)', 'P(money|spam)', 'P(short|spam)', 'P(¬known|spam)'];
        const rawProduct = exampleProbs.reduce((p, v) => p * v, 1);
        const logSum = exampleProbs.reduce((s, v) => s + Math.log(v), 0);

        return (
          <>
            <Lead>
              When computing P(C|x) ∝ P(C) × P(x₁|C) × P(x₂|C) × ... × P(xd|C), we multiply
              together many small probabilities. With real text data (thousands of words), each
              factor might be 0.001 or smaller. Multiplying 1000 such numbers together gives
              10<Sup>−3000</Sup> — which is exactly <b>0.0 in floating-point arithmetic</b>.
              This is <b>numerical underflow</b>.
            </Lead>

            <Lead>
              The solution: take the logarithm of everything. Since log is a monotone function,
              maximizing log P(C|x) gives the same argmax as maximizing P(C|x) directly.
              And log turns products into sums: log(a × b × c) = log(a) + log(b) + log(c).
              Sums of log-probabilities never underflow — they are just moderately negative numbers.
            </Lead>

            <Formula label="From product to log-sum">
              log <V>P</V>(<V>C</V> | <V>x</V>) ∝ log <V>P</V>(<V>C</V>) +{' '}
              <span style={{ fontSize: '1.15em' }}>∑</span><Sub>j=1</Sub><Sup>d</Sup>&nbsp;
              log <V>P</V>(<V>x</V><Sub>j</Sub> | <V>C</V>)
            </Formula>

            <div className="tf-subhead">Why the product underflows — illustrated</div>
            <LogScaleViz />

            <div className="tf-subhead">Step-by-step: current email in raw vs log space</div>
            <Row>
              <div className="nn-calc" style={{ flex: '1 1 260px' }}>
                <div className="nn-calc-h" style={{ color: '#e0518f' }}>Raw product for P(spam) path</div>
                {exampleProbs.map((p, i) => (
                  <div key={i} className="nn-calc-row">{exampleLabels[i]} = <b>{fmt(p, 4)}</b></div>
                ))}
                <div className="nn-calc-row" style={{ borderTop: '1px solid var(--line)', paddingTop: 6 }}>
                  Product = {exampleProbs.map(p => fmt(p, 3)).join(' × ')}
                </div>
                <div className="nn-calc-row" style={{ color: rawProduct < 1e-6 ? 'var(--neg)' : 'inherit', fontWeight: 700 }}>
                  = <b>{rawProduct.toFixed(8)}</b>
                  {rawProduct < 1e-6 ? ' ← tiny!' : ''}
                </div>
              </div>
              <div className="nn-calc" style={{ flex: '1 1 260px' }}>
                <div className="nn-calc-h" style={{ color: '#1f9e6b' }}>Log-sum for P(spam) path</div>
                {exampleProbs.map((p, i) => (
                  <div key={i} className="nn-calc-row">log {exampleLabels[i]} = <b>{fmt(Math.log(p), 4)}</b></div>
                ))}
                <div className="nn-calc-row" style={{ borderTop: '1px solid var(--line)', paddingTop: 6 }}>
                  Sum of logs:
                </div>
                <div className="nn-calc-row" style={{ fontWeight: 700, color: '#1f9e6b' }}>
                  = <b>{fmt(logSum, 4)}</b> ← safe, just negative
                </div>
              </div>
            </Row>

            <div className="tf-subhead">Comparing log-posteriors for current email</div>
            <div className="nn-calc">
              <div className="nn-calc-h">Full log-posterior for each class</div>
              {cfg.labels.map((lbl, c) => (
                <div key={lbl} className="nn-calc-row" style={{ color: c === 0 ? '#1f9e6b' : '#e0518f' }}>
                  log P({lbl}|x) = {fmt(Math.log(priors[c]), 4)} + {
                    cfg.features.map((f, fi) => {
                      const xi = x[fi];
                      const p = likelihoods[c][fi];
                      return fmt(xi === 1 ? Math.log(p) : Math.log(1-p), 3);
                    }).join(' + ')
                  } = <b>{fmt(logPosts[c], 4)}</b>
                </div>
              ))}
              <div className="nn-calc-row" style={{ fontWeight: 700, borderTop: '1px solid var(--line)', paddingTop: 6 }}>
                Higher log-posterior: <b>{cfg.labels[logPosts.indexOf(Math.max(...logPosts))]}</b>
                &nbsp;({fmt(Math.max(...logPosts), 4)} &gt; {fmt(Math.min(...logPosts), 4)})
              </div>
            </div>

            <div className="tf-subhead">Log-likelihood terms as matrix</div>
            <Matrix
              data={cfg.features.map((f, fi) => {
                return cfg.labels.map((_, c) => {
                  const xi = x[fi];
                  const p = likelihoods[c][fi];
                  return xi === 1 ? Math.log(p) : Math.log(1 - p);
                });
              })}
              rowLabels={cfg.features.map((f, fi) => `${fLabel(f)}=${x[fi]}`)}
              colLabels={cfg.labels.map(l => `log P(·|${l})`)}
              caption="Log-likelihood terms"
              sub="each cell: log P(xⱼ=value | class) — hover for details"
              heat={true}
              cellTip={(fi, c, v) => {
                const xi = x[fi];
                const p = likelihoods[c][fi];
                const usedP = xi === 1 ? p : 1 - p;
                return (
                  <div>
                    <div className="tf-tip-title">log P({fLabel(cfg.features[fi])}={xi} | {cfg.labels[c]})</div>
                    <div className="tf-tip-calc">log({fmt(usedP, 4)})</div>
                    <div className="tf-tip-sum">= <b>{fmt(v, 4)}</b></div>
                  </div>
                );
              }}
            />

            <Note>
              More negative log-posterior = less likely. Less negative = more likely.
              The class with the <b>least negative</b> (highest) log-posterior wins.
              Larger (less negative) log-posterior maps to higher posterior probability.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 9: Making Predictions ────────────────────────── */
    {
      id: "prediction",
      group: "Inference",
      title: "Making Predictions — Full Step-by-Step Walkthrough",
      map: "Prediction",
      why: "This is the inference step: combine prior and all feature likelihoods into a log-posterior score per class, then normalize. The class with higher log-posterior is the prediction.",
      render: (trace) => {
        const { posteriors, label, logPosts, priors, likelihoods, x, cfg } = trace;
        const predLabel = cfg.labels[label];
        const isSpam = label === 1;
        const maxLog = Math.max(...logPosts);
        const expShifted = logPosts.map(l => Math.exp(l - maxLog));
        const sumExp = expShifted.reduce((a, b) => a + b, 0);

        return (
          <>
            <Lead>
              Given a new email with features x = [{x.join(', ')}], we compute the log-posterior
              for each class by summing log(prior) + all log-likelihood terms, then normalize
              using the log-sum-exp trick to get calibrated probabilities. The class with the
              higher log-posterior (equivalently, higher posterior probability) is the prediction.
            </Lead>

            <div className="tf-subhead">Step 1 — Write down the features of the new email</div>
            <div className="nn-calc">
              <div className="nn-calc-h">Current email (toggle feature buttons above to change)</div>
              {cfg.features.map((f, fi) => (
                <div key={f} className="nn-calc-row">
                  {fLabel(f)} = <b>{x[fi]}</b> ({x[fi] === 1 ? 'present' : 'absent'})
                </div>
              ))}
            </div>

            <div className="tf-subhead">Step 2 — Compute log-posteriors for each class</div>
            <Row>
              {cfg.labels.map((lbl, c) => {
                const color = c === 0 ? '#1f9e6b' : '#e0518f';
                let runningSum = Math.log(priors[c]);
                return (
                  <div key={lbl} className="nn-calc" style={{ flex: '1 1 260px' }}>
                    <div className="nn-calc-h" style={{ color }}>log P({lbl} | x)</div>
                    <div className="nn-calc-row">+ log P({lbl}) = log({fmt(priors[c], 2)}) = <b>{fmt(Math.log(priors[c]), 4)}</b></div>
                    {cfg.features.map((f, fi) => {
                      const xi = x[fi];
                      const p = likelihoods[c][fi];
                      const logp = xi === 1 ? Math.log(p) : Math.log(1 - p);
                      return (
                        <div key={f} className="nn-calc-row">
                          + log P({fLabel(f)}={xi}|{lbl}) = log({fmt(xi === 1 ? p : 1-p, 3)}) = <b>{fmt(logp, 3)}</b>
                        </div>
                      );
                    })}
                    <div className="nn-calc-row" style={{ borderTop: '2px solid ' + color, paddingTop: 6, color, fontWeight: 700 }}>
                      Total = <b>{fmt(logPosts[c], 4)}</b>
                    </div>
                  </div>
                );
              })}
            </Row>

            <div className="tf-subhead">Step 3 — Normalize using log-sum-exp</div>
            <div className="nn-calc">
              <div className="nn-calc-h">Convert log-posteriors to probabilities (softmax)</div>
              <div className="nn-calc-row">max log-posterior = max({fmt(logPosts[0],4)}, {fmt(logPosts[1],4)}) = <b>{fmt(maxLog, 4)}</b></div>
              {cfg.labels.map((lbl, c) => (
                <div key={lbl} className="nn-calc-row">
                  exp({fmt(logPosts[c],4)} − {fmt(maxLog,4)}) = exp({fmt(logPosts[c]-maxLog,4)}) = <b>{fmt(expShifted[c], 6)}</b>
                </div>
              ))}
              <div className="nn-calc-row">sum = {fmt(expShifted[0],6)} + {fmt(expShifted[1],6)} = <b>{fmt(sumExp,6)}</b></div>
              {cfg.labels.map((lbl, c) => (
                <div key={lbl} className="nn-calc-row" style={{ color: c === 0 ? '#1f9e6b' : '#e0518f' }}>
                  P({lbl}|x) = {fmt(expShifted[c],6)} / {fmt(sumExp,6)} = <b>{fmt(posteriors[c], 4)}</b> = {(posteriors[c]*100).toFixed(1)}%
                </div>
              ))}
            </div>

            <div className="tf-subhead">Step 4 — Final posterior probabilities</div>
            <PosteriorBars posteriors={posteriors} labels={cfg.labels} />

            <div style={{
              marginTop: 16, padding: '14px 20px', borderRadius: 10,
              background: isSpam ? 'rgba(var(--neg-rgb), 0.08)' : 'rgba(var(--pos-rgb), 0.08)',
              border: `2px solid ${isSpam ? 'var(--neg)' : 'var(--pos)'}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 4 }}>Prediction</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: isSpam ? 'var(--neg)' : 'var(--pos)', letterSpacing: 1 }}>
                {predLabel.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>
                confidence: {(Math.max(...posteriors) * 100).toFixed(1)}% — log-odds: {fmt(logPosts[1] - logPosts[0], 3)}
              </div>
            </div>

            <div className="tf-subhead">Decision boundary intuition</div>
            <div className="nn-calc">
              <div className="nn-calc-h">The model predicts spam when:</div>
              <div className="nn-calc-row">log P(spam|x) &gt; log P(ham|x)</div>
              <div className="nn-calc-row">i.e., log P(spam) + Σⱼ log P(xⱼ|spam) &gt; log P(ham) + Σⱼ log P(xⱼ|ham)</div>
              <div className="nn-calc-row">i.e., log-odds = log P(spam|x) − log P(ham|x) = {fmt(logPosts[1]-logPosts[0], 4)} &gt; 0?  <b>{logPosts[1] > logPosts[0] ? 'YES → spam' : 'NO → ham'}</b></div>
              <div className="nn-calc-row" style={{ color: 'var(--ink-2)' }}>
                Toggle features above to see the prediction and log-odds change in real time
              </div>
            </div>

            <Note icon="★">
              Try setting <b>known_sender=yes</b> — it's a very strong ham indicator and often
              flips the prediction regardless of other features. P(known_sender=1|ham)={fmt(likelihoods[0][3],3)} vs
              P(known_sender=1|spam)={fmt(likelihoods[1][3],3)}: log-likelihood ratio = {fmt(Math.log(likelihoods[0][3]/likelihoods[1][3]),3)} — overwhelmingly favors ham.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 10: Missing Values & Outliers ────────────────── */
    {
      id: "missing-outliers",
      group: "Extensions",
      title: "Missing Values & Outliers — Graceful Handling",
      map: "Missing & Outliers",
      why: "Real-world data is messy. Naive Bayes has a beautiful property: missing features can be simply skipped, which is not true for most other classifiers.",
      render: (trace) => {
        const { likelihoods, priors, logPosts, x, cfg } = trace;

        // Show what happens if we skip feature 0 (has_link)
        const missingFeatureIdx = 0;
        const computeLogPostMissing = (c) => {
          let lp = Math.log(priors[c]);
          cfg.features.forEach((f, fi) => {
            if (fi === missingFeatureIdx) return; // skip missing feature
            const xi = x[fi];
            const p = likelihoods[c][fi];
            lp += xi === 1 ? Math.log(p) : Math.log(1 - p);
          });
          return lp;
        };
        const logPostsMissing = cfg.labels.map((_, c) => computeLogPostMissing(c));
        const maxM = Math.max(...logPostsMissing);
        const expM = logPostsMissing.map(l => Math.exp(l - maxM));
        const sumM = expM.reduce((a, b) => a + b, 0);
        const postMissing = expM.map(e => e / sumM);

        return (
          <>
            <Lead>
              What if an email is missing a feature — for example, the spam filter can't
              determine whether the email has a link because the content is encrypted?
              In Naive Bayes, the solution is beautiful: simply <b>skip that feature's term</b>
              in the log-sum. The model marginalizes it out automatically, using only
              the available evidence. This is a feature no gradient-based classifier can match easily.
            </Lead>

            <Lead>
              For <b>outliers</b> in continuous-feature variants (Gaussian NB), extreme values
              can distort the mean and variance estimates used in the Gaussian likelihood.
              A single outlier email with 10,000 words inflates the mean and especially the
              variance for that class, spreading the Gaussian and reducing discriminability.
            </Lead>

            <div className="tf-subhead">Missing value: what happens when has_link is unknown?</div>
            <Row>
              <div className="nn-calc" style={{ flex: '1 1 240px' }}>
                <div className="nn-calc-h">Full prediction (all 4 features)</div>
                {cfg.labels.map((lbl, c) => (
                  <div key={lbl} className="nn-calc-row" style={{ color: c === 0 ? '#1f9e6b' : '#e0518f' }}>
                    log P({lbl}|x) = {fmt(logPosts[c], 4)}
                  </div>
                ))}
              </div>
              <div className="nn-calc" style={{ flex: '1 1 240px' }}>
                <div className="nn-calc-h">Missing has_link — skip that term</div>
                {cfg.labels.map((lbl, c) => (
                  <div key={lbl} className="nn-calc-row" style={{ color: c === 0 ? '#1f9e6b' : '#e0518f' }}>
                    log P({lbl}|x\₁) = {fmt(logPostsMissing[c], 4)}
                  </div>
                ))}
                <div className="nn-calc-row" style={{ color: 'var(--ink-2)', fontSize: 11, marginTop: 4 }}>
                  Prediction changes? {logPosts.indexOf(Math.max(...logPosts)) !== logPostsMissing.indexOf(Math.max(...logPostsMissing)) ? 'YES — marginal feature' : 'NO — other features dominate'}
                </div>
              </div>
              <div className="nn-calc" style={{ flex: '1 1 200px' }}>
                <div className="nn-calc-h">Posteriors with missing has_link</div>
                {cfg.labels.map((lbl, c) => (
                  <div key={lbl} className="nn-calc-row" style={{ color: c === 0 ? '#1f9e6b' : '#e0518f' }}>
                    P({lbl}|x\₁) = {(postMissing[c]*100).toFixed(1)}%
                  </div>
                ))}
              </div>
            </Row>

            <div className="tf-subhead">Why missing values are graceful in Naive Bayes</div>
            <div className="tf-legend">
              {[
                ["✓", "Marginalization", "probabilistic", "Skipping a feature term is equivalent to marginalizing it: Σ_{x_j} P(C|x) P(x_j) = P(C | rest of x). This is mathematically rigorous."],
                ["✓", "No imputation needed", "practical", "Most models (SVM, logistic regression) require imputing missing values before inference. Naive Bayes handles them natively."],
                ["✓", "Graceful degradation", "robustness", "With fewer features, the posterior confidence decreases (moves toward prior) but the prediction direction is often still correct."],
                ["✓", "Works per-example", "flexible", "Each test example can have a different set of missing features. The model adapts per prediction with no retraining."],
              ].map(r => (
                <div className="tf-leg" key={r[0]}>
                  <div className="tf-leg-top">
                    <span className="tf-sym">{r[0]}</span>
                    <span className="tf-leg-shape">{r[2]}</span>
                  </div>
                  <div className="tf-leg-name">{r[1]}</div>
                  <div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>

            <div className="tf-subhead">Outliers in Gaussian NB — impact on estimates</div>
            <Row>
              <div className="nn-calc" style={{ flex: '1 1 240px' }}>
                <div className="nn-calc-h">Normal data: email lengths (words)</div>
                <div className="nn-calc-row">Ham: [50, 120, 80, 95, 60]</div>
                <div className="nn-calc-row">Mean μ = 81, Std σ = 26</div>
                <div className="nn-calc-row">Gaussian N(81, 26) — tight, discriminative</div>
              </div>
              <div className="nn-calc" style={{ flex: '1 1 240px' }}>
                <div className="nn-calc-h" style={{ color: 'var(--neg)' }}>With outlier added: [50, 120, 80, 95, 60, <b>5000</b>]</div>
                <div className="nn-calc-row" style={{ color: 'var(--neg)' }}>Mean μ = 901, Std σ = 1835</div>
                <div className="nn-calc-row" style={{ color: 'var(--neg)' }}>N(901, 1835) — extremely wide, not useful</div>
                <div className="nn-calc-row" style={{ color: 'var(--ink-2)' }}>Fix: winsorize outliers or use robust estimates (median/IQR)</div>
              </div>
            </Row>

            <Note>
              Missing values are Naive Bayes's superpower. In contrast, tree-based models and
              neural networks need explicit handling (imputation, masking) to deal with missing
              inputs at inference time. Simply dropping a term from a sum is uniquely clean.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 11: Variants & When to Use ──────────────────── */
    {
      id: "variants",
      group: "Evaluation",
      title: "Variants & When to Use Naive Bayes",
      map: "Variants",
      why: "Knowing the three main variants and when each excels helps you pick the right tool. Naive Bayes is often the perfect first model — fast, interpretable, hard to beat on text.",
      render: (trace) => (
        <>
          <Lead>
            Naive Bayes is not one algorithm but a family, differing in how they model
            P(xⱼ | C). <b>Bernoulli NB</b> uses binary presence/absence (our spam example).
            <b> Multinomial NB</b> uses word counts and is the gold standard for text classification.
            <b> Gaussian NB</b> models continuous features with Gaussian distributions per class.
            Knowing which to use and when is core ML practitioner knowledge.
          </Lead>

          <div className="tf-subhead">Three variants — comparison table</div>
          <div className="tf-legend">
            {[
              ["Bernoulli NB", "Binary features: feature present (1) or absent (0). P(xⱼ|C) estimated with Laplace smoothing as we built in this tutorial.", "binary features", "Email spam (word present/absent), document classification, medical diagnosis with binary symptoms."],
              ["Multinomial NB", "Integer count features: xⱼ = how many times word j appears. P(wⱼ|C) = (count(wⱼ,C)+α) / (Σ count(w,C) + α|V|). Best for text.", "word counts", "Text classification, document categorization, sentiment analysis, topic modeling. DOMINANT in NLP."],
              ["Gaussian NB", "Continuous features. P(xⱼ|C) = Gaussian(μⱼc, σⱼc) with parameters estimated from training data mean and variance per class.", "continuous features", "Medical data (height, weight, blood pressure), sensor readings, financial features, any real-valued measurement."],
            ].map(r => (
              <div className="tf-leg" key={r[0]}>
                <div className="tf-leg-top">
                  <span className="tf-sym">{r[0]}</span>
                  <span className="tf-leg-shape">{r[2]}</span>
                </div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <div className="tf-subhead">When Naive Bayes wins</div>
          <div className="tf-legend">
            {[
              ["✓", "Text / spam classification", "recommended", "Multinomial NB with TF-IDF is a strong baseline — interpretable, fast, often matches or beats complex models on short text."],
              ["✓", "Very small datasets", "recommended", "With few labeled examples, the strong independence prior helps more than it hurts — it regularizes aggressively where discriminative models overfit."],
              ["✓", "Real-time, high-throughput", "recommended", "Inference is O(d·K) — compute d multiplications and K comparisons. Orders of magnitude faster than neural networks at prediction time."],
              ["✓", "Multi-class classification", "recommended", "Naturally extends to K classes with no architectural changes — just add more priors and likelihood columns."],
              ["✓", "Interpretability required", "recommended", "You can directly inspect the likelihood table to understand why the model predicted spam: 'because has_link=1 has P=0.71 for spam vs 0.29 for ham'."],
              ["✓", "Missing data common", "recommended", "Simply skip missing feature terms in the log-sum — no imputation pipeline needed, no retraining required."],
            ].map(r => (
              <div className="tf-leg" key={r[1]}>
                <div className="tf-leg-top">
                  <span className="tf-sym">{r[0]}</span>
                  <span className="tf-leg-shape">{r[2]}</span>
                </div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <div className="tf-subhead">When Naive Bayes fails</div>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">Strengths</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">O(n·d) training — just counting, no optimization</li>
                <li className="opt-pc-li">O(d·K) inference — extremely fast predictions</li>
                <li className="opt-pc-li">Works well with tiny datasets (few hundred examples)</li>
                <li className="opt-pc-li">Naturally handles K&gt;2 classes</li>
                <li className="opt-pc-li">Interpretable: inspect P(feature|class) directly</li>
                <li className="opt-pc-li">Graceful missing value handling — skip the term</li>
                <li className="opt-pc-li">State-of-the-art for spam and text baselines</li>
                <li className="opt-pc-li">Robust to irrelevant features (they add ≈0 signal)</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">Weaknesses</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">Independence assumption almost never holds exactly</li>
                <li className="opt-pc-li">Cannot model feature interactions (e.g., XOR patterns)</li>
                <li className="opt-pc-li">Correlated features are double-counted → overconfident posteriors</li>
                <li className="opt-pc-li">Gaussian NB sensitive to outliers in continuous features</li>
                <li className="opt-pc-li">Bernoulli NB ignores term frequency (Multinomial is better for text)</li>
                <li className="opt-pc-li">Poorly calibrated probabilities — use Platt scaling to fix</li>
              </ul>
            </div>
          </div>

          <div className="tf-subhead">Quick decision guide</div>
          <div className="nn-calc">
            <div className="nn-calc-h">Choose Naive Bayes when…</div>
            <div className="nn-calc-row">Features are binary → Bernoulli NB (this tutorial)</div>
            <div className="nn-calc-row">Features are word counts → Multinomial NB</div>
            <div className="nn-calc-row">Features are continuous → Gaussian NB</div>
            <div className="nn-calc-row">Dataset is tiny or medium → NB often beats logistic regression</div>
            <div className="nn-calc-row">You need a fast, interpretable baseline → always try NB first</div>
            <div className="nn-calc-h" style={{ marginTop: 10 }}>Upgrade to a stronger model when…</div>
            <div className="nn-calc-row">Features are strongly correlated → logistic regression or tree ensemble</div>
            <div className="nn-calc-row">You need calibrated probabilities → logistic regression + regularization</div>
            <div className="nn-calc-row">Complex feature interactions matter → gradient boosting or deep learning</div>
          </div>

          <Note icon="★">
            You've completed the Naive Bayes walkthrough. The core insight:
            <b> separate "what we count from data" (priors and likelihoods) from "how we combine evidence"
            (Bayes' rule)</b>. Despite the naive assumption, this framework outperforms complex models on
            text tasks where training data is scarce and speed matters — that is why it still powers
            spam filters in production systems today.
          </Note>
        </>
      ),
    },

  {
    id: "hyperparams",
    group: "Practical",
    title: "Hyperparameters & when to use",
    map: "Hyperparams",
    why: "Naive Bayes has almost no hyperparameters — just smoothing. Its power comes from speed and surprisingly good performance on text, not from tuning.",
    render: () => (
      <>
        <Lead>Naive Bayes is the fastest classifier you can train. A Gaussian NB model on 1 million samples trains in under a second. It works because the 'naive' independence assumption, while technically wrong for most data, often doesn't matter much for classification (you only need the right class ranking, not exact probabilities). It dominates for text classification with Multinomial NB.</Lead>
        <Note>The 'naive' independence assumption is almost always violated — but Naive Bayes still works surprisingly well. The reason: for classification you only need P(y|x) to pick the right class, not to be calibrated. The wrong probabilities but right rankings still give correct classification.</Note>
        <div className="tf-subhead">Key hyperparameters</div>
        <div className="tf-legend">
          {[
            ["var_smoothing", "Variance smoothing (GaussianNB)", "Default 1e-9. Adds this value to all variances to prevent division by zero. Increase (1e-8 to 1e-5) if features are nearly constant. Rarely needs tuning."],
            ["alpha", "Laplace / Lidstone smoothing (MultinomialNB / BernoulliNB)", "Default 1.0 (Laplace smoothing). Set alpha=0 for no smoothing (risky — unseen words get P=0). Set alpha=0.5 (Jeffreys prior) for sparser text. Tune in [0.01, 0.1, 0.5, 1.0]."],
            ["fit_prior", "Learn class prior probabilities (MultinomialNB)", "Default True. Set False if classes are artificially balanced and you don't want the model to use prior class frequencies."],
            ["binarize", "Threshold to binarize features (BernoulliNB)", "Default 0.0 (anything > 0 is 1). Set to a specific threshold to convert continuous features to binary."],
          ].map(([sym, name, desc]) => (
            <div className="tf-leg" key={sym}>
              <div className="tf-leg-top"><span className="tf-sym" style={{ fontSize: 10.5 }}>{sym}</span></div>
              <div className="tf-leg-name">{name}</div>
              <div className="tf-leg-desc">{desc}</div>
            </div>
          ))}
        </div>
        <Note>Which variant to use: GaussianNB → continuous features (age, height, income). MultinomialNB → count data (word frequencies, TF-IDF) for text classification. BernoulliNB → binary features (word presence/absence). ComplementNB → imbalanced text classification.</Note>
        <div className="tf-subhead">Pros vs Cons</div>
        <div className="opt-pc">
          <div className="opt-pc-col is-pro">
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#2e7d32" }}>Advantages</div>
            {[
              "Extremely fast training — O(n×d)",
              "Works with tiny datasets",
              "No feature scaling needed",
              "Handles missing data naturally (skip the feature in product)",
              "Real-time updates via online learning (partial_fit)",
              "Excellent for text classification",
              "Good probability estimates when classes are balanced",
            ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
          </div>
          <div className="opt-pc-col is-con">
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
            {[
              "Naive independence assumption is almost always wrong",
              "Poor on datasets with strong feature correlations",
              "GaussianNB assumes Gaussian distribution (violated by skewed features)",
              "Overconfident probability estimates",
              "Cannot capture feature interactions",
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
                ["Text classification (spam, sentiment, topic)", "Multinomial Naive Bayes", "TF-IDF + MultinomialNB is the classic fast baseline"],
                ["Real-time classification (< 1ms required)", "Naive Bayes", "Fastest classifier; prediction is just a few multiplications"],
                ["Tiny labeled dataset", "Naive Bayes", "Works with very few examples; doesn't overfit like trees"],
                ["Maximum accuracy on structured data", "GBM / XGBoost", "Naive Bayes' independence assumption hurts on correlated features"],
                ["Features are highly correlated", "Logistic Regression or GBM", "Correlation violates independence assumption badly"],
                ["Online/streaming learning", "Naive Bayes (partial_fit)", "Can update incrementally without retraining from scratch"],
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
    title: "Naive Bayes",
    subtitle: "probabilistic spam classification via Bayes' theorem",
    cur: "Naive Bayes (Classification)",
    category: "Classification",
    run: (input) => window.ML_NB.runNB(input),
    default: { ...window.ML_NB.NB.default },
    renderInput,
  };
})();
