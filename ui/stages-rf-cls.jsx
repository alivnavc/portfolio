/* ============================================================
   Random Forest — Classification stages (10 stages)
   ============================================================ */
(function () {
  const { Lead, Note, Row, fmt, Tag } = window;
  const RF = window.ML_RF.RF_CLS;

  // ── colour helpers ──
  const CLS_COLORS = ["#4caf50", "#2196f3", "#ff9800"];
  const CLS_NAMES = RF.labels;

  function Dot({ cls, size = 8 }) {
    return (
      <span style={{
        display: "inline-block", width: size, height: size, borderRadius: "50%",
        background: CLS_COLORS[cls], marginRight: 4, verticalAlign: "middle",
      }} />
    );
  }

  // ── scatter SVG ──
  function ScatterPlot({ data, query, w = 380, h = 260, highlight = null }) {
    const pad = { l: 48, r: 16, t: 16, b: 40 };
    const xMin = 1.0, xMax = 6.5, yMin = 0.0, yMax = 2.6;
    const sx = v => pad.l + ((v - xMin) / (xMax - xMin)) * (w - pad.l - pad.r);
    const sy = v => h - pad.b - ((v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);

    return (
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        {/* axes */}
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#aaa" strokeWidth={1} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#aaa" strokeWidth={1} />
        {/* x ticks */}
        {[1, 2, 3, 4, 5, 6].map(v => (
          <g key={v}>
            <line x1={sx(v)} y1={h - pad.b} x2={sx(v)} y2={h - pad.b + 4} stroke="#aaa" strokeWidth={1} />
            <text x={sx(v)} y={h - pad.b + 14} textAnchor="middle" fontSize={10} fill="#888">{v}</text>
          </g>
        ))}
        {/* y ticks */}
        {[0, 0.5, 1, 1.5, 2, 2.5].map(v => (
          <g key={v}>
            <line x1={pad.l - 4} y1={sy(v)} x2={pad.l} y2={sy(v)} stroke="#aaa" strokeWidth={1} />
            <text x={pad.l - 6} y={sy(v) + 4} textAnchor="end" fontSize={10} fill="#888">{v}</text>
          </g>
        ))}
        {/* axis labels */}
        <text x={(pad.l + w - pad.r) / 2} y={h - 2} textAnchor="middle" fontSize={11} fill="#666">petal length (cm)</text>
        <text x={12} y={(pad.t + h - pad.b) / 2} textAnchor="middle" fontSize={11} fill="#666" transform={`rotate(-90,12,${(pad.t + h - pad.b) / 2})`}>petal width (cm)</text>
        {/* data points */}
        {data.map((pt, i) => (
          <circle
            key={i}
            cx={sx(pt[0])} cy={sy(pt[1])}
            r={highlight && highlight.has(i) ? 7 : 5}
            fill={CLS_COLORS[pt[2]]}
            opacity={highlight ? (highlight.has(i) ? 1 : 0.25) : 0.85}
            stroke={highlight && highlight.has(i) ? "#333" : "none"}
            strokeWidth={1.5}
          />
        ))}
        {/* query point */}
        {query && (
          <g>
            <circle cx={sx(query[0])} cy={sy(query[1])} r={8} fill="none" stroke="#e91e63" strokeWidth={2.5} strokeDasharray="3 2" />
            <circle cx={sx(query[0])} cy={sy(query[1])} r={3} fill="#e91e63" />
            <text x={sx(query[0]) + 11} y={sy(query[1]) - 6} fontSize={11} fill="#e91e63" fontWeight="600">query</text>
          </g>
        )}
      </svg>
    );
  }

  // ── small SVG tree ──
  function TreeSvg({ tree, x, votes, queryLabel, compact = false }) {
    const W = compact ? 170 : 220, H = compact ? 130 : 160;
    const midX = W / 2;
    const r = compact ? 28 : 36;
    const r2 = compact ? 22 : 28;
    // root
    const rootY = compact ? 28 : 34;
    // children
    const midY = compact ? 80 : 96;
    const leftX = compact ? 42 : 54, rightX = compact ? W - 42 : W - 54;
    const leafY = compact ? H - 20 : H - 24;
    const leafLX = compact ? 30 : 38, leafRX = compact ? W - 30 : W - 38;

    const labelNames = ["setosa", "versic.", "virgin."];
    const labelColors = CLS_COLORS;

    const rootLabel = `${tree.featureName} ≤ ${tree.threshold}`;
    const rightNode = tree.right;
    const hasSecondSplit = rightNode && rightNode.feature !== undefined;

    return (
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        {/* edges root → children */}
        <line x1={midX} y1={rootY + (compact ? 16 : 20)} x2={leftX} y2={midY - (compact ? 12 : 14)} stroke="#bbb" strokeWidth={1.5} />
        <line x1={midX} y1={rootY + (compact ? 16 : 20)} x2={rightX} y2={midY - (compact ? 12 : 14)} stroke="#bbb" strokeWidth={1.5} />
        {/* root node */}
        <rect x={midX - r} y={rootY - 14} width={r * 2} height={28} rx={6} fill="#f5f5f5" stroke="#999" strokeWidth={1.5} />
        <text x={midX} y={rootY} textAnchor="middle" fontSize={compact ? 8 : 9} fill="#333" fontWeight="600">{tree.featureName}</text>
        <text x={midX} y={rootY + 11} textAnchor="middle" fontSize={compact ? 8 : 9} fill="#555">≤ {tree.threshold}</text>
        {/* left: always a leaf (setosa) */}
        <rect x={leftX - r2} y={midY - 12} width={r2 * 2} height={24} rx={5} fill={labelColors[0]} fillOpacity={0.2} stroke={labelColors[0]} strokeWidth={1.5} />
        <text x={leftX} y={midY + 4} textAnchor="middle" fontSize={compact ? 8 : 9} fill={labelColors[0]} fontWeight="600">setosa</text>
        {/* "yes" / "no" labels */}
        <text x={(midX + leftX) / 2 - 4} y={midY - 16} textAnchor="middle" fontSize={compact ? 7 : 8} fill="#888">yes</text>
        <text x={(midX + rightX) / 2 + 4} y={midY - 16} textAnchor="middle" fontSize={compact ? 7 : 8} fill="#888">no</text>
        {/* right side */}
        {hasSecondSplit ? (
          <>
            <rect x={rightX - r} y={midY - 14} width={r * 2} height={28} rx={6} fill="#f5f5f5" stroke="#999" strokeWidth={1.5} />
            <text x={rightX} y={midY} textAnchor="middle" fontSize={compact ? 8 : 9} fill="#333" fontWeight="600">{rightNode.featureName}</text>
            <text x={rightX} y={midY + 11} textAnchor="middle" fontSize={compact ? 8 : 9} fill="#555">≤ {rightNode.threshold}</text>
            {/* edges inner → leaves */}
            <line x1={rightX} y1={midY + 14} x2={leafLX + 2} y2={leafY - 10} stroke="#bbb" strokeWidth={1.5} />
            <line x1={rightX} y1={midY + 14} x2={leafRX - 2} y2={leafY - 10} stroke="#bbb" strokeWidth={1.5} />
            <rect x={leafLX - r2} y={leafY - 10} width={r2 * 2} height={22} rx={5} fill={labelColors[1]} fillOpacity={0.2} stroke={labelColors[1]} strokeWidth={1.5} />
            <text x={leafLX} y={leafY + 4} textAnchor="middle" fontSize={compact ? 7 : 9} fill={labelColors[1]} fontWeight="600">{labelNames[1]}</text>
            <rect x={leafRX - r2} y={leafY - 10} width={r2 * 2} height={22} rx={5} fill={labelColors[2]} fillOpacity={0.2} stroke={labelColors[2]} strokeWidth={1.5} />
            <text x={leafRX} y={leafY + 4} textAnchor="middle" fontSize={compact ? 7 : 9} fill={labelColors[2]} fontWeight="600">{labelNames[2]}</text>
          </>
        ) : (
          <rect x={rightX - r2} y={midY - 12} width={r2 * 2} height={24} rx={5}
            fill={labelColors[rightNode.label]} fillOpacity={0.2} stroke={labelColors[rightNode.label]} strokeWidth={1.5} />
        )}
        {/* query vote indicator */}
        {queryLabel !== undefined && (
          <g>
            <circle cx={compact ? W - 12 : W - 16} cy={compact ? 12 : 16} r={compact ? 9 : 11}
              fill={labelColors[queryLabel]} fillOpacity={0.85} />
            <text x={compact ? W - 12 : W - 16} y={(compact ? 12 : 16) + 4}
              textAnchor="middle" fontSize={compact ? 8 : 9} fill="#fff" fontWeight="700">
              {["S", "Ve", "Vi"][queryLabel]}
            </text>
          </g>
        )}
      </svg>
    );
  }

  // ── Bootstrap table ──
  function BootstrapTable({ bsIdx, treeId, data }) {
    const counts = {};
    bsIdx.forEach(i => { counts[i] = (counts[i] || 0) + 1; });
    const allIdx = Array.from({ length: data.length }, (_, i) => i);
    const oob = allIdx.filter(i => !counts[i]);

    return (
      <div style={{ fontSize: 12, border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden", minWidth: 180 }}>
        <div style={{ background: "#f5f5f5", padding: "6px 10px", fontWeight: 700, fontSize: 12, borderBottom: "1px solid #e0e0e0" }}>
          Tree {treeId} bootstrap
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 0 }}>
          <div style={{ padding: "4px 8px", background: "#fafafa", fontWeight: 600, fontSize: 11, borderBottom: "1px solid #f0f0f0" }}>idx</div>
          <div style={{ padding: "4px 8px", background: "#fafafa", fontWeight: 600, fontSize: 11, borderBottom: "1px solid #f0f0f0" }}>pl, pw</div>
          <div style={{ padding: "4px 8px", background: "#fafafa", fontWeight: 600, fontSize: 11, borderBottom: "1px solid #f0f0f0" }}>cls</div>
          <div style={{ padding: "4px 8px", background: "#fafafa", fontWeight: 600, fontSize: 11, borderBottom: "1px solid #f0f0f0" }}>×</div>
          {bsIdx.filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b).map(origIdx => (
            <React.Fragment key={origIdx}>
              <div style={{ padding: "3px 8px", borderBottom: "1px solid #f5f5f5", color: "#555" }}>{origIdx}</div>
              <div style={{ padding: "3px 8px", borderBottom: "1px solid #f5f5f5", color: "#555" }}>
                {data[origIdx][0]}, {data[origIdx][1]}
              </div>
              <div style={{ padding: "3px 8px", borderBottom: "1px solid #f5f5f5" }}>
                <Dot cls={data[origIdx][2]} size={7} />
                {CLS_NAMES[data[origIdx][2]].slice(0, 4)}
              </div>
              <div style={{ padding: "3px 8px", borderBottom: "1px solid #f5f5f5", color: "#e91e63", fontWeight: 700 }}>
                ×{counts[origIdx]}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ padding: "5px 10px", background: "#fff8e1", fontSize: 11, color: "#795548" }}>
          <b>OOB:</b> {oob.length > 0 ? oob.join(", ") : "none"} ({oob.length} samples)
        </div>
      </div>
    );
  }

  // ── vote counter ──
  function VoteCounter({ votes, counts }) {
    return (
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "12px 0" }}>
        {CLS_NAMES.map((name, ci) => (
          <div key={ci} style={{
            border: `2px solid ${CLS_COLORS[ci]}`, borderRadius: 10, padding: "10px 18px",
            background: counts[ci] > 0 ? CLS_COLORS[ci] + "18" : "#f9f9f9",
            textAlign: "center", minWidth: 90,
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: CLS_COLORS[ci] }}>{counts[ci]}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{name}</div>
            <div style={{ fontSize: 10, color: "#aaa" }}>votes</div>
          </div>
        ))}
      </div>
    );
  }

  // ── importance bar chart ──
  function ImportanceBar({ importance, features }) {
    const max = Math.max(...importance);
    return (
      <div style={{ margin: "12px 0" }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 90, fontSize: 12, color: "#555", textAlign: "right" }}>{f}</span>
            <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 22, overflow: "hidden" }}>
              <div style={{
                width: `${(importance[i] / max) * 100}%`, height: "100%",
                background: i === 0 ? "#2196f3" : "#ff9800",
                borderRadius: 4, transition: "width 0.4s",
                display: "flex", alignItems: "center", paddingLeft: 8,
              }}>
                <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{fmt(importance[i] * 100, 1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── 3 parallel trees overview SVG ──
  function ForestOverviewSvg() {
    const W = 420, H = 160;
    const treeXs = [60, 210, 360];
    const treeW = 80, treeH = 90;
    const clsColors = CLS_COLORS;

    return (
      <svg width={W} height={H} style={{ overflow: "visible", display: "block", margin: "0 auto" }}>
        {/* data source */}
        <rect x={W / 2 - 50} y={4} width={100} height={24} rx={6} fill="#e3f2fd" stroke="#90caf9" strokeWidth={1.5} />
        <text x={W / 2} y={20} textAnchor="middle" fontSize={11} fill="#1565c0" fontWeight="700">Training Data</text>
        {/* arrows to trees */}
        {treeXs.map((tx, i) => (
          <line key={i} x1={W / 2} y1={28} x2={tx} y2={42} stroke="#90caf9" strokeWidth={1.5} strokeDasharray="3 2" />
        ))}
        {/* 3 mini tree boxes */}
        {treeXs.map((tx, i) => (
          <g key={i}>
            <rect x={tx - treeW / 2} y={42} width={treeW} height={treeH} rx={8}
              fill="#f5f5f5" stroke="#bdbdbd" strokeWidth={1.5} />
            <text x={tx} y={60} textAnchor="middle" fontSize={10} fill="#555" fontWeight="700">Tree {i + 1}</text>
            {/* simplified tree icon */}
            <line x1={tx} y1={68} x2={tx - 18} y2={88} stroke="#bbb" strokeWidth={1.2} />
            <line x1={tx} y1={68} x2={tx + 18} y2={88} stroke="#bbb" strokeWidth={1.2} />
            <rect x={tx - 12} y={60} width={24} height={16} rx={4} fill="#e8eaf6" stroke="#9fa8da" strokeWidth={1} />
            <rect x={tx - 22} y={88} width={16} height={14} rx={3} fill={clsColors[0]} fillOpacity={0.4} stroke={clsColors[0]} strokeWidth={1} />
            <rect x={tx + 6} y={88} width={16} height={14} rx={3} fill={clsColors[1]} fillOpacity={0.4} stroke={clsColors[1]} strokeWidth={1} />
            {/* prediction badge */}
            <circle cx={tx + treeW / 2 - 8} cy={treeH + 28} r={11} fill={clsColors[i % 3]} fillOpacity={0.85} />
            <text x={tx + treeW / 2 - 8} y={treeH + 33} textAnchor="middle" fontSize={9} fill="#fff" fontWeight="700">
              {["S", "Ve", "Vi"][i % 3]}
            </text>
          </g>
        ))}
        {/* arrows to vote box */}
        {treeXs.map((tx, i) => (
          <line key={i} x1={tx + treeW / 2 - 8} y1={treeH + 40} x2={W / 2} y2={H - 20} stroke="#bbb" strokeWidth={1.5} />
        ))}
        {/* vote / final box */}
        <rect x={W / 2 - 52} y={H - 20} width={104} height={22} rx={6} fill="#fce4ec" stroke="#f48fb1" strokeWidth={1.5} />
        <text x={W / 2} y={H - 5} textAnchor="middle" fontSize={11} fill="#c62828" fontWeight="700">Majority Vote</text>
      </svg>
    );
  }

  const STAGES = [
    // ── Stage 1: Overview ──
    {
      id: "overview", group: "Overview", title: "Random Forest: wisdom of crowds",
      map: "Overview",
      why: "A single decision tree is fast but fragile — it over-fits the training data. A random forest fixes this by building many diverse trees and having them vote.",
      render: (trace) => (
        <>
          <Lead>
            A <b>Random Forest</b> is an ensemble of decision trees. Each tree is trained on a
            slightly different random subset of the data, so each makes slightly different errors.
            When they <b>vote together</b> their individual mistakes cancel out, producing a far
            more robust prediction than any single tree.
          </Lead>
          <div style={{ margin: "20px 0" }}>
            <ForestOverviewSvg />
          </div>
          <div className="tf-archwrap" style={{ marginTop: 16 }}>
            <div className="tf-arch">
              <div className="tf-arch-io">12 labelled flowers (petal length, width → species)<span>Training data</span></div>
              <div className="tf-arch-f"><b>Bootstrap sampling</b> × 3</div>
              <div className="tf-arch-row">3 overlapping subsets (sampling with replacement)</div>
              <div className="tf-arch-f"><b>Grow 1 tree per subset</b> (random feature selection at each node)</div>
              <div className="tf-arch-row">Tree 1, Tree 2, Tree 3 — each slightly different</div>
              <div className="tf-arch-f"><b>Predict with each tree</b></div>
              <div className="tf-arch-row">3 votes: e.g. [versicolor, versicolor, virginica]</div>
              <div className="tf-arch-f"><b>Majority vote</b></div>
              <div className="tf-arch-io tf-arch-io--out">Final prediction: versicolor (2/3 votes)<span>Output</span></div>
            </div>
          </div>
          <div className="tf-legend" style={{ marginTop: 16 }}>
            {[
              ["Bagging", "Bootstrap AGGregatING", "Sample with replacement → train a tree → average predictions"],
              ["Feature randomness", "√p random features per split", "Decorrelates trees so their errors don't all point the same way"],
              ["Majority vote", "Most common prediction wins", "Robust to individual tree mistakes"],
              ["OOB error", "Out-of-bag validation", "Free accuracy estimate — no separate validation set needed"],
            ].map(([sym, name, desc]) => (
              <div className="tf-leg" key={sym}>
                <div className="tf-leg-top"><span className="tf-sym">{sym}</span></div>
                <div className="tf-leg-name">{name}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>
          <Note>Use the <b>petal_len</b> and <b>petal_wid</b> sliders above — every vote, count, and confidence updates live as you move them.</Note>
        </>
      ),
    },

    // ── Stage 2: Dataset ──
    {
      id: "dataset", group: "Data", title: "The training dataset — 12 labelled flowers",
      map: "Dataset",
      why: "We need a concrete dataset to see the forest in action. We use 4 examples of each Iris species, described by just two features.",
      render: (trace) => {
        const { x } = trace;
        return (
          <>
            <Lead>
              Our training set has <b>12 flowers</b> from three Iris species, each described by
              <b> petal length</b> and <b>petal width</b> in cm. The three classes are well
              separated — setosa has tiny petals, virginica has large ones, versicolor is in between.
              The <b>pink ring</b> marks your query point.
            </Lead>
            <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
              <ScatterPlot data={RF.data} query={x} />
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "8px 0" }}>
              {CLS_NAMES.map((n, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Dot cls={i} size={10} />
                  <span style={{ fontSize: 13 }}>{n} ({RF.data.filter(d => d[2] === i).length} pts)</span>
                </div>
              ))}
            </div>
            <div className="tf-subhead">All 12 training points</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 8 }}>
              {RF.data.map((pt, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                  border: "1px solid #e0e0e0", borderRadius: 7, fontSize: 12,
                  background: "#fafafa",
                }}>
                  <span style={{ color: "#aaa", minWidth: 18 }}>#{i}</span>
                  <Dot cls={pt[2]} size={8} />
                  <span style={{ color: "#555" }}>pl={pt[0]}, pw={pt[1]}</span>
                  <span style={{ marginLeft: "auto", color: CLS_COLORS[pt[2]], fontWeight: 600, fontSize: 11 }}>
                    {CLS_NAMES[pt[2]].slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          </>
        );
      },
    },

    // ── Stage 3: Bagging ──
    {
      id: "bagging", group: "Ensemble", title: "Bootstrap sampling — building diverse training sets",
      map: "Bagging",
      why: "If every tree saw the same data it would learn the same splits and voting would be useless. Bootstrap sampling creates 3 slightly different datasets by sampling with replacement.",
      render: (trace) => (
        <>
          <Lead>
            <b>Bagging</b> (Bootstrap AGGregatING) creates <b>k different training sets</b> from
            the original data by <b>sampling with replacement</b>. Each bootstrap sample has the
            same size as the original (12 here) but some examples appear multiple times and others
            are left out — those left-out samples are called <b>out-of-bag (OOB)</b> and serve as
            a free validation set later.
          </Lead>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "16px 0" }}>
            {RF.bootstraps.map((bs, ti) => (
              <BootstrapTable key={ti} bsIdx={bs} treeId={ti + 1} data={RF.data} />
            ))}
          </div>
          <div className="tf-subhead">How bootstrap sampling works</div>
          <div className="nn-reg-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="nn-reg">
              <div className="nn-reg-h">Sampling with replacement</div>
              <p>Imagine writing each example on a slip of paper, throwing them all into a hat, drawing one, writing it down, then putting it back. Repeat 12 times. Some slips get drawn twice; some never get picked.</p>
            </div>
            <div className="nn-reg">
              <div className="nn-reg-h">Out-of-bag (OOB) samples</div>
              <p>Any example not drawn becomes an OOB sample for that tree. On average about 37% of examples are OOB per tree — they act as a built-in test set, giving us a free validation error estimate.</p>
            </div>
          </div>
          <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 8 }}>
            <b>Key insight:</b> The diversity introduced by bagging is exactly why the forest is more robust than a single tree. Each tree has slightly different biases and the ensemble averages them out.
          </div>
        </>
      ),
    },

    // ── Stage 4: Feature Randomness ──
    {
      id: "features", group: "Ensemble", title: "Feature randomness — decorrelating the trees",
      map: "Feature Rand.",
      why: "Even with different bootstrap samples, trees might all choose the same dominant feature at every split (e.g. always petal_len). Randomly restricting which features are considered prevents this.",
      render: (trace) => (
        <>
          <Lead>
            At each split, a standard decision tree considers <b>all p features</b>. A random forest
            only considers a random subset of <b>√p features</b>. With p=2 features that means
            √2 ≈ 1.4 → try roughly 1–2 features per split. This <b>decorrelates</b> the trees so
            their errors don't all go in the same direction.
          </Lead>
          <div className="tf-subhead">Feature subsets per root split (illustration)</div>
          <div style={{ overflowX: "auto", margin: "12px 0" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 320 }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Tree</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Root feature tried</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Threshold chosen</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Right-split feature</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [1, "petal_len (feature 0)", "≤ 2.4", "petal_wid ≤ 1.7"],
                  [2, "petal_len (feature 0)", "≤ 2.6", "petal_wid ≤ 1.9"],
                  [3, "petal_len (feature 0)", "≤ 2.5", "petal_len ≤ 5.2 (same feature!)"],
                ].map(([t, f, th, r2]) => (
                  <tr key={t} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "7px 12px", fontWeight: 700 }}>Tree {t}</td>
                    <td style={{ padding: "7px 12px", color: "#1565c0" }}>{f}</td>
                    <td style={{ padding: "7px 12px", fontFamily: "monospace" }}>{th}</td>
                    <td style={{ padding: "7px 12px", color: "#6a1b9a" }}>{r2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="nn-reg-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="nn-reg">
              <div className="nn-reg-h">Why different thresholds?</div>
              <p>Each tree sees a different bootstrap sample with slightly different distributions. The optimal split threshold changes depending on which examples are present.</p>
            </div>
            <div className="nn-reg">
              <div className="nn-reg-h">The decorrelation effect</div>
              <p>If all trees always used the same feature with the same threshold they'd be nearly identical — voting them together would give no benefit. The randomness ensures genuine diversity.</p>
            </div>
          </div>
          <div style={{ background: "#f3e5f5", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 8 }}>
            <b>Rule of thumb:</b> For classification use √p features per split; for regression use p/3. These defaults work well across many datasets. Both are tunable hyperparameters.
          </div>
        </>
      ),
    },

    // ── Stage 5: Tree 1 ──
    {
      id: "tree1", group: "Trees", title: "Tree 1 — trained on bootstrap sample 1",
      map: "Tree 1",
      why: "Each tree is a standard decision tree, just trained on a different bootstrap sample. Let's walk through Tree 1's structure and its prediction for the query point.",
      render: (trace) => {
        const { x, votes, paths } = trace;
        const bs = RF.bootstraps[0];
        const bsSet = new Set(bs);
        const highlight = new Set(bs);
        const path = paths[0];
        return (
          <>
            <Lead>
              Tree 1 was trained on <b>bootstrap sample 1</b> (indices {RF.bootstraps[0].join(", ")}).
              Its root split is <b>petal_len ≤ 2.4</b>. If true → setosa; else check
              <b> petal_wid ≤ 1.7</b> → versicolor or virginica.
            </Lead>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", margin: "16px 0" }}>
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Bootstrap sample 1 (highlighted)</div>
                <ScatterPlot data={RF.data} query={x} highlight={highlight} w={300} h={200} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Tree 1 structure</div>
                <TreeSvg tree={RF.trees[0]} queryLabel={votes[0]} />
              </div>
            </div>
            <div className="tf-subhead">Decision path for query point (pl={x[0]}, pw={x[1]})</div>
            <div className="nn-calc" style={{ marginTop: 8 }}>
              <div className="nn-calc-h">Tree 1 prediction path</div>
              {path.filter(s => !s.leaf).map((step, i) => (
                <div className="nn-calc-row" key={i}>
                  <span style={{ color: "#555", fontSize: 13 }}>
                    {step.node.featureName} = {fmt(step.val)} {step.goLeft ? "≤" : ">"} {step.node.threshold}
                    → go <b>{step.goLeft ? "left" : "right"}</b>
                  </span>
                </div>
              ))}
              <div className="nn-calc-row" style={{ background: CLS_COLORS[votes[0]] + "22" }}>
                <span style={{ fontWeight: 700, color: CLS_COLORS[votes[0]] }}>
                  Leaf reached → predict <Dot cls={votes[0]} /> {CLS_NAMES[votes[0]]}
                </span>
              </div>
            </div>
          </>
        );
      },
    },

    // ── Stage 6: Tree 2 & Tree 3 ──
    {
      id: "tree23", group: "Trees", title: "Trees 2 & 3 — different samples, different splits",
      map: "Trees 2 & 3",
      why: "Seeing all three trees side by side makes it clear how slight differences in training data cause different split thresholds — yet they often still agree on the final class.",
      render: (trace) => {
        const { x, votes, paths } = trace;
        return (
          <>
            <Lead>
              Trees 2 and 3 were trained on different bootstrap samples. Their split thresholds
              are slightly different from Tree 1 (2.6 and 2.5 vs 2.4 at the root). Despite these
              differences they often <b>agree on the prediction</b> for a given query point — which
              is why the ensemble is confident.
            </Lead>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "16px 0" }}>
              {[1, 2].map(ti => {
                const tree = RF.trees[ti];
                const path = paths[ti];
                return (
                  <div key={ti} style={{ flex: "1 1 200px", minWidth: 220 }}>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Tree {ti + 1} structure</div>
                    <TreeSvg tree={tree} queryLabel={votes[ti]} />
                    <div className="nn-calc" style={{ marginTop: 8 }}>
                      <div className="nn-calc-h">Tree {ti + 1} path</div>
                      {path.filter(s => !s.leaf).map((step, i) => (
                        <div className="nn-calc-row" key={i}>
                          <span style={{ fontSize: 12, color: "#555" }}>
                            {step.node.featureName} = {fmt(step.val)} {step.goLeft ? "≤" : ">"} {step.node.threshold}
                            → <b>{step.goLeft ? "left" : "right"}</b>
                          </span>
                        </div>
                      ))}
                      <div className="nn-calc-row" style={{ background: CLS_COLORS[votes[ti]] + "22" }}>
                        <span style={{ fontWeight: 700, color: CLS_COLORS[votes[ti]] }}>
                          → <Dot cls={votes[ti]} />{CLS_NAMES[votes[ti]]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="tf-subhead">Summary — all 3 trees</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {RF.trees.map((tree, ti) => (
                <div key={ti} style={{
                  border: `2px solid ${CLS_COLORS[votes[ti]]}`, borderRadius: 10,
                  padding: "10px 14px", minWidth: 130, background: CLS_COLORS[votes[ti]] + "10",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Tree {ti + 1}</div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>root: {tree.featureName} ≤ {tree.threshold}</div>
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <Dot cls={votes[ti]} size={10} />
                    <span style={{ fontWeight: 700, color: CLS_COLORS[votes[ti]], fontSize: 13 }}>
                      {CLS_NAMES[votes[ti]]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      },
    },

    // ── Stage 7: Majority Voting ──
    {
      id: "voting", group: "Prediction", title: "Majority voting — combining the 3 trees",
      map: "Voting",
      why: "The forest's prediction is simply the class that most trees voted for. This is majority voting, and it naturally suppresses individual tree errors.",
      render: (trace) => {
        const { votes, counts, label, confidence, x } = trace;
        return (
          <>
            <Lead>
              Each of the 3 trees casts one <b>vote</b> for the class it predicts at the query point
              (pl={fmt(x[0])}, pw={fmt(x[1])}). The class with the <b>most votes wins</b>.
              Confidence = votes for winner / total trees.
            </Lead>
            <div className="tf-subhead">Votes cast by each tree</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0" }}>
              {RF.trees.map((tree, ti) => (
                <div key={ti} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  border: "1px solid #e0e0e0", borderRadius: 10, padding: "8px 14px",
                  background: "#fafafa", minWidth: 160,
                }}>
                  <svg width={32} height={32}>
                    <circle cx={16} cy={16} r={13} fill={CLS_COLORS[votes[ti]]} fillOpacity={0.85} />
                    <text x={16} y={21} textAnchor="middle" fontSize={11} fill="#fff" fontWeight="700">T{ti + 1}</text>
                  </svg>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>Tree {ti + 1} votes:</div>
                    <div style={{ fontWeight: 700, color: CLS_COLORS[votes[ti]], fontSize: 14 }}>
                      <Dot cls={votes[ti]} />{CLS_NAMES[votes[ti]]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="tf-subhead">Vote tally</div>
            <VoteCounter votes={votes} counts={counts} />
            <div style={{
              background: CLS_COLORS[label] + "18",
              border: `2px solid ${CLS_COLORS[label]}`,
              borderRadius: 12, padding: "14px 20px", marginTop: 12,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <svg width={44} height={44}>
                <circle cx={22} cy={22} r={20} fill={CLS_COLORS[label]} fillOpacity={0.85} />
                <text x={22} y={28} textAnchor="middle" fontSize={13} fill="#fff" fontWeight="800">✓</text>
              </svg>
              <div>
                <div style={{ fontSize: 12, color: "#888" }}>Forest prediction</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: CLS_COLORS[label] }}>
                  <Dot cls={label} size={12} />{CLS_NAMES[label]}
                </div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                  {counts[label]}/{votes.length} votes = {fmt(confidence * 100, 1)}% confidence
                </div>
              </div>
            </div>
            <Note>Try moving the sliders to a boundary region — watch how trees start to disagree and confidence drops toward 33%.</Note>
          </>
        );
      },
    },

    // ── Stage 8: OOB Error ──
    {
      id: "oob", group: "Evaluation", title: "Out-of-bag (OOB) error — free cross-validation",
      map: "OOB Error",
      why: "A brilliant trick: every tree skips ~37% of training examples. Those skipped examples can be used to evaluate that tree — giving a nearly unbiased error estimate for free.",
      render: (trace) => {
        const { oob } = trace;
        return (
          <>
            <Lead>
              Each bootstrap sample leaves out some examples. These <b>out-of-bag (OOB)</b> examples
              were never seen by that tree during training — so we can evaluate each tree on its own
              OOB subset. Averaging over all trees gives the <b>OOB error</b>, which closely
              approximates the true test error.
            </Lead>
            <div className="tf-subhead">OOB examples per tree</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
              {RF.bootstraps.map((bs, ti) => {
                const bsSet = new Set(bs);
                const oobIdx = Array.from({ length: 12 }, (_, i) => i).filter(i => !bsSet.has(i));
                const hits = oobIdx.filter(i => {
                  const x = [RF.data[i][0], RF.data[i][1]];
                  const pred = window.ML_RF.predictTreeCls(RF.trees[ti], x).label;
                  return pred === RF.data[i][2];
                });
                const acc = oobIdx.length > 0 ? hits.length / oobIdx.length : 1;
                return (
                  <div key={ti} style={{
                    border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 14px",
                    minWidth: 160, background: "#fafafa",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Tree {ti + 1}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                      OOB indices: {oobIdx.length > 0 ? oobIdx.join(", ") : "none"}
                    </div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                      {hits.length}/{oobIdx.length} correct
                    </div>
                    <div style={{
                      marginTop: 6, padding: "4px 8px", borderRadius: 6,
                      background: acc > 0.8 ? "#e8f5e9" : "#fff3e0",
                      color: acc > 0.8 ? "#2e7d32" : "#e65100",
                      fontWeight: 700, fontSize: 13, display: "inline-block",
                    }}>
                      OOB acc: {fmt(acc * 100, 1)}%
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="nn-reg-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="nn-reg">
                <div className="nn-reg-h">Why ~37% left out?</div>
                <p>The probability that a single example is NOT drawn in n draws with replacement is (1 − 1/n)ⁿ → 1/e ≈ 0.368 as n grows. So each tree naturally leaves out about 37% of examples.</p>
              </div>
              <div className="nn-reg">
                <div className="nn-reg-h">OOB vs cross-validation</div>
                <p>OOB error closely approximates leave-one-out cross-validation error, but it's free — no extra training runs needed. With 500 trees the OOB estimate is very reliable.</p>
              </div>
            </div>
          </>
        );
      },
    },

    // ── Stage 9: Feature Importance ──
    {
      id: "importance", group: "Insights", title: "Feature importance — which inputs matter most?",
      map: "Importance",
      why: "Random forests naturally score each feature by how much it reduces impurity when used for splits. This helps understand the data and do feature selection.",
      render: (trace) => {
        const { importance } = trace;
        return (
          <>
            <Lead>
              <b>Feature importance</b> measures how much each feature contributes to reducing
              impurity (Gini or entropy) across all splits in all trees. Features used for many
              high-quality splits get high importance. RF importance is more reliable than single-tree
              importance because it averages over many trees with different bootstrap samples.
            </Lead>
            <div className="tf-subhead">Impurity-based feature importance</div>
            <ImportanceBar importance={importance} features={RF.features} />
            <div className="nn-reg-grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 12 }}>
              <div className="nn-reg">
                <div className="nn-reg-h">How it's computed</div>
                <p>For each split in each tree, record the weighted impurity reduction: Δimpurity × (samples in node / total samples). Sum these values per feature across all trees, then normalise.</p>
              </div>
              <div className="nn-reg">
                <div className="nn-reg-h">Interpretation caution</div>
                <p>Impurity-based importance can overrate high-cardinality features. For more reliable estimates use permutation importance: shuffle each feature and measure how much accuracy drops.</p>
              </div>
            </div>
            <div style={{ background: "#e3f2fd", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 8 }}>
              <b>Here:</b> petal_len dominates because it's used at the root split (biggest impurity reduction) in all 3 trees. petal_wid contributes by resolving the versicolor/virginica boundary at the second level.
            </div>
          </>
        );
      },
    },

    // ── Stage 10: Hyperparameters ──
    {
      id: "hyperparams", group: "Insights", title: "Hyperparameters & when to use Random Forest",
      map: "Hyperparams",
      why: "Knowing what levers exist — and when RF is the right tool vs a single tree or gradient boosting — completes the picture.",
      render: (trace) => (
        <>
          <Lead>
            A random forest has a handful of key hyperparameters that control the accuracy–speed
            tradeoff. Most defaults work well out of the box, making RF one of the easiest powerful
            models to deploy.
          </Lead>
          <div className="tf-subhead">Key hyperparameters</div>
          <div className="tf-legend">
            {[
              ["n_estimators", "Number of trees", "Default 100. More trees = lower variance, diminishing returns after ~200. Computational cost scales linearly."],
              ["max_features", "Features per split", "√p for classification, p/3 for regression. Smaller = more decorrelated trees but higher bias per tree."],
              ["max_depth", "Max tree depth", "Default unlimited. Limiting depth reduces overfitting and speeds training. Try 10–30."],
              ["min_samples_split", "Min samples to split", "Default 2. Higher values add regularisation, prevent noisy splits on small groups."],
              ["oob_score", "Use OOB for validation", "Free accuracy estimate — set True to enable without a separate validation set."],
              ["n_jobs", "Parallel workers", "Set -1 to use all CPU cores. Trees are independent, so RF parallelises perfectly."],
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
                "Handles mixed feature types and missing values well",
                "Naturally provides feature importance ranking",
                "Robust to outliers and noisy features",
                "Very few hyperparameters to tune — good defaults",
                "Parallelises trivially across trees",
                "Built-in OOB validation estimate",
              ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
              {[
                "Not interpretable — 100 trees can't be read like 1",
                "Slower prediction than a single decision tree",
                "Can still overfit on very noisy datasets",
                "Less accurate than gradient boosting on tabular data",
                "High memory usage with many large trees",
                "Poor at extrapolation beyond training range",
              ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✗ {t}</div>)}
            </div>
          </div>
          <div className="tf-subhead">When to choose Random Forest</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Scenario</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Need quick, robust baseline", "RF — strong defaults, hard to get badly wrong"],
                  ["Need model explanation", "Single decision tree — one tree you can read"],
                  ["Squeeze last 2% accuracy", "Gradient Boosting (XGBoost/LightGBM)"],
                  ["Very large dataset (millions of rows)", "LightGBM — faster than RF at scale"],
                  ["Feature selection / insight", "RF — reliable importance scores"],
                  ["Streaming / online learning", "Neither — both are batch algorithms"],
                ].map(([s, r], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                    <td style={{ padding: "7px 12px" }}>{s}</td>
                    <td style={{ padding: "7px 12px", fontWeight: 600, color: "#1565c0" }}>{r}</td>
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
    subtitle: "Classification — ensemble of decision trees with majority voting",
    cur: "Classification",
    category: "ML Algorithms",
    run: window.ML_RF.runRFCls,
    default: window.ML_RF.RF_CLS.default,
    modeLinks: [
      { label: "Classification", href: "Random Forest (Classification).html", active: true },
      { label: "Regression", href: "Random Forest (Regression).html", active: false },
    ],
    renderInput: (input, setInput, trace) => (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">petal_len</span>
          <input type="range" min="1.0" max="6.5" step="0.1"
            value={input.petal_len}
            onChange={e => setInput({ ...input, petal_len: parseFloat(e.target.value) })} />
          <span className="nn-slider-v">{fmt(input.petal_len)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">petal_wid</span>
          <input type="range" min="0.0" max="2.6" step="0.1"
            value={input.petal_wid}
            onChange={e => setInput({ ...input, petal_wid: parseFloat(e.target.value) })} />
          <span className="nn-slider-v">{fmt(input.petal_wid)}</span>
        </label>
        {trace && (
          <span style={{
            marginLeft: 12, padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
            background: ["#4caf50", "#2196f3", "#ff9800"][trace.label] + "22",
            color: ["#4caf50", "#2196f3", "#ff9800"][trace.label],
            border: `1.5px solid ${["#4caf50", "#2196f3", "#ff9800"][trace.label]}`,
          }}>
            {window.ML_RF.RF_CLS.labels[trace.label]} ({(trace.confidence * 100).toFixed(0)}%)
          </span>
        )}
      </>
    ),
  };
})();
