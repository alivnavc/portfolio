(function() {
  // ── Regression ──
  const BOOST_REG = {
    xs: [5, 7, 10, 12, 20, 28, 35, 42],
    ys: [8.2, 7.5, 6.8, 5.7, 3.8, 2.9, 2.2, 1.8],
    eta: 0.5,
    stumps: [
      { threshold: 16, leftVal: 1.95, rightVal: -2.425 },
      { threshold: 10, leftVal: 0.425, rightVal: -0.475 },
      { threshold: 30, leftVal: 0.12, rightVal: -0.38 },
    ],
    default: { x: 15, nTrees: 3 },
  };

  function stumpPredict(stump, x) {
    return x <= stump.threshold ? stump.leftVal : stump.rightVal;
  }

  function runBoostReg(input) {
    const n = input.nTrees;
    const xs = BOOST_REG.xs;
    const ys = BOOST_REG.ys;
    const eta = BOOST_REG.eta;

    const initPred = ys.reduce((a, b) => a + b, 0) / ys.length;

    const rounds = [];
    let preds = xs.map(() => initPred);
    const initRes = ys.map((y, i) => y - preds[i]);
    const initMSE = ys.reduce((s, y, i) => s + (y - preds[i]) ** 2, 0) / ys.length;
    rounds.push({ preds: [...preds], residuals: initRes, stump: null, mse: initMSE });

    for (let t = 0; t < Math.min(n, BOOST_REG.stumps.length); t++) {
      const stump = BOOST_REG.stumps[t];
      const stumpPreds = xs.map(x => stumpPredict(stump, x));
      preds = preds.map((p, i) => p + eta * stumpPreds[i]);
      const newRes = ys.map((y, i) => y - preds[i]);
      const mse = ys.reduce((s, y, i) => s + (y - preds[i]) ** 2, 0) / ys.length;
      rounds.push({ preds: [...preds], residuals: newRes, stumpPreds, stump, mse });
    }

    let queryPred = initPred;
    for (let t = 0; t < Math.min(n, BOOST_REG.stumps.length); t++) {
      queryPred += eta * stumpPredict(BOOST_REG.stumps[t], input.x);
    }

    const mse = rounds[rounds.length - 1].mse;
    return { input, rounds, initPred, queryPred, preds, mse, cfg: BOOST_REG };
  }

  // ── Classification ──
  const BOOST_CLS = {
    data: [
      [0.2, 0, 0],[0.3, 0, 0],[0.5, 0, 0],[0.4, 1, 0],
      [0.6, 1, 1],[0.8, 1, 1],[0.7, 0, 1],[0.9, 1, 1],
    ],
    features: ["word_count", "has_link"],
    labels: ["ham", "spam"],
    eta: 0.5,
    stumps: [
      { feature: 0, threshold: 0.55, leftVal: -0.875, rightVal: 0.875 },
      { feature: 1, threshold: 0.5,  leftVal: -0.3,   rightVal: 0.3   },
      { feature: 0, threshold: 0.35, leftVal: -0.15,  rightVal: 0.1   },
    ],
    default: { f0: 0.6, f1: 1, nTrees: 3 },
  };

  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

  function logLoss(ys, probs) {
    const eps = 1e-9;
    return ys.reduce((s, y, i) => {
      const p = Math.max(eps, Math.min(1 - eps, probs[i]));
      return s - (y * Math.log(p) + (1 - y) * Math.log(1 - p));
    }, 0) / ys.length;
  }

  function runBoostCls(input) {
    const data = BOOST_CLS.data;
    const ys = data.map(d => d[2]);
    const eta = BOOST_CLS.eta;
    const n = input.nTrees;

    const pMean = ys.reduce((a, b) => a + b, 0) / ys.length;
    const initLogOdds = Math.log(pMean / (1 - pMean));

    const rounds = [];
    let logOdds = data.map(() => initLogOdds);
    let probs = logOdds.map(sigmoid);
    const residuals0 = ys.map((y, i) => y - probs[i]);
    rounds.push({ logOdds: [...logOdds], probs: [...probs], residuals: residuals0, stump: null, loss: logLoss(ys, probs) });

    for (let t = 0; t < Math.min(n, BOOST_CLS.stumps.length); t++) {
      const stump = BOOST_CLS.stumps[t];
      const stumpPreds = data.map(d => d[stump.feature] <= stump.threshold ? stump.leftVal : stump.rightVal);
      logOdds = logOdds.map((lo, i) => lo + eta * stumpPreds[i]);
      probs = logOdds.map(sigmoid);
      const newRes = ys.map((y, i) => y - probs[i]);
      rounds.push({ logOdds: [...logOdds], probs: [...probs], residuals: newRes, stumpPreds, stump, loss: logLoss(ys, probs) });
    }

    let queryLogOdds = initLogOdds;
    const x = [input.f0, input.f1];
    for (let t = 0; t < Math.min(n, BOOST_CLS.stumps.length); t++) {
      const stump = BOOST_CLS.stumps[t];
      queryLogOdds += eta * (x[stump.feature] <= stump.threshold ? stump.leftVal : stump.rightVal);
    }
    const queryProb = sigmoid(queryLogOdds);
    const queryLabel = queryProb >= 0.5 ? 1 : 0;

    const accuracy = probs.filter((p, i) => (p >= 0.5 ? 1 : 0) === ys[i]).length / data.length;
    return { input, rounds, initLogOdds, queryLogOdds, queryProb, queryLabel, probs, accuracy, cfg: BOOST_CLS };
  }

  window.ML_BOOST = { BOOST_REG, BOOST_CLS, runBoostReg, runBoostCls, sigmoid };
})();
