/* ============================================================
   STAGE DEFINITIONS — part A: input + masked self-attention.
   Each stage: { id, group, title, map, render(trace) }
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, DotTip, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const C = window.TF_CONFIG;
  const tokLabels = (t) => t.tokens;
  const dimCols = (n) => Array.from({ length: n }, (_, i) => "d" + i);

  /* generic matmul tooltip: result[i][j] = Σ_k A[i][k]·B[k][j] */
  const mmTip = (A, B, name, scaleLabel) => (i, j, v) => (
    <DotTip
      title={name}
      terms={A[i].map((a, k) => ({ a, b: B[k][j] }))}
      scaleLabel={scaleLabel}
      result={v}
    />
  );
  /* weighted-sum tooltip: out[i][d] = Σ_j w[i][j]·V[j][d] */
  const wsumTip = (W, Vm, name) => (i, d, v) => (
    <DotTip title={name} terms={W[i].map((w, j) => ({ a: w, b: Vm[j][d] }))} result={v} />
  );
  /* learned-weight tooltip */
  const wTip = (name) => (i, j, v) => (
    <div>
      <div className="tf-tip-title">{name}[ in d{i} → out d{j} ]</div>
      <div className="tf-tip-where">
        <div>A <b>learned parameter</b> — not computed from the input.</div>
        <div>Set by training (random at first, tuned by gradient descent).</div>
      </div>
      <div className="tf-tip-rule" />
      <div className="tf-tip-sum tf-tip-eq">value = {fmt(v)}</div>
    </div>
  );
  /* per-head weight slices */
  const slice = window.TFEngine.sliceCols;
  const headW = (h) => ({
    Wq: slice(window.TF_WQ, h * C.dHead, h * C.dHead + C.dHead),
    Wk: slice(window.TF_WK, h * C.dHead, h * C.dHead + C.dHead),
    Wv: slice(window.TF_WV, h * C.dHead, h * C.dHead + C.dHead),
  });

  const STAGES_A = [
    /* 0 — full architecture + symbol glossary */
    {
      id: "overview", group: "Overview", title: "The whole architecture, at a glance",
      map: "Architecture",
      why: "Before the step-by-step, here is the entire decoder in one picture, plus a key to every symbol used throughout. Skim it now; each piece gets its own interactive step next.",
      render: (t) => {
        const sym = (s) => <span className="tf-sym">{s}</span>;
        const act = [
          ["X", "token embeddings", `${t.tokens.length}×${C.dModel}`, "each token's first vector, looked up from E"],
          ["PE", "positional encoding", `${t.tokens.length}×${C.dModel}`, "sine/cosine signal that encodes position"],
          ["X₀", "block input", `${t.tokens.length}×${C.dModel}`, "X + PE — what enters the first block"],
          ["Q", "queries", `${t.tokens.length}×${C.dHead}`, "what each token is looking for · X·Wq"],
          ["K", "keys", `${t.tokens.length}×${C.dHead}`, "what each token offers · X·Wk"],
          ["V", "values", `${t.tokens.length}×${C.dHead}`, "what each token passes on · X·Wv"],
          ["S", "attention scores", `${t.tokens.length}×${t.tokens.length}`, "Q·Kᵀ / √d_head — query-key similarity"],
          ["A", "attention weights", `${t.tokens.length}×${t.tokens.length}`, "softmax(masked S) — mixing weights, rows sum to 1"],
          ["Z", "attention output", `${t.tokens.length}×${C.dModel}`, "heads merged · concat(heads)·Wo"],
          ["h", "FFN hidden units", `${t.tokens.length}×${C.dFF}`, "ReLU(X′·W₁ + b₁) — the neurons"],
          ["F", "FFN output", `${t.tokens.length}×${C.dModel}`, "h·W₂ + b₂"],
          ["Xₗ", "block output", `${t.tokens.length}×${C.dModel}`, "result after block ℓ (feeds the next block)"],
          ["logits", "raw word scores", `1×${window.TF_VOCAB.length}`, "x_last·W_vocab — one score per word"],
          ["P", "probabilities", `1×${window.TF_VOCAB.length}`, "softmax(logits) — the next-token distribution"],
        ];
        const wts = [
          ["E", "embedding table", `${window.TF_VOCAB.length}×${C.dModel}`, "token id → vector lookup"],
          ["Wq / Wk / Wv", "attention projections", `${C.dModel}×${C.dHead}`, "build Query, Key, Value (per head)"],
          ["Wₒ", "output projection", `${C.dModel}×${C.dModel}`, "mixes the heads back together"],
          ["W₁ , b₁", "FFN layer 1", `${C.dModel}×${C.dFF}`, "expands each vector, + bias"],
          ["W₂ , b₂", "FFN layer 2", `${C.dFF}×${C.dModel}`, "shrinks it back, + bias"],
          ["W_vocab", "unembedding", `${C.dModel}×${window.TF_VOCAB.length}`, "final vector → score per word"],
        ];
        const dims = [
          ["d_model", C.dModel, "width of every token vector"],
          ["n_heads", C.nHeads, "parallel attention heads"],
          ["d_head", C.dHead, "width per head (d_model ÷ n_heads)"],
          ["d_ff", C.dFF, "hidden width inside the FFN"],
          ["vocab", window.TF_VOCAB.length, "number of known words"],
          ["N", C.nBlocks, "number of stacked blocks"],
        ];
        return (
          <>
            <Lead>
              A decoder-only transformer is one tall pipeline: turn text into vectors, push them
              through a stack of identical <b>blocks</b> (each = masked attention + a small neural
              net), then read off the next word. Here is the full map — the steps that follow zoom
              into each box with live numbers you can hover.
            </Lead>

            <div className="tf-archwrap">
              <div className="tf-arch">
                <div className="tf-arch-io">“the cat sat on …”<span>input text</span></div>
                <div className="tf-arch-f"><b>tokenize</b></div>
                <div className="tf-arch-row">{sym("E")}<span>embedding lookup → {sym("X")}</span></div>
                <div className="tf-arch-f"><b>+ positions</b></div>
                <div className="tf-arch-row">{sym("X")} + {sym("PE")} = {sym("X₀")}</div>

                <div className="tf-arch-block">
                  <div className="tf-arch-bh">Decoder block &nbsp;×&nbsp; {sym("N")}</div>
                  <div className="tf-arch-sub">
                    <div className="tf-arch-subh">Masked Multi-Head Self-Attention</div>
                    <div className="tf-arch-line">{sym("Q")}=X·{sym("Wq")} &nbsp; {sym("K")}=X·{sym("Wk")} &nbsp; {sym("V")}=X·{sym("Wv")}</div>
                    <div className="tf-arch-line">{sym("S")} = Q·Kᵀ/√d &nbsp;→&nbsp; mask &nbsp;→&nbsp; {sym("A")} = softmax(S)</div>
                    <div className="tf-arch-line">heads: {sym("A")}·{sym("V")} &nbsp;→&nbsp; concat &nbsp;·&nbsp; {sym("Wₒ")} = {sym("Z")}</div>
                  </div>
                  <div className="tf-arch-norm">Add &amp; Norm &nbsp;(X + Z)</div>
                  <div className="tf-arch-sub">
                    <div className="tf-arch-subh">Feed-Forward Network</div>
                    <div className="tf-arch-line">{sym("h")} = ReLU(X′·{sym("W₁")} + {sym("b₁")})</div>
                    <div className="tf-arch-line">{sym("F")} = h·{sym("W₂")} + {sym("b₂")}</div>
                  </div>
                  <div className="tf-arch-norm">Add &amp; Norm &nbsp;(X′ + F) = {sym("Xₗ")}</div>
                </div>

                <div className="tf-arch-f"><b>final LayerNorm → take last row</b> {sym("x_last")}</div>
                <div className="tf-arch-row">{sym("x_last")} · {sym("W_vocab")} = {sym("logits")}</div>
                <div className="tf-arch-f"><b>softmax</b> → {sym("P")}</div>
                <div className="tf-arch-io tf-arch-io--out">next token<span>append &amp; repeat ↻</span></div>
              </div>
            </div>

            <div className="tf-subhead">Two kinds of numbers — frozen weights vs live values</div>
            <div className="tf-lifecycle">
              <div className="tf-life tf-life--train">
                <div className="tf-life-h"><span>①</span> Learned in TRAINING, then frozen</div>
                <p>Set once by training on huge amounts of text, then <b>never change</b> at
                  prediction time — these <i>are</i> the model:</p>
                <div className="tf-life-syms">{["E", "Wq", "Wk", "Wv", "Wₒ", "W₁", "b₁", "W₂", "b₂", "W_vocab"].map((s) => <span className="tf-sym is-learned" key={s}>{s}</span>)}</div>
              </div>
              <div className="tf-life tf-life--infer">
                <div className="tf-life-h"><span>②</span> Computed at PREDICTION, fresh every run</div>
                <p>Recalculated from <i>your</i> specific input each time the model runs. Change the
                  prompt and all of these change:</p>
                <div className="tf-life-syms">{["X", "PE", "X₀", "Q", "K", "V", "S", "A", "Z", "h", "F", "Xₗ", "logits", "P"].map((s) => <span className="tf-sym" key={s}>{s}</span>)}</div>
              </div>
            </div>

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

            <div className="tf-subhead">Symbol key — weights the model <i>learns</i> (trained)</div>
            <div className="tf-legend">
              {wts.map((r) => (
                <div className="tf-leg is-learned" key={r[0]}>
                  <div className="tf-leg-top"><span className="tf-sym is-learned">{r[0]}</span><span className="tf-leg-shape">{r[2]}</span></div>
                  <div className="tf-leg-name">{r[1]}</div>
                  <div className="tf-leg-desc">{r[3]}</div>
                </div>
              ))}
            </div>

            <div className="tf-subhead">Sizes used in this toy (real GPTs are far larger)</div>
            <div className="tf-dims">
              {dims.map((d) => (
                <div className="tf-dim" key={d[0]}>
                  <span className="tf-dim-k">{d[0]}</span>
                  <span className="tf-dim-v">{d[1]}</span>
                  <span className="tf-dim-d">{d[2]}</span>
                </div>
              ))}
            </div>
            <Note>Press <b>Next →</b> (or click any box in the left map) to walk through each stage
              with the real, hoverable numbers.</Note>
          </>
        );
      },
    },
    /* 0 — OVERVIEW handled by app, but keep a gentle intro stage */
    {
      id: "tokenize", group: "Input", title: "1 · Tokenization",
      map: "Tokenize",
      why: "Computers do math on numbers, not letters. Turning text into token ids is the bridge from language into a form the network can actually multiply, add and compare.",
      render: (t) => (
        <>
          <Lead>
            A transformer can't read text — it reads <b>numbers</b>. First we split the
            prompt into known pieces (<b>tokens</b>) and replace each with its <b>id</b>,
            its row number in the model's vocabulary.
          </Lead>
          <Formula label="lookup">
            token <V>"{t.tokens[0]}"</V> → id <V>{t.tokenIds[0]}</V>&nbsp;&nbsp;…&nbsp;&nbsp;each word becomes an integer
          </Formula>
          <div className="tf-tokenstrip">
            {t.tokens.map((w, i) => (
              <div className="tf-tokchip" key={i}>
                <span className="tf-tokchip-w">{w}</span>
                <span className="tf-tokchip-id">id {t.tokenIds[i]}</span>
                <span className="tf-tokchip-pos">pos {i}</span>
              </div>
            ))}
          </div>
          <Note>Our toy vocabulary has just {window.TF_VOCAB.length} words. Real models
            (GPT-style) have 50,000+ subword tokens.</Note>
        </>
      ),
    },
    {
      id: "embed", group: "Input", title: "2 · Token embedding",
      map: "Embed",
      why: "An id like 5 is just a label — on its own it carries no meaning. The embedding turns each id into a vector the model can learn to position, so related words end up near each other in space.",
      render: (t) => (
        <>
          <Lead>
            Each token id is used to <b>look up a row</b> in the embedding table <V>E</V> —
            a learned list of vectors. That vector (length <V>d<Sub>model</Sub></V> = {C.dModel})
            is the token's first meaning. Similar words learn similar vectors.
          </Lead>
          <Formula label="embedding">
            <V>x<Sub>i</Sub></V> = <V>E</V>[ id<Sub>i</Sub> ]&nbsp;&nbsp;→&nbsp;&nbsp;a {C.dModel}-number vector per token
          </Formula>
          <Row>
            <Matrix data={t.emb} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)}
              caption="X" sub="token embeddings"
              cellTip={(i, j, v) => (
                <div>
                  <div className="tf-tip-title">E[ "{t.tokens[i]}" ]<sub>d{j}</sub></div>
                  <div className="tf-tip-sum">row {t.tokenIds[i]} of the embedding table = {fmt(v)}</div>
                </div>
              )} />
          </Row>
          <Note>These numbers are fixed look-ups, not calculations — so there's no per-cell
            math here. Hover a cell to see which table row it came from.</Note>
        </>
      ),
    },
    {
      id: "posenc", group: "Input", title: "3 · Positional encoding",
      map: "Position",
      why: "Self-attention treats its input as an unordered bag of tokens. Without a position signal, \"dog bites man\" and \"man bites dog\" would look identical — so we stamp each row with where it sits in the sequence.",
      render: (t) => (
        <>
          <Lead>
            Attention sees all tokens at once, so on its own it has <b>no sense of order</b>.
            We add a unique <b>positional</b> signal to each row using sine &amp; cosine waves,
            so position 0 differs from position 1, 2, 3…
          </Lead>
          <Formula label="sinusoidal">
            PE<Sub>(pos, 2k)</Sub> = sin( pos / 10000<Sup>2k/d</Sup> ),&nbsp;&nbsp;
            PE<Sub>(pos, 2k+1)</Sub> = cos( pos / 10000<Sup>2k/d</Sup> )
          </Formula>
          <Row>
            <Matrix data={t.emb} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="X" sub="embedding"
              cellTip={(i, j, v) => (
                <div>
                  <div className="tf-tip-title">E[ "{t.tokens[i]}" ]<sub>d{j}</sub></div>
                  <div className="tf-tip-sum">row {t.tokenIds[i]} of the embedding table</div>
                  <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div>
                </div>
              )} />
            <Arrow label="+" />
            <Matrix data={t.pe} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="PE" sub="position"
              cellTip={(i, j, v) => {
                const k = Math.floor(j / 2);
                const denom = Math.pow(10000, (2 * k) / C.dModel);
                const even = j % 2 === 0;
                const fn = even ? "sin" : "cos";
                return (
                  <div>
                    <div className="tf-tip-title">PE[ pos {i} ][ d{j} ]</div>
                    <div className="tf-tip-where">
                      <div><b>pos = {i}</b> — this token's position (the row, "{t.tokens[i]}")</div>
                      <div><b>d = {j}</b> — the dimension (the column)</div>
                      <div><b>k = ⌊d/2⌋ = {k}</b> — which sin/cos wave-pair</div>
                      <div><b>d<sub>model</sub> = {C.dModel}</b> — vector width</div>
                      <div>d{j} is {even ? "even → use sin" : "odd → use cos"}</div>
                    </div>
                    <div className="tf-tip-rule" />
                    <div className="tf-tip-sum">{fn}( pos / 10000<sup>2k/d</sup> )</div>
                    <div className="tf-tip-sum">= {fn}( {i} / 10000<sup>{fmt((2 * k) / C.dModel)}</sup> )</div>
                    <div className="tf-tip-sum">= {fn}( {i} / {fmt(denom)} ) = {fn}( {fmt(i / denom)} rad )</div>
                    <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div>
                  </div>
                );
              }} />
            <Arrow label="=" />
            <Matrix data={t.X0} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="X₀" sub="block input" accent
              cellTip={(i, j, v) => (
                <div>
                  <div className="tf-tip-title">X₀[ {i} ][ d{j} ] = embedding + position</div>
                  <div className="tf-tip-sum">
                    <span className="tf-fac">{fmt(t.emb[i][j])}</span> <span className="tf-op">(embed)</span>
                    &nbsp;+&nbsp;
                    <span className="tf-fac">{fmt(t.pe[i][j])}</span> <span className="tf-op">(PE)</span>
                  </div>
                  <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div>
                </div>
              )} />
          </Row>
          <Note>The result <V>X₀</V> is what actually enters the first transformer block.</Note>
        </>
      ),
    },

    /* ---------------- ATTENTION ---------------- */
    {
      id: "qkv", group: "Self-Attention", title: "4 · Q, K, V projections",
      map: "Q · K · V",
      why: "Attention needs three different views of each token: what it is looking for (Query), what it advertises to others (Key), and what it will actually hand over (Value). The three learned weight matrices carve those roles out of one vector.",
      render: (t, ctx) => {
        const b = t.blocks[0], X = t.X0;
        const hv = ctx.headView;
        const both = hv === "both";
        const h = both ? 0 : hv;
        const head = b.heads[h];
        const { Wq, Wk, Wv } = headW(h);
        return (
          <>
            <Lead>
              Every token asks three questions of itself. We multiply the input <V>X</V> by three
              learned weight matrices to get a <b>Query</b> (what am I looking for?), a
              <b> Key</b> (what do I offer?) and a <b>Value</b> (what will I pass on?).
            </Lead>
            <Formula label="projections">
              <V>Q</V> = <V>X·W<Sub>Q</Sub></V>&nbsp;&nbsp;·&nbsp;&nbsp;
              <V>K</V> = <V>X·W<Sub>K</Sub></V>&nbsp;&nbsp;·&nbsp;&nbsp;
              <V>V</V> = <V>X·W<Sub>V</Sub></V>
            </Formula>

            <div className="tf-subhead">What is a "head" — and why several?</div>
            <Lead>
              A <b>head</b> is one complete copy of the attention machinery with its <i>own</i>
              Wq, Wk, Wv. Rather than run one big attention, we run {C.nHeads} smaller ones
              <b> in parallel</b>, each working on its own {C.dHead}-dimension slice of every vector.
              The reason: a single head can really only track one kind of relationship at a time —
              head&nbsp;1 might follow the previous word while head&nbsp;2 follows the subject of the
              sentence. Several heads let the model watch several patterns at once, then merge them.
              Use the <b>Head 1 / Head 2 / Both</b> toggle above to compare.
            </Lead>

            {both ? (
              <>
                <div className="tf-subhead">Both heads, computed in parallel from the same X</div>
                <Row>
                  {b.heads.map((hd, hi) => (
                    <HeadCol key={hi} label={"Head " + (hi + 1)} accent={hi === 0}>
                      <Row wrap={false}>
                        <Matrix data={hd.Q} rowLabels={tokLabels(t)} colLabels={dimCols(C.dHead)} caption="Q" sub="query" compact
                          cellTip={mmTip(X, headW(hi).Wq, "Q = X · Wq")} />
                        <Matrix data={hd.K} rowLabels={tokLabels(t)} colLabels={dimCols(C.dHead)} caption="K" sub="key" compact
                          cellTip={mmTip(X, headW(hi).Wk, "K = X · Wk")} />
                        <Matrix data={hd.V} rowLabels={tokLabels(t)} colLabels={dimCols(C.dHead)} caption="V" sub="value" compact
                          cellTip={mmTip(X, headW(hi).Wv, "V = X · Wv")} />
                      </Row>
                    </HeadCol>
                  ))}
                </Row>
                <Note>Same input <V>X</V>, but each head uses <b>different learned weights</b>, so it
                  produces different Q/K/V and will end up attending differently. Switch to a single
                  head to see the full weight-by-weight math.</Note>
              </>
            ) : (
              <>
                <div className="tf-subhead">Head {h + 1} · where do its Wq, Wk, Wv come from?</div>
                <Lead>
                  They aren't calculated from the input — they are the model's <b>learned parameters</b>.
                  They start as small <b>random</b> numbers, and during <b>training</b> the model
                  repeatedly guesses the next word, measures its error, and nudges every weight a
                  tiny bit (gradient descent). After billions of examples these have settled into
                  values that pull useful Queries, Keys and Values out of each token. Here are
                  head {h + 1}'s trained values:
                </Lead>
                <Row>
                  <Matrix data={Wq} rowLabels={dimCols(C.dModel)} colLabels={dimCols(C.dHead)} caption={"Wq" + (h + 1)} sub="learned" compact cellTip={wTip("Wq")} />
                  <Matrix data={Wk} rowLabels={dimCols(C.dModel)} colLabels={dimCols(C.dHead)} caption={"Wk" + (h + 1)} sub="learned" compact cellTip={wTip("Wk")} />
                  <Matrix data={Wv} rowLabels={dimCols(C.dModel)} colLabels={dimCols(C.dHead)} caption={"Wv" + (h + 1)} sub="learned" compact cellTip={wTip("Wv")} />
                  <Note icon="i">Each weight maps one <b>input</b> dimension (row) to one
                    <b> output</b> dimension (column). Head 2 has different numbers here — that's
                    what makes the two heads behave differently.</Note>
                </Row>
                <div className="tf-subhead">Now apply them: X × W for head {h + 1}</div>
                <Row>
                  <Matrix data={X} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="X" sub="input" />
                  <Arrow label="×Wq" />
                  <Matrix data={head.Q} rowLabels={tokLabels(t)} colLabels={dimCols(C.dHead)} caption="Q" sub="query" accent cellTip={mmTip(X, Wq, "Q = X · Wq")} />
                  <Matrix data={head.K} rowLabels={tokLabels(t)} colLabels={dimCols(C.dHead)} caption="K" sub="key" accent cellTip={mmTip(X, Wk, "K = X · Wk")} />
                  <Matrix data={head.V} rowLabels={tokLabels(t)} colLabels={dimCols(C.dHead)} caption="V" sub="value" accent cellTip={mmTip(X, Wv, "V = X · Wv")} />
                </Row>
                <Note>Hover any Q/K/V cell to see the dot product behind it. Each head only sees its
                  own {C.dHead}-dim slice — that's why these matrices are {C.dHead} wide, not {C.dModel}.</Note>
              </>
            )}
          </>
        );
      },
    },
    {
      id: "scores", group: "Self-Attention", title: "5 · Attention scores",
      map: "Q·Kᵀ / √d",
      why: "To decide where each token should look, we measure how well its Query lines up with every token's Key. A dot product is exactly that similarity — large when two vectors point the same way, near zero when unrelated.",
      render: (t, ctx) => {
        const hv = ctx.headView;
        const both = hv === "both";
        const head = t.blocks[0].heads[both ? 0 : hv];
        const scaleLabel = `÷ √${C.dHead} (=${fmt(Math.sqrt(C.dHead))})`;
        const scoreMx = (hd, hi, accent) => (
          <Matrix data={hd.rawScores} rowLabels={tokLabels(t)} colLabels={tokLabels(t)}
            caption="S" sub={"head " + (hi + 1) + " · row=query, col=key"} accent={accent} compact={both}
            cellTip={(i, j, v) => (
              <DotTip title={`head ${hi + 1} score: "${t.tokens[i]}" → "${t.tokens[j]}"`}
                terms={hd.Q[i].map((q, k) => ({ a: q, b: hd.K[j][k] }))}
                scaleLabel={scaleLabel} result={v} />
            )} />
        );
        return (
          <>
            <Lead>
              How much should token <i>i</i> pay attention to token <i>j</i>? Take the
              <b> dot product</b> of <i>i</i>'s Query with <i>j</i>'s Key — bigger means more
              relevant. We divide by <V>√d<Sub>head</Sub></V> to keep the numbers stable.
            </Lead>
            <Formula label="scaled scores">
              <V>S</V> = <V>Q·K<Sup>T</Sup></V> <span className="tf-nowrap">/ √<V>d<Sub>head</Sub></V></span>
            </Formula>
            {both ? (
              <>
                <Row>
                  {t.blocks[0].heads.map((hd, hi) => (
                    <HeadCol key={hi} label={"Head " + (hi + 1)} accent={hi === 0}>{scoreMx(hd, hi, false)}</HeadCol>
                  ))}
                </Row>
                <Note>Both heads score the <i>same</i> tokens, but because their Queries and Keys
                  differ, the two grids look different — each head decides "what's relevant" its own way.</Note>
              </>
            ) : (
              <>
                <Row>{scoreMx(head, hv, true)}</Row>
                <Note>The grid is read row-by-row: row "{t.tokens[0]}" holds its scores against
                  every token. Notice it isn't symmetric — asking is different from offering.</Note>
              </>
            )}
          </>
        );
      },
    },
    {
      id: "mask", group: "Self-Attention", title: "6 · Causal mask",
      map: "Causal mask",
      why: "At generation time the next word doesn't exist yet, so a token must never use information from its right. Masking the future during training makes training behave exactly like generation — this is the defining trait of a decoder.",
      render: (t, ctx) => {
        const hv = ctx.headView;
        const both = hv === "both";
        const head = t.blocks[0].heads[both ? 0 : hv];
        return (
          <>
            <Lead>
              This is what makes it a <b>decoder</b>. When predicting the next word, a token
              must not <b>peek at the future</b>. So we blank out every score where the key is
              <i> later</i> than the query by setting it to <V>−∞</V> (which becomes 0 after softmax).
            </Lead>
            <Formula label="masking">
              <V>S<Sub>ij</Sub></V> = <V>−∞</V>&nbsp;&nbsp;if&nbsp;&nbsp;<V>j &gt; i</V>&nbsp;&nbsp;
              (key position after query position)
            </Formula>
            {both ? (
              <Row>
                {t.blocks[0].heads.map((hd, hi) => (
                  <HeadCol key={hi} label={"Head " + (hi + 1)} accent={hi === 0}>
                    <Matrix data={hd.masked} rowLabels={tokLabels(t)} colLabels={tokLabels(t)}
                      caption="S′" sub={t.maskOn ? "after mask" : "mask OFF"} dimMask compact
                      highlight={(i, j) => j > i} />
                  </HeadCol>
                ))}
              </Row>
            ) : (
              <Row>
                <Matrix data={head.rawScores} rowLabels={tokLabels(t)} colLabels={tokLabels(t)} caption="S" sub="before mask" />
                <Arrow label="mask" />
                <Matrix data={head.masked} rowLabels={tokLabels(t)} colLabels={tokLabels(t)}
                  caption="S′" sub={t.maskOn ? "after mask" : "mask OFF"} accent dimMask
                  highlight={(i, j) => j > i} />
              </Row>
            )}
            <div className="tf-inlinemask">
              <button className={"tf-mask" + (t.maskOn ? " is-on" : "")} onClick={() => ctx.setMaskOn && ctx.setMaskOn((m) => !m)}>
                <span className="tf-mask-led" />
                Causal mask <b>{t.maskOn ? "ON" : "OFF"}</b>
              </button>
              <span className="tf-inlinemask-hint">Try it — with the mask <b>off</b>, every token can see every other token, which turns this into an <i>encoder</i>.</span>
            </div>
            <Note icon="⚑">The mask is the <b>same</b> for every head — it depends only on
              position, not content.</Note>
          </>
        );
      },
    },
    {
      id: "softmax", group: "Self-Attention", title: "7 · Softmax → weights",
      map: "Softmax",
      why: "Raw scores can be any size and don't compare cleanly. Softmax squashes each row into a tidy probability distribution — a set of mixing weights between 0 and 1 that sum to exactly 1.",
      render: (t, ctx) => {
        const hv = ctx.headView;
        const both = hv === "both";
        const head = t.blocks[0].heads[both ? 0 : hv];
        const attnTip = (hd, hi) => (i, j, v) => {
          const row = hd.masked[i];
          const exps = row.map((s) => (isFinite(s) ? Math.exp(s) : 0));
          const denom = exps.reduce((a, b) => a + b, 0);
          return (
            <div>
              <div className="tf-tip-title">head {hi + 1}: "{t.tokens[i]}" → "{t.tokens[j]}"</div>
              <div className="tf-tip-sum">e^{fmt(row[j])} = {fmt(exps[j])}</div>
              <div className="tf-tip-sum">÷ (row sum {fmt(denom)})</div>
              <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div>
            </div>
          );
        };
        return (
          <>
            <Lead>
              <b>Softmax</b> turns each row of scores into <b>attention weights</b>: positive
              numbers that add up to 1. Each row is now a recipe — "spend this fraction of my
              attention on each previous token."
            </Lead>
            <Formula label="softmax (per row)">
              <V>A<Sub>ij</Sub></V> = e<Sup>S<Sub>ij</Sub></Sup> / Σ<Sub>k</Sub> e<Sup>S<Sub>ik</Sub></Sup>
            </Formula>
            {both ? (
              <>
                <Row>
                  {t.blocks[0].heads.map((hd, hi) => (
                    <HeadCol key={hi} label={"Head " + (hi + 1)} accent={hi === 0}>
                      <Matrix data={hd.attn} rowLabels={tokLabels(t)} colLabels={tokLabels(t)}
                        caption="A" sub="weights (rows sum to 1)" heat compact cellTip={attnTip(hd, hi)} />
                    </HeadCol>
                  ))}
                </Row>
                <Note>Notice the two heads spread their attention <b>differently</b> over the same
                  tokens — that's the whole point of having more than one.</Note>
              </>
            ) : (
              <>
                <Row>
                  <Matrix data={head.masked} rowLabels={tokLabels(t)} colLabels={tokLabels(t)} caption="S′" sub="masked scores" dimMask />
                  <Arrow label="softmax" />
                  <Matrix data={head.attn} rowLabels={tokLabels(t)} colLabels={tokLabels(t)}
                    caption="A" sub="attention weights (rows sum to 1)" accent heat cellTip={attnTip(head, hv)} />
                </Row>
                <Note>{t.maskOn
                  ? <>With the mask on, the first token can only attend to itself, so its row is a single <b>1.00</b>. Later rows spread attention across everything so far.</>
                  : <>With <b>no mask</b> (bidirectional), every row spreads attention across <i>all</i> tokens — past and future — so each token is informed by the whole sentence.</>}</Note>
              </>
            )}
          </>
        );
      },
    },
    {
      id: "weighted", group: "Self-Attention", title: "8 · Weighted sum of Values",
      map: "A · V",
      why: "This is the moment information actually moves between tokens. Each token pulls in a blend of every other token's Value, weighted by how much attention it paid — context flows in here.",
      render: (t, ctx) => {
        const hv = ctx.headView;
        const both = hv === "both";
        const h = both ? 0 : hv;
        const head = t.blocks[0].heads[h];
        const X = t.X0;
        const Wv = headW(h).Wv;
        const aTip = (hd) => (i, j, v) => {
          const row = hd.masked[i];
          const exps = row.map((s) => (isFinite(s) ? Math.exp(s) : 0));
          const denom = exps.reduce((a, b) => a + b, 0);
          return (
            <div>
              <div className="tf-tip-title">A[ "{t.tokens[i]}" → "{t.tokens[j]}" ]</div>
              <div className="tf-tip-where"><div>An <b>attention weight</b> from step 7 (Softmax).</div></div>
              <div className="tf-tip-rule" />
              <div className="tf-tip-sum">softmax: e<sup>{fmt(row[j])}</sup> / (row sum {fmt(denom)})</div>
              <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div>
            </div>
          );
        };
        const vTip = (i, j, v) => (
          <div>
            <div className="tf-tip-title">V[ "{t.tokens[i]}" ][ d{j} ]</div>
            <div className="tf-tip-where"><div>A <b>Value</b> from step 4: V = X · Wv.</div></div>
            <div className="tf-tip-rule" />
            <div className="tf-tip-calc">
              {X[i].map((a, k) => (
                <span key={k} className="tf-term">
                  {k > 0 && <span className="tf-op">+</span>}
                  <span className="tf-fac">{fmt(a)}</span><span className="tf-op">×</span><span className="tf-fac">{fmt(Wv[k][j])}</span>
                </span>
              ))}
            </div>
            <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div>
          </div>
        );
        return (
          <>
            <Lead>
              Finally each token builds its new vector by <b>mixing the Values</b> using those
              weights. A token that attends 70% to itself and 30% to "{t.tokens[0]}" gets a
              blend of those two Value vectors. This is the head's output.
            </Lead>
            <div className="tf-note" style={{ marginTop: 0 }}>
              <span className="tf-note-ic">i</span>
              <div>
                <b>Where do A and V come from?</b> Both are matrices we already built. <b>A</b> is the
                attention-weights grid from <b>step 7 (Softmax)</b>; <b>V</b> is the Value matrix from
                <b> step 4 (Q/K/V)</b>, i.e. <V>V = X·W<Sub>V</Sub></V>. Here we just multiply them —
                hover any cell of A, V <i>or</i> the output to see exactly how it was computed.
              </div>
            </div>
            <Formula label="head output">
              <V>head<Sub>i</Sub></V> = Σ<Sub>j</Sub> <V>A<Sub>ij</Sub></V> · <V>V<Sub>j</Sub></V>
              &nbsp;&nbsp;&nbsp;(each row of A weights the rows of V)
            </Formula>
            {both ? (
              <>
                <Row>
                  {t.blocks[0].heads.map((hd, hi) => (
                    <HeadCol key={hi} label={"Head " + (hi + 1)} accent={hi === 0}>
                      <Matrix data={hd.out} rowLabels={tokLabels(t)} colLabels={dimCols(C.dHead)}
                        caption={"head" + (hi + 1)} sub="output" compact cellTip={wsumTip(hd.attn, hd.V, "head = A · V")} />
                    </HeadCol>
                  ))}
                </Row>
                <Note>Each head outputs a {C.dHead}-wide vector per token. In the next step these get
                  <b> stitched side-by-side</b> back to width {C.dModel}. Hover a cell for its weighted sum.</Note>
              </>
            ) : (
              <>
                <Row>
                  <Matrix data={head.attn} rowLabels={tokLabels(t)} colLabels={tokLabels(t)} caption="A" sub="weights · from step 7" cellTip={aTip(head)} />
                  <Arrow label="×V" />
                  <Matrix data={head.V} rowLabels={tokLabels(t)} colLabels={dimCols(C.dHead)} caption="V" sub="values · from step 4" cellTip={vTip} />
                  <Arrow label="=" />
                  <Matrix data={head.out} rowLabels={tokLabels(t)} colLabels={dimCols(C.dHead)} caption={"head" + (hv + 1)} sub="output" accent
                    cellTip={wsumTip(head.attn, head.V, "head = A · V")} />
                </Row>
                <Note>Read the output row for "{t.tokens[t.tokens.length - 1]}": it is the blend of
                  the Value rows, weighted by that token's attention row in A. This whole
                  Q→K→V→score→mask→softmax→mix process is <b>one head</b>.</Note>
              </>
            )}
          </>
        );
      },
    },
    {
      id: "concat", group: "Self-Attention", title: "9 · Multi-head merge",
      map: "Concat · Wₒ", heads: false,
      why: "Each head learns a different kind of relationship — one might track grammar, another nearby words, another topic. Concatenating and projecting with Wₒ fuses those parallel views back into one vector per token.",
      render: (t) => {
        const b = t.blocks[0];
        const dh = C.dHead;
        // concat[i][j] comes from head ⌊j/dHead⌋, its column j%dHead
        const concatTip = (i, j, v) => {
          const hi = Math.floor(j / dh), col = j % dh;
          return (
            <div>
              <div className="tf-tip-title">concat[ "{t.tokens[i]}" ][ d{j} ]</div>
              <div className="tf-tip-where">
                <div>Just a <b>copy</b> — column d{j} is taken from</div>
                <div><b>head {hi + 1}</b>, its output column d{col}. No math, just placed side-by-side.</div>
              </div>
              <div className="tf-tip-rule" />
              <div className="tf-tip-sum tf-tip-eq">= {fmt(v)}</div>
            </div>
          );
        };
        return (
          <>
            <Lead>
              The {C.nHeads} heads each looked at the sequence differently. We <b>stick their
              outputs side-by-side</b> (concatenate) back to width {C.dModel}, then pass through
              one more learned matrix <V>W<Sub>O</Sub></V> to mix the heads together.
            </Lead>
            <Formula label="combine heads">
              MultiHead = Concat(head₁ … head<Sub>{C.nHeads}</Sub>) · <V>W<Sub>O</Sub></V>
            </Formula>

            <div className="tf-subhead">What is Wₒ and where does it come from?</div>
            <Lead>
              <V>W<Sub>O</Sub></V> (the <b>output projection</b>) is the fourth <b>learned</b> weight
              matrix of the attention layer — alongside Wq, Wk, Wv. Like them it starts random and is
              tuned by <b>training</b>. Concatenating just lines the heads up next to each other;
              they haven't actually been <i>combined</i> yet. <V>W<Sub>O</Sub></V> is what mixes the
              heads, letting each output dimension draw from <i>all</i> heads at once. It's a
              {" "}{C.dModel}×{C.dModel} matrix (concat width → model width).
            </Lead>
            <Row>
              <Matrix data={window.TF_WO} rowLabels={dimCols(C.dModel)} colLabels={dimCols(C.dModel)} caption="Wₒ" sub="learned" compact cellTip={wTip("Wo")} />
              <Note icon="i">Rows = the {C.dModel} concatenated inputs (head 1's d0,d1 then head 2's
                d0,d1); columns = the {C.dModel} mixed outputs. Hover a cell — it's a learned
                parameter, not computed from the input.</Note>
            </Row>

            <div className="tf-subhead">Apply it: concatenate the heads, then × Wₒ</div>
            <Row>
              {b.heads.map((h, hi) => (
                <Matrix key={hi} data={h.out} rowLabels={tokLabels(t)} colLabels={dimCols(C.dHead)}
                  caption={"head" + (hi + 1)} sub="from step 8" cellTip={wsumTip(h.attn, h.V, "head = A · V")} />
              ))}
              <Arrow label="concat" />
              <Matrix data={b.concat} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="concat" sub={`${C.dModel}-wide`} cellTip={concatTip} />
              <Arrow label="×Wₒ" />
              <Matrix data={b.attnProj} rowLabels={tokLabels(t)} colLabels={dimCols(C.dModel)} caption="Z" sub="attention out" accent
                cellTip={mmTip(b.concat, window.TF_WO, "Z = concat · Wo")} />
            </Row>
            <Note>That's the complete <b>masked multi-head self-attention</b> layer. Its output
              <V> Z</V> now flows into the "Add &amp; Norm" step. Hover any cell of Wₒ, concat or Z
              to trace it.</Note>
          </>
        );
      },
    },
  ];

  window.STAGES_A = STAGES_A;
})();
