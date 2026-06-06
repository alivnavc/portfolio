/* ============================================================
   Architecture map — vertical pipeline with a fill line that
   reaches the active stage (the "data has flowed to here" cue).
   ============================================================ */
(function () {
  function Diagram({ stages, current, onJump, title }) {
    // group consecutive stages by .group
    const groups = [];
    stages.forEach((s, i) => {
      const g = groups[groups.length - 1];
      if (g && g.name === s.group) g.items.push({ s, i });
      else groups.push({ name: s.group, items: [{ s, i }] });
    });

    const groupIcon = {
      "Overview": "❖",
      "Input": "⌨",
      "Encoder": "▤",
      "Self-Attention": "◎",
      "Cross-Attention": "⇄",
      "Block": "▦",
      "Output": "★",
    };

    return (
      <nav className="tf-map" aria-label="architecture">
        <div className="tf-map-head">
          <span className="tf-map-title">{title || "Decoder block"}</span>
          <span className="tf-map-prog">{current + 1}/{stages.length}</span>
        </div>
        <div className="tf-map-track">
          <div className="tf-map-line">
            <div className="tf-map-fill" style={{ height: `calc(${(current) / (stages.length - 1) * 100}% )` }} />
          </div>
          <div className="tf-map-groups">
            {groups.map((g, gi) => (
              <div className="tf-map-group" key={gi}>
                <div className="tf-map-glabel">
                  <span className="tf-map-gic">{groupIcon[g.name] || "•"}</span>
                  {g.name}
                </div>
                {g.items.map(({ s, i }) => {
                  const state = i < current ? "done" : i === current ? "active" : "todo";
                  return (
                    <button
                      key={s.id}
                      className={"tf-map-node is-" + state}
                      onClick={() => onJump(i)}
                    >
                      <span className="tf-map-dot" />
                      <span className="tf-map-label">{s.map}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  /* horizontal stage rail (top of the explainer) */
  function DiagramBar({ stages, current, onJump }) {
    const railRef = React.useRef(null);
    React.useEffect(() => {
      const r = railRef.current; if (!r) return;
      const active = r.querySelector(".tf-rl-node.is-active");
      if (active) {
        const target = active.offsetLeft - r.clientWidth / 2 + active.clientWidth / 2;
        r.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
      }
    }, [current]);

    // group consecutive stages
    const groups = [];
    stages.forEach((s, i) => {
      const g = groups[groups.length - 1];
      if (g && g.name === s.group) g.items.push({ s, i });
      else groups.push({ name: s.group, items: [{ s, i }] });
    });

    return (
      <div className="tf-rail">
        <div className="tf-rl-scroll" ref={railRef}>
          {groups.map((g, gi) => (
            <div className="tf-rl-group" key={gi}>
              <span className="tf-rl-glabel">{g.name}</span>
              <div className="tf-rl-nodes">
                {g.items.map(({ s, i }) => {
                  const state = i < current ? "done" : i === current ? "active" : "todo";
                  return (
                    <button key={s.id} className={"tf-rl-node is-" + state} onClick={() => onJump(i)} title={s.title}>
                      <span className="tf-rl-dot" />
                      <span className="tf-rl-label">{s.map}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  window.Diagram = Diagram;
  window.DiagramBar = DiagramBar;
})();
