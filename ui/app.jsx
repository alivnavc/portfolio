/* ============================================================
   Main app — shared by all three architecture pages.
   Configure per page via globals BEFORE this script:
     window.TF_ARCH   "decoder" | "encoder" | "encdec"
     window.TF_STAGES  array of stage objects (else decoder default)
     window.TF_META   { title, subtitle, maskLabel, defaultMask, maskToggle }
     window.TF_RUN    (tokenIds, maskOn) => trace   (else TFEngine.run)
   ============================================================ */
const { useMemo, useEffect: useEff, useState: useS, useRef: useR } = React;

const ARCHS = [
  { id: "decoder", label: "Decoder-only", href: "Decoder-Only Transformer.html" },
  { id: "encoder", label: "Encoder-only", href: "Encoder-Only Transformer.html" },
  { id: "encdec", label: "Encoder–Decoder", href: "Encoder-Decoder Transformer.html" },
];
const ARCH = window.TF_ARCH || "decoder";
const META = Object.assign(
  { title: "Decoder-only Transformer", subtitle: "how a GPT computes the next token, step by step",
    maskLabel: "Causal mask", defaultMask: true, maskToggle: true },
  window.TF_META || {}
);

function load(key, def) {
  try { const v = JSON.parse(localStorage.getItem("tf_" + ARCH + "_" + key)); return v == null ? def : v; }
  catch { return def; }
}
const save = (key, v) => { try { localStorage.setItem("tf_" + ARCH + "_" + key, JSON.stringify(v)); } catch {} };

