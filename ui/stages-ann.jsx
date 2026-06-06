/* ANN / MLP stages */
(function () {
  const { Matrix, V, Sub, Sup, Formula, DotTip, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const C = window.NN.ANN;
  const cols = (n, p) => Array.from({ length: n }, (_, i) => (p || "n") + i);

  // input sliders
  function renderInput(input, setInput) {
    return C.featNames.map((f, i) => (
      <label className="nn-slider" key={i}>
        <span className="nn-slider-l">{f}</span>
        <input type="range" min="-1" max="1" step="0.1" value={input[i]}
          onChange={(e) => { const n = input.slice(); n[i] = parseFloat(e.target.value); setInput(n); }} />
        <span className="nn-slider-v">{fmt(input[i])}</span>
      </label>
    ));
  }

  const zTip = (x, W, b, name) => (i, j, v) => (
    <DotTip title={name} terms={[...x.map((a, k) => ({ a, b: W[k][j] })), { a: b[j], b: 1 }]} result={v} />
  );
  const wTip = (name) => (i, j, v) => (
    <div>
      <div className="tf-tip-title">{name}[{i},{j}]</div>
      <div className="tf-tip-where"><div>A <b>learned</b> parameter — set by training, fixed at prediction time.</div></div>
      <div className="tf-tip-rule" /><div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div>
    </div>
  );

  // backward pass (softmax + cross-entropy), true label = cat (index 0)
  function backward(t, target) {
    const y = [0, 0]; y[target] = 1;
    const dz2 = t.p.map((pv, i) => pv - y[i]);
    const dW2 = C.W2.map((row, i) => row.map((_, j) => t.a1[i] * dz2[j]));
    const da1 = t.a1.map((_, i) => dz2[0] * C.W2[i][0] + dz2[1] * C.W2[i][1]);
    const dz1 = t.z1.map((zv, i) => da1[i] * (zv > 0 ? 1 : 0));
    const dW1 = t.x.map((xv, i) => C.W1[i].map((_, j) => xv * dz1[j]));
    const loss = -Math.log(Math.max(t.p[target], 1e-9));
    return { y, dz2, dW2, da1, dz1, dW1, loss, target };
  }

  const STAGES = [
    {
      id: "overview", group: "Overview", title: "What a neural network is, at a glance", map: "Overview",
      why: "Before the math: a neural network is just layers of simple 'neurons', each doing a weighted sum then a squash. Stack them and they can learn almost any input → output mapping.",
      render: (t) => {
        const sym = (s) => <span className="tf-sym">{s}</span>;
        return (
          <>
            <Lead>
              An <b>artificial neural network</b> (ANN / multi-layer perceptron) turns a list of
              input numbers into an output — here, deciding <b>cat vs dog</b> from 3 features. It
              does this with <b>layers of neurons</b>. Each neuron multiplies its inputs by
              <b> weights</b>, adds a <b>bias</b>, and passes the result through a non-linear
              <b> activation</b>. That's the whole idea — everything else is repetition.
            </Lead>
            <div className="tf-archwrap">
              <div className="tf-arch">
                <div className="tf-arch-io">3 features: ears, size, tail<span>input layer {sym("x")}</span></div>
                <div className="tf-arch-f"><b>×W₁ + b₁ → ReLU</b></div>
                <div className="tf-arch-row">{sym("a₁")} hidden layer · 4 neurons</div>
                <div className="tf-arch-f"><b>×W₂ + b₂</b></div>
                <div className="tf-arch-row">{sym("z₂")} output scores · 2 classes</div>
                <div className="tf-arch-f"><b>softmax</b></div>
                <div className="tf-arch-io tf-arch-io--out">P(cat), P(dog)<span>probabilities</span></div>
              </div>
            </div>
            <div className="tf-subhead">Symbol key</div>
            <div className="tf-legend">
              {[["x","input features","1×3","the 3 numbers describing the animal"],
                ["W₁,b₁","layer-1 weights & bias","3×4, 4","learned — connect inputs to hidden neurons"],
                ["a₁","hidden activations","1×4","ReLU(x·W₁+b₁) — the neurons' outputs"],
                ["W₂,b₂","layer-2 weights & bias","4×2, 2","learned — hidden to output"],
                ["z₂","logits","1×2","raw class scores"],
                ["P","probabilities","1×2","softmax(z₂) — sums to 1"]].map((r) => (
                <div className={"tf-leg" + (/W/.test(r[0]) ? " is-learned" : "")} key={r[0]}>
                  <div className="tf-leg-top"><span className={"tf-sym" + (/W/.test(r[0]) ? " is-learned" : "")}>{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div>
                  <div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>
            <Note>Drag the <b>ears / size / tail</b> sliders in the top bar — every number on every
              step recomputes live. Press <b>Next →</b> to walk the forward pass.</Note>
          </>
        );
      },
    },
    {
      id: "network", group: "Overview", title: "The full network (interactive)", map: "Network",
      why: "This is the whole model in one picture. Every line is a weight, every circle a neuron. Click a neuron to see exactly how its number is built, or hit play to watch data flow.",
      render: (t) => (
        <>
          <Lead>
            Here's the entire network as a graph: <b>3 input neurons</b> → <b>4 hidden neurons</b> →
            <b> 2 output neurons</b>. Each <b>line is a weight</b> (blue = positive, red = negative,
            thicker = stronger). Press <b>Play forward pass</b> to watch activations light up
            left-to-right, and <b>click any hidden or output neuron</b> to expand its full math.
          </Lead>
          <window.NNDiagram trace={t} mode="forward" />
          <div className="tf-subhead">The learned weight matrices (shown in full)</div>
          <Lead>
            These four tables <i>are</i> the model — every line in the graph above is one number
            here. <V>W₁</V> connects 3 inputs to 4 hidden neurons; <V>W₂</V> connects 4 hidden to 2
            outputs; <V>b₁</V>, <V>b₂</V> are the biases.
          </Lead>
          <Row>
            <Matrix data={C.W1} rowLabels={C.featNames} colLabels={cols(4, "h")} caption="W₁" sub="3×4 · learned" accent cellTip={wTip("W₁")} />
            <Matrix data={[C.b1]} rowLabels={["b₁"]} colLabels={cols(4, "h")} caption="b₁" sub="1×4" accent cellTip={wTip("b₁")} />
            <Matrix data={C.W2} rowLabels={cols(4, "h")} colLabels={C.labels} caption="W₂" sub="4×2 · learned" accent cellTip={wTip("W₂")} />
            <Matrix data={[C.b2]} rowLabels={["b₂"]} colLabels={C.labels} caption="b₂" sub="1×2" accent cellTip={wTip("b₂")} />
          </Row>
          <div className="tf-subhead">The forward pass as matrix operations</div>
          <Lead>
            The whole network is just this chain of multiplies and adds, with live numbers:
          </Lead>
          <Row>
            <Matrix data={[t.x]} rowLabels={["x"]} colLabels={C.featNames} caption="x" sub="1×3" />
            <Arrow label="·W₁+b₁" />
            <Matrix data={[t.z1]} rowLabels={["z₁"]} colLabels={cols(4, "h")} caption="z₁" sub="1×4"
              cellTip={zTip(t.x, C.W1, C.b1, "z₁ = x·W₁+b₁")} />
            <Arrow label="ReLU" />
            <Matrix data={[t.a1]} rowLabels={["a₁"]} colLabels={cols(4, "h")} caption="a₁" sub="1×4" />
            <Arrow label="·W₂+b₂" />
            <Matrix data={[t.z2]} rowLabels={["z₂"]} colLabels={C.labels} caption="z₂" sub="1×2"
              cellTip={zTip(t.a1, C.W2, C.b2, "z₂ = a₁·W₂+b₂")} />
            <Arrow label="softmax" />
            <Matrix data={[t.p]} rowLabels={["P"]} colLabels={C.labels} caption="P" sub="1×2" accent />
          </Row>
          <Note>The number inside each neuron is its output (activation). Inputs flow in on the
            left; the two output neurons end up holding the class probabilities. Every later step
            zooms into one piece of this picture.</Note>
        </>
      ),
    },
    {
      id: "input", group: "Forward pass", title: "1 · Input features", map: "Input",
      why: "A network only sees numbers. The real-world thing (an animal) is first encoded as a short list of measurements — the input vector.",
      render: (t) => (
        <>
          <Lead>
            We describe the animal with <b>3 numbers</b> (its <b>features</b>): how pointy the
            <b> ears</b> are, its <b>size</b>, and its <b>tail</b> length, each scaled to roughly
            −1…1. This row vector <V>x</V> is the network's input.
          </Lead>
          <Formula label="input"><V>x</V> = [ ears, size, tail ]</Formula>
          <Row>
            <Matrix data={[t.x]} rowLabels={["x"]} colLabels={C.featNames} caption="x" sub="input features (1×3)" accent />
          </Row>
          <Note>Change these with the top-bar sliders. Real networks take far bigger inputs (a
            784-pixel image, a 1000-word document…) but the mechanism is identical.</Note>
        </>
      ),
    },
    {
      id: "neuron", group: "Forward pass", title: "2 · A neuron: weights & bias", map: "Neuron",
      why: "The neuron is the atom of the whole network. Understand one and you understand the entire model — every layer is just many neurons side by side.",
      render: (t) => (
        <>
          <Lead>
            A single <b>neuron</b> has one <b>weight per input</b> (how much it cares about that
            feature) and one <b>bias</b> (its baseline). The hidden layer here has <b>4 neurons</b>,
            so layer 1's weights form a <b>3×4</b> matrix <V>W₁</V> — one column per neuron.
          </Lead>
          <Formula label="one neuron">output = activation( <V>w·x</V> + <V>b</V> )</Formula>
          <Row>
            <Matrix data={C.W1} rowLabels={C.featNames} colLabels={cols(4, "h")} caption="W₁" sub="weights · learned (3×4)" accent
              cellTip={(i, j, v) => (
                <div><div className="tf-tip-title">W₁[{C.featNames[i]} → h{j}]</div>
                <div className="tf-tip-where"><div>A <b>learned</b> weight — how much hidden neuron h{j} listens to "{C.featNames[i]}".</div></div>
                <div className="tf-tip-rule" /><div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>
              )} />
            <Matrix data={[C.b1]} rowLabels={["b₁"]} colLabels={cols(4, "h")} caption="b₁" sub="bias · learned" accent />
          </Row>
          <Note>These weights are <b>learned</b> during training (here they're fixed toy values).
            A positive weight = "this feature pushes this neuron up"; negative = pushes it down.</Note>
        </>
      ),
    },
    {
      id: "weighted", group: "Forward pass", title: "3 · Weighted sum (pre-activation)", map: "x·W₁+b₁",
      why: "Each neuron collapses all its inputs into a single number: multiply-and-add. This is the linear part of the neuron.",
      render: (t) => (
        <>
          <Lead>
            Each hidden neuron computes a <b>weighted sum</b> of the 3 inputs plus its bias. In
            matrix form, the whole layer is one multiply: <V>z₁ = x·W₁ + b₁</V>. Hover a cell to
            see the exact products.
          </Lead>
          <Formula label="pre-activation"><V>z₁</V> = <V>x · W₁</V> + <V>b₁</V></Formula>
          <Row>
            <Matrix data={[t.x]} rowLabels={["x"]} colLabels={C.featNames} caption="x" sub="input" />
            <Arrow label="×W₁+b₁" />
            <Matrix data={[t.z1]} rowLabels={["z₁"]} colLabels={cols(4, "h")} caption="z₁" sub="pre-activation (1×4)" accent
              cellTip={zTip(t.x, C.W1, C.b1, "z₁ = x·W₁ + b₁")} />
          </Row>
          <Note>Neuron h{t.z1.indexOf(Math.max(...t.z1))} has the highest pre-activation here. But
            raw sums alone can only draw straight lines — that's why we need the next step.</Note>
        </>
      ),
    },
    {
      id: "activation", group: "Forward pass", title: "4 · Activation (ReLU)", map: "ReLU",
      why: "Without a non-linear activation, stacking layers would collapse into one straight line. ReLU bends the function so the network can learn curves.",
      render: (t) => (
        <>
          <Lead>
            We pass each pre-activation through <b>ReLU</b> = max(0, z): keep positives, zero
            negatives. This simple bend is what lets deep networks model complex, curved
            relationships instead of just straight lines.
          </Lead>
          <Formula label="activation"><V>a₁</V> = ReLU(<V>z₁</V>) = max(0, <V>z₁</V>)</Formula>
          <Row>
            <Matrix data={[t.z1]} rowLabels={["z₁"]} colLabels={cols(4, "h")} caption="z₁" sub="pre-activation" />
            <Arrow label="ReLU" />
            <Matrix data={[t.a1]} rowLabels={["a₁"]} colLabels={cols(4, "h")} caption="a₁" sub="hidden activations" accent
              cellTip={(i, j, v) => (
                <div><div className="tf-tip-title">a₁[h{j}] = max(0, z₁)</div>
                <div className="tf-tip-sum">max(0, {fmt(t.z1[j])})</div>
                <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>
              )} />
          </Row>
          <Note>Any neuron whose sum was negative is now <b>0</b> — it "didn't fire". Other common
            activations are sigmoid and tanh; modern nets mostly use ReLU and its variants.</Note>
        </>
      ),
    },
    {
      id: "output", group: "Output", title: "5 · Output layer", map: "×W₂+b₂",
      why: "A second layer of neurons takes the hidden features and produces one raw score per class. Same multiply-and-add, no activation yet.",
      render: (t) => (
        <>
          <Lead>
            The hidden activations feed a second weight matrix <V>W₂</V> (4×2) to produce one
            <b> raw score (logit)</b> per class — cat and dog. This is the same weighted-sum
            operation as before.
          </Lead>
          <Formula label="output logits"><V>z₂</V> = <V>a₁ · W₂</V> + <V>b₂</V></Formula>
          <Row>
            <Matrix data={[t.a1]} rowLabels={["a₁"]} colLabels={cols(4, "h")} caption="a₁" sub="hidden" />
            <Arrow label="×W₂+b₂" />
            <Matrix data={[t.z2]} rowLabels={["z₂"]} colLabels={C.labels} caption="z₂" sub="logits (1×2)" accent
              cellTip={zTip(t.a1, C.W2, C.b2, "z₂ = a₁·W₂ + b₂")} />
          </Row>
          <Note>Higher logit → the network leans toward that class. But logits aren't
            probabilities yet — softmax fixes that next.</Note>
        </>
      ),
    },
    {
      id: "softmax", group: "Output", title: "6 · Softmax → prediction", map: "Softmax",
      why: "Softmax turns the two raw scores into clean probabilities that sum to 1, so we can read off a confident answer.",
      render: (t) => {
        const max = Math.max(...t.p);
        return (
          <>
            <Lead>
              <b>Softmax</b> exponentiates each logit and divides by the total, giving
              <b> probabilities</b> that sum to 1. The bigger one is the network's answer.
            </Lead>
            <Formula label="softmax">P(c) = e<Sup>z₂c</Sup> / Σ e<Sup>z₂</Sup></Formula>
            <Row>
              <Matrix data={[t.z2]} rowLabels={["z₂"]} colLabels={C.labels} caption="z₂" sub="logits" />
              <Arrow label="softmax" />
              <Matrix data={[t.p]} rowLabels={["P"]} colLabels={C.labels} caption="P" sub="probabilities" accent
                cellTip={(i, j, v) => { const ex = t.z2.map((z) => Math.exp(z)); const s = ex.reduce((a, b) => a + b, 0);
                  return (<div><div className="tf-tip-title">P({C.labels[j]})</div>
                    <div className="tf-tip-sum">e^{fmt(t.z2[j])} / sum {fmt(s)}</div>
                    <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>); }} />
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
            <Note>Move the sliders and watch the prediction flip. This forward pass <i>is</i> the
              network running — next we cover how it learns the weights.</Note>
          </>
        );
      },
    },
    {
      id: "loss", group: "Training", title: "7 · The loss (how wrong are we?)", map: "Loss",
      why: "Training needs a single number measuring error. Cross-entropy loss is high when the network's probability for the TRUE class is low, and near zero when it's confident and correct.",
      render: (t) => {
        const bw = backward(t, 0);
        return (
          <>
            <Lead>
              Suppose the correct answer is <b>cat</b>. We compare the predicted probabilities to the
              <b> true one-hot label</b> [1, 0] using <b>cross-entropy loss</b> = −log(P of the true
              class). If the network is confident and right, loss → 0; confident and wrong → huge.
            </Lead>
            <Formula label="cross-entropy">Loss = −log( P<Sub>true</Sub> ) = −log({fmt(t.p[0])}) = <b>{fmt(bw.loss)}</b></Formula>
            <Row>
              <Matrix data={[t.p]} rowLabels={["P"]} colLabels={C.labels} caption="P" sub="predicted" />
              <Matrix data={[bw.y]} rowLabels={["y"]} colLabels={C.labels} caption="y" sub="true label (cat)" />
              <Arrow label="−log P_cat" />
              <Matrix data={[[bw.loss]]} rowLabels={["L"]} colLabels={["loss"]} caption="Loss" sub="scalar" accent />
            </Row>
            <Note>This one number is what training minimises. Lower the slider toward a "cat-like"
              animal and watch the loss drop. Next we find how to change each weight to reduce it.</Note>
          </>
        );
      },
    },
    {
      id: "backprop", group: "Training", title: "8 · Backpropagation", map: "Backprop",
      why: "Backprop answers 'how does each weight affect the loss?'. It pushes the error backwards through the network with the chain rule, giving every weight a gradient — the direction to nudge it.",
      render: (t) => {
        const bw = backward(t, 0);
        return (
          <>
            <Lead>
              <b>Backpropagation</b> sends the error <b>backwards</b>, layer by layer, using the
              <b> chain rule</b>. At each step it computes a <b>gradient</b> — how much a tiny change
              in that value would change the loss. Green ∂ labels on the diagram show each neuron's
              gradient; the math below shows where they come from.
            </Lead>
            <window.NNDiagram trace={{ ...t, target: 0 }} mode="backward" />
            <div className="tf-subhead">Step 1 — gradient at the output: ∂L/∂z₂ = P − y</div>
            <Row>
              <Matrix data={[t.p]} rowLabels={["P"]} colLabels={C.labels} caption="P" sub="predicted" />
              <Arrow label="− y" />
              <Matrix data={[bw.dz2]} rowLabels={["∂z₂"]} colLabels={C.labels} caption="∂L/∂z₂" sub="output gradient" accent
                cellTip={(i, j, v) => (<div><div className="tf-tip-title">∂L/∂z₂[{C.labels[j]}] = P − y</div><div className="tf-tip-sum">{fmt(t.p[j])} − {fmt(bw.y[j])}</div><div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>)} />
            </Row>
            <div className="tf-subhead">Step 2 — gradient of W₂: ∂L/∂W₂ = a₁ ⊗ ∂z₂</div>
            <Row>
              <Matrix data={bw.dW2} rowLabels={cols(4, "h")} colLabels={C.labels} caption="∂L/∂W₂" sub="4×2 gradient" accent
                cellTip={(i, j, v) => (<div><div className="tf-tip-title">∂L/∂W₂[h{i}→{C.labels[j]}]</div><div className="tf-tip-sum">a₁[{i}] × ∂z₂[{j}] = {fmt(t.a1[i])} × {fmt(bw.dz2[j])}</div><div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>)} />
            </Row>
            <div className="tf-subhead">Step 3 — push back to the hidden layer: ∂L/∂z₁</div>
            <Row>
              <Matrix data={[bw.da1]} rowLabels={["∂a₁"]} colLabels={cols(4, "h")} caption="∂L/∂a₁" sub="= ∂z₂·W₂ᵀ" />
              <Arrow label="× ReLU′" />
              <Matrix data={[bw.dz1]} rowLabels={["∂z₁"]} colLabels={cols(4, "h")} caption="∂L/∂z₁" sub="hidden gradient" accent
                cellTip={(i, j, v) => (<div><div className="tf-tip-title">∂L/∂z₁[h{j}] = ∂a₁ × ReLU′(z₁)</div><div className="tf-tip-sum">{fmt(bw.da1[j])} × {t.z1[j] > 0 ? "1" : "0"} (z₁ {t.z1[j] > 0 ? ">" : "≤"} 0)</div><div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>)} />
            </Row>
            <div className="tf-subhead">Step 4 — gradient of W₁: ∂L/∂W₁ = x ⊗ ∂z₁</div>
            <Row>
              <Matrix data={bw.dW1} rowLabels={C.featNames} colLabels={cols(4, "h")} caption="∂L/∂W₁" sub="3×4 gradient" accent
                cellTip={(i, j, v) => (<div><div className="tf-tip-title">∂L/∂W₁[{C.featNames[i]}→h{j}]</div><div className="tf-tip-sum">x[{i}] × ∂z₁[{j}] = {fmt(t.x[i])} × {fmt(bw.dz1[j])}</div><div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>)} />
            </Row>
            <Note>Notice ReLU′ is 0 wherever a neuron didn't fire — so dead neurons get <b>no
              gradient</b> and don't learn on this example. Every weight now has a gradient.</Note>
          </>
        );
      },
    },
    {
      id: "descent", group: "Training", title: "9 · Gradient descent (the update)", map: "Update",
      why: "Gradients say which way is uphill on the loss. Gradient descent steps the opposite way by a small learning rate, repeated over many examples until the weights are good.",
      render: (t) => {
        const bw = backward(t, 0);
        const eta = 0.1;
        const wOld = C.W1[0][0], g = bw.dW1[0][0], wNew = wOld - eta * g;
        return (
          <>
            <Lead>
              Each weight steps <b>downhill</b> on the loss: subtract a small fraction (the
              <b> learning rate</b> η) of its gradient. Too big a step overshoots; too small and
              training crawls. Repeat over millions of examples and the weights settle into good
              values.
            </Lead>
            <Formula label="gradient descent"><V>w</V> ← <V>w</V> − η · ∂L/∂<V>w</V></Formula>
            <div className="nn-calc">
              <div className="nn-calc-h">Example: weight W₁[ears → h0]</div>
              <div className="nn-calc-row">old weight = <b>{fmt(wOld)}</b> · gradient = {fmt(g)} · η = {eta}</div>
              <div className="nn-calc-row">new = {fmt(wOld)} − {eta} × {fmt(g)} <b className="nn-calc-res">= {fmt(wNew)}</b></div>
            </div>
            <div className="tf-lifecycle">
              <div className="tf-life tf-life--train">
                <div className="tf-life-h"><span>η</span> Learning rate</div>
                <p>The step size. Common values 0.001–0.1. Optimisers like <b>Adam</b> adapt it per
                  weight for faster, more stable training.</p>
              </div>
              <div className="tf-life tf-life--infer">
                <div className="tf-life-h"><span>↻</span> Epochs & batches</div>
                <p>One pass over all data is an <b>epoch</b>; weights update per mini-<b>batch</b>.
                  Training repeats for many epochs until the loss plateaus.</p>
              </div>
            </div>
            <Note>Forward pass → loss → backprop → update. That four-step loop, repeated, <i>is</i>
              how every neural network in this site would be trained.</Note>
          </>
        );
      },
    },
    {
      id: "activations", group: "Design choices", title: "10 · Why activation functions?", map: "Activations",
      why: "Without a non-linear activation, stacking layers is pointless — the whole network collapses to a single linear map. Activations are what give a deep network its power.",
      render: (t) => {
        const W = 150, H = 90, sx = (x) => 10 + (x + 4) / 8 * (W - 20), sy = (y) => H - 8 - (y + 0.1) / 1.2 * (H - 18);
        const curve = (f, ymin, ymax) => { const pts = []; for (let i = 0; i <= 40; i++) { const x = -4 + 8 * i / 40; const y = (f(x) - ymin) / (ymax - ymin); pts.push((10 + (i / 40) * (W - 20)).toFixed(1) + "," + (H - 8 - y * (H - 18)).toFixed(1)); } return pts.join(" "); };
        const chart = (label, path, formula) => (
          <div className="nn-act">
            <div className="nn-act-h">{label}</div>
            <svg viewBox={`0 0 ${W} ${H}`} className="nn-actsvg">
              <line x1="10" y1={H - 8} x2={W - 10} y2={H - 8} stroke="var(--line)" />
              <line x1={W / 2} y1="6" x2={W / 2} y2={H - 4} stroke="var(--line)" />
              <polyline points={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
            </svg>
            <div className="nn-act-f">{formula}</div>
          </div>
        );
        return (
          <>
            <Lead>
              Why bother squashing each neuron? Because <b>without a non-linearity, depth is
              useless</b>. Two stacked linear layers <V>W₂(W₁x)</V> equal a single linear layer
              <V> (W₂W₁)x</V> — you could replace the whole network with one matrix. The activation
              <b> bends</b> the function so stacking layers actually builds complexity.
            </Lead>
            <Formula label="the collapse without it">W₂·(W₁·x) = (W₂·W₁)·x = W′·x&nbsp;&nbsp;→ just one linear layer</Formula>
            <div className="tf-subhead">The common activation functions</div>
            <div className="nn-act-grid">
              {chart("Sigmoid", curve((x) => 1 / (1 + Math.exp(-x)), 0, 1), "σ(x) = 1 / (1 + e⁻ˣ) · range (0,1)")}
              {chart("Tanh", curve((x) => Math.tanh(x), -1, 1), "tanh(x) · range (−1,1)")}
              {chart("ReLU", curve((x) => Math.max(0, x), 0, 4), "max(0, x) · range [0,∞)")}
              {chart("Leaky ReLU", curve((x) => x > 0 ? x : 0.1 * x, -0.4, 4), "max(0.1x, x) · keeps a small slope")}
            </div>
            <div className="tf-legend">
              {[["Sigmoid","squashes to (0,1) — good for probabilities, but saturates and its gradient (max 0.25) causes vanishing gradients in deep nets"],
                ["Tanh","zero-centred (−1,1), trains better than sigmoid, but still saturates"],
                ["ReLU","cheap, no saturation for x>0, sparse activations — the default for deep nets. Risk: 'dead' neurons stuck at 0"],
                ["Leaky ReLU / GELU / SiLU","keep a small negative slope (or a smooth bend) to avoid dead neurons; GELU/SiLU are standard in transformers"]].map((r) => (
                <div className="tf-leg" key={r[0]}><div className="tf-leg-name">{r[0]}</div><div className="tf-leg-desc">{r[1]}</div></div>
              ))}
            </div>
            <div className="tf-subhead">Which one should you use?</div>
            <div className="tf-legend">
              {[["Hidden layers → ReLU (default)","cheap, no saturation, trains fast. Start here for almost any feed-forward / conv net."],
                ["Dead neurons a problem → Leaky ReLU / GELU","if many ReLU neurons get stuck at 0, a small negative slope (Leaky) or smooth bend (GELU/SiLU) revives them."],
                ["Transformers / modern LLMs → GELU or SwiGLU","smooth activations give a small but reliable quality gain at scale."],
                ["Binary output → Sigmoid","squashes to a single (0,1) probability for yes/no classification."],
                ["Multi-class output → Softmax","turns the final scores into probabilities that sum to 1."],
                ["RNN cells → Tanh","zero-centred, bounded — keeps the recurrent state stable (see the RNN/LSTM explainers)."]].map((r) => (
                <div className="tf-leg" key={r[0]}><div className="tf-leg-name">{r[0]}</div><div className="tf-leg-desc">{r[1]}</div></div>
              ))}
            </div>
            <Note>Rule of thumb: <b>ReLU in the hidden layers, softmax/sigmoid at the output</b>.
              Reach for Leaky ReLU / GELU only if you see dead neurons or need that last bit of
              quality. The choice affects gradient flow, training speed and whether deep networks
              train at all.</Note>
          </>
        );
      },
    },
    {
      id: "init", group: "Design choices", title: "11 · Weight initialization", map: "Weight init",
      why: "Where training starts matters enormously. Bad initial weights cause vanishing/exploding signals or symmetric neurons that never differentiate. Good schemes keep the signal variance stable across layers.",
      render: (t) => (
        <>
          <Lead>
            Before training, weights need <b>starting values</b>. The choice is surprisingly
            critical:
          </Lead>
          <div className="tf-lifecycle">
            <div className="tf-life tf-life--train">
              <div className="tf-life-h"><span>✗</span> All zeros</div>
              <p>Every neuron in a layer computes the <b>same</b> thing and gets the <b>same</b>
                gradient — they never differentiate. The network can't learn. Biases can be 0, but
                weights cannot.</p>
            </div>
            <div className="tf-life tf-life--infer">
              <div className="tf-life-h"><span>✗</span> Too big / too small</div>
              <p>Large weights → activations &amp; gradients <b>explode</b>; tiny weights → they
                <b> vanish</b>. Either way deep nets won't train.</p>
            </div>
          </div>
          <div className="tf-subhead">The standard schemes (random, but carefully scaled)</div>
          <div className="tf-legend">
            {[["Random normal / uniform","small random values, e.g. N(0, 0.01). Simple but doesn't scale well with layer size."],
              ["Xavier / Glorot — normal","W ~ N(0, 2/(n_in+n_out)). Keeps variance stable for tanh/sigmoid layers."],
              ["Xavier / Glorot — uniform","W ~ U(−√(6/(n_in+n_out)), +√(6/(n_in+n_out)))."],
              ["He / Kaiming — normal","W ~ N(0, 2/n_in). Designed for ReLU (accounts for it zeroing half the inputs). The modern default."],
              ["He / Kaiming — uniform","W ~ U(−√(6/n_in), +√(6/n_in))."],
              ["LeCun","W ~ N(0, 1/n_in). Used with SELU / self-normalizing nets."]].map((r) => (
              <div className={"tf-leg" + (/Xavier|He/.test(r[0]) ? " is-learned" : "")} key={r[0]}>
                <div className="tf-leg-name">{r[0]}</div><div className="tf-leg-desc">{r[1]}</div>
              </div>
            ))}
          </div>
          <Formula label="the core idea">keep Var(output) ≈ Var(input) at every layer → scale by 1/√n_in</Formula>
          <div className="tf-subhead">Which scheme should you use?</div>
          <div className="tf-legend">
            {[["ReLU / Leaky ReLU layers → He (Kaiming)","accounts for ReLU zeroing half the inputs. The modern default for CNNs and feed-forward nets."],
              ["Tanh / Sigmoid layers → Xavier (Glorot)","balances variance for symmetric, saturating activations."],
              ["SELU / self-normalizing nets → LeCun","variance 1/n_in pairs with SELU's self-normalizing property."],
              ["Transformers → Xavier + small scaling","often Xavier with extra residual/layer scaling for stability."],
              ["Normal vs uniform → either","same variance, negligible difference in practice — pick what your framework defaults to."],
              ["Biases → zeros","biases don't suffer the symmetry problem, so 0 is fine (LSTM forget-gate bias is a deliberate exception, set to 1)."]].map((r) => (
              <div className="tf-leg" key={r[0]}><div className="tf-leg-name">{r[0]}</div><div className="tf-leg-desc">{r[1]}</div></div>
            ))}
          </div>
          <Note>Rule of thumb: <b>He init with ReLU, Xavier with tanh/sigmoid</b>, biases at zero.
            The shared intuition: pick the spread so the signal neither grows nor shrinks as it
            passes through each layer.</Note>
        </>
      ),
    },
    {
      id: "minima", group: "Design choices", title: "12 · Local vs global minima", map: "Minima",
      why: "Training is a search over a vast, bumpy loss landscape. Understanding minima, saddle points and why gradient descent usually still works is key to training intuition.",
      render: (t) => {
        const W = 460, H = 170;
        const f = (x) => 0.6 * Math.sin(1.1 * x) + 0.12 * x * x - 0.2 * x; // bumpy bowl
        const xs = []; for (let i = 0; i <= 80; i++) xs.push(-5 + 10 * i / 80);
        const ys = xs.map(f); const ymin = Math.min(...ys), ymax = Math.max(...ys);
        const sx = (x) => 30 + (x + 5) / 10 * (W - 50);
        const sy = (y) => H - 24 - (y - ymin) / (ymax - ymin) * (H - 44);
        const path = xs.map((x, i) => (i ? "L" : "M") + sx(x).toFixed(1) + " " + sy(ys[i]).toFixed(1)).join(" ");
        return (
          <>
            <Lead>
              Training minimises the loss by walking <b>downhill</b> — but the loss surface is bumpy.
              A <b>global minimum</b> is the lowest point anywhere; a <b>local minimum</b> is a dip
              that's lowest only nearby; a <b>saddle</b> is flat in some directions, downhill in
              others. Gradient descent can get stuck in dips or stall on saddles.
            </Lead>
            <div className="nn-loss-wrap">
              <svg viewBox={`0 0 ${W} ${H}`} className="nn-losssvg">
                <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
                <text x="30" y="14" className="reg-axl">loss</text>
                <text x={W - 30} y={H - 6} className="reg-axl" textAnchor="end">a weight →</text>
                {/* local min near x≈-3.4 */}
                <circle cx={sx(-3.3)} cy={sy(f(-3.3))} r="5" fill="#e0851e" />
                <text x={sx(-3.3)} y={sy(f(-3.3)) - 10} textAnchor="middle" className="nn-loss-lbl" fill="#c26a10">local min</text>
                {/* global min near x≈2.2 */}
                <circle cx={sx(2.5)} cy={sy(f(2.5))} r="5" fill="#1f9e6b" />
                <text x={sx(2.5)} y={sy(f(2.5)) + 18} textAnchor="middle" className="nn-loss-lbl" fill="#178055">global min</text>
              </svg>
            </div>
            <div className="tf-subhead">Why it usually works anyway</div>
            <div className="tf-legend">
              {[["High dimensions help","with millions of weights, true bad local minima are rare — most flat points are saddles, and good minima are plentiful and nearly as low."],
                ["Momentum","carries velocity through small dips and over saddles instead of stalling."],
                ["Adam / RMSProp","adapt the step per-weight, speeding past flat regions."],
                ["Stochastic (mini-batch) noise","the randomness of SGD jiggles the path out of shallow local minima."],
                ["Learning-rate schedules","big steps early to explore, small steps late to settle into a good minimum."]].map((r) => (
                <div className="tf-leg" key={r[0]}><div className="tf-leg-name">{r[0]}</div><div className="tf-leg-desc">{r[1]}</div></div>
              ))}
            </div>
            <Note>In practice you rarely reach <i>the</i> global minimum — and you don't need to. A
              good-enough low minimum that generalises is the real goal.</Note>
          </>
        );
      },
    },
    {
      id: "vanishing", group: "Deep-network problems", title: "13 · Vanishing & exploding gradients", map: "Vanishing grad",
      why: "Backprop multiplies many gradients together. In deep networks these products can shrink to zero (vanishing) or blow up (exploding), making early layers untrainable. This is a central deep-learning challenge.",
      render: (t) => {
        const layers = 8;
        const vanish = Array.from({ length: layers }, (_, i) => Math.pow(0.25, i));
        const explode = Array.from({ length: layers }, (_, i) => Math.pow(1.8, i));
        const bar = (v, max, cls) => (<div className="nn-grad-bar"><div className={"nn-grad-fill " + cls} style={{ width: Math.max(2, (Math.log10(v + 1e-9) - Math.log10(1e-6)) / (Math.log10(max) - Math.log10(1e-6)) * 100) + "%" }} /></div>);
        return (
          <>
            <Lead>
              Backprop <b>multiplies</b> a gradient at every layer it passes through. Stack many
              layers and you're multiplying many numbers — if they're <b>&lt;1</b> the product
              <b> vanishes</b> toward 0; if <b>&gt;1</b> it <b>explodes</b>. Either way the early
              layers stop learning properly.
            </Lead>
            <Formula label="the chain product">∂L/∂w<Sub>early</Sub> ∝ <V>g₁ · g₂ · g₃ · … · g_L</V></Formula>
            <div className="tf-subhead">Vanishing — each layer's gradient ×0.25 (e.g. sigmoid)</div>
            <div className="nn-gradchart">
              {vanish.map((v, i) => (<div className="nn-grad-row" key={i}><span>layer {layers - i}</span>{bar(v, 1, "is-vanish")}<b>{v < 0.001 ? v.toExponential(1) : fmt(v)}</b></div>))}
            </div>
            <div className="tf-subhead">Exploding — each layer's gradient ×1.8</div>
            <div className="nn-gradchart">
              {explode.map((v, i) => (<div className="nn-grad-row" key={i}><span>layer {layers - i}</span>{bar(v, 200, "is-explode")}<b>{v > 100 ? v.toFixed(0) : fmt(v)}</b></div>))}
            </div>
            <div className="tf-subhead">How it's fixed in practice</div>
            <div className="tf-legend">
              {[["ReLU activations","derivative is exactly 1 for positive inputs — doesn't shrink the gradient like sigmoid/tanh (max slope 0.25)"],
                ["Residual / skip connections","let gradients flow straight through (the transformer & ResNet trick)"],
                ["Careful weight init","He / Xavier init keeps the signal variance ~constant across layers"],
                ["Gradient clipping","caps exploding gradients at a max norm"],
                ["Batch / layer normalization","re-centres activations each layer so gradients stay well-scaled"],
                ["LSTM gates","the cell-state path avoids repeated multiplication (see the LSTM explainer)"]].map((r) => (
                <div className="tf-leg" key={r[0]}><div className="tf-leg-name">{r[0]}</div><div className="tf-leg-desc">{r[1]}</div></div>
              ))}
            </div>
            <Note>This is exactly why deep nets needed ReLU, normalization and residual connections to
              become trainable — and why LSTMs beat plain RNNs on long sequences.</Note>
          </>
        );
      },
    },
    {
      id: "reg", group: "Deep-network problems", title: "14 · Regularization (avoid overfitting)", map: "Regularization",
      why: "A big network can memorise the training data instead of learning general patterns — that's overfitting. Regularization techniques deliberately constrain the model so it generalises to new data.",
      render: (t) => (
        <>
          <Lead>
            With enough weights a network can <b>memorise</b> the training set yet fail on new
            data — <b>overfitting</b>. <b>Regularization</b> reins it in so it learns general
            patterns. The main techniques:
          </Lead>
          <div className="nn-reg-grid">
            <div className="nn-reg">
              <div className="nn-reg-h">Dropout</div>
              <div className="nn-dropviz">
                {Array.from({ length: 12 }, (_, i) => <span key={i} className={"nn-dot" + ([1,4,7,9].includes(i) ? " off" : "")} />)}
              </div>
              <p>Randomly switch off a fraction of neurons each training step, so the network can't
                rely on any single one. At test time all neurons are used.</p>
              <Formula label="dropout">keep each neuron with prob <V>p</V> (e.g. 0.5)</Formula>
            </div>
            <div className="nn-reg">
              <div className="nn-reg-h">L2 weight decay</div>
              <div className="nn-regbars">
                {[0.9,-0.7,0.5,-0.4].map((w,i)=><div key={i} className="nn-regbar"><span className="b" style={{height:Math.abs(w)*40+"px"}} /><span className="b small" style={{height:Math.abs(w)*26+"px"}} /></div>)}
              </div>
              <p>Add the sum of squared weights to the loss, so training prefers <b>small weights</b>
                → smoother, simpler functions that generalise better.</p>
              <Formula label="L2 penalty">Loss + λ Σ <V>w²</V></Formula>
            </div>
            <div className="nn-reg">
              <div className="nn-reg-h">Early stopping</div>
              <div className="nn-earlyviz">
                <svg viewBox="0 0 120 60" className="nn-earlysvg">
                  <polyline points="2,50 30,32 60,20 90,13 118,9" fill="none" stroke="var(--accent)" strokeWidth="2"/>
                  <polyline points="2,52 30,34 60,24 90,28 118,40" fill="none" stroke="var(--neg-rgb-stroke, #e0492e)" strokeWidth="2"/>
                  <line x1="78" y1="6" x2="78" y2="54" stroke="var(--faint)" strokeWidth="1" strokeDasharray="3 3"/>
                </svg>
              </div>
              <p>Watch validation loss; stop when it starts rising (red) even as training loss (blue)
                keeps falling — that's the onset of overfitting.</p>
            </div>
            <div className="nn-reg">
              <div className="nn-reg-h">More data & augmentation</div>
              <div className="nn-dropviz">
                {Array.from({ length: 12 }, (_, i) => <span key={i} className="nn-dot tiny" />)}
              </div>
              <p>The best regularizer is more varied data. <b>Augmentation</b> (flip / crop / noise)
                creates new examples cheaply so the model sees more variety.</p>
            </div>
          </div>
          <Note icon="!">Also common: <b>batch normalization</b> (stabilises training) and
            <b> label smoothing</b>. You combine a few of these in practice. That completes the full
            picture — forward pass, the network graph, training, and the problems deep nets must
            solve.</Note>
        </>
      ),
    },
  {
      id: "hyperparams",
      group: "Practical",
      title: "Hyperparameters & when to use",
      map: "Hyperparams",
      why: "Neural network hyperparameters interact in complex ways — but three are non-negotiable: learning rate, batch size, and architecture (layers × neurons).",
      render: () => (
        <>
          <Lead>A neural network's behavior is governed by architecture hyperparameters (how many layers and neurons) and training hyperparameters (learning rate, batch size, epochs, regularization). Unlike tree models, there are no defaults that work everywhere — you must tune based on your dataset size and task complexity.</Lead>
          <Note>The single most important hyperparameter is <b>learning rate</b>. Too high → training diverges (loss explodes). Too low → training takes forever. The standard approach: use a learning rate scheduler (warm up, then decay) or automatic learning rate finders (find the steepest loss drop).</Note>
          <div className="tf-subhead">Key hyperparameters</div>
          <div className="tf-legend">
            {[
              ["learning_rate", "Learning rate (η)", "Typical: 1e-3 (Adam default). Range: 1e-5 to 1e-1. Most important hyperparameter. Use Adam with lr=1e-3 as default. If loss explodes: reduce 10x. If loss barely moves: increase 3x. Use ReduceLROnPlateau or cosine decay schedule."],
              ["batch_size", "Mini-batch size", "Default 32. Larger batches (128–256) train faster per epoch but may generalize worse. Smaller batches (16–32) add noise that acts as regularization. Increase until GPU memory is full, then use gradient accumulation."],
              ["epochs", "Training epochs", "Use early stopping instead of fixing epochs. Monitor validation loss; stop when it stops improving for 10–20 epochs (patience parameter). Typical range: 50–500 depending on dataset size."],
              ["hidden_layers", "Number of hidden layers", "Start with 1–2 hidden layers. Deeper networks capture more complex patterns but need more data. Rule of thumb: if you have < 10K samples, 1–2 layers max. Add layers if training accuracy is low (underfitting)."],
              ["neurons_per_layer", "Units per hidden layer", "Start with 64–256. Decrease as you go deeper (pyramid shape: 256→128→64). If overfitting: reduce neurons. If underfitting: increase neurons."],
              ["activation", "Activation function", "ReLU (default for hidden layers). Use Leaky ReLU if dying neurons are a problem (dead neurons output 0 forever). GELU for Transformers. Sigmoid/tanh for gates (LSTM). Softmax for output (multi-class)."],
              ["dropout_rate", "Dropout regularization", "Default 0 (off). Set 0.2–0.5 for regularization — randomly zeros neurons during training. Prevents overfitting. Higher rate = more regularization. Use after large layers."],
              ["optimizer", "Gradient descent variant", "Adam (default, lr=1e-3). SGD with momentum (lr=0.01, momentum=0.9) for image models. AdamW for Transformers (adds weight decay)."],
              ["weight_decay", "L2 regularization (in Adam: use AdamW)", "Equivalent to Ridge regression but applied to all weights. Typical: 1e-4 to 1e-2. Use when overfitting on small datasets."],
              ["batch_norm", "Batch Normalization", "After each hidden layer: normalizes activations → faster convergence, higher learning rate tolerance, implicit regularization. Almost always beneficial for deep networks."],
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
              {["Universal function approximator", "Handles unstructured data (images, text, audio)", "End-to-end learning (no manual feature engineering)", "Transfer learning saves data requirements", "Scales with data and compute"].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
              {["Requires large datasets (> 10K samples for meaningful learning)", "Slow to train without GPU", "Many hyperparameters to tune", "Not interpretable (black box)", "Unstable training (random initialization matters)", "Needs careful regularization"].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✗ {t}</div>)}
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
                  ["Structured/tabular data (< 100K rows)", "XGBoost / LightGBM", "Tree models outperform ANN on tabular data with less tuning"],
                  ["Image recognition", "CNN (ResNet, EfficientNet)", "Convolutional inductive bias is critical for spatial data"],
                  ["Sequential text (classification, generation)", "Transformer (BERT, GPT)", "Attention mechanism outperforms vanilla ANN/LSTM on text"],
                  ["Custom regression/classification with many features", "ANN with 2–3 layers", "Can model complex non-linear interactions"],
                  ["Very small dataset (< 5K samples)", "Logistic Regression or XGBoost", "ANN overfits badly with few samples"],
                  ["Need interpretability", "Logistic Regression or Decision Tree", "Neural networks are fundamentally not interpretable"],
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
    title: "Neural Network (ANN / MLP)", subtitle: "how a feed-forward network classifies from features",
    cur: "ANN / MLP", run: window.NN.runANN, default: window.NN.ANN.default, renderInput,
  };
})();
