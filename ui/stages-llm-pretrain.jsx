/* ============================================================
   LLM Pre-Training — stages-llm-pretrain.jsx (13 stages)
   Educational article — no sliders, no renderInput
   ============================================================ */
(function () {
  const { Lead, Note, fmt } = window;

  const card = (children, extra) => (
    <div style={{ background:"var(--panel-solid)", border:"1px solid var(--line)",
      borderRadius:14, padding:"16px 20px", marginBottom:14, ...extra }}>
      {children}
    </div>
  );

  const subhead = (t) => (
    <div style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:15,
      color:"var(--accent)", margin:"18px 0 8px" }}>{t}</div>
  );

  const tbl = (children) => (
    <div style={{ overflowX:"auto", marginBottom:14 }}>
      <table style={{ borderCollapse:"collapse", fontSize:13, width:"100%" }}>
        {children}
      </table>
    </div>
  );

  const th = (s, extra) => (
    <th style={{ background:"var(--panel-solid)", border:"1px solid var(--line)",
      padding:"7px 11px", textAlign:"left", fontWeight:700,
      fontSize:12, color:"var(--muted)", ...(extra || {}) }}>{s}</th>
  );

  const td = (s, extra) => (
    <td style={{ border:"1px solid var(--line)", padding:"7px 11px",
      fontSize:12, color:"var(--ink)", verticalAlign:"top", ...(extra || {}) }}>{s}</td>
  );

  const codeBlock = (code) => (
    <pre style={{ background:"#f5f5f5", padding:"12px 16px", borderRadius:8,
      fontSize:12, overflowX:"auto", fontFamily:"monospace", lineHeight:1.6,
      margin:"10px 0", border:"1px solid #e0e0e0" }}>
      <code>{code}</code>
    </pre>
  );

  const info = (children) => (
    <div style={{ background:"rgba(43,91,255,.07)", border:"1px solid rgba(43,91,255,.2)",
      borderRadius:10, padding:"10px 14px", fontSize:13, color:"var(--ink)", margin:"10px 0" }}>
      {children}
    </div>
  );

  const warn = (children) => (
    <div style={{ background:"#fff8e6", border:"1px solid #f5c842", borderRadius:10,
      padding:"10px 14px", fontSize:13, color:"#7a5700", margin:"10px 0" }}>
      <b>Warning:</b> {children}
    </div>
  );

  // ════════════════════════════════════════════
  // STAGES
  // ════════════════════════════════════════════
  const STAGES = [

    // ─── STAGE 1 ───────────────────────────────────────────────────────────────
    {
      id: "overview",
      group: "Overview",
      title: "What is LLM Pre-Training?",
      map: "Overview",
      why: "Pre-training is where the model learns everything it knows. Fine-tuning only shapes how it expresses that knowledge.",
      render: () => (
        <>
          <Lead>
            Large Language Model pre-training is the process of training a neural network
            on <b>massive amounts of raw text</b> to predict the next token. No labels, no
            human annotations — just the internet, books, and code. Everything the model
            knows about language, facts, reasoning, and the world emerges from this single
            objective.
          </Lead>

          {subhead("Supervised Learning vs. Pre-Training")}
          {tbl(<>
            <thead>
              <tr>
                {th("Aspect")}
                {th("Supervised Learning")}
                {th("LLM Pre-Training")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Data")}
                {td("Labeled pairs (x, y)")}
                {td("Raw unlabeled text — trillions of tokens")}
              </tr>
              <tr>
                {td("Objective")}
                {td("Predict a class or value")}
                {td("Predict the next token given all previous tokens")}
              </tr>
              <tr>
                {td("Labels")}
                {td("Human-annotated")}
                {td("Auto-generated: next token IS the label")}
              </tr>
              <tr>
                {td("Scale")}
                {td("Thousands to millions of examples")}
                {td("15+ trillion tokens (Llama 3)")}
              </tr>
              <tr>
                {td("What emerges")}
                {td("A classifier or regressor")}
                {td("World knowledge, reasoning, language understanding")}
              </tr>
            </tbody>
          </>)}

          {subhead("The Internet as Training Data")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Pre-training data comes from across the public web and curated corpora:
            </p>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:"8px 0 0", paddingLeft:22, color:"var(--ink)" }}>
              <li><b>Common Crawl</b> — petabytes of web text, cleaned and filtered</li>
              <li><b>GitHub</b> — billions of lines of code across all programming languages</li>
              <li><b>arXiv</b> — scientific papers: math, physics, ML, CS</li>
              <li><b>Wikipedia</b> — factual reference text in 300+ languages</li>
              <li><b>Books</b> — long-form coherent reasoning and narrative structure</li>
            </ul>
          </>)}

          {subhead("What Capabilities Emerge")}
          {info(<>
            <b>From next-token prediction alone, LLMs learn:</b> grammar and syntax,
            factual world knowledge, arithmetic and logical reasoning, translation between
            languages, code generation and debugging, in-context learning (few-shot),
            and chain-of-thought reasoning — all without any explicit supervision for
            these tasks.
          </>)}

          {subhead("The Pre-Training Pipeline")}
          <div style={{ overflowX:"auto", marginBottom:18 }}>
            <svg viewBox="0 0 820 90" style={{ width:"100%", maxWidth:820, height:"auto",
              display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              <defs>
                <marker id="arr-ov" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>
              {[
                { x:8,   label:"Raw Text",    sub:"Web/Books/Code", color:"#2B5BFF", bg:"rgba(43,91,255,.13)" },
                { x:148, label:"Tokenize",    sub:"BPE 128K vocab",  color:"#1f9e6b", bg:"rgba(31,158,107,.13)" },
                { x:288, label:"Pack",        sub:"4096-len windows",color:"#e05c2e", bg:"rgba(224,92,46,.13)" },
                { x:428, label:"Forward",     sub:"Transformer",     color:"#7c3aed", bg:"rgba(124,58,237,.13)" },
                { x:568, label:"Loss",        sub:"Cross-Entropy",   color:"#be185d", bg:"rgba(190,24,93,.13)" },
                { x:708, label:"Update",      sub:"AdamW + clip",    color:"#d97706", bg:"rgba(217,119,6,.13)" },
              ].map((b, i) => (
                <g key={i}>
                  <rect x={b.x} y={12} width={124} height={52} rx="8"
                    fill={b.bg} stroke={b.color} strokeWidth="1.8" />
                  <text x={b.x + 62} y={33} textAnchor="middle" fontSize="11"
                    fontWeight="700" fill={b.color}>{b.label}</text>
                  <text x={b.x + 62} y={50} textAnchor="middle" fontSize="9.5"
                    fill={b.color} opacity="0.85">{b.sub}</text>
                  {i < 5 && (
                    <line x1={b.x + 125} y1={38} x2={b.x + 145} y2={38}
                      stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-ov)" />
                  )}
                </g>
              ))}
            </svg>
          </div>

          <Note>
            <b>The key insight:</b> the model never sees the same sequence twice in the same
            order (data is shuffled each epoch). Yet after training on 15 trillion tokens, it
            has effectively compressed a representation of human knowledge into its weights.
          </Note>
        </>
      )
    },

    // ─── STAGE 2 ───────────────────────────────────────────────────────────────
    {
      id: "data_pipeline",
      group: "Data",
      title: "The Data Pipeline — From Web to Training Tensor",
      map: "Data Pipeline",
      why: "Data quality is the single biggest lever in LLM performance — 'garbage in, garbage out' applies at trillion-token scale.",
      render: () => (
        <>
          <Lead>
            Before a single gradient is computed, raw web text must pass through a rigorous
            pipeline: collected, normalized, deduplicated, filtered, tokenized, and packed
            into fixed-length training tensors. This pipeline determines the quality of
            everything that follows.
          </Lead>

          {subhead("Scale Numbers")}
          {tbl(<>
            <thead>
              <tr>
                {th("Dataset")}
                {th("Tokens")}
                {th("Notes")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Llama 3 training corpus")}
                {td(">15 trillion")}
                {td("30+ languages, quality filtered")}
              </tr>
              <tr>
                {td("FineWeb (after filtering)")}
                {td("36+ trillion")}
                {td("HuggingFace open dataset from Common Crawl")}
              </tr>
              <tr>
                {td("Common Crawl (raw)")}
                {td("Hundreds of trillions")}
                {td("~90% discarded after quality filtering")}
              </tr>
            </tbody>
          </>)}

          {subhead("Step-by-Step Pipeline")}

          <div style={{ overflowX:"auto", marginBottom:18 }}>
            <svg viewBox="0 0 760 200" style={{ width:"100%", maxWidth:760, height:"auto",
              display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              <defs>
                <marker id="arr-dp" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#666" />
                </marker>
              </defs>
              {[
                { x:10,  y:10,  w:140, h:44, label:"1. Collection",      sub:"Common Crawl, GitHub, arXiv", color:"#2B5BFF", bg:"rgba(43,91,255,.10)" },
                { x:10,  y:80,  w:140, h:44, label:"2. Unicode Norm.",   sub:"NFC normalization, encoding fix", color:"#1f9e6b", bg:"rgba(31,158,107,.10)" },
                { x:10,  y:150, w:140, h:44, label:"3. Lang. Detect",    sub:"threshold >= 0.65 confidence", color:"#7c3aed", bg:"rgba(124,58,237,.10)" },
                { x:310, y:10,  w:140, h:44, label:"4. MinHash Dedup",   sub:"near-duplicate removal", color:"#e05c2e", bg:"rgba(224,92,46,.10)" },
                { x:310, y:80,  w:140, h:44, label:"5. Quality Filter",  sub:"heuristics + classifier", color:"#be185d", bg:"rgba(190,24,93,.10)" },
                { x:310, y:150, w:140, h:44, label:"6. BPE Tokenize",    sub:"128K vocab, tiktoken-style", color:"#d97706", bg:"rgba(217,119,6,.10)" },
                { x:600, y:80,  w:140, h:44, label:"7. Sequence Pack",   sub:"4096-len windows + Parquet", color:"#059669", bg:"rgba(5,150,105,.10)" },
              ].map((b, i) => (
                <g key={i}>
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="8"
                    fill={b.bg} stroke={b.color} strokeWidth="1.6" />
                  <text x={b.x + b.w/2} y={b.y + 17} textAnchor="middle"
                    fontSize="10.5" fontWeight="700" fill={b.color}>{b.label}</text>
                  <text x={b.x + b.w/2} y={b.y + 32} textAnchor="middle"
                    fontSize="9" fill={b.color} opacity="0.8">{b.sub}</text>
                </g>
              ))}
              {/* Arrows down in left column */}
              <line x1={80} y1={54} x2={80} y2={78} stroke="#666" strokeWidth="1.4" markerEnd="url(#arr-dp)"/>
              <line x1={80} y1={124} x2={80} y2={148} stroke="#666" strokeWidth="1.4" markerEnd="url(#arr-dp)"/>
              {/* Arrow from left col bottom to right col top */}
              <line x1={150} y1={172} x2={308} y2={32} stroke="#666" strokeWidth="1.4" markerEnd="url(#arr-dp)"/>
              {/* Arrows down in middle column */}
              <line x1={380} y1={54} x2={380} y2={78} stroke="#666" strokeWidth="1.4" markerEnd="url(#arr-dp)"/>
              <line x1={380} y1={124} x2={380} y2={148} stroke="#666" strokeWidth="1.4" markerEnd="url(#arr-dp)"/>
              {/* Arrow from middle col bottom to right */}
              <line x1={450} y1={172} x2={598} y2={102} stroke="#666" strokeWidth="1.4" markerEnd="url(#arr-dp)"/>
            </svg>
          </div>

          {subhead("Quality Filtering Details")}
          {card(<>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:22, color:"var(--ink)" }}>
              <li><b>Language detection:</b> Keep only documents where the detected language
                confidence is at least 0.65. Discards mixed-language spam and garbled text.</li>
              <li><b>MinHash deduplication:</b> Locality-sensitive hashing to find near-duplicate
                documents across billions of pages. Llama 3 deduplicated at URL, document, and
                paragraph level.</li>
              <li><b>Heuristic filters:</b> Remove documents with too few words, excessive
                punctuation-to-word ratios, HTML tags, or known spam patterns.</li>
              <li><b>Quality classifiers:</b> A small fastText or DistilBERT model trained on
                high-quality curated data vs. random web pages — scores each document.</li>
            </ul>
          </>)}

          {subhead("Sequence Packing")}
          {info(<>
            <b>Sequence packing eliminates padding waste.</b> Documents are concatenated
            with EOS tokens, then reshaped into fixed context_length=4096 windows.
            A 4096-token window might contain 5 short documents or 1 long one — every
            GPU cycle processes real tokens, not padding zeros. This maximizes GPU utilization.
          </>)}

          {codeBlock(
`# Sequence packing pseudocode
tokens = []
for doc in shuffled_documents:
    tokens.extend(tokenize(doc) + [EOS_TOKEN])

# Reshape into fixed-length windows
num_windows = len(tokens) // context_length
packed = tokens[:num_windows * context_length]
packed = packed.reshape(num_windows, context_length)
# Store as Parquet shards, shuffled`
          )}

          <Note>
            <b>Data quality beats data quantity.</b> The FineWeb team found that aggressive
            quality filtering (keeping only the top ~15% of Common Crawl by quality score)
            produced better models than training on all raw crawl data, even with fewer tokens.
          </Note>
        </>
      )
    },

    // ─── STAGE 3 ───────────────────────────────────────────────────────────────
    {
      id: "tokenization",
      group: "Data",
      title: "BPE Tokenization — Text to Numbers",
      map: "Tokenization",
      why: "The model never sees text — it sees sequences of integers. BPE is the algorithm that converts one to the other.",
      render: () => (
        <>
          <Lead>
            Neural networks operate on numbers, not characters. Tokenization converts raw
            text into sequences of integer IDs that the model can process. Modern LLMs use
            <b> Byte-Pair Encoding (BPE)</b> — an algorithm that finds the most efficient
            way to represent text as subword units.
          </Lead>

          {subhead("BPE Algorithm")}
          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:"var(--accent)" }}>
              How BPE builds its vocabulary
            </div>
            <ol style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:22, color:"var(--ink)" }}>
              <li><b>Start with bytes:</b> Every unique byte (0–255) is an initial token. This
                gives 256 starting tokens and guarantees the model can represent any input.</li>
              <li><b>Count adjacent pairs:</b> Scan the entire training corpus and count every
                adjacent pair of tokens (e.g., "th", "he", "in").</li>
              <li><b>Merge the most frequent pair:</b> Create a new token for it. E.g., if
                "th" appears 1.2M times, merge into a new token "th".</li>
              <li><b>Repeat:</b> Update counts and merge again. Repeat until vocabulary reaches
                target size (e.g., 128,000 tokens for Llama 3).</li>
            </ol>
          </>)}

          {subhead("Vocabulary Sizes Across Models")}
          {tbl(<>
            <thead>
              <tr>
                {th("Model")}
                {th("Vocab Size")}
                {th("Tokenizer")}
                {th("Notes")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("GPT-2")}
                {td("50,257")}
                {td("BPE")}
                {td("Baseline, character-level fallback")}
              </tr>
              <tr>
                {td("GPT-4 / tiktoken cl100k")}
                {td("100,277")}
                {td("BPE (tiktoken)")}
                {td("cl100k_base, used by GPT-3.5 and GPT-4")}
              </tr>
              <tr>
                {td("Llama 3")}
                {td("128,000")}
                {td("BPE (tiktoken-style)")}
                {td("15% more efficient than Llama 2's 32K tokenizer")}
              </tr>
              <tr>
                {td("Gemma-3")}
                {td("262,144")}
                {td("BPE (SentencePiece)")}
                {td("Largest standard vocabulary; best multilingual coverage")}
              </tr>
            </tbody>
          </>)}

          {subhead("Tokenization Example")}
          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:"var(--accent)" }}>
              Encoding: "the transformer"
            </div>
            {tbl(<>
              <thead>
                <tr>
                  {th("Token string")}
                  {th("Token ID")}
                  {th("Bytes")}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {td(<code>"the"</code>)}
                  {td("1820")}
                  {td("74 68 65")}
                </tr>
                <tr>
                  {td(<code>" trans"</code>)}
                  {td("1429")}
                  {td("20 74 72 61 6e 73")}
                </tr>
                <tr>
                  {td(<code>"former"</code>)}
                  {td("15630")}
                  {td("66 6f 72 6d 65 72")}
                </tr>
              </tbody>
            </>)}
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>
              Input: 2 words (15 chars) → 3 tokens. Common subwords get single tokens.
            </div>
          </>)}

          {subhead("Special Tokens")}
          {tbl(<>
            <thead>
              <tr>
                {th("Token")}
                {th("Purpose")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td(<code>&lt;|begin_of_text|&gt;</code>)}
                {td("Marks the start of a document or conversation")}
              </tr>
              <tr>
                {td(<code>&lt;|end_of_text|&gt;</code>)}
                {td("Marks the end of a document (EOS for pre-training)")}
              </tr>
              <tr>
                {td(<code>&lt;|eot_id|&gt;</code>)}
                {td("End of turn marker in Llama 3 chat format")}
              </tr>
              <tr>
                {td(<code>[PAD]</code>)}
                {td("Padding token — positions with labels set to -100 (ignored in loss)")}
              </tr>
            </tbody>
          </>)}

          {subhead("Why Subwords?")}
          {info(<>
            <b>Subword tokenization</b> balances three competing goals:
            (1) <b>Unknown word handling</b> — any word can be broken into known subwords,
            so OOV (out-of-vocabulary) errors are impossible;
            (2) <b>Efficiency</b> — common words like "the" are a single token, not 3 bytes;
            (3) <b>Multilingual</b> — rare languages fall back to byte-level tokens,
            guaranteeing full coverage. A larger vocabulary = fewer tokens per document
            = longer effective context at the same sequence length.
          </>)}

          <Note>
            Llama 3's 128K tokenizer encodes English text ~15% more efficiently than
            Llama 2's 32K tokenizer on identical text. More efficient tokenization means
            the model sees more content per 4096-token context window.
          </Note>
        </>
      )
    },

    // ─── STAGE 4 ───────────────────────────────────────────────────────────────
    {
      id: "batch_shape",
      group: "Data",
      title: "Training Batch — What the Model Actually Sees",
      map: "Batch Shape",
      why: "Understanding the exact shape and content of a training batch demystifies every subsequent step in the training loop.",
      render: () => (
        <>
          <Lead>
            Every training step, the model receives a batch of packed token sequences and
            must predict the next token at every position. The batch is three tensors:
            <b> input_ids</b>, <b>attention_mask</b>, and <b>labels</b> — each with the
            same shape.
          </Lead>

          {subhead("Tensor Shapes")}
          {codeBlock(
`input_ids:      shape (batch_size=8, seq_len=4096)  # integer token IDs
attention_mask: shape (batch_size=8, seq_len=4096)  # 1=attend, 0=ignore
labels:         shape (batch_size=8, seq_len=4096)  # shifted by 1 (next-token targets)`
          )}

          {subhead("Tensor Dimension Flow — Full Forward Pass")}
          <div style={{ overflowX:"auto", marginBottom:18 }}>
            <svg viewBox="0 0 800 480" style={{ width:"100%", maxWidth:800, height:"auto",
              display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              <defs>
                <marker id="arr-bd" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>

              {/* Input Token IDs */}
              <rect x={270} y={8} width={260} height={48} rx="8"
                fill="rgba(43,91,255,.13)" stroke="#2B5BFF" strokeWidth="1.8"/>
              <text x={400} y={28} textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">Input Token IDs</text>
              <text x={400} y={43} textAnchor="middle" fontSize="10" fontWeight="600" fill="#2B5BFF">[B, T] = [8, 4096]</text>
              <text x={400} y={56} textAnchor="middle" fontSize="8.5" fill="#2B5BFF" opacity="0.7">0.07 MB</text>

              {/* Arrow + label */}
              <line x1={400} y1={56} x2={400} y2={76} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-bd)"/>
              <text x={510} y={70} fontSize="9" fill="#555">Token Embedding lookup</text>

              {/* Embeddings */}
              <rect x={240} y={78} width={320} height={48} rx="8"
                fill="rgba(31,158,107,.13)" stroke="#1f9e6b" strokeWidth="1.8"/>
              <text x={400} y={98} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1f9e6b">Embeddings</text>
              <text x={400} y={113} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1f9e6b">[B, T, D] = [8, 4096, 4096]</text>
              <text x={400} y={126} textAnchor="middle" fontSize="8.5" fill="#1f9e6b" opacity="0.7">~268 MB in BF16</text>

              <line x1={400} y1={126} x2={400} y2={146} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-bd)"/>
              <text x={510} y={140} fontSize="9" fill="#555">x 32 Transformer layers</text>

              {/* Transformer block dashed */}
              <rect x={30} y={148} width={740} height={202} rx="12"
                fill="rgba(124,58,237,.05)" stroke="#7c3aed" strokeWidth="1.8" strokeDasharray="7 4"/>
              <text x={50} y={168} fontSize="10.5" fontWeight="700" fill="#7c3aed">x 32 Transformer Layers</text>

              {/* Attention box */}
              <rect x={50} y={174} width={340} height={76} rx="8"
                fill="rgba(234,88,12,.13)" stroke="#ea580c" strokeWidth="1.5"/>
              <text x={220} y={192} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#ea580c">RMSNorm + GQA Attention</text>
              <text x={220} y={208} textAnchor="middle" fontSize="9" fill="#ea580c">Q: [B, n_q, T, d_k] = [8, 32, 4096, 128]</text>
              <text x={220} y={222} textAnchor="middle" fontSize="9" fill="#ea580c">K: [B, n_kv, T, d_k] = [8, 8, 4096, 128] (~67 MB)</text>
              <text x={220} y={236} textAnchor="middle" fontSize="9" fill="#ea580c">V: [B, n_kv, T, d_k] = [8, 8, 4096, 128] (~67 MB)</text>
              <text x={220} y={249} textAnchor="middle" fontSize="9" fill="#ea580c">Attn Out: [B, T, D] = [8, 4096, 4096] (~268 MB)</text>

              {/* FFN box */}
              <rect x={410} y={174} width={340} height={76} rx="8"
                fill="rgba(202,138,4,.13)" stroke="#ca8a04" strokeWidth="1.5"/>
              <text x={580} y={192} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#ca8a04">RMSNorm + SwiGLU FFN</text>
              <text x={580} y={208} textAnchor="middle" fontSize="9" fill="#ca8a04">Gate: [B, T, d_ff] = [8, 4096, 14336]</text>
              <text x={580} y={222} textAnchor="middle" fontSize="9" fill="#ca8a04">Up:   [B, T, d_ff] = [8, 4096, 14336]</text>
              <text x={580} y={236} textAnchor="middle" fontSize="9" fill="#ca8a04">FFN intermediate ~939 MB in BF16</text>
              <text x={580} y={249} textAnchor="middle" fontSize="9" fill="#ca8a04">Down: [B, T, D]   = [8, 4096, 4096] (~268 MB)</text>

              {/* Hidden states label inside block */}
              <text x={400} y={280} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#7c3aed">
                Hidden states: [B, T, D] = [8, 4096, 4096] after each layer
              </text>
              <text x={400} y={295} textAnchor="middle" fontSize="8.5" fill="#7c3aed" opacity="0.8">
                Residual stream maintained throughout all 32 layers
              </text>
              <text x={400} y={310} textAnchor="middle" fontSize="8.5" fill="#7c3aed" opacity="0.7">
                ~268 MB per layer activation (not all kept in memory simultaneously during forward)
              </text>
              <text x={400} y={325} textAnchor="middle" fontSize="8" fill="#7c3aed" opacity="0.6">
                (during backprop all activations stored: ~32 x 268 MB = ~8.4 GB activation memory)
              </text>

              <line x1={400} y1={350} x2={400} y2={370} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-bd)"/>
              <text x={510} y={364} fontSize="9" fill="#555">LM Head (linear)</text>

              {/* Logits */}
              <rect x={200} y={372} width={400} height={48} rx="8"
                fill="rgba(220,38,38,.13)" stroke="#dc2626" strokeWidth="1.8"/>
              <text x={400} y={392} textAnchor="middle" fontSize="12" fontWeight="700" fill="#dc2626">Logits (LM Head output)</text>
              <text x={400} y={407} textAnchor="middle" fontSize="10" fontWeight="600" fill="#dc2626">[B, T, V] = [8, 4096, 128000]</text>
              <text x={400} y={420} textAnchor="middle" fontSize="8.5" fill="#dc2626" opacity="0.7">~8.4 GB in BF16 — computed in chunks in practice</text>

              <line x1={400} y1={420} x2={400} y2={440} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-bd)"/>
              <text x={510} y={434} fontSize="9" fill="#555">argmax or softmax</text>

              {/* Next token probs */}
              <rect x={210} y={442} width={380} height={34} rx="8"
                fill="rgba(43,91,255,.10)" stroke="#2B5BFF" strokeWidth="1.5"/>
              <text x={400} y={458} textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">Next Token Probabilities</text>
              <text x={400} y={472} textAnchor="middle" fontSize="9.5" fill="#2B5BFF">[B, T, V] = [8, 4096, 128000]  softmax sums to 1.0</text>
            </svg>
          </div>

          {subhead("Teacher Forcing — Labels Are Shifted Input")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 10px", color:"var(--ink)" }}>
              Labels are the input_ids shifted one position to the left. At position <i>i</i>,
              the model sees tokens 0..i and must predict token i+1.
            </p>
            {tbl(<>
              <thead>
                <tr>
                  {th("Position")}
                  {th("0")}
                  {th("1")}
                  {th("2")}
                  {th("3")}
                  {th("4")}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {td(<b>Token string</b>)}
                  {td(<code>"The"</code>)}
                  {td(<code>" capital"</code>)}
                  {td(<code>" of"</code>)}
                  {td(<code>" France"</code>)}
                  {td(<code>" is"</code>)}
                </tr>
                <tr>
                  {td(<b>input_ids[i]</b>)}
                  {td("791")}
                  {td("6864")}
                  {td("315")}
                  {td("9822")}
                  {td("374")}
                </tr>
                <tr>
                  {td(<b>labels[i]</b>)}
                  {td("6864")}
                  {td("315")}
                  {td("9822")}
                  {td("374")}
                  {td("13366")}
                </tr>
                <tr>
                  {td(<b>Predict</b>)}
                  {td(<span style={{color:"#1f9e6b"}}>"capital"</span>)}
                  {td(<span style={{color:"#1f9e6b"}}>"of"</span>)}
                  {td(<span style={{color:"#1f9e6b"}}>"France"</span>)}
                  {td(<span style={{color:"#1f9e6b"}}>"is"</span>)}
                  {td(<span style={{color:"#1f9e6b"}}>"Paris"</span>)}
                </tr>
              </tbody>
            </>)}
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>
              labels[i] = input_ids[i+1]. Padding positions in labels are set to -100
              (PyTorch CrossEntropyLoss ignore_index).
            </div>
          </>)}

          {subhead("Sequence Packing — No Padding Waste")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 8px", color:"var(--ink)" }}>
              Without packing, short documents would be padded to 4096 tokens — wasting
              GPU compute on meaningless zeros. With packing:
            </p>
            <div style={{ overflowX:"auto" }}>
              <svg viewBox="0 0 620 60" style={{ width:"100%", maxWidth:620, height:"auto",
                display:"block" }}>
                {[
                  { x:0,   w:110, label:"Doc A (110 tok)", color:"#2B5BFF", bg:"rgba(43,91,255,.15)" },
                  { x:112, w:8,   label:"EOS", color:"#888", bg:"rgba(0,0,0,.08)" },
                  { x:122, w:220, label:"Doc B (220 tok)", color:"#1f9e6b", bg:"rgba(31,158,107,.15)" },
                  { x:344, w:8,   label:"EOS", color:"#888", bg:"rgba(0,0,0,.08)" },
                  { x:354, w:150, label:"Doc C (150 tok)", color:"#e05c2e", bg:"rgba(224,92,46,.15)" },
                  { x:506, w:8,   label:"EOS", color:"#888", bg:"rgba(0,0,0,.08)" },
                  { x:516, w:100, label:"Doc D...", color:"#7c3aed", bg:"rgba(124,58,237,.15)" },
                ].map((b, i) => (
                  <g key={i}>
                    <rect x={b.x} y={8} width={b.w} height={36} rx="4"
                      fill={b.bg} stroke={b.color} strokeWidth="1.4" />
                    <text x={b.x + b.w/2} y={30} textAnchor="middle"
                      fontSize={b.w < 20 ? "7" : "9"} fill={b.color} fontWeight="600">
                      {b.label}
                    </text>
                  </g>
                ))}
                <text x={620} y={30} textAnchor="end" fontSize="10" fill="var(--muted)">
                  ... 4096 tokens total
                </text>
              </svg>
            </div>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>
              Documents are concatenated with EOS separators, then split at exactly
              4096 tokens — no padding, 100% GPU utilization.
            </div>
          </>)}

          {subhead("Global Batch Size")}
          {info(<>
            <b>Global batch size in practice:</b> Llama 3 used ~4 million tokens per
            gradient step. With sequence length 4096, that is ~1,000 sequences per step.
            This is achieved with 24,000 H100 GPUs using gradient accumulation across
            micro-batches and data parallelism across GPUs.
          </>)}

          <Note>
            <b>Why such large batches?</b> Larger batches give more stable gradient
            estimates, allow higher learning rates, and make better use of distributed
            hardware. The tradeoff: larger batches require more memory and take more
            tokens to converge.
          </Note>
        </>
      )
    },

    // ─── STAGE 5 ───────────────────────────────────────────────────────────────
    {
      id: "forward_pass",
      group: "Algorithm",
      title: "Transformer Forward Pass",
      map: "Forward Pass",
      why: "Understanding the forward pass layer by layer reveals exactly how information flows from raw tokens to next-token predictions.",
      render: () => (
        <>
          <Lead>
            The forward pass transforms a batch of token IDs into a probability distribution
            over the vocabulary at every position. Modern LLMs use a <b>decoder-only
            Transformer</b> (GPT-style) with several key innovations over the original 2017
            architecture: RoPE, GQA, SwiGLU, and RMSNorm.
          </Lead>

          {subhead("Layer-by-Layer Architecture (Llama 3 8B)")}

          <div style={{ overflowX:"auto", marginBottom:18 }}>
            <svg viewBox="0 0 420 520" style={{ width:"100%", maxWidth:420, height:"auto",
              display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              <defs>
                <marker id="arr-fp" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>

              {/* Input tokens */}
              <rect x={110} y={10} width={200} height={40} rx="8"
                fill="rgba(43,91,255,.12)" stroke="#2B5BFF" strokeWidth="1.6"/>
              <text x={210} y={28} textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">Input Token IDs</text>
              <text x={210} y={43} textAnchor="middle" fontSize="9.5" fill="#2B5BFF" opacity="0.8">(B, T) integers</text>

              {/* Arrow */}
              <line x1={210} y1={50} x2={210} y2={68} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-fp)"/>

              {/* Embedding */}
              <rect x={90} y={70} width={240} height={40} rx="8"
                fill="rgba(31,158,107,.12)" stroke="#1f9e6b" strokeWidth="1.6"/>
              <text x={210} y={88} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f9e6b">Token Embedding</text>
              <text x={210} y={103} textAnchor="middle" fontSize="9.5" fill="#1f9e6b" opacity="0.8">128K x 4096 lookup table</text>

              <line x1={210} y1={110} x2={210} y2={128} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-fp)"/>

              {/* RoPE label */}
              <text x={340} y={148} fontSize="9.5" fill="#7c3aed" fontWeight="600">(+ RoPE in attention)</text>

              {/* Transformer block repeated */}
              <rect x={60} y={130} width={280} height={130} rx="10"
                fill="rgba(124,58,237,.06)" stroke="#7c3aed" strokeWidth="1.6" strokeDasharray="6 3"/>
              <text x={80} y={148} fontSize="10" fontWeight="700" fill="#7c3aed">x 32 Transformer Layers</text>

              {/* RMSNorm + Attention */}
              <rect x={80} y={155} width={240} height={36} rx="7"
                fill="rgba(190,24,93,.12)" stroke="#be185d" strokeWidth="1.4"/>
              <text x={200} y={171} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#be185d">RMSNorm + GQA Attention</text>
              <text x={200} y={184} textAnchor="middle" fontSize="9" fill="#be185d" opacity="0.8">32 Q heads, 8 KV heads + RoPE + causal mask</text>

              {/* Residual arrow */}
              <line x1={200} y1={191} x2={200} y2={200} stroke="#555" strokeWidth="1.2" markerEnd="url(#arr-fp)"/>

              {/* RMSNorm + FFN */}
              <rect x={80} y={202} width={240} height={36} rx="7"
                fill="rgba(217,119,6,.12)" stroke="#d97706" strokeWidth="1.4"/>
              <text x={200} y={218} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#d97706">RMSNorm + SwiGLU FFN</text>
              <text x={200} y={231} textAnchor="middle" fontSize="9" fill="#d97706" opacity="0.8">d_ff = 14336 (8/3 x d_model)</text>

              <line x1={210} y1={260} x2={210} y2={280} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-fp)"/>

              {/* Final RMSNorm */}
              <rect x={90} y={282} width={240} height={36} rx="8"
                fill="rgba(5,150,105,.12)" stroke="#059669" strokeWidth="1.6"/>
              <text x={210} y={298} textAnchor="middle" fontSize="11" fontWeight="700" fill="#059669">Final RMSNorm</text>
              <text x={210} y={312} textAnchor="middle" fontSize="9.5" fill="#059669" opacity="0.8">normalize before head</text>

              <line x1={210} y1={318} x2={210} y2={336} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-fp)"/>

              {/* LM Head */}
              <rect x={80} y={338} width={260} height={40} rx="8"
                fill="rgba(220,38,38,.12)" stroke="#dc2626" strokeWidth="1.6"/>
              <text x={210} y={356} textAnchor="middle" fontSize="11" fontWeight="700" fill="#dc2626">LM Head (Linear)</text>
              <text x={210} y={371} textAnchor="middle" fontSize="9.5" fill="#dc2626" opacity="0.8">4096 -&gt; 128K (weight-tied to embedding)</text>

              <line x1={210} y1={378} x2={210} y2={396} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-fp)"/>

              {/* Logits */}
              <rect x={90} y={398} width={240} height={40} rx="8"
                fill="rgba(43,91,255,.12)" stroke="#2B5BFF" strokeWidth="1.6"/>
              <text x={210} y={416} textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">Logits</text>
              <text x={210} y={431} textAnchor="middle" fontSize="9.5" fill="#2B5BFF" opacity="0.8">(B, T, 128K) unnormalized scores</text>

              <line x1={210} y1={438} x2={210} y2={456} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-fp)"/>

              {/* Softmax */}
              <rect x={110} y={458} width={200} height={36} rx="8"
                fill="rgba(31,158,107,.12)" stroke="#1f9e6b" strokeWidth="1.6"/>
              <text x={210} y={476} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f9e6b">Softmax -&gt; Probabilities</text>
              <text x={210} y={490} textAnchor="middle" fontSize="9.5" fill="#1f9e6b" opacity="0.8">(B, T, 128K) sums to 1.0</text>
            </svg>
          </div>

          {subhead("Tensor Shape at Each Step — Llama 3 8B")}

          <div style={{ overflowX:"auto", marginBottom:18 }}>
            {tbl(<>
              <thead>
                <tr>
                  {th("Step")}
                  {th("Tensor Shape")}
                  {th("Size in BF16")}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {td("Input token IDs")}
                  {td(<code>[8, 4096]</code>)}
                  {td("0.07 MB")}
                </tr>
                <tr>
                  {td("After embedding")}
                  {td(<code>[8, 4096, 4096]</code>)}
                  {td("268 MB")}
                </tr>
                <tr>
                  {td("Q projection (per layer)")}
                  {td(<code>[8, 32, 4096, 128]</code>)}
                  {td("268 MB")}
                </tr>
                <tr>
                  {td("K projection (per layer)")}
                  {td(<code>[8, 8, 4096, 128]</code>)}
                  {td("67 MB")}
                </tr>
                <tr>
                  {td("V projection (per layer)")}
                  {td(<code>[8, 8, 4096, 128]</code>)}
                  {td("67 MB")}
                </tr>
                <tr>
                  {td("Attention output")}
                  {td(<code>[8, 4096, 4096]</code>)}
                  {td("268 MB")}
                </tr>
                <tr>
                  {td("FFN intermediate")}
                  {td(<code>[8, 4096, 14336]</code>)}
                  {td("939 MB")}
                </tr>
                <tr>
                  {td("Hidden states")}
                  {td(<code>[8, 4096, 4096]</code>)}
                  {td("268 MB")}
                </tr>
                <tr>
                  {td(<b style={{color:"#dc2626"}}>Logits</b>)}
                  {td(<code>[8, 4096, 128000]</code>)}
                  {td(<b style={{color:"#dc2626"}}>8.4 GB</b>)}
                </tr>
              </tbody>
            </>)}
          </div>

          {info(<>
            <b>Why are the logits so massive?</b> The logits tensor has shape [B, T, V] =
            [8, 4096, 128{","}000]. That is 8 * 4096 * 128000 = ~4.2 billion values. At BF16
            (2 bytes each) that is ~8.4 GB for a single forward pass — larger than the model
            weights themselves. In practice, the logits are <b>never fully materialized</b>:
            the loss is computed in chunks (the cross-entropy kernel consumes logits one
            micro-batch slice at a time) and immediately discarded. Only the scalar loss
            value is retained for the backward pass. During inference (generation), only
            the logits at the <i>last</i> position [B, 1, 128000] are needed — a 4096x reduction.
          </>)}

          {subhead("Key Innovations in Llama-Style Architecture")}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"#7c3aed", marginBottom:6 }}>
              RoPE — Rotary Position Embeddings
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              No absolute position embeddings are added to the input. Instead, RoPE rotates
              the query and key vectors in attention by an angle proportional to position.
              This naturally encodes relative distances and generalizes better to longer
              sequences than absolute position embeddings.
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"#be185d", marginBottom:6 }}>
              GQA — Grouped Query Attention
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Llama 3 8B uses <b>32 query heads</b> but only <b>8 KV heads</b>. Four query
              heads share each key-value head. This reduces the KV cache by 4x without
              significant accuracy loss — critical for serving long-context models efficiently.
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"#d97706", marginBottom:6 }}>
              SwiGLU Feed-Forward Network
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              The FFN uses a gated activation: <b>FFN(x) = (SiLU(x W_gate) circle x W_up) W_down</b>
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
              The gate (SiLU output) controls which information from the up-projection flows
              forward. d_ff = 8/3 * d_model, rounded to a multiple of 64. For 8B: 14,336.
              Three weight matrices instead of two — but empirically better than ReLU FFN.
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"#059669", marginBottom:6 }}>
              RMSNorm — Pre-Norm Architecture
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              RMSNorm(x) = x / RMS(x) * gamma, where RMS(x) = sqrt(mean(x^2)).
              Applied <b>before</b> each sub-layer (pre-norm), not after (post-norm).
              Pre-norm is more stable at large scale and avoids vanishing gradients in
              deep stacks. RMSNorm omits the mean subtraction of LayerNorm — faster and
              equally effective.
            </p>
          </>)}

          {subhead("Causal Masking")}
          {info(<>
            <b>Causal mask:</b> in the attention score matrix, all positions above the
            diagonal are set to -infinity before softmax. This means token at position
            i can only attend to tokens at positions 0..i — it cannot see the future.
            This is what makes the model autoregressive: it predicts one token at a time
            based only on what it has already seen.
          </>)}

          <Note>
            The residual connection formula: x = x + SubLayer(RMSNorm(x)). Residual
            connections allow gradients to flow directly from the loss back through all
            32 layers without vanishing — they are the reason very deep networks can be
            trained at all.
          </Note>
        </>
      )
    },

    // ─── STAGE 6 ───────────────────────────────────────────────────────────────
    {
      id: "loss",
      group: "Algorithm",
      title: "Cross-Entropy Loss — The Training Objective",
      map: "Loss",
      why: "The loss function is the only signal telling the model it is wrong. Understanding it precisely explains what the model is actually optimizing.",
      render: () => (
        <>
          <Lead>
            The entire objective of pre-training is captured in one number: the
            <b> cross-entropy loss</b>. At every token position, the model outputs a
            probability distribution over 128,000 tokens. The loss measures how much
            probability mass the model assigned to the <i>actual</i> next token.
          </Lead>

          {subhead("Why Cross-Entropy?")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Cross-entropy loss is the negative log-likelihood of the correct token:
              <b> loss = -log(p(correct_token))</b>. If the model assigns probability 1.0
              to the correct token, loss = 0. If it assigns 0.01 (1%), loss = -log(0.01) = 4.6.
              The log function heavily penalizes overconfidence in the wrong answer.
            </p>
          </>)}

          {subhead("Loss Computation in Code")}
          {codeBlock(
`logits = model(input_ids)          # shape: (B, T, V)   V=128K vocab
logits_shifted = logits[:, :-1]    # shape: (B, T-1, V) drop last position
labels_shifted = labels[:, 1:]     # shape: (B, T-1)    drop first label

loss = F.cross_entropy(
    logits_shifted.reshape(-1, V),  # (B*(T-1), V)
    labels_shifted.reshape(-1),     # (B*(T-1),)
    ignore_index=-100               # skip padding positions
)`
          )}

          {subhead("Example: Next-Token Prediction")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 8px", color:"var(--ink)" }}>
              Input context: <b>"The capital of France is"</b>
            </p>
            {tbl(<>
              <thead>
                <tr>
                  {th("Candidate next token")}
                  {th("Model probability")}
                  {th("Loss contribution")}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {td(<b>"Paris"</b>, {color:"#059669"})}
                  {td("0.72", {color:"#059669"})}
                  {td("-log(0.72) = 0.33", {color:"#059669"})}
                </tr>
                <tr>
                  {td('"London"')}
                  {td("0.08")}
                  {td("")}
                </tr>
                <tr>
                  {td('"Berlin"')}
                  {td("0.06")}
                  {td("")}
                </tr>
                <tr>
                  {td("(other 127,997 tokens)")}
                  {td("0.14 total")}
                  {td("")}
                </tr>
              </tbody>
            </>)}
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>
              The model assigned 72% probability to "Paris" — loss = 0.33 at this position.
              Early in training, correct-token probability might be ~0.001% — loss ~9.2.
            </div>
          </>)}

          {subhead("Perplexity — The Human-Readable Loss")}
          {info(<>
            <b>Perplexity = exp(loss)</b>. A perplexity of 10 means the model is as
            uncertain as if it had to choose uniformly among 10 equally likely options at
            each token. Good pre-trained models achieve perplexity <b>10-20 on English</b>
            text. Random chance over 128K vocab would be perplexity 128,000.
          </>)}

          {tbl(<>
            <thead>
              <tr>
                {th("Loss value")}
                {th("Perplexity")}
                {th("Interpretation")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("9.2")}
                {td("~10,000")}
                {td("Early training — near random guessing")}
              </tr>
              <tr>
                {td("4.6")}
                {td("~100")}
                {td("Model starting to learn language patterns")}
              </tr>
              <tr>
                {td("2.3")}
                {td("~10")}
                {td("Good — well-trained English model")}
              </tr>
              <tr>
                {td("1.6")}
                {td("~5")}
                {td("Very strong — near human-level text prediction")}
              </tr>
            </tbody>
          </>)}

          <Note>
            The loss is averaged over all non-padding token positions in the batch.
            With 8 sequences of 4096 tokens each, that is up to 32,768 predictions per
            step — each contributing to the gradient signal.
          </Note>
        </>
      )
    },

    // ─── STAGE 7 ───────────────────────────────────────────────────────────────
    {
      id: "backprop",
      group: "Algorithm",
      title: "Backpropagation — How Weights Update",
      map: "Backprop",
      why: "Backprop translates a single loss number into millions of specific nudges — one per parameter — using the chain rule.",
      render: () => (
        <>
          <Lead>
            After the forward pass computes the loss, <b>loss.backward()</b> computes the
            gradient of the loss with respect to every parameter in the model — billions
            of them — using automatic differentiation and the chain rule. Each gradient
            says: "increasing this weight by a small amount would change the loss by
            this much."
          </Lead>

          {subhead("Which Parameters Get Updated?")}
          {tbl(<>
            <thead>
              <tr>
                {th("Parameter")}
                {th("Shape (Llama 3 8B)")}
                {th("Updated?")}
                {th("Weight decay?")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Token embedding table")}
                {td("128K x 4096 = 524M")}
                {td(<span style={{color:"#059669", fontWeight:700}}>Yes</span>)}
                {td("Yes")}
              </tr>
              <tr>
                {td("Q, K, V projections (per layer)")}
                {td("4096 x 4096 each")}
                {td(<span style={{color:"#059669", fontWeight:700}}>Yes</span>)}
                {td("Yes")}
              </tr>
              <tr>
                {td("Output projection O (per layer)")}
                {td("4096 x 4096")}
                {td(<span style={{color:"#059669", fontWeight:700}}>Yes</span>)}
                {td("Yes")}
              </tr>
              <tr>
                {td("FFN gate, up, down (per layer)")}
                {td("4096 x 14336 each")}
                {td(<span style={{color:"#059669", fontWeight:700}}>Yes</span>)}
                {td("Yes")}
              </tr>
              <tr>
                {td("RMSNorm scale gamma (per layer)")}
                {td("4096")}
                {td(<span style={{color:"#059669", fontWeight:700}}>Yes</span>)}
                {td(<span style={{color:"#dc2626", fontWeight:700}}>No</span>)}
              </tr>
              <tr>
                {td("LM head (weight-tied)")}
                {td("128K x 4096")}
                {td(<span style={{color:"#059669", fontWeight:700}}>Yes (shared)</span>)}
                {td("Yes")}
              </tr>
            </tbody>
          </>)}

          {subhead("Parameter Count Breakdown for 7B Model")}
          {card(<>
            {tbl(<>
              <thead>
                <tr>
                  {th("Component")}
                  {th("Params per layer")}
                  {th("x 32 layers")}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {td("Attention (Q+K+V+O)")}
                  {td("4 x 4096^2 = 67M")}
                  {td("2.15B")}
                </tr>
                <tr>
                  {td("FFN (gate+up+down)")}
                  {td("3 x 4096 x 14336 = 176M")}
                  {td("5.64B")}
                </tr>
                <tr>
                  {td("RMSNorm")}
                  {td("2 x 4096 = 8K")}
                  {td("~0.5M")}
                </tr>
                <tr>
                  {td("Embedding table")}
                  {td("(shared) 524M")}
                  {td("—")}
                </tr>
              </tbody>
            </>)}
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>
              Total ~7B parameters. With Adam optimizer: param (2B) + grad (2B) + m (4B) + v (4B)
              = 16 bytes/param = ~112GB for optimizer states alone.
            </div>
          </>)}

          {subhead("Gradient Clipping")}
          {codeBlock(
`# After backward(), before optimizer.step()
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
# Scales all gradients proportionally if global L2 norm > 1.0`
          )}
          {info(<>
            <b>Why clip?</b> Occasionally a bad batch causes an extremely large gradient
            that would blow up the weights. Clipping rescales the entire gradient vector
            to have L2 norm exactly 1.0 (if it exceeds it), preserving direction but
            preventing catastrophic updates. Gradient norm spikes more than 10x the
            running average are a sign of training instability.
          </>)}

          {warn(
            "With BF16 training, gradients are computed in BF16 but accumulated in FP32 for numerical stability. The optimizer step (Adam moment updates) happens in FP32. This is called 'mixed precision' training."
          )}

          <Note>
            Backpropagation through 32 Transformer layers requires storing all intermediate
            activations from the forward pass. For a 7B model with batch size 8 and
            sequence length 4096, this is several hundred GB — which is why activation
            checkpointing (Stage 11) is essential.
          </Note>
        </>
      )
    },

    // ─── STAGE 8 ───────────────────────────────────────────────────────────────
    {
      id: "optimizer",
      group: "Algorithm",
      title: "AdamW — The LLM Optimizer",
      map: "Optimizer",
      why: "AdamW is the de facto standard for LLM training — understanding why it works reveals the core of gradient-based optimization.",
      render: () => (
        <>
          <Lead>
            AdamW (Adam with decoupled weight decay) is the optimizer used by essentially
            every major LLM. It adapts the learning rate per-parameter using first and
            second moment estimates of the gradient — making it robust to the vast
            differences in gradient magnitude across a 7B-parameter model.
          </Lead>

          {subhead("The Update Step — All Variables")}
          {card(<>
            <div style={{ fontFamily:"monospace", fontSize:13, lineHeight:2.2, color:"var(--ink)" }}>
              <div><b style={{color:"#2B5BFF"}}>g_t</b> = gradient at step t</div>
              <div><b style={{color:"#1f9e6b"}}>m_t</b> = beta1 * m_(t-1) + (1-beta1) * g_t &nbsp;&nbsp; <span style={{color:"var(--muted)"}}>// first moment (momentum)</span></div>
              <div><b style={{color:"#e05c2e"}}>v_t</b> = beta2 * v_(t-1) + (1-beta2) * g_t^2 &nbsp; <span style={{color:"var(--muted)"}}>// second moment (RMS)</span></div>
              <div><b style={{color:"#7c3aed"}}>m_hat</b> = m_t / (1 - beta1^t) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style={{color:"var(--muted)"}}>// bias correction</span></div>
              <div><b style={{color:"#be185d"}}>v_hat</b> = v_t / (1 - beta2^t)</div>
              <div><b style={{color:"#dc2626"}}>theta</b> = theta - lr * m_hat / (sqrt(v_hat) + eps) - lr * wd * theta</div>
            </div>
          </>)}

          {subhead("Hyperparameters — Standard LLM Values")}
          {tbl(<>
            <thead>
              <tr>
                {th("Hyperparameter")}
                {th("Value")}
                {th("What it controls")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td(<b>beta1</b>)}
                {td("0.9")}
                {td("Exponential decay for first moment — smooths gradient direction")}
              </tr>
              <tr>
                {td(<b>beta2</b>)}
                {td("0.95")}
                {td("Exponential decay for second moment — estimates gradient magnitude")}
              </tr>
              <tr>
                {td(<b>eps (epsilon)</b>)}
                {td("1e-8")}
                {td("Prevents division by zero when v_hat is tiny")}
              </tr>
              <tr>
                {td(<b>weight_decay</b>)}
                {td("0.1")}
                {td("L2 regularization — pulls weights toward zero; prevents bloat")}
              </tr>
              <tr>
                {td(<b>lr (peak)</b>)}
                {td("3e-4 (small) / 1e-4 (large)")}
                {td("Step size; scaled down by v_hat per parameter")}
              </tr>
            </tbody>
          </>)}

          {subhead("Why Weight Decay on Weights but NOT Biases/Norms?")}
          {card(<>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:22, color:"var(--ink)" }}>
              <li><b>Biases:</b> Typically small scalars that shift activations. Decaying
                them toward zero provides little benefit and can hurt performance.</li>
              <li><b>RMSNorm gamma:</b> Must be free to scale freely — if decayed toward
                zero, the norm collapses and activations lose their dynamic range.</li>
              <li><b>Weight matrices:</b> Can grow arbitrarily large without constraint.
                Weight decay prevents this growth, acts as implicit regularization,
                and improves generalization.</li>
            </ul>
          </>)}

          {subhead("Memory Cost Per Parameter")}
          {info(<>
            <b>Full FP32 Adam requires 16 bytes per parameter:</b>
            parameter (4B FP32) + gradient (4B FP32) + first moment m (4B FP32) +
            second moment v (4B FP32) = 16 bytes. For a 7B model: 112GB just for
            optimizer states. This is why large models require model parallelism and
            mixed precision training.
          </>)}

          <Note>
            The second moment v_t estimates the per-parameter gradient variance. Parameters
            with consistently large gradients get smaller effective learning rates (v_hat
            is large in denominator). Parameters with small, noisy gradients get relatively
            larger effective learning rates. This per-parameter adaptation is why Adam
            outperforms SGD on heterogeneous architectures like Transformers.
          </Note>
        </>
      )
    },

    // ─── STAGE 9 ───────────────────────────────────────────────────────────────
    {
      id: "lr_schedule",
      group: "Algorithm",
      title: "Learning Rate Schedule — Warmup + Cosine Decay",
      map: "LR Schedule",
      why: "The learning rate schedule is as important as the optimizer — too high causes instability, too low means slow convergence.",
      render: () => (
        <>
          <Lead>
            The learning rate is not fixed — it follows a two-phase schedule: a linear
            <b> warmup</b> from 0 to the peak LR, followed by a <b>cosine decay</b> from
            the peak down to 1/20th of the peak. This schedule is used by GPT-3, Llama,
            PaLM, and essentially every modern LLM.
          </Lead>

          {subhead("LR Schedule Visualization")}
          <div style={{ overflowX:"auto", marginBottom:18 }}>
            <svg viewBox="0 0 580 200" style={{ width:"100%", maxWidth:580, height:"auto",
              display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              <defs>
                <marker id="arr-lr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="var(--muted)" />
                </marker>
              </defs>

              {/* Axes */}
              <line x1={50} y1={160} x2={550} y2={160} stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#arr-lr)"/>
              <line x1={50} y1={160} x2={50} y2={20} stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#arr-lr)"/>

              {/* Axis labels */}
              <text x={300} y={185} textAnchor="middle" fontSize="11" fill="var(--muted)">Training Steps</text>
              <text x={16} y={90} textAnchor="middle" fontSize="10" fill="var(--muted)"
                transform="rotate(-90,16,90)">Learning Rate</text>

              {/* Warmup phase: 0 -> peak (steps 0 to ~100 = x:50 to x:150) */}
              <path d="M 50,160 L 150,35"
                fill="none" stroke="#2B5BFF" strokeWidth="2.4"/>

              {/* Cosine decay phase: peak to min (x:150 to x:540) */}
              <path d="M 150,35 C 200,35 250,40 300,60 C 380,100 440,130 540,148"
                fill="none" stroke="#e05c2e" strokeWidth="2.4"/>

              {/* Peak marker */}
              <circle cx={150} cy={35} r={4} fill="#2B5BFF"/>
              <text x={155} y={30} fontSize="10" fill="#2B5BFF" fontWeight="700">Peak LR</text>
              <text x={155} y={42} fontSize="9.5" fill="#2B5BFF" opacity="0.8">(e.g. 1e-4)</text>

              {/* Warmup region label */}
              <text x={100} y={100} textAnchor="middle" fontSize="10" fill="#2B5BFF" fontWeight="700">Warmup</text>
              <text x={100} y={114} textAnchor="middle" fontSize="9.5" fill="#2B5BFF" opacity="0.8">~1000-2000 steps</text>
              <text x={100} y={126} textAnchor="middle" fontSize="9.5" fill="#2B5BFF" opacity="0.8">linear 0 -> peak</text>

              {/* Cosine decay region label */}
              <text x={340} y={80} textAnchor="middle" fontSize="10" fill="#e05c2e" fontWeight="700">Cosine Decay</text>
              <text x={340} y={94} textAnchor="middle" fontSize="9.5" fill="#e05c2e" opacity="0.8">peak -> peak/20</text>

              {/* Final LR label */}
              <text x={545} y={144} fontSize="9.5" fill="var(--muted)">LR_min</text>
              <text x={545} y={156} fontSize="9" fill="var(--muted)">(peak/20)</text>

              {/* Warmup boundary dashed line */}
              <line x1={150} y1={35} x2={150} y2={160} stroke="#aaa" strokeWidth="1.2" strokeDasharray="4 3"/>
              <text x={152} y={172} fontSize="9.5" fill="#aaa">warmup end</text>
            </svg>
          </div>

          {subhead("Why Warmup?")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              At the very start of training, the model weights are random (or poorly initialized).
              Gradients are noisy and poorly conditioned. Starting with a high learning rate
              would cause catastrophically large updates that destroy any structure learned
              in the first few steps.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"8px 0 0", color:"var(--ink)" }}>
              Linear warmup allows Adam's moment estimates to stabilize before taking large
              steps. Adam's second moment v_t starts at zero and converges over ~1/(1-beta2)
              = ~20 steps — warmup gives this time to stabilize.
            </p>
          </>)}

          {subhead("Why Cosine Decay?")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              A constant LR toward the end of training causes the model to oscillate around
              the minimum rather than settling into it. Cosine decay provides a smooth,
              gradual reduction that lets the model converge tightly. The minimum LR is
              set to peak/20 (not zero) to avoid making the optimizer effectively stop.
            </p>
          </>)}

          {subhead("LR Schedule Comparison")}
          {tbl(<>
            <thead>
              <tr>
                {th("Schedule")}
                {th("Pros")}
                {th("Cons")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Constant LR")}
                {td("Simple, reproducible")}
                {td("Oscillates near minimum; poor final accuracy")}
              </tr>
              <tr>
                {td("Step decay")}
                {td("Simple steps down at milestones")}
                {td("Abrupt drops; sensitive to milestone choice")}
              </tr>
              <tr>
                {td("Cosine with warmup")}
                {td("Smooth; empirically best for LLMs")}
                {td("Requires knowing total steps upfront")}
              </tr>
              <tr>
                {td("WSD (warmup-stable-decay)")}
                {td("Allows extending training after stable phase")}
                {td("Newer; used by Mistral and some Llama variants")}
              </tr>
            </tbody>
          </>)}

          {codeBlock(
`def get_lr(step, warmup_steps=2000, total_steps=1_000_000,
           lr_max=1e-4, lr_min=5e-6):
    if step < warmup_steps:
        return lr_max * step / warmup_steps
    # Cosine decay
    progress = (step - warmup_steps) / (total_steps - warmup_steps)
    return lr_min + 0.5 * (lr_max - lr_min) * (1 + math.cos(math.pi * progress))`
          )}

          <Note>
            Llama 3 used a peak LR of 3e-4 for smaller models and 1e-4 for larger ones.
            Typical warmup: 1,000-2,000 steps. The cosine decay runs over the remaining
            millions of training steps.
          </Note>
        </>
      )
    },

    // ─── STAGE 10 ──────────────────────────────────────────────────────────────
    {
      id: "scaling_laws",
      group: "Concepts",
      title: "Scaling Laws and Chinchilla-Optimal Training",
      map: "Scaling Laws",
      why: "Scaling laws tell you exactly how much data and compute you need before spending millions of dollars on a training run.",
      render: () => (
        <>
          <Lead>
            In 2022, DeepMind published the Chinchilla paper showing that most LLMs of
            the time (including GPT-3) were significantly <b>undertrained</b> relative to
            their model size. The compute-optimal ratio: <b>train tokens = 20 x num_params</b>.
            This finding reshaped every subsequent large model training run.
          </Lead>

          {subhead("Chinchilla-Optimal Training Tokens")}
          {tbl(<>
            <thead>
              <tr>
                {th("Model Size")}
                {th("Chinchilla-Optimal Tokens")}
                {th("FLOPs (6 x N x D)")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("1B parameters")}
                {td("~20B tokens")}
                {td("~1.2 x 10^20")}
              </tr>
              <tr>
                {td("7B parameters")}
                {td("~140B tokens")}
                {td("~5.9 x 10^21")}
              </tr>
              <tr>
                {td("13B parameters")}
                {td("~260B tokens")}
                {td("~2.0 x 10^22")}
              </tr>
              <tr>
                {td("70B parameters")}
                {td("~1.4T tokens")}
                {td("~5.9 x 10^23")}
              </tr>
              <tr>
                {td("405B parameters")}
                {td("~8.1T tokens")}
                {td("~1.0 x 10^25")}
              </tr>
            </tbody>
          </>)}

          {subhead("Why Llama 3 8B Was Overtrained")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Llama 3 8B was trained on <b>15 trillion tokens</b> — over 100x the
              Chinchilla-optimal 140B tokens. This is not a mistake; it is a deliberate
              strategy called <b>inference-time compute optimization</b>.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"8px 0 0", color:"var(--ink)" }}>
              Chinchilla-optimal minimizes training FLOPs. But a 8B model trained on 15T
              tokens is cheaper to serve than a 70B model trained on 1.4T tokens, even if
              both achieve the same accuracy. Since inference runs billions of times, the
              smaller, overtrained model wins economically.
            </p>
          </>)}

          {subhead("The FLOP Formula")}
          {info(<>
            <b>FLOPs = 6 x N x D</b>, where N = number of parameters and D = number of
            training tokens. The factor of 6 accounts for: forward pass (2 FLOPs per
            multiply-add), backward pass (approximately 4 FLOPs per multiply-add for
            gradient and activation computation). This formula is accurate to within ~5%
            for dense Transformer models.
          </>)}

          {subhead("Emergent Capabilities at Scale")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 8px", color:"var(--ink)" }}>
              Some capabilities appear suddenly above certain scales — they are not present
              at smaller sizes and then gradually improve; they jump from near-zero to
              functional:
            </p>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:22, color:"var(--ink)" }}>
              <li><b>In-context learning:</b> Learning from examples in the prompt without
                gradient updates — emerges around 10B parameters</li>
              <li><b>Chain-of-thought reasoning:</b> Step-by-step problem decomposition —
                emerges around 100B parameters (or with fine-tuning at smaller scales)</li>
              <li><b>Multi-step arithmetic:</b> Reliable multi-digit arithmetic emerges
                with sufficient scale and code training data</li>
            </ul>
          </>)}

          {subhead("Scaling Law Formula")}
          {codeBlock(
`# Kaplan et al. (2020) neural scaling law:
# L(N, D) = A/N^alpha + B/D^beta + L_inf
# where L is cross-entropy loss, N=params, D=tokens
# alpha ~ 0.076, beta ~ 0.095 (Chinchilla estimates)

# Chinchilla-optimal split (equal FLOP allocation):
optimal_tokens = 20 * num_params
optimal_params = total_flops / (6 * optimal_tokens)`
          )}

          <Note>
            Scaling laws are empirical power laws fit to experimental data. They hold
            remarkably well across 7 orders of magnitude of compute, from small models
            to GPT-4 scale — one of the most striking regularities in modern deep learning.
          </Note>
        </>
      )
    },

    // ─── STAGE 11 ──────────────────────────────────────────────────────────────
    {
      id: "tricks",
      group: "Concepts",
      title: "BF16, Activation Checkpointing and Stability Tricks",
      map: "Stability",
      why: "These engineering techniques are what make training billion-parameter models feasible on real hardware without running out of memory or exploding.",
      render: () => (
        <>
          <Lead>
            Training LLMs at scale requires engineering tricks beyond the basic algorithm.
            BF16 halves memory per parameter, activation checkpointing reduces activation
            memory by 70%, and gradient clipping prevents catastrophic divergence. Together
            they make the difference between a training run that works and one that crashes.
          </Lead>

          {subhead("BF16 vs FP16 — Why BF16 Won")}
          {tbl(<>
            <thead>
              <tr>
                {th("Format")}
                {th("Total bits")}
                {th("Exponent bits")}
                {th("Mantissa bits")}
                {th("Max value")}
                {th("Overflow risk")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("FP32")}
                {td("32")}
                {td("8")}
                {td("23")}
                {td("~3.4 x 10^38")}
                {td(<span style={{color:"#059669"}}>None</span>)}
              </tr>
              <tr>
                {td("FP16")}
                {td("16")}
                {td("5")}
                {td("10")}
                {td("~65,504")}
                {td(<span style={{color:"#dc2626", fontWeight:700}}>High (Inf/NaN)</span>)}
              </tr>
              <tr>
                {td(<b>BF16</b>)}
                {td("16")}
                {td(<b>8 (same as FP32)</b>)}
                {td("7")}
                {td("~3.4 x 10^38")}
                {td(<span style={{color:"#059669", fontWeight:700}}>Virtually none</span>)}
              </tr>
            </tbody>
          </>)}

          {info(<>
            <b>BF16 = Brain Float 16</b>, developed by Google Brain. By keeping the same
            8 exponent bits as FP32, BF16 can represent the same range of magnitudes —
            just with less precision. For neural network training, range matters more than
            precision (gradients span many orders of magnitude). FP16's tiny range causes
            gradient overflow (loss spikes to Inf/NaN). BF16 is standard on A100/H100 GPUs.
          </>)}

          {subhead("Activation Checkpointing")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 8px", color:"var(--ink)" }}>
              Backpropagation requires the activations from the forward pass to compute
              gradients. For a 7B model with batch size 8 and seq_len 4096, storing ALL
              activations requires hundreds of GB.
            </p>
            {tbl(<>
              <thead>
                <tr>
                  {th("Strategy")}
                  {th("Memory")}
                  {th("Compute cost")}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {td("Store all activations")}
                  {td("~300GB (7B model, bs=8)")}
                  {td("1x (baseline)")}
                </tr>
                <tr>
                  {td(<b>Activation checkpointing</b>)}
                  {td(<b>~90GB (-70%)</b>)}
                  {td(<b>~1.33x (+33% recompute)</b>)}
                </tr>
                <tr>
                  {td("No stored activations")}
                  {td("~1GB")}
                  {td("~2x (full recompute)")}
                </tr>
              </tbody>
            </>)}
            <p style={{ fontSize:13, lineHeight:1.7, margin:"8px 0 0", color:"var(--ink)" }}>
              <b>Mechanism:</b> Only store activations at "checkpoint" boundaries (e.g., every
              4 layers). During backward pass, recompute the activations within each segment
              on demand. This trades 33% extra compute for 70% memory savings.
            </p>
          </>)}

          {subhead("Gradient Norm Monitoring")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Log the gradient norm every step. A healthy training run shows a gradually
              decreasing gradient norm. Warning signs:
            </p>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:"8px 0 0", paddingLeft:22, color:"var(--ink)" }}>
              <li><b>Spike more than 10x the running average:</b> Loss spike incoming.
                Check for bad batches (corrupted data, NaN inputs).</li>
              <li><b>Norm clipped nearly every step:</b> Learning rate too high, or
                model initialization too large.</li>
              <li><b>Norm near zero:</b> Vanishing gradients — check for very small
                learning rate or saturated activations.</li>
            </ul>
          </>)}

          {subhead("Other Stability Techniques")}
          {tbl(<>
            <thead>
              <tr>
                {th("Technique")}
                {th("Purpose")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("QK normalization")}
                {td("Apply RMSNorm to Q and K before attention — prevents attention entropy collapse")}
              </tr>
              <tr>
                {td("z-loss")}
                {td("Auxiliary loss penalizing large logit magnitudes — stabilizes softmax")}
              </tr>
              <tr>
                {td("Gradient accumulation")}
                {td("Accumulate gradients over micro-batches before updating — enables larger effective batch sizes")}
              </tr>
              <tr>
                {td("Loss spike recovery")}
                {td("Roll back to checkpoint before spike; reduce LR by 10x; resume with different data ordering")}
              </tr>
            </tbody>
          </>)}

          <Note>
            BF16 is not supported on all hardware. NVIDIA V100 and older GPUs do not
            support BF16 hardware acceleration — those runs use FP16 with loss scaling.
            A100 and H100 support BF16 natively and it is the default for all modern runs.
          </Note>
        </>
      )
    },

    // ─── STAGE: Evaluation ─────────────────────────────────────────────────────
    {
      id: "evaluation",
      group: "Evaluation",
      title: "Evaluating a Pre-Trained Model",
      map: "Evaluation",
      why: "Loss going down is necessary but not sufficient. You evaluate a base model with perplexity plus a broad benchmark suite run at checkpoints — and you must guard against benchmark contamination.",
      render: () => (
        <>
          <Lead>
            A base model is evaluated two ways: with intrinsic language-modeling metrics
            that measure how well it predicts text, and with downstream benchmark accuracy
            that measures what it can actually do.
          </Lead>

          {subhead("Perplexity — The Core Intrinsic Metric")}
          {card(
            <>
              <p style={{ margin:"0 0 8px" }}>
                Perplexity is the exponential of the cross-entropy loss measured on a
                held-out set; lower is better. Intuitively it is the average branching
                factor — how many tokens the model is effectively "choosing between" at
                each step. A good English language model scores roughly 10–20.
              </p>
              {codeBlock("perplexity = exp(mean(cross_entropy_per_token))")}
              <p style={{ margin:"8px 0 0" }}>
                Because perplexity depends on the tokenizer, a tokenizer-independent
                alternative is bits-per-byte (bpb), which normalizes the loss by the
                number of raw bytes rather than by tokens.
              </p>
            </>
          )}

          {subhead("Benchmark Suite (run at checkpoints)")}
          {tbl(
            <>
              <thead>
                <tr>
                  {th("Benchmark")}
                  {th("Tests")}
                  {th("Metric")}
                  {th("Example")}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {td("MMLU")}
                  {td("Knowledge, 57 subjects")}
                  {td("accuracy")}
                  {td("multiple-choice")}
                </tr>
                <tr>
                  {td("HellaSwag")}
                  {td("Commonsense")}
                  {td("accuracy")}
                  {td("multiple-choice")}
                </tr>
                <tr>
                  {td("ARC")}
                  {td("Science reasoning")}
                  {td("accuracy")}
                  {td("multiple-choice")}
                </tr>
                <tr>
                  {td("GSM8K")}
                  {td("Grade-school math")}
                  {td("exact-match")}
                  {td("word problems")}
                </tr>
                <tr>
                  {td("MATH")}
                  {td("Competition math")}
                  {td("exact-match")}
                  {td("contest problems")}
                </tr>
                <tr>
                  {td("HumanEval")}
                  {td("Code")}
                  {td("pass@k")}
                  {td("function completion")}
                </tr>
                <tr>
                  {td("TruthfulQA")}
                  {td("Truthfulness")}
                  {td("accuracy")}
                  {td("question answering")}
                </tr>
                <tr>
                  {td("WinoGrande")}
                  {td("Coreference")}
                  {td("accuracy")}
                  {td("pronoun resolution")}
                </tr>
              </tbody>
            </>
          )}

          {subhead("pass@k for Code")}
          {card(
            <>
              <p style={{ margin:"0 0 8px" }}>
                pass@k is the probability that at least one of k sampled completions
                passes the unit tests. To estimate it with low variance you generate
                n > k samples, count how many are correct, and use the unbiased
                estimator:
              </p>
              {codeBlock("pass@k = 1 - C(n-c, k) / C(n, k)")}
              <p style={{ margin:"8px 0 0" }}>
                where n = samples generated and c = number correct. This avoids the high
                variance of generating exactly k samples and checking them directly.
              </p>
            </>
          )}

          {subhead("Emergent Capabilities")}
          {card(
            <p style={{ margin:0 }}>
              Some benchmarks — particularly multi-step reasoning and in-context
              learning — stay near random performance until the model crosses a scale
              threshold, then jump sharply. Because of this, a single small-scale
              evaluation can be misleading; evaluate across multiple model scales to see
              where capabilities emerge.
            </p>
          )}

          {subhead("Benchmark Contamination")}
          {warn(
            <>
              If benchmark text leaks into the training data, scores are inflated and
              become meaningless — the model is recalling answers rather than
              generalizing. Mitigations include n-gram overlap detection between train and
              test sets, embedding canary strings in benchmarks, maintaining held-out
              private evals, and running decontamination passes over the training corpus.
            </>
          )}

          {info(
            <>
              Track perplexity continuously throughout training, but run the expensive
              benchmark suite only every N thousand steps at checkpoints.
            </>
          )}
        </>
      )
    },

    // ─── STAGE 13 ──────────────────────────────────────────────────────────────
    {
      id: "production_template",
      group: "Code",
      title: "Production Pre-Training Template",
      map: "Code Template",
      why: "A minimal but complete pre-training script cements all previous concepts and shows how they connect in real code.",
      render: () => (
        <>
          <Lead>
            All 11 preceding stages come together in a training loop. This template shows
            the essential components of a production pre-training run: model init, data
            loading, mixed precision, the optimizer and scheduler, gradient clipping,
            loss logging, and checkpointing.
          </Lead>

          {subhead("Complete Minimal Pre-Training Script")}
          {codeBlock(
`import math, torch, torch.nn.functional as F
from torch.cuda.amp import autocast, GradScaler
from transformers import AutoTokenizer, LlamaForCausalLM, LlamaConfig

# ── 1. Config ─────────────────────────────────────────────────────────
config = LlamaConfig(
    vocab_size=128_000,
    hidden_size=4096,
    intermediate_size=14336,
    num_hidden_layers=32,
    num_attention_heads=32,
    num_key_value_heads=8,      # GQA: 8 KV heads
    max_position_embeddings=4096,
)

# ── 2. Model & Optimizer ──────────────────────────────────────────────
model = LlamaForCausalLM(config).to("cuda")

# Separate weight decay: apply only to weight matrices, not biases/norms
decay_params = [p for n, p in model.named_parameters()
                if p.ndim >= 2]
no_decay_params = [p for n, p in model.named_parameters()
                   if p.ndim < 2]

optimizer = torch.optim.AdamW([
    {"params": decay_params,    "weight_decay": 0.1},
    {"params": no_decay_params, "weight_decay": 0.0},
], lr=1e-4, betas=(0.9, 0.95), eps=1e-8)

# ── 3. LR Schedule (cosine with warmup) ───────────────────────────────
WARMUP = 2000
TOTAL  = 1_000_000
LR_MAX, LR_MIN = 1e-4, 5e-6

def get_lr(step):
    if step < WARMUP:
        return LR_MAX * step / WARMUP
    t = (step - WARMUP) / (TOTAL - WARMUP)
    return LR_MIN + 0.5 * (LR_MAX - LR_MIN) * (1 + math.cos(math.pi * t))

# ── 4. Training Loop ──────────────────────────────────────────────────
scaler = GradScaler()   # for BF16/FP16 mixed precision
model.train()

for step, batch in enumerate(dataloader):
    # Update LR
    lr = get_lr(step)
    for g in optimizer.param_groups:
        g["lr"] = lr

    input_ids = batch["input_ids"].to("cuda")   # (B, T)
    labels    = batch["labels"].to("cuda")       # (B, T), padding=-100

    # Forward pass in BF16
    with autocast(dtype=torch.bfloat16):
        logits = model(input_ids).logits         # (B, T, V)
        logits_s = logits[:, :-1].reshape(-1, config.vocab_size)
        labels_s = labels[:, 1:].reshape(-1)
        loss = F.cross_entropy(logits_s, labels_s, ignore_index=-100)

    # Backward + grad clipping
    scaler.scale(loss).backward()
    scaler.unscale_(optimizer)
    grad_norm = torch.nn.utils.clip_grad_norm_(
        model.parameters(), max_norm=1.0
    )
    scaler.step(optimizer)
    scaler.update()
    optimizer.zero_grad(set_to_none=True)

    # Logging
    if step % 100 == 0:
        ppl = math.exp(loss.item())
        print(f"step={step} loss={loss.item():.4f} "
              f"ppl={ppl:.1f} gnorm={grad_norm:.3f} lr={lr:.2e}")

    # Checkpoint every 1000 steps
    if step % 1000 == 0:
        torch.save({
            "step": step,
            "model": model.state_dict(),
            "optimizer": optimizer.state_dict(),
        }, f"checkpoint-{step}.pt")`
          )}

          {subhead("Key Hyperparameter Summary")}
          {tbl(<>
            <thead>
              <tr>
                {th("Hyperparameter")}
                {th("Value")}
                {th("Purpose")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("vocab_size")}
                {td("128,000")}
                {td("BPE vocabulary — number of unique tokens")}
              </tr>
              <tr>
                {td("hidden_size")}
                {td("4,096")}
                {td("d_model — embedding and residual stream dimension")}
              </tr>
              <tr>
                {td("intermediate_size")}
                {td("14,336")}
                {td("FFN d_ff = 8/3 x 4096, rounded to multiple of 64")}
              </tr>
              <tr>
                {td("num_hidden_layers")}
                {td("32")}
                {td("Transformer depth — more layers = more capacity")}
              </tr>
              <tr>
                {td("num_attention_heads")}
                {td("32")}
                {td("Query heads — each attends to different subspace")}
              </tr>
              <tr>
                {td("num_key_value_heads")}
                {td("8")}
                {td("GQA: 4 query heads share each KV head")}
              </tr>
              <tr>
                {td("max_position_embeddings")}
                {td("4,096")}
                {td("Context window — tokens model can attend to")}
              </tr>
              <tr>
                {td("betas")}
                {td("(0.9, 0.95)")}
                {td("Adam moment decay rates")}
              </tr>
              <tr>
                {td("weight_decay")}
                {td("0.1")}
                {td("L2 regularization on weight matrices only")}
              </tr>
              <tr>
                {td("max_grad_norm")}
                {td("1.0")}
                {td("Gradient clipping threshold")}
              </tr>
            </tbody>
          </>)}

          {subhead("What Comes Next")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 8px", color:"var(--ink)" }}>
              Pre-training produces a <b>base model</b> — a next-token predictor with broad
              knowledge but no instruction-following ability. The subsequent stages transform
              it into a useful assistant:
            </p>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:22, color:"var(--ink)" }}>
              <li><b>Distributed Training</b> — how to train across thousands of GPUs
                with tensor parallelism, pipeline parallelism, and ZeRO optimizer</li>
              <li><b>Post-Training (RLHF/DPO)</b> — supervised fine-tuning + reward
                modeling + PPO or Direct Preference Optimization to align the model</li>
              <li><b>Reasoning Models</b> — chain-of-thought training, process reward
                models, and test-time compute scaling</li>
              <li><b>Production and Safety</b> — quantization (GPTQ, AWQ), serving
                infrastructure, safety evals, and red-teaming</li>
            </ul>
          </>)}

          {info(<>
            <b>This article is part of the LLM Training series on Neural Codex.</b>
            Navigate between series articles using the mode links above. Each article
            builds on the previous: Pre-Training lays the foundation that all subsequent
            stages depend on.
          </>)}

          <Note>
            The script above uses HuggingFace Transformers for the model definition and
            PyTorch native training for maximum transparency. Production runs at scale add
            FSDP or Megatron-LM for parallelism, custom CUDA kernels (FlashAttention-2),
            and fault-tolerant checkpointing — covered in the Distributed Training article.
          </Note>
        </>
      )
    },

  ];

  window.ML_META = {
    title: "LLM Pre-Training",
    subtitle: "How language models learn from raw text — from bytes to GPT",
    cur: "Pre-Training",
    category: "LLM Training",
    run: () => ({}),
    default: {},
    renderInput: null,
    modeLinks: [
      { label: "Pre-Training",  href: "LLM-PreTraining.html",        active: true  },
      { label: "Distributed",   href: "Distributed-Training.html",   active: false },
      { label: "Quantization",  href: "Quantization.html",           active: false },
      { label: "MoE",           href: "Mixture-of-Experts.html",     active: false },
      { label: "Post-Training", href: "Post-Training.html",          active: false },
      { label: "Distillation",  href: "Knowledge-Distillation.html", active: false },
      { label: "Embeddings",    href: "Embedding-Models.html",       active: false },
      { label: "Reasoning",     href: "Reasoning-Models.html",       active: false },
      { label: "Inference",     href: "Inference-Serving.html",     active: false },
      { label: "Production",    href: "Production-Safety.html",       active: false },
    ]
  };
  window.ML_STAGES = STAGES;
})();
