/* ============================================================
   ENCODER-ONLY stage list (BERT-style).
   Reuses the shared decoder stages for the identical machinery
   (tokenize → embed → position → Q/K/V → scores → softmax →
   A·V → concat → Add&Norm → FFN → Add&Norm → stack) and swaps
   in encoder-specific Overview, bidirectional-attention, and
   output (contextual / MLM / classification) stages.
   Requires stages-a.jsx + stages-b.jsx loaded first.
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, DotTip, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const C = window.TF_CONFIG;
  const tokLabels = (t) => t.tokens;
  const dimCols = (n) => Array.from({ length: n }, (_, i) => "d" + i);

  const byId = {};
  window.STAGES_A.concat(window.STAGES_B).forEach((s) => { byId[s.id] = s; });

  /* ---------- 0 · encoder overview ---------- */
  const overview = {
    id: "overview", group: "Overview", title: "The whole architecture, at a glance",
    map: "Architecture",
    why: "An encoder reads the entire sentence at once to build deep understanding — it never generates text left-to-right. Here's the full picture and a key to every symbol.",
    render: (t) => {
      const sym = (s) => <span className="tf-sym">{s}</span>;
      const act = [
        ["X", "token embeddings", `${t.tokens.length}×${C.dModel}`, "each token's first vector, looked up from E"],
        ["PE", "positional encoding", `${t.tokens.length}×${C.dModel}`, "sine/cosine signal that encodes position"],
        ["X₀", "block input", `${t.tokens.length}×${C.dModel}`, "X + PE — what enters the first block"],
        ["Q / K / V", "query · key · value", `${t.tokens.length}×${C.dHead}`, "three views of each token · X·Wq, X·Wk, X·Wv"],
        ["S", "attention scores", `${t.tokens.length}×${t.tokens.length}`, "Q·Kᵀ / √d_head — query-key similarity"],
        ["A", "attention weights", `${t.tokens.length}×${t.tokens.length}`, "softmax(S) — NO causal mask, fully bidirectional"],
        ["Z", "attention output", `${t.tokens.length}×${C.dModel}`, "heads merged · concat(heads)·Wo"],
        ["h / F", "FFN hidden / out", `${t.tokens.length}×${C.dFF}`, "ReLU(X′·W₁+b₁) then ·W₂+b₂"],
        ["Xₗ", "contextual vectors", `${t.tokens.length}×${C.dModel}`, "the encoder's product: one context-aware vector per token"],
      ];
      const wts = [
        ["E", "embedding table", `${window.TF_VOCAB.length}×${C.dModel}`, "token id → vector lookup"],
        ["Wq / Wk / Wv", "attention projections", `${C.dModel}×${C.dHead}`, "build Query, Key, Value (per head)"],
        ["Wₒ", "output projection", `${C.dModel}×${C.dModel}`, "mixes the heads back together"],
        ["W₁,b₁ / W₂,b₂", "FFN layers", `${C.dModel}×${C.dFF}`, "expand then shrink each vector"],
        ["W_vocab / W_cls", "task heads", `${C.dModel}×…`, "read the vectors: predict a word (MLM) or a class"],
      ];
      return (
        <>
          <Lead>
            An <b>encoder-only</b> transformer (the BERT family) turns a sentence into a stack of
            <b> context-aware vectors</b> — one per token — that capture meaning using the
            <i> whole</i> sentence at once. It is built for <b>understanding</b>, not generation:
            classification, search, named-entity tagging, sentence embeddings.
          </Lead>

          <div className="tf-archwrap">
            <div className="tf-arch">
              <div className="tf-arch-io">“the cat sat on …”<span>input text (seen all at once)</span></div>
              <div className="tf-arch-f"><b>tokenize → embed</b> {sym("E")} → {sym("X")}</div>
              <div className="tf-arch-row">{sym("X")} + {sym("PE")} = {sym("X₀")}</div>
              <div className="tf-arch-block">
                <div className="tf-arch-bh">Encoder block &nbsp;×&nbsp; {sym("N")}</div>
                <div className="tf-arch-sub">
                  <div className="tf-arch-subh">Bidirectional Multi-Head Self-Attention · NO mask</div>
                  <div className="tf-arch-line">{sym("Q")}=X·{sym("Wq")} &nbsp; {sym("K")}=X·{sym("Wk")} &nbsp; {sym("V")}=X·{sym("Wv")}</div>
                  <div className="tf-arch-line">{sym("S")}=Q·Kᵀ/√d &nbsp;→&nbsp; {sym("A")}=softmax(S) &nbsp;→&nbsp; A·V → ·{sym("Wₒ")} = {sym("Z")}</div>
                </div>
                <div className="tf-arch-norm">Add &amp; Norm</div>
                <div className="tf-arch-sub">
                  <div className="tf-arch-subh">Feed-Forward Network</div>
                  <div className="tf-arch-line">{sym("F")} = ReLU(X′·{sym("W₁")}+{sym("b₁")})·{sym("W₂")}+{sym("b₂")}</div>
                </div>
                <div className="tf-arch-norm">Add &amp; Norm = {sym("Xₗ")}</div>
              </div>
              <div className="tf-arch-io tf-arch-io--out">contextual vectors {sym("Xₗ")}<span>→ task head: MLM / [CLS] classify</span></div>
            </div>
          </div>

          <div className="tf-subhead">How it differs from a decoder</div>
          <div className="tf-lifecycle">
            <div className="tf-life tf-life--train">
              <div className="tf-life-h"><span>↔</span> Bidirectional attention</div>
              <p>Every token attends to <b>all</b> tokens — left <i>and</i> right. There is
                <b> no causal mask</b>, so each word is understood with full context (great for
                meaning, impossible for left-to-right generation).</p>
            </div>
            <div className="tf-life tf-life--infer">
              <div className="tf-life-h"><span>1×</span> One forward pass, no loop</div>
              <p>A decoder loops to generate word-by-word. An encoder runs <b>once</b> and hands
                back all the vectors. What you do with them is up to the <b>task head</b>.</p>
            </div>
          </div>
          <Note>Real examples: <b>BERT, RoBERTa, DeBERTa</b>. Pretrained by <b>masked-language
            modelling</b> (step 15), then fine-tuned with a small head for classification, NER,
            retrieval, etc.</Note>

          <div className="tf-subhead">Symbol key — values the model <i>computes</i></div>
          <div className="tf-legend">
            {act.map((r) => (
              <div className="tf-leg" key={r[0]}>
                <div className="tf-leg-top"><span className="tf-sym">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>
          <div className="tf-subhead">Symbol key — weights the model <i>learns</i></div>
          <div className="tf-legend">
            {wts.map((r) => (
              <div className="tf-leg is-learned" key={r[0]}>
                <div className="tf-leg-top"><span className="tf-sym is-learned">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                <div className="tf-leg-name">{r[1]}</div>
                <div className="tf-leg-desc">{r[3]}</div>
              </div>
            ))}
          </div>
          <Note>Press <b>Next →</b> to walk each stage with live, hoverable numbers. The attention,
            FFN and Add&amp;Norm machinery is <i>identical</i> to a decoder — only the mask and the
            output head change.</Note>
        </>
      );
    },
  };

  /* ---------- 6 · bidirectional (no mask) ---------- */
  const bidir = {
    id: "mask", group: "Self-Attention", title: "6 · No causal mask (bidirectional)",
    map: "Bidirectional",
    why: "This single choice is what separates an encoder from a decoder. By NOT masking, every token may look both left and right, so it understands each word using the whole sentence.",
    render: (t, ctx) => {
      const hv = ctx.headView;
      const both = hv === "both";
      const head = t.blocks[0].heads[both ? 0 : hv];
      return (
        <>
          <Lead>
            A decoder blanks out the upper triangle of the score grid so a token can't see the
            future. An <b>encoder does not</b> — the grid stays <b>completely filled</b>. Every
            query attends to every key, so "{t.tokens[0]}" is informed by the words after it too.
          </Lead>
          <Formula label="encoder attention">
            <V>A</V> = softmax( <V>Q·K<Sup>T</Sup></V> / √d )&nbsp;&nbsp;— no <V>−∞</V>, nothing removed
          </Formula>
          {both ? (
            <Row>
              {t.blocks[0].heads.map((hd, hi) => (
                <window.HeadCol key={hi} label={"Head " + (hi + 1)} accent={hi === 0}>
                  <Matrix data={hd.attn} rowLabels={tokLabels(t)} colLabels={tokLabels(t)}
                    caption="A" sub="weights · all cells live" heat compact />
                </window.HeadCol>
              ))}
            </Row>
          ) : (
            <Row>
              <Matrix data={head.rawScores} rowLabels={tokLabels(t)} colLabels={tokLabels(t)} caption="S" sub="scores" />
              <Arrow label="softmax" />
              <Matrix data={head.attn} rowLabels={tokLabels(t)} colLabels={tokLabels(t)}
                caption="A" sub="weights · every cell used" accent heat />
            </Row>
          )}
          <div className="tf-inlinemask">
            <button className={"tf-mask" + (t.maskOn ? " is-on" : "")} onClick={() => ctx.setMaskOn && ctx.setMaskOn((m) => !m)}>
              <span className="tf-mask-led" />
              Causal mask <b>{t.maskOn ? "ON" : "OFF"}</b>
            </button>
            <span className="tf-inlinemask-hint"><b>Try it:</b> turn the mask <b>on</b> and the upper triangle blanks out — this encoder instantly behaves like a decoder. That one toggle is the whole structural difference.</span>
          </div>
          <Note>Because of this, encoders can't generate text left-to-right — but they build far
            richer per-token understanding, which is exactly what classification and search need.</Note>
        </>
      );
    },
  };

  /* ---------- 14 · contextual representations ---------- */
  const contextual = {
    id: "contextual", group: "Output", title: "14 · Contextual representations",
    map: "Context vectors",
    why: "Unlike a decoder (which keeps only the last position to predict one word), the encoder keeps ALL token vectors. Each is now a context-aware embedding — the encoder's actual product.",
    render: (t) => (
      <>
        <Lead>
          After the final block, the output is one <b>context-aware vector per token</b> — same
          shape as the input, but every number now reflects the whole sentence. The word
          "{t.tokens[t.lastIdx]}" started as a fixed lookup; here it carries meaning specific to
          <i> this</i> context. These vectors are what the encoder hands to a task.
        </Lead>
        <Formula label="encoder output">
          <V>H</V> = LayerNorm(X<Sub>N</Sub>)&nbsp;&nbsp;— {t.tokens.length} vectors, one per token
        </Formula>
        <Row>
          <Matrix data={t.X0} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="X₀" sub="before (plain embedding)" />
          <Arrow label="N blocks" />
          <Matrix data={t.finalNorm.out} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="H" sub="after (contextual)" accent />
        </Row>
        <Note>Notice how each row <i>changed</i>: the same token now has a different vector because
          it absorbed its neighbours. The next two steps show what we <b>do</b> with these vectors.</Note>
      </>
    ),
  };

  /* ---------- 15 · MLM ---------- */
  const mlm = {
    id: "mlm", group: "Output", title: "15 · Masked-language modelling (training)",
    map: "MLM head",
    why: "This is how an encoder is pretrained. Hide a word, ask the model to fill it in from both sides. Because attention is bidirectional, it can use the full surrounding context.",
    render: (t) => {
      const idx = Math.min(1, t.tokens.length - 1); // the "masked" position
      const vec = t.finalNorm.out[idx];
      const logits = window.TF_VOCAB.map((_, j) => vec.reduce((s, x, k) => s + x * window.TF_WVOCAB[k][j], 0));
      const m = Math.max(...logits);
      const exps = logits.map((l) => Math.exp(l - m));
      const denom = exps.reduce((a, b) => a + b, 0);
      const probs = exps.map((e) => e / denom);
      const ranked = window.TF_VOCAB.map((w, id) => ({ w, id, p: probs[id] })).sort((a, b) => b.p - a.p);
      const top = ranked[0].p;
      return (
        <>
          <Lead>
            During pretraining, ~15% of tokens are replaced with a special <b>[MASK]</b>. The model
            must predict the <i>original</i> word from context. Here we treat position {idx}
            ("{t.tokens[idx]}") as masked and read its contextual vector through the same
            <b> unembedding</b> matrix a decoder uses.
          </Lead>
          <Formula label="masked prediction">
            P(word) = softmax( <V>H<Sub>masked</Sub></V> · <V>W<Sub>vocab</Sub></V> )
          </Formula>
          <Row>
            <Matrix data={[vec]} rowLabels={["[MASK]"]} colLabels={dimCols(C.dModel)} caption="H_masked" sub={`context vector at pos ${idx}`} />
            <Arrow label="×W_vocab" />
            <Matrix data={[logits]} rowLabels={["logit"]} colLabels={window.TF_VOCAB} caption="logits" sub="one per word" accent
              cellTip={(i, j, v) => (
                <DotTip title={`logit for "${window.TF_VOCAB[j]}"`} terms={vec.map((a, k) => ({ a, b: window.TF_WVOCAB[k][j] }))} result={v} />
              )} />
          </Row>
          <div className="tf-probs">
            {ranked.map((r) => (
              <div className={"tf-prob" + (r.id === ranked[0].id ? " is-top" : "")} key={r.id}>
                <span className="tf-prob-word">{r.w}</span>
                <div className="tf-prob-track"><div className="tf-prob-fill" style={{ width: (r.p / top * 100) + "%" }} /></div>
                <span className="tf-prob-val">{(r.p * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <Note icon="!">Unlike a decoder's next-token softmax, this predicts a word in the
            <b> middle</b> using both sides. Our toy is untrained, so the pick is arbitrary — but the
            mechanism is exactly BERT's pretraining objective. After pretraining, MLM is usually
            dropped and the vectors are used for tasks (next step).</Note>
        </>
      );
    },
  };

  /* ---------- 16 · classification ---------- */
  const classify = {
    id: "classify", group: "Output", title: "16 · [CLS] & downstream tasks",
    map: "Classify",
    why: "In practice you rarely want word predictions — you want to USE the understanding. A tiny learned head on top of the encoder's vectors does the real job: sentiment, spam, entailment, search.",
    render: (t) => {
      const cls = t.finalNorm.out[0]; // first token acts as [CLS]
      // illustrative 2-class head: two learned directions (reuse two W_vocab columns)
      const dirs = [0, 1].map((c) => window.TF_WVOCAB.map((row) => row[c]));
      const scores = dirs.map((d) => cls.reduce((s, x, k) => s + x * d[k], 0));
      const m = Math.max(...scores);
      const ex = scores.map((s) => Math.exp(s - m));
      const den = ex.reduce((a, b) => a + b, 0);
      const probs = ex.map((e) => e / den);
      const classes = ["positive", "negative"];
      return (
        <>
          <Lead>
            A special <b>[CLS]</b> token is added at the front of every sentence; after the blocks
            its vector is a summary of the <i>whole</i> input. Feed that one vector into a small
            <b> learned classifier</b> <V>W<Sub>cls</Sub></V> and softmax to get class probabilities.
            (Here the first token stands in for [CLS].)
          </Lead>
          <Formula label="sentence classification">
            P(class) = softmax( <V>H<Sub>[CLS]</Sub></V> · <V>W<Sub>cls</Sub></V> )
          </Formula>
          <Row>
            <Matrix data={[cls]} rowLabels={["[CLS]"]} colLabels={dimCols(C.dModel)} caption="H_[CLS]" sub="sentence summary vector" />
            <Arrow label="×W_cls" />
            <Matrix data={[scores]} rowLabels={["score"]} colLabels={classes} caption="class scores" sub="2 classes (illustrative)" accent />
          </Row>
          <div className="tf-probs">
            {classes.map((c, i) => (
              <div className={"tf-prob" + (probs[i] === Math.max(...probs) ? " is-top" : "")} key={c}>
                <span className="tf-prob-word">{c}</span>
                <div className="tf-prob-track"><div className="tf-prob-fill" style={{ width: (probs[i] / Math.max(...probs) * 100) + "%" }} /></div>
                <span className="tf-prob-val">{(probs[i] * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div className="tf-subhead">The same vectors power many tasks</div>
          <div className="tf-legend">
            <div className="tf-leg"><div className="tf-leg-name">Sentence classification</div><div className="tf-leg-desc">use the [CLS] vector → sentiment, spam, topic, entailment</div></div>
            <div className="tf-leg"><div className="tf-leg-name">Token classification (NER)</div><div className="tf-leg-desc">use <i>each</i> token's vector → person / place / org tags</div></div>
            <div className="tf-leg"><div className="tf-leg-name">Embeddings & search</div><div className="tf-leg-desc">pool the vectors into one → semantic similarity, retrieval</div></div>
            <div className="tf-leg"><div className="tf-leg-name">Question answering</div><div className="tf-leg-desc">per-token vectors → predict answer start/end spans</div></div>
          </div>
          <Note icon="!">Only the small head is trained per task; the big encoder underneath is
            shared (fine-tuned). The class scores above use a stand-in head, so they're
            illustrative — but this is exactly how BERT-style models are applied.</Note>
        </>
      );
    },
  };

  window.TF_STAGES = [
    overview,
    byId.tokenize, byId.embed, byId.posenc,
    byId.qkv, byId.scores, bidir, byId.softmax, byId.weighted, byId.concat,
    byId.addnorm1, byId.ffn, byId.addnorm2, byId.stack,
    contextual, mlm, classify,
  ];
})();
