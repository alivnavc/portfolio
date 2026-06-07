/* ============================================================
   Post-Training — stages-posttrain.jsx (14 stages)
   Educational article — no sliders, no renderInput
   ============================================================ */
(function () {
  const { Lead, Note, fmt } = window;

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

  const info = (children) => (
    <div style={{ background:"rgba(43,91,255,.07)", border:"1px solid rgba(43,91,255,.2)",
      borderRadius:10, padding:"10px 14px", fontSize:13, color:"var(--ink)", margin:"10px 0" }}>
      {children}
    </div>
  );

  const warn = (children) => (
    <div style={{ background:"#fff8e6", border:"1px solid #f5c842", borderRadius:10,
      padding:"10px 14px", fontSize:13, color:"#7a5700", margin:"10px 0" }}>
      <b>Warning:</b> {children}
    </div>
  );

  // ════════════════════════════════════════════
  // STAGES
  // ════════════════════════════════════════════
  const STAGES = [

    // ─── STAGE 1 · overview ───────────────────────────────────────────────────
    {
      id: "overview",
      group: "Overview",
      title: "From Pre-Trained to Useful",
      map: "Pipeline",
      why: "A base model that predicts the next token is not the same thing as a useful assistant. Post-training is the sequence of steps that bridges that gap — making models that follow instructions, align with human values, and refuse harmful requests.",
      render: () => (
        <>
          <Lead>
            A pre-trained LLM is a powerful <b>text completion engine</b> — given a prompt
            it predicts the most likely continuation. That is useful but not what people want.
            Post-training transforms it into an <b>instruction-following assistant</b> that is
            helpful, harmless, and honest. The pipeline typically runs: base model
            <b> → CPT (optional) → SFT → RLHF or DPO → deployed assistant</b>.
          </Lead>

          {subhead("The Post-Training Pipeline")}
          <svg width="100%" viewBox="0 0 720 130" style={{display:"block", marginBottom:16, maxWidth:720}}>
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#888" />
              </marker>
            </defs>
            {/* Boxes */}
            <rect x="10" y="40" width="120" height="50" rx="10" fill="#eee" stroke="#bbb" strokeWidth="1.5"/>
            <text x="70" y="63" textAnchor="middle" fontSize="12" fontWeight="700" fill="#555">Pre-Trained</text>
            <text x="70" y="79" textAnchor="middle" fontSize="11" fill="#777">Base Model</text>

            <rect x="170" y="40" width="120" height="50" rx="10" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5"/>
            <text x="230" y="63" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">CPT</text>
            <text x="230" y="79" textAnchor="middle" fontSize="11" fill="#2B5BFF">optional</text>

            <rect x="330" y="40" width="120" height="50" rx="10" fill="#e8ffe8" stroke="#1a8a1a" strokeWidth="1.5"/>
            <text x="390" y="63" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a6a1a">SFT</text>
            <text x="390" y="79" textAnchor="middle" fontSize="11" fill="#1a6a1a">instruction tuning</text>

            <rect x="490" y="40" width="120" height="50" rx="10" fill="#fff3e8" stroke="#c06000" strokeWidth="1.5"/>
            <text x="550" y="63" textAnchor="middle" fontSize="12" fontWeight="700" fill="#a04000">RLHF / DPO</text>
            <text x="550" y="79" textAnchor="middle" fontSize="11" fill="#a04000">alignment</text>

            <rect x="640" y="40" width="72" height="50" rx="10" fill="#2B5BFF" stroke="#1a3acc" strokeWidth="1.5"/>
            <text x="676" y="63" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">Deploy</text>
            <text x="676" y="79" textAnchor="middle" fontSize="11" fill="#ccd8ff">assistant</text>

            {/* Arrows */}
            <line x1="130" y1="65" x2="168" y2="65" stroke="#888" strokeWidth="2" markerEnd="url(#arr)"/>
            <line x1="290" y1="65" x2="328" y2="65" stroke="#888" strokeWidth="2" markerEnd="url(#arr)"/>
            <line x1="450" y1="65" x2="488" y2="65" stroke="#888" strokeWidth="2" markerEnd="url(#arr)"/>
            <line x1="610" y1="65" x2="638" y2="65" stroke="#888" strokeWidth="2" markerEnd="url(#arr)"/>
          </svg>

          {subhead("What does each stage actually change?")}
          {tbl(
            <>
              <thead><tr>
                {th("Stage")} {th("What changes")} {th("Training signal")} {th("Data scale")}
              </tr></thead>
              <tbody>
                <tr>{td("CPT")}{td("Domain knowledge, vocabulary frequency")}{td("Next-token prediction (same as pretraining)")}{td("1–10B tokens")}</tr>
                <tr>{td("SFT")}{td("Instruction-following format, response style")}{td("Cross-entropy on assistant tokens only")}{td("1K–100K examples")}</tr>
                <tr>{td("RLHF/PPO")}{td("Helpfulness, safety, human preference alignment")}{td("Reward model + KL-constrained RL")}{td("50K–1M preference pairs")}</tr>
                <tr>{td("DPO")}{td("Same as RLHF but simpler")}{td("Direct preference loss (no reward model)")}{td("50K–500K preference pairs")}</tr>
              </tbody>
            </>
          )}

          {subhead("Base model output vs. post-trained output")}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14}}>
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#888", marginBottom:6}}>Base model (completion)</div>
              <div style={{fontSize:12, fontFamily:"monospace", lineHeight:1.6, color:"#555"}}>
                Prompt: "What is the capital of France?"<br/>
                Output: "What is the capital of Germany? What is the capital of Spain? What is the..."
              </div>
            </>)}
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#1a6a1a", marginBottom:6}}>After SFT</div>
              <div style={{fontSize:12, fontFamily:"monospace", lineHeight:1.6, color:"#333"}}>
                Prompt: "What is the capital of France?"<br/>
                Output: "The capital of France is Paris."
              </div>
            </>)}
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#a04000", marginBottom:6}}>After RLHF</div>
              <div style={{fontSize:12, fontFamily:"monospace", lineHeight:1.6, color:"#333"}}>
                Prompt: "What is the capital of France?"<br/>
                Output: "The capital of France is Paris, which has been the country's political center since the 10th century."
              </div>
            </>)}
          </div>

          {subhead("When to use which method")}
          {info(<>
            <b>Decision guide:</b> Start with SFT + LoRA for most tasks. Add RLHF/DPO when you need
            fine-grained preference alignment or safety tuning. Use CPT only when you need deep domain
            adaptation (e.g., a medical or legal specialist model).
          </>)}
        </>
      )
    },

    // ─── STAGE 2 · lifecycle ──────────────────────────────────────────────────
    {
      id: "lifecycle",
      group: "Overview",
      title: "The LLM Lifecycle — Which Technique, When, and Why",
      map: "Lifecycle",
      why: "Knowing WHAT each technique does is not enough — you need to know WHEN to reach for each one, what you gain, and what you give up. This is the decision map for building any LLM-based system.",
      render: () => (
        <>
          <Lead>
            Every production LLM goes through a sequence of training stages. Not all stages are
            mandatory — the right path depends on your domain, budget, data, and alignment
            requirements. This stage maps the full lifecycle and gives you the decision framework
            to choose the right path.
          </Lead>

          {subhead("Full LLM Lifecycle — Timeline")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 860 200" style={{ width:"100%", maxWidth:860, height:"auto", display:"block" }}>
              <defs>
                <marker id="lc-arr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#888" />
                </marker>
              </defs>

              {/* Phase boxes */}
              {[
                { x:10,  w:130, label:"Pre-Training",  sub:"always required",      bg:"rgba(100,100,100,.12)", stroke:"#888",    tc:"#555" },
                { x:162, w:120, label:"CPT",            sub:"if domain needed",     bg:"rgba(43,91,255,.12)",   stroke:"#2B5BFF", tc:"#2B5BFF" },
                { x:304, w:120, label:"SFT",            sub:"almost always",        bg:"rgba(31,158,107,.12)",  stroke:"#1f9e6b", tc:"#1a8a1a" },
                { x:446, w:148, label:"PEFT Choice",    sub:"full / LoRA / QLoRA",  bg:"rgba(124,58,237,.12)",  stroke:"#7c3aed", tc:"#7c3aed" },
                { x:616, w:148, label:"Alignment",      sub:"PPO / DPO / skip",     bg:"rgba(217,119,6,.12)",   stroke:"#d97706", tc:"#a05000" },
                { x:786, w:64,  label:"Deploy",         sub:"",                     bg:"#2B5BFF",               stroke:"#1a3acc", tc:"#fff" },
              ].map(function(p, i) {
                return (
                  <g key={i}>
                    <rect x={p.x} y={70} width={p.w} height={60} rx="10"
                      fill={p.bg} stroke={p.stroke} strokeWidth="1.8" />
                    <text x={p.x + p.w/2} y={96} textAnchor="middle"
                      fontSize="11.5" fontWeight="700" fill={p.tc}>{p.label}</text>
                    <text x={p.x + p.w/2} y={115} textAnchor="middle"
                      fontSize="9.5" fill={p.tc} opacity="0.85">{p.sub}</text>
                    {i < 5 &&
                      <line x1={p.x + p.w} y1={100} x2={p.x + p.w + 10} y2={100}
                        stroke="#aaa" strokeWidth="1.8" markerEnd="url(#lc-arr)" />
                    }
                  </g>
                );
              })}

              {/* "optional" brackets */}
              <path d="M162,62 L162,52 L283,52 L283,62" fill="none" stroke="#2B5BFF" strokeWidth="1.2" strokeDasharray="4 2"/>
              <text x="222" y="47" textAnchor="middle" fontSize="9" fill="#2B5BFF" fontWeight="600">optional</text>

              <path d="M616,62 L616,34 L763,34 L763,62" fill="none" stroke="#d97706" strokeWidth="1.2" strokeDasharray="4 2"/>
              <text x="689" y="28" textAnchor="middle" fontSize="9" fill="#d97706" fontWeight="600">optional but common</text>

              {/* Legend */}
              <text x="10" y="165" fontSize="9.5" fill="#888">
                {"Minimum viable path: Pre-Training → SFT → Deploy"}
              </text>
              <text x="10" y="182" fontSize="9.5" fill="#888">
                {"Full production path: Pre-Training → CPT → SFT → DPO/PPO → Deploy"}
              </text>
            </svg>
          </div>

          {subhead("CPT — When Do You Need It?")}
          {card(<>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:"#2B5BFF", marginBottom:6 }}>Use CPT when:</div>
                <ul style={{ fontSize:13, lineHeight:2.0, margin:0, paddingLeft:18, color:"var(--ink)" }}>
                  <li>Your domain is underrepresented in pretraining (medicine, law, niche code)</li>
                  <li>You need the model to understand domain-specific vocabulary fluently</li>
                  <li>You have large unlabeled domain text (1B+ tokens)</li>
                  <li>Your SFT is struggling even with good examples</li>
                </ul>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:"#dc2626", marginBottom:6 }}>Skip CPT when:</div>
                <ul style={{ fontSize:13, lineHeight:2.0, margin:0, paddingLeft:18, color:"var(--ink)" }}>
                  <li>Your domain is well-covered (general QA, customer support, coding)</li>
                  <li>You lack large unlabeled domain corpus</li>
                  <li>Time/compute is the bottleneck</li>
                  <li>SFT alone achieves acceptable performance</li>
                </ul>
              </div>
            </div>
          </>)}

          {subhead("SFT Method Decision — Full vs LoRA vs QLoRA")}
          {tbl(<>
            <thead>
              <tr>
                {th("Method")}
                {th("When to use")}
                {th("GPU requirement")}
                {th("Quality vs full SFT")}
                {th("Speed")}
                {th("Trainable params")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td(<b style={{color:"#dc2626"}}>Full SFT</b>)}
                {td("Flagship model, unlimited compute, max quality")}
                {td("8+ H100s (80GB each)")}
                {td(<span style={{color:"#059669", fontWeight:700}}>Baseline (100%)</span>)}
                {td("Slowest")}
                {td("100% (all weights)")}
              </tr>
              <tr>
                {td(<b style={{color:"#7c3aed"}}>LoRA</b>)}
                {td("Most production use cases — best default choice")}
                {td("1-2 A100/H100 (40-80GB)")}
                {td(<span style={{color:"#059669", fontWeight:700}}>~95-99% of full SFT</span>)}
                {td("3-5x faster")}
                {td("0.1-1% (rank matrices)")}
              </tr>
              <tr>
                {td(<b style={{color:"#d97706"}}>QLoRA</b>)}
                {td("Consumer GPU, budget constraints, quick iteration")}
                {td("Single 24GB consumer GPU (7B model)")}
                {td(<span style={{color:"#d97706", fontWeight:700}}>~90-95% of full SFT</span>)}
                {td("Similar to LoRA")}
                {td("0.1-1% (LoRA on NF4 base)")}
              </tr>
            </tbody>
          </>)}
          {info(<>
            <b>Rule of thumb:</b> Start with LoRA (r=32, target all linear layers). Only escalate to full SFT if
            LoRA plateaus. Only drop to QLoRA if you have hardware constraints.
          </>)}

          {subhead("Alignment Method Decision — PPO vs DPO vs Skip")}
          {tbl(<>
            <thead>
              <tr>
                {th("Method")}
                {th("When to use")}
                {th("Models required")}
                {th("Training stability")}
                {th("Memory cost")}
                {th("Quality ceiling")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td(<b style={{color:"#888"}}>Skip alignment</b>)}
                {td("Internal tools, domain tasks where SFT is sufficient")}
                {td("1 (policy only)")}
                {td(<span style={{color:"#059669"}}>N/A</span>)}
                {td("1× model")}
                {td("Limited — no preference signal")}
              </tr>
              <tr>
                {td(<b style={{color:"#d97706"}}>DPO</b>)}
                {td("Most alignment needs. Simpler, stable, good results")}
                {td("2 (policy + reference)")}
                {td(<span style={{color:"#059669", fontWeight:700}}>High — offline, no sampling</span>)}
                {td("2× model")}
                {td("Good — slightly below PPO")}
              </tr>
              <tr>
                {td(<b style={{color:"#dc2626"}}>RLHF + PPO</b>)}
                {td("Safety-critical, flagship models, best possible alignment")}
                {td("4 (policy + ref + reward + value)")}
                {td(<span style={{color:"#dc2626", fontWeight:700}}>Challenging — on-policy, reward hacking risk</span>)}
                {td("4× model")}
                {td(<span style={{color:"#059669", fontWeight:700}}>Best known method</span>)}
              </tr>
            </tbody>
          </>)}

          {subhead("Full Tradeoffs — All Techniques at a Glance")}
          {tbl(<>
            <thead>
              <tr>
                {th("Technique")}
                {th("What it fixes")}
                {th("Key pros")}
                {th("Key cons")}
                {th("Data needed")}
                {th("Compute")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td(<b>Pre-Training</b>)}
                {td("No knowledge at all")}
                {td("Builds all world knowledge, reasoning, language")}
                {td("Extremely expensive. Requires massive data pipeline")}
                {td("1T-15T tokens")}
                {td(<span style={{color:"#dc2626", fontWeight:700}}>Enormous</span>)}
              </tr>
              <tr>
                {td(<b>CPT</b>)}
                {td("Shallow domain knowledge")}
                {td("Deep domain fluency. Same objective as pretraining")}
                {td("Catastrophic forgetting risk. Needs large unlabeled corpus")}
                {td("1B-10B domain tokens")}
                {td(<span style={{color:"#d97706", fontWeight:700}}>Medium-High</span>)}
              </tr>
              <tr>
                {td(<b>Full SFT</b>)}
                {td("No instruction following")}
                {td("Highest quality. All parameters adapt")}
                {td("Requires 8+ H100s. Risk of overfitting on small datasets")}
                {td("1K-100K examples")}
                {td(<span style={{color:"#d97706", fontWeight:700}}>High</span>)}
              </tr>
              <tr>
                {td(<b>LoRA</b>)}
                {td("No instruction following")}
                {td("99% of full SFT quality. 100x less memory. Easy to swap")}
                {td("Slightly lower ceiling. Rank is a new hyperparameter")}
                {td("1K-100K examples")}
                {td(<span style={{color:"#059669", fontWeight:700}}>Low</span>)}
              </tr>
              <tr>
                {td(<b>QLoRA</b>)}
                {td("No instruction following (on consumer GPU)")}
                {td("Works on single 24GB GPU. Democratizes fine-tuning")}
                {td("Slower than LoRA. NF4 quantization artifacts possible")}
                {td("1K-100K examples")}
                {td(<span style={{color:"#059669", fontWeight:700}}>Very Low</span>)}
              </tr>
              <tr>
                {td(<b>DPO</b>)}
                {td("Preference alignment, safety")}
                {td("No reward model. Stable offline training. 2 models only")}
                {td("Less powerful than PPO. Needs good preference data")}
                {td("50K-500K pairs")}
                {td(<span style={{color:"#059669", fontWeight:700}}>Low-Medium</span>)}
              </tr>
              <tr>
                {td(<b>RLHF + PPO</b>)}
                {td("Best possible alignment")}
                {td("Strongest alignment. Online — policy improves during RL")}
                {td("4 models in memory. Reward hacking. Hyperparameter-sensitive")}
                {td("50K-1M pairs")}
                {td(<span style={{color:"#dc2626", fontWeight:700}}>Very High</span>)}
              </tr>
            </tbody>
          </>)}

          {subhead("Decision Flowchart — Which Path to Take")}
          <div style={{ overflowX:"auto", marginBottom:14 }}>
            <svg viewBox="0 0 780 380" style={{ width:"100%", maxWidth:780, height:"auto", display:"block" }}>
              <defs>
                <marker id="lc-a2" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>

              {/* Start */}
              <rect x="290" y="10" width="200" height="40" rx="20" fill="#2B5BFF" stroke="#1a3acc" strokeWidth="1.5"/>
              <text x="390" y="35" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">Start: Base Model</text>

              {/* Q1: Domain specialized? */}
              <line x1="390" y1="50" x2="390" y2="75" stroke="#555" strokeWidth="1.4" markerEnd="url(#lc-a2)"/>
              <rect x="230" y="75" width="320" height="38" rx="8" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.4"/>
              <text x="390" y="95" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#2B5BFF">Need deep domain expertise?</text>
              <text x="390" y="109" textAnchor="middle" fontSize="9.5" fill="#555">(medical / legal / specialized code / low-resource lang)</text>

              {/* YES → CPT */}
              <line x1="550" y1="94" x2="620" y2="94" stroke="#2B5BFF" strokeWidth="1.4" markerEnd="url(#lc-a2)"/>
              <text x="582" y="88" textAnchor="middle" fontSize="9" fill="#2B5BFF" fontWeight="700">YES</text>
              <rect x="620" y="74" width="90" height="40" rx="8" fill="rgba(43,91,255,.15)" stroke="#2B5BFF" strokeWidth="1.4"/>
              <text x="665" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">Run CPT</text>
              <text x="665" y="110" textAnchor="middle" fontSize="9" fill="#2B5BFF">1-10B tokens</text>

              {/* NO → skip CPT */}
              <line x1="390" y1="113" x2="390" y2="143" stroke="#555" strokeWidth="1.4" markerEnd="url(#lc-a2)"/>
              <text x="400" y="132" fontSize="9" fill="#555" fontWeight="700">NO / continue</text>

              {/* Q2: GPU budget? */}
              <rect x="210" y="143" width="360" height="38" rx="8" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.4"/>
              <text x="390" y="163" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#7c3aed">SFT method — GPU budget?</text>
              <text x="390" y="177" textAnchor="middle" fontSize="9.5" fill="#555">How much VRAM do you have?</text>

              {/* QLoRA branch */}
              <line x1="390" y1="181" x2="100" y2="220" stroke="#d97706" strokeWidth="1.4" markerEnd="url(#lc-a2)"/>
              <text x="220" y="196" fontSize="9" fill="#d97706" fontWeight="700">{"< 24GB (consumer)"}</text>
              <rect x="30" y="220" width="130" height="46" rx="8" fill="rgba(217,119,6,.12)" stroke="#d97706" strokeWidth="1.4"/>
              <text x="95" y="240" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a05000">QLoRA</text>
              <text x="95" y="256" textAnchor="middle" fontSize="9" fill="#a05000">NF4 + LoRA r=16-32</text>

              {/* LoRA branch */}
              <line x1="390" y1="181" x2="390" y2="220" stroke="#7c3aed" strokeWidth="1.4" markerEnd="url(#lc-a2)"/>
              <text x="400" y="205" fontSize="9" fill="#7c3aed" fontWeight="700">1-4 GPUs</text>
              <rect x="300" y="220" width="180" height="46" rx="8" fill="rgba(124,58,237,.12)" stroke="#7c3aed" strokeWidth="1.4"/>
              <text x="390" y="240" textAnchor="middle" fontSize="11" fontWeight="700" fill="#7c3aed">LoRA (recommended)</text>
              <text x="390" y="256" textAnchor="middle" fontSize="9" fill="#7c3aed">r=32, all linear layers</text>

              {/* Full SFT branch */}
              <line x1="390" y1="181" x2="640" y2="220" stroke="#dc2626" strokeWidth="1.4" markerEnd="url(#lc-a2)"/>
              <text x="540" y="196" fontSize="9" fill="#dc2626" fontWeight="700">{"8+ H100s"}</text>
              <rect x="590" y="220" width="130" height="46" rx="8" fill="rgba(220,38,38,.12)" stroke="#dc2626" strokeWidth="1.4"/>
              <text x="655" y="240" textAnchor="middle" fontSize="11" fontWeight="700" fill="#dc2626">Full SFT</text>
              <text x="655" y="256" textAnchor="middle" fontSize="9" fill="#dc2626">all params, 2-5 epochs</text>

              {/* Merge all to Q3 */}
              <line x1="95"  y1="266" x2="390" y2="300" stroke="#555" strokeWidth="1.2" markerEnd="url(#lc-a2)"/>
              <line x1="390" y1="266" x2="390" y2="300" stroke="#555" strokeWidth="1.2" markerEnd="url(#lc-a2)"/>
              <line x1="655" y1="266" x2="390" y2="300" stroke="#555" strokeWidth="1.2" markerEnd="url(#lc-a2)"/>

              {/* Q3: Alignment needed? */}
              <rect x="220" y="300" width="340" height="38" rx="8" fill="#fff7ed" stroke="#d97706" strokeWidth="1.4"/>
              <text x="390" y="320" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#a05000">Need preference alignment / safety?</text>
              <text x="390" y="335" textAnchor="middle" fontSize="9.5" fill="#555">helpfulness, RLHF-style tuning</text>

              {/* Skip → Deploy */}
              <line x1="560" y1="319" x2="700" y2="319" stroke="#888" strokeWidth="1.4" markerEnd="url(#lc-a2)"/>
              <text x="628" y="312" textAnchor="middle" fontSize="9" fill="#888" fontWeight="700">NO → deploy</text>
              <rect x="700" y="299" width="70" height="40" rx="10" fill="#2B5BFF" stroke="#1a3acc" strokeWidth="1.5"/>
              <text x="735" y="322" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">Deploy</text>

              {/* DPO / PPO */}
              <line x1="390" y1="338" x2="390" y2="358" stroke="#555" strokeWidth="1.4" markerEnd="url(#lc-a2)"/>
              <text x="400" y="352" fontSize="9" fill="#555" fontWeight="700">YES</text>
              <rect x="230" y="358" width="140" height="40" rx="8" fill="rgba(217,119,6,.12)" stroke="#d97706" strokeWidth="1.4"/>
              <text x="300" y="378" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a05000">DPO (default)</text>
              <rect x="400" y="358" width="140" height="40" rx="8" fill="rgba(220,38,38,.12)" stroke="#dc2626" strokeWidth="1.4"/>
              <text x="470" y="378" textAnchor="middle" fontSize="11" fontWeight="700" fill="#dc2626">PPO (flagship)</text>
            </svg>
          </div>

          {info(<>
            <b>Practical starting point for 99% of projects:</b> LoRA SFT (r=32, lr=2e-4, 3 epochs) →
            evaluate → if alignment needed, add DPO (beta=0.1). Only escalate to full SFT or PPO
            once you have evidence that simpler methods are the bottleneck.
          </>)}
        </>
      )
    },

    // ─── STAGE 3 · cpt ────────────────────────────────────────────────────────
    {
      id: "cpt",
      group: "Phases",
      title: "Continued Pre-Training (CPT)",
      map: "CPT",
      why: "A general-purpose base model knows a little about everything. CPT lets you inject deep domain expertise — medical literature, legal case law, source code — by continuing the exact same pre-training objective on new data.",
      render: () => (
        <>
          <Lead>
            Continued Pre-Training (CPT) runs the <b>exact same next-token prediction objective</b> as
            pre-training, but on a targeted corpus of domain-specific text. The model never sees any
            instruction format — just raw text. It is purely a knowledge and distribution update.
          </Lead>

          {subhead("When to use CPT")}
          {tbl(
            <>
              <thead><tr>{th("Use case")}{th("Why CPT helps")}{th("Example corpus")}</tr></thead>
              <tbody>
                <tr>{td("Medical domain")}{td("Base model underrepresents clinical notes, drug names, ICD codes")}{td("PubMed, clinical notes, medical textbooks")}</tr>
                <tr>{td("Legal domain")}{td("Legal writing style and citation format are rare in web data")}{td("Case law, statutes, legal briefs")}</tr>
                <tr>{td("Code specialist")}{td("Specific languages (Rust, COBOL) are underrepresented")}{td("GitHub repos filtered by language")}</tr>
                <tr>{td("Knowledge update")}{td("Model was trained with a data cutoff, facts have changed")}{td("Recent news, updated Wikipedia")}</tr>
                <tr>{td("Multilingual")}{td("Low-resource language has poor coverage in base model")}{td("Native-language web crawl")}</tr>
              </tbody>
            </>
          )}

          {subhead("Data format — identical to pre-training")}
          <p style={{fontSize:14, color:"var(--ink)", marginBottom:8}}>
            CPT data is just raw text, tokenized and packed into fixed-length sequences.
            No special structure, no conversation templates. This is different from SFT.
          </p>
          {codeBlock(
            "# Example: packed sequence from medical corpus\n" +
            "# Tokens: [CLS] The patient presented with acute myocardial infarction...\n" +
            "#          ...elevated troponin levels... [SEQ continues to max_length]\n" +
            "# Loss: computed on ALL tokens (unlike SFT which masks system/user tokens)"
          )}

          {subhead("Catastrophic Forgetting — the key risk")}
          {warn("Training only on domain data will cause the model to forget general knowledge. After 1B tokens of pure medical text, the model may perform worse on general reasoning benchmarks.")}
          <p style={{fontSize:14, color:"var(--ink)", marginBottom:8}}>
            The solution is <b>data mixing</b>: replay a fraction of the original pre-training data
            alongside the new domain data.
          </p>
          {card(<>
            <div style={{fontWeight:700, fontSize:13, marginBottom:8}}>Data Mixing Formula</div>
            {tbl(
              <>
                <thead><tr>{th("Component")}{th("Fraction")}{th("Purpose")}</tr></thead>
                <tbody>
                  <tr>{td("Domain-specific data (medical)")}{td("80–95%")}{td("Inject target domain knowledge")}</tr>
                  <tr>{td("General pre-training replay")}{td("5–20%")}{td("Prevent catastrophic forgetting")}</tr>
                </tbody>
              </>
            )}
          </>)}

          {subhead("How CPT Differs from Pre-Training — Visual")}
          <div style={{ overflowX:"auto", marginBottom:18 }}>
            <svg viewBox='0 0 720 220' style={{ width:"100%", maxWidth:720, height:"auto", display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              <defs>
                <marker id='arr-cpt' markerWidth='7' markerHeight='7' refX='5' refY='3.5' orient='auto'>
                  <polygon points='0 0, 7 3.5, 0 7' fill='#555' />
                </marker>
              </defs>
              {/* LEFT column — Pre-Training */}
              <text x={175} y={20} textAnchor='middle' fontSize='12' fontWeight='700' fill='#2B5BFF'>Pre-Training (from scratch)</text>
              <rect x={60} y={30} width={230} height={30} rx='6' fill='rgba(43,91,255,.12)' stroke='#2B5BFF' strokeWidth='1.5' />
              <text x={175} y={50} textAnchor='middle' fontSize='10.5' fill='#2B5BFF'>Web crawl / GitHub / arXiv</text>
              <line x1={175} y1={60} x2={175} y2={76} stroke='#555' strokeWidth='1.4' markerEnd='url(#arr-cpt)' />
              <rect x={100} y={78} width={150} height={26} rx='6' fill='rgba(43,91,255,.10)' stroke='#2B5BFF' strokeWidth='1.2' />
              <text x={175} y={95} textAnchor='middle' fontSize='10' fill='#2B5BFF'>BPE tokenize</text>
              <line x1={175} y1={104} x2={175} y2={120} stroke='#555' strokeWidth='1.4' markerEnd='url(#arr-cpt)' />
              <rect x={100} y={122} width={150} height={26} rx='6' fill='rgba(43,91,255,.10)' stroke='#2B5BFF' strokeWidth='1.2' />
              <text x={175} y={139} textAnchor='middle' fontSize='10' fill='#2B5BFF'>Pack sequences (4096 tok)</text>
              <line x1={175} y1={148} x2={175} y2={164} stroke='#555' strokeWidth='1.4' markerEnd='url(#arr-cpt)' />
              <rect x={60} y={166} width={230} height={30} rx='6' fill='rgba(43,91,255,.18)' stroke='#2B5BFF' strokeWidth='1.5' />
              <text x={175} y={182} textAnchor='middle' fontSize='10' fontWeight='700' fill='#2B5BFF'>Train from scratch</text>
              <text x={175} y={196} textAnchor='middle' fontSize='9' fill='#2B5BFF'>LR=1e-4 · 15T+ tokens · all params</text>

              {/* Divider */}
              <line x1={360} y1={10} x2={360} y2={215} stroke='#ddd' strokeWidth='1.5' strokeDasharray='6 3' />

              {/* RIGHT column — CPT */}
              <text x={545} y={20} textAnchor='middle' fontSize='12' fontWeight='700' fill='#059669'>CPT (from checkpoint)</text>
              <rect x={430} y={30} width={230} height={30} rx='6' fill='rgba(5,150,105,.12)' stroke='#059669' strokeWidth='1.5' />
              <text x={545} y={50} textAnchor='middle' fontSize='10.5' fill='#059669'>Medical / Legal / Code corpus</text>
              <line x1={545} y1={60} x2={545} y2={76} stroke='#555' strokeWidth='1.4' markerEnd='url(#arr-cpt)' />
              <rect x={470} y={78} width={150} height={26} rx='6' fill='rgba(5,150,105,.10)' stroke='#059669' strokeWidth='1.2' />
              <text x={545} y={95} textAnchor='middle' fontSize='10' fill='#059669'>BPE tokenize (same vocab)</text>
              <line x1={545} y1={104} x2={545} y2={120} stroke='#555' strokeWidth='1.4' markerEnd='url(#arr-cpt)' />
              <rect x={470} y={122} width={150} height={26} rx='6' fill='rgba(5,150,105,.10)' stroke='#059669' strokeWidth='1.2' />
              <text x={545} y={139} textAnchor='middle' fontSize='10' fill='#059669'>Pack sequences (4096 tok)</text>
              <line x1={545} y1={148} x2={545} y2={164} stroke='#555' strokeWidth='1.4' markerEnd='url(#arr-cpt)' />
              <rect x={430} y={166} width={230} height={30} rx='6' fill='rgba(217,119,6,.20)' stroke='#d97706' strokeWidth='2' />
              <text x={545} y={182} textAnchor='middle' fontSize='10' fontWeight='700' fill='#b45309'>Continue from checkpoint</text>
              <text x={545} y={196} textAnchor='middle' fontSize='9' fill='#d97706'>LR=1e-5 (10x lower) · 1-10B tok · +5-20% replay</text>

              {/* Diff callout */}
              <rect x={415} y={162} width={14} height={14} rx='3' fill='#d97706' />
              <text x={422} y={173} textAnchor='middle' fontSize='9' fontWeight='700' fill='#fff'>!</text>
            </svg>
          </div>

          {subhead("Evaluating CPT — How Do You Know It Worked?")}
          {tbl(
            <>
              <thead><tr>{th("Metric")}{th("How to Measure")}{th("Target")}</tr></thead>
              <tbody>
                <tr>{td("Domain perplexity")}{td("Eval on held-out domain text")}{td("Should drop 10–40% vs base model")}</tr>
                <tr>{td("General perplexity")}{td("Eval on general text (C4, WikiText)")}{td("Should NOT increase >2–3%")}</tr>
                <tr>{td("Domain benchmark")}{td("Medical: MedQA, PubMedQA / Legal: LegalBench")}{td("Increase in accuracy")}</tr>
                <tr>{td("Catastrophic forgetting")}{td("MMLU, HellaSwag compared to base")}{td("Should stay within 1–2%")}</tr>
              </tbody>
            </>
          )}
          {info("Rule of thumb: domain perplexity drop of 15–40% with <3% general degradation indicates successful CPT.")}

          {subhead("CPT Data Pipeline — What the Code Looks Like")}
          {codeBlock(
            "# CPT data pipeline (simplified)\n" +
            "domain_data = load_dataset('medical_corpus')    # 5B tokens\n" +
            "general_data = load_dataset('c4', split='en')   # replay 5%\n" +
            "\n" +
            "# Mix: 95% domain, 5% general (sample by weight)\n" +
            "mixed_dataset = interleave_datasets(\n" +
            "    [domain_data, general_data],\n" +
            "    probabilities=[0.95, 0.05],\n" +
            "    stopping_strategy='all_exhausted'\n" +
            ")\n" +
            "\n" +
            "# Same packing as pre-training\n" +
            "packed = pack_sequences(mixed_dataset, max_length=4096)\n" +
            "\n" +
            "# Resume from pre-trained checkpoint\n" +
            "model = AutoModelForCausalLM.from_pretrained('base_model')\n" +
            "optimizer = AdamW(model.parameters(), lr=1e-5)  # 10x lower than pre-training"
          )}

          {subhead("CPT Hyperparameters")}
          {tbl(
            <>
              <thead><tr>{th("Parameter")}{th("CPT value")}{th("Why lower than pre-training")}</tr></thead>
              <tbody>
                <tr>{td("Learning rate")}{td("1e-5 to 5e-5")}{td("Pre-training used 1e-4. Lower LR preserves most weights, only shifts distribution")}</tr>
                <tr>{td("LR schedule")}{td("Cosine decay from checkpoint")}{td("Resume from pre-trained LR schedule")}</tr>
                <tr>{td("Data volume")}{td("1B to 10B tokens")}{td("Domain corpus is smaller than pre-training corpus")}</tr>
                <tr>{td("Sequence packing")}{td("Yes — concat docs up to max_len")}{td("Same as pre-training for GPU efficiency")}</tr>
                <tr>{td("General data replay")}{td("5–20% of batch")}{td("Empirically prevents catastrophic forgetting")}</tr>
              </tbody>
            </>
          )}
        </>
      )
    },

    // ─── STAGE 3 · sft_format ─────────────────────────────────────────────────
    {
      id: "sft_format",
      group: "SFT",
      title: "SFT Data Formats — ChatML, Alpaca, Llama 3",
      map: "SFT Formats",
      why: "The training data format is not cosmetic — it must match exactly what the model will see at inference time. Training with ChatML and then inferring with Llama 3 format will silently break your model.",
      render: () => (
        <>
          <Lead>
            Supervised Fine-Tuning requires structured conversation data. Three major formats
            have become standard. Each marks conversation roles differently, and the loss is computed
            <b> only on the assistant turn tokens</b> — system and user tokens are masked out.
          </Lead>

          {subhead("Format 1: ChatML (OpenAI, adopted widely)")}
          {codeBlock(
            "<|im_start|>system\n" +
            "You are a helpful assistant.<|im_end|>\n" +
            "<|im_start|>user\n" +
            "What is the capital of France?<|im_end|>\n" +
            "<|im_start|>assistant\n" +
            "The capital of France is Paris.<|im_end|>"
          )}

          {subhead("Format 2: Llama 3 Chat Template")}
          {codeBlock(
            "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n" +
            "You are a helpful assistant.<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n" +
            "What is the capital of France?<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n" +
            "The capital of France is Paris.<|eot_id|>"
          )}

          {subhead("Format 3: Alpaca (older, single-turn)")}
          {codeBlock(
            '{"instruction": "Summarize this document",\n' +
            ' "input": "The document text here...",\n' +
            ' "output": "A concise summary of the document."}'
          )}

          {subhead("Multi-turn: ShareGPT format")}
          {codeBlock(
            '{"conversations": [\n' +
            '  {"from": "human", "value": "Write a Python function to reverse a string."},\n' +
            '  {"from": "gpt", "value": "def reverse_string(s):\\n    return s[::-1]"},\n' +
            '  {"from": "human", "value": "Now make it handle None input safely."},\n' +
            '  {"from": "gpt", "value": "def reverse_string(s):\\n    if s is None: return None\\n    return s[::-1]"}\n' +
            ']}'
          )}

          {subhead("Loss Masking — Critical Detail")}
          {card(<>
            <div style={{fontWeight:700, fontSize:13, marginBottom:8}}>Which tokens contribute to the loss?</div>
            <div style={{fontFamily:"monospace", fontSize:12, lineHeight:2}}>
              <span style={{background:"#eee", padding:"2px 6px", borderRadius:4, color:"#888"}}>[SYSTEM tokens] label = -100, no gradient</span>
              {"  "}
              <span style={{background:"#eee", padding:"2px 6px", borderRadius:4, color:"#888"}}>[USER tokens] label = -100, no gradient</span>
              {"  "}
              <span style={{background:"#d4f5d4", padding:"2px 6px", borderRadius:4, color:"#1a6a1a"}}>[ASSISTANT tokens] label = token_id, loss computed here</span>
            </div>
            <p style={{fontSize:13, color:"var(--ink)", margin:"10px 0 0"}}>
              Setting system/user token labels to <b>-100</b> makes PyTorch's CrossEntropyLoss ignore them.
              This teaches the model to generate assistant responses, not to repeat prompts.
            </p>
          </>)}

          {subhead("Format Comparison")}
          {tbl(
            <>
              <thead><tr>{th("Format")}{th("Role delimiters")}{th("Multi-turn")}{th("Used by")}</tr></thead>
              <tbody>
                <tr>{td("ChatML")}{td("<|im_start|> / <|im_end|>")}{td("Yes")}{td("OpenAI, Mistral, Qwen, many open models")}</tr>
                <tr>{td("Llama 3")}{td("<|start_header_id|> / <|eot_id|>")}{td("Yes")}{td("Meta Llama 3.x family")}</tr>
                <tr>{td("Alpaca")}{td("### Instruction: / ### Response:")}{td("No (single turn)")}{td("Stanford Alpaca, older models")}</tr>
                <tr>{td("ShareGPT")}{td("from: human / from: gpt")}{td("Yes")}{td("Community datasets, converted to ChatML for training")}</tr>
              </tbody>
            </>
          )}

          {info(<>
            <b>Key rule:</b> The tokenizer chat template you use for training must be identical to
            the template used at inference time. Most tokenizers store the template in
            tokenizer_config.json as a Jinja2 template string.
          </>)}
        </>
      )
    },

    // ─── STAGE 4 · sft_training ───────────────────────────────────────────────
    {
      id: "sft_training",
      group: "SFT",
      title: "SFT Training — What Changes vs Pre-Training",
      map: "SFT Training",
      why: "SFT looks deceptively similar to pre-training — same cross-entropy loss, same optimizer. But three critical differences define it: loss masking, a much smaller dataset, and a much lower learning rate.",
      render: () => (
        <>
          <Lead>
            Supervised Fine-Tuning uses cross-entropy loss, AdamW, and cosine LR decay — the
            same ingredients as pre-training. What changes are (1) which tokens contribute to loss,
            (2) the scale of data, and (3) the learning rate. Get any of these wrong and you will
            either overfit, forget pre-trained knowledge, or produce a model that ignores instructions.
          </Lead>

          {subhead("The 3 Key Differences from Pre-Training")}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14}}>
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#2B5BFF", marginBottom:6}}>1. Loss Masking</div>
              <p style={{fontSize:13, margin:0}}>
                Only <b>assistant tokens</b> contribute to loss. System and user tokens get label -100.
                Pre-training computes loss on every token.
              </p>
            </>)}
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#1a8a1a", marginBottom:6}}>2. Smaller Dataset</div>
              <p style={{fontSize:13, margin:0}}>
                SFT uses <b>1K–100K examples</b>, not trillions of tokens.
                Quality dominates quantity — 2K expert examples often beat 20K crowdsourced ones.
              </p>
            </>)}
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#a04000", marginBottom:6}}>3. Lower LR</div>
              <p style={{fontSize:13, margin:0}}>
                Pre-training: ~1e-4. SFT: <b>1e-5 to 3e-5</b>. Large LR would overwrite
                pre-trained knowledge rather than gently reshaping behavior.
              </p>
            </>)}
          </div>

          {subhead("Recommended SFT Hyperparameters")}
          {tbl(
            <>
              <thead><tr>{th("Parameter")}{th("Recommended value")}{th("Notes")}</tr></thead>
              <tbody>
                <tr>{td("Learning rate")}{td("1e-5 to 3e-5")}{td("Lower end for larger models; too high causes forgetting")}</tr>
                <tr>{td("LR schedule")}{td("Cosine decay + 3% warmup")}{td("Warmup prevents early instability")}</tr>
                <tr>{td("Effective batch size")}{td("64 to 256")}{td("Use gradient accumulation if GPU memory is limited")}</tr>
                <tr>{td("Epochs")}{td("2 to 5")}{td("More epochs cause overfitting on small SFT datasets")}</tr>
                <tr>{td("Max sequence length")}{td("2048 to 8192")}{td("Match model's context window; pack short examples")}</tr>
                <tr>{td("Optimizer")}{td("AdamW")}{td("beta1=0.9, beta2=0.95, weight_decay=0.01–0.1")}</tr>
                <tr>{td("Gradient clipping")}{td("1.0")}{td("Prevents gradient spikes from long sequences")}</tr>
              </tbody>
            </>
          )}

          {subhead("Overfitting Risk")}
          {warn("SFT datasets are tiny relative to pre-training. After 5 epochs on 10K examples, loss on the training set will continue to drop but performance on unseen prompts will plateau or degrade. Always hold out 5–10% as an evaluation set.")}

          {subhead("Data Quality vs Quantity")}
          {card(<>
            <div style={{fontWeight:700, fontSize:13, marginBottom:8}}>Rule of thumb from research</div>
            {tbl(
              <>
                <thead><tr>{th("Dataset")}{th("Size")}{th("Typical MT-Bench score")}</tr></thead>
                <tbody>
                  <tr>{td("Expert-annotated (e.g., OpenAssistant top tier)")}{td("2K examples")}{td("Higher — consistent quality, diverse tasks")}</tr>
                  <tr>{td("Crowdsourced (variable quality)")}{td("20K examples")}{td("Often lower — noise introduces inconsistent format and style")}</tr>
                  <tr>{td("GPT-4 distillation (high quality)")}{td("10K examples")}{td("Competitive — used in Vicuna, WizardLM")}</tr>
                </tbody>
              </>
            )}
          </>)}

          {subhead("Evaluation Benchmarks")}
          {tbl(
            <>
              <thead><tr>{th("Benchmark")}{th("What it measures")}{th("Format")}</tr></thead>
              <tbody>
                <tr>{td("MT-Bench")}{td("Multi-turn instruction following, reasoning, coding")}{td("GPT-4 judge, score 1–10")}</tr>
                <tr>{td("Alpaca-Eval")}{td("Single-turn instruction following vs text-davinci-003")}{td("GPT-4 win-rate")}</tr>
                <tr>{td("MMLU")}{td("Knowledge across 57 academic subjects")}{td("4-choice multiple choice, accuracy")}</tr>
                <tr>{td("HumanEval")}{td("Python code generation correctness")}{td("Pass@1 and pass@10")}</tr>
              </tbody>
            </>
          )}
        </>
      )
    },

    // ─── STAGE 5 · lora_why ───────────────────────────────────────────────────
    {
      id: "lora_why",
      group: "PEFT",
      title: "Why PEFT? The Full Fine-Tune Memory Problem",
      map: "PEFT Motivation",
      why: "Full fine-tuning a 7B model requires ~126 GB of GPU memory for parameters, optimizer states, and gradients — far beyond any single consumer GPU. PEFT methods like LoRA train only a tiny fraction of parameters while achieving competitive results.",
      render: () => (
        <>
          <Lead>
            Full fine-tuning copies the entire model into GPU memory, then creates two more copies
            for Adam optimizer states (first and second moment), plus gradients.
            For a 7B model in BF16, that is roughly <b>126 GB</b> — requiring 2 H100s just to start.
            Parameter-Efficient Fine-Tuning (PEFT) eliminates this problem.
          </Lead>

          {subhead("Memory Breakdown for 7B Model Full Fine-Tune")}
          {tbl(
            <>
              <thead><tr>{th("Component")}{th("Calculation")}{th("Memory (BF16/FP32)")}</tr></thead>
              <tbody>
                <tr>{td("Model parameters")}{td("7B params x 2 bytes (BF16)")}{td("~14 GB")}</tr>
                <tr>{td("Gradients")}{td("7B params x 4 bytes (FP32)")}{td("~28 GB")}</tr>
                <tr>{td("Adam m (first moment)")}{td("7B params x 4 bytes (FP32)")}{td("~28 GB")}</tr>
                <tr>{td("Adam v (second moment)")}{td("7B params x 4 bytes (FP32)")}{td("~28 GB")}</tr>
                <tr>{td("Activations (batch=8)")}{td("Depends on seq length, layers")}{td("~8–16 GB")}</tr>
                <tr>{td(<b>Total estimate</b>)}{td("")}{td(<b>~106–126 GB</b>)}</tr>
              </tbody>
            </>
          )}

          {subhead("LoRA Solution: Freeze the Base, Train Only Small Adapters")}
          {tbl(
            <>
              <thead><tr>{th("Method")}{th("Trainable params")}{th("GPU memory")}{th("Quality vs full FT")}</tr></thead>
              <tbody>
                <tr>{td("Full fine-tune (7B)")}{td("7B (100%)")}{td("~126 GB")}{td("Baseline")}</tr>
                <tr>{td("LoRA r=16 (7B)")}{td("~130M (1.8%)")}{td("~18 GB")}{td("Within 1–3% on most benchmarks")}</tr>
                <tr>{td("QLoRA r=16 (7B)")}{td("~130M (1.8%)")}{td("~6 GB")}{td("Within 2–5% on most benchmarks")}</tr>
              </tbody>
            </>
          )}

          {subhead("Other PEFT Methods (brief)")}
          {tbl(
            <>
              <thead><tr>{th("Method")}{th("How it works")}{th("When to use")}</tr></thead>
              <tbody>
                <tr>{td("LoRA")}{td("Low-rank weight decomposition added to frozen weights")}{td("Most tasks — best quality/efficiency tradeoff")}</tr>
                <tr>{td("Prefix Tuning")}{td("Learnable virtual tokens prepended to every layer's key/value")}{td("Few-shot adaptation, no weight modification")}</tr>
                <tr>{td("Adapters")}{td("Small bottleneck MLP layers inserted between transformer layers")}{td("Multi-task: swap adapters per task at inference")}</tr>
                <tr>{td("IA3")}{td("Learned rescaling vectors applied to attention keys, values, FFN")}{td("Extreme parameter efficiency; fewer params than LoRA")}</tr>
              </tbody>
            </>
          )}

          {info(<>
            <b>Practical takeaway:</b> LoRA has become the default PEFT method because it is simple,
            well-supported in libraries like HuggingFace PEFT and Axolotl, and achieves near-full-fine-tune
            quality for most instruction-tuning tasks. Start with LoRA and only move to full fine-tuning
            if you hit a quality ceiling.
          </>)}
        </>
      )
    },

    // ─── STAGE 6 · lora_math ──────────────────────────────────────────────────
    {
      id: "lora_math",
      group: "PEFT",
      title: "LoRA — Low-Rank Adaptation Math",
      map: "LoRA Math",
      why: "LoRA works by decomposing the weight update into two thin matrices whose product has the same shape as the original weight change. The math is elegant and the parameter savings are dramatic.",
      render: () => (
        <>
          <Lead>
            LoRA freezes the original pre-trained weight matrix <b>W₀</b> and adds a trainable
            low-rank decomposition <b>B x A</b> where both B and A are much smaller than W₀.
            The forward pass becomes W₀x + (alpha/r) * B * A * x — identical output shape,
            a fraction of the parameters.
          </Lead>

          {subhead("LoRA Formula")}
          {card(<>
            <div style={{fontFamily:"monospace", fontSize:15, fontWeight:700, textAlign:"center", padding:"12px 0", letterSpacing:1}}>
              W_adapted = W0 + (alpha / r) x B x A
            </div>
            {tbl(
              <>
                <thead><tr>{th("Symbol")}{th("Shape")}{th("Trainable?")}{th("Initialized")}</tr></thead>
                <tbody>
                  <tr>{td("W0")}{td("d x k (e.g., 4096 x 4096)")}{td("No — frozen")}{td("Pre-trained weights (fixed)")}</tr>
                  <tr>{td("B")}{td("d x r (e.g., 4096 x 16)")}{td("Yes")}{td("All zeros — so delta W = 0 at start")}</tr>
                  <tr>{td("A")}{td("r x k (e.g., 16 x 4096)")}{td("Yes")}{td("Random from N(0, sigma^2)")}</tr>
                  <tr>{td("r")}{td("scalar (rank)")}{td("Hyperparameter")}{td("Controls capacity: 8, 16, 32, 64")}</tr>
                  <tr>{td("alpha")}{td("scalar")}{td("Hyperparameter")}{td("Scaling factor; common: alpha = 2r")}</tr>
                </tbody>
              </>
            )}
          </>)}

          {subhead("Why initialize B=zeros?")}
          {info(<>
            At training start, delta W = B x A = 0 x A = 0. This means the adapted model is
            identical to the pre-trained model at step 0. Training starts from a stable baseline
            rather than adding random noise to the weights immediately.
          </>)}

          {subhead("Parameter Reduction Example")}
          <svg width="100%" viewBox="0 0 680 160" style={{display:"block", marginBottom:16, maxWidth:680}}>
            <defs>
              <marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#888" />
              </marker>
            </defs>
            {/* W0 big square */}
            <rect x="10" y="20" width="90" height="90" rx="6" fill="#ffe8e8" stroke="#c03030" strokeWidth="1.5"/>
            <text x="55" y="55" textAnchor="middle" fontSize="13" fontWeight="700" fill="#c03030">W0</text>
            <text x="55" y="72" textAnchor="middle" fontSize="11" fill="#c03030">4096 x 4096</text>
            <text x="55" y="88" textAnchor="middle" fontSize="10" fill="#c03030">16.8M params</text>
            <text x="55" y="128" textAnchor="middle" fontSize="11" fill="#888">original weight</text>

            <text x="118" y="68" textAnchor="middle" fontSize="18" fill="#888">+</text>

            {/* B thin tall */}
            <rect x="134" y="20" width="22" height="90" rx="5" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5"/>
            <text x="145" y="62" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2B5BFF">B</text>
            <text x="145" y="76" textAnchor="middle" fontSize="9" fill="#2B5BFF">4096</text>
            <text x="145" y="88" textAnchor="middle" fontSize="9" fill="#2B5BFF">x 16</text>
            <text x="145" y="128" textAnchor="middle" fontSize="11" fill="#888">65K</text>

            <text x="172" y="68" textAnchor="middle" fontSize="14" fill="#888">x</text>

            {/* A thin wide */}
            <rect x="184" y="50" width="90" height="22" rx="5" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5"/>
            <text x="229" y="62" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2B5BFF">A</text>
            <text x="229" y="74" textAnchor="middle" fontSize="9" fill="#2B5BFF">16 x 4096</text>
            <text x="229" y="128" textAnchor="middle" fontSize="11" fill="#888">65K</text>

            <text x="294" y="68" textAnchor="middle" fontSize="13" fill="#555">=</text>
            <text x="294" y="84" textAnchor="middle" fontSize="10" fill="#555">delta W</text>

            {/* delta W same size */}
            <rect x="310" y="20" width="90" height="90" rx="6" fill="#e8ffe8" stroke="#1a8a1a" strokeWidth="1.5"/>
            <text x="355" y="55" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a8a1a">delta W</text>
            <text x="355" y="72" textAnchor="middle" fontSize="11" fill="#1a8a1a">4096 x 4096</text>
            <text x="355" y="88" textAnchor="middle" fontSize="10" fill="#1a8a1a">same shape!</text>
            <text x="355" y="128" textAnchor="middle" fontSize="11" fill="#888">only 131K trained</text>

            {/* Savings callout */}
            <rect x="430" y="30" width="230" height="70" rx="8" fill="#f5fff5" stroke="#1a8a1a" strokeWidth="1.5"/>
            <text x="545" y="52" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a6a1a">Parameter savings</text>
            <text x="545" y="70" textAnchor="middle" fontSize="12" fill="#1a6a1a">16.8M  ->  131K trainable</text>
            <text x="545" y="88" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a6a1a">99.2% reduction</text>
          </svg>

          {subhead("Which layers to adapt — target layer guide")}
          {tbl(
            <>
              <thead><tr>{th("Task type")}{th("Rank (r)")}{th("Alpha")}{th("Target modules")}</tr></thead>
              <tbody>
                <tr>{td("Simple style / tone")}{td("8–16")}{td("16–32")}{td("q_proj, v_proj only")}</tr>
                <tr>{td("General SFT / instruction following")}{td("32")}{td("64")}{td("All attention projections + FFN gates")}</tr>
                <tr>{td("Complex coding / math")}{td("64")}{td("128")}{td("All linear layers (attention + FFN + embed)")}</tr>
              </tbody>
            </>
          )}
        </>
      )
    },

    // ─── STAGE 7 · qlora ──────────────────────────────────────────────────────
    {
      id: "qlora",
      group: "PEFT",
      title: "QLoRA — Fine-Tuning on Consumer GPUs",
      map: "QLoRA",
      why: "QLoRA combines 4-bit quantization of the frozen base model with BF16 LoRA adapters, enabling 7B model fine-tuning on a single 24 GB consumer GPU. This democratized LLM fine-tuning when published by Dettmers et al. in 2023.",
      render: () => (
        <>
          <Lead>
            QLoRA stacks two innovations on top of LoRA: (1) the frozen base model weights are
            quantized to <b>4-bit NF4</b> format, and (2) a technique called double quantization
            further compresses the quantization constants themselves. The LoRA adapters stay in BF16
            and receive gradients normally — only the base model is quantized.
          </Lead>

          {subhead("The QLoRA Stack")}
          <svg width="100%" viewBox="0 0 600 200" style={{display:"block", marginBottom:16, maxWidth:600}}>
            {/* Frozen base layer */}
            <rect x="30" y="20" width="260" height="60" rx="10" fill="#fff3e8" stroke="#c06000" strokeWidth="1.5"/>
            <text x="160" y="47" textAnchor="middle" fontSize="13" fontWeight="700" fill="#a04000">Frozen Base Model Weights</text>
            <text x="160" y="65" textAnchor="middle" fontSize="12" fill="#a04000">NF4 4-bit quantized — no gradients</text>

            {/* LoRA adapters */}
            <rect x="30" y="100" width="260" height="60" rx="10" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5"/>
            <text x="160" y="127" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2B5BFF">LoRA Adapters (B and A matrices)</text>
            <text x="160" y="145" textAnchor="middle" fontSize="12" fill="#2B5BFF">BF16 — trainable, receive gradients</text>

            {/* Arrow */}
            <line x1="160" y1="80" x2="160" y2="98" stroke="#555" strokeWidth="2" markerEnd="url(#arr2)"/>
            <text x="168" y="94" fontSize="10" fill="#555">add</text>

            {/* Memory callout */}
            <rect x="320" y="20" width="250" height="140" rx="10" fill="#f5f5f5" stroke="#ccc" strokeWidth="1.5"/>
            <text x="445" y="45" textAnchor="middle" fontSize="13" fontWeight="700" fill="#333">Memory Comparison (7B model)</text>
            <text x="445" y="68" textAnchor="middle" fontSize="12" fill="#c03030">Full BF16 fine-tune: ~126 GB</text>
            <text x="445" y="88" textAnchor="middle" fontSize="12" fill="#a04000">LoRA r=16 (BF16): ~18 GB</text>
            <text x="445" y="108" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a8a1a">QLoRA r=16 (NF4): ~6 GB</text>
            <text x="445" y="130" textAnchor="middle" fontSize="11" fill="#555">Fits on RTX 3090 (24 GB VRAM)</text>
            <text x="445" y="148" textAnchor="middle" fontSize="11" fill="#555">13B QLoRA fits on single H100</text>
          </svg>

          {subhead("NF4 — Normal Float 4-bit")}
          {info(<>
            Standard INT4 quantization spaces its 16 quantization levels uniformly. But neural
            network weights follow a roughly <b>normal distribution</b> centered at zero. NF4 spaces
            its 16 levels to have equal probability mass — more levels near zero where weights cluster,
            fewer at the tails. This preserves more precision without extra bits.
          </>)}

          {subhead("Double Quantization")}
          <p style={{fontSize:14, color:"var(--ink)", marginBottom:8}}>
            Quantization itself requires storing quantization constants (one per block of ~64 weights).
            Double quantization quantizes those constants too, saving approximately <b>0.5 bits per parameter</b> extra.
          </p>

          {subhead("Hardware Requirements")}
          {tbl(
            <>
              <thead><tr>{th("Model size")}{th("QLoRA VRAM")}{th("Consumer GPU")}{th("Cloud GPU")}</tr></thead>
              <tbody>
                <tr>{td("7B")}{td("~6 GB")}{td("RTX 3060 12GB / RTX 3090")}{td("A10G (24 GB)")}</tr>
                <tr>{td("13B")}{td("~10 GB")}{td("RTX 3090 (24 GB)")}{td("A10G (24 GB)")}</tr>
                <tr>{td("34B")}{td("~22 GB")}{td("RTX 3090 (tight)")}{td("A100 40GB")}</tr>
                <tr>{td("70B")}{td("~48 GB")}{td("2x RTX 3090 (96 GB)")}{td("A100 80GB")}</tr>
              </tbody>
            </>
          )}

          {warn("QLoRA gradient computation dequantizes weights on the fly — this adds ~20–30% training time overhead vs BF16 LoRA. For time-sensitive training, use LoRA on cloud GPUs with enough VRAM.")}
        </>
      )
    },

    // ─── STAGE 8 · reward_model ───────────────────────────────────────────────
    {
      id: "reward_model",
      group: "RLHF",
      title: "RLHF Part 1 — Training the Reward Model",
      map: "Reward Model",
      why: "You cannot optimize a model for 'helpfulness' directly because helpfulness is not a differentiable function. The reward model converts human preference judgments into a scalar score that can be used as a training signal.",
      render: () => (
        <>
          <Lead>
            The reward model (RM) is a language model fine-tuned to output a single scalar
            representing response quality. It is trained on pairwise human preference data:
            given the same prompt and two different responses, which one is better?
            The RM learns to predict human preferences and then guides policy training.
          </Lead>

          {subhead("Preference Data Collection")}
          {codeBlock(
            "# Pairwise preference example\n" +
            "{\n" +
            '  "prompt": "Explain quantum entanglement to a 10-year-old.",\n' +
            '  "chosen": "Imagine two magic coins. When you flip one and it lands heads,\n' +
            "           the other always lands tails — instantly, no matter how far apart\n" +
            '           they are. That\'s quantum entanglement.",\n' +
            '  "rejected": "Quantum entanglement is a phenomenon in quantum mechanics where\n' +
            '              two particles become correlated in ways that classical physics cannot explain."\n' +
            "}"
          )}

          {subhead("Bradley-Terry Reward Model Loss")}
          {card(<>
            <div style={{fontFamily:"monospace", fontSize:14, fontWeight:700, textAlign:"center", padding:"10px 0", letterSpacing:0.5}}>
              L_RM = -log( sigmoid( r(x, y_w) - r(x, y_l) ) )
            </div>
            <div style={{marginTop:10, fontSize:13, color:"var(--ink)"}}>
              Where:<br/>
              <b>r(x, y)</b> = reward model scalar output for prompt x and response y<br/>
              <b>y_w</b> = winning (chosen, preferred) response<br/>
              <b>y_l</b> = losing (rejected) response<br/>
              <br/>
              The loss pushes r(x, y_w) higher and r(x, y_l) lower until the difference is large.
              The sigmoid ensures the loss is bounded and gradient flows smoothly.
            </div>
          </>)}

          {subhead("Reward Model Architecture")}
          {tbl(
            <>
              <thead><tr>{th("Component")}{th("Details")}</tr></thead>
              <tbody>
                <tr>{td("Backbone")}{td("Same LM architecture as the policy (or a smaller model — e.g., 6B RM for 175B policy)")}</tr>
                <tr>{td("Initialization")}{td("Start from SFT checkpoint (better than random or base model init)")}</tr>
                <tr>{td("Output head")}{td("Replace language model head with a single linear layer: hidden_dim -> 1")}</tr>
                <tr>{td("Output")}{td("Single scalar per response — higher = more preferred")}</tr>
              </tbody>
            </>
          )}

          {subhead("What makes a good reward?")}
          {info(<>
            <b>Helpfulness:</b> Does the response address what the user asked?{"  "}
            <b>Truthfulness:</b> Is the response factually accurate?{"  "}
            <b>Harmlessness:</b> Does the response avoid unsafe, biased, or offensive content?
            These three axes (Anthropic's HHH framework) are the most common labeling criteria.
          </>)}

          {subhead("Data Scale")}
          {tbl(
            <>
              <thead><tr>{th("Organization")}{th("Pairs used")}{th("Notes")}</tr></thead>
              <tbody>
                <tr>{td("InstructGPT (OpenAI)")}{td("~50K initial, scaled to 1M+")}{td("Human labelers rate 4–9 responses per prompt")}</tr>
                <tr>{td("Anthropic Claude")}{td("~10K bootstrap, much larger production")}{td("10B–52B reward models trained")}</tr>
                <tr>{td("Open-source (e.g., Ultrafeedback)")}{td("200K+ AI-judged pairs")}{td("GPT-4 used as judge to label preferences at scale")}</tr>
              </tbody>
            </>
          )}
        </>
      )
    },

    // ─── STAGE 9 · ppo ────────────────────────────────────────────────────────
    {
      id: "ppo",
      group: "RLHF",
      title: "RLHF Part 2 — PPO Optimization",
      map: "PPO",
      why: "With a reward model in hand, you can now train the language model policy to maximize reward — but unconstrained optimization leads to reward hacking. PPO with a KL penalty keeps the policy close to the SFT baseline.",
      render: () => (
        <>
          <Lead>
            PPO (Proximal Policy Optimization) requires <b>four models active simultaneously</b>:
            the policy being trained, a frozen reference policy (the SFT model), the frozen reward model,
            and a value model that estimates expected future reward. The reward signal combines
            the reward model score with a KL divergence penalty.
          </Lead>

          {subhead("The 4-Model RLHF Setup")}
          <svg width="100%" viewBox="0 0 700 220" style={{display:"block", marginBottom:16, maxWidth:700}}>
            <defs>
              <marker id="arr3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#555" />
              </marker>
            </defs>
            {/* Policy (trainable) */}
            <rect x="10" y="20" width="155" height="65" rx="10" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="2"/>
            <text x="87" y="47" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2B5BFF">Policy pi_theta</text>
            <text x="87" y="63" textAnchor="middle" fontSize="11" fill="#2B5BFF">TRAINABLE</text>
            <text x="87" y="77" textAnchor="middle" fontSize="10" fill="#555">generates responses y</text>

            {/* Reference (frozen) */}
            <rect x="10" y="120" width="155" height="65" rx="10" fill="#f0f0f0" stroke="#888" strokeWidth="1.5"/>
            <text x="87" y="147" textAnchor="middle" fontSize="13" fontWeight="700" fill="#555">Reference pi_ref</text>
            <text x="87" y="163" textAnchor="middle" fontSize="11" fill="#777">FROZEN (SFT checkpoint)</text>
            <text x="87" y="177" textAnchor="middle" fontSize="10" fill="#777">computes KL penalty</text>

            {/* Reward Model */}
            <rect x="270" y="20" width="155" height="65" rx="10" fill="#fff3e8" stroke="#c06000" strokeWidth="1.5"/>
            <text x="347" y="47" textAnchor="middle" fontSize="13" fontWeight="700" fill="#a04000">Reward Model r_theta</text>
            <text x="347" y="63" textAnchor="middle" fontSize="11" fill="#c06000">FROZEN</text>
            <text x="347" y="77" textAnchor="middle" fontSize="10" fill="#555">outputs scalar reward</text>

            {/* Value Model */}
            <rect x="270" y="120" width="155" height="65" rx="10" fill="#e8ffe8" stroke="#1a8a1a" strokeWidth="1.5"/>
            <text x="347" y="147" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a6a1a">Value Model V_phi</text>
            <text x="347" y="163" textAnchor="middle" fontSize="11" fill="#1a8a1a">TRAINABLE</text>
            <text x="347" y="177" textAnchor="middle" fontSize="10" fill="#555">estimates future reward</text>

            {/* Combined reward box */}
            <rect x="490" y="60" width="190" height="85" rx="10" fill="#fafafa" stroke="#aaa" strokeWidth="1.5"/>
            <text x="585" y="85" textAnchor="middle" fontSize="12" fontWeight="700" fill="#333">Combined Reward R</text>
            <text x="585" y="105" textAnchor="middle" fontSize="11" fill="#333">R = r(x,y) - beta x KL</text>
            <text x="585" y="123" textAnchor="middle" fontSize="11" fill="#2B5BFF">KL = log(pi_theta / pi_ref)</text>
            <text x="585" y="137" textAnchor="middle" fontSize="10" fill="#555">beta = 0.1 to 0.5</text>

            {/* Arrows */}
            <line x1="165" y1="52" x2="268" y2="52" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr3)"/>
            <text x="210" y="45" textAnchor="middle" fontSize="10" fill="#555">(x, y)</text>
            <line x1="425" y1="52" x2="488" y2="95" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr3)"/>
            <line x1="165" y1="152" x2="488" y2="115" stroke="#888" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#arr3)"/>
            <line x1="425" y1="152" x2="488" y2="120" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr3)"/>
          </svg>

          {subhead("Reward Formula")}
          {card(<>
            <div style={{fontFamily:"monospace", fontSize:14, fontWeight:700, textAlign:"center", padding:"10px 0"}}>
              R(x, y) = r_theta(x, y) - beta x KL( pi_theta(y|x) || pi_ref(y|x) )
            </div>
            <p style={{fontSize:13, color:"var(--ink)", margin:"10px 0 0"}}>
              The KL penalty is the <b>divergence</b> between the current policy and the frozen SFT reference.
              If the policy strays too far (reward hacking), KL grows large and reduces the effective reward.
              Beta controls the tradeoff: higher beta = stay closer to SFT model.
            </p>
          </>)}

          {subhead("Why KL penalty? Reward Hacking")}
          {warn("Without the KL penalty, the policy learns to game the reward model — generating repetitive, syntactically unusual text that scores high on the reward model but is not actually helpful to humans. The reward model is imperfect; unbounded optimization exploits its flaws.")}

          {subhead("PPO Hyperparameters")}
          {tbl(
            <>
              <thead><tr>{th("Parameter")}{th("Value")}{th("Effect")}</tr></thead>
              <tbody>
                <tr>{td("ppo_epochs")}{td("4")}{td("Number of gradient updates per batch of rollouts")}</tr>
                <tr>{td("target_kl")}{td("6.0")}{td("Early stop PPO epoch if KL exceeds this threshold")}</tr>
                <tr>{td("cliprange (epsilon)")}{td("0.2")}{td("Clips policy ratio to [0.8, 1.2] — the 'proximal' constraint")}</tr>
                <tr>{td("vf_coef")}{td("0.1")}{td("Weight of value function loss in total loss")}</tr>
                <tr>{td("Learning rate")}{td("1.41e-5")}{td("Smaller than SFT LR — RL training is noisier")}</tr>
                <tr>{td("KL beta")}{td("0.1 to 0.5")}{td("KL penalty coefficient; higher = more conservative")}</tr>
              </tbody>
            </>
          )}
        </>
      )
    },

    // ─── STAGE 10 · dpo ───────────────────────────────────────────────────────
    {
      id: "dpo",
      group: "RLHF",
      title: "DPO — Direct Preference Optimization",
      map: "DPO",
      why: "DPO eliminates the reward model entirely by showing that the RLHF optimal policy has a closed-form solution expressible directly in terms of the policy. You get the alignment without the complexity of PPO.",
      render: () => (
        <>
          <Lead>
            DPO's key insight (Rafailov et al., 2023): the optimal RLHF policy can be written in
            closed form as a function of the reference policy and reward. This means we can
            <b> reparameterize the reward model implicitly</b> inside the policy objective —
            no explicit reward model needed, no on-policy sampling, no PPO.
          </Lead>

          {subhead("DPO Loss Function")}
          {card(<>
            <div style={{fontFamily:"monospace", fontSize:13, fontWeight:700, padding:"10px 0", lineHeight:1.8}}>
              L_DPO = -E[(x,y_w,y_l)~D] [<br/>
              {"    "}log sigmoid(<br/>
              {"        "}beta x log( pi_theta(y_w|x) / pi_ref(y_w|x) )<br/>
              {"      "}- beta x log( pi_theta(y_l|x) / pi_ref(y_l|x) )<br/>
              {"    "})<br/>
              ]
            </div>
            <p style={{fontSize:13, color:"var(--ink)", margin:"10px 0 0"}}>
              In plain English: increase the log-probability of the preferred response <b>relative to
              the reference model</b>, while decreasing the log-probability of the rejected response
              relative to the reference. Beta controls how far from the reference you allow the policy to go.
            </p>
          </>)}

          {subhead("How DPO training works")}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14}}>
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#1a8a1a", marginBottom:6}}>What you need</div>
              <ul style={{fontSize:13, margin:0, paddingLeft:18}}>
                <li>Preference dataset (same format as reward model training)</li>
                <li>SFT reference model checkpoint (frozen)</li>
                <li>Policy model (trainable copy of SFT checkpoint)</li>
              </ul>
            </>)}
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#2B5BFF", marginBottom:6}}>What you do NOT need</div>
              <ul style={{fontSize:13, margin:0, paddingLeft:18}}>
                <li>Separate reward model training step</li>
                <li>On-policy sampling during training</li>
                <li>Value model</li>
                <li>PPO rollout loop</li>
              </ul>
            </>)}
          </div>

          {subhead("DPO vs PPO Comparison")}
          {tbl(
            <>
              <thead><tr>{th("Dimension")}{th("PPO")}{th("DPO")}</tr></thead>
              <tbody>
                <tr>{td("Models needed")}{td("4 (policy, reference, reward model, value model)")}{td("2 (policy, reference)")}</tr>
                <tr>{td("Training type")}{td("On-policy — must sample from model each step")}{td("Offline — uses fixed preference dataset")}</tr>
                <tr>{td("GPU memory")}{td("~4x single model size")}{td("~2x single model size")}</tr>
                <tr>{td("Training stability")}{td("Challenging — reward hacking, KL spikes common")}{td("Stable — no RL loop, standard supervised training")}</tr>
                <tr>{td("Reward model")}{td("Required and trained separately")}{td("Not needed — implicit in loss")}</tr>
                <tr>{td("Peak performance")}{td("Generally stronger ceiling with enough compute")}{td("Competitive, simpler — often within 5% of PPO")}</tr>
                <tr>{td("Used by")}{td("InstructGPT, Llama 3, many production models")}{td("Zephyr, Llama 3 (later stage), many open models")}</tr>
              </tbody>
            </>
          )}

          {subhead("Llama 3 post-training sequence")}
          {info(<>
            Meta's Llama 3 uses alignment in four sequential stages:
            <b> SFT</b> to establish instruction following,
            then <b>rejection sampling</b> to filter high-quality outputs from the SFT model,
            then <b>PPO</b> for reward-guided optimization,
            then <b>DPO</b> for final preference alignment. Each stage builds on the previous checkpoint.
          </>)}
        </>
      )
    },

    // ─── STAGE 11 · instruction_formats ──────────────────────────────────────
    {
      id: "instruction_formats",
      group: "Fine-Tuning",
      title: "Instruction Tuning — Data Formats Compared",
      map: "Instruction Data",
      why: "The quality and format of instruction data shapes everything about how a model responds. Understanding the major dataset formats — from FLAN to ShareGPT — helps you choose or build the right training data for your task.",
      render: () => (
        <>
          <Lead>
            Instruction tuning transforms base models into assistants by training on
            (instruction, response) pairs. The field has evolved from simple template-based
            formats (FLAN, Alpaca) to rich multi-turn conversation datasets (ShareGPT, ChatML)
            and AI-generated preference data at scale.
          </Lead>

          {subhead("Major Instruction Dataset Formats")}
          {tbl(
            <>
              <thead><tr>{th("Format / Dataset")}{th("Structure")}{th("Scale")}{th("Key insight")}</tr></thead>
              <tbody>
                <tr>{td("FLAN (Google)")}{td("Template-based: task description + input -> output")}{td("1800+ tasks, 473 datasets")}{td("Zero-shot generalization comes from massive task diversity, not data volume")}</tr>
                <tr>{td("Alpaca (Stanford)")}{td("instruction + input + output JSON")}{td("52K GPT-3.5 generated examples")}{td("First to show GPT distillation can produce cheap SFT data")}</tr>
                <tr>{td("ShareGPT")}{td("Multi-turn: conversations scraped from ChatGPT share links")}{td("~90K conversations")}{td("Real user prompts — more diverse than template-generated data")}</tr>
                <tr>{td("ChatML")}{td("im_start/im_end role tokens")}{td("Varies by dataset")}{td("Clean separation of system, user, assistant roles; now widely adopted")}</tr>
                <tr>{td("Llama 3 Chat")}{td("start_header_id / eot_id tokens")}{td("Proprietary + open mix")}{td("Meta's production format; built into llama tokenizer config")}</tr>
              </tbody>
            </>
          )}

          {subhead("FLAN: The Power of Task Diversity")}
          {info(<>
            FLAN's breakthrough was showing that fine-tuning on <b>1800+ distinct task types</b>
            — classification, translation, summarization, QA, reasoning — dramatically improves
            zero-shot performance on held-out tasks. Scale of tasks matters more than scale of examples per task.
          </>)}

          {subhead("Multi-Turn Conversation Example (ChatML)")}
          {codeBlock(
            "<|im_start|>system\n" +
            "You are an expert Python tutor. Be concise and provide runnable examples.<|im_end|>\n" +
            "<|im_start|>user\n" +
            "How do I reverse a list in Python?<|im_end|>\n" +
            "<|im_start|>assistant\n" +
            "Three ways:\n\n" +
            "my_list[::-1]          # slice — returns new list\n" +
            "reversed(my_list)      # iterator — memory efficient\n" +
            "my_list.reverse()      # in-place — modifies original<|im_end|>\n" +
            "<|im_start|>user\n" +
            "Which is fastest for a list of 1 million items?<|im_end|>\n" +
            "<|im_start|>assistant\n" +
            "my_list.reverse() is fastest — O(n) in-place, no copy.\n" +
            "Slice [::-1] also O(n) but allocates a new list (uses 2x memory).<|im_end|>"
          )}

          {subhead("System Prompt Best Practices")}
          {tbl(
            <>
              <thead><tr>{th("Put in SYSTEM")}{th("Put in USER")}{th("Reason")}</tr></thead>
              <tbody>
                <tr>{td("Persona, role, expertise level")}{td("The actual task or question")}{td("System sets persistent context; user is the dynamic request")}</tr>
                <tr>{td("Output format requirements (JSON, bullet points)")}{td("Specific data or content to process")}{td("Format constraints belong in system so they apply to all turns")}</tr>
                <tr>{td("Tone and style (concise, formal)")}{td("Examples if needed")}{td("Style is a constant property of the assistant")}</tr>
                <tr>{td("Safety / refusal guidelines")}{td("Nothing safety-critical")}{td("System prompt is harder to override via prompt injection")}</tr>
              </tbody>
            </>
          )}

          {subhead("Chain-of-Thought SFT")}
          {info(<>
            Including reasoning steps in training labels (CoT SFT) teaches models to think
            before answering. Example: instead of labeling the output as "42", label it as
            "Let me work through this step by step... [reasoning]... therefore the answer is 42."
            Models trained this way generalize better to novel reasoning tasks.
          </>)}
        </>
      )
    },

    // ─── STAGE · evaluation ───────────────────────────────────────────────────
    {
      id: "evaluation",
      group: "Evaluation",
      title: "Evaluating an Instruction-Tuned / Aligned Model",
      map: "Evaluation",
      why: "After SFT and alignment, accuracy benchmarks aren't enough — you're measuring helpfulness, style, and preference, which need human judgment or an LLM judge. Knowing the biases of each method is essential.",
      render: () => (
        <>
          <Lead>
            Post-training quality is measured three ways — <b>automatic benchmarks</b>,
            <b> human evaluation</b>, and <b>LLM-as-judge</b>. Each has a role: benchmarks gate
            regressions cheaply, LLM judges enable rapid iteration, and human eval is the final
            arbiter of real quality.
          </Lead>

          {subhead("Instruction-Following Benchmarks (automatic)")}
          {tbl(
            <>
              <thead><tr>{th("Benchmark")}{th("Measures")}{th("Metric")}</tr></thead>
              <tbody>
                <tr>{td("IFEval")}{td("Verifiable instruction following (e.g. 'answer in 3 bullets')")}{td("Pass rate")}</tr>
                <tr>{td("MT-Bench")}{td("Multi-turn conversation quality")}{td("1–10 LLM-judge score")}</tr>
                <tr>{td("AlpacaEval 2.0")}{td("Win rate vs a reference answer")}{td("LC win %")}</tr>
                <tr>{td("Arena-Hard")}{td("Hard, discriminative prompts")}{td("Win rate")}</tr>
                <tr>{td("MMLU / GSM8K")}{td("Retained knowledge / math after alignment")}{td("Accuracy — check for regression after alignment")}</tr>
              </tbody>
            </>
          )}

          {subhead("Human Evaluation — The Gold Standard")}
          <p style={{fontSize:14, color:"var(--ink)", marginBottom:8}}>
            Two core protocols: <b>pairwise A/B preference</b> (annotators pick which of two
            responses is better) and <b>Likert ratings</b> (rate a single response 1–5 on quality).
          </p>
          {card(<>
            <div style={{fontWeight:700, fontSize:13, marginBottom:8}}>Chatbot Arena (LMSYS)</div>
            <p style={{fontSize:13, margin:0, lineHeight:1.7}}>
              Crowdsourced blind pairwise battles: users chat with two anonymous models and vote
              for the better one. Votes are aggregated into an <b>Elo / Bradley-Terry rating</b>
              that ranks models on a single scale.
            </p>
          </>)}
          <p style={{fontSize:14, color:"var(--ink)", marginBottom:8}}>
            Always report <b>inter-annotator agreement</b> (e.g. Cohen's kappa) to check that
            judgments are reliable and not noise.
          </p>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14}}>
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#1a8a1a", marginBottom:6}}>Pros</div>
              <p style={{fontSize:13, margin:0}}>Captures real, perceived quality that proxies miss.</p>
            </>)}
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#a04000", marginBottom:6}}>Cons</div>
              <p style={{fontSize:13, margin:0}}>Slow, expensive, and subjective — needs many annotators.</p>
            </>)}
          </div>

          {subhead("LLM-as-Judge")}
          <p style={{fontSize:14, color:"var(--ink)", marginBottom:8}}>
            Use a strong model (e.g. GPT-4) to score or compare outputs — a fast, cheap proxy
            for human eval that reaches roughly <b>80%+ agreement</b> with human judgments.
            Common modes: <b>single-answer grading</b>, <b>pairwise comparison</b>, and
            <b> reference-guided</b> grading.
          </p>
          {warn(<>
            LLM judges carry systematic <b>biases</b>: <b>position bias</b> (favors the first
            answer shown), <b>verbosity bias</b> (favors longer answers), <b>self-enhancement
            bias</b> (favors outputs from its own model family), and <b>format bias</b>.
            Mitigations: swap positions and average the two runs, apply length-control
            (as in AlpacaEval LC), use explicit scoring rubrics, and aggregate multiple judges.
          </>)}

          {subhead("Alignment-Specific Signals")}
          {tbl(
            <>
              <thead><tr>{th("Signal")}{th("What it tells you")}</tr></thead>
              <tbody>
                <tr>{td("Reward model score (held-out set)")}{td("How well the policy satisfies the learned preference signal on unseen prompts")}</tr>
                <tr>{td("KL divergence from reference / SFT policy")}{td("Too high = over-optimized / reward-hacked; near-zero = under-trained")}</tr>
              </tbody>
            </>
          )}

          {subhead("Which Method When")}
          {tbl(
            <>
              <thead><tr>{th("Method")}{th("Speed")}{th("Cost")}{th("Best for")}</tr></thead>
              <tbody>
                <tr>{td("Automatic benchmarks")}{td("Fast")}{td("Cheap")}{td("Regression gates in CI")}</tr>
                <tr>{td("LLM-judge")}{td("Medium")}{td("Medium")}{td("Rapid iteration & A/B")}</tr>
                <tr>{td("Human eval")}{td("Slow")}{td("Expensive")}{td("Final sign-off & safety")}</tr>
              </tbody>
            </>
          )}

          {info(<>
            <b>Typical workflow:</b> gate every change on automatic benchmarks, iterate with an
            LLM-judge (MT-Bench / AlpacaEval), and confirm the winner with human eval before
            shipping.
          </>)}
        </>
      )
    },

    // ─── STAGE 12 · strategy ──────────────────────────────────────────────────
    {
      id: "strategy",
      group: "Strategy",
      title: "Choosing Your Fine-Tuning Strategy",
      map: "Decision Guide",
      why: "The right post-training strategy depends on your compute budget, data availability, quality requirements, and deployment constraints. This stage gives you a practical decision framework.",
      render: () => (
        <>
          <Lead>
            With CPT, SFT, LoRA, QLoRA, RLHF, and DPO all available, the question is which
            combination to use. The answer depends on three axes: <b>compute budget</b>,
            <b> data available</b>, and <b>target quality</b>. Start simple, measure, then scale.
          </Lead>

          {subhead("Decision Tree")}
          <svg width="100%" viewBox="0 0 700 260" style={{display:"block", marginBottom:16, maxWidth:700}}>
            <defs>
              <marker id="arr4" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#555" />
              </marker>
            </defs>
            {/* Root */}
            <rect x="260" y="10" width="180" height="40" rx="8" fill="#2B5BFF" stroke="#1a3acc" strokeWidth="1.5"/>
            <text x="350" y="28" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">Need domain adaptation?</text>
            <text x="350" y="43" textAnchor="middle" fontSize="11" fill="#ccd8ff">(new field, language, cutoff)</text>

            {/* Yes -> CPT */}
            <line x1="300" y1="50" x2="180" y2="90" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr4)"/>
            <text x="225" y="78" fontSize="10" fill="#555">Yes</text>
            <rect x="100" y="90" width="150" height="36" rx="7" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5"/>
            <text x="175" y="110" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">CPT first</text>
            <text x="175" y="122" textAnchor="middle" fontSize="10" fill="#2B5BFF">then SFT + LoRA</text>

            {/* No -> SFT question */}
            <line x1="400" y1="50" x2="500" y2="90" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr4)"/>
            <text x="470" y="78" fontSize="10" fill="#555">No</text>
            <rect x="420" y="90" width="180" height="36" rx="7" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5"/>
            <text x="510" y="110" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">Instruction following only?</text>

            {/* Low memory branch */}
            <line x1="175" y1="126" x2="100" y2="165" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr4)"/>
            <text x="100" y="158" fontSize="10" fill="#555">low VRAM</text>
            <rect x="20" y="165" width="130" height="36" rx="7" fill="#fff3e8" stroke="#c06000" strokeWidth="1.5"/>
            <text x="85" y="185" textAnchor="middle" fontSize="12" fontWeight="700" fill="#a04000">QLoRA</text>
            <text x="85" y="197" textAnchor="middle" fontSize="10" fill="#a04000">Consumer GPU</text>

            {/* Med memory branch */}
            <line x1="175" y1="126" x2="175" y2="165" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr4)"/>
            <text x="175" y="158" fontSize="10" fill="#555">cloud GPU</text>
            <rect x="110" y="165" width="130" height="36" rx="7" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5"/>
            <text x="175" y="185" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">LoRA SFT</text>
            <text x="175" y="197" textAnchor="middle" fontSize="10" fill="#2B5BFF">r=32, all attention</text>

            {/* Alignment needed */}
            <line x1="510" y1="126" x2="510" y2="165" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr4)"/>
            <text x="515" y="158" fontSize="10" fill="#555">need alignment</text>
            <rect x="420" y="165" width="180" height="36" rx="7" fill="#e8ffe8" stroke="#1a8a1a" strokeWidth="1.5"/>
            <text x="510" y="185" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a6a1a">SFT -> DPO</text>
            <text x="510" y="197" textAnchor="middle" fontSize="10" fill="#1a6a1a">Add preference data</text>

            {/* RLHF */}
            <line x1="510" y1="201" x2="510" y2="230" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr4)"/>
            <text x="515" y="222" fontSize="10" fill="#555">max quality</text>
            <rect x="420" y="230" width="180" height="24" rx="6" fill="#fff3e8" stroke="#c06000" strokeWidth="1.5"/>
            <text x="510" y="246" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a04000">SFT -> PPO -> DPO</text>
          </svg>

          {subhead("Full Strategy Comparison Table")}
          {tbl(
            <>
              <thead><tr>
                {th("Method")} {th("When to use")} {th("Compute")} {th("Data needed")} {th("Expected gain")}
              </tr></thead>
              <tbody>
                <tr>{td("CPT")}{td("Deep domain shift (medical, legal, new language)")}{td("High — 1B+ token training run")}{td("1–10B raw domain tokens")}{td("Domain perplexity -20 to -40%; better factual recall")}</tr>
                <tr>{td("SFT (full)")}{td("When LoRA quality is insufficient, small model")}{td("Very high — full optimizer states")}{td("1K–100K examples")}{td("Strong instruction following, but risky for large models")}</tr>
                <tr>{td("LoRA")}{td("Most instruction-tuning tasks on cloud GPUs")}{td("Medium — only 1–2% params")}{td("1K–50K examples")}{td("Near full fine-tune quality with 5–10x less compute")}</tr>
                <tr>{td("QLoRA")}{td("Consumer GPU fine-tuning, proof of concept")}{td("Low — fits on 24 GB GPU")}{td("1K–50K examples")}{td("Slightly below LoRA quality; +20–30% slower training")}</tr>
                <tr>{td("RLHF (PPO)")}{td("Production alignment, safety-critical systems")}{td("Very high — 4 models")}{td("50K–1M preference pairs")}{td("Strongest alignment; highest helpfulness and safety scores")}</tr>
                <tr>{td("DPO")}{td("Alignment without RL complexity")}{td("Medium — 2 models")}{td("50K–500K preference pairs")}{td("Competitive with PPO; much simpler to implement")}</tr>
              </tbody>
            </>
          )}

          {subhead("Practical Starting Point")}
          {info(<>
            <b>Rule of thumb:</b> Always start with <b>LoRA SFT</b> using a small high-quality dataset (2K–10K examples).
            Evaluate on MT-Bench and your target task. Only add CPT if domain adaptation is needed,
            and only add DPO/RLHF if instruction-following quality is already good but preference
            alignment needs improvement.
          </>)}

          {subhead("Common Anti-Patterns")}
          {tbl(
            <>
              <thead><tr>{th("Anti-pattern")}{th("What goes wrong")}{th("Fix")}</tr></thead>
              <tbody>
                <tr>{td("Forgetting loss masking")}{td("Model learns to repeat the prompt, not answer it. Training loss looks fine but outputs are wrong.")}{td("Always set system/user token labels to -100 before training")}</tr>
                <tr>{td("Fine-tuning on too little data (<500 examples)")}{td("Model memorizes training prompts, fails on any paraphrase")}{td("Use at least 1K examples; augment with paraphrasing or GPT generation")}</tr>
                <tr>{td("No evaluation set")}{td("You see training loss drop but have no signal on generalization")}{td("Hold out 10% as eval; check MT-Bench on a few key prompts every epoch")}</tr>
                <tr>{td("High LR for SFT (> 5e-5)")}{td("Catastrophic forgetting — model loses pre-trained knowledge")}{td("Use 1e-5 to 3e-5 with cosine schedule and warmup")}</tr>
                <tr>{td("Training format mismatch")}{td("Model trained with ChatML but deployed with Llama 3 template — silent degradation")}{td("Verify tokenizer chat_template matches training format exactly")}</tr>
                <tr>{td("Skipping SFT before DPO")}{td("DPO reference model is too weak; preference signal is noisy relative to base behavior")}{td("Always SFT first, then use the SFT checkpoint as the DPO reference")}</tr>
              </tbody>
            </>
          )}
        </>
      )
    },

  ]; // end STAGES

  window.ML_META = {
    title: "Post-Training",
    subtitle: "CPT, SFT, LoRA, RLHF, and DPO — turning a base model into a useful assistant",
    cur: "Post-Training",
    category: "LLM Training",
    run: () => ({}),
    default: {},
    renderInput: null,
    modeLinks: [
      { label: "Pre-Training",  href: "LLM-PreTraining.html",        active: false },
      { label: "Distributed",   href: "Distributed-Training.html",   active: false },
      { label: "GPU",           href: "GPU-Architecture.html",      active: false },
      { label: "Quantization",  href: "Quantization.html",           active: false },
      { label: "MoE",           href: "Mixture-of-Experts.html",     active: false },
      { label: "Post-Training", href: "Post-Training.html",          active: true  },
      { label: "Distillation",  href: "Knowledge-Distillation.html", active: false },
      { label: "Embeddings",    href: "Embedding-Models.html",       active: false },
      { label: "Reasoning",     href: "Reasoning-Models.html",       active: false },
      { label: "Inference",     href: "Inference-Serving.html",     active: false },
      { label: "Production",    href: "Production-Safety.html",       active: false },
    ]
  };
  window.ML_STAGES = STAGES;
})();
