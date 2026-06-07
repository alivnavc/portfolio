(function() {
  // Two interleaved arcs + 4 noise points
  // Arc 1: upper arc, 12 points
  // Arc 2: lower arc, 12 points
  // Noise: 4 outlier points scattered far away
  var DATA = [
    // Arc 1 (upper) - semicircle above center
    [3.0, 5.5],[3.5, 6.2],[4.2, 6.8],[5.0, 7.1],[5.8, 6.8],[6.5, 6.2],
    [7.0, 5.5],[3.2, 5.0],[4.0, 6.0],[5.0, 6.5],[6.0, 6.0],[6.8, 5.0],
    // Arc 2 (lower) - semicircle below center
    [3.0, 4.5],[3.5, 3.8],[4.2, 3.2],[5.0, 2.9],[5.8, 3.2],[6.5, 3.8],
    [7.0, 4.5],[3.2, 5.0],[4.0, 4.0],[5.0, 3.5],[6.0, 4.0],[6.8, 5.0],
    // Noise points — isolated, far from any cluster
    [1.0, 1.0],[9.0, 2.0],[1.5, 9.0],[8.5, 8.5],
  ];

  function dbscan(eps, minSamples) {
    var n = DATA.length;
    var labels = new Array(n).fill(-2); // -2 = unvisited, -1 = noise, >=0 = cluster id
    var clusterId = 0;

    function dist(i, j) {
      var dx = DATA[i][0] - DATA[j][0];
      var dy = DATA[i][1] - DATA[j][1];
      return Math.sqrt(dx * dx + dy * dy);
    }

    function getNeighbors(i) {
      var neighbors = [];
      for (var j = 0; j < n; j++) {
        if (dist(i, j) <= eps) neighbors.push(j);
      }
      return neighbors;
    }

    for (var i = 0; i < n; i++) {
      if (labels[i] !== -2) continue; // already visited
      var neighbors = getNeighbors(i);
      if (neighbors.length < minSamples) {
        labels[i] = -1; // noise (tentative - may be border later)
        continue;
      }
      // core point - start new cluster
      labels[i] = clusterId;
      var seeds = neighbors.filter(function(j) { return j !== i; });
      var si = 0;
      while (si < seeds.length) {
        var q = seeds[si++];
        if (labels[q] === -1) labels[q] = clusterId; // border point
        if (labels[q] !== -2) continue;
        labels[q] = clusterId;
        var qNeighbors = getNeighbors(q);
        if (qNeighbors.length >= minSamples) {
          qNeighbors.forEach(function(r) {
            if (seeds.indexOf(r) === -1) seeds.push(r);
          });
        }
      }
      clusterId++;
    }

    // Classify each point
    var pointTypes = labels.map(function(label, i) {
      if (label === -1) return "noise";
      var neighbors = getNeighbors(i);
      if (neighbors.length >= minSamples) return "core";
      return "border";
    });

    return {
      labels: labels,
      pointTypes: pointTypes,
      nClusters: clusterId,
      nNoise: labels.filter(function(l) { return l === -1; }).length,
      nCore: pointTypes.filter(function(t) { return t === "core"; }).length,
      nBorder: pointTypes.filter(function(t) { return t === "border"; }).length,
    };
  }

  function run(input) {
    var eps = input.eps || 1.0;
    var minSamples = input.minSamples || 3;
    var result = dbscan(eps, minSamples);
    return {
      eps: eps,
      minSamples: minSamples,
      labels: result.labels,
      pointTypes: result.pointTypes,
      nClusters: result.nClusters,
      nNoise: result.nNoise,
      nCore: result.nCore,
      nBorder: result.nBorder,
      highlightPoint: input.highlightPoint || 0,
    };
  }

  window.ML_DBSCAN = { DATA: DATA, dbscan: dbscan, run: run };
})();
