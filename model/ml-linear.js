(function () {
  const LIN = {
    // toy dataset: house sizes (normalized 0–1) → prices ($100k)
    xs: [0.1, 0.2, 0.4, 0.6, 0.8, 1.0],
    ys: [1.2, 1.8, 3.1, 4.4, 5.9, 7.2],
    featName: "size (normalized)",
    targetName: "price ($100k)",
    // optimal fitted weights (normal equation solution)
    wOpt: 6.1, bOpt: 0.55,
    default: { w: 3.0, b: 1.0 },
  };

  function runLinear(params) {
    const w = params.w, b = params.b;
    const n = LIN.xs.length;

    // forward pass: predictions
    const preds = LIN.xs.map(x => w * x + b);

    // residuals: ŷ - y
    const resid = preds.map((p, i) => p - LIN.ys[i]);

    // MSE loss
    const mse = resid.reduce((s, r) => s + r * r, 0) / n;

    // gradients of MSE w.r.t. w and b
    const dw = (2 / n) * LIN.xs.reduce((s, x, i) => s + resid[i] * x, 0);
    const db = (2 / n) * resid.reduce((s, r) => s + r, 0);

    // normal equation closed-form solution
    const xMean = LIN.xs.reduce((a, c) => a + c, 0) / n;
    const yMean = LIN.ys.reduce((a, c) => a + c, 0) / n;
    const ssxx = LIN.xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
    const ssxy = LIN.xs.reduce((s, x, i) => s + (x - xMean) * (LIN.ys[i] - yMean), 0);
    const wNorm = ssxy / ssxx;
    const bNorm = yMean - wNorm * xMean;

    // MSE at normal-equation solution
    const predNorm = LIN.xs.map(x => wNorm * x + bNorm);
    const mseNorm = predNorm.reduce((s, p, i) => s + (p - LIN.ys[i]) ** 2, 0) / n;

    // R² coefficient of determination
    const ssTot = LIN.ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
    const ssRes = resid.reduce((s, r) => s + r * r, 0);
    const r2 = 1 - ssRes / ssTot;

    // multi-feature extended dataset: size + bedrooms → price
    const xs2 = [
      [0.1, 1], [0.2, 1], [0.4, 2], [0.5, 2], [0.6, 3], [0.8, 3], [1.0, 4],
    ];
    const ys2 = [1.1, 1.9, 3.0, 3.6, 4.7, 6.0, 7.8];
    // fixed weights for multi-feature demo: w1=5.5, w2=0.4, b=0.2
    const wMul = [5.5, 0.4], bMul = 0.2;
    const predsMul = xs2.map(x => wMul[0] * x[0] + wMul[1] * x[1] + bMul);
    const residMul = predsMul.map((p, i) => p - ys2[i]);
    const mseMul = residMul.reduce((s, r) => s + r * r, 0) / xs2.length;

    return {
      w, b, preds, resid, mse, dw, db, wNorm, bNorm, mseNorm, r2,
      xs2, ys2, wMul, bMul, predsMul, residMul, mseMul,
      cfg: LIN,
    };
  }

  window.ML_LIN = { LIN, runLinear };
})();
