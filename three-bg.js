/* ============================================================
   NeuralBG — a lightweight 3D neural-network backdrop (Three.js).
   Renders a slowly-rotating point lattice with connecting edges,
   on a transparent canvas so it sits behind hero content.
   Usage:  NeuralBG.init("hero3d-home", { color: 0x2B5BFF });
   Requires THREE (r128 UMD global) loaded first.
   ============================================================ */
(function () {
  function init(elId, opts) {
    var el = document.getElementById(elId);
    if (!el || !window.THREE) return;
    opts = opts || {};
    var THREE = window.THREE;
    var color = opts.color != null ? opts.color : 0x2b5bff;
    var COUNT = opts.count || 70;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var w = el.clientWidth || el.offsetWidth || 800;
    var h = el.clientHeight || el.offsetHeight || 500;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.z = 18;

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    var group = new THREE.Group();
    scene.add(group);

    // scatter nodes inside a soft box
    var R = 13, RY = 7, RZ = 6;
    var nodes = [];
    for (var i = 0; i < COUNT; i++) {
      nodes.push(new THREE.Vector3(
        (Math.random() * 2 - 1) * R,
        (Math.random() * 2 - 1) * RY,
        (Math.random() * 2 - 1) * RZ
      ));
    }

    // points
    var pPos = new Float32Array(COUNT * 3);
    for (var p = 0; p < COUNT; p++) { pPos[p*3]=nodes[p].x; pPos[p*3+1]=nodes[p].y; pPos[p*3+2]=nodes[p].z; }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    var points = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: color, size: 0.5, transparent: true, opacity: 0.8, sizeAttenuation: true,
    }));
    group.add(points);

    // edges between nearby nodes
    var segs = [];
    var TH = 5.2;
    for (var a = 0; a < COUNT; a++) {
      for (var b = a + 1; b < COUNT; b++) {
        if (nodes[a].distanceTo(nodes[b]) < TH) {
          segs.push(nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z);
        }
      }
    }
    var lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segs), 3));
    var lines = new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({
      color: color, transparent: true, opacity: 0.22,
    }));
    group.add(lines);

    group.rotation.x = -0.15;

    var mx = 0, my = 0, tx = 0, ty = 0;
    function onMove(e) {
      var r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 0.5;
    }
    if (!reduce) window.addEventListener("pointermove", onMove);

    function resize() {
      w = el.clientWidth || 800; h = el.clientHeight || 500;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", resize);

    var running = true;
    document.addEventListener("visibilitychange", function () { running = !document.hidden; });

    var t = 0;
    function frame() {
      if (!running) { requestAnimationFrame(frame); return; }
      t += 0.0016;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      group.rotation.y = t + mx;
      group.rotation.x = -0.15 + my * 0.6;
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    if (reduce) { renderer.render(scene, camera); }
    else { requestAnimationFrame(frame); }
  }

  window.NeuralBG = { init: init };
})();
