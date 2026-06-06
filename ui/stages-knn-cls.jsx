/* ============================================================
   KNN Classification — 10 interactive stages
   Requires: window.ML_KNN, shared primitives on window
   ============================================================ */
(function () {
  const { Matrix, V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { useState, useMemo, useRef, useEffect } = React;
  const KNN = window.ML_KNN;

  // ── colour palette for 3 classes ──
  const CLS_COLOR  = ["#2B5BFF", "#E0431E", "#1DAA6B"];
  const CLS_STROKE = ["#1742CC", "#B83415", "#157A4E"];
  const CLS_LIGHT  = ["rgba(43,91,255,0.18)", "rgba(224,67,30,0.18)", "rgba(29,170,107,0.18)"];
  const CLS_LABEL  = ["Class A", "Class B", "Class C"];

  const fmtN = (n, d = 2) => (+n).toFixed(d);

  // ── Scatter SVG: 10×10 grid, normalised coords ──
  function ScatterPlot({ data, query, neighbors, kRadius, showDistLines }) {
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
        <text x={W/2} y={H-2} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600">x₁</text>
        <text x={8} y={H/2} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600" transform={`rotate(-90,8,${H/2})`}>x₂</text>

        {/* k-radius circle */}
        {kRadius !== undefined && query && (
          <circle cx={sx(query[0])} cy={sy(query[1])}
            r={Math.abs(sx(kRadius) - sx(0))}
            fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />
        )}

        {/* distance lines */}
        {showDistLines && query && data.map((pt, i) => {
          const isN = neighborSet.has(i);
          return (
            <line key={i}
              x1={sx(query[0])} y1={sy(query[1])}
              x2={sx(pt[0])}   y2={sy(pt[1])}
              stroke={isN ? CLS_COLOR[pt[2]] : "var(--faint)"}
              strokeWidth={isN ? 2 : 0.8}
              opacity={isN ? 0.8 : 0.35}
              strokeDasharray={isN ? "none" : "3 3"}
            />
          );
        })}

        {/* data points */}
        {data.map((pt, i) => {
          const isN = neighborSet.has(i);
          return (
            <g key={i}>
              {isN && <circle cx={sx(pt[0])} cy={sy(pt[1])} r={12} fill="none"
                stroke={CLS_COLOR[pt[2]]} strokeWidth="2" opacity="0.5" />}
              <circle cx={sx(pt[0])} cy={sy(pt[1])} r={isN ? 7 : 5.5}
                fill={CLS_LIGHT[pt[2]]} stroke={CLS_STROKE[pt[2]]} strokeWidth={isN ? 2 : 1.5} />
            </g>
          );
        })}

        {/* query star */}
        {query && (
          <g>
            <circle cx={sx(query[0])} cy={sy(query[1])} r={14} fill="rgba(255,200,0,0.12)" />
            <text x={sx(query[0])} y={sy(query[1])+5} textAnchor="middle" fontSize="16" fill="#F5A623" fontWeight="bold">★</text>
          </g>
        )}
      </svg>
    );
  }

  function ClassLegend() {
    return (
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", margin:"8px 0" }}>
        {CLS_LABEL.map((l,i) => (
          <span key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:"var(--muted)" }}>
            <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill={CLS_LIGHT[i]} stroke={CLS_STROKE[i]} strokeWidth="1.5"/></svg>
            {l}
          </span>
        ))}
        <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:"var(--muted)" }}>
          <span style={{ fontSize:14, color:"#F5A623" }}>★</span> Query
        </span>
      </div>
    );
  }

  function DistTable({ allDists, k, data }) {
    const sorted = allDists.slice().sort((a,b) => a.dist - b.dist);
    return (
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"2px solid var(--line)" }}>
              {["Rank","Point","Class","x₁","x₂","Distance"].map(h => (
                <th key={h} style={{ padding:"6px 10px", textAlign:"left", fontSize:11, fontWeight:800, letterSpacing:".06em", textTransform:"uppercase", color:"var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, rank) => {
              const pt   = data[d.i];
              const isN  = rank < k;
              return (
                <tr key={d.i} style={{ background: isN ? CLS_LIGHT[pt[2]] : "transparent", borderBottom:"1px solid var(--line)", fontWeight: isN ? 700 : 400 }}>
                  <td style={{ padding:"5px 10px", fontFamily:"var(--num-font)" }}>{rank+1}{isN && <span style={{ color:CLS_COLOR[pt[2]], marginLeft:4 }}>●</span>}</td>
                  <td style={{ padding:"5px 10px", fontFamily:"var(--num-font)", color:"var(--muted)" }}>P{d.i}</td>
                  <td style={{ padding:"5px 10px" }}><span style={{ color:CLS_COLOR[pt[2]], fontWeight:800 }}>{CLS_LABEL[pt[2]]}</span></td>
                  <td style={{ padding:"5px 10px", fontFamily:"var(--num-font)" }}>{fmtN(pt[0])}</td>
                  <td style={{ padding:"5px 10px", fontFamily:"var(--num-font)" }}>{fmtN(pt[1])}</td>
                  <td style={{ padding:"5px 10px", fontFamily:"var(--num-font)", color: isN ? "var(--accent-ink)" : "var(--muted)" }}>{fmtN(d.dist,3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function VoteBar({ votes, k, label }) {
    const totalW = Object.values(votes).reduce((a,b)=>a+b,0);
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:8, margin:"12px 0" }}>
        {CLS_LABEL.map((cls,i) => {
          const count   = votes[i] || 0;
          const pct     = k > 0 ? count/k : 0;
          const isWin   = parseInt(label) === i;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ width:60, fontSize:12, fontWeight:700, color:CLS_COLOR[i] }}>{cls}</span>
              <div style={{ flex:1, height:26, background:"var(--line-soft)", borderRadius:6, overflow:"hidden", position:"relative" }}>
                <div style={{ height:"100%", width:`${pct*100}%`, background:CLS_COLOR[i], borderRadius:6, transition:"width .4s ease", opacity: isWin ? 1 : 0.5 }} />
                {isWin && <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:10, fontWeight:800, color:"white" }}>WINNER</span>}
              </div>
              <span style={{ width:24, textAlign:"center", fontFamily:"var(--num-font)", fontWeight:800, color: count>0 ? CLS_COLOR[i] : "var(--faint)" }}>{count}</span>
            </div>
          );
        })}
        <div style={{ marginTop:8, padding:"10px 14px", background:CLS_LIGHT[parseInt(label)], border:`2px solid ${CLS_COLOR[parseInt(label)]}`, borderRadius:10, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>Prediction:</span>
          <span style={{ fontSize:15, fontWeight:800, color:CLS_COLOR[parseInt(label)] }}>{CLS_LABEL[parseInt(label)]}</span>
          <span style={{ fontSize:12, color:"var(--muted)", marginLeft:"auto" }}>by {votes[label]||0}/{k} votes</span>
        </div>
      </div>
    );
  }

  // ── Decision region mini-plots ──
  function KComparisonGrid() {
    const ks     = [1, 5, 15];
    const labels = ["k=1 (overfit)", "k=5 (balanced)", "k=15 (underfit)"];
    const notes  = ["Jagged boundaries — every training point owns its region", "Smooth stable boundary — ignores individual noise", "With 15 points total, k=15 uses everyone — majority class wins everywhere"];
    const data   = KNN.KNN_CLS.data;
    const W=200,H=170,PAD=18,STEP=4;

    return (
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        {ks.map((k,ki) => {
          const regions = [];
          for (let px=0; px<=(W-2*PAD); px+=STEP) {
            for (let py=0; py<=(H-2*PAD); py+=STEP) {
              const qx = px/(W-2*PAD)*10;
              const qy = (1 - py/(H-2*PAD))*10;
              const dists = data.map((pt,i)=>({i,d:Math.sqrt((qx-pt[0])**2+(qy-pt[1])**2),c:pt[2]})).sort((a,b)=>a.d-b.d);
              const v={};
              dists.slice(0,k).forEach(n=>{v[n.c]=(v[n.c]||0)+1;});
              const cls = parseInt(Object.keys(v).reduce((a,b)=>v[a]>v[b]?a:b));
              regions.push({x:PAD+px,y:PAD+py,cls});
            }
          }
          const sx = x => PAD+(x/10)*(W-2*PAD);
          const sy = y => H-PAD-(y/10)*(H-2*PAD);
          return (
            <div key={k} style={{ flex:1, minWidth:160 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--muted)", marginBottom:4, textAlign:"center" }}>{labels[ki]}</div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto", border:"1px solid var(--line)", borderRadius:10, background:"var(--panel-solid)" }}>
                {regions.map((r,ri) => <rect key={ri} x={r.x-STEP/2} y={r.y-STEP/2} width={STEP} height={STEP} fill={CLS_LIGHT[r.cls]} />)}
                {data.map((pt,i) => <circle key={i} cx={sx(pt[0])} cy={sy(pt[1])} r={4} fill={CLS_COLOR[pt[2]]} stroke={CLS_STROKE[pt[2]]} strokeWidth="1" />)}
              </svg>
              <div style={{ fontSize:11, color:"var(--muted)", marginTop:4, textAlign:"center", lineHeight:1.4 }}>{notes[ki]}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Feature scaling illustration ──
  function FeatureScaleViz() {
    // Simulate: Feature A (salary, 0-100000) vs Feature B (age, 0-50)
    // Three sample points and a query
    const pts = [
      {a:20000,b:25,c:0},{a:22000,b:27,c:0},{a:80000,b:26,c:1},{a:78000,b:45,c:1},{a:50000,b:22,c:2}
    ];
    const query = {a:21000,b:40};

    // Without scaling: age (0-50) vs salary (0-100000)
    // Distances dominated by salary differences
    const distRaw = pts.map(p => Math.sqrt((query.a-p.a)**2+(query.b-p.b)**2));
    const distRawNeighbor = distRaw.indexOf(Math.min(...distRaw));

    // With scaling: scale A to 0-1, B to 0-1
    const aMax=100000, bMax=50;
    const distScaled = pts.map(p => Math.sqrt(((query.a-p.a)/aMax)**2+((query.b-p.b)/bMax)**2));
    const distScaledNeighbor = distScaled.indexOf(Math.min(...distScaled));

    const rows = pts.map((p,i) => ({
      label:`P${i}`, salary:p.a, age:p.b, cls:p.c,
      dRaw: fmtN(distRaw[i],1), dScaled: fmtN(distScaled[i],5),
      isRawN: i===distRawNeighbor, isScN: i===distScaledNeighbor
    }));

    return (
      <div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:"2px solid var(--line)" }}>
                {["Point","Salary ($)","Age","Class","Dist (raw)","Nearest?","Dist (scaled)","Nearest?"].map(h=>(
                  <th key={h} style={{ padding:"6px 8px", textAlign:"left", fontSize:10, fontWeight:800, textTransform:"uppercase", color:"var(--muted)", letterSpacing:".05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.label} style={{ borderBottom:"1px solid var(--line)" }}>
                  <td style={{ padding:"5px 8px", fontFamily:"var(--num-font)", color:"var(--faint)" }}>{r.label}</td>
                  <td style={{ padding:"5px 8px", fontFamily:"var(--num-font)" }}>{r.salary.toLocaleString()}</td>
                  <td style={{ padding:"5px 8px", fontFamily:"var(--num-font)" }}>{r.age}</td>
                  <td style={{ padding:"5px 8px" }}><span style={{ color:CLS_COLOR[r.cls], fontWeight:700 }}>{CLS_LABEL[r.cls]}</span></td>
                  <td style={{ padding:"5px 8px", fontFamily:"var(--num-font)", fontWeight: r.isRawN ? 800 : 400, color: r.isRawN ? "#E0431E" : "var(--muted)" }}>{r.dRaw}{r.isRawN ? " ★" : ""}</td>
                  <td style={{ padding:"5px 8px", fontSize:11, color: r.isRawN ? "#E0431E" : "var(--faint)" }}>{r.isRawN ? "Nearest (RAW)" : ""}</td>
                  <td style={{ padding:"5px 8px", fontFamily:"var(--num-font)", fontWeight: r.isScN ? 800 : 400, color: r.isScN ? "#1DAA6B" : "var(--muted)" }}>{r.dScaled}{r.isScN ? " ★" : ""}</td>
                  <td style={{ padding:"5px 8px", fontSize:11, color: r.isScN ? "#1DAA6B" : "var(--faint)" }}>{r.isScN ? "Nearest (SCALED)" : ""}</td>
                </tr>
              ))}
              <tr style={{ borderTop:"2px solid var(--line)", background:"var(--accent-soft)" }}>
                <td colSpan="2" style={{ padding:"5px 8px", fontWeight:700, fontSize:12 }}>Query: Salary=$21,000</td>
                <td style={{ padding:"5px 8px", fontWeight:700, fontSize:12 }}>Age=40</td>
                <td colSpan="5" style={{ padding:"5px 8px", fontSize:11, color:"var(--muted)" }}>→ Raw: nearest by salary difference. Scaled: nearest by combined distance.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop:10, padding:"10px 14px", borderRadius:10, background:"rgba(224,67,30,0.08)", border:"1.5px solid rgba(224,67,30,0.3)", fontSize:13, lineHeight:1.6 }}>
          <b>Without scaling:</b> Salary differences (thousands) completely swamp Age differences (tens). The nearest neighbor is determined almost entirely by salary. Age is effectively <b>invisible</b> to KNN.
        </div>
        <div style={{ marginTop:8, padding:"10px 14px", borderRadius:10, background:"rgba(29,170,107,0.08)", border:"1.5px solid rgba(29,170,107,0.3)", fontSize:13, lineHeight:1.6 }}>
          <b>With scaling:</b> Both features are normalized to [0,1]. A $1,000 salary difference (1% of range) and a 0.5-year age difference (1% of range) now contribute equally to distance.
        </div>
      </div>
    );
  }

  // ── Outlier sensitivity illustration ──
  function OutlierViz({ k }) {
    const data = KNN.KNN_CLS.data;
    // add a synthetic outlier: a Class B point deep in Class A territory
    const outlier = [2, 7.5, 1]; // Class B at (2, 7.5) — right inside Class A cluster
    const dataWithOutlier = [...data, outlier];
    const query = [2, 8.5];

    const W=260,H=220,PAD=22;
    const sx = x => PAD+(x/10)*(W-2*PAD);
    const sy = y => H-PAD-(y/10)*(H-2*PAD);

    // KNN predict without outlier
    const distClean = data.map((pt,i)=>({i,d:Math.sqrt((query[0]-pt[0])**2+(query[1]-pt[1])**2),c:pt[2]})).sort((a,b)=>a.d-b.d);
    const votesClean = {}; distClean.slice(0,k).forEach(n=>{votesClean[n.c]=(votesClean[n.c]||0)+1;});
    const labelClean = parseInt(Object.keys(votesClean).reduce((a,b)=>votesClean[a]>votesClean[b]?a:b));

    // KNN predict with outlier
    const distOut = dataWithOutlier.map((pt,i)=>({i,d:Math.sqrt((query[0]-pt[0])**2+(query[1]-pt[1])**2),c:pt[2]})).sort((a,b)=>a.d-b.d);
    const votesOut = {}; distOut.slice(0,k).forEach(n=>{votesOut[n.c]=(votesOut[n.c]||0)+1;});
    const labelOut = parseInt(Object.keys(votesOut).reduce((a,b)=>votesOut[a]>votesOut[b]?a:b));

    return (
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:220 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#1DAA6B", marginBottom:6, textAlign:"center" }}>Without outlier → predicts {CLS_LABEL[labelClean]}</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto", border:"1px solid var(--line)", borderRadius:10, background:"var(--panel-solid)" }}>
            {data.map((pt,i) => {
              const isN = distClean.slice(0,k).some(n=>n.i===i);
              return (<g key={i}>
                {isN && <circle cx={sx(pt[0])} cy={sy(pt[1])} r={10} fill="none" stroke={CLS_COLOR[pt[2]]} strokeWidth="2" opacity="0.5"/>}
                <circle cx={sx(pt[0])} cy={sy(pt[1])} r={5} fill={CLS_LIGHT[pt[2]]} stroke={CLS_STROKE[pt[2]]} strokeWidth="1.5"/>
              </g>);
            })}
            <text x={sx(query[0])} y={sy(query[1])+5} textAnchor="middle" fontSize="14" fill="#F5A623">★</text>
          </svg>
        </div>
        <div style={{ flex:1, minWidth:220 }}>
          <div style={{ fontSize:12, fontWeight:700, color: labelOut===labelClean ? "#1DAA6B" : "#E0431E", marginBottom:6, textAlign:"center" }}>
            With outlier → predicts {CLS_LABEL[labelOut]} {labelOut!==labelClean ? "⚠ Changed!" : "✓ Robust"}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto", border:"1px solid var(--line)", borderRadius:10, background:"var(--panel-solid)" }}>
            {dataWithOutlier.map((pt,i) => {
              const isOutlier = i===data.length;
              const isN = distOut.slice(0,k).some(n=>n.i===i);
              return (<g key={i}>
                {isN && <circle cx={sx(pt[0])} cy={sy(pt[1])} r={10} fill="none" stroke={CLS_COLOR[pt[2]]} strokeWidth="2" opacity="0.5"/>}
                <circle cx={sx(pt[0])} cy={sy(pt[1])} r={isOutlier?8:5}
                  fill={isOutlier?"rgba(224,67,30,0.5)":CLS_LIGHT[pt[2]]}
                  stroke={isOutlier?"#E0431E":CLS_STROKE[pt[2]]} strokeWidth={isOutlier?2.5:1.5}/>
                {isOutlier && <text x={sx(pt[0])+10} y={sy(pt[1])+4} fontSize="10" fill="#E0431E" fontWeight="800">outlier</text>}
              </g>);
            })}
            <text x={sx(query[0])} y={sy(query[1])+5} textAnchor="middle" fontSize="14" fill="#F5A623">★</text>
          </svg>
        </div>
      </div>
    );
  }

  // ── Curse of dimensionality bar ──
  function DimChart() {
    const dims=[1,2,3,5,10,20,50,100];
    const avgDist = d => Math.sqrt(d/3);
    const maxD = avgDist(100);
    const W=380,H=200,PAD=38,BW=28;
    const sy = v => H-PAD-(v/(maxD*1.1))*(H-2*PAD);
    const sx = i => PAD+10+i*((W-2*PAD)/dims.length);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", maxWidth:W, height:"auto", border:"1px solid var(--line)", borderRadius:12, background:"var(--panel-solid)" }}>
        {[0.25,0.5,0.75,1.0].map(f => {
          const v=f*maxD*1.1;
          return <line key={f} x1={PAD} y1={sy(v)} x2={W-PAD+10} y2={sy(v)} stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3"/>;
        })}
        {dims.map((d,i) => {
          const h = avgDist(d);
          const col = `hsl(${220-i*12},80%,${60-i*4}%)`;
          return (
            <g key={d}>
              <rect x={sx(i)} y={sy(h)} width={BW} height={H-PAD-sy(h)} rx={4} fill={col} opacity="0.8"/>
              <text x={sx(i)+BW/2} y={H-PAD+12} textAnchor="middle" fontSize="9" fill="var(--faint)">{d}D</text>
              <text x={sx(i)+BW/2} y={sy(h)-4} textAnchor="middle" fontSize="8" fill="var(--muted)">{fmtN(h,1)}</text>
            </g>
          );
        })}
        <text x={W/2} y={H-4} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600">Dimensions</text>
        <text x={10} y={H/2} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600" transform={`rotate(-90,10,${H/2})`}>Avg dist</text>
        <text x={W/2} y={PAD-8} textAnchor="middle" fontSize="11" fill="var(--accent-ink)" fontWeight="700">Average pairwise distance grows as √D</text>
      </svg>
    );
  }

  function renderInput(input, setInput) {
    const set = (k,v) => setInput(i=>({...i,[k]:v}));
    return (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">x₁</span>
          <input type="range" min="0" max="10" step="0.1" value={input.x1} onChange={e=>set("x1",parseFloat(e.target.value))}/>
          <span className="nn-slider-v">{fmtN(input.x1,1)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">x₂</span>
          <input type="range" min="0" max="10" step="0.1" value={input.x2} onChange={e=>set("x2",parseFloat(e.target.value))}/>
          <span className="nn-slider-v">{fmtN(input.x2,1)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">k</span>
          <input type="range" min="1" max="7" step="1" value={input.k} onChange={e=>set("k",parseInt(e.target.value))}/>
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
      id:"overview", group:"Overview", title:"KNN — you are who your neighbors are", map:"Overview",
      why:"Before the math, understand the elegant core idea: no training phase, no parameters — just remember all examples and at prediction time, look at who's nearby.",
      render:(t) => (
        <>
          <Lead>
            <b>K-Nearest Neighbors (KNN)</b> is the simplest possible classifier. To classify a new
            point, find its <b>k closest training examples</b> and let them vote. The class with the
            most votes wins. Nothing is learned upfront — KNN is called a <b>lazy learner</b> because
            all computation is deferred until prediction time.
          </Lead>
          <Lead>
            KNN is also <b>instance-based</b> (it generalises by storing examples, not by learning a
            function) and <b>non-parametric</b> (it makes no assumptions about the data distribution).
            The single hyperparameter <b>k</b> controls how many neighbors vote — it is the only dial
            you tune.
          </Lead>
          <div style={{ padding:"12px 16px", borderRadius:12, background:"var(--accent-soft)", border:"1px solid var(--line)", fontSize:13, lineHeight:1.7, marginBottom:12 }}>
            <b>Analogy:</b> You move to a new city and want to decide which restaurant to eat at tonight.
            You ask your 5 nearest neighbors which cuisine they recommend. Three say Italian, one says
            Thai, one says Sushi. You go Italian — that is KNN classification.
          </div>
          <div className="tf-lifecycle">
            <div className="tf-life tf-life--train" style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase", marginBottom:8, opacity:.7 }}>Training phase — O(1)</div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Store all labeled data</div>
              <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5 }}>KNN memorises every (x, y) pair. No model fitting, no parameters updated. The entire dataset is the model.</div>
            </div>
            <div className="tf-life tf-life--infer" style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase", marginBottom:8, opacity:.7 }}>Prediction phase — O(n·d)</div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Find k nearest → majority vote</div>
              <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5 }}>For each query point: (1) compute distance to every training point, (2) sort ascending, (3) take top k, (4) return the majority class label.</div>
            </div>
          </div>
          <div className="tf-subhead">Full prediction pipeline</div>
          <div className="nn-calc">
            <div className="nn-calc-h">Step-by-step algorithm</div>
            <div className="nn-calc-row"><b>Input:</b> training set D = {"{(x₁,y₁),…,(xₙ,yₙ)}"}, query xₒ, hyperparameter k</div>
            <div className="nn-calc-row">1. For every training point xᵢ: compute d(xₒ, xᵢ) = √(Σⱼ(xₒⱼ−xᵢⱼ)²)</div>
            <div className="nn-calc-row">2. Sort all distances ascending → get ordered list</div>
            <div className="nn-calc-row">3. Keep the k points with smallest distances → N_k(xₒ)</div>
            <div className="nn-calc-row">4. Count votes: votes[c] = |{"{"}i ∈ N_k : yᵢ = c{"}"}|</div>
            <div className="nn-calc-row"><b>Output:</b> ŷ = argmax_c votes[c]</div>
          </div>
          <div className="tf-subhead">Interactive preview</div>
          <Lead>
            The star ★ is your query point. The k highlighted circles are its nearest neighbors.
            Move the x₁, x₂ sliders to reposition the query — the prediction updates live.
          </Lead>
          <ScatterPlot data={KNN.KNN_CLS.data} query={t.query} neighbors={t.neighbors} />
          <ClassLegend />
          <div style={{ marginTop:10, padding:"10px 14px", background:"var(--accent-soft)", borderRadius:10, fontSize:13 }}>
            Query at ({fmtN(t.query[0],1)}, {fmtN(t.query[1],1)}) — k={t.neighbors.length} neighbors vote →
            <b style={{ color:CLS_COLOR[t.label], marginLeft:6 }}>{CLS_LABEL[t.label]}</b>
          </div>
          <Note>Adjust k and the query position in the top bar — the prediction updates live across all stages.</Note>
        </>
      ),
    },

    // ── Stage 2: Dataset ──
    {
      id:"dataset", group:"Data", title:"The dataset — 15 labeled 2D points", map:"Dataset",
      why:"KNN's entire 'model' is this dataset. Understanding its structure tells you exactly where boundaries will form.",
      render:(t) => (
        <>
          <Lead>
            We have <b>15 labeled 2D points</b> split across 3 classes. Each point has two features
            x₁ and x₂, both normalized to a 0–10 range. We use 2D so we can <b>visualise distance
            geometrically</b> — in real problems you might have hundreds of features.
          </Lead>
          <Lead>
            The three classes occupy rough regions: <span style={{ color:CLS_COLOR[0], fontWeight:700 }}>Class A</span> lives top-left,
            <span style={{ color:CLS_COLOR[1], fontWeight:700 }}> Class B</span> top-right,
            <span style={{ color:CLS_COLOR[2], fontWeight:700 }}> Class C</span> bottom-center.
            But the regions are not perfectly separated — that ambiguity is exactly where choosing k matters.
          </Lead>
          <ScatterPlot data={KNN.KNN_CLS.data} query={t.query} />
          <ClassLegend />
          <div className="tf-subhead">All 15 training points</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:"2px solid var(--line)" }}>
                  {["#","x₁","x₂","Class"].map(h=>(
                    <th key={h} style={{ padding:"6px 12px", textAlign:"left", fontSize:11, fontWeight:800, letterSpacing:".06em", textTransform:"uppercase", color:"var(--muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {KNN.KNN_CLS.data.map(([x1,x2,c],i)=>(
                  <tr key={i} style={{ borderBottom:"1px solid var(--line)", background: i%2===0?"transparent":"var(--line-soft)" }}>
                    <td style={{ padding:"5px 12px", fontFamily:"var(--num-font)", color:"var(--faint)" }}>P{i}</td>
                    <td style={{ padding:"5px 12px", fontFamily:"var(--num-font)" }}>{x1.toFixed(1)}</td>
                    <td style={{ padding:"5px 12px", fontFamily:"var(--num-font)" }}>{x2.toFixed(1)}</td>
                    <td style={{ padding:"5px 12px" }}><span style={{ color:CLS_COLOR[c], fontWeight:700 }}>{CLS_LABEL[c]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>The query ★ at ({fmtN(t.query[0],1)}, {fmtN(t.query[1],1)}) is not a training point — it is the new example we want to classify.</Note>
        </>
      ),
    },

    // ── Stage 3: What is Distance? ──
    {
      id:"distance", group:"Algorithm", title:"What is distance? — Euclidean & alternatives", map:"Distance",
      why:"Distance is the heart of KNN. Every neighbor decision, every boundary, every prediction flows from this definition. Understanding it before the algorithm is essential.",
      render:(t) => {
        const p0 = KNN.KNN_CLS.data[0]; // (2,8,A)
        const p1 = KNN.KNN_CLS.data[5]; // (8,7,B)
        const dx = p1[0]-p0[0], dy = p1[1]-p0[1];
        const eucl = Math.sqrt(dx*dx+dy*dy);
        const manh = Math.abs(dx)+Math.abs(dy);
        return (
          <>
            <Lead>
              <b>Euclidean distance</b> is the straight-line distance between two points in
              feature space — the distance you would measure with a ruler. For two points
              <b> a = (a₁,a₂,…,aₙ)</b> and <b>b = (b₁,b₂,…,bₙ)</b>, it is:
            </Lead>
            <Formula label="Euclidean distance">
              d(a, b) = √( (a₁−b₁)² + (a₂−b₂)² + … + (aₙ−bₙ)² ) = √( Σᵢ (aᵢ−bᵢ)² )
            </Formula>
            <div className="nn-calc">
              <div className="nn-calc-h">Step-by-step: distance between P0 ({p0[0]},{p0[1]}) and P5 ({p1[0]},{p1[1]})</div>
              <div className="nn-calc-row">Step 1 — difference in x₁: {p1[0]} − {p0[0]} = <b>{dx}</b></div>
              <div className="nn-calc-row">Step 2 — difference in x₂: {p1[1]} − {p0[1]} = <b>{dy}</b></div>
              <div className="nn-calc-row">Step 3 — square each:  ({dx})² = {dx*dx},  ({dy})² = {dy*dy}</div>
              <div className="nn-calc-row">Step 4 — sum: {dx*dx} + {dy*dy} = <b>{dx*dx+dy*dy}</b></div>
              <div className="nn-calc-row">Step 5 — square root: √{dx*dx+dy*dy} = <b>{fmtN(eucl,4)}</b></div>
            </div>
            <div className="tf-subhead">Alternative distance metrics</div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", margin:"8px 0" }}>
              {[
                ["Euclidean (L2)", `√(Σ(aᵢ−bᵢ)²)`, `${fmtN(eucl,3)}`, "Default choice. Sensitive to large feature scales. Geometrically natural."],
                ["Manhattan (L1)", `Σ|aᵢ−bᵢ|`, `${fmtN(manh,3)}`, "Sum of axis-aligned steps. More robust to outliers. Use when features are independent."],
                ["Minkowski (Lp)", `(Σ|aᵢ−bᵢ|ᵖ)^(1/p)`, "—", "Generalises both. p=1 → Manhattan, p=2 → Euclidean, p→∞ → Chebyshev (max axis diff)."],
              ].map(([name,formula,val,desc])=>(
                <div key={name} style={{ flex:1, minWidth:200, padding:"12px 14px", borderRadius:10, border:"1px solid var(--line)", background:"var(--panel-solid)" }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:4 }}>{name}</div>
                  <div style={{ fontFamily:"var(--num-font)", fontSize:12, color:"var(--accent-ink)", marginBottom:4 }}>{formula}</div>
                  {val !== "—" && <div style={{ fontSize:12, fontWeight:700, marginBottom:4 }}>Result: {val}</div>}
                  <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
            <div className="tf-subhead">Critical warning: Feature Scaling</div>
            <Lead>
              Euclidean distance treats every feature <b>equally</b>. If feature x₁ ranges 0–1 and
              x₂ ranges 0–1000, a 1-unit change in x₂ is 1000× more impactful than a 1-unit change
              in x₁. The large-scale feature will <b>dominate</b> all distance calculations and make
              x₁ invisible. Always scale your features before applying KNN.
            </Lead>
            <ScatterPlot data={KNN.KNN_CLS.data} query={t.query} neighbors={t.neighbors} showDistLines />
            <ClassLegend />
            <DistTable allDists={t.allDists} k={t.neighbors.length} data={KNN.KNN_CLS.data} />
            <Note>Solid colored lines connect the query to its k nearest neighbors. Dashed gray lines show the farther points. The table is sorted by distance ascending — the top k (highlighted rows) are the neighbors.</Note>
          </>
        );
      },
    },

    // ── Stage 4: Why Feature Scaling Matters ──
    {
      id:"scaling", group:"Algorithm", title:"Feature scaling — the most common KNN mistake", map:"Scaling",
      why:"This is the single most common KNN pitfall — and a very frequent interview question. A concrete numerical example makes it unforgettable.",
      render:(t) => (
        <>
          <Lead>
            KNN is a <b>purely distance-based algorithm</b>. Euclidean distance adds up squared
            differences across all features. If one feature has values in the thousands and another
            in the range 0–1, the large-scale feature completely controls who the nearest neighbors
            are. The small-scale feature contributes essentially nothing.
          </Lead>
          <Lead>
            Consider predicting someone's income class from <b>annual salary</b> ($0–$100,000) and
            <b> age</b> (0–50 years). A person earning $21,000 aged 40 asks: who are my nearest
            neighbors? Without scaling, a $20,000 salary difference swamps a 30-year age difference.
          </Lead>
          <div className="tf-subhead">Numerical example: salary vs age</div>
          <FeatureScaleViz />
          <div className="tf-subhead">The fix: StandardScaler (z-score normalisation)</div>
          <Formula label="z-score">x_scaled = (x − μ) / σ</Formula>
          <div className="nn-calc">
            <div className="nn-calc-h">Correct normalisation workflow</div>
            <div className="nn-calc-row">1. Compute mean μ and standard deviation σ of <b>each feature on training data only</b></div>
            <div className="nn-calc-row">2. Transform training features: x_train_scaled = (x_train − μ) / σ</div>
            <div className="nn-calc-row">3. Store μ and σ — apply the <b>same</b> μ and σ to new test/query points</div>
            <div className="nn-calc-row">4. Result: all features have mean≈0, std≈1 → equally weighted in distance</div>
            <div className="nn-calc-row" style={{ color:"#E0431E" }}><b>Never</b> fit the scaler on test data — that would leak future information into training (data leakage)</div>
          </div>
          <div className="tf-subhead">MinMaxScaler alternative</div>
          <Formula label="min-max">x_scaled = (x − x_min) / (x_max − x_min)</Formula>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">StandardScaler — use when:</div>
              <ul>
                <li>Data has outliers (outliers don't expand the range)</li>
                <li>Data is approximately Gaussian</li>
                <li>You are unsure — this is the safer default</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">MinMaxScaler — use when:</div>
              <ul>
                <li>No significant outliers in the data</li>
                <li>You need values strictly in [0, 1]</li>
                <li>Image pixels or bounded sensor readings</li>
              </ul>
            </div>
          </div>
          <Note>Interview tip: "Does KNN require feature scaling?" — YES, always. This is one of the most common ML interview questions. Algorithms that compute Euclidean distance (KNN, SVM with RBF, K-Means) all require scaling; tree-based models do not.</Note>
        </>
      ),
    },

    // ── Stage 5: Finding k Nearest Neighbors ──
    {
      id:"kneighbors", group:"Algorithm", title:"Finding k neighbors — compute, sort, select", map:"k Neighbors",
      why:"Visualising the 'k-ball' around the query makes the algorithm concrete: every point inside the dashed circle is a neighbor and gets a vote.",
      render:(t) => {
        const kthDist = t.neighbors[t.neighbors.length-1]?.dist;
        return (
          <>
            <Lead>
              For every query point, KNN runs the same three-step procedure: compute the distance
              to <b>all n training points</b>, sort those distances ascending, and select the
              <b> top k</b>. The dashed circle below has radius equal to the distance to the
              k-th nearest point — every point inside this circle is a neighbor.
            </Lead>
            <Lead>
              With k={t.neighbors.length} and query at ({fmtN(t.query[0],1)}, {fmtN(t.query[1],1)}),
              the search radius is <b>{fmtN(kthDist,3)}</b>. All {t.neighbors.length} enclosed points
              will cast a vote. Increase k to expand the circle; decrease k to shrink it.
            </Lead>
            <div style={{ display:"flex", alignItems:"center", gap:12, margin:"8px 0 12px" }}>
              <span style={{ fontSize:12, color:"var(--muted)" }}>k =</span>
              <span style={{ fontFamily:"var(--num-font)", fontSize:22, fontWeight:800, color:"var(--accent-ink)" }}>{t.neighbors.length}</span>
              <span style={{ fontSize:12, color:"var(--muted)" }}>Search radius =</span>
              <span style={{ fontFamily:"var(--num-font)", fontSize:16, fontWeight:700, color:"var(--accent-ink)" }}>{fmtN(kthDist,3)}</span>
            </div>
            <ScatterPlot data={KNN.KNN_CLS.data} query={t.query} neighbors={t.neighbors} kRadius={kthDist} />
            <ClassLegend />
            <div className="tf-subhead">Full distance table — all {KNN.KNN_CLS.data.length} points sorted</div>
            <DistTable allDists={t.allDists} k={t.neighbors.length} data={KNN.KNN_CLS.data} />
            <div className="tf-subhead">Selected neighbors (top {t.neighbors.length})</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, margin:"8px 0" }}>
              {t.neighbors.map((n,i) => {
                const pt = KNN.KNN_CLS.data[n.i];
                return (
                  <div key={i} style={{ padding:"8px 12px", borderRadius:10, border:`2px solid ${CLS_COLOR[pt[2]]}`, background:CLS_LIGHT[pt[2]], fontSize:13 }}>
                    <span style={{ fontWeight:800, color:CLS_COLOR[pt[2]] }}>P{n.i}</span>
                    <span style={{ color:"var(--muted)", margin:"0 4px" }}>{CLS_LABEL[pt[2]]}</span>
                    <span style={{ fontFamily:"var(--num-font)", fontSize:12, color:"var(--faint)" }}>d={fmtN(n.dist,3)}</span>
                  </div>
                );
              })}
            </div>
            <Note>Use the k slider in the header. Notice: k=1 → the single nearest wins outright. Larger k → more points inside the circle, coarser but more stable boundary.</Note>
          </>
        );
      },
    },

    // ── Stage 6: Majority Vote ──
    {
      id:"vote", group:"Algorithm", title:"Majority vote — deciding the class", map:"Vote",
      why:"The vote is the final decision. Understanding vote counts — and tie-breaking — is crucial for robust classification.",
      render:(t) => {
        const tied = Object.values(t.votes).filter(v=>v===Math.max(...Object.values(t.votes))).length > 1;
        return (
          <>
            <Lead>
              Each of the <b>k={t.neighbors.length} selected neighbors</b> casts exactly one vote for
              its own class label. The class that receives the <b>most votes wins</b> — this is called
              a <b>majority vote</b> (or plurality vote if no single class exceeds 50%).
            </Lead>
            <Lead>
              Current query at ({fmtN(t.query[0],1)}, {fmtN(t.query[1],1)}): the votes are
              {" "}{CLS_LABEL.map((l,i)=>`${l}: ${t.votes[i]||0}`).join(", ")}.
              {" "}<b style={{ color:CLS_COLOR[t.label] }}>{CLS_LABEL[t.label]}</b> wins with {t.votes[t.label]||0} vote{(t.votes[t.label]||0)===1?"":"s"}.
            </Lead>
            <div className="nn-calc">
              <div className="nn-calc-h">Vote tally — k={t.neighbors.length} neighbors</div>
              {t.neighbors.map((n,i) => {
                const pt = KNN.KNN_CLS.data[n.i];
                return (
                  <div key={i} className="nn-calc-row">
                    <span style={{ color:CLS_COLOR[pt[2]], fontWeight:700 }}>P{n.i}</span>
                    <span style={{ color:"var(--muted)", margin:"0 6px" }}>(rank {i+1}, dist={fmtN(n.dist,3)}) casts vote for</span>
                    <span style={{ color:CLS_COLOR[pt[2]], fontWeight:800 }}>{CLS_LABEL[pt[2]]}</span>
                  </div>
                );
              })}
              <div className="nn-calc-row" style={{ borderTop:"1px solid var(--line)", marginTop:4, paddingTop:6, fontWeight:700 }}>
                Result: {CLS_LABEL.map((l,i)=>`${l}=${t.votes[i]||0}`).join(", ")} → predict <span style={{ color:CLS_COLOR[t.label], marginLeft:4 }}>{CLS_LABEL[t.label]}</span>
              </div>
            </div>
            <div className="tf-subhead">Vote distribution</div>
            <VoteBar votes={t.votes} k={t.neighbors.length} label={t.label} />
            {tied && (
              <div style={{ padding:"10px 14px", background:"rgba(240,160,0,.12)", border:"1.5px solid rgba(240,160,0,.5)", borderRadius:10, fontSize:13, color:"var(--ink)", marginTop:8 }}>
                <b>Tie detected!</b> Common tie-breaking strategies:
                <ul style={{ marginTop:6, marginBottom:0 }}>
                  <li>Pick the class of the single nearest neighbor (1-NN tiebreak)</li>
                  <li>Switch to weighted voting (weight votes by 1/d²)</li>
                  <li>Reduce k by 1 until the tie breaks</li>
                  <li>Use odd k for binary classification to prevent ties</li>
                </ul>
              </div>
            )}
            <Note>For binary classification, always use an odd k to avoid ties. For multi-class problems, ties are possible with any k — the weighted voting strategy (Stage 7) elegantly avoids them.</Note>
          </>
        );
      },
    },

    // ── Stage 7: Effect of k ──
    {
      id:"keffect", group:"Concepts", title:"Effect of k — overfitting vs underfitting", map:"k Effect",
      why:"k is the single most important hyperparameter in KNN. Too small → memorises noise (overfit), too large → ignores local structure (underfit). The decision boundary visualisation makes this unmistakably clear.",
      render:(t) => (
        <>
          <Lead>
            The background color in each plot below shows what class KNN would predict at every
            location in the feature space — this is the <b>decision boundary</b>. As k changes,
            the boundary shape changes dramatically.
          </Lead>
          <Lead>
            <b>k=1</b> gives each training point its own region — jagged and fragmented, perfectly
            fitting training data but terrible at generalising. <b>k=5</b> smooths the boundary by
            averaging over more neighbors. <b>k=15</b> (which equals the entire dataset) simply
            votes for the majority class everywhere — essentially no learning.
          </Lead>
          <KComparisonGrid />
          <div className="tf-subhead">The bias-variance tradeoff</div>
          <div className="nn-calc">
            <div className="nn-calc-h">What changes as k increases?</div>
            <div className="nn-calc-row"><b>k=1 (small):</b> Low bias (memorises training data), high variance (wiggly boundary, very sensitive to noise/outliers)</div>
            <div className="nn-calc-row"><b>k=optimal:</b> Balanced — generalises well to unseen points without overfitting</div>
            <div className="nn-calc-row"><b>k=n (large):</b> High bias (always predicts overall majority class), zero variance — essentially random classification</div>
          </div>
          <div className="tf-subhead">Choosing k in practice — the elbow method</div>
          <div className="tf-legend">
            {[
              ["Step 1: Cross-validate", "Split data into train/val folds (k-fold or stratified)"],
              ["Step 2: Grid search", "Try k = 1, 3, 5, 7, …, √n (square root of training set size as a rule of thumb)"],
              ["Step 3: Plot", "Plot validation accuracy vs k — look for the 'elbow' where accuracy stops improving"],
              ["Step 4: Select", "Choose the smallest k that achieves near-maximum validation accuracy"],
            ].map(([name,desc])=>(
              <div className="tf-leg" key={name}>
                <div className="tf-leg-name">{name}</div>
                <div className="tf-leg-desc">{desc}</div>
              </div>
            ))}
          </div>
          <Note>Rule of thumb: start with k = √n (square root of training set size). For this 15-point dataset that gives k ≈ 4. Always prefer odd k for binary problems to avoid ties.</Note>
        </>
      ),
    },

    // ── Stage 8: Predictions on New Points ──
    {
      id:"predictions", group:"Algorithm", title:"Predictions on new points — end-to-end", map:"Predictions",
      why:"Walking through full predictions on multiple novel query points cements the algorithm as a concrete procedure, not an abstraction.",
      render:(t) => {
        // three fixed query points
        const queries = [[3,5],[6,5],[8,3]];
        const k = t.neighbors.length;

        return (
          <>
            <Lead>
              Let's classify <b>3 new query points</b> not in the training set, using k={k} and
              the same 15 training points. For each query: compute all distances, take the top k,
              count votes.
            </Lead>
            {queries.map((q,qi) => {
              const res = KNN.runKNNCls({x1:q[0],x2:q[1],k});
              const votes = res.votes;
              const label = res.label;
              const topK  = res.neighbors;
              return (
                <div key={qi} style={{ marginBottom:18, padding:"14px 16px", borderRadius:12, border:`2px solid ${CLS_COLOR[label]}`, background:CLS_LIGHT[label] }}>
                  <div style={{ fontSize:13, fontWeight:800, marginBottom:8 }}>
                    Query Q{qi+1} = ({q[0]}, {q[1]})
                  </div>
                  <div className="nn-calc" style={{ background:"var(--panel-solid)", marginBottom:8 }}>
                    <div className="nn-calc-h">Top {k} neighbors</div>
                    {topK.map((n,i)=>{
                      const pt = KNN.KNN_CLS.data[n.i];
                      return (
                        <div key={i} className="nn-calc-row">
                          <span style={{ color:CLS_COLOR[pt[2]], fontWeight:700 }}>P{n.i}</span>
                          <span style={{ color:"var(--muted)", margin:"0 6px" }}>{CLS_LABEL[pt[2]]}</span>
                          <span style={{ fontFamily:"var(--num-font)", fontSize:12 }}>d={fmtN(n.dist,3)}</span>
                        </div>
                      );
                    })}
                    <div className="nn-calc-row" style={{ borderTop:"1px solid var(--line)", paddingTop:5, marginTop:4 }}>
                      Votes: {CLS_LABEL.map((l,i)=>`${l}=${votes[i]||0}`).join(", ")} →
                      <b style={{ color:CLS_COLOR[label], marginLeft:4 }}>{CLS_LABEL[label]}</b>
                    </div>
                  </div>
                </div>
              );
            })}
            <Lead>
              Notice how the prediction changes as we move the query through different regions of the
              space. The boundary is not a straight line — it is determined locally by whichever
              training points happen to be nearby.
            </Lead>
            <Note>Use the sliders above to interactively explore predictions at any (x₁, x₂). The live prediction in each stage header updates as you move the query point.</Note>
          </>
        );
      },
    },

    // ── Stage 9: Missing Values & Outliers ──
    {
      id:"robustness", group:"Concepts", title:"Missing values & outliers — KNN's sensitivities", map:"Robustness",
      why:"KNN is unusually sensitive to both outliers (they vote directly) and missing values (distance can't be computed if a feature is absent). These are common real-world failure modes.",
      render:(t) => {
        const [localK, setLocalK] = React.useState(t.neighbors.length);
        return (
          <>
            <Lead>
              KNN has two well-known fragilities. First, <b>outliers</b>: because KNN stores every
              training point and uses them directly as voters, a single mislabeled or extreme point
              can corrupt the neighborhood of any nearby query. This is especially severe at k=1.
              Second, <b>missing values</b>: if a feature is NaN for a training or query point,
              Euclidean distance cannot be computed at all — you cannot subtract NaN.
            </Lead>
            <div className="tf-subhead">Outlier sensitivity — k=1 vs k={localK}</div>
            <div style={{ display:"flex", gap:10, alignItems:"center", margin:"8px 0 12px" }}>
              <span style={{ fontSize:12, color:"var(--muted)" }}>Compare k = </span>
              {[1,3,5,7].map(kv=>(
                <button key={kv} onClick={()=>setLocalK(kv)} style={{
                  padding:"4px 12px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer",
                  border: localK===kv ? `2px solid var(--accent)` : "1.5px solid var(--line)",
                  background: localK===kv ? "var(--accent-soft)" : "var(--panel-solid)",
                  color: localK===kv ? "var(--accent-ink)" : "var(--muted)",
                }}>{kv}</button>
              ))}
            </div>
            <OutlierViz k={localK} />
            <div style={{ marginTop:10, padding:"10px 14px", background:"rgba(224,67,30,0.08)", border:"1px solid rgba(224,67,30,0.3)", borderRadius:10, fontSize:13, lineHeight:1.6 }}>
              The <b>red circle</b> is a synthetic outlier — a Class B point placed inside the Class A cluster.
              At k=1 it directly becomes the nearest neighbor for the ★ query and changes the prediction.
              At larger k the majority vote overrides it. This is why <b>k=1 is almost never used in production</b>.
            </div>
            <div className="tf-subhead">Missing values — two strategies</div>
            <div className="tf-legend">
              {[
                ["Impute first (recommended)", "Fill missing values with mean, median, or KNN imputation BEFORE training KNN. sklearn has KNNImputer."],
                ["Distance that handles NaN", "Use modified distance: only average over non-missing features. Risky if many features are missing."],
                ["Drop features with NaN", "If a feature is missing for many points, drop it entirely from the KNN distance calculation."],
                ["Drop rows with NaN", "Simplest but wastes data. Acceptable if missing rate is low (< 5%)."],
              ].map(([name,desc])=>(
                <div className="tf-leg" key={name}>
                  <div className="tf-leg-name">{name}</div>
                  <div className="tf-leg-desc">{desc}</div>
                </div>
              ))}
            </div>
            <Note>KNN is paradoxically used TO impute missing values (KNNImputer in sklearn), but KNN FOR classification first requires that all values are present. Impute before you classify.</Note>
          </>
        );
      },
    },

    // ── Stage 10: Evaluation, Complexity & When to Use ──
    {
      id:"eval", group:"Summary", title:"Evaluation, complexity & when to use KNN", map:"When to Use",
      why:"No algorithm is universally best. Knowing KNN's time/space complexity and failure modes helps you make the right tool-selection decision.",
      render:(t) => (
        <>
          <Lead>
            KNN classification is evaluated with the same metrics as any classifier: <b>accuracy</b>
            (fraction correct), <b>precision</b> (of predicted positives, how many are true),
            <b> recall</b> (of actual positives, how many are found), and <b>F1-score</b> (harmonic
            mean of precision and recall). Use macro/weighted F1 for imbalanced classes.
          </Lead>
          <Lead>
            Unlike most algorithms, KNN has <b>O(1) training cost</b> but <b>O(n·d) prediction
            cost</b> per query, where n = training set size and d = number of features. Storing the
            full training set requires O(n·d) memory. For large n or d, this becomes prohibitive.
          </Lead>
          <div className="nn-calc">
            <div className="nn-calc-h">Time & space complexity (n = training points, d = features, k = neighbors)</div>
            <div className="nn-calc-row"><b>Training:</b> O(1) — just store the data, no fitting</div>
            <div className="nn-calc-row"><b>Prediction (brute force):</b> O(n·d) distance computations + O(n·log k) for top-k selection</div>
            <div className="nn-calc-row"><b>Memory:</b> O(n·d) — must keep entire training set in RAM</div>
            <div className="nn-calc-row"><b>With KD-tree:</b> O(d·log n) per prediction — effective in low dimensions (d &lt; 20)</div>
            <div className="nn-calc-row"><b>With Ball-tree:</b> O(d·log n) but works in slightly higher dimensions than KD-tree</div>
            <div className="nn-calc-row"><b>With FAISS/Annoy (approximate NN):</b> near O(log n) — trades small accuracy loss for major speed gain</div>
          </div>
          <div className="tf-subhead">Curse of dimensionality</div>
          <Lead>
            As the number of features d grows, the average distance between any two random points
            grows as √d. In very high dimensions, the nearest and farthest neighbors are nearly
            equidistant — the concept of "nearest" loses meaning. KNN degrades gracefully up to
            about d≈20 and then rapidly becomes unreliable.
          </Lead>
          <DimChart />
          <div className="tf-subhead">When to use KNN</div>
          <div className="opt-pc">
            <div className="opt-pc-col is-pro">
              <div className="opt-pc-h">✓ Great for</div>
              <ul>
                <li>Small datasets (n &lt; 50,000, d &lt; 20)</li>
                <li>Non-linear, complex decision boundaries</li>
                <li>Multi-class problems without distributional assumptions</li>
                <li>Quick baselines — no tuning beyond k</li>
                <li>Online learning — add new points without retraining</li>
              </ul>
            </div>
            <div className="opt-pc-col is-con">
              <div className="opt-pc-h">✗ Avoid when</div>
              <ul>
                <li>Large n (prediction is slow for millions of points)</li>
                <li>High d (&gt; 20 — curse of dimensionality)</li>
                <li>Many irrelevant features (degrades distance quality)</li>
                <li>Data has missing values (must impute first)</li>
                <li>Memory is tight (entire dataset stays in RAM)</li>
              </ul>
            </div>
          </div>
          <div className="tf-subhead">KNN vs alternatives</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:"2px solid var(--line)", background:"var(--accent-soft)" }}>
                  {["Property","KNN","Logistic Reg.","Decision Tree","Random Forest"].map(h=>(
                    <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:12, fontWeight:800, color:"var(--ink)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Training time","O(1)","O(n·d)","O(n·d·log n)","O(n·d·log n·T)"],
                  ["Prediction","O(n·d)","O(d)","O(log n)","O(T·log n)"],
                  ["Memory","O(n·d)","O(d)","O(nodes)","O(T·nodes)"],
                  ["Non-linear","Yes","No","Yes","Yes"],
                  ["Interpretable","Locally","Yes","Yes","No"],
                  ["High-D","Poor","Good","Good","Good"],
                  ["Outlier robust","Low","Moderate","Moderate","High"],
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
          <Note>For production-scale KNN, use sklearn's BallTree (set algorithm="ball_tree") for low-to-medium d, or FAISS for large n with high d. sklearn's KNeighborsClassifier handles all of this with the algorithm parameter.</Note>
        </>
      ),
    },
  {
    id: "hyperparams",
    group: "Practical",
    title: "Hyperparameters & when to use",
    map: "Hyperparams",
    why: "k is the only tuning knob that matters — but choosing it correctly requires understanding the bias-variance trade-off it controls.",
    render: () => (
      <>
        <Lead>KNN has the smallest hyperparameter space of any classifier: just k (the number of neighbors) and how to measure distance. But it has a huge practical limitation: it stores the entire training dataset and must search it at prediction time. This makes it powerful for small datasets and useless for large ones.</Lead>
        <Note>k controls the bias-variance trade-off directly and visually: k=1 → fits every training point exactly (zero bias, high variance → overfitting). k=n → predicts the majority class for everything (maximum bias, zero variance → underfitting). Optimal k is usually in [3, 20] for most datasets.</Note>
        <div className="tf-subhead">Key hyperparameters</div>
        <div className="tf-legend">
          {[
            ["n_neighbors (k)", "Number of neighbors", "Default 5. The ONLY critical hyperparameter. Tune with cross-validation over odd values [1, 3, 5, 7, 11, 15, 21]. Odd values avoid tie-breaking for binary classification."],
            ["weights", "Neighbor weighting scheme", "'uniform' (default, all neighbors equal vote). 'distance' (closer neighbors vote more). Use 'distance' when the decision boundary is complex and near neighbors are more informative."],
            ["metric", "Distance measure", "'minkowski' with p=2 = Euclidean (default). p=1 = Manhattan. 'cosine' for text/high-dim. ALWAYS scale features first — Euclidean distance is dominated by high-magnitude features."],
            ["algorithm", "Nearest neighbor search", "'auto' (default, picks best). 'ball_tree' or 'kd_tree' for structured data. 'brute' for high-dimensional data (>20 features, tree methods degrade)."],
            ["leaf_size", "Tree leaf size", "Default 30. Affects speed/memory trade-off for BallTree/KDTree. Rarely needs tuning."],
          ].map(([sym, name, desc]) => (
            <div className="tf-leg" key={sym}>
              <div className="tf-leg-top"><span className="tf-sym" style={{ fontSize: 10.5 }}>{sym}</span></div>
              <div className="tf-leg-name">{name}</div>
              <div className="tf-leg-desc">{desc}</div>
            </div>
          ))}
        </div>
        <Note>KNN requires feature scaling (StandardScaler or MinMaxScaler). Without scaling, features with large ranges (e.g., age 0–80) will dominate distance calculations over features with small ranges (e.g., binary flags 0–1).</Note>
        <div className="tf-subhead">Pros vs Cons</div>
        <div className="opt-pc">
          <div className="opt-pc-col is-pro">
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#2e7d32" }}>Advantages</div>
            {[
              "No training phase (lazy learner)",
              "Naturally multi-class",
              "Simple to understand and implement",
              "Non-parametric (no distribution assumptions)",
              "Automatically adapts to new data (just add points)",
            ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
          </div>
          <div className="opt-pc-col is-con">
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
            {[
              "O(n) prediction time per query (must search entire training set)",
              "O(n) memory — useless for n > 100K",
              "Terrible in high dimensions (curse of dimensionality)",
              "Requires feature scaling",
              "No feature importances",
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
                ["Small dataset (< 10K), fast prototyping", "KNN", "Zero training time, easy baseline"],
                ["Large dataset (> 100K rows)", "Logistic Regression or GBM", "KNN prediction is O(n) — too slow"],
                ["Many features (> 50)", "Random Forest or GBM", "Curse of dimensionality: distances become meaningless in high dims"],
                ["Need probability estimates", "Logistic Regression", "KNN probabilities (fraction of k neighbors) are noisy"],
                ["Recommendation systems", "KNN (cosine similarity)", "User-item similarity search is literally KNN"],
                ["Interpretable model", "Decision Tree", "KNN explains nothing — it just looks up neighbors"],
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
    subtitle: "Classification — lazy learner, majority vote",
    cur: "KNN · Classification",
    category: "ML Algorithms",
    default: KNN.KNN_CLS.default,
    run: KNN.runKNNCls,
    renderInput,
    modeLinks: [
      { label: "Classification", href: "KNN (Classification).html", active: true  },
      { label: "Regression",     href: "KNN (Regression).html",     active: false },
    ],
  };
})();
