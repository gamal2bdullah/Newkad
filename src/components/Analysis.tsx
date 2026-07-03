import { useLoads, useSummary, useLoadMetrics } from '../context/LoadContext';
import { fmtW, fmtWh, calcDailyEnergy, calcRunningLoad, calcConnectedLoad, calcHourlyOperatingLoad } from '../utils/calculations';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';
import { Sun, Activity, Zap, AlertTriangle, BarChart3 } from 'lucide-react';
import { useState } from 'react';

export function Analysis() {
  const { loads, expertLevel } = useLoads();
  const summary = useSummary();
  const metrics = useLoadMetrics();
  const [season, setSeason] = useState<'summer' | 'winter'>('summer');
  const [view, setView] = useState<'hourly' | 'seasonal' | 'category' | 'surges' | 'critical'>('hourly');

  // Hourly operating load per category
  const categories = Array.from(new Set(loads.map(l => l.categoryMain)));
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const data: any = { hour: `${h}:00`, total: 0 };
    categories.forEach(c => {
      let sum = 0;
      loads.filter(l => l.categoryMain === c).forEach(l => {
        const profile = calcHourlyOperatingLoad(l);
        sum += profile[h];
      });
      data[c] = Math.round(sum / 100) / 10; // kW with 0.1 precision
      data.total += data[c];
    });
    data.total = Math.round(data.total * 10) / 10;
    return data;
  });

  // Seasonal data
  const seasonal = [
    { season: 'Summer', day: Math.round(summary.dayEnergyWh / 100) / 10, night: Math.round(summary.nightEnergyWh / 100) / 10, total: Math.round(summary.totalDailyEnergyWh / 100) / 10 },
    { season: 'Winter', day: Math.round(loads.reduce((s, l) => s + calcDailyEnergy(l, 'winter') * 0.5, 0) / 100) / 10, night: Math.round(loads.reduce((s, l) => s + calcDailyEnergy(l, 'winter') * 0.5, 0) / 100) / 10, total: 0 },
  ];
  seasonal[1].day = Math.round(loads.reduce((s, l) => s + (l.dayHoursWinter * calcRunningLoad(l) * (l.dutyCyclePercent / 100) * l.utilizationFactorKu * l.demandFactor * l.operatingDaysPerWeek / 7), 0) / 100) / 10;
  seasonal[1].night = Math.round(loads.reduce((s, l) => s + (l.nightHoursWinter * calcRunningLoad(l) * (l.dutyCyclePercent / 100) * l.utilizationFactorKu * l.demandFactor * l.operatingDaysPerWeek / 7), 0) / 100) / 10;
  seasonal[1].total = Math.round((seasonal[1].day + seasonal[1].night) * 10) / 10;

  // Top surges
  const topSurges = [...metrics].sort((a, b) => b.surge - a.surge).slice(0, 12);

  // Critical loads
  const criticalLoads = metrics.filter(m => m.load.criticality === 'Critical' || m.load.criticality === 'Essential');

  return (
    <div className="p-6 space-y-5 max-w-[1800px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Analysis Engine</h2>
          <p className="text-xs text-slate-500">Time-based · Hierarchical · Scenario-driven · Multi-level load analysis · {expertLevel} mode</p>
        </div>
        <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
          {[
            { k: 'hourly', l: '24h Profile', i: Activity },
            { k: 'seasonal', l: 'Seasonal', i: Sun },
            { k: 'category', l: 'Category', i: BarChart3 },
            { k: 'surges', l: 'Surges', i: Zap },
            { k: 'critical', l: 'Critical', i: AlertTriangle },
          ].map(t => {
            const I = t.i;
            return (
              <button key={t.k} onClick={() => setView(t.k as any)} className={`px-3 py-1.5 rounded text-[11px] font-medium flex items-center gap-1.5 transition ${view === t.k ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                <I className="w-3.5 h-3.5" /> {t.l}
              </button>
            );
          })}
        </div>
      </div>

      {view === 'hourly' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">24-Hour Load Curve — Stacked by Category</h3>
                <p className="text-xs text-slate-500">Operating load in kW per hour, broken down by category</p>
              </div>
              <div className="text-xs text-slate-400">Peak: <span className="mono text-orange-300 font-semibold">{Math.max(...summary.hourlyProfile).toFixed(0)} W</span></div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={hourlyData}>
                <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" stroke="#6b7a9c" fontSize={10} tickLine={false} axisLine={false} interval={1} />
                <YAxis stroke="#6b7a9c" fontSize={10} tickLine={false} axisLine={false} unit=" kW" />
                <Tooltip contentStyle={{ background: '#0f1424', border: '1px solid #2a3656', borderRadius: 8 }} formatter={(v: any) => `${v.toFixed(2)} kW`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {categories.slice(0, 8).map((c, i) => {
                  const colors = ['#ff6a00', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a855f7'];
                  return <Area key={c} type="monotone" dataKey={c} stackId="1" stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.5} />;
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Day vs Night — Daily Energy Split</h3>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={[
                  { name: 'Day (8-18h)', day: Math.round(summary.dayEnergyWh / 100) / 10, night: 0 },
                  { name: 'Night (18-8h)', day: 0, night: Math.round(summary.nightEnergyWh / 100) / 10 },
                ]}>
                  <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7a9c" fontSize={11} />
                  <YAxis stroke="#6b7a9c" fontSize={10} unit=" Wh×100" />
                  <Tooltip contentStyle={{ background: '#0f1424', border: '1px solid #2a3656', borderRadius: 8 }} />
                  <Bar dataKey="day" stackId="a" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="night" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Hourly Operating Power</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={hourlyData}>
                  <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" stroke="#6b7a9c" fontSize={10} interval={2} />
                  <YAxis stroke="#6b7a9c" fontSize={10} unit=" kW" />
                  <Tooltip contentStyle={{ background: '#0f1424', border: '1px solid #2a3656', borderRadius: 8 }} formatter={(v: any) => `${v.toFixed(2)} kW`} />
                  <Line type="monotone" dataKey="total" stroke="#ff6a00" strokeWidth={2.5} dot={{ fill: '#ff6a00', r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {view === 'seasonal' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Seasonal Energy Analysis</h3>
                <p className="text-xs text-slate-500">Compare summer vs winter daily consumption patterns</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setSeason('summer')} className={`px-3 py-1 rounded text-[11px] font-medium ${season === 'summer' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>Summer</button>
                <button onClick={() => setSeason('winter')} className={`px-3 py-1 rounded text-[11px] font-medium ${season === 'winter' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>Winter</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={seasonal}>
                <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="season" stroke="#6b7a9c" fontSize={11} />
                <YAxis stroke="#6b7a9c" fontSize={10} unit=" kWh" />
                <Tooltip contentStyle={{ background: '#0f1424', border: '1px solid #2a3656', borderRadius: 8 }} formatter={(v: any) => `${v.toFixed(2)} kWh`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="day" stackId="a" fill="#fbbf24" name="Day Energy" />
                <Bar dataKey="night" stackId="a" fill="#3b82f6" name="Night Energy" />
                <Bar dataKey="total" fill="#10b981" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-4">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Summer Daily</div>
              <div className="text-2xl font-bold mono text-orange-300 mt-1">{fmtWh(summary.totalDailyEnergyWh, 1)}</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-4">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Winter Daily (est)</div>
              <div className="text-2xl font-bold mono text-blue-300 mt-1">{fmtWh(loads.reduce((s, l) => s + calcDailyEnergy(l, 'winter'), 0), 1)}</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-4">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Summer Annual</div>
              <div className="text-2xl font-bold mono text-amber-300 mt-1">{fmtWh(summary.annualEnergyKWh * 1000, 0)}</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-4">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Seasonal Variance</div>
              <div className="text-2xl font-bold mono text-emerald-300 mt-1">
                {Math.abs(((summary.totalDailyEnergyWh - loads.reduce((s, l) => s + calcDailyEnergy(l, 'winter'), 0)) / Math.max(1, summary.totalDailyEnergyWh)) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'category' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Energy by Category (Wh/day)</h3>
              <div className="space-y-2">
                {summary.byCategory.map(c => {
                  const max = Math.max(...summary.byCategory.map(x => x.value));
                  const pct = (c.value / max) * 100;
                  return (
                    <div key={c.name}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-300">{c.name}</span>
                        <span className="mono text-slate-400">{fmtWh(c.value, 0)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Criticality Mix</h3>
              {summary.byCriticality.length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={summary.byCriticality} layout="vertical">
                    <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="#6b7a9c" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#6b7a9c" fontSize={11} width={80} />
                    <Tooltip contentStyle={{ background: '#0f1424', border: '1px solid #2a3656', borderRadius: 8 }} formatter={(v: any) => fmtWh(v as number, 0)} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {summary.byCriticality.map((d, i) => <Bar key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Category-Wise Detailed Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="text-left py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Category</th>
                    <th className="text-right py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Loads</th>
                    <th className="text-right py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Connected</th>
                    <th className="text-right py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Daily Energy</th>
                    <th className="text-right py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Annual</th>
                    <th className="text-right py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byCategory.map(c => {
                    const count = loads.filter(l => l.categoryMain === c.name).length;
                    const conn = loads.filter(l => l.categoryMain === c.name).reduce((s, l) => s + calcConnectedLoad(l), 0);
                    const annual = c.value * 365;
                    const pct = (c.value / summary.totalDailyEnergyWh) * 100;
                    return (
                      <tr key={c.name} className="border-b border-slate-800/40">
                        <td className="py-2 px-2"><span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: c.color }} />{c.name}</td>
                        <td className="py-2 px-2 text-right mono">{count}</td>
                        <td className="py-2 px-2 text-right mono text-orange-300">{fmtW(conn, 0)}</td>
                        <td className="py-2 px-2 text-right mono text-amber-300">{fmtWh(c.value, 0)}</td>
                        <td className="py-2 px-2 text-right mono text-emerald-300">{(annual / 1000).toFixed(0)} kWh</td>
                        <td className="py-2 px-2 text-right mono text-slate-300">{pct.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'surges' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Surge Analysis — Top Starting Loads</h3>
            <p className="text-xs text-slate-500 mb-4">Loads requiring oversizing consideration for inverter/UPS selection</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSurges.map(m => ({ name: m.load.loadName.substring(0, 20), surge: Math.round(m.surge / 100) / 10, run: Math.round(m.running / 100) / 10 }))}>
                <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7a9c" fontSize={10} angle={-30} textAnchor="end" height={70} />
                <YAxis stroke="#6b7a9c" fontSize={10} unit=" kW" />
                <Tooltip contentStyle={{ background: '#0f1424', border: '1px solid #2a3656', borderRadius: 8 }} formatter={(v: any) => `${v.toFixed(2)} kW`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="run" fill="#fbbf24" name="Running" radius={[4, 4, 0, 0]} />
                <Bar dataKey="surge" fill="#ec4899" name="Surge" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Surge Summary</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                  <span className="text-xs text-slate-300">Total Aggregate Surge</span>
                  <span className="mono text-pink-300 font-bold">{fmtW(summary.maximumSurgeKW * 1000, 0)}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                  <span className="text-xs text-slate-300">Peak Demand</span>
                  <span className="mono text-orange-300 font-bold">{fmtW(summary.peakDemandKW * 1000, 0)}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                  <span className="text-xs text-slate-300">Surge / Peak Ratio</span>
                  <span className="mono text-amber-300 font-bold">{(summary.maximumSurgeKW / Math.max(0.01, summary.peakDemandKW)).toFixed(2)}×</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                  <span className="text-xs text-slate-300">Recommended Inverter Oversize</span>
                  <span className="mono text-emerald-300 font-bold">+25% (NEC)</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Motor Loads Detail</h3>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {metrics.filter(m => m.load.surgeMultiplier > 1).map(m => (
                  <div key={m.load.id} className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800/50 text-xs">
                    <div>
                      <div className="text-slate-200">{m.load.loadName}</div>
                      <div className="text-[10px] text-slate-500">{m.load.categorySub} · {m.load.surgeMultiplier}× surge</div>
                    </div>
                    <div className="text-right">
                      <div className="mono text-pink-300 font-semibold">{fmtW(m.surge, 0)}</div>
                      <div className="text-[10px] text-slate-500">{fmtW(m.running, 0)} run</div>
                    </div>
                  </div>
                ))}
                {metrics.filter(m => m.load.surgeMultiplier > 1).length === 0 && (
                  <div className="text-center text-slate-500 text-xs py-6">No motor loads with surge detected</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'critical' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Critical & Essential Loads</h3>
            <p className="text-xs text-slate-500 mb-4">Loads that must operate during grid outage — sizing battery backup accordingly</p>
            <div className="space-y-2">
              {criticalLoads.map(m => (
                <div key={m.load.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800 hover:border-orange-500/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${m.load.criticality === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                        {m.load.criticality}
                      </span>
                      <span className="text-sm text-white font-medium">{m.load.loadName}</span>
                      <span className="text-[10px] text-slate-500">×{m.load.quantity}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{m.load.categoryMain} · {m.load.timeProfileType} · {fmtW(m.load.ratedPowerW, 0)} rated</div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-orange-300 font-semibold text-sm">{fmtW(m.connected, 0)}</div>
                    <div className="text-[10px] text-slate-500">{fmtWh(m.daily, 0)}/day</div>
                  </div>
                </div>
              ))}
              {criticalLoads.length === 0 && <div className="text-center text-slate-500 text-xs py-6">No critical loads defined</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-4">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Critical Daily Energy</div>
              <div className="text-2xl font-bold mono text-red-300 mt-1">{fmtWh(summary.criticalLoadWh, 0)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Backup requirement</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-4">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Deferrable Energy</div>
              <div className="text-2xl font-bold mono text-emerald-300 mt-1">{fmtWh(summary.deferrableLoadWh, 0)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Can shift to daytime</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-4">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Phantom Loss</div>
              <div className="text-2xl font-bold mono text-violet-300 mt-1">{fmtWh(summary.phantomLossWh, 0)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">24h standby waste</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
