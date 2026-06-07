/* ============================================================
   Hierarchical Clustering — stages-hierarchical.jsx (10 stages)
   Requires: window.ML_HIER (from model/ml-hierarchical.js)
             window.{ V, Sub, Sup, Formula, Lead, Note,
                      Row, Tag, fmt } (from matrix.jsx)
   ============================================================ */
(function () {
  var useState = React.useState;
  var V = window.V, Sub = window.Sub, Sup = window.Sup, Formula = window.Formula,
      Lead = window.Lead, Note = window.Note, Row = window.Row, Tag = window.Tag,
      fmt = window.fmt;
  var DATA = window.ML_HIER.DATA;
  var LABELS = window.ML_HIER.LABELS;
  var agglomerate = window.ML_HIER.agglomerate;

  var W = 460, H = 300;
  var PAD = { l: 36, r: 20, t: 20, b: 36 };
  var xMin = 0, xMax = 10, yMin = 0, yMax = 10;
  var sx = function(v) { return PAD.l + (v - xMin) / (xMax - xMin) * (W - PAD.l - PAD.r); };
  var sy = function(v) { return PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b); };

  var CLUSTER_COLORS = ["#2B5BFF","#e0492e","#1f9e6b","#d97706","#7c3aed","#db2777","#0891b2","#65a30d"];

  // ── ScatterPlot ──
  function ScatterPlot(props) {
    var labels = props.labels;
    return (
      React.createElement("svg", { width: W, height: H, style: { maxWidth: "100%", display: "block", margin: "0 auto" } },
        DATA.map(function(p, i) {
          var col = CLUSTER_COLORS[labels[i] % CLUSTER_COLORS.length];
          return React.createElement("g", { key: i },
            React.createElement("circle", { cx: sx(p[0]), cy: sy(p[1]), r: "6", fill: col, opacity: "0.85", stroke: "white", strokeWidth: "1.2" }),
            React.createElement("text", { x: sx(p[0]) + 9, y: sy(p[1]) + 4, fontSize: "10.5", fill: "var(--ink)", fontWeight: "500" }, LABELS[i])
          );
        })
      )
    );
  }

  // ── Dendrogram ──
  function Dendrogram(props) {
    var merges = props.merges;
    var nClusters = props.nClusters;
    var dW = 460, dH = 260;
    var dPad = { l: 50, r: 20, t: 20, b: 40 };
    var n = DATA.length;

    function getLeafOrder(mergesArr) {
      var subtrees = DATA.map(function(_, i) { return [i]; });
      mergesArr.forEach(function(m) {
        var ai = -1, bi = -1;
        subtrees.forEach(function(st, si) {
          if (ai === -1 && m.a.length <= st.length &&
              m.a.every(function(x) { return st.indexOf(x) >= 0; })) ai = si;
          if (bi === -1 && m.b.length <= st.length &&
              m.b.every(function(x) { return st.indexOf(x) >= 0; })) bi = si;
        });
        if (ai >= 0 && bi >= 0 && ai !== bi) {
          var newSt = subtrees[ai].concat(subtrees[bi]);
          var newSubtrees = [];
          subtrees.forEach(function(s, si) { if (si !== ai && si !== bi) newSubtrees.push(s); });
          newSubtrees.push(newSt);
          subtrees = newSubtrees;
        }
      });
      return subtrees[0] || DATA.map(function(_, i) { return i; });
    }

    var leafOrder = getLeafOrder(merges);
    var maxDist = merges.length > 0 ? merges[merges.length - 1].distance : 1;

    var lx = function(leafIdx) {
      var pos = leafOrder.indexOf(leafIdx);
      return dPad.l + (pos + 0.5) / n * (dW - dPad.l - dPad.r);
    };
    var ly = function(dist) {
      return dPad.t + (1 - dist / (maxDist * 1.1)) * (dH - dPad.t - dPad.b);
    };

    var cutMergeIdx = n - nClusters;
    var cutHeight = (cutMergeIdx >= 0 && cutMergeIdx < merges.length)
      ? merges[cutMergeIdx].distance * 0.95
      : maxDist * 0.5;

    function getClusterX(indices) {
      if (!indices || indices.length === 0) return dPad.l;
      return indices.reduce(function(s, i) { return s + lx(i); }, 0) / indices.length;
    }

    var yAxisMid = (dPad.t + dH - dPad.b) / 2;

    return (
      React.createElement("svg", { width: dW, height: dH, style: { maxWidth: "100%", display: "block", margin: "0 auto" } },
        React.createElement("line", { x1: dPad.l, y1: dPad.t, x2: dPad.l, y2: dH - dPad.b, stroke: "var(--ink)", strokeWidth: "1.4" }),
        React.createElement("line", { x1: dPad.l, y1: dH - dPad.b, x2: dW - dPad.r, y2: dH - dPad.b, stroke: "var(--ink)", strokeWidth: "1.4" }),

        [0, 0.25, 0.5, 0.75, 1.0].map(function(frac) {
          var val = frac * maxDist * 1.1;
          return React.createElement("g", { key: frac },
            React.createElement("line", { x1: dPad.l - 4, y1: ly(val), x2: dPad.l, y2: ly(val), stroke: "var(--ink)", strokeWidth: "1" }),
            React.createElement("text", { x: dPad.l - 6, y: ly(val) + 4, textAnchor: "end", fontSize: "9", fill: "var(--muted)" }, fmt(val, 2))
          );
        }),

        React.createElement("text", {
          x: 12, y: yAxisMid, textAnchor: "middle", fontSize: "10", fill: "var(--muted)",
          transform: "rotate(-90,12," + yAxisMid + ")"
        }, "distance"),

        leafOrder.map(function(i, pos) {
          return React.createElement("text", {
            key: i, x: lx(i), y: dH - dPad.b + 14,
            textAnchor: "middle", fontSize: "9.5", fill: "var(--ink)"
          }, LABELS[i]);
        }),

        merges.map(function(m, mi) {
          var xA = getClusterX(m.a);
          var xB = getClusterX(m.b);
          var y = ly(m.distance);
          var isCut = mi >= n - nClusters;
          var col = isCut ? "#e0492e" : "var(--accent)";
          var op = isCut ? 0.35 : 0.85;
          return React.createElement("g", { key: mi },
            React.createElement("line", { x1: xA, y1: dH - dPad.b, x2: xA, y2: y, stroke: col, strokeWidth: "1.8", opacity: op }),
            React.createElement("line", { x1: xB, y1: dH - dPad.b, x2: xB, y2: y, stroke: col, strokeWidth: "1.8", opacity: op }),
            React.createElement("line", { x1: xA, y1: y, x2: xB, y2: y, stroke: col, strokeWidth: "1.8", opacity: op })
          );
        }),

        React.createElement("line", {
          x1: dPad.l, y1: ly(cutHeight), x2: dW - dPad.r, y2: ly(cutHeight),
          stroke: "#e0492e", strokeWidth: "1.8", strokeDasharray: "6 4", opacity: "0.9"
        }),
        React.createElement("text", {
          x: dW - dPad.r - 2, y: ly(cutHeight) - 4,
          textAnchor: "end", fontSize: "10", fill: "#e0492e", fontWeight: "700"
        }, "cut → " + nClusters + " clusters")
      )
    );
  }

  // ── SmallScatter: compact scatter for side-by-side ──
  function SmallScatter(props) {
    var labels = props.labels;
    var title = props.title;
    var sw = 210, sh = 180;
    var sp = { l: 20, r: 10, t: 24, b: 20 };
    var ssx = function(v) { return sp.l + (v - 0) / 10 * (sw - sp.l - sp.r); };
    var ssy = function(v) { return sp.t + (1 - (v - 0) / 10) * (sh - sp.t - sp.b); };
    return (
      React.createElement("svg", { width: sw, height: sh, style: { maxWidth: "100%", display: "block" } },
        React.createElement("text", { x: sw / 2, y: 14, textAnchor: "middle", fontSize: "11", fontWeight: "700", fill: "var(--ink)" }, title),
        DATA.map(function(p, i) {
          var col = CLUSTER_COLORS[labels[i] % CLUSTER_COLORS.length];
          return React.createElement("g", { key: i },
            React.createElement("circle", { cx: ssx(p[0]), cy: ssy(p[1]), r: "5", fill: col, opacity: "0.85", stroke: "white", strokeWidth: "1" }),
            React.createElement("text", { x: ssx(p[0]) + 7, y: ssy(p[1]) + 3, fontSize: "9", fill: "var(--ink)" }, LABELS[i])
          );
        })
      )
    );
  }

  // ── LinkageDiagram: illustrates a single linkage type ──
  function LinkageDiagram(props) {
    var type = props.type;
    var lw = 190, lh = 130;
    var clA = [{ x: 30, y: 80 }, { x: 50, y: 50 }, { x: 40, y: 100 }];
    var clB = [{ x: 130, y: 60 }, { x: 150, y: 90 }, { x: 140, y: 40 }];
    var colA = "#2B5BFF", colB = "#e0492e";

    var lines = [];
    if (type === "single") {
      lines = [{ x1: 50, y1: 50, x2: 130, y2: 60, col: "#1f9e6b", label: "min" }];
    } else if (type === "complete") {
      lines = [{ x1: 30, y1: 100, x2: 150, y2: 90, col: "#d97706", label: "max" }];
    } else if (type === "average") {
      clA.forEach(function(a) {
        clB.forEach(function(b) {
          lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, col: "#7c3aed", label: "" });
        });
      });
    } else if (type === "ward") {
      lines = [{ x1: 40, y1: 77, x2: 140, y2: 63, col: "#0891b2", label: "Δvar" }];
    }

    return (
      React.createElement("svg", { width: lw, height: lh, style: { display: "block" } },
        lines.map(function(ln, li) {
          return React.createElement("line", { key: li, x1: ln.x1, y1: ln.y1, x2: ln.x2, y2: ln.y2, stroke: ln.col, strokeWidth: "1.6", strokeDasharray: "4 3", opacity: "0.8" });
        }),
        clA.map(function(p, i) {
          return React.createElement("circle", { key: "a" + i, cx: p.x, cy: p.y, r: "6", fill: colA, opacity: "0.85", stroke: "white", strokeWidth: "1" });
        }),
        clB.map(function(p, i) {
          return React.createElement("circle", { key: "b" + i, cx: p.x, cy: p.y, r: "6", fill: colB, opacity: "0.85", stroke: "white", strokeWidth: "1" });
        }),
        React.createElement("text", { x: 42, y: lh - 5, fontSize: "10", fill: colA, fontWeight: "600" }, "Cluster A"),
        React.createElement("text", { x: 118, y: lh - 5, fontSize: "10", fill: colB, fontWeight: "600" }, "Cluster B"),
        lines.length > 0 && lines[0].label ? React.createElement("text", {
          x: (lines[0].x1 + lines[0].x2) / 2, y: (lines[0].y1 + lines[0].y2) / 2 - 6,
          fontSize: "10", fill: lines[0].col, fontWeight: "700", textAnchor: "middle"
        }, lines[0].label) : null
      )
    );
  }

  // ── DistMatrix: heat-map distance table ──
  function DistMatrix() {
    var n = DATA.length;
    var dists = [];
    var maxD = 0;
    for (var i = 0; i < n; i++) {
      dists[i] = [];
      for (var j = 0; j < n; j++) {
        var dx = DATA[i][0] - DATA[j][0];
        var dy = DATA[i][1] - DATA[j][1];
        var d = Math.sqrt(dx * dx + dy * dy);
        dists[i][j] = d;
        if (d > maxD) maxD = d;
      }
    }
    var minVal = Infinity, minI = 0, minJ = 1;
    for (var ii = 0; ii < n; ii++) {
      for (var jj = ii + 1; jj < n; jj++) {
        if (dists[ii][jj] < minVal) { minVal = dists[ii][jj]; minI = ii; minJ = jj; }
      }
    }

    var cellStyle = function(i, j, d) {
      var frac = d / maxD;
      var r = Math.round(43 + frac * 212);
      var g = Math.round(91 + frac * 164);
      var b = Math.round(255 - frac * 180);
      var bg = (i === j) ? "#f5f5f5"
        : ((i === minI && j === minJ) || (i === minJ && j === minI)) ? "rgba(224,73,46,0.18)"
        : "rgba(" + r + "," + g + "," + b + ",0.22)";
      return {
        background: bg,
        padding: "3px 5px",
        fontSize: 11,
        textAlign: "center",
        fontFamily: "var(--num-font)",
        color: (i === minI && j === minJ) || (i === minJ && j === minI) ? "#e0492e" : "var(--ink)",
        fontWeight: (i === minI && j === minJ) || (i === minJ && j === minI) ? "700" : "400",
        border: "1px solid var(--line-soft)",
        minWidth: 38,
      };
    };

    return (
      React.createElement("div", { style: { overflowX: "auto" } },
        React.createElement("table", { style: { borderCollapse: "collapse", fontSize: 11, margin: "0 auto" } },
          React.createElement("thead", null,
            React.createElement("tr", null,
              React.createElement("th", { style: { padding: "3px 5px", fontSize: 11, color: "var(--muted)", border: "1px solid var(--line-soft)" } }, ""),
              LABELS.map(function(lb, j) {
                return React.createElement("th", { key: j, style: { padding: "3px 5px", fontSize: 11, fontWeight: "600", color: "var(--ink)", border: "1px solid var(--line-soft)", background: "var(--panel-solid)" } }, lb);
              })
            )
          ),
          React.createElement("tbody", null,
            dists.map(function(row, i) {
              return React.createElement("tr", { key: i },
                React.createElement("td", { style: { padding: "3px 5px", fontSize: 11, fontWeight: "600", color: "var(--ink)", border: "1px solid var(--line-soft)", background: "var(--panel-solid)" } }, LABELS[i]),
                row.map(function(d, j) {
                  return React.createElement("td", { key: j, style: cellStyle(i, j, d) }, i === j ? "—" : fmt(d, 2));
                })
              );
            })
          )
        )
      )
    );
  }

  // ── helper: table ──
  function Table(props) {
    var headers = props.headers;
    var rows = props.rows;
    return (
      React.createElement("div", { style: { overflowX: "auto", margin: "10px 0" } },
        React.createElement("table", { className: "tf-table" },
          React.createElement("thead", null,
            React.createElement("tr", null,
              headers.map(function(h, i) { return React.createElement("th", { key: i }, h); })
            )
          ),
          React.createElement("tbody", null,
            rows.map(function(r, i) {
              return React.createElement("tr", { key: i },
                r.map(function(c, j) { return React.createElement("td", { key: j }, c); })
              );
            })
          )
        )
      )
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 1: Overview
  // ────────────────────────────────────────────────────────
  var stageOverview = {
    id: "overview", group: "Overview", title: "What is Hierarchical Clustering?",
    map: "Overview",
    why: "Hierarchical clustering reveals the nested structure of data — you don't need to choose k upfront.",
    render: function(trace) {
      return React.createElement(OverviewContent, { trace: trace });
    },
  };

  function OverviewContent(props) {
    var trace = props.trace;
    return React.createElement("div", null,
      React.createElement(Lead, null,
        React.createElement("b", null, "Hierarchical clustering"),
        " builds a tree of clusters (called a ",
        React.createElement("b", null, "dendrogram"),
        ") by progressively merging the two closest clusters, one pair at a time. The key advantage: you don",
        "’",
        "t need to specify k upfront — you cut the tree at any height to get any number of clusters."
      ),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "14px 0" } },
        React.createElement("div", null,
          React.createElement("div", { className: "tf-subhead" }, "8 data points"),
          React.createElement(ScatterPlot, { labels: trace.labels })
        ),
        React.createElement("div", null,
          React.createElement("div", { className: "tf-subhead" }, "Full dendrogram"),
          React.createElement(Dendrogram, { merges: trace.merges, nClusters: trace.nClusters })
        )
      ),
      React.createElement("div", { className: "tf-legend" },
        [
          ["No k needed upfront", "Unlike K-Means, you cluster first and decide how many clusters you want afterward, by inspecting the dendrogram."],
          ["Dendrogram reveals structure", "The tree diagram shows natural cluster structure — long vertical gaps indicate strong cluster separation."],
          ["Deterministic", "No random initialization. Given the same data and linkage, you always get the same result."],
          ["Any distance metric", "Works with Euclidean distance, cosine similarity, correlation, or any custom distance function."],
          ["Nested relationships", "The hierarchy reveals which clusters are sub-clusters of others — useful for taxonomy, biology, document clustering."],
        ].map(function(pair) {
          return React.createElement("div", { className: "tf-leg", key: pair[0] },
            React.createElement("div", { className: "tf-leg-name" }, pair[0]),
            React.createElement("div", { className: "tf-leg-desc" }, pair[1])
          );
        })
      )
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 2: Bottom-Up
  // ────────────────────────────────────────────────────────
  var stageBottomUp = {
    id: "bottomup", group: "Algorithm", title: "Agglomerative Clustering — Build Up from Leaves",
    map: "Bottom-Up",
    why: "Agglomerative = bottom-up. Each point starts as its own cluster; we merge the closest pair repeatedly.",
    render: function(trace) {
      return React.createElement(BottomUpContent, { trace: trace });
    },
  };

  function BottomUpContent(props) {
    var trace = props.trace;
    var merges = trace.merges;

    var steps = [];
    var cur = DATA.map(function(_, i) { return [i]; });
    steps.push({ label: "Start: " + DATA.length + " singleton clusters", clusters: cur.map(function(c) { return c.slice(); }), distance: null });
    merges.forEach(function(m, mi) {
      var next = [];
      var merged = false;
      cur.forEach(function(cl) {
        if (!merged && cl.every(function(x) { return m.merged.indexOf(x) >= 0; }) && cl.length === m.a.length + m.b.length) {
          next.push(cl);
          merged = true;
        } else if (!merged && (
          (cl.every(function(x) { return m.a.indexOf(x) >= 0; }) && cl.length === m.a.length) ||
          (cl.every(function(x) { return m.b.indexOf(x) >= 0; }) && cl.length === m.b.length)
        )) {
          // skip — will be replaced
        } else {
          next.push(cl);
        }
      });
      if (!merged) next.push(m.merged.slice());
      cur = next.slice();
      cur = [];
      // rebuild from scratch
      var remaining = DATA.map(function(_, i) { return i; });
      var usedMerges = merges.slice(0, mi + 1);
      var clsNow = DATA.map(function(_, i) { return [i]; });
      usedMerges.forEach(function(mm) {
        var ai2 = -1, bi2 = -1;
        clsNow.forEach(function(c, ci) {
          if (ai2 === -1 && c.length === mm.a.length && mm.a.every(function(x) { return c.indexOf(x) >= 0; })) ai2 = ci;
          if (bi2 === -1 && c.length === mm.b.length && mm.b.every(function(x) { return c.indexOf(x) >= 0; })) bi2 = ci;
        });
        if (ai2 >= 0 && bi2 >= 0) {
          var mg2 = clsNow[ai2].concat(clsNow[bi2]);
          var next2 = [];
          clsNow.forEach(function(c, ci) { if (ci !== ai2 && ci !== bi2) next2.push(c); });
          next2.push(mg2);
          clsNow = next2;
        }
      });
      cur = clsNow;
      steps.push({
        label: "Step " + (mi + 1) + ": merge {" + m.a.map(function(x) { return LABELS[x]; }).join(",") + "} + {" + m.b.map(function(x) { return LABELS[x]; }).join(",") + "}",
        clusters: clsNow.map(function(c) { return c.slice(); }),
        distance: m.distance,
      });
    });

    return React.createElement("div", null,
      React.createElement(Lead, null,
        "Agglomerative hierarchical clustering starts with ",
        React.createElement("b", null, "n clusters"),
        " (one per point) and merges the two closest at each step until one cluster remains. This builds the dendrogram from leaves to root."
      ),
      React.createElement("div", { style: { overflowX: "auto", margin: "10px 0" } },
        React.createElement("table", { className: "tf-table" },
          React.createElement("thead", null,
            React.createElement("tr", null,
              React.createElement("th", null, "Step"),
              React.createElement("th", null, "Action"),
              React.createElement("th", null, "Distance"),
              React.createElement("th", null, "Clusters remaining")
            )
          ),
          React.createElement("tbody", null,
            steps.map(function(s, si) {
              return React.createElement("tr", { key: si, style: si === 0 ? { background: "var(--accent-soft)" } : {} },
                React.createElement("td", null, si === 0 ? "Init" : si),
                React.createElement("td", null, s.label),
                React.createElement("td", { style: { fontFamily: "var(--num-font)" } }, s.distance !== null ? fmt(s.distance, 3) : "—"),
                React.createElement("td", null, s.clusters.length)
              );
            })
          )
        )
      ),
      React.createElement(Note, null, "Each row in this table corresponds to one horizontal bar in the dendrogram. The distance column is the height where those two clusters merge in the tree.")
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 3: Distance Matrix
  // ────────────────────────────────────────────────────────
  var stageDistances = {
    id: "distances", group: "Algorithm", title: "Distance Matrix — The Foundation",
    map: "Distances",
    why: "Hierarchical clustering only needs distances — it is one of the few algorithms that can work with any distance matrix.",
    render: function(trace) {
      return React.createElement(DistancesContent, { trace: trace });
    },
  };

  function DistancesContent(props) {
    return React.createElement("div", null,
      React.createElement(Lead, null,
        "Hierarchical clustering starts with an ",
        React.createElement("b", null, "8×8 pairwise distance matrix"),
        ". At each step, we find the minimum off-diagonal entry and merge those two points (or clusters). Heat coloring: ",
        React.createElement("b", null, "darker blue"),
        " = closer, ",
        React.createElement("b", null, "lighter"),
        " = farther."
      ),
      React.createElement(DistMatrix, null),
      React.createElement(Note, null,
        "The red-highlighted cell shows the smallest pairwise distance (first merge). After each merge, the matrix shrinks by 1 row and column. How the distance to the merged cluster is computed is the LINKAGE criterion."
      ),
      React.createElement("div", { style: { margin: "12px 0 4px" } },
        React.createElement("div", { className: "tf-subhead" }, "Why a full distance matrix?"),
        React.createElement("p", { style: { fontSize: 13, color: "var(--ink)", lineHeight: 1.7, margin: "6px 0" } },
          "Hierarchical clustering is a distance-based algorithm — it never needs to know the raw feature values after the matrix is built. This means you can use ",
          React.createElement("b", null, "any distance metric"),
          ": Euclidean, cosine, correlation, edit distance (for strings), or a custom domain distance. This is a key advantage over K-Means, which requires Euclidean-like space to compute centroids."
        )
      )
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 4: Linkage
  // ────────────────────────────────────────────────────────
  var stageLinkage = {
    id: "linkage", group: "Algorithm", title: "Linkage Criteria — How to Measure Cluster Distance",
    map: "Linkage",
    why: "Linkage defines what 'distance between clusters' means — and it dramatically changes the result.",
    render: function(trace) {
      return React.createElement(LinkageContent, { trace: trace });
    },
  };

  function LinkageContent(props) {
    var trace = props.trace;
    return React.createElement("div", null,
      React.createElement(Lead, null,
        "When two clusters A and B are candidates for merging, we need their distance. How we define this distance is the ",
        React.createElement("b", null, "linkage criterion"),
        ". The choice dramatically changes the shape and size of resulting clusters."
      ),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "14px 0" } },
        [
          { type: "single", title: "Single Linkage", desc: "min distance between any pair. Nearest neighbor. Can cause chaining." },
          { type: "complete", title: "Complete Linkage", desc: "max distance between any pair. Furthest neighbor. Compact clusters." },
          { type: "average", title: "Average Linkage", desc: "mean of all pairwise distances. Balanced, less sensitive to outliers." },
          { type: "ward", title: "Ward's Method", desc: "minimize increase in total within-cluster variance. Most commonly best." },
        ].map(function(item) {
          return React.createElement("div", { key: item.type, style: { background: "var(--panel-solid)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--line-soft)" } },
            React.createElement("div", { style: { fontWeight: "700", fontSize: 13, color: "var(--ink)", marginBottom: 6 } }, item.title),
            React.createElement(LinkageDiagram, { type: item.type }),
            React.createElement("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 6 } }, item.desc)
          );
        })
      ),
      React.createElement(Table, {
        headers: ["Linkage", "Formula", "Tends to produce", "Sensitive to"],
        rows: [
          ["Single", "min(d(a,b))", "Long, chain-like clusters", "Outliers — one outlier can bridge clusters"],
          ["Complete", "max(d(a,b))", "Compact, equal-size clusters", "Outliers — max distance inflated"],
          ["Average", "mean(d(a,b))", "Intermediate, robust", "Less sensitive"],
          ["Ward", "ΔVariance", "Compact, equal-size (like K-Means)", "Outliers, scale"],
        ]
      }),
      React.createElement(Note, null,
        "Ward’s linkage typically produces the best results for compact cluster data. It is the default in scipy and sklearn."
      ),
      React.createElement("div", { style: { marginTop: 12 } },
        React.createElement("div", { className: "tf-subhead" }, "Current result with " + trace.linkage + " linkage"),
        React.createElement(ScatterPlot, { labels: trace.labels })
      )
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 5: Dendrogram
  // ────────────────────────────────────────────────────────
  var stageDendrogram = {
    id: "dendrogram", group: "Visualization", title: "Reading the Dendrogram",
    map: "Dendrogram",
    why: "The dendrogram is the unique visualization of hierarchical clustering — it shows all possible clusterings at once.",
    render: function(trace) {
      return React.createElement(DendrogramContent, { trace: trace });
    },
  };

  function DendrogramContent(props) {
    var trace = props.trace;
    return React.createElement("div", null,
      React.createElement(Lead, null,
        "The ",
        React.createElement("b", null, "dendrogram"),
        " is a tree diagram where the y-axis shows merge distance (height). Each horizontal bar represents a merge. Reading it: leaves = data points, height = how ‘different’ two clusters were when they merged."
      ),
      React.createElement(Dendrogram, { merges: trace.merges, nClusters: trace.nClusters }),
      React.createElement("div", { className: "tf-legend" },
        [
          ["Leaves (bottom)", "Individual data points. Each point starts as its own cluster."],
          ["Height where branches join", "The distance at which those clusters were merged. Higher = more dissimilar when merged."],
          ["Long vertical lines", "A large gap between successive merge heights = strong, natural cluster separation."],
          ["Cut line (dashed red)", "Draw a horizontal cut to get k clusters. Cutting lower gives more clusters; cutting higher gives fewer."],
          ["The 3 long gaps", "In our dataset, the 3 longest vertical segments correspond to {Alice,Bob,Carol}, {Dave,Eve,Frank}, {Grace,Heidi} — the 3 natural clusters."],
        ].map(function(pair) {
          return React.createElement("div", { className: "tf-leg", key: pair[0] },
            React.createElement("div", { className: "tf-leg-name" }, pair[0]),
            React.createElement("div", { className: "tf-leg-desc" }, pair[1])
          );
        })
      )
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 6: Cutting the Tree
  // ────────────────────────────────────────────────────────
  var stageCut = {
    id: "cut", group: "Visualization", title: "Cutting the Dendrogram — Choosing k",
    map: "Cut Tree",
    why: "The cut height determines how many clusters you get — this is how you choose k after clustering.",
    render: function(trace) {
      return React.createElement(CutContent, { trace: trace });
    },
  };

  function CutContent(props) {
    var trace = props.trace;
    var merges = trace.merges;

    // Build cut table
    var cutRows = [];
    for (var k = 1; k <= DATA.length; k++) {
      var cutIdx = DATA.length - k;
      var cutH = cutIdx < merges.length ? fmt(merges[cutIdx].distance, 3) : "∞";

      // Figure out which clusters form
      var clsNow2 = DATA.map(function(_, i) { return [i]; });
      var stopAt2 = DATA.length - k;
      for (var step2 = 0; step2 < stopAt2 && step2 < merges.length; step2++) {
        var mm2 = merges[step2];
        var ai3 = -1, bi3 = -1;
        clsNow2.forEach(function(c, ci) {
          if (ai3 === -1 && c.length === mm2.a.length && mm2.a.every(function(x) { return c.indexOf(x) >= 0; })) ai3 = ci;
          if (bi3 === -1 && c.length === mm2.b.length && mm2.b.every(function(x) { return c.indexOf(x) >= 0; })) bi3 = ci;
        });
        if (ai3 >= 0 && bi3 >= 0) {
          var mg3 = clsNow2[ai3].concat(clsNow2[bi3]);
          var next3 = [];
          clsNow2.forEach(function(c, ci) { if (ci !== ai3 && ci !== bi3) next3.push(c); });
          next3.push(mg3);
          clsNow2 = next3;
        }
      }
      var clsDesc = clsNow2.map(function(cl) {
        return "{" + cl.map(function(x) { return LABELS[x]; }).join(",") + "}";
      }).join("  ");
      cutRows.push([k, cutH, clsDesc]);
    }

    return React.createElement("div", null,
      React.createElement(Lead, null,
        "To get k clusters, draw a horizontal line across the dendrogram at a height that cuts exactly k vertical lines. The ",
        React.createElement("b", null, "n_clusters slider"),
        " controls this cut."
      ),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "14px 0" } },
        React.createElement("div", null,
          React.createElement("div", { className: "tf-subhead" }, "Dendrogram with cut"),
          React.createElement(Dendrogram, { merges: merges, nClusters: trace.nClusters })
        ),
        React.createElement("div", null,
          React.createElement("div", { className: "tf-subhead" }, "Scatter (" + trace.nClusters + " clusters)"),
          React.createElement(ScatterPlot, { labels: trace.labels })
        )
      ),
      React.createElement(Table, {
        headers: ["n_clusters", "Cut height", "Clusters formed"],
        rows: cutRows
      }),
      React.createElement(Note, null,
        "Unlike K-Means, you can explore all possible k values from a single dendrogram. This is the key practical advantage of hierarchical clustering."
      )
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 7: Linkage Compare
  // ────────────────────────────────────────────────────────
  var stageLinkageCompare = {
    id: "linkage-compare", group: "Insights", title: "Linkage Method Comparison",
    map: "Linkage Compare",
    why: "Choosing the wrong linkage method for your data leads to meaningless clusters.",
    render: function(trace) {
      return React.createElement(LinkageCompareContent, { trace: trace });
    },
  };

  function LinkageCompareContent(props) {
    var trace = props.trace;
    var nC = trace.nClusters;

    var getLabels = function(lnk) {
      var result = window.ML_HIER.run({ linkage: lnk, nClusters: nC });
      return result.labels;
    };

    var wardLabels = getLabels("ward");
    var singleLabels = getLabels("single");
    var completeLabels = getLabels("complete");

    return React.createElement("div", null,
      React.createElement(Lead, null,
        "Different linkage methods produce different clusterings on the same data. The three scatter plots below show Ward, Single, and Complete linkage results for ",
        React.createElement("b", null, nC + " clusters"),
        "."
      ),
      React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", margin: "14px 0", justifyContent: "center" } },
        React.createElement(SmallScatter, { labels: wardLabels, title: "Ward" }),
        React.createElement(SmallScatter, { labels: singleLabels, title: "Single" }),
        React.createElement(SmallScatter, { labels: completeLabels, title: "Complete" })
      ),
      React.createElement(Table, {
        headers: ["Linkage", "Best for"],
        rows: [
          ["Ward", "Compact, equal-size clusters (most common choice)"],
          ["Complete", "Clusters with no noise/outliers"],
          ["Average", "Non-spherical data, when Ward produces bad results"],
          ["Single", "Detecting chain-like structures, testing for outliers"],
        ]
      }),
      React.createElement(Note, null,
        "For our clearly separated dataset all methods give similar results. On noisier, overlapping, or chain-shaped data the differences become dramatic."
      )
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 8: Divisive
  // ────────────────────────────────────────────────────────
  var stageDivisive = {
    id: "divisive", group: "Concepts", title: "Two Directions: Bottom-Up vs Top-Down",
    map: "Agglom vs Div",
    why: "There are two types of hierarchical clustering — understanding the difference explains computational complexity.",
    render: function(trace) {
      return React.createElement(DivisiveContent, { trace: trace });
    },
  };

  function DivisiveContent(props) {
    return React.createElement("div", null,
      React.createElement(Lead, null,
        "Hierarchical clustering can go in two directions: ",
        React.createElement("b", null, "agglomerative"),
        " (bottom-up, merge) and ",
        React.createElement("b", null, "divisive"),
        " (top-down, split). In practice, agglomerative is almost always used."
      ),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "14px 0" } },
        React.createElement("div", { style: { background: "rgba(43,91,255,0.07)", borderRadius: 10, padding: "14px 16px", border: "1.5px solid rgba(43,91,255,0.2)" } },
          React.createElement("div", { style: { fontWeight: "700", fontSize: 14, color: "var(--accent)", marginBottom: 8 } }, "↑ Agglomerative (Bottom-Up)"),
          React.createElement("svg", { width: 160, height: 110, style: { display: "block", margin: "0 auto 8px" } },
            React.createElement("text", { x: 10, y: 100, fontSize: 9, fill: "var(--muted)" }, "A"),
            React.createElement("text", { x: 40, y: 100, fontSize: 9, fill: "var(--muted)" }, "B"),
            React.createElement("text", { x: 70, y: 100, fontSize: 9, fill: "var(--muted)" }, "C"),
            React.createElement("text", { x: 100, y: 100, fontSize: 9, fill: "var(--muted)" }, "D"),
            React.createElement("line", { x1: 14, y1: 90, x2: 14, y2: 70, stroke: "var(--accent)", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 44, y1: 90, x2: 44, y2: 70, stroke: "var(--accent)", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 14, y1: 70, x2: 44, y2: 70, stroke: "var(--accent)", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 74, y1: 90, x2: 74, y2: 70, stroke: "var(--accent)", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 104, y1: 90, x2: 104, y2: 70, stroke: "var(--accent)", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 74, y1: 70, x2: 104, y2: 70, stroke: "var(--accent)", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 29, y1: 70, x2: 29, y2: 40, stroke: "var(--accent)", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 89, y1: 70, x2: 89, y2: 40, stroke: "var(--accent)", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 29, y1: 40, x2: 89, y2: 40, stroke: "var(--accent)", strokeWidth: 1.5 }),
            React.createElement("circle", { cx: 14, cy: 92, r: 4, fill: "var(--accent)", opacity: 0.7 }),
            React.createElement("circle", { cx: 44, cy: 92, r: 4, fill: "var(--accent)", opacity: 0.7 }),
            React.createElement("circle", { cx: 74, cy: 92, r: 4, fill: "var(--accent)", opacity: 0.7 }),
            React.createElement("circle", { cx: 104, cy: 92, r: 4, fill: "var(--accent)", opacity: 0.7 }),
            React.createElement("text", { x: 80, y: 22, fontSize: 9, fill: "var(--muted)", textAnchor: "middle" }, "merge ↑")
          ),
          React.createElement("ul", { style: { fontSize: 13, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 } },
            React.createElement("li", null, "Start: n singleton clusters"),
            React.createElement("li", null, "Each step: merge 2 closest"),
            React.createElement("li", null, "End: 1 cluster"),
            React.createElement("li", null, "Complexity: O(n² log n)"),
            React.createElement("li", null, "sklearn: AgglomerativeClustering")
          )
        ),
        React.createElement("div", { style: { background: "rgba(224,73,46,0.07)", borderRadius: 10, padding: "14px 16px", border: "1.5px solid rgba(224,73,46,0.2)" } },
          React.createElement("div", { style: { fontWeight: "700", fontSize: 14, color: "#e0492e", marginBottom: 8 } }, "↓ Divisive (Top-Down)"),
          React.createElement("svg", { width: 160, height: 110, style: { display: "block", margin: "0 auto 8px" } },
            React.createElement("text", { x: 10, y: 100, fontSize: 9, fill: "var(--muted)" }, "A"),
            React.createElement("text", { x: 40, y: 100, fontSize: 9, fill: "var(--muted)" }, "B"),
            React.createElement("text", { x: 70, y: 100, fontSize: 9, fill: "var(--muted)" }, "C"),
            React.createElement("text", { x: 100, y: 100, fontSize: 9, fill: "var(--muted)" }, "D"),
            React.createElement("line", { x1: 14, y1: 90, x2: 14, y2: 70, stroke: "#e0492e", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 44, y1: 90, x2: 44, y2: 70, stroke: "#e0492e", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 14, y1: 70, x2: 44, y2: 70, stroke: "#e0492e", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 74, y1: 90, x2: 74, y2: 70, stroke: "#e0492e", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 104, y1: 90, x2: 104, y2: 70, stroke: "#e0492e", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 74, y1: 70, x2: 104, y2: 70, stroke: "#e0492e", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 29, y1: 70, x2: 29, y2: 40, stroke: "#e0492e", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 89, y1: 70, x2: 89, y2: 40, stroke: "#e0492e", strokeWidth: 1.5 }),
            React.createElement("line", { x1: 29, y1: 40, x2: 89, y2: 40, stroke: "#e0492e", strokeWidth: 1.5 }),
            React.createElement("circle", { cx: 14, cy: 92, r: 4, fill: "#e0492e", opacity: 0.7 }),
            React.createElement("circle", { cx: 44, cy: 92, r: 4, fill: "#e0492e", opacity: 0.7 }),
            React.createElement("circle", { cx: 74, cy: 92, r: 4, fill: "#e0492e", opacity: 0.7 }),
            React.createElement("circle", { cx: 104, cy: 92, r: 4, fill: "#e0492e", opacity: 0.7 }),
            React.createElement("text", { x: 80, y: 22, fontSize: 9, fill: "var(--muted)", textAnchor: "middle" }, "split ↓")
          ),
          React.createElement("ul", { style: { fontSize: 13, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 } },
            React.createElement("li", null, "Start: 1 cluster (all data)"),
            React.createElement("li", null, "Each step: split into 2"),
            React.createElement("li", null, "End: n singleton clusters"),
            React.createElement("li", null, "Complexity: O(2ⁿ) exact"),
            React.createElement("li", null, "sklearn: not natively supported")
          )
        )
      ),
      React.createElement(Table, {
        headers: ["", "Agglomerative", "Divisive"],
        rows: [
          ["Direction", "Bottom-up (merge)", "Top-down (split)"],
          ["Complexity", "O(n² log n)", "O(2ⁿ) exact"],
          ["Used in practice", "Yes (sklearn, scipy)", "Rarely"],
          ["sklearn class", "AgglomerativeClustering", "Not natively supported"],
          ["Algorithm example", "AGNES", "DIANA"],
        ]
      })
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 9: Compare with K-Means
  // ────────────────────────────────────────────────────────
  var stageCompare = {
    id: "compare", group: "Insights", title: "Hierarchical vs K-Means — When to Use Which",
    map: "Compare",
    why: "Both find clusters in data but with very different characteristics and use cases.",
    render: function(trace) {
      return React.createElement(CompareContent, { trace: trace });
    },
  };

  function CompareContent(props) {
    return React.createElement("div", null,
      React.createElement(Lead, null,
        "Hierarchical clustering and K-Means are complementary. Hierarchical reveals structure; K-Means scales to large datasets."
      ),
      React.createElement(Table, {
        headers: ["", "K-Means", "Hierarchical"],
        rows: [
          ["Specify k", "Yes, upfront", "No — choose after"],
          ["Deterministic", "No (random init)", "Yes"],
          ["Complexity", "O(nkt) — fast", "O(n² log n) — slow for large n"],
          ["Max dataset size", "Millions", "~50,000 (practical limit)"],
          ["Cluster shapes", "Convex only", "Any (with single linkage)"],
          ["Interpretability", "Centroids", "Dendrogram"],
          ["Memory", "O(nk)", "O(n²) distance matrix"],
          ["When to use", "Large datasets, known k, fast iteration", "Small-medium data, explore structure, no k assumption"],
        ]
      }),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "14px 0" } },
        React.createElement("div", { style: { background: "rgba(43,91,255,0.07)", borderRadius: 10, padding: "14px 16px", border: "1.5px solid rgba(43,91,255,0.2)" } },
          React.createElement("div", { style: { fontWeight: "700", fontSize: 13, color: "var(--accent)", marginBottom: 8 } }, "Use Hierarchical when:"),
          React.createElement("ul", { style: { fontSize: 13, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 } },
            React.createElement("li", null, "Exploring data for the first time (dendrogram reveals k)"),
            React.createElement("li", null, "Dataset is small to medium (< 10K points)"),
            React.createElement("li", null, "You need nested or hierarchical cluster structure"),
            React.createElement("li", null, "You want a reproducible, deterministic result"),
            React.createElement("li", null, "You are using a non-Euclidean distance metric")
          )
        ),
        React.createElement("div", { style: { background: "rgba(31,158,107,0.07)", borderRadius: 10, padding: "14px 16px", border: "1.5px solid rgba(31,158,107,0.2)" } },
          React.createElement("div", { style: { fontWeight: "700", fontSize: 13, color: "#1f9e6b", marginBottom: 8 } }, "Use K-Means when:"),
          React.createElement("ul", { style: { fontSize: 13, color: "var(--ink)", margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 } },
            React.createElement("li", null, "Dataset is large (tens of thousands to millions)"),
            React.createElement("li", null, "k is already known from domain knowledge"),
            React.createElement("li", null, "Speed and memory efficiency matter"),
            React.createElement("li", null, "Clusters are roughly spherical (convex)"),
            React.createElement("li", null, "You need centroids as cluster summaries")
          )
        )
      )
    );
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 10: Hyperparameters
  // ────────────────────────────────────────────────────────
  var stageHyperparams = {
    id: "hyperparams", group: "Hyperparameters", title: "Hierarchical Clustering Hyperparameters",
    map: "Hyperparams",
    why: "Linkage is the most important choice — it defines what 'similar' means for your clusters.",
    render: function(trace) {
      return React.createElement(HyperparamsContent, { trace: trace });
    },
  };

  function HyperparamsContent(props) {
    var codeStr = "from sklearn.cluster import AgglomerativeClustering\n\nmodel = AgglomerativeClustering(\n    n_clusters=3,\n    linkage='ward'\n)\nlabels = model.fit_predict(X)";
    return React.createElement("div", null,
      React.createElement(Lead, null,
        "sklearn’s ",
        React.createElement("code", null, "AgglomerativeClustering"),
        " exposes several parameters. Linkage is the most consequential choice."
      ),
      React.createElement(Table, {
        headers: ["Parameter", "What it does", "Default", "Recommendation"],
        rows: [
          ["n_clusters", "Number of clusters (cut height)", "2", "Determine from dendrogram"],
          ["linkage", "How cluster distance is measured", "'ward'", "Ward for compact clusters; single for chains"],
          ["metric (affinity)", "Distance metric", "'euclidean'", "'euclidean' standard; 'cosine' for text/high-dim"],
          ["compute_full_tree", "Whether to build full tree", "'auto'", "True if you want to explore different k values"],
          ["distance_threshold", "Alternative to n_clusters", "None", "Set instead of n_clusters for threshold-based cut"],
          ["connectivity", "Constraint matrix", "None", "Constrain to only merge spatially connected clusters"],
        ]
      }),
      React.createElement("div", { style: { margin: "14px 0 4px" } },
        React.createElement("div", { className: "tf-subhead" }, "sklearn code"),
        React.createElement("pre", { style: {
          background: "var(--code-bg, #1a1a2e)", color: "var(--code-fg, #e2e8f0)",
          borderRadius: 10, padding: "14px 16px", fontSize: 13,
          fontFamily: "var(--mono-font, monospace)", overflowX: "auto", margin: "6px 0"
        } }, codeStr)
      ),
      React.createElement("div", { className: "tf-legend" },
        [
          ["Ward linkage + Euclidean", "The best-practice default. Produces compact, equal-size clusters. Equivalent to minimizing within-cluster sum of squares (same objective as K-Means)."],
          ["distance_threshold", "Alternative to n_clusters. Instead of specifying k, you specify the maximum allowed merge height. Points that are farther apart than this threshold stay in separate clusters."],
          ["connectivity matrix", "Powerful for spatial data. You can enforce that only spatially adjacent clusters merge — useful for image segmentation or geographic data."],
          ["compute_full_tree", "When using distance_threshold, you must set compute_full_tree=True so sklearn builds the complete dendrogram rather than stopping early."],
        ].map(function(pair) {
          return React.createElement("div", { className: "tf-leg", key: pair[0] },
            React.createElement("div", { className: "tf-leg-name" }, pair[0]),
            React.createElement("div", { className: "tf-leg-desc" }, pair[1])
          );
        })
      )
    );
  }

  // ── Assemble stages ──
  var STAGES = [
    stageOverview,
    stageBottomUp,
    stageDistances,
    stageLinkage,
    stageDendrogram,
    stageCut,
    stageLinkageCompare,
    stageDivisive,
    stageCompare,
    stageHyperparams,
  ];

  // ── renderInput ──
  function renderInput(input, setInput, trace) {
    return React.createElement(React.Fragment, null,
      React.createElement("label", { className: "nn-slider" },
        React.createElement("span", { className: "nn-slider-l" }, "clusters"),
        React.createElement("input", {
          type: "range", min: "1", max: "8", step: "1", value: input.nClusters,
          onChange: function(e) { setInput(Object.assign({}, input, { nClusters: parseInt(e.target.value) })); }
        }),
        React.createElement("span", { className: "nn-slider-v" }, input.nClusters)
      ),
      React.createElement("label", { className: "nn-slider" },
        React.createElement("span", { className: "nn-slider-l" }, "linkage"),
        React.createElement("select", {
          value: input.linkage,
          onChange: function(e) { setInput(Object.assign({}, input, { linkage: e.target.value })); },
          style: { fontSize: 12, padding: "2px 6px", borderRadius: 6, border: "1px solid var(--line)" }
        },
          React.createElement("option", { value: "ward" }, "Ward"),
          React.createElement("option", { value: "complete" }, "Complete"),
          React.createElement("option", { value: "average" }, "Average"),
          React.createElement("option", { value: "single" }, "Single")
        )
      ),
      React.createElement("span", { style: { fontSize: 12, color: "var(--muted)", paddingLeft: 4 } },
        trace.nClusters + " clusters · " + input.linkage + " linkage"
      )
    );
  }

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "Hierarchical Clustering",
    subtitle: "Build a dendrogram — no k required upfront",
    cur: "Hierarchical",
    category: "Clustering",
    run: function(input) { return window.ML_HIER.run(input); },
    default: { linkage: "ward", nClusters: 3 },
    renderInput: renderInput,
    modeLinks: [
      { label: "K-Means", href: "K-Means.html", active: false },
      { label: "DBSCAN", href: "DBSCAN.html", active: false },
      { label: "Hierarchical", href: "Hierarchical.html", active: true },
    ],
  };
})();
