import { useState, useMemo } from 'react';
import { useLoads, useLoadMetrics, createDefaultLoad } from '../context/LoadContext';
import { useLocale } from '../core/i18n/LocaleContext';
import { Plus, Search, Trash2, Copy, Edit3, X, Sparkles, AlertCircle, Save, Filter } from 'lucide-react';
import type { Load, CategoryMain, PhaseType, HarmonicClass, Criticality, OperatingMode, TimeProfileType, ElectricalType, DataSource, MeasurementMethod, ConfidenceLevel } from '../types';
import { CATEGORY_OPTIONS, SPACE_OPTIONS, BUILDING_LEVELS, APPLIANCE_LIBRARY } from '../data/appliances';
import { fmtW, fmtWh, calcConnectedLoad, calcRunningLoad, calcDailyEnergy, calcSurgePower, getAutoEstimate, validateLoad } from '../utils/calculations';

export function LoadInventory() {
  const { loads, addLoad, updateLoad, removeLoad, duplicateLoad, expertLevel } = useLoads();
  const metrics = useLoadMetrics();
  useLocale(); // ensures context is mounted
  const [editing, setEditing] = useState<Load | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('All');
  const [showLibrary, setShowLibrary] = useState(false);

  const filtered = useMemo(() => {
    return metrics.filter(m => {
      const s = search.toLowerCase();
      const matchSearch = !s || m.load.loadName.toLowerCase().includes(s) || m.load.arabicName.includes(search) || m.load.loadTag.toLowerCase().includes(s) || m.load.loadId.toLowerCase().includes(s);
      const matchCat = filterCat === 'All' || m.load.categoryMain === filterCat;
      return matchSearch && matchCat;
    });
  }, [metrics, search, filterCat]);

  const newLoad = (): Load => createDefaultLoad({
    ratedPowerW: 100,
    runningPowerW: 90,
  });

  return (
    <div className="p-6 space-y-4 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Load Inventory</h2>
          <p className="text-xs text-slate-500">{loads.length} loads · Click any row to edit · Use the library for instant templates</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowLibrary(true)} className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-700/60 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Library
          </button>
          <button onClick={() => setEditing(newLoad())} className="px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold shadow-lg shadow-orange-500/30 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Load
          </button>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, tag, ID, or Arabic name…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-sm text-white placeholder-slate-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="pl-9 pr-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-sm text-white">
            <option value="All">All Categories</option>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Inventory table */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-900/70 text-slate-400">
              <tr>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">ID</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Tag</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Name</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Category</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Space</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Qty</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Rated (W)</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Running (W)</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Connected</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Daily (Wh)</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Profile</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Crit.</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={13} className="px-4 py-12 text-center text-slate-500">No loads found — add your first load or use the Library.</td></tr>
              )}
              {filtered.map(m => (
                <tr key={m.load.id} className="border-t border-slate-800/50 hover:bg-slate-800/30 group">
                  <td className="px-3 py-2 mono text-slate-400">{m.load.loadId}</td>
                  <td className="px-3 py-2 mono text-orange-300">{m.load.loadTag}</td>
                  <td className="px-3 py-2">
                    <div className="text-white font-medium">{m.load.loadName || <span className="text-slate-500 italic">unnamed</span>}</div>
                    {m.load.arabicName && <div className="text-slate-500 text-[10px]">{m.load.arabicName}</div>}
                  </td>
                  <td className="px-3 py-2"><CatBadge cat={m.load.categoryMain} /></td>
                  <td className="px-3 py-2 text-slate-400">{m.load.spaceArea}</td>
                  <td className="px-3 py-2 text-right mono">{m.load.quantity}</td>
                  <td className="px-3 py-2 text-right mono text-slate-300">{m.load.ratedPowerW}</td>
                  <td className="px-3 py-2 text-right mono text-slate-300">{m.load.runningPowerW}</td>
                  <td className="px-3 py-2 text-right mono text-orange-300 font-semibold">{fmtW(m.connected, 0)}</td>
                  <td className="px-3 py-2 text-right mono text-amber-300 font-semibold">{fmtWh(m.daily, 0)}</td>
                  <td className="px-3 py-2 text-center"><ProfileBadge p={m.load.timeProfileType} /></td>
                  <td className="px-3 py-2 text-center"><CritBadge c={m.load.criticality} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition">
                      <button onClick={() => setEditing(m.load)} className="p-1.5 rounded hover:bg-slate-700 text-slate-300" title="Edit">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => duplicateLoad(m.load.id)} className="p-1.5 rounded hover:bg-slate-700 text-slate-300" title="Duplicate">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm(`Delete ${m.load.loadName}?`)) removeLoad(m.load.id); }} className="p-1.5 rounded hover:bg-red-500/20 text-red-300" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <LoadFormModal load={editing} onClose={() => setEditing(null)} onSave={(l) => {
        if (loads.find(x => x.id === l.id)) updateLoad(l.id, l);
        else addLoad(l);
        setEditing(null);
      }} expertLevel={expertLevel} />}

      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} onPick={(t) => {
        const l = newLoad();
        l.loadName = t.name;
        l.arabicName = t.arabicName;
        l.categoryMain = t.categoryMain;
        l.categorySub = t.categorySub;
        l.ratedPowerW = t.ratedPowerW;
        l.runningPowerW = t.runningPowerW;
        l.powerFactor = t.powerFactor;
        l.efficiency = t.efficiency;
        l.electricalType = t.electricalType;
        l.voltageNominal = t.voltageNominal;
        l.phaseType = t.phaseType;
        l.frequency = t.frequency;
        l.thdPercent = t.thdPercent;
        l.harmonicClass = t.harmonicClass;
        l.surgeMultiplier = t.surgeMultiplier;
        l.dutyCyclePercent = t.dutyCyclePercent;
        l.utilizationFactorKu = t.utilizationFactorKu;
        l.demandFactor = t.demandFactor;
        l.dayHoursSummer = t.typicalDayHours;
        l.nightHoursSummer = t.typicalNightHours;
        l.dayHoursWinter = t.typicalDayHours;
        l.nightHoursWinter = t.typicalNightHours;
        l.operatingMode = t.operatingMode;
        l.timeProfileType = t.timeProfileType;
        l.continuousLoad = t.continuousLoad;
        l.criticality = t.criticality;
        l.cyclingLoad = t.isCyclic;
        l.standbyLoad = t.hasStandby;
        l.phantomLoadW = t.phantomLoadW;
        l.hourlyProfile = t.hourlyProfile;
        setEditing(l);
        setShowLibrary(false);
      }} />}
    </div>
  );
}

