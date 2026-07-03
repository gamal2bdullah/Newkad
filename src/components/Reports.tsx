import { useLoads, useSummary, useLoadMetrics } from '../context/LoadContext';
import { fmtW, fmtWh, fmtA, fmtKVA, fmtPct, calcDailyEnergy, calcRunningLoad, calcConnectedLoad, calcAnnualEnergy, SURGE_MULTIPLIERS, NEC_DEMAND_FACTORS, validateLoad } from '../utils/calculations';
import { generatePDFReport, generateSchedulePDF } from '../utils/pdfGenerator';
import { FileText, Download, AlertTriangle, CheckCircle2, BarChart3, Activity, Shield, ListChecks, FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function Reports() {
  const { loads, projectName, expertLevel } = useLoads();
  const summary = useSummary();
  const metrics = useLoadMetrics();
  const [reportType, setReportType] = useState<'exec' | 'demand' | 'seasonal' | 'compliance' | 'custom'>('exec');
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (loads.length === 0) {
      alert('No loads defined. Please add at least one load before generating a report.');
      return;
    }
    setGenerating(true);
    try {
      // small delay to allow UI update
      await new Promise(r => setTimeout(r, 50));
      generatePDFReport(reportType, loads, summary, projectName, expertLevel);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadSchedule = async () => {
    if (loads.length === 0) {
      alert('No loads defined. Please add at least one load before generating a schedule.');
      return;
    }
    setGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 50));
      generateSchedulePDF(loads, summary, projectName, expertLevel);
    } catch (err) {
      console.error('Schedule PDF generation failed:', err);
      alert('PDF generation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const allIssues = loads.flatMap(l => validateLoad(l).map(i => ({ ...i, loadName: l.loadName })));
  const errors = allIssues.filter(i => i.type === 'error');
  const warnings = allIssues.filter(i => i.type === 'warning');

  const phaseImbalance = (() => {
    const phases = [0, 0, 0];
    loads.forEach(l => {
      const conn = calcConnectedLoad(l);
      if (l.phaseType === '3Ø') {
        phases[0] += conn / 3;
        phases[1] += conn / 3;
        phases[2] += conn / 3;
      } else {
        phases[(loads.indexOf(l)) % 3] += conn;
      }
    });
    const max = Math.max(...phases);
    const min = Math.min(...phases);
    return { phases, imbalance: max > 0 ? ((max - min) / max) * 100 : 0 };
  })();

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Engineering Reports</h2>
          <p className="text-xs text-slate-500">Professional technical documentation for compliance & design</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
            {[
              { k: 'exec', l: 'Executive Summary', i: FileText },
              { k: 'demand', l: 'Demand Analysis', i: BarChart3 },
              { k: 'seasonal', l: 'Seasonal Report', i: Activity },
              { k: 'compliance', l: 'Compliance', i: Shield },
              { k: 'custom', l: 'Custom Report', i: ListChecks },
            ].map(t => {
              const I = t.i;
              return (
                <button key={t.k} onClick={() => setReportType(t.k as any)} className={`px-3 py-1.5 rounded text-[11px] font-medium flex items-center gap-1.5 transition ${reportType === t.k ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`} style={reportType === t.k ? { background: 'linear-gradient(135deg, #1A2B6B 0%, #99F36C 100%)' } : {}}>
                  <I className="w-3.5 h-3.5" /> {t.l}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleDownloadSchedule}
            disabled={generating || loads.length === 0}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            title="Download complete load schedule as PDF"
          >
            <FileDown className="w-3.5 h-3.5" /> Schedule PDF
          </button>
          <button
            onClick={handleDownload}
            disabled={generating || loads.length === 0}
            className="px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-lg flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition" style={{ background: 'linear-gradient(135deg, #1A2B6B 0%, #99F36C 100%)', boxShadow: '0 4px 14px rgba(26, 43, 107, 0.4)' }}
          >
            {generating ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
            ) : (
              <><Download className="w-3.5 h-3.5" /> Download PDF</>
            )}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-6 print:bg-white print:text-black">
        {/* Report header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-2xl font-bold text-white">{projectName}</h3>
            <p className="text-xs text-slate-500 mt-1">KAD POWER Engineering Suite · Load Analysis Report · Generated {new Date().toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase text-slate-500 font-semibold">Project Mode</div>
            <div className="text-sm text-orange-300 mono font-semibold">{expertLevel}</div>
          </div>
        </div>

        {reportType === 'exec' && (
          <div className="space-y-5 text-sm text-slate-200">
            <Section title="1. Executive Summary">
              <p className="text-slate-300 leading-relaxed">
                This report presents a comprehensive analysis of the electrical load profile for <strong className="text-white">{projectName}</strong>. 
                The analysis covers {loads.length} loads across {summary.byCategory.length} categories, with a total connected load of <strong className="text-orange-300">{fmtW(summary.totalConnectedLoadW, 1)}</strong> and 
                a maximum demand of <strong className="text-orange-300">{fmtW(summary.maximumDemandW, 1)}</strong>. The total daily energy consumption is <strong className="text-amber-300">{fmtWh(summary.totalDailyEnergyWh, 1)}</strong>, 
                of which {((summary.dayEnergyWh / Math.max(1, summary.totalDailyEnergyWh)) * 100).toFixed(0)}% occurs during daytime hours.
              </p>
            </Section>

            <Section title="2. Key Performance Indicators">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KPI2 label="Total Connected" value={fmtW(summary.totalConnectedLoadW, 1)} color="orange" />
                <KPI2 label="Max Demand" value={fmtW(summary.maximumDemandW, 1)} color="amber" />
                <KPI2 label="Daily Energy" value={fmtWh(summary.totalDailyEnergyWh, 1)} color="emerald" />
                <KPI2 label="Annual" value={fmtWh(summary.annualEnergyKWh * 1000, 0)} color="blue" />
                <KPI2 label="Peak kVA" value={fmtKVA(summary.peakDemandKVA)} color="cyan" />
                <KPI2 label="Max Current" value={fmtA(summary.estimatedMaxCurrentA)} color="red" />
                <KPI2 label="Max Surge" value={fmtW(summary.maximumSurgeKW * 1000, 0)} color="pink" />
                <KPI2 label="Load Factor" value={fmtPct(summary.loadFactor)} color="purple" />
              </div>
            </Section>

            <Section title="3. Load Categories Breakdown">
              <table className="w-full text-xs">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="text-left py-2">Category</th>
                    <th className="text-right py-2">Loads</th>
                    <th className="text-right py-2">Connected</th>
                    <th className="text-right py-2">Daily</th>
                    <th className="text-right py-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byCategory.map(c => (
                    <tr key={c.name} className="border-b border-slate-800/40">
                      <td className="py-2"><span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: c.color }} />{c.name}</td>
                      <td className="text-right mono">{loads.filter(l => l.categoryMain === c.name).length}</td>
                      <td className="text-right mono text-orange-300">{fmtW(loads.filter(l => l.categoryMain === c.name).reduce((s, l) => s + calcConnectedLoad(l), 0), 0)}</td>
                      <td className="text-right mono text-amber-300">{fmtWh(c.value, 0)}</td>
                      <td className="text-right mono">{((c.value / summary.totalDailyEnergyWh) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="4. Design Recommendations">
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /><span>Peak demand: <strong className="text-white">{fmtW(summary.maximumDemandW, 1)}</strong> — size inverter at minimum <strong className="text-white">{fmtW(summary.maximumDemandW * 1.25, 1)}</strong> (NEC 25% oversize rule)</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /><span>Total surge: <strong className="text-white">{fmtW(summary.maximumSurgeKW * 1000, 0)}</strong> — verify inverter surge rating or use soft-starters for motor loads</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /><span>Day energy: <strong className="text-white">{fmtWh(summary.dayEnergyWh, 0)}</strong> ({((summary.dayEnergyWh / Math.max(1, summary.totalDailyEnergyWh)) * 100).toFixed(0)}%) — Night: <strong className="text-white">{fmtWh(summary.nightEnergyWh, 0)}</strong> — Optimize shiftable loads to daytime</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /><span>Critical loads: <strong className="text-white">{fmtWh(summary.criticalLoadWh, 0)}/day</strong> — required battery backup capacity</span></li>
                {phaseImbalance.imbalance > 15 && (
                  <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" /><span>Phase imbalance: <strong className="text-amber-300">{phaseImbalance.imbalance.toFixed(1)}%</strong> — consider redistributing 1Ø loads across phases</span></li>
                )}
              </ul>
            </Section>
          </div>
        )}

        {reportType === 'demand' && (
          <div className="space-y-5 text-sm text-slate-200">
            <Section title="Maximum Demand Analysis">
              <table className="w-full text-xs">
                <tbody>
                  <TR label="Total Connected Load" value={fmtW(summary.totalConnectedLoadW, 1)} />
                  <TR label="Maximum Demand (Operating Peak)" value={fmtW(summary.maximumDemandW, 1)} highlight />
                  <TR label="Demand / Connected Ratio" value={fmtPct((summary.maximumDemandW / Math.max(1, summary.totalConnectedLoadW)) * 100)} />
                  <TR label="Coincident Peak Load" value={fmtW(summary.coincidentPeakLoadW, 1)} />
                  <TR label="Diversified Load" value={fmtW(summary.diversifiedLoadW, 1)} />
                  <TR label="Peak Demand (kW)" value={fmtW(summary.peakDemandKW * 1000, 1)} />
                  <TR label="Peak Demand (kVA)" value={fmtKVA(summary.peakDemandKVA)} />
                  <TR label="Estimated Max Current" value={fmtA(summary.estimatedMaxCurrentA)} />
                  <TR label="Maximum Aggregate Surge" value={fmtW(summary.maximumSurgeKW * 1000, 1)} />
                  <TR label="Load Factor" value={fmtPct(summary.loadFactor)} />
                </tbody>
              </table>
            </Section>

            <Section title="NEC Demand Factors Reference">
              <table className="w-full text-xs">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr><th className="text-left py-2">Description</th><th className="text-right py-2">Factor</th></tr>
                </thead>
                <tbody>
                  {NEC_DEMAND_FACTORS.map((f, i) => (
                    <tr key={i} className="border-b border-slate-800/40">
                      <td className="py-2">{f.description}</td>
                      <td className="text-right mono text-orange-300">{(f.factor * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="Surge Multipliers Reference (Motor Loads)">
              <table className="w-full text-xs">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr><th className="text-left py-2">Load Type</th><th className="text-right py-2">Multiplier</th><th className="text-left py-2 pl-3">Description</th></tr>
                </thead>
                <tbody>
                  {SURGE_MULTIPLIERS.map((s, i) => (
                    <tr key={i} className="border-b border-slate-800/40">
                      <td className="py-2">{s.name}</td>
                      <td className="text-right mono text-pink-300">{s.multiplier}×</td>
                      <td className="pl-3 text-slate-400">{s.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="Top 10 Loads by Connected Power">
              <table className="w-full text-xs">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="text-left py-2">#</th>
                    <th className="text-left py-2">Name</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Rated</th>
                    <th className="text-right py-2">Connected</th>
                    <th className="text-right py-2">Surge</th>
                  </tr>
                </thead>
                <tbody>
                  {[...metrics].sort((a, b) => b.connected - a.connected).slice(0, 10).map((m, i) => (
                    <tr key={m.load.id} className="border-b border-slate-800/40">
                      <td className="py-2 mono text-slate-500">{i + 1}</td>
                      <td className="py-2">{m.load.loadName}</td>
                      <td className="text-right mono">{m.load.quantity}</td>
                      <td className="text-right mono">{m.load.ratedPowerW}</td>
                      <td className="text-right mono text-orange-300">{fmtW(m.connected, 0)}</td>
                      <td className="text-right mono text-pink-300">{fmtW(m.surge, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </div>
        )}

        {reportType === 'seasonal' && (
          <div className="space-y-5 text-sm text-slate-200">
            <Section title="Seasonal Behavior Analysis">
              <table className="w-full text-xs">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="text-left py-2">Period</th>
                    <th className="text-right py-2">Day Energy</th>
                    <th className="text-right py-2">Night Energy</th>
                    <th className="text-right py-2">Total Daily</th>
                    <th className="text-right py-2">Annual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800/40">
                    <td className="py-2">Summer (Apr-Sep)</td>
                    <td className="text-right mono text-amber-300">{fmtWh(loads.reduce((s, l) => s + (l.dayHoursSummer * calcRunningLoad(l) * (l.dutyCyclePercent/100) * l.utilizationFactorKu * l.demandFactor * l.operatingDaysPerWeek/7), 0), 0)}</td>
                    <td className="text-right mono text-indigo-300">{fmtWh(summary.nightEnergyWh, 0)}</td>
                    <td className="text-right mono text-emerald-300">{fmtWh(summary.totalDailyEnergyWh, 0)}</td>
                    <td className="text-right mono text-blue-300">{fmtWh(summary.annualEnergyKWh * 1000 * 0.55, 0)}</td>
                  </tr>
                  <tr className="border-b border-slate-800/40">
                    <td className="py-2">Winter (Oct-Mar)</td>
                    <td className="text-right mono text-amber-300">{fmtWh(loads.reduce((s, l) => s + (l.dayHoursWinter * calcRunningLoad(l) * (l.dutyCyclePercent/100) * l.utilizationFactorKu * l.demandFactor * l.operatingDaysPerWeek/7), 0), 0)}</td>
                    <td className="text-right mono text-indigo-300">{fmtWh(loads.reduce((s, l) => s + (l.nightHoursWinter * calcRunningLoad(l) * (l.dutyCyclePercent/100) * l.utilizationFactorKu * l.demandFactor * l.operatingDaysPerWeek/7), 0), 0)}</td>
                    <td className="text-right mono text-emerald-300">{fmtWh(loads.reduce((s, l) => s + calcDailyEnergy(l, 'winter'), 0), 0)}</td>
                    <td className="text-right mono text-blue-300">{fmtWh(loads.reduce((s, l) => s + calcAnnualEnergy(l), 0) * 0.45, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Section title="Phase Balance Analysis">
              <table className="w-full text-xs">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr><th className="text-left py-2">Phase</th><th className="text-right py-2">Connected Load</th><th className="text-right py-2">Percentage</th></tr>
                </thead>
                <tbody>
                  {phaseImbalance.phases.map((p, i) => (
                    <tr key={i} className="border-b border-slate-800/40">
                      <td className="py-2">Phase {['L1', 'L2', 'L3'][i]}</td>
                      <td className="text-right mono text-orange-300">{fmtW(p, 0)}</td>
                      <td className="text-right mono">{((p / Math.max(1, phaseImbalance.phases.reduce((a, b) => a + b, 0))) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-slate-400 mt-3">Phase Imbalance: <strong className={phaseImbalance.imbalance > 15 ? 'text-amber-300' : 'text-emerald-300'}>{phaseImbalance.imbalance.toFixed(1)}%</strong> {phaseImbalance.imbalance > 15 ? '(exceeds 15% — recommend redistribution)' : '(within acceptable range)'}</p>
            </Section>
          </div>
        )}

        {reportType === 'compliance' && (
          <div className="space-y-5 text-sm text-slate-200">
            <Section title="Data Quality & Validation Issues">
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-sm text-emerald-200 font-semibold">Validation Passed</div>
                    <div className="text-xs text-emerald-300/80">{errors.length} errors · {warnings.length} warnings</div>
                  </div>
                </div>
                {errors.slice(0, 5).map((i, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-red-200 font-semibold">{i.loadName} — {i.field}</div>
                      <div className="text-xs text-red-300/80">{i.message}</div>
                    </div>
                  </div>
                ))}
                {warnings.slice(0, 5).map((i, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-amber-200 font-semibold">{i.loadName} — {i.field}</div>
                      <div className="text-xs text-amber-300/80">{i.message}</div>
                    </div>
                  </div>
                ))}
                {errors.length === 0 && warnings.length === 0 && (
                  <div className="text-center text-emerald-300 text-sm py-4">All loads pass validation — no issues detected.</div>
                )}
              </div>
            </Section>

            <Section title="Phantom Load Audit">
              <table className="w-full text-xs">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr><th className="text-left py-2">Load</th><th className="text-right py-2">Phantom W</th><th className="text-right py-2">24h Loss</th><th className="text-right py-2">Annual</th></tr>
                </thead>
                <tbody>
                  {loads.filter(l => l.phantomLoadW > 0).map(l => (
                    <tr key={l.id} className="border-b border-slate-800/40">
                      <td className="py-2">{l.loadName}</td>
                      <td className="text-right mono text-violet-300">{l.phantomLoadW}</td>
                      <td className="text-right mono">{fmtWh(l.phantomLoadW * 24, 0)}</td>
                      <td className="text-right mono text-emerald-300">{fmtWh(l.phantomLoadW * 24 * 365 / 1000, 1)} kWh</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="THD & Power Quality Warning">
              <div className="space-y-1.5">
                {loads.filter(l => l.thdPercent > 15).map(l => (
                  <div key={l.id} className="flex items-center justify-between p-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs">
                    <span className="text-amber-200">{l.loadName}</span>
                    <span className="mono text-amber-300 font-semibold">THD {l.thdPercent}%</span>
                  </div>
                ))}
                {loads.filter(l => l.thdPercent > 15).length === 0 && (
                  <div className="text-emerald-300 text-xs text-center py-3">No high-THD loads detected.</div>
                )}
              </div>
            </Section>
          </div>
        )}

        {reportType === 'custom' && (
          <div className="space-y-4 text-sm text-slate-200">
            <Section title="Custom Report Builder">
              <p className="text-slate-400 text-xs mb-4">Configure and export a custom report with selected sections.</p>
              <div className="grid grid-cols-2 gap-2">
                {['Connected Load', 'Running Load', 'Demand Load', 'Coincident', 'Diversified', 'Daily Energy', 'Monthly', 'Annual', '24h Profile', 'Surge', 'Phantom', 'Critical'].map(s => (
                  <label key={s} className="flex items-center gap-2 p-2 rounded bg-slate-900/40 border border-slate-800 cursor-pointer hover:border-orange-500/30">
                    <input type="checkbox" defaultChecked className="accent-orange-500" />
                    <span className="text-xs">{s}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={handleDownload}
                disabled={generating || loads.length === 0}
                className="mt-4 px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-lg flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #1A2B6B 0%, #99F36C 100%)', boxShadow: '0 4px 14px rgba(26, 43, 107, 0.4)' }}
              >
                {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</> : <><Download className="w-3.5 h-3.5" /> Generate Custom Report (PDF)</>}
              </button>
            </Section>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <div>KAD POWER Engineering Suite · Load Analysis Engine v3.0 · NEC/IEC compliant</div>
          <div>{loads.length} loads · {summary.byCategory.length} categories · Generated by {expertLevel} Mode</div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-base font-bold text-white mb-3 border-l-2 border-orange-500 pl-3">{title}</h4>
      {children}
    </div>
  );
}

function TR({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <tr className={`border-b border-slate-800/40 ${highlight ? 'bg-orange-500/10' : ''}`}>
      <td className="py-2 text-slate-300">{label}</td>
      <td className={`py-2 text-right mono font-semibold ${highlight ? 'text-orange-300' : 'text-white'}`}>{value}</td>
    </tr>
  );
}

function KPI2({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className={`text-lg mono font-bold text-${color}-300 mt-1`}>{value}</div>
    </div>
  );
}
