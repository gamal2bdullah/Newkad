import { useState } from 'react';
import type { ViewKey } from '../App';
import { useLoads, useSummary } from '../context/LoadContext';
import { useLocale } from '../core/i18n/LocaleContext';
import { fmtW, fmtWh } from '../utils/calculations';
import { Languages, Sun, Moon, Sparkles, ChevronDown, Edit3, Check } from 'lucide-react';
import { KadLogoMark } from '../core/brand/KadLogo';

const TITLES: Record<ViewKey, string> = {
  dashboard:   'dashboard',
  inventory:   'inventory',
  schedule:    'schedule',
  analysis:    'analysis',
  phase:       'phase',
  validation:  'validation',
  assumptions: 'assumptions',
  reports:     'reports',
  library:     'library',
  tests:       'tests',
  docs:        'docs',
  settings:    'settings',
};

const LEVELS = [
  { value: 'Basic',        label: 'Basic' },
  { value: 'Professional', label: 'Pro' },
  { value: 'Commercial',  label: 'Comm.' },
  { value: 'Expert',       label: 'Expert' },
] as const;

const SUBTITLES: Record<string, { en: string; ar: string }> = {
  dashboard:   { en: 'Real-time load & demand analysis', ar: 'تحليل الأحمال والطلب في الوقت الفعلي' },
  inventory:   { en: 'Manage all your electrical loads',   ar: 'إدارة جميع الأحمال الكهربائية' },
  schedule:    { en: '75+ column engineering data sheet', ar: 'بطاقة بيانات هندسية بأكثر من 75 عمود' },
  analysis:    { en: 'Profiles, peaks, surges, seasonal', ar: 'منحنيات، ذروة، تيارات اندفاعية، موسمي' },
  phase:       { en: '3-phase distribution optimization', ar: 'تحسين توزيع ثلاثي الأطوار' },
  validation:  { en: '5-severity rules engine', ar: 'محرك قواعد بـ 5 مستويات صرامة' },
  assumptions: { en: 'All engineering policies', ar: 'جميع السياسات الهندسية' },
  reports:     { en: 'Compliance & technical documentation', ar: 'توثيق فني شامل' },
  library:     { en: 'Reference database', ar: 'قاعدة بيانات مرجعية' },
  tests:       { en: 'Self-audit engine', ar: 'محرك تدقيق ذاتي' },
  docs:        { en: 'Architecture & formulas', ar: 'البنية والمعادلات' },
  settings:    { en: 'Configure your solar load project', ar: 'إعداد مشروعك الشمسي' },
};

export function Header({ onToggleSidebar, view }: { onToggleSidebar: () => void; view: ViewKey }) {
  const { expertLevel, setExpertLevel, projectName, setProjectName, loads } = useLoads();
  const summary = useSummary();
  const { language, setLanguage, theme, setTheme, t } = useLocale();
  const [editingName, setEditingName] = useState(false);
  const [showLevelMenu, setShowLevelMenu] = useState(false);

  const titleKey = TITLES[view];
  const sub = SUBTITLES[titleKey];
  const subs = language === 'ar' ? sub.ar : sub.en;

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('custom');
    else setTheme('light');
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Sparkles;

  return (
    <header
      className="h-16 shrink-0 border-b backdrop-blur-md flex items-center px-4 gap-4 z-30 transition-theme"
      style={{ background: 'color-mix(in srgb, var(--bg-2) 80%, transparent)', borderColor: 'var(--border)' }}
    >
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 rounded-lg transition"
        style={{ color: 'var(--text-2)' }}
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {/* Logo (mobile only) */}
      <div className="lg:hidden">
        <KadLogoMark size={32} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {editingName ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                className="px-2 py-0.5 rounded text-sm font-semibold outline-none border"
                style={{ background: 'var(--bg-2)', color: 'var(--text)', borderColor: 'var(--accent)' }}
              />
              <button onClick={() => setEditingName(false)} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--success)' }}>
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h1
              onClick={() => setEditingName(true)}
              className="text-sm font-semibold tracking-tight cursor-text truncate flex items-center gap-1.5"
              style={{ color: 'var(--text)' }}
              title={t('header.editName')}
            >
              {projectName}
              <Edit3 className="w-3 h-3 opacity-40" />
            </h1>
          )}
          <span
            className="px-1.5 py-0.5 text-[10px] rounded border font-mono flex items-center gap-1"
            style={{
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              color: 'var(--accent)',
              borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
            {t('header.live')}
          </span>
        </div>
        <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
          {t(`nav.${titleKey}`)} · {subs}
        </div>
      </div>

      {/* Quick KPIs */}
      <div className="hidden md:flex items-center gap-3 px-3 border-l" style={{ borderColor: 'var(--border)' }}>
        <KPI label={t('header.connected')} value={fmtW(summary.totalConnectedLoadW, 1)} color="accent" />
        <KPI label={t('header.demand')} value={fmtW(summary.maximumDemandW, 1)} color="amber" />
        <KPI label={t('header.daily')} value={fmtWh(summary.totalDailyEnergyWh, 1)} color="emerald" />
        <KPI label={t('header.annual')} value={fmtWh(summary.annualEnergyKWh * 1000, 0)} color="blue" />
        <KPI label={t('header.loads')} value={loads.length.toString()} color="purple" />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        {/* Language switcher */}
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border"
          style={{
            background: 'var(--bg-2)', color: 'var(--text-2)', borderColor: 'var(--border)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--panel-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-2)')}
          title={t('header.toggleLang')}
        >
          <Languages className="w-3.5 h-3.5" />
          <span className="font-mono">{language === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        {/* Theme switcher */}
        <button
          onClick={cycleTheme}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border"
          style={{
            background: 'var(--bg-2)', color: 'var(--text-2)', borderColor: 'var(--border)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--panel-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-2)')}
          title={t('header.toggleTheme')}
        >
          <ThemeIcon className="w-3.5 h-3.5" />
        </button>

        {/* Expert level dropdown */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setShowLevelMenu(s => !s)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: '#fff',
              boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent)',
            }}
          >
            {expertLevel}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showLevelMenu && (
            <div
              className="absolute end-0 mt-1 w-44 rounded-lg border shadow-xl z-50 overflow-hidden"
              style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
            >
              {LEVELS.map(l => (
                <button
                  key={l.value}
                  onClick={() => { setExpertLevel(l.value as any); setShowLevelMenu(false); }}
                  className="w-full px-3 py-2 text-xs text-start flex items-center justify-between transition"
                  style={{
                    background: expertLevel === l.value ? 'var(--panel-2)' : 'transparent',
                    color: expertLevel === l.value ? 'var(--accent)' : 'var(--text-2)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--panel-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = expertLevel === l.value ? 'var(--panel-2)' : 'transparent')}
                >
                  <span className="font-semibold">{l.label}</span>
                  {expertLevel === l.value && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function KPI({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    accent: 'var(--accent)',
    amber: 'var(--accent-2)',
    emerald: 'var(--success)',
    blue: 'var(--info)',
    purple: 'var(--accent-2)',
  };
  return (
    <div className="text-end">
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{label}</div>
      <div className="text-sm font-bold mono" style={{ color: colorMap[color] }}>{value}</div>
    </div>
  );
}
