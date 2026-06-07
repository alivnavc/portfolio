(function () {
  const { useState, useMemo } = React;

  // ─── ALGORITHM DATA ───────────────────────────────────────────────────────

  const ALGOS = [
    {
      name: "Linear Regression",
      category: "Regression",
      formula: "ŷ = β₀ + β₁x₁ + … + βₙxₙ\nLoss = Σ(yᵢ − ŷᵢ)²   |   β = (XᵀX)⁻¹Xᵀy",
      definition: "Fits a hyperplane y = β₀ + β₁x₁ + … + βₙxₙ by minimizing the sum of squared residuals (OLS). Parameters estimated by normal equation (β = (XᵀX)⁻¹Xᵀy) or gradient descent.",
      whenToUse: [
        "Relationship between features and target is approximately linear",
        "You need interpretable coefficients (stakeholder communication)",
        "Baseline model — always build this first before trying complex models",
        "Low-dimensional data (p ≪ n)",
        "Prediction intervals needed (parametric uncertainty estimates)"
      ],
      whenNotToUse: [
        "Non-linear relationships (use polynomial features or tree models)",
        "Many irrelevant features (use Ridge/Lasso for regularization)",
        "Highly correlated features (multicollinearity inflates coefficient variance)",
        "Target is binary/count (use logistic regression or Poisson)"
      ],
      hyperparams: [
        { name: "fit_intercept", what: "Whether to fit β₀ (the intercept)", range: "True / False", tune: "Almost always True; set False only if data is pre-centered" },
        { name: "alpha (λ) — Ridge (L2)", what: "Regularization strength; shrinks all coefficients toward zero", range: "0.001 – 100", tune: "Grid search with CV; larger λ → smaller coefficients" },
        { name: "alpha (λ) — Lasso (L1)", what: "Drives some coefficients to exactly 0 (built-in feature selection)", range: "0.001 – 100", tune: "Use when sparse signal expected; CV to find best λ" },
        { name: "alpha + l1_ratio — ElasticNet", what: "l1_ratio=0 is Ridge, l1_ratio=1 is Lasso, 0.5 is a mix", range: "alpha: 0.001–100; l1_ratio: 0–1", tune: "Use with correlated features + sparse signal; tune both with CV" }
      ],
      assumptions: [
        { assumption: "Linearity: E[y|X] = Xβ", violationEffect: "Residuals show a curve pattern. Fix: polynomial features or non-linear model." },
        { assumption: "Independence: observations are i.i.d.", violationEffect: "Time-series data causes autocorrelated residuals. Fix: time-series model (ARIMA)." },
        { assumption: "Homoscedasticity: Var(ε) is constant across X", violationEffect: "Residuals fan out (heteroscedasticity). Fix: log-transform target or weighted regression." },
        { assumption: "Normality of residuals: ε ~ N(0, σ²)", violationEffect: "Only needed for inference (p-values), not prediction. Violated → invalid p-values, predictions still fine." },
        { assumption: "No multicollinearity: features not perfectly correlated", violationEffect: "Coefficients become unstable and can flip signs. Fix: VIF check, Ridge, PCA." }
      ],
      outlierImpact: "HIGH. OLS minimizes squared errors — outliers have quadratic influence. A single extreme outlier can completely change the slope. Diagnose with Cook’s Distance. Fix: Huber regression (robust), or remove verified data errors.",
      missingImpact: "Cannot handle missing values natively. Options: mean/median imputation (biases standard errors), KNN imputation, or use sklearn Pipeline with SimpleImputer. Multiple imputation (MICE) preferred for inference.",
      interview: [
        {
          q: "What is the difference between R² and adjusted R²? When would R² be misleading?",
          a: "R² always increases when you add a feature, even a random one — it can never decrease. Adjusted R² penalizes for the number of parameters: R²_adj = 1 - (1-R²)(n-1)/(n-p-1). Use adjusted R² when comparing models with different numbers of features. R² is misleading when you have many features on a small dataset.",
          tricky: false
        },
        {
          q: "Why can OLS fail when p > n (more features than samples)?",
          a: "XᵀX is not invertible (rank deficient), so the normal equation has no unique solution. You can fit the training data perfectly (R²=1) but the model generalizes terribly. Fix: Ridge regression adds λI to make the matrix invertible, always yielding a unique solution.",
          tricky: false
        },
        {
          q: "Explain multicollinearity. How do you detect and fix it?",
          a: "When two features are highly correlated, the model can’t distinguish their individual effects — coefficients become unstable (high variance) and can flip signs. Detect with VIF > 10 or correlation matrix. Fix: remove one of the correlated pair, use PCA, or use Ridge regression (which handles multicollinearity by shrinking correlated coefficients together).",
          tricky: false
        },
        {
          q: "TRICKY: If training MSE is 5 and test MSE is 4, what does this tell you?",
          a: "This is unusual — test error should normally be higher than training error. Possible explanations: (1) test set happens to be easier (lucky split), (2) training data has more noise/outliers than test set, (3) there is data leakage (test set was somehow in training). Investigate immediately — especially check for leakage.",
          tricky: true
        },
        {
          q: "What does the coefficient of a standardized feature represent?",
          a: "The number of standard deviations the target changes per one standard deviation increase in that feature. This makes coefficients comparable across features with different scales — useful for feature importance ranking.",
          tricky: false
        }
      ]
    },

    {
      name: "Logistic Regression",
      category: "Classification",
      formula: "log(p / 1−p) = Xβ   →   σ(z) = 1 / (1 + e⁻ᶻ)\nLoss = −Σ [ yᵢ log(p̂ᵢ) + (1−yᵢ) log(1−p̂ᵢ) ]",
      definition: "Models the log-odds of the positive class as a linear function: log(p/(1-p)) = Xβ. Applies sigmoid σ(z) = 1/(1+e⁻ᶻ) to map to probabilities. Trained by minimizing binary cross-entropy via gradient descent.",
      whenToUse: [
        "Binary classification baseline — always try before complex models",
        "You need calibrated probability outputs (e.g., fraud risk score)",
        "Dataset is linearly separable or near-separable in feature space",
        "Interpretability is required — each coefficient is an odds multiplier",
        "Large datasets — converges fast, scales with SGD"
      ],
      whenNotToUse: [
        "Non-linear decision boundary (use SVM with kernel, tree-based, or NN)",
        "Multiclass with > 5 classes (consider softmax regression or tree methods)",
        "Features are highly correlated (use Ridge/L2 regularization)",
        "Target classes are not mutually exclusive"
      ],
      hyperparams: [
        { name: "C", what: "Inverse of regularization strength; larger C → less regularization", range: "0.001 – 100", tune: "CV grid search; default 1.0; smaller C = stronger regularization" },
        { name: "penalty", what: "Regularization type: l1 (sparse/feature selection), l2 (default), elasticnet, none", range: "'l1','l2','elasticnet','none'", tune: "l2 default; l1 if feature selection desired; elasticnet for mixed" },
        { name: "solver", what: "Optimization algorithm", range: "'lbfgs','liblinear','saga','sag','newton-cg'", tune: "lbfgs (default, L2 only); liblinear (small datasets, L1); saga (large datasets, all penalties)" },
        { name: "max_iter", what: "Maximum number of iterations for convergence", range: "100 – 10000", tune: "Increase if ConvergenceWarning appears; default 100" },
        { name: "class_weight", what: "Adjust weights for imbalanced classes; 'balanced' sets wᵢ = n/(k·nᵢ)", range: "None / 'balanced' / dict", tune: "Use 'balanced' when positive class is rare" }
      ],
      assumptions: [
        { assumption: "Linear decision boundary: log-odds is linear in features", violationEffect: "Misclassification in non-linear regions. Fix: polynomial/interaction features or non-linear model." },
        { assumption: "Independence of observations", violationEffect: "Violated by time series — standard errors invalid. Fix: time-series specific models." },
        { assumption: "No severe multicollinearity", violationEffect: "Same instability as linear regression. Fix: regularization (L2/L1)." },
        { assumption: "No complete separation: no feature perfectly separates classes", violationEffect: "MLE doesn’t converge (coefficients → ∞). Fix: L2 regularization always constrains this." }
      ],
      outlierImpact: "MODERATE. Cross-entropy loss is log-based (not squared), so outliers are less catastrophic than in linear regression. However, extreme feature values can push the sigmoid to near-0 or near-1, potentially dominating gradients. Feature scaling helps.",
      missingImpact: "Same as linear regression — no native handling. Impute before training. class_weight='balanced' does NOT address missing data.",
      interview: [
        {
          q: "What happens if classes are perfectly separable in logistic regression?",
          a: "The maximum likelihood estimate doesn’t exist — the coefficients diverge to infinity. The model tries to make the decision boundary infinitely steep. sklearn will converge slowly and print a ConvergenceWarning. Fix: add L2 regularization (C < infinity), which constrains coefficient magnitude and always yields a finite solution.",
          tricky: false
        },
        {
          q: "Why do we use log-loss instead of accuracy as the training objective?",
          a: "Accuracy is not differentiable — it is a step function, so gradient descent cannot optimize it. Log-loss (binary cross-entropy) is smooth, differentiable, convex in the parameters, and penalizes confident wrong predictions much more heavily than uncertain ones. It is also the correct probabilistic objective when modeling P(y=1|x).",
          tricky: false
        },
        {
          q: "TRICKY: Your logistic regression achieves 95% accuracy but AUC-ROC is 0.51. What happened?",
          a: "The dataset is severely imbalanced (e.g., 95% negative class). The model predicts 'negative' for everything — 95% accuracy but no discriminative power at all. AUC-ROC of 0.51 is essentially random. Fix: use class_weight='balanced', change threshold, use precision-recall AUC, or resample.",
          tricky: true
        },
        {
          q: "What does the coefficient for a binary feature represent in logistic regression?",
          a: "The log odds ratio — e^β is the odds multiplier for that feature. E.g., if β=0.7, having that feature multiplies the odds of the positive class by e^0.7 ≈ 2.01. So that feature roughly doubles the odds.",
          tricky: false
        },
        {
          q: "Can logistic regression output probabilities that are not calibrated? How do you fix it?",
          a: "Yes — especially with regularization or imbalanced classes, the raw sigmoid outputs can be overconfident or underconfident. Calibrate using Platt scaling (fit a logistic regression on the raw outputs on a holdout set) or isotonic regression. sklearn’s CalibratedClassifierCV implements both.",
          tricky: false
        }
      ]
    },

    {
      name: "Decision Tree",
      category: "Both",
      formula: "Gini = 1 − Σ pᵢ²   |   Entropy = −Σ pᵢ log₂(pᵢ)\nVariance Reduction = Var(parent) − Σ wᵢ · Var(childᵢ)",
      definition: "Recursively partitions the feature space using axis-aligned splits. At each node, chooses the split that maximizes information gain (classification: Gini impurity or entropy; regression: variance reduction). Predictions are the majority class or mean value at each leaf.",
      whenToUse: [
        "Interpretability is essential — trees produce human-readable rules",
        "Mixed data types (numeric + categorical) without heavy preprocessing",
        "Non-linear relationships and feature interactions are present",
        "Fast inference required (single tree is O(log n) per prediction)",
        "Feature selection proxy — feature importance from split frequency"
      ],
      whenNotToUse: [
        "High accuracy is the primary goal (single trees overfit — use ensemble)",
        "Extrapolation needed (trees cannot predict beyond training value range)",
        "Smooth decision boundaries required (trees make staircase-shaped boundaries)",
        "Small datasets (trees overfit aggressively without depth limits)"
      ],
      hyperparams: [
        { name: "max_depth", what: "Maximum tree depth; primary overfitting control", range: "2 – 20 (None = unlimited)", tune: "Tune first; None grows until pure leaves; start with 3–8" },
        { name: "min_samples_split", what: "Minimum samples required to split a node", range: "2 – 100", tune: "Larger → more regularization; default 2" },
        { name: "min_samples_leaf", what: "Minimum samples per leaf", range: "1 – 50", tune: "Larger → smoother predictions, less overfit" },
        { name: "max_features", what: "Features considered per split", range: "'sqrt','log2',None,float", tune: "'sqrt' for classification, 'log2' or None for regression" },
        { name: "criterion", what: "Split quality metric", range: "'gini','entropy' (clf); 'squared_error','absolute_error' (reg)", tune: "gini slightly faster; entropy more discriminating for rare classes" },
        { name: "ccp_alpha", what: "Cost-complexity pruning parameter", range: "0.0 – 0.1", tune: "0 means no pruning; tune with learning curve on validation set" }
      ],
      assumptions: [
        { assumption: "No distributional assumptions (non-parametric)", violationEffect: "N/A — trees make no distributional assumptions." },
        { assumption: "Feature monotonicity not assumed", violationEffect: "Handles non-monotone relationships natively." },
        { assumption: "Decision boundary approximable by axis-aligned rectangles", violationEffect: "Fails for strongly diagonal patterns (e.g., XOR) — requires many splits." }
      ],
      outlierImpact: "LOW-MODERATE. For classification: outliers in features have little effect (splits are order-based, not magnitude-based). For regression: outliers in the TARGET affect leaf means — a single extreme value can bias entire leaf predictions. Use min_samples_leaf to ensure outliers are averaged with normal points.",
      missingImpact: "sklearn Decision Tree cannot handle NaN natively — will error. Use SimpleImputer or switch to XGBoost/LightGBM which handle missing values natively. Surrogate splits (used by commercial implementations) can handle missingness in theory.",
      interview: [
        {
          q: "What is Gini impurity and how does it differ from entropy?",
          a: "Gini = 1 - Σpᵢ² measures the probability of misclassifying a random sample. Entropy = -Σpᵢ log₂(pᵢ) measures information content. Both measure impurity. Gini is slightly faster to compute (no log). Entropy is more discriminating for rare classes. In practice, they give nearly identical trees — the choice rarely matters.",
          tricky: false
        },
        {
          q: "Why do decision trees overfit easily?",
          a: "With no depth limit, a tree grows until every leaf has one sample — zero training error but perfect memorization. Each split is greedy (locally optimal) and cannot be undone. The tree has no capacity limit relative to data size. Fix: max_depth, min_samples_leaf, or post-pruning with ccp_alpha.",
          tricky: false
        },
        {
          q: "TRICKY: A decision tree with max_depth=1 has higher test accuracy than one with max_depth=10. Why?",
          a: "The depth-10 tree has overfit the training data — high variance. The depth-1 tree (a 'stump') has higher bias but lower variance, and the variance reduction dominates on this dataset. This happens when the dataset is small, noisy, or the true relationship is simple.",
          tricky: true
        },
        {
          q: "Can a decision tree extrapolate beyond the training data range?",
          a: "No. A regression tree predicts the mean of leaf samples. If the test input is outside the training range, it falls into the edge leaf and predicts that leaf’s mean — a flat extrapolation. This is why trees (and Random Forests) fail for time-series forecasting where future values exceed historical range.",
          tricky: false
        },
        {
          q: "What is cost-complexity pruning (ccp_alpha)?",
          a: "It removes branches where the accuracy gain is less than ccp_alpha × (number of leaves pruned). It is a post-pruning approach that trades in-sample accuracy for better generalization. Find the optimal alpha by fitting trees at various alpha values and selecting the one with best cross-validation score.",
          tricky: false
        }
      ]
    },

    {
      name: "Random Forest",
      category: "Both",
      formula: "ŷ = majority vote / mean of T trees\nVar(avg) = ρσ²  +  (1−ρ)σ² / T     (ρ = tree correlation)",
      definition: "An ensemble of decision trees, each trained on a bootstrap sample of the data with a random subset of features considered at each split. Final prediction: majority vote (classification) or mean (regression). Reduces variance vs. a single tree through decorrelation.",
      whenToUse: [
        "Strong general-purpose baseline for tabular data",
        "Feature importance needed (RF gives reliable importance scores)",
        "Dataset has many features — handles high-dimensional data well",
        "Robustness to outliers and missing values important",
        "OOB (out-of-bag) error gives free cross-validation estimate"
      ],
      whenNotToUse: [
        "Interpretability required — ensemble of 500 trees is a black box",
        "Very high-dimensional sparse data (text) — SVM or linear models better",
        "Memory/latency constrained (500 deep trees are large)",
        "You want to extrapolate (same limitation as single trees)",
        "Sequential/temporal patterns (trees have no memory of order)"
      ],
      hyperparams: [
        { name: "n_estimators", what: "Number of trees in the forest", range: "100 – 1000", tune: "More is always better up to diminishing returns; use 300 as default" },
        { name: "max_depth", what: "Depth per tree", range: "5 – 30 (None = fully grown)", tune: "None for maximum accuracy; limit for speed/memory" },
        { name: "max_features", what: "Features sampled per split; key decorrelation parameter", range: "'sqrt','log2',float", tune: "'sqrt' for classification (standard); 1.0 means all features = just bagging" },
        { name: "min_samples_leaf", what: "Minimum samples per leaf", range: "1 – 20", tune: "Increase to reduce overfitting on small datasets" },
        { name: "bootstrap", what: "Whether to bootstrap samples", range: "True / False", tune: "True (default); False = use full dataset per tree (rarely better)" },
        { name: "oob_score", what: "Enable out-of-bag validation estimate", range: "True / False", tune: "True gives free validation score without a separate val split" }
      ],
      assumptions: [
        { assumption: "No strong distributional assumptions (non-parametric)", violationEffect: "N/A — same as decision trees." },
        { assumption: "Trees must be sufficiently de-correlated", violationEffect: "If max_features = p, all trees see same features → high correlation → variance reduction is minimal (pure bagging)." },
        { assumption: "Bootstrap samples are representative", violationEffect: "With very small n, bootstrap samples may miss important regions of the data." }
      ],
      outlierImpact: "LOW. Individual outliers affect at most one tree (bootstrap sampling), and that tree’s vote is diluted by hundreds of others. This is one of RF’s major practical advantages over linear models and single trees.",
      missingImpact: "sklearn RF cannot handle NaN — will error. Impute first. Alternatively, use the MissForest algorithm: fit RF on observed data, predict missing values, iterate until convergence.",
      interview: [
        {
          q: "Why does Random Forest reduce variance compared to a single tree?",
          a: "Variance of the average of n correlated random variables: Var(avg) = ρσ² + (1-ρ)σ²/n, where ρ is the pairwise correlation. A single tree has Var = σ². Random feature subsampling reduces ρ (decorrelates trees). As ρ → 0, Var(avg) → σ²/n — you get a factor-n variance reduction.",
          tricky: false
        },
        {
          q: "What is OOB error and why is it equivalent to cross-validation?",
          a: "Each tree is trained on ~63.2% of the data (bootstrapped). The remaining ~36.8% are 'out-of-bag' — not seen during training. These OOB samples are used to evaluate the tree. Averaging OOB predictions across all trees gives an unbiased estimate of test error, equivalent to ~n-fold CV but computed for free during training.",
          tricky: false
        },
        {
          q: "TRICKY: You increase n_estimators from 100 to 1000 and test accuracy stays the same. Why?",
          a: "Adding more trees reduces variance (good), but if variance isn’t the bottleneck, test accuracy won’t improve. The model likely has high bias (underfitting) or has already converged — the trees are already uncorrelated enough. Also possible: test set is fundamentally different from training set (covariate shift).",
          tricky: true
        },
        {
          q: "How does RF compute feature importance? What are its limitations?",
          a: "Mean Decrease in Impurity (MDI): average reduction in Gini/variance across all splits on that feature, weighted by sample count. Limitation: biased toward high-cardinality features (more possible split points) and continuous features. Better alternative: permutation importance (shuffle feature, measure accuracy drop) — unbiased but slower.",
          tricky: false
        },
        {
          q: "How does Random Forest handle class imbalance?",
          a: "Standard RF is biased toward the majority class. Fixes: (1) class_weight='balanced_subsample' (applies class weights per bootstrap), (2) under-sample majority class during bootstrapping, (3) use SMOTE before training, (4) tune the probability threshold on a validation set.",
          tricky: false
        }
      ]
    },

    {
      name: "Gradient Boosting (GBM)",
      category: "Both",
      formula: "F(x) = F₀ + η·h₁(x) + η·h₂(x) + …\nrᵢ = −∂L(yᵢ, F(xᵢ)) / ∂F(xᵢ)   (pseudo-residual)",
      definition: "Builds an additive ensemble sequentially: each new tree fits the negative gradient of the loss with respect to current predictions (pseudo-residuals). Final model: F(x) = F₀ + η·h₁(x) + η·h₂(x) + … where η is the learning rate and hᵢ are shallow trees. Gradient descent in function space.",
      whenToUse: [
        "Best single algorithm for structured/tabular data (often beats RF)",
        "Regression or classification where maximum accuracy matters",
        "Moderate-sized datasets (up to ~1M rows efficiently)",
        "Feature interactions are important (boosting captures them well)"
      ],
      whenNotToUse: [
        "Real-time inference required (sequential ensemble is slower than RF)",
        "Noisy data with many outliers (boosting fits residuals aggressively — amplifies noise)",
        "Very small datasets (< 500 samples) — easily overfits",
        "Interpretability required without additional tools"
      ],
      hyperparams: [
        { name: "n_estimators", what: "Number of boosting rounds (trees)", range: "100 – 3000", tune: "Use early stopping; more trees with lower learning rate = better generalization" },
        { name: "learning_rate (eta)", what: "Shrinks each tree’s contribution", range: "0.01 – 0.3", tune: "Smaller → needs more trees; standard: lower eta + more trees" },
        { name: "max_depth", what: "Depth per tree (shallower than RF)", range: "3 – 8", tune: "3–5 typical; boosting compensates with more trees" },
        { name: "subsample", what: "Fraction of samples per tree (stochastic GBM)", range: "0.5 – 1.0", tune: "< 1.0 reduces overfitting; default 1.0" },
        { name: "min_samples_leaf", what: "Minimum samples per leaf", range: "1 – 50", tune: "Larger → more regularization" },
        { name: "early_stopping", what: "Stop when validation loss stops improving", range: "rounds: 10–100", tune: "Set n_estimators high, monitor val loss, stop early" }
      ],
      assumptions: [
        { assumption: "No distributional assumptions (non-parametric)", violationEffect: "N/A" },
        { assumption: "Errors correctable by shallow trees", violationEffect: "If signal requires deep interactions, GBM needs many rounds to approximate it. Works poorly for long-range dependencies." },
        { assumption: "Training and test data are from the same distribution", violationEffect: "Covariate shift causes boosting to overfit to training distribution aggressively." }
      ],
      outlierImpact: "HIGH for MSE loss. Each boosting round fits pseudo-residuals — extreme residuals (from outliers) get amplified in subsequent rounds. The model 'chases' outliers. Fix: use Huber loss or absolute error loss (more robust). XGBoost has a built-in 'reg:pseudohubererror' objective.",
      missingImpact: "sklearn GBM cannot handle NaN. XGBoost/LightGBM CAN handle missing values natively — they learn the optimal direction to send missing values at each split. This is a major advantage of XGBoost/LightGBM over sklearn’s GradientBoostingClassifier.",
      interview: [
        {
          q: "What is the pseudo-residual in gradient boosting? Why 'pseudo'?",
          a: "The pseudo-residual is the negative gradient of the loss with respect to current predictions: rᵢ = -∂L(yᵢ, F(xᵢ))/∂F(xᵢ). For MSE loss, this equals the actual residual (yᵢ - F(xᵢ)), hence 'pseudo' — it’s residuals generalized to any differentiable loss. For log-loss, it equals (yᵢ - p̂ᵢ), the difference between true label and predicted probability.",
          tricky: false
        },
        {
          q: "Why use shallow trees (stumps) in boosting rather than deep trees?",
          a: "Boosting reduces bias by sequential correction — each tree improves the previous prediction. Deep trees would overfit the pseudo-residuals (high variance). Shallow trees are weak learners with high bias but low variance — exactly what boosting needs. Boosting corrects the bias through iteration; regularization controls variance.",
          tricky: false
        },
        {
          q: "TRICKY: GBM training loss is decreasing at round 1000, but validation loss has been increasing since round 300. What do you do?",
          a: "Classic overfitting — use early stopping with the round that gave minimum validation loss (round ~300). Retrain from scratch with n_estimators=300 (or use the best model from early stopping). Also reduce learning_rate and increase n_estimators proportionally — same final performance with better generalization.",
          tricky: true
        },
        {
          q: "What is the difference between subsample in GBM and bootstrap in RF?",
          a: "Both sample rows randomly, but: GBM’s subsample samples WITHOUT replacement (stochastic GB), each round sees a different subset. RF’s bootstrap samples WITH replacement (bagging), same size as training set but with duplicates. Both reduce variance, but through different mechanisms.",
          tricky: false
        },
        {
          q: "How does XGBoost improve over vanilla GBM?",
          a: "XGBoost uses second-order Taylor expansion of the loss (Hessian), giving more accurate gradient direction. It adds L1/L2 regularization on leaf weights and tree complexity. It handles missing values natively. It uses approximate split finding for speed. It has column subsampling (like RF). Together: faster, more regularized, and more practical than sklearn GBM.",
          tricky: false
        }
      ]
    },

    {
      name: "XGBoost",
      category: "Both",
      formula: "Gain = ½[ GL²/(HL+λ) + GR²/(HR+λ) − (GL+GR)²/(HL+HR+λ) ] − γ\nLeaf weight  w* = −ΣG / (ΣH + λ)",
      definition: "Second-order gradient boosting with regularization. Objective = Σ L(yᵢ, ŷᵢ) + Σ Ω(tree). Split gain = ½[GL²/(HL+λ) + GR²/(HR+λ) - (GL+GR)²/(HL+HR+λ)] - γ. Leaf weight w* = -ΣG/(ΣH+λ). Uses Hessian hᵢ = ∂²L/∂ŷᵢ² for second-order accuracy.",
      whenToUse: [
        "Tabular data competitions (Kaggle’s most-winning algorithm for years)",
        "When you need GBM performance with better speed and regularization",
        "Data has missing values (native handling, no imputation needed)",
        "When feature interactions and non-linearity are both present"
      ],
      whenNotToUse: [
        "Noisy data with many outliers (use Huber objective)",
        "Very small datasets (< 500 samples) — easily overfits",
        "Interpretability required without SHAP/additional tools",
        "Image/text data — use neural networks"
      ],
      hyperparams: [
        { name: "n_estimators / num_boost_round", what: "Number of trees/boosting rounds", range: "100 – 5000", tune: "Use with early_stopping_rounds; monitor validation loss" },
        { name: "learning_rate (eta)", what: "Shrinkage per step", range: "0.01 – 0.3", tune: "Default 0.3; reduce to 0.01–0.1 for better generalization" },
        { name: "max_depth", what: "Maximum tree depth", range: "3 – 10", tune: "Default 6; deeper → more interactions captured" },
        { name: "lambda (reg_lambda)", what: "L2 regularization on leaf weights", range: "0 – 100", tune: "Default 1; larger → more conservative trees" },
        { name: "alpha (reg_alpha)", what: "L1 regularization on leaf weights", range: "0 – 100", tune: "Default 0; use for feature selection effect" },
        { name: "gamma (min_split_loss)", what: "Minimum gain required to make a split", range: "0 – 10", tune: "Default 0; larger → more conservative; dynamic pruning" },
        { name: "subsample", what: "Row sampling fraction per tree", range: "0.5 – 1.0", tune: "Default 1.0; reduce to 0.7–0.9 for regularization" },
        { name: "colsample_bytree", what: "Column sampling fraction per tree", range: "0.3 – 1.0", tune: "Default 1.0; reduce to 0.5–0.8 for regularization" },
        { name: "scale_pos_weight", what: "Weight for positive class (imbalanced data)", range: "sum(neg)/sum(pos)", tune: "Set to class ratio for imbalanced binary classification" }
      ],
      assumptions: [
        { assumption: "No distributional assumptions (non-parametric)", violationEffect: "N/A" },
        { assumption: "Loss function is twice-differentiable", violationEffect: "Second-order optimization requires ∂²L/∂ŷ² to exist. MAE is not differentiable at 0." },
        { assumption: "Training and test from same distribution", violationEffect: "XGBoost aggressively fits training distribution — distribution shift causes large generalization gaps." }
      ],
      outlierImpact: "HIGH for squared error objective. MODERATE with Huber/MAE objective. Use reg:pseudohubererror for robust regression on noisy targets.",
      missingImpact: "NATIVE HANDLING. XGBoost learns which direction (left or right child) to send missing values at each split, choosing the direction that maximizes gain. No imputation needed. This is one of XGBoost’s most practical advantages over sklearn GBM.",
      interview: [
        {
          q: "What does the Hessian add that first-order GBM doesn’t have?",
          a: "The Hessian (second derivative of loss) measures the curvature of the loss around the current prediction. It acts as a confidence weight — high Hessian means the current prediction is in a steep region, requiring smaller steps. This makes XGBoost equivalent to Newton-Raphson optimization (vs. gradient descent for first-order GBM), which converges in fewer iterations.",
          tricky: false
        },
        {
          q: "What does gamma (min_split_loss) do? How is it different from max_depth?",
          a: "Gamma is a minimum gain threshold: a split is only made if Gain > gamma. It prunes splits that don’t improve the objective by enough. max_depth hard-caps depth; gamma dynamically allows deep trees where the signal exists but prunes shallow dead-end splits. Gamma is often more effective than max_depth for preventing overfitting while keeping useful splits.",
          tricky: false
        },
        {
          q: "TRICKY: XGBoost gets 0.97 AUC on validation, but 0.72 AUC on the held-out test set. What are the possible causes?",
          a: "1) Data leakage — target or future information encoded in features. 2) Overfitting to the validation set through hyperparameter tuning (implicit test set contamination). 3) Distribution shift — test set is from a different time period or population. 4) Label leakage — target-correlated features used. Debug: check feature importances for suspiciously dominant features, check temporal alignment of train/test.",
          tricky: true
        },
        {
          q: "What is scale_pos_weight and when do you use it?",
          a: "For imbalanced binary classification, scale_pos_weight = sum(negative samples) / sum(positive samples). If 99% negative and 1% positive, set to 99. This makes positive class samples 99x more important in the loss, balancing the gradient contribution. It is an alternative to resampling and works well with XGBoost’s objective.",
          tricky: false
        },
        {
          q: "How does XGBoost handle missing values vs. mean imputation?",
          a: "Mean imputation replaces missing values with a fixed number — it doesn’t distinguish between 'feature is 0' and 'feature is missing.' XGBoost learns a separate branch direction for missing values at each split, allowing it to learn 'when X is missing, go RIGHT (or LEFT)' — which can itself be predictive information. Mean imputation throws that signal away.",
          tricky: false
        }
      ]
    },

    {
      name: "SVM",
      category: "Both",
      formula: "min  ½‖w‖²   s.t.  yᵢ(wᵀxᵢ + b) ≥ 1\nKernel trick:  k(x, z) = φ(x) · φ(z)   (RBF: e^(−γ‖x−z‖²))",
      definition: "For classification: finds the hyperplane maximizing margin (distance to nearest training points). Primal: minimize ½||w||² subject to yᵢ(wᵀxᵢ+b) ≥ 1. Support vectors are the points on the margin boundary. Kernel trick: k(x,z) = φ(x)·φ(z) maps to high-dimensional space implicitly, enabling non-linear boundaries.",
      whenToUse: [
        "High-dimensional data where n_features >> n_samples (e.g., text, genomics)",
        "Kernel SVM for non-linear patterns with moderate dataset size",
        "When you need the maximum-margin guarantee",
        "Binary classification with clear margin separation"
      ],
      whenNotToUse: [
        "Large datasets (> 100K samples) — O(n²) to O(n³) training time",
        "Multi-class classification with many classes (one-vs-rest becomes slow)",
        "Noisy data with heavily overlapping classes (margin is unstable)",
        "You need calibrated probability estimates (SVMs don’t output them natively)"
      ],
      hyperparams: [
        { name: "C (regularization)", what: "Inverse of margin width; large C → hard margin, small C → soft margin", range: "0.001 – 1000", tune: "Most important parameter; default 1.0; tune with CV" },
        { name: "kernel", what: "Kernel function for implicit feature mapping", range: "'rbf','linear','poly','sigmoid'", tune: "'rbf' default (non-linear); 'linear' for high-dim text data" },
        { name: "gamma (RBF)", what: "RBF kernel width; large → narrow Gaussian, complex boundary", range: "'scale','auto',float", tune: "Default 'scale'; tune jointly with C in grid search" },
        { name: "degree (poly kernel)", what: "Degree of polynomial kernel", range: "2 – 5", tune: "Default 3; higher → more complex boundary" },
        { name: "epsilon (SVR)", what: "Tube width around predictions with no penalty", range: "0.01 – 1.0", tune: "Default 0.1; larger → fewer support vectors" }
      ],
      assumptions: [
        { assumption: "Data is linearly separable in kernel space", violationEffect: "Margin may not exist; C parameter allows soft margin violations" },
        { assumption: "Features are on comparable scales (distance-based)", violationEffect: "Large-scale features dominate distance; MUST StandardScale before SVM" },
        { assumption: "Class balance", violationEffect: "SVMs are sensitive to imbalanced classes; use class_weight='balanced'" }
      ],
      outlierImpact: "HIGH for hard-margin SVM. A single outlier can become a support vector and shift the hyperplane dramatically. Soft-margin (small C) allows some misclassifications, reducing outlier sensitivity.",
      missingImpact: "Cannot handle NaN — sklearn SVM will error. Impute before training. Feature scaling AFTER imputation is essential for SVM performance.",
      interview: [
        {
          q: "What are support vectors and why are they the only points that matter?",
          a: "Support vectors are the training points that lie on or within the margin boundary. The optimal hyperplane is defined entirely by these points — removing any non-support-vector would not change the hyperplane. This is why SVMs can generalize well in high dimensions: only a few points (support vectors) define the solution.",
          tricky: false
        },
        {
          q: "What is the kernel trick and why does it matter?",
          a: "The kernel k(x,z) = φ(x)·φ(z) computes the dot product in a high-dimensional feature space without explicitly computing φ(x). The RBF kernel implicitly works in infinite-dimensional space. This lets SVMs find non-linear boundaries without feature engineering. The trick works because the SVM dual formulation only requires dot products between data points — not explicit coordinates.",
          tricky: false
        },
        {
          q: "TRICKY: Your SVM’s training accuracy is 100% but test accuracy is 55%. What do you check first?",
          a: "First: is gamma too large? High gamma means the RBF kernel is very narrow — each training point is its own island, giving 100% training accuracy but no generalization. Check: use gamma='scale' as baseline, then tune C and gamma together with grid search. Second: is the data scaled? Without StandardScaler, SVM overfits to the high-variance feature.",
          tricky: true
        },
        {
          q: "When would you choose a linear kernel over RBF?",
          a: "Linear kernel is preferred when: (1) n_features >> n_samples (text classification — already in high-dimensional space where linear boundaries work), (2) you want interpretable coefficients (coef_ attribute), (3) speed is critical (linear SVM is much faster than kernel SVM). RBF is preferred when n_samples > n_features and non-linear patterns are suspected.",
          tricky: false
        },
        {
          q: "What is the relationship between C in SVM and alpha in Ridge regression?",
          a: "Both control regularization but inversely. Alpha in Ridge: larger → more regularization → smaller coefficients. C in SVM: larger → LESS regularization → harder margin. They are approximately inverses: C ≈ 1/alpha. Both control the bias-variance tradeoff — SVM just uses the reciprocal convention.",
          tricky: false
        }
      ]
    },

    {
      name: "KNN",
      category: "Both",
      formula: "d(x, xᵢ) = √Σ(xⱼ − xᵢⱼ)²   (Euclidean)\nŷ = majority vote  /  mean  of  k  nearest  neighbors",
      definition: "Lazy learner — no training phase. For a query point, find the k nearest training points by distance (default: Euclidean). Classification: majority vote of k neighbors. Regression: mean of k neighbors' targets. Decision boundary is non-parametric and adapts to local data density.",
      whenToUse: [
        "Small datasets where instance-based reasoning makes sense",
        "Non-linear, complex decision boundaries without a clear pattern",
        "Recommendation systems (find similar items/users)",
        "Anomaly detection (large distance to neighbors → anomaly score)",
        "When no assumptions about data distribution can be made"
      ],
      whenNotToUse: [
        "Large datasets (O(n) prediction time per query, O(nd) memory)",
        "High-dimensional data: Euclidean distance loses meaning in > 20 dims (curse of dimensionality)",
        "Noisy data: noise in training labels propagates directly to predictions",
        "Real-time prediction with large n (use approximate NN or a different model)"
      ],
      hyperparams: [
        { name: "k (n_neighbors)", what: "Number of neighbors to vote/average", range: "1 – 100 (odd for binary clf)", tune: "k=1 max variance; k=n max bias; tune with CV; odd k avoids ties" },
        { name: "weights", what: "Voting scheme for neighbors", range: "'uniform','distance'", tune: "'distance' (inverse distance weighting) usually better for noisy data" },
        { name: "metric", what: "Distance function", range: "'euclidean','manhattan','minkowski'", tune: "Manhattan (L1) more robust to outliers; euclidean default" },
        { name: "algorithm", what: "Internal data structure for neighbor lookup", range: "'ball_tree','kd_tree','brute','auto'", tune: "kd_tree/ball_tree for low-dim; brute for high-dim or small n" },
        { name: "leaf_size", what: "Leaf size for tree algorithms (speed vs. memory)", range: "10 – 100", tune: "Affects query speed; default 30; does not affect accuracy" }
      ],
      assumptions: [
        { assumption: "Similar inputs have similar outputs (smoothness)", violationEffect: "Noisy or sparse data violates this; larger k partially mitigates." },
        { assumption: "Euclidean distance is meaningful (requires feature scaling)", violationEffect: "Without scaling, features with large scales dominate distance. MUST scale." },
        { assumption: "Training set is representative (memorizes all data)", violationEffect: "Unrepresentative training set directly degrades all predictions." }
      ],
      outlierImpact: "MODERATE. With k=1, a single outlier creates isolated incorrect islands. Larger k outvotes outliers. For regression, outliers in target values pollute neighbor averages. Use k > 1 and distance weighting to mitigate.",
      missingImpact: "Cannot handle NaN in prediction features (distance is undefined). Imputation required. Ironically, KNN itself is a popular imputation strategy (KNNImputer fills missing values with the weighted mean of k nearest complete-case neighbors).",
      interview: [
        {
          q: "What is the curse of dimensionality and how does it affect KNN?",
          a: "In high dimensions, all points become approximately equidistant from the query point. Euclidean distance concentrates — the ratio of max distance to min distance approaches 1 as dimensions increase. This means 'nearest neighbor' loses meaning — the k nearest neighbors are no more similar to the query than random points. KNN degrades in > 20-30 dimensions without dimensionality reduction (PCA, etc.).",
          tricky: false
        },
        {
          q: "What is the effect of k on bias and variance?",
          a: "k=1: maximum variance, minimum bias (model is the data). k=n: maximum bias, minimum variance (predicts the global mean/majority). Optimal k is the sweet spot, found by cross-validation. Note: unlike most models, increasing the primary hyperparameter (k) increases bias and reduces variance.",
          tricky: false
        },
        {
          q: "TRICKY: KNN’s training accuracy with k=1 is always 100%. True or false? Explain.",
          a: "True for non-duplicate training data. With k=1, each training point’s nearest neighbor is itself, so it predicts its own label perfectly. This makes training accuracy a useless metric for k=1 KNN. Always evaluate KNN with cross-validation or a true holdout set.",
          tricky: true
        },
        {
          q: "Why must you scale features before KNN? Give a concrete example.",
          a: "Euclidean distance treats all dimensions equally. If feature 1 is age (range 20–80, scale ~60) and feature 2 is income (range 20,000–200,000, scale ~180,000), income completely dominates the distance calculation. Two people with identical age but different income appear close; two people with different age but identical income appear similar. StandardScaler or MinMaxScaler before KNN is mandatory.",
          tricky: false
        },
        {
          q: "How would you speed up KNN for 10M training samples?",
          a: "For low-dimensional data (< 20 features): use KD-tree or Ball-tree (O(log n) lookup). For high-dimensional data: approximate nearest neighbors (Faiss, HNSW, Annoy) — trade small accuracy loss for massive speed gain. Alternatively: quantize the training set (cluster centers instead of raw points) or switch to a fundamentally different model.",
          tricky: false
        }
      ]
    },

    {
      name: "Naive Bayes",
      category: "Classification",
      formula: "P(y | x₁…xₙ)  ∝  P(y) × ∏ᵢ P(xᵢ | y)\nGaussian: P(xᵢ|y) = (1/√2πσ²) · exp(−(xᵢ−μ)²/2σ²)",
      definition: "Applies Bayes’ theorem with the ‘naive’ assumption that features are conditionally independent given the class: P(y|x₁…xₙ) ∝ P(y) × ∏ᵢ P(xᵢ|y). Variants: GaussianNB (continuous, Gaussian likelihood), MultinomialNB (count features, text), BernoulliNB (binary features). Prediction: argmax over classes.",
      whenToUse: [
        "Text classification (spam, sentiment) — Multinomial NB is a strong baseline",
        "Very large datasets or real-time requirements (training is O(nd), prediction O(d))",
        "Small datasets where complex models overfit",
        "Multi-class classification (scales naturally to any number of classes)",
        "Quick baseline before investing in complex models"
      ],
      whenNotToUse: [
        "Features are highly correlated (independence assumption violated — probabilities wrong)",
        "Calibrated probabilities needed (NB probabilities are notoriously uncalibrated)",
        "Numeric features with non-Gaussian distributions (GaussianNB assumes Gaussian)",
        "Complex feature interactions needed"
      ],
      hyperparams: [
        { name: "var_smoothing (GaussianNB)", what: "Adds small variance to avoid zero probabilities", range: "1e-12 – 1e-1", tune: "Default 1e-9; increase if numerical issues; tune with CV" },
        { name: "alpha (MultinomialNB/BernoulliNB)", what: "Laplace/Lidstone smoothing; avoids zero probability for unseen words", range: "0.001 – 10", tune: "Default 1.0 (Laplace); smaller → sharper probabilities; tune with CV" },
        { name: "binarize (BernoulliNB)", what: "Threshold for converting continuous features to binary", range: "float", tune: "Default 0.0; set to meaningful domain threshold" }
      ],
      assumptions: [
        { assumption: "Conditional independence: features are independent given class", violationEffect: "Probabilities become unreliable (over-confident). Rank ordering often still correct, so classification accuracy can be good despite violated assumption." },
        { assumption: "Appropriate likelihood model (Gaussian/Multinomial/Bernoulli)", violationEffect: "GaussianNB on count data, or MultinomialNB on continuous data, gives poor probability estimates." },
        { assumption: "Stationarity: P(xᵢ|y) doesn’t change between train and test", violationEffect: "Distribution shift invalidates the learned likelihood tables." }
      ],
      outlierImpact: "MODERATE. GaussianNB estimates μ and σ per feature per class — a single outlier inflates σ, flattening the Gaussian and reducing its discriminative power. MultinomialNB is count-based — extreme counts dilute probability. Generally more robust than linear models.",
      missingImpact: "Cannot handle NaN natively. Must impute. Note: with Laplace smoothing (alpha > 0), zero-count features are handled — but NaN is different from zero.",
      interview: [
        {
          q: "The independence assumption of Naive Bayes is almost always wrong. Why does it still work?",
          a: "For classification, you don’t need accurate probability estimates — you need correct rank ordering. Even if P(y=1|x) is miscalibrated, the class with the highest (uncalibrated) probability is often correct. The decision boundary argmax_y P(y|x) can be correct even when the absolute probabilities are wrong. This is why NB often achieves good accuracy despite violated assumptions.",
          tricky: false
        },
        {
          q: "What is Laplace smoothing and why is it necessary?",
          a: "If a word appears in no spam emails in training, P(word|spam) = 0, which zeroes out the entire product ∏ P(xᵢ|spam) regardless of other features. Laplace smoothing adds alpha to all counts: P(word|class) = (count + alpha) / (total_count + alpha × vocab_size). With alpha=1, no probability is ever exactly 0. Critical for text with large vocabularies.",
          tricky: false
        },
        {
          q: "TRICKY: Your Naive Bayes model outputs P(spam)=0.9999999 for every email. What’s wrong?",
          a: "Probability underflow from multiplying many small numbers. With long documents, ∏ P(xᵢ|y) underflows to 0 for all classes before comparison. Fix: work in log space — log P(y|x) ∝ log P(y) + Σ log P(xᵢ|y). sklearn’s NB implementations do this automatically, but custom implementations often miss it.",
          tricky: true
        },
        {
          q: "When would you use BernoulliNB vs. MultinomialNB for text?",
          a: "BernoulliNB: presence/absence of words — binary features. Penalizes word absence (explicitly models P(word absent | class)). Better for short texts or when absence is informative. MultinomialNB: word count features (TF vectors). Doesn’t model word absence. Better for longer documents where frequency matters more than presence. In practice, MultinomialNB with TF-IDF usually wins.",
          tricky: false
        },
        {
          q: "Why are Naive Bayes probability outputs uncalibrated?",
          a: "The naive independence assumption causes probabilities to be too extreme (pushed toward 0 or 1). When you multiply many slightly-different likelihoods together, the products become very different — the winning class gets an overwhelmingly high probability. The relative ranking is usually correct, but the magnitude is wrong. Fix with Platt scaling or isotonic regression.",
          tricky: false
        }
      ]
    },

    {
      name: "ANN / MLP",
      category: "Both",
      formula: "hₗ = activation(Wₗ · hₗ₋₁ + bₗ)\nReLU(z) = max(0, z)   |   Softmax(zᵢ) = eᶻⁱ / Σ eᶻʲ",
      definition: "Multiple layers of neurons: xᵢ → linear(Wᵢ, xᵢ) → activation → … → output. Trained by backpropagation (chain rule) + gradient descent. Universal approximator: a 2-layer MLP can approximate any continuous function given sufficient width. Key activations: ReLU (hidden layers), Softmax/Sigmoid (output).",
      whenToUse: [
        "Complex non-linear patterns that simpler models cannot capture",
        "Large datasets (NNs shine with millions of samples)",
        "Transfer learning from pretrained networks",
        "Multi-output prediction (multiple outputs simultaneously)",
        "Tabular data with 50K+ samples and complex interactions"
      ],
      whenNotToUse: [
        "Small datasets (< 1000 samples) — tree methods usually win",
        "Tabular data at small-medium scale — GBM/XGBoost usually outperforms NNs",
        "Interpretability required — NNs are black boxes",
        "Computation constrained — NNs are expensive to train and serve",
        "You don’t have GPU — CPU training of large NNs is impractical"
      ],
      hyperparams: [
        { name: "hidden_layer_sizes", what: "Number and width of hidden layers", range: "(64,), (128,64), (256,128,64)", tune: "Tune depth first, then width; default (100,)" },
        { name: "activation", what: "Non-linearity applied after each layer", range: "'relu','tanh','sigmoid'", tune: "ReLU default (best general purpose); sigmoid/tanh risk vanishing gradient" },
        { name: "learning_rate_init", what: "Initial learning rate for optimizer", range: "0.0001 – 0.01", tune: "Default 0.001; use learning rate scheduler for long training" },
        { name: "alpha (L2 penalty)", what: "Weight decay (L2 regularization)", range: "0.0001 – 0.1", tune: "Primary regularization; default 0.0001; increase for overfitting" },
        { name: "batch_size", what: "Mini-batch size for gradient estimation", range: "16 – 1024", tune: "Smaller → more noise but faster convergence; 'auto' = min(200, n)" },
        { name: "dropout (Keras/PyTorch)", what: "Fraction of neurons randomly dropped per forward pass", range: "0.1 – 0.5", tune: "0.2–0.5 per hidden layer; reduces co-adaptation" }
      ],
      assumptions: [
        { assumption: "Requires feature scaling (weights initialized small)", violationEffect: "Unscaled features cause gradient instability and slow convergence." },
        { assumption: "i.i.d. data (standard gradient descent assumption)", violationEffect: "Time-series or correlated samples require sequential models (LSTM)." },
        { assumption: "Sufficient data for capacity", violationEffect: "Small datasets relative to model size cause severe overfitting." }
      ],
      outlierImpact: "MODERATE. With MSE loss, outliers have squared influence (same as linear regression). With cross-entropy, less severe. Batch normalization reduces sensitivity to outliers by normalizing activations.",
      missingImpact: "Cannot handle NaN — forward pass breaks. Impute before training. Alternatively, use a masking mechanism (embed missingness as a separate learned input indicator).",
      interview: [
        {
          q: "What is vanishing gradient and how does ReLU fix it?",
          a: "In deep networks with sigmoid/tanh activations, gradients are multiplied by the activation derivative at each layer during backprop. Sigmoid derivative ≤ 0.25 — with 10 layers, gradient shrinks by 0.25¹⁰ ≈ 0.000001. ReLU derivative = 1 for positive inputs (no shrinkage) and 0 for negative. This allows gradients to flow through many layers unchanged, enabling training of deep networks.",
          tricky: false
        },
        {
          q: "Why do we use mini-batch gradient descent instead of full batch or SGD?",
          a: "Full batch: stable gradients but slow per step and requires all data in memory. SGD (batch=1): fast per step, very noisy gradients. Mini-batch: best of both — parallelizable on GPU, lower memory than full batch, noise from small batches acts as regularization (helps escape local minima). Standard choice: batch_size = 32–256.",
          tricky: false
        },
        {
          q: "TRICKY: Training loss drops to 0.001 over 50 epochs, but validation loss plateaued at 0.03 since epoch 1. What is happening?",
          a: "The model is overfitting — it memorized training data while validation loss plateaued immediately. The plateau at epoch 1 is suspicious: (1) Add dropout (0.3–0.5). (2) Add weight decay (alpha=0.001). (3) Reduce network size. (4) Check for data leakage — validation loss being already low at epoch 1 could mean train/val overlap.",
          tricky: true
        },
        {
          q: "What is the dying ReLU problem?",
          a: "If a neuron’s input is always negative, ReLU always outputs 0, the gradient is always 0, and the weights never update — the neuron is 'dead.' Caused by large negative bias or very large learning rate. Fix: Leaky ReLU (small slope for negative inputs, never truly 0), ELU, or batch normalization to keep activations centered.",
          tricky: false
        },
        {
          q: "What is batch normalization and why does it help?",
          a: "BatchNorm normalizes layer activations to zero mean and unit variance per mini-batch, then learns scale (gamma) and shift (beta). Benefits: (1) reduces internal covariate shift, (2) allows higher learning rates, (3) acts as regularization (noise from batch statistics), (4) reduces sensitivity to weight initialization. Essential for training very deep networks.",
          tricky: false
        }
      ]
    },

    {
      name: "CNN",
      category: "Neural Networks",
      formula: "output[i,j] = Σₘₙ  kernel[m,n] × input[i+m, j+n]  +  b\nConv → ReLU → Pool → … → Flatten → Dense → Softmax",
      definition: "Applies learned filters (kernels) by convolution over local spatial regions: output[i,j] = Σ filter × input_patch[i:i+k, j:j+k]. Key operations: convolution (feature extraction), ReLU, pooling (spatial reduction), flatten → dense (classification). Parameter sharing across positions gives translation invariance.",
      whenToUse: [
        "Image classification, object detection, segmentation",
        "Any data with spatial or temporal locality structure",
        "Audio (spectrograms), time series with local patterns",
        "When translation invariance is desired (same feature anywhere in input)"
      ],
      whenNotToUse: [
        "Tabular data without spatial structure",
        "Very small datasets (< few thousand images) without transfer learning",
        "When long-range global dependencies are primary (use Transformers)",
        "When output needs to be order-sensitive in both spatial dimensions"
      ],
      hyperparams: [
        { name: "num_filters (per layer)", what: "Number of feature maps per conv layer", range: "32 – 512", tune: "Earlier layers: 32–64; deeper layers: 128–512; double at each pooling" },
        { name: "kernel_size", what: "Spatial size of the filter", range: "1×1, 3×3, 5×5", tune: "3×3 most used; smaller = more local patterns, more layers needed" },
        { name: "stride", what: "Step size of the filter during convolution", range: "1 – 4", tune: "stride=1 (full resolution); stride=2 (spatial downsampling by 2)" },
        { name: "padding", what: "Zero-padding to control output spatial size", range: "'same','valid'", tune: "'same' (output = input size); 'valid' (output shrinks by kernel_size-1)" },
        { name: "pool_size", what: "Max/average pooling window size", range: "2×2, 3×3", tune: "2×2 standard; global average pooling at final layer reduces parameters" },
        { name: "dropout rate", what: "Fraction of neurons dropped (after dense layers)", range: "0.1 – 0.5", tune: "0.3–0.5 between dense layers; SpatialDropout2D for conv layers" },
        { name: "learning_rate", what: "Optimizer step size", range: "0.0001 – 0.01", tune: "0.001 with Adam; 0.01 with SGD+momentum; use learning rate schedule" }
      ],
      assumptions: [
        { assumption: "Spatial locality: nearby pixels are related", violationEffect: "Valid for images; fails for tabular data without spatial meaning." },
        { assumption: "Translation invariance: same feature can appear anywhere", violationEffect: "Fails for data where absolute position is semantically important." },
        { assumption: "Sufficient labeled data", violationEffect: "Small datasets: use transfer learning from ImageNet. Otherwise severe overfitting." }
      ],
      outlierImpact: "LOW. Convolutional layers apply spatial averaging via pooling — local outlier pixels are diluted. Final classification uses aggregated information from many spatial locations. More robust than fully connected networks to pixel-level noise.",
      missingImpact: "Images typically don’t have 'missing values' in the tabular sense. Missing patches: mask with black (0) or random noise. Transfer learning from ImageNet helps even with partial occlusion due to robust learned features.",
      interview: [
        {
          q: "Why do CNNs use parameter sharing? What does it assume?",
          a: "Parameter sharing means the same filter weights are applied at every spatial position. This assumes translation invariance — a horizontal edge detector should work the same at the top-left and bottom-right. This reduces parameters from O(H×W×C) per position to O(k×k×C) per filter, making deep CNNs feasible. Without sharing, a 224×224 image with 64 filters would need 3.2M parameters per layer.",
          tricky: false
        },
        {
          q: "What is the difference between max pooling and average pooling?",
          a: "Max pooling: takes the maximum value in each spatial region — preserves the strongest feature activation, discards location. Average pooling: takes the mean — preserves overall intensity. Max pooling is more common in classification (sharp features matter). Global average pooling (GAP) at the final layer replaces flatten → dense, reducing parameters and overfitting.",
          tricky: false
        },
        {
          q: "TRICKY: CNN achieves 99% training accuracy but 60% test accuracy on a 500-image dataset. What do you do?",
          a: "Severe overfitting with small dataset. Actions in priority order: (1) Use transfer learning from ImageNet — a pretrained ResNet/VGG has already learned 1000+ visual concepts; fine-tune on your 500 images. (2) Add aggressive data augmentation (flip, rotate, crop, color jitter). (3) Add dropout after dense layers. (4) Reduce model size. Transfer learning alone often fixes small-dataset overfitting completely.",
          tricky: true
        },
        {
          q: "What is receptive field and why does it matter?",
          a: "The receptive field of a neuron is the region of the input that affects its output. A 3×3 conv layer has 3×3 receptive field. Two stacked 3×3 layers have 5×5 effective receptive field. Three stacked → 7×7. Deep CNNs build large receptive fields through stacking, allowing later layers to see global patterns while using small local filters — more efficient than using large filters.",
          tricky: false
        },
        {
          q: "What is the purpose of batch normalization in CNNs?",
          a: "Applied after conv and before activation: normalizes each feature map to zero mean/unit variance across the batch and spatial dimensions. Benefits: allows higher learning rates, reduces sensitivity to initialization, enables training of very deep networks (ResNet, DenseNet rely on BN), provides regularization, and stabilizes training dynamics.",
          tricky: false
        }
      ]
    },

    {
      name: "LSTM",
      category: "Neural Networks",
      formula: "Cₜ = fₜ ⊙ Cₜ₋₁  +  iₜ ⊙ C̃ₜ\nhₜ = oₜ ⊙ tanh(Cₜ)   |   fₜ = σ(Wf · [hₜ₋₁, xₜ] + bf)",
      definition: "RNN variant with a cell state Cₜ and three learned gates: forget (fₜ = σ(Wf[hₜ₋₁,xₜ]+bf)), input (iₜ, C̃ₜ), output (oₜ). Cell update: Cₜ = fₜ⊙Cₜ₋₁ + iₜ⊙C̃ₜ. Output: hₜ = oₜ⊙tanh(Cₜ). Solves vanilla RNN’s vanishing gradient via additive cell state updates (gradient highway).",
      whenToUse: [
        "Sequential data with long-range dependencies (sentiment, language modeling)",
        "Time-series forecasting when past context is important",
        "Speech recognition, music generation",
        "Any task where the order of inputs matters AND short/medium memory needed"
      ],
      whenNotToUse: [
        "Very long sequences (> 500 steps) — Transformers generally outperform",
        "Parallelism required — LSTM is inherently sequential (slow to train)",
        "Fixed-window local patterns only — 1D-CNN may be faster and as accurate",
        "Stateless classification without sequential structure"
      ],
      hyperparams: [
        { name: "units (hidden size)", what: "LSTM hidden state dimension", range: "32 – 512", tune: "Larger → more capacity; start with 128; tune based on task complexity" },
        { name: "num_layers", what: "Number of stacked LSTM layers", range: "1 – 4", tune: "1–2 usually sufficient; more layers = deeper sequence processing" },
        { name: "dropout", what: "Dropout between LSTM layers", range: "0.1 – 0.5", tune: "0.2–0.3 standard; add if validation loss plateaus" },
        { name: "recurrent_dropout", what: "Dropout applied within recurrent connections", range: "0.0 – 0.3", tune: "Use sparingly — can disrupt temporal patterns" },
        { name: "sequence_length", what: "Input window size (number of time steps)", range: "Domain-dependent", tune: "Tune as a hyperparameter; longer → more context but slower" },
        { name: "bidirectional", what: "Process sequence forward AND backward", range: "True / False", tune: "Nearly always better for classification where full sequence is available" }
      ],
      assumptions: [
        { assumption: "Sequential order of inputs is meaningful", violationEffect: "If order doesn’t matter, LSTM wastes capacity on ordering; use bag-of-words or attention." },
        { assumption: "Data follows a Markov-like structure (current depends on history)", violationEffect: "Random sequences with no temporal dependence: LSTM learns nothing useful." },
        { assumption: "Stationarity helps (but not strictly required)", violationEffect: "Non-stationary time series: include time features or use differencing as preprocessing." }
      ],
      outlierImpact: "MODERATE. Outlier time steps can corrupt the cell state. The forget gate mitigates this (can learn to 'forget' anomalous values), but sudden spikes still affect the hidden state for several time steps afterward.",
      missingImpact: "Cannot handle NaN in input sequences. Standard approaches: (1) forward-fill/backward-fill for time series, (2) mask padding tokens in variable-length sequences, (3) use masking layers in Keras to tell the model to ignore certain time steps.",
      interview: [
        {
          q: "How does the forget gate solve the vanishing gradient problem of vanilla RNNs?",
          a: "Vanilla RNN gradient flows through tanh at each timestep: ∂hₜ/∂h₀ = ∏ᵢ Wᵀ · diag(tanh'). With T=100 steps, multiplying 100 matrices with spectral radius < 1 makes the gradient vanish. LSTM’s cell state update is ADDITIVE: Cₜ = fₜ⊙Cₜ₋₁ + iₜ⊙C̃ₜ. When fₜ≈1 (forget gate open), the gradient of the loss w.r.t. Cₜ₋₁ is approximately 1 — the gradient highway.",
          tricky: false
        },
        {
          q: "What is the difference between LSTM’s hidden state hₜ and cell state Cₜ?",
          a: "Cell state Cₜ is the long-term memory — passed through time with only element-wise operations (no matrix multiplication on the highway), enabling long-range gradient flow. Hidden state hₜ = oₜ⊙tanh(Cₜ) is the short-term 'working memory' — what the LSTM exposes to the next layer. Think of Cₜ as RAM (storage) and hₜ as CPU registers (active computation).",
          tricky: false
        },
        {
          q: "TRICKY: LSTM has training loss 0.1 and validation loss 0.1 after epoch 1, both stay flat for 20 epochs. What’s wrong?",
          a: "The model is not learning at all. Possible causes: (1) Exploding or vanishing gradients — check gradient norms, add gradient clipping (clip_norm=1.0). (2) Learning rate too large or too small — try 0.001 with Adam. (3) Sequence padding issue — if padding tokens dominate, signal is diluted. (4) All labels are the same class (check distribution). (5) Wrong input shape (batch vs. time dimensions swapped).",
          tricky: true
        },
        {
          q: "When would you use a bidirectional LSTM?",
          a: "When you have access to the full sequence at prediction time (not autoregressive). For sentiment analysis, NER, question answering — you can read the entire input before predicting. Bidirectional LSTM concatenates forward and backward hidden states, giving each position context from both directions. NOT useful for autoregressive generation (language modeling, time-series forecasting) where future tokens are unavailable.",
          tricky: false
        },
        {
          q: "How is GRU different from LSTM? When would you prefer it?",
          a: "GRU has two gates (reset, update) vs. LSTM’s three, and merges cell state and hidden state into one vector. GRU has ~25% fewer parameters, trains faster, and often performs comparably to LSTM on smaller datasets. Use GRU when: training time is constrained, dataset is small-medium, or you want a simpler model. Use LSTM when: maximum accuracy on long sequences is needed.",
          tricky: false
        }
      ]
    }
  ];

  // ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────

  function getSeverityColor(text) {
    var t = text.toUpperCase();
    if (t.indexOf("HIGH") === 0) return { label: "HIGH", bg: "#fee2e2", color: "#b91c1c" };
    if (t.indexOf("MODERATE") === 0) return { label: "MODERATE", bg: "#fef9c3", color: "#854d0e" };
    if (t.indexOf("LOW") === 0) return { label: "LOW", bg: "#dcfce7", color: "#15803d" };
    if (t.indexOf("NATIVE") === 0) return { label: "NATIVE", bg: "#dbeafe", color: "#1d4ed8" };
    return { label: "—", bg: "#f3f4f6", color: "#374151" };
  }

  function getCategoryColor(cat) {
    if (cat === "Regression") return { bg: "#dbeafe", color: "#1e40af" };
    if (cat === "Classification") return { bg: "#fce7f3", color: "#9d174d" };
    if (cat === "Neural Networks") return { bg: "#ede9fe", color: "#5b21b6" };
    return { bg: "#e5e7eb", color: "#374151" };
  }

  // ─── TAB CONTENT RENDERERS ────────────────────────────────────────────────

  function OverviewTab(props) {
    var algo = props.algo;
    return (
      <div style={{ padding: "16px 18px" }}>
        {algo.formula && (
          <div style={{
            background: "rgba(43,91,255,0.07)",
            border: "1px solid rgba(43,91,255,0.22)",
            borderRadius: 9,
            padding: "10px 16px",
            marginBottom: 14,
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "#1e3a8a",
            textAlign: "center",
            lineHeight: 2,
            letterSpacing: "0.02em",
            overflowX: "auto",
            whiteSpace: "pre"
          }}>{algo.formula}</div>
        )}
        <p style={{ fontSize: 13.5, color: "var(--ink)", marginBottom: 16, lineHeight: 1.65, margin: "0 0 16px 0" }}>
          {algo.definition}
        </p>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)", marginBottom: 8 }}>When to Use</div>
          {algo.whenToUse.map(function(item, i) {
            return (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 5 }}>
                <span style={{ color: "#16a34a", fontWeight: 700, flexShrink: 0, fontSize: 13 }}>✓</span>
                <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{item}</span>
              </div>
            );
          })}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#dc2626", marginBottom: 8 }}>When NOT to Use</div>
          {algo.whenNotToUse.map(function(item, i) {
            return (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 5 }}>
                <span style={{ color: "#dc2626", fontWeight: 700, flexShrink: 0, fontSize: 13 }}>✗</span>
                <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function HyperparamsTab(props) {
    var algo = props.algo;
    return (
      <div style={{ padding: "16px 18px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12.5, width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "7px 10px", textAlign: "left", fontWeight: 700, fontSize: 11.5, color: "var(--muted)", width: "22%" }}>Parameter</th>
                <th style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "7px 10px", textAlign: "left", fontWeight: 700, fontSize: 11.5, color: "var(--muted)", width: "30%" }}>What it does</th>
                <th style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "7px 10px", textAlign: "left", fontWeight: 700, fontSize: 11.5, color: "var(--muted)", width: "18%" }}>Typical range</th>
                <th style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "7px 10px", textAlign: "left", fontWeight: 700, fontSize: 11.5, color: "var(--muted)", width: "30%" }}>How to tune</th>
              </tr>
            </thead>
            <tbody>
              {algo.hyperparams.map(function(hp, i) {
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg)" }}>
                    <td style={{ border: "1px solid var(--line)", padding: "7px 10px", fontSize: 12, color: "var(--accent)", fontWeight: 600, verticalAlign: "top", fontFamily: "var(--font-mono)", wordBreak: "break-word" }}>{hp.name}</td>
                    <td style={{ border: "1px solid var(--line)", padding: "7px 10px", fontSize: 12, color: "var(--ink)", verticalAlign: "top", lineHeight: 1.5 }}>{hp.what}</td>
                    <td style={{ border: "1px solid var(--line)", padding: "7px 10px", fontSize: 12, color: "var(--muted)", verticalAlign: "top", fontFamily: "var(--font-mono)", wordBreak: "break-word" }}>{hp.range}</td>
                    <td style={{ border: "1px solid var(--line)", padding: "7px 10px", fontSize: 12, color: "var(--ink)", verticalAlign: "top", lineHeight: 1.5 }}>{hp.tune}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function AssumptionsTab(props) {
    var algo = props.algo;
    return (
      <div style={{ padding: "16px 18px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12.5, width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "7px 10px", textAlign: "left", fontWeight: 700, fontSize: 11.5, color: "var(--muted)", width: "40%" }}>Assumption</th>
                <th style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "7px 10px", textAlign: "left", fontWeight: 700, fontSize: 11.5, color: "var(--muted)", width: "60%" }}>What happens when violated</th>
              </tr>
            </thead>
            <tbody>
              {algo.assumptions.map(function(asm, i) {
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg)" }}>
                    <td style={{ border: "1px solid var(--line)", padding: "7px 10px", fontSize: 12, color: "var(--ink)", verticalAlign: "top", fontWeight: 600, lineHeight: 1.5 }}>{asm.assumption}</td>
                    <td style={{ border: "1px solid var(--line)", padding: "7px 10px", fontSize: 12, color: "var(--ink)", verticalAlign: "top", lineHeight: 1.5 }}>{asm.violationEffect}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function DataIssuesTab(props) {
    var algo = props.algo;
    var outSev = getSeverityColor(algo.outlierImpact);
    var misSev = getSeverityColor(algo.missingImpact);
    return (
      <div style={{ padding: "16px 18px" }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>Outlier Impact</span>
            <span style={{ background: outSev.bg, color: outSev.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{outSev.label}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, margin: 0 }}>{algo.outlierImpact}</p>
        </div>
        <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "12px 0" }} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>Missing Values Impact</span>
            <span style={{ background: misSev.bg, color: misSev.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{misSev.label}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, margin: 0 }}>{algo.missingImpact}</p>
        </div>
      </div>
    );
  }

  function InterviewTab(props) {
    var algo = props.algo;
    var expandedQ = props.expandedQ;
    var onToggle = props.onToggle;
    return (
      <div style={{ padding: "12px 18px" }}>
        {algo.interview.map(function(item, i) {
          var key = algo.name + ":" + i;
          var isOpen = !!expandedQ[key];
          return (
            <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
              <button
                onClick={function() { onToggle(key); }}
                style={{
                  width: "100%", textAlign: "left", background: isOpen ? "var(--bg)" : "transparent",
                  border: "none", cursor: "pointer", padding: "10px 14px",
                  display: "flex", alignItems: "flex-start", gap: 8
                }}
              >
                <span style={{ color: "var(--muted)", fontSize: 12, flexShrink: 0, marginTop: 1 }}>{isOpen ? "▼" : "►"}</span>
                <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600, lineHeight: 1.5, flex: 1, textAlign: "left" }}>{item.q}</span>
                {item.tricky && (
                  <span style={{ background: "#fed7aa", color: "#9a3412", fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 5, flexShrink: 0, marginTop: 1 }}>Tricky</span>
                )}
              </button>
              {isOpen && (
                <div style={{ padding: "10px 14px 12px 34px", background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
                  <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, margin: 0 }}>{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ─── MAIN COMPONENT ───────────────────────────────────────────────────────

  const TABS = ["Overview", "Hyperparams", "Assumptions", "Data Issues", "Interview"];
  const CATEGORIES = ["All", "Regression", "Classification", "Neural Networks", "Both"];
  const FILTER_CATEGORIES = ["All", "Regression", "Classification", "Neural Networks"];

  function Cheatsheet() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [activeTab, setActiveTab] = useState({});
    const [expandedQ, setExpandedQ] = useState({});

    const getTab = function(name) {
      return activeTab[name] !== undefined ? activeTab[name] : 0;
    };

    const setTab = function(name, idx) {
      setActiveTab(function(prev) { return Object.assign({}, prev, { [name]: idx }); });
    };

    const toggleQ = function(key) {
      setExpandedQ(function(prev) { return Object.assign({}, prev, { [key]: !prev[key] }); });
    };

    const filtered = useMemo(function() {
      return ALGOS.filter(function(a) {
        var matchCat = category === "All" || a.category === category;
        var q = search.toLowerCase().trim();
        if (!q) return matchCat;
        var textToSearch = a.name.toLowerCase()
          + " " + a.definition.toLowerCase()
          + " " + a.category.toLowerCase()
          + " " + a.whenToUse.join(" ").toLowerCase()
          + " " + a.whenNotToUse.join(" ").toLowerCase()
          + " " + a.hyperparams.map(function(h) { return h.name + " " + h.what; }).join(" ").toLowerCase()
          + " " + a.assumptions.map(function(s) { return s.assumption; }).join(" ").toLowerCase()
          + " " + a.outlierImpact.toLowerCase()
          + " " + a.missingImpact.toLowerCase()
          + " " + a.interview.map(function(iv) { return iv.q + " " + iv.a; }).join(" ").toLowerCase();
        return matchCat && textToSearch.indexOf(q) !== -1;
      });
    }, [search, category]);

    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--font-sans)" }}>

        {/* ── Sticky Header ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "var(--bg)", borderBottom: "1px solid var(--line)"
        }}>
          {/* Nav bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 24px", maxWidth: 1400, margin: "0 auto"
          }}>
            <a href="index.html" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
                <circle cx="12" cy="12" r="2.4" />
                <circle cx="5" cy="6" r="1.6" />
                <circle cx="19" cy="6" r="1.6" />
                <circle cx="5" cy="18" r="1.6" />
                <circle cx="19" cy="18" r="1.6" />
                <path d="M6.6 7 10 10.4M17.4 7 14 10.4M6.6 17 10 13.6M17.4 17 14 13.6" />
              </svg>
              <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>Neural Codex</span>
            </a>
            <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18, color: "var(--accent)" }}>ML Algorithm Cheatsheet</span>
            <a href="index.html" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 14 }}>←</span> Back to catalog
            </a>
          </div>

          {/* Search + filters */}
          <div style={{ padding: "10px 24px 14px", maxWidth: 1400, margin: "0 auto" }}>
            <input
              type="text"
              placeholder="Search algorithms, hyperparameters, concepts..."
              value={search}
              onChange={function(e) { setSearch(e.target.value); }}
              style={{
                width: "100%", padding: "10px 16px", border: "1px solid var(--line)",
                borderRadius: 10, background: "var(--panel-solid)", fontSize: 14,
                color: "var(--ink)", outline: "none", boxSizing: "border-box",
                fontFamily: "var(--font-sans)", marginBottom: 12
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {FILTER_CATEGORIES.map(function(cat) {
                var isActive = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={function() { setCategory(cat); }}
                    style={{
                      padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                      border: isActive ? "none" : "1px solid var(--line)",
                      background: isActive ? "var(--accent)" : "var(--panel-solid)",
                      color: isActive ? "white" : "var(--ink)",
                      cursor: "pointer", fontFamily: "var(--font-sans)"
                    }}
                  >{cat}</button>
                );
              })}
              <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--muted)" }}>
                {"Showing " + filtered.length + " of " + ALGOS.length + " algorithms"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Cards Grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(540px, 1fr))",
          gap: 20,
          padding: "20px 24px 40px",
          maxWidth: 1400,
          margin: "0 auto"
        }}>
          {filtered.map(function(algo) {
            var currentTab = getTab(algo.name);
            var catColor = getCategoryColor(algo.category);
            return (
              <div key={algo.name} style={{
                background: "var(--panel-solid)",
                border: "1px solid var(--line)",
                borderRadius: 14,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}>
                {/* Card header */}
                <div style={{
                  padding: "14px 18px 10px",
                  borderBottom: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>{algo.name}</span>
                    <span style={{
                      background: catColor.bg,
                      color: catColor.color,
                      fontSize: 11, fontWeight: 700,
                      padding: "2px 9px", borderRadius: 6
                    }}>{algo.category}</span>
                  </div>
                </div>

                {/* Tab buttons */}
                <div style={{
                  display: "flex",
                  borderBottom: "1px solid var(--line)",
                  background: "var(--bg)",
                  overflowX: "auto"
                }}>
                  {TABS.map(function(tab, idx) {
                    var isActive = currentTab === idx;
                    return (
                      <button
                        key={tab}
                        onClick={function() { setTab(algo.name, idx); }}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          fontSize: 12,
                          fontWeight: isActive ? 700 : 500,
                          border: "none",
                          borderBottom: isActive ? "2.5px solid var(--accent)" : "2.5px solid transparent",
                          background: "transparent",
                          color: isActive ? "var(--accent)" : "var(--muted)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          fontFamily: "var(--font-sans)",
                          minWidth: 72
                        }}
                      >{tab}</button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <div style={{ flex: 1 }}>
                  {currentTab === 0 && <OverviewTab algo={algo} />}
                  {currentTab === 1 && <HyperparamsTab algo={algo} />}
                  {currentTab === 2 && <AssumptionsTab algo={algo} />}
                  {currentTab === 3 && <DataIssuesTab algo={algo} />}
                  {currentTab === 4 && <InterviewTab algo={algo} expandedQ={expandedQ} onToggle={toggleQ} />}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--muted)",
              fontSize: 15
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div>No algorithms match your search. Try a different term.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Cheatsheet));
})();
