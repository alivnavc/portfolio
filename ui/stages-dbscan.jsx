/* ============================================================
   DBSCAN — stages-dbscan.jsx  (11 stages)
   Requires: window.ML_DBSCAN (from model/ml-dbscan.js)
             window.{ Matrix, V, Sub, Sup, Formula, Lead, Note,
                      Row, Arrow, Tag, fmt } (from matrix.jsx)
   ============================================================ */
(function () {
  var _ref = window;
  var V = _ref.V, Sub = _ref.Sub, Sup = _ref.Sup, Formula = _ref.Formula,
      Lead = _ref.Lead, Note = _ref.Note, Row = _ref.Row, Tag = _ref.Tag, fmt = _ref.fmt;
  var useState = React.useState;
  var useRef = React.useRef;
  var useEffect = React.useEffect;
  var useMemo = React.useMemo;
  var DATA = window.ML_DBSCAN.DATA;

  // ── SVG chart dimensions ──
  var W = 460, H = 300;
  var PAD = { l: 36, r: 20, t: 20, b: 36 };
  var xMin = 0, xMax = 10, yMin = 0, yMax = 10;

  var sx = function(v) { return PAD.l + (v - xMin) / (xMax - xMin) * (W - PAD.l - PAD.r); };
  var sy = function(v) { return PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b); };

  var CLUSTER_COLORS = ["#2B5BFF", "#e0492e", "#1f9e6b", "#d97706"];
  var NOISE_COLOR = "#9ca3af";
  var CORE_FILL = "#2B5BFF";
  var BORDER_FILL = "#93c5fd";

  // ── DBSCANPlot component ──
  function DBSCANPlot(props) {
    var trace = props.trace;
    var showEps = props.showEps;
    var showTypes = props.showTypes;
    var highlightIdx = props.highlightIdx;

    var epsPixelRadius = trace.eps * (W - PAD.l - PAD.r) / (xMax - xMin);

    return (
      <svg width={W} height={H} style={{ maxWidth: "100%", display: "block", margin: "0 auto" }}>
        {/* grid lines */}
        {[2, 4, 6, 8].map(function(v) {
          return (
            <line key={"gx" + v} x1={PAD.l} y1={sy(v)} x2={W - PAD.r} y2={sy(v)}
              stroke="var(--line)" strokeWidth="0.5" strokeDasharray="3 3" />
          );
        })}
        {[2, 4, 6, 8].map(function(v) {
          return (
            <line key={"gy" + v} x1={sx(v)} y1={PAD.t} x2={sx(v)} y2={H - PAD.b}
              stroke="var(--line)" strokeWidth="0.5" strokeDasharray="3 3" />
          );
        })}
        {/* axes */}
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--ink)" strokeWidth="1.2" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--ink)" strokeWidth="1.2" />
        {/* eps circle around highlighted point */}
        {showEps && highlightIdx !== undefined && (
          <circle
            cx={sx(DATA[highlightIdx][0])} cy={sy(DATA[highlightIdx][1])}
            r={epsPixelRadius}
            fill="rgba(43,91,255,0.08)" stroke="#2B5BFF" strokeWidth="1.5" strokeDasharray="5 3"
          />
        )}
        {/* data points */}
        {DATA.map(function(p, i) {
          var isNoise = trace.labels[i] === -1;
          var isCore = trace.pointTypes[i] === "core";
          var col = isNoise ? NOISE_COLOR : CLUSTER_COLORS[trace.labels[i] % CLUSTER_COLORS.length];
          var isHighlight = i === highlightIdx;
          return (
            <circle key={i} cx={sx(p[0])} cy={sy(p[1])}
              r={isHighlight ? 8 : isCore ? 6.5 : 5}
              fill={col} opacity={isNoise ? 0.5 : 0.85}
              stroke={isHighlight ? "#000" : isCore ? "white" : "rgba(255,255,255,0.6)"}
              strokeWidth={isHighlight ? 2 : 1.2}
            />
          );
        })}
        {/* legend for point types */}
        {showTypes && (
          <g>
            <circle cx={PAD.l + 8} cy={PAD.t + 8} r={6} fill={CORE_FILL} stroke="white" strokeWidth="1.2" />
            <text x={PAD.l + 18} y={PAD.t + 12} fontSize="10" fill="var(--ink)">Core</text>
            <circle cx={PAD.l + 55} cy={PAD.t + 8} r={5} fill={BORDER_FILL} stroke="white" strokeWidth="1.2" />
            <text x={PAD.l + 65} y={PAD.t + 12} fontSize="10" fill="var(--ink)">Border</text>
            <circle cx={PAD.l + 110} cy={PAD.t + 8} r={5} fill={NOISE_COLOR} opacity="0.5" />
            <text x={PAD.l + 120} y={PAD.t + 12} fontSize="10" fill="var(--ink)">Noise</text>
          </g>
        )}
      </svg>
    );
  }

  // ── small illustration SVG for point type demos ──
  function PointTypeDemo(props) {
    var type = props.type;
    var DW = 200, DH = 180;
    var cx = DW / 2, cy = DH / 2;
    var eps = 55;

    if (type === "core") {
      var pts = [
        [cx, cy],
        [cx - 30, cy - 20], [cx + 28, cy - 18], [cx - 18, cy + 30],
        [cx + 32, cy + 22], [cx - 35, cy + 10], [cx + 10, cy - 38],
      ];
      return (
        <svg width={DW} height={DH} style={{ display: "block", margin: "0 auto" }}>
          <circle cx={cx} cy={cy} r={eps} fill="rgba(43,91,255,0.08)" stroke="#2B5BFF" strokeWidth="1.5" strokeDasharray="5 3" />
          {pts.map(function(p, i) {
            return (
              <circle key={i} cx={p[0]} cy={p[1]} r={i === 0 ? 7 : 5}
                fill={i === 0 ? "#2B5BFF" : "#93c5fd"} stroke="white" strokeWidth="1.2" />
            );
          })}
          <text x={cx} y={DH - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">6 neighbors inside eps</text>
        </svg>
      );
    }

    if (type === "border") {
      return (
        <svg width={DW} height={DH} style={{ display: "block", margin: "0 auto" }}>
          {/* core point's eps circle */}
          <circle cx={cx - 30} cy={cy} r={eps} fill="rgba(43,91,255,0.06)" stroke="#2B5BFF" strokeWidth="1.5" strokeDasharray="5 3" />
          {/* border point's small eps circle */}
          <circle cx={cx + 20} cy={cy + 10} r={30} fill="rgba(147,197,253,0.1)" stroke="#93c5fd" strokeWidth="1.2" strokeDasharray="3 3" />
          {/* core point */}
          <circle cx={cx - 30} cy={cy} r={7} fill="#2B5BFF" stroke="white" strokeWidth="1.2" />
          {/* border point */}
          <circle cx={cx + 20} cy={cy + 10} r={5} fill="#93c5fd" stroke="white" strokeWidth="1.2" />
          {/* a couple neighbors near core */}
          <circle cx={cx - 55} cy={cy - 20} r={5} fill="#93c5fd" stroke="white" strokeWidth="1" opacity="0.7" />
          <circle cx={cx - 40} cy={cy + 30} r={5} fill="#93c5fd" stroke="white" strokeWidth="1" opacity="0.7" />
          <text x={cx - 30} y={cy - eps - 8} textAnchor="middle" fontSize="10" fill="#2B5BFF">core</text>
          <text x={cx + 20} y={cy + 10 - 38} textAnchor="middle" fontSize="10" fill="#93c5fd">border</text>
          <text x={cx} y={DH - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">In core eps, too few own neighbors</text>
        </svg>
      );
    }

    // noise
    return (
      <svg width={DW} height={DH} style={{ display: "block", margin: "0 auto" }}>
        <circle cx={cx} cy={cy} r={45} fill="rgba(156,163,175,0.06)" stroke="#9ca3af" strokeWidth="1.2" strokeDasharray="4 3" />
        <circle cx={cx} cy={cy} r={5} fill="#9ca3af" opacity="0.5" />
        <circle cx={40} cy={40} r={7} fill="#2B5BFF" stroke="white" strokeWidth="1.2" opacity="0.4" />
        <circle cx={DW - 40} cy={DH - 40} r={7} fill="#2B5BFF" stroke="white" strokeWidth="1.2" opacity="0.4" />
        <text x={cx} y={DH - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">No core neighbor reachable</text>
      </svg>
    );
  }

  // ── k-distance plot SVG ──
  function KDistancePlot(props) {
    var minSamples = props.minSamples || 3;
    var n = DATA.length;

    // compute distance from each point to its k-th nearest neighbor
    var kDists = DATA.map(function(p, i) {
      var dists = DATA.map(function(q, j) {
        if (i === j) return Infinity;
        var dx = p[0] - q[0], dy = p[1] - q[1];
        return Math.sqrt(dx * dx + dy * dy);
      }).filter(function(d) { return d !== Infinity; });
      dists.sort(function(a, b) { return a - b; });
      return dists[minSamples - 1] || 0;
    });
    kDists.sort(function(a, b) { return a - b; });

    var PW = 400, PH = 180;
    var pPad = { l: 40, r: 20, t: 16, b: 36 };
    var maxD = Math.max.apply(null, kDists) * 1.1;
    var px = function(i) { return pPad.l + (i / (n - 1)) * (PW - pPad.l - pPad.r); };
    var py = function(d) { return pPad.t + (1 - d / maxD) * (PH - pPad.t - pPad.b); };

    // find elbow (largest gap)
    var elbow = 0;
    var maxGap = 0;
    for (var i = 1; i < kDists.length; i++) {
      var gap = kDists[i] - kDists[i - 1];
      if (gap > maxGap) { maxGap = gap; elbow = i; }
    }
    var elbowD = kDists[elbow];

    var pts = kDists.map(function(d, i) { return px(i) + "," + py(d); }).join(" ");

    return (
      <svg width={PW} height={PH} style={{ maxWidth: "100%", display: "block", margin: "0 auto" }}>
        {/* axes */}
        <line x1={pPad.l} y1={PH - pPad.b} x2={PW - pPad.r} y2={PH - pPad.b} stroke="var(--ink)" strokeWidth="1.2" />
        <line x1={pPad.l} y1={pPad.t} x2={pPad.l} y2={PH - pPad.b} stroke="var(--ink)" strokeWidth="1.2" />
        <text x={(pPad.l + PW - pPad.r) / 2} y={PH - 4} textAnchor="middle" fontSize="10" fill="var(--muted)">Points (sorted)</text>
        <text x={10} y={(pPad.t + PH - pPad.b) / 2} textAnchor="middle" fontSize="10" fill="var(--muted)"
          transform={"rotate(-90, 10, " + ((pPad.t + PH - pPad.b) / 2) + ")"}>k-dist</text>
        {/* elbow line */}
        <line x1={pPad.l} y1={py(elbowD)} x2={PW - pPad.r} y2={py(elbowD)}
          stroke="#e0492e" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
        <text x={PW - pPad.r - 2} y={py(elbowD) - 4} textAnchor="end" fontSize="10" fill="#e0492e">
          {"good eps ~" + elbowD.toFixed(2)}
        </text>
        {/* k-dist curve */}
        <polyline points={pts} fill="none" stroke="#2B5BFF" strokeWidth="2" />
        {/* elbow dot */}
        <circle cx={px(elbow)} cy={py(elbowD)} r={4} fill="#e0492e" stroke="white" strokeWidth="1.2" />
        <text x={px(elbow) + 6} y={py(elbowD) - 6} fontSize="10" fill="#e0492e" fontWeight="700">elbow</text>
      </svg>
    );
  }

  // ────────────────────────────────────────────────────────
  //  DBSCAN ANIMATION HELPERS
  // ────────────────────────────────────────────────────────

  function buildDBSCANFrames(eps, minSamples) {
    var frames = [];
    var n = DATA.length;

    function dist(i, j) {
      var dx = DATA[i][0] - DATA[j][0], dy = DATA[i][1] - DATA[j][1];
      return Math.sqrt(dx * dx + dy * dy);
    }
    function getNeighbors(i) {
      var ns = [];
      for (var j = 0; j < n; j++) { if (dist(i, j) <= eps) ns.push(j); }
      return ns;
    }

    var labels = new Array(n).fill(-2); // -2 = unvisited
    var clusterId = 0;

    frames.push({
      type: "raw",
      title: "Raw data — " + n + " unvisited points",
      desc: n + " points in two crescent arcs plus 4 isolated outliers. DBSCAN discovers clusters of any shape — you only need to set ε (radius) and minPts (density threshold). No k required.",
      labels: labels.slice(), visitIdx: -1, neighborIdxs: [], epsIdx: -1, isCore: false,
    });

    for (var i = 0; i < n; i++) {
      if (labels[i] !== -2) continue;
      var neighbors = getNeighbors(i);
      var isCore = neighbors.length >= minSamples;

      frames.push({
        type: isCore ? "core_visit" : "noise_visit",
        title: "Visiting point " + i + " — ε=" + eps + " circle",
        desc: "Found " + neighbors.length + " point" + (neighbors.length !== 1 ? "s" : "") + " within ε=" + eps + " (including self). " +
          (isCore
            ? neighbors.length + " ≥ minPts=" + minSamples + " → CORE POINT. Starting cluster " + (clusterId + 1) + " and expanding density-reachable region."
            : neighbors.length + " < minPts=" + minSamples + " → tentative noise (may become a border point if reached by a core point later)."),
        labels: labels.slice(), visitIdx: i, neighborIdxs: neighbors, epsIdx: i, isCore: isCore,
      });

      if (!isCore) {
        labels[i] = -1;
        continue;
      }

      labels[i] = clusterId;
      var seeds = neighbors.filter(function(j) { return j !== i; });
      var si = 0;
      while (si < seeds.length) {
        var q = seeds[si++];
        if (labels[q] === -1) labels[q] = clusterId;
        if (labels[q] !== -2) continue;
        labels[q] = clusterId;
        var qns = getNeighbors(q);
        if (qns.length >= minSamples) {
          qns.forEach(function(r) { if (seeds.indexOf(r) === -1) seeds.push(r); });
        }
      }

      var clusterSize = labels.filter(function(l) { return l === clusterId; }).length;
      frames.push({
        type: "cluster_done",
        title: "Cluster " + (clusterId + 1) + " fully expanded — " + clusterSize + " points",
        desc: "All density-reachable points absorbed. Core points drove the expansion outward; border points joined but had too few neighbors to add new seeds. The cluster boundary follows the data density.",
        labels: labels.slice(), visitIdx: -1, neighborIdxs: [], epsIdx: -1, isCore: false,
      });
      clusterId++;
    }

    var nNoise = labels.filter(function(l) { return l === -1; }).length;
    frames.push({
      type: "converged",
      title: "DBSCAN done — " + clusterId + " cluster" + (clusterId !== 1 ? "s" : "") + ", " + nNoise + " noise point" + (nNoise !== 1 ? "s" : ""),
      desc: "Gray × marks are noise — too isolated to join any cluster. The crescent shapes are discovered without K-Means' assumption of spherical clusters. Try changing ε or minPts to see how the result shifts.",
      labels: labels.slice(), visitIdx: -1, neighborIdxs: [], epsIdx: -1, isCore: false,
    });

    return frames;
  }

  var DBSCAN_FRAME_COLORS = { raw:"#94A2BC", core_visit:"#2B5BFF", noise_visit:"#e0492e", cluster_done:"#1f9e6b", converged:"#d97706" };

  function DBSCANAnimSVG({ frame, eps }) {
    var epsPixels = eps * (W - PAD.l - PAD.r) / (xMax - xMin);
    return (
      <svg width={W} height={H} style={{ maxWidth:"100%", display:"block", margin:"0 auto",
        border:"1px solid var(--line)", borderRadius:10, background:"var(--panel-solid)" }}>
        {[2,4,6,8].map(function(v) {
          return <line key={"g"+v} x1={PAD.l} y1={sy(v)} x2={W-PAD.r} y2={sy(v)}
            stroke="var(--line)" strokeWidth="0.5" strokeDasharray="3 3" />;
        })}
        <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="var(--ink)" strokeWidth="1.2" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H-PAD.b} stroke="var(--ink)" strokeWidth="1.2" />

        {frame.epsIdx >= 0 && (
          <circle cx={sx(DATA[frame.epsIdx][0])} cy={sy(DATA[frame.epsIdx][1])}
            r={epsPixels} fill="rgba(43,91,255,0.07)" stroke="#2B5BFF" strokeWidth="1.5" strokeDasharray="5 3" />
        )}

        {frame.visitIdx >= 0 && frame.neighborIdxs.map(function(ni, idx) {
          if (ni === frame.visitIdx) return null;
          return (
            <line key={idx}
              x1={sx(DATA[frame.visitIdx][0])} y1={sy(DATA[frame.visitIdx][1])}
              x2={sx(DATA[ni][0])} y2={sy(DATA[ni][1])}
              stroke="#2B5BFF" strokeWidth="0.8" opacity="0.22" />
          );
        })}

        {DATA.map(function(p, i) {
          var label = frame.labels[i];
          var col = label === -2 ? "#94A2BC" : label === -1 ? "#9ca3af" : CLUSTER_COLORS[label % CLUSTER_COLORS.length];
          var isVisit = i === frame.visitIdx;
          var isNeighbor = frame.neighborIdxs.indexOf(i) >= 0 && i !== frame.visitIdx;
          var haloCol = frame.isCore ? "#2B5BFF" : "#e0492e";
          return (
            <g key={i}>
              {isVisit && <circle cx={sx(p[0])} cy={sy(p[1])} r="16" fill={haloCol} opacity="0.12" />}
              <circle cx={sx(p[0])} cy={sy(p[1])} r={isVisit ? 7 : 5.5}
                fill={col} opacity={label === -2 ? 0.42 : 0.85}
                stroke={isVisit ? haloCol : isNeighbor ? "#2B5BFF" : "white"}
                strokeWidth={isVisit ? 2.5 : isNeighbor ? 1.8 : 1} />
              {label === -1 && (
                <>
                  <line x1={sx(p[0])-4} y1={sy(p[1])-4} x2={sx(p[0])+4} y2={sy(p[1])+4}
                    stroke="#9ca3af" strokeWidth="1.5" />
                  <line x1={sx(p[0])+4} y1={sy(p[1])-4} x2={sx(p[0])-4} y2={sy(p[1])+4}
                    stroke="#9ca3af" strokeWidth="1.5" />
                </>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  function DBSCANAnimator({ trace }) {
    var eps = trace.eps || 0.8;
    var minSamples = trace.minSamples || 3;
    var frames = useMemo(function() { return buildDBSCANFrames(eps, minSamples); }, [eps, minSamples]);
    var [frameIdx, setFrameIdx] = useState(0);
    var [playing, setPlaying] = useState(false);
    var timerRef = useRef(null);

    useEffect(function() { setFrameIdx(0); setPlaying(false); }, [eps, minSamples]);

    useEffect(function() {
      if (playing) {
        timerRef.current = setInterval(function() {
          setFrameIdx(function(f) {
            if (f >= frames.length - 1) { setPlaying(false); return f; }
            return f + 1;
          });
        }, 1400);
      } else {
        clearInterval(timerRef.current);
      }
      return function() { clearInterval(timerRef.current); };
    }, [playing, frames.length]);

    var cf = frames[Math.min(frameIdx, frames.length - 1)] || frames[0];
    var col = DBSCAN_FRAME_COLORS[cf.type] || "var(--accent)";
    var btnBase = { padding:"8px 15px", borderRadius:8, border:"1px solid var(--line)",
      fontWeight:700, fontSize:13, cursor:"pointer", background:"var(--panel-solid)", color:"var(--ink)", transition:"all .15s" };

    return (
      <>
        <DBSCANAnimSVG frame={cf} eps={eps} />

        <div style={{ background:"rgba(43,91,255,.06)", border:"1px solid rgba(43,91,255,.2)",
          borderRadius:10, padding:"12px 16px", margin:"10px 0" }}>
          <div style={{ fontWeight:800, fontSize:13, color:col, marginBottom:5 }}>{cf.title}</div>
          <div style={{ fontSize:13, color:"var(--ink)", lineHeight:1.65 }}>{cf.desc}</div>
        </div>

        <div style={{ display:"flex", gap:4, flexWrap:"wrap", margin:"8px 0", justifyContent:"center" }}>
          {frames.map(function(f, i) {
            var fc = DBSCAN_FRAME_COLORS[f.type] || "var(--accent)";
            return (
              <div key={i} onClick={function() { setFrameIdx(i); setPlaying(false); }}
                title={f.title}
                style={{ width:10, height:10, borderRadius:"50%", cursor:"pointer",
                  background: i === frameIdx ? fc : i < frameIdx ? fc+"55" : "var(--line)",
                  transition:"all .15s", transform: i === frameIdx ? "scale(1.5)" : "scale(1)" }} />
            );
          })}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6, flexWrap:"wrap", justifyContent:"center" }}>
          <button onClick={function() { setFrameIdx(0); setPlaying(false); }} style={btnBase}>&#9198; Reset</button>
          <button onClick={function() { setFrameIdx(Math.max(0, frameIdx-1)); setPlaying(false); }}
            style={{ ...btnBase, opacity: frameIdx === 0 ? 0.4 : 1 }} disabled={frameIdx === 0}>&#9664; Prev</button>
          <button onClick={function() { setPlaying(function(p) { return !p; }); }}
            style={{ ...btnBase, background: playing ? "var(--line)" : "var(--accent)", color: playing ? "var(--ink)" : "#fff", minWidth:80 }}>
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <button onClick={function() { setFrameIdx(Math.min(frames.length-1, frameIdx+1)); setPlaying(false); }}
            style={{ ...btnBase, opacity: frameIdx >= frames.length-1 ? 0.4 : 1 }} disabled={frameIdx >= frames.length-1}>Next &#9654;</button>
          <span style={{ fontSize:12, color:"var(--muted)" }}>{frameIdx+1}&nbsp;/&nbsp;{frames.length}</span>
        </div>

        <Note>
          <b>Blue circle</b> = ε-neighborhood. <b>Blue glow</b> = core point. <b>Red glow</b> = noise candidate.
          <b> Gray ×</b> = final noise. Change ε/minPts sliders above to rebuild the animation.
        </Note>
      </>
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 1: Overview
  // ────────────────────────────────────────────────────────
  var stageOverview = {
    id: "overview", group: "Overview", title: "What is DBSCAN?",
    map: "Overview",
    why: "DBSCAN finds clusters of any shape, automatically identifies outliers, and requires no k.",
    render: function(trace) {
      return (
        <>
          <Lead>
            <b>DBSCAN</b> (Density-Based Spatial Clustering of Applications with Noise) defines clusters
            as dense regions of points separated by sparse regions. Unlike K-Means: no k required,
            handles non-convex shapes, and labels outliers as noise automatically.
          </Lead>
          <Lead>
            The plot below shows our dataset — two crescent-shaped arcs that K-Means cannot separate,
            plus 4 outlier points (gray). DBSCAN correctly finds both arcs as separate clusters and
            explicitly labels the outliers as noise.
          </Lead>

          <DBSCANPlot trace={trace} showTypes={true} />

          <div style={{ marginTop: 18 }}>
            <div className="tf-subhead">DBSCAN vs K-Means — at a glance</div>
            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", minWidth: 480 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    {["", "K-Means", "DBSCAN"].map(function(h) {
                      return <th key={h} style={{ padding: "7px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 700 }}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Requires k", "Yes — upfront", "No"],
                    ["Cluster shape", "Convex only", "Any shape"],
                    ["Outlier handling", "None (assigned to nearest)", "Explicitly labeled as noise"],
                    ["Scales with", "Number of clusters", "Cluster density"],
                    ["Fails when", "Non-convex, unequal density", "Varying density"],
                    ["Key params", "k", "eps, min_samples"],
                  ].map(function(row) {
                    return (
                      <tr key={row[0]} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                        <td style={{ padding: "7px 12px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{row[0]}</td>
                        <td style={{ padding: "7px 12px", fontSize: 13, color: "var(--muted)", fontFamily: "var(--num-font)" }}>{row[1]}</td>
                        <td style={{ padding: "7px 12px", fontSize: 13, color: "var(--accent-ink)", fontWeight: 600, fontFamily: "var(--num-font)" }}>{row[2]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="tf-legend" style={{ marginTop: 16 }}>
            {[
              ["Dense region", "A neighborhood where many points cluster closely together. DBSCAN defines clusters by finding these dense regions."],
              ["Sparse region", "Areas with few points — these form the boundaries between clusters and where noise points live."],
              ["No k required", "DBSCAN discovers the number of clusters automatically based on density — you never have to guess k."],
              ["Noise detection", "Points that don't belong to any dense region are labeled noise (cluster = -1). This is free outlier detection."],
            ].map(function(item) {
              return (
                <div className="tf-leg" key={item[0]}>
                  <div className="tf-leg-name">{item[0]}</div>
                  <div className="tf-leg-desc">{item[1]}</div>
                </div>
              );
            })}
          </div>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 2: The Three Point Types
  // ────────────────────────────────────────────────────────
  var stageTypes = {
    id: "types", group: "Concepts", title: "Core, Border, and Noise Points",
    map: "Point Types",
    why: "DBSCAN classifies every point into one of three roles — this is the heart of the algorithm.",
    render: function(trace) {
      return (
        <>
          <Lead>
            DBSCAN classifies every point based on how many points are within its
            <b> epsilon-neighborhood</b>. The classification determines how the point
            participates in cluster formation.
          </Lead>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, margin: "16px 0" }}>
            {[
              { type: "core", color: CORE_FILL, label: "Core Point", desc: "Has >= min_samples neighbors within eps. Seeds and expands clusters." },
              { type: "border", color: BORDER_FILL, label: "Border Point", desc: "Inside a core point's eps, but has fewer than min_samples itself." },
              { type: "noise", color: NOISE_COLOR, label: "Noise Point", desc: "Not reachable from any core point. Labeled as outlier (-1)." },
            ].map(function(item) {
              return (
                <div key={item.type} style={{
                  background: "var(--panel-solid)", borderRadius: 10, padding: "12px",
                  border: "1.5px solid " + item.color + "44", textAlign: "center"
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 8 }}>{item.label}</div>
                  <PointTypeDemo type={item.type} />
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              );
            })}
          </div>

          <div style={{ overflowX: "auto", marginTop: 10 }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", minWidth: 460 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["Type", "Condition", "Role"].map(function(h) {
                    return <th key={h} style={{ padding: "7px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 700 }}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Core", "|N(eps, p)| >= min_samples", "Cluster seed, expands cluster"],
                  ["Border", "In a core point's eps-neighborhood, but |N(eps, p)| < min_samples", "Belongs to cluster, doesn't expand"],
                  ["Noise", "Not in any core point's eps-neighborhood", "Outlier, labeled -1"],
                ].map(function(row) {
                  return (
                    <tr key={row[0]} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "7px 12px", fontWeight: 700, color: "var(--accent-ink)" }}>{row[0]}</td>
                      <td style={{ padding: "7px 12px", fontFamily: "var(--num-font)", color: "var(--muted)", fontSize: 12 }}>{row[1]}</td>
                      <td style={{ padding: "7px 12px", color: "var(--ink)" }}>{row[2]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="tf-subhead">Current dataset — classified</div>
            <DBSCANPlot trace={trace} showTypes={true} />
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--muted)", margin: "8px 0", justifyContent: "center", flexWrap: "wrap" }}>
              <span><b style={{ color: CORE_FILL }}>{trace.nCore}</b> core points</span>
              <span><b style={{ color: BORDER_FILL }}>{trace.nBorder}</b> border points</span>
              <span><b style={{ color: NOISE_COLOR }}>{trace.nNoise}</b> noise points</span>
            </div>
          </div>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 3: Epsilon Neighborhood
  // ────────────────────────────────────────────────────────
  var stageEps = {
    id: "eps", group: "Concepts", title: "The epsilon-Neighborhood",
    map: "Epsilon",
    why: "epsilon is the radius that defines what 'nearby' means. It's the most important parameter.",
    render: function(trace) {
      // compute distances from DATA[0] to all other points
      var p0 = DATA[0];
      var dists = DATA.map(function(q, j) {
        var dx = p0[0] - q[0], dy = p0[1] - q[1];
        return { j: j, d: Math.sqrt(dx * dx + dy * dy) };
      });
      dists.sort(function(a, b) { return a.d - b.d; });
      var top10 = dists.slice(0, 10);

      return (
        <>
          <Lead>
            The <b>epsilon (eps) neighborhood</b> of a point p is the set of all points within distance eps:
            <b> N(eps, p) = {"{"}q in D : dist(p, q) {"<="} eps{"}"}</b>.
            DBSCAN uses Euclidean distance by default.
          </Lead>

          <div style={{
            background: "rgba(43,91,255,0.06)", borderRadius: 10, padding: "12px 16px",
            marginBottom: 14, border: "1.5px solid rgba(43,91,255,0.2)", textAlign: "center"
          }}>
            <div style={{ fontSize: 14, fontFamily: "var(--num-font)", color: "var(--accent-ink)", fontWeight: 700 }}>
              dist(p, q) = sqrt[(p1 - q1)^2 + (p2 - q2)^2]
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Euclidean distance — standard for DBSCAN</div>
          </div>

          <div className="tf-subhead">eps-circle around point 0 (highlighted)</div>
          <DBSCANPlot trace={trace} showEps={true} highlightIdx={0} />

          <div style={{ marginTop: 16 }}>
            <div className="tf-subhead">Distances from point 0 to nearest neighbors (eps = {trace.eps})</div>
            <div style={{ overflowX: "auto", marginTop: 8 }}>
              <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", maxWidth: 420 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    {["Rank", "Point", "Distance", "Within eps?"].map(function(h) {
                      return <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {top10.map(function(item, rank) {
                    var within = item.d <= trace.eps;
                    return (
                      <tr key={item.j} style={{ borderBottom: "1px solid var(--line-soft)", background: within ? "rgba(43,91,255,0.04)" : "transparent" }}>
                        <td style={{ padding: "5px 10px", color: "var(--faint)", fontFamily: "var(--num-font)" }}>{rank + 1}</td>
                        <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)" }}>
                          [{DATA[item.j][0]}, {DATA[item.j][1]}]
                        </td>
                        <td style={{ padding: "5px 10px", fontFamily: "var(--num-font)", fontWeight: 600,
                          color: within ? "var(--accent-ink)" : "var(--muted)" }}>
                          {item.d.toFixed(3)}
                        </td>
                        <td style={{ padding: "5px 10px", fontWeight: 700,
                          color: within ? "#1f9e6b" : "#e0492e" }}>
                          {item.d === 0 ? "self" : within ? "Yes" : "No"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Note>
            eps is sensitive to data scale — always scale your features (StandardScaler) before DBSCAN,
            just like KNN. Without scaling, features with large ranges dominate the distance metric.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 4: Playable Animation
  // ────────────────────────────────────────────────────────
  var stageAnimation = {
    id: "animation", group: "Algorithm", title: "Watch DBSCAN Cluster — Step by Step",
    map: "Animate",
    why: "Watching the ε-neighborhood expand reveals why DBSCAN finds non-convex shapes.",
    render: function(trace) {
      return (
        <>
          <Lead>
            Watch DBSCAN visit each unvisited point, draw the <b>ε-neighborhood circle</b>,
            decide if it is a <b>core point</b> (enough neighbors), and flood-fill the cluster.
            Points too isolated become <b>noise</b>.
            Press <b>▶ Play</b> or step manually. Sliders above change ε and minPts.
          </Lead>
          <DBSCANAnimator trace={trace} />
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 5: The Algorithm
  // ────────────────────────────────────────────────────────
  var stageAlgorithm = {
    id: "algorithm", group: "Algorithm", title: "How DBSCAN Works — Step by Step",
    map: "Algorithm",
    why: "DBSCAN's algorithm is elegant: find a dense seed, expand it, repeat.",
    render: function(trace) {
      var steps = [
        { n: 1, text: "Pick any unvisited point p", detail: "Iterate through all points; skip already-visited ones." },
        { n: 2, text: "Find all points within eps: N(eps, p)", detail: "Count all points q where dist(p, q) <= eps. This is the eps-neighborhood." },
        { n: 3, text: "If |N(eps, p)| < min_samples → mark p as NOISE", detail: "Not enough neighbors to form a cluster. Mark as noise and move on." },
        { n: 4, text: "If |N(eps, p)| >= min_samples → p is a CORE point", detail: "Enough density — start a new cluster. p becomes the seed." },
        { n: 5, text: "Add all points in N(eps, p) to the cluster", detail: "Even previously-marked noise points become border points if inside a core's neighborhood." },
        { n: 6, text: "For each new core point, expand its neighbors too", detail: "If a neighbor is also a core point, add its neighborhood to the cluster. Clusters grow recursively." },
        { n: 7, text: "Continue until no more core points to expand", detail: "The cluster is complete when all density-reachable points are assigned." },
        { n: 8, text: "Repeat from step 1 for remaining unvisited points", detail: "Each iteration either starts a new cluster or marks a point as noise." },
      ];

      return (
        <>
          <Lead>
            DBSCAN processes each unvisited point once. It either seeds a new cluster from a dense
            point, or marks a sparse point as noise. The cluster expansion step is what allows
            DBSCAN to find arbitrarily-shaped clusters.
          </Lead>

          <div style={{ margin: "16px 0" }}>
            {steps.map(function(s) {
              return (
                <div key={s.n} style={{
                  display: "flex", gap: 12, marginBottom: 10,
                  background: "var(--panel-solid)", borderRadius: 8,
                  padding: "10px 14px", border: "1px solid var(--line-soft)"
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", background: "var(--accent)",
                    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800, flexShrink: 0
                  }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{s.text}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{s.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="tf-subhead">Current clustering result</div>
            <DBSCANPlot trace={trace} showTypes={true} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div className="tf-subhead">Pseudocode</div>
            <pre style={{
              background: "var(--panel-solid)", border: "1px solid var(--line-soft)",
              borderRadius: 8, padding: "14px 16px", fontSize: 12,
              fontFamily: "var(--num-font)", color: "var(--ink)", overflowX: "auto",
              lineHeight: 1.7, margin: "8px 0 0"
            }}>{
"for each unvisited point p:\n" +
"  neighbors = get_neighbors(p, eps)\n" +
"  if len(neighbors) < min_samples:\n" +
"    label[p] = NOISE\n" +
"  else:\n" +
"    cluster_id++\n" +
"    expand_cluster(p, neighbors, cluster_id)\n\n" +
"def expand_cluster(p, seeds, cluster_id):\n" +
"  label[p] = cluster_id\n" +
"  while seeds not empty:\n" +
"    q = seeds.pop()\n" +
"    if label[q] == NOISE: label[q] = cluster_id  # border\n" +
"    if label[q] != UNVISITED: continue\n" +
"    label[q] = cluster_id\n" +
"    q_neighbors = get_neighbors(q, eps)\n" +
"    if len(q_neighbors) >= min_samples:\n" +
"      seeds += q_neighbors  # expand further"
            }</pre>
          </div>

          <Note>
            Time complexity is O(n * k) per point where k is the average neighborhood size.
            With a spatial index (ball tree or kd-tree), sklearn achieves O(n log n) overall.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 6: Cluster Expansion
  // ────────────────────────────────────────────────────────
  var stageExpand = {
    id: "expand", group: "Algorithm", title: "Density-Reachability and Cluster Expansion",
    map: "Expand",
    why: "Understanding density-reachability explains why DBSCAN can find arbitrarily-shaped clusters.",
    render: function(trace) {
      // Chain illustration points along an arc
      var chainPts = [
        [60, 130], [110, 90], [165, 70], [220, 75], [270, 100], [310, 130]
      ];
      var epsChain = 60;

      return (
        <>
          <Lead>
            DBSCAN defines clusters as <b>maximal sets of density-connected points</b>. This allows
            it to find any shape — crescents, spirals, irregular blobs — because reachability
            chains through dense regions rather than measuring distance to a centroid.
          </Lead>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "16px 0" }}>
            <div style={{ background: "rgba(224,73,46,0.06)", borderRadius: 10, padding: "12px", border: "1.5px solid rgba(224,73,46,0.2)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e0492e", marginBottom: 6, textAlign: "center" }}>
                K-Means — WRONG on arcs
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                K-Means assigns each point to its nearest centroid. For crescent shapes, the
                centroids land in the middle of each arc, splitting them horizontally into
                top-half and bottom-half — completely wrong clusters.
              </div>
            </div>
            <div style={{ background: "rgba(43,91,255,0.06)", borderRadius: 10, padding: "12px", border: "1.5px solid rgba(43,91,255,0.2)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#2B5BFF", marginBottom: 6, textAlign: "center" }}>
                DBSCAN — Correct on arcs
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                DBSCAN follows density chains. Each point on the arc is reachable from the next
                via overlapping eps-neighborhoods, so the entire crescent is discovered as one
                connected cluster.
              </div>
            </div>
          </div>

          <div className="tf-subhead">Our dataset — DBSCAN finds both arcs correctly</div>
          <DBSCANPlot trace={trace} showTypes={true} />

          <div style={{ marginTop: 16 }}>
            <div className="tf-subhead">Density-chain illustration — how points along an arc connect</div>
            <svg width={370} height={190} style={{ maxWidth: "100%", display: "block", margin: "0 auto" }}>
              {/* eps circles */}
              {chainPts.map(function(p, i) {
                return (
                  <circle key={"eps" + i} cx={p[0]} cy={p[1]} r={epsChain}
                    fill="rgba(43,91,255,0.05)" stroke="#2B5BFF" strokeWidth="1"
                    strokeDasharray="4 3" opacity="0.6" />
                );
              })}
              {/* connecting lines */}
              {chainPts.slice(0, -1).map(function(p, i) {
                return (
                  <line key={"link" + i} x1={p[0]} y1={p[1]}
                    x2={chainPts[i + 1][0]} y2={chainPts[i + 1][1]}
                    stroke="#2B5BFF" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.5" />
                );
              })}
              {/* points */}
              {chainPts.map(function(p, i) {
                return (
                  <circle key={"pt" + i} cx={p[0]} cy={p[1]} r={7}
                    fill="#2B5BFF" stroke="white" strokeWidth="1.5" />
                );
              })}
              <text x={185} y={185} textAnchor="middle" fontSize="11" fill="var(--muted)">
                Each point reaches the next via overlapping eps-circles
              </text>
            </svg>
          </div>

          <div className="tf-legend" style={{ marginTop: 16 }}>
            {[
              ["Density-reachable", "Point q is density-reachable from p if there is a chain of core points p1, p2, ... pk where p1=p, pk=q, and each is in the eps-neighborhood of the previous."],
              ["Density-connected", "Two points p and q are density-connected if there exists a point o from which both are density-reachable. This is the basis for cluster membership."],
              ["Why shape-agnostic", "Because connectivity is defined by local density chains, not global centroid distances, DBSCAN naturally follows the shape of data."],
            ].map(function(item) {
              return (
                <div className="tf-leg" key={item[0]}>
                  <div className="tf-leg-name">{item[0]}</div>
                  <div className="tf-leg-desc">{item[1]}</div>
                </div>
              );
            })}
          </div>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 7: Noise Detection
  // ────────────────────────────────────────────────────────
  var stageNoise = {
    id: "noise", group: "Algorithm", title: "Noise Points — Free Outlier Detection",
    map: "Noise",
    why: "DBSCAN is the only common clustering algorithm that explicitly identifies outliers.",
    render: function(trace) {
      return (
        <>
          <Lead>
            Points that are not density-reachable from any core point are labeled as
            <b> noise (cluster = -1)</b>. This is automatic outlier detection — a huge practical
            advantage over K-Means, which always assigns every point to some cluster.
          </Lead>

          <div style={{ display: "flex", gap: 12, margin: "12px 0", flexWrap: "wrap" }}>
            {[
              { label: trace.nClusters + " clusters", color: CORE_FILL, desc: "Dense regions found" },
              { label: trace.nCore + " core pts", color: CORE_FILL, desc: "Cluster seeds" },
              { label: trace.nBorder + " border pts", color: BORDER_FILL, desc: "Cluster edges" },
              { label: trace.nNoise + " noise pts", color: "#e0492e", desc: "Outliers detected" },
            ].map(function(item) {
              return (
                <div key={item.label} style={{
                  flex: "1 1 80px", background: item.color + "12", borderRadius: 8,
                  padding: "10px 12px", border: "1.5px solid " + item.color + "33", textAlign: "center"
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{item.desc}</div>
                </div>
              );
            })}
          </div>

          <DBSCANPlot trace={trace} showTypes={true} />

          <div style={{ marginTop: 14 }}>
            <div className="tf-subhead">Practical use cases for noise points</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              {[
                { domain: "Fraud Detection", detail: "Noise points are transactions that don't fit any behavioral cluster — high fraud probability.", color: "#e0492e" },
                { domain: "Customer Segmentation", detail: "Noise customers don't fit any segment — handle them differently or investigate.", color: "#d97706" },
                { domain: "Geospatial Analysis", detail: "Noise points are isolated GPS readings — likely GPS errors or one-off events.", color: "#1f9e6b" },
                { domain: "Manufacturing QA", detail: "Noise sensor readings fall outside all normal operating clusters — likely defects.", color: "#7c5cff" },
              ].map(function(item) {
                return (
                  <div key={item.domain} style={{
                    background: "var(--panel-solid)", borderRadius: 8, padding: "10px 12px",
                    border: "1px solid " + item.color + "33"
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.domain}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{item.detail}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <Note>
            Use the eps and min_samples sliders to see how the noise count changes.
            Smaller eps = more noise (stricter density). Larger eps = less noise (looser density).
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 8: Parameter Selection
  // ────────────────────────────────────────────────────────
  var stageParams = {
    id: "params", group: "Parameters", title: "How to Choose eps and min_samples",
    map: "Parameters",
    why: "DBSCAN's results are highly sensitive to eps and min_samples. Choosing them well is the main skill.",
    render: function(trace) {
      return (
        <>
          <Lead>
            Unlike K-Means (where you tune k with the elbow method), DBSCAN parameter selection
            uses domain knowledge and the <b>k-distance graph</b>. Getting these right is the main
            practical skill for DBSCAN.
          </Lead>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "14px 0" }}>
            <div style={{ background: "var(--panel-solid)", borderRadius: 10, padding: "14px", border: "1px solid var(--line-soft)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 10 }}>Choosing min_samples</div>
              {[
                "Rule of thumb: min_samples >= ln(n) for large datasets",
                "For 2D data: min_samples = 4 is the common default",
                "Higher min_samples → fewer, denser clusters, more noise",
                "Lower min_samples → more clusters, fewer noise points",
                "Noisy data: increase min_samples to reduce false clusters",
              ].map(function(t) {
                return (
                  <div key={t} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.5 }}>{t}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ background: "var(--panel-solid)", borderRadius: 10, padding: "14px", border: "1px solid var(--line-soft)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 10 }}>Choosing eps — k-distance graph</div>
              {[
                "For each point, compute distance to its k-th nearest neighbor (k = min_samples)",
                "Sort these distances and plot them ascending",
                "The 'elbow' in the plot is a good eps value",
                "Too small eps: almost everything becomes noise",
                "Too large eps: everything merged into one cluster",
              ].map(function(t) {
                return (
                  <div key={t} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                    <span style={{ color: "#e0492e", fontWeight: 700, flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.5 }}>{t}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="tf-subhead">k-distance graph (k = {trace.minSamples}) — elbow marks good eps</div>
            <KDistancePlot minSamples={trace.minSamples} />
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="tf-subhead">Effect of parameter changes on this dataset</div>
            <div style={{ overflowX: "auto", marginTop: 8 }}>
              <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", minWidth: 420 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    {["eps", "min_samples", "Effect"].map(function(h) {
                      return <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["0.3", "3", "Too strict: most points labeled as noise"],
                    ["0.8", "3", "Good: 2 clusters + 4 noise points detected"],
                    ["1.5", "3", "Too loose: all arcs merged into one cluster"],
                    ["0.8", "2", "More permissive: more border points, less noise"],
                    ["0.8", "6", "Stricter: fewer core points, more noise"],
                  ].map(function(row, i) {
                    var isCurrent = row[0] === String(trace.eps) && row[1] === String(trace.minSamples);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)",
                        background: isCurrent ? "rgba(43,91,255,0.06)" : "transparent" }}>
                        <td style={{ padding: "6px 10px", fontFamily: "var(--num-font)", fontWeight: isCurrent ? 700 : 400 }}>{row[0]}</td>
                        <td style={{ padding: "6px 10px", fontFamily: "var(--num-font)", fontWeight: isCurrent ? 700 : 400 }}>{row[1]}</td>
                        <td style={{ padding: "6px 10px", color: isCurrent ? "var(--accent-ink)" : "var(--muted)", fontWeight: isCurrent ? 600 : 400 }}>
                          {isCurrent ? "← current" : ""} {row[2]}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 9: DBSCAN vs K-Means
  // ────────────────────────────────────────────────────────
  var stageCompare = {
    id: "compare", group: "Insights", title: "DBSCAN vs K-Means — Decision Guide",
    map: "Compare",
    why: "The two algorithms are complements, not competitors — each has a specific domain.",
    render: function(trace) {
      return (
        <>
          <Lead>
            DBSCAN and K-Means solve different problems. The right choice depends on your cluster
            shapes, data noise, and whether you know k upfront. They are <b>complements</b>,
            not competitors.
          </Lead>

          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", minWidth: 520 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["Situation", "K-Means", "DBSCAN"].map(function(h) {
                    return <th key={h} style={{ padding: "7px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 700 }}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Clusters are roughly spherical", "Better", "Works but overkill"],
                  ["Clusters have arbitrary shape", "Fails", "Handles perfectly"],
                  ["Dataset has outliers", "Assigns outliers to cluster", "Explicit noise detection"],
                  ["You know k upfront", "Use it", "Doesn't use k"],
                  ["Clusters have very different densities", "Can handle", "Struggles"],
                  ["Very large dataset (millions)", "Scales well", "Slow without spatial index"],
                  ["Need interpretable centroids", "Has centroids", "No centroids"],
                  ["Geospatial data (lat/lng)", "Distance distortion", "Haversine kernel works"],
                  ["Customer segmentation", "Usually fine", "Better if irregular"],
                  ["Anomaly detection", "No native support", "Noise points = anomalies"],
                ].map(function(row, i) {
                  var kmBetter = ["Clusters are roughly spherical","You know k upfront","Very large dataset (millions)","Need interpretable centroids","Customer segmentation"].indexOf(row[0]) >= 0;
                  var dbBetter = ["Clusters have arbitrary shape","Dataset has outliers","Geospatial data (lat/lng)","Anomaly detection"].indexOf(row[0]) >= 0;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "7px 12px", fontWeight: 600, color: "var(--ink)" }}>{row[0]}</td>
                      <td style={{ padding: "7px 12px", color: kmBetter ? "#1f9e6b" : "var(--muted)", fontWeight: kmBetter ? 700 : 400 }}>
                        {kmBetter ? "✓ " : ""}{row[1]}
                      </td>
                      <td style={{ padding: "7px 12px", color: dbBetter ? "#1f9e6b" : "var(--muted)", fontWeight: dbBetter ? 700 : 400 }}>
                        {dbBetter ? "✓ " : ""}{row[2]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
            <div style={{ background: "rgba(31,158,107,0.07)", borderRadius: 10, padding: "14px", border: "1.5px solid rgba(31,158,107,0.25)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1f9e6b", marginBottom: 8 }}>Use K-Means when…</div>
              <ul style={{ fontSize: 12, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
                <li>Clusters are roughly equal-sized blobs</li>
                <li>You know k from domain knowledge</li>
                <li>Dataset is very large (millions of points)</li>
                <li>You need cluster centroids for interpretation</li>
                <li>Speed is critical</li>
              </ul>
            </div>
            <div style={{ background: "rgba(43,91,255,0.07)", borderRadius: 10, padding: "14px", border: "1.5px solid rgba(43,91,255,0.25)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2B5BFF", marginBottom: 8 }}>Use DBSCAN when…</div>
              <ul style={{ fontSize: 12, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
                <li>Clusters are irregularly shaped</li>
                <li>Dataset contains outliers/anomalies</li>
                <li>You don't know k in advance</li>
                <li>Geospatial or density-based data</li>
                <li>Outlier detection is the goal</li>
              </ul>
            </div>
          </div>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 10: Limitations
  // ────────────────────────────────────────────────────────
  var stageLimits = {
    id: "limits", group: "Insights", title: "When DBSCAN Struggles",
    map: "Limitations",
    why: "DBSCAN has one critical weakness that causes most real-world failures.",
    render: function(trace) {
      return (
        <>
          <Lead>
            DBSCAN's biggest weakness is <b>varying cluster density</b>. It uses a single global
            eps — so dense and sparse clusters cannot both be handled correctly simultaneously.
            Understanding this failure mode prevents misapplication.
          </Lead>

          <div style={{ marginTop: 14 }}>
            {[
              {
                title: "Varying Density",
                icon: "⚡",
                color: "#e0492e",
                detail: "A single eps cannot capture both a dense cluster (tight points) and a sparse cluster (spread out points). If eps is small enough for the dense cluster, the sparse cluster splits into noise. If eps is large enough for the sparse cluster, the dense cluster merges with its neighbors.",
                fix: "Use HDBSCAN — hierarchical DBSCAN — which automatically finds variable-density clusters."
              },
              {
                title: "High-Dimensional Data",
                icon: "📐",
                color: "#d97706",
                detail: "Euclidean distance degrades in more than 20 dimensions due to the curse of dimensionality. All points become equidistant, making eps meaningless. DBSCAN essentially sees every point as either all-neighbors or no-neighbors.",
                fix: "Reduce dimensions with PCA or UMAP first. Or use a domain-appropriate distance metric (cosine for text)."
              },
              {
                title: "No Centroids",
                icon: "📍",
                color: "#7c5cff",
                detail: "DBSCAN produces no cluster centers. You cannot describe a DBSCAN cluster as 'average age 35, average income $60k'. For interpretable cluster summaries, you need K-Means or Gaussian Mixture Models.",
                fix: "Post-process: compute the mean of each DBSCAN cluster manually if needed."
              },
              {
                title: "Parameter Sensitivity",
                icon: "🎛",
                color: "#94A2BC",
                detail: "Small changes in eps can dramatically change results — a cluster of 50 points can become 4 noise points with a 0.1 change in eps. The k-distance graph helps but requires judgment.",
                fix: "Always plot the k-distance graph. Try multiple eps values (0.5x, 1x, 2x the elbow value)."
              },
              {
                title: "Scale: O(n²) Brute Force",
                icon: "🐌",
                color: "#1f9e6b",
                detail: "Without a spatial index, DBSCAN computes all n x n pairwise distances — O(n²). For 100k points that's 10 billion distances. Sklearn's ball tree or kd-tree brings this to O(n log n) for low dimensions.",
                fix: "Set algorithm='ball_tree' in sklearn for low-dim data. For millions of points, use HDBSCAN or approximate methods."
              },
            ].map(function(item) {
              return (
                <div key={item.title} style={{
                  background: "var(--panel-solid)", borderRadius: 10, padding: "14px",
                  border: "1px solid " + item.color + "33", marginBottom: 10
                }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: item.color + "18",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0
                    }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.6, marginBottom: 6 }}>{item.detail}</div>
                      <div style={{ fontSize: 12, background: item.color + "10", borderRadius: 6, padding: "6px 10px", color: item.color, fontWeight: 600 }}>
                        Fix: {item.fix}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Note>
            For varying density clusters, HDBSCAN (Hierarchical DBSCAN) is the modern replacement.
            It runs DBSCAN across all possible eps values and selects the most stable clusters.
            Available as the hdbscan Python package and in sklearn 1.3+.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 11: Hyperparameters
  // ────────────────────────────────────────────────────────
  var stageHyperparams = {
    id: "hyperparams", group: "Hyperparameters", title: "DBSCAN Hyperparameters",
    map: "Hyperparams",
    why: "Two parameters, but getting them right is crucial.",
    render: function(trace) {
      return (
        <>
          <Lead>
            DBSCAN has just two core parameters — but their interaction is non-linear and
            highly data-dependent. The sklearn implementation exposes additional parameters
            for performance tuning.
          </Lead>

          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", minWidth: 540 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  {["Parameter", "What it does", "Default", "How to tune"].map(function(h) {
                    return <th key={h} style={{ padding: "7px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 700 }}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {[
                  ["eps", "eps-neighborhood radius — core distance threshold", "0.5", "k-distance graph elbow; try 0.5x, 1x, 2x elbow value"],
                  ["min_samples", "Min points for core point classification", "5", ">= ln(n) for large data; 4 for 2D; higher = stricter"],
                  ["metric", "Distance function between points", "'euclidean'", "'haversine' for geo, 'cosine' for text, 'manhattan' for high-dim"],
                  ["algorithm", "Nearest neighbor algorithm", "'auto'", "'ball_tree' for low-dim, 'brute' for high-dim (>20 features)"],
                  ["leaf_size", "Leaf size for ball_tree/kd_tree", "30", "Affects speed not results; increase to reduce memory"],
                  ["n_jobs", "Parallelism — number of cores", "1", "-1 to use all cores; speeds up neighbor search significantly"],
                ].map(function(row, i) {
                  var isKey = i < 2;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)", background: isKey ? "rgba(43,91,255,0.04)" : "transparent" }}>
                      <td style={{ padding: "8px 12px", fontFamily: "var(--num-font)", fontWeight: 700, color: isKey ? "var(--accent-ink)" : "var(--ink)" }}>
                        {row[0]}
                      </td>
                      <td style={{ padding: "8px 12px", color: "var(--ink)", fontSize: 12 }}>{row[1]}</td>
                      <td style={{ padding: "8px 12px", fontFamily: "var(--num-font)", color: "var(--muted)" }}>{row[2]}</td>
                      <td style={{ padding: "8px 12px", color: "var(--muted)", fontSize: 12 }}>{row[3]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="tf-subhead">Current parameters</div>
            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{
                background: "rgba(43,91,255,0.08)", borderRadius: 8, padding: "10px 16px",
                border: "1.5px solid rgba(43,91,255,0.25)"
              }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>eps</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-ink)", fontFamily: "var(--num-font)" }}>{trace.eps}</div>
              </div>
              <div style={{
                background: "rgba(224,73,46,0.08)", borderRadius: 8, padding: "10px 16px",
                border: "1.5px solid rgba(224,73,46,0.25)"
              }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>min_samples</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#e0492e", fontFamily: "var(--num-font)" }}>{trace.minSamples}</div>
              </div>
              <div style={{
                background: "rgba(31,158,107,0.08)", borderRadius: 8, padding: "10px 16px",
                border: "1.5px solid rgba(31,158,107,0.25)"
              }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>clusters found</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#1f9e6b", fontFamily: "var(--num-font)" }}>{trace.nClusters}</div>
              </div>
              <div style={{
                background: "rgba(156,163,175,0.12)", borderRadius: 8, padding: "10px 16px",
                border: "1.5px solid rgba(156,163,175,0.3)"
              }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>noise points</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#9ca3af", fontFamily: "var(--num-font)" }}>{trace.nNoise}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="tf-subhead">sklearn quick-start</div>
            <pre style={{
              background: "var(--panel-solid)", border: "1px solid var(--line-soft)",
              borderRadius: 8, padding: "14px 16px", fontSize: 12,
              fontFamily: "var(--num-font)", color: "var(--ink)", overflowX: "auto",
              lineHeight: 1.7, margin: "8px 0 0"
            }}>{
"from sklearn.cluster import DBSCAN\n" +
"from sklearn.preprocessing import StandardScaler\n\n" +
"# Always scale first!\n" +
"X_scaled = StandardScaler().fit_transform(X)\n\n" +
"# Fit DBSCAN\n" +
"db = DBSCAN(eps=0.5, min_samples=5, n_jobs=-1)\n" +
"labels = db.fit_predict(X_scaled)\n\n" +
"# labels[i] == -1  →  noise point\n" +
"# labels[i] >= 0   →  cluster id\n" +
"n_clusters = len(set(labels)) - (1 if -1 in labels else 0)\n" +
"n_noise = list(labels).count(-1)"
            }</pre>
          </div>

          <Note>
            HDBSCAN (sklearn 1.3+) is a drop-in improvement over DBSCAN: it handles varying
            density, requires only min_samples (not eps), and produces a cluster hierarchy.
            For new projects, prefer HDBSCAN unless you specifically need classic DBSCAN behavior.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE REGISTRY
  // ────────────────────────────────────────────────────────
  var STAGES = [
    stageOverview,
    stageTypes,
    stageEps,
    stageAnimation,
    stageAlgorithm,
    stageExpand,
    stageNoise,
    stageParams,
    stageCompare,
    stageLimits,
    stageHyperparams,
  ];

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "DBSCAN",
    subtitle: "Density-based clustering with noise detection",
    cur: "DBSCAN",
    category: "Clustering",
    run: window.ML_DBSCAN.run,
    default: { eps: 0.8, minSamples: 3 },
    modeLinks: [
      { label: "K-Means", href: "K-Means.html", active: false },
      { label: "DBSCAN", href: "DBSCAN.html", active: true },
      { label: "Hierarchical", href: "Hierarchical.html", active: false },
    ],
    renderInput: function(input, setInput, trace) {
      return (
        <>
          <label className="nn-slider">
            <span className="nn-slider-l">eps</span>
            <input type="range" min="0.3" max="1.8" step="0.1" value={input.eps}
              onChange={function(e) { setInput(Object.assign({}, input, { eps: parseFloat(e.target.value) })); }} />
            <span className="nn-slider-v">{input.eps}</span>
          </label>
          <label className="nn-slider">
            <span className="nn-slider-l">min pts</span>
            <input type="range" min="2" max="6" step="1" value={input.minSamples}
              onChange={function(e) { setInput(Object.assign({}, input, { minSamples: parseInt(e.target.value) })); }} />
            <span className="nn-slider-v">{input.minSamples}</span>
          </label>
          <span style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 4 }}>
            {trace.nClusters} clusters {"·"} <b style={{ color: "#e0492e" }}>{trace.nNoise} noise</b>
          </span>
        </>
      );
    },
  };
})();
