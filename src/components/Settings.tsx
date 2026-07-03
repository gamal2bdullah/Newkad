import { useState, useEffect } from 'react';
import { useLoads } from '../context/LoadContext';
import { useLocale } from '../core/i18n/LocaleContext';
import { RotateCcw, Trash2, Database, Save, AlertTriangle, Cpu, BookOpen, Palette, Sun, Moon, Sparkles, Languages, Check, Zap } from 'lucide-react';
import type { ExpertLevel } from '../types';
import { KadLogo } from '../core/brand/KadLogo';
import { GRADIENTS, PALETTE } from '../core/brand/identity';

export function Settings() {
  const { loads, clearAll, loadPreset, projectName, setProjectName, expertLevel, setExpertLevel } = useLoads();
  const { language, setLanguage, theme, setTheme, customAccent, setCustomAccent, t, dir } = useLocale();
  const [name, setName] = useState(projectName);

  useEffect(() => { setName(projectName); }, [projectName]);

  const LEVELS: { v: ExpertLevel; lKey: string; dKey: string; features: string[] }[] = [
    { v: 'Basic',        lKey: 'settings.level1', dKey: 'settings.level1d', features: ['Connected Load', 'Daily Energy', 'Basic Surge'] },
    { v: 'Professional', lKey: 'settings.level2', dKey: 'settings.level2d', features: ['Duty Cycle', 'Demand Factor', 'Day/Night Split', 'Criticality'] },
    { v: 'Commercial',  lKey: 'settings.level3', dKey: 'settings.level3d', features: ['Coincidence/Diversity', 'Phase Balance', 'Verification', 'THD/PF Tracking'] },
    { v: 'Expert',       lKey: 'settings.level4', dKey: 'settings.level4d', features: ['All Load Behavior', 'LRA / Surge Models', 'Harmonic Analysis', 'Custom Hourly Profiles', 'Seasonal Behavior'] },
  ];

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto" dir={dir}>
      {/* Brand banner — KAD Power Energy Gradient */}
      <div
        className="rounded-2xl border p-5 flex items-center gap-4 bg-energy"
        style={{
          background: GRADIENTS.energy,
          borderColor: `${PALETTE.navy400}80`,
          color: '#fff',
          boxShadow: `0 4px 20px ${PALETTE.navy500}40`,
        }}
      >
        <KadLogo size={56} showText textColor="#fff" />
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-widest" style={{ color: PALETTE.green300 }}>{t('brand.tagline')}</div>
        </div>
        <Zap className="w-5 h-5" style={{ color: PALETTE.green400 }} />
      </div>

      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{t('settings.title')}</h2>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('settings.subtitle')}</p>
      </div>

      {/* Project Name */}
      <Section icon={Save} title={t('settings.projectName')}>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none border transition"
            style={{ background: 'var(--bg-2)', color: 'var(--text)', borderColor: 'var(--border)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={() => setProjectName(name)}
            disabled={name === projectName}
            className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition"
            style={{
              background: name === projectName ? 'var(--panel-2)' : 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: name === projectName ? 'var(--text-3)' : '#fff',
              boxShadow: name !== projectName ? '0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent)' : 'none',
            }}
          >
            <Save className="w-3.5 h-3.5" /> {t('common.save')}
          </button>
        </div>
      </Section>

      {/* Language & Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language */}
        <Section icon={Languages} title={t('settings.language')}>
          <div className="grid grid-cols-2 gap-2">
            {(['ar', 'en'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium border-2 flex items-center justify-between transition"
                style={{
                  background: language === lang ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg-2)',
                  borderColor: language === lang ? 'var(--accent)' : 'var(--border)',
                  color: language === lang ? 'var(--accent)' : 'var(--text-2)',
                }}
              >
                <span>{lang === 'ar' ? 'العربية' : 'English'}</span>
                {language === lang && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'var(--text-3)' }}>
            {language === 'ar' ? 'سيتم تحويل اتجاه الواجهة تلقائياً' : 'Interface direction switches automatically'}
          </p>
        </Section>

        {/* Theme */}
        <Section icon={Palette} title={t('settings.theme')}>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: 'light' as const, icon: Sun, label: t('settings.theme.light') },
              { v: 'dark' as const,  icon: Moon, label: t('settings.theme.dark') },
              { v: 'custom' as const, icon: Sparkles, label: t('settings.theme.custom') },
            ]).map(t2 => {
              const Icon = t2.icon;
              return (
                <button
                  key={t2.v}
                  onClick={() => setTheme(t2.v)}
                  className="px-2 py-2.5 rounded-lg text-xs font-medium border-2 flex flex-col items-center gap-1.5 transition"
                  style={{
                    background: theme === t2.v ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg-2)',
                    borderColor: theme === t2.v ? 'var(--accent)' : 'var(--border)',
                    color: theme === t2.v ? 'var(--accent)' : 'var(--text-2)',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {t2.label}
                </button>
              );
            })}
          </div>
          {theme === 'custom' && (
            <div className="mt-3 flex items-center gap-3">
              <input
                type="color"
                value={customAccent}
                onChange={e => setCustomAccent(e.target.value)}
                className="w-12 h-9 rounded cursor-pointer border-0"
              />
              <span className="text-xs font-mono" style={{ color: 'var(--text-2)' }}>{customAccent}</span>
            </div>
          )}
        </Section>
      </div>

      {/* Expert Level */}
      <Section icon={Cpu} title={t('settings.expertLevel')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LEVELS.map(l => (
            <button
              key={l.v}
              onClick={() => setExpertLevel(l.v)}
              className="text-start p-4 rounded-lg border-2 transition"
              style={{
                background: expertLevel === l.v ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-2)',
                borderColor: expertLevel === l.v ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-semibold" style={{ color: expertLevel === l.v ? 'var(--accent)' : 'var(--text)' }}>{l.lKey}</div>
                {expertLevel === l.v && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--accent)', color: '#fff' }}>ACTIVE</span>}
              </div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>{l.dKey}</p>
              <div className="flex flex-wrap gap-1">
                {l.features.map(f => <span key={f} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--panel-2)', color: 'var(--text-2)' }}>{f}</span>)}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Presets */}
      <Section icon={Database} title={t('settings.presets')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => { if (confirm(t('settings.presets.confirmBasic'))) loadPreset('basic'); }}
            className="text-start p-4 rounded-lg border transition"
            style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{t('settings.presets.basic')}</div>
            <div className="text-[10px] mb-2" style={{ color: 'var(--text-3)' }}>10 essential residential loads</div>
            <div className="text-[10px] mono" style={{ color: 'var(--accent)' }}>~ 5 kW connected</div>
          </button>
          <button
            onClick={() => { if (confirm(t('settings.presets.confirmPro'))) loadPreset('professional'); }}
            className="text-start p-4 rounded-lg border transition"
            style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{t('settings.presets.professional')}</div>
            <div className="text-[10px] mb-2" style={{ color: 'var(--text-3)' }}>14 loads · EV, medical, servers</div>
            <div className="text-[10px] mono" style={{ color: 'var(--accent)' }}>~ 12 kW connected</div>
          </button>
          <button
            onClick={() => { if (confirm(t('settings.presets.confirmComm'))) loadPreset('commercial'); }}
            className="text-start p-4 rounded-lg border transition"
            style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{t('settings.presets.commercial')}</div>
            <div className="text-[10px] mb-2" style={{ color: 'var(--text-3)' }}>7 large 3-phase loads</div>
            <div className="text-[10px] mono" style={{ color: 'var(--accent)' }}>~ 75 kW connected</div>
          </button>
        </div>
      </Section>

      {/* Data Management */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-2)', borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)' }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4" style={{ color: 'var(--danger)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>{t('settings.dataMgmt')}</h3>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>{t('settings.destructiveActions')}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
            <div>
              <div className="text-sm" style={{ color: 'var(--text)' }}>{t('settings.clearAll')}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>{t('settings.clearAllSub')} ({loads.length})</div>
            </div>
            <button
              onClick={() => { if (confirm(t('settings.confirmClear'))) clearAll(); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--danger) 25%, transparent)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--danger) 15%, transparent)' )}
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
            <div>
              <div className="text-sm" style={{ color: 'var(--text)' }}>{t('settings.reset')}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>{t('settings.resetSub')}</div>
            </div>
            <button
              onClick={() => { if (confirm(t('settings.confirmReset'))) loadPreset('basic'); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              style={{ background: 'color-mix(in srgb, var(--warning) 15%, transparent)', color: 'var(--warning)', border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> {t('settings.reset')}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-4 text-[10px] leading-relaxed" style={{ background: 'color-mix(in srgb, var(--info) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--info) 25%, transparent)', color: 'var(--text-2)' }}>
        <div className="flex items-start gap-2">
          <BookOpen className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--info)' }} />
          <div>
            <strong style={{ color: 'var(--text)' }}>{t('settings.engStandards')}: </strong>{t('settings.standardsList')}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        {title}
      </h3>
      {children}
    </div>
  );
}
