/* ============================================================
   Distributed Training — stages-distributed.jsx (13 stages)
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

  const STAGES = [

    /* ── STAGE 1 ── Overview ───────────────────────────────────────────────── */
    {
      id: "overview",
      group: "Overview",
      title: "Why Distributed Training?",
      map: "Overview",
      why: "A single H100 has 80 GB of memory. A 70B model needs over 1 TB for optimizer states alone. This is why distributed training exists.",
      render: () => (
        <>
          <Lead>
            Modern LLMs are too large for any single GPU. A 70B-parameter model trained with
            the Adam optimizer requires over <b>1.12 TB</b> of memory for optimizer states alone —
            more than 14 H100s can hold. Distributed training solves this by spreading
            the work — and the memory — across hundreds or thousands of GPUs simultaneously.
          </Lead>

          {subhead("The Memory Wall: One H100 vs One 70B Model")}
          <div style={{ overflowX:"auto", marginBottom:18 }}>
            <svg viewBox="0 0 680 170" style={{ width:"100%", maxWidth:680, height:"auto", display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              <defs>
                <marker id="arr-ov" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>
              {/* Single H100 box */}
              <rect x={20} y={30} width={140} height={110} rx="10" fill="rgba(43,91,255,.10)" stroke="#2B5BFF" strokeWidth="2" />
              <text x={90} y={52} textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">H100 GPU</text>
              <rect x={30} y={60} width={120} height={70} rx="6" fill="rgba(43,91,255,.18)" stroke="#2B5BFF" strokeWidth="1.2" />
              <text x={90} y={82} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#2B5BFF">80 GB</text>
              <text x={90} y={97} textAnchor="middle" fontSize="9.5" fill="#2B5BFF">HBM3 Memory</text>
              <text x={90} y={116} textAnchor="middle" fontSize="9" fill="#5577cc">max capacity</text>
              {/* VS text */}
              <text x={200} y={100} textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--muted)">vs</text>
              {/* 70B model requirements box */}
              <rect x={230} y={14} width={420} height={145} rx="10" fill="rgba(220,38,38,.06)" stroke="#dc2626" strokeWidth="2" />
              <text x={440} y={36} textAnchor="middle" fontSize="11" fontWeight="700" fill="#dc2626">70B Model — Memory Requirements</text>
              {/* Params bar */}
              <rect x={248} y={44} width={80} height={24} rx="4" fill="rgba(43,91,255,.20)" stroke="#2B5BFF" strokeWidth="1.2" />
              <text x={288} y={60} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#2B5BFF">140 GB</text>
              <text x={340} y={60} fontSize="9.5" fill="var(--ink)"> BF16 parameters (2 bytes/param)</text>
              {/* Adam states bar */}
              <rect x={248} y={76} width={380} height={24} rx="4" fill="rgba(220,38,38,.20)" stroke="#dc2626" strokeWidth="1.2" />
              <text x={438} y={92} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#dc2626">1,120 GB</text>
              <text x={248} y={116} fontSize="9" fill="var(--muted)">Adam FP32: param(4B) + grad(4B) + m(4B) + v(4B) = 16 bytes/param × 70B params</text>
              {/* Activations row */}
              <rect x={248} y={122} width={120} height={20} rx="4" fill="rgba(217,119,6,.18)" stroke="#d97706" strokeWidth="1.2" />
              <text x={308} y={136} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#d97706">~80-200 GB</text>
              <text x={375} y={136} fontSize="9" fill="var(--ink)">activations (sequence-dependent)</text>
            </svg>
          </div>

          {subhead("Memory Breakdown: 7B vs 70B Model")}
          {tbl(<>
            <thead>
              <tr>
                {th("Component")}{th("7B Model (BF16)")}{th("70B Model (BF16)")}{th("Formula")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Parameters (BF16)")}{td("14 GB")}{td("140 GB")}{td("params × 2 bytes")}
              </tr>
              <tr>
                {td("Adam param copy (FP32)")}{td("28 GB")}{td("280 GB")}{td("params × 4 bytes")}
              </tr>
              <tr>
                {td("Adam gradients (FP32)")}{td("28 GB")}{td("280 GB")}{td("params × 4 bytes")}
              </tr>
              <tr>
                {td("Adam first moment m")}{td("28 GB")}{td("280 GB")}{td("params × 4 bytes")}
              </tr>
              <tr>
                {td("Adam second moment v")}{td("28 GB")}{td("280 GB")}{td("params × 4 bytes")}
              </tr>
              <tr>
                {td("Total optimizer states", { fontWeight:700 })}{td("112 GB", { fontWeight:700, color:"#dc2626" })}{td("1,120 GB", { fontWeight:700, color:"#dc2626" })}{td("16 bytes/param total")}
              </tr>
              <tr>
                {td("H100 capacity")}{td("80 GB", { fontWeight:700, color:"#2B5BFF" })}{td("80 GB", { fontWeight:700, color:"#2B5BFF" })}{td("—")}
              </tr>
              <tr>
                {td("Fits on 1 GPU?")}{td("No", { fontWeight:700, color:"#dc2626" })}{td("No (needs 14+)", { fontWeight:700, color:"#dc2626" })}{td("—")}
              </tr>
            </tbody>
          </>)}

          {subhead("The Three Axes of Parallelism")}
          <div style={{ overflowX:"auto", marginBottom:18 }}>
            <svg viewBox='0 0 700 280' style={{ width:"100%", maxWidth:700, height:"auto", display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              <defs>
                <marker id='arr-tax' markerWidth='7' markerHeight='7' refX='5' refY='3.5' orient='auto'>
                  <polygon points='0 0, 7 3.5, 0 7' fill='#555' />
                </marker>
              </defs>

              {/* Root node — Distributed Training */}
              <rect x={230} y={10} width={240} height={36} rx='8' fill='#2B5BFF' />
              <text x={350} y={33} textAnchor='middle' fontSize='12' fontWeight='700' fill='#fff'>Distributed Training</text>

              {/* Root to branch connectors */}
              <line x1={350} y1={46} x2={350} y2={62} stroke='#555' strokeWidth='1.5' />
              <line x1={120} y1={62} x2={580} y2={62} stroke='#555' strokeWidth='1.5' />
              <line x1={120} y1={62} x2={120} y2={78} stroke='#555' strokeWidth='1.5' markerEnd='url(#arr-tax)' />
              <line x1={350} y1={62} x2={350} y2={78} stroke='#555' strokeWidth='1.5' markerEnd='url(#arr-tax)' />
              <line x1={580} y1={62} x2={580} y2={78} stroke='#555' strokeWidth='1.5' markerEnd='url(#arr-tax)' />

              {/* Branch 1 — Data Parallelism */}
              <rect x={30} y={80} width={180} height={34} rx='7' fill='#059669' />
              <text x={120} y={102} textAnchor='middle' fontSize='11' fontWeight='700' fill='#fff'>Data Parallelism</text>

              {/* Branch 2 — Model Parallelism */}
              <rect x={260} y={80} width={180} height={34} rx='7' fill='#7c3aed' />
              <text x={350} y={102} textAnchor='middle' fontSize='11' fontWeight='700' fill='#fff'>Model Parallelism</text>

              {/* Branch 3 — Combination */}
              <rect x={490} y={80} width={180} height={34} rx='7' fill='#d97706' />
              <text x={580} y={102} textAnchor='middle' fontSize='11' fontWeight='700' fill='#fff'>Combination</text>

              {/* DP leaves */}
              <line x1={80} y1={114} x2={80} y2={130} stroke='#555' strokeWidth='1.3' />
              <line x1={160} y1={114} x2={160} y2={130} stroke='#555' strokeWidth='1.3' />
              <line x1={80} y1={130} x2={160} y2={130} stroke='#555' strokeWidth='1.3' />
              <line x1={80} y1={130} x2={80} y2={144} stroke='#555' strokeWidth='1.3' markerEnd='url(#arr-tax)' />
              <line x1={160} y1={130} x2={160} y2={144} stroke='#555' strokeWidth='1.3' markerEnd='url(#arr-tax)' />
              <rect x={35} y={146} width={90} height={28} rx='6' fill='rgba(5,150,105,.15)' stroke='#059669' strokeWidth='1.3' />
              <text x={80} y={164} textAnchor='middle' fontSize='10' fontWeight='600' fill='#065f46'>DDP</text>
              <rect x={115} y={146} width={90} height={28} rx='6' fill='rgba(5,150,105,.15)' stroke='#059669' strokeWidth='1.3' />
              <text x={160} y={164} textAnchor='middle' fontSize='10' fontWeight='600' fill='#065f46'>ZeRO (FSDP)</text>

              {/* DP leaf descriptions */}
              <text x={80} y={190} textAnchor='middle' fontSize='8.5' fill='#047857'>Full model per GPU</text>
              <text x={80} y={201} textAnchor='middle' fontSize='8.5' fill='#047857'>AllReduce grads</text>
              <text x={160} y={190} textAnchor='middle' fontSize='8.5' fill='#047857'>Shard optimizer</text>
              <text x={160} y={201} textAnchor='middle' fontSize='8.5' fill='#047857'>states + params</text>

              {/* MP leaves */}
              <line x1={310} y1={114} x2={310} y2={130} stroke='#555' strokeWidth='1.3' />
              <line x1={390} y1={114} x2={390} y2={130} stroke='#555' strokeWidth='1.3' />
              <line x1={310} y1={130} x2={390} y2={130} stroke='#555' strokeWidth='1.3' />
              <line x1={310} y1={130} x2={310} y2={144} stroke='#555' strokeWidth='1.3' markerEnd='url(#arr-tax)' />
              <line x1={390} y1={130} x2={390} y2={144} stroke='#555' strokeWidth='1.3' markerEnd='url(#arr-tax)' />
              <rect x={258} y={146} width={104} height={28} rx='6' fill='rgba(124,58,237,.12)' stroke='#7c3aed' strokeWidth='1.3' />
              <text x={310} y={160} textAnchor='middle' fontSize='9.5' fontWeight='600' fill='#5b21b6'>Tensor</text>
              <text x={310} y={172} textAnchor='middle' fontSize='9.5' fontWeight='600' fill='#5b21b6'>Parallelism</text>
              <rect x={342} y={146} width={100} height={28} rx='6' fill='rgba(124,58,237,.12)' stroke='#7c3aed' strokeWidth='1.3' />
              <text x={392} y={160} textAnchor='middle' fontSize='9.5' fontWeight='600' fill='#5b21b6'>Pipeline</text>
              <text x={392} y={172} textAnchor='middle' fontSize='9.5' fontWeight='600' fill='#5b21b6'>Parallelism</text>

              {/* MP leaf descriptions */}
              <text x={310} y={190} textAnchor='middle' fontSize='8.5' fill='#6d28d9'>Split weight</text>
              <text x={310} y={201} textAnchor='middle' fontSize='8.5' fill='#6d28d9'>matrices (Megatron)</text>
              <text x={392} y={190} textAnchor='middle' fontSize='8.5' fill='#6d28d9'>Split layers</text>
              <text x={392} y={201} textAnchor='middle' fontSize='8.5' fill='#6d28d9'>across GPUs (1F1B)</text>

              {/* Combination leaf */}
              <line x1={580} y1={114} x2={580} y2={144} stroke='#555' strokeWidth='1.3' markerEnd='url(#arr-tax)' />
              <rect x={504} y={146} width={152} height={28} rx='6' fill='rgba(217,119,6,.15)' stroke='#d97706' strokeWidth='1.3' />
              <text x={580} y={162} textAnchor='middle' fontSize='10' fontWeight='700' fill='#92400e'>3D Parallelism</text>
              <text x={580} y={190} textAnchor='middle' fontSize='8.5' fill='#b45309'>TP x PP x DP</text>
              <text x={580} y={201} textAnchor='middle' fontSize='8.5' fill='#b45309'>GPT-4 class, 1000s GPUs</text>

              {/* Legend */}
              <rect x={10} y={220} width={680} height={50} rx='6' fill='rgba(0,0,0,.03)' stroke='#ddd' strokeWidth='1' />
              <text x={20} y={238} fontSize='9' fontWeight='700' fill='var(--muted)'>KEY RULES:</text>
              <text x={20} y={252} fontSize='9' fill='var(--muted)'>DP: model fits on 1 GPU, need throughput</text>
              <text x={20} y={263} fontSize='9' fill='var(--muted)'>TP: individual layers too large for 1 GPU (needs NVLink)</text>
              <text x={360} y={238} fontSize='9' fontWeight='700' fill='var(--muted)'> </text>
              <text x={360} y={252} fontSize='9' fill='var(--muted)'>PP: very deep model, spanning many nodes</text>
              <text x={360} y={263} fontSize='9' fill='var(--muted)'>3D: combine all three for 70B+ at scale</text>
            </svg>
          </div>

          {subhead("When to Use Each Strategy")}
          {tbl(<>
            <thead>
              <tr>
                {th("Model Size")}{th("Strategy")}{th("Example")}{th("Why")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("1B–7B")}{td("ZeRO-2 / FSDP + DP")}{td("Llama 3 8B on 8×H100")}{td("Model fits when sharded; DP for throughput")}
              </tr>
              <tr>
                {td("7B–70B")}{td("ZeRO-3 (FSDP) + TP")}{td("Llama 3 70B on 64×H100")}{td("ZeRO-3 shards everything; TP splits large layers")}
              </tr>
              <tr>
                {td("70B+")}{td("3D: TP + PP + DP")}{td("GPT-4 class on 1000s of GPUs")}{td("Need all three to span multiple nodes efficiently")}
              </tr>
            </tbody>
          </>)}

          <Note>
            <b>Navigation:</b> Use the stage menu on the left to jump between topics.
            Each stage covers one aspect of distributed training — hardware, parallelism
            strategies, memory optimizations, and production debugging.
          </Note>
        </>
      ),
    },

    /* ── STAGE 2 ── Hardware ────────────────────────────────────────────────── */
    {
      id: "hardware",
      group: "Hardware",
      title: "NVIDIA GPU Clusters — H100 Architecture",
      map: "Hardware",
      why: "The interconnect bandwidth hierarchy (NVLink >> InfiniBand) is the most important constraint shaping which parallelism strategy goes where.",
      render: () => (
        <>
          <Lead>
            Distributed training performance is dominated by <b>interconnect bandwidth</b>, not
            compute. Understanding the bandwidth hierarchy — NVLink within a node vs InfiniBand
            across nodes — directly determines which parallelism goes where in a 3D parallel setup.
          </Lead>

          {subhead("H100 vs A100 — Spec Comparison")}
          {tbl(<>
            <thead>
              <tr>
                {th("Specification")}{th("H100 SXM5")}{th("A100 SXM4")}{th("Ratio")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("HBM Memory")}{td("80 GB HBM3")}{td("80 GB HBM2e")}{td("Same capacity")}
              </tr>
              <tr>
                {td("Memory Bandwidth")}{td("3.35 TB/s")}{td("2.0 TB/s")}{td("1.67×")}
              </tr>
              <tr>
                {td("BF16 TFLOPS")}{td("~989 TFLOPS")}{td("~312 TFLOPS")}{td("3.2×")}
              </tr>
              <tr>
                {td("NVLink Version")}{td("NVLink 4.0")}{td("NVLink 3.0")}{td("—")}
              </tr>
              <tr>
                {td("NVLink Bandwidth (intra-node)")}{td("900 GB/s")}{td("600 GB/s")}{td("1.5×")}
              </tr>
              <tr>
                {td("InfiniBand (inter-node)")}{td("NDR 400 Gb/s")}{td("HDR 200 Gb/s")}{td("2×")}
              </tr>
              <tr>
                {td("FP8 Support")}{td("Yes (E4M3/E5M2)")}{td("No")}{td("New in H100")}
              </tr>
            </tbody>
          </>)}

          {subhead("8-GPU Node Topology: NVLink Mesh + InfiniBand Cross-Node")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 660 260" style={{ width:"100%", maxWidth:660, height:"auto", display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              {/* Node 1 box */}
              <rect x={10} y={10} width={290} height={240} rx="12" fill="rgba(43,91,255,.06)" stroke="#2B5BFF" strokeWidth="2" strokeDasharray="6 3" />
              <text x={155} y={32} textAnchor="middle" fontSize="11" fontWeight="700" fill="#2B5BFF">Node A — 8x H100 (NVLink mesh)</text>
              {/* GPU boxes node 1 */}
              {[0,1,2,3,4,5,6,7].map((i) => {
                const col = i % 4;
                const row = Math.floor(i / 4);
                const x = 22 + col * 66;
                const y = 48 + row * 90;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={56} height={52} rx="7" fill="rgba(43,91,255,.18)" stroke="#2B5BFF" strokeWidth="1.5" />
                    <text x={x+28} y={y+22} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#2B5BFF">{"GPU " + i}</text>
                    <text x={x+28} y={y+36} textAnchor="middle" fontSize="8.5" fill="#5577cc">80GB</text>
                  </g>
                );
              })}
              {/* NVLink lines between GPUs on row 0 */}
              {[0,1,2].map((i) => {
                const x1 = 22 + i * 66 + 56;
                const y1 = 48 + 26;
                return <line key={i} x1={x1} y1={y1} x2={x1+10} y2={y1} stroke="#2B5BFF" strokeWidth="2.5" opacity="0.5" />;
              })}
              {/* NVLink lines row 1 */}
              {[4,5,6].map((i) => {
                const col = i % 4;
                const x1 = 22 + col * 66 + 56;
                const y1 = 48 + 90 + 26;
                return <line key={i} x1={x1} y1={y1} x2={x1+10} y2={y1} stroke="#2B5BFF" strokeWidth="2.5" opacity="0.5" />;
              })}
              {/* NVLink vertical lines (col 0) */}
              {[0,1,2,3].map((col) => {
                const x1 = 22 + col * 66 + 28;
                return <line key={col} x1={x1} y1={100} x2={x1} y2={138} stroke="#2B5BFF" strokeWidth="2.5" opacity="0.5" />;
              })}
              <text x={155} y={232} textAnchor="middle" fontSize="9.5" fill="#2B5BFF" fontWeight="600">NVLink 4.0 — 900 GB/s all-to-all</text>

              {/* InfiniBand connection arrow */}
              <line x1={305} y1={130} x2={355} y2={130} stroke="#e05c2e" strokeWidth="2.5" markerEnd="url(#arr-ov)" />
              <text x={330} y={120} textAnchor="middle" fontSize="9" fontWeight="700" fill="#e05c2e">IB NDR</text>
              <text x={330} y={148} textAnchor="middle" fontSize="8.5" fill="#e05c2e">400 Gb/s</text>

              {/* Node 2 box */}
              <rect x={360} y={10} width={290} height={240} rx="12" fill="rgba(5,150,105,.06)" stroke="#059669" strokeWidth="2" strokeDasharray="6 3" />
              <text x={505} y={32} textAnchor="middle" fontSize="11" fontWeight="700" fill="#059669">Node B — 8x H100 (NVLink mesh)</text>
              {/* GPU boxes node 2 */}
              {[0,1,2,3,4,5,6,7].map((i) => {
                const col = i % 4;
                const row = Math.floor(i / 4);
                const x = 372 + col * 66;
                const y = 48 + row * 90;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={56} height={52} rx="7" fill="rgba(5,150,105,.18)" stroke="#059669" strokeWidth="1.5" />
                    <text x={x+28} y={y+22} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#059669">{"GPU " + i}</text>
                    <text x={x+28} y={y+36} textAnchor="middle" fontSize="8.5" fill="#059669">80GB</text>
                  </g>
                );
              })}
              {/* NVLink lines node 2 row 0 */}
              {[0,1,2].map((i) => {
                const x1 = 372 + i * 66 + 56;
                const y1 = 48 + 26;
                return <line key={i} x1={x1} y1={y1} x2={x1+10} y2={y1} stroke="#059669" strokeWidth="2.5" opacity="0.5" />;
              })}
              {/* NVLink lines node 2 row 1 */}
              {[4,5,6].map((i) => {
                const col = i % 4;
                const x1 = 372 + col * 66 + 56;
                const y1 = 48 + 90 + 26;
                return <line key={i} x1={x1} y1={y1} x2={x1+10} y2={y1} stroke="#059669" strokeWidth="2.5" opacity="0.5" />;
              })}
              {/* NVLink vertical lines node 2 */}
              {[0,1,2,3].map((col) => {
                const x1 = 372 + col * 66 + 28;
                return <line key={col} x1={x1} y1={100} x2={x1} y2={138} stroke="#059669" strokeWidth="2.5" opacity="0.5" />;
              })}
              <text x={505} y={232} textAnchor="middle" fontSize="9.5" fill="#059669" fontWeight="600">NVLink 4.0 — 900 GB/s all-to-all</text>
            </svg>
          </div>

          {info(<>
            <b>The key insight:</b> Intra-node NVLink (900 GB/s) is <b>2.25× faster</b> than
            inter-node InfiniBand (400 Gb/s = 50 GB/s). This means tensor parallelism
            (which requires heavy all-to-all communication) must stay within a single node,
            while pipeline parallelism (point-to-point, less frequent) can cross nodes.
          </>)}

          {subhead("Meta Llama 3 — Real Production Cluster")}
          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"var(--accent)", marginBottom:8 }}>
              Two custom 24,576-H100 GPU clusters
            </div>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:20, color:"var(--ink)" }}>
              <li>Over <b>400 TFLOPS per GPU</b> effective utilization across 16,384 simultaneous GPUs</li>
              <li>Greater than <b>95% effective uptime</b> — critical for multi-week training runs</li>
              <li>Custom network topology optimized for AllReduce communication patterns</li>
              <li>Dedicated storage: petabytes of training data accessible at high throughput</li>
              <li>Automatic checkpointing every N steps to recover from GPU failures</li>
            </ul>
          </>)}

          <Note>
            Cluster reliability matters as much as raw speed. A 70B model trained for 90 days
            on 2,048 GPUs means <b>5.5 million GPU-hours</b>. Even 1% downtime wastes 55,000
            GPU-hours — more than $50,000 at cloud prices.
          </Note>
        </>
      ),
    },

    /* ── STAGE 3 ── Data Parallelism ───────────────────────────────────────── */
    {
      id: "data_parallel",
      group: "Parallelism",
      title: "Data Parallelism and AllReduce",
      map: "Data Parallel",
      why: "Data parallelism is the simplest and most widely used form — every GPU holds the full model but processes different data. Understanding Ring-AllReduce is essential.",
      render: () => (
        <>
          <Lead>
            Data parallelism (DP) replicates the full model on every GPU and feeds each GPU
            a different mini-batch of data. After the backward pass, gradients are synchronized
            across all replicas via <b>AllReduce</b> so every GPU ends up with the identical
            mean gradient and can update its weights identically.
          </Lead>

          {subhead("4-GPU Data Parallel Training — Forward and AllReduce")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 680 210" style={{ width:"100%", maxWidth:680, height:"auto", display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              <defs>
                <marker id="arr-dp" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#2B5BFF" />
                </marker>
              </defs>
              {/* 4 GPU boxes with full model copies */}
              {["GPU 0", "GPU 1", "GPU 2", "GPU 3"].map((label, i) => {
                const x = 20 + i * 160;
                const batchColors = ["#2B5BFF", "#059669", "#7c3aed", "#e05c2e"];
                return (
                  <g key={i}>
                    <rect x={x} y={10} width={140} height={130} rx="10" fill="rgba(43,91,255,.07)" stroke="#2B5BFF" strokeWidth="1.8" />
                    <text x={x+70} y={30} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#2B5BFF">{label}</text>
                    <rect x={x+8} y={36} width={124} height={36} rx="6" fill="rgba(43,91,255,.15)" stroke="#2B5BFF" strokeWidth="1" />
                    <text x={x+70} y={56} textAnchor="middle" fontSize="9" fontWeight="700" fill="#2B5BFF">Full Model Copy</text>
                    <text x={x+70} y={68} textAnchor="middle" fontSize="8.5" fill="#5577cc">same weights</text>
                    <rect x={x+8} y={80} width={124} height={28} rx="5" fill={"rgba(" + (i===0?"43,91,255":i===1?"5,150,105":i===2?"124,58,237":"224,92,46") + ",.18)"} stroke={batchColors[i]} strokeWidth="1" />
                    <text x={x+70} y={97} textAnchor="middle" fontSize="9" fontWeight="700" fill={batchColors[i]}>{"Batch " + i + " (unique)"}</text>
                    <text x={x+70} y={122} textAnchor="middle" fontSize="9" fill="var(--muted)">grad_i computed</text>
                  </g>
                );
              })}
              {/* AllReduce ring arrows */}
              <path d="M 165 165 Q 340 145 515 165" fill="none" stroke="#dc2626" strokeWidth="2" markerEnd="url(#arr-dp)" />
              <path d="M 515 175 Q 340 195 165 175" fill="none" stroke="#dc2626" strokeWidth="2" markerEnd="url(#arr-dp)" />
              <text x={340} y={162} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#dc2626">Ring-AllReduce: mean(grad_0, grad_1, grad_2, grad_3)</text>
              <text x={340} y={200} textAnchor="middle" fontSize="9.5" fill="var(--muted)">After AllReduce: every GPU has the identical mean gradient — and updates identically</text>
            </svg>
          </div>

          {subhead("Ring-AllReduce — The Three-State Transformation")}
          <p style={{ fontSize:13, lineHeight:1.8, color:"var(--ink)", marginBottom:10 }}>
            A naive approach sends all gradients to one GPU (parameter server), which
            sums them and broadcasts back. That GPU becomes a bottleneck — it receives
            N gradients simultaneously and saturates its link. <b>Ring-AllReduce fixes
            this by splitting the work equally across all GPUs</b>. Every GPU sends
            and receives the same amount of data. The result is the same mean gradient
            on every GPU, but the work is distributed perfectly.
          </p>
          <p style={{ fontSize:13, lineHeight:1.8, color:"var(--ink)", marginBottom:14 }}>
            It happens in two phases. Think of the gradient tensor as split into N colored
            chunks — one chunk per GPU. Lowercase letters (g0–g3) mean partial/local
            gradients, UPPERCASE (G0–G3) means fully summed across all GPUs.
          </p>
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 800 245" style={{ width:"100%", maxWidth:800, height:"auto", display:"block" }}>
              <defs>
                <marker id="ar-rs" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#2B5BFF" />
                </marker>
                <marker id="ar-ag" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#059669" />
                </marker>
              </defs>

              {/* Column backgrounds */}
              <rect x="4" y="28" width="228" height="204" rx="8" fill="rgba(0,0,0,.03)" stroke="#ccc" strokeWidth="1"/>
              <rect x="262" y="28" width="228" height="204" rx="8" fill="rgba(43,91,255,.05)" stroke="#2B5BFF" strokeWidth="1.2"/>
              <rect x="520" y="28" width="274" height="204" rx="8" fill="rgba(5,150,105,.05)" stroke="#059669" strokeWidth="1.2"/>

              {/* Phase labels */}
              <text x="118" y="20" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#555">Start</text>
              <text x="376" y="20" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#2B5BFF">After Reduce-Scatter</text>
              <text x="657" y="20" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#059669">After AllGather</text>

              {/* Sub-descriptions */}
              <text x="118" y="222" textAnchor="middle" fontSize="8.5" fill="#888">Each GPU: 4 partial chunks</text>
              <text x="376" y="222" textAnchor="middle" fontSize="8.5" fill="#2B5BFF">Each GPU: 1 fully-summed shard</text>
              <text x="657" y="222" textAnchor="middle" fontSize="8.5" fill="#059669">Each GPU: complete mean gradient</text>

              {/* Phase arrows */}
              <line x1="234" y1="130" x2="258" y2="130" stroke="#2B5BFF" strokeWidth="2.2" markerEnd="url(#ar-rs)"/>
              <text x="246" y="120" textAnchor="middle" fontSize="8" fill="#2B5BFF" fontWeight="700">RS</text>
              <line x1="492" y1="130" x2="516" y2="130" stroke="#059669" strokeWidth="2.2" markerEnd="url(#ar-ag)"/>
              <text x="504" y="120" textAnchor="middle" fontSize="8" fill="#059669" fontWeight="700">AG</text>

              {/* 4 GPU rows */}
              {[0, 1, 2, 3].map(function(gpuIdx) {
                var gpuColors = ["#2B5BFF", "#059669", "#7c3aed", "#d97706"];
                var rgbaFull = ["43,91,255", "5,150,105", "124,58,237", "217,119,6"];
                var y = 45 + gpuIdx * 46;
                var cw = 36; var ch = 28; var gap = 4;

                return (
                  <g key={gpuIdx}>
                    {/* GPU label */}
                    <text x="22" y={y + 18} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#444">{"GPU " + gpuIdx}</text>

                    {/* State 0 — Start: all 4 partial chunks (dim) */}
                    {[0, 1, 2, 3].map(function(c) {
                      var cx = 38 + c * (cw + gap);
                      return (
                        <g key={c}>
                          <rect x={cx} y={y} width={cw} height={ch} rx="4"
                            fill={"rgba(" + rgbaFull[c] + ",.18)"}
                            stroke={gpuColors[c]} strokeWidth="1.2" />
                          <text x={cx + cw/2} y={y + 17} textAnchor="middle" fontSize="9" fill={gpuColors[c]} fontWeight="600">
                            {"g" + c}
                          </text>
                        </g>
                      );
                    })}

                    {/* State 1 — After Reduce-Scatter: only own shard is bright */}
                    {[0, 1, 2, 3].map(function(c) {
                      var cx = 295 + c * (cw + gap);
                      var owned = c === gpuIdx;
                      return (
                        <g key={c}>
                          <rect x={cx} y={y} width={cw} height={ch} rx="4"
                            fill={owned ? ("rgba(" + rgbaFull[c] + ",.88)") : "rgba(0,0,0,.05)"}
                            stroke={owned ? gpuColors[c] : "#ddd"} strokeWidth={owned ? "2" : "1"} />
                          {owned &&
                            <text x={cx + cw/2} y={y + 18} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">
                              {"G" + c}
                            </text>
                          }
                        </g>
                      );
                    })}

                    {/* State 2 — After AllGather: all 4 shards bright */}
                    {[0, 1, 2, 3].map(function(c) {
                      var cx = 554 + c * (cw + gap);
                      return (
                        <g key={c}>
                          <rect x={cx} y={y} width={cw} height={ch} rx="4"
                            fill={"rgba(" + rgbaFull[c] + ",.88)"}
                            stroke={gpuColors[c]} strokeWidth="2" />
                          <text x={cx + cw/2} y={y + 18} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">
                            {"G" + c}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.8, margin:"0 0 8px", color:"var(--ink)" }}>
              <b>Phase 1 — Reduce-Scatter</b>: Each GPU owns one chunk (e.g., GPU 0 owns chunk G0).
              GPUs pass their chunks around the ring, accumulating (summing) contributions from
              all other GPUs. After N-1 steps, GPU 0 has the fully-summed G0 from all 4 GPUs.
              GPU 1 has fully-summed G1, etc. Every shard is correct but no GPU has the full picture.
            </p>
            <p style={{ fontSize:13, lineHeight:1.8, margin:0, color:"var(--ink)" }}>
              <b>Phase 2 — AllGather</b>: Now each GPU broadcasts its fully-summed shard to the
              next GPU in the ring. After N-1 steps, every GPU has received all 4 shards —
              the complete mean gradient. All GPUs are now identical and can update their weights.
            </p>
          </>)}
          {info(<>
            <b>Why Ring-AllReduce scales so well:</b> Each GPU always sends and receives the
            same amount of data regardless of how many GPUs you add. Add 1000 GPUs — the
            per-GPU communication is still 2 × gradient_size. This is why DDP can scale
            to thousands of GPUs without the AllReduce becoming a bottleneck.
          </>)}

          {subhead("When DDP Breaks Down")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              DDP requires each GPU to hold a <b>full model copy</b>. For a 7B model,
              that is 14 GB for weights alone — before optimizer states (112 GB additional).
              Once the model doesn't fit on a single GPU, DDP fails entirely.
              This is where ZeRO / FSDP takes over.
            </p>
          </>)}

          <Note>
            PyTorch DDP wraps: <code>model = DDP(model, device_ids=[rank])</code>.
            Gradient synchronization happens automatically via hooks on the backward pass —
            you write single-GPU code and DDP handles the AllReduce transparently.
          </Note>
        </>
      ),
    },

    /* ── STAGE 4 ── ZeRO / FSDP ────────────────────────────────────────────── */
    {
      id: "zero_fsdp",
      group: "Parallelism",
      title: "ZeRO and FSDP — Sharding Everything",
      map: "ZeRO/FSDP",
      why: "ZeRO-3 (FSDP) reduces per-GPU memory for a 175B model from 700 GB to just 11 GB by sharding parameters, gradients, and optimizer states across all GPUs.",
      render: () => (
        <>
          <Lead>
            ZeRO (Zero Redundancy Optimizer) eliminates the memory redundancy in DDP.
            Instead of each GPU holding full copies of parameters, gradients, and optimizer
            states, ZeRO shards them across all GPUs. PyTorch's implementation is
            called <b>FSDP</b> (Fully Sharded Data Parallel).
          </Lead>

          {subhead("ZeRO Stages — Memory Per GPU (175B Model, 64 GPUs)")}
          {tbl(<>
            <thead>
              <tr>
                {th("Stage")}{th("What's Sharded")}{th("Mem/GPU (approx)")}{th("Reduction")}{th("Communication")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("DDP (baseline)")}{td("Nothing")}{td("~700 GB", { color:"#dc2626", fontWeight:700 })}{td("1×")}{td("AllReduce grads only")}
              </tr>
              <tr>
                {td("ZeRO-1")}{td("Optimizer states")}{td("~175-350 GB", { color:"#d97706", fontWeight:700 })}{td("2–4×")}{td("AllReduce grads + scatter opt states")}
              </tr>
              <tr>
                {td("ZeRO-2")}{td("Optimizer states + Gradients")}{td("~90-175 GB", { color:"#d97706", fontWeight:700 })}{td("4–8×")}{td("Reduce-Scatter grads, AllGather for update")}
              </tr>
              <tr>
                {td("ZeRO-3 (FSDP)")}{td("Everything (params + grads + opt)")}{td("~11 GB", { color:"#059669", fontWeight:700 })}{td("~64×")}{td("AllGather params per layer, Reduce-Scatter grads")}
              </tr>
            </tbody>
          </>)}

          {subhead("Why FSDP Works — The Core Idea")}
          <p style={{ fontSize:13, lineHeight:1.8, color:"var(--ink)", marginBottom:10 }}>
            DDP keeps a <b>full copy</b> of every weight on every GPU — that is the redundancy ZeRO
            eliminates. With FSDP, the 70B model (1.12 TB of optimizer states) is sliced into N
            equal shards. GPU 0 owns shard 0, GPU 1 owns shard 1, etc. At any given moment, each
            GPU only stores 1/N of the total. But to actually compute a forward pass through a layer,
            you need that layer's full weights. FSDP briefly assembles them (AllGather), computes,
            then immediately discards the gathered copy to reclaim memory.
          </p>
          <p style={{ fontSize:13, lineHeight:1.8, color:"var(--ink)", marginBottom:14 }}>
            The diagram below shows the lifecycle of <b>one Transformer layer</b> during a single
            training step. The top row shows what each GPU holds at each stage.
          </p>

          {subhead("FSDP Per-Layer Lifecycle — What Each GPU Holds")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 860 310" style={{ width:"100%", maxWidth:860, height:"auto", display:"block" }}>
              <defs>
                <marker id="fsdp-arr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
                <marker id="fsdp-arr-red" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#dc2626" />
                </marker>
              </defs>

              {/* Step labels at top */}
              {[
                { x:45,  label:"1. Sharded",      sub:"(idle / between layers)", color:"#2B5BFF" },
                { x:215, label:"2. AllGather",     sub:"(assemble full layer)", color:"#059669" },
                { x:395, label:"3. Compute",       sub:"(fwd + bwd pass)", color:"#7c3aed" },
                { x:570, label:"4. Free",          sub:"(discard gathered params)", color:"#dc2626" },
                { x:735, label:"5. Update shard",  sub:"(RS grads + optimizer)", color:"#d97706" },
              ].map(function(s, i) {
                return (
                  <g key={i}>
                    <text x={s.x} y={16} textAnchor="middle" fontSize="10" fontWeight="700" fill={s.color}>{s.label}</text>
                    <text x={s.x} y={28} textAnchor="middle" fontSize="8.5" fill="#888">{s.sub}</text>
                  </g>
                );
              })}

              {/* Step arrows */}
              {[140, 310, 480, 648].map(function(ax, i) {
                return (
                  <line key={i} x1={ax} y1={150} x2={ax+18} y2={150}
                    stroke="#aaa" strokeWidth="2" markerEnd="url(#fsdp-arr)" />
                );
              })}

              {/* 4 GPU rows */}
              {[0, 1, 2, 3].map(function(g) {
                var y = 45 + g * 58;
                var gpuLabel = "GPU " + g;
                var shardColor = ["#2B5BFF", "#059669", "#7c3aed", "#d97706"][g];
                var shardRgba = ["43,91,255", "5,150,105", "124,58,237", "217,119,6"][g];

                return (
                  <g key={g}>
                    {/* GPU label */}
                    <text x="6" y={y + 22} fontSize="9.5" fontWeight="700" fill="#444">{gpuLabel}</text>

                    {/* Step 1: Sharded — own shard only */}
                    <rect x="38" y={y} width="95" height="38" rx="6"
                      fill={"rgba(" + shardRgba + ",.20)"} stroke={shardColor} strokeWidth="1.6" />
                    <text x="85" y={y + 16} textAnchor="middle" fontSize="9" fontWeight="700" fill={shardColor}>
                      {"W[" + g + "] shard"}
                    </text>
                    <text x="85" y={y + 30} textAnchor="middle" fontSize="8" fill={shardColor}>
                      {"1/4 of layer"}
                    </text>

                    {/* Step 2: AllGather — full layer assembled */}
                    <rect x="168" y={y} width="120" height="38" rx="6"
                      fill="rgba(5,150,105,.12)" stroke="#059669" strokeWidth="1.6"/>
                    {[0,1,2,3].map(function(s) {
                      var sc = ["#2B5BFF","#059669","#7c3aed","#d97706"][s];
                      var sr = ["43,91,255","5,150,105","124,58,237","217,119,6"][s];
                      return (
                        <rect key={s} x={168 + s * 30} y={y + 4} width="27" height="30" rx="3"
                          fill={"rgba(" + sr + ",.50)"} stroke={sc} strokeWidth="1" />
                      );
                    })}
                    <text x="228" y={y + 47} textAnchor="middle" fontSize="7.5" fill="#059669">full W assembled</text>

                    {/* Step 3: Compute — full params, run fwd/bwd */}
                    <rect x="338" y={y} width="120" height="38" rx="6"
                      fill="rgba(124,58,237,.12)" stroke="#7c3aed" strokeWidth="1.6"/>
                    {[0,1,2,3].map(function(s) {
                      var sc = ["#2B5BFF","#059669","#7c3aed","#d97706"][s];
                      var sr = ["43,91,255","5,150,105","124,58,237","217,119,6"][s];
                      return (
                        <rect key={s} x={338 + s * 30} y={y + 4} width="27" height="30" rx="3"
                          fill={"rgba(" + sr + ",.50)"} stroke={sc} strokeWidth="1" />
                      );
                    })}
                    <text x="398" y={y + 47} textAnchor="middle" fontSize="7.5" fill="#7c3aed">fwd + bwd ✓</text>

                    {/* Step 4: Free — gathered params discarded */}
                    <rect x="508" y={y} width="95" height="38" rx="6"
                      fill="rgba(220,38,38,.06)" stroke="#dc2626" strokeWidth="1.6" strokeDasharray="5 3"/>
                    <text x="555" y={y + 16} textAnchor="middle" fontSize="9" fill="#dc2626" fontWeight="700">
                      (freed)
                    </text>
                    <text x="555" y={y + 30} textAnchor="middle" fontSize="8" fill="#dc2626">
                      only grad shard kept
                    </text>

                    {/* Step 5: Updated shard */}
                    <rect x="668" y={y} width="95" height="38" rx="6"
                      fill={"rgba(" + shardRgba + ",.28)"} stroke={shardColor} strokeWidth="2"/>
                    <text x="715" y={y + 16} textAnchor="middle" fontSize="9" fontWeight="700" fill={shardColor}>
                      {"W'[" + g + "] updated"}
                    </text>
                    <text x="715" y={y + 30} textAnchor="middle" fontSize="8" fill={shardColor}>
                      optimizer step done
                    </text>
                  </g>
                );
              })}

              {/* Bottom annotation */}
              <rect x="4" y="280" width="852" height="24" rx="5" fill="rgba(43,91,255,.06)" stroke="#2B5BFF" strokeWidth="1"/>
              <text x="430" y="296" textAnchor="middle" fontSize="9.5" fill="#2B5BFF" fontWeight="600">
                Memory peak is at step 2-3 (full layer + activations). After Free (step 4), only 1/4 of layer remains on each GPU.
              </text>
            </svg>
          </div>

          {card(<>
            <div style={{ fontSize:13, lineHeight:1.9, color:"var(--ink)" }}>
              <p style={{ margin:"0 0 8px" }}>
                <b>The cost of FSDP:</b> Steps 2 and 5 require collective communication (AllGather and
                Reduce-Scatter) for <i>every layer</i> in both the forward and backward passes.
                That is 2 × num_layers × 2 = 4 × num_layers AllReduce-class operations per step.
                On fast NVLink (900 GB/s) this is cheap; on slow InfiniBand it can halve throughput.
              </p>
              <p style={{ margin:0 }}>
                <b>The memory win:</b> At any moment outside steps 2-3, each GPU holds only 1/N of
                the layer parameters. For a 70B model with 64 GPUs and ZeRO-3, per-GPU optimizer
                state drops from 1,120 GB to ~17.5 GB — fitting easily on one H100 (80 GB).
              </p>
            </div>
          </>)}

          {subhead("Adam Optimizer State Memory Breakdown")}
          {tbl(<>
            <thead>
              <tr>
                {th("State")}{th("Dtype")}{th("Bytes/param")}{th("7B model")}{th("70B model")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Parameter copy")}{td("FP32")}{td("4")}{td("28 GB")}{td("280 GB")}
              </tr>
              <tr>
                {td("Gradient")}{td("FP32")}{td("4")}{td("28 GB")}{td("280 GB")}
              </tr>
              <tr>
                {td("First moment (m)")}{td("FP32")}{td("4")}{td("28 GB")}{td("280 GB")}
              </tr>
              <tr>
                {td("Second moment (v)")}{td("FP32")}{td("4")}{td("28 GB")}{td("280 GB")}
              </tr>
              <tr>
                {td("Total", { fontWeight:700 })}{td("—")}{td("16", { fontWeight:700 })}{td("112 GB", { fontWeight:700, color:"#dc2626" })}{td("1,120 GB", { fontWeight:700, color:"#dc2626" })}
              </tr>
              <tr>
                {td("With ZeRO-3, 64 GPUs")}{td("—")}{td("—")}{td("1.75 GB/GPU", { color:"#059669", fontWeight:700 })}{td("17.5 GB/GPU", { color:"#059669", fontWeight:700 })}
              </tr>
            </tbody>
          </>)}

          {warn(<>
            ZeRO-3 / FSDP increases communication volume significantly compared to DDP.
            Every layer requires an AllGather before forward AND backward.
            On slow inter-node connections (InfiniBand only), this can halve throughput.
            Always run TP within nodes (NVLink) before using FSDP across nodes.
          </>)}
        </>
      ),
    },

    /* ── STAGE 5 ── Tensor Parallelism ─────────────────────────────────────── */
    {
      id: "tensor_parallel",
      group: "Parallelism",
      title: "Tensor Parallelism — Splitting Matrix Operations",
      map: "Tensor Parallel",
      why: "When individual weight matrices are too large for one GPU, tensor parallelism splits them column-wise or row-wise so each GPU computes a partial result.",
      render: () => (
        <>
          <Lead>
            Tensor parallelism (TP) splits individual weight matrices across GPUs.
            Instead of moving data between GPUs between layers (like pipeline parallelism),
            TP splits the matrix multiplication itself — each GPU computes a portion of
            the result, and the partial results are combined via AllReduce.
            TP requires <b>NVLink-speed communication</b> and should stay within a single node.
          </Lead>

          {subhead("FFN Splitting: Column-Parallel then Row-Parallel")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 660 200" style={{ width:"100%", maxWidth:660, height:"auto", display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              <defs>
                <marker id="arr-tp" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#555" />
                </marker>
              </defs>
              {/* Input X */}
              <rect x={10} y={60} width={60} height={80} rx="6" fill="rgba(43,91,255,.12)" stroke="#2B5BFF" strokeWidth="1.5" />
              <text x={40} y={105} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#2B5BFF">X</text>
              <text x={40} y={118} textAnchor="middle" fontSize="8.5" fill="#5577cc">B×d_model</text>
              <text x={40} y={56} textAnchor="middle" fontSize="9" fill="var(--muted)">input</text>

              {/* W_up split into 2 parts */}
              <text x={130} y={30} textAnchor="middle" fontSize="10" fontWeight="700" fill="#059669">W_up: column-parallel (split along d_ff)</text>
              <rect x={88} y={38} width={54} height={80} rx="5" fill="rgba(5,150,105,.18)" stroke="#059669" strokeWidth="1.5" />
              <text x={115} y={82} textAnchor="middle" fontSize="9" fontWeight="700" fill="#059669">W_up</text>
              <text x={115} y={95} textAnchor="middle" fontSize="8.5" fill="#059669">GPU 0</text>
              <text x={115} y={107} textAnchor="middle" fontSize="8" fill="#059669">d_ff/2 cols</text>

              <rect x={148} y={38} width={54} height={80} rx="5" fill="rgba(124,58,237,.18)" stroke="#7c3aed" strokeWidth="1.5" />
              <text x={175} y={82} textAnchor="middle" fontSize="9" fontWeight="700" fill="#7c3aed">W_up</text>
              <text x={175} y={95} textAnchor="middle" fontSize="8.5" fill="#7c3aed">GPU 1</text>
              <text x={175} y={107} textAnchor="middle" fontSize="8" fill="#7c3aed">d_ff/2 cols</text>

              <line x1={72} y1={100} x2={86} y2={100} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-tp)" />
              <text x={79} y={93} textAnchor="middle" fontSize="8" fill="var(--muted)">×</text>

              {/* Partial outputs h0, h1 */}
              <text x={250} y={30} textAnchor="middle" fontSize="9" fill="var(--muted)">no comm needed</text>
              <rect x={212} y={52} width={44} height={56} rx="5" fill="rgba(5,150,105,.18)" stroke="#059669" strokeWidth="1.5" />
              <text x={234} y={82} textAnchor="middle" fontSize="9" fontWeight="700" fill="#059669">h₀</text>
              <text x={234} y={95} textAnchor="middle" fontSize="8" fill="#059669">GPU 0</text>

              <rect x={262} y={52} width={44} height={56} rx="5" fill="rgba(124,58,237,.18)" stroke="#7c3aed" strokeWidth="1.5" />
              <text x={284} y={82} textAnchor="middle" fontSize="9" fontWeight="700" fill="#7c3aed">h₁</text>
              <text x={284} y={95} textAnchor="middle" fontSize="8" fill="#7c3aed">GPU 1</text>

              <line x1={204} y1={80} x2={214} y2={80} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-tp)" />

              {/* ReLU */}
              <text x={325} y={82} textAnchor="middle" fontSize="9.5" fill="var(--muted)">ReLU</text>
              <line x1={308} y1={80} x2={316} y2={80} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-tp)" />
              <line x1={334} y1={80} x2={342} y2={80} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-tp)" />

              {/* W_down row-parallel */}
              <text x={405} y={30} textAnchor="middle" fontSize="10" fontWeight="700" fill="#e05c2e">W_down: row-parallel (split along input dim)</text>
              <rect x={344} y={52} width={54} height={56} rx="5" fill="rgba(5,150,105,.18)" stroke="#059669" strokeWidth="1.5" />
              <text x={371} y={78} textAnchor="middle" fontSize="9" fontWeight="700" fill="#059669">W_down</text>
              <text x={371} y={90} textAnchor="middle" fontSize="8" fill="#059669">GPU 0 rows</text>

              <rect x={404} y={52} width={54} height={56} rx="5" fill="rgba(124,58,237,.18)" stroke="#7c3aed" strokeWidth="1.5" />
              <text x={431} y={78} textAnchor="middle" fontSize="9" fontWeight="700" fill="#7c3aed">W_down</text>
              <text x={431} y={90} textAnchor="middle" fontSize="8" fill="#7c3aed">GPU 1 rows</text>

              {/* AllReduce box */}
              <rect x={470} y={55} width={80} height={50} rx="7" fill="rgba(220,38,38,.12)" stroke="#dc2626" strokeWidth="1.8" />
              <text x={510} y={76} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#dc2626">AllReduce</text>
              <text x={510} y={90} textAnchor="middle" fontSize="8.5" fill="#dc2626">sum partial</text>
              <text x={510} y={101} textAnchor="middle" fontSize="8.5" fill="#dc2626">results</text>
              <line x1={460} y1={80} x2={468} y2={80} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-tp)" />

              {/* Final output */}
              <rect x={558} y={60} width={50} height={40} rx="5" fill="rgba(43,91,255,.12)" stroke="#2B5BFF" strokeWidth="1.5" />
              <text x={583} y={83} textAnchor="middle" fontSize="9" fontWeight="700" fill="#2B5BFF">out</text>
              <line x1={552} y1={80} x2={556} y2={80} stroke="#555" strokeWidth="1.4" markerEnd="url(#arr-tp)" />

              <text x={340} y={175} textAnchor="middle" fontSize="9.5" fill="#dc2626" fontWeight="700">1 AllReduce per FFN sub-layer (forward) + 1 in backward = 2 AllReduces per transformer layer</text>
            </svg>
          </div>

          {subhead("TP for Attention — Head Splitting")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 8px", color:"var(--ink)" }}>
              Multi-head attention splits naturally along the head dimension:
            </p>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:20, color:"var(--ink)" }}>
              <li><b>Q, K, V projections:</b> Column-parallel — each GPU handles n_heads/TP attention heads.
                No communication needed after the projection.</li>
              <li><b>Output projection (O):</b> Row-parallel — each GPU computes a partial sum,
                then AllReduce combines. Net: 2 AllReduces per attention sub-layer.</li>
            </ul>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"8px 0 0", color:"var(--ink)" }}>
              <b>Total communication per transformer block:</b> 4 AllReduces
              (2 per FFN + 2 per attention).
            </p>
          </>)}

          {subhead("Why Limit TP to 8 GPUs?")}
          {tbl(<>
            <thead>
              <tr>
                {th("TP Degree")}{th("Comm per layer")}{th("Within 1 node?")}{th("Practical?")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("TP=1")}{td("0 (no TP)")}{td("Yes")}{td("Baseline DDP")}
              </tr>
              <tr>
                {td("TP=2")}{td("Low")}{td("Yes (NVLink)")}{td("Excellent scaling")}
              </tr>
              <tr>
                {td("TP=4")}{td("Medium")}{td("Yes (NVLink)")}{td("Good — common in production")}
              </tr>
              <tr>
                {td("TP=8")}{td("High")}{td("Yes (NVLink, 1 node)")}{td("Acceptable — boundary")}
              </tr>
              <tr>
                {td("TP=16")}{td("Very high")}{td("No — crosses nodes (IB)")}{td("Communication dominates. Avoid.", { color:"#dc2626", fontWeight:700 })}
              </tr>
            </tbody>
          </>)}

          {subhead("Sequence Parallelism")}
          {info(<>
            Outside the TP regions (LayerNorm, Dropout), activations are replicated across
            all TP ranks — wasting memory. <b>Sequence parallelism</b> instead splits these
            activations along the sequence (T) dimension. With TP=4 and seq_len=4096,
            each GPU stores only 1024 tokens' activations. This reduces activation memory
            by a factor of TP with no extra communication cost.
          </>)}
        </>
      ),
    },

    /* ── STAGE 6 ── Pipeline Parallelism ────────────────────────────────────── */
    {
      id: "pipeline_parallel",
      group: "Parallelism",
      title: "Pipeline Parallelism — Splitting Layers",
      map: "Pipeline Parallel",
      why: "Pipeline parallelism splits transformer layers across GPUs so a 96-layer model on 8 pipeline stages has each GPU holding 12 layers. The challenge is avoiding 'pipeline bubble' idle time.",
      render: () => (
        <>
          <Lead>
            Pipeline parallelism (PP) splits transformer <b>layers</b> across GPUs.
            GPU 0 runs layers 0 to L/PP, GPU 1 runs the next chunk, and so on.
            Data flows through the pipeline like an assembly line.
            The key engineering challenge is minimizing the <b>pipeline bubble</b> —
            the GPU idle time during pipeline fill and drain.
          </Lead>

          {subhead("GPipe Schedule: Forward-All Then Backward-All")}
          <div style={{ overflowX:"auto", marginBottom:12 }}>
            <svg viewBox="0 0 660 160" style={{ width:"100%", maxWidth:660, height:"auto", display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              {/* Stage labels */}
              {["Stage 0", "Stage 1", "Stage 2", "Stage 3"].map((label, i) => (
                <text key={i} x={10} y={36 + i * 34} fontSize="9.5" fontWeight="700" fill="var(--muted)">{label}</text>
              ))}
              {/* Microbatch forward blocks */}
              {[0,1,2,3].map((stage) => {
                return [0,1,2,3].map((mb) => {
                  const x = 65 + stage * 34 + mb * 34;
                  const y = 22 + stage * 34;
                  if (mb < stage) return null;
                  return (
                    <rect key={mb} x={x} y={y} width={30} height={26} rx="4"
                      fill={"rgba(43,91,255," + (0.15 + mb * 0.07) + ")"} stroke="#2B5BFF" strokeWidth="1.2" />
                  );
                });
              })}
              {/* Forward labels */}
              {[0,1,2,3].map((mb) => (
                <text key={mb} x={80 + mb * 34} y={15} textAnchor="middle" fontSize="8.5" fill="#2B5BFF" fontWeight="600">{"F" + mb}</text>
              ))}
              {/* Backward blocks */}
              {[0,1,2,3].map((stage) => {
                return [0,1,2,3].map((mb) => {
                  const x = 65 + (4 + stage) * 34 + mb * 34;
                  const y = 22 + stage * 34;
                  return (
                    <rect key={mb} x={x} y={y} width={30} height={26} rx="4"
                      fill={"rgba(220,38,38," + (0.12 + mb * 0.06) + ")"} stroke="#dc2626" strokeWidth="1.2" />
                  );
                });
              })}
              {/* Bubble indicator */}
              <rect x={65} y={56} width={102} height={26} rx="4" fill="rgba(255,200,0,.18)" stroke="#d97706" strokeWidth="1.2" strokeDasharray="4 2" />
              <text x={116} y={73} textAnchor="middle" fontSize="8.5" fill="#d97706" fontWeight="600">bubble</text>
              {/* Legend */}
              <rect x={520} y={20} width={14} height={10} rx="2" fill="rgba(43,91,255,.3)" stroke="#2B5BFF" strokeWidth="1" />
              <text x={538} y={30} fontSize="8.5" fill="var(--ink)">Forward</text>
              <rect x={520} y={36} width={14} height={10} rx="2" fill="rgba(220,38,38,.25)" stroke="#dc2626" strokeWidth="1" />
              <text x={538} y={46} fontSize="8.5" fill="var(--ink)">Backward</text>
              <rect x={520} y={52} width={14} height={10} rx="2" fill="rgba(255,200,0,.25)" stroke="#d97706" strokeWidth="1" strokeDasharray="3 2" />
              <text x={538} y={62} fontSize="8.5" fill="var(--ink)">Bubble (idle)</text>
              <text x={340} y={150} textAnchor="middle" fontSize="9.5" fill="#d97706" fontWeight="600">GPipe: all microbatch forwards, then all backwards — large bubble at pipeline edges</text>
            </svg>
          </div>

          {subhead("1F1B Schedule: Interleaved Forward and Backward")}
          <div style={{ overflowX:"auto", marginBottom:12 }}>
            <svg viewBox="0 0 660 160" style={{ width:"100%", maxWidth:660, height:"auto", display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              {/* Stage labels */}
              {["Stage 0", "Stage 1", "Stage 2", "Stage 3"].map((label, i) => (
                <text key={i} x={10} y={36 + i * 34} fontSize="9.5" fontWeight="700" fill="var(--muted)">{label}</text>
              ))}
              {/* 1F1B pattern: staggered forward/backward interleaved */}
              {[
                [0,0,1,0,1,1,2,1,3,3],
                [null,0,0,1,0,1,1,2,2,3],
                [null,null,0,0,1,0,1,1,2,2],
                [null,null,null,0,0,1,0,1,1,2],
              ].map((pattern, stage) => (
                pattern.map((type, slot) => {
                  if (type === null) return null;
                  const x = 65 + slot * 34;
                  const y = 22 + stage * 34;
                  const isBack = slot > 4;
                  return (
                    <rect key={slot} x={x} y={y} width={30} height={26} rx="4"
                      fill={isBack ? "rgba(220,38,38,.22)" : "rgba(43,91,255,.22)"}
                      stroke={isBack ? "#dc2626" : "#2B5BFF"} strokeWidth="1.2" />
                  );
                })
              ))}
              <text x={340} y={150} textAnchor="middle" fontSize="9.5" fill="#059669" fontWeight="600">1F1B: each GPU alternates forward/backward — much smaller bubble, lower peak activation memory</text>
            </svg>
          </div>

          {subhead("Pipeline Bubble Formula")}
          {tbl(<>
            <thead>
              <tr>
                {th("Schedule")}{th("Bubble Fraction")}{th("PP=4, M=8")}{th("PP=16, M=32")}{th("Notes")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("GPipe")}{td("(PP-1) / (PP-1 + M)")}{td("3/11 = 27%")}{td("15/47 = 32%")}{td("Large peak activation O(PP×M)")}
              </tr>
              <tr>
                {td("1F1B")}{td("(PP-1) / M")}{td("3/8 = 37%")}{td("15/32 = 47%")}{td("Lower peak activation O(PP) only")}
              </tr>
              <tr>
                {td("1F1B Interleaved")}{td("(PP-1) / (M×V)")}{td("Lower with V chunks")}{td("Even lower")}{td("V = chunks per stage")}
              </tr>
            </tbody>
          </>)}

          {info(<>
            <b>Rule of thumb:</b> To keep the GPipe bubble below 10%, you need
            M (number of microbatches) to be at least 9× (PP-1).
            For PP=16: M ≥ 9 × 15 = 135 microbatches. Large microbatch counts
            also improve compute efficiency but increase memory pressure.
          </>)}

          {subhead("Pipeline Communication")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Unlike TP which uses AllReduce, PP communication is <b>point-to-point</b>:
              stage i sends its output activation to stage i+1 (forward), and receives
              a gradient tensor from stage i+1 (backward). This is much lower bandwidth
              than AllReduce, making PP well-suited for slower inter-node InfiniBand links.
            </p>
          </>)}
        </>
      ),
    },

    /* ── STAGE 7 ── 3D Parallelism ──────────────────────────────────────────── */
    {
      id: "3d_parallel",
      group: "Parallelism",
      title: "3D Parallelism — Combining All Three",
      map: "3D Parallel",
      why: "Production LLM training combines TP (intra-node, NVLink), PP (inter-node, InfiniBand), and DP (the outer loop) into a single 3D parallelism strategy.",
      render: () => (
        <>
          <Lead>
            No single form of parallelism is sufficient for training a 175B+ model on
            thousands of GPUs. <b>3D parallelism</b> combines tensor parallelism (within
            a node via NVLink), pipeline parallelism (across nodes via InfiniBand), and
            data parallelism (the outer replication loop) — each assigned to the
            communication tier it's best suited for.
          </Lead>

          {subhead("3D Parallelism: Three Axes")}
          <div style={{ overflowX:"auto", marginBottom:16 }}>
            <svg viewBox="0 0 500 260" style={{ width:"100%", maxWidth:500, height:"auto", display:"block", fontFamily:"var(--font-ui, sans-serif)" }}>
              {/* Isometric cube representation */}
              {/* Draw a 3D cube grid: TP on X, PP on Y (vertical), DP on Z (depth) */}
              {/* Front face - TP=4, PP=4 */}
              {[0,1,2,3].map((row) =>
                [0,1,2,3].map((col) => {
                  const x = 80 + col * 55;
                  const y = 40 + row * 50;
                  return (
                    <rect key={row + "-" + col} x={x} y={y} width={48} height={42} rx="6"
                      fill={"rgba(43,91,255," + (0.10 + col * 0.05) + ")"}
                      stroke="#2B5BFF" strokeWidth="1.5" />
                  );
                })
              )}
              {/* TP axis label */}
              <text x={260} y={32} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#2B5BFF">Tensor Parallel (TP=4) — NVLink, intra-node</text>
              {/* PP axis label */}
              <text x={56} y={125} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#7c3aed"
                transform="rotate(-90,56,125)">Pipeline (PP=4)</text>
              {/* DP axis label (depth) */}
              <text x={400} y={80} fontSize="10" fontWeight="700" fill="#059669">DP=4</text>
              <text x={400} y={94} fontSize="9" fill="#059669">replication</text>
              <text x={400} y={108} fontSize="9" fill="#059669">InfiniBand</text>
              {/* Depth shadow boxes */}
              {[0,1,2,3].map((row) =>
                [0,1,2,3].map((col) => {
                  const x = 86 + col * 55;
                  const y = 46 + row * 50;
                  return (
                    <rect key={"s" + row + "-" + col} x={x} y={y} width={48} height={42} rx="6"
                      fill="none" stroke="rgba(5,150,105,.3)" strokeWidth="1"
                      strokeDasharray="3 2" />
                  );
                })
              )}
              {/* GPU labels inside front face cells */}
              {[0,1,2,3].map((row) =>
                [0,1,2,3].map((col) => {
                  const x = 80 + col * 55 + 24;
                  const y = 40 + row * 50 + 20;
                  return (
                    <text key={"lbl" + row + "-" + col} x={x} y={y}
                      textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#2B5BFF">
                      {"G" + (row*4+col)}
                    </text>
                  );
                })
              )}
              {/* Bandwidth annotations */}
              <line x1={80} y1={240} x2={300} y2={240} stroke="#2B5BFF" strokeWidth="2" />
              <text x={190} y={256} textAnchor="middle" fontSize="9.5" fill="#2B5BFF" fontWeight="600">NVLink 900 GB/s (TP within row)</text>
              <line x1={70} y1={40} x2={70} y2={200} stroke="#7c3aed" strokeWidth="2" />
              <text x={20} y={120} textAnchor="middle" fontSize="9" fill="#7c3aed" fontWeight="600"
                transform="rotate(-90,20,120)">IB 50 GB/s (PP col)</text>
            </svg>
          </div>

          {subhead("Practical Example: 175B Model on 512 GPUs")}
          {card(<>
            <div style={{ fontWeight:700, fontSize:13, color:"var(--accent)", marginBottom:8 }}>
              Assignment: TP=4, PP=16, DP=8 (= 4 × 16 × 8 = 512 GPUs)
            </div>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:20, color:"var(--ink)" }}>
              <li><b>TP=4</b> (tensor parallel): 4 GPUs within the same physical node share
                a weight matrix via NVLink (900 GB/s). AllReduce happens at NVLink speed.</li>
              <li><b>PP=16</b> (pipeline): 16 pipeline stages span across nodes. A 96-layer
                model → 6 layers per stage. Point-to-point activation tensors cross nodes via
                InfiniBand (50 GB/s effective).</li>
              <li><b>DP=8</b> (data parallel): 8 independent replicas of the TP+PP model,
                each processing different global batches. Gradient AllReduce happens at
                InfiniBand speed but less frequently (once per gradient accumulation step).</li>
            </ul>
          </>)}

          {subhead("Production Configurations")}
          {tbl(<>
            <thead>
              <tr>
                {th("Model Size")}{th("Total GPUs")}{th("TP")}{th("PP")}{th("DP")}{th("Cluster Type")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("7B")}{td("64")}{td("1")}{td("1")}{td("64")}{td("FSDP + DP only")}
              </tr>
              <tr>
                {td("13B")}{td("64")}{td("2")}{td("2")}{td("16")}{td("TP intra-node, PP for depth")}
              </tr>
              <tr>
                {td("70B")}{td("512")}{td("4")}{td("8")}{td("16")}{td("3D — Megatron-LM config")}
              </tr>
              <tr>
                {td("175B")}{td("1024")}{td("8")}{td("16")}{td("8")}{td("Full 3D — production GPT class")}
              </tr>
              <tr>
                {td("500B+")}{td("4096+")}{td("8")}{td("64")}{td("8+")}{td("Frontier-class, custom topology")}
              </tr>
            </tbody>
          </>)}

          {info(<>
            <b>Assignment heuristic:</b> TP degree = GPUs per node (up to 8) → PP degree =
            number of nodes per replica → DP = total replicas. Always maximize TP first
            (it uses the fastest NVLink bandwidth), then set PP, then DP fills the rest.
          </>)}
        </>
      ),
    },

    /* ── STAGE 8 ── Batch Sizing ────────────────────────────────────────────── */
    {
      id: "batch_sizing",
      group: "Concepts",
      title: "Global Batch Size and Gradient Accumulation",
      map: "Batch Sizing",
      why: "Global batch size is not just a memory concern — it directly affects training stability, convergence speed, and final model quality.",
      render: () => (
        <>
          <Lead>
            In distributed training, "batch size" has multiple meanings that interact.
            The <b>global batch size</b> determines gradient quality; the <b>micro-batch</b>
            determines per-GPU memory; <b>gradient accumulation</b> bridges the two.
            LLM training typically uses 4M–16M tokens per global step.
          </Lead>

          {subhead("Batch Size Hierarchy")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 10px", color:"var(--ink)" }}>
              <b>global_batch_tokens = micro_batch_seqs × seq_len × num_GPUs × grad_accum_steps</b>
            </p>
            <div style={{ background:"rgba(43,91,255,.07)", padding:"10px 14px", borderRadius:8 }}>
              <p style={{ fontSize:13, margin:"0 0 4px", color:"var(--ink)", fontWeight:700 }}>
                Example: Reaching 4M global tokens
              </p>
              <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:20, color:"var(--ink)" }}>
                <li>micro_batch = 2 sequences per GPU</li>
                <li>seq_len = 4,096 tokens</li>
                <li>num_GPUs = 128</li>
                <li>grad_accum_steps = 4</li>
                <li>Result: 2 × 4096 × 128 × 4 = <b>4,194,304 tokens</b> per optimizer step</li>
              </ul>
            </div>
          </>)}

          {subhead("How Gradient Accumulation Works")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              Without gradient accumulation, every forward+backward immediately triggers
              an AllReduce and optimizer step. With gradient accumulation of K steps:
              run K micro-batches, sum their gradients locally on each GPU,
              then do a single AllReduce + optimizer step. This reduces AllReduce
              frequency by K× while achieving the same effective batch size.
            </p>
          </>)}

          {subhead("Why Large Batches? Why Not Larger?")}
          {tbl(<>
            <thead>
              <tr>
                {th("Global Batch Size")}{th("Gradient Quality")}{th("GPU Utilization")}{th("Memory")}{th("Generalization")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Very small (< 256K tokens)")}{td("Noisy, high variance")}{td("Low (AllReduce overhead dominates)")}{td("Low")}{td("Good (noisy = regularization)")}
              </tr>
              <tr>
                {td("Medium (1M–4M tokens)")}{td("Stable, good signal")}{td("High")}{td("Moderate")}{td("Good")}
              </tr>
              <tr>
                {td("Large (4M–16M tokens)")}{td("Very stable, low variance")}{td("Very high")}{td("High")}{td("Acceptable with LR scaling")}
              </tr>
              <tr>
                {td("Huge (> 16M tokens)")}{td("Over-smooth, may miss sharp minima")}{td("High")}{td("Very high")}{td("Degrades — less stochasticity")}
              </tr>
            </tbody>
          </>)}

          {subhead("Typical LLM Production Values")}
          {tbl(<>
            <thead>
              <tr>
                {th("Parameter")}{th("Typical Range")}{th("Notes")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Global batch (tokens)")}{td("4M – 16M")}{td("Llama 3: 4M tokens, GPT-3: 3.2M")}
              </tr>
              <tr>
                {td("Micro-batch (sequences/GPU)")}{td("1–4")}{td("Bounded by GPU memory")}
              </tr>
              <tr>
                {td("Sequence length")}{td("4,096 – 8,192 tokens")}{td("Longer seqs = quadratic attention cost")}
              </tr>
              <tr>
                {td("Gradient accumulation steps")}{td("16–128")}{td("Higher = fewer AllReduces = better utilization")}
              </tr>
              <tr>
                {td("Effective seqs per step")}{td("1,000 – 4,000")}{td("Depends on seq_len")}
              </tr>
            </tbody>
          </>)}

          {info(<>
            <b>Linear scaling rule:</b> When multiplying batch size by k, multiply the
            learning rate by k (or √k for Adam). This heuristic holds up to roughly 16×
            the baseline batch size. Beyond that, warmup schedules and more careful
            LR tuning are required to maintain training stability.
          </>)}
        </>
      ),
    },

    /* ── STAGE 9 ── Activation Checkpointing & Mixed Precision ─────────────── */
    {
      id: "activation_ckpt",
      group: "Memory",
      title: "Activation Checkpointing and Mixed Precision",
      map: "Memory Opts",
      why: "Activation checkpointing cuts activation memory by ~70% at a cost of ~33% extra compute. BF16 avoids overflow without loss in scale range compared to FP16.",
      render: () => (
        <>
          <Lead>
            Even after sharding parameters with FSDP, <b>activations</b> can dominate memory
            during training. A 7B model with batch size 2 and sequence length 4096 stores
            roughly 20–40 GB of intermediate activations per GPU across all layers.
            Activation checkpointing and mixed precision are the two most impactful
            memory optimizations after choosing a parallelism strategy.
          </Lead>

          {subhead("Why Activations Are Expensive")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              During the forward pass, every intermediate tensor must be <b>saved for the
              backward pass</b> to compute gradients via the chain rule. For a transformer:
            </p>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:"8px 0 0", paddingLeft:20, color:"var(--ink)" }}>
              <li>Each transformer block stores: attention weights (B×H×T×T),
                Q/K/V matrices (B×T×d_model each), FFN intermediates (B×T×d_ff)</li>
              <li>Total per layer: roughly B × T × d_model × 12 bytes (BF16)</li>
              <li>For 7B (32 layers, d=4096, B=2, T=4096): ~32 × 2 × 4096 × 4096 × 12 ≈ <b>13 GB</b></li>
            </ul>
          </>)}

          {subhead("Activation Checkpointing: Trade Compute for Memory")}
          {tbl(<>
            <thead>
              <tr>
                {th("Strategy")}{th("What's Saved")}{th("Memory Savings")}{th("Extra Compute")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("No checkpointing")}{td("All intermediate tensors")}{td("0%")}{td("0% (baseline)")}
              </tr>
              <tr>
                {td("Full checkpointing")}{td("Only layer input; recompute internals")}{td("~70%")}{td("~33% (one extra forward pass)")}
              </tr>
              <tr>
                {td("Selective checkpointing")}{td("Expensive ops only (attn weights)")}{td("~30–50%")}{td("~10–20%")}
              </tr>
              <tr>
                {td("No checkpointing + offload to CPU")}{td("All (on CPU)")}{td("GPU cleared")}{td("High (PCIe transfer latency)")}
              </tr>
            </tbody>
          </>)}

          {subhead("BF16 vs FP16 vs FP8 — Precision Comparison")}
          {tbl(<>
            <thead>
              <tr>
                {th("Format")}{th("Exponent bits")}{th("Mantissa bits")}{th("Max value")}{th("Overflow risk")}{th("Use case")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("FP32")}{td("8")}{td("23")}{td("~3.4×10^38")}{td("Very low")}{td("Optimizer states (master weights)")}
              </tr>
              <tr>
                {td("BF16")}{td("8")}{td("7")}{td("~3.4×10^38")}{td("Very low", { color:"#059669", fontWeight:700 })}{td("Forward/backward (H100 preferred)")}
              </tr>
              <tr>
                {td("FP16")}{td("5")}{td("10")}{td("~65,504")}{td("HIGH — Inf/NaN risk", { color:"#dc2626", fontWeight:700 })}{td("Avoid for LLM training; use BF16")}
              </tr>
              <tr>
                {td("FP8 E4M3")}{td("4")}{td("3")}{td("~448")}{td("Very high (forward only)")}{td("H100 FP8 forward pass — 2× BF16 throughput")}
              </tr>
              <tr>
                {td("FP8 E5M2")}{td("5")}{td("2")}{td("~57,344")}{td("High (backward pass)")}{td("H100 FP8 backward — larger range than E4M3")}
              </tr>
            </tbody>
          </>)}

          {subhead("Mixed Precision Training — Standard Recipe")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 8px", color:"var(--ink)" }}>
              The standard mixed-precision setup (AMP — Automatic Mixed Precision):
            </p>
            <ol style={{ fontSize:13, lineHeight:2.0, margin:0, paddingLeft:22, color:"var(--ink)" }}>
              <li><b>FP32 master weights</b> stored in the optimizer — full precision for
                stable Adam updates (avoids rounding error in optimizer states)</li>
              <li><b>BF16 compute</b> for all forward and backward passes — 2× throughput
                on tensor cores, same range as FP32 so no overflow</li>
              <li><b>FP32 gradient accumulation</b> for the AllReduce — prevents precision
                loss when summing many small gradients</li>
              <li><b>Loss scaling</b> (only needed with FP16, not BF16) — multiply loss by
                a scale factor to prevent underflow in FP16 gradients</li>
            </ol>
          </>)}

          {info(<>
            On H100 with FP8: use E4M3 for the forward pass activations (better precision)
            and E5M2 for backward gradients (larger range). This doubles throughput vs BF16
            at the cost of more careful scaling factor management per tensor.
          </>)}
        </>
      ),
    },

    /* ── STAGE 10 ── Common Failures ────────────────────────────────────────── */
    {
      id: "problems",
      group: "Debugging",
      title: "Common Failures and How to Debug Them",
      map: "Debugging",
      why: "Distributed training failures are often subtle — OOM, NaN gradients, and stragglers can all manifest identically as a hung job. Systematic diagnosis matters.",
      render: () => (
        <>
          <Lead>
            Distributed training fails in ways that don't exist in single-GPU training.
            A straggler GPU hangs the whole job. An OOM on rank 3 crashes silently while
            rank 0 waits forever for an AllReduce that never completes.
            Systematic debugging procedures save days of wall-clock time.
          </Lead>

          {subhead("Failure Mode Reference Table")}
          {tbl(<>
            <thead>
              <tr>
                {th("Failure")}{th("Symptoms")}{th("Root Cause")}{th("Fix")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Out of Memory (OOM)")}{td("CUDA OOM, job crashes on one rank")}{td("Batch too large, activations not freed, no checkpointing")}{td("Reduce micro-batch → enable act. ckpt → reduce seq_len")}
              </tr>
              <tr>
                {td("NaN / Inf gradient")}{td("Loss goes to NaN, gradients explode")}{td("LR too high, FP16 overflow, bad data shard")}{td("Clip grad norm=1.0, switch to BF16, reduce LR, inspect data")}
              </tr>
              <tr>
                {td("Loss spike")}{td("Loss suddenly 10× higher then recovers")}{td("Bad data batch, LR warmup issue, grad explosion")}{td("Checkpoint before spike, skip corrupt shard, reduce LR")}
              </tr>
              <tr>
                {td("Straggler GPU")}{td("Job runs 20% slower than expected, one rank lags")}{td("Hardware fault, NCCL timeout, uneven data shards")}{td("Proactive health checks, redistribute data, spare GPU pool")}
              </tr>
              <tr>
                {td("NCCL timeout")}{td("NCCL_TIMEOUT error, all ranks hang")}{td("One rank crashed, network partition")}{td("Set NCCL timeout, implement heartbeat, auto-restart from checkpoint")}
              </tr>
              <tr>
                {td("Dead pipeline stage")}{td("Pipeline stage receives no microbatches")}{td("Microbatch count not divisible by PP degree")}{td("Ensure num_microbatches is multiple of PP; pad if needed")}
              </tr>
            </tbody>
          </>)}

          {subhead("Gradient Norm Monitoring — The Key Signal")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:"0 0 8px", color:"var(--ink)" }}>
              Log <code>grad_norm = torch.nn.utils.clip_grad_norm_(params, max_norm=1.0)</code>
              at every step. The gradient norm is the single most informative training health signal:
            </p>
            <ul style={{ fontSize:13, lineHeight:1.9, margin:0, paddingLeft:20, color:"var(--ink)" }}>
              <li><b>Normal:</b> Grad norm oscillates between 0.5 and 5.0, trending slowly downward as training progresses.</li>
              <li><b>Instability signal:</b> Sudden spike to 50–500 — reduce LR immediately or skip that batch.</li>
              <li><b>Collapse signal:</b> Grad norm drops to near 0 — learning has stopped (likely LR too low or dead neurons).</li>
              <li><b>Post-spike recovery:</b> If norm returns to normal within 5–10 steps, training will self-recover. If not, roll back to last checkpoint.</li>
            </ul>
          </>)}

          {subhead("OOM Debugging: What to Reduce First")}
          {card(<>
            <ol style={{ fontSize:13, lineHeight:2.1, margin:0, paddingLeft:22, color:"var(--ink)" }}>
              <li>
                <b>Reduce micro-batch size</b> (micro_batch 4 → 2 → 1) — immediately halves
                activation memory with no other changes.
              </li>
              <li>
                <b>Enable activation checkpointing</b> — saves ~70% activation memory at ~33% compute cost.
              </li>
              <li>
                <b>Reduce sequence length</b> — attention is O(T²), so halving seq_len cuts
                attention activation memory by 4×.
              </li>
              <li>
                <b>Increase TP degree</b> (if not already at node boundary) — spreads weight
                memory across more GPUs.
              </li>
              <li>
                <b>Enable ZeRO-3 / FSDP</b> — shards parameters and optimizer states.
              </li>
              <li>
                <b>Reduce model size</b> — last resort; consider a smaller variant.
              </li>
            </ol>
          </>)}

          {subhead("NaN Recovery Procedure")}
          {card(<>
            <ol style={{ fontSize:13, lineHeight:2.0, margin:0, paddingLeft:22, color:"var(--ink)" }}>
              <li>Check <code>torch.isnan(loss)</code> at each step — log before backward.</li>
              <li>Clip gradients: <code>clip_grad_norm_(params, max_norm=1.0)</code>.</li>
              <li>Switch from FP16 to BF16 — eliminates overflow entirely.</li>
              <li>Reduce learning rate by 10× temporarily and ramp back up.</li>
              <li>Inspect the data shard — corrupt tokens (all zeros, all same token) cause NaN.</li>
              <li>Roll back to the last clean checkpoint and skip the problematic data window.</li>
            </ol>
          </>)}

          {warn(<>
            Always checkpoint every 500–1000 steps during a long training run.
            At $3/GPU-hour, a 1024-GPU run costs $3,000/hour. Losing 6 hours due to
            a failure with no recent checkpoint = $18,000 of wasted compute.
          </>)}
        </>
      ),
    },

    /* ── STAGE 11 ── Memory Budget ──────────────────────────────────────────── */
    {
      id: "memory_budget",
      group: "Concepts",
      title: "Calculating Your Memory Budget",
      map: "Memory Budget",
      why: "Before launching a distributed job, calculate the exact memory requirements — parameters + optimizer states + activations — to know the minimum GPU count needed.",
      render: () => (
        <>
          <Lead>
            Before writing a single line of training code, calculate how much GPU memory
            your setup requires. The formula is straightforward:
            <b> memory = params + optimizer_states + activations + KV_cache (inference only)</b>.
            Underestimating leads to OOM crashes after hours of setup; overestimating wastes
            expensive GPU resources.
          </Lead>

          {subhead("The Master Formula")}
          {card(<>
            <div style={{ fontFamily:"monospace", fontSize:13, lineHeight:2.0, color:"var(--ink)" }}>
              <div><b>params_bytes</b> = num_params × bytes_per_param</div>
              <div><b>optimizer_bytes</b> = num_params × 16  <span style={{color:"var(--muted)"}}>(Adam FP32: 4+4+4+4)</span></div>
              <div><b>activation_bytes</b> = layers × batch × seq_len × d_model × 12  <span style={{color:"var(--muted)"}}>(BF16 + overhead)</span></div>
              <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid var(--line)" }}>
                <b>total_per_gpu</b> = (params_bytes + optimizer_bytes) / num_gpus + activation_bytes
              </div>
            </div>
          </>)}

          {subhead("Worked Example: 7B Model Training on 2 H100s with FSDP")}
          {tbl(<>
            <thead>
              <tr>
                {th("Component")}{th("Calculation")}{th("Total")}{th("Per GPU (FSDP, 2 GPU)")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("BF16 Parameters")}{td("7B × 2 bytes")}{td("14 GB")}{td("7 GB")}
              </tr>
              <tr>
                {td("Adam optimizer states")}{td("7B × 16 bytes")}{td("112 GB")}{td("56 GB")}
              </tr>
              <tr>
                {td("Activations (32 layers, B=2, T=4096)")}{td("32×2×4096×4096×12B")}{td("~13 GB")}{td("~13 GB (not sharded)")}
              </tr>
              <tr>
                {td("Gradient buffers")}{td("7B × 2 bytes (BF16)")}{td("14 GB")}{td("7 GB (FSDP sharded)")}
              </tr>
              <tr>
                {td("Total per GPU", { fontWeight:700 })}{td("—")}{td("—")}{td("~83 GB", { fontWeight:700, color:"#d97706" })}
              </tr>
              <tr>
                {td("H100 capacity")}{td("—")}{td("—")}{td("80 GB — TOO CLOSE", { color:"#dc2626", fontWeight:700 })}
              </tr>
            </tbody>
          </>)}

          {info(<>
            Enable activation checkpointing on this setup: activations drop from 13 GB to ~4 GB,
            bringing total to ~74 GB — safely within 80 GB with a 7.5% margin.
            Always leave at least 5–10% headroom for CUDA kernels, NCCL buffers, and fragmentation.
          </>)}

          {subhead("GPU Count Guide by Model Size (FSDP, Adam, BF16, Act. Ckpt.)")}
          {tbl(<>
            <thead>
              <tr>
                {th("Model Size")}{th("Params mem (BF16)")}{th("Adam states")}{th("Min GPUs")}{th("Recommended")}{th("Notes")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("1B")}{td("2 GB")}{td("16 GB")}{td("1")}{td("1 H100")}{td("Fits easily; no FSDP needed")}
              </tr>
              <tr>
                {td("7B")}{td("14 GB")}{td("112 GB")}{td("2")}{td("4–8 H100s")}{td("2 GPUs with act.ckpt; 4 for comfort")}
              </tr>
              <tr>
                {td("13B")}{td("26 GB")}{td("208 GB")}{td("4")}{td("8 H100s")}{td("4 GPUs tight; 8 recommended")}
              </tr>
              <tr>
                {td("70B")}{td("140 GB")}{td("1,120 GB")}{td("16")}{td("64 H100s")}{td("Need FSDP + TP; 64 for throughput")}
              </tr>
              <tr>
                {td("175B")}{td("350 GB")}{td("2,800 GB")}{td("40")}{td("256–512 H100s")}{td("3D parallelism required")}
              </tr>
            </tbody>
          </>)}

          {subhead("Rule of Thumb")}
          {card(<>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              For an N-parameter model trained with Adam in BF16 with FSDP and activation
              checkpointing on H100s:
            </p>
            <div style={{ fontFamily:"monospace", fontSize:13, margin:"10px 0", padding:"8px 14px",
              background:"rgba(43,91,255,.07)", borderRadius:8, color:"var(--ink)" }}>
              min_gpus = ceil((N × 18 bytes) / (80 GB × 0.85))
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"var(--ink)" }}>
              The 18 bytes accounts for: 2 (BF16 param) + 16 (Adam FP32 states).
              The 0.85 factor is a safety margin for activations, NCCL buffers, and overhead.
              For training throughput (not just fitting), multiply min_gpus by 2–4×.
            </p>
          </>)}
        </>
      ),
    },

    /* ── STAGE 12 ── Validation & Monitoring ────────────────────────────────── */
    {
      id: "validation",
      group: "Evaluation",
      title: "Validating & Monitoring a Distributed Run",
      map: "Validation",
      why: "A distributed run can be silently wrong — a desynced rank or bad all-reduce gives plausible-looking loss curves. You validate throughput efficiency AND numerical correctness, not just that the loss goes down.",
      render: () => (
        <>
          <Lead>
            Evaluating a distributed training run has two axes: is it <b>fast</b> (hardware
            efficiency) and is it <b>correct</b> (matches what a single-GPU run would compute).
            A run that trains quickly but computes the wrong gradients is worse than no run at all,
            because the bug stays hidden behind a loss curve that still trends down.
          </Lead>

          {subhead("Throughput — MFU (Model FLOPs Utilization)")}
          <p style={{ fontSize:13, lineHeight:1.8, color:"var(--ink)", marginBottom:10 }}>
            MFU is achieved FLOPs divided by peak hardware FLOPs — what fraction of the GPU's
            theoretical compute you are actually using. Per step, the model FLOPs for a dense
            model are approximately <b>6 × N × tokens</b> (N = number of parameters):
            roughly 2 for the forward pass and 4 for the backward pass, per parameter per token.
            Divide observed FLOPs by (num_gpus × peak_flops × step_time) to get MFU.
            Good large-scale runs hit <b>40-55% MFU</b>.
          </p>
          {codeBlock(
"# Model FLOPs Utilization (dense model)\n" +
"# model FLOPs per step ~= 6 * N * tokens_per_step\n" +
"model_flops = 6 * num_params * tokens_per_step\n" +
"\n" +
"# hardware FLOPs available during that step\n" +
"hw_flops = num_gpus * peak_flops_per_gpu * step_time_seconds\n" +
"\n" +
"mfu = model_flops / hw_flops   # e.g. 0.40 - 0.55 is healthy\n" +
"\n" +
"# also track per-GPU throughput\n" +
"tokens_per_sec_per_gpu = tokens_per_step / (step_time_seconds * num_gpus)\n" +
"tflops_per_gpu = (model_flops / step_time_seconds) / num_gpus / 1e12"
          )}
          <p style={{ fontSize:13, lineHeight:1.8, color:"var(--ink)", marginBottom:10 }}>
            Alongside MFU, track <b>tokens/sec/GPU</b> and <b>TFLOPS/GPU</b>. For reference,
            Llama 3 sustained <b>over 400 TFLOPS/GPU</b> on H100 — a useful target to compare against.
          </p>

          {subhead("Correctness — Loss-Curve Parity")}
          <p style={{ fontSize:13, lineHeight:1.8, color:"var(--ink)", marginBottom:10 }}>
            A distributed run should produce (nearly) the same loss curve as a small single-GPU
            reference for the first N steps. Divergence signals a bug in sharding, gradient
            synchronization, or data ordering — not a hardware quirk. Also check that the
            <b> gradient norm is consistent across ranks</b>: because gradients are all-reduced,
            every rank should hold an identical gradient (and therefore an identical grad norm)
            after synchronization. If two ranks report different grad norms, the all-reduce is broken.
          </p>

          {subhead("Scaling Efficiency")}
          {tbl(<>
            <thead>
              <tr>
                {th("Concept")}{th("Meaning")}{th("Healthy")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Strong scaling")}{td("Fixed problem, more GPUs should finish faster")}{td("Near-linear is ideal")}
              </tr>
              <tr>
                {td("Weak scaling")}{td("Grow the problem along with the GPU count")}{td("Constant time = ideal")}
              </tr>
              <tr>
                {td("Communication overhead")}{td("Percent of each step spent in comms")}{td("Under 20% is good")}
              </tr>
              <tr>
                {td("Bubble / idle")}{td("Pipeline gaps where GPUs wait")}{td("Minimized via 1F1B")}
              </tr>
            </tbody>
          </>)}

          {subhead("Common Silent Failures")}
          {warn(<>
            These bugs do not crash the job — they quietly corrupt it:
            <ul style={{ margin:"8px 0 0", paddingLeft:20, lineHeight:1.8 }}>
              <li><b>Rank desync</b> — ranks see different data at an epoch boundary.</li>
              <li><b>NaN on one rank</b> poisoning the all-reduce, spreading to every rank.</li>
              <li><b>Dropped gradients</b> from a hung NCCL collective that silently times out.</li>
              <li><b>Non-deterministic data loader</b> making runs unreproducible.</li>
            </ul>
            <div style={{ marginTop:8 }}>
              <b>Mitigation:</b> periodic cross-rank checksum of weights, deterministic seeding,
              and gradient-norm / loss-spike alerting.
            </div>
          </>)}

          {info(<>
            Always run a tiny single-GPU baseline first and confirm the multi-GPU loss matches
            it before scaling to thousands of GPUs. Catching a sharding or sync bug at 1 GPU costs
            minutes; catching it at 1000 GPUs costs a fortune in wasted GPU-hours.
          </>)}
        </>
      ),
    },

    /* ── STAGE 13 ── Production Config ──────────────────────────────────────── */
    {
      id: "production_config",
      group: "Code",
      title: "Production Distributed Training Config",
      map: "Prod Config",
      why: "A complete production distributed training setup requires torch.distributed initialization, FSDP wrapping, a mixed-precision policy, and a fault-tolerant training loop.",
      render: () => (
        <>
          <Lead>
            A production distributed training job is more than just calling <code>DDP(model)</code>.
            It requires: proper <code>torch.distributed</code> initialization, FSDP wrapping with
            an explicit sharding strategy, mixed-precision policy, gradient clipping, checkpoint
            saving, and a fault-tolerant training loop. Here is a complete annotated template.
          </Lead>

          {subhead("Launch Commands")}
          {codeBlock(
"# torchrun (recommended for PyTorch >= 1.10)\n" +
"torchrun \\\n" +
"  --nproc_per_node 8 \\\n" +
"  --nnodes 4 \\\n" +
"  --node_rank $NODE_RANK \\\n" +
"  --master_addr $MASTER_ADDR \\\n" +
"  --master_port 29500 \\\n" +
"  train.py --config config.yaml\n" +
"\n" +
"# OR: HuggingFace Accelerate (higher-level wrapper)\n" +
"accelerate launch \\\n" +
"  --config_file accelerate_config.yaml \\\n" +
"  --num_processes 32 \\\n" +
"  train.py"
          )}

          {subhead("PyTorch FSDP Setup")}
          {codeBlock(
"import torch\n" +
"import torch.distributed as dist\n" +
"from torch.distributed.fsdp import FullyShardedDataParallel as FSDP\n" +
"from torch.distributed.fsdp import ShardingStrategy, MixedPrecision\n" +
"from torch.distributed.fsdp.wrap import transformer_auto_wrap_policy\n" +
"\n" +
"# 1. Initialize process group\n" +
"dist.init_process_group(backend='nccl')\n" +
"rank = dist.get_rank()\n" +
"torch.cuda.set_device(rank % torch.cuda.device_count())\n" +
"\n" +
"# 2. Mixed precision policy (BF16 compute, FP32 reduce)\n" +
"mp_policy = MixedPrecision(\n" +
"    param_dtype=torch.bfloat16,\n" +
"    reduce_dtype=torch.float32,\n" +
"    buffer_dtype=torch.bfloat16,\n" +
")\n" +
"\n" +
"# 3. FSDP wrap with transformer block policy\n" +
"from model import TransformerBlock  # your layer class\n" +
"wrap_policy = transformer_auto_wrap_policy(\n" +
"    transformer_layer_cls={TransformerBlock}\n" +
")\n" +
"\n" +
"model = FSDP(\n" +
"    model,\n" +
"    sharding_strategy=ShardingStrategy.FULL_SHARD,  # ZeRO-3\n" +
"    mixed_precision=mp_policy,\n" +
"    auto_wrap_policy=wrap_policy,\n" +
"    device_id=torch.cuda.current_device(),\n" +
"    use_orig_params=True,  # required for some optimizers\n" +
")\n" +
"\n" +
"# 4. Activation checkpointing\n" +
"from torch.distributed.fsdp.wrap import apply_activation_checkpointing\n" +
"apply_activation_checkpointing(model, check_fn=lambda m: isinstance(m, TransformerBlock))"
          )}

          {subhead("Training Loop with Gradient Clipping and Checkpointing")}
          {codeBlock(
"optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.1)\n" +
"scaler = None  # no scaler needed for BF16 (only FP16 needs loss scaling)\n" +
"\n" +
"for step, batch in enumerate(dataloader):\n" +
"    # Gradient accumulation\n" +
"    is_accumulating = (step + 1) % grad_accum_steps != 0\n" +
"\n" +
"    with model.no_sync() if is_accumulating else contextlib.nullcontext():\n" +
"        with torch.autocast('cuda', dtype=torch.bfloat16):\n" +
"            loss = model(**batch).loss / grad_accum_steps\n" +
"        loss.backward()\n" +
"\n" +
"    if not is_accumulating:\n" +
"        # Clip gradients across FSDP shards\n" +
"        grad_norm = model.clip_grad_norm_(max_norm=1.0)\n" +
"\n" +
"        # Log gradient health\n" +
"        if rank == 0:\n" +
"            print(f'step={step} loss={loss.item():.4f} grad_norm={grad_norm:.3f}')\n" +
"\n" +
"        optimizer.step()\n" +
"        optimizer.zero_grad()\n" +
"\n" +
"    # Checkpoint every 500 steps\n" +
"    if step % 500 == 0:\n" +
"        save_checkpoint(model, optimizer, step, rank)"
          )}

          {subhead("Key Hyperparameters for Distributed Training")}
          {tbl(<>
            <thead>
              <tr>
                {th("Parameter")}{th("Typical Value")}{th("Distributed-Specific Note")}
              </tr>
            </thead>
            <tbody>
              <tr>
                {td("Learning rate")}{td("1e-4 to 3e-4")}{td("Scale with sqrt(batch_size / baseline_batch)")}
              </tr>
              <tr>
                {td("LR warmup steps")}{td("500–2000")}{td("Longer warmup for larger batch sizes")}
              </tr>
              <tr>
                {td("Gradient clip norm")}{td("1.0")}{td("Use model.clip_grad_norm_() for FSDP (not torch.nn.utils)")}
              </tr>
              <tr>
                {td("Weight decay")}{td("0.1")}{td("Same across all parallel strategies")}
              </tr>
              <tr>
                {td("Grad accum steps")}{td("16–128")}{td("Higher = fewer AllReduces = better hardware utilization")}
              </tr>
              <tr>
                {td("Checkpoint interval")}{td("Every 500 steps")}{td("Balance recovery cost vs storage cost")}
              </tr>
              <tr>
                {td("NCCL timeout")}{td("1800s")}{td("Set NCCL_TIMEOUT env var; default (30s) is too short")}
              </tr>
            </tbody>
          </>)}

          {subhead("Pre-Launch Checklist")}
          {card(<>
            <ul style={{ fontSize:13, lineHeight:2.0, margin:0, paddingLeft:20, color:"var(--ink)" }}>
              <li>Calculate memory budget and verify it fits on target GPUs with margin</li>
              <li>Test with 1 GPU and micro_batch=1 first — confirm forward/backward runs</li>
              <li>Test with 2 GPUs — confirm FSDP AllGather and Reduce-Scatter work</li>
              <li>Profile with <code>torch.profiler</code> on 100 steps — check GPU utilization and AllReduce overlap</li>
              <li>Confirm checkpoint save/load round-trips correctly across ranks</li>
              <li>Set <code>NCCL_DEBUG=INFO</code> for first full run — diagnose any comm issues</li>
              <li>Verify data pipeline delivers tokens fast enough (GPU should not wait for data)</li>
              <li>Confirm gradient norm stays in a reasonable range (0.5–5.0) in the first 100 steps</li>
              <li>Set up monitoring: loss, grad_norm, throughput (tokens/sec), GPU utilization per rank</li>
            </ul>
          </>)}

          <Note>
            The most common mistake in production distributed training is forgetting
            to use <code>model.no_sync()</code> during gradient accumulation steps.
            Without it, FSDP triggers an AllReduce on every backward pass — K× more
            communication than necessary for K gradient accumulation steps.
          </Note>
        </>
      ),
    },

  ]; // end STAGES

  window.ML_META = {
    title: "Distributed LLM Training",
    subtitle: "Data, tensor, and pipeline parallelism across GPU clusters",
    cur: "Distributed",
    category: "LLM Training",
    run: () => ({}),
    default: {},
    renderInput: null,
    modeLinks: [
      { label: "Pre-Training",  href: "LLM-PreTraining.html",        active: false },
      { label: "Distributed",   href: "Distributed-Training.html",   active: true  },
      { label: "Quantization",  href: "Quantization.html",           active: false },
      { label: "MoE",           href: "Mixture-of-Experts.html",     active: false },
      { label: "Post-Training", href: "Post-Training.html",          active: false },
      { label: "Distillation",  href: "Knowledge-Distillation.html", active: false },
      { label: "Embeddings",    href: "Embedding-Models.html",       active: false },
      { label: "Reasoning",     href: "Reasoning-Models.html",       active: false },
      { label: "Production",    href: "Production-Safety.html",       active: false },
    ],
  };

  window.ML_STAGES = STAGES;
})();
