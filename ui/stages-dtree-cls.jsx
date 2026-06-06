/* Decision Tree — Classification stages */
(function () {
  const { Lead, Note, Row, Formula, Tag, fmt } = window;
  const { DT_CLS, runDTreeCls, gini } = window.ML_DTREE;

  // ── Color helpers ──
  const CLASS_COLORS = ["#2B5BFF", "#1f9e6b", "#e0492e"];
  const CLASS_NAMES  = ["setosa", "versicolor", "virginica"];
  const CLASS_BG     = ["rgba(43,91,255,.13)", "rgba(31,158,107,.13)", "rgba(224,73,46,.13)"];

  // ── SVG Tree Diagram ──
  function TreeDiagram({ highlightPath, showCounts, showGini }) {
    // Node positions
    const nodes = {
      root:  { x: 220, y: 60,  label: "petal_len ≤ 2.5", gini: "0.665", samples: 12 },
      left:  { x: 100, y: 165, label: "setosa", gini: "0.000", samples: 4, leaf: true, cls: 0 },
      right: { x: 340, y: 165, label: "petal_wid ≤ 1.8", gini: "0.500", samples: 8 },
      rl:    { x: 260, y: 270, label: "versicolor", gini: "0.000", samples: 4, leaf: true, cls: 1 },
      rr:    { x: 420, y: 270, label: "virginica",  gini: "0.000", samples: 4, leaf: true, cls: 2 },
    };

    // highlightPath is an array of edges: [{from, to}]
    const isEdgeActive = (from, to) => {
      if (!highlightPath) return false;
      return highlightPath.some(e => e.from === from && e.to === to);
    };
    const isNodeActive = (id) => {
      if (!highlightPath) return false;
      return highlightPath.some(e => e.to === id || (e.from === id && id === "root"));
    };

    function NodeBox({ id, n }) {
      const active = isNodeActive(id);
      const fill   = n.leaf ? CLASS_BG[n.cls] : "var(--panel-solid)";
      const stroke = active ? "var(--accent)" : (n.leaf ? CLASS_COLORS[n.cls] : "var(--line)");
      const sw     = active ? 2.5 : 1.5;
      const w = n.leaf ? 96 : 130;
      const h = showCounts ? 52 : 38;

      return (
        <g>
          <rect
            x={n.x - w/2} y={n.y - h/2} width={w} height={h} rx="8"
            fill={fill} stroke={stroke} strokeWidth={sw}
          />
          {active && (
            <rect
              x={n.x - w/2 - 3} y={n.y - h/2 - 3} width={w + 6} height={h + 6} rx="10"
              fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 2" opacity="0.5"
            />
          )}
          <text x={n.x} y={showCounts ? n.y - 9 : n.y + (showGini ? -5 : 4)}
            textAnchor="middle" fontSize="11" fontWeight="700"
            fill={n.leaf ? CLASS_COLORS[n.cls] : "var(--ink)"}>
            {n.label}
          </text>
          {showCounts && (
            <text x={n.x} y={n.y + 9} textAnchor="middle" fontSize="10" fill="var(--muted)">
              n={n.samples}
            </text>
          )}
          {showGini && (
            <text x={n.x} y={showCounts ? n.y + 23 : n.y + 10}
              textAnchor="middle" fontSize="9.5" fill="var(--faint)">
              gini={n.gini}
            </text>
          )}
        </g>
      );
    }

    function Edge({ from, to, label, labelSide }) {
      const a = nodes[from], b = nodes[to];
      const active = isEdgeActive(from, to);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const lx = labelSide === "left" ? mx - 18 : mx + 18;
      return (
        <g>
          <line
            x1={a.x} y1={a.y + 20} x2={b.x} y2={b.y - 20}
            stroke={active ? "var(--accent)" : "var(--line)"}
            strokeWidth={active ? 2.5 : 1.5}
            strokeDasharray={active ? "0" : "0"}
          />
          <text x={lx} y={my} textAnchor="middle" fontSize="10" fontWeight="700"
            fill={active ? "var(--accent)" : "var(--faint)"}>
            {label}
          </text>
        </g>
      );
    }

    const svgH = showCounts ? 320 : 300;
    return (
      <svg viewBox={`0 0 520 ${svgH}`} style={{ width:"100%", maxWidth:520, height:"auto",
        border:"1px solid var(--line)", borderRadius:14, background:"var(--panel-solid)",
        boxShadow:"var(--shadow)", display:"block" }}>
        <Edge from="root" to="left"  label="YES" labelSide="left" />
        <Edge from="root" to="right" label="NO"  labelSide="right" />
        <Edge from="right" to="rl"   label="YES" labelSide="left" />
        <Edge from="right" to="rr"   label="NO"  labelSide="right" />
        <NodeBox id="root"  n={nodes.root}  />
        <NodeBox id="left"  n={nodes.left}  />
        <NodeBox id="right" n={nodes.right} />
        <NodeBox id="rl"    n={nodes.rl}    />
        <NodeBox id="rr"    n={nodes.rr}    />
        {/* Legend */}
        {CLASS_NAMES.map((c, i) => (
          <g key={i} transform={`translate(${18 + i * 130}, ${svgH - 22})`}>
            <rect width="10" height="10" rx="3" fill={CLASS_COLORS[i]} />
            <text x="14" y="9" fontSize="10" fill="var(--muted)">{c}</text>
          </g>
        ))}
      </svg>
    );
  }

  // ── Scatter Plot ──
  function ScatterPlot({ input, highlightQuery }) {
    const W = 420, H = 280;
    const pad = { l: 46, r: 18, t: 18, b: 38 };
    const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;

    const xMin = 0, xMax = 7.5, yMin = 0, yMax = 3;
    const sx = v => pad.l + ((v - xMin) / (xMax - xMin)) * pw;
    const sy = v => pad.t + ph - ((v - yMin) / (yMax - yMin)) * ph;

    const data = DT_CLS.data;
    const qx = input ? input.petal_len : null;
    const qy = input ? input.petal_wid : null;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart">
        {/* grid lines */}
        {[1,2,3,4,5,6,7].map(v => (
          <line key={v} x1={sx(v)} y1={pad.t} x2={sx(v)} y2={pad.t+ph}
            stroke="var(--line)" strokeWidth="1" />
        ))}
        {[0.5,1,1.5,2,2.5].map(v => (
          <line key={v} x1={pad.l} y1={sy(v)} x2={pad.l+pw} y2={sy(v)}
            stroke="var(--line)" strokeWidth="1" />
        ))}
        {/* Decision boundaries */}
        <line x1={sx(2.5)} y1={pad.t} x2={sx(2.5)} y2={pad.t+ph}
          stroke={CLASS_COLORS[0]} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />
        <line x1={sx(2.5)} y1={sy(1.8)} x2={pad.l+pw} y2={sy(1.8)}
          stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />
        {/* Data points */}
        {data.map((d, i) => (
          <circle key={i} cx={sx(d[0])} cy={sy(d[1])} r="5"
            fill={CLASS_COLORS[d[2]]} opacity="0.85"
            stroke="var(--panel-solid)" strokeWidth="1.5" />
        ))}
        {/* Query point */}
        {qx !== null && (
          <g>
            <circle cx={sx(qx)} cy={sy(qy)} r="9"
              fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.5" />
            <text x={sx(qx)} y={sy(qy)+4} textAnchor="middle" fontSize="11" fontWeight="800"
              fill="var(--accent)">★</text>
          </g>
        )}
        {/* Axes */}
        <line x1={pad.l} y1={pad.t+ph} x2={pad.l+pw} y2={pad.t+ph} stroke="var(--faint)" strokeWidth="1" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t+ph} stroke="var(--faint)" strokeWidth="1" />
        {/* Axis labels */}
        <text x={pad.l+pw/2} y={H-4} textAnchor="middle" className="reg-axl">petal_len (cm)</text>
        <text x="10" y={pad.t+ph/2} textAnchor="middle" className="reg-axl"
          transform={`rotate(-90,10,${pad.t+ph/2})`}>petal_wid (cm)</text>
        {[1,2,3,4,5,6,7].map(v => (
          <text key={v} x={sx(v)} y={pad.t+ph+14} textAnchor="middle" className="reg-axl">{v}</text>
        ))}
        {[0,1,2].map(v => (
          <text key={v} x={pad.l-6} y={sy(v)+4} textAnchor="end" className="reg-axl">{v}</text>
        ))}
      </svg>
    );
  }

  // ── Gini Bar ──
  function GiniBar({ counts, label }) {
    const g = gini(counts);
    const n = counts.reduce((a,b)=>a+b,0);
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0" }}>
        <span style={{ width:110, fontSize:12, color:"var(--muted)", textAlign:"right" }}>{label}</span>
        <div style={{ flex:1, height:18, background:"var(--line-soft)", borderRadius:6, overflow:"hidden", maxWidth:200 }}>
          <div style={{ width:`${g*100}%`, height:"100%",
            background:"linear-gradient(90deg,var(--accent),var(--neon))", borderRadius:6,
            transition:"width .4s" }} />
        </div>
        <span style={{ fontFamily:"var(--num-font)", fontSize:12, color:"var(--accent-ink)", width:40 }}>
          {fmt(g)}
        </span>
        <span style={{ fontSize:11, color:"var(--faint)" }}>
          n={n}, [{counts.join(",")}]
        </span>
      </div>
    );
  }

  // ── Decision Regions SVG ──
  function DecisionRegions({ input }) {
    const W = 420, H = 280;
    const pad = { l: 46, r: 18, t: 18, b: 38 };
    const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    const xMin = 0, xMax = 7.5, yMin = 0, yMax = 3;
    const sx = v => pad.l + ((v - xMin)/(xMax - xMin)) * pw;
    const sy = v => pad.t + ph - ((v - yMin)/(yMax - yMin)) * ph;
    const bx = sx(2.5), ly = sy(1.8);
    const data = DT_CLS.data;
    const qx = input ? input.petal_len : null;
    const qy = input ? input.petal_wid : null;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart">
        {/* Region 1: setosa (left of boundary) */}
        <rect x={pad.l} y={pad.t} width={bx - pad.l} height={ph}
          fill={CLASS_BG[0]} />
        {/* Region 2: versicolor (right, top half) */}
        <rect x={bx} y={ly} width={pad.l+pw - bx} height={pad.t+ph - ly}
          fill={CLASS_BG[1]} />
        {/* Region 3: virginica (right, bottom half) */}
        <rect x={bx} y={pad.t} width={pad.l+pw - bx} height={ly - pad.t}
          fill={CLASS_BG[2]} />
        {/* Boundary lines */}
        <line x1={bx} y1={pad.t} x2={bx} y2={pad.t+ph}
          stroke={CLASS_COLORS[0]} strokeWidth="2" />
        <line x1={bx} y1={ly} x2={pad.l+pw} y2={ly}
          stroke="var(--accent)" strokeWidth="2" />
        {/* Region labels */}
        <text x={(pad.l+bx)/2} y={pad.t+ph/2} textAnchor="middle"
          fontSize="11" fontWeight="700" fill={CLASS_COLORS[0]} opacity="0.7">setosa</text>
        <text x={(bx+pad.l+pw)/2} y={(ly+pad.t+ph)/2} textAnchor="middle"
          fontSize="11" fontWeight="700" fill={CLASS_COLORS[1]} opacity="0.7">versicolor</text>
        <text x={(bx+pad.l+pw)/2} y={(pad.t+ly)/2} textAnchor="middle"
          fontSize="11" fontWeight="700" fill={CLASS_COLORS[2]} opacity="0.7">virginica</text>
        {/* Threshold labels */}
        <text x={bx+3} y={pad.t+12} fontSize="9.5" fill={CLASS_COLORS[0]} fontWeight="700">
          petal_len=2.5
        </text>
        <text x={bx+3} y={ly-4} fontSize="9.5" fill="var(--accent)" fontWeight="700">
          petal_wid=1.8
        </text>
        {/* Data points */}
        {data.map((d, i) => (
          <circle key={i} cx={sx(d[0])} cy={sy(d[1])} r="5"
            fill={CLASS_COLORS[d[2]]} stroke="var(--panel-solid)" strokeWidth="1.5" />
        ))}
        {/* Query */}
        {qx !== null && (
          <text x={sx(qx)} y={sy(qy)+4} textAnchor="middle" fontSize="12" fontWeight="800"
            fill="var(--accent)" stroke="white" strokeWidth="3" paintOrder="stroke">★</text>
        )}
        {/* Axes */}
        <line x1={pad.l} y1={pad.t+ph} x2={pad.l+pw} y2={pad.t+ph} stroke="var(--faint)" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t+ph} stroke="var(--faint)" />
        <text x={pad.l+pw/2} y={H-4} textAnchor="middle" className="reg-axl">petal_len</text>
        <text x="10" y={pad.t+ph/2} textAnchor="middle" className="reg-axl"
          transform={`rotate(-90,10,${pad.t+ph/2})`}>petal_wid</text>
        {[1,2,3,4,5,6,7].map(v => (
          <text key={v} x={sx(v)} y={pad.t+ph+14} textAnchor="middle" className="reg-axl">{v}</text>
        ))}
      </svg>
    );
  }

  // ── Path helper: build edge list from trace.path ──
  function buildPathEdges(path) {
    if (!path || path.length === 0) return [];
    const edges = [];
    // First node is always root
    let prev = "root";
    for (let i = 0; i < path.length; i++) {
      const step = path[i];
      if (step.leaf) {
        // last leaf — mark it active
        edges.push({ from: prev, to: prev, leafActive: true });
        break;
      }
      const goLeft = step.goLeft;
      if (i === 0) {
        // root split
        const to = goLeft ? "left" : "right";
        edges.push({ from: "root", to });
        prev = to;
      } else {
        // right subtree split
        const to = goLeft ? "rl" : "rr";
        edges.push({ from: "right", to });
        prev = to;
      }
    }
    // Also push root itself
    edges.push({ from: "root", to: "root" });
    return edges;
  }

  // ── Stage render helpers ──
  const S = {
    card: (children, style) => (
      <div style={{ background:"var(--panel-solid)", border:"1px solid var(--line)",
        borderRadius:14, padding:"16px 18px", boxShadow:"var(--shadow)",
        marginBottom:14, ...style }}>
        {children}
      </div>
    ),
    row: (children) => (
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-start", margin:"10px 0" }}>
        {children}
      </div>
    ),
  };

  const STAGES = [
    // ── Stage 1: Overview ──
    {
      id: "cls-overview", group: "Overview", title: "What is a Decision Tree?",
      map: "Overview",
      why: "A decision tree is one of the most interpretable ML models — it makes decisions by asking yes/no questions about features, just like a flow chart.",
      render: (trace) => (
        <>
          <Lead>
            A <b>decision tree</b> classifies inputs by routing them through a series of
            <b> binary questions</b> ("is feature X ≤ threshold?"). At each <b>internal node</b>
            the tree tests one feature. The path ends at a <b>leaf node</b> that gives the
            predicted class. This tree classifies iris flowers by petal measurements.
          </Lead>
          <div className="tf-subhead">Tree structure</div>
          <div style={{ display:"flex", gap:24, flexWrap:"wrap", alignItems:"flex-start" }}>
            <TreeDiagram showCounts={true} showGini={true} />
            <div style={{ maxWidth:280 }}>
              <div className="tf-legend" style={{ gridTemplateColumns:"1fr" }}>
                {[
                  ["Internal node", "Tests one feature against a threshold. Routes left (YES) or right (NO)."],
                  ["Leaf node", "Terminal node — returns the majority class of its training samples."],
                  ["Gini impurity", "Measures how mixed the classes are at a node (0 = pure, 0.5 = max impurity)."],
                  ["Samples", "How many training examples reached this node."],
                ].map(([n,d]) => (
                  <div className="tf-leg" key={n}>
                    <div className="tf-leg-name">{n}</div>
                    <div className="tf-leg-desc">{d}</div>
                  </div>
                ))}
              </div>
              <div className="tf-lifecycle" style={{ marginTop:12 }}>
                <div className="tf-life tf-life--train">
                  <div className="tf-life-h"><span>T</span><span>Training</span></div>
                  <p>Find the best split at each node by minimizing weighted Gini impurity. Recurse until leaves are pure or stopping criteria met.</p>
                </div>
                <div className="tf-life tf-life--infer">
                  <div className="tf-life-h"><span>I</span><span>Inference</span></div>
                  <p>Route the input down the tree, answering each split question. Return the leaf's class label.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ),
    },

    // ── Stage 2: Dataset ──
    {
      id: "cls-dataset", group: "Overview", title: "The Training Dataset",
      map: "Dataset",
      why: "Understanding the data distribution helps us see why the tree splits where it does — the three flower classes are linearly separable in petal space.",
      render: (trace) => (
        <>
          <Lead>
            Our toy dataset has <b>12 iris flowers</b> described by 2 features:
            <b> petal length</b> and <b>petal width</b>. There are 3 classes
            (4 samples each). The star ★ marks the <b>current query point</b>
            from the sliders above.
          </Lead>
          {S.row(
            <>
              <ScatterPlot input={trace.input} />
              <div>
                <div className="tf-subhead">Dataset summary</div>
                <table style={{ borderCollapse:"collapse", fontSize:12.5 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid var(--line)" }}>
                      {["#","petal_len","petal_wid","class"].map(h => (
                        <th key={h} style={{ padding:"4px 10px", textAlign:"left",
                          color:"var(--faint)", fontWeight:700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DT_CLS.data.map((d, i) => (
                      <tr key={i} style={{ borderBottom:"1px solid var(--line-soft)",
                        background: i % 2 === 0 ? "var(--line-soft)" : "transparent" }}>
                        <td style={{ padding:"3px 10px", fontFamily:"var(--num-font)", color:"var(--faint)" }}>{i+1}</td>
                        <td style={{ padding:"3px 10px", fontFamily:"var(--num-font)", color:"var(--ink)" }}>{d[0]}</td>
                        <td style={{ padding:"3px 10px", fontFamily:"var(--num-font)", color:"var(--ink)" }}>{d[1]}</td>
                        <td style={{ padding:"3px 10px" }}>
                          <span style={{ color: CLASS_COLORS[d[2]], fontWeight:700, fontSize:11 }}>
                            {CLASS_NAMES[d[2]]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Note>Use the sliders (petal_len, petal_wid) in the header to move the ★ query point.</Note>
              </div>
            </>
          )}
        </>
      ),
    },

    // ── Stage 3: Gini Impurity ──
    {
      id: "cls-gini", group: "Math", title: "Gini Impurity",
      map: "Gini",
      why: "The tree chooses splits that maximize class purity. Gini impurity quantifies impurity — lower is better. A pure node (all one class) has Gini = 0.",
      render: () => (
        <>
          <Lead>
            <b>Gini impurity</b> measures how often a randomly chosen element would be
            incorrectly classified. For a node with class probabilities p₀, p₁, …:
          </Lead>
          <Formula label="Gini">
            Gini = 1 − Σᵢ pᵢ²
          </Formula>
          <div className="tf-subhead">Visual examples</div>
          <div style={{ maxWidth:580 }}>
            <GiniBar counts={[12, 0, 0]} label="All setosa" />
            <GiniBar counts={[6, 6, 0]}  label="50/50 mix" />
            <GiniBar counts={[4, 4, 4]}  label="Equal 3-way" />
            <GiniBar counts={[4, 0, 0]}  label="Root left leaf" />
            <GiniBar counts={[0, 4, 0]}  label="Root right-left" />
            <GiniBar counts={[0, 0, 4]}  label="Root right-right" />
          </div>
          <div className="tf-subhead">Root node Gini calculation</div>
          {S.card(
            <div className="nn-calc">
              <div className="nn-calc-h">Root node: 12 samples, 4 of each class</div>
              <div className="nn-calc-row">p₀ = 4/12 = 0.333 → p₀² = 0.111</div>
              <div className="nn-calc-row">p₁ = 4/12 = 0.333 → p₁² = 0.111</div>
              <div className="nn-calc-row">p₂ = 4/12 = 0.333 → p₂² = 0.111</div>
              <div className="nn-calc-row"><b>Gini = 1 − (0.111 + 0.111 + 0.111) = 1 − 0.333 = <span style={{color:"var(--accent)"}}>0.665</span></b></div>
            </div>
          )}
          <Note>A Gini of 0.665 means the root is quite impure — the three classes are evenly mixed. The tree's job is to find splits that reduce this impurity.</Note>
        </>
      ),
    },

    // ── Stage 4: Best Split Search ──
    {
      id: "cls-split", group: "Math", title: "Finding the Best Split",
      map: "Best Split",
      why: "For each feature and each possible threshold, we compute the weighted Gini of the two child nodes. The split with the lowest weighted Gini wins.",
      render: () => {
        // Compute weighted Gini for petal_len thresholds
        const data = DT_CLS.data;
        const thresholds = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5];
        const results = thresholds.map(t => {
          const left  = data.filter(d => d[0] <= t);
          const right = data.filter(d => d[0] >  t);
          const lc = [0,1,2].map(c => left.filter(d => d[2]===c).length);
          const rc = [0,1,2].map(c => right.filter(d => d[2]===c).length);
          const gl = gini(lc), gr = gini(rc);
          const wg = (left.length * gl + right.length * gr) / data.length;
          return { t, nl: left.length, nr: right.length, gl, gr, wg };
        });

        const minWg = Math.min(...results.map(r => r.wg));
        const W = 460, H = 180, padL = 50, padR = 15, padT = 20, padB = 40;
        const pw = W - padL - padR, ph = H - padT - padB;
        const xi = (i) => padL + (i / (results.length - 1)) * pw;
        const yv = (v) => padT + ph - (v / 0.7) * ph;

        return (
          <>
            <Lead>
              We try every possible threshold for <b>petal_len</b>. For each, we measure
              the <b>weighted Gini</b> = (n_left/n)×Gini_left + (n_right/n)×Gini_right.
              Lower is better. The best split is at <b>petal_len ≤ 2.5</b>.
            </Lead>
            <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart" style={{marginBottom:12}}>
              <polyline
                points={results.map((r,i) => `${xi(i)},${yv(r.wg)}`).join(" ")}
                fill="none" stroke="var(--accent)" strokeWidth="2" />
              {results.map((r, i) => (
                <g key={i}>
                  <circle cx={xi(i)} cy={yv(r.wg)} r={r.wg === minWg ? 7 : 4}
                    fill={r.wg === minWg ? "var(--accent)" : "var(--line)"}
                    stroke="var(--panel-solid)" strokeWidth="1.5" />
                  {r.wg === minWg && (
                    <text x={xi(i)} y={yv(r.wg)-12} textAnchor="middle"
                      fontSize="10" fontWeight="800" fill="var(--accent)">
                      best: {r.t}
                    </text>
                  )}
                  <text x={xi(i)} y={padT+ph+14} textAnchor="middle"
                    fontSize="9" fill="var(--faint)">{r.t}</text>
                </g>
              ))}
              {/* y-axis labels */}
              {[0, 0.2, 0.4, 0.6].map(v => (
                <g key={v}>
                  <line x1={padL-3} y1={yv(v)} x2={padL} y2={yv(v)}
                    stroke="var(--faint)" />
                  <text x={padL-6} y={yv(v)+4} textAnchor="end"
                    fontSize="9" fill="var(--faint)">{v}</text>
                </g>
              ))}
              <line x1={padL} y1={padT} x2={padL} y2={padT+ph} stroke="var(--faint)" />
              <line x1={padL} y1={padT+ph} x2={padL+pw} y2={padT+ph} stroke="var(--faint)" />
              <text x={padL+pw/2} y={H-4} textAnchor="middle" className="reg-axl">
                petal_len threshold
              </text>
              <text x={13} y={padT+ph/2} textAnchor="middle" className="reg-axl"
                transform={`rotate(-90,13,${padT+ph/2})`}>weighted Gini</text>
            </svg>

            <div className="tf-subhead">All thresholds table</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ borderCollapse:"collapse", fontSize:12, width:"100%", maxWidth:580 }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--line)" }}>
                    {["Threshold","n_left","n_right","Gini_left","Gini_right","Weighted Gini"].map(h => (
                      <th key={h} style={{ padding:"5px 10px", textAlign:"right",
                        color:"var(--faint)", fontWeight:700, fontSize:11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.t} style={{
                      background: r.wg === minWg ? "var(--accent-soft)" : "transparent",
                      borderBottom:"1px solid var(--line-soft)"
                    }}>
                      <td style={{ padding:"4px 10px", fontFamily:"var(--num-font)", fontWeight: r.wg===minWg?800:400,
                        color: r.wg===minWg?"var(--accent-ink)":"var(--ink)" }}>{r.t}</td>
                      <td style={{ padding:"4px 10px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{r.nl}</td>
                      <td style={{ padding:"4px 10px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{r.nr}</td>
                      <td style={{ padding:"4px 10px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{fmt(r.gl, 3)}</td>
                      <td style={{ padding:"4px 10px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{fmt(r.gr, 3)}</td>
                      <td style={{ padding:"4px 10px", fontFamily:"var(--num-font)", textAlign:"right", fontWeight:700,
                        color: r.wg===minWg?"var(--accent-ink)":"var(--ink)" }}>{fmt(r.wg, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      },
    },

    // ── Stage 5: Information Gain ──
    {
      id: "cls-gain", group: "Math", title: "Information Gain",
      map: "Info Gain",
      why: "Information Gain is the flip side of weighted Gini — how much impurity we remove by making a split. Higher gain = better split.",
      render: () => (
        <>
          <Lead>
            <b>Information Gain</b> = Parent Gini − Weighted Child Ginis. A split with
            high gain removes a lot of impurity. This is what the tree maximizes.
          </Lead>
          <Formula label="Gain">
            Gain = Gini(parent) − [n_L/n × Gini(L) + n_R/n × Gini(R)]
          </Formula>
          <div className="tf-subhead">Root split: petal_len ≤ 2.5</div>
          {S.card(
            <div className="nn-calc">
              <div className="nn-calc-h">Parent node (root)</div>
              <div className="nn-calc-row">Gini(root) = 0.665 &nbsp;·&nbsp; n = 12</div>
              <div className="nn-calc-fwd">LEFT CHILD</div>
              <div className="nn-calc-row">n_left = 4, classes = [4,0,0] → Gini = <b>0.000</b> (pure!)</div>
              <div className="nn-calc-fwd">RIGHT CHILD</div>
              <div className="nn-calc-row">n_right = 8, classes = [0,4,4] → Gini = <b>0.500</b></div>
              <div className="nn-calc-row">
                Weighted = (4/12)×0.000 + (8/12)×0.500 = 0 + 0.333 = <b>0.333</b>
              </div>
              <div className="nn-calc-row" style={{ marginTop:8, fontSize:14, color:"var(--accent-ink)" }}>
                <b>Gain = 0.665 − 0.333 = 0.332</b>
              </div>
            </div>
          )}
          <div className="tf-subhead">Right split: petal_wid ≤ 1.8 (applied to 8 samples)</div>
          {S.card(
            <div className="nn-calc">
              <div className="nn-calc-h">Right subtree (8 samples: 4 versicolor + 4 virginica)</div>
              <div className="nn-calc-row">Gini(right_node) = 0.500</div>
              <div className="nn-calc-fwd">LEFT CHILD (petal_wid ≤ 1.8)</div>
              <div className="nn-calc-row">n = 4, [0,4,0] → Gini = <b>0.000</b></div>
              <div className="nn-calc-fwd">RIGHT CHILD (petal_wid &gt; 1.8)</div>
              <div className="nn-calc-row">n = 4, [0,0,4] → Gini = <b>0.000</b></div>
              <div className="nn-calc-row">Weighted = (4/8)×0 + (4/8)×0 = 0</div>
              <div className="nn-calc-row" style={{ marginTop:8, fontSize:14, color:"var(--accent-ink)" }}>
                <b>Gain = 0.500 − 0.000 = 0.500</b>
              </div>
            </div>
          )}
          <Note>
            Both splits achieve <b>zero Gini</b> in the final leaves — every leaf is pure.
            The algorithm stops here because no further splitting is needed.
          </Note>
        </>
      ),
    },

    // ── Stage 6: Building the Tree ──
    {
      id: "cls-build", group: "Training", title: "Building the Tree Recursively",
      map: "Build Tree",
      why: "The tree is built top-down: find the best split, partition the data, and recurse on each child — until leaves are pure or a stopping criterion is hit.",
      render: () => (
        <>
          <Lead>
            Tree building is a <b>greedy recursive</b> process. At each node we pick the
            single best feature/threshold split, partition the samples, and repeat.
            We stop when a node is <b>pure</b> (Gini = 0) or we hit max_depth.
          </Lead>
          <TreeDiagram showCounts={true} showGini={true} />
          <div className="tf-subhead">Algorithm pseudocode</div>
          {S.card(
            <div style={{ fontFamily:"var(--num-font)", fontSize:12.5, lineHeight:2, color:"var(--ink)" }}>
              <div><span style={{color:"var(--accent)"}}>def</span> build_tree(data, depth):</div>
              <div style={{paddingLeft:20}}><span style={{color:"var(--faint)"}}>if</span> pure(data) <span style={{color:"var(--faint)"}}>or</span> depth == max_depth:</div>
              <div style={{paddingLeft:40}}><span style={{color:"var(--faint)"}}>return</span> Leaf(majority_class(data))</div>
              <div style={{paddingLeft:20}}>best_feat, best_thresh = argmin_weighted_gini(data)</div>
              <div style={{paddingLeft:20}}>left, right = split(data, best_feat, best_thresh)</div>
              <div style={{paddingLeft:20}}>node.left  = build_tree(left,  depth+1)</div>
              <div style={{paddingLeft:20}}>node.right = build_tree(right, depth+1)</div>
              <div style={{paddingLeft:20}}><span style={{color:"var(--faint)"}}>return</span> node</div>
            </div>
          )}
          <div className="tf-subhead">Steps for our flower dataset</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, maxWidth:580 }}>
            {[
              ["Step 1","Root","All 12 samples","Best split: petal_len ≤ 2.5 (Gain=0.332)"],
              ["Step 2","Left child","4 setosa (pure)","Gini=0 → create leaf: setosa"],
              ["Step 3","Right child","8 samples [versicolor+virginica]","Best split: petal_wid ≤ 1.8 (Gain=0.500)"],
              ["Step 4","Right→Left","4 versicolor (pure)","Gini=0 → create leaf: versicolor"],
              ["Step 5","Right→Right","4 virginica (pure)","Gini=0 → create leaf: virginica"],
            ].map(([step, node, data, action]) => (
              <div key={step} style={{ display:"flex", gap:12, padding:"10px 14px",
                background:"var(--line-soft)", borderRadius:10, alignItems:"flex-start" }}>
                <span style={{ background:"var(--accent)", color:"#fff", borderRadius:6,
                  padding:"2px 8px", fontSize:11, fontWeight:800, flex:"none", marginTop:1 }}>{step}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:"var(--ink)" }}>{node}: {data}</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{action}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ),
    },

    // ── Stage 7: Prediction Path ──
    {
      id: "cls-predict", group: "Inference", title: "Prediction Path (Interactive)",
      map: "Predict Path",
      why: "At inference, the tree routes the input through a series of binary tests. Each decision is fully transparent — you can trace exactly why a class was predicted.",
      render: (trace) => {
        const { path, label } = trace;
        const edgeList = [];

        // Build edge highlight list
        edgeList.push({ from: "root", to: "root" });
        let depth = 0;
        for (let i = 0; i < path.length; i++) {
          const step = path[i];
          if (step.leaf) break;
          if (depth === 0) {
            const to = step.goLeft ? "left" : "right";
            edgeList.push({ from: "root", to });
          } else {
            const to = step.goLeft ? "rl" : "rr";
            edgeList.push({ from: "right", to });
          }
          depth++;
        }

        return (
          <>
            <Lead>
              The sliders set <b>petal_len = {fmt(trace.input.petal_len)}</b> and{" "}
              <b>petal_wid = {fmt(trace.input.petal_wid)}</b>. Follow the highlighted path
              below. The tree predicts: <b style={{color: CLASS_COLORS[label]}}>{CLASS_NAMES[label]}</b>.
            </Lead>
            <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"flex-start" }}>
              <TreeDiagram highlightPath={edgeList} showCounts={true} showGini={false} />
              <div style={{ maxWidth:280 }}>
                <div className="tf-subhead">Decision steps</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {path.map((step, i) => {
                    if (step.leaf) {
                      return (
                        <div key={i} style={{ padding:"10px 14px", borderRadius:10,
                          background: CLASS_BG[step.node.label],
                          border:`2px solid ${CLASS_COLORS[step.node.label]}` }}>
                          <div style={{ fontWeight:800, fontSize:13, color: CLASS_COLORS[step.node.label] }}>
                            Leaf reached
                          </div>
                          <div style={{ fontSize:12, color:"var(--ink)", marginTop:4 }}>
                            Predict: <b>{CLASS_NAMES[step.node.label]}</b>
                          </div>
                          <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                            Samples: [{step.node.count.join(",")}]
                          </div>
                        </div>
                      );
                    }
                    const feat = DT_CLS.features[step.node.feature];
                    const th = step.node.threshold;
                    return (
                      <div key={i} style={{ padding:"10px 14px", borderRadius:10,
                        background:"var(--accent-soft)", border:"1px solid var(--accent)" }}>
                        <div style={{ fontWeight:700, fontSize:12, color:"var(--accent-ink)" }}>
                          Node {i+1}: {feat} ≤ {th}?
                        </div>
                        <div style={{ fontSize:12, color:"var(--ink)", marginTop:3 }}>
                          {feat} = <b>{fmt(step.val)}</b> →{" "}
                          <b style={{color: step.goLeft ? "#1f9e6b" : "#e0492e"}}>
                            {step.goLeft ? "YES → go left" : "NO → go right"}
                          </b>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:12, padding:"12px 16px", borderRadius:12,
                  background: CLASS_BG[label], border:`2px solid ${CLASS_COLORS[label]}` }}>
                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:4 }}>PREDICTION</div>
                  <div style={{ fontSize:20, fontWeight:800, color: CLASS_COLORS[label] }}>
                    {CLASS_NAMES[label]}
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      },
    },

    // ── Stage 8: Decision Regions ──
    {
      id: "cls-regions", group: "Inference", title: "Decision Boundaries",
      map: "Regions",
      why: "Decision trees partition the feature space into axis-aligned rectangular regions. Each region maps to exactly one class leaf.",
      render: (trace) => (
        <>
          <Lead>
            The tree divides petal space into <b>3 rectangular regions</b> — one per class.
            All splits are <b>axis-aligned</b> (horizontal or vertical lines), a hallmark
            of decision trees. The star ★ shows your current query point.
          </Lead>
          {S.row(
            <>
              <DecisionRegions input={trace.input} />
              <div style={{ maxWidth:240 }}>
                <div className="tf-subhead">Boundary rules</div>
                {[
                  [CLASS_COLORS[0], "petal_len ≤ 2.5", "Entire left side → setosa"],
                  ["var(--accent)", "petal_len > 2.5 AND petal_wid ≤ 1.8", "→ versicolor"],
                  [CLASS_COLORS[2], "petal_len > 2.5 AND petal_wid > 1.8", "→ virginica"],
                ].map(([c, rule, result]) => (
                  <div key={rule} style={{ padding:"8px 12px", borderRadius:9, marginBottom:6,
                    background:"var(--line-soft)", borderLeft:`3px solid ${c}` }}>
                    <div style={{ fontSize:11.5, fontFamily:"var(--num-font)", color:"var(--ink)", fontWeight:600 }}>
                      {rule}
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{result}</div>
                  </div>
                ))}
                <Note style={{marginTop:8}}>
                  Decision trees always produce <b>axis-aligned</b> boundaries.
                  For diagonal boundaries, you'd need many splits or a different model.
                </Note>
              </div>
            </>
          )}
        </>
      ),
    },

    // ── Stage 9: Depth & Pruning ──
    {
      id: "cls-prune", group: "Regularization", title: "Depth & Pruning",
      map: "Pruning",
      why: "Unconstrained trees grow until every leaf is pure, memorizing the training data (overfitting). Limiting depth or minimum samples is how we regularize.",
      render: () => {
        // Simulated train/test accuracy vs depth
        const depths = [1, 2, 3, 4, 5, 6];
        const trainAcc = [0.72, 0.98, 1.00, 1.00, 1.00, 1.00];
        const testAcc  = [0.65, 0.94, 0.96, 0.89, 0.82, 0.76];
        const W = 380, H = 180, padL = 42, padR = 15, padT = 18, padB = 38;
        const pw = W - padL - padR, ph = H - padT - padB;
        const xi = i => padL + (i / (depths.length - 1)) * pw;
        const yv = v => padT + ph - (v - 0.6) / 0.4 * ph;

        return (
          <>
            <Lead>
              Deeper trees fit training data perfectly but <b>generalize poorly</b>. We use
              hyperparameters like <b>max_depth</b> and <b>min_samples_split</b> to
              prevent overfitting.
            </Lead>
            <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart" style={{marginBottom:16}}>
              {/* train acc */}
              <polyline
                points={trainAcc.map((v,i) => `${xi(i)},${yv(v)}`).join(" ")}
                fill="none" stroke="var(--accent)" strokeWidth="2" />
              {/* test acc */}
              <polyline
                points={testAcc.map((v,i) => `${xi(i)},${yv(v)}`).join(" ")}
                fill="none" stroke="#e0492e" strokeWidth="2" strokeDasharray="5 3" />
              {trainAcc.map((v,i) => (
                <circle key={i} cx={xi(i)} cy={yv(v)} r="4"
                  fill="var(--accent)" stroke="var(--panel-solid)" strokeWidth="1.5" />
              ))}
              {testAcc.map((v,i) => (
                <circle key={i} cx={xi(i)} cy={yv(v)} r="4"
                  fill="#e0492e" stroke="var(--panel-solid)" strokeWidth="1.5" />
              ))}
              {/* Best depth marker */}
              <line x1={xi(1)} y1={padT} x2={xi(1)} y2={padT+ph}
                stroke="#1f9e6b" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x={xi(1)+4} y={padT+12} fontSize="9.5" fill="#1f9e6b" fontWeight="700">
                sweet spot
              </text>
              {/* Axes */}
              <line x1={padL} y1={padT+ph} x2={padL+pw} y2={padT+ph} stroke="var(--faint)" />
              <line x1={padL} y1={padT} x2={padL} y2={padT+ph} stroke="var(--faint)" />
              {depths.map((d,i) => (
                <text key={d} x={xi(i)} y={padT+ph+14} textAnchor="middle"
                  fontSize="9" fill="var(--faint)">{d}</text>
              ))}
              {[0.7,0.8,0.9,1.0].map(v => (
                <text key={v} x={padL-5} y={yv(v)+4} textAnchor="end"
                  fontSize="9" fill="var(--faint)">{(v*100).toFixed(0)}%</text>
              ))}
              <text x={padL+pw/2} y={H-4} textAnchor="middle" className="reg-axl">max_depth</text>
              {/* Legend */}
              <rect x={padL+pw-90} y={padT+5} width="8" height="3" rx="1" fill="var(--accent)" />
              <text x={padL+pw-78} y={padT+9} fontSize="9.5" fill="var(--muted)">train acc</text>
              <rect x={padL+pw-90} y={padT+20} width="8" height="3" rx="1" fill="#e0492e" />
              <text x={padL+pw-78} y={padT+24} fontSize="9.5" fill="var(--muted)">test acc</text>
            </svg>

            <div className="tf-subhead">Key hyperparameters</div>
            <div className="tf-legend">
              {[
                ["max_depth", "Maximum tree depth. Depth=2 gives our 3-class tree. Larger → overfit."],
                ["min_samples_split", "Minimum samples to split a node. Higher → fewer splits → simpler tree."],
                ["min_samples_leaf", "Minimum samples in a leaf. Prevents tiny, noisy leaves."],
                ["max_features", "How many features to consider at each split (useful for forests)."],
              ].map(([n,d]) => (
                <div className="tf-leg is-learned" key={n}>
                  <div className="tf-leg-name">{n}</div>
                  <div className="tf-leg-desc">{d}</div>
                </div>
              ))}
            </div>
            <div className="opt-pc">
              <div className="opt-pc-col is-pro">
                <div className="opt-pc-h">Shallow tree</div>
                <ul>
                  <li>Generalizes better</li>
                  <li>Faster prediction</li>
                  <li>More interpretable</li>
                  <li>Robust to noise</li>
                </ul>
              </div>
              <div className="opt-pc-col is-con">
                <div className="opt-pc-h">Deep tree</div>
                <ul>
                  <li>Memorizes training data</li>
                  <li>Poor test accuracy</li>
                  <li>Hard to interpret</li>
                  <li>Sensitive to small changes</li>
                </ul>
              </div>
            </div>
          </>
        );
      },
    },

    // ── Stage 10: Feature Importance ──
    {
      id: "cls-importance", group: "Insights", title: "Feature Importance",
      map: "Feature Importance",
      why: "Feature importance tells us which features the tree relied on most — directly from how much Gini impurity each feature's splits reduced.",
      render: () => {
        // Importance = total weighted Gini reduction per feature (normalized)
        // petal_len: root split, gain = 0.332 × (12/12) = 0.332
        // petal_wid: right split, gain = 0.500 × (8/12) = 0.333
        // Total = 0.665. Normalize:
        const impRaw = { petal_len: 0.332, petal_wid: 0.333 };
        const total = Object.values(impRaw).reduce((a,b)=>a+b,0);
        const imp = Object.entries(impRaw).map(([k,v]) => ({ name: k, val: v/total }))
          .sort((a,b) => b.val - a.val);

        return (
          <>
            <Lead>
              <b>Feature importance</b> = total weighted Gini reduction attributed to each
              feature across all splits in the tree, normalized to sum to 1.
              Features that create purer children get higher importance.
            </Lead>
            <Formula label="Importance(f)">
              Σ (n_node/n_total) × ΔGini &nbsp; for each split using feature f, then normalize
            </Formula>
            <div className="tf-subhead">Computed importances</div>
            <div style={{ maxWidth:440, margin:"8px 0 16px" }}>
              {imp.map(({name, val}) => (
                <div key={name} style={{ display:"flex", alignItems:"center", gap:12, margin:"6px 0" }}>
                  <span style={{ width:96, fontFamily:"var(--num-font)", fontSize:12.5,
                    fontWeight:700, color:"var(--ink)" }}>{name}</span>
                  <div style={{ flex:1, height:22, background:"var(--line-soft)", borderRadius:6, overflow:"hidden" }}>
                    <div style={{ width:`${val*100}%`, height:"100%",
                      background:"linear-gradient(90deg, var(--accent), var(--neon))",
                      borderRadius:6, transition:"width .5s" }} />
                  </div>
                  <span style={{ fontFamily:"var(--num-font)", fontSize:13, fontWeight:800,
                    color:"var(--accent-ink)", width:48, textAlign:"right" }}>
                    {fmt(val, 3)}
                  </span>
                </div>
              ))}
            </div>
            <div className="tf-subhead">How it's calculated</div>
            {S.card(
              <div className="nn-calc">
                <div className="nn-calc-h">Root split: petal_len ≤ 2.5</div>
                <div className="nn-calc-row">ΔGini = (12/12) × (0.665 − [4/12×0 + 8/12×0.5]) = 0.332</div>
                <div className="nn-calc-h" style={{marginTop:10}}>Right split: petal_wid ≤ 1.8</div>
                <div className="nn-calc-row">ΔGini = (8/12) × (0.500 − [4/8×0 + 4/8×0]) = 0.333</div>
                <div className="nn-calc-row" style={{marginTop:8}}>
                  <b>Normalized: petal_len = 0.499, petal_wid = 0.501</b>
                </div>
              </div>
            )}
            <Note>
              Both features are nearly equally important here. In practice with more features,
              importance scores help identify which inputs to focus on — or which to drop.
            </Note>
          </>
        );
      },
    },
  ];

  // ── Input renderer ──
  function renderInput(input, setInput) {
    return (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">petal_len</span>
          <input type="range" min="0.5" max="7" step="0.1"
            value={input.petal_len}
            onChange={e => setInput({ ...input, petal_len: parseFloat(e.target.value) })} />
          <span className="nn-slider-v">{fmt(input.petal_len)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">petal_wid</span>
          <input type="range" min="0.1" max="2.5" step="0.1"
            value={input.petal_wid}
            onChange={e => setInput({ ...input, petal_wid: parseFloat(e.target.value) })} />
          <span className="nn-slider-v">{fmt(input.petal_wid)}</span>
        </label>
      </>
    );
  }

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "Decision Tree",
    subtitle: "Classification · Iris Flowers",
    cur: "Decision Tree",
    category: "ML Algorithms",
    run: runDTreeCls,
    default: DT_CLS.default,
    renderInput,
    modeLinks: [
      { label: "Classification", href: "Decision Tree (Classification).html", active: true },
      { label: "Regression",     href: "Decision Tree (Regression).html",     active: false },
    ],
  };
})();
