/* Decision Tree — Regression stages */
(function () {
  const { Lead, Note, Row, Formula, Tag, fmt } = window;
  const { DT_REG, runDTreeReg } = window.ML_DTREE;

  const LEAF_COLORS = ["#2B5BFF", "#1f9e6b", "#e0492e"];
  const LEAF_BG     = ["rgba(43,91,255,.13)", "rgba(31,158,107,.13)", "rgba(224,73,46,.13)"];

  // ── Regression Tree SVG Diagram ──
  function RegTreeDiagram({ highlightPath, showFormulas }) {
    const nodes = {
      root:  { x: 220, y: 55,  label: "age ≤ 15?", var: "5.20", samples: 8, isInternal: true },
      left:  { x: 110, y: 160, label: "age ≤ 8?",  var: "0.90", samples: 4, isInternal: true },
      right: { x: 350, y: 160, label: "predict 2.68", var: "0.55", samples: 4, leafIdx: 2 },
      ll:    { x: 55,  y: 265, label: "predict 7.85", var: "0.12", samples: 2, leafIdx: 0 },
      lr:    { x: 175, y: 265, label: "predict 6.25", var: "0.30", samples: 2, leafIdx: 1 },
    };

    const isNodeActive = (id) => {
      if (!highlightPath) return false;
      return highlightPath.some(e => e.to === id || (e.from === id && id === "root"));
    };
    const isEdgeActive = (from, to) => {
      if (!highlightPath) return false;
      return highlightPath.some(e => e.from === from && e.to === to);
    };

    function NodeBox({ id, n }) {
      const active = isNodeActive(id);
      const isLeaf = !n.isInternal;
      const fill   = isLeaf ? LEAF_BG[n.leafIdx] : "var(--panel-solid)";
      const stroke = active ? "var(--accent)" : (isLeaf ? LEAF_COLORS[n.leafIdx] : "var(--line)");
      const sw     = active ? 2.5 : 1.5;
      const w = isLeaf ? 106 : 118;
      const h = showFormulas ? 54 : 40;
      return (
        <g>
          <rect x={n.x-w/2} y={n.y-h/2} width={w} height={h} rx="8"
            fill={fill} stroke={stroke} strokeWidth={sw} />
          {active && (
            <rect x={n.x-w/2-3} y={n.y-h/2-3} width={w+6} height={h+6} rx="10"
              fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
          )}
          <text x={n.x} y={n.y + (showFormulas ? -8 : 4)}
            textAnchor="middle" fontSize="11" fontWeight="700"
            fill={isLeaf ? LEAF_COLORS[n.leafIdx] : "var(--ink)"}>
            {n.label}
          </text>
          {showFormulas && (
            <text x={n.x} y={n.y+10} textAnchor="middle" fontSize="9.5" fill="var(--faint)">
              n={n.samples} · var={n.var}
            </text>
          )}
        </g>
      );
    }

    function Edge({ from, to, label, side }) {
      const a = nodes[from], b = nodes[to];
      const active = isEdgeActive(from, to);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const lx = side === "left" ? mx - 16 : mx + 16;
      return (
        <g>
          <line x1={a.x} y1={a.y+20} x2={b.x} y2={b.y-20}
            stroke={active ? "var(--accent)" : "var(--line)"}
            strokeWidth={active ? 2.5 : 1.5} />
          <text x={lx} y={my} textAnchor="middle" fontSize="10" fontWeight="700"
            fill={active ? "var(--accent)" : "var(--faint)"}>{label}</text>
        </g>
      );
    }

    const svgH = showFormulas ? 320 : 300;
    return (
      <svg viewBox={`0 0 440 ${svgH}`} style={{ width:"100%", maxWidth:440, height:"auto",
        border:"1px solid var(--line)", borderRadius:14, background:"var(--panel-solid)",
        boxShadow:"var(--shadow)", display:"block" }}>
        <Edge from="root" to="left"  label="YES" side="left" />
        <Edge from="root" to="right" label="NO"  side="right" />
        <Edge from="left" to="ll"    label="YES" side="left" />
        <Edge from="left" to="lr"    label="NO"  side="right" />
        <NodeBox id="root"  n={nodes.root}  />
        <NodeBox id="left"  n={nodes.left}  />
        <NodeBox id="right" n={nodes.right} />
        <NodeBox id="ll"    n={nodes.ll}    />
        <NodeBox id="lr"    n={nodes.lr}    />
        {/* leaf color legend */}
        {[["7.85","new"],["6.25","mid"],["2.68","old"]].map(([v,l],i) => (
          <g key={i} transform={`translate(${14 + i*136}, ${svgH - 22})`}>
            <rect width="10" height="10" rx="3" fill={LEAF_COLORS[i]} />
            <text x="14" y="9" fontSize="9.5" fill="var(--muted)">{l}: {v}</text>
          </g>
        ))}
      </svg>
    );
  }

  // ── Scatter plot with step-function overlay ──
  function RegScatter({ input, showPredLine, showResidual }) {
    const data = DT_REG.data;
    const W = 420, H = 280;
    const pad = { l: 50, r: 18, t: 18, b: 38 };
    const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    const xMin = 0, xMax = 50, yMin = 0, yMax = 10;
    const sx = v => pad.l + ((v - xMin) / (xMax - xMin)) * pw;
    const sy = v => pad.t + ph - ((v - yMin) / (yMax - yMin)) * ph;

    // Step function: age ≤ 8 → 7.85, 8 < age ≤ 15 → 6.25, age > 15 → 2.675
    const stepFn = age => age <= 8 ? 7.85 : age <= 15 ? 6.25 : 2.675;

    const qAge  = input ? input.age : null;
    const qPred = qAge  !== null ? stepFn(qAge) : null;

    // true value from dataset (interpolate nearest)
    const nearestTrue = qAge !== null
      ? data.reduce((a,b) => Math.abs(b[0]-qAge) < Math.abs(a[0]-qAge) ? b : a)[1]
      : null;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart">
        {/* grid */}
        {[10,20,30,40].map(v => (
          <line key={v} x1={sx(v)} y1={pad.t} x2={sx(v)} y2={pad.t+ph}
            stroke="var(--line)" strokeWidth="1" />
        ))}
        {[2,4,6,8].map(v => (
          <line key={v} x1={pad.l} y1={sy(v)} x2={pad.l+pw} y2={sy(v)}
            stroke="var(--line)" strokeWidth="1" />
        ))}
        {/* Step function prediction line */}
        {showPredLine && (
          <>
            <line x1={sx(0)}  y1={sy(7.85)}  x2={sx(8)}  y2={sy(7.85)}  stroke="var(--accent)" strokeWidth="2.5" />
            <line x1={sx(8)}  y1={sy(6.25)}  x2={sx(15)} y2={sy(6.25)}  stroke="var(--accent)" strokeWidth="2.5" />
            <line x1={sx(15)} y1={sy(2.675)} x2={sx(50)} y2={sy(2.675)} stroke="var(--accent)" strokeWidth="2.5" />
            {/* vertical connectors */}
            <line x1={sx(8)}  y1={sy(7.85)} x2={sx(8)}  y2={sy(6.25)}  stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 2" />
            <line x1={sx(15)} y1={sy(6.25)} x2={sx(15)} y2={sy(2.675)} stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 2" />
            {/* labels */}
            <text x={sx(4)}  y={sy(7.85)-5} textAnchor="middle" fontSize="9.5" fill="var(--accent)" fontWeight="700">7.85</text>
            <text x={sx(11.5)} y={sy(6.25)-5} textAnchor="middle" fontSize="9.5" fill="var(--accent)" fontWeight="700">6.25</text>
            <text x={sx(35)} y={sy(2.675)-5} textAnchor="middle" fontSize="9.5" fill="var(--accent)" fontWeight="700">2.68</text>
          </>
        )}
        {/* Data points */}
        {data.map((d,i) => (
          <circle key={i} cx={sx(d[0])} cy={sy(d[1])} r="5"
            fill="var(--ink)" opacity="0.7"
            stroke="var(--panel-solid)" strokeWidth="1.5" />
        ))}
        {/* Query point */}
        {qAge !== null && (
          <>
            {showResidual && nearestTrue && (
              <line x1={sx(qAge)} y1={sy(qPred)} x2={sx(qAge)} y2={sy(nearestTrue)}
                stroke="#e0492e" strokeWidth="1.5" strokeDasharray="4 2" />
            )}
            <circle cx={sx(qAge)} cy={sy(qPred)} r="7"
              fill="var(--accent)" opacity="0.85"
              stroke="var(--panel-solid)" strokeWidth="1.5" />
            <text x={sx(qAge)} y={sy(qPred)-10} textAnchor="middle"
              fontSize="10" fontWeight="800" fill="var(--accent)">★</text>
          </>
        )}
        {/* Axes */}
        <line x1={pad.l} y1={pad.t+ph} x2={pad.l+pw} y2={pad.t+ph} stroke="var(--faint)" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t+ph} stroke="var(--faint)" />
        <text x={pad.l+pw/2} y={H-4} textAnchor="middle" className="reg-axl">age (years)</text>
        <text x="13" y={pad.t+ph/2} textAnchor="middle" className="reg-axl"
          transform={`rotate(-90,13,${pad.t+ph/2})`}>price ($100k)</text>
        {[0,10,20,30,40].map(v => (
          <text key={v} x={sx(v)} y={pad.t+ph+14} textAnchor="middle" className="reg-axl">{v}</text>
        ))}
        {[0,2,4,6,8].map(v => (
          <text key={v} x={pad.l-6} y={sy(v)+4} textAnchor="end" className="reg-axl">{v}</text>
        ))}
      </svg>
    );
  }

  // ── Variance bar ──
  function VarBar({ vals, label }) {
    const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
    const v = vals.reduce((s,y)=>s+(y-mean)**2,0)/vals.length;
    const maxV = 5.2;
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0" }}>
        <span style={{ width:130, fontSize:12, color:"var(--muted)", textAlign:"right" }}>{label}</span>
        <div style={{ flex:1, height:18, background:"var(--line-soft)", borderRadius:6,
          overflow:"hidden", maxWidth:200 }}>
          <div style={{ width:`${Math.min((v/maxV)*100,100)}%`, height:"100%",
            background:"linear-gradient(90deg,var(--accent),var(--neon))", borderRadius:6 }} />
        </div>
        <span style={{ fontFamily:"var(--num-font)", fontSize:12, color:"var(--accent-ink)", width:42 }}>
          {fmt(v, 3)}
        </span>
        <span style={{ fontSize:11, color:"var(--faint)" }}>
          mean={fmt(mean,2)}
        </span>
      </div>
    );
  }

  // ── Helper card ──
  const S = {
    card: (children) => (
      <div style={{ background:"var(--panel-solid)", border:"1px solid var(--line)",
        borderRadius:14, padding:"16px 18px", boxShadow:"var(--shadow)", marginBottom:14 }}>
        {children}
      </div>
    ),
    row: (children) => (
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-start", margin:"10px 0" }}>
        {children}
      </div>
    ),
  };

  // ── Build path edge list ──
  function buildEdges(path) {
    const edges = [{ from:"root", to:"root" }];
    for (let i = 0; i < path.length; i++) {
      const step = path[i];
      if (step.leaf) break;
      if (i === 0) {
        const to = step.goLeft ? "left" : "right";
        edges.push({ from:"root", to });
      } else {
        const to = step.goLeft ? "ll" : "lr";
        edges.push({ from:"left", to });
      }
    }
    return edges;
  }

  const STAGES = [
    // ── Stage 1: Overview ──
    {
      id: "reg-overview", group: "Overview", title: "Decision Trees for Regression",
      map: "Overview",
      why: "Decision trees aren't just for classification — they can predict continuous values too, by averaging target values in each leaf.",
      render: (trace) => (
        <>
          <Lead>
            A <b>regression tree</b> works exactly like a classification tree, but instead
            of voting for a class, each leaf <b>averages the target values</b> of its
            training samples. This produces a <b>step-function</b> prediction over the
            input space.
          </Lead>
          {S.row(
            <>
              <RegTreeDiagram showFormulas={true} />
              <div style={{ maxWidth:260 }}>
                <div className="tf-subhead">How leaves predict</div>
                <div className="tf-legend" style={{ gridTemplateColumns:"1fr" }}>
                  {[
                    ["Internal node", "Tests age ≤ threshold, routes left or right"],
                    ["Leaf node", "Returns mean(y) of training samples in that region"],
                    ["Variance", "Used instead of Gini — measures spread in target values"],
                  ].map(([n,d]) => (
                    <div className="tf-leg" key={n}>
                      <div className="tf-leg-name">{n}</div>
                      <div className="tf-leg-desc">{d}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:12, padding:"10px 14px", borderRadius:10,
                  background:"var(--accent-soft)", border:"1px solid var(--accent)" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--accent-ink)", marginBottom:4 }}>
                    Leaf predictions (means)
                  </div>
                  {[["age ≤ 8", "7.85", "avg(8.2, 7.5)"],
                    ["8 < age ≤ 15", "6.25", "avg(6.8, 5.7)"],
                    ["age > 15", "2.68", "avg(3.8,2.9,2.2,1.8)"]].map(([rule,pred,calc]) => (
                    <div key={rule} style={{ fontSize:12, color:"var(--muted)", margin:"3px 0" }}>
                      <b style={{color:"var(--ink)"}}>{rule}</b> → {pred} &nbsp;
                      <span style={{fontSize:10, color:"var(--faint)"}}>{calc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="tf-subhead">Step-function prediction</div>
          <RegScatter input={trace.input} showPredLine={true} />
        </>
      ),
    },

    // ── Stage 2: Dataset ──
    {
      id: "reg-dataset", group: "Overview", title: "The Training Dataset",
      map: "Dataset",
      why: "Seeing the raw data helps us understand the non-linear age→price relationship that makes a step function more appropriate than a straight line.",
      render: (trace) => (
        <>
          <Lead>
            Our dataset has <b>8 houses</b>: each with an <b>age</b> (years) and
            a <b>price</b> ($100k). Prices drop non-linearly with age. The ★ marks
            the current age slider value.
          </Lead>
          {S.row(
            <>
              <RegScatter input={trace.input} />
              <div>
                <div className="tf-subhead">Data table</div>
                <table style={{ borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid var(--line)" }}>
                      {["#","age","price ($100k)"].map(h => (
                        <th key={h} style={{ padding:"5px 12px", textAlign:"right",
                          color:"var(--faint)", fontWeight:700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DT_REG.data.map(([age,price], i) => (
                      <tr key={i} style={{ borderBottom:"1px solid var(--line-soft)",
                        background: i%2===0?"var(--line-soft)":"transparent" }}>
                        <td style={{ padding:"4px 12px", fontFamily:"var(--num-font)",
                          color:"var(--faint)", textAlign:"right" }}>{i+1}</td>
                        <td style={{ padding:"4px 12px", fontFamily:"var(--num-font)",
                          color:"var(--ink)", textAlign:"right" }}>{age}</td>
                        <td style={{ padding:"4px 12px", fontFamily:"var(--num-font)",
                          color:"var(--accent-ink)", fontWeight:700, textAlign:"right" }}>{price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Note style={{marginTop:8}}>Use the age slider to move the ★ query point.</Note>
              </div>
            </>
          )}
        </>
      ),
    },

    // ── Stage 3: Variance as Impurity ──
    {
      id: "reg-variance", group: "Math", title: "Variance as Impurity",
      map: "Variance",
      why: "Regression trees minimize variance instead of Gini. A low-variance leaf means all samples have similar target values — a good prediction region.",
      render: () => {
        const allPrices = DT_REG.data.map(d => d[1]);
        const mean = allPrices.reduce((a,b)=>a+b,0)/allPrices.length;
        const v = allPrices.reduce((s,y)=>s+(y-mean)**2,0)/allPrices.length;

        return (
          <>
            <Lead>
              For regression, we use <b>variance</b> to measure node impurity.
              A node with high variance has wildly different target values —
              splitting it will create better-predicting children.
            </Lead>
            <Formula label="Variance">
              Var = (1/n) × Σ (yᵢ − ȳ)²
            </Formula>
            <div className="tf-subhead">Variance by region</div>
            <div style={{ maxWidth:520 }}>
              <VarBar vals={allPrices}                      label="All 8 houses (root)" />
              <VarBar vals={[8.2, 7.5]}                     label="age ≤ 8" />
              <VarBar vals={[6.8, 5.7]}                     label="8 < age ≤ 15" />
              <VarBar vals={[3.8, 2.9, 2.2, 1.8]}           label="age > 15" />
            </div>
            <div className="tf-subhead">Root node calculation</div>
            {S.card(
              <div className="nn-calc">
                <div className="nn-calc-h">Root: all 8 prices</div>
                <div className="nn-calc-row">
                  Prices: {allPrices.join(", ")}
                </div>
                <div className="nn-calc-row">Mean ȳ = {fmt(mean, 3)}</div>
                <div className="nn-calc-row">
                  Σ(y−ȳ)² = {allPrices.map(y => fmt((y-mean)**2, 3)).join(" + ")}
                </div>
                <div className="nn-calc-row">
                  = {fmt(allPrices.reduce((s,y)=>s+(y-mean)**2,0),3)}
                </div>
                <div className="nn-calc-row">
                  <b>Var = {fmt(v, 3)} / 8 = <span style={{color:"var(--accent)"}}>
                    {fmt(v, 3)}
                  </span></b>
                </div>
              </div>
            )}
            <Note>
              The root has Var ≈ 5.2 — very high. After splitting at age=15,
              the largest child has Var ≈ 0.55. After the second split at age=8,
              we get Var ≈ 0.12. Each split dramatically reduces variance.
            </Note>
          </>
        );
      },
    },

    // ── Stage 4: Finding the Best Split ──
    {
      id: "reg-split", group: "Math", title: "Finding the Best Split",
      map: "Best Split",
      why: "We try all possible age thresholds and pick the one that produces the lowest weighted variance across both child nodes.",
      render: () => {
        const data = DT_REG.data;
        const thresholds = [6, 8, 11, 13, 15, 20, 28, 35];
        const results = thresholds.map(t => {
          const left  = data.filter(d => d[0] <= t).map(d => d[1]);
          const right = data.filter(d => d[0] > t).map(d => d[1]);
          const varOf = arr => {
            if (arr.length === 0) return 0;
            const m = arr.reduce((a,b)=>a+b,0)/arr.length;
            return arr.reduce((s,y)=>s+(y-m)**2,0)/arr.length;
          };
          const vl = varOf(left), vr = varOf(right);
          const wv = (left.length * vl + right.length * vr) / data.length;
          return { t, nl: left.length, nr: right.length, vl, vr, wv };
        });

        const minWv = Math.min(...results.map(r => r.wv));
        const W = 420, H = 180, padL = 50, padR = 15, padT = 18, padB = 38;
        const pw = W - padL - padR, ph = H - padT - padB;
        const xi = i => padL + (i / (results.length-1)) * pw;
        const yv = v => padT + ph - (v / 3) * ph;

        return (
          <>
            <Lead>
              For each candidate threshold, compute <b>weighted variance</b> =
              (n_left/n)×Var_left + (n_right/n)×Var_right.
              Minimum is at <b>age ≤ 15</b>.
            </Lead>
            <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart" style={{marginBottom:12}}>
              <polyline
                points={results.map((r,i)=>`${xi(i)},${yv(r.wv)}`).join(" ")}
                fill="none" stroke="var(--accent)" strokeWidth="2" />
              {results.map((r,i) => (
                <g key={i}>
                  <circle cx={xi(i)} cy={yv(r.wv)} r={r.wv===minWv?7:4}
                    fill={r.wv===minWv?"var(--accent)":"var(--line)"}
                    stroke="var(--panel-solid)" strokeWidth="1.5" />
                  {r.wv === minWv && (
                    <text x={xi(i)} y={yv(r.wv)-12} textAnchor="middle"
                      fontSize="10" fontWeight="800" fill="var(--accent)">best: {r.t}</text>
                  )}
                  <text x={xi(i)} y={padT+ph+14} textAnchor="middle"
                    fontSize="9" fill="var(--faint)">{r.t}</text>
                </g>
              ))}
              {[0, 0.5, 1.0, 1.5, 2.0].map(v => (
                <g key={v}>
                  <line x1={padL-3} y1={yv(v)} x2={padL} y2={yv(v)} stroke="var(--faint)" />
                  <text x={padL-6} y={yv(v)+4} textAnchor="end" fontSize="9" fill="var(--faint)">{v}</text>
                </g>
              ))}
              <line x1={padL} y1={padT+ph} x2={padL+pw} y2={padT+ph} stroke="var(--faint)" />
              <line x1={padL} y1={padT}    x2={padL}    y2={padT+ph} stroke="var(--faint)" />
              <text x={padL+pw/2} y={H-4} textAnchor="middle" className="reg-axl">age threshold</text>
              <text x="12" y={padT+ph/2} textAnchor="middle" className="reg-axl"
                transform={`rotate(-90,12,${padT+ph/2})`}>weighted variance</text>
            </svg>
            <div style={{ overflowX:"auto" }}>
              <table style={{ borderCollapse:"collapse", fontSize:12, maxWidth:580, width:"100%" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--line)" }}>
                    {["Threshold","n_left","n_right","Var_left","Var_right","Wt. Variance"].map(h => (
                      <th key={h} style={{ padding:"4px 10px", textAlign:"right",
                        color:"var(--faint)", fontWeight:700, fontSize:11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.t} style={{
                      background: r.wv===minWv?"var(--accent-soft)":"transparent",
                      borderBottom:"1px solid var(--line-soft)"
                    }}>
                      <td style={{ padding:"4px 10px", fontFamily:"var(--num-font)",
                        fontWeight: r.wv===minWv?800:400,
                        color: r.wv===minWv?"var(--accent-ink)":"var(--ink)" }}>{r.t}</td>
                      <td style={{ padding:"4px 10px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{r.nl}</td>
                      <td style={{ padding:"4px 10px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{r.nr}</td>
                      <td style={{ padding:"4px 10px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{fmt(r.vl,3)}</td>
                      <td style={{ padding:"4px 10px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{fmt(r.vr,3)}</td>
                      <td style={{ padding:"4px 10px", fontFamily:"var(--num-font)", textAlign:"right",
                        fontWeight:700, color: r.wv===minWv?"var(--accent-ink)":"var(--ink)" }}>{fmt(r.wv,4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      },
    },

    // ── Stage 5: Building the Tree ──
    {
      id: "reg-build", group: "Training", title: "Building the Regression Tree",
      map: "Build Tree",
      why: "Same recursive process as classification — split on minimum variance, recurse — but stopping when a node is small enough (min_samples) rather than pure.",
      render: () => (
        <>
          <Lead>
            The 2-level tree is built with two splits. Each leaf stores the
            <b> mean of its training prices</b> as the prediction.
          </Lead>
          <RegTreeDiagram showFormulas={true} />
          <div className="tf-subhead">Leaf prediction formula</div>
          {S.card(
            <div className="nn-calc">
              <div className="nn-calc-h">Leaf prediction = mean(y in leaf)</div>
              <div className="nn-calc-row">Left-left leaf (age ≤ 8): mean(8.2, 7.5) = <b>7.85</b></div>
              <div className="nn-calc-row">Left-right leaf (8&lt;age≤15): mean(6.8, 5.7) = <b>6.25</b></div>
              <div className="nn-calc-row">Right leaf (age&gt;15): mean(3.8, 2.9, 2.2, 1.8) = <b>2.675</b></div>
            </div>
          )}
          <div className="tf-subhead">Build steps</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, maxWidth:580 }}>
            {[
              ["Step 1","Root (n=8)","All prices: 8.2–1.8","Best split: age ≤ 15 (min wt. variance)"],
              ["Step 2","Left (n=4, age≤15)","Prices: 8.2, 7.5, 6.8, 5.7","Best split: age ≤ 8"],
              ["Step 3","Left-Left (n=2)","Prices: 8.2, 7.5","Small enough → leaf, predict 7.85"],
              ["Step 4","Left-Right (n=2)","Prices: 6.8, 5.7","Small enough → leaf, predict 6.25"],
              ["Step 5","Right (n=4, age>15)","Prices: 3.8, 2.9, 2.2, 1.8","min_samples reached → leaf, predict 2.675"],
            ].map(([step, node, data, action]) => (
              <div key={step} style={{ display:"flex", gap:12, padding:"9px 14px",
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

    // ── Stage 6: Prediction Path ──
    {
      id: "reg-predict", group: "Inference", title: "Prediction Path (Interactive)",
      map: "Predict Path",
      why: "Just like classification, the tree routes the input to a leaf by answering each split question. The leaf's mean is the predicted price.",
      render: (trace) => {
        const { path, predict } = trace;
        const edges = buildEdges(path);

        return (
          <>
            <Lead>
              Age = <b>{trace.input.age}</b> years. Follow the highlighted path.
              Predicted price: <b style={{color:"var(--accent)"}}>${fmt(predict, 2)} × $100k = ${fmt(predict*100, 0)}k</b>
            </Lead>
            <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"flex-start" }}>
              <RegTreeDiagram highlightPath={edges} showFormulas={true} />
              <div style={{ maxWidth:270 }}>
                <div className="tf-subhead">Decision trace</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {path.map((step, i) => {
                    if (step.leaf) {
                      return (
                        <div key={i} style={{ padding:"10px 14px", borderRadius:10,
                          background:"var(--accent-soft)", border:"2px solid var(--accent)" }}>
                          <div style={{ fontWeight:800, fontSize:13, color:"var(--accent-ink)" }}>
                            Leaf reached
                          </div>
                          <div style={{ fontSize:12, color:"var(--ink)", marginTop:4 }}>
                            Predict: <b>${fmt(step.node.predict, 2)} × 100k</b>
                          </div>
                          <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                            Based on {step.node.samples ? step.node.samples.length : "?"} training houses
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={i} style={{ padding:"10px 14px", borderRadius:10,
                        background:"var(--line-soft)", border:"1px solid var(--line)" }}>
                        <div style={{ fontWeight:700, fontSize:12, color:"var(--ink)" }}>
                          Node {i+1}: age ≤ {step.node.threshold}?
                        </div>
                        <div style={{ fontSize:12, color:"var(--muted)", marginTop:3 }}>
                          age = <b>{step.val}</b> →{" "}
                          <b style={{color: step.goLeft?"#1f9e6b":"#e0492e"}}>
                            {step.goLeft ? "YES → go left" : "NO → go right"}
                          </b>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:12, padding:"12px 16px", borderRadius:12,
                  background:"var(--accent-soft)", border:"2px solid var(--accent)" }}>
                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:4 }}>PREDICTED PRICE</div>
                  <div style={{ fontSize:22, fontWeight:800, color:"var(--accent-ink)" }}>
                    ${fmt(predict, 2)} × $100k
                  </div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>
                    = <b>${fmt(predict * 100, 0)}k</b>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      },
    },

    // ── Stage 7: Prediction Visualized ──
    {
      id: "reg-visual", group: "Inference", title: "Prediction Visualized",
      map: "Prediction Plot",
      why: "Plotting the tree's step-function alongside the data shows how well the piecewise-constant approximation captures the real trend.",
      render: (trace) => {
        const { predict } = trace;
        const stepFn = age => age <= 8 ? 7.85 : age <= 15 ? 6.25 : 2.675;
        const trueVal = DT_REG.data.reduce((a,b) =>
          Math.abs(b[0]-trace.input.age) < Math.abs(a[0]-trace.input.age) ? b : a)[1];
        const residual = trueVal - predict;

        return (
          <>
            <Lead>
              The blue ★ shows the <b>tree's prediction</b> for age={trace.input.age}.
              The step function (blue horizontal lines) is what the tree would predict for
              any age. The dashed red line is the <b>residual</b> to the nearest true value.
            </Lead>
            <RegScatter input={trace.input} showPredLine={true} showResidual={true} />
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:12 }}>
              {[
                ["Prediction", `$${fmt(predict,2)} × 100k`, "var(--accent-ink)"],
                ["Nearest true value", `$${fmt(trueVal,2)} × 100k`, "var(--ink)"],
                ["Residual", `${fmt(residual,2)} × 100k`, residual >= 0 ? "#1f9e6b" : "#e0492e"],
              ].map(([label, value, color]) => (
                <div key={label} style={{ padding:"10px 16px", borderRadius:10,
                  background:"var(--line-soft)", border:"1px solid var(--line)" }}>
                  <div style={{ fontSize:11, color:"var(--faint)", fontWeight:700 }}>{label}</div>
                  <div style={{ fontSize:16, fontWeight:800, color, marginTop:2 }}>{value}</div>
                </div>
              ))}
            </div>
            <Note style={{marginTop:12}}>
              The tree can only predict 3 distinct values (one per leaf). For more precision,
              add more splits (deeper tree) or use an ensemble (Random Forest, Gradient Boosting).
            </Note>
          </>
        );
      },
    },

    // ── Stage 8: Bias-Variance Tradeoff ──
    {
      id: "reg-biasvar", group: "Regularization", title: "Bias-Variance Tradeoff",
      map: "Bias-Variance",
      why: "For regression, a shallow tree is high-bias (coarse step function), a deep tree is high-variance (memorizes each point). The sweet spot minimizes total error.",
      render: () => {
        const depths = [1, 2, 3, 4, 5, 6];
        const trainMSE = [1.8, 0.32, 0.08, 0.01, 0.001, 0.000];
        const valMSE   = [1.9, 0.55, 0.58, 0.72, 0.90,  1.15];
        const W = 420, H = 190, padL = 50, padR = 15, padT = 20, padB = 40;
        const pw = W-padL-padR, ph = H-padT-padB;
        const xi = i => padL + (i/(depths.length-1))*pw;
        const yv = v => padT + ph - Math.min((v/2)*ph, ph);

        return (
          <>
            <Lead>
              Shallow regression trees have <b>high bias</b> — the step function is too
              coarse to capture the true curve. Deep trees <b>memorize</b> every training
              point, performing poorly on new data (high variance).
            </Lead>
            <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart" style={{marginBottom:16}}>
              <polyline
                points={trainMSE.map((v,i)=>`${xi(i)},${yv(v)}`).join(" ")}
                fill="none" stroke="var(--accent)" strokeWidth="2" />
              <polyline
                points={valMSE.map((v,i)=>`${xi(i)},${yv(v)}`).join(" ")}
                fill="none" stroke="#e0492e" strokeWidth="2" strokeDasharray="6 3" />
              {trainMSE.map((v,i) => (
                <circle key={i} cx={xi(i)} cy={yv(v)} r="4"
                  fill="var(--accent)" stroke="var(--panel-solid)" strokeWidth="1.5" />
              ))}
              {valMSE.map((v,i) => (
                <circle key={i} cx={xi(i)} cy={yv(v)} r="4"
                  fill="#e0492e" stroke="var(--panel-solid)" strokeWidth="1.5" />
              ))}
              {/* sweet spot */}
              <line x1={xi(1)} y1={padT} x2={xi(1)} y2={padT+ph}
                stroke="#1f9e6b" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x={xi(1)+4} y={padT+12} fontSize="9.5" fill="#1f9e6b" fontWeight="700">
                best
              </text>
              {/* axes */}
              <line x1={padL} y1={padT+ph} x2={padL+pw} y2={padT+ph} stroke="var(--faint)" />
              <line x1={padL} y1={padT}    x2={padL}    y2={padT+ph} stroke="var(--faint)" />
              {depths.map((d,i) => (
                <text key={d} x={xi(i)} y={padT+ph+14} textAnchor="middle"
                  fontSize="9" fill="var(--faint)">{d}</text>
              ))}
              {[0, 0.5, 1.0, 1.5, 2.0].map(v => (
                <text key={v} x={padL-5} y={yv(v)+4} textAnchor="end"
                  fontSize="9" fill="var(--faint)">{v}</text>
              ))}
              <text x={padL+pw/2} y={H-4} textAnchor="middle" className="reg-axl">max_depth</text>
              <text x="13" y={padT+ph/2} textAnchor="middle" className="reg-axl"
                transform={`rotate(-90,13,${padT+ph/2})`}>MSE</text>
              {/* legend */}
              <rect x={padL+pw-90} y={padT+5} width="8" height="3" rx="1" fill="var(--accent)" />
              <text x={padL+pw-78} y={padT+9} fontSize="9.5" fill="var(--muted)">train MSE</text>
              <rect x={padL+pw-90} y={padT+20} width="8" height="3" rx="1" fill="#e0492e" />
              <text x={padL+pw-78} y={padT+24} fontSize="9.5" fill="var(--muted)">val MSE</text>
            </svg>
            <div className="tf-lifecycle">
              <div className="tf-life tf-life--train">
                <div className="tf-life-h"><span>B</span><span>High Bias (shallow)</span></div>
                <p>Step function is too coarse. Large regions average over very different prices. Prediction error is systematic.</p>
              </div>
              <div className="tf-life tf-life--infer">
                <div className="tf-life-h"><span>V</span><span>High Variance (deep)</span></div>
                <p>Each leaf has 1 training sample. Perfect on training set but any new house will land in the wrong region.</p>
              </div>
            </div>
            <Note>
              For our 8-house dataset, <b>depth=2</b> is the sweet spot.
              In practice, use cross-validation to find the optimal depth.
            </Note>
          </>
        );
      },
    },

    // ── Stage 9: Comparison & When to Use ──
    {
      id: "reg-compare", group: "Insights", title: "Decision Tree vs Linear Regression",
      map: "Comparison",
      why: "Knowing when to use a decision tree vs linear regression is a key skill. Each has strengths depending on the data's structure.",
      render: () => (
        <>
          <Lead>
            Decision trees and linear regression both solve regression problems, but they
            model the relationship very differently. Choosing the right one depends on
            whether your data is <b>linear or piecewise/non-linear</b>.
          </Lead>
          <div className="tf-lifecycle" style={{ marginBottom:16 }}>
            <div className="tf-life tf-life--train">
              <div className="tf-life-h"><span>DT</span><span>Decision Tree</span></div>
              <p>Predicts a <b>piecewise constant</b> (step function). No assumptions about the data distribution. Can model non-linear, threshold-based relationships naturally.</p>
            </div>
            <div className="tf-life tf-life--infer">
              <div className="tf-life-h"><span>LR</span><span>Linear Regression</span></div>
              <p>Predicts a <b>straight line</b>. Strong assumption: linear relationship. Very efficient, extrapolates beyond training range, interpretable coefficients.</p>
            </div>
          </div>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">Decision Tree pros</div>
              <ul>
                <li>Handles non-linear, threshold-based patterns</li>
                <li>No feature scaling needed</li>
                <li>Handles mixed feature types</li>
                <li>Highly interpretable predictions</li>
                <li>Robust to outliers in inputs</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">Decision Tree cons</div>
              <ul>
                <li>Step-function: can't interpolate smoothly</li>
                <li>High variance (overfits easily)</li>
                <li>Doesn't extrapolate beyond training range</li>
                <li>Less efficient than linear regression for linear data</li>
              </ul>
            </div>
          </div>
          <div className="tf-subhead">When to use a decision tree for regression</div>
          <div className="tf-legend">
            {[
              ["Non-linear data", "Prices that change abruptly at certain thresholds, not smoothly."],
              ["Interactions", "When feature effects interact (e.g., price depends on age×location jointly)."],
              ["Mixed features", "Mix of numerical and categorical inputs — trees handle both natively."],
              ["Explainability needed", "Each prediction has a clear, traceable path through the tree."],
              ["Ensemble base", "Single trees are the building block for Random Forests and Gradient Boosting."],
            ].map(([n,d]) => (
              <div className="tf-leg is-learned" key={n}>
                <div className="tf-leg-name">{n}</div>
                <div className="tf-leg-desc">{d}</div>
              </div>
            ))}
          </div>
          <Note>
            In practice, <b>single regression trees are rarely used alone</b>.
            Their real power comes in ensembles — Random Forests average many trees
            to reduce variance; Gradient Boosting sequentially adds trees to reduce bias.
          </Note>
        </>
      ),
    },
  ];

  // ── Input renderer ──
  function renderInput(input, setInput) {
    return (
      <label className="nn-slider">
        <span className="nn-slider-l">age</span>
        <input type="range" min="1" max="45" step="1"
          value={input.age}
          onChange={e => setInput({ age: parseInt(e.target.value) })} />
        <span className="nn-slider-v">{input.age} yr</span>
      </label>
    );
  }

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "Decision Tree",
    subtitle: "Regression · House Prices",
    cur: "Decision Tree",
    category: "ML Algorithms",
    run: runDTreeReg,
    default: DT_REG.default,
    renderInput,
    modeLinks: [
      { label: "Classification", href: "Decision Tree (Classification).html", active: false },
      { label: "Regression",     href: "Decision Tree (Regression).html",     active: true },
    ],
  };
})();
