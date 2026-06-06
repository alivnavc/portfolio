(function () {
  // ── Classification ──
  const KNN_CLS = {
    features: ["x1", "x2"],
    labels: ["class A", "class B", "class C"],
    // 15 labeled points in 2D space (normalized 0-10)
    data: [
      [2,8,0],[1,6,0],[3,7,0],[2,9,0],[1,8,0],   // Class A (top-left region)
      [8,7,1],[7,8,1],[9,6,1],[8,9,1],[7,7,1],   // Class B (top-right)
      [5,2,2],[4,3,2],[6,1,2],[5,3,2],[6,2,2],   // Class C (bottom-middle)
    ],
    default: { x1: 4.0, x2: 6.0, k: 3 },
  };

  function euclidean(a, b) {
    return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i])**2, 0));
  }

  function knnPredict(data, query, k, isRegression) {
    const dists = data.map((pt, i) => ({
      i,
      dist: euclidean(query, pt.slice(0, -1)),
      label: pt[pt.length - 1],
    })).sort((a, b) => a.dist - b.dist);
    const neighbors = dists.slice(0, k);
    if (isRegression) {
      const pred = neighbors.reduce((s, n) => s + n.label, 0) / k;
      return { neighbors, pred, allDists: dists };
    }
    const votes = {};
    neighbors.forEach(n => { votes[n.label] = (votes[n.label] || 0) + 1; });
    const label = parseInt(Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b));
    return { neighbors, votes, label, allDists: dists };
  }

  function runKNNCls(input) {
    const query = [input.x1, input.x2];
    const result = knnPredict(KNN_CLS.data, query, input.k, false);
    return { query, ...result, cfg: KNN_CLS };
  }

  // ── Regression ──
  const KNN_REG = {
    feature: "x",
    target: "y",
    // 12 points: noisy sine-like curve
    data: [
      [1, 2],
      [2, 3.5],
      [3, 5],
      [4, 5.8],
      [5, 5.2],
      [6, 4],
      [7, 3.5],
      [8, 4.2],
      [9, 5.5],
      [10, 6],
      [11, 5.8],
      [12, 4.5],
    ], // [x, y]
    default: { x: 5.5, k: 3 },
  };

  function runKNNReg(input) {
    const query = [input.x];
    const data1d = KNN_REG.data.map(([x, y]) => [x, y]);
    const result = knnPredict(data1d, query, input.k, true);
    return { query: input.x, ...result, cfg: KNN_REG };
  }

  // Build full KNN regression curve for visualization
  function knnRegCurve(k, steps) {
    steps = steps || 60;
    const xs = [];
    const ys = [];
    for (let i = 0; i <= steps; i++) {
      const x = 1 + (i / steps) * 11;
      xs.push(x);
      const res = knnPredict(KNN_REG.data.map(([xi, yi]) => [xi, yi]), [x], k, true);
      ys.push(res.pred);
    }
    return { xs, ys };
  }

  window.ML_KNN = { KNN_CLS, KNN_REG, runKNNCls, runKNNReg, euclidean, knnRegCurve };
})();
