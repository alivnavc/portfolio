/* Decision Tree — Classification stages  (complete rewrite) */
(function () {
  const { Matrix, V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  const { DT_CLS, runDTreeCls, gini } = window.ML_DTREE;

  // ── Color palette ──
  const CC  = ["#2B5BFF", "#1f9e6b", "#e0492e"];
  const CBG = ["rgba(43,91,255,.13)", "rgba(31,158,107,.13)", "rgba(224,73,46,.13)"];
  const CN  = ["Setosa", "Versicolor", "Virginica"];

  // ── Shared layout helpers ──
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

  // ════════════════════════════════════════════
  // SVG TREE DIAGRAM
  // ════════════════════════════════════════════
  function TreeDiagram({ highlightPath, showCounts, showGini }) {
    const NW = 136, NH = 56;
    const LW = 104, LH = 50;
    const nodes = {
      root:  { x:250, y:58,   label:"petal_len ≤ 2.5", gini:"0.665", samples:12, internal:true },
      left:  { x:100, y:170,  label:"Setosa",           gini:"0.000", samples:4,  leaf:true, cls:0 },
      right: { x:370, y:170,  label:"petal_wid ≤ 1.8",  gini:"0.500", samples:8,  internal:true },
      rl:    { x:280, y:282,  label:"Versicolor",        gini:"0.000", samples:4,  leaf:true, cls:1 },
      rr:    { x:460, y:282,  label:"Virginica",         gini:"0.000", samples:4,  leaf:true, cls:2 },
    };

    const isActive = (id) => {
      if (!highlightPath) return false;
      return highlightPath.some(e => e.to === id || (id === "root" && e.from === "root"));
    };
    const edgeActive = (f, t) => {
      if (!highlightPath) return false;
      return highlightPath.some(e => e.from === f && e.to === t);
    };

    function NBox({ id, n }) {
      const act  = isActive(id);
      const isL  = !!n.leaf;
      const w    = isL ? LW : NW;
      const h    = showCounts ? (isL ? LH+2 : NH+2) : (isL ? LH-10 : NH-10);
      const fill = isL ? CBG[n.cls] : "var(--panel-solid)";
      const stk  = act ? "var(--accent)" : (isL ? CC[n.cls] : "var(--line)");
      const cy   = showGini ? n.y : n.y;
      const lineY = showCounts && showGini ? cy - 10 : cy;
      return (
        <g>
          {act && <rect x={n.x-w/2-4} y={n.y-h/2-4} width={w+8} height={h+8} rx="11"
            fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 2" opacity="0.6"/>}
          <rect x={n.x-w/2} y={n.y-h/2} width={w} height={h} rx="8"
            fill={fill} stroke={stk} strokeWidth={act?2.5:1.5}/>
          <text x={n.x} y={lineY - (showCounts||showGini ? 6 : -4)}
            textAnchor="middle" fontSize="11" fontWeight="700"
            fill={isL ? CC[n.cls] : "var(--ink)"}>{n.label}</text>
          {showCounts && <text x={n.x} y={lineY+8} textAnchor="middle"
            fontSize="10" fill="var(--muted)">n = {n.samples}</text>}
          {showGini && <text x={n.x} y={lineY+(showCounts?22:10)} textAnchor="middle"
            fontSize="9.5" fill="var(--faint)">gini = {n.gini}</text>}
        </g>
      );
    }

    function Edge({ f, t, lbl, side }) {
      const a = nodes[f], b = nodes[t];
      const act = edgeActive(f, t);
      const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
      const lx = side === "left" ? mx-20 : mx+20;
      return (
        <g>
          <line x1={a.x} y1={a.y+22} x2={b.x} y2={b.y-22}
            stroke={act?"var(--accent)":"var(--line)"} strokeWidth={act?2.5:1.5}/>
          <text x={lx} y={my+2} textAnchor="middle" fontSize="10" fontWeight="700"
            fill={act?"var(--accent)":"var(--faint)"}>{lbl}</text>
        </g>
      );
    }

    const svgH = showGini&&showCounts ? 346 : 320;
    return (
      <svg viewBox={`0 0 560 ${svgH}`} style={{ width:"100%", maxWidth:560, height:"auto",
        border:"1px solid var(--line)", borderRadius:14, background:"var(--panel-solid)",
        boxShadow:"var(--shadow)", display:"block" }}>
        <Edge f="root" t="left"  lbl="YES (≤)" side="left"/>
        <Edge f="root" t="right" lbl="NO (>)"  side="right"/>
        <Edge f="right" t="rl"  lbl="YES (≤)" side="left"/>
        <Edge f="right" t="rr"  lbl="NO (>)"  side="right"/>
        <NBox id="root"  n={nodes.root}/>
        <NBox id="left"  n={nodes.left}/>
        <NBox id="right" n={nodes.right}/>
        <NBox id="rl"    n={nodes.rl}/>
        <NBox id="rr"    n={nodes.rr}/>
        {CN.map((c,i) => (
          <g key={i} transform={`translate(${18+i*168}, ${svgH-22})`}>
            <rect width="10" height="10" rx="3" fill={CC[i]}/>
            <text x="14" y="9" fontSize="10" fill="var(--muted)">{c}</text>
          </g>
        ))}
      </svg>
    );
  }

  // ════════════════════════════════════════════
  // SCATTER PLOT
  // ════════════════════════════════════════════
  function Scatter({ input, showBoundaries }) {
    const W=440, H=290, pad={l:50,r:20,t:20,b:42};
    const pw=W-pad.l-pad.r, ph=H-pad.t-pad.b;
    const sx = v => pad.l+((v-0)/(7.5-0))*pw;
    const sy = v => pad.t+ph-((v-0)/(3-0))*ph;
    const bx = sx(2.5), ly = sy(1.8);
    const qx = input?.petal_len ?? null, qy = input?.petal_wid ?? null;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart">
        {showBoundaries && <>
          <rect x={pad.l} y={pad.t} width={bx-pad.l} height={ph} fill={CBG[0]}/>
          <rect x={bx} y={ly} width={pad.l+pw-bx} height={pad.t+ph-ly} fill={CBG[1]}/>
          <rect x={bx} y={pad.t} width={pad.l+pw-bx} height={ly-pad.t} fill={CBG[2]}/>
          <line x1={bx} y1={pad.t} x2={bx} y2={pad.t+ph} stroke={CC[0]} strokeWidth="2" strokeDasharray="6 3"/>
          <line x1={bx} y1={ly} x2={pad.l+pw} y2={ly} stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 3"/>
          <text x={(pad.l+bx)/2} y={pad.t+ph/2} textAnchor="middle" fontSize="11" fontWeight="700" fill={CC[0]} opacity="0.75">Setosa</text>
          <text x={(bx+pad.l+pw)/2} y={(ly+pad.t+ph)/2} textAnchor="middle" fontSize="11" fontWeight="700" fill={CC[1]} opacity="0.75">Versicolor</text>
          <text x={(bx+pad.l+pw)/2} y={(pad.t+ly)/2} textAnchor="middle" fontSize="11" fontWeight="700" fill={CC[2]} opacity="0.75">Virginica</text>
          <text x={bx+4} y={pad.t+13} fontSize="9" fill={CC[0]} fontWeight="700">petal_len=2.5</text>
          <text x={bx+4} y={ly-4}     fontSize="9" fill="var(--accent)" fontWeight="700">petal_wid=1.8</text>
        </>}
        {!showBoundaries && [1,2,3,4,5,6,7].map(v=>(
          <line key={v} x1={sx(v)} y1={pad.t} x2={sx(v)} y2={pad.t+ph} stroke="var(--line)" strokeWidth="1"/>
        ))}
        {!showBoundaries && [0.5,1,1.5,2,2.5].map(v=>(
          <line key={v} x1={pad.l} y1={sy(v)} x2={pad.l+pw} y2={sy(v)} stroke="var(--line)" strokeWidth="1"/>
        ))}
        {DT_CLS.data.map((d,i)=>(
          <circle key={i} cx={sx(d[0])} cy={sy(d[1])} r="5.5"
            fill={CC[d[2]]} opacity="0.88" stroke="var(--panel-solid)" strokeWidth="1.5"/>
        ))}
        {qx!==null && (
          <text x={sx(qx)} y={sy(qy)+5} textAnchor="middle" fontSize="14" fontWeight="900"
            fill="var(--accent)" stroke="white" strokeWidth="3" paintOrder="stroke">★</text>
        )}
        <line x1={pad.l} y1={pad.t+ph} x2={pad.l+pw} y2={pad.t+ph} stroke="var(--faint)"/>
        <line x1={pad.l} y1={pad.t}    x2={pad.l}     y2={pad.t+ph} stroke="var(--faint)"/>
        <text x={pad.l+pw/2} y={H-5} textAnchor="middle" className="reg-axl">petal_len (cm)</text>
        <text x="12" y={pad.t+ph/2} textAnchor="middle" className="reg-axl"
          transform={`rotate(-90,12,${pad.t+ph/2})`}>petal_wid (cm)</text>
        {[1,2,3,4,5,6,7].map(v=>(
          <text key={v} x={sx(v)} y={pad.t+ph+15} textAnchor="middle" className="reg-axl">{v}</text>
        ))}
        {[0,1,2,3].map(v=>(
          <text key={v} x={pad.l-6} y={sy(v)+4} textAnchor="end" className="reg-axl">{v}</text>
        ))}
      </svg>
    );
  }

  // ════════════════════════════════════════════
  // IMPURITY VISUAL (3 boxes)
  // ════════════════════════════════════════════
  function ImpurityBoxes() {
    const configs = [
      { label:"Pure node", counts:[6,0,0], note:"All Setosa — Gini = 0", good:true },
      { label:"Mixed node", counts:[2,2,2], note:"Equal 3-class mix — Gini = 0.667", good:false },
      { label:"Mostly pure", counts:[4,1,1], note:"Mostly Setosa — Gini = 0.389", good:null },
    ];
    return (
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        {configs.map(({label, counts, note, good}) => {
          const total = counts.reduce((a,b)=>a+b,0);
          const g = gini(counts);
          const border = good===true ? "#1f9e6b" : good===false ? "#e0492e" : "var(--accent)";
          return (
            <div key={label} style={{ flex:"1 1 160px", border:`2px solid ${border}`,
              borderRadius:12, padding:"12px 14px", background:"var(--panel-solid)" }}>
              <div style={{ fontWeight:700, fontSize:13, color:"var(--ink)", marginBottom:8 }}>{label}</div>
              <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                {counts.map((c,ci)=>
                  Array.from({length:c}).map((_,j)=>(
                    <div key={`${ci}-${j}`} style={{ width:14, height:14, borderRadius:3,
                      background:CC[ci], opacity:0.9 }}/>
                  ))
                )}
              </div>
              <div style={{ fontSize:11, color:"var(--muted)", marginBottom:4 }}>{note}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ flex:1, height:10, background:"var(--line-soft)", borderRadius:5, overflow:"hidden" }}>
                  <div style={{ width:`${g*100/0.667*100}%`, height:"100%",
                    background:`linear-gradient(90deg, ${border}, var(--neon))`, borderRadius:5 }}/>
                </div>
                <span style={{ fontFamily:"var(--num-font)", fontSize:12, fontWeight:800,
                  color:border, width:40 }}>{fmt(g,3)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ════════════════════════════════════════════
  // GINI BAR
  // ════════════════════════════════════════════
  function GiniBar({ counts, label }) {
    const g = gini(counts);
    const n = counts.reduce((a,b)=>a+b,0);
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"5px 0" }}>
        <span style={{ width:130, fontSize:12, color:"var(--muted)", textAlign:"right", flexShrink:0 }}>{label}</span>
        <div style={{ flex:1, height:18, background:"var(--line-soft)", borderRadius:6, overflow:"hidden", maxWidth:180 }}>
          <div style={{ width:`${Math.min(g/0.667*100,100)}%`, height:"100%",
            background:"linear-gradient(90deg,var(--accent),var(--neon))", borderRadius:6 }}/>
        </div>
        <span style={{ fontFamily:"var(--num-font)", fontSize:12, fontWeight:800,
          color:"var(--accent-ink)", width:44 }}>{fmt(g,3)}</span>
        <span style={{ fontSize:11, color:"var(--faint)" }}>[{counts.join(",")}] n={n}</span>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // ENTROPY BAR
  // ════════════════════════════════════════════
  function entropy(counts) {
    const n = counts.reduce((a,b)=>a+b,0);
    if (n===0) return 0;
    return -counts.reduce((s,c)=>{
      if(c===0) return s;
      const p=c/n;
      return s+p*Math.log2(p);
    },0);
  }

  function EntropyBar({ counts, label }) {
    const h = entropy(counts);
    const n = counts.reduce((a,b)=>a+b,0);
    const maxH = Math.log2(3); // 1.585 for 3 classes
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"5px 0" }}>
        <span style={{ width:130, fontSize:12, color:"var(--muted)", textAlign:"right", flexShrink:0 }}>{label}</span>
        <div style={{ flex:1, height:18, background:"var(--line-soft)", borderRadius:6, overflow:"hidden", maxWidth:180 }}>
          <div style={{ width:`${Math.min(h/maxH*100,100)}%`, height:"100%",
            background:"linear-gradient(90deg,#e0492e,var(--neon))", borderRadius:6 }}/>
        </div>
        <span style={{ fontFamily:"var(--num-font)", fontSize:12, fontWeight:800,
          color:"#e0492e", width:44 }}>{fmt(h,3)}</span>
        <span style={{ fontSize:11, color:"var(--faint)" }}>[{counts.join(",")}] n={n}</span>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // TREE BUILD ANIMATION — Classification
  // ════════════════════════════════════════════
  const CLS_ANIM_NODES = [
    { id:"root",  revealPhase:0, x:350, y:80,  w:130, h:72, label:"petal_len ≤ 2.45", gini:"0.665", badge:"ROOT",  badgeColor:"#2B5BFF", fill:"rgba(43,91,255,.12)",  stroke:"#2B5BFF", textColor:"#2B5BFF", dots:[4,4,4], isLeaf:false },
    { id:"left",  revealPhase:1, x:150, y:220, w:118, h:72, label:"Leaf: Setosa",      gini:"0.000", badge:"LEAF",  badgeColor:"#2B5BFF", fill:"rgba(43,91,255,.20)",  stroke:"#2B5BFF", textColor:"#2B5BFF", dots:[4,0,0], isLeaf:true  },
    { id:"right", revealPhase:1, x:550, y:220, w:130, h:72, label:"petal_wid ≤ 1.75",  gini:"0.500", badge:"SPLIT", badgeColor:"#7c3aed", fill:"rgba(124,58,237,.10)", stroke:"#7c3aed", textColor:"#7c3aed", dots:[0,4,4], isLeaf:false },
    { id:"rl",    revealPhase:2, x:420, y:360, w:118, h:72, label:"Leaf: Versicolor",  gini:"0.000", badge:"LEAF",  badgeColor:"#1f9e6b", fill:"rgba(31,158,107,.20)",  stroke:"#1f9e6b", textColor:"#1f9e6b", dots:[0,4,0], isLeaf:true  },
    { id:"rr",    revealPhase:2, x:680, y:360, w:118, h:72, label:"Leaf: Virginica",   gini:"0.000", badge:"LEAF",  badgeColor:"#e0492e", fill:"rgba(224,73,46,.20)",   stroke:"#e0492e", textColor:"#e0492e", dots:[0,0,4], isLeaf:true  },
  ];
  const CLS_ANIM_EDGES = [
    { from:"root", to:"left",  revealPhase:1, side:"left",  labelYes:true  },
    { from:"root", to:"right", revealPhase:1, side:"right", labelYes:false },
    { from:"right", to:"rl",   revealPhase:2, side:"left",  labelYes:true  },
    { from:"right", to:"rr",   revealPhase:2, side:"right", labelYes:false },
  ];
  const CLS_ANIM_ANNOTATIONS = [
    { x:350, y:28,  text:"Root Node: best feature across all splits", color:"#2B5BFF" },
    { x:150, y:163, text:"Pure leaf! Gini = 0.0 — all Setosa",        color:"#2B5BFF" },
    { x:550, y:163, text:"Still impure — need another split",          color:"#7c3aed" },
    { x:550, y:303, text:"All leaves pure — tree complete!",            color:"#1f9e6b" },
  ];
  const CLS_PHASE_LABELS = [
    "Phase 0 of 3 — Root node appears",
    "Phase 1 of 3 — Root splits: Setosa leaf and right node revealed",
    "Phase 2 of 3 — Right node splits into two more leaves",
    "Phase 3 of 3 — All leaves pure — tree complete",
  ];
  const CLS_DOT_COLORS = ["#2B5BFF", "#1f9e6b", "#e0492e"];

  function TreeBuildAnim() {
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
      const allDots = [];
      n.dots.forEach((cnt, ci) => { for (let j = 0; j < cnt; j++) allDots.push(ci); });
      return (
        <g style={animStyle}>
          {n.isLeaf && visible && (
            <rect x={n.x - n.w/2 - 5} y={n.y - n.h/2 - 5}
              width={n.w + 10} height={n.h + 10} rx="14"
              fill="none" stroke={n.stroke} strokeWidth="2" opacity="0.35"
              style={{ animation:"clsTreePulse 2s ease-in-out infinite" }}/>
          )}
          <rect x={n.x - n.w/2} y={n.y - n.h/2} width={n.w} height={n.h}
            rx="10" fill={n.fill} stroke={n.stroke} strokeWidth="2"/>
          <rect x={n.x - n.w/2 + 6} y={n.y - n.h/2 + 6}
            width={n.badge.length * 7 + 8} height={16} rx="4" fill={n.badgeColor} opacity="0.9"/>
          <text x={n.x - n.w/2 + 10} y={n.y - n.h/2 + 17}
            fontSize="9" fontWeight="800" fill="white">{n.badge}</text>
          <text x={n.x} y={n.y - 8} textAnchor="middle"
            fontSize="11" fontWeight="700" fill={n.textColor}>{n.label}</text>
          {allDots.map((ci, i) => (
            <circle key={i}
              cx={n.x - (allDots.length - 1) * 6 + i * 12}
              cy={n.y + 8} r="4.5" fill={CLS_DOT_COLORS[ci]}
              opacity="0.85" stroke="white" strokeWidth="1"/>
          ))}
          <text x={n.x} y={n.y + 26} textAnchor="middle"
            fontSize="9" fill="#888">Gini: {n.gini}</text>
        </g>
      );
    }

    function EdgeLine({ e }) {
      const fromNode = CLS_ANIM_NODES.find(n => n.id === e.from);
      const toNode   = CLS_ANIM_NODES.find(n => n.id === e.to);
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

    const ann = CLS_ANIM_ANNOTATIONS[phase] || null;

    return (
      <div style={{ fontFamily:"var(--body-font, sans-serif)" }}>
        <style>{`
          @keyframes clsTreePulse {
            0%, 100% { opacity: 0.3; }
            50%       { opacity: 0.7; }
          }
        `}</style>
        <div style={{ display:"flex", gap:18, flexWrap:"wrap", alignItems:"flex-start" }}>
          <div style={{ flex:"1 1 500px" }}>
            <svg viewBox="0 0 840 460" style={{ width:"100%", height:"auto",
              border:"1px solid var(--line)", borderRadius:14,
              background:"var(--panel-solid)", boxShadow:"var(--shadow)", display:"block" }}>
              {ann && (
                <g>
                  <rect x={ann.x - 160} y={ann.y - 14} width="320" height="22" rx="6"
                    fill={ann.color} opacity="0.12"/>
                  <text x={ann.x} y={ann.y + 2} textAnchor="middle"
                    fontSize="11" fontWeight="700" fill={ann.color}>{ann.text}</text>
                </g>
              )}
              {CLS_ANIM_EDGES.map((e, i) => <EdgeLine key={i} e={e}/>)}
              {CLS_ANIM_NODES.map(n => <NodeBox key={n.id} n={n}/>)}
            </svg>
          </div>
          <div style={{ flex:"0 0 200px", minWidth:180 }}>
            <div style={{ fontWeight:800, fontSize:12, color:"var(--ink)", marginBottom:10 }}>Legend</div>
            {[
              { color:"#2B5BFF", label:"Root Node",     desc:"First question (highest Info Gain)" },
              { color:"#7c3aed", label:"Internal Node", desc:"A question with children" },
              { color:"#1f9e6b", label:"Leaf Node",     desc:"Final answer — no more splits" },
              { color:"#888",    label:"Branch",        desc:"Connects parent to child (Yes/No)" },
            ].map(({ color, label, desc }) => (
              <div key={label} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ width:12, height:12, borderRadius:3, background:color, flexShrink:0, marginTop:2 }}/>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--ink)" }}>{label}</div>
                  <div style={{ fontSize:10, color:"var(--muted)" }}>{desc}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop:16, padding:"10px 12px", borderRadius:10,
              background:"var(--line-soft)", border:"1px solid var(--line)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>Class dots</div>
              {["Setosa","Versicolor","Virginica"].map((lbl, i) => (
                <div key={lbl} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:CLS_DOT_COLORS[i] }}/>
                  <span style={{ fontSize:10, color:"var(--muted)" }}>{lbl}</span>
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
          <div style={{ marginLeft:"auto", fontSize:12, fontWeight:700, color:"var(--accent-ink)",
            padding:"4px 12px", borderRadius:8, background:"var(--accent-soft)" }}>
            {CLS_PHASE_LABELS[phase]}
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
      id:"cls-overview", group:"Overview", title:"What is a Decision Tree?",
      map:"Overview",
      why:"Decision trees are among the most intuitive ML models — they replicate the way humans make decisions through a chain of yes/no questions. Understanding them deeply unlocks Random Forests, Gradient Boosting, and XGBoost.",
      render: () => (
        <>
          <Lead>
            Imagine playing the <b>20-questions game</b>: you think of an animal and your
            friend asks binary questions — "Does it have four legs? Does it live in water?" —
            to narrow it down. A <b>decision tree</b> does exactly this, but instead of
            playing a game it <b>learns the right questions from data</b>.
          </Lead>
          <Lead>
            Every decision tree is built from three types of pieces. A <b>node</b> is any
            point in the tree. The <b>root node</b> is the topmost node — it sees all
            training data and asks the single most useful question. <b>Internal nodes</b> (also
            called branch nodes or split nodes) test one feature against a <b>threshold</b>:
            "Is petal_len ≤ 2.5?" Routes go left for YES and right for NO. A <b>leaf node</b>
            (terminal node) has no children — it gives a <b>prediction</b> (a class for
            classification, a number for regression).
          </Lead>
          <Lead>
            The <b>depth</b> of a node is how many splits were made to reach it from the root.
            The tree's overall depth is the length of the longest root-to-leaf path. A
            <b> split</b> is one binary partition of the data at a node.
            <b> Impurity</b> measures how mixed the classes are in a node — a <b>pure</b> node
            has all samples from one class (impurity = 0). <b>Information gain</b> is the
            impurity reduction achieved by a split — the tree always picks the split with the
            highest gain. <b>Pruning</b> is the practice of cutting back an overgrown tree to
            improve generalization.
          </Lead>
          {subhead("Full tree structure for our iris dataset")}
          <div style={{ display:"flex", gap:24, flexWrap:"wrap", alignItems:"flex-start" }}>
            <TreeDiagram showCounts={true} showGini={true}/>
            <div style={{ maxWidth:270 }}>
              <div className="tf-legend" style={{ gridTemplateColumns:"1fr" }}>
                {[
                  ["Root node","Asks petal_len ≤ 2.5? — the single best question for 12 training flowers."],
                  ["Left branch (YES)","4 Setosa flowers — leaf is perfectly pure (Gini = 0)."],
                  ["Right branch (NO)","8 flowers remain; still mixed. Need another question."],
                  ["Second split","petal_wid ≤ 1.8 perfectly separates Versicolor from Virginica."],
                  ["Depth","This tree has depth = 2 (2 decisions to reach any leaf)."],
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
                  <p>Greedily find the best feature+threshold at each node (highest information gain). Recurse on children. Stop when leaves are pure or a limit is reached.</p>
                </div>
                <div className="tf-life tf-life--infer">
                  <div className="tf-life-h"><span>I</span><span>Inference</span></div>
                  <p>Route the input through the tree, answering YES/NO at each split. The leaf reached gives the predicted class.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ),
    },

    // ── 2. Dataset ───────────────────────────────────────
    {
      id:"cls-dataset", group:"Overview", title:"The Training Dataset",
      map:"Dataset",
      why:"Seeing the raw data first tells us what we are trying to learn. The three flower classes are well-separated in petal space — that is why even a shallow depth-2 tree achieves perfect accuracy on this toy set.",
      render: (trace) => (
        <>
          <Lead>
            We use a <b>toy iris dataset</b> with 12 flowers and 2 features: <b>petal length</b>
            (cm) and <b>petal width</b> (cm). There are 3 target classes — <b>Setosa</b>,
            <b> Versicolor</b>, and <b>Virginica</b> — each with exactly 4 training samples.
          </Lead>
          <Lead>
            Why only 2 features? Real iris data has 4, but 2 lets us draw the decision
            boundaries on a scatter plot and see them directly. Why 3 classes? It lets us show
            that a tree can split the space into more than 2 regions by stacking binary splits.
            The <b>class distribution</b> is perfectly balanced (4 each), so there is no
            majority-class bias to worry about here. The ★ in the chart below tracks your
            current slider values.
          </Lead>
          {row(<>
            <Scatter input={trace.input}/>
            <div>
              {subhead("Dataset table")}
              <table style={{ borderCollapse:"collapse", fontSize:12.5 }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--line)" }}>
                    {["#","petal_len","petal_wid","class"].map(h=>(
                      <th key={h} style={{ padding:"4px 10px", textAlign:"right",
                        color:"var(--faint)", fontWeight:700, fontSize:11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DT_CLS.data.map((d,i)=>(
                    <tr key={i} style={{ borderBottom:"1px solid var(--line-soft)",
                      background:i%2===0?"var(--line-soft)":"transparent" }}>
                      <td style={{ padding:"3px 10px", fontFamily:"var(--num-font)", color:"var(--faint)", textAlign:"right" }}>{i+1}</td>
                      <td style={{ padding:"3px 10px", fontFamily:"var(--num-font)", color:"var(--ink)", textAlign:"right" }}>{d[0]}</td>
                      <td style={{ padding:"3px 10px", fontFamily:"var(--num-font)", color:"var(--ink)", textAlign:"right" }}>{d[1]}</td>
                      <td style={{ padding:"3px 10px" }}>
                        <span style={{ color:CC[d[2]], fontWeight:700, fontSize:11 }}>{CN[d[2]]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>Setosa lives in the low-petal-length region; Versicolor and Virginica overlap more — but petal_wid separates them.</Note>
            </div>
          </>)}
        </>
      ),
    },

    // ── 3. What is Impurity? ──────────────────────────────
    {
      id:"cls-impurity", group:"Math", title:"What is Impurity?",
      map:"Impurity",
      why:"Before we can choose a split, we need a way to measure how 'mixed up' the classes are at a node. Impurity is that measure — lower is better, zero is perfect.",
      render: () => (
        <>
          <Lead>
            Picture a bag of marbles. If all marbles are the same colour, the bag is
            <b> pure</b>. If they are all different colours, it is maximally <b>impure</b>.
            A <b>node</b> in a decision tree is like a bag of training samples. We want the
            tree to create bags that are as pure as possible — one class per bag — so our
            predictions are confident.
          </Lead>
          <Lead>
            Why does impurity matter for splitting? When we ask a question ("is petal_len ≤ 2.5?"),
            we split the current bag into two smaller bags. A <b>good split</b> creates children
            that are much purer than the parent. A <b>bad split</b> just randomly divides the
            marbles and leaves both bags equally mixed. The tree always chooses the split that
            reduces impurity the most.
          </Lead>
          {subhead("Visual: three nodes with different class mixes")}
          <ImpurityBoxes/>
          {subhead("Two standard impurity measures")}
          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            {card(<>
              <div style={{ fontWeight:800, fontSize:13, color:"var(--accent-ink)", marginBottom:6 }}>Gini Impurity (CART / sklearn default)</div>
              <Formula label="Gini">Gini = 1 − Σᵢ pᵢ²</Formula>
              <div style={{ fontSize:12.5, color:"var(--muted)", marginTop:6 }}>
                Probability that a randomly chosen sample is <em>incorrectly</em> labelled.
                Ranges from 0 (pure) to 0.5 (binary max-impurity) or 0.667 (3-class max).
                Computationally cheap — no logarithm.
              </div>
            </>, { flex:"1 1 230px" })}
            {card(<>
              <div style={{ fontWeight:800, fontSize:13, color:"#e0492e", marginBottom:6 }}>Entropy (ID3 / C4.5)</div>
              <Formula label="Entropy">H = −Σᵢ pᵢ · log₂(pᵢ)</Formula>
              <div style={{ fontSize:12.5, color:"var(--muted)", marginTop:6 }}>
                Measures "surprise" — how unpredictable the class is. Ranges from 0 (certain)
                to log₂(K) for K classes. Slightly more theoretically principled; slightly
                slower due to log computation.
              </div>
            </>, { flex:"1 1 230px" })}
          </div>
          <Note>In practice, Gini and Entropy almost always choose the same split. sklearn uses Gini by default; set <code>criterion="entropy"</code> to switch.</Note>
        </>
      ),
    },

    // ── 4. Gini Impurity ─────────────────────────────────
    {
      id:"cls-gini", group:"Math", title:"Gini Impurity — Step by Step",
      map:"Gini",
      why:"Gini is sklearn's default split criterion and the heart of the CART algorithm. Understanding exactly how it is computed removes the mystery from the model.",
      render: () => (
        <>
          <Lead>
            <b>Gini impurity</b> for a node is computed in three steps: (1) find the class
            proportions pᵢ = countᵢ / n, (2) square each proportion, (3) subtract the sum
            from 1. The result is the probability that a random pair of samples from the node
            belongs to <em>different</em> classes.
          </Lead>
          <Lead>
            For a <b>perfectly pure</b> node (all one class) p₀ = 1, so Gini = 1 − 1² = 0.
            For a <b>maximally impure</b> binary node (50/50 split) Gini = 1 − (0.5² + 0.5²) = 0.5.
            For our 3-class equal-mix root: Gini = 1 − 3×(1/3)² = 1 − 1/3 ≈ 0.667.
          </Lead>
          {subhead("Root node: all 12 samples, 4 per class")}
          {card(<div className="nn-calc">
            <div className="nn-calc-h">Step-by-step: Gini(root)</div>
            <div className="nn-calc-row">n = 12, counts = [Setosa:4, Versicolor:4, Virginica:4]</div>
            <div className="nn-calc-row">p₀ = 4/12 = 0.333 → p₀² = 0.111</div>
            <div className="nn-calc-row">p₁ = 4/12 = 0.333 → p₁² = 0.111</div>
            <div className="nn-calc-row">p₂ = 4/12 = 0.333 → p₂² = 0.111</div>
            <div className="nn-calc-row">Σ pᵢ² = 0.111 + 0.111 + 0.111 = 0.333</div>
            <div className="nn-calc-row" style={{ fontSize:14, color:"var(--accent-ink)" }}>
              <b>Gini(root) = 1 − 0.333 = 0.665</b>  (high impurity — 3 classes equally mixed)
            </div>
          </div>)}
          {subhead("Weighted Gini after a candidate split")}
          <Lead>
            Splitting alone is not enough — we need to know the <b>weighted Gini</b> of the
            two children. Each child's Gini is weighted by the fraction of samples it receives:
          </Lead>
          <Formula label="Weighted Gini">
            Gini_split = (n_left/n) × Gini(left) + (n_right/n) × Gini(right)
          </Formula>
          {card(<div className="nn-calc">
            <div className="nn-calc-h">Candidate split: petal_len ≤ 2.5</div>
            <div className="nn-calc-row">LEFT child: n=4, [4,0,0] → Gini = 1−(1²+0+0) = <b>0.000</b> (pure!)</div>
            <div className="nn-calc-row">RIGHT child: n=8, [0,4,4] → Gini = 1−(0+0.5²+0.5²) = 1−0.5 = <b>0.500</b></div>
            <div className="nn-calc-row">Weighted = (4/12)×0.000 + (8/12)×0.500 = 0 + 0.333 = <b>0.333</b></div>
            <div className="nn-calc-row">Information Gain = 0.665 − 0.333 = <span style={{color:"var(--accent)"}}>0.332</span></div>
          </div>)}
          {subhead("Gini for every group in our tree")}
          <div style={{ maxWidth:560 }}>
            <GiniBar counts={[4,4,4]} label="Root (all 12)"/>
            <GiniBar counts={[4,0,0]} label="Left leaf (Setosa)"/>
            <GiniBar counts={[0,4,4]} label="Right node (8 left)"/>
            <GiniBar counts={[0,4,0]} label="Versicolor leaf"/>
            <GiniBar counts={[0,0,4]} label="Virginica leaf"/>
          </div>
          <Note>
            Notice: all three final leaves have Gini = 0. This tree is perfectly fitting —
            every leaf contains samples of exactly one class.
          </Note>
        </>
      ),
    },

    // ── 5. Entropy & Information Gain ────────────────────
    {
      id:"cls-entropy", group:"Math", title:"Entropy & Information Gain",
      map:"Info Gain",
      why:"Entropy gives us a deeper, information-theoretic view of impurity. Information Gain then tells us exactly how much knowledge a split provides — it is what ID3 and C4.5 maximise.",
      render: () => {
        const H_root  = entropy([4,4,4]);
        const H_left  = entropy([4,0,0]);
        const H_right = entropy([0,4,4]);
        const wH_split = (4/12)*H_left + (8/12)*H_right;
        const IG_root = H_root - wH_split;

        const H_r     = entropy([0,4,4]);
        const H_rl    = entropy([0,4,0]);
        const H_rr    = entropy([0,0,4]);
        const wH_r    = (4/8)*H_rl + (4/8)*H_rr;
        const IG_r    = H_r - wH_r;

        return (
          <>
            <Lead>
              <b>Entropy</b> (from information theory) measures uncertainty. If a bag is all
              one class you already know what you will get — entropy = 0. If the bag is an
              equal mix of K classes, entropy = log₂(K) (maximum surprise). The formula:
              H = −Σ pᵢ · log₂(pᵢ). We define 0 · log₂(0) = 0 by convention.
            </Lead>
            <Lead>
              <b>Information Gain (IG)</b> is how much entropy the split removes:
              IG = H(parent) − [n_left/n × H(left) + n_right/n × H(right)].
              Higher IG = better split. The tree greedily picks the split with max IG at each
              node. Note: Gini-based Information Gain and Entropy-based IG almost always agree on
              which split is best — Gini is just faster to compute.
            </Lead>
            {subhead("Entropy for each group")}
            <div style={{ maxWidth:560 }}>
              <EntropyBar counts={[4,4,4]} label="Root (all 12)"/>
              <EntropyBar counts={[4,0,0]} label="Left leaf (Setosa)"/>
              <EntropyBar counts={[0,4,4]} label="Right node (8 left)"/>
              <EntropyBar counts={[0,4,0]} label="Versicolor leaf"/>
              <EntropyBar counts={[0,0,4]} label="Virginica leaf"/>
            </div>
            {subhead("Root split: petal_len ≤ 2.5")}
            {card(<div className="nn-calc">
              <div className="nn-calc-h">Step 1 — Entropy of parent</div>
              <div className="nn-calc-row">H(root) = −(0.333·log₂0.333)×3 = −3×(−0.528) = <b>{fmt(H_root,3)}</b></div>
              <div className="nn-calc-h" style={{marginTop:8}}>Step 2 — Entropy of children</div>
              <div className="nn-calc-row">H(left)  = 0.000  (all Setosa, no surprise)</div>
              <div className="nn-calc-row">H(right) = −2×(0.5·log₂0.5) = −2×(−0.5) = <b>{fmt(H_right,3)}</b></div>
              <div className="nn-calc-h" style={{marginTop:8}}>Step 3 — Weighted entropy of split</div>
              <div className="nn-calc-row">wH = (4/12)×0 + (8/12)×1.000 = <b>{fmt(wH_split,3)}</b></div>
              <div className="nn-calc-row" style={{ marginTop:8, fontSize:14, color:"var(--accent-ink)" }}>
                <b>IG(root split) = {fmt(H_root,3)} − {fmt(wH_split,3)} = {fmt(IG_root,3)}</b>
              </div>
            </div>)}
            {subhead("Right split: petal_wid ≤ 1.8 (applied to 8 samples)")}
            {card(<div className="nn-calc">
              <div className="nn-calc-h">Parent = right node: [0,4,4]</div>
              <div className="nn-calc-row">H(right_node) = {fmt(H_r,3)}</div>
              <div className="nn-calc-row">H(versicolor leaf) = 0.000, H(virginica leaf) = 0.000</div>
              <div className="nn-calc-row">wH = 0 + 0 = 0.000</div>
              <div className="nn-calc-row" style={{ marginTop:8, fontSize:14, color:"var(--accent-ink)" }}>
                <b>IG(right split) = {fmt(H_r,3)} − 0.000 = {fmt(IG_r,3)}</b>
              </div>
            </div>)}
            {subhead("Gini vs Entropy comparison")}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {[
                ["Gini (CART)", "No log — faster. Tends to isolate the largest class first. sklearn default.", CC[0]],
                ["Entropy (ID3/C4.5)", "Uses log₂ — more principled information theory. Better for multi-class in theory.", CC[1]],
                ["Agreement", "For this dataset (and most real datasets) both criteria select the same splits. Use Gini unless you have a specific reason.", "#888"],
              ].map(([t,d,c])=>(
                <div key={t} style={{ flex:"1 1 170px", padding:"10px 14px", borderRadius:10,
                  background:"var(--line-soft)", borderLeft:`3px solid ${c}` }}>
                  <div style={{ fontWeight:700, fontSize:12, color:c }}>{t}</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>{d}</div>
                </div>
              ))}
            </div>
          </>
        );
      },
    },

    // ── 6. Choosing the Root Split ───────────────────────
    {
      id:"cls-root-split", group:"Math", title:"Choosing the Root Split",
      map:"Best Split",
      why:"This stage is the core of decision tree learning. The algorithm exhaustively tries every feature and every threshold, computing information gain for each, and picks the winner. Understanding this search makes every downstream concept clear.",
      render: () => {
        const data = DT_CLS.data;

        // Compute IG for all thresholds of petal_len
        const thresholdsLen = [1.45, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5];
        const resultsLen = thresholdsLen.map(t => {
          const left  = data.filter(d=>d[0]<=t);
          const right = data.filter(d=>d[0]>t);
          const lc = [0,1,2].map(c=>left.filter(d=>d[2]===c).length);
          const rc = [0,1,2].map(c=>right.filter(d=>d[2]===c).length);
          const gl=gini(lc), gr=gini(rc);
          const wg=(left.length*gl+right.length*gr)/data.length;
          const ig=gini([4,4,4])-wg;
          return {t, nl:left.length, nr:right.length, gl, gr, wg, ig};
        });

        // petal_wid thresholds
        const thresholdsWid = [0.2, 0.5, 1.0, 1.3, 1.5, 1.8, 2.0, 2.2];
        const resultsWid = thresholdsWid.map(t => {
          const left  = data.filter(d=>d[1]<=t);
          const right = data.filter(d=>d[1]>t);
          const lc = [0,1,2].map(c=>left.filter(d=>d[2]===c).length);
          const rc = [0,1,2].map(c=>right.filter(d=>d[2]===c).length);
          const gl=gini(lc), gr=gini(rc);
          const wg=(left.length*gl+right.length*gr)/data.length;
          const ig=gini([4,4,4])-wg;
          return {t, nl:left.length, nr:right.length, gl, gr, wg, ig};
        });

        const maxIG_len = Math.max(...resultsLen.map(r=>r.ig));
        const maxIG_wid = Math.max(...resultsWid.map(r=>r.ig));
        const allMax    = Math.max(maxIG_len, maxIG_wid);

        const W=460, H=180, pL=52, pR=12, pT=20, pB=40;
        const pw=W-pL-pR, ph=H-pT-pB;
        const xi = (arr,i) => pL+(i/(arr.length-1))*pw;
        const yv = v => pT+ph-(v/allMax)*ph;

        return (
          <>
            <Lead>
              At the root the tree has <b>all 12 samples</b> and must pick the single best
              question. "Best" means highest <b>Information Gain</b> (= largest impurity drop).
              The algorithm tries <em>every feature</em> and <em>every possible threshold</em>
              — a brute-force search over a small discrete set (for numeric features, possible
              thresholds are midpoints between adjacent unique values).
            </Lead>
            <Lead>
              Notice that <b>petal_len ≤ 2.5</b> and <b>petal_len ≤ 1.45</b> give the same
              IG for this dataset (both isolate the 4 Setosa flowers perfectly). sklearn picks
              the numerically smallest threshold among ties, giving 2.45 in real iris data.
              In our toy data the split at 2.5 achieves IG ≈ 0.332 — the global winner.
            </Lead>
            {subhead("IG vs threshold — petal_len (blue) and petal_wid (red)")}
            <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart" style={{marginBottom:14}}>
              {/* petal_len line */}
              <polyline points={resultsLen.map((r,i)=>`${xi(resultsLen,i)},${yv(r.ig)}`).join(" ")}
                fill="none" stroke={CC[0]} strokeWidth="2"/>
              {resultsLen.map((r,i)=>(
                <circle key={i} cx={xi(resultsLen,i)} cy={yv(r.ig)}
                  r={r.ig===maxIG_len?7:4}
                  fill={r.ig===maxIG_len?CC[0]:"var(--line)"}
                  stroke="var(--panel-solid)" strokeWidth="1.5"/>
              ))}
              {resultsLen.filter(r=>r.ig===maxIG_len).map((r,i)=>(
                <text key={i} x={xi(resultsLen,resultsLen.indexOf(r))} y={yv(r.ig)-12}
                  textAnchor="middle" fontSize="10" fontWeight="800" fill={CC[0]}>
                  best len={r.t}
                </text>
              ))}
              {/* petal_wid line */}
              <polyline points={resultsWid.map((r,i)=>`${xi(resultsWid,i)},${yv(r.ig)}`).join(" ")}
                fill="none" stroke={CC[2]} strokeWidth="2" strokeDasharray="6 3"/>
              {resultsWid.map((r,i)=>(
                <circle key={i} cx={xi(resultsWid,i)} cy={yv(r.ig)}
                  r={r.ig===maxIG_wid?7:4}
                  fill={r.ig===maxIG_wid?CC[2]:"var(--line)"}
                  stroke="var(--panel-solid)" strokeWidth="1.5"/>
              ))}
              {/* axes */}
              <line x1={pL} y1={pT+ph} x2={pL+pw} y2={pT+ph} stroke="var(--faint)"/>
              <line x1={pL} y1={pT}    x2={pL}     y2={pT+ph} stroke="var(--faint)"/>
              {[0,0.1,0.2,0.3].map(v=>(
                <g key={v}>
                  <line x1={pL-3} y1={yv(v)} x2={pL} y2={yv(v)} stroke="var(--faint)"/>
                  <text x={pL-5} y={yv(v)+4} textAnchor="end" fontSize="9" fill="var(--faint)">{v.toFixed(1)}</text>
                </g>
              ))}
              <text x={pL+pw/2} y={H-4} textAnchor="middle" className="reg-axl">threshold value</text>
              <text x="13" y={pT+ph/2} textAnchor="middle" className="reg-axl"
                transform={`rotate(-90,13,${pT+ph/2})`}>Information Gain</text>
              <rect x={pL+pw-110} y={pT+6} width="9" height="3" rx="1" fill={CC[0]}/>
              <text x={pL+pw-98} y={pT+10} fontSize="9" fill="var(--muted)">petal_len</text>
              <rect x={pL+pw-110} y={pT+20} width="9" height="3" rx="1" fill={CC[2]}/>
              <text x={pL+pw-98} y={pT+24} fontSize="9" fill="var(--muted)">petal_wid</text>
            </svg>
            {subhead("All petal_len thresholds")}
            <div style={{ overflowX:"auto" }}>
              <table style={{ borderCollapse:"collapse", fontSize:12, width:"100%", maxWidth:620 }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--line)" }}>
                    {["Threshold","n_left","n_right","Gini_left","Gini_right","Wt. Gini","Info Gain"].map(h=>(
                      <th key={h} style={{ padding:"4px 9px", textAlign:"right",
                        color:"var(--faint)", fontWeight:700, fontSize:11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultsLen.map(r=>(
                    <tr key={r.t} style={{
                      background:r.ig===maxIG_len?"var(--accent-soft)":"transparent",
                      borderBottom:"1px solid var(--line-soft)" }}>
                      <td style={{ padding:"3px 9px", fontFamily:"var(--num-font)",
                        fontWeight:r.ig===maxIG_len?800:400,
                        color:r.ig===maxIG_len?"var(--accent-ink)":"var(--ink)" }}>{r.t}</td>
                      <td style={{ padding:"3px 9px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{r.nl}</td>
                      <td style={{ padding:"3px 9px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{r.nr}</td>
                      <td style={{ padding:"3px 9px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{fmt(r.gl,3)}</td>
                      <td style={{ padding:"3px 9px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{fmt(r.gr,3)}</td>
                      <td style={{ padding:"3px 9px", fontFamily:"var(--num-font)", textAlign:"right", color:"var(--muted)" }}>{fmt(r.wg,4)}</td>
                      <td style={{ padding:"3px 9px", fontFamily:"var(--num-font)", textAlign:"right",
                        fontWeight:700, color:r.ig===maxIG_len?"var(--accent-ink)":"var(--ink)" }}>{fmt(r.ig,4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Note>
              The winner: <b>petal_len ≤ 2.5</b> with Information Gain ≈ 0.332.
              petal_wid thresholds peak at IG ≈ 0.250 — good but not better. So petal_len
              becomes the root question.
            </Note>
          </>
        );
      },
    },

    // ── 7. Recursive Splitting ───────────────────────────
    {
      id:"cls-recursive", group:"Training", title:"Recursive Splitting",
      map:"Build Tree",
      why:"The tree builds itself by repeating the same split-search at each child node. Knowing the stopping conditions tells you exactly when the recursion ends — and how to control it.",
      render: () => (
        <>
          <Lead>
            After the root split the data is <b>partitioned</b>: the left child gets the 4
            Setosa flowers; the right child gets 8 mixed flowers. Now the algorithm recurses:
            apply the exact same best-split search to each child independently.
          </Lead>
          <Lead>
            The <b>left child</b> has [4,0,0] — all Setosa, Gini = 0. A pure node! No split
            needed. It becomes a <b>leaf</b> predicting "Setosa". The <b>right child</b> has
            [0,4,4] (Gini = 0.5). Not pure. The algorithm searches all thresholds of both
            features again — this time only using the 8 samples in this node. The winner is
            <b> petal_wid ≤ 1.8</b> with IG = 0.500 (perfect split). Both grandchildren are
            pure ([0,4,0] and [0,0,4]), so recursion stops at depth 2.
          </Lead>
          <Lead>
            <b>Stopping conditions</b> that end recursion: (1) node is pure (Gini = 0),
            (2) node has fewer than <code>min_samples_split</code> samples, (3) no split
            improves impurity, (4) depth equals <code>max_depth</code>. Condition (1) fired
            for all our leaves here.
          </Lead>
          <TreeDiagram showCounts={true} showGini={true}/>
          {subhead("Recursion steps")}
          <div style={{ display:"flex", flexDirection:"column", gap:8, maxWidth:600 }}>
            {[
              ["Step 1","Root (n=12)","[4,4,4], Gini=0.665","Best split: petal_len ≤ 2.5, IG=0.332"],
              ["Step 2","Left child (n=4)","[4,0,0], Gini=0.000","PURE → Leaf: Setosa ✓"],
              ["Step 3","Right child (n=8)","[0,4,4], Gini=0.500","Best split: petal_wid ≤ 1.8, IG=0.500"],
              ["Step 4","Right→Left (n=4)","[0,4,0], Gini=0.000","PURE → Leaf: Versicolor ✓"],
              ["Step 5","Right→Right (n=4)","[0,0,4], Gini=0.000","PURE → Leaf: Virginica ✓"],
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
      ),
    },

    // ── 8. The Full Tree ─────────────────────────────────
    {
      id:"cls-full-tree", group:"Training", title:"The Full Decision Tree",
      map:"Full Tree",
      why:"Seeing the complete annotated tree with sample counts and Gini values at every node is the clearest way to understand what the model has learned.",
      render: () => (
        <>
          <Lead>
            Our final tree has <b>2 internal nodes</b> and <b>3 leaf nodes</b> at depth 2.
            Every leaf is perfectly pure (Gini = 0), meaning every training flower is correctly
            classified. Each internal node shows: the feature tested, the threshold, the
            sample count, and the Gini impurity before splitting. Each leaf shows: the
            predicted class and how many training samples support it.
          </Lead>
          <TreeDiagram showCounts={true} showGini={true}/>
          {subhead("Reading the tree")}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {[
              { color:CC[0], title:"Root: petal_len ≤ 2.5", body:"n=12, Gini=0.665. The most impure node — 4 of each class. This is where training starts." },
              { color:"var(--line)", title:"Right: petal_wid ≤ 1.8", body:"n=8, Gini=0.500. After Setosa is split off, 4 Versicolor and 4 Virginica remain, cleanly separated by petal width." },
              { color:CC[0], title:"Leaf: Setosa", body:"n=4, Gini=0. All 4 training Setosa landed here. Any new flower with petal_len ≤ 2.5 gets predicted Setosa." },
              { color:CC[1], title:"Leaf: Versicolor", body:"n=4, Gini=0. petal_len>2.5 AND petal_wid≤1.8 → Versicolor." },
              { color:CC[2], title:"Leaf: Virginica", body:"n=4, Gini=0. petal_len>2.5 AND petal_wid>1.8 → Virginica." },
            ].map(({color,title,body})=>(
              <div key={title} style={{ flex:"1 1 200px", padding:"10px 14px", borderRadius:10,
                background:"var(--line-soft)", borderLeft:`3px solid ${color}` }}>
                <div style={{ fontWeight:700, fontSize:12.5, color:"var(--ink)" }}>{title}</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>{body}</div>
              </div>
            ))}
          </div>
          <Note>
            This depth-2 tree achieves 100% training accuracy on our 12-sample toy dataset.
            On real 150-sample iris data, sklearn's default tree also reaches ≈100% training
            accuracy but only ≈97% test accuracy — the three points that are hard to separate
            require deeper splits that may not generalise.
          </Note>
        </>
      ),
    },

    // ── 8b. Tree Build Animation ─────────────────────────
    {
      id:"tree-animation", group:"Training", title:"Watch the Tree Build — Animated",
      map:"Tree Animation",
      why:"Seeing the tree grow level-by-level makes the recursive splitting process concrete and memorable.",
      render: () => (
        <>
          <Lead>
            Watch the classification tree grow <b>level by level</b>. Each phase reveals a
            new set of nodes via animated entrance — scale-in from zero, with connecting
            branch lines that draw themselves from parent to child. Use Play, Pause, and
            Reset to control the animation, or jump directly to any phase.
          </Lead>
          <TreeBuildAnim/>
        </>
      ),
    },

    // ── 9. Prediction Path ───────────────────────────────
    {
      id:"cls-predict", group:"Inference", title:"Prediction Path — Interactive",
      map:"Predict Path",
      why:"Tracing a specific sample through the tree makes the model completely transparent — you can explain to anyone exactly why a prediction was made.",
      render: (trace) => {
        const {path, label} = trace;
        const edges = [{ from:"root", to:"root" }];
        let depth=0;
        for (let i=0; i<path.length; i++) {
          const step=path[i];
          if (step.leaf) break;
          if (depth===0) { const to=step.goLeft?"left":"right"; edges.push({from:"root",to}); }
          else           { const to=step.goLeft?"rl":"rr";      edges.push({from:"right",to}); }
          depth++;
        }
        return (
          <>
            <Lead>
              Current input: <b>petal_len = {fmt(trace.input.petal_len)}</b> and{" "}
              <b>petal_wid = {fmt(trace.input.petal_wid)}</b>. The tree routes this flower
              through the highlighted path below and predicts:{" "}
              <b style={{color:CC[label]}}>{CN[label]}</b>.
            </Lead>
            <Lead>
              Move the sliders in the header to change the input — the path highlights in
              real time. Notice how crossing the threshold at petal_len = 2.5 switches
              between the left and right subtrees entirely.
            </Lead>
            <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"flex-start" }}>
              <TreeDiagram highlightPath={edges} showCounts={true} showGini={false}/>
              <div style={{ maxWidth:270 }}>
                {subhead("Decision steps")}
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {path.map((step,i)=>{
                    if (step.leaf) return (
                      <div key={i} style={{ padding:"10px 14px", borderRadius:10,
                        background:CBG[step.node.label], border:`2px solid ${CC[step.node.label]}` }}>
                        <div style={{ fontWeight:800, fontSize:13, color:CC[step.node.label] }}>Leaf reached</div>
                        <div style={{ fontSize:12, color:"var(--ink)", marginTop:4 }}>
                          Predict: <b>{CN[step.node.label]}</b>
                        </div>
                        <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                          Training support: [{step.node.count?.join(",") ?? "4"}]
                        </div>
                        <div style={{ fontSize:11, color:"var(--muted)" }}>Confidence: 100%</div>
                      </div>
                    );
                    const feat=DT_CLS.features[step.node.feature];
                    return (
                      <div key={i} style={{ padding:"10px 14px", borderRadius:10,
                        background:"var(--accent-soft)", border:"1px solid var(--accent)" }}>
                        <div style={{ fontWeight:700, fontSize:12, color:"var(--accent-ink)" }}>
                          Q{i+1}: {feat} ≤ {step.node.threshold}?
                        </div>
                        <div style={{ fontSize:12, color:"var(--ink)", marginTop:3 }}>
                          {feat} = <b>{fmt(step.val)}</b> →{" "}
                          <b style={{color:step.goLeft?"#1f9e6b":"#e0492e"}}>
                            {step.goLeft?"YES → go left":"NO → go right"}
                          </b>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:14, padding:"14px 18px", borderRadius:12,
                  background:CBG[label], border:`2px solid ${CC[label]}` }}>
                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:4, fontWeight:700 }}>PREDICTION</div>
                  <div style={{ fontSize:22, fontWeight:900, color:CC[label] }}>{CN[label]}</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>
                    Confidence: 100% (leaf is pure)
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      },
    },

    // ── 10. Missing Values & Outliers ────────────────────
    {
      id:"cls-missing", group:"Robustness", title:"Missing Values & Outliers",
      map:"Robustness",
      why:"Real datasets are messy. Knowing how decision trees handle missing values and outliers — and why they are naturally robust to the latter — is critical for production use.",
      render: () => (
        <>
          <Lead>
            <b>Missing values</b>: suppose we receive a flower where petal_wid is not
            recorded. The tree reaches the node "petal_wid ≤ 1.8" and has nothing to compare.
            Three strategies are common: (1) <b>Surrogate splits</b> — during training the
            tree memorises alternative splits that correlate with the primary split; at
            inference it uses the best available surrogate. (2) <b>Majority direction</b> —
            route the sample toward the child that received more training samples (right if
            most samples went right). (3) <b>Imputation before training</b> — fill missing
            values with the feature mean or mode; sklearn does not natively support missing
            values in <code>DecisionTreeClassifier</code>, so imputation is the standard approach.
          </Lead>
          <Lead>
            <b>Outliers</b>: decision trees are <em>remarkably robust</em> to outliers in the
            <em> input features</em>. Here is why: suppose petal_len has an outlier at 99 cm.
            The tree will simply create a split at some threshold that separates the outlier into
            its own tiny region — it does <em>not</em> distort the splits for the rest of the
            data, unlike linear models where one extreme point pulls the entire regression line.
          </Lead>
          <Lead>
            However, trees are <em>not</em> robust to outliers in the <b>target variable</b>
            for regression (a single extreme price can dominate a leaf's mean prediction).
            For classification, a single mislabelled outlier sample is also problematic —
            it may force an extra split that creates a spurious boundary.
          </Lead>
          {subhead("Missing value example")}
          {card(<div className="nn-calc">
            <div className="nn-calc-h">Sample: petal_len=4.5, petal_wid=MISSING</div>
            <div className="nn-calc-row">Node 1: petal_len ≤ 2.5? → 4.5 > 2.5 → go RIGHT ✓ (no problem)</div>
            <div className="nn-calc-row">Node 2: petal_wid ≤ 1.8? → MISSING</div>
            <div className="nn-calc-row">Strategy A — majority: 4 of 8 went left, 4 went right → tie → go RIGHT</div>
            <div className="nn-calc-row">Strategy B — imputation: fill petal_wid = 1.68 (mean) → 1.68 ≤ 1.8 → go LEFT → Versicolor</div>
          </div>)}
          {subhead("Outlier robustness vs linear models")}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <div style={{ flex:"1 1 220px", padding:"12px 16px", borderRadius:10,
              background:CBG[1], border:`2px solid ${CC[1]}` }}>
              <div style={{ fontWeight:700, fontSize:13, color:CC[1] }}>Decision Tree</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>
                Outlier at petal_len=99? The tree adds one extra split: "petal_len ≤ some threshold"
                to separate it. The rest of the tree is <em>completely unaffected</em>.
              </div>
            </div>
            <div style={{ flex:"1 1 220px", padding:"12px 16px", borderRadius:10,
              background:CBG[2], border:`2px solid ${CC[2]}` }}>
              <div style={{ fontWeight:700, fontSize:13, color:CC[2] }}>Linear / SVM</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>
                Outlier at petal_len=99 drags the decision boundary toward it, misclassifying
                the rest of the data. Outlier removal or robust scaling is required.
              </div>
            </div>
          </div>
        </>
      ),
    },

    // ── 11. Hyperparameters & When to Use ────────────────
    {
      id:"cls-hyper", group:"Insights", title:"Hyperparameters & When to Use",
      map:"Hyper & Use",
      why:"Every practitioner needs to know which knobs to turn and when to reach for a decision tree vs a more complex model. This stage consolidates the practical takeaways.",
      render: () => {
        const depths=[1,2,3,4,5,6];
        const trainA=[0.72,0.98,1.00,1.00,1.00,1.00];
        const testA =[0.65,0.94,0.96,0.89,0.82,0.76];
        const W=400, H=180, pL=46, pR=14, pT=18, pB=38;
        const pw=W-pL-pR, ph=H-pT-pB;
        const xi=i=>pL+(i/(depths.length-1))*pw;
        const yv=v=>pT+ph-(v-0.6)/0.4*ph;
        return (
          <>
            <Lead>
              The three most important hyperparameters are <b>max_depth</b>
              (controls overfitting), <b>min_samples_leaf</b> (prevents tiny unreliable leaves),
              and <b>criterion</b> (gini vs entropy vs log_loss). The chart below shows the
              classic overfitting curve: training accuracy plateaus at 100% while test accuracy
              peaks around depth=2–3 and then falls.
            </Lead>
            <svg viewBox={`0 0 ${W} ${H}`} className="reg-chart" style={{marginBottom:16}}>
              <polyline points={trainA.map((v,i)=>`${xi(i)},${yv(v)}`).join(" ")}
                fill="none" stroke="var(--accent)" strokeWidth="2"/>
              <polyline points={testA.map((v,i)=>`${xi(i)},${yv(v)}`).join(" ")}
                fill="none" stroke="#e0492e" strokeWidth="2" strokeDasharray="5 3"/>
              {trainA.map((v,i)=><circle key={i} cx={xi(i)} cy={yv(v)} r="4"
                fill="var(--accent)" stroke="var(--panel-solid)" strokeWidth="1.5"/>)}
              {testA.map((v,i)=><circle key={i} cx={xi(i)} cy={yv(v)} r="4"
                fill="#e0492e" stroke="var(--panel-solid)" strokeWidth="1.5"/>)}
              <line x1={xi(1)} y1={pT} x2={xi(1)} y2={pT+ph}
                stroke="#1f9e6b" strokeWidth="1.5" strokeDasharray="4 2"/>
              <text x={xi(1)+5} y={pT+14} fontSize="9.5" fill="#1f9e6b" fontWeight="700">sweet spot</text>
              <line x1={pL} y1={pT+ph} x2={pL+pw} y2={pT+ph} stroke="var(--faint)"/>
              <line x1={pL} y1={pT}    x2={pL}     y2={pT+ph} stroke="var(--faint)"/>
              {depths.map((d,i)=><text key={d} x={xi(i)} y={pT+ph+14} textAnchor="middle"
                fontSize="9" fill="var(--faint)">{d}</text>)}
              {[0.7,0.8,0.9,1.0].map(v=><text key={v} x={pL-5} y={yv(v)+4} textAnchor="end"
                fontSize="9" fill="var(--faint)">{(v*100).toFixed(0)}%</text>)}
              <text x={pL+pw/2} y={H-4} textAnchor="middle" className="reg-axl">max_depth</text>
              <rect x={pL+pw-80} y={pT+6} width="8" height="3" fill="var(--accent)"/>
              <text x={pL+pw-68} y={pT+10} fontSize="9" fill="var(--muted)">train</text>
              <rect x={pL+pw-80} y={pT+20} width="8" height="3" fill="#e0492e"/>
              <text x={pL+pw-68} y={pT+24} fontSize="9" fill="var(--muted)">test</text>
            </svg>
            {subhead("Key hyperparameters")}
            <div className="tf-legend">
              {[
                ["max_depth","Max levels from root to leaf. Depth=2 gives our iris tree. Start with 3–5."],
                ["min_samples_split","Min samples to split an internal node. Default=2. Raise to prevent spurious splits."],
                ["min_samples_leaf","Min samples in any leaf. Default=1. Higher = smoother boundaries."],
                ["criterion","'gini' (default), 'entropy', or 'log_loss'. Usually same result; gini is faster."],
                ["max_features","Features to consider per split. None=all. 'sqrt' for forest-style randomness."],
              ].map(([n,d])=>(
                <div className="tf-leg is-learned" key={n}>
                  <div className="tf-leg-name">{n}</div>
                  <div className="tf-leg-desc">{d}</div>
                </div>
              ))}
            </div>
            {subhead("Strengths vs weaknesses")}
            <div className="opt-pc">
              <div className="opt-pc-col is-pro">
                <div className="opt-pc-h">When to USE a decision tree</div>
                <ul>
                  <li>Need a fully interpretable model (legal/medical requirements)</li>
                  <li>Data has threshold-based, non-linear structure</li>
                  <li>Mix of numeric and categorical features</li>
                  <li>No feature scaling required</li>
                  <li>Want to understand feature importance intuitively</li>
                  <li>Building block for Random Forest or XGBoost</li>
                </ul>
              </div>
              <div className="opt-pc-col is-con">
                <div className="opt-pc-h">When to AVOID a decision tree</div>
                <ul>
                  <li>High variance — small data changes rebuild the tree</li>
                  <li>Diagonal decision boundaries need many splits</li>
                  <li>Does not extrapolate beyond training range</li>
                  <li>Single trees overfit; use Random Forest instead</li>
                  <li>Target has noisy labels — leaves memorise noise</li>
                </ul>
              </div>
            </div>
            <Note>
              In practice, <b>single decision trees are rarely the final model</b>. They are
              excellent for EDA and feature importance, but ensembles (Random Forest,
              Gradient Boosting, XGBoost) almost always outperform a single tree.
            </Note>
          </>
        );
      },
    },
  ];

  // ── Input controls ──
  function renderInput(input, setInput) {
    return (
      <>
        <label className="nn-slider">
          <span className="nn-slider-l">petal_len</span>
          <input type="range" min="0.5" max="7" step="0.1"
            value={input.petal_len}
            onChange={e=>setInput({...input, petal_len:parseFloat(e.target.value)})}/>
          <span className="nn-slider-v">{fmt(input.petal_len)}</span>
        </label>
        <label className="nn-slider">
          <span className="nn-slider-l">petal_wid</span>
          <input type="range" min="0.1" max="2.5" step="0.1"
            value={input.petal_wid}
            onChange={e=>setInput({...input, petal_wid:parseFloat(e.target.value)})}/>
          <span className="nn-slider-v">{fmt(input.petal_wid)}</span>
        </label>
      </>
    );
  }

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title:    "Decision Tree",
    subtitle: "Classification · Iris Flowers",
    cur:      "Decision Tree",
    category: "ML Algorithms",
    run:       runDTreeCls,
    default:   DT_CLS.default,
    renderInput,
    modeLinks: [
      { label:"Classification", href:"Decision Tree (Classification).html", active: true  },
      { label:"Regression",     href:"Decision Tree (Regression).html",     active: false },
    ],
  };
})();
