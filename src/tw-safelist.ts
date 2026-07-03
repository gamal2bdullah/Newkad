// =======================================================================
//  KAD POWER — Tailwind Class Safelist
//
//  IMPORTANT: With Tailwind v4 @theme override in index.css, ALL Tailwind
//  color utilities automatically use KAD Power brand colors. We no longer
//  need extensive safelisting — only the legacy named colors that we
//  still want to keep in the build output.
// =======================================================================

// Most colors are now resolved via @theme in index.css.
// This safelist is now minimal — kept for backwards compatibility
// and to ensure specific dynamic classes are generated.
export const SAFELIST_COLORS: string[] = [
  // KAD Power exact hex classes (used in gradient components)
  'text-[#1A2B6B]', 'text-[#111935]', 'text-[#131E43]', 'text-[#162251]',
  'text-[#99F36C]', 'text-[#85D360]', 'text-[#D4FAC1]',

  // Tailwind navy/green/slate — generated from @theme
  // (kept minimal for charts/recharts which use fill/stroke directly)

  // Status text colors (warnings/errors)
  'text-amber-400', 'text-amber-500', 'text-amber-300',
  'text-red-400', 'text-red-500', 'text-red-300',
  'text-emerald-400', 'text-emerald-500', 'text-emerald-300',
  'text-cyan-400', 'text-cyan-500', 'text-cyan-300',
];

export const SAFELIST_GRADIENTS: string[] = [
  'bg-gradient-to-r', 'bg-gradient-to-l', 'bg-gradient-to-br', 'bg-gradient-to-bl',
  'bg-gradient-to-tl', 'bg-gradient-to-tr',
  // KAD Power gradient stops
  'from-[#1A2B6B]', 'from-[#111935]', 'from-[#99F36C]', 'from-[#85D360]', 'from-[#D4FAC1]',
  'to-[#1A2B6B]', 'to-[#111935]', 'to-[#99F36C]', 'to-[#85D360]', 'to-[#D4FAC1]',
  // Tailwind brand gradient stops (auto-mapped via @theme)
  'from-navy-500', 'from-navy-700', 'from-navy-800', 'from-navy-900',
  'from-green-400', 'from-green-500', 'from-green-600',
  'from-slate-500', 'from-slate-700', 'from-slate-800', 'from-slate-900',
  'to-navy-500', 'to-navy-700', 'to-navy-800', 'to-navy-900',
  'to-green-500', 'to-green-600',
  'to-slate-500', 'to-slate-700', 'to-slate-800', 'to-slate-900',
];
