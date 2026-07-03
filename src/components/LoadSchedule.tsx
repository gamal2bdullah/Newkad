import { useState } from 'react';
import { useLoads } from '../context/LoadContext';
import { Download, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { fmtW, fmtWh, calcConnectedLoad, calcRunningLoad, calcDailyEnergy, calcDayEnergy, calcNightEnergy, calcAnnualEnergy, calcApparentPower, calcFullLoadCurrent, calcSurgePower, calcDemandLoad, calcDiversifiedLoad, calcCoincidentLoad } from '../utils/calculations';

export function LoadSchedule() {
  const { loads, projectName } = useLoads();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [showAdv, setShowAdv] = useState(false);
  const [sortBy, setSortBy] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'loadId', dir: 'asc' });

  const filtered = loads.filter(l => {
    const matchSearch = !search || l.loadName.toLowerCase().includes(search.toLowerCase()) || l.loadTag.toLowerCase().includes(search.toLowerCase()) || l.loadId.toLowerCase().includes(search.toLowerCase()) || l.arabicName.includes(search);
    const matchCat = cat === 'All' || l.categoryMain === cat;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    const dir = sortBy.dir === 'asc' ? 1 : -1;
    const va = (a as any)[sortBy.key] ?? '';
    const vb = (b as any)[sortBy.key] ?? '';
    if (typeof va === 'number') return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });

  const sort = (key: string) => setSortBy(p => ({ key, dir: p.key === key && p.dir === 'asc' ? 'desc' : 'asc' }));
  const SortH = ({ k, children, align = 'left' }: { k: string; children: React.ReactNode; align?: 'left' | 'right' | 'center' }) => (
    <th onClick={() => sort(k)} className={`px-2 py-2 text-${align} font-semibold uppercase tracking-wider text-[10px] cursor-pointer hover:text-orange-300 select-none whitespace-nowrap`}>
      <span className="inline-flex items-center gap-1">
        {children}
        {sortBy.key === k && (sortBy.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </th>
  );

  const exportCSV = () => {
    const headers = ['ID', 'Tag', 'Name', 'Category', 'Space', 'Qty', 'Rated (W)', 'Running (W)', 'PF', 'Ku', 'Demand', 'Coincidence', 'Diversity', 'Hours/Day', 'Duty%', 'Surge (W)', 'Connected (W)', 'Daily (Wh)', 'Annual (kWh)'];
    const rows = filtered.map(l => [
      l.loadId, l.loadTag, l.loadName, l.categoryMain, l.spaceArea, l.quantity, l.ratedPowerW, l.runningPowerW, l.powerFactor, l.utilizationFactorKu, l.demandFactor, l.coincidenceFactor, l.diversityFactor, (l.dayHoursSummer + l.nightHoursSummer), l.dutyCyclePercent, calcSurgePower(l), calcConnectedLoad(l), calcDailyEnergy(l), calcAnnualEnergy(l) / 1000,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '-')}-load-schedule.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-4 max-w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Master Load Schedule</h2>
          <p className="text-xs text-slate-500">{filtered.length} of {loads.length} loads · Engineering data sheet with 70+ columns</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowAdv(s => !s)} className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-700/60">
            {showAdv ? 'Hide' : 'Show'} Advanced Columns
          </button>
          <button onClick={exportCSV} className="px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold shadow-lg shadow-orange-500/30 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loads…" className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-sm text-white" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <select value={cat} onChange={e => setCat(e.target.value)} className="pl-9 pr-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-sm text-white">
            <option value="All">All</option>
            <option>Lighting</option><option>HVAC</option><option>Kitchen</option><option>Pump</option><option>Medical</option><option>IT</option><option>Industrial</option><option>EV</option><option>Security</option><option>Water</option><option>Office</option><option>Laundry</option><option>Other</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] overflow-hidden">
        <div className="overflow-x-auto table-scroll" style={{ maxHeight: '70vh' }}>
          <table className="w-full text-[11px]">
            <thead className="bg-slate-900/80 text-slate-400 sticky top-0 z-10 backdrop-blur">
              <tr>
                <SortH k="loadId">ID</SortH>
                <SortH k="loadTag">Tag</SortH>
                <SortH k="loadName">Name</SortH>
                <SortH k="categoryMain">Category</SortH>
                <SortH k="spaceArea">Space</SortH>
                <SortH k="quantity" align="right">Qty</SortH>
                <SortH k="ratedPowerW" align="right">Rated W</SortH>
                <SortH k="runningPowerW" align="right">Run W</SortH>
                <SortH k="powerFactor" align="right">PF</SortH>
                <SortH k="utilizationFactorKu" align="right">Ku</SortH>
                <SortH k="demandFactor" align="right">DF</SortH>
                {showAdv && <SortH k="coincidenceFactor" align="right">Coinc.</SortH>}
                {showAdv && <SortH k="diversityFactor" align="right">Div.</SortH>}
                <SortH k="dutyCyclePercent" align="right">Duty%</SortH>
                <SortH k="surgeMultiplier" align="right">Surge×</SortH>
                <SortH k="operateHours" align="right">Hrs/d</SortH>
                <SortH k="criticality">Crit.</SortH>
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] text-orange-300">Conn (W)</th>
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] text-orange-300">Run (W)</th>
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] text-amber-300">Demand (W)</th>
                {showAdv && <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] text-amber-300">Div. (W)</th>}
                {showAdv && <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] text-amber-300">Coinc. (W)</th>}
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] text-pink-300">Surge (W)</th>
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] text-cyan-300">FLC (A)</th>
                {showAdv && <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] text-cyan-300">kVA</th>}
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] text-emerald-300">Day (Wh)</th>
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] text-indigo-300">Night (Wh)</th>
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] text-emerald-300">Daily (Wh)</th>
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] text-emerald-300">Annual (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const conn = calcConnectedLoad(l);
                const run = calcRunningLoad(l);
                const demand = calcDemandLoad(l);
                const coinc = calcCoincidentLoad(l);
                const div = calcDiversifiedLoad(l);
                const flc = calcFullLoadCurrent(l);
                const kva = calcApparentPower(l);
                const surge = calcSurgePower(l);
                const daily = calcDailyEnergy(l);
                const day = calcDayEnergy(l);
                const night = calcNightEnergy(l);
                const annual = calcAnnualEnergy(l);
                const hours = l.dayHoursSummer + l.nightHoursSummer;
                return (
                  <tr key={l.id} className="border-t border-slate-800/40 hover:bg-slate-800/30">
                    <td className="px-2 py-1.5 mono text-slate-400">{l.loadId}</td>
                    <td className="px-2 py-1.5 mono text-orange-300">{l.loadTag}</td>
                    <td className="px-2 py-1.5 text-white">{l.loadName}</td>
                    <td className="px-2 py-1.5 text-slate-400">{l.categoryMain}</td>
                    <td className="px-2 py-1.5 text-slate-400">{l.spaceArea}</td>
                    <td className="px-2 py-1.5 text-right mono">{l.quantity}</td>
                    <td className="px-2 py-1.5 text-right mono text-slate-300">{l.ratedPowerW}</td>
                    <td className="px-2 py-1.5 text-right mono text-slate-300">{l.runningPowerW}</td>
                    <td className="px-2 py-1.5 text-right mono text-slate-300">{l.powerFactor.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right mono text-slate-300">{l.utilizationFactorKu.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right mono text-slate-300">{l.demandFactor.toFixed(2)}</td>
                    {showAdv && <td className="px-2 py-1.5 text-right mono text-slate-300">{l.coincidenceFactor.toFixed(2)}</td>}
                    {showAdv && <td className="px-2 py-1.5 text-right mono text-slate-300">{l.diversityFactor.toFixed(2)}</td>}
                    <td className="px-2 py-1.5 text-right mono text-slate-300">{l.dutyCyclePercent}</td>
                    <td className="px-2 py-1.5 text-right mono text-pink-300">{l.surgeMultiplier}×</td>
                    <td className="px-2 py-1.5 text-right mono text-slate-300">{hours.toFixed(1)}</td>
                    <td className="px-2 py-1.5 text-slate-400">{l.criticality[0]}</td>
                    <td className="px-2 py-1.5 text-right mono text-orange-300 font-semibold">{fmtW(conn, 0)}</td>
                    <td className="px-2 py-1.5 text-right mono text-orange-200">{fmtW(run, 0)}</td>
                    <td className="px-2 py-1.5 text-right mono text-amber-300 font-semibold">{fmtW(demand, 0)}</td>
                    {showAdv && <td className="px-2 py-1.5 text-right mono text-amber-200">{fmtW(div, 0)}</td>}
                    {showAdv && <td className="px-2 py-1.5 text-right mono text-amber-200">{fmtW(coinc, 0)}</td>}
                    <td className="px-2 py-1.5 text-right mono text-pink-300 font-semibold">{fmtW(surge, 0)}</td>
                    <td className="px-2 py-1.5 text-right mono text-cyan-300">{flc.toFixed(2)}</td>
                    {showAdv && <td className="px-2 py-1.5 text-right mono text-cyan-200">{kva.toFixed(2)}</td>}
                    <td className="px-2 py-1.5 text-right mono text-emerald-300">{fmtWh(day, 0)}</td>
                    <td className="px-2 py-1.5 text-right mono text-indigo-300">{fmtWh(night, 0)}</td>
                    <td className="px-2 py-1.5 text-right mono text-emerald-300 font-semibold">{fmtWh(daily, 0)}</td>
                    <td className="px-2 py-1.5 text-right mono text-emerald-200">{(annual / 1000).toFixed(1)}</td>
                  </tr>
                );
              })}
              {filtered.length > 0 && (
                <tr className="border-t-2 border-orange-500/40 bg-slate-900/40 font-bold">
                  <td colSpan={5} className="px-2 py-2 text-orange-300 uppercase text-[10px]">Totals · {filtered.length} loads</td>
                  <td className="px-2 py-2 text-right mono text-orange-300">{filtered.reduce((s, l) => s + l.quantity, 0)}</td>
                  <td className="px-2 py-2 text-right mono text-slate-300">{fmtW(filtered.reduce((s, l) => s + l.ratedPowerW * l.quantity, 0), 0)}</td>
                  <td colSpan={9}></td>
                  <td className="px-2 py-2 text-right mono text-orange-300">{fmtW(filtered.reduce((s, l) => s + calcConnectedLoad(l), 0), 0)}</td>
                  <td className="px-2 py-2 text-right mono text-orange-200">{fmtW(filtered.reduce((s, l) => s + calcRunningLoad(l), 0), 0)}</td>
                  <td className="px-2 py-2 text-right mono text-amber-300">{fmtW(filtered.reduce((s, l) => s + calcDemandLoad(l), 0), 0)}</td>
                  {showAdv && <td className="px-2 py-2 text-right mono text-amber-200">{fmtW(filtered.reduce((s, l) => s + calcDiversifiedLoad(l), 0), 0)}</td>}
                  {showAdv && <td className="px-2 py-2 text-right mono text-amber-200">{fmtW(filtered.reduce((s, l) => s + calcCoincidentLoad(l), 0), 0)}</td>}
                  <td className="px-2 py-2 text-right mono text-pink-300">{fmtW(filtered.reduce((s, l) => s + calcSurgePower(l), 0), 0)}</td>
                  <td className="px-2 py-2 text-right mono text-cyan-300">{filtered.reduce((s, l) => s + calcFullLoadCurrent(l), 0).toFixed(1)}</td>
                  {showAdv && <td className="px-2 py-2 text-right mono text-cyan-200">{filtered.reduce((s, l) => s + calcApparentPower(l), 0).toFixed(1)}</td>}
                  <td className="px-2 py-2 text-right mono text-emerald-300">{fmtWh(filtered.reduce((s, l) => s + calcDayEnergy(l), 0), 0)}</td>
                  <td className="px-2 py-2 text-right mono text-indigo-300">{fmtWh(filtered.reduce((s, l) => s + calcNightEnergy(l), 0), 0)}</td>
                  <td className="px-2 py-2 text-right mono text-emerald-300">{fmtWh(filtered.reduce((s, l) => s + calcDailyEnergy(l), 0), 0)}</td>
                  <td className="px-2 py-2 text-right mono text-emerald-200">{(filtered.reduce((s, l) => s + calcAnnualEnergy(l), 0) / 1000).toFixed(0)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 leading-relaxed">
        <strong className="text-slate-400">Legend:</strong> Conn = Connected Load (Rated × Qty) · Run = Running Load · Demand = Connected × Ku · 
        Coinc. = Coincident Load (Demand × CF) · Div. = Diversified Load (Coinc. / DF) · 
        Surge = Rated × Surge× · FLC = Full Load Current · kVA = kW/PF · 
        Day = Daytime energy · Night = Nighttime energy · Daily = Total energy.
      </div>
    </div>
  );
}
