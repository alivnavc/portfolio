(function () {
  // ── Classification ──
  const RF_CLS = {
    features: ["petal_len", "petal_wid"],
    labels: ["setosa", "versicolor", "virginica"],
    colors: ["#4caf50", "#2196f3", "#ff9800"],
    data: [
      [1.4, 0.2, 0], [1.3, 0.2, 0], [1.5, 0.3, 0], [1.6, 0.2, 0],
      [4.5, 1.5, 1], [4.7, 1.4, 1], [4.6, 1.3, 1], [5.0, 1.6, 1],
      [6.0, 2.1, 2], [5.9, 2.2, 2], [6.1, 2.0, 2], [5.8, 2.3, 2],
    ],
    // Bootstrap sample indices (with replacement, size 12)
    bootstraps: [
      [0, 0, 2, 3, 4, 5, 6, 6, 8, 9, 10, 11],
      [0, 1, 2, 4, 4, 5, 7, 8, 8, 9, 11, 11],
      [1, 2, 3, 3, 4, 6, 7, 8, 9, 10, 10, 11],
    ],
    trees: [
      // Tree 1: petal_len <= 2.4 → setosa / petal_wid <= 1.7 → versicolor / virginica
      {
        id: 1,
        feature: 0, threshold: 2.4, featureName: "petal_len",
        left: { label: 0 },
        right: {
          feature: 1, threshold: 1.7, featureName: "petal_wid",
          left: { label: 1 },
          right: { label: 2 },
        },
      },
      // Tree 2: petal_len <= 2.6 → setosa / petal_wid <= 1.9 → versicolor / virginica
      {
        id: 2,
        feature: 0, threshold: 2.6, featureName: "petal_len",
        left: { label: 0 },
        right: {
          feature: 1, threshold: 1.9, featureName: "petal_wid",
          left: { label: 1 },
          right: { label: 2 },
        },
      },
      // Tree 3: petal_len <= 2.5 → setosa / petal_len <= 5.2 → versicolor / virginica
      {
        id: 3,
        feature: 0, threshold: 2.5, featureName: "petal_len",
        left: { label: 0 },
        right: {
          feature: 0, threshold: 5.2, featureName: "petal_len",
          left: { label: 1 },
          right: { label: 2 },
        },
      },
    ],
    default: { petal_len: 4.5, petal_wid: 1.5 },
  };

  function predictTreeCls(tree, x) {
    const path = [];
    let node = tree;
    while (node.feature !== undefined) {
      const val = x[node.feature];
      const goLeft = val <= node.threshold;
      path.push({ node, val, goLeft });
      node = goLeft ? node.left : node.right;
    }
    path.push({ node, leaf: true });
    return { label: node.label, path };
  }

  function runRFCls(input) {
    const x = [input.petal_len, input.petal_wid];
    const results = RF_CLS.trees.map(t => predictTreeCls(t, x));
    const votes = results.map(r => r.label);
    const counts = [0, 0, 0];
    votes.forEach(v => counts[v]++);
    const label = counts.indexOf(Math.max(...counts));
    const confidence = Math.max(...counts) / votes.length;

    // OOB indices for each tree (indices NOT in bootstrap)
    const allIdx = Array.from({ length: 12 }, (_, i) => i);
    const oob = RF_CLS.bootstraps.map(bs => {
      const bsSet = new Set(bs);
      return allIdx.filter(i => !bsSet.has(i));
    });

    // Feature importance: count feature usage across trees
    const importance = [0, 0];
    RF_CLS.trees.forEach(t => {
      importance[t.feature]++;
      if (t.right && t.right.feature !== undefined) importance[t.right.feature]++;
    });
    const totalImp = importance.reduce((a, b) => a + b, 0);
    const impNorm = importance.map(v => v / totalImp);

    return { x, input, votes, counts, label, confidence, paths: results.map(r => r.path), cfg: RF_CLS, oob, importance: impNorm };
  }

  // ── Regression ──
  const RF_REG = {
    feature: "age",
    target: "price ($100k)",
    data: [
      [5, 8.2], [7, 7.5], [10, 6.8], [12, 5.7],
      [20, 3.8], [28, 2.9], [35, 2.2], [42, 1.8],
    ],
    bootstraps: [
      [0, 0, 2, 3, 4, 5, 6, 7],
      [0, 1, 3, 4, 4, 5, 6, 7],
      [1, 2, 3, 4, 5, 6, 7, 7],
    ],
    trees: [
      // Tree 1: age <= 10 → avg([8.2,7.5,6.8]) = 7.5 / age <= 25 → avg([5.7,3.8]) = 4.75 / avg([2.9,2.2,1.8]) = 2.3
      {
        id: 1,
        threshold: 10,
        left: { predict: 7.5, desc: "age ≤ 10" },
        right: {
          threshold: 25,
          left: { predict: 4.75, desc: "10 < age ≤ 25" },
          right: { predict: 2.3, desc: "age > 25" },
        },
      },
      // Tree 2: age <= 9 → 7.85 / age <= 20 → 6.25 / avg right = 2.63
      {
        id: 2,
        threshold: 9,
        left: { predict: 7.85, desc: "age ≤ 9" },
        right: {
          threshold: 20,
          left: { predict: 6.25, desc: "9 < age ≤ 20" },
          right: { predict: 2.63, desc: "age > 20" },
        },
      },
      // Tree 3: age <= 11 → 7.05 / age <= 30 → 4.275 / avg = 2.0
      {
        id: 3,
        threshold: 11,
        left: { predict: 7.05, desc: "age ≤ 11" },
        right: {
          threshold: 30,
          left: { predict: 4.275, desc: "11 < age ≤ 30" },
          right: { predict: 2.0, desc: "age > 30" },
        },
      },
    ],
    default: { age: 15 },
  };

  function predictRegTree(tree, age) {
    const path = [];
    let node = tree;
    while (node.threshold !== undefined && node.left !== undefined && node.right !== undefined) {
      const goLeft = age <= node.threshold;
      path.push({ node, age, goLeft });
      node = goLeft ? node.left : node.right;
    }
    path.push({ node, leaf: true });
    return { predict: node.predict, path };
  }

  function runRFReg(input) {
    const age = input.age;
    const results = RF_REG.trees.map(t => predictRegTree(t, age));
    const preds = results.map(r => r.predict);
    const avg = preds.reduce((a, b) => a + b, 0) / preds.length;

    // Compute curve for SVG: sweep age 1..45
    const curve = Array.from({ length: 45 }, (_, i) => {
      const a = i + 1;
      const ps = RF_REG.trees.map(t => predictRegTree(t, a).predict);
      return { age: a, pred: ps.reduce((x, y) => x + y, 0) / ps.length, treePreds: ps };
    });

    // Individual tree curves
    const treeCurves = RF_REG.trees.map(t =>
      Array.from({ length: 45 }, (_, i) => ({
        age: i + 1,
        pred: predictRegTree(t, i + 1).predict,
      }))
    );

    // OOB
    const allIdx = Array.from({ length: 8 }, (_, i) => i);
    const oob = RF_REG.bootstraps.map(bs => {
      const bsSet = new Set(bs);
      return allIdx.filter(i => !bsSet.has(i));
    });

    return { input, age, preds, avg, paths: results.map(r => r.path), cfg: RF_REG, curve, treeCurves, oob };
  }

  window.ML_RF = { RF_CLS, RF_REG, runRFCls, runRFReg, predictTreeCls, predictRegTree };
})();
