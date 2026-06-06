/* ============================================================
   SkillGraph — interactive force-directed knowledge graph.
   Color-coded category hubs + skill nodes, gentle physics,
   drag-to-grab. Renders a legend into opts.legendId.
     SkillGraph.init("elId", techStack, { legendId })
   ============================================================ */
(function () {
  function cssv(name, fb) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fb;
  }
  // distinct, professional palette (hex + rgb for glows)
  var PALETTE = [
    ["#2B5BFF", "43,91,255"],   // blue
    ["#0FA3C7", "15,163,199"],  // cyan
    ["#7C5CFF", "124,92,255"],  // violet
    ["#1F9E6B", "31,158,107"],  // green
    ["#E0851E", "224,133,30"],  // amber
    ["#E0518F", "224,81,143"],  // magenta
    ["#4F46E5", "79,70,229"],   // indigo
    ["#5B7089", "91,112,137"],  // slate
    ["#E0492E", "224,73,46"],   // vermillion
  ];

  function init(elId, groups, opts) {
    var el = document.getElementById(elId);
    if (!el) return;
    opts = opts || {};
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var COL = {
      ink: cssv("--ink", "#0E1726"),
      muted: cssv("--muted", "#566681"),
      line: cssv("--line", "#E4EAF4"),
      panel: cssv("--panel-solid", "#fff"),
    };

    // legend
    if (opts.legendId) {
      var lg = document.getElementById(opts.legendId);
      if (lg) {
        lg.innerHTML = groups.map(function (g, i) {
          var c = PALETTE[i % PALETTE.length][0];
          return '<span class="pf-leg-item"><span class="pf-leg-swatch" style="background:' + c + '"></span>' + g.group + '</span>';
        }).join("");
      }
    }

    var canvas = document.createElement("canvas");
    el.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      W = el.clientWidth; H = el.clientHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    var nodes = [], edges = [];
    function measure(text, font) { ctx.font = font; return ctx.measureText(text).width; }
    var catFont = "700 13px " + cssv("--head-font", "sans-serif");
    var skFont = "600 12px " + cssv("--num-font", "monospace");
    resize(); // know real dimensions before laying out nodes

    groups.forEach(function (g, gi) {
      var pal = PALETTE[gi % PALETTE.length];
      var GW = W || 1200, GH = H || 640;
      var ang = (gi / groups.length) * Math.PI * 2 - Math.PI / 2;
      var cx = GW / 2 + Math.cos(ang) * GW * 0.36;
      var cy = GH / 2 + Math.sin(ang) * GH * 0.34;
      var cw = measure(g.group, catFont) + 36;
      var cat = { label: g.group, cat: true, x: cx, y: cy, vx: 0, vy: 0, w: cw, h: 36, r: Math.max(cw, 36) / 2, col: pal[0], rgb: pal[1] };
      nodes.push(cat);
      g.items.forEach(function (it, ii) {
        var a2 = (ii / g.items.length) * Math.PI * 2;
        var w = measure(it, skFont) + 24;
        nodes.push({ label: it, cat: false,
          x: cx + Math.cos(a2) * 70 + (Math.random() * 16 - 8),
          y: cy + Math.sin(a2) * 70 + (Math.random() * 16 - 8),
          vx: 0, vy: 0, w: w, h: 28, r: Math.max(w, 28) / 2, col: pal[0], rgb: pal[1] });
        edges.push({ a: cat, b: nodes[nodes.length - 1], rgb: pal[1] });
      });
    });

    var drag = null, hover = null, px = 0, py = 0, lpx = 0, lpy = 0, alpha = 0.9;
    var MAXV = 3.4; // velocity clamp → no violent shaking

    function step() {
      var kRep = 6000, kGrav = 0.0055, cxc = W / 2, cyc = H / 2;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var m = nodes[j];
          var dx = n.x - m.x, dy = n.y - m.y;
          var d2 = dx * dx + dy * dy || 0.01, d = Math.sqrt(d2);
          var minD = n.r + m.r + 20;
          var f = kRep / d2;
          if (d < minD) f += (minD - d) * 0.7;
          var fx = (dx / d) * f, fy = (dy / d) * f;
          n.vx += fx; n.vy += fy; m.vx -= fx; m.vy -= fy;
        }
      }
      edges.forEach(function (e) {
        var dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var L = e.a.r + e.b.r + 30;
        var f = (d - L) * 0.03;
        var fx = (dx / d) * f, fy = (dy / d) * f;
        e.a.vx += fx; e.a.vy += fy; e.b.vx -= fx; e.b.vy -= fy;
      });
      nodes.forEach(function (n) {
        n.vx += (cxc - n.x) * kGrav * 0.8; n.vy += (cyc - n.y) * kGrav;
        if (n === drag) { n.x += (px - n.x) * 0.35; n.y += (py - n.y) * 0.35; n.vx = 0; n.vy = 0; return; }
        n.vx *= 0.9; n.vy *= 0.9;
        var sp = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (sp > MAXV) { n.vx = n.vx / sp * MAXV; n.vy = n.vy / sp * MAXV; }
        n.x += n.vx * alpha; n.y += n.vy * alpha;
        var pad = n.r + 10;
        if (n.x < pad) { n.x = pad; n.vx *= -0.3; }
        if (n.x > W - pad) { n.x = W - pad; n.vx *= -0.3; }
        if (n.y < pad) { n.y = pad; n.vy *= -0.3; }
        if (n.y > H - pad) { n.y = H - pad; n.vy *= -0.3; }
      });
      if (alpha > 0.16) alpha *= 0.992; // settle to a calm resting state
    }

    function rr(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      edges.forEach(function (e) {
        var on = hover && (hover === e.a || hover === e.b);
        ctx.strokeStyle = "rgba(" + e.rgb + (on ? ",.55)" : ",.20)");
        ctx.lineWidth = on ? 2 : 1.1;
        ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
      });
      nodes.forEach(function (n) {
        var w = n.w, h = n.h, x = n.x - w / 2, y = n.y - h / 2, hot = n === hover || n === drag;
        if (n.cat) {
          ctx.fillStyle = n.col;
          ctx.shadowColor = "rgba(" + n.rgb + ",.45)"; ctx.shadowBlur = hot ? 20 : 11;
          rr(x, y, w, h, h / 2); ctx.fill(); ctx.shadowBlur = 0;
          ctx.fillStyle = "#fff"; ctx.font = catFont;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(n.label, n.x, n.y + 0.5);
        } else {
          ctx.fillStyle = hot ? n.col : COL.panel;
          ctx.strokeStyle = hot ? n.col : "rgba(" + n.rgb + ",.45)";
          ctx.lineWidth = hot ? 2 : 1.3;
          ctx.shadowColor = "rgba(15,30,60,.12)"; ctx.shadowBlur = hot ? 14 : 6; ctx.shadowOffsetY = 2;
          rr(x, y, w, h, h / 2); ctx.fill();
          ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.stroke();
          ctx.fillStyle = hot ? "#fff" : COL.ink; ctx.font = skFont;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(n.label, n.x, n.y + 0.5);
        }
      });
    }

    var running = true;
    document.addEventListener("visibilitychange", function () { running = !document.hidden; });
    function frame() { if (running) { if (!reduce || drag) step(); draw(); } requestAnimationFrame(frame); }

    function at(mx, my) {
      for (var i = nodes.length - 1; i >= 0; i--) {
        var n = nodes[i];
        if (Math.abs(mx - n.x) <= n.w / 2 && Math.abs(my - n.y) <= n.h / 2) return n;
      }
      return null;
    }
    function pos(e) { var r = canvas.getBoundingClientRect(); var t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; }
    canvas.addEventListener("pointermove", function (e) {
      var p = pos(e); lpx = px; lpy = py; px = p.x; py = p.y;
      hover = drag || at(p.x, p.y);
      canvas.style.cursor = drag ? "grabbing" : (hover ? "grab" : "default");
    });
    canvas.addEventListener("pointerdown", function (e) {
      var p = pos(e), n = at(p.x, p.y);
      if (n) { drag = n; px = p.x; py = p.y; alpha = Math.max(alpha, 0.6); canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); }
    });
    function release() { if (drag) { drag.vx = (px - lpx) * 0.5; drag.vy = (py - lpy) * 0.5; drag = null; alpha = Math.max(alpha, 0.5); } }
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointerleave", function () { if (!drag) hover = null; });
    window.addEventListener("resize", resize);

    resize();
    if (reduce) { for (var k = 0; k < 300; k++) step(); }
    requestAnimationFrame(frame);
  }
  window.SkillGraph = { init: init };
})();
