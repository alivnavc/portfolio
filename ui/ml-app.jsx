/* ============================================================
   Shared shell for all ML Algorithm explainers.
   Per-page, set BEFORE this script:
     window.ML_STAGES  array of { id, group, title, map, why, render(trace, ctx) }
     window.ML_META    { title, subtitle, cur, category, run, default, renderInput?,
                         modeLinks? [{label, href, active}] }
   ============================================================ */
const { useMemo: useM, useEffect: useE, useState: useSt } = React;

function MLApp() {
  const META = window.ML_META;
  const STAGES = window.ML_STAGES;
  const [input, setInput] = useSt(() => JSON.parse(JSON.stringify(META.default)));
  const [step, setStep] = useSt(0);
  const [animKey, setAnimKey] = useSt(0);

  useE(() => {
    document.documentElement.setAttribute("data-tftheme", "paper");
    var l = document.getElementById("tf-loader");
    if (l) l.remove();
  }, []);
  useE(() => { window.scrollTo(0, 0); }, [step]);
  useE(() => setAnimKey(k => k + 1), [step, input]);

  const trace = useM(() => META.run(input), [input]);
  const stage = STAGES[step];
  const go = d => setStep(s => Math.max(0, Math.min(STAGES.length - 1, s + d)));

  useE(() => {
    const h = e => {
      if (e.target.closest("input,textarea,select")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <window.TipLayer>
      <div className="tf-app">
        {/* ── sticky header: nav bar + controls ���─ */}
        <div style={{position:"sticky",top:0,zIndex:100,background:"var(--bg)"}}>
          <div className="tf-archbar">
            <a className="tf-sitebrand" href="index.html" title="Home">
              <span className="tf-sitebrand-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="2.4"/><circle cx="5" cy="6" r="1.6"/>
                  <circle cx="19" cy="6" r="1.6"/><circle cx="5" cy="18" r="1.6"/>
                  <circle cx="19" cy="18" r="1.6"/>
                  <path d="M6.6 7 10 10.4M17.4 7 14 10.4M6.6 17 10 13.6M17.4 17 14 13.6"/>
                </svg>
              </span>
              <span className="tf-sitebrand-name">Neural Codex</span>
            </a>
            <span className="tf-archbar-sep">/</span>
            <span className="tf-archbar-lbl">{META.category || "ML Algorithms"}</span>
            <span className="tf-archbar-sep">/</span>
            <span className="tf-archbar-cur">{META.cur}</span>
            {META.modeLinks && META.modeLinks.length > 0 && (
              <div className="tf-archtabs" style={{marginLeft: 10}}>
                {META.modeLinks.map(m => (
                  <a key={m.href} className={"tf-archtab" + (m.active ? " is-on" : "")} href={m.href}>
                    {m.label}
                  </a>
                ))}
              </div>
            )}
            <div className="tf-archbar-right">
              <a className="tf-archbar-home" href="index.html">Home</a>
              <a className="tf-archbar-home" href="about.html">About me</a>
            </div>
          </div>

          {/* ── controls bar (only shown when page has sliders) ── */}
          {META.renderInput && (
            <header className="tf-top">
              <div className="tf-brand">
                <div className="tf-brand-text">
                  <b>{META.title}</b>
                  <span>{META.subtitle}</span>
                </div>
              </div>
              <div className="nn-input-bar">
                {META.renderInput(input, setInput, trace)}
              </div>
            </header>
          )}
        </div>

        {/* ── page title (no sliders) ── */}
        {!META.renderInput && (
          <header className="tf-top">
            <div className="tf-brand">
              <div className="tf-brand-text">
                <b>{META.title}</b>
                <span>{META.subtitle}</span>
              </div>
            </div>
          </header>
        )}

        {/* ── main content ── */}
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
            <div className="tf-stage-body" key={animKey}>
              {stage.render(trace, { input, setInput })}
            </div>
            <div className="tf-stage-foot">
              <button className="tf-nav" disabled={step === 0} onClick={() => go(-1)}>← Back</button>
              <div className="tf-dots">
                {STAGES.map((_, i) => (
                  <button key={i}
                    className={"tf-stepdot" + (i === step ? " is-on" : "") + (i < step ? " is-done" : "")}
                    onClick={() => setStep(i)}
                    title={STAGES[i].map}
                  />
                ))}
              </div>
              <button className="tf-nav tf-nav--primary" disabled={step === STAGES.length - 1} onClick={() => go(1)}>
                {step === STAGES.length - 1 ? "Done ✓" : "Next →"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </window.TipLayer>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MLApp />);
