/* ============================================================
   Feature Store — stages-feature-store.jsx  (12 stages)
   Educational article, no sliders.
   ============================================================ */
(function () {
  const { Lead, Note, Row, Tag, fmt } = window;

  // ── Shared helpers ──
  const card = (children, extra) => (
    <div style={{ background:"var(--panel-solid)", border:"1px solid var(--line)",
      borderRadius:14, padding:"16px 20px", marginBottom:14, ...extra }}>
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
      fontSize:12, color:"var(--muted)", ...extra }}>{s}</th>
  );

  const td = (s, extra) => (
    <td style={{ border:"1px solid var(--line)", padding:"7px 11px",
      fontSize:13, verticalAlign:"top", ...extra }}>{s}</td>
  );

  const warn = (children) => (
    <div style={{ background:"#fff8e6", border:"1px solid #f5c842", borderRadius:10,
      padding:"10px 14px", fontSize:13, color:"#7a5700", margin:"10px 0" }}>
      <b>Warning: </b>{children}
    </div>
  );

  const info = (children) => (
    <div style={{ background:"rgba(43,91,255,.07)", border:"1px solid rgba(43,91,255,.2)",
      borderRadius:10, padding:"10px 14px", fontSize:13, color:"var(--ink)", margin:"10px 0" }}>
      {children}
    </div>
  );

  const codeBlock = (code) => (
    <pre style={{ background:"#f5f5f5", padding:"12px 16px", borderRadius:8,
      fontSize:12, overflowX:"auto", fontFamily:"monospace", lineHeight:1.6,
      margin:"10px 0", border:"1px solid #e0e0e0" }}>
      <code>{code}</code>
    </pre>
  );

  // ════════════════════════════════════════════
  // STAGES
  // ════════════════════════════════════════════
  const STAGES = [

    // ─── STAGE 1 ───────────────────────────────────────────────────────────────
    {
      id: "overview",
      group: "Overview",
      title: "What is a Feature Store?",
      map: "Overview",
      why: "Feature stores solve one of the most costly hidden bugs in production ML: your training data and serving data computing the same features differently.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            A feature store is infrastructure that manages ML features for both training and
            real-time inference. Without one, data scientists reinvent the same features in
            every model, serving engineers recompute features differently than training computed
            them, and models silently degrade as feature values drift. A feature store gives you
            one place to define a feature once and use it everywhere.
          </Lead>

          {subhead("The Core Problem It Solves")}
          <p style={{fontSize:14, color:"var(--ink)", marginBottom:12}}>
            Before a feature store, training and serving use separate code paths that
            compute the same feature in two different places — divergence is inevitable.
          </p>

          <svg width="100%" viewBox="0 0 700 260" style={{display:"block", marginBottom:16, maxWidth:700}}>
            {/* Title */}
            <text x="350" y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill="#c0392b">BEFORE: Two separate code paths — Training-Serving Skew</text>

            {/* Path A — Blue */}
            <rect x="10" y="40" width="110" height="38" rx="8" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5" />
            <text x="65" y="54" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">Raw Data</text>
            <text x="65" y="69" textAnchor="middle" fontSize="10" fill="#2B5BFF">Warehouse</text>

            <line x1="120" y1="59" x2="155" y2="59" stroke="#2B5BFF" strokeWidth="2" markerEnd="url(#arrowB)" />

            <rect x="155" y="40" width="130" height="38" rx="8" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5" />
            <text x="220" y="54" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">Data Scientist SQL</text>
            <text x="220" y="69" textAnchor="middle" fontSize="10" fill="#2B5BFF">Path A: Training</text>

            <line x1="285" y1="59" x2="320" y2="59" stroke="#2B5BFF" strokeWidth="2" markerEnd="url(#arrowB)" />

            <rect x="320" y="40" width="130" height="38" rx="8" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5" />
            <text x="385" y="54" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">Training Features</text>
            <text x="385" y="69" textAnchor="middle" fontSize="10" fill="#2B5BFF">(pandas / SQL)</text>

            <line x1="450" y1="59" x2="485" y2="59" stroke="#2B5BFF" strokeWidth="2" markerEnd="url(#arrowB)" />

            <rect x="485" y="40" width="120" height="38" rx="8" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5" />
            <text x="545" y="54" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">Model Training</text>
            <text x="545" y="69" textAnchor="middle" fontSize="10" fill="#2B5BFF">AUC 0.92</text>

            {/* Path B — Red */}
            <rect x="10" y="130" width="110" height="38" rx="8" fill="#ffeaea" stroke="#c0392b" strokeWidth="1.5" />
            <text x="65" y="144" textAnchor="middle" fontSize="11" fontWeight="700" fill="#c0392b">Raw Data</text>
            <text x="65" y="159" textAnchor="middle" fontSize="10" fill="#c0392b">Same Source</text>

            <line x1="120" y1="149" x2="155" y2="149" stroke="#c0392b" strokeWidth="2" markerEnd="url(#arrowR)" />

            <rect x="155" y="130" width="130" height="38" rx="8" fill="#ffeaea" stroke="#c0392b" strokeWidth="1.5" />
            <text x="220" y="144" textAnchor="middle" fontSize="11" fontWeight="700" fill="#c0392b">Eng Python Code</text>
            <text x="220" y="159" textAnchor="middle" fontSize="10" fill="#c0392b">Path B: Serving</text>

            <line x1="285" y1="149" x2="320" y2="149" stroke="#c0392b" strokeWidth="2" markerEnd="url(#arrowR)" />

            <rect x="320" y="130" width="130" height="38" rx="8" fill="#ffeaea" stroke="#c0392b" strokeWidth="1.5" />
            <text x="385" y="144" textAnchor="middle" fontSize="11" fontWeight="700" fill="#c0392b">Serving Features</text>
            <text x="385" y="159" textAnchor="middle" fontSize="10" fill="#c0392b">(Java / different logic)</text>

            <line x1="450" y1="149" x2="485" y2="149" stroke="#c0392b" strokeWidth="2" markerEnd="url(#arrowR)" />

            <rect x="485" y="130" width="120" height="38" rx="8" fill="#ffeaea" stroke="#c0392b" strokeWidth="1.5" />
            <text x="545" y="144" textAnchor="middle" fontSize="11" fontWeight="700" fill="#c0392b">Prediction</text>
            <text x="545" y="159" textAnchor="middle" fontSize="10" fill="#c0392b">AUC 0.79 ???</text>

            {/* Skew warning arrow */}
            <line x1="385" y1="78" x2="385" y2="130" stroke="#e67e00" strokeWidth="2.5" strokeDasharray="5 3" markerEnd="url(#arrowO)" />
            <rect x="395" y="96" width="120" height="22" rx="6" fill="#fff3cd" stroke="#e67e00" strokeWidth="1.2" />
            <text x="455" y="111" textAnchor="middle" fontSize="11" fontWeight="700" fill="#e67e00">SKEW — 13pt AUC gap</text>

            {/* AFTER section */}
            <text x="350" y="220" textAnchor="middle" fontSize="13" fontWeight="700" fill="#059669">AFTER: One feature definition — Zero skew</text>
            <rect x="10" y="232" width="90" height="22" rx="6" fill="#e6f9f3" stroke="#059669" strokeWidth="1.2" />
            <text x="55" y="247" textAnchor="middle" fontSize="10" fontWeight="600" fill="#059669">Raw Data</text>
            <line x1="100" y1="243" x2="130" y2="243" stroke="#059669" strokeWidth="1.5" markerEnd="url(#arrowG)" />
            <rect x="130" y="232" width="130" height="22" rx="6" fill="#e6f9f3" stroke="#059669" strokeWidth="1.2" />
            <text x="195" y="247" textAnchor="middle" fontSize="10" fontWeight="600" fill="#059669">Feature Pipeline</text>
            <line x1="260" y1="243" x2="290" y2="243" stroke="#059669" strokeWidth="1.5" markerEnd="url(#arrowG)" />
            <rect x="290" y="232" width="120" height="22" rx="6" fill="#e6f9f3" stroke="#059669" strokeWidth="1.2" />
            <text x="350" y="247" textAnchor="middle" fontSize="10" fontWeight="600" fill="#059669">Feature Store</text>
            <line x1="410" y1="243" x2="440" y2="237" stroke="#059669" strokeWidth="1.5" markerEnd="url(#arrowG)" />
            <line x1="410" y1="243" x2="440" y2="249" stroke="#059669" strokeWidth="1.5" markerEnd="url(#arrowG)" />
            <rect x="440" y="229" width="110" height="16" rx="4" fill="#d1fae5" stroke="#059669" strokeWidth="1" />
            <text x="495" y="241" textAnchor="middle" fontSize="10" fontWeight="600" fill="#059669">Training</text>
            <rect x="440" y="249" width="110" height="16" rx="4" fill="#d1fae5" stroke="#059669" strokeWidth="1" />
            <text x="495" y="261" textAnchor="middle" fontSize="10" fontWeight="600" fill="#059669">Serving</text>

            <defs>
              <marker id="arrowB" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#2B5BFF" />
              </marker>
              <marker id="arrowR" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#c0392b" />
              </marker>
              <marker id="arrowO" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#e67e00" />
              </marker>
              <marker id="arrowG" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#059669" />
              </marker>
            </defs>
          </svg>

          {subhead("The Four Components of a Feature Store")}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16}}>
            {card(<>
              <div style={{fontWeight:700, fontSize:14, color:"#7c3aed", marginBottom:6}}>Feature Registry</div>
              <div style={{fontSize:13}}>Metadata catalog: feature definitions, schemas, lineage, and ownership. The single source of truth for "what features exist and what do they mean."</div>
            </>, {borderColor:"#c4b5fd"})}
            {card(<>
              <div style={{fontWeight:700, fontSize:14, color:"#2B5BFF", marginBottom:6}}>Offline Store</div>
              <div style={{fontSize:13}}>Historical features for model training. Stored in a data warehouse or lake (Parquet/Iceberg). High throughput batch reads. Enables point-in-time correct joins.</div>
            </>, {borderColor:"#93c5fd"})}
            {card(<>
              <div style={{fontWeight:700, fontSize:14, color:"#059669", marginBottom:6}}>Online Store</div>
              <div style={{fontSize:13}}>Real-time feature serving for inference. Backed by Redis or Cassandra. Serves the latest feature value per entity in under 5ms P99 latency.</div>
            </>, {borderColor:"#6ee7b7"})}
            {card(<>
              <div style={{fontWeight:700, fontSize:14, color:"#d97706", marginBottom:6}}>Materialization Pipeline</div>
              <div style={{fontSize:13}}>Syncs values from offline store to online store on schedule or streaming trigger. The heartbeat that keeps the online store fresh.</div>
            </>, {borderColor:"#fcd34d"})}
          </div>

          <Note>
            Uber's Michelangelo feature store serves 10 million predictions/second with P95 latency
            under 10ms. DoorDash's feature store handles 1.6 billion feature retrievals per second.
            These numbers are the product of years of investment — not something you need on day one.
          </Note>
        </>
      )
    },

    // ─── STAGE 2 ───────────────────────────────────────────────────────────────
    {
      id: "problem",
      group: "The Problem",
      title: "The Problems a Feature Store Fixes",
      map: "Problem",
      why: "Understanding the exact failure modes makes the solution obvious.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Three expensive problems appear as ML teams scale: training-serving skew, feature
            duplication, and temporal leakage. Each one silently destroys model performance in
            production.
          </Lead>

          {card(<>
            <div style={{fontWeight:700, fontSize:14, color:"#c0392b", marginBottom:8}}>
              Problem 1: Training-Serving Skew
            </div>
            <p style={{fontSize:13, marginBottom:8}}>
              A fraud detection model was trained with Python pandas code computing a 30-day rolling
              average. The serving system recomputed the same average in Java. A timezone bug in the
              Java code caused the window to be 29.75 days, not 30. The model's training AUC was
              0.92. Production AUC was 0.79. The 13-point gap took 3 weeks to diagnose.
              <b> Fix: compute the feature ONCE and store it.</b>
            </p>
            <p style={{fontSize:13, marginBottom:6}}>
              The root cause: two codebases, one feature definition — divergence is inevitable.
            </p>
            {info("Industry estimate: 40% of production ML models suffer training-serving skew at some point in their lifecycle.")}
          </>, {borderColor:"#f87171", borderWidth:2})}

          {card(<>
            <div style={{fontWeight:700, fontSize:14, color:"#92400e", marginBottom:8}}>
              Problem 2: Feature Duplication
            </div>
            <p style={{fontSize:13, marginBottom:8}}>
              Team A builds a <code>user_avg_order_value_30d</code> feature. Team B independently
              builds <code>avg_order_value_last_month</code>. They're the same feature. Three months
              later Team A changes the computation logic. Team B's feature still uses the old logic.
              Models using each feature now disagree on the same underlying signal.
            </p>
            <p style={{fontSize:13}}>
              Without a registry: zero discovery, zero reuse, exponential duplication. LinkedIn
              estimated 30-40% of feature engineering work was duplicated across teams before
              building their centralized feature store.
            </p>
          </>, {borderColor:"#fbbf24", borderWidth:2})}

          {card(<>
            <div style={{fontWeight:700, fontSize:14, color:"#d97706", marginBottom:8}}>
              Problem 3: Temporal Leakage
            </div>
            <p style={{fontSize:13, marginBottom:8}}>
              Without point-in-time correctness, training data accidentally uses future values.
              At training time you join the latest user profile to a historical order — but that
              user profile was updated <b>after</b> the order was placed, using information that
              wouldn't have been available at prediction time.
            </p>
            <p style={{fontSize:13, marginBottom:6}}>
              Real impact: offline AUC 0.95 becomes production AUC 0.78 — a 17-point drop that
              manifests only after deployment. This is the hardest bug to catch because the model
              looks great in every offline experiment.
            </p>
          </>, {borderColor:"#fb923c", borderWidth:2})}

          {card(<>
            <div style={{fontWeight:700, fontSize:14, color:"#374151", marginBottom:8}}>
              Problem 4: Feature Freshness and Staleness
            </div>
            <p style={{fontSize:13}}>
              Online store features can go stale if the materialization pipeline fails silently.
              A user's <code>last_login_days_ago</code> feature was stuck at 0 for all users for
              6 hours when a pipeline crashed. 100% of predictions during that window used
              incorrect features. No alert fired.
            </p>
          </>)}
        </>
      )
    },

    // ─── STAGE 3 ───────────────────────────────────────────────────────────────
    {
      id: "architecture",
      group: "Architecture",
      title: "Feature Store Architecture — The Four Layers",
      map: "Architecture",
      why: "Every feature store, from Feast to Tecton to DoorDash's custom build, implements these same four layers.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            The architecture of a feature store is consistent across all implementations.
            Raw data flows in from batch and streaming sources, features are stored in two tiers
            (offline and online), and consumers pull from whichever tier matches their latency
            requirement.
          </Lead>

          <svg width="100%" viewBox="0 0 700 310" style={{display:"block", marginBottom:16, maxWidth:700}}>
            <defs>
              <marker id="aw1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#64748b" />
              </marker>
              <marker id="aw2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#2B5BFF" />
              </marker>
              <marker id="aw3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#059669" />
              </marker>
              <marker id="aw4" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#7c3aed" />
              </marker>
              <marker id="aw5" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#d97706" />
              </marker>
            </defs>

            {/* Raw Sources column */}
            <text x="70" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#64748b">Raw Sources</text>
            <rect x="10" y="28" width="120" height="42" rx="8" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="70" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">Data Warehouse</text>
            <text x="70" y="60" textAnchor="middle" fontSize="10" fill="#64748b">SQL / Parquet</text>

            <rect x="10" y="118" width="120" height="42" rx="8" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="70" y="135" textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">Streaming</text>
            <text x="70" y="150" textAnchor="middle" fontSize="10" fill="#64748b">Kafka / Kinesis</text>

            <rect x="10" y="208" width="120" height="42" rx="8" fill="#f0eaff" stroke="#7c3aed" strokeWidth="1.5" />
            <text x="70" y="225" textAnchor="middle" fontSize="11" fontWeight="700" fill="#7c3aed">Feature Registry</text>
            <text x="70" y="240" textAnchor="middle" fontSize="10" fill="#7c3aed">Metadata catalog</text>

            {/* Feature Store box */}
            <rect x="175" y="22" width="350" height="238" rx="12" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6 3" />
            <text x="350" y="14" textAnchor="middle" fontSize="12" fontWeight="700" fill="#374151">Feature Store</text>

            {/* Offline Store */}
            <rect x="195" y="36" width="150" height="52" rx="8" fill="#eff6ff" stroke="#2B5BFF" strokeWidth="1.8" />
            <text x="270" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">Offline Store</text>
            <text x="270" y="71" textAnchor="middle" fontSize="10" fill="#2B5BFF">Parquet / Iceberg / BigQuery</text>

            {/* Online Store */}
            <rect x="195" y="126" width="150" height="52" rx="8" fill="#ecfdf5" stroke="#059669" strokeWidth="1.8" />
            <text x="270" y="146" textAnchor="middle" fontSize="11" fontWeight="700" fill="#059669">Online Store</text>
            <text x="270" y="161" textAnchor="middle" fontSize="10" fill="#059669">Redis / Cassandra  under 5ms</text>

            {/* Registry inside */}
            <rect x="195" y="216" width="310" height="36" rx="8" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1.5" />
            <text x="350" y="232" textAnchor="middle" fontSize="11" fontWeight="700" fill="#7c3aed">Feature Registry — metadata, lineage, ownership</text>
            <text x="350" y="246" textAnchor="middle" fontSize="10" fill="#7c3aed">names / schemas / owners / dependencies</text>

            {/* Materialization arrow (offline -> online) */}
            <line x1="270" y1="88" x2="270" y2="126" stroke="#059669" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#aw3)" />
            <text x="278" y="112" fontSize="9" fill="#059669">Materialize</text>

            {/* Consumers column */}
            <text x="620" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#d97706">Consumers</text>
            <rect x="570" y="28" width="120" height="42" rx="8" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
            <text x="630" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill="#d97706">Model Training</text>
            <text x="630" y="60" textAnchor="middle" fontSize="10" fill="#d97706">batch / Spark</text>

            <rect x="570" y="118" width="120" height="42" rx="8" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
            <text x="630" y="135" textAnchor="middle" fontSize="11" fontWeight="700" fill="#d97706">ML Inference</text>
            <text x="630" y="150" textAnchor="middle" fontSize="10" fill="#d97706">real-time serving</text>

            {/* Arrows: Sources to Feature Store */}
            <line x1="130" y1="49" x2="195" y2="55" stroke="#2B5BFF" strokeWidth="1.8" markerEnd="url(#aw2)" />
            <text x="158" y="45" fontSize="9" fill="#2B5BFF">Batch ETL</text>

            <line x1="130" y1="139" x2="195" y2="148" stroke="#059669" strokeWidth="1.8" markerEnd="url(#aw3)" />
            <text x="144" y="135" fontSize="9" fill="#059669">Stream ingest</text>

            {/* Registry bidirectional */}
            <line x1="130" y1="229" x2="195" y2="229" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#aw4)" />

            {/* Arrows: Feature Store to Consumers */}
            <line x1="345" y1="62" x2="570" y2="49" stroke="#d97706" strokeWidth="1.8" markerEnd="url(#aw5)" />
            <text x="440" y="44" fontSize="9" fill="#d97706">Training reads</text>

            <line x1="345" y1="152" x2="570" y2="139" stroke="#d97706" strokeWidth="1.8" markerEnd="url(#aw5)" />
            <text x="440" y="148" fontSize="9" fill="#d97706">Serving reads</text>
          </svg>

          {subhead("Data Flow — Six Steps")}
          <ol style={{fontSize:13, lineHeight:1.8, paddingLeft:20, marginBottom:16}}>
            <li>Raw data arrives from batch (SQL warehouse) or streaming (Kafka) sources.</li>
            <li>Feature pipeline transforms raw data into features and writes to the Offline Store with timestamps.</li>
            <li>Materialization pipeline reads the Offline Store and writes latest values to the Online Store on schedule or stream trigger.</li>
            <li>Training jobs read from Offline Store — batch, high throughput, point-in-time correct.</li>
            <li>Inference (serving) reads from Online Store — under 5ms P99 latency requirement.</li>
            <li>Feature Registry tracks everything: names, schemas, owners, lineage, and downstream model dependencies.</li>
          </ol>

          <Note>
            One feature definition. Two storage tiers. Zero skew.
          </Note>
        </>
      )
    },

    // ─── STAGE 4 ───────────────────────────────────────────────────────────────
    {
      id: "offline",
      group: "Architecture",
      title: "Offline Feature Store — Training Features",
      map: "Offline",
      why: "The offline store is where models learn. Its correctness determines your model's maximum possible quality.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            The offline store is a historical database of feature values. When you train a model,
            you query it with: "Give me the feature values for entity X at timestamp T." This is
            the foundation of reproducible model training.
          </Lead>

          {subhead("What It Stores")}
          <p style={{fontSize:13, marginBottom:8}}>
            Time-series of feature values keyed by (entity_id, timestamp). Every update is
            appended — the full history is preserved so you can reconstruct the world as it
            existed at any past point in time.
          </p>
          {codeBlock(
            "entity_id | feature_name              | value  | event_timestamp\n" +
            "--------- | ------------------------- | ------ | ---------------------\n" +
            "user_123  | avg_order_value_30d       | 45.20  | 2024-01-15 14:23:00\n" +
            "user_123  | avg_order_value_30d       | 43.80  | 2024-01-10 09:11:00\n" +
            "user_456  | avg_order_value_30d       | 12.50  | 2024-01-15 16:45:00"
          )}

          {subhead("Storage Technologies")}
          {tbl(
            <tbody>
              <tr><th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Technology</th><th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Notes</th><th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Best for</th></tr>
              <tr>{td("S3 + Parquet / Iceberg")}{td("Cheap, scalable, native time-travel queries")}{td("Most teams — cost-conscious")}</tr>
              <tr>{td("Google BigQuery")}{td("SQL interface, built-in time-travel, serverless")}{td("GCP-native teams")}</tr>
              <tr>{td("Snowflake")}{td("Enterprise SQL, great governance, time-travel")}{td("SQL-first, regulated industries")}</tr>
              <tr>{td("Databricks Delta Lake")}{td("Spark-native, ACID transactions, schema enforcement")}{td("Spark-heavy workloads")}</tr>
            </tbody>
          )}

          {subhead("Key Capability: Historical Point-in-Time Queries")}
          <p style={{fontSize:13, marginBottom:8}}>
            "What was user_123's 30-day average order value on January 10th, 2024?" This is what
            enables proper backtesting and model training without temporal leakage.
          </p>

          {subhead("Batch Materialization — How Features Enter the Offline Store")}
          <ol style={{fontSize:13, lineHeight:1.8, paddingLeft:20, marginBottom:12}}>
            <li>Raw event data lands in the data warehouse.</li>
            <li>Spark or SQL transformation computes feature values.</li>
            <li>Results are written to offline store with <code>event_timestamp</code>.</li>
            <li>Process runs on schedule — hourly, daily, or weekly depending on freshness needs.</li>
          </ol>

          {subhead("Performance Profile")}
          {tbl(
            <tbody>
              <tr><th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Characteristic</th><th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Offline Store</th></tr>
              <tr>{td("Latency")}{td("Seconds to hours (batch queries)")}</tr>
              <tr>{td("Throughput")}{td("Millions of rows per second (Spark)")}</tr>
              <tr>{td("Cost")}{td("Low — object storage ~$23/TB/month on S3")}</tr>
              <tr>{td("Use case")}{td("Training, batch inference, backtesting")}</tr>
              <tr>{td("Query style")}{td("SQL, Spark, batch reads")}</tr>
            </tbody>
          )}
        </>
      )
    },

    // ─── STAGE 5 ───────────────────────────────────────────────────────────────
    {
      id: "online",
      group: "Architecture",
      title: "Online Feature Store — Real-Time Serving",
      map: "Online",
      why: "The online store is where revenue happens. Every millisecond of latency is a lost user.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            The online store serves features during inference — when a user requests a
            recommendation, fraud check, or price estimate. It must respond in under 5
            milliseconds or the model's prediction arrives after the user has already clicked away.
          </Lead>

          {subhead("Latency Benchmarks from Production")}
          {tbl(
            <tbody>
              <tr><th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Company</th><th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Latency SLA</th><th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Scale</th><th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Technology</th></tr>
              <tr>{td("Uber Michelangelo")}{td("P95 under 10ms")}{td("10M predictions/second")}{td("Cassandra")}</tr>
              <tr>{td("Google")}{td("P99 under 5ms")}{td("Billions/day")}{td("Bigtable")}</tr>
              <tr>{td("Airbnb Zipline")}{td("Sub-10ms")}{td("Millions of models")}{td("Redis + Cassandra")}</tr>
              <tr>{td("Typical SLA")}{td("P99 under 20ms end-to-end")}{td("—")}{td("Redis")}</tr>
              <tr>{td("Feature budget")}{td("1–5ms of total latency budget")}{td("—")}{td("Redis GET")}</tr>
            </tbody>
          )}

          {subhead("Storage Technologies")}
          {tbl(
            <tbody>
              <tr><th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Technology</th><th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Latency</th><th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Best for</th></tr>
              <tr>{td("Redis")}{td("Under 1ms")}{td("Most teams — fastest, in-memory, simplest")}</tr>
              <tr>{td("Cassandra")}{td("1–5ms")}{td("Petabyte scale — Uber's choice for 10M req/sec")}</tr>
              <tr>{td("DynamoDB")}{td("Single-digit ms")}{td("Managed AWS, good for serverless architectures")}</tr>
              <tr>{td("Bigtable")}{td("Under 5ms")}{td("Google-scale, GCP-native teams")}</tr>
            </tbody>
          )}

          {subhead("Data Model — Key-Value by Entity ID")}
          <p style={{fontSize:13, marginBottom:8}}>
            A single Redis GET by user_id returns ALL features for that user in approximately 1ms.
          </p>
          {codeBlock(
            'Key: "user:user_123"\n' +
            "Value:\n" +
            "  avg_order_value_30d:    45.20\n" +
            "  days_since_last_order:  3\n" +
            "  total_orders_90d:       12\n" +
            "  preferred_cuisine:      'italian'\n" +
            "  account_age_days:       847"
          )}

          {subhead("Freshness vs. Latency Trade-off")}
          {tbl(
            <tbody>
              <tr>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Feature type</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Update frequency</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Technology</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Use case</th>
              </tr>
              <tr>{td("Batch features")}{td("Hourly/daily")}{td("Redis (pre-materialized)")}{td("User demographics, historical aggregates")}</tr>
              <tr>{td("Near-real-time")}{td("Minutes")}{td("Redis + streaming pipeline")}{td("Recent purchase count, session features")}</tr>
              <tr>{td("Real-time")}{td("Milliseconds")}{td("Computed on-the-fly or Kafka")}{td("Current cart value, live session data")}</tr>
            </tbody>
          )}

          {warn("Online stores only store the LATEST value per entity — no history. History lives in the offline store. The online store is a snapshot: a cache of the most recent feature values.")}
        </>
      )
    },

    // ─── STAGE 6 ───────────────────────────────────────────────────────────────
    {
      id: "pit-join",
      group: "Architecture",
      title: "Point-in-Time Correct Joins — Preventing Temporal Leakage",
      map: "PIT Join",
      why: "This is the most important concept in feature store design. Getting it wrong silently corrupts every model you train.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            When training a model on historical data, you need to join features to labels. The
            naive approach uses "latest available value" — but this leaks future information into
            training, making the model look better than it actually is in production.
          </Lead>

          {subhead("The Problem Illustrated with Concrete Numbers")}
          <p style={{fontSize:13, marginBottom:8}}>
            Scenario: Predict whether a user will churn. Labels are from January 2024. Features
            include <code>user_account_age_days</code>.
          </p>

          {card(<>
            <div style={{fontWeight:700, fontSize:13, color:"#c0392b", marginBottom:8}}>
              WITHOUT PIT Correctness (Wrong — causes leakage):
            </div>
            {codeBlock(
              "Label event:   user_123 churned on 2024-01-15\n" +
              "Feature join:  pull user_123's account_age_days TODAY (2024-06-01) = 1000 days\n" +
              "Training data: (features at today's values, label from January)\n\n" +
              "Result: The model learns from features that did not exist when the churn happened."
            )}
          </>, {borderColor:"#f87171"})}

          {card(<>
            <div style={{fontWeight:700, fontSize:13, color:"#059669", marginBottom:8}}>
              WITH PIT Correctness (Correct):
            </div>
            {codeBlock(
              "Label event:   user_123 churned on 2024-01-15\n" +
              "Feature join:  pull user_123's account_age_days AS OF 2024-01-15 = 750 days\n" +
              "Training data: (features as they existed at label time)\n\n" +
              "Result: The model learns from the world as it was when the event happened."
            )}
          </>, {borderColor:"#6ee7b7"})}

          {subhead("Timeline Diagram")}
          <svg width="100%" viewBox="0 0 700 200" style={{display:"block", marginBottom:16, maxWidth:700}}>
            <defs>
              <marker id="pitarrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#374151" />
              </marker>
              <marker id="pitarrowR" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#c0392b" />
              </marker>
              <marker id="pitarrowG" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#059669" />
              </marker>
            </defs>

            {/* Time axis */}
            <line x1="40" y1="100" x2="660" y2="100" stroke="#374151" strokeWidth="2" markerEnd="url(#pitarrow)" />
            <text x="660" y="115" fontSize="11" fill="#374151">time</text>

            {/* T1 — Feature computed */}
            <circle cx="160" cy="100" r="7" fill="#2B5BFF" />
            <line x1="160" y1="93" x2="160" y2="55" stroke="#2B5BFF" strokeWidth="1.5" strokeDasharray="4 2" />
            <rect x="90" y="30" width="140" height="28" rx="6" fill="#eff6ff" stroke="#2B5BFF" strokeWidth="1.2" />
            <text x="160" y="44" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2B5BFF">Feature computed at T1</text>
            <text x="160" y="57" textAnchor="middle" fontSize="9" fill="#2B5BFF">account_age = 750 days</text>
            <text x="160" y="118" textAnchor="middle" fontSize="9" fill="#475569">T1</text>

            {/* T2 — Label recorded */}
            <circle cx="360" cy="100" r="7" fill="#d97706" />
            <line x1="360" y1="93" x2="360" y2="55" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 2" />
            <rect x="290" y="30" width="140" height="28" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1.2" />
            <text x="360" y="44" textAnchor="middle" fontSize="10" fontWeight="700" fill="#d97706">Label recorded at T2</text>
            <text x="360" y="57" textAnchor="middle" fontSize="9" fill="#d97706">user churned — label = 1</text>
            <text x="360" y="118" textAnchor="middle" fontSize="9" fill="#475569">T2 (label time)</text>

            {/* T3 — Wrong join: today */}
            <circle cx="580" cy="100" r="7" fill="#c0392b" />
            <line x1="580" y1="93" x2="580" y2="55" stroke="#c0392b" strokeWidth="1.5" strokeDasharray="4 2" />
            <rect x="500" y="30" width="160" height="28" rx="6" fill="#ffeaea" stroke="#c0392b" strokeWidth="1.2" />
            <text x="580" y="44" textAnchor="middle" fontSize="10" fontWeight="700" fill="#c0392b">Wrong join: T3 (today)</text>
            <text x="580" y="57" textAnchor="middle" fontSize="9" fill="#c0392b">account_age = 1000 days — LEAKAGE</text>
            <text x="580" y="118" textAnchor="middle" fontSize="9" fill="#c0392b">T3 (future)</text>

            {/* Correct join annotation */}
            <line x1="360" y1="130" x2="165" y2="145" stroke="#059669" strokeWidth="1.5" markerEnd="url(#pitarrowG)" />
            <rect x="170" y="148" width="200" height="22" rx="6" fill="#ecfdf5" stroke="#059669" strokeWidth="1.2" />
            <text x="270" y="163" textAnchor="middle" fontSize="10" fontWeight="700" fill="#059669">Correct: last value BEFORE T2</text>

            {/* Leakage window */}
            <line x1="360" y1="130" x2="575" y2="145" stroke="#c0392b" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#pitarrowR)" />
            <rect x="390" y="148" width="185" height="22" rx="6" fill="#ffeaea" stroke="#c0392b" strokeWidth="1.2" />
            <text x="483" y="163" textAnchor="middle" fontSize="10" fontWeight="700" fill="#c0392b">Leakage window = T3 - T2</text>
          </svg>

          {subhead("SQL Equivalent of a PIT Join")}
          {codeBlock(
            "SELECT f.value\n" +
            "FROM labels l\n" +
            "JOIN features f\n" +
            "  ON f.entity_id = l.entity_id\n" +
            "  AND f.event_timestamp = (\n" +
            "    SELECT MAX(event_timestamp)\n" +
            "    FROM features\n" +
            "    WHERE entity_id = l.entity_id\n" +
            "      AND event_timestamp <= l.label_timestamp\n" +
            "  )\n" +
            "WHERE l.label_timestamp BETWEEN '2024-01-01' AND '2024-03-31'"
          )}
          <p style={{fontSize:12, color:"var(--muted)", marginBottom:12}}>
            Feast, Hopsworks, and Databricks Feature Store handle this SQL automatically.
          </p>

          {card(<>
            <b>Real impact:</b> Without PIT joins, offline AUC 0.95 becomes production AUC 0.78 —
            a 17-point gap that manifests only after deployment.
          </>, {borderColor:"#f87171", background:"#fff5f5"})}

          <Note>
            All major feature stores (Feast, Hopsworks, Tecton) implement PIT-correct joins
            automatically. This is a primary reason to use a feature store rather than
            hand-rolling your own feature pipeline.
          </Note>
        </>
      )
    },

    // ─── STAGE 7 ───────────────────────────────────────────────────────────────
    {
      id: "toy-dataset",
      group: "Design",
      title: "Toy Example — Building a Feature Store for Ride-Hailing",
      map: "Toy Example",
      why: "A concrete example makes architecture decisions tangible.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Let's design a feature store for a ride-hailing app (think Uber Lite). We have two
            prediction tasks: (1) surge pricing prediction — how much to charge right now, and
            (2) driver ETA prediction — how long will pickup take.
          </Lead>

          {subhead("Entities — The Subjects Features Are About")}
          {tbl(
            <tbody>
              <tr>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Entity</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>ID field</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Example</th>
              </tr>
              <tr>{td("rider")}{td("rider_id")}{td("rider_789")}</tr>
              <tr>{td("driver")}{td("driver_id")}{td("driver_456")}</tr>
              <tr>{td("location")}{td("grid_cell_id")}{td("grid_cell_manhattan_7")}</tr>
            </tbody>
          )}

          {subhead("Feature Group: rider_stats (batch, updates hourly)")}
          {codeBlock(
            "rider_789 | avg_trip_distance_30d        | 8.2 km\n" +
            "rider_789 | cancellation_rate_7d         | 0.03\n" +
            "rider_789 | trips_completed_lifetime     | 247\n" +
            "rider_789 | preferred_pickup_lat         | 40.748\n" +
            "rider_789 | avg_wait_time_tolerance_min  | 6.5"
          )}

          {subhead("Feature Group: driver_realtime (streaming, updates every 30 seconds)")}
          {codeBlock(
            "driver_456 | current_lat               | 40.751\n" +
            "driver_456 | current_lng               | -73.989\n" +
            "driver_456 | trips_completed_today     | 14\n" +
            "driver_456 | acceptance_rate_1h        | 0.91\n" +
            "driver_456 | avg_speed_last_10min_kmh  | 22.4"
          )}

          {subhead("Feature Group: location_demand (batch + streaming, updates every 5 minutes)")}
          {codeBlock(
            "grid_manhattan_7 | demand_last_15min    | 47  (trip requests)\n" +
            "grid_manhattan_7 | supply_last_15min    | 31  (available drivers)\n" +
            "grid_manhattan_7 | surge_multiplier     | 1.8\n" +
            "grid_manhattan_7 | avg_wait_time_min    | 4.2"
          )}

          {subhead("Which Features Go Where")}
          {tbl(
            <tbody>
              <tr>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Feature group</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Offline Store?</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Online Store?</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Update frequency</th>
              </tr>
              <tr>{td("rider_stats")}{td("Yes (training)")}{td("Yes (inference)")}{td("Hourly batch")}</tr>
              <tr>{td("driver_realtime")}{td("Yes (for training logs)")}{td("Yes (for surge/ETA)")}{td("30s streaming")}</tr>
              <tr>{td("location_demand")}{td("Yes")}{td("Yes")}{td("5min batch")}</tr>
            </tbody>
          )}

          {subhead("Training Query (Conceptual)")}
          {info("For each completed trip in the training window, pull: rider_stats AS OF trip_start_time, driver_stats AS OF trip_start_time, location_demand AS OF trip_start_time — then join to actual surge price (label). Point-in-time correct across all three feature groups.")}

          {subhead("Serving Query (Inference)")}
          {info("User requests trip. GET rider_789's features from Redis. GET nearby driver's features. GET current grid cell demand. Feed all to model. Return surge price in under 5ms.")}
        </>
      )
    },

    // ─── STAGE 8 ───────────────────────────────────────────────────────────────
    {
      id: "registry",
      group: "Design",
      title: "Feature Registry — The Metadata Catalog",
      map: "Registry",
      why: "Without a registry, features become undiscoverable, unmaintainable, and silently incorrect.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            The feature registry is a catalog of everything in your feature store: what features
            exist, who owns them, how they're computed, what they mean, and what depends on them.
            It is the governance layer that makes features reusable and auditable.
          </Lead>

          {subhead("What the Registry Tracks Per Feature")}
          {tbl(
            <tbody>
              <tr>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Field</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Example value</th>
              </tr>
              <tr>{td("name")}{td("rider_avg_trip_distance_30d")}</tr>
              <tr>{td("entity")}{td("rider (keyed by rider_id)")}</tr>
              <tr>{td("description")}{td("Average trip distance over the last 30 days")}</tr>
              <tr>{td("owner")}{td("rides-team@company.com")}</tr>
              <tr>{td("source")}{td("event: trip_completed — avg(distance_km) window 30d")}</tr>
              <tr>{td("dtype")}{td("float32")}</tr>
              <tr>{td("freshness_sla")}{td("1 hour (batch materialization)")}</tr>
              <tr>{td("offline_table")}{td("warehouse.rider_features")}</tr>
              <tr>{td("online_key")}{td("rider_id")}</tr>
              <tr>{td("tags")}{td('["rider", "distance", "engagement"]')}</tr>
              <tr>{td("lineage")}{td("depends on: trips table — dbt model: rider_30d_stats")}</tr>
              <tr>{td("created")}{td("2024-01-10")}</tr>
              <tr>{td("last_updated")}{td("2024-06-01")}</tr>
              <tr>{td("models_using")}{td('["surge_model_v3", "eta_model_v2", "churn_model"]')}</tr>
            </tbody>
          )}

          {subhead("Why Lineage Matters")}
          {card(<>
            <p style={{fontSize:13, marginBottom:0}}>
              3 models use <code>rider_avg_trip_distance_30d</code>. An engineer changes the trips
              table schema. Without lineage, they don't know 3 models will break. With the registry,
              they see the dependency and test the impact before deploying.
            </p>
          </>, {borderColor:"#c4b5fd"})}

          {subhead("Feature Discovery")}
          <p style={{fontSize:13, marginBottom:12}}>
            Before building a new feature, data scientists search the registry first. LinkedIn
            found 30-40% of feature engineering work was duplicated before they centralized
            discovery. The registry turns "I wonder if this exists" into a search box.
          </p>

          {subhead("Feast Feature View Definition (YAML)")}
          {codeBlock(
            "# Feast feature definition\n" +
            "feature_view = FeatureView(\n" +
            "    name='rider_stats',\n" +
            "    entities=['rider'],\n" +
            "    ttl=timedelta(days=1),\n" +
            "    features=[\n" +
            "        Feature(name='avg_trip_distance_30d', dtype=Float32),\n" +
            "        Feature(name='cancellation_rate_7d', dtype=Float32),\n" +
            "        Feature(name='trips_completed_lifetime', dtype=Int64),\n" +
            "    ],\n" +
            "    source=rider_batch_source,\n" +
            ")"
          )}
        </>
      )
    },

    // ─── STAGE 9 ───────────────────────────────────────────────────────────────
    {
      id: "materialization",
      group: "Design",
      title: "Materialization Pipeline — Keeping Online Store Fresh",
      map: "Materialize",
      why: "Stale features = wrong predictions. Materialization is the heartbeat of your feature store.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            Materialization is the process of copying feature values from the offline store
            (historical) to the online store (latest only). It is a pipeline that runs on a
            schedule or is triggered by streaming events.
          </Lead>

          {subhead("Batch Materialization (Most Common)")}
          <ol style={{fontSize:13, lineHeight:1.8, paddingLeft:20, marginBottom:12}}>
            <li>Scheduled job runs every hour via Airflow or cron.</li>
            <li>Reads from offline store: <code>SELECT entity_id, feature_values WHERE event_timestamp >= last_run</code></li>
            <li>Writes to online store (Redis): <code>SET user:rider_789 avg_trip=8.2 cancellation_rate=0.03 ...</code></li>
            <li>Simple, reliable, acceptable for features that do not need real-time freshness.</li>
          </ol>

          {subhead("Streaming Materialization (For Real-Time Features)")}
          <ol style={{fontSize:13, lineHeight:1.8, paddingLeft:20, marginBottom:12}}>
            <li>Kafka consumer reads raw events in real time.</li>
            <li>Applies feature transformation in-flight (Flink, Spark Streaming, or RisingWave).</li>
            <li>Writes directly to online store within seconds of the raw event.</li>
          </ol>

          {subhead("The Freshness Budget — What Staleness is Acceptable?")}
          {tbl(
            <tbody>
              <tr>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Feature</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Acceptable staleness</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Materialization approach</th>
              </tr>
              <tr>{td("User lifetime stats")}{td("24 hours")}{td("Daily batch")}</tr>
              <tr>{td("30-day rolling averages")}{td("1 hour")}{td("Hourly batch")}</tr>
              <tr>{td("Session-level features")}{td("5 minutes")}{td("Near-real-time streaming")}</tr>
              <tr>{td("Current location")}{td("Under 30 seconds")}{td("Real-time streaming")}</tr>
              <tr>{td("Cart contents")}{td("Milliseconds")}{td("Direct write at transaction time")}</tr>
            </tbody>
          )}

          {subhead("Failure Modes")}
          {warn("Silent stale reads: materialization pipeline fails, online store serves day-old values, model gets no error but predictions degrade silently. Fix: monitor feature freshness, alert when last_updated exceeds staleness_threshold.")}
          {warn("Thundering herd: all models refresh features at the same time (midnight batch), Redis gets hammered. Fix: stagger materialization jobs, add jitter to schedules.")}
          {warn("Partial writes: pipeline crashes halfway, online store has a mix of old and new values for different entities. Fix: use atomic batch writes, verify counts after each run.")}
        </>
      )
    },

    // ─── STAGE 10 ──────────────────────────────────────────────────────────────
    {
      id: "platforms",
      group: "Design",
      title: "Feature Store Platforms — Feast vs Hopsworks vs Tecton",
      map: "Platforms",
      why: "Choosing the wrong platform means either over-engineering a small system or under-building a critical one.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            There are three major categories: open-source self-managed (Feast), open-source
            enterprise (Hopsworks), and fully managed SaaS (Tecton). The right choice depends
            on team size, latency requirements, and operational capacity.
          </Lead>

          {subhead("Platform Comparison")}
          {tbl(
            <tbody>
              <tr>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Attribute</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Feast</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Hopsworks</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Tecton</th>
              </tr>
              <tr>{td("Type")}{td("Open-source")}{td("Open-source / SaaS")}{td("Fully managed SaaS")}</tr>
              <tr>{td("Origin")}{td("Google / Gojek")}{td("Logical Clocks")}{td("Ex-Uber Michelangelo team")}</tr>
              <tr>{td("Deployment")}{td("Self-managed")}{td("Self-hosted or cloud")}{td("Cloud SaaS")}</tr>
              <tr>{td("Online latency")}{td("Under 5ms (Redis)")}{td("Under 5ms")}{td("Under 10ms P95")}</tr>
              <tr>{td("Built-in UI")}{td("No")}{td("Yes")}{td("Yes")}</tr>
              <tr>{td("Streaming features")}{td("Via Kafka")}{td("Built-in")}{td("Built-in")}</tr>
              <tr>{td("PIT correct joins")}{td("Yes")}{td("Yes")}{td("Yes")}</tr>
              <tr>{td("Cost")}{td("Infra only")}{td("Infra or SaaS pricing")}{td("Compute-based (expensive)")}</tr>
              <tr>{td("Best for")}{td("Max flexibility, cost-conscious")}{td("Regulated industries, end-to-end")}{td("Enterprise, simplicity at scale")}</tr>
              <tr>{td("Requires")}{td("Redis, Spark, data warehouse")}{td("Same, or managed platform")}{td("Data source + credit card")}</tr>
            </tbody>
          )}

          {subhead("When to Use Each")}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16}}>
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#2B5BFF", marginBottom:6}}>Feast</div>
              <ul style={{fontSize:12, paddingLeft:16, lineHeight:1.8, margin:0}}>
                <li>You have data engineers who can manage Redis/Spark infrastructure</li>
                <li>You want zero vendor lock-in</li>
                <li>You are cost-sensitive</li>
                <li>Team has 3+ data engineers</li>
              </ul>
            </>, {borderColor:"#93c5fd"})}
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#7c3aed", marginBottom:6}}>Hopsworks</div>
              <ul style={{fontSize:12, paddingLeft:16, lineHeight:1.8, margin:0}}>
                <li>Healthcare or finance requiring data governance</li>
                <li>You want end-to-end: feature store + model registry + monitoring</li>
                <li>Willing to self-host on your own infrastructure</li>
              </ul>
            </>, {borderColor:"#c4b5fd"})}
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#d97706", marginBottom:6}}>Tecton</div>
              <ul style={{fontSize:12, paddingLeft:16, lineHeight:1.8, margin:0}}>
                <li>Enterprise with real-time requirements</li>
                <li>You want ML team to focus on models, not infra</li>
                <li>Large team with operational simplicity budget</li>
              </ul>
            </>, {borderColor:"#fcd34d"})}
          </div>

          {subhead("DoorDash's Custom Approach")}
          {card(<>
            <p style={{fontSize:13, marginBottom:0}}>
              Built a custom clusterless feature store on Apache Kvrocks, serving 1.6 billion
              feature retrievals per second with identical logic for offline and online paths.
              "The same feature definition code runs for training and serving — eliminating
              skew entirely." This is the gold standard, and it took years to build.
            </p>
          </>, {borderColor:"#f87171"})}
        </>
      )
    },

    // ─── STAGE 11 ──────────────────────────────────────────────────────────────
    {
      id: "mistakes",
      group: "Production",
      title: "Common Mistakes and Anti-Patterns",
      map: "Anti-Patterns",
      why: "These mistakes are expensive. Teams typically discover them in production, not staging.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            These are the patterns that appear in post-mortems, not design reviews. Each one has
            caused production incidents at large ML teams.
          </Lead>

          {card(<>
            <div style={{fontWeight:700, fontSize:14, color:"#c0392b", marginBottom:6}}>
              Mistake 1: Late Joins on the Hot Path
            </div>
            <p style={{fontSize:13, marginBottom:4}}>
              <b>Description:</b> Fetching raw facts during inference and joining at serving time.
            </p>
            <p style={{fontSize:13, marginBottom:4}}>
              <b>Impact:</b> Each prediction requires multiple database round trips. 50-200ms for
              feature retrieval instead of under 5ms. Under load, latency explodes and cascades.
            </p>
            <p style={{fontSize:13, marginBottom:0}}>
              <b>Fix:</b> Pre-materialize canonical features. Serve pre-computed aggregates, not raw data.
            </p>
          </>, {borderColor:"#f87171", borderWidth:2})}

          {card(<>
            <div style={{fontWeight:700, fontSize:14, color:"#c0392b", marginBottom:6}}>
              Mistake 2: Not Monitoring Feature Freshness
            </div>
            <p style={{fontSize:13, marginBottom:4}}>
              <b>Description:</b> Materialization pipeline fails silently. Online store serves values from 6 hours ago.
            </p>
            <p style={{fontSize:13, marginBottom:4}}>
              <b>Real case:</b> "User's 'last_login_days_ago' feature was stuck at 0 for all users
              for 6 hours when the pipeline crashed. 100% of predictions used wrong features.
              No alert fired."
            </p>
            <p style={{fontSize:13, marginBottom:0}}>
              <b>Fix:</b> Track <code>feature_last_updated_timestamp</code> for each entity. Alert
              when any feature group exceeds its freshness SLA.
            </p>
          </>, {borderColor:"#f87171", borderWidth:2})}

          {card(<>
            <div style={{fontWeight:700, fontSize:14, color:"#c0392b", marginBottom:6}}>
              Mistake 3: Skipping PIT Correctness
            </div>
            <p style={{fontSize:13, marginBottom:4}}>
              <b>Description:</b> Training joins use latest feature values instead of values-at-label-time.
            </p>
            <p style={{fontSize:13, marginBottom:4}}>
              <b>Impact:</b> Offline AUC 0.95 becomes production AUC 0.78. Model looks great in
              all offline experiments, fails in production.
            </p>
            <p style={{fontSize:13, marginBottom:0}}>
              <b>Fix:</b> Always use point-in-time correct joins for training data generation. Use
              a feature store that handles this automatically.
            </p>
          </>, {borderColor:"#f87171", borderWidth:2})}

          {card(<>
            <div style={{fontWeight:700, fontSize:14, color:"#92400e", marginBottom:6}}>
              Mistake 4: One Monolithic Feature View
            </div>
            <p style={{fontSize:13, marginBottom:4}}>
              <b>Description:</b> Putting all 200 features for an entity into one feature view,
              refreshed at the same cadence.
            </p>
            <p style={{fontSize:13, marginBottom:4}}>
              <b>Impact:</b> Real-time features (location, cart) are delayed by hourly batch jobs.
              Batch features waste streaming infrastructure.
            </p>
            <p style={{fontSize:13, marginBottom:0}}>
              <b>Fix:</b> Split features by update cadence into separate feature views with independent
              materialization schedules.
            </p>
          </>, {borderColor:"#fbbf24", borderWidth:2})}

          {card(<>
            <div style={{fontWeight:700, fontSize:14, color:"#92400e", marginBottom:6}}>
              Mistake 5: No Feature Versioning
            </div>
            <p style={{fontSize:13, marginBottom:4}}>
              <b>Description:</b> Updating a feature definition in-place (changing the 30-day
              window to 60 days without creating a new feature).
            </p>
            <p style={{fontSize:13, marginBottom:4}}>
              <b>Impact:</b> All models using that feature get different values with no notice.
              Model behavior changes silently overnight.
            </p>
            <p style={{fontSize:13, marginBottom:0}}>
              <b>Fix:</b> Feature definitions are immutable. Create a new feature
              (<code>avg_trip_distance_60d</code>) rather than modifying the old one.
            </p>
          </>, {borderColor:"#fbbf24", borderWidth:2})}

          {info(<>
            <b>Mistake 6: Building a Feature Store Too Early.</b> Team with 2 models in production
            builds a full feature store with Redis, Kafka, Spark, and a custom registry. Result:
            3 months of engineering work for infrastructure that serves 2 use cases. Fix: see the
            "When to Use" stage. Start with SQL tables and a shared dbt repository.
          </>)}
        </>
      )
    },

    // ─── STAGE 12 ──────────────────────────────────────────────────────────────
    {
      id: "when-to-use",
      group: "Production",
      title: "When to Build a Feature Store — Decision Guide",
      map: "When to Use",
      why: "A feature store is an investment. The right time to build it is not today for most teams.",
      render: (_trace, _ctx) => (
        <>
          <Lead>
            A feature store is powerful but expensive to build and maintain. The right answer for
            most teams is: "not yet." Build one when the pain of NOT having one is measurable and
            affecting model quality or team velocity.
          </Lead>

          {subhead("Decision Flowchart")}

          {card(<>
            <div style={{fontWeight:700, fontSize:13, color:"var(--ink)", marginBottom:10}}>
              Question 1: How many models do you have in production?
            </div>
            <div style={{paddingLeft:16}}>
              {card(<>
                <span style={{fontWeight:700, color:"#059669"}}>Under 5 models:</span>
                {" "}Not yet. Use SQL + dbt + shared Python functions. Revisit when you hit 10.
              </>, {background:"#ecfdf5", borderColor:"#6ee7b7", marginBottom:8})}
              {card(<>
                <span style={{fontWeight:700, color:"#d97706"}}>5–20 models:</span>
                {" "}Consider it if you have multiple teams building similar features with overlapping entity types.
              </>, {background:"#fffbeb", borderColor:"#fcd34d", marginBottom:8})}
              {card(<>
                <span style={{fontWeight:700, color:"#c0392b"}}>20+ models:</span>
                {" "}You almost certainly need one. The coordination cost without it exceeds the build cost.
              </>, {background:"#fff5f5", borderColor:"#f87171", marginBottom:0})}
            </div>
          </>)}

          {card(<>
            <div style={{fontWeight:700, fontSize:13, color:"var(--ink)", marginBottom:10}}>
              Question 2: Do you have real-time inference requirements (under 100ms total latency)?
            </div>
            <div style={{paddingLeft:16}}>
              {card(<>
                <span style={{fontWeight:700, color:"#059669"}}>No:</span>
                {" "}Simpler path: batch features from a data warehouse, served as database columns at inference time.
              </>, {background:"#ecfdf5", borderColor:"#6ee7b7", marginBottom:8})}
              {card(<>
                <span style={{fontWeight:700, color:"#c0392b"}}>Yes:</span>
                {" "}An online store becomes necessary. Serving from raw SQL at inference time is too slow under load.
              </>, {background:"#fff5f5", borderColor:"#f87171", marginBottom:0})}
            </div>
          </>)}

          {card(<>
            <div style={{fontWeight:700, fontSize:13, color:"var(--ink)", marginBottom:10}}>
              Question 3: Are 3 or more teams building features that overlap?
            </div>
            <div style={{paddingLeft:16}}>
              {card(<>
                <span style={{fontWeight:700, color:"#059669"}}>No:</span>
                {" "}Not worth the coordination overhead yet. One team, one codebase is manageable.
              </>, {background:"#ecfdf5", borderColor:"#6ee7b7", marginBottom:8})}
              {card(<>
                <span style={{fontWeight:700, color:"#c0392b"}}>Yes:</span>
                {" "}Feature duplication and drift are guaranteed without a shared store. Build it.
              </>, {background:"#fff5f5", borderColor:"#f87171", marginBottom:0})}
            </div>
          </>)}

          {subhead("The Minimum Viable Feature Store for Early Teams")}
          {info(<>
            <b>1.</b> Shared dbt project for all feature transformations (single source of truth for SQL logic).<br />
            <b>2.</b> Feature tables in Snowflake or BigQuery (offline store using your existing warehouse).<br />
            <b>3.</b> Simple Redis instance for online serving (one GET per prediction).<br />
            <b>4.</b> A markdown file or Notion page as your feature registry.<br /><br />
            This is not a "real" feature store but it solves the core problems at 5% of the cost.
          </>)}

          {subhead("Graduation Path")}
          {tbl(
            <tbody>
              <tr>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Stage</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Team size</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Models</th>
                <th style={{background:"var(--panel-solid)",border:"1px solid var(--line)",padding:"7px 11px",textAlign:"left",fontWeight:700,fontSize:12,color:"var(--muted)"}}>Solution</th>
              </tr>
              <tr>{td("Seed")}{td("1–2 DS")}{td("Under 5")}{td("SQL tables + pandas")}</tr>
              <tr>{td("Early")}{td("2–5 DS")}{td("5–20")}{td("Shared dbt + simple Redis + Notion registry")}</tr>
              <tr>{td("Growth")}{td("5–15 DS")}{td("20–100")}{td("Feast + managed Redis + BigQuery offline")}</tr>
              <tr>{td("Scale")}{td("15+ DS")}{td("100+")}{td("Hopsworks or Tecton")}</tr>
            </tbody>
          )}

          <Note>
            LinkedIn's lesson: "We waited too long. By the time we built a centralized feature
            store, we had 400+ models and 30% of feature engineering was duplicated." The right
            time to start is when you first feel the pain of coordination — not before.
          </Note>
        </>
      )
    },

  ]; // end STAGES

  // ── Wire up ML_META and ML_STAGES ──────────────────────────────────────────
  window.ML_META = {
    title: "Feature Store",
    subtitle: "Unified feature management for training and serving",
    cur: "Feature Store",
    category: "MLOps",
    run: () => ({}),
    default: {},
    renderInput: null,
    modeLinks: []
  };
  window.ML_STAGES = STAGES;

})();
