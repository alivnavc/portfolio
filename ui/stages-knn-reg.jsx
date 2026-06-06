/* ============================================================
   KNN Regression — 9 interactive stages
   Requires: window.ML_KNN, shared primitives on window
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState, useMemo, useRef, useEffect } = React;
  const KNN = window.ML_KNN;

  const fmtN = (n, d = 2) => (+n).toFixed(d);
  const POINT_COLOR    = "#2B5BFF";
  const QUERY_COLOR    = "#F5A623";
  const NEIGHBOR_COLOR = "#1DAA6B";

  // ── SVG Scatter for 1D regression ──
  function RegScatter({ query, neighbors, showPred, highlightCurve, curveK }) {
    const data = KNN.KNN_REG.data;
    const W=480,H=260,PAD_L=44,PAD_R=24,PAD_T=20,PAD_B=36;
    const minX=0.5,maxX=12.5,minY=0,maxY=8;
    const sx = x => PAD_L + (x-minX)/(maxX-minX)*(W-PAD_L-PAD_R);
    const sy = y => H-PAD_B - (y-minY)/(maxY-minY)*(H-PAD_T-PAD_B);

    const neighborSet = new Set((neighbors||[]).map(n=>n.i));
    const predY = neighbors && neighbors.length > 0
      ? neighbors.reduce((s,n)=>s+data[n.i][1],0)/neighbors.length
      : null;

    const curve = useMemo(() => {
      if (!highlightCurve) return null;
      const ks = curveK || [1,3,7];
      return ks.map(k => {
        const c = KNN.knnRegCurve(k,100);
        return {k, pts:c.xs.map((x,i)=>[x,c.ys[i]])};
      });
    }, [highlightCurve, JSON.stringify(curveK)]);

    const curveColors = ["#E0431E","#2B5BFF","#1DAA6B"];

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", maxWidth:W, height:"auto", border:"1px solid var(--line)", borderRadius:14, background:"var(--panel-solid)", boxShadow:"var(--shadow)" }}>
        {/* grid */}
        {[0,2,4,6,8].map(v=>(
          <g key={v}>
            <line x1={PAD_L} y1={sy(v)} x2={W-PAD_R} y2={sy(v)} stroke="var(--line)" strokeWidth="0.5"/>
            <text x={PAD_L-6} y={sy(v)+4} textAnchor="end" fontSize="9" fill="var(--faint)">{v}</text>
          </g>
        ))}
        {[2,4,6,8,10,12].map(v=>(
          <g key={v}>
            <line x1={sx(v)} y1={PAD_T} x2={sx(v)} y2={H-PAD_B} stroke="var(--line)" strokeWidth="0.5"/>
            <text x={sx(v)} y={H-PAD_B+14} textAnchor="middle" fontSize="9" fill="var(--faint)">{v}</text>
          </g>
        ))}
        <text x={W/2} y={H-2} textAnchor="middle" fontSize="11" fill="var(--muted)" fontWeight="600">x</text>
        <text x={10} y={H/2} textAnchor="middle" fontSize="11" fill="var(--muted)" fontWeight="600" transform={`rotate(-90,10,${H/2})`}>y</text>

        {/* KNN prediction curves */}
        {curve && curve.map((c,ci)=>{
          const d=c.pts.map((p,i)=>`${i===0?"M":"L"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ");
          return (
            <path key={ci} d={d} fill="none" stroke={curveColors[ci]}
              strokeWidth={c.k===3?2.5:1.5}
              strokeDasharray={c.k===7?"5 3":"none"}
              opacity={0.75}/>
          );
        })}

        {/* horizontal dashed lines from neighbor y-values to query x */}
        {query !== undefined && neighbors && neighbors.map((n,i)=>{
          const pt = data[n.i];
          return (
            <line key={i}
              x1={sx(pt[0])} y1={sy(pt[1])}
              x2={sx(query)} y2={sy(pt[1])}
              stroke={NEIGHBOR_COLOR} strokeWidth="1" strokeDasharray="3 2" opacity="0.6"/>
          );
        })}

        {/* data points */}
        {data.map(([x,y],i)=>{
          const isN = neighborSet.has(i);
          return (
            <g key={i}>
              {isN && <circle cx={sx(x)} cy={sy(y)} r={11} fill="none"
                stroke={NEIGHBOR_COLOR} strokeWidth="2" opacity="0.5"/>}
              <circle cx={sx(x)} cy={sy(y)} r={isN?7:5}
                fill={isN?"rgba(29,170,107,0.25)":"rgba(43,91,255,0.18)"}
                stroke={isN?NEIGHBOR_COLOR:POINT_COLOR} strokeWidth={isN?2:1.5}/>
            </g>
          );
        })}

        {/* prediction horizontal line */}
        {showPred && predY !== null && (
          <g>
            <line x1={PAD_L} y1={sy(predY)} x2={W-PAD_R} y2={sy(predY)}
              stroke={QUERY_COLOR} strokeWidth="1.5" strokeDasharray="6 3" opacity="0.7"/>
            <text x={W-PAD_R+2} y={sy(predY)+4} fontSize="10" fill={QUERY_COLOR} fontWeight="700">ŷ={fmtN(predY,2)}</text>
          </g>
        )}

        {/* query vertical line */}
        {query !== undefined && (
          <g>
            <line x1={sx(query)} y1={PAD_T} x2={sx(query)} y2={H-PAD_B}
              stroke={QUERY_COLOR} strokeWidth="2" strokeDasharray="5 3" opacity="0.8"/>
            <text x={sx(query)} y={PAD_T-5} textAnchor="middle" fontSize="11" fill={QUERY_COLOR} fontWeight="700">★</text>
            <text x={sx(query)} y={H-PAD_B+26} textAnchor="middle" fontSize="9" fill={QUERY_COLOR}>x={fmtN(query,1)}</text>
          </g>
        )}
      </svg>
    );
  }

  // ── LOO cross-validation MSE chart ──
  function MSECurveViz() {
    const ks   = [1,2,3,4,5,6,7,8,9,10,11,12];
    const data = KNN.KNN_REG.data;
    const n    = data.length;

    // leave-one-out CV
    const testMSE = ks.map(k => {
      let mse=0;
      for (let i=0; i<n; i++) {
        const train = data.filter((_,j)=>j!==i);
        const q     = data[i][0];
        const dists = train.map(pt=>({dist:Math.abs(q-pt[0]),y:pt[1]})).sort((a,b)=>a.dist-b.dist).slice(0,Math.min(k,train.length));
        const pred  = dists.reduce((s,d)=>s+d.y,0)/dists.length;
        mse += (pred-data[i][1])**2;
      }
      return mse/n;
    });

    const trainMSE = ks.map(k => {
      if (k===1) return 0;
      let mse=0;
      for (let i=0; i<n; i++) {
        const q     = data[i][0];
        const dists = data.map((pt,j)=>({dist:j===i?0:Math.abs(q-pt[0]),y:pt[1]})).sort((a,b)=>a.dist-b.dist).slice(0,k);
        const pred  = dists.reduce((s,d)=>s+d.y,0)/dists.length;
        mse += (pred-data[i][1])**2;
      }
      return mse/n;
    });

    const maxMSE = Math.max(...testMSE,...trainMSE)*1.15;
    const W=420,H=200,PAD_L=44,PAD_R=20,PAD_T=20,PAD_B=36;
    const sx = k => PAD_L+((k-1)/(ks.length-1))*(W-PAD_L-PAD_R);
    const sy = v => H-PAD_B-(v/maxMSE)*(H-PAD_T-PAD_B);
    const pathFor = arr => arr.map((v,i)=>`${i===0?"M":"L"}${sx(ks[i]).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
    const optK = testMSE.indexOf(Math.min(...testMSE))+1;

    return (
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", maxWidth:W, height:"auto", border:"1px solid var(--line)", borderRadius:12, background:"var(--panel-solid)" }}>
          {[0.25,0.5,0.75,1.0].map(f=>{
            const v=f*maxMSE;
            return <line key={f} x1={PAD_L} y1={sy(v)} x2={W-PAD_R} y2={sy(v)} stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3"/>;
          })}
          {ks.map(k=>(
            <text key={k} x={sx(k)} y={H-PAD_B+14} textAnchor="middle" fontSize="9" fill="var(--faint)">{k}</text>
          ))}
          <line x1={sx(optK)} y1={PAD_T} x2={sx(optK)} y2={H-PAD_B} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6"/>
          <text x={sx(optK)} y={PAD_T-5} textAnchor="middle" fontSize="10" fill="var(--accent-ink)" fontWeight="700">k*={optK}</text>
          <path d={pathFor(trainMSE)} fill="none" stroke="#1DAA6B" strokeWidth="2"/>
          {trainMSE.map((v,i)=><circle key={i} cx={sx(ks[i])} cy={sy(v)} r={3} fill="#1DAA6B"/>)}
          <path d={pathFor(testMSE)} fill="none" stroke="#E0431E" strokeWidth="2.5" strokeDasharray="5 3"/>
          {testMSE.map((v,i)=><circle key={i} cx={sx(ks[i])} cy={sy(v)} r={3} fill="#E0431E"/>)}
          <text x={W/2} y={H-2} textAnchor="middle" fontSize="11" fill="var(--muted)" fontWeight="600">k</text>
          <text x={10} y={H/2} textAnchor="middle" fontSize="11" fill="var(--muted)" fontWeight="600" transform={`rotate(-90,10,${H/2})`}>MSE</text>
        </svg>
        <div style={{ display:"flex", gap:16, marginTop:8 }}>
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--muted)" }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#1DAA6B" strokeWidth="2"/></svg>
            Train MSE
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--muted)" }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#E0431E" strokeWidth="2" strokeDasharray="5 3"/></svg>
            Test MSE (LOO-CV)
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--accent-ink)", fontWeight:700 }}>
            Optimal: k={optK}
          </span>
        </div>
      </div>
    );
  }

  function renderInput(input, setInput) {
    const set = (k,v) => setInput(i=>({...i,[k]:v}));
    return (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">x</span>
          <input type="range" min="1" max="12" step="0.1" value={input.x} onChange={e=>set("x",parseFloat(e.target.value))}/>
          <span className="nn-slider-v">{fmtN(input.x,1)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">k</span>
          <input type="range" min="1" max="5" step="1" value={input.k} onChange={e=>set("k",parseInt(e.target.value))}/>
          <span className="nn-slider-v">{input.k}</span>
        </label>
      </>
    );
  }

  // ════════════════════════════════════════
  //  STAGES
  // ════════════════════════════════════════
  const STAGES = [

    // ── Stage 1: Overview ──
    {
      id:"overview", group:"Overview", title:"KNN regression — predict by averaging neighbors", map:"Overview",
      why:"KNN isn't just for classification. For regression, instead of voting for a class, neighbors average their target values to produce a continuous prediction.",
      render:(t) => (
        <>
          <Lead>
            <b>KNN for regression</b> works identically to KNN classification, except in the very
            last step. Instead of a majority vote, we compute the <b>arithmetic mean</b> of the
            k neighbors' target values y. The result is a continuous prediction ŷ — no categories,
            no classes, just a number.
          </Lead>
          <Lead>
            Like its classification counterpart, KNN regression is a <b>lazy learner</b> — nothing
            is computed at training time. Every (x, y) pair is simply memorised. At prediction time,
            the algorithm finds the k nearest training inputs and averages their outputs.
            It is <b>non-parametric</b>: it makes no assumption about the functional form of
            the relationship between x and y — the "model" is the entire dataset.
          </Lead>
          <div className="tf-lifecycle">
            <div className="tf-life tf-life--train" style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase", marginBottom:8, opacity:.7 }}>Training phase — O(1)</div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Store all (x, y) pairs</div>
              <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5 }}>No fitting, no parameters — every training example is memorised verbatim. The entire dataset is the model.</div>
            </div>
            <div className="tf-life tf-life--infer" style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase", marginBottom:8, opacity:.7 }}>Prediction phase — O(n)</div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Find k nearest → average</div>
              <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5 }}>For query x: compute |x−xᵢ| for all i, pick k smallest, average their yᵢ values. ŷ = (1/k)Σyᵢ.</div>
            </div>
          </div>
          <div className="tf-subhead">Full prediction pipeline</div>
          <div className="nn-calc">
            <div className="nn-calc-h">Step-by-step algorithm</div>
            <div className="nn-calc-row"><b>Input:</b> training set {"{(x₁,y₁),…,(xₙ,yₙ)}"}, query xₒ, hyperparameter k</div>
            <div className="nn-calc-row">1. For every training point xᵢ: compute d(xₒ, xᵢ) = |xₒ − xᵢ| (in 1D)</div>
            <div className="nn-calc-row">2. Sort ascending by distance → get ordered list [(x_(1), y_(1)), …]</div>
            <div className="nn-calc-row">3. Keep k points with smallest distances → N_k(xₒ)</div>
            <div className="nn-calc-row">4. Average their y values: ŷ = (1/k) · Σᵢ∈N_k yᵢ</div>
            <div className="nn-calc-row"><b>Output:</b> continuous prediction ŷ ∈ ℝ</div>
          </div>
          <div className="tf-subhead">Interactive preview</div>
          <RegScatter query={t.query} neighbors={t.neighbors} showPred />
          <div style={{ marginTop:10, padding:"10px 14px", background:"var(--accent-soft)", borderRadius:10, fontSize:13 }}>
            Query at x={fmtN(t.query,1)} — k={t.neighbors.length} neighbors average to
            <b style={{ color:"var(--accent-ink)", marginLeft:6 }}>ŷ = {fmtN(t.pred,3)}</b>
          </div>
          <Note>The dashed vertical line marks the query x. The dashed horizontal line shows the predicted ŷ. The green dots are the k nearest neighbors being averaged.</Note>
        </>
      ),
    },

    // ── Stage 2: Dataset ──
    {
      id:"dataset", group:"Data", title:"The dataset — 12 noisy 1D points", map:"Dataset",
      why:"For 1D regression, our data is simply (x, y) pairs. The relationship is non-linear — a noisy wave that KNN can approximate without ever knowing its functional form.",
      render:(t) => (
        <>
          <Lead>
            We have <b>12 training points</b> sampled from a noisy, wave-like curve. The feature
            x ranges from 1 to 12 and the target y ranges from 2 to 6. This pattern is non-linear
            — a straight line would underfit it badly. KNN handles it naturally because it adapts
            to local structure.
          </Lead>
          <Lead>
            The dashed vertical line marks the <b>query x = {fmtN(t.query,1)}</b>. KNN will predict
            by averaging the y-values of the k=1 to 5 nearest training points (in x distance). As
            you move the query, you can see how the prediction tracks the local average of the data.
          </Lead>
          <RegScatter query={t.query} />
          <div className="tf-subhead">All 12 training points</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, margin:"8px 0" }}>
            {KNN.KNN_REG.data.map(([x,y],i) => (
              <div key={i} style={{
                padding:"7px 11px", borderRadius:8,
                border:"1px solid var(--line)", background:"var(--panel-solid)",
                fontSize:12, fontFamily:"var(--num-font)", minWidth:88,
              }}>
                <div style={{ color:"var(--faint)", fontSize:10, marginBottom:2 }}>P{i}</div>
                <div><span style={{ color:"var(--accent-ink)" }}>x={x}</span> <span style={{ color:"var(--muted)" }}>y={y}</span></div>
              </div>
            ))}
          </div>
          <Note>Unlike classification, the target y is a real number. We cannot vote — we average. This is the fundamental difference between KNN classification and KNN regression.</Note>
        </>
      ),
    },

    // ── Stage 3: Distance & Feature Scaling ──
    {
      id:"distance", group:"Algorithm", title:"Distance & feature scaling — same rules apply", map:"Distance",
      why:"Distance is the backbone of KNN regression just as in classification. The scaling requirement is equally critical.",
      render:(t) => {
        const data   = KNN.KNN_REG.data;
        const sorted = t.allDists.slice().sort((a,b)=>a.dist-b.dist);
        return (
          <>
            <Lead>
              In 1D, the Euclidean distance between query x and training point xᵢ simplifies to the
              <b> absolute difference</b>: d = |x − xᵢ|. In higher dimensions it generalises to
              √(Σ(xⱼ−xᵢⱼ)²). The principle is identical: smaller distance = closer neighbor =
              more influence on the prediction.
            </Lead>
            <Formula label="1D distance">d(q, xᵢ) = |q − xᵢ|</Formula>
            <Formula label="multi-D distance">d(q, xᵢ) = √( Σⱼ (qⱼ − xᵢⱼ)² )</Formula>
            <div className="nn-calc">
              <div className="nn-calc-h">Distances from query x = {fmtN(t.query,2)}</div>
              {sorted.slice(0,5).map((d,rank) => {
                const pt = data[d.i];
                return (
                  <div key={d.i} className="nn-calc-row">
                    <b>P{d.i}</b> (x={pt[0]}, y={pt[1]}): |{fmtN(t.query,2)} − {pt[0]}| = <b style={{ color: rank < t.neighbors.length ? "var(--accent-ink)" : "inherit" }}>{fmtN(d.dist,3)}</b>
                    {rank < t.neighbors.length && <span style={{ marginLeft:8, color:NEIGHBOR_COLOR, fontWeight:700 }}>← neighbor {rank+1}</span>}
                  </div>
                );
              })}
              {sorted.length > 5 && <div className="nn-calc-row" style={{ color:"var(--faint)" }}>…and {sorted.length-5} more points</div>}
            </div>
            <div className="tf-subhead">All distances sorted ascending</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid var(--line)" }}>
                    {["Rank","P#","x","y","|q−x|","Neighbor?"].map(h=>(
                      <th key={h} style={{ padding:"6px 10px", textAlign:"left", fontSize:11, fontWeight:800, letterSpacing:".06em", textTransform:"uppercase", color:"var(--muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((d,rank) => {
                    const pt  = data[d.i];
                    const isN = rank < t.neighbors.length;
                    return (
                      <tr key={d.i} style={{ background: isN ? "rgba(29,170,107,0.1)" : "transparent", borderBottom:"1px solid var(--line)", fontWeight: isN ? 700 : 400 }}>
                        <td style={{ padding:"5px 10px", fontFamily:"var(--num-font)" }}>{rank+1}</td>
                        <td style={{ padding:"5px 10px", fontFamily:"var(--num-font)", color:"var(--faint)" }}>P{d.i}</td>
                        <td style={{ padding:"5px 10px", fontFamily:"var(--num-font)" }}>{pt[0]}</td>
                        <td style={{ padding:"5px 10px", fontFamily:"var(--num-font)" }}>{pt[1]}</td>
                        <td style={{ padding:"5px 10px", fontFamily:"var(--num-font)", color: isN ? NEIGHBOR_COLOR : "var(--muted)" }}>{fmtN(d.dist,3)}{isN && <span style={{ marginLeft:6, color:NEIGHBOR_COLOR }}>●</span>}</td>
                        <td style={{ padding:"5px 10px", fontSize:12, color: isN ? NEIGHBOR_COLOR : "var(--faint)" }}>{isN ? `Yes (rank ${rank+1})` : ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="tf-subhead">Feature scaling — equally critical for regression</div>
            <Lead>
              In multi-dimensional regression, the same rule applies as in classification:
              <b> all features must be scaled</b> to comparable ranges before computing distance.
              If feature x₁ is salary (0–100,000) and x₂ is age (0–50), salary will dominate the
              distance calculation and x₂ will be ignored. Use StandardScaler or MinMaxScaler,
              fitted on training data only, applied identically to query points.
            </Lead>
            <div className="opt-pc">
              <div className="opt-pc-col is-pro">
                <div className="opt-pc-h">✓ With scaling</div>
                <ul>
                  <li>All features contribute equally to distance</li>
                  <li>KNN finds geometrically meaningful neighbors</li>
                  <li>Consistent behavior across feature ranges</li>
                </ul>
              </div>
              <div className="opt-pc-col is-con">
                <div className="opt-pc-h">✗ Without scaling</div>
                <ul>
                  <li>High-range features dominate distance</li>
                  <li>Low-range features effectively invisible</li>
                  <li>Predictions can be entirely wrong</li>
                </ul>
              </div>
            </div>
            <Note>The green-highlighted rows are the k nearest neighbors that will be averaged. Their y-values are the only ones that contribute to ŷ — all other training points are ignored.</Note>
          </>
        );
      },
    },

    // ── Stage 4: Finding Neighbors & Averaging ──
    {
      id:"average", group:"Algorithm", title:"Finding neighbors & averaging — ŷ = (1/k)Σyᵢ", map:"Averaging",
      why:"Walking through the full computation with actual numbers makes the algorithm a concrete procedure rather than an abstraction.",
      render:(t) => {
        const data  = KNN.KNN_REG.data;
        const yVals = t.neighbors.map(n=>data[n.i][1]);
        const sum   = yVals.reduce((a,b)=>a+b,0);
        const kthDist = t.neighbors[t.neighbors.length-1]?.dist;

        return (
          <>
            <Lead>
              For query x = <b>{fmtN(t.query,1)}</b> with k = <b>{t.neighbors.length}</b>, we have
              found the {t.neighbors.length} nearest training points within distance {fmtN(kthDist,3)}.
              Now we average their y-values to get the prediction. That's it — the entire regression
              algorithm in one arithmetic mean.
            </Lead>
            <Formula label="KNN regression prediction">ŷ = (1/k) · Σᵢ∈N_k(xₒ) yᵢ</Formula>
            <div className="nn-calc">
              <div className="nn-calc-h">Step-by-step prediction for x = {fmtN(t.query,2)}, k = {t.neighbors.length}</div>
              {t.neighbors.map((n,i) => {
                const pt = data[n.i];
                return (
                  <div key={i} className="nn-calc-row">
                    Neighbor {i+1}: P{n.i} at <b>x={pt[0]}</b>, y=<b style={{ color:NEIGHBOR_COLOR }}>{pt[1]}</b>  (dist={fmtN(n.dist,3)})
                  </div>
                );
              })}
              <div className="nn-calc-row" style={{ borderTop:"1px solid var(--line)", paddingTop:6, marginTop:4 }}>
                y-values: [{yVals.map((y,i) => <span key={i} style={{ color:NEIGHBOR_COLOR, fontWeight:700 }}>{y}{i<yVals.length-1?", ":""}</span>)}]
              </div>
              <div className="nn-calc-row">
                Sum = {yVals.join(" + ")} = <b>{fmtN(sum,3)}</b>
              </div>
              <div className="nn-calc-row">
                ŷ = {fmtN(sum,3)} / {t.neighbors.length} = <b style={{ color:QUERY_COLOR, fontSize:16 }}>{fmtN(t.pred,4)}</b>
              </div>
            </div>
            <RegScatter query={t.query} neighbors={t.neighbors} showPred />
            <div style={{ margin:"10px 0", padding:"12px 16px", borderRadius:12, border:`2px solid ${QUERY_COLOR}`, background:"rgba(245,166,35,0.1)", display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:13, fontWeight:700 }}>Prediction:</span>
              <span style={{ fontFamily:"var(--num-font)", fontSize:22, fontWeight:800, color:QUERY_COLOR }}>ŷ = {fmtN(t.pred,3)}</span>
              <span style={{ fontSize:12, color:"var(--muted)", marginLeft:"auto" }}>at x = {fmtN(t.query,1)},  k = {t.neighbors.length}</span>
            </div>
            <div className="tf-subhead">Analogy: house price prediction</div>
            <div style={{ padding:"12px 16px", borderRadius:10, background:"var(--accent-soft)", border:"1px solid var(--line)", fontSize:13, lineHeight:1.7 }}>
              "We want to predict the price of a house with floor area 45m². The 3 most similar houses
              in our training data (by floor area) sold for <b>$310k, $360k, and $400k</b>.
              KNN prediction: ŷ = (310 + 360 + 400) / 3 = <b>$356.7k</b>. Simple, interpretable,
              no assumptions about the price-area relationship."
            </div>
            <Note>The dashed horizontal lines in the chart connect each neighbor's y-value to the query position, making it visually clear which y-values enter the average. Move the query to see how the neighbors and the average change.</Note>
          </>
        );
      },
    },

    // ── Stage 5: Weighted KNN ──
    {
      id:"weighted", group:"Algorithm", title:"Weighted KNN — closer neighbors matter more", map:"Weighted",
      why:"Uniform averaging gives a faraway neighbor the same influence as a very close one. Weighting by inverse distance makes the prediction more locally accurate.",
      render:(t) => {
        const data     = KNN.KNN_REG.data;
        const eps      = 1e-6;
        const wRaw     = t.neighbors.map(n=>1/Math.max(n.dist,eps));
        const totalW   = wRaw.reduce((a,b)=>a+b,0);
        const weights  = wRaw.map(w=>w/totalW);
        const predW    = t.neighbors.reduce((s,n,i)=>s+weights[i]*data[n.i][1],0);

        return (
          <>
            <Lead>
              In standard KNN regression, every one of the k neighbors contributes <b>equally</b> —
              weight 1/k. But a neighbor at distance 0.1 should clearly dominate over one at
              distance 4.0. <b>Weighted KNN</b> assigns each neighbor a weight proportional to
              <b> 1/dᵢ</b> (inverse distance). Nearer neighbors contribute more; distant ones
              contribute less.
            </Lead>
            <Formula label="inverse-distance weights">wᵢ = (1/dᵢ) / Σⱼ (1/dⱼ)</Formula>
            <Formula label="weighted prediction">ŷ = Σᵢ wᵢ · yᵢ  =  [Σ (yᵢ/dᵢ)] / [Σ (1/dᵢ)]</Formula>
            <div className="nn-calc">
              <div className="nn-calc-h">Weighted prediction for x = {fmtN(t.query,2)}, k = {t.neighbors.length}</div>
              {t.neighbors.map((n,i) => {
                const pt   = data[n.i];
                const wRaw_i = wRaw[i];
                const wNorm  = weights[i];
                return (
                  <div key={i} className="nn-calc-row">
                    <b>P{n.i}</b> y={pt[1]}, d={fmtN(n.dist,3)}
                    <span style={{ margin:"0 6px", color:"var(--muted)" }}>→ w=1/{fmtN(n.dist,3)} =</span>
                    <b style={{ color:NEIGHBOR_COLOR }}>{fmtN(wRaw_i,3)}</b>
                    <span style={{ color:"var(--faint)", marginLeft:8 }}>({(wNorm*100).toFixed(1)}% of total)</span>
                  </div>
                );
              })}
              <div className="nn-calc-row" style={{ borderTop:"1px solid var(--line)", paddingTop:6, marginTop:4 }}>
                ŷ_weighted = Σ(wᵢ·yᵢ)/Σwᵢ = <b style={{ color:QUERY_COLOR }}>{fmtN(predW,4)}</b>
              </div>
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", margin:"12px 0" }}>
              <div style={{ flex:1, padding:"12px 14px", borderRadius:10, border:"1.5px solid var(--line)", background:"var(--panel-solid)", minWidth:160 }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:".07em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6 }}>Uniform average</div>
                <div style={{ fontFamily:"var(--num-font)", fontSize:22, fontWeight:800, color:"var(--accent-ink)" }}>{fmtN(t.pred,3)}</div>
                <div style={{ fontSize:11, color:"var(--faint)", marginTop:4 }}>each neighbor weight = 1/{t.neighbors.length} = {fmtN(1/t.neighbors.length,3)}</div>
              </div>
              <div style={{ flex:1, padding:"12px 14px", borderRadius:10, border:`2px solid ${QUERY_COLOR}`, background:"rgba(245,166,35,0.1)", minWidth:160 }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:".07em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6 }}>Weighted average (1/d)</div>
                <div style={{ fontFamily:"var(--num-font)", fontSize:22, fontWeight:800, color:QUERY_COLOR }}>{fmtN(predW,3)}</div>
                <div style={{ fontSize:11, color:"var(--faint)", marginTop:4 }}>weights ∝ inverse distance</div>
              </div>
            </div>
            {Math.abs(predW - t.pred) > 0.01 && (
              <div style={{ padding:"10px 14px", background:"var(--accent-soft)", borderRadius:10, fontSize:13 }}>
                <b>Difference: {fmtN(Math.abs(predW-t.pred),3)}</b> — the nearest neighbor pulls the weighted prediction
                {predW > t.pred ? " higher" : " lower"} than the uniform average.
              </div>
            )}
            <div className="tf-subhead">When weighted KNN helps most</div>
            <div className="tf-legend">
              {[
                ["Asymmetric neighborhoods", "When the k-th neighbor is much farther than the 1st, it should contribute less"],
                ["Boundary regions", "Near the edge of training data, distant neighbors can bias the prediction strongly"],
                ["Smooth interpolation", "Weighted KNN passes exactly through training points when d→0 (ŷ = y_nearest exactly)"],
                ["Larger k", "With k=7 or k=9, weighting prevents distant neighbors from swamping the average"],
              ].map(([name,desc])=>(
                <div className="tf-leg" key={name}>
                  <div className="tf-leg-name">{name}</div>
                  <div className="tf-leg-desc">{desc}</div>
                </div>
              ))}
            </div>
            <Note>sklearn supports weighted KNN via KNeighborsRegressor(weights="distance"). At d=0 (query equals training point exactly), the prediction is that training point's y — no averaging needed.</Note>
          </>
        );
      },
    },

    // ── Stage 6: Effect of k on Regression ──
    {
      id:"keffect", group:"Concepts", title:"Effect of k — wiggly vs smooth prediction curve", map:"k Effect",
      why:"Plotting the full prediction function for different k values makes the bias-variance tradeoff visually unmistakable — the most powerful way to internalise this concept.",
      render:(t) => (
        <>
          <Lead>
            If we compute ŷ for every possible query x from 1 to 12, we get the KNN regression
            <b> curve</b>. The curve is piecewise-constant (step-like): it only changes value when
            a training point enters or exits the k-nearest window as x moves.
          </Lead>
          <Lead>
            <b>k=1</b> produces a jagged staircase that passes exactly through each training point —
            zero training error, but very sensitive to noise. <b>k=3</b> smooths the curve while
            preserving the general shape. <b>k=7</b> is very smooth but flattens out features,
            potentially missing important local trends.
          </Lead>
          <RegScatter query={t.query} neighbors={t.neighbors} showPred highlightCurve curveK={[1,3,7]} />
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", margin:"12px 0" }}>
            {[
              ["k=1 (jagged)","#E0431E","Zero training error — passes through every training point. High variance: any single noisy point creates a spike in the prediction curve."],
              ["k=3 (balanced)","#2B5BFF","Averages 3 neighbors — smooths local noise while preserving the wave shape. Reasonable bias-variance balance."],
              ["k=7 (smooth)","#1DAA6B","Very smooth but over-averaged. In sparse regions (few training points nearby), the prediction is dominated by far-off neighbors."],
            ].map(([label,color,desc])=>(
              <div key={label} style={{ display:"flex", gap:8, alignItems:"flex-start", flex:1, minWidth:180 }}>
                <div style={{ width:24, height:3, background:color, borderRadius:2, marginTop:8, flexShrink:0 }}/>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color }}>{label}</div>
                  <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.4, marginTop:2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="tf-subhead">Choosing k: validation is required</div>
          <div className="nn-calc">
            <div className="nn-calc-h">The bias-variance tradeoff as k changes</div>
            <div className="nn-calc-row"><b>k=1:</b> Low bias (memorises every training y), high variance (very sensitive to individual noisy points)</div>
            <div className="nn-calc-row"><b>k=3 to 5:</b> Often the sweet spot — consult cross-validation to find the optimal value</div>
            <div className="nn-calc-row"><b>k=n:</b> High bias (always predicts the global mean ȳ), zero variance — never changes regardless of query</div>
          </div>
          <Note>Notice how the k=1 curve (red) changes at exactly every training x value. That's because each training point is a breakpoint where the nearest neighbor changes. Larger k blends those steps together.</Note>
        </>
      ),
    },

    // ── Stage 7: Predictions on New Points ──
    {
      id:"predictions", group:"Algorithm", title:"Predictions on new query points — end-to-end", map:"Predictions",
      why:"Walking through complete predictions on several novel x values cements the algorithm as a repeatable mechanical procedure.",
      render:(t) => {
        const queries = [2.5, 5.5, 9.0];
        const k = t.neighbors.length;
        const data = KNN.KNN_REG.data;

        return (
          <>
            <Lead>
              Let's predict y for <b>3 new query points</b> not in the training data, using k={k}.
              For each query: find the k nearest training x-values, collect their y-values, average.
            </Lead>
            {queries.map((qx,qi) => {
              const res  = KNN.runKNNReg({x:qx,k});
              const topK = res.neighbors;
              const yVals= topK.map(n=>data[n.i][1]);
              const sum  = yVals.reduce((a,b)=>a+b,0);
              return (
                <div key={qi} style={{ marginBottom:16, padding:"14px 16px", borderRadius:12, border:`2px solid ${QUERY_COLOR}`, background:"rgba(245,166,35,0.07)" }}>
                  <div style={{ fontSize:13, fontWeight:800, marginBottom:8 }}>
                    Query Q{qi+1}: x = {qx}
                  </div>
                  <div className="nn-calc" style={{ background:"var(--panel-solid)", marginBottom:8 }}>
                    <div className="nn-calc-h">Top k={k} neighbors</div>
                    {topK.map((n,i) => {
                      const pt = data[n.i];
                      return (
                        <div key={i} className="nn-calc-row">
                          <b>P{n.i}</b> x={pt[0]}, <span style={{ color:NEIGHBOR_COLOR, fontWeight:700 }}>y={pt[1]}</span>  dist={fmtN(n.dist,3)}
                        </div>
                      );
                    })}
                    <div className="nn-calc-row" style={{ borderTop:"1px solid var(--line)", paddingTop:5, marginTop:4 }}>
                      ŷ = ({yVals.join(" + ")}) / {k} = {fmtN(sum,3)} / {k} =
                      <b style={{ color:QUERY_COLOR, marginLeft:6, fontSize:15 }}>{fmtN(res.pred,3)}</b>
                    </div>
                  </div>
                </div>
              );
            })}
            <RegScatter query={t.query} neighbors={t.neighbors} showPred />
            <Note>Use the sliders above to interactively explore predictions at any x. Try x values between training points (interpolation) vs beyond the training range (extrapolation — where KNN is poor).</Note>
          </>
        );
      },
    },

    // ── Stage 8: Missing Values & Outliers ──
    {
      id:"robustness", group:"Concepts", title:"Missing values & outliers — real-world fragilities", map:"Robustness",
      why:"Production datasets almost always have missing values and outliers. Understanding how KNN responds to each — and what to do about it — is essential practical knowledge.",
      render:(t) => {
        const data = KNN.KNN_REG.data;
        // synthetic outlier: at x=5 the true y should be ~5.2 but we have y=12
        const outlierIdx = 4; // P4: [5, 5.2]
        const outlierY   = 12;
        const dataWithOutlier = data.map((pt,i) => i===outlierIdx ? [pt[0],outlierY] : pt);

        const cleanPred   = t.pred;
        const k           = t.neighbors.length;
        const qx          = t.query;

        // predict with outlier
        const distOut = dataWithOutlier.map(([x,y],i)=>({i,dist:Math.abs(qx-x),label:y})).sort((a,b)=>a.dist-b.dist);
        const topOut  = distOut.slice(0,k);
        const predOut = topOut.reduce((s,n)=>s+n.label,0)/k;

        return (
          <>
            <Lead>
              KNN regression has two important fragilities. First, <b>outliers</b>: because KNN
              uses training y-values directly in the average, a single mislabeled or extreme y-value
              can severely distort predictions for all nearby queries. A single outlier with
              y=12 (true value ~5) can inflate any prediction that includes it as a neighbor.
            </Lead>
            <Lead>
              Second, <b>missing values</b>: if a feature value is NaN, you cannot compute |x−xᵢ|.
              KNN requires all features to be present for both training points and query points.
              Missing values must be handled before applying KNN.
            </Lead>
            <div className="tf-subhead">Outlier impact — k={k}, query x={fmtN(qx,1)}</div>
            <div className="nn-calc">
              <div className="nn-calc-h">How an outlier at P4 (x=5, y={outlierY}) affects the prediction</div>
              <div className="nn-calc-row"><b>Without outlier:</b> ŷ = {fmtN(cleanPred,3)} (using original y values)</div>
              <div className="nn-calc-row">
                <b>With outlier:</b> ŷ = {topOut.map(n=>`${fmtN(n.label,1)}`).join(" + ")} / {k} = <b style={{ color: Math.abs(predOut-cleanPred)>0.5 ? "#E0431E" : NEIGHBOR_COLOR }}>{fmtN(predOut,3)}</b>
                {Math.abs(predOut-cleanPred) > 0.5 && <span style={{ color:"#E0431E", marginLeft:8, fontWeight:700 }}>⚠ Distorted by {fmtN(Math.abs(predOut-cleanPred),2)}</span>}
              </div>
              <div className="nn-calc-row" style={{ color:"var(--muted)" }}>
                The outlier only affects predictions when it enters the k-nearest window (x near 5). k=1 is worst — it can be the sole contributor.
              </div>
            </div>
            <div className="tf-subhead">Why k=1 is most vulnerable</div>
            <div style={{ padding:"12px 16px", borderRadius:10, background:"rgba(224,67,30,0.07)", border:"1.5px solid rgba(224,67,30,0.3)", fontSize:13, lineHeight:1.7 }}>
              At k=1, the prediction equals the single nearest training y-value. If that training
              point is an outlier, the prediction is the outlier value itself — no averaging can
              mitigate it. At k=5 or k=7, the outlier's y-value is diluted by 4 or 6 non-outlier
              neighbors. <b>Larger k provides natural robustness</b> — though at the cost of
              increased bias.
            </div>
            <div className="tf-subhead">Missing values — practical strategies</div>
            <div className="tf-legend">
              {[
                ["KNNImputer (recommended)", "sklearn.impute.KNNImputer fills missing values using KNN on the remaining features — then run KNN regression on the completed data."],
                ["Mean/median imputation", "Quick and widely used. Fill each missing feature with its training-set mean (continuous) or median (skewed). Less accurate but fast."],
                ["Drop rows with NaN", "Simplest approach. Acceptable if missing rate is low (< 5%) and data is abundant. Risks bias if missing values are not random."],
                ["Modified distance metric", "Average distance only over non-NaN dimensions. Risky: if many features are missing, the effective distance space shrinks and neighbors may not be truly similar."],
              ].map(([name,desc])=>(
                <div className="tf-leg" key={name}>
                  <div className="tf-leg-name">{name}</div>
                  <div className="tf-leg-desc">{desc}</div>
                </div>
              ))}
            </div>
            <Note>For outlier robustness beyond increasing k, consider replacing the arithmetic mean with the median of the k neighbors' y-values. This is a simple change but makes KNN much more robust to extreme values.</Note>
          </>
        );
      },
    },

    // ── Stage 9: Evaluation & When to Use ──
    {
      id:"eval", group:"Summary", title:"Evaluation & when to use KNN regression", map:"When to Use",
      why:"Completing the picture: which metrics to track, how to find the best k, and honest guidance on when KNN wins or loses versus Linear Regression and Decision Tree Regressor.",
      render:(t) => (
        <>
          <Lead>
            KNN regression is evaluated with standard regression metrics. <b>MSE</b> (mean squared
            error) penalises large errors heavily. <b>RMSE</b> (root MSE) is in the same units as y,
            making it interpretable. <b>MAE</b> (mean absolute error) is more robust to outliers.
            <b> R²</b> (coefficient of determination) tells you what fraction of variance is explained —
            R²=1 is perfect, R²=0 means the model is no better than predicting the mean.
          </Lead>
          <div className="nn-calc">
            <div className="nn-calc-h">Regression metrics defined</div>
            <div className="nn-calc-row">MSE  = (1/n) Σ (yᵢ − ŷᵢ)²  — penalises outlier errors quadratically</div>
            <div className="nn-calc-row">RMSE = √MSE               — same units as y, most commonly reported</div>
            <div className="nn-calc-row">MAE  = (1/n) Σ |yᵢ − ŷᵢ| — robust to outliers, no squaring</div>
            <div className="nn-calc-row">R²   = 1 − (SS_res / SS_tot) where SS_tot = Σ(yᵢ−ȳ)² — higher is better, max 1</div>
          </div>
          <div className="tf-subhead">Finding the best k with LOO cross-validation</div>
          <Lead>
            Leave-one-out cross-validation (LOO-CV) is ideal for small datasets: for each candidate k,
            remove one training point, predict its y using the remaining n−1 points, square the error,
            and average. The k with lowest LOO-MSE is optimal.
          </Lead>
          <MSECurveViz />
          <div className="tf-subhead">KNN vs linear regression vs decision tree regressor</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:"2px solid var(--line)", background:"var(--accent-soft)" }}>
                  {["Property","KNN Regression","Linear Regression","Decision Tree Reg."].map(h=>(
                    <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:12, fontWeight:800, color:"var(--ink)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Function shape","Any (step-like)","Linear only","Piecewise constant"],
                  ["Training cost","O(1)","O(n·d)","O(n·d·log n)"],
                  ["Prediction cost","O(n)","O(d)","O(log n)"],
                  ["Extrapolation","Poor — flat","Good — extends line","Poor — flat"],
                  ["Interpretable","Locally yes","Yes (coeff.)","Yes (rules)"],
                  ["Outlier robust","Low–moderate","Low","High"],
                  ["Feature scaling","Required","Helps","Not needed"],
                  ["Hyperparameters","k, metric","Regularisation λ","Depth, min_samples"],
                ].map(([prop,...vals])=>(
                  <tr key={prop} style={{ borderBottom:"1px solid var(--line)" }}>
                    <td style={{ padding:"7px 12px", fontWeight:700, color:"var(--ink)" }}>{prop}</td>
                    {vals.map((v,i)=>(
                      <td key={i} style={{ padding:"7px 12px", fontFamily:"var(--num-font)", fontSize:12, color: i===0 ? "var(--accent-ink)" : "var(--muted)" }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="tf-subhead">When to reach for KNN regression</div>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">✓ Use KNN when</div>
              <ul>
                <li>Relationship is non-linear and unknown in form</li>
                <li>Small-to-medium dataset (n &lt; 50,000, d &lt; 20)</li>
                <li>Quick baseline — zero tuning except k</li>
                <li>New training data arrives online — no retraining needed</li>
                <li>Interpretable local predictions matter</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">✗ Avoid KNN when</div>
              <ul>
                <li>Need extrapolation beyond training range</li>
                <li>Data has high dimensionality (d &gt; 20)</li>
                <li>n is large (millions) — O(n) per prediction is slow</li>
                <li>Many irrelevant/noisy features</li>
                <li>Memory is a constraint</li>
              </ul>
            </div>
          </div>
          <Note>KNN regression is an excellent first model to try on any regression problem. If it underperforms, switch to gradient boosting (non-linear, robust) or linear regression (interpretable, fast). If it works well, consider tuning k and trying weighted variants.</Note>
        </>
      ),
    },
  {
    id: "hyperparams",
    group: "Practical",
    title: "Hyperparameters & when to use",
    map: "Hyperparams",
    why: "KNN regression is identical to KNN classification — just the output changes from majority vote to mean of neighbors. The same k-tuning principles apply.",
    render: () => (
      <>
        <Lead>KNN regression predicts by averaging the target values of the k nearest training points. It's non-parametric, handles any shape of relationship, and has zero training time. The prediction step is slow — O(n) — so it doesn't scale past ~50K samples.</Lead>
        <Note>For regression, k=1 perfectly interpolates the training data (zero training error, high test error). As k increases, predictions smooth out. k=√n is a common heuristic starting point.</Note>
        <div className="tf-subhead">Key hyperparameters</div>
        <div className="tf-legend">
          {[
            ["n_neighbors (k)", "Number of neighbors to average", "Default 5. Tune with cross-validation. Start with [3, 5, 7, 11, 15, 21, 31]. Larger k = smoother prediction curve = more bias."],
            ["weights", "How to weight neighbors", "'uniform' (simple mean, default). 'distance' (inverse-distance weighted mean — closer points contribute more). Use 'distance' for smoother predictions on dense data."],
            ["metric", "Distance function", "'minkowski' p=2 (Euclidean, default). Scale features first. 'manhattan' (p=1) is more robust to outliers in feature space."],
            ["algorithm", "Search algorithm", "'auto' uses the best. 'brute' for > 20 features. 'kd_tree' or 'ball_tree' for low-dimensional structured data."],
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
              "No training phase (lazy learner)",
              "Non-parametric — fits any relationship shape",
              "Trivially handles multi-output regression",
              "Easy to update (add new training points without retraining)",
            ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
          </div>
          <div className="opt-pc-col is-con">
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
            {[
              "O(n) prediction time — unusable at scale",
              "O(n) memory requirement",
              "Sensitive to outliers in features and target (k=1 especially)",
              "No extrapolation beyond training range",
              "No feature importances — scale-sensitive",
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
                ["Small tabular dataset, baseline needed", "KNN Regression", "Zero setup, easy to implement"],
                ["Large dataset", "Random Forest or GBM", "O(n) prediction makes KNN unusable at scale"],
                ["Interpolate a smooth curve", "KNN (large k)", "Averaging many neighbors smooths the prediction"],
                ["Best accuracy", "Gradient Boosting / XGBoost", "Tree ensembles capture complex patterns better"],
                ["Time-series forecasting", "LSTM or AR models", "KNN doesn't respect temporal ordering"],
                ["High dimensional features", "Random Forest", "KNN suffers from curse of dimensionality in high dims"],
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
    title: "K-Nearest Neighbors",
    subtitle: "Regression — average the neighbors",
    cur: "KNN · Regression",
    category: "ML Algorithms",
    default: KNN.KNN_REG.default,
    run: KNN.runKNNReg,
    renderInput,
    modeLinks: [
      { label: "Classification", href: "KNN (Classification).html", active: false },
      { label: "Regression",     href: "KNN (Regression).html",     active: true  },
    ],
  };
})();
