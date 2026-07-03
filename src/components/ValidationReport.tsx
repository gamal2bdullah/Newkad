import { useState } from 'react';
import { useLoads, useSummary } from '../context/LoadContext';
import { getValidationMatrix, type Severity } from '../core/validation/rules';
import { balancePhases } from '../core/phase/balancer';
import { generateAuditPDF } from '../utils/auditReports';
import { AlertTriangle, Info, Lightbulb, FileQuestion, CheckCircle2, X, Download, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, RadialBarChart, RadialBar } from 'recharts';

const SEV_META: Record<Severity, { label: string; color: string; bg: string; border: string; icon: any }> = {
  error: { label: 'Error', color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: X },
  warning: { label: 'Warning', color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle },
  advisory: { label: 'Advisory', color: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Lightbulb },
  info: { label: 'Info', color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Info },
  assumption: { label: 'Assumption', color: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/30', icon: FileQuestion },
};

const SEV_BAR_COLORS: Record<Severity, string> = {
  error: '#ef4444', warning: '#f59e0b', advisory: '#3b82f6', info: '#10b981', assumption: '#8b5cf6',
};

export function ValidationReport() {
  const { loads, projectName, expertLevel } = useLoads();
  const summary = useSummary();
  const [generating, setGenerating] = useState(false);
  const handleDownload = async () => {
    setGenerating(true);
    try { await new Promise(r => setTimeout(r, 50)); generateAuditPDF('validation', loads, summary, projectName, expertLevel); } finally { setGenerating(false); }
  };
  const matrix = getValidationMatrix(loads);
  const total = matrix.error.length + matrix.warning.length + matrix.advisory.length + matrix.info.length + matrix.assumption.length;

  const severityList: Severity[] = ['error', 'warning', 'advisory', 'info', 'assumption'];
  const counts: { severity: Severity; count: number }[] = severityList.map(s => ({
    severity: s,
    count: matrix[s].length,
  }));

  const allResults = [
    ...matrix.error.map(r => ({ ...r, severity: 'error' as Severity })),
    ...matrix.warning.map(r => ({ ...r, severity: 'warning' as Severity })),
    ...matrix.advisory.map(r => ({ ...r, severity: 'advisory' as Severity })),
    ...matrix.info.map(r => ({ ...r, severity: 'info' as Severity })),
    ...matrix.assumption.map(r => ({ ...r, severity: 'assumption' as Severity })),
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1800px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Multi-Layer Validation Matrix</h2>
          <p className="text-xs text-slate-500">Five severity levels · 22 rules · Every result includes ruleId, source, fixSuggestion, and related formula</p>
        </div>
        <button onClick={handleDownload} disabled={generating} className="px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold shadow-lg shadow-orange-500/30 flex items-center gap-1.5 disabled:opacity-50">
          {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</> : <><Download className="w-3.5 h-3.5" /> Matrix PDF</>}
        </button>
      </div>

      {/* Severity summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {counts.map(s => {
          const m = SEV_META[s.severity];
          const Icon = m.icon;
          return (
            <div key={s.severity} className={`rounded-xl border ${m.border} ${m.bg} p-4`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase tracking-wider ${m.color} font-bold flex items-center gap-1.5`}>
                  <Icon className="w-3 h-3" /> {m.label}
                </span>
                <span className={`text-2xl font-bold mono ${m.color}`}>{s.count}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{((s.count / Math.max(1, total)) * 100).toFixed(0)}% of all issues</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={counts.map(s => ({ name: SEV_META[s.severity].label, count: s.count }))}>
              <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7a9c" fontSize={10} />
              <YAxis stroke="#6b7a9c" fontSize={10} />
              <Tooltip contentStyle={{ background: '#0f1424', border: '1px solid #2a3656', borderRadius: 8 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {counts.map((s, i) => <Cell key={i} fill={SEV_BAR_COLORS[s.severity]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Health Score</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadialBarChart innerRadius="40%" outerRadius="100%" data={[
              { name: 'Errors', value: matrix.error.length === 0 ? 100 : Math.max(0, 100 - matrix.error.length * 25), fill: '#ef4444' },
              { name: 'Warnings', value: matrix.warning.length === 0 ? 100 : Math.max(0, 100 - matrix.warning.length * 5), fill: '#f59e0b' },
              { name: 'Clean', value: total === 0 ? 100 : Math.max(0, 100 - matrix.error.length * 25 - matrix.warning.length * 5), fill: '#10b981' },
            ]} startAngle={180} endAngle={0}>
              <RadialBar background dataKey="value" />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f1424', border: '1px solid #2a3656', borderRadius: 8 }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All results */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">All Validation Results ({total})</h3>
          <span className="text-[10px] text-slate-500">Sorted by severity: error → warning → advisory → info → assumption</span>
        </div>
        {total === 0 ? (
          <div className="p-12 text-center text-emerald-300">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
            <div className="text-lg font-semibold">All loads pass validation</div>
            <div className="text-xs text-slate-500 mt-1">No issues detected across 22 rules</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
            {allResults.map((r, idx) => {
              const m = SEV_META[r.severity];
              const Icon = m.icon;
              return (
                <div key={idx} className="p-4 hover:bg-slate-800/20 transition">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${m.bg} ${m.border} border flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${m.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${m.bg} ${m.border} ${m.color}`}>{r.severity.toUpperCase()}</span>
                        <span className="text-xs font-semibold text-white">{r.loadName || '(unnamed load)'}</span>
                        <span className="text-[10px] text-slate-500 mono">rule: {r.ruleId}</span>
                        <span className="text-[10px] text-slate-500 mono">field: {r.field}</span>
                        {r.autoFixable && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">auto-fixable</span>}
                      </div>
                      <div className="text-sm text-slate-200 mt-1">{r.message}</div>
                      {r.relatedFormula && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          <span className="text-orange-400 font-semibold">Formula:</span> <code className="mono">{r.relatedFormula}</code>
                          {r.affectedMetric && <span className="ml-2">· <span className="text-orange-400">Affects:</span> {r.affectedMetric}</span>}
                        </div>
                      )}
                      <div className="mt-2 p-2 rounded bg-slate-900/40 border border-slate-800/50 text-[11px]">
                        <span className="text-cyan-400 font-semibold">💡 Fix:</span> <span className="text-slate-300">{r.fixSuggestion}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Source: {r.source}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =======================================================================
//  PHASE BALANCING REPORT
// =======================================================================
export function PhaseBalanceReport() {
  const { loads, projectName, expertLevel } = useLoads();
  const summary = useSummary();
  const [generating, setGenerating] = useState(false);
  const handleDownload = async () => {
    setGenerating(true);
    try { await new Promise(r => setTimeout(r, 50)); generateAuditPDF('phase', loads, summary, projectName, expertLevel); } finally { setGenerating(false); }
  };
  const result = balancePhases(loads);

  const COLORS: Record<string, string> = { L1: '#f59e0b', L2: '#3b82f6', L3: '#ec4899', '3Ø': '#8b5cf6' };

  return (
    <div className="p-6 space-y-5 max-w-[1800px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Phase Balancing Engine</h2>
          <p className="text-xs text-slate-500">Multi-pass greedy + refinement algorithm · 6-phase optimization · Surge stacking analysis</p>
        </div>
        <button onClick={handleDownload} disabled={generating} className="px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold shadow-lg shadow-orange-500/30 flex items-center gap-1.5 disabled:opacity-50">
          {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</> : <><Download className="w-3.5 h-3.5" /> Balance PDF</>}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard label="Imbalance" value={`${result.imbalancePercent.toFixed(1)}%`} status={result.imbalanceStatus} color={result.imbalancePercent < 10 ? 'emerald' : result.imbalancePercent < 15 ? 'amber' : 'red'} />
        <StatusCard label="Balancing Score" value={`${result.balancingScore.toFixed(0)}/100`} sub="Higher = better" color={result.balancingScore > 80 ? 'emerald' : result.balancingScore > 60 ? 'amber' : 'red'} />
        <StatusCard label="Total Connected" value={`${(result.totalConnected / 1000).toFixed(1)} kW`} sub={`${loads.length} loads`} color="orange" />
        <StatusCard label="Violations" value={result.violations.length.toString()} sub={`${result.violations.filter(v => v.severity === 'critical').length} critical`} color={result.violations.length === 0 ? 'emerald' : 'red'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Phase Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { phase: 'L1', load: result.phases.L1 },
              { phase: 'L2', load: result.phases.L2 },
              { phase: 'L3', load: result.phases.L3 },
            ]}>
              <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="phase" stroke="#6b7a9c" fontSize={11} />
              <YAxis stroke="#6b7a9c" fontSize={10} unit=" W" />
              <Tooltip contentStyle={{ background: '#0f1424', border: '1px solid #2a3656', borderRadius: 8 }} formatter={(v: any) => `${(v / 1000).toFixed(2)} kW`} />
              <Bar dataKey="load" radius={[6, 6, 0, 0]}>
                {[0, 1, 2].map(i => <Cell key={i} fill={[COLORS.L1, COLORS.L2, COLORS.L3][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Surge Stacking Analysis</h3>
          <div className="space-y-2">
            {result.surgeStacking.map(s => {
              const riskColor = s.stackingRisk === 'high' ? 'red' : s.stackingRisk === 'medium' ? 'amber' : 'emerald';
              return (
                <div key={s.phase} className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Phase {s.phase}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border bg-${riskColor}-500/15 text-${riskColor}-300 border-${riskColor}-500/30 font-bold`}>{s.stackingRisk.toUpperCase()} RISK</span>
                  </div>
                  <div className="text-xs text-slate-400">Peak surge: <span className="mono text-slate-200">{(s.peakSurge / 1000).toFixed(2)} kW</span></div>
                  <div className="text-[10px] text-slate-500 mt-1">High stacking = multiple motors starting simultaneously</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {result.recommendations.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-200">Engineering Recommendations</h3>
          </div>
          <ul className="space-y-1 text-xs text-amber-100">
            {result.recommendations.map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
        </div>
      )}

      {result.violations.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-red-200">Critical Violations</h3>
          </div>
          <ul className="space-y-1 text-xs text-red-100">
            {result.violations.map((v, i) => <li key={i}>• <strong>{v.loadName}:</strong> {v.reason}</li>)}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/40">
          <h3 className="text-sm font-semibold text-white">Phase Allocation Map ({result.allocations.length} loads)</h3>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs">
            <thead className="bg-slate-900/80 text-slate-400 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Load</th>
                <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Phase</th>
                <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {result.allocations.map(a => (
                <tr key={a.loadId} className="border-t border-slate-800/40">
                  <td className="px-3 py-2 text-white">{a.loadName}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold" style={{ background: COLORS[a.phase] + '30', color: COLORS[a.phase] }}>{a.phase}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-400 text-[10px]">{a.reasoning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, sub, status, color }: any) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0f1424] p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className={`text-2xl font-bold mono text-${color}-300 mt-2`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
      {status && <div className="text-[10px] text-slate-500 mt-1 italic">Status: {status}</div>}
    </div>
  );
}
