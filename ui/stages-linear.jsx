/* ============================================================
   Linear Regression — all 10 explainer stages
   Requires: window.ML_LIN (from model/ml-linear.js)
             window.{ Matrix, V, Sub, Sup, Formula, Lead, Note,
                      Row, Arrow, Tag, fmt } (from matrix.jsx)
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState, useRef, useEffect } = React;
  const LIN = window.ML_LIN.LIN;

  /* ── scale helpers for SVG charts ────────────────────────── */
  const W = 420, H = 260;
  const PAD = { l: 46, r: 16, t: 14, b: 36 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;

  const scaleX = v => PAD.l + (v / 1.1) * plotW;
  const scaleY = v => PAD.t + plotH - ((v / 8.5) * plotH);

  /* ── scatter plot component ───────────────────────────────── */
  function ScatterPlot({ w, b, showLine = false, showResiduals = false, highlightIdx = -1 }) {
    const preds = LIN.xs.map(x => w * x + b);

    // regression line endpoints
    const x0 = 0, x1 = 1.05;
    const ly0 = w * x0 + b;
    const ly1 = w * x1 + b;

    const ptColors = ["#2b5bff", "#06a3c7", "#1f9e6b", "#e0851e", "#7c5cff", "#e0518f"];

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block" }}>
        {/* grid lines */}
        {[0, 2, 4, 6, 8].map(yv => (
          <line key={yv}
            x1={PAD.l} y1={scaleY(yv)}
            x2={W - PAD.r} y2={scaleY(yv)}
            stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />
        ))}
        {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(xv => (
          <line key={xv}
            x1={scaleX(xv)} y1={PAD.t}
            x2={scaleX(xv)} y2={H - PAD.b}
            stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />
        ))}

        {/* axes */}
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--ink)" strokeWidth="1.5" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--ink)" strokeWidth="1.5" />

        {/* axis labels */}
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--ink-2)" fontFamily="inherit">house size (normalized)</text>
        <text x={11} y={H / 2} textAnchor="middle" fontSize="11" fill="var(--ink-2)" fontFamily="inherit" transform={`rotate(-90, 11, ${H / 2})`}>price ($100k)</text>

        {/* y-axis ticks */}
        {[0, 2, 4, 6, 8].map(yv => (
          <g key={yv}>
            <line x1={PAD.l - 4} y1={scaleY(yv)} x2={PAD.l} y2={scaleY(yv)} stroke="var(--ink)" strokeWidth="1" />
            <text x={PAD.l - 6} y={scaleY(yv) + 4} textAnchor="end" fontSize="10" fill="var(--ink-2)" fontFamily="inherit">{yv}</text>
          </g>
        ))}

        {/* x-axis ticks */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(xv => (
          <g key={xv}>
            <line x1={scaleX(xv)} y1={H - PAD.b} x2={scaleX(xv)} y2={H - PAD.b + 4} stroke="var(--ink)" strokeWidth="1" />
            <text x={scaleX(xv)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--ink-2)" fontFamily="inherit">{xv.toFixed(1)}</text>
          </g>
        ))}

        {/* regression line */}
        {showLine && (
          <line
            x1={scaleX(x0)} y1={scaleY(Math.max(-1, Math.min(10, ly0)))}
            x2={scaleX(x1)} y2={scaleY(Math.max(-1, Math.min(10, ly1)))}
            stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
        )}

        {/* residuals */}
        {showResiduals && LIN.xs.map((x, i) => {
          const py = preds[i];
          const ty = LIN.ys[i];
          if (Math.abs(py - ty) < 0.01) return null;
          return (
            <line key={i}
              x1={scaleX(x)} y1={scaleY(Math.max(-1, Math.min(10, py)))}
              x2={scaleX(x)} y2={scaleY(ty)}
              stroke={`rgba(var(--neg-rgb), 0.75)`} strokeWidth="2" strokeDasharray="4 2" />
          );
        })}

        {/* data points */}
        {LIN.xs.map((x, i) => {
          const isHigh = highlightIdx === i;
          return (
            <g key={i}>
              <circle
                cx={scaleX(x)} cy={scaleY(LIN.ys[i])}
                r={isHigh ? 7 : 5.5}
                fill={ptColors[i]} stroke="var(--bg)" strokeWidth="1.5"
                style={{ filter: isHigh ? "drop-shadow(0 0 4px rgba(0,0,0,0.35))" : "none" }}
              />
              <text
                x={scaleX(x) + 8} y={scaleY(LIN.ys[i]) - 6}
                fontSize="10" fill="var(--ink-2)" fontFamily="inherit"
              >
                ({x.toFixed(1)}, {LIN.ys[i].toFixed(1)})
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  /* ── MSE surface contour mini-chart ──────────────────────── */
  function LossSurface({ wCur, bCur }) {
    const CW = 300, CH = 200;
    const wRange = { min: 0, max: 10 };
    const bRange = { min: -1, max: 4 };
    const res = 30;

    const toSvgX = w => (w - wRange.min) / (wRange.max - wRange.min) * CW;
    const toSvgY = b => CH - (b - bRange.min) / (bRange.max - bRange.min) * CH;

    function mseAt(w, b) {
      const n = LIN.xs.length;
      return LIN.xs.reduce((s, x, i) => s + (w * x + b - LIN.ys[i]) ** 2, 0) / n;
    }

    // build a few contour circles around the optimum
    const wO = 6.1, bO = 0.55;
    const levels = [0.5, 1.5, 3, 6, 10, 16];

    // approximated as ellipses in w-b space around wOpt, bOpt
    const ellipses = levels.map(lv => {
      const pts = [];
      for (let ang = 0; ang <= 360; ang += 6) {
        const rad = ang * Math.PI / 180;
        const rw = Math.sqrt(lv) * 1.1;
        const rb = Math.sqrt(lv) * 0.55;
        const wv = wO + rw * Math.cos(rad);
        const bv = bO + rb * Math.sin(rad);
        pts.push(`${toSvgX(wv).toFixed(1)},${toSvgY(bv).toFixed(1)}`);
      }
      return pts.join(" ");
    });

    const cx = toSvgX(wCur), cy = toSvgY(bCur);
    const ox = toSvgX(wO), oy = toSvgY(bO);

    return (
      <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: "100%", maxWidth: CW, display: "block" }}>
        {ellipses.map((pts, i) => (
          <polyline key={i} points={pts} fill="none" stroke="var(--line)" strokeWidth="0.9"
            opacity={0.4 + i * 0.1} />
        ))}
        {/* optimal point */}
        <circle cx={ox} cy={oy} r="5" fill="#1f9e6b" />
        <text x={ox + 7} y={oy + 4} fontSize="10" fill="#1f9e6b" fontFamily="inherit">opt</text>
        {/* current point */}
        <circle cx={cx} cy={cy} r="6" fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.5" />
        <text x={cx + 8} y={cy - 5} fontSize="10" fill="var(--accent)" fontFamily="inherit">current</text>
        {/* arrow toward opt */}
        <line x1={cx} y1={cy} x2={ox + (ox > cx ? -6 : 6)} y2={oy + (oy > cy ? -6 : 6)}
          stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
        {/* labels */}
        <text x={CW / 2} y={CH - 3} textAnchor="middle" fontSize="10" fill="var(--ink-2)" fontFamily="inherit">w (slope)</text>
        <text x={5} y={CH / 2} textAnchor="middle" fontSize="10" fill="var(--ink-2)" fontFamily="inherit" transform={`rotate(-90,8,${CH / 2})`}>b (intercept)</text>
      </svg>
    );
  }

  /* ── renderInput ─────────────────────────────────────────── */
  function renderInput(input, setInput) {
    return (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">w</span>
          <input type="range" min="0" max="10" step="0.1" value={input.w}
            onChange={e => setInput({ ...input, w: parseFloat(e.target.value) })} />
          <span className="nn-slider-v">{fmt(input.w)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">b</span>
          <input type="range" min="-2" max="4" step="0.1" value={input.b}
            onChange={e => setInput({ ...input, b: parseFloat(e.target.value) })} />
          <span className="nn-slider-v">{fmt(input.b)}</span>
        </label>
      </>
    );
  }

  /* ── STAGES ──────────────────────────────────────────────── */
  const STAGES = [

    /* ── Stage 1: Overview ─────────────────────────────────── */
    {
      id: "overview",
      group: "Overview",
      title: "What is Linear Regression?",
      map: "Overview",
      why: "Linear regression is the foundation of supervised learning — a straight line fit to data. Master this and gradient descent, and you understand the training loop behind every model on this site.",
      render: (trace) => (
        <>
          <Lead>
            <b>Linear regression</b> fits a straight line through data points to predict a continuous
            output from one or more inputs. It's the simplest supervised learning algorithm —
            yet it introduces <b>weights, bias, loss, and gradient descent</b>, the same concepts
            behind deep networks.
          </Lead>

          <div className="tf-archwrap">
            <div className="tf-arch">
              <div className="tf-arch-io">
                Input feature <b>x</b> (e.g. house size)
                <span>input — fixed, from dataset</span>
              </div>
              <div className="tf-arch-f"><b>ŷ = w · x + b</b></div>
              <div className="tf-arch-row">
                <span className="tf-sym">ŷ</span> — prediction (e.g. price estimate)
              </div>
              <div className="tf-arch-f"><b>Loss = MSE(ŷ, y)</b></div>
              <div className="tf-arch-row">
                <span className="tf-sym">L</span> — mean squared error (how wrong we are)
              </div>
              <div className="tf-arch-f"><b>∂L/∂w, ∂L/∂b</b></div>
              <div className="tf-arch-row">
                <span className="tf-sym">∇</span> — gradients pointing uphill in loss
              </div>
              <div className="tf-arch-f"><b>w ← w − η·∂L/∂w</b></div>
              <div className="tf-arch-io tf-arch-io--out">
                Updated <b>w</b> and <b>b</b> — closer to optimum
                <span>repeat until convergence</span>
              </div>
            </div>
          </div>

          <div className="tf-subhead">Symbol key</div>
          <div className="tf-legend">
            {[
              ["x",  "input feature",     "scalar",   "the input value, e.g. normalized house size 0–1"],
              ["y",  "true label",         "scalar",   "the ground-truth output, e.g. actual price"],
              ["ŷ",  "prediction",         "scalar",   "w·x + b — our model's estimate"],
              ["w",  "weight (slope)",     "scalar",   "learned — scales the input feature"],
              ["b",  "bias (intercept)",   "scalar",   "learned — shifts the line up/down"],
              ["L",  "loss (MSE)",         "scalar",   "average squared error over all training examples"],
              ["η",  "learning rate",      "scalar",   "step size for gradient descent (hyperparameter)"],
              ["∇",  "gradients",          "∂L/∂w, ∂L/∂b", "direction to decrease loss — backpropagation"],
            ].map(r => (
              <div className={"tf-leg" + (r[0] === "w" || r[0] === "b" ? " is-learned" : "")} key={r[0]}>
                <div className="tf-leg-top">
                  <span className={"tf-sym" + (r[0] === "w" || r[0] === "b" ? " is-learned" : "")}>{r[0]}</span>
                  <span className="tf-leg-shape">{r[2]}</span>
                </div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <Note>
            Drag the <b>w</b> and <b>b</b> sliders in the top bar — every number on every step
            recomputes live. Press <b>Next →</b> to walk through the full algorithm.
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
      why: "Before we can fit anything, we need data — pairs of (input, output). Understanding what the data looks like tells us whether a linear model is even appropriate.",
      render: (trace) => (
        <>
          <Lead>
            Our toy dataset has <b>6 houses</b>. Each has a normalized size (0 = smallest, 1 = largest)
            and a price in $100k. We want to <b>learn the relationship</b> so we can predict prices
            for new houses.
          </Lead>

          <Row>
            <div style={{ flex: "1 1 420px" }}>
              <div className="tf-subhead">Scatter plot — size vs price</div>
              <ScatterPlot w={trace.w} b={trace.b} showLine={false} showResiduals={false} />
            </div>
            <div style={{ flex: "0 0 260px" }}>
              <div className="tf-subhead">Training examples</div>
              <Matrix
                data={LIN.xs.map((x, i) => [x, LIN.ys[i]])}
                rowLabels={LIN.xs.map((_, i) => `x⁽${i+1}⁾`)}
                colLabels={["size", "price"]}
                caption="Training set"
                sub={`${LIN.xs.length} examples`}
                heat={false}
              />
            </div>
          </Row>

          <div className="tf-subhead">Terminology</div>
          <div className="tf-legend">
            {[
              ["n", "number of examples", "6", "how many (x, y) pairs we have"],
              ["x⁽ⁱ⁾", "i-th feature value", "e.g. 0.4", "the input for example i"],
              ["y⁽ⁱ⁾", "i-th true label", "e.g. 3.1", "the ground-truth output for example i"],
              ["(x,y)", "training example", "pair", "one row in the dataset — the model learns from these"],
            ].map(r => (
              <div className="tf-leg" key={r[0]}>
                <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <Note>
            The data looks roughly linear — as size increases, price increases proportionally.
            That's the key assumption linear regression makes. <b>If the relationship is curved,
            a linear model will underfit.</b>
          </Note>
        </>
      ),
    },

    /* ── Stage 3: Hypothesis ───────────────────────────────── */
    {
      id: "hypothesis",
      group: "Model",
      title: "The Hypothesis: ŷ = wx + b",
      map: "Hypothesis",
      why: "The hypothesis is the model's equation — the mathematical form we assume the data follows. For linear regression it's a line. The goal of training is to find the best w and b.",
      render: (trace) => {
        const { w, b } = trace;
        return (
          <>
            <Lead>
              Our model predicts price as a <b>linear function of size</b>: multiply the input
              by slope <V>w</V> and add intercept <V>b</V>. The line can be anywhere —
              drag the sliders to see it move live on the chart.
            </Lead>

            <Formula label="Hypothesis">
              <V>ŷ</V> = <V>w</V> · <V>x</V> + <V>b</V>
              &nbsp;=&nbsp;
              <b>{fmt(w)}</b> · <V>x</V> + <b>{fmt(b)}</b>
            </Formula>

            <div style={{ maxWidth: W }}>
              <ScatterPlot w={w} b={b} showLine={true} showResiduals={false} />
            </div>

            <div className="tf-subhead">What w and b control</div>
            <Row>
              <div className="nn-calc" style={{ flex: "1 1 200px" }}>
                <div className="nn-calc-h">Slope — <V>w</V> = {fmt(w)}</div>
                <div className="nn-calc-row">How steeply the line rises per unit of input.</div>
                <div className="nn-calc-row">A larger <V>w</V> → steeper line.</div>
                <div className="nn-calc-row">Current: for every +1 in size, price changes by <b>{fmt(w)} × $100k</b>.</div>
              </div>
              <div className="nn-calc" style={{ flex: "1 1 200px" }}>
                <div className="nn-calc-h">Intercept — <V>b</V> = {fmt(b)}</div>
                <div className="nn-calc-row">Where the line crosses x = 0.</div>
                <div className="nn-calc-row">A larger <V>b</V> → line shifts up.</div>
                <div className="nn-calc-row">Current: predicted price at size=0 is <b>{fmt(b)} × $100k</b>.</div>
              </div>
            </Row>

            <Note icon="→">
              Try <b>w = {fmt(trace.cfg.wOpt)}, b = {fmt(trace.cfg.bOpt)}</b> (the optimal solution) —
              that's the line that minimizes the total squared error. The next stages will show you
              how the algorithm finds those exact values automatically.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 4: Predictions ──────────────────────────────── */
    {
      id: "predictions",
      group: "Model",
      title: "Making Predictions",
      map: "Predictions",
      why: "Running the hypothesis on each training example gives us a set of predictions. Comparing those predictions to the true labels reveals how wrong our current weights are.",
      render: (trace) => {
        const { w, b, preds, cfg } = trace;
        return (
          <>
            <Lead>
              For each training example we plug <V>x</V> into <V>ŷ = wx + b</V> to get a prediction.
              The table below shows each input, our predicted value, and the true label — all updating
              live as you move the sliders.
            </Lead>

            <Formula label="Forward pass">
              <V>ŷ</V><Sup>(i)</Sup> = <b>{fmt(w)}</b> · <V>x</V><Sup>(i)</Sup> + <b>{fmt(b)}</b>
            </Formula>

            <Row>
              <Matrix
                data={cfg.xs.map((x, i) => [x, preds[i], cfg.ys[i]])}
                rowLabels={cfg.xs.map((_, i) => `i=${i+1}`)}
                colLabels={["x", "ŷ = wx+b", "y (true)"]}
                caption="Predictions vs truth"
                sub="all 6 examples"
                heat={false}
                cellTip={(i, j, v) => {
                  if (j === 1) {
                    const x = cfg.xs[i];
                    return (
                      <div>
                        <div className="tf-tip-title">Prediction for example {i+1}</div>
                        <div className="tf-tip-calc">
                          ŷ = {fmt(w)} × {fmt(x)} + {fmt(b)}
                        </div>
                        <div className="tf-tip-sum">= <b>{fmt(v)}</b></div>
                      </div>
                    );
                  }
                  return <div><div className="tf-tip-title">{j === 0 ? "Input feature x" : "True label y"}</div><div className="tf-tip-sum">{fmt(v)}</div></div>;
                }}
              />
              <div style={{ flex: "1 1 300px" }}>
                <div className="tf-subhead">Example computation (i=3)</div>
                <div className="nn-calc">
                  <div className="nn-calc-h">ŷ<Sup>(3)</Sup> = w · x<Sup>(3)</Sup> + b</div>
                  <div className="nn-calc-row">x<Sup>(3)</Sup> = {fmt(cfg.xs[2])}</div>
                  <div className="nn-calc-row">= {fmt(w)} × {fmt(cfg.xs[2])} + {fmt(b)}</div>
                  <div className="nn-calc-row">= {fmt(w * cfg.xs[2])} + {fmt(b)}</div>
                  <div className="nn-calc-row"><b>= {fmt(preds[2])}</b></div>
                  <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                    True y<Sup>(3)</Sup> = {fmt(cfg.ys[2])}
                  </div>
                  <div className="nn-calc-row">
                    Error = {fmt(preds[2])} − {fmt(cfg.ys[2])} = <b style={{ color: preds[2] - cfg.ys[2] > 0 ? "var(--neg)" : "var(--pos)" }}>{fmt(preds[2] - cfg.ys[2])}</b>
                  </div>
                </div>
              </div>
            </Row>

            <Note>
              Hover any <b>ŷ cell</b> in the matrix to see the full calculation for that example.
              The next step quantifies the total error across all examples using the <b>MSE loss</b>.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 5: Loss (MSE) ───────────────────────────────── */
    {
      id: "loss",
      group: "Training",
      title: "Loss Function — Mean Squared Error",
      map: "Loss (MSE)",
      why: "We need one number that summarizes how wrong our model is across all examples. MSE is the standard choice for regression: it squares the errors (so larger errors hurt more) then averages them.",
      render: (trace) => {
        const { w, b, preds, resid, mse, cfg } = trace;
        const mseOpt = trace.mseNorm;
        return (
          <>
            <Lead>
              The <b>residual</b> for example <V>i</V> is the gap between prediction and truth:
              <V> r</V><Sup>(i)</Sup> = <V>ŷ</V><Sup>(i)</Sup> − <V>y</V><Sup>(i)</Sup>.
              MSE squares and averages these residuals — red dashed lines on the chart show the gaps.
            </Lead>

            <Formula label="Mean Squared Error">
              <V>MSE</V> = <span style={{ fontSize: "1.1em" }}>
                <sup>1</sup>/<sub>n</sub>
              </span> Σ (<V>ŷ</V><Sup>(i)</Sup> − <V>y</V><Sup>(i)</Sup>)<Sup>2</Sup>
              &nbsp;=&nbsp;<b style={{ color: mse < 0.5 ? "var(--pos)" : mse > 2 ? "var(--neg)" : "inherit" }}>
                {fmt(mse, 4)}
              </b>
            </Formula>

            <div style={{ maxWidth: W }}>
              <ScatterPlot w={w} b={b} showLine={true} showResiduals={true} />
            </div>

            <Row>
              <Matrix
                data={cfg.xs.map((x, i) => [preds[i], cfg.ys[i], resid[i], resid[i] ** 2])}
                rowLabels={cfg.xs.map((_, i) => `i=${i+1}`)}
                colLabels={["ŷ", "y", "r = ŷ−y", "r²"]}
                caption="Residuals"
                sub="squared errors"
                cellTip={(i, j, v) => {
                  if (j === 2) return <div><div className="tf-tip-title">Residual for example {i+1}</div><div className="tf-tip-calc">{fmt(preds[i])} − {fmt(cfg.ys[i])}</div><div className="tf-tip-sum">= <b>{fmt(v)}</b></div></div>;
                  if (j === 3) return <div><div className="tf-tip-title">Squared residual for example {i+1}</div><div className="tf-tip-calc">({fmt(resid[i])})²</div><div className="tf-tip-sum">= <b>{fmt(v)}</b></div></div>;
                  return null;
                }}
              />
              <div style={{ flex: "1 1 220px" }}>
                <div className="nn-calc">
                  <div className="nn-calc-h">MSE summary</div>
                  <div className="nn-calc-row">Sum of r² = {fmt(resid.reduce((s, r) => s + r * r, 0), 4)}</div>
                  <div className="nn-calc-row">÷ n = {cfg.xs.length}</div>
                  <div className="nn-calc-row"><b>MSE = {fmt(mse, 4)}</b></div>
                  <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                    Optimal MSE ≈ {fmt(mseOpt, 4)}
                  </div>
                  <div className="nn-calc-row">
                    Gap = {fmt(mse - mseOpt, 4)}
                  </div>
                </div>
              </div>
            </Row>

            <Note>
              The red dashed lines are the residuals. A perfect fit would have <b>zero-length residuals</b>.
              Squaring residuals means a prediction that's off by 2 hurts <b>4× more</b> than one off by 1.
              The optimal MSE (≈ {fmt(mseOpt, 4)}) is what we'd get with the best possible w and b.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 6: Gradients ────────────────────────────────── */
    {
      id: "gradients",
      group: "Training",
      title: "Gradient of MSE — ∂L/∂w and ∂L/∂b",
      map: "Gradients",
      why: "Gradients tell us which direction to move w and b to reduce the loss. We compute them analytically using the chain rule — this is the heart of backpropagation, even for the simplest model.",
      render: (trace) => {
        const { w, b, preds, resid, mse, dw, db, cfg } = trace;
        return (
          <>
            <Lead>
              We differentiate MSE with respect to <V>w</V> and <V>b</V> using the <b>chain rule</b>.
              The sign of each gradient tells us whether to increase or decrease that parameter
              to move downhill on the loss surface.
            </Lead>

            <div className="tf-subhead">Derivation via chain rule</div>

            <Formula label="Loss">
              <V>L</V> = <sup>1</sup>/<sub>n</sub> Σ (ŷ<Sup>(i)</Sup> − y<Sup>(i)</Sup>)<Sup>2</Sup>
              &nbsp; where &nbsp; ŷ<Sup>(i)</Sup> = w·x<Sup>(i)</Sup> + b
            </Formula>

            <Formula label="∂L/∂w">
              <sup>∂L</sup>/<sub>∂w</sub> = <sup>2</sup>/<sub>n</sub> Σ (ŷ<Sup>(i)</Sup> − y<Sup>(i)</Sup>) · x<Sup>(i)</Sup>
              &nbsp;=&nbsp;<b style={{ color: dw > 0 ? "var(--neg)" : "var(--pos)" }}>{fmt(dw, 4)}</b>
            </Formula>

            <Formula label="∂L/∂b">
              <sup>∂L</sup>/<sub>∂b</sub> = <sup>2</sup>/<sub>n</sub> Σ (ŷ<Sup>(i)</Sup> − y<Sup>(i)</Sup>)
              &nbsp;=&nbsp;<b style={{ color: db > 0 ? "var(--neg)" : "var(--pos)" }}>{fmt(db, 4)}</b>
            </Formula>

            <Row>
              <div className="nn-calc" style={{ flex: "1 1 240px" }}>
                <div className="nn-calc-h">Computing ∂L/∂w step by step</div>
                <div className="nn-calc-row">Σ r·x = {cfg.xs.reduce((s, x, i) => s + resid[i] * x, 0).toFixed(4)}</div>
                <div className="nn-calc-row">× (2/n) = × {(2 / cfg.xs.length).toFixed(4)}</div>
                <div className="nn-calc-row"><b>∂L/∂w = {fmt(dw, 4)}</b></div>
                <div className="nn-calc-row" style={{ marginTop: 8, color: "var(--ink-2)" }}>
                  {dw > 0
                    ? "Positive → w is too large, decrease it"
                    : dw < 0
                      ? "Negative → w is too small, increase it"
                      : "Zero → w is at its optimum!"}
                </div>
              </div>
              <div className="nn-calc" style={{ flex: "1 1 240px" }}>
                <div className="nn-calc-h">Computing ∂L/∂b step by step</div>
                <div className="nn-calc-row">Σ r = {resid.reduce((s, r) => s + r, 0).toFixed(4)}</div>
                <div className="nn-calc-row">× (2/n) = × {(2 / cfg.xs.length).toFixed(4)}</div>
                <div className="nn-calc-row"><b>∂L/∂b = {fmt(db, 4)}</b></div>
                <div className="nn-calc-row" style={{ marginTop: 8, color: "var(--ink-2)" }}>
                  {db > 0
                    ? "Positive → b is too large, decrease it"
                    : db < 0
                      ? "Negative → b is too small, increase it"
                      : "Zero → b is at its optimum!"}
                </div>
              </div>
            </Row>

            <Matrix
              data={cfg.xs.map((x, i) => [x, resid[i], resid[i] * x, resid[i]])}
              rowLabels={cfg.xs.map((_, i) => `i=${i+1}`)}
              colLabels={["x", "r = ŷ−y", "r·x  (for ∂w)", "r  (for ∂b)"]}
              caption="Gradient accumulation"
              sub="per-example contributions"
              cellTip={(i, j, v) => {
                if (j === 2) return <div><div className="tf-tip-title">Contribution to ∂L/∂w from example {i+1}</div><div className="tf-tip-calc">r · x = {fmt(resid[i])} × {fmt(cfg.xs[i])}</div><div className="tf-tip-sum">= <b>{fmt(v)}</b></div></div>;
                return null;
              }}
            />

            <Note>
              A <b>positive gradient</b> for w means the loss surface slopes uphill as w increases,
              so gradient descent will <em>subtract</em> it (move w down). The gradients use <em>all</em> examples —
              that's full-batch gradient descent. Mini-batch GD uses a random subset each step.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 7: Gradient Descent Step ───────────────────── */
    {
      id: "gd-step",
      group: "Training",
      title: "Gradient Descent — Walking Downhill",
      map: "GD Step",
      why: "Gradient descent is the optimization engine for almost every ML algorithm. Understanding one step — subtract gradient × learning rate — scales directly to Adam, RMSProp, and neural networks.",
      render: (trace) => {
        const { w, b, dw, db, mse } = trace;
        const eta = 0.1;
        const wNew = w - eta * dw;
        const bNew = b - eta * db;
        const mseNew = window.ML_LIN.runLinear({ w: wNew, b: bNew }).mse;
        const improved = mseNew < mse;

        return (
          <>
            <Lead>
              Gradient descent subtracts a fraction <V>η</V> (learning rate) of each gradient from
              the current parameter. One step moves us slightly downhill on the loss surface.
              Many steps and we converge to the minimum.
            </Lead>

            <Formula label="Update rule">
              <V>w</V> ← <V>w</V> − <V>η</V> · <sup>∂L</sup>/<sub>∂w</sub>
              &nbsp;&nbsp;&nbsp;
              <V>b</V> ← <V>b</V> − <V>η</V> · <sup>∂L</sup>/<sub>∂b</sub>
            </Formula>

            <Row>
              <div className="nn-calc" style={{ flex: "1 1 260px" }}>
                <div className="nn-calc-h">One GD step (η = {eta})</div>
                <div className="nn-calc-row">w<sub>old</sub> = {fmt(w)}</div>
                <div className="nn-calc-row">w<sub>new</sub> = {fmt(w)} − {eta} × {fmt(dw, 4)}</div>
                <div className="nn-calc-row"><b>w<sub>new</sub> = {fmt(wNew, 4)}</b></div>
                <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                  b<sub>old</sub> = {fmt(b)}
                </div>
                <div className="nn-calc-row">b<sub>new</sub> = {fmt(b)} − {eta} × {fmt(db, 4)}</div>
                <div className="nn-calc-row"><b>b<sub>new</sub> = {fmt(bNew, 4)}</b></div>
              </div>
              <div className="nn-calc" style={{ flex: "1 1 240px" }}>
                <div className="nn-calc-h">MSE change</div>
                <div className="nn-calc-row">Before: MSE = {fmt(mse, 4)}</div>
                <div className="nn-calc-row">After:  MSE = {fmt(mseNew, 4)}</div>
                <div className="nn-calc-row">
                  Change: <b style={{ color: improved ? "var(--pos)" : "var(--neg)" }}>
                    {improved ? "−" : "+"}{fmt(Math.abs(mseNew - mse), 4)}
                  </b>
                  &nbsp;{improved ? "✓ improving" : "✗ diverging — try smaller η"}
                </div>
              </div>
            </Row>

            <div className="tf-subhead">Loss surface — w vs b contour map</div>
            <Row>
              <div style={{ flex: "1 1 300px" }}>
                <LossSurface wCur={w} bCur={b} />
                <p style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 4 }}>
                  Contours = equal MSE. Blue dot = current (w,b). Green = optimal.
                </p>
              </div>
              <div style={{ flex: "1 1 260px" }}>
                <div className="tf-subhead">Learning rate intuition</div>
                <div className="tf-legend" style={{ display: "block" }}>
                  {[
                    ["η too small", "is-con", "takes forever to converge (many steps needed)"],
                    ["η too large", "is-con", "overshoots — MSE can oscillate or diverge"],
                    ["η just right", "is-pro", "converges in O(1/ε) steps, MSE decreases each step"],
                  ].map(([name, cls, desc]) => (
                    <div key={name} className="tf-leg" style={{ marginBottom: 6 }}>
                      <div className="tf-leg-name">{name}</div>
                      <div className="tf-leg-desc">{desc}</div>
                    </div>
                  ))}
                </div>
                <Note>
                  For our dataset, η ≈ 0.05–0.2 works well. Much larger and the step would
                  overshoot the optimum; much smaller and it would take thousands of iterations
                  to converge.
                </Note>
              </div>
            </Row>
          </>
        );
      },
    },

    /* ── Stage 8: Normal Equation ──────────────────────────── */
    {
      id: "normal-eq",
      group: "Training",
      title: "Normal Equation — Closed-Form Solution",
      map: "Normal Eq.",
      why: "For linear regression there's an exact algebraic solution — no iterations needed. Understanding it deepens intuition about what gradient descent is converging to, and when each method is preferred.",
      render: (trace) => {
        const { wNorm, bNorm, mseNorm, w, b, mse } = trace;
        const cfg = trace.cfg;

        // Build design matrix X (with bias column) for display
        const designMatrix = cfg.xs.map(x => [1, x]);
        const n = cfg.xs.length;
        const xMean = cfg.xs.reduce((a, c) => a + c, 0) / n;
        const yMean = cfg.ys.reduce((a, c) => a + c, 0) / n;

        return (
          <>
            <Lead>
              The <b>normal equation</b> directly solves for the optimal weights without any
              iterations. For one feature it simplifies to a ratio of covariance to variance.
              For multiple features it uses matrix inversion: <V>w*</V> = (X<Sup>T</Sup>X)<Sup>−1</Sup>X<Sup>T</Sup>y.
            </Lead>

            <Row>
              <div style={{ flex: "1 1 260px" }}>
                <div className="tf-subhead">General form (matrix)</div>
                <Formula label="Normal equation">
                  <V>w*</V> = (X<Sup>T</Sup>X)<Sup>−1</Sup> X<Sup>T</Sup> <V>y</V>
                </Formula>
                <div className="tf-subhead">Single-feature simplification</div>
                <Formula label="w*">
                  <V>w*</V> = Σ(x<Sup>(i)</Sup> − x̄)(y<Sup>(i)</Sup> − ȳ) / Σ(x<Sup>(i)</Sup> − x̄)<Sup>2</Sup>
                </Formula>
                <Formula label="b*">
                  <V>b*</V> = ȳ − <V>w*</V> · x̄
                </Formula>
              </div>
              <div className="nn-calc" style={{ flex: "1 1 240px" }}>
                <div className="nn-calc-h">Computed solution</div>
                <div className="nn-calc-row">x̄ = {fmt(xMean, 3)}</div>
                <div className="nn-calc-row">ȳ = {fmt(yMean, 3)}</div>
                <div className="nn-calc-row">SS_xy = {fmt(cfg.xs.reduce((s, x, i) => s + (x - xMean) * (cfg.ys[i] - yMean), 0), 4)}</div>
                <div className="nn-calc-row">SS_xx = {fmt(cfg.xs.reduce((s, x) => s + (x - xMean) ** 2, 0), 4)}</div>
                <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                  <b>w* = {fmt(wNorm, 4)}</b>
                </div>
                <div className="nn-calc-row"><b>b* = {fmt(bNorm, 4)}</b></div>
                <div className="nn-calc-row">MSE* = {fmt(mseNorm, 4)}</div>
              </div>
            </Row>

            <div className="tf-subhead">Design matrix X (with bias column)</div>
            <Row>
              <Matrix
                data={designMatrix}
                rowLabels={cfg.xs.map((_, i) => `x⁽${i+1}⁾`)}
                colLabels={["1 (bias)", "x (size)"]}
                caption="Design matrix X"
                sub={`${n}×2`}
                heat={false}
              />
              <Matrix
                data={cfg.ys.map(y => [y])}
                rowLabels={cfg.ys.map((_, i) => `y⁽${i+1}⁾`)}
                colLabels={["y (price)"]}
                caption="Label vector y"
                sub={`${n}×1`}
                heat={false}
              />
              <div className="nn-calc" style={{ flex: "1 1 200px" }}>
                <div className="nn-calc-h">GD solution vs Normal Eq.</div>
                <div className="nn-calc-row">Current w = {fmt(w)}</div>
                <div className="nn-calc-row">Optimal w* = {fmt(wNorm, 4)}</div>
                <div className="nn-calc-row">Δw = {fmt(w - wNorm, 4)}</div>
                <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                  Current MSE = {fmt(mse, 4)}
                </div>
                <div className="nn-calc-row">Optimal MSE = {fmt(mseNorm, 4)}</div>
              </div>
            </Row>

            <div className="tf-subhead">When to use normal equation vs gradient descent</div>
            <div className="opt-pc">
              <div className="opt-pc-col is-pro">
                <div className="opt-pc-h">Normal Equation</div>
                <ul>
                  <li>Exact one-shot solution — no tuning η</li>
                  <li>No convergence checking needed</li>
                  <li>Great for small feature sets (n_features &lt; ~10k)</li>
                </ul>
              </div>
              <div className="opt-pc-col is-con">
                <div className="opt-pc-h">Normal Equation — limitations</div>
                <ul>
                  <li>O(n³) matrix inversion — slow for large datasets</li>
                  <li>Requires X<Sup>T</Sup>X to be invertible</li>
                  <li>Doesn't extend to non-linear models or neural nets</li>
                </ul>
              </div>
            </div>
          </>
        );
      },
    },

    /* ── Stage 9: Multiple Features ────────────────────────── */
    {
      id: "multi-feature",
      group: "Extensions",
      title: "Multiple Features — Matrix Form ŷ = Xw",
      map: "Multi-feature",
      why: "Real datasets have dozens or hundreds of features. The matrix form generalizes linear regression cleanly — same math, just replace scalars with vectors and matrices.",
      render: (trace) => {
        const { xs2, ys2, wMul, bMul, predsMul, residMul, mseMul } = trace;

        // Design matrix with bias column
        const X = xs2.map(x => [1, x[0], x[1]]);
        const w = [bMul, ...wMul];

        return (
          <>
            <Lead>
              With two features — <b>size</b> and <b>number of bedrooms</b> — the model becomes
              a plane in 3D space: <V>ŷ</V> = <V>w₁</V>·size + <V>w₂</V>·bedrooms + <V>b</V>.
              In vector form: <V>ŷ</V> = X<b>w</b>, where X includes a bias column of 1s.
            </Lead>

            <Formula label="Vector hypothesis">
              <V>ŷ</V> = X <b>w</b> &nbsp;where&nbsp; <b>w</b> = [b, w₁, w₂]<Sup>T</Sup> = [{fmt(bMul)}, {fmt(wMul[0])}, {fmt(wMul[1])}]<Sup>T</Sup>
            </Formula>

            <div className="tf-subhead">Design matrix and predictions</div>
            <Row>
              <Matrix
                data={X}
                rowLabels={xs2.map((_, i) => `x⁽${i+1}⁾`)}
                colLabels={["1", "size", "beds"]}
                caption="Design matrix X"
                sub={`${xs2.length}×3`}
                heat={false}
              />
              <Arrow label="× w" />
              <Matrix
                data={predsMul.map((p, i) => [p, ys2[i], residMul[i]])}
                rowLabels={xs2.map((_, i) => `i=${i+1}`)}
                colLabels={["ŷ", "y", "r"]}
                caption="Predictions"
                sub="multi-feature"
                cellTip={(i, j, v) => {
                  if (j === 0) {
                    const xi = xs2[i];
                    return (
                      <div>
                        <div className="tf-tip-title">ŷ for example {i+1}</div>
                        <div className="tf-tip-calc">
                          {fmt(bMul)} + {fmt(wMul[0])}×{fmt(xi[0])} + {fmt(wMul[1])}×{xi[1]}
                        </div>
                        <div className="tf-tip-sum">= <b>{fmt(v)}</b></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Row>

            <Row>
              <div className="nn-calc" style={{ flex: "1 1 240px" }}>
                <div className="nn-calc-h">Weight vector w</div>
                <div className="nn-calc-row">b = {fmt(bMul)} &nbsp;(bias intercept)</div>
                <div className="nn-calc-row">w₁ = {fmt(wMul[0])} &nbsp;(size coefficient)</div>
                <div className="nn-calc-row">w₂ = {fmt(wMul[1])} &nbsp;(bedrooms coefficient)</div>
                <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                  Multi-feature MSE = {fmt(mseMul, 4)}
                </div>
              </div>
              <div style={{ flex: "1 1 280px" }}>
                <div className="tf-subhead">Example computation (i=3)</div>
                <div className="nn-calc">
                  <div className="nn-calc-h">ŷ⁽³⁾ = b + w₁·x₁ + w₂·x₂</div>
                  <div className="nn-calc-row">x₁ = {xs2[2][0]}, x₂ = {xs2[2][1]} bedrooms</div>
                  <div className="nn-calc-row">= {fmt(bMul)} + {fmt(wMul[0])}×{xs2[2][0]} + {fmt(wMul[1])}×{xs2[2][1]}</div>
                  <div className="nn-calc-row">= {fmt(bMul)} + {fmt(wMul[0] * xs2[2][0])} + {fmt(wMul[1] * xs2[2][1])}</div>
                  <div className="nn-calc-row"><b>= {fmt(predsMul[2])}</b></div>
                </div>
              </div>
            </Row>

            <Note>
              Adding features gives the model more expressiveness — but also more parameters to
              learn. With <b>p features and n examples</b>, the design matrix X is n×(p+1) and
              the weight vector w is (p+1)×1. Gradient descent and the normal equation work
              identically — just with vectors instead of scalars.
            </Note>
          </>
        );
      },
    },

    /* ── Stage 10: R² and Diagnostics ─────────────────────── */
    {
      id: "r2",
      group: "Evaluation",
      title: "Model Evaluation — R² and Diagnostics",
      map: "R² Score",
      why: "MSE tells us the raw error magnitude, but R² tells us how much of the variance in the data our model explains — a scale-independent quality metric. Good diagnostics catch assumption violations early.",
      render: (trace) => {
        const { w, b, r2, mse, mseNorm, cfg } = trace;
        const r2Pct = (r2 * 100).toFixed(1);
        const yMean = cfg.ys.reduce((a, c) => a + c, 0) / cfg.ys.length;
        const ssTot = cfg.ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
        const ssRes = cfg.xs.reduce((s, x, i) => {
          const pred = w * x + b;
          return s + (pred - cfg.ys[i]) ** 2;
        }, 0);

        return (
          <>
            <Lead>
              <b>R²</b> (coefficient of determination) measures the fraction of variance in
              <V> y</V> explained by the model. R² = 1 means a perfect fit; R² = 0 means the
              model is no better than predicting the mean.
            </Lead>

            <Formula label="R²">
              <V>R²</V> = 1 − SS<Sub>res</Sub> / SS<Sub>tot</Sub>
              &nbsp;=&nbsp;
              1 − {fmt(ssRes, 3)} / {fmt(ssTot, 3)}
              &nbsp;=&nbsp;
              <b style={{ color: r2 > 0.85 ? "var(--pos)" : r2 > 0.5 ? "inherit" : "var(--neg)" }}>
                {fmt(r2, 4)}
              </b>
              &nbsp; ({r2Pct}% variance explained)
            </Formula>

            <Row>
              <div style={{ flex: "1 1 380px" }}>
                <div className="tf-subhead">Current line vs optimal line</div>
                <ScatterPlot w={w} b={b} showLine={true} showResiduals={true} />
              </div>
              <div style={{ flex: "1 1 220px" }}>
                <div className="nn-calc">
                  <div className="nn-calc-h">Evaluation metrics</div>
                  <div className="nn-calc-row">MSE = {fmt(mse, 4)}</div>
                  <div className="nn-calc-row">RMSE = {fmt(Math.sqrt(mse), 4)}</div>
                  <div className="nn-calc-row">R² = {fmt(r2, 4)}</div>
                  <div className="nn-calc-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                    Optimal MSE = {fmt(mseNorm, 4)}
                  </div>
                  <div className="nn-calc-row">Optimal RMSE = {fmt(Math.sqrt(mseNorm), 4)}</div>
                </div>
              </div>
            </Row>
          </>
        );
      },
    },

    /* ── Stage 10 (final): Assumptions & When to Use ───────── */
    {
      id: "assumptions",
      group: "Evaluation",
      title: "Assumptions, Pros & Cons — When to Use Linear Regression",
      map: "Assumptions",
      why: "Every model has assumptions. Violating them quietly degrades performance. Knowing when linear regression is the right tool — and when to reach for something else — is core ML practitioner knowledge.",
      render: (trace) => (
        <>
          <Lead>
            Linear regression makes four key statistical assumptions (L-I-N-E).
            When they hold, it's the <b>best linear unbiased estimator</b> (BLUE theorem).
            When they're violated, consider transformations, regularization, or non-linear models.
          </Lead>

          <div className="tf-subhead">The four assumptions (LINE)</div>
          <div className="tf-legend">
            {[
              ["L", "Linearity", "assumption", "The relationship between x and y is linear. Check: residual vs. fitted plot should be flat."],
              ["I", "Independence", "assumption", "Each training example is independent of others. Violated in time series (autocorrelation)."],
              ["N", "Normality", "assumption", "Residuals are normally distributed. Important for confidence intervals. Check: Q-Q plot."],
              ["E", "Equal variance", "assumption", "Residuals have constant variance (homoscedasticity). Violated when errors grow with x."],
            ].map(r => (
              <div className="tf-leg" key={r[0]}>
                <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <div className="tf-subhead">Pros and cons</div>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">Strengths</div>
              <ul>
                <li>Interpretable — w directly gives feature importance</li>
                <li>Fast to train — O(p²n) for normal equation</li>
                <li>No hyperparameters to tune (normal equation)</li>
                <li>Works well when the true relationship is linear</li>
                <li>Provides uncertainty estimates (confidence intervals)</li>
                <li>Foundation — same training loop as deep networks</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">Weaknesses</div>
              <ul>
                <li>Can't capture non-linear relationships (underfits)</li>
                <li>Sensitive to outliers (MSE squares large errors)</li>
                <li>Assumes feature-target linearity (rarely exact)</li>
                <li>Normal equation O(p³) is slow for many features</li>
                <li>Multicollinear features make X<Sup>T</Sup>X ill-conditioned</li>
              </ul>
            </div>
          </div>

          <div className="tf-subhead">When to reach for linear regression</div>
          <div className="tf-legend">
            {[
              ["✓", "Baseline model", "fast", "Always try it first — a linear baseline reveals whether a problem is hard or easy."],
              ["✓", "Interpretability needed", "use case", "Stakeholders want to understand coefficients — feature importance is directly readable."],
              ["✓", "Small, clean datasets", "data", "With n < 10k and p < 1k, the normal equation is instant and exact."],
              ["✗", "Image / text / audio", "avoid", "High-dimensional, non-linear structure → use CNNs, Transformers, or RNNs instead."],
              ["✗", "Count / binary outputs", "avoid", "Use Poisson regression or logistic regression — linear regression can predict negatives."],
              ["✗", "Heavy non-linearity", "avoid", "Polynomial features or tree-based models (Random Forest, XGBoost) will outperform."],
            ].map(r => (
              <div className={"tf-leg" + (r[0] === "✗" ? "" : " is-learned")} key={r[1]}>
                <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <Note icon="★">
            You've completed the Linear Regression walkthrough. The core loop —
            <b> forward pass → loss → gradients → parameter update</b> — is identical for
            every model on this site. The only differences are the hypothesis function,
            loss function, and how gradients propagate back through layers.
          </Note>
        </>
      ),
    },

  ];

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "Linear Regression",
    subtitle: "fitting a line to data — the supervised learning foundation",
    cur: "Linear Regression",
    category: "Regression",
    run: (input) => window.ML_LIN.runLinear(input),
    default: { w: 3.0, b: 1.0 },
    renderInput,
  };
})();
