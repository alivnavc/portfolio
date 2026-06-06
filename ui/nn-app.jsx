/* ============================================================
   Shared shell for the Neural-Network explainers.
   Reuses window.Diagram / DiagramBar / TipLayer / Matrix.
   Per page set BEFORE this script:
     window.NN_ARCH   "ann" | "cnn" | "rnn" | "lstm"
     window.NN_STAGES array of { id, group, title, map, why, render(trace) }
     window.NN_META   { title, subtitle, cur, run, default, renderInput? }
   ============================================================ */
const { useMemo: useM, useEffect: useE, useState: useSt } = React;

const NN_ARCHS = [
  { id: "ann", label: "ANN / MLP", href: "Neural Network (ANN).html" },
  { id: "cnn", label: "CNN", href: "Convolutional Network (CNN).html" },
  { id: "rnn", label: "RNN", href: "Recurrent Network (RNN).html" },
  { id: "lstm", label: "LSTM", href: "LSTM Network.html" },
];

function NNApp() {
  const META = window.NN_META;
  const STAGES = window.NN_STAGES;
  const ARCH = window.NN_ARCH;
  const [input, setInput] = useSt(() => JSON.parse(JSON.stringify(META.default)));
  const [step, setStep] = useSt(0);
  const [animKey, setAnimKey] = useSt(0);

  useE(() => { document.documentElement.setAttribute("data-tftheme", "paper"); var l = document.getElementById("tf-loader"); if (l) l.remove(); }, []);
  useE(() => { window.scrollTo(0, 0); }, [step]);
  useE(() => setAnimKey((k) => k + 1), [step, input]);

  const trace = useM(() => META.run(input), [input]);
  const stage = STAGES[step];
  const go = (d) => setStep((s) => Math.max(0, Math.min(STAGES.length - 1, s + d)));
  useE(() => {
    const h = (e) => { if (e.target.closest("input,textarea")) return;
      if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
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
          <span className="tf-archbar-lbl">Neural Networks</span>
          <span className="tf-archbar-sep">/</span>
          <span className="tf-archbar-cur">{META.cur}</span>
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
          {META.renderInput && (
            <div className="nn-input-bar">{META.renderInput(input, setInput)}</div>
          )}
        </header>

        <div className="tf-main tf-main--solo">
          <window.DiagramBar stages={STAGES} current={step} onJump={setStep} />
          <section className="tf-stage">
            <div className="tf-stage-head">
              <span className="tf-stage-group">{stage.group}</span>
              <h2 className="tf-stage-title">{stage.title}</h2>
            </div>
            {stage.why && (
              <div className="tf-why">
                <span className="tf-why-ic">?</span>
                <div><b>Why this step?</b> {stage.why}</div>
              </div>
            )}
            <div className="tf-stage-body" key={animKey}>{stage.render(trace, { input, setInput })}</div>
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

ReactDOM.createRoot(document.getElementById("root")).render(<NNApp />);
