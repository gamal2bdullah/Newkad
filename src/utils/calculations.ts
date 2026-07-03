// =======================================================================
//  Professional Load Engine — Engineering Calculations
//  All formulas follow NEC/IEC industry practice for solar load analysis.
//
//  CALCULATION ORDER (mandatory, by engineering convention):
//    1. connected      = ratedPowerW × quantity
//    2. running        = runningPowerW × quantity
//    3. demand         = connected × Ku
//    4. coincident     = demand × CF
//    5. diversified    = coincident / diversity
//    6. apparent (kVA) = connected / (PF × 1000)
//    7. reactive(kVAR) = √(kVA² − kW²)
//    8. current (A)    = connected / (V × PF)  [or √3 × V × PF for 3Ø]
//    9. surgePower     = ratedPowerW × surge× × quantity
//   10. daily energy   = running × Ku × duty × DF × hours × (days/7)
//   11. annual energy  = (summer × 183 + winter × 182) / 365 × days
//   12. peak (kW)      = max(hourly operating profile)
//   13. peak (kVA)     = peak_kW / PF_system
//   14. load factor    = (daily / 24) / peak × 100
// =======================================================================

import type { Load, SummaryMetrics } from '../types';

const COLORS = ['#f59e0b', '#ff6a00', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#ef4444', '#22c55e', '#a855f7', '#14b8a6', '#f97316', '#84cc16'];

const PF_SYSTEM_DEFAULT = 0.85;   // System-wide PF assumption for peak kVA derivation
const V_SYSTEM_DEFAULT = 220;     // Default system voltage for current calculations

// =================== IDENTITY ===================
export const calcConnectedLoad = (load: Load): number =>
  Math.max(0, (load.ratedPowerW || 0)) * Math.max(0, (load.quantity || 0));

export const calcRunningLoad = (load: Load): number =>
  Math.max(0, (load.runningPowerW || load.ratedPowerW || 0)) * Math.max(0, (load.quantity || 0));

// =================== DEMAND CHAIN ===================
// demand: applied to CONNECTED (nameplate-based, used for capacity sizing)
export const calcDemandLoad = (load: Load): number =>
  calcConnectedLoad(load) * clamp(load.utilizationFactorKu, 0, 1);

// coincident: applied to demand (probability of running simultaneously with peak of group)
export const calcCoincidentLoad = (load: Load): number =>
  calcDemandLoad(load) * clamp(load.coincidenceFactor ?? 0.7, 0, 1);

// diversified: divided by diversity (1/diversity because diversity > 1 means less than worst case)
export const calcDiversifiedLoad = (load: Load): number =>
  calcCoincidentLoad(load) / Math.max(1, load.diversityFactor ?? 1.2);

// =================== POWER ===================
// Apparent: standard kVA = kW / PF  →  kVA = (W × Qty) / (PF × 1000)
export const calcApparentPower = (load: Load): number => {
  const connected = calcConnectedLoad(load);
  const pf = Math.max(0.1, load.powerFactor || 0.9);
  return connected / (pf * 1000);
};

// Reactive: derived from apparent and active
export const calcReactivePower = (load: Load): number => {
  const connected = calcConnectedLoad(load);
  const pf = Math.max(0.1, load.powerFactor || 0.9);
  const kw = connected / 1000;
  const kva = kw / pf;
  return Math.sqrt(Math.max(0, kva * kva - kw * kw));
};

// Full-Load Current: 1Ø I = P/(V·PF), 3Ø I = P/(√3·V·PF)
export const calcFullLoadCurrent = (load: Load): number => {
  const connected = calcConnectedLoad(load);
  const pf = Math.max(0.1, load.powerFactor || 0.9);
  const v = Math.max(1, load.voltageNominal || 220);
  if (load.phaseType === '3Ø') {
    return connected / (Math.sqrt(3) * v * pf);
  }
  return connected / (v * pf);
};

// =================== SURGE ===================
// surge = ratedPowerW × surge× × quantity  (nameplate-based worst case)
export const calcSurgePower = (load: Load): number =>
  Math.max(0, load.ratedPowerW || 0) * Math.max(1, load.surgeMultiplier || 1) * Math.max(0, load.quantity || 0);

// Locked-Rotor Current: prefer user-supplied LRA; else derive = FLC × surgeMultiplier × quantity
// FLC already includes quantity. To avoid double-multiply: I_lrc = I_flc_per_unit × surgeMult × quantity
export const calcLockedRotorCurrent = (load: Load): number => {
  const qty = Math.max(0, load.quantity || 0);
  if ((load.lockedRotorCurrentA || 0) > 0) {
    return load.lockedRotorCurrentA * qty;
  }
  const v = Math.max(1, load.voltageNominal || 220);
  const pf = Math.max(0.1, load.powerFactor || 0.9);
  const perUnitFLC = load.phaseType === '3Ø'
    ? (load.ratedPowerW || 0) / (Math.sqrt(3) * v * pf)
    : (load.ratedPowerW || 0) / (v * pf);
  return perUnitFLC * Math.max(1, load.surgeMultiplier || 1) * qty;
};

// =================== ENERGY ===================
// Daily = running × Ku × duty% × DF × hours × (days/7)
// Returns the energy for a single day (averaged across operating days per week)
export const calcDailyEnergy = (load: Load, season: 'summer' | 'winter' = 'summer'): number => {
  const running = calcRunningLoad(load);
  const ku = clamp(load.utilizationFactorKu, 0, 1);
  const duty = clamp(load.dutyCyclePercent, 0, 100) / 100;
  const demand = clamp(load.demandFactor, 0, 1);
  const dayHours = season === 'summer' ? Math.max(0, load.dayHoursSummer || 0) : Math.max(0, load.dayHoursWinter || 0);
  const nightHours = season === 'summer' ? Math.max(0, load.nightHoursSummer || 0) : Math.max(0, load.nightHoursWinter || 0);
  const daysRatio = clamp(load.operatingDaysPerWeek, 0, 7) / 7;
  return running * ku * duty * demand * (dayHours + nightHours) * daysRatio;
};

export const calcDayEnergy = (load: Load, season: 'summer' | 'winter' = 'summer'): number => {
  const running = calcRunningLoad(load);
  const ku = clamp(load.utilizationFactorKu, 0, 1);
  const duty = clamp(load.dutyCyclePercent, 0, 100) / 100;
  const demand = clamp(load.demandFactor, 0, 1);
  const dayHours = season === 'summer' ? Math.max(0, load.dayHoursSummer || 0) : Math.max(0, load.dayHoursWinter || 0);
  const daysRatio = clamp(load.operatingDaysPerWeek, 0, 7) / 7;
  return running * ku * duty * demand * dayHours * daysRatio;
};

export const calcNightEnergy = (load: Load, season: 'summer' | 'winter' = 'summer'): number => {
  const running = calcRunningLoad(load);
  const ku = clamp(load.utilizationFactorKu, 0, 1);
  const duty = clamp(load.dutyCyclePercent, 0, 100) / 100;
  const demand = clamp(load.demandFactor, 0, 1);
  const nightHours = season === 'summer' ? Math.max(0, load.nightHoursSummer || 0) : Math.max(0, load.nightHoursWinter || 0);
  const daysRatio = clamp(load.operatingDaysPerWeek, 0, 7) / 7;
  return running * ku * duty * demand * nightHours * daysRatio;
};

// Annual = avg of summer/winter daily × operatingDaysPerYear
// (summer ~ 183 days, winter ~ 182 days; daysRatio normalized via operatingDaysPerYear/365)
export const calcAnnualEnergy = (load: Load): number => {
  const summerDaily = calcDailyEnergy(load, 'summer');
  const winterDaily = calcDailyEnergy(load, 'winter');
  const weightedDaily = (summerDaily * 183 + winterDaily * 182) / 365;
  return weightedDaily * Math.max(0, Math.min(365, load.operatingDaysPerYear || 365));
};

// =================== HOURLY PROFILE ===================
// Distributes daily energy across 24 hours using hourlyProfile (or default for type)
// Each hour: (running × Ku × duty × profile[h] / Σprofile) × totalHours
export const calcHourlyOperatingLoad = (load: Load): number[] => {
  const running = calcRunningLoad(load);
  const ku = clamp(load.utilizationFactorKu, 0, 1);
  const duty = clamp(load.dutyCyclePercent, 0, 100) / 100;
  const totalHours = Math.max(0, load.dayHoursSummer || 0) + Math.max(0, load.nightHoursSummer || 0);
  if (totalHours === 0) return Array(24).fill(0);

  const profile = (load.hourlyProfile && load.hourlyProfile.length === 24)
    ? load.hourlyProfile
    : defaultProfileForType(load.timeProfileType);

  const profileSum = profile.reduce((s, v) => s + Math.max(0, v), 0);
  if (profileSum === 0) return Array(24).fill(0);

  return profile.map(v => (running * ku * duty * Math.max(0, v)) / profileSum * totalHours);
};

const defaultProfileForType = (type: string): number[] => {
  switch (type) {
    case 'Morning Peak': return [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    case 'Noon Peak': return [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0];
    case 'Evening Peak': return [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0];
    case 'Night Load': return [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1];
    case '24/7':
    case 'Base Load': return Array(24).fill(1);
    case 'Day Load':
    default: return [0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0];
  }
};

// =================== SUMMARY ===================
export function computeSummary(loads: Load[]): SummaryMetrics {
  if (loads.length === 0) {
    return emptySummary();
  }

  // 1) Per-load aggregation
  const totalConnected = loads.reduce((s, l) => s + calcConnectedLoad(l), 0);
  const totalRunning = loads.reduce((s, l) => s + calcRunningLoad(l), 0);
  const coincidentPeak = loads.reduce((s, l) => s + calcCoincidentLoad(l), 0);
  const diversified = loads.reduce((s, l) => s + calcDiversifiedLoad(l), 0);
  const maxSurge = loads.reduce((s, l) => s + calcSurgePower(l), 0);

  // 2) Aggregate hourly profile (W)
  const hourlyProfile = Array(24).fill(0);
  loads.forEach(l => {
    calcHourlyOperatingLoad(l).forEach((v, i) => { hourlyProfile[i] += v; });
  });

  // 3) Peak demand = max hourly operating power (already accounts for Ku × duty × DF)
  const maxHourly = Math.max(0, ...hourlyProfile);
  const maximumDemand = maxHourly;

  // 4) Energy totals from the actual hourly profile (most accurate — not approximated)
  const totalDaily = hourlyProfile.reduce((s, v) => s + v, 0);
  // Day = 8..18 (10h) — daytime window; Night = remaining 14h
  const dayEnergy = hourlyProfile.slice(8, 18).reduce((s, v) => s + v, 0);
  const nightEnergy = Math.max(0, totalDaily - dayEnergy);

  // 5) Peak kW / kVA — use system-level PF assumption (0.85) for kVA derivation
  const peakKW = maximumDemand / 1000;
  const peakKVA = peakKW / PF_SYSTEM_DEFAULT;

  // 6) Max current = (peakKVA × 1000) / (V × PF_sys × √3) if 3Ø present, else (V × PF_sys)
  //    Use the dominant phase type (prefer 3Ø if any 3Ø load exists, since the system likely has a 3Ø feed)
  const has3Phase = loads.some(l => l.phaseType === '3Ø');
  const v = V_SYSTEM_DEFAULT;
  const denominator = has3Phase ? (Math.sqrt(3) * v * PF_SYSTEM_DEFAULT) : (v * PF_SYSTEM_DEFAULT);
  const maxCurrent = peakKVA > 0 ? (peakKVA * 1000) / denominator : 0;

  // 7) Load factor
  const avgLoad = totalDaily / 24;
  const loadFactor = maxHourly > 0 ? (avgLoad / maxHourly) * 100 : 0;

  // 8) Phantom loss = Σ(phantom × qty × 24h)
  const phantomLoss = loads.reduce((s, l) => s + Math.max(0, l.phantomLoadW || 0) * Math.max(0, l.quantity || 0) * 24, 0);

  // 9) Critical & deferrable energy
  const criticalLoadWh = loads
    .filter(l => l.criticality === 'Critical' || l.criticality === 'Essential')
    .reduce((s, l) => s + calcDailyEnergy(l), 0);

  const deferrableLoadWh = loads
    .filter(l => l.deferrableLoad)
    .reduce((s, l) => s + calcDailyEnergy(l), 0);

  // 10) By category (sorted by energy desc)
  const catMap = new Map<string, number>();
  loads.forEach(l => catMap.set(l.categoryMain, (catMap.get(l.categoryMain) || 0) + calcDailyEnergy(l)));
  const byCategory = Array.from(catMap.entries())
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
    .sort((a, b) => b.value - a.value);

  // 11) By criticality
  const critColors: Record<string, string> = {
    'Critical': '#ef4444', 'Essential': '#f59e0b', 'Normal': '#3b82f6', 'Optional': '#6b7a9c',
  };
  const critMap = new Map<string, number>();
  loads.forEach(l => critMap.set(l.criticality, (critMap.get(l.criticality) || 0) + calcDailyEnergy(l)));
  const byCriticality = Array.from(critMap.entries())
    .map(([name, value]) => ({ name, value, color: critColors[name] || '#6b7a9c' }));

  return {
    totalConnectedLoadW: totalConnected,
    totalRunningLoadW: totalRunning,
    maximumDemandW: maximumDemand,
    diversifiedLoadW: diversified,
    coincidentPeakLoadW: coincidentPeak,
    totalDailyEnergyWh: totalDaily,
    dayEnergyWh: dayEnergy,
    nightEnergyWh: nightEnergy,
    monthlyEnergyKWh: (totalDaily * 30) / 1000,
    annualEnergyKWh: (totalDaily * 365) / 1000,
    peakDemandKW: peakKW,
    peakDemandKVA: peakKVA,
    estimatedMaxCurrentA: maxCurrent,
    maximumSurgeKW: maxSurge / 1000,
    loadFactor,
    phantomLossWh: phantomLoss,
    criticalLoadWh,
    deferrableLoadWh,
    byCategory,
    byCriticality,
    hourlyProfile,
    hourlyOperatingProfile: hourlyProfile,
  };
}

function emptySummary(): SummaryMetrics {
  return {
    totalConnectedLoadW: 0, totalRunningLoadW: 0, maximumDemandW: 0,
    diversifiedLoadW: 0, coincidentPeakLoadW: 0,
    totalDailyEnergyWh: 0, dayEnergyWh: 0, nightEnergyWh: 0,
    monthlyEnergyKWh: 0, annualEnergyKWh: 0,
    peakDemandKW: 0, peakDemandKVA: 0, estimatedMaxCurrentA: 0,
    maximumSurgeKW: 0, loadFactor: 0, phantomLossWh: 0,
    criticalLoadWh: 0, deferrableLoadWh: 0,
    byCategory: [], byCriticality: [], hourlyProfile: Array(24).fill(0),
    hourlyOperatingProfile: Array(24).fill(0),
  };
}

// =================== SMART AUTO-ESTIMATION ===================
export function getAutoEstimate(categoryMain: string): Partial<Load> {
  const presets: Record<string, Partial<Load>> = {
    'Lighting':   { powerFactor: 0.92, efficiency: 90, thdPercent: 12, harmonicClass: 'Nonlinear', surgeMultiplier: 1,   dutyCyclePercent: 60, utilizationFactorKu: 0.7,  demandFactor: 0.9,  coincidenceFactor: 0.7, diversityFactor: 1.3 },
    'HVAC':       { powerFactor: 0.88, efficiency: 85, thdPercent: 8,  harmonicClass: 'Nonlinear', surgeMultiplier: 4,   dutyCyclePercent: 60, utilizationFactorKu: 0.7,  demandFactor: 0.85, coincidenceFactor: 0.75, diversityFactor: 1.2, criticality: 'Essential' },
    'Kitchen':    { powerFactor: 0.88, efficiency: 85, thdPercent: 10, harmonicClass: 'Nonlinear', surgeMultiplier: 1.5, dutyCyclePercent: 30, utilizationFactorKu: 0.5,  demandFactor: 0.7,  coincidenceFactor: 0.6, diversityFactor: 1.4 },
    'Pump':       { powerFactor: 0.82, efficiency: 78, thdPercent: 6,  harmonicClass: 'Linear',    surgeMultiplier: 6,   dutyCyclePercent: 25, utilizationFactorKu: 0.5,  demandFactor: 0.7,  coincidenceFactor: 0.7, diversityFactor: 1.3, criticality: 'Essential' },
    'Medical':    { powerFactor: 0.9,  efficiency: 88, thdPercent: 8,  harmonicClass: 'Nonlinear', surgeMultiplier: 1.5, dutyCyclePercent: 60, utilizationFactorKu: 0.85, demandFactor: 0.95, coincidenceFactor: 0.8,  diversityFactor: 1.1, criticality: 'Critical' },
    'IT':         { powerFactor: 0.95, efficiency: 88, thdPercent: 10, harmonicClass: 'Nonlinear', surgeMultiplier: 1.2, dutyCyclePercent: 70, utilizationFactorKu: 0.75, demandFactor: 0.9,  coincidenceFactor: 0.7,  diversityFactor: 1.2 },
    'Industrial': { powerFactor: 0.85, efficiency: 85, thdPercent: 8,  harmonicClass: 'Nonlinear', surgeMultiplier: 6,   dutyCyclePercent: 50, utilizationFactorKu: 0.7,  demandFactor: 0.8,  coincidenceFactor: 0.85, diversityFactor: 1.15, criticality: 'Critical' },
    'EV':         { powerFactor: 0.98, efficiency: 95, thdPercent: 5,  harmonicClass: 'Nonlinear', surgeMultiplier: 1,   dutyCyclePercent: 20, utilizationFactorKu: 0.7,  demandFactor: 0.8,  coincidenceFactor: 0.5,  diversityFactor: 1.5, criticality: 'Optional' },
    'Security':   { powerFactor: 0.9,  efficiency: 88, thdPercent: 8,  harmonicClass: 'Nonlinear', surgeMultiplier: 1,   dutyCyclePercent: 100, utilizationFactorKu: 0.9,  demandFactor: 1,    coincidenceFactor: 0.9,  diversityFactor: 1.1, criticality: 'Critical' },
    'Water':      { powerFactor: 1,    efficiency: 95, thdPercent: 3,  harmonicClass: 'Linear',    surgeMultiplier: 1,   dutyCyclePercent: 20, utilizationFactorKu: 0.6,  demandFactor: 0.7,  coincidenceFactor: 0.7,  diversityFactor: 1.3, criticality: 'Essential' },
    'Office':     { powerFactor: 0.95, efficiency: 85, thdPercent: 10, harmonicClass: 'Nonlinear', surgeMultiplier: 1.5, dutyCyclePercent: 30, utilizationFactorKu: 0.5,  demandFactor: 0.6,  coincidenceFactor: 0.6,  diversityFactor: 1.4 },
    'Laundry':    { powerFactor: 0.9,  efficiency: 80, thdPercent: 10, harmonicClass: 'Nonlinear', surgeMultiplier: 2,   dutyCyclePercent: 8,  utilizationFactorKu: 0.4,  demandFactor: 0.6,  coincidenceFactor: 0.5,  diversityFactor: 1.5 },
    'Other':      { powerFactor: 0.9,  efficiency: 85, thdPercent: 8,  harmonicClass: 'Linear',    surgeMultiplier: 1.5, dutyCyclePercent: 50, utilizationFactorKu: 0.7,  demandFactor: 0.8,  coincidenceFactor: 0.7,  diversityFactor: 1.3 },
  };
  return presets[categoryMain] || presets['Other'];
}

// =================== LEGACY VALIDATE (kept for compat) ===================
// Use the new audit-aware validator in src/core/validation/rules.ts
// This stub remains to avoid breaking existing imports but routes to canonical.
import { validateLoad as coreValidateLoad } from '../core/validation/rules';
export const validateLoad = coreValidateLoad;
export type { ValidationIssue, ValidationResult } from '../core/validation/rules';

// =================== SURGE LIBRARY ===================
export const SURGE_MULTIPLIERS: { name: string; multiplier: number; description: string }[] = [
  { name: 'Resistive Heater', multiplier: 1,   description: 'No surge — pure resistance load' },
  { name: 'LED Lighting',     multiplier: 1,   description: 'Negligible inrush' },
  { name: 'Incandescent',     multiplier: 1.5, description: 'Hot tungsten filament inrush' },
  { name: 'Small Motor (<1 HP)', multiplier: 3, description: 'PSC, shaded-pole, split-phase' },
  { name: 'Standard Motor (1-5 HP)', multiplier: 5, description: 'Capacitor-start, induction' },
  { name: 'Large Motor (>5 HP)', multiplier: 7, description: 'Three-phase induction DOL' },
  { name: 'Compressor / Refrigerator', multiplier: 5, description: 'Hermetic compressor LRA' },
  { name: 'Welding Machine',  multiplier: 3,   description: 'Transformer inrush' },
  { name: 'X-Ray / Medical Imaging', multiplier: 7, description: 'Capacitor discharge systems' },
  { name: 'EV Charger',       multiplier: 1,   description: 'Electronic soft-start built in' },
  { name: 'UPS System',       multiplier: 1.5, description: 'Battery + inverter soft-start' },
  { name: 'Server / SMPS',    multiplier: 1.5, description: 'Bulk capacitor inrush' },
];

// NEC Demand Factors
export const NEC_DEMAND_FACTORS: { description: string; factor: number }[] = [
  { description: 'First 3 kVA @ 100%', factor: 1.0 },
  { description: '3 kVA to 20 kVA @ 35%', factor: 0.35 },
  { description: 'Remainder over 20 kVA @ 25%', factor: 0.25 },
];

// =================== FORMATTERS ===================
export const fmtW = (w: number, digits = 0): string => {
  if (!isFinite(w)) return '—';
  if (Math.abs(w) >= 1_000_000) return (w / 1_000_000).toFixed(2) + ' MW';
  if (Math.abs(w) >= 1_000) return (w / 1_000).toFixed(digits || 2) + ' kW';
  return w.toFixed(digits) + ' W';
};

export const fmtWh = (wh: number, digits = 0): string => {
  if (!isFinite(wh)) return '—';
  if (Math.abs(wh) >= 1_000_000) return (wh / 1_000_000).toFixed(2) + ' MWh';
  if (Math.abs(wh) >= 1_000) return (wh / 1_000).toFixed(digits || 2) + ' kWh';
  return wh.toFixed(digits) + ' Wh';
};

export const fmtA = (a: number, digits = 1): string => isFinite(a) ? a.toFixed(digits) + ' A' : '—';
export const fmtKVA = (kva: number, digits = 2): string => isFinite(kva) ? kva.toFixed(digits) + ' kVA' : '—';
export const fmtPct = (n: number, digits = 1): string => isFinite(n) ? n.toFixed(digits) + '%' : '—';

// =================== UTILITY ===================
function clamp(v: number, min: number, max: number): number {
  if (!isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}
