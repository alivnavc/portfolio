/* ============================================================
   Knowledge Distillation — stages-distillation.jsx (10 stages)
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
      title: "What is Knowledge Distillation?",
      map: "Teacher → Student",
      why: "Frontier models are huge, slow, and expensive to serve. Distillation lets you transfer most of their capability into a small model that fits on a phone, runs at low latency, and costs a fraction to deploy.",
      render: () => (
        <>
          <Lead>
            Knowledge distillation transfers the knowledge of a large, accurate
            <b> teacher</b> model into a small, cheap <b>student</b> model. Crucially, the
            student does not just learn from the ground-truth labels — it learns to
            <b> imitate the teacher's behavior</b>: its full output distribution, its
            internal representations, or its generated text. The result is a compact model
            that retains most of the teacher's quality while being far faster and cheaper to run.
          </Lead>

          {subhead("Teacher distills knowledge into a student")}
          <svg width="100%" viewBox="0 0 720 220" style={{display:"block", marginBottom:16, maxWidth:720}}>
            <defs>
              <marker id="arrK" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#2B5BFF" />
              </marker>
            </defs>
            {/* Big teacher network */}
            <rect x="10" y="20" width="180" height="180" rx="12" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5"/>
            <text x="100" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2B5BFF">TEACHER</text>
            <text x="100" y="56" textAnchor="middle" fontSize="11" fill="#2B5BFF">large &amp; accurate</text>
            {[60,100,140].map((cy,i)=>(<circle key={"t1"+i} cx="45" cy={cy} r="7" fill="#2B5BFF"/>))}
            {[50,80,110,140,170].map((cy,i)=>(<circle key={"t2"+i} cx="90" cy={cy} r="7" fill="#5a82ff"/>))}
            {[60,100,140].map((cy,i)=>(<circle key={"t3"+i} cx="135" cy={cy} r="7" fill="#5a82ff"/>))}
            <circle cx="170" cy="100" r="7" fill="#2B5BFF"/>

            {/* Soft knowledge arrows */}
            <line x1="195" y1="100" x2="335" y2="100" stroke="#2B5BFF" strokeWidth="2.5" markerEnd="url(#arrK)"/>
            <text x="265" y="88" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">soft knowledge</text>
            <text x="265" y="118" textAnchor="middle" fontSize="10" fill="#777">soft targets / features / text</text>

            {/* Small student network */}
            <rect x="340" y="55" width="110" height="110" rx="12" fill="#e8ffe8" stroke="#1a8a1a" strokeWidth="1.5"/>
            <text x="395" y="48" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a6a1a">STUDENT</text>
            {[85,125].map((cy,i)=>(<circle key={"s1"+i} cx="368" cy={cy} r="6" fill="#1a8a1a"/>))}
            {[80,110,140].map((cy,i)=>(<circle key={"s2"+i} cx="408" cy={cy} r="6" fill="#3aaa3a"/>))}
            <circle cx="438" cy="110" r="6" fill="#1a8a1a"/>

            {/* Deploy */}
            <line x1="455" y1="110" x2="555" y2="110" stroke="#888" strokeWidth="2" markerEnd="url(#arrK)"/>
            <rect x="560" y="80" width="150" height="60" rx="12" fill="#1a8a1a" stroke="#137013" strokeWidth="1.5"/>
            <text x="635" y="105" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">Small, fast model</text>
            <text x="635" y="123" textAnchor="middle" fontSize="11" fill="#cdf0cd">edge / low latency</text>
          </svg>

          {subhead("Three families of model compression")}
          {tbl(
            <>
              <thead><tr>
                {th("Family")} {th("Idea")} {th("Output")}
              </tr></thead>
              <tbody>
                <tr>{td(<b>Distillation</b>)}{td("Train a brand-new smaller model to imitate a larger one")}{td("A different, smaller architecture")}</tr>
                <tr>{td("Quantization")}{td("Store/compute weights at lower precision (FP16 → INT8/INT4)")}{td(<>Same model, fewer bits — see the <i>Quantization</i> article</>)}</tr>
                <tr>{td("Pruning")}{td("Remove redundant weights, neurons, or attention heads")}{td("Same architecture, sparser/narrower")}</tr>
              </tbody>
            </>
          )}

          {info(<>
            <b>Real-world impact:</b> the great majority of small instruction-tuned and chat
            models shipped today are <b>distilled from a frontier teacher</b> — it is the
            default recipe for getting a small model that is actually good.
          </>)}

          <Note>Distillation is often <i>combined</i> with quantization and pruning: distill to a small architecture, prune the redundancy, then quantize for deployment.</Note>
        </>
      ),
    },

    // ─── STAGE 2 · dark_knowledge ─────────────────────────────────────────────
    {
      id: "dark_knowledge",
      group: "Concepts",
      title: "Soft Targets & Dark Knowledge",
      map: "Soft vs hard labels",
      why: "A one-hot label tells the student only the right answer. The teacher's full probability distribution tells it which wrong answers are almost right — a much richer signal per example.",
      render: () => (
        <>
          <Lead>
            This is the key insight from Hinton, Vinyals &amp; Dean (2015). A <b>hard label</b>
            says &quot;this image is a dog (1.0), everything else 0.0&quot;. But the teacher's full
            softmax says "dog 0.90, wolf 0.08, cat 0.02". The <b>relative probabilities of the
            wrong classes</b> encode the teacher's learned similarity structure — a dog looks much
            more like a wolf than like a cat. Hinton called this the <b>dark knowledge</b>, and the
            hard label throws all of it away.
          </Lead>

          {subhead("Hard one-hot label vs. soft teacher distribution")}
          <svg width="100%" viewBox="0 0 720 220" style={{display:"block", marginBottom:16, maxWidth:720}}>
            {/* Hard label chart */}
            <text x="160" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="#888">Hard label (one-hot)</text>
            <line x1="40" y1="180" x2="300" y2="180" stroke="#bbb" strokeWidth="1"/>
            {[
              {x:60,  h:140, l:"dog",  v:"1.0"},
              {x:120, h:0,   l:"wolf", v:"0.0"},
              {x:180, h:0,   l:"cat",  v:"0.0"},
              {x:240, h:0,   l:"car",  v:"0.0"},
            ].map((b,i)=>(
              <g key={"h"+i}>
                <rect x={b.x} y={180-b.h} width="40" height={b.h} fill="#bbb"/>
                <text x={b.x+20} y="196" textAnchor="middle" fontSize="10" fill="#777">{b.l}</text>
                <text x={b.x+20} y={b.h>10?180-b.h-5:175} textAnchor="middle" fontSize="9" fill="#777">{b.v}</text>
              </g>
            ))}

            {/* Soft label chart */}
            <text x="540" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">Soft teacher distribution</text>
            <line x1="420" y1="180" x2="680" y2="180" stroke="#bbb" strokeWidth="1"/>
            {[
              {x:440, h:126, l:"dog",  v:"0.90"},
              {x:500, h:14,  l:"wolf", v:"0.08"},
              {x:560, h:4,   l:"cat",  v:"0.02"},
              {x:620, h:1,   l:"car",  v:"0.00"},
            ].map((b,i)=>(
              <g key={"s"+i}>
                <rect x={b.x} y={180-b.h} width="40" height={b.h} fill="#2B5BFF"/>
                <text x={b.x+20} y="196" textAnchor="middle" fontSize="10" fill="#555">{b.l}</text>
                <text x={b.x+20} y={180-b.h-5} textAnchor="middle" fontSize="9" fill="#2B5BFF">{b.v}</text>
              </g>
            ))}
          </svg>

          {info(<>
            The dark knowledge is in the <b>tiny non-zero probabilities</b>: wolf &gt; cat &gt; car
            tells the student a learned geometry of the label space that a one-hot vector simply
            cannot express.
          </>)}

          {subhead("The same idea for an LLM next-token distribution")}
          {card(<>
            <div style={{fontSize:13, marginBottom:8}}>Prompt: <span style={{fontFamily:"monospace"}}>&quot;The capital of France is&quot;</span></div>
            <div style={{fontSize:12, fontFamily:"monospace", lineHeight:1.7, color:"#333"}}>
              Paris&nbsp;&nbsp;&nbsp;0.85<br/>
              Lyon&nbsp;&nbsp;&nbsp;&nbsp;0.05<br/>
              the&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.04<br/>
              a&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.03<br/>
              located&nbsp;0.02<br/>
              &hellip;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(thousands more small probabilities)
            </div>
          </>)}
          <p style={{fontSize:13, color:"var(--ink)", lineHeight:1.7}}>
            The student learns not only that <i>Paris</i> is correct, but that <i>Lyon</i> (another
            French city) is a far more reasonable mistake than a random token — transferring the
            teacher's calibrated uncertainty over the entire vocabulary.
          </p>
        </>
      ),
    },

    // ─── STAGE 3 · temperature ────────────────────────────────────────────────
    {
      id: "temperature",
      group: "Concepts",
      title: "Temperature & the Distillation Loss",
      map: "Softening logits",
      why: "Raw softmax is often near one-hot, hiding the dark knowledge in tiny logits. Temperature inflates those small probabilities so the student can actually learn from them.",
      render: () => (
        <>
          <Lead>
            To expose the dark knowledge we soften the softmax with a <b>temperature</b> T.
            A higher T flattens the distribution, lifting the small logits into a learnable range.
            The student is trained to match the teacher's softened distribution, with a second
            term keeping it grounded on the true labels.
          </Lead>

          {subhead("Tempered softmax")}
          {card(<>
            <div style={{fontFamily:"monospace", fontSize:14, textAlign:"center", padding:"6px 0"}}>
              p_i = exp(z_i / T) / &Sigma;_j exp(z_j / T)
            </div>
          </>)}
          <p style={{fontSize:13, color:"var(--ink)", lineHeight:1.7}}>
            At <b>T = 1</b> this is the ordinary softmax. As <b>T &rarr; &infin;</b> the
            distribution approaches uniform. Distillation typically uses <b>T between 2 and 10</b>.
          </p>

          {subhead("Same logits at T = 1 (peaky) vs T = 4 (soft)")}
          <svg width="100%" viewBox="0 0 720 210" style={{display:"block", marginBottom:16, maxWidth:720}}>
            <text x="160" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="#888">T = 1 (sharp)</text>
            <line x1="40" y1="170" x2="300" y2="170" stroke="#bbb" strokeWidth="1"/>
            {[
              {x:60,h:130,v:"0.87"},{x:120,h:14,v:"0.09"},{x:180,h:5,v:"0.03"},{x:240,h:2,v:"0.01"},
            ].map((b,i)=>(
              <g key={"t1b"+i}>
                <rect x={b.x} y={170-b.h} width="40" height={b.h} fill="#bbb"/>
                <text x={b.x+20} y={170-b.h-4} textAnchor="middle" fontSize="9" fill="#777">{b.v}</text>
              </g>
            ))}

            <text x="540" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">T = 4 (soft)</text>
            <line x1="420" y1="170" x2="680" y2="170" stroke="#bbb" strokeWidth="1"/>
            {[
              {x:440,h:80,v:"0.46"},{x:500,h:48,v:"0.27"},{x:560,h:30,v:"0.17"},{x:620,h:18,v:"0.10"},
            ].map((b,i)=>(
              <g key={"t4b"+i}>
                <rect x={b.x} y={170-b.h} width="40" height={b.h} fill="#2B5BFF"/>
                <text x={b.x+20} y={170-b.h-4} textAnchor="middle" fontSize="9" fill="#2B5BFF">{b.v}</text>
              </g>
            ))}
            <text x="360" y="200" textAnchor="middle" fontSize="10" fill="#777">Higher T reveals the relative structure of the small logits</text>
          </svg>

          {subhead("The combined distillation loss")}
          {card(<>
            <div style={{fontFamily:"monospace", fontSize:13, textAlign:"center", lineHeight:1.8, padding:"6px 0"}}>
              L = &alpha; &middot; T&sup2; &middot; KL( softmax(z_student / T) || softmax(z_teacher / T) )<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;+ (1 &minus; &alpha;) &middot; CE( z_student, hard_label )
            </div>
          </>)}
          <p style={{fontSize:13, color:"var(--ink)", lineHeight:1.7}}>
            The first term is the <b>soft-target / distillation loss</b> (KL divergence to the
            teacher at temperature T). The second is the ordinary <b>cross-entropy</b> on the true
            label. The mixing weight &alpha; (often 0.5&ndash;0.9) trades off the two.
          </p>

          {subhead("Why the T&sup2; factor?")}
          {info(<>
            Differentiating the softened softmax shows the soft-target gradients scale as
            <b> 1/T&sup2;</b>. Multiplying that term by <b>T&sup2;</b> cancels the shrinkage so the
            soft and hard losses keep comparable gradient magnitudes when you change T.
          </>)}

          {codeBlock(
"# PyTorch-ish distillation loss\n" +
"import torch.nn.functional as F\n\n" +
"def distill_loss(z_student, z_teacher, labels, T=4.0, alpha=0.7):\n" +
"    # soft targets: KL between tempered distributions\n" +
"    p_teacher = F.softmax(z_teacher / T, dim=-1)\n" +
"    logp_stud = F.log_softmax(z_student / T, dim=-1)\n" +
"    kd = F.kl_div(logp_stud, p_teacher, reduction='batchmean') * (T * T)\n\n" +
"    # hard targets: ordinary cross-entropy\n" +
"    ce = F.cross_entropy(z_student, labels)\n\n" +
"    return alpha * kd + (1.0 - alpha) * ce"
          )}
        </>
      ),
    },

    // ─── STAGE 4 · types ──────────────────────────────────────────────────────
    {
      id: "types",
      group: "Methods",
      title: "Three Types: Response, Feature, Relation",
      map: "What to match",
      why: "There is more in a teacher than its final answer. You can also match its internal representations or the relationships it learns — each requires different access and gives a different signal.",
      render: () => (
        <>
          <Lead>
            Knowledge can be extracted from the teacher at three levels. They are complementary
            and are often combined in a single training run.
          </Lead>

          {subhead("Where the matching happens")}
          <svg width="100%" viewBox="0 0 720 250" style={{display:"block", marginBottom:16, maxWidth:720}}>
            {/* Teacher stack */}
            <text x="130" y="20" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">Teacher</text>
            {[40,90,140,190].map((y,i)=>(
              <rect key={"tk"+i} x="70" y={y} width="120" height="36" rx="8" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.2"/>
            ))}
            <text x="130" y="63" textAnchor="middle" fontSize="10" fill="#2B5BFF">logits</text>
            <text x="130" y="113" textAnchor="middle" fontSize="10" fill="#2B5BFF">layer L</text>
            <text x="130" y="163" textAnchor="middle" fontSize="10" fill="#2B5BFF">layer 2</text>
            <text x="130" y="213" textAnchor="middle" fontSize="10" fill="#2B5BFF">layer 1</text>

            {/* Student stack */}
            <text x="590" y="20" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a6a1a">Student</text>
            {[40,115,190].map((y,i)=>(
              <rect key={"sk"+i} x="530" y={y} width="120" height="36" rx="8" fill="#e8ffe8" stroke="#1a8a1a" strokeWidth="1.2"/>
            ))}
            <text x="590" y="63" textAnchor="middle" fontSize="10" fill="#1a6a1a">logits</text>
            <text x="590" y="138" textAnchor="middle" fontSize="10" fill="#1a6a1a">layer m</text>
            <text x="590" y="213" textAnchor="middle" fontSize="10" fill="#1a6a1a">layer 1</text>

            {/* Response match (top) */}
            <line x1="190" y1="58" x2="530" y2="58" stroke="#c06000" strokeWidth="2" strokeDasharray="5 4"/>
            <text x="360" y="50" textAnchor="middle" fontSize="10" fontWeight="700" fill="#a04000">1. response (logit match)</text>

            {/* Feature match (middle) */}
            <line x1="190" y1="108" x2="530" y2="133" stroke="#7a3aff" strokeWidth="2" strokeDasharray="5 4"/>
            <text x="360" y="100" textAnchor="middle" fontSize="10" fontWeight="700" fill="#5a1adf">2. feature (hidden states)</text>
            <text x="360" y="148" textAnchor="middle" fontSize="9" fill="#7a3aff">(projection if dims differ)</text>

            {/* Relation match (between samples) */}
            <line x1="190" y1="208" x2="530" y2="208" stroke="#1a8a8a" strokeWidth="2" strokeDasharray="5 4"/>
            <text x="360" y="200" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0a6a6a">3. relation (between examples)</text>
          </svg>

          {tbl(
            <>
              <thead><tr>
                {th("Type")} {th("What is matched")} {th("Needs teacher internals?")} {th("Examples")}
              </tr></thead>
              <tbody>
                <tr>{td(<b>Response-based</b>)}{td("Output logits / soft-label distribution (KL loss)")}{td("No — only outputs")}{td("Hinton 2015 (the classic)")}</tr>
                <tr>{td(<b>Feature-based</b>)}{td("Intermediate hidden states / attention maps (MSE or cosine; projection if dims differ)")}{td("Yes — activations")}{td("DistilBERT cosine loss, TinyBERT")}</tr>
                <tr>{td(<b>Relation-based</b>)}{td("Relationships between layers or between examples (gram matrices, pairwise similarities)")}{td("Yes — activations")}{td("FSP, RKD")}</tr>
              </tbody>
            </>
          )}

          <Note>Response-based distillation is the most general because it only needs the teacher's outputs — making it the only option when the teacher is behind an API.</Note>
        </>
      ),
    },

    // ─── STAGE 5 · whitebox_blackbox ──────────────────────────────────────────
    {
      id: "whitebox_blackbox",
      group: "Methods",
      title: "White-Box vs Black-Box Distillation",
      map: "Logits vs text",
      why: "How much access you have to the teacher decides your entire recipe. Full weights enable logit matching; an API-only teacher forces you to learn from its generated text instead.",
      render: () => (
        <>
          <Lead>
            The practical dividing line is <b>access</b>. With the teacher's weights and logits you
            can do exact distribution matching. With only its text outputs, you fall back to training
            on the teacher's generations — which turns out to be remarkably effective.
          </Lead>

          {subhead("White-box (logit) distillation")}
          <p style={{fontSize:13, color:"var(--ink)", lineHeight:1.7}}>
            You have the teacher's weights / logits, so you minimize <b>KL over the full vocabulary
            distribution</b> at every position. This is the richest signal — but it <b>requires the
            same tokenizer and vocabulary</b> so that student and teacher distributions are
            comparable token-for-token.
          </p>

          {subhead("Black-box / sequence-level distillation")}
          <p style={{fontSize:13, color:"var(--ink)", lineHeight:1.7}}>
            You only have the teacher's <b>text outputs</b> (e.g. an API). You generate many
            completions from the teacher and then run ordinary <b>SFT</b> on them. This is also
            called <b>synthetic-data distillation</b>: it is just supervised fine-tuning on
            teacher-written data (see the <i>Post-Training</i> article). This is how most modern
            small chat / instruct models are actually built. Formally this is <b>sequence-level KD
            (Kim & Rush, 2016)</b> — training the student on the teacher's generated sequences
            rather than its per-token distribution.
          </p>

          {tbl(
            <>
              <thead><tr>
                {th("")} {th("White-box (logit KD)")} {th("Black-box (sequence KD)")}
              </tr></thead>
              <tbody>
                <tr>{td(<b>Access needed</b>)}{td("Weights / per-token logits")}{td("Text outputs only (API ok)")}</tr>
                <tr>{td(<b>Tokenizer</b>)}{td("Must match teacher's")}{td("Can differ")}</tr>
                <tr>{td(<b>Signal richness</b>)}{td("Full distribution per token")}{td("Sampled sequences only")}</tr>
                <tr>{td(<b>Compute cost</b>)}{td("Teacher forward pass per token")}{td("Teacher generation (dominant cost)")}</tr>
                <tr>{td(<b>Typical quality</b>)}{td("Highest fidelity")}{td("Strong; scales with data volume")}</tr>
              </tbody>
            </>
          )}

          {info(<>
            Sequence-level KD is so common that &quot;distilling from GPT-4&quot; almost always means
            <b> generate data with it, then SFT a smaller model</b> — not literal logit matching.
          </>)}
        </>
      ),
    },

    // ─── STAGE 6 · forward_reverse_kl ─────────────────────────────────────────
    {
      id: "forward_reverse_kl",
      group: "Methods",
      title: "Forward vs Reverse KL",
      map: "Mode-covering vs mode-seeking",
      why: "The direction of the KL divergence changes what the student does when it cannot perfectly match the teacher — and for generation the difference between blurry and crisp output is huge.",
      render: () => (
        <>
          <Lead>
            KL divergence is asymmetric, and which way you write it matters. <b>Forward KL</b>,
            KL(teacher || student), is <b>mode-covering</b>: the student is penalized for putting
            zero mass anywhere the teacher has mass, so it spreads out — risking blurry,
            over-smoothed outputs that average across modes. <b>Reverse KL</b>,
            KL(student || teacher), is <b>mode-seeking</b>: the student concentrates on the
            teacher's high-probability modes and ignores the rest — often better for generation.
          </Lead>

          {subhead("A bimodal teacher: forward vs reverse KL student")}
          <svg width="100%" viewBox="0 0 720 230" style={{display:"block", marginBottom:16, maxWidth:720}}>
            {/* Forward KL */}
            <text x="180" y="20" textAnchor="middle" fontSize="12" fontWeight="700" fill="#c06000">Forward KL (mode-covering)</text>
            <line x1="30" y1="180" x2="330" y2="180" stroke="#bbb" strokeWidth="1"/>
            {/* teacher bimodal (gray) */}
            <path d="M40,180 Q100,40 160,180 Q210,40 270,180 L330,180 L330,180 L40,180 Z"
              fill="none" stroke="#bbb" strokeWidth="2"/>
            {/* student covering both with valley filled (orange) */}
            <path d="M40,180 Q120,120 160,140 Q210,120 290,180 Z"
              fill="rgba(192,96,0,.18)" stroke="#c06000" strokeWidth="2"/>
            <text x="160" y="170" textAnchor="middle" fontSize="9" fill="#a04000">mass in the valley</text>
            <text x="180" y="200" textAnchor="middle" fontSize="9" fill="#777">covers both modes, blurs between</text>

            {/* Reverse KL */}
            <text x="540" y="20" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a6a1a">Reverse KL (mode-seeking)</text>
            <line x1="390" y1="180" x2="690" y2="180" stroke="#bbb" strokeWidth="1"/>
            <path d="M400,180 Q460,40 520,180 Q570,40 630,180 L690,180 L400,180 Z"
              fill="none" stroke="#bbb" strokeWidth="2"/>
            {/* student locks one mode (green) */}
            <path d="M460,180 Q490,55 520,180 Z"
              fill="rgba(26,138,26,.20)" stroke="#1a8a1a" strokeWidth="2"/>
            <text x="540" y="200" textAnchor="middle" fontSize="9" fill="#777">locks onto a single mode, sharp</text>
          </svg>

          {info(<>
            <b>MiniLLM</b> and <b>on-policy distillation</b> use <b>reverse KL with
            student-sampled sequences</b>: the student generates, the teacher scores, and the
            student is pulled toward the teacher's modes — which reduces the blurry, low-quality
            text that pure forward-KL distillation can produce.
          </>)}

          <Note>Forward KL is the default for classic logit distillation (it matches the cross-entropy form). Reverse / on-policy variants matter most for free-form generation.</Note>
        </>
      ),
    },

    // ─── STAGE 7 · reasoning_distillation ─────────────────────────────────────
    {
      id: "reasoning_distillation",
      group: "Applications",
      title: "Distilling Reasoning (DeepSeek-R1)",
      map: "Teaching chain-of-thought",
      why: "A landmark 2025 result showed that complex reasoning — long chain-of-thought — can be transferred into small models via plain SFT on traces, and that this beats running expensive RL on the small model directly.",
      render: () => (
        <>
          <Lead>
            In early 2025 DeepSeek demonstrated that <b>reasoning is distillable</b>. They generated
            roughly <b>800K reasoning traces</b> (long chain-of-thought solutions) from their large
            <b> R1</b> model, then fine-tuned small <b>dense</b> models on those traces — the
            <b> R1-Distill</b> series (Qwen-1.5B / 7B / 14B / 32B and Llama-8B / 70B).
          </Lead>

          {subhead("The distillation pipeline they used")}
          <svg width="100%" viewBox="0 0 720 120" style={{display:"block", marginBottom:16, maxWidth:720}}>
            <defs>
              <marker id="arrR" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#888" />
              </marker>
            </defs>
            <rect x="10" y="40" width="150" height="50" rx="10" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.4"/>
            <text x="85" y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">DeepSeek-R1</text>
            <text x="85" y="78" textAnchor="middle" fontSize="10" fill="#2B5BFF">large teacher</text>

            <rect x="200" y="40" width="160" height="50" rx="10" fill="#fff3e8" stroke="#c06000" strokeWidth="1.4"/>
            <text x="280" y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a04000">~800K CoT traces</text>
            <text x="280" y="78" textAnchor="middle" fontSize="10" fill="#a04000">generated solutions</text>

            <rect x="400" y="40" width="150" height="50" rx="10" fill="#e8ffe8" stroke="#1a8a1a" strokeWidth="1.4"/>
            <text x="475" y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a6a1a">SFT small models</text>
            <text x="475" y="78" textAnchor="middle" fontSize="10" fill="#1a6a1a">Qwen / Llama dense</text>

            <rect x="590" y="40" width="120" height="50" rx="10" fill="#1a8a1a" stroke="#137013" strokeWidth="1.4"/>
            <text x="650" y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">R1-Distill</text>
            <text x="650" y="78" textAnchor="middle" fontSize="10" fill="#cdf0cd">strong reasoners</text>

            <line x1="160" y1="65" x2="198" y2="65" stroke="#888" strokeWidth="2" markerEnd="url(#arrR)"/>
            <line x1="360" y1="65" x2="398" y2="65" stroke="#888" strokeWidth="2" markerEnd="url(#arrR)"/>
            <line x1="550" y1="65" x2="588" y2="65" stroke="#888" strokeWidth="2" markerEnd="url(#arrR)"/>
          </svg>

          {subhead("The key finding")}
          {info(<>
            Distilling R1's reasoning into a small model <b>beat running large-scale RL (GRPO)
            directly on that small model</b>. In other words, it is more effective to <b>teach</b> a
            small model to reason by imitating a strong teacher's traces than to make it discover
            reasoning on its own via RL. <b>Reasoning is teachable via SFT on traces.</b>
          </>)}

          <p style={{fontSize:13, color:"var(--ink)", lineHeight:1.7}}>
            Quantitatively, <b>R1-Distill-Qwen-7B</b> reaches strong AIME and MATH scores far above
            its base model (approaching much larger models on competition math), and the 32B/70B
            distilled variants are competitive with frontier reasoners on several benchmarks. See
            the <i>Reasoning Models</i> article for how R1's reasoning ability was created in the
            first place.
          </p>

          <Note>Implication: small open models can <b>inherit frontier reasoning cheaply</b> — you only pay for the teacher's trace generation plus a modest SFT run.</Note>
        </>
      ),
    },

    // ─── STAGE 8 · examples ───────────────────────────────────────────────────
    {
      id: "examples",
      group: "Applications",
      title: "Famous Distilled Models",
      map: "The hall of fame",
      why: "Distillation is not theoretical — many of the most widely deployed small models are explicitly distilled. Seeing the recipes side by side shows how the techniques map to real systems.",
      render: () => (
        <>
          <Lead>
            From the BERT era to today's frontier-distilled chat models, distillation has produced a
            long line of compact, high-quality models. Here are the landmarks.
          </Lead>

          {tbl(
            <>
              <thead><tr>
                {th("Model")} {th("Teacher")} {th("Technique")} {th("Result")}
              </tr></thead>
              <tbody>
                <tr>{td(<b>DistilBERT</b>)}{td("BERT-base")}{td("Triple loss: MLM + distillation KL + cosine embedding")}{td("~40% smaller, ~60% faster, ~97% of BERT's GLUE")}</tr>
                <tr>{td(<b>TinyBERT</b>)}{td("BERT")}{td("Feature + attention distillation (embeddings, hidden states, attention maps)")}{td("Much smaller; strong GLUE retention")}</tr>
                <tr>{td(<b>MobileBERT</b>)}{td("BERT-large (IB-BERT)")}{td("Feature + attention transfer into a thin bottleneck architecture")}{td("Mobile-friendly, near BERT-base quality")}</tr>
                <tr>{td(<b>Gemma 2</b>)}{td("Larger Gemini / Gemma")}{td("Logit distillation during pretraining")}{td("Small open models punching above their size")}</tr>
                <tr>{td(<b>Llama 3.2 1B / 3B</b>)}{td("Llama 3.1 8B / 70B")}{td("Structured pruning + distillation")}{td("Compact on-device models")}</tr>
                <tr>{td(<b>Alpaca / Vicuna</b>)}{td("GPT-3.5 / GPT-4")}{td("Black-box: SFT on teacher-generated instructions / conversations")}{td("Cheap, capable chat models from API data")}</tr>
              </tbody>
            </>
          )}

          {info(<>
            Notice the split: the BERT-era models use <b>feature/attention (white-box)</b>
            distillation, while the chat models (Alpaca, Vicuna) use <b>black-box, sequence-level</b>
            distillation on API outputs — exactly the two regimes from the previous stages.
          </>)}
        </>
      ),
    },

    // ─── STAGE 9 · pipeline ───────────────────────────────────────────────────
    {
      id: "pipeline",
      group: "Workflow",
      title: "A Practical Distillation Pipeline",
      map: "End to end",
      why: "Knowing the theory is not enough to ship a distilled model. This is the concrete, repeatable sequence teams use for sequence-level KD in practice.",
      render: () => (
        <>
          <Lead>
            Here is a practical pipeline for <b>sequence-level KD</b>, the most common production
            recipe. The expensive part is almost always step 3.
          </Lead>

          {subhead("The pipeline")}
          <svg width="100%" viewBox="0 0 720 110" style={{display:"block", marginBottom:16, maxWidth:720}}>
            <defs>
              <marker id="arrP" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#888" />
              </marker>
            </defs>
            {[
              {x:5,  c:"#e8f0ff", s:"#2B5BFF", t1:"1 Pick", t2:"teacher + student"},
              {x:147,c:"#eef",    s:"#7a3aff", t1:"2 Prompts", t2:"collect / generate"},
              {x:289,c:"#fff3e8", s:"#c06000", t1:"3 Generate", t2:"teacher outputs"},
              {x:431,c:"#fff8e6", s:"#caa000", t1:"4 Filter", t2:"clean / dedupe"},
              {x:573,c:"#e8ffe8", s:"#1a8a1a", t1:"5 Train", t2:"distill / SFT"},
            ].map((b,i)=>(
              <g key={"pp"+i}>
                <rect x={b.x} y="35" width="130" height="48" rx="9" fill={b.c} stroke={b.s} strokeWidth="1.3"/>
                <text x={b.x+65} y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill={b.s}>{b.t1}</text>
                <text x={b.x+65} y="72" textAnchor="middle" fontSize="9.5" fill={b.s}>{b.t2}</text>
                {i<4 && <line x1={b.x+130} y1="59" x2={b.x+146} y2="59" stroke="#888" strokeWidth="2" markerEnd="url(#arrP)"/>}
              </g>
            ))}
          </svg>

          {subhead("Step by step")}
          <ol style={{fontSize:13, color:"var(--ink)", lineHeight:1.8, paddingLeft:20}}>
            <li><b>Pick teacher + student base</b> — a strong teacher and a small base to fine-tune.</li>
            <li><b>Collect / generate prompts</b> — real user prompts, task datasets, or synthetic prompt sets covering the target distribution.</li>
            <li><b>Teacher generates outputs</b> — sample completions (optionally capture logits if doing white-box KD with the same tokenizer).</li>
            <li><b>Filter / clean</b> — reject low-quality or unsafe generations, dedupe near-identical samples, balance the mix.</li>
            <li><b>Train the student</b> — distillation loss (logit KD) if white-box, or plain SFT (sequence KD) on the filtered text.</li>
            <li><b>Evaluate retention</b> — measure how much of the teacher's quality survived (next stage).</li>
          </ol>

          {codeBlock(
"# Sketch: sequence-level KD\n" +
"prompts = load_prompts()                       # step 2\n" +
"data = []\n" +
"for p in prompts:                              # step 3\n" +
"    out = teacher.generate(p, temperature=0.7)\n" +
"    data.append({'prompt': p, 'response': out})\n\n" +
"data = filter_and_dedupe(data)                 # step 4\n\n" +
"student = load_base_model()                    # step 5\n" +
"sft_train(student, data)                       # plain SFT on teacher text\n\n" +
"report = evaluate_retention(student, teacher)  # step 6"
          )}

          {info(<>
            <b>Compute is dominated by step 3</b> — running the large teacher to generate data.
            Logit KD adds a teacher forward pass per training token on top, which is why black-box
            sequence KD is often preferred at scale.
          </>)}
        </>
      ),
    },

    // ─── STAGE 10 · evaluation_tradeoffs ──────────────────────────────────────
    {
      id: "evaluation_tradeoffs",
      group: "Evaluation",
      title: "Evaluating Distillation & Tradeoffs",
      map: "Did it work?",
      why: "A distilled model is only useful if you can show it kept the teacher's quality while gaining efficiency. And distillation has real limits you must design around.",
      render: () => (
        <>
          <Lead>
            Success in distillation is measured along two axes: <b>how much capability you kept</b>
            and <b>how much efficiency you gained</b>. Then you weigh the inherent tradeoffs.
          </Lead>

          {subhead("How to measure success")}
          <ol style={{fontSize:13, color:"var(--ink)", lineHeight:1.8, paddingLeft:20}}>
            <li><b>Retention %</b> = student benchmark score / teacher benchmark score, per task (e.g. DistilBERT keeps ~97% of BERT's GLUE).</li>
            <li><b>Agreement rate</b> — top-1 prediction match with the teacher on a held-out set.</li>
            <li><b>KL divergence to teacher</b> — average distributional distance on held-out inputs (lower is closer).</li>
            <li><b>Efficiency gains</b> — parameters, latency, throughput, and memory versus the teacher.</li>
          </ol>

          {subhead("Pros and cons")}
          {tbl(
            <>
              <thead><tr>{th("Pros")} {th("Cons")}</tr></thead>
              <tbody>
                <tr>{td("Small, fast, cheap to serve")}{td("Quality ceiling is the teacher — can't exceed it in general")}</tr>
                <tr>{td("Retains most of the teacher's capability")}{td("Inherits the teacher's biases and errors")}</tr>
                <tr>{td("Far cheaper than training a strong model from scratch")}{td("White-box KD needs teacher access + matching tokenizer")}</tr>
                <tr>{td("Reasoning and instruction-following are transferable via SFT")}{td("Sequence-level KD needs large teacher-generation compute")}</tr>
                <tr>{td("Composable with quantization and pruning")}{td("May lose rare / long-tail capabilities the teacher had")}</tr>
              </tbody>
            </>
          )}

          {warn(<>
            The student cannot reliably <i>surpass</i> its teacher. If you need capability beyond
            the teacher's, distillation is the wrong tool — improve the teacher (or its training
            data) first, then distill.
          </>)}

          {info(<>
            <b>Bottom line:</b> when you have access to a strong teacher, distillation is the
            <b> default way to ship a small, high-quality model</b> — combining most of the
            teacher's capability with the cost and latency profile your deployment actually needs.
          </>)}
        </>
      ),
    },

  ];

  window.ML_META = {
    title: "Knowledge Distillation",
    subtitle: "Compressing a large teacher into a small, fast student",
    cur: "Distillation",
    category: "LLM Training",
    run: () => ({}), default: {}, renderInput: null,
    modeLinks: [
      { label: "Pre-Training",  href: "LLM-PreTraining.html",        active: false },
      { label: "Distributed",   href: "Distributed-Training.html",   active: false },
      { label: "GPU",           href: "GPU-Architecture.html",      active: false },
      { label: "Quantization",  href: "Quantization.html",           active: false },
      { label: "MoE",           href: "Mixture-of-Experts.html",     active: false },
      { label: "Post-Training", href: "Post-Training.html",          active: false },
      { label: "Distillation",  href: "Knowledge-Distillation.html", active: true  },
      { label: "Embeddings",    href: "Embedding-Models.html",       active: false },
      { label: "Reasoning",     href: "Reasoning-Models.html",       active: false },
      { label: "Inference",     href: "Inference-Serving.html",     active: false },
      { label: "Production",    href: "Production-Safety.html",       active: false },
    ]
  };
  window.ML_STAGES = STAGES;
})();
