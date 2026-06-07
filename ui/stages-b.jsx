/* ============================================================
   STAGE DEFINITIONS — part B: residual+norm, FFN, stacking, head.
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, DotTip, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const C = window.TF_CONFIG;
  const tokLabels = (t) => t.tokens;
  const dimCols = (n) => Array.from({ length: n }, (_, i) => "d" + i);
  const ffCols = (n) => Array.from({ length: n }, (_, i) => "h" + i);

  const mmTip = (A, B, name, bias) => (i, j, v) => (
    <DotTip title={name}
      terms={[...A[i].map((a, k) => ({ a, b: B[k][j] })), ...(bias ? [{ a: bias[j], b: 1 }] : [])]}
      result={v} />
  );

  /* learned-weight tooltip (shared shape with part A) */
  const wTip = (name, rowTag, colTag) => (i, j, v) => (
    <div>
      <div className="tf-tip-title">{name}[ {rowTag || "in"} {i} → {colTag || "out"} {j} ]</div>
      <div className="tf-tip-where">
        <div>A <b>learned parameter</b> — not computed from the input.</div>
        <div>Random at first, then tuned by training (gradient descent).</div>
      </div>
      <div className="tf-tip-rule" />
      <div className="tf-tip-sum tf-tip-eq">value = {fmt(v)}</div>
    </div>
  );
  const biasTip = (name) => (i, j, v) => (
    <div>
      <div className="tf-tip-title">{name}[ {j} ]</div>
      <div className="tf-tip-where"><div>A <b>learned bias</b> — added to every token's result in this column.</div></div>
      <div className="tf-tip-rule" />
      <div className="tf-tip-sum tf-tip-eq">value = {fmt(v)}</div>
    </div>
  );

  const lnTip = (res, stats, name) => (i, j, v) => {
    const s = stats[i];
    return (
      <div>
        <div className="tf-tip-title">{name} · row "{i}"</div>
        <div className="tf-tip-sum">(x {fmt(res[i][j])} − mean {fmt(s.mean)}) / std {fmt(s.std)}</div>
        <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div>
      </div>
    );
  };

  const STAGES_B = [
    {
      id: "addnorm1", group: "Block", title: "10 · Add & Norm",
      map: "Add & Norm",
      why: "Stacking dozens of layers makes signals explode or fade away. The residual \"+\" preserves the original input so nothing is lost, and LayerNorm rescales every vector to a stable size — together they're what makes deep transformers trainable at all.",
      render: (t) => {
        const b = t.blocks[0];
        return (
          <>
            <Lead>
              Two tricks that make deep networks trainable. <b>Add</b> (a residual connection)
              adds the layer's input back to its output, so information can't get lost.
              <b> Norm</b> (LayerNorm) then rescales each row to a tidy mean 0, spread 1.
            </Lead>
            <Formula label="residual + layernorm">
              <V>X′</V> = LayerNorm( <V>X</V> + <V>Z</V> )
            </Formula>
            <Row>
              <Matrix data={t.X0} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="X" sub="block input" />
              <Arrow label="+" />
              <Matrix data={b.attnProj} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="Z" sub="attention out" />
              <Arrow label="=" />
              <Matrix data={b.res1} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="X+Z" sub="residual"
                cellTip={(i, j, v) => (
                  <DotTip title="residual add" terms={[{ a: t.X0[i][j], b: 1 }, { a: b.attnProj[i][j], b: 1 }]} result={v} />
                )} />
              <Arrow label="norm" />
              <Matrix data={b.norm1.out} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="X′" sub="normalized" accent
                cellTip={lnTip(b.res1, b.norm1.stats, "LayerNorm")} />
            </Row>
            <Note>Without the residual "+", a 96-layer model would scramble its own input.
              The skip connection is why transformers can stack so deep.</Note>
          </>
        );
      },
    },
    {
      id: "ffn", group: "Block", title: "11 · Feed-forward network",
      map: "FFN (MLP)",
      why: "Attention only mixes tokens together linearly. The feed-forward network adds non-linear processing to each token on its own — it's where the model transforms features and stores most of its learned knowledge.",
      render: (t) => {
        const b = t.blocks[0];
        return (
          <>
            <Lead>
              Attention let tokens <i>share</i> information; now each token is processed on its
              own through a little 2-layer network. It expands to a wider hidden size
              (<V>d<Sub>ff</Sub></V> = {C.dFF}), applies <b>ReLU</b> (keep positives, zero the rest),
              then projects back down to width {C.dModel}.
            </Lead>
            <Formula label="position-wise MLP">
              FFN(<V>x</V>) = ReLU( <V>x·W₁</V> + <V>b₁</V> ) · <V>W₂</V> + <V>b₂</V>
            </Formula>

            <div className="tf-subhead">Where do W₁, b₁, W₂, b₂ come from?</div>
            <Lead>
              They are <b>learned parameters</b>, exactly like the attention weights — random at
              first, then tuned by <b>training</b>. <V>W₁</V> ({C.dModel}×{C.dFF}) and bias <V>b₁</V>
              {" "}form the first layer that <i>expands</i> each vector; <V>W₂</V> ({C.dFF}×{C.dModel})
              and bias <V>b₂</V> form the second layer that <i>shrinks</i> it back. A <b>bias</b> is
              just a constant added to every token, letting a unit shift its baseline. These four
              tables hold most of the model's parameters.
            </Lead>
            <Row>
              <Matrix data={window.TF_W1} rowLabels={dimCols(C.dModel)} colLabels={ffCols(C.dFF)} caption="W₁" sub={`learned · ${C.dModel}×${C.dFF}`} compact cellTip={wTip("W₁", "in d", "h")} />
              <Matrix data={[window.TF_B1]} rowLabels={["+"]} colLabels={ffCols(C.dFF)} caption="b₁" sub="learned bias" compact cellTip={biasTip("b₁")} />
            </Row>
            <Row>
              <Matrix data={window.TF_W2} rowLabels={ffCols(C.dFF)} colLabels={dimCols(C.dModel)} caption="W₂" sub={`learned · ${C.dFF}×${C.dModel}`} compact cellTip={wTip("W₂", "h", "out d")} />
              <Matrix data={[window.TF_B2]} rowLabels={["+"]} colLabels={dimCols(C.dModel)} caption="b₂" sub="learned bias" compact cellTip={biasTip("b₂")} />
            </Row>

            <div className="tf-subhead">Layer 1 — expand, then ReLU. What are h0, h1, …?</div>
            <Lead>
              Each <V>h</V> column is one <b>hidden unit</b> (a neuron). Unit <V>h<Sub>j</Sub></V> for a
              token is that token's vector dotted with column <V>j</V> of <V>W₁</V>, plus <V>b₁<Sub>j</Sub></V>
              — then passed through ReLU. With {C.dFF} units the network has {C.dFF} little
              feature-detectors per token. Hover an <V>h</V> cell to see its dot product and the ReLU.
            </Lead>
            <Row>
              <Matrix data={b.norm1.out} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="X′" sub="input (from step 10)" />
              <Arrow label="×W₁+b₁" />
              <Matrix data={b.ff1} rowLabels={tokLabels(t)} colLabels={ffCols(C.dFF)} caption="h" sub={`hidden · ReLU · ${C.dFF}-wide`} compact accent
                cellTip={(i, j, v) => (
                  <div>
                    <DotTip title={`h${j} for "${t.tokens[i]}" = x·W₁col${j} + b₁`} terms={[...b.norm1.out[i].map((a, k) => ({ a, b: window.TF_W1[k][j] })), { a: window.TF_B1[j], b: 1 }]} result={b.ff1raw[i][j]} />
                    <div className="tf-tip-sum">ReLU = max(0, {fmt(b.ff1raw[i][j])})</div>
                    <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div>
                  </div>
                )} />
            </Row>
            <div className="tf-note">
              <span className="tf-note-ic">f</span>
              <div>
                <b>Why ReLU?</b> ReLU(z) = max(0, z) — it keeps positive values and zeros out
                negatives. Without a non-linear function here, stacking two matrix multiplies
                (W₁ then W₂) would collapse into a <i>single</i> linear map and the extra layer would
                add nothing. ReLU bends the function so the network can learn curves, not just lines.
                It's used over alternatives (sigmoid, tanh) because it's <b>cheap</b>, doesn't
                saturate for large inputs, and keeps gradients flowing — though modern LLMs often
                swap in smooth cousins like <b>GELU</b> or <b>SwiGLU</b> for a small quality gain.
              </div>
            </div>

            <div className="tf-subhead">Layer 2 — project back down to width {C.dModel}</div>
            <Row>
              <Matrix data={b.ff1} rowLabels={tokLabels(t)} colLabels={ffCols(C.dFF)} caption="h" sub="hidden" compact />
              <Arrow label="×W₂+b₂" />
              <Matrix data={b.ff2} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="F" sub="FFN out" accent
                cellTip={mmTip(b.ff1, window.TF_W2, "F = h·W₂ + b₂", window.TF_B2)} />
            </Row>
            <Note>The FFN runs <b>independently</b> on each token (same weights for every row),
              and is where most of a transformer's parameters — and much of its stored
              "knowledge" — actually live.</Note>
          </>
        );
      },
    },
    {
      id: "addnorm2", group: "Block", title: "12 · Add & Norm (again)",
      map: "Add & Norm",
      why: "The same stabilisers wrapped around the feed-forward layer. After this the block is finished: it takes a vector per token in and returns a same-shaped but richer vector out.",
      render: (t) => {
        const b = t.blocks[0];
        return (
          <>
            <Lead>
              Same trick as before, around the feed-forward layer. Add its input back, then
              LayerNorm. This produces the <b>output of one full transformer block</b>.
            </Lead>
            <Formula label="residual + layernorm">
              <V>X″</V> = LayerNorm( <V>X′</V> + <V>F</V> )
            </Formula>
            <Row>
              <Matrix data={b.norm1.out} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="X′" sub="attn output" />
              <Arrow label="+" />
              <Matrix data={b.ff2} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="F" sub="ffn output" />
              <Arrow label="norm" />
              <Matrix data={b.norm2.out} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="X″" sub="block output" accent
                cellTip={lnTip(b.res2, b.norm2.stats, "LayerNorm")} />
            </Row>
            <Note icon="✓">One block done. It took <V>X₀</V> and returned a same-shaped,
              richer <V>X″</V> — every token now carries context from the tokens before it.</Note>
          </>
        );
      },
    },
    {
      id: "stack", group: "Block", title: "13 · Stack N blocks",
      map: "× N blocks",
      why: "One block only captures shallow patterns. Because every block has the same shape in and out, we can repeat it — each layer builds on the last, composing simple features into abstract meaning. Depth is where capability comes from.",
      render: (t) => {
        const outs = t.blocks.map((bl) => bl.out);
        const sub = [(t.maskOn ? "Masked" : "Bidirectional") + " Multi-Head Self-Attention", "Add & Norm", "Feed-Forward Network", "Add & Norm"];
        return (
          <>
            <Lead>
              A transformer just <b>repeats the same block</b> many times, each with its own
              weights. The output of block 1 is the input to block 2, and so on. Early blocks
              learn surface patterns; deeper blocks build abstract meaning.
            </Lead>
            <Formula label="the stack">
              <V>X<Sub>ℓ+1</Sub></V> = Block<Sub>ℓ</Sub>(<V>X<Sub>ℓ</Sub></V>),  for ℓ = 0 … N−1
            </Formula>

            <div className="tf-note" style={{ marginTop: 4 }}>
              <span className="tf-note-ic">i</span>
              <div>
                <b>What is X₀ and where did it come from?</b> <V>X₀</V> is the matrix we built back in
                <b> step 3</b> — the token <b>embeddings</b> plus the <b>positional encodings</b>
                {" "}(<V>X₀ = embedding + PE</V>). It's the very first input handed to the block stack.
                The subscript is the <i>layer number</i>: X₀ enters block 1, which outputs X₁; X₁ enters
                block 2, which outputs X₂, and so on. Every <V>X<Sub>ℓ</Sub></V> has the same shape
                ({t.tokens.length}×{C.dModel}).
              </div>
            </div>

            <div className="tf-subhead">How a token's data flows through the stack</div>
            <div className="tf-stackdiag">
              <div className="tf-stk-io">
                <b>X₀</b><span>token embeddings + positions (step 3)</span>
              </div>
              {t.blocks.map((_, bi) => (
                <React.Fragment key={bi}>
                  <div className="tf-stk-flow"><span className="tf-stk-flowlbl">X{bi}</span></div>
                  <div className={"tf-stk-block" + (bi === t.blocks.length - 1 ? " is-last" : "")}>
                    <div className="tf-stk-bh">Block {bi + 1}<span>own weights</span></div>
                    <div className="tf-stk-subs">
                      {sub.map((s, si) => (
                        <div key={si} className={"tf-stk-sub" + (s === "Add & Norm" ? " is-norm" : "")}>{s}</div>
                      ))}
                    </div>
                  </div>
                </React.Fragment>
              ))}
              <div className="tf-stk-flow"><span className="tf-stk-flowlbl">X{t.blocks.length}</span></div>
              <div className="tf-stk-io tf-stk-io--out">
                <b>final hidden states</b><span>→ prediction head (step 14)</span>
              </div>
              <div className="tf-stk-loop">repeats × N · GPT-3 = 96 blocks</div>
            </div>

            <div className="tf-subhead">Why pass through many blocks?</div>
            <Lead>
              Because depth lets the model <b>compose</b>. One block can only relate tokens once; a
              second block re-attends over the <i>already-contextualised</i> vectors, so it can build
              relationships-of-relationships. Stacked up, early layers catch grammar and nearby
              words, middle layers track who-did-what, and deep layers hold abstract meaning. It
              works cleanly only because every block keeps the <b>same shape</b> in and out.
            </Lead>
            <Tag tone="head">Our toy stacks {C.nBlocks} blocks · GPT-3 stacks 96</Tag>
            <Row>
              <Matrix data={t.X0} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="X₀" sub="input (step 3)" />
              {outs.map((o, bi) => (
                <React.Fragment key={bi}>
                  <Arrow label={"block " + (bi + 1)} />
                  <Matrix data={o} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)}
                    caption={"X" + (bi + 1)} sub={"after block " + (bi + 1)} accent={bi === outs.length - 1} />
                </React.Fragment>
              ))}
            </Row>
            <Note>Same shape every time — that's exactly why blocks stack so cleanly. After the
              final block, <V>X{t.blocks.length}</V> goes to the prediction head.</Note>
          </>
        );
      },
    },
    {
      id: "logits", group: "Output", title: "14 · Project to vocabulary",
      map: "Unembed → logits",
      why: "The model has been thinking in its own internal vector space. To speak words again we project the final vector onto the whole vocabulary, scoring how well each word fits as the continuation.",
      render: (t) => {
        const finalRow = t.finalNorm.out[t.lastIdx];
        const logitsM = [t.logits];
        const allFinal = t.finalNorm.out;
        return (
          <>
            <Lead>
              After the last block, every token has a final vector. To predict the <i>next</i> word
              we use only the <b>last token's vector</b>, run it through one more LayerNorm, and
              multiply by the <b>unembedding</b> matrix to get one raw score — a <b>logit</b> — for
              every word the model knows.
            </Lead>
            <Formula label="logits">
              <V>logits</V> = LayerNorm(<V>x<Sub>last</Sub></V>) · <V>W<Sub>vocab</Sub></V>
            </Formula>

            <div className="tf-subhead">What is "the last token vector", and why that one?</div>
            <Lead>
              Each row below is one token's final {C.dModel}-number vector. Because of the
              <b> causal mask</b>, position <i>i</i> has only ever attended to positions ≤ <i>i</i> —
              so the <b>last</b> row is the only one that has absorbed the <i>whole</i> prompt. That
              makes it the right place to ask "what comes next?". We pull out that single row,
              <V> x<Sub>last</Sub></V>.
            </Lead>
            <Row>
              <Matrix data={allFinal} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)}
                caption="final states" sub="one row per token" highlight={(i) => i === t.lastIdx} />
              <Arrow label="take last row" />
              <Matrix data={[finalRow]} rowLabels={[t.tokens[t.lastIdx]]} colLabels={dimCols(C.dModel)} caption="x_last" sub={`the "${t.tokens[t.lastIdx]}" vector · 1×${C.dModel}`} accent />
            </Row>

            <div className="tf-subhead">What is the vocabulary, and where does W<sub>vocab</sub> come from?</div>
            <Lead>
              The <b>vocabulary</b> is the fixed list of every token the model can output — here our
              {" "}{window.TF_VOCAB.length} toy words, in a real model ~50,000 subwords. The
              <b> unembedding matrix</b> <V>W<Sub>vocab</Sub></V> is a <b>learned</b> table with one
              <i> column per vocabulary word</i> ({C.dModel}×{window.TF_VOCAB.length} here). Like every
              other weight it's random at first and tuned by training. Multiplying <V>x<Sub>last</Sub></V>
              by it scores how well the final vector matches each word's column.
            </Lead>
            <Row>
              <Matrix data={window.TF_WVOCAB} rowLabels={dimCols(C.dModel)} colLabels={window.TF_VOCAB}
                caption="W_vocab" sub={`learned · ${C.dModel}×${window.TF_VOCAB.length}`} compact cellTip={wTip("W_vocab", "d", "word")} />
            </Row>

            <div className="tf-subhead">Multiply: x_last · W<sub>vocab</sub> = logits</div>
            <Lead>
              A <b>logit</b> is just a raw, unbounded score (it can be negative or large) saying how
              much the model favours that word — <i>before</i> we turn it into a probability. One logit
              per word. Hover a logit to see the dot product behind it.
            </Lead>
            <Row>
              <Matrix data={[finalRow]} rowLabels={[t.tokens[t.lastIdx]]} colLabels={dimCols(C.dModel)} caption="x_last" sub="1×4" />
              <Arrow label="×W_vocab" />
              <Matrix data={logitsM} rowLabels={["logit"]} colLabels={window.TF_VOCAB}
                caption="logits" sub={`1 × ${window.TF_VOCAB.length} (one score per word)`} accent
                cellTip={(i, j, v) => (
                  <DotTip title={`logit for "${window.TF_VOCAB[j]}"`}
                    terms={finalRow.map((a, k) => ({ a, b: window.TF_WVOCAB[k][j] }))} result={v} />
                )} />
            </Row>
            <Note>High logit → the model leans toward that word. Next we turn these raw scores into
              clean probabilities with softmax.</Note>
          </>
        );
      },
    },
    {
      id: "predict", group: "Output", title: "15 · Softmax → next token",
      map: "Predict",
      why: "Scores become probabilities, we pick one word, append it to the prompt, and run the entire machine again. Repeat that loop and you get fluent text — that is, fundamentally, everything a language model does.",
      render: (t) => {
        const ranked = t.probs
          .map((p, id) => ({ id, p, w: window.TF_VOCAB[id], logit: t.logits[id] }))
          .sort((a, b) => b.p - a.p);
        const max = ranked[0].p;
        const exps = t.logits.map((l) => Math.exp(l));
        const denom = exps.reduce((a, b) => a + b, 0);
        // real toy autoregressive rollout: feed the model its own predictions
        const roll = [];
        let seq = t.tokenIds.slice();
        for (let s = 0; s < 4; s++) {
          const r = window.TFEngine.run(seq, t.maskOn);
          roll.push({ seq: seq.slice(), pred: r.predId });
          seq = [...seq, r.predId];
          if (seq.length > C.maxSeq) seq = seq.slice(seq.length - C.maxSeq);
        }
        return (
          <>
            <Lead>
              The logits are raw scores. One last <b>softmax</b> turns them into <b>probabilities</b>
              that are all positive and sum to 1 — a clean distribution over the whole vocabulary.
            </Lead>
            <Formula label="next-token distribution">
              P(next = <V>w</V>) = e<Sup>logit<Sub>w</Sub></Sup> / Σ<Sub>k</Sub> e<Sup>logit<Sub>k</Sub></Sup>
            </Formula>

            <div className="tf-subhead">How a logit becomes a probability</div>
            <Lead>
              Softmax does three things: <b>exponentiate</b> each logit (e<Sup>logit</Sup>, which makes
              everything positive and amplifies the leaders), <b>add</b> them all up, then
              <b> divide</b> each by that total so they become shares of 1 (i.e. percentages).
            </Lead>
            <div className="tf-logittable">
              <div className="tf-lt-head">
                <span>word</span><span>logit</span><span>e^logit</span><span>÷ sum {fmt(denom)}</span><span>probability</span>
              </div>
              {ranked.map((r) => (
                <div className={"tf-lt-row" + (r.id === t.predId ? " is-top" : "")} key={r.id}>
                  <span className="tf-lt-word">{r.w}</span>
                  <span className="tf-lt-num">{fmt(r.logit)}</span>
                  <span className="tf-lt-num">{fmt(Math.exp(r.logit))}</span>
                  <span className="tf-lt-bar"><span className="tf-lt-fill" style={{ width: (r.p / max * 100) + "%" }} /></span>
                  <span className="tf-lt-prob">{(r.p * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div className="tf-predict-out">
              <span>prompt</span>
              <b className="tf-predict-prompt">{t.tokens.join(" ")}</b>
              <span className="tf-predict-arrow">→</span>
              <b className="tf-predict-next">{window.TF_VOCAB[t.predId]}</b>
            </div>

            <div className="tf-subhead">But a sentence is many words — the generation loop</div>
            <Lead>
              The model only ever predicts <b>one</b> token. To write a whole sentence it
              <b> appends</b> the predicted word to the prompt and runs the <i>entire</i> pipeline
              again — steps 1→15 — to get the next word, then again, and again. This is called
              <b> autoregressive</b> generation. Below is our toy model actually feeding itself:
            </Lead>
            <div className="tf-autoreg">
              {roll.map((r, si) => (
                <div className="tf-ar-row" key={si}>
                  <span className="tf-ar-step">run {si + 1}</span>
                  <div className="tf-ar-seq">
                    {r.seq.map((id, k) => (
                      <span className="tf-ar-tok" key={k}>{window.TF_VOCAB[id]}</span>
                    ))}
                    <span className="tf-ar-arrow">→</span>
                    <span className="tf-ar-next">{window.TF_VOCAB[r.pred]}</span>
                  </div>
                </div>
              ))}
            </div>
            <Note icon="!">Each new word becomes part of the input for the next run — that loop is
              <b> all an LLM does</b>. It stops when it predicts a special "end" token. Our toy is
              <b> untrained</b> (random weights) so these picks are arbitrary; a trained model
              produces fluent, sensible text by the very same machinery.</Note>
          </>
        );
      },
    },
  ];

  window.STAGES_B = STAGES_B;
})();
