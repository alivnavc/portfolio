/* ============================================================
   KNN Regression — 9 interactive stages
   Requires: window.ML_KNN, shared primitives on window
   ============================================================ */
(function () {
  const { V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState, useMemo, useRef, useEffect } = React;
  const KNN = window.ML_KNN;

  const fmtN = (n, d = 2) => (+n).toFixed(d);
  const POINT_COLOR = "#2B5BFF";
  const QUERY_COLOR = "#F5A623";
  const NEIGHBOR_COLOR = "#1DAA6B";

  // ── SVG Scatter for 1D regression ──
  function RegScatter({ query, neighbors, showPred, highlightCurve, curveK }) {
    const data = KNN.KNN_REG.data;
    const W = 480, H = 260, PAD_L = 44, PAD_R = 20, PAD_T = 20, PAD_B = 36;

    const minX = 0.5, maxX = 12.5;
    const minY = 0, maxY = 8;
    const sx = x => PAD_L + (x - minX) / (maxX - minX) * (W - PAD_L - PAD_R);
    const sy = y => H - PAD_B - (y - minY) / (maxY - minY) * (H - PAD_T - PAD_B);

    const neighborSet = new Set((neighbors || []).map(n => n.i));
    const predY = neighbors && neighbors.length > 0
      ? neighbors.reduce((s, n) => s + data[n.i][1], 0) / neighbors.length
      : null;

    // build curve for comparison
    const curve = useMemo(() => {
      if (!highlightCurve) return null;
      const ks = curveK || [1, 3, 7];
      return ks.map(k => {
        const c = KNN.knnRegCurve(k, 100);
        return { k, pts: c.xs.map((x, i) => [x, c.ys[i]]) };
      });
    }, [highlightCurve, curveK]);

    const curveColors = ["#E0431E", "#2B5BFF", "#1DAA6B"];

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, height: "auto", border: "1px solid var(--line)", borderRadius: 14, background: "var(--panel-solid)", boxShadow: "var(--shadow)" }}>
        {/* grid lines */}
        {[0, 2, 4, 6, 8].map(v => (
          <g key={v}>
            <line x1={PAD_L} y1={sy(v)} x2={W - PAD_R} y2={sy(v)} stroke="var(--line)" strokeWidth="0.5" />
            <text x={PAD_L - 6} y={sy(v) + 4} textAnchor="end" fontSize="9" fill="var(--faint)">{v}</text>
          </g>
        ))}
        {[2, 4, 6, 8, 10, 12].map(v => (
          <g key={v}>
            <line x1={sx(v)} y1={PAD_T} x2={sx(v)} y2={H - PAD_B} stroke="var(--line)" strokeWidth="0.5" />
            <text x={sx(v)} y={H - PAD_B + 14} textAnchor="middle" fontSize="9" fill="var(--faint)">{v}</text>
          </g>
        ))}

        {/* axis labels */}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="11" fill="var(--muted)" fontWeight="600">x</text>
        <text x={10} y={H / 2} textAnchor="middle" fontSize="11" fill="var(--muted)" fontWeight="600" transform={`rotate(-90,10,${H/2})`}>y</text>

        {/* KNN curves */}
        {curve && curve.map((c, ci) => {
          const pts = c.pts;
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ");
          return (
            <path key={ci} d={d} fill="none" stroke={curveColors[ci]}
              strokeWidth={c.k === (curveK ? curveK[1] : 3) ? 2.5 : 1.5}
              strokeDasharray={c.k === 1 ? "none" : c.k >= 7 ? "5 3" : "none"}
              opacity={0.75}
            />
          );
        })}

        {/* distance lines from query to neighbors */}
        {neighbors && data.map((pt, i) => {
          const isN = neighborSet.has(i);
          if (!isN || !query) return null;
          return (
            <line key={i}
              x1={sx(query)} y1={sy(pt[1])}
              x2={sx(query)} y2={sy(pt[1])}
              stroke={NEIGHBOR_COLOR} strokeWidth={1.5}
            />
          );
        })}

        {/* vertical lines to neighbors */}
        {query !== undefined && neighbors && neighbors.map((n, i) => {
          const pt = data[n.i];
          return (
            <line key={i}
              x1={sx(pt[0])} y1={sy(pt[1])}
              x2={sx(query)} y2={sy(pt[1])}
              stroke={NEIGHBOR_COLOR} strokeWidth="1" strokeDasharray="3 2" opacity="0.6"
            />
          );
        })}

        {/* data points */}
        {data.map(([x, y], i) => {
          const isN = neighborSet.has(i);
          return (
            <g key={i}>
              {isN && (
                <circle cx={sx(x)} cy={sy(y)} r={11} fill="none"
                  stroke={NEIGHBOR_COLOR} strokeWidth="2" opacity="0.5" />
              )}
              <circle cx={sx(x)} cy={sy(y)} r={isN ? 7 : 5}
                fill={isN ? "rgba(29,170,107,0.25)" : "rgba(43,91,255,0.18)"}
                stroke={isN ? NEIGHBOR_COLOR : POINT_COLOR}
                strokeWidth={isN ? 2 : 1.5}
              />
            </g>
          );
        })}

        {/* prediction dashed line */}
        {showPred && predY !== null && (
          <g>
            <line x1={PAD_L} y1={sy(predY)} x2={W - PAD_R} y2={sy(predY)}
              stroke={QUERY_COLOR} strokeWidth="1.5" strokeDasharray="6 3" opacity="0.7" />
            <text x={W - PAD_R + 2} y={sy(predY) + 4} fontSize="10" fill={QUERY_COLOR} fontWeight="700">ŷ={fmtN(predY, 2)}</text>
          </g>
        )}

        {/* query vertical line */}
        {query !== undefined && (
          <g>
            <line x1={sx(query)} y1={PAD_T} x2={sx(query)} y2={H - PAD_B}
              stroke={QUERY_COLOR} strokeWidth="2" strokeDasharray="5 3" opacity="0.8" />
            <text x={sx(query)} y={PAD_T - 5} textAnchor="middle" fontSize="11" fill={QUERY_COLOR} fontWeight="700">★</text>
            <text x={sx(query)} y={H - PAD_B + 26} textAnchor="middle" fontSize="9" fill={QUERY_COLOR}>x={fmtN(query, 1)}</text>
          </g>
        )}
      </svg>
    );
  }

  // ── MSE curve for hyperparameter tuning stage ──
  function MSECurveViz() {
    const ks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const data = KNN.KNN_REG.data;
    const n = data.length;

    // leave-one-out CV to estimate test MSE
    const testMSE = ks.map(k => {
      let mse = 0;
      for (let i = 0; i < n; i++) {
        const train = data.filter((_, j) => j !== i);
        const query = [data[i][0]];
        const dists = train.map((pt, ti) => ({
          dist: Math.abs(query[0] - pt[0]),
          label: pt[1],
        })).sort((a, b) => a.dist - b.dist).slice(0, Math.min(k, train.length));
        const pred = dists.reduce((s, d) => s + d.label, 0) / dists.length;
        mse += (pred - data[i][1]) ** 2;
      }
      return mse / n;
    });

    // train MSE always goes to 0 at k=1
    const trainMSE = ks.map(k => {
      if (k === 1) return 0;
      let mse = 0;
      for (let i = 0; i < n; i++) {
        const query = [data[i][0]];
        const dists = data.map((pt, j) => ({
          dist: j === i ? 0 : Math.abs(query[0] - pt[0]),
          label: pt[1],
          self: j === i,
        })).sort((a, b) => a.dist - b.dist).slice(0, k);
        const pred = dists.reduce((s, d) => s + d.label, 0) / dists.length;
        mse += (pred - data[i][1]) ** 2;
      }
      return mse / n;
    });

    const maxMSE = Math.max(...testMSE, ...trainMSE) * 1.15;
    const W = 420, H = 200, PAD_L = 44, PAD_R = 20, PAD_T = 20, PAD_B = 36;
    const sx = k => PAD_L + ((k - 1) / (ks.length - 1)) * (W - PAD_L - PAD_R);
    const sy = v => H - PAD_B - (v / maxMSE) * (H - PAD_T - PAD_B);

    const pathFor = (arr) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${sx(ks[i]).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
    const optK = testMSE.indexOf(Math.min(...testMSE)) + 1;

    return (
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, height: "auto", border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel-solid)" }}>
          {/* grid */}
          {[0.25, 0.5, 0.75, 1.0].map(f => {
            const v = f * maxMSE;
            return <line key={f} x1={PAD_L} y1={sy(v)} x2={W - PAD_R} y2={sy(v)} stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />;
          })}
          {ks.map((k, i) => (
            <text key={k} x={sx(k)} y={H - PAD_B + 14} textAnchor="middle" fontSize="9" fill="var(--faint)">{k}</text>
          ))}

          {/* optimal k marker */}
          <line x1={sx(optK)} y1={PAD_T} x2={sx(optK)} y2={H - PAD_B} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />
          <text x={sx(optK)} y={PAD_T - 5} textAnchor="middle" fontSize="10" fill="var(--accent-ink)" fontWeight="700">k*={optK}</text>

          {/* train MSE */}
          <path d={pathFor(trainMSE)} fill="none" stroke="#1DAA6B" strokeWidth="2" />
          {trainMSE.map((v, i) => <circle key={i} cx={sx(ks[i])} cy={sy(v)} r={3} fill="#1DAA6B" />)}

          {/* test MSE */}
          <path d={pathFor(testMSE)} fill="none" stroke="#E0431E" strokeWidth="2.5" strokeDasharray="5 3" />
          {testMSE.map((v, i) => <circle key={i} cx={sx(ks[i])} cy={sy(v)} r={3} fill="#E0431E" />)}

          {/* axis labels */}
          <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="11" fill="var(--muted)" fontWeight="600">k</text>
          <text x={10} y={H / 2} textAnchor="middle" fontSize="11" fill="var(--muted)" fontWeight="600" transform={`rotate(-90,10,${H/2})`}>MSE</text>
        </svg>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#1DAA6B" strokeWidth="2" /></svg>
            Train MSE
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#E0431E" strokeWidth="2" strokeDasharray="5 3" /></svg>
            Test MSE (LOO-CV)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--accent-ink)", fontWeight: 700 }}>
            Optimal: k={optK}
          </span>
        </div>
      </div>
    );
  }

  function renderInput(input, setInput) {
    const set = (k, v) => setInput(i => ({ ...i, [k]: v }));
    return (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">x</span>
          <input type="range" min="1" max="12" step="0.1" value={input.x} onChange={e => set("x", parseFloat(e.target.value))} />
          <span className="nn-slider-v">{fmtN(input.x, 1)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">k</span>
          <input type="range" min="1" max="5" step="1" value={input.k} onChange={e => set("k", parseInt(e.target.value))} />
          <span className="nn-slider-v">{input.k}</span>
        </label>
      </>
    );
  }

  const STAGES = [
    // ── Stage 1: Overview ──
    {
      id: "overview", group: "Overview", title: "KNN regression — predict by averaging neighbors", map: "Overview",
      why: "KNN isn't just for classification. For regression, instead of voting for a class, neighbors average their target values to produce a continuous prediction.",
      render: (t) => (
        <>
          <Lead>
            <b>KNN for regression</b> works identically to classification, except the final step:
            instead of a majority vote, we take the <b>average of the neighbors' target values</b>.
            The result is a continuous prediction ŷ.
          </Lead>
          <div className="tf-lifecycle">
            <div className="tf-life tf-life--train" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8, opacity: .7 }}>Training phase</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Store all (x, y) pairs</div>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>Lazy learner — just memorize every training example. No model fitting whatsoever.</div>
            </div>
            <div className="tf-life tf-life--infer" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8, opacity: .7 }}>Prediction phase</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Find k nearest → average</div>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>For query x: find k training points with smallest |x−xᵢ|, then ŷ = (1/k) Σ yᵢ</div>
            </div>
          </div>
          <div className="tf-subhead">Interactive preview</div>
          <RegScatter query={t.query} neighbors={t.neighbors} showPred />
          <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--accent-soft)", borderRadius: 10, fontSize: 13 }}>
            Query at x={fmtN(t.query, 1)} — k={t.neighbors.length} neighbors average to <b style={{ color: "var(--accent-ink)" }}>ŷ = {fmtN(t.pred, 3)}</b>
          </div>
          <Note>The dashed horizontal line shows the prediction ŷ. The dashed vertical line marks the query x. Move the sliders to explore.</Note>
        </>
      ),
    },

    // ── Stage 2: Dataset ──
    {
      id: "dataset", group: "Data", title: "The dataset — 12 noisy 1D points", map: "Dataset",
      why: "For 1D regression, our data is simply (x, y) pairs. The relationship is non-linear — a smooth wave that KNN can approximate without knowing the function.",
      render: (t) => (
        <>
          <Lead>
            We have <b>12 training points</b> with a noisy wave-like pattern.
            The query point x is shown as a vertical dashed line. KNN will predict by
            averaging nearby y values.
          </Lead>
          <RegScatter query={t.query} />
          <div className="tf-subhead">All training points</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
            {KNN.KNN_REG.data.map(([x, y], i) => (
              <div key={i} style={{
                padding: "7px 11px", borderRadius: 8,
                border: "1px solid var(--line)", background: "var(--panel-solid)",
                fontSize: 12, fontFamily: "var(--num-font)",
                minWidth: 80,
              }}>
                <div style={{ color: "var(--faint)", fontSize: 10, marginBottom: 2 }}>P{i}</div>
                <div><span style={{ color: "var(--accent-ink)" }}>x={x}</span> <span style={{ color: "var(--muted)" }}>y={y}</span></div>
              </div>
            ))}
          </div>
          <Note>Unlike classification, the target y is a continuous number. KNN will predict by averaging the y values of the k closest x values.</Note>
        </>
      ),
    },

    // ── Stage 3: Distance in 1D ──
    {
      id: "distance", group: "Algorithm", title: "Distance in 1D — simple absolute difference", map: "Distance",
      why: "In 1D, distance collapses to the absolute difference |x_query − xᵢ|. The concept is identical to the multi-D Euclidean distance.",
      render: (t) => {
        const sorted = t.allDists.slice().sort((a, b) => a.dist - b.dist);
        return (
          <>
            <Lead>
              In one dimension, Euclidean distance simplifies to just the <b>absolute difference</b>:
              d = |x_query − xᵢ|. We compute this for every training point and sort ascending.
            </Lead>
            <Formula label="1D distance">d(q, xᵢ) = |q − xᵢ|</Formula>
            <div className="nn-calc">
              <div className="nn-calc-h">Distances from query x = {fmtN(t.query, 2)}</div>
              {sorted.slice(0, 5).map((d, rank) => {
                const pt = KNN.KNN_REG.data[d.i];
                return (
                  <div key={d.i} className="nn-calc-row">
                    <b>P{d.i}</b> (x={pt[0]}, y={pt[1]}): |{fmtN(t.query, 2)} − {pt[0]}| = <b style={{ color: rank < t.neighbors.length ? "var(--accent-ink)" : "inherit" }}>{fmtN(d.dist, 3)}</b>
                    {rank < t.neighbors.length && <span style={{ marginLeft: 8, color: "#1DAA6B", fontWeight: 700 }}>← neighbor {rank + 1}</span>}
                  </div>
                );
              })}
              {sorted.length > 5 && <div className="nn-calc-row" style={{ color: "var(--faint)" }}>…and {sorted.length - 5} more points</div>}
            </div>
            <div className="tf-subhead">Sorted distances (all points)</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    {["Rank", "P#", "x", "y", "|q−x|"].map(h => (
                      <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((d, rank) => {
                    const pt = KNN.KNN_REG.data[d.i];
                    const isN = rank < t.neighbors.length;
                    return (
                      <tr key={d.i} style={{ background: isN ? "rgba(29,170,107,0.1)" : "transparent", borderBottom: "1px solid var(--line)", fontWeight: isN ? 700 : 400 }}>
                        <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{rank + 1}</td>
                        <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "var(--faint)" }}>P{d.i}</td>
                        <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{pt[0]}</td>
                        <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{pt[1]}</td>
                        <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: isN ? "#1DAA6B" : "var(--muted)" }}>{fmtN(d.dist, 3)}{isN && <span style={{ marginLeft: 6, color: "#1DAA6B" }}>●</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Note>Green highlighted rows are the k nearest neighbors that will be averaged for the prediction.</Note>
          </>
        );
      },
    },

    // ── Stage 4: k Nearest Neighbors ──
    {
      id: "kneighbors", group: "Algorithm", title: "k nearest neighbors — the selected subset", map: "k Neighbors",
      why: "Highlighting exactly which points are included in the average reveals the local smoothing window that KNN creates around the query point.",
      render: (t) => {
        const kthDist = t.neighbors[t.neighbors.length - 1]?.dist;
        return (
          <>
            <Lead>
              For query x = {fmtN(t.query, 1)}, the {t.neighbors.length} nearest neighbors are the
              training points within distance <b>{fmtN(kthDist, 3)}</b> (the k-th nearest distance).
              Their y values will be averaged.
            </Lead>
            <RegScatter query={t.query} neighbors={t.neighbors} showPred />
            <div className="tf-subhead">Selected k={t.neighbors.length} neighbors</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
              {t.neighbors.map((n, i) => {
                const pt = KNN.KNN_REG.data[n.i];
                return (
                  <div key={i} style={{
                    padding: "10px 14px", borderRadius: 10,
                    border: "2px solid #1DAA6B",
                    background: "rgba(29,170,107,0.12)",
                    fontSize: 13, minWidth: 100,
                  }}>
                    <div style={{ fontWeight: 800, color: "#1DAA6B", marginBottom: 4 }}>P{n.i} (rank {i + 1})</div>
                    <div style={{ fontFamily: "var(--num-font)", fontSize: 12 }}>
                      <span style={{ color: "var(--accent-ink)" }}>x={pt[0]}</span>
                      <span style={{ color: "var(--muted)", margin: "0 4px" }}>y=<b>{pt[1]}</b></span>
                    </div>
                    <div style={{ fontFamily: "var(--num-font)", fontSize: 11, color: "var(--faint)", marginTop: 3 }}>dist={fmtN(n.dist, 3)}</div>
                  </div>
                );
              })}
            </div>
            <Note>The dashed horizontal lines connect each neighbor's y-value to the query x position, making clear which y values are being averaged.</Note>
          </>
        );
      },
    },

    // ── Stage 5: Average Prediction ──
    {
      id: "average", group: "Algorithm", title: "Average prediction — ŷ = (1/k) Σ yᵢ", map: "Average",
      why: "The averaging formula is simple but powerful — it implements local smoothing without any explicit function. The predicted curve adapts to local density.",
      render: (t) => {
        const yVals = t.neighbors.map(n => KNN.KNN_REG.data[n.i][1]);
        const sum = yVals.reduce((a, b) => a + b, 0);
        return (
          <>
            <Lead>
              The prediction is simply the <b>arithmetic mean</b> of the selected neighbors' y values.
              No weights, no model — just an average.
            </Lead>
            <Formula label="KNN regression prediction">ŷ = (1/k) · Σᵢ yᵢ</Formula>
            <div className="nn-calc">
              <div className="nn-calc-h">Prediction for x = {fmtN(t.query, 2)}, k = {t.neighbors.length}</div>
              <div className="nn-calc-row">
                Neighbors y-values: [{yVals.map((y, i) => <span key={i} style={{ color: "#1DAA6B", fontWeight: 700 }}>{y}{i < yVals.length - 1 ? ", " : ""}</span>)}]
              </div>
              <div className="nn-calc-row">
                Sum = {yVals.join(" + ")} = <b>{fmtN(sum, 3)}</b>
              </div>
              <div className="nn-calc-row">
                ŷ = {fmtN(sum, 3)} / {t.neighbors.length} = <b style={{ color: QUERY_COLOR, fontSize: 16 }}>{fmtN(t.pred, 4)}</b>
              </div>
            </div>
            <RegScatter query={t.query} neighbors={t.neighbors} showPred />
            <div style={{ margin: "10px 0", padding: "12px 16px", borderRadius: 12, border: `2px solid ${QUERY_COLOR}`, background: `rgba(245,166,35,0.1)`, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Prediction:</span>
              <span style={{ fontFamily: "var(--num-font)", fontSize: 20, fontWeight: 800, color: QUERY_COLOR }}>ŷ = {fmtN(t.pred, 3)}</span>
              <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>at x = {fmtN(t.query, 1)}</span>
            </div>
            <Note>The prediction is a local average — nearby points have equal influence. For more nuanced weighting, see Stage 7: Weighted Average.</Note>
          </>
        );
      },
    },

    // ── Stage 6: Prediction Visualization (full curve) ──
    {
      id: "curve", group: "Concepts", title: "Full KNN curve — step-like local averages", map: "Prediction Curve",
      why: "Plotting the KNN prediction across all x values reveals the step-like regression curve. Larger k → smoother curve (more averaging).",
      render: (t) => (
        <>
          <Lead>
            If we compute ŷ for <b>every possible x</b> from 1 to 12, we get the KNN regression
            <b> curve</b>. It's step-like because the prediction only changes when a new training
            point enters or exits the k-nearest set. Larger k = smoother, more stable curve.
          </Lead>
          <RegScatter query={t.query} neighbors={t.neighbors} showPred highlightCurve curveK={[1, 3, 7]} />
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "10px 0" }}>
            {[["k=1 (jagged)", "#E0431E", "Each training point owns an interval — any noise is exactly reproduced"],
              ["k=3 (balanced)", "#2B5BFF", "Averages 3 neighbors — smooths out local noise while preserving trends"],
              ["k=7 (smooth)", "#1DAA6B", "Very smooth but misses sharp features — over-smoothed in sparse regions"]].map(([label, color, desc]) => (
              <div key={label} style={{ display: "flex", gap: 8, alignItems: "flex-start", flex: 1, minWidth: 180 }}>
                <div style={{ width: 24, height: 3, background: color, borderRadius: 2, marginTop: 8, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color }}>{label}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4, marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <Note>The current query and its neighbors are overlaid. Notice how the step changes coincide with exactly the training x positions.</Note>
        </>
      ),
    },

    // ── Stage 7: Weighted Average ──
    {
      id: "weighted", group: "Concepts", title: "Weighted average — closer neighbors count more", map: "Weighted",
      why: "Distance-weighted averaging gives smoother interpolation. A very close neighbor should dominate; a distant one should barely contribute.",
      render: (t) => {
        const eps = 1e-6;
        const weightsRaw = t.neighbors.map(n => 1 / Math.max(n.dist, eps));
        const totalW = weightsRaw.reduce((a, b) => a + b, 0);
        const weights = weightsRaw.map(w => w / totalW);
        const predWeighted = t.neighbors.reduce((s, n, i) => s + weights[i] * KNN.KNN_REG.data[n.i][1], 0);

        return (
          <>
            <Lead>
              Instead of equal weights 1/k per neighbor, assign each neighbor a weight proportional
              to <b>1/dᵢ</b> (inverse distance). Closer neighbors contribute more to the average.
            </Lead>
            <Formula label="inverse-distance weighted">ŷ = Σ (yᵢ / dᵢ) / Σ (1 / dᵢ)</Formula>
            <div className="nn-calc">
              <div className="nn-calc-h">Weighted prediction for x = {fmtN(t.query, 2)}, k = {t.neighbors.length}</div>
              {t.neighbors.map((n, i) => {
                const pt = KNN.KNN_REG.data[n.i];
                const w = weightsRaw[i];
                const wNorm = weights[i];
                return (
                  <div key={i} className="nn-calc-row">
                    <b>P{n.i}</b> (y={pt[1]}, d={fmtN(n.dist, 3)}) → w=1/{fmtN(n.dist, 3)} = <b style={{ color: "#1DAA6B" }}>{fmtN(w, 3)}</b>
                    <span style={{ color: "var(--faint)", marginLeft: 8 }}>({(wNorm * 100).toFixed(1)}% of total)</span>
                  </div>
                );
              })}
              <div className="nn-calc-row">
                ŷ_weighted = Σ (wᵢ · yᵢ) / Σ wᵢ = <b style={{ color: QUERY_COLOR }}>{fmtN(predWeighted, 4)}</b>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
              <div style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1.5px solid var(--line)", background: "var(--panel-solid)", minWidth: 160 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Uniform average</div>
                <div style={{ fontFamily: "var(--num-font)", fontSize: 20, fontWeight: 800, color: "var(--accent-ink)" }}>{fmtN(t.pred, 3)}</div>
                <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>each neighbor weight = 1/{t.neighbors.length}</div>
              </div>
              <div style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `2px solid ${QUERY_COLOR}`, background: "rgba(245,166,35,0.1)", minWidth: 160 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Weighted average (1/d)</div>
                <div style={{ fontFamily: "var(--num-font)", fontSize: 20, fontWeight: 800, color: QUERY_COLOR }}>{fmtN(predWeighted, 3)}</div>
                <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>weights ∝ inverse distance</div>
              </div>
            </div>
            {Math.abs(predWeighted - t.pred) > 0.01 && (
              <div style={{ padding: "10px 14px", background: "var(--accent-soft)", borderRadius: 10, fontSize: 13 }}>
                <b>Difference:</b> {fmtN(Math.abs(predWeighted - t.pred), 3)} — the nearest neighbor has extra influence in the weighted version.
              </div>
            )}
            <Note>Weighted KNN interpolates more naturally than uniform KNN, especially near training points. When d→0, the query perfectly matches a training point (ŷ = y_nearest).</Note>
          </>
        );
      },
    },

    // ── Stage 8: Hyperparameter Tuning ──
    {
      id: "tuning", group: "Concepts", title: "Choosing k — cross-validation", map: "Tuning k",
      why: "k is the bias-variance dial: small k = low bias, high variance; large k = high bias, low variance. Cross-validation finds the sweet spot.",
      render: (t) => (
        <>
          <Lead>
            To find the best k, we use <b>cross-validation</b>: for each candidate k, estimate how
            well it generalizes using <b>leave-one-out CV</b> (predict each point using all others).
            The k with the lowest test MSE is optimal.
          </Lead>
          <MSECurveViz />
          <div className="tf-subhead">The bias-variance tradeoff</div>
          <div className="nn-calc">
            <div className="nn-calc-h">What changes as k increases</div>
            <div className="nn-calc-row"><b>k=1 (small):</b> Low bias (memorizes training data), high variance (wiggly curve, sensitive to noise)</div>
            <div className="nn-calc-row"><b>k=optimal:</b> Balanced — generalizes well to unseen x values</div>
            <div className="nn-calc-row"><b>k=n (large):</b> High bias (always predicts the overall mean), zero variance</div>
          </div>
          <div className="tf-subhead">Cross-validation procedure</div>
          <div className="tf-legend">
            {[
              ["Step 1: Split", "Divide data into train/val folds (or use LOO-CV for small datasets)"],
              ["Step 2: Grid search", "Try k = 1, 2, 3, …, √n (or up to n/2)"],
              ["Step 3: Evaluate", "Compute MSE on validation set for each k"],
              ["Step 4: Select", "Pick k with minimum validation MSE (the 'elbow')"],
            ].map(([name, desc]) => (
              <div className="tf-leg" key={name}>
                <div className="tf-leg-name">{name}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>
          <Note>For this 12-point dataset, the LOO-CV curve shows the optimal k. Notice how training MSE monotonically increases (more smoothing = worse fit to training data) while test MSE has a U-shape.</Note>
        </>
      ),
    },

    // ── Stage 9: Comparison & When to Use ──
    {
      id: "comparison", group: "Summary", title: "KNN vs alternatives — when to use each", map: "Comparison",
      why: "Understanding KNN's position relative to Linear Regression and Decision Trees helps you make informed model selection decisions.",
      render: (t) => (
        <>
          <Lead>
            KNN regression is powerful for non-linear, locally varying functions but expensive at
            prediction time. Here's how it compares to two common alternatives.
          </Lead>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">✓ Pros</div>
              <ul>
                <li>No assumptions about function form</li>
                <li>Works for any continuous target</li>
                <li>Easily adapts to new training points</li>
                <li>Captures local non-linear patterns</li>
                <li>Intuitive and interpretable</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">✗ Cons</div>
              <ul>
                <li>O(n) prediction time</li>
                <li>Must store all training data</li>
                <li>Poor extrapolation beyond training range</li>
                <li>Suffers in high dimensions</li>
                <li>Sensitive to irrelevant features</li>
              </ul>
            </div>
          </div>
          <div className="tf-subhead">Comparison table</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)", background: "var(--accent-soft)" }}>
                  {["Property", "KNN Regression", "Linear Regression", "Decision Tree Regressor"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "var(--ink)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Function shape", "Any (step-like)", "Only linear", "Piecewise constant"],
                  ["Training cost", "O(1)", "O(n·d)", "O(n·d·log n)"],
                  ["Prediction cost", "O(n·d)", "O(d)", "O(log n)"],
                  ["Extrapolation", "Poor (flat)", "Good (extends line)", "Poor (flat)"],
                  ["Interpretable", "Locally", "Yes (coefficients)", "Yes (rules)"],
                  ["Hyperparameters", "k, distance metric", "Regularization λ", "Depth, min_samples"],
                  ["Outlier robust", "Moderate", "Low", "High"],
                ].map(([prop, ...vals]) => (
                  <tr key={prop} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "7px 12px", fontWeight: 700, color: "var(--ink)" }}>{prop}</td>
                    {vals.map((v, i) => (
                      <td key={i} style={{ padding: "7px 12px", fontFamily: "var(--num-font)", fontSize: 12, color: i === 0 ? "var(--accent-ink)" : "var(--muted)" }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="tf-subhead">When to reach for KNN regression</div>
          <div className="tf-legend">
            {[
              ["Non-linear data", "When the true function is curved and you can't guess its form"],
              ["Small dataset", "Fewer than a few thousand points — KNN's O(n) cost is acceptable"],
              ["Low dimensions", "Features d < 20 — distance remains meaningful"],
              ["Prototype/baseline", "Fast to implement, no tuning needed beyond k"],
            ].map(([name, desc]) => (
              <div className="tf-leg" key={name}>
                <div className="tf-leg-name">{name}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>
          <Note>For production systems with millions of points, use approximate nearest neighbor libraries (FAISS, Annoy, ScaNN) that trade small accuracy loss for O(log n) or even O(1) query time.</Note>
        </>
      ),
    },
  ];

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "K-Nearest Neighbors",
    subtitle: "Regression — average the neighbors",
    cur: "KNN · Regression",
    category: "ML Algorithms",
    default: KNN.KNN_REG.default,
    run: KNN.runKNNReg,
    renderInput,
    modeLinks: [
      { label: "Classification", href: "KNN (Classification).html", active: false },
      { label: "Regression", href: "KNN (Regression).html", active: true },
    ],
  };
})();
