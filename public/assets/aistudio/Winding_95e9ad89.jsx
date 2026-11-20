import { useEffect, useMemo, useState } from "react";

/* =====================================================================
   Winding Department – Shift Production Book (React)
   Drop into src/pages/ and add a route, e.g.
     <Route path="/winding" element={<WindingProduction />} />

   DATA LAYER: the original used Google Apps Script. Here it is replaced by
   a small localStorage store (same functions, same shapes). To use a real
   backend later, change only the `store` object below.
   ===================================================================== */

const QUALITIES = [
  { k: "WRAP", t: "WRAP Winding" },
  { k: "PRECISION", t: "PRECISION Winding" },
  { k: "OTHER", t: "OTHER Winding" },
];
const SHIFTS = ["A", "B", "C"];
const DEFAULT_READINGS = 4;

const KEY_ENTRIES = "winding.entries"; // [{date, shift, meta:{warp,weft,clerk}, rows:[...]}]
const KEY_WINDERS = "winding.winders"; // [{no, name}]

const read = (k) => {
  try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const store = {
  getWinders: () => read(KEY_WINDERS),
  loadEntry(date, shift) {
    const e = read(KEY_ENTRIES).find((x) => x.date === date && x.shift === shift);
    return e ? { rows: e.rows, meta: e.meta } : { rows: [], meta: null };
  },
  saveEntry(p) {
    const all = read(KEY_ENTRIES).filter((x) => !(x.date === p.date && x.shift === p.shift));
    all.push({ date: p.date, shift: p.shift, meta: { warp: p.warp, weft: p.weft, clerk: p.clerk }, rows: p.rows });
    write(KEY_ENTRIES, all);
    // remember winders for auto-suggest
    const ws = read(KEY_WINDERS);
    p.rows.forEach((r) => {
      if ((r.no || r.name) && !ws.some((w) => w.no === r.no && w.name === r.name)) ws.push({ no: r.no, name: r.name });
    });
    ws.sort((a, b) => String(a.no).localeCompare(String(b.no), undefined, { numeric: true }));
    write(KEY_WINDERS, ws);
    return { count: p.rows.length };
  },
  deleteEntry(date, shift) {
    write(KEY_ENTRIES, read(KEY_ENTRIES).filter((x) => !(x.date === date && x.shift === shift)));
  },
  getReport(from, to) {
    const list = read(KEY_ENTRIES).filter((x) => x.date >= from && x.date <= to);
    return {
      rows: list.flatMap((e) => e.rows.map((r) => ({ ...r, date: e.date, shift: e.shift, readings: r.readings.join(", ") }))),
      meta: list.map((e) => ({ date: e.date, shift: e.shift, ...e.meta })),
    };
  },
};

/* ---------- helpers ---------- */
const sum = (a) => a.reduce((x, y) => x + (Number(y) || 0), 0);
const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString("en-IN");
const blankRow = () => ({ no: "", name: "", readings: Array(DEFAULT_READINGS).fill("") });
const emptyData = () => Object.fromEntries(QUALITIES.map((q) => [q.k, [blankRow(), blankRow(), blankRow(), blankRow()]]));
const today = () => {
  const t = new Date(), p = (n) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
};
const groupSum = (rows, keyFn) => {
  const m = {};
  rows.forEach((r) => {
    const k = keyFn(r);
    m[k] = m[k] || { n: 0, t: 0, r };
    m[k].n++;
    m[k].t += r.total;
  });
  return m;
};

/* ===================================================================== */
export default function WindingProduction() {
  const [tab, setTab] = useState("entry");
  const [date, setDate] = useState(today());
  const [shift, setShift] = useState("A");
  const [meta, setMeta] = useState({ clerk: "", warp: "", weft: "" });
  const [data, setData] = useState(emptyData);
  const [cur, setCur] = useState(QUALITIES[0].k);
  const [winders, setWinders] = useState(() => store.getWinders());
  const [status, setStatus] = useState(null); // {type:'loaded'|'new', text}
  const [toast, setToast] = useState(null);   // {msg, err}
  const [rf, setRf] = useState({ from: today(), to: today(), shift: "" });
  const [report, setReport] = useState(null);

  const notify = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3200);
  };

  /* load saved entry whenever date / shift changes */
  useEffect(() => {
    if (!date) return;
    const d = store.loadEntry(date, shift);
    const next = Object.fromEntries(QUALITIES.map((q) => [q.k, []]));
    d.rows.forEach((r) => {
      if (next[r.quality]) next[r.quality].push({ no: r.no, name: r.name, readings: r.readings.length ? r.readings : [r.total] });
    });
    QUALITIES.forEach((q) => { if (!next[q.k].length) next[q.k] = [blankRow(), blankRow(), blankRow(), blankRow()]; });
    setData(next);
    setMeta(d.meta ? { clerk: d.meta.clerk || "", warp: d.meta.warp || "", weft: d.meta.weft || "" } : { clerk: "", warp: "", weft: "" });
    setStatus(
      d.rows.length
        ? { type: "loaded", text: `${d.rows.length} saved entries for ${date}, Shift ${shift} - edit and save to update.` }
        : { type: "new", text: `No entry yet for ${date}, Shift ${shift}.` }
    );
  }, [date, shift]);

  /* ---------- row editing (immutable updates) ---------- */
  const updateRows = (fn) => setData((d) => ({ ...d, [cur]: fn(d[cur]) }));
  const setField = (i, f, v) => updateRows((rows) => rows.map((r, x) => (x === i ? { ...r, [f]: v } : r)));
  const autoFill = (i, f) =>
    updateRows((rows) =>
      rows.map((r, x) => {
        if (x !== i) return r;
        if (f === "no") {
          const w = winders.find((w) => w.no && w.no === r.no);
          return w && !r.name ? { ...r, name: w.name } : r;
        }
        const w = winders.find((w) => w.name && w.name.toLowerCase() === r.name.toLowerCase());
        return w && !r.no ? { ...r, no: w.no } : r;
      })
    );
  const setReading = (i, j, v) =>
    updateRows((rows) => rows.map((r, x) => (x === i ? { ...r, readings: r.readings.map((o, y) => (y === j ? v : o)) } : r)));
  const addReading = (i) => updateRows((rows) => rows.map((r, x) => (x === i ? { ...r, readings: [...r.readings, ""] } : r)));
  const addRow = (ditto) =>
    updateRows((rows) => {
      const nr = blankRow();
      if (ditto && rows.length) nr.readings = [...rows[rows.length - 1].readings];
      return [...rows, nr];
    });
  const dittoRow = (i) => {
    if (i === 0) return notify("No row above to copy from", true);
    updateRows((rows) => rows.map((r, x) => (x === i ? { ...r, readings: [...rows[i - 1].readings] } : r)));
  };
  const delRow = (i) => updateRows((rows) => rows.filter((_, x) => x !== i));

  /* ---------- totals ---------- */
  const tabTotal = sum(data[cur].map((r) => sum(r.readings)));
  const grand = sum(QUALITIES.map((q) => sum(data[q.k].map((r) => sum(r.readings)))));

  /* ---------- actions ---------- */
  const collect = () =>
    QUALITIES.flatMap((q) =>
      data[q.k]
        .map((r) => ({ r, total: sum(r.readings) }))
        .filter(({ total }) => total > 0)
        .map(({ r, total }) => ({
          quality: q.k,
          no: r.no.trim(),
          name: r.name.trim(),
          readings: r.readings.filter((x) => x !== "" && !isNaN(x)).map(Number),
          total,
        }))
    );

  const saveAll = () => {
    if (!date) return notify("Please select a date", true);
    const rows = collect();
    if (!rows.length) return notify("No production entered", true);
    try {
      const r = store.saveEntry({ date, shift, ...meta, grand: sum(rows.map((x) => x.total)), rows });
      setWinders(store.getWinders());
      setStatus({ type: "loaded", text: "This shift is saved." });
      notify(`Saved ${r.count} winder entries`);
    } catch (e) {
      notify(e.message || "Save failed", true);
    }
  };
  const clearAll = () => {
    setData(emptyData());
    setMeta({ clerk: "", warp: "", weft: "" });
    setCur(QUALITIES[0].k);
  };
  const removeEntry = () => {
    if (!date || !window.confirm(`Delete all saved production for ${date}, Shift ${shift}?`)) return;
    store.deleteEntry(date, shift);
    clearAll();
    setStatus({ type: "new", text: `No entry yet for ${date}, Shift ${shift}.` });
    notify("Entry deleted");
  };
  const goHome = () => { setTab("entry"); setCur(QUALITIES[0].k); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const runReport = () => {
    if (!rf.from || !rf.to) return notify("Select From and To dates", true);
    const d = store.getReport(rf.from, rf.to);
    if (rf.shift) {
      d.rows = d.rows.filter((r) => r.shift === rf.shift);
      d.meta = d.meta.filter((m) => m.shift === rf.shift);
    }
    setReport(d);
  };
  const exportCsv = () => {
    if (!report || !report.rows.length) return notify("Run a report first", true);
    const lines = [["Date", "Shift", "Quality", "Winder No", "Winder Name", "Readings", "Total Kg"]];
    report.rows.forEach((r) => lines.push([r.date, r.shift, r.quality, r.no, r.name, r.readings.replace(/,/g, " "), r.total]));
    const csv = lines.map((l) => l.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "winding_production.csv";
    a.click();
  };

  /* ---------- report numbers ---------- */
  const rep = useMemo(() => {
    if (!report) return null;
    const rows = report.rows;
    const total = sum(rows.map((r) => r.total));
    const shifts = new Set(rows.map((r) => r.date + "|" + r.shift)).size;
    const q = groupSum(rows, (r) => r.quality);
    return {
      total, shifts,
      winCount: new Set(rows.map((r) => r.no + "|" + r.name)).size,
      q: Object.entries(q).sort((a, b) => b[1].t - a[1].t),
      qMax: Math.max(1, ...Object.values(q).map((x) => x.t)),
      s: Object.entries(groupSum(rows, (r) => r.date + "|" + r.shift)).sort(),
      w: Object.values(groupSum(rows, (r) => r.no + "|" + r.name)).sort((a, b) => b.t - a.t),
    };
  }, [report]);

  const title = QUALITIES.find((q) => q.k === cur).t;

  return (
    <div className="wd">
      <style>{CSS}</style>

      <header>
        <div>
          <h1>Winding Department</h1>
          <small>Shift Operations ERP &middot; Warp / Precision Winding Production Book</small>
        </div>
        <button className="homebtn" onClick={goHome}>&#8962; Home</button>
      </header>

      <nav className="wd-tabs">
        {[["entry", "📜 Production Book"], ["report", "📊 Reports"], ["winders", "👥 Winders"]].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      <main>
        {/* ================= PRODUCTION ENTRY ================= */}
        {tab === "entry" && (
          <section>
            <div className="card">
              <div className="grid">
                <div><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div><label>Shift</label>
                  <select value={shift} onChange={(e) => setShift(e.target.value)}>{SHIFTS.map((s) => <option key={s}>{s}</option>)}</select>
                </div>
                <div><label>Tally Clerk</label><input value={meta.clerk} placeholder="Signature of the Tally Clerk" onChange={(e) => setMeta({ ...meta, clerk: e.target.value })} /></div>
                <div><label>Warp</label><input value={meta.warp} placeholder="Warp" onChange={(e) => setMeta({ ...meta, warp: e.target.value })} /></div>
                <div><label>Weft</label><input value={meta.weft} placeholder="Weft" onChange={(e) => setMeta({ ...meta, weft: e.target.value })} /></div>
              </div>
              <div style={{ marginTop: 14 }}>
                {status && (
                  <span className="status">
                    <span className={"chip" + (status.type === "new" ? " new" : "")}>{status.type === "new" ? "New" : "Saved"}</span> {status.text}
                  </span>
                )}
              </div>
            </div>

            <div className="subtabs">
              {QUALITIES.map((q) => {
                const n = data[q.k].filter((r) => sum(r.readings) > 0).length;
                return (
                  <button key={q.k} className={q.k === cur ? "active" : ""} onClick={() => setCur(q.k)}>
                    {q.k}{n > 0 && <span className="badge">{n}</span>}
                  </button>
                );
              })}
            </div>

            <div className="panel">
              <h2>{title}</h2>
              <p className="hint">Enter each bobbin / cut weight in Kg. Total is calculated automatically. Use <b>Same as above</b> for paired winders (the "do" / ditto rows in the book).</p>
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>Winder No.</th><th>Winder Name</th><th>Production (Kg)</th><th>Total (Kg)</th><th style={{ width: 110 }}></th></tr></thead>
                  <tbody>
                    {data[cur].map((r, i) => (
                      <tr key={i}>
                        <td className="num"><input list="dlNo" value={r.no} placeholder="No." onChange={(e) => setField(i, "no", e.target.value)} onBlur={() => autoFill(i, "no")} /></td>
                        <td className="name"><input list="dlName" value={r.name} placeholder="Winder name" onChange={(e) => setField(i, "name", e.target.value)} onBlur={() => autoFill(i, "name")} /></td>
                        <td>
                          <div className="readings">
                            {r.readings.map((v, j) => (
                              <input key={j} type="number" step="any" min="0" value={v} onChange={(e) => setReading(i, j, e.target.value)} />
                            ))}
                            <button className="mini" title="Add reading" onClick={() => addReading(i)}>+</button>
                          </div>
                        </td>
                        <td className="tot"><input readOnly value={fmt(sum(r.readings))} /></td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button className="iconbtn" title="Same as above" onClick={() => dittoRow(i)}>⧉</button>
                          <button className="iconbtn del" title="Delete row" onClick={() => delRow(i)}>&#10005;</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="toolbar">
                <button className="btn sec" onClick={() => addRow()}>+ Add Winder</button>
                <button className="btn sec" onClick={() => addRow(true)}>⧉ Add Same-as-above Row</button>
              </div>
              <div className="totalrow"><label>Total Production (this tab)</label><input readOnly value={fmt(tabTotal)} /></div>
            </div>

            <div className="card">
              <div className="totalrow" style={{ border: 0, margin: 0, padding: 0 }}>
                <label style={{ fontSize: 17 }}><b>Grand Total (all qualities)</b></label>
                <input readOnly value={fmt(grand)} style={{ fontSize: 18, fontWeight: 700 }} />
              </div>
              <div className="toolbar" style={{ justifyContent: "flex-end" }}>
                <button className="btn danger" onClick={removeEntry}>Delete this shift entry</button>
                <button className="btn sec" onClick={clearAll}>Clear form</button>
                <button className="btn" onClick={saveAll}>&#128190; Save Shift Production</button>
              </div>
            </div>
          </section>
        )}

        {/* ================= REPORTS ================= */}
        {tab === "report" && (
          <section>
            <div className="card">
              <div className="grid">
                <div><label>From</label><input type="date" value={rf.from} onChange={(e) => setRf({ ...rf, from: e.target.value })} /></div>
                <div><label>To</label><input type="date" value={rf.to} onChange={(e) => setRf({ ...rf, to: e.target.value })} /></div>
                <div><label>Shift</label>
                  <select value={rf.shift} onChange={(e) => setRf({ ...rf, shift: e.target.value })}>
                    <option value="">All</option>{SHIFTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}><button className="btn" style={{ width: "100%" }} onClick={runReport}>Show Report</button></div>
              </div>
            </div>

            {rep && (
              <>
                <div className="stats">
                  <div className="stat"><b>{fmt(rep.total)}</b><span>Total Production (Kg)</span></div>
                  <div className="stat"><b>{rep.shifts}</b><span>Shifts Recorded</span></div>
                  <div className="stat"><b>{rep.shifts ? fmt(rep.total / rep.shifts) : 0}</b><span>Avg Kg / Shift</span></div>
                  <div className="stat"><b>{rep.winCount}</b><span>Winders</span></div>
                </div>

                <div className="two">
                  <div className="panel round"><h2>By Quality</h2>
                    <div className="tbl-wrap"><table>
                      <thead><tr><th>Quality</th><th>Winders</th><th>Total Kg</th><th></th></tr></thead>
                      <tbody>
                        {rep.q.length ? rep.q.map(([k, v]) => (
                          <tr key={k}><td><b>{k}</b></td><td>{v.n}</td><td>{fmt(v.t)}</td>
                            <td><div className="bar"><i style={{ width: (v.t / rep.qMax) * 100 + "%" }} /></div></td></tr>
                        )) : <tr><td colSpan="4">No data</td></tr>}
                      </tbody>
                    </table></div>
                  </div>
                  <div className="panel round"><h2>By Date &amp; Shift</h2>
                    <div className="tbl-wrap"><table>
                      <thead><tr><th>Date</th><th>Shift</th><th>Total Kg</th><th>Clerk</th></tr></thead>
                      <tbody>
                        {rep.s.length ? rep.s.map(([k, v]) => {
                          const [dt, sf] = k.split("|");
                          const m = report.meta.find((x) => x.date === dt && x.shift === sf);
                          return <tr key={k}><td>{dt}</td><td>{sf}</td><td>{fmt(v.t)}</td><td>{m ? m.clerk : ""}</td></tr>;
                        }) : <tr><td colSpan="4">No data</td></tr>}
                      </tbody>
                    </table></div>
                  </div>
                </div>

                <div className="panel round"><h2>Winder-wise Production</h2>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Winder No.</th><th>Name</th><th>Entries</th><th>Total Kg</th></tr></thead>
                    <tbody>
                      {rep.w.length ? rep.w.map((v, i) => (
                        <tr key={i}><td>{v.r.no}</td><td>{v.r.name}</td><td>{v.n}</td><td>{fmt(v.t)}</td></tr>
                      )) : <tr><td colSpan="4">No data</td></tr>}
                    </tbody>
                  </table></div>
                </div>

                <div className="panel round"><h2>Detailed Entries</h2>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Date</th><th>Shift</th><th>Quality</th><th>Winder No.</th><th>Name</th><th>Readings</th><th>Total Kg</th></tr></thead>
                    <tbody>
                      {report.rows.length ? report.rows.map((r, i) => (
                        <tr key={i}><td>{r.date}</td><td>{r.shift}</td><td>{r.quality}</td><td>{r.no}</td><td>{r.name}</td><td>{r.readings}</td><td>{fmt(r.total)}</td></tr>
                      )) : <tr><td colSpan="7">No data</td></tr>}
                    </tbody>
                  </table></div>
                  <div className="toolbar"><button className="btn sec" onClick={exportCsv}>&#11015; Download CSV</button></div>
                </div>
              </>
            )}
          </section>
        )}

        {/* ================= WINDERS ================= */}
        {tab === "winders" && (
          <section>
            <div className="panel round">
              <h2>Winder Master</h2>
              <p className="hint">Winders are added automatically when you save a shift. They appear as suggestions while typing a Winder No. or Name.</p>
              <div className="tbl-wrap"><table>
                <thead><tr><th>Winder No.</th><th>Winder Name</th></tr></thead>
                <tbody>
                  {winders.length ? winders.map((w, i) => <tr key={i}><td>{w.no || "-"}</td><td>{w.name}</td></tr>)
                    : <tr><td colSpan="2" style={{ color: "var(--muted)", padding: 18 }}>No winders yet. They are added when you save a shift.</td></tr>}
                </tbody>
              </table></div>
            </div>
          </section>
        )}
      </main>

      <datalist id="dlNo">{winders.filter((w) => w.no).map((w, i) => <option key={i} value={w.no}>{w.name}</option>)}</datalist>
      <datalist id="dlName">{winders.filter((w) => w.name).map((w, i) => <option key={i} value={w.name}>{w.no}</option>)}</datalist>

      <div className={"toast" + (toast ? " show" : "") + (toast && toast.err ? " err" : "")}>{toast ? toast.msg : ""}</div>
    </div>
  );
}

/* ---------- styles (scoped under .wd so they don't clash with the rest of the ERP) ---------- */
const CSS = `
.wd{--blue:#1557b0;--blue-dark:#0d3b84;--cyan:#22c3dd;--bg:#f1f4fa;--card:#fff;--line:#e3e8f1;--text:#1c2433;--muted:#667085;--soft:#e3ecfb;--ro:#f0f2f7;--ok:#12805c;--danger:#c62828;
  font-family:'Segoe UI',system-ui,-apple-system,Roboto,Arial,sans-serif;background:var(--bg);color:var(--text);font-size:15px;min-height:100vh}
.wd *{box-sizing:border-box}
.wd header{background:linear-gradient(135deg,#1557b0,#0d3b84);color:#fff;padding:22px 30px;display:flex;justify-content:space-between;align-items:center}
.wd header h1{margin:0;font-size:26px}
.wd header small{opacity:.85;font-size:14px;display:block;margin-top:2px}
.wd .homebtn{background:rgba(255,255,255,.18);border:0;color:#fff;font-weight:600;padding:12px 20px;border-radius:10px;cursor:pointer;font-size:15px}
.wd .homebtn:hover{background:rgba(255,255,255,.28)}
.wd .wd-tabs{background:var(--blue-dark);display:flex;flex-direction:row;flex-wrap:nowrap;gap:2px;overflow-x:auto;width:100%}
.wd .wd-tabs button{flex:0 0 auto;width:auto;display:block;background:none;border:0;border-radius:0;color:#dbe6fb;padding:18px 28px;font-size:16px;cursor:pointer;border-bottom:3px solid transparent;white-space:nowrap}
.wd .wd-tabs button.active{background:rgba(255,255,255,.12);color:#fff;font-weight:700;border-bottom-color:var(--cyan)}
.wd main{padding:26px 30px;max-width:1500px;margin:auto}
.wd .card{background:var(--card);border-radius:14px;box-shadow:0 2px 10px rgba(20,40,90,.06);padding:26px;margin-bottom:22px}
.wd .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px}
.wd label{display:block;font-weight:600;font-size:14px;margin-bottom:8px;color:#344054}
.wd input,.wd select{width:100%;padding:13px 14px;border:1px solid #d5dbe7;border-radius:10px;font-size:15px;background:#fff;color:var(--text);font-family:inherit}
.wd input:focus,.wd select:focus{outline:2px solid #9ec1f5;border-color:var(--blue)}
.wd input[readonly]{background:var(--ro);font-weight:600}
.wd .subtabs{display:flex;background:var(--soft);border-radius:6px 6px 0 0;overflow-x:auto}
.wd .subtabs button{flex:1;min-width:110px;background:none;border:0;padding:16px 10px;color:var(--blue);font-size:15px;cursor:pointer}
.wd .subtabs button.active{background:var(--blue);color:#fff;font-weight:700}
.wd .badge{display:inline-block;background:#fff;color:var(--blue);border-radius:10px;font-size:11px;padding:1px 7px;margin-left:6px;font-weight:700}
.wd .panel{background:#fff;border-radius:0 0 14px 14px;box-shadow:0 2px 10px rgba(20,40,90,.06);padding:26px;margin-bottom:22px}
.wd .panel.round{border-radius:14px}
.wd .panel h2{margin:0 0 6px;color:var(--blue-dark);font-size:21px}
.wd .hint{color:var(--muted);font-size:14px;margin:0 0 20px}
.wd .tbl-wrap{overflow-x:auto}
.wd table{width:100%;border-collapse:collapse}
.wd thead th{background:var(--blue);color:#fff;text-align:left;padding:14px 10px;font-size:14px;white-space:nowrap}
.wd tbody td{padding:7px 5px;border-bottom:1px solid var(--line);vertical-align:middle}
.wd td.num{width:130px}.wd td.name{min-width:200px}.wd td.tot{width:130px}
.wd .readings{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.wd .readings input{width:74px;padding:11px 8px;text-align:center}
.wd .mini{border:1px dashed #9db6dd;background:#f7faff;color:var(--blue);border-radius:8px;padding:9px 12px;cursor:pointer;font-size:14px}
.wd .mini:hover{background:var(--soft)}
.wd .iconbtn{border:0;background:none;cursor:pointer;font-size:17px;padding:8px;border-radius:8px;color:var(--muted)}
.wd .iconbtn:hover{background:var(--soft);color:var(--blue)}
.wd .iconbtn.del:hover{color:var(--danger);background:#fdecec}
.wd .toolbar{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px;align-items:center}
.wd .btn{background:var(--blue);color:#fff;border:0;padding:13px 24px;border-radius:10px;font-weight:600;font-size:15px;cursor:pointer}
.wd .btn:hover{background:var(--blue-dark)}
.wd .btn.sec{background:var(--soft);color:var(--blue)}
.wd .btn.sec:hover{background:#d3e1fa}
.wd .btn.danger{background:#fdecec;color:var(--danger)}
.wd .totalrow{display:flex;justify-content:flex-end;align-items:center;gap:16px;border-top:1px solid var(--line);margin-top:10px;padding-top:18px}
.wd .totalrow label{margin:0;font-size:15px;color:var(--text)}
.wd .totalrow input{width:200px}
.wd .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;margin-bottom:22px}
.wd .stat{background:#fff;border-radius:14px;padding:20px;box-shadow:0 2px 10px rgba(20,40,90,.06);border-left:5px solid var(--cyan)}
.wd .stat b{display:block;font-size:26px;color:var(--blue-dark)}
.wd .stat span{color:var(--muted);font-size:13px}
.wd .status{font-size:14px;color:var(--muted)}
.wd .chip{display:inline-block;padding:3px 10px;border-radius:12px;background:#e6f6ef;color:var(--ok);font-size:12px;font-weight:700}
.wd .chip.new{background:#fff4e0;color:#b36b00}
.wd .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(80px);background:#10244d;color:#fff;padding:14px 24px;border-radius:12px;opacity:0;transition:.3s;z-index:50;font-weight:500;pointer-events:none}
.wd .toast.show{transform:translateX(-50%);opacity:1}
.wd .toast.err{background:var(--danger)}
.wd .two{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.wd .bar{height:10px;background:var(--soft);border-radius:6px;overflow:hidden;min-width:90px}
.wd .bar i{display:block;height:100%;background:linear-gradient(90deg,var(--blue),var(--cyan))}
@media(max-width:900px){.wd .two{grid-template-columns:1fr}.wd header{padding:16px}.wd main{padding:14px}.wd .card,.wd .panel{padding:16px}}
`;