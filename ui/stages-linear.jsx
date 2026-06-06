/* ============================================================
   Linear Regression — rebuilt with proper text + visuals.
   Flow: Overview → Dataset → The Line → Trying Lines → Loss →
         Gradients → Gradient Descent → Normal Eq →
         Predictions (AFTER training) → Evaluation → Assumptions
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState } = React;
  const LIN = window.ML_LIN.LIN;

  /* ── SVG scale helpers ───────────────────────────────────── */
  const W = 440, H = 270;
  const PAD = { l: 50, r: 18, t: 18, b: 42 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const sx = v => PAD.l + (v / 1.1) * plotW;
  const sy = v => PAD.t + plotH - ((v / 9) * plotH);
  const PT_COLORS = ["#2b5bff","#06a3c7","#1f9e6b","#e0851e","#7c5cff","#e0518f"];

  /* ── Base axes/grid SVG parts ─────────────────────────────── */
  function Axes() {
    return (
      <>
        {[0,2,4,6,8].map(yv => (
          <line key={yv} x1={PAD.l} y1={sy(yv)} x2={W-PAD.r} y2={sy(yv)}
            stroke="var(--line)" strokeWidth="0.7" strokeDasharray="3 3"/>
        ))}
        {[0,0.2,0.4,0.6,0.8,1.0].map(xv => (
          <line key={xv} x1={sx(xv)} y1={PAD.t} x2={sx(xv)} y2={H-PAD.b}
            stroke="var(--line)" strokeWidth="0.7" strokeDasharray="3 3"/>
        ))}
        <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="var(--ink)" strokeWidth="1.6"/>
        <line x1={PAD.l} y1={PAD.t}   x2={PAD.l}   y2={H-PAD.b} stroke="var(--ink)" strokeWidth="1.6"/>
        {[0,2,4,6,8].map(yv => (
          <g key={yv}>
            <line x1={PAD.l-5} y1={sy(yv)} x2={PAD.l} y2={sy(yv)} stroke="var(--ink)" strokeWidth="1"/>
            <text x={PAD.l-8} y={sy(yv)+4} textAnchor="end" fontSize="10" fill="var(--muted)" fontFamily="var(--num-font)">{yv}</text>
          </g>
        ))}
        {[0.2,0.4,0.6,0.8,1.0].map(xv => (
          <g key={xv}>
            <line x1={sx(xv)} y1={H-PAD.b} x2={sx(xv)} y2={H-PAD.b+5} stroke="var(--ink)" strokeWidth="1"/>
            <text x={sx(xv)} y={H-PAD.b+16} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="var(--num-font)">{xv.toFixed(1)}</text>
          </g>
        ))}
        <text x={W/2} y={H-4} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="inherit">house size (normalized)</text>
        <text x={12} y={H/2} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="inherit" transform={`rotate(-90,12,${H/2})`}>price ($100k)</text>
      </>
    );
  }

  /* ── Data points ──────────────────────────────────────────── */
  function Points({ highlight = -1 }) {
    return LIN.xs.map((x, i) => (
      <g key={i}>
        <circle cx={sx(x)} cy={sy(LIN.ys[i])} r={highlight===i ? 8 : 6}
          fill={PT_COLORS[i]} stroke="white" strokeWidth="1.5"
          style={{filter: highlight===i ? "drop-shadow(0 0 5px rgba(0,0,0,.3))": "none"}}/>
        <text x={sx(x)+9} y={sy(LIN.ys[i])-7} fontSize="9.5" fill="var(--muted)" fontFamily="var(--num-font)">
          ({x.toFixed(1)},{LIN.ys[i].toFixed(1)})
        </text>
      </g>
    ));
  }

  /* ── Regression line ──────────────────────────────────────── */
  function RegLine({ w, b, color = "var(--accent)", width = 2.2, dashed = false }) {
    const y0 = w * 0 + b, y1 = w * 1.05 + b;
    return (
      <line x1={sx(0)} y1={sy(Math.min(Math.max(y0,-1),10))}
            x2={sx(1.05)} y2={sy(Math.min(Math.max(y1,-1),10))}
            stroke={color} strokeWidth={width} strokeLinecap="round"
            strokeDasharray={dashed ? "6 3" : undefined} opacity="0.9"/>
    );
  }

  /* ── Residual lines ───────────────────────────────────────── */
  function Residuals({ w, b }) {
    return LIN.xs.map((x, i) => {
      const py = w*x+b, ty = LIN.ys[i];
      if (Math.abs(py-ty) < 0.05) return null;
      return (
        <line key={i} x1={sx(x)} y1={sy(Math.min(Math.max(py,-1),10))}
              x2={sx(x)} y2={sy(ty)}
              stroke="rgba(226,76,96,0.8)" strokeWidth="2.2" strokeDasharray="5 2"/>
      );
    });
  }

  /* ── Loss surface contour ─────────────────────────────────── */
  function LossSurface({ wCur, bCur }) {
    const CW=300, CH=200;
    const wOpt=6.1, bOpt=0.55;
    const toX = w => (w-0)/(10-0)*CW;
    const toY = b => CH-(b-(-1))/(5-(-1))*CH;
    const levels = [0.4,1,2.5,5,9,15];
    const ellipses = levels.map(lv => {
      const pts = [];
      for (let a=0; a<=360; a+=5) {
        const rad = a*Math.PI/180;
        const wv = wOpt + Math.sqrt(lv)*1.15*Math.cos(rad);
        const bv = bOpt + Math.sqrt(lv)*0.5*Math.sin(rad);
        pts.push(`${toX(wv).toFixed(1)},${toY(bv).toFixed(1)}`);
      }
      return pts.join(" ");
    });
    const cx=toX(wCur), cy=toY(bCur), ox=toX(wOpt), oy=toY(bOpt);
    return (
      <svg viewBox={`0 0 ${CW} ${CH}`} style={{width:"100%",maxWidth:CW,display:"block",border:"1px solid var(--line)",borderRadius:12,background:"var(--panel-solid)",padding:6}}>
        {ellipses.map((pts,i)=>(
          <polyline key={i} points={pts} fill="none" stroke={`rgba(43,91,255,${0.15+i*0.08})`} strokeWidth="0.9"/>
        ))}
        <circle cx={ox} cy={oy} r="5" fill="#1f9e6b"/>
        <text x={ox+7} y={oy+4} fontSize="10" fill="#1f9e6b" fontFamily="inherit">optimum</text>
        <circle cx={cx} cy={cy} r="6" fill="var(--accent)" stroke="white" strokeWidth="1.5"/>
        <text x={cx+8} y={cy-5} fontSize="10" fill="var(--accent)" fontFamily="inherit">current</text>
        <line x1={cx} y1={cy} x2={ox+(ox>cx?-6:6)} y2={oy+(oy>cy?-6:6)}
          stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.6"/>
        <text x={CW/2} y={CH-3} textAnchor="middle" fontSize="9.5" fill="var(--muted)" fontFamily="inherit">← w (slope) →</text>
        <text x={6} y={CH/2} textAnchor="middle" fontSize="9.5" fill="var(--muted)" fontFamily="inherit" transform={`rotate(-90,6,${CH/2})`}>b (intercept)</text>
      </svg>
    );
  }

  /* ── renderInput (header sliders) ────────────────────────── */
  function renderInput(input, setInput) {
    return (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">slope w</span>
          <input type="range" min="0" max="10" step="0.1" value={input.w}
            onChange={e => setInput({...input, w: parseFloat(e.target.value)})}/>
          <span className="nn-slider-v">{fmt(input.w)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">intercept b</span>
          <input type="range" min="-2" max="4" step="0.1" value={input.b}
            onChange={e => setInput({...input, b: parseFloat(e.target.value)})}/>
          <span className="nn-slider-v">{fmt(input.b)}</span>
        </label>
      </>
    );
  }

  /* ══════════════════════════════════════════════════════════
     STAGES
     ══════════════════════════════════════════════════════════ */
  const STAGES = [

    /* ── 1. Overview ──────────────────────────────────────── */
    {
      id: "overview", group: "Overview",
      title: "What is Linear Regression?",
      map: "Overview",
      why: "Linear regression is the very first algorithm every ML engineer should master. Its core loop — make a prediction, measure how wrong it is, compute gradients, update weights — is identical to training a neural network with a million parameters.",
      render: (trace) => (
        <>
          <Lead>
            Imagine you have a dataset of houses: you know the size of each house, and you know the
            price it sold for. <b>Linear regression</b> finds the mathematical relationship between
            size and price so that, given any new house size, you can predict its price.
          </Lead>
          <Lead>
            The "linear" part means we assume this relationship is a <b>straight line</b>.
            The "regression" part means we're predicting a <b>continuous number</b> (a price), not a
            category. The algorithm's job is to find the <b>best possible line</b> through the data —
            where "best" means the line that makes the smallest total prediction error.
          </Lead>

          <div className="tf-subhead">The full learning pipeline</div>
          <div className="tf-archwrap">
            <div className="tf-arch">
              <div className="tf-arch-io">Training data: (house size, true price) pairs<span>given — we don't choose these</span></div>
              <div className="tf-arch-f"><b>Step 1 — pick a line</b>: start with random w and b</div>
              <div className="tf-arch-row">ŷ = w·x + b &nbsp;→&nbsp; current predictions (probably wrong)</div>
              <div className="tf-arch-f"><b>Step 2 — measure error</b>: how far off are we?</div>
              <div className="tf-arch-row">Loss = MSE = average of (ŷ − y)² &nbsp;→&nbsp; one number summarising all mistakes</div>
              <div className="tf-arch-f"><b>Step 3 — compute gradients</b>: which way should w and b move?</div>
              <div className="tf-arch-row">∂Loss/∂w and ∂Loss/∂b &nbsp;→&nbsp; the slope of the error surface</div>
              <div className="tf-arch-f"><b>Step 4 — update</b>: take a small step downhill</div>
              <div className="tf-arch-row">w ← w − η·∂L/∂w &nbsp;&nbsp; b ← b − η·∂L/∂b</div>
              <div className="tf-arch-f"><b>Repeat steps 2–4 until loss stops improving</b></div>
              <div className="tf-arch-io tf-arch-io--out">Learned w* and b* — the best-fit line<span>now use these to predict on new data</span></div>
            </div>
          </div>

          <div className="tf-subhead">What every symbol means</div>
          <div className="tf-legend">
            {[
              ["x",  "input feature",   "scalar", "The thing we're predicting from — e.g. normalized house size (0 to 1)."],
              ["y",  "true label",       "scalar", "The actual answer from the dataset — the real price the house sold for."],
              ["ŷ",  "prediction",       "scalar", "Our model's guess: ŷ = w·x + b. Before training, this is random."],
              ["w",  "weight / slope",   "learned","How steeply price rises with size. Learned by the algorithm during training."],
              ["b",  "bias / intercept", "learned","The baseline price when size = 0. Learned by the algorithm during training."],
              ["L",  "loss (MSE)",       "scalar", "Mean Squared Error — the average of all squared prediction errors. Training minimises this."],
              ["η",  "learning rate",    "hyper",  "How big a step to take each update. Too large → overshoots. Too small → very slow."],
              ["∂",  "gradient",         "∂L/∂w",  "Tells us: if w increases a tiny bit, how much does the loss change? Points uphill."],
            ].map(r => (
              <div className={"tf-leg"+(r[2]==="learned"?" is-learned":"")} key={r[0]}>
                <div className="tf-leg-top">
                  <span className={"tf-sym"+(r[2]==="learned"?" is-learned":"")}>{r[0]}</span>
                  <span className="tf-leg-shape">{r[2]}</span>
                </div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>

          <Note>
            This walkthrough follows the same order as learning: first understand the data, then define
            the model, then understand how it <b>trains</b> (gets its coefficients), and only
            then use the trained model to make predictions. Move through the steps with <b>Next →</b>.
          </Note>
        </>
      ),
    },

    /* ── 2. Dataset ───────────────────────────────────────── */
    {
      id: "dataset", group: "Data",
      title: "Step 1 — Understand the Data",
      map: "Dataset",
      why: "Every ML algorithm starts with data. Before fitting anything, you need to understand what you're working with — how many examples, what the features are, and whether a linear model is even a reasonable choice.",
      render: (trace) => (
        <>
          <Lead>
            Our dataset has <b>6 houses</b>. For each house we know two things: its <b>size</b>
            (normalized to a 0–1 scale, where 0 = smallest and 1 = largest) and its
            <b> sale price</b> in $100k. These are our <b>training examples</b> — the data we'll
            use to find the best line.
          </Lead>
          <Lead>
            The scatter plot below shows all 6 points. Each dot is one house. The horizontal position
            (x-axis) is the size, and the vertical position (y-axis) is the price. If a straight line
            can capture the pattern, linear regression will work well here.
          </Lead>

          <Row>
            <div style={{flex:"1 1 420px"}}>
              <div className="tf-subhead">Scatter plot — size vs price</div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:W,display:"block",border:"1px solid var(--line)",borderRadius:12,background:"var(--panel-solid)",boxShadow:"var(--shadow)"}}>
                <Axes/><Points/>
              </svg>
              <p style={{fontSize:12,color:"var(--muted)",marginTop:4}}>
                Each dot = one house. Observe: as size increases, price increases. That's a
                <b> linear trend</b> — a good sign that linear regression will fit well.
              </p>
            </div>
            <div style={{flex:"0 0 auto"}}>
              <div className="tf-subhead">Training data table</div>
              <Matrix
                data={LIN.xs.map((x,i) => [x, LIN.ys[i]])}
                rowLabels={LIN.xs.map((_,i) => `house ${i+1}`)}
                colLabels={["size (x)", "price y ($100k)"]}
                caption="Dataset" sub="n = 6 examples" heat={false}
              />
              <div style={{marginTop:12,padding:"10px 13px",background:"var(--accent-soft)",borderRadius:10,fontSize:12.5,color:"var(--muted)",lineHeight:1.5}}>
                <b style={{color:"var(--accent-ink)"}}>Terminology:</b><br/>
                <b>n</b> = number of training examples (6 here)<br/>
                <b>x⁽ⁱ⁾</b> = feature value of the i-th house<br/>
                <b>y⁽ⁱ⁾</b> = true price of the i-th house<br/>
                <b>(x⁽ⁱ⁾, y⁽ⁱ⁾)</b> = one training example
              </div>
            </div>
          </Row>

          <div className="tf-subhead">What do we want from this data?</div>
          <Lead>
            We want the algorithm to look at all 6 (size, price) pairs and <b>learn a formula</b>:
            "for any house size I haven't seen before, multiply by some number w and add some
            number b to estimate the price." The algorithm discovers w and b automatically — that's
            the training process. We cover that in the next few steps.
          </Lead>

          <Note>
            In real-world datasets you might have thousands of examples and dozens of features.
            Everything we build here works identically at that scale — just with bigger matrices.
          </Note>
        </>
      ),
    },

    /* ── 3. The Hypothesis ────────────────────────────────── */
    {
      id: "hypothesis", group: "Model",
      title: "Step 2 — The Model: ŷ = w·x + b",
      map: "The Line",
      why: "Before training, we decide the mathematical form of our model. For linear regression it's always a straight line: ŷ = w·x + b. Training will find the right w and b — but first we must decide this is the right shape to use.",
      render: (trace) => {
        const { w, b } = trace;
        return (
          <>
            <Lead>
              A straight line in math is written as: <b>y = mx + c</b>. In machine learning we write
              it as <b>ŷ = w·x + b</b>, where:
            </Lead>
            <div className="tf-lifecycle">
              <div className="tf-life tf-life--train">
                <div className="tf-life-h"><span>w</span> Weight (slope)</div>
                <p>
                  <b>w</b> controls how steeply the line rises. If w = 6, then every time house size
                  increases by 1 unit, the predicted price increases by 6 × $100k = $600k.
                  A larger w means a steeper line. A negative w would mean price <em>decreases</em>
                  with size (unusual for houses!).
                </p>
              </div>
              <div className="tf-life tf-life--infer">
                <div className="tf-life-h"><span>b</span> Bias (intercept)</div>
                <p>
                  <b>b</b> is where the line crosses the y-axis (when x = 0). It acts as the
                  baseline price before size is factored in. A larger b shifts the entire line
                  upward. Without b, the line would always pass through the origin, which is
                  too restrictive.
                </p>
              </div>
            </div>

            <Formula label="Hypothesis">
              <V>ŷ</V> = <V>w</V> · <V>x</V> + <V>b</V>
              &nbsp;=&nbsp;<b>{fmt(w)}</b> · <V>x</V> + <b>{fmt(b)}</b>
            </Formula>

            <div className="tf-subhead">Move the sliders to see how w and b change the line</div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:W,display:"block",border:"1px solid var(--line)",borderRadius:12,background:"var(--panel-solid)",boxShadow:"var(--shadow)"}}>
              <Axes/>
              <RegLine w={w} b={b}/>
              <Points/>
              <text x={sx(0.7)} y={sy(w*0.7+b)-12} fontSize="11" fill="var(--accent)" fontFamily="var(--num-font)" fontWeight="700">ŷ = {fmt(w)}·x + {fmt(b)}</text>
            </svg>
            <p style={{fontSize:12,color:"var(--muted)",marginTop:4}}>
              The blue line is your current model. The dots are the true data. Notice the gap
              between the line and the dots — that gap is the <b>error</b>. Training will close it.
            </p>

            <div className="tf-subhead">Key insight: infinitely many lines exist — we need to pick the BEST one</div>
            <Lead>
              With any values of w and b, we get some line through the data. But most lines are
              terrible — they're far from the data points. The question training answers is:
              <b> among all possible (w, b) combinations, which one makes the smallest total
              prediction error?</b> To answer that, we first need to define what "error" means.
              That's the <b>loss function</b>, coming next.
            </Lead>

            <Note>
              The hat on ŷ (y-hat) means "predicted value". It's what our model says the price
              should be. <b>y</b> (no hat) is the actual true price from the dataset. Training
              makes ŷ as close to y as possible across all examples.
            </Note>
          </>
        );
      },
    },

    /* ── 4. Trying Different Lines (StatQuest style) ────── */
    {
      id: "trying-lines", group: "Training",
      title: "Step 3 — Why Not Just Guess? The Need for a Loss Function",
      map: "Trying Lines",
      why: "Before formalising the loss, it helps to see visually why some lines are obviously bad, and why we need a single number (the loss) to compare them objectively. This is the intuition StatQuest calls 'sum of squared residuals'.",
      render: (trace) => {
        const candidates = [
          { w: 1.5, b: 3.0, label: "Line A (too flat)" },
          { w: 10.0, b: -2.0, label: "Line B (too steep)" },
          { w: 6.1, b: 0.55, label: "Line C (best fit)" },
        ];
        const colors = ["#e0492e", "#e0851e", "#1f9e6b"];

        function mse(w, b) {
          return LIN.xs.reduce((s, x, i) => s + (w*x+b - LIN.ys[i])**2, 0) / LIN.xs.length;
        }

        return (
          <>
            <Lead>
              Look at the three lines below. They all pass through (or near) the data, but they
              are clearly not equally good. <b>Line A</b> is too flat — it misses the high-priced
              big houses. <b>Line B</b> is too steep — it wildly overestimates large houses.
              <b> Line C</b> looks like it fits well. But how do we <em>measure</em> this
              formally so the algorithm can find the best line automatically?
            </Lead>

            <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:W,display:"block",border:"1px solid var(--line)",borderRadius:12,background:"var(--panel-solid)",boxShadow:"var(--shadow)"}}>
              <Axes/>
              {candidates.map((c, i) => <RegLine key={i} w={c.w} b={c.b} color={colors[i]} width={i===2?2.8:1.8} dashed={i!==2}/>)}
              <Points/>
            </svg>

            <div className="tf-subhead">How wrong is each line? — the residual</div>
            <Lead>
              For each data point, the <b>residual</b> (or error) is the vertical gap between
              the true price and the predicted price:
            </Lead>
            <Formula label="Residual">residual⁽ⁱ⁾ = ŷ⁽ⁱ⁾ − y⁽ⁱ⁾ = (<V>w</V>·x⁽ⁱ⁾ + <V>b</V>) − y⁽ⁱ⁾</Formula>
            <Lead>
              A residual of +2 means we predicted $200k too high. A residual of −1.5 means we
              predicted $150k too low. We want residuals as close to zero as possible for all
              examples. But how do we combine 6 residuals into one score?
            </Lead>

            <div className="tf-subhead">MSE — Mean Squared Error (a single number for total error)</div>
            <Lead>
              We <b>square</b> each residual (so positive and negative errors don't cancel out,
              and large errors are penalised more heavily), then take the <b>average</b>. This is
              the <b>Mean Squared Error (MSE)</b>. The lower the MSE, the better the line.
            </Lead>
            <Formula label="MSE">
              <V>L</V> = <sup>1</sup>/<sub>n</sub> Σ (ŷ⁽ⁱ⁾ − y⁽ⁱ⁾)² = <sup>1</sup>/<sub>n</sub> Σ (<V>w</V>·x⁽ⁱ⁾ + <V>b</V> − y⁽ⁱ⁾)²
            </Formula>

            <div className="tf-subhead">MSE comparison — which line wins?</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,margin:"6px 0"}}>
              {candidates.map((c, i) => {
                const err = mse(c.w, c.b);
                return (
                  <div key={i} style={{border:`2px solid ${colors[i]}`,borderRadius:12,padding:"12px 14px",background:"var(--panel-solid)"}}>
                    <div style={{fontWeight:800,fontSize:14,color:colors[i],marginBottom:6}}>{c.label}</div>
                    <div style={{fontSize:12.5,color:"var(--muted)",lineHeight:1.5}}>
                      w = {c.w}, b = {c.b}<br/>
                      <b style={{color:"var(--ink)"}}>MSE = {fmt(err, 3)}</b>
                    </div>
                    <div style={{marginTop:6,height:8,background:"var(--line)",borderRadius:4,overflow:"hidden"}}>
                      <div style={{width:`${Math.min(100, err/15*100)}%`,height:"100%",background:colors[i],borderRadius:4,transition:"width 0.3s"}}/>
                    </div>
                    {i===2 && <div style={{fontSize:11,color:colors[i],fontWeight:700,marginTop:5}}>✓ lowest MSE = best fit</div>}
                  </div>
                );
              })}
            </div>

            <Lead>
              Line C (w=6.1, b=0.55) has the lowest MSE — it is the <b>best-fit line</b>.
              The training algorithm's entire job is to automatically find exactly these w and b
              values by minimising the MSE. The next steps show <em>how</em> it does that.
            </Lead>

            <Note>
              Why square the residuals instead of just taking absolute values? Squaring is
              mathematically smooth (differentiable everywhere) which makes gradient computation
              clean. It also penalises large errors <em>much</em> more than small ones — a residual
              of 4 contributes 16 to the sum, while a residual of 1 only contributes 1.
            </Note>
          </>
        );
      },
    },

    /* ── 5. Loss Function (formal) ────────────────────────── */
    {
      id: "loss", group: "Training",
      title: "Step 4 — The Loss Function (MSE) in Detail",
      map: "Loss (MSE)",
      why: "The loss function is the compass of training — it tells the algorithm how far it is from the goal. Every detail of how we compute it (squared vs absolute, mean vs sum) has mathematical and practical implications.",
      render: (trace) => {
        const { w, b, preds, resid, mse, cfg } = trace;
        const mseOpt = trace.mseNorm;
        return (
          <>
            <Lead>
              With your current slider values (w = <b>{fmt(w)}</b>, b = <b>{fmt(b)}</b>), let's
              compute the MSE step by step. Each row below shows one house: its predicted price,
              true price, the residual (gap), and the squared residual. The MSE is the average
              of that last column.
            </Lead>

            <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:W,display:"block",border:"1px solid var(--line)",borderRadius:12,background:"var(--panel-solid)",boxShadow:"var(--shadow)"}}>
              <Axes/>
              <RegLine w={w} b={b}/>
              <Residuals w={w} b={b}/>
              <Points/>
            </svg>
            <p style={{fontSize:12,color:"var(--muted)",marginTop:4}}>
              The <b style={{color:"rgba(226,76,96,0.9)"}}>red dashed lines</b> are the
              residuals — vertical gaps between your line and the true data points. Training
              wants to shrink these lines to zero.
            </p>

            <Formula label="MSE — current value">
              <V>L</V> = <sup>1</sup>/<sub>n</sub> Σ r⁽ⁱ⁾² = <sup>1</sup>/<sub>{cfg.xs.length}</sub> × {fmt(resid.reduce((s,r)=>s+r*r,0),3)}
              &nbsp;=&nbsp;<b style={{color:mse<0.5?"#1f9e6b":mse>2?"rgba(226,76,96,1)":"var(--ink)"}}>{fmt(mse,4)}</b>
            </Formula>

            <Matrix
              data={cfg.xs.map((x,i)=>[x, cfg.ys[i], preds[i], resid[i], resid[i]**2])}
              rowLabels={cfg.xs.map((_,i)=>`house ${i+1}`)}
              colLabels={["x (size)","y (true)","ŷ (pred)","r = ŷ−y","r²"]}
              caption="Residual table" sub="all 6 examples"
              cellTip={(i,j,v) => {
                if (j===3) return <div><div className="tf-tip-title">Residual for house {i+1}</div><div className="tf-tip-calc">ŷ − y = {fmt(preds[i])} − {fmt(cfg.ys[i])}</div><div className="tf-tip-sum">= <b>{fmt(v)}</b></div></div>;
                if (j===4) return <div><div className="tf-tip-title">Squared residual for house {i+1}</div><div className="tf-tip-calc">({fmt(resid[i])})²</div><div className="tf-tip-sum">= <b>{fmt(v)}</b></div></div>;
                return null;
              }}
            />

            <div className="tf-subhead">Why does squaring matter?</div>
            <div className="tf-lifecycle">
              <div className="tf-life tf-life--train">
                <div className="tf-life-h"><span>+</span> Squaring eliminates sign</div>
                <p>
                  Without squaring, a residual of +3 and one of −3 would cancel to zero — making it
                  look like the model is perfect when it isn't. Squaring makes all errors positive
                  so they accumulate properly.
                </p>
              </div>
              <div className="tf-life tf-life--infer">
                <div className="tf-life-h"><span>+</span> Large errors hurt more</div>
                <p>
                  A residual of 2 contributes 4 to the sum. A residual of 4 contributes 16 — four
                  times more, even though the raw error is only twice as large. This means the
                  algorithm strongly prioritises fixing the worst predictions first.
                </p>
              </div>
            </div>

            <div className="nn-calc">
              <div className="nn-calc-h">Summary</div>
              <div className="nn-calc-row">Sum of r² = {fmt(resid.reduce((s,r)=>s+r*r,0),4)}</div>
              <div className="nn-calc-row">÷ n = {cfg.xs.length}</div>
              <div className="nn-calc-row"><b>Current MSE = {fmt(mse,4)}</b></div>
              <div className="nn-calc-row" style={{borderTop:"1px solid var(--line)",paddingTop:6}}>Best achievable MSE ≈ {fmt(mseOpt,4)}</div>
              <div className="nn-calc-row">Gap to close = {fmt(Math.max(0,mse-mseOpt),4)} &nbsp;{mse-mseOpt<0.001?"✓ at optimum!":""}</div>
            </div>

            <Note>
              Move the w and b sliders and watch the MSE change in real time. Try to manually
              minimise it! You'll quickly see it's hard to do by hand. That's why we need
              <b> gradient descent</b> — an automatic method to find the minimum systematically.
            </Note>
          </>
        );
      },
    },

    /* ── 6. Gradients ─────────────────────────────────────── */
    {
      id: "gradients", group: "Training",
      title: "Step 5 — Gradients: Which Way Should w and b Move?",
      map: "Gradients",
      why: "The gradient is the key that unlocks automatic training. Once we have a formula for 'how much does the loss change if I nudge w a little bit', we can systematically move w in the direction that reduces the loss. This is the chain rule in action.",
      render: (trace) => {
        const { w, b, preds, resid, mse, dw, db, cfg } = trace;
        return (
          <>
            <Lead>
              We need to answer: <b>"if I increase w by a tiny amount, does the loss go up or
              down?"</b> The answer is the <b>gradient</b> ∂L/∂w. A positive gradient means
              "loss increases when w increases" — so to reduce loss, we should <em>decrease</em> w.
              A negative gradient means we should <em>increase</em> w.
            </Lead>

            <div className="tf-subhead">Deriving the gradient — chain rule step by step</div>
            <Lead>
              The loss L depends on w through the predictions ŷ. We use the <b>chain rule</b>
              from calculus: ∂L/∂w = (∂L/∂ŷ) × (∂ŷ/∂w). Let's expand this:
            </Lead>

            <Formula label="Loss">
              <V>L</V> = <sup>1</sup>/<sub>n</sub> Σ (ŷ⁽ⁱ⁾ − y⁽ⁱ⁾)²
              &nbsp;&nbsp;where&nbsp;&nbsp;
              ŷ⁽ⁱ⁾ = <V>w</V>·x⁽ⁱ⁾ + <V>b</V>
            </Formula>
            <Formula label="Chain rule for ∂L/∂w">
              <sup>∂L</sup>/<sub>∂ŷ</sub> = <sup>2</sup>/<sub>n</sub> (ŷ − y)
              &nbsp;&nbsp;and&nbsp;&nbsp;
              <sup>∂ŷ</sup>/<sub>∂w</sub> = x
              &nbsp;&nbsp;→&nbsp;&nbsp;
              <sup>∂L</sup>/<sub>∂w</sub> = <sup>2</sup>/<sub>n</sub> Σ (ŷ⁽ⁱ⁾ − y⁽ⁱ⁾) · x⁽ⁱ⁾
            </Formula>
            <Formula label="Chain rule for ∂L/∂b">
              <sup>∂ŷ</sup>/<sub>∂b</sub> = 1
              &nbsp;&nbsp;→&nbsp;&nbsp;
              <sup>∂L</sup>/<sub>∂b</sub> = <sup>2</sup>/<sub>n</sub> Σ (ŷ⁽ⁱ⁾ − y⁽ⁱ⁾)
            </Formula>

            <div className="tf-subhead">Numerical computation for current w = {fmt(w)}, b = {fmt(b)}</div>
            <Row>
              <div className="nn-calc" style={{flex:"1 1 240px"}}>
                <div className="nn-calc-h">∂L/∂w — gradient w.r.t. slope</div>
                <div className="nn-calc-row">Σ (ŷ−y)·x = {fmt(cfg.xs.reduce((s,x,i)=>s+resid[i]*x,0),4)}</div>
                <div className="nn-calc-row">× (2/n) = × {fmt(2/cfg.xs.length,4)}</div>
                <div className="nn-calc-row"><b>∂L/∂w = {fmt(dw,4)}</b></div>
                <div className="nn-calc-row" style={{marginTop:8,padding:"6px 8px",borderRadius:8,background:dw>0.01?"rgba(226,76,96,.1)":dw<-0.01?"rgba(43,91,255,.1)":"rgba(31,158,107,.1)"}}>
                  {dw > 0.01 ? "Positive → w is too large, decrease it ↓"
                   : dw < -0.01 ? "Negative → w is too small, increase it ↑"
                   : "≈ 0 → w is near the optimum ✓"}
                </div>
              </div>
              <div className="nn-calc" style={{flex:"1 1 240px"}}>
                <div className="nn-calc-h">∂L/∂b — gradient w.r.t. intercept</div>
                <div className="nn-calc-row">Σ (ŷ−y) = {fmt(resid.reduce((s,r)=>s+r,0),4)}</div>
                <div className="nn-calc-row">× (2/n) = × {fmt(2/cfg.xs.length,4)}</div>
                <div className="nn-calc-row"><b>∂L/∂b = {fmt(db,4)}</b></div>
                <div className="nn-calc-row" style={{marginTop:8,padding:"6px 8px",borderRadius:8,background:db>0.01?"rgba(226,76,96,.1)":db<-0.01?"rgba(43,91,255,.1)":"rgba(31,158,107,.1)"}}>
                  {db > 0.01 ? "Positive → b is too large, decrease it ↓"
                   : db < -0.01 ? "Negative → b is too small, increase it ↑"
                   : "≈ 0 → b is near the optimum ✓"}
                </div>
              </div>
            </Row>

            <div className="tf-subhead">Per-example gradient contributions</div>
            <Lead>
              The gradient is an average over all training examples. Each row below shows how
              much that one example "voted" for increasing or decreasing w and b.
            </Lead>
            <Matrix
              data={cfg.xs.map((x,i)=>[x, cfg.ys[i], preds[i], resid[i], resid[i]*x, resid[i]])}
              rowLabels={cfg.xs.map((_,i)=>`house ${i+1}`)}
              colLabels={["x","y","ŷ","r=ŷ−y","r·x (→∂w)","r (→∂b)"]}
              caption="Gradient accumulation" sub="per-example"
              cellTip={(i,j,v)=>{
                if(j===4) return <div><div className="tf-tip-title">Contribution to ∂L/∂w (house {i+1})</div><div className="tf-tip-calc">r·x = {fmt(resid[i])}×{fmt(cfg.xs[i])}</div><div className="tf-tip-sum">= <b>{fmt(v)}</b></div></div>;
                return null;
              }}
            />

            <Note>
              Notice: examples with large residuals (the model is very wrong on them) contribute
              the most to the gradient, so gradient descent will correct the largest mistakes first.
              This is an elegant property of MSE + squared residuals.
            </Note>
          </>
        );
      },
    },

    /* ── 7. Gradient Descent ──────────────────────────────── */
    {
      id: "gd", group: "Training",
      title: "Step 6 — Gradient Descent: Walking Downhill to Find the Best w and b",
      map: "Gradient Descent",
      why: "Gradient descent is the engine that trains almost every ML model ever built. The idea is simple: nudge each weight a tiny amount in the direction that reduces loss. Repeat thousands of times and the weights converge to near-optimal values.",
      render: (trace) => {
        const { w, b, dw, db, mse } = trace;
        const eta = 0.1;
        const wNew = w - eta * dw;
        const bNew = b - eta * db;
        const mseNew = window.ML_LIN.runLinear({ w: wNew, b: bNew }).mse;
        const improved = mseNew < mse;

        // Simulate 5 steps of GD from current position
        const steps = [];
        let wt = w, bt = b;
        for (let i = 0; i < 6; i++) {
          const t = window.ML_LIN.runLinear({ w: wt, b: bt });
          steps.push({ w: wt, b: bt, mse: t.mse, step: i });
          wt = wt - eta * t.dw;
          bt = bt - eta * t.db;
        }

        return (
          <>
            <Lead>
              We have the gradients — now we use them. The <b>gradient descent update rule</b> says:
              subtract a small fraction (the <b>learning rate η</b>) of the gradient from each
              parameter. This moves w and b slightly downhill on the loss surface. Repeat this
              many times and the parameters converge to the values that minimise the loss.
            </Lead>

            <Formula label="Update rule">
              <V>w</V> ← <V>w</V> − <V>η</V> · <sup>∂L</sup>/<sub>∂w</sub>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <V>b</V> ← <V>b</V> − <V>η</V> · <sup>∂L</sup>/<sub>∂b</sub>
            </Formula>

            <div className="tf-subhead">One update step from current position (η = {eta})</div>
            <Row>
              <div className="nn-calc" style={{flex:"1 1 260px"}}>
                <div className="nn-calc-h">Updating w</div>
                <div className="nn-calc-row">w<sub>old</sub> = {fmt(w)}</div>
                <div className="nn-calc-row">∂L/∂w = {fmt(dw,4)}</div>
                <div className="nn-calc-row">w<sub>new</sub> = {fmt(w)} − {eta} × {fmt(dw,4)}</div>
                <div className="nn-calc-row"><b>w<sub>new</sub> = {fmt(wNew,4)}</b></div>
              </div>
              <div className="nn-calc" style={{flex:"1 1 260px"}}>
                <div className="nn-calc-h">Updating b</div>
                <div className="nn-calc-row">b<sub>old</sub> = {fmt(b)}</div>
                <div className="nn-calc-row">∂L/∂b = {fmt(db,4)}</div>
                <div className="nn-calc-row">b<sub>new</sub> = {fmt(b)} − {eta} × {fmt(db,4)}</div>
                <div className="nn-calc-row"><b>b<sub>new</sub> = {fmt(bNew,4)}</b></div>
              </div>
              <div className="nn-calc" style={{flex:"1 1 200px"}}>
                <div className="nn-calc-h">MSE after this step</div>
                <div className="nn-calc-row">Before: {fmt(mse,4)}</div>
                <div className="nn-calc-row">After: {fmt(mseNew,4)}</div>
                <div className="nn-calc-row">
                  <b style={{color:improved?"#1f9e6b":"rgba(226,76,96,1)"}}>
                    {improved ? `↓ ${fmt(mse-mseNew,4)} better ✓` : `↑ diverging — try smaller η`}
                  </b>
                </div>
              </div>
            </Row>

            <div className="tf-subhead">Simulating 5 steps of gradient descent from current position</div>
            <div style={{overflowX:"auto"}}>
              <table style={{borderCollapse:"collapse",width:"100%",fontSize:12.5,fontFamily:"var(--num-font)"}}>
                <thead>
                  <tr style={{borderBottom:"2px solid var(--accent)"}}>
                    {["Step","w","b","MSE","∂L/∂w","∂L/∂b","Δ MSE"].map(h=>(
                      <th key={h} style={{padding:"6px 12px",textAlign:"left",color:"var(--accent-ink)",fontWeight:800,fontSize:11}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {steps.map((s,i) => (
                    <tr key={i} style={{background:i===0?"var(--accent-soft)":"transparent",borderBottom:"1px solid var(--line)"}}>
                      <td style={{padding:"5px 12px",color:"var(--muted)"}}>{i===0?"current":i}</td>
                      <td style={{padding:"5px 12px"}}>{fmt(s.w,4)}</td>
                      <td style={{padding:"5px 12px"}}>{fmt(s.b,4)}</td>
                      <td style={{padding:"5px 12px",fontWeight:700,color:s.mse<0.5?"#1f9e6b":s.mse>2?"rgba(226,76,96,1)":"var(--ink)"}}>{fmt(s.mse,4)}</td>
                      <td style={{padding:"5px 12px",color:"var(--muted)",fontSize:11}}>{fmt(window.ML_LIN.runLinear({w:s.w,b:s.b}).dw,4)}</td>
                      <td style={{padding:"5px 12px",color:"var(--muted)",fontSize:11}}>{fmt(window.ML_LIN.runLinear({w:s.w,b:s.b}).db,4)}</td>
                      <td style={{padding:"5px 12px",fontSize:11,color:i===0?"var(--muted)":steps[i].mse<steps[i-1]?.mse?"#1f9e6b":"rgba(226,76,96,1)"}}>
                        {i===0?"—":fmt(steps[i-1].mse-steps[i].mse,4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="tf-subhead">The loss surface — visualising gradient descent as walking downhill</div>
            <Row>
              <div style={{flex:"1 1 300px"}}>
                <LossSurface wCur={w} bCur={b}/>
                <p style={{fontSize:11.5,color:"var(--muted)",marginTop:6,lineHeight:1.5}}>
                  Each contour = a line of equal MSE. The centre is the minimum (lowest MSE).
                  Gradient descent moves the blue dot toward the green optimum, following
                  the steepest downhill path on this surface.
                </p>
              </div>
              <div style={{flex:"1 1 260px"}}>
                <div className="tf-subhead">Learning rate η — the most important hyperparameter</div>
                <div className="tf-legend" style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[
                    ["η too small (e.g. 0.001)","Need thousands of steps to converge. Training is correct but very slow. Common in practice with schedulers."],
                    ["η too large (e.g. 1.0)","Each step overshoots the minimum, bouncing back and forth. MSE oscillates or diverges."],
                    ["η just right (e.g. 0.05–0.2)","Smooth decrease in loss each step. Converges in 50–200 iterations for this dataset."],
                  ].map(([name,desc])=>(
                    <div key={name} className="tf-leg">
                      <div className="tf-leg-name">{name}</div>
                      <div className="tf-leg-desc">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Row>

            <Note>
              In deep learning, gradient descent runs over <b>mini-batches</b> (e.g. 32 examples
              at a time) rather than the full dataset. This adds noise that actually helps
              escape bad local minima. The same ∂L/∂w formula applies — just averaged over the
              batch instead of all n examples.
            </Note>
          </>
        );
      },
    },

    /* ── 8. Normal Equation ───────────────────────────────── */
    {
      id: "normal-eq", group: "Training",
      title: "Step 7 — Normal Equation: The Exact Algebraic Solution",
      map: "Normal Equation",
      why: "Gradient descent finds the minimum iteratively. But for linear regression there's actually an exact formula that gives you the optimal w and b in one shot — no iterations needed. Understanding it builds deep intuition about what GD is converging to.",
      render: (trace) => {
        const { wNorm, bNorm, mseNorm, w, b, mse, cfg } = trace;
        const n = cfg.xs.length;
        const xMean = cfg.xs.reduce((a,c)=>a+c,0)/n;
        const yMean = cfg.ys.reduce((a,c)=>a+c,0)/n;
        const ssxy = cfg.xs.reduce((s,x,i)=>s+(x-xMean)*(cfg.ys[i]-yMean),0);
        const ssxx = cfg.xs.reduce((s,x)=>s+(x-xMean)**2,0);
        const designMatrix = cfg.xs.map(x=>[1,x]);
        return (
          <>
            <Lead>
              Instead of iterating, we can set the gradient equal to zero and solve algebraically.
              When ∂L/∂w = 0 and ∂L/∂b = 0 simultaneously, we are at the minimum.
              Solving this system gives the <b>Normal Equation</b> — the exact optimal weights
              in a single calculation.
            </Lead>

            <div className="tf-subhead">For single-feature linear regression</div>
            <Lead>
              Set ∂L/∂w = 0 and solve. After algebra, you get:
            </Lead>
            <Formula label="Optimal w*">
              <V>w*</V> = Σ(x⁽ⁱ⁾ − x̄)(y⁽ⁱ⁾ − ȳ) / Σ(x⁽ⁱ⁾ − x̄)²
              &nbsp;= SS<Sub>xy</Sub> / SS<Sub>xx</Sub>
            </Formula>
            <Formula label="Optimal b*">
              <V>b*</V> = ȳ − <V>w*</V> · x̄
            </Formula>
            <Lead>
              This is the <b>covariance of x and y divided by the variance of x</b>. Intuitively:
              how much do x and y move together (covariance), relative to how spread out x is
              (variance).
            </Lead>

            <div className="tf-subhead">Numerical calculation for our dataset</div>
            <div className="nn-calc">
              <div className="nn-calc-h">Step-by-step for our 6 houses</div>
              <div className="nn-calc-row">x̄ = ({cfg.xs.join(" + ")}) / {n} = <b>{fmt(xMean,4)}</b></div>
              <div className="nn-calc-row">ȳ = ({cfg.ys.join(" + ")}) / {n} = <b>{fmt(yMean,4)}</b></div>
              <div className="nn-calc-row">SS_xy = Σ(x−x̄)(y−ȳ) = <b>{fmt(ssxy,4)}</b></div>
              <div className="nn-calc-row">SS_xx = Σ(x−x̄)² = <b>{fmt(ssxx,4)}</b></div>
              <div className="nn-calc-row" style={{borderTop:"1px solid var(--line)",paddingTop:6}}>
                <b>w* = {fmt(ssxy,4)} / {fmt(ssxx,4)} = {fmt(wNorm,4)}</b>
              </div>
              <div className="nn-calc-row"><b>b* = {fmt(yMean,4)} − {fmt(wNorm,4)} × {fmt(xMean,4)} = {fmt(bNorm,4)}</b></div>
              <div className="nn-calc-row" style={{borderTop:"1px solid var(--line)",paddingTop:6}}>
                Optimal MSE = <b>{fmt(mseNorm,4)}</b> &nbsp;(minimum possible)
              </div>
            </div>

            <div className="tf-subhead">General form (multiple features) — matrix notation</div>
            <Lead>
              For any number of features p, add a column of 1s to the data matrix X (for the
              bias), and the optimal weight vector is:
            </Lead>
            <Formula label="Matrix Normal Equation">
              <b>w*</b> = (X<Sup>T</Sup>X)<Sup>−1</Sup> X<Sup>T</Sup> <V>y</V>
            </Formula>
            <Row>
              <Matrix
                data={designMatrix}
                rowLabels={cfg.xs.map((_,i)=>`house ${i+1}`)}
                colLabels={["1 (bias col)", "x (size)"]}
                caption="Design matrix X" sub={`${n}×2`} heat={false}
              />
              <Matrix
                data={cfg.ys.map(y=>[y])}
                rowLabels={cfg.ys.map((_,i)=>`house ${i+1}`)}
                colLabels={["y (price)"]}
                caption="Label vector y" sub={`${n}×1`} heat={false}
              />
              <div className="nn-calc" style={{flex:"1 1 200px"}}>
                <div className="nn-calc-h">GD vs Normal Eq.</div>
                <div className="nn-calc-row">Your w = {fmt(w)}</div>
                <div className="nn-calc-row">Optimal w* = {fmt(wNorm,4)}</div>
                <div className="nn-calc-row">Your b = {fmt(b)}</div>
                <div className="nn-calc-row">Optimal b* = {fmt(bNorm,4)}</div>
                <div className="nn-calc-row" style={{borderTop:"1px solid var(--line)",paddingTop:6}}>
                  Your MSE = {fmt(mse,4)}
                </div>
                <div className="nn-calc-row">Min MSE = {fmt(mseNorm,4)}</div>
              </div>
            </Row>

            <div className="opt-pc">
              <div className="opt-pc-col is-pro">
                <div className="opt-pc-h">Normal Equation — when to use</div>
                <ul>
                  <li>Exact one-shot solution, no η to tune</li>
                  <li>No convergence monitoring needed</li>
                  <li>Fast when features p &lt; ~10,000</li>
                  <li>Works identically every time (no randomness)</li>
                </ul>
              </div>
              <div className="opt-pc-col is-con">
                <div className="opt-pc-h">Normal Equation — limitations</div>
                <ul>
                  <li>O(p³) matrix inversion — very slow for many features</li>
                  <li>Requires (XᵀX) to be invertible (fails with collinear features)</li>
                  <li>Doesn't generalise to non-linear models or neural networks</li>
                  <li>Can't use mini-batches — must load all data at once</li>
                </ul>
              </div>
            </div>

            <Note>
              The Normal Equation is why linear regression is special. Every other ML model
              (logistic regression, neural networks, SVMs) has no closed-form solution and
              <em>requires</em> gradient descent. But knowing it exists for linear regression
              gives us a ground-truth benchmark to check our GD implementation against.
            </Note>
          </>
        );
      },
    },

    /* ── 9. Trained Model → Predictions ──────────────────── */
    {
      id: "predictions", group: "Prediction",
      title: "Step 8 — Now We Predict! Using the Trained Model",
      map: "Predictions",
      why: "Training is done. We have our optimal w* and b*. NOW we can talk about predictions — using the learned line to estimate prices for houses we've never seen. This is called 'inference' or the 'forward pass'.",
      render: (trace) => {
        const { wNorm: wOpt, bNorm: bOpt, cfg } = trace;

        // Use the optimal values for predictions
        const optPreds = cfg.xs.map(x => wOpt * x + bOpt);

        // Some new houses not in training data
        const newHouses = [0.15, 0.45, 0.75, 0.95];
        const newPreds = newHouses.map(x => wOpt * x + bOpt);

        return (
          <>
            <Lead>
              After training, we found the optimal weights: <b>w* = {fmt(wOpt,3)}</b> and
              <b> b* = {fmt(bOpt,3)}</b>. These are now <b>fixed</b> — training is over.
              To predict the price of any house, we simply plug its size into the formula:
              ŷ = {fmt(wOpt,3)} × x + {fmt(bOpt,3)}.
            </Lead>

            <Formula label="Trained model">
              <V>ŷ</V> = <b>{fmt(wOpt,3)}</b> · <V>x</V> + <b>{fmt(bOpt,3)}</b>
            </Formula>

            <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:W,display:"block",border:"1px solid var(--line)",borderRadius:12,background:"var(--panel-solid)",boxShadow:"var(--shadow)"}}>
              <Axes/>
              <RegLine w={wOpt} b={bOpt} color="#1f9e6b" width={2.8}/>
              {/* New query points */}
              {newHouses.map((x,i) => (
                <g key={i}>
                  <line x1={sx(x)} y1={sy(0)} x2={sx(x)} y2={sy(wOpt*x+bOpt)} stroke="rgba(31,158,107,0.3)" strokeWidth="1" strokeDasharray="3 3"/>
                  <circle cx={sx(x)} cy={sy(wOpt*x+bOpt)} r="6" fill="#1f9e6b" stroke="white" strokeWidth="1.5" opacity="0.85"/>
                </g>
              ))}
              <Points/>
              <text x={sx(0.5)+5} y={sy(wOpt*0.5+bOpt)-14} fontSize="11" fill="#1f9e6b" fontWeight="700" fontFamily="var(--num-font)">best-fit line</text>
            </svg>
            <p style={{fontSize:12,color:"var(--muted)",marginTop:4}}>
              Green circles = predictions for 4 <b>new houses</b> not in the training data.
              Blue circles = the original training data. The line predicts prices for any size.
            </p>

            <div className="tf-subhead">Predictions on the training data (checking our fit)</div>
            <Matrix
              data={cfg.xs.map((x,i)=>[x, cfg.ys[i], optPreds[i], cfg.ys[i]-optPreds[i]])}
              rowLabels={cfg.xs.map((_,i)=>`house ${i+1}`)}
              colLabels={["x (size)","y (true price)","ŷ (predicted)","error"]}
              caption="Training predictions" sub="using optimal w* and b*"
              cellTip={(i,j,v)=>{
                if(j===2) return <div><div className="tf-tip-title">Prediction for house {i+1}</div><div className="tf-tip-calc">{fmt(wOpt,3)} × {fmt(cfg.xs[i])} + {fmt(bOpt,3)}</div><div className="tf-tip-sum">= <b>{fmt(v)}</b> ($100k)</div></div>;
                return null;
              }}
            />

            <div className="tf-subhead">Predicting on NEW houses (generalisation)</div>
            <Lead>
              This is the whole point of training — making predictions on examples the model has
              never seen. We just plug in the new house sizes:
            </Lead>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10,margin:"6px 0"}}>
              {newHouses.map((x,i) => (
                <div key={i} style={{border:"1px solid var(--line)",borderRadius:12,padding:"12px 14px",background:"var(--panel-solid)"}}>
                  <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"var(--faint)",marginBottom:6}}>New house {i+1}</div>
                  <div style={{fontSize:12.5,color:"var(--muted)",lineHeight:1.6}}>
                    Size x = <b>{x}</b><br/>
                    ŷ = {fmt(wOpt,3)} × {x} + {fmt(bOpt,3)}<br/>
                    = {fmt(wOpt*x,3)} + {fmt(bOpt,3)}<br/>
                    <b style={{color:"#1f9e6b",fontSize:14}}>= ${fmt(newPreds[i],2)} × 100k</b>
                  </div>
                </div>
              ))}
            </div>

            <Note>
              Notice: we trained on 6 examples, but we can predict for <em>any</em> house size.
              The model has learned a general relationship, not memorised specific examples.
              Whether this generalises well depends on whether real data follows the linear
              assumption — which we test with metrics like R² and RMSE, covered next.
            </Note>
          </>
        );
      },
    },

    /* ── 10. Evaluation ───────────────────────────────────── */
    {
      id: "evaluation", group: "Evaluation",
      title: "Step 9 — Evaluating the Model: R², RMSE, and Diagnostics",
      map: "Evaluation",
      why: "MSE tells us the raw error magnitude, but it's hard to interpret without context. R² gives a scale-free score (0 to 1) answering 'what fraction of the variation in prices does our model explain?'. RMSE converts back to the original units.",
      render: (trace) => {
        const { w, b, r2, mse, mseNorm, cfg } = trace;
        const yMean = cfg.ys.reduce((a,c)=>a+c,0)/cfg.ys.length;
        const ssTot = cfg.ys.reduce((s,y)=>s+(y-yMean)**2,0);
        const ssRes = cfg.xs.reduce((s,x,i)=>s+(w*x+b-cfg.ys[i])**2,0);
        const rmse = Math.sqrt(mse);
        const r2Pct = (Math.max(0,r2)*100).toFixed(1);
        return (
          <>
            <Lead>
              With your current w = <b>{fmt(w)}</b> and b = <b>{fmt(b)}</b>, how good is the model?
              MSE = {fmt(mse,3)} tells us the average squared error, but what does that actually
              mean? Three metrics help us interpret model quality clearly.
            </Lead>

            <div className="tf-subhead">Metric 1 — RMSE (Root Mean Squared Error)</div>
            <Lead>
              Taking the square root of MSE gives RMSE, which is in the <b>same units as y</b>
              ($100k here). RMSE = {fmt(rmse,3)} means our predictions are off by about
              ${fmt(rmse*100,0)}k on average.
            </Lead>
            <Formula label="RMSE"><V>RMSE</V> = √MSE = √{fmt(mse,3)} = <b>{fmt(rmse,4)}</b> ($100k)</Formula>

            <div className="tf-subhead">Metric 2 — R² (Coefficient of Determination)</div>
            <Lead>
              R² asks: <b>"how much better is our model than just predicting the mean price for
              every house?"</b> It compares our residual variance (SS_res) to the total variance
              in y (SS_tot). R² = 1 = perfect fit; R² = 0 = no better than the mean.
            </Lead>
            <Formula label="R²">
              <V>R²</V> = 1 − SS<Sub>res</Sub>/SS<Sub>tot</Sub>
              &nbsp;=&nbsp; 1 − {fmt(ssRes,3)}/{fmt(ssTot,3)}
              &nbsp;=&nbsp;
              <b style={{color:r2>0.9?"#1f9e6b":r2>0.6?"var(--ink)":"rgba(226,76,96,1)"}}>{fmt(Math.max(0,r2),4)}</b>
              &nbsp; ({r2Pct}% of price variation explained)
            </Formula>

            <Row>
              <div style={{flex:"1 1 380px"}}>
                <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:W,display:"block",border:"1px solid var(--line)",borderRadius:12,background:"var(--panel-solid)",boxShadow:"var(--shadow)"}}>
                  <Axes/>
                  {/* Mean line */}
                  <line x1={PAD.l} y1={sy(yMean)} x2={W-PAD.r} y2={sy(yMean)} stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6"/>
                  <text x={W-PAD.r-5} y={sy(yMean)-6} textAnchor="end" fontSize="10" fill="var(--muted)">mean ȳ = {fmt(yMean,2)}</text>
                  <RegLine w={w} b={b}/>
                  <Residuals w={w} b={b}/>
                  <Points/>
                </svg>
              </div>
              <div style={{flex:"1 1 220px"}}>
                <div className="nn-calc">
                  <div className="nn-calc-h">All metrics — current model</div>
                  <div className="nn-calc-row">MSE = {fmt(mse,4)}</div>
                  <div className="nn-calc-row">RMSE = {fmt(rmse,4)} ($100k)</div>
                  <div className="nn-calc-row">R² = {fmt(Math.max(0,r2),4)}</div>
                  <div className="nn-calc-row" style={{borderTop:"1px solid var(--line)",paddingTop:6,color:"#1f9e6b"}}>
                    Optimal MSE = {fmt(mseNorm,4)}
                  </div>
                  <div className="nn-calc-row" style={{color:"#1f9e6b"}}>
                    Optimal RMSE = {fmt(Math.sqrt(mseNorm),4)}
                  </div>
                </div>
                <div style={{marginTop:10,padding:"10px 12px",background:"var(--accent-soft)",borderRadius:10,fontSize:12,color:"var(--muted)",lineHeight:1.5}}>
                  <b style={{color:"var(--accent-ink)"}}>Interpreting R²:</b><br/>
                  R² &gt; 0.9 → excellent fit<br/>
                  R² 0.7–0.9 → good<br/>
                  R² 0.5–0.7 → moderate<br/>
                  R² &lt; 0.5 → poor — consider non-linear model
                </div>
              </div>
            </Row>

            <Note>
              Metric 3 — always <b>plot residuals vs fitted values</b>. If residuals fan out
              (increase with ŷ), or show a curved pattern, the linear assumption is violated
              and a transformation or non-linear model is needed. Numbers alone can hide this.
            </Note>
          </>
        );
      },
    },

    /* ── 11. Assumptions & When to Use ───────────────────── */
    {
      id: "assumptions", group: "Evaluation",
      title: "Step 10 — Assumptions, Limitations & When to Use Linear Regression",
      map: "Assumptions",
      why: "Every model has assumptions. Using linear regression when its assumptions are violated will give you confidently wrong answers. Knowing when to use it — and when to reach for something else — is as important as knowing how it works.",
      render: () => (
        <>
          <Lead>
            Linear regression makes four statistical assumptions, remembered as
            <b> L-I-N-E</b>. When these hold, linear regression is proven to be the
            <b> Best Linear Unbiased Estimator</b> (the Gauss-Markov theorem). When they're
            violated, results can be misleading — so always check before reporting conclusions.
          </Lead>

          <div className="tf-subhead">The four LINE assumptions</div>
          <div className="tf-legend">
            {[
              ["L","Linearity","The relationship between x and y must be linear. Check: plot y vs x and residuals vs ŷ — both should show no curved pattern. Fix: transform features (log x, x²) or use polynomial regression."],
              ["I","Independence","Each training example must be independent of all others. Violated in time series (tomorrow's price depends on today's). Fix: use time-series models (ARIMA, LSTMs)."],
              ["N","Normality of residuals","Residuals should be approximately normally distributed. Matters most for confidence intervals and p-values. Check: Q-Q plot. Less important for pure prediction."],
              ["E","Equal variance (homoscedasticity)","Residuals should have constant spread across all values of x. If errors grow with x (heteroscedasticity), predictions are less reliable. Fix: log-transform y."],
            ].map(([letter,name,desc]) => (
              <div className="tf-leg" key={letter}>
                <div className="tf-leg-top">
                  <span className="tf-sym" style={{minWidth:28,justifyContent:"center"}}>{letter}</span>
                  <span className="tf-leg-name" style={{margin:0}}>{name}</span>
                </div>
                <div className="tf-leg-desc" style={{marginTop:6}}>{desc}</div>
              </div>
            ))}
          </div>

          <div className="tf-subhead">Strengths vs weaknesses</div>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">Strengths</div>
              <ul>
                <li><b>Interpretable:</b> w tells you directly how much each feature matters. "Every extra 100 sqft adds $X to the price."</li>
                <li><b>Fast:</b> normal equation trains in milliseconds even on large datasets with few features</li>
                <li><b>No hyperparameters</b> with normal equation — just compute and done</li>
                <li><b>Confidence intervals:</b> built-in statistical uncertainty around each prediction</li>
                <li><b>Foundation:</b> identical training loop to deep networks — master this first</li>
                <li><b>Baseline:</b> always run linear regression first to see how hard the problem is</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">Weaknesses</div>
              <ul>
                <li><b>Assumes linearity:</b> fails on curved, wavy, or interaction-heavy relationships</li>
                <li><b>Sensitive to outliers:</b> MSE squares errors, so one bad point can drag the line far</li>
                <li><b>Multicollinearity:</b> correlated features make XᵀX ill-conditioned; coefficients become unstable</li>
                <li><b>Feature engineering burden:</b> you must manually add x², log(x), x·z interaction terms</li>
                <li><b>No flexibility:</b> a decision tree or random forest will almost always beat it on complex real data</li>
              </ul>
            </div>
          </div>

          <div className="tf-subhead">When to use linear regression vs alternatives</div>
          <div className="tf-legend">
            {[
              ["✓ Use it","Establishing a baseline","Always start here — if linear regression achieves R²=0.95, you don't need a complex model."],
              ["✓ Use it","Interpretability is required","Stakeholders want to know 'how much does feature X matter?' — coefficients answer this directly."],
              ["✓ Use it","Small dataset, few features","With n < 10k and p < 100, the normal equation is instant and doesn't overfit."],
              ["✗ Avoid","Images, text, audio","High-dimensional, non-linear structure → use CNNs, Transformers, or RNNs."],
              ["✗ Avoid","Strong non-linearity","Curved patterns → polynomial regression, Decision Tree, Random Forest, or XGBoost."],
              ["✗ Avoid","Predicting counts or probabilities","Use Poisson regression (counts) or Logistic Regression (probabilities 0–1)."],
              ["✗ Avoid","Outlier-heavy data","Use Huber loss or median regression instead — squared errors amplify outlier influence."],
            ].map(([status,name,desc]) => (
              <div className={"tf-leg"+(status==="✓ Use it"?" is-learned":"")} key={name}>
                <div className="tf-leg-top">
                  <span className="tf-sym" style={{background:status==="✓ Use it"?"var(--accent)":"rgba(226,76,96,.15)",color:status==="✓ Use it"?"#fff":"rgba(226,76,96,1)",border:"none"}}>{status==="✓ Use it"?"✓":"✗"}</span>
                </div>
                <div className="tf-leg-name">{name}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>

          <Note icon="★">
            You've completed the Linear Regression walkthrough. The four-step loop you learned —
            <b> forward pass (compute ŷ) → loss (MSE) → gradients (∂L/∂w, ∂L/∂b) →
            parameter update (gradient descent)</b> — is identical to training a neural network.
            The only difference is that a neural network has more layers, so backpropagation
            applies the chain rule multiple times. Everything else is the same pattern.
          </Note>
        </>
      ),
    },
    {
      id: "hyperparams",
      group: "Practical",
      title: "Hyperparameters & when to use Linear Regression",
      map: "Hyperparams",
      why: "Linear regression has almost no hyperparameters — the model itself teaches you when it fits and when to reach for something more powerful.",
      render: () => (
        <>
          <Lead>Linear regression is the simplest model. It has almost no knobs to tune — most 'parameters' are actually preprocessing choices or regularization variants. When it works, it's fast, interpretable, and provably optimal (Gauss-Markov). When it doesn't, you need to add regularization or switch models.</Lead>
          <div className="tf-subhead">Key hyperparameters</div>
          <div className="tf-legend">
            {[
              ["fit_intercept", "Fit intercept (bias)", "Default True. Set False only if data is pre-centered. Almost always leave True."],
              ["copy_X", "Copy input X", "Default True. Set False to save memory on huge matrices — but X gets overwritten in-place."],
              ["alpha (Ridge)", "Regularization strength (L2)", "Default 1.0. Higher = stronger L2 penalty = smaller coefficients = less overfitting. Tune with cross-validation: try [0.001, 0.01, 0.1, 1, 10, 100]. If coefficients are huge without regularization, increase alpha."],
              ["alpha (Lasso)", "Regularization strength (L1)", "Controls sparsity. Higher alpha = more coefficients shrunk to exactly zero (feature selection). Start at 1.0, tune via cross-validation."],
              ["max_iter", "Max solver iterations", "Default 1000. Increase to 10000 if solver doesn't converge."],
              ["normalize", "Feature scaling (deprecated)", "Always scale features before fitting — LinearRegression doesn't do it for you. Use sklearn's StandardScaler."],
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
              {["Interpretable — each coefficient has a clear unit-level meaning", "Fast training — closed-form normal equation or fast iterative solvers", "Works well on small datasets", "No scaling required for Ridge variant", "Coefficients are the exact optimal solution (normal equation)", "Statistical p-values available for inference", "Gauss-Markov optimal under linearity, independence, and equal-variance assumptions"].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
              {["Assumes a linear relationship between features and target", "Sensitive to outliers — MSE loss amplifies large residuals", "Multicollinearity inflates coefficient variance", "Can't model feature interactions without explicit engineering", "Underfits complex, non-linear data", "Extrapolation beyond training range is unreliable"].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✗ {t}</div>)}
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
                  ["Features are roughly linearly related to target", "Linear / Ridge Regression", "The model is correctly specified; adding complexity would only add noise"],
                  ["You need coefficient interpretability for a business report", "Linear / Ridge Regression", "Each coefficient has a clear unit-level meaning"],
                  ["Many correlated features (multicollinearity)", "Ridge Regression (L2)", "L2 distributes weight evenly across correlated features"],
                  ["You want automatic feature selection", "Lasso Regression (L1)", "L1 shrinks unimportant coefficients exactly to zero"],
                  ["Outliers are common in the target", "Huber Regression", "Huber loss is less sensitive to large residuals than MSE"],
                  ["Relationship is clearly non-linear", "Decision Tree / GBM", "Tree models capture non-linearity without feature engineering"],
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
    title: "Linear Regression",
    subtitle: "how a model learns its coefficients — then predicts",
    cur: "Linear Regression",
    category: "Regression",
    run: (input) => window.ML_LIN.runLinear(input),
    default: { w: 3.0, b: 1.0 },
    renderInput,
  };
})();
