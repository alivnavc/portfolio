(function () {
  // ── PCA — toy dataset: 6 students, 2 features ──
  const DATA = {
    students: ["Alice", "Bob", "Carol", "David", "Eve", "Frank"],
    math:    [90, 80, 85, 70, 75, 60],
    physics: [88, 82, 86, 72, 74, 62],
  };

  // ── Helpers ──
  function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function std(arr, mu) {
    const m = mu !== undefined ? mu : mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
  }

  function dot(a, b) {
    return a.reduce((s, v, i) => s + v * b[i], 0);
  }

  // Matrix multiply: A (m×k) × B (k×n) → (m×n)
  function matMul(A, B) {
    const m = A.length, k = A[0].length, n = B[0].length;
    const C = Array.from({ length: m }, () => Array(n).fill(0));
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        for (let p = 0; p < k; p++)
          C[i][j] += A[i][p] * B[p][j];
    return C;
  }

  // Transpose a 2D array
  function transpose(M) {
    return M[0].map((_, j) => M.map(row => row[j]));
  }

  // ── Main PCA computation ──
  function runPCA() {
    const n = DATA.students.length;

    // 1. Original data matrix X: rows=students, cols=[math, physics]
    const X = DATA.students.map((_, i) => [DATA.math[i], DATA.physics[i]]);

    // 2. Standardize
    const mathVals = DATA.math;
    const physVals = DATA.physics;

    const mathMean = mean(mathVals);  // 76.6667
    const physMean = mean(physVals);  // 77.3333
    const mathStd  = std(mathVals, mathMean);  // 10.8012
    const physStd  = std(physVals, physMean);  // 9.8522

    const X_std = X.map(([m, p]) => [
      (m - mathMean) / mathStd,
      (p - physMean) / physStd,
    ]);

    // 3. Covariance matrix C = (1/(n-1)) * X_std^T * X_std
    const X_std_T = transpose(X_std);
    const XtX = matMul(X_std_T, X_std);
    const C = XtX.map(row => row.map(v => v / (n - 1)));
    // Expected: [[1.0, ~0.990], [~0.990, 1.0]]

    // 4. Eigendecomposition of 2×2 symmetric matrix [[a,b],[b,d]]
    //    det(C - λI) = 0  →  (a-λ)(d-λ) - b² = 0
    const a = C[0][0], b = C[0][1], d = C[1][1];
    // λ² - (a+d)λ + (ad - b²) = 0
    const trace = a + d;
    const det   = a * d - b * b;
    const disc  = Math.sqrt(trace * trace - 4 * det);
    const lam1  = (trace + disc) / 2;  // larger eigenvalue ~1.997
    const lam2  = (trace - disc) / 2;  // smaller eigenvalue ~0.003

    // Eigenvectors for 2×2 symmetric with equal diagonal (a==d):
    //   PC1: [1/√2, 1/√2] = [0.707, 0.707]  (sum direction)
    //   PC2: [1/√2, -1/√2] = [0.707, -0.707] (difference direction)
    // For a general 2×2: (C - λI)v = 0
    // Row 1: (a - λ)v₁ + b·v₂ = 0  →  v₁/v₂ = -b/(a-λ)
    function eigenvector(lambda) {
      let vx, vy;
      const denom = a - lambda;
      if (Math.abs(denom) > 1e-10) {
        vx = -b;
        vy = denom;
      } else {
        vx = d - lambda;
        vy = -b;
      }
      const norm = Math.sqrt(vx * vx + vy * vy);
      vx /= norm; vy /= norm;
      // Canonical form: first component positive
      if (vx < 0) { vx = -vx; vy = -vy; }
      return [vx, vy];
    }

    const pc1 = eigenvector(lam1);  // [0.707, 0.707]
    const pc2 = eigenvector(lam2);  // [0.707, -0.707]

    // 5. Explained variance ratio
    const totalVar = lam1 + lam2;
    const evr1 = lam1 / totalVar;  // ~0.9985
    const evr2 = lam2 / totalVar;  // ~0.0015

    // 6. Projection onto PC1 (and PC2)
    const scores_pc1 = X_std.map(row => dot(row, pc1));
    const scores_pc2 = X_std.map(row => dot(row, pc2));

    // 7. Reconstruction from PC1 only (back-project into standardized space)
    const X_std_reconstructed = scores_pc1.map(s => [
      s * pc1[0],
      s * pc1[1],
    ]);

    // Unstandardize reconstructed points
    const X_reconstructed = X_std_reconstructed.map(([ms, ps]) => [
      ms * mathStd + mathMean,
      ps * physStd + physMean,
    ]);

    // 8. Reconstruction error per student
    const errors = X.map(([mo, po], i) => [
      mo - X_reconstructed[i][0],
      po - X_reconstructed[i][1],
    ]);

    const rmsePerStudent = errors.map(([em, ep]) =>
      Math.sqrt((em * em + ep * ep) / 2)
    );

    return {
      // metadata
      n,
      students: DATA.students,
      featureNames: ["Math", "Physics"],

      // step 1: raw data
      X,

      // step 2: standardization params + result
      means: [mathMean, physMean],
      stds:  [mathStd,  physStd],
      X_std,

      // step 3: covariance matrix
      covMatrix: C,
      cov_raw: XtX,

      // step 4: eigendecomposition
      eigenvalues:  [lam1, lam2],
      eigenvectors: [pc1, pc2],   // rows = PCs

      // step 5: explained variance
      totalVar,
      evr: [evr1, evr2],

      // step 6: projections
      scores_pc1,
      scores_pc2,
      scores: X_std.map((_, i) => [scores_pc1[i], scores_pc2[i]]),

      // step 7: reconstruction
      X_std_reconstructed,
      X_reconstructed,

      // step 8: errors
      errors,
      rmsePerStudent,
    };
  }

  window.ML_PCA = { DATA, runPCA };
})();
