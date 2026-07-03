import { LayoutDashboard, ListChecks, Table2, BarChart3, FileText, Library, Settings as SettingsIcon, ChevronLeft, ChevronRight, BookOpen, ShieldCheck, GitBranch, TestTube, FileCode, Sun, Moon, Sparkles } from 'lucide-react';
import type { ViewKey } from '../App';
import { useLocale } from '../core/i18n/LocaleContext';
import { KadLogo, KadLogoMark } from '../core/brand/KadLogo';

interface SidebarProps {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  open: boolean;
  setOpen: (b: boolean | ((p: boolean) => boolean)) => void;
}

const NAV_ITEMS: { key: ViewKey; labelKey: string; descKey: string; icon: any }[] = [
  { key: 'dashboard',   labelKey: 'nav.dashboard',   descKey: 'nav.dashboard.desc',   icon: LayoutDashboard },
  { key: 'inventory',   labelKey: 'nav.inventory',   descKey: 'nav.inventory.desc',   icon: ListChecks },
  { key: 'schedule',    labelKey: 'nav.schedule',    descKey: 'nav.schedule.desc',    icon: Table2 },
  { key: 'analysis',    labelKey: 'nav.analysis',    descKey: 'nav.analysis.desc',    icon: BarChart3 },
  { key: 'phase',       labelKey: 'nav.phase',       descKey: 'nav.phase.desc',       icon: GitBranch },
  { key: 'validation',  labelKey: 'nav.validation',  descKey: 'nav.validation.desc',  icon: ShieldCheck },
  { key: 'assumptions', labelKey: 'nav.assumptions', descKey: 'nav.assumptions.desc', icon: BookOpen },
  { key: 'reports',     labelKey: 'nav.reports',     descKey: 'nav.reports.desc',     icon: FileText },
  { key: 'library',     labelKey: 'nav.library',     descKey: 'nav.library.desc',     icon: Library },
  { key: 'tests',       labelKey: 'nav.tests',       descKey: 'nav.tests.desc',       icon: TestTube },
  { key: 'docs',        labelKey: 'nav.docs',        descKey: 'nav.docs.desc',        icon: FileCode },
  { key: 'settings',    labelKey: 'nav.settings',    descKey: 'nav.settings.desc',    icon: SettingsIcon },
];

export function Sidebar({ view, setView, open, setOpen }: SidebarProps) {
  const { t, theme, setTheme, dir } = useLocale();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('custom');
    else setTheme('light');
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Sparkles;

  return (
    <aside
      className={`${open ? 'w-64' : 'w-16'} transition-all duration-300 shrink-0 border-s flex flex-col`}
      style={{
        background: 'var(--panel)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
    >
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-4 border-b" style={{ borderColor: 'var(--border)' }}>
        {open ? (
          <KadLogo size={36} showText variant="full" />
        ) : (
          <KadLogoMark size={36} />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              aria-label={t(item.labelKey)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group ${
                active
                  ? 'border'
                  : ''
              }`}
              style={{
                background: active
                  ? `linear-gradient(${dir === 'rtl' ? 'to left' : 'to right'}, color-mix(in srgb, var(--accent) 18%, transparent), color-mix(in srgb, var(--accent-2) 6%, transparent))`
                  : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-2)',
                borderColor: active ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--panel-2)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {active && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                  style={{
                    [dir === 'rtl' ? 'right' : 'left']: 0,
                    background: 'linear-gradient(180deg, var(--accent), var(--accent-2))',
                    boxShadow: '0 0 8px color-mix(in srgb, var(--accent) 60%, transparent)',
                  }}
                />
              )}
              <Icon className="w-4 h-4 shrink-0" style={active ? { color: 'var(--accent)' } : undefined} />
              {open && (
                <div className="flex-1 text-start overflow-hidden">
                  <div className="text-sm font-semibold whitespace-nowrap">{t(item.labelKey)}</div>
                  <div className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-3)' }}>{t(item.descKey)}</div>
                </div>
              )}
              {!open && (
                <div
                  className="absolute left-full ml-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border"
                  style={{ background: 'var(--panel)', color: 'var(--text)', borderColor: 'var(--border)' }}
                >
                  {t(item.labelKey)}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={cycleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition"
          style={{ color: 'var(--text-2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--panel-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Toggle theme"
          title={t('header.toggleTheme')}
        >
          <ThemeIcon className="w-4 h-4" />
          {open && <span className="text-xs font-medium">{t(`header.theme.${theme}`)}</span>}
        </button>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition"
          style={{ color: 'var(--text-2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--panel-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Toggle sidebar"
        >
          {open ? <ChevronLeft className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} /> : <ChevronRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />}
          {open && <span className="text-xs font-medium">{t('common.collapse')}</span>}
        </button>
        {open && (
          <div className="mt-2 px-3 py-2 text-[10px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
            {t('brand.tagline')}
          </div>
        )}
      </div>
    </aside>
  );
}
