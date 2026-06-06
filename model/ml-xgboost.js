(function () {
  // ── XGBoost Regression — toy dataset (same as GBM for direct comparison) ──
  const XGB = {
    xs: [5, 10, 15, 20, 25, 30],   // house age (years)
    ys: [7.5, 6.0, 5.5, 4.0, 3.5, 2.5],  // price ($100k)
    eta: 0.3,       // learning rate
    lambda: 1.0,    // L2 regularization
    gamma: 0.0,     // min gain threshold
    maxDepth: 2,
  };

  // ── Helpers ──
  function mse(ys, preds) {
    return ys.reduce((s, y, i) => s + (y - preds[i]) ** 2, 0) / ys.length;
  }

  // GBM leaf value: mean of residuals (unregularized)
  function gbmLeafValue(residuals) {
    if (residuals.length === 0) return 0;
    return residuals.reduce((a, b) => a + b, 0) / residuals.length;
  }

  // XGBoost leaf value: -sum(gradients) / (sum(hessians) + lambda)
  function xgbLeafValue(gradients, hessians, lambda) {
    if (gradients.length === 0) return 0;
    const G = gradients.reduce((a, b) => a + b, 0);
    const H = hessians.reduce((a, b) => a + b, 0);
    return -G / (H + lambda);
  }

  // Similarity Score: G^2 / (H + lambda)
  function similarityScore(gradients, hessians, lambda) {
    const G = gradients.reduce((a, b) => a + b, 0);
    const H = hessians.reduce((a, b) => a + b, 0);
    return (G * G) / (H + lambda);
  }

  // ── Find the best split for a single-feature dataset ──
  function findBestSplit(xs, gradients, hessians, lambda, gamma) {
    const n = xs.length;
    // candidate thresholds: midpoints between sorted unique values
    const sorted = [...xs].sort((a, b) => a - b);
    const thresholds = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      thresholds.push((sorted[i] + sorted[i + 1]) / 2);
    }

    const ssRoot = similarityScore(gradients, hessians, lambda);
    let bestGain = -Infinity;
    let bestThreshold = thresholds[0];
    let bestLeftIndices = [];
    let bestRightIndices = [];
    let bestSSLeft = 0;
    let bestSSRight = 0;
    const thresholdResults = [];

    for (const thr of thresholds) {
      const leftIdx = xs.map((x, i) => i).filter(i => xs[i] <= thr);
      const rightIdx = xs.map((x, i) => i).filter(i => xs[i] > thr);

      if (leftIdx.length === 0 || rightIdx.length === 0) continue;

      const gLeft = leftIdx.map(i => gradients[i]);
      const hLeft = leftIdx.map(i => hessians[i]);
      const gRight = rightIdx.map(i => gradients[i]);
      const hRight = rightIdx.map(i => hessians[i]);

      const ssLeft = similarityScore(gLeft, hLeft, lambda);
      const ssRight = similarityScore(gRight, hRight, lambda);
      const gain = ssLeft + ssRight - ssRoot - gamma;

      thresholdResults.push({ threshold: thr, ssLeft, ssRight, gain, leftIdx, rightIdx });

      if (gain > bestGain) {
        bestGain = gain;
        bestThreshold = thr;
        bestLeftIndices = leftIdx;
        bestRightIndices = rightIdx;
        bestSSLeft = ssLeft;
        bestSSRight = ssRight;
      }
    }

    return {
      threshold: bestThreshold,
      gain: bestGain,
      leftIndices: bestLeftIndices,
      rightIndices: bestRightIndices,
      ssRoot,
      ssLeft: bestSSLeft,
      ssRight: bestSSRight,
      thresholdResults,
    };
  }

  // ── Main XGBoost runner ──
  function runXGB(input) {
    const { eta = XGB.eta, lambda = XGB.lambda, gamma = XGB.gamma, nTrees = 3 } = input || {};
    const xs = XGB.xs;
    const ys = XGB.ys;
    const n = xs.length;

    // Initial prediction: mean(y) — same as GBM
    const F0 = ys.reduce((a, b) => a + b, 0) / n;
    let preds = xs.map(() => F0);

    const rounds = [];

    for (let t = 0; t < nTrees; t++) {
      // Compute gradients (first-order) and hessians (second-order) for MSE loss
      // MSE loss: L = (1/2)(y - F)^2
      // g_i = dL/dF = F - y  (negative residual)
      // h_i = d^2L/dF^2 = 1  (constant for MSE)
      const gradients = ys.map((y, i) => preds[i] - y);
      const hessians = ys.map(() => 1);

      // Find best split
      const split = findBestSplit(xs, gradients, hessians, lambda, gamma);

      // Compute XGBoost leaf weights: w* = -G / (H + lambda)
      const gLeft = split.leftIndices.map(i => gradients[i]);
      const hLeft = split.leftIndices.map(i => hessians[i]);
      const gRight = split.rightIndices.map(i => gradients[i]);
      const hRight = split.rightIndices.map(i => hessians[i]);

      const leftLeafWeight = xgbLeafValue(gLeft, hLeft, lambda);
      const rightLeafWeight = xgbLeafValue(gRight, hRight, lambda);

      // Compute GBM leaf values for comparison: mean(residual)
      const residuals = ys.map((y, i) => y - preds[i]);
      const rLeft = split.leftIndices.map(i => residuals[i]);
      const rRight = split.rightIndices.map(i => residuals[i]);
      const leftLeafWeightGBM = gbmLeafValue(rLeft);
      const rightLeafWeightGBM = gbmLeafValue(rRight);

      // Update predictions
      preds = preds.map((p, i) => {
        if (split.leftIndices.includes(i)) return p + eta * leftLeafWeight;
        if (split.rightIndices.includes(i)) return p + eta * rightLeafWeight;
        return p;
      });

      const roundMSE = mse(ys, preds);

      rounds.push({
        treeNum: t + 1,
        gradients: [...gradients],
        hessians: [...hessians],
        splitThreshold: split.threshold,
        splitFeature: "age",
        leftIndices: split.leftIndices,
        rightIndices: split.rightIndices,
        leftLeafWeight,
        rightLeafWeight,
        leftLeafWeightGBM,
        rightLeafWeightGBM,
        similarityRoot: split.ssRoot,
        similarityLeft: split.ssLeft,
        similarityRight: split.ssRight,
        gain: split.gain,
        thresholdResults: split.thresholdResults,
        predictions: [...preds],
        mse: roundMSE,
      });
    }

    const finalMSE = mse(ys, preds);

    return {
      rounds,
      cfg: { ...XGB, eta, lambda, gamma, nTrees },
      F0,
      initPreds: xs.map(() => F0),
      initMSE: mse(ys, xs.map(() => F0)),
      finalPreds: [...preds],
      mse: finalMSE,
    };
  }

  window.ML_XGB = { XGB, runXGB, gbmLeafValue, xgbLeafValue, similarityScore };
})();
