/* ============================================================
   K-Means Clustering — stages-kmeans.jsx  (12 stages)
   Requires: window.ML_KMEANS (from model/ml-kmeans.js)
             window.{ V, Sub, Sup, Formula, Lead, Note, Row, Tag, fmt }
   ============================================================ */
(function () {
  const { useState, useRef, useEffect, useMemo } = React;
  const { V, Sub, Sup, Formula, Lead, Note, Row, Tag, fmt } = window;
  const { DATA, COLORS, runKMeans, elbowData } = window.ML_KMEANS;

  // SVG canvas: 460x300, all cluster points in range [0,10]x[0,10]
  const W = 460, H = 300;
  const PAD = { l: 36, r: 20, t: 20, b: 36 };
  const xMin = 0, xMax = 10, yMin = 0, yMax = 10;
  const sx = function(v) { return PAD.l + (v - xMin) / (xMax - xMin) * (W - PAD.l - PAD.r); };
  const sy = function(v) { return PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b); };

  const codeBlock = function(code) {
    return (
      <pre style={{ background:"#f5f5f5", padding:"12px 16px", borderRadius:8,
        fontSize:12, overflowX:"auto", fontFamily:"monospace", lineHeight:1.6,
        margin:"10px 0", border:"1px solid #e0e0e0" }}>
        <code>{code}</code>
      </pre>
    );
  };

  // ── Scatter axes ──
  function ScatterAxes() {
    const xTicks = [0, 2, 4, 6, 8, 10];
    const yTicks = [0, 2, 4, 6, 8, 10];
    return (
      <>
        {yTicks.map(function(v) {
          return (
            <line key={v} x1={PAD.l} y1={sy(v)} x2={W - PAD.r} y2={sy(v)}
              stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" />
          );
        })}
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--ink)" strokeWidth="1.4" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--ink)" strokeWidth="1.4" />
        {xTicks.map(function(v) {
          return (
            <g key={v}>
              <line x1={sx(v)} y1={H - PAD.b} x2={sx(v)} y2={H - PAD.b + 4} stroke="var(--ink)" strokeWidth="1" />
              <text x={sx(v)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--muted)">{v}</text>
            </g>
          );
        })}
        {yTicks.map(function(v) {
          return (
            <g key={v}>
              <line x1={PAD.l - 4} y1={sy(v)} x2={PAD.l} y2={sy(v)} stroke="var(--ink)" strokeWidth="1" />
              <text x={PAD.l - 6} y={sy(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{v}</text>
            </g>
          );
        })}
      </>
    );
  }

  // ── ClusterPlot component ──
  function ClusterPlot({ assignments, centroids, allGray }) {
    const k = centroids ? centroids.length : 0;
    return (
      <svg width={W} height={H} style={{maxWidth:"100%",display:"block",margin:"0 auto"}}>
        <ScatterAxes />
        {DATA.map(function(p, i) {
          var col = allGray ? "#94A2BC" : COLORS[(assignments ? assignments[i] : 0) % COLORS.length];
          return <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r="5.5" fill={col} opacity="0.8" stroke="white" strokeWidth="1.2" />;
        })}
        {centroids && centroids.map(function(c, ki) {
          var col = COLORS[ki % COLORS.length];
          return (
            <g key={ki}>
              <circle cx={sx(c[0])} cy={sy(c[1])} r="10" fill={col} opacity="0.25" />
              <circle cx={sx(c[0])} cy={sy(c[1])} r="7" fill="none" stroke={col} strokeWidth="2.5" />
              <line x1={sx(c[0])-6} y1={sy(c[1])} x2={sx(c[0])+6} y2={sy(c[1])} stroke={col} strokeWidth="2.5" />
              <line x1={sx(c[0])} y1={sy(c[1])-6} x2={sx(c[0])} y2={sy(c[1])+6} stroke={col} strokeWidth="2.5" />
            </g>
          );
        })}
      </svg>
    );
  }

  // ── TrailPlot — centroid movement trail ──
  function TrailPlot({ history, assignments, step }) {
    var k = history[0].length;
    var visStep = Math.min(step, history.length - 1);
    return (
      <svg width={W} height={H} style={{maxWidth:"100%",display:"block",margin:"0 auto"}}>
        <ScatterAxes />
        {DATA.map(function(p, i) {
          var col = COLORS[(assignments ? assignments[i] : 0) % COLORS.length];
          return <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r="5.5" fill={col} opacity="0.5" stroke="white" strokeWidth="1.2" />;
        })}
        {Array.from({length: k}, function(_, ki) {
          var col = COLORS[ki % COLORS.length];
          var trailPts = [];
          for (var s = 0; s <= visStep && s < history.length; s++) {
            trailPts.push(history[s][ki]);
          }
          return (
            <g key={ki}>
              {trailPts.slice(1).map(function(pt, idx) {
                var prev = trailPts[idx];
                return (
                  <line key={idx}
                    x1={sx(prev[0])} y1={sy(prev[1])}
                    x2={sx(pt[0])} y2={sy(pt[1])}
                    stroke={col} strokeWidth="1.8" strokeDasharray="4 2" opacity="0.6" />
                );
              })}
              {trailPts.map(function(pt, idx) {
                var isLast = idx === trailPts.length - 1;
                return (
                  <circle key={idx} cx={sx(pt[0])} cy={sy(pt[1])} r={isLast ? 7 : 4}
                    fill={col} opacity={isLast ? 1 : 0.35} stroke="white" strokeWidth="1.5" />
                );
              })}
              {trailPts.length > 0 && (
                <>
                  <line x1={sx(trailPts[trailPts.length-1][0])-5} y1={sy(trailPts[trailPts.length-1][1])}
                        x2={sx(trailPts[trailPts.length-1][0])+5} y2={sy(trailPts[trailPts.length-1][1])}
                        stroke={col} strokeWidth="2.5" />
                  <line x1={sx(trailPts[trailPts.length-1][0])} y1={sy(trailPts[trailPts.length-1][1])-5}
                        x2={sx(trailPts[trailPts.length-1][0])} y2={sy(trailPts[trailPts.length-1][1])+5}
                        stroke={col} strokeWidth="2.5" />
                </>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // ── ElbowChart component ──
  function ElbowChart() {
    var eW = 380, eH = 180;
    var ePad = { l: 55, r: 20, t: 16, b: 36 };
    var kMax = elbowData.length;
    var maxInertia = elbowData[0].inertia;
    var ex = function(k) { return ePad.l + (k-1)/(kMax-1) * (eW - ePad.l - ePad.r); };
    var ey = function(v) { return ePad.t + (1 - v/maxInertia) * (eH - ePad.t - ePad.b); };
    var pts = elbowData.map(function(d) { return ex(d.k) + "," + ey(d.inertia); }).join(" ");
    return (
      <svg width={eW} height={eH} style={{maxWidth:"100%",display:"block",margin:"0 auto"}}>
        <line x1={ePad.l} y1={eH-ePad.b} x2={eW-ePad.r} y2={eH-ePad.b} stroke="var(--ink)" strokeWidth="1.4"/>
        <line x1={ePad.l} y1={ePad.t} x2={ePad.l} y2={eH-ePad.b} stroke="var(--ink)" strokeWidth="1.4"/>
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2.2"/>
        {elbowData.map(function(d) {
          var isElbow = d.k === 3;
          return (
            <g key={d.k}>
              <circle cx={ex(d.k)} cy={ey(d.inertia)} r={isElbow ? 7 : 4.5} fill={isElbow ? "#e0492e" : "var(--accent)"} />
              <text x={ex(d.k)} y={eH-ePad.b+14} textAnchor="middle" fontSize="10" fill="var(--muted)">{d.k}</text>
            </g>
          );
        })}
        <text x={(ePad.l+eW-ePad.r)/2} y={eH-2} textAnchor="middle" fontSize="11" fill="var(--muted)">k (number of clusters)</text>
        <text x={12} y={(ePad.t+eH-ePad.b)/2} textAnchor="middle" fontSize="11" fill="var(--muted)"
          transform={"rotate(-90,12," + ((ePad.t+eH-ePad.b)/2) + ")"}>WCSS (inertia)</text>
        <text x={ex(3)+10} y={ey(elbowData[2].inertia)-8} fontSize="11" fill="#e0492e" fontWeight="700">elbow (k=3)</text>
      </svg>
    );
  }

  // ── Failure mode sketch SVG ──
  function FailureSVG({ type, label }) {
    var fw = 200, fh = 140;
    var dots = [];
    if (type === "nonconvex") {
      // two crescent-like arcs of dots
      for (var a = 0; a < 8; a++) {
        var ang = (a / 7) * Math.PI;
        dots.push({ x: 50 + 35 * Math.cos(ang), y: 70 + 35 * Math.sin(ang), col: "#2B5BFF" });
        dots.push({ x: 120 + 35 * Math.cos(ang + Math.PI), y: 70 + 35 * Math.sin(ang + Math.PI), col: "#e0492e" });
      }
    } else if (type === "sizes") {
      var bigPts = [[30,40],[45,60],[25,70],[55,50],[35,80],[60,65],[40,45],[50,75]];
      var smallPts = [[150,55],[160,65],[155,50]];
      bigPts.forEach(function(p) { dots.push({ x:p[0], y:p[1], col:"#2B5BFF" }); });
      smallPts.forEach(function(p) { dots.push({ x:p[0], y:p[1], col:"#e0492e" }); });
    } else if (type === "density") {
      // dense cluster left, sparse cluster right
      var densePts = [[30,50],[35,55],[32,60],[28,52],[38,58],[33,45],[36,62],[31,57]];
      var sparsePts = [[110,30],[160,80],[140,50],[170,40],[120,90],[155,70]];
      densePts.forEach(function(p) { dots.push({ x:p[0], y:p[1], col:"#2B5BFF" }); });
      sparsePts.forEach(function(p) { dots.push({ x:p[0], y:p[1], col:"#e0492e" }); });
    } else if (type === "outlier") {
      var mainPts = [[60,60],[70,50],[65,70],[75,60],[80,50],[55,65],[72,75],[68,55]];
      mainPts.forEach(function(p) { dots.push({ x:p[0], y:p[1], col:"#2B5BFF" }); });
      dots.push({ x:180, y:20, col:"#e0492e" });
    }
    return (
      <svg width={fw} height={fh} style={{display:"block",margin:"0 auto",overflow:"visible"}}>
        {dots.map(function(d, i) {
          return <circle key={i} cx={d.x} cy={d.y} r="5" fill={d.col} opacity="0.8" />;
        })}
        <text x={fw/2} y={fh-4} textAnchor="middle" fontSize="11" fill="var(--muted)">{label}</text>
      </svg>
    );
  }

  // ── Silhouette bar chart ──
  function SilhouetteBar({ scores, assignments, k }) {
    var bW = 380, bH = 160;
    var bPad = { l: 20, r: 20, t: 20, b: 30 };
    var n = scores.length;
    var barW = (bW - bPad.l - bPad.r) / n - 1;
    var midY = bPad.t + (bH - bPad.t - bPad.b) / 2;
    var scale = Math.max(1, Math.max.apply(null, scores.map(Math.abs)));
    var heightPerUnit = (bH - bPad.t - bPad.b) / 2;
    return (
      <svg width={bW} height={bH} style={{maxWidth:"100%",display:"block",margin:"0 auto"}}>
        <line x1={bPad.l} y1={midY} x2={bW-bPad.r} y2={midY} stroke="var(--ink)" strokeWidth="1.2" />
        {scores.map(function(s, i) {
          var col = COLORS[(assignments[i] || 0) % COLORS.length];
          var barH = Math.abs(s) / scale * heightPerUnit;
          var y = s >= 0 ? midY - barH : midY;
          return (
            <rect key={i} x={bPad.l + i * (barW + 1)} y={y} width={barW} height={barH}
              fill={col} opacity="0.75" rx="1" />
          );
        })}
        <text x={bPad.l-4} y={bPad.t+4} textAnchor="end" fontSize="9" fill="var(--muted)">+1</text>
        <text x={bPad.l-4} y={bH-bPad.b} textAnchor="end" fontSize="9" fill="var(--muted)">-1</text>
        <text x={bPad.l-4} y={midY+4} textAnchor="end" fontSize="9" fill="var(--muted)">0</text>
        <text x={(bPad.l+bW-bPad.r)/2} y={bH-4} textAnchor="middle" fontSize="11" fill="var(--muted)">Data points (colored by cluster)</text>
      </svg>
    );
  }

  // ────────────────────────────────────────────────────────
  //  ANIMATION HELPERS
  // ────────────────────────────────────────────────────────

  function buildAnimFrames(k, result) {
    var frames = [];
    var hist = result.history;
    var maxIter = hist.length - 1;

    // Frame 0: raw unlabeled data
    frames.push({
      type: "raw",
      title: "Raw unlabeled data — no clusters yet",
      desc: "30 data points with no labels. K-Means will discover " + k + " hidden groups without any supervision. Watch how it learns from scratch.",
      centroids: [],
      assignments: null,
      showLines: false,
      arrows: null,
      newIdx: -1,
    });

    // Init frames: one per centroid appearing
    for (var ki = 0; ki < k; ki++) {
      frames.push({
        type: "init",
        title: "K-Means++ Init — placing centroid " + (ki + 1) + " of " + k,
        desc: ki === 0
          ? "Step 1: Pick the first centroid (μ1) uniformly at random from the data. It becomes the anchor for everything that follows."
          : "K-Means++ trick: pick the next centroid with probability proportional to D(x)² — the squared distance to the nearest already-placed centroid. This deliberately spreads centroids far apart, giving a much better starting point than pure random.",
        centroids: hist[0].slice(0, ki + 1),
        assignments: null,
        showLines: false,
        arrows: null,
        newIdx: ki,
      });
    }

    // Assign + Update frames for each iteration
    for (var iter = 0; iter < maxIter; iter++) {
      var curC = hist[iter];
      var nextC = hist[iter + 1];

      // Compute assignments for current centroids
      var ass = DATA.map(function(p) {
        var bestD = Infinity, bestK = 0;
        for (var j = 0; j < k; j++) {
          var d = (p[0]-curC[j][0])*(p[0]-curC[j][0]) + (p[1]-curC[j][1])*(p[1]-curC[j][1]);
          if (d < bestD) { bestD = d; bestK = j; }
        }
        return bestK;
      });

      frames.push({
        type: "assign",
        title: "Iteration " + (iter + 1) + " — Assignment step",
        desc: "Every point measures its Euclidean distance to each of the " + k + " centroids and joins the closest one. The dashed lines show which centroid each point was assigned to. This re-draws the cluster boundaries.",
        centroids: curC,
        assignments: ass,
        showLines: true,
        arrows: null,
        newIdx: -1,
      });

      frames.push({
        type: "update",
        title: "Iteration " + (iter + 1) + " — Update step",
        desc: "Each centroid moves to the mean (average x, average y) of all its assigned points. Arrows show the movement. This step always decreases WCSS — that is why K-Means always converges.",
        centroids: nextC,
        assignments: ass,
        showLines: false,
        arrows: curC.map(function(c, ki2) { return { from: c, to: nextC[ki2] }; }),
        newIdx: -1,
      });
    }

    // Converged frame
    var finalC = hist[hist.length - 1];
    var finalAss = DATA.map(function(p) {
      var bestD = Infinity, bestK = 0;
      for (var j = 0; j < k; j++) {
        var d = (p[0]-finalC[j][0])*(p[0]-finalC[j][0]) + (p[1]-finalC[j][1])*(p[1]-finalC[j][1]);
        if (d < bestD) { bestD = d; bestK = j; }
      }
      return bestK;
    });

    frames.push({
      type: "converged",
      title: "Converged — final clusters found",
      desc: "The centroids stopped moving between iterations. K-Means converged in " + maxIter + " iterations. WCSS = " + fmt(result.inertia, 2) + ". These are the final cluster assignments. Note: K-Means always converges but may find a local minimum — running multiple restarts (n_init) picks the best.",
      centroids: finalC,
      assignments: finalAss,
      showLines: false,
      arrows: null,
      newIdx: -1,
    });

    return frames;
  }

  var FRAME_COLORS = { raw: "#94A2BC", init: "#7c3aed", assign: "#2B5BFF", update: "#1f9e6b", converged: "#d97706" };

  function AnimSVG({ frame }) {
    var centroids = frame.centroids || [];
    var assignments = frame.assignments;
    var showLines = frame.showLines;
    var arrows = frame.arrows;
    var newIdx = frame.newIdx;

    return (
      <svg width={W} height={H} style={{ maxWidth:"100%", display:"block", margin:"0 auto",
        border:"1px solid var(--line)", borderRadius:10, background:"var(--panel-solid)" }}>
        <ScatterAxes />

        {/* Dashed assignment lines */}
        {showLines && assignments && centroids.length > 0 && DATA.map(function(p, i) {
          var ci = assignments[i];
          var c = centroids[ci];
          if (!c) return null;
          var col = COLORS[ci % COLORS.length];
          return <line key={i} x1={sx(p[0])} y1={sy(p[1])} x2={sx(c[0])} y2={sy(c[1])}
            stroke={col} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.35" />;
        })}

        {/* Data points */}
        {DATA.map(function(p, i) {
          var ci = (assignments && centroids.length > 0) ? assignments[i] : -1;
          var col = ci >= 0 ? COLORS[ci % COLORS.length] : "#94A2BC";
          return (
            <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r="5.5" fill={col} opacity="0.82"
              stroke="white" strokeWidth="1.2" />
          );
        })}

        {/* Movement arrows (update step) */}
        {arrows && arrows.map(function(arrow, ki2) {
          if (!arrow || !arrow.from || !arrow.to) return null;
          var col = COLORS[ki2 % COLORS.length];
          var fx = sx(arrow.from[0]), fy = sy(arrow.from[1]);
          var tx = sx(arrow.to[0]), ty = sy(arrow.to[1]);
          var dx = tx - fx, dy = ty - fy;
          var len = Math.sqrt(dx * dx + dy * dy);
          var centroidMark = (
            <g>
              <circle cx={tx} cy={ty} r="9" fill="none" stroke={col} strokeWidth="2.5" />
              <line x1={tx - 6} y1={ty} x2={tx + 6} y2={ty} stroke={col} strokeWidth="2.5" />
              <line x1={tx} y1={ty - 6} x2={tx} y2={ty + 6} stroke={col} strokeWidth="2.5" />
              <text x={tx + 12} y={ty - 8} fontSize="10" fontWeight="700" fill={col}>{"μ" + (ki2 + 1)}</text>
            </g>
          );
          if (len < 3) {
            return <g key={ki2}>{centroidMark}</g>;
          }
          var angle = Math.atan2(dy, dx);
          var ax = tx - 9 * Math.cos(angle - 0.4);
          var ay = ty - 9 * Math.sin(angle - 0.4);
          var bx = tx - 9 * Math.cos(angle + 0.4);
          var by = ty - 9 * Math.sin(angle + 0.4);
          return (
            <g key={ki2}>
              <circle cx={fx} cy={fy} r="7" fill="none" stroke={col} strokeWidth="1.5" opacity="0.4" strokeDasharray="3 2" />
              <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={col} strokeWidth="2.5" opacity="0.9" />
              <polygon points={tx + "," + ty + " " + ax + "," + ay + " " + bx + "," + by} fill={col} opacity="0.9" />
              {centroidMark}
            </g>
          );
        })}

        {/* Centroids (non-arrow frames) */}
        {!arrows && centroids.map(function(c, ki2) {
          if (!c) return null;
          var col = COLORS[ki2 % COLORS.length];
          var isNew = ki2 === newIdx;
          return (
            <g key={ki2}>
              {isNew && <circle cx={sx(c[0])} cy={sy(c[1])} r="22" fill={col} opacity="0.10" />}
              {isNew && <circle cx={sx(c[0])} cy={sy(c[1])} r="15" fill={col} opacity="0.16" />}
              <circle cx={sx(c[0])} cy={sy(c[1])} r="9" fill="none" stroke={col} strokeWidth={isNew ? 3 : 2.5} />
              <line x1={sx(c[0]) - 6} y1={sy(c[1])} x2={sx(c[0]) + 6} y2={sy(c[1])} stroke={col} strokeWidth="2.5" />
              <line x1={sx(c[0])} y1={sy(c[1]) - 6} x2={sx(c[0])} y2={sy(c[1]) + 6} stroke={col} strokeWidth="2.5" />
              <text x={sx(c[0]) + 12} y={sy(c[1]) - 8} fontSize="10" fontWeight="700" fill={col}>{"μ" + (ki2 + 1)}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  function KMeansAnimator({ trace }) {
    var k = trace.k || 3;
    var frames = useMemo(function() { return buildAnimFrames(k, runKMeans(k)); }, [k]);
    var [frameIdx, setFrameIdx] = useState(0);
    var [playing, setPlaying] = useState(false);
    var timerRef = useRef(null);

    // Reset when k changes
    useEffect(function() { setFrameIdx(0); setPlaying(false); }, [k]);

    useEffect(function() {
      if (playing) {
        timerRef.current = setInterval(function() {
          setFrameIdx(function(f) {
            if (f >= frames.length - 1) {
              setPlaying(false);
              return f;
            }
            return f + 1;
          });
        }, 1300);
      } else {
        clearInterval(timerRef.current);
      }
      return function() { clearInterval(timerRef.current); };
    }, [playing, frames.length]);

    var cf = frames[Math.min(frameIdx, frames.length - 1)] || frames[0];
    var col = FRAME_COLORS[cf.type] || "var(--accent)";

    var btnBase = {
      padding: "8px 15px", borderRadius: 8, border: "1px solid var(--line)",
      fontWeight: 700, fontSize: 13, cursor: "pointer",
      background: "var(--panel-solid)", color: "var(--ink)", transition: "all .15s",
    };

    return (
      <>
        <AnimSVG frame={cf} />

        {/* Narration */}
        <div style={{ background: "rgba(43,91,255,.06)", border: "1px solid rgba(43,91,255,.2)",
          borderRadius: 10, padding: "12px 16px", margin: "10px 0" }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: col, marginBottom: 5 }}>{cf.title}</div>
          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.65 }}>{cf.desc}</div>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", margin: "8px 0", justifyContent: "center" }}>
          {frames.map(function(f, i) {
            var fc = FRAME_COLORS[f.type] || "var(--accent)";
            return (
              <div key={i} onClick={function() { setFrameIdx(i); setPlaying(false); }}
                title={f.title}
                style={{
                  width: 10, height: 10, borderRadius: "50%", cursor: "pointer",
                  background: i === frameIdx ? fc : i < frameIdx ? fc + "55" : "var(--line)",
                  transition: "all .15s",
                  transform: i === frameIdx ? "scale(1.5)" : "scale(1)",
                }} />
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6,
          flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={function() { setFrameIdx(0); setPlaying(false); }} style={btnBase}>
            &#9198; Reset
          </button>
          <button
            onClick={function() { setFrameIdx(Math.max(0, frameIdx - 1)); setPlaying(false); }}
            style={{ ...btnBase, opacity: frameIdx === 0 ? 0.4 : 1 }}
            disabled={frameIdx === 0}>
            &#9664; Prev
          </button>
          <button
            onClick={function() { setPlaying(function(p) { return !p; }); }}
            style={{ ...btnBase, background: playing ? "var(--line)" : "var(--accent)",
              color: playing ? "var(--ink)" : "#fff", minWidth: 80 }}>
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={function() { setFrameIdx(Math.min(frames.length - 1, frameIdx + 1)); setPlaying(false); }}
            style={{ ...btnBase, opacity: frameIdx >= frames.length - 1 ? 0.4 : 1 }}
            disabled={frameIdx >= frames.length - 1}>
            Next &#9654;
          </button>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {frameIdx + 1}&nbsp;/&nbsp;{frames.length}
          </span>
        </div>

        <Note>
          <b>Purple dots</b> = K-Means++ init (spread centroids far apart).&nbsp;
          <b>Dashed lines</b> = assignment step (each point joins nearest centroid).&nbsp;
          <b>Arrows</b> = update step (centroid moves to cluster mean).
          The k slider in the control panel changes the number of clusters.
        </Note>
      </>
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 1: Overview
  // ────────────────────────────────────────────────────────
  var stageOverview = {
    id: "overview", group: "Overview", title: "What is Clustering?",
    map: "Overview",
    why: "Clustering finds structure in unlabeled data — no teacher, no labels, just patterns.",
    render: function(trace, ctx) {
      var finalResult = runKMeans(3);
      return (
        <>
          <Lead>
            <b>Clustering</b> is unsupervised learning: given unlabeled data, find groups of similar points.
            K-Means is the most widely used clustering algorithm. It partitions <em>n</em> points into <em>k</em> clusters
            by minimizing within-cluster sum of squares (WCSS).
          </Lead>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, margin:"16px 0" }}>
            <div>
              <div className="tf-subhead" style={{ textAlign:"center" }}>Before K-Means (raw data)</div>
              <ClusterPlot assignments={DATA.map(function(){ return 0; })} centroids={null} allGray={true} />
            </div>
            <div>
              <div className="tf-subhead" style={{ textAlign:"center" }}>After K-Means (k=3)</div>
              <ClusterPlot assignments={finalResult.assignments} centroids={finalResult.centroids} allGray={false} />
            </div>
          </div>

          <div style={{ background:"rgba(43,91,255,.07)", border:"1px solid rgba(43,91,255,.2)",
            borderRadius:10, padding:"10px 14px", fontSize:13, color:"var(--ink)", margin:"10px 0" }}>
            <b>Used in:</b> customer segmentation, document grouping, image compression, anomaly detection,
            data exploration before modeling.
          </div>

          <div className="tf-subhead" style={{ marginTop:16 }}>K-Means vs Supervised Learning</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", fontSize:13, width:"100%" }}>
              <thead>
                <tr style={{ borderBottom:"2px solid var(--line)" }}>
                  <th style={{ padding:"7px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}></th>
                  <th style={{ padding:"7px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Supervised</th>
                  <th style={{ padding:"7px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Unsupervised (K-Means)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Labels needed", "Yes", "No"],
                  ["Predicts", "Known classes", "Discovered groups"],
                  ["Output", "Class label", "Cluster ID (arbitrary)"],
                  ["Evaluation", "Accuracy, F1", "Silhouette, WCSS, visual"],
                ].map(function(row, i) {
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid var(--line-soft)", background: i%2===0 ? "var(--panel-solid)" : "" }}>
                      <td style={{ padding:"6px 10px", fontWeight:600 }}>{row[0]}</td>
                      <td style={{ padding:"6px 10px" }}>{row[1]}</td>
                      <td style={{ padding:"6px 10px" }}>{row[2]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 2: Objective Function
  // ────────────────────────────────────────────────────────
  var stageObjective = {
    id: "objective", group: "Math", title: "The K-Means Objective — Minimize WCSS",
    map: "Objective",
    why: "Every K-Means decision is driven by one number: within-cluster sum of squares. Minimize it.",
    render: function(trace, ctx) {
      var k = trace.k || 3;
      var clusterStats = Array.from({length: k}, function(_, ki) {
        var pts = DATA.filter(function(_, i){ return trace.assignments[i] === ki; });
        var cx = trace.centroids[ki] ? trace.centroids[ki][0] : 0;
        var cy = trace.centroids[ki] ? trace.centroids[ki][1] : 0;
        var wcss = pts.reduce(function(s, p) {
          return s + (p[0]-cx)*(p[0]-cx) + (p[1]-cy)*(p[1]-cy);
        }, 0);
        return { ki: ki, n: pts.length, cx: cx, cy: cy, wcss: wcss };
      });

      return (
        <>
          <Lead>
            K-Means minimizes the <b>Within-Cluster Sum of Squares (WCSS)</b>, also called inertia:
            the sum of squared distances from each point to its cluster centroid.
          </Lead>

          <div style={{ background:"var(--panel-solid)", border:"2px solid var(--accent)", borderRadius:12,
            padding:"14px 20px", margin:"14px 0", textAlign:"center" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--accent)", marginBottom:8 }}>WCSS Objective</div>
            <div style={{ fontSize:18, fontFamily:"var(--num-font)", color:"var(--ink)", lineHeight:2 }}>
              WCSS = <b>&#x03A3;</b><Sub>i</Sub> <b>&#x03A3;</b><Sub>x&#8712;C<Sub>i</Sub></Sub> ||x &#8722; &#x03BC;<Sub>i</Sub>||<Sup>2</Sup>
            </div>
            <div style={{ fontSize:13, color:"var(--muted)", marginTop:8 }}>
              where &#x03BC;<Sub>i</Sub> is the centroid (mean) of cluster i
            </div>
          </div>

          <ClusterPlot assignments={trace.assignments} centroids={trace.centroids} allGray={false} />

          <div className="tf-subhead" style={{ marginTop:14 }}>WCSS contribution by cluster</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", fontSize:13, width:"100%" }}>
              <thead>
                <tr style={{ borderBottom:"2px solid var(--line)" }}>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Cluster</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Points</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Centroid</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>WCSS contribution</th>
                </tr>
              </thead>
              <tbody>
                {clusterStats.map(function(cs, i) {
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid var(--line-soft)" }}>
                      <td style={{ padding:"6px 10px" }}>
                        <span style={{ display:"inline-block", width:12, height:12, borderRadius:"50%",
                          background:COLORS[cs.ki % COLORS.length], marginRight:6, verticalAlign:"middle" }} />
                        C{cs.ki+1}
                      </td>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)" }}>{cs.n}</td>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)" }}>({fmt(cs.cx, 2)}, {fmt(cs.cy, 2)})</td>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)", fontWeight:600,
                        color:COLORS[cs.ki % COLORS.length] }}>{fmt(cs.wcss, 3)}</td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop:"2px solid var(--line)", background:"var(--panel-solid)" }}>
                  <td colSpan={3} style={{ padding:"6px 10px", fontWeight:700 }}>Total WCSS</td>
                  <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)", fontWeight:700 }}>
                    {fmt(clusterStats.reduce(function(s,cs){ return s+cs.wcss; }, 0), 3)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Note>
            WCSS always decreases as k increases — a cluster of 1 point has WCSS=0. This is why you
            can&apos;t just maximize k. Use the elbow method to find optimal k.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 3: Initialization
  // ────────────────────────────────────────────────────────
  var stageInit = {
    id: "init", group: "Algorithm", title: "Initialization — Where to Start?",
    map: "Init",
    why: "K-Means is sensitive to starting positions — bad initialization leads to poor local optima.",
    render: function(trace, ctx) {
      var k = trace.k || 3;
      var initCentroids = trace.history[0];
      var uniformAssignments = DATA.map(function(){ return 0; });

      return (
        <>
          <Lead>
            K-Means is guaranteed to converge but <b>NOT</b> to the global minimum — it finds a local optimum.
            The starting centroid positions determine which local optimum you reach.
          </Lead>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, margin:"14px 0" }}>
            <div>
              <div className="tf-subhead" style={{ textAlign:"center" }}>Random init (can get stuck)</div>
              <svg width={W} height={H} style={{maxWidth:"100%",display:"block",margin:"0 auto"}}>
                <ScatterAxes />
                {DATA.map(function(p, i) {
                  return <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r="5.5" fill="#94A2BC" opacity="0.7" stroke="white" strokeWidth="1.2" />;
                })}
                {/* Bad random centroids — all clustered together */}
                {[[2.1,2.5],[2.8,1.8],[1.6,2.2]].map(function(c, ki) {
                  var col = COLORS[ki % COLORS.length];
                  return (
                    <g key={ki}>
                      <circle cx={sx(c[0])} cy={sy(c[1])} r="10" fill={col} opacity="0.25" />
                      <circle cx={sx(c[0])} cy={sy(c[1])} r="7" fill="none" stroke={col} strokeWidth="2.5" />
                      <line x1={sx(c[0])-6} y1={sy(c[1])} x2={sx(c[0])+6} y2={sy(c[1])} stroke={col} strokeWidth="2.5" />
                      <line x1={sx(c[0])} y1={sy(c[1])-6} x2={sx(c[0])} y2={sy(c[1])+6} stroke={col} strokeWidth="2.5" />
                    </g>
                  );
                })}
                <text x={W/2} y={H-PAD.b/4} textAnchor="middle" fontSize="11" fill="#e0492e">All centroids in same region!</text>
              </svg>
            </div>
            <div>
              <div className="tf-subhead" style={{ textAlign:"center" }}>K-Means++ (current)</div>
              <svg width={W} height={H} style={{maxWidth:"100%",display:"block",margin:"0 auto"}}>
                <ScatterAxes />
                {DATA.map(function(p, i) {
                  return <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r="5.5" fill="#94A2BC" opacity="0.7" stroke="white" strokeWidth="1.2" />;
                })}
                {initCentroids.map(function(c, ki) {
                  var col = COLORS[ki % COLORS.length];
                  return (
                    <g key={ki}>
                      <circle cx={sx(c[0])} cy={sy(c[1])} r="10" fill={col} opacity="0.25" />
                      <circle cx={sx(c[0])} cy={sy(c[1])} r="7" fill="none" stroke={col} strokeWidth="2.5" />
                      <line x1={sx(c[0])-6} y1={sy(c[1])} x2={sx(c[0])+6} y2={sy(c[1])} stroke={col} strokeWidth="2.5" />
                      <line x1={sx(c[0])} y1={sy(c[1])-6} x2={sx(c[0])} y2={sy(c[1])+6} stroke={col} strokeWidth="2.5" />
                    </g>
                  );
                })}
                <text x={W/2} y={H-PAD.b/4} textAnchor="middle" fontSize="11" fill="#1f9e6b">Spread across the space!</text>
              </svg>
            </div>
          </div>

          <div className="tf-subhead">K-Means++ Algorithm</div>
          <div className="tf-legend">
            {[
              ["Step 1", "Choose the first centroid uniformly at random from the data points."],
              ["Step 2", "Compute D(x)² — the squared distance from each point to its nearest existing centroid."],
              ["Step 3", "Choose the next centroid with probability proportional to D(x)². Points far from existing centroids are more likely to be chosen."],
              ["Step 4", "Repeat until k centroids are chosen. This spreads them apart, reducing poor initialization."],
            ].map(function(item) {
              return (
                <div className="tf-leg" key={item[0]}>
                  <div className="tf-leg-name">{item[0]}</div>
                  <div className="tf-leg-desc">{item[1]}</div>
                </div>
              );
            })}
          </div>

          {codeBlock("from sklearn.cluster import KMeans\n\nkmeans = KMeans(\n    n_clusters=3,\n    init='k-means++',   # default since sklearn 1.0\n    n_init=10,          # run 10 times, keep best result\n    random_state=42\n)\nkmeans.fit(X)")}

          <Note>
            <b>n_init=10</b> means K-Means runs 10 times with different seeds and keeps the best result.
            This is the default in sklearn and dramatically reduces the chance of a bad local optimum.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 4: Assignment Step
  // ────────────────────────────────────────────────────────
  var stageAssign = {
    id: "assign", group: "Algorithm", title: "Step 1 — Assign Each Point to Nearest Centroid",
    map: "Assign",
    why: "The assignment step creates a Voronoi partition of the space.",
    render: function(trace, ctx) {
      var samplePoint = DATA[0];
      var k = trace.k || 3;
      var distRows = trace.centroids.map(function(c, ki) {
        var dx = samplePoint[0] - c[0];
        var dy = samplePoint[1] - c[1];
        var dist = Math.sqrt(dx*dx + dy*dy);
        return { ki: ki, cx: c[0], cy: c[1], dist: dist };
      });
      var minDist = Math.min.apply(null, distRows.map(function(r){ return r.dist; }));

      return (
        <>
          <Lead>
            In the <b>assignment step</b>, every data point is assigned to the closest centroid
            using Euclidean distance. All points closer to centroid C1 form cluster 1, and so on.
          </Lead>

          <ClusterPlot assignments={trace.assignments} centroids={trace.centroids} allGray={false} />

          <div style={{ background:"var(--panel-solid)", border:"2px solid var(--accent)", borderRadius:12,
            padding:"14px 20px", margin:"14px 0", textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--accent)", marginBottom:6 }}>Distance Formula</div>
            <div style={{ fontSize:16, fontFamily:"var(--num-font)", color:"var(--ink)" }}>
              d(x, &#x03BC;<Sub>i</Sub>) = &#x221A;[(x<Sub>1</Sub> &#8722; &#x03BC;<Sub>i1</Sub>)<Sup>2</Sup> + (x<Sub>2</Sub> &#8722; &#x03BC;<Sub>i2</Sub>)<Sup>2</Sup>]
            </div>
          </div>

          <div className="tf-subhead">Sample point: ({fmt(samplePoint[0], 1)}, {fmt(samplePoint[1], 1)})</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", fontSize:13, width:"100%" }}>
              <thead>
                <tr style={{ borderBottom:"2px solid var(--line)" }}>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Centroid</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>&#x03BC; coords</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>d(x, &#x03BC;<Sub>i</Sub>)</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Assigned?</th>
                </tr>
              </thead>
              <tbody>
                {distRows.map(function(r, i) {
                  var isClosest = Math.abs(r.dist - minDist) < 0.0001;
                  var col = COLORS[r.ki % COLORS.length];
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid var(--line-soft)",
                      background: isClosest ? "rgba(31,158,107,.08)" : "" }}>
                      <td style={{ padding:"6px 10px" }}>
                        <span style={{ display:"inline-block", width:10, height:10, borderRadius:"50%",
                          background:col, marginRight:6, verticalAlign:"middle" }} />
                        C{r.ki+1}
                      </td>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)" }}>
                        ({fmt(r.cx, 2)}, {fmt(r.cy, 2)})
                      </td>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)", fontWeight: isClosest ? 700 : 400,
                        color: isClosest ? "#1f9e6b" : "var(--ink)" }}>{fmt(r.dist, 3)}</td>
                      <td style={{ padding:"6px 10px", fontSize:16 }}>{isClosest ? "✓ (closest)" : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Note>
            This creates a <b>Voronoi partition</b> — the space is divided into k regions, each containing
            all points closest to that centroid. The assignment step does not move anything; it just
            re-labels every point.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 5: Update Step
  // ────────────────────────────────────────────────────────
  var stageUpdate = {
    id: "update", group: "Algorithm", title: "Step 2 — Move Centroids to Cluster Means",
    map: "Update",
    why: "The update step is just computing a mean — but it is guaranteed to decrease WCSS.",
    render: function(trace, ctx) {
      var k = trace.k || 3;
      var prevStep = Math.max(0, trace.step - 1);
      var prevCentroids = trace.history[prevStep] || trace.centroids;

      var clusterMeans = Array.from({length: k}, function(_, ki) {
        var pts = DATA.filter(function(_, i){ return trace.assignments[i] === ki; });
        var meanX = pts.length > 0 ? pts.reduce(function(s,p){ return s+p[0]; }, 0) / pts.length : 0;
        var meanY = pts.length > 0 ? pts.reduce(function(s,p){ return s+p[1]; }, 0) / pts.length : 0;
        var oldCx = prevCentroids[ki] ? prevCentroids[ki][0] : 0;
        var oldCy = prevCentroids[ki] ? prevCentroids[ki][1] : 0;
        var newCx = trace.centroids[ki] ? trace.centroids[ki][0] : 0;
        var newCy = trace.centroids[ki] ? trace.centroids[ki][1] : 0;
        return { ki: ki, n: pts.length, meanX: meanX, meanY: meanY,
          oldCx: oldCx, oldCy: oldCy, newCx: newCx, newCy: newCy };
      });

      return (
        <>
          <Lead>
            After assigning points, each centroid moves to the <b>mean (average)</b> of all points
            assigned to its cluster. This is guaranteed to decrease WCSS or keep it the same.
          </Lead>

          <ClusterPlot assignments={trace.assignments} centroids={trace.centroids} allGray={false} />

          <div style={{ background:"var(--panel-solid)", border:"2px solid var(--accent)", borderRadius:12,
            padding:"14px 20px", margin:"14px 0", textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--accent)", marginBottom:6 }}>Centroid Update Rule</div>
            <div style={{ fontSize:18, fontFamily:"var(--num-font)", color:"var(--ink)" }}>
              &#x03BC;<Sub>i</Sub> = (1 / |C<Sub>i</Sub>|) <b>&#x03A3;</b><Sub>x&#8712;C<Sub>i</Sub></Sub> x
            </div>
          </div>

          <div className="tf-subhead">Cluster means at iteration {trace.step}</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", fontSize:13, width:"100%" }}>
              <thead>
                <tr style={{ borderBottom:"2px solid var(--line)" }}>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Cluster</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Points</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Mean x</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Mean y</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>New centroid</th>
                </tr>
              </thead>
              <tbody>
                {clusterMeans.map(function(cm) {
                  var col = COLORS[cm.ki % COLORS.length];
                  return (
                    <tr key={cm.ki} style={{ borderBottom:"1px solid var(--line-soft)" }}>
                      <td style={{ padding:"6px 10px" }}>
                        <span style={{ display:"inline-block", width:10, height:10, borderRadius:"50%",
                          background:col, marginRight:6, verticalAlign:"middle" }} />
                        C{cm.ki+1}
                      </td>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)" }}>{cm.n}</td>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)" }}>{fmt(cm.meanX, 3)}</td>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)" }}>{fmt(cm.meanY, 3)}</td>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)", fontWeight:600, color:col }}>
                        ({fmt(cm.newCx, 3)}, {fmt(cm.newCy, 3)})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Note>
            This step always decreases WCSS or keeps it the same — the mean minimizes the sum of squared
            distances within a set. <b>Therefore K-Means always converges.</b>
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 6: Playable Animation
  // ────────────────────────────────────────────────────────
  var stageAnimation = {
    id: "animation", group: "Algorithm", title: "Watch K-Means Train — Step by Step",
    map: "Animate",
    why: "Seeing each assign→update frame makes K-Means intuitive in a way static diagrams cannot.",
    render: function(trace, ctx) {
      return (
        <>
          <Lead>
            Watch K-Means initialize centroids with <b>K-Means++</b>, then alternate
            between <b>assigning points</b> to the nearest centroid and <b>updating centroids</b> to their cluster means —
            one frame at a time. Press <b>▶ Play</b> for auto-advance or step manually.
          </Lead>
          <KMeansAnimator trace={trace} />
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 7: Iteration (slider view)
  // ────────────────────────────────────────────────────────
  var stageIteration = {
    id: "iteration", group: "Algorithm", title: "Repeat Until Convergence",
    map: "Iterate",
    why: "K-Means alternates assign→update until centroids stop moving. This always terminates.",
    render: function(trace, ctx) {
      var k = trace.k || 3;
      var initResult = runKMeans(k);
      var initInertia = initResult.history.length > 1 ?
        (function() {
          var ic = initResult.history[0];
          var ia = DATA.map(function(p) {
            var bestD = Infinity, bestK = 0;
            for (var j = 0; j < k; j++) {
              var d = (p[0]-ic[j][0])*(p[0]-ic[j][0]) + (p[1]-ic[j][1])*(p[1]-ic[j][1]);
              if (d < bestD) { bestD = d; bestK = j; }
            }
            return bestK;
          });
          return DATA.reduce(function(sum, p, i) {
            var c = ic[ia[i]];
            return sum + (p[0]-c[0])*(p[0]-c[0]) + (p[1]-c[1])*(p[1]-c[1]);
          }, 0);
        })() : trace.inertia;

      return (
        <>
          <Lead>
            K-Means repeats the <b>assign &#8594; update</b> cycle until centroids don&apos;t move.
            Use the <em>iteration</em> slider to watch the centroids converge step by step.
          </Lead>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, margin:"6px 0 10px",
            fontSize:14, fontWeight:600, color:"var(--accent)" }}>
            Iteration {trace.step} of {trace.maxStep}
          </div>

          <ClusterPlot assignments={trace.assignments} centroids={trace.centroids} allGray={false} />

          <div className="tf-subhead" style={{ marginTop:12 }}>Centroid movement trail</div>
          <TrailPlot history={trace.history} assignments={trace.assignments} step={trace.step} />

          <div style={{ display:"flex", gap:16, margin:"10px 0", flexWrap:"wrap" }}>
            <div style={{ background:"var(--panel-solid)", border:"1px solid var(--line)", borderRadius:10,
              padding:"10px 16px", flex:1, minWidth:140 }}>
              <div style={{ fontSize:12, color:"var(--muted)" }}>WCSS at start</div>
              <div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--num-font)", color:"#e0492e" }}>
                {fmt(initInertia, 2)}
              </div>
            </div>
            <div style={{ background:"var(--panel-solid)", border:"1px solid var(--line)", borderRadius:10,
              padding:"10px 16px", flex:1, minWidth:140 }}>
              <div style={{ fontSize:12, color:"var(--muted)" }}>WCSS at iter {trace.step}</div>
              <div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--num-font)", color:"#1f9e6b" }}>
                {fmt(trace.inertia, 2)}
              </div>
            </div>
            <div style={{ background:"var(--panel-solid)", border:"1px solid var(--line)", borderRadius:10,
              padding:"10px 16px", flex:1, minWidth:140 }}>
              <div style={{ fontSize:12, color:"var(--muted)" }}>Reduction</div>
              <div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--num-font)", color:"var(--accent)" }}>
                {fmt(100 * (1 - trace.inertia / initInertia), 1)}%
              </div>
            </div>
          </div>

          <Note>
            Convergence is guaranteed because there are a finite number of assignments and WCSS strictly
            decreases at each step. Max iterations (default 300 in sklearn) cap prevents infinite loops
            on pathological inputs.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 8: Elbow Method
  // ────────────────────────────────────────────────────────
  var stageElbow = {
    id: "elbow", group: "Evaluation", title: "How Many Clusters? The Elbow Method",
    map: "Elbow",
    why: "K-Means requires you to choose k upfront. The elbow method uses the rate of WCSS improvement.",
    render: function(trace, ctx) {
      return (
        <>
          <Lead>
            K-Means needs <em>k</em> as input. Adding more clusters always decreases WCSS — the question
            is when the improvement stops being worth the added complexity.
          </Lead>

          <div style={{ margin:"16px 0" }}>
            <ElbowChart />
          </div>

          <div style={{ background:"rgba(224,73,46,.08)", border:"1px solid rgba(224,73,46,.3)",
            borderRadius:10, padding:"10px 14px", fontSize:13, color:"var(--ink)", margin:"10px 0" }}>
            At k=3, the WCSS drop is dramatic. At k=4, it&apos;s much smaller — the curve &apos;elbows&apos;.
            This matches our true number of clusters.
          </div>

          <div className="tf-subhead">WCSS by k</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", fontSize:13, width:"100%" }}>
              <thead>
                <tr style={{ borderBottom:"2px solid var(--line)" }}>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>k</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>WCSS</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>&#x394; WCSS</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>% improvement</th>
                </tr>
              </thead>
              <tbody>
                {elbowData.map(function(d, i) {
                  var delta = i > 0 ? elbowData[i-1].inertia - d.inertia : null;
                  var pct = i > 0 ? 100 * delta / elbowData[i-1].inertia : null;
                  var isElbow = d.k === 3;
                  return (
                    <tr key={d.k} style={{ borderBottom:"1px solid var(--line-soft)",
                      background: isElbow ? "rgba(224,73,46,.07)" : "" }}>
                      <td style={{ padding:"6px 10px", fontWeight: isElbow ? 700 : 400 }}>
                        {d.k} {isElbow ? "← elbow" : ""}
                      </td>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)" }}>{fmt(d.inertia, 2)}</td>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)" }}>
                        {delta != null ? fmt(delta, 2) : "—"}
                      </td>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)",
                        fontWeight: isElbow ? 700 : 400, color: isElbow ? "#e0492e" : "var(--ink)" }}>
                        {pct != null ? fmt(pct, 1) + "%" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Note>
            The elbow method is heuristic — sometimes there is no clear elbow. In practice: use domain
            knowledge, silhouette score, or the gap statistic to validate your choice of k.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 9: Silhouette Score
  // ────────────────────────────────────────────────────────
  var stageSilhouette = {
    id: "silhouette", group: "Evaluation", title: "Silhouette Score — How Good Are the Clusters?",
    map: "Silhouette",
    why: "The silhouette score measures how well-separated clusters are — a number you can actually use.",
    render: function(trace, ctx) {
      var k = trace.k || 3;

      // Approximate silhouette using centroid distances
      var scores = DATA.map(function(p, i) {
        var myCluster = trace.assignments[i];
        var myCentroid = trace.centroids[myCluster];
        var a = Math.sqrt((p[0]-myCentroid[0])*(p[0]-myCentroid[0]) + (p[1]-myCentroid[1])*(p[1]-myCentroid[1]));

        var otherDists = trace.centroids
          .map(function(c, ki) {
            if (ki === myCluster) return Infinity;
            return Math.sqrt((p[0]-c[0])*(p[0]-c[0]) + (p[1]-c[1])*(p[1]-c[1]));
          })
          .filter(function(d) { return d !== Infinity; });

        var b = otherDists.length > 0 ? Math.min.apply(null, otherDists) : 0;
        var maxAB = Math.max(a, b);
        return maxAB > 0 ? (b - a) / maxAB : 0;
      });

      var avgScore = scores.reduce(function(s, v){ return s+v; }, 0) / scores.length;

      // Per-cluster average
      var clusterScores = Array.from({length: k}, function(_, ki) {
        var clPts = scores.filter(function(_, i){ return trace.assignments[i] === ki; });
        return clPts.length > 0 ? clPts.reduce(function(s,v){ return s+v; }, 0) / clPts.length : 0;
      });

      return (
        <>
          <Lead>
            The <b>silhouette score</b> measures how similar each point is to its own cluster vs. neighboring
            clusters. Range: [&#8722;1, 1]. Higher is better. Values near 0 = overlapping clusters;
            negative = likely misassigned.
          </Lead>

          <div style={{ background:"var(--panel-solid)", border:"2px solid var(--accent)", borderRadius:12,
            padding:"14px 20px", margin:"14px 0" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--accent)", marginBottom:8 }}>Silhouette Formula</div>
            <div style={{ fontSize:15, fontFamily:"var(--num-font)", color:"var(--ink)", lineHeight:2 }}>
              s(i) = (b(i) &#8722; a(i)) / max(a(i), b(i))
            </div>
            <div style={{ fontSize:13, color:"var(--muted)", marginTop:6, lineHeight:1.8 }}>
              a(i) = mean distance from point i to other points in <em>same</em> cluster<br />
              b(i) = mean distance from point i to points in <em>nearest other</em> cluster
            </div>
          </div>

          <div style={{ textAlign:"center", margin:"10px 0" }}>
            <div style={{ fontSize:13, color:"var(--muted)" }}>Overall silhouette score</div>
            <div style={{ fontSize:32, fontWeight:800, fontFamily:"var(--num-font)",
              color: avgScore > 0.5 ? "#1f9e6b" : avgScore > 0.25 ? "#d97706" : "#e0492e" }}>
              {fmt(avgScore, 3)}
            </div>
          </div>

          <div className="tf-subhead">Silhouette by data point</div>
          <SilhouetteBar scores={scores} assignments={trace.assignments} k={k} />

          <div className="tf-subhead" style={{ marginTop:12 }}>Per-cluster average</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", margin:"8px 0" }}>
            {clusterScores.map(function(sc, ki) {
              var col = COLORS[ki % COLORS.length];
              return (
                <div key={ki} style={{ background:"var(--panel-solid)", border:"1.5px solid " + col,
                  borderRadius:10, padding:"8px 14px", minWidth:90, textAlign:"center" }}>
                  <div style={{ fontSize:11, color:col, fontWeight:700 }}>C{ki+1}</div>
                  <div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--num-font)", color:"var(--ink)" }}>
                    {fmt(sc, 3)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="tf-subhead" style={{ marginTop:14 }}>Interpretation</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", fontSize:13, width:"100%" }}>
              <thead>
                <tr style={{ borderBottom:"2px solid var(--line)" }}>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Score</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["> 0.7", "Strong structure", "#1f9e6b"],
                  ["0.5 – 0.7", "Reasonable structure", "#1f9e6b"],
                  ["0.25 – 0.5", "Weak structure", "#d97706"],
                  ["< 0.25", "No structure found", "#e0492e"],
                ].map(function(row, i) {
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid var(--line-soft)" }}>
                      <td style={{ padding:"6px 10px", fontFamily:"var(--num-font)", fontWeight:600, color:row[2] }}>{row[0]}</td>
                      <td style={{ padding:"6px 10px" }}>{row[1]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 10: Failures
  // ────────────────────────────────────────────────────────
  var stageFailures = {
    id: "failures", group: "Insights", title: "When K-Means Fails",
    map: "Failures",
    why: "Knowing when K-Means fails is as important as knowing when it works.",
    render: function(trace, ctx) {
      return (
        <>
          <Lead>
            K-Means assumes clusters are <b>convex</b>, roughly <b>equal in size</b>, and similar in
            <b> density</b>. When these assumptions break, it produces wrong clusters even with the correct k.
          </Lead>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, margin:"14px 0" }}>
            {[
              { type:"nonconvex", label:"Non-convex clusters", desc:"Two crescents — K-Means cuts them incorrectly because it uses straight-line (Voronoi) boundaries." },
              { type:"sizes", label:"Very different sizes", desc:"One large cluster + one tiny cluster. K-Means splits the large cluster to balance WCSS." },
              { type:"density", label:"Different densities", desc:"A dense cluster and a sparse cluster. K-Means treats distance equally regardless of local density." },
              { type:"outlier", label:"Extreme outliers", desc:"A single outlier point far from all clusters becomes its own centroid, wasting a cluster." },
            ].map(function(item) {
              return (
                <div key={item.type} style={{ background:"var(--panel-solid)", border:"1px solid var(--line)",
                  borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--accent)", marginBottom:8 }}>{item.label}</div>
                  <FailureSVG type={item.type} label="" />
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:6, lineHeight:1.5 }}>{item.desc}</div>
                </div>
              );
            })}
          </div>

          <div className="tf-subhead">Alternatives by failure mode</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", fontSize:13, width:"100%" }}>
              <thead>
                <tr style={{ borderBottom:"2px solid var(--line)" }}>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Failure mode</th>
                  <th style={{ padding:"6px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Fix</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Non-convex clusters", "DBSCAN, Spectral Clustering"],
                  ["Different cluster sizes", "Gaussian Mixture Models (GMM)"],
                  ["Different densities", "DBSCAN"],
                  ["Unknown k", "DBSCAN, Hierarchical Clustering (no k needed)"],
                  ["Outliers dominate", "K-Medoids (PAM), remove outliers first"],
                ].map(function(row, i) {
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid var(--line-soft)", background: i%2===0 ? "var(--panel-solid)" : "" }}>
                      <td style={{ padding:"6px 10px", fontWeight:600, color:"#e0492e" }}>{row[0]}</td>
                      <td style={{ padding:"6px 10px", color:"#1f9e6b" }}>{row[1]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 11: Practical Tips
  // ────────────────────────────────────────────────────────
  var stageTips = {
    id: "tips", group: "Insights", title: "Practical Tips for K-Means",
    map: "Tips",
    why: "These are the gotchas that bite practitioners in production.",
    render: function(trace, ctx) {
      var tips = [
        {
          num: "1",
          title: "Scale your features",
          body: "K-Means uses Euclidean distance — if one feature has range 0–1 and another 0–1000, the second dominates. Always apply StandardScaler (or MinMaxScaler) before K-Means.",
          code: "from sklearn.preprocessing import StandardScaler\nscaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)\nkmeans.fit(X_scaled)",
          col: "#2B5BFF",
        },
        {
          num: "2",
          title: "Run multiple times (n_init)",
          body: "K-Means can get stuck in a local optimum. Use n_init=10 or higher to run multiple times with different seeds and keep the best result (lowest WCSS).",
          code: "KMeans(n_clusters=3, n_init=20, random_state=42)",
          col: "#1f9e6b",
        },
        {
          num: "3",
          title: "Always use K-Means++ initialization",
          body: "K-Means++ selects initial centroids spread across the data, dramatically reducing chance of poor local optima. It is the default in sklearn since v1.0.",
          code: "KMeans(n_clusters=3, init='k-means++')",
          col: "#d97706",
        },
        {
          num: "4",
          title: "Do not use K-Means for categorical data",
          body: "K-Means requires Euclidean distance, which is meaningless for categorical features. Use K-Modes, Gower distance, or encode carefully with target encoding.",
          code: "# For categorical: use K-Modes\nfrom kmodes.kmodes import KModes\nkm = KModes(n_clusters=3, init='Huang')",
          col: "#7c3aed",
        },
        {
          num: "5",
          title: "Reduce dimensions first in high-dim spaces",
          body: "In high-dimensional spaces, all distances become similar (curse of dimensionality). Apply PCA to 10–50 components before clustering.",
          code: "from sklearn.decomposition import PCA\npca = PCA(n_components=50)\nX_pca = pca.fit_transform(X_scaled)\nkmeans.fit(X_pca)",
          col: "#e0492e",
        },
        {
          num: "6",
          title: "Handle outliers before clustering",
          body: "K-Means is sensitive to outliers — they pull centroids away from the true cluster centers. Use IQR filtering, Isolation Forest, or K-Medoids for robustness.",
          code: "# K-Medoids is robust to outliers\nfrom sklearn_extra.cluster import KMedoids\nkmed = KMedoids(n_clusters=3, random_state=42)",
          col: "#db2777",
        },
      ];

      return (
        <>
          <Lead>
            These are the most common K-Means pitfalls in production. Each one can silently produce
            wrong clusters without any error message.
          </Lead>

          {tips.map(function(tip) {
            return (
              <div key={tip.num} style={{ background:"var(--panel-solid)", border:"1.5px solid " + tip.col + "44",
                borderLeft:"4px solid " + tip.col, borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ background:tip.col, color:"white", borderRadius:"50%", width:22, height:22,
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight:700, flexShrink:0 }}>{tip.num}</span>
                  <span style={{ fontWeight:700, fontSize:14, color:"var(--ink)" }}>{tip.title}</span>
                </div>
                <div style={{ fontSize:13, color:"var(--ink)", marginBottom:8, lineHeight:1.6 }}>{tip.body}</div>
                {codeBlock(tip.code)}
              </div>
            );
          })}
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 12: Hyperparameters
  // ────────────────────────────────────────────────────────
  var stageHyperparams = {
    id: "hyperparams", group: "Hyperparameters", title: "K-Means Hyperparameters",
    map: "Hyperparams",
    why: "Most K-Means failures trace to k or init — the other parameters rarely need changing.",
    render: function(trace, ctx) {
      var params = [
        { name:"n_clusters (k)", what:"Number of clusters to form", def:"8", range:"2–20", how:"Elbow method + silhouette score", imp:"Critical" },
        { name:"init", what:"Initialization method for centroids", def:"'k-means++'", range:"'k-means++', 'random'", how:"Almost always k-means++", imp:"High" },
        { name:"n_init", what:"Number of random restarts", def:"10", range:"10–50", how:"Higher for noisy/complex data", imp:"High" },
        { name:"max_iter", what:"Max iterations per run", def:"300", range:"100–1000", how:"Increase if not converging", imp:"Low" },
        { name:"tol", what:"Convergence tolerance", def:"1e-4", range:"1e-5 – 1e-3", how:"Rarely needs changing", imp:"Low" },
        { name:"algorithm", what:"Computation method", def:"'lloyd'", range:"'lloyd', 'elkan'", how:"Elkan faster for low-dim dense data", imp:"Low" },
        { name:"random_state", what:"Seed for reproducibility", def:"None", range:"Any integer", how:"Always set for reproducibility", imp:"Practical" },
      ];

      var impColor = { "Critical": "#e0492e", "High": "#d97706", "Low": "#1f9e6b", "Practical": "#7c3aed" };

      return (
        <>
          <Lead>
            K-Means has fewer hyperparameters than tree-based models, but <b>n_clusters</b> and <b>init</b> have
            by far the most impact. The rest are sensible defaults that rarely need changing.
          </Lead>

          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", fontSize:12.5, width:"100%" }}>
              <thead>
                <tr style={{ borderBottom:"2px solid var(--line)", background:"var(--panel-solid)" }}>
                  <th style={{ padding:"8px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Parameter</th>
                  <th style={{ padding:"8px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>What it does</th>
                  <th style={{ padding:"8px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Default</th>
                  <th style={{ padding:"8px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Typical range</th>
                  <th style={{ padding:"8px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>How to tune</th>
                  <th style={{ padding:"8px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600 }}>Importance</th>
                </tr>
              </thead>
              <tbody>
                {params.map(function(p, i) {
                  return (
                    <tr key={p.name} style={{ borderBottom:"1px solid var(--line-soft)", background: i%2===0 ? "" : "var(--panel-solid)" }}>
                      <td style={{ padding:"7px 10px", fontFamily:"var(--num-font)", fontWeight:600, fontSize:12 }}>{p.name}</td>
                      <td style={{ padding:"7px 10px", fontSize:12 }}>{p.what}</td>
                      <td style={{ padding:"7px 10px", fontFamily:"var(--num-font)", fontSize:12 }}>{p.def}</td>
                      <td style={{ padding:"7px 10px", fontFamily:"var(--num-font)", fontSize:12 }}>{p.range}</td>
                      <td style={{ padding:"7px 10px", fontSize:12 }}>{p.how}</td>
                      <td style={{ padding:"7px 10px" }}>
                        <span style={{ background: (impColor[p.imp] || "#94A2BC") + "22",
                          color: impColor[p.imp] || "#94A2BC",
                          borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700 }}>
                          {p.imp}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tf-subhead" style={{ marginTop:16 }}>Minimal production template</div>
          {codeBlock("from sklearn.cluster import KMeans\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.pipeline import Pipeline\n\npipeline = Pipeline([\n    ('scaler', StandardScaler()),\n    ('kmeans', KMeans(\n        n_clusters=3,        # tune with elbow + silhouette\n        init='k-means++',    # always\n        n_init=20,           # more restarts = better result\n        max_iter=300,\n        random_state=42,\n    ))\n])\n\nlabels = pipeline.fit_predict(X)")}

          <Note>
            Always set <b>random_state</b> for reproducibility in production.
            Always <b>scale features</b> before K-Means.
            Always validate with the <b>silhouette score</b>, not just the elbow plot.
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  ASSEMBLE STAGES
  // ────────────────────────────────────────────────────────
  var STAGES = [
    stageOverview,
    stageObjective,
    stageInit,
    stageAssign,
    stageUpdate,
    stageAnimation,
    stageIteration,
    stageElbow,
    stageSilhouette,
    stageFailures,
    stageTips,
    stageHyperparams,
  ];

  window.ML_STAGES = STAGES;

  // ── META ──
  window.ML_META = {
    title: "K-Means Clustering",
    subtitle: "Partition data into k clusters by minimizing WCSS",
    cur: "K-Means",
    category: "Clustering",
    run: window.ML_KMEANS.run,
    default: { k: 3, step: 0 },
    modeLinks: [
      { label: "K-Means", href: "K-Means.html", active: true },
      { label: "DBSCAN", href: "DBSCAN.html", active: false },
      { label: "Hierarchical", href: "Hierarchical.html", active: false },
    ],
    renderInput: function(input, setInput, trace) {
      return (
        <>
          <label className="nn-slider">
            <span className="nn-slider-l">k</span>
            <input type="range" min="2" max="5" step="1" value={input.k}
              onChange={function(e) { setInput({ k: parseInt(e.target.value), step: 0 }); }} />
            <span className="nn-slider-v">{input.k}</span>
          </label>
          <label className="nn-slider">
            <span className="nn-slider-l">iteration</span>
            <input type="range" min="0" max={trace.maxStep || 10} step="1" value={input.step || 0}
              onChange={function(e) { setInput({ ...input, step: parseInt(e.target.value) }); }} />
            <span className="nn-slider-v">{input.step || 0}</span>
          </label>
          <span style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 4 }}>
            WCSS: <b style={{ color: "var(--accent-ink)" }}>{fmt(trace.inertia, 2)}</b>
          </span>
        </>
      );
    },
  };
})();
