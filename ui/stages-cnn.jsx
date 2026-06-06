/* CNN stages */
(function () {
  const { Matrix, V, Sub, Sup, Formula, DotTip, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const C = window.NN.CNN;
  const cols = (n, p) => Array.from({ length: n }, (_, i) => (p || "") + i);

  const PRESETS = {
    "Vertical edge": C.default,
    "Horizontal edge": [
      [0.9,0.9,0.9,0.9,0.9,0.9],[0.9,0.9,0.8,0.9,0.8,0.9],[0.8,0.8,0.8,0.8,0.8,0.8],
      [0.1,0.2,0.1,0.1,0.2,0.1],[0.1,0.1,0.1,0.0,0.1,0.1],[0.0,0.1,0.0,0.1,0.0,0.1],
    ],
    "Blank": Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => 0.5)),
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

  // grayscale pixel style
  const px = (v) => { const g = Math.round(v * 255); return { background: `rgb(${g},${g},${g})` }; };

  function EditableImage({ input, setInput }) {
    return (
      <div>
        <div className="nn-imggrid" style={{ gridTemplateColumns: "repeat(6, 34px)" }}>
          {input.map((row, i) => row.map((v, j) => (
            <div key={i + "-" + j} className="nn-px" style={px(v)} title={"pixel " + fmt(v)}
              onClick={() => { const n = input.map((r) => r.slice()); n[i][j] = +(((v + 0.5) % 1.5).toFixed(1)); if (n[i][j] > 1) n[i][j] = 0; setInput(n); }} />
          )))}
        </div>
        <div className="nn-imghint">Click any pixel to cycle its brightness (0 → 0.5 → 1). Bright = high value.</div>
      </div>
    );
  }

  const STAGES = [
    {
      id: "overview", group: "Overview", title: "What a CNN is, at a glance", map: "Overview",
      why: "A CNN is built to see. Instead of connecting every pixel to every neuron, it slides a tiny shared filter across the image to detect local patterns — edges, then shapes, then objects.",
      render: (t) => {
        const sym = (s) => <span className="tf-sym">{s}</span>;
        return (
          <>
            <Lead>
              A <b>convolutional neural network</b> classifies images. Rather than treat all 36
              pixels independently, it slides a small <b>filter</b> (kernel) over the image to build
              a <b>feature map</b> of where a pattern appears, shrinks it with <b>pooling</b>, then
              feeds the result to a normal dense layer. Here it decides <b>vertical vs horizontal
              edge</b>.
            </Lead>
            <div className="tf-archwrap">
              <div className="tf-arch">
                <div className="tf-arch-io">6×6 image<span>input pixels</span></div>
                <div className="tf-arch-f"><b>convolve 3×3 filter</b></div>
                <div className="tf-arch-row">{sym("feature map")} 4×4 → ReLU</div>
                <div className="tf-arch-f"><b>max-pool 2×2</b></div>
                <div className="tf-arch-row">{sym("pooled")} 2×2 → flatten</div>
                <div className="tf-arch-f"><b>dense + softmax</b></div>
                <div className="tf-arch-io tf-arch-io--out">vertical / horizontal<span>class probabilities</span></div>
              </div>
            </div>
            <div className="tf-subhead">The full network — feature extraction then classification</div>
            <window.CNNArchViz />
            <div className="tf-subhead">The whole pipeline, as feature maps</div>
            <window.CNNFlow trace={t} />
            <div className="tf-subhead">Symbol key</div>
            <div className="tf-legend">
              {[["image","input pixels","6×6","grayscale, 0 (dark) … 1 (bright)"],
                ["K","kernel / filter","3×3","learned — the pattern the layer looks for"],
                ["feature map","convolution output","4×4","how strongly the filter matches at each spot"],
                ["pooled","after max-pool","2×2","keep the strongest response in each 2×2 block"],
                ["Wd,bd","dense weights","4×2","learned — flattened map to class scores"],
                ["P","probabilities","1×2","softmax — sums to 1"]].map((r) => (
                <div className={"tf-leg" + (/K|Wd/.test(r[0]) ? " is-learned" : "")} key={r[0]}>
                  <div className="tf-leg-top"><span className={"tf-sym" + (/K|Wd/.test(r[0]) ? " is-learned" : "")}>{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div><div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>
            <Note>Use the <b>preset</b> buttons in the top bar, or click pixels on the next step.
              Press <b>Next →</b> to walk the layers.</Note>
          </>
        );
      },
    },
    {
      id: "input", group: "Forward pass", title: "1 · The input image", map: "Image",
      why: "An image is just a grid of numbers — brightness values. Everything the CNN does is arithmetic on this grid.",
      render: (t, ctx) => (
        <>
          <Lead>
            Our image is a <b>6×6 grid</b> of brightness values from 0 (black) to 1 (white). This
            one has a bright left half and dark right half — a <b>vertical edge</b>. Click pixels to
            edit it and watch every later step change.
          </Lead>
          <Row>
            <EditableImage input={ctx.input} setInput={ctx.setInput} />
            <Arrow label="as numbers" />
            <Matrix data={t.img} rowLabels={cols(6, "r")} colLabels={cols(6, "c")} caption="image" sub="pixel values (6×6)" accent />
          </Row>
          <Note>A real photo is the same idea but larger and with 3 colour channels (R, G, B).</Note>
        </>
      ),
    },
    {
      id: "kernel", group: "Forward pass", title: "2 · The kernel (filter)", map: "Kernel",
      why: "The kernel is the pattern detector. These 9 numbers are what the network learns; sliding them over the image is what 'convolution' means.",
      render: (t) => (
        <>
          <Lead>
            A <b>kernel</b> is a tiny grid of weights — here <b>3×3</b>. This one has positive
            numbers on the left column and negative on the right, so it lights up wherever the
            image goes from <b>bright on the left to dark on the right</b> — a vertical edge.
          </Lead>
          <Formula label="this kernel">left column +1 · middle 0 · right column −1</Formula>
          <Row>
            <Matrix data={C.kernel} rowLabels={cols(3, "")} colLabels={cols(3, "")} caption="K" sub="kernel · learned (3×3)" accent
              cellTip={(i, j, v) => (<div><div className="tf-tip-title">K[{i},{j}]</div>
                <div className="tf-tip-where"><div>A <b>learned</b> filter weight.</div></div>
                <div className="tf-tip-rule" /><div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>)} />
          </Row>
          <div className="tf-subhead">Why do we need a kernel — and where do its numbers come from?</div>
          <Lead>
            A dense layer would connect <i>every</i> pixel to every neuron — millions of weights, and
            it couldn't tell that a pattern in the corner is the same as one in the centre. A
            <b> kernel</b> fixes both: it's tiny (just 9 weights) and <b>slid across the whole
            image</b>, so the same pattern detector is reused everywhere (<b>weight sharing</b> +
            <b> translation invariance</b>).
          </Lead>
          <div className="tf-lifecycle">
            <div className="tf-life tf-life--train">
              <div className="tf-life-h"><span>?</span> Where do the 9 numbers come from?</div>
              <p>They are <b>learned</b>, exactly like dense weights. They start <b>random</b> (He /
                Glorot init, same as any layer) and <b>backprop</b> adjusts them until they detect
                useful patterns. We hand-set this one to a clean vertical-edge detector only so the
                demo is readable.</p>
            </div>
            <div className="tf-life tf-life--infer">
              <div className="tf-life-h"><span>▦</span> Many kernels per layer</div>
              <p>A real conv layer learns <b>dozens</b> of kernels (each its own 3×3×channels block),
                producing one feature map each — edges, corners, colours. Deeper layers combine them
                into shapes, then objects.</p>
            </div>
          </div>
          <Note>So a kernel is just a small, shared, learned weight matrix. One kernel = one pattern
            detector; stack many and you get a CNN.</Note>
        </>
      ),
    },
    {
      id: "conv", group: "Forward pass", title: "3 · Convolution (slide & multiply)", map: "Convolve",
      why: "This is the heart of a CNN. Lay the kernel over a 3×3 patch, multiply element-wise, sum to one number, then slide one step and repeat across the whole image.",
      render: (t) => {
        const out = t.conv.length;
        return (
          <>
            <Lead>
              Place the kernel over the top-left <b>3×3 patch</b>, multiply each overlapping pair,
              and add them up → that's one output number. <b>Slide</b> one pixel right and repeat,
              row by row, to fill the <b>4×4 feature map</b>. Hover any output cell to see the full
              9-term sum and the patch it came from.
            </Lead>
            <Formula label="convolution"><V>fm</V><Sub>ij</Sub> = Σ <V>image</V><Sub>i+a,j+b</Sub> · <V>K</V><Sub>a,b</Sub></Formula>
            <window.CNNConvViz trace={t} />
            <div className="tf-subhead">The full feature map (hover any cell for its 9-term sum)</div>
            <Row>
              <Matrix data={t.img} rowLabels={cols(6, "r")} colLabels={cols(6, "c")} caption="image" sub="6×6" />
              <Arrow label="⊛ K" />
              <Matrix data={t.conv} rowLabels={cols(out, "r")} colLabels={cols(out, "c")} caption="feature map" sub="4×4 (pre-ReLU)" accent
                cellTip={(i, j) => {
                  const terms = [];
                  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) terms.push({ a: t.img[i + a][j + b], b: C.kernel[a][b] });
                  return <DotTip title={`patch at (r${i},c${j}) ⊛ K`} terms={terms} result={t.conv[i][j]} />;
                }} />
            </Row>
            <Note>Big positive = strong vertical edge there; near zero = flat region. The same 9
              kernel weights are reused at every position — that <b>weight sharing</b> is why CNNs
              need far fewer parameters than dense nets. Notice the 6×6 image shrank to 4×4 — the
              next step explains why, and how padding prevents it.</Note>
          </>
        );
      },
    },
    {
      id: "padding", group: "Forward pass", title: "4 · Padding (why the edges matter)", map: "Padding",
      why: "Sliding a 3×3 kernel inside a 6×6 image only fits in 4×4 positions, so the output shrinks and edge pixels get used less. Padding adds a border so the output keeps its size and corners count fully.",
      render: (t) => {
        const cell = (cls, key) => <div key={key} className={"cnn-pad-cell " + cls} />;
        const valid = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) valid.push(cell("img", "v" + i + "-" + j));
        const padded = []; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) padded.push(cell((i === 0 || j === 0 || i === 7 || j === 7) ? "pad" : "img", "p" + i + "-" + j));
        return (
          <>
            <Lead>
              Each convolution step needs a full 3×3 patch, so the kernel centre can't sit on the
              outermost pixels — a 6×6 image yields only a <b>4×4</b> output. Two problems: the map
              <b> shrinks</b> every layer (you'd run out), and <b>edge pixels</b> get covered by fewer
              windows than centre pixels, so borders are under-used.
            </Lead>
            <Formula label="output size">out = (N − K)/stride + 1&nbsp;&nbsp;→ (6 − 3) + 1 = 4 (no padding)</Formula>
            <div className="cnn-viz-row">
              <div>
                <div className="cnn-cap">"valid" — no padding · output 4×4</div>
                <div className="cnn-pad-grid" style={{ gridTemplateColumns: "repeat(6, 20px)" }}>{valid}</div>
              </div>
              <div className="cnn-arrow">→</div>
              <div>
                <div className="cnn-cap">"same" — pad a border of 0s · output stays 6×6</div>
                <div className="cnn-pad-grid" style={{ gridTemplateColumns: "repeat(8, 20px)" }}>{padded}</div>
              </div>
            </div>
            <div className="tf-legend">
              {[["'valid' padding","no border — output shrinks (N−K+1). Used when you want to reduce size."],
                ["'same' padding","add a border of zeros (here 1 pixel) so output size = input size. The common default."],
                ["Why it helps","keeps spatial size through many layers, and lets corner/edge pixels sit at a window centre too."]].map((r) => (
                <div className="tf-leg" key={r[0]}><div className="tf-leg-name">{r[0]}</div><div className="tf-leg-desc">{r[1]}</div></div>
              ))}
            </div>
            <Note>The striped border is the zero-padding. With "same" padding a 3×3 kernel needs a
              1-pixel border; a 5×5 kernel needs 2, and so on (pad = (K−1)/2).</Note>
          </>
        );
      },
    },
    {
      id: "stride", group: "Forward pass", title: "5 · Stride (how far the kernel jumps)", map: "Stride",
      why: "Stride is how many pixels the kernel moves each step. Stride 1 looks everywhere (big output); a larger stride skips positions to downsample and cut computation.",
      render: (t) => {
        const grid = (stride, key) => {
          const cells = [];
          for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
            const isStart = i % stride === 0 && j % stride === 0 && i <= 6 - 3 && j <= 6 - 3;
            cells.push(<div key={key + i + "-" + j} className={"cnn-pad-cell " + (isStart ? "img" : "")} style={isStart ? { background: "var(--accent)", outline: "2px solid var(--neon)" } : {}} />);
          }
          return <div className="cnn-pad-grid" style={{ gridTemplateColumns: "repeat(6, 20px)" }}>{cells}</div>;
        };
        return (
          <>
            <Lead>
              <b>Stride</b> is the step size as the kernel slides. <b>Stride 1</b> (what we used)
              places a window at every pixel → the most detail and the largest output. A
              <b> larger stride</b> jumps over positions, producing a smaller map and far less
              computation — a cheap way to <b>downsample</b>, like pooling.
            </Lead>
            <Formula label="output size">out = ⌊(N − K)/stride⌋ + 1</Formula>
            <div className="cnn-viz-row">
              <div>
                <div className="cnn-cap">stride 1 · window starts (blue) → 4×4 output</div>
                {grid(1, "s1")}
              </div>
              <div className="cnn-arrow">vs</div>
              <div>
                <div className="cnn-cap">stride 2 · fewer starts → 2×2 output</div>
                {grid(2, "s2")}
              </div>
            </div>
            <div className="tf-legend">
              {[["Stride 1","window at every position — maximum detail, largest output. The default in early layers."],
                ["Stride 2+","skips positions — halves (or more) the output size, cuts compute, adds a little invariance. Often replaces pooling in modern nets."],
                ["Trade-off","bigger stride = smaller, cheaper maps but coarser detail. Choose based on how much spatial resolution the task needs."]].map((r) => (
                <div className="tf-leg" key={r[0]}><div className="tf-leg-name">{r[0]}</div><div className="tf-leg-desc">{r[1]}</div></div>
              ))}
            </div>
            <Note>Padding and stride together set the output size: out = ⌊(N + 2·pad − K)/stride⌋ + 1.
              They're the main knobs for controlling a conv layer's shape and cost.</Note>
          </>
        );
      },
    },
    {
      id: "relu", group: "Forward pass", title: "4 · ReLU on the feature map", map: "ReLU",
      why: "Just like in a dense net, a non-linearity lets the network keep only meaningful (positive) activations and stack depth without collapsing.",
      render: (t) => {
        const out = t.conv.length;
        return (
          <>
            <Lead>
              Apply <b>ReLU</b> = max(0, x) to every cell. Negative responses (edges in the wrong
              direction) become 0; positive matches stay. The feature map now shows only "this
              pattern is present here".
            </Lead>
            <Formula label="activation"><V>act</V> = max(0, <V>feature map</V>)</Formula>
            <Row>
              <Matrix data={t.conv} rowLabels={cols(out, "r")} colLabels={cols(out, "c")} caption="feature map" sub="pre-ReLU" />
              <Arrow label="ReLU" />
              <Matrix data={t.act} rowLabels={cols(out, "r")} colLabels={cols(out, "c")} caption="act" sub="after ReLU (4×4)" accent
                cellTip={(i, j, v) => (<div><div className="tf-tip-title">max(0, {fmt(t.conv[i][j])})</div><div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>)} />
            </Row>
            <Note>Brighter cells = stronger detected edge.</Note>
          </>
        );
      },
    },
    {
      id: "pool", group: "Forward pass", title: "5 · Max pooling", map: "Pooling",
      why: "Pooling shrinks the map and adds a little position-invariance: it keeps the strongest response in each block, so the network cares that a pattern exists, not its exact pixel.",
      render: (t) => (
        <>
          <Lead>
            <b>Max pooling</b> slides a <b>2×2</b> window (no overlap) and keeps only the
            <b> largest</b> value in each block, turning the 4×4 map into <b>2×2</b>. This halves
            the size and makes the detection robust to small shifts.
          </Lead>
          <Formula label="max-pool"><V>pooled</V><Sub>ij</Sub> = max of the 2×2 block</Formula>
          <Row>
            <Matrix data={t.act} rowLabels={cols(4, "r")} colLabels={cols(4, "c")} caption="act" sub="4×4" />
            <Arrow label="max 2×2" />
            <Matrix data={t.pool} rowLabels={cols(2, "r")} colLabels={cols(2, "c")} caption="pooled" sub="2×2" accent
              cellTip={(i, j, v) => { const vals = [t.act[2*i][2*j], t.act[2*i][2*j+1], t.act[2*i+1][2*j], t.act[2*i+1][2*j+1]];
                return (<div><div className="tf-tip-title">max of 2×2 block</div>
                  <div className="tf-tip-calc">{vals.map((x, k) => <span key={k} className="tf-term"><span className="tf-fac">{fmt(x)}</span></span>)}</div>
                  <div className="tf-tip-sum tf-tip-eq">max = {fmt(v)}</div></div>); }} />
          </Row>
          <Note>Average pooling (the mean instead of max) is the other common choice. Pooling has
            <b> no learned weights</b> — it's a fixed shrink operation.</Note>
        </>
      ),
    },
    {
      id: "stack", group: "Going deeper", title: "6 · Stacking conv layers", map: "Deep CNN",
      why: "One conv layer only sees tiny 3×3 patches. Real CNNs stack many conv→ReLU→pool blocks so later layers combine simple features into complex ones — edges → shapes → objects.",
      render: (t) => (
        <>
          <Lead>
            A single conv layer detects only the smallest patterns (a 3×3 patch). Real CNNs
            <b> stack many blocks</b> — each block is <b>conv → ReLU → pool</b> — and the output of
            one block is the input to the next. Because each layer looks at the <i>previous</i>
            layer's features, the network builds a <b>hierarchy</b>.
          </Lead>
          <Formula label="one block, repeated">block(x) = pool( ReLU( conv(x) ) ),&nbsp;&nbsp;stack ℓ = 1…N</Formula>
          <window.CNNArchViz />
          <div className="tf-subhead">Why depth matters in a CNN</div>
          <div className="tf-legend">
            {[["Growing receptive field","each layer's neurons see a wider area of the original image, so deep layers can recognise large structures."],
              ["Feature hierarchy","layer 1 finds edges; layer 2 combines edges into corners/textures; deeper layers into shapes, then whole objects."],
              ["More filters deeper","early layers use few filters (simple patterns); deeper layers use many (hundreds) to capture rich combinations."],
              ["Spatial shrinks, depth grows","pooling/stride shrink height×width while the channel count rises — the volume gets 'taller and thinner'."]].map((r) => (
              <div className="tf-leg" key={r[0]}><div className="tf-leg-name">{r[0]}</div><div className="tf-leg-desc">{r[1]}</div></div>
            ))}
          </div>
          <Note>Classic CNNs (LeNet, AlexNet, VGG, ResNet) are just many of these blocks stacked,
            ending in fully-connected layers. Our toy shows one block; the mechanism is identical.</Note>
        </>
      ),
    },
    {
      id: "ffn", group: "Output", title: "7 · Flatten → FFN classifier head", map: "FFN head",
      why: "After the conv blocks have extracted features, a fully-connected feed-forward network (the same ANN you saw) turns those features into a class decision.",
      render: (t) => {
        const max = Math.max(...t.p);
        return (
          <>
            <Lead>
              The conv blocks are the <b>feature extractor</b>. To classify, we <b>flatten</b> the
              final feature map into a vector and feed it through a <b>fully-connected
              feed-forward network</b> (FFN) — literally the ANN from the earlier explainer:
              dense layer(s) + softmax. (Real CNNs often have one or two hidden FFN layers; our toy
              goes straight to the output.)
            </Lead>
            <Formula label="classifier head">P = softmax( flatten(pooled) · <V>W_ffn</V> + <V>b</V> )</Formula>
            <Row>
              <Matrix data={t.pool} rowLabels={cols(2, "r")} colLabels={cols(2, "c")} caption="pooled" sub="2×2" />
              <Arrow label="flatten" />
              <Matrix data={[t.flat]} rowLabels={["flat"]} colLabels={cols(4, "f")} caption="flatten" sub="1×4 vector" />
              <Arrow label="×W+b" />
              <Matrix data={[t.z]} rowLabels={["z"]} colLabels={C.labels} caption="z" sub="logits" accent
                cellTip={(i, j, v) => (<DotTip title={`z[${C.labels[j]}]`} terms={[...t.flat.map((a, k) => ({ a, b: C.Wd[k][j] })), { a: C.bd[j], b: 1 }]} result={v} />)} />
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
            <Note icon="!">Switch the preset to "Horizontal edge" — this vertical-edge kernel barely
              responds, so the prediction weakens. The whole forward pass: pixels → conv features →
              FFN → class. Next: how the kernel weights are learned.</Note>
          </>
        );
      },
    },
    {
      id: "backprop", group: "Training", title: "8 · Backprop — how the kernels learn", map: "Backprop",
      why: "The kernels and FFN weights start random; training learns them. Gradients flow backwards through the FFN, pooling and convolution — and because a kernel is shared across positions, its gradient sums over the whole image.",
      render: (t) => (
        <>
          <Lead>
            Everything so far used fixed weights. <b>Training</b> learns them with the same
            <b> loss → backprop → gradient descent</b> loop as the ANN. The error flows
            <b> backward</b> through every layer; here's how it passes each CNN-specific step:
          </Lead>
          <div className="cnn-back">
            <div className="cnn-back-step"><span className="cnn-back-n">1</span><div><b>Loss &amp; FFN</b> — cross-entropy gives ∂L/∂z = P − y at the output; standard dense backprop finds the FFN weight gradients (exactly the ANN explainer's step 8).</div></div>
            <div className="cnn-back-step"><span className="cnn-back-n">2</span><div><b>Through flatten</b> — just reshape the gradient vector back into the 2×2 feature-map shape. No math, only re-arranging.</div></div>
            <div className="cnn-back-step"><span className="cnn-back-n">3</span><div><b>Through max-pool</b> — the gradient is <b>routed only to the pixel that was the max</b> in each 2×2 block (the others contributed nothing, so they get 0). Pooling has no weights to update.</div></div>
            <div className="cnn-back-step"><span className="cnn-back-n">4</span><div><b>Through ReLU</b> — multiply by ReLU′: pass the gradient where the feature map was &gt; 0, zero it elsewhere.</div></div>
            <div className="cnn-back-step"><span className="cnn-back-n">5</span><div><b>Through convolution</b> — the kernel's gradient is itself a <b>convolution</b> of the input with the incoming gradient. Because the <b>same kernel was used at every position</b>, its gradient is the <b>sum</b> of contributions from all positions.</div></div>
          </div>
          <Formula label="shared-weight gradient">∂L/∂K<Sub>a,b</Sub> = Σ<Sub>all positions (i,j)</Sub> image<Sub>i+a,j+b</Sub> · ∂L/∂fm<Sub>i,j</Sub></Formula>
          <div className="tf-subhead">Then the same update as everywhere</div>
          <Formula label="gradient descent"><V>K</V> ← K − η·∂L/∂K&nbsp;&nbsp;·&nbsp;&nbsp;<V>W_ffn</V> ← W − η·∂L/∂W</Formula>
          <Note icon="!">Key CNN insight: <b>weight sharing</b> means one kernel gets gradient signal
            from the <i>whole</i> image at once, so it learns a general pattern detector. Our toy
            kernel is hand-set; a trained CNN discovers these filters automatically. The full loop —
            forward, loss, backprop, update — repeated over many images is how a CNN learns to see.</Note>
        </>
      ),
    },
  ];

  window.NN_STAGES = STAGES;
  window.NN_META = {
    title: "Convolutional Network (CNN)", subtitle: "how a CNN sees patterns in an image",
    cur: "CNN", run: window.NN.runCNN, default: window.NN.CNN.default, renderInput,
  };
})();
