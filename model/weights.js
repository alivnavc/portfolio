/* ============================================================
   Toy decoder-only transformer — fixed weights & config.
   Everything is deliberately tiny so every matrix is readable.
   Numbers are hand-authored (one decimal) and UNTRAINED — the
   point is the mechanism, not a smart prediction.
   ============================================================ */
window.TF_CONFIG = {
  dModel: 4,
  nHeads: 2,
  dHead: 2,       // dModel / nHeads
  dFF: 8,
  nBlocks: 2,     // we actually run 2 identical blocks to show "stacking"
  maxSeq: 6,
};

/* Vocabulary — 10 words. Token id = index. */
window.TF_VOCAB = ["the", "cat", "sat", "on", "mat", "dog", "ran", "fast", "big", "."];

/* Default prompt */
window.TF_DEFAULT = [0, 1, 2, 3]; // "the cat sat on"

/* Token embedding table E  (vocab 10 × dModel 4) */
window.TF_EMB = [
  [ 0.2, -0.4,  0.1,  0.5], // the
  [ 0.6,  0.3, -0.5,  0.2], // cat
  [-0.3,  0.5,  0.4, -0.2], // sat
  [ 0.1, -0.2,  0.6,  0.3], // on
  [-0.5,  0.4,  0.2,  0.6], // mat
  [ 0.7,  0.1, -0.3, -0.4], // dog
  [-0.2, -0.6,  0.5,  0.1], // ran
  [ 0.4,  0.2, -0.1, -0.5], // fast
  [-0.6,  0.3,  0.4,  0.2], // big
  [ 0.0, -0.3, -0.2,  0.4], // .
];

/* Attention projection weights (each dModel 4 × dModel 4).
   Columns 0–1 feed head 1, columns 2–3 feed head 2. */
window.TF_WQ = [
  [ 0.3, -0.2,  0.1,  0.4],
  [ 0.5,  0.1, -0.3,  0.2],
  [-0.1,  0.4,  0.2, -0.5],
  [ 0.2, -0.3,  0.6,  0.1],
];
window.TF_WK = [
  [ 0.1,  0.3, -0.4,  0.2],
  [-0.2,  0.5,  0.1,  0.3],
  [ 0.4, -0.1,  0.2, -0.3],
  [ 0.3,  0.2, -0.5,  0.4],
];
window.TF_WV = [
  [ 0.2,  0.1,  0.3, -0.2],
  [ 0.4, -0.3,  0.1,  0.5],
  [-0.1,  0.2, -0.4,  0.3],
  [ 0.3,  0.5,  0.2, -0.1],
];
/* Output projection W_O (dModel 4 × dModel 4) */
window.TF_WO = [
  [ 0.2, -0.1,  0.4,  0.1],
  [ 0.3,  0.2, -0.2,  0.5],
  [-0.4,  0.1,  0.3, -0.2],
  [ 0.1,  0.4, -0.1,  0.3],
];

/* Feed-forward network: dModel 4 → dFF 8 → dModel 4 */
window.TF_W1 = [
  [ 0.2, -0.3,  0.1,  0.4, -0.2,  0.3,  0.1, -0.4],
  [ 0.1,  0.5, -0.2,  0.2,  0.4, -0.1,  0.3,  0.2],
  [-0.3,  0.2,  0.4, -0.1,  0.1,  0.5, -0.2,  0.3],
  [ 0.4, -0.1,  0.2,  0.3, -0.3,  0.2,  0.5, -0.1],
];
window.TF_B1 = [ 0.1, -0.1,  0.0,  0.2, -0.2,  0.1,  0.0, -0.1];
window.TF_W2 = [
  [ 0.3, -0.2,  0.1,  0.2],
  [-0.1,  0.4,  0.2, -0.3],
  [ 0.2,  0.1, -0.4,  0.3],
  [ 0.4, -0.3,  0.2,  0.1],
  [-0.2,  0.2,  0.3, -0.1],
  [ 0.1,  0.5, -0.1,  0.2],
  [ 0.3, -0.1,  0.2,  0.4],
  [-0.4,  0.3,  0.1, -0.2],
];
window.TF_B2 = [ 0.1,  0.0, -0.1,  0.2];

/* Final unembedding projection (dModel 4 × vocab 10) */
window.TF_WVOCAB = [
  [ 0.3, -0.2,  0.4,  0.1, -0.3,  0.2,  0.5, -0.1,  0.2, -0.4],
  [ 0.1,  0.4, -0.2,  0.3,  0.2, -0.4,  0.1,  0.3, -0.1,  0.2],
  [-0.2,  0.1,  0.3, -0.4,  0.4,  0.1, -0.2,  0.2,  0.3, -0.1],
  [ 0.4, -0.3,  0.1,  0.2, -0.1,  0.3,  0.2, -0.4,  0.1,  0.5],
];
window.TF_BVOCAB = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
