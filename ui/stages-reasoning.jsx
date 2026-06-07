/* ============================================================
   Reasoning Models — stages-reasoning.jsx (11 stages)
   Educational article — no sliders, no renderInput
   Topics: o1, DeepSeek-R1, GRPO, PRM, test-time compute
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
      <b>Note: </b>{children}
    </div>
  );

  const pill = (label, color) => (
    <span style={{ display:"inline-block", background: color || "rgba(43,91,255,.1)",
      color: color ? "#fff" : "var(--accent)", borderRadius:20,
      padding:"2px 10px", fontSize:11, fontWeight:700, marginRight:6 }}>
      {label}
    </span>
  );

  // ════════════════════════════════════════════
  // STAGES
  // ════════════════════════════════════════════
  const STAGES = [

    // ─── STAGE 1: Overview ────────────────────────────────────────────────────
    {
      id: "overview",
      group: "Overview",
      title: "Standard LLMs vs Reasoning Models — What Changed?",
      map: "Overview",
      why: "Reasoning models don't just complete your prompt — they think first. Understanding the structural difference explains every other concept in this article.",
      render: () => (
        <>
          <Lead>
            A standard LLM reads your prompt and immediately generates an answer token-by-token.
            A <b>reasoning model</b> first produces a long internal monologue inside{" "}
            <code>{"<think>"}...{"</think>"}</code> tags, then generates a final answer informed
            by that entire reasoning trace. This single structural change enables dramatically
            better performance on multi-step problems.
          </Lead>

          {subhead("Side-by-Side: How Each Model Responds")}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:"var(--muted)" }}>
                Standard LLM
              </div>
              <div style={{ fontSize:12, color:"var(--ink)", marginBottom:8 }}>
                <b>Prompt:</b> "What is 17 x 24?"
              </div>
              {codeBlock("Prompt → [Model] → Answer\n\n\"408\"  ← wrong")}
              <div style={{ fontSize:12, color:"#888" }}>
                Generates answer immediately from pattern matching on training data.
                No working memory, no scratchpad.
              </div>
            </>)}
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:"var(--accent)" }}>
                Reasoning Model
              </div>
              <div style={{ fontSize:12, color:"var(--ink)", marginBottom:8 }}>
                <b>Prompt:</b> "What is 17 x 24?"
              </div>
              {codeBlock("<think>\n17 x 24\n= 17 x 20 + 17 x 4\n= 340 + 68\n= 408\n</think>\n\n408  ← correct")}
              <div style={{ fontSize:12, color:"#888" }}>
                Thinks step-by-step inside hidden tags, then answers with full
                reasoning context available.
              </div>
            </>)}
          </div>

          {subhead("The Five Key Differences")}
          {tbl(<>
            <thead>
              <tr>
                {th("Aspect")}
                {th("Standard LLM")}
                {th("Reasoning Model")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td(<b>Generation</b>)}
                {td("Direct answer")}
                {td(<><code>{"<think>"}...{"</think>"}</code> then answer</>)}
              </tr>
              <tr>
                {td(<b>Context at answer time</b>)}
                {td("Just the prompt")}
                {td("Prompt + full thought trace")}
              </tr>
              <tr>
                {td(<b>Training signal</b>)}
                {td("Next-token prediction / RLHF")}
                {td("RL on final answer correctness")}
              </tr>
              <tr>
                {td(<b>Inference cost</b>)}
                {td("~100–1,000 tokens")}
                {td("1,000–100,000 thinking tokens")}
              </tr>
              <tr>
                {td(<b>Strength</b>)}
                {td("Broad knowledge, fast response")}
                {td("Multi-step logic, math, code")}
              </tr>
            </tbody>
          </>)}

          {subhead("When to Use Which")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>
                Use a Standard LLM when...
              </div>
              <ul style={{ margin:0, paddingLeft:18, fontSize:13, lineHeight:1.8 }}>
                <li>Factual recall or summarization</li>
                <li>Translation or paraphrasing</li>
                <li>Creative writing, brainstorming</li>
                <li>Latency-sensitive applications</li>
                <li>High-volume, low-cost queries</li>
              </ul>
            </>)}
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:"var(--accent)" }}>
                Use a Reasoning Model when...
              </div>
              <ul style={{ margin:0, paddingLeft:18, fontSize:13, lineHeight:1.8 }}>
                <li>Competition math or proofs</li>
                <li>Complex multi-step code generation</li>
                <li>Multi-hop logical reasoning</li>
                <li>Debugging hard-to-trace bugs</li>
                <li>Accuracy matters more than speed</li>
              </ul>
            </>)}
          </div>

          {/* SVG: Thinking trace flow */}
          <div style={{ overflowX:"auto", margin:"18px 0" }}>
            <svg viewBox="0 0 820 130" style={{ width:"100%", maxWidth:820, height:"auto", display:"block" }}>
              <defs>
                <marker id="arr-ov" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0,7 3.5,0 7" fill="#2b5bff" />
                </marker>
              </defs>
              {/* Prompt box */}
              <rect x="10" y="40" width="120" height="50" rx="8" fill="#e8eeff" stroke="#2b5bff" strokeWidth="1.5" />
              <text x="70" y="61" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2b5bff">Prompt</text>
              <text x="70" y="78" textAnchor="middle" fontSize="10" fill="#444">"Solve: 3x+7=22"</text>
              {/* arrow */}
              <line x1="131" y1="65" x2="168" y2="65" stroke="#2b5bff" strokeWidth="1.5" markerEnd="url(#arr-ov)" />
              {/* Think box */}
              <rect x="170" y="15" width="360" height="100" rx="8" fill="#fff8e6" stroke="#f5c842" strokeWidth="1.5" strokeDasharray="5 3" />
              <text x="350" y="36" textAnchor="middle" fontSize="11" fontWeight="700" fill="#b8860b">{"<think>"} ... {"</think>"} (hidden)</text>
              <text x="350" y="56" textAnchor="middle" fontSize="10" fill="#555">3x + 7 = 22</text>
              <text x="350" y="72" textAnchor="middle" fontSize="10" fill="#555">3x = 22 - 7 = 15</text>
              <text x="350" y="88" textAnchor="middle" fontSize="10" fill="#555">x = 15 / 3 = 5</text>
              <text x="350" y="104" textAnchor="middle" fontSize="10" fill="#888">[model self-verifies...]</text>
              {/* arrow */}
              <line x1="531" y1="65" x2="568" y2="65" stroke="#2b5bff" strokeWidth="1.5" markerEnd="url(#arr-ov)" />
              {/* Answer box */}
              <rect x="570" y="40" width="120" height="50" rx="8" fill="#e6fff0" stroke="#22c55e" strokeWidth="1.5" />
              <text x="630" y="61" textAnchor="middle" fontSize="11" fontWeight="700" fill="#16a34a">Answer</text>
              <text x="630" y="78" textAnchor="middle" fontSize="10" fill="#444">"x = 5"</text>
              {/* arrow to reward */}
              <line x1="691" y1="65" x2="728" y2="65" stroke="#888" strokeWidth="1.3" markerEnd="url(#arr-ov)" />
              {/* Reward box */}
              <rect x="730" y="40" width="80" height="50" rx="8" fill="#f5f5f5" stroke="#aaa" strokeWidth="1.2" />
              <text x="770" y="61" textAnchor="middle" fontSize="10" fontWeight="700" fill="#555">Reward</text>
              <text x="770" y="78" textAnchor="middle" fontSize="10" fill="#22c55e">+1 correct</text>
            </svg>
            <div style={{ fontSize:11, color:"#888", textAlign:"center" }}>
              Reasoning model flow: prompt enters, hidden thinking trace is produced, final answer is scored by a reward signal
            </div>
          </div>

          <Note>
            The thinking trace is often <b>hidden from users</b> (OpenAI o1) but is fully
            consumed by the model itself when generating the answer. This is different from
            chain-of-thought prompting, which is visible and user-controlled.
          </Note>
        </>
      ),
    },

    // ─── STAGE 2: Chain-of-Thought ────────────────────────────────────────────
    {
      id: "chain_of_thought",
      group: "Concepts",
      title: "Chain-of-Thought — Prompted vs Trained",
      map: "Chain-of-Thought",
      why: "CoT prompting was the precursor to trained reasoning. Understanding the difference between prompting and training CoT explains why reasoning models are so much more capable.",
      render: () => (
        <>
          <Lead>
            Chain-of-thought reasoning started as a prompting trick: append "Let's think step
            by step" to any prompt and many language models suddenly perform much better on
            math and logic. But prompting is fragile. <b>Trained CoT</b> — where the model
            learns to generate reasoning traces as part of its weights — is far more reliable.
          </Lead>

          {subhead("The Original CoT Prompting Trick (2022)")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            {card(<>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--muted)", marginBottom:6 }}>
                Without CoT prompt
              </div>
              {codeBlock("Q: Roger has 5 tennis balls. He buys\n2 more cans of 3 balls each. How many\ntennis balls does he have now?\n\nA: 11")}
              <div style={{ fontSize:12, color:"#888" }}>Correct by luck — model skips reasoning.</div>
            </>)}
            {card(<>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--accent)", marginBottom:6 }}>
                With "Let's think step by step"
              </div>
              {codeBlock("Q: Roger has 5 tennis balls. He buys\n2 more cans of 3 balls each. How many?\n\nLet's think step by step.\n\nRoger starts with 5 balls.\n2 cans x 3 balls = 6 new balls.\n5 + 6 = 11.\n\nA: 11")}
              <div style={{ fontSize:12, color:"#888" }}>Forces model to show working → fewer errors.</div>
            </>)}
          </div>

          {subhead("Why Prompting Alone is Fragile")}
          {info(<>
            <b>Prompt sensitivity:</b> CoT prompting works well for GPT-4 class models but
            barely helps smaller models. The model must already have latent reasoning ability
            for the prompt to unlock it. There is no guarantee of consistent format across
            responses, and users can accidentally break it by rewording the prompt.
          </>)}

          {subhead("Trained CoT: Teaching the Format")}
          <div style={{ fontSize:13, color:"var(--ink)", marginBottom:10 }}>
            Instead of hoping a prompt unlocks reasoning, you can <b>include reasoning
            traces in the training labels</b> themselves. The model sees thousands of
            examples like this during supervised fine-tuning:
          </div>
          {codeBlock("# SFT Training Example (input + label pair)\n\nInput:\nSolve: A train travels 60 mph for 2.5 hours. How far?\n\nLabel:\n<think>\nDistance = speed x time\nDistance = 60 mph x 2.5 hours\nDistance = 150 miles\n</think>\nThe train travels 150 miles.")}

          {subhead("The Key Insight")}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
            {card(<>
              <div style={{ fontSize:22, textAlign:"center", marginBottom:6 }}>1.</div>
              <div style={{ fontSize:12, fontWeight:700, textAlign:"center", marginBottom:4 }}>
                Reasoning as tokens
              </div>
              <div style={{ fontSize:11, color:"#666", textAlign:"center" }}>
                The model learns that reasoning steps are just tokens — it generates them
                the same way it generates any text.
              </div>
            </>)}
            {card(<>
              <div style={{ fontSize:22, textAlign:"center", marginBottom:6 }}>2.</div>
              <div style={{ fontSize:12, fontWeight:700, textAlign:"center", marginBottom:4 }}>
                Context window advantage
              </div>
              <div style={{ fontSize:11, color:"#666", textAlign:"center" }}>
                When the model writes out intermediate steps, those steps sit in the
                context window and inform later tokens — like a scratchpad.
              </div>
            </>)}
            {card(<>
              <div style={{ fontSize:22, textAlign:"center", marginBottom:6 }}>3.</div>
              <div style={{ fontSize:12, fontWeight:700, textAlign:"center", marginBottom:4 }}>
                RL amplifies quality
              </div>
              <div style={{ fontSize:11, color:"#666", textAlign:"center" }}>
                After SFT, reinforcement learning rewards correct answers — pushing the
                model to develop better reasoning strategies autonomously.
              </div>
            </>)}
          </div>

          {subhead("SFT vs RL for Reasoning")}
          {tbl(<>
            <thead>
              <tr>
                {th("Approach")}
                {th("How It Works")}
                {th("Strength")}
                {th("Limitation")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("CoT Prompting")}
                {td("Append magic phrase at inference")}
                {td("Zero cost, works immediately")}
                {td("Fragile, model-dependent")}
              </tr>
              <tr>
                {td("SFT on CoT Data")}
                {td("Train on human reasoning traces")}
                {td("Reliable format, consistent style")}
                {td("Bottlenecked by human annotation quality")}
              </tr>
              <tr>
                {td("RL on Correctness")}
                {td("Reward correct final answers")}
                {td("Discovers novel strategies autonomously")}
                {td("Requires verifiable reward signal")}
              </tr>
            </tbody>
          </>)}

          <Note>
            Wei et al. (2022) showed CoT prompting with just 8 examples could dramatically
            improve performance on math benchmarks. This seeded the entire reasoning model
            research direction.
          </Note>
        </>
      ),
    },

    // ─── STAGE 3: OpenAI o1 ───────────────────────────────────────────────────
    {
      id: "o1_architecture",
      group: "Models",
      title: "OpenAI o1 — The First Major Reasoning Model",
      map: "OpenAI o1",
      why: "o1 proved that scaling inference-time compute via RL-trained chain-of-thought creates a qualitatively different class of model — not just a bigger GPT.",
      render: () => (
        <>
          <Lead>
            OpenAI's o1 (September 2024) is the first publicly-deployed model explicitly
            designed around <b>trained chain-of-thought reasoning</b>. It was trained using
            large-scale reinforcement learning on verifiable tasks — math problems with
            numerical answers and code with executable test suites. The result: a model
            that solves problems humans can verify automatically.
          </Lead>

          {subhead("What OpenAI Disclosed")}
          {info(<>
            OpenAI has not published a technical paper for o1. What is publicly known comes
            from the system card, blog posts, and third-party analysis. The core training
            approach: <b>RL on chain-of-thought reasoning over tasks with automatic
            correctness checks</b>. The model learns to think longer on harder problems.
          </>)}

          {subhead("Private Chain of Thought")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>What the model sees</div>
              {codeBlock("<think>\nLet me factor x^2 - 5x + 6.\nI need two numbers that multiply\nto 6 and add to -5.\nThose are -2 and -3.\nSo: (x-2)(x-3)\nLet me verify: x^2 -3x -2x +6 = x^2-5x+6. Yes.\n</think>")}
              <div style={{ fontSize:11, color:"#888" }}>Full internal reasoning trace — can be thousands of tokens</div>
            </>)}
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>What the user sees</div>
              {codeBlock("The factored form is:\n(x - 2)(x - 3)")}
              <div style={{ fontSize:11, color:"#888" }}>
                OpenAI intentionally hides the full chain of thought. Users see only a
                brief summary or just the answer. This protects the training signal from
                being gamed.
              </div>
            </>)}
          </div>

          {subhead("Verifiable Rewards — The Enabler")}
          <div style={{ fontSize:13, marginBottom:10 }}>
            RL requires a reward signal. For reasoning, the key insight is using tasks
            where correctness can be checked <b>automatically</b> without human judgment:
          </div>
          {tbl(<>
            <thead>
              <tr>
                {th("Task Type")}
                {th("Reward Signal")}
                {th("How Checked")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Math problems")}
                {td("+1 if final answer matches")}
                {td("Numerical comparison (exact or within epsilon)")}
              </tr>
              <tr>
                {td("Code generation")}
                {td("+1 if all tests pass")}
                {td("Execute in sandbox, run test suite")}
              </tr>
              <tr>
                {td("Logic puzzles")}
                {td("+1 if solution is valid")}
                {td("Rule-based constraint checker")}
              </tr>
              <tr>
                {td("Subjective tasks")}
                {td("Human preference (RLHF)")}
                {td("Not used for core reasoning training")}
              </tr>
            </tbody>
          </>)}

          {subhead("Test-Time Compute Scaling")}
          <div style={{ fontSize:13, marginBottom:10 }}>
            The critical finding: for the same model, allowing more thinking tokens
            during inference consistently improves accuracy on hard problems. This
            creates a new dimension — <b>inference compute budget</b> — that doesn't
            exist for standard LLMs.
          </div>
          {/* SVG: Scaling curve */}
          <div style={{ overflowX:"auto", margin:"10px 0 16px" }}>
            <svg viewBox="0 0 500 200" style={{ width:"100%", maxWidth:500, height:"auto", display:"block" }}>
              <defs>
                <marker id="arr-ax" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0,7 3.5,0 7" fill="#555" />
                </marker>
              </defs>
              {/* Axes */}
              <line x1="60" y1="160" x2="460" y2="160" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr-ax)" />
              <line x1="60" y1="160" x2="60" y2="20" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr-ax)" />
              <text x="260" y="185" textAnchor="middle" fontSize="11" fill="#555">Thinking tokens (log scale)</text>
              <text x="18" y="95" textAnchor="middle" fontSize="11" fill="#555" transform="rotate(-90,18,95)">Accuracy (%)</text>
              {/* Axis labels */}
              <text x="100" y="173" textAnchor="middle" fontSize="9" fill="#888">100</text>
              <text x="175" y="173" textAnchor="middle" fontSize="9" fill="#888">1K</text>
              <text x="255" y="173" textAnchor="middle" fontSize="9" fill="#888">10K</text>
              <text x="340" y="173" textAnchor="middle" fontSize="9" fill="#888">50K</text>
              <text x="420" y="173" textAnchor="middle" fontSize="9" fill="#888">100K</text>
              {/* Y axis labels */}
              <text x="55" y="155" textAnchor="end" fontSize="9" fill="#888">40</text>
              <text x="55" y="120" textAnchor="end" fontSize="9" fill="#888">60</text>
              <text x="55" y="85" textAnchor="end" fontSize="9" fill="#888">80</text>
              <text x="55" y="50" textAnchor="end" fontSize="9" fill="#888">95</text>
              {/* Grid lines */}
              <line x1="60" y1="155" x2="455" y2="155" stroke="#eee" strokeWidth="1" />
              <line x1="60" y1="120" x2="455" y2="120" stroke="#eee" strokeWidth="1" />
              <line x1="60" y1="85" x2="455" y2="85" stroke="#eee" strokeWidth="1" />
              <line x1="60" y1="50" x2="455" y2="50" stroke="#eee" strokeWidth="1" />
              {/* Curve: log improvement */}
              <polyline points="100,148 175,130 255,100 340,72 420,52" fill="none" stroke="#2b5bff" strokeWidth="2.5" strokeLinejoin="round" />
              {/* Dots */}
              <circle cx="100" cy="148" r="4" fill="#2b5bff" />
              <circle cx="175" cy="130" r="4" fill="#2b5bff" />
              <circle cx="255" cy="100" r="4" fill="#2b5bff" />
              <circle cx="340" cy="72" r="4" fill="#2b5bff" />
              <circle cx="420" cy="52" r="4" fill="#2b5bff" />
              {/* Label */}
              <text x="390" y="45" fontSize="10" fill="#2b5bff" fontWeight="700">o1 / o3</text>
              {/* Standard LLM flat line */}
              <line x1="100" y1="148" x2="420" y2="148" stroke="#aaa" strokeWidth="1.5" strokeDasharray="5 3" />
              <text x="390" y="143" fontSize="10" fill="#888">Standard LLM</text>
            </svg>
            <div style={{ fontSize:11, color:"#888", textAlign:"center" }}>
              Accuracy vs inference compute: reasoning models improve as more thinking tokens are allowed
            </div>
          </div>

          {subhead("o1 vs o3")}
          {tbl(<>
            <thead>
              <tr>
                {th("Model")}
                {th("Release")}
                {th("Key Improvement")}
                {th("Notable Score")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("o1")}
                {td("Sep 2024")}
                {td("First reasoning model; private CoT")}
                {td("89th percentile AIME 2024")}
              </tr>
              <tr>
                {td("o1-mini")}
                {td("Sep 2024")}
                {td("Smaller, cheaper; math/code focus")}
                {td("70th percentile AIME 2024")}
              </tr>
              <tr>
                {td("o3")}
                {td("Dec 2024")}
                {td("Sophisticated search during inference, ARC-AGI breakthrough")}
                {td("87.5% on ARC-AGI (vs 85% human)")}
              </tr>
            </tbody>
          </>)}

          <Note>
            o3's ARC-AGI score of 87.5% was considered a landmark moment — ARC-AGI
            was specifically designed to resist pattern-matching and require genuine
            abstraction and reasoning.
          </Note>
        </>
      ),
    },

    // ─── STAGE 4: DeepSeek-R1 ─────────────────────────────────────────────────
    {
      id: "deepseek_r1",
      group: "Models",
      title: "DeepSeek-R1 — Open-Source Reasoning",
      map: "DeepSeek-R1",
      why: "DeepSeek-R1 is the first open-weights reasoning model matching o1 performance. Its R1-Zero experiment proved reasoning can emerge from RL alone — no human annotation required.",
      render: () => (
        <>
          <Lead>
            DeepSeek-R1 (January 2025) demonstrated that frontier reasoning capabilities
            are achievable with open weights and a published training recipe. More
            importantly, the <b>R1-Zero experiment</b> showed that sophisticated reasoning
            behaviors — self-verification, error correction, dynamic strategy — can emerge
            purely from reinforcement learning, without any supervised fine-tuning.
          </Lead>

          {subhead("Architecture: Mixture of Experts")}
          <div style={{ fontSize:13, marginBottom:10 }}>
            R1 is built on DeepSeek-V3-Base, a Mixture-of-Experts (MoE) architecture that
            achieves frontier capability while keeping per-token compute tractable:
          </div>

          {/* SVG: MoE architecture */}
          <div style={{ overflowX:"auto", margin:"10px 0 16px" }}>
            <svg viewBox="0 0 680 180" style={{ width:"100%", maxWidth:680, height:"auto", display:"block" }}>
              <defs>
                <marker id="arr-moe" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <polygon points="0 0,6 3,0 6" fill="#2b5bff" />
                </marker>
              </defs>
              {/* Token input */}
              <rect x="10" y="70" width="90" height="40" rx="6" fill="#e8eeff" stroke="#2b5bff" strokeWidth="1.5" />
              <text x="55" y="86" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2b5bff">Token</text>
              <text x="55" y="100" textAnchor="middle" fontSize="9" fill="#444">input vector</text>
              {/* arrow */}
              <line x1="101" y1="90" x2="128" y2="90" stroke="#2b5bff" strokeWidth="1.5" markerEnd="url(#arr-moe)" />
              {/* Router */}
              <rect x="130" y="60" width="80" height="60" rx="6" fill="#fff8e6" stroke="#f5c842" strokeWidth="1.5" />
              <text x="170" y="84" textAnchor="middle" fontSize="10" fontWeight="700" fill="#b8860b">Router</text>
              <text x="170" y="100" textAnchor="middle" fontSize="9" fill="#666">selects top-K</text>
              <text x="170" y="112" textAnchor="middle" fontSize="9" fill="#666">experts</text>
              {/* Arrows to experts */}
              <line x1="210" y1="80" x2="245" y2="50" stroke="#2b5bff" strokeWidth="1.3" markerEnd="url(#arr-moe)" />
              <line x1="210" y1="90" x2="245" y2="90" stroke="#2b5bff" strokeWidth="1.3" markerEnd="url(#arr-moe)" />
              <line x1="210" y1="100" x2="245" y2="130" stroke="#2b5bff" strokeWidth="1.3" markerEnd="url(#arr-moe)" />
              {/* Expert boxes — active */}
              <rect x="247" y="35" width="80" height="30" rx="5" fill="#e6fff0" stroke="#22c55e" strokeWidth="1.5" />
              <text x="287" y="53" textAnchor="middle" fontSize="10" fontWeight="700" fill="#16a34a">Expert 3</text>
              <rect x="247" y="75" width="80" height="30" rx="5" fill="#e6fff0" stroke="#22c55e" strokeWidth="1.5" />
              <text x="287" y="93" textAnchor="middle" fontSize="10" fontWeight="700" fill="#16a34a">Expert 7</text>
              {/* Inactive experts */}
              <rect x="247" y="115" width="80" height="30" rx="5" fill="#f5f5f5" stroke="#ccc" strokeWidth="1" />
              <text x="287" y="133" textAnchor="middle" fontSize="10" fill="#bbb">Expert 12</text>
              {/* Ellipsis for more experts */}
              <text x="287" y="158" textAnchor="middle" fontSize="16" fill="#ccc">...</text>
              {/* arrows from active to combine */}
              <line x1="328" y1="50" x2="365" y2="80" stroke="#22c55e" strokeWidth="1.3" markerEnd="url(#arr-moe)" />
              <line x1="328" y1="90" x2="365" y2="90" stroke="#22c55e" strokeWidth="1.3" markerEnd="url(#arr-moe)" />
              {/* Combine box */}
              <rect x="367" y="65" width="90" height="50" rx="6" fill="#e8eeff" stroke="#2b5bff" strokeWidth="1.5" />
              <text x="412" y="85" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2b5bff">Weighted</text>
              <text x="412" y="99" textAnchor="middle" fontSize="10" fill="#444">Combine</text>
              <text x="412" y="110" textAnchor="middle" fontSize="9" fill="#888">37B of 671B</text>
              {/* arrow */}
              <line x1="458" y1="90" x2="490" y2="90" stroke="#2b5bff" strokeWidth="1.5" markerEnd="url(#arr-moe)" />
              {/* Output */}
              <rect x="492" y="65" width="90" height="50" rx="6" fill="#e6fff0" stroke="#22c55e" strokeWidth="1.5" />
              <text x="537" y="85" textAnchor="middle" fontSize="10" fontWeight="700" fill="#16a34a">Output</text>
              <text x="537" y="99" textAnchor="middle" fontSize="9" fill="#444">next token</text>
              <text x="537" y="110" textAnchor="middle" fontSize="9" fill="#888">distribution</text>
              {/* Stats below */}
              <text x="100" y="175" textAnchor="middle" fontSize="10" fill="#2b5bff" fontWeight="600">671B total params</text>
              <text x="350" y="175" textAnchor="middle" fontSize="10" fill="#22c55e" fontWeight="600">Only 37B active per token (5.5%)</text>
              <text x="550" y="175" textAnchor="middle" fontSize="10" fill="#888">128K context</text>
            </svg>
            <div style={{ fontSize:11, color:"#888", textAlign:"center" }}>
              MoE: the router selects ~2 experts per token; 671B parameters exist but only 37B are activated per forward pass
            </div>
          </div>

          {subhead("The R1-Zero Breakthrough")}
          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:"var(--accent)" }}>
              Key Finding
            </div>
            <div style={{ fontSize:13, color:"var(--ink)", lineHeight:1.7 }}>
              DeepSeek trained <b>R1-Zero</b> — a model that received <i>zero</i> supervised
              fine-tuning. Starting from a base model, they applied GRPO reinforcement
              learning directly with only accuracy and format rewards.
              Result: <b>advanced reasoning behaviors emerged spontaneously</b>.
            </div>
          </>)}

          {subhead("Emergent Behaviors in R1-Zero")}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
            {card(<>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>Self-Reflection</div>
              <div style={{ fontSize:12, color:"#666" }}>
                Model learns to go back and check its own work: "Wait, let me reconsider..."
                without being told to do so.
              </div>
            </>)}
            {card(<>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>Error Correction</div>
              <div style={{ fontSize:12, color:"#666" }}>
                When a calculation path fails, model learns to try a different approach
                rather than continuing down the wrong path.
              </div>
            </>)}
            {card(<>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>Dynamic Strategy</div>
              <div style={{ fontSize:12, color:"#666" }}>
                Model allocates more tokens to hard problems and fewer to easy ones —
                an implicit difficulty-aware compute allocation.
              </div>
            </>)}
          </div>

          {subhead("Performance Benchmarks (2025)")}
          {tbl(<>
            <thead>
              <tr>
                {th("Benchmark")}
                {th("DeepSeek-R1")}
                {th("OpenAI o1")}
                {th("Notes")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("AIME 2024")}
                {td(<span style={{ color:"#16a34a", fontWeight:700 }}>79.8% pass@1</span>)}
                {td("74.4% pass@1")}
                {td("American math olympiad problems")}
              </tr>
              <tr>
                {td("MATH-500")}
                {td(<span style={{ color:"#16a34a", fontWeight:700 }}>97.3%</span>)}
                {td("96.4%")}
                {td("Challenging math problems")}
              </tr>
              <tr>
                {td("Codeforces")}
                {td(<span style={{ color:"#16a34a", fontWeight:700 }}>2029 rating</span>)}
                {td("~2024 rating")}
                {td("Competitive programming — comparable")}
              </tr>
            </tbody>
          </>)}

          <Note>
            DeepSeek-R1 weights are <b>open-source</b> (MIT license), and distilled smaller
            versions (1.5B to 70B) exist. This made frontier reasoning capabilities accessible
            for the first time outside of OpenAI.
          </Note>
        </>
      ),
    },

    // ─── STAGE 5: GRPO ────────────────────────────────────────────────────────
    {
      id: "grpo",
      group: "Algorithm",
      title: "GRPO — Training Without a Critic Model",
      map: "GRPO",
      why: "GRPO is the RL algorithm that powers DeepSeek-R1. It achieves PPO-level performance while eliminating the value/critic model — saving 25% of memory and compute.",
      render: () => (
        <>
          <Lead>
            Proximal Policy Optimization (PPO) is the standard RL algorithm for LLM
            fine-tuning, but it requires <b>four separate models</b> running simultaneously.
            Group Relative Policy Optimization (GRPO) achieves similar results using
            only three — by replacing the learned value function with group statistics
            computed directly from sampled completions.
          </Lead>

          {subhead("PPO vs GRPO: Model Count")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>PPO (4 models)</div>
              {[
                ["Policy model (π_θ)", "The model being trained — generates completions"],
                ["Reference model (π_ref)", "Frozen copy — KL penalty anchor"],
                ["Reward model (RM)", "Scores completions"],
                ["Value/Critic model (V)", "Estimates expected future reward — GRPO eliminates this"],
              ].map(([name, desc]) => (
                <div key={name} style={{ display:"flex", gap:8, marginBottom:6, alignItems:"flex-start" }}>
                  <span style={{ minWidth:6, height:6, borderRadius:"50%", background:"var(--accent)",
                    marginTop:5, flexShrink:0 }} />
                  <div>
                    <span style={{ fontWeight:700, fontSize:12 }}>{name}</span>
                    <span style={{ fontSize:11, color:"#666" }}> — {desc}</span>
                  </div>
                </div>
              ))}
            </>)}
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:"var(--accent)" }}>
                GRPO (3 models — value removed)
              </div>
              {[
                ["Policy model (π_θ)", "The model being trained"],
                ["Reference model (π_ref)", "Frozen copy — KL penalty anchor"],
                ["Reward model (RM)", "Scores completions"],
                ["Value model", "ELIMINATED — group statistics used instead"],
              ].map(([name, desc], i) => (
                <div key={name} style={{ display:"flex", gap:8, marginBottom:6, alignItems:"flex-start",
                  opacity: i === 3 ? 0.4 : 1, textDecoration: i === 3 ? "line-through" : "none" }}>
                  <span style={{ minWidth:6, height:6, borderRadius:"50%",
                    background: i === 3 ? "#ccc" : "#22c55e", marginTop:5, flexShrink:0 }} />
                  <div>
                    <span style={{ fontWeight:700, fontSize:12 }}>{name}</span>
                    <span style={{ fontSize:11, color:"#666" }}> — {desc}</span>
                  </div>
                </div>
              ))}
              <div style={{ background:"rgba(34,197,94,.08)", border:"1px solid rgba(34,197,94,.2)",
                borderRadius:8, padding:"8px 10px", fontSize:12, marginTop:8 }}>
                Saves ~25% memory and compute vs PPO
              </div>
            </>)}
          </div>

          {subhead("GRPO Algorithm — Step by Step")}
          {[
            ["Step 1", "Sample G = 16 completions", "For each prompt q, generate 16 different completions {o₁...o₁₆} from the current policy π_old"],
            ["Step 2", "Score each completion", "Run each through the reward model: get rewards {r₁...r₁₆}"],
            ["Step 3", "Compute group-relative advantages", "Normalize by group mean and std — this replaces the value model"],
            ["Step 4", "PPO-style clipped update", "Update policy parameters with clip to prevent large steps"],
            ["Step 5", "KL penalty", "Add β × KL(policy || reference) to prevent catastrophic forgetting"],
          ].map(([step, title, desc]) => (
            <div key={step} style={{ display:"flex", gap:12, marginBottom:10, alignItems:"flex-start" }}>
              <div style={{ minWidth:56, background:"var(--accent)", color:"#fff", borderRadius:6,
                padding:"3px 8px", fontSize:11, fontWeight:700, textAlign:"center", flexShrink:0 }}>
                {step}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>{title}</div>
                <div style={{ fontSize:12, color:"#666" }}>{desc}</div>
              </div>
            </div>
          ))}

          {subhead("The Group-Relative Advantage Formula")}
          {codeBlock("# For each completion o_i out of G=16 completions:\n# r_i = score from reward model\n\nA_i = (r_i - mean({r_1...r_G})) / std({r_1...r_G})\n\n# Example with G=4:\n# rewards = [0.2, 0.8, 0.5, 0.1]\n# mean = 0.4, std = 0.286\n# advantages = [-0.70, +1.40, +0.35, -1.05]\n#\n# The BEST completion (0.8) gets A = +1.40\n# The WORST completion (0.1) gets A = -1.05\n# No value model needed — the GROUP provides the baseline")}

          {subhead("The Full GRPO Objective")}
          {codeBlock("L_GRPO = E_i [\n  min(\n    (pi_theta(o_i | q) / pi_old(o_i | q)) * A_i,\n    clip(pi_theta / pi_old, 1-epsilon, 1+epsilon) * A_i\n  )\n] - beta * KL(pi_theta || pi_ref)\n\n# Where:\n#   epsilon = 0.2  (PPO-style clip -- limits step size)\n#   beta controls KL penalty strength\n#   KL prevents drift from reference model")}

          {subhead("Why Group Statistics Work")}
          {info(<>
            A value model estimates the <i>expected</i> reward for a given state — an expensive
            learned approximation. GRPO replaces it with something simpler: the <b>actual
            average reward</b> of G sampled completions from that same prompt. When G is
            large enough (16-64), this empirical baseline is reliable and requires no
            additional learned parameters.
          </>)}

          {subhead("The KL Penalty Explained")}
          <div style={{ fontSize:13, marginBottom:10 }}>
            Without the KL term, RL training can make the model "forget" how to handle
            prompts outside the training distribution — this is called <b>reward
            hacking</b> or <b>catastrophic forgetting</b>. The KL penalty keeps the
            trained policy close to the frozen reference model:
          </div>
          {tbl(<>
            <thead>
              <tr>
                {th("Beta (KL weight)")}
                {th("Effect")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Too small (near 0)")}
                {td("Model drifts far, may produce degenerate outputs or reward hack")}
              </tr>
              <tr>
                {td("Typical (~0.01-0.1)")}
                {td("Balanced: improves reasoning while maintaining language quality")}
              </tr>
              <tr>
                {td("Too large")}
                {td("Model barely changes from reference — RL has no effect")}
              </tr>
            </tbody>
          </>)}
        </>
      ),
    },

    // ─── STAGE 6: PRM vs ORM ──────────────────────────────────────────────────
    {
      id: "prm_orm",
      group: "Algorithm",
      title: "Process vs Outcome Reward Models",
      map: "PRM vs ORM",
      why: "How you reward reasoning steps determines what behaviors the model learns. PRMs give richer signal but are expensive to build; ORMs are simpler but assign credit coarsely.",
      render: () => (
        <>
          <Lead>
            RL for reasoning needs a reward signal. The simplest approach (Outcome Reward
            Model / ORM) rewards only the final answer. A Process Reward Model (PRM)
            evaluates <b>each intermediate reasoning step</b>, providing much richer credit
            assignment — at the cost of expensive data collection.
          </Lead>

          {subhead("ORM vs PRM — Core Distinction")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>
                ORM — Outcome Reward Model
              </div>
              {codeBlock("Step 1: 3x + 7 = 22\nStep 2: 3x = 15          (correct)\nStep 3: x = 5            (correct)\n\nReward: +1 (final answer correct)\n        ^ only one signal, at the end")}
              <div style={{ fontSize:12, color:"#888", marginTop:6 }}>
                Problem: a model can stumble to the right answer via wrong reasoning steps
                and still get +1. Sparse signal makes learning inefficient.
              </div>
            </>)}
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:"var(--accent)" }}>
                PRM — Process Reward Model
              </div>
              {codeBlock("Step 1: 3x + 7 = 22   [+] <- correct step\nStep 2: 3x = 15       [+] <- correct step\nStep 3: x = 5         [+] <- correct step\n\n3 signals total, one per step")}
              <div style={{ fontSize:12, color:"#888", marginTop:6 }}>
                Each step gets labeled. Wrong reasoning is caught immediately, even if
                the model guesses the right answer at the end.
              </div>
            </>)}
          </div>

          {/* SVG: Reasoning chain with ORM vs PRM rewards */}
          <div style={{ overflowX:"auto", margin:"10px 0 16px" }}>
            <svg viewBox="0 0 700 200" style={{ width:"100%", maxWidth:700, height:"auto", display:"block" }}>
              <defs>
                <marker id="arr-prm" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <polygon points="0 0,6 3,0 6" fill="#555" />
                </marker>
              </defs>
              {/* Title rows */}
              <text x="10" y="20" fontSize="11" fontWeight="700" fill="#555">ORM</text>
              <text x="10" y="110" fontSize="11" fontWeight="700" fill="#2b5bff">PRM</text>
              {/* ORM row: steps */}
              {["Step 1", "Step 2", "Step 3", "Answer"].map((s, i) => {
                const x = 60 + i * 145;
                const isAnswer = i === 3;
                return (
                  <g key={s}>
                    <rect x={x} y="30" width="100" height="36" rx="6"
                      fill={isAnswer ? "#e6fff0" : "#f5f5f5"}
                      stroke={isAnswer ? "#22c55e" : "#ccc"} strokeWidth="1.3" />
                    <text x={x + 50} y="52" textAnchor="middle" fontSize="11" fill="#444">{s}</text>
                    {i < 3 && (
                      <line x1={x + 101} y1="48" x2={x + 143} y2="48"
                        stroke="#ccc" strokeWidth="1.3" markerEnd="url(#arr-prm)" />
                    )}
                    {isAnswer && (
                      <>
                        <text x={x + 50} y="84" textAnchor="middle" fontSize="12" fontWeight="700" fill="#22c55e">+1</text>
                        <text x={x + 50} y="96" textAnchor="middle" fontSize="9" fill="#888">reward here only</text>
                      </>
                    )}
                  </g>
                );
              })}
              {/* PRM row: steps */}
              {["Step 1", "Step 2", "Step 3", "Answer"].map((s, i) => {
                const x = 60 + i * 145;
                const isAnswer = i === 3;
                return (
                  <g key={"prm-" + s}>
                    <rect x={x} y="118" width="100" height="36" rx="6"
                      fill={isAnswer ? "#e6fff0" : "#e8eeff"}
                      stroke={isAnswer ? "#22c55e" : "#2b5bff"} strokeWidth="1.3" />
                    <text x={x + 50} y="140" textAnchor="middle" fontSize="11" fill="#444">{s}</text>
                    {i < 3 && (
                      <line x1={x + 101} y1="136" x2={x + 143} y2="136"
                        stroke="#2b5bff" strokeWidth="1.3" markerEnd="url(#arr-prm)" />
                    )}
                    <text x={x + 50} y="170" textAnchor="middle" fontSize="12" fontWeight="700"
                      fill={isAnswer ? "#22c55e" : "#2b5bff"}>
                      {isAnswer ? "+1" : "+"}
                    </text>
                    <text x={x + 50} y="182" textAnchor="middle" fontSize="9" fill="#888">
                      {isAnswer ? "answer reward" : "step reward"}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div style={{ fontSize:11, color:"#888", textAlign:"center" }}>
              ORM: one reward at the end. PRM: a reward at every step — much richer training signal.
            </div>
          </div>

          {subhead("Monte Carlo Estimation for PRM Labels")}
          <div style={{ fontSize:13, marginBottom:10 }}>
            Human annotation of every reasoning step is prohibitively expensive. Instead,
            PRM labels are generated automatically via <b>Monte Carlo rollouts</b>:
          </div>
          {codeBlock("# For each intermediate step s_k in a reasoning chain:\n\n# 1. Sample N=16 continuations from step s_k to end\n# 2. Check how many reach the correct final answer\n\nif any_completion_reaches_correct_answer:\n    label(s_k) = \"+\"  # step is on a productive path\nelse:\n    label(s_k) = \"-\"  # all completions from here fail\n\n# This gives step-level labels without human annotation")}

          {subhead("Best-of-N with PRM")}
          {info(<>
            <b>OpenAI (2023) — "Let's Verify Step by Step":</b> When used for best-of-N
            reranking — generate N reasoning chains, then select the one with the highest
            PRM score — PRMs outperform ORMs on MATH benchmark by approximately{" "}
            <b>30%</b>. The PRM is better at identifying which chain used correct
            reasoning, not just which one stumbled to the right answer.
          </>)}

          {subhead("Challenges of PRMs")}
          {tbl(<>
            <thead>
              <tr>
                {th("Challenge")}
                {th("Details")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Expensive MC estimation")}
                {td("Need 16 completions per intermediate step. For a 20-step chain, that is 320 completions per training example.")}
              </tr>
              <tr>
                {td("Noisy labels")}
                {td("MC estimation with N=16 is statistically noisy. Some correct steps get labeled \"-\" by chance.")}
              </tr>
              <tr>
                {td("Step granularity")}
                {td("Defining where one step ends and another begins is ambiguous for free-form reasoning.")}
              </tr>
              <tr>
                {td("Distribution shift")}
                {td("PRM trained on one model's outputs may not generalize to a different policy's reasoning style.")}
              </tr>
            </tbody>
          </>)}

          <Note>
            DeepSeek-R1 uses only ORM-style rewards (accuracy + format) — no PRM.
            This simplicity is a feature: it proves you can train excellent reasoning
            models without the expensive PRM machinery.
          </Note>
        </>
      ),
    },

    // ─── STAGE 7: Training Data ───────────────────────────────────────────────
    {
      id: "training_data",
      group: "Data",
      title: "Reasoning Training Data — <think> Tags and Cold-Start",
      map: "Training Data",
      why: "The format of training data determines whether RL can stabilize and whether the model learns to think at the right granularity. Cold-start SFT is the critical first step.",
      render: () => (
        <>
          <Lead>
            Reasoning models don't learn to think from scratch. They need <b>high-quality
            training examples</b> showing what good reasoning looks like, before RL can
            refine and expand those capabilities. The training data format — specifically
            the <code>{"<think>"}...{"</think>"}</code> structure — is the backbone of
            the entire pipeline.
          </Lead>

          {subhead("The Core Training Data Format")}
          {codeBlock("<|user|>\nWhat is the probability that a fair coin flipped 3 times\nshows at least 2 heads?\n\n<|assistant|>\n<think>\nTotal outcomes: 2^3 = 8\nFavorable outcomes (>=2 heads):\n  HHH: 3 heads -- counts\n  HHT: 2 heads -- counts\n  HTH: 2 heads -- counts\n  THH: 2 heads -- counts\nThat is 4 favorable outcomes.\nProbability = 4/8 = 1/2\n</think>\nThe probability is 1/2 (50%).")}

          {subhead("Cold-Start SFT — Why It's Necessary")}
          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:"var(--accent)" }}>
              Without cold-start: RL on raw base model
            </div>
            {codeBlock("# R1-Zero: RL directly on base model\n# Problem: thinking format is inconsistent\n\n<think>let me think... 3x+7=22 so 3x is 22 minus 7\nwhich makes 15 and x would be... \nActually I should check this differently...\n咋咋 wait that's chinese text appearing randomly\n...formatting breaks down over long chains</think>")}
            <div style={{ fontSize:12, color:"#888", marginTop:6 }}>
              R1-Zero works but produces garbled formatting. It is a proof-of-concept,
              not a production-ready model.
            </div>
          </>)}
          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:"#16a34a" }}>
              With cold-start: 10K SFT examples first
            </div>
            {codeBlock("# R1: Cold-start SFT -> stable format\n# Then RL improves quality and depth\n\n<think>\n[Structured, coherent reasoning in consistent format]\n[Correct language, proper step boundaries]\n[No formatting artifacts]\n</think>\n[Clean, accurate answer]")}
            <div style={{ fontSize:12, color:"#888", marginTop:6 }}>
              10K curated examples teaches the model what thinking should look like
              before RL begins exploring. Much more stable training.
            </div>
          </>)}

          {subhead("Cold-Start Data Sources")}
          {tbl(<>
            <thead>
              <tr>
                {th("Source")}
                {th("Volume")}
                {th("How Generated")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Human-annotated CoT")}
                {td("~2,000 examples")}
                {td("Expert mathematicians write step-by-step solutions")}
              </tr>
              <tr>
                {td("Filtered R1-Zero outputs")}
                {td("~8,000 examples")}
                {td("Run R1-Zero, keep only clean/correct outputs via rejection sampling")}
              </tr>
            </tbody>
          </>)}

          {subhead("Thinking Length — How Long is Too Long?")}
          <div style={{ fontSize:13, marginBottom:10 }}>
            Reasoning traces in DeepSeek-R1 can be extremely long. This is intentional
            and correlates with problem difficulty:
          </div>
          {tbl(<>
            <thead>
              <tr>
                {th("Problem Type")}
                {th("Typical Think Tokens")}
                {th("Example")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Simple arithmetic")}
                {td("50–200")}
                {td("What is 17 x 24?")}
              </tr>
              <tr>
                {td("Algebra / calculus")}
                {td("500–2,000")}
                {td("Solve a differential equation")}
              </tr>
              <tr>
                {td("Competition math (AIME)")}
                {td("2,000–20,000")}
                {td("Number theory problems")}
              </tr>
              <tr>
                {td("Hard coding problems")}
                {td("5,000–100,000")}
                {td("Complex algorithm design with testing")}
              </tr>
            </tbody>
          </>)}

          {subhead("Data Quality Over Quantity")}
          {info(<>
            <b>Key principle:</b> 100 genuinely hard problems with verified, step-by-step
            solutions are more valuable than 10,000 easy problems where the model already
            knows the answer. Easy problems don't stress-test the reasoning chain — the
            model can skip steps and still get the reward.
          </>)}

          {warn(<>
            Training data must be <b>decontaminated</b> against test benchmarks.
            If AIME 2024 problems appear in training data, the 79.8% score is
            meaningless. DeepSeek-R1 used data cutoffs and explicit decontamination
            procedures.
          </>)}
        </>
      ),
    },

    // ─── STAGE 8: 4-Stage Pipeline ────────────────────────────────────────────
    {
      id: "4stage_pipeline",
      group: "Training",
      title: "DeepSeek-R1's 4-Stage Training Pipeline",
      map: "4-Stage Pipeline",
      why: "R1's training pipeline is the most detailed public recipe for building a reasoning model. The alternating SFT-RL-SFT-RL sequence is deliberate and each stage has a specific purpose.",
      render: () => (
        <>
          <Lead>
            DeepSeek-R1 is not trained in a single RL run. It uses a carefully sequenced
            four-stage pipeline: two SFT phases and two RL phases alternate to progressively
            build capability, stabilize format, consolidate gains, and finally add alignment.
          </Lead>

          {/* SVG: 4-Stage Pipeline */}
          <div style={{ overflowX:"auto", margin:"10px 0 18px" }}>
            <svg viewBox="0 0 820 160" style={{ width:"100%", maxWidth:820, height:"auto", display:"block" }}>
              <defs>
                <marker id="arr-pipe" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0,7 3.5,0 7" fill="#555" />
                </marker>
              </defs>
              {/* Stage 1 */}
              <rect x="10" y="30" width="160" height="90" rx="8" fill="#fff8e6" stroke="#f5c842" strokeWidth="2" />
              <text x="90" y="52" textAnchor="middle" fontSize="11" fontWeight="700" fill="#b8860b">Stage 1</text>
              <text x="90" y="68" textAnchor="middle" fontSize="10" fontWeight="600" fill="#444">Cold-Start SFT</text>
              <text x="90" y="84" textAnchor="middle" fontSize="9" fill="#666">10K curated CoT</text>
              <text x="90" y="98" textAnchor="middle" fontSize="9" fill="#666">examples</text>
              <text x="90" y="112" textAnchor="middle" fontSize="9" fill="#888">Establishes format</text>
              {/* Arrow 1→2 */}
              <line x1="171" y1="75" x2="197" y2="75" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr-pipe)" />
              {/* Stage 2 */}
              <rect x="199" y="30" width="160" height="90" rx="8" fill="#e8eeff" stroke="#2b5bff" strokeWidth="2" />
              <text x="279" y="52" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2b5bff">Stage 2</text>
              <text x="279" y="68" textAnchor="middle" fontSize="10" fontWeight="600" fill="#444">RL Stage 1</text>
              <text x="279" y="84" textAnchor="middle" fontSize="9" fill="#666">GRPO on math/</text>
              <text x="279" y="98" textAnchor="middle" fontSize="9" fill="#666">code/logic</text>
              <text x="279" y="112" textAnchor="middle" fontSize="9" fill="#888">~8 weeks training</text>
              {/* Arrow 2→3 */}
              <line x1="360" y1="75" x2="386" y2="75" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr-pipe)" />
              {/* Stage 3 */}
              <rect x="388" y="30" width="160" height="90" rx="8" fill="#fff8e6" stroke="#f5c842" strokeWidth="2" />
              <text x="468" y="52" textAnchor="middle" fontSize="11" fontWeight="700" fill="#b8860b">Stage 3</text>
              <text x="468" y="68" textAnchor="middle" fontSize="10" fontWeight="600" fill="#444">Rejection Sampling</text>
              <text x="468" y="84" textAnchor="middle" fontSize="9" fill="#666">800K synthetic</text>
              <text x="468" y="98" textAnchor="middle" fontSize="9" fill="#666">samples, SFT best</text>
              <text x="468" y="112" textAnchor="middle" fontSize="9" fill="#888">Consolidates gains</text>
              {/* Arrow 3→4 */}
              <line x1="549" y1="75" x2="575" y2="75" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr-pipe)" />
              {/* Stage 4 */}
              <rect x="577" y="30" width="160" height="90" rx="8" fill="#e6fff0" stroke="#22c55e" strokeWidth="2" />
              <text x="657" y="52" textAnchor="middle" fontSize="11" fontWeight="700" fill="#16a34a">Stage 4</text>
              <text x="657" y="68" textAnchor="middle" fontSize="10" fontWeight="600" fill="#444">RL Stage 2</text>
              <text x="657" y="84" textAnchor="middle" fontSize="9" fill="#666">GRPO diverse tasks</text>
              <text x="657" y="98" textAnchor="middle" fontSize="9" fill="#666">+ safety/alignment</text>
              <text x="657" y="112" textAnchor="middle" fontSize="9" fill="#888">Final model</text>
              {/* Labels below */}
              <text x="90" y="145" textAnchor="middle" fontSize="10" fill="#b8860b" fontWeight="600">SFT</text>
              <text x="279" y="145" textAnchor="middle" fontSize="10" fill="#2b5bff" fontWeight="600">RL</text>
              <text x="468" y="145" textAnchor="middle" fontSize="10" fill="#b8860b" fontWeight="600">SFT</text>
              <text x="657" y="145" textAnchor="middle" fontSize="10" fill="#16a34a" fontWeight="600">RL</text>
            </svg>
            <div style={{ fontSize:11, color:"#888", textAlign:"center" }}>
              SFT stabilizes format; RL improves capability; alternating stages prevent regression
            </div>
          </div>

          {subhead("Stage 1 — Cold-Start SFT")}
          {card(<>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>Cold-Start Supervised Fine-Tuning</div>
              {pill("SFT", "#b8860b")}
            </div>
            <div style={{ fontSize:13, color:"var(--ink)", marginBottom:8 }}>
              Fine-tune the base model (DeepSeek-V3-Base) on 10,000 carefully curated
              chain-of-thought examples. This teaches the model:
            </div>
            <ul style={{ margin:0, paddingLeft:18, fontSize:13, lineHeight:1.8 }}>
              <li>The <code>{"<think>"}...{"</think>"}</code> format</li>
              <li>What coherent, step-by-step reasoning looks like</li>
              <li>Consistent language (avoids R1-Zero language mixing issues)</li>
              <li>Appropriate thinking depth for different problem types</li>
            </ul>
          </>)}

          {subhead("Stage 2 — RL Stage 1 (Reasoning Focus)")}
          {card(<>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>GRPO on Math / Code / Logic</div>
              {pill("RL", "#2b5bff")}
            </div>
            <div style={{ fontSize:13, color:"var(--ink)", marginBottom:8 }}>
              Apply GRPO with two reward types:
            </div>
            {tbl(<>
              <thead>
                <tr>
                  {th("Reward Type")}
                  {th("Signal")}
                  {th("How Checked")}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {td(<b>Accuracy reward</b>)}
                  {td("+1 / 0")}
                  {td("Rule-based: math answer matches, code passes tests")}
                </tr>
                <tr>
                  {td(<b>Format reward</b>)}
                  {td("+0.1 / 0")}
                  {td("Regex check: thinking inside <think></think> tags")}
                </tr>
              </tbody>
            </>)}
            <div style={{ fontSize:12, color:"#888" }}>Duration: approximately 8 weeks of distributed RL training</div>
          </>)}

          {subhead("Stage 3 — Rejection Sampling + SFT")}
          {card(<>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>Generate 800K Samples, Filter, Fine-Tune</div>
              {pill("SFT", "#b8860b")}
            </div>
            <ul style={{ margin:0, paddingLeft:18, fontSize:13, lineHeight:1.8 }}>
              <li>Use Stage 2 model to generate 600K reasoning examples (math/code/logic)</li>
              <li>Generate 200K general-purpose examples (QA, writing, instruction following)</li>
              <li>Filter: keep only examples where the model reached the correct answer</li>
              <li>SFT the Stage 2 model on this filtered set — "consolidates" the RL gains into weights</li>
            </ul>
            <div style={{ fontSize:12, color:"#888", marginTop:8 }}>
              Why SFT after RL? RL can leave the model "unstable" — SFT consolidates improvements
              and prepares it for the next RL phase.
            </div>
          </>)}

          {subhead("Stage 4 — RL Stage 2 (Diverse + Alignment)")}
          {card(<>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>GRPO on Reasoning + Helpfulness + Safety</div>
              {pill("RL", "#16a34a")}
            </div>
            <div style={{ fontSize:13, color:"var(--ink)", marginBottom:8 }}>
              Final RL phase with a broader task distribution to ensure the model is
              useful beyond pure math/code reasoning:
            </div>
            <ul style={{ margin:0, paddingLeft:18, fontSize:13, lineHeight:1.8 }}>
              <li>Reasoning tasks: same as Stage 2 (accuracy + format rewards)</li>
              <li>General tasks: helpfulness preference model rewards</li>
              <li>Safety: harmlessness rewards from safety classifier</li>
              <li>Result: the final DeepSeek-R1 model weights</li>
            </ul>
          </>)}

          {subhead("Why This Sequence?")}
          {tbl(<>
            <thead>
              <tr>
                {th("Stage")}
                {th("Purpose")}
                {th("What Would Happen Without It")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Stage 1 (Cold SFT)")}
                {td("Establish format and baseline")}
                {td("RL produces garbled, inconsistent formatting (as seen in R1-Zero)")}
              </tr>
              <tr>
                {td("Stage 2 (RL-1)")}
                {td("Develop reasoning capability")}
                {td("Model stays near the SFT baseline; no capability improvement")}
              </tr>
              <tr>
                {td("Stage 3 (Rejection SFT)")}
                {td("Consolidate and diversify")}
                {td("RL-1 gains are brittle; Stage 4 RL may regress them")}
              </tr>
              <tr>
                {td("Stage 4 (RL-2)")}
                {td("Align and generalize")}
                {td("Model is capable but not helpful or safe outside math/code")}
              </tr>
            </tbody>
          </>)}
        </>
      ),
    },

    // ─── STAGE 9: Test-Time Compute ───────────────────────────────────────────
    {
      id: "test_time_scaling",
      group: "Inference",
      title: "Test-Time Compute Scaling",
      map: "Test-Time Scaling",
      why: "Test-time compute scaling is a fundamentally new way to trade cost for accuracy — independent of model size. This changes deployment economics for hard problems.",
      render: () => (
        <>
          <Lead>
            For standard LLMs, accuracy is fixed once the model is trained. For reasoning
            models, there is a new knob: <b>how much compute to spend at inference time</b>.
            Allowing more thinking tokens, generating more candidate solutions, or running
            tree search — all improve accuracy on the same frozen model weights.
          </Lead>

          {subhead("Four Test-Time Scaling Strategies")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>1. Best-of-N Sampling</div>
              <div style={{ fontSize:12, color:"#666", marginBottom:8 }}>
                Generate N independent reasoning chains, pick the best by reward model
                or majority vote. Accuracy improves as O(log N).
              </div>
              {codeBlock("N=1:   60% accuracy (single shot)\nN=4:   72% accuracy\nN=16:  81% accuracy\nN=64:  88% accuracy\nN=256: 93% accuracy (4x cost of N=64)")}
            </>)}
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>2. Longer Thinking Chains</div>
              <div style={{ fontSize:12, color:"#666", marginBottom:8 }}>
                Allow model more tokens in the {"<think>"} block. The model explores
                more solution paths, backtracks, and self-verifies.
              </div>
              {codeBlock("Token budget: 500    -> 65% accuracy\nToken budget: 2,000  -> 78% accuracy\nToken budget: 10,000 -> 87% accuracy\nToken budget: 50,000 -> 93% accuracy")}
            </>)}
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>3. MCTS with PRM</div>
              <div style={{ fontSize:12, color:"#666", marginBottom:8 }}>
                Monte Carlo Tree Search over reasoning steps. PRM evaluates intermediate
                nodes; high-value branches are explored further.
              </div>
              {codeBlock("Root: problem statement\n|-- Branch A: approach 1\n|   |-- Step A.1 (PRM: 0.9)\n|   |-- Step A.2 (PRM: 0.3) <- prune\n|-- Branch B: approach 2\n    |-- Step B.1 (PRM: 0.7)\n    |-- Step B.2 (PRM: 0.95) <- expand")}
            </>)}
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>4. Beam Search Over Steps</div>
              <div style={{ fontSize:12, color:"#666", marginBottom:8 }}>
                Maintain K partial reasoning chains simultaneously. At each step boundary,
                score all K chains with PRM and keep only the top K.
              </div>
              {codeBlock("K=4 beams, step-by-step:\n\nAfter step 1: [chain1, chain2, chain3, chain4]\nScore + prune: keep top 4\nAfter step 2: expand each, score, keep top 4\n...\nFinal: select best complete chain")}
            </>)}
          </div>

          {subhead("Scaling Curve: Accuracy vs Compute Budget")}
          <div style={{ overflowX:"auto", margin:"10px 0 16px" }}>
            <svg viewBox="0 0 560 210" style={{ width:"100%", maxWidth:560, height:"auto", display:"block" }}>
              <defs>
                <marker id="arr-scale" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0,7 3.5,0 7" fill="#555" />
                </marker>
              </defs>
              <line x1="60" y1="170" x2="530" y2="170" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr-scale)" />
              <line x1="60" y1="170" x2="60" y2="20" stroke="#555" strokeWidth="1.5" markerEnd="url(#arr-scale)" />
              <text x="295" y="195" textAnchor="middle" fontSize="11" fill="#555">Inference compute budget (log scale)</text>
              <text x="18" y="100" textAnchor="middle" fontSize="11" fill="#555" transform="rotate(-90,18,100)">Accuracy (%)</text>
              {/* Y grid + labels */}
              {[[165,"50"],[140,"65"],[115,"75"],[90,"85"],[65,"93"],[40,"98"]].map(([y, label]) => (
                <g key={label}>
                  <line x1="60" y1={y} x2="525" y2={y} stroke="#f0f0f0" strokeWidth="1" />
                  <text x="55" y={y + 4} textAnchor="end" fontSize="9" fill="#888">{label}</text>
                </g>
              ))}
              {/* X labels */}
              {[["1x",110],["4x",190],["16x",280],["64x",370],["256x",455]].map(([label, x]) => (
                <text key={label} x={x} y="183" textAnchor="middle" fontSize="9" fill="#888">{label}</text>
              ))}
              {/* Best-of-N curve */}
              <polyline points="110,163 190,148 280,130 370,114 455,100"
                fill="none" stroke="#2b5bff" strokeWidth="2.5" strokeLinejoin="round" />
              <text x="460" y="96" fontSize="9" fill="#2b5bff" fontWeight="700">Best-of-N</text>
              {/* Longer thinking curve */}
              <polyline points="110,158 190,138 280,118 370,95 455,72"
                fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" />
              <text x="460" y="68" fontSize="9" fill="#22c55e" fontWeight="700">Longer thinking</text>
              {/* MCTS curve */}
              <polyline points="110,155 190,130 280,105 370,80 455,55"
                fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" />
              <text x="460" y="51" fontSize="9" fill="#f59e0b" fontWeight="700">MCTS+PRM</text>
              {/* Standard flat line */}
              <line x1="110" y1="163" x2="455" y2="163" stroke="#ccc" strokeWidth="1.5" strokeDasharray="5 3" />
              <text x="460" y="167" fontSize="9" fill="#aaa">Standard LLM</text>
            </svg>
            <div style={{ fontSize:11, color:"#888", textAlign:"center" }}>
              All three strategies improve accuracy as compute budget increases — MCTS with PRM has highest ceiling
            </div>
          </div>

          {subhead("Practical Deployment Implications")}
          {tbl(<>
            <thead>
              <tr>
                {th("Compute Budget")}
                {th("Latency")}
                {th("Accuracy")}
                {th("Best For")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("1x (N=1, short think)")}
                {td("5–30 seconds")}
                {td("Good")}
                {td("Interactive applications, chatbots")}
              </tr>
              <tr>
                {td("10x (N=4, longer think)")}
                {td("1–3 minutes")}
                {td("Better")}
                {td("Developer tools, code review")}
              </tr>
              <tr>
                {td("100x (N=32, MCTS)")}
                {td("10–30 minutes")}
                {td("Best")}
                {td("Offline batch: theorem proving, research")}
              </tr>
            </tbody>
          </>)}

          {info(<>
            <b>The key insight:</b> test-time compute scaling lets you run one model at
            different "quality levels" depending on how much you're willing to pay. This
            is fundamentally different from training a bigger model — it's the same weights,
            more compute at inference.
          </>)}
        </>
      ),
    },

    // ─── STAGE 10: Evaluating Reasoning Models ────────────────────────────────
    {
      id: "evaluation",
      group: "Evaluation",
      title: "Evaluating Reasoning Models",
      map: "Evaluation",
      why: "Reasoning models are evaluated on verifiable hard problems where the final answer is checkable — math and code. The key metrics (pass@1, cons@k, maj@k) and contamination risk differ from standard LLM eval.",
      render: () => (
        <>
          <Lead>
            Reasoning models live or die on <b>verifiable benchmarks</b> — problems where
            correctness can be checked automatically (a numeric answer, passing unit tests).
            This is exactly what makes RL with verifiable rewards possible, and it is also
            what makes evaluation meaningful: there is a ground-truth signal, not a
            subjective judgment.
          </Lead>

          {subhead("Core Benchmarks")}
          {tbl(<>
            <thead>
              <tr>
                {th("Benchmark")}
                {th("Domain")}
                {th("Note")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("GSM8K")}
                {td("Grade-school math")}
                {td("Mostly saturated by frontier models")}
              </tr>
              <tr>
                {td("MATH-500")}
                {td("Competition math")}
                {td("Harder")}
              </tr>
              <tr>
                {td("AIME 2024 / 2025")}
                {td("Olympiad math")}
                {td("Very hard, current frontier")}
              </tr>
              <tr>
                {td("AMC")}
                {td("Competition math")}
                {td("Below AIME difficulty")}
              </tr>
              <tr>
                {td("GPQA-Diamond")}
                {td("Graduate science")}
                {td("PhD-level questions, Google-proof")}
              </tr>
              <tr>
                {td("Codeforces / LiveCodeBench")}
                {td("Competitive programming")}
                {td("Elo-style rating")}
              </tr>
              <tr>
                {td("SWE-bench")}
                {td("Software engineering")}
                {td("Real GitHub issues")}
              </tr>
            </tbody>
          </>)}

          {subhead("Metrics — pass@1, maj@k, cons@k")}
          <div style={{ fontSize:13, marginBottom:10 }}>
            A single accuracy number hides a lot. Reasoning models are stochastic, so the
            way you sample and aggregate matters as much as the model itself.
          </div>
          {[
            ["pass@1", "Accuracy of a single sample — either greedy decoding or one random sample. The most honest measure of what one call gives you."],
            ["pass@k", "Counts a problem as solved if at least one of k samples is correct. Useful when a downstream verifier can pick the right answer, but it inflates scores if there is no way to select the correct sample."],
            ["maj@k / cons@k (self-consistency)", "Sample k chains, then take the MAJORITY-VOTE final answer. This exploits the fact that correct reasoning paths converge on the same answer while errors scatter — so the modal answer is usually right. Typically much higher than pass@1."],
          ].map(([name, desc]) => (
            <div key={name} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"flex-start" }}>
              <span style={{ minWidth:6, height:6, borderRadius:"50%", background:"var(--accent)",
                marginTop:6, flexShrink:0 }} />
              <div>
                <span style={{ fontWeight:700, fontSize:13 }}>{name}</span>
                <span style={{ fontSize:12, color:"#666" }}> — {desc}</span>
              </div>
            </div>
          ))}

          {codeBlock("# Self-consistency (maj@k): sample many chains, return the modal answer\n\ndef self_consistency(model, prompt, k=64):\n    answers = []\n    for _ in range(k):\n        chain = model.sample(prompt, temperature=0.7)\n        answers.append(extract_final_answer(chain))\n    # majority vote: the most common final answer wins\n    return most_common(answers)\n\n# Correct reasoning converges on one answer;\n# mistakes scatter across many -> the mode is usually right.")}

          {info(<>
            <b>DeepSeek-R1 (approximate numbers):</b> AIME 2024 ~79.8% pass@1,
            MATH-500 ~97.3%, Codeforces rating ~2029. These are approximate and depend
            heavily on sampling settings and inference budget.
          </>)}

          {subhead("Test-Time Compute as an Eval Axis")}
          <div style={{ fontSize:13, marginBottom:10 }}>
            For reasoning models, accuracy is a <b>function of inference budget</b>, not a
            single number. The right way to report results is accuracy vs the number of
            samples or thinking tokens, not one headline figure. More compute — longer
            chains, more samples, best-of-N with a verifier — reliably raises the score.
            A fair comparison between two models therefore <b>fixes the compute budget</b>;
            otherwise you are comparing budgets, not models.
          </div>

          {subhead("Contamination — A Severe Risk for Math")}
          {warn(<>
            Math and code benchmark problems are widely posted online, so they easily leak
            into pretraining corpora &rarr; inflated scores that do not reflect genuine
            reasoning. Mitigations: use <b>freshly-released sets</b> (e.g. a new AIME each
            year), maintain <b>private held-out problems</b>, and report results on dates
            <i> after</i> the model&apos;s data cutoff so the questions could not have been
            memorized.
          </>)}

          {info(<>
            <b>Bottom line:</b> prefer pass@1 on contamination-controlled, recent
            benchmarks; always report the inference budget; and use maj@k to show the
            model&apos;s ceiling under self-consistency.
          </>)}
        </>
      ),
    },

    // ─── STAGE 11: When to Use ────────────────────────────────────────────────
    {
      id: "when_to_use",
      group: "Strategy",
      title: "When to Use Reasoning Models",
      map: "Strategy",
      why: "Reasoning models are expensive and slow. Knowing exactly when they are worth it — and when a standard LLM is the right tool — is critical for production deployment.",
      render: () => (
        <>
          <Lead>
            Reasoning models are not universally better than standard LLMs. They are
            10–100x more expensive per query and take minutes instead of seconds. The
            right choice depends on task type, latency requirements, and cost constraints.
            This stage gives you a decision framework.
          </Lead>

          {subhead("Task-by-Task Recommendation")}
          {tbl(<>
            <thead>
              <tr>
                {th("Task Type")}
                {th("Recommended Model")}
                {th("Why")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td(<><b>Competition math</b> (AIME, Olympiad)</>)}
                {td(<span style={{ color:"var(--accent)", fontWeight:700 }}>Reasoning Model</span>)}
                {td("Multi-step proofs require extended working memory")}
              </tr>
              <tr>
                {td(<><b>Complex code generation</b> (algorithms, debugging)</>)}
                {td(<span style={{ color:"var(--accent)", fontWeight:700 }}>Reasoning Model</span>)}
                {td("Needs to plan, test, and iterate through logic")}
              </tr>
              <tr>
                {td(<><b>Multi-hop reasoning</b> (research synthesis)</>)}
                {td(<span style={{ color:"var(--accent)", fontWeight:700 }}>Reasoning Model</span>)}
                {td("Must chain many inference steps correctly")}
              </tr>
              <tr>
                {td(<><b>Formal proof verification</b></>)}
                {td(<span style={{ color:"var(--accent)", fontWeight:700 }}>Reasoning Model</span>)}
                {td("Correctness at every step is essential")}
              </tr>
              <tr>
                {td(<><b>Factual recall / QA</b></>)}
                {td(<span style={{ color:"#16a34a", fontWeight:700 }}>Standard LLM</span>)}
                {td("Answer is in training data; no reasoning chain needed")}
              </tr>
              <tr>
                {td(<><b>Summarization / translation</b></>)}
                {td(<span style={{ color:"#16a34a", fontWeight:700 }}>Standard LLM</span>)}
                {td("Sequential transformation, not multi-step logical inference")}
              </tr>
              <tr>
                {td(<><b>Creative writing</b></>)}
                {td(<span style={{ color:"#16a34a", fontWeight:700 }}>Standard LLM</span>)}
                {td("No verifiable correct answer; reasoning overhead wasted")}
              </tr>
              <tr>
                {td(<><b>Latency-sensitive chatbot</b></>)}
                {td(<span style={{ color:"#16a34a", fontWeight:700 }}>Standard LLM</span>)}
                {td("Users expect sub-second responses; reasoning takes minutes")}
              </tr>
              <tr>
                {td(<><b>High-volume, low-cost queries</b></>)}
                {td(<span style={{ color:"#16a34a", fontWeight:700 }}>Standard LLM</span>)}
                {td("100x cost multiplier is not justified for simple tasks")}
              </tr>
            </tbody>
          </>)}

          {subhead("The Cost and Latency Reality")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>Cost Comparison</div>
              {tbl(<>
                <thead>
                  <tr>
                    {th("Model Type")}
                    {th("Tokens per Query")}
                    {th("Relative Cost")}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {td("Standard LLM")}
                    {td("100–1,000")}
                    {td("1x")}
                  </tr>
                  <tr>
                    {td("Reasoning (easy)")}
                    {td("1,000–5,000")}
                    {td("5–50x")}
                  </tr>
                  <tr>
                    {td("Reasoning (hard)")}
                    {td("10,000–100,000")}
                    {td("100–1,000x")}
                  </tr>
                </tbody>
              </>)}
            </>)}
            {card(<>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>Latency Comparison</div>
              {tbl(<>
                <thead>
                  <tr>
                    {th("Model Type")}
                    {th("Typical Latency")}
                    {th("User Experience")}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {td("Standard LLM")}
                    {td("1–5 seconds")}
                    {td("Interactive")}
                  </tr>
                  <tr>
                    {td("Reasoning (easy)")}
                    {td("10–60 seconds")}
                    {td("Waiting")}
                  </tr>
                  <tr>
                    {td("Reasoning (hard)")}
                    {td("2–30 minutes")}
                    {td("Batch / async only")}
                  </tr>
                </tbody>
              </>)}
            </>)}
          </div>

          {subhead("The Emerging Hybrid Pattern")}
          {card(<>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:"var(--accent)" }}>
              Router + Specialist Architecture
            </div>
            <div style={{ fontSize:13, color:"var(--ink)", marginBottom:10 }}>
              Production systems increasingly use a <b>fast router model</b> to classify
              query difficulty, then route to the appropriate specialist:
            </div>
            {codeBlock("User query\n    |\n    v\n[Fast Router Model] -- classifies difficulty -->\n    |\n    |-- Simple query --> [Standard LLM] --> fast, cheap answer\n    |\n    |-- Hard query ---> [Reasoning Model] --> slow, accurate answer\n\nRouter overhead: ~50ms, near-zero cost\nRouting accuracy: ~90% (some hard queries misclassified)\nCost savings vs always using reasoning model: ~70-90%")}
            <div style={{ fontSize:12, color:"#888" }}>
              Used in production by several AI companies to balance cost and quality.
            </div>
          </>)}

          {subhead("Decision Checklist")}
          {[
            ["Does the problem require more than 3 logical steps?", "If yes: reasoning model candidate"],
            ["Is there a verifiable correct answer (math, code test)?", "If yes: reasoning model works well"],
            ["Does latency need to be under 10 seconds?", "If yes: use standard LLM"],
            ["Is cost per query a concern at scale?", "If yes: use standard LLM or hybrid routing"],
            ["Will users notice if reasoning is occasionally wrong?", "If yes: reasoning model reduces error rate"],
          ].map(([question, guidance]) => (
            <div key={question} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"flex-start" }}>
              <span style={{ fontSize:16, color:"var(--accent)", flexShrink:0 }}>?</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>{question}</div>
                <div style={{ fontSize:12, color:"#666" }}>{guidance}</div>
              </div>
            </div>
          ))}

          {info(<>
            <b>Bottom line:</b> Reasoning models are best thought of as a different
            <i> category</i> of tool, not a universally better LLM. Use them when
            correctness on hard multi-step problems justifies the 10–100x cost and
            latency premium. For everything else, a fast standard LLM is the right choice.
          </>)}

          <Note>
            As hardware improves and models are distilled into smaller versions, the
            cost/latency gap will shrink. DeepSeek already provides reasoning-capable
            models at 1.5B–70B parameter sizes. Expect reasoning capability to become
            standard across model tiers within 2–3 years.
          </Note>
        </>
      ),
    },

  ]; // end STAGES

  window.ML_META = {
    title: "Reasoning Models",
    subtitle: "How o1, DeepSeek-R1 and GRPO produce chain-of-thought reasoning",
    cur: "Reasoning",
    category: "LLM Training",
    run: () => ({}),
    default: {},
    renderInput: null,
    modeLinks: [
      { label: "Pre-Training",  href: "LLM-PreTraining.html",        active: false },
      { label: "Distributed",   href: "Distributed-Training.html",   active: false },
      { label: "Quantization",  href: "Quantization.html",           active: false },
      { label: "MoE",           href: "Mixture-of-Experts.html",     active: false },
      { label: "Post-Training", href: "Post-Training.html",          active: false },
      { label: "Distillation",  href: "Knowledge-Distillation.html", active: false },
      { label: "Embeddings",    href: "Embedding-Models.html",       active: false },
      { label: "Reasoning",     href: "Reasoning-Models.html",       active: true  },
      { label: "Production",    href: "Production-Safety.html",       active: false },
    ]
  };
  window.ML_STAGES = STAGES;
})();
