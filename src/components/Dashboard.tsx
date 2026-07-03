import { useLoads, useSummary, useLoadMetrics } from '../context/LoadContext';
import { useLocale } from '../core/i18n/LocaleContext';
import { fmtW, fmtWh, fmtA, fmtKVA, fmtPct } from '../utils/calculations';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Zap, Sun, AlertTriangle, Activity, ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import type { ViewKey } from '../App';
import { KadLogo } from '../core/brand/KadLogo';
import { PALETTE } from '../core/brand/identity';

export function Dashboard({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const { loads, projectName, expertLevel } = useLoads();
  const summary = useSummary();
  const metrics = useLoadMetrics();
  const { language, t, dir } = useLocale();

  const hourlyData = summary.hourlyProfile.map((v, i) => ({
    hour: `${i}:00`,
    power: Math.round(v / 1000 * 10) / 10,
    day: i >= 8 && i < 18 ? Math.round(v / 1000 * 10) / 10 : 0,
    night: (i < 8 || i >= 18) ? Math.round(v / 1000 * 10) / 10 : 0,
  }));

  const peakHour = summary.hourlyProfile.indexOf(Math.max(...summary.hourlyProfile));
  const peakPower = Math.max(...summary.hourlyProfile) / 1000;

  const highSurge = metrics.filter(m => m.surge > 2000).slice(0, 5);
  const critical = loads.filter(l => l.criticality === 'Critical').length;
  const phantomLoads = loads.filter(l => l.phantomLoadW > 0).length;

  const isRTL = dir === 'rtl';
  const ArrowNext = isRTL ? ChevronLeft : ArrowRight;

  return (
    <div className="p-6 space-y-6 max-w-[1800px] mx-auto" dir={dir}>
      {/* Hero Banner — KAD Power Energy Gradient (Navy 500 → Solar Green 500) */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6"
        style={{
          background: `linear-gradient(135deg, ${PALETTE.navy500} 0%, ${PALETTE.navy500} 40%, ${PALETTE.green500} 100%)`,
          borderColor: `${PALETTE.navy400}80`,
          color: '#fff',
          boxShadow: `0 8px 32px ${PALETTE.navy500}40, 0 0 60px ${PALETTE.green500}20`,
        }}
      >
        {/* Engineering blueprint grid (Navy-tempered, subtle) */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Decorative orbs (Solar Green glow) */}
        <div
          className="absolute -end-20 -top-20 w-96 h-96 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: PALETTE.green500 }}
        />
        <div
          className="absolute -start-20 -bottom-20 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: PALETTE.navy300 }}
        />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium mb-2" style={{ color: PALETTE.green300 }}>
              <Zap className="w-3.5 h-3.5" />
              <span>{t('brand.name')} · {expertLevel} {language === 'ar' ? 'وضع' : 'Mode'}</span>
            </div>
            <div className="mb-3">
              <KadLogo size={48} showText textColor="#fff" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#fff' }}>{projectName}</h1>
            <p className="mt-2 text-sm max-w-2xl" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {t('brand.description')}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => onNavigate('inventory')}
                className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
                style={{
                  background: PALETTE.navy900,
                  color: '#fff',
                  boxShadow: `0 4px 14px ${PALETTE.navy900}80`,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = PALETTE.navy800)}
                onMouseLeave={e => (e.currentTarget.style.background = PALETTE.navy900)}
              >
                <Zap className="w-4 h-4" /> {t('dashboard.addLoads')}
                <ArrowNext className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('analysis')}
                className="px-4 py-2 rounded-lg text-sm font-medium transition border"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              >
                {t('dashboard.viewAnalysis')}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:w-96">
            <BigMetric label={t('dashboard.connected')} value={fmtW(summary.totalConnectedLoadW, 1)} color={PALETTE.green300} />
            <BigMetric label={t('dashboard.demand')} value={fmtW(summary.maximumDemandW, 1)} color={PALETTE.green200} />
            <BigMetric label={t('dashboard.daily')} value={fmtWh(summary.totalDailyEnergyWh, 1)} color="#FFFFFF" />
            <BigMetric label={t('dashboard.annual')} value={fmtWh(summary.annualEnergyKWh * 1000, 0)} color={PALETTE.slate100} />
            <BigMetric label={t('dashboard.peakKva')} value={fmtKVA(summary.peakDemandKVA)} color={PALETTE.green400} />
            <BigMetric label={t('dashboard.maxSurge')} value={fmtW(summary.maximumSurgeKW * 1000, 0)} color={PALETTE.navy200} />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI label={t('dashboard.demand')} value={fmtW(summary.peakDemandKW * 1000, 1)} color="orange" />
        <KPI label={t('dashboard.peakKva')} value={fmtKVA(summary.peakDemandKVA)} color="amber" />
        <KPI label={t('dashboard.maxCurrent')} value={fmtA(summary.estimatedMaxCurrentA)} color="red" />
        <KPI label={t('dashboard.maxSurge')} value={fmtW(summary.maximumSurgeKW * 1000, 0)} color="pink" />
        <KPI label={t('dashboard.loadFactor')} value={fmtPct(summary.loadFactor)} color="cyan" />
        <KPI label={t('header.loads')} value={loads.length.toString()} color="purple" sub={`${critical} ${t('dashboard.critical')}`} />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t('dashboard.profile24')}</h3>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('dashboard.peakAt')} {peakPower.toFixed(2)} kW {t('dashboard.atHour')} {peakHour}:00</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="gradAccent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-2)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" stroke="var(--text-3)" fontSize={10} tickLine={false} axisLine={false} interval={2} />
              <YAxis stroke="var(--text-3)" fontSize={10} tickLine={false} axisLine={false} unit=" kW" />
              <Tooltip
                contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                labelStyle={{ color: 'var(--text-2)' }}
                formatter={(v: any) => `${v.toFixed(2)} kW`}
              />
              <Area type="monotone" dataKey="power" stroke="var(--accent)" strokeWidth={2.5} fill="url(#gradAccent)" />
              <Area type="monotone" dataKey="day" stackId="a" stroke="var(--accent-2)" fill="url(#gradAmber)" />
              <Area type="monotone" dataKey="night" stackId="a" stroke="var(--info)" fill="url(#gradAmber)" fillOpacity={0.05} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('dashboard.distribution')}</h3>
          {summary.byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={summary.byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {summary.byCategory.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} formatter={(v: any) => fmtWh(v as number, 1)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: 'var(--text-2)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm" style={{ color: 'var(--text-3)' }}>{t('dashboard.noData')}</div>
          )}
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-xl border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4" style={{ color: 'var(--accent-2)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t('dashboard.dayNight')}</h3>
          </div>
          <div className="space-y-3">
            <BarRow label={t('dashboard.dayEnergy')} value={summary.dayEnergyWh} total={summary.totalDailyEnergyWh} colorFrom="var(--accent-2)" colorTo="var(--accent)" />
            <BarRow label={t('dashboard.nightEnergy')} value={summary.nightEnergyWh} total={summary.totalDailyEnergyWh} colorFrom="var(--info)" colorTo="var(--accent-2)" />
            <BarRow label={t('dashboard.critical')} value={summary.criticalLoadWh} total={summary.totalDailyEnergyWh} colorFrom="var(--danger)" colorTo="var(--accent)" />
            <BarRow label={t('dashboard.deferrable')} value={summary.deferrableLoadWh} total={summary.totalDailyEnergyWh} colorFrom="var(--success)" colorTo="var(--info)" />
            <BarRow label={t('dashboard.phantom')} value={summary.phantomLossWh} total={summary.totalDailyEnergyWh} colorFrom="var(--accent)" colorTo="var(--accent-2)" />
          </div>
        </div>

        <div className="rounded-xl border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t('dashboard.engineeringInsights')}</h3>
          </div>
          <div className="space-y-2.5">
            <Insight
              ok={summary.peakDemandKW < 50}
              text={summary.peakDemandKW < 50 ? t('dashboard.peakAt') + ' ' + summary.peakDemandKW.toFixed(1) + ' kW · ' + t('dashboard.healthyUtilization') : summary.peakDemandKW.toFixed(1) + ' kW'}
              sub={`${summary.peakDemandKW.toFixed(2)} ${t('dashboard.kwPeak')}`}
            />
            <Insight
              ok={summary.maximumSurgeKW < summary.peakDemandKW * 8}
              text={summary.maximumSurgeKW < summary.peakDemandKW * 8 ? t('dashboard.healthyL') : t('dashboard.highInrush')}
              sub={`${summary.maximumSurgeKW.toFixed(1)} ${t('dashboard.kwMaxSurge')}`}
            />
            <Insight
              ok={summary.loadFactor > 25}
              text={summary.loadFactor > 25 ? t('dashboard.healthyLf') : t('dashboard.lowLf')}
              sub={`${summary.loadFactor.toFixed(1)}% ${t('dashboard.loadFactorPct')}`}
            />
            <Insight
              ok={phantomLoads < 6}
              text={phantomLoads === 0 ? t('dashboard.noPhantom') : `${phantomLoads} ${t('dashboard.phantomWasted')}`}
              sub={t('dashboard.standbyCheck')}
            />
            <Insight
              ok={highSurge.length < 4}
              text={highSurge.length === 0 ? t('dashboard.noSurge') : `${highSurge.length} ${t('dashboard.softStart')}`}
              sub={t('dashboard.motorStart')}
            />
          </div>
        </div>

        <div className="rounded-xl border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('dashboard.topLoads')}</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {metrics.length === 0 ? (
              <div className="text-xs text-center py-4" style={{ color: 'var(--text-3)' }}>{t('dashboard.addMoreLoads')}</div>
            ) : [...metrics].sort((a, b) => b.daily - a.daily).slice(0, 8).map(m => (
              <div key={m.load.id} className="flex items-center gap-3 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ color: 'var(--text)' }}>{m.load.loadName || m.load.arabicName || (language === 'ar' ? '(بدون اسم)' : '(unnamed)')}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>{m.load.categoryMain} · ×{m.load.quantity}</div>
                </div>
                <div className="text-end shrink-0">
                  <div className="font-mono font-semibold" style={{ color: 'var(--accent)' }}>{fmtWh(m.daily, 0)}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>{fmtW(m.connected, 0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <StageCard num="01" title={t('dashboard.connectedLoad')} value={fmtW(summary.totalConnectedLoadW, 1)} sub={t('dashboard.connectedLoadSub')} />
        <StageCard num="02" title={t('dashboard.demand')} value={fmtW(summary.maximumDemandW, 1)} sub={t('dashboard.maxDemandSub')} />
        <StageCard num="03" title={t('dashboard.daily')} value={fmtWh(summary.totalDailyEnergyWh, 1)} sub={t('dashboard.dailyCons')} />
        <StageCard num="04" title={t('dashboard.annual')} value={fmtWh(summary.annualEnergyKWh * 1000, 0)} sub={t('dashboard.yearlyCons')} />
      </div>
    </div>
  );
}

function BigMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-lg p-3 border"
      style={{
        background: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</div>
      <div className="text-lg font-bold mono mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

function KPI({ label, value, sub, color }: { label: string; value: string; sub?: string; color: 'orange' | 'amber' | 'red' | 'pink' | 'cyan' | 'purple' }) {
  const colorMap = {
    orange: 'var(--accent)', amber: 'var(--accent-2)', red: 'var(--danger)', pink: 'var(--danger)', cyan: 'var(--info)', purple: 'var(--accent-2)',
  };
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-3)' }}>{label}</span>
      </div>
      <div className="text-xl font-bold mono mt-2" style={{ color: colorMap[color] }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</div>}
    </div>
  );
}

function BarRow({ label, value, total, colorFrom, colorTo }: { label: string; value: number; total: number; colorFrom: string; colorTo: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span style={{ color: 'var(--text-2)' }}>{label}</span>
        <span className="font-mono" style={{ color: 'var(--text-3)' }}>{fmtWh(value, 1)} <span style={{ color: 'var(--text-3)' }}>({pct.toFixed(0)}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: `linear-gradient(to right, ${colorFrom}, ${colorTo})` }} />
      </div>
    </div>
  );
}

function Insight({ ok, text, sub }: { ok: boolean; text: string; sub: string }) {
  return (
    <div className="flex items-start gap-2.5 p-2 rounded-lg border" style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--success)' }} /> : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--warning)' }} />}
      <div className="min-w-0">
        <div className="text-xs leading-snug" style={{ color: 'var(--text)' }}>{text}</div>
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</div>
      </div>
    </div>
  );
}

function StageCard({ num, title, value, sub }: { num: string; title: string; value: string; sub: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border p-4" style={{ background: 'linear-gradient(135deg, var(--panel), var(--bg-2))', borderColor: 'var(--border)' }}>
      <div className="absolute end-2 top-2 text-5xl font-black leading-none" style={{ color: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>{num}</div>
      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--accent)' }}>Stage {num}</div>
      <div className="text-sm font-semibold mt-1" style={{ color: 'var(--text)' }}>{title}</div>
      <div className="text-2xl font-bold mono mt-2" style={{ color: 'var(--accent-2)' }}>{value}</div>
      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</div>
    </div>
  );
}
