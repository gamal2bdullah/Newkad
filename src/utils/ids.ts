// =======================================================================
//  KAD POWER — Stable ID Generator
//  Predictable, sequential IDs (LD-0001, LD-0002, ...) — not random UUIDs
//  This prevents re-render churn and makes IDs audit-friendly.
// =======================================================================

let _counter = 0;
let _hydrated = false;

export function nextLoadId(): string {
  if (!_hydrated) {
    try {
      const stored = localStorage.getItem('kad-load-counter');
      if (stored) _counter = parseInt(stored, 10) || 0;
    } catch {}
    _hydrated = true;
  }
  _counter += 1;
  try { localStorage.setItem('kad-load-counter', _counter.toString()); } catch {}
  return `LD-${String(_counter).padStart(4, '0')}`;
}

export function nextTag(categorySub: string, distributionBoard: string, idx: number): string {
  const cat = (categorySub || 'GEN').toUpperCase().replace(/\s+/g, '-').slice(0, 6);
  const db = (distributionBoard || 'DB').toUpperCase().replace(/\s+/g, '').slice(0, 4);
  return `${cat}-${db}-${String(idx).padStart(2, '0')}`;
}

export function resetLoadCounter(v: number = 0) {
  _counter = v;
  try { localStorage.setItem('kad-load-counter', v.toString()); } catch {}
}

export function getLoadCounter(): number {
  if (!_hydrated) {
    try {
      const stored = localStorage.getItem('kad-load-counter');
      if (stored) _counter = parseInt(stored, 10) || 0;
    } catch {}
    _hydrated = true;
  }
  return _counter;
}
