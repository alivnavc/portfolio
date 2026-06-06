/* Optimizer explainer stages */
(function () {
  const { V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState, useRef, useEffect } = React;
  const O = window.OPT;

  const COL = {
    sgd: "#8294b5", momentum: "#2b5bff", nesterov: "#06a3c7", adagrad: "#e0851e",
    rmsprop: "#1f9e6b", adam: "#7c5cff", adamw: "#e0518f",
  };
  const NAME = { sgd: "SGD", momentum: "Momentum", nesterov: "Nesterov", adagrad: "AdaGrad", rmsprop: "RMSProp", adam: "Adam", adamw: "AdamW" };

  /* ---- contour plot with animated descent paths ---- */
  function OptViz({ paths, animate }) {
    const W = 500, H = 300, padL = 40, padR = 20, padT = 16, padB = 26;
    const sx = (x) => padL + (x + 5) / 10 * (W - padL - padR);
    const sy = (y) => padT + (3 - y) / 6 * (H - padT - padB);
    const [frame, setFrame] = useState(O.STEPS);
    const [playing, setPlaying] = useState(false);
    const timer = useRef(null);
    useEffect(() => () => clearInterval(timer.current), []);
    function play() {
      if (playing) return; setPlaying(true); setFrame(0);
      let f = 0; timer.current = setInterval(() => { f += 1; setFrame(f); if (f >= O.STEPS) { clearInterval(timer.current); setPlaying(false); } }, 90);
    }
    // contour ellipses
    const scaleX = (W - padL - padR) / 10, scaleY = (H - padT - padB) / 6;
    const levels = [0.6, 2, 5, 10, 18, 28];
    return (
      <div className="opt-viz">
        {animate && <div className="nn-diagram-bar"><button className="tf-headbtn is-on" onClick={play} disabled={playing}>▶ Animate descent</button><span className="nn-diagram-hint">Watch each optimizer walk down the loss surface (contours = equal loss).</span></div>}
        <svg viewBox={`0 0 ${W} ${H}`} className="opt-svg">
          {levels.map((L, i) => (
            <ellipse key={i} cx={sx(0)} cy={sy(0)} rx={Math.sqrt(2 * L / O.A) * scaleX} ry={Math.sqrt(2 * L / O.B) * scaleY}
              fill="none" stroke="var(--line)" strokeWidth="1" />
          ))}
          <circle cx={sx(0)} cy={sy(0)} r="4" fill="#1f9e6b" />
          <text x={sx(0) + 8} y={sy(0) + 4} className="opt-axl">min</text>
          {paths.map((p, pi) => {
            const pts = p.path.slice(0, (animate ? frame : O.STEPS) + 1);
            const d = pts.map((q, i) => (i ? "L" : "M") + sx(q[0]).toFixed(1) + " " + sy(q[1]).toFixed(1)).join(" ");
            const last = pts[pts.length - 1];
            return (
              <g key={pi}>
                <path d={d} fill="none" stroke={p.color} strokeWidth={p.faded ? 1.5 : 2.5} opacity={p.faded ? 0.35 : 1} strokeDasharray={p.faded ? "3 3" : "none"} />
                {last && <circle cx={sx(last[0])} cy={sy(last[1])} r={p.faded ? 3 : 5} fill={p.color} opacity={p.faded ? 0.5 : 1} />}
              </g>
            );
          })}
          <circle cx={sx(O.START[0])} cy={sy(O.START[1])} r="4" fill="var(--ink)" />
          <text x={sx(O.START[0]) + 7} y={sy(O.START[1]) - 6} className="opt-axl">start</text>
        </svg>
        {paths.length > 1 && (
          <div className="opt-legend">
            {paths.filter((p) => !p.faded).map((p) => (<span key={p.label} className="opt-leg"><i style={{ background: p.color }} />{p.label}</span>))}
            {paths.some((p) => p.faded) && <span className="opt-leg"><i style={{ background: "#8294b5", opacity: .5 }} />SGD (reference)</span>}
          </div>
        )}
      </div>
    );
  }
  // helper: build a single optimizer's path (+ faded SGD reference)
  const one = (t, tp, ref) => {
    const arr = [{ path: t.sims[tp].path, color: COL[tp], label: NAME[tp] }];
    if (ref && tp !== "sgd") arr.unshift({ path: t.sims.sgd.path, color: "#8294b5", label: "SGD", faded: true });
    return arr;
  };

  // worked numeric first step for an optimizer (state vars start at 0)
  const v2 = (a) => "[" + a.map((x) => fmt(x)).join(", ") + "]";
  function worked(type, t) {
    const g = window.OPT.grad(window.OPT.START[0], window.OPT.START[1]); // first gradient
    const lr = (t.sims[type].lr);
    const rows = [];
    rows.push(<div className="nn-calc-row" key="g"><b>gradient</b> g = ∂Loss/∂θ at start {v2(window.OPT.START)} = <b>{v2(g)}</b></div>);
    const eps = 1e-8;
    if (type === "sgd") {
      const d = g.map((x) => -lr * x);
      rows.push(<div className="nn-calc-row" key="s">θ ← θ − η·g = {v2(window.OPT.START)} − {fmt(lr)}·{v2(g)}</div>);
      rows.push(<div className="nn-calc-row" key="e">step = <b>{v2(d)}</b> → moves opposite the gradient, same fixed scale in both axes (note the y-step is huge → zig-zag).</div>);
    } else if (type === "momentum" || type === "nesterov") {
      rows.push(<div className="nn-calc-row" key="v">velocity starts at 0, so v₁ = μ·0 + g = g = {v2(g)}</div>);
      rows.push(<div className="nn-calc-row" key="s">θ ← θ − η·v₁ = step {v2(g.map((x) => -lr * x))}</div>);
      rows.push(<div className="nn-calc-row" key="e">Step 1 equals SGD. On step 2, v₂ = μ·v₁ + g₂ <b>accumulates</b> — that build-up is what smooths the path and cancels the y-axis oscillation.</div>);
    } else if (type === "adagrad") {
      const G = g.map((x) => x * x), adj = g.map((x, i) => x / (Math.sqrt(G[i]) + eps));
      rows.push(<div className="nn-calc-row" key="G">cache G = g² = {v2(G)}</div>);
      rows.push(<div className="nn-calc-row" key="a">g / √G = {v2(adj)} ← each component normalized to ±1 (sign of g)</div>);
      rows.push(<div className="nn-calc-row" key="s">θ ← θ − η·g/√G = step <b>{v2(adj.map((x) => -lr * x))}</b> — both axes now take an <i>equal</i>-sized step, killing the zig-zag.</div>);
    } else if (type === "rmsprop") {
      const rho = 0.9, G = g.map((x) => (1 - rho) * x * x), adj = g.map((x, i) => x / (Math.sqrt(G[i]) + eps));
      rows.push(<div className="nn-calc-row" key="G">G = (1−ρ)·g² = 0.1·g² = {v2(G)} (a <i>moving average</i>, so it won't grow forever like AdaGrad)</div>);
      rows.push(<div className="nn-calc-row" key="a">g / √G = {v2(adj)}</div>);
      rows.push(<div className="nn-calc-row" key="s">θ ← θ − η·g/√G = step <b>{v2(adj.map((x) => -lr * x))}</b></div>);
    } else if (type === "adam" || type === "adamw") {
      const b1 = 0.9, b2 = 0.999;
      const m = g.map((x) => (1 - b1) * x), v = g.map((x) => (1 - b2) * x * x);
      const mh = m.map((x) => x / (1 - b1)), vh = v.map((x) => x / (1 - b2));
      const adj = mh.map((x, i) => x / (Math.sqrt(vh[i]) + eps));
      rows.push(<div className="nn-calc-row" key="m">m = (1−β₁)·g = 0.1·g = {v2(m)};&nbsp;&nbsp;v = (1−β₂)·g² = {v2(v)}</div>);
      rows.push(<div className="nn-calc-row" key="h">bias-correct: m̂ = m/(1−β₁) = {v2(mh)};&nbsp;&nbsp;v̂ = v/(1−β₂) = {v2(vh)}</div>);
      rows.push(<div className="nn-calc-row" key="a">m̂ / √v̂ = {v2(adj)} ← ≈ ±1 per axis</div>);
      rows.push(<div className="nn-calc-row" key="s">θ ← θ − η·m̂/√v̂ = step <b>{v2(adj.map((x) => -lr * x))}</b> {type === "adamw" ? "  then − η·λ·θ (decoupled decay)" : ""}</div>);
    }
    return (
      <>
        <div className="tf-subhead">Worked first step — with the real numbers</div>
        <div className="nn-calc">
          <div className="nn-calc-h">{NAME[type]} · step 1 (η = {fmt(lr)})</div>
          {rows}
        </div>
      </>
    );
  }

  function renderInput(input, setInput) {
    return (
      <label className="nn-slider"><span className="nn-slider-l">lr ×</span>
        <input type="range" min="0.3" max="2.5" step="0.1" value={input[0]} onChange={(e) => setInput([parseFloat(e.target.value)])} />
        <span className="nn-slider-v">{fmt(input[0])}</span></label>
    );
  }

  const proscons = (pros, cons) => (
    <div className="opt-pc">
      <div className="opt-pc-col is-pro"><div className="opt-pc-h">✓ Pros</div><ul>{pros.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
      <div className="opt-pc-col is-con"><div className="opt-pc-h">✗ Cons</div><ul>{cons.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
    </div>
  );

  const STAGES = [
    {
      id: "overview", group: "Overview", title: "What an optimizer does, at a glance", map: "Overview",
      why: "Backprop gives the gradient — the downhill direction. The optimizer decides HOW to step: how far, how to use past steps, and whether to adapt per-parameter. It's what actually trains the network.",
      render: (t) => (
        <>
          <Lead>
            Training a network means <b>minimising a loss</b>. Backprop hands us the <b>gradient</b>
            (which way is uphill); the <b>optimizer</b> turns that into an actual <b>update</b> to
            the weights. Picture a ball rolling down a hilly surface to the lowest point — different
            optimizers roll differently. Below, every method starts at the same point and descends
            this <b>ravine</b> (steep one way, shallow the other).
          </Lead>
          <Formula label="the update everyone shares"><V>θ</V> ← <V>θ</V> − (step built from the gradient <V>g</V> = ∂Loss/∂θ)</Formula>
          <OptViz animate paths={["sgd", "momentum", "rmsprop", "adam"].map((tp) => ({ path: t.sims[tp].path, color: COL[tp], label: NAME[tp] }))} />
          <div className="tf-subhead">The three ideas that separate optimizers</div>
          <div className="tf-legend">
            {[["Step size (learning rate)","how far to move along the gradient. Too big overshoots, too small crawls."],
              ["Momentum","accumulate past gradients to keep rolling through small bumps and dampen zig-zags."],
              ["Per-parameter adaptation","give each weight its own effective learning rate based on its gradient history (AdaGrad/RMSProp/Adam)."]].map((r) => (
              <div className="tf-leg" key={r[0]}><div className="tf-leg-name">{r[0]}</div><div className="tf-leg-desc">{r[1]}</div></div>
            ))}
          </div>
          <Note>Each of the next steps builds on the previous one — from plain SGD up to Adam/AdamW.
            Drag the <b>lr ×</b> slider in the top bar to scale every learning rate and watch the
            paths change. Press <b>Next →</b>.</Note>
        </>
      ),
    },
    {
      id: "sgd", group: "Basic", title: "1 · SGD (stochastic gradient descent)", map: "SGD",
      why: "The foundation. Step a fixed distance straight downhill, using a small random batch of data each time. Everything else is an improvement on this.",
      render: (t) => (
        <>
          <Lead>
            <b>SGD</b> is the simplest rule: move a fixed <b>learning rate</b> η straight down the
            gradient. "Stochastic" because the gradient is estimated from a small random
            <b> mini-batch</b> each step (cheap, and the noise can help escape shallow traps). On a
            ravine it <b>zig-zags</b>: it bounces across the steep direction while creeping along the
            shallow one.
          </Lead>
          <Formula label="SGD"><V>θ</V> ← <V>θ</V> − η·<V>g</V></Formula>
          <OptViz paths={one(t, "sgd")} />
          {worked("sgd", t)}
          {proscons(
            ["Dead simple, tiny memory, well understood", "Mini-batch noise can help generalisation", "Often the best final accuracy with good tuning + schedule"],
            ["Zig-zags badly in ravines (ill-conditioned losses)", "One global lr for all weights — hard to tune", "Slow; very sensitive to the learning rate"])}
          <Note>SGD with a learning-rate schedule is still a top choice for training CNNs to the best
            final accuracy — but it needs careful tuning.</Note>
        </>
      ),
    },
    {
      id: "momentum", group: "Basic", title: "2 · Momentum", map: "Momentum",
      why: "Add inertia. Instead of stepping by the current gradient alone, accumulate a running velocity — this powers through small bumps and cancels the side-to-side zig-zag.",
      render: (t) => (
        <>
          <Lead>
            <b>Momentum</b> gives the ball <b>inertia</b>. It keeps a running <b>velocity</b> v that
            accumulates past gradients (decayed by μ ≈ 0.9). Consistent directions build up speed;
            oscillating ones cancel out — so it shoots down the shallow axis and stops bouncing.
          </Lead>
          <Formula label="momentum"><V>v</V> ← μ·v + g,&nbsp;&nbsp;<V>θ</V> ← θ − η·v</Formula>
          <OptViz paths={one(t, "momentum", true)} />
          {worked("momentum", t)}
          {proscons(
            ["Much faster than SGD in ravines", "Damps oscillations, smoother path", "Still simple, one extra vector of memory"],
            ["One more hyperparameter (μ) to set", "Can overshoot the minimum and oscillate if μ too high", "Still a single global learning rate"])}
          <Note>μ = 0.9 is the near-universal default. Compare the smooth curve here to SGD's zig-zag
            (faded).</Note>
        </>
      ),
    },
    {
      id: "nesterov", group: "Basic", title: "3 · Nesterov momentum", map: "Nesterov",
      why: "A smarter momentum: peek ahead to where momentum is about to carry you, compute the gradient THERE, and correct early. This anticipation reduces overshoot.",
      render: (t) => (
        <>
          <Lead>
            <b>Nesterov</b> accelerated gradient is momentum with <b>foresight</b>. It first takes
            the momentum step (a "look-ahead"), measures the gradient at <i>that</i> future point,
            then corrects. By reacting to where it's <b>about to be</b>, it overshoots less and
            converges faster.
          </Lead>
          <Formula label="Nesterov"><V>g</V> = ∂Loss(θ − η·μ·v),&nbsp;&nbsp;<V>v</V> ← μv + g,&nbsp;&nbsp;θ ← θ − η·v</Formula>
          <OptViz paths={one(t, "nesterov", true)} />
          {worked("nesterov", t)}
          {proscons(
            ["Faster, more stable than plain momentum", "Less overshoot near the minimum", "Same memory cost as momentum"],
            ["Slightly more complex update", "Still global lr; gains are modest", "Tuning μ and η still matters"])}
          <Note>The look-ahead correction is why Nesterov often edges out classical momentum,
            especially late in training.</Note>
        </>
      ),
    },
    {
      id: "adagrad", group: "Adaptive", title: "4 · AdaGrad (per-parameter rates)", map: "AdaGrad",
      why: "The first 'adaptive' method: give each weight its own learning rate by dividing by the running sum of its squared gradients. Rarely-updated weights step bigger; busy ones step smaller.",
      render: (t) => (
        <>
          <Lead>
            <b>AdaGrad</b> gives <b>every parameter its own learning rate</b>. It accumulates each
            weight's squared gradients in a cache G and divides the step by √G. Weights with big,
            frequent gradients get <b>smaller</b> steps; rare ones get <b>larger</b> steps — great
            for sparse features.
          </Lead>
          <Formula label="AdaGrad"><V>G</V> ← G + g²,&nbsp;&nbsp;<V>θ</V> ← θ − η·g / (√G + ε)</Formula>
          <OptViz paths={one(t, "adagrad", true)} />
          {worked("adagrad", t)}
          {proscons(
            ["No manual per-feature tuning — adapts automatically", "Excellent for sparse data / NLP features", "Tames the steep direction of a ravine"],
            ["G only grows → the learning rate decays to ~0", "Training can stall before reaching the minimum", "That monotonic decay is its fatal flaw → RMSProp fixes it"])}
          <Note>Notice the step shrinks over time. That ever-growing denominator is exactly the
            problem RMSProp solves next.</Note>
        </>
      ),
    },
    {
      id: "rmsprop", group: "Adaptive", title: "5 · RMSProp", map: "RMSProp",
      why: "Fix AdaGrad's decay: instead of summing all past squared gradients forever, use a moving average that forgets old ones. The per-parameter rate adapts without dying.",
      render: (t) => (
        <>
          <Lead>
            <b>RMSProp</b> keeps AdaGrad's per-parameter idea but uses a <b>decaying moving
            average</b> of squared gradients instead of an ever-growing sum. Old gradients are
            forgotten (decay ρ ≈ 0.9), so the effective learning rate <b>stays alive</b> and adapts
            to the recent landscape.
          </Lead>
          <Formula label="RMSProp"><V>G</V> ← ρ·G + (1−ρ)·g²,&nbsp;&nbsp;<V>θ</V> ← θ − η·g / (√G + ε)</Formula>
          <OptViz paths={one(t, "rmsprop", true)} />
          {worked("rmsprop", t)}
          {proscons(
            ["Per-parameter adaptation that doesn't decay to zero", "Handles non-stationary / noisy objectives well", "Strong default for RNNs and reinforcement learning"],
            ["Adds the decay rate ρ as a hyperparameter", "No momentum on its own (Adam adds it)", "Can still be a little jittery near the minimum"])}
          <Note>RMSProp = AdaGrad with a memory that forgets. Add momentum to it and you get Adam.</Note>
        </>
      ),
    },
    {
      id: "adam", group: "Advanced", title: "6 · Adam (momentum + RMSProp)", map: "Adam",
      why: "The workhorse. Adam combines momentum (a moving average of gradients) with RMSProp (a moving average of squared gradients), plus a bias correction. Fast, robust, and the default for most deep learning.",
      render: (t) => (
        <>
          <Lead>
            <b>Adam</b> ("adaptive moment estimation") merges the two big ideas: a moving average of
            the <b>gradient</b> (momentum, m) <i>and</i> of the <b>squared gradient</b> (RMSProp, v).
            A bias correction fixes the cold-start (m, v begin at 0). The result is fast, stable, and
            works out-of-the-box on almost anything.
          </Lead>
          <Formula label="moments"><V>m</V> ← β₁m + (1−β₁)g,&nbsp;&nbsp;<V>v</V> ← β₂v + (1−β₂)g²</Formula>
          <Formula label="bias-corrected step">m̂ = m/(1−β₁ᵗ),&nbsp; v̂ = v/(1−β₂ᵗ),&nbsp;&nbsp;<V>θ</V> ← θ − η·m̂/(√v̂ + ε)</Formula>
          <OptViz paths={one(t, "adam", true)} />
          {worked("adam", t)}
          {proscons(
            ["Fast, robust, little tuning — great default (η≈3e-4)", "Per-parameter rates + momentum together", "Bias correction handles the start cleanly; works on sparse & noisy losses"],
            ["More memory (two extra vectors per weight)", "Can generalise slightly worse than tuned SGD on vision", "The vanilla weight-decay coupling is subtly wrong → AdamW"])}
          <Note>β₁=0.9, β₂=0.999, ε=1e-8 are the standard defaults. Adam is the most-used optimizer in
            deep learning today.</Note>
        </>
      ),
    },
    {
      id: "adamw", group: "Advanced", title: "7 · AdamW (decoupled weight decay)", map: "AdamW",
      why: "A small but important fix to Adam. Standard L2 regularization interacts badly with Adam's adaptive scaling; AdamW applies weight decay separately, restoring proper regularization. It's the default for transformers.",
      render: (t) => (
        <>
          <Lead>
            <b>AdamW</b> fixes how Adam handles <b>weight decay</b>. In plain Adam, L2 regularization
            gets divided by the same adaptive √v̂ term, weakening it unpredictably. AdamW
            <b> decouples</b> the decay — applying it directly to the weights, separate from the
            gradient step — so regularization works as intended.
          </Lead>
          <Formula label="AdamW"><V>θ</V> ← θ − η·m̂/(√v̂ + ε) <b>− η·λ·θ</b>&nbsp;&nbsp;(decoupled decay)</Formula>
          <OptViz paths={one(t, "adamw", true)} />
          {worked("adamw", t)}
          {proscons(
            ["Correct, predictable weight decay → better generalisation", "The default for transformers / LLMs", "All of Adam's speed and robustness"],
            ["One more hyperparameter (decay λ)", "Same memory cost as Adam", "Marginal difference on problems that don't need regularization"])}
          <Note>If you train transformers, you almost certainly use AdamW. The path looks like Adam
            here because our toy loss has no overfitting to regularize — the difference shows up as
            generalisation on real data.</Note>
        </>
      ),
    },
    {
      id: "compare", group: "Choosing", title: "8 · Which optimizer should you use?", map: "When to use",
      why: "There's no universal best. The right choice depends on the model, data and how much tuning you can afford. Here's a practical decision guide.",
      render: (t) => (
        <>
          <Lead>
            All paths, overlaid — same start, same loss. Faster, straighter descent = better here,
            but real-world choice balances <b>speed, final accuracy, memory and tuning effort</b>.
          </Lead>
          <OptViz animate paths={["sgd", "momentum", "nesterov", "adagrad", "rmsprop", "adam", "adamw"].map((tp) => ({ path: t.sims[tp].path, color: COL[tp], label: NAME[tp] }))} />
          <div className="tf-subhead">A practical decision guide</div>
          <div className="tf-legend">
            {[["Default / prototyping → Adam","fast and forgiving; great when you just want it to train. η ≈ 3e-4."],
              ["Transformers / LLMs → AdamW","decoupled weight decay is the proven standard for large models."],
              ["CNNs / vision, chasing best accuracy → SGD + momentum","with a learning-rate schedule it often generalises better than Adam — if you can tune it."],
              ["RNNs / RL / non-stationary → RMSProp (or Adam)","handles noisy, shifting objectives well."],
              ["Sparse features / NLP counts → AdaGrad","per-feature adaptation shines, if training is short enough to avoid its decay."],
              ["Limited memory → SGD / momentum","adaptive methods store 1–2 extra vectors per weight."]].map((r) => (
              <div className="tf-leg" key={r[0]}><div className="tf-leg-name">{r[0]}</div><div className="tf-leg-desc">{r[1]}</div></div>
            ))}
          </div>
          <div className="tf-lifecycle">
            <div className="tf-life tf-life--train">
              <div className="tf-life-h"><span>▸</span> Rule of thumb</div>
              <p>Start with <b>Adam/AdamW</b>. If you need the last bit of accuracy on vision and can
                tune, switch to <b>SGD + momentum + a schedule</b>.</p>
            </div>
            <div className="tf-life tf-life--infer">
              <div className="tf-life-h"><span>+</span> Beyond the basics</div>
              <p>Learning-rate <b>schedules</b> (warmup, cosine decay) and tricks like
                <b> gradient clipping</b> often matter more than the optimizer choice itself.</p>
            </div>
          </div>
          <Note icon="!">No optimizer is universally best (the "no free lunch" rule). The loss
            surface here is a clean toy; real landscapes are millions of dimensions — but the
            intuitions (momentum smooths, adaptation rescales) carry straight over.</Note>
        </>
      ),
    },
  ];

  window.NN_STAGES = STAGES;
  window.NN_META = {
    title: "Optimizers", subtitle: "how networks actually descend the loss — from SGD to AdamW",
    cur: "Optimizers", run: window.OPT.runAll, default: [1], renderInput,
  };
})();
