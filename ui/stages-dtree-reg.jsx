/* Decision Tree — Regression stages  (complete rewrite) */
(function () {
  const { Matrix, V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { DT_REG, runDTreeReg } = window.ML_DTREE;

  // ── Colours for the 3 leaf regions ──
  const LC  = ["#2B5BFF", "#1f9e6b", "#e0492e"];
  const LBG = ["rgba(43,91,255,.13)", "rgba(31,158,107,.13)", "rgba(224,73,46,.13)"];

  // ── Layout helpers ──
  const card = (children, extra) => (
    <div style={{ background:"var(--panel-solid)", border:"1px solid var(--line)",
      borderRadius:14, padding:"16px 20px", boxShadow:"var(--shadow)",
      marginBottom:14, ...extra }}>
      {children}
    </div>
  );
  const row = (children) => (
    <div style={{ display:"flex", gap:18, flexWrap:"wrap", alignItems:"flex-start", margin:"12px 0" }}>
      {children}
    </div>
  );
  const subhead = (t) => <div className="tf-subhead">{t}</div>;

  // ── Variance helper ──
  function variance(arr) {
    if (arr.length === 0) return 0;
    const m = arr.reduce((a,b)=>a+b,0)/arr.length;
    return arr.reduce((s,y)=>s+(y-m)**2,0)/arr.length;
  }
  function mean(arr) {
    if (arr.length===0) return 0;
    return arr.reduce((a,b)=>a+b,0)/arr.length;
  }

  // ════════════════════════════════════════════
  // REGRESSION TREE SVG
  // ════════════════════════════════════════════
  function RegTreeDiagram({ highlightPath, showFormulas }) {
    const nodes = {
      root:  { x:225, y:58,   label:"age ≤ 15?", var:"5.20", samples:8,  mean:"4.61", isInternal:true },
      left:  { x:115, y:168,  label:"age ≤ 8?",  var:"0.90", samples:4,  mean:"7.05", isInternal:true },
      right: { x:360, y:168,  label:"predict 2.68", var:"0.55", samples:4, mean:"2.68", leafIdx:2 },
      ll:    { x:60,  y:278,  label:"predict 7.85", var:"0.12", samples:2, mean:"7.85", leafIdx:0 },
      lr:    { x:185, y:278,  label:"predict 6.25", var:"0.30", samples:2, mean:"6.25", leafIdx:1 },
    };

    const isActive = (id) => {
      if (!highlightPath) return false;
      return highlightPath.some(e=>e.to===id||(id==="root"&&e.from==="root"));
    };
    const edgeAct = (f,t) => {
      if (!highlightPath) return false;
      return highlightPath.some(e=>e.from===f&&e.to===t);
    };

    function NBox({ id, n }) {
      const act = isActive(id);
      const isL = !n.isInternal;
      const w   = isL ? 108 : 120;
      const h   = showFormulas ? 58 : 42;
      const fill  = isL ? LBG[n.leafIdx] : "var(--panel-solid)";
      const stk   = act ? "var(--accent)" : (isL ? LC[n.leafIdx] : "var(--line)");
      const textY = showFormulas ? n.y-8 : n.y+5;
      return (
        <g>
          {act && <rect x={n.x-w/2-4} y={n.y-h/2-4} width={w+8} height={h+8} rx="11"
            fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 2" opacity="0.6"/>}
          <rect x={n.x-w/2} y={n.y-h/2} width={w} height={h} rx="8"
            fill={fill} stroke={stk} strokeWidth={act?2.5:1.5}/>
          <text x={n.x} y={textY} textAnchor="middle" fontSize="11" fontWeight="700"
            fill={isL ? LC[n.leafIdx] : "var(--ink)"}>{n.label}</text>
          {showFormulas && <>
            <text x={n.x} y={n.y+8} textAnchor="middle" fontSize="9.5" fill="var(--muted)">
              n={n.samples} · var={n.var}
            </text>
            {isL && <text x={n.x} y={n.y+20} textAnchor="middle" fontSize="9" fill="var(--faint)">
              mean={n.mean}
            </text>}
          </>}
        </g>
      );
    }

    function Edge({ f, t, lbl, side }) {
      const a=nodes[f], b=nodes[t];
      const act=edgeAct(f,t);
      const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
      const lx=side==="left"?mx-18:mx+18;
      return (
        <g>
          <line x1={a.x} y1={a.y+22} x2={b.x} y2={b.y-22}
            stroke={act?"var(--accent)":"var(--line)"} strokeWidth={act?2.5:1.5}/>
          <text x={lx} y={my+2} textAnchor="middle" fontSize="10" fontWeight="700"
            fill={act?"var(--accent)":"var(--faint)"}>{lbl}</text>
        </g>
      );
    }

    const svgH = showFormulas ? 340 : 316;
    return (
      <svg viewBox={`0 0 450 ${svgH}`} style={{ width:"100%", maxWidth:450, height:"auto",
        border:"1px solid var(--line)", borderRadius:14, background:"var(--panel-solid)",
        boxShadow:"var(--shadow)", display:"block" }}>
        <Edge f="root" t="left"  lbl="YES (≤)" side="left"/>
        <Edge f="root" t="right" lbl="NO (>)"  side="right"/>
        <Edge f="left" t="ll"    lbl="YES (≤)" side="left"/>
        <Edge f="left" t="lr"    lbl="NO (>)"  side="right"/>
        <NBox id="root"  n={nodes.root}/>
        <NBox id="left"  n={nodes.left}/>
        <NBox id="right" n={nodes.right}/>
        <NBox id="ll"    n={nodes.ll}/>
        <NBox id="lr"    n={nodes.lr}/>
        {[["≤8 → 7.85","new"],["8–15 → 6.25","mid"],["15+ → 2.68","old"]].map(([v,l],i)=>(
          <g key={i} transform={`translate(${14+i*140}, ${svgH-22})`}>
            <rect width="10" height="10" rx="3" fill={LC[i]}/>
            <text x="14" y="9" fontSize="9.5" fill="var(--muted)">{l}: {v}</text>
          </g>
        ))}
      </svg>
    );
  }

  // ════════════════════════════════════════════
  // SCATTER PLOT + STEP FUNCTION
  // ════════════════════════════════════════════
  function RegScatter({ input, showStep, showResidual }) {
    const data = DT_REG.data;
    const W=440, H=290, pad={l:52,r:20,t:20,b:42};
    const pw=W-pad.l-pad.r, ph=H-pad.t-pad.b;
    const sx = v => pad.l+((v-0)/(50-0))*pw;
    const sy = v => pad.t+ph-((v-0)/(10-0))*ph;
    const stepFn = age => age<=8?7.85:age<=15?6.25:2.675;
    const qAge  = input?.age ?? null;
    const qPred = qAge!==null?stepFn(qAge):null;
    const nearest = qAge!==null ? data.reduce((a,b)=>Math.abs(b[0]-qAge)<Math.abs(a[0]-qAge)?b:a)[1] : null;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart">
        {/* grid */}
        {[10,20,30,40].map(v=>(
          <line key={v} x1={sx(v)} y1={pad.t} x2={sx(v)} y2={pad.t+ph}
            stroke="var(--line)" strokeWidth="1"/>
        ))}
        {[2,4,6,8].map(v=>(
          <line key={v} x1={pad.l} y1={sy(v)} x2={pad.l+pw} y2={sy(v)}
            stroke="var(--line)" strokeWidth="1"/>
        ))}
        {/* region backgrounds */}
        {showStep && <>
          <rect x={pad.l} y={pad.t} width={sx(8)-pad.l} height={ph} fill={LBG[0]}/>
          <rect x={sx(8)} y={pad.t} width={sx(15)-sx(8)} height={ph} fill={LBG[1]}/>
          <rect x={sx(15)} y={pad.t} width={pad.l+pw-sx(15)} height={ph} fill={LBG[2]}/>
          {/* step segments */}
          <line x1={sx(0)}  y1={sy(7.85)}  x2={sx(8)}  y2={sy(7.85)}  stroke={LC[0]} strokeWidth="2.5"/>
          <line x1={sx(8)}  y1={sy(6.25)}  x2={sx(15)} y2={sy(6.25)}  stroke={LC[1]} strokeWidth="2.5"/>
          <line x1={sx(15)} y1={sy(2.675)} x2={sx(50)} y2={sy(2.675)} stroke={LC[2]} strokeWidth="2.5"/>
          {/* vertical connectors */}
          <line x1={sx(8)}  y1={sy(7.85)} x2={sx(8)}  y2={sy(6.25)}  stroke="var(--line)" strokeWidth="1" strokeDasharray="3 2"/>
          <line x1={sx(15)} y1={sy(6.25)} x2={sx(15)} y2={sy(2.675)} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 2"/>
          {/* region boundary labels */}
          <text x={sx(4)}    y={sy(7.85)-6} textAnchor="middle" fontSize="9.5" fill={LC[0]} fontWeight="700">7.85</text>
          <text x={sx(11.5)} y={sy(6.25)-6} textAnchor="middle" fontSize="9.5" fill={LC[1]} fontWeight="700">6.25</text>
          <text x={sx(32)}   y={sy(2.675)-6} textAnchor="middle" fontSize="9.5" fill={LC[2]} fontWeight="700">2.68</text>
          <text x={sx(4)}    y={pad.t+ph-6} textAnchor="middle" fontSize="9" fill={LC[0]} opacity="0.8">age≤8</text>
          <text x={sx(11.5)} y={pad.t+ph-6} textAnchor="middle" fontSize="9" fill={LC[1]} opacity="0.8">8&lt;age≤15</text>
          <text x={sx(32)}   y={pad.t+ph-6} textAnchor="middle" fontSize="9" fill={LC[2]} opacity="0.8">age&gt;15</text>
        </>}
        {/* data points */}
        {data.map((d,i)=>(
          <circle key={i} cx={sx(d[0])} cy={sy(d[1])} r="5.5"
            fill="var(--ink)" opacity="0.75" stroke="var(--panel-solid)" strokeWidth="1.5"/>
        ))}
        {/* query */}
        {qAge!==null && <>
          {showResidual && nearest && (
            <line x1={sx(qAge)} y1={sy(qPred)} x2={sx(qAge)} y2={sy(nearest)}
              stroke="#e0492e" strokeWidth="1.5" strokeDasharray="4 2"/>
          )}
          <circle cx={sx(qAge)} cy={sy(qPred)} r="8"
            fill="var(--accent)" opacity="0.85" stroke="var(--panel-solid)" strokeWidth="1.5"/>
          <text x={sx(qAge)} y={sy(qPred)+4} textAnchor="middle" fontSize="11"
            fontWeight="900" fill="white">★</text>
        </>}
        {/* axes */}
        <line x1={pad.l} y1={pad.t+ph} x2={pad.l+pw} y2={pad.t+ph} stroke="var(--faint)"/>
        <line x1={pad.l} y1={pad.t}    x2={pad.l}     y2={pad.t+ph} stroke="var(--faint)"/>
        <text x={pad.l+pw/2} y={H-5} textAnchor="middle" className="reg-axl">age (years)</text>
        <text x="13" y={pad.t+ph/2} textAnchor="middle" className="reg-axl"
          transform={`rotate(-90,13,${pad.t+ph/2})`}>price ($100k)</text>
        {[0,10,20,30,40].map(v=>(
          <text key={v} x={sx(v)} y={pad.t+ph+15} textAnchor="middle" className="reg-axl">{v}</text>
        ))}
        {[0,2,4,6,8].map(v=>(
          <text key={v} x={pad.l-6} y={sy(v)+4} textAnchor="end" className="reg-axl">{v}</text>
        ))}
      </svg>
    );
  }

  // ════════════════════════════════════════════
  // VARIANCE BAR
  // ════════════════════════════════════════════
  function VarBar({ vals, label, maxV }) {
    const v = variance(vals);
    const m = mean(vals);
    const ref = maxV || 5.2;
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"5px 0" }}>
        <span style={{ width:140, fontSize:12, color:"var(--muted)", textAlign:"right", flexShrink:0 }}>{label}</span>
        <div style={{ flex:1, height:18, background:"var(--line-soft)", borderRadius:6, overflow:"hidden", maxWidth:180 }}>
          <div style={{ width:`${Math.min((v/ref)*100,100)}%`, height:"100%",
            background:"linear-gradient(90deg,var(--accent),var(--neon))", borderRadius:6 }}/>
        </div>
        <span style={{ fontFamily:"var(--num-font)", fontSize:12, fontWeight:800,
          color:"var(--accent-ink)", width:44 }}>{fmt(v,3)}</span>
        <span style={{ fontSize:11, color:"var(--faint)" }}>mean={fmt(m,2)}</span>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // BUILD PATH EDGES
  // ════════════════════════════════════════════
  function buildEdges(path) {
    const edges=[{from:"root",to:"root"}];
    for (let i=0; i<path.length; i++) {
      const step=path[i];
      if (step.leaf) break;
      if (i===0) { const to=step.goLeft?"left":"right"; edges.push({from:"root",to}); }
      else        { const to=step.goLeft?"ll":"lr";     edges.push({from:"left",to}); }
    }
    return edges;
  }

  // ════════════════════════════════════════════
  // TREE BUILD ANIMATION — Regression
  // ════════════════════════════════════════════
  const REG_ANIM_NODES = [
    { id:"root",  revealPhase:0, x:420, y:80,  w:148, h:78, label:"age ≤ 15",    sublabel:"n=8 · Var=5.20", badge:"ROOT",  badgeColor:"#2B5BFF", fill:"rgba(43,91,255,.12)",  stroke:"#2B5BFF", textColor:"#2B5BFF", isLeaf:false, predict:null   },
    { id:"left",  revealPhase:1, x:220, y:230, w:148, h:78, label:"age ≤ 8",     sublabel:"n=4 · Var=0.90", badge:"SPLIT", badgeColor:"#7c3aed", fill:"rgba(124,58,237,.10)", stroke:"#7c3aed", textColor:"#7c3aed", isLeaf:false, predict:null   },
    { id:"right", revealPhase:1, x:640, y:230, w:148, h:78, label:"Leaf",         sublabel:"n=4 · Var=0.55", badge:"LEAF",  badgeColor:"#1f9e6b", fill:"rgba(31,158,107,.22)", stroke:"#1f9e6b", textColor:"#1f9e6b", isLeaf:true,  predict:2.68   },
    { id:"ll",    revealPhase:2, x:110, y:390, w:148, h:78, label:"Leaf",         sublabel:"n=2 · Var=0.12", badge:"LEAF",  badgeColor:"#1f9e6b", fill:"rgba(31,158,107,.22)", stroke:"#1f9e6b", textColor:"#1f9e6b", isLeaf:true,  predict:7.85   },
    { id:"lr",    revealPhase:2, x:340, y:390, w:148, h:78, label:"Leaf",         sublabel:"n=2 · Var=0.30", badge:"LEAF",  badgeColor:"#1f9e6b", fill:"rgba(31,158,107,.22)", stroke:"#1f9e6b", textColor:"#1f9e6b", isLeaf:true,  predict:6.25   },
  ];
  const REG_ANIM_EDGES = [
    { from:"root",  to:"left",  revealPhase:1, side:"left",  labelYes:true  },
    { from:"root",  to:"right", revealPhase:1, side:"right", labelYes:false },
    { from:"left",  to:"ll",    revealPhase:2, side:"left",  labelYes:true  },
    { from:"left",  to:"lr",    revealPhase:2, side:"right", labelYes:false },
  ];
  const REG_ANIM_ANNOTATIONS = [
    { x:420, y:26,  text:"Root: splits by highest Variance Reduction", color:"#2B5BFF" },
    { x:640, y:174, text:"Var reduced 5.20 → 0.55 on right side",      color:"#7c3aed" },
    { x:220, y:174, text:"Var reduced 0.90 → 0.12 / 0.30 on left",     color:"#1f9e6b" },
    { x:420, y:450, text:"All leaves stable — tree complete!",           color:"#1f9e6b" },
  ];
  const REG_PHASE_LABELS = [
    "Phase 0 of 3 — Root node appears",
    "Phase 1 of 3 — Root splits at age ≤ 15",
    "Phase 2 of 3 — Left node splits at age ≤ 8",
    "Phase 3 of 3 — All leaves reached — tree complete",
  ];

  function RegTreeBuildAnim() {
    const [phase, setPhase] = React.useState(0);
    const [playing, setPlaying] = React.useState(false);
    const [speed, setSpeed] = React.useState(1200);

    React.useEffect(() => {
      if (!playing) return;
      if (phase >= 3) { setPlaying(false); return; }
      const t = setTimeout(() => setPhase(p => p + 1), speed);
      return () => clearTimeout(t);
    }, [playing, phase, speed]);

    function NodeBox({ n }) {
      const visible = phase >= n.revealPhase;
      const animStyle = {
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.3)",
        transformOrigin: `${n.x}px ${n.y}px`,
        transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(.34,1.56,.64,1)",
      };
      return (
        <g style={animStyle}>
          {n.isLeaf && visible && (
            <rect x={n.x - n.w/2 - 5} y={n.y - n.h/2 - 5}
              width={n.w + 10} height={n.h + 10} rx="14"
              fill="none" stroke={n.stroke} strokeWidth="2" opacity="0.35"
              style={{ animation:"regTreePulse 2s ease-in-out infinite" }}/>
          )}
          <rect x={n.x - n.w/2} y={n.y - n.h/2} width={n.w} height={n.h}
            rx="10" fill={n.fill} stroke={n.stroke} strokeWidth="2"/>
          <rect x={n.x - n.w/2 + 6} y={n.y - n.h/2 + 6}
            width={n.badge.length * 7 + 8} height={16} rx="4"
            fill={n.badgeColor} opacity="0.9"/>
          <text x={n.x - n.w/2 + 10} y={n.y - n.h/2 + 17}
            fontSize="9" fontWeight="800" fill="white">{n.badge}</text>
          <text x={n.x} y={n.y - 10} textAnchor="middle"
            fontSize="12" fontWeight="700" fill={n.textColor}>{n.label}</text>
          <text x={n.x} y={n.y + 6} textAnchor="middle"
            fontSize="10" fill="#888">{n.sublabel}</text>
          {n.isLeaf && n.predict !== null && (
            <>
              <rect x={n.x - 46} y={n.y + 16} width="92" height="20" rx="5"
                fill={n.badgeColor} opacity="0.18"/>
              <text x={n.x} y={n.y + 30} textAnchor="middle"
                fontSize="11" fontWeight="900" fill={n.badgeColor}>
                PREDICT: ${n.predict}×100k
              </text>
            </>
          )}
        </g>
      );
    }

    function EdgeLine({ e }) {
      const fromNode = REG_ANIM_NODES.find(n => n.id === e.from);
      const toNode   = REG_ANIM_NODES.find(n => n.id === e.to);
      if (!fromNode || !toNode) return null;
      const visible = phase >= e.revealPhase;
      const x1 = fromNode.x, y1 = fromNode.y + fromNode.h/2;
      const x2 = toNode.x,   y2 = toNode.y - toNode.h/2;
      const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
      const mx = (x1+x2)/2, my = (y1+y2)/2;
      const lx = e.side === "left" ? mx - 22 : mx + 22;
      return (
        <g>
          <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={e.labelYes ? "#1f9e6b" : "#e0492e"} strokeWidth="2"
            strokeDasharray={len} strokeDashoffset={visible ? 0 : len}
            style={{ transition:"stroke-dashoffset 0.6s ease" }}
            opacity={visible ? 1 : 0}/>
          {visible && (
            <text x={lx} y={my + 4} textAnchor="middle"
              fontSize="10" fontWeight="800"
              fill={e.labelYes ? "#1f9e6b" : "#e0492e"}>
              {e.labelYes ? "Yes ≤" : "No >"}
            </text>
          )}
        </g>
      );
    }

    const ann = REG_ANIM_ANNOTATIONS[phase] || null;

    return (
      <div style={{ fontFamily:"var(--body-font, sans-serif)" }}>
        <style>{`
          @keyframes regTreePulse {
            0%, 100% { opacity: 0.3; }
            50%       { opacity: 0.7; }
          }
        `}</style>
        <div style={{ display:"flex", gap:18, flexWrap:"wrap", alignItems:"flex-start" }}>
          <div style={{ flex:"1 1 480px" }}>
            <svg viewBox="0 0 840 490" style={{ width:"100%", height:"auto",
              border:"1px solid var(--line)", borderRadius:14,
              background:"var(--panel-solid)", boxShadow:"var(--shadow)", display:"block" }}>
              {ann && (
                <g>
                  <rect x={ann.x - 200} y={ann.y - 14} width="400" height="22"
                    rx="6" fill={ann.color} opacity="0.10"/>
                  <text x={ann.x} y={ann.y + 2} textAnchor="middle"
                    fontSize="11" fontWeight="700" fill={ann.color}>{ann.text}</text>
                </g>
              )}
              {REG_ANIM_EDGES.map((e, i) => <EdgeLine key={i} e={e}/>)}
              {REG_ANIM_NODES.map(n => <NodeBox key={n.id} n={n}/>)}
              {[["#2B5BFF","Root"], ["#7c3aed","Internal"], ["#1f9e6b","Leaf"]].map(([c,lbl], i) => (
                <g key={i} transform={`translate(${30 + i*130}, 470)`}>
                  <rect width="10" height="10" rx="3" fill={c}/>
                  <text x="14" y="9" fontSize="9.5" fill="var(--muted)">{lbl}</text>
                </g>
              ))}
            </svg>
          </div>
          <div style={{ flex:"0 0 190px", minWidth:170 }}>
            <div style={{ fontWeight:800, fontSize:12, color:"var(--ink)", marginBottom:10 }}>Legend</div>
            {[
              { color:"#2B5BFF", label:"Root Node",     desc:"First split — max variance reduction" },
              { color:"#7c3aed", label:"Internal Node", desc:"Still heterogeneous — splits further" },
              { color:"#1f9e6b", label:"Leaf Node",     desc:"Returns mean as prediction (PREDICT)" },
            ].map(({ color, label, desc }) => (
              <div key={label} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ width:12, height:12, borderRadius:3, background:color, flexShrink:0, marginTop:2 }}/>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--ink)" }}>{label}</div>
                  <div style={{ fontSize:10, color:"var(--muted)" }}>{desc}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop:14, padding:"10px 12px", borderRadius:10,
              background:"var(--line-soft)", border:"1px solid var(--line)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>Leaf predictions</div>
              {[
                { label:"age ≤ 8",      predict:"$785k" },
                { label:"8 < age ≤ 15", predict:"$625k" },
                { label:"age > 15",     predict:"$268k" },
              ].map(({ label, predict }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:5 }}>
                  <span style={{ fontSize:10, color:"var(--muted)" }}>{label}</span>
                  <span style={{ fontSize:11, fontWeight:800, color:"#1f9e6b" }}>{predict}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"center",
          marginTop:16, padding:"12px 16px", borderRadius:12,
          background:"var(--line-soft)", border:"1px solid var(--line)" }}>
          <button onClick={() => { if (phase >= 3) { setPhase(0); setPlaying(false); } else setPlaying(true); }}
            style={{ padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer",
              background:"#2B5BFF", color:"white", fontWeight:700, fontSize:13 }}>
            {phase >= 3 ? "⟳ Reset & Play" : "▶ Play"}
          </button>
          <button onClick={() => setPlaying(false)}
            style={{ padding:"6px 14px", borderRadius:8, cursor:"pointer",
              background:"var(--panel-solid)", border:"1px solid var(--line)",
              fontWeight:700, fontSize:13, color:"var(--ink)" }}>
            ⏸ Pause
          </button>
          <button onClick={() => { setPhase(0); setPlaying(false); }}
            style={{ padding:"6px 14px", borderRadius:8, cursor:"pointer",
              background:"var(--panel-solid)", border:"1px solid var(--line)",
              fontWeight:700, fontSize:13, color:"var(--ink)" }}>
            ⟳ Reset
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:8 }}>
            <span style={{ fontSize:11, color:"var(--muted)", fontWeight:700 }}>Speed:</span>
            {[["Slow",2000],["Normal",1200],["Fast",500]].map(([lbl,ms]) => (
              <button key={lbl} onClick={() => setSpeed(ms)}
                style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer",
                  fontSize:11, fontWeight:700,
                  background: speed === ms ? "#2B5BFF" : "var(--panel-solid)",
                  color:      speed === ms ? "white"   : "var(--ink)",
                  border:     speed === ms ? "none"    : "1px solid var(--line)" }}>
                {lbl}
              </button>
            ))}
          </div>
          <div style={{ marginLeft:"auto", fontSize:12, fontWeight:700,
            color:"var(--accent-ink)", padding:"4px 12px", borderRadius:8,
            background:"var(--accent-soft)" }}>
            {REG_PHASE_LABELS[phase]}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
          {[0,1,2,3].map(p => (
            <button key={p} onClick={() => { setPhase(p); setPlaying(false); }}
              style={{ padding:"5px 12px", borderRadius:8, cursor:"pointer",
                fontSize:11, fontWeight:700,
                background: phase === p ? "#2B5BFF" : "var(--line-soft)",
                color:      phase === p ? "white"   : "var(--muted)",
                border:     phase === p ? "none"    : "1px solid var(--line)" }}>
              Phase {p}
            </button>
          ))}
          <span style={{ fontSize:11, color:"var(--faint)", alignSelf:"center", marginLeft:8 }}>
            — or click a phase button to jump directly
          </span>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // STAGES
  // ════════════════════════════════════════════
  const STAGES = [

    // ── 1. Overview ──────────────────────────────────────
    {
      id:"reg-overview", group:"Overview", title:"Decision Trees for Regression",
      map:"Overview",
      why:"The same tree algorithm that classifies flowers can predict house prices — the only difference is what happens at the leaves. Understanding this symmetry unifies classification and regression in one framework.",
      render: (trace) => (
        <>
          <Lead>
            A <b>regression tree</b> answers a number question ("how much does this house
            cost?") instead of a category question. The tree structure — root, internal
            nodes, branches, leaves — is identical to a classification tree. The difference
            is at the <b>leaf nodes</b>: instead of voting for the most common class, each
            leaf <b>computes the mean target value</b> of its training samples and returns
            that as the prediction.
          </Lead>
          <Lead>
            Instead of Gini impurity or entropy (which measure class mixing), regression trees
            minimise <b>variance</b> (which measures how spread out the target values are).
            A leaf with low variance means all its training samples have similar prices —
            a reliable, confident prediction. A split is good if it creates two groups, each
            internally homogeneous in the target value.
          </Lead>
          <Lead>
            The resulting model is a <b>piecewise-constant step function</b>: the feature
            space is divided into rectangular regions, and every point in a region gets the
            same prediction (the leaf mean). The chart below shows this step function in
            orange over the scattered house data — move the age slider to see where ★ lands.
          </Lead>
          {row(<>
            <RegTreeDiagram showFormulas={true}/>
            <div style={{ maxWidth:260 }}>
              {subhead("Leaf predictions")}
              <div className="tf-legend" style={{ gridTemplateColumns:"1fr" }}>
                {[
                  ["Internal node","Tests age ≤ threshold; routes left (YES) or right (NO)."],
                  ["Leaf node","Returns mean(y) of training samples reaching this region."],
                  ["Variance","Replaces Gini — measures spread of target values. Lower = purer."],
                  ["Step function","Each leaf is one horizontal segment on the prediction curve."],
                ].map(([n,d])=>(
                  <div className="tf-leg" key={n}>
                    <div className="tf-leg-name">{n}</div>
                    <div className="tf-leg-desc">{d}</div>
                  </div>
                ))}
              </div>
              <div className="tf-lifecycle" style={{ marginTop:12 }}>
                <div className="tf-life tf-life--train">
                  <div className="tf-life-h"><span>T</span><span>Training</span></div>
                  <p>For each node, try all thresholds of all features. Pick the split with lowest weighted variance. Recurse until leaves are small enough.</p>
                </div>
                <div className="tf-life tf-life--infer">
                  <div className="tf-life-h"><span>I</span><span>Inference</span></div>
                  <p>Route the input down the tree. The leaf reached returns its stored mean as the predicted price.</p>
                </div>
              </div>
            </div>
          </>)}
          {subhead("Step-function prediction over the data")}
          <RegScatter input={trace.input} showStep={true}/>
        </>
      ),
    },

    // ── 2. Dataset ───────────────────────────────────────
    {
      id:"reg-dataset", group:"Overview", title:"The Training Dataset",
      map:"Dataset",
      why:"The house-age vs price dataset illustrates a non-linear relationship that a straight line would fit poorly. A step function from a decision tree captures the three natural price tiers much more cleanly.",
      render: (trace) => (
        <>
          <Lead>
            Our toy dataset has <b>8 houses</b> with one input feature — <b>age</b> (years) —
            and one target variable — <b>price</b> ($100k). The relationship is clearly
            non-linear: new houses cost roughly $800k, mid-age houses $600k, and old houses
            under $300k. A linear regression would force a diagonal line through this stepped
            pattern and would perform worse in every region.
          </Lead>
          <Lead>
            This is exactly the kind of data where decision trees shine — the price has
            <b> natural threshold-based breaks</b> (around age 8 and age 15). The tree
            learns these thresholds automatically from variance reduction.
          </Lead>
          {row(<>
            <RegScatter input={trace.input}/>
            <div>
              {subhead("Data table")}
              <table style={{ borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--line)" }}>
                    {["#","age (yr)","price ($100k)"].map(h=>(
                      <th key={h} style={{ padding:"5px 12px", textAlign:"right",
                        color:"var(--faint)", fontWeight:700, fontSize:11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DT_REG.data.map(([age,price],i)=>(
                    <tr key={i} style={{ borderBottom:"1px solid var(--line-soft)",
                      background:i%2===0?"var(--line-soft)":"transparent" }}>
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
              <Note style={{marginTop:8}}>Three natural price tiers: ~$750–820k (new), ~$570–680k (mid), ~$180–380k (old).</Note>
            </div>
          </>)}
        </>
      ),
    },

    // ── 3. Variance & MSE as Split Criterion ─────────────
    {
      id:"reg-variance", group:"Math", title:"Variance & MSE as Split Criterion",
      map:"Variance",
      why:"Variance reduction is the regression analogue of Information Gain. Understanding it mathematically explains every split decision the tree makes.",
      render: () => {
        const all = DT_REG.data.map(d=>d[1]);
        const mAll = mean(all), vAll = variance(all);

        const g1 = [8.2,7.5], g2 = [6.8,5.7], g3 = [3.8,2.9,2.2,1.8];
        const m1=mean(g1), m2=mean(g2), m3=mean(g3);
        const v1=variance(g1), v2=variance(g2), v3=variance(g3);

        // variance reduction for split at 15
        const leftVals  = [8.2,7.5,6.8,5.7];
        const rightVals = [3.8,2.9,2.2,1.8];
        const vL = variance(leftVals), vR = variance(rightVals);
        const wV_15 = (4*vL + 4*vR)/8;
        const VR_15 = vAll - wV_15;

        return (
          <>
            <Lead>
              For regression trees, the <b>impurity</b> of a node is its <b>variance</b>:
              how spread out the target values are. A node with low variance means all its
              houses have similar prices — we can predict confidently. A node with high variance
              means prices are all over the place — splitting it will improve predictions.
            </Lead>
            <Formula label="Variance">
              Var(node) = (1/n) × Σᵢ (yᵢ − ȳ)²
            </Formula>
            <Lead>
              <b>Variance Reduction</b> (also called MSE reduction) measures how much a split
              helps: VR = Var(parent) − [n_left/n × Var(left) + n_right/n × Var(right)].
              The tree greedily picks the split with the <em>highest</em> variance reduction
              at each node — exactly analogous to Information Gain in classification.
            </Lead>
            <Formula label="Variance Reduction">
              VR = Var(parent) − (n_L/n)·Var(L) − (n_R/n)·Var(R)
            </Formula>
            {subhead("Variance by region")}
            <div style={{ maxWidth:560 }}>
              <VarBar vals={all}    label="All 8 houses (root)"/>
              <VarBar vals={leftVals}  label="age ≤ 15 (n=4)"/>
              <VarBar vals={rightVals} label="age > 15  (n=4)"/>
              <VarBar vals={g1}    label="age ≤ 8    (n=2)"/>
              <VarBar vals={g2}    label="8 < age ≤ 15 (n=2)"/>
              <VarBar vals={g3}    label="age > 15   (n=4)"/>
            </div>
            {subhead("Root node variance")}
            {card(<div className="nn-calc">
              <div className="nn-calc-h">All 8 prices: {all.join(", ")}</div>
              <div className="nn-calc-row">Mean ȳ = {fmt(mAll,3)}</div>
              <div className="nn-calc-row">Squared deviations: {all.map(y=>fmt((y-mAll)**2,3)).join(" + ")}</div>
              <div className="nn-calc-row">Sum = {fmt(all.reduce((s,y)=>s+(y-mAll)**2,0),3)}</div>
              <div className="nn-calc-row"><b>Var(root) = {fmt(vAll,3)} / 8 = <span style={{color:"var(--accent)"}}>{fmt(vAll,3)}</span></b></div>
            </div>)}
            {subhead("Variance reduction for split at age=15")}
            {card(<div className="nn-calc">
              <div className="nn-calc-h">Left (age≤15): {leftVals.join(", ")}, n=4</div>
              <div className="nn-calc-row">Mean_L = {fmt(mean(leftVals),3)}, Var_L = {fmt(vL,3)}</div>
              <div className="nn-calc-h" style={{marginTop:8}}>Right (age&gt;15): {rightVals.join(", ")}, n=4</div>
              <div className="nn-calc-row">Mean_R = {fmt(mean(rightVals),3)}, Var_R = {fmt(vR,3)}</div>
              <div className="nn-calc-row">Weighted Var = (4/8)×{fmt(vL,3)} + (4/8)×{fmt(vR,3)} = <b>{fmt(wV_15,3)}</b></div>
              <div className="nn-calc-row" style={{ marginTop:8, fontSize:14, color:"var(--accent-ink)" }}>
                <b>VR = {fmt(vAll,3)} − {fmt(wV_15,3)} = {fmt(VR_15,3)}</b>
              </div>
            </div>)}
            <Note>
              A single split at age=15 reduces variance from {fmt(vAll,3)} to {fmt(wV_15,3)} —
              a reduction of {fmt(VR_15,3)} ({fmt(VR_15/vAll*100,0)}% of the original variance explained).
            </Note>
          </>
        );
      },
    },

    // ── 4. Choosing the Root Split ───────────────────────
    {
      id:"reg-root-split", group:"Math", title:"Choosing the Root Split",
      map:"Best Split",
      why:"The brute-force threshold search is at the heart of CART. Seeing every candidate's score side by side makes it clear why age=15 wins — and by how much.",
      render: () => {
        const data = DT_REG.data;
        const all  = data.map(d=>d[1]);
        const vRoot = variance(all);

        const thresholds = [6, 8, 11, 13, 15, 20, 28, 35];
        const results = thresholds.map(t => {
          const left  = data.filter(d=>d[0]<=t).map(d=>d[1]);
          const right = data.filter(d=>d[0]>t).map(d=>d[1]);
          const vL=variance(left), vR=variance(right);
          const wV=(left.length*vL+right.length*vR)/data.length;
          const vr=vRoot-wV;
          return { t, nl:left.length, nr:right.length, mL:mean(left), mR:mean(right), vL, vR, wV, vr };
        });

        const maxVR = Math.max(...results.map(r=>r.vr));
        const W=460, H=180, pL=52, pR=12, pT=20, pB=40;
        const pw=W-pL-pR, ph=H-pT-pB;
        const xi = (_,i) => pL+(i/(results.length-1))*pw;
        const yv = v => pT+ph-(v/maxVR)*ph;

        return (
          <>
            <Lead>
              The tree tries <em>every</em> possible threshold (midpoints between adjacent
              unique age values) and computes the <b>variance reduction</b> for each. The
              threshold with the <em>highest</em> variance reduction becomes the root split.
              For our 8-house dataset the winner is <b>age ≤ 15</b> with VR ≈ {fmt(maxVR,3)}.
            </Lead>
            {subhead("Variance Reduction vs threshold")}
            <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart" style={{marginBottom:14}}>
              <polyline points={results.map((r,i)=>`${xi(r,i)},${yv(r.vr)}`).join(" ")}
                fill="none" stroke="var(--accent)" strokeWidth="2"/>
              {results.map((r,i)=>(
                <g key={i}>
                  <circle cx={xi(r,i)} cy={yv(r.vr)} r={r.vr===maxVR?7:4}
                    fill={r.vr===maxVR?"var(--accent)":"var(--line)"}
                    stroke="var(--panel-solid)" strokeWidth="1.5"/>
                  {r.vr===maxVR && (
                    <text x={xi(r,i)} y={yv(r.vr)-12} textAnchor="middle"
                      fontSize="10" fontWeight="800" fill="var(--accent)">best: age={r.t}</text>
                  )}
                  <text x={xi(r,i)} y={pT+ph+14} textAnchor="middle"
                    fontSize="9" fill="var(--faint)">{r.t}</text>
                </g>
              ))}
              {[0, 0.5, 1.0, 1.5, 2.0].map(v=>(
                <g key={v}>
                  <line x1={pL-3} y1={yv(v)} x2={pL} y2={yv(v)} stroke="var(--faint)"/>
                  <text x={pL-5} y={yv(v)+4} textAnchor="end" fontSize="9" fill="var(--faint)">{v.toFixed(1)}</text>
                </g>
              ))}
              <line x1={pL} y1={pT+ph} x2={pL+pw} y2={pT+ph} stroke="var(--faint)"/>
              <line x1={pL} y1={pT}    x2={pL}     y2={pT+ph} stroke="var(--faint)"/>
              <text x={pL+pw/2} y={H-4} textAnchor="middle" className="reg-axl">age threshold</text>
              <text x="13" y={pT+ph/2} textAnchor="middle" className="reg-axl"
                transform={`rotate(-90,13,${pT+ph/2})`}>Variance Reduction</text>
            </svg>
            {subhead("All candidate thresholds")}
            <div style={{ overflowX:"auto" }}>
              <table style={{ borderCollapse:"collapse", fontSize:12, width:"100%", maxWidth:620 }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--line)" }}>
                    {["Threshold","n_L","n_R","mean_L","mean_R","Var_L","Var_R","Wt. Var","Var Red."].map(h=>(
                      <th key={h} style={{ padding:"4px 8px", textAlign:"right",
                        color:"var(--faint)", fontWeight:700, fontSize:10.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map(r=>(
                    <tr key={r.t} style={{
                      background:r.vr===maxVR?"var(--accent-soft)":"transparent",
                      borderBottom:"1px solid var(--line-soft)" }}>
                      <td style={{ padding:"3px 8px", fontFamily:"var(--num-font)",
                        fontWeight:r.vr===maxVR?800:400,
                        color:r.vr===maxVR?"var(--accent-ink)":"var(--ink)" }}>{r.t}</td>
                      <td style={{ padding:"3px 8px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{r.nl}</td>
                      <td style={{ padding:"3px 8px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{r.nr}</td>
                      <td style={{ padding:"3px 8px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{fmt(r.mL,2)}</td>
                      <td style={{ padding:"3px 8px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{fmt(r.mR,2)}</td>
                      <td style={{ padding:"3px 8px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{fmt(r.vL,3)}</td>
                      <td style={{ padding:"3px 8px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{fmt(r.vR,3)}</td>
                      <td style={{ padding:"3px 8px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{fmt(r.wV,4)}</td>
                      <td style={{ padding:"3px 8px", fontFamily:"var(--num-font)", textAlign:"right",
                        fontWeight:700, color:r.vr===maxVR?"var(--accent-ink)":"var(--ink)" }}>{fmt(r.vr,4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Note>
              age ≤ 15 wins with VR = {fmt(maxVR,3)}. Notice that age ≤ 13 and age ≤ 11 also
              score well — they isolate some new-house samples but leave more variance in the
              left child. age ≤ 15 cleanly separates the "old" group from everything else.
            </Note>
          </>
        );
      },
    },

    // ── 5. Building the Tree ─────────────────────────────
    {
      id:"reg-build", group:"Training", title:"Building the Tree Recursively",
      map:"Build Tree",
      why:"Seeing each recursive step with the actual numbers demystifies how a tree with 3 leaves emerges from 5 simple operations.",
      render: () => {
        const g_new = [8.2,7.5], g_mid = [6.8,5.7], g_old = [3.8,2.9,2.2,1.8];
        const m_new = mean(g_new), m_mid = mean(g_mid), m_old = mean(g_old);
        const v_new = variance(g_new), v_mid = variance(g_mid), v_old = variance(g_old);

        return (
          <>
            <Lead>
              After splitting the root at age=15, the <b>left child</b> has 4 houses
              (ages 5, 7, 10, 12) with prices 8.2, 7.5, 6.8, 5.7. It is still heterogeneous
              — Var = 0.90. The algorithm recurses: search all thresholds again for these
              4 samples only. The winner is <b>age ≤ 8</b> (separates the two new-build
              houses from the two 10–12-year-old houses). Both resulting leaves have only
              2 samples — small enough to stop (min_samples_leaf = 2 by default in this tree).
            </Lead>
            <Lead>
              The <b>right child</b> (age &gt; 15) has 4 houses with Var = 0.55. We could
              split further (age ≤ 28 would separate them), but with only 4 samples and
              moderate variance the tree stops here to avoid overfitting. The leaf predicts
              <b> mean(3.8, 2.9, 2.2, 1.8) = {fmt(m_old,3)}</b>.
            </Lead>
            <RegTreeDiagram showFormulas={true}/>
            {subhead("Leaf prediction calculation")}
            {card(<div className="nn-calc">
              <div className="nn-calc-h">Left-left leaf: ages 5, 7 → prices 8.2, 7.5</div>
              <div className="nn-calc-row">mean = (8.2 + 7.5) / 2 = <b>{fmt(m_new,3)}</b></div>
              <div className="nn-calc-row">variance = ({fmt((8.2-m_new)**2,3)} + {fmt((7.5-m_new)**2,3)}) / 2 = <b>{fmt(v_new,3)}</b></div>
              <div className="nn-calc-h" style={{marginTop:8}}>Left-right leaf: ages 10, 12 → prices 6.8, 5.7</div>
              <div className="nn-calc-row">mean = (6.8 + 5.7) / 2 = <b>{fmt(m_mid,3)}</b></div>
              <div className="nn-calc-row">variance = {fmt(v_mid,3)}</div>
              <div className="nn-calc-h" style={{marginTop:8}}>Right leaf: ages 20,28,35,42 → prices 3.8,2.9,2.2,1.8</div>
              <div className="nn-calc-row">mean = (3.8+2.9+2.2+1.8) / 4 = <b>{fmt(m_old,3)}</b></div>
              <div className="nn-calc-row">variance = {fmt(v_old,3)}</div>
            </div>)}
            {subhead("Build steps")}
            <div style={{ display:"flex", flexDirection:"column", gap:8, maxWidth:600 }}>
              {[
                ["Step 1","Root (n=8)","All prices: 8.2 → 1.8, Var=5.20","Best split: age ≤ 15, VR=2.06"],
                ["Step 2","Left (n=4, age≤15)","Prices: 8.2,7.5,6.8,5.7, Var=0.90","Best split: age ≤ 8, VR=0.57"],
                ["Step 3","Left-Left (n=2, age≤8)","Prices: 8.2,7.5, Var=0.12","min_samples reached → leaf, predict 7.85"],
                ["Step 4","Left-Right (n=2, 8<age≤15)","Prices: 6.8,5.7, Var=0.30","min_samples reached → leaf, predict 6.25"],
                ["Step 5","Right (n=4, age>15)","Prices: 3.8,2.9,2.2,1.8, Var=0.55","stopping criteria → leaf, predict 2.675"],
              ].map(([step,node,data,action])=>(
                <div key={step} style={{ display:"flex", gap:12, padding:"10px 14px",
                  background:"var(--line-soft)", borderRadius:10, alignItems:"flex-start" }}>
                  <span style={{ background:"var(--accent)", color:"#fff", borderRadius:6,
                    padding:"2px 8px", fontSize:11, fontWeight:800, flexShrink:0 }}>{step}</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:"var(--ink)" }}>{node}: <span style={{fontFamily:"var(--num-font)"}}>{data}</span></div>
                    <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{action}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      },
    },

    // ── 6. The Full Tree ─────────────────────────────────
    {
      id:"reg-full-tree", group:"Training", title:"The Full Regression Tree",
      map:"Full Tree",
      why:"The annotated full tree with sample counts, means, and variances at every node tells the complete story of what the model learned.",
      render: () => (
        <>
          <Lead>
            Our final regression tree has <b>2 internal nodes</b> and <b>3 leaf nodes</b>.
            Each internal node shows: the feature tested, the threshold, the sample count,
            and the variance before splitting. Each leaf shows: the predicted value (mean
            of training targets), the sample count, and the residual variance after prediction.
          </Lead>
          <RegTreeDiagram showFormulas={true}/>
          {subhead("What each node tells us")}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {[
              { c:LC[0], t:"Root: age ≤ 15?", b:"n=8, Var=5.20 — the largest impurity; this is where training starts. Splitting here explains 2.06/5.20 = 40% of the variance." },
              { c:LC[1], t:"Left: age ≤ 8?", b:"n=4, Var=0.90 — the 4 younger houses. Still heterogeneous. One more split needed." },
              { c:LC[2], t:"Right leaf: predict 2.675", b:"n=4, Var=0.55. Old houses (age>15). Mean price = $267.5k. All 4 training old-house prices averaged." },
              { c:LC[0], t:"LL leaf: predict 7.85", b:"n=2, Var=0.12. Newest houses (age≤8). Mean = $785k. Very low variance — confident prediction." },
              { c:LC[1], t:"LR leaf: predict 6.25", b:"n=2, Var=0.30. Mid-age houses (8<age≤15). Mean = $625k." },
            ].map(({c,t,b})=>(
              <div key={t} style={{ flex:"1 1 200px", padding:"10px 14px", borderRadius:10,
                background:"var(--line-soft)", borderLeft:`3px solid ${c}` }}>
                <div style={{ fontWeight:700, fontSize:12.5, color:"var(--ink)" }}>{t}</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>{b}</div>
              </div>
            ))}
          </div>
          <Note>
            The tree only predicts 3 distinct values: 7.85, 6.25, or 2.675. Any house — no
            matter what its exact age — maps to one of these three step levels. For finer
            predictions, add more splits (deeper tree) or use an ensemble.
          </Note>
        </>
      ),
    },

    // ── 6b. Regression Tree Build Animation ──────────────
    {
      id:"tree-animation", group:"Training", title:"Watch the Regression Tree Build",
      map:"Tree Animation",
      why:"Seeing the regression tree grow level-by-level, with variance values decreasing at each split, makes the variance-reduction criterion concrete and memorable.",
      render: () => (
        <>
          <Lead>
            Watch the regression tree grow <b>level by level</b>, with each split revealing
            how variance is reduced step by step. Leaf nodes display their <b>PREDICT</b>
            badge showing the mean house price. Use Play, Pause, Reset, or the phase
            buttons to control the animation.
          </Lead>
          <RegTreeBuildAnim/>
        </>
      ),
    },

    // ── 7. Step Function Predictions ────────────────────
    {
      id:"reg-stepfn", group:"Inference", title:"Step Function Predictions",
      map:"Step Function",
      why:"The piecewise-constant nature of regression trees is simultaneously their greatest strength (non-linear, no distribution assumptions) and their greatest weakness (can't interpolate smoothly between points). Seeing this visually makes the tradeoff concrete.",
      render: (trace) => {
        const stepFn = age => age<=8?7.85:age<=15?6.25:2.675;
        const {predict} = trace;

        return (
          <>
            <Lead>
              Unlike linear regression (a single diagonal line), a regression tree produces a
              <b> piecewise-constant step function</b>. Every input in a leaf region gets the
              <em> exact same prediction</em> — the leaf mean. The chart below shows the three
              horizontal step segments in colour, the training data as dots, and your ★ query
              point (move the age slider to see it jump between steps).
            </Lead>
            <Lead>
              Notice the <b>jumps at age=8 and age=15</b>: a house aged 14.9 gets prediction
              6.25 while a house aged 15.1 gets 2.675 — a difference of $357.5k for just 0.2
              years. Real house prices do not behave this way. This is the step-function
              limitation: predictions are <b>discontinuous</b> at split boundaries. Deeper
              trees add more steps to smooth this out, but at the cost of overfitting.
            </Lead>
            <RegScatter input={trace.input} showStep={true} showResidual={true}/>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:12 }}>
              {[
                ["Step region","age ≤ 8 → $785k · 8<age≤15 → $625k · age>15 → $268k","var(--ink)"],
                ["Your prediction", `age=${trace.input.age} yr → $${fmt(predict,2)} × 100k = $${fmt(predict*100,0)}k`, "var(--accent-ink)"],
              ].map(([lbl,val,c])=>(
                <div key={lbl} style={{ flex:"1 1 200px", padding:"10px 16px", borderRadius:10,
                  background:"var(--line-soft)", border:"1px solid var(--line)" }}>
                  <div style={{ fontSize:11, color:"var(--faint)", fontWeight:700 }}>{lbl}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:c, marginTop:4 }}>{val}</div>
                </div>
              ))}
            </div>
            {subhead("Step function vs linear regression")}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <div style={{ flex:"1 1 210px", padding:"12px 16px", borderRadius:10,
                background:LBG[1], border:`2px solid ${LC[1]}` }}>
                <div style={{ fontWeight:700, fontSize:13, color:LC[1] }}>Decision Tree (step function)</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>
                  Can model the natural price tiers. No assumption of linearity.
                  Can't smooth between age 14 and 16. Doesn't extrapolate beyond
                  training age range.
                </div>
              </div>
              <div style={{ flex:"1 1 210px", padding:"12px 16px", borderRadius:10,
                background:"var(--line-soft)", border:"1px solid var(--line)" }}>
                <div style={{ fontWeight:700, fontSize:13, color:"var(--ink)" }}>Linear Regression (straight line)</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>
                  Forces a single slope. Underfits the tier structure. But
                  extrapolates smoothly and generalises well if the true relationship
                  really is linear.
                </div>
              </div>
            </div>
          </>
        );
      },
    },

    // ── 8. Prediction Path ───────────────────────────────
    {
      id:"reg-predict", group:"Inference", title:"Prediction Path — Interactive",
      map:"Predict Path",
      why:"Tracing the exact path through the tree for any input shows that every regression tree prediction is fully explainable — something linear regression cannot offer for non-linear data.",
      render: (trace) => {
        const { path, predict } = trace;
        const edges = buildEdges(path);
        return (
          <>
            <Lead>
              Age = <b>{trace.input.age}</b> years. Follow the highlighted path below. The
              tree routes this house to a leaf and returns the leaf mean as the predicted price.
              Move the age slider to watch the path change in real time.
            </Lead>
            <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"flex-start" }}>
              <RegTreeDiagram highlightPath={edges} showFormulas={true}/>
              <div style={{ maxWidth:270 }}>
                {subhead("Decision trace")}
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {path.map((step,i)=>{
                    if (step.leaf) return (
                      <div key={i} style={{ padding:"10px 14px", borderRadius:10,
                        background:"var(--accent-soft)", border:"2px solid var(--accent)" }}>
                        <div style={{ fontWeight:800, fontSize:13, color:"var(--accent-ink)" }}>Leaf reached</div>
                        <div style={{ fontSize:12, color:"var(--ink)", marginTop:4 }}>
                          Predict: <b>${fmt(step.node.predict,2)} × 100k</b>
                        </div>
                        <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                          Based on {step.node.samples ? step.node.samples.length : 2}–4 training houses
                        </div>
                      </div>
                    );
                    return (
                      <div key={i} style={{ padding:"10px 14px", borderRadius:10,
                        background:"var(--line-soft)", border:"1px solid var(--line)" }}>
                        <div style={{ fontWeight:700, fontSize:12, color:"var(--ink)" }}>
                          Q{i+1}: age ≤ {step.node.threshold}?
                        </div>
                        <div style={{ fontSize:12, color:"var(--muted)", marginTop:3 }}>
                          age = <b>{step.val}</b> →{" "}
                          <b style={{color:step.goLeft?"#1f9e6b":"#e0492e"}}>
                            {step.goLeft?"YES → go left":"NO → go right"}
                          </b>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:14, padding:"14px 18px", borderRadius:12,
                  background:"var(--accent-soft)", border:"2px solid var(--accent)" }}>
                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:4, fontWeight:700 }}>PREDICTED PRICE</div>
                  <div style={{ fontSize:22, fontWeight:900, color:"var(--accent-ink)" }}>
                    ${fmt(predict,2)} × $100k
                  </div>
                  <div style={{ fontSize:13, color:"var(--muted)", marginTop:4 }}>
                    = <b>${fmt(predict*100,0)}k</b>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      },
    },

    // ── 9. Missing Values & Outliers ────────────────────
    {
      id:"reg-missing", group:"Robustness", title:"Missing Values & Outliers",
      map:"Robustness",
      why:"For regression trees, outliers in the TARGET (price) are more dangerous than in the features — they can dominate a leaf mean. Understanding this helps in feature engineering and preprocessing.",
      render: () => (
        <>
          <Lead>
            <b>Missing feature values</b> in regression trees are handled identically to
            classification: surrogate splits (fallback to a correlated feature), majority
            routing (go the direction that received more training samples), or pre-imputation
            (fill with column mean). For our single-feature dataset, impute age with the
            training mean (≈ 19.9 years) before routing.
          </Lead>
          <Lead>
            <b>Outliers in input features</b>: trees are robust. An outlier at age=200 simply
            creates a new split region ("age > 100 → isolated leaf") without disturbing the
            rest of the tree. The remaining 7 houses are completely unaffected.
          </Lead>
          <Lead>
            <b>Outliers in the target (price)</b>: this is more dangerous. Suppose one house
            has an erroneous price of $5000k. If it ends up in a leaf with only 2 samples, the
            leaf mean becomes (7.5 + 5000) / 2 = $2503.75k — wildly wrong for any new house
            landing in that leaf. The solution is either <b>outlier removal</b> before training
            or <b>using median instead of mean</b> in leaves (sklearn supports this via the
            <code> absolute_error</code> criterion, which also uses the median for leaf prediction
            and is more robust to outliers).
          </Lead>
          {subhead("Comparing leaf-prediction criteria")}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {[
              { c:LC[0], t:"squared_error (default)", b:"Leaf predicts mean. Minimises MSE. Sensitive to outliers — one extreme value pulls the mean." },
              { c:LC[1], t:"absolute_error", b:"Leaf predicts median. Minimises MAE. Robust to outliers in target. Slower to fit (requires sorting)." },
              { c:LC[2], t:"poisson", b:"For count/rate targets. Leaf predicts mean but the split criterion is Poisson deviance. Good for non-negative targets." },
            ].map(({c,t,b})=>(
              <div key={t} style={{ flex:"1 1 190px", padding:"12px 14px", borderRadius:10,
                background:"var(--line-soft)", borderLeft:`3px solid ${c}` }}>
                <div style={{ fontWeight:700, fontSize:12.5, color:c }}>{t}</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:5 }}>{b}</div>
              </div>
            ))}
          </div>
          {subhead("Outlier example")}
          {card(<div className="nn-calc">
            <div className="nn-calc-h">Normal leaf (age≤8): prices = [8.2, 7.5]</div>
            <div className="nn-calc-row">Mean = 7.85, Var = 0.12 ← reliable prediction</div>
            <div className="nn-calc-h" style={{marginTop:8}}>Corrupted leaf: prices = [8.2, 7.5] → outlier replaces 7.5 with 50.0</div>
            <div className="nn-calc-row">Mean = (8.2 + 50.0) / 2 = <span style={{color:"#e0492e"}}>29.1</span> ← completely wrong!</div>
            <div className="nn-calc-row">Median = 8.2 ← robust (absolute_error criterion would give this)</div>
          </div>)}
        </>
      ),
    },

    // ── 10. Evaluation & When to Use ────────────────────
    {
      id:"reg-eval", group:"Insights", title:"Evaluation & When to Use",
      map:"Evaluation",
      why:"Knowing which metrics to use and when a regression tree is the right tool rounds out a practitioner's understanding of the model.",
      render: () => {
        const depths=[1,2,3,4,5,6];
        const trainMSE=[1.8, 0.32, 0.08, 0.01, 0.001, 0.000];
        const valMSE  =[1.9, 0.55, 0.58, 0.72, 0.90,  1.15];
        const W=420, H=190, pL=52, pR=14, pT=20, pB=40;
        const pw=W-pL-pR, ph=H-pT-pB;
        const xi=i=>pL+(i/(depths.length-1))*pw;
        const yv=v=>pT+ph-Math.min((v/2)*ph,ph);

        return (
          <>
            <Lead>
              Three standard regression metrics: <b>MSE</b> (mean squared error) penalises
              large errors heavily; <b>MAE</b> (mean absolute error) is more interpretable and
              robust; <b>R²</b> (coefficient of determination) measures the fraction of variance
              explained (1 = perfect, 0 = predicts mean, negative = worse than mean). For our
              depth-2 tree on 8 houses, R² ≈ 0.89 — the tree explains 89% of the price
              variance using just 2 splits.
            </Lead>
            {subhead("Bias-variance tradeoff by depth")}
            <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart" style={{marginBottom:16}}>
              <polyline points={trainMSE.map((v,i)=>`${xi(i)},${yv(v)}`).join(" ")}
                fill="none" stroke="var(--accent)" strokeWidth="2"/>
              <polyline points={valMSE.map((v,i)=>`${xi(i)},${yv(v)}`).join(" ")}
                fill="none" stroke="#e0492e" strokeWidth="2" strokeDasharray="6 3"/>
              {trainMSE.map((v,i)=><circle key={i} cx={xi(i)} cy={yv(v)} r="4"
                fill="var(--accent)" stroke="var(--panel-solid)" strokeWidth="1.5"/>)}
              {valMSE.map((v,i)=><circle key={i} cx={xi(i)} cy={yv(v)} r="4"
                fill="#e0492e" stroke="var(--panel-solid)" strokeWidth="1.5"/>)}
              <line x1={xi(1)} y1={pT} x2={xi(1)} y2={pT+ph}
                stroke="#1f9e6b" strokeWidth="1.5" strokeDasharray="4 2"/>
              <text x={xi(1)+5} y={pT+14} fontSize="9.5" fill="#1f9e6b" fontWeight="700">sweet spot (depth=2)</text>
              <line x1={pL} y1={pT+ph} x2={pL+pw} y2={pT+ph} stroke="var(--faint)"/>
              <line x1={pL} y1={pT}    x2={pL}     y2={pT+ph} stroke="var(--faint)"/>
              {depths.map((d,i)=><text key={d} x={xi(i)} y={pT+ph+14} textAnchor="middle"
                fontSize="9" fill="var(--faint)">{d}</text>)}
              {[0,0.5,1.0,1.5,2.0].map(v=><text key={v} x={pL-5} y={yv(v)+4}
                textAnchor="end" fontSize="9" fill="var(--faint)">{v}</text>)}
              <text x={pL+pw/2} y={H-4} textAnchor="middle" className="reg-axl">max_depth</text>
              <text x="13" y={pT+ph/2} textAnchor="middle" className="reg-axl"
                transform={`rotate(-90,13,${pT+ph/2})`}>MSE</text>
              <rect x={pL+pw-80} y={pT+6} width="8" height="3" fill="var(--accent)"/>
              <text x={pL+pw-68} y={pT+10} fontSize="9" fill="var(--muted)">train MSE</text>
              <rect x={pL+pw-80} y={pT+20} width="8" height="3" fill="#e0492e"/>
              <text x={pL+pw-68} y={pT+24} fontSize="9" fill="var(--muted)">val MSE</text>
            </svg>
            <div className="tf-lifecycle">
              <div className="tf-life tf-life--train">
                <div className="tf-life-h"><span>B</span><span>High Bias (shallow)</span></div>
                <p>Step function too coarse. Large regions average very different prices. Prediction error is systematic and large.</p>
              </div>
              <div className="tf-life tf-life--infer">
                <div className="tf-life-h"><span>V</span><span>High Variance (deep)</span></div>
                <p>Each leaf holds one training sample. Training MSE → 0 but val MSE explodes. Any new house lands in the wrong nano-region.</p>
              </div>
            </div>
            {subhead("When to use a decision tree for regression")}
            <div className="opt-pc">
              <div className="opt-pc-col is-pro">
                <div className="opt-pc-h">Use decision tree regression when</div>
                <ul>
                  <li>Data has threshold-based, non-linear structure (price tiers, dosage effects)</li>
                  <li>Need an interpretable, auditable prediction path</li>
                  <li>Features are mixed numeric + categorical</li>
                  <li>No assumption of monotonicity or linearity</li>
                  <li>Building an ensemble (Random Forest, Gradient Boosting)</li>
                </ul>
              </div>
              <div className="opt-pc-col is-con">
                <div className="opt-pc-h">Prefer another model when</div>
                <ul>
                  <li>True relationship is smooth and linear → linear regression</li>
                  <li>Need smooth interpolation between points</li>
                  <li>Data is small and noisy → tree overfits easily</li>
                  <li>Need to extrapolate beyond training range → trees can't</li>
                </ul>
              </div>
            </div>
            <Note>
              In practice, <b>single regression trees are a foundation, not a final model</b>.
              Random Forests average hundreds of trees to reduce variance. Gradient Boosting
              adds trees one by one to reduce bias. Both consistently outperform single trees
              on real-world benchmarks.
            </Note>
          </>
        );
      },
    },
    {
      id: "hyperparams",
      group: "Practical",
      title: "Hyperparameters & when to use",
      map: "Hyperparams",
      why: "The max_depth hyperparameter is the single most important control lever — it directly determines the bias-variance trade-off.",
      render: () => (
        <>
          <Lead>A decision tree regressor has no learning rate — it fits the training data exactly unless you constrain it. The art is knowing how deep to let it grow. Unconstrained trees always overfit. Regularization is done through structural constraints: max_depth, min_samples_leaf, min_samples_split.</Lead>
          <Note><b>Key insight:</b> A single decision tree is rarely used in production. It's most valuable as the building block inside Random Forest (bagging) and Gradient Boosting (boosting). Understanding its hyperparameters here means you understand every ensemble too.</Note>
          <div className="tf-subhead">Key hyperparameters</div>
          <div className="tf-legend">
            {[
              ["max_depth", "Max tree depth", "Default None (grows until leaves are pure). For regression: start with 3–6. Shallow = high bias, low variance (underfits). Deep = low bias, high variance (overfits). Tune with cross-validation."],
              ["min_samples_split", "Min samples to split a node", "Default 2. Increase to 10–50 on noisy data to stop the tree from fitting noise. Higher = shallower tree = more regularization."],
              ["min_samples_leaf", "Min samples per leaf", "Default 1. The most robust regularizer. Set to 5–20 to ensure every leaf represents enough data. More effective than max_depth alone."],
              ["max_features", "Features considered per split", "Default None (all features). Set to 'sqrt' or 'log2' to add randomness — this is what Random Forest does. Rarely changed for single trees."],
              ["criterion", "Split quality measure", "'squared_error' (default, minimizes MSE) or 'friedman_mse' (weighted improvement — faster). Use squared_error unless performance is a concern."],
              ["splitter", "Split strategy at each node", "'best' (default, find global best split). 'random' for faster training on large datasets — useful in Random Forest trees."],
              ["ccp_alpha", "Cost-complexity pruning", "Default 0 (no pruning). Set > 0 to post-prune: removes branches whose removal costs less than alpha in accuracy. Use cross-validation to find the best alpha."],
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
                "Fully interpretable (you can print and read the tree)",
                "Handles mixed types and missing values (with preprocessing)",
                "No feature scaling needed",
                "Fast training",
                "Non-parametric (no distribution assumptions)",
              ].map((t, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>✓ {t}</div>)}
            </div>
            <div className="opt-pc-col is-con">
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#c62828" }}>Limitations</div>
              {[
                "High variance (small data change → very different tree)",
                "Overfits easily without constraints",
                "Cannot extrapolate beyond training range (predicts a constant outside range)",
                "Unstable (different random seeds → different trees)",
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
                  ["Need full interpretability (each decision must be explainable)", "Single Decision Tree (depth 3–5)", "Print the tree, share it in a PowerPoint"],
                  ["Best predictive accuracy", "Gradient Boosting / XGBoost", "Sequential boosting consistently outperforms single trees"],
                  ["Robust baseline, no tuning", "Random Forest", "Bagging of trees has much lower variance"],
                  ["Target has outliers", "Decision Tree or MAE-loss GBM", "Trees are robust to outliers in features; use MAE for outliers in target"],
                  ["Need to extrapolate beyond training range", "Linear Regression", "Trees can only predict values seen in training data"],
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

  // ── Input controls ──
  function renderInput(input, setInput) {
    return (
      <label className="nn-slider">
        <span className="nn-slider-l">age</span>
        <input type="range" min="1" max="45" step="1"
          value={input.age}
          onChange={e=>setInput({ age:parseInt(e.target.value) })}/>
        <span className="nn-slider-v">{input.age} yr</span>
      </label>
    );
  }

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title:    "Decision Tree",
    subtitle: "Regression · House Prices",
    cur:      "Decision Tree",
    category: "ML Algorithms",
    run:       runDTreeReg,
    default:   DT_REG.default,
    renderInput,
    modeLinks: [
      { label:"Classification", href:"Decision Tree (Classification).html", active: false },
      { label:"Regression",     href:"Decision Tree (Regression).html",     active: true  },
    ],
  };
})();
