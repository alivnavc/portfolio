/* ============================================================
   Random Forest — Classification stages (11 stages)
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const RF = window.ML_RF.RF_CLS;

  const CLS_COLORS = ["#4caf50", "#2196f3", "#ff9800"];
  const CLS_NAMES = RF.labels; // ["setosa", "versicolor", "virginica"]

  /* ── tiny colour dot ── */
  function Dot({ cls, size = 8 }) {
    return (
      <span style={{
        display: "inline-block", width: size, height: size, borderRadius: "50%",
        background: CLS_COLORS[cls], marginRight: 4, verticalAlign: "middle",
        flexShrink: 0,
      }} />
    );
  }

  /* ── scatter SVG ── */
  function ScatterPlot({ data, query, w = 380, h = 260, highlight = null, boundary = null }) {
    const pad = { l: 50, r: 18, t: 18, b: 44 };
    const xMin = 1.0, xMax = 6.8, yMin = 0.0, yMax = 2.7;
    const sx = v => pad.l + ((v - xMin) / (xMax - xMin)) * (w - pad.l - pad.r);
    const sy = v => h - pad.b - ((v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);

    return (
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#ccc" strokeWidth={1} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#ccc" strokeWidth={1} />
        {[1, 2, 3, 4, 5, 6].map(v => (
          <g key={v}>
            <line x1={sx(v)} y1={h - pad.b} x2={sx(v)} y2={h - pad.b + 4} stroke="#ccc" strokeWidth={1} />
            <text x={sx(v)} y={h - pad.b + 15} textAnchor="middle" fontSize={10} fill="#888">{v}</text>
          </g>
        ))}
        {[0, 0.5, 1.0, 1.5, 2.0, 2.5].map(v => (
          <g key={v}>
            <line x1={pad.l - 4} y1={sy(v)} x2={pad.l} y2={sy(v)} stroke="#ccc" strokeWidth={1} />
            <text x={pad.l - 7} y={sy(v) + 4} textAnchor="end" fontSize={10} fill="#888">{v}</text>
          </g>
        ))}
        <text x={(pad.l + w - pad.r) / 2} y={h - 4} textAnchor="middle" fontSize={11} fill="#666">petal length (cm)</text>
        <text x={13} y={(pad.t + h - pad.b) / 2} textAnchor="middle" fontSize={11} fill="#666"
          transform={`rotate(-90,13,${(pad.t + h - pad.b) / 2})`}>petal width (cm)</text>
        {/* optional decision boundary lines */}
        {boundary && boundary.map((b, bi) => (
          <line key={bi} x1={b.x1 !== undefined ? sx(b.x1) : pad.l}
            y1={b.y1 !== undefined ? sy(b.y1) : pad.t}
            x2={b.x2 !== undefined ? sx(b.x2) : w - pad.r}
            y2={b.y2 !== undefined ? sy(b.y2) : h - pad.b}
            stroke={b.color || "#888"} strokeWidth={b.width || 1.5}
            strokeDasharray={b.dash || "none"} opacity={b.opacity || 0.8} />
        ))}
        {data.map((pt, i) => (
          <circle key={i} cx={sx(pt[0])} cy={sy(pt[1])} r={highlight ? (highlight.has(i) ? 7 : 5) : 5}
            fill={CLS_COLORS[pt[2]]}
            opacity={highlight ? (highlight.has(i) ? 1 : 0.2) : 0.85}
            stroke={highlight && highlight.has(i) ? "#222" : "none"} strokeWidth={1.5} />
        ))}
        {query && (
          <g>
            <circle cx={sx(query[0])} cy={sy(query[1])} r={9} fill="none" stroke="#e91e63" strokeWidth={2.5} strokeDasharray="3 2" />
            <circle cx={sx(query[0])} cy={sy(query[1])} r={3} fill="#e91e63" />
            <text x={sx(query[0]) + 12} y={sy(query[1]) - 7} fontSize={11} fill="#e91e63" fontWeight="600">query</text>
          </g>
        )}
      </svg>
    );
  }

  /* ── mini SVG decision tree ── */
  function TreeSvg({ tree, queryLabel, compact = false }) {
    const W = compact ? 175 : 228, H = compact ? 136 : 168;
    const midX = W / 2;
    const r = compact ? 30 : 38, r2 = compact ? 24 : 30;
    const rootY = compact ? 30 : 36;
    const midY = compact ? 84 : 102;
    const leftX = compact ? 44 : 56, rightX = compact ? W - 44 : W - 56;
    const leafY = compact ? H - 22 : H - 26;
    const leafLX = compact ? 32 : 40, leafRX = compact ? W - 32 : W - 40;
    const rightNode = tree.right;
    const hasSecondSplit = rightNode && rightNode.feature !== undefined;

    return (
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        {/* root → children edges */}
        <line x1={midX} y1={rootY + (compact ? 17 : 22)} x2={leftX} y2={midY - (compact ? 13 : 16)} stroke="#ccc" strokeWidth={1.5} />
        <line x1={midX} y1={rootY + (compact ? 17 : 22)} x2={rightX} y2={midY - (compact ? 13 : 16)} stroke="#ccc" strokeWidth={1.5} />
        {/* root node */}
        <rect x={midX - r} y={rootY - 15} width={r * 2} height={30} rx={7} fill="#f0f4ff" stroke="#7986cb" strokeWidth={1.5} />
        <text x={midX} y={rootY - 1} textAnchor="middle" fontSize={compact ? 8.5 : 9.5} fill="#283593" fontWeight="700">{tree.featureName}</text>
        <text x={midX} y={rootY + 11} textAnchor="middle" fontSize={compact ? 8 : 9} fill="#444">≤ {tree.threshold}</text>
        {/* yes / no labels */}
        <text x={(midX + leftX) / 2 - 6} y={midY - 18} textAnchor="middle" fontSize={compact ? 7.5 : 8} fill="#888">yes</text>
        <text x={(midX + rightX) / 2 + 6} y={midY - 18} textAnchor="middle" fontSize={compact ? 7.5 : 8} fill="#888">no</text>
        {/* left leaf: always setosa */}
        <rect x={leftX - r2} y={midY - 13} width={r2 * 2} height={26} rx={6} fill={CLS_COLORS[0] + "28"} stroke={CLS_COLORS[0]} strokeWidth={1.5} />
        <text x={leftX} y={midY + 5} textAnchor="middle" fontSize={compact ? 8 : 9} fill={CLS_COLORS[0]} fontWeight="700">setosa</text>
        {/* right side */}
        {hasSecondSplit ? (
          <>
            <rect x={rightX - r} y={midY - 15} width={r * 2} height={30} rx={7} fill="#f0f4ff" stroke="#7986cb" strokeWidth={1.5} />
            <text x={rightX} y={midY - 1} textAnchor="middle" fontSize={compact ? 8.5 : 9.5} fill="#283593" fontWeight="700">{rightNode.featureName}</text>
            <text x={rightX} y={midY + 11} textAnchor="middle" fontSize={compact ? 8 : 9} fill="#444">≤ {rightNode.threshold}</text>
            <line x1={rightX} y1={midY + 15} x2={leafLX + 2} y2={leafY - 12} stroke="#ccc" strokeWidth={1.5} />
            <line x1={rightX} y1={midY + 15} x2={leafRX - 2} y2={leafY - 12} stroke="#ccc" strokeWidth={1.5} />
            <rect x={leafLX - r2} y={leafY - 12} width={r2 * 2} height={24} rx={5} fill={CLS_COLORS[1] + "28"} stroke={CLS_COLORS[1]} strokeWidth={1.5} />
            <text x={leafLX} y={leafY + 4} textAnchor="middle" fontSize={compact ? 7.5 : 8.5} fill={CLS_COLORS[1]} fontWeight="700">versic.</text>
            <rect x={leafRX - r2} y={leafY - 12} width={r2 * 2} height={24} rx={5} fill={CLS_COLORS[2] + "28"} stroke={CLS_COLORS[2]} strokeWidth={1.5} />
            <text x={leafRX} y={leafY + 4} textAnchor="middle" fontSize={compact ? 7.5 : 8.5} fill={CLS_COLORS[2]} fontWeight="700">virgin.</text>
          </>
        ) : (
          <>
            <rect x={rightX - r2} y={midY - 13} width={r2 * 2} height={26} rx={6}
              fill={CLS_COLORS[rightNode.label] + "28"} stroke={CLS_COLORS[rightNode.label]} strokeWidth={1.5} />
            <text x={rightX} y={midY + 5} textAnchor="middle" fontSize={compact ? 8 : 9}
              fill={CLS_COLORS[rightNode.label]} fontWeight="700">
              {["setosa", "versic.", "virgin."][rightNode.label]}
            </text>
          </>
        )}
        {/* query vote badge */}
        {queryLabel !== undefined && (
          <g>
            <circle cx={W - 13} cy={13} r={10} fill={CLS_COLORS[queryLabel]} opacity={0.9} />
            <text x={W - 13} y={17} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="800">
              {["S", "Ve", "Vi"][queryLabel]}
            </text>
          </g>
        )}
      </svg>
    );
  }

  /* ── bootstrap sample table ── */
  function BootstrapTable({ bsIdx, treeId, data }) {
    const counts = {};
    bsIdx.forEach(i => { counts[i] = (counts[i] || 0) + 1; });
    const allIdx = Array.from({ length: data.length }, (_, i) => i);
    const oob = allIdx.filter(i => !counts[i]);
    const unique = bsIdx.filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

    return (
      <div style={{ fontSize: 12, border: "1px solid #e0e0e0", borderRadius: 9, overflow: "hidden", minWidth: 190 }}>
        <div style={{ background: "#e8eaf6", padding: "7px 10px", fontWeight: 700, fontSize: 12, borderBottom: "1px solid #d0d0d0", color: "#283593" }}>
          Tree {treeId} — bootstrap sample
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 46px 28px", gap: 0 }}>
          {["#", "pl, pw", "class", "×"].map(h => (
            <div key={h} style={{ padding: "4px 7px", background: "#f5f5f5", fontWeight: 700, fontSize: 10.5, borderBottom: "1px solid #eee", color: "#555" }}>{h}</div>
          ))}
          {unique.map(origIdx => (
            <React.Fragment key={origIdx}>
              <div style={{ padding: "3px 7px", borderBottom: "1px solid #f5f5f5", color: "#888" }}>{origIdx}</div>
              <div style={{ padding: "3px 7px", borderBottom: "1px solid #f5f5f5", color: "#555" }}>
                {data[origIdx][0]}, {data[origIdx][1]}
              </div>
              <div style={{ padding: "3px 7px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 3 }}>
                <Dot cls={data[origIdx][2]} size={6} />
                <span style={{ color: CLS_COLORS[data[origIdx][2]], fontWeight: 600 }}>{CLS_NAMES[data[origIdx][2]].slice(0, 5)}</span>
              </div>
              <div style={{ padding: "3px 7px", borderBottom: "1px solid #f5f5f5", color: "#e91e63", fontWeight: 700 }}>×{counts[origIdx]}</div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ padding: "6px 10px", background: "#fff8e1", fontSize: 11, color: "#795548" }}>
          <b>OOB:</b> idx {oob.length > 0 ? oob.join(", ") : "none"} ({oob.length}/{data.length} samples, {fmt(oob.length / data.length * 100, 0)}%)
        </div>
      </div>
    );
  }

  /* ── vote counter ── */
  function VoteCounter({ counts }) {
    const total = counts.reduce((a, b) => a + b, 0);
    const winner = counts.indexOf(Math.max(...counts));
    return (
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "12px 0" }}>
        {CLS_NAMES.map((name, ci) => (
          <div key={ci} style={{
            border: `2px solid ${CLS_COLORS[ci]}`, borderRadius: 11, padding: "10px 18px",
            background: ci === winner ? CLS_COLORS[ci] + "22" : "#fafafa",
            textAlign: "center", minWidth: 95,
            boxShadow: ci === winner ? `0 0 0 2px ${CLS_COLORS[ci]}55` : "none",
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: CLS_COLORS[ci], lineHeight: 1 }}>{counts[ci]}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 3 }}>{name}</div>
            <div style={{ fontSize: 10, color: "#aaa" }}>vote{counts[ci] !== 1 ? "s" : ""}</div>
            {ci === winner && counts[ci] > 0 && <div style={{ fontSize: 10, marginTop: 3, color: CLS_COLORS[ci], fontWeight: 700 }}>winner</div>}
          </div>
        ))}
      </div>
    );
  }

  /* ── importance bar ── */
  function ImportanceBar({ importance, features }) {
    const max = Math.max(...importance, 0.001);
    const barColors = ["#3f51b5", "#ff9800", "#4caf50"];
    return (
      <div style={{ margin: "12px 0" }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ width: 90, fontSize: 12, color: "#555", textAlign: "right", fontFamily: "monospace" }}>{f}</span>
            <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 5, height: 24, overflow: "hidden" }}>
              <div style={{
                width: `${Math.max((importance[i] / max) * 100, 4)}%`, height: "100%",
                background: barColors[i % barColors.length], borderRadius: 5,
                display: "flex", alignItems: "center", paddingLeft: 8,
                transition: "width 0.5s",
              }}>
                <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {fmt(importance[i] * 100, 1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ── forest overview SVG ── */
  function ForestOverviewSvg() {
    const W = 430, H = 200;
    const treeXs = [65, 215, 365];
    const treeW = 82, treeH = 92;

    return (
      <svg width={W} height={H} style={{ overflow: "visible", display: "block", margin: "0 auto" }}>
        {/* training data box */}
        <rect x={W / 2 - 58} y={4} width={116} height={26} rx={7} fill="#e3f2fd" stroke="#90caf9" strokeWidth={1.5} />
        <text x={W / 2} y={21} textAnchor="middle" fontSize={11} fill="#0d47a1" fontWeight="700">12 labelled flowers</text>
        {/* arrows to bootstrap */}
        {treeXs.map((tx, i) => (
          <g key={i}>
            <line x1={W / 2} y1={30} x2={tx} y2={44} stroke="#90caf9" strokeWidth={1.4} strokeDasharray="3 2" />
            <text x={tx} y={43} textAnchor="middle" fontSize={8} fill="#90caf9">bootstrap {i + 1}</text>
          </g>
        ))}
        {/* tree boxes */}
        {treeXs.map((tx, i) => (
          <g key={i}>
            <rect x={tx - treeW / 2} y={48} width={treeW} height={treeH} rx={9}
              fill="#fafafa" stroke={CLS_COLORS[i]} strokeWidth={1.8} />
            <text x={tx} y={66} textAnchor="middle" fontSize={10} fill={CLS_COLORS[i]} fontWeight="700">Tree {i + 1}</text>
            {/* simple tree icon */}
            <line x1={tx} y1={74} x2={tx - 20} y2={92} stroke="#ddd" strokeWidth={1.2} />
            <line x1={tx} y1={74} x2={tx + 20} y2={92} stroke="#ddd" strokeWidth={1.2} />
            <rect x={tx - 14} y={66} width={28} height={16} rx={4} fill="#e8eaf6" stroke="#9fa8da" strokeWidth={1} />
            <text x={tx} y={77} textAnchor="middle" fontSize={7.5} fill="#3949ab" fontWeight="600">petal_len</text>
            <text x={tx} y={86} textAnchor="middle" fontSize={7} fill="#555">≤ {[2.4, 2.6, 2.5][i]}</text>
            <rect x={tx - 24} y={92} width={18} height={13} rx={3} fill={CLS_COLORS[0] + "44"} stroke={CLS_COLORS[0]} strokeWidth={1} />
            <text x={tx - 15} y={102} textAnchor="middle" fontSize={7} fill={CLS_COLORS[0]} fontWeight="700">S</text>
            <rect x={tx + 6} y={92} width={18} height={13} rx={3} fill={CLS_COLORS[1] + "44"} stroke={CLS_COLORS[1]} strokeWidth={1} />
            <text x={tx + 15} y={102} textAnchor="middle" fontSize={7} fill={CLS_COLORS[1]} fontWeight="700">V+</text>
            {/* prediction badge */}
            <circle cx={tx} cy={154} r={12} fill={CLS_COLORS[i % 3]} opacity={0.88} />
            <text x={tx} y={158} textAnchor="middle" fontSize={9} fill="#fff" fontWeight="800">{["S", "Ve", "Vi"][i % 3]}</text>
            <text x={tx} y={172} textAnchor="middle" fontSize={9} fill="#888">votes</text>
            <line x1={tx} y1={140} x2={tx} y2={142} stroke={CLS_COLORS[i]} strokeWidth={1.2} />
          </g>
        ))}
        {/* arrows to vote box */}
        {treeXs.map((tx, i) => (
          <line key={i} x1={tx} y1={176} x2={W / 2} y2={H - 16} stroke="#ccc" strokeWidth={1.4} />
        ))}
        {/* final vote box */}
        <rect x={W / 2 - 60} y={H - 16} width={120} height={22} rx={7} fill="#fce4ec" stroke="#f48fb1" strokeWidth={1.5} />
        <text x={W / 2} y={H - 1} textAnchor="middle" fontSize={11} fill="#b71c1c" fontWeight="700">Majority Vote → class</text>
      </svg>
    );
  }

  /* ── deep single-tree vs RF boundary comparison SVG ── */
  function BoundarySvg() {
    const W = 380, H = 200;
    const pad = { l: 10, r: 10, t: 10, b: 10 };
    // Left panel: "deep DT boundary" = jagged lines
    // Right panel: "RF boundary" = smoother
    const halfW = W / 2 - 4;
    return (
      <svg width={W} height={H} style={{ overflow: "visible", display: "block", margin: "0 auto" }}>
        {/* left: deep tree */}
        <rect x={0} y={0} width={halfW} height={H} rx={7} fill="#fff3e0" stroke="#ffb74d" strokeWidth={1.2} />
        <text x={halfW / 2} y={16} textAnchor="middle" fontSize={10} fill="#e65100" fontWeight="700">Deep single tree</text>
        <text x={halfW / 2} y={29} textAnchor="middle" fontSize={9} fill="#bf360c">100% train acc, poor test</text>
        {/* jagged boundary lines */}
        <polyline points="20,50 30,50 30,70 60,70 60,55 80,55 80,75 110,75 110,60 140,60 140,80 160,80 160,55 175,55"
          fill="none" stroke="#ef5350" strokeWidth={2} strokeDasharray="4 2" />
        <polyline points="20,120 50,120 50,140 80,140 80,115 110,115 110,138 145,138 145,120 175,120"
          fill="none" stroke="#ef5350" strokeWidth={2} strokeDasharray="4 2" />
        {/* dots */}
        {[[30,45,0],[55,65,0],[90,58,0],[130,68,0],[50,115,1],[100,132,1],[140,125,1],[160,140,2],[130,170,2],[90,165,2]].map(([x,y,c],i) => (
          <circle key={i} cx={x} cy={y} r={4} fill={CLS_COLORS[c]} opacity={0.8} />
        ))}
        <text x={halfW / 2} y={H - 6} textAnchor="middle" fontSize={8.5} fill="#888">High variance, overfits noise</text>

        {/* right: RF */}
        <rect x={halfW + 8} y={0} width={halfW} height={H} rx={7} fill="#e8f5e9" stroke="#81c784" strokeWidth={1.2} />
        <text x={halfW + 8 + halfW / 2} y={16} textAnchor="middle" fontSize={10} fill="#1b5e20" fontWeight="700">Random Forest</text>
        <text x={halfW + 8 + halfW / 2} y={29} textAnchor="middle" fontSize={9} fill="#2e7d32">Smooth boundary, lower variance</text>
        {/* smoother boundary */}
        <line x1={halfW + 18} y1={90} x2={halfW + 8 + halfW - 10} y2={90} stroke="#43a047" strokeWidth={2.5} />
        <line x1={halfW + 18} y1={148} x2={halfW + 8 + halfW - 10} y2={148} stroke="#43a047" strokeWidth={2.5} />
        {[[30,45,0],[55,65,0],[90,58,0],[130,68,0],[50,115,1],[100,132,1],[140,125,1],[160,140,2],[130,170,2],[90,165,2]].map(([x,y,c],i) => (
          <circle key={i} cx={halfW + 8 + x} cy={y} r={4} fill={CLS_COLORS[c]} opacity={0.8} />
        ))}
        <text x={halfW + 8 + halfW / 2} y={H - 6} textAnchor="middle" fontSize={8.5} fill="#888">Lower variance, generalises better</text>
      </svg>
    );
  }

  /* ── OOB per-tree accuracy grid ── */
  function OOBGrid() {
    return (
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
        {RF.bootstraps.map((bs, ti) => {
          const bsSet = new Set(bs);
          const oobIdx = Array.from({ length: 12 }, (_, i) => i).filter(i => !bsSet.has(i));
          const hits = oobIdx.filter(i => {
            const xpt = [RF.data[i][0], RF.data[i][1]];
            return window.ML_RF.predictTreeCls(RF.trees[ti], xpt).label === RF.data[i][2];
          });
          const acc = oobIdx.length > 0 ? hits.length / oobIdx.length : 1;
          return (
            <div key={ti} style={{
              border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 14px",
              minWidth: 170, background: "#fafafa",
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#333" }}>Tree {ti + 1}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                OOB indices: {oobIdx.length > 0 ? oobIdx.join(", ") : "none"}
              </div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>
                {hits.length}/{oobIdx.length} correct on OOB
              </div>
              <div style={{
                marginTop: 7, padding: "5px 10px", borderRadius: 7, display: "inline-block",
                background: acc > 0.8 ? "#e8f5e9" : "#fff3e0",
                color: acc > 0.8 ? "#2e7d32" : "#e65100",
                fontWeight: 700, fontSize: 13,
              }}>
                OOB acc: {fmt(acc * 100, 1)}%
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ── variance bar for n_estimators ── */
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
                  borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 7, transition: "width 0.3s",
                }}>
                  <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{fmt(varRF, 2)}σ²</span>
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
          Using ρ = 0.38 (typical tree correlation with √p features). Formula: Var = ρσ² + (1−ρ)σ²/n
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     FOREST BUILD ANIMATION
     ════════════════════════════════════════ */

  // Fixed training points for the animation scatter plot (subset of RF.data, 12 points)
  const ANIM_POINTS = RF.data.map((pt, i) => ({ id: i, x: pt[0], y: pt[1], cls: pt[2] }));

  // Bootstrap samples for each tree (indices into ANIM_POINTS)
  const ANIM_BS = [
    [0, 1, 3, 4, 5, 7, 7, 9, 10, 11, 11, 4],   // Tree 1 — 6 unique
    [0, 2, 3, 5, 6, 8, 8, 9, 10, 11, 2, 6],    // Tree 2
    [1, 2, 4, 5, 6, 7, 9, 10, 10, 11, 1, 3],   // Tree 3
  ];

  const TREE_VOTES_ANIM = [1, 1, 2]; // versicolor, versicolor, virginica
  const VOTE_CLASS_NAMES = ["setosa", "versicolor", "virginica"];
  const PHASE_LABELS = [
    "Phase 0 — Training pool ready",
    "Phase 1 — Bootstrap sampling for Tree 1",
    "Phase 2 — Tree 1 grows from root",
    "Phase 3 — Bootstrap sampling for Tree 2",
    "Phase 4 — Tree 2 grows",
    "Phase 5 — Query point appears",
    "Phase 6 — Each tree votes",
    "Phase 7 — Vote aggregation & final answer",
  ];

  function ForestBuildAnim() {
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

    // SVG layout constants
    const W = 920, H = 500;
    const scatterX = 20, scatterY = 50, scatterW = 260, scatterH = 220;
    const xMin = 1.0, xMax = 6.8, yMin = 0.0, yMax = 2.7;
    const ssx = v => scatterX + 30 + ((v - xMin) / (xMax - xMin)) * (scatterW - 44);
    const ssy = v => scatterY + scatterH - 20 - ((v - yMin) / (yMax - yMin)) * (scatterH - 34);

    // Three tree columns (right area)
    const treeColXs = [490, 650, 810];
    const treeColY = 60;

    // OOB sets per tree
    const oobSets = ANIM_BS.map(bs => {
      const bsSet = new Set(bs);
      return ANIM_POINTS.filter(pt => !bsSet.has(pt.id)).map(pt => pt.id);
    });

    // Sampled unique indices per tree
    const sampledSets = ANIM_BS.map(bs => Array.from(new Set(bs)));

    // Query point (petal_len=4.8, petal_wid=1.4 — versicolor zone)
    const QX = 4.8, QY = 1.4;

    // Animate dots: phase 1 = tree1 bootstrap dots fly in; phase 3 = tree2; (no phase for tree3, it just appears)
    function flyingDots(treeIdx, activePhase) {
      if (phase < activePhase) return null;
      const bs = ANIM_BS[treeIdx];
      const uniqueBS = Array.from(new Set(bs));
      const tx = treeColXs[treeIdx];
      const appeared = phase >= activePhase;
      return uniqueBS.map((origIdx, si) => {
        const pt = ANIM_POINTS[origIdx];
        const destX = tx - 22 + (si % 3) * 16;
        const destY = treeColY + 10 + Math.floor(si / 3) * 14;
        const srcX = ssx(pt.x);
        const srcY = ssy(pt.y);
        const animated = appeared;
        return (
          <circle
            key={`fly-t${treeIdx}-${origIdx}-${si}`}
            cx={animated ? destX : srcX}
            cy={animated ? destY : srcY}
            r={5}
            fill={CLS_COLORS[pt.cls]}
            opacity={0.88}
            style={{
              transition: `cx ${speed * 0.45}ms ease, cy ${speed * 0.45}ms ease`,
            }}
          />
        );
      });
    }

    // Simplified 3-node SVG tree for each column
    function SimpleTreeSvg({ treeIdx, showVote }) {
      const trees = [
        { root: "petal_len", thresh: "≤ 2.4", leftCls: 0, rightCls: 1 },
        { root: "petal_len", thresh: "≤ 2.6", leftCls: 0, rightCls: 1 },
        { root: "petal_len", thresh: "≤ 2.5", leftCls: 0, rightCls: 2 },
      ];
      const t = trees[treeIdx];
      const color = CLS_COLORS[treeIdx % 3];
      const TW = 110, TH = 130;
      const mx = TW / 2;
      return (
        <svg width={TW} height={TH} style={{ overflow: "visible" }}>
          {/* root → leaf edges */}
          <line x1={mx} y1={30} x2={22} y2={72} stroke="#ccc" strokeWidth={1.3} />
          <line x1={mx} y1={30} x2={TW - 22} y2={72} stroke="#ccc" strokeWidth={1.3} />
          {/* root */}
          <rect x={mx - 34} y={8} width={68} height={26} rx={6} fill="#e8eaf6" stroke={color} strokeWidth={1.5} />
          <text x={mx} y={20} textAnchor="middle" fontSize={8} fill="#283593" fontWeight="700">{t.root}</text>
          <text x={mx} y={31} textAnchor="middle" fontSize={8} fill="#555">{t.thresh}</text>
          {/* yes/no */}
          <text x={32} y={60} textAnchor="middle" fontSize={7} fill="#aaa">yes</text>
          <text x={TW - 32} y={60} textAnchor="middle" fontSize={7} fill="#aaa">no</text>
          {/* left leaf */}
          <rect x={4} y={72} width={36} height={22} rx={5} fill={CLS_COLORS[t.leftCls] + "33"} stroke={CLS_COLORS[t.leftCls]} strokeWidth={1.3} />
          <text x={22} y={87} textAnchor="middle" fontSize={7.5} fill={CLS_COLORS[t.leftCls]} fontWeight="700">{["set.", "vers.", "virg."][t.leftCls]}</text>
          {/* right leaf */}
          <rect x={TW - 40} y={72} width={36} height={22} rx={5} fill={CLS_COLORS[t.rightCls] + "33"} stroke={CLS_COLORS[t.rightCls]} strokeWidth={1.3} />
          <text x={TW - 22} y={87} textAnchor="middle" fontSize={7.5} fill={CLS_COLORS[t.rightCls]} fontWeight="700">{["set.", "vers.", "virg."][t.rightCls]}</text>
          {/* vote badge */}
          {showVote && (
            <g style={{ opacity: 1, transition: "opacity 0.5s" }}>
              <rect x={mx - 34} y={104} width={68} height={18} rx={6}
                fill={CLS_COLORS[TREE_VOTES_ANIM[treeIdx]]} opacity={0.92} />
              <text x={mx} y={117} textAnchor="middle" fontSize={8.5} fill="#fff" fontWeight="800">
                VOTE: {VOTE_CLASS_NAMES[TREE_VOTES_ANIM[treeIdx]].slice(0, 6)}
              </text>
            </g>
          )}
        </svg>
      );
    }

    // Vote aggregation box (phase 7)
    const versicolorVotes = TREE_VOTES_ANIM.filter(v => v === 1).length;
    const virginicaVotes = TREE_VOTES_ANIM.filter(v => v === 2).length;
    const winnerCls = 1; // versicolor 2/3

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
            Phase {phase} of 7 — {PHASE_LABELS[phase]}
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

          {/* ── Left: Training scatter pool ── */}
          <text x={scatterX + scatterW / 2} y={scatterY - 6} textAnchor="middle" fontSize={11} fill="#555" fontWeight="700">Training Pool (12 flowers)</text>
          {/* axes */}
          <line x1={scatterX + 30} y1={scatterY + scatterH - 20} x2={scatterX + scatterW} y2={scatterY + scatterH - 20} stroke="#ccc" strokeWidth={1} />
          <line x1={scatterX + 30} y1={scatterY + 14} x2={scatterX + 30} y2={scatterY + scatterH - 20} stroke="#ccc" strokeWidth={1} />
          <text x={scatterX + scatterW / 2 + 10} y={scatterY + scatterH + 10} textAnchor="middle" fontSize={9} fill="#aaa">petal_len</text>
          <text x={scatterX + 10} y={scatterY + scatterH / 2} textAnchor="middle" fontSize={9} fill="#aaa"
            transform={`rotate(-90,${scatterX + 10},${scatterY + scatterH / 2})`}>petal_wid</text>

          {/* Training dots with pulse effect on phase 0 */}
          {ANIM_POINTS.map((pt, i) => {
            const cx = ssx(pt.x), cy = ssy(pt.y);
            const isOOB_t1 = oobSets[0].includes(pt.id);
            const isOOB_t2 = oobSets[1].includes(pt.id);
            const isSampled1 = sampledSets[0].includes(pt.id) && phase >= 1;
            const isSampled2 = sampledSets[1].includes(pt.id) && phase >= 3;
            const dimmed = (phase >= 1 && isOOB_t1) || (phase >= 3 && isOOB_t2);
            return (
              <g key={`pool-${i}`}>
                {phase === 0 && (
                  <circle cx={cx} cy={cy} r={9} fill="none" stroke={CLS_COLORS[pt.cls]} strokeWidth={1}
                    opacity={0.25} />
                )}
                <circle cx={cx} cy={cy} r={5.5}
                  fill={CLS_COLORS[pt.cls]}
                  opacity={dimmed ? 0.22 : 0.88}
                  stroke={dimmed ? "#bbb" : "#fff"}
                  strokeWidth={dimmed ? 0.5 : 1}
                />
                {dimmed && (
                  <text x={cx + 7} y={cy + 3} fontSize={7} fill="#bbb" fontWeight="600">OOB</text>
                )}
              </g>
            );
          })}

          {/* Query point (phase >= 5) */}
          {phase >= 5 && (
            <g style={{ opacity: phase >= 5 ? 1 : 0, transition: "opacity 0.6s" }}>
              <circle cx={ssx(QX)} cy={ssy(QY)} r={11} fill="none" stroke="#e91e63" strokeWidth={2} strokeDasharray="4 2" />
              <text x={ssx(QX)} y={ssy(QY) + 4} textAnchor="middle" fontSize={12} fill="#e91e63">★</text>
              <text x={ssx(QX) + 14} y={ssy(QY) - 8} fontSize={9} fill="#e91e63" fontWeight="700">query</text>
            </g>
          )}

          {/* ── Middle: Vote box + labels ── */}
          <text x={330} y={44} textAnchor="middle" fontSize={11} fill="#555" fontWeight="700">Voting Area</text>

          {/* Query travel lines to trees (phase 6) */}
          {phase >= 6 && treeColXs.map((tx, ti) => (
            <line key={`qline-${ti}`} x1={ssx(QX)} y1={ssy(QY)} x2={tx} y2={treeColY + 140}
              stroke={CLS_COLORS[TREE_VOTES_ANIM[ti]]} strokeWidth={1.4} strokeDasharray="5 3" opacity={0.6}
              style={{ opacity: 0.6, transition: "opacity 0.5s" }} />
          ))}

          {/* Vote aggregation (phase 7) */}
          {phase >= 7 && (
            <g style={{ opacity: 1, transition: "opacity 0.7s" }}>
              {/* vote badges flying to center */}
              {treeColXs.map((tx, ti) => (
                <g key={`vbadge-${ti}`}>
                  <circle cx={280} cy={180 + ti * 38} r={16}
                    fill={CLS_COLORS[TREE_VOTES_ANIM[ti]]} opacity={0.9} />
                  <text x={280} y={185 + ti * 38} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="800">
                    T{ti + 1}
                  </text>
                  <text x={300} y={185 + ti * 38} fontSize={9} fill={CLS_COLORS[TREE_VOTES_ANIM[ti]]} fontWeight="700">
                    {VOTE_CLASS_NAMES[TREE_VOTES_ANIM[ti]]}
                  </text>
                </g>
              ))}
              {/* vote box */}
              <rect x={220} y={290} width={160} height={64} rx={10}
                fill="#fce4ec" stroke="#e91e63" strokeWidth={2} />
              <text x={300} y={310} textAnchor="middle" fontSize={11} fill="#b71c1c" fontWeight="700">VOTE TALLY</text>
              <text x={300} y={327} textAnchor="middle" fontSize={10} fill="#555">
                Versicolor: {versicolorVotes} &nbsp; Virginica: {virginicaVotes}
              </text>
              {/* winner */}
              <rect x={225} y={335} width={150} height={26} rx={8}
                fill={CLS_COLORS[winnerCls]} opacity={0.92} />
              <text x={300} y={352} textAnchor="middle" fontSize={10.5} fill="#fff" fontWeight="900">
                FINAL: Versicolor (2/3) — 66.7%
              </text>
            </g>
          )}

          {/* ── Right area: 3 tree columns ── */}
          {treeColXs.map((tx, ti) => {
            const treePhaseShow = ti === 0 ? 2 : ti === 1 ? 4 : 4;
            const bsPhaseShow = ti === 0 ? 1 : ti === 1 ? 3 : 4;
            const showTree = phase >= treePhaseShow;
            const showBS = phase >= bsPhaseShow;

            return (
              <g key={`treecol-${ti}`}>
                {/* Tree label */}
                <text x={tx} y={treeColY - 10} textAnchor="middle" fontSize={11}
                  fill={CLS_COLORS[ti % 3]} fontWeight="700">Tree {ti + 1}</text>

                {/* Bootstrap sample mini dots */}
                {showBS && sampledSets[ti].map((origIdx, si) => {
                  const pt = ANIM_POINTS[origIdx];
                  return (
                    <circle key={`bs-t${ti}-${origIdx}`}
                      cx={tx - 24 + (si % 4) * 14}
                      cy={treeColY + 6 + Math.floor(si / 4) * 14}
                      r={4.5}
                      fill={CLS_COLORS[pt.cls]}
                      opacity={0.82}
                      style={{ transition: "opacity 0.4s" }}
                    />
                  );
                })}

                {/* OOB label */}
                {showBS && (
                  <text x={tx} y={treeColY + 46} textAnchor="middle" fontSize={8.5} fill="#aaa">
                    {oobSets[ti].length} OOB
                  </text>
                )}

                {/* Tree SVG */}
                <foreignObject x={tx - 55} y={treeColY + 56}
                  width={110} height={140}
                  style={{
                    opacity: showTree ? 1 : 0,
                    transition: "opacity 0.5s",
                  }}>
                  <div xmlns="http://www.w3.org/1999/xhtml">
                    <SimpleTreeSvg treeIdx={ti} showVote={phase >= 6} />
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* Phase description text */}
          <rect x={10} y={H - 44} width={W - 20} height={34} rx={8} fill="#f5f5f5" stroke="#e0e0e0" strokeWidth={1} />
          <text x={W / 2} y={H - 27} textAnchor="middle" fontSize={12} fill="#333" fontWeight="600">
            {PHASE_LABELS[phase]}
          </text>
          <text x={W / 2} y={H - 13} textAnchor="middle" fontSize={10} fill="#888">
            {[
              "All 12 training flowers ready — points pulse, awaiting bootstrap sampling",
              "6 points sampled with replacement → Bootstrap Sample 1. Gray points are OOB (out-of-bag).",
              "Tree 1 grows: root split (petal_len ≤ 2.4) → left leaf setosa, right leaf versicolor/virginica",
              "New bootstrap for Tree 2. Different sample → slightly different thresholds.",
              "Tree 2 and Tree 3 grow. Each learned slightly different splits from their bootstrap.",
              "A new flower (★) arrives at petal_len=4.8, petal_wid=1.4. Which species?",
              "Query travels to each tree. Tree 1 → Versicolor. Tree 2 → Versicolor. Tree 3 → Virginica.",
              "Votes fly to tally box: Versicolor 2, Virginica 1. Majority wins: VERSICOLOR (66.7% confidence).",
            ][phase]}
          </text>
        </svg>

        {/* Terminology chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {[
            ["#2196f3", "Bootstrap Sample", "Random sample with replacement — some points appear 2×, ~37% not selected"],
            ["#9e9e9e", "OOB", "Out-of-bag: points not selected — used for free validation"],
            ["#9c27b0", "Vote", "Each tree's class prediction for the query point"],
            ["#e91e63", "Majority Vote", "The class with the most votes across all trees wins"],
          ].map(([color, label, desc]) => (
            <div key={label} style={{
              display: "flex", alignItems: "flex-start", gap: 7, padding: "7px 12px",
              border: `1.5px solid ${color}33`, borderRadius: 9,
              background: color + "0d", maxWidth: 220,
            }}>
              <span style={{
                display: "inline-block", width: 10, height: 10, borderRadius: "50%",
                background: color, flexShrink: 0, marginTop: 3,
              }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 11.5, color }}>{label}</div>
                <div style={{ fontSize: 10.5, color: "#666", marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
              </div>
            </div>
          ))}
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
      id: "overview", group: "Overview", title: "Random Forest: wisdom of the crowd",
      map: "Overview",
      why: "A single decision tree is powerful but fragile — it memorises training data. A random forest fixes this by combining many diverse trees, each slightly wrong in different ways, so their errors cancel out.",
      render: () => (
        <>
          <Lead>
            Think about going to see a doctor. One doctor might give you a wrong diagnosis —
            they're human, they have biases, they might have had a bad day. Now imagine asking
            <b> 100 independent doctors</b> and taking the majority vote. The crowd is almost
            always right, even if any individual is sometimes wrong. That is the entire idea
            behind a <b>Random Forest</b>.
          </Lead>
          <Lead>
            A <b>Random Forest</b> is an <b>ensemble</b> (a collection) of decision trees, each
            trained on a slightly different <b>bootstrap sample</b> of the training data and using
            a random subset of features at every split. The key insight is that each tree makes
            different mistakes, so when they all <b>vote</b> on a prediction the mistakes cancel
            out and only the signal remains.
          </Lead>
          <Lead>
            Two ideas do the heavy lifting. First, <b>bagging</b> (Bootstrap AGGregatING): sample
            the training data with replacement to create diverse datasets. Second, <b>random feature
            selection</b>: at every split consider only √p of the p available features. This
            "decorrelates" the trees — even with different data, trees that always see the same
            dominant feature will all split on it the same way, so we randomly block features to
            force variety.
          </Lead>
          <div style={{ margin: "20px 0" }}>
            <ForestOverviewSvg />
          </div>
          <div className="tf-archwrap" style={{ marginTop: 14 }}>
            <div className="tf-arch">
              <div className="tf-arch-io">12 labelled Iris flowers (petal_len, petal_wid → species)<span>Training data</span></div>
              <div className="tf-arch-f">Bootstrap sampling × 3 (sample 12 with replacement, 3 times)</div>
              <div className="tf-arch-row">3 overlapping subsets — each with some duplicates and ~37% left out (OOB)</div>
              <div className="tf-arch-f">Grow 1 decision tree per subset (random feature subsets at each node)</div>
              <div className="tf-arch-row">Tree 1 (petal_len≤2.4) · Tree 2 (petal_len≤2.6) · Tree 3 (petal_len≤2.5)</div>
              <div className="tf-arch-f">Each tree predicts a class for the query point</div>
              <div className="tf-arch-row">votes: [versicolor, versicolor, virginica]</div>
              <div className="tf-arch-f">Majority vote — most votes wins</div>
              <div className="tf-arch-io tf-arch-io--out">versicolor (2/3 votes = 67% confidence)<span>Final prediction</span></div>
            </div>
          </div>
          <div className="tf-legend" style={{ marginTop: 14 }}>
            {[
              ["Ensemble", "Many models, one prediction", "Combining many imperfect models often outperforms any single perfect-looking model"],
              ["Bagging", "Bootstrap AGGregatING", "Sample n points with replacement to get a slightly different training set — repeat k times"],
              ["Bootstrap", "Sample with replacement", "Draw n items from n; some appear 2+×; ~37% never drawn → OOB (out-of-bag) samples"],
              ["√p trick", "Random feature subsets", "At each split consider only √p random features, decorrelating the trees"],
              ["OOB error", "Free validation", "Trees evaluate themselves on the ~37% of points they never trained on"],
              ["Majority vote", "Winner of the tally", "The class with the most votes across all trees is the forest's prediction"],
            ].map(([sym, name, desc]) => (
              <div className="tf-leg" key={sym}>
                <div className="tf-leg-top"><span className="tf-sym">{sym}</span></div>
                <div className="tf-leg-name">{name}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>
          <Note>Use the <b>petal_len</b> and <b>petal_wid</b> sliders above to move the query point. Every vote, count, and confidence value updates live as you drag.</Note>
        </>
      ),
    },

    /* ── 2. Dataset ── */
    {
      id: "dataset", group: "Data", title: "The dataset — 12 labelled Iris flowers",
      map: "Dataset",
      why: "Before building any model we need to understand the data. Three Iris species are cleanly separable by petal dimensions — making this a great sandbox to see what the forest learns.",
      render: (trace) => {
        const { x } = trace;
        return (
          <>
            <Lead>
              Our training set has <b>12 flowers</b> from three Iris species, each described by
              just two measurements: <b>petal length</b> and <b>petal width</b>, both in centimetres.
              Four examples of each species give us a small but representative dataset. The
              <b> pink ring</b> marks your query point — the flower we want to classify.
            </Lead>
            <Lead>
              Notice how the three classes form natural clusters: <span style={{ color: CLS_COLORS[0], fontWeight: 700 }}>setosa</span> has
              tiny petals (length 1.3–1.6 cm), <span style={{ color: CLS_COLORS[1], fontWeight: 700 }}>versicolor</span> is in the
              middle (4.5–5.0 cm length), and <span style={{ color: CLS_COLORS[2], fontWeight: 700 }}>virginica</span> has
              the largest petals (5.8–6.1 cm). A single decision tree would memorise these 12
              points perfectly — achieving 100% training accuracy. But does that mean it will
              generalise to new flowers? Not necessarily — we'll explore that in the next stage.
            </Lead>
            <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
              <ScatterPlot data={RF.data} query={x} />
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "6px 0 14px" }}>
              {CLS_NAMES.map((n, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Dot cls={i} size={11} />
                  <span style={{ fontSize: 13 }}>{n} ({RF.data.filter(d => d[2] === i).length} flowers)</span>
                </div>
              ))}
            </div>
            <div className="tf-subhead">All 12 training points</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 7 }}>
              {RF.data.map((pt, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                  border: "1px solid #e8e8e8", borderRadius: 8, fontSize: 12, background: "#fafafa",
                }}>
                  <span style={{ color: "#bbb", minWidth: 22 }}>#{i}</span>
                  <Dot cls={pt[2]} size={8} />
                  <span style={{ color: "#555" }}>pl={pt[0]}, pw={pt[1]}</span>
                  <span style={{ marginLeft: "auto", color: CLS_COLORS[pt[2]], fontWeight: 700, fontSize: 11 }}>
                    {CLS_NAMES[pt[2]].slice(0, 6)}
                  </span>
                </div>
              ))}
            </div>
          </>
        );
      },
    },

    /* ── 3. Problem with single trees ── */
    {
      id: "single-tree-problem", group: "Motivation", title: "The problem with single decision trees",
      map: "Single Tree ↯",
      why: "If single trees were perfect we would never need random forests. Understanding why deep trees overfit is the motivation for everything that follows.",
      render: () => (
        <>
          <Lead>
            A decision tree that is allowed to grow deep enough will eventually create a separate
            leaf for every training example — achieving <b>100% training accuracy</b>. But this is
            a trap. The tree has <b>memorised</b> the training data rather than learned the
            underlying pattern. When new flowers arrive with slightly different measurements, the
            tree's jagged, over-specific boundaries will fail.
          </Lead>
          <Lead>
            In statistical language, a deep tree has <b>high variance</b>: small changes in the
            training data lead to very different trees. This is the classic <b>bias–variance
            tradeoff</b>. A shallow tree has high bias (it misses real patterns) and low variance.
            A deep tree has low bias but high variance. Neither extreme is ideal. A random forest
            achieves <b>low bias AND low variance</b> by building many high-variance trees and
            averaging out their individual errors.
          </Lead>
          <Lead>
            Below is a conceptual comparison. The deep single tree creates a jagged decision
            boundary that hugs every training point. The random forest boundary is smoother —
            it represents what the forest collectively believes is the true boundary, not what
            any single noisy tree computed.
          </Lead>
          <BoundarySvg />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
            <div style={{ flex: "1 1 220px", padding: "12px 16px", background: "#fff3e0", borderRadius: 9, border: "1.5px solid #ffb74d" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#e65100", marginBottom: 6 }}>Deep single tree — symptoms of overfitting</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                <li>100% training accuracy (every leaf is pure)</li>
                <li>Poor test accuracy on unseen flowers</li>
                <li>Boundary hugs every training point</li>
                <li>Retrain on slightly different data → completely different tree</li>
                <li>No mechanism to know which splits are noise</li>
              </ul>
            </div>
            <div style={{ flex: "1 1 220px", padding: "12px 16px", background: "#e8f5e9", borderRadius: 9, border: "1.5px solid #81c784" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1b5e20", marginBottom: 6 }}>Random Forest — how it fixes this</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                <li>Each tree sees a different bootstrap sample</li>
                <li>Noisy splits only affect their own tree</li>
                <li>Vote averages out random errors across trees</li>
                <li>Boundary is the consensus, not a single tree's opinion</li>
                <li>OOB error gives honest test-set estimate for free</li>
              </ul>
            </div>
          </div>
          <div style={{ background: "#e3f2fd", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
            <b>Key formula:</b> If each tree has independent prediction variance σ², the average of
            B trees has variance <b>σ²/B</b>. In practice trees are correlated so it's
            ρσ² + (1−ρ)σ²/B — but still far less than σ².
          </div>
        </>
      ),
    },

    /* ── 4. Bootstrap Sampling ── */
    {
      id: "bagging", group: "Ensemble", title: "Bootstrap sampling — creating diverse training sets",
      map: "Bootstrap",
      why: "Bootstrap sampling is the engine of diversity. Without it every tree would train on the same data and vote identically — making the ensemble useless.",
      render: () => (
        <>
          <Lead>
            <b>Bootstrap sampling</b> means: take n training examples, draw n examples one at a
            time <b>with replacement</b> (put each one back before drawing the next). Some examples
            get drawn twice or three times; some never get drawn at all. Each bootstrap sample is
            slightly different from the original dataset — enough to make each trained tree
            slightly different.
          </Lead>
          <Lead>
            The magic number is roughly <b>63%</b>. The probability that a specific example is
            NOT drawn in a single bootstrap of n samples is (1 − 1/n)ⁿ, which converges to 1/e ≈
            0.368 as n grows. So about <b>36.8% of examples are left out</b> — these are the
            <b> out-of-bag (OOB)</b> samples. They form a free validation set: each tree can be
            tested on its own OOB samples without any separate held-out set.
          </Lead>
          <Lead>
            Below you can see exactly which of our 12 flowers appear in each bootstrap sample.
            The "×2" markers show which flowers were drawn twice. The yellow box shows which
            were left out (OOB). Notice that each tree sees a slightly different mix.
          </Lead>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "16px 0" }}>
            {RF.bootstraps.map((bs, ti) => (
              <BootstrapTable key={ti} bsIdx={bs} treeId={ti + 1} data={RF.data} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
            <div style={{ padding: "12px 14px", background: "#e8f5e9", borderRadius: 9, border: "1px solid #a5d6a7" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#2e7d32", marginBottom: 5 }}>Sampling with replacement — the hat analogy</div>
              <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                Write each flower on a slip of paper, throw them all in a hat. Draw one,
                note it, put it <em>back</em>. Repeat 12 times. Some slips will be drawn
                twice; some never. That's your bootstrap sample.
              </p>
            </div>
            <div style={{ padding: "12px 14px", background: "#fff8e1", borderRadius: 9, border: "1px solid #ffe082" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#f57f17", marginBottom: 5 }}>Why OOB is so valuable</div>
              <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                With 100 trees, every training example is OOB for roughly 37 trees. Those
                37 trees can predict it without ever having trained on it — giving an almost
                unbiased error estimate, equivalent to leave-one-out cross-validation.
              </p>
            </div>
          </div>
          <div style={{ background: "#f3e5f5", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 10 }}>
            <b>Probability check:</b> P(example not drawn in bootstrap of n) = (1 − 1/n)ⁿ → e⁻¹ ≈ 0.368.
            With n=12: (11/12)¹² = 0.352. About 35% are OOB per tree — confirmed by the tables above.
          </div>
        </>
      ),
    },

    /* ── 4b. Three Trees Side by Side ── */
    {
      id: "three-trees", group: "Training", title: "The 3 Decision Trees — Side by Side",
      map: "3 Trees",
      why: "Seeing all three trees simultaneously reveals how bootstrap sampling + random features produce different (decorrelated) trees from the same dataset. Each tree has learned slightly different decision rules.",
      render: () => {
        /* ── data from model ── */
        const data = RF.data;
        // Bootstrap sample info per tree
        const bsInfo = [
          { unique: 8, oob: 4 },  // bootstrap [0,0,2,3,4,5,6,6,8,9,10,11] → 9 unique, OOB: 1,7
          { unique: 9, oob: 3 },  // bootstrap [0,1,2,4,4,5,7,8,8,9,11,11] → 9 unique, OOB: 3,6,10
          { unique: 9, oob: 3 },  // bootstrap [1,2,3,3,4,6,7,8,9,10,10,11] → 10 unique, OOB: 0,5
        ];
        // Compute actual unique counts from bootstraps
        const actualInfo = RF.bootstraps.map(bs => {
          const s = new Set(bs);
          const oobCount = data.length - s.size;
          return { unique: s.size, oob: oobCount };
        });

        /* ── ThreeTreesSVG ── */
        function ThreeTreesSVG() {
          const W = 920, H = 520;
          // Column centres
          const cols = [
            { cx: 145, color: "#2196f3", headerBg: "#e3f2fd", headerStroke: "#2196f3", headerText: "#0d47a1", label: "Tree 1", treeIdx: 0 },
            { cx: 460, color: "#ff9800", headerBg: "#fff3e0", headerStroke: "#ff9800", headerText: "#e65100", label: "Tree 2", treeIdx: 1 },
            { cx: 775, color: "#4caf50", headerBg: "#e8f5e9", headerStroke: "#4caf50", headerText: "#1b5e20", label: "Tree 3", treeIdx: 2 },
          ];

          // Tree structures from model
          const trees = [
            {
              root: { feat: "petal_len", thresh: "2.40", n: 12, gini: "0.44", dist: [4, 4, 4] },
              leftLeaf: { label: "Setosa", cls: 0, n: 4, gini: "0.00" },
              rightInternal: { feat: "petal_wid", thresh: "1.70", n: 8, gini: "0.50", dist: [0, 4, 4] },
              rightLeft: { label: "Versicolor", cls: 1, n: 4, gini: "0.00" },
              rightRight: { label: "Virginica", cls: 2, n: 4, gini: "0.00" },
            },
            {
              root: { feat: "petal_len", thresh: "2.60", n: 12, gini: "0.44", dist: [4, 4, 4] },
              leftLeaf: { label: "Setosa", cls: 0, n: 4, gini: "0.00" },
              rightInternal: { feat: "petal_wid", thresh: "1.90", n: 8, gini: "0.50", dist: [0, 4, 4] },
              rightLeft: { label: "Versicolor", cls: 1, n: 5, gini: "0.00" },
              rightRight: { label: "Virginica", cls: 2, n: 3, gini: "0.00" },
            },
            {
              root: { feat: "petal_len", thresh: "2.50", n: 12, gini: "0.44", dist: [4, 4, 4] },
              leftLeaf: { label: "Setosa", cls: 0, n: 4, gini: "0.00" },
              rightInternal: { feat: "petal_len", thresh: "5.20", n: 8, gini: "0.50", dist: [0, 4, 4] },
              rightLeft: { label: "Versicolor", cls: 1, n: 4, gini: "0.00" },
              rightRight: { label: "Virginica", cls: 2, n: 4, gini: "0.00" },
            },
          ];

          const clsColors = ["#4caf50", "#2196f3", "#ff9800"];
          const clsBg = ["#e8f5e9", "#e3f2fd", "#fff3e0"];
          const clsShort = ["Setosa", "Versicol.", "Virginica"];

          // Layout constants
          const nodeW = 130, nodeH = 58;
          const leafW = 124, leafH = 52;
          const rootY = 90;
          const midY = 220;
          const leafY = 360;

          function InternalNode({ cx, cy, feat, thresh, n, gini, dist, colColor }) {
            const x = cx - nodeW / 2, y = cy - nodeH / 2;
            return (
              <g>
                <rect x={x} y={y} width={nodeW} height={nodeH} rx={8}
                  fill="#f5f7ff" stroke={colColor} strokeWidth={2} />
                <text x={cx} y={cy - 16} textAnchor="middle" fontSize={12} fontWeight="700" fill="#1a237e">
                  {feat} ≤ {thresh}
                </text>
                <text x={cx} y={cy} textAnchor="middle" fontSize={10} fill="#666">
                  n={n}, Gini={gini}
                </text>
                {/* class distribution dots */}
                <g>
                  {dist.map((count, ci) => count > 0 && Array.from({ length: Math.min(count, 4) }).map((_, di) => (
                    <circle
                      key={`${ci}-${di}`}
                      cx={cx - 18 + ci * 14 + di * 3}
                      cy={cy + 16}
                      r={4}
                      fill={clsColors[ci]}
                      opacity={0.85}
                    />
                  )))}
                </g>
              </g>
            );
          }

          function LeafNode({ cx, cy, label, cls, n, gini }) {
            const x = cx - leafW / 2, y = cy - leafH / 2;
            return (
              <g>
                <rect x={x} y={y} width={leafW} height={leafH} rx={8}
                  fill={clsBg[cls]} stroke={clsColors[cls]} strokeWidth={2} />
                <text x={cx} y={cy - 10} textAnchor="middle" fontSize={13} fontWeight="800" fill={clsColors[cls]}>
                  → {label}
                </text>
                <text x={cx} y={cy + 8} textAnchor="middle" fontSize={10} fill="#666">
                  n={n}, Gini={gini}
                </text>
              </g>
            );
          }

          function ConnectorLine({ x1, y1, x2, y2, color, label, labelSide }) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            return (
              <g>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} />
                <text
                  x={labelSide === "left" ? midX - 10 : midX + 10}
                  y={midY}
                  textAnchor={labelSide === "left" ? "end" : "start"}
                  fontSize={11}
                  fontWeight="700"
                  fill={color}
                >{label}</text>
              </g>
            );
          }

          return (
            <svg width={W} height={H} style={{ display: "block", border: "1px solid #e0e0e0", borderRadius: 12, background: "#fefefe", overflow: "visible" }}>
              {cols.map((col, ci) => {
                const t = trees[ci];
                const cx = col.cx;

                // Node centres
                const rootCx = cx, rootCy = rootY;
                const leftLeafCx = cx - 140, leftLeafCy = midY;
                const rightInternalCx = cx + 110, rightInternalCy = midY;
                const rightLeftCx = cx + 30, rightLeftCy = leafY;
                const rightRightCx = cx + 185, rightRightCy = leafY;

                // Header band
                const colLeft = ci === 0 ? 4 : ci === 1 ? 310 : 624;
                const colRight = ci === 0 ? 296 : ci === 1 ? 606 : 916;
                const colWidth = colRight - colLeft;

                return (
                  <g key={ci}>
                    {/* Column header */}
                    <rect x={colLeft} y={4} width={colWidth} height={36} rx={8}
                      fill={col.headerBg} stroke={col.headerStroke} strokeWidth={1.5} />
                    <text x={cx} y={27} textAnchor="middle" fontSize={14} fontWeight="800" fill={col.headerText}>
                      {col.label} — bootstrap {col.treeIdx + 1}
                    </text>

                    {/* Edges: root → left leaf */}
                    <ConnectorLine
                      x1={rootCx - nodeW / 4} y1={rootCy + nodeH / 2}
                      x2={leftLeafCx} y2={leftLeafCy - leafH / 2}
                      color="#4caf50" label="≤" labelSide="left"
                    />
                    {/* Edges: root → right internal */}
                    <ConnectorLine
                      x1={rootCx + nodeW / 4} y1={rootCy + nodeH / 2}
                      x2={rightInternalCx} y2={rightInternalCy - nodeH / 2}
                      color="#ef5350" label=">" labelSide="right"
                    />
                    {/* Edges: right internal → right-left leaf */}
                    <ConnectorLine
                      x1={rightInternalCx - nodeW / 4} y1={rightInternalCy + nodeH / 2}
                      x2={rightLeftCx} y2={rightLeftCy - leafH / 2}
                      color="#4caf50" label="≤" labelSide="left"
                    />
                    {/* Edges: right internal → right-right leaf */}
                    <ConnectorLine
                      x1={rightInternalCx + nodeW / 4} y1={rightInternalCy + nodeH / 2}
                      x2={rightRightCx} y2={rightRightCy - leafH / 2}
                      color="#ef5350" label=">" labelSide="right"
                    />

                    {/* Nodes */}
                    <InternalNode
                      cx={rootCx} cy={rootCy}
                      feat={t.root.feat} thresh={t.root.thresh}
                      n={t.root.n} gini={t.root.gini} dist={t.root.dist}
                      colColor={col.color}
                    />
                    <LeafNode
                      cx={leftLeafCx} cy={leftLeafCy}
                      label={t.leftLeaf.label} cls={t.leftLeaf.cls}
                      n={t.leftLeaf.n} gini={t.leftLeaf.gini}
                    />
                    <InternalNode
                      cx={rightInternalCx} cy={rightInternalCy}
                      feat={t.rightInternal.feat} thresh={t.rightInternal.thresh}
                      n={t.rightInternal.n} gini={t.rightInternal.gini} dist={t.rightInternal.dist}
                      colColor={col.color}
                    />
                    <LeafNode
                      cx={rightLeftCx} cy={rightLeftCy}
                      label={t.rightLeft.label} cls={t.rightLeft.cls}
                      n={t.rightLeft.n} gini={t.rightLeft.gini}
                    />
                    <LeafNode
                      cx={rightRightCx} cy={rightRightCy}
                      label={t.rightRight.label} cls={t.rightRight.cls}
                      n={t.rightRight.n} gini={t.rightRight.gini}
                    />

                    {/* Bootstrap info below tree */}
                    <rect x={colLeft + 8} y={leafY + 40} width={colWidth - 16} height={38} rx={6}
                      fill={col.headerBg} stroke={col.headerStroke} strokeWidth={1} opacity={0.7} />
                    <text x={cx} y={leafY + 57} textAnchor="middle" fontSize={11} fill={col.headerText} fontWeight="600">
                      Bootstrap sample: n={actualInfo[ci].unique} unique
                    </text>
                    <text x={cx} y={leafY + 72} textAnchor="middle" fontSize={10} fill="#888">
                      OOB: {actualInfo[ci].oob} point{actualInfo[ci].oob !== 1 ? "s" : ""} left out
                    </text>
                  </g>
                );
              })}

              {/* Annotation row */}
              {[
                { x: 145, text1: "Tree 1: uses petal_len + petal_wid", text2: "(both features at different levels)", color: "#0d47a1" },
                { x: 460, text1: "Tree 2: uses petal_len + petal_wid", text2: "(different thresholds from Bootstrap 2)", color: "#e65100" },
                { x: 775, text1: "Tree 3: uses petal_len TWICE", text2: "(random subset excluded petal_wid at right!)", color: "#1b5e20" },
              ].map((ann, i) => (
                <g key={i}>
                  <text x={ann.x} y={leafY + 100} textAnchor="middle" fontSize={11} fontWeight="700" fill={ann.color}>{ann.text1}</text>
                  <text x={ann.x} y={leafY + 114} textAnchor="middle" fontSize={10} fill="#777" fontStyle="italic">{ann.text2}</text>
                </g>
              ))}

              {/* Column dividers */}
              <line x1={305} y1={4} x2={305} y2={H - 10} stroke="#e0e0e0" strokeWidth={1} strokeDasharray="4 3" />
              <line x1={615} y1={4} x2={615} y2={H - 10} stroke="#e0e0e0" strokeWidth={1} strokeDasharray="4 3" />

              {/* Legend */}
              <g transform={`translate(10, ${H - 28})`}>
                <circle cx={8} cy={8} r={6} fill="#4caf50" />
                <text x={18} y={12} fontSize={10} fill="#555">Green line + "≤" = left branch (condition true)</text>
                <circle cx={250} cy={8} r={6} fill="#ef5350" />
                <text x={260} y={12} fontSize={10} fill="#555">Red line + "&gt;" = right branch (condition false)</text>
                <rect x={480} y={2} width={12} height={12} rx={2} fill="#e8f5e9" stroke="#4caf50" strokeWidth={1} />
                <text x={496} y={12} fontSize={10} fill="#555">Leaf = final class prediction</text>
              </g>
            </svg>
          );
        }

        return (
          <>
            <Lead>
              Here are all three trees from our random forest, drawn <b>side by side at full size</b>.
              Each column is one complete decision tree — from root split at the top down to the
              class-prediction leaves at the bottom. The trees look similar because they're trained on
              the same Iris data, but look carefully at the <b>thresholds</b> and <b>features</b>:
              they differ in ways that matter.
            </Lead>
            <Lead>
              Tree 3 is the most revealing: its right subtree splits on <b>petal_len again</b> instead
              of petal_wid. At that node, the random feature subset drew only {"{"}petal_len{"}"} — so it
              had no choice but to split on it. This is the √p trick in action: forcing the tree to
              use a suboptimal feature occasionally, which decorrelates the forest.
            </Lead>
            <div style={{ overflowX: "auto", margin: "16px 0" }}>
              <ThreeTreesSVG />
            </div>
            <div style={{ background: "#e8f5e9", border: "2px solid #4caf50", borderRadius: 10, padding: "14px 18px", margin: "16px 0", fontSize: 13, lineHeight: 1.7 }}>
              <b style={{ color: "#1b5e20", fontSize: 14 }}>Key insight — decorrelation in action:</b><br />
              Notice how Tree 3 never asks about <b>petal_width</b> at its second split — petal_length
              was drawn twice by the random feature selector at that node. This is how Random Forest
              <b> decorrelates</b> its trees. Correlated trees give you little benefit from averaging
              (variance formula: ρσ² + (1−ρ)σ²/B — if ρ→1, the B in the denominator disappears and
              you gain nothing). Decorrelated trees each catch different patterns in the data, so their
              errors cancel rather than compound.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0" }}>
              {[
                ["#2196f3", "Tree 1", "petal_len ≤ 2.40 → setosa, then petal_wid ≤ 1.70 → vers./virg."],
                ["#ff9800", "Tree 2", "petal_len ≤ 2.60 → setosa, then petal_wid ≤ 1.90 → vers./virg."],
                ["#4caf50", "Tree 3", "petal_len ≤ 2.50 → setosa, then petal_len ≤ 5.20 → vers./virg. (uses petal_len again!)"],
              ].map(([color, label, desc]) => (
                <div key={label} style={{
                  flex: "1 1 200px", padding: "10px 14px", borderRadius: 9,
                  border: `2px solid ${color}`, background: color + "10",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </>
        );
      },
    },

    /* ── 5. Random Feature Subsets ── */
    {
      id: "features", group: "Ensemble", title: "Random feature subsets — decorrelating the trees",
      map: "√p Trick",
      why: "Even with different bootstrap samples, trees would always split on the same dominant feature. Restricting features at each split forces genuine diversity.",
      render: () => (
        <>
          <Lead>
            Here's a subtle but critical point: even if we give each tree a different bootstrap
            sample, if there is one very dominant feature (like petal_len here), every tree will
            split on that feature at the root. The trees will still be highly correlated —
            averaging correlated things gives almost no variance reduction.
          </Lead>
          <Lead>
            The fix is the <b>√p trick</b>: at each split, randomly select √p features from the p
            available features and only consider those. With p = 2 features here, √2 ≈ 1.4, so
            each split considers about 1–2 features. This forces some splits to use petal_wid
            even at the root, creating trees with genuinely different structures — they are
            <b> decorrelated</b>.
          </Lead>
          <Lead>
            Why does decorrelation matter so much? Variance of an average of B identically
            correlated (correlation ρ) variables is ρσ² + (1−ρ)σ²/B. If ρ = 1 (perfectly
            correlated trees), this simplifies to σ² — no improvement at all. If ρ = 0
            (independent trees), it's σ²/B — perfect improvement. Feature randomness pushes
            ρ toward 0, giving us most of the benefit.
          </Lead>
          <div className="tf-subhead">Feature subsets used by each tree (from the model)</div>
          <div style={{ overflowX: "auto", margin: "12px 0" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 340 }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  {["Tree", "Root feature", "Root threshold", "Right-child feature", "Effect"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #e0e0e0", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  [1, "petal_len (0)", "≤ 2.4", "petal_wid ≤ 1.7", "Uses both features"],
                  [2, "petal_len (0)", "≤ 2.6", "petal_wid ≤ 1.9", "Uses both features"],
                  [3, "petal_len (0)", "≤ 2.5", "petal_len ≤ 5.2", "Uses petal_len again!"],
                ].map(([t, f, th, r2, eff]) => (
                  <tr key={t} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "7px 12px", fontWeight: 700, color: CLS_COLORS[t - 1] }}>Tree {t}</td>
                    <td style={{ padding: "7px 12px", color: "#283593", fontFamily: "monospace" }}>{f}</td>
                    <td style={{ padding: "7px 12px", fontFamily: "monospace" }}>{th}</td>
                    <td style={{ padding: "7px 12px", color: "#6a1b9a", fontFamily: "monospace" }}>{r2}</td>
                    <td style={{ padding: "7px 12px", color: "#555", fontSize: 12 }}>{eff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
            <div style={{ padding: "12px 14px", background: "#e3f2fd", borderRadius: 9, border: "1px solid #90caf9" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0d47a1", marginBottom: 5 }}>√p for classification</div>
              <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                Standard default. With p=10 features: only 3 considered per split. This is
                enough for good splits while ensuring trees are diverse.
              </p>
            </div>
            <div style={{ padding: "12px 14px", background: "#f9fbe7", borderRadius: 9, border: "1px solid #dce775" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#558b2f", marginBottom: 5 }}>Why not use all features?</div>
              <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                If we did, every tree would split on petal_len at the root (it's the best
                feature by far). All trees would be nearly identical — voting would give no
                benefit over a single tree.
              </p>
            </div>
          </div>
        </>
      ),
    },

    /* ── 6. Training 3 trees ── */
    {
      id: "trees", group: "Trees", title: "Training 3 trees — different samples, different splits",
      map: "3 Trees",
      why: "Seeing the structure of all three trees side by side reveals both the similarities (same overall logic) and differences (slightly different thresholds) that make the ensemble effective.",
      render: (trace) => {
        const { x, votes, paths } = trace;
        return (
          <>
            <Lead>
              Each of our 3 trees is a standard classification decision tree, trained on its own
              bootstrap sample. At each node it tried random feature subsets and chose the split
              that maximally reduced <b>Gini impurity</b>. The root of all three trees uses
              petal_len — it's the most discriminative feature — but the <b>threshold differs</b>
              (2.4, 2.6, 2.5) because each tree saw slightly different data.
            </Lead>
            <Lead>
              Tree 3 is the most interesting: its right child splits on petal_len again rather
              than petal_wid. This happened because in its bootstrap sample the petal_len split
              was still more informative than petal_wid at that node — a direct consequence of
              which points appeared (and how many times) in that bootstrap.
            </Lead>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "16px 0" }}>
              {RF.trees.map((tree, ti) => (
                <div key={ti} style={{ flex: "1 1 200px", minWidth: 210 }}>
                  <div style={{ fontSize: 12, color: CLS_COLORS[ti], fontWeight: 700, marginBottom: 6 }}>
                    Tree {ti + 1} — bootstrap {RF.bootstraps[ti].join(",").slice(0, 20)}…
                  </div>
                  <TreeSvg tree={tree} queryLabel={votes[ti]} />
                  <div className="nn-calc" style={{ marginTop: 8 }}>
                    <div className="nn-calc-h">Path for pl={fmt(x[0])}, pw={fmt(x[1])}</div>
                    {paths[ti].filter(s => !s.leaf).map((step, si) => (
                      <div className="nn-calc-row" key={si}>
                        <span style={{ fontSize: 12, color: "#555" }}>
                          {step.node.featureName} = {fmt(step.val)} {step.goLeft ? "≤" : ">"} {step.node.threshold}
                          → <b style={{ color: "#333" }}>{step.goLeft ? "left" : "right"}</b>
                        </span>
                      </div>
                    ))}
                    <div className="nn-calc-row" style={{ background: CLS_COLORS[votes[ti]] + "22" }}>
                      <span style={{ fontWeight: 700, color: CLS_COLORS[votes[ti]] }}>
                        <Dot cls={votes[ti]} /> Predict: {CLS_NAMES[votes[ti]]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="tf-subhead">Summary — all 3 trees on this query</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {RF.trees.map((tree, ti) => (
                <div key={ti} style={{
                  border: `2px solid ${CLS_COLORS[votes[ti]]}`, borderRadius: 10,
                  padding: "10px 14px", minWidth: 138, background: CLS_COLORS[votes[ti]] + "10",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Tree {ti + 1}</div>
                  <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>root: {tree.featureName} ≤ {tree.threshold}</div>
                  <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 6 }}>
                    <Dot cls={votes[ti]} size={10} />
                    <span style={{ fontWeight: 800, color: CLS_COLORS[votes[ti]], fontSize: 14 }}>
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

    /* ── 6b. Forest Animation ── */
    {
      id: "forest-animation", group: "Training", title: "Watch the Forest Grow — Animated",
      map: "Forest Animation",
      why: "Seeing bootstrap sampling, tree growth, and majority voting in motion builds intuition for how the forest assembles a collective decision from individual weak learners.",
      render: () => <ForestBuildAnim />,
    },

    /* ── 7. Majority Vote ── */
    {
      id: "voting", group: "Prediction", title: "Majority voting — combining all 3 votes",
      map: "Vote",
      why: "Majority voting is the simplest possible aggregation: each tree gets one vote, the class with the most votes wins. It naturally suppresses individual tree errors.",
      render: (trace) => {
        const { votes, counts, label, confidence, x } = trace;
        return (
          <>
            <Lead>
              Each of the 3 trees casts exactly <b>one vote</b> for the class it predicts at the
              query point (petal_len = {fmt(x[0])}, petal_wid = {fmt(x[1])}). The class with the
              most votes is the forest's final prediction. Ties are broken by the smallest class
              index (rare with an odd number of trees).
            </Lead>
            <Lead>
              <b>Confidence</b> = (votes for winner) / (total trees). Here with 3 trees the only
              possible confidences are 33% (1-2 split, winner), 67% (2-1 split), and 100% (all
              agree). With 100 trees you get a finer-grained confidence from 0% to 100%.
            </Lead>
            <div className="tf-subhead">Votes cast by each tree</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0" }}>
              {RF.trees.map((tree, ti) => (
                <div key={ti} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  border: `2px solid ${CLS_COLORS[votes[ti]]}`, borderRadius: 11,
                  padding: "9px 14px", background: CLS_COLORS[votes[ti]] + "10", minWidth: 170,
                }}>
                  <svg width={34} height={34}>
                    <circle cx={17} cy={17} r={14} fill={CLS_COLORS[votes[ti]]} opacity={0.88} />
                    <text x={17} y={22} textAnchor="middle" fontSize={11} fill="#fff" fontWeight="800">T{ti + 1}</text>
                  </svg>
                  <div>
                    <div style={{ fontSize: 11, color: "#888" }}>Tree {ti + 1} votes for:</div>
                    <div style={{ fontWeight: 800, color: CLS_COLORS[votes[ti]], fontSize: 14, display: "flex", alignItems: "center" }}>
                      <Dot cls={votes[ti]} size={9} />{CLS_NAMES[votes[ti]]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="tf-subhead">Vote tally</div>
            <VoteCounter counts={counts} />
            {/* SVG vote bar */}
            <svg width={300} height={60} style={{ display: "block", margin: "4px 0 14px" }}>
              {CLS_NAMES.map((name, ci) => {
                const barW = (counts[ci] / votes.length) * 280;
                return (
                  <g key={ci}>
                    <rect x={10} y={ci * 18 + 4} width={Math.max(barW, 2)} height={14} rx={4}
                      fill={CLS_COLORS[ci]} opacity={0.85} />
                    <text x={10 + Math.max(barW, 2) + 5} y={ci * 18 + 15} fontSize={10} fill={CLS_COLORS[ci]} fontWeight="700">
                      {name}: {counts[ci]}/{votes.length}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div style={{
              background: CLS_COLORS[label] + "18", border: `2px solid ${CLS_COLORS[label]}`,
              borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16,
            }}>
              <svg width={46} height={46}>
                <circle cx={23} cy={23} r={21} fill={CLS_COLORS[label]} opacity={0.88} />
                <text x={23} y={29} textAnchor="middle" fontSize={14} fill="#fff" fontWeight="900">✓</text>
              </svg>
              <div>
                <div style={{ fontSize: 12, color: "#777" }}>Forest final prediction</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: CLS_COLORS[label] }}>
                  <Dot cls={label} size={13} />{CLS_NAMES[label]}
                </div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                  {counts[label]}/{votes.length} votes = <b>{fmt(confidence * 100, 1)}%</b> confidence
                </div>
              </div>
            </div>
            <Note>Drag the sliders to the versicolor/virginica boundary region (petal_len ≈ 5.0–5.5). Watch confidence drop toward 33% as trees start disagreeing.</Note>
          </>
        );
      },
    },

    /* ── 8. OOB Error ── */
    {
      id: "oob", group: "Evaluation", title: "Out-of-bag (OOB) error — free cross-validation",
      map: "OOB Error",
      why: "OOB error is one of the cleverest tricks in machine learning: you get a nearly unbiased test error estimate without ever holding out a separate validation set.",
      render: (trace) => {
        const { oob } = trace;
        return (
          <>
            <Lead>
              Here is the beautiful trick: each tree was trained on a bootstrap sample that left
              out roughly 37% of the training data. Those left-out points — the <b>out-of-bag
              (OOB) samples</b> — were never seen by that tree. So we can use that tree to predict
              on its OOB points and measure its accuracy. This gives an honest, unbiased error
              estimate — no separate test set needed.
            </Lead>
            <Lead>
              To get the <b>overall OOB error</b>: for each training example, collect predictions
              from all trees for which it was OOB (it will be OOB for about 37% of trees). Take
              the majority vote of those predictions and compare to the true label. Average these
              per-example errors across all training examples. This is statistically equivalent
              to leave-one-out cross-validation but costs no extra computation.
            </Lead>
            <div className="tf-subhead">OOB accuracy per tree</div>
            <OOBGrid />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
              <div style={{ padding: "12px 14px", background: "#e8f5e9", borderRadius: 9, border: "1px solid #a5d6a7" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#2e7d32", marginBottom: 5 }}>Why 37% left out?</div>
                <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  P(not drawn once) = (1 − 1/n). P(not drawn in n draws) = (1 − 1/n)ⁿ → e⁻¹ ≈ 0.368.
                  For n=12: (11/12)¹² ≈ 0.35. So each tree leaves out roughly 4 of our 12 flowers.
                </p>
              </div>
              <div style={{ padding: "12px 14px", background: "#e3f2fd", borderRadius: 9, border: "1px solid #90caf9" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0d47a1", marginBottom: 5 }}>OOB vs k-fold cross-validation</div>
                <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  With 100+ trees, each example is OOB for ~37 trees. The OOB estimate
                  closely approximates leave-one-out CV accuracy — which would require n
                  separate model fits. Here it's completely free.
                </p>
              </div>
            </div>
            <div style={{ background: "#fce4ec", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 10 }}>
              <b>In sklearn:</b> set <code style={{ background: "#f8bbd0", padding: "1px 5px", borderRadius: 3 }}>oob_score=True</code> in RandomForestClassifier to get <code style={{ background: "#f8bbd0", padding: "1px 5px", borderRadius: 3 }}>model.oob_score_</code> — a free validation accuracy with zero extra computation.
            </div>
          </>
        );
      },
    },

    /* ── 9. Feature Importance ── */
    {
      id: "importance", group: "Insights", title: "Feature importance — which inputs matter most?",
      map: "Importance",
      why: "Random forests naturally produce a ranking of how useful each feature was. This is more reliable than from a single tree because it averages over many trees and bootstrap samples.",
      render: (trace) => {
        const { importance } = trace;
        return (
          <>
            <Lead>
              <b>Impurity-based feature importance</b> measures how much each feature reduced
              Gini impurity (or entropy) when used for splits, weighted by the fraction of
              samples at each node, and averaged across all trees. Features used at roots of
              many trees (where the most samples pass through) get the highest scores.
            </Lead>
            <Lead>
              The formula for a single tree is: importance(feature f) = Σ_splits_on_f
              [n_node/n_total × ΔGini]. Sum over all trees and normalise to sum to 1. RF
              importance is more reliable than single-tree importance because it is averaged
              over many bootstrap samples — individual splits on noisy features get averaged
              out rather than dominating.
            </Lead>
            <div className="tf-subhead">Normalised feature importance (across all 3 trees)</div>
            <ImportanceBar importance={importance} features={RF.features} />
            {/* SVG bar chart version */}
            <svg width={340} height={90} style={{ display: "block", margin: "8px 0 16px" }}>
              {RF.features.map((f, i) => {
                const barH = importance[i] * 160;
                const barX = 60 + i * 120;
                const color = i === 0 ? "#3f51b5" : "#ff9800";
                return (
                  <g key={i}>
                    <rect x={barX} y={80 - barH} width={70} height={barH} rx={5} fill={color} opacity={0.85} />
                    <text x={barX + 35} y={80 - barH - 5} textAnchor="middle" fontSize={11} fill={color} fontWeight="700">
                      {fmt(importance[i] * 100, 1)}%
                    </text>
                    <text x={barX + 35} y={92} textAnchor="middle" fontSize={10} fill="#555">{f}</text>
                  </g>
                );
              })}
            </svg>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: "12px 14px", background: "#e8eaf6", borderRadius: 9, border: "1px solid #9fa8da" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#283593", marginBottom: 5 }}>Why petal_len dominates</div>
                <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  All 3 trees use petal_len at the root (biggest node — all 12 samples
                  pass through). Root splits get the highest importance weight (n_node/n_total = 1).
                  petal_wid only appears at the right child where fewer samples remain.
                </p>
              </div>
              <div style={{ padding: "12px 14px", background: "#fff3e0", borderRadius: 9, border: "1px solid #ffcc80" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#e65100", marginBottom: 5 }}>Caution: impurity bias</div>
                <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  High-cardinality features (many unique values) tend to get inflated
                  importance even if they aren't truly predictive. Use <b>permutation
                  importance</b> (shuffle feature → measure accuracy drop) for a fairer comparison.
                </p>
              </div>
            </div>
          </>
        );
      },
    },

    /* ── 10. Missing Values & Outliers ── */
    {
      id: "robustness", group: "Insights", title: "Missing values & outliers — why RF is robust",
      map: "Robustness",
      why: "Random forests have practical advantages for messy real-world data that single trees and many other models don't share.",
      render: () => (
        <>
          <Lead>
            In production, data is rarely clean. Features are missing, there are measurement
            errors, and outliers abound. Random forests handle all of these much better than
            most other models — and better than single decision trees.
          </Lead>
          <Lead>
            <b>Missing values:</b> A simple approach is median/mode imputation before training.
            A more sophisticated approach uses the RF itself: after initial training, use the
            tree proximity matrix (two examples are close if they end up in the same leaf across
            many trees) to impute missing values based on nearby examples. This is called
            <b> proximity-based imputation</b> and often outperforms simple median/mode.
          </Lead>
          <Lead>
            <b>Outliers:</b> An outlier affects at most one leaf in any given tree. Since the
            tree boundary is determined by thresholds (not distances), a single extreme point
            can only influence predictions in its own leaf. Across 100 trees the outlier
            "wins" in its leaf perhaps 100 times, but across all leaves it's one of many —
            and the vote averages it out. Compare this to linear regression where one outlier
            pulls the entire hyperplane.
          </Lead>
          <div className="tf-subhead">Outlier robustness — numerical example</div>
          <div className="nn-calc" style={{ marginTop: 8 }}>
            <div className="nn-calc-h">Query: petal_len = 4.5, petal_wid = 1.5 (true class: versicolor)</div>
            <div className="nn-calc-row">
              <span style={{ color: "#555", fontSize: 13 }}>Tree 1 (trained with an outlier duplicate in its bootstrap): votes <b style={{ color: CLS_COLORS[2] }}>virginica</b></span>
            </div>
            <div className="nn-calc-row">
              <span style={{ color: "#555", fontSize: 13 }}>Tree 2 (no outlier in its bootstrap): votes <b style={{ color: CLS_COLORS[1] }}>versicolor</b></span>
            </div>
            <div className="nn-calc-row">
              <span style={{ color: "#555", fontSize: 13 }}>Tree 3 (no outlier in its bootstrap): votes <b style={{ color: CLS_COLORS[1] }}>versicolor</b></span>
            </div>
            <div className="nn-calc-row" style={{ background: CLS_COLORS[1] + "18" }}>
              <span style={{ fontWeight: 700, color: CLS_COLORS[1] }}>
                Final: versicolor (2/3) — outlier's influence absorbed by the vote
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div style={{ padding: "12px 14px", background: "#e8f5e9", borderRadius: 9, border: "1px solid #a5d6a7" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#2e7d32", marginBottom: 5 }}>Good defaults for missing data</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                <li>Median imputation for continuous features</li>
                <li>Mode imputation for categorical features</li>
                <li>RF proximity imputation (most accurate)</li>
                <li>Some implementations support native NaN handling</li>
              </ul>
            </div>
            <div style={{ padding: "12px 14px", background: "#e3f2fd", borderRadius: 9, border: "1px solid #90caf9" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0d47a1", marginBottom: 5 }}>When outlier robustness breaks</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                <li>Extreme outliers in a small dataset (few examples per leaf)</li>
                <li>Target variable outliers (regression): average is pulled up</li>
                <li>Outliers in the majority of bootstrap samples (they all see it)</li>
              </ul>
            </div>
          </div>
        </>
      ),
    },

    /* ── 11. Hyperparameters & When to Use ── */
    {
      id: "hyperparams", group: "Insights", title: "Hyperparameters & when to choose Random Forest",
      map: "Hyperparams",
      why: "Knowing what levers exist — and when RF is the right tool — completes the picture. RF is often the best default ensemble but it's not always the best choice.",
      render: () => (
        <>
          <Lead>
            One of Random Forest's greatest practical advantages is that it works well
            <b> out of the box</b>. The defaults are robust across a huge range of datasets.
            You rarely need to tune more than n_estimators. Compare this to gradient boosting,
            which has many interacting hyperparameters that require careful tuning.
          </Lead>
          <Lead>
            The most important hyperparameter is <b>n_estimators</b> (number of trees). More
            trees always helps up to a point — then accuracy plateaus but compute keeps growing.
            In practice 100–500 trees covers most use cases. The relationship is diminishing
            returns: going from 1 to 10 trees dramatically cuts error; going from 100 to 200
            barely moves the needle.
          </Lead>
          <div className="tf-subhead">Variance vs number of trees (ρ = 0.38, σ² = 1)</div>
          <VarianceBarChart />
          <div className="tf-subhead" style={{ marginTop: 14 }}>Key hyperparameters</div>
          <div className="tf-legend">
            {[
              ["n_estimators", "Number of trees", "100 default. More = lower variance, diminishing returns after ~200. Linearly increases compute."],
              ["max_features", "Features per split", "'sqrt' for classification (default). Try 'log2' for more diversity. Fewer = more decorrelated trees but higher per-tree bias."],
              ["max_depth", "Max tree depth", "None (unlimited) by default. Limiting to 10–30 speeds training and reduces memory. RF is robust — shallow trees still work in an ensemble."],
              ["min_samples_split", "Min samples to split", "Default 2. Increase to 5–20 for regularisation on small/noisy datasets."],
              ["bootstrap", "Use bootstrapping", "True by default. Set False to train each tree on the full dataset — removes OOB and reduces diversity."],
              ["oob_score", "Compute OOB accuracy", "Set True for free validation accuracy. Uses minimal extra memory and zero extra training time."],
              ["n_jobs", "Parallel CPU cores", "-1 to use all cores. Trees are 100% independent, so RF parallelises perfectly — near-linear speedup."],
              ["class_weight", "Handle imbalance", "'balanced' adjusts sample weights to account for class imbalance. Important for skewed datasets."],
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
                "Works well out of the box — robust defaults",
                "Reliable feature importance built in",
                "Handles mixed types, missing values, outliers",
                "OOB validation — no separate test set needed",
                "Trivially parallelises — each tree is independent",
                "Low risk of catastrophic failure",
                "No feature scaling required",
              ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
              {[
                "Not interpretable — 100 trees can't be read like one",
                "Slower prediction than a single tree",
                "High memory: stores all n_estimators trees in RAM",
                "Cannot extrapolate beyond training range",
                "Less accurate than XGBoost/LightGBM on tabular data",
                "Poor at sparse data (text, high-dim one-hot encodings)",
              ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✗ {t}</div>)}
            </div>
          </div>
          <div className="tf-subhead">Decision guide</div>
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
                  ["Need a quick, robust baseline", "Random Forest", "Strong defaults, hard to get badly wrong"],
                  ["Need model explanation", "Single decision tree", "One tree you can actually read"],
                  ["Squeeze last 2–3% accuracy", "XGBoost / LightGBM", "Sequential boosting beats bagging on most tabular data"],
                  ["Very large dataset (millions of rows)", "LightGBM", "Histogram-based splits are far faster than RF at scale"],
                  ["Feature selection / insight", "Random Forest", "Reliable importance from many bootstrap samples"],
                  ["Class imbalance", "RF with class_weight='balanced'", "Easy built-in correction; alternatives: SMOTE, cost-sensitive"],
                  ["Online / streaming data", "Hoeffding trees, SGD", "RF requires retraining the whole forest for new data"],
                  ["Very high-dimensional sparse data", "Linear model / SVM", "RF struggles with many near-zero features (text, one-hot)"],
                ].map(([s, r, why], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                    <td style={{ padding: "7px 12px" }}>{s}</td>
                    <td style={{ padding: "7px 12px", fontWeight: 700, color: "#1565c0" }}>{r}</td>
                    <td style={{ padding: "7px 12px", color: "#666", fontSize: 12 }}>{why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 12 }}>
            <b>Quick start:</b>{" "}
            <code style={{ background: "#c8e6c9", padding: "2px 6px", borderRadius: 3, fontFamily: "monospace" }}>
              from sklearn.ensemble import RandomForestClassifier; clf = RandomForestClassifier(n_estimators=100, oob_score=True, n_jobs=-1)
            </code>
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
            marginLeft: 12, padding: "4px 13px", borderRadius: 20, fontSize: 13, fontWeight: 700,
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
