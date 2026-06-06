/* ============================================================
   Random Forest — Regression stages (9 stages)
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const RF = window.ML_RF.RF_REG;

  const TREE_COLORS = ["#2196f3", "#4caf50", "#ff9800"];

  /* ── Regression scatter + step-function chart ── */
  function RegChart({ data, query, curve, treeCurves, w = 390, h = 250, showTrees = false, showAvg = true }) {
    const pad = { l: 52, r: 18, t: 18, b: 44 };
    const xMin = 0, xMax = 48, yMin = 0, yMax = 10;
    const sx = v => pad.l + ((v - xMin) / (xMax - xMin)) * (w - pad.l - pad.r);
    const sy = v => h - pad.b - ((v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);

    function stepPath(pts) {
      if (!pts || pts.length < 2) return "";
      let d = `M${sx(pts[0].age)},${sy(pts[0].pred)}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` H${sx(pts[i].age)} V${sy(pts[i].pred)}`;
      }
      return d;
    }

    return (
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#ccc" strokeWidth={1} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#ccc" strokeWidth={1} />
        {[0, 10, 20, 30, 40].map(v => (
          <g key={v}>
            <line x1={sx(v)} y1={h - pad.b} x2={sx(v)} y2={h - pad.b + 4} stroke="#ccc" strokeWidth={1} />
            <text x={sx(v)} y={h - pad.b + 15} textAnchor="middle" fontSize={10} fill="#888">{v}</text>
          </g>
        ))}
        {[0, 2, 4, 6, 8, 10].map(v => (
          <g key={v}>
            <line x1={pad.l - 4} y1={sy(v)} x2={pad.l} y2={sy(v)} stroke="#ccc" strokeWidth={1} />
            <text x={pad.l - 7} y={sy(v) + 4} textAnchor="end" fontSize={10} fill="#888">{v}</text>
          </g>
        ))}
        <text x={(pad.l + w - pad.r) / 2} y={h - 4} textAnchor="middle" fontSize={11} fill="#666">Age (years)</text>
        <text x={13} y={(pad.t + h - pad.b) / 2} textAnchor="middle" fontSize={11} fill="#666"
          transform={`rotate(-90,13,${(pad.t + h - pad.b) / 2})`}>Price ($100k)</text>
        {/* individual tree step curves */}
        {showTrees && treeCurves && treeCurves.map((tc, ti) => (
          <path key={ti} d={stepPath(tc)} fill="none" stroke={TREE_COLORS[ti]}
            strokeWidth={1.8} opacity={0.55} strokeDasharray="5 3" />
        ))}
        {/* RF average curve */}
        {showAvg && curve && (
          <path d={stepPath(curve)} fill="none" stroke="#e91e63" strokeWidth={3} />
        )}
        {/* data points */}
        {data.map((pt, i) => (
          <circle key={i} cx={sx(pt[0])} cy={sy(pt[1])} r={5.5} fill="#333" opacity={0.75} />
        ))}
        {/* query vertical line */}
        {query !== undefined && (
          <>
            <line x1={sx(query)} y1={pad.t} x2={sx(query)} y2={h - pad.b}
              stroke="#e91e63" strokeWidth={1.8} strokeDasharray="5 3" />
            {curve && (() => {
              const cp = curve.find(p => p.age === Math.round(query));
              return cp ? <circle cx={sx(query)} cy={sy(cp.pred)} r={7} fill="#e91e63" opacity={0.9} /> : null;
            })()}
          </>
        )}
      </svg>
    );
  }

  /* ── single tree step chart ── */
  function TreeStepChart({ treeIdx, treeCurve, data, query, w = 290, h = 185 }) {
    const pad = { l: 46, r: 14, t: 16, b: 38 };
    const xMin = 0, xMax = 48, yMin = 0, yMax = 10;
    const sx = v => pad.l + ((v - xMin) / (xMax - xMin)) * (w - pad.l - pad.r);
    const sy = v => h - pad.b - ((v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);

    function stepPath(pts) {
      if (!pts || pts.length < 2) return "";
      let d = `M${sx(pts[0].age)},${sy(pts[0].pred)}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` H${sx(pts[i].age)} V${sy(pts[i].pred)}`;
      }
      return d;
    }

    const color = TREE_COLORS[treeIdx];
    return (
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#ccc" strokeWidth={1} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#ccc" strokeWidth={1} />
        {[0, 10, 20, 30, 40].map(v => (
          <g key={v}>
            <line x1={sx(v)} y1={h - pad.b} x2={sx(v)} y2={h - pad.b + 4} stroke="#ccc" strokeWidth={1} />
            <text x={sx(v)} y={h - pad.b + 13} textAnchor="middle" fontSize={9} fill="#888">{v}</text>
          </g>
        ))}
        {[0, 5, 10].map(v => (
          <g key={v}>
            <line x1={pad.l - 4} y1={sy(v)} x2={pad.l} y2={sy(v)} stroke="#ccc" strokeWidth={1} />
            <text x={pad.l - 6} y={sy(v) + 4} textAnchor="end" fontSize={9} fill="#888">{v}</text>
          </g>
        ))}
        <path d={stepPath(treeCurve)} fill="none" stroke={color} strokeWidth={2.2} />
        {data.map((pt, i) => (
          <circle key={i} cx={sx(pt[0])} cy={sy(pt[1])} r={4} fill="#333" opacity={0.7} />
        ))}
        {query !== undefined && (
          <line x1={sx(query)} y1={pad.t} x2={sx(query)} y2={h - pad.b}
            stroke="#e91e63" strokeWidth={1.5} strokeDasharray="3 2" />
        )}
        <text x={(pad.l + w - pad.r) / 2} y={h - 2} textAnchor="middle" fontSize={10} fill={color} fontWeight="700">
          Tree {treeIdx + 1}
        </text>
      </svg>
    );
  }

  /* ── bootstrap table for regression ── */
  function BootstrapTableReg({ bsIdx, treeId, data }) {
    const counts = {};
    bsIdx.forEach(i => { counts[i] = (counts[i] || 0) + 1; });
    const allIdx = Array.from({ length: data.length }, (_, i) => i);
    const oob = allIdx.filter(i => !counts[i]);
    const unique = bsIdx.filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

    return (
      <div style={{ fontSize: 12, border: "1px solid #e0e0e0", borderRadius: 9, overflow: "hidden", minWidth: 180 }}>
        <div style={{ background: "#e3f2fd", padding: "7px 10px", fontWeight: 700, fontSize: 12, borderBottom: "1px solid #d0d0d0", color: "#0d47a1" }}>
          Tree {treeId} bootstrap
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "28px 56px 60px 28px", gap: 0 }}>
          {["#", "age", "price", "×"].map(h => (
            <div key={h} style={{ padding: "4px 7px", background: "#f5f5f5", fontWeight: 700, fontSize: 10.5, borderBottom: "1px solid #eee", color: "#555" }}>{h}</div>
          ))}
          {unique.map(origIdx => (
            <React.Fragment key={origIdx}>
              <div style={{ padding: "3px 7px", borderBottom: "1px solid #f5f5f5", color: "#888" }}>{origIdx}</div>
              <div style={{ padding: "3px 7px", borderBottom: "1px solid #f5f5f5", color: "#555" }}>{data[origIdx][0]} yr</div>
              <div style={{ padding: "3px 7px", borderBottom: "1px solid #f5f5f5", color: "#1565c0", fontWeight: 600 }}>${data[origIdx][1]}00k</div>
              <div style={{ padding: "3px 7px", borderBottom: "1px solid #f5f5f5", color: "#e91e63", fontWeight: 700 }}>×{counts[origIdx]}</div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ padding: "5px 10px", background: "#fff8e1", fontSize: 11, color: "#795548" }}>
          <b>OOB:</b> idx {oob.length > 0 ? oob.join(", ") : "none"} ({oob.length}/{data.length})
        </div>
      </div>
    );
  }

  /* ── regression forest overview SVG ── */
  function RegForestOverviewSvg() {
    const W = 440, H = 195;
    const treeXs = [72, 220, 368];
    const treeW = 78, treeH = 85;

    return (
      <svg width={W} height={H} style={{ overflow: "visible", display: "block", margin: "0 auto" }}>
        <rect x={W / 2 - 60} y={4} width={120} height={26} rx={7} fill="#e3f2fd" stroke="#90caf9" strokeWidth={1.5} />
        <text x={W / 2} y={21} textAnchor="middle" fontSize={11} fill="#0d47a1" fontWeight="700">8 houses (age → price)</text>
        {treeXs.map((tx, i) => (
          <g key={i}>
            <line x1={W / 2} y1={30} x2={tx} y2={46} stroke="#90caf9" strokeWidth={1.4} strokeDasharray="3 2" />
            <text x={tx} y={45} textAnchor="middle" fontSize={8} fill="#90caf9">bootstrap {i + 1}</text>
          </g>
        ))}
        {treeXs.map((tx, i) => (
          <g key={i}>
            <rect x={tx - treeW / 2} y={50} width={treeW} height={treeH} rx={9}
              fill="#fafafa" stroke={TREE_COLORS[i]} strokeWidth={1.8} />
            <text x={tx} y={68} textAnchor="middle" fontSize={10} fill={TREE_COLORS[i]} fontWeight="700">Tree {i + 1}</text>
            {/* mini step curve */}
            <polyline
              points={`${tx - 28},${108} ${tx - 10},${108} ${tx - 10},${92} ${tx + 10},${92} ${tx + 10},${114} ${tx + 28},${114}`}
              fill="none" stroke={TREE_COLORS[i]} strokeWidth={2.2}
            />
            {/* leaf prediction label */}
            <rect x={tx - 28} y={140} width={56} height={16} rx={4} fill={TREE_COLORS[i] + "28"} stroke={TREE_COLORS[i]} strokeWidth={1} />
            <text x={tx} y={151} textAnchor="middle" fontSize={9} fill={TREE_COLORS[i]} fontWeight="700">
              pred = {[4.75, 6.25, 4.275][i]}
            </text>
          </g>
        ))}
        {treeXs.map((tx, i) => (
          <line key={i} x1={tx} y1={158} x2={W / 2} y2={H - 18} stroke="#ccc" strokeWidth={1.4} />
        ))}
        <rect x={W / 2 - 66} y={H - 18} width={132} height={22} rx={7} fill="#fce4ec" stroke="#f48fb1" strokeWidth={1.5} />
        <text x={W / 2} y={H - 3} textAnchor="middle" fontSize={11} fill="#b71c1c" fontWeight="700">Average predictions → final value</text>
      </svg>
    );
  }

  /* ── OOB regression grid ── */
  function OOBRegGrid({ oob }) {
    return (
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
        {RF.bootstraps.map((bs, ti) => {
          const bsSet = new Set(bs);
          const oobIdx = Array.from({ length: 8 }, (_, i) => i).filter(i => !bsSet.has(i));
          const preds = oobIdx.map(i => {
            const res = window.ML_RF.predictRegTree(RF.trees[ti], RF.data[i][0]);
            return { idx: i, true: RF.data[i][1], pred: res.predict };
          });
          const mse = preds.length > 0
            ? preds.reduce((sum, p) => sum + (p.pred - p.true) ** 2, 0) / preds.length
            : 0;
          return (
            <div key={ti} style={{ border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 14px", minWidth: 175, background: "#fafafa" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: TREE_COLORS[ti] }}>Tree {ti + 1}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                OOB idx: {oobIdx.length > 0 ? oobIdx.join(", ") : "none"}
              </div>
              {preds.map(p => (
                <div key={p.idx} style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                  #{p.idx}: true={p.true}, pred={fmt(p.pred, 2)} | err²={(fmt((p.pred - p.true) ** 2, 3))}
                </div>
              ))}
              <div style={{
                marginTop: 7, padding: "4px 9px", borderRadius: 7, display: "inline-block",
                background: mse < 1 ? "#e8f5e9" : "#fff3e0",
                color: mse < 1 ? "#2e7d32" : "#e65100",
                fontWeight: 700, fontSize: 12,
              }}>
                OOB MSE: {fmt(mse, 3)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ── variance reduction bar chart ── */
  function VarianceBarChart() {
    const ns = [1, 2, 3, 5, 10, 20, 50, 100, 200];
    const rho = 0.38;
    return (
      <div style={{ margin: "10px 0" }}>
        {ns.map(n => {
          const varRF = rho + (1 - rho) / n;
          const pct = varRF * 100;
          const color = n <= 3 ? "#ef5350" : n <= 10 ? "#ff9800" : "#4caf50";
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ width: 68, fontSize: 11.5, textAlign: "right", color: "#555" }}>{n} tree{n > 1 ? "s" : ""}</span>
              <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 19, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.max(pct, 3)}%`, height: "100%", background: color,
                  borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 7,
                  transition: "width 0.3s",
                }}>
                  <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{fmt(varRF, 2)}σ²</span>
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
          ρ = 0.38 (typical tree correlation with random feature subsets). Formula: ρσ² + (1−ρ)σ²/n
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     FOREST REGRESSION ANIMATION
     ════════════════════════════════════════ */

  const REG_PHASE_LABELS = [
    "Phase 0 — Training data scatter",
    "Phase 1 — Tree 1 step function builds",
    "Phase 2 — Tree 2 step function builds",
    "Phase 3 — Tree 3 step function builds",
    "Phase 4 — Query point appears at age = 12",
    "Phase 5 — Each tree predicts at query age",
    "Phase 6 — Predictions average to final answer",
    "Phase 7 — All curves + averaged ensemble",
  ];

  // Simplified step-function data for each tree (age breakpoints and predictions)
  // Based on RF.data: [[2,8.2],[5,7.5],[8,6.8],[12,5.7],[20,3.8],[28,2.9],[35,2.2],[42,1.8]]
  // Tree 1: splits age≤10 → 7.5, age≤25 → 4.75, age>25 → 2.3
  // Tree 2: splits age≤8  → 7.85, age≤22 → 4.75, age>22 → 2.3
  // Tree 3: splits age≤11 → 7.1, age≤28 → 4.1,  age>28 → 2.05
  const REG_TREE_CURVES = [
    [ { age: 0, pred: 7.5 }, { age: 10, pred: 7.5 }, { age: 10, pred: 4.75 }, { age: 25, pred: 4.75 }, { age: 25, pred: 2.3 }, { age: 48, pred: 2.3 } ],
    [ { age: 0, pred: 7.85 }, { age: 8, pred: 7.85 }, { age: 8, pred: 4.75 }, { age: 22, pred: 4.75 }, { age: 22, pred: 2.3 }, { age: 48, pred: 2.3 } ],
    [ { age: 0, pred: 7.1 }, { age: 11, pred: 7.1 }, { age: 11, pred: 4.1 }, { age: 28, pred: 4.1 }, { age: 28, pred: 2.05 }, { age: 48, pred: 2.05 } ],
  ];
  const QUERY_AGE = 12;
  const TREE_PREDS_AT_QUERY = [4.75, 4.75, 4.1]; // each tree's pred at age 12
  const AVG_PRED = ((4.75 + 4.75 + 4.1) / 3); // ≈ 4.53

  function ForestRegAnim() {
    const [phase, setPhase] = React.useState(0);
    const [playing, setPlaying] = React.useState(false);
    const [speed, setSpeed] = React.useState(1000);

    React.useEffect(() => {
      if (!playing || phase >= 7) { setPlaying(false); return; }
      const t = setTimeout(() => setPhase(p => p + 1), speed);
      return () => clearTimeout(t);
    }, [playing, phase, speed]);

    function reset() { setPhase(0); setPlaying(false); }
    function togglePlay() {
      if (phase >= 7) { setPhase(0); setPlaying(true); }
      else setPlaying(p => !p);
    }

    // Chart dimensions
    const W = 800, H = 440;
    const pad = { l: 54, r: 20, t: 30, b: 50 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b - 54; // leave room for phase text
    const xMin = 0, xMax = 48, yMin = 0, yMax = 10;
    const sx = v => pad.l + ((v - xMin) / (xMax - xMin)) * chartW;
    const sy = v => pad.t + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

    function stepPath(pts) {
      if (!pts || pts.length < 2) return "";
      let d = `M${sx(pts[0].age)},${sy(pts[0].pred)}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` H${sx(pts[i].age)} V${sy(pts[i].pred)}`;
      }
      return d;
    }

    // Averaged curve (pointwise average of 3 step functions, sampled every age integer)
    const avgCurve = (() => {
      const ages = [];
      for (let a = 0; a <= 48; a++) ages.push(a);
      const result = [];
      for (const age of ages) {
        const preds = REG_TREE_CURVES.map(curve => {
          // find the segment containing this age
          for (let i = curve.length - 1; i >= 0; i--) {
            if (curve[i].age <= age) return curve[i].pred;
          }
          return curve[0].pred;
        });
        result.push({ age, pred: preds.reduce((a, b) => a + b, 0) / preds.length });
      }
      // deduplicate consecutive same pred
      const deduped = [result[0]];
      for (let i = 1; i < result.length; i++) {
        if (Math.abs(result[i].pred - result[i - 1].pred) > 0.001) deduped.push(result[i]);
      }
      return deduped;
    })();

    // Prediction labels (phase 5+)
    const predLabels = [
      { tree: 1, color: TREE_COLORS[0], val: TREE_PREDS_AT_QUERY[0], label: `Tree 1: $${TREE_PREDS_AT_QUERY[0].toFixed(2)} × 100k` },
      { tree: 2, color: TREE_COLORS[1], val: TREE_PREDS_AT_QUERY[1], label: `Tree 2: $${TREE_PREDS_AT_QUERY[1].toFixed(2)} × 100k` },
      { tree: 3, color: TREE_COLORS[2], val: TREE_PREDS_AT_QUERY[2], label: `Tree 3: $${TREE_PREDS_AT_QUERY[2].toFixed(2)} × 100k` },
    ];

    return (
      <div style={{ fontFamily: "inherit" }}>
        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <button onClick={togglePlay} style={{
            padding: "6px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            background: playing ? "#ff9800" : "#4caf50", color: "#fff", fontWeight: 700, fontSize: 14,
          }}>
            {playing ? "⏸ Pause" : (phase >= 7 ? "⟳ Reset & Play" : "▶ Play")}
          </button>
          <button onClick={reset} style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer",
            background: "#fafafa", fontWeight: 600, fontSize: 13,
          }}>⟳ Reset</button>
          <span style={{ fontSize: 12, color: "#555", background: "#f5f5f5", padding: "5px 12px", borderRadius: 8, fontWeight: 600 }}>
            Phase {phase} of 7 — {REG_PHASE_LABELS[phase]}
          </span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#777" }}>Speed:</span>
            {[["Slow", 1800], ["Normal", 1000], ["Fast", 500]].map(([label, ms]) => (
              <button key={label} onClick={() => setSpeed(ms)} style={{
                padding: "4px 10px", borderRadius: 6, border: "1.5px solid",
                borderColor: speed === ms ? "#1565c0" : "#ddd",
                background: speed === ms ? "#e3f2fd" : "#fafafa",
                color: speed === ms ? "#1565c0" : "#888",
                cursor: "pointer", fontWeight: speed === ms ? 700 : 400, fontSize: 12,
              }}>{label}</button>
            ))}
          </span>
        </div>

        {/* Main SVG */}
        <svg width={W} height={H} style={{ display: "block", border: "1px solid #e8e8e8", borderRadius: 12, background: "#fefefe" }}>

          {/* Axes */}
          <line x1={pad.l} y1={pad.t + chartH} x2={pad.l + chartW} y2={pad.t + chartH} stroke="#ccc" strokeWidth={1} />
          <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + chartH} stroke="#ccc" strokeWidth={1} />
          {/* X ticks */}
          {[0, 10, 20, 30, 40].map(v => (
            <g key={v}>
              <line x1={sx(v)} y1={pad.t + chartH} x2={sx(v)} y2={pad.t + chartH + 4} stroke="#ccc" strokeWidth={1} />
              <text x={sx(v)} y={pad.t + chartH + 15} textAnchor="middle" fontSize={10} fill="#888">{v}</text>
            </g>
          ))}
          {/* Y ticks */}
          {[0, 2, 4, 6, 8, 10].map(v => (
            <g key={v}>
              <line x1={pad.l - 4} y1={sy(v)} x2={pad.l} y2={sy(v)} stroke="#ccc" strokeWidth={1} />
              <text x={pad.l - 7} y={sy(v) + 4} textAnchor="end" fontSize={10} fill="#888">{v}</text>
            </g>
          ))}
          <text x={(pad.l + pad.l + chartW) / 2} y={pad.t + chartH + 32} textAnchor="middle" fontSize={11} fill="#666">Age (years)</text>
          <text x={13} y={pad.t + chartH / 2} textAnchor="middle" fontSize={11} fill="#666"
            transform={`rotate(-90,13,${pad.t + chartH / 2})`}>Price ($100k)</text>

          {/* Training data points (always shown from phase 0) */}
          {RF.data.map((pt, i) => (
            <circle key={i} cx={sx(pt[0])} cy={sy(pt[1])} r={5.5} fill="#333" opacity={0.72} />
          ))}

          {/* Tree step curves — appear one by one */}
          {REG_TREE_CURVES.map((curve, ti) => {
            const showPhase = ti + 1; // phase 1,2,3
            const visible = phase >= showPhase;
            const isLastPhase = phase >= 7;
            return (
              <path
                key={`tree-curve-${ti}`}
                d={stepPath(curve)}
                fill="none"
                stroke={TREE_COLORS[ti]}
                strokeWidth={isLastPhase ? 2 : 2.2}
                strokeDasharray="6 3"
                opacity={visible ? (isLastPhase ? 0.5 : 0.85) : 0}
                style={{ transition: "opacity 0.5s" }}
              />
            );
          })}

          {/* Averaged curve (phase 7) */}
          {phase >= 7 && (
            <path
              d={stepPath(avgCurve)}
              fill="none"
              stroke="#e91e63"
              strokeWidth={3.5}
              opacity={1}
              style={{ transition: "opacity 0.6s" }}
            />
          )}

          {/* Query vertical line (phase >= 4) */}
          {phase >= 4 && (
            <g style={{ opacity: 1, transition: "opacity 0.5s" }}>
              <line x1={sx(QUERY_AGE)} y1={pad.t} x2={sx(QUERY_AGE)} y2={pad.t + chartH}
                stroke="#e91e63" strokeWidth={2} strokeDasharray="5 3" />
              <circle cx={sx(QUERY_AGE)} cy={pad.t + chartH - 4} r={5} fill="#e91e63" />
              <text x={sx(QUERY_AGE) + 8} y={pad.t + 18} fontSize={10} fill="#e91e63" fontWeight="700">age={QUERY_AGE}</text>
            </g>
          )}

          {/* Individual prediction drop lines from query to each tree curve (phase 5) */}
          {phase >= 5 && predLabels.map((pl, ti) => {
            const predY = sy(pl.val);
            const qx = sx(QUERY_AGE);
            return (
              <g key={`pred-drop-${ti}`} style={{ opacity: 1, transition: "opacity 0.5s" }}>
                <line x1={qx} y1={pad.t + chartH} x2={qx} y2={predY}
                  stroke={pl.color} strokeWidth={1.5} strokeDasharray="3 2" opacity={0.7} />
                <circle cx={qx} cy={predY} r={6} fill={pl.color} opacity={0.88} />
                {/* Prediction label box */}
                <rect x={qx + 10 + ti * 2} y={predY - 11 + ti * 22} width={120} height={18} rx={5}
                  fill={pl.color + "22"} stroke={pl.color} strokeWidth={1} />
                <text x={qx + 17 + ti * 2} y={predY + 1 + ti * 22} fontSize={9.5} fill={pl.color} fontWeight="700">
                  {pl.label}
                </text>
              </g>
            );
          })}

          {/* Average box (phase 6) */}
          {phase >= 6 && (
            <g style={{ opacity: 1, transition: "opacity 0.6s" }}>
              {/* Arrow pointing to avg Y */}
              <circle cx={sx(QUERY_AGE)} cy={sy(AVG_PRED)} r={9} fill="#e91e63" opacity={0.92} />
              <text x={sx(QUERY_AGE)} y={sy(AVG_PRED) + 4} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="900">avg</text>
              {/* Average result box */}
              <rect x={W - 190} y={pad.t + 10} width={168} height={phase >= 6 ? 74 : 0} rx={10}
                fill="#fce4ec" stroke="#e91e63" strokeWidth={2} />
              <text x={W - 106} y={pad.t + 30} textAnchor="middle" fontSize={10} fill="#b71c1c" fontWeight="700">AVERAGE PREDICTION</text>
              <text x={W - 106} y={pad.t + 46} textAnchor="middle" fontSize={9.5} fill="#555">
                ({TREE_PREDS_AT_QUERY.join(" + ")}) ÷ 3
              </text>
              <text x={W - 106} y={pad.t + 64} textAnchor="middle" fontSize={13} fill="#c62828" fontWeight="900">
                ${AVG_PRED.toFixed(2)} × 100k
              </text>
            </g>
          )}

          {/* Phase 7 caption */}
          {phase >= 7 && (
            <text x={(pad.l + pad.l + chartW) / 2} y={pad.t + chartH + 45} textAnchor="middle" fontSize={11} fill="#555" fontStyle="italic">
              Individual trees vary — their average is much more stable.
            </text>
          )}

          {/* Phase description bar */}
          <rect x={10} y={H - 46} width={W - 20} height={36} rx={8} fill="#f5f5f5" stroke="#e0e0e0" strokeWidth={1} />
          <text x={W / 2} y={H - 29} textAnchor="middle" fontSize={12} fill="#333" fontWeight="600">
            {REG_PHASE_LABELS[phase]}
          </text>
          <text x={W / 2} y={H - 14} textAnchor="middle" fontSize={10} fill="#888">
            {[
              "8 training houses plotted: age (years) vs price ($100k). Non-linear relationship visible.",
              "Tree 1 (blue dashed): bootstrap sample → step function. Splits at age ≤ 10 and ≤ 25.",
              "Tree 2 (green dashed): different bootstrap → different thresholds (≤ 8, ≤ 22).",
              "Tree 3 (orange dashed): 3rd bootstrap sample → yet another curve (≤ 11, ≤ 28).",
              `Query age = ${QUERY_AGE} years — vertical pink line drops from the top.`,
              `Each tree's curve intersects the query line: T1=$${TREE_PREDS_AT_QUERY[0]}×100k, T2=$${TREE_PREDS_AT_QUERY[1]}×100k, T3=$${TREE_PREDS_AT_QUERY[2]}×100k`,
              `Average = ($${TREE_PREDS_AT_QUERY[0]} + $${TREE_PREDS_AT_QUERY[1]} + $${TREE_PREDS_AT_QUERY[2]}) ÷ 3 = $${AVG_PRED.toFixed(2)} × 100k (pink dot on chart)`,
              "All 3 individual curves + thick pink averaged curve. Averaging smooths out individual step jumps.",
            ][phase]}
          </text>
        </svg>

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
          {TREE_COLORS.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width={22} height={6}><line x1={0} y1={3} x2={22} y2={3} stroke={c} strokeWidth={2.2} strokeDasharray="5 3" /></svg>
              <span style={{ fontSize: 12, color: c, fontWeight: 600 }}>Tree {i + 1}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width={22} height={6}><line x1={0} y1={3} x2={22} y2={3} stroke="#e91e63" strokeWidth={3.5} /></svg>
            <span style={{ fontSize: 12, color: "#e91e63", fontWeight: 700 }}>RF Avg (phase 7)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width={10} height={10}><circle cx={5} cy={5} r={4.5} fill="#333" /></svg>
            <span style={{ fontSize: 12, color: "#555" }}>Training house</span>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     STAGES
     ════════════════════════════════════════ */
  const STAGES = [

    /* ── 1. Overview ── */
    {
      id: "overview", group: "Overview", title: "Random Forest for regression — averaged predictions",
      map: "Overview",
      why: "For regression, each tree outputs a number rather than a class. The forest averages all trees' numbers — smoothing out each tree's step function and dramatically reducing variance.",
      render: (trace) => {
        const { age, avg, curve } = trace;
        return (
          <>
            <Lead>
              Imagine you're trying to estimate the price of a used car. You ask one friend — they
              give you a number, but they might be off. You ask <b>100 friends</b> and average their
              guesses. The average is far more reliable than any single guess. That is a Random
              Forest for regression.
            </Lead>
            <Lead>
              In <b>regression</b>, each tree predicts a continuous number — here, a house price in
              $100k units. The random forest's prediction is the <b>arithmetic mean</b> of all trees'
              predictions. Averaging reduces variance dramatically: if B independent trees each have
              prediction variance σ², the average has variance σ²/B. With correlated trees (which
              RF trees always are to some degree) the formula is ρσ² + (1−ρ)σ²/B — still much
              better than a single tree.
            </Lead>
            <Lead>
              The key difference from classification: instead of a <b>majority vote</b> we take an
              <b> arithmetic mean</b>. The pipeline is identical — bootstrap sampling, random feature
              subsets, grow a tree per subset — but the aggregation step changes from "who gets the
              most votes" to "what is the average prediction."
            </Lead>
            <div style={{ margin: "20px 0" }}>
              <RegForestOverviewSvg />
            </div>
            <div className="tf-archwrap" style={{ marginTop: 14 }}>
              <div className="tf-arch">
                <div className="tf-arch-io">8 houses: (age in years → price in $100k)<span>Training data</span></div>
                <div className="tf-arch-f">Bootstrap sampling × 3 (8 with replacement)</div>
                <div className="tf-arch-row">3 overlapping subsets, each with ~37% OOB houses</div>
                <div className="tf-arch-f">Grow one regression tree per subset</div>
                <div className="tf-arch-row">Each tree = step function (mean price per age segment)</div>
                <div className="tf-arch-f">Collect each tree's prediction for the query age</div>
                <div className="tf-arch-row">preds: [T1: {fmt(trace.preds[0])}, T2: {fmt(trace.preds[1])}, T3: {fmt(trace.preds[2])}]</div>
                <div className="tf-arch-f">Average the predictions</div>
                <div className="tf-arch-io tf-arch-io--out">${fmt(avg)}00k for age={age} years<span>Final prediction</span></div>
              </div>
            </div>
            <div className="tf-legend" style={{ marginTop: 14 }}>
              {[
                ["Bagging", "Bootstrap AGGregatING", "Each tree sees a different random sample → different step-function shape"],
                ["Averaging", "Mean of tree predictions", "Reduces variance; the average curve is smoother than any single tree"],
                ["Step function", "Piecewise-constant output", "Each regression tree outputs the mean target value in its leaf region"],
                ["OOB MSE", "Free validation", "Residuals on OOB houses give an unbiased MSE estimate — no holdout needed"],
                ["Variance formula", "ρσ² + (1−ρ)σ²/B", "Tree correlation ρ determines how much averaging actually helps"],
              ].map(([sym, name, desc]) => (
                <div className="tf-leg" key={sym}>
                  <div className="tf-leg-top"><span className="tf-sym">{sym}</span></div>
                  <div className="tf-leg-name">{name}</div>
                  <div className="tf-leg-desc">{desc}</div>
                </div>
              ))}
            </div>
            <Note>Drag the <b>age</b> slider in the top bar — the ensemble average updates live. Notice how it smoothly interpolates between the individual tree predictions.</Note>
          </>
        );
      },
    },

    /* ── 2. Dataset ── */
    {
      id: "dataset", group: "Data", title: "The dataset — 8 houses, age vs price",
      map: "Dataset",
      why: "Understanding the data before modelling is essential. A non-linear declining relationship between age and price is exactly where tree-based methods shine.",
      render: (trace) => {
        const { age, curve } = trace;
        return (
          <>
            <Lead>
              We have <b>8 houses</b> described by their <b>age in years</b> and <b>price in $100k</b>.
              The relationship is clearly non-linear: very new houses lose value quickly, while older
              houses plateau at a lower price. A linear regression would miss this curvature. A single
              decision tree would capture it with step functions. A random forest averages multiple
              step functions into a smoother approximation.
            </Lead>
            <Lead>
              The <b>pink dashed line</b> on the chart marks your query age — drag the slider to move
              it. The <b>pink curve</b> is the RF ensemble average across the entire age range. Notice
              how it approximates the downward trend while remaining piecewise constant (it is still
              an average of step functions, just with more steps than any individual tree).
            </Lead>
            <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
              <RegChart data={RF.data} query={age} curve={curve} w={390} h={250} showTrees={false} showAvg={true} />
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "6px 0 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width={22} height={6}><line x1={0} y1={3} x2={22} y2={3} stroke="#e91e63" strokeWidth={2.5} /></svg>
                <span style={{ fontSize: 13 }}>RF ensemble avg</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width={10} height={10}><circle cx={5} cy={5} r={4.5} fill="#333" /></svg>
                <span style={{ fontSize: 13 }}>Training point</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width={22} height={6}><line x1={0} y1={3} x2={22} y2={3} stroke="#e91e63" strokeWidth={1.5} strokeDasharray="4 3" /></svg>
                <span style={{ fontSize: 13 }}>Query age</span>
              </div>
            </div>
            <div className="tf-subhead">All 8 training houses</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 7 }}>
              {RF.data.map((pt, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                  border: "1px solid #e8e8e8", borderRadius: 8, fontSize: 12, background: "#fafafa",
                }}>
                  <span style={{ color: "#bbb", minWidth: 22 }}>#{i}</span>
                  <span style={{ color: "#555" }}>age = {pt[0]} yr</span>
                  <span style={{ marginLeft: "auto", fontWeight: 700, color: "#1565c0" }}>${pt[1]}00k</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#e3f2fd", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 12 }}>
              <b>Why not linear regression?</b> A straight line through these 8 points would
              underestimate prices for very new and very old houses. Decision trees (and RF)
              handle non-linearities automatically by partitioning the input space into regions.
            </div>
          </>
        );
      },
    },

    /* ── 3. Bootstrap + Tree Training ── */
    {
      id: "bagging", group: "Ensemble", title: "Bootstrap sampling — 3 different views of the data",
      map: "Bootstrap",
      why: "Sampling with replacement gives each tree a slightly different perspective on the age-price relationship. This diversity is what makes averaging meaningful.",
      render: (trace) => {
        const { age, treeCurves } = trace;
        return (
          <>
            <Lead>
              Each of the 3 regression trees trains on a <b>bootstrap sample</b> of 8 houses drawn
              with replacement from the original 8. Some houses appear twice (they count double when
              computing means in leaves), some never appear at all (<b>OOB houses</b>). The result is
              that each tree "sees" a slightly different age-price distribution and learns slightly
              different split thresholds.
            </Lead>
            <Lead>
              The probability that a specific house is not drawn in a bootstrap of n=8 is
              (1 − 1/8)⁸ = (7/8)⁸ ≈ 0.344. So about <b>34% are OOB</b> per tree — roughly 2–3
              houses each. Those OOB houses serve as a free validation set: predict them with the
              tree that didn't train on them, measure the squared error.
            </Lead>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "16px 0" }}>
              {RF.bootstraps.map((bs, ti) => (
                <BootstrapTableReg key={ti} bsIdx={bs} treeId={ti + 1} data={RF.data} />
              ))}
            </div>
            <div className="tf-subhead">How different bootstrap samples produce different trees</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
              {RF.trees.map((tree, ti) => (
                <div key={ti}>
                  <TreeStepChart treeIdx={ti} treeCurve={treeCurves[ti]} data={RF.data} query={age} />
                  <div style={{ textAlign: "center", fontSize: 11.5, marginTop: 4, color: TREE_COLORS[ti] }}>
                    splits: age ≤ {tree.threshold}, ≤ {tree.right.threshold}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
              <div style={{ padding: "12px 14px", background: "#e8f5e9", borderRadius: 9, border: "1px solid #a5d6a7" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#2e7d32", marginBottom: 5 }}>Why duplicates matter</div>
                <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  When house #4 (age=20, $3.8M) appears twice in a bootstrap, it pulls the mean
                  of its leaf segment down slightly. This changes the optimal split threshold and
                  the predicted values at each leaf — producing a different step function.
                </p>
              </div>
              <div style={{ padding: "12px 14px", background: "#fff8e1", borderRadius: 9, border: "1px solid #ffe082" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#f57f17", marginBottom: 5 }}>OOB houses as validation</div>
                <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  OOB predictions are unbiased because the tree never trained on those houses.
                  Squaring the errors and averaging over all OOB predictions gives OOB MSE —
                  a reliable test-set proxy without holding out any data.
                </p>
              </div>
            </div>
          </>
        );
      },
    },

    /* ── 3b. Three Regression Trees Side by Side ── */
    {
      id: "three-trees", group: "Training", title: "The 3 Regression Trees — Different Splits, Different Predictions",
      map: "3 Trees",
      why: "Seeing all three regression trees simultaneously shows how different bootstrap samples produce different split thresholds and different leaf predictions. The averaging step then stabilises these individual estimates.",
      render: () => {
        // Model data from ml-rf.js
        // Tree 1: age <= 10 → 7.5 / age <= 25 → 4.75 / > 25 → 2.3
        // Tree 2: age <= 9  → 7.85 / age <= 20 → 6.25 / > 20 → 2.63
        // Tree 3: age <= 11 → 7.05 / age <= 30 → 4.275 / > 30 → 2.0

        // Bootstrap samples from ml-rf.js
        // [0,0,2,3,4,5,6,7] → house #0 twice, house #1 OOB
        // [0,1,3,4,4,5,6,7] → house #4 twice, house #2 OOB
        // [1,2,3,4,5,6,7,7] → house #7 twice, house #0 OOB

        // Query point
        const QUERY_AGE = 10;
        const treePreds = [7.5, 7.85, 7.05]; // each tree's prediction at age=10
        const avgPred = treePreds.reduce((a, b) => a + b, 0) / 3;

        const treeColors = ["#2196f3", "#4caf50", "#ff9800"];
        const treeBg = ["#e3f2fd", "#e8f5e9", "#fff3e0"];
        const treeHeaderText = ["#0d47a1", "#1b5e20", "#e65100"];

        // Colour helper for leaf node background (blue=low price → green=high price)
        function leafColor(predict) {
          // scale: 0 → blue, 5 → mid, 10 → green
          const t = Math.max(0, Math.min(1, predict / 9.5));
          const r = Math.round(33 + (76 - 33) * (1 - t));
          const g = Math.round(150 + (175 - 150) * t);
          const b = Math.round(243 + (80 - 243) * t);
          return `rgba(${r},${g},${b},0.18)`;
        }
        function leafStroke(predict) {
          const t = Math.max(0, Math.min(1, predict / 9.5));
          const r = Math.round(33 + (76 - 33) * (1 - t));
          const g = Math.round(150 + (175 - 150) * t);
          const b = Math.round(243 + (80 - 243) * t);
          return `rgb(${r},${g},${b})`;
        }

        function ThreeRegTreesSVG() {
          const W = 920, H = 580;
          const nodeW = 138, nodeH = 58;
          const leafW = 132, leafH = 60;
          const rootY = 95;
          const midY = 230;
          const leafY = 375;

          const cols = [
            { cx: 145, treeIdx: 0, label: "Tree 1", color: treeColors[0], bg: treeBg[0], textColor: treeHeaderText[0] },
            { cx: 460, treeIdx: 1, label: "Tree 2", color: treeColors[1], bg: treeBg[1], textColor: treeHeaderText[1] },
            { cx: 775, treeIdx: 2, label: "Tree 3", color: treeColors[2], bg: treeBg[2], textColor: treeHeaderText[2] },
          ];

          const trees = [
            {
              root: { thresh: "10", n: 8, variance: "5.44" },
              leftLeaf: { pred: 7.50, n: 3, desc: "age ≤ 10" },
              rightInternal: { thresh: "25", n: 5, variance: "2.14" },
              rightLeft: { pred: 4.75, n: 2, desc: "10 < age ≤ 25" },
              rightRight: { pred: 2.30, n: 3, desc: "age > 25" },
              bsNote: "House #0 drawn twice",
            },
            {
              root: { thresh: "9", n: 8, variance: "5.44" },
              leftLeaf: { pred: 7.85, n: 2, desc: "age ≤ 9" },
              rightInternal: { thresh: "20", n: 6, variance: "3.01" },
              rightLeft: { pred: 6.25, n: 2, desc: "9 < age ≤ 20" },
              rightRight: { pred: 2.63, n: 4, desc: "age > 20" },
              bsNote: "House #4 drawn twice",
            },
            {
              root: { thresh: "11", n: 8, variance: "5.44" },
              leftLeaf: { pred: 7.05, n: 4, desc: "age ≤ 11" },
              rightInternal: { thresh: "30", n: 4, variance: "1.25" },
              rightLeft: { pred: 4.275, n: 3, desc: "11 < age ≤ 30" },
              rightRight: { pred: 2.00, n: 1, desc: "age > 30" },
              bsNote: "House #7 drawn twice",
            },
          ];

          function InternalNode({ cx, cy, thresh, n, variance, color }) {
            const x = cx - nodeW / 2, y = cy - nodeH / 2;
            return (
              <g>
                <rect x={x} y={y} width={nodeW} height={nodeH} rx={8}
                  fill="#f5f7ff" stroke={color} strokeWidth={2} />
                <text x={cx} y={cy - 14} textAnchor="middle" fontSize={13} fontWeight="700" fill="#1a237e">
                  age ≤ {thresh}
                </text>
                <text x={cx} y={cy + 2} textAnchor="middle" fontSize={10} fill="#666">
                  n={n}, var={variance}
                </text>
                {/* mini bar showing mean of y in node */}
                <rect x={cx - 40} y={cy + 12} width={80} height={8} rx={3} fill="#e8eaf6" />
                <rect x={cx - 40} y={cy + 12} width={Math.round(80 * n / 8)} height={8} rx={3} fill={color} opacity={0.7} />
              </g>
            );
          }

          function LeafNode({ cx, cy, pred, n, desc }) {
            const x = cx - leafW / 2, y = cy - leafH / 2;
            const bg = leafColor(pred);
            const stroke = leafStroke(pred);
            return (
              <g>
                <rect x={x} y={y} width={leafW} height={leafH} rx={8}
                  fill={bg} stroke={stroke} strokeWidth={2} />
                <text x={cx} y={cy - 12} textAnchor="middle" fontSize={13} fontWeight="800" fill="#1a237e">
                  predict: ${pred.toFixed(2)}×100k
                </text>
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill="#555">
                  n={n} point{n !== 1 ? "s" : ""}
                </text>
                <text x={cx} y={cy + 18} textAnchor="middle" fontSize={9} fill="#888" fontStyle="italic">
                  {desc}
                </text>
              </g>
            );
          }

          function Edge({ x1, y1, x2, y2, color, label, labelSide }) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            return (
              <g>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} />
                <text
                  x={labelSide === "left" ? midX - 8 : midX + 8}
                  y={midY}
                  textAnchor={labelSide === "left" ? "end" : "start"}
                  fontSize={11} fontWeight="700" fill={color}
                >{label}</text>
              </g>
            );
          }

          return (
            <svg width={W} height={H} style={{ display: "block", border: "1px solid #e0e0e0", borderRadius: 12, background: "#fefefe", overflow: "visible" }}>

              {cols.map((col, ci) => {
                const t = trees[ci];
                const cx = col.cx;
                const rootCx = cx, rootCy = rootY;
                const leftLeafCx = cx - 148, leftLeafCy = midY;
                const rightInternalCx = cx + 112, rightInternalCy = midY;
                const rightLeftCx = cx + 30, rightLeftCy = leafY;
                const rightRightCx = cx + 192, rightRightCy = leafY;

                const colLeft = ci === 0 ? 4 : ci === 1 ? 310 : 624;
                const colRight = ci === 0 ? 296 : ci === 1 ? 606 : 916;
                const colWidth = colRight - colLeft;

                return (
                  <g key={ci}>
                    {/* Header band */}
                    <rect x={colLeft} y={4} width={colWidth} height={38} rx={8}
                      fill={col.bg} stroke={col.color} strokeWidth={1.5} />
                    <text x={cx} y={20} textAnchor="middle" fontSize={13} fontWeight="800" fill={col.textColor}>
                      {col.label}
                    </text>
                    <text x={cx} y={35} textAnchor="middle" fontSize={10} fill={col.textColor} opacity={0.8}>
                      {t.bsNote}
                    </text>

                    {/* Edges */}
                    <Edge x1={rootCx - nodeW / 4} y1={rootCy + nodeH / 2}
                      x2={leftLeafCx} y2={leftLeafCy - leafH / 2}
                      color="#4caf50" label="≤" labelSide="left" />
                    <Edge x1={rootCx + nodeW / 4} y1={rootCy + nodeH / 2}
                      x2={rightInternalCx} y2={rightInternalCy - nodeH / 2}
                      color="#ef5350" label=">" labelSide="right" />
                    <Edge x1={rightInternalCx - nodeW / 4} y1={rightInternalCy + nodeH / 2}
                      x2={rightLeftCx} y2={rightLeftCy - leafH / 2}
                      color="#4caf50" label="≤" labelSide="left" />
                    <Edge x1={rightInternalCx + nodeW / 4} y1={rightInternalCy + nodeH / 2}
                      x2={rightRightCx} y2={rightRightCy - leafH / 2}
                      color="#ef5350" label=">" labelSide="right" />

                    {/* Nodes */}
                    <InternalNode cx={rootCx} cy={rootCy}
                      thresh={t.root.thresh} n={t.root.n} variance={t.root.variance} color={col.color} />
                    <LeafNode cx={leftLeafCx} cy={leftLeafCy}
                      pred={t.leftLeaf.pred} n={t.leftLeaf.n} desc={t.leftLeaf.desc} />
                    <InternalNode cx={rightInternalCx} cy={rightInternalCy}
                      thresh={t.rightInternal.thresh} n={t.rightInternal.n} variance={t.rightInternal.variance} color={col.color} />
                    <LeafNode cx={rightLeftCx} cy={rightLeftCy}
                      pred={t.rightLeft.pred} n={t.rightLeft.n} desc={t.rightLeft.desc} />
                    <LeafNode cx={rightRightCx} cy={rightRightCy}
                      pred={t.rightRight.pred} n={t.rightRight.n} desc={t.rightRight.desc} />

                    {/* Bootstrap info */}
                    <rect x={colLeft + 8} y={leafY + 44} width={colWidth - 16} height={28} rx={6}
                      fill={col.bg} stroke={col.color} strokeWidth={1} opacity={0.6} />
                    <text x={cx} y={leafY + 63} textAnchor="middle" fontSize={10} fill={col.textColor} fontWeight="600">
                      Bootstrap sample: {[7, 6, 7][ci]} unique houses
                    </text>

                    {/* Prediction arrow for query age=10 */}
                    <g>
                      <line x1={cx} y1={leafY + 80} x2={cx} y2={leafY + 108}
                        stroke={col.color} strokeWidth={2} markerEnd="url(#arrow)" />
                      <polygon points={`${cx},${leafY + 112} ${cx - 6},${leafY + 100} ${cx + 6},${leafY + 100}`}
                        fill={col.color} />
                      <rect x={cx - 55} y={leafY + 116} width={110} height={26} rx={6}
                        fill={col.color} opacity={0.9} />
                      <text x={cx} y={leafY + 133} textAnchor="middle" fontSize={11} fontWeight="800" fill="#fff">
                        age=10 → ${treePreds[ci].toFixed(2)}×100k
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Column dividers */}
              <line x1={305} y1={4} x2={305} y2={H - 60} stroke="#e0e0e0" strokeWidth={1} strokeDasharray="4 3" />
              <line x1={615} y1={4} x2={615} y2={H - 60} stroke="#e0e0e0" strokeWidth={1} strokeDasharray="4 3" />

              {/* Average row */}
              <rect x={10} y={H - 52} width={W - 20} height={42} rx={10}
                fill="#fce4ec" stroke="#e91e63" strokeWidth={2} />
              <text x={W / 2} y={H - 34} textAnchor="middle" fontSize={12} fontWeight="700" fill="#b71c1c">
                Age = {QUERY_AGE} years: Tree 1 → ${treePreds[0].toFixed(2)}   |   Tree 2 → ${treePreds[1].toFixed(2)}   |   Tree 3 → ${treePreds[2].toFixed(2)}
              </text>
              <text x={W / 2} y={H - 16} textAnchor="middle" fontSize={13} fontWeight="900" fill="#c62828">
                Forest Average = (${treePreds[0].toFixed(2)} + ${treePreds[1].toFixed(2)} + ${treePreds[2].toFixed(2)}) ÷ 3 = ${avgPred.toFixed(2)} × 100k
              </text>

              {/* Legend */}
              <g transform={`translate(10, ${H - 56})`}>
              </g>
            </svg>
          );
        }

        return (
          <>
            <Lead>
              Here are all three regression trees drawn <b>side by side</b>. Each column shows one
              complete tree: an <b>age threshold</b> at the root, then a second split, then three
              leaf nodes. Each leaf predicts the <b>mean price</b> of the training houses that landed
              in that region. The arrows at the bottom show what each tree predicts for a query house
              of <b>age = {QUERY_AGE} years</b>.
            </Lead>
            <Lead>
              The three trees split at <b>different thresholds</b> — age ≤ 10, 9, and 11 at the
              root; age ≤ 25, 20, and 30 at the second level. This happens because each tree
              trained on a different bootstrap sample. House #0 (age=5, $8.2M) appears twice in
              Tree 1's sample, pulling the young-house mean up slightly. These small differences
              cascade into different leaf predictions.
            </Lead>
            <div style={{ overflowX: "auto", margin: "16px 0" }}>
              <ThreeRegTreesSVG />
            </div>
            <div style={{ background: "#e3f2fd", border: "2px solid #2196f3", borderRadius: 10, padding: "14px 18px", margin: "16px 0", fontSize: 13, lineHeight: 1.7 }}>
              <b style={{ color: "#0d47a1", fontSize: 14 }}>Key insight — why averaging stabilises predictions:</b><br />
              Different bootstrap samples produce different split points, which in turn produce
              different leaf predictions. <b>The average is more stable than any single tree</b>
              because the individual errors (caused by which houses happened to appear in each
              bootstrap) tend to cancel out. This is the core mathematical benefit of bagging:
              Var(average) = ρσ² + (1−ρ)σ²/B, where B=3 here reduces per-tree noise significantly.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0" }}>
              {[
                { color: "#2196f3", label: "Tree 1", detail: "Splits: age ≤ 10, then ≤ 25. Bootstrap: house #0 twice → slightly higher mean for young segment." },
                { color: "#4caf50", label: "Tree 2", detail: "Splits: age ≤ 9, then ≤ 20. Bootstrap: house #4 twice → pulled the 9–20yr mean toward $3.8M." },
                { color: "#ff9800", label: "Tree 3", detail: "Splits: age ≤ 11, then ≤ 30. Bootstrap: house #7 twice → lower mean for oldest segment." },
              ].map(({ color, label, detail }) => (
                <div key={label} style={{
                  flex: "1 1 200px", padding: "10px 14px", borderRadius: 9,
                  border: `2px solid ${color}`, background: color + "10",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{detail}</div>
                </div>
              ))}
            </div>
          </>
        );
      },
    },

    /* ── 3b. Forest Animation ── */
    {
      id: "forest-animation", group: "Training", title: "Watch 3 Trees Predict & Average",
      map: "Forest Animation",
      why: "Watching each tree's step-function grow and then seeing the three predictions merge into an average builds concrete intuition for how ensemble averaging reduces variance.",
      render: () => <ForestRegAnim />,
    },

    /* ── 4. Averaging Predictions ── */
    {
      id: "averaging", group: "Prediction", title: "Averaging predictions — the ensemble step function",
      map: "Averaging",
      why: "The averaging step is simple but powerful: it converts three jagged step functions into a smoother, more accurate curve.",
      render: (trace) => {
        const { age, preds, avg, curve, treeCurves } = trace;
        return (
          <>
            <Lead>
              For any query age, we get a prediction from each of the 3 trees, then simply take
              their <b>arithmetic mean</b>. For age = {age} years the predictions are{" "}
              <span style={{ color: TREE_COLORS[0], fontWeight: 700 }}>${fmt(preds[0])}00k</span>,{" "}
              <span style={{ color: TREE_COLORS[1], fontWeight: 700 }}>${fmt(preds[1])}00k</span>, and{" "}
              <span style={{ color: TREE_COLORS[2], fontWeight: 700 }}>${fmt(preds[2])}00k</span>.
              The average is <b style={{ color: "#e91e63" }}>${fmt(avg)}00k</b>.
            </Lead>
            <Lead>
              The chart below shows all three tree step functions (dashed coloured lines) together
              with their pointwise average (solid pink curve). Notice how the average sits between
              the individual curves — it is literally their average at every point. Where trees
              agree, the average follows them closely. Where they disagree, the average finds the
              middle ground.
            </Lead>
            <div className="nn-calc" style={{ marginTop: 12 }}>
              <div className="nn-calc-h">Ensemble average computation for age = {age}</div>
              {preds.map((p, ti) => (
                <div className="nn-calc-row" key={ti}>
                  <span style={{ color: TREE_COLORS[ti], fontWeight: 700, minWidth: 64, display: "inline-block" }}>Tree {ti + 1}:</span>
                  <span style={{ color: "#555" }}>
                    age={age} falls in region "{RF.trees[ti].threshold >= age ? `age ≤ ${RF.trees[ti].threshold}` : (RF.trees[ti].right.threshold >= age ? `${RF.trees[ti].threshold} < age ≤ ${RF.trees[ti].right.threshold}` : `age > ${RF.trees[ti].right.threshold}`)}"
                    → leaf mean = <b>${fmt(p)}00k</b>
                  </span>
                </div>
              ))}
              <div className="nn-calc-row" style={{ background: "#fce4ec", borderTop: "2px solid #f48fb1" }}>
                <span style={{ fontWeight: 700, color: "#c62828" }}>
                  Average = ({preds.map(p => fmt(p)).join(" + ")}) ÷ 3 = <b>${fmt(avg)}00k</b>
                </span>
              </div>
            </div>
            <div className="tf-subhead" style={{ marginTop: 14 }}>All 3 tree curves + ensemble average</div>
            <div style={{ margin: "12px 0" }}>
              <RegChart data={RF.data} query={age} curve={curve} treeCurves={treeCurves}
                w={390} h={250} showTrees={true} showAvg={true} />
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "8px 0" }}>
              {TREE_COLORS.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width={22} height={6}><line x1={0} y1={3} x2={22} y2={3} stroke={c} strokeWidth={2} strokeDasharray="5 3" /></svg>
                  <span style={{ fontSize: 12 }}>Tree {i + 1}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width={22} height={6}><line x1={0} y1={3} x2={22} y2={3} stroke="#e91e63" strokeWidth={3} /></svg>
                <span style={{ fontSize: 12 }}>RF ensemble avg</span>
              </div>
            </div>
            <Note>The pink curve is always between the three dashed curves — it is their pointwise average. Try extreme ages (very new or very old) to see where trees disagree most.</Note>
          </>
        );
      },
    },

    /* ── 5. Variance Reduction ── */
    {
      id: "variance", group: "Theory", title: "Variance reduction — why averaging helps so much",
      map: "Var. Reduction",
      why: "The theoretical result behind averaging explains when and why more trees help, and why decorrelation (the √p trick) is essential for regression forests.",
      render: () => (
        <>
          <Lead>
            Here is the key theorem: if you average B <b>independent</b> random variables each
            with variance σ², the average has variance σ²/B. Doubling the number of trees
            halves the variance. That is why more trees always help (up to a point).
          </Lead>
          <Lead>
            But RF trees are not independent — they all train on the same dataset (just different
            bootstrap samples) and they all use the same features. Their predictions are
            <b> correlated</b>. The correct formula for correlated trees is:
          </Lead>
          <div style={{ background: "#f5f5f5", borderRadius: 10, padding: "16px 22px", fontFamily: "monospace", fontSize: 14, margin: "12px 0", border: "1px solid #e0e0e0" }}>
            <div style={{ marginBottom: 10 }}><b>Single tree:</b>   Var(T) = σ²</div>
            <div style={{ marginBottom: 10 }}><b>Independent forest (ρ=0):</b>   Var = σ²/B</div>
            <div style={{ marginBottom: 10, color: "#e91e63" }}><b>RF (correlated, ρ&gt;0):</b>   Var = ρ·σ² + (1−ρ)·σ²/B</div>
            <div style={{ fontSize: 11, color: "#888", fontFamily: "sans-serif" }}>
              ρ = average pairwise correlation between tree predictions. Typical value: 0.3–0.5.
            </div>
          </div>
          <Lead>
            Two things control ρ: (1) how different the bootstrap samples are (they're always
            correlated since drawn from the same pool), and (2) <b>random feature subsets</b>
            (the √p trick) — this is the main lever. Fewer features per split → more decorrelated
            trees → closer ρ to 0 → more variance reduction.
          </Lead>
          <div className="tf-subhead">Variance vs number of trees (ρ = 0.38)</div>
          <VarianceBarChart />
          <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 10 }}>
            <b>Practical implication:</b> Going from 1 → 10 trees cuts variance by ~76%.
            Going from 100 → 200 trees only cuts it by ~0.3%. Most practitioners stop at
            100–500 trees — after that the compute cost outweighs the tiny accuracy gain.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div style={{ padding: "12px 14px", background: "#e3f2fd", borderRadius: 9, border: "1px solid #90caf9" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0d47a1", marginBottom: 5 }}>Bias vs Variance tradeoff</div>
              <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                Averaging reduces <em>variance</em> but not <em>bias</em>. If each tree is too
                shallow to capture the true pattern, averaging shallow trees gives a biased
                ensemble. RF fixes this by growing deep trees (low bias, high variance per tree)
                and then averaging (reducing variance).
              </p>
            </div>
            <div style={{ padding: "12px 14px", background: "#fce4ec", borderRadius: 9, border: "1px solid #f48fb1" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#b71c1c", marginBottom: 5 }}>What ρ means numerically</div>
              <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                With ρ=0.38 and B=100 trees: Var = 0.38σ² + 0.62σ²/100 = 0.386σ².
                Even perfectly decorrelated trees (ρ=0) would give 0.01σ². Feature
                randomness is worth enormous variance reduction but can't eliminate
                all tree correlation.
              </p>
            </div>
          </div>
        </>
      ),
    },

    /* ── 6. OOB Error ── */
    {
      id: "oob", group: "Evaluation", title: "OOB error for regression — free MSE estimate",
      map: "OOB Error",
      why: "Just like in classification, OOB samples give a free, nearly unbiased estimate of test error — this time measured in MSE (mean squared error) rather than accuracy.",
      render: (trace) => {
        const { oob } = trace;
        return (
          <>
            <Lead>
              Each tree was trained on a bootstrap sample that left out roughly 34% of the 8
              houses. For each left-out house, we predict its price using that tree and compute
              the squared error: (predicted − true)². Averaging these over all OOB predictions
              gives the <b>OOB MSE</b> — a nearly unbiased estimate of the true test MSE.
            </Lead>
            <Lead>
              The overall forest OOB MSE is computed by: for each house i, collect predictions
              from all trees for which house i was OOB. Average those predictions to get
              ŷ_oob(i). Then OOB MSE = (1/n) Σᵢ (ŷ_oob(i) − yᵢ)². With 3 trees our OOB
              set is small but with 100+ trees each house appears in ~37 OOB sets for a
              highly reliable estimate.
            </Lead>
            <div className="tf-subhead">OOB MSE per tree</div>
            <OOBRegGrid oob={oob} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
              <div style={{ padding: "12px 14px", background: "#e8f5e9", borderRadius: 9, border: "1px solid #a5d6a7" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#2e7d32", marginBottom: 5 }}>OOB MSE vs Training MSE</div>
                <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  Training MSE: predict all training points with the full forest — will be low
                  (possibly 0 with deep trees). OOB MSE: each point predicted only by trees
                  that didn't train on it — an honest test error. Use OOB MSE for model selection.
                </p>
              </div>
              <div style={{ padding: "12px 14px", background: "#e3f2fd", borderRadius: 9, border: "1px solid #90caf9" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0d47a1", marginBottom: 5 }}>In sklearn</div>
                <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  Set <code style={{ background: "#e8eaf6", padding: "1px 5px", borderRadius: 3 }}>oob_score=True</code>.
                  Access <code style={{ background: "#e8eaf6", padding: "1px 5px", borderRadius: 3 }}>model.oob_score_</code>
                  (R² on OOB samples). Compute OOB MSE via
                  <code style={{ background: "#e8eaf6", padding: "1px 5px", borderRadius: 3 }}>model.oob_prediction_</code>.
                </p>
              </div>
            </div>
            <div style={{ background: "#fff3e0", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 10 }}>
              <b>Caution with small datasets:</b> With only 8 houses, each tree's OOB set is just
              2–3 houses — too small for reliable MSE. With hundreds of examples and 100+ trees,
              OOB MSE is extremely reliable.
            </div>
          </>
        );
      },
    },

    /* ── 7. Feature Importance ── */
    {
      id: "importance", group: "Insights", title: "Feature importance in regression forests",
      map: "Importance",
      why: "Regression forests measure feature importance by how much variance each feature reduces at each split. With one feature in our toy dataset, it's 100% — but the method generalises to many features.",
      render: () => (
        <>
          <Lead>
            <b>Variance-based feature importance</b> works similarly to Gini importance in
            classification, but uses <b>variance reduction</b> instead of impurity reduction.
            For each split on feature f: ΔVar(f) = n_node/n_total × [Var(parent) − (n_left/n_node ×
            Var(left) + n_right/n_node × Var(right))]. Sum over all splits on f in all trees,
            then normalise.
          </Lead>
          <Lead>
            Features that appear near the root of many trees (where more samples pass through)
            and produce large variance reductions get the highest importance. In our single-feature
            dataset, age has 100% importance by definition. In real multi-feature datasets, this
            ranking guides feature selection and reveals which variables drive the target.
          </Lead>
          <div className="tf-subhead">Step-by-step computation for Tree 1</div>
          <div className="nn-calc" style={{ marginTop: 8 }}>
            <div className="nn-calc-h">Tree 1 — variance reductions at each split</div>
            <div className="nn-calc-row">
              <span style={{ color: "#555", fontSize: 13 }}>
                All 8 prices: [8.2, 7.5, 6.8, 5.7, 3.8, 2.9, 2.2, 1.8] | Var(all) ≈ 5.44
              </span>
            </div>
            <div className="nn-calc-row">
              <span style={{ color: "#555", fontSize: 13 }}>
                Root split (age ≤ 10, 3 left / 5 right):
                Var(left)=[8.2,7.5,6.8]≈0.32, Var(right)=[5.7,3.8,2.9,2.2,1.8]≈2.14
              </span>
            </div>
            <div className="nn-calc-row" style={{ background: "#e8f5e9" }}>
              <span style={{ color: "#2e7d32", fontSize: 13, fontWeight: 700 }}>
                ΔVar₁ = 5.44 − (3/8×0.32 + 5/8×2.14) = 5.44 − 0.12 − 1.34 = <b>3.98</b>
              </span>
            </div>
            <div className="nn-calc-row">
              <span style={{ color: "#555", fontSize: 13 }}>
                Right-child split (age ≤ 25, 2 left / 3 right from right subtree):
                Var(left)=[5.7,3.8]≈0.91, Var(right)=[2.9,2.2,1.8]≈0.25
              </span>
            </div>
            <div className="nn-calc-row" style={{ background: "#e8f5e9" }}>
              <span style={{ color: "#2e7d32", fontSize: 13, fontWeight: 700 }}>
                ΔVar₂ = 5/8 × (2.14 − (2/5×0.91 + 3/5×0.25)) = 5/8 × (2.14 − 0.51) ≈ <b>1.02</b>
              </span>
            </div>
            <div className="nn-calc-row" style={{ background: "#e3f2fd" }}>
              <span style={{ color: "#0d47a1", fontWeight: 700 }}>
                Total importance (age, Tree 1) = 3.98 + 1.02 = 5.00. Normalised: 100% (only one feature).
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div style={{ padding: "12px 14px", background: "#e8eaf6", borderRadius: 9, border: "1px solid #9fa8da" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#283593", marginBottom: 5 }}>Impurity vs permutation importance</div>
              <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                Variance-based (impurity) importance is fast and built-in. Permutation importance
                shuffles each feature and measures the MSE increase — more reliable for
                high-cardinality features and correlated inputs.
              </p>
            </div>
            <div style={{ padding: "12px 14px", background: "#fce4ec", borderRadius: 9, border: "1px solid #f48fb1" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#b71c1c", marginBottom: 5 }}>SHAP values for regression</div>
              <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                For per-prediction feature attribution, SHAP decomposes each prediction
                into feature contributions consistent with Shapley values from game theory.
                TreeSHAP computes exact SHAP values for tree models in O(TLD²).
              </p>
            </div>
          </div>
        </>
      ),
    },

    /* ── 8. Missing Values & Outliers ── */
    {
      id: "robustness", group: "Insights", title: "Missing values & outliers in regression forests",
      map: "Robustness",
      why: "Outliers in regression can be more damaging than in classification because a single extreme value can pull a mean far from the truth. RF's vote averaging provides natural protection.",
      render: () => (
        <>
          <Lead>
            In regression, outliers are particularly dangerous. A single house priced $20M in a
            dataset of $2–8M homes will completely distort a linear regression. A single decision
            tree? It might create a leaf just for that house, or its mean will be pulled far up.
            A random forest? The outlier can only affect the trees that happen to include it in
            their bootstrap sample. The others are unaffected, and the average dampens the distortion.
          </Lead>
          <Lead>
            Think of it this way: if one friend guesses the car's price as $500k (way too high)
            and 99 friends guess around $15k, the average is about $19.85k — very close to the
            true value. The outlier "friend" barely moves the needle. That's exactly what RF does
            with outlier training points.
          </Lead>
          <div className="tf-subhead">Numerical example — outlier in one tree</div>
          <div className="nn-calc" style={{ marginTop: 8 }}>
            <div className="nn-calc-h">Query: age = 20 years (true price ≈ $3.8M, target ≈ 3.8)</div>
            <div className="nn-calc-row">
              <span style={{ color: TREE_COLORS[0], fontWeight: 700 }}>Tree 1 (has outlier duplicate age=7, price=50 in bootstrap):</span>
              <span style={{ color: "#555" }}> leaf mean for its age-group = <b>~18</b> ($1800k — outlier-inflated)</span>
            </div>
            <div className="nn-calc-row">
              <span style={{ color: TREE_COLORS[1], fontWeight: 700 }}>Tree 2 (no outlier):</span>
              <span style={{ color: "#555" }}> leaf mean = <b>4.75</b> ($475k — close to truth)</span>
            </div>
            <div className="nn-calc-row">
              <span style={{ color: TREE_COLORS[2], fontWeight: 700 }}>Tree 3 (no outlier):</span>
              <span style={{ color: "#555" }}> leaf mean = <b>4.275</b> ($427.5k — close to truth)</span>
            </div>
            <div className="nn-calc-row" style={{ background: "#e8f5e9" }}>
              <span style={{ color: "#2e7d32", fontWeight: 700 }}>
                Forest average = (18 + 4.75 + 4.275) / 3 = <b>9.01</b> — still affected, but far less than Tree 1 alone
              </span>
            </div>
            <div className="nn-calc-row" style={{ background: "#e3f2fd" }}>
              <span style={{ color: "#0d47a1", fontWeight: 700 }}>
                With 100 trees: only ~3 contain the outlier. Avg ≈ (3×18 + 97×4.5) / 100 ≈ <b>4.91</b> — near truth
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div style={{ padding: "12px 14px", background: "#e8f5e9", borderRadius: 9, border: "1px solid #a5d6a7" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#2e7d32", marginBottom: 5 }}>Missing value strategies</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 1.8 }}>
                <li>Median imputation (fast, works well)</li>
                <li>Mean imputation (sensitive to outliers in training)</li>
                <li>RF proximity imputation (accurate, iterative)</li>
                <li>missForest: use RF itself to impute, iterate to convergence</li>
              </ul>
            </div>
            <div style={{ padding: "12px 14px", background: "#fff3e0", borderRadius: 9, border: "1px solid #ffcc80" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#e65100", marginBottom: 5 }}>When RF's protection fails</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 1.8 }}>
                <li>Outlier in very small dataset (every tree sees it)</li>
                <li>Outliers in the target variable (leaf means are pulled)</li>
                <li>Use MAE criterion instead of MSE for outlier robustness</li>
                <li>Or use median-based aggregation (ExtraTreesRegressor)</li>
              </ul>
            </div>
          </div>
        </>
      ),
    },

    /* ── 9. Evaluation & When to Use ── */
    {
      id: "evaluation", group: "Insights", title: "Evaluation metrics & when to choose RF regression",
      map: "Evaluation",
      why: "Choosing the right evaluation metric matters as much as choosing the right model. And knowing when RF regression is the best choice (vs alternatives) saves time and gets better results.",
      render: (trace) => {
        const { age, avg } = trace;
        const linPred = 9.5 - 0.18 * age;
        const singleTreePred = age <= 10 ? 7.5 : (age <= 25 ? 4.75 : 2.3);
        return (
          <>
            <Lead>
              For regression, the primary evaluation metrics are <b>MSE</b> (Mean Squared Error),
              <b> RMSE</b> (Root MSE — in the same units as the target), and <b>R²</b> (coefficient
              of determination — 1 is perfect, 0 is as bad as predicting the mean). RF also provides
              OOB versions of all these for free.
            </Lead>
            <Lead>
              For age = {age} years, the three methods predict very different prices. Linear
              regression extrapolates along a straight line. A single decision tree makes one big
              step. The RF ensemble finds the smoothed middle ground, closest to the true
              non-linear relationship.
            </Lead>
            <div className="tf-subhead">Predictions for age = {age} years</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
              {[
                ["Linear Regression", fmt(linPred, 2), "#9e9e9e", "Straight line: 9.5 − 0.18 × age"],
                ["Single Decision Tree", fmt(singleTreePred, 2), "#ff9800", "One step function (Tree 1 structure)"],
                ["Random Forest", fmt(avg, 2), "#e91e63", "Average of 3 step functions"],
              ].map(([name, pred, color, note]) => (
                <div key={name} style={{
                  border: `2px solid ${color}`, borderRadius: 10, padding: "12px 16px",
                  background: color + "10", flex: "1 1 170px",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color }}>{name}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color, marginTop: 5 }}>${pred}00k</div>
                  <div style={{ fontSize: 11.5, color: "#777", marginTop: 5 }}>{note}</div>
                </div>
              ))}
            </div>
            <div className="tf-subhead">Model comparison</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    {["Property", "Linear Regression", "Single Tree", "Random Forest"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Output type", "Smooth line", "Step function", "Avg step function"],
                    ["Bias (non-linear data)", "High", "Low (deep tree)", "Low"],
                    ["Variance", "Low", "High (overfits)", "Low (averaging)"],
                    ["Extrapolation", "Yes (linear)", "No (flat)", "No (flat)"],
                    ["Handles non-linearity", "No (needs transforms)", "Yes", "Yes"],
                    ["Outlier sensitivity", "High", "Moderate", "Low"],
                    ["Interpretability", "★★★★★", "★★★★☆", "★★☆☆☆"],
                    ["Training speed", "Very fast", "Fast", "Moderate"],
                    ["Feature importance", "Via coefficients", "Split-based", "Reliable (avg over trees)"],
                    ["Missing data", "Needs imputation", "Needs imputation", "Proximity imputation"],
                  ].map(([prop, ...vals], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                      <td style={{ padding: "7px 12px", fontWeight: 600, color: "#555" }}>{prop}</td>
                      {vals.map((v, j) => (
                        <td key={j} style={{
                          padding: "7px 12px",
                          color: j === 2 ? "#1565c0" : "#333",
                          fontWeight: j === 2 ? 600 : 400,
                        }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="tf-subhead" style={{ marginTop: 16 }}>Pros vs Cons</div>
            <div className="opt-pc">
              <div className="opt-pc-col is-pro">
                <div style={{ fontWeight: 700, marginBottom: 8, color: "#2e7d32" }}>Advantages</div>
                {[
                  "Handles non-linear relationships automatically",
                  "Robust to outliers and noisy features",
                  "No feature scaling required",
                  "OOB MSE as free test error estimate",
                  "Feature importance built in",
                  "Works well out of the box with default settings",
                  "Trivially parallelises across trees",
                ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
              </div>
              <div className="opt-pc-col is-con">
                <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
                {[
                  "Cannot extrapolate beyond training range (flat at extremes)",
                  "Step-function outputs — not smooth like linear regression",
                  "Slower than linear regression for prediction",
                  "Less accurate than XGBoost/LightGBM on most tabular data",
                  "High memory with many deep trees",
                  "Interpretability limited with 100+ trees",
                ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✗ {t}</div>)}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div style={{ padding: "12px 14px", background: "#e8f5e9", borderRadius: 9, border: "1px solid #a5d6a7" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#2e7d32", marginBottom: 5 }}>Choose RF regression when…</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 1.8 }}>
                  <li>Non-linear relationships in tabular data</li>
                  <li>Mix of continuous and categorical features</li>
                  <li>Need feature importance rankings</li>
                  <li>Quick, reliable baseline with defaults</li>
                  <li>Moderate dataset size (hundreds to low millions)</li>
                </ul>
              </div>
              <div style={{ padding: "12px 14px", background: "#fff3e0", borderRadius: 9, border: "1px solid #ffcc80" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#e65100", marginBottom: 5 }}>Consider alternatives when…</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 1.8 }}>
                  <li>Need extrapolation → linear/polynomial regression</li>
                  <li>Maximum accuracy → XGBoost, LightGBM, CatBoost</li>
                  <li>Very large dataset → LightGBM (histogram-based)</li>
                  <li>Interpretability required → linear model or single tree</li>
                  <li>Streaming data → online learning algorithms</li>
                </ul>
              </div>
            </div>
            <div style={{ background: "#e3f2fd", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 12 }}>
              <b>Quick start:</b>{" "}
              <code style={{ background: "#bbdefb", padding: "2px 6px", borderRadius: 3, fontFamily: "monospace" }}>
                from sklearn.ensemble import RandomForestRegressor; reg = RandomForestRegressor(n_estimators=100, oob_score=True, n_jobs=-1)
              </code>
            </div>
          </>
        );
      },
    },
    {
      id: "hyperparams",
      group: "Practical",
      title: "Hyperparameters & when to use",
      map: "Hyperparams",
      why: "Random Forest's biggest practical advantage is robust defaults. You typically only need to tune n_estimators and max_features.",
      render: () => (
        <>
          <Lead>Random Forest regression is one of the best 'first model to try' algorithms. It works well with default settings across a huge range of regression tasks, handles outliers gracefully, and gives reliable feature importances for free. When you need better accuracy, graduate to XGBoost.</Lead>
          <Note>The variance of a Random Forest is: σ²_forest = ρσ²_tree/n + (1-1/n)ρσ²_tree ≈ ρσ²_tree. Two levers reduce forest variance: (1) grow more trees (increase n_estimators), (2) reduce tree correlation ρ (decrease max_features). max_features is the key tuning parameter.</Note>
          <div className="tf-subhead">Key hyperparameters</div>
          <div className="tf-legend">
            {[
              ["n_estimators", "Number of trees", "Default 100. More trees = lower variance, but diminishing returns after 200–500. Monitor OOB error vs n_estimators curve — stop when it flattens."],
              ["max_features", "Features sampled per split", "Default 1.0 (all features) for regression. Try 'sqrt' or 0.33 to increase tree diversity (lower correlation). Tune this first."],
              ["max_depth", "Max depth per tree", "Default None (fully grown). Usually not tuned — RF's bagging already reduces overfitting. Limit to 10–20 only if memory is a constraint."],
              ["min_samples_leaf", "Min samples in each leaf", "Default 1. The most effective regularizer after n_estimators. Increase to 2–5 for noisy data."],
              ["bootstrap", "Bootstrap samples", "True (default). Setting False gives slightly different bias-variance trade-off and removes OOB capability. Almost always keep True."],
              ["oob_score", "Out-of-bag R² score", "Set True for a free validation score. OOB samples are the ~37% of data not used to train each tree. No cross-validation needed."],
              ["n_jobs", "CPU cores", "-1 to use all cores. Trees are fully independent — near-linear speedup."],
              ["random_state", "Reproducibility seed", "Set to any integer for reproducible results. Essential for experiments and production."],
            ].map(([sym, name, desc]) => (
              <div className="tf-leg" key={sym}>
                <div className="tf-leg-top"><span className="tf-sym" style={{ fontSize: 10.5 }}>{sym}</span></div>
                <div className="tf-leg-name">{name}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>
          <div className="tf-subhead">Pros vs Cons</div>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#2e7d32" }}>Advantages</div>
              {[
                "Great out-of-box accuracy",
                "Reliable feature importances",
                "OOB validation for free",
                "Handles outliers and missing values",
                "No feature scaling",
                "Trivially parallelizable",
                "Low risk of catastrophic failure",
              ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
              {[
                "Not interpretable as a model",
                "Slower prediction than single tree",
                "High memory usage (all trees stored)",
                "Cannot extrapolate beyond training range",
                "Outperformed by GBM/XGBoost when tuned",
              ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✗ {t}</div>)}
            </div>
          </div>
          <div className="tf-subhead">When to use (decision guide)</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Scenario</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Best choice</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Why</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Quick, robust regression baseline", "Random Forest", "Strong defaults, hard to overfit catastrophically"],
                  ["Maximize predictive accuracy (competition/production)", "XGBoost / LightGBM", "Sequential boosting beats bagging on most tabular data"],
                  ["Need feature importances", "Random Forest", "Built-in importances are reliable and fast"],
                  ["Very large dataset (millions of rows)", "LightGBM", "Histogram-based split finding is much faster"],
                  ["Need interpretable rules", "Single Decision Tree or Explainable Boosting Machine", "RF's 100+ trees can't be read like one tree"],
                  ["Target has heavy outliers", "Random Forest (use criterion='absolute_error')", "MAE criterion is more robust than MSE to large outliers"],
                ].map(([sc, ch, wh], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                    <td style={{ padding: "7px 12px" }}>{sc}</td>
                    <td style={{ padding: "7px 12px", fontWeight: 600 }}>{ch}</td>
                    <td style={{ padding: "7px 12px", color: "#555" }}>{wh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ),
    },
  ];

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "Random Forest",
    subtitle: "Regression — ensemble of trees with averaged predictions",
    cur: "Regression",
    category: "ML Algorithms",
    run: window.ML_RF.runRFReg,
    default: window.ML_RF.RF_REG.default,
    modeLinks: [
      { label: "Classification", href: "Random Forest (Classification).html", active: false },
      { label: "Regression", href: "Random Forest (Regression).html", active: true },
    ],
    renderInput: (input, setInput, trace) => (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">age (yrs)</span>
          <input type="range" min="1" max="45" step="1"
            value={input.age}
            onChange={e => setInput({ age: parseInt(e.target.value) })} />
          <span className="nn-slider-v">{input.age}</span>
        </label>
        {trace && (
          <span style={{
            marginLeft: 12, padding: "4px 13px", borderRadius: 20, fontSize: 13, fontWeight: 700,
            background: "#fce4ec", color: "#c62828",
            border: "1.5px solid #f48fb1",
          }}>
            ${fmt(trace.avg)}00k
          </span>
        )}
      </>
    ),
  };
})();
