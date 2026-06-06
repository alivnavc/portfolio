/* ============================================================
   ENCODER–DECODER stage list (original Transformer / T5 / BART).
   Encoder steps reuse the shared decoder renders against the
   encoder sub-trace (t.encTrace). Decoder + cross-attention are
   custom because the data flow (two sequences) is different.
   Requires stages-a.jsx, stages-b.jsx, engine-encdec.js loaded.
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, DotTip, Lead, Note, Row, Arrow, Tag, fmt, HeadCol } = window;
  const C = window.TF_CONFIG;
  const dimCols = (n) => Array.from({ length: n }, (_, i) => "d" + i);
  const slice = window.TFEngine.sliceCols;

  const byId = {};
  window.STAGES_A.concat(window.STAGES_B).forEach((s) => { byId[s.id] = s; });
  // reuse a shared stage, rendering it against the ENCODER sub-trace
  const enc = (id, title, map) => ({ ...byId[id], id: "enc_" + id, group: "Encoder", title, map, heads: false,
    render: (t, ctx) => byId[id].render(t.encTrace, ctx) });

  const mmTip = (A, B, name, scaleLabel) => (i, j, v) => (
    <DotTip title={name} terms={A[i].map((a, k) => ({ a, b: B[k][j] }))} scaleLabel={scaleLabel} result={v} />
  );

  /* ---------- 0 · overview ---------- */
  const overview = {
    id: "overview", group: "Overview", title: "The whole architecture, at a glance",
    map: "Architecture",
    why: "Two stacks working together: an encoder that reads the input, and a decoder that writes the output while looking back at the encoder through a new sublayer — cross-attention.",
    render: (t) => {
      const sym = (s) => <span className="tf-sym">{s}</span>;
      const act = [
        ["mem", "encoder memory", `${t.srcTokens.length}×${C.dModel}`, "the encoder's final vectors — the decoder reads these"],
        ["Q_dec", "decoder queries", `${t.tgtTokens.length}×${C.dHead}`, "from the output-so-far · used to query the encoder"],
        ["K,V_enc", "encoder keys/values", `${t.srcTokens.length}×${C.dHead}`, "from the memory · what the decoder attends over"],
        ["A_cross", "cross-attention", `${t.tgtTokens.length}×${t.srcTokens.length}`, "which SOURCE word each TARGET word looks at (alignment)"],
        ["logits / P", "next target token", `1×${window.TF_VOCAB.length}`, "decoder predicts the next output word"],
      ];
      const wts = [
        ["E, PE", "embeddings", "—", "shared lookups for both source & target"],
        ["Wq / Wk / Wv / Wₒ", "attention weights", `${C.dModel}×${C.dHead}`, "used in encoder self-attn, decoder self-attn AND cross-attn"],
        ["W₁,b₁ / W₂,b₂", "FFN", `${C.dModel}×${C.dFF}`, "in every block of both stacks"],
        ["W_vocab", "unembedding", `${C.dModel}×${window.TF_VOCAB.length}`, "decoder vector → next-word scores"],
      ];
      return (
        <>
          <Lead>
            An <b>encoder–decoder</b> transformer (the original 2017 design; T5, BART, most
            translation models) is built for turning <i>one</i> sequence into <i>another</i> —
            translate, summarise, answer. The <b>encoder</b> reads the whole input into memory;
            the <b>decoder</b> generates the output token-by-token, and at each step it
            <b> looks back</b> at that memory through a <b>cross-attention</b> sublayer.
          </Lead>

          <div className="tf-archwrap">
            <div className="tf-arch2">
              <div className="tf-arch tf-arch--half">
                <div className="tf-arch-io">source: “{t.srcTokens.join(" ")}”<span>input sentence</span></div>
                <div className="tf-arch-f"><b>embed + position</b></div>
                <div className="tf-arch-block">
                  <div className="tf-arch-bh">Encoder block ×{sym("N")}</div>
                  <div className="tf-arch-sub"><div className="tf-arch-subh">Bidirectional Self-Attention</div><div className="tf-arch-line">no mask · sees all source</div></div>
                  <div className="tf-arch-norm">Add &amp; Norm</div>
                  <div className="tf-arch-sub"><div className="tf-arch-subh">Feed-Forward</div></div>
                  <div className="tf-arch-norm">Add &amp; Norm</div>
                </div>
                <div className="tf-arch-io tf-arch-io--mem">memory {sym("mem")}<span>K,V for cross-attn ▸</span></div>
              </div>

              <div className="tf-arch tf-arch--half">
                <div className="tf-arch-io">target: “{t.tgtTokens.join(" ")} …”<span>output so far</span></div>
                <div className="tf-arch-f"><b>embed + position</b></div>
                <div className="tf-arch-block">
                  <div className="tf-arch-bh">Decoder block ×{sym("N")}</div>
                  <div className="tf-arch-sub"><div className="tf-arch-subh">Masked Self-Attention</div><div className="tf-arch-line">causal · sees output so far</div></div>
                  <div className="tf-arch-norm">Add &amp; Norm</div>
                  <div className="tf-arch-sub is-cross"><div className="tf-arch-subh">◂ CROSS-Attention</div><div className="tf-arch-line">Q from decoder · K,V from memory</div></div>
                  <div className="tf-arch-norm">Add &amp; Norm</div>
                  <div className="tf-arch-sub"><div className="tf-arch-subh">Feed-Forward</div></div>
                  <div className="tf-arch-norm">Add &amp; Norm</div>
                </div>
                <div className="tf-arch-io tf-arch-io--out">{sym("logits")} → next target word ↻</div>
              </div>
            </div>
          </div>

          <div className="tf-subhead">What's new vs. a decoder-only model</div>
          <div className="tf-lifecycle">
            <div className="tf-life tf-life--train">
              <div className="tf-life-h"><span>+</span> A third sublayer: cross-attention</div>
              <p>Each decoder block has <b>three</b> sublayers, not two: masked self-attention, then
                <b> cross-attention</b> (queries from the decoder, keys &amp; values from the encoder
                memory), then the FFN — each wrapped in Add &amp; Norm.</p>
            </div>
            <div className="tf-life tf-life--infer">
              <div className="tf-life-h"><span>2</span> Two sequences, two roles</div>
              <p>The <b>encoder</b> understands the <i>source</i> bidirectionally; the <b>decoder</b>
                generates the <i>target</i> causally while conditioning on the source. Edit either
                sentence in the top bar.</p>
            </div>
          </div>
          <Note>Real examples: the <b>original Transformer</b> (translation), <b>T5</b>,
            <b> BART</b>, Whisper. Decoder-only GPTs dropped the encoder; encoder-only BERT dropped
            the decoder — this is the full design both came from.</Note>

          <div className="tf-subhead">Symbol key — the new pieces</div>
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
          <Note>Next → walk the encoder (E1–E4), then the decoder (D1–D5). The shared attention/FFN
            math is the same you saw before — the <b>cross-attention</b> step (D3) is the new idea.</Note>
        </>
      );
    },
  };

  /* ---------- E4 · encoder output → memory ---------- */
  const memory = {
    id: "enc_memory", group: "Encoder", title: "E4 · Encoder output → memory",
    map: "Memory",
    why: "The encoder's job ends here: it produces one context vector per SOURCE token. This bundle of vectors — the 'memory' — is handed to every decoder block for cross-attention.",
    render: (t) => (
      <>
        <Lead>
          After its blocks, the encoder outputs one contextual vector per <b>source</b> token. We
          call this the <b>memory</b>. It's computed <i>once</i> and then reused by the decoder at
          every generation step — the decoder never re-reads the raw source, only this memory.
        </Lead>
        <Formula label="memory">
          <V>mem</V> = Encoder(source)&nbsp;&nbsp;— {t.srcTokens.length} vectors of width {C.dModel}
        </Formula>
        <Row>
          <Matrix data={t.memory} rowLabels={t.srcTokens} colLabels={dimCols(C.dModel)} caption="mem" sub="encoder memory · K,V source for cross-attn" accent />
        </Row>
        <Note>Keep this in mind: in the cross-attention step the decoder's queries will be compared
          against <b>these</b> rows. Edit the <b>source</b> sentence up top and this memory changes.</Note>
      </>
    ),
  };

  /* ---------- D1 · target input ---------- */
  const decInput = {
    id: "dec_input", group: "Decoder", title: "D1 · Target input (output so far)",
    map: "Target in",
    why: "The decoder is given the output produced so far (during training, the correct previous words). It embeds them and adds positions, exactly like the encoder did for the source.",
    render: (t) => (
      <>
        <Lead>
          The decoder's input is the <b>target sequence so far</b> — here “{t.tgtTokens.join(" ")}”.
          It is embedded and given positions just like the source was, producing the decoder's
          starting matrix.
        </Lead>
        <Formula label="decoder input">
          <V>X₀<Sup>dec</Sup></V> = Embed(target) + PE
        </Formula>
        <Row>
          <Matrix data={t.emb} rowLabels={t.tgtTokens} colLabels={dimCols(C.dModel)} caption="embed" sub="target embeddings" />
          <Arrow label="+PE" />
          <Matrix data={t.decX0} rowLabels={t.tgtTokens} colLabels={dimCols(C.dModel)} caption="X₀ᵈ" sub="decoder block input" accent />
        </Row>
        <Note>Edit the <b>target so far</b> chips in the top bar to change what the decoder has
          generated. Next it runs masked self-attention over these tokens.</Note>
      </>
    ),
  };

  /* ---------- D2 · decoder masked self-attention ---------- */
  const decSelf = {
    id: "dec_self", group: "Decoder", title: "D2 · Masked self-attention (target)",
    map: "Self-attn",
    why: "First the decoder relates the output tokens to each other — but causally, so each position only sees earlier output. This is the same masked attention as a decoder-only model.",
    render: (t) => {
      const h = t.decBlocks[0].self.heads[0];
      return (
        <>
          <Lead>
            Exactly like a GPT: the target tokens attend to each other with a <b>causal mask</b>, so
            position <i>i</i> only sees positions ≤ <i>i</i>. (Showing head 1.)
          </Lead>
          <Formula label="masked self-attention">
            <V>A</V> = softmax( mask( <V>Q·K<Sup>T</Sup></V> / √d ) ),&nbsp;&nbsp; out = <V>A·V</V>
          </Formula>
          <Row>
            <Matrix data={h.masked} rowLabels={t.tgtTokens} colLabels={t.tgtTokens} caption="S′" sub="masked scores" dimMask />
            <Arrow label="softmax" />
            <Matrix data={h.attn} rowLabels={t.tgtTokens} colLabels={t.tgtTokens} caption="A" sub="weights (causal)" heat />
            <Arrow label="·V → ·Wₒ" />
            <Matrix data={t.decBlocks[0].sNorm.out} rowLabels={t.tgtTokens} colLabels={dimCols(C.dModel)} caption="X′ᵈ" sub="after Add & Norm" accent />
          </Row>
          <Note>This is identical to the decoder-only architecture. The <b>new</b> part is next: the
            decoder now turns to look at the encoder's memory.</Note>
        </>
      );
    },
  };

  /* ---------- D3 · CROSS-ATTENTION (the star) ---------- */
  const cross = {
    id: "cross", group: "Cross-Attention", title: "D3 · Cross-attention (decoder ↔ encoder)",
    map: "Cross-attn",
    why: "This is the bridge between the two stacks. The decoder asks questions of the encoder: queries come from the target, but keys and values come from the source memory — so each output word can focus on the relevant input words.",
    render: (t) => {
      const cr = t.decBlocks[0].cross.heads[0];
      const Xq = t.decBlocks[0].sNorm.out;        // decoder queries source
      const mem = t.memory;                         // encoder keys/values source
      const Wq1 = slice(window.TF_WQ, 0, C.dHead);
      const Wk1 = slice(window.TF_WK, 0, C.dHead);
      const Wv1 = slice(window.TF_WV, 0, C.dHead);
      const scaleLabel = `÷ √${C.dHead} (=${fmt(Math.sqrt(C.dHead))})`;
      return (
        <>
          <Lead>
            In self-attention, Q, K and V all came from <i>one</i> sequence. <b>Cross-attention is
            the same math, but the sources differ:</b> the <b>Query</b> comes from the decoder
            (the output word asking "what do I need?"), while the <b>Key</b> and <b>Value</b> come
            from the encoder <b>memory</b> (the input offering its content). No causal mask — the
            decoder may look at the <i>whole</i> source.
          </Lead>
          <Formula label="cross-attention">
            <V>Q</V> = X<Sup>dec</Sup>·<V>W<Sub>Q</Sub></V>&nbsp;&nbsp;·&nbsp;&nbsp;
            <V>K</V> = mem·<V>W<Sub>K</Sub></V>&nbsp;&nbsp;·&nbsp;&nbsp;
            <V>V</V> = mem·<V>W<Sub>V</Sub></V>
          </Formula>
          <div className="tf-subhead">Queries from the decoder · Keys &amp; Values from the encoder</div>
          <Row>
            <Matrix data={Xq} rowLabels={t.tgtTokens} colLabels={dimCols(C.dModel)} caption="X′ᵈ" sub="decoder state (target)" />
            <Arrow label="×Wq" />
            <Matrix data={cr.Q} rowLabels={t.tgtTokens} colLabels={dimCols(C.dHead)} caption="Q" sub="from target" accent cellTip={mmTip(Xq, Wq1, "Q = X·Wq")} />
            <Matrix data={mem} rowLabels={t.srcTokens} colLabels={dimCols(C.dModel)} caption="mem" sub="encoder memory (source)" />
            <Arrow label="×Wk/Wv" />
            <Matrix data={cr.K} rowLabels={t.srcTokens} colLabels={dimCols(C.dHead)} caption="K" sub="from source" accent cellTip={mmTip(mem, Wk1, "K = mem·Wk")} />
            <Matrix data={cr.V} rowLabels={t.srcTokens} colLabels={dimCols(C.dHead)} caption="V" sub="from source" accent cellTip={mmTip(mem, Wv1, "V = mem·Wv")} />
          </Row>
          <div className="tf-subhead">Scores &amp; weights are TARGET × SOURCE — this is alignment</div>
          <Row>
            <Matrix data={cr.rawScores} rowLabels={t.tgtTokens} colLabels={t.srcTokens} caption="S" sub="rows=target, cols=source" accent
              cellTip={(i, j, v) => (
                <DotTip title={`"${t.tgtTokens[i]}" (target) → "${t.srcTokens[j]}" (source)`}
                  terms={cr.Q[i].map((q, k) => ({ a: q, b: cr.K[j][k] }))} scaleLabel={scaleLabel} result={v} />
              )} />
            <Arrow label="softmax" />
            <Matrix data={cr.attn} rowLabels={t.tgtTokens} colLabels={t.srcTokens} caption="A_cross" sub="each target word's focus over source" heat
              cellTip={(i, j, v) => {
                const row = cr.rawScores[i]; const ex = row.map((s) => Math.exp(s)); const dn = ex.reduce((a, b) => a + b, 0);
                return (<div><div className="tf-tip-title">"{t.tgtTokens[i]}" attends to "{t.srcTokens[j]}"</div><div className="tf-tip-sum">e^{fmt(row[j])} / sum {fmt(dn)}</div><div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div></div>);
              }} />
            <Arrow label="×V" />
            <Matrix data={cr.out} rowLabels={t.tgtTokens} colLabels={dimCols(C.dHead)} caption="head₁" sub="A·V (target picks up source info)" accent
              cellTip={(i, d, v) => (<DotTip title="A_cross · V" terms={cr.attn[i].map((w, j) => ({ a: w, b: cr.V[j][d] }))} result={v} />)} />
          </Row>
          <div className="tf-note" style={{ marginTop: 4 }}>
            <span className="tf-note-ic">i</span>
            <div>
              <b>Read A_cross as an alignment table.</b> Row “{t.tgtTokens[t.tgtTokens.length - 1]}”
              shows how much that output word draws from each <i>source</i> word. In a trained
              translation model this is where “cat” would light up over “chat” — it's literally the
              model deciding which input words matter for the word it's about to produce.
            </div>
          </div>
          <Note>The heads' outputs are concatenated and projected by <V>W<Sub>O</Sub></V>, then
            Add &amp; Norm — just like self-attention. Then the FFN runs.</Note>
        </>
      );
    },
  };

  /* ---------- D4 · FFN + Add&Norm ---------- */
  const decFFN = {
    id: "dec_ffn", group: "Decoder", title: "D4 · Feed-forward + Add & Norm",
    map: "FFN",
    why: "The last sublayer of the decoder block processes each position on its own, same as everywhere else, then Add & Norm finishes the block.",
    render: (t) => {
      const b = t.decBlocks[0];
      return (
        <>
          <Lead>
            After cross-attention, the same position-wise <b>feed-forward network</b> runs, followed
            by Add &amp; Norm. That completes one decoder block; with {C.nBlocks} blocks the output
            then heads to the prediction layer.
          </Lead>
          <Formula label="FFN">
            <V>F</V> = ReLU( X·<V>W₁</V> + <V>b₁</V> )·<V>W₂</V> + <V>b₂</V>
          </Formula>
          <Row>
            <Matrix data={b.cNorm.out} rowLabels={t.tgtTokens} colLabels={dimCols(C.dModel)} caption="X (after cross)" sub="input" />
            <Arrow label="FFN" />
            <Matrix data={b.ffn.ff2} rowLabels={t.tgtTokens} colLabels={dimCols(C.dModel)} caption="F" sub="ffn out" />
            <Arrow label="Add&Norm" />
            <Matrix data={b.out} rowLabels={t.tgtTokens} colLabels={dimCols(C.dModel)} caption="Xᵈ₁" sub="decoder block output" accent />
          </Row>
          <Note>Each decoder block = <b>self-attn → cross-attn → FFN</b>, every sublayer wrapped in
            Add &amp; Norm. Stack {C.nBlocks} of them, then predict.</Note>
        </>
      );
    },
  };

  /* ---------- D5 · predict next target token ---------- */
  const decOut = {
    id: "dec_out", group: "Output", title: "D5 · Predict the next target token",
    map: "Predict",
    why: "Just like a decoder-only model: take the last target position, project to the vocabulary, softmax, and read off the next output word — then append it and repeat.",
    render: (t) => {
      const ranked = t.probs.map((p, id) => ({ id, p, w: window.TF_VOCAB[id] })).sort((a, b) => b.p - a.p);
      const max = ranked[0].p;
      return (
        <>
          <Lead>
            The decoder predicts the next <b>target</b> token from its last position — but unlike a
            GPT, this prediction was shaped by the <b>source</b> through cross-attention. We project
            to the vocabulary, softmax, pick a word, append it, and run the decoder again.
          </Lead>
          <Formula label="next target token">
            P(next) = softmax( <V>x<Sub>last</Sub><Sup>dec</Sup></V> · <V>W<Sub>vocab</Sub></V> )
          </Formula>
          <Row>
            <Matrix data={[t.finalNorm.out[t.lastIdx]]} rowLabels={[t.tgtTokens[t.lastIdx]]} colLabels={dimCols(C.dModel)} caption="x_last" sub="last target vector" />
            <Arrow label="×W_vocab" />
            <Matrix data={[t.logits]} rowLabels={["logit"]} colLabels={window.TF_VOCAB} caption="logits" sub="per word" accent
              cellTip={(i, j, v) => (<DotTip title={`logit "${window.TF_VOCAB[j]}"`} terms={t.finalNorm.out[t.lastIdx].map((a, k) => ({ a, b: window.TF_WVOCAB[k][j] }))} result={v} />)} />
          </Row>
          <div className="tf-probs">
            {ranked.map((r) => (
              <div className={"tf-prob" + (r.id === t.predId ? " is-top" : "")} key={r.id}>
                <span className="tf-prob-word">{r.w}</span>
                <div className="tf-prob-track"><div className="tf-prob-fill" style={{ width: (r.p / max * 100) + "%" }} /></div>
                <span className="tf-prob-val">{(r.p * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div className="tf-predict-out">
            <span>source</span>
            <b className="tf-predict-prompt">{t.srcTokens.join(" ")}</b>
            <span className="tf-predict-arrow">⇒</span>
            <b className="tf-predict-prompt">{t.tgtTokens.join(" ")}</b>
            <span className="tf-predict-arrow">→</span>
            <b className="tf-predict-next">{window.TF_VOCAB[t.predId]}</b>
          </div>
          <Note icon="!">Append the new word to the target and the decoder runs again — re-using the
            <b> same encoder memory</b> each time (the source is read only once). That's how
            translation/summarisation models generate, conditioned on the input. Untrained toy, so
            picks are arbitrary; the machinery is exact.</Note>
        </>
      );
    },
  };

  window.TF_STAGES = [
    overview,
    enc("posenc", "E1 · Source embedding + position", "Source in"),
    enc("qkv", "E2 · Encoder self-attention Q/K/V", "Enc Q·K·V"),
    enc("softmax", "E3 · Encoder attention (bidirectional)", "Enc attn"),
    memory,
    decInput, decSelf, cross, decFFN, decOut,
  ];
})();
