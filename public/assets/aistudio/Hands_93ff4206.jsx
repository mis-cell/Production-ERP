import { useState } from "react";
import { PageHead, EntryBar, Card, Cols, Field } from "../components/ui.jsx";
import { KEYS } from "../lib/storage.js";
import { useDayRegister } from "../lib/useDayRegister.js";
import { fnum, fmtShort, todayISO } from "../lib/utils.js";

// Ledger multipliers: No. of Hands = Yarn × 18, Yarn Power = Yarn × 225
const HAND_X = 18, POWER_X = 225;
const IN = ["yarn", "mill", "cesc", "wv", "sw"];
const EMPTY = Object.fromEntries(IN.map((k) => [k, ""]));
const draft = (f) => Object.fromEntries(IN.map((k) => [k, parseFloat(f[k]) || 0]));

// [color, title, unit, fields[id, label, kind(i=input|a=auto), step|decimals]]
const CARDS = [
  ["blue", "Yarn from Ambica & Others", "M.Ton", [["yarn", "M.Ton", "i", "0.001"], ["ag", "No. of Hands (x18)", "a", 0], ["my", "Total M.T.D. (M.Ton)", "a", 3], ["ma", "Total M.T.D. (Hands)", "a", 0]]],
  ["amber", "Hands", "Nos", [["mill", "Mill Hands", "i", "1"], ["th", "Total Hands", "a", 0], ["hpm", "Hands / M.T", "a", 2], ["mh", "M.T.D. Hands", "a", 0], ["mhpm", "M.T.D. Hands / M.T", "a", 2], ["dg", "Yarn Power (x225)", "a", 0], ["mdg", "Yarn MTD Power", "a", 0]]],
  ["green", "Power", "Units", [["cesc", "C.E.S.C", "i", "1"], ["tp", "Total", "a", 0], ["upm", "Units / M.T", "a", 0], ["mp", "M.T.D. Power", "a", 0], ["mupm", "M.T.D. Units / M.T", "a", 0]]],
  ["purple", "Weaving Production", "M.Ton", [["wv", "To-day", "i", "0.001"], ["sw", "Sewing Production", "i", "0.001"], ["mw", "Total M.T.D.", "a", 3]]],
];

// Month-to-date calculation; resets every month. `ov` overrides one date with the unsaved draft.
function calc(db, month, ov) {
  const m = { ...db };
  if (ov) m[ov.d] = ov.e;
  const c = { y: 0, a: 0, h: 0, dg: 0, p: 0, w: 0 };
  return Object.keys(m).filter((d) => d.startsWith(month)).sort().map((d) => {
    const e = m[d];
    const ag = Math.round((e.yarn || 0) * HAND_X), dg = Math.round((e.yarn || 0) * POWER_X);
    const th = (e.mill || 0) + ag, tp = (e.cesc || 0) + dg;
    c.y += e.yarn || 0; c.a += ag; c.h += th; c.dg += dg; c.p += tp; c.w += e.wv || 0;
    return {
      d, e, ag, dg, th, tp, my: c.y, ma: c.a, mh: c.h, mdg: c.dg, mp: c.p, mw: c.w,
      hpm: e.wv > 0 ? th / e.wv : null, mhpm: c.w > 0 ? c.h / c.w : null,
      upm: e.wv > 0 ? tp / e.wv : null, mupm: c.w > 0 ? c.p / c.w : null,
    };
  });
}

const GROUPS = [["Yarn from Ambica & Others (M.Ton)", 4], ["Hands", 7], ["Power", 5], ["Weaving Production", 3]];
const HEADS = ["M.Ton", "No. of Hands", "Total M.T.D. M.Ton", "Total M.T.D. Hands", "Mill Hands", "Total Hands", "Hands / M.T", "M.T.D. Hands", "M.T.D. Hands / M.T", "Yarn Power", "Yarn MTD Power", "C.E.S.C", "Total", "Units / M.T", "M.T.D. Power", "M.T.D. Units / M.T", "To-day", "Sewing", "Total M.T.D."];

