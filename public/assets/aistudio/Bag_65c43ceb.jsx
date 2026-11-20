import { useState } from "react";
import { PageHead, EntryBar, RangeBar, Card, Cols, Field } from "../components/ui.jsx";
import { KEYS } from "../lib/storage.js";
import { useDayRegister } from "../lib/useDayRegister.js";
import { fmtDMY, inRange } from "../lib/utils.js";

// Groups follow the paper register columns: [key, label]
const G = [
  { t: "J.B. Oil", u: "Ltr", c: "blue", f: [["jbo_r", "Receipt"], ["jbo_i", "Issue"]] },
  { t: "Coal", u: "Kg", c: "blue", f: [["coal_r", "Receipt"], ["coal_i", "Issue"]] },
  { t: "Bag Production", u: "Nos", c: "blue", f: [["bags", "Total"]] },
  { t: "Power Consumption", u: "Units", c: "amber", f: [["cesc", "C.E.S.C."], ["dg", "D.G."]] },
  { t: "Diesel", u: "Ltr", c: "amber", f: [["dsl_r", "Receipt"], ["dsl_i", "Issue"]] },
  { t: "Power Failure", u: "", c: "amber", f: [["pf_freq", "Frequency"], ["pf_dur", "Duration (hrs)"]] },
  { t: "Thread Waste & Gunny Cutting", u: "M.Ton", c: "", f: [["tw_gen", "Generation"], ["tw_con", "Consumption"]] },
  { t: "Jute Received", u: "", c: "", f: [["j_lorry", "Lorry"], ["j_mt", "M.Ton"]] },
  { t: "Sale Yarn", u: "M.Ton", c: "", f: [["sale", "Total"]] },
  { t: "Worker Line Power Consumption", u: "Units", c: "amber", f: [["wl", "Total"]] },
  { t: "Spinning Production", u: "M.Ton", c: "blue", f: [["spin", "Total"]] },
];
const K = G.flatMap((g) => g.f.map((f) => f[0]));
const EMPTY = Object.fromEntries(K.map((k) => [k, ""]));

export default function BagProduction() {
  const [tab, setTab] = useState("entry");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const r = useDayRegister(KEYS.f3, EMPTY);

  const days = Object.keys(r.db).sort().filter((d) => inRange(d, from, to));
  const edit = (d) => { r.setDate(d); setTab("entry"); };

  return (
    <>
      <PageHead title="Form 3 · Bags, Power & Utilities" tab={tab} setTab={setTab} />
      {tab === "entry" ? (
        <>
          <EntryBar date={r.date} onDate={r.setDate} exists={r.exists} onSave={r.save} onClear={r.clear} onDelete={r.remove} />
          <div className="grid">
            {G.map((g) => (
              <Card key={g.t} title={g.t} unit={g.u} tone={g.c}>
                <Cols n={g.f.length}>
                  {g.f.map(([k, l]) => <Field key={k} label={l} value={r.form[k]} onChange={(v) => r.set(k, v)} />)}
                </Cols>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <RangeBar from={from} to={to} setFrom={setFrom} setTo={setTo} />
          <div className="tw">
            <table className="data">
              {days.length ? (
                <>
                  <thead>
                    <tr>
                      <th>Date</th>
                      {G.map((g) => g.f.map(([k, l]) => <th key={k}>{g.t} – {l}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((d) => (
                      <tr key={d} className="click" onClick={() => edit(d)}>
                        <td>{fmtDMY(d)}</td>
                        {K.map((k) => <td key={k}>{r.db[d][k] || "–"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      {K.map((k) => <td key={k}>{+days.reduce((a, d) => a + (parseFloat(r.db[d][k]) || 0), 0).toFixed(3)}</td>)}
                    </tr>
                  </tfoot>
                </>
              ) : (
                <tbody><tr><td className="empty">No entries yet. Save one from Data Entry.</td></tr></tbody>
              )}
            </table>
          </div>
        </>
      )}
    </>
  );
}
