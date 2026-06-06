(function () {
  // ── Classification ──
  const DT_CLS = {
    features: ["petal_len", "petal_wid"],
    labels: ["setosa", "versicolor", "virginica"],
    data: [
      // [petal_len, petal_wid, class]
      [1.4, 0.2, 0], [1.3, 0.2, 0], [1.5, 0.3, 0], [1.6, 0.2, 0],
      [4.5, 1.5, 1], [4.7, 1.4, 1], [4.6, 1.3, 1], [5.0, 1.6, 1],
      [6.0, 2.1, 2], [5.9, 2.2, 2], [6.1, 2.0, 2], [5.8, 2.3, 2],
    ],
    // hard-coded tree
    tree: {
      feature: 0, threshold: 2.5, gini: 0.665, samples: 12,
      left: { label: 0, count: [4, 0, 0], gini: 0.0, samples: 4 },
      right: {
        feature: 1, threshold: 1.8, gini: 0.5, samples: 8,
        left:  { label: 1, count: [0, 4, 0], gini: 0.0, samples: 4 },
        right: { label: 2, count: [0, 0, 4], gini: 0.0, samples: 4 },
      },
    },
    default: { petal_len: 4.5, petal_wid: 1.5 },
  };

  function gini(counts) {
    const n = counts.reduce((a, b) => a + b, 0);
    if (n === 0) return 0;
    return 1 - counts.reduce((s, c) => s + (c / n) ** 2, 0);
  }

  function predictCls(node, x) {
    const path = [];
    let cur = node;
    while (cur.feature !== undefined) {
      const val = x[cur.feature];
      const goLeft = val <= cur.threshold;
      path.push({ node: cur, val, goLeft });
      cur = goLeft ? cur.left : cur.right;
    }
    path.push({ node: cur, leaf: true });
    return { label: cur.label, path };
  }

  function runDTreeCls(input) {
    const x = [input.petal_len, input.petal_wid];
    const result = predictCls(DT_CLS.tree, x);
    return { x, input, label: result.label, path: result.path, cfg: DT_CLS };
  }

  // ── Regression ──
  const DT_REG = {
    feature: "age",
    target: "price ($100k)",
    data: [
      // [age, price]
      [5, 8.2], [7, 7.5], [10, 6.8], [12, 5.7],
      [20, 3.8], [28, 2.9], [35, 2.2], [42, 1.8],
    ],
    tree: {
      feature: "age", threshold: 15, variance: 5.2, samples: 8,
      left: {
        feature: "age", threshold: 8, variance: 0.9, samples: 4,
        left:  { predict: 7.85, samples: [[5, 8.2], [7, 7.5]], variance: 0.12 },
        right: { predict: 6.25, samples: [[10, 6.8], [12, 5.7]], variance: 0.30 },
      },
      right: { predict: 2.675, samples: [[20, 3.8], [28, 2.9], [35, 2.2], [42, 1.8]], variance: 0.55 },
    },
    default: { age: 15 },
  };

  function predictReg(node, age) {
    const path = [];
    let cur = node;
    while (cur.feature !== undefined) {
      const goLeft = age <= cur.threshold;
      path.push({ node: cur, val: age, goLeft });
      cur = goLeft ? cur.left : cur.right;
    }
    path.push({ node: cur, leaf: true });
    return { predict: cur.predict, path };
  }

  function runDTreeReg(input) {
    const result = predictReg(DT_REG.tree, input.age);
    return { input, predict: result.predict, path: result.path, cfg: DT_REG };
  }

  window.ML_DTREE = { DT_CLS, DT_REG, runDTreeCls, runDTreeReg, gini };
})();