export default function HandsPower() {
  const [tab, setTab] = useState("entry");
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const r = useDayRegister(KEYS.hp, EMPTY, { toStored: draft });

  const live = r.date ? calc(r.db, r.date.slice(0, 7), { d: r.date, e: draft(r.form) }).find((x) => x.d === r.date) : null;
  const recent = Object.keys(r.db).sort().slice(-7).reverse();
  const cache = {};
  const rowFor = (d) => { const m = d.slice(0, 7); cache[m] = cache[m] || calc(r.db, m); return cache[m].find((x) => x.d === d); };
  const edit = (d) => { r.setDate(d); setTab("entry"); window.scrollTo(0, 0); };
  const monthRows = calc(r.db, month);



  return (
    <>
      <PageHead title="Form 4 · Hands & Power" tab={tab} setTab={setTab} />
      {tab === "entry" ? (
        <>
          <EntryBar date={r.date} onDate={r.setDate} exists={r.exists} onSave={r.save} onClear={r.clear} onDelete={r.remove} />
          <div className="grid wide">
            {CARDS.map(([tone, title, unit, fields]) => (
              <Card key={title} title={title} unit={unit} tone={tone}>
                <Cols n={2}>
                  {fields.map(([id, label, kind, s]) => kind === "i"
                    ? <Field key={id} label={label} step={s} value={r.form[id]} onChange={(v) => r.set(id, v)} />
                    : <Field key={id} label={label} readOnly value={live ? fnum(live[id], s) : ""} />)}
                </Cols>
              </Card>
            ))}
          </div>
          <div className="box">
            <h2>Recent entries</h2>
            <div className="tw">
              <table className="data">
                <thead><tr><th>Date</th><th>Yarn (M.Ton)</th><th>Total Hands</th><th>Total Power</th><th>Weaving (M.Ton)</th><th>Units / M.Ton</th></tr></thead>
                <tbody>
                  {recent.length ? recent.map((d) => { const x = rowFor(d); return (
                    <tr key={d} className="click" onClick={() => edit(d)}>
                      <td>{fmtShort(d)}</td><td>{fnum(x.e.yarn, 3)}</td><td>{fnum(x.th)}</td><td>{fnum(x.tp)}</td><td>{fnum(x.e.wv, 3)}</td><td>{fnum(x.upm)}</td>
                    </tr>); }) : <tr><td colSpan={6} className="empty">No entries yet. Fill the form and save.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="hint">Click a row to edit it. Showing the last 7 entries; see the Report tab for all dates.</p>
          </div>
        </>
      ) : (
        <div className="box">
          <label className="fld" style={{ maxWidth: 200, marginBottom: 14 }}>
            <span>Month</span>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
          <div className="tw">
            <table className="data grouped">
              <thead>
                <tr><th rowSpan={2}>Date</th>{GROUPS.map(([t, n]) => <th key={t} colSpan={n}>{t}</th>)}</tr>
                <tr>{HEADS.map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {monthRows.length ? monthRows.map((x) => (
                  <tr key={x.d} className="click" onClick={() => edit(x.d)}>
                    {[fmtShort(x.d), fnum(x.e.yarn, 3), fnum(x.ag), fnum(x.my, 3), fnum(x.ma), fnum(x.e.mill), fnum(x.th), fnum(x.hpm, 2), fnum(x.mh), fnum(x.mhpm, 2), fnum(x.dg), fnum(x.mdg), fnum(x.e.cesc), fnum(x.tp), fnum(x.upm), fnum(x.mp), fnum(x.mupm), fnum(x.e.wv, 3), fnum(x.e.sw, 3), fnum(x.mw, 3)]
                      .map((v, i) => <td key={i}>{v}</td>)}
                  </tr>
                )) : <tr><td colSpan={20} className="empty">No entries for this month.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="hint">MTD columns restart on the 1st of each month. Click a row to edit that date.</p>
        </div>
      )}
    </>
  );
}
