/* ML Lifecycle — all 17 stages (educational article, no sliders) */
(function () {
  const { Lead, Note, Row, Tag, fmt } = window;

  // ── Shared helpers ──
  const card = (children, extra) => (
    <div style={{ background:"var(--panel-solid)", border:"1px solid var(--line)",
      borderRadius:14, padding:"16px 20px", boxShadow:"var(--shadow)",
      marginBottom:14, ...extra }}>
      {children}
    </div>
  );

  const subhead = (t) => (
    <div style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:15,
      color:"var(--accent)", margin:"18px 0 8px" }}>{t}</div>
  );

  const tbl = (children) => (
    <div style={{ overflowX:"auto", marginBottom:14 }}>
      <table style={{ borderCollapse:"collapse", fontSize:13, width:"100%" }}>
        {children}
      </table>
    </div>
  );

  const th = (s, extra={}) => (
    <th style={{ background:"var(--panel-solid)", border:"1px solid var(--line)",
      padding:"7px 11px", textAlign:"left", fontWeight:700,
      fontSize:12, color:"var(--muted)", ...extra }}>{s}</th>
  );

  const td = (s, extra={}) => (
    <td style={{ border:"1px solid var(--line)", padding:"7px 11px",
      fontSize:12, color:"var(--ink)", verticalAlign:"top", ...extra }}>{s}</td>
  );

  const codeBlock = (code) => (
    <pre style={{ background:"#f5f5f5", padding:"12px 16px", borderRadius:8,
      fontSize:12, overflowX:"auto", fontFamily:"monospace", lineHeight:1.6,
      margin:"10px 0", border:"1px solid #e0e0e0" }}>
      <code>{code}</code>
    </pre>
  );

  const accent = (s) => (
    <span style={{ color:"var(--accent)", fontWeight:700 }}>{s}</span>
  );

  const warn = (children) => (
    <div style={{ background:"#fff8e6", border:"1px solid #f5c842", borderRadius:10,
      padding:"10px 14px", fontSize:13, color:"#7a5700", margin:"10px 0" }}>
      <b>Warning:</b> {children}
    </div>
  );

  const info = (children) => (
    <div style={{ background:"rgba(43,91,255,.07)", border:"1px solid rgba(43,91,255,.2)",
      borderRadius:10, padding:"10px 14px", fontSize:13, color:"var(--ink)", margin:"10px 0" }}>
      {children}
    </div>
  );

  // ════════════════════════════════════════════
  // STAGES
  // ════════════════════════════════════════════
  const STAGES = [

    // ─── STAGE 1 ───────────────────────────────────────────────────────────────
    {
      id: "overview",
      group: "Overview",
      title: "The ML Lifecycle — end to end",
      why: "Start here to understand the full pipeline before diving into individual steps.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Machine learning in production is <b>not just training a model</b>. It is a
            multi-phase pipeline where each phase can fail independently, and order matters.
            Skip or rush any phase and your model will underperform, overfit, or break silently
            in production. This article walks you through every phase — with real examples,
            concrete numbers, and common mistakes.
          </Lead>

          {subhead("The Pipeline at a Glance")}

          {/* SVG Pipeline flowchart */}
          <div style={{ overflowX:"auto", marginBottom:18 }}>
            <svg viewBox="0 0 900 120" style={{ width:"100%", maxWidth:900, height:"auto",
              display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>

              {/* Arrow defs */}
              <defs>
                <marker id="arr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>

              {/* Boxes: x positions spaced ~97px apart, y=30, h=50, w=90 */}
              {[
                { x:6,   label:"Data",       sub:"Ingestion",  color:"#2B5BFF", bg:"rgba(43,91,255,.13)" },
                { x:104, label:"EDA",         sub:"& Cleaning", color:"#1f9e6b", bg:"rgba(31,158,107,.13)" },
                { x:202, label:"Feature",     sub:"Engineering",color:"#e05c2e", bg:"rgba(224,92,46,.13)" },
                { x:300, label:"Train/Test",  sub:"Split",      color:"#7c3aed", bg:"rgba(124,58,237,.13)" },
                { x:398, label:"Scaling &",   sub:"Selection",  color:"#0891b2", bg:"rgba(8,145,178,.13)" },
                { x:496, label:"Model",       sub:"Selection",  color:"#be185d", bg:"rgba(190,24,93,.13)" },
                { x:594, label:"Training",    sub:"& Tuning",   color:"#d97706", bg:"rgba(217,119,6,.13)" },
                { x:692, label:"Evaluation",  sub:"(Metrics)",  color:"#059669", bg:"rgba(5,150,105,.13)" },
                { x:790, label:"Deploy &",    sub:"Monitor",    color:"#dc2626", bg:"rgba(220,38,38,.13)" },
              ].map((b, i) => (
                <g key={i}>
                  <rect x={b.x} y={18} width={90} height={52} rx="8"
                    fill={b.bg} stroke={b.color} strokeWidth="1.8" />
                  <text x={b.x+45} y={39} textAnchor="middle" fontSize="10.5"
                    fontWeight="700" fill={b.color}>{b.label}</text>
                  <text x={b.x+45} y={54} textAnchor="middle" fontSize="9.5"
                    fill={b.color} opacity="0.85">{b.sub}</text>
                  {i < 8 && (
                    <line x1={b.x+91} y1={44} x2={b.x+101} y2={44}
                      stroke="#555" strokeWidth="1.4" markerEnd="url(#arr)" />
                  )}
                </g>
              ))}
            </svg>
          </div>

          <Note>
            <b>The most common mistake:</b> jumping straight to model training.
            80% of a data scientist's time is spent on data (steps 1–4). The model
            choice matters far less than data quality.
          </Note>

          {subhead("Why Does Order Matter?")}
          <p style={{ fontSize:13, lineHeight:1.7, color:"var(--ink)" }}>
            The pipeline order is not arbitrary — it enforces correctness:
          </p>
          <ul style={{ fontSize:13, lineHeight:1.9, color:"var(--ink)", paddingLeft:22 }}>
            <li><b>Feature engineering before splitting</b> is fine for creating features from raw data.
              But <b>scaler and imputer must be fit AFTER splitting</b> — fitting on combined data leaks
              test set statistics into training.</li>
            <li><b>Feature selection before model training</b> — you select which features to use based
              on training data only, so the model doesn't see signals from test rows.</li>
            <li><b>Evaluation on held-out data only</b> — a model evaluated on its own training data will
              always look better than it actually is. The test set is your single honest estimate
              of production performance.</li>
            <li><b>Hyperparameter tuning before final evaluation</b> — tune on validation or CV folds,
              then run the test set exactly once at the very end.</li>
          </ul>

          {info(<>
            <b>Navigation tip:</b> Use the stage menu on the left to jump to any step. Each stage
            explains: what it is, why it's needed, concrete examples with real numbers, and the
            most common mistakes.
          </>)}
        </>
      ),
    },

    // ─── STAGE 2 ───────────────────────────────────────────────────────────────
    {
      id: "ingestion",
      group: "Data",
      title: "Step 1 · Data Ingestion",
      why: "Data must be collected and validated before any analysis. Garbage in, garbage out.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Before any analysis, data must be collected from sources and validated.
            <b> Garbage in, garbage out</b> — no model can fix bad data. Data ingestion
            is the step where you acquire data, understand its format, and run basic
            sanity checks before it enters your pipeline.
          </Lead>

          {subhead("Common Data Sources")}
          {tbl(<>
            <thead>
              <tr>
                {th("Source")}{th("Format")}{th("Common Problems")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Databases (SQL/NoSQL)")}
                {td("Tabular rows")}
                {td("Schema changes, NULL handling, JOIN duplicates")}
              </tr>
              <tr>
                {td("CSV / Excel files")}
                {td("Flat files")}
                {td("Encoding issues, inconsistent delimiters, header row problems")}
              </tr>
              <tr>
                {td("APIs / Web scraping")}
                {td("JSON / XML")}
                {td("Rate limits, schema drift, missing fields")}
              </tr>
              <tr>
                {td("Streaming (Kafka)")}
                {td("Events")}
                {td("Out-of-order events, late arrivals, duplicate messages")}
              </tr>
              <tr>
                {td("Sensor / IoT data")}
                {td("Time-series")}
                {td("Clock skew, transmission errors, gaps in readings")}
              </tr>
              <tr>
                {td("Images / Audio / Text")}
                {td("Unstructured")}
                {td("Variable quality, labeling errors, storage scale")}
              </tr>
            </tbody>
          </>)}

          {subhead("Real-World Ingestion Failure")}
          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"var(--accent)", marginBottom:6 }}>
              Case Study: Credit Underwriting System
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              A credit underwriting system was trained where NULL values meant "not provided",
              but the serving system interpreted missing values as 0. Match rates dropped from
              90% to 60% within days of deployment.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"8px 0 0", color:"var(--ink)" }}>
              <b>Fix:</b> Explicit data contracts with schema validation in your ingestion
              pipeline. Define what NULL means before training and enforce it identically
              at serving time.
            </p>
          </>)}

          {subhead("Ingestion Checklist")}
          <Note>
            <b>What to verify at every ingestion:</b>
            <ul style={{ margin:"8px 0 0", paddingLeft:20, lineHeight:1.9, fontSize:13 }}>
              <li>Row count matches expected volume (no partial loads)</li>
              <li>Column types are correct — dates parsed as dates, not strings</li>
              <li>No truncated files (partial uploads or broken streams)</li>
              <li>Encoding is UTF-8 (or explicitly declared)</li>
              <li>Duplicate primary keys checked and resolved</li>
              <li>Value ranges are plausible (no negative ages, no impossible timestamps)</li>
            </ul>
          </Note>
        </>
      ),
    },

    // ─── STAGE 3 ───────────────────────────────────────────────────────────────
    {
      id: "eda-explore",
      group: "EDA",
      title: "Step 2a · EDA — Understanding Your Data",
      why: "Before touching a model, you need to understand what you're working with.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Exploratory Data Analysis (EDA) is the detective phase. Before touching a model,
            you need to understand the shape of distributions, relationships between features,
            and where the data breaks. EDA prevents you from building a model on assumptions
            that are simply wrong.
          </Lead>

          {subhead("First 5 Things to Do on Any New Dataset")}
          <ol style={{ fontSize:13, lineHeight:2.0, color:"var(--ink)", paddingLeft:22 }}>
            <li>
              <b><code>df.shape</code></b> — How many rows and columns? Is the dataset too small
              (&lt; 1,000 rows) or huge (&gt; 10M)? This determines which algorithms are feasible.
            </li>
            <li>
              <b><code>df.dtypes</code></b> — Are numeric columns stored as strings?
              Are dates parsed correctly? Wrong dtypes cause silent bugs.
            </li>
            <li>
              <b><code>df.describe()</code></b> — Check min/max for impossible values
              (age = −5, salary = 9,999,999). Check mean vs median gap — a large gap signals
              a skewed distribution.
            </li>
            <li>
              <b><code>df.isnull().sum()</code></b> — Which columns have missing values,
              and how many? This drives your imputation strategy (see Step 2b).
            </li>
            <li>
              <b>Correlation heatmap</b> — Which features are highly correlated (&gt;0.9)?
              They may be redundant and can be removed to reduce noise.
            </li>
          </ol>

          {subhead("Choosing the Right Plot")}
          {tbl(<>
            <thead>
              <tr>
                {th("Plot type")}{th("What it shows")}{th("When to use")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Histogram")}
                {td("Shape of distribution — normal, skewed, bimodal")}
                {td("Check normality; spot unexpected peaks or gaps")}
              </tr>
              <tr>
                {td("Boxplot")}
                {td("Quartiles (Q1, median, Q3) + outlier points")}
                {td("Quick outlier scan; comparing spread across groups")}
              </tr>
              <tr>
                {td("Violin plot")}
                {td("Boxplot + kernel density estimate")}
                {td("Best for comparing distributions across multiple groups")}
              </tr>
              <tr>
                {td("Scatter plot")}
                {td("Feature vs target relationship")}
                {td("Check for linear vs non-linear relationship; spot clusters")}
              </tr>
              <tr>
                {td("Correlation heatmap")}
                {td("Pairwise correlations between all features")}
                {td("Find redundant features; spot multicollinearity")}
              </tr>
            </tbody>
          </>)}

          {subhead("Target Variable Analysis")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 8px", color:"var(--ink)" }}>
              <b>Regression:</b> Check if the target is skewed. If
              {" "}<code>skewness &gt; 1</code>, consider a log transform:{" "}
              <code>y_log = log(y + 1)</code>. Linear models assume residuals are roughly
              normal — severe skew violates this assumption.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Classification:</b> Check class balance. If the minority class is
              &lt; 20% of the total, imbalance is a problem and you'll need a strategy
              (see Step 2d). If &lt; 5%, treat it as a severe imbalance case.
            </p>
          </>)}

          <Note>
            EDA is <b>iterative, not a one-time step</b>. You'll return to EDA after feature
            engineering to verify that new features look reasonable and don't contain unintended
            distributions or correlations.
          </Note>
        </>
      ),
    },

    // ─── STAGE 4 ───────────────────────────────────────────────────────────────
    {
      id: "eda-missing",
      group: "EDA",
      title: "Step 2b · Missing Values — Detect & Handle",
      why: "Missing data is the most common data quality problem; WHY data is missing determines HOW to fix it.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Missing data is the most common data quality problem. But not all missingness
            is equal — <b>why data is missing determines how to fix it</b>. Blindly filling
            with the mean is often wrong and can quietly damage your model.
          </Lead>

          {subhead("The 3 Types of Missingness")}
          {tbl(<>
            <thead>
              <tr>
                {th("Type")}{th("Full Name")}{th("What It Means")}{th("Example")}{th("Best Fix")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td(accent("MCAR"), { whiteSpace:"nowrap" })}
                {td("Missing Completely At Random")}
                {td("Missingness is random, unrelated to any variable")}
                {td("A sensor randomly drops 2% of readings")}
                {td("Simple imputation (median/mean) — any method works")}
              </tr>
              <tr>
                {td(accent("MAR"), { whiteSpace:"nowrap" })}
                {td("Missing At Random")}
                {td("Missingness depends on OTHER observed variables")}
                {td("Older users are less likely to fill in income (but age is recorded)")}
                {td("KNN Imputer, MICE, regression imputation")}
              </tr>
              <tr>
                {td(accent("MNAR"), { whiteSpace:"nowrap" })}
                {td("Missing Not At Random")}
                {td("Missingness depends on the MISSING value itself")}
                {td("Users with very low income skip the income field")}
                {td("MICE + add a binary "was_missing" indicator feature")}
              </tr>
            </tbody>
          </>)}
          {info(<>
            In practice: <b>assume MAR unless you have strong domain evidence otherwise.</b>{" "}
            MCAR is rare in real datasets. MNAR requires domain knowledge to detect —
            look for correlations between "is_missing" flags and the target variable.
          </>)}

          {subhead("Imputation Techniques")}
          {tbl(<>
            <thead>
              <tr>
                {th("Technique")}{th("When to Use")}{th("Pros")}{th("Cons")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Median imputation")}
                {td("Numerical with outliers, MCAR/MAR, quick baseline")}
                {td("Fast, outlier-robust")}
                {td("Ignores relationships between features")}
              </tr>
              <tr>
                {td("Mean imputation")}
                {td("Numerical, normally distributed, no outliers")}
                {td("Simple")}
                {td("Distorts variance; biased with outliers")}
              </tr>
              <tr>
                {td("Mode imputation")}
                {td("Categorical features")}
                {td("Simple")}
                {td("Creates artificial peak at mode")}
              </tr>
              <tr>
                {td("KNN Imputer")}
                {td("MAR; features are related to each other")}
                {td("Uses feature relationships")}
                {td("Slow on large datasets — O(n²)")}
              </tr>
              <tr>
                {td("MICE (Iterative)")}
                {td("MAR / MNAR; complex datasets")}
                {td("Best accuracy; handles complex relationships")}
                {td("Computationally expensive; complex to tune")}
              </tr>
              <tr>
                {td("Add missing indicator")}
                {td("MNAR — missingness carries information")}
                {td("Preserves the missingness signal")}
                {td("Adds one binary feature per affected column")}
              </tr>
            </tbody>
          </>)}

          {subhead("Missingness Thresholds")}
          {card(<>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:20, color:"var(--ink)" }}>
              <li><b>&lt; 5% missing:</b> Any imputation works. Median is a safe default.</li>
              <li><b>5–40% missing:</b> Use KNN or MICE for best results. Add indicator if MNAR.</li>
              <li><b>&gt; 40% missing:</b> Dropping the column often beats imputation. Imputed signal is too diluted.</li>
              <li><b>&gt; 70% missing:</b> Almost always drop the column entirely.</li>
            </ul>
          </>)}

          <Note>
            <b>Always fit the imputer on training data only</b>, then transform both train and test.
            Fitting on combined data = leakage — you're allowing test set statistics to influence
            your imputation values.
          </Note>
        </>
      ),
    },

    // ─── STAGE 5 ───────────────────────────────────────────────────────────────
    {
      id: "eda-outliers",
      group: "EDA",
      title: "Step 2c · Outliers — Detect & Handle",
      why: "Outliers can be errors, rare events, or the most important signals — never blindly remove them.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Outliers are data points far from the rest. They can be genuine extreme values
            (a billionaire's salary in income data), data entry errors (age = 999), or the most
            important signals (fraud transactions). <b>Never blindly remove outliers.</b>
          </Lead>

          {subhead("Detection Methods — Toy Example")}
          {info(<>
            <b>Dataset:</b> salaries = [45k, 50k, 52k, 48k, 51k, 49k, <span style={{color:"#dc2626",fontWeight:700}}>250k</span>]
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>Z-Score Method</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Formula:</b> z = (x − μ) / σ. Flag as outlier if |z| &gt; 3.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
              With mean ≈ 92k, σ ≈ 73k: 250k has z ≈ 2.1 (not flagged at threshold 3).
              Works <b>best on normal distributions</b>. Fails when the outlier distorts mean and std.
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>IQR Method (Preferred for Skewed Data)</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Formula:</b> Outlier if x &lt; Q1 − 1.5×IQR or x &gt; Q3 + 1.5×IQR
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
              Q1 = 48.5k, Q3 = 51.5k, IQR = 3k → upper fence = 51.5 + 4.5 = <b>56k</b>.
              250k is clearly flagged. More robust than Z-score for non-normal distributions.
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>Isolation Forest (High-Dimensional Data)</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              ML-based detection. Anomaly score between 0–1. Works when outliers are anomalous
              across <em>multiple dimensions simultaneously</em> — something univariate methods
              cannot capture. Scores close to 1 are inliers; close to −1 are outliers
              (sklearn convention).
            </p>
          </>)}

          {subhead("How to Handle Outliers")}
          {tbl(<>
            <thead>
              <tr>
                {th("Strategy")}{th("When")}{th("How")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Remove")}
                {td("Clear data entry errors (age = 999, salary = −1)")}
                {td("Delete the row after confirming it's an error")}
              </tr>
              <tr>
                {td("Winsorize / Cap")}
                {td("Legitimate extreme values you want to limit")}
                {td("Cap at 1st / 99th percentile; preserves row")}
              </tr>
              <tr>
                {td("Log transform")}
                {td("Right-skewed distributions (income, house prices)")}
                {td("log(x + 1) compresses large values; spreads small ones")}
              </tr>
              <tr>
                {td("RobustScaler")}
                {td("Outliers exist but cannot be removed")}
                {td("Uses median/IQR instead of mean/std")}
              </tr>
              <tr>
                {td("Keep as-is")}
                {td("Outliers ARE the signal (fraud, anomaly detection)")}
                {td("Use models robust to outliers — trees, SVR, Isolation Forest")}
              </tr>
            </tbody>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"#dc2626", marginBottom:6 }}>
              Fraud Detection Rule
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              In fraud detection, the outliers <em>are</em> the fraud. Removing them destroys
              the model's entire purpose. Always ask: "Are these outliers the signal I'm trying
              to detect?" before cleaning.
            </p>
          </>)}
        </>
      ),
    },

    // ─── STAGE 6 ───────────────────────────────────────────────────────────────
    {
      id: "eda-imbalance",
      group: "EDA",
      title: "Step 2d · Class Imbalance — Handle Skewed Targets",
      why: "Accuracy is useless for imbalanced problems — a model predicting 'not fraud' always achieves 99.7% accuracy.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Class imbalance occurs when one class is much more common than another.
            A model that predicts "not fraud" for every transaction achieves 99.7% accuracy
            — and catches zero fraud. <b>Accuracy is useless for imbalanced problems.</b>
          </Lead>

          {subhead("Imbalance Severity Scale")}
          {tbl(<>
            <thead>
              <tr>
                {th("Ratio")}{th("Severity")}{th("Signal")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("2:1")}
                {td("Mild")}
                {td("Accuracy still somewhat meaningful")}
              </tr>
              <tr>
                {td("5:1 – 10:1")}
                {td("Moderate")}
                {td("Use precision/recall; consider class_weight")}
              </tr>
              <tr>
                {td("10:1 – 100:1")}
                {td("Severe", {color:"#d97706",fontWeight:700})}
                {td("SMOTE or class_weight needed; use F1/PR-AUC")}
              </tr>
              <tr>
                {td("100:1+")}
                {td("Extreme", {color:"#dc2626",fontWeight:700})}
                {td("Undersampling or anomaly detection approach")}
              </tr>
            </tbody>
          </>)}

          {subhead("Techniques with Research Numbers")}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"var(--accent)", marginBottom:6 }}>
              class_weight='balanced' — The Easiest Fix
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Weights minority samples higher during training. Works for most sklearn models
              and XGBoost (<code>scale_pos_weight</code>). Best for up to ~50:1 imbalance.
              At a 67:1 ratio dataset, <code>class_weight='balanced'</code> provided the best
              F1-precision-recall balance without generating any synthetic data.
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"var(--accent)", marginBottom:6 }}>
              SMOTE — Synthetic Minority Oversampling
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Creates synthetic minority samples by interpolating between existing ones.
              Works best for 10:1 to 100:1 ratios. At 67:1, SMOTE generated 67k synthetic
              samples but recall dropped to 32% with precision at 4.4% — SMOTE fails when
              minority patterns are genuinely rare and hard to interpolate.
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"var(--accent)", marginBottom:6 }}>
              Random Undersampling
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Removes majority class samples to balance the dataset. Highest recall but worst
              precision. Use only when: majority class is massive and you can afford losing
              data, or imbalance is extreme (&gt; 99:1).
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"var(--accent)", marginBottom:6 }}>
              Threshold Adjustment — Free Improvement
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Instead of resampling, lower the decision threshold from 0.5 to e.g. 0.3.
              Increases recall at the cost of precision. No data modification needed.
              Try this first — it's free and often surprisingly effective.
            </p>
          </>)}

          {warn(<>
            On imbalanced data: <b>NEVER use accuracy alone.</b> Use: Precision, Recall,
            F1-score, and PR-AUC. ROC-AUC can be misleading (remains high even if minority
            recall is near zero) — prefer <b>PR-AUC (Precision-Recall AUC)</b> for highly
            imbalanced datasets.
          </>)}

          <Note>
            Apply SMOTE <b>only to training data, after the train-test split</b>.
            Never oversample the test data — you would be testing on synthetic samples,
            giving you an inflated and meaningless evaluation score.
          </Note>
        </>
      ),
    },

    // ─── STAGE 7 ───────────────────────────────────────────────────────────────
    {
      id: "feat-eng",
      group: "Features",
      title: "Step 3 · Feature Engineering",
      why: "The most impactful single action a data scientist can take — often more impactful than model selection.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Feature engineering is the process of creating new input features from raw data
            to help the model learn patterns it couldn't otherwise detect. It is the most
            impactful single action a data scientist can take — <b>often more impactful
            than model selection.</b>
          </Lead>

          {subhead("Mathematical Transformations")}
          {card(<>
            <ul style={{ fontSize:13, lineHeight:2.0, paddingLeft:20, margin:0, color:"var(--ink)" }}>
              <li>
                <b>Log transform:</b> Income = [10k, 50k, 500k, 1M] →
                log₁₀ = [4.0, 4.7, 5.7, 6.0]. Compresses right-skewed distributions.
              </li>
              <li>
                <b>Polynomial features:</b> x → x, x², x³. Captures non-linear relationships
                for linear models without switching to a more complex algorithm.
              </li>
              <li>
                <b>Ratios:</b> <code>debt_to_income_ratio = debt / income</code>. Ratios are
                often more predictive than raw values because they capture proportional relationships.
              </li>
              <li>
                <b>Differences:</b> <code>price_change = today_price − yesterday_price</code>.
                Stationarizes time series; removes trend effects.
              </li>
            </ul>
          </>)}

          {subhead("Categorical Encoding")}
          {tbl(<>
            <thead>
              <tr>
                {th("Method")}{th("When to Use")}{th("Risk / Notes")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("One-hot encoding")}
                {td("Nominal categories with < 10 unique values")}
                {td("Creates k binary columns; avoid with high cardinality")}
              </tr>
              <tr>
                {td("Label encoding")}
                {td("Ordinal categories with natural order (Low/Med/High → 0/1/2)")}
                {td("Wrong for nominal — implies order that doesn't exist")}
              </tr>
              <tr>
                {td("Target encoding")}
                {td("High-cardinality nominal features")}
                {td("Risk of data leakage — must encode within CV folds, not globally")}
              </tr>
              <tr>
                {td("Frequency encoding")}
                {td("High-cardinality (1000+ unique values)")}
                {td("Replaces category with count; no leakage risk")}
              </tr>
            </tbody>
          </>)}

          {subhead("Date / Time Features")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 8px", color:"var(--ink)" }}>
              Raw timestamps are almost never useful to a model directly. Extract:
            </p>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:20, color:"var(--ink)" }}>
              <li><code>hour</code>, <code>day_of_week</code>, <code>month</code>, <code>is_weekend</code></li>
              <li><code>days_since_last_event</code> — captures recency effects</li>
              <li><code>quarter</code>, <code>is_holiday</code> — business cycle signals</li>
            </ul>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"8px 0 0", color:"#be185d", fontWeight:600 }}>
              Example failure: A retail model that was missing <code>day_of_week</code>
              completely missed the weekend sales spike — one of the strongest signals in the data.
            </p>
          </>)}

          {subhead("Interaction Features")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <code>age × income</code> captures that wealthy young people behave differently
              from wealthy old people — a relationship neither feature alone can express.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"8px 0 0", color:"var(--ink)" }}>
              <b>Caution:</b> Do not blindly multiply all feature pairs. With 50 features,
              that's 1,225 interaction terms — combinatorial explosion. Use domain knowledge
              to select meaningful interactions.
            </p>
          </>)}

          <Note>
            Domain knowledge is 10× more valuable than automated feature generation.
            A doctor who knows that fever + high white blood cell count = likely infection
            will create a better feature than any AutoML tool. Talk to domain experts before
            running automated feature generation.
          </Note>
        </>
      ),
    },

    // ─── STAGE 8 ───────────────────────────────────────────────────────────────
    {
      id: "feat-scale",
      group: "Features",
      title: "Step 4 · Feature Scaling",
      why: "Distance-based and gradient-descent algorithms are dominated by high-magnitude features without scaling.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Many algorithms compute distances or use gradient descent — both are sensitive
            to the magnitude of features. Without scaling, a feature measured in thousands
            (income) will dominate a feature measured in units (number of children).
            Scaling puts all features on equal footing.
          </Lead>

          {subhead("When Scaling IS Needed vs Not Needed")}
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:14 }}>
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, color:"#059669", marginBottom:8 }}>
                ✓ Scaling IS needed
              </div>
              <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:20, color:"var(--ink)" }}>
                <li>SVM (distance-based)</li>
                <li>Logistic Regression</li>
                <li>Neural Networks (gradient descent)</li>
                <li>KNN (nearest neighbour distances)</li>
                <li>PCA (variance maximization)</li>
                <li>Ridge / Lasso (regularization penalty)</li>
              </ul>
            </>, { flex:"1 1 220px" })}
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, color:"#dc2626", marginBottom:8 }}>
                ✗ Scaling NOT needed
              </div>
              <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:20, color:"var(--ink)" }}>
                <li>Decision Trees (split thresholds, not distances)</li>
                <li>Random Forest</li>
                <li>XGBoost / LightGBM</li>
                <li>Naive Bayes</li>
              </ul>
            </>, { flex:"1 1 220px" })}
          </div>

          {subhead("The 3 Scalers — Concrete Example")}
          {info(<>
            <b>Dataset column:</b> salary = [30k, 45k, 50k, 52k,{" "}
            <span style={{color:"#dc2626",fontWeight:700}}>1000k (outlier)</span>]
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>StandardScaler: x′ = (x − mean) / std</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Mean = 235k, std = 410k. Result: [−0.50, −0.46, −0.45, −0.45, <b>1.86</b>].
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"#d97706" }}>
              The outlier (1000k) distorts the mean and std — all normal values cluster near −0.5.
              Not ideal with outliers.
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>MinMaxScaler: x′ = (x − min) / (max − min)</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Range = [0, 1]. 30k → 0.00, 45k → 0.015, 1000k → 1.00.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"#dc2626", fontWeight:700 }}>
              The outlier compresses ALL other values to near 0. TERRIBLE with outliers.
              Only use when data is clean and has natural bounds (e.g., percentages 0–100%).
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>RobustScaler: x′ = (x − median) / IQR</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Median = 50k, IQR = 22k. Result: [−0.91, −0.23, 0.00, 0.09, <b>43.2</b>].
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"#059669" }}>
              The outlier gets a huge scaled value (43.2) but the OTHER values are well-spread.
              The outlier doesn't distort the scaling of normal values. Best for real-world data.
            </p>
          </>)}

          <Note>
            <b>Decision rule:</b>
            <ol style={{ margin:"8px 0 0", paddingLeft:20, lineHeight:1.9, fontSize:13 }}>
              <li>Check for outliers. &gt;5% are statistical outliers → <b>RobustScaler</b></li>
              <li>Clean data with natural bounds (0–100%)? → <b>MinMaxScaler</b></li>
              <li>Normal distribution, no outliers → <b>StandardScaler</b></li>
              <li>Unsure? → <b>RobustScaler</b> (safest default for real-world data)</li>
            </ol>
          </Note>

          {warn(<>
            <b>WRONG:</b> Scale all data → then split into train/test. ← This is data leakage.
            <br />
            <b>CORRECT:</b> Split into train/test → Fit scaler on train only → Transform both train and test.
            <br />
            Why: If you scale on combined data, test set statistics (mean, std) leak into your
            training process. Your scaler has "seen" the test set.
          </>)}
        </>
      ),
    },

    // ─── STAGE 9 ───────────────────────────────────────────────────────────────
    {
      id: "dim-reduce",
      group: "Features",
      title: "Step 5 · Dimensionality Reduction",
      why: "High-dimensional data causes overfitting and makes distances meaningless — compression preserves signal.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            High-dimensional data suffers from the <b>curse of dimensionality</b>: as features
            increase, distances become meaningless, models overfit, and computation explodes.
            Dimensionality reduction compresses information into fewer meaningful dimensions.
          </Lead>

          {subhead("The Curse of Dimensionality — Illustrated")}
          {card(<>
            <ul style={{ fontSize:13, lineHeight:1.9, paddingLeft:20, margin:0, color:"var(--ink)" }}>
              <li><b>In 2D:</b> randomly placed points tend to be close to each other.</li>
              <li><b>In 1000D:</b> almost all pairs of points are at approximately the same
                distance from each other. KNN breaks down entirely — every neighbour is equally
                "near".</li>
              <li><b>Rule of thumb:</b> with d features, you need at least 5<sup>d</sup> training
                samples for KNN to work well. At d=10, that's ~10 million rows.</li>
            </ul>
          </>)}

          {subhead("Main Dimensionality Reduction Methods")}
          {tbl(<>
            <thead>
              <tr>
                {th("Method")}{th("Type")}{th("What It Does")}{th("Best For")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td(accent("PCA"))}
                {td("Linear, unsupervised")}
                {td("Rotates data to maximize variance; new axes are orthogonal")}
                {td("Correlated continuous features; preprocessing for linear models")}
              </tr>
              <tr>
                {td("t-SNE")}
                {td("Non-linear, unsupervised")}
                {td("Preserves local neighborhood structure in 2D/3D")}
                {td("Visualization only — distances not meaningful for model input")}
              </tr>
              <tr>
                {td("UMAP")}
                {td("Non-linear, unsupervised")}
                {td("Faster than t-SNE; better global structure")}
                {td("Visualization and clustering preprocessing")}
              </tr>
              <tr>
                {td("LDA")}
                {td("Linear, supervised")}
                {td("Maximizes class separability — uses label information")}
                {td("Classification preprocessing when classes are separable")}
              </tr>
              <tr>
                {td("Autoencoders")}
                {td("Non-linear, unsupervised")}
                {td("Neural encoder-decoder learns compressed representation")}
                {td("Images, text, and non-linear high-dimensional data")}
              </tr>
              <tr>
                {td("Feature selection")}
                {td("Filter / wrapper")}
                {td("Removes features rather than combining them")}
                {td("Interpretability; removing irrelevant or redundant features")}
              </tr>
            </tbody>
          </>)}

          {subhead("PCA in One Sentence")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              PCA finds the directions of maximum variance in your data (called <em>principal
              components</em>) and projects the data onto those directions — a linear rotation
              that keeps the most important dimensions and discards the least informative ones.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"8px 0 0", color:"var(--accent)", fontWeight:600 }}>
              We have a dedicated PCA article with step-by-step eigenvalue computation and
              interactive examples — see PCA.html.
            </p>
          </>)}

          <Note>
            Dimensionality reduction is <b>optional</b> — not always needed.
            First try training without it. Apply when:
            <ul style={{ margin:"8px 0 0", paddingLeft:20, lineHeight:1.9, fontSize:13 }}>
              <li>n_features &gt; n_samples (more columns than rows)</li>
              <li>Features are highly correlated (r &gt; 0.9 between many pairs)</li>
              <li>You need to visualize clusters in 2D or 3D</li>
            </ul>
          </Note>
        </>
      ),
    },

    // ─── STAGE 10 ──────────────────────────────────────────────────────────────
    {
      id: "splitting",
      group: "Training",
      title: "Step 6 · Splitting Data — Train / Validation / Test",
      why: "The train/test split is the fundamental guarantee of honest evaluation — breaking it breaks your results.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            The train/test split is not just a technical step — it is the fundamental
            guarantee of honest evaluation. Breaking it breaks your model evaluation.
            This is where data leakage most commonly occurs in practice.
          </Lead>

          {subhead("The 3 Sets")}
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:14 }}>
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, color:"#2B5BFF" }}>Training Set (60–80%)</div>
              <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
                Model sees this data. Parameters are fitted here. All preprocessing
                (scaling, imputation) is <em>fit</em> on this set.
              </p>
            </>, { flex:"1 1 160px" })}
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, color:"#d97706" }}>Validation Set (10–20%)</div>
              <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
                Model never fits this. Used to tune hyperparameters and compare models.
                Can reuse across multiple tuning iterations.
              </p>
            </>, { flex:"1 1 160px" })}
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, color:"#dc2626" }}>Test Set (10–20%)</div>
              <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
                Model NEVER sees this until final evaluation. Reported <b>once</b>.
                Gives the honest estimate of production performance.
              </p>
            </>, { flex:"1 1 160px" })}
          </div>

          {warn(<>
            If you tune hyperparameters using the test set, it becomes a second validation set.
            Your "test" performance is optimistic — you've overfit the test set. This is why
            Kaggle leaderboard scores often overstate real-world performance.
          </>)}

          {subhead("K-Fold Cross-Validation")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 10px", color:"var(--ink)" }}>
              Instead of one validation split, rotate k folds. More data-efficient; every
              sample is in the validation set exactly once. Standard: k = 5 or k = 10.
            </p>
            {/* 5-fold CV SVG */}
            <svg viewBox="0 0 560 130" style={{ width:"100%", maxWidth:560, height:"auto",
              display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              {[0,1,2,3,4].map(round => (
                <g key={round} transform={`translate(0, ${round*23})`}>
                  <text x={4} y={16} fontSize="10" fill="var(--muted)" fontWeight="600">
                    Round {round+1}:
                  </text>
                  {[0,1,2,3,4].map(fold => {
                    const isVal = fold === round;
                    return (
                      <rect key={fold}
                        x={80 + fold * 94} y={4} width={88} height={17} rx="4"
                        fill={isVal ? "rgba(220,38,38,.18)" : "rgba(43,91,255,.13)"}
                        stroke={isVal ? "#dc2626" : "#2B5BFF"}
                        strokeWidth="1.3" />
                    );
                  })}
                  {[0,1,2,3,4].map(fold => {
                    const isVal = fold === round;
                    return (
                      <text key={fold} x={80 + fold * 94 + 44} y={16.5}
                        textAnchor="middle" fontSize="9.5"
                        fill={isVal ? "#dc2626" : "#2B5BFF"}
                        fontWeight={isVal ? "700" : "400"}>
                        {isVal ? "Val" : `Train`}
                      </text>
                    );
                  })}
                </g>
              ))}
              <text x={80} y={125} fontSize="9.5" fill="var(--faint)">Fold 1</text>
              <text x={174} y={125} fontSize="9.5" fill="var(--faint)">Fold 2</text>
              <text x={268} y={125} fontSize="9.5" fill="var(--faint)">Fold 3</text>
              <text x={362} y={125} fontSize="9.5" fill="var(--faint)">Fold 4</text>
              <text x={456} y={125} fontSize="9.5" fill="var(--faint)">Fold 5</text>
            </svg>
          </>)}

          {subhead("Stratified Split")}
          <Note>
            For classification, <b>always use stratified splitting</b> — ensures each fold
            has the same class ratio as the full dataset. Critical for imbalanced datasets
            where a random split might put all minority samples in training, leaving none for
            validation.
          </Note>

          {subhead("Time-Series Split")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              For temporal data, <b>NEVER split randomly</b>. Future data cannot train to
              predict the past. Use TimeSeriesSplit (expanding window):
            </p>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:"8px 0 0", paddingLeft:20, color:"var(--ink)" }}>
              <li>Round 1: Train on months 1–6, validate on month 7</li>
              <li>Round 2: Train on months 1–7, validate on month 8</li>
              <li>Round 3: Train on months 1–8, validate on month 9</li>
            </ul>
          </>)}

          {subhead("Data Leakage Taxonomy")}
          <Note>
            <ul style={{ margin:"0", paddingLeft:20, lineHeight:1.9, fontSize:13 }}>
              <li><b>Target leakage:</b> A feature that contains future information about the
                target. Example: using loan_default (set after default) to predict default.</li>
              <li><b>Train-test leakage:</b> Preprocessing fitted on the full dataset before
                splitting. Example: scaling on all data, then splitting.</li>
              <li><b>Temporal leakage:</b> Using future data to predict the past in a time series.</li>
              <li><b>Label leakage:</b> Duplicate rows appear in both train and test sets.</li>
            </ul>
          </Note>
        </>
      ),
    },

    // ─── STAGE 11 ──────────────────────────────────────────────────────────────
    {
      id: "feat-select",
      group: "Training",
      title: "Step 7 · Feature Selection",
      why: "More features ≠ better model — irrelevant features add noise; redundant features slow training.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            More features ≠ better model. Irrelevant features add noise. Redundant features
            slow training. Feature selection improves model speed, interpretability, and
            often accuracy — by removing everything the model doesn't need to know.
          </Lead>

          {subhead("Family 1: Filter Methods (Fast, Model-Agnostic)")}
          {card(<>
            <ul style={{ fontSize:13, lineHeight:1.9, paddingLeft:20, margin:0, color:"var(--ink)" }}>
              <li><b>Correlation:</b> Remove features with |correlation to target| &lt; 0.05.
                Also remove features with |inter-feature correlation| &gt; 0.95 (redundant).</li>
              <li><b>Chi-squared test:</b> For categorical features. Tests statistical
                dependence with the target variable.</li>
              <li><b>Mutual information:</b> Measures non-linear relationships. Better than
                correlation when the relationship is non-linear.</li>
              <li><b>Variance threshold:</b> Remove features with near-zero variance —
                they cannot explain anything (constant columns).</li>
            </ul>
          </>)}

          {subhead("Family 2: Wrapper Methods (Use the Model, Expensive)")}
          {card(<>
            <ul style={{ fontSize:13, lineHeight:1.9, paddingLeft:20, margin:0, color:"var(--ink)" }}>
              <li><b>Recursive Feature Elimination (RFE):</b> Train model → remove weakest
                feature → retrain → repeat. Accurate but slow (O(n_features²) training runs).</li>
              <li><b>Forward selection:</b> Start with empty set, add best feature at each step.</li>
              <li><b>Backward elimination:</b> Start with full set, remove worst feature each step.</li>
            </ul>
          </>)}

          {subhead("Family 3: Embedded Methods (Best Balance)")}
          {card(<>
            <ul style={{ fontSize:13, lineHeight:1.9, paddingLeft:20, margin:0, color:"var(--ink)" }}>
              <li><b>LASSO (L1 regularization):</b> Shrinks some coefficients to exactly zero
                → automatic feature selection built into training.</li>
              <li><b>Random Forest feature importance:</b> Impurity-based. Fast, works for
                non-linear models. Can be biased toward high-cardinality features.</li>
              <li><b>XGBoost gain importance:</b> More reliable than impurity-based RF importance
                for ranking feature contributions.</li>
            </ul>
          </>)}

          {subhead("Decision Guide")}
          {tbl(<>
            <thead>
              <tr>{th("Situation")}{th("Recommended Method")}</tr>
            </thead>
            <tbody>
              <tr>
                {td("Huge dataset (> 100K rows), need speed")}
                {td("Filter (correlation + variance threshold) first")}
              </tr>
              <tr>
                {td("< 50 features, need best subset")}
                {td("RFE with cross-validation")}
              </tr>
              <tr>
                {td("Linear model")}
                {td("LASSO (L1) — selection built into training")}
              </tr>
              <tr>
                {td("Any tree-based model")}
                {td("Feature importance → drop bottom 10% → retrain")}
              </tr>
              <tr>
                {td("Unknown / non-linear relationships")}
                {td("Mutual information (works for non-linear)")}
              </tr>
            </tbody>
          </>)}
        </>
      ),
    },

    // ─── STAGE 12 ──────────────────────────────────────────────────────────────
    {
      id: "model-select",
      group: "Training",
      title: "Step 8 · Model Selection — Choosing the Right Algorithm",
      why: "There is no universally best model — only the right model for your data, constraints, and goals.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            There is no universally best model — only the best model for your specific data,
            constraints, and goals. Model selection is guided by: data size, data type,
            interpretability requirements, and whether the relationship is linear.
          </Lead>

          {subhead("Decision Flowchart")}
          {card(<>
            <div style={{ fontSize:13, lineHeight:1.8, color:"var(--ink)" }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>Is the target continuous or categorical?</div>
              <div style={{ paddingLeft:16, borderLeft:"3px solid #2B5BFF" }}>
                <div style={{ fontWeight:700, color:"#2B5BFF", marginBottom:4 }}>→ Continuous (Regression):</div>
                <ul style={{ margin:"0 0 8px", paddingLeft:20, lineHeight:1.9 }}>
                  <li>Linear relationship? → <b>Linear / Ridge / Lasso Regression</b></li>
                  <li>Non-linear, interpretability needed? → <b>Decision Tree</b></li>
                  <li>Non-linear, best accuracy? → <b>XGBoost / GBM</b></li>
                  <li>Very few features, need kernel trick? → <b>SVR (RBF kernel)</b></li>
                </ul>
              </div>
              <div style={{ paddingLeft:16, borderLeft:"3px solid #e05c2e" }}>
                <div style={{ fontWeight:700, color:"#e05c2e", marginBottom:4 }}>→ Categorical (Classification):</div>
                <ul style={{ margin:"0", paddingLeft:20, lineHeight:1.9 }}>
                  <li>Linearly separable or need probabilities? → <b>Logistic Regression</b></li>
                  <li>Large dataset, accuracy matters most? → <b>XGBoost / LightGBM</b></li>
                  <li>Need robust baseline fast? → <b>Random Forest</b></li>
                  <li>Text / NLP? → <b>Logistic + TF-IDF</b>, or Transformer</li>
                  <li>Images? → <b>CNN</b> (pretrained ResNet/EfficientNet)</li>
                  <li>Sequences / time series? → <b>LSTM</b> or Transformer</li>
                </ul>
              </div>
            </div>
          </>)}

          {subhead("Quick Comparison Table")}
          {tbl(<>
            <thead>
              <tr>
                {th("Model")}{th("Training Speed")}{th("Prediction Speed")}
                {th("Interpretability")}{th("Handles Missing")}{th("Needs Scaling")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Linear / Logistic")}{td("⚡⚡⚡")}{td("⚡⚡⚡")}
                {td("⭐⭐⭐")}{td("No")}{td(<span style={{color:"#dc2626",fontWeight:700}}>Yes</span>)}
              </tr>
              <tr>
                {td("Decision Tree")}{td("⚡⚡")}{td("⚡⚡⚡")}
                {td("⭐⭐")}{td("No")}{td("No")}
              </tr>
              <tr>
                {td("Random Forest")}{td("⚡⚡")}{td("⚡⚡")}
                {td("⭐")}{td("No")}{td("No")}
              </tr>
              <tr>
                {td("XGBoost")}{td("⚡⚡")}{td("⚡⚡")}
                {td("⭐")}{td(<span style={{color:"#059669",fontWeight:700}}>Yes</span>)}{td("No")}
              </tr>
              <tr>
                {td("SVM")}{td("⚡")}{td("⚡")}
                {td("⭐")}{td("No")}{td(<span style={{color:"#dc2626",fontWeight:700}}>YES</span>)}
              </tr>
              <tr>
                {td("KNN")}{td("⚡⚡⚡ (train)")}{td("⚡ (predict)")}
                {td("⭐⭐")}{td("No")}{td(<span style={{color:"#dc2626",fontWeight:700}}>Yes</span>)}
              </tr>
              <tr>
                {td("Neural Network")}{td("⚡")}{td("⚡⚡")}
                {td("✗")}{td("Yes (with layer)")}{td(<span style={{color:"#dc2626",fontWeight:700}}>Yes</span>)}
              </tr>
            </tbody>
          </>)}

          <Note>
            The "no free lunch" theorem: no single algorithm performs best across all datasets.
            The practical implication: <b>always benchmark multiple models</b>. Start simple
            (logistic regression, random forest baseline) and only add complexity if it improves
            validation performance. Complexity has real costs: interpretability, debugging,
            maintenance, and inference latency.
          </Note>
        </>
      ),
    },

    // ─── STAGE 13 ──────────────────────────────────────────────────────────────
    {
      id: "training",
      group: "Training",
      title: "Step 9 · Model Training & Diagnosing Fit",
      why: "Training is where parameters are fitted — the key challenge is finding the sweet spot between underfitting and overfitting.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Training is fitting model parameters to minimize a loss function on the training data.
            The key challenge: finding the sweet spot between <b>underfitting</b> (model too simple
            to learn the pattern) and <b>overfitting</b> (model memorizes training noise
            and fails to generalize).
          </Lead>

          {subhead("The Bias-Variance Trade-off")}
          <div style={{ overflowX:"auto", marginBottom:14 }}>
            <svg viewBox="0 0 560 160" style={{ width:"100%", maxWidth:560, height:"auto",
              display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              <defs>
                <marker id="ax" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="var(--muted)" />
                </marker>
              </defs>
              {/* X axis */}
              <line x1={40} y1={125} x2={520} y2={125} stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#ax)"/>
              <text x={280} y={148} textAnchor="middle" fontSize="11" fill="var(--muted)">Model Complexity →</text>

              {/* Y axis */}
              <line x1={40} y1={125} x2={40} y2={18} stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#ax)"/>
              <text x={14} y={72} textAnchor="middle" fontSize="10" fill="var(--muted)"
                transform="rotate(-90,14,72)">Error →</text>

              {/* Training error curve (decreases smoothly) */}
              <path d="M 60,108 C 120,80 200,46 400,28 L 510,24"
                fill="none" stroke="#2B5BFF" strokeWidth="2.2" strokeDasharray="none"/>
              <text x={440} y={22} fontSize="10" fill="#2B5BFF" fontWeight="700">Train error</text>

              {/* Validation error curve (U-shape) */}
              <path d="M 60,110 C 140,72 220,46 290,44 C 360,44 420,58 510,95"
                fill="none" stroke="#e05c2e" strokeWidth="2.2"/>
              <text x={450} y={98} fontSize="10" fill="#e05c2e" fontWeight="700">Val error</text>

              {/* Sweet spot marker */}
              <line x1={290} y1={30} x2={290} y2={120} stroke="#059669" strokeWidth="1.5" strokeDasharray="5 3"/>
              <text x={293} y={40} fontSize="9.5" fill="#059669" fontWeight="700">Sweet spot</text>

              {/* Region labels */}
              <text x={80} y={100} fontSize="9.5" fill="#7c3aed" fontWeight="700">Underfitting</text>
              <text x={80} y={112} fontSize="9" fill="#7c3aed">(high bias)</text>
              <text x={380} y={68} fontSize="9.5" fill="#dc2626" fontWeight="700">Overfitting</text>
              <text x={378} y={79} fontSize="9" fill="#dc2626">(high variance)</text>
            </svg>
          </div>

          {subhead("Learning Curves — How to Read Them")}
          {tbl(<>
            <thead>
              <tr>{th("Pattern")}{th("Diagnosis")}{th("Fix")}</tr>
            </thead>
            <tbody>
              <tr>
                {td("Both train and val loss are high and converge")}
                {td("Underfitting — model too simple")}
                {td("Add features, reduce regularization, try more complex model")}
              </tr>
              <tr>
                {td("Train loss low, val loss high, gap not closing with more data")}
                {td("Overfitting — model memorizes training noise")}
                {td("Add regularization, more data, dropout, early stopping")}
              </tr>
              <tr>
                {td("Both losses decreasing as you add more data")}
                {td("Good — data-limited, not model-limited")}
                {td("Just get more data; the model is learning correctly")}
              </tr>
            </tbody>
          </>)}

          {subhead("Overfitting Fixes by Model Type")}
          {tbl(<>
            <thead>
              <tr>{th("Fix")}{th("Applies To")}</tr>
            </thead>
            <tbody>
              <tr>{td("More training data")}{td("All models")}</tr>
              <tr>{td("Regularization (L1 / L2)")}{td("Linear models, neural networks")}</tr>
              <tr>{td("Dropout")}{td("Neural networks")}</tr>
              <tr>{td("Reduce max_depth")}{td("Decision trees, XGBoost")}</tr>
              <tr>{td("Increase min_samples_leaf")}{td("Decision trees, Random Forest")}</tr>
              <tr>{td("Early stopping")}{td("Gradient boosting, neural networks")}</tr>
              <tr>{td("Cross-validation to select hyperparameters")}{td("All models")}</tr>
            </tbody>
          </>)}

          <Note>
            The training loss reported during fitting is <b>not</b> your model's real performance.
            Always evaluate on a held-out validation set. A model with 99% training accuracy
            and 60% validation accuracy is severely overfit.
          </Note>
        </>
      ),
    },

    // ─── STAGE 14 ──────────────────────────────────────────────────────────────
    {
      id: "eval-reg",
      group: "Evaluation",
      title: "Step 10a · Evaluation — Regression Metrics",
      why: "For regression, the right metric depends on error tolerance — are large errors catastrophically worse?",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            For regression, evaluation measures how close predictions are to actual values.
            The right metric depends on your error tolerance: are large errors catastrophically
            worse, or is every miss equally bad?
          </Lead>

          {info(<>
            <b>Running example throughout:</b> House price prediction.
            True values: [200k, 250k, 300k, 150k].
            Predicted: [210k, 230k, 350k, 145k].
          </>)}

          {subhead("MAE — Mean Absolute Error")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Formula:</b> (1/n) Σ|yᵢ − ŷᵢ|
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
              <b>Calculation:</b> (|200−210| + |250−230| + |300−350| + |150−145|) / 4
              = (10 + 20 + 50 + 5) / 4 = <b>$21,250</b>
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
              <b>Interpretation:</b> On average, predictions are $21,250 off.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
              <b>When to use:</b> When all error sizes are equally bad (linear penalty).
              When outliers exist in the target. Retail demand forecasting, energy consumption,
              any domain where big misses aren't exponentially worse.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"#d97706" }}>
              <b>Limitation:</b> Less sensitive to catastrophic misses — a 10× error is only
              penalized 10× rather than 100×.
            </p>
          </>)}

          {subhead("MSE — Mean Squared Error")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Formula:</b> (1/n) Σ(yᵢ − ŷᵢ)²
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
              <b>Calculation:</b> (10² + 20² + 50² + 5²) / 4 = (100 + 400 + 2500 + 25) / 4
              = 756.25 (in millions of $²)
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"#d97706" }}>
              <b>Problem:</b> Units are squared (million $²) — not interpretable to stakeholders.
              Used internally as a loss function because it is differentiable and smooth.
            </p>
          </>)}

          {subhead("RMSE — Root Mean Squared Error")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Formula:</b> √MSE = √756.25M ≈ <b>$27,500</b>
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
              <b>Interpretation:</b> Typical error is $27,500 — higher than MAE because
              large errors are penalized quadratically. Note RMSE ≥ MAE always. The larger
              the RMSE/MAE gap, the more large errors are present.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
              <b>When to use:</b> When large errors are catastrophically worse than small ones.
              Safety-critical systems (autonomous vehicles, medical dosing), financial
              forecasting where a 2× miss is much worse than a 1.1× miss.
            </p>
          </>)}

          {subhead("MAPE — Mean Absolute Percentage Error")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Formula:</b> (1/n) Σ|yᵢ − ŷᵢ| / yᵢ × 100%
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
              <b>Calculation:</b> (10/200 + 20/250 + 50/300 + 5/150) / 4 × 100%
              = (5% + 8% + 16.7% + 3.3%) / 4 = <b>8.25%</b>
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
              <b>When to use:</b> For stakeholder communication (percentages are universally
              understood). When comparing across datasets with different scales
              (e.g., forecasting both $10 and $10,000 items).
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"#d97706" }}>
              <b>Limitation:</b> Fails when true values are near zero (division by zero).
              Asymmetric — overestimates penalize less than underestimates of the same size.
            </p>
          </>)}

          {subhead("R² — Coefficient of Determination")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Formula:</b> 1 − SS_res/SS_tot, where SS_res = Σ(yᵢ−ŷᵢ)², SS_tot = Σ(yᵢ−ȳ)²
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"var(--ink)" }}>
              <b>Interpretation:</b> Fraction of variance explained by the model.
              R² = 0.8 means the model explains 80% of the variance in house prices.
              R² = 1.0 = perfect. R² = 0.0 = model does no better than predicting the mean.
              R² &lt; 0 = model is worse than predicting the mean.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"#d97706" }}>
              <b>When NOT to use:</b> R² always increases when you add features — use
              Adjusted R² for multi-feature model comparison.
            </p>
          </>)}

          {subhead("Which Metric for Which Scenario")}
          {tbl(<>
            <thead>
              <tr>{th("Scenario")}{th("Best Metric")}</tr>
            </thead>
            <tbody>
              <tr>{td("Outliers in target variable")}{td("MAE (robust to large errors)")}</tr>
              <tr>{td("Large errors are catastrophically bad")}{td("RMSE (penalizes big misses)")}</tr>
              <tr>{td("Stakeholder reporting / communication")}{td("MAPE (percentage is universal)")}</tr>
              <tr>{td("Comparing models on same dataset")}{td("R² or RMSE")}</tr>
              <tr>{td("Loss function for gradient descent")}{td("MSE (differentiable, smooth)")}</tr>
            </tbody>
          </>)}
        </>
      ),
    },

    // ─── STAGE 15 ──────────────────────────────────────────────────────────────
    {
      id: "eval-cls",
      group: "Evaluation",
      title: "Step 10b · Evaluation — Classification Metrics",
      why: "Accuracy is often the wrong metric — the right one depends on the cost of false positives vs false negatives.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Classification metrics measure more than just "how often is the model right?".
            <b> Accuracy is often the wrong metric</b> — a model that predicts "not cancer"
            for every patient achieves 99% accuracy while being completely useless.
            The right metric depends on the cost of false positives vs false negatives.
          </Lead>

          {subhead("The Confusion Matrix")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 12px", color:"var(--ink)" }}>
              <b>Example:</b> Spam detection. 100 emails: 20 spam, 80 not spam.
            </p>
            <div style={{ overflowX:"auto" }}>
              <table style={{ borderCollapse:"collapse", fontSize:13, margin:"0 auto" }}>
                <thead>
                  <tr>
                    <th style={{ border:"1px solid var(--line)", padding:"8px 14px", background:"var(--panel-solid)" }}></th>
                    <th style={{ border:"1px solid var(--line)", padding:"8px 14px", background:"var(--panel-solid)",
                      textAlign:"center", fontWeight:700 }}>Predicted: Spam</th>
                    <th style={{ border:"1px solid var(--line)", padding:"8px 14px", background:"var(--panel-solid)",
                      textAlign:"center", fontWeight:700 }}>Predicted: Not Spam</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border:"1px solid var(--line)", padding:"10px 14px", fontWeight:700 }}>Actual: Spam</td>
                    <td style={{ border:"1px solid var(--line)", padding:"10px 14px", textAlign:"center",
                      background:"rgba(5,150,105,.15)", fontWeight:700, color:"#059669" }}>
                      TP = 15<br/><span style={{fontSize:10,fontWeight:400}}>Caught spam</span>
                    </td>
                    <td style={{ border:"1px solid var(--line)", padding:"10px 14px", textAlign:"center",
                      background:"rgba(220,38,38,.12)", fontWeight:700, color:"#dc2626" }}>
                      FN = 5<br/><span style={{fontSize:10,fontWeight:400}}>Missed spam</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border:"1px solid var(--line)", padding:"10px 14px", fontWeight:700 }}>Actual: Not Spam</td>
                    <td style={{ border:"1px solid var(--line)", padding:"10px 14px", textAlign:"center",
                      background:"rgba(220,38,38,.12)", fontWeight:700, color:"#dc2626" }}>
                      FP = 3<br/><span style={{fontSize:10,fontWeight:400}}>Flagged legit</span>
                    </td>
                    <td style={{ border:"1px solid var(--line)", padding:"10px 14px", textAlign:"center",
                      background:"rgba(5,150,105,.15)", fontWeight:700, color:"#059669" }}>
                      TN = 77<br/><span style={{fontSize:10,fontWeight:400}}>Correctly cleared</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>)}

          {subhead("All Metrics with Formulas and Examples")}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>Accuracy</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Formula:</b> (TP + TN) / (TP + TN + FP + FN) = (15 + 77) / 100 = <b>92%</b>
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"4px 0 0", color:"#d97706" }}>
              <b>When to use:</b> Only when classes are balanced and FP/FN costs are equal.
              Avoid for imbalanced problems.
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>Precision</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Formula:</b> TP / (TP + FP) = 15 / (15 + 3) = <b>83.3%</b>
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"4px 0 0", color:"var(--ink)" }}>
              <b>Interpretation:</b> "Of emails I flagged as spam, 83.3% actually were."
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"4px 0 0", color:"var(--ink)" }}>
              <b>When to use:</b> When false positives are costly. Spam filter (marking legit email
              as spam is bad), drug testing (accusing innocent people).
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>Recall / Sensitivity / True Positive Rate</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Formula:</b> TP / (TP + FN) = 15 / (15 + 5) = <b>75%</b>
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"4px 0 0", color:"var(--ink)" }}>
              <b>Interpretation:</b> "Of all actual spam, I caught 75%."
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"4px 0 0", color:"var(--ink)" }}>
              <b>When to use:</b> When false negatives are costly. Cancer screening (missing
              cancer is worse than extra biopsy), fraud detection (missing fraud is worse than
              blocking a legitimate transaction).
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>F1 Score</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Formula:</b> 2 × (Precision × Recall) / (Precision + Recall)
              = 2 × (0.833 × 0.75) / (0.833 + 0.75) = <b>78.9%</b>
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"4px 0 0", color:"var(--ink)" }}>
              Harmonic mean — penalizes extreme imbalance between precision and recall.
              A model with P=1.0 and R=0.01 has F1=0.02, not 0.505.
              <b> Default metric for imbalanced classification.</b>
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>F-Beta Score</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              <b>Formula:</b> Fβ = (1 + β²) × (P × R) / (β²×P + R)
            </p>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:"6px 0 0", paddingLeft:20, color:"var(--ink)" }}>
              <li>β &gt; 1: weights recall more — use when FN is more costly (medical diagnosis)</li>
              <li>β &lt; 1: weights precision more — use when FP is more costly (spam filter)</li>
              <li>β = 1: standard F1 (equal weight)</li>
            </ul>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>ROC-AUC</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Area under the Receiver Operating Characteristic curve (TPR vs FPR at all thresholds).
              AUC = 0.5 means random guessing. AUC = 1.0 means perfect.
              Threshold-independent — evaluates the model across all operating points.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"4px 0 0", color:"#d97706" }}>
              <b>Limitation:</b> Can be misleadingly high for imbalanced datasets — a model
              can score ROC-AUC = 0.99 while still missing most positives.
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>PR-AUC (Precision-Recall AUC)</div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Area under the precision-recall curve. On highly imbalanced datasets (fraud,
              disease detection), PR-AUC is more informative than ROC-AUC. A model with
              ROC-AUC = 0.99 can have PR-AUC = 0.10 if it misses most positives.
            </p>
          </>)}

          {subhead("Cost Matrix — Real-World Framing")}
          {tbl(<>
            <thead>
              <tr>{th("Scenario")}{th("More Costly Mistake")}{th("Prioritize")}</tr>
            </thead>
            <tbody>
              <tr>{td("Cancer screening")}{td("FN (miss cancer)")}{td("Recall (catch everything)")}</tr>
              <tr>{td("Spam filter")}{td("FP (block legit email)")}{td("Precision")}</tr>
              <tr>{td("Fraud detection")}{td("FN (miss fraud)")}{td("Recall or PR-AUC")}</tr>
              <tr>{td("Content moderation")}{td("Context-dependent")}{td("F1 or PR-AUC")}</tr>
              <tr>{td("Face ID unlock")}{td("FP (wrong person unlocks)")}{td("Precision (very high)")}</tr>
            </tbody>
          </>)}
        </>
      ),
    },

    // ─── STAGE 16 ──────────────────────────────────────────────────────────────
    {
      id: "hparam-tune",
      group: "Evaluation",
      title: "Step 11 · Hyperparameter Tuning",
      why: "Hyperparameters are not learned during training — they must be set before training and tuned on validation data.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Hyperparameters are not learned during training — they must be set before training.
            Tuning them systematically on the validation set (never the test set!) unlocks
            the remaining performance headroom after you've selected a model.
          </Lead>

          {subhead("Strategy 1: Grid Search")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Try every combination of specified values.
              <code> param_grid = {'{'}'C': [0.1, 1, 10], 'gamma': [0.01, 0.1, 1]{'}'}</code>
              → 3×3 = 9 combinations × 5-fold CV = <b>45 model fits</b>.
            </p>
            <div style={{ display:"flex", gap:14, marginTop:10 }}>
              {card(<>
                <div style={{ fontWeight:700, fontSize:12, color:"#059669", marginBottom:4 }}>Pros</div>
                <ul style={{ fontSize:12, lineHeight:1.8, margin:0, paddingLeft:18, color:"var(--ink)" }}>
                  <li>Guaranteed to find best in grid</li>
                  <li>Reproducible results</li>
                  <li>Simple to implement</li>
                </ul>
              </>, { flex:"1 1 140px", padding:"10px 14px" })}
              {card(<>
                <div style={{ fontWeight:700, fontSize:12, color:"#dc2626", marginBottom:4 }}>Cons</div>
                <ul style={{ fontSize:12, lineHeight:1.8, margin:0, paddingLeft:18, color:"var(--ink)" }}>
                  <li>Exponentially scales with # params</li>
                  <li>5 params × 5 values = 3,125 fits</li>
                  <li>Inefficient — searches unimportant regions equally</li>
                </ul>
              </>, { flex:"1 1 140px", padding:"10px 14px" })}
            </div>
            <p style={{ fontSize:12, lineHeight:1.7, margin:"8px 0 0", color:"var(--muted)" }}>
              <b>When to use:</b> ≤ 3 hyperparameters with a small, well-defined grid.
            </p>
          </>)}

          {subhead("Strategy 2: Random Search")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Sample n combinations randomly from specified distributions rather than
              testing every combination exhaustively.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"8px 0 0", color:"var(--ink)" }}>
              <b>Key insight (Bergstra & Bengio, 2012):</b> "Random search finds good
              hyperparameters faster than grid search because hyperparameter importance
              is uneven — most models are sensitive to 1–2 params but not all of them.
              Random search explores a wider range of the important parameters."
            </p>
            <p style={{ fontSize:12, lineHeight:1.7, margin:"8px 0 0", color:"var(--muted)" }}>
              <b>When to use:</b> ≥ 4 hyperparameters, or continuous ranges.
              Use n_iter = 20–50 as a starting point.
            </p>
          </>)}

          {subhead("Strategy 3: Bayesian Optimization (Optuna, Hyperopt)")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Uses past evaluations to intelligently decide which hyperparameter to try next.
              Builds a probabilistic surrogate model of the objective function (e.g., Gaussian
              Process or Tree Parzen Estimator). Concentrates trials in promising regions.
            </p>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:"8px 0 0", paddingLeft:20, color:"var(--ink)" }}>
              <li>3–5× more sample-efficient than random search</li>
              <li>Handles continuous, discrete, and conditional hyperparameters</li>
              <li>Libraries: <b>Optuna</b>, Hyperopt, Ax, BOHB</li>
            </ul>
            <p style={{ fontSize:12, lineHeight:1.7, margin:"8px 0 0", color:"var(--muted)" }}>
              <b>When to use:</b> When each evaluation is expensive (deep learning, slow models
              on large data). Worth the extra setup complexity.
            </p>
          </>)}

          {warn(<>
            Never tune on the test set. Use cross-validation on the training set (or a fixed
            validation split). Tuning on the test set means you're fitting hyperparameters
            to test data — reporting inflated scores that won't reproduce in production.
          </>)}

          {subhead("Optuna Example")}
          {codeBlock(
`import optuna
from sklearn.svm import SVC
from sklearn.model_selection import cross_val_score

def objective(trial):
    C     = trial.suggest_float("C",     1e-3, 1e2, log=True)
    gamma = trial.suggest_float("gamma", 1e-4, 1.0, log=True)
    model = SVC(C=C, gamma=gamma)
    return cross_val_score(model, X_train, y_train, cv=5).mean()

study = optuna.create_study(direction="maximize")
study.optimize(objective, n_trials=100)
print(study.best_params)
# {'C': 4.72, 'gamma': 0.013}`
          )}
        </>
      ),
    },

    // ─── STAGE 17 ──────────────────────────────────────────────────────────────
    {
      id: "pipeline",
      group: "Production",
      title: "Step 12 · ML Pipeline & Production Readiness",
      why: "A model that works in a notebook but fails in production is worth nothing — production adds concerns research ignores.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            A model that works in a notebook but fails in production is worth nothing.
            Production ML adds concerns that don't exist in research: data pipelines,
            model serving, data drift, training-serving skew, and system reliability.
          </Lead>

          {subhead("Why sklearn Pipeline Matters")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              The most common leakage bug: fitting preprocessing (scaler, imputer) on all data,
              then splitting. <b>sklearn Pipeline fixes this automatically</b> — it ensures
              fit() is called only on training data during cross-validation, not on the full dataset.
            </p>
          </>)}
          {codeBlock(
`from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.svm import SVC

pipe = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler',  StandardScaler()),
    ('model',   SVC(C=1.0, kernel='rbf'))
])

# Safe: fit_transform on train only, transform on test
pipe.fit(X_train, y_train)
pipe.predict(X_test)

# Also safe inside cross_val_score — no leakage
from sklearn.model_selection import cross_val_score
cross_val_score(pipe, X, y, cv=5)`
          )}

          {subhead("Real-World Production Failures")}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"#dc2626", marginBottom:6 }}>
              Case 1: Training-Serving Skew
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              A fraud detection system was trained with a 30-day lookback window. In production
              on January 5th, only 5 days of history were available for new accounts.
              40% of features were wrong — the model silently degraded for the first month
              of each year.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"#059669", fontWeight:600 }}>
              Fix: Test your feature logic at the START of your dataset where history is
              limited, not just in the middle where lookbacks are always available.
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"#dc2626", marginBottom:6 }}>
              Case 2: Concept Drift
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              A loan default model trained on pre-2020 data showed recall collapse from
              70% to 7.1% within months as user behavior shifted dramatically post-COVID.
              The model's assumptions about spending patterns were no longer valid.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"#059669", fontWeight:600 }}>
              Fix: Monitor prediction distributions continuously. Set up automated alerts
              when input feature distributions drift. Retrain when drift is detected.
            </p>
          </>)}

          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"#dc2626", marginBottom:6 }}>
              Case 3: Feature Not Available at Serving Time
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              A churn prediction model trained using <code>account_age_days</code> — which
              was always available in historical data. In production, brand-new accounts
              had NULL for this field. The model's imputed value (median=547 days) was wildly
              wrong for accounts that were 1 day old.
            </p>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"6px 0 0", color:"#059669", fontWeight:600 }}>
              Fix: Enforce a strict feature schema at training time that exactly mirrors
              the serving environment. Run integration tests that simulate serving conditions.
            </p>
          </>)}

          {subhead("Model Monitoring Checklist")}
          {tbl(<>
            <thead>
              <tr>{th("What to Monitor")}{th("How")}{th("Trigger Action When")}</tr>
            </thead>
            <tbody>
              <tr>
                {td("Prediction distribution")}
                {td("KS test vs training distribution")}
                {td("Shift > 5% from baseline")}
              </tr>
              <tr>
                {td("Feature distributions")}
                {td("Per-feature mean, std, missing rate")}
                {td("Mean/std drift > 2 standard deviations")}
              </tr>
              <tr>
                {td("Label distribution (if available)")}
                {td("Compare to training label ratio")}
                {td("Significant drift → trigger retraining")}
              </tr>
              <tr>
                {td("Prediction latency")}
                {td("P95 / P99 latency tracking")}
                {td("Exceeds SLA threshold")}
              </tr>
              <tr>
                {td("Model accuracy (when ground truth available)")}
                {td("Compare to baseline at deployment")}
                {td("Drops below minimum threshold")}
              </tr>
            </tbody>
          </>)}

          {subhead("The Correct Pipeline Order — Summary")}
          <Note>
            This answers the key question: <b>why does each step come where it does?</b>
          </Note>
          {tbl(<>
            <thead>
              <tr>{th("Step")}{th("Why This Order?")}</tr>
            </thead>
            <tbody>
              <tr>{td("1. Data Ingestion")}{td("Can't do anything without data; validates raw inputs")}</tr>
              <tr>{td("2. EDA — explore + clean")}{td("Understand data before transforming it; cleaning informs feature engineering")}</tr>
              <tr>{td("3. Feature Engineering")}{td("Create new features from raw data before splitting")}</tr>
              <tr>{td("4. Train / Test Split")}{td("Must split BEFORE fitting any preprocessing to prevent leakage")}</tr>
              <tr>{td("5. Feature Scaling (fit on train only)")}{td("After split so test statistics don't influence scaler parameters")}</tr>
              <tr>{td("6. Feature Selection (on train only)")}{td("After scaling; select from training patterns only")}</tr>
              <tr>{td("7. Model Selection")}{td("Choose candidates based on data type and constraints")}</tr>
              <tr>{td("8. Model Training")}{td("Fit model parameters on training data only")}</tr>
              <tr>{td("9. Evaluation (on validation)")}{td("Measure honest performance on held-out validation data")}</tr>
              <tr>{td("10. Hyperparameter Tuning (CV on train)")}{td("Optimize based on validation; never peek at test set")}</tr>
              <tr>{td("11. Final Evaluation (test set, once)")}{td("Report honest generalization performance — done exactly once")}</tr>
              <tr>{td("12. Deployment + Monitoring")}{td("Ongoing; watch for drift and serving skew")}</tr>
            </tbody>
          </>)}
        </>
      ),
    },

  ]; // end STAGES

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title:       "ML Model Lifecycle",
    subtitle:    "End-to-end pipeline from raw data to production",
    cur:         "ML Lifecycle",
    category:    "ML Fundamentals",
    run:         () => ({}),
    default:     {},
    renderInput: null,
    modeLinks:   [],
  };
})();
