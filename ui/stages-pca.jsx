/* ============================================================
   PCA — stages-pca.jsx  (10 stages)
   Requires: window.ML_PCA (from model/ml-pca.js)
             window.{ Matrix, V, Sub, Sup, Formula, Lead, Note,
                      Row, Arrow, Tag, fmt } (from matrix.jsx)
   ============================================================ */
(function () {
  const { V, Sub, Sup, Formula, Lead, Note, Row, Arrow, Tag, fmt } = window;
  // const { useState } = React;  // unused after removing showFormula state
  const { DATA, runPCA } = window.ML_PCA;

  // Pre-compute PCA trace once at load time
  const T = runPCA();

  // ── Colour palette ──
  const COLORS = {
    alice: "#2B5BFF",
    bob:   "#f59e0b",
    carol: "#1f9e6b",
    david: "#e0492e",
    eve:   "#7c5cff",
    frank: "#94A2BC",
  };
  const PT_COLORS = [COLORS.alice, COLORS.bob, COLORS.carol, COLORS.david, COLORS.eve, COLORS.frank];

  // ── Scatter plot SVG: Math (x) vs Physics (y) ──
  // viewBox 0 0 400 320
  const SW = 400, SH = 320;
  const SPAD = { l: 48, r: 20, t: 20, b: 48 };
  const xMinS = 55, xMaxS = 97, yMinS = 57, yMaxS = 95;
  const ssx = v => SPAD.l + ((v - xMinS) / (xMaxS - xMinS)) * (SW - SPAD.l - SPAD.r);
  const ssy = v => SPAD.t + (1 - (v - yMinS) / (yMaxS - yMinS)) * (SH - SPAD.t - SPAD.b);

  function ScatterAxes() {
    const xTicks = [60, 65, 70, 75, 80, 85, 90, 95];
    const yTicks = [60, 65, 70, 75, 80, 85, 90, 95];
    return (
      <>
        {yTicks.map(v => (
          <line key={v} x1={SPAD.l} y1={ssy(v)} x2={SW - SPAD.r} y2={ssy(v)}
            stroke="var(--line)" strokeWidth="0.5" strokeDasharray="3 3" />
        ))}
        <line x1={SPAD.l} y1={SH - SPAD.b} x2={SW - SPAD.r} y2={SH - SPAD.b}
          stroke="var(--ink)" strokeWidth="1.4" />
        <line x1={SPAD.l} y1={SPAD.t} x2={SPAD.l} y2={SH - SPAD.b}
          stroke="var(--ink)" strokeWidth="1.4" />
        {xTicks.map(v => (
          <g key={v}>
            <line x1={ssx(v)} y1={SH - SPAD.b} x2={ssx(v)} y2={SH - SPAD.b + 4}
              stroke="var(--ink)" strokeWidth="1" />
            <text x={ssx(v)} y={SH - SPAD.b + 15} textAnchor="middle" fontSize="10"
              fill="var(--muted)">{v}</text>
          </g>
        ))}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={SPAD.l - 4} y1={ssy(v)} x2={SPAD.l} y2={ssy(v)}
              stroke="var(--ink)" strokeWidth="1" />
            <text x={SPAD.l - 7} y={ssy(v) + 4} textAnchor="end" fontSize="10"
              fill="var(--muted)">{v}</text>
          </g>
        ))}
        <text x={(SPAD.l + SW - SPAD.r) / 2} y={SH - 6} textAnchor="middle"
          fontSize="11" fill="var(--muted)">Math score</text>
        <text x={12} y={(SPAD.t + SH - SPAD.b) / 2} textAnchor="middle"
          fontSize="11" fill="var(--muted)"
          transform={`rotate(-90, 12, ${(SPAD.t + SH - SPAD.b) / 2})`}>Physics score</text>
      </>
    );
  }

  function ScatterDots({ data = T.X, showLabels = true }) {
    return (
      <>
        {data.map(([mx, py], i) => {
          const cx = ssx(mx), cy = ssy(py);
          const col = PT_COLORS[i];
          const label = T.students[i];
          // nudge labels to avoid axis overlap
          const offX = mx > 80 ? 8 : -8;
          const anchor = mx > 80 ? "start" : "end";
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="5.5" fill={col} opacity="0.9"
                stroke="white" strokeWidth="1.2" />
              {showLabels && (
                <text x={cx + offX} y={cy + 4} fontSize="10" fill={col}
                  textAnchor={anchor} fontWeight="600">{label}</text>
              )}
            </g>
          );
        })}
      </>
    );
  }

  // ── Stage table helper ──
  function StyledTable({ headers, rows, accentCol = null }) {
    return (
      <div style={{ overflowX: "auto", margin: "12px 0" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", minWidth: 400 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--line)" }}>
              {headers.map((h, i) => (
                <th key={i} style={{
                  padding: "7px 10px", textAlign: i === 0 ? "left" : "right",
                  color: "var(--muted)", fontWeight: 700, whiteSpace: "nowrap"
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: "6px 10px",
                    textAlign: ci === 0 ? "left" : "right",
                    fontFamily: ci > 0 ? "var(--num-font)" : "inherit",
                    fontSize: 13,
                    color: (accentCol !== null && ci === accentCol)
                      ? "var(--accent-ink)" : "var(--ink)",
                    fontWeight: (accentCol !== null && ci === accentCol) ? 700 : 400,
                  }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Colour square helper ──
  function Swatch({ color }) {
    return <span style={{
      display: "inline-block", width: 10, height: 10,
      borderRadius: 2, background: color, marginRight: 5, verticalAlign: "middle"
    }} />;
  }

  // ────────────────────────────────────────────────────────
  //  STAGE 1: Overview
  // ────────────────────────────────────────────────────────
  const stageOverview = {
    id: "overview", group: "Overview", title: "What PCA does — in one sentence",
    map: "Overview",
    why: "PCA is the most widely-used dimensionality reduction algorithm. Before diving into the math, you need an intuition for what 'principal component' actually means.",
    render: () => (
      <>
        <Lead>
          PCA finds the directions of maximum variance in your data and rotates the coordinate system
          to align with those directions. The first principal component is the axis that captures the
          most variation; the second captures the most remaining variation, and so on.
        </Lead>

        <div style={{ margin: "18px 0 10px" }}>
          <div className="tf-subhead">The core intuition</div>
          <div style={{
            background: "rgba(43,91,255,.06)", borderRadius: 10,
            padding: "14px 16px", border: "1.5px solid rgba(43,91,255,.2)", marginBottom: 14
          }}>
            <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.8 }}>
              Imagine you're taking a photo of a long, thin object lying on a table at an angle.
              PCA finds the angle that makes the photo look <b>widest</b> — the projection that captures
              the most "spread". Then it takes a second photo <b>perpendicular</b> to the first, capturing
              what the first missed. Each subsequent photo is perpendicular to all previous ones.
            </div>
          </div>
        </div>

        <div style={{ margin: "18px 0 10px" }}>
          <div className="tf-subhead">Why we need PCA</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10 }}>
            {[
              {
                title: "1 · Curse of dimensionality",
                color: "#e0492e",
                body: "In 1000D, all points are equally far apart — distances become meaningless. ML models struggle to find patterns when the data is too sparse across too many dimensions."
              },
              {
                title: "2 · Multicollinearity",
                color: "#f59e0b",
                body: "Highly correlated features carry redundant information. Including both Math and Physics scores (r=0.997) doesn't add signal — it just adds noise and instability."
              },
              {
                title: "3 · Visualization",
                color: "#1f9e6b",
                body: "You can't visualize 50D data. Project to 2D principal components for cluster visualization — you keep the directions of maximum spread."
              },
              {
                title: "4 · Compression",
                color: "#7c5cff",
                body: "Store 2 principal components instead of 10 correlated features. This reduces memory, speeds up training, and can improve generalization by removing noise."
              },
            ].map(({ title, color, body }) => (
              <div key={title} style={{
                background: `${color}10`, borderRadius: 10,
                padding: "12px 14px", border: `1px solid ${color}30`
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.7 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ margin: "18px 0 10px" }}>
          <div className="tf-subhead">Our toy dataset — 6 students, 2 scores</div>
          <Lead>
            6 students each have a Math score and a Physics score. The scores are highly correlated —
            students good at Math tend to be good at Physics. The scatter plot below shows the
            characteristic <b>diagonal line pattern</b> of correlated features.
          </Lead>
          <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
            <svg viewBox={`0 0 ${SW} ${SH}`} width="100%" style={{ maxWidth: SW }}>
              <ScatterAxes />
              <ScatterDots />
              {/* Diagonal trend line from (58,59) to (93,91) */}
              <line x1={ssx(58)} y1={ssy(59)} x2={ssx(93)} y2={ssy(91)}
                stroke="var(--accent)" strokeWidth="1.4" strokeDasharray="5 4" opacity="0.4" />
              <text x={ssx(93) + 5} y={ssy(91)} fontSize="10" fill="var(--accent)"
                opacity="0.6">trend</text>
            </svg>
          </div>
          <StyledTable
            headers={["Student", "Math", "Physics"]}
            rows={T.students.map((s, i) => [
              <span key={s}><Swatch color={PT_COLORS[i]} />{s}</span>,
              T.X[i][0],
              T.X[i][1],
            ])}
          />
        </div>

        <Note>
          The diagonal clustering in the scatter plot is the visual signature of correlated features.
          PCA will find that diagonal axis and use it as PC1 — capturing almost all the variance in
          a single number per student.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 2: Correlation = Redundancy
  // ────────────────────────────────────────────────────────
  const stageCorrelation = {
    id: "correlation", group: "Intuition", title: "Correlated features = redundant information",
    map: "Intuition",
    why: "Before the math, see intuitively why two correlated features are really just one.",
    render: () => (
      <>
        <Lead>
          If Math score perfectly predicts Physics score, you don't need both features — one number
          tells the full story. PCA exploits this: when features are correlated, fewer dimensions
          can capture almost all the variance.
        </Lead>

        <div style={{
          background: "rgba(43,91,255,.06)", borderRadius: 10,
          padding: "14px 16px", border: "1.5px solid rgba(43,91,255,.2)", margin: "14px 0"
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>
            r = 0.997 between Math and Physics
          </div>
          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.8 }}>
            This means 99.4% of the variance in Physics is explained by Math (r²=0.994). Two features,
            but essentially <b>one dimension</b> of useful information. The second dimension — the
            "Math minus Physics" direction — accounts for tiny random fluctuations only.
          </div>
        </div>

        <div style={{ margin: "18px 0 10px" }}>
          <div className="tf-subhead">The "one number" idea</div>
          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.8, marginBottom: 12 }}>
            If you know a student's <b>PC1 score</b> (their position along the diagonal), you know
            almost everything about both their Math and Physics scores. PC2 tells you almost nothing
            new (0.15% variance). PCA identifies this and lets you discard PC2 without information loss.
          </div>
        </div>

        <div style={{ margin: "18px 0 10px" }}>
          <div className="tf-subhead">PC1 and PC2 axes visualized</div>
          <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
            <svg viewBox={`0 0 ${SW} ${SH}`} width="100%" style={{ maxWidth: SW }}>
              <ScatterAxes />
              <ScatterDots showLabels={false} />
              {/* PC1 axis: diagonal direction through centroid (76.67, 77.33) */}
              {(() => {
                const cx = ssx(76.67), cy = ssy(77.33);
                // PC1 = [0.707, 0.707] in std space; in original space it's along the diagonal
                // Draw a long arrow in the Math=Physics direction (scaled by ~18 units in original space)
                const dx = ssx(76.67 + 17) - ssx(76.67);
                const dy = ssy(77.33 + 17) - ssy(77.33);
                return (
                  <>
                    {/* PC1 arrow */}
                    <line x1={cx - dx * 1.6} y1={cy - dy * 1.6}
                      x2={cx + dx * 1.6} y2={cy + dy * 1.6}
                      stroke="#2B5BFF" strokeWidth="2.5" markerEnd="url(#arr-pc1)" />
                    <defs>
                      <marker id="arr-pc1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="#2B5BFF" />
                      </marker>
                      <marker id="arr-pc2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="#e0492e" />
                      </marker>
                    </defs>
                    {/* PC2 arrow: perpendicular (Math↑, Physics↓) */}
                    <line x1={cx + dy * 0.7} y1={cy - dx * 0.7}
                      x2={cx - dy * 0.7} y2={cy + dx * 0.7}
                      stroke="#e0492e" strokeWidth="1.5" strokeDasharray="5 3"
                      markerEnd="url(#arr-pc2)" />
                    {/* Labels */}
                    <text x={cx + dx * 1.65 + 4} y={cy + dy * 1.65} fontSize="11"
                      fill="#2B5BFF" fontWeight="700">PC1 (99.85%)</text>
                    <text x={cx - dy * 0.75} y={cy + dx * 0.75 + 14} fontSize="10"
                      fill="#e0492e" fontWeight="600">PC2 (0.15%)</text>
                  </>
                );
              })()}
            </svg>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>
            PC1 (blue arrow) captures the diagonal spread. PC2 (red dashed) is nearly zero length — almost no variance in this direction.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "14px 0" }}>
          <div style={{ background: "rgba(43,91,255,.08)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(43,91,255,.25)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#2B5BFF", marginBottom: 4 }}>PC1 direction</div>
            <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.7 }}>
              [0.707, 0.707] = "Math + Physics" direction. A high PC1 score means the student
              is above average in <i>both</i> subjects. This is the "academic ability" axis.
            </div>
          </div>
          <div style={{ background: "rgba(224,73,46,.08)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(224,73,46,.25)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e0492e", marginBottom: 4 }}>PC2 direction</div>
            <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.7 }}>
              [0.707, −0.707] = "Math − Physics" direction. A high PC2 score means the student
              is relatively stronger in Math than Physics. Only 0.15% variance here.
            </div>
          </div>
        </div>

        <Note>
          The ratio of eigenvalues (1.997 : 0.003) quantifies the redundancy. If both eigenvalues
          were equal (1.0 : 1.0), the features would be completely uncorrelated and PCA would provide
          no compression benefit.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 3: Standardize
  // ────────────────────────────────────────────────────────
  const stageStandardize = {
    id: "standardize", group: "Step by Step", title: "Step 1 · Standardize (mean=0, std=1)",
    map: "Step 1",
    why: "Standardization is the most commonly skipped step — and the source of many PCA bugs. A feature measured in thousands will dominate PCA simply because of its scale.",
    render: () => {
      return (
        <>
          <Lead>
            Before PCA, we standardize each feature to <b>mean=0, std=1</b>. This ensures features
            with larger scales (income in thousands vs. age in tens) don't dominate the principal
            components just because of their magnitude — not because they carry more information.
          </Lead>

          <div style={{ margin: "14px 0 8px" }}>
            <div className="tf-subhead">Standardization formula</div>
            <div style={{
              fontFamily: "var(--num-font)", fontSize: 14,
              background: "var(--panel-solid)", borderRadius: 8,
              padding: "10px 16px", border: "1px solid var(--line)", display: "inline-block"
            }}>
              z = (x − μ) / σ
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
              μ = feature mean, σ = feature standard deviation (using n−1 denominator = sample std)
            </div>
          </div>

          <div style={{ margin: "14px 0 8px" }}>
            <div className="tf-subhead">Feature statistics</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Math", mean: "76.67", std: "10.80", color: "#2B5BFF" },
                { label: "Physics", mean: "77.33", std: "9.85", color: "#1f9e6b" },
              ].map(({ label, mean, std, color }) => (
                <div key={label} style={{
                  background: `${color}10`, borderRadius: 10, padding: "10px 16px",
                  border: `1px solid ${color}30`, minWidth: 160
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.8 }}>
                    μ = {mean}<br />σ = {std}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ margin: "14px 0 8px" }}>
            <div className="tf-subhead">Standardized values — all 6 students</div>
            <StyledTable
              headers={["Student", "Math", "Physics", "Math std", "Physics std"]}
              rows={T.students.map((s, i) => [
                <span key={s}><Swatch color={PT_COLORS[i]} />{s}</span>,
                T.X[i][0],
                T.X[i][1],
                fmt(T.X_std[i][0], 3),
                fmt(T.X_std[i][1], 3),
              ])}
            />
          </div>

          <div style={{ margin: "14px 0 8px" }}>
            <div className="tf-subhead">Step-by-step for Alice (Math=90)</div>
            <div style={{
              fontFamily: "var(--num-font)", fontSize: 13, lineHeight: 2,
              background: "var(--panel-solid)", borderRadius: 8,
              padding: "10px 16px", border: "1px solid var(--line)"
            }}>
              z = (90 − 76.67) / 10.80 = 13.33 / 10.80 = <b style={{ color: "#2B5BFF" }}>1.234</b><br />
              Physics: z = (88 − 77.33) / 9.85 = 10.67 / 9.85 = <b style={{ color: "#1f9e6b" }}>1.083</b>
            </div>
          </div>

          <div style={{ margin: "16px 0 8px" }}>
            <div className="tf-subhead">Standardized scatter</div>
            <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
              {(() => {
                const W2 = 360, H2 = 280;
                const P2 = { l: 44, r: 20, t: 20, b: 44 };
                const mn = -2, mx = 2;
                const sx2 = v => P2.l + ((v - mn) / (mx - mn)) * (W2 - P2.l - P2.r);
                const sy2 = v => P2.t + (1 - (v - mn) / (mx - mn)) * (H2 - P2.t - P2.b);
                const ticks = [-2, -1, 0, 1, 2];
                return (
                  <svg viewBox={`0 0 ${W2} ${H2}`} width="100%" style={{ maxWidth: W2 }}>
                    {ticks.map(v => (
                      <line key={v} x1={P2.l} y1={sy2(v)} x2={W2 - P2.r} y2={sy2(v)}
                        stroke="var(--line)" strokeWidth="0.5" strokeDasharray="3 3" />
                    ))}
                    {/* zero lines */}
                    <line x1={P2.l} y1={sy2(0)} x2={W2 - P2.r} y2={sy2(0)}
                      stroke="var(--muted)" strokeWidth="1" opacity="0.5" />
                    <line x1={sx2(0)} y1={P2.t} x2={sx2(0)} y2={H2 - P2.b}
                      stroke="var(--muted)" strokeWidth="1" opacity="0.5" />
                    <line x1={P2.l} y1={H2 - P2.b} x2={W2 - P2.r} y2={H2 - P2.b}
                      stroke="var(--ink)" strokeWidth="1.4" />
                    <line x1={P2.l} y1={P2.t} x2={P2.l} y2={H2 - P2.b}
                      stroke="var(--ink)" strokeWidth="1.4" />
                    {ticks.map(v => (
                      <g key={v}>
                        <line x1={sx2(v)} y1={H2 - P2.b} x2={sx2(v)} y2={H2 - P2.b + 4}
                          stroke="var(--ink)" strokeWidth="1" />
                        <text x={sx2(v)} y={H2 - P2.b + 15} textAnchor="middle" fontSize="10"
                          fill="var(--muted)">{v}</text>
                        <line x1={P2.l - 4} y1={sy2(v)} x2={P2.l} y2={sy2(v)}
                          stroke="var(--ink)" strokeWidth="1" />
                        <text x={P2.l - 7} y={sy2(v) + 4} textAnchor="end" fontSize="10"
                          fill="var(--muted)">{v}</text>
                      </g>
                    ))}
                    <text x={(P2.l + W2 - P2.r) / 2} y={H2 - 4} textAnchor="middle"
                      fontSize="11" fill="var(--muted)">Math (standardized)</text>
                    <text x={12} y={(P2.t + H2 - P2.b) / 2} textAnchor="middle"
                      fontSize="11" fill="var(--muted)"
                      transform={`rotate(-90, 12, ${(P2.t + H2 - P2.b) / 2})`}>Physics (standardized)</text>
                    {T.X_std.map(([mx2, py2], i) => {
                      const col = PT_COLORS[i];
                      const label = T.students[i];
                      const offX = mx2 > 0 ? 8 : -8;
                      const anchor = mx2 > 0 ? "start" : "end";
                      return (
                        <g key={i}>
                          <circle cx={sx2(mx2)} cy={sy2(py2)} r="5.5"
                            fill={col} opacity="0.9" stroke="white" strokeWidth="1.2" />
                          <text x={sx2(mx2) + offX} y={sy2(py2) + 4}
                            fontSize="10" fill={col} textAnchor={anchor} fontWeight="600">{label}</text>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
              After standardization, both axes have the same scale. The shape of the cloud is identical — only the units changed.
            </div>
          </div>

          <Note>
            PCA requires standardization when features have different scales. Skip standardization
            only when all features are already on the same scale (e.g., pixel intensities in a greyscale image,
            or features you've deliberately left in their natural units for interpretability).
          </Note>
        </>
      );
    },
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 4: Covariance Matrix
  // ────────────────────────────────────────────────────────
  const stageCovariance = {
    id: "covariance", group: "Step by Step", title: "Step 2 · Compute the Covariance Matrix",
    map: "Step 2",
    why: "The covariance matrix is the bridge between raw data and eigendecomposition. Every PCA textbook glosses over the actual numbers — we'll compute every cell.",
    render: () => (
      <>
        <Lead>
          The covariance matrix tells us how features vary together. The <b>diagonal</b> is each
          feature's variance (1.0 after standardization). The <b>off-diagonal</b> is the covariance
          between features — high covariance means they move together.
        </Lead>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">What covariance means, concretely</div>
          <div style={{
            background: "rgba(31,158,107,.07)", borderRadius: 10,
            padding: "14px 16px", border: "1.5px solid rgba(31,158,107,.25)"
          }}>
            <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.8 }}>
              <b>Cov(Math, Physics) = 0.990</b> means: when a student's Math score is above average,
              their Physics score is almost always above average by a similar amount.
              The two features co-vary almost perfectly. A covariance of 0 would mean no relationship;
              1.0 (for standardized data) means a perfect linear relationship.
            </div>
          </div>
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Formula</div>
          <div style={{
            fontFamily: "var(--num-font)", fontSize: 13,
            background: "var(--panel-solid)", borderRadius: 8,
            padding: "10px 16px", border: "1px solid var(--line)", marginBottom: 8
          }}>
            C = (1/(n−1)) × X_std<sup>T</sup> × X_std
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            n = 6 students, X_std is 6×2, so C is 2×2.
            The (i,j) entry of C is the sample covariance between feature i and feature j.
          </div>
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Computing each cell (n−1 = 5)</div>
          <div style={{
            fontFamily: "var(--num-font)", fontSize: 12, lineHeight: 2,
            background: "var(--panel-solid)", borderRadius: 8,
            padding: "10px 16px", border: "1px solid var(--line)"
          }}>
            C[0,0] = Σ(math_std²) / 5<br />
            &nbsp;&nbsp;= (1.234² + 0.309² + 0.772² + 0.617² + 0.154² + 1.543²) / 5<br />
            &nbsp;&nbsp;= (1.523 + 0.096 + 0.596 + 0.381 + 0.024 + 2.381) / 5<br />
            &nbsp;&nbsp;= 5.000 / 5 = <b style={{ color: "#2B5BFF" }}>1.000</b><br /><br />
            C[0,1] = C[1,0] = Σ(math_std × physics_std) / 5<br />
            &nbsp;&nbsp;= (1.234×1.083 + 0.309×0.474 + 0.772×0.880 + … ) / 5<br />
            &nbsp;&nbsp;≈ <b style={{ color: "#1f9e6b" }}>0.990</b><br /><br />
            C[1,1] = Σ(physics_std²) / 5 = <b style={{ color: "#7c5cff" }}>1.000</b>
          </div>
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Covariance matrix — heat map</div>
          {(() => {
            const C = T.covMatrix;
            const labels = ["Math", "Physics"];
            const maxVal = 1.0;
            return (
              <div style={{ margin: "10px 0" }}>
                <div style={{ display: "inline-block" }}>
                  {/* Column headers */}
                  <div style={{ display: "flex", paddingLeft: 80 }}>
                    {labels.map(l => (
                      <div key={l} style={{
                        width: 90, textAlign: "center", fontSize: 11,
                        color: "var(--muted)", fontWeight: 700, paddingBottom: 4
                      }}>{l}</div>
                    ))}
                  </div>
                  {C.map((row, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                      <div style={{
                        width: 72, textAlign: "right", paddingRight: 10,
                        fontSize: 11, color: "var(--muted)", fontWeight: 700
                      }}>{labels[i]}</div>
                      {row.map((v, j) => {
                        const alpha = 0.15 + (Math.abs(v) / maxVal) * 0.65;
                        const bg = v >= 0.99 ? `rgba(43,91,255,${alpha})` : `rgba(31,158,107,${alpha})`;
                        return (
                          <div key={j} style={{
                            width: 90, height: 52, display: "flex",
                            alignItems: "center", justifyContent: "center",
                            background: bg, border: "1px solid var(--line)",
                            borderRadius: 6, marginRight: 4,
                            fontFamily: "var(--num-font)", fontSize: 14, fontWeight: 700,
                            color: "var(--ink)"
                          }}>{fmt(v, 3)}</div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                  Diagonal = variance (always 1.0 after standardization). Off-diagonal = covariance = 0.990 (near-perfect correlation).
                </div>
              </div>
            );
          })()}
        </div>

        <Note>
          For d features, the covariance matrix is d×d. For 100 features, it's 100×100 = 10,000 values.
          Computing the full covariance matrix costs O(n·d²) — for very high-dimensional data (images,
          text embeddings), the randomized SVD approach skips this step entirely.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 5: Eigendecomposition
  // ────────────────────────────────────────────────────────
  const stageEigen = {
    id: "eigen", group: "Step by Step", title: "Step 3 · Eigenvalues & Eigenvectors",
    map: "Step 3",
    why: "Eigendecomposition is the mathematical core of PCA. Most explanations hand-wave the derivation. We'll do it step by step with the actual numbers.",
    render: () => (
      <>
        <Lead>
          Eigendecomposition finds the "natural axes" of the covariance matrix — directions where
          the data has maximum variance (<b>eigenvectors</b>) and how much variance each direction
          captures (<b>eigenvalues</b>).
        </Lead>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Intuition before math</div>
          <div style={{
            background: "rgba(124,92,255,.07)", borderRadius: 10,
            padding: "14px 16px", border: "1.5px solid rgba(124,92,255,.2)"
          }}>
            <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.8 }}>
              An eigenvector <b>v</b> of matrix C satisfies: <b>C × v = λ × v</b>.<br />
              This means: multiplying C by v just <i>scales</i> v by λ — it doesn't rotate it.
              These are the special directions where the covariance has pure scaling (no rotation).
              For PCA, these are the principal component axes — the directions of maximum spread
              in the data.
            </div>
          </div>
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Step 1 — Find eigenvalues: det(C − λI) = 0</div>
          <div style={{
            fontFamily: "var(--num-font)", fontSize: 12, lineHeight: 2.1,
            background: "var(--panel-solid)", borderRadius: 8,
            padding: "10px 16px", border: "1px solid var(--line)"
          }}>
            C = [[1.000, 0.990], [0.990, 1.000]]<br /><br />
            det(C − λI) = det([[1−λ, 0.990], [0.990, 1−λ]])<br />
              = (1−λ)² − 0.990² = 0<br />
              = 1 − 2λ + λ² − 0.980 = 0<br />
              = λ² − 2λ + 0.010 = 0<br /><br />
            Using the quadratic formula: λ = (2 ± √(4 − 4×0.010)) / 2<br />
              = (2 ± √(3.960)) / 2<br />
              = (2 ± 1.990) / 2<br /><br />
            <b style={{ color: "#2B5BFF" }}>λ₁ = (2 + 1.990) / 2 = 1.990</b>  ← PC1 eigenvalue<br />
            <b style={{ color: "#e0492e" }}>λ₂ = (2 − 1.990) / 2 = 0.010</b>  ← PC2 eigenvalue
          </div>
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Step 2 — Find eigenvectors: (C − λᵢI)v = 0</div>
          <div style={{
            fontFamily: "var(--num-font)", fontSize: 12, lineHeight: 2.1,
            background: "var(--panel-solid)", borderRadius: 8,
            padding: "10px 16px", border: "1px solid var(--line)"
          }}>
            <b style={{ color: "#2B5BFF" }}>For λ₁ = 1.997:</b><br />
            (C − 1.990·I) = [[1−1.990, 0.990], [0.990, 1−1.990]]<br />
                          = [[−0.990, 0.990], [0.990, −0.990]]<br />
            Row 1: −0.990·v₁ + 0.990·v₂ = 0 → v₁ = v₂<br />
            Normalized: <b>PC1 = [1/√2, 1/√2] = [0.707, 0.707]</b><br /><br />
            <b style={{ color: "#e0492e" }}>For λ₂ = 0.003:</b><br />
            (C − 0.010·I) = [[0.990, 0.990], [0.990, 0.990]]<br />
            Row 1: 0.990·v₁ + 0.990·v₂ = 0 → v₁ = −v₂<br />
            Normalized: <b>PC2 = [1/√2, −1/√2] = [0.707, −0.707]</b>
          </div>
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">What the eigenvectors mean</div>
          <StyledTable
            headers={["Principal Component", "Direction vector", "Meaning"]}
            rows={[
              ["PC1 (λ=1.997)", "[0.707, 0.707]", "Equally weighted Math + Physics — the \"overall ability\" axis"],
              ["PC2 (λ=0.003)", "[0.707, −0.707]", "Math minus Physics — relative strength difference"],
            ]}
          />
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Verification: C × PC1 = λ₁ × PC1</div>
          <div style={{
            fontFamily: "var(--num-font)", fontSize: 12, lineHeight: 2.1,
            background: "var(--panel-solid)", borderRadius: 8,
            padding: "10px 16px", border: "1px solid var(--line)"
          }}>
            [[1.000, 0.990], [0.990, 1.000]] × [0.707, 0.707]<br />
            &nbsp;= [1.000×0.707 + 0.990×0.707, 0.990×0.707 + 1.000×0.707]<br />
            &nbsp;= [0.707 + 0.700, 0.700 + 0.707]<br />
            &nbsp;= [1.407, 1.407]<br />
            &nbsp;= 1.990 × [0.707, 0.707] ✓
          </div>
        </div>

        <Note>
          For d features, computing the full eigendecomposition costs O(d³). For d=10,000 (e.g.,
          image patches), this is prohibitive. sklearn uses the Halko randomized SVD algorithm,
          which approximates the top k eigenvalues/vectors in O(n·d·k) time — much faster.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 6: Explained Variance
  // ────────────────────────────────────────────────────────
  const stageVariance = {
    id: "variance", group: "Step by Step", title: "Step 4 · Explained Variance Ratio",
    map: "Step 4",
    why: "The explained variance ratio is the key metric for deciding how many components to keep. Learn to read it correctly.",
    render: () => (
      <>
        <Lead>
          Each eigenvalue tells us how much variance the corresponding principal component captures.
          By sorting eigenvalues from largest to smallest, we rank principal components by importance.
        </Lead>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">The calculation</div>
          <div style={{
            fontFamily: "var(--num-font)", fontSize: 13, lineHeight: 2.2,
            background: "var(--panel-solid)", borderRadius: 8,
            padding: "10px 16px", border: "1px solid var(--line)"
          }}>
            λ₁ = {fmt(T.eigenvalues[0], 3)},  λ₂ = {fmt(T.eigenvalues[1], 3)}<br />
            Total variance = λ₁ + λ₂ = {fmt(T.totalVar, 3)}<br /><br />
            PC1 explains: {fmt(T.eigenvalues[0], 3)} / {fmt(T.totalVar, 3)} = <b style={{ color: "#2B5BFF" }}>{(T.evr[0] * 100).toFixed(2)}%</b><br />
            PC2 explains: {fmt(T.eigenvalues[1], 3)} / {fmt(T.totalVar, 3)} = <b style={{ color: "#e0492e" }}>{(T.evr[1] * 100).toFixed(2)}%</b>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.8, marginTop: 10 }}>
            PC1 alone explains <b>{(T.evr[0] * 100).toFixed(2)}%</b> of the variance.
            We can drop PC2 with almost zero information loss.
          </div>
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Explained variance — bar chart</div>
          {(() => {
            const BW = 360, BH = 100;
            const barH = 28, gap = 16, leftPad = 48;
            const evrs = [T.evr[0], T.evr[1]];
            const labels = ["PC1", "PC2"];
            const colors = ["#2B5BFF", "#e0492e"];
            const fullWidth = BW - leftPad - 80;
            return (
              <svg viewBox={`0 0 ${BW} ${BH}`} width="100%" style={{ maxWidth: BW }}>
                {evrs.map((v, i) => {
                  const y = 12 + i * (barH + gap);
                  const bw = v * fullWidth;
                  return (
                    <g key={i}>
                      <text x={leftPad - 6} y={y + barH / 2 + 5} textAnchor="end"
                        fontSize="12" fontWeight="700" fill={colors[i]}>{labels[i]}</text>
                      <rect x={leftPad} y={y} width={fullWidth} height={barH}
                        fill="var(--line-soft)" rx="4" />
                      <rect x={leftPad} y={y} width={bw} height={barH}
                        fill={colors[i]} rx="4" opacity="0.85" />
                      <text x={leftPad + bw + 6} y={y + barH / 2 + 5}
                        fontSize="12" fontFamily="var(--num-font)" fill={colors[i]} fontWeight="700">
                        {(v * 100).toFixed(2)}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            );
          })()}
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">The scree plot concept</div>
          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.8, marginBottom: 8 }}>
            For larger datasets with many components, the "scree plot" (eigenvalue vs. component number)
            shows the elbow where adding more components gives diminishing returns. You keep components
            up to the elbow. For our 2-feature dataset, the elbow is obvious after component 1.
          </div>
          {(() => {
            const W3 = 320, H3 = 160;
            const P3 = { l: 48, r: 20, t: 20, b: 44 };
            const evals = [T.eigenvalues[0], T.eigenvalues[1]];
            const sx3 = v => P3.l + ((v - 0.5) / 2) * (W3 - P3.l - P3.r);
            const sy3 = v => P3.t + (1 - v / 2.2) * (H3 - P3.t - P3.b);
            return (
              <svg viewBox={`0 0 ${W3} ${H3}`} width="100%" style={{ maxWidth: W3 }}>
                {[0, 0.5, 1.0, 1.5, 2.0].map(v => (
                  <line key={v} x1={P3.l} y1={sy3(v)} x2={W3 - P3.r} y2={sy3(v)}
                    stroke="var(--line)" strokeWidth="0.5" strokeDasharray="3 3" />
                ))}
                <line x1={P3.l} y1={H3 - P3.b} x2={W3 - P3.r} y2={H3 - P3.b}
                  stroke="var(--ink)" strokeWidth="1.4" />
                <line x1={P3.l} y1={P3.t} x2={P3.l} y2={H3 - P3.b}
                  stroke="var(--ink)" strokeWidth="1.4" />
                {[1, 2].map(v => (
                  <g key={v}>
                    <line x1={sx3(v)} y1={H3 - P3.b} x2={sx3(v)} y2={H3 - P3.b + 4}
                      stroke="var(--ink)" strokeWidth="1" />
                    <text x={sx3(v)} y={H3 - P3.b + 15} textAnchor="middle"
                      fontSize="11" fill="var(--muted)">PC{v}</text>
                  </g>
                ))}
                {[0, 0.5, 1.0, 1.5, 2.0].map(v => (
                  <text key={v} x={P3.l - 7} y={sy3(v) + 4} textAnchor="end"
                    fontSize="9" fill="var(--muted)">{v.toFixed(1)}</text>
                ))}
                {/* line connecting eigenvalues */}
                <line x1={sx3(1)} y1={sy3(evals[0])} x2={sx3(2)} y2={sy3(evals[1])}
                  stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2" />
                {evals.map((ev, i) => (
                  <circle key={i} cx={sx3(i + 1)} cy={sy3(ev)} r="5"
                    fill={["#2B5BFF", "#e0492e"][i]} stroke="white" strokeWidth="1.2" />
                ))}
                <text x={(P3.l + W3 - P3.r) / 2} y={H3 - 4}
                  textAnchor="middle" fontSize="11" fill="var(--muted)">Component</text>
                <text x={12} y={(P3.t + H3 - P3.b) / 2} textAnchor="middle"
                  fontSize="11" fill="var(--muted)"
                  transform={`rotate(-90, 12, ${(P3.t + H3 - P3.b) / 2})`}>Eigenvalue</text>
                {/* elbow label */}
                <text x={sx3(1)} y={sy3(evals[0]) - 10} textAnchor="middle"
                  fontSize="10" fill="#2B5BFF" fontWeight="700">1.997</text>
                <text x={sx3(2) + 8} y={sy3(evals[1]) + 4} textAnchor="start"
                  fontSize="10" fill="#e0492e" fontWeight="700">0.003</text>
              </svg>
            );
          })()}
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">How many components to keep? — 3 rules</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              {
                rule: "1 · Variance threshold",
                color: "#2B5BFF",
                body: "Keep enough components to explain 95% (or 99%) of variance. Here: 1 component = 99.85% ✓. In sklearn: PCA(n_components=0.95) auto-selects this."
              },
              {
                rule: "2 · Scree plot elbow",
                color: "#1f9e6b",
                body: "Plot eigenvalues vs. component number. Keep components before the eigenvalues plateau ('the elbow'). For our dataset, the elbow is at component 1."
              },
              {
                rule: "3 · Task-specific",
                color: "#7c5cff",
                body: "For visualization: always use 2 (or 3 for 3D plots). For preprocessing before a classifier: keep as many components as needed for 95–99% variance."
              },
            ].map(({ rule, color, body }) => (
              <div key={rule} style={{
                background: `${color}0e`, borderRadius: 10,
                padding: "10px 14px", border: `1px solid ${color}28`
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{rule}</div>
                <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.7 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>

        <Note>
          Cumulative explained variance: PC1 alone = {(T.evr[0] * 100).toFixed(2)}%.
          PC1 + PC2 = 100% (all variance). For most real datasets, you'll need more than 1 component
          for 95% variance — but rarely more than 50 components for any well-structured dataset.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 7: Projection
  // ────────────────────────────────────────────────────────
  const stageProjection = {
    id: "projection", group: "Step by Step", title: "Step 5 · Project onto Principal Components",
    map: "Step 5",
    why: "Projection is the actual dimensionality reduction step. A 2D data point becomes a 1D score.",
    render: () => (
      <>
        <Lead>
          Projection transforms each data point from the original feature space into the principal
          component space. For each point, we take the <b>dot product</b> with each principal component.
          A 6×2 matrix becomes a 6×1 vector when we keep only PC1.
        </Lead>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Formula</div>
          <div style={{
            fontFamily: "var(--num-font)", fontSize: 13,
            background: "var(--panel-solid)", borderRadius: 8,
            padding: "10px 16px", border: "1px solid var(--line)"
          }}>
            Z = X_std × W<br />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>where W = [PC1 | PC2 | …] — each column is a principal component</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            For 1-component PCA: Z = X_std × PC1  (6×2 matrix × 2-vector = 6-vector of scores)
          </div>
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">PC1 scores — step by step</div>
          <div style={{
            fontFamily: "var(--num-font)", fontSize: 12, lineHeight: 2.0,
            background: "var(--panel-solid)", borderRadius: 8,
            padding: "10px 16px", border: "1px solid var(--line)"
          }}>
            PC1 = [0.707, 0.707]<br /><br />
            Alice:  dot([1.234, 1.083], [0.707, 0.707]) = 0.872 + 0.765 = <b style={{ color: PT_COLORS[0] }}>1.638</b><br />
            Bob:    dot([0.309, 0.444], [0.707, 0.707]) = 0.218 + 0.314 = <b style={{ color: PT_COLORS[1] }}>0.532</b><br />
            Carol:  dot([0.772, 0.820], [0.707, 0.707]) = 0.546 + 0.580 = <b style={{ color: PT_COLORS[2] }}>1.126</b><br />
            David:  dot([−0.617, −0.541], [0.707, 0.707]) = −0.436 − 0.383 = <b style={{ color: PT_COLORS[3] }}>−0.819</b><br />
            Eve:    dot([−0.154, −0.338], [0.707, 0.707]) = −0.109 − 0.239 = <b style={{ color: PT_COLORS[4] }}>−0.348</b><br />
            Frank:  dot([−1.543, −1.556], [0.707, 0.707]) = −1.091 − 1.100 = <b style={{ color: PT_COLORS[5] }}>−2.192</b>
          </div>
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Full score table</div>
          <StyledTable
            headers={["Student", "Math_std", "Physics_std", "PC1 score", "PC2 score"]}
            rows={T.students.map((s, i) => [
              <span key={s}><Swatch color={PT_COLORS[i]} />{s}</span>,
              fmt(T.X_std[i][0], 3),
              fmt(T.X_std[i][1], 3),
              fmt(T.scores_pc1[i], 3),
              fmt(T.scores_pc2[i], 3),
            ])}
            accentCol={3}
          />
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">1D projection — number line</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
            After projecting onto PC1, each student is represented by a single number.
            Frank is weakest (−2.192), Alice is strongest (1.638).
          </div>
          {(() => {
            const NW = 380, NH = 80;
            const pad = 30;
            const minS = -2.4, maxS = 2.0;
            const ns = v => pad + ((v - minS) / (maxS - minS)) * (NW - 2 * pad);
            const axisY = 44;
            return (
              <svg viewBox={`0 0 ${NW} ${NH}`} width="100%" style={{ maxWidth: NW }}>
                {/* axis line */}
                <line x1={pad} y1={axisY} x2={NW - pad} y2={axisY}
                  stroke="var(--ink)" strokeWidth="1.5" />
                {[-2, -1, 0, 1, 2].map(v => (
                  <g key={v}>
                    <line x1={ns(v)} y1={axisY - 4} x2={ns(v)} y2={axisY + 4}
                      stroke="var(--ink)" strokeWidth="1" />
                    <text x={ns(v)} y={axisY + 16} textAnchor="middle"
                      fontSize="10" fill="var(--muted)">{v}</text>
                  </g>
                ))}
                {/* zero mark */}
                <line x1={ns(0)} y1={axisY - 8} x2={ns(0)} y2={axisY + 8}
                  stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5" />
                {T.scores_pc1.map((s, i) => {
                  const col = PT_COLORS[i];
                  const label = T.students[i];
                  const labelY = i % 2 === 0 ? axisY - 18 : axisY - 32;
                  return (
                    <g key={i}>
                      <circle cx={ns(s)} cy={axisY} r="6"
                        fill={col} stroke="white" strokeWidth="1.5" />
                      <text x={ns(s)} y={labelY} textAnchor="middle"
                        fontSize="9" fill={col} fontWeight="700">{label}</text>
                      <line x1={ns(s)} y1={labelY + 3} x2={ns(s)} y2={axisY - 7}
                        stroke={col} strokeWidth="0.8" opacity="0.5" />
                    </g>
                  );
                })}
                <text x={NW / 2} y={NH - 2} textAnchor="middle"
                  fontSize="10" fill="var(--muted)">PC1 score</text>
              </svg>
            );
          })()}
        </div>

        <Note>
          The PC1 score is each student's position along the "academic ability" diagonal.
          Frank (−2.192) is furthest below average; Alice (1.638) is furthest above.
          These 6 numbers replace the original 12 numbers (6 students × 2 features) with
          only 0.15% information loss.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 8: Reconstruction & Information Loss
  // ────────────────────────────────────────────────────────
  const stageReconstruct = {
    id: "reconstruct", group: "Understanding", title: "Reconstruction — What We Lose by Reducing",
    map: "Understanding",
    why: "Reconstruction makes the information loss concrete. It converts the abstract '99.85% variance' into actual score values.",
    render: () => (
      <>
        <Lead>
          To understand how much information we lose, we <b>reconstruct</b> the original data from
          only the PC1 scores. The reconstruction error shows exactly what PCA discards.
        </Lead>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Reconstruction formula</div>
          <div style={{
            fontFamily: "var(--num-font)", fontSize: 13,
            background: "var(--panel-solid)", borderRadius: 8,
            padding: "10px 16px", border: "1px solid var(--line)", marginBottom: 8
          }}>
            X_std_reconstructed = z_PC1 × PC1ᵀ<br />
            X_reconstructed = X_std_reconstructed × σ + μ<br />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              z_PC1 = column vector of PC1 scores; PC1ᵀ = row vector [0.707, 0.707]
            </span>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.8 }}>
            This back-projects each student's 1D score back into 2D standardized space (placing them
            on the PC1 line), then unstandardizes to recover approximate original scores.
          </div>
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Original vs. Reconstructed scores</div>
          <StyledTable
            headers={["Student", "Math orig", "Math recon", "Δ Math", "Physics orig", "Physics recon", "Δ Physics"]}
            rows={T.students.map((s, i) => [
              <span key={s}><Swatch color={PT_COLORS[i]} />{s}</span>,
              T.X[i][0],
              fmt(T.X_reconstructed[i][0], 1),
              fmt(T.errors[i][0], 2),
              T.X[i][1],
              fmt(T.X_reconstructed[i][1], 1),
              fmt(T.errors[i][1], 2),
            ])}
          />
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Errors are tiny — well under 1 point — because PC1 captures 99.85% of variance.
          </div>
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Original vs. Reconstructed scatter</div>
          <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
            <svg viewBox={`0 0 ${SW} ${SH}`} width="100%" style={{ maxWidth: SW }}>
              <ScatterAxes />
              {/* Reconstructed points (slightly transparent, on the regression line) */}
              {T.X_reconstructed.map(([mx2, py2], i) => (
                <circle key={`r${i}`}
                  cx={ssx(mx2)} cy={ssy(py2)} r="8"
                  fill="none" stroke={PT_COLORS[i]} strokeWidth="2" opacity="0.55"
                  strokeDasharray="3 2" />
              ))}
              {/* Error lines */}
              {T.students.map((_, i) => (
                <line key={`e${i}`}
                  x1={ssx(T.X[i][0])} y1={ssy(T.X[i][1])}
                  x2={ssx(T.X_reconstructed[i][0])} y2={ssy(T.X_reconstructed[i][1])}
                  stroke={PT_COLORS[i]} strokeWidth="1.2" opacity="0.5" strokeDasharray="2 2" />
              ))}
              {/* Original points */}
              <ScatterDots />
            </svg>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
            Solid circles = original. Dashed rings = reconstructed from PC1 only. The points nearly coincide.
          </div>
        </div>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">RMSE per student (reconstruction error)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {T.students.map((s, i) => (
              <div key={s} style={{
                background: `${PT_COLORS[i]}12`, borderRadius: 8,
                padding: "8px 12px", border: `1px solid ${PT_COLORS[i]}30`
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: PT_COLORS[i] }}>{s}</div>
                <div style={{ fontSize: 13, fontFamily: "var(--num-font)", color: "var(--ink)" }}>
                  {fmt(T.rmsePerStudent[i], 3)} pts
                </div>
              </div>
            ))}
          </div>
        </div>

        <Note>
          If we had kept PC2 as well (2-component PCA = no reduction for 2 features), the reconstruction
          would be perfect (error = 0). The reconstruction error is entirely from PC2, which we
          discarded. This concretely shows: PC2 = noise-like variation &lt; 1 point per student.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 9: Limitations
  // ────────────────────────────────────────────────────────
  const stageLimits = {
    id: "limits", group: "Practical", title: "When PCA works and when it fails",
    map: "Practical",
    why: "PCA has strict assumptions that practitioners routinely violate. Knowing the failure modes prevents hours of debugging.",
    render: () => (
      <>
        <Lead>
          PCA is powerful but has strict assumptions. Understanding its limitations prevents
          misapplication — especially the common mistake of using PCA when LDA or UMAP is appropriate.
        </Lead>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">PCA assumptions — and what breaks when violated</div>
          <StyledTable
            headers={["Assumption", "What breaks when violated"]}
            rows={[
              [
                "Linearity",
                "PCA can only find linear combinations of features. Non-linear structures (concentric circles, Swiss roll manifolds) → use UMAP or autoencoders."
              ],
              [
                "Continuous features",
                "PCA on binary features (one-hot encoded categories) produces components with no geometric meaning. Use MCA for categorical data."
              ],
              [
                "Mean and covariance are sufficient statistics",
                "PCA is optimal only for Gaussian distributions. For heavy-tailed or multimodal data, ICA or non-linear methods may be better."
              ],
              [
                "Variance = importance",
                "PCA maximizes variance, not predictive power. High-variance directions may not be the most informative for classification. Use supervised PCA or LDA."
              ],
            ]}
          />
        </div>

        <div style={{ margin: "18px 0 10px" }}>
          <div className="tf-subhead">The supervision problem (critical)</div>
          <div style={{
            background: "rgba(224,73,46,.07)", borderRadius: 10,
            padding: "14px 16px", border: "1.5px solid rgba(224,73,46,.22)", marginBottom: 12
          }}>
            <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.8 }}>
              PCA is <b>unsupervised</b> — it doesn't know the class labels. If Class A and Class B
              have the same total variance (both spread diagonally), PCA will project them onto
              overlapping ranges on PC1 — making them <b>inseparable</b>. LDA (Linear Discriminant
              Analysis) instead finds the axis that <b>maximizes class separation</b>.
            </div>
          </div>
          {/* SVG: two banana-shaped classes that overlap under PCA but separate under LDA */}
          {(() => {
            const W4 = 380, H4 = 180;
            const P4 = { l: 20, r: 20, t: 20, b: 20 };
            // Class A: left cluster (top-right diagonal)
            const classA = [[90, 120], [110, 140], [130, 160], [100, 130], [120, 150]];
            // Class B: right cluster (bottom-left diagonal)
            const classB = [[180, 60], [200, 80], [220, 100], [190, 70], [210, 90]];
            const allX = [...classA, ...classB];
            const xVals = allX.map(p => p[0]);
            const yVals = allX.map(p => p[1]);
            const xMin4 = Math.min(...xVals) - 20;
            const xMax4 = Math.max(...xVals) + 20;
            const yMin4 = Math.min(...yVals) - 20;
            const yMax4 = Math.max(...yVals) + 20;
            const sx4 = v => P4.l + ((v - xMin4) / (xMax4 - xMin4)) * (W4 - P4.l - P4.r);
            const sy4 = v => P4.t + (1 - (v - yMin4) / (yMax4 - yMin4)) * (H4 - P4.t - P4.b);
            return (
              <svg viewBox={`0 0 ${W4} ${H4}`} width="100%" style={{ maxWidth: W4 }}>
                {/* PCA projection axis (diagonal, same direction for both classes) */}
                <line x1={sx4(xMin4 + 10)} y1={sy4(yMin4 + 10)}
                  x2={sx4(xMax4 - 10)} y2={sy4(yMax4 - 10)}
                  stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
                <text x={sx4(xMin4 + 14)} y={sy4(yMin4 + 8)} fontSize="10"
                  fill="var(--muted)" opacity="0.7">PCA axis (overlapping projections)</text>
                {/* LDA arrow (horizontal — separates the clusters) */}
                <line x1={sx4(70)} y1={sy4((yMin4 + yMax4) / 2)}
                  x2={sx4(270)} y2={sy4((yMin4 + yMax4) / 2)}
                  stroke="#1f9e6b" strokeWidth="2" opacity="0.6" />
                <text x={sx4(160)} y={sy4((yMin4 + yMax4) / 2) - 8}
                  textAnchor="middle" fontSize="10" fill="#1f9e6b" fontWeight="700">LDA axis (separates classes)</text>
                {/* Class A dots */}
                {classA.map(([x, y], i) => (
                  <circle key={i} cx={sx4(x)} cy={sy4(y)} r="6"
                    fill="#2B5BFF" opacity="0.8" stroke="white" strokeWidth="1.2" />
                ))}
                {/* Class B dots */}
                {classB.map(([x, y], i) => (
                  <circle key={i} cx={sx4(x)} cy={sy4(y)} r="6"
                    fill="#e0492e" opacity="0.8" stroke="white" strokeWidth="1.2" />
                ))}
                {/* Projection shadow dots on the diagonal (PCA) */}
                {[...classA.map(([x, y]) => (x + y) / (2 * Math.sqrt(2))), ...classB.map(([x, y]) => (x + y) / (2 * Math.sqrt(2)))].map((_, i) => null)}
                <text x={sx4(85)} y={sy4(145)} fontSize="10" fill="#2B5BFF" fontWeight="700">Class A</text>
                <text x={sx4(190)} y={sy4(65)} fontSize="10" fill="#e0492e" fontWeight="700">Class B</text>
              </svg>
            );
          })()}
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            Blue = Class A, Red = Class B. They occupy different regions but have the same diagonal spread.
            PCA would project both onto the same diagonal axis (overlap). LDA finds the horizontal axis that separates them.
          </div>
        </div>

        <div style={{ margin: "18px 0 10px" }}>
          <div className="tf-subhead">PCA vs. alternatives</div>
          <StyledTable
            headers={["Method", "Linear?", "Supervised?", "Best for"]}
            rows={[
              ["PCA", "Yes", "No", "Correlated continuous features, preprocessing"],
              ["LDA", "Yes", "Yes", "Classification preprocessing — maximizes class separability"],
              ["t-SNE", "No", "No", "Visualization only (not for preprocessing, not invertible)"],
              ["UMAP", "No", "Optional", "Visualization + clustering, faster than t-SNE"],
              ["Autoencoder", "No", "No", "Images, text, complex non-linear structure"],
              ["Kernel PCA", "No (kernel trick)", "No", "Non-linear structure, moderate datasets"],
            ]}
          />
        </div>

        <Note>
          t-SNE and UMAP are not suitable for preprocessing — they don't produce a stable linear
          transformation that can be applied to new data points. PCA produces a fixed rotation
          matrix that can transform any new point in the same way. For preprocessing, always use
          PCA (linear) or Kernel PCA (non-linear), never t-SNE.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE 10: Hyperparameters & Practical Guide
  // ────────────────────────────────────────────────────────
  const stagePractical = {
    id: "practical", group: "Practical", title: "Hyperparameters & When to Use PCA",
    map: "Practical",
    why: "Knowing when to use PCA, how to set its parameters, and when to reach for an alternative is what separates effective ML practitioners from algorithm appliers.",
    render: () => (
      <>
        <Lead>
          PCA has few hyperparameters, but each is important. The most consequential choice —
          <b> n_components</b> — is often set incorrectly as an integer when the float form
          (variance threshold) is almost always better.
        </Lead>

        <div style={{ margin: "14px 0 8px" }}>
          <div className="tf-subhead">Hyperparameters</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              {
                param: "n_components",
                default_: "None (keep all)",
                desc: "Number of principal components to keep. Use int for exact count (e.g. 50). Use float, e.g. 0.95, to auto-select enough components for 95% variance — almost always use the float form in practice.",
                color: "#2B5BFF",
              },
              {
                param: "whiten",
                default_: "False",
                desc: "If True, divides each component by its standard deviation (normalizes eigenvalue scale). Useful when feeding into ICA, k-means, or other algorithms that assume equal variance. Loses some variance information.",
                color: "#f59e0b",
              },
              {
                param: "svd_solver",
                default_: "'auto'",
                desc: "'full' for small datasets (exact SVD). 'randomized' (Halko et al.) for large/approximate — 10–100× faster. 'arpack' for sparse matrices. 'auto' selects intelligently based on n_samples, n_features, n_components.",
                color: "#1f9e6b",
              },
              {
                param: "random_state",
                default_: "None",
                desc: "Random seed for the 'randomized' solver. Set to an integer for reproducible results. Has no effect for the 'full' or 'arpack' solvers.",
                color: "#7c5cff",
              },
            ].map(({ param, default_, desc, color }) => (
              <div key={param} style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                background: `${color}0e`, borderRadius: 10,
                padding: "12px 14px", border: `1px solid ${color}28`
              }}>
                <div style={{ minWidth: 130, flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontFamily: "var(--num-font)", fontWeight: 700, color }}>{param}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>default: {default_}</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ margin: "18px 0 10px" }}>
          <div className="tf-subhead">Pros and cons</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "rgba(31,158,107,.07)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(31,158,107,.25)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1f9e6b", marginBottom: 6 }}>Pros</div>
              <ul style={{ fontSize: 12, color: "var(--ink)", margin: 0, padding: "0 0 0 14px", lineHeight: 1.9 }}>
                <li>Removes multicollinearity — output components are orthogonal (uncorrelated)</li>
                <li>Reduces overfitting by compressing features into fewer, denser signals</li>
                <li>Fast: O(n·d²) for d features, O(n·d·k) with randomized solver</li>
                <li>Interpretable: each PC is a linear combination with explainable loadings</li>
                <li>Guaranteed optimal linear compression (information-theoretically)</li>
              </ul>
            </div>
            <div style={{ background: "rgba(224,73,46,.07)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(224,73,46,.25)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e0492e", marginBottom: 6 }}>Cons</div>
              <ul style={{ fontSize: 12, color: "var(--ink)", margin: 0, padding: "0 0 0 14px", lineHeight: 1.9 }}>
                <li>Loses original feature interpretability — PCs are linear combos, not the original variables</li>
                <li>Linear only — can't capture non-linear manifolds</li>
                <li>Sensitive to scaling — must standardize first</li>
                <li>Doesn't use labels — may discard the most discriminative variance</li>
                <li>Principal components can be hard to explain to non-technical stakeholders</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{ margin: "18px 0 10px" }}>
          <div className="tf-subhead">Decision guide — when to use PCA vs. alternatives</div>
          <StyledTable
            headers={["Situation", "Use", "Reason"]}
            rows={[
              [
                "Features are highly correlated (|r| > 0.7)",
                "PCA",
                "Removes redundancy, compresses to independent components"
              ],
              [
                "Need to visualize high-dimensional clusters",
                "t-SNE or UMAP",
                "Better non-linear structure preservation for visualization"
              ],
              [
                "Supervised classification, need to separate classes",
                "LDA",
                "Maximizes class separability, not just variance"
              ],
              [
                "Non-linear structure (images, manifolds)",
                "Autoencoder or Kernel PCA",
                "Linear PCA can't capture non-linear manifolds"
              ],
              [
                "High-cardinality categorical features",
                "Target encoding + optional PCA",
                "PCA on raw one-hot encoding is geometrically meaningless"
              ],
              [
                "n_samples >> n_features (tall matrix)",
                "PCA with 'randomized' solver",
                "Halko randomized SVD is 10–100× faster than full eigendecomposition"
              ],
            ]}
          />
        </div>

        <div style={{
          background: "rgba(43,91,255,.07)", borderRadius: 10,
          padding: "14px 16px", marginTop: 16, border: "1.5px solid rgba(43,91,255,.2)"
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 8 }}>
            Recommended sklearn recipe
          </div>
          <div style={{
            fontFamily: "var(--num-font)", fontSize: 12, lineHeight: 2.0,
            color: "var(--ink)"
          }}>
            from sklearn.preprocessing import StandardScaler<br />
            from sklearn.decomposition import PCA<br /><br />
            # Scale first — always<br />
            scaler = StandardScaler()<br />
            X_std = scaler.fit_transform(X_train)<br /><br />
            # Keep enough components for 95% variance<br />
            pca = PCA(n_components=0.95, svd_solver='randomized', random_state=42)<br />
            X_pca = pca.fit_transform(X_std)<br /><br />
            # Inspect: how many components were selected?<br />
            print(pca.n_components_)  # e.g., 12<br />
            print(pca.explained_variance_ratio_.cumsum()[-1])  # &gt;= 0.95
          </div>
        </div>

        <Note>
          PCA is almost always used as a <b>preprocessing step</b>, not a final model. After PCA,
          feed the principal components into your chosen classifier or regressor. Common pipeline:
          StandardScaler → PCA(0.95) → LogisticRegression or XGBoost. The PCA step typically
          reduces training time and prevents the curse of dimensionality without hurting accuracy.
        </Note>
      </>
    ),
  };

  // ────────────────────────────────────────────────────────
  //  STAGE REGISTRY
  // ────────────────────────────────────────────────────────
  const STAGES = [
    stageOverview,
    stageCorrelation,
    stageStandardize,
    stageCovariance,
    stageEigen,
    stageVariance,
    stageProjection,
    stageReconstruct,
    stageLimits,
    stagePractical,
  ];

  window.ML_STAGES = STAGES;
  window.ML_META = {
    title: "Principal Component Analysis (PCA)",
    subtitle: "Find the axes of maximum variance in your data",
    cur: "PCA",
    category: "ML Fundamentals",
    run: () => window.ML_PCA.runPCA(),
    default: {},
    renderInput: null,
    modeLinks: [
      { label: "ML Lifecycle", href: "ML Lifecycle.html", active: false },
      { label: "PCA", href: "PCA.html", active: true },
    ],
  };
})();
