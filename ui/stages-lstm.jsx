/* LSTM stages */
(function () {
  const { Matrix, V, Sub, Sup, Formula, DotTip, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const C = window.NN.LSTM;
  const hcols = ["c0", "c1", "c2"];

  const PRESETS = {
    "Rising": C.default,
    "Falling": [[0.7, 0.1], [-0.4, 0.6], [0.8, -0.3], [0.5, 0.2]],
    "Flat": [[0.3, 0.3], [0.3, 0.3], [0.3, 0.3], [0.3, 0.3]],
  };
  function renderInput(input, setInput) {
    return (
      <div className="nn-presets">
        {Object.keys(PRESETS).map((k) => (
          <button key={k} className="tf-headbtn" onClick={() => setInput(PRESETS[k].map((r) => r.slice()))}>{k}</button>
        ))}
      </div>
    );
  }

  const gateTip = (g, name, actName) => (i, j, v) => (
    <div>
      <div className="tf-tip-title">{name}[{j}] = {actName}( x·Wx + h·Wh + b )</div>
      <div className="tf-tip-sum">x·Wx = {fmt(g.xw[j])} · h·Wh = {fmt(g.hw[j])} · b = {fmt(g.pre[j] - g.xw[j] - g.hw[j])}</div>
      <div className="tf-tip-sum">{actName}({fmt(g.pre[j])})</div>
      <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div>
    </div>
  );

  const STAGES = [
    {
      id: "overview", group: "Overview", title: "What an LSTM is, at a glance", map: "Overview",
      why: "An LSTM is an RNN with a memory upgrade: a protected cell state plus three gates that learn what to forget, what to store, and what to output — so it remembers over long ranges.",
      render: (t) => {
        const sym = (s) => <span className="tf-sym">{s}</span>;
        return (
          <>
            <Lead>
              A <b>Long Short-Term Memory</b> network fixes the plain RNN's forgetting problem. It
              keeps a separate <b>cell state</b> <V>c</V> — a memory "conveyor belt" that runs
              straight through with only small edits — controlled by three learned <b>gates</b>:
              <span className="nn-gate f">forget</span>
              <span className="nn-gate i">input</span>
              <span className="nn-gate o">output</span>.
              Each gate outputs values 0…1 that decide how much information passes.
            </Lead>
            <div className="tf-archwrap">
              <div className="tf-arch">
                <div className="tf-arch-io">x₁ → x₂ → x₃ → x₄<span>input sequence</span></div>
                <div className="tf-arch-f"><b>forget gate</b> — drop old memory</div>
                <div className="tf-arch-f"><b>input gate + candidate</b> — add new memory</div>
                <div className="tf-arch-row">{sym("c_t")} = f·c_t₋₁ + i·g   (updated cell state)</div>
                <div className="tf-arch-f"><b>output gate</b> — what to reveal</div>
                <div className="tf-arch-io tf-arch-io--out">{sym("h_t")} = o · tanh(c_t)<span>hidden output → prediction</span></div>
              </div>
            </div>
            <div className="tf-subhead">Symbol key</div>
            <div className="tf-legend">
              {[["c_t","cell state","1×3","long-term memory — the protected conveyor belt"],
                ["h_t","hidden state","1×3","short-term output, revealed from the cell"],
                ["f","forget gate","1×3","sigmoid — keep (1) or drop (0) each memory"],
                ["i","input gate","1×3","sigmoid — how much new info to write"],
                ["g","candidate","1×3","tanh — the new info proposed"],
                ["o","output gate","1×3","sigmoid — how much cell to expose as h"]].map((r) => (
                <div className="tf-leg" key={r[0]}>
                  <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div><div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>
            <Note>Each gate has its own learned Wx, Wh, b (four weight sets total). Press
              <b> Next →</b> to walk one timestep gate by gate.</Note>
            <div className="tf-subhead">Inside one LSTM cell</div>
            <window.CellInternal type="lstm" trace={t} />
          </>
        );
      },
    },
    {
      id: "cell", group: "The cell", title: "1 · The cell state (memory belt)", map: "Cell state",
      why: "The cell state is the key idea: a memory line that flows through every step almost unchanged, so gradients and information survive over long sequences.",
      render: (t) => (
        <>
          <Lead>
            The <b>cell state</b> <V>c</V> is a 3-number vector that runs straight through the
            sequence like a <b>conveyor belt</b>. The gates make only small, controlled edits to it
            — add a bit, erase a bit — so memory can persist for many steps without being
            overwritten (the RNN's flaw). It starts empty.
          </Lead>
          <Formula label="start"><V>c₀</V> = [0,0,0] · <V>h₀</V> = [0,0,0]</Formula>
          <Row>
            <Matrix data={[[0, 0, 0]]} rowLabels={["c₀"]} colLabels={hcols} caption="c₀" sub="empty memory" />
            <Arrow label="edited each step" />
            <Matrix data={t.steps.map((s) => s.c)} rowLabels={C.stepNames} colLabels={hcols} caption="c₁…c₄" sub="cell state per step" accent />
          </Row>
          <Note>Compare to the RNN, which had no protected memory — each step overwrote everything.</Note>
        </>
      ),
    },
    {
      id: "forget", group: "Gates (step t1)", title: "2 · Forget gate", map: "Forget",
      why: "First the LSTM decides what to throw away from memory. A sigmoid outputs 0 (erase) to 1 (keep) for each value in the cell state.",
      render: (t) => {
        const s = t.steps[0];
        return (
          <>
            <Lead>
              The <span className="nn-gate f">forget</span> gate looks at the input and previous
              hidden state and outputs a number <b>0…1 per memory slot</b>: 0 = "erase this", 1 =
              "keep it". It's a <b>sigmoid</b> of a familiar weighted sum.
            </Lead>
            <Formula label="forget gate"><V>f</V> = σ( <V>x·Wx_f</V> + <V>h·Wh_f</V> + <V>b_f</V> )</Formula>
            <Row>
              <Matrix data={[s.x]} rowLabels={["x₁"]} colLabels={["a", "b"]} caption="x₁" sub="input" />
              <Arrow label="gate" />
              <Matrix data={[s.f.out]} rowLabels={["f"]} colLabels={hcols} caption="f" sub="forget (0…1)" accent cellTip={gateTip(s.f, "f", "σ")} />
            </Row>
            <Note>Its bias starts at +1 so a fresh LSTM <b>remembers by default</b> and learns when to
              forget. Values near 1 here mean "keep almost all of the old memory".</Note>
          </>
        );
      },
    },
    {
      id: "input", group: "Gates (step t1)", title: "3 · Input gate + candidate", map: "Input gate",
      why: "Next the LSTM decides what new information to write. The candidate proposes new memory; the input gate decides how much of it to actually store.",
      render: (t) => {
        const s = t.steps[0];
        return (
          <>
            <Lead>
              Two parts work together: the <span className="nn-gate g">candidate</span> <V>g</V>
              (a <b>tanh</b>) proposes new memory content, and the <span className="nn-gate i">input</span>
              gate <V>i</V> (a <b>sigmoid</b>) decides <b>how much</b> of it to write. Their product
              <V> i·g</V> is the new information added to the cell.
            </Lead>
            <Formula label="write"><V>i</V> = σ(…) · <V>g</V> = tanh(…) → add <V>i·g</V></Formula>
            <Row>
              <Matrix data={[s.i.out]} rowLabels={["i"]} colLabels={hcols} caption="i" sub="input gate (0…1)" accent cellTip={gateTip(s.i, "i", "σ")} />
              <Arrow label="×" />
              <Matrix data={[s.g.out]} rowLabels={["g"]} colLabels={hcols} caption="g" sub="candidate (−1…1)" accent cellTip={gateTip(s.g, "g", "tanh")} />
              <Arrow label="=" />
              <Matrix data={[s.i.out.map((v, k) => v * s.g.out[k])]} rowLabels={["i·g"]} colLabels={hcols} caption="i·g" sub="new info to add"
                cellTip={(a, j, v) => (<div><div className="tf-tip-title">i·g [{j}]</div><div className="tf-tip-sum">{fmt(s.i.out[j])} × {fmt(s.g.out[j])}</div><div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>)} />
            </Row>
            <Note>The gate (how much) and the candidate (what) are separated so the network can
              learn them independently.</Note>
          </>
        );
      },
    },
    {
      id: "update", group: "Gates (step t1)", title: "4 · Update the cell state", map: "Cell update",
      why: "Now the actual memory edit happens: forget some of the old cell, add the gated new info. This simple sum is what lets memory flow far.",
      render: (t) => {
        const s = t.steps[0];
        const ig = s.i.out.map((v, k) => v * s.g.out[k]);
        const fc = s.f.out.map((v, k) => v * s.cPrev[k]);
        return (
          <>
            <Lead>
              The new <b>cell state</b> combines both decisions: keep the old memory scaled by the
              forget gate, then add the gated new info. Because this is mostly <b>addition</b> (not
              repeated multiplication), memory and gradients survive far longer than in an RNN.
            </Lead>
            <Formula label="cell update"><V>c_t</V> = <V>f · c_t₋₁</V> + <V>i · g</V></Formula>
            <Row>
              <Matrix data={[fc]} rowLabels={["f·c₀"]} colLabels={hcols} caption="f·c₀" sub="kept old memory" />
              <Arrow label="+" />
              <Matrix data={[ig]} rowLabels={["i·g"]} colLabels={hcols} caption="i·g" sub="new info" />
              <Arrow label="=" />
              <Matrix data={[s.c]} rowLabels={["c₁"]} colLabels={hcols} caption="c₁" sub="updated cell" accent
                cellTip={(a, j, v) => (<div><div className="tf-tip-title">c₁[{j}] = f·c₀ + i·g</div><div className="tf-tip-sum">{fmt(fc[j])} + {fmt(ig[j])}</div><div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>)} />
            </Row>
            <Note>Since c₀ is empty here, c₁ = i·g. On later steps the forget term carries memory
              forward.</Note>
          </>
        );
      },
    },
    {
      id: "out", group: "Gates (step t1)", title: "5 · Output gate → hidden state", map: "Output gate",
      why: "Finally the LSTM decides what to reveal. The hidden state (used for predictions and passed on) is a filtered view of the cell state.",
      render: (t) => {
        const s = t.steps[0];
        const tc = s.c.map((v) => Math.tanh(v));
        return (
          <>
            <Lead>
              The <span className="nn-gate o">output</span> gate <V>o</V> (sigmoid) decides how much
              of the cell state to expose. The <b>hidden state</b> <V>h</V> = o · tanh(c) is what
              gets passed to the next step and used for the prediction.
            </Lead>
            <Formula label="hidden output"><V>h_t</V> = <V>o</V> · tanh(<V>c_t</V>)</Formula>
            <Row>
              <Matrix data={[s.o.out]} rowLabels={["o"]} colLabels={hcols} caption="o" sub="output gate (0…1)" accent cellTip={gateTip(s.o, "o", "σ")} />
              <Arrow label="× tanh(c)" />
              <Matrix data={[tc]} rowLabels={["tanh c₁"]} colLabels={hcols} caption="tanh(c₁)" sub="squashed cell" />
              <Arrow label="=" />
              <Matrix data={[s.h]} rowLabels={["h₁"]} colLabels={hcols} caption="h₁" sub="hidden output" accent
                cellTip={(a, j, v) => (<div><div className="tf-tip-title">h₁[{j}] = o · tanh(c₁)</div><div className="tf-tip-sum">{fmt(s.o.out[j])} × {fmt(tc[j])}</div><div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>)} />
            </Row>
            <Note>So the cell is the <b>long-term</b> memory; the hidden state is the <b>short-term</b>,
              filtered output. That split is the "long short-term memory".</Note>
          </>
        );
      },
    },
    {
      id: "unroll", group: "Forward pass", title: "6 · Unroll & predict", map: "Unroll",
      why: "Repeat all four gates at every step, carry the cell and hidden states forward, then read the final hidden state for the answer.",
      render: (t) => {
        const max = Math.max(...t.p);
        return (
          <>
            <Lead>
              Running the gate machinery for all 4 steps carries both the <b>cell</b> and
              <b> hidden</b> states forward. The final hidden state h₄ feeds the output layer and
              softmax — same as the RNN.
            </Lead>
            <window.SeqUnroll type="lstm" trace={t} />
            <div className="tf-subhead">Cell state across time (the persistent memory)</div>
            <Row>
              <Matrix data={t.steps.map((s) => s.c)} rowLabels={C.stepNames} colLabels={hcols} caption="c₁…c₄" sub="cell state" accent />
              <Matrix data={t.steps.map((s) => s.h)} rowLabels={C.stepNames} colLabels={["h0", "h1", "h2"]} caption="h₁…h₄" sub="hidden state" />
            </Row>
            <div className="tf-subhead">Prediction from h₄</div>
            <Row>
              <Matrix data={[t.hFinal]} rowLabels={["h₄"]} colLabels={["h0", "h1", "h2"]} caption="h₄" sub="final" />
              <Arrow label="×Why, softmax" />
              <Matrix data={[t.p]} rowLabels={["P"]} colLabels={C.labels} caption="P" sub="probabilities" accent />
            </Row>
            <div className="tf-probs">
              {C.labels.map((l, i) => (
                <div className={"tf-prob" + (i === t.pred ? " is-top" : "")} key={l}>
                  <span className="tf-prob-word">{l}</span>
                  <div className="tf-prob-track"><div className="tf-prob-fill" style={{ width: (t.p[i] / max * 100) + "%" }} /></div>
                  <span className="tf-prob-val">{(t.p[i] * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div className="tf-predict-out"><span>prediction</span><b className="tf-predict-next">{C.labels[t.pred]}</b></div>
            <Note icon="!">Because the cell state is edited gently (mostly addition), an LSTM keeps
              information from early steps far better than a plain RNN — that's why it powered
              translation, speech and text generation before transformers. Toy weights are
              untrained; the mechanism is exact.</Note>
          </>
        );
      },
    },
    {
      id: "stack", group: "Going deeper", title: "7 · Stacking LSTM layers", map: "Deep LSTM",
      why: "Like RNNs, LSTMs are stacked into deep networks. Each layer's hidden-state sequence feeds the next, giving the model more capacity for complex sequences.",
      render: (t) => (
        <>
          <Lead>
            LSTMs are <b>stacked</b> just like RNNs: layer 1's <b>sequence of hidden states</b>
            becomes layer 2's input sequence. Each layer carries its own cell &amp; hidden state
            across time. Deep stacked LSTMs powered translation, speech and text generation before
            transformers.
          </Lead>
          <window.LayerStack type="lstm" />
          <Note>Two flows again: <b>across time</b> (the cell-state highway within a layer) and
            <b> up the stack</b> (between layers). Bidirectional LSTMs add a second pass in reverse.
            The final layer's last hidden state drives the prediction.</Note>
        </>
      ),
    },
  {
      id: "hyperparams",
      group: "Practical",
      title: "Hyperparameters & when to use",
      map: "Hyperparams",
      why: "LSTM's hidden_size and number of layers are the most important architectural choices. Learning rate and gradient clipping are critical training hyperparameters.",
      render: () => (
        <>
          <Lead>LSTM's power comes from its gating mechanism that selectively remembers and forgets information over long sequences. The key tuning challenge: LSTMs are sensitive to learning rate and prone to exploding gradients. Two practical rules: (1) always clip gradients (max_norm=1.0), (2) use Adam or RMSprop, not plain SGD.</Lead>
          <Note>LSTM hyperparameters interact with sequence length: longer sequences require larger hidden_size to store relevant context. But larger hidden_size means more parameters, which requires more training data. The sweet spot for most NLP tasks: hidden_size=128–512, num_layers=2–3.</Note>
          <div className="tf-subhead">Key hyperparameters</div>
          <div className="tf-legend">
            {[
              ["hidden_size", "Hidden state dimensions", "Default 128. Controls how much information the LSTM can remember. Range: 64–512. Larger = more capacity but more data needed. Double hidden_size before adding more layers."],
              ["num_layers", "Stacked LSTM depth", "Default 1. 2–3 layers for most tasks. More layers add depth of representation. Use dropout between layers (dropout=0.2–0.4) to regularize stacked LSTMs."],
              ["dropout", "Dropout between layers", "Default 0. Applied between LSTM layers (not inside the cell). Set 0.2–0.4 for 2+ layer LSTMs. For single-layer LSTMs, dropout doesn't apply inside."],
              ["bidirectional", "Process sequence both directions", "False by default. Set True for classification/understanding tasks (reads sequence forward AND backward). Cannot use bidirectional for autoregressive generation (can't look at future tokens)."],
              ["learning_rate", "Learning rate", "1e-3 (Adam). LSTMs are sensitive to LR. If gradients explode, reduce LR. Use gradient clipping (max_norm=1.0) always."],
              ["gradient_clip", "Gradient clipping threshold", "max_norm=1.0 (industry standard). LSTMs suffer from exploding gradients on long sequences. Clipping prevents weight updates from becoming catastrophically large. Always use for sequences > 50 steps."],
              ["sequence_length", "Input sequence length (context window)", "For training: use the natural length (sentence, day, week). For RNNs: truncate at 200–500 tokens. Longer sequences → vanishing gradient problem increases even with LSTM (that's why Transformers replaced LSTMs for long sequences)."],
              ["batch_size", "Mini-batch size", "32–64. Smaller batches provide better gradient estimates for sequential data. Batch sizes that are too large can destabilize RNN training."],
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
              {["Handles variable-length sequences", "Long-range memory via cell state (vs plain RNN)", "Bidirectional variant captures full context", "Works for time-series, text, audio, speech"].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
              {["Slow (sequential processing, not parallelizable)", "Vanishing gradient on very long sequences (1000+ tokens)", "Replaced by Transformers for NLP tasks", "Hard to parallelize across time steps (vs CNN 1D or Transformer)", "Sensitive to initialization and LR"].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✗ {t}</div>)}
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
                  ["Short to medium sequences (< 200 tokens), NLP tasks", "LSTM (bidirectional)", "Efficient, works well, widely understood"],
                  ["Long sequences (> 500 tokens), complex language tasks", "Transformer (BERT/GPT)", "Attention mechanism avoids vanishing gradient; better parallelism"],
                  ["Time-series forecasting (univariate)", "LSTM or N-BEATS (neural basis expansion)", "LSTM captures temporal dependencies"],
                  ["Time-series with many features + non-stationarity", "Temporal Fusion Transformer", "Attention-based time-series model with interpretability"],
                  ["Real-time low-latency prediction", "1D CNN or linear model", "LSTM inference is sequential — slower than CNN or attention at inference"],
                  ["Very small dataset", "Traditional statistical models (ARIMA, Prophet)", "LSTM needs 10K+ timesteps to learn generalizable patterns"],
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

  window.NN_STAGES = STAGES;
  window.NN_META = {
    title: "LSTM Network", subtitle: "how gates give a network long-term memory",
    cur: "LSTM", run: window.NN.runLSTM, default: window.NN.LSTM.default, renderInput,
  };
})();
