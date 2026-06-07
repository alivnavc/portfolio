/* ============================================================
   Bias-Variance Tradeoff — stages-bias-variance.jsx (12 stages)
   Educational article — no sliders, no renderInput
   ============================================================ */
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

  const th = (s, extra) => (
    <th style={{ background:"var(--panel-solid)", border:"1px solid var(--line)",
      padding:"7px 11px", textAlign:"left", fontWeight:700,
      fontSize:12, color:"var(--muted)", ...(extra || {}) }}>{s}</th>
  );

  const td = (s, extra) => (
    <td style={{ border:"1px solid var(--line)", padding:"7px 11px",
      fontSize:12, color:"var(--ink)", verticalAlign:"top", ...(extra || {}) }}>{s}</td>
  );

  const codeBlock = (code) => (
    <pre style={{ background:"#f5f5f5", padding:"12px 16px", borderRadius:8,
      fontSize:12, overflowX:"auto", fontFamily:"monospace", lineHeight:1.6,
      margin:"10px 0", border:"1px solid #e0e0e0" }}>
      <code>{code}</code>
    </pre>
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

    // ─── STAGE 1: Overview ────────────────────────────────────────────────────
    {
      id: "overview",
      group: "Overview",
      title: "Bias and Variance — The Two Ways a Model Fails",
      map: "Overview",
      why: "Every model failure is either underfitting (high bias) or overfitting (high variance). Understanding which one you have determines the fix.",
      render: () => (
        <>
          <Lead>
            A model can fail in exactly two fundamental ways: it can be too simple to learn
            the pattern (<b>high bias / underfitting</b>), or too complex and it memorizes
            training noise instead of the pattern (<b>high variance / overfitting</b>).
            The bias-variance tradeoff is the central tension in all of machine learning.
          </Lead>

          {subhead("The Archer Analogy")}
          <p style={{ fontSize:13, lineHeight:1.7, color:"var(--ink)", marginBottom:10 }}>
            Four dartboards show every combination of bias and variance. Tight clusters mean
            low variance; hitting center means low bias.
          </p>
          <div style={{ overflowX:"auto", marginBottom:18 }}>
            <svg viewBox="0 0 340 340" style={{ width:"100%", maxWidth:340, height:"auto", display:"block" }}>
              {/* Board 1: Low Bias Low Variance — top-left */}
              <g transform="translate(10,10)">
                <circle cx="70" cy="70" r="60" fill="none" stroke="#ccc" strokeWidth="1" />
                <circle cx="70" cy="70" r="40" fill="none" stroke="#ccc" strokeWidth="1" />
                <circle cx="70" cy="70" r="20" fill="none" stroke="#e55" strokeWidth="1.5" />
                <circle cx="70" cy="70" r="6" fill="#e55" />
                <circle cx="67" cy="68" r="4" fill="#2B5BFF" opacity="0.85" />
                <circle cx="73" cy="72" r="4" fill="#2B5BFF" opacity="0.85" />
                <circle cx="69" cy="74" r="4" fill="#2B5BFF" opacity="0.85" />
                <circle cx="72" cy="66" r="4" fill="#2B5BFF" opacity="0.85" />
                <circle cx="66" cy="71" r="4" fill="#2B5BFF" opacity="0.85" />
                <text x="70" y="145" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f9e6b">Low Bias, Low Variance</text>
                <text x="70" y="158" textAnchor="middle" fontSize="10" fill="var(--muted)">Perfect model</text>
              </g>
              {/* Board 2: High Bias Low Variance — top-right */}
              <g transform="translate(180,10)">
                <circle cx="70" cy="70" r="60" fill="none" stroke="#ccc" strokeWidth="1" />
                <circle cx="70" cy="70" r="40" fill="none" stroke="#ccc" strokeWidth="1" />
                <circle cx="70" cy="70" r="20" fill="none" stroke="#e55" strokeWidth="1.5" />
                <circle cx="70" cy="70" r="6" fill="#e55" />
                <circle cx="42" cy="42" r="4" fill="#e0492e" opacity="0.85" />
                <circle cx="47" cy="38" r="4" fill="#e0492e" opacity="0.85" />
                <circle cx="44" cy="46" r="4" fill="#e0492e" opacity="0.85" />
                <circle cx="50" cy="43" r="4" fill="#e0492e" opacity="0.85" />
                <circle cx="46" cy="49" r="4" fill="#e0492e" opacity="0.85" />
                <text x="70" y="145" textAnchor="middle" fontSize="11" fontWeight="700" fill="#e0492e">High Bias, Low Variance</text>
                <text x="70" y="158" textAnchor="middle" fontSize="10" fill="var(--muted)">Consistently wrong</text>
              </g>
              {/* Board 3: Low Bias High Variance — bottom-left */}
              <g transform="translate(10,180)">
                <circle cx="70" cy="70" r="60" fill="none" stroke="#ccc" strokeWidth="1" />
                <circle cx="70" cy="70" r="40" fill="none" stroke="#ccc" strokeWidth="1" />
                <circle cx="70" cy="70" r="20" fill="none" stroke="#e55" strokeWidth="1.5" />
                <circle cx="70" cy="70" r="6" fill="#e55" />
                <circle cx="50" cy="40" r="4" fill="#7c5cff" opacity="0.85" />
                <circle cx="95" cy="60" r="4" fill="#7c5cff" opacity="0.85" />
                <circle cx="40" cy="85" r="4" fill="#7c5cff" opacity="0.85" />
                <circle cx="85" cy="100" r="4" fill="#7c5cff" opacity="0.85" />
                <circle cx="60" cy="95" r="4" fill="#7c5cff" opacity="0.85" />
                <text x="70" y="145" textAnchor="middle" fontSize="11" fontWeight="700" fill="#7c5cff">Low Bias, High Variance</text>
                <text x="70" y="158" textAnchor="middle" fontSize="10" fill="var(--muted)">Right on average, unpredictable</text>
              </g>
              {/* Board 4: High Bias High Variance — bottom-right */}
              <g transform="translate(180,180)">
                <circle cx="70" cy="70" r="60" fill="none" stroke="#ccc" strokeWidth="1" />
                <circle cx="70" cy="70" r="40" fill="none" stroke="#ccc" strokeWidth="1" />
                <circle cx="70" cy="70" r="20" fill="none" stroke="#e55" strokeWidth="1.5" />
                <circle cx="70" cy="70" r="6" fill="#e55" />
                <circle cx="30" cy="30" r="4" fill="#94A2BC" opacity="0.85" />
                <circle cx="110" cy="25" r="4" fill="#94A2BC" opacity="0.85" />
                <circle cx="25" cy="105" r="4" fill="#94A2BC" opacity="0.85" />
                <circle cx="105" cy="115" r="4" fill="#94A2BC" opacity="0.85" />
                <circle cx="55" cy="35" r="4" fill="#94A2BC" opacity="0.85" />
                <text x="70" y="145" textAnchor="middle" fontSize="11" fontWeight="700" fill="#94A2BC">High Bias, High Variance</text>
                <text x="70" y="158" textAnchor="middle" fontSize="10" fill="var(--muted)">Worst case</text>
              </g>
            </svg>
          </div>

          {subhead("The Mathematical Decomposition")}
          {card(
            <div style={{ fontSize:14, lineHeight:2.0 }}>
              <div style={{ textAlign:"center", fontFamily:"monospace", fontSize:15, marginBottom:14, letterSpacing:1 }}>
                <span style={{ color:"#2B5BFF", fontWeight:700 }}>Expected MSE</span>
                {" = "}
                <span style={{ color:"#e0492e", fontWeight:700 }}>Bias²</span>
                {" + "}
                <span style={{ color:"#7c5cff", fontWeight:700 }}>Variance</span>
                {" + "}
                <span style={{ color:"#94A2BC", fontWeight:700 }}>Irreducible Noise</span>
              </div>
              <ul style={{ fontSize:13, lineHeight:1.9, paddingLeft:22, color:"var(--ink)" }}>
                <li><b style={{ color:"#e0492e" }}>Bias²</b> — how far the model's average prediction is from the true value</li>
                <li><b style={{ color:"#7c5cff" }}>Variance</b> — how much predictions vary across different training sets</li>
                <li><b style={{ color:"#94A2BC" }}>Irreducible noise</b> — randomness in the data that no model can capture</li>
              </ul>
            </div>
          )}

          <Note>
            <b>Key insight:</b> You cannot minimize both bias and variance simultaneously.
            Reducing bias (making the model more complex) increases variance. Reducing variance
            (making the model simpler) increases bias. The art of ML is finding the sweet spot.
          </Note>
        </>
      )
    },

    // ─── STAGE 2: Bias ────────────────────────────────────────────────────────
    {
      id: "bias",
      group: "Concepts",
      title: "What is Bias — Systematic Error",
      map: "Bias",
      why: "Bias is not about fairness here — it's about systematic prediction error that no amount of more data can fix.",
      render: () => (
        <>
          <Lead>
            Bias is the <b>systematic error</b> in a model's predictions — the error that
            remains even if you train on infinitely more data. A biased model has fundamentally
            wrong assumptions about the data-generating process.
          </Lead>

          {subhead("Formal Definition")}
          {card(
            <div style={{ fontFamily:"monospace", fontSize:14, textAlign:"center", padding:"8px 0" }}>
              <b>Bias</b> = E[ŷ] − y*
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:6, fontFamily:"inherit", fontWeight:400 }}>
                difference between expected prediction and true value, averaged over all possible training sets
              </div>
            </div>
          )}

          <p style={{ fontSize:13, lineHeight:1.7, color:"var(--ink)" }}>
            Imagine fitting a straight line to data that has a U-shape curve. No matter how much
            data you have, the straight line can never capture the curve. The model is
            systematically wrong — that's bias.
          </p>

          {subhead("SVG: A Linear Model on Non-Linear Data")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 420 260" style={{ width:"100%", maxWidth:420, height:"auto", display:"block" }}>
              <defs>
                <marker id="arr-bv" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>
              {/* axes */}
              <line x1="50" y1="220" x2="400" y2="220" stroke="var(--ink)" strokeWidth="1.4" markerEnd="url(#arr-bv)" />
              <line x1="50" y1="220" x2="50" y2="20" stroke="var(--ink)" strokeWidth="1.4" markerEnd="url(#arr-bv)" />
              <text x="220" y="245" textAnchor="middle" fontSize="11" fill="var(--muted)">x</text>
              <text x="18" y="120" textAnchor="middle" fontSize="11" fill="var(--muted)" transform="rotate(-90,18,120)">y</text>
              {/* parabola scatter points (y = x^2 + noise, x from -3 to 3, mapped) */}
              {[
                [60,210],[80,195],[100,175],[115,160],[130,150],[150,145],[170,148],[190,155],
                [210,165],[230,178],[250,163],[270,158],[290,165],[310,178],[330,195],[350,215],[375,205]
              ].map(([cx,cy],i) => (
                <circle key={i} cx={cx} cy={cy} r="4.5" fill="#2B5BFF" opacity="0.75" stroke="white" strokeWidth="1" />
              ))}
              {/* straight line fit — goes through the middle, misses the curve */}
              <line x1="55" y1="195" x2="390" y2="160" stroke="#e0492e" strokeWidth="2.5" strokeDasharray="6 3" />
              {/* bias arrows at the extremes */}
              <line x1="65" y1="208" x2="65" y2="194" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arr-bv)" />
              <line x1="370" y1="205" x2="370" y2="163" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arr-bv)" />
              <text x="62" y="183" fontSize="9" fill="#f59e0b" textAnchor="middle">gap</text>
              <text x="380" y="183" fontSize="9" fill="#f59e0b" textAnchor="start">gap</text>
              <text x="215" y="140" fontSize="10" fontWeight="700" fill="#e0492e" textAnchor="middle">Linear fit (high bias)</text>
              <text x="215" y="38" fontSize="10" fill="var(--muted)" textAnchor="middle">Bias: the line is ALWAYS wrong at the extremes — more data won't help</text>
            </svg>
          </div>

          {subhead("Examples of High-Bias Models")}
          {tbl(
            <>
              <thead>
                <tr>
                  {th("Model")}{th("Bias assumption")}{th("When it breaks")}
                </tr>
              </thead>
              <tbody>
                <tr>{td("Linear regression")}{td("Relationship is linear")}{td("Any non-linear pattern")}</tr>
                <tr>{td("Logistic regression")}{td("Decision boundary is linear")}{td("XOR, concentric circles")}</tr>
                <tr>{td("Decision tree (depth=1)")}{td("One split decides everything")}{td("Multi-feature interactions")}</tr>
                <tr>{td("Naive Bayes")}{td("Features are independent")}{td("Any correlated features")}</tr>
              </tbody>
            </>
          )}

          {subhead("Symptoms of High Bias")}
          <ul style={{ fontSize:13, lineHeight:1.9, paddingLeft:22, color:"var(--ink)" }}>
            <li>Training accuracy is <b>LOW</b> — the model can't even fit the training data</li>
            <li>Adding more training data doesn't improve validation accuracy</li>
            <li>Learning curve: both training and validation loss are high and converge close together</li>
          </ul>

          {info(<span><b>The ceiling:</b> High-bias models have a performance ceiling. No regularization,
            no more data, no hyperparameter tuning will push them past it.
            The only fix is a more expressive model.</span>)}
        </>
      )
    },

    // ─── STAGE 3: Variance ───────────────────────────────────────────────────
    {
      id: "variance",
      group: "Concepts",
      title: "What is Variance — Sensitivity to Training Data",
      map: "Variance",
      why: "Variance is why a model that scores 99% on training data may score 60% on new data.",
      render: () => (
        <>
          <Lead>
            Variance is how much a model's predictions change when trained on different samples
            of data. A high-variance model is extremely sensitive to which specific examples
            happen to be in the training set — it memorizes quirks of the training data
            instead of learning the underlying pattern.
          </Lead>

          {subhead("Formal Definition")}
          {card(
            <div style={{ fontFamily:"monospace", fontSize:14, textAlign:"center", padding:"8px 0" }}>
              <b>Variance</b> = E[(ŷ − E[ŷ])²]
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:6, fontFamily:"inherit", fontWeight:400 }}>
                spread of predictions across different training sets
              </div>
            </div>
          )}

          <p style={{ fontSize:13, lineHeight:1.7, color:"var(--ink)" }}>
            Imagine training a degree-15 polynomial on 20 data points. The polynomial perfectly
            fits all 20 points. Now train it on 20 slightly different data points. The curve looks
            completely different — it has memorized the noise, not the signal. That's variance.
          </p>

          {subhead("Three Datasets, Three Very Different Fits")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 520 230" style={{ width:"100%", maxWidth:520, height:"auto", display:"block" }}>
              {/* Three mini scatter plots side by side */}
              {[0, 170, 340].map((offsetX, idx) => {
                const colors = ["#e0492e","#1f9e6b","#7c5cff"];
                const pts = [
                  [[20,80],[35,50],[50,70],[65,45],[80,55],[95,75],[110,40]],
                  [[20,60],[35,75],[50,45],[65,65],[80,50],[95,80],[110,55]],
                  [[20,70],[35,55],[50,80],[65,50],[80,65],[95,45],[110,70]]
                ];
                const curves = [
                  "M20,80 C28,30 42,100 57,40 S80,70 95,30 S105,60 115,35",
                  "M20,60 C28,90 42,30 57,75 S80,40 95,85 S105,45 115,60",
                  "M20,70 C28,40 42,90 57,45 S80,75 95,35 S105,80 115,55"
                ];
                return (
                  <g key={idx} transform={"translate(" + offsetX + ",20)"}>
                    <rect x="8" y="5" width="145" height="115" rx="6" fill="rgba(0,0,0,0.03)" stroke="#ddd" strokeWidth="1" />
                    <text x="78" y="140" textAnchor="middle" fontSize="10" fontWeight="700" fill={colors[idx]}>{"Dataset " + (idx+1)}</text>
                    {pts[idx].map(([cx,cy], i) => (
                      <circle key={i} cx={cx+8} cy={cy+5} r="3.5" fill="#2B5BFF" opacity="0.7" />
                    ))}
                    <path d={curves[idx].replace(/(\d+)/g, (m) => String(parseInt(m,10)+8)).replace(/,(\d+)/g, (m,n) => ","+String(parseInt(n,10)+5))} fill="none" stroke={colors[idx]} strokeWidth="2" />
                  </g>
                );
              })}
              <text x="260" y="220" textAnchor="middle" fontSize="11" fill="var(--muted)">Same model, different training data — very different fits = HIGH VARIANCE</text>
            </svg>
          </div>

          {subhead("Examples of High-Variance Models")}
          {tbl(
            <>
              <thead>
                <tr>{th("Model")}{th("Why it has high variance")}</tr>
              </thead>
              <tbody>
                <tr>{td("Decision tree (max_depth=None)")}{td("Memorizes every training point exactly")}</tr>
                <tr>{td("k-NN with k=1")}{td("Prediction from single nearest neighbor — noisy")}</tr>
                <tr>{td("Deep neural network (no regularization)")}{td("Billions of parameters on a tiny dataset")}</tr>
                <tr>{td("High-degree polynomial")}{td("Too flexible for the data available")}</tr>
              </tbody>
            </>
          )}

          {subhead("Symptoms of High Variance")}
          <ul style={{ fontSize:13, lineHeight:1.9, paddingLeft:22, color:"var(--ink)" }}>
            <li>Training accuracy is <b>HIGH</b> (near 100% on training data)</li>
            <li>Validation accuracy is <b>much lower</b> than training accuracy</li>
            <li>Large gap between train and validation curves on the learning plot</li>
            <li>Small changes in training data cause large changes in model predictions</li>
          </ul>
        </>
      )
    },

    // ─── STAGE 4: The Tradeoff ───────────────────────────────────────────────
    {
      id: "tradeoff",
      group: "Concepts",
      title: "The Tradeoff — Why You Can't Have Both",
      map: "Tradeoff",
      why: "The tradeoff is not a bug to be fixed but a fundamental property of learning from finite data.",
      render: () => (
        <>
          <Lead>
            The bias-variance tradeoff is fundamental: making a model more flexible (to reduce
            bias) always increases its sensitivity to training data (variance). There is no free
            lunch — you must choose where to operate on this curve.
          </Lead>

          {subhead("The Canonical U-Curve")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 600 240" style={{ width:"100%", maxWidth:600, height:"auto", display:"block" }}>
              <defs>
                <marker id="arr-tc" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>
              {/* shaded regions */}
              <rect x="50" y="20" width="190" height="175" fill="rgba(224,73,46,0.06)" />
              <rect x="340" y="20" width="230" height="175" fill="rgba(124,92,255,0.06)" />
              {/* axes */}
              <line x1="50" y1="195" x2="578" y2="195" stroke="var(--ink)" strokeWidth="1.4" markerEnd="url(#arr-tc)" />
              <line x1="50" y1="195" x2="50" y2="15" stroke="var(--ink)" strokeWidth="1.4" markerEnd="url(#arr-tc)" />
              <text x="318" y="218" textAnchor="middle" fontSize="11" fill="var(--muted)">Model Complexity (simple → complex)</text>
              <text x="16" y="108" textAnchor="middle" fontSize="11" fill="var(--muted)" transform="rotate(-90,16,108)">Error</text>
              {/* Bias² curve — exponential decay */}
              <path d="M55,38 C100,42 150,68 200,105 S300,155 560,175" fill="none" stroke="#e0492e" strokeWidth="2.5" />
              {/* Variance curve — exponential growth */}
              <path d="M55,178 C100,175 150,165 200,148 S280,110 350,80 S450,48 560,32" fill="none" stroke="#7c5cff" strokeWidth="2.5" />
              {/* Total error U-curve */}
              <path d="M55,95 C100,80 140,72 180,68 S240,70 280,78 S360,110 430,145 S510,170 560,178" fill="none" stroke="#1f9e6b" strokeWidth="3" />
              {/* optimal line */}
              <line x1="260" y1="20" x2="260" y2="195" stroke="#1f9e6b" strokeWidth="1.8" strokeDasharray="6 3" />
              <text x="260" y="14" textAnchor="middle" fontSize="10" fill="#1f9e6b" fontWeight="700">Optimal</text>
              {/* region labels */}
              <text x="145" y="40" textAnchor="middle" fontSize="10.5" fill="#e0492e" fontWeight="700">High Bias</text>
              <text x="145" y="54" textAnchor="middle" fontSize="10" fill="#e0492e">(Underfitting)</text>
              <text x="445" y="40" textAnchor="middle" fontSize="10.5" fill="#7c5cff" fontWeight="700">High Variance</text>
              <text x="445" y="54" textAnchor="middle" fontSize="10" fill="#7c5cff">(Overfitting)</text>
              {/* legend */}
              <line x1="60" y1="210" x2="90" y2="210" stroke="#e0492e" strokeWidth="2.5" />
              <text x="95" y="213" fontSize="10" fill="#e0492e">Bias²</text>
              <line x1="160" y1="210" x2="190" y2="210" stroke="#7c5cff" strokeWidth="2.5" />
              <text x="195" y="213" fontSize="10" fill="#7c5cff">Variance</text>
              <line x1="270" y1="210" x2="300" y2="210" stroke="#1f9e6b" strokeWidth="3" />
              <text x="305" y="213" fontSize="10" fill="#1f9e6b">Total Error</text>
            </svg>
          </div>

          {subhead("Polynomial Regression — A Perfect Illustration")}
          {tbl(
            <>
              <thead>
                <tr>{th("Degree")}{th("Train MSE")}{th("Test MSE")}{th("Region")}</tr>
              </thead>
              <tbody>
                <tr>{td("1 (linear)")}{td("8.3")}{td("8.7")}{td("Underfitting (high bias)")}</tr>
                <tr>{td("2 (quadratic)")}{td("3.1")}{td("3.4")}{td("Good fit")}</tr>
                <tr style={{ background:"rgba(31,158,107,0.07)" }}>{td("3 (cubic)")}{td("2.8")}{td("3.0")}{td(React.createElement("b",{style:{color:"#1f9e6b"}},"Near optimal"))}</tr>
                <tr>{td("5")}{td("2.7")}{td("3.8")}{td("Starting to overfit")}</tr>
                <tr>{td("8")}{td("0.9")}{td("12.4")}{td("Overfitting (high variance)")}</tr>
                <tr style={{ background:"rgba(224,73,46,0.06)" }}>{td("12")}{td("0.2")}{td("47.1")}{td("Severe overfitting")}</tr>
              </tbody>
            </>
          )}

          {subhead("Why Is It Unavoidable?")}
          <p style={{ fontSize:13, lineHeight:1.7, color:"var(--ink)" }}>
            With N training points, the model has N equations but can have far more parameters.
            An N-parameter model can always fit N points exactly — zero training error. But it
            fits the noise too. There is no way to extract pure signal from noisy data without
            making some assumption (bias) about the signal's structure.
          </p>
          <Note>
            The tradeoff is not about being clever. It is a mathematical inevitability.
            The goal is to find the right complexity level for your data size and noise level —
            not to eliminate the tradeoff.
          </Note>
        </>
      )
    },

    // ─── STAGE 5: Underfitting ───────────────────────────────────────────────
    {
      id: "underfitting",
      group: "Underfitting",
      title: "Underfitting — High Bias in Practice",
      map: "Underfitting",
      why: "Underfitting is often underdiagnosed. Teams add more data or tune hyperparameters when the real fix is a fundamentally different model.",
      render: () => (
        <>
          <Lead>
            Underfitting happens when a model is too simple to capture the patterns in the data.
            Both training and validation performance are poor. The model hasn't learned enough —
            it's underfit to the data.
          </Lead>

          {subhead("Visual Diagnosis")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 440 200" style={{ width:"100%", maxWidth:440, height:"auto", display:"block" }}>
              <defs>
                <marker id="arr-uf" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>
              <line x1="50" y1="165" x2="420" y2="165" stroke="var(--ink)" strokeWidth="1.4" markerEnd="url(#arr-uf)" />
              <line x1="50" y1="165" x2="50" y2="15" stroke="var(--ink)" strokeWidth="1.4" markerEnd="url(#arr-uf)" />
              <text x="235" y="185" textAnchor="middle" fontSize="11" fill="var(--muted)">x</text>
              <text x="18" y="90" textAnchor="middle" fontSize="11" fill="var(--muted)" transform="rotate(-90,18,90)">y</text>
              {/* parabola data points */}
              {[
                [65,150],[85,120],[105,95],[125,78],[145,65],[165,58],[185,58],[205,65],
                [225,78],[245,95],[265,120],[285,148],[305,135],[325,110],[345,88],[365,72],[385,62]
              ].map(([cx,cy],i) => (
                <circle key={i} cx={cx} cy={cy} r="4" fill="#2B5BFF" opacity="0.75" stroke="white" strokeWidth="1" />
              ))}
              {/* flat horizontal line — underfitted model */}
              <line x1="55" y1="100" x2="415" y2="100" stroke="#e0492e" strokeWidth="2.5" />
              <text x="420" y="98" fontSize="10" fill="#e0492e">flat model</text>
              <text x="235" y="35" textAnchor="middle" fontSize="10" fill="var(--muted)">Model predicts ~mean regardless of input — learned nothing useful</text>
            </svg>
          </div>

          {subhead("Learning Curve for Underfitting")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 500 210" style={{ width:"100%", maxWidth:500, height:"auto", display:"block" }}>
              <defs>
                <marker id="arr-ulc" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>
              <line x1="55" y1="175" x2="478" y2="175" stroke="var(--ink)" strokeWidth="1.4" markerEnd="url(#arr-ulc)" />
              <line x1="55" y1="175" x2="55" y2="18" stroke="var(--ink)" strokeWidth="1.4" markerEnd="url(#arr-ulc)" />
              {[100,200,300,400].map((v,i) => (
                <g key={i}>
                  <line x1={55+(i+1)*85} y1="175" x2={55+(i+1)*85} y2="179" stroke="var(--ink)" strokeWidth="1" />
                  <text x={55+(i+1)*85} y="190" textAnchor="middle" fontSize="9" fill="var(--muted)">{v}</text>
                </g>
              ))}
              <text x="265" y="205" textAnchor="middle" fontSize="11" fill="var(--muted)">Training set size</text>
              <text x="16" y="97" textAnchor="middle" fontSize="11" fill="var(--muted)" transform="rotate(-90,16,97)">Error</text>
              {/* Both curves converge HIGH */}
              {/* Training: starts low, rises to plateau at high value */}
              <path d="M60,145 C100,148 150,151 200,153 S300,154 465,155" fill="none" stroke="#2B5BFF" strokeWidth="2.5" />
              {/* Validation: starts high, drops, plateau close to training */}
              <path d="M60,30 C100,60 150,100 200,130 S300,148 465,153" fill="none" stroke="#e0492e" strokeWidth="2.5" />
              {/* high plateau label */}
              <line x1="58" y1="153" x2="470" y2="153" stroke="#888" strokeWidth="1" strokeDasharray="4 3" />
              <text x="355" y="138" fontSize="10" fill="#888">High plateau</text>
              {/* legend */}
              <line x1="65" y1="25" x2="95" y2="25" stroke="#2B5BFF" strokeWidth="2.5" />
              <text x="100" y="28" fontSize="10" fill="#2B5BFF">Train</text>
              <line x1="155" y1="25" x2="185" y2="25" stroke="#e0492e" strokeWidth="2.5" />
              <text x="190" y="28" fontSize="10" fill="#e0492e">Validation</text>
            </svg>
          </div>
          <p style={{ fontSize:12, color:"var(--muted)", marginTop:0 }}>
            Both curves converge at a high error. Adding more data won't help — the model ceiling is too low.
          </p>

          {subhead("Causes of Underfitting")}
          {tbl(
            <>
              <thead>
                <tr>{th("Cause")}{th("Example")}{th("Fix")}</tr>
              </thead>
              <tbody>
                <tr>{td("Model too simple")}{td("Linear model on non-linear data")}{td("Switch to polynomial / tree / neural net")}</tr>
                <tr>{td("Too much regularization")}{td("L2 alpha=1000 shrinks all coefficients to ~0")}{td("Reduce regularization")}</tr>
                <tr>{td("Too few features")}{td("Predicting house price with only zip code")}{td("Add more relevant features")}</tr>
                <tr>{td("Insufficient training time")}{td("Neural net stopped at epoch 2")}{td("Train longer")}</tr>
                <tr>{td("Wrong feature transformations")}{td("Price without log-transform on skewed distribution")}{td("Apply log transform")}</tr>
              </tbody>
            </>
          )}

          {warn("Overly simple preprocessing can cause underfitting. If you bin a continuous feature (age) into just 3 buckets (young/middle/old), you have destroyed information. The model can't learn patterns that exist within each bucket.")}
        </>
      )
    },

    // ─── STAGE 6: Overfitting ────────────────────────────────────────────────
    {
      id: "overfitting",
      group: "Overfitting",
      title: "Overfitting — High Variance in Practice",
      map: "Overfitting",
      why: "Overfitting is the most common failure mode in production ML. It explains why a model can hit 99% training accuracy yet fail completely on new data.",
      render: () => (
        <>
          <Lead>
            Overfitting happens when a model learns the training data too well — including its
            noise and random quirks. It memorizes instead of learning. The result: stellar
            training performance, terrible generalization.
          </Lead>

          {subhead("Good Fit vs Overfit")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 500 230" style={{ width:"100%", maxWidth:500, height:"auto", display:"block" }}>
              <defs>
                <marker id="arr-of" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>
              <line x1="50" y1="185" x2="480" y2="185" stroke="var(--ink)" strokeWidth="1.4" markerEnd="url(#arr-of)" />
              <line x1="50" y1="185" x2="50" y2="18" stroke="var(--ink)" strokeWidth="1.4" markerEnd="url(#arr-of)" />
              {/* training points (noisy parabola) */}
              {[
                [65,170],[85,145],[105,122],[125,102],[145,88],[165,80],[185,78],[205,83],
                [225,95],[245,112],[265,135],[285,162],[305,148],[330,125],[360,100]
              ].map(([cx,cy],i) => (
                <circle key={i} cx={cx} cy={cy} r="4.5" fill="#2B5BFF" opacity="0.8" stroke="white" strokeWidth="1" />
              ))}
              {/* test points — different color */}
              {[[100,135],[200,70],[320,105]].map(([cx,cy],i) => (
                <circle key={i} cx={cx} cy={cy} r="5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
              ))}
              {/* degree-2 smooth fit */}
              <path d="M60,172 Q185,50 360,155" fill="none" stroke="#1f9e6b" strokeWidth="2.5" />
              {/* degree-12 overfit wiggly curve */}
              <path d="M60,172 C75,155 88,200 105,125 S130,55 145,88 S162,108 185,80 S205,50 225,97 S248,135 265,138 S282,180 305,148 S330,90 355,125 S375,168 390,148" fill="none" stroke="#e0492e" strokeWidth="2" strokeDasharray="5 2" />
              {/* labels */}
              <text x="270" y="45" fontSize="10" fontWeight="700" fill="#1f9e6b">Good fit (degree-2)</text>
              <text x="270" y="60" fontSize="10" fontWeight="700" fill="#e0492e">OVERFIT (degree-12)</text>
              <text x="65" y="210" fontSize="9" fill="#2B5BFF">train pts</text>
              <text x="185" y="210" fontSize="9" fill="#f59e0b">test pts — degree-12 misses badly</text>
            </svg>
          </div>

          {card(
            <div>
              <b style={{ color:"var(--accent)" }}>The memorization problem:</b>
              <p style={{ fontSize:13, lineHeight:1.7, marginTop:8, marginBottom:0 }}>
                A decision tree trained with no depth limit on 1000 training examples creates
                1000 leaves — one per training example. Training accuracy: 100%.
                Test accuracy: 61%. The model has memorized the training set.
                It is not a model — it is a lookup table.
              </p>
            </div>
          )}

          {subhead("Learning Curve for Overfitting")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 500 210" style={{ width:"100%", maxWidth:500, height:"auto", display:"block" }}>
              <defs>
                <marker id="arr-olc" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>
              <line x1="55" y1="175" x2="478" y2="175" stroke="var(--ink)" strokeWidth="1.4" markerEnd="url(#arr-olc)" />
              <line x1="55" y1="175" x2="55" y2="18" stroke="var(--ink)" strokeWidth="1.4" markerEnd="url(#arr-olc)" />
              {[100,200,300,400].map((v,i) => (
                <g key={i}>
                  <line x1={55+(i+1)*85} y1="175" x2={55+(i+1)*85} y2="179" stroke="var(--ink)" strokeWidth="1" />
                  <text x={55+(i+1)*85} y="190" textAnchor="middle" fontSize="9" fill="var(--muted)">{v}</text>
                </g>
              ))}
              <text x="265" y="205" textAnchor="middle" fontSize="11" fill="var(--muted)">Training set size</text>
              <text x="16" y="97" textAnchor="middle" fontSize="11" fill="var(--muted)" transform="rotate(-90,16,97)">Error</text>
              {/* Training: very low, stays low */}
              <path d="M60,170 C100,168 150,165 200,163 S300,161 465,160" fill="none" stroke="#2B5BFF" strokeWidth="2.5" />
              {/* Validation: much higher, slowly converges */}
              <path d="M60,60 C100,65 150,75 200,90 S300,115 465,145" fill="none" stroke="#e0492e" strokeWidth="2.5" />
              {/* gap bracket */}
              <line x1="462" y1="162" x2="462" y2="143" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arr-olc)" />
              <line x1="462" y1="143" x2="462" y2="162" stroke="#f59e0b" strokeWidth="2" />
              <text x="390" y="155" fontSize="10" fill="#f59e0b" fontWeight="700">GAP = variance</text>
              {/* legend */}
              <line x1="65" y1="25" x2="95" y2="25" stroke="#2B5BFF" strokeWidth="2.5" />
              <text x="100" y="28" fontSize="10" fill="#2B5BFF">Train</text>
              <line x1="155" y1="25" x2="185" y2="25" stroke="#e0492e" strokeWidth="2.5" />
              <text x="190" y="28" fontSize="10" fill="#e0492e">Validation</text>
            </svg>
          </div>

          {subhead("Common Causes")}
          {tbl(
            <>
              <thead>
                <tr>{th("Cause")}{th("Example")}{th("Fix")}</tr>
              </thead>
              <tbody>
                <tr>{td("Model too complex")}{td("Decision tree with no depth limit")}{td("Set max_depth=5")}</tr>
                <tr>{td("Too little data")}{td("100 samples for 50 features")}{td("Get more data or reduce features")}</tr>
                <tr>{td("Training too long")}{td("Neural network trained for 1000 epochs")}{td("Early stopping")}</tr>
                <tr>{td("No regularization")}{td("Neural network without dropout")}{td("Add L2 / dropout")}</tr>
                <tr>{td("Feature leakage")}{td("Using future information as a feature")}{td("Audit feature pipeline")}</tr>
                <tr>{td("Data snooping")}{td("Tuning hyperparameters on test set")}{td("Use validation set")}</tr>
              </tbody>
            </>
          )}
        </>
      )
    },

    // ─── STAGE 7: Detecting via Learning Curves ──────────────────────────────
    {
      id: "detect",
      group: "Diagnosis",
      title: "How to Detect — Reading Learning Curves",
      map: "Diagnose",
      why: "You can't fix what you haven't diagnosed. Learning curves tell you exactly which problem you have.",
      render: () => (
        <>
          <Lead>
            Learning curves plot model performance against training set size. They are the most
            reliable diagnostic for bias and variance. Two curves, one plot, four possible states.
          </Lead>

          {subhead("The 4 Learning Curve Patterns")}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))", gap:14, marginBottom:18 }}>
            {[
              {
                title:"1 — Underfitting (high bias)",
                color:"#e0492e",
                desc:"Both training and validation loss are high (~0.8) and converge close together. The model can't learn even with more data.",
                trainY:[168,163,160,158,156],
                valY:[50,100,130,148,154]
              },
              {
                title:"2 — Overfitting (high variance)",
                color:"#7c5cff",
                desc:"Training loss is low (~0.1) but validation loss is much higher (~0.7). Large persistent gap.",
                trainY:[170,168,167,166,165],
                valY:[55,70,90,105,115]
              },
              {
                title:"3 — Good fit",
                color:"#1f9e6b",
                desc:"Both curves converge to low values. This is what you want.",
                trainY:[168,160,150,140,132],
                valY:[55,85,110,125,130]
              },
              {
                title:"4 — Need more data",
                color:"#f59e0b",
                desc:"Both are decreasing and getting closer together — a good sign, just needs more training data.",
                trainY:[165,155,145,135,125],
                valY:[60,80,100,115,122]
              }
            ].map(({ title, color, desc, trainY, valY }) => (
              <div key={title} style={{ background:color+"0a", border:"1px solid "+color+"30", borderRadius:12, padding:"12px 14px" }}>
                <div style={{ fontWeight:700, fontSize:12, color, marginBottom:6 }}>{title}</div>
                <svg viewBox="0 0 200 100" style={{ width:"100%", height:80, display:"block" }}>
                  <line x1="25" y1="85" x2="195" y2="85" stroke="#ccc" strokeWidth="1" />
                  <line x1="25" y1="85" x2="25" y2="8" stroke="#ccc" strokeWidth="1" />
                  {[0,1,2,3,4].map(i => {
                    const x = 30 + i * 38;
                    return (
                      <g key={i}>
                        {i > 0 && (
                          <>
                            <line x1={30+(i-1)*38} y1={trainY[i-1]} x2={x} y2={trainY[i]} stroke="#2B5BFF" strokeWidth="1.8" />
                            <line x1={30+(i-1)*38} y1={valY[i-1]} x2={x} y2={valY[i]} stroke="#e0492e" strokeWidth="1.8" />
                          </>
                        )}
                        <circle cx={x} cy={trainY[i]} r="2.5" fill="#2B5BFF" />
                        <circle cx={x} cy={valY[i]} r="2.5" fill="#e0492e" />
                      </g>
                    );
                  })}
                  <text x="32" y="94" fontSize="8" fill="#2B5BFF">train</text>
                  <text x="120" y="94" fontSize="8" fill="#e0492e">val</text>
                </svg>
                <div style={{ fontSize:11, color:"var(--ink)", lineHeight:1.6 }}>{desc}</div>
              </div>
            ))}
          </div>

          {subhead("How to Generate Them in scikit-learn")}
          {codeBlock("from sklearn.model_selection import learning_curve\nimport numpy as np\n\ntrain_sizes, train_scores, val_scores = learning_curve(\n    estimator=model,\n    X=X_train, y=y_train,\n    cv=5,\n    train_sizes=np.linspace(0.1, 1.0, 10),\n    scoring='neg_mean_squared_error'\n)\n\ntrain_mean = -train_scores.mean(axis=1)\nval_mean   = -val_scores.mean(axis=1)")}

          {subhead("The Train-Validation Gap Rule")}
          {tbl(
            <>
              <thead>
                <tr>{th("Gap size")}{th("Interpretation")}{th("Action")}</tr>
              </thead>
              <tbody>
                <tr>{td("< 5% of scale")}{td("Normal variance")}{td("Fine — model generalizes well")}</tr>
                <tr>{td("5–20% of scale")}{td("Mild overfitting")}{td("Light regularization, check for leakage")}</tr>
                <tr>{td("> 20% of scale")}{td("Significant overfitting")}{td("Strong regularization, more data, simpler model")}</tr>
                <tr>{td("Both high")}{td("Underfitting")}{td("More complex model, more features")}</tr>
              </tbody>
            </>
          )}

          {info(<span><b>Epoch vs sample learning curves:</b> For neural networks, use epoch-based
            curves (training loss vs. epoch number) to detect when to stop training. For any model,
            use sample-based curves (performance vs. training set size) to decide if more data
            would help.</span>)}
        </>
      )
    },

    // ─── STAGE 8: Fixing Underfitting ────────────────────────────────────────
    {
      id: "fix-bias",
      group: "Fixes",
      title: "Fixing Underfitting — Reducing Bias",
      map: "Fix Bias",
      why: "Underfitting fixes are often simpler than people think — but only after you correctly diagnose the cause.",
      render: () => (
        <>
          <Lead>
            If your model underfits, it is too constrained. The fixes involve either making the
            model more expressive, giving it better information, or reducing over-constraining
            regularization.
          </Lead>

          {subhead("7 Fixes for Underfitting")}
          {[
            {
              n:1, title:"Try a more complex model",
              body:"Linear → Polynomial; Decision Tree depth 2 → depth 10; Single tree → Random Forest → GBM",
              when:"When training accuracy is fundamentally limited"
            },
            {
              n:2, title:"Add more features / feature engineering",
              body:"Create interaction terms (price × location); polynomial features (x, x², x³). Add domain knowledge: day_of_week for retail data, distance_to_nearest_amenity for house prices.",
              when:"When the current features don't contain the information needed to predict the target"
            },
            {
              n:3, title:"Reduce regularization strength",
              body:"Ridge: decrease alpha from 100 → 1. Neural net: decrease weight_decay from 0.1 → 0.001. L1 Lasso: if coefficients are all shrunk to zero, alpha is too high.",
              when:"When regularization is so strong the model can't fit even the training data"
            },
            {
              n:4, title:"Train longer",
              body:"Neural nets: increase max_epochs from 10 → 200 with early stopping. GBM: increase n_estimators from 50 → 500.",
              when:"Loss is still decreasing at the training cutoff"
            },
            {
              n:5, title:"Remove over-aggressive preprocessing",
              body:"Aggressive binning of continuous features destroys information. Removing features 'to simplify' may remove signal.",
              when:"When you have simplified the input space too much"
            },
            {
              n:6, title:"Better feature encoding",
              body:"One-hot encode categoricals (don't use ordinal encoding when no order exists). Log-transform skewed features before feeding to linear models.",
              when:"When feature distributions are very non-normal and model is linear"
            },
            {
              n:7, title:"Ensemble",
              body:"Bagging/boosting of simple models can compensate for individual model bias. Random Forest of shallow trees has lower bias than a single shallow tree.",
              when:"When a single model of the right complexity can't be identified"
            }
          ].map(({ n, title, body, when }) => (
            card(
              <div key={n}>
                <div style={{ fontWeight:700, fontSize:14, color:"var(--accent)", marginBottom:6 }}>
                  {n}. {title}
                </div>
                <div style={{ fontSize:13, lineHeight:1.7, marginBottom:6 }}>{body}</div>
                <div style={{ fontSize:12, color:"var(--muted)" }}><b>When to apply:</b> {when}</div>
              </div>
            )
          ))}

          {warn("Adding more training data does NOT fix underfitting. A model with a hard ceiling (like linear on non-linear data) won't improve with more data once that ceiling is reached. Diagnose first.")}
        </>
      )
    },

    // ─── STAGE 9: Fixing Overfitting ─────────────────────────────────────────
    {
      id: "fix-variance",
      group: "Fixes",
      title: "Fixing Overfitting — Reducing Variance",
      map: "Fix Variance",
      why: "Overfitting has many fixes — the right one depends on whether your primary constraint is data size, model capacity, or training procedure.",
      render: () => (
        <>
          <Lead>
            Overfitting means your model has too much freedom for the amount of data you have.
            The fixes: constrain the model (regularization), give it more data, use an ensemble
            to average out variance, or stop it before it fully memorizes.
          </Lead>

          {subhead("8 Techniques for Reducing Variance")}
          {[
            {
              n:1, title:"Get more training data (best fix when possible)",
              body:"Every additional training example gives the model a harder-to-memorize target. Diminishing returns: doubling data reduces variance by ~√2 (not 2×).",
              when:"When you genuinely can get more data. Always try this first if possible."
            },
            {
              n:2, title:"L2 Regularization (Ridge / weight decay)",
              body:"Adds penalty: loss + λΣw². Effect: shrinks all weights toward zero, preventing any single weight from becoming too large. sklearn: Ridge(alpha=1.0). Typical lambda range: 0.001 to 100 (tune with cross-validation).",
              when:"When all features are potentially relevant and you want smooth shrinkage"
            },
            {
              n:3, title:"L1 Regularization (Lasso)",
              body:"Adds penalty: loss + λΣ|wᵢ|. Effect: shrinks some weights to EXACTLY zero → automatic feature selection.",
              when:"When you suspect many features are irrelevant — Lasso removes them"
            },
            {
              n:4, title:"Dropout (neural networks only)",
              body:"Randomly zero out p fraction of neurons during each forward pass. p=0.2 to p=0.5 typical. Forces the model to learn redundant representations.",
              note:"Dropout is equivalent to training an ensemble of 2ⁿ models for n neurons"
            },
            {
              n:5, title:"Early Stopping",
              body:"Stop training when validation loss stops improving (patience=10–20 epochs). Works for GBM (n_iter_no_change), neural networks (callbacks), any iterative model.",
              when:"No extra hyperparameter tuning — just monitor validation loss"
            },
            {
              n:6, title:"Reduce model complexity",
              body:"Decision trees: decrease max_depth or increase min_samples_leaf. Neural networks: fewer layers, fewer neurons. Polynomial regression: lower degree.",
              when:"When you can afford a simpler model without too much bias increase"
            },
            {
              n:7, title:"Cross-validation instead of single train/val split",
              body:"k-fold CV averages performance across k folds → reduces variance in evaluation. Also helps catch if your single split was accidentally too easy or hard.",
              when:"Always — it is better than a single split"
            },
            {
              n:8, title:"Ensemble methods",
              body:"Random Forest: each tree sees different data (bootstrapping) → variance averages out. Mathematical guarantee: Ensemble variance = ρσ²/n, where ρ is tree correlation.",
              when:"When individual models are unstable — ensembles always help variance"
            }
          ].map(({ n, title, body, when, note }) => (
            card(
              <div key={n}>
                <div style={{ fontWeight:700, fontSize:14, color:"var(--accent)", marginBottom:6 }}>
                  {n}. {title}
                </div>
                <div style={{ fontSize:13, lineHeight:1.7, marginBottom:4 }}>{body}</div>
                {note && <div style={{ fontSize:12, fontStyle:"italic", color:"var(--muted)" }}>{note}</div>}
                {when && <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}><b>When to apply:</b> {when}</div>}
              </div>
            )
          ))}

          {subhead("Decision Flowchart")}
          {card(
            <ul style={{ fontSize:13, lineHeight:2.0, paddingLeft:20, color:"var(--ink)", marginBottom:0 }}>
              <li>Do you have more data available? <b>Yes →</b> Get more data first</li>
              <li>Is the model a neural network? <b>Yes →</b> Try dropout + early stopping first</li>
              <li>Is the model a tree? <b>Yes →</b> Reduce max_depth / increase min_samples_leaf</li>
              <li>Is the model linear? <b>Yes →</b> Add L2 regularization (Ridge)</li>
              <li>Are many features irrelevant? <b>Yes →</b> L1 (Lasso) or feature selection</li>
              <li>Nothing works? <b>→</b> Use an ensemble (Random Forest or GBM)</li>
            </ul>
          )}
        </>
      )
    },

    // ─── STAGE 10: MSE Decomposition ─────────────────────────────────────────
    {
      id: "math",
      group: "Deep Dive",
      title: "MSE = Bias² + Variance + Noise",
      map: "Math",
      why: "The decomposition proves mathematically why you can't eliminate both bias and variance simultaneously.",
      render: () => (
        <>
          <Lead>
            For a regression model predicting y from x, the expected mean squared error on a
            new point decomposes exactly into three terms. This is not an approximation —
            it is an algebraic identity.
          </Lead>

          {subhead("The Full Derivation")}
          {card(
            <div style={{ fontFamily:"monospace", fontSize:12.5, lineHeight:2.2 }}>
              <div><b>Notation:</b></div>
              <div style={{ marginLeft:16 }}>y = true value (unknown fixed)</div>
              <div style={{ marginLeft:16 }}>y&#770;(x) = model's prediction (random — depends on which training set you got)</div>
              <div style={{ marginLeft:16 }}>&epsilon; = irreducible noise (E[&epsilon;]=0, Var[&epsilon;]=&sigma;&sup2;)</div>
              <br />
              <div>MSE = E[(y &minus; y&#770;)&sup2;]</div>
              <div style={{ paddingLeft:32 }}>= E[(f(x) + &epsilon; &minus; y&#770;)&sup2;]</div>
              <div style={{ paddingLeft:32 }}>= E[(f(x) &minus; y&#770;)&sup2;] + &sigma;&sup2;  <span style={{ color:"var(--muted)" }}>(noise is independent)</span></div>
              <div style={{ paddingLeft:32 }}>= E[(f(x) &minus; E[y&#770;] + E[y&#770;] &minus; y&#770;)&sup2;] + &sigma;&sup2;</div>
              <div style={{ paddingLeft:32 }}>= (f(x) &minus; E[y&#770;])&sup2; + E[(E[y&#770;] &minus; y&#770;)&sup2;] + 2&middot;(f(x)&minus;E[y&#770;])&middot;E[E[y&#770;]&minus;y&#770;] + &sigma;&sup2;</div>
              <div style={{ paddingLeft:32, color:"var(--muted)" }}>The cross term = 0 &nbsp;&nbsp;(since E[E[y&#770;]&minus;y&#770;] = 0)</div>
              <br />
              <div style={{ fontSize:13 }}>Therefore:</div>
              <div style={{ paddingLeft:32 }}>
                MSE = <span style={{ color:"#e0492e", fontWeight:700 }}>(f(x) &minus; E[y&#770;])&sup2;</span>
                {" + "}<span style={{ color:"#7c5cff", fontWeight:700 }}>E[(y&#770; &minus; E[y&#770;])&sup2;]</span>
                {" + "}<span style={{ color:"#94A2BC", fontWeight:700 }}>&sigma;&sup2;</span>
              </div>
              <div style={{ paddingLeft:32 }}>
                {"     = "}<span style={{ color:"#e0492e", fontWeight:700 }}>Bias&sup2;</span>
                {" + "}<span style={{ color:"#7c5cff", fontWeight:700 }}>Variance</span>
                {" + "}<span style={{ color:"#94A2BC", fontWeight:700 }}>Irreducible Noise</span>
              </div>
            </div>
          )}

          {subhead("Concrete Numerical Example")}
          {card(
            <div>
              <div style={{ fontSize:13, lineHeight:1.8 }}>
                <b>True function:</b> f(x) = 2x + x&sup2; &nbsp;&nbsp;
                <b>Model:</b> linear regression (too simple) &nbsp;&nbsp;
                <b>Evaluate at:</b> x=3
              </div>
              <br />
              {tbl(
                <>
                  <thead>
                    <tr>{th("Term")}{th("Value")}{th("Meaning")}</tr>
                  </thead>
                  <tbody>
                    <tr>{td("True value f(3)")}{td("15.0")}{td("2(3) + 9 = 15")}</tr>
                    <tr>{td("E[ŷ] across 1000 datasets")}{td("10.8")}{td("Systematic miss — missing x² term")}</tr>
                    <tr style={{ background:"rgba(224,73,46,0.07)" }}>{td("Bias²")}{td("17.64")}{td("(15 − 10.8)² = 17.64")}</tr>
                    <tr style={{ background:"rgba(124,92,255,0.07)" }}>{td("Variance")}{td("2.30")}{td("Var(ŷ across 1000 datasets)")}</tr>
                    <tr>{td("Noise σ²")}{td("1.00")}{td("Inherent noise in data")}</tr>
                    <tr style={{ background:"rgba(43,91,255,0.07)", fontWeight:700 }}>{td("Total MSE")}{td("20.94")}{td("17.64 + 2.30 + 1.00")}</tr>
                  </tbody>
                </>
              )}
            </div>
          )}

          {info(<span><b>The irreducible noise floor:</b> &sigma;&sup2; is the absolute minimum possible error — even
            a perfect model that knows f(x) exactly can't do better than &sigma;&sup2; because the data
            itself is noisy. This is why 100% accuracy on a real dataset is a red flag — you
            have likely overfit the noise.</span>)}

          {info(<span><b>Why regularization moves the tradeoff:</b> L2 regularization adds bias (it pulls
            predictions toward zero — systematically wrong) but reduces variance (model can't
            vary as much). The net effect is usually better MSE if you're initially in the
            high-variance regime.</span>)}
        </>
      )
    },

    // ─── STAGE 11: Regularization Deep Dive ──────────────────────────────────
    {
      id: "regularization",
      group: "Deep Dive",
      title: "Regularization — L1, L2, Dropout, Early Stopping",
      map: "Regularization",
      why: "Regularization is the primary tool for controlling the bias-variance tradeoff. Each type has different effects on the model's parameter distribution.",
      render: () => (
        <>
          <Lead>
            Regularization intentionally introduces a small amount of bias to dramatically reduce
            variance. It is a controlled trade: accept a slightly worse fit on training data to
            get much better generalization.
          </Lead>

          {subhead("L2 Regularization (Ridge / Weight Decay)")}
          {card(
            <div style={{ fontSize:13, lineHeight:1.8 }}>
              <div><b>Loss function:</b> <code>L_total = L_original + λΣwᵢ²</code></div>
              <div><b>Gradient descent update:</b> <code>w ← w(1 − 2ηλ) − η∇L_original</code></div>
              <div>The <code>(1−2ηλ)</code> factor shrinks weights by a constant fraction each step — "weight decay".</div>
              <div><b>Geometric interpretation:</b> Constrains weights to lie within a sphere in weight space.</div>
            </div>
          )}
          {tbl(
            <>
              <thead>
                <tr>{th("λ")}{th("Train MSE")}{th("Val MSE")}{th("Effect")}</tr>
              </thead>
              <tbody>
                <tr>{td("0")}{td("0.02")}{td("14.8")}{td("Severe overfitting")}</tr>
                <tr>{td("0.01")}{td("0.18")}{td("3.2")}{td("Good regularization")}</tr>
                <tr style={{ background:"rgba(31,158,107,0.07)" }}>{td("1.0")}{td("1.8")}{td("2.4")}{td(React.createElement("b",{style:{color:"#1f9e6b"}},"Near optimal"))}</tr>
                <tr>{td("100")}{td("8.2")}{td("8.4")}{td("Underfitting (too strong)")}</tr>
              </tbody>
            </>
          )}

          {subhead("L1 Regularization (Lasso)")}
          {card(
            <div style={{ fontSize:13, lineHeight:1.8 }}>
              <div><b>Loss function:</b> <code>L_total = L_original + λΣ|wᵢ|</code></div>
              <div><b>Key difference from L2:</b> L1 can push weights to <b>exactly zero</b> (sparse solution).</div>
              <div><b>Why?</b> The L1 "ball" in weight space has corners at the axes — gradient descent tends to land on these corners, where many weights = 0.</div>
              <div><b>Use when:</b> You want automatic feature selection (many features are irrelevant).</div>
            </div>
          )}

          {subhead("Dropout (Neural Networks)")}
          {card(
            <div style={{ fontSize:13, lineHeight:1.8 }}>
              <div><b>During training:</b> For each sample, randomly set p fraction of neuron outputs to 0.</div>
              <div><b>During inference:</b> Multiply all outputs by (1−p) to maintain expected value.</div>
              <div><b>Typical p:</b> 0.2 to 0.5 for fully-connected; 0.1–0.2 for convolutional.</div>
              <div><b>Why it works:</b> Prevents co-adaptation — no neuron can rely on any other neuron being active. Equivalent to training an ensemble of 2ⁿ subnetworks.</div>
            </div>
          )}

          {subhead("Early Stopping")}
          {card(
            <div style={{ fontSize:13, lineHeight:1.8 }}>
              <div><b>Mechanism:</b> Monitor validation loss; stop when it starts increasing.</div>
              <div><b>Patience parameter:</b> How many epochs to wait after last improvement (typical: 10–20).</div>
              <div><b>Why it reduces variance:</b> Stops the model from memorizing training noise that accumulates in later epochs.</div>
            </div>
          )}

          {subhead("Comparison")}
          {tbl(
            <>
              <thead>
                <tr>
                  {th("Method")}{th("Adds bias")}{th("Reduces variance")}{th("Sparse weights")}{th("Applies to")}
                </tr>
              </thead>
              <tbody>
                <tr>{td("L2 Ridge")}{td("Yes")}{td("Yes")}{td("No")}{td("All differentiable models")}</tr>
                <tr>{td("L1 Lasso")}{td("Yes")}{td("Yes")}{td("Yes")}{td("Linear models")}</tr>
                <tr>{td("Dropout")}{td("Slight")}{td("Yes")}{td("No")}{td("Neural networks")}</tr>
                <tr>{td("Early stopping")}{td("Slight")}{td("Yes")}{td("No")}{td("Iterative models")}</tr>
                <tr>{td("Data augmentation")}{td("No")}{td("Yes")}{td("No")}{td("Images, text")}</tr>
                <tr>{td("Cross-validation")}{td("No")}{td("No (eval only)")}{td("No")}{td("All models (evaluation)")}</tr>
              </tbody>
            </>
          )}
        </>
      )
    },

    // ─── STAGE 12: Practical Decision Guide ──────────────────────────────────
    {
      id: "guide",
      group: "Practical",
      title: "Practical Decision Guide",
      map: "Guide",
      why: "Turn the theory into a repeatable diagnostic process.",
      render: () => (
        <>
          <Lead>
            A systematic 5-step process to diagnose and fix any bias or variance problem.
          </Lead>

          {subhead("The 5-Step Diagnostic Process")}
          {[
            {
              n:"Step 1", title:"Establish baseline metrics",
              body:"Train/validation accuracy on a held-out set. Record both. Always use the same evaluation metric throughout diagnosis."
            },
            {
              n:"Step 2", title:"Plot learning curves",
              body:"Generate train vs. validation performance across training set sizes. This immediately tells you: both high (bias), large gap (variance), both low (good)."
            },
            {
              n:"Step 3", title:"Identify which problem dominates",
              body:"Train accuracy < 85% AND val accuracy ≈ train accuracy → High Bias (underfitting). Train accuracy > 95% AND val accuracy << train accuracy → High Variance (overfitting). Both decent but not great → Try both fixes, monitor validation."
            },
            {
              n:"Step 4", title:"Apply the targeted fix",
              body:"For high bias: more complex model, more features, less regularization. For high variance: regularization (L1/L2/dropout), more data, early stopping, ensemble."
            },
            {
              n:"Step 5", title:"Verify improvement",
              body:"Re-check both train and validation accuracy. Confirm the right problem was fixed. Iterate."
            }
          ].map(({ n, title, body }) => (
            card(
              <div key={n}>
                <div style={{ fontWeight:700, fontSize:14, color:"var(--accent)", marginBottom:4 }}>
                  {n}: {title}
                </div>
                <div style={{ fontSize:13, lineHeight:1.7 }}>{body}</div>
              </div>
            )
          ))}

          {subhead("Quick Reference Card")}
          {tbl(
            <>
              <thead>
                <tr>{th("Symptom")}{th("Problem")}{th("Top 3 fixes")}</tr>
              </thead>
              <tbody>
                <tr>{td("Both train and val accuracy low")}{td("High bias")}{td("1) More complex model   2) More features   3) Less regularization")}</tr>
                <tr>{td("Train accuracy high, val low")}{td("High variance")}{td("1) More data   2) Regularization   3) Early stopping")}</tr>
                <tr>{td("Both high but training very slowly")}{td("Need longer training")}{td("Increase epochs / trees")}</tr>
                <tr>{td("Both slowly improving together")}{td("Need more data")}{td("Collect more training samples")}</tr>
                <tr>{td("Val accuracy jumps around")}{td("High variance + small dataset")}{td("k-fold CV + ensemble")}</tr>
              </tbody>
            </>
          )}

          {subhead("The Golden Rules")}
          {[
            "Always check training accuracy before validation accuracy. If training accuracy is poor, stop — regularization won't help. The model needs more capacity.",
            "Never tune hyperparameters on the test set. Use a validation set or k-fold CV. The test set measures final generalization — use it exactly once.",
            "When in doubt about which problem you have: plot learning curves. They never lie.",
            "The sweet spot moves with data size. With 1,000 samples, a degree-3 polynomial is perfect. With 1M samples, a degree-10 polynomial is fine. More data allows more complexity without overfitting."
          ].map((rule, i) => (
            info(<span key={i}><b>Rule {i+1}:</b> {rule}</span>)
          ))}

          {subhead("Full Framework Summary")}
          {tbl(
            <>
              <thead>
                <tr>
                  {th("")}{th("Underfitting (High Bias)")}{th("Overfitting (High Variance)")}
                </tr>
              </thead>
              <tbody>
                <tr>{td("Symptom", { fontWeight:700 })}{td("Both train and val loss are high")}{td("Train loss low, val loss high")}</tr>
                <tr>{td("Root cause", { fontWeight:700 })}{td("Model too simple for the data")}{td("Model too complex for data size")}</tr>
                <tr>{td("Learning curves", { fontWeight:700 })}{td("Converge high and early")}{td("Training low, large gap to val")}</tr>
                <tr>{td("Fix", { fontWeight:700 })}{td("More complex model, more features")}{td("Regularization, more data, simpler model")}</tr>
                <tr>{td("What NOT to do", { fontWeight:700 })}{td("Add more regularization")}{td("Add model capacity")}</tr>
                <tr>{td("Key metric", { fontWeight:700 })}{td("Training accuracy (should be higher first)")}{td("Train/val gap (should be small)")}</tr>
              </tbody>
            </>
          )}
        </>
      )
    }

  ]; // end STAGES

  // ── Expose ──
  window.ML_META = {
    title: "Bias-Variance Tradeoff",
    subtitle: "Underfitting, overfitting, and how to fix both",
    cur: "Bias-Variance",
    category: "ML Fundamentals",
    run: () => ({}),
    default: {},
    renderInput: null,
    modeLinks: []
  };
  window.ML_STAGES = STAGES;

})();
