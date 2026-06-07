(function() {
  var DATA = [
    [1.0, 1.0],  // 0: Alice
    [1.5, 1.3],  // 1: Bob
    [1.2, 0.8],  // 2: Carol
    [5.0, 5.0],  // 3: Dave
    [5.5, 4.8],  // 4: Eve
    [4.8, 5.3],  // 5: Frank
    [2.5, 8.0],  // 6: Grace
    [2.8, 8.5],  // 7: Heidi
  ];
  var LABELS = ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace", "Heidi"];

  function euclidean(a, b) {
    return Math.sqrt((a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]));
  }

  function singleLinkage(clusterA, clusterB) {
    var min = Infinity;
    clusterA.forEach(function(i) {
      clusterB.forEach(function(j) {
        var d = euclidean(DATA[i], DATA[j]);
        if (d < min) min = d;
      });
    });
    return min;
  }

  function completeLinkage(clusterA, clusterB) {
    var max = 0;
    clusterA.forEach(function(i) {
      clusterB.forEach(function(j) {
        var d = euclidean(DATA[i], DATA[j]);
        if (d > max) max = d;
      });
    });
    return max;
  }

  function averageLinkage(clusterA, clusterB) {
    var sum = 0, count = 0;
    clusterA.forEach(function(i) {
      clusterB.forEach(function(j) {
        sum += euclidean(DATA[i], DATA[j]);
        count++;
      });
    });
    return sum / count;
  }

  function wardLinkage(clusterA, clusterB) {
    var merged = clusterA.concat(clusterB);
    var cx = merged.reduce(function(s,i){ return s+DATA[i][0]; },0)/merged.length;
    var cy = merged.reduce(function(s,i){ return s+DATA[i][1]; },0)/merged.length;
    var varMerged = merged.reduce(function(s,i){ return s+(DATA[i][0]-cx)*(DATA[i][0]-cx)+(DATA[i][1]-cy)*(DATA[i][1]-cy); },0);

    var cax = clusterA.reduce(function(s,i){ return s+DATA[i][0]; },0)/clusterA.length;
    var cay = clusterA.reduce(function(s,i){ return s+DATA[i][1]; },0)/clusterA.length;
    var varA = clusterA.reduce(function(s,i){ return s+(DATA[i][0]-cax)*(DATA[i][0]-cax)+(DATA[i][1]-cay)*(DATA[i][1]-cay); },0);

    var cbx = clusterB.reduce(function(s,i){ return s+DATA[i][0]; },0)/clusterB.length;
    var cby = clusterB.reduce(function(s,i){ return s+DATA[i][1]; },0)/clusterB.length;
    var varB = clusterB.reduce(function(s,i){ return s+(DATA[i][0]-cbx)*(DATA[i][0]-cbx)+(DATA[i][1]-cby)*(DATA[i][1]-cby); },0);

    return varMerged - varA - varB;
  }

  function agglomerate(linkage) {
    var clusters = DATA.map(function(_, i){ return [i]; });
    var merges = [];

    var getLinkage = linkage === "single" ? singleLinkage
      : linkage === "complete" ? completeLinkage
      : linkage === "average" ? averageLinkage
      : wardLinkage;

    while (clusters.length > 1) {
      var minDist = Infinity, bestI = 0, bestJ = 1;
      for (var i = 0; i < clusters.length; i++) {
        for (var j = i+1; j < clusters.length; j++) {
          var d = getLinkage(clusters[i], clusters[j]);
          if (d < minDist) { minDist = d; bestI = i; bestJ = j; }
        }
      }
      var merged = clusters[bestI].concat(clusters[bestJ]);
      merges.push({
        a: clusters[bestI].slice(),
        b: clusters[bestJ].slice(),
        merged: merged.slice(),
        distance: minDist,
      });
      clusters.splice(bestJ, 1);
      clusters.splice(bestI, 1);
      clusters.push(merged);
    }
    return merges;
  }

  function run(input) {
    var linkage = input.linkage || "ward";
    var nClusters = input.nClusters || 3;
    var merges = agglomerate(linkage);

    var n = DATA.length;
    var stopAfter = n - nClusters;

    var clusters = DATA.map(function(_, i){ return [i]; });
    var getLinkage = linkage === "single" ? singleLinkage
      : linkage === "complete" ? completeLinkage
      : linkage === "average" ? averageLinkage
      : wardLinkage;

    for (var step = 0; step < stopAfter; step++) {
      var minD = Infinity, bi = 0, bj = 1;
      for (var i = 0; i < clusters.length; i++) {
        for (var j = i+1; j < clusters.length; j++) {
          var d = getLinkage(clusters[i], clusters[j]);
          if (d < minD) { minD = d; bi = i; bj = j; }
        }
      }
      var mg = clusters[bi].concat(clusters[bj]);
      clusters.splice(bj, 1);
      clusters.splice(bi, 1);
      clusters.push(mg);
    }

    var labels = new Array(n).fill(0);
    clusters.forEach(function(cl, ci) {
      cl.forEach(function(idx) { labels[idx] = ci; });
    });

    return {
      linkage: linkage,
      nClusters: nClusters,
      merges: merges,
      labels: labels,
      clusters: clusters,
    };
  }

  window.ML_HIER = { DATA: DATA, LABELS: LABELS, agglomerate: agglomerate, run: run };
})();
