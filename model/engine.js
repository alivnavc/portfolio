/* ============================================================
   Pure-JS math engine for the toy decoder transformer.
   No framework. Returns a full "trace" object with every
   intermediate matrix so the UI can render real numbers and
   reconstruct per-cell calculations on hover.
   ============================================================ */
(function () {
  const C = window.TF_CONFIG;

  /* ---------- linear algebra helpers ---------- */
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const transpose = (M) => M[0].map((_, j) => M.map((row) => row[j]));
  function matmul(A, B) {
    const Bt = transpose(B);
    return A.map((row) => Bt.map((col) => dot(row, col)));
  }
  const addMat = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
  const addVecToRows = (A, v) => A.map((r) => r.map((x, j) => x + v[j]));
  const sliceCols = (M, a, b) => M.map((r) => r.slice(a, b));
  const relu = (x) => Math.max(0, x);

  function softmaxRow(arr) {
    const m = Math.max(...arr.filter((x) => isFinite(x)));
    const ex = arr.map((x) => (isFinite(x) ? Math.exp(x - m) : 0));
    const s = ex.reduce((a, b) => a + b, 0);
    return ex.map((x) => x / s);
  }

  /* LayerNorm over a single row vector (gamma=1, beta=0 for clarity) */
  function layerNormRow(row) {
    const n = row.length;
    const mean = row.reduce((a, b) => a + b, 0) / n;
    const varr = row.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const std = Math.sqrt(varr + 1e-5);
    const out = row.map((x) => (x - mean) / std);
    return { out, mean, varr, std };
  }
  function layerNorm(M) {
    const stats = M.map(layerNormRow);
    return { out: stats.map((s) => s.out), stats };
  }

  /* sinusoidal positional encoding */
  function positionalEncoding(seqLen, d) {
    const PE = [];
    for (let pos = 0; pos < seqLen; pos++) {
      const row = [];
      for (let i = 0; i < d; i++) {
        const k = Math.floor(i / 2);
        const denom = Math.pow(10000, (2 * k) / d);
        row.push(i % 2 === 0 ? Math.sin(pos / denom) : Math.cos(pos / denom));
      }
      PE.push(row);
    }
    return PE;
  }

  /* ---------- one attention head ---------- */
  function attentionHead(X, Wq, Wk, Wv, maskOn, scale) {
    const Q = matmul(X, Wq);
    const K = matmul(X, Wk);
    const V = matmul(X, Wv);
    const Kt = transpose(K);
    const rawScores = Q.map((qr) => Kt[0].map((_, j) => dot(qr, K[j]) / scale));
    // apply causal mask: position i may not attend to j > i
    const masked = rawScores.map((r, i) =>
      r.map((v, j) => (maskOn && j > i ? -Infinity : v))
    );
    const attn = masked.map(softmaxRow);
    const out = attn.map((wRow) =>
      V[0].map((_, d) => wRow.reduce((s, w, j) => s + w * V[j][d], 0))
    );
    return { Q, K, V, rawScores, masked, attn, out };
  }

  /* ---------- one transformer block (post-LN, "Add & Norm") ---------- */
  function block(X, W, maskOn) {
    const scale = Math.sqrt(C.dHead);
    // split projection weights by head (columns)
    const heads = [];
    let concat = X.map(() => []);
    for (let h = 0; h < C.nHeads; h++) {
      const a = h * C.dHead, b = a + C.dHead;
      const hd = attentionHead(
        X, sliceCols(W.Wq, a, b), sliceCols(W.Wk, a, b), sliceCols(W.Wv, a, b),
        maskOn, scale
      );
      heads.push(hd);
      concat = concat.map((r, i) => r.concat(hd.out[i]));
    }
    const attnProj = matmul(concat, W.Wo);          // multi-head output
    const res1 = addMat(X, attnProj);               // residual 1
    const norm1 = layerNorm(res1);                  // Add & Norm 1

    // FFN
    const ff1raw = addVecToRows(matmul(norm1.out, W.W1), W.B1);
    const ff1 = ff1raw.map((r) => r.map(relu));     // hidden (ReLU)
    const ff2 = addVecToRows(matmul(ff1, W.W2), W.B2);
    const res2 = addMat(norm1.out, ff2);            // residual 2
    const norm2 = layerNorm(res2);                  // Add & Norm 2

    return {
      heads, concat, attnProj, res1, norm1,
      ff1raw, ff1, ff2, res2, norm2,
      out: norm2.out,
    };
  }

  /* ---------- full forward pass ---------- */
  function run(tokenIds, maskOn) {
    const W = {
      Wq: window.TF_WQ, Wk: window.TF_WK, Wv: window.TF_WV, Wo: window.TF_WO,
      W1: window.TF_W1, B1: window.TF_B1, W2: window.TF_W2, B2: window.TF_B2,
    };
    const tokens = tokenIds.map((id) => window.TF_VOCAB[id]);
    const emb = tokenIds.map((id) => window.TF_EMB[id].slice());
    const pe = positionalEncoding(tokenIds.length, C.dModel);
    const X0 = addMat(emb, pe);

    const blocks = [];
    let X = X0;
    for (let b = 0; b < C.nBlocks; b++) {
      const blk = block(X, W, maskOn);
      blocks.push(blk);
      X = blk.out;
    }

    // final head: take LAST token representation
    const finalNorm = layerNorm(X);
    const lastIdx = tokenIds.length - 1;
    const lastVec = finalNorm.out[lastIdx];
    const logits = window.TF_WVOCAB[0].map((_, j) =>
      lastVec.reduce((s, x, i) => s + x * window.TF_WVOCAB[i][j], 0) + window.TF_BVOCAB[j]
    );
    const probs = softmaxRow(logits);
    const predId = probs.indexOf(Math.max(...probs));

    return {
      tokenIds, tokens, maskOn,
      emb, pe, X0,
      blocks,
      finalNorm, lastIdx, lastVec, logits, probs, predId,
    };
  }

  window.TFEngine = {
    run, matmul, transpose, dot, softmaxRow, layerNormRow,
    positionalEncoding, relu, sliceCols,
  };
})();
