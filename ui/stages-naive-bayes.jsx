/* ============================================================
   Naive Bayes (Classification) — all 11 explainer stages
   Requires: window.ML_NB (from model/ml-naive-bayes.js)
             window.{ Matrix, V, Sub, Sup, Formula, Lead, Note,
                      Row, Arrow, Tag, fmt, TipLayer, DiagramBar }
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

  /* ── Gaussian bell curve SVG ─────────────────────────────── */
  function GaussianCurve({ mu, sigma, color, label, xMin, xMax, svgWidth, svgHeight, padL, padR, padT, padB, yScale }) {
    const plotW = svgWidth - padL - padR;
    const plotH = svgHeight - padT - padB;
    const toSvgX = x => padL + ((x - xMin) / (xMax - xMin)) * plotW;
    const toSvgY = y => padT + plotH - (y / yScale) * plotH;

    const pts = [];
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = Math.exp(-(x - mu) ** 2 / (2 * sigma ** 2)) / (sigma * Math.sqrt(2 * Math.PI));
      pts.push(`${toSvgX(x).toFixed(2)},${toSvgY(y).toFixed(2)}`);
    }

    // mean line
    const mx = toSvgX(mu);

    return (
      <g>
        <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        <line x1={mx} y1={padT} x2={mx} y2={padT + plotH} stroke={color} strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
        <text x={mx} y={padT - 5} textAnchor="middle" fontSize="11" fill={color} fontFamily="inherit">
          μ={fmt(mu, 1)}
        </text>
        {label && (
          <text x={toSvgX(mu + sigma * 1.3)} y={toSvgY(Math.exp(-0.5) / (sigma * Math.sqrt(2 * Math.PI))) - 6}
            fontSize="11" fill={color} fontFamily="inherit">{label}</text>
        )}
      </g>
    );
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

  /* ── Bayesian network SVG ─────────────────────────────────── */
  function BayesianNetwork({ showFeatureEdges = false }) {
    const W = 340, H = 180;
    const classX = W / 2, classY = 40, r = 24;
    const featureXs = [50, 130, 210, 290];
    const featureY = 140;
    const features = NB.features;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
        {/* Class node */}
        <circle cx={classX} cy={classY} r={r} fill="var(--accent)" opacity="0.15" stroke="var(--accent)" strokeWidth="2" />
        <text x={classX} y={classY + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--accent)" fontFamily="inherit">Class</text>

        {/* Feature nodes and edges from Class */}
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
              <text x={fx} y={fy - 4} textAnchor="middle" fontSize="8" fill="var(--ink-2)" fontFamily="inherit">
                x{i + 1}
              </text>
              <text x={fx} y={fy + 7} textAnchor="middle" fontSize="7" fill="var(--ink-2)" fontFamily="inherit">
                {f.split('_').slice(0, 2).join(' ')}
              </text>
            </g>
          );
        })}

        {/* No edges between features (naive assumption) */}
        {showFeatureEdges && (
          <g opacity="0.3">
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
          {showFeatureEdges ? "real correlations (ignored by Naive Bayes)" : "no edges between features (independence assumption)"}
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
            <b>Naive Bayes</b> is a probabilistic classifier based on <b>Bayes' theorem</b>. It predicts
            the most likely class by computing <V>P(class | features)</V>, combining
            <V> P(features | class)</V> × <V>P(class)</V>. It's called "naive" because it assumes
            all features are <b>conditionally independent</b> given the class.
          </Lead>

          <div className="tf-archwrap">
            <div className="tf-arch">
              <div className="tf-arch-io">
                Input <b>x</b> = [has_link, has_money, is_short, known_sender]
                <span>binary feature vector — one email to classify</span>
              </div>
              <div className="tf-arch-f"><b>Compute P(class | x) via Bayes' theorem</b></div>
              <div className="tf-arch-row">
                <span className="tf-sym">prior</span> — P(ham), P(spam) from training counts
              </div>
              <div className="tf-arch-f"><b>P(x | C) = Π P(xⱼ | C)</b></div>
              <div className="tf-arch-row">
                <span className="tf-sym">likelihood</span> — product of per-feature probabilities
              </div>
              <div className="tf-arch-f"><b>posterior ∝ prior × likelihood</b></div>
              <div className="tf-arch-io tf-arch-io--out">
                Predicted class — argmax P(C | x)
                <span>the class with the highest posterior probability</span>
              </div>
            </div>
          </div>

          <div className="tf-subhead">Symbol key</div>
          <div className="tf-legend">
            {[
              ["x", "feature vector", "[binary]", "the input email's 4 binary features"],
              ["C", "class variable", "ham/spam", "the target label we're predicting"],
              ["P(C)", "prior", "scalar", "baseline probability of each class from training data"],
              ["P(x|C)", "likelihood", "scalar", "probability of seeing these features given the class"],
              ["P(C|x)", "posterior", "scalar", "the probability we ultimately want — P(class | this email)"],
              ["α", "Laplace smoothing", "=1", "pseudocount added to avoid zero probabilities"],
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
              <div className="tf-life-head">Training</div>
              <div className="tf-life-body">Count class frequencies → compute priors<br />Count feature-class co-occurrences → likelihoods<br />Apply Laplace smoothing<br /><b>O(n·d)</b> — extremely fast</div>
            </div>
            <div className="tf-life tf-life--infer">
              <div className="tf-life-head">Inference</div>
              <div className="tf-life-body">For each class: compute log-posterior<br />log P(C) + Σ log P(xⱼ|C)<br />Normalize → probabilities<br /><b>Predict: argmax P(C|x)</b></div>
            </div>
          </div>

          <Note>
            Toggle the <b>feature buttons</b> above to change the email being classified.
            Every number on every step recomputes live. Press <b>Next →</b> to walk through
            the full algorithm.
          </Note>
        </>
      ),
    },

    /* ── Stage 2: Dataset ──────────────────────────────────── */
    {
      id: "dataset",
      group: "Data",
      title: "The Training Dataset",
      map: "Dataset",
      why: "We need labeled examples to estimate the prior and likelihood probabilities. Understanding the data helps us know what the model can learn and where it might fail.",
      render: (trace) => {
        const { cfg } = trace;
        const hamRows = cfg.data.filter(r => r[4] === 0);
        const spamRows = cfg.data.filter(r => r[4] === 1);

        return (
          <>
            <Lead>
              Our dataset contains <b>10 emails</b>, each described by 4 binary features.
              5 are <b>ham</b> (legitimate) and 5 are <b>spam</b>. We'll train the classifier
              by counting how often each feature appears in each class.
            </Lead>

            <Row>
              <div style={{ flex: '1 1 400px' }}>
                <div className="tf-subhead">All 10 training emails</div>
                <Matrix
                  data={cfg.data.map(r => [...r.slice(0, 4), r[4]])}
                  rowLabels={cfg.data.map((_, i) => `email ${i + 1}`)}
                  colLabels={[...cfg.features.map(fLabel), 'label']}
                  caption="Training data"
                  sub="10 emails × 4 features + label"
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
                        <div className="tf-tip-sum">{v === 1 ? 'yes (present)' : 'no (absent)'}</div>
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
                  <div className="nn-calc-row">Balanced dataset</div>
                </div>
              </div>
            </Row>

            <div className="tf-subhead">Feature presence per class</div>
            <Row>
              {cfg.features.map((f, fi) => {
                const hamCount = hamRows.filter(r => r[fi] === 1).length;
                const spamCount = spamRows.filter(r => r[fi] === 1).length;
                return (
                  <div key={f} className="nn-calc" style={{ flex: '1 1 130px' }}>
                    <div className="nn-calc-h">{fLabel(f)}</div>
                    <div className="nn-calc-row" style={{ color: '#1f9e6b' }}>ham: {hamCount}/5</div>
                    <div className="nn-calc-row" style={{ color: '#e0518f' }}>spam: {spamCount}/5</div>
                  </div>
                );
              })}
            </Row>

            <Note>
              Notice that <b>known_sender</b> is always 1 in ham and always 0 in spam —
              it's a very discriminative feature. <b>has_link</b> appears in both classes
              (once in ham), so it's less decisive. Laplace smoothing (next stages) handles
              features with zero counts.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 3: Bayes' Theorem ───────────────────────────── */
    {
      id: "bayes-theorem",
      group: "Theory",
      title: "Bayes' Theorem — The Core Formula",
      map: "Bayes' Theorem",
      why: "Bayes' theorem is the mathematical backbone of this classifier. It lets us invert conditional probabilities: turn P(features | class) into P(class | features).",
      render: (trace) => (
        <>
          <Lead>
            Bayes' theorem relates the <b>posterior</b> P(C|x) to the
            <b> likelihood</b> P(x|C) and <b>prior</b> P(C). We can't directly observe
            P(class | email), but we can estimate P(email | class) from training data and
            invert it using Bayes' theorem.
          </Lead>

          <Formula label="Bayes' Theorem">
            <span style={{ fontSize: '1.15em' }}>
              <V>P</V>(<V>C</V> | <V>x</V>) ={' '}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 2 }}>
                  <V>P</V>(<V>x</V> | <V>C</V>) &nbsp;×&nbsp; <V>P</V>(<V>C</V>)
                </span>
                <span style={{ paddingTop: 4 }}><V>P</V>(<V>x</V>)</span>
              </span>
            </span>
          </Formula>

          <Row>
            <div className="nn-calc" style={{ flex: '1 1 180px' }}>
              <div className="nn-calc-h" style={{ color: 'var(--accent)' }}>P(C | x) — Posterior</div>
              <div className="nn-calc-row">What we WANT to compute</div>
              <div className="nn-calc-row">P(email is spam | its features)</div>
              <div className="nn-calc-row" style={{ color: 'var(--accent)', fontWeight: 700 }}>The output of classification</div>
            </div>
            <div className="nn-calc" style={{ flex: '1 1 180px' }}>
              <div className="nn-calc-h" style={{ color: '#2b5bff' }}>P(x | C) — Likelihood</div>
              <div className="nn-calc-row">Estimated from training data</div>
              <div className="nn-calc-row">P(has_link=1 | spam) = 0.71</div>
              <div className="nn-calc-row" style={{ color: '#2b5bff', fontWeight: 700 }}>Product of per-feature probs</div>
            </div>
            <div className="nn-calc" style={{ flex: '1 1 180px' }}>
              <div className="nn-calc-h" style={{ color: '#1f9e6b' }}>P(C) — Prior</div>
              <div className="nn-calc-row">Baseline class probability</div>
              <div className="nn-calc-row">P(spam) = 5/10 = 0.5</div>
              <div className="nn-calc-row" style={{ color: '#1f9e6b', fontWeight: 700 }}>Computed from class counts</div>
            </div>
            <div className="nn-calc" style={{ flex: '1 1 180px' }}>
              <div className="nn-calc-h" style={{ color: 'var(--muted)' }}>P(x) — Evidence</div>
              <div className="nn-calc-row">Same for all classes</div>
              <div className="nn-calc-row">We can ignore it!</div>
              <div className="nn-calc-row" style={{ color: 'var(--muted)', fontWeight: 700 }}>Cancels in argmax</div>
            </div>
          </Row>

          <div className="tf-subhead">Bayesian network — conditional independence</div>
          <Row>
            <div style={{ flex: '1 1 340px' }}>
              <BayesianNetwork showFeatureEdges={false} />
            </div>
            <div style={{ flex: '1 1 240px' }}>
              <div className="nn-calc">
                <div className="nn-calc-h">Why ignore P(x)?</div>
                <div className="nn-calc-row">We want: argmax<sub>C</sub> P(C|x)</div>
                <div className="nn-calc-row">P(x) is the same for all C</div>
                <div className="nn-calc-row">So we compute:</div>
                <div className="nn-calc-row"><b>P(C|x) ∝ P(x|C) · P(C)</b></div>
                <div className="nn-calc-row" style={{ marginTop: 8, color: 'var(--ink-2)' }}>
                  Then normalize to get true probabilities
                </div>
              </div>
            </div>
          </Row>

          <Note>
            The Bayesian network diagram shows each feature depending only on the class node —
            no direct edges between features. This is exactly the "naive" independence
            assumption that makes computation tractable.
          </Note>
        </>
      ),
    },

    /* ── Stage 4: Class Priors P(C) ────────────────────────── */
    {
      id: "priors",
      group: "Theory",
      title: "Class Priors P(C) — Before Seeing Any Features",
      map: "Priors P(C)",
      why: "The prior captures our baseline belief about each class before observing any features. In spam filtering, if 90% of emails are ham, that prior heavily influences predictions.",
      render: (trace) => {
        const { priors, classCounts, cfg } = trace;

        return (
          <>
            <Lead>
              The <b>prior probability</b> P(C) is the fraction of training examples belonging
              to each class. It represents our belief about class frequency <em>before</em> seeing
              any features. With a balanced dataset, both classes start equally likely.
            </Lead>

            <Formula label="Prior probability">
              <V>P</V>(<V>C</V>) ={' '}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 2 }}>count of class C in training</span>
                <span style={{ paddingTop: 4 }}>total training examples</span>
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
                  <div className="nn-calc-h">Prior computation</div>
                  <div className="nn-calc-row">Total emails n = {cfg.data.length}</div>
                  <div className="nn-calc-row" style={{ color: '#1f9e6b' }}>
                    P(ham) = {classCounts[0]} / {cfg.data.length} = <b>{fmt(priors[0], 2)}</b>
                  </div>
                  <div className="nn-calc-row" style={{ color: '#e0518f' }}>
                    P(spam) = {classCounts[1]} / {cfg.data.length} = <b>{fmt(priors[1], 2)}</b>
                  </div>
                  <div className="nn-calc-row" style={{ borderTop: '1px solid var(--line)', paddingTop: 6 }}>
                    log P(ham) = <b>{fmt(Math.log(priors[0]), 3)}</b>
                  </div>
                  <div className="nn-calc-row">
                    log P(spam) = <b>{fmt(Math.log(priors[1]), 3)}</b>
                  </div>
                </div>
              </div>
              <div style={{ flex: '1 1 220px' }}>
                <div className="tf-subhead">Imbalanced dataset example</div>
                <div className="nn-calc">
                  <div className="nn-calc-h">If 9 ham, 1 spam:</div>
                  <div className="nn-calc-row" style={{ color: '#1f9e6b' }}>P(ham) = 9/10 = <b>0.90</b></div>
                  <div className="nn-calc-row" style={{ color: '#e0518f' }}>P(spam) = 1/10 = <b>0.10</b></div>
                  <div className="nn-calc-row" style={{ marginTop: 8, color: 'var(--ink-2)' }}>
                    Strong prior → model biased toward ham even with spam-like features
                  </div>
                  <div className="nn-calc-row" style={{ color: 'var(--ink-2)' }}>
                    Fix: use class weights or oversample minority class
                  </div>
                </div>
              </div>
            </Row>

            <div className="tf-subhead">Using log-probabilities</div>
            <div className="nn-calc">
              <div className="nn-calc-h">Why use logarithms?</div>
              <div className="nn-calc-row">
                Multiplying many small probabilities → numerical underflow (0.001 × 0.001 × ... ≈ 0)
              </div>
              <div className="nn-calc-row">
                log(a × b) = log(a) + log(b) — additions are numerically stable
              </div>
              <div className="nn-calc-row">
                argmax P(C|x) = argmax log P(C|x) — maximizing log preserves the argmax
              </div>
              <div className="nn-calc-row">
                <b>We always work in log-space and convert back at the end</b>
              </div>
            </div>

            <Note>
              In our balanced dataset P(ham) = P(spam) = 0.5, so the prior doesn't tip the
              scales. The <b>likelihood</b> (next step) is what distinguishes the two classes.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 5: Likelihood P(xⱼ | C) ──────────────────────── */
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
              For each feature <V>xⱼ</V> and each class <V>C</V>, we estimate
              <V> P(xⱼ=1 | C)</V> — the probability the feature is present given the class.
              <b> Laplace smoothing</b> (α=1) prevents zero probabilities.
            </Lead>

            <Formula label="Laplace-smoothed likelihood">
              <V>P</V>(<V>x</V><Sub>j</Sub>=1 | <V>C</V>) ={' '}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 2 }}>
                  count(<V>x</V><Sub>j</Sub>=1, <V>C</V>) + α
                </span>
                <span style={{ paddingTop: 4 }}>count(<V>C</V>) + 2α</span>
              </span>
            </Formula>

            <div className="tf-subhead">Example: P(has_link=1 | spam)</div>
            <div className="nn-calc">
              <div className="nn-calc-h">Step-by-step with Laplace smoothing (α=1)</div>
              <div className="nn-calc-row">Spam emails with has_link=1: count = {likelihoodCounts[1][0]}</div>
              <div className="nn-calc-row">Total spam emails: {classCounts[1]}</div>
              <div className="nn-calc-row">= ({likelihoodCounts[1][0]} + 1) / ({classCounts[1]} + 2) = {likelihoodCounts[1][0] + 1} / {classCounts[1] + 2}</div>
              <div className="nn-calc-row"><b>= {fmt(likelihoods[1][0], 3)} ({((likelihoods[1][0]) * 100).toFixed(0)}%)</b></div>
            </div>

            <div className="tf-subhead">Full likelihood table P(xⱼ=1 | C)</div>
            <Matrix
              data={cfg.features.map((_, fi) => [
                likelihoods[0][fi],
                likelihoods[1][fi],
                likelihoodCounts[0][fi],
                likelihoodCounts[1][fi],
              ])}
              rowLabels={cfg.features.map(fLabel)}
              colLabels={['P(·|ham)', 'P(·|spam)', 'ham count', 'spam count']}
              caption="Likelihood table"
              sub="with Laplace smoothing α=1"
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
                      <div className="tf-tip-sum">= <b>{fmt(v, 3)}</b></div>
                    </div>
                  );
                }
                return (
                  <div>
                    <div className="tf-tip-title">Raw count</div>
                    <div className="tf-tip-sum">{v} emails with this feature</div>
                  </div>
                );
              }}
            />

            <div className="tf-subhead">Reading the table</div>
            <Row>
              {cfg.features.map((f, fi) => {
                const hamP = likelihoods[0][fi];
                const spamP = likelihoods[1][fi];
                const diff = spamP - hamP;
                const signal = Math.abs(diff) > 0.3 ? 'strong' : Math.abs(diff) > 0.1 ? 'moderate' : 'weak';
                const favors = diff > 0 ? 'spam' : 'ham';
                return (
                  <div key={f} className="nn-calc" style={{ flex: '1 1 140px' }}>
                    <div className="nn-calc-h">{fLabel(f)}</div>
                    <div className="nn-calc-row" style={{ color: '#1f9e6b' }}>ham: {fmt(hamP, 2)}</div>
                    <div className="nn-calc-row" style={{ color: '#e0518f' }}>spam: {fmt(spamP, 2)}</div>
                    <div className="nn-calc-row" style={{ color: 'var(--ink-2)', fontSize: 11 }}>
                      {signal} signal → {favors}
                    </div>
                  </div>
                );
              })}
            </Row>

            <Note>
              Without Laplace smoothing, <b>known_sender=1 for spam</b> would be 0/5 = 0.
              One zero multiplied through the likelihood product → posterior = 0, killing
              all evidence. α=1 gives every feature a minimum probability floor.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 6: Naive Independence Assumption ─────────────── */
    {
      id: "independence",
      group: "Theory",
      title: 'The "Naive" Assumption — Conditional Independence',
      map: "Independence",
      why: "This is the most important conceptual insight in Naive Bayes: despite being mathematically incorrect for most real data, assuming independence usually works surprisingly well in practice.",
      render: (trace) => (
        <>
          <Lead>
            The "naive" in Naive Bayes means we assume all features are <b>conditionally
            independent</b> given the class. This simplifies the joint likelihood into
            a product of individual likelihoods, making computation tractable.
          </Lead>

          <Formula label="Joint likelihood (exact)">
            <V>P</V>(<V>x</V><Sub>1</Sub>, <V>x</V><Sub>2</Sub>, … <V>x</V><Sub>d</Sub> | <V>C</V>) = (complex joint distribution with correlations)
          </Formula>

          <Formula label="Naive Bayes assumption">
            <V>P</V>(<V>x</V><Sub>1</Sub>, …, <V>x</V><Sub>d</Sub> | <V>C</V>) ≈{' '}
            <span style={{ fontSize: '1.2em' }}>∏</span>
            <Sub>j=1</Sub><Sup>d</Sup> <V>P</V>(<V>x</V><Sub>j</Sub> | <V>C</V>)
          </Formula>

          <Row>
            <div style={{ flex: '1 1 340px' }}>
              <div className="tf-subhead">Bayesian network: naive model</div>
              <BayesianNetwork showFeatureEdges={false} />
            </div>
            <div style={{ flex: '1 1 340px' }}>
              <div className="tf-subhead">Real correlations (ignored)</div>
              <BayesianNetwork showFeatureEdges={true} />
            </div>
          </Row>

          <div className="tf-subhead">Why does it still work?</div>
          <div className="tf-legend">
            {[
              ["1", "Decision boundary", "practical", "Even with wrong probabilities, the argmax (predicted class) is often correct. The model just needs to rank classes correctly, not estimate calibrated probabilities."],
              ["2", "Many features cancel", "empirical", "Feature correlations often affect both classes equally. When correlations are symmetric, the naive assumption errors cancel out in the posterior ratio."],
              ["3", "Regularization effect", "theoretical", "Strong independence assumption acts like implicit regularization — it reduces variance at the cost of some bias, helping on small datasets."],
              ["4", "Text/spam domains", "domain", "In email spam, features like has_link and has_money are genuinely semi-independent given spam — the model's assumptions are not wildly off."],
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

          <div className="tf-subhead">Example of violated independence</div>
          <div className="nn-calc">
            <div className="nn-calc-h">has_link and has_money are correlated in spam</div>
            <div className="nn-calc-row">In our data: spam emails often have both (3 out of 5)</div>
            <div className="nn-calc-row">P(has_link=1 AND has_money=1 | spam) = 3/5 = 0.60</div>
            <div className="nn-calc-row">Naive assumption: P(has_link|spam) × P(has_money|spam) = {fmt(trace.likelihoods[1][0], 2)} × {fmt(trace.likelihoods[1][1], 2)} = {fmt(trace.likelihoods[1][0] * trace.likelihoods[1][1], 3)}</div>
            <div className="nn-calc-row" style={{ color: 'var(--ink-2)' }}>
              {fmt(trace.likelihoods[1][0] * trace.likelihoods[1][1], 3)} ≠ 0.60 — correlation is ignored, but prediction often correct anyway
            </div>
          </div>

          <Note>
            The independence assumption makes Naive Bayes a <b>O(n·d)</b> algorithm
            — training complexity is just counting. Without it, the full joint
            distribution would require exponential storage.
          </Note>
        </>
      ),
    },

    /* ── Stage 7: Computing the Posterior ──────────────────── */
    {
      id: "posterior",
      group: "Inference",
      title: "Computing the Posterior — Log-Sum",
      map: "Log-Posterior",
      why: "This is the core inference step: combine the prior and all feature likelihoods into a single score per class. Using logs turns multiplications into additions, preventing numerical underflow.",
      render: (trace) => {
        const { priors, likelihoods, logPosts, logLikTerms, x, cfg } = trace;

        return (
          <>
            <Lead>
              For each class <V>C</V>, compute the <b>log-posterior</b> by summing
              log(prior) + all log-likelihood terms. The class with the higher log-posterior wins.
              Current input: {cfg.features.map((f, i) => `${fLabel(f)}=${x[i]}`).join(', ')}.
            </Lead>

            <Formula label="Log-posterior">
              log <V>P</V>(<V>C</V> | <V>x</V>) ∝ log <V>P</V>(<V>C</V>) +{' '}
              <span style={{ fontSize: '1.1em' }}>∑</span><Sub>j</Sub> log <V>P</V>(<V>x</V><Sub>j</Sub> | <V>C</V>)
            </Formula>

            <Row>
              {cfg.labels.map((lbl, c) => {
                const color = c === 0 ? '#1f9e6b' : '#e0518f';
                return (
                  <div key={lbl} className="nn-calc" style={{ flex: '1 1 260px' }}>
                    <div className="nn-calc-h" style={{ color }}>log P({lbl} | x) step by step</div>
                    <div className="nn-calc-row">log P({lbl}) = log({fmt(priors[c], 2)}) = <b>{fmt(Math.log(priors[c]), 3)}</b></div>
                    {cfg.features.map((f, fi) => {
                      const xi = x[fi];
                      const p = likelihoods[c][fi];
                      const logp = xi === 1 ? Math.log(p) : Math.log(1 - p);
                      return (
                        <div key={f} className="nn-calc-row">
                          log P({fLabel(f)}={xi} | {lbl}) = log({fmt(xi === 1 ? p : 1 - p, 3)}) = <b>{fmt(logp, 3)}</b>
                        </div>
                      );
                    })}
                    <div className="nn-calc-row" style={{ borderTop: '2px solid ' + color, paddingTop: 6, color, fontWeight: 700 }}>
                      Sum = <b>{fmt(logPosts[c], 4)}</b>
                    </div>
                  </div>
                );
              })}
            </Row>

            <div className="tf-subhead">All log-likelihood terms as a matrix</div>
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
              sub="each cell: log P(xⱼ=value | class)"
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

            <div className="tf-subhead">Log-posterior summary</div>
            <div className="nn-calc">
              <div className="nn-calc-h">Winner comparison</div>
              {cfg.labels.map((lbl, c) => (
                <div key={lbl} className="nn-calc-row" style={{ color: c === 0 ? '#1f9e6b' : '#e0518f' }}>
                  log P({lbl} | x) = {fmt(logPosts[c], 4)}
                </div>
              ))}
              <div className="nn-calc-row" style={{ fontWeight: 700, marginTop: 6 }}>
                Higher: <b>{cfg.labels[logPosts.indexOf(Math.max(...logPosts))]}</b> →
                predicted class before normalization
              </div>
            </div>

            <Note>
              Hover any cell in the matrix to see the exact log-probability calculation.
              Larger (less negative) log-posterior = more likely class. Toggle features above
              to see all terms update live.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 8: Final Prediction ─────────────────────────── */
    {
      id: "prediction",
      group: "Inference",
      title: "Final Prediction — Normalizing to Probabilities",
      map: "Prediction",
      why: "The raw log-posteriors tell us which class wins, but converting them to probabilities gives calibrated confidence values that are more useful in practice.",
      render: (trace) => {
        const { posteriors, label, logPosts, cfg } = trace;
        const predLabel = cfg.labels[label];
        const isSpam = label === 1;

        return (
          <>
            <Lead>
              Convert log-posteriors to probabilities using the <b>softmax / log-sum-exp</b>
              trick — subtract the maximum log-value for numerical stability, exponentiate,
              then normalize. The class with P &gt; 0.5 is the prediction.
            </Lead>

            <Formula label="Softmax normalization">
              <V>P</V>(<V>C</V><Sub>i</Sub> | <V>x</V>) ={' '}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 2 }}>
                  exp(log P(<V>C</V><Sub>i</Sub> | <V>x</V>) − max)
                </span>
                <span style={{ paddingTop: 4 }}>
                  Σ<Sub>k</Sub> exp(log P(<V>C</V><Sub>k</Sub> | <V>x</V>) − max)
                </span>
              </span>
            </Formula>

            <div className="nn-calc">
              <div className="nn-calc-h">Step-by-step normalization</div>
              <div className="nn-calc-row">log P(ham|x) = {fmt(logPosts[0], 4)}</div>
              <div className="nn-calc-row">log P(spam|x) = {fmt(logPosts[1], 4)}</div>
              <div className="nn-calc-row">max = {fmt(Math.max(...logPosts), 4)}</div>
              {cfg.labels.map((lbl, c) => {
                const shifted = logPosts[c] - Math.max(...logPosts);
                return (
                  <div key={lbl} className="nn-calc-row">
                    exp({fmt(logPosts[c], 4)} − {fmt(Math.max(...logPosts), 4)}) = exp({fmt(shifted, 4)}) = {fmt(Math.exp(shifted), 4)}
                  </div>
                );
              })}
              <div className="nn-calc-row" style={{ borderTop: '1px solid var(--line)', paddingTop: 6 }}>
                sum of exp values = {fmt(cfg.labels.reduce((s, _, c) => s + Math.exp(logPosts[c] - Math.max(...logPosts)), 0), 4)}
              </div>
            </div>

            <div className="tf-subhead">Posterior probabilities</div>
            <PosteriorBars posteriors={posteriors} labels={cfg.labels} />

            <div style={{
              marginTop: 16, padding: '14px 20px', borderRadius: 10,
              background: isSpam ? 'rgba(var(--neg-rgb), 0.1)' : 'rgba(var(--pos-rgb), 0.1)',
              border: `2px solid ${isSpam ? 'var(--neg)' : 'var(--pos)'}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 4 }}>Prediction</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: isSpam ? 'var(--neg)' : 'var(--pos)', letterSpacing: 1 }}>
                {predLabel.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>
                confidence: {(Math.max(...posteriors) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="tf-subhead">Decision boundary intuition</div>
            <div className="nn-calc">
              <div className="nn-calc-h">When does the prediction flip?</div>
              <div className="nn-calc-row">
                Predicts spam when: log P(spam|x) {'>'} log P(ham|x)
              </div>
              <div className="nn-calc-row">
                i.e., log P(spam) + Σ log P(xⱼ|spam) {'>'} log P(ham) + Σ log P(xⱼ|ham)
              </div>
              <div className="nn-calc-row" style={{ color: 'var(--ink-2)' }}>
                Toggle features above to see the prediction change in real time
              </div>
            </div>

            <Note icon="★">
              Try setting <b>known_sender=yes</b> — it's a very strong ham indicator and
              often flips the prediction regardless of other features. This is because
              P(known_sender=1 | ham) ≈ 0.86 vs P(known_sender=1 | spam) ≈ 0.14.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 9: Gaussian Naive Bayes ──────────────────────── */
    {
      id: "gaussian",
      group: "Extensions",
      title: "Gaussian Naive Bayes — Continuous Features",
      map: "Gaussian NB",
      why: "Real-world features are often continuous (age, income, temperature). Gaussian NB assumes each feature follows a normal distribution per class, estimated from training data means and variances.",
      render: (trace) => {
        // Illustrative Gaussian parameters for a hypothetical continuous feature
        const gaussians = [
          { label: 'ham', mu: 2.1, sigma: 0.8, color: '#1f9e6b' },
          { label: 'spam', mu: 4.5, sigma: 1.1, color: '#e0518f' },
        ];
        const W = 420, H = 200;
        const padL = 40, padR = 20, padT = 30, padB = 36;
        const xMin = -1, xMax = 8;
        const yScale = 0.55; // max y-axis value

        return (
          <>
            <Lead>
              When features are <b>continuous</b> (e.g., email length in words, number of
              exclamation marks), we model each P(xⱼ | C) as a <b>Gaussian distribution</b>
              with class-specific mean μⱼc and variance σ²ⱼc estimated from training data.
            </Lead>

            <Formula label="Gaussian likelihood">
              <V>P</V>(<V>x</V><Sub>j</Sub> | <V>C</V>) ={' '}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 2 }}>
                  1
                </span>
                <span style={{ paddingTop: 4 }}>
                  σ<Sub>jc</Sub> √(2π)
                </span>
              </span>
              &nbsp;exp&nbsp;
              <span style={{ fontSize: '1.1em' }}>(−</span>
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 2 }}>
                  (<V>x</V><Sub>j</Sub> − μ<Sub>jc</Sub>)<Sup>2</Sup>
                </span>
                <span style={{ paddingTop: 4 }}>2σ²<Sub>jc</Sub></span>
              </span>
              <span style={{ fontSize: '1.1em' }}>)</span>
            </Formula>

            <div className="tf-subhead">Example: "email length" feature</div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
              {/* Grid */}
              {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map(v => {
                const y = padT + (H - padB - padT) - ((v / yScale) * (H - padB - padT));
                return (
                  <line key={v} x1={padL} y1={y} x2={W - padR} y2={y}
                    stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />
                );
              })}
              {/* Axes */}
              <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="var(--ink)" strokeWidth="1.5" />
              <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="var(--ink)" strokeWidth="1.5" />
              {/* X labels */}
              {[-1, 0, 1, 2, 3, 4, 5, 6, 7, 8].map(xv => {
                const svgX = padL + ((xv - xMin) / (xMax - xMin)) * (W - padL - padR);
                return (
                  <g key={xv}>
                    <line x1={svgX} y1={H - padB} x2={svgX} y2={H - padB + 4} stroke="var(--ink)" strokeWidth="1" />
                    <text x={svgX} y={H - padB + 14} textAnchor="middle" fontSize="10" fill="var(--ink-2)" fontFamily="inherit">{xv}</text>
                  </g>
                );
              })}
              <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--ink-2)" fontFamily="inherit">email length (hundreds of words)</text>
              <text x={8} y={H / 2} textAnchor="middle" fontSize="11" fill="var(--ink-2)" fontFamily="inherit" transform={`rotate(-90,11,${H / 2})`}>P(length | C)</text>
              {/* Gaussian curves */}
              {gaussians.map(g => (
                <GaussianCurve key={g.label}
                  mu={g.mu} sigma={g.sigma} color={g.color} label={g.label}
                  xMin={xMin} xMax={xMax} svgWidth={W} svgHeight={H}
                  padL={padL} padR={padR} padT={padT} padB={padB} yScale={yScale}
                />
              ))}
            </svg>

            <Row>
              {gaussians.map(g => (
                <div key={g.label} className="nn-calc" style={{ flex: '1 1 180px' }}>
                  <div className="nn-calc-h" style={{ color: g.color }}>{g.label} distribution</div>
                  <div className="nn-calc-row">μ = {g.mu} (mean length)</div>
                  <div className="nn-calc-row">σ = {g.sigma} (std deviation)</div>
                  <div className="nn-calc-row">Peak P = {fmt(1 / (g.sigma * Math.sqrt(2 * Math.PI)), 3)}</div>
                  <div className="nn-calc-row" style={{ color: 'var(--ink-2)', fontSize: 11 }}>
                    {g.label === 'ham' ? 'Ham emails tend to be shorter' : 'Spam emails tend to be longer with wider variance'}
                  </div>
                </div>
              ))}
            </Row>

            <div className="tf-subhead">Training Gaussian NB</div>
            <div className="nn-calc">
              <div className="nn-calc-h">Parameter estimation</div>
              <div className="nn-calc-row">For each class C and each feature j:</div>
              <div className="nn-calc-row">μⱼc = (1/nC) Σᵢ xⱼ⁽ⁱ⁾ where y⁽ⁱ⁾=C</div>
              <div className="nn-calc-row">σ²ⱼc = (1/nC) Σᵢ (xⱼ⁽ⁱ⁾ − μⱼc)² where y⁽ⁱ⁾=C</div>
              <div className="nn-calc-row" style={{ color: 'var(--ink-2)' }}>
                One mean and variance per (feature, class) pair — that's 2 × d × K parameters
              </div>
            </div>

            <Note>
              At the decision boundary, P(ham|x) = P(spam|x). The boundary is a
              <b> quadratic surface</b> in feature space when classes have different variances,
              or a <b>linear surface</b> when variances are equal (Linear Discriminant Analysis).
            </Note>
          </>
        );
      },
    },

    /* ── Stage 10: Laplace Smoothing ───────────────────────── */
    {
      id: "laplace",
      group: "Extensions",
      title: "Laplace Smoothing — Handling Zero Counts",
      map: "Laplace Smoothing",
      why: "A single unseen feature combination can zero out the entire posterior. Laplace smoothing is a simple fix that prevents this catastrophic failure without requiring complex approximations.",
      render: (trace) => {
        const { likelihoodCounts, classCounts, likelihoods, cfg } = trace;

        return (
          <>
            <Lead>
              If a feature-class combination never appears in training data, its estimated
              probability is 0. One zero in the product kills the entire posterior —
              log(0) = −∞. <b>Laplace smoothing</b> adds a pseudocount α (usually 1)
              to every count before dividing.
            </Lead>

            <div className="tf-subhead">The zero-probability problem</div>
            <div className="nn-calc">
              <div className="nn-calc-h">Without smoothing (dangerous!)</div>
              <div className="nn-calc-row">Training: known_sender never =1 in spam emails (count = 0)</div>
              <div className="nn-calc-row">P(known_sender=1 | spam) = 0/5 = <b style={{ color: 'var(--neg)' }}>0.000</b></div>
              <div className="nn-calc-row">log(0) = <b style={{ color: 'var(--neg)' }}>−∞</b></div>
              <div className="nn-calc-row">log P(spam|x) = log P(spam) + ... + (−∞) = <b style={{ color: 'var(--neg)' }}>−∞</b></div>
              <div className="nn-calc-row" style={{ color: 'var(--neg)' }}>
                Result: ALWAYS predicts ham regardless of all other features!
              </div>
            </div>

            <Formula label="Without Laplace (broken)">
              <V>P</V>(<V>x</V><Sub>j</Sub>=1 | <V>C</V>) ={' '}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 2 }}>count(<V>x</V><Sub>j</Sub>=1, <V>C</V>)</span>
                <span style={{ paddingTop: 4 }}>count(<V>C</V>)</span>
              </span>
            </Formula>

            <Formula label="With Laplace smoothing (fixed)">
              <V>P</V>(<V>x</V><Sub>j</Sub>=1 | <V>C</V>) ={' '}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
                <span style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 2 }}>
                  count(<V>x</V><Sub>j</Sub>=1, <V>C</V>) + <b>α</b>
                </span>
                <span style={{ paddingTop: 4 }}>count(<V>C</V>) + <b>2α</b></span>
              </span>
              &nbsp; (α=1)
            </Formula>

            <div className="tf-subhead">Before vs after smoothing</div>
            <Matrix
              data={cfg.features.map((_, fi) => {
                return cfg.labels.map((_, c) => {
                  const cnt = likelihoodCounts[c][fi];
                  const rawP = cnt / classCounts[c];
                  const smoothedP = likelihoods[c][fi];
                  return smoothedP;
                });
              }).concat(cfg.features.map((_, fi) => {
                return cfg.labels.map((_, c) => {
                  const cnt = likelihoodCounts[c][fi];
                  return cnt / classCounts[c];
                });
              }))}
              rowLabels={[
                ...cfg.features.map(f => `[smooth] ${fLabel(f)}`),
                ...cfg.features.map(f => `[raw] ${fLabel(f)}`),
              ]}
              colLabels={cfg.labels.map(l => `P(·|${l})`)}
              caption="Smoothed vs raw likelihoods"
              sub="top: with α=1, bottom: without"
              heat={true}
              cellTip={(i, j, v) => {
                const isSmoothed = i < cfg.features.length;
                const fi = i % cfg.features.length;
                const cnt = likelihoodCounts[j][fi];
                return (
                  <div>
                    <div className="tf-tip-title">
                      {isSmoothed ? 'Smoothed' : 'Raw'} P({fLabel(cfg.features[fi])}=1 | {cfg.labels[j]})
                    </div>
                    {isSmoothed
                      ? <div className="tf-tip-calc">({cnt} + 1) / ({classCounts[j]} + 2)</div>
                      : <div className="tf-tip-calc">{cnt} / {classCounts[j]}</div>
                    }
                    <div className="tf-tip-sum">= <b>{fmt(v, 3)}</b></div>
                  </div>
                );
              }}
            />

            <div className="tf-subhead">Effect of different α values</div>
            <div className="nn-calc">
              <div className="nn-calc-h">P(known_sender=1 | spam) for various α</div>
              {[0, 0.5, 1, 2, 5].map(alpha => {
                const cnt = likelihoodCounts[1][3]; // known_sender for spam
                const total = classCounts[1];
                const p = (cnt + alpha) / (total + 2 * alpha);
                return (
                  <div key={alpha} className="nn-calc-row"
                    style={{ color: alpha === 0 ? 'var(--neg)' : alpha === 1 ? 'var(--accent)' : 'inherit' }}>
                    α={alpha}: ({cnt}+{alpha})/({total}+{2 * alpha}) = {fmt(p, 4)}
                    {alpha === 0 && ' ← zero! '}
                    {alpha === 1 && ' ← standard Laplace'}
                  </div>
                );
              })}
            </div>

            <Note>
              Larger α values push all probabilities toward 0.5 (uniform), adding
              more regularization but potentially washing out strong signals. α=1
              (Laplace) is the standard default — it corresponds to assuming you
              saw one extra example of each outcome before collecting data.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 11: Assumptions & When to Use ───────────────── */
    {
      id: "assumptions",
      group: "Evaluation",
      title: "Assumptions, Pros & Cons — When to Use Naive Bayes",
      map: "Assumptions",
      why: "Every model has assumptions. Knowing when Naive Bayes is the right tool — and when to reach for something more complex — is core ML practitioner knowledge.",
      render: (trace) => (
        <>
          <Lead>
            Naive Bayes makes strong independence assumptions that are usually violated
            in practice, yet it remains remarkably effective for many classification tasks,
            especially text. Knowing its strengths and failure modes is essential.
          </Lead>

          <div className="tf-subhead">Core assumptions</div>
          <div className="tf-legend">
            {[
              ["1", "Conditional independence", "key assumption", "Features are independent given the class. P(x₁,...,xd|C) = Π P(xⱼ|C). Almost never true in real data, but often good enough."],
              ["2", "Correct distribution family", "model assumption", "Binary/categorical NB assumes Bernoulli features; Gaussian NB assumes normally distributed features. Mismatch reduces accuracy."],
              ["3", "Training distribution = test distribution", "i.i.d.", "Naive Bayes assumes train and test come from the same distribution. Concept drift (e.g., evolving spam) degrades performance."],
              ["4", "Features are informative", "signal", "Works best when features carry real signal for the class. Irrelevant features add noise but are less harmful than in many other classifiers."],
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

          <div className="tf-subhead">Pros and cons</div>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">Strengths</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">Extremely fast training — O(n·d), just counting</li>
                <li className="opt-pc-li">Fast inference — O(d·K) per example</li>
                <li className="opt-pc-li">Works well with small training data</li>
                <li className="opt-pc-li">Naturally handles multiple classes</li>
                <li className="opt-pc-li">Outputs calibrated probabilities</li>
                <li className="opt-pc-li">Interpretable — inspect likelihood table directly</li>
                <li className="opt-pc-li">Robust to irrelevant features</li>
                <li className="opt-pc-li">State-of-the-art for spam and text classification</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">Weaknesses</div>
              <ul className="opt-pc-ul">
                <li className="opt-pc-li">Independence assumption rarely holds in practice</li>
                <li className="opt-pc-li">Can't model feature interactions (e.g., XOR patterns)</li>
                <li className="opt-pc-li">Posterior probabilities may be poorly calibrated</li>
                <li className="opt-pc-li">Gaussian NB sensitive to outliers in continuous features</li>
                <li className="opt-pc-li">Feature counts — Bernoulli NB ignores term frequency</li>
                <li className="opt-pc-li">Strong features dominate; correlated features double-counted</li>
              </ul>
            </div>
          </div>

          <div className="tf-subhead">When to use Naive Bayes</div>
          <div className="tf-legend">
            {[
              ["✓", "Text / spam classification", "recommended", "Multinomial or Bernoulli NB with TF-IDF is a strong baseline — fast, interpretable, competitive with complex models."],
              ["✓", "Real-time classification", "recommended", "O(d·K) inference makes NB one of the fastest classifiers at prediction time — ideal for streaming pipelines."],
              ["✓", "Small labeled datasets", "recommended", "With few examples, strong independence prior helps prevent overfitting better than discriminative models like logistic regression."],
              ["✓", "Multi-class problems", "recommended", "NB scales naturally to many classes — just add more priors and likelihood columns."],
              ["✗", "Strong feature correlations", "avoid", "Highly correlated features (e.g., word 'free' and 'discount' in spam) are double-counted, biasing probabilities."],
              ["✗", "Precise probability estimates needed", "avoid", "NB posteriors are often overconfident (very close to 0 or 1). Use Platt scaling or isotonic regression to recalibrate."],
            ].map(r => (
              <div className={"tf-leg" + (r[0] === "✗" ? "" : " is-learned")} key={r[1]}>
                <div className="tf-leg-top">
                  <span className="tf-sym">{r[0]}</span>
                  <span className="tf-leg-shape">{r[2]}</span>
                </div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <Note icon="★">
            You've completed the Naive Bayes walkthrough. The key insight:
            <b> probabilistic classifiers separate "what we count from data" (priors &amp; likelihoods)
            from "how we combine evidence" (Bayes' rule)</b>. Despite naive assumptions,
            this simple framework outperforms complex models on text tasks where training
            data is scarce and speed matters.
          </Note>
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
