(function () {
  const sigmoid = x => 1 / (1 + Math.exp(-x));

  const LOG = {
    // toy: hours studied (1-6) → pass(1)/fail(0)
    xs: [1.0, 1.5, 2.5, 3.5, 4.5, 5.5, 6.0],
    ys: [0,   0,   0,   1,   1,   1,   1],
    labels: ["fail", "pass"],
    featName: "hours studied",
    // fitted weights
    wFit: 2.8, bFit: -8.5,
    default: { w: 2.8, b: -8.5, x: 3.5 },
  };

  function runLogistic(params) {
    const w = params.w, b = params.b, x = params.x;
    const z = w * x + b;
    const prob = sigmoid(z);
    const pred = prob >= 0.5 ? 1 : 0;

    // predictions for all points
    const probs = LOG.xs.map(xi => sigmoid(w * xi + b));
    const preds = probs.map(p => p >= 0.5 ? 1 : 0);
    const correct = preds.filter((p, i) => p === LOG.ys[i]).length;
    const accuracy = correct / LOG.xs.length;

    // Binary cross-entropy loss (average over all examples)
    const loss = -LOG.xs.reduce((s, xi, i) => {
      const pi = sigmoid(w * xi + b);
      return s + LOG.ys[i] * Math.log(Math.max(pi, 1e-9)) + (1 - LOG.ys[i]) * Math.log(Math.max(1 - pi, 1e-9));
    }, 0) / LOG.xs.length;

    // Per-example losses
    const losses = LOG.xs.map((xi, i) => {
      const pi = sigmoid(w * xi + b);
      return -(LOG.ys[i] * Math.log(Math.max(pi, 1e-9)) + (1 - LOG.ys[i]) * Math.log(Math.max(1 - pi, 1e-9)));
    });

    // Gradients (mean over all examples)
    const n = LOG.xs.length;
    const dw = (1 / n) * LOG.xs.reduce((s, xi, i) => s + (sigmoid(w * xi + b) - LOG.ys[i]) * xi, 0);
    const db = (1 / n) * LOG.xs.reduce((s, xi, i) => s + (sigmoid(w * xi + b) - LOG.ys[i]), 0);

    // Per-example residuals (p - y)
    const residuals = LOG.xs.map((xi, i) => sigmoid(w * xi + b) - LOG.ys[i]);

    // Decision boundary: z = 0 → wx + b = 0 → x = -b/w
    const boundary = w !== 0 ? -b / w : null;

    // Linear regression line for comparison (stage 1 "bad" approach)
    // Simple least-squares fit through (x, y) data
    const xMean = LOG.xs.reduce((a, c) => a + c, 0) / n;
    const yMean = LOG.ys.reduce((a, c) => a + c, 0) / n;
    const ssxx = LOG.xs.reduce((s, xi) => s + (xi - xMean) ** 2, 0);
    const ssxy = LOG.xs.reduce((s, xi, i) => s + (xi - xMean) * (LOG.ys[i] - yMean), 0);
    const wLin = ssxy / ssxx;
    const bLin = yMean - wLin * xMean;

    return {
      w, b, x, z, prob, pred,
      probs, preds, correct, accuracy,
      loss, losses,
      dw, db, residuals,
      boundary,
      wLin, bLin,
      cfg: LOG
    };
  }

  window.ML_LOG = { LOG, runLogistic, sigmoid };
})();
