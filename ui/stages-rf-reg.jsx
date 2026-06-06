/* ============================================================
   Random Forest — Regression stages (9 stages)
   ============================================================ */
(function () {
  const { Lead, Note, Row, fmt, Tag } = window;
  const RF = window.ML_RF.RF_REG;

  // ── colours for the 3 trees ──
  const TREE_COLORS = ["#2196f3", "#4caf50", "#ff9800"];
  const TREE_ALPHA = ["#2196f322", "#4caf5022", "#ff980022"];

  // ── scatter / regression SVG ──
  function RegChart({ data, query, curve, treeCurves, w = 380, h = 240, showTrees = false, showAvg = true }) {
    const pad = { l: 50, r: 16, t: 16, b: 40 };
    const xMin = 0, xMax = 48, yMin = 0, yMax = 10;
    const sx = v => pad.l + ((v - xMin) / (xMax - xMin)) * (w - pad.l - pad.r);
    const sy = v => h - pad.b - ((v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);

    // build SVG path from a step curve
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
        {/* axes */}
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#bbb" strokeWidth={1} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#bbb" strokeWidth={1} />
        {/* x ticks */}
        {[0, 10, 20, 30, 40].map(v => (
          <g key={v}>
            <line x1={sx(v)} y1={h - pad.b} x2={sx(v)} y2={h - pad.b + 4} stroke="#bbb" strokeWidth={1} />
            <text x={sx(v)} y={h - pad.b + 14} textAnchor="middle" fontSize={10} fill="#888">{v}</text>
          </g>
        ))}
        {/* y ticks */}
        {[0, 2, 4, 6, 8, 10].map(v => (
          <g key={v}>
            <line x1={pad.l - 4} y1={sy(v)} x2={pad.l} y2={sy(v)} stroke="#bbb" strokeWidth={1} />
            <text x={pad.l - 6} y={sy(v) + 4} textAnchor="end" fontSize={10} fill="#888">{v}</text>
          </g>
        ))}
        <text x={(pad.l + w - pad.r) / 2} y={h - 2} textAnchor="middle" fontSize={11} fill="#666">Age (years)</text>
        <text x={12} y={(pad.t + h - pad.b) / 2} textAnchor="middle" fontSize={11} fill="#666"
          transform={`rotate(-90,12,${(pad.t + h - pad.b) / 2})`}>Price ($100k)</text>
        {/* individual tree curves */}
        {showTrees && treeCurves && treeCurves.map((tc, ti) => (
          <path key={ti} d={stepPath(tc)} fill="none" stroke={TREE_COLORS[ti]} strokeWidth={1.5} opacity={0.5} strokeDasharray="4 3" />
        ))}
        {/* ensemble average */}
        {showAvg && curve && (
          <path d={stepPath(curve)} fill="none" stroke="#e91e63" strokeWidth={2.5} />
        )}
        {/* data points */}
        {data.map((pt, i) => (
          <circle key={i} cx={sx(pt[0])} cy={sy(pt[1])} r={5} fill="#555" opacity={0.8} />
        ))}
        {/* query line */}
        {query !== undefined && (
          <>
            <line x1={sx(query)} y1={pad.t} x2={sx(query)} y2={h - pad.b} stroke="#e91e63" strokeWidth={1.5} strokeDasharray="4 3" />
            {curve && (
              <circle cx={sx(query)}
                cy={sy(curve.find(p => p.age === Math.round(query))?.pred || curve[0].pred)}
                r={7} fill="#e91e63" opacity={0.85} />
            )}
          </>
        )}
      </svg>
    );
  }

  // ── step chart showing single tree ──
  function TreeStepChart({ treeIdx, treeCurve, data, query, w = 280, h = 180 }) {
    const pad = { l: 44, r: 12, t: 14, b: 36 };
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
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#bbb" strokeWidth={1} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#bbb" strokeWidth={1} />
        {[0, 10, 20, 30, 40].map(v => (
          <g key={v}>
            <line x1={sx(v)} y1={h - pad.b} x2={sx(v)} y2={h - pad.b + 4} stroke="#bbb" strokeWidth={1} />
            <text x={sx(v)} y={h - pad.b + 12} textAnchor="middle" fontSize={9} fill="#888">{v}</text>
          </g>
        ))}
        {[0, 5, 10].map(v => (
          <g key={v}>
            <line x1={pad.l - 4} y1={sy(v)} x2={pad.l} y2={sy(v)} stroke="#bbb" strokeWidth={1} />
            <text x={pad.l - 6} y={sy(v) + 4} textAnchor="end" fontSize={9} fill="#888">{v}</text>
          </g>
        ))}
        <path d={stepPath(treeCurve)} fill="none" stroke={TREE_COLORS[treeIdx]} strokeWidth={2} />
        {data.map((pt, i) => (
          <circle key={i} cx={sx(pt[0])} cy={sy(pt[1])} r={4} fill="#555" opacity={0.7} />
        ))}
        {query !== undefined && (
          <line x1={sx(query)} y1={pad.t} x2={sx(query)} y2={h - pad.b}
            stroke="#e91e63" strokeWidth={1.5} strokeDasharray="3 2" />
        )}
        <text x={(pad.l + w - pad.r) / 2} y={h - 2} textAnchor="middle" fontSize={10} fill={TREE_COLORS[treeIdx]} fontWeight="700">Tree {treeIdx + 1}</text>
      </svg>
    );
  }

  // ── bootstrap table (regression) ──
  function BootstrapTableReg({ bsIdx, treeId, data }) {
    const counts = {};
    bsIdx.forEach(i => { counts[i] = (counts[i] || 0) + 1; });
    const allIdx = Array.from({ length: data.length }, (_, i) => i);
    const oob = allIdx.filter(i => !counts[i]);

    return (
      <div style={{ fontSize: 12, border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden", minWidth: 170 }}>
        <div style={{ background: "#f5f5f5", padding: "6px 10px", fontWeight: 700, fontSize: 12, borderBottom: "1px solid #e0e0e0" }}>
          Tree {treeId} bootstrap
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 0 }}>
          <div style={{ padding: "4px 8px", background: "#fafafa", fontWeight: 600, fontSize: 11, borderBottom: "1px solid #f0f0f0" }}>idx</div>
          <div style={{ padding: "4px 8px", background: "#fafafa", fontWeight: 600, fontSize: 11, borderBottom: "1px solid #f0f0f0" }}>age</div>
          <div style={{ padding: "4px 8px", background: "#fafafa", fontWeight: 600, fontSize: 11, borderBottom: "1px solid #f0f0f0" }}>price</div>
          <div style={{ padding: "4px 8px", background: "#fafafa", fontWeight: 600, fontSize: 11, borderBottom: "1px solid #f0f0f0" }}>×</div>
          {bsIdx.filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b).map(origIdx => (
            <React.Fragment key={origIdx}>
              <div style={{ padding: "3px 8px", borderBottom: "1px solid #f5f5f5", color: "#555" }}>{origIdx}</div>
              <div style={{ padding: "3px 8px", borderBottom: "1px solid #f5f5f5", color: "#555" }}>{data[origIdx][0]}</div>
              <div style={{ padding: "3px 8px", borderBottom: "1px solid #f5f5f5", color: "#555" }}>{data[origIdx][1]}</div>
              <div style={{ padding: "3px 8px", borderBottom: "1px solid #f5f5f5", color: "#e91e63", fontWeight: 700 }}>
                ×{counts[origIdx]}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ padding: "5px 10px", background: "#fff8e1", fontSize: 11, color: "#795548" }}>
          <b>OOB:</b> {oob.length > 0 ? oob.join(", ") : "none"}
        </div>
      </div>
    );
  }

  // ── overview forest SVG (regression) ──
  function RegForestOverviewSvg() {
    const W = 420, H = 170;
    const treeXs = [70, 210, 350];
    const treeW = 70, treeH = 80;

    return (
      <svg width={W} height={H} style={{ overflow: "visible", display: "block", margin: "0 auto" }}>
        {/* data source */}
        <rect x={W / 2 - 52} y={4} width={104} height={24} rx={6} fill="#e3f2fd" stroke="#90caf9" strokeWidth={1.5} />
        <text x={W / 2} y={20} textAnchor="middle" fontSize={11} fill="#1565c0" fontWeight="700">Training Data</text>
        {treeXs.map((tx, i) => (
          <line key={i} x1={W / 2} y1={28} x2={tx} y2={44} stroke="#90caf9" strokeWidth={1.5} strokeDasharray="3 2" />
        ))}
        {treeXs.map((tx, i) => (
          <g key={i}>
            <rect x={tx - treeW / 2} y={44} width={treeW} height={treeH} rx={8}
              fill="#f5f5f5" stroke={TREE_COLORS[i]} strokeWidth={1.5} />
            <text x={tx} y={62} textAnchor="middle" fontSize={10} fill={TREE_COLORS[i]} fontWeight="700">Tree {i + 1}</text>
            {/* mini step curve icon */}
            <polyline
              points={`${tx - 25},${100} ${tx - 10},${100} ${tx - 10},${88} ${tx + 8},${88} ${tx + 8},${110} ${tx + 25},${110}`}
              fill="none" stroke={TREE_COLORS[i]} strokeWidth={2}
            />
            {/* prediction label */}
            <rect x={tx - 24} y={130} width={48} height={16} rx={4} fill={TREE_COLORS[i]} fillOpacity={0.2} stroke={TREE_COLORS[i]} strokeWidth={1} />
            <text x={tx} y={141} textAnchor="middle" fontSize={9} fill={TREE_COLORS[i]} fontWeight="700">
              pred={[4.75, 6.25, 4.275][i]}
            </text>
          </g>
        ))}
        {/* arrows to avg box */}
        {treeXs.map((tx, i) => (
          <line key={i} x1={tx} y1={148} x2={W / 2} y2={H - 18} stroke="#bbb" strokeWidth={1.5} />
        ))}
        <rect x={W / 2 - 56} y={H - 18} width={112} height={20} rx={6} fill="#fce4ec" stroke="#f48fb1" strokeWidth={1.5} />
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="#c62828" fontWeight="700">Average predictions</text>
      </svg>
    );
  }

  const STAGES = [
    // ── Stage 1: Overview ──
    {
      id: "overview", group: "Overview", title: "Random Forest for regression — averaged predictions",
      map: "Overview",
      why: "Instead of majority voting, a regression forest averages the numerical predictions from all trees. This averaging smooths out each tree's step-function and reduces variance.",
      render: (trace) => (
        <>
          <Lead>
            In <b>regression</b>, each tree predicts a continuous number (here: house price in
            $100k). The random forest's final prediction is the <b>average</b> of all trees'
            predictions. Averaging reduces variance dramatically — if each tree has independent
            error σ², the ensemble of n trees has error ≈ σ²/n.
          </Lead>
          <div style={{ margin: "20px 0" }}>
            <RegForestOverviewSvg />
          </div>
          <div className="tf-archwrap" style={{ marginTop: 16 }}>
            <div className="tf-arch">
              <div className="tf-arch-io">8 houses: (age → price)<span>Training data</span></div>
              <div className="tf-arch-f"><b>Bootstrap sampling</b> × 3</div>
              <div className="tf-arch-row">3 overlapping subsets</div>
              <div className="tf-arch-f"><b>Grow regression tree per subset</b></div>
              <div className="tf-arch-row">Each tree = step function (piecewise constant)</div>
              <div className="tf-arch-f"><b>Average predictions</b></div>
              <div className="tf-arch-io tf-arch-io--out">Smoother, more accurate prediction curve<span>Output</span></div>
            </div>
          </div>
          <div className="tf-legend" style={{ marginTop: 16 }}>
            {[
              ["Bagging", "Bootstrap AGGregatING", "Each tree sees a different random sample → different step function"],
              ["Averaging", "Mean of tree predictions", "Reduces variance; final curve smoother than any single tree"],
              ["Variance reduction", "σ²/n for uncorrelated trees", "More trees = lower prediction variance (until trees become correlated)"],
              ["OOB MSE", "Out-of-bag validation", "Free estimate of test MSE — no holdout set needed"],
            ].map(([sym, name, desc]) => (
              <div className="tf-leg" key={sym}>
                <div className="tf-leg-top"><span className="tf-sym">{sym}</span></div>
                <div className="tf-leg-name">{name}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>
          <Note>Move the <b>age</b> slider in the top bar — the average prediction updates live. Watch how it sits between the individual tree predictions.</Note>
        </>
      ),
    },

    // ── Stage 2: Dataset ──
    {
      id: "dataset", group: "Data", title: "The dataset — 8 houses, age vs price",
      map: "Dataset",
      why: "Before building any model we need to understand the data. A clear downward trend in price vs age forms an obvious but non-linear relationship.",
      render: (trace) => {
        const { age, curve } = trace;
        return (
          <>
            <Lead>
              We have <b>8 houses</b> described by their <b>age in years</b> and
              <b> price in $100k</b>. Older houses are generally cheaper — but the relationship is
              non-linear (newer houses drop steeply in value; older ones have a lower, flatter
              price). The <b>pink dashed line</b> marks your query age.
            </Lead>
            <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
              <RegChart data={RF.data} query={age} curve={curve} w={380} h={240} showTrees={false} showAvg={true} />
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center", margin: "8px 0", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width={20} height={6}><line x1={0} y1={3} x2={20} y2={3} stroke="#e91e63" strokeWidth={2.5} /></svg>
                <span style={{ fontSize: 13 }}>RF ensemble avg</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width={10} height={10}><circle cx={5} cy={5} r={4} fill="#555" /></svg>
                <span style={{ fontSize: 13 }}>Training point</span>
              </div>
            </div>
            <div className="tf-subhead">All 8 training points</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
              {RF.data.map((pt, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                  border: "1px solid #e0e0e0", borderRadius: 7, fontSize: 12,
                  background: "#fafafa",
                }}>
                  <span style={{ color: "#aaa", minWidth: 18 }}>#{i}</span>
                  <span style={{ color: "#555" }}>age={pt[0]} yr</span>
                  <span style={{ marginLeft: "auto", fontWeight: 700, color: "#1565c0" }}>${pt[1]}00k</span>
                </div>
              ))}
            </div>
          </>
        );
      },
    },

    // ── Stage 3: Bagging ──
    {
      id: "bagging", group: "Ensemble", title: "Bootstrap sampling for regression",
      map: "Bagging",
      why: "Sampling with replacement gives each tree a slightly different view of the relationship between age and price. This diversity is what makes the ensemble better than any single tree.",
      render: (trace) => (
        <>
          <Lead>
            Each of the 3 regression trees is trained on a <b>bootstrap sample</b> of 8 houses drawn
            with replacement from the original 8. Some houses appear twice; roughly 37% are left out
            as <b>OOB (out-of-bag)</b> examples.
          </Lead>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "16px 0" }}>
            {RF.bootstraps.map((bs, ti) => (
              <BootstrapTableReg key={ti} bsIdx={bs} treeId={ti + 1} data={RF.data} />
            ))}
          </div>
          <div className="nn-reg-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="nn-reg">
              <div className="nn-reg-h">Why it works for regression</div>
              <p>When some houses appear twice they pull the tree's split thresholds in a slightly different direction. This produces trees with different step-function shapes whose average is smoother and more accurate.</p>
            </div>
            <div className="nn-reg">
              <div className="nn-reg-h">OOB houses for validation</div>
              <p>Houses not drawn can be predicted by that tree and the residual measured. Average these residuals over all trees to estimate MSE without ever holding out a separate test set.</p>
            </div>
          </div>
        </>
      ),
    },

    // ── Stage 4: Tree Predictions ──
    {
      id: "trees", group: "Ensemble", title: "Each tree's step-function prediction",
      map: "Tree Preds",
      why: "Regression trees output piecewise-constant (step-function) predictions. Seeing all three side by side reveals how their thresholds differ — and why averaging smooths the result.",
      render: (trace) => {
        const { age, preds, treeCurves } = trace;
        const trees = RF.trees;
        return (
          <>
            <Lead>
              Each regression tree splits the age axis at different thresholds to minimise the
              variance of house prices within each leaf. The result is a <b>step function</b> —
              constant within each segment. The 3 trees have slightly different split points due to
              their different bootstrap samples.
            </Lead>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
              {trees.map((tree, ti) => (
                <div key={ti}>
                  <TreeStepChart treeIdx={ti} treeCurve={treeCurves[ti]} data={RF.data} query={age} />
                  <div style={{
                    textAlign: "center", fontSize: 12, marginTop: 4, color: TREE_COLORS[ti],
                    fontWeight: 700,
                  }}>
                    splits: age ≤ {tree.threshold}, ≤ {tree.right.threshold}
                  </div>
                  <div style={{
                    textAlign: "center", fontSize: 13, marginTop: 4,
                    padding: "4px 10px", background: TREE_COLORS[ti] + "18",
                    border: `1.5px solid ${TREE_COLORS[ti]}`, borderRadius: 8,
                  }}>
                    age={age} → <b style={{ color: TREE_COLORS[ti] }}>${fmt(preds[ti])}00k</b>
                  </div>
                </div>
              ))}
            </div>
            <div className="tf-subhead">Why different predictions for age={age}?</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    <th style={{ padding: "8px 12px", borderBottom: "2px solid #e0e0e0" }}>Tree</th>
                    <th style={{ padding: "8px 12px", borderBottom: "2px solid #e0e0e0" }}>Split 1</th>
                    <th style={{ padding: "8px 12px", borderBottom: "2px solid #e0e0e0" }}>Split 2</th>
                    <th style={{ padding: "8px 12px", borderBottom: "2px solid #e0e0e0" }}>Leaf avg</th>
                    <th style={{ padding: "8px 12px", borderBottom: "2px solid #e0e0e0" }}>Prediction</th>
                  </tr>
                </thead>
                <tbody>
                  {trees.map((tree, ti) => (
                    <tr key={ti} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "7px 12px", color: TREE_COLORS[ti], fontWeight: 700 }}>Tree {ti + 1}</td>
                      <td style={{ padding: "7px 12px", fontFamily: "monospace" }}>age ≤ {tree.threshold}</td>
                      <td style={{ padding: "7px 12px", fontFamily: "monospace" }}>age ≤ {tree.right.threshold}</td>
                      <td style={{ padding: "7px 12px" }}>
                        {age <= tree.threshold ? `$${tree.left.predict}00k` :
                          age <= tree.right.threshold ? `$${tree.right.left.predict}00k` : `$${tree.right.right.predict}00k`}
                      </td>
                      <td style={{ padding: "7px 12px", fontWeight: 700, color: TREE_COLORS[ti] }}>
                        ${fmt(preds[ti])}00k
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      },
    },

    // ── Stage 5: Averaging ──
    {
      id: "averaging", group: "Prediction", title: "Averaging — the ensemble prediction",
      map: "Averaging",
      why: "Averaging the 3 tree predictions cancels out individual biases and produces a smoother, more accurate prediction than any single tree.",
      render: (trace) => {
        const { age, preds, avg, curve, treeCurves } = trace;
        return (
          <>
            <Lead>
              The <b>forest prediction</b> is simply the <b>arithmetic mean</b> of all tree
              predictions. For age={age}: the three trees predict {preds.map(p => `$${fmt(p)}00k`).join(", ")}.
              The ensemble average is <b>${fmt(avg)}00k</b>.
            </Lead>
            <div className="nn-calc" style={{ marginTop: 12 }}>
              <div className="nn-calc-h">Ensemble average for age = {age}</div>
              {preds.map((p, ti) => (
                <div className="nn-calc-row" key={ti}>
                  <span style={{ color: TREE_COLORS[ti], fontWeight: 700 }}>Tree {ti + 1}:</span>
                  <span style={{ marginLeft: 8, color: "#555" }}>${fmt(p)}00k</span>
                </div>
              ))}
              <div className="nn-calc-row" style={{ background: "#fce4ec", borderTop: "2px solid #f48fb1" }}>
                <span style={{ fontWeight: 700, color: "#c62828" }}>
                  Average = ({preds.map(p => fmt(p)).join(" + ")}) / 3 = <b>${fmt(avg)}00k</b>
                </span>
              </div>
            </div>
            <div className="tf-subhead">All curves together</div>
            <div style={{ margin: "12px 0" }}>
              <RegChart data={RF.data} query={age} curve={curve} treeCurves={treeCurves}
                w={380} h={240} showTrees={true} showAvg={true} />
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "8px 0" }}>
              {TREE_COLORS.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width={20} height={6}><line x1={0} y1={3} x2={20} y2={3} stroke={c} strokeWidth={2} strokeDasharray="4 3" /></svg>
                  <span style={{ fontSize: 12 }}>Tree {i + 1}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width={20} height={6}><line x1={0} y1={3} x2={20} y2={3} stroke="#e91e63" strokeWidth={2.5} /></svg>
                <span style={{ fontSize: 12 }}>Ensemble avg (RF)</span>
              </div>
            </div>
            <Note>The pink curve visually lies between the three dashed individual tree curves — it is literally their pointwise average.</Note>
          </>
        );
      },
    },

    // ── Stage 6: Variance Reduction ──
    {
      id: "variance", group: "Theory", title: "Variance reduction — why more trees help",
      map: "Variance",
      why: "Understanding the math behind variance reduction explains when adding more trees helps and when it stops being worth the compute.",
      render: (trace) => (
        <>
          <Lead>
            If each tree makes an independent error with variance σ², averaging n trees reduces
            the variance to <b>σ²/n</b>. In practice trees are correlated (same training set,
            same features), so the reduction is less — but still substantial.
          </Lead>
          <div className="tf-subhead">Variance formula</div>
          <div style={{
            background: "#f5f5f5", borderRadius: 10, padding: "16px 20px",
            fontFamily: "monospace", fontSize: 14, margin: "12px 0",
            border: "1px solid #e0e0e0",
          }}>
            <div style={{ marginBottom: 8 }}>
              <b>Single tree:</b> Var(T) = σ²
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>Independent forest:</b> Var(RF) = σ²/n
            </div>
            <div style={{ color: "#e91e63" }}>
              <b>Correlated forest:</b> Var(RF) = ρ·σ² + (1−ρ)·σ²/n
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
            where ρ is the average pairwise correlation between trees (reduced by feature randomness).
          </div>
          <div className="tf-subhead">Variance vs n_estimators (illustrative)</div>
          <div style={{ margin: "12px 0" }}>
            {[1, 2, 3, 5, 10, 20, 50, 100].map(n => {
              const rho = 0.35;
              const sigma2 = 1.0;
              const varRF = rho * sigma2 + (1 - rho) * sigma2 / n;
              const barPct = (varRF / sigma2) * 100;
              return (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 60, fontSize: 12, textAlign: "right", color: "#555" }}>{n} tree{n > 1 ? "s" : ""}</span>
                  <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 18, overflow: "hidden" }}>
                    <div style={{
                      width: `${barPct}%`, height: "100%",
                      background: n <= 3 ? "#ef5350" : n <= 10 ? "#ff9800" : "#4caf50",
                      borderRadius: 4, transition: "width 0.3s",
                      display: "flex", alignItems: "center", paddingLeft: 6,
                    }}>
                      <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{fmt(varRF, 2)}σ²</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="nn-reg-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="nn-reg">
              <div className="nn-reg-h">Diminishing returns</div>
              <p>Going from 1 to 10 trees massively reduces variance. Going from 100 to 200 trees gives a tiny improvement. Most practitioners stop at 100–500 trees.</p>
            </div>
            <div className="nn-reg">
              <div className="nn-reg-h">Bias stays the same</div>
              <p>Averaging doesn't reduce bias — only variance. If each tree is biased (e.g. too shallow, misses non-linearities) the forest shares that bias. Feature randomness and depth control this.</p>
            </div>
          </div>
        </>
      ),
    },

    // ── Stage 7: Feature Importance ──
    {
      id: "importance", group: "Insights", title: "Feature importance in regression forests",
      map: "Importance",
      why: "With only one feature (age) in this toy example, its importance is 100%. In real datasets with many features, this ranking guides feature selection.",
      render: (trace) => (
        <>
          <Lead>
            Feature importance in regression forests measures the <b>weighted variance reduction</b>
            at each split. For each split: Δvariance × (samples in node / total). Sum over all
            splits in all trees, then normalise. Features that produce large reductions many times
            get high scores.
          </Lead>
          <div className="tf-subhead">How importance is computed (step by step)</div>
          <div className="nn-calc" style={{ marginTop: 8 }}>
            <div className="nn-calc-h">Tree 1 — variance reductions</div>
            <div className="nn-calc-row">
              <span style={{ color: "#555", fontSize: 13 }}>Root split (age ≤ 10): variance before = 5.2 | left var = 0.12 | right var = 2.1</span>
            </div>
            <div className="nn-calc-row">
              <span style={{ color: "#555", fontSize: 13 }}>ΔVar = 5.2 − (4/8×0.12 + 4/8×2.1) = 5.2 − 1.11 = 4.09</span>
            </div>
            <div className="nn-calc-row">
              <span style={{ color: "#555", fontSize: 13 }}>Second split (age ≤ 25): similar calculation at right child</span>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#e8f5e9", borderRadius: 8, fontSize: 13 }}>
            <b>Result for this dataset:</b> age has 100% importance (it's the only feature). In a
            multi-feature dataset, features that appear higher in trees (closer to root) and reduce
            more variance get higher scores.
          </div>
          <div className="nn-reg-grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 12 }}>
            <div className="nn-reg">
              <div className="nn-reg-h">Impurity vs permutation importance</div>
              <p>Impurity-based importance (computed from the tree splits) is fast but can overestimate importance for high-cardinality features. Permutation importance (shuffle feature, measure MSE increase) is more reliable.</p>
            </div>
            <div className="nn-reg">
              <div className="nn-reg-h">SHAP values</div>
              <p>For more precise per-prediction explanations, SHAP (SHapley Additive exPlanations) decomposes each prediction into the contribution of each feature, consistent with game theory axioms.</p>
            </div>
          </div>
        </>
      ),
    },

    // ── Stage 8: Comparison ──
    {
      id: "comparison", group: "Insights", title: "RF vs single tree vs linear regression",
      map: "Comparison",
      why: "Every algorithm has trade-offs. Seeing RF alongside alternatives clarifies when to reach for it.",
      render: (trace) => {
        const { age, avg } = trace;
        return (
          <>
            <Lead>
              Three common approaches to the same regression problem. Each makes different
              assumptions and has different strengths. Understanding these trade-offs helps you
              choose the right tool.
            </Lead>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    {["Property", "Linear Regression", "Single Decision Tree", "Random Forest"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Prediction type", "Straight line", "Step function", "Averaged step functions"],
                    ["Bias", "High (if non-linear)", "Low (deep tree)", "Low"],
                    ["Variance", "Low", "High (overfits)", "Low (averaging)"],
                    ["Interpretability", "★★★★★", "★★★★☆", "★★☆☆☆"],
                    ["Training speed", "Very fast", "Fast", "Moderate (3–500 trees)"],
                    ["Prediction speed", "Very fast", "Fast", "Moderate"],
                    ["Handles non-linearity", "No (needs transforms)", "Yes", "Yes"],
                    ["Handles outliers", "Sensitive", "Robust", "Robust"],
                    ["Extrapolation", "Yes (linear)", "No (flat)", "No (flat)"],
                    ["Tune difficulty", "Low", "Low", "Low–Moderate"],
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
            <div className="tf-subhead" style={{ marginTop: 16 }}>For age = {age} years:</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                ["Linear Regression", fmt(9.5 - 0.18 * age), "#9e9e9e", "extrapolates but may miss non-linearity"],
                ["Single Tree", fmt(age <= 15 ? (age <= 8 ? 7.85 : 6.25) : 2.675), "#ff9800", "sharp step function, can overfit"],
                ["Random Forest", fmt(avg), "#e91e63", "smoothed average — best of both"],
              ].map(([name, pred, color, note]) => (
                <div key={name} style={{
                  border: `2px solid ${color}`, borderRadius: 10, padding: "10px 14px",
                  background: color + "10", flex: "1 1 160px",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color }}>{name}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color, marginTop: 4 }}>${pred}00k</div>
                  <div style={{ fontSize: 11, color: "#777", marginTop: 4 }}>{note}</div>
                </div>
              ))}
            </div>
          </>
        );
      },
    },

    // ── Stage 9: Hyperparameters ──
    {
      id: "hyperparams", group: "Insights", title: "Hyperparameters for regression forests",
      map: "Hyperparams",
      why: "Regression forests share most hyperparameters with classification forests but use different default settings for max_features and different scoring metrics.",
      render: (trace) => (
        <>
          <Lead>
            Regression random forests share most hyperparameters with classification forests.
            Key differences: <b>max_features default = p/3</b> (not √p), and quality at splits
            is measured by <b>variance reduction</b> (not Gini impurity). Scoring uses
            <b> MSE or MAE</b>, not accuracy.
          </Lead>
          <div className="tf-subhead">Hyperparameter guide</div>
          <div className="tf-legend">
            {[
              ["n_estimators", "Number of trees", "50–500. More = lower variance. 100 is a good default; diminishing returns after 200."],
              ["max_features", "Features per split", "Default p/3 for regression (vs √p for classification). Smaller = more diversity, higher bias."],
              ["max_depth", "Max tree depth", "None (unlimited) by default. Limit to 10–20 to reduce overfitting on noisy data."],
              ["min_samples_leaf", "Min samples per leaf", "Default 1. Increase to 5–10 for smoother predictions; acts as regularisation."],
              ["oob_score", "OOB error estimate", "Set True to get a free MSE estimate. Equivalent to ~37-fold cross-validation."],
              ["criterion", "Split criterion", "'squared_error' (MSE) or 'absolute_error' (MAE). MAE is more robust to outliers."],
            ].map(([sym, name, desc]) => (
              <div className="tf-leg" key={sym}>
                <div className="tf-leg-top"><span className="tf-sym" style={{ fontSize: 11 }}>{sym}</span></div>
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
                "Works well out of the box with default hyperparameters",
                "Handles non-linear relationships automatically",
                "Robust to outliers (tree splits are threshold-based)",
                "OOB error as free MSE estimate",
                "Feature importance built in",
              ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
              {[
                "Cannot extrapolate beyond training range",
                "Step-function outputs (not smooth curves)",
                "Slower than linear regression at prediction time",
                "Less accurate than gradient boosting on tabular data",
                "High memory usage with many trees",
              ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✗ {t}</div>)}
            </div>
          </div>
          <div style={{ background: "#e3f2fd", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 8 }}>
            <b>Quick-start sklearn:</b>{" "}
            <code style={{ fontFamily: "monospace", background: "#e8eaf6", padding: "2px 6px", borderRadius: 4 }}>
              from sklearn.ensemble import RandomForestRegressor; model = RandomForestRegressor(n_estimators=100, oob_score=True)
            </code>
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
            marginLeft: 12, padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
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
