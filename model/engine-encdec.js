/* ============================================================
   Encoder–Decoder engine (original Transformer / T5 / BART).
   Encoder: bidirectional self-attention over the SOURCE.
   Decoder: causal self-attention over the TARGET, then
   CROSS-attention (decoder queries attend to encoder keys/
   values), then FFN. Reuses helpers from window.TFEngine and
   the same toy weights (shared for simplicity — real models
   keep encoder/decoder weights separate).
   ============================================================ */
(function () {
  const C = window.TF_CONFIG;
  const E = window.TFEngine;
  const slice = E.sliceCols;
  const matmul = E.matmul, transpose = E.transpose, softmaxRow = E.softmaxRow;

  const addMat = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
  const addVec = (A, v) => A.map((r) => r.map((x, j) => x + v[j]));
  const layerNorm = (M) => { const stats = M.map(E.layerNormRow); return { out: stats.map((s) => s.out), stats }; };

  /* multi-head attention. Xq supplies queries; Xkv supplies keys+values.
     maskOn applies a causal mask (only meaningful when Xq===Xkv). */
  function mha(Xq, Xkv, W, maskOn) {
    const scale = Math.sqrt(C.dHead);
    const heads = [];
    let concat = Xq.map(() => []);
    for (let h = 0; h < C.nHeads; h++) {
      const a = h * C.dHead, b = a + C.dHead;
      const Q = matmul(Xq, slice(W.Wq, a, b));
      const K = matmul(Xkv, slice(W.Wk, a, b));
      const Vv = matmul(Xkv, slice(W.Wv, a, b));
      const raw = Q.map((qr) => K.map((kr) => qr.reduce((s, q, d) => s + q * kr[d], 0) / scale));
      const masked = raw.map((r, i) => r.map((v, j) => (maskOn && j > i ? -Infinity : v)));
      const attn = masked.map(softmaxRow);
      const out = attn.map((wRow) => Vv[0].map((_, d) => wRow.reduce((s, w, j) => s + w * Vv[j][d], 0)));
      heads.push({ Q, K, V: Vv, rawScores: raw, masked, attn, out });
      concat = concat.map((r, i) => r.concat(out[i]));
    }
    const proj = matmul(concat, W.Wo);
    return { heads, concat, proj };
  }

  function ffn(X, W) {
    const ff1raw = addVec(matmul(X, W.W1), W.B1);
    const ff1 = ff1raw.map((r) => r.map((x) => Math.max(0, x)));
    const ff2 = addVec(matmul(ff1, W.W2), W.B2);
    return { ff1raw, ff1, ff2 };
  }

  function run(srcIds, tgtIds, maskOn) {
    const W = {
      Wq: window.TF_WQ, Wk: window.TF_WK, Wv: window.TF_WV, Wo: window.TF_WO,
      W1: window.TF_W1, B1: window.TF_B1, W2: window.TF_W2, B2: window.TF_B2,
    };
    if (!tgtIds || tgtIds.length < 1) tgtIds = [0, 1];
    const selfMask = maskOn == null ? true : maskOn;

    /* ---- ENCODER (bidirectional) — reuse the standard engine ---- */
    const encTrace = E.run(srcIds, false);
    const memory = encTrace.finalNorm.out;             // keys/values for cross-attn
    const srcTokens = srcIds.map((id) => window.TF_VOCAB[id]);

    /* ---- DECODER ---- */
    const tgtTokens = tgtIds.map((id) => window.TF_VOCAB[id]);
    const emb = tgtIds.map((id) => window.TF_EMB[id].slice());
    const pe = E.positionalEncoding(tgtIds.length, C.dModel);
    const decX0 = addMat(emb, pe);

    const decBlocks = [];
    let X = decX0;
    for (let bi = 0; bi < C.nBlocks; bi++) {
      const self = mha(X, X, W, selfMask);             // masked self-attention
      const sRes = addMat(X, self.proj); const sNorm = layerNorm(sRes);
      const cross = mha(sNorm.out, memory, W, false);  // cross-attention (no mask)
      const cRes = addMat(sNorm.out, cross.proj); const cNorm = layerNorm(cRes);
      const f = ffn(cNorm.out, W);
      const fRes = addMat(cNorm.out, f.ff2); const fNorm = layerNorm(fRes);
      decBlocks.push({ self, sRes, sNorm, cross, cRes, cNorm, ffn: f, fRes, fNorm, out: fNorm.out });
      X = fNorm.out;
    }

    const finalNorm = layerNorm(X);
    const lastIdx = tgtIds.length - 1;
    const lastVec = finalNorm.out[lastIdx];
    const logits = window.TF_WVOCAB[0].map((_, j) =>
      lastVec.reduce((s, x, i) => s + x * window.TF_WVOCAB[i][j], 0) + window.TF_BVOCAB[j]);
    const probs = softmaxRow(logits);
    const predId = probs.indexOf(Math.max(...probs));

    return {
      arch: "encdec", src: srcIds, tgt: tgtIds, srcTokens, tgtTokens, maskOn: selfMask,
      encTrace, memory,
      emb, pe, decX0, decBlocks,
      finalNorm, lastIdx, lastVec, logits, probs, predId,
      // convenience aliases so reused matrix code that reads `.tokens` still works for the decoder
      tokens: tgtTokens, tokenIds: tgtIds,
    };
  }

  window.TFEncDec = { run, mha };
})();
