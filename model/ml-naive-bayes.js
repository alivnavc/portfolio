(function () {
  const NB = {
    labels: ["ham", "spam"],
    features: ["has_link", "has_money", "is_short", "known_sender"],
    // Training data: 10 emails [has_link, has_money, is_short, known_sender, label]
    data: [
      [0, 0, 0, 1, 0], // ham - no link, no money, long, known
      [0, 0, 0, 1, 0], // ham
      [1, 0, 0, 1, 0], // ham - has link but known sender
      [0, 0, 1, 1, 0], // ham - short but known
      [0, 1, 0, 1, 0], // ham - money but known sender
      [1, 1, 1, 0, 1], // spam - link, money, short, unknown
      [1, 1, 0, 0, 1], // spam
      [1, 0, 1, 0, 1], // spam - link, short, unknown
      [0, 1, 1, 0, 1], // spam - money, short, unknown
      [1, 1, 1, 0, 1], // spam
    ],
    // Pre-computed with Laplace smoothing (alpha=1):
    // P(ham) = 5/10 = 0.5, P(spam) = 5/10 = 0.5
    default: { has_link: 1, has_money: 0, is_short: 1, known_sender: 0 },
  };

  function computeLikelihoods(data, labels) {
    const n = data.length;
    const nFeatures = data[0].length - 1;
    const classCounts = labels.map(() => 0);
    data.forEach(row => classCounts[row[row.length - 1]]++);
    const priors = classCounts.map(c => c / n);

    // P(feature_j = 1 | class_c) with Laplace smoothing
    const likelihoods = labels.map((_, c) => {
      const classData = data.filter(row => row[row.length - 1] === c);
      return Array.from({ length: nFeatures }, (_, j) => {
        const positives = classData.filter(row => row[j] === 1).length;
        return (positives + 1) / (classData.length + 2); // Laplace
      });
    });

    // Also compute raw counts for display
    const likelihoodCounts = labels.map((_, c) => {
      const classData = data.filter(row => row[row.length - 1] === c);
      return Array.from({ length: nFeatures }, (_, j) => {
        return classData.filter(row => row[j] === 1).length;
      });
    });

    return { priors, likelihoods, classCounts, likelihoodCounts };
  }

  function predict(priors, likelihoods, x) {
    const logPosts = priors.map((prior, c) => {
      const logLikTerms = x.map((xi, j) => {
        const p = likelihoods[c][j];
        return xi === 1 ? Math.log(p) : Math.log(1 - p);
      });
      const logLik = logLikTerms.reduce((s, v) => s + v, 0);
      return Math.log(prior) + logLik;
    });

    // Per-class per-feature log-likelihood terms (for display)
    const logLikTerms = priors.map((_, c) =>
      x.map((xi, j) => {
        const p = likelihoods[c][j];
        return xi === 1 ? Math.log(p) : Math.log(1 - p);
      })
    );

    // Normalize to probabilities via log-sum-exp
    const maxLog = Math.max(...logPosts);
    const exp = logPosts.map(l => Math.exp(l - maxLog));
    const sum = exp.reduce((a, b) => a + b, 0);
    const posteriors = exp.map(e => e / sum);
    const label = posteriors.indexOf(Math.max(...posteriors));
    return { logPosts, posteriors, label, logLikTerms };
  }

  function runNB(input) {
    const x = NB.features.map(f => input[f]);
    const { priors, likelihoods, classCounts, likelihoodCounts } = computeLikelihoods(NB.data, NB.labels);
    const result = predict(priors, likelihoods, x);
    return { x, input, priors, likelihoods, classCounts, likelihoodCounts, ...result, cfg: NB };
  }

  window.ML_NB = { NB, runNB };
})();
