/* ============================================================
   Mixture of Experts — stages-moe.jsx (10 stages)
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

    // ─── STAGE 1 · overview ──────────────────────────────────────────────────
    {
      id: "overview",
      group: "Overview",
      title: "What is a Mixture of Experts?",
      map: "Concept",
      why: "Dense transformers force every token through the same feed-forward network, so adding capacity always costs proportional compute. MoE breaks that link — you can grow total parameters massively while keeping per-token compute nearly flat.",
      render: () => (
        <>
          <Lead>
            A dense transformer runs every token through the <b>same</b> feed-forward
            network (FFN). A <b>Mixture of Experts</b> replaces that single FFN with
            <b> N expert FFNs</b> plus a small <b>router</b> that sends each token to only
            a few experts (top-k). The core idea is to <b>decouple total parameters from
            per-token compute</b>: total parameters can be enormous (knowledge capacity)
            while the <b>active</b> parameters used for any one token stay small (cheap
            compute).
          </Lead>

          {subhead("Dense FFN vs. Sparse MoE")}
          <svg width="100%" viewBox="0 0 720 230" style={{display:"block", marginBottom:16, maxWidth:720}}>
            <defs>
              <marker id="oarr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#888" />
              </marker>
            </defs>
            {/* Dense side */}
            <text x="150" y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill="#555">Dense FFN</text>
            <rect x="20" y="40" width="40" height="24" rx="5" fill="#eee" stroke="#bbb"/>
            <rect x="20" y="72" width="40" height="24" rx="5" fill="#eee" stroke="#bbb"/>
            <rect x="20" y="104" width="40" height="24" rx="5" fill="#eee" stroke="#bbb"/>
            <rect x="20" y="136" width="40" height="24" rx="5" fill="#eee" stroke="#bbb"/>
            <text x="40" y="178" textAnchor="middle" fontSize="10" fill="#888">all tokens</text>
            <rect x="170" y="60" width="100" height="80" rx="10" fill="#dfe7ff" stroke="#2B5BFF" strokeWidth="1.5"/>
            <text x="220" y="96" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">One big</text>
            <text x="220" y="112" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">FFN</text>
            <line x1="60" y1="52" x2="168" y2="90" stroke="#888" strokeWidth="1.4" markerEnd="url(#oarr)"/>
            <line x1="60" y1="84" x2="168" y2="96" stroke="#888" strokeWidth="1.4" markerEnd="url(#oarr)"/>
            <line x1="60" y1="116" x2="168" y2="104" stroke="#888" strokeWidth="1.4" markerEnd="url(#oarr)"/>
            <line x1="60" y1="148" x2="168" y2="110" stroke="#888" strokeWidth="1.4" markerEnd="url(#oarr)"/>

            {/* divider */}
            <line x1="355" y1="20" x2="355" y2="200" stroke="#ddd" strokeWidth="1.5" strokeDasharray="4 4"/>

            {/* MoE side */}
            <text x="540" y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a6a1a">Sparse MoE</text>
            <rect x="390" y="88" width="40" height="24" rx="5" fill="#eee" stroke="#bbb"/>
            <text x="410" y="128" textAnchor="middle" fontSize="10" fill="#888">token</text>
            <rect x="455" y="78" width="56" height="44" rx="8" fill="#fff3e8" stroke="#c06000" strokeWidth="1.5"/>
            <text x="483" y="98" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a04000">Router</text>
            <text x="483" y="112" textAnchor="middle" fontSize="9" fill="#a04000">top-2</text>
            <line x1="430" y1="100" x2="453" y2="100" stroke="#888" strokeWidth="1.4" markerEnd="url(#oarr)"/>
            {/* 8 experts */}
            {[0,1,2,3,4,5,6,7].map((i) => {
              const y = 36 + i*22;
              const on = (i === 2 || i === 5);
              return (
                <g key={i}>
                  <rect x="600" y={y} width="100" height="18" rx="4"
                    fill={on ? "#e8ffe8" : "#f3f3f3"} stroke={on ? "#1a8a1a" : "#ccc"} strokeWidth={on ? 1.4 : 1}/>
                  <text x="650" y={y + 13} textAnchor="middle" fontSize="9"
                    fontWeight={on ? 700 : 400} fill={on ? "#1a6a1a" : "#999"}>{ "Expert " + (i + 1) }</text>
                  {on && <line x1="511" y1="100" x2="598" y2={y + 9} stroke="#1a8a1a" strokeWidth="1.4" markerEnd="url(#oarr)"/>}
                </g>
              );
            })}
            <text x="650" y="218" textAnchor="middle" fontSize="10" fill="#888">only 2 of 8 active per token</text>
          </svg>

          {subhead("Headline numbers — total vs. active parameters")}
          {tbl(
            <>
              <thead><tr>
                {th("Model")} {th("Total params")} {th("Active per token")} {th("Ratio")}
              </tr></thead>
              <tbody>
                <tr>{td("Mixtral 8x7B")}{td("47B")}{td("~13B")}{td("~3.6x")}</tr>
                <tr>{td("DeepSeek-V3 / R1")}{td("671B")}{td("37B")}{td("~18x")}</tr>
                <tr>{td("Dense baseline")}{td("13B")}{td("13B")}{td("1x (no decoupling)")}</tr>
              </tbody>
            </>
          )}
          <info>
            The whole point: <b>active params drive compute (FLOPs), total params drive
            knowledge capacity.</b> MoE lets you pay for compute like a 13B model while
            storing knowledge like a 47B (or 671B) model.
          </info>
        </>
      )
    },

    // ─── STAGE 2 · anatomy ───────────────────────────────────────────────────
    {
      id: "anatomy",
      group: "Architecture",
      title: "Anatomy of an MoE Layer",
      map: "Architecture",
      why: "Understanding which parts of the transformer block become sparse — and which stay dense and shared — is essential before reasoning about routing, balancing, and systems cost.",
      render: () => (
        <>
          <Lead>
            An MoE layer has three pieces: a <b>router / gate</b> (a small linear layer
            <code> W_g</code> that produces one logit per expert), <b>N expert FFNs</b>
            (each a normal SwiGLU feed-forward network), and a <b>combine</b> step (a
            weighted sum of the selected experts&apos; outputs). Crucially, <b>only the FFN
            sub-layer is replaced</b> — the attention sub-layer stays dense and is shared
            across all tokens.
          </Lead>

          {subhead("One transformer block with an MoE FFN")}
          <svg width="100%" viewBox="0 0 720 260" style={{display:"block", marginBottom:16, maxWidth:720}}>
            <defs>
              <marker id="aarr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#888" />
              </marker>
            </defs>
            <rect x="20" y="110" width="90" height="40" rx="8" fill="#eee" stroke="#bbb"/>
            <text x="65" y="134" textAnchor="middle" fontSize="11" fontWeight="700" fill="#555">Input x</text>

            <rect x="150" y="100" width="130" height="60" rx="10" fill="#e8f0ff" stroke="#2B5BFF" strokeWidth="1.5"/>
            <text x="215" y="126" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B5BFF">Attention</text>
            <text x="215" y="142" textAnchor="middle" fontSize="9" fill="#2B5BFF">dense + shared</text>

            <rect x="330" y="30" width="280" height="200" rx="12" fill="#fafff7" stroke="#1a8a1a" strokeWidth="1.5" strokeDasharray="5 4"/>
            <text x="470" y="50" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a6a1a">MoE FFN sub-layer</text>

            <rect x="350" y="62" width="80" height="46" rx="8" fill="#fff3e8" stroke="#c06000" strokeWidth="1.5"/>
            <text x="390" y="82" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a04000">Router</text>
            <text x="390" y="96" textAnchor="middle" fontSize="9" fill="#a04000">W_g</text>

            {[0,1,2,3].map((i) => {
              const y = 62 + i*40;
              return (
                <g key={i}>
                  <rect x="470" y={y} width="120" height="30" rx="6" fill="#e8ffe8" stroke="#1a8a1a"/>
                  <text x="530" y={y + 19} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1a6a1a">{ "Expert FFN " + (i + 1) }</text>
                  <line x1="430" y1="85" x2="468" y2={y + 15} stroke="#999" strokeWidth="1.2" markerEnd="url(#aarr)"/>
                </g>
              );
            })}
            <text x="470" y="222" textAnchor="middle" fontSize="9" fill="#888">weighted sum (combine)</text>

            <rect x="650" y="110" width="60" height="40" rx="8" fill="#2B5BFF" stroke="#1a3acc"/>
            <text x="680" y="128" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">y</text>
            <text x="680" y="142" textAnchor="middle" fontSize="8" fill="#ccd8ff">+ residual</text>

            <line x1="110" y1="130" x2="148" y2="130" stroke="#888" strokeWidth="1.6" markerEnd="url(#aarr)"/>
            <line x1="280" y1="130" x2="348" y2="110" stroke="#888" strokeWidth="1.6" markerEnd="url(#aarr)"/>
            <line x1="610" y1="130" x2="648" y2="130" stroke="#888" strokeWidth="1.6" markerEnd="url(#aarr)"/>
          </svg>

          {subhead("Component roles")}
          {tbl(
            <>
              <thead><tr>
                {th("Component")} {th("Shape / size")} {th("Role")}
              </tr></thead>
              <tbody>
                <tr>{td("Router W_g")}{td("[d_model, N]")}{td("One logit per expert; tiny relative to experts")}</tr>
                <tr>{td("Expert FFN (each)")}{td("normal SwiGLU FFN")}{td("Does the actual heavy computation")}</tr>
                <tr>{td("Combine")}{td("weighted sum over top-k")}{td("Merges selected experts into one output")}</tr>
                <tr>{td("Attention")}{td("unchanged")}{td("Stays dense — every token uses it identically")}</tr>
              </tbody>
            </>
          )}
          <Note>
            Experts are usually placed in <b>every layer</b>, though some designs use them
            in <b>every other layer</b> (alternating dense/MoE) to balance quality and cost.
          </Note>
        </>
      )
    },

    // ─── STAGE 3 · routing ───────────────────────────────────────────────────
    {
      id: "routing",
      group: "Architecture",
      title: "Routing — How Tokens Pick Experts",
      map: "Mechanism",
      why: "The router is the heart of an MoE. Its math determines which experts each token uses and how their outputs are blended — and it is also the component most prone to instability and collapse.",
      render: () => (
        <>
          <Lead>
            For each token vector <code>x</code>, the router computes a logit per expert,
            turns those into probabilities, keeps only the <b>top-k</b>, renormalizes their
            weights, and forms the output as a weighted sum of just those experts.
          </Lead>

          {subhead("The routing math, step by step")}
          {codeBlock(
            "1. router_logits = x . W_g          # shape [N], one logit per expert\n" +
            "2. gates         = softmax(router_logits)\n" +
            "3. topk          = argtopk(gates, k)   # k=1 Switch, k=2 Mixtral, k=8 DeepSeek\n" +
            "4. g_i           = gates_i / sum(gates_topk)   # renormalize top-k weights\n" +
            "5. y             = sum over i in topk of  g_i * Expert_i(x)"
          )}

          {subhead("A concrete numeric example (4 experts, top-2)")}
          {codeBlock(
            "router_logits = [ 2.1, 0.4, 1.7, -0.3 ]\n" +
            "softmax       = [ 0.42, 0.08, 0.28, 0.04 ]   (sums to ~1 over all 4)\n" +
            "                       wait: softmax over [2.1,0.4,1.7,-0.3]\n" +
            "  e^x       = [ 8.17, 1.49, 5.47, 0.74 ]   sum = 15.87\n" +
            "  softmax   = [ 0.515, 0.094, 0.345, 0.047 ]\n\n" +
            "top-2 picks  = Expert 1 (0.515)  and  Expert 3 (0.345)\n" +
            "renormalize  = [ 0.515, 0.345 ] / 0.860 = [ 0.599, 0.401 ]\n\n" +
            "y = 0.599 * Expert1(x) + 0.401 * Expert3(x)"
          )}

          {subhead("One token routed to 2 of 4 experts")}
          <svg width="100%" viewBox="0 0 640 200" style={{display:"block", marginBottom:16, maxWidth:640}}>
            <defs>
              <marker id="rarr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#1a8a1a" />
              </marker>
              <marker id="rgray" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#ccc" />
              </marker>
            </defs>
            <rect x="20" y="80" width="70" height="40" rx="8" fill="#eee" stroke="#bbb"/>
            <text x="55" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill="#555">token x</text>
            <rect x="140" y="74" width="80" height="52" rx="10" fill="#fff3e8" stroke="#c06000" strokeWidth="1.5"/>
            <text x="180" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a04000">Router</text>
            <text x="180" y="110" textAnchor="middle" fontSize="9" fill="#a04000">softmax</text>
            <line x1="90" y1="100" x2="138" y2="100" stroke="#888" strokeWidth="1.6" markerEnd="url(#rarr)"/>

            {[
              {n:"Expert 1", g:"0.599", on:true,  y:20},
              {n:"Expert 2", g:"0.094", on:false, y:70},
              {n:"Expert 3", g:"0.401", on:true,  y:120},
              {n:"Expert 4", g:"0.047", on:false, y:170},
            ].map((e, i) => (
              <g key={i}>
                <rect x="420" y={e.y} width="120" height="28" rx="6"
                  fill={e.on ? "#e8ffe8" : "#f3f3f3"} stroke={e.on ? "#1a8a1a" : "#ccc"}/>
                <text x="480" y={e.y + 18} textAnchor="middle" fontSize="10"
                  fontWeight={e.on ? 700 : 400} fill={e.on ? "#1a6a1a" : "#999"}>{e.n}</text>
                <line x1="220" y1="100" x2="418" y2={e.y + 14}
                  stroke={e.on ? "#1a8a1a" : "#ccc"} strokeWidth={e.on ? 1.8 : 1}
                  markerEnd={e.on ? "url(#rarr)" : "url(#rgray)"}/>
                {e.on && <text x={310} y={(100 + e.y + 14)/2 - 4} textAnchor="middle"
                  fontSize="10" fontWeight="700" fill="#1a6a1a">{ "g=" + e.g }</text>}
              </g>
            ))}
          </svg>

          {subhead("Token-choice vs. expert-choice routing")}
          {tbl(
            <>
              <thead><tr>
                {th("Scheme")} {th("Who decides")} {th("Trade-off")}
              </tr></thead>
              <tbody>
                <tr>{td("Token-choice")}{td("Each token picks its top-k experts")}{td("Standard; needs explicit load balancing & capacity limits")}</tr>
                <tr>{td("Expert-choice")}{td("Each expert picks its top-c tokens")}{td("Perfect balance by construction; some tokens get >k or 0 experts")}</tr>
              </tbody>
            </>
          )}
        </>
      )
    },

    // ─── STAGE 4 · load_balancing ────────────────────────────────────────────
    {
      id: "load_balancing",
      group: "Training",
      title: "Load Balancing — Stopping Router Collapse",
      map: "Training",
      why: "Left alone, the router collapses onto a handful of experts and the rest die — wasting most of your parameters. Load balancing is the single most important MoE training technique.",
      render: () => (
        <>
          <Lead>
            The central training problem: without intervention the router <b>collapses</b>.
            A few popular experts receive almost all tokens, get all the gradient updates,
            and become even more popular — while the rest receive nothing and <b>die</b>
            (they never get gradients and contribute nothing). Several fixes keep the load
            spread out.
          </Lead>

          {subhead("Fix 1 — Auxiliary load-balancing loss (Switch Transformer)")}
          {codeBlock(
            "L_aux = alpha * N * sum_i ( f_i * P_i )\n\n" +
            "  N    = number of experts\n" +
            "  f_i  = fraction of tokens routed to expert i  (hard count)\n" +
            "  P_i  = mean router probability assigned to expert i  (soft)\n" +
            "  alpha= small weight, e.g. 0.01\n\n" +
            "Minimized when both f_i and P_i are uniform (1/N each)\n" +
            "=> encourages tokens to spread evenly across experts."
          )}
          <info>
            <code>f_i</code> is non-differentiable (a count), so the loss pushes on the
            differentiable <code>P_i</code>: experts that are overloaded get their
            probabilities pulled down.
          </info>

          {subhead("Fix 2 — Auxiliary-loss-free balancing (DeepSeek-V3)")}
          <p style={{fontSize:13, lineHeight:1.7, color:"var(--ink)", margin:"0 0 10px"}}>
            DeepSeek-V3 avoids an explicit loss term (which can fight the language-modeling
            objective and hurt quality). Instead it adds a <b>per-expert bias</b> to the
            routing logits used <i>for selection</i>. After each step the bias is nudged
            <b> up</b> for under-used experts and <b>down</b> for over-used ones, so load
            balances over time without any gradient on the quality objective.
          </p>

          {subhead("Collapsed vs. balanced expert usage")}
          <svg width="100%" viewBox="0 0 660 200" style={{display:"block", marginBottom:16, maxWidth:660}}>
            <text x="160" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#b00020">Collapsed (no aux loss)</text>
            {[150,30,12,5,3,2,2,1].map((h, i) => (
              <g key={i}>
                <rect x={30 + i*36} y={170 - h} width="26" height={h} fill="#f6b9c2" stroke="#b00020"/>
                <text x={43 + i*36} y="186" textAnchor="middle" fontSize="8" fill="#999">{ "E" + (i+1) }</text>
              </g>
            ))}
            <line x1="350" y1="20" x2="350" y2="190" stroke="#ddd" strokeWidth="1.5" strokeDasharray="4 4"/>
            <text x="510" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a6a1a">Balanced (with aux loss)</text>
            {[22,25,24,23,26,24,25,23].map((h, i) => (
              <g key={i}>
                <rect x={380 + i*36} y={170 - h} width="26" height={h} fill="#bfe8bf" stroke="#1a8a1a"/>
                <text x={393 + i*36} y="186" textAnchor="middle" fontSize="8" fill="#999">{ "E" + (i+1) }</text>
              </g>
            ))}
          </svg>

          <Note>
            <b>Noisy top-k gating</b> (Shazeer et al.) adds tunable Gaussian noise to the
            router logits during training. This encourages <b>exploration</b> so the model
            tries less-popular experts early, helping avoid collapse before balancing kicks
            in.
          </Note>
        </>
      )
    },

    // ─── STAGE 5 · capacity ──────────────────────────────────────────────────
    {
      id: "capacity",
      group: "Training",
      title: "Expert Capacity & Token Dropping",
      map: "Training",
      why: "Hardware needs fixed-size buffers, so each expert can only process so many tokens per batch. Tokens beyond that are dropped — understanding the capacity factor is key to efficient MoE training and serving.",
      render: () => (
        <>
          <Lead>
            For efficient batched matmuls, each expert is given a <b>fixed buffer</b> per
            batch called its <b>capacity</b>. If more tokens route to an expert than its
            capacity allows, the <b>overflow tokens are dropped</b> — they skip the FFN
            entirely and pass through on the residual connection only.
          </Lead>

          {subhead("Capacity formula")}
          {codeBlock(
            "capacity = capacity_factor * (tokens_in_batch / N)\n\n" +
            "  capacity_factor ~ 1.0 - 1.25  typically\n" +
            "  larger factor  => fewer drops, but more memory & wasted compute\n" +
            "  smaller factor => cheaper, but more tokens dropped"
          )}
          <info>
            A dropped token is not an error — it still produces an output (via the residual),
            just without any FFN transformation at that layer. But too many drops degrade
            quality, so the goal is a near-zero drop rate at acceptable cost.
          </info>

          {subhead("Capacity factor trade-off")}
          {tbl(
            <>
              <thead><tr>
                {th("Capacity factor")} {th("Approx. dropped-token rate")} {th("Wasted compute (empty slots)")} {th("When to use")}
              </tr></thead>
              <tbody>
                <tr>{td("0.75")}{td("high (often >10%)")}{td("low")}{td("Memory-constrained, quality-tolerant")}</tr>
                <tr>{td("1.0")}{td("moderate")}{td("low–moderate")}{td("Balanced default")}</tr>
                <tr>{td("1.25")}{td("low (a few %)")}{td("moderate")}{td("Quality-sensitive training")}</tr>
                <tr>{td("2.0")}{td("near zero")}{td("high")}{td("Eval / small batches where drops matter")}</tr>
              </tbody>
            </>
          )}

          {subhead("Why a dropped token happens")}
          <svg width="100%" viewBox="0 0 640 160" style={{display:"block", marginBottom:16, maxWidth:640}}>
            <text x="320" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#555">Expert with capacity = 4, but 6 tokens routed</text>
            {[0,1,2,3,4,5].map((i) => {
              const dropped = i >= 4;
              return (
                <g key={i}>
                  <rect x={40 + i*70} y="50" width="50" height="30" rx="6"
                    fill={dropped ? "#f6b9c2" : "#bfe8bf"} stroke={dropped ? "#b00020" : "#1a8a1a"}/>
                  <text x={65 + i*70} y="70" textAnchor="middle" fontSize="10"
                    fill={dropped ? "#b00020" : "#1a6a1a"}>{ "tok " + (i+1) }</text>
                  <text x={65 + i*70} y="100" textAnchor="middle" fontSize="9"
                    fill={dropped ? "#b00020" : "#1a6a1a"}>{dropped ? "DROPPED" : "processed"}</text>
                </g>
              );
            })}
            <line x1="320" y1="120" x2="320" y2="140" stroke="#ccc"/>
            <text x="320" y="153" textAnchor="middle" fontSize="10" fill="#888">dropped tokens pass through on the residual only</text>
          </svg>

          <Note>
            This is why <b>batching matters for MoE efficiency</b>: larger, well-mixed
            batches make per-expert load more uniform, lowering the capacity factor needed
            to avoid drops.
          </Note>
        </>
      )
    },

    // ─── STAGE 6 · models ────────────────────────────────────────────────────
    {
      id: "models",
      group: "Models",
      title: "Real MoE Models",
      map: "Landscape",
      why: "Seeing how production models choose N, k, and total/active param budgets grounds the theory and shows the range of viable design points.",
      render: () => (
        <>
          <Lead>
            MoE went from research curiosity to the dominant architecture for frontier-scale
            open models. The design space is wide — from a single active expert (top-1) to
            eight (top-8), and from 8 experts to 256.
          </Lead>

          {subhead("MoE model comparison")}
          {tbl(
            <>
              <thead><tr>
                {th("Model")} {th("Experts")} {th("Top-k")} {th("Total")} {th("Active")} {th("Notable idea")}
              </tr></thead>
              <tbody>
                <tr>{td("Switch Transformer (Google, 2021)")}{td("up to 2048")}{td("1")}{td("up to 1.6T")}{td("varies")}{td("Top-1 simplicity; proved MoE scales")}</tr>
                <tr>{td("GShard (Google)")}{td("many")}{td("2")}{td("up to 600B")}{td("varies")}{td("First large-scale MoE + sharding")}</tr>
                <tr>{td("Mixtral 8x7B (Mistral)")}{td("8")}{td("2")}{td("47B")}{td("~13B")}{td("Open Apache-2 MoE; strong quality/cost")}</tr>
                <tr>{td("DBRX (Databricks)")}{td("16")}{td("4")}{td("132B")}{td("36B")}{td("Fine-grained experts (more, smaller)")}</tr>
                <tr>{td("DeepSeek-V3 / R1")}{td("256 routed + 1 shared")}{td("8")}{td("671B")}{td("37B")}{td("Fine-grained + shared + aux-loss-free balancing")}</tr>
                <tr>{td("Qwen-MoE (Alibaba)")}{td("60+ (fine-grained)")}{td("varies")}{td("varies")}{td("varies")}{td("Shared + fine-grained experts")}</tr>
                <tr>{td("Grok-1 (xAI)")}{td("8")}{td("2")}{td("314B")}{td("~86B")}{td("Large open-weight MoE")}</tr>
              </tbody>
            </>
          )}
          <info>
            Two clear eras: early MoE (Switch, Mixtral) used <b>few large experts</b>;
            newer models (DeepSeek, DBRX, Qwen) trend toward <b>many small fine-grained
            experts plus shared experts</b> — covered next.
          </info>
        </>
      )
    },

    // ─── STAGE 7 · finegrained_shared ────────────────────────────────────────
    {
      id: "finegrained_shared",
      group: "Models",
      title: "Fine-Grained & Shared Experts (DeepSeek)",
      map: "Architecture",
      why: "These two ideas substantially improved MoE quality at fixed compute and now define the modern MoE design pattern.",
      render: () => (
        <>
          <Lead>
            DeepSeek popularized two refinements that meaningfully improve MoE efficiency:
            <b> fine-grained experts</b> and <b>shared experts</b>.
          </Lead>

          {subhead("Fine-grained experts")}
          <p style={{fontSize:13, lineHeight:1.7, color:"var(--ink)", margin:"0 0 10px"}}>
            Split each expert into several smaller ones and raise <code>k</code> proportionally
            (keeping active params constant). With more, smaller experts and a larger top-k,
            the number of possible <b>expert combinations</b> grows combinatorially, allowing
            far finer <b>specialization</b> at the same compute budget. For example, going
            from 8 experts top-2 to 64 experts top-16 keeps active FLOPs similar but vastly
            increases routing flexibility.
          </p>

          {subhead("Shared experts")}
          <p style={{fontSize:13, lineHeight:1.7, color:"var(--ink)", margin:"0 0 10px"}}>
            A few experts are <b>always active for every token</b>. They absorb common,
            general-purpose knowledge that every token needs, which frees the <b>routed</b>
            experts to specialize on rarer patterns. This reduces redundancy — without
            shared experts, many routed experts end up re-learning the same common
            transformations.
          </p>

          {subhead("Shared (always on) + routed (top-k)")}
          <svg width="100%" viewBox="0 0 640 220" style={{display:"block", marginBottom:16, maxWidth:640}}>
            <defs>
              <marker id="farr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#888" />
              </marker>
              <marker id="fgreen" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#1a8a1a" />
              </marker>
            </defs>
            <rect x="20" y="95" width="70" height="38" rx="8" fill="#eee" stroke="#bbb"/>
            <text x="55" y="118" textAnchor="middle" fontSize="11" fontWeight="700" fill="#555">token</text>

            <rect x="150" y="90" width="80" height="48" rx="10" fill="#fff3e8" stroke="#c06000" strokeWidth="1.5"/>
            <text x="190" y="112" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a04000">Router</text>
            <line x1="90" y1="114" x2="148" y2="114" stroke="#888" strokeWidth="1.6" markerEnd="url(#farr)"/>

            {/* shared expert */}
            <rect x="420" y="20" width="160" height="34" rx="6" fill="#dfe7ff" stroke="#2B5BFF" strokeWidth="1.6"/>
            <text x="500" y="41" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2B5BFF">Shared Expert (always on)</text>
            <line x1="90" y1="100" x2="418" y2="37" stroke="#2B5BFF" strokeWidth="1.6" markerEnd="url(#farr)"/>

            {/* routed experts */}
            {[
              {n:"Routed E1", on:true,  y:66},
              {n:"Routed E2", on:false, y:104},
              {n:"Routed E3", on:true,  y:142},
              {n:"Routed E4", on:false, y:180},
            ].map((e, i) => (
              <g key={i}>
                <rect x="420" y={e.y} width="160" height="28" rx="6"
                  fill={e.on ? "#e8ffe8" : "#f3f3f3"} stroke={e.on ? "#1a8a1a" : "#ccc"}/>
                <text x="500" y={e.y + 18} textAnchor="middle" fontSize="10"
                  fontWeight={e.on ? 700 : 400} fill={e.on ? "#1a6a1a" : "#999"}>{e.n}</text>
                {e.on && <line x1="230" y1="114" x2="418" y2={e.y + 14}
                  stroke="#1a8a1a" strokeWidth="1.5" markerEnd="url(#fgreen)"/>}
              </g>
            ))}
            <text x="500" y="212" textAnchor="middle" fontSize="9" fill="#888">shared always runs; router adds top-k routed experts</text>
          </svg>

          <Note>
            Net effect: <b>shared experts handle the common case, fine-grained routed
            experts handle the long tail</b> — more capacity is actually used, raising
            quality per active FLOP.
          </Note>
        </>
      )
    },

    // ─── STAGE 8 · expert_parallelism ────────────────────────────────────────
    {
      id: "expert_parallelism",
      group: "Systems",
      title: "Expert Parallelism & All-to-All",
      map: "Systems",
      why: "MoE moves the bottleneck from compute to communication. Knowing why all-to-all dominates the cost — and that MoE saves compute but not memory — is essential for sizing hardware.",
      render: () => (
        <>
          <Lead>
            Because all experts must fit in memory but only a few are active, experts are
            <b> distributed across GPUs</b> — this is <b>expert parallelism (EP)</b>. The
            catch: every MoE layer needs <b>two all-to-all communications</b> per step —
            <b> dispatch</b> (send each token to the GPU holding its chosen expert) and
            <b> combine</b> (send the results back to the token&apos;s home GPU).
          </Lead>

          {subhead("The two all-to-all exchanges")}
          <svg width="100%" viewBox="0 0 660 220" style={{display:"block", marginBottom:16, maxWidth:660}}>
            <defs>
              <marker id="parr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#c06000" />
              </marker>
            </defs>
            {[0,1,2,3].map((g) => (
              <g key={g}>
                <rect x={30 + g*160} y="20" width="120" height="40" rx="8" fill="#eee" stroke="#bbb"/>
                <text x={90 + g*160} y="44" textAnchor="middle" fontSize="11" fontWeight="700" fill="#555">{ "GPU " + g + " tokens" }</text>
                <rect x={30 + g*160} y="160" width="120" height="40" rx="8" fill="#e8ffe8" stroke="#1a8a1a"/>
                <text x={90 + g*160} y="184" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a6a1a">{ "GPU " + g + " experts" }</text>
              </g>
            ))}
            {/* crossing all-to-all lines */}
            {[[0,2],[1,3],[2,0],[3,1],[0,1],[3,2]].map((p, i) => (
              <line key={i} x1={90 + p[0]*160} y1="62" x2={90 + p[1]*160} y2="158"
                stroke="#c06000" strokeWidth="1.3" opacity="0.7" markerEnd="url(#parr)"/>
            ))}
            <text x="330" y="112" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a04000">all-to-all: dispatch (down) + combine (up)</text>
          </svg>

          {subhead("Why this is the bottleneck")}
          {tbl(
            <>
              <thead><tr>
                {th("Aspect")} {th("Implication")}
              </tr></thead>
              <tbody>
                <tr>{td("All-to-all volume")}{td("Every token crosses the network twice per MoE layer")}</tr>
                <tr>{td("Interconnect dependence")}{td("Needs fast links (NVLink / InfiniBand); slow networks stall GPUs")}</tr>
                <tr>{td("Composes with DP/TP/PP")}{td("EP layers on top of data/tensor/pipeline parallelism (see Distributed Training)")}</tr>
                <tr>{td("Load imbalance")}{td("A hot expert makes its GPU the straggler for the whole step")}</tr>
              </tbody>
            </>
          )}

          <warn>
            All experts must still fit in <b>aggregate VRAM</b> even though only a few are
            active for any token. <b>MoE saves compute, NOT memory.</b> A 671B MoE needs
            roughly the memory of a 671B dense model, but the FLOPs of a ~37B one.
          </warn>
        </>
      )
    },

    // ─── STAGE 9 · tradeoffs ─────────────────────────────────────────────────
    {
      id: "tradeoffs",
      group: "Concepts",
      title: "Tradeoffs — When MoE Wins and Loses",
      map: "Decision",
      why: "MoE is not free capacity — it is a specific memory-for-compute trade. Knowing the pros and cons tells you when it is the right architecture and when a dense model is better.",
      render: () => (
        <>
          <Lead>
            MoE buys you capacity at fixed FLOPs, but it pays in memory, complexity, and
            communication. The decision comes down to whether you can afford the
            <b> memory and serving footprint</b> in exchange for <b>low per-token compute</b>.
          </Lead>

          {subhead("Pros vs. cons")}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14}}>
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#1a6a1a", marginBottom:8}}>Pros</div>
              <ul style={{margin:0, paddingLeft:18, fontSize:12.5, lineHeight:1.8, color:"var(--ink)"}}>
                <li>More capacity at a fixed FLOPs budget</li>
                <li>Trains faster to a target quality (better loss per FLOP)</li>
                <li>Cheaper per-token inference than a dense model of equal total size</li>
                <li>Experts can specialize on distinct token types</li>
              </ul>
            </>, {borderColor:"#bfe8bf", background:"#fafff7"})}
            {card(<>
              <div style={{fontWeight:700, fontSize:13, color:"#b00020", marginBottom:8}}>Cons</div>
              <ul style={{margin:0, paddingLeft:18, fontSize:12.5, lineHeight:1.8, color:"var(--ink)"}}>
                <li>Huge VRAM — all experts resident in memory</li>
                <li>Training instability (router collapse, spikes)</li>
                <li>Load-balancing complexity (aux loss, biases, capacity)</li>
                <li>All-to-all communication overhead</li>
                <li>Harder to fine-tune; lower parameter efficiency</li>
                <li>Batch / latency variability from routing</li>
              </ul>
            </>, {borderColor:"#f6b9c2", background:"#fff7f8"})}
          </div>

          {subhead("MoE vs. dense — matched how?")}
          {tbl(
            <>
              <thead><tr>
                {th("Comparison basis")} {th("Outcome")}
              </tr></thead>
              <tbody>
                <tr>{td("Matched ACTIVE params (equal FLOPs)")}{td("MoE wins on quality — it has far more total params for the same compute")}</tr>
                <tr>{td("Matched TOTAL params (equal memory)")}{td("Dense often wins on quality — it uses every param on every token (higher param efficiency), and is simpler to train/serve")}</tr>
              </tbody>
            </>
          )}

          <info>
            <b>Key framing:</b> MoE is a <b>memory-for-compute trade</b>. Use it when you can
            afford the memory and serving footprint but want low per-token compute (e.g.
            serving a very capable model at high throughput). Choose dense when memory is the
            binding constraint or you need maximum quality per stored parameter.
          </info>
        </>
      )
    },

    // ─── STAGE 10 · evaluation ───────────────────────────────────────────────
    {
      id: "evaluation",
      group: "Evaluation",
      title: "Evaluating MoE Models",
      map: "Evaluation",
      why: "Standard benchmarks miss MoE-specific failure modes like dead experts and dropped tokens. Health metrics and honest parameter accounting are needed to evaluate and compare MoE models fairly.",
      render: () => (
        <>
          <Lead>
            MoE models are evaluated on the same task benchmarks as any LLM
            (<b>MMLU, GSM8K, HumanEval</b>, etc.). But on top of those, MoE needs
            <b> architecture health metrics</b> to catch routing pathologies that benchmarks
            alone will not reveal.
          </Lead>

          {subhead("MoE-specific health metrics")}
          {tbl(
            <>
              <thead><tr>
                {th("Metric")} {th("What it measures")} {th("Healthy signal")}
              </tr></thead>
              <tbody>
                <tr>{td("Expert utilization / load balance")}{td("Coefficient of variation of tokens-per-expert")}{td("Low CV — load spread evenly")}</tr>
                <tr>{td("Dropped-token rate")}{td("Fraction of tokens overflowing capacity")}{td("Near 0 with adequate capacity factor")}</tr>
                <tr>{td("Routing entropy")}{td("How confident vs. random routing decisions are")}{td("Moderate — confident but not degenerate")}</tr>
                <tr>{td("Expert specialization")}{td("Do experts activate on distinguishable token types")}{td("Distinct, interpretable activation patterns")}</tr>
                <tr>{td("Active-FLOPs / effective params")}{td("Compute actually used per token")}{td("Reported alongside total params")}</tr>
              </tbody>
            </>
          )}

          {subhead("Honest parameter accounting")}
          <p style={{fontSize:13, lineHeight:1.7, color:"var(--ink)", margin:"0 0 10px"}}>
            When comparing an MoE to a dense baseline, compare at <b>equal active compute</b>
            (active params / active FLOPs) <b>and</b> separately note the <b>total memory
            footprint</b>. A 671B-total / 37B-active model is &quot;37B-sized&quot; in compute
            but &quot;671B-sized&quot; in memory — both numbers matter.
          </p>

          <warn>
            Reporting <b>only total parameters</b> is misleading marketing. Always report
            <b> active params</b> (the compute) and the <b>memory footprint</b> (all experts
            resident) so readers can compare fairly against dense models.
          </warn>

          {subhead("What to log during & after training")}
          {tbl(
            <>
              <thead><tr>
                {th("Log")} {th("Why")}
              </tr></thead>
              <tbody>
                <tr>{td("Per-expert token counts (histogram)")}{td("Detect collapse / dead experts early")}</tr>
                <tr>{td("Aux loss value (or bias drift)")}{td("Confirm balancing is engaging")}</tr>
                <tr>{td("Dropped-token rate per layer")}{td("Tune capacity factor")}</tr>
                <tr>{td("Routing entropy over time")}{td("Spot router degeneration")}</tr>
                <tr>{td("Active params & active FLOPs")}{td("Fair comparison to dense baselines")}</tr>
              </tbody>
            </>
          )}
        </>
      )
    },

  ]; // end STAGES

  window.ML_META = {
    title: "Mixture of Experts",
    subtitle: "Sparse models — trillions of parameters, a fraction of the compute",
    cur: "MoE",
    category: "LLM Training",
    run: () => ({}),
    default: {},
    renderInput: null,
    modeLinks: [
      { label: "Pre-Training",  href: "LLM-PreTraining.html",        active: false },
      { label: "Distributed",   href: "Distributed-Training.html",   active: false },
      { label: "GPU",           href: "GPU-Architecture.html",      active: false },
      { label: "Quantization",  href: "Quantization.html",           active: false },
      { label: "MoE",           href: "Mixture-of-Experts.html",     active: true  },
      { label: "Post-Training", href: "Post-Training.html",          active: false },
      { label: "Distillation",  href: "Knowledge-Distillation.html", active: false },
      { label: "Embeddings",    href: "Embedding-Models.html",       active: false },
      { label: "Reasoning",     href: "Reasoning-Models.html",       active: false },
      { label: "Inference",     href: "Inference-Serving.html",     active: false },
      { label: "Production",    href: "Production-Safety.html",       active: false },
    ]
  };
  window.ML_STAGES = STAGES;
})();
