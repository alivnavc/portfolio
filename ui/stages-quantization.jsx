/* ============================================================
   Quantization — stages-quantization.jsx (11 stages)
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

  // ---- small svg helpers -------------------------------------------------
  const svgWrap = (children, vb, h) => (
    <div style={{ overflowX:"auto", margin:"12px 0" }}>
      <svg viewBox={vb} width="100%" style={{ maxWidth:760, height:(h||"auto"), display:"block" }}
        fontFamily="var(--font-mono, monospace)">
        {children}
      </svg>
    </div>
  );

  // bit-layout strip for a float format
  const bitStrip = (y, label, segs) => {
    // segs: [{w, color, name}], widths in "bit" units; we scale to px
    const x0 = 150, totalBits = segs.reduce((a, s) => a + s.w, 0);
    const px = 480 / totalBits;
    let cx = x0;
    const cells = segs.map((s, i) => {
      const w = s.w * px;
      const cell = (
        <g key={i}>
          <rect x={cx} y={y} width={w - 1} height={26} rx={3}
            fill={s.color} stroke="#0b1020" strokeOpacity="0.15" />
          <text x={cx + w / 2} y={y + 17} fontSize="11" textAnchor="middle"
            fill="#0b1020" fontWeight="600">{s.name + "·" + s.w}</text>
        </g>
      );
      cx += w;
      return cell;
    });
    return (
      <g key={label}>
        <text x={x0 - 12} y={y + 17} fontSize="12" textAnchor="end"
          fill="var(--ink)" fontWeight="700">{label}</text>
        {cells}
      </g>
    );
  };

  const SIGN = "#9aa0a6", EXP = "#2b5bff", MAN = "#ff7a45";

  const STAGES = [

    /* =====================================================================
       STAGE 1 — overview
       ===================================================================== */
    {
      id: "overview",
      group: "Overview",
      title: "Why Quantize?",
      map: "Overview",
      why: "A 70B model in FP16 is 140 GB — it won't fit on a single 80 GB H100. In INT4 it is 35 GB and fits comfortably. Quantization is what makes large models deployable.",
      render: () => (
        <div>
          <Lead>
            Quantization means representing a model&apos;s weights (and sometimes its
            activations) with fewer bits than the native 16- or 32-bit floats it was
            trained in. Fewer bits per number means a smaller, faster model — at the cost
            of some numerical precision.
          </Lead>

          {subhead("The motivation: a 70B model")}
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            Model size in bytes is roughly <b>parameters &times; bytes-per-parameter</b>.
            A 70-billion-parameter model in FP16 (2 bytes each) is about 140 GB — larger
            than the 80 GB of a single H100. Quantize to 4 bits (0.5 bytes each) and the
            same weights occupy ~35 GB, leaving room for the KV cache and activations.
          </p>

          {svgWrap((
            <g>
              <text x="20" y="22" fontSize="13" fontWeight="700" fill="var(--ink)">
                70B model — weight memory by format
              </text>
              {[
                { lbl:"FP32", gb:280, col:"#9aa0a6" },
                { lbl:"FP16", gb:140, col:"#2b5bff" },
                { lbl:"INT8", gb:70,  col:"#16a34a" },
                { lbl:"INT4", gb:35,  col:"#ff7a45" },
              ].map((d, i) => {
                const y = 45 + i * 42;
                const w = (d.gb / 280) * 520;
                return (
                  <g key={d.lbl}>
                    <text x="64" y={y + 19} fontSize="12" textAnchor="end"
                      fontWeight="700" fill="var(--ink)">{d.lbl}</text>
                    <rect x="72" y={y} width={w} height={26} rx={4} fill={d.col} />
                    <text x={72 + w + 6} y={y + 18} fontSize="12" fill="var(--ink)">
                      {d.gb + " GB"}
                    </text>
                  </g>
                );
              })}
              {/* 80 GB H100 line */}
              <line x1={72 + (80 / 280) * 520} y1="38" x2={72 + (80 / 280) * 520} y2="220"
                stroke="#dc2626" strokeWidth="2" strokeDasharray="5 4" />
              <text x={72 + (80 / 280) * 520 + 4} y="234" fontSize="11"
                fill="#dc2626" fontWeight="700">80 GB H100</text>
            </g>
          ), "0 0 600 245", 260)}

          {subhead("Three wins")}
          {tbl(
            <tbody>
              <tr>{th("Win")}{th("Why it matters")}</tr>
              <tr>{td(<b>Memory capacity</b>)}{td("Fit larger models (or longer context / bigger batch) on the same GPU. The headline reason.")}</tr>
              <tr>{td(<b>Memory bandwidth</b>)}{td("Token-by-token decoding is memory-bound — the GPU spends its time reading weights from HBM. Half the bytes ≈ up to ~2x faster decode.")}</tr>
              <tr>{td(<b>Compute</b>)}{td("On hardware with INT8/FP8 tensor cores (H100, etc.) low-bit matmuls run faster — but only when both operands are low-bit.")}</tr>
            </tbody>
          )}

          {info(
            <span>
              Quantization is overwhelmingly an <b>inference</b> technique (plus QLoRA
              fine-tuning). Pre-training itself still runs in <b>BF16 mixed precision</b>
              {" "}— low-bit weights are too noisy for the full gradient-descent loop.
            </span>
          )}
        </div>
      ),
    },

    /* =====================================================================
       STAGE 2 — number_formats
       ===================================================================== */
    {
      id: "number_formats",
      group: "Formats",
      title: "Floating-Point Formats — FP32, FP16, BF16, FP8",
      map: "Float Formats",
      why: "BF16 beat FP16 for training by trading mantissa precision for FP32's full dynamic range — no overflow, no loss-scaling. Understanding sign/exponent/mantissa explains why.",
      render: () => (
        <div>
          <Lead>
            A floating-point number is <b>sign &times; mantissa &times; 2^exponent</b>.
            The <b>exponent</b> bits set the dynamic <i>range</i> (how big and how small a
            number can be); the <b>mantissa</b> bits set the <i>precision</i> (how many
            significant digits). Every format is a budget split between those two.
          </Lead>

          {subhead("Bit layouts")}
          {svgWrap((
            <g>
              {bitStrip(10,  "FP32",     [{w:1,color:SIGN,name:"S"},{w:8,color:EXP,name:"E"},{w:23,color:MAN,name:"M"}])}
              {bitStrip(46,  "TF32",     [{w:1,color:SIGN,name:"S"},{w:8,color:EXP,name:"E"},{w:10,color:MAN,name:"M"}])}
              {bitStrip(82,  "FP16",     [{w:1,color:SIGN,name:"S"},{w:5,color:EXP,name:"E"},{w:10,color:MAN,name:"M"}])}
              {bitStrip(118, "BF16",     [{w:1,color:SIGN,name:"S"},{w:8,color:EXP,name:"E"},{w:7,color:MAN,name:"M"}])}
              {bitStrip(154, "FP8 E4M3", [{w:1,color:SIGN,name:"S"},{w:4,color:EXP,name:"E"},{w:3,color:MAN,name:"M"}])}
              {bitStrip(190, "FP8 E5M2", [{w:1,color:SIGN,name:"S"},{w:5,color:EXP,name:"E"},{w:2,color:MAN,name:"M"}])}
              <g fontSize="11">
                <rect x="150" y="226" width="12" height="12" fill={SIGN} />
                <text x="167" y="236" fill="var(--ink)">sign</text>
                <rect x="220" y="226" width="12" height="12" fill={EXP} />
                <text x="237" y="236" fill="var(--ink)">exponent (range)</text>
                <rect x="370" y="226" width="12" height="12" fill={MAN} />
                <text x="387" y="236" fill="var(--ink)">mantissa (precision)</text>
              </g>
            </g>
          ), "0 0 660 250", 260)}

          <p style={{ fontSize:13, color:"var(--muted)" }}>
            Notice FP32 and BF16 share the same 8 exponent bits — so they reach the same
            magnitudes. FP16 has only 5 exponent bits, so it tops out far lower.
          </p>

          {subhead("Format comparison")}
          {tbl(
            <tbody>
              <tr>{th("Format")}{th("Bits")}{th("Exp")}{th("Mant")}{th("Bytes")}{th("Max value")}{th("Key use")}</tr>
              <tr>{td("FP32")}{td("32")}{td("8")}{td("23")}{td("4")}{td("~3.4e38")}{td("Reference / accumulation")}</tr>
              <tr>{td("TF32")}{td("19*")}{td("8")}{td("10")}{td("4**")}{td("~3.4e38")}{td("Ampere+ tensor-core matmul")}</tr>
              <tr>{td("FP16")}{td("16")}{td("5")}{td("10")}{td("2")}{td("65,504")}{td("Inference; training w/ loss scaling")}</tr>
              <tr>{td("BF16")}{td("16")}{td("8")}{td("7")}{td("2")}{td("~3.4e38")}{td("Default training format today")}</tr>
              <tr>{td("FP8 E4M3")}{td("8")}{td("4")}{td("3")}{td("1")}{td("448")}{td("Weights/activations (H100)")}</tr>
              <tr>{td("FP8 E5M2")}{td("8")}{td("5")}{td("2")}{td("1")}{td("57,344")}{td("Gradients — needs the range")}</tr>
            </tbody>
          )}
          <p style={{ fontSize:12, color:"var(--muted)" }}>
            * TF32 stores in 4 bytes but multiplies with a 19-bit mantissa-truncated form.
            ** TF32 is a tensor-core matmul mode, not a storage format.
          </p>

          {info(
            <span>
              <b>Key insight — why BF16 won training.</b> BF16 keeps FP32&apos;s full
              exponent range but throws away mantissa bits. Activations and gradients can
              be huge or tiny, so <b>range matters more than precision</b> for stability.
              BF16 never overflows like FP16 (max 65,504) and needs <b>no loss scaling</b>.
              FP16 must scale the loss up before backprop to lift small gradients out of
              the underflow zone, then scale back down.
            </span>
          )}

          {warn(
            <span>
              FP16&apos;s tiny range bites in two directions: large attention scores can
              <b> overflow to Inf</b>, and small gradients can <b>underflow to 0</b>. BF16
              sidesteps both, which is why it is the modern default.
            </span>
          )}
        </div>
      ),
    },

    /* =====================================================================
       STAGE 3 — integer_quant
       ===================================================================== */
    {
      id: "integer_quant",
      group: "Formats",
      title: "Integer Quantization — INT8, INT4 & the Math",
      map: "Integer Math",
      why: "Integers have no exponent, so you must map a float range onto a fixed grid with a scale (and optional zero-point). This affine mapping is the core arithmetic of all integer quantization.",
      render: () => (
        <div>
          <Lead>
            Integers have <b>no exponent</b> — every value is equally spaced. To store
            floats as integers you choose a <b>scale</b> (the step size) and map each
            float to the nearest grid point. The reverse map (dequantization) multiplies
            the integer back by the scale.
          </Lead>

          {subhead("The affine (asymmetric) mapping")}
          {codeBlock(
            "scale      = (x_max - x_min) / (q_max - q_min)\n" +
            "zero_point = round(q_min - x_min / scale)\n\n" +
            "quantize:    x_q = round(x / scale) + zero_point\n" +
            "dequantize:  x_hat = scale * (x_q - zero_point)"
          )}
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            The <b>zero-point</b> is an integer offset so that the real value 0.0 lands
            exactly on a grid point (important — padding and ReLU produce lots of zeros).
            <b> Symmetric</b> quantization drops the zero-point (sets it to 0) and centers
            the range on zero:
          </p>
          {codeBlock(
            "symmetric:   scale = max(|x|) / q_max\n" +
            "             x_q   = round(x / scale)        // zero_point = 0"
          )}
          <p style={{ fontSize:13, color:"var(--muted)" }}>
            INT8 covers [-128, 127] (256 levels). INT4 has just <b>16 levels</b> — every
            number is forced onto one of 16 rungs.
          </p>

          {subhead("Worked example — quantize a weight vector to INT8 (symmetric)")}
          {codeBlock(
            "w      = [ 0.12, -0.45, 0.88, -0.07, 0.31 ]\n" +
            "max|w| = 0.88,   q_max = 127\n" +
            "scale  = 0.88 / 127 = 0.006929\n\n" +
            "x_q = round(w / scale):\n" +
            "  0.12 -> round( 17.32) =  17\n" +
            " -0.45 -> round(-64.94) = -65\n" +
            "  0.88 -> round(127.00) = 127\n" +
            " -0.07 -> round(-10.10) = -10\n" +
            "  0.31 -> round( 44.74) =  45\n\n" +
            "dequant (scale * x_q):\n" +
            "  [ 0.1178, -0.4504, 0.8800, -0.0693, 0.3118 ]\n" +
            "abs error:\n" +
            "  [ 0.0022,  0.0004, 0.0000,  0.0007, 0.0018 ]   // sub-1% — INT8 is gentle"
          )}

          {subhead("Granularity — how many scales?")}
          {tbl(
            <tbody>
              <tr>{th("Granularity")}{th("One scale per…")}{th("Accuracy")}{th("Overhead")}</tr>
              <tr>{td("Per-tensor")}{td("Whole weight matrix")}{td("Lowest")}{td("Tiny (1 scale)")}</tr>
              <tr>{td("Per-channel")}{td("Output channel / row")}{td("Good")}{td("Small")}</tr>
              <tr>{td("Per-group / block")}{td("Block of 64 or 128 weights")}{td("Best")}{td("Higher — many scales")}</tr>
            </tbody>
          )}
          <p style={{ fontSize:13, color:"var(--muted)" }}>
            Smaller blocks let each region pick a tighter scale, so a single large weight
            can&apos;t blow up the scale for its neighbors. The price is storing more scale
            constants. 4-bit schemes commonly use group size 128 (written &quot;g128&quot;).
          </p>

          {subhead("Rounding error on a 16-level INT4 grid")}
          {svgWrap((
            <g>
              <line x1="40" y1="60" x2="560" y2="60" stroke="var(--ink)" strokeWidth="1.5" />
              {Array.from({ length: 16 }).map((_, i) => {
                const x = 40 + i * (520 / 15);
                return (
                  <g key={i}>
                    <line x1={x} y1="52" x2={x} y2="68" stroke="#2b5bff" strokeWidth="2" />
                    <text x={x} y="84" fontSize="9" textAnchor="middle" fill="var(--muted)">{i}</text>
                  </g>
                );
              })}
              {/* a true float that lands between grid points */}
              {[0.27, 0.61, 0.83].map((f, k) => {
                const x = 40 + f * 520;
                const nearest = Math.round(f * 15);
                const gx = 40 + (nearest / 15) * 520;
                return (
                  <g key={k}>
                    <circle cx={x} cy="60" r="4" fill="#dc2626" />
                    <line x1={x} y1="60" x2={gx} y2="60" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3 2" />
                    <text x={x} y="40" fontSize="10" textAnchor="middle" fill="#dc2626">float</text>
                  </g>
                );
              })}
              <text x="40" y="116" fontSize="11" fill="var(--muted)">
                red = true float · blue tick = nearest INT4 grid point · gap = rounding error
              </text>
            </g>
          ), "0 0 600 125", 130)}
        </div>
      ),
    },

    /* =====================================================================
       STAGE 4 — nf4
       ===================================================================== */
    {
      id: "nf4",
      group: "Formats",
      title: "NF4 — NormalFloat for QLoRA",
      map: "NF4",
      why: "Neural-network weights are roughly normally distributed, so uniform INT4 wastes levels. NF4 places its 16 levels at the quantiles of a normal distribution — information-theoretically optimal for the data. It is the heart of QLoRA.",
      render: () => (
        <div>
          <Lead>
            INT4 spaces its 16 levels <b>uniformly</b>. But trained weights cluster tightly
            around zero in a bell curve — so most of the uniform grid sits in the sparsely
            populated tails, wasting precision. <b>NF4 (NormalFloat-4)</b> fixes this.
          </Lead>

          {subhead("Quantile spacing")}
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            NF4 assumes the (normalized) weights follow <b>N(0, 1)</b> and places its 16
            levels at the <b>quantiles</b> of that distribution. Result: many fine-grained
            levels packed near zero where the weights actually live, and a few coarse
            levels out in the tails. For normally distributed data this is the
            information-theoretically optimal 4-bit code.
          </p>

          {svgWrap((
            <g>
              {/* bell curve */}
              <text x="20" y="18" fontSize="12" fontWeight="700" fill="var(--ink)">
                Weight distribution N(0,1) with two 4-bit grids
              </text>
              <path d={(() => {
                let d = "M 40 200";
                for (let i = 0; i <= 100; i++) {
                  const t = -3 + (i / 100) * 6;
                  const y = 200 - Math.exp(-t * t / 2) * 150;
                  const x = 40 + (i / 100) * 520;
                  d += " L " + x.toFixed(1) + " " + y.toFixed(1);
                }
                return d;
              })()} fill="rgba(43,91,255,.10)" stroke="#2b5bff" strokeWidth="1.5" />
              {/* uniform INT4 grid - top ticks */}
              {Array.from({ length: 16 }).map((_, i) => {
                const t = -3 + (i / 15) * 6;
                const x = 40 + ((t + 3) / 6) * 520;
                return <line key={"u" + i} x1={x} y1="212" x2={x} y2="226" stroke="#ff7a45" strokeWidth="2" />;
              })}
              <text x="40" y="240" fontSize="10" fill="#ff7a45">uniform INT4 — even spacing, wasted in tails</text>
              {/* NF4 quantile grid - bottom ticks (approx normal quantiles) */}
              {[-1,-0.70,-0.53,-0.40,-0.28,-0.18,-0.09,-0.03,0.03,0.09,0.18,0.28,0.40,0.53,0.70,1].map((q, i) => {
                const x = 40 + ((q * 3 + 3) / 6) * 520;
                return <line key={"n" + i} x1={x} y1="256" x2={x} y2="270" stroke="#16a34a" strokeWidth="2" />;
              })}
              <text x="40" y="284" fontSize="10" fill="#16a34a">NF4 — levels crowd near 0 where weights live</text>
            </g>
          ), "0 0 600 295", 300)}

          {subhead("Double quantization")}
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            NF4 uses small blocks (e.g. 64 weights), so it stores many per-block scale
            constants in FP32. Those constants are themselves quantized in a second pass —
            <b> double quantization</b> — saving roughly <b>0.37–0.5 bits per parameter</b>.
            Tiny per-parameter, but across billions of weights it is gigabytes.
          </p>

          {info(
            <span>
              NF4 + double-quant is the storage backbone of <b>QLoRA</b>: freeze the base
              model in 4-bit NF4, then train tiny LoRA adapters in BF16 on top. That is how
              a 65B model fine-tunes on a single 48 GB GPU. See the
              {" "}<b>Post-Training</b> article for the full QLoRA recipe.
            </span>
          )}
        </div>
      ),
    },

    /* =====================================================================
       STAGE 5 — ptq_vs_qat
       ===================================================================== */
    {
      id: "ptq_vs_qat",
      group: "Methods",
      title: "PTQ vs QAT",
      map: "PTQ vs QAT",
      why: "Two ways to quantize: do it after training (PTQ — fast, cheap) or train the model to expect quantization (QAT — expensive, best low-bit accuracy). The choice depends on bit-width and budget.",
      render: () => (
        <div>
          <Lead>
            You can quantize a model <b>after</b> it is trained, or train it to be
            quantization-robust. These are <b>PTQ</b> and <b>QAT</b>.
          </Lead>

          {subhead("Post-Training Quantization (PTQ)")}
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            Take a finished model and convert its weights to low bits — no gradients, no
            retraining. An optional <b>calibration set</b> (a few hundred sample sequences)
            is run through the model just to <i>observe</i> activation ranges and pick good
            scales. Fast and cheap; this is what GPTQ, AWQ, and most LLM toolchains do.
          </p>

          {subhead("Quantization-Aware Training (QAT)")}
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            Insert <b>fake-quant</b> ops into the network during training: the forward pass
            rounds values to the quantization grid, so the model <i>learns weights that are
            robust</i> to that rounding. Gives the best accuracy at very low bit-widths, but
            costs a real (re)training run.
          </p>

          {subhead("The Straight-Through Estimator (STE)")}
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            <code>round()</code> has a gradient of zero almost everywhere, which would block
            backprop. The <b>STE</b> trick: use the quantized value in the forward pass, but
            in the backward pass <b>pretend round() was the identity</b> and pass the
            gradient straight through.
          </p>
          {codeBlock(
            "forward:   y = round(x / s) * s      // real quantization\n" +
            "backward:  dL/dx = dL/dy            // gradient flows as if y = x"
          )}

          {tbl(
            <tbody>
              <tr>{th("")}{th("PTQ")}{th("QAT")}</tr>
              <tr>{td(<b>Cost</b>)}{td("Minutes to a few GPU-hours")}{td("A full / partial retraining run")}</tr>
              <tr>{td(<b>Data needed</b>)}{td("None, or a small calibration set")}{td("The full training (labeled) dataset")}</tr>
              <tr>{td(<b>Gradients</b>)}{td("No")}{td("Yes — via STE")}</tr>
              <tr>{td(<b>Accuracy @ 4-bit</b>)}{td("Good (GPTQ/AWQ)")}{td("Best, especially below 4-bit")}</tr>
              <tr>{td(<b>When to use</b>)}{td("Default for LLMs — INT8/INT4")}{td("Aggressive low-bit, or accuracy-critical edge models")}</tr>
            </tbody>
          )}

          {info(
            <span>
              For modern LLMs, <b>PTQ dominates</b> at 8- and 4-bit — the models are large
              and over-parameterized enough that smart PTQ (GPTQ/AWQ) gets within a hair of
              the baseline without any retraining. QAT earns its cost mainly at 2–3 bits or
              for small on-device models.
            </span>
          )}
        </div>
      ),
    },

    /* =====================================================================
       STAGE 6 — outliers
       ===================================================================== */
    {
      id: "outliers",
      group: "Methods",
      title: "The Activation Outlier Problem",
      map: "Outliers",
      why: "Naive INT8 fails on LLMs because a handful of activation channels carry huge values that dominate the scale and crush precision for everyone else. Every serious LLM quantization method exists to deal with this.",
      render: () => (
        <div>
          <Lead>
            Why does textbook INT8 work on small CNNs but wreck a large language model?
            <b> Activation outliers.</b>
          </Lead>

          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            In transformers past a few billion parameters, a small number of
            <b> activation channels</b> develop systematically huge magnitudes — often
            <b> 10–100x</b> larger than the rest. Since a per-tensor scale must cover the
            largest value, those few spikes stretch the scale so far that all the ordinary
            small activations collapse into just one or two quantization levels — losing
            almost all their information.
          </p>

          {svgWrap((
            <g>
              <text x="20" y="18" fontSize="12" fontWeight="700" fill="var(--ink)">
                Per-channel activation magnitude (one token)
              </text>
              {Array.from({ length: 40 }).map((_, i) => {
                const spike = (i === 7 || i === 23 || i === 31);
                const h = spike ? 150 : (8 + (Math.abs(Math.sin(i * 1.7)) * 18));
                const x = 30 + i * 14;
                return (
                  <rect key={i} x={x} y={200 - h} width="9" height={h} rx="1"
                    fill={spike ? "#dc2626" : "#2b5bff"} />
                );
              })}
              <line x1="20" y1="200" x2="595" y2="200" stroke="var(--ink)" strokeWidth="1" />
              <text x="30" y="222" fontSize="10" fill="#dc2626">red = outlier channels — dominate the scale</text>
              <text x="30" y="236" fontSize="10" fill="#2b5bff">blue = normal channels — crushed into ~1 level</text>
            </g>
          ), "0 0 600 245", 250)}

          {subhead("Two families of fixes")}
          {tbl(
            <tbody>
              <tr>{th("Approach")}{th("Idea")}{th("Example")}</tr>
              <tr>{td("Keep outliers high-precision")}{td("Decompose the matmul: outlier columns stay in FP16, the rest go INT8, then sum.")}{td("LLM.int8() — mixed-precision decomposition")}</tr>
              <tr>{td("Migrate the difficulty")}{td("Mathematically shift the outlier magnitude out of activations and into weights, where it is easier to quantize.")}{td("SmoothQuant (see AWQ stage)")}</tr>
            </tbody>
          )}

          {info(
            <span>
              The key realization: outliers are <b>not noise</b> — they carry important
              signal and appear in consistent channels. You can&apos;t just clip them away.
              Every method in the next stages is, at heart, a different answer to
              &quot;what do we do about the outlier channels?&quot;
            </span>
          )}
        </div>
      ),
    },

    /* =====================================================================
       STAGE 7 — gptq
       ===================================================================== */
    {
      id: "gptq",
      group: "Algorithms",
      title: "GPTQ — Hessian-Based Weight Quantization",
      map: "GPTQ",
      why: "GPTQ is the workhorse one-shot 4-bit weight-only PTQ method. It quantizes weights column-by-column and uses second-order (Hessian) information to compensate the remaining weights for each rounding error — minimizing the layer's output error, not the weight error.",
      render: () => (
        <div>
          <Lead>
            <b>GPTQ</b> is a one-shot, weight-only PTQ method, typically targeting 4-bit.
            Its insight: don&apos;t minimize the error in the <i>weights</i> — minimize the
            error in the <i>layer&apos;s output</i>, <code>||WX - W_q X||&sup2;</code>, given
            real input statistics X.
          </Lead>

          {subhead("Error feedback with the Hessian")}
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            GPTQ quantizes weights <b>column by column</b>. After it rounds one column, it
            has introduced a known error. It then <b>adjusts all the still-unquantized
            weights</b> to compensate for that error before moving on. The compensation is
            guided by second-order information — the layer&apos;s Hessian
            <b> H = 2&middot;X&middot;X&#7488;</b> (X are the calibration-set inputs). Weights
            that the inverse-Hessian says are influential absorb more of the correction.
            This builds on the classic OBS / OBQ (Optimal Brain Surgeon/Quantization) theory.
          </p>

          {codeBlock(
            "# GPTQ column loop (per layer), conceptual\n" +
            "H     = 2 * X @ X.T            # Hessian from calibration inputs\n" +
            "Hinv  = cholesky_inverse(H + lambda*I)\n" +
            "\n" +
            "for j in range(num_columns):\n" +
            "    w      = W[:, j]\n" +
            "    w_q    = quantize(w)              # round to 4-bit grid\n" +
            "    err    = (w - w_q) / Hinv[j, j]   # rounding error, Hessian-scaled\n" +
            "    # push the error onto the remaining unquantized columns:\n" +
            "    W[:, j+1:] -= err.outer(Hinv[j, j+1:])\n" +
            "    W[:, j]    = w_q\n" +
            "# result: each rounding error is partly cancelled by later columns"
          )}

          {subhead("Why it works and what it costs")}
          {tbl(
            <tbody>
              <tr>{th("Property")}{th("GPTQ")}</tr>
              <tr>{td("Type")}{td("One-shot PTQ, weight-only (activations stay FP16)")}</tr>
              <tr>{td("Typical bits")}{td("4-bit, group size 128 (g128) is common")}</tr>
              <tr>{td("Data")}{td("Small calibration set (~128 sequences) to estimate H")}</tr>
              <tr>{td("Speed")}{td("Fast — a 175B model in roughly ~4 GPU-hours")}</tr>
              <tr>{td("Quality")}{td("Near-FP16 at 4-bit; degrades at 3-bit and below")}</tr>
            </tbody>
          )}

          {info(
            <span>
              GPTQ is weight-only, so it shines for <b>memory-bound decoding</b>: weights
              load as 4-bit then dequantize to FP16 for the matmul. It does <b>not</b> speed
              up compute-bound prefill the way INT8/FP8 (W8A8) does — see the schemes stage.
            </span>
          )}
        </div>
      ),
    },

    /* =====================================================================
       STAGE 8 — awq
       ===================================================================== */
    {
      id: "awq",
      group: "Algorithms",
      title: "AWQ — Activation-Aware Weight Quantization",
      map: "AWQ",
      why: "AWQ observes that ~1% of weight channels are salient — those aligned with large activations. Instead of keeping them in high precision, it scales them up before quantizing so they survive rounding. Often beats GPTQ, with no backprop and a hardware-friendly result.",
      render: () => (
        <div>
          <Lead>
            <b>AWQ</b> starts from a sharper observation than GPTQ: <b>not all weights
            matter equally</b>. The ~1% of weight channels that multiply
            <i> large-magnitude activation channels</i> are <b>salient</b> — protecting just
            those preserves almost all the accuracy.
          </Lead>

          {subhead("Scale, don't isolate")}
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            Keeping salient weights in FP16 would protect them but creates mixed-precision
            matmuls that hardware hates. AWQ&apos;s trick is purely numerical: for a salient
            channel, <b>scale the weight up by s</b> and <b>scale the matching activation
            down by 1/s</b>. The product <code>W&middot;X</code> is unchanged, but the scaled-up
            weight now occupies more quantization levels, so it survives rounding far better.
          </p>
          {codeBlock(
            "# equivalence: scaling weight up, activation down, leaves output identical\n" +
            "(W * s) @ (X / s)  ==  W @ X\n" +
            "\n" +
            "# AWQ searches a per-channel scale s to minimize output error:\n" +
            "s* = argmin_s  || W@X  -  quantize(W*s) @ (X/s) ||^2\n" +
            "# salient channels (large |X|) get larger s -> better preserved"
          )}
          <p style={{ fontSize:13, color:"var(--muted)" }}>
            The per-channel scale s is found by a quick grid search on the calibration set —
            <b> no backprop, no weight reordering</b>. The output is a clean uniform 4-bit
            tensor that runs on standard kernels.
          </p>

          {tbl(
            <tbody>
              <tr>{th("")}{th("GPTQ")}{th("AWQ")}</tr>
              <tr>{td(<b>Core idea</b>)}{td("Hessian error-feedback")}{td("Scale salient channels before rounding")}</tr>
              <tr>{td(<b>Needs</b>)}{td("Calibration set + Hessian")}{td("Calibration set only")}</tr>
              <tr>{td(<b>Reordering</b>)}{td("Sometimes (act-order)")}{td("None — kernel-friendly")}</tr>
              <tr>{td(<b>Quality @ 4-bit</b>)}{td("Strong")}{td("Often slightly better, esp. instruct models")}</tr>
            </tbody>
          )}

          {subhead("Related: SmoothQuant (W8A8)")}
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            <b>SmoothQuant</b> applies the same migrate-the-difficulty idea to <i>full</i>
            INT8 (both weights and activations, W8A8). A per-channel smoothing factor shifts
            the outlier magnitude from activations into weights, so <b>both</b> can be
            cleanly INT8 and run on INT8 tensor cores — great for high-throughput serving.
          </p>

          {info(
            <span>
              <b>GGUF / llama.cpp k-quants</b> (Q4_K_M, Q5_K_M, Q6_K, …) are the popular
              format for CPU and edge inference. They mix bit-widths per tensor (more bits
              for sensitive layers like attention) and are the de-facto standard for
              running models locally.
            </span>
          )}
        </div>
      ),
    },

    /* =====================================================================
       STAGE 9 — schemes
       ===================================================================== */
    {
      id: "schemes",
      group: "Deployment",
      title: "W4A16 vs W8A8 — Weight-only vs Full Quantization",
      map: "W4A16 / W8A8",
      why: "The right scheme depends on whether your workload is memory-bound (decode) or compute-bound (prefill / big batches). Weight-only 4-bit wins one, full INT8/FP8 wins the other.",
      render: () => (
        <div>
          <Lead>
            Quantization schemes are named <b>W</b>(weight bits)<b>A</b>(activation bits).
            <b> W4A16</b> = 4-bit weights, 16-bit activations. <b>W8A8</b> = both at 8 bits.
            Which is right depends entirely on your bottleneck.
          </Lead>

          {subhead("Weight-only — W4A16")}
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            Weights stored 4-bit, dequantized to FP16 on the fly for each matmul; activations
            stay FP16. Best for <b>memory-bound decode</b> — single-token generation at small
            batch, where the GPU is starved waiting to read weights from HBM. Halving (or
            quartering) the weight bytes directly speeds that up. GPTQ and AWQ produce W4A16.
          </p>

          {subhead("Full quantization — W8A8 (INT8 or FP8)")}
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            Both weights and activations are low-bit, so the matmul runs on
            <b> INT8 / FP8 tensor cores</b> — actual compute speedup. Best for
            <b> compute-bound prefill</b> (processing a long prompt) and
            <b> high-throughput batched serving</b>, where many requests share weight reads
            and the GPU is arithmetic-limited. Needs activation quantization, so it inherits
            the outlier problem (SmoothQuant, FP8).
          </p>

          {tbl(
            <tbody>
              <tr>{th("Workload")}{th("Bottleneck")}{th("Recommended scheme")}</tr>
              <tr>{td("Single-user chat, short batch (decode)")}{td("Memory bandwidth")}{td(<b>W4A16</b> + " (GPTQ / AWQ)")}</tr>
              <tr>{td("Long-prompt prefill")}{td("Compute")}{td(<b>W8A8</b> + " (FP8 / INT8)")}</tr>
              <tr>{td("High-throughput batched serving")}{td("Compute")}{td(<b>W8A8</b> + " (FP8 on H100)")}</tr>
              <tr>{td("Large model, capacity-limited")}{td("Memory capacity")}{td(<b>W4A16</b> + " (fit it at all)")}</tr>
            </tbody>
          )}

          {info(
            <span>
              <b>KV-cache quantization.</b> At long context the KV cache can rival the
              weights in size. Storing keys/values in INT8 or FP8 (instead of FP16) roughly
              doubles the context or batch you can hold — a separate, very effective lever
              from weight quantization.
            </span>
          )}
        </div>
      ),
    },

    /* =====================================================================
       STAGE 10 — evaluation
       ===================================================================== */
    {
      id: "evaluation",
      group: "Evaluation",
      title: "Measuring Quantization Quality",
      map: "Evaluation",
      why: "Compression is only useful if quality holds. Perplexity delta is the quick check, KL divergence is finer, and downstream benchmarks are the truth. 4-bit is the current sweet spot on the quality–compression frontier.",
      render: () => (
        <div>
          <Lead>
            How do you know a quantized model is &quot;still good&quot;? You compare it to
            the full-precision baseline along three increasingly rigorous axes.
          </Lead>

          {subhead("The three metrics")}
          {tbl(
            <tbody>
              <tr>{th("Metric")}{th("What it measures")}{th("Use")}</tr>
              <tr>{td("Perplexity delta")}{td("Change in perplexity vs FP16 on WikiText-2 / C4")}{td("Fast standard smoke test")}</tr>
              <tr>{td("KL divergence")}{td("Distance between quantized & full-precision next-token distributions")}{td("Finer-grained — catches subtle drift")}</tr>
              <tr>{td("Downstream accuracy")}{td("Real task scores: MMLU, GSM8K, HumanEval")}{td("The ground truth that matters")}</tr>
            </tbody>
          )}

          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--ink)" }}>
            Rule of thumb: a <b>&lt;1% perplexity increase</b> is effectively imperceptible;
            a <b>&gt;5%</b> increase is noticeable degradation you will feel on real tasks.
          </p>

          {subhead("Approximate Llama-2-7B perplexity by method (WikiText-2)")}
          {tbl(
            <tbody>
              <tr>{th("Method")}{th("Bits")}{th("PPL (approx.)")}{th("Note")}</tr>
              <tr>{td("FP16 baseline")}{td("16")}{td("~5.47")}{td("Reference")}</tr>
              <tr>{td("INT8")}{td("8")}{td("~5.48")}{td("Essentially lossless")}</tr>
              <tr>{td("GPTQ-4bit (g128)")}{td("4")}{td("~5.6")}{td("Within ~2% — excellent")}</tr>
              <tr>{td("AWQ-4bit")}{td("4")}{td("~5.6")}{td("Comparable / slightly better")}</tr>
              <tr>{td("INT4 naive (RTN)")}{td("4")}{td("~6.0+")}{td("Round-to-nearest, no compensation")}</tr>
              <tr>{td("INT3")}{td("3")}{td("large jump")}{td("Real, visible quality loss")}</tr>
            </tbody>
          )}
          <p style={{ fontSize:12, color:"var(--muted)" }}>
            Numbers are approximate and illustrative — exact values vary by codebase,
            calibration set, and group size.
          </p>

          {svgWrap((
            <g>
              <text x="20" y="18" fontSize="12" fontWeight="700" fill="var(--ink)">
                Quality vs compression frontier — 4-bit is the knee
              </text>
              <line x1="50" y1="180" x2="560" y2="180" stroke="var(--ink)" strokeWidth="1" />
              <line x1="50" y1="30" x2="50" y2="180" stroke="var(--ink)" strokeWidth="1" />
              <text x="300" y="205" fontSize="11" textAnchor="middle" fill="var(--muted)">fewer bits / more compression  &#8594;</text>
              <text x="18" y="105" fontSize="11" fill="var(--muted)" transform="rotate(-90 18 105)">quality &#8594;</text>
              {(() => {
                const pts = [
                  { b:"16", x:90,  y:50 },
                  { b:"8",  x:190, y:52 },
                  { b:"4",  x:330, y:72 },
                  { b:"3",  x:440, y:125 },
                  { b:"2",  x:540, y:172 },
                ];
                let path = "M " + pts[0].x + " " + pts[0].y;
                pts.slice(1).forEach(p => { path += " L " + p.x + " " + p.y; });
                return (
                  <g>
                    <path d={path} fill="none" stroke="#2b5bff" strokeWidth="2" />
                    {pts.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="5"
                          fill={p.b === "4" ? "#16a34a" : "#2b5bff"} />
                        <text x={p.x} y={p.y - 10} fontSize="10" textAnchor="middle"
                          fill="var(--ink)">{p.b + "b"}</text>
                      </g>
                    ))}
                    <text x="330" y="100" fontSize="10" textAnchor="middle" fill="#16a34a" fontWeight="700">sweet spot</text>
                  </g>
                );
              })()}
            </g>
          ), "0 0 600 215", 220)}

          {warn(
            <span>
              Low perplexity does <b>not</b> guarantee task quality. Quantization can keep
              perplexity flat while quietly hurting multi-step reasoning, code, or long
              instruction-following. Always confirm on <b>real downstream benchmarks</b>
              {" "}(GSM8K, HumanEval, MMLU), not perplexity alone.
            </span>
          )}
        </div>
      ),
    },

    /* =====================================================================
       STAGE 11 — decision
       ===================================================================== */
    {
      id: "decision",
      group: "Strategy",
      title: "Choosing a Quantization Strategy",
      map: "Strategy",
      why: "Pulling it together: match the format to the goal. Training, consumer fine-tuning, high-throughput serving, memory-constrained serving, and edge all have a clear default.",
      render: () => (
        <div>
          <Lead>
            There is no single &quot;best&quot; quantization — there is a best <i>for your
            goal and your hardware</i>. Here is the decision map.
          </Lead>

          {subhead("By goal")}
          {tbl(
            <tbody>
              <tr>{th("Goal")}{th("Recommendation")}</tr>
              <tr>{td(<b>Train a model</b>)}{td("BF16 mixed precision; add FP8 on H100 for speed")}</tr>
              <tr>{td(<b>Fine-tune on a consumer GPU</b>)}{td("QLoRA with NF4 + double quantization")}</tr>
              <tr>{td(<b>Serve — max throughput</b>)}{td("FP8 (H100) or INT8 W8A8 via SmoothQuant")}</tr>
              <tr>{td(<b>Serve — memory-constrained / huge model</b>)}{td("4-bit W4A16 via AWQ or GPTQ")}</tr>
              <tr>{td(<b>Run on edge / CPU</b>)}{td("GGUF k-quants (Q4_K_M and friends)")}</tr>
            </tbody>
          )}

          {subhead("Summary — formats & methods at a glance")}
          {tbl(
            <tbody>
              <tr>{th("Format / method")}{th("Bits")}{th("Typical quality loss")}{th("Best hardware")}{th("Use case")}</tr>
              <tr>{td("BF16")}{td("16")}{td("None (baseline)")}{td("Any modern GPU")}{td("Training, reference inference")}</tr>
              <tr>{td("FP8")}{td("8")}{td("Near-zero")}{td("H100 / Ada+")}{td("Fast training & serving")}</tr>
              <tr>{td("INT8 / SmoothQuant")}{td("8")}{td("Near-zero")}{td("INT8 tensor cores")}{td("High-throughput W8A8 serving")}</tr>
              <tr>{td("AWQ / GPTQ")}{td("4")}{td("Small (~1-2% PPL)")}{td("Any GPU")}{td("Memory-bound 4-bit serving")}</tr>
              <tr>{td("NF4 (QLoRA)")}{td("4")}{td("Small")}{td("Consumer GPU")}{td("Single-GPU fine-tuning")}</tr>
              <tr>{td("GGUF k-quants")}{td("2-8")}{td("Varies by quant")}{td("CPU / Apple / edge")}{td("Local & on-device inference")}</tr>
              <tr>{td("INT3 / INT2")}{td("2-3")}{td("Real, visible")}{td("Specialized")}{td("Extreme compression only")}</tr>
            </tbody>
          )}

          {info(
            <span>
              <b>The default playbook:</b> start at <b>INT8 / FP8</b> — it is near-lossless,
              so take the free win. Drop to <b>4-bit (AWQ / GPTQ)</b> only when memory
              forces it; the quality cost is small and usually worth it. <b>Below 4-bit,
              expect real, measurable quality loss</b> — go there only with eyes open and a
              downstream eval in hand.
            </span>
          )}
        </div>
      ),
    },

  ];

  window.ML_META = {
    title: "LLM Quantization",
    subtitle: "FP32 to INT4 — number formats, GPTQ, AWQ, and the accuracy tradeoff",
    cur: "Quantization",
    category: "LLM Training",
    run: () => ({}),
    default: {},
    renderInput: null,
    modeLinks: [
      { label: "Pre-Training",  href: "LLM-PreTraining.html",        active: false },
      { label: "Distributed",   href: "Distributed-Training.html",   active: false },
      { label: "Quantization",  href: "Quantization.html",           active: true  },
      { label: "MoE",           href: "Mixture-of-Experts.html",     active: false },
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
