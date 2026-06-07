/* ============================================================
   Embedding Models — stages-embeddings.jsx (11 stages)
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

    // ─── STAGE 1 · overview ────────────────────────────────────
    {
      id: "overview",
      group: "Overview",
      title: "What Are Embedding Models?",
      map: "Concept",
      why: "Computers cannot reason about raw text directly. Embedding models convert text into numbers that capture meaning — the foundation of semantic search, RAG, clustering, and recommendation.",
      render: () => (
        <>
          <Lead>
            An <b>embedding model</b> maps a piece of text — a word, a sentence, or a
            whole document — to a <b>fixed-length dense vector</b> of floating-point
            numbers. The defining property is that <b>semantically similar texts land
            near each other</b> in this vector space. A generative LLM outputs more
            <i> text</i>; an embedding model outputs a single vector — a
            &quot;meaning fingerprint&quot; for the input.
          </Lead>

          {subhead("Similar meaning → nearby vectors")}
          <svg width="100%" viewBox="0 0 720 260" style={{display:"block", marginBottom:16, maxWidth:720}}>
            <defs>
              <marker id="arr1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#888" />
              </marker>
            </defs>
            {/* sentences */}
            <rect x="8" y="20" width="150" height="34" rx="8" fill="#e8ffe8" stroke="#1a8a1a" strokeWidth="1.3"/>
            <text x="83" y="41" textAnchor="middle" fontSize="11.5" fill="#1a6a1a">&quot;a dog runs&quot;</text>
            <rect x="8" y="110" width="150" height="34" rx="8" fill="#e8ffe8" stroke="#1a8a1a" strokeWidth="1.3"/>
            <text x="83" y="131" textAnchor="middle" fontSize="11.5" fill="#1a6a1a">&quot;a puppy sprints&quot;</text>
            <rect x="8" y="200" width="150" height="34" rx="8" fill="#fff3e8" stroke="#c06000" strokeWidth="1.3"/>
            <text x="83" y="221" textAnchor="middle" fontSize="11" fill="#a04000">&quot;stock market crashes&quot;</text>

            {/* model */}
            <rect x="210" y="95" width="110" height="64" rx="10" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5"/>
            <text x="265" y="123" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">Embedding</text>
            <text x="265" y="139" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">Model</text>

            <line x1="158" y1="37" x2="208" y2="115" stroke="#888" strokeWidth="1.5" markerEnd="url(#arr1)"/>
            <line x1="158" y1="127" x2="208" y2="127" stroke="#888" strokeWidth="1.5" markerEnd="url(#arr1)"/>
            <line x1="158" y1="217" x2="208" y2="140" stroke="#888" strokeWidth="1.5" markerEnd="url(#arr1)"/>

            {/* vectors */}
            <text x="345" y="100" fontSize="10.5" fontFamily="monospace" fill="#1a6a1a">[0.12, -0.84, 0.33, …]</text>
            <text x="345" y="131" fontSize="10.5" fontFamily="monospace" fill="#1a6a1a">[0.15, -0.79, 0.30, …]</text>
            <text x="345" y="162" fontSize="10.5" fontFamily="monospace" fill="#a04000">[-0.71, 0.22, 0.61, …]</text>

            {/* plot */}
            <rect x="510" y="20" width="200" height="220" rx="10" fill="#fafafa" stroke="#ddd" strokeWidth="1"/>
            <text x="610" y="14" textAnchor="middle" fontSize="11" fill="#777">vector space (2-D view)</text>
            <circle cx="560" cy="70" r="7" fill="#1a8a1a"/>
            <text x="572" y="68" fontSize="10" fill="#1a6a1a">dog runs</text>
            <circle cx="578" cy="92" r="7" fill="#1a8a1a"/>
            <text x="590" y="105" fontSize="10" fill="#1a6a1a">puppy sprints</text>
            <circle cx="665" cy="200" r="7" fill="#c06000"/>
            <text x="600" y="200" fontSize="10" fill="#a04000">stock crashes</text>
            <ellipse cx="569" cy="81" rx="34" ry="28" fill="none" stroke="#1a8a1a" strokeWidth="1" strokeDasharray="3 3"/>
          </svg>

          {subhead("Typical dimensions")}
          <Note>
            Vectors are commonly <b>384, 768, 1024, or 1536</b> dimensions (some go to
            3072+). Higher dimensions can capture more nuance but cost more storage and
            search time. Most sentence embedding models <b>L2-normalize</b> their output
            (scale each vector to length 1) so that distance comparisons depend only on
            direction, not magnitude.
          </Note>
        </>
      )
    },

    // ─── STAGE 2 · why_use ─────────────────────────────────────
    {
      id: "why_use",
      group: "Overview",
      title: "Why We Need Them & When to Use",
      map: "Use cases",
      why: "Keyword search matches exact words; it fails on synonyms, paraphrases, and meaning. Embeddings unlock matching by meaning, which is the basis of nearly every modern retrieval and recommendation system.",
      render: () => (
        <>
          <Lead>
            The core advantage: keyword search matches <b>exact words</b>, while
            embeddings match <b>meaning</b>. A keyword index for &quot;car&quot; misses
            a document that only says &quot;automobile&quot;; an embedding model places
            <b> car &asymp; automobile</b> close together automatically.
          </Lead>

          {subhead("Where embeddings shine")}
          {tbl(
            <>
              <thead><tr>{th("Use case")}{th("Why embeddings beat the alternative")}</tr></thead>
              <tbody>
                <tr>{td("Semantic search")}{td("Find documents by meaning, not literal word overlap — handles synonyms and paraphrase.")}</tr>
                <tr>{td("RAG retrieval")}{td(<span>Fetch the most relevant chunks to feed an LLM as context. See the <a href="Production-Safety.html">RAG stage in Production &amp; Safety</a>.</span>)}</tr>
                <tr>{td("Clustering / topic discovery")}{td("Group unlabeled texts by proximity in vector space to surface themes automatically.")}</tr>
                <tr>{td("Classification")}{td("Embed text, then train a tiny classifier on the vectors — cheap and strong with little data.")}</tr>
                <tr>{td("Deduplication")}{td("Near-duplicate detection: two texts with very high cosine similarity are likely duplicates even if worded differently.")}</tr>
                <tr>{td("Recommendation")}{td("Recommend items whose embeddings are near a user's liked items — captures latent similarity.")}</tr>
                <tr>{td("Reranking")}{td("Score candidate results by relevance to refine an initial fast retrieval.")}</tr>
                <tr>{td("Anomaly detection")}{td("Flag inputs that are far from all known clusters — outliers in embedding space.")}</tr>
              </tbody>
            </>
          )}

          {info(
            <span>
              <b>Rule of thumb:</b> if the question is &quot;does this text contain this
              exact word?&quot; use keyword/BM25 search. If it is &quot;what text means
              the same thing as this?&quot; use embeddings. In practice the best systems
              combine both (<b>hybrid search</b>).
            </span>
          )}
        </>
      )
    },

    // ─── STAGE 3 · text_to_vector ──────────────────────────────
    {
      id: "text_to_vector",
      group: "How It Works",
      title: "From Text to Vector — The Pipeline",
      map: "Pipeline",
      why: "Understanding the four steps — tokenize, encode, pool, normalize — demystifies what 'getting an embedding' actually does and why pooling choice matters.",
      render: () => (
        <>
          <Lead>
            Turning text into one vector is a four-step pipeline. The subtle step is
            <b> pooling</b>: a transformer produces one vector <i>per token</i>, but we
            want a single vector for the whole input.
          </Lead>

          {subhead("The four steps")}
          <svg width="100%" viewBox="0 0 720 150" style={{display:"block", marginBottom:16, maxWidth:720}}>
            <defs>
              <marker id="arr3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#888" />
              </marker>
            </defs>
            <rect x="6" y="55" width="98" height="44" rx="9" fill="#eee" stroke="#bbb" strokeWidth="1.3"/>
            <text x="55" y="74" textAnchor="middle" fontSize="11" fill="#555">&quot;The cat sat&quot;</text>
            <text x="55" y="90" textAnchor="middle" fontSize="10" fill="#888">input</text>

            <rect x="128" y="55" width="98" height="44" rx="9" fill="#f3e8ff" stroke="#8a3aff" strokeWidth="1.3"/>
            <text x="177" y="74" textAnchor="middle" fontSize="11" fontWeight="700" fill="#6a1aaf">Tokenize</text>
            <text x="177" y="90" textAnchor="middle" fontSize="10" fill="#6a1aaf">[The][cat][sat]</text>

            <rect x="250" y="55" width="98" height="44" rx="9" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.3"/>
            <text x="299" y="74" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">Encoder</text>
            <text x="299" y="90" textAnchor="middle" fontSize="9.5" fill="#2B5BFF">per-token vecs</text>

            <rect x="372" y="55" width="98" height="44" rx="9" fill="#e8ffe8" stroke="#1a8a1a" strokeWidth="1.3"/>
            <text x="421" y="74" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a6a1a">Pool</text>
            <text x="421" y="90" textAnchor="middle" fontSize="10" fill="#1a6a1a">mean → 1 vec</text>

            <rect x="494" y="55" width="108" height="44" rx="9" fill="#fff3e8" stroke="#c06000" strokeWidth="1.3"/>
            <text x="548" y="74" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a04000">Normalize</text>
            <text x="548" y="90" textAnchor="middle" fontSize="10" fill="#a04000">L2, len = 1</text>

            <rect x="626" y="55" width="88" height="44" rx="9" fill="#2B5BFF" stroke="#1a3acc" strokeWidth="1.3"/>
            <text x="670" y="80" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">embedding</text>

            <line x1="104" y1="77" x2="126" y2="77" stroke="#888" strokeWidth="1.6" markerEnd="url(#arr3)"/>
            <line x1="226" y1="77" x2="248" y2="77" stroke="#888" strokeWidth="1.6" markerEnd="url(#arr3)"/>
            <line x1="348" y1="77" x2="370" y2="77" stroke="#888" strokeWidth="1.6" markerEnd="url(#arr3)"/>
            <line x1="470" y1="77" x2="492" y2="77" stroke="#888" strokeWidth="1.6" markerEnd="url(#arr3)"/>
            <line x1="602" y1="77" x2="624" y2="77" stroke="#888" strokeWidth="1.6" markerEnd="url(#arr3)"/>
          </svg>

          {subhead("Pooling methods")}
          {tbl(
            <>
              <thead><tr>{th("Method")}{th("How")}{th("When used")}</tr></thead>
              <tbody>
                <tr>{td("[CLS] pooling")}{td("Take the vector of the special [CLS] token.")}{td("BERT-style; needs fine-tuning to be a good sentence vector.")}</tr>
                <tr>{td("Mean pooling")}{td("Average all token vectors (mask out padding).")}{td("Most common for sentence models (SBERT, E5, BGE).")}</tr>
                <tr>{td("Max pooling")}{td("Element-wise max over token vectors.")}{td("Occasionally; emphasizes salient features.")}</tr>
                <tr>{td("Last-token")}{td("Take the final token's vector.")}{td("Decoder-based embedders (E5-Mistral, gte-Qwen).")}</tr>
              </tbody>
            </>
          )}

          {subhead("Mean pooling with an attention mask")}
          {codeBlock(
"import torch\n\n" +
"def mean_pool(token_embeds, attention_mask):\n" +
"    # token_embeds: [batch, seq_len, dim]\n" +
"    # attention_mask: [batch, seq_len]  (1 = real token, 0 = padding)\n" +
"    mask = attention_mask.unsqueeze(-1).float()      # [batch, seq_len, 1]\n" +
"    summed = (token_embeds * mask).sum(dim=1)         # ignore padding\n" +
"    counts = mask.sum(dim=1).clamp(min=1e-9)          # number of real tokens\n" +
"    return summed / counts                            # [batch, dim]\n\n" +
"def l2_normalize(v):\n" +
"    return v / v.norm(p=2, dim=-1, keepdim=True)\n\n" +
"emb = l2_normalize(mean_pool(token_embeds, attention_mask))"
          )}

          {info(
            <span>
              After <b>L2-normalization</b> every vector has length 1, so cosine
              similarity equals the dot product — making search faster and comparisons
              independent of text length.
            </span>
          )}
        </>
      )
    },

    // ─── STAGE 4 · types ───────────────────────────────────────
    {
      id: "types",
      group: "Types",
      title: "Types of Embedding Models",
      map: "Evolution",
      why: "Embeddings evolved from static one-vector-per-word schemes to contextual, similarity-tuned, instruction-following models. Knowing the lineage explains why modern models are so much better.",
      render: () => (
        <>
          <Lead>
            Embedding models evolved through several generations. The big shifts were
            <b> context</b> (the same word means different things in different sentences)
            and <b>training for similarity</b> (not all good language models make good
            embedding models off-the-shelf).
          </Lead>

          {tbl(
            <>
              <thead><tr>{th("Model family")}{th("Era")}{th("Core idea")}{th("Limitation")}</tr></thead>
              <tbody>
                <tr>{td("Word2Vec / GloVe")}{td("2013–14")}{td("One static vector per word from co-occurrence.")}{td(<span>No context — <b>bank</b> (river) and <b>bank</b> (money) get the same vector.</span>)}</tr>
                <tr>{td("FastText")}{td("2016")}{td("Word vectors built from subword n-grams.")}{td("Handles out-of-vocabulary words, but still static / non-contextual.")}</tr>
                <tr>{td("Contextual (BERT / RoBERTa)")}{td("2018")}{td("Per-token vectors that depend on the full sentence.")}{td("Not trained for similarity; raw [CLS]/mean vectors are mediocre off-the-shelf.")}</tr>
                <tr>{td("Sentence-BERT (SBERT)")}{td("2019")}{td("Fine-tune BERT with a siamese network + contrastive loss.")}{td("Produces strong sentence vectors; needs labeled pairs to train.")}</tr>
                <tr>{td("Modern open (E5, BGE, GTE, Nomic, Jina, mxbai)")}{td("2023–24")}{td("Large-scale contrastive pretraining + instruction tuning; top of MTEB.")}{td("Often require task prefixes; larger ones are compute-heavy.")}</tr>
                <tr>{td("Commercial APIs (OpenAI, Cohere, Voyage)")}{td("2023–")}{td(<span>Hosted models, e.g. OpenAI <b>text-embedding-3-small/large</b> (1536 / 3072-d), Cohere embed, Voyage.</span>)}{td("Cost per call; data leaves your environment; no fine-tuning of the base.")}</tr>
              </tbody>
            </>
          )}

          {info(
            <span>
              Many of the newest top-ranked embedders are <b>decoder / LLM-based</b>
              (e.g. <b>E5-Mistral</b>, <b>gte-Qwen</b>) rather than encoder-based — they
              repurpose a large language model with last-token pooling and contrastive
              fine-tuning.
            </span>
          )}
        </>
      )
    },

    // ─── STAGE 5 · architecture ────────────────────────────────
    {
      id: "architecture",
      group: "How It Works",
      title: "Bi-Encoder vs Cross-Encoder",
      map: "Architecture",
      why: "This is the single most important architectural decision in retrieval. Bi-encoders are fast and indexable; cross-encoders are accurate but slow. Production systems use both in a pipeline.",
      render: () => (
        <>
          <Lead>
            There are two ways to compare a query with a document. A <b>bi-encoder</b>
            encodes them <i>separately</i> into vectors you can pre-index. A
            <b> cross-encoder</b> feeds query and document <i>together</i> and outputs
            a single relevance score — far more accurate, but it cannot be pre-indexed.
          </Lead>

          {subhead("Two architectures side by side")}
          <svg width="100%" viewBox="0 0 720 240" style={{display:"block", marginBottom:16, maxWidth:720}}>
            <defs>
              <marker id="arr5" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#888" />
              </marker>
            </defs>
            {/* bi-encoder */}
            <text x="170" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a6a1a">Bi-Encoder (two towers)</text>
            <rect x="30" y="40" width="90" height="30" rx="7" fill="#eee" stroke="#bbb"/>
            <text x="75" y="60" textAnchor="middle" fontSize="10.5" fill="#555">query</text>
            <rect x="220" y="40" width="90" height="30" rx="7" fill="#eee" stroke="#bbb"/>
            <text x="265" y="60" textAnchor="middle" fontSize="10.5" fill="#555">document</text>
            <rect x="30" y="90" width="90" height="34" rx="8" fill="#e8f0ff" stroke="#2B5BFF"/>
            <text x="75" y="111" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#2B5BFF">encoder</text>
            <rect x="220" y="90" width="90" height="34" rx="8" fill="#e8f0ff" stroke="#2B5BFF"/>
            <text x="265" y="111" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#2B5BFF">encoder</text>
            <line x1="75" y1="70" x2="75" y2="88" stroke="#888" strokeWidth="1.5" markerEnd="url(#arr5)"/>
            <line x1="265" y1="70" x2="265" y2="88" stroke="#888" strokeWidth="1.5" markerEnd="url(#arr5)"/>
            <text x="75" y="150" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#1a6a1a">vec A</text>
            <text x="265" y="150" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#1a6a1a">vec B</text>
            <line x1="75" y1="124" x2="75" y2="138" stroke="#888" strokeWidth="1.5" markerEnd="url(#arr5)"/>
            <line x1="265" y1="124" x2="265" y2="138" stroke="#888" strokeWidth="1.5" markerEnd="url(#arr5)"/>
            <rect x="120" y="165" width="100" height="32" rx="8" fill="#e8ffe8" stroke="#1a8a1a"/>
            <text x="170" y="186" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a6a1a">cosine(A,B)</text>
            <line x1="85" y1="156" x2="135" y2="168" stroke="#888" strokeWidth="1.3" markerEnd="url(#arr5)"/>
            <line x1="255" y1="156" x2="205" y2="168" stroke="#888" strokeWidth="1.3" markerEnd="url(#arr5)"/>
            <text x="170" y="222" textAnchor="middle" fontSize="10" fill="#1a6a1a">vectors precomputed &amp; indexed → fast</text>

            {/* divider */}
            <line x1="370" y1="30" x2="370" y2="220" stroke="#ddd" strokeWidth="1.3" strokeDasharray="4 4"/>

            {/* cross-encoder */}
            <text x="545" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#a04000">Cross-Encoder (one tower)</text>
            <rect x="450" y="40" width="190" height="30" rx="7" fill="#eee" stroke="#bbb"/>
            <text x="545" y="60" textAnchor="middle" fontSize="10.5" fill="#555">[query] [SEP] [document]</text>
            <rect x="450" y="95" width="190" height="38" rx="8" fill="#fff3e8" stroke="#c06000"/>
            <text x="545" y="119" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a04000">encoder (joint)</text>
            <line x1="545" y1="70" x2="545" y2="93" stroke="#888" strokeWidth="1.5" markerEnd="url(#arr5)"/>
            <rect x="490" y="160" width="110" height="34" rx="8" fill="#2B5BFF" stroke="#1a3acc"/>
            <text x="545" y="182" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">relevance score</text>
            <line x1="545" y1="133" x2="545" y2="158" stroke="#888" strokeWidth="1.5" markerEnd="url(#arr5)"/>
            <text x="545" y="222" textAnchor="middle" fontSize="10" fill="#a04000">run per pair at query time → slow, accurate</text>
          </svg>

          {subhead("Tradeoffs")}
          {tbl(
            <>
              <thead><tr>{th("")}{th("Bi-encoder")}{th("Cross-encoder")}</tr></thead>
              <tbody>
                <tr>{td("Speed")}{td("Fast (one pass per text, then vector math)")}{td("Slow (one model pass per query–doc pair)")}</tr>
                <tr>{td("Accuracy")}{td("Good")}{td("Higher — full cross-attention between query and doc")}</tr>
                <tr>{td("Pre-indexable?")}{td("Yes — vectors stored in a vector DB")}{td("No — must see the pair to score it")}</tr>
                <tr>{td("Scales to")}{td("Millions+ of documents")}{td("Tens to hundreds of candidates")}</tr>
                <tr>{td("Use case")}{td("Retrieval / first-stage search")}{td("Reranking the top candidates")}</tr>
              </tbody>
            </>
          )}

          {info(
            <span>
              <b>The standard RAG pattern:</b> a bi-encoder retrieves the top ~100
              candidates fast from millions of vectors, then a cross-encoder
              <b> reranks</b> those 100 down to the best 5 with high accuracy. Best of
              both worlds.
            </span>
          )}
        </>
      )
    },

    // ─── STAGE 6 · similarity ──────────────────────────────────
    {
      id: "similarity",
      group: "How It Works",
      title: "Measuring Similarity",
      map: "Math",
      why: "Once text is a vector, 'how similar' becomes a geometry question. Cosine similarity, dot product, and Euclidean distance each answer it slightly differently — and normalization ties them together.",
      render: () => (
        <>
          <Lead>
            With texts as vectors, similarity is geometry. The dominant measure is
            <b> cosine similarity</b>, which compares the <i>angle</i> between vectors and
            ignores their magnitude. For normalized vectors, cosine equals the plain
            <b> dot product</b>.
          </Lead>

          {subhead("The three measures")}
          {tbl(
            <>
              <thead><tr>{th("Measure")}{th("Formula")}{th("Notes")}</tr></thead>
              <tbody>
                <tr>{td("Cosine similarity")}{td("(a · b) / (||a|| ||b||)")}{td("Range [-1, 1]. Measures angle, ignores length. Default for text.")}</tr>
                <tr>{td("Dot product")}{td("a · b = Σ aᵢ bᵢ")}{td("If both vectors are L2-normalized, dot = cosine (and is faster).")}</tr>
                <tr>{td("Euclidean (L2)")}{td("sqrt( Σ (aᵢ - bᵢ)² )")}{td("Straight-line distance; smaller = more similar. For normalized vectors it is monotonic with cosine.")}</tr>
              </tbody>
            </>
          )}

          {subhead("Angle = similarity")}
          <svg width="100%" viewBox="0 0 720 220" style={{display:"block", marginBottom:16, maxWidth:520}}>
            {/* axes */}
            <line x1="60" y1="190" x2="380" y2="190" stroke="#bbb" strokeWidth="1.3"/>
            <line x1="60" y1="190" x2="60" y2="20" stroke="#bbb" strokeWidth="1.3"/>
            {/* query vector */}
            <line x1="60" y1="190" x2="300" y2="70" stroke="#2B5BFF" strokeWidth="2.4"/>
            <text x="305" y="68" fontSize="11" fontWeight="700" fill="#2B5BFF">query</text>
            {/* doc A close */}
            <line x1="60" y1="190" x2="320" y2="100" stroke="#1a8a1a" strokeWidth="2.2"/>
            <text x="325" y="100" fontSize="11" fill="#1a6a1a">doc A (close)</text>
            {/* doc B far */}
            <line x1="60" y1="190" x2="200" y2="190" stroke="#c06000" strokeWidth="2.2"/>
            <text x="205" y="188" fontSize="11" fill="#a04000">doc B (far)</text>
            {/* angle arcs */}
            <path d="M 110 173 A 52 52 0 0 1 118 165" fill="none" stroke="#1a8a1a" strokeWidth="1.4"/>
            <text x="128" y="170" fontSize="10" fill="#1a6a1a">small θ</text>
            <path d="M 120 190 A 60 60 0 0 1 105 153" fill="none" stroke="#c06000" strokeWidth="1.4"/>
            <text x="120" y="135" fontSize="10" fill="#a04000">large θ</text>
            <text x="200" y="212" textAnchor="middle" fontSize="11" fill="#777">smaller angle → higher cosine → more similar</text>
          </svg>

          {subhead("Computing cosine similarity")}
          {codeBlock(
"import numpy as np\n\n" +
"def cosine_sim(a, b):\n" +
"    a = np.asarray(a); b = np.asarray(b)\n" +
"    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))\n\n" +
"# If a and b are already L2-normalized, this is just the dot product:\n" +
"def cosine_norm(a, b):\n" +
"    return float(np.asarray(a) @ np.asarray(b))"
          )}

          {info(
            <span>
              <b>Why normalize?</b> It removes length bias (longer texts otherwise get
              larger vectors) and lets you replace the costly cosine division with a plain
              dot product. <b>Vector databases</b> (FAISS, Pinecone, pgvector, Weaviate,
              Qdrant) use <b>Approximate Nearest Neighbor (ANN)</b> indexes such as
              <b> HNSW</b> to search millions of vectors in milliseconds.
            </span>
          )}
        </>
      )
    },

    // ─── STAGE 7 · contrastive ─────────────────────────────────
    {
      id: "contrastive",
      group: "Training",
      title: "Contrastive Learning — The Core Training Idea",
      map: "Training",
      why: "Embedding models are not trained to predict words — they are trained to arrange vectors so similar texts are close and dissimilar texts are far. Contrastive learning is the mechanism that does this.",
      render: () => (
        <>
          <Lead>
            Embedding models learn by <b>contrast</b>: pull similar pairs together and
            push dissimilar pairs apart in vector space. Training data is
            <b> (anchor, positive)</b> pairs, optionally with negatives. After training,
            scattered points organize into meaningful clusters.
          </Lead>

          {subhead("Before vs after training")}
          <svg width="100%" viewBox="0 0 720 210" style={{display:"block", marginBottom:16, maxWidth:720}}>
            {/* before */}
            <text x="170" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#777">Before training (scattered)</text>
            <rect x="30" y="28" width="280" height="160" rx="10" fill="#fafafa" stroke="#ddd"/>
            <circle cx="80" cy="60" r="6" fill="#1a8a1a"/>
            <circle cx="250" cy="80" r="6" fill="#1a8a1a"/>
            <circle cx="120" cy="150" r="6" fill="#1a8a1a"/>
            <circle cx="200" cy="50" r="6" fill="#c06000"/>
            <circle cx="90" cy="120" r="6" fill="#c06000"/>
            <circle cx="260" cy="150" r="6" fill="#c06000"/>

            {/* arrow */}
            <line x1="330" y1="108" x2="380" y2="108" stroke="#888" strokeWidth="2" markerEnd="url(#arr5)"/>

            {/* after */}
            <text x="545" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">After training (clustered)</text>
            <rect x="405" y="28" width="280" height="160" rx="10" fill="#fafafa" stroke="#ddd"/>
            <ellipse cx="470" cy="80" rx="42" ry="34" fill="none" stroke="#1a8a1a" strokeWidth="1.2" strokeDasharray="3 3"/>
            <circle cx="455" cy="70" r="6" fill="#1a8a1a"/>
            <circle cx="485" cy="78" r="6" fill="#1a8a1a"/>
            <circle cx="470" cy="98" r="6" fill="#1a8a1a"/>
            <ellipse cx="610" cy="135" rx="42" ry="34" fill="none" stroke="#c06000" strokeWidth="1.2" strokeDasharray="3 3"/>
            <circle cx="595" cy="125" r="6" fill="#c06000"/>
            <circle cx="625" cy="132" r="6" fill="#c06000"/>
            <circle cx="610" cy="152" r="6" fill="#c06000"/>
            <text x="545" y="205" textAnchor="middle" fontSize="10" fill="#777">similar pulled together · dissimilar pushed apart</text>
          </svg>

          {subhead("Two common losses")}
          {tbl(
            <>
              <thead><tr>{th("Loss")}{th("Idea")}</tr></thead>
              <tbody>
                <tr>{td("Triplet loss")}{td("max(0, d(a,p) − d(a,n) + margin). The anchor a must be closer to its positive p than to a negative n by at least a margin.")}</tr>
                <tr>{td("InfoNCE / in-batch")}{td("For a batch of (query, positive) pairs, each query's own positive is THE positive; every OTHER positive in the batch acts as a negative. Softmax over similarities, then cross-entropy.")}</tr>
              </tbody>
            </>
          )}

          {subhead("InfoNCE objective")}
          {codeBlock(
"  L  =  - log [  exp( sim(q, p+) / τ )  /  Σⱼ exp( sim(q, pⱼ) / τ )  ]\n\n" +
"    q     = query embedding\n" +
"    p+    = the matching positive\n" +
"    pⱼ    = all candidates in the batch (1 positive + the rest as negatives)\n" +
"    sim   = cosine similarity (dot product on normalized vectors)\n" +
"    τ     = temperature (sharpens / softens the distribution)"
          )}

          {info(
            <span>
              <b>Hard negatives</b> — examples that are semantically close but actually
              wrong — are the most informative training signal and are mined
              deliberately. And because in-batch negatives come for free,
              <b> larger batch sizes give more negatives per step</b>, which is a key
              reason big-batch contrastive training produces stronger models.
            </span>
          )}
        </>
      )
    },

    // ─── STAGE 8 · training_pipeline ───────────────────────────
    {
      id: "training_pipeline",
      group: "Training",
      title: "How Embedding Models Are Trained",
      map: "Recipe",
      why: "Modern top models (E5, BGE, GTE) follow a consistent two-stage recipe: massive weakly-supervised contrastive pretraining, then supervised fine-tuning with hard negatives. Knowing this explains where the data comes from.",
      render: () => (
        <>
          <Lead>
            State-of-the-art open embedders (E5, BGE, GTE) share a <b>two-stage
            recipe</b>: first weakly-supervised contrastive <b>pretraining</b> on
            billions of naturally-occurring text pairs, then supervised
            <b> fine-tuning</b> on smaller curated datasets with mined hard negatives.
          </Lead>

          {subhead("The two stages")}
          {tbl(
            <>
              <thead><tr>{th("Stage")}{th("Data")}{th("Method")}</tr></thead>
              <tbody>
                <tr>{td(<b>A · Weakly-supervised pretraining</b>)}{td("Billions of naturally-paired texts (no human labels).")}{td("Contrastive learning with in-batch negatives.")}</tr>
                <tr>{td(<b>B · Supervised fine-tuning</b>)}{td("Smaller curated, labeled datasets (NLI, MS MARCO, etc.).")}{td("Contrastive / triplet loss with mined hard negatives.")}</tr>
              </tbody>
            </>
          )}

          {subhead("Where naturally-paired data comes from")}
          {tbl(
            <>
              <thead><tr>{th("Source")}{th("Anchor → positive pairing")}</tr></thead>
              <tbody>
                <tr>{td("Web / articles")}{td("Title → body, or summary → article")}</tr>
                <tr>{td("Q&A forums")}{td("Question → accepted answer")}</tr>
                <tr>{td("Scientific papers")}{td("Citation pairs (citing → cited)")}</tr>
                <tr>{td("Search logs")}{td("Query → clicked document")}</tr>
                <tr>{td("Code")}{td("Docstring → function, or comment → code")}</tr>
              </tbody>
            </>
          )}

          {subhead("Fine-tuning data format (triplets)")}
          {codeBlock(
"{\n" +
"  \"query\":    \"how do I reset my password?\",\n" +
"  \"positive\": \"To reset your password, click 'Forgot password' on the login page.\",\n" +
"  \"negative\": \"To change your billing address, go to Account > Billing.\"\n" +
"}"
          )}

          {warn(
            <span>
              Many models require <b>prefix / instruction conventions</b> at both train
              and inference time, e.g. E5 expects <code>&quot;query: …&quot;</code> for
              queries and <code>&quot;passage: …&quot;</code> for documents. Forgetting
              these prefixes silently degrades quality.
            </span>
          )}
        </>
      )
    },

    // ─── STAGE 9 · finetune_custom ─────────────────────────────
    {
      id: "finetune_custom",
      group: "Training",
      title: "Fine-Tuning on Your Own Data",
      map: "Practice",
      why: "A general embedding model can underperform badly on specialized domains (legal, medical, code, internal jargon). A modest amount of in-domain fine-tuning often delivers large retrieval gains.",
      render: () => (
        <>
          <Lead>
            When your domain has its own vocabulary — legal, medical, code, or internal
            product jargon — a general embedder may map unrelated things together and
            miss true matches. Fine-tuning on a few thousand good in-domain pairs can
            substantially beat a general model on your task.
          </Lead>

          {subhead("The four steps")}
          {tbl(
            <>
              <thead><tr>{th("Step")}{th("What to do")}</tr></thead>
              <tbody>
                <tr>{td("1 · Collect positives")}{td("Gather (query, relevant_doc) pairs — from click logs, FAQ pairs, or LLM-generated synthetic queries for your documents.")}</tr>
                <tr>{td("2 · Mine hard negatives")}{td("Retrieve top-k with a base model; the wrong ones become hard negatives.")}</tr>
                <tr>{td("3 · Fine-tune")}{td("Train with sentence-transformers using MultipleNegativesRankingLoss (in-batch negatives) or triplet loss.")}</tr>
                <tr>{td("4 · Evaluate")}{td("Measure Recall@k / NDCG@k on a held-out query set from your own data.")}</tr>
              </tbody>
            </>
          )}

          {subhead("Fine-tuning sketch (sentence-transformers)")}
          {codeBlock(
"from sentence_transformers import SentenceTransformer, InputExample, losses\n" +
"from torch.utils.data import DataLoader\n\n" +
"model = SentenceTransformer(\"intfloat/e5-base-v2\")   # start from a strong base\n\n" +
"train_examples = [\n" +
"    InputExample(texts=[\"query: \" + q, \"passage: \" + pos, \"passage: \" + neg])\n" +
"    for q, pos, neg in my_triples\n" +
"]\n\n" +
"loader = DataLoader(train_examples, shuffle=True, batch_size=64)\n" +
"loss   = losses.MultipleNegativesRankingLoss(model)   # in-batch negatives\n\n" +
"model.fit(train_objectives=[(loader, loss)], epochs=1, warmup_steps=100)\n" +
"model.save(\"my-domain-embedder\")"
          )}

          {info(
            <span>
              No labeled data? You can <b>synthesize training queries cheaply with an
              LLM</b>: prompt it to generate plausible questions for each of your
              documents, pair them up, and mine hard negatives. Even a few thousand such
              pairs often beat a general model on in-domain retrieval.
            </span>
          )}
        </>
      )
    },

    // ─── STAGE 10 · advanced ───────────────────────────────────
    {
      id: "advanced",
      group: "Advanced",
      title: "Matryoshka, Instructions & Long Context",
      map: "Advanced",
      why: "Recent techniques make embeddings cheaper (truncatable vectors, quantization), more flexible (instruction tuning), and capable of whole-document understanding (long context).",
      render: () => (
        <>
          <Lead>
            Beyond the core recipe, four techniques shape modern embedding models:
            <b> truncatable (Matryoshka) vectors</b>, <b>instruction tuning</b>,
            <b> long context</b>, and <b>quantized embeddings</b>.
          </Lead>

          {subhead("1 · Matryoshka Representation Learning (MRL)")}
          <Note>
            MRL trains the model so that the <b>first k dimensions</b> of a vector are
            themselves a usable embedding. You can truncate a 1536-d vector to 256-d for
            cheaper storage and faster search, with only graceful quality loss. OpenAI
            <b> text-embedding-3</b> and <b>Nomic-embed</b> support this.
          </Note>
          <svg width="100%" viewBox="0 0 720 90" style={{display:"block", marginBottom:16, maxWidth:680}}>
            <rect x="20" y="30" width="640" height="34" rx="6" fill="#e8f0ff" stroke="#2B5BFF"/>
            <rect x="20" y="30" width="320" height="34" rx="6" fill="#cfe0ff" stroke="#2B5BFF"/>
            <rect x="20" y="30" width="120" height="34" rx="6" fill="#2B5BFF"/>
            <text x="80" y="51" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#fff">256-d</text>
            <text x="230" y="51" textAnchor="middle" fontSize="10.5" fill="#1a3acc">768-d</text>
            <text x="500" y="51" textAnchor="middle" fontSize="10.5" fill="#2B5BFF">full 1536-d</text>
            <text x="340" y="82" textAnchor="middle" fontSize="10" fill="#777">truncate from the left → smaller, cheaper, still usable</text>
          </svg>

          {subhead("2 · Instruction-tuned embeddings")}
          <Note>
            Prepend a task instruction so one model serves many tasks, e.g.
            <code> &quot;Represent this sentence for retrieval: …&quot;</code> vs an
            instruction for clustering or classification. The same weights produce
            task-appropriate vectors depending on the prefix.
          </Note>

          {subhead("3 · Long-context embeddings")}
          <Note>
            Models with <b>8K+ token</b> context can embed whole documents at once. Even
            so, RAG usually <b>chunks</b> long documents (e.g. by paragraph or with
            overlap) so retrieval returns focused, citable spans rather than one diffuse
            document vector.
          </Note>

          {subhead("4 · Quantized / binary embeddings")}
          {info(
            <span>
              For massive-scale search, vectors can be stored as <b>int8</b> or even
              <b> binary</b>, shrinking memory 4–32x with small accuracy loss — often
              combined with a re-scoring pass on full-precision vectors. See
              <a href="Quantization.html"> Quantization</a> for the underlying ideas.
            </span>
          )}
        </>
      )
    },

    // ─── STAGE 11 · evaluation ─────────────────────────────────
    {
      id: "evaluation",
      group: "Evaluation",
      title: "Evaluating Embedding Models",
      map: "Metrics",
      why: "Picking an embedder by leaderboard rank alone is a trap. Understanding MTEB and retrieval metrics — and why you must test on your own data — is essential to choosing well.",
      render: () => (
        <>
          <Lead>
            The standard public benchmark is <b>MTEB</b> (Massive Text Embedding
            Benchmark): 50+ datasets across <b>8 task types</b> — retrieval, reranking,
            clustering, classification, STS (semantic textual similarity), summarization,
            pair classification, and bitext mining. Retrieval is usually the task that
            matters most for RAG.
          </Lead>

          {subhead("Retrieval metrics")}
          {tbl(
            <>
              <thead><tr>{th("Metric")}{th("Meaning")}</tr></thead>
              <tbody>
                <tr>{td("Recall@k")}{td("Fraction of all relevant documents that appear in the top-k results.")}</tr>
                <tr>{td("MRR")}{td("Mean Reciprocal Rank — average of 1/(rank of first relevant result).")}</tr>
                <tr>{td("NDCG@k")}{td("Rank-weighted relevance; rewards putting relevant docs higher. The main retrieval metric.")}</tr>
                <tr>{td("Precision@k")}{td("Fraction of the top-k results that are actually relevant.")}</tr>
              </tbody>
            </>
          )}

          {subhead("The formulas")}
          {codeBlock(
"# MRR — averaged over all queries\n" +
"  MRR = mean( 1 / rank_of_first_relevant )\n\n" +
"# NDCG@k — normalized, rank-weighted relevance\n" +
"  DCG@k  = Σ (i=1..k)  rel_i / log2(i + 1)\n" +
"  IDCG@k = DCG of the ideal (perfectly sorted) ranking\n" +
"  NDCG@k = DCG@k / IDCG@k          # in [0, 1], higher is better\n\n" +
"# Recall@k\n" +
"  Recall@k = (relevant docs in top-k) / (total relevant docs)"
          )}

          {subhead("How to choose a model")}
          {tbl(
            <>
              <thead><tr>{th("Factor")}{th("What to weigh")}</tr></thead>
              <tbody>
                <tr>{td("MTEB score")}{td("Strong starting signal — but not the whole story.")}</tr>
                <tr>{td("Dimension")}{td("Smaller vectors = cheaper storage and faster search; larger = potentially more accurate.")}</tr>
                <tr>{td("Max sequence length")}{td("Must cover your typical chunk / document size.")}</tr>
                <tr>{td("Inference cost")}{td("Model size vs latency / throughput, and self-host vs API pricing.")}</tr>
              </tbody>
            </>
          )}

          {info(
            <span>
              <b>Always evaluate on YOUR data.</b> A high MTEB rank does not guarantee the
              best performance on your specific domain — build a small held-out set of
              real queries and measure NDCG@k / Recall@k on it before committing.
            </span>
          )}
        </>
      )
    }

  ];

  window.ML_META = {
    title: "Embedding Models",
    subtitle: "Turning text into vectors — semantic search, RAG, and how embeddings are trained",
    cur: "Embeddings",
    category: "LLM Training",
    run: () => ({}), default: {}, renderInput: null,
    modeLinks: [
      { label: "Pre-Training",  href: "LLM-PreTraining.html",        active: false },
      { label: "Distributed",   href: "Distributed-Training.html",   active: false },
      { label: "GPU",           href: "GPU-Architecture.html",      active: false },
      { label: "Quantization",  href: "Quantization.html",           active: false },
      { label: "MoE",           href: "Mixture-of-Experts.html",     active: false },
      { label: "Post-Training", href: "Post-Training.html",          active: false },
      { label: "Distillation",  href: "Knowledge-Distillation.html", active: false },
      { label: "Embeddings",    href: "Embedding-Models.html",       active: true  },
      { label: "Reasoning",     href: "Reasoning-Models.html",       active: false },
      { label: "Inference",     href: "Inference-Serving.html",     active: false },
      { label: "Production",    href: "Production-Safety.html",       active: false },
    ]
  };
  window.ML_STAGES = STAGES;
})();
