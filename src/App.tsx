import { useState } from 'react';
import { LoadProvider } from './context/LoadContext';
import { LocaleProvider, useLocale } from './core/i18n/LocaleContext';
import { SAFELIST_COLORS, SAFELIST_GRADIENTS } from './tw-safelist';
void SAFELIST_COLORS; void SAFELIST_GRADIENTS;
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LoadInventory } from './components/LoadInventory';
import { LoadSchedule } from './components/LoadSchedule';
import { Analysis } from './components/Analysis';
import { Reports } from './components/Reports';
import { ApplianceLibrary } from './components/ApplianceLibrary';
import { Settings } from './components/Settings';
import { AssumptionsViewer } from './components/AssumptionsViewer';
import { ValidationReport, PhaseBalanceReport } from './components/ValidationReport';
import { TestRunner } from './components/TestRunner';
import { Documentation } from './components/Documentation';

export type ViewKey = 'dashboard' | 'inventory' | 'schedule' | 'analysis' | 'reports' | 'library' | 'settings' | 'assumptions' | 'validation' | 'phase' | 'tests' | 'docs';

function AppShell() {
  const { dir } = useLocale();
  const [view, setView] = useState<ViewKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // RTL-aware horizontal layout: in RTL, sidebar should be on the right
  const isRTL = dir === 'rtl';

  return (
    <div
      dir={dir}
      className="flex h-screen overflow-hidden transition-theme"
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }}
    >
      <Sidebar view={view} setView={setView} open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(o => !o)} view={view} />
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
          {view === 'dashboard' && <Dashboard onNavigate={setView} />}
          {view === 'inventory' && <LoadInventory />}
          {view === 'schedule' && <LoadSchedule />}
          {view === 'analysis' && <Analysis />}
          {view === 'reports' && <Reports />}
          {view === 'library' && <ApplianceLibrary />}
          {view === 'settings' && <Settings />}
          {view === 'assumptions' && <AssumptionsViewer />}
          {view === 'validation' && <ValidationReport />}
          {view === 'phase' && <PhaseBalanceReport />}
          {view === 'tests' && <TestRunner />}
          {view === 'docs' && <Documentation />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <LoadProvider>
        <AppShell />
      </LoadProvider>
    </LocaleProvider>
  );
}