function TokenEditor({ tokenIds, setTokenIds, label }) {
  const [menu, setMenu] = useS(null);
  const max = window.TF_CONFIG.maxSeq;
  const setAt = (i, id) => { const n = tokenIds.slice(); n[i] = id; setTokenIds(n); setMenu(null); };
  const remove = (i) => { if (tokenIds.length > 2) setTokenIds(tokenIds.filter((_, k) => k !== i)); };
  const add = () => { if (tokenIds.length < max) setTokenIds([...tokenIds, (tokenIds[tokenIds.length - 1] + 1) % window.TF_VOCAB.length]); };
  return (
    <div className="tf-tokeditor">
      <span className="tf-tokeditor-label">{label || "prompt"}</span>
      <div className="tf-tokeditor-chips">
        {tokenIds.map((id, i) => (
          <div className="tf-tokwrap" key={i}>
            <button className="tf-tokbtn" onClick={() => setMenu(menu === i ? null : i)}>
              {window.TF_VOCAB[id]}
              <span className="tf-tokbtn-caret">▾</span>
            </button>
            {tokenIds.length > 2 && (
              <button className="tf-tokx" onClick={() => remove(i)} title="remove">×</button>
            )}
            {menu === i && (
              <div className="tf-tokmenu">
                {window.TF_VOCAB.map((w, wid) => (
                  <button key={wid} className={"tf-tokmenu-item" + (wid === id ? " is-on" : "")}
                    onClick={() => setAt(i, wid)}>{w}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        {tokenIds.length < max && (
          <button className="tf-tokadd" onClick={add} title="add token">+</button>
        )}
      </div>
    </div>
  );
}

function App() {
  const STAGES = useMemo(() => window.TF_STAGES || window.STAGES_A.concat(window.STAGES_B), []);
  const runFn = window.TF_RUN || window.TFEngine.run;
  const hasTarget = !!META.target;
  const [tokenIds, setTokenIds] = useS(() => load("tokens", window.TF_DEFAULT));
  const [tgtIds, setTgtIds] = useS(() => load("tgt", META.target || []));
  const [step, setStep] = useS(0);
  const [maskOn, setMaskOn] = useS(() => load("mask", META.defaultMask));
  const [headView, setHeadView] = useS(() => load("head", 0));
  const [animKey, setAnimKey] = useS(0);

  useEff(() => save("tokens", tokenIds), [tokenIds]);
  useEff(() => save("tgt", tgtIds), [tgtIds]);
  useEff(() => { window.scrollTo(0, 0); }, [step]);
  useEff(() => save("mask", maskOn), [maskOn]);
  useEff(() => { document.documentElement.setAttribute("data-tftheme", "paper"); var l = document.getElementById("tf-loader"); if (l) l.remove(); }, []);
  useEff(() => save("head", headView), [headView]);
  useEff(() => setAnimKey((k) => k + 1), [step, tokenIds, tgtIds, maskOn, headView]);

  const trace = useMemo(() => hasTarget ? runFn(tokenIds, tgtIds, maskOn) : runFn(tokenIds, maskOn), [tokenIds, tgtIds, maskOn]);
  const stage = STAGES[step];

  const go = (d) => setStep((s) => Math.max(0, Math.min(STAGES.length - 1, s + d)));
  useEff(() => {
    const h = (e) => {
      if (e.target.closest("input,textarea")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <window.TipLayer>
      <div className="tf-app">
        <div className="tf-archbar">
          <a className="tf-sitebrand" href="index.html" title="Home">
            <span className="tf-sitebrand-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2.4"/><circle cx="5" cy="6" r="1.6"/><circle cx="19" cy="6" r="1.6"/><circle cx="5" cy="18" r="1.6"/><circle cx="19" cy="18" r="1.6"/><path d="M6.6 7 10 10.4M17.4 7 14 10.4M6.6 17 10 13.6M17.4 17 14 13.6"/></svg>
            </span>
            <span className="tf-sitebrand-name">Neural Codex</span>
          </a>
          <span className="tf-archbar-sep">/</span>
          <span className="tf-archbar-lbl">{META.topic || "Transformers"}</span>
          <span className="tf-archbar-sep">/</span>
          <span className="tf-archbar-cur">{(ARCHS.find((a) => a.id === ARCH) || {}).label || ""}</span>
          <div className="tf-archbar-right">
            <a className="tf-archbar-home" href="index.html">Home</a>
            <a className="tf-archbar-home" href="about.html">About me</a>
          </div>
        </div>
        <header className="tf-top">
          <div className="tf-brand">
            <div className="tf-brand-text">
              <b>{META.title}</b>
              <span>{META.subtitle}</span>
            </div>
          </div>
          <TokenEditor tokenIds={tokenIds} setTokenIds={setTokenIds} label={hasTarget ? (META.promptLabel || "source") : META.promptLabel} />
          {hasTarget && (
            <TokenEditor tokenIds={tgtIds} setTokenIds={setTgtIds} label={META.targetLabel || "target so far"} />
          )}
        </header>

        <div className="tf-main tf-main--solo">
          <window.DiagramBar stages={STAGES} current={step} onJump={setStep} />

          <section className="tf-stage">
            <div className="tf-stage-head">
              <span className="tf-stage-group">{stage.group}</span>
              <h2 className="tf-stage-title">{stage.title}</h2>
            </div>
            {stage.group === "Self-Attention" && stage.heads !== false && (
              <div className="tf-headbar">
                <span className="tf-headbar-lbl">Viewing</span>
                <div className="tf-headtoggle">
                  <button className={"tf-headbtn" + (headView === 0 ? " is-on" : "")} onClick={() => setHeadView(0)}>Head 1</button>
                  <button className={"tf-headbtn" + (headView === 1 ? " is-on" : "")} onClick={() => setHeadView(1)}>Head 2</button>
                  <button className={"tf-headbtn" + (headView === "both" ? " is-on" : "")} onClick={() => setHeadView("both")}>Both · parallel</button>
                </div>
                <span className="tf-headbar-hint">the {window.TF_CONFIG.nHeads} heads run at the same time on different slices of each vector</span>
              </div>
            )}
            {stage.why && (
              <div className="tf-why">
                <span className="tf-why-ic">?</span>
                <div><b>Why this step?</b> {stage.why}</div>
              </div>
            )}
            <div className="tf-stage-body" key={animKey}>
              {stage.render(trace, { headView, maskOn, setMaskOn })}
            </div>
            <div className="tf-stage-foot">
              <button className="tf-nav" disabled={step === 0} onClick={() => go(-1)}>← Back</button>
              <div className="tf-dots">
                {STAGES.map((_, i) => (
                  <button key={i} className={"tf-stepdot" + (i === step ? " is-on" : "") + (i < step ? " is-done" : "")}
                    onClick={() => setStep(i)} title={STAGES[i].map} />
                ))}
              </div>
              <button className="tf-nav tf-nav--primary" disabled={step === STAGES.length - 1} onClick={() => go(1)}>
                {step === STAGES.length - 1 ? "Done" : "Next →"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </window.TipLayer>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
