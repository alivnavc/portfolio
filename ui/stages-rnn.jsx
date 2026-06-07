/* RNN stages */
(function () {
  const { Matrix, V, Sub, Sup, Formula, DotTip, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const C = window.NN.RNN;
  const cols = (n, p) => Array.from({ length: n }, (_, i) => (p || "") + i);
  const hcols = ["h0", "h1", "h2"];

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

  const recTip = (st) => (i, j, v) => (
    <div>
      <div className="tf-tip-title">h{j} at {C.stepNames[st.t]} = tanh( x·Wxh + hPrev·Whh + b )</div>
      <div className="tf-tip-sum">x·Wxh = {fmt(st.xWxh[j])} · hPrev·Whh = {fmt(st.hWhh[j])} · b = {fmt(C.bh[j])}</div>
      <div className="tf-tip-sum">tanh({fmt(st.pre[j])})</div>
      <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div>
    </div>
  );

  const STAGES = [
    {
      id: "overview", group: "Overview", title: "What an RNN is, at a glance", map: "Overview",
      why: "Sequences (text, audio, time-series) have order and memory. An RNN reads one element at a time and carries a hidden 'memory' forward, so earlier inputs influence later ones.",
      render: (t) => {
        const sym = (s) => <span className="tf-sym">{s}</span>;
        return (
          <>
            <Lead>
              A <b>recurrent neural network</b> processes a <b>sequence</b> one step at a time. At
              each step it combines the <b>current input</b> with its <b>hidden state</b> (a memory
              of everything seen so far) to produce a new hidden state. The <i>same</i> weights are
              reused at every step — that loop is what "recurrent" means.
            </Lead>
            <div className="tf-archwrap">
              <div className="tf-arch">
                <div className="tf-arch-io">x₁ → x₂ → x₃ → x₄<span>input sequence (4 steps)</span></div>
                <div className="tf-arch-f"><b>h_t = tanh(x_t·Wxh + h_t₋₁·Whh + b)</b></div>
                <div className="tf-arch-row">{sym("h₁")} → {sym("h₂")} → {sym("h₃")} → {sym("h₄")} hidden states carry memory →</div>
                <div className="tf-arch-f"><b>read final state</b></div>
                <div className="tf-arch-io tf-arch-io--out">up / down<span>prediction from h₄</span></div>
              </div>
            </div>
            <div className="tf-subhead">Symbol key</div>
            <div className="tf-legend">
              {[["x_t","input at step t","1×2","one element of the sequence"],
                ["h_t","hidden state","1×3","memory after step t"],
                ["Wxh","input→hidden","2×3","learned"],
                ["Whh","hidden→hidden","3×3","learned — carries memory forward"],
                ["Why,by","output weights","3×2","learned — final state to class scores"],
                ["P","probabilities","1×2","softmax"]].map((r) => (
                <div className={"tf-leg" + (/W/.test(r[0]) ? " is-learned" : "")} key={r[0]}>
                  <div className="tf-leg-top"><span className={"tf-sym" + (/W/.test(r[0]) ? " is-learned" : "")}>{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div><div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>
            <Note>Try the <b>Rising / Falling / Flat</b> presets in the top bar. Press <b>Next →</b>.</Note>
          </>
        );
      },
    },
    {
      id: "seq", group: "Forward pass", title: "1 · The input sequence", map: "Sequence",
      why: "Unlike a dense net that sees one fixed input, an RNN sees an ordered list. Order matters — the same elements in a different order can mean something different.",
      render: (t) => (
        <>
          <Lead>
            The input is a <b>sequence of 4 steps</b>, each a small 2-number vector (think: a
            reading at each moment in time). The RNN will read them <b>left to right</b>, one at a
            time.
          </Lead>
          <Row>
            <Matrix data={t.seq} rowLabels={C.stepNames} colLabels={["a", "b"]} caption="sequence" sub="4 steps × 2 features" accent />
          </Row>
          <Note>Real sequences: words in a sentence, audio samples, daily stock prices. Length can
            vary — the same RNN handles any number of steps because it loops.</Note>
        </>
      ),
    },
    {
      id: "hidden", group: "Forward pass", title: "2 · The hidden state (memory)", map: "Hidden state",
      why: "The hidden state is the RNN's working memory — a vector that summarises everything seen so far and gets updated at every step.",
      render: (t) => (
        <>
          <Lead>
            The <b>hidden state</b> <V>h</V> is a 3-number vector that acts as <b>memory</b>. It
            starts at all zeros (the network has seen nothing yet), and after each input it's
            <b> overwritten</b> with a new summary. The final hidden state is a compressed memory of
            the whole sequence.
          </Lead>
          <Formula label="start"><V>h₀</V> = [0, 0, 0]  (empty memory)</Formula>
          <Row>
            <Matrix data={[[0, 0, 0]]} rowLabels={["h₀"]} colLabels={hcols} caption="h₀" sub="initial memory" />
            <Arrow label="updates each step" />
            <Matrix data={t.steps.map((s) => s.h)} rowLabels={C.stepNames} colLabels={hcols} caption="h₁…h₄" sub="memory after each step" accent />
          </Row>
          <Note>Notice each row depends on the row above it — that chaining is the recurrence we
            unpack next.</Note>
        </>
      ),
    },
    {
      id: "recur", group: "Forward pass", title: "3 · The recurrence (one step)", map: "Recurrence",
      why: "This single formula, applied repeatedly, IS the RNN. It blends the new input with the previous memory and squashes the result with tanh.",
      render: (t) => {
        const s = t.steps[0];
        return (
          <>
            <Lead>
              At step <b>t1</b> the network computes its new memory from two ingredients: the
              <b> input</b> x₁ (through Wxh) and the <b>previous memory</b> h₀ (through Whh), plus a
              bias, all squashed by <b>tanh</b> into −1…1. Since h₀ is zero here, only the input
              contributes at the first step.
            </Lead>
            <Formula label="recurrence"><V>h_t</V> = tanh( <V>x_t·Wxh</V> + <V>h_t₋₁·Whh</V> + <V>b</V> )</Formula>
            <window.CellInternal type="rnn" trace={t} />
            <Row>
              <Matrix data={[s.x]} rowLabels={["x₁"]} colLabels={["a", "b"]} caption="x₁" sub="input" />
              <Arrow label="×Wxh" />
              <Matrix data={[s.xWxh]} rowLabels={["x·Wxh"]} colLabels={hcols} caption="x·Wxh" sub="input part"
                cellTip={(i, j, v) => (<DotTip title={`x₁·Wxh [h${j}]`} terms={s.x.map((a, k) => ({ a, b: C.Wxh[k][j] }))} result={v} />)} />
              <Arrow label="+h₀·Whh+b" />
              <Matrix data={[s.h]} rowLabels={["h₁"]} colLabels={hcols} caption="h₁" sub="new memory (tanh)" accent cellTip={recTip(s)} />
            </Row>
            <Note>The <b>same</b> Wxh, Whh and b are reused at every step — the RNN has one small set
              of weights no matter how long the sequence.</Note>
          </>
        );
      },
    },
    {
      id: "unroll", group: "Forward pass", title: "4 · Unrolling through time", map: "Unroll",
      why: "Drawing the loop out step-by-step makes the data flow clear: each hidden state feeds into the next, so information from step 1 can reach step 4.",
      render: (t) => (
        <>
          <Lead>
            Repeating the recurrence for all 4 steps "unrolls" the loop. Each hidden state feeds
            into the next, so <b>memory propagates forward</b>. Hover any hidden cell to see its
            full computation.
          </Lead>
          <window.SeqUnroll type="rnn" trace={t} />
          <div className="nn-unroll">
            <Matrix data={[[0,0,0]]} rowLabels={["h₀"]} colLabels={hcols} caption="h₀" sub="start" compact />
            {t.steps.map((s, i) => (
              <React.Fragment key={i}>
                <Arrow label={C.stepNames[i]} />
                <Matrix data={[s.h]} rowLabels={["h" + (i + 1)]} colLabels={hcols} caption={"h" + (i + 1)} sub={"x=" + s.x.map((x) => fmt(x)).join(",")} compact accent={i === t.steps.length - 1}
                  cellTip={recTip(s)} />
              </React.Fragment>
            ))}
          </div>
          <Note>The final state <b>h₄</b> has been influenced by every input — it's the network's
            summary of the entire sequence, and what the output reads from.</Note>
        </>
      ),
    },
    {
      id: "stack", group: "Going deeper", title: "5 · Stacking RNN layers", map: "Deep RNN",
      why: "A single recurrent layer has limited capacity. Stacking layers lets the network build richer representations of the sequence — the same depth idea as a deep CNN or MLP.",
      render: (t) => (
        <>
          <Lead>
            Real RNNs are usually <b>stacked</b>: the <b>sequence of hidden states</b> from layer 1
            becomes the <b>input sequence</b> to layer 2, and so on. Each layer still runs across
            time with its own weights; deeper layers capture more abstract sequence patterns.
          </Lead>
          <window.LayerStack type="rnn" />
          <Note>Information flows two ways: <b>across time</b> (within a layer) and <b>up the
            stack</b> (between layers). The final layer's last hidden state feeds the output. Modern
            sequence models often add <b>bidirectional</b> passes (left-to-right + right-to-left) too.</Note>
        </>
      ),
    },
    {
      id: "output", group: "Output", title: "6 · Output from final state", map: "Predict",
      why: "For a whole-sequence decision (like classification), we read only the last hidden state — it already contains the accumulated memory.",
      render: (t) => {
        const max = Math.max(...t.p);
        return (
          <>
            <Lead>
              To classify the whole sequence we take the <b>final hidden state h₄</b>, pass it
              through output weights <V>Why</V> and <b>softmax</b>. (For tasks that need an output at
              <i> every</i> step, like translation, you'd read every hₜ instead.)
            </Lead>
            <Formula label="output">P = softmax( <V>h₄ · Why</V> + <V>by</V> )</Formula>
            <Row>
              <Matrix data={[t.hFinal]} rowLabels={["h₄"]} colLabels={hcols} caption="h₄" sub="final memory" />
              <Arrow label="×Why" />
              <Matrix data={[t.z]} rowLabels={["z"]} colLabels={C.labels} caption="z" sub="logits" accent
                cellTip={(i, j, v) => (<DotTip title={`z[${C.labels[j]}]`} terms={[...t.hFinal.map((a, k) => ({ a, b: C.Why[k][j] })), { a: C.by[j], b: 1 }]} result={v} />)} />
              <Arrow label="softmax" />
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
          </>
        );
      },
    },
    {
      id: "vanish", group: "Limits", title: "7 · Why plain RNNs struggle", map: "Limits",
      why: "RNNs work, but overwriting the memory every step means distant information fades. Understanding this failure motivates the LSTM in the next explainer.",
      render: (t) => (
        <>
          <Lead>
            The recurrence <b>fully overwrites</b> the hidden state each step and multiplies by Whh
            repeatedly. Over long sequences this causes the <b>vanishing (or exploding) gradient</b>
            problem — signal from early steps shrinks toward zero, so the RNN <b>forgets</b> the
            distant past.
          </Lead>
          <div className="tf-lifecycle">
            <div className="tf-life tf-life--train">
              <div className="tf-life-h"><span>!</span> The problem</div>
              <p>Repeated multiplication by the same weights makes early-step gradients shrink
                exponentially — long-range dependencies are lost.</p>
            </div>
            <div className="tf-life tf-life--infer">
              <div className="tf-life-h"><span>→</span> The fix: LSTM</div>
              <p>LSTMs add a protected <b>cell state</b> and <b>gates</b> that decide what to keep,
                add, or forget — so memory persists over long ranges. That's the next explainer.</p>
            </div>
          </div>
          <Note icon="!">Toy weights are untrained, so the prediction is arbitrary — but the
            recurrence, memory and limits shown here are exactly how real RNNs behave.</Note>
        </>
      ),
    },
  ];

  window.NN_STAGES = STAGES;
  window.NN_META = {
    title: "Recurrent Network (RNN)", subtitle: "how a network remembers across a sequence",
    cur: "RNN", run: window.NN.runRNN, default: window.NN.RNN.default, renderInput,
  };
})();
