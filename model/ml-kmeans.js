(function() {
  var DATA = [
    // Cluster A (around [2, 2])
    [1.5,2.1],[2.3,1.7],[1.8,2.8],[2.6,2.3],[1.2,1.5],[2.0,2.5],[2.8,1.9],[1.4,2.6],[2.5,1.3],[1.9,1.8],
    // Cluster B (around [7.5, 7])
    [7.1,6.8],[7.8,7.3],[6.9,7.6],[8.2,6.5],[7.4,7.8],[8.0,7.1],[7.2,6.3],[7.9,7.9],[6.7,7.0],[8.3,6.8],
    // Cluster C (around [8, 2.5])
    [7.5,2.2],[8.3,2.8],[7.8,1.9],[8.6,2.5],[7.2,3.0],[8.1,1.6],[7.6,3.2],[8.4,2.1],[7.0,2.7],[8.7,3.1],
  ];

  var COLORS = ["#2B5BFF", "#e0492e", "#1f9e6b", "#d97706", "#7c3aed", "#db2777"];

  function seededRand(seed) {
    var s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function initPP(k, rand) {
    var cents = [DATA[Math.floor(rand() * DATA.length)].slice()];
    while (cents.length < k) {
      var dists = DATA.map(function(p) {
        return Math.min.apply(null, cents.map(function(c) {
          return (p[0]-c[0])*(p[0]-c[0]) + (p[1]-c[1])*(p[1]-c[1]);
        }));
      });
      var sum = dists.reduce(function(a,b){ return a+b; }, 0);
      var r = rand() * sum, cum = 0;
      for (var i = 0; i < DATA.length; i++) {
        cum += dists[i];
        if (cum >= r) { cents.push(DATA[i].slice()); break; }
      }
    }
    return cents;
  }

  function runKMeans(k) {
    var rand = seededRand(42 + k * 17);
    var centroids = initPP(k, rand);
    var history = [centroids.map(function(c){ return c.slice(); })];
    var assignments = DATA.map(function() { return 0; });
    var maxIter = 15;

    for (var iter = 0; iter < maxIter; iter++) {
      var newAss = DATA.map(function(p) {
        var bestD = Infinity, bestK = 0;
        for (var j = 0; j < k; j++) {
          var d = (p[0]-centroids[j][0])*(p[0]-centroids[j][0]) + (p[1]-centroids[j][1])*(p[1]-centroids[j][1]);
          if (d < bestD) { bestD = d; bestK = j; }
        }
        return bestK;
      });
      var newCents = [];
      for (var ki = 0; ki < k; ki++) {
        var pts = DATA.filter(function(_, i){ return newAss[i] === ki; });
        if (pts.length === 0) { newCents.push(centroids[ki].slice()); continue; }
        newCents.push([
          pts.reduce(function(s,p){ return s+p[0]; }, 0) / pts.length,
          pts.reduce(function(s,p){ return s+p[1]; }, 0) / pts.length
        ]);
      }
      assignments = newAss;
      var converged = centroids.every(function(c,i){
        return Math.abs(c[0]-newCents[i][0]) < 0.0001 && Math.abs(c[1]-newCents[i][1]) < 0.0001;
      });
      centroids = newCents;
      history.push(centroids.map(function(c){ return c.slice(); }));
      if (converged) break;
    }

    var inertia = DATA.reduce(function(sum, p, i) {
      var c = centroids[assignments[i]];
      return sum + (p[0]-c[0])*(p[0]-c[0]) + (p[1]-c[1])*(p[1]-c[1]);
    }, 0);

    return { centroids: centroids, assignments: assignments, history: history, inertia: inertia };
  }

  var elbowData = [];
  for (var k = 1; k <= 6; k++) {
    elbowData.push({ k: k, inertia: runKMeans(k).inertia });
  }

  function run(input) {
    var k = input.k || 3;
    var result = runKMeans(k);
    var step = Math.min(input.step || 0, result.history.length - 1);

    var stepCentroids = result.history[step];
    var stepAssignments = DATA.map(function(p) {
      var bestD = Infinity, bestK = 0;
      for (var j = 0; j < k; j++) {
        var d = (p[0]-stepCentroids[j][0])*(p[0]-stepCentroids[j][0]) + (p[1]-stepCentroids[j][1])*(p[1]-stepCentroids[j][1]);
        if (d < bestD) { bestD = d; bestK = j; }
      }
      return bestK;
    });

    return {
      k: k,
      step: step,
      maxStep: result.history.length - 1,
      centroids: stepCentroids,
      assignments: stepAssignments,
      history: result.history,
      inertia: result.inertia,
      elbowData: elbowData,
    };
  }

  window.ML_KMEANS = { DATA: DATA, COLORS: COLORS, runKMeans: runKMeans, elbowData: elbowData, run: run };
})();
