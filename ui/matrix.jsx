/* ============================================================
   Matrix UI primitives: heat-mapped grids, hover tooltips that
   reconstruct each cell's calculation, formula helpers.
   Exposes everything on window for the other babel scripts.
   ============================================================ */
const { useState, useRef, createContext, useContext, useEffect } = React;

/* ---------- number formatting ---------- */
function fmt(x, p = 2) {
  if (typeof x !== "number") return x == null ? "—" : String(x);
  if (x === Infinity) return "∞";
  if (x === -Infinity) return "−∞";
  if (!isFinite(x)) return "—";
  let s = x.toFixed(p);
  if (s === "-0.00" || s === "-0.0" || s === "-0") s = (0).toFixed(p);
  return s.replace("-", "−");
}

/* ---------- floating tooltip layer ---------- */
const TipCtx = createContext({ show: () => {}, hide: () => {} });

function TipLayer({ children }) {
  const [tip, setTip] = useState({ vis: false, node: null, x: 0, y: 0 });
  const api = {
    show: (node, e) => {
      setTip({ vis: true, node, x: e.clientX, y: e.clientY });
    },
    move: (e) => setTip((t) => (t.vis ? { ...t, x: e.clientX, y: e.clientY } : t)),
    hide: () => setTip((t) => ({ ...t, vis: false })),
  };
  // keep tooltip on-screen
  const w = 320;
  let left = tip.x + 16;
  if (left + w > window.innerWidth - 12) left = tip.x - w - 16;
  let top = tip.y + 16;
  return (
    <TipCtx.Provider value={api}>
      {children}
      {tip.vis && (
        <div className="tf-tip" style={{ left, top, width: w }}>
          {tip.node}
        </div>
      )}
    </TipCtx.Provider>
  );
}
const useTip = () => useContext(TipCtx);

/* ---------- heat color ---------- */
function heatStyle(v, scale, on) {
  if (!on || !isFinite(v) || scale === 0) return {};
  const a = Math.min(0.92, (Math.abs(v) / scale) * 0.85 + 0.06);
  const rgb = v >= 0 ? "var(--pos-rgb)" : "var(--neg-rgb)";
  return { background: `rgba(${rgb}, ${a})` };
}

/* ---------- Matrix ---------- */
function Matrix({
  data, rowLabels, colLabels, caption, sub, heat = true,
  cellTip, highlight, dimMask = false, compact = false, accent = false,
}) {
  const tip = useTip();
  const flat = data.flat().filter((x) => isFinite(x));
  const scale = flat.length ? Math.max(...flat.map(Math.abs)) : 1;
  const rows = data.length, cols = data[0]?.length || 0;

  return (
    <div className={"tf-matrix" + (accent ? " is-accent" : "") + (compact ? " is-compact" : "")}>
      {caption && (
        <div className="tf-mx-cap">
          <span className="tf-mx-name">{caption}</span>
          {sub && <span className="tf-mx-sub">{sub}</span>}
          <span className="tf-mx-dim">{rows}×{cols}</span>
        </div>
      )}
      <div className="tf-mx-body">
        {colLabels && (
          <div className="tf-mx-collabels" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {colLabels.map((c, j) => (
              <div key={j} className="tf-mx-collabel">{c}</div>
            ))}
          </div>
        )}
        <div className="tf-mx-rows">
          {data.map((row, i) => (
            <div className="tf-mx-rowwrap" key={i}>
              {rowLabels && <div className="tf-mx-rowlabel">{rowLabels[i]}</div>}
              <div className="tf-mx-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {row.map((v, j) => {
                  const masked = dimMask && v === -Infinity;
                  const hot = highlight && highlight(i, j);
                  return (
                    <div
                      key={j}
                      className={
                        "tf-cell" + (masked ? " is-masked" : "") +
                        (hot ? " is-hot" : "") + (cellTip ? " is-live" : "")
                      }
                      style={masked ? {} : heatStyle(v, scale, heat)}
                      onMouseEnter={cellTip ? (e) => tip.show(cellTip(i, j, v), e) : undefined}
                      onMouseMove={cellTip ? (e) => tip.move?.(e) : undefined}
                      onMouseLeave={cellTip ? () => tip.hide() : undefined}
                    >
                      {masked ? "−∞" : fmt(v)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- small inline math helpers ---------- */
const V = ({ children }) => <span className="tf-var">{children}</span>;        // variable
const Sub = ({ children }) => <sub className="tf-sub">{children}</sub>;
const Sup = ({ children }) => <sup className="tf-sup">{children}</sup>;

/* A boxed symbolic formula line */
function Formula({ children, label }) {
  return (
    <div className="tf-formula">
      {label && <span className="tf-formula-label">{label}</span>}
      <div className="tf-formula-body">{children}</div>
    </div>
  );
}

/* tooltip body for a dot-product cell: out = Σ a_k · b_k */
function DotTip({ title, terms, scaleLabel, result }) {
  return (
    <div>
      <div className="tf-tip-title">{title}</div>
      <div className="tf-tip-calc">
        {terms.map((t, k) => (
          <span key={k} className="tf-term">
            {k > 0 && <span className="tf-op">+</span>}
            <span className="tf-fac">{fmt(t.a)}</span>
            <span className="tf-op">×</span>
            <span className="tf-fac">{fmt(t.b)}</span>
          </span>
        ))}
      </div>
      <div className="tf-tip-sum">
        = {fmt(terms.reduce((s, t) => s + t.a * t.b, 0))}
        {scaleLabel && <span className="tf-tip-scale"> {scaleLabel}</span>}
        <span className="tf-tip-eq"> = {fmt(result)}</span>
      </div>
    </div>
  );
}

Object.assign(window, { fmt, TipLayer, useTip, Matrix, V, Sub, Sup, Formula, DotTip });

/* ---------- layout helpers shared by stages ---------- */
const Lead = ({ children }) => <p className="tf-lead">{children}</p>;
const Note = ({ children, icon = "i" }) => (
  <div className="tf-note"><span className="tf-note-ic">{icon}</span><div>{children}</div></div>
);
const Row = ({ children, wrap = true, gap }) => (
  <div className="tf-row" style={{ flexWrap: wrap ? "wrap" : "nowrap", gap }}>{children}</div>
);
const Arrow = ({ label }) => (
  <div className="tf-arrow"><span className="tf-arrow-line" /><span className="tf-arrow-head">▶</span>{label && <span className="tf-arrow-label">{label}</span>}</div>
);
const Tag = ({ children, tone }) => <span className={"tf-pill" + (tone ? " tf-pill--" + tone : "")}>{children}</span>;
const HeadCol = ({ label, accent, children }) => (
  <div className={"tf-headcol" + (accent ? " is-accent" : "")}>
    <div className="tf-headcol-lbl">{label}</div>
    <div className="tf-headcol-body">{children}</div>
  </div>
);

Object.assign(window, { Lead, Note, Row, Arrow, Tag, HeadCol });
