/* ============================================================
   NVIDIA GPU Architecture — stages-gpu.jsx (13 stages)
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

  /* --- small SVG helpers --- */
  const svgWrap = (children, vb, h) => (
    <div style={{ overflowX:"auto", margin:"10px 0", textAlign:"center" }}>
      <svg viewBox={vb} style={{ width:"100%", maxWidth:760, height:(h||"auto") }}
        fontFamily="var(--font-mono, monospace)">{children}</svg>
    </div>
  );

  const COL = {
    accent:"#2b5bff", green:"#1f9d57", purple:"#7a3cff", orange:"#e07c1f",
    teal:"#188a8a", red:"#d23b3b", grayBox:"#eef1f8", grayLine:"#c8cfe0",
    ink:"#1a2238", muted:"#5a6480"
  };

  const STAGES = [

    /* ---------------- 1. OVERVIEW ---------------- */
    {
      id:"overview", group:"Overview", map:"Overview",
      title:"Why Understand the GPU?",
      why:"GPUs are the engine of deep learning. Every training run and serving deployment ultimately lives or dies by how well it keeps the GPU's compute units fed. Understanding the hardware is what separates a 20% utilized job from a 60% one.",
      render: () => (
        <div>
          <Lead>A CPU is a sprinter; a GPU is an army. Deep learning is embarrassingly parallel matrix math, so the army wins — but only if you keep every soldier busy.</Lead>

          {card(<div>
            {subhead("Two design philosophies")}
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              A <b>CPU</b> dedicates most of its silicon to control logic, branch prediction and large caches.
              It has a few very powerful cores tuned to finish a single thread of work as fast as possible —
              optimized for <b>latency</b> on serial, branchy code.
            </p>
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              A <b>GPU</b> spends its silicon on thousands of small arithmetic lanes. Each lane is weak, but
              there are so many that aggregate <b>throughput</b> is enormous. It runs the same instruction across
              many data elements at once — the <b>SIMT</b> model (Single Instruction, Multiple Threads).
            </p>
          </div>)}

          {svgWrap(<g>
            <text x="190" y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill={COL.ink}>CPU — few fat cores</text>
            <text x="570" y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill={COL.ink}>GPU — thousands of tiny lanes</text>
            {/* CPU: 4 big cores */}
            {[0,1].map(r=>[0,1].map(c=>(
              <g key={"cpu"+r+c}>
                <rect x={70+c*120} y={40+r*90} width="100" height="70" rx="8"
                  fill={COL.grayBox} stroke={COL.accent} strokeWidth="2"/>
                <text x={120+c*120} y={80+r*90} textAnchor="middle" fontSize="11" fill={COL.muted}>core</text>
              </g>
            )))}
            {/* GPU: dense grid */}
            {Array.from({length:8}).map((_,r)=>Array.from({length:14}).map((_,c)=>(
              <rect key={"g"+r+c} x={400+c*15} y={40+r*15} width="11" height="11" rx="2"
                fill={COL.green} opacity="0.85"/>
            )))}
            <text x="190" y="218" textAnchor="middle" fontSize="10.5" fill={COL.muted}>latency-optimized, serial</text>
            <text x="570" y="218" textAnchor="middle" fontSize="10.5" fill={COL.muted}>throughput-optimized, parallel</text>
          </g>, "0 0 760 230")}

          {info(<span>Every later stage answers one question: <b>are the compute units (tensor cores) busy, or are they
            waiting on memory?</b> That single distinction drives almost all GPU performance work.</span>)}
        </div>
      )
    },

    /* ---------------- 2. DIE LAYOUT ---------------- */
    {
      id:"die_layout", group:"Architecture", map:"GPU Layout",
      title:"Inside the Chip — From GPCs to SMs",
      why:"The GPU die is a hierarchy of compute clusters wrapped in a sea of memory. Knowing where the SMs, L2 cache and HBM stacks sit explains why on-chip data is cheap and off-chip data is expensive.",
      render: () => (
        <div>
          <Lead>Zoom into an H100 and you find a fractal of compute: the chip splits into GPCs, which split into TPCs, which contain the real workhorses — the Streaming Multiprocessors (SMs).</Lead>

          {card(<div>
            {subhead("The hierarchy")}
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              chip → <b>GPCs</b> (Graphics Processing Clusters) → <b>TPCs</b> (Texture Processing Clusters)
              → <b>SMs</b> (Streaming Multiprocessors). Surrounding the SM array is a chip-wide <b>L2 cache</b>,
              <b> memory controllers</b>, and stacks of <b>HBM</b> (High-Bandwidth Memory) bonded next to the die.
              <b> NVLink</b> and <b>PCIe</b> sit at the edges for talking to other GPUs and the host.
            </p>
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              An H100 SXM exposes about <b>132 active SMs</b> (144 are physically present; some are disabled for yield),
              <b> 80 GB HBM3</b> at roughly <b>3.35 TB/s</b>, and <b>50 MB</b> of L2.
            </p>
          </div>)}

          {svgWrap(<g>
            {/* HBM stacks left/right */}
            {[0,1,2].map(i=>(<g key={"hl"+i}>
              <rect x="20" y={40+i*65} width="70" height="50" rx="6" fill="#fbe9d6" stroke={COL.orange} strokeWidth="1.5"/>
              <text x="55" y={62+i*65} textAnchor="middle" fontSize="10" fill={COL.orange}>HBM3</text>
              <text x="55" y={76+i*65} textAnchor="middle" fontSize="8.5" fill={COL.muted}>stack</text>
            </g>))}
            {[0,1,2].map(i=>(<g key={"hr"+i}>
              <rect x="670" y={40+i*65} width="70" height="50" rx="6" fill="#fbe9d6" stroke={COL.orange} strokeWidth="1.5"/>
              <text x="705" y={62+i*65} textAnchor="middle" fontSize="10" fill={COL.orange}>HBM3</text>
              <text x="705" y={76+i*65} textAnchor="middle" fontSize="8.5" fill={COL.muted}>stack</text>
            </g>))}
            {/* L2 band */}
            <rect x="110" y="40" width="540" height="22" rx="4" fill="#e6e0ff" stroke={COL.purple} strokeWidth="1.5"/>
            <text x="380" y="55" textAnchor="middle" fontSize="10" fill={COL.purple} fontWeight="700">L2 cache (50 MB)</text>
            {/* SM grid */}
            {Array.from({length:4}).map((_,r)=>Array.from({length:11}).map((_,c)=>(
              <rect key={"sm"+r+c} x={120+c*48} y={72+r*28} width="42" height="22" rx="3"
                fill={COL.grayBox} stroke={COL.green} strokeWidth="1.3"/>
            )))}
            <text x="380" y="200" textAnchor="middle" fontSize="10.5" fill={COL.muted}>SM array (~132 SMs)</text>
            {/* L2 band bottom + nvlink */}
            <rect x="110" y="210" width="540" height="22" rx="4" fill="#dff3ec" stroke={COL.teal} strokeWidth="1.5"/>
            <text x="380" y="225" textAnchor="middle" fontSize="10" fill={COL.teal} fontWeight="700">NVLink 900 GB/s  +  PCIe (to host)</text>
          </g>, "0 0 760 245")}

          {info(<span>Notice the geometry: compute lives in the <b>middle</b>, memory wraps the <b>outside</b>. Data has
            to travel — and distance costs bandwidth and latency. That layout is the physical root of the memory wall.</span>)}
        </div>
      )
    },

    /* ---------------- 3. THE SM ---------------- */
    {
      id:"sm", group:"Architecture", map:"The SM",
      title:"The Streaming Multiprocessor",
      why:"The SM is the GPU's actual core — the unit that schedules and executes work. Everything about occupancy, registers and shared memory is really a story about resources inside one SM.",
      render: () => (
        <div>
          <Lead>If the chip is a factory, the SM is one production floor: it has its own schedulers, its own scratchpad memory, and its own banks of arithmetic units.</Lead>

          {card(<div>
            {subhead("What's inside one SM")}
            <ul style={{fontSize:13.5, lineHeight:1.7, margin:"0 0 0 18px"}}>
              <li><b>CUDA cores</b> — scalar FP32 / INT32 ALUs that do ordinary arithmetic (fused multiply-add).</li>
              <li><b>Tensor Cores</b> — dedicated matrix multiply-accumulate (MMA) units; the matmul engines.</li>
              <li><b>Warp schedulers + dispatch units</b> — pick a ready warp each cycle and issue its instruction.</li>
              <li><b>Register file</b> — very large (256 KB/SM on H100), private per-thread, fastest storage there is.</li>
              <li><b>L1 cache / shared memory</b> — on-chip SRAM, configurable split, up to 228 KB/SM on H100.</li>
              <li><b>LD/ST units</b> — load/store units that move data between memory levels.</li>
              <li><b>SFU</b> — special function units for transcendentals (exp, sin, rsqrt, etc.).</li>
            </ul>
          </div>)}

          {svgWrap(<g>
            <rect x="20" y="20" width="720" height="270" rx="12" fill="none" stroke={COL.green} strokeWidth="2"/>
            <text x="380" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill={COL.ink}>One SM (4 processing blocks)</text>
            {/* 4 processing blocks */}
            {[0,1,2,3].map(i=>(
              <g key={"pb"+i}>
                <rect x={35+i*178} y="52" width="160" height="135" rx="8" fill={COL.grayBox} stroke={COL.grayLine}/>
                <rect x={45+i*178} y="62" width="140" height="22" rx="4" fill="#dde5ff"/>
                <text x={115+i*178} y="77" textAnchor="middle" fontSize="9.5" fill={COL.accent}>warp scheduler</text>
                <rect x={45+i*178} y="90" width="140" height="36" rx="4" fill="#dff3ec"/>
                <text x={115+i*178} y="104" textAnchor="middle" fontSize="9.5" fill={COL.teal}>CUDA cores</text>
                <text x={115+i*178} y="118" textAnchor="middle" fontSize="8.5" fill={COL.muted}>FP32 / INT32 ALUs</text>
                <rect x={45+i*178} y="132" width="140" height="26" rx="4" fill="#f0e6ff"/>
                <text x={115+i*178} y="149" textAnchor="middle" fontSize="9.5" fill={COL.purple}>Tensor Core</text>
                <rect x={45+i*178} y="162" width="65" height="18" rx="3" fill="#fff" stroke={COL.grayLine}/>
                <text x={77+i*178} y="174" textAnchor="middle" fontSize="8" fill={COL.muted}>LD/ST</text>
                <rect x={120+i*178} y="162" width="65" height="18" rx="3" fill="#fff" stroke={COL.grayLine}/>
                <text x={152+i*178} y="174" textAnchor="middle" fontSize="8" fill={COL.muted}>SFU</text>
              </g>
            ))}
            {/* shared register file */}
            <rect x="35" y="195" width="350" height="36" rx="6" fill="#fff3d6" stroke={COL.orange}/>
            <text x="210" y="213" textAnchor="middle" fontSize="10" fill={COL.orange} fontWeight="700">Register file (256 KB)</text>
            <text x="210" y="225" textAnchor="middle" fontSize="8.5" fill={COL.muted}>per-thread, fastest</text>
            <rect x="395" y="195" width="350" height="36" rx="6" fill="#ffe6e6" stroke={COL.red}/>
            <text x="570" y="213" textAnchor="middle" fontSize="10" fill={COL.red} fontWeight="700">L1 cache / shared memory (up to 228 KB)</text>
            <text x="570" y="225" textAnchor="middle" fontSize="8.5" fill={COL.muted}>on-chip SRAM, shared by a block</text>
          </g>, "0 0 760 305")}

          {info(<span>A thread block runs entirely on <b>one SM</b> and its threads share that SM's shared memory.
            The register file and shared memory are <b>finite</b> — how much each block needs decides how many blocks
            fit at once, which is exactly what occupancy measures (next).</span>)}
        </div>
      )
    },

    /* ---------------- 4. EXECUTION MODEL ---------------- */
    {
      id:"execution_model", group:"Execution", map:"Threads & Warps",
      title:"Threads, Warps, Blocks, Grids",
      why:"GPUs hide enormous memory latency not by avoiding it but by having so many warps ready that there's always one to run. Understanding warps, blocks and occupancy is understanding how the GPU stays busy.",
      render: () => (
        <div>
          <Lead>You write code for one thread. The GPU runs millions of them — bundled into warps, packed into blocks, spread across a grid.</Lead>

          {card(<div>
            {subhead("The SIMT execution hierarchy")}
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              Threads are grouped into <b>warps of 32</b> that execute in lockstep — one instruction, 32 data lanes.
              Warps are grouped into <b>thread blocks</b> that run on a single SM and share its shared memory.
              Blocks together form a <b>grid</b>, the whole kernel launch.
            </p>
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              Memory accesses take hundreds of cycles. The warp scheduler hides this by switching to another
              <b> resident warp</b> while one waits. Having many resident warps is <b>occupancy</b> — high occupancy
              means latency is always hidden behind useful work.
            </p>
          </div>)}

          {svgWrap(<g>
            {/* grid */}
            <rect x="20" y="30" width="200" height="160" rx="10" fill="none" stroke={COL.accent} strokeWidth="2"/>
            <text x="120" y="22" textAnchor="middle" fontSize="11" fontWeight="700" fill={COL.accent}>Grid</text>
            {Array.from({length:3}).map((_,r)=>Array.from({length:3}).map((_,c)=>(
              <rect key={"bk"+r+c} x={40+c*55} y={48+r*45} width="45" height="35" rx="4" fill={COL.grayBox} stroke={COL.green}/>
            )))}
            <text x="120" y="205" textAnchor="middle" fontSize="9" fill={COL.muted}>grid of blocks</text>
            {/* arrow */}
            <line x1="225" y1="110" x2="285" y2="110" stroke={COL.muted} strokeWidth="1.5" markerEnd="url(#arrG)"/>
            <defs><marker id="arrG" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={COL.muted}/></marker></defs>
            {/* block */}
            <rect x="290" y="40" width="160" height="140" rx="10" fill="none" stroke={COL.green} strokeWidth="2"/>
            <text x="370" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill={COL.green}>Block (on one SM)</text>
            {[0,1,2,3].map(i=>(
              <rect key={"wp"+i} x="305" y={52+i*30} width="130" height="22" rx="4" fill="#dde5ff" stroke={COL.accent}/>
            ))}
            <text x="370" y="68" textAnchor="middle" fontSize="9" fill={COL.accent}>warp</text>
            <text x="370" y="196" textAnchor="middle" fontSize="9" fill={COL.muted}>warps share shared memory</text>
            {/* arrow */}
            <line x1="455" y1="110" x2="515" y2="110" stroke={COL.muted} strokeWidth="1.5" markerEnd="url(#arrG)"/>
            {/* warp of 32 */}
            <rect x="520" y="40" width="220" height="140" rx="10" fill="none" stroke={COL.purple} strokeWidth="2"/>
            <text x="630" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill={COL.purple}>Warp = 32 threads</text>
            {Array.from({length:4}).map((_,r)=>Array.from({length:8}).map((_,c)=>(
              <rect key={"th"+r+c} x={532+c*25} y={52+r*28} width="20" height="22" rx="3" fill={COL.purple} opacity="0.8"/>
            )))}
            <text x="630" y="196" textAnchor="middle" fontSize="9" fill={COL.muted}>execute in lockstep (SIMT)</text>
          </g>, "0 0 760 215")}

          {tbl(<tbody>
            <tr>{th("Level")}{th("Size")}{th("Runs on")}{th("Shares")}</tr>
            <tr>{td("Thread")}{td("1 lane")}{td("a CUDA core lane")}{td("private registers only")}</tr>
            <tr>{td("Warp")}{td("32 threads")}{td("one warp scheduler")}{td("lockstep PC; can shuffle")}</tr>
            <tr>{td("Block")}{td("up to 1024 threads")}{td("one SM")}{td("shared memory + L1")}</tr>
            <tr>{td("Grid")}{td("many blocks")}{td("whole GPU")}{td("global memory (HBM)")}</tr>
          </tbody>)}

          {warn(<span><b>Warp divergence:</b> if threads in a warp take different branches of an
            <code> if</code>, the warp runs <i>both</i> paths serially with lanes masked off. Divergent code throws
            away the GPU's parallelism — keep branches uniform across a warp.</span>)}
        </div>
      )
    },

    /* ---------------- 5. MEMORY HIERARCHY ---------------- */
    {
      id:"memory_hierarchy", group:"Memory", map:"Memory",
      title:"The Memory Hierarchy & the Memory Wall",
      why:"For a huge class of deep-learning kernels, the bottleneck is not raw FLOPs but how fast you can move bytes from HBM. The whole craft of fast kernels is keeping data on-chip and re-using it.",
      render: () => (
        <div>
          <Lead>Memory gets bigger and slower as you move away from the core. The gap between on-chip SRAM and off-chip HBM is the single most important number in GPU performance.</Lead>

          {svgWrap(<g>
            {/* pyramid levels */}
            {[
              {w:170, y:30,  c:"#fff3d6", s:COL.orange, t:"Registers", d:"256 KB/SM · ~tens of TB/s · ~1 cycle"},
              {w:300, y:75,  c:"#ffe6e6", s:COL.red,    t:"Shared mem / L1 (SRAM)", d:"up to 228 KB/SM · ~tens of TB/s · ~30 cyc"},
              {w:430, y:120, c:"#e6e0ff", s:COL.purple, t:"L2 cache", d:"50 MB chip-wide · few TB/s · ~200 cyc"},
              {w:560, y:165, c:"#fbe9d6", s:COL.orange, t:"HBM / global memory", d:"80 GB · ~3.35 TB/s · ~400-800 ns"},
              {w:680, y:210, c:"#dff3ec", s:COL.teal,   t:"Host RAM (over PCIe / NVLink)", d:"100s of GB · ~tens of GB/s · slowest"},
            ].map((L,i)=>(
              <g key={"lv"+i}>
                <rect x={380-L.w/2} y={L.y} width={L.w} height="38" rx="6" fill={L.c} stroke={L.s} strokeWidth="1.6"/>
                <text x="380" y={L.y+17} textAnchor="middle" fontSize="11" fontWeight="700" fill={L.s}>{L.t}</text>
                <text x="380" y={L.y+31} textAnchor="middle" fontSize="9" fill={COL.muted}>{L.d}</text>
              </g>
            ))}
            <text x="50" y="55" fontSize="10" fill={COL.muted}>fast</text>
            <text x="50" y="225" fontSize="10" fill={COL.muted}>slow</text>
            <text x="715" y="55" fontSize="10" fill={COL.muted}>small</text>
            <text x="710" y="225" fontSize="10" fill={COL.muted}>big</text>
          </g>, "0 0 760 270")}

          {card(<div>
            {subhead("The memory wall")}
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              On-chip SRAM (registers, shared memory) is roughly an order of magnitude faster than HBM and has
              near-zero latency. HBM, despite a jaw-dropping 3.35 TB/s, is still far slower than the tensor cores can
              consume data — and every miss costs hundreds of nanoseconds.
            </p>
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              The result: for many DL kernels (elementwise ops, normalization, attention with small batch, single-token
              decode) the GPU's arithmetic units sit idle waiting for HBM. This is the <b>memory wall</b> — performance
              is bounded by <b>bandwidth</b>, not compute.
            </p>
          </div>)}

          {info(<span>The winning move, everywhere in this article: <b>load a tile of data into shared memory / registers
            once, then reuse it many times</b> before it leaves the chip. That's how matmul, FlashAttention and fused
            kernels all earn their speed.</span>)}
        </div>
      )
    },

    /* ---------------- 6. TENSOR CORES ---------------- */
    {
      id:"tensor_cores", group:"Compute", map:"Tensor Cores",
      title:"Tensor Cores — The Matmul Engines",
      why:"LLMs are almost entirely matrix multiplies, and tensor cores do matmul an order of magnitude faster than CUDA cores. If your tensor cores aren't busy, you're leaving most of the GPU on the table.",
      render: () => (
        <div>
          <Lead>A CUDA core multiplies two numbers. A tensor core multiplies two small matrices — in a single operation. That's the whole difference between teraflops and petaflops.</Lead>

          {card(<div>
            {subhead("What a tensor core does")}
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              A tensor core performs a tiled <b>matrix multiply-accumulate</b>: <code>D = A · B + C</code> over small
              tiles, in one hardware instruction (an MMA). Where a CUDA core issues one scalar fused-multiply-add per
              cycle, a tensor core completes a whole tile of FMAs — dramatically more arithmetic per cycle.
            </p>
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              They operate in reduced precision — <b>FP16, BF16, TF32, FP8, INT8</b> (and FP4 on Blackwell) — typically
              accumulating in higher precision (FP32) for stability. Because transformers are dominated by big matmuls,
              LLM training and inference are <b>tensor-core bound</b>: keeping these units fed is the goal.
            </p>
          </div>)}

          {svgWrap(<g>
            {/* CUDA core scalar FMA */}
            <text x="180" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill={COL.teal}>CUDA core: scalar FMA</text>
            <rect x="60" y="40" width="40" height="40" rx="5" fill="#dff3ec" stroke={COL.teal}/>
            <text x="80" y="64" textAnchor="middle" fontSize="11" fill={COL.teal}>a</text>
            <text x="120" y="64" textAnchor="middle" fontSize="14" fill={COL.muted}>×</text>
            <rect x="140" y="40" width="40" height="40" rx="5" fill="#dff3ec" stroke={COL.teal}/>
            <text x="160" y="64" textAnchor="middle" fontSize="11" fill={COL.teal}>b</text>
            <text x="200" y="64" textAnchor="middle" fontSize="14" fill={COL.muted}>+</text>
            <rect x="220" y="40" width="40" height="40" rx="5" fill="#fff3d6" stroke={COL.orange}/>
            <text x="240" y="64" textAnchor="middle" fontSize="11" fill={COL.orange}>c</text>
            <text x="180" y="110" textAnchor="middle" fontSize="10" fill={COL.muted}>1 multiply-add per op</text>

            {/* tensor core tile MMA */}
            <text x="560" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill={COL.purple}>Tensor core: tile MMA</text>
            {/* matrix A */}
            {Array.from({length:4}).map((_,r)=>Array.from({length:4}).map((_,c)=>(
              <rect key={"A"+r+c} x={400+c*14} y={40+r*14} width="12" height="12" fill="#f0e6ff" stroke={COL.purple} strokeWidth="0.6"/>
            )))}
            <text x="455" y="118" textAnchor="middle" fontSize="12" fill={COL.muted}>×</text>
            {Array.from({length:4}).map((_,r)=>Array.from({length:4}).map((_,c)=>(
              <rect key={"B"+r+c} x={470+c*14} y={40+r*14} width="12" height="12" fill="#f0e6ff" stroke={COL.purple} strokeWidth="0.6"/>
            )))}
            <text x="535" y="118" textAnchor="middle" fontSize="12" fill={COL.muted}>=</text>
            {Array.from({length:4}).map((_,r)=>Array.from({length:4}).map((_,c)=>(
              <rect key={"D"+r+c} x={555+c*14} y={40+r*14} width="12" height="12" fill="#e6ffe6" stroke={COL.green} strokeWidth="0.6"/>
            )))}
            <text x="560" y="118" textAnchor="middle" fontSize="10" fill={COL.muted}>a whole tile per op</text>
          </g>, "0 0 760 130")}

          {tbl(<tbody>
            <tr>{th("Precision")}{th("Rel. throughput")}{th("Typical use")}</tr>
            <tr>{td("FP64")}{td("baseline (1×)")}{td("HPC / scientific, rare in DL")}</tr>
            <tr>{td("TF32")}{td("~8× over FP32 path")}{td("drop-in faster training, free accuracy")}</tr>
            <tr>{td("FP16 / BF16")}{td("~2× over TF32")}{td("mainstream mixed-precision training")}</tr>
            <tr>{td("FP8")}{td("~2× over BF16")}{td("Hopper Transformer Engine, fast train/infer")}</tr>
            <tr>{td("INT8")}{td("~2× over BF16")}{td("quantized inference")}</tr>
            <tr>{td("FP4")}{td("~2× over FP8")}{td("Blackwell only, extreme inference throughput")}</tr>
          </tbody>)}

          {info(<span>Hopper's <b>Transformer Engine</b> automatically casts matmuls to <b>FP8</b> with per-tensor scaling,
            tracking ranges to stay numerically safe — often a near-2× speedup over BF16 with little accuracy loss.
            See <a href="Quantization.html">Quantization</a> for the precision details.</span>)}
        </div>
      )
    },

    /* ---------------- 7. HOW MATH WORKS ---------------- */
    {
      id:"how_math_works", group:"Compute", map:"Matmul on GPU",
      title:"How a Matrix Multiply Runs on the GPU",
      why:"GEMM (general matrix multiply) is the workload. Seeing how it is tiled across SMs and how data flows HBM → shared memory → tensor core → registers makes every optimization (reuse, fusion, FlashAttention) obvious.",
      render: () => (
        <div>
          <Lead>The output matrix is sliced into tiles. Each tile is one block's job. The trick to speed is loading input tiles into shared memory once and reusing them for many multiply-accumulates.</Lead>

          {card(<div>
            {subhead("Tiled GEMM, step by step")}
            <ol style={{fontSize:13.5, lineHeight:1.7, margin:"0 0 0 18px"}}>
              <li>Split output <b>C</b> into tiles. Each tile is assigned to a <b>thread block</b>, which runs on one SM.</li>
              <li>Threads cooperatively load matching sub-tiles of <b>A</b> and <b>B</b> from <b>HBM into shared memory</b>.</li>
              <li>The <b>tensor cores</b> perform MMA on the shared-memory tiles.</li>
              <li>Partial sums accumulate in <b>registers</b> as the block sweeps across the K dimension.</li>
              <li>When the tile is complete, the result is written back out to HBM.</li>
            </ol>
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              The win is <b>reuse</b>: a sub-tile loaded into shared memory feeds many MMAs before it's evicted, so you
              avoid re-reading the same bytes from HBM over and over. Bigger tiles = more reuse = higher arithmetic intensity.
            </p>
          </div>)}

          {svgWrap(<g>
            {/* C tiled */}
            <text x="130" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill={COL.green}>Output C, tiled</text>
            {Array.from({length:4}).map((_,r)=>Array.from({length:4}).map((_,c)=>(
              <rect key={"c"+r+c} x={50+c*40} y={35+r*40} width="36" height="36" rx="3"
                fill={(r===1&&c===2)?"#e6ffe6":COL.grayBox} stroke={(r===1&&c===2)?COL.green:COL.grayLine}
                strokeWidth={(r===1&&c===2)?"2.2":"1"}/>
            )))}
            <text x="130" y="205" textAnchor="middle" fontSize="9.5" fill={COL.muted}>one tile → one SM</text>
            {/* arrow */}
            <line x1="225" y1="120" x2="285" y2="120" stroke={COL.muted} strokeWidth="1.5" markerEnd="url(#arrM)"/>
            <defs><marker id="arrM" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={COL.muted}/></marker></defs>
            {/* dataflow inset */}
            <rect x="295" y="35" width="445" height="160" rx="10" fill="none" stroke={COL.accent} strokeWidth="1.6"/>
            <text x="517" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill={COL.accent}>Data flow inside the SM</text>
            <rect x="315" y="55" width="95" height="40" rx="6" fill="#fbe9d6" stroke={COL.orange}/>
            <text x="362" y="72" textAnchor="middle" fontSize="9.5" fill={COL.orange} fontWeight="700">HBM</text>
            <text x="362" y="86" textAnchor="middle" fontSize="8.5" fill={COL.muted}>A, B tiles</text>
            <line x1="410" y1="75" x2="445" y2="75" stroke={COL.muted} strokeWidth="1.4" markerEnd="url(#arrM)"/>
            <rect x="450" y="55" width="95" height="40" rx="6" fill="#ffe6e6" stroke={COL.red}/>
            <text x="497" y="72" textAnchor="middle" fontSize="9.5" fill={COL.red} fontWeight="700">Shared mem</text>
            <text x="497" y="86" textAnchor="middle" fontSize="8.5" fill={COL.muted}>reused tiles</text>
            <line x1="545" y1="75" x2="580" y2="75" stroke={COL.muted} strokeWidth="1.4" markerEnd="url(#arrM)"/>
            <rect x="585" y="55" width="135" height="40" rx="6" fill="#f0e6ff" stroke={COL.purple}/>
            <text x="652" y="72" textAnchor="middle" fontSize="9.5" fill={COL.purple} fontWeight="700">Tensor core (MMA)</text>
            <text x="652" y="86" textAnchor="middle" fontSize="8.5" fill={COL.muted}>D = A·B + C</text>
            <line x1="652" y1="95" x2="652" y2="125" stroke={COL.muted} strokeWidth="1.4" markerEnd="url(#arrM)"/>
            <rect x="560" y="130" width="160" height="38" rx="6" fill="#fff3d6" stroke={COL.orange}/>
            <text x="640" y="147" textAnchor="middle" fontSize="9.5" fill={COL.orange} fontWeight="700">Registers</text>
            <text x="640" y="161" textAnchor="middle" fontSize="8.5" fill={COL.muted}>accumulate partial sums</text>
            <text x="430" y="185" textAnchor="middle" fontSize="9" fill={COL.muted}>reuse in shared mem avoids re-reading HBM</text>
          </g>, "0 0 760 215")}

          {info(<span>This is exactly why <b>FlashAttention</b> is fast: it keeps the attention tiles in shared memory and
            fuses the softmax, never materializing the full attention matrix in HBM. Same principle, applied to attention.</span>)}
        </div>
      )
    },

    /* ---------------- 8. ROOFLINE ---------------- */
    {
      id:"roofline", group:"Performance", map:"Roofline",
      title:"Roofline: Compute-bound vs Memory-bound",
      why:"Before optimizing anything, you must know which wall you're hitting. The roofline model turns 'is this kernel limited by FLOPs or by bandwidth?' into one number and one picture.",
      render: () => (
        <div>
          <Lead>Every kernel sits somewhere on the roofline. To its left, it's starved for bandwidth; to its right, it's maxing out the math units. The fix is completely different on each side.</Lead>

          {card(<div>
            {subhead("Arithmetic intensity & the roofline")}
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              <b>Arithmetic Intensity (AI)</b> = FLOPs performed / bytes moved from memory. A kernel's achievable
              performance is the lower of two roofs: the <b>memory-bandwidth roof</b> (a diagonal: AI × bandwidth) and
              the <b>compute roof</b> (a flat ceiling at peak FLOPs). They meet at the <b>ridge point</b>.
            </p>
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              Low AI lands you left of the ridge — <b>memory-bound</b>. High AI lands you right — <b>compute-bound</b>.
              Big training/prefill GEMMs reuse data heavily, so they're compute-bound. Single-token <b>decode</b> reads
              the whole weight matrix to do one tiny matmul, so AI is tiny → memory-bound.
            </p>
          </div>)}

          {svgWrap(<g>
            {/* axes */}
            <line x1="80" y1="240" x2="700" y2="240" stroke={COL.ink} strokeWidth="1.5"/>
            <line x1="80" y1="240" x2="80" y2="30" stroke={COL.ink} strokeWidth="1.5"/>
            <text x="390" y="270" textAnchor="middle" fontSize="11" fill={COL.muted}>Arithmetic Intensity (FLOPs / byte) →</text>
            <text x="30" y="135" textAnchor="middle" fontSize="11" fill={COL.muted} transform="rotate(-90 30 135)">Attainable FLOP/s →</text>
            {/* bandwidth diagonal */}
            <line x1="80" y1="240" x2="390" y2="70" stroke={COL.orange} strokeWidth="3"/>
            {/* compute ceiling */}
            <line x1="390" y1="70" x2="700" y2="70" stroke={COL.purple} strokeWidth="3"/>
            <text x="200" y="150" fontSize="10" fill={COL.orange} transform="rotate(-29 200 150)">bandwidth roof</text>
            <text x="520" y="60" fontSize="10" fill={COL.purple}>compute roof (peak FLOPs)</text>
            {/* ridge */}
            <circle cx="390" cy="70" r="4" fill={COL.ink}/>
            <text x="390" y="58" textAnchor="middle" fontSize="9" fill={COL.ink}>ridge point</text>
            {/* markers */}
            <circle cx="170" cy="173" r="6" fill={COL.red}/>
            <text x="170" y="200" textAnchor="middle" fontSize="9.5" fill={COL.red} fontWeight="700">decode</text>
            <text x="170" y="213" textAnchor="middle" fontSize="8.5" fill={COL.muted}>memory-bound</text>
            <circle cx="560" cy="70" r="6" fill={COL.green}/>
            <text x="560" y="95" textAnchor="middle" fontSize="9.5" fill={COL.green} fontWeight="700">training GEMM</text>
            <text x="560" y="108" textAnchor="middle" fontSize="8.5" fill={COL.muted}>compute-bound</text>
          </g>, "0 0 760 285")}

          {tbl(<tbody>
            <tr>{th("Metric")}{th("Measures")}{th("Good when")}</tr>
            <tr>{td("MFU (Model FLOPs Utilization)")}{td("fraction of peak FLOPs actually used")}{td("compute-bound work, e.g. training")}</tr>
            <tr>{td("MBU (Memory Bandwidth Utilization)")}{td("fraction of peak HBM bandwidth used")}{td("memory-bound work, e.g. decode")}</tr>
          </tbody>)}

          {info(<span>Practical takeaway: if you're <b>memory-bound</b>, raise arithmetic intensity (batch more, quantize,
            fuse kernels). If you're <b>compute-bound</b>, you're already near the hardware's limit — switch to faster
            precision (FP8) or a bigger GPU.</span>)}
        </div>
      )
    },

    /* ---------------- 9. HOPPER ---------------- */
    {
      id:"hopper", group:"Architecture", map:"Hopper Features",
      title:"Hopper-Specific Features",
      why:"H100 (Hopper) added hardware specifically for transformers and large-scale data movement. These features are why Hopper is so much faster than Ampere on LLM workloads beyond the raw FLOP increase.",
      render: () => (
        <div>
          <Lead>Hopper isn't just 'Ampere with more cores.' It added units aimed squarely at transformers: an FP8 engine, async bulk memory movers, and SM-to-SM cooperation.</Lead>

          {tbl(<tbody>
            <tr>{th("Feature")}{th("What it does")}{th("What it accelerates")}</tr>
            <tr>{td("4th-gen Tensor Cores")}{td("more throughput, native FP8")}{td("all matmul-heavy LLM work")}</tr>
            <tr>{td("Transformer Engine")}{td("auto FP8 with per-tensor scaling")}{td("transformer training & inference")}</tr>
            <tr>{td("TMA (Tensor Memory Accelerator)")}{td("async bulk copies HBM ↔ shared mem")}{td("frees threads; overlaps load with compute")}</tr>
            <tr>{td("Thread block clusters")}{td("groups of blocks cooperate across SMs")}{td("larger working sets, better locality")}</tr>
            <tr>{td("Distributed shared memory")}{td("an SM can read another SM's shared mem")}{td("cross-SM data reuse within a cluster")}</tr>
            <tr>{td("Async copy")}{td("non-blocking global→shared loads")}{td("hides memory latency in pipelines")}</tr>
            <tr>{td("NVLink 4.0")}{td("900 GB/s GPU-to-GPU")}{td("multi-GPU training & tensor parallelism")}</tr>
          </tbody>)}

          {card(<div>
            {subhead("Why these matter together")}
            <p style={{fontSize:13.5, lineHeight:1.6}}>
              The Transformer Engine cuts the bytes and cycles per matmul; TMA and async copy keep the tensor cores fed
              without burning threads on address math; block clusters and distributed shared memory let bigger tiles
              stay on-chip across multiple SMs. Each one chips away at the memory wall from a different angle.
            </p>
          </div>)}

          {info(<span>The successor, <b>Blackwell (B200)</b>, pushes further: native <b>FP4</b>, a 2nd-gen Transformer
            Engine, far higher throughput, and <b>NVLink 5</b> at ~1.8 TB/s. Same playbook — more precision options,
            more bandwidth, more on-chip cooperation.</span>)}
        </div>
      )
    },

    /* ---------------- 10. SPECS ---------------- */
    {
      id:"specs", group:"Architecture", map:"Spec Sheet",
      title:"A100 vs H100 vs B200",
      why:"A side-by-side makes the generational jumps concrete: more SMs, faster memory, and crucially new precisions (FP8 on Hopper, FP4 on Blackwell) that multiply effective throughput.",
      render: () => (
        <div>
          <Lead>Three generations, one trend: more SMs, faster HBM, faster NVLink — and each generation unlocks a lower-precision format that doubles tensor-core throughput.</Lead>

          {tbl(<tbody>
            <tr>{th("Spec (approximate)")}{th("A100 (Ampere)")}{th("H100 SXM (Hopper)")}{th("B200 (Blackwell)")}</tr>
            <tr>{td("Active SMs")}{td("108")}{td("~132")}{td("more (dual-die)")}</tr>
            <tr>{td("FP32 CUDA cores")}{td("6,912")}{td("~16,896")}{td("higher")}</tr>
            <tr>{td("Tensor Cores")}{td("432 (3rd gen)")}{td("528 (4th gen)")}{td("5th gen")}</tr>
            <tr>{td("Memory")}{td("40/80 GB HBM2e")}{td("80 GB HBM3")}{td("HBM3e (larger)")}</tr>
            <tr>{td("Bandwidth")}{td("~1.55-2.0 TB/s")}{td("~3.35 TB/s")}{td("much higher")}</tr>
            <tr>{td("L2 cache")}{td("40 MB")}{td("50 MB")}{td("larger")}</tr>
            <tr>{td("NVLink")}{td("600 GB/s")}{td("900 GB/s (v4)")}{td("~1.8 TB/s (v5)")}</tr>
            <tr>{td("BF16 (dense)")}{td("~312 TFLOPS")}{td("~990 TFLOPS")}{td("much higher")}</tr>
            <tr>{td("FP8 (dense)")}{td("not supported")}{td("~1,979 TFLOPS")}{td("higher")}</tr>
            <tr>{td("FP4")}{td("no")}{td("no")}{td("yes")}</tr>
            <tr>{td("FP64")}{td("~19.5 TFLOPS")}{td("~67 TFLOPS")}{td("higher")}</tr>
          </tbody>)}

          {warn(<span>These figures are <b>approximate</b> and meant for orientation, not procurement. Peak TFLOPS are
            dense numbers; structured <b>2:4 sparsity</b> roughly doubles them again. Always check the current datasheet
            for your exact SKU and clocks.</span>)}

          {info(<span>The jump that matters most for LLMs: <b>FP8 arrived with Hopper</b> and <b>FP4 with Blackwell</b>.
            Lower precision means fewer bytes moved <i>and</i> higher tensor-core throughput — a double win against the
            memory wall.</span>)}
        </div>
      )
    },

    /* ---------------- 11. ISSUES ---------------- */
    {
      id:"issues", group:"Optimization", map:"Common Issues",
      title:"Common GPU Bottlenecks",
      why:"Most performance problems fall into a short list of recurring patterns. Recognizing the symptom and its cause lets you jump straight to the right fix instead of guessing.",
      render: () => (
        <div>
          <Lead>Slow GPU code almost always traces back to one of these. Profile first to find the symptom, then match it to the cause.</Lead>

          {tbl(<tbody>
            <tr>{th("Issue")}{th("Symptom")}{th("Cause")}{th("Fix")}</tr>
            <tr>{td("Memory-bandwidth bound")}{td("high MBU, low MFU, SMs idle")}{td("low arithmetic intensity")}{td("batch, fuse kernels, quantize, reuse in SMEM")}</tr>
            <tr>{td("Low occupancy")}{td("latency not hidden, low SM util")}{td("too many registers/SMEM per block")}{td("shrink block resource use; tune launch config")}</tr>
            <tr>{td("Warp divergence")}{td("low effective throughput")}{td("threads in a warp branch differently")}{td("make branches uniform across a warp")}</tr>
            <tr>{td("Uncoalesced access")}{td("poor memory throughput")}{td("warp lanes hit scattered addresses")}{td("lay out data so a warp reads contiguous bytes")}</tr>
            <tr>{td("Bank conflicts")}{td("shared-memory stalls")}{td("lanes hit the same SMEM bank")}{td("pad arrays; change access stride")}</tr>
            <tr>{td("Kernel launch overhead")}{td("gaps between many tiny kernels")}{td("too many small launches")}{td("fuse kernels; use CUDA graphs")}</tr>
            <tr>{td("Host↔device transfer")}{td("PCIe-bound, GPU waits on CPU")}{td("data shuttled over PCIe each step")}{td("pin memory, prefetch, keep data on GPU")}</tr>
            <tr>{td("Register spilling")}{td("local-memory traffic, slowdown")}{td("kernel needs more registers than available")}{td("simplify kernel; cap register usage")}</tr>
            <tr>{td("Out of memory (OOM)")}{td("allocation fails / crash")}{td("activations + KV + weights exceed HBM")}{td("checkpointing, smaller batch, quantize, shard")}</tr>
            <tr>{td("Thermal / power throttle")}{td("clocks drop, throughput dips over time")}{td("hitting power or temp limits")}{td("improve cooling; check power cap; nvidia-smi")}</tr>
          </tbody>)}

          {info(<span>Two of these dominate real LLM work: kernels are <b>memory-bandwidth bound</b> (especially decode),
            and tiny decode kernels suffer <b>launch overhead</b>. The serving stage shows how to attack both.</span>)}
        </div>
      )
    },

    /* ---------------- 12. OPTIMIZE TRAIN / SERVE ---------------- */
    {
      id:"optimize_train_serve", group:"Optimization", map:"Optimizing",
      title:"Optimizing for Training vs Serving",
      why:"Training and serving sit on opposite ends of the roofline. Training is mostly compute-bound and wants the tensor cores saturated; decode is memory-bound and wants bytes minimized. The playbooks differ.",
      render: () => (
        <div>
          <Lead>Same hardware, two opposite problems. Training: keep the tensor cores pinned. Serving (decode): stop the memory wall from starving them.</Lead>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
            {card(<div>
              {subhead("Training (mostly compute-bound)")}
              <ul style={{fontSize:13, lineHeight:1.7, margin:"0 0 0 16px"}}>
                <li>Keep tensor cores fed: <b>BF16/FP8</b>, large GEMMs.</li>
                <li>Maximize <b>MFU</b> — that's the headline metric.</li>
                <li>Fused kernels (<b>FlashAttention</b>) to cut HBM traffic.</li>
                <li><b>Activation checkpointing</b> to fit bigger models in HBM.</li>
                <li>Overlap compute with <b>NCCL</b> communication.</li>
                <li>Avoid CPU↔GPU <b>sync points</b> that stall the pipeline.</li>
                <li>Use <b>TF32</b> for near-free speed over FP32.</li>
              </ul>
            </div>, {marginBottom:0})}
            {card(<div>
              {subhead("Serving / inference (decode is memory-bound)")}
              <ul style={{fontSize:13, lineHeight:1.7, margin:"0 0 0 16px"}}>
                <li><b>Batch</b> requests to raise arithmetic intensity.</li>
                <li>Use the <b>KV cache</b> — never recompute past tokens.</li>
                <li><b>Quantize</b> weights + KV: fewer HBM bytes = faster.</li>
                <li><b>CUDA graphs</b> to kill launch overhead on tiny kernels.</li>
                <li>Fused attention kernels.</li>
                <li><b>FP8/INT8</b> on tensor cores for throughput.</li>
              </ul>
            </div>, {marginBottom:0})}
          </div>

          {info(<span>Cross-links: serving depth in <a href="Inference-Serving.html">Inference Serving</a>, precision in
            <a href="Quantization.html"> Quantization</a>, and multi-GPU scaling in
            <a href="Distributed-Training.html"> Distributed Training</a>.</span>)}

          {warn(<span>The single biggest serving mistake is running <b>batch size 1 decode</b> and wondering why MFU is
            2%. It's not broken — decode is memory-bound, and the cure is batching, KV reuse, and quantization, not a
            bigger GPU.</span>)}
        </div>
      )
    },

    /* ---------------- 13. PROFILING ---------------- */
    {
      id:"profiling", group:"Optimization", map:"Profiling",
      title:"Measuring & Profiling",
      why:"You can't optimize what you can't see. The right tool tells you whether you're compute-bound, memory-bound, overhead-bound, or communication-bound — which determines the fix.",
      render: () => (
        <div>
          <Lead>Optimization is a loop, and it starts with measurement. Pick the tool by the granularity you need: whole-timeline, single-kernel, or live cluster health.</Lead>

          {tbl(<tbody>
            <tr>{th("Tool")}{th("What it shows")}{th("When to use")}</tr>
            <tr>{td("Nsight Systems")}{td("system timeline: kernels, gaps, copies, NCCL")}{td("find overhead, sync stalls, bad overlap")}</tr>
            <tr>{td("Nsight Compute")}{td("per-kernel detail: occupancy, throughput, roofline")}{td("deep-dive a specific slow kernel")}</tr>
            <tr>{td("nvidia-smi")}{td("live GPU/mem util, power, temperature")}{td("quick health check, OOM/throttle hunting")}</tr>
            <tr>{td("DCGM")}{td("fleet-scale metrics over time")}{td("cluster monitoring, regressions")}</tr>
            <tr>{td("PyTorch profiler")}{td("op-level timing, framework view")}{td("attribute time to model layers")}</tr>
          </tbody>)}

          {card(<div>
            {subhead("What to watch")}
            <ul style={{fontSize:13.5, lineHeight:1.7, margin:"0 0 0 18px"}}>
              <li><b>SM utilization</b> — are the cores even busy?</li>
              <li><b>Achieved occupancy</b> — enough resident warps to hide latency?</li>
              <li><b>Memory throughput vs peak</b> — how close to the bandwidth roof?</li>
              <li><b>Tensor-core utilization</b> — are the matmul engines actually engaged?</li>
              <li><b>MFU / MBU</b> — the headline efficiency numbers for compute vs memory.</li>
            </ul>
          </div>)}

          {info(<div>
            <b>The optimization loop:</b>
            <ol style={{fontSize:13, lineHeight:1.7, margin:"6px 0 0 18px"}}>
              <li><b>Profile</b> a representative workload.</li>
              <li><b>Identify the bottleneck</b>: compute vs memory vs overhead vs communication.</li>
              <li><b>Fix</b> the dominant one (and only that one).</li>
              <li><b>Repeat</b> — fixing one bottleneck just reveals the next.</li>
            </ol>
          </div>)}
        </div>
      )
    },

  ];

  window.ML_META = {
    title: "NVIDIA GPU Architecture",
    subtitle: "SMs, tensor cores, and memory — how GPUs run training and inference, and how to optimize",
    cur: "GPU",
    category: "LLM Training",
    run: () => ({}), default: {}, renderInput: null,
    modeLinks: [
      { label: "Pre-Training",  href: "LLM-PreTraining.html",        active: false },
      { label: "Distributed",   href: "Distributed-Training.html",   active: false },
      { label: "GPU",           href: "GPU-Architecture.html",       active: true  },
      { label: "Quantization",  href: "Quantization.html",           active: false },
      { label: "MoE",           href: "Mixture-of-Experts.html",     active: false },
      { label: "Post-Training", href: "Post-Training.html",          active: false },
      { label: "Distillation",  href: "Knowledge-Distillation.html", active: false },
      { label: "Embeddings",    href: "Embedding-Models.html",       active: false },
      { label: "Reasoning",     href: "Reasoning-Models.html",       active: false },
      { label: "Inference",     href: "Inference-Serving.html",      active: false },
      { label: "Production",    href: "Production-Safety.html",       active: false },
    ]
  };
  window.ML_STAGES = STAGES;
})();
