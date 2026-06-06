/* ============================================================
   Neural-network toy engines: ANN (MLP), CNN, RNN, LSTM.
   Tiny, hand-authored, UNTRAINED weights so every number is
   readable and recomputes live. Each run() returns a full trace.
   ============================================================ */
(function () {
  /* ---------- helpers ---------- */
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const T = (M) => M[0].map((_, j) => M.map((r) => r[j]));
  const matmul = (A, B) => { const Bt = T(B); return A.map((r) => Bt.map((c) => dot(r, c))); };
  const addv = (a, b) => a.map((x, i) => x + b[i]);
  const relu = (x) => Math.max(0, x);
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));
  const tanh = (x) => Math.tanh(x);
  function softmax(arr) {
    const m = Math.max(...arr);
    const ex = arr.map((x) => Math.exp(x - m));
    const s = ex.reduce((a, b) => a + b, 0);
    return ex.map((x) => x / s);
  }

  /* ============================================================
     ANN / MLP   input(3) -> hidden(4, ReLU) -> output(2, softmax)
     ============================================================ */
  const ANN = {
    labels: ["cat", "dog"],
    featNames: ["ears", "size", "tail"],
    W1: [[ 0.8, -0.5,  0.3,  0.6],
         [-0.4,  0.7,  0.9, -0.2],
         [ 0.5,  0.2, -0.6,  0.4]],
    b1: [0.1, -0.2, 0.0, 0.3],
    W2: [[ 0.7, -0.6],
         [-0.3,  0.8],
         [ 0.9, -0.4],
         [-0.5,  0.6]],
    b2: [0.05, -0.05],
    default: [0.9, 0.2, 0.8],
  };
  function runANN(x) {
    const z1 = addv(matmul([x], ANN.W1)[0], ANN.b1);
    const a1 = z1.map(relu);
    const z2 = addv(matmul([a1], ANN.W2)[0], ANN.b2);
    const p = softmax(z2);
    return { x, z1, a1, z2, p, pred: p.indexOf(Math.max(...p)), cfg: ANN };
  }

  /* ============================================================
     CNN   image(6x6) -> conv(3x3 valid) -> ReLU -> maxpool(2x2)
           -> flatten(4) -> dense(2) -> softmax
     ============================================================ */
  const CNN = {
    labels: ["vertical", "horizontal"],
    kernel: [[ 1, 0, -1],
             [ 1, 0, -1],
             [ 1, 0, -1]],   // vertical-edge detector
    kbias: 0,
    // dense from flattened 2x2 pooled map (4) -> 2 classes
    Wd: [[ 0.6, -0.5],
         [ 0.5, -0.4],
         [-0.3,  0.7],
         [-0.4,  0.6]],
    bd: [0.0, 0.0],
    // a 6x6 image with a strong vertical edge (left bright, right dark)
    default: [
      [0.9, 0.9, 0.8, 0.1, 0.1, 0.0],
      [0.9, 0.9, 0.8, 0.1, 0.1, 0.0],
      [0.9, 0.8, 0.8, 0.2, 0.1, 0.1],
      [0.8, 0.9, 0.8, 0.1, 0.2, 0.0],
      [0.9, 0.9, 0.7, 0.1, 0.1, 0.1],
      [0.9, 0.8, 0.8, 0.2, 0.1, 0.0],
    ],
  };
  function conv2d(img, K, bias) {
    const n = img.length, k = K.length, out = n - k + 1;
    const fm = [];
    for (let i = 0; i < out; i++) {
      const row = [];
      for (let j = 0; j < out; j++) {
        let s = bias;
        for (let a = 0; a < k; a++)
          for (let b = 0; b < k; b++) s += img[i + a][j + b] * K[a][b];
        row.push(s);
      }
      fm.push(row);
    }
    return fm;
  }
  function maxpool2(M) {
    const out = M.length / 2, P = [], idx = [];
    for (let i = 0; i < out; i++) {
      const row = [], irow = [];
      for (let j = 0; j < out; j++) {
        const vals = [M[2*i][2*j], M[2*i][2*j+1], M[2*i+1][2*j], M[2*i+1][2*j+1]];
        const mx = Math.max(...vals);
        row.push(mx); irow.push(vals.indexOf(mx));
      }
      P.push(row); idx.push(irow);
    }
    return { P, idx };
  }
  function runCNN(img) {
    const conv = conv2d(img, CNN.kernel, CNN.kbias);
    const act = conv.map((r) => r.map(relu));
    const { P, idx } = maxpool2(act);
    const flat = [P[0][0], P[0][1], P[1][0], P[1][1]];
    const z = addv(matmul([flat], CNN.Wd)[0], CNN.bd);
    const p = softmax(z);
    return { img, conv, act, pool: P, poolIdx: idx, flat, z, p,
      pred: p.indexOf(Math.max(...p)), cfg: CNN };
  }

  /* ============================================================
     RNN   seq of 4 steps, each input(2), hidden(3, tanh)
           h_t = tanh(x_t·Wxh + h_{t-1}·Whh + bh);  out from h_4
     ============================================================ */
  const RNN = {
    labels: ["up", "down"],
    stepNames: ["t1", "t2", "t3", "t4"],
    Wxh: [[ 0.6, -0.4,  0.3],
          [ 0.2,  0.5, -0.6]],
    Whh: [[ 0.3,  0.1, -0.2],
          [-0.1,  0.4,  0.2],
          [ 0.2, -0.3,  0.5]],
    bh: [0.0, 0.1, -0.1],
    Why: [[ 0.7, -0.5],
          [-0.4,  0.6],
          [ 0.5, -0.3]],
    by: [0.0, 0.0],
    default: [[0.5, 0.2], [0.8, -0.3], [-0.4, 0.6], [0.7, 0.1]],
  };
  function runRNN(seq) {
    const steps = [];
    let h = [0, 0, 0];
    for (let t = 0; t < seq.length; t++) {
      const xWxh = matmul([seq[t]], RNN.Wxh)[0];
      const hWhh = matmul([h], RNN.Whh)[0];
      const pre = xWxh.map((v, i) => v + hWhh[i] + RNN.bh[i]);
      const hNew = pre.map(tanh);
      steps.push({ t, x: seq[t], hPrev: h, xWxh, hWhh, pre, h: hNew });
      h = hNew;
    }
    const z = addv(matmul([h], RNN.Why)[0], RNN.by);
    const p = softmax(z);
    return { seq, steps, hFinal: h, z, p, pred: p.indexOf(Math.max(...p)), cfg: RNN };
  }

  /* ============================================================
     LSTM   seq of 4 steps, input(2), hidden(3)
            gates f,i,o (sigmoid), g (tanh); c_t = f*c + i*g;
            h_t = o*tanh(c_t)
     ============================================================ */
  const LSTM = {
    labels: ["up", "down"],
    stepNames: ["t1", "t2", "t3", "t4"],
    // each gate: Wx(2x3), Wh(3x3), b(3)
    f: { Wx: [[0.5,-0.3,0.2],[0.1,0.4,-0.2]], Wh: [[0.2,0.1,-0.1],[-0.1,0.3,0.1],[0.1,-0.2,0.4]], b: [1.0,1.0,1.0] },
    i: { Wx: [[0.3,0.5,-0.2],[0.2,-0.3,0.4]], Wh: [[0.1,0.2,0.1],[0.2,0.1,-0.2],[-0.1,0.3,0.2]], b: [0.0,0.0,0.0] },
    o: { Wx: [[0.4,-0.2,0.3],[0.1,0.5,-0.1]], Wh: [[0.2,0.1,0.2],[0.1,0.2,0.1],[0.1,0.1,0.3]], b: [0.0,0.0,0.0] },
    g: { Wx: [[0.6,-0.4,0.2],[0.3,0.4,-0.5]], Wh: [[0.2,0.1,-0.2],[-0.1,0.3,0.2],[0.2,-0.1,0.4]], b: [0.0,0.0,0.0] },
    Why: [[0.7,-0.5],[-0.4,0.6],[0.5,-0.3]],
    by: [0.0, 0.0],
    default: [[0.5, 0.2], [0.8, -0.3], [-0.4, 0.6], [0.7, 0.1]],
  };
  function gate(x, h, G, act) {
    const xw = matmul([x], G.Wx)[0], hw = matmul([h], G.Wh)[0];
    const pre = xw.map((v, k) => v + hw[k] + G.b[k]);
    return { xw, hw, pre, out: pre.map(act) };
  }
  function runLSTM(seq) {
    const steps = [];
    let h = [0, 0, 0], c = [0, 0, 0];
    for (let t = 0; t < seq.length; t++) {
      const f = gate(seq[t], h, LSTM.f, sigmoid);
      const inp = gate(seq[t], h, LSTM.i, sigmoid);
      const g = gate(seq[t], h, LSTM.g, tanh);
      const o = gate(seq[t], h, LSTM.o, sigmoid);
      const cNew = f.out.map((fv, k) => fv * c[k] + inp.out[k] * g.out[k]);
      const hNew = o.out.map((ov, k) => ov * tanh(cNew[k]));
      steps.push({ t, x: seq[t], hPrev: h, cPrev: c, f, i: inp, g, o, c: cNew, h: hNew });
      h = hNew; c = cNew;
    }
    const z = addv(matmul([h], LSTM.Why)[0], LSTM.by);
    const p = softmax(z);
    return { seq, steps, hFinal: h, z, p, pred: p.indexOf(Math.max(...p)), cfg: LSTM };
  }

  window.NN = {
    runANN, runCNN, runRNN, runLSTM,
    ANN, CNN, RNN, LSTM,
    relu, sigmoid, tanh, softmax, matmul, dot, conv2d,
  };

  /* ============================================================
     REGRESSION  — linear (y = w·x + b) + logistic (sigmoid)
     ============================================================ */
  const REG = {
    xs: [1, 2, 3, 4, 5, 6],
    ys: [2.4, 3.8, 6.3, 7.6, 10.1, 11.7],     // roughly y ≈ 2x
    default: [1.0, 0.5],                        // [w, b] starting guess
    // logistic toy: hours studied -> pass(1)/fail(0)
    lxs: [1, 2, 3, 4, 5, 6],
    lys: [0, 0, 0, 1, 1, 1],
    lw: 1.4, lb: -4.2,                          // a reasonable fitted logistic
  };
  function runReg(params) {
    const w = params[0], b = params[1];
    const preds = REG.xs.map((x) => w * x + b);
    const resid = preds.map((p, i) => p - REG.ys[i]);
    const mse = resid.reduce((s, r) => s + r * r, 0) / resid.length;
    // gradients of MSE
    const n = REG.xs.length;
    const dw = (2 / n) * REG.xs.reduce((s, x, i) => s + resid[i] * x, 0);
    const db = (2 / n) * resid.reduce((s, r) => s + r, 0);
    return { cfg: REG, w, b, preds, resid, mse, dw, db };
  }
  function regStep(params, lr) {
    const t = runReg(params);
    return [params[0] - (lr || 0.02) * t.dw, params[1] - (lr || 0.02) * t.db];
  }
  window.NN.REG = REG;
  window.NN.runReg = runReg;
  window.NN.regStep = regStep;
})();