function CatBadge({ cat }: { cat: string }) {
  const colors: Record<string, string> = {
    'Lighting': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'HVAC': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'Kitchen': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    'Pump': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Medical': 'bg-red-500/20 text-red-300 border-red-500/30',
    'IT': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    'Industrial': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'EV': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'Security': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    'Water': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    'Office': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    'Laundry': 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    'Other': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };
  return <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[cat] || colors['Other']}`}>{cat}</span>;
}

function CritBadge({ c }: { c: string }) {
  const colors: Record<string, string> = {
    'Critical': 'bg-red-500/20 text-red-300 border-red-500/30',
    'Essential': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'Normal': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Optional': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[c] || colors['Normal']}`}>{c[0]}</span>;
}

function ProfileBadge({ p }: { p: string }) {
  const colors: Record<string, string> = {
    'Base Load': 'text-emerald-400', 'Morning Peak': 'text-amber-400', 'Noon Peak': 'text-orange-400',
    'Evening Peak': 'text-pink-400', 'Night Load': 'text-indigo-400', '24/7': 'text-red-400', 'Day Load': 'text-blue-400',
  };
  return <span className={`text-[10px] font-mono ${colors[p] || 'text-slate-400'}`}>{p.split(' ')[0]}</span>;
}

// ============== LOAD FORM MODAL ==============
function LoadFormModal({ load, onClose, onSave, expertLevel }: { load: Load; onClose: () => void; onSave: (l: Load) => void; expertLevel: string }) {
  const [form, setForm] = useState<Load>(load);
  const set = <K extends keyof Load>(k: K, v: Load[K]) => setForm(p => ({ ...p, [k]: v }));
  const isExpert = expertLevel === 'Expert';
  const isCommercial = expertLevel === 'Commercial' || isExpert;
  const issues = validateLoad(form);

  // Auto-estimate
  const autoEstimate = () => {
    const e = getAutoEstimate(form.categoryMain);
    setForm(p => ({ ...p, ...e, powerFactor: e.powerFactor || p.powerFactor, efficiency: e.efficiency || p.efficiency }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0f1424] border border-slate-800 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f1424]/95 backdrop-blur">
          <div>
            <h3 className="text-lg font-bold text-white">{load.loadName ? 'Edit Load' : 'Add New Load'}</h3>
            <p className="text-xs text-slate-500">{form.loadId} · {form.categoryMain} · {expertLevel} Mode</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={autoEstimate} className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 hover:bg-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Auto-Estimate
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* A. Identity */}
          <Section title="A · Load Identity" subtitle="Basic identification & classification">
            <Grid>
              <Field label="Load ID" mono>
                <input value={form.loadId} onChange={e => set('loadId', e.target.value)} className="ipt" />
              </Field>
              <Field label="Tag / Reference" mono>
                <input value={form.loadTag} onChange={e => set('loadTag', e.target.value)} placeholder="AC-LR-01" className="ipt" />
              </Field>
              <Field label="Name (English)">
                <input value={form.loadName} onChange={e => set('loadName', e.target.value)} className="ipt" />
              </Field>
              <Field label="Name (Arabic)" dir="rtl">
                <input value={form.arabicName} onChange={e => set('arabicName', e.target.value)} className="ipt text-right" />
              </Field>
              <Field label="Category">
                <select value={form.categoryMain} onChange={e => set('categoryMain', e.target.value as CategoryMain)} className="ipt">
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Sub-category">
                <input value={form.categorySub} onChange={e => set('categorySub', e.target.value)} placeholder="e.g. Split Inverter" className="ipt" />
              </Field>
              <Field label="Space / Area">
                <select value={form.spaceArea} onChange={e => set('spaceArea', e.target.value)} className="ipt">
                  {SPACE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Building Level">
                <select value={form.buildingLevel} onChange={e => set('buildingLevel', e.target.value)} className="ipt">
                  {BUILDING_LEVELS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Distribution Board" mono>
                <input value={form.distributionBoard} onChange={e => set('distributionBoard', e.target.value)} className="ipt" />
              </Field>
              <Field label="Circuit Reference" mono>
                <input value={form.circuitReference} onChange={e => set('circuitReference', e.target.value)} className="ipt" />
              </Field>
            </Grid>
            <Field label="Description" className="mt-3">
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="ipt" />
            </Field>
          </Section>

          {/* B. Electrical */}
          <Section title="B · Electrical Specification" subtitle="Ratings, power quality, surge behavior">
            <Grid>
              <Field label="Electrical Type">
                <select value={form.electricalType} onChange={e => set('electricalType', e.target.value as ElectricalType)} className="ipt">
                  <option>AC</option><option>DC</option>
                </select>
              </Field>
              <Field label="Voltage (V)">
                <input type="number" value={form.voltageNominal} onChange={e => set('voltageNominal', +e.target.value)} className="ipt" />
              </Field>
              <Field label="Frequency">
                <select value={form.frequency} onChange={e => set('frequency', e.target.value as any)} className="ipt">
                  <option>50Hz</option><option>60Hz</option>
                </select>
              </Field>
              <Field label="Phase">
                <select value={form.phaseType} onChange={e => set('phaseType', e.target.value as PhaseType)} className="ipt">
                  <option>1Ø</option><option>3Ø</option>
                </select>
              </Field>
              <Field label="Rated Power (W)">
                <input type="number" value={form.ratedPowerW} onChange={e => set('ratedPowerW', +e.target.value)} className="ipt" />
              </Field>
              <Field label="Running Power (W)">
                <input type="number" value={form.runningPowerW} onChange={e => set('runningPowerW', +e.target.value)} className="ipt" />
              </Field>
              <Field label="Power Factor (0-1)">
                <input type="number" step="0.01" min="0" max="1" value={form.powerFactor} onChange={e => set('powerFactor', +e.target.value)} className="ipt" />
              </Field>
              <Field label="Efficiency (%)">
                <input type="number" min="0" max="100" value={form.efficiency} onChange={e => set('efficiency', +e.target.value)} className="ipt" />
              </Field>
              {isExpert && (
                <>
                  <Field label="THD (%)">
                    <input type="number" min="0" max="100" value={form.thdPercent} onChange={e => set('thdPercent', +e.target.value)} className="ipt" />
                  </Field>
                  <Field label="Harmonic Class">
                    <select value={form.harmonicClass} onChange={e => set('harmonicClass', e.target.value as HarmonicClass)} className="ipt">
                      <option>Linear</option><option>Nonlinear</option><option>High Harmonics</option>
                    </select>
                  </Field>
                  <Field label="Locked Rotor (A)">
                    <input type="number" value={form.lockedRotorCurrentA} onChange={e => set('lockedRotorCurrentA', +e.target.value)} className="ipt" />
                  </Field>
                  <Field label="Surge Multiplier (x)">
                    <select value={form.surgeMultiplier} onChange={e => set('surgeMultiplier', +e.target.value)} className="ipt">
                      {[1, 1.5, 2, 3, 5, 7].map(s => <option key={s} value={s}>{s}x</option>)}
                    </select>
                  </Field>
                </>
              )}
              <Field label="Quantity">
                <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', +e.target.value)} className="ipt" />
              </Field>
            </Grid>

            {/* Auto-calculated results */}
            <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <CalcMetric label="Connected" value={fmtW(calcConnectedLoad(form), 0)} />
              <CalcMetric label="Running" value={fmtW(calcRunningLoad(form), 0)} />
              <CalcMetric label="Surge" value={fmtW(calcSurgePower(form), 0)} color="pink" />
              <CalcMetric label="FLC" value={`${(calcConnectedLoad(form) / (form.voltageNominal * form.powerFactor * (form.phaseType === '3Ø' ? Math.sqrt(3) : 1))).toFixed(2)} A`} color="cyan" />
              <CalcMetric label="kVA" value={`${(calcConnectedLoad(form) / (form.powerFactor * 1000)).toFixed(2)}`} color="amber" />
            </div>
          </Section>

          {/* C. Behavior */}
          <Section title="C · Operational Behavior" subtitle="Duty cycle, utilization, criticality & control">
            <Grid>
              <Field label="Duty Cycle (%)">
                <input type="number" min="0" max="100" value={form.dutyCyclePercent} onChange={e => set('dutyCyclePercent', +e.target.value)} className="ipt" />
              </Field>
              <Field label="Utilization Ku (0-1)">
                <input type="number" step="0.05" min="0" max="1" value={form.utilizationFactorKu} onChange={e => set('utilizationFactorKu', +e.target.value)} className="ipt" />
              </Field>
              {isExpert && (
                <>
                  <Field label="Demand Factor (0-1)">
                    <input type="number" step="0.05" min="0" max="1" value={form.demandFactor} onChange={e => set('demandFactor', +e.target.value)} className="ipt" />
                  </Field>
                  <Field label="Coincidence (0-1)">
                    <input type="number" step="0.05" min="0" max="1" value={form.coincidenceFactor} onChange={e => set('coincidenceFactor', +e.target.value)} className="ipt" />
                  </Field>
                  <Field label="Diversity (≥1)">
                    <input type="number" step="0.05" min="1" value={form.diversityFactor} onChange={e => set('diversityFactor', +e.target.value)} className="ipt" />
                  </Field>
                </>
              )}
              <Field label="Criticality">
                <select value={form.criticality} onChange={e => set('criticality', e.target.value as Criticality)} className="ipt">
                  <option>Critical</option><option>Essential</option><option>Normal</option><option>Optional</option>
                </select>
              </Field>
              <Field label="Operating Mode">
                <select value={form.operatingMode} onChange={e => set('operatingMode', e.target.value as OperatingMode)} className="ipt">
                  <option>Continuous</option><option>Intermittent</option><option>Scheduled</option><option>Seasonal</option><option>Sensor-Based</option>
                </select>
              </Field>
              <Field label="Phantom / Standby (W)">
                <input type="number" value={form.phantomLoadW} onChange={e => set('phantomLoadW', +e.target.value)} className="ipt" />
              </Field>
            </Grid>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <Toggle label="Continuous Load" v={form.continuousLoad} onChange={v => set('continuousLoad', v)} />
              <Toggle label="Deferrable" v={form.deferrableLoad} onChange={v => set('deferrableLoad', v)} />
              <Toggle label="Shiftable to Day" v={form.shiftableToDaytime} onChange={v => set('shiftableToDaytime', v)} />
              <Toggle label="Smart Controlled" v={form.smartControlled} onChange={v => set('smartControlled', v)} />
              <Toggle label="Auto Start" v={form.autoStart} onChange={v => set('autoStart', v)} />
              <Toggle label="Cycling Load" v={form.cyclingLoad} onChange={v => set('cyclingLoad', v)} />
              <Toggle label="Has Standby" v={form.standbyLoad} onChange={v => set('standbyLoad', v)} />
            </div>
          </Section>

          {/* D. Time-of-use */}
          <Section title="D · Time-of-Use Profile" subtitle="Operating hours by day/night, season, weekday">
            <Grid>
              <Field label="Summer Day (h)">
                <input type="number" step="0.1" value={form.dayHoursSummer} onChange={e => set('dayHoursSummer', +e.target.value)} className="ipt" />
              </Field>
              <Field label="Summer Night (h)">
                <input type="number" step="0.1" value={form.nightHoursSummer} onChange={e => set('nightHoursSummer', +e.target.value)} className="ipt" />
              </Field>
              <Field label="Winter Day (h)">
                <input type="number" step="0.1" value={form.dayHoursWinter} onChange={e => set('dayHoursWinter', +e.target.value)} className="ipt" />
              </Field>
              <Field label="Winter Night (h)">
                <input type="number" step="0.1" value={form.nightHoursWinter} onChange={e => set('nightHoursWinter', +e.target.value)} className="ipt" />
              </Field>
              <Field label="Days / Week">
                <input type="number" min="1" max="7" value={form.operatingDaysPerWeek} onChange={e => set('operatingDaysPerWeek', +e.target.value)} className="ipt" />
              </Field>
              <Field label="Days / Year">
                <input type="number" value={form.operatingDaysPerYear} onChange={e => set('operatingDaysPerYear', +e.target.value)} className="ipt" />
              </Field>
            </Grid>
          </Section>

          {/* E. Time profile */}
          <Section title="E · Load Profile & Time Behavior" subtitle="Peak time, profile type, simultaneity">
            <Grid>
              <Field label="Profile Type">
                <select value={form.timeProfileType} onChange={e => set('timeProfileType', e.target.value as TimeProfileType)} className="ipt">
                  <option>Base Load</option><option>Morning Peak</option><option>Noon Peak</option><option>Evening Peak</option><option>Night Load</option><option>Day Load</option><option>24/7</option>
                </select>
              </Field>
              <Field label="Peak Start">
                <input type="time" value={form.peakStartTime} onChange={e => set('peakStartTime', e.target.value)} className="ipt" />
              </Field>
              <Field label="Peak End">
                <input type="time" value={form.peakEndTime} onChange={e => set('peakEndTime', e.target.value)} className="ipt" />
              </Field>
              <Field label="Max Simultaneous">
                <input type="number" min="1" value={form.maxSimultaneousUnits} onChange={e => set('maxSimultaneousUnits', +e.target.value)} className="ipt" />
              </Field>
              <Field label="Group" full>
                <input value={form.simultaneousGroup} onChange={e => set('simultaneousGroup', e.target.value)} placeholder="e.g. AC-cluster" className="ipt" />
              </Field>
            </Grid>
          </Section>

          {/* G. Verification */}
          {isCommercial && (
            <Section title="G · Verification & Source" subtitle="Data quality & traceability">
              <Grid>
                <Field label="Data Source">
                  <select value={form.dataSource} onChange={e => set('dataSource', e.target.value as DataSource)} className="ipt">
                    <option>Nameplate</option><option>Measured</option><option>Manufacturer</option><option>EnergyStar</option><option>Estimated</option>
                  </select>
                </Field>
                <Field label="Measurement Method">
                  <select value={form.measurementMethod} onChange={e => set('measurementMethod', e.target.value as MeasurementMethod)} className="ipt">
                    <option>Wattmeter</option><option>Clamp Meter</option><option>Datasheet</option><option>Estimate</option>
                  </select>
                </Field>
                <Field label="Measurement Date">
                  <input type="date" value={form.measurementDate} onChange={e => set('measurementDate', e.target.value)} className="ipt" />
                </Field>
                <Field label="Confidence">
                  <select value={form.confidenceLevel} onChange={e => set('confidenceLevel', e.target.value as ConfidenceLevel)} className="ipt">
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </Field>
                <Field label="Notes" full>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="ipt" />
                </Field>
              </Grid>
            </Section>
          )}

          {/* Issues */}
          {issues.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
              {issues.filter(i => i.type === 'error').map((i, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" /> <span className="font-medium">{i.field}:</span> {i.message}
                </div>
              ))}
              {issues.filter(i => i.type === 'warning').map((i, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-amber-300/80">
                  <AlertCircle className="w-3.5 h-3.5" /> <span className="font-medium">{i.field}:</span> {i.message}
                </div>
              ))}
            </div>
          )}

          {/* F. Computed totals */}
          <Section title="F · Engineering Calculations" subtitle="Auto-calculated in real time">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
              <CalcMetric label="Connected" value={fmtW(calcConnectedLoad(form), 1)} />
              <CalcMetric label="Running" value={fmtW(calcRunningLoad(form), 1)} />
              <CalcMetric label="Surge" value={fmtW(calcSurgePower(form), 1)} color="pink" />
              <CalcMetric label="Daily Energy" value={fmtWh(calcDailyEnergy(form), 1)} color="emerald" />
              <CalcMetric label="Summer Daily" value={fmtWh(calcDailyEnergy(form, 'summer'), 1)} color="amber" />
              <CalcMetric label="Winter Daily" value={fmtWh(calcDailyEnergy(form, 'winter'), 1)} color="blue" />
              <CalcMetric label="Summer Day" value={fmtWh(calcDailyEnergy(form, 'summer') - (form.nightHoursSummer * calcRunningLoad(form) * (form.dutyCyclePercent/100) * form.utilizationFactorKu * form.demandFactor * form.operatingDaysPerWeek/7), 1)} />
              <CalcMetric label="Summer Night" value={fmtWh(form.nightHoursSummer * calcRunningLoad(form) * (form.dutyCyclePercent/100) * form.utilizationFactorKu * form.demandFactor * form.operatingDaysPerWeek/7, 1)} color="indigo" />
            </div>
          </Section>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#0f1424]/95 backdrop-blur">
          <div className="text-xs text-slate-500">
            {form.loadId && <span className="mono">{form.loadId}</span>}
            {form.loadName && <span className="ml-2">· {form.loadName}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">Cancel</button>
            <button onClick={() => onSave(form)} disabled={issues.some(i => i.type === 'error')} className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold shadow-lg shadow-orange-500/30 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              <Save className="w-3.5 h-3.5" /> Save Load
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LibraryModal({ onClose, onPick }: { onClose: () => void; onPick: (t: any) => void }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const filtered = APPLIANCE_LIBRARY.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.arabicName.includes(search);
    const matchCat = cat === 'All' || t.categoryMain === cat;
    return matchSearch && matchCat;
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0f1424] border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Appliance Master Library</h3>
            <p className="text-xs text-slate-500">{APPLIANCE_LIBRARY.length} pre-configured templates</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-3 border-b border-slate-800 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search appliances…" className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-sm text-white" />
          </div>
          <select value={cat} onChange={e => setCat(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-sm text-white">
            <option value="All">All</option>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map((t, i) => (
            <button key={i} onClick={() => onPick(t)} className="text-left p-3 rounded-lg bg-slate-900/40 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/40 transition group">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm text-white group-hover:text-orange-300">{t.name}</div>
                <span className="text-[10px] text-slate-500 mono">{t.categoryMain}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5" dir="rtl">{t.arabicName}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 mono">{t.ratedPowerW}W</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mono">PF {t.powerFactor}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mono">η {t.efficiency}%</span>
                {t.surgeMultiplier > 1 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 mono">{t.surgeMultiplier}x</span>}
                {t.phantomLoadW > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 mono">phantom {t.phantomLoadW}W</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Reusable building blocks
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0f1424]/60 p-5">
      <div className="mb-4 pb-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{children}</div>;
}
function Field({ label, children, full, className }: { label: string; children: React.ReactNode; mono?: boolean; dir?: any; full?: boolean; className?: string }) {
  return (
    <div className={full ? `col-span-full ${className || ''}` : className}>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: (b: boolean) => void }) {
  return (
    <button onClick={() => onChange(!v)} className={`flex items-center justify-between p-2 rounded-lg border text-xs font-medium transition ${v ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/60'}`}>
      <span>{label}</span>
      <span className={`w-8 h-4 rounded-full relative transition ${v ? 'bg-emerald-500' : 'bg-slate-700'}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition ${v ? 'left-4' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
function CalcMetric({ label, value, color = 'orange' }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className={`text-sm mono font-bold text-${color}-300 mt-0.5`}>{value}</div>
    </div>
  );
}

// Inject input style
const style = document.createElement('style');
style.textContent = `.ipt { width: 100%; background: rgba(15, 20, 36, 0.6); border: 1px solid #1f2a44; border-radius: 6px; padding: 7px 10px; font-size: 12px; color: #e6ecff; transition: border-color 0.15s; }
.ipt:focus { border-color: #ff6a00; background: rgba(15, 20, 36, 0.9); }`;
if (typeof document !== 'undefined' && !document.getElementById('ipt-style')) {
  style.id = 'ipt-style';
  document.head.appendChild(style);
}
