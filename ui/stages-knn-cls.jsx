/* ============================================================
   KNN Classification — 10 interactive stages
   Requires: window.ML_KNN, shared primitives on window
   ============================================================ */
(function () {
  const { V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState, useMemo, useRef, useEffect } = React;
  const KNN = window.ML_KNN;

  // ── colour palette for 3 classes ──
  const CLS_COLOR = ["#2B5BFF", "#E0431E", "#1DAA6B"];
  const CLS_STROKE = ["#1742CC", "#B83415", "#157A4E"];
  const CLS_LIGHT = ["rgba(43,91,255,0.18)", "rgba(224,67,30,0.18)", "rgba(29,170,107,0.18)"];
  const CLS_LABEL = ["Class A", "Class B", "Class C"];

  // ── tiny helpers ──
  const fmtN = (n, d = 2) => (+n).toFixed(d);

  // ── Scatter SVG: 10×10 grid, normalized coords ──
  function ScatterPlot({ data, query, neighbors, kRadius, showDistLines, animKey }) {
    const W = 340, H = 300, PAD = 30;
    const sx = x => PAD + (x / 10) * (W - 2 * PAD);
    const sy = y => H - PAD - (y / 10) * (H - 2 * PAD);

    const neighborSet = new Set((neighbors || []).map(n => n.i));

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, height: "auto", border: "1px solid var(--line)", borderRadius: 14, background: "var(--panel-solid)", boxShadow: "var(--shadow)" }}>
        {/* grid */}
        {[0,2,4,6,8,10].map(v => (
          <g key={v}>
            <line x1={sx(v)} y1={PAD} x2={sx(v)} y2={H-PAD} stroke="var(--line)" strokeWidth="0.5" />
            <line x1={PAD} y1={sy(v)} x2={W-PAD} y2={sy(v)} stroke="var(--line)" strokeWidth="0.5" />
            <text x={sx(v)} y={H-PAD+14} textAnchor="middle" fontSize="9" fill="var(--faint)">{v}</text>
            <text x={PAD-8} y={sy(v)+4} textAnchor="end" fontSize="9" fill="var(--faint)">{v}</text>
          </g>
        ))}
        {/* axis labels */}
        <text x={W/2} y={H-2} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600">x₁</text>
        <text x={8} y={H/2} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600" transform={`rotate(-90,8,${H/2})`}>x₂</text>

        {/* kRadius circle */}
        {kRadius !== undefined && query && (
          <circle
            cx={sx(query[0])} cy={sy(query[1])}
            r={Math.abs(sx(kRadius) - sx(0))}
            fill="none" stroke="var(--accent)" strokeWidth="1.5"
            strokeDasharray="5 3" opacity="0.7"
          />
        )}

        {/* distance lines from query to all points */}
        {showDistLines && query && data.map((pt, i) => {
          const isNeighbor = neighborSet.has(i);
          return (
            <line key={i}
              x1={sx(query[0])} y1={sy(query[1])}
              x2={sx(pt[0])} y2={sy(pt[1])}
              stroke={isNeighbor ? CLS_COLOR[pt[2]] : "var(--faint)"}
              strokeWidth={isNeighbor ? 2 : 0.8}
              opacity={isNeighbor ? 0.8 : 0.35}
              strokeDasharray={isNeighbor ? "none" : "3 3"}
            />
          );
        })}

        {/* data points */}
        {data.map((pt, i) => {
          const isNeighbor = neighborSet.has(i);
          return (
            <g key={i}>
              {isNeighbor && (
                <circle cx={sx(pt[0])} cy={sy(pt[1])} r={12} fill="none"
                  stroke={CLS_COLOR[pt[2]]} strokeWidth="2" opacity="0.5" />
              )}
              <circle cx={sx(pt[0])} cy={sy(pt[1])} r={isNeighbor ? 7 : 5.5}
                fill={CLS_LIGHT[pt[2]]} stroke={CLS_STROKE[pt[2]]} strokeWidth={isNeighbor ? 2 : 1.5} />
            </g>
          );
        })}

        {/* query point (star) */}
        {query && (
          <g>
            <circle cx={sx(query[0])} cy={sy(query[1])} r={14} fill="rgba(255,200,0,0.12)" />
            <text x={sx(query[0])} y={sy(query[1])+5} textAnchor="middle" fontSize="16" fill="#F5A623" fontWeight="bold">★</text>
          </g>
        )}
      </svg>
    );
  }

  // ── Legend chip ──
  function ClassLegend() {
    return (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "8px 0" }}>
        {CLS_LABEL.map((l, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
            <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill={CLS_LIGHT[i]} stroke={CLS_STROKE[i]} strokeWidth="1.5" /></svg>
            {l}
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
          <span style={{ fontSize: 14, color: "#F5A623" }}>★</span> Query
        </span>
      </div>
    );
  }

  // ── Distance table ──
  function DistTable({ allDists, k, data }) {
    const sorted = allDists.slice().sort((a, b) => a.dist - b.dist);
    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--line)" }}>
              {["Rank", "Point", "Class", "x₁", "x₂", "Distance"].map(h => (
                <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, rank) => {
              const pt = data[d.i];
              const isN = rank < k;
              return (
                <tr key={d.i} style={{
                  background: isN ? CLS_LIGHT[pt[2]] : "transparent",
                  borderBottom: "1px solid var(--line)",
                  fontWeight: isN ? 700 : 400,
                }}>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{rank + 1}{isN && <span style={{ color: CLS_COLOR[pt[2]], marginLeft: 4 }}>●</span>}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: "var(--muted)" }}>P{d.i}</td>
                  <td style={{ padding: "5px 10px" }}><span style={{ color: CLS_COLOR[pt[2]], fontWeight: 800 }}>{CLS_LABEL[pt[2]]}</span></td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{fmtN(pt[0])}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>{fmtN(pt[1])}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", color: isN ? "var(--accent-ink)" : "var(--muted)" }}>{fmtN(d.dist, 3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Vote display ──
  function VoteBar({ votes, k, label }) {
    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0" }}>
        {CLS_LABEL.map((cls, i) => {
          const count = votes[i] || 0;
          const pct = k > 0 ? count / k : 0;
          const isWinner = parseInt(label) === i;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 60, fontSize: 12, fontWeight: 700, color: CLS_COLOR[i] }}>{cls}</span>
              <div style={{ flex: 1, height: 26, background: "var(--line-soft)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                <div style={{
                  height: "100%", width: `${pct * 100}%`, background: CLS_COLOR[i],
                  borderRadius: 6, transition: "width .4s ease",
                  opacity: isWinner ? 1 : 0.5,
                }} />
                {isWinner && (
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, fontWeight: 800, color: "white" }}>WINNER</span>
                )}
              </div>
              <span style={{ width: 24, textAlign: "center", fontFamily: "var(--num-font)", fontWeight: 800, color: count > 0 ? CLS_COLOR[i] : "var(--faint)" }}>{count}</span>
            </div>
          );
        })}
        <div style={{ marginTop: 8, padding: "10px 14px", background: CLS_LIGHT[parseInt(label)], border: `2px solid ${CLS_COLOR[parseInt(label)]}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Prediction:</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: CLS_COLOR[parseInt(label)] }}>{CLS_LABEL[parseInt(label)]}</span>
          <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>by {votes[label] || 0}/{k} votes</span>
        </div>
      </div>
    );
  }

  // ── Decision region mini-plots for k comparison ──
  function KComparisonGrid() {
    const ks = [1, 5, 15];
    const labels = ["k = 1 (overfit)", "k = 5 (balanced)", "k = 15 (underfit)"];
    const data = KNN.KNN_CLS.data;
    const W = 180, H = 160, PAD = 18, STEP = 4;

    return (
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {ks.map((k, ki) => {
          // build decision region pixels
          const regions = [];
          for (let px = 0; px <= (W - 2 * PAD); px += STEP) {
            for (let py = 0; py <= (H - 2 * PAD); py += STEP) {
              const qx = px / (W - 2 * PAD) * 10;
              const qy = (1 - py / (H - 2 * PAD)) * 10;
              const dists = data.map((pt, i) => ({ i, d: Math.sqrt((qx - pt[0])**2 + (qy - pt[1])**2), c: pt[2] })).sort((a, b) => a.d - b.d);
              const votes = {};
              dists.slice(0, k).forEach(n => { votes[n.c] = (votes[n.c] || 0) + 1; });
              const cls = parseInt(Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b));
              regions.push({ x: PAD + px, y: PAD + py, cls });
            }
          }
          const sx = x => PAD + (x / 10) * (W - 2 * PAD);
          const sy = y => H - PAD - (y / 10) * (H - 2 * PAD);

          return (
            <div key={k} style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4, textAlign: "center" }}>{labels[ki]}</div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", border: "1px solid var(--line)", borderRadius: 10, background: "var(--panel-solid)" }}>
                {regions.map((r, ri) => (
                  <rect key={ri} x={r.x - STEP/2} y={r.y - STEP/2} width={STEP} height={STEP} fill={CLS_LIGHT[r.cls]} />
                ))}
                {data.map((pt, i) => (
                  <circle key={i} cx={sx(pt[0])} cy={sy(pt[1])} r={4} fill={CLS_COLOR[pt[2]]} stroke={CLS_STROKE[pt[2]]} strokeWidth="1" />
                ))}
              </svg>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Distorted feature space for feature scaling stage ──
  function DistortedSpaceViz() {
    const data = KNN.KNN_CLS.data.map(([x1, x2, c]) => ({
      xNorm: x1, yNorm: x2,
      xDistort: x1 * 0.1,
      yDistort: x2 * 100,
      c
    }));
    const query = { xN: 4, yN: 6, xD: 0.4, yD: 600 };
    const W = 300, H = 220, PAD = 28;

    const sxN = x => PAD + (x / 10) * (W - 2*PAD);
    const syN = y => H - PAD - (y / 10) * (H - 2*PAD);

    const minXd = 0, maxXd = 1.2;
    const minYd = 0, maxYd = 1000;
    const sxD = x => PAD + ((x - minXd) / (maxXd - minXd)) * (W - 2*PAD);
    const syD = y => H - PAD - ((y - minYd) / (maxYd - minYd)) * (H - 2*PAD);

    return (
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1DAA6B", marginBottom: 4, textAlign: "center" }}>Normalized (fair)</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", border: "1px solid var(--line)", borderRadius: 10, background: "var(--panel-solid)" }}>
            {data.map((pt, i) => (
              <circle key={i} cx={sxN(pt.xNorm)} cy={syN(pt.yNorm)} r={5} fill={CLS_LIGHT[pt.c]} stroke={CLS_STROKE[pt.c]} strokeWidth="1.5" />
            ))}
            <text x={sxN(query.xN)} y={syN(query.yN)+5} textAnchor="middle" fontSize="14" fill="#F5A623">★</text>
            <text x={W/2} y={H-4} textAnchor="middle" fontSize="9" fill="var(--faint)">x₁ (0-10)</text>
            <text x={8} y={H/2} textAnchor="middle" fontSize="9" fill="var(--faint)" transform={`rotate(-90,8,${H/2})`}>x₂ (0-10)</text>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#E0431E", marginBottom: 4, textAlign: "center" }}>Unnormalized (x₂ dominates)</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", border: "1px solid var(--line)", borderRadius: 10, background: "var(--panel-solid)" }}>
            {data.map((pt, i) => (
              <circle key={i} cx={sxD(pt.xDistort)} cy={syD(pt.yDistort)} r={5} fill={CLS_LIGHT[pt.c]} stroke={CLS_STROKE[pt.c]} strokeWidth="1.5" />
            ))}
            <text x={sxD(query.xD)} y={syD(query.yD)+5} textAnchor="middle" fontSize="14" fill="#F5A623">★</text>
            <text x={W/2} y={H-4} textAnchor="middle" fontSize="9" fill="var(--faint)">x₁ (0-1)</text>
            <text x={8} y={H/2} textAnchor="middle" fontSize="9" fill="var(--faint)" transform={`rotate(-90,8,${H/2})`}>x₂ (0-1000)</text>
          </svg>
        </div>
      </div>
    );
  }

  // ── Curse of dimensionality bar chart ──
  function DimensionalityChart() {
    const dims = [1, 2, 3, 5, 10, 20, 50, 100];
    // approximate expected distance (unit hypercube) grows with sqrt(d/3) roughly
    const avgDist = d => Math.sqrt(d / 3);
    const maxD = avgDist(100);

    const W = 380, H = 200, PAD = 38, BAR_W = 30;
    const sy = v => H - PAD - (v / (maxD * 1.1)) * (H - 2 * PAD);
    const sx = i => PAD + 10 + i * ((W - 2 * PAD) / dims.length);

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, height: "auto", border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel-solid)" }}>
        {[0.25, 0.5, 0.75, 1.0].map(f => {
          const v = f * maxD * 1.1;
          return <line key={f} x1={PAD} y1={sy(v)} x2={W - PAD + 10} y2={sy(v)} stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />;
        })}
        {dims.map((d, i) => {
          const h = avgDist(d);
          const col = `hsl(${220 - i * 12}, 80%, ${60 - i * 4}%)`;
          return (
            <g key={d}>
              <rect x={sx(i)} y={sy(h)} width={BAR_W} height={H - PAD - sy(h)} rx={4} fill={col} opacity="0.8" />
              <text x={sx(i) + BAR_W/2} y={H - PAD + 12} textAnchor="middle" fontSize="9" fill="var(--faint)">{d}D</text>
              <text x={sx(i) + BAR_W/2} y={sy(h) - 4} textAnchor="middle" fontSize="8" fill="var(--muted)">{fmtN(h, 1)}</text>
            </g>
          );
        })}
        <text x={W/2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600">Dimensions</text>
        <text x={10} y={H/2} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600" transform={`rotate(-90,10,${H/2})`}>Avg dist</text>
        <text x={W/2} y={PAD - 8} textAnchor="middle" fontSize="11" fill="var(--accent-ink)" fontWeight="700">Avg distance between random points grows with √D</text>
      </svg>
    );
  }

  function renderInput(input, setInput) {
    const set = (k, v) => setInput(i => ({ ...i, [k]: v }));
    return (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">x₁</span>
          <input type="range" min="0" max="10" step="0.1" value={input.x1} onChange={e => set("x1", parseFloat(e.target.value))} />
          <span className="nn-slider-v">{fmtN(input.x1, 1)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">x₂</span>
          <input type="range" min="0" max="10" step="0.1" value={input.x2} onChange={e => set("x2", parseFloat(e.target.value))} />
          <span className="nn-slider-v">{fmtN(input.x2, 1)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">k</span>
          <input type="range" min="1" max="7" step="1" value={input.k} onChange={e => set("k", parseInt(e.target.value))} />
          <span className="nn-slider-v">{input.k}</span>
        </label>
      </>
    );
  }

  // ── STAGES ──
  const STAGES = [
    // ── Stage 1: Overview ──
    {
      id: "overview", group: "Overview", title: "KNN intuition — you are who your neighbors are", map: "Overview",
      why: "Before the math, understand the elegant core idea: no training needed — just remember all the data, and at prediction time, look at who's nearby.",
      render: (t) => (
        <>
          <Lead>
            <b>K-Nearest Neighbors</b> is the simplest possible classifier: to classify a new point,
            find its <b>k closest training examples</b> and let them vote. The class with the most
            votes wins. No model fitting, no parameters — just distances and votes.
          </Lead>
          <div className="tf-lifecycle">
            <div className="tf-life tf-life--train" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8, opacity: .7 }}>Training phase</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Store all data</div>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>KNN is a <b>lazy learner</b> — nothing is computed at training time. Every labeled point is simply memorized.</div>
              <div style={{ marginTop: 10, fontFamily: "var(--num-font)", fontSize: 11, color: "var(--faint)" }}>O(1) training · O(n·d) per query</div>
            </div>
            <div className="tf-life tf-life--infer" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8, opacity: .7 }}>Prediction phase</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Find k nearest → vote</div>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>For each new point: compute distances to all training points, pick k closest, take the majority class label.</div>
              <div style={{ marginTop: 10, fontFamily: "var(--num-font)", fontSize: 11, color: "var(--faint)" }}>O(n) distance calcs · vote O(k)</div>
            </div>
          </div>
          <div className="tf-subhead">Interactive overview</div>
          <Lead>The query point ★ sits among 15 training examples in 3 classes. Move the x₁, x₂ sliders in the header to relocate it — watch the neighbors change.</Lead>
          <ScatterPlot
            data={KNN.KNN_CLS.data}
            query={t.query}
            neighbors={t.neighbors}
          />
          <ClassLegend />
          <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--accent-soft)", borderRadius: 10, fontSize: 13 }}>
            Query at ({fmtN(t.query[0], 1)}, {fmtN(t.query[1], 1)}) — k={t.neighbors.length} nearest neighbors vote for <b style={{ color: CLS_COLOR[t.label] }}>{CLS_LABEL[t.label]}</b>
          </div>
          <Note>Adjust k and the query position in the top bar — the prediction updates live across all stages.</Note>
        </>
      ),
    },

    // ── Stage 2: Dataset ──
    {
      id: "dataset", group: "Data", title: "The dataset — 15 labeled 2D points", map: "Dataset",
      why: "KNN's entire 'model' is this dataset. Understanding its structure tells you exactly where boundaries will form.",
      render: (t) => (
        <>
          <Lead>
            We have <b>15 labeled points</b> in 2D feature space, split into 3 classes.
            Each class occupies a rough region: A (top-left), B (top-right), C (bottom-center).
            But the regions aren't perfectly separated — that's where k matters.
          </Lead>
          <ScatterPlot data={KNN.KNN_CLS.data} query={t.query} />
          <ClassLegend />
          <div className="tf-subhead">All training points</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["#", "x₁", "x₂", "Class"].map(h => (
                    <th key={h} style={{ padding: "6px 12px", textAlign: "left", fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {KNN.KNN_CLS.data.map(([x1, x2, c], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line)", background: i % 2 === 0 ? "transparent" : "var(--line-soft)" }}>
                    <td style={{ padding: "5px 12px", fontFamily: "var(--num-font)", color: "var(--faint)" }}>P{i}</td>
                    <td style={{ padding: "5px 12px", fontFamily: "var(--num-font)" }}>{x1.toFixed(1)}</td>
                    <td style={{ padding: "5px 12px", fontFamily: "var(--num-font)" }}>{x2.toFixed(1)}</td>
                    <td style={{ padding: "5px 12px" }}><span style={{ color: CLS_COLOR[c], fontWeight: 700 }}>{CLS_LABEL[c]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>The query point ★ at ({fmtN(t.query[0], 1)}, {fmtN(t.query[1], 1)}) is shown on the scatter plot. Move the sliders to reposition it.</Note>
        </>
      ),
    },

    // ── Stage 3: Distance Metric ──
    {
      id: "distance", group: "Algorithm", title: "Euclidean distance — measuring closeness", map: "Distance",
      why: "Distance is the heart of KNN. The choice of metric determines which points are considered 'near' — and therefore which neighbors vote.",
      render: (t) => (
        <>
          <Lead>
            KNN computes the <b>Euclidean distance</b> from the query point to every training point.
            Smaller distance = closer neighbor = more influence on the vote.
          </Lead>
          <Formula label="Euclidean distance">
            d(q, p) = √( (q₁−p₁)² + (q₂−p₂)² )
          </Formula>
          <div className="nn-calc">
            <div className="nn-calc-h">Distance from query ({fmtN(t.query[0], 1)}, {fmtN(t.query[1], 1)}) to nearest neighbor</div>
            <div className="nn-calc-row">
              P{t.neighbors[0].i}: √( ({fmtN(t.query[0], 1)} − {fmtN(KNN.KNN_CLS.data[t.neighbors[0].i][0], 1)})² + ({fmtN(t.query[1], 1)} − {fmtN(KNN.KNN_CLS.data[t.neighbors[0].i][1], 1)})² )
            </div>
            <div className="nn-calc-row">= √( {fmtN((t.query[0] - KNN.KNN_CLS.data[t.neighbors[0].i][0])**2, 3)} + {fmtN((t.query[1] - KNN.KNN_CLS.data[t.neighbors[0].i][1])**2, 3)} )</div>
            <div className="nn-calc-row"><b>= {fmtN(t.neighbors[0].dist, 4)}</b></div>
          </div>
          <div className="tf-subhead">All distances (sorted ascending)</div>
          <ScatterPlot data={KNN.KNN_CLS.data} query={t.query} neighbors={t.neighbors} showDistLines />
          <ClassLegend />
          <DistTable allDists={t.allDists} k={t.neighbors.length} data={KNN.KNN_CLS.data} />
          <Note>Lines on the scatter plot: <b>solid colored</b> = the k nearest neighbors, <b>dashed gray</b> = farther points. Thicker = closer.</Note>
        </>
      ),
    },

    // ── Stage 4: Finding k Neighbors (interactive) ──
    {
      id: "kneighbors", group: "Algorithm", title: "Finding k neighbors — the search radius", map: "k Neighbors",
      why: "Visualizing the 'k-ball' around the query makes the algorithm intuitive: every point inside the dashed circle is a neighbor.",
      render: (t, ctx) => {
        const kthDist = t.neighbors[t.neighbors.length - 1]?.dist;
        return (
          <>
            <Lead>
              The dashed circle has radius equal to the <b>k-th nearest distance</b> ({fmtN(kthDist, 3)}).
              Every training point inside this circle is a neighbor and gets a vote.
              Adjust k in the top bar to grow or shrink the search radius.
            </Lead>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 12px" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Current k:</span>
              <span style={{ fontFamily: "var(--num-font)", fontSize: 20, fontWeight: 800, color: "var(--accent-ink)" }}>{t.neighbors.length}</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Search radius:</span>
              <span style={{ fontFamily: "var(--num-font)", fontSize: 16, fontWeight: 700, color: "var(--accent-ink)" }}>{fmtN(kthDist, 3)}</span>
            </div>
            <ScatterPlot
              data={KNN.KNN_CLS.data}
              query={t.query}
              neighbors={t.neighbors}
              kRadius={kthDist}
            />
            <ClassLegend />
            <div className="tf-subhead">Selected k={t.neighbors.length} neighbors</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {t.neighbors.map((n, i) => {
                const pt = KNN.KNN_CLS.data[n.i];
                return (
                  <div key={i} style={{
                    padding: "8px 12px", borderRadius: 10,
                    border: `2px solid ${CLS_COLOR[pt[2]]}`,
                    background: CLS_LIGHT[pt[2]],
                    fontSize: 13,
                  }}>
                    <span style={{ fontWeight: 800, color: CLS_COLOR[pt[2]] }}>P{n.i}</span>
                    <span style={{ color: "var(--muted)", margin: "0 4px" }}>{CLS_LABEL[pt[2]]}</span>
                    <span style={{ fontFamily: "var(--num-font)", fontSize: 12, color: "var(--faint)" }}>d={fmtN(n.dist, 3)}</span>
                  </div>
                );
              })}
            </div>
            <Note>Use the k slider in the header. Notice: k=1 → the single nearest wins outright. Larger k → more stable but coarser boundaries.</Note>
          </>
        );
      },
    },

    // ── Stage 5: Majority Vote ──
    {
      id: "vote", group: "Algorithm", title: "Majority vote — deciding the class", map: "Vote",
      why: "The vote is where KNN makes its final decision. Understanding vote counts reveals why certain k values are safer (odd k avoids ties in binary classification).",
      render: (t) => {
        const tied = Object.values(t.votes).filter(v => v === Math.max(...Object.values(t.votes))).length > 1;
        return (
          <>
            <Lead>
              Each of the <b>k={t.neighbors.length} selected neighbors</b> casts one vote for its class.
              The class with the <b>most votes wins</b>. In case of a tie, a fallback strategy is needed
              (e.g., pick the nearest-neighbor class or reduce k by 1).
            </Lead>
            <div className="nn-calc">
              <div className="nn-calc-h">Vote tally — k={t.neighbors.length} neighbors</div>
              {t.neighbors.map((n, i) => {
                const pt = KNN.KNN_CLS.data[n.i];
                return (
                  <div key={i} className="nn-calc-row">
                    <span style={{ color: CLS_COLOR[pt[2]], fontWeight: 700 }}>P{n.i} ({CLS_LABEL[pt[2]]})</span>
                    <span style={{ color: "var(--muted)", margin: "0 6px" }}>votes for</span>
                    <span style={{ color: CLS_COLOR[pt[2]], fontWeight: 800 }}>{CLS_LABEL[pt[2]]}</span>
                    <span style={{ float: "right", fontFamily: "var(--num-font)", color: "var(--faint)", fontSize: 12 }}>dist={fmtN(n.dist, 3)}</span>
                  </div>
                );
              })}
            </div>
            <div className="tf-subhead">Vote distribution</div>
            <VoteBar votes={t.votes} k={t.neighbors.length} label={t.label} />
            {tied && (
              <div style={{ padding: "10px 14px", background: "rgba(240,160,0,.12)", border: "1.5px solid rgba(240,160,0,.5)", borderRadius: 10, fontSize: 13, color: "var(--ink)", marginTop: 8 }}>
                <b>Tie detected!</b> When votes are equal, common strategies: pick the class of the single nearest neighbor, or use weighted voting (by 1/distance).
              </div>
            )}
            <Note>Try k=2 or k=4 with equal votes split between two classes — you'll see a tie. Odd k avoids ties in binary classification.</Note>
          </>
        );
      },
    },

    // ── Stage 6: Effect of k ──
    {
      id: "keffect", group: "Concepts", title: "Effect of k — underfitting vs overfitting", map: "k Effect",
      why: "k is the single most important hyperparameter in KNN. Too small → memorizes noise (overfit), too large → ignores local structure (underfit).",
      render: (t) => (
        <>
          <Lead>
            Changing k changes the <b>decision boundaries</b>. The background color in each plot shows
            what class KNN would predict at each point in space.
          </Lead>
          <KComparisonGrid />
          <div className="tf-subhead">Understanding the tradeoff</div>
          <div className="tf-legend">
            {[
              ["k = 1", "Overfit", "Each training point owns its own region. Any noise/outlier creates an island. High variance, low bias."],
              ["k = 5", "Sweet spot", "Smooth, stable boundaries. Ignores individual outliers but still captures local class structure. Balanced."],
              ["k = 15", "Underfit", "With only 15 total points, k=15 uses ALL points — the majority class wins everywhere. High bias, low variance."],
            ].map(([k, verdict, desc]) => (
              <div className="tf-leg" key={k}>
                <div className="tf-leg-top"><span className="tf-sym">{k}</span><span className="tf-leg-shape">{verdict}</span></div>
                <div className="tf-leg-name">{verdict}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>
          <Note>In practice, find optimal k via cross-validation — try k=1,3,5,...,√n and pick the k with lowest validation error.</Note>
        </>
      ),
    },

    // ── Stage 7: Distance-Weighted KNN ──
    {
      id: "weighted", group: "Concepts", title: "Distance-weighted KNN — closer = louder vote", map: "Weighted",
      why: "Uniform voting gives a faraway neighbor the same influence as a very close one. Weighting by 1/d² makes closer points more influential and often improves accuracy.",
      render: (t) => {
        const eps = 1e-6;
        const weightedVotes = {};
        t.neighbors.forEach(n => {
          const w = 1 / Math.max(n.dist * n.dist, eps);
          const c = KNN.KNN_CLS.data[n.i][2];
          weightedVotes[c] = (weightedVotes[c] || 0) + w;
        });
        const totalW = Object.values(weightedVotes).reduce((a, b) => a + b, 0);
        const wLabel = parseInt(Object.keys(weightedVotes).reduce((a, b) => weightedVotes[a] > weightedVotes[b] ? a : b));

        return (
          <>
            <Lead>
              Instead of each neighbor getting <b>1 vote</b>, weight by <b>1/d²</b>:
              closer neighbors count more. This resolves many tie cases and gives smoother, better-calibrated predictions.
            </Lead>
            <Formula label="weighted vote">weight_i = 1 / d_i²</Formula>
            <Formula label="predict">class = argmax_c Σ weight_i · [neighbor_i = c]</Formula>
            <div className="nn-calc">
              <div className="nn-calc-h">Weighted tally — k={t.neighbors.length} neighbors</div>
              {t.neighbors.map((n, i) => {
                const pt = KNN.KNN_CLS.data[n.i];
                const w = 1 / Math.max(n.dist * n.dist, eps);
                const pct = (w / totalW * 100).toFixed(1);
                return (
                  <div key={i} className="nn-calc-row">
                    <span style={{ color: CLS_COLOR[pt[2]], fontWeight: 700 }}>P{n.i}</span>
                    <span style={{ color: "var(--muted)", margin: "0 6px" }}>d={fmtN(n.dist, 3)} → w=1/{fmtN(n.dist*n.dist, 3)} = <b style={{ color: CLS_COLOR[pt[2]] }}>{fmtN(w, 3)}</b></span>
                    <span style={{ float: "right", fontFamily: "var(--num-font)", fontSize: 12, color: "var(--faint)" }}>{pct}% of total weight</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "10px 0" }}>
              <div style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1.5px solid var(--line)", background: "var(--panel-solid)", minWidth: 180 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Uniform vote</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: CLS_COLOR[t.label] }}>{CLS_LABEL[t.label]}</div>
                <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4 }}>votes: {JSON.stringify(Object.fromEntries(Object.entries(t.votes).map(([k,v])=>[CLS_LABEL[k],v])))}</div>
              </div>
              <div style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `2px solid ${CLS_COLOR[wLabel]}`, background: CLS_LIGHT[wLabel], minWidth: 180 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Weighted vote (1/d²)</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: CLS_COLOR[wLabel] }}>{CLS_LABEL[wLabel]}</div>
                <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4 }}>
                  {CLS_LABEL.map((cl, i) => weightedVotes[i] ? `${cl}: ${fmtN(weightedVotes[i], 3)}` : null).filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>
            {wLabel !== t.label && (
              <div style={{ padding: "10px 14px", background: "rgba(240,160,0,.12)", border: "1.5px solid rgba(240,160,0,.5)", borderRadius: 10, fontSize: 13 }}>
                <b>Different result!</b> Weighting by distance changed the prediction from {CLS_LABEL[t.label]} to {CLS_LABEL[wLabel]}.
              </div>
            )}
            <Note>Weighted KNN is especially useful when k is large or when boundary points have very unequal distances.</Note>
          </>
        );
      },
    },

    // ── Stage 8: Feature Scaling ──
    {
      id: "scaling", group: "Concepts", title: "Feature scaling — why it matters critically", map: "Scaling",
      why: "KNN is entirely distance-based. If one feature has a much larger range, it will dominate the distance calculation and make other features irrelevant.",
      render: (t) => (
        <>
          <Lead>
            Euclidean distance treats all dimensions equally. If <b>x₂ ranges 0–1000</b> while
            <b> x₁ ranges 0–1</b>, a 1-unit change in x₂ is 1000× more impactful on distance than
            a 1-unit change in x₁. x₁ becomes <b>invisible</b> to KNN.
          </Lead>
          <div className="tf-subhead">Visual comparison — same data, different scales</div>
          <DistortedSpaceViz />
          <div className="tf-subhead">The fix: standardize (z-score normalization)</div>
          <Formula label="z-score">x_scaled = (x − μ) / σ</Formula>
          <div className="nn-calc">
            <div className="nn-calc-h">Normalization steps</div>
            <div className="nn-calc-row">1. Compute mean (μ) and standard deviation (σ) of each feature on <b>training data only</b></div>
            <div className="nn-calc-row">2. Subtract mean and divide by std: x_new = (x − μ) / σ</div>
            <div className="nn-calc-row">3. Apply the <b>same</b> μ and σ to new test/query points</div>
            <div className="nn-calc-row"><b>Result:</b> all features now have mean=0, std=1 → equally weighted in distance</div>
          </div>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">✓ With normalization</div>
              <ul>
                <li>All features contribute equally</li>
                <li>KNN finds geometrically meaningful neighbors</li>
                <li>Works across any feature range</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">✗ Without normalization</div>
              <ul>
                <li>High-range features dominate</li>
                <li>Low-range features are ignored</li>
                <li>Results can be meaningless</li>
              </ul>
            </div>
          </div>
          <Note>Always fit the scaler on training data only. Fitting on the full dataset including test data is called "data leakage" and gives overly optimistic results.</Note>
        </>
      ),
    },

    // ── Stage 9: Curse of Dimensionality ──
    {
      id: "curse", group: "Concepts", title: "Curse of dimensionality — KNN in high-D", map: "Curse of D",
      why: "In high dimensions, the concept of 'nearest neighbor' breaks down. All points become approximately equidistant, so KNN loses its discriminative power.",
      render: (t) => (
        <>
          <Lead>
            As the number of features (dimensions) grows, the average distance between any two random
            points <b>grows with √D</b>. Eventually, the nearest and farthest neighbors are nearly
            the same distance away — making "nearest" meaningless.
          </Lead>
          <DimensionalityChart />
          <div className="tf-subhead">Why this hurts KNN</div>
          <div className="nn-calc">
            <div className="nn-calc-h">Ratio: nearest vs farthest neighbor distance</div>
            <div className="nn-calc-row">In 2D: nearest ≈ 0.4, farthest ≈ 1.4 → ratio ≈ <b>3.5×</b> — clearly distinguishable</div>
            <div className="nn-calc-row">In 100D: nearest ≈ 8.1, farthest ≈ 10.0 → ratio ≈ <b>1.2×</b> — barely distinguishable</div>
            <div className="nn-calc-row">In 1000D: all points cluster near distance √(1000/3) ≈ 18.3 — distance is useless</div>
          </div>
          <div className="tf-subhead">Remedies</div>
          <div className="tf-legend">
            {[
              ["Feature selection", "Remove irrelevant features before applying KNN"],
              ["Dimensionality reduction", "PCA, t-SNE, UMAP to compress to meaningful dims"],
              ["Different algorithm", "Use tree methods or linear models for high-D data"],
              ["Larger training set", "Exponentially more data needed as D grows"],
            ].map(([name, desc]) => (
              <div className="tf-leg" key={name}>
                <div className="tf-leg-name">{name}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>
          <Note>KNN works best in low dimensions (d &lt; 20). For high-D data, consider approximate nearest neighbor libraries (FAISS, Annoy) which trade exactness for speed.</Note>
        </>
      ),
    },

    // ── Stage 10: When to Use ──
    {
      id: "when", group: "Summary", title: "When to use KNN — strengths and limitations", map: "When to Use",
      why: "No algorithm is universally best. Knowing KNN's tradeoffs helps you choose the right tool for each problem.",
      render: (t) => (
        <>
          <Lead>
            KNN is powerful when data is low-dimensional, densely sampled, and non-linear boundaries exist.
            It fails when data is high-dimensional, sparse, or very large.
          </Lead>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">✓ Pros</div>
              <ul>
                <li>No training time — instant to deploy new data</li>
                <li>Naturally handles multi-class problems</li>
                <li>Non-parametric — no assumptions about data distribution</li>
                <li>Intuitive, easy to interpret predictions</li>
                <li>Naturally adapts to new training examples</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">✗ Cons</div>
              <ul>
                <li>O(n·d) prediction time — slow on large datasets</li>
                <li>O(n·d) memory to store all training data</li>
                <li>Poor on high-D data (curse of dimensionality)</li>
                <li>Sensitive to irrelevant features and outliers</li>
                <li>Must normalize features carefully</li>
              </ul>
            </div>
          </div>
          <div className="tf-subhead">KNN vs alternatives</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)", background: "var(--accent-soft)" }}>
                  {["Property", "KNN", "Linear Classifier", "Decision Tree"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "var(--ink)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Training time", "O(1)", "O(n·d·iter)", "O(n·d·log n)"],
                  ["Prediction time", "O(n·d)", "O(d)", "O(log n)"],
                  ["Memory", "O(n·d)", "O(d)", "O(nodes)"],
                  ["Interpretable", "Partially", "Yes", "Yes"],
                  ["Non-linear boundary", "Yes", "No", "Yes"],
                  ["High-D", "Poor", "Good", "Good"],
                  ["Outlier sensitive", "High", "Moderate", "Low"],
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
          <div className="tf-subhead">Complexity summary</div>
          <div className="nn-calc">
            <div className="nn-calc-h">Time & Space complexity (n = training points, d = features, k = neighbors)</div>
            <div className="nn-calc-row"><b>Training:</b> O(1) — just store the data</div>
            <div className="nn-calc-row"><b>Prediction:</b> O(n·d) for brute-force distance computation + O(n·log k) for top-k selection</div>
            <div className="nn-calc-row"><b>Memory:</b> O(n·d) — must keep all training data in memory</div>
            <div className="nn-calc-row"><b>With KD-tree / Ball-tree:</b> prediction can improve to O(d·log n) in low dimensions</div>
          </div>
          <Note>KNN is excellent for prototyping and small datasets. For production with millions of points, use approximate nearest neighbor (ANN) methods like FAISS or ScaNN.</Note>
        </>
      ),
    },
  ];

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "K-Nearest Neighbors",
    subtitle: "Classification — lazy learner, majority vote",
    cur: "KNN · Classification",
    category: "ML Algorithms",
    default: KNN.KNN_CLS.default,
    run: KNN.runKNNCls,
    renderInput,
    modeLinks: [
      { label: "Classification", href: "KNN (Classification).html", active: true },
      { label: "Regression", href: "KNN (Regression).html", active: false },
    ],
  };
})();
