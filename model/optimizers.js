/* ============================================================
   Optimizer playground — simulate gradient-descent variants on
   a fixed 2-D "ravine" loss so their paths can be drawn/animated.
   loss(x,y) = 0.5(A x² + B y²) — steep in y, shallow in x.
   Exposes window.OPT.
   ============================================================ */
(function () {
  const A = 0.6, B = 7;
  const loss = (x, y) => 0.5 * (A * x * x + B * y * y);
  const grad = (x, y) => [A * x, B * y];
  const START = [-4.2, 2.4];
  const STEPS = 40;

  // sensible learning rate per optimizer (so each behaves characteristically)
  const LR = { sgd: 0.06, momentum: 0.045, nesterov: 0.045, adagrad: 0.9, rmsprop: 0.18, adam: 0.35, adamw: 0.35 };

  function simulate(type, lr) {
    lr = lr || LR[type] || 0.05;
    let x = START[0], y = START[1];
    const path = [[x, y]];
    // state
    let vx = 0, vy = 0, Gx = 0, Gy = 0, mx = 0, my = 0, vx2 = 0, vy2 = 0;
    const mu = 0.9, rho = 0.9, b1 = 0.9, b2 = 0.999, eps = 1e-8, wd = 0.04;
    for (let t = 1; t <= STEPS; t++) {
      let gx, gy;
      if (type === "nesterov") { const lx = x - lr * mu * vx, ly = y - lr * mu * vy; [gx, gy] = grad(lx, ly); }
      else [gx, gy] = grad(x, y);

      if (type === "sgd") { x -= lr * gx; y -= lr * gy; }
      else if (type === "momentum") { vx = mu * vx + gx; vy = mu * vy + gy; x -= lr * vx; y -= lr * vy; }
      else if (type === "nesterov") { vx = mu * vx + gx; vy = mu * vy + gy; x -= lr * vx; y -= lr * vy; }
      else if (type === "adagrad") { Gx += gx * gx; Gy += gy * gy; x -= lr * gx / (Math.sqrt(Gx) + eps); y -= lr * gy / (Math.sqrt(Gy) + eps); }
      else if (type === "rmsprop") { Gx = rho * Gx + (1 - rho) * gx * gx; Gy = rho * Gy + (1 - rho) * gy * gy; x -= lr * gx / (Math.sqrt(Gx) + eps); y -= lr * gy / (Math.sqrt(Gy) + eps); }
      else if (type === "adam" || type === "adamw") {
        mx = b1 * mx + (1 - b1) * gx; my = b1 * my + (1 - b1) * gy;
        vx2 = b2 * vx2 + (1 - b2) * gx * gx; vy2 = b2 * vy2 + (1 - b2) * gy * gy;
        const mhx = mx / (1 - Math.pow(b1, t)), mhy = my / (1 - Math.pow(b1, t));
        const vhx = vx2 / (1 - Math.pow(b2, t)), vhy = vy2 / (1 - Math.pow(b2, t));
        x -= lr * mhx / (Math.sqrt(vhx) + eps); y -= lr * mhy / (Math.sqrt(vhy) + eps);
        if (type === "adamw") { x -= lr * wd * x; y -= lr * wd * y; }
      }
      path.push([x, y]);
    }
    return { type, lr, path, finalLoss: loss(x, y) };
  }

  function runAll(input) {
    const mult = (input && input[0]) || 1;
    const types = ["sgd", "momentum", "nesterov", "adagrad", "rmsprop", "adam", "adamw"];
    const sims = {};
    types.forEach((tp) => { sims[tp] = simulate(tp, LR[tp] * mult); });
    return { sims, lrMult: mult, A, B, start: START, steps: STEPS };
  }

  window.OPT = { loss, grad, simulate, runAll, LR, A, B, START, STEPS };
})();
