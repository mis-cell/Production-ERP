import { useState } from "react";
import { PageHead, EntryBar, RangeBar, Card, Cols, Field, Tiles } from "../components/ui.jsx";
import { KEYS } from "../lib/storage.js";
import { useDayRegister } from "../lib/useDayRegister.js";
import { downloadFile, fmtShort, inRange, num } from "../lib/utils.js";

// hrs:true → working-hours group (shows an "Actual" total). Otherwise Mics.
const G = [
  { n: "Spinning Working Hours", hrs: true }, { n: "Weaving Working Hours", hrs: true },
  { n: "Lapping (Mics)" }, { n: "Calender (Mics)" }, { n: "Cutting (Mics)" },
  { n: "Hemming (Mics)" }, { n: "Herackle (Mics)" }, { n: "Union (Mics)" },
  { n: "Hand Sewn (Mics)" }, { n: "Press (Mics)" }, { n: "Damping (Mics)" },
];
const N = G.length * 3;
const EMPTY = Object.fromEntries(Array.from({ length: N }, (_, i) => [i, ""]));

// Stored on disk as [{date, v:[33 values]}] (same as the original app); in memory as { date: v[] }
const storage = {
  parse: (a) => Object.fromEntries((Array.isArray(a) ? a : []).map((r) => [r.date, r.v])),
  serialize: (o) => Object.keys(o).sort().map((date) => ({ date, v: o[date] })),
};
const toStored = (f) => Array.from({ length: N }, (_, i) => (f[i] === "" ? "" : num(f[i])));
const dash = (v) => (v === "" || v === 0 || v == null ? <td className="e">–</td> : <td>{v}</td>);
const r2 = (x) => +x.toFixed(2);

export default function FinishDepartments() {
  const [tab, setTab] = useState("entry");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const r = useDayRegister(KEYS.f1, EMPTY, { toStored, storage });

  const days = Object.keys(r.db).sort().filter((d) => inRange(d, from, to));
  const tot = Array(N).fill(0);
  days.forEach((d) => r.db[d].forEach((v, i) => { tot[i] += num(v); }));
  const sum3 = (i) => tot[i * 3] + tot[i * 3 + 1] + tot[i * 3 + 2];
  const edit = (d) => { r.setDate(d); setTab("entry"); window.scrollTo(0, 0); };

  const exportCSV = () => {
    const head = ["Date"];
    G.forEach((g) => { ["A", "B", "C"].forEach((l) => head.push(`${g.n} ${l}`)); if (g.hrs) head.push(`${g.n} Actual`); });
    const lines = [head.join(",")];
    days.forEach((d) => {
      const row = [fmtShort(d)];
      G.forEach((g, i) => {
        let s = 0;
        for (let k = 0; k < 3; k++) { const v = r.db[d][i * 3 + k]; row.push(v); s += num(v); }
        if (g.hrs) row.push(r2(s));
      });
      lines.push(row.join(","));
    });
    downloadFile("production_report.csv", lines.join("\n"));
  };

  return (
    <>
      <PageHead title="Form 1 · Finish Departments" tab={tab} setTab={setTab} />
      {tab === "entry" ? (
        <>
          <EntryBar date={r.date} onDate={r.setDate} exists={r.exists} onSave={r.save} onClear={r.clear} onDelete={r.remove} />
          <div className="grid">
            {G.map((g, i) => (
              <Card key={g.n} title={g.n.replace(/ \(.*\)/, "")} unit={g.hrs ? "Hours" : "Mics"} tone={g.hrs ? "blue" : "green"}>
                <Cols n={3}>
                  {["A", "B", "C"].map((l, k) => (
                    <Field key={l} label={l} value={r.form[i * 3 + k]} onChange={(v) => r.set(i * 3 + k, v)} />
                  ))}
                </Cols>
                {g.hrs && (
                  <div className="actual"><span>Actual</span>
                    <span>{r2([0, 1, 2].reduce((t, k) => t + num(r.form[i * 3 + k]), 0))}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <RangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}>
            <button className="btn clr" onClick={exportCSV}>CSV</button>
            <button className="btn save" onClick={() => window.print()}>Print</button>
          </RangeBar>
          <Tiles items={[
            ["Days recorded", days.length],
            ["Spinning hours", +sum3(0).toFixed(1)],
            ["Weaving hours", +sum3(1).toFixed(1)],
            ["Cutting (Mics)", +sum3(4).toFixed(1)],
          ]} />
          <div className="tw">
            <table className="data grouped">
              <thead>
                <tr>
                  <th rowSpan={2}>DATE</th>
                  {G.map((g) => <th key={g.n} colSpan={g.hrs ? 4 : 3}>{g.n}</th>)}
                  <th rowSpan={2} className="noprint">Edit</th>
                </tr>
                <tr>
                  {G.map((g) => ["A", "B", "C", ...(g.hrs ? ["Actual"] : [])].map((l) => <th key={g.n + l}>{l}</th>))}
                </tr>
              </thead>
              <tbody>
                {days.length ? days.map((d) => (
                  <tr key={d}>
                    <td>{fmtShort(d)}</td>
                    {G.map((g, i) => [
                      ...[0, 1, 2].map((k) => <Cell key={g.n + k} v={r.db[d][i * 3 + k]} />),
                      ...(g.hrs ? [<td key={g.n + "a"} className="act">{r2([0, 1, 2].reduce((s, k) => s + num(r.db[d][i * 3 + k]), 0))}</td>] : []),
                    ])}
                    <td className="noprint"><button className="link" onClick={() => edit(d)}>Edit</button></td>
                  </tr>
                )) : <tr><td colSpan={40} className="empty">No data</td></tr>}
              </tbody>
              <tfoot>
                <tr>
                  <td>TOTAL</td>
                  {G.map((g, i) => [
                    ...[0, 1, 2].map((k) => <td key={g.n + k}>{tot[i * 3 + k] ? r2(tot[i * 3 + k]) : "–"}</td>),
                    ...(g.hrs ? [<td key={g.n + "a"}>{sum3(i) ? r2(sum3(i)) : "–"}</td>] : []),
                  ])}
                  <td className="noprint" />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </>
  );
}
const Cell = ({ v }) => dash(v);
