(function() {
  // ── Classification ──
  // 10 linearly separable 2D points, 2 classes (+1/-1)
  // Hard-coded optimal hyperplane: w = [1, 1], b = -6 (x1 + x2 = 6)
  const SVM_CLS = {
    data: [
      // [x1, x2, label]
      [2,2,-1],[1,3,-1],[3,2,-1],[2,4,-1],[4,3,-1],  // negative class (bottom-left)
      [6,7,1],[7,6,1],[8,7,1],[6,8,1],[7,8,1],        // positive class (top-right)
    ],
    labels: ["-1 (class A)", "+1 (class B)"],
    // Optimal hyperplane (pre-computed, scaled so functional margin = 1)
    // Unscaled: w=[1,1], b=-10 → hyperplane x1+x2=10
    // Scaled (unit functional margin): w=[1/3,1/3], b=-10/3
    // SVs: pos (7,6),(6,7) → w·x+b = 13/3−10/3 = 1 ✓
    //      neg (4,3)       → w·x+b = 7/3−10/3 = −1 ✓
    w: [1/3, 1/3],
    b: -10/3,
    margin: 3 * Math.sqrt(2),  // 2/||w|| = 2/(sqrt(2)/3) = 3*sqrt(2)
    // Support vectors (on margin lines, functional margin = ±1):
    svPos: [[7,6],[6,7]],  // w·x+b = +1
    svNeg: [[4,3]],        // w·x+b = -1
    hyperplaneC: 10,       // x1+x2 = 10 (hyperplane)
    marginPosC: 13,        // x1+x2 = 13 (positive margin line)
    marginNegC: 7,         // x1+x2 = 7  (negative margin line)
    default: { x1: 5.5, x2: 5.5 }
  };

  function signedDist(pt, w, b) {
    return w.reduce((s, wi, i) => s + wi * pt[i], b);
  }

  function runSVMCls(input) {
    const query = [input.x1, input.x2];
    const dist = signedDist(query, SVM_CLS.w, SVM_CLS.b);
    const label = dist >= 0 ? 1 : -1;
    const marginDist = Math.abs(dist) / Math.sqrt(SVM_CLS.w.reduce((s,v) => s+v*v, 0));
    // functional margins for all points
    const margins = SVM_CLS.data.map(pt => pt[2] * signedDist(pt, SVM_CLS.w, SVM_CLS.b));
    return { query, dist, label, marginDist, margins, cfg: SVM_CLS };
  }

  // ── Regression (SVR) ──
  // 10 1D points with epsilon tube
  // Pre-fitted SVR with epsilon=0.8
  const SVM_REG = {
    xs: [1,2,3,4,5,6,7,8,9,10],
    ys: [2.1,3.9,5.2,6.8,7.5,7.2,6.5,5.8,6.3,7.1],
    // Fitted SVR: w=0.4, b=3.5, epsilon=0.8
    w: 0.4, b: 3.5, epsilon: 0.8,
    // Support vectors (points outside or on epsilon tube)
    svIndices: [0, 3, 5, 8, 9],
    default: { x: 5.0 }
  };

  function runSVMReg(input) {
    const pred = SVM_REG.w * input.x + SVM_REG.b;
    const tubeLo = pred - SVM_REG.epsilon;
    const tubeHi = pred + SVM_REG.epsilon;
    // Which points are support vectors (outside tube)?
    const allPreds = SVM_REG.xs.map(x => SVM_REG.w * x + SVM_REG.b);
    const residuals = SVM_REG.ys.map((y, i) => y - allPreds[i]);
    const isSV = residuals.map(r => Math.abs(r) >= SVM_REG.epsilon * 0.9);
    return { x: input.x, pred, tubeLo, tubeHi, allPreds, residuals, isSV, cfg: SVM_REG };
  }

  window.ML_SVM = { SVM_CLS, SVM_REG, runSVMCls, runSVMReg, signedDist };
})();
