import { useState } from "react";
import { PageHead, EntryBar, RangeBar, Card, Field, Tiles } from "../components/ui.jsx";
import { KEYS } from "../lib/storage.js";
import { useDayRegister } from "../lib/useDayRegister.js";
import { downloadFile, fmtShort, has, inRange, num, todayISO } from "../lib/utils.js";

const EMPTY = { yarn: "", dust: "", agency: "" };
const f3 = (v) => (!has(v) || isNaN(v) ? "–" : Number(v).toFixed(3));

function monthRange() {
  const ym = todayISO().slice(0, 7);
  const last = new Date(+ym.slice(0, 4), +ym.slice(5), 0).getDate();
  return [ym + "-01", ym + "-" + String(last).padStart(2, "0")];
}

export default function YarnStock() {
  const [tab, setTab] = useState("entry");
  const [[from, to], setRange] = useState(monthRange);
  const r = useDayRegister(KEYS.ys, EMPTY);
  const { db } = r;

  // Cumulative dust = running total within the month up to and including that date
  const cumulativeFor = (iso) =>
    Object.keys(db).filter((d) => d.slice(0, 7) === iso.slice(0, 7) && d <= iso).reduce((s, d) => s + num(db[d].dust), 0);
  const liveCum = (() => {
    if (!r.date || r.form.dust === "") return "";
    const prior = Object.keys(db).filter((d) => d.slice(0, 7) === r.date.slice(0, 7) && d < r.date).reduce((s, d) => s + num(db[d].dust), 0);
    return (prior + Number(r.form.dust)).toFixed(3);
  })();

  const keys = Object.keys(db).sort().filter((d) => inRange(d, from, to));
  const dusts = keys.map((k) => db[k].dust).filter(has).map(Number);
  const agencies = keys.map((k) => db[k].agency).filter(has).map(Number);
  const yarns = keys.map((k) => db[k].yarn).filter(has).map(Number);
  const totalDust = dusts.reduce((a, b) => a + b, 0);
  const avgAgency = agencies.length ? agencies.reduce((a, b) => a + b, 0) / agencies.length : null;
  const latestYarn = yarns.length ? yarns[yarns.length - 1] : null;
  const edit = (d) => { r.setDate(d); setTab("entry"); window.scrollTo(0, 0); };

  const Row = ({ k }) => (
    <tr className="click" onClick={() => edit(k)}>
      <td>{fmtShort(k)}</td><td>{f3(db[k].yarn)}</td><td>{f3(db[k].dust)}</td><td>{f3(cumulativeFor(k))}</td>
      <td>{db[k].agency === "" ? "–" : db[k].agency}</td>
    </tr>
  );
  const Head = () => <thead><tr><th>Date</th><th>WDG Yarn Stock</th><th>Dust to Boiler</th><th>Cumulative</th><th>Agency Hands</th></tr></thead>;

  const exportCsv = () => {
    const lines = ["Date,WDG Yarn Stock,Dust to Boiler,Cumulative,Agency Hands",
      ...keys.map((k) => [fmtShort(k), db[k].yarn, db[k].dust, cumulativeFor(k).toFixed(3), db[k].agency].join(","))];
    downloadFile("daily_entries.csv", lines.join("\n"));
  };

  return (
    <>
      <PageHead title="Form 5 · Yarn Stock & Dust" tab={tab} setTab={setTab} />
      {tab === "entry" ? (
        <>
          <EntryBar date={r.date} onDate={r.setDate} exists={r.exists} onSave={r.save} onClear={r.clear} onDelete={r.remove} />
          <div className="grid">
            <Card title="WDG Yarn Stock" unit="M.Ton" tone="blue"><Field label="Stock" step="0.001" value={r.form.yarn} onChange={(v) => r.set("yarn", v)} /></Card>
            <Card title="Dust to Boiler" unit="M.Ton" tone="amber"><Field label="Quantity" step="0.001" value={r.form.dust} onChange={(v) => r.set("dust", v)} /></Card>
            <Card title="Cumulative" unit="M.Ton" tone="amber"><Field label="Auto-calculated" readOnly value={liveCum} /></Card>
            <Card title="Agency Hands" unit="Nos" tone="green"><Field label="Total" step="1" value={r.form.agency} onChange={(v) => r.set("agency", v)} /></Card>
          </div>
          <div className="box">
            <h2>Recent entries</h2>
            <div className="tw">
              <table className="data"><Head /><tbody>
                {Object.keys(db).sort().reverse().slice(0, 7).map((k) => <Row key={k} k={k} />)}
                {!Object.keys(db).length && <tr><td colSpan={5} className="empty">No entries yet. Fill the form and save.</td></tr>}
              </tbody></table>
            </div>
            <p className="hint">Click a row to edit it. Showing the last 7 entries; see the Report tab for all dates.</p>
          </div>
        </>
      ) : (
        <>
          <RangeBar from={from} to={to} setFrom={(v) => setRange([v, to])} setTo={(v) => setRange([from, v])}>
            <button className="btn clr" onClick={() => setRange(monthRange())}>This month</button>
            <button className="btn dark" onClick={() => window.print()}>Print</button>
            <button className="btn save" onClick={exportCsv}>Export CSV</button>
          </RangeBar>
          <Tiles items={[
            ["Days entered", keys.length],
            ["Latest yarn stock (M.Ton)", latestYarn == null ? "–" : latestYarn.toFixed(3)],
            ["Total dust to boiler (M.Ton)", dusts.length ? totalDust.toFixed(3) : "–", "amber"],
            ["Avg dust / day (M.Ton)", dusts.length ? (totalDust / dusts.length).toFixed(3) : "–", "amber"],
            ["Avg agency hands", avgAgency == null ? "–" : Math.round(avgAgency), "green"],
          ]} />
          <div className="box">
            <h2>Date-wise data</h2>
            <div className="tw">
              <table className="data"><Head /><tbody>{keys.map((k) => <Row key={k} k={k} />)}</tbody>
                {keys.length > 0 && (
                  <tfoot><tr>
                    <td>Total / Avg</td>
                    <td>{latestYarn == null ? "–" : latestYarn.toFixed(3) + " (latest)"}</td>
                    <td>{dusts.length ? totalDust.toFixed(3) : "–"}</td><td />
                    <td>{avgAgency == null ? "–" : Math.round(avgAgency) + " (avg)"}</td>
                  </tr></tfoot>
                )}
              </table>
              {!keys.length && <p className="empty">No entries in this date range.</p>}
            </div>
          </div>
        </>
      )}
    </>
  );
}
