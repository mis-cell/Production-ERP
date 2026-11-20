import { useState } from "react";
import { PageHead, EntryBar, RangeBar, Card, Cols, Field } from "../components/ui.jsx";
import { KEYS } from "../lib/storage.js";
import { useDayRegister } from "../lib/useDayRegister.js";
import { downloadFile, fmtDMY, has, inRange } from "../lib/utils.js";

// single → one "Total" box; otherwise A/B/C shifts; auto → Cutting = 25 × Hemming (read-only)
const SECTIONS = [
  { id: "top", name: "Lapping Production", unit: "Qty", single: true },
  { id: "cal", name: "Calender Production", unit: "Qty", single: true },
  { id: "cut", name: "Cutting (X25)", unit: "Pcs", auto: { from: "hem", factor: 25 } },
  { id: "hem", name: "Hemming", unit: "(Bundles)" },
  { id: "her", name: "Herackle", unit: "Bundles" },
  { id: "saf", name: "Safety", unit: "Bundles" },
  { id: "hand", name: "Hand Sewing", unit: "Bundles" },
  { id: "press", name: "Press", unit: "B/S" },
];
const ks = (s) => (s.single ? ["V"] : ["A", "B", "C"]);
const EMPTY = Object.fromEntries(SECTIONS.filter((s) => !s.auto).flatMap((s) => ks(s).map((l) => [s.id + l, ""])));

// Saved entries include the computed Cutting values (the Daily Report reads them).
function toStored(form) {
  const out = {};
  Object.entries(form).forEach(([k, v]) => { if (has(v)) out[k] = Number(v); });
  SECTIONS.filter((s) => s.auto).forEach((s) => ks(s).forEach((l) => {
    const v = form[s.auto.from + l];
    if (has(v)) out[s.id + l] = +(Number(v) * s.auto.factor).toFixed(4);
  }));
  return out;
}
const cell = (v) => (v == null ? "–" : (+v.toFixed(2)).toLocaleString());
const valueOf = (s, rec, l) => (s.auto && rec[s.auto.from + l] != null ? rec[s.auto.from + l] * s.auto.factor : rec[s.id + l]);

export default function HerackleProduction() {
  const [tab, setTab] = useState("entry");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const r = useDayRegister(KEYS.f2, EMPTY, { toStored });
  const days = Object.keys(r.db).sort().filter((d) => inRange(d, from, to));
  const edit = (d) => { r.setDate(d); setTab("entry"); };

  const autoVal = (s, l) => (has(r.form[s.auto.from + l]) ? +(Number(r.form[s.auto.from + l]) * s.auto.factor).toFixed(4) : "");

  const exportCsv = () => {
    const head = ["Date", ...SECTIONS.flatMap((s) => ks(s).map((l) => s.name + (s.single ? "" : " " + l)))];
    const lines = [head.map((h) => `"${h}"`).join(",")];
    days.forEach((d) => lines.push([fmtDMY(d), ...SECTIONS.flatMap((s) => ks(s).map((l) => valueOf(s, r.db[d], l) ?? ""))].join(",")));
    downloadFile("form2_report.csv", lines.join("\n"));
  };

  return (
    <>
      <PageHead title="Form 2 · Herackle Production" tab={tab} setTab={setTab} />
      {tab === "entry" ? (
        <>
          <EntryBar date={r.date} onDate={r.setDate} exists={r.exists} onSave={r.save} onClear={r.clear} onDelete={r.remove} />
          <div className="grid">
            {SECTIONS.map((s) => (
              <Card key={s.id} title={s.name} unit={s.unit} tone={s.single ? "blue" : "green"}>
                <Cols n={ks(s).length}>
                  {ks(s).map((l) => s.auto
                    ? <Field key={l} label={l} readOnly value={autoVal(s, l)} />
                    : <Field key={l} label={s.single ? "Total" : l} value={r.form[s.id + l]} onChange={(v) => r.set(s.id + l, v)} />)}
                </Cols>
                {s.auto && <div className="hint">Auto = {s.auto.factor} × Hemming</div>}
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <RangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}>
            <button className="btn clr" onClick={exportCsv}>Export CSV</button>
          </RangeBar>
          <div className="tw">
            {!days.length ? <p className="empty">No entries in this range.</p> : (
              <table className="data grouped">
                <thead>
                  <tr>
                    <th rowSpan={2}>Date</th>
                    {SECTIONS.map((s) => s.single
                      ? <th key={s.id} rowSpan={2}>{s.name}</th>
                      : <th key={s.id} colSpan={3}>{s.name} ({s.unit.toLowerCase()})</th>)}
                  </tr>
                  <tr>{SECTIONS.filter((s) => !s.single).flatMap((s) => ks(s).map((l) => <th key={s.id + l}>{l}</th>))}</tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr key={d}>
                      <td>{fmtDMY(d)} <button className="link" onClick={() => edit(d)}>✎</button></td>
                      {SECTIONS.flatMap((s) => ks(s).map((l) => <td key={s.id + l}>{cell(valueOf(s, r.db[d], l))}</td>))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    {SECTIONS.flatMap((s) => ks(s).map((l) => (
                      <td key={s.id + l}>{cell(days.reduce((a, d) => a + (valueOf(s, r.db[d], l) || 0), 0))}</td>
                    )))}
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}
