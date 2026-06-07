/* ============================================================
   LLM Inference & Serving — stages-inference.jsx (14 stages)
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

  /* ---- SVG palette helpers ---- */
  const C = {
    box:"#ffffff", line:"#94a3b8", ink:"#1e293b", mut:"#64748b",
    blue:"#2b5bff", blueBg:"#e6ecff", green:"#16a34a", greenBg:"#dcfce7",
    amber:"#d97706", amberBg:"#fef3c7", red:"#dc2626", redBg:"#fee2e2",
    purple:"#7c3aed", purpleBg:"#ede9fe", slate:"#475569", slateBg:"#f1f5f9"
  };

  const STAGES = [

  /* ================= 1. OVERVIEW ================= */
  {
    id:"overview", group:"Overview", title:"What Is Inference & Why It Matters",
    map:"Overview",
    why:"Before optimizing anything, you must understand what serving actually does: generate text one token at a time, autoregressively, for every user request.",
    render: () => (
      <div>
        <Lead>Training teaches a model its weights — a large, one-time investment. Inference is what happens afterward: running those frozen weights to answer real requests. It runs continuously, scales with traffic, and never stops. For any deployed model, inference dominates the total compute and dollar bill.</Lead>

        {info(<span><b>The cost reality:</b> for a model in production, roughly 80-90% of lifetime compute (and cost) is spent on inference, not training. Optimizing serving is optimizing the business.</span>)}

        {subhead("Inference is autoregressive")}
        <p style={{fontSize:14, lineHeight:1.7}}>A language model does not emit a whole answer at once. It predicts the next token given everything so far, appends it to the sequence, and repeats — until it produces an end-of-sequence (EOS) token or hits a length limit. Each output token is a full forward pass through the network.</p>

        <svg viewBox="0 0 720 200" style={{width:"100%", maxWidth:720, display:"block", margin:"14px auto"}}>
          <rect x={20} y={70} width={120} height={60} rx={10} fill={C.blueBg} stroke={C.blue}/>
          <text x={80} y={95} textAnchor="middle" fontSize={12} fontWeight="700" fill={C.ink}>Prompt</text>
          <text x={80} y={113} textAnchor="middle" fontSize={10} fill={C.mut}>+ tokens so far</text>

          <rect x={210} y={60} width={150} height={80} rx={10} fill={C.slateBg} stroke={C.slate}/>
          <text x={285} y={92} textAnchor="middle" fontSize={12} fontWeight="700" fill={C.ink}>LLM forward</text>
          <text x={285} y={110} textAnchor="middle" fontSize={10} fill={C.mut}>pass</text>

          <rect x={430} y={70} width={130} height={60} rx={10} fill={C.greenBg} stroke={C.green}/>
          <text x={495} y={95} textAnchor="middle" fontSize={12} fontWeight="700" fill={C.ink}>Next token</text>
          <text x={495} y={113} textAnchor="middle" fontSize={10} fill={C.mut}>sampled</text>

          <rect x={610} y={70} width={90} height={60} rx={10} fill={C.amberBg} stroke={C.amber}/>
          <text x={655} y={95} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.ink}>EOS?</text>
          <text x={655} y={113} textAnchor="middle" fontSize={9} fill={C.mut}>stop / loop</text>

          <line x1={140} y1={100} x2={208} y2={100} stroke={C.line} strokeWidth={2} markerEnd="url(#ah1)"/>
          <line x1={360} y1={100} x2={428} y2={100} stroke={C.line} strokeWidth={2} markerEnd="url(#ah1)"/>
          <line x1={560} y1={100} x2={608} y2={100} stroke={C.line} strokeWidth={2} markerEnd="url(#ah1)"/>

          <path d="M655 130 L655 175 L80 175 L80 132" fill="none" stroke={C.blue} strokeWidth={2} strokeDasharray="5 4" markerEnd="url(#ah1b)"/>
          <text x={360} y={192} textAnchor="middle" fontSize={11} fill={C.blue} fontWeight="600">append token, repeat until EOS</text>
          <defs>
            <marker id="ah1" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill={C.line}/></marker>
            <marker id="ah1b" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill={C.blue}/></marker>
          </defs>
        </svg>

        {tbl(<tbody>
          <tr>{th("Aspect")}{th("Training")}{th("Inference")}</tr>
          <tr>{td("Frequency")}{td("Once (or periodic re-runs)")}{td("Every request, continuously")}</tr>
          <tr>{td("Goal")}{td("Learn / update weights")}{td("Run frozen weights to produce output")}</tr>
          <tr>{td("Cost profile")}{td("Big upfront capex")}{td("Ongoing opex — dominates lifetime cost")}</tr>
          <tr>{td("Optimized for")}{td("Throughput on fixed dataset")}{td("Latency + throughput under live, bursty traffic")}</tr>
        </tbody>)}

        <Note>This article focuses on serving generative LLMs, but ends with how embedding-model serving differs — because real systems (like RAG) run both.</Note>
      </div>
    )
  },

  /* ================= 2. PREFILL vs DECODE ================= */
  {
    id:"prefill_decode", group:"Mechanics", title:"Two Phases: Prefill vs Decode",
    map:"Prefill vs Decode",
    why:"Almost every serving optimization targets one phase or the other. You cannot reason about latency without knowing which phase you are in.",
    render: () => (
      <div>
        <Lead>A single generation splits into two phases. <b>Prefill</b> ingests the entire prompt at once. <b>Decode</b> then emits output tokens one at a time. They stress the GPU in completely different ways.</Lead>

        {subhead("Prefill: process the whole prompt in parallel")}
        <p style={{fontSize:14, lineHeight:1.7}}>All prompt tokens go through the network together as one big matrix multiply (GEMM). The GPU's math units are saturated — this phase is <b>compute-bound</b>. It produces the first output token and populates the KV cache. Prefill time determines <b>TTFT</b> (time to first token).</p>

        {subhead("Decode: one token at a time")}
        <p style={{fontSize:14, lineHeight:1.7}}>Each step generates exactly one new token, reading the entire KV cache from GPU memory. The matrices are tiny but the memory traffic is huge — this phase is <b>memory-bandwidth-bound</b>, and it dominates total latency for long answers. Decode pace determines <b>TPOT</b> (time per output token).</p>

        <svg viewBox="0 0 720 200" style={{width:"100%", maxWidth:720, display:"block", margin:"14px auto"}}>
          <text x={20} y={30} fontSize={12} fontWeight="700" fill={C.ink}>Time</text>
          <line x1={20} y1={40} x2={700} y2={40} stroke={C.line} strokeWidth={1.5} markerEnd="url(#ah2)"/>

          <rect x={30} y={60} width={180} height={70} rx={8} fill={C.blueBg} stroke={C.blue}/>
          <text x={120} y={88} textAnchor="middle" fontSize={13} fontWeight="700" fill={C.ink}>PREFILL</text>
          <text x={120} y={106} textAnchor="middle" fontSize={10} fill={C.mut}>all prompt tokens, parallel</text>
          <text x={120} y={121} textAnchor="middle" fontSize={9} fill={C.blue}>compute-bound, sets TTFT</text>

          {[0,1,2,3,4,5].map(function(i){
            return (<g key={i}>
              <rect x={240 + i*72} y={75} width={56} height={40} rx={6} fill={C.greenBg} stroke={C.green}/>
              <text x={268 + i*72} y={100} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.ink}>{"t"+(i+1)}</text>
            </g>);
          })}
          <text x={450} y={140} textAnchor="middle" fontSize={11} fill={C.green} fontWeight="600">DECODE — one token per step (memory-bound, sets TPOT)</text>
          <text x={450} y={155} textAnchor="middle" fontSize={9} fill={C.mut}>repeats once per output token until EOS</text>
          <defs><marker id="ah2" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill={C.line}/></marker></defs>
        </svg>

        {tbl(<tbody>
          <tr>{th("")}{th("Prefill")}{th("Decode")}</tr>
          <tr>{td("Tokens per step")}{td("Whole prompt at once")}{td("Exactly one")}</tr>
          <tr>{td("Parallelism")}{td("High (big GEMM)")}{td("Low (tiny matvec)")}</tr>
          <tr>{td("Bottleneck")}{td("Compute (FLOPs)")}{td("Memory bandwidth")}</tr>
          <tr>{td("Determines")}{td("TTFT")}{td("TPOT / inter-token latency")}</tr>
          <tr>{td("Dominates when")}{td("Long prompts")}{td("Long outputs (usually the latency driver)")}</tr>
        </tbody>)}

        {info(<span>Because the two phases have opposite profiles, mixing them naively in one batch causes interference — which motivates <b>chunked prefill</b> and, at scale, <b>disaggregated prefill/decode</b> (later stages).</span>)}
      </div>
    )
  },

  /* ================= 3. KV CACHE ================= */
  {
    id:"kv_cache", group:"Mechanics", title:"The KV Cache — Inference's Memory Hog",
    map:"KV Cache",
    why:"KV-cache size dictates how many requests and how long a context you can serve on a GPU. Underestimating it is the #1 cause of out-of-memory crashes.",
    render: () => (
      <div>
        <Lead>In attention, each token attends to all previous tokens via their Key (K) and Value (V) vectors. Recomputing K and V for the whole history at every decode step would be quadratic and wasteful. So we cache them. That cache is the KV cache — and it is enormous.</Lead>

        {subhead("Why it exists")}
        <p style={{fontSize:14, lineHeight:1.7}}>Without it, generating token 1000 would re-run attention over 999 prior tokens from scratch each step. With it, each new token only computes its own K and V, appends them, and attends. This turns decode from quadratic into linear — at the cost of memory.</p>

        {subhead("The size formula")}
        {codeBlock(
"KV bytes = 2 * num_layers * num_kv_heads * head_dim\n" +
"           * seq_len * batch_size * bytes_per_elem\n\n" +
"  2            -> one K + one V\n" +
"  seq_len      -> grows every generated token\n" +
"  batch_size   -> grows with concurrent requests\n" +
"  bytes_per_elem -> 2 for FP16/BF16, 1 for FP8"
        )}

        <svg viewBox="0 0 720 180" style={{width:"100%", maxWidth:720, display:"block", margin:"14px auto"}}>
          <text x={20} y={28} fontSize={12} fontWeight="700" fill={C.ink}>KV cache grows with every generated token</text>
          {[1,2,3,4,5,6,7,8].map(function(i){
            return (<g key={i}>
              <rect x={20 + i*82} y={50} width={64} height={20 + i*12} rx={4} fill={C.purpleBg} stroke={C.purple}/>
              <text x={52 + i*82} y={145} textAnchor="middle" fontSize={10} fill={C.mut}>{"t"+i}</text>
            </g>);
          })}
          <text x={360} y={165} textAnchor="middle" fontSize={11} fill={C.purple} fontWeight="600">memory per request rises linearly with sequence length</text>
        </svg>

        {info(<span><b>Worked example.</b> A 70B-class model serving very long context (e.g. ~200K tokens) across a batch can require roughly 40-80 GB <i>just</i> for KV cache — often more than one GPU has free after weights. This is why context length and batch size are fundamentally limited by KV memory, not by the model weights alone.</span>)}

        <p style={{fontSize:14, lineHeight:1.7}}>Two consequences drive the rest of serving: (1) the KV cache competes with model weights for VRAM, capping batch size and context; (2) it is allocated and freed constantly, so <i>how</i> you manage that memory matters — which is exactly what <b>PagedAttention</b> solves.</p>

        {warn(<span>The KV cache, not the model weights, is usually the binding constraint at serving time. Always size it explicitly for your max context and concurrency.</span>)}
      </div>
    )
  },

  /* ================= 4. CHALLENGES ================= */
  {
    id:"challenges", group:"Overview", title:"The Hard Problems of Serving LLMs in 2025",
    map:"Challenges",
    why:"Understanding the problem space tells you which techniques to reach for — the rest of this article maps solutions onto these problems.",
    render: () => (
      <div>
        <Lead>LLM serving is not just "run the model." It is a systems problem dominated by scarce, expensive accelerators and conflicting objectives. Here are the hard problems — and forward-pointers to what solves each.</Lead>

        {tbl(<tbody>
          <tr>{th("Problem")}{th("Why it is hard")}{th("What addresses it")}</tr>
          <tr>{td("GPU cost & scarcity")}{td("Cloud H100s run ~$1.49-3.50/hr; capacity is constrained and contended")}{td("Batching, quantization, autoscaling, right-sizing")}</tr>
          <tr>{td("Latency vs throughput")}{td("Big batches raise throughput but hurt TTFT/TPOT; small batches do the reverse")}{td("Continuous batching, chunked prefill, disaggregation")}</tr>
          <tr>{td("KV-cache memory")}{td("Grows linearly with context x batch; caps how much you can serve")}{td("PagedAttention, quantized KV, prefix reuse")}</tr>
          <tr>{td("Cold starts / autoscaling")}{td("Loading large weights onto a fresh GPU is slow; bursts arrive faster")}{td("HPA/KEDA, warm pools, MIG, fast loaders")}</tr>
          <tr>{td("Head-of-line blocking")}{td("One long prompt in a naive batch stalls everyone behind it")}{td("Continuous batching, chunked prefill")}</tr>
          <tr>{td("Falling price per token")}{td("Cost per million tokens is dropping fast (~$0.40/M for GPT-4-class, down ~80% YoY) — efficiency is competitive pressure")}{td("Every optimization in this article")}</tr>
        </tbody>)}

        {info(<span>The single most important framing: there is no free lunch between <b>latency</b> (TTFT, TPOT) and <b>throughput</b> (tokens/sec, requests/sec). Good serving systems let you dial the tradeoff and measure what actually matters — <b>goodput</b>, the requests that meet your SLO.</span>)}
      </div>
    )
  },

  /* ================= 5. BATCHING ================= */
  {
    id:"batching", group:"Techniques", title:"Batching: Static → Dynamic → Continuous",
    map:"Batching",
    why:"Without batching, each request under-utilizes the GPU. The evolution from static to continuous batching is the core story of why vLLM-era servers are so much faster.",
    render: () => (
      <div>
        <Lead>A GPU running one request at a time wastes most of its compute. Batching processes many requests together so the expensive matrix multiplies are amortized. But naive batching introduces its own waste — which continuous batching eliminates.</Lead>

        {subhead("Static batching")}
        <p style={{fontSize:14, lineHeight:1.7}}>Collect a fixed number of requests, run them all together, return all results. Problem: the whole batch waits for the <i>slowest</i> (longest-generating) request, and finished slots sit idle. New arrivals wait for the next batch.</p>

        {subhead("Dynamic batching")}
        <p style={{fontSize:14, lineHeight:1.7}}>Batch whatever arrives within a small time window. Better utilization, but still suffers the "wait for the slowest" problem once a batch starts decoding.</p>

        {subhead("Continuous (in-flight) batching")}
        <p style={{fontSize:14, lineHeight:1.7}}>Operate at the granularity of a single decode step. After every step, finished requests are <b>evicted</b> and waiting requests are <b>added</b> into the freed slots — immediately. The GPU stays full; no request waits for an unrelated one to finish. This is the key throughput unlock of modern serving.</p>

        <svg viewBox="0 0 720 250" style={{width:"100%", maxWidth:720, display:"block", margin:"14px auto"}}>
          <text x={20} y={24} fontSize={12} fontWeight="700" fill={C.ink}>Static batching — idle gaps, batch waits for slowest</text>
          {[0,1,2,3].map(function(r){
            var w = [180,120,90,150][r];
            return (<g key={r}>
              <text x={18} y={50 + r*22} fontSize={10} fill={C.mut}>{"R"+(r+1)}</text>
              <rect x={40} y={40 + r*22} width={w} height={16} rx={4} fill={C.blueBg} stroke={C.blue}/>
              <rect x={40+w} y={40 + r*22} width={180-w} height={16} rx={4} fill="#f1f5f9" stroke="#e2e8f0" strokeDasharray="3 3"/>
            </g>);
          })}
          <text x={150} y={138} fontSize={9} fill={C.red}>idle (wasted) until slowest finishes →</text>

          <text x={20} y={170} fontSize={12} fontWeight="700" fill={C.ink}>Continuous batching — slots refilled every step</text>
          {[0,1,2,3].map(function(r){
            return (<g key={r}>
              <text x={18} y={196 + r*14} fontSize={10} fill={C.mut}>{"S"+(r+1)}</text>
              <rect x={40} y={186 + r*14} width={120} height={10} rx={3} fill={C.greenBg} stroke={C.green}/>
              <rect x={162} y={186 + r*14} width={90} height={10} rx={3} fill={C.purpleBg} stroke={C.purple}/>
              <rect x={254} y={186 + r*14} width={130} height={10} rx={3} fill={C.amberBg} stroke={C.amber}/>
              <rect x={386} y={186 + r*14} width={80} height={10} rx={3} fill={C.greenBg} stroke={C.green}/>
            </g>);
          })}
          <text x={250} y={250} textAnchor="middle" fontSize={9} fill={C.green}>finished request leaves, new one slots in immediately — no gaps</text>
        </svg>

        {info(<span>Continuous batching can multiply throughput several-fold over static batching at the same latency. It is the default in vLLM, TGI, TensorRT-LLM (in-flight batching), SGLang, and others.</span>)}
      </div>
    )
  },

  /* ================= 6. PAGED ATTENTION ================= */
  {
    id:"paged_attention", group:"Techniques", title:"PagedAttention — KV Cache Like Virtual Memory",
    map:"PagedAttention",
    why:"This is vLLM's core innovation. By eliminating fragmentation it dramatically increases how many requests fit in memory, multiplying effective batch size and throughput.",
    render: () => (
      <div>
        <Lead>The classic way to store a request's KV cache is one contiguous block sized for the longest sequence the request <i>might</i> reach. Most requests never reach that length, so most of the reserved memory sits empty — internal and external fragmentation that can waste 60-80% of KV memory.</Lead>

        {subhead("The virtual-memory analogy")}
        <p style={{fontSize:14, lineHeight:1.7}}>PagedAttention borrows the operating-system idea of paging. KV cache is split into small fixed-size <b>pages</b> (blocks of a few tokens). Pages are allocated only as a sequence actually grows, and they need not be contiguous in physical memory — a per-request block table maps logical positions to physical pages, exactly like a page table.</p>

        <svg viewBox="0 0 720 220" style={{width:"100%", maxWidth:720, display:"block", margin:"14px auto"}}>
          <text x={20} y={24} fontSize={12} fontWeight="700" fill={C.ink}>Naive: contiguous reservation (mostly empty = wasted)</text>
          {[0,1,2].map(function(r){
            return (<g key={r}>
              <text x={18} y={56 + r*30} fontSize={10} fill={C.mut}>{"R"+(r+1)}</text>
              <rect x={40} y={40 + r*30} width={[70,40,55][r]} height={20} rx={3} fill={C.blueBg} stroke={C.blue}/>
              <rect x={40+[70,40,55][r]} y={40 + r*30} width={300-[70,40,55][r]} height={20} rx={3} fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="3 3"/>
            </g>);
          })}
          <text x={190} y={148} textAnchor="middle" fontSize={10} fill={C.red}>reserved-but-unused space → fragmentation</text>

          <text x={400} y={24} fontSize={12} fontWeight="700" fill={C.ink}>Paged: on-demand pages, packed tight</text>
          {[0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){
            var col = i % 4, row = Math.floor(i/4);
            var fills = [C.blueBg,C.blueBg,C.greenBg,C.amberBg, C.greenBg,C.amberBg,C.blueBg,C.greenBg, C.amberBg,C.blueBg,C.greenBg,C.amberBg];
            return (<rect key={i} x={400 + col*44} y={40 + row*30} width={38} height={22} rx={3} fill={fills[i]} stroke={C.line}/>);
          })}
          <text x={488} y={148} textAnchor="middle" fontSize={10} fill={C.green}>pages from many requests interleaved, ~zero waste</text>
          <text x={488} y={170} textAnchor="middle" fontSize={9} fill={C.mut}>colors = different requests, block table maps logical→physical</text>
        </svg>

        {info(<span><b>Effect:</b> near-zero KV fragmentation means far more sequences fit in the same VRAM, so effective batch size — and therefore throughput — goes up substantially with no model change. It also makes <b>prefix sharing</b> easy: shared pages can be referenced by multiple requests.</span>)}

        <p style={{fontSize:14, lineHeight:1.7}}>PagedAttention is the foundation vLLM was built on; the idea has since been adopted broadly across serving stacks.</p>
      </div>
    )
  },

  /* ================= 7. MORE TECHNIQUES ================= */
  {
    id:"techniques", group:"Techniques", title:"More Serving Optimizations",
    map:"Optimizations",
    why:"Production serving stacks compose many of these. Knowing what each solves lets you turn the right knobs for your workload.",
    render: () => (
      <div>
        <Lead>The big two (continuous batching, PagedAttention) get most of the headlines, but a deeper toolbox handles long prompts, shared prefixes, and per-step overhead.</Lead>

        {subhead("Speculative decoding")}
        <p style={{fontSize:14, lineHeight:1.7}}>A small, fast <b>draft</b> model proposes several tokens ahead; the big <b>target</b> model verifies them all in a single parallel pass and accepts the longest correct prefix. Because verification is parallel (compute-bound, cheap) while normal decode is serial (memory-bound), this can cut latency materially when the draft is accurate.</p>

        <svg viewBox="0 0 720 150" style={{width:"100%", maxWidth:720, display:"block", margin:"12px auto"}}>
          <rect x={20} y={50} width={150} height={50} rx={8} fill={C.amberBg} stroke={C.amber}/>
          <text x={95} y={72} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.ink}>Draft model</text>
          <text x={95} y={89} textAnchor="middle" fontSize={9} fill={C.mut}>proposes k tokens</text>
          {[0,1,2,3].map(function(i){return (<rect key={i} x={200 + i*40} y={58} width={32} height={34} rx={4} fill={C.amberBg} stroke={C.amber}/>);})}
          <text x={260} y={78} fontSize={9} fill={C.mut}>k guesses</text>
          <line x1={170} y1={75} x2={198} y2={75} stroke={C.line} strokeWidth={2} markerEnd="url(#ah7)"/>
          <line x1={372} y1={75} x2={400} y2={75} stroke={C.line} strokeWidth={2} markerEnd="url(#ah7)"/>
          <rect x={402} y={50} width={170} height={50} rx={8} fill={C.greenBg} stroke={C.green}/>
          <text x={487} y={72} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.ink}>Target model</text>
          <text x={487} y={89} textAnchor="middle" fontSize={9} fill={C.mut}>verifies all in parallel</text>
          <line x1={574} y1={75} x2={602} y2={75} stroke={C.line} strokeWidth={2} markerEnd="url(#ah7)"/>
          <rect x={604} y={55} width={96} height={40} rx={8} fill={C.blueBg} stroke={C.blue}/>
          <text x={652} y={72} textAnchor="middle" fontSize={10} fontWeight="700" fill={C.ink}>accept</text>
          <text x={652} y={87} textAnchor="middle" fontSize={9} fill={C.mut}>longest correct</text>
          <defs><marker id="ah7" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill={C.line}/></marker></defs>
        </svg>

        {tbl(<tbody>
          <tr>{th("Technique")}{th("Problem it solves")}{th("Effect")}</tr>
          <tr>{td("Chunked prefill")}{td("A long prompt's prefill stalls ongoing decode")}{td("Split prefill into chunks interleaved with decode steps; smoother TPOT")}</tr>
          <tr>{td("Prefix caching / RadixAttention")}{td("Recomputing KV for shared prompt prefixes")}{td("Reuse KV across requests sharing a prefix (system prompts, few-shot)")}</tr>
          <tr>{td("Speculative decoding")}{td("Serial decode is memory-bound and slow")}{td("Draft proposes, target verifies in parallel; lower latency")}</tr>
          <tr>{td("FlashAttention")}{td("Attention reads/writes too much HBM")}{td("IO-aware fused kernel; faster, less memory")}</tr>
          <tr>{td("CUDA graphs")}{td("Per-step kernel launch overhead dominates tiny decode steps")}{td("Capture & replay the step graph; removes launch overhead")}</tr>
          <tr>{td("Tensor parallelism")}{td("Model too big for one GPU")}{td("Shard layers across GPUs; enables serving large models")}</tr>
          <tr>{td("Quantization (FP8/INT8/INT4)")}{td("Weights + KV too large / too slow")}{td("Smaller, faster, more batch — see Quantization.html")}</tr>
        </tbody>)}

        {subhead("FlashAttention — the IO-aware attention kernel")}
        <p style={{fontSize:14, lineHeight:1.7}}>Standard attention computes the full <code>N×N</code> score matrix and writes it to GPU HBM (high-bandwidth memory), then reads it back for the softmax and the value multiply. For long sequences that matrix is enormous, and attention becomes <b>memory-bandwidth bound</b> — the GPU spends its time moving data, not computing.</p>
        <p style={{fontSize:14, lineHeight:1.7}}><b>FlashAttention</b> fixes this by never materializing the full matrix. It <b>tiles</b> the computation into blocks that fit in fast on-chip SRAM, and uses an <b>online softmax</b> (running max + running sum) to combine blocks correctly without ever storing all the scores. Results:</p>
        <ul style={{fontSize:14, lineHeight:1.8, marginTop:4}}>
          <li><b>Memory: O(N) instead of O(N²)</b> — the score matrix is never stored, only small block statistics.</li>
          <li><b>Speed:</b> far fewer HBM reads/writes (the real bottleneck), so 2–4× faster attention in practice.</li>
          <li><b>Longer context</b> becomes feasible at the same memory budget.</li>
          <li>In the backward pass it <b>recomputes</b> attention blocks on the fly instead of storing them — trading a little compute for a large memory saving.</li>
        </ul>
        <p style={{fontSize:14, lineHeight:1.7}}>It is a drop-in, numerically-equivalent replacement for the attention kernel (now FlashAttention-2 / 3) and is on by default in vLLM, TGI, and TensorRT-LLM — for both prefill and decode.</p>

        <div style={{overflowX:"auto"}}>
        <svg viewBox="0 0 720 185" style={{width:"100%", maxWidth:720, display:"block", margin:"12px auto"}}>
          <defs><marker id="ahfa" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill={C.line}/></marker></defs>
          <text x={218} y={18} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.mut}>Standard attention</text>
          <rect x={40} y={32} width={86} height={40} rx={6} fill={C.blueBg} stroke={C.blue}/>
          <text x={83} y={56} textAnchor="middle" fontSize={10} fill={C.ink}>Q · Kᵀ</text>
          <line x1={126} y1={52} x2={152} y2={52} stroke={C.line} strokeWidth={2} markerEnd="url(#ahfa)"/>
          <rect x={154} y={28} width={128} height={48} rx={6} fill="#fdecec" stroke="#dc2626"/>
          <text x={218} y={48} textAnchor="middle" fontSize={10} fontWeight="700" fill={C.ink}>N×N matrix</text>
          <text x={218} y={64} textAnchor="middle" fontSize={9} fill={C.mut}>written to HBM</text>
          <line x1={282} y1={52} x2={308} y2={52} stroke={C.line} strokeWidth={2} markerEnd="url(#ahfa)"/>
          <rect x={310} y={32} width={96} height={40} rx={6} fill={C.blueBg} stroke={C.blue}/>
          <text x={358} y={56} textAnchor="middle" fontSize={10} fill={C.ink}>softmax · V</text>
          <text x={218} y={90} textAnchor="middle" fontSize={9} fill="#dc2626">O(N²) memory · heavy HBM traffic</text>
          <text x={218} y={120} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.mut}>FlashAttention</text>
          <rect x={40} y={134} width={366} height={40} rx={6} fill={C.greenBg} stroke={C.green}/>
          <text x={223} y={152} textAnchor="middle" fontSize={10} fontWeight="700" fill={C.ink}>tiled blocks in on-chip SRAM + online softmax</text>
          <text x={223} y={167} textAnchor="middle" fontSize={9} fill={C.green}>full matrix never stored — O(N) memory</text>
          <text x={575} y={150} textAnchor="middle" fontSize={10} fill={C.mut}>same result,</text>
          <text x={575} y={166} textAnchor="middle" fontSize={10} fill={C.mut}>2–4× faster, less memory</text>
        </svg>
        </div>

        {info(<span>For the full quantization story (AWQ, GPTQ, FP8, accuracy tradeoffs) see <a href="Quantization.html">Quantization</a>. Most production stacks combine continuous batching + PagedAttention + FlashAttention + CUDA graphs + quantization out of the box.</span>)}
      </div>
    )
  },

  /* ================= 8. LLM FRAMEWORKS ================= */
  {
    id:"frameworks_llm", group:"Frameworks", title:"LLM Inference Frameworks",
    map:"Frameworks",
    why:"Picking the right engine is the highest-leverage serving decision. Match the framework to your hardware, workload, and flexibility needs.",
    render: () => (
      <div>
        <Lead>You rarely write a serving engine yourself. You pick one. Here is the landscape and what each is for.</Lead>

        {tbl(<tbody>
          <tr>{th("Framework")}{th("By")}{th("Key feature")}{th("Best for")}</tr>
          <tr>{td("vLLM")}{td("vLLM project")}{td("PagedAttention + continuous batching; V1 engine adds chunked prefill, prefix cache, CUDA graphs, spec decode, FP8/INT4")}{td("Default for flexible, high-throughput GPU serving (200+ archs)")}</tr>
          <tr>{td("TensorRT-LLM")}{td("NVIDIA")}{td("Ahead-of-time compiles models into optimized engines")}{td("Max perf on NVIDIA for stable, high-volume, latency-critical deploys")}</tr>
          <tr>{td("TGI")}{td("Hugging Face")}{td("Rust/Python server; continuous batching, FlashAttention, PagedAttention, quant")}{td("Production serving with tight HF ecosystem integration")}</tr>
          <tr>{td("SGLang")}{td("SGLang project")}{td("RadixAttention — radix-tree prefix KV reuse")}{td("Shared-prefix & structured generation; often beats vLLM there")}</tr>
          <tr>{td("LMDeploy / TurboMind")}{td("InternLM")}{td("High-perf C++ engine, FP8 MoE, PD disaggregation")}{td("High-throughput Chinese-ecosystem & MoE serving")}</tr>
          <tr>{td("llama.cpp / Ollama")}{td("community / Ollama")}{td("C/C++ using GGUF format")}{td("CPU, edge, Apple Silicon, consumer GPU, easy local")}</tr>
          <tr>{td("DeepSpeed-Inference / MII")}{td("Microsoft")}{td("Tensor parallelism, kernel injection")}{td("DeepSpeed-based stacks (less dominant in 2025)")}</tr>
        </tbody>)}

        {subhead("vLLM — the default")}
        <p style={{fontSize:14, lineHeight:1.7}}>The pragmatic starting point for most GPU serving. Broad model coverage, an OpenAI-compatible server, and the full modern toolbox via its V1 engine. If you do not have a specific reason to choose otherwise, start here.</p>

        {subhead("TensorRT-LLM — compiled max performance")}
        <p style={{fontSize:14, lineHeight:1.7}}>Compiles a model into a hardware-specific engine ahead of time, extracting peak throughput and lowest latency on NVIDIA GPUs. The cost is a long compile step (tens of minutes) and less flexibility — best when the model and config are stable and volume is huge.</p>

        {subhead("SGLang — RadixAttention")}
        <p style={{fontSize:14, lineHeight:1.7}}>Organizes the KV cache as a radix tree so any requests sharing a prefix (system prompts, few-shot examples, multi-turn history) reuse cached KV automatically. Excellent for workloads with heavy prefix sharing or structured/constrained generation.</p>

        {subhead("llama.cpp — what it is and why it exists")}
        <p style={{fontSize:14, lineHeight:1.7}}><b>llama.cpp</b> is a from-scratch LLM inference engine written in plain C/C++ (the ggml/GGUF stack) with <b>no Python, no CUDA requirement, and no heavy dependencies</b>. The big GPU servers above (vLLM, TGI, TensorRT-LLM) assume a datacenter NVIDIA GPU and lots of VRAM. llama.cpp was built for the opposite world: <b>run a model on the hardware you already own</b> — a laptop CPU, an Apple-Silicon Mac, a Raspberry Pi, or a single consumer GPU.</p>
        <p style={{fontSize:14, lineHeight:1.7}}>It does this with the <b>GGUF</b> file format (a single self-contained quantized model file) and aggressive CPU/GPU quantization (4-bit, 5-bit, 6-bit &quot;k-quants&quot;, plus partial GPU offload). You can keep some layers on the GPU and the rest on the CPU, so a model that does not fit in VRAM still runs.</p>

        {subhead("Why you need it (the gap it fills)")}
        <ul style={{fontSize:14, lineHeight:1.8, marginTop:4}}>
          <li><b>No datacenter GPU?</b> It runs on CPU / Mac / consumer cards where vLLM & TensorRT-LLM cannot.</li>
          <li><b>Privacy / offline:</b> everything stays on-device — no data leaves the machine.</li>
          <li><b>Zero infra:</b> one binary + one GGUF file, no server cluster, no Python env.</li>
          <li><b>Cost:</b> no cloud GPU bill for local dev, prototyping, or personal use.</li>
        </ul>

        {subhead("Alternatives — the local / edge inference family")}
        {tbl(<tbody>
          <tr>{th("Tool")}{th("Built on")}{th("What it adds")}{th("Best for")}</tr>
          <tr>{td("llama.cpp")}{td("ggml / GGUF (C/C++)")}{td("The core engine; CPU+GPU, k-quants, huge platform support")}{td("Maximum portability & control")}</tr>
          <tr>{td("Ollama")}{td("llama.cpp")}{td("One-command model pulls, model library, local REST API, Modelfiles")}{td("Easiest local run / dev")}</tr>
          <tr>{td("LM Studio")}{td("llama.cpp")}{td("Polished desktop GUI + local server")}{td("Non-technical users, GUI")}</tr>
          <tr>{td("GPT4All")}{td("llama.cpp")}{td("Desktop app + local docs / RAG")}{td("Offline chat over your files")}</tr>
          <tr>{td("MLX / mlx-lm")}{td("Apple MLX")}{td("Native Apple-Silicon GPU (Metal) performance")}{td("Best speed on Macs")}</tr>
          <tr>{td("ExLlamaV2")}{td("CUDA")}{td("Fast EXL2-quant inference on consumer NVIDIA")}{td("Single-GPU enthusiast rigs")}</tr>
        </tbody>)}
        <p style={{fontSize:13, lineHeight:1.6, color:C.mut}}>Most of these are wrappers around llama.cpp — Ollama, LM Studio and GPT4All all use it under the hood; MLX and ExLlamaV2 are independent engines for Apple and NVIDIA respectively.</p>

        {subhead("Pros, cons & when to use")}
        {tbl(<tbody>
          <tr>{th("")}{th("llama.cpp / Ollama (local)")}{th("vLLM / TensorRT-LLM (server)")}</tr>
          <tr>{td(<b>Hardware</b>)}{td("CPU, Mac, consumer GPU, edge")}{td("Datacenter NVIDIA GPUs")}</tr>
          <tr>{td(<b>Concurrency</b>)}{td("Low — a few users at a time")}{td("High — continuous batching, hundreds of streams")}</tr>
          <tr>{td(<b>Throughput</b>)}{td("Modest (no paged/continuous batching at scale)")}{td("Very high")}</tr>
          <tr>{td(<b>Setup</b>)}{td("Trivial — one binary + GGUF")}{td("Heavier — GPU drivers, server, config")}</tr>
          <tr>{td(<b>Privacy</b>)}{td("Fully on-device / offline")}{td("Usually server / cloud")}</tr>
          <tr>{td(<b>Use when</b>)}{td("Local dev, edge, privacy, personal apps, no GPU budget")}{td("Production APIs serving many concurrent users")}</tr>
        </tbody>)}
        {info(<span><b>Rule of thumb:</b> use <b>llama.cpp / Ollama</b> for anything local, offline, edge, or single-user — and a GPU server (<b>vLLM</b> etc.) the moment you need to serve many concurrent users at low latency. They are complementary, not competitors.</span>)}
      </div>
    )
  },

  /* ================= 9. TRITON / ONNX ================= */
  {
    id:"triton_onnx", group:"Frameworks", title:"Triton, TensorRT, ONNX — Untangling the Stack",
    map:"Triton & ONNX",
    why:"Architecture decisions go wrong when teams conflate a model format with a runtime, or a multi-framework server with a single optimization library.",
    render: () => (
      <div>
        <Lead>Triton, TensorRT, TensorRT-LLM, ONNX, ONNX Runtime, NIM — six names, six different things. Sorting them by <i>category</i> dissolves the confusion.</Lead>

        {tbl(<tbody>
          <tr>{th("Name")}{th("Category")}{th("What it actually is")}</tr>
          <tr>{td("ONNX")}{td("Format")}{td("Open interchange format — a portable spec for a model's compute graph")}</tr>
          <tr>{td("ONNX Runtime")}{td("Engine")}{td("Cross-platform inference engine that runs ONNX models on CPU/GPU/accelerators (has a TensorRT execution provider)")}</tr>
          <tr>{td("TensorRT")}{td("Compiler + runtime")}{td("General deep-learning compiler/runtime that optimizes models for NVIDIA GPUs")}</tr>
          <tr>{td("TensorRT-LLM")}{td("Library")}{td("LLM-specific library built on top of TensorRT (KV cache, in-flight batching, etc.)")}</tr>
          <tr>{td("Triton Inference Server")}{td("Server")}{td("Multi-framework model server (HTTP/gRPC, dynamic batching, ensembles, concurrent models) that runs backends")}</tr>
          <tr>{td("NVIDIA NIM")}{td("Container")}{td("Prebuilt microservice bundling Triton + TensorRT-LLM for turnkey serving")}</tr>
        </tbody>)}

        {subhead("Triton is the server; backends do the work")}
        <p style={{fontSize:14, lineHeight:1.7}}>Triton Inference Server is the outer process that handles networking, batching, scheduling, and serving many models concurrently. The actual model execution is delegated to a pluggable <b>backend</b>: PyTorch, TensorFlow, ONNX Runtime, OpenVINO, TensorRT, or TensorRT-LLM. So "Triton vs TensorRT-LLM" is a category error — TensorRT-LLM is one backend Triton can run.</p>

        <svg viewBox="0 0 720 230" style={{width:"100%", maxWidth:720, display:"block", margin:"14px auto"}}>
          <rect x={30} y={20} width={660} height={190} rx={14} fill={C.slateBg} stroke={C.slate} strokeWidth={2}/>
          <text x={50} y={45} fontSize={13} fontWeight="700" fill={C.ink}>Triton Inference Server</text>
          <text x={50} y={62} fontSize={10} fill={C.mut}>HTTP/gRPC · dynamic batching · ensembles · concurrent models</text>

          {[
            ["PyTorch", C.amberBg, C.amber],
            ["ONNX Runtime", C.blueBg, C.blue],
            ["TensorRT", C.greenBg, C.green],
            ["TensorRT-LLM", C.purpleBg, C.purple]
          ].map(function(b,i){
            return (<g key={i}>
              <rect x={55 + i*160} y={90} width={140} height={90} rx={10} fill={b[1]} stroke={b[2]}/>
              <text x={125 + i*160} y={128} textAnchor="middle" fontSize={12} fontWeight="700" fill={C.ink}>{b[0]}</text>
              <text x={125 + i*160} y={148} textAnchor="middle" fontSize={9} fill={C.mut}>backend</text>
            </g>);
          })}
          <text x={360} y={202} textAnchor="middle" fontSize={10} fill={C.mut}>one server, many pluggable execution backends</text>
        </svg>

        {info(<span><b>Rule of thumb:</b> a <i>format</i> describes a model (ONNX); an <i>engine</i> runs a model (ONNX Runtime, TensorRT); a <i>library</i> adds LLM features (TensorRT-LLM); a <i>server</i> exposes models over the network and manages them (Triton); a <i>container</i> packages it all (NIM).</span>)}
      </div>
    )
  },

  /* ================= 10. EMBEDDING SERVING ================= */
  {
    id:"embedding_serving", group:"Frameworks", title:"Serving Embedding Models",
    map:"Embedding Serving",
    why:"Real systems like RAG run BOTH an embedding server (retrieval) and an LLM server (generation). They have opposite performance profiles and need different serving choices.",
    render: () => (
      <div>
        <Lead>An embedding model turns text into a single fixed-size vector. There is no token-by-token generation: one forward pass produces the whole output. That changes everything about how you serve it.</Lead>

        {subhead("Why it is simpler — and different")}
        <p style={{fontSize:14, lineHeight:1.7}}>No autoregression means no KV cache, no decode loop, and no TTFT/TPOT to worry about. Every request is one compute-bound forward pass, and many of them batch beautifully. The whole game is <b>throughput</b>: requests per second and tokens per second.</p>

        {tbl(<tbody>
          <tr>{th("")}{th("LLM serving")}{th("Embedding serving")}</tr>
          <tr>{td("Autoregressive?")}{td("Yes — token by token")}{td("No — single forward pass")}</tr>
          <tr>{td("KV cache?")}{td("Yes (the central constraint)")}{td("None")}</tr>
          <tr>{td("Two phases?")}{td("Prefill + decode")}{td("Just one pass")}</tr>
          <tr>{td("Bottleneck")}{td("Memory bandwidth (decode)")}{td("Compute")}</tr>
          <tr>{td("Key metric")}{td("TTFT, TPOT, goodput")}{td("Throughput (req/s, tok/s)")}</tr>
          <tr>{td("Optimize for")}{td("Latency-throughput balance")}{td("Pure throughput / batch size")}</tr>
        </tbody>)}

        {subhead("Frameworks")}
        <p style={{fontSize:14, lineHeight:1.7}}><b>HF TEI (Text Embeddings Inference)</b> — a Rust server with FlashAttention and token-based dynamic batching, throughput-oriented (450+ req/s). <b>ONNX Runtime</b> — portable, fast cross-platform inference. <b>sentence-transformers</b> — the common library for building and batching embeddings, great for offline and smaller-scale online use.</p>

        {info(<span>When you build <a href="Production-Safety.html">a RAG system</a>, you run two serving stacks side by side: an <a href="Embedding-Models.html">embedding server</a> for retrieval (throughput-optimized, no KV cache) and an LLM server for generation (latency-balanced, KV-cache-bound). Sizing and scaling them is a separate exercise for each.</span>)}
      </div>
    )
  },

  /* ================= 11. REQUEST FLOW ================= */
  {
    id:"request_flow", group:"Architecture", title:"Anatomy of a Request",
    map:"Request Flow",
    why:"Knowing every hop tells you where latency accrues, where to measure TTFT and TPOT, and where to put autoscaling and caching.",
    render: () => (
      <div>
        <Lead>Here is the end-to-end path of a single chat request through a production serving stack, with the points where the two key latency metrics are measured.</Lead>

        <svg viewBox="0 0 860 420" style={{width:"100%", maxWidth:860, display:"block", margin:"14px auto"}}>
          <defs><marker id="ahF" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill={C.line}/></marker></defs>

          <rect x={20} y={30} width={120} height={56} rx={10} fill={C.blueBg} stroke={C.blue}/>
          <text x={80} y={54} textAnchor="middle" fontSize={12} fontWeight="700" fill={C.ink}>Client</text>
          <text x={80} y={71} textAnchor="middle" fontSize={9} fill={C.mut}>sends prompt</text>

          <rect x={180} y={30} width={130} height={56} rx={10} fill={C.slateBg} stroke={C.slate}/>
          <text x={245} y={54} textAnchor="middle" fontSize={12} fontWeight="700" fill={C.ink}>Load Balancer</text>
          <text x={245} y={71} textAnchor="middle" fontSize={9} fill={C.mut}>routes to a replica</text>

          <rect x={350} y={30} width={150} height={56} rx={10} fill={C.slateBg} stroke={C.slate}/>
          <text x={425} y={51} textAnchor="middle" fontSize={12} fontWeight="700" fill={C.ink}>API Gateway</text>
          <text x={425} y={68} textAnchor="middle" fontSize={9} fill={C.mut}>auth · rate-limit</text>

          <rect x={540} y={30} width={150} height={56} rx={10} fill={C.amberBg} stroke={C.amber}/>
          <text x={615} y={51} textAnchor="middle" fontSize={12} fontWeight="700" fill={C.ink}>Queue / Scheduler</text>
          <text x={615} y={68} textAnchor="middle" fontSize={9} fill={C.mut}>queue wait time</text>

          <line x1={140} y1={58} x2={178} y2={58} stroke={C.line} strokeWidth={2} markerEnd="url(#ahF)"/>
          <line x1={310} y1={58} x2={348} y2={58} stroke={C.line} strokeWidth={2} markerEnd="url(#ahF)"/>
          <line x1={500} y1={58} x2={538} y2={58} stroke={C.line} strokeWidth={2} markerEnd="url(#ahF)"/>

          {/* engine box */}
          <rect x={120} y={140} width={620} height={170} rx={14} fill="#fbfbfd" stroke={C.purple} strokeWidth={2}/>
          <text x={140} y={165} fontSize={13} fontWeight="700" fill={C.purple}>Inference Engine (continuous batching)</text>

          <rect x={150} y={185} width={150} height={70} rx={10} fill={C.blueBg} stroke={C.blue}/>
          <text x={225} y={213} textAnchor="middle" fontSize={12} fontWeight="700" fill={C.ink}>Prefill</text>
          <text x={225} y={230} textAnchor="middle" fontSize={9} fill={C.mut}>prompt → first token</text>
          <text x={225} y={244} textAnchor="middle" fontSize={9} fill={C.blue}>compute-bound</text>

          <rect x={340} y={185} width={180} height={70} rx={10} fill={C.greenBg} stroke={C.green}/>
          <text x={430} y={209} textAnchor="middle" fontSize={12} fontWeight="700" fill={C.ink}>Decode loop</text>
          <text x={430} y={226} textAnchor="middle" fontSize={9} fill={C.mut}>one token / step</text>
          <text x={430} y={240} textAnchor="middle" fontSize={9} fill={C.green}>memory-bound</text>

          <rect x={560} y={185} width={150} height={70} rx={10} fill={C.purpleBg} stroke={C.purple}/>
          <text x={635} y={209} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.ink}>KV cache</text>
          <text x={635} y={226} textAnchor="middle" fontSize={9} fill={C.mut}>PagedAttention</text>
          <text x={635} y={240} textAnchor="middle" fontSize={9} fill={C.mut}>shared / paged</text>

          <line x1={300} y1={220} x2={338} y2={220} stroke={C.line} strokeWidth={2} markerEnd="url(#ahF)"/>
          <line x1={520} y1={220} x2={558} y2={220} stroke={C.line} strokeWidth={2} markerEnd="url(#ahF)"/>
          <path d="M430 255 L430 282 L300 282" fill="none" stroke={C.green} strokeWidth={2} strokeDasharray="5 4"/>
          <text x={300} y={300} textAnchor="middle" fontSize={9} fill={C.green}>loop until EOS</text>

          <line x1={615} y1={86} x2={430} y2={138} stroke={C.line} strokeWidth={2} markerEnd="url(#ahF)"/>

          {/* response */}
          <rect x={300} y={350} width={260} height={56} rx={10} fill={C.amberBg} stroke={C.amber}/>
          <text x={430} y={374} textAnchor="middle" fontSize={12} fontWeight="700" fill={C.ink}>Response (SSE token stream)</text>
          <text x={430} y={391} textAnchor="middle" fontSize={9} fill={C.mut}>tokens streamed back to client as generated</text>
          <line x1={430} y1={310} x2={430} y2={348} stroke={C.line} strokeWidth={2} markerEnd="url(#ahF)"/>

          {/* metric callouts */}
          <text x={225} y={332} textAnchor="middle" fontSize={10} fill={C.blue} fontWeight="700">↑ TTFT measured here</text>
          <text x={430} y={155} textAnchor="middle" fontSize={10} fill={C.green} fontWeight="700">TPOT = gap between streamed tokens</text>
        </svg>

        {subhead("Walking the hops")}
        <p style={{fontSize:14, lineHeight:1.7}}>
          <b>1. Client → Load Balancer:</b> the request hits an LB that spreads load (ideally KV-aware) across model replicas.<br/>
          <b>2. API Gateway:</b> authenticates, applies rate limits and quotas, and shapes the request.<br/>
          <b>3. Queue / Scheduler:</b> the request waits for a slot; <i>queue wait time</i> is a real, measurable latency source under load.<br/>
          <b>4. Inference Engine:</b> the scheduler admits it into the continuous batch. <b>Prefill</b> runs the prompt and emits the first token (this defines TTFT). The <b>decode loop</b> then emits one token per step, reading/writing the <b>KV cache</b> (PagedAttention). Each token is streamed out immediately; the gap between streamed tokens is TPOT.<br/>
          <b>5. Response:</b> tokens flow back over a streaming channel (e.g. server-sent events) so the user sees output as it is generated.
        </p>
      </div>
    )
  },

  /* ================= 12. METRICS ================= */
  {
    id:"metrics", group:"Operations", title:"Production Metrics That Matter",
    map:"Metrics",
    why:"You cannot improve what you do not measure, and optimizing the wrong metric (mean latency, raw throughput) leads to systems that look good on paper and fail real users.",
    render: () => (
      <div>
        <Lead>Serving has its own vocabulary of metrics. Get them right and the latency-throughput tradeoff becomes a dial you can tune deliberately.</Lead>

        {tbl(<tbody>
          <tr>{th("Metric")}{th("Definition")}{th("How measured")}{th("Typical target")}</tr>
          <tr>{td("TTFT")}{td("Time to first token")}{td("Request arrival → first token emitted (prefill + queue)")}{td("~200-500 ms for chat")}</tr>
          <tr>{td("TPOT / ITL")}{td("Time per output token / inter-token latency")}{td("Average gap between consecutive output tokens")}{td("~50-100 ms for chat")}</tr>
          <tr>{td("Throughput")}{td("Work per unit time")}{td("Output tokens/sec; requests/sec across the system")}{td("Maximize within SLO")}</tr>
          <tr>{td("Goodput")}{td("Requests/sec that MEET the SLO")}{td("Count only requests satisfying TTFT+TPOT targets")}{td("The metric that matters")}</tr>
          <tr>{td("p50 / p90 / p99")}{td("Latency percentiles")}{td("Sort latencies; report tails, not just mean")}{td("Watch p99 — tails define UX")}</tr>
          <tr>{td("GPU utilization")}{td("How busy the accelerators are")}{td("GPU compute/memory busy %")}{td("High, but not the whole story")}</tr>
          <tr>{td("KV-cache utilization")}{td("Fraction of KV memory in use")}{td("Used pages / total pages")}{td("High but with headroom (avoid OOM/eviction)")}</tr>
          <tr>{td("Queue wait time")}{td("Time spent waiting for a slot")}{td("Admission timestamp − arrival timestamp")}{td("Low; rising = need to scale")}</tr>
        </tbody>)}

        <svg viewBox="0 0 720 170" style={{width:"100%", maxWidth:720, display:"block", margin:"14px auto"}}>
          <text x={20} y={26} fontSize={12} fontWeight="700" fill={C.ink}>Single request timeline</text>
          <line x1={30} y1={90} x2={700} y2={90} stroke={C.line} strokeWidth={1.5} markerEnd="url(#ahM)"/>
          <circle cx={40} cy={90} r={5} fill={C.blue}/>
          <text x={40} y={120} textAnchor="middle" fontSize={9} fill={C.mut}>arrive</text>

          <line x1={40} y1={90} x2={210} y2={90} stroke={C.blue} strokeWidth={6} opacity={0.4}/>
          <text x={125} y={75} textAnchor="middle" fontSize={10} fill={C.blue} fontWeight="700">TTFT</text>
          <circle cx={210} cy={90} r={5} fill={C.green}/>
          <text x={210} y={120} textAnchor="middle" fontSize={9} fill={C.mut}>1st token</text>

          {[0,1,2,3,4,5].map(function(i){
            return (<g key={i}><circle cx={290 + i*70} cy={90} r={4} fill={C.green}/></g>);
          })}
          <line x1={290} y1={90} x2={360} y2={90} stroke={C.green} strokeWidth={5} opacity={0.4}/>
          <text x={325} y={75} textAnchor="middle" fontSize={10} fill={C.green} fontWeight="700">TPOT</text>
          <text x={500} y={120} textAnchor="middle" fontSize={9} fill={C.mut}>subsequent tokens streamed at TPOT intervals</text>
          <defs><marker id="ahM" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill={C.line}/></marker></defs>
        </svg>

        {info(<span><b>The tradeoff, stated plainly:</b> larger batches raise throughput (and GPU efficiency) but increase TTFT and TPOT. Smaller batches do the opposite. Tune the batch / scheduling policy to maximize <b>goodput</b> — the requests that actually meet your SLO — and always watch <b>p99</b>, because a great mean with a terrible tail is a bad service.</span>)}
      </div>
    )
  },

  /* ================= 13. INFRA / K8S ================= */
  {
    id:"infra_k8s", group:"Operations", title:"Scaling on Kubernetes",
    map:"Kubernetes",
    why:"A fast engine on one GPU is a demo. Meeting SLOs under bursty real traffic requires the surrounding platform: autoscaling, scheduling, and modern disaggregated architectures.",
    render: () => (
      <div>
        <Lead>Serving at scale is a Kubernetes story. The engine handles one node well; the platform handles fleets of them under changing load.</Lead>

        {subhead("Platforms & primitives")}
        <p style={{fontSize:14, lineHeight:1.7}}>
          <b>Serving platforms:</b> KServe, Ray Serve (Serve LLM), NVIDIA NIM and NVIDIA Dynamo (built for disaggregation), the vLLM production-stack, and llm-d.<br/>
          <b>Autoscaling:</b> HPA / KEDA reacting to GPU utilization, queue depth, or token-rate metrics.<br/>
          <b>GPU scheduling:</b> bin-packing pods onto GPUs; <b>MIG</b> partitions one GPU into isolated instances for small models.<br/>
          <b>Routing:</b> KV-aware load balancing sends a request to a replica that already holds its prefix.<br/>
          <b>Rollouts:</b> canary and rolling deploys to ship new weights/engines safely.
        </p>

        {subhead("The 2025 trend: disaggregated prefill/decode")}
        <p style={{fontSize:14, lineHeight:1.7}}>Because prefill is compute-bound and decode is memory-bound, running them together makes them interfere. <b>Disaggregation</b> (DistServe, Splitwise, Mooncake) runs prefill and decode on <i>separate</i> GPU pools and transfers the KV cache over the network between them. Each pool scales independently and stops stealing resources from the other — raising goodput. It is built into vLLM, SGLang, NVIDIA Dynamo, and llm-d.</p>

        <svg viewBox="0 0 820 320" style={{width:"100%", maxWidth:820, display:"block", margin:"14px auto"}}>
          <defs><marker id="ahK" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill={C.line}/></marker></defs>
          <rect x={20} y={20} width={400} height={280} rx={14} fill="#fbfbfd" stroke={C.slate} strokeWidth={2}/>
          <text x={40} y={45} fontSize={13} fontWeight="700" fill={C.ink}>K8s cluster — autoscaling replica pool</text>

          <rect x={150} y={60} width={140} height={44} rx={10} fill={C.amberBg} stroke={C.amber}/>
          <text x={220} y={86} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.ink}>Router / LB</text>

          {[0,1,2].map(function(i){
            return (<g key={i}>
              <rect x={45 + i*125} y={140} width={110} height={60} rx={10} fill={C.greenBg} stroke={C.green}/>
              <text x={100 + i*125} y={166} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.ink}>{"Pod "+(i+1)}</text>
              <text x={100 + i*125} y={183} textAnchor="middle" fontSize={9} fill={C.mut}>model replica</text>
              <line x1={220} y1={104} x2={100 + i*125} y2={138} stroke={C.line} strokeWidth={1.5} markerEnd="url(#ahK)"/>
            </g>);
          })}
          <rect x={45} y={225} width={335} height={50} rx={10} fill={C.blueBg} stroke={C.blue}/>
          <text x={212} y={248} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.ink}>HPA / KEDA autoscaler</text>
          <text x={212} y={264} textAnchor="middle" fontSize={9} fill={C.mut}>scales pods on GPU util / queue depth</text>

          {/* inset: disaggregation */}
          <rect x={445} y={60} width={350} height={200} rx={14} fill="#fbfbfd" stroke={C.purple} strokeWidth={2}/>
          <text x={465} y={84} fontSize={12} fontWeight="700" fill={C.purple}>Disaggregated prefill / decode</text>

          <rect x={470} y={105} width={130} height={70} rx={10} fill={C.blueBg} stroke={C.blue}/>
          <text x={535} y={132} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.ink}>Prefill pool</text>
          <text x={535} y={149} textAnchor="middle" fontSize={9} fill={C.mut}>compute-heavy GPUs</text>

          <rect x={645} y={105} width={130} height={70} rx={10} fill={C.greenBg} stroke={C.green}/>
          <text x={710} y={132} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.ink}>Decode pool</text>
          <text x={710} y={149} textAnchor="middle" fontSize={9} fill={C.mut}>bandwidth-heavy GPUs</text>

          <line x1={600} y1={140} x2={643} y2={140} stroke={C.purple} strokeWidth={2.5} markerEnd="url(#ahK)"/>
          <text x={622} y={195} textAnchor="middle" fontSize={9} fill={C.purple} fontWeight="700">KV transfer</text>
          <text x={622} y={210} textAnchor="middle" fontSize={9} fill={C.purple}>over network</text>
          <text x={620} y={244} textAnchor="middle" fontSize={9} fill={C.mut}>each pool scales independently → higher goodput</text>
        </svg>

        {info(<span>Disaggregation, KV-aware routing, and MIG partitioning are the levers that turn a single-GPU engine into a cost-efficient fleet. Start simple (one autoscaled vLLM pool) and add disaggregation when mixed prefill/decode traffic causes interference.</span>)}
      </div>
    )
  },

  /* ================= 14. PITFALLS ================= */
  {
    id:"pitfalls", group:"Strategy", title:"Common Mistakes & How to Avoid Them",
    map:"Pitfalls",
    why:"Knowing the failure modes in advance is cheaper than discovering them in a 3 a.m. page. Here is the checklist and a sane default to start from.",
    render: () => (
      <div>
        <Lead>After the techniques and architecture, here is the practical anti-pattern list — the mistakes that take serving systems down or make them needlessly expensive.</Lead>

        {tbl(<tbody>
          <tr>{th("Pitfall")}{th("Consequence")}{th("Fix")}</tr>
          <tr>{td("Underestimating KV cache")}{td("OOM crashes at long context / high concurrency")}{td("Size KV explicitly for max context x batch; reserve headroom")}</tr>
          <tr>{td("Mis-sized max-num-seqs / batch")}{td("Either idle GPUs or blown latency SLOs")}{td("Tune batch to maximize goodput, not raw throughput")}</tr>
          <tr>{td("Optimizing mean, ignoring p99")}{td("Looks fine on dashboards; users hit ugly tails")}{td("Track and alert on p90/p99 latency")}</tr>
          <tr>{td("No autoscaling / slow cold starts")}{td("Bursts overload; new pods come up too late")}{td("HPA/KEDA + warm pools + fast weight loading")}</tr>
          <tr>{td("Skipping quantization")}{td("Fewer requests fit; higher cost per token")}{td("Use FP8/INT8/AWQ where accuracy allows")}</tr>
          <tr>{td("Over-provisioning GPUs")}{td("Burning money on idle accelerators")}{td("Right-size with goodput-based autoscaling")}</tr>
          <tr>{td("Wrong parallelism for model size")}{td("Either won't fit or wastes interconnect")}{td("Match tensor/pipeline parallelism to model + hardware")}</tr>
          <tr>{td("Not separating prefill/decode")}{td("Long prompts stall decode; goodput drops")}{td("Chunked prefill, or disaggregation under mixed traffic")}</tr>
        </tbody>)}

        {info(<span><b>A sane default starting point:</b> run <b>vLLM</b> with <b>continuous batching</b> on by default, apply <b>FP8 or AWQ quantization</b> where accuracy allows, put it behind <b>autoscaling tied to goodput</b> (not raw GPU util), and <b>watch p99</b> from day one. Add prefix caching, chunked prefill, and disaggregation as your traffic patterns demand. Optimize toward the metric that pays the bills — requests that meet the SLO.</span>)}

        <Note>From here, the natural next steps are <a href="Quantization.html">Quantization</a> for squeezing models smaller and faster, and <a href="Production-Safety.html">Production & Safety</a> for the reliability, monitoring, and guardrails around a live service.</Note>
      </div>
    )
  }

  ];

  window.ML_META = {
    title: "LLM Inference & Serving",
    subtitle: "Serving models in production — vLLM, TensorRT-LLM, Triton, batching, and scale",
    cur: "Inference",
    category: "LLM Training",
    run: () => ({}), default: {}, renderInput: null,
    modeLinks: [
      { label: "Pre-Training",  href: "LLM-PreTraining.html",        active: false },
      { label: "Distributed",   href: "Distributed-Training.html",   active: false },
      { label: "Quantization",  href: "Quantization.html",           active: false },
      { label: "MoE",           href: "Mixture-of-Experts.html",     active: false },
      { label: "Post-Training", href: "Post-Training.html",          active: false },
      { label: "Distillation",  href: "Knowledge-Distillation.html", active: false },
      { label: "Embeddings",    href: "Embedding-Models.html",       active: false },
      { label: "Reasoning",     href: "Reasoning-Models.html",       active: false },
      { label: "Inference",     href: "Inference-Serving.html",      active: true  },
      { label: "Production",    href: "Production-Safety.html",       active: false },
    ]
  };
  window.ML_STAGES = STAGES;
})();
