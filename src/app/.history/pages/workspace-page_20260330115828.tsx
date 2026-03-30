import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { createRoot, Root } from 'react-dom/client';
import { WorkspaceConfigPanel } from '../components/workspace-config-panel';
import { ChartConfig, TableConfig, ResultChart } from '../components/workspace-results';
import { InsightsPanel, Insight, ModelMetrics } from '../components/insights-panel';
import { ArtifactsLibrary, LibraryArtifact } from '../components/artifacts-library';
import { WorkspaceCanvas, LayoutToggle, ColumnCount, PanelView } from '../components/workspace-canvas';
import { VIEW_META, TABLE_VIEW_META } from '../components/workspace-canvas';
import type { CanvasCard } from '../components/artifact-canvas';
import { ChatMessage } from '../components/compact-chat';
import { ChartBuilderModal, CustomChartConfig, resolveCustomChart } from '../components/chart-builder-modal';
import { TableSelectorModal } from '../components/table-selector-modal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { SortPanelsModal } from '../components/sort-panels-modal';
import { ModelProjectModal } from '../components/model-project-modal';
import { PROJECTS, MODELS, Objective as CfgObjective, Constraint as CfgConstraint } from '../components/workspace-config-panel';
import {
  Package, Brain, RefreshCw,
  Sparkles, ArrowLeft, Share2, Send,
  MessageSquare, FlaskConical, User, Loader2, Zap, ChevronRight, PlusCircle, Table2, Download, CheckCircle2, ChevronLeft,
  BrainCircuit, FolderOpen,
} from 'lucide-react';
import { useDemoStage, SavedReport } from '../context/demo-context';

/* ── Types ─────────────────────────────────────────────────── */

interface Objective {
  id: string;
  attribute: string;
  target: 'maximize' | 'minimize' | 'range';
  value?: number | string;
  unit?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'achieved' | 'pending' | 'at-risk';
  progress?: number;
  currentValue?: number | string;
}

/* ── Static data ────────────────────────────────────────────── */

const PROJECT_NAMES: Record<string, string> = {
  '1': 'Sunscreen SPF Optimization',
  '2': 'Surfactant CMC Prediction',
  '3': 'Emollient Texture Analysis',
  '4': 'UV Filter Photo-Stability',
  '5': 'Transdermal Penetration Model',
};

/* ── Pareto candidate pool (for live scoring) ───────────────── */
// Candidates span the full ingredient space so constraint sliders visibly filter results.
// ZnO: 5–25 %, TiO2: 4–12 %, Avo: 0.8–4.2 %, Oct: 1–6.5 %

const PARETO_POOL = [
  // High ZnO (19–25 %): primarily physical filters — highest SPF & WR, higher cost
  { id: 'R-047', spf: 56.2, wr: 98.5, stability: 98.8, cost: 99, zno: 24.5, tio2: 4.5, avo: 0.8, oct: 1.0 },
  { id: 'R-124', spf: 55.0, wr: 97.8, stability: 98.2, cost: 97, zno: 22.0, tio2: 5.0, avo: 1.0, oct: 1.2 },
  { id: 'R-317', spf: 53.8, wr: 97.2, stability: 97.5, cost: 96, zno: 20.5, tio2: 6.0, avo: 1.2, oct: 1.5 },
  // Mid-high ZnO (14–18 %): balanced physical/chemical blend
  { id: 'R-089', spf: 52.4, wr: 96.5, stability: 96.8, cost: 93, zno: 17.5, tio2: 7.0, avo: 2.0, oct: 1.8 },
  { id: 'R-203', spf: 51.8, wr: 95.8, stability: 96.2, cost: 91, zno: 15.8, tio2: 8.0, avo: 2.5, oct: 2.0 },
  { id: 'R-441', spf: 51.2, wr: 95.2, stability: 95.5, cost: 90, zno: 14.2, tio2: 8.5, avo: 2.8, oct: 2.2 },
  // Mid ZnO (9–13 %): greater reliance on chemical UV filters
  { id: 'R-568', spf: 50.5, wr: 94.0, stability: 94.5, cost: 88, zno: 13.0, tio2: 9.0, avo: 3.0, oct: 2.5 },
  { id: 'R-612', spf: 49.2, wr: 93.0, stability: 93.5, cost: 86, zno: 11.5, tio2: 9.5, avo: 3.2, oct: 3.0 },
  { id: 'R-703', spf: 48.0, wr: 92.0, stability: 92.5, cost: 84, zno: 10.0, tio2: 10.0, avo: 3.5, oct: 3.5 },
  // Low ZnO (5–9 %): chemical-dominant — lower cost, lower physical UV protection
  { id: 'R-801', spf: 46.8, wr: 90.5, stability: 91.0, cost: 82, zno: 8.0,  tio2: 10.5, avo: 3.8, oct: 4.5 },
  { id: 'R-902', spf: 45.5, wr: 89.5, stability: 89.5, cost: 80, zno: 6.5,  tio2: 11.0, avo: 4.0, oct: 5.5 },
  { id: 'R-115', spf: 44.2, wr: 88.0, stability: 88.0, cost: 78, zno: 5.2,  tio2: 11.5, avo: 4.2, oct: 6.5 },
];

const BASELINE_CAND = { id: 'Baseline', spf: 35.5, wr: 82.0, stability: 88.0, cost: 100, zno: 10.0, tio2: 5.0, avo: 1.5, oct: 1.0 };

/** Map a constraint ingredient name to a candidate attribute key */
const CONSTRAINT_ATTR_MAP: Record<string, keyof typeof PARETO_POOL[0]> = {
  'zinc oxide':        'zno',
  'titanium dioxide':  'tio2',
  'avobenzone':        'avo',
  'octocrylene':       'oct',
};

/** Default ingredient design space — used when no constraint restricts that ingredient */
const INGREDIENT_SPACE = {
  zno:  { min: 5.0,  max: 25.0 },
  tio2: { min: 4.0,  max: 12.0 },
  avo:  { min: 0.5,  max: 4.5  },
  oct:  { min: 0.5,  max: 7.0  },
};

/** Fixed normalisation bounds for scoring (absolute model range — keeps scores comparable) */
const PERF_RANGE = {
  spf:       { min: 20, max: 75  },
  wr:        { min: 60, max: 100 },
  stability: { min: 70, max: 100 },
  cost:      { min: 40, max: 150 },
};

function _lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function _clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function _r1(v: number) { return Math.round(v * 10) / 10; }
function _r0(v: number) { return Math.round(v); }

/**
 * Generate N recipe candidates whose ingredient values span the ranges defined by the
 * active constraints. Performance properties (SPF, WR, stability, cost) are computed
 * from a simple linear formulation model rather than filtering a fixed pool.
 */
function generateCandidatesFromConstraints(
  constraints: CfgConstraint[],
  n = 10
): Array<{ id: string; spf: number; wr: number; stability: number; cost: number; zno: number; tio2: number; avo: number; oct: number }> {
  const getRange = (attrKey: string) => {
    const defaults = INGREDIENT_SPACE[attrKey as keyof typeof INGREDIENT_SPACE];
    const con = constraints.find((c) => CONSTRAINT_ATTR_MAP[c.ingredient.toLowerCase()] === attrKey);
    if (!con) return defaults;
    return {
      min: con.min !== undefined ? Math.max(con.min, defaults.min) : defaults.min,
      max: con.max !== undefined ? Math.min(con.max, defaults.max) : defaults.max,
    };
  };

  const znoR  = getRange('zno');
  const tio2R = getRange('tio2');
  const avoR  = getRange('avo');
  const octR  = getRange('oct');

  return Array.from({ length: n }, (_, i) => {
    const t    = n === 1 ? 0.5 : i / (n - 1);
    const tInv = 1 - t;

    // Spread candidates across the ZnO range; other ingredients co-vary chemically.
    // High ZnO → more physical UV protection; low ZnO → chemical filters compensate.
    const zno  = _r1(_lerp(znoR.min,  znoR.max,  t));
    const tio2 = _r1(_lerp(tio2R.min, tio2R.max, t * 0.5 + 0.25));
    const avo  = _r1(_lerp(avoR.min,  avoR.max,  tInv * 0.8 + 0.1));
    const oct  = _r1(_lerp(octR.min,  octR.max,  tInv * 0.7 + 0.15));

    // Formulation performance model
    const spf       = _r1(_clamp(18  + 1.4 * zno + 0.7 * tio2 + 1.2 * avo + 0.8 * oct, PERF_RANGE.spf.min,       PERF_RANGE.spf.max));
    const wr        = _r1(_clamp(62  + 1.5 * zno + 0.6 * tio2 + 0.7 * avo + 0.3 * oct, PERF_RANGE.wr.min,        PERF_RANGE.wr.max));
    const stability = _r1(_clamp(98  + 0.2 * zno + 0.1 * tio2 - 0.5 * avo - 0.4 * oct, PERF_RANGE.stability.min, PERF_RANGE.stability.max));
    const cost      = _r0(_clamp(38  + 2.0 * zno + 1.5 * tio2 + 4.0 * avo + 2.5 * oct, PERF_RANGE.cost.min,      PERF_RANGE.cost.max));

    return { id: `RG-${String(i + 1).padStart(3, '0')}`, spf, wr, stability, cost, zno, tio2, avo, oct };
  });
}

/** Compute live stage results based on current objectives and constraints */
function computeLiveStageResults(
  objectives: CfgObjective[],
  weights: Record<string, number>,
  constraints: CfgConstraint[],
  base: Record<number, { chart: ChartConfig; table: TableConfig }>
): Record<number, { chart: ChartConfig; table: TableConfig }> {
  // 1. Generate 10 new recipe candidates whose ingredient values span the constraint-
  //    defined design space, then compute performance from the formulation model.
  const candidates = generateCandidatesFromConstraints(constraints, 10);

  // 2. Score each candidate using fixed normalisation bounds (PERF_RANGE) so scores
  //    remain comparable regardless of how the constraint sliders are positioned.
  const normalize = (val: number, a: string) => {
    const r = PERF_RANGE[a as keyof typeof PERF_RANGE];
    if (!r) return 0.5;
    const range = r.max - r.min;
    return range === 0 ? 0.5 : (val - r.min) / range;
  };

  // 3. Compute composite score per candidate
  const getAttrForObjective = (obj: CfgObjective): keyof typeof PARETO_POOL[0] | null => {
    const lc = obj.attribute.toLowerCase();
    if (lc.includes('spf')) return 'spf';
    if (lc.includes('water')) return 'wr';
    if (lc.includes('stability')) return 'stability';
    if (lc.includes('cost')) return 'cost';
    return null;
  };

  const scored = candidates.map((c) => {
    let score = 0;
    let totalWeight = 0;
    objectives.forEach((obj) => {
      const attr = getAttrForObjective(obj);
      if (!attr) return;
      const w = (weights[obj.id] ?? 50) / 100;
      const n = normalize(c[attr] as number, attr);
      // For minimize, invert the normalised value
      score += w * (obj.target === 'minimize' ? 1 - n : n);
      totalWeight += w;
    });
    return { ...c, score: totalWeight > 0 ? (score / totalWeight) * 100 : 50 };
  });

  scored.sort((a, b) => b.score - a.score);
  const top10 = scored.slice(0, 10);
  const top3  = scored.slice(0, 3);
  const lead  = top3[0] ?? BASELINE_CAND;

  // 4. Build updated stage 4 chart
  const dominantObj = objectives.reduce<Objective | null>((best, o) => {
    const w = weights[o.id] ?? 50;
    return !best || w > (weights[best.id] ?? 50) ? o : best;
  }, null);
  const activeConstraintCount = constraints.filter((c) => CONSTRAINT_ATTR_MAP[c.ingredient.toLowerCase()]).length;
  const constraintLabel = activeConstraintCount > 0
    ? `${activeConstraintCount} constraint${activeConstraintCount > 1 ? 's' : ''} applied`
    : 'default design space';
  const subtitleWeight = dominantObj
    ? `Optimising for: ${dominantObj.attribute} (${weights[dominantObj.id] ?? 50}% weight) · ${candidates.length} recipes generated · ${constraintLabel}`
    : `${candidates.length} recipes generated · ${constraintLabel}`;

  const stage4Chart: ChartConfig = {
    ...base[4].chart,
    title: 'Generated Recipe Ranking — Live Composite Scores',
    subtitle: subtitleWeight,
    xAxisKey: 'id',
    yAxisKeys: [{ key: 'score', color: '#3F98FF', name: 'Composite Score (0–100)' }],
    data: top10.map((c) => ({
      id: c.id,
      score: parseFloat(c.score.toFixed(1)),
      spf: c.spf,
      wr: parseFloat(c.wr.toFixed(1)),
      stability: parseFloat(c.stability.toFixed(1)),
      cost: c.cost,
      zno: c.zno,
      tio2: c.tio2,
      avo: c.avo,
      oct: c.oct,
    })),
    highlightKey: lead?.id ?? '',
    referenceLines: [],
  };

  // 4b. Update table rows sorted by new score
  const rankLabels = ['★ 1','2','3','4','5','6','7','8','9','10'];
  const stage4Table: TableConfig = {
    ...base[4].table,
    subtitle: `Generated recipes · lead: ${lead.id} · ${constraintLabel}`,
    pinnedValue: lead?.id ?? '',
    rows: top10.map((c, i) => ({
      rank: rankLabels[i] ?? String(i + 1),
      id: c.id,
      zno: c.zno,
      tio2: c.tio2,
      avo: c.avo,
      spf: c.spf,
      wr: `${c.wr.toFixed(1)}%`,
      stability: `${c.stability.toFixed(1)}%`,
      cost: c.cost,
      score: parseFloat(c.score.toFixed(1)),
    })),
  };

  // 5. Build updated stage 5 chart (top 3 + baseline)
  const leadLabel = `${lead.id} ★`;
  const stage5Data = [
    { recipe: leadLabel, spf: lead.spf, wr: lead.wr, stability: lead.stability },
    ...(top3.slice(1).map((c) => ({ recipe: c.id, spf: c.spf, wr: c.wr, stability: c.stability }))),
    { recipe: 'Baseline', spf: BASELINE_CAND.spf, wr: BASELINE_CAND.wr, stability: BASELINE_CAND.stability },
  ];
  const spfTarget = objectives.find((o) => o.attribute.toLowerCase().includes('spf'));
  const spfTargetVal = spfTarget?.value !== undefined ? Number(spfTarget.value) || 50 : 50;

  const stage5Chart: ChartConfig = {
    ...base[5].chart,
    title: `Top ${top3.length} Formulation Recipes vs. Baseline — Live`,
    subtitle: `Ranked by current objective weights · Lead: ${lead.id} (★)`,
    data: stage5Data,
    highlightKey: leadLabel,
    referenceLines: [{ y: spfTargetVal, label: `SPF Target (${spfTargetVal})`, color: '#059669' }],
  };

  // 6. Build updated stage 6 chart (objective achievement for lead)
  const getObjTarget = (attr: string, fallback: number) => {
    const o = objectives.find((x) => x.attribute.toLowerCase().includes(attr));
    if (!o?.value) return fallback;
    const n = Number(String(o.value).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? fallback : n;
  };
  const stage6Chart: ChartConfig = {
    ...base[6].chart,
    data: [
      { objective: 'SPF Value',    achieved: lead.spf,          target: getObjTarget('spf', 50),        baseline: BASELINE_CAND.spf        },
      { objective: 'Water Res. %', achieved: lead.wr,           target: getObjTarget('water', 90),      baseline: BASELINE_CAND.wr         },
      { objective: 'Stability %',  achieved: lead.stability,    target: getObjTarget('stability', 97),  baseline: BASELINE_CAND.stability   },
      { objective: 'Cost Index',   achieved: lead.cost,         target: getObjTarget('cost', 85),       baseline: BASELINE_CAND.cost        },
    ],
  };

  return {
    ...base,
    4: { chart: stage4Chart, table: stage4Table },
    5: { ...base[5], chart: stage5Chart },
    6: { ...base[6], chart: stage6Chart },
  };
}

/* ── Stage results ──────────────────────────────────────────── */

const STAGE_RESULTS: Record<number, { chart: ChartConfig; table: TableConfig }> = {
  2: {
    chart: {
      title: 'Historical SPF Distribution — Training Dataset',
      subtitle: '2,450 formulations · Internal R&D database · 18 features',
      type: 'bar',
      highlightKey: '45–50',
      data: [
        { range: '5–10',  count: 82,  avgStability: 72.1 },
        { range: '10–15', count: 158, avgStability: 75.4 },
        { range: '15–20', count: 310, avgStability: 78.2 },
        { range: '20–25', count: 425, avgStability: 80.9 },
        { range: '25–30', count: 512, avgStability: 83.5 },
        { range: '30–35', count: 398, avgStability: 86.1 },
        { range: '35–40', count: 285, avgStability: 88.4 },
        { range: '40–45', count: 162, avgStability: 91.2 },
        { range: '45–50', count: 78,  avgStability: 93.7 },
        { range: '50+',   count: 40,  avgStability: 95.0 },
      ],
      xAxisKey: 'range',
      yAxisKeys: [
        { key: 'count',        color: '#3F98FF', name: 'Formulation Count' },
        { key: 'avgStability', color: '#059669', name: 'Avg Stability %'   },
      ],
    },
    table: {
      title: 'Training Dataset Summary — Feature Statistics',
      subtitle: '2,450 formulations · 18 features · 3 outliers removed (Mahalanobis >3σ)',
      columns: [
        { key: 'feature',   label: 'Feature',       width: '180px'                               },
        { key: 'mean',      label: 'Mean',           width: '88px',  align: 'right'               },
        { key: 'std',       label: 'Std Dev',        width: '88px',  align: 'right'               },
        { key: 'min',       label: 'Min',            width: '80px',  align: 'right'               },
        { key: 'max',       label: 'Max',            width: '80px',  align: 'right'               },
        { key: 'corr_spf',  label: 'Corr. w/ SPF',  width: '100px', align: 'right'               },
        { key: 'missing',   label: 'Missing %',      width: '88px',  align: 'right'               },
        { key: 'quality',   label: 'Quality',        width: '80px',  align: 'center', badge: true },
      ],
      rows: [
        { feature: 'Zinc Oxide %',           mean: 12.4,  std: 4.2,  min: 2.0,  max: 24.8, corr_spf: '0.82',  missing: '0.0%', quality: '✓ Good' },
        { feature: 'Titanium Dioxide %',     mean: 7.8,   std: 3.1,  min: 0.0,  max: 18.5, corr_spf: '0.61',  missing: '0.0%', quality: '✓ Good' },
        { feature: 'Avobenzone %',           mean: 2.1,   std: 1.4,  min: 0.0,  max: 5.0,  corr_spf: '0.54',  missing: '0.2%', quality: '✓ Good' },
        { feature: 'Octocrylene %',          mean: 3.5,   std: 2.0,  min: 0.0,  max: 10.0, corr_spf: '0.42',  missing: '0.1%', quality: '✓ Good' },
        { feature: 'Emollient %',            mean: 11.2,  std: 5.8,  min: 1.0,  max: 28.0, corr_spf: '−0.35', missing: '0.3%', quality: '✓ Good' },
        { feature: 'Cyclopentasiloxane %',   mean: 10.5,  std: 4.1,  min: 0.0,  max: 22.0, corr_spf: '0.12',  missing: '0.0%', quality: '✓ Good' },
        { feature: 'Dimethicone %',          mean: 4.2,   std: 2.3,  min: 0.0,  max: 12.0, corr_spf: '0.08',  missing: '0.1%', quality: '✓ Good' },
        { feature: 'Water %',               mean: 52.1,  std: 8.4,  min: 30.0, max: 72.0, corr_spf: '−0.28', missing: '0.0%', quality: '✓ Good' },
        { feature: 'pH',                    mean: 6.8,   std: 0.6,  min: 5.2,  max: 8.1,  corr_spf: '−0.05', missing: '0.4%', quality: '✓ Good' },
        { feature: 'Viscosity (cP)',         mean: 4250,  std: 1820, min: 800,  max: 12000,corr_spf: '0.18',  missing: '1.2%', quality: '✓ Good' },
        { feature: 'Particle Size (nm)',     mean: 85,    std: 32,   min: 20,   max: 200,  corr_spf: '0.45',  missing: '0.8%', quality: '✓ Good' },
        { feature: 'Water Resistance %',     mean: 84.2,  std: 8.5,  min: 52.0, max: 98.0, corr_spf: '0.74',  missing: '0.0%', quality: '✓ Good' },
        { feature: 'Stability @ 24M %',      mean: 86.5,  std: 7.2,  min: 58.0, max: 99.0, corr_spf: '0.38',  missing: '0.0%', quality: '✓ Good' },
        { feature: 'SPF (measured)',         mean: 28.6,  std: 11.3, min: 6.2,  max: 58.4, corr_spf: '1.00',  missing: '0.0%', quality: '✓ Good' },
      ],
    },
  },
  3: {
    chart: {
      title: 'Predicted vs. Actual SPF — Model Validation',
      subtitle: 'XGBoost + RF Ensemble · Test set n=490 · R²=0.94',
      type: 'bar',
      highlightKey: 'F-718',
      referenceLines: [{ y: 50, label: 'Target ≥50', color: '#059669' }],
      data: [
        { formula: 'F-101', actual: 28.5, predicted: 29.1 },
        { formula: 'F-215', actual: 34.2, predicted: 33.8 },
        { formula: 'F-334', actual: 42.1, predicted: 41.7 },
        { formula: 'F-412', actual: 38.6, predicted: 39.2 },
        { formula: 'F-521', actual: 47.3, predicted: 46.9 },
        { formula: 'F-633', actual: 44.9, predicted: 45.3 },
        { formula: 'F-718', actual: 50.2, predicted: 51.0 },
        { formula: 'F-812', actual: 36.4, predicted: 35.9 },
        { formula: 'F-905', actual: 29.7, predicted: 30.4 },
        { formula: 'F-999', actual: 55.1, predicted: 54.6 },
      ],
      xAxisKey: 'formula',
      yAxisKeys: [
        { key: 'actual',    color: '#94a3b8', name: 'Actual SPF'    },
        { key: 'predicted', color: '#3F98FF', name: 'Predicted SPF' },
      ],
    },
    table: {
      title: 'Prediction Results — Full Test Set',
      subtitle: 'XGBoost + RF · 490 held-out formulations · 5-fold CV',
      pinnedValue: 'F-718',
      columns: [
        { key: 'rank',      label: '#',           width: '44px',  align: 'center' },
        { key: 'formula',   label: 'Formulation', width: '110px'                  },
        { key: 'actual',    label: 'Actual SPF',  width: '96px',  align: 'right'  },
        { key: 'predicted', label: 'Pred. SPF',   width: '96px',  align: 'right'  },
        { key: 'error',     label: 'Abs. Error',  width: '96px',  align: 'right'  },
        { key: 'ci',        label: '95% CI',      width: '120px', align: 'center' },
        { key: 'wr',        label: 'WR %',        width: '80px',  align: 'right'  },
        { key: 'stability', label: 'Stability %', width: '96px',  align: 'right'  },
        { key: 'status',    label: 'Status',      width: '80px',  align: 'center', badge: true },
      ],
      rows: [
        { rank: '1',  formula: 'F-999', actual: 55.1, predicted: 54.6, error: 0.5, ci: '52.9 – 56.3', wr: '96.1%', stability: '95.8%', status: '✓ Pass' },
        { rank: '2',  formula: 'F-718', actual: 50.2, predicted: 51.0, error: 0.8, ci: '49.1 – 52.9', wr: '96.0%', stability: '97.0%', status: '✓ Pass' },
        { rank: '3',  formula: 'F-521', actual: 47.3, predicted: 46.9, error: 0.4, ci: '45.2 – 48.6', wr: '94.0%', stability: '95.0%', status: '✓ Pass' },
        { rank: '4',  formula: 'F-633', actual: 44.9, predicted: 45.3, error: 0.4, ci: '43.7 – 46.9', wr: '92.0%', stability: '92.0%', status: '✓ Pass' },
        { rank: '5',  formula: 'F-334', actual: 42.1, predicted: 41.7, error: 0.4, ci: '40.1 – 43.3', wr: '91.0%', stability: '93.0%', status: '✓ Pass' },
        { rank: '6',  formula: 'F-412', actual: 38.6, predicted: 39.2, error: 0.6, ci: '37.8 – 40.6', wr: '88.0%', stability: '90.0%', status: '✓ Pass' },
        { rank: '7',  formula: 'F-812', actual: 36.4, predicted: 35.9, error: 0.5, ci: '34.7 – 37.1', wr: '85.0%', stability: '88.0%', status: '✓ Pass' },
        { rank: '8',  formula: 'F-215', actual: 34.2, predicted: 33.8, error: '0.4', ci: '32.6 – 35.0', wr: '83.0%', stability: '89.0%', status: '✓ Pass' },
        { rank: '9',  formula: 'F-905', actual: 29.7, predicted: 30.4, error: 0.7, ci: '29.1 – 31.7', wr: '79.0%', stability: '85.0%', status: '✓ Pass' },
        { rank: '10', formula: 'F-101', actual: 28.5, predicted: 29.1, error: 0.6, ci: '27.9 – 30.3', wr: '78.0%', stability: '91.0%', status: '✓ Pass' },
        { rank: '11', formula: 'F-044', actual: 25.1, predicted: 26.0, error: 0.9, ci: '24.5 – 27.5', wr: '72.0%', stability: '82.0%', status: '✓ Pass' },
        { rank: '12', formula: 'F-033', actual: 22.4, predicted: 21.8, error: 0.6, ci: '21.0 – 22.6', wr: '68.0%', stability: '79.0%', status: '✓ Pass' },
        { rank: '13', formula: 'F-018', actual: 18.3, predicted: 19.1, error: 0.8, ci: '18.2 – 20.0', wr: '61.0%', stability: '74.0%', status: '✓ Pass' },
        { rank: '14', formula: 'F-011', actual: 15.2, predicted: 14.8, error: 0.4, ci: '14.1 – 15.5', wr: '55.0%', stability: '70.0%', status: '✓ Pass' },
        { rank: '15', formula: 'F-003', actual: 11.6, predicted: 12.4, error: 0.8, ci: '11.8 – 13.0', wr: '48.0%', stability: '65.0%', status: '✓ Pass' },
      ],
    },
  },
  4: {
    chart: {
      title: 'Top Pareto-Optimal Candidates — Multi-Objective Scores',
      subtitle: 'Bayesian optimization · 1,000 iterations · 47 Pareto candidates',
      type: 'bar',
      highlightKey: 'R-047',
      referenceLines: [{ y: 50, label: 'SPF Target ≥50', color: '#059669' }],
      data: [
        { id: 'R-047', spf: 52.3, wr: 96.8, stability: 97.0 },
        { id: 'R-124', spf: 51.8, wr: 96.0, stability: 96.8 },
        { id: 'R-317', spf: 53.1, wr: 95.5, stability: 95.2 },
        { id: 'R-089', spf: 50.1, wr: 95.2, stability: 96.5 },
        { id: 'R-203', spf: 48.9, wr: 94.8, stability: 95.9 },
        { id: 'R-441', spf: 50.6, wr: 94.1, stability: 94.8 },
        { id: 'R-568', spf: 49.2, wr: 93.7, stability: 94.1 },
        { id: 'R-612', spf: 48.4, wr: 93.0, stability: 93.8 },
        { id: 'R-703', spf: 47.8, wr: 92.5, stability: 93.2 },
        { id: 'R-801', spf: 47.1, wr: 91.8, stability: 92.7 },
      ],
      xAxisKey: 'id',
      yAxisKeys: [
        { key: 'spf',       color: '#3F98FF', name: 'Pred. SPF'    },
        { key: 'wr',        color: '#7c3aed', name: 'Water Res. %' },
        { key: 'stability', color: '#059669', name: 'Stability %'  },
      ],
    },
    table: {
      title: 'Pareto-Optimal Formulation Candidates',
      subtitle: '47 candidates · ranked by composite multi-objective score',
      pinnedValue: 'R-047',
      columns: [
        { key: 'rank',      label: 'Rank',       width: '60px',  align: 'center', badge: true },
        { key: 'id',        label: 'ID',         width: '72px'                                 },
        { key: 'zno',       label: 'ZnO %',      width: '72px',  align: 'right'                },
        { key: 'tio2',      label: 'TiO₂ %',     width: '72px',  align: 'right'                },
        { key: 'avo',       label: 'Avo %',       width: '72px',  align: 'right'                },
        { key: 'spf',       label: 'Pred. SPF',  width: '88px',  align: 'right'                },
        { key: 'wr',        label: 'Water Res.', width: '88px',  align: 'right'                },
        { key: 'stability', label: 'Stability',  width: '88px',  align: 'right'                },
        { key: 'cost',      label: 'Cost Δ',     width: '80px',  align: 'right', trend: true   },
        { key: 'score',     label: 'Score',      width: '72px',  align: 'right'                },
      ],
      rows: [
        { rank: '★ 1', id: 'R-047', zno: 15.2, tio2: 8.5,  avo: 3.0, spf: 52.3, wr: '96.8%', stability: '97.0%', cost: '-12%', score: 98.2 },
        { rank: '2',   id: 'R-124', zno: 15.5, tio2: 8.0,  avo: 3.2, spf: 51.8, wr: '96.0%', stability: '96.8%', cost: '-9%',  score: 96.4 },
        { rank: '3',   id: 'R-317', zno: 16.0, tio2: 7.5,  avo: 3.5, spf: 53.1, wr: '95.5%', stability: '95.2%', cost: '-7%',  score: 94.1 },
        { rank: '4',   id: 'R-089', zno: 14.8, tio2: 9.0,  avo: 2.8, spf: 50.1, wr: '95.2%', stability: '96.5%', cost: '-11%', score: 96.8 },
        { rank: '5',   id: 'R-203', zno: 14.2, tio2: 9.5,  avo: 2.5, spf: 48.9, wr: '94.8%', stability: '95.9%', cost: '-8%',  score: 94.7 },
        { rank: '6',   id: 'R-441', zno: 15.8, tio2: 8.2,  avo: 2.9, spf: 50.6, wr: '94.1%', stability: '94.8%', cost: '-6%',  score: 93.5 },
        { rank: '7',   id: 'R-568', zno: 14.5, tio2: 8.8,  avo: 3.1, spf: 49.2, wr: '93.7%', stability: '94.1%', cost: '-5%',  score: 92.1 },
        { rank: '8',   id: 'R-612', zno: 13.9, tio2: 9.2,  avo: 2.7, spf: 48.4, wr: '93.0%', stability: '93.8%', cost: '-4%',  score: 91.4 },
        { rank: '9',   id: 'R-703', zno: 15.1, tio2: 7.9,  avo: 3.3, spf: 47.8, wr: '92.5%', stability: '93.2%', cost: '-3%',  score: 90.8 },
        { rank: '10',  id: 'R-801', zno: 13.5, tio2: 9.8,  avo: 2.4, spf: 47.1, wr: '91.8%', stability: '92.7%', cost: '-2%',  score: 89.9 },
        { rank: '11',  id: 'R-912', zno: 14.0, tio2: 8.6,  avo: 3.4, spf: 46.9, wr: '91.2%', stability: '92.0%', cost: '-1%',  score: 88.7 },
        { rank: '12',  id: 'R-044', zno: 16.2, tio2: 7.2,  avo: 3.6, spf: 46.5, wr: '90.8%', stability: '91.5%', cost: '+2%',  score: 87.3 },
        { rank: '13',  id: 'R-155', zno: 13.2, tio2: 10.1, avo: 2.2, spf: 45.8, wr: '90.1%', stability: '91.0%', cost: '+4%',  score: 86.0 },
      ],
    },
  },
  5: {
    chart: {
      title: 'Top 3 Formulation Recipes vs. Baseline — Performance',
      subtitle: 'Predicted values with 95% CI · Lead: R-047 (★)',
      type: 'bar',
      highlightKey: 'R-047 ★',
      referenceLines: [{ y: 50, label: 'SPF Target', color: '#059669' }],
      data: [
        { recipe: 'R-047 ★', spf: 52.3, wr: 96.8, stability: 97.0 },
        { recipe: 'R-124',   spf: 51.8, wr: 96.0, stability: 96.8 },
        { recipe: 'R-089',   spf: 50.1, wr: 95.2, stability: 96.5 },
        { recipe: 'Baseline',spf: 35.5, wr: 82.0, stability: 88.0 },
      ],
      xAxisKey: 'recipe',
      yAxisKeys: [
        { key: 'spf',       color: '#3F98FF', name: 'Pred. SPF'    },
        { key: 'wr',        color: '#7c3aed', name: 'Water Res. %' },
        { key: 'stability', color: '#059669', name: 'Stability %'  },
      ],
    },
    table: {
      title: 'Formulation Specifications — Top 3 Recipes',
      subtitle: 'Full INCI ingredient list · EU Cosmetics Reg. 1223/2009 compliant',
      pinnedValue: 'R-047',
      columns: [
        { key: 'recipe',     label: 'Recipe',     width: '88px',  badge: true                 },
        { key: 'ingredient', label: 'Ingredient', width: '180px'                               },
        { key: 'inci',       label: 'INCI Name',  width: '180px'                               },
        { key: 'pct',        label: '% w/w',      width: '72px',  align: 'right'               },
        { key: 'role',       label: 'Function',   width: '160px'                               },
        { key: 'limit',      label: 'Reg. Limit', width: '88px',  align: 'center'              },
        { key: 'status',     label: 'Compliance', width: '88px',  align: 'center', badge: true },
      ],
      rows: [
        { recipe: '★ R-047', ingredient: 'Zinc Oxide (nano)',  inci: 'Zinc Oxide',              pct: 15.2, role: 'Primary UV filter', limit: '≤ 25%', status: '✓ Pass' },
        { recipe: '★ R-047', ingredient: 'Titanium Dioxide',   inci: 'Titanium Dioxide',         pct:  8.5, role: 'Broad-spectrum UV',  limit: '≤ 25%', status: '✓ Pass' },
        { recipe: '★ R-047', ingredient: 'Avobenzone',         inci: 'Butyl Methoxydibenzoyl.', pct:  3.0, role: 'UVA organic filter', limit: '≤ 5%',  status: '✓ Pass' },
        { recipe: '★ R-047', ingredient: 'Octocrylene',        inci: 'Octocrylene',              pct:  2.2, role: 'UV stabilizer',      limit: '≤ 10%', status: '✓ Pass' },
        { recipe: '★ R-047', ingredient: 'Cyclopentasiloxane', inci: 'Cyclopentasiloxane',       pct: 12.0, role: 'Emollient',          limit: 'N/A',   status: '✓ Pass' },
        { recipe: '★ R-047', ingredient: 'Dimethicone',        inci: 'Dimethicone',              pct:  5.0, role: 'Skin feel agent',    limit: 'N/A',   status: '✓ Pass' },
        { recipe: '★ R-047', ingredient: 'Aqua',               inci: 'Aqua',                     pct: 54.1, role: 'Solvent base',       limit: 'N/A',   status: '✓ Pass' },
        { recipe: 'R-089',   ingredient: 'Zinc Oxide (nano)',  inci: 'Zinc Oxide',              pct: 14.8, role: 'Primary UV filter', limit: '≤ 25%', status: '✓ Pass' },
        { recipe: 'R-089',   ingredient: 'Titanium Dioxide',   inci: 'Titanium Dioxide',         pct:  9.0, role: 'Broad-spectrum UV',  limit: '≤ 25%', status: '✓ Pass' },
        { recipe: 'R-089',   ingredient: 'Avobenzone',         inci: 'Butyl Methoxydibenzoyl.', pct:  2.8, role: 'UVA organic filter', limit: '≤ 5%',  status: '✓ Pass' },
        { recipe: 'R-089',   ingredient: 'Octocrylene',        inci: 'Octocrylene',              pct:  2.0, role: 'UV stabilizer',      limit: '≤ 10%', status: '✓ Pass' },
        { recipe: 'R-089',   ingredient: 'Cyclopentasiloxane', inci: 'Cyclopentasiloxane',       pct: 14.0, role: 'Emollient',          limit: 'N/A',   status: '✓ Pass' },
        { recipe: 'R-089',   ingredient: 'Aqua',               inci: 'Aqua',                     pct: 57.4, role: 'Solvent base',       limit: 'N/A',   status: '✓ Pass' },
        { recipe: 'R-124',   ingredient: 'Zinc Oxide (nano)',  inci: 'Zinc Oxide',              pct: 15.5, role: 'Primary UV filter', limit: '≤ 25%', status: '✓ Pass' },
        { recipe: 'R-124',   ingredient: 'Titanium Dioxide',   inci: 'Titanium Dioxide',         pct:  8.0, role: 'Broad-spectrum UV',  limit: '≤ 25%', status: '✓ Pass' },
        { recipe: 'R-124',   ingredient: 'Avobenzone',         inci: 'Butyl Methoxydibenzoyl.', pct:  3.2, role: 'UVA organic filter', limit: '≤ 5%',  status: '✓ Pass' },
        { recipe: 'R-124',   ingredient: 'Aqua',               inci: 'Aqua',                     pct: 56.3, role: 'Solvent base',       limit: 'N/A',   status: '✓ Pass' },
      ],
    },
  },
  6: {
    chart: {
      title: 'Objective Achievement Summary — Lead Formulation R-047',
      subtitle: 'All 4 objectives satisfied · vs. baseline reference',
      type: 'bar',
      data: [
        { objective: 'SPF Value',    achieved: 52.3, target: 50.0, baseline: 35.5  },
        { objective: 'Water Res. %', achieved: 96.8, target: 90.0, baseline: 82.0  },
        { objective: 'Stability %',  achieved: 97.0, target: 97.0, baseline: 88.0  },
        { objective: 'Cost Index',   achieved: 88.0, target: 85.0, baseline: 100.0 },
      ],
      xAxisKey: 'objective',
      yAxisKeys: [
        { key: 'achieved', color: '#3F98FF', name: 'R-047 Achieved' },
        { key: 'target',   color: '#059669', name: 'Target'         },
        { key: 'baseline', color: '#94a3b8', name: 'Baseline'       },
      ],
    },
    table: {
      title: 'R&D Report — Full Results Summary',
      subtitle: 'Sunscreen SPF Optimization v1.0 · March 2026 · 24 pages',
      pinnedValue: 'Lead Formulation (R-047)',
      columns: [
        { key: 'section',  label: 'Section',        width: '180px'                               },
        { key: 'metric',   label: 'Metric',         width: '200px'                               },
        { key: 'target',   label: 'Target',         width: '120px', align: 'center'              },
        { key: 'achieved', label: 'Achieved',       width: '120px', align: 'center'              },
        { key: 'delta',    label: 'Δ vs. Baseline', width: '120px', align: 'right', trend: true  },
        { key: 'status',   label: 'Status',         width: '80px',  align: 'center', badge: true },
      ],
      rows: [
        { section: 'Lead Formulation (R-047)', metric: 'SPF Protection',         target: '≥ 50',    achieved: '52.3',     delta: '+47%', status: '✓ Pass' },
        { section: 'Lead Formulation (R-047)', metric: 'Water Resistance',        target: '> 90%',   achieved: '96.8%',    delta: '+18%', status: '✓ Pass' },
        { section: 'Lead Formulation (R-047)', metric: 'Stability at 24 months',  target: '≥ 97%',   achieved: '97.0%',    delta: '+10%', status: '✓ Pass' },
        { section: 'Lead Formulation (R-047)', metric: 'Production Cost Index',   target: 'Minimize',achieved: '−12%',     delta: '-12%', status: '✓ Pass' },
        { section: 'Predictive Model',         metric: 'R² Score',                target: '> 0.90',  achieved: '0.94',     delta: '+4%',  status: '✓ Pass' },
        { section: 'Predictive Model',         metric: 'RMSE (SPF units)',         target: '< 3.0',   achieved: '2.3',      delta: '—',    status: '✓ Pass' },
        { section: 'Predictive Model',         metric: 'Prediction Accuracy',      target: '> 95%',   achieved: '96.2%',    delta: '—',    status: '✓ Pass' },
        { section: 'Predictive Model',         metric: 'Training Samples',         target: '≥ 2,000', achieved: '2,447',    delta: '—',    status: '✓ Pass' },
        { section: 'Optimization',             metric: 'Pareto Candidates Found',  target: '≥ 20',    achieved: '47',       delta: '—',    status: '✓ Pass' },
        { section: 'Optimization',             metric: 'Iterations Run',           target: '1,000',   achieved: '1,000',    delta: '—',    status: '✓ Pass' },
        { section: 'Optimization',             metric: 'Convergence Score',        target: '≥ 95',    achieved: '98.2',     delta: '—',    status: '✓ Pass' },
        { section: 'Regulatory',               metric: 'EU Cosmetics Regulation',  target: 'Comply',  achieved: 'Compliant',delta: '—',    status: '✓ Pass' },
        { section: 'Regulatory',               metric: 'ZnO Concentration',        target: '≤ 25%',   achieved: '15.2%',    delta: '—',    status: '✓ Pass' },
        { section: 'Regulatory',               metric: 'Avobenzone Concentration', target: '≤ 5%',    achieved: '3.0%',     delta: '—',    status: '✓ Pass' },
      ],
    },
  },
};

/* ── Demo steps ─────────────────────────────────────────────── */

const DEMO_STEPS = [
  {
    stage: 3,
    userMsg: 'Train a gradient boosted ensemble model (XGBoost + Random Forest) to predict SPF using 5-fold cross-validation',
    aiMsg: '✅ **Model training complete.** XGBoost + Random Forest ensemble trained on 2,447 formulations (80/20 split).\n\n📊 **Performance:** R²=0.94, RMSE=2.3, Accuracy=96.2% on held-out test set\n\n🔑 **Top drivers:** Zinc Oxide % (SHAP=0.68), TiO₂ % (0.54), Avobenzone % (0.42)\n\n⚠️ Caution: Formulations with >12% TiO₂ show reduced long-term stability — flagged in SHAP analysis.\n\nModel is ready for multi-objective optimization.',
    newInsights: [
      { id: 'ins-model', type: 'model' as const,      title: 'Ensemble Model Trained',    message: 'XGBoost + Random Forest ensemble achieves R²=0.94 on 2,447 formulations. 5-fold CV confirms stability of predictions across feature space.',                                                confidence: 0.96, timestamp: 'Just now', isNew: true },
      { id: 'ins-shap',  type: 'prediction' as const, title: 'Key Predictor Identified', message: 'Zinc Oxide concentration is the dominant driver of SPF (SHAP=0.68, p<0.001). Increasing ZnO from 12→16% predicts a +8.4 SPF improvement.',                                                  confidence: 0.94, timestamp: 'Just now', isNew: true },
      { id: 'ins-warn',  type: 'warning' as const,    title: 'TiO₂ Stability Trade-off', message: 'SHAP analysis reveals >12% TiO₂ correlates with −0.18 long-term stability score. Recommend capping at 10% in optimization constraints.',                                                     confidence: 0.88, timestamp: 'Just now', isNew: true },
    ],
    modelMetrics: { r2Score: 0.94, rmse: 2.3, accuracy: 0.962, trainSamples: 2447, features: 18, modelType: 'XGBoost+RF' },
  },
  {
    stage: 4,
    userMsg: 'Run multi-objective Bayesian optimization across all 4 objectives: maximize SPF, water resistance, stability; minimize cost',
    aiMsg: '⚡ **Bayesian optimization complete — 1,000 iterations.** Explored 18-dimensional formulation space using Expected Improvement acquisition.\n\n🏆 **Results:** 47 Pareto-optimal candidates identified. Lead candidate **R-047** achieves:\n• SPF: 52.3 (+47% vs. baseline)\n• Water Resistance: 96.8%\n• Stability Index: 0.97 at 24 months\n• Cost: −12% vs. reference\n\nAll 4 objectives satisfied simultaneously. Recommend proceeding to recipe generation.',
    newInsights: [
      { id: 'ins-opt1', type: 'recommendation' as const, title: 'Lead Candidate: R-047',  message: 'R-047 achieves all 4 objectives simultaneously: SPF 52.3, WR 96.8%, Stability 97.0%, Cost −12%. This formulation sits at the Pareto frontier with the highest composite score.', confidence: 0.97, timestamp: 'Just now', isNew: true },
      { id: 'ins-opt2', type: 'prediction' as const,     title: '47 Pareto-Optimal Found',message: '47 formulations lie on the Pareto front. Top 3 differ primarily in ZnO:TiO₂ ratio. All achieve SPF ≥50 and water resistance ≥94%.', confidence: 0.95, timestamp: 'Just now', isNew: true },
    ],
  },
  {
    stage: 5,
    userMsg: 'Generate detailed formulation recipes for the top 3 Pareto-optimal candidates with full ingredient specifications',
    aiMsg: '🧪 **3 formulation recipes generated.** Full specifications with predicted performance bounds and synthesis notes:\n\n**R-047 (LEAD):** ZnO 15.2%, TiO₂ 8.5%, Avobenzone 3.0%, Octocrylene 2.2%, Cyclopentasiloxane 12.0%, Dimethicone 5.0%, Aqua q.s. → Predicted SPF 52.3 ±1.8 (95% CI)\n\n**R-089 (BACKUP 1):** Similar profile, lower ZnO (14.8%), better sensory properties\n\n**R-124 (BACKUP 2):** Higher ZnO (15.5%), marginally higher SPF prediction (51.8) with excellent stability\n\nAll 3 meet EU Cosmetics Regulation 1223/2009 UV filter concentration limits.',
    newInsights: [
      { id: 'ins-recipe', type: 'recommendation' as const, title: 'Ready for Wet Lab Validation', message: 'Top 3 recipes generated with full INCI specifications and synthesis notes. Recommend starting with R-047 (smallest batch: 500g) for in-vitro SPF testing per ISO 24444:2019.', confidence: 0.93, timestamp: 'Just now', isNew: true },
      { id: 'ins-reg',    type: 'info' as const,           title: 'Regulatory Compliance',         message: 'All 3 formulations comply with EU Cosmetics Regulation 1223/2009: ZnO ≤25%, TiO₂ ≤25%, Avobenzone ≤5%, Octocrylene ≤10%.', confidence: 0.99, timestamp: 'Just now', isNew: true },
    ],
  },
  {
    stage: 6,
    userMsg: 'Generate a comprehensive R&D report summarizing all analyses, model performance, optimization results, and top formulation recommendations',
    aiMsg: "📄 **Report generated: 'Sunscreen SPF Optimization — R&D Summary v1.0'**\n\n✅ 24 pages · 12 figures · 8 data tables · Executive summary included\n\n📋 **Contents:** Executive Summary · Dataset Analysis (n=2,450) · Model Performance (R²=0.94) · SHAP Interpretation · Bayesian Optimization Results · 3 Formulation Recipes · Regulatory Assessment · Appendix\n\n🔒 Report locked to project version. Ready for download as PDF or PPTX.",
    newInsights: [
      { id: 'ins-complete', type: 'prediction' as const, title: 'Optimization Complete ✓', message: 'All 6 workflow stages completed. 4/4 objectives achieved by lead formulation R-047. Time from project setup to validated recipe: ~35 minutes with Noble AI VIP.', confidence: 0.99, timestamp: 'Just now', isNew: true },
    ],
  },
];

/* ── Objectives ─────────────────────────────────────────────── */

const OBJECTIVES_BASE: Objective[] = [
  { id: 'o1', attribute: 'SPF Protection',    target: 'maximize', value: 50,            unit: '', priority: 'high',   status: 'active',  progress: 0 },
  { id: 'o2', attribute: 'Water Resistance',  target: 'maximize', value: '90%',         unit: '', priority: 'high',   status: 'active',  progress: 0 },
  { id: 'o3', attribute: 'Product Stability', target: 'maximize', value: '97% at 24M',         priority: 'medium', status: 'active',  progress: 0 },
  { id: 'o4', attribute: 'Production Cost',   target: 'minimize',                                priority: 'medium', status: 'pending', progress: 0 },
];

const OBJECTIVES_BY_STAGE: Record<number, Objective[]> = {
  2: OBJECTIVES_BASE.map((o) => ({ ...o, status: 'active' as const,   progress: 15  })),
  3: OBJECTIVES_BASE.map((o) => ({ ...o, status: 'active' as const,   progress: 45  })),
  4: [
    { ...OBJECTIVES_BASE[0], status: 'achieved', progress: 100, currentValue: '52.3'  },
    { ...OBJECTIVES_BASE[1], status: 'achieved', progress: 100, currentValue: '96.8%' },
    { ...OBJECTIVES_BASE[2], status: 'achieved', progress: 100, currentValue: '97.0%' },
    { ...OBJECTIVES_BASE[3], status: 'achieved', progress: 100, currentValue: '−12%'  },
  ],
  5: [
    { ...OBJECTIVES_BASE[0], status: 'achieved', progress: 100, currentValue: '52.3'  },
    { ...OBJECTIVES_BASE[1], status: 'achieved', progress: 100, currentValue: '96.8%' },
    { ...OBJECTIVES_BASE[2], status: 'achieved', progress: 100, currentValue: '97.0%' },
    { ...OBJECTIVES_BASE[3], status: 'achieved', progress: 100, currentValue: '−12%'  },
  ],
  6: [
    { ...OBJECTIVES_BASE[0], status: 'achieved', progress: 100, currentValue: '52.3'  },
    { ...OBJECTIVES_BASE[1], status: 'achieved', progress: 100, currentValue: '96.8%' },
    { ...OBJECTIVES_BASE[2], status: 'achieved', progress: 100, currentValue: '97.0%' },
    { ...OBJECTIVES_BASE[3], status: 'achieved', progress: 100, currentValue: '−12%'  },
  ],
};

const INITIAL_INSIGHTS: Insight[] = [
  { id: 'init-1', type: 'info',           title: 'Dataset Loaded',             message: '2,450 sunscreen formulations loaded from internal R&D database. 3 outliers removed (Mahalanobis distance >3σ). Data quality score: 98.8%.', confidence: 0.99, timestamp: '2 hours ago' },
  { id: 'init-2', type: 'recommendation', title: 'Key Correlation Found',      message: 'Strong positive correlation: ZnO ↔ SPF (r=0.82), TiO₂ ↔ Stability (r=0.74). These are the primary levers for optimization.', confidence: 0.91, timestamp: '1 hour ago'  },
  { id: 'init-3', type: 'warning',        title: 'Negative Correlation Alert', message: 'Emollient concentration negatively correlates with SPF (r=−0.35). High emollient content may reduce UV filter efficacy through dilution effects.', confidence: 0.87, timestamp: '1 hour ago'  },
];

const LIBRARY_ARTIFACTS: LibraryArtifact[] = [
  { id: 'lib-1', name: 'SPF Correlation Heatmap',       type: 'heatmap',    timestamp: '2h ago',    category: 'Analysis', size: '18×18'      },
  { id: 'lib-2', name: 'Historical Formulations Table', type: 'table',      timestamp: 'Yesterday', category: 'Data',     size: '2,450 rows' },
  { id: 'lib-3', name: 'Avobenzone Structure',          type: 'molecule',   timestamp: '3d ago',    category: 'Molecules'                    },
  { id: 'lib-4', name: 'Zinc Oxide Nanoparticle',       type: 'molecule',   timestamp: '3d ago',    category: 'Molecules'                    },
  { id: 'lib-5', name: 'Cost vs. Performance',          type: 'chart-bar',  timestamp: 'Last week', category: 'Analysis'                     },
  { id: 'lib-6', name: 'Regulatory Requirements EU',    type: 'text',       timestamp: 'Last week', category: 'Reports'                      },
  { id: 'lib-7', name: 'Surfactant CMC Dataset',        type: 'table',      timestamp: '2w ago',    category: 'Data',     size: '1,820 rows' },
  { id: 'lib-8', name: 'Previous SPF Model (v2)',       type: 'stats',      timestamp: '1mo ago',   category: 'Models'                       },
  { id: 'lib-9', name: 'Emollient Study Results',       type: 'chart-line', timestamp: '1mo ago',   category: 'Analysis'                     },
];

const REPORT_BUILDER_MESSAGE = 'Open the report builder so I can assemble a project report from generated charts and tables';

const QUICK_PROMPTS: Record<number, Array<{ label: string; message: string; emoji: string }>> = {
  2: [{ label: 'Generate formulation recipes', message: 'Generate detailed formulation recipes for the top 3 Pareto-optimal candidates with full ingredient specifications',                                                                 emoji: '🧪' }],
  3: [{ label: 'Run Bayesian optimization',    message: 'Run multi-objective Bayesian optimization across all 4 objectives: maximize SPF, water resistance, stability; minimize cost',                                                      emoji: '⚡' }],
  4: [{ label: 'Train predictive model',       message: 'Train a gradient boosted ensemble model (XGBoost + Random Forest) to predict SPF using 5-fold cross-validation',                                                                  emoji: '🤖' }],
  5: [{ label: 'Build R&D report',             message: REPORT_BUILDER_MESSAGE,                                                                                                                                               emoji: '📄' }],
  6: [],
};

/* ── Page component ─────────────────────────────────────────── */

export function WorkspacePage() {
  // Route params / location — must be first so initial state can use them
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // When navigating from the New Workspace creation modal, location.state carries the config
  const newWsState = id === 'new' && location.state
    ? location.state as { wsName?: string; description?: string; projectId?: string; modelId?: string; modelVersion?: string; columns?: 1 | 2 | 3 }
    : null;

  const [isSortPanelsOpen, setIsSortPanelsOpen] = useState(false);
  const [mpConfig, setMpConfig] = useState({
    projectId:    newWsState?.projectId    ?? '1',
    modelId:      newWsState?.modelId      ?? 'mdl-1',
    modelVersion: newWsState?.modelVersion ?? 'v3.0',
  });
  // Skip auto-open when we already picked model in creation modal
  const [isModelProjectOpen, setIsModelProjectOpen] = useState(!newWsState);
  const { demoStage, setDemoStage, saveReport, editingReport, setEditingReport } = useDemoStage();

  const projectName = id === 'new'
    ? (newWsState?.wsName ?? 'New Workspace')
    : (PROJECT_NAMES[id || '1'] || editingReport?.project || 'Workspace');

  const [hasRun,           setHasRun]           = useState(false);
  const [isLoading,        setIsLoading]         = useState(false);
  const [messages,         setMessages]          = useState<ChatMessage[]>([{
    id: 'init-msg', role: 'assistant',
    content: newWsState
      ? `👋 New workspace created! You're working on **${PROJECTS.find(p => p.id === newWsState.projectId)?.name ?? 'your project'}** with model **${MODELS.find(m => m.id === newWsState.modelId)?.label ?? 'your model'}** (${newWsState.modelVersion ?? ''}). The canvas is ready — use the Chat tab to kick off your analysis.`
      : '👋 Welcome to Noble AI VIP! This project has been initialized with 2,450 historical sunscreen formulations. Dataset analysis and correlation mapping are complete.\n\nObjectives are set: Maximize SPF ≥50, Water Resistance >90%, Stability, and minimize cost. Use the Chat tab to advance the workflow.',
    timestamp: 'Just now',
  }]);
  const [isAITyping,       setIsAITyping]        = useState(false);
  const [rightTab,         setRightTab]          = useState<'artifacts' | 'chat'>('chat');
  const [insights,         setInsights]          = useState<Insight[]>(INITIAL_INSIGHTS);
  const [modelMetrics,     setModelMetrics]      = useState<ModelMetrics | null>(null);
  const [recipesGenerated, setRecipesGenerated]  = useState(false);
  const [isGenerating,     setIsGenerating]      = useState(false);
  const [isReportBuilderOpen, setIsReportBuilderOpen] = useState(!!editingReport);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);
  const [objectives,       setObjectives]        = useState<Objective[]>(
    OBJECTIVES_BY_STAGE[2] || OBJECTIVES_BASE.map((o) => ({ ...o, status: 'active' as const, progress: 15 }))
  );

  // Multi-panel canvas state
  const [columnCount,  setColumnCount]  = useState<ColumnCount>(newWsState?.columns ?? 2);
  const [panelViews,   setPanelViews]   = useState<PanelView[]>(newWsState ? [] : ['live', 'table:live']);

  // Custom charts
  const [customCharts, setCustomCharts] = useState<Record<string, CustomChartConfig>>({});

  // ── Live-updating ─────────────────────────────────────────────────────────────
  // Single source of truth: objectiveWeights lives HERE in the page.
  // The slider onChange in the config panel calls setObjectiveWeights directly.
  // useMemo recomputes the chart data synchronously on every weight/constraint change.
  const [objectiveWeights, setObjectiveWeights] = useState<Record<string, number>>({
    o1: 80, o2: 80, o3: 55, o4: 55,
  });
  const [liveConstraints, setLiveConstraints] = useState<CfgConstraint[]>([]);

  // Always compute — the live panel always reflects the current weights.
  const liveStageResults = React.useMemo(
    () => computeLiveStageResults(objectives, objectiveWeights, liveConstraints, STAGE_RESULTS),
    [objectiveWeights, liveConstraints, objectives]
  );

  // Kept only for constraints (objectives weights are fully controlled above)
  const handleLiveConstraintsChange = React.useCallback(
    (constraints: CfgConstraint[]) => { setLiveConstraints(constraints); },
    []
  );

  // Helper to get panel labels for modal (must be after customCharts state)
  function getPanelLabel(panel: PanelView): string {
    if (panel.startsWith('table:')) {
      // @ts-ignore
      return TABLE_VIEW_META[panel]?.label || panel;
    }
    if (panel.startsWith('artifact:')) {
      const id = panel.slice('artifact:'.length);
      const art = LIBRARY_ARTIFACTS.find(a => a.id === id);
      return art ? art.name : panel;
    }
    if (panel.startsWith('custom:')) {
      const id = panel.slice('custom:'.length);
      return customCharts[id]?.name || 'Custom Chart';
    }
    // @ts-ignore
    return VIEW_META[panel]?.label || panel;
  }

  const panelLabels = panelViews.map(getPanelLabel);

  const [chartBuilderState, setChartBuilderState] = useState<{ open: boolean; panelIdx: number; editingId: string | null }>({
    open: false, panelIdx: 0, editingId: null,
  });
  const [tableSelectorOpen, setTableSelectorOpen] = useState(false);

  const handleOpenChartBuilder = useCallback((panelIdx: number, editingId?: string) => {
    setChartBuilderState({ open: true, panelIdx, editingId: editingId ?? null });
  }, []);

  const handleSaveCustomChart = useCallback((cfg: CustomChartConfig) => {
    setCustomCharts(prev => ({ ...prev, [cfg.id]: cfg }));
    setChartBuilderState(prev => {
      setPanelViews(pv => {
        const newPanel = `custom:${cfg.id}` as PanelView;
        // Only add if not already present
        if (pv.includes(newPanel)) return pv;
        const next = [...pv];
        next[prev.panelIdx] = newPanel;
        return next;
      });
      return { ...prev, open: false };
    });
  }, []);

  // Overload: if first arg is 'reorder', second arg is the new panelViews array
  const handleChangePanelView = useCallback((idxOrAction: number | 'reorder', viewOrArray: PanelView | PanelView[]) => {
    if (idxOrAction === 'reorder' && Array.isArray(viewOrArray)) {
      setPanelViews(viewOrArray);
    } else if (typeof idxOrAction === 'number' && typeof viewOrArray === 'string') {
      setPanelViews(prev => { const next = [...prev]; next[idxOrAction] = viewOrArray as PanelView; return next; });
    }
  }, []);

  const handleAddPanel = useCallback(() => {
    setPanelViews(prev => prev.includes('live') ? prev : [...prev, 'live']);
  }, []);

  const handleAddTablePanel = useCallback((view: PanelView) => {
    setPanelViews(prev => prev.includes(view) ? prev : [...prev, view]);
  }, []);

  const handleRemovePanel = useCallback((idx: number) => {
    setPanelViews(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  }, []);

  // Artifact canvas cards
  const [canvasCards, setCanvasCards] = useState<CanvasCard[]>([]);
  const cardZRef = useRef(10);

  const handleAddToCanvas = useCallback((artifactId: string) => {
    const artifact = LIBRARY_ARTIFACTS.find(a => a.id === artifactId);
    if (!artifact) return;
    cardZRef.current += 1;
    setCanvasCards(prev => {
      const col = prev.length % 3;
      const row = Math.floor(prev.length / 3);
      const newCard: CanvasCard = {
        id: `card-${Date.now()}`,
        artifactId,
        artifact,
        x: 20 + col * 185,
        y: 20 + row * 185,
        w: 168,
        h: 154,
        pinned: false,
        collapsed: false,
        zIndex: cardZRef.current,
      };
      return [...prev, newCard];
    });
  }, []);

  const handleRemoveCard = useCallback((cardId: string) => {
    setCanvasCards(prev => prev.filter(c => c.id !== cardId));
  }, []);

  const handleUpdateCard = useCallback((cardId: string, patch: Partial<CanvasCard>) => {
    setCanvasCards(prev => prev.map(c => c.id === cardId ? { ...c, ...patch } : c));
  }, []);

  const handleClearAll = useCallback(() => {
    setCanvasCards([]);
  }, []);

  const currentResults = (hasRun || STAGE_RESULTS[demoStage]) ? (STAGE_RESULTS[demoStage] ?? null) : null;
  // Live panel is always available since liveStageResults[4] always has computed data
  const effectiveHasRun = hasRun || !!liveStageResults[4];

  const handleSendMessage = useCallback((content: string) => {
    if (isAITyping) return;
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content, timestamp: 'Just now' };
    setMessages((prev) => [...prev, userMsg]);

    if (content === REPORT_BUILDER_MESSAGE) {
      setRightTab('chat');
      setTimeout(() => {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: '📄 Opening the report builder. You can now assemble a Confluence-style project report and insert generated charts or tables into each section.',
          timestamp: 'Just now',
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsReportBuilderOpen(true);
      }, 250);
      return;
    }

    setIsAITyping(true);
    setIsLoading(true);

    const step = DEMO_STEPS.find((s) => s.userMsg === content);

    setTimeout(() => {
      const aiContent = step?.aiMsg ||
        `I'll analyze that request. Based on the current formulation dataset and optimization framework, I can generate relevant insights. Let me process your query against the 2,450 historical formulations...`;
      const aiMsg: ChatMessage = { id: `ai-${Date.now()}`, role: 'assistant', content: aiContent, timestamp: 'Just now' };
      setMessages((prev) => [...prev, aiMsg]);
      setIsAITyping(false);

      if (step) {
        setTimeout(() => {
          setInsights((prev) => [
            ...step.newInsights.map((i) => ({ ...i, isNew: true })),
            ...prev.map((i) => ({ ...i, isNew: false })),
          ]);
          if ('modelMetrics' in step && step.modelMetrics) setModelMetrics(step.modelMetrics as ModelMetrics);
          setDemoStage(step.stage);
          if (step.stage >= 5) setRecipesGenerated(true);
          const nextObjectives = OBJECTIVES_BY_STAGE[step.stage];
          if (nextObjectives) setObjectives(nextObjectives);
          setHasRun(true);
          setIsLoading(false);
          setTimeout(() => setInsights((prev) => prev.map((i) => ({ ...i, isNew: false }))), 4000);
        }, 600);
      } else {
        setIsLoading(false);
      }
    }, 1800);
  }, [isAITyping, setDemoStage]);

  const handleResetDemo = useCallback(() => {
    setDemoStage(2);
    setHasRun(false);
    setIsLoading(false);
    setRecipesGenerated(false);
    setIsGenerating(false);
    setIsReportBuilderOpen(false);
    setMessages([{
      id: 'init-msg', role: 'assistant',
      content: '👋 Welcome to Noble AI VIP! This project has been initialized with 2,450 historical sunscreen formulations. Dataset analysis and correlation mapping are complete.\n\nObjectives are set: Maximize SPF ≥50, Water Resistance >90%, Stability, and minimize cost. Use the Chat tab to advance the workflow.',
      timestamp: '2 hours ago',
    }]);
    setInsights(INITIAL_INSIGHTS);
    setModelMetrics(null);
    setObjectives(OBJECTIVES_BY_STAGE[2] || OBJECTIVES_BASE.map((o) => ({ ...o, status: 'active' as const, progress: 15 })));
    setRightTab('chat');
    setCustomCharts({});
    setChartBuilderState({ open: false, panelIdx: 0, editingId: null });
    setColumnCount(1);
    setPanelViews(['live']);
  }, [setDemoStage]);

  const handleGenerateRecipes = useCallback(() => {
    if (isAITyping || isGenerating) return;
    setIsGenerating(true);
    const recipeStep = DEMO_STEPS.find((s) => s.stage === 5)!;
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: recipeStep.userMsg, timestamp: 'Just now' };
    setMessages((prev) => [...prev, userMsg]);
    setIsAITyping(true);
    setIsLoading(true);
    setRightTab('chat');
    setTimeout(() => {
      const aiMsg: ChatMessage = { id: `ai-${Date.now()}`, role: 'assistant', content: recipeStep.aiMsg, timestamp: 'Just now' };
      setMessages((prev) => [...prev, aiMsg]);
      setIsAITyping(false);
      setTimeout(() => {
        setInsights((prev) => [
          ...recipeStep.newInsights.map((i) => ({ ...i, isNew: true })),
          ...prev.map((i) => ({ ...i, isNew: false })),
        ]);
        setDemoStage(5);
        const nextObjectives = OBJECTIVES_BY_STAGE[5];
        if (nextObjectives) setObjectives(nextObjectives);
        setHasRun(true);
        setIsLoading(false);
        setIsGenerating(false);
        setRecipesGenerated(true);
        setPanelViews(['live', 'table:live']);
        setTimeout(() => setInsights((prev) => prev.map((i) => ({ ...i, isNew: false }))), 4000);
      }, 600);
    }, 2000);
  }, [isAITyping, isGenerating, setDemoStage]);

  // Silent re-run triggered by objective/constraint changes (no chat messages — data
  // already recomputes via useMemo; this just shows the "Generating…" spinner).
  const handleSilentRegenerate = useCallback(() => {
    if (isAITyping || isGenerating) return;
    setIsGenerating(true);
    setTimeout(() => {
      setHasRun(true);
      setRecipesGenerated(true);
      setPanelViews(['live', 'table:live']);
      setIsGenerating(false);
    }, 800);
  }, [isAITyping, isGenerating]);

  // Auto-regen: debounce 800 ms after the user stops moving a slider / toggling a constraint.
  // Only fires after the first manual run so the initial state is not disrupted.
  const autoRegenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasRun) return; // wait for first manual run
    if (autoRegenTimerRef.current) clearTimeout(autoRegenTimerRef.current);
    autoRegenTimerRef.current = setTimeout(() => {
      handleSilentRegenerate();
    }, 800);
    return () => {
      if (autoRegenTimerRef.current) clearTimeout(autoRegenTimerRef.current);
    };
  }, [objectiveWeights, liveConstraints]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenReportBuilder = useCallback(() => {
    if (!hasRun) return;
    setIsReportBuilderOpen(true);
  }, [hasRun]);

  const quickPrompts = QUICK_PROMPTS[demoStage] || [];
  const newInsightCount = insights.filter((i) => i.isNew).length;
  const canOpenReportBuilder = hasRun;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#1a1a2e]">

      {/* Sort Panels Modal (button moved to top bar) */}
      {/* Sort Panels Modal */}
      <SortPanelsModal
        open={isSortPanelsOpen}
        onClose={() => setIsSortPanelsOpen(false)}
        panelViews={panelViews}
        panelLabels={panelLabels}
        onReorder={(newOrder) => handleChangePanelView('reorder', newOrder as PanelView[])}
      />

      {/* Model & Project selection modal */}
      <ModelProjectModal
        isOpen={isModelProjectOpen}
        onClose={() => setIsModelProjectOpen(false)}
        onConfirm={(pId, mId, mVer) => setMpConfig({ projectId: pId, modelId: mId, modelVersion: mVer })}
        defaultProjectId={mpConfig.projectId}
        defaultModelId={mpConfig.modelId}
        defaultModelVersion={mpConfig.modelVersion}
      />

      {/* ── Top Titlebar ──────────────────────────────────────── */}
      <div className="h-11 bg-[#1a1a2e] border-b border-white/[0.08] flex items-center justify-between px-3 shrink-0 z-50">

        {/* Left: Logo + breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-white/10 transition-colors group shrink-0"
            title="Back to Projects"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-[#3F98FF] via-[#2563eb] to-[#7c3aed] rounded-md flex items-center justify-center shadow-lg">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-white/70 group-hover:text-white text-xs font-medium transition-colors hidden sm:block">Noble AI</span>
          </button>

          <span className="text-white/25 text-sm">/</span>

          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-white/10 transition-colors text-white/50 hover:text-white/80 text-xs"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:block">Projects</span>
          </button>

          <span className="text-white/25 text-sm">/</span>

          <div className="flex items-center gap-1.5 px-1.5 py-1">
            <FlaskConical className="w-3.5 h-3.5 text-[#3F98FF] shrink-0" />
            <span className="text-white text-xs font-semibold truncate max-w-[200px]">{projectName}</span>
          </div>

          <span className="text-white/25 text-sm">/</span>
          <span className="text-white/40 text-xs px-1.5">Workspace</span>
        </div>

        {/* Center: Model & Project chip */}
        <button
          onClick={() => setIsModelProjectOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
          title="Change model or project"
        >
          <BrainCircuit className="w-3 h-3 text-[#3F98FF] shrink-0" />
          <span className="text-[11px] font-semibold text-white/80 group-hover:text-white truncate max-w-[160px]">
            {MODELS.find((m) => m.id === mpConfig.modelId)?.label ?? mpConfig.modelId}
          </span>
          <span className="text-[9px] font-mono text-white/35">{mpConfig.modelVersion}</span>
          <span className="text-white/20 text-xs">·</span>
          <FolderOpen className="w-3 h-3 text-white/35 shrink-0" />
          <span className="text-[10px] text-white/40 group-hover:text-white/60 truncate max-w-[120px] hidden md:block">
            {PROJECTS.find((p) => p.id === mpConfig.projectId)?.name ?? '—'}
          </span>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-green-400 hidden sm:block">Live</span>
          </div>

          <div className="w-px h-4 bg-white/10" />

          {/* Layout toggle */}
          <LayoutToggle
            value={columnCount}
            onChange={setColumnCount}
            panelCount={panelViews.length}
            onAddPanel={handleAddPanel}
          />

          <div className="w-px h-4 bg-white/10" />

          <button
            onClick={() => {
              if (!hasRun) return;
              const newIdx = panelViews.length;
              handleAddPanel();
              setChartBuilderState({ open: true, panelIdx: newIdx, editingId: null });
            }}
            disabled={!hasRun}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold border rounded-md transition-all disabled:cursor-not-allowed disabled:opacity-45 disabled:text-white/30 disabled:border-white/10 disabled:bg-transparent text-[#3F98FF] hover:text-white hover:bg-[#3F98FF] border-[#3F98FF]/30 hover:border-[#3F98FF]"
            title={hasRun ? 'Add a custom chart panel' : 'Generate predictions first'}
          >
            <PlusCircle className="w-3 h-3" />
            <span className="hidden sm:block">New Chart</span>
          </button>

          <button
            onClick={() => hasRun && setTableSelectorOpen(true)}
            disabled={!hasRun}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold border rounded-md transition-all disabled:cursor-not-allowed disabled:opacity-45 disabled:text-white/30 disabled:border-white/10 disabled:bg-transparent text-emerald-400 hover:text-white hover:bg-emerald-500 border-emerald-500/30 hover:border-emerald-500"
            title={hasRun ? 'Add a data table panel' : 'Generate predictions first'}
          >
            <Table2 className="w-3 h-3" />
            <span className="hidden sm:block">New Table</span>
          </button>

          <button
            onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title={isConfigPanelOpen ? 'Hide config' : 'Show config'}
          >
            {isConfigPanelOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            <span className="hidden sm:block">Config</span>
          </button>

          <button
            onClick={handleResetDemo}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:block">Reset</span>
          </button>


          <button
            onClick={handleOpenReportBuilder}
            disabled={!canOpenReportBuilder}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors disabled:cursor-not-allowed disabled:text-white/25 disabled:hover:bg-transparent"
            title={canOpenReportBuilder ? 'Open the report builder' : 'Generate predictions first'}
          >
            <Package className="w-3 h-3" />
            <span className="hidden sm:block">Build Report</span>
          </button>

          <button
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            onClick={() => setIsSortPanelsOpen(true)}
            title="Sort Panels"
          >
            <span className="w-3 h-3">≡</span>
            <span className="hidden sm:block">Sort Panels</span>
          </button>

          <button className="flex items-center gap-1 px-2 py-1 text-[11px] text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors">
            <Share2 className="w-3 h-3" />
            <span className="hidden sm:block">Share</span>
          </button>

        </div>
      </div>

      {/* ── Main Workspace Body ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left: Chat / Insights / Library */}
        <div className="w-[300px] shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-200 shrink-0">
            <button
              className={`flex-1 flex items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${rightTab === 'chat' ? 'text-[#3F98FF] border-b-2 border-[#3F98FF] bg-blue-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setRightTab('chat')}
            >
              <MessageSquare className="w-3 h-3" />
              Chat
              {isAITyping && rightTab !== 'chat' && (
                <span className="w-1.5 h-1.5 bg-[#3F98FF] rounded-full animate-pulse ml-0.5" />
              )}
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${rightTab === 'artifacts' ? 'text-[#3F98FF] border-b-2 border-[#3F98FF] bg-blue-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setRightTab('artifacts')}
            >
              <Package className="w-3 h-3" />
              Library
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {rightTab === 'artifacts' ? (
              <ArtifactsLibrary artifacts={LIBRARY_ARTIFACTS} onAddToCanvas={handleAddToCanvas} />
            ) : (
              <SideChatPanel
                messages={messages}
                isAITyping={isAITyping}
                quickPrompts={quickPrompts}
                onSendMessage={handleSendMessage}
                isGenerating={isGenerating}
                recipesGenerated={recipesGenerated}
                onGenerateRecipes={handleGenerateRecipes}
              />
            )}
          </div>
        </div>

        {/* Center: Results */}
        <div className="flex-1 overflow-hidden min-w-0 flex flex-col">
          <WorkspaceCanvas
            columnCount={columnCount}
            stageResults={liveStageResults}
            currentStage={demoStage}
            isLoading={isLoading}
            hasRun={effectiveHasRun}
            liveActive={true}
            panelViews={panelViews}
            onChangePanelView={handleChangePanelView}
            onAddPanel={handleAddPanel}
            onRemovePanel={handleRemovePanel}
            canvasCards={canvasCards}
            onRemoveCard={handleRemoveCard}
            onUpdateCard={handleUpdateCard}
            onClearAll={handleClearAll}
            libraryArtifacts={LIBRARY_ARTIFACTS}
            onAddToCanvas={handleAddToCanvas}
            customCharts={customCharts}
            onOpenChartBuilder={handleOpenChartBuilder}
            onRequestPanelChange={(idx, panel) => {
              if (typeof panel === 'string' && panel.startsWith('table:')) {
                setTableSelectorOpen(true);
                // Optionally store idx for later use if you want to change a specific slot
              } else if (typeof panel === 'string' && (panel.startsWith('custom:') || panel === 'live')) {
                setChartBuilderState({ open: true, panelIdx: idx, editingId: panel.startsWith('custom:') ? panel.slice('custom:'.length) : null });
              } else {
                // For artifact or other types, you can add logic or disable the button
              }
            }}
          />
        </div>

        {/* Right: Config Panel */}
        {isConfigPanelOpen && (
          <div className="w-[260px] shrink-0 transition-all duration-300 border-l border-gray-200">
            <WorkspaceConfigPanel
              objectives={objectives}
              isLocked={demoStage >= 1}
              insights={insights}
              modelMetrics={modelMetrics}
              projectId={mpConfig.projectId}
              modelId={mpConfig.modelId}
              modelVersion={mpConfig.modelVersion}
              onModelProjectChange={(pId, mId, mVer) => setMpConfig({ projectId: pId, modelId: mId, modelVersion: mVer })}
              objectiveWeights={objectiveWeights}
              onWeightChange={(id, val) => setObjectiveWeights(prev => ({ ...prev, [id]: val }))}
              onWeightsChange={(w) => setObjectiveWeights(w)}
              onConstraintsChange={handleLiveConstraintsChange}
            />
          </div>
        )}
      </div>

      {/* ── Custom Chart Builder Modal ──────────────────────── */}
      <ChartBuilderModal
        isOpen={chartBuilderState.open}
        onClose={() => setChartBuilderState(prev => ({ ...prev, open: false }))}
        onSave={handleSaveCustomChart}
        currentStage={demoStage}
        hasRun={hasRun}
        stageResults={STAGE_RESULTS}
        editingConfig={chartBuilderState.editingId ? customCharts[chartBuilderState.editingId] : null}
      />

      <TableSelectorModal
        isOpen={tableSelectorOpen}
        onClose={() => setTableSelectorOpen(false)}
        onConfirm={(view) => {
          handleAddTablePanel(view);
          setTableSelectorOpen(false);
        }}
        currentStage={demoStage}
        hasRun={hasRun}
        libraryArtifacts={LIBRARY_ARTIFACTS}
        panelViews={panelViews}
      />

      <ReportBuilderDialog
        open={isReportBuilderOpen}
        onOpenChange={(open) => {
          setIsReportBuilderOpen(open);
          if (!open && editingReport) setEditingReport(null);
        }}
        projectName={projectName}
        currentStage={demoStage}
        hasRun={hasRun}
        stageResults={STAGE_RESULTS}
        customCharts={customCharts}
        onSaveReport={saveReport}
        initialReport={editingReport}
      />
    </div>
  );
}

type ReportAsset = {
  id: string;
  kind: 'chart' | 'table';
  title: string;
  subtitle: string;
  source: string;
  chart?: ChartConfig;
  table?: TableConfig;
};

type ReportBlock = {
  id: string;
  kind: 'text' | 'chart' | 'table';
  content?: string;
  assetId?: string;
  caption?: string;
};

type ReportSection = {
  id: string;
  title: string;
  summary: string;
  blocks: ReportBlock[];
};

function createReportId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createStarterSections(projectName: string): ReportSection[] {
  return [
    {
      id: createReportId('section'),
      title: 'Executive Summary',
      summary: `${projectName} report draft. Capture the overall objective, what the model learned, and the main recommendation.`,
      blocks: [
        {
          id: createReportId('block'),
          kind: 'text',
          content: 'Summarize the project context, the primary optimization goal, and what decision the team should take next.',
        },
      ],
    },
    {
      id: createReportId('section'),
      title: 'Analysis Evidence',
      summary: 'Add charts, validation tables, and interpretation notes that support the recommendation.',
      blocks: [],
    },
  ];
}

function buildReportAssets(
  currentStage: number,
  hasRun: boolean,
  stageResults: Record<number, { chart: ChartConfig; table: TableConfig }>,
  customCharts: Record<string, CustomChartConfig>,
): ReportAsset[] {
  if (!hasRun) return [];

  const stageLabels: Record<number, string> = {
    3: 'Model Validation',
    4: 'Pareto Front',
    5: 'Recipe Candidates',
    6: 'Report Summary',
  };

  const assets: ReportAsset[] = [];

  Object.entries(stageResults).forEach(([stageKey, result]) => {
    const stage = Number(stageKey);
    if (stage > currentStage || !result) return;
    const source = `Stage ${stage} · ${stageLabels[stage] ?? 'Analysis'}`;
    assets.push({
      id: `stage-chart-${stage}`,
      kind: 'chart',
      title: result.chart.title,
      subtitle: result.chart.subtitle,
      source,
      chart: result.chart,
    });
    assets.push({
      id: `stage-table-${stage}`,
      kind: 'table',
      title: result.table.title,
      subtitle: result.table.subtitle,
      source,
      table: result.table,
    });
  });

  Object.values(customCharts).forEach((customChart) => {
    const resolved = resolveCustomChart(customChart, stageResults, currentStage, hasRun);
    if (!resolved) return;
    assets.push({
      id: `custom-chart-${customChart.id}`,
      kind: 'chart',
      title: customChart.name,
      subtitle: resolved.subtitle,
      source: 'Custom Chart',
      chart: resolved,
    });
  });

  return assets;
}

function ReportBuilderDialog({
  open,
  onOpenChange,
  projectName,
  currentStage,
  hasRun,
  stageResults,
  customCharts,
  onSaveReport,
  initialReport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  currentStage: number;
  hasRun: boolean;
  stageResults: Record<number, { chart: ChartConfig; table: TableConfig }>;
  customCharts: Record<string, CustomChartConfig>;
  onSaveReport: (report: SavedReport) => void;
  initialReport?: SavedReport | null;
}) {
  // Reset state when dialog closes so example always loads on open
  useEffect(() => {
    if (!open) {
      setReportTitle(`${projectName} — Analysis Report`);
      setReportBodyHtml('');
      if (editorRef.current) editorRef.current.innerHTML = '';
    }
  }, [open, projectName]);
  const [reportTitle, setReportTitle] = useState(`${projectName} Report`);
  const [reportBodyHtml, setReportBodyHtml] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const chartRootsRef = useRef<Map<string, { host: HTMLElement; root: Root }>>(new Map());
  const savedRangeRef = useRef<Range | null>(null);

  const buildTableHtml = (table: TableConfig, maxCols = 6, maxRows = 6) => {
    const columns = table.columns.slice(0, maxCols);
    const rows = table.rows.slice(0, maxRows);
    const head = columns.map((c) => `<th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:left;background:#f8fafc;font-size:12px;color:#334155;">${String(c.label)}</th>`).join('');
    const body = rows.map((row) => {
      const cells = columns.map((c) => `<td style="border:1px solid #e2e8f0;padding:6px 8px;font-size:12px;color:#334155;">${String(row[c.key] ?? '')}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  };

  const buildChartEmbed = (assetId: string, embedId: string) => `
    <div contenteditable="false" data-asset-id="${assetId}" data-asset-kind="chart" data-embed-id="${embedId}" style="margin:16px 0;position:relative;">
      <button type="button" data-remove-embed="true" aria-label="Remove chart" style="position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#ffffff;color:#64748b;font-size:14px;line-height:22px;cursor:pointer;">×</button>
      <div data-chart-host="true" data-embed-id="${embedId}" style="height:300px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;padding:10px;"></div>
    </div>
    <p><br></p>
  `;

  const buildTableEmbed = (assetId: string, table: TableConfig) => `
    <div contenteditable="false" data-asset-id="${assetId}" data-asset-kind="table" style="margin:16px 0;overflow:auto;position:relative;">
      <button type="button" data-remove-embed="true" aria-label="Remove table" style="position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#ffffff;color:#64748b;font-size:14px;line-height:22px;cursor:pointer;">×</button>
      ${buildTableHtml(table)}
    </div>
    <p><br></p>
  `;

  const buildExampleReportHtml = (name: string, stage: number) => {
    const modelResult = stageResults[3];
    const paretoResult = stageResults[4];
    const recipeResult = stageResults[5];
    const summaryResult = stageResults[6];

    const chartEmbed1 = modelResult ? buildChartEmbed('stage-chart-3', `example-chart-${Date.now()}-a`) : '';
    const tableEmbed1 = modelResult ? buildTableEmbed('stage-table-3', modelResult.table) : '';
    const chartEmbed2 = paretoResult ? buildChartEmbed('stage-chart-4', `example-chart-${Date.now()}-b`) : '';
    const tableEmbed2 = recipeResult ? buildTableEmbed('stage-table-5', recipeResult.table) : '';
    const chartEmbed3 = summaryResult ? buildChartEmbed('stage-chart-6', `example-chart-${Date.now()}-c`) : '';

    return `
    <h1>${name} — Analysis Report</h1>
    <p>This report presents the complete analysis for <strong>${name}</strong> at <strong>Stage ${stage}</strong>, including model validation, optimization results, and formulation recommendations.</p>
    <h2>1) Executive Summary</h2>
    <p>An XGBoost + Random Forest ensemble model was trained on 2,447 sunscreen formulations achieving <strong>R²=0.94</strong> and <strong>RMSE=2.3</strong>. Multi-objective Bayesian optimization identified <strong>47 Pareto-optimal candidates</strong>, with lead formulation <strong>R-047</strong> achieving:</p>
    <ul>
      <li><strong>SPF 52.3</strong> (+47% vs. baseline)</li>
      <li><strong>Water Resistance 96.8%</strong> (target: >90%)</li>
      <li><strong>Stability 97.0%</strong> at 24 months</li>
      <li><strong>Cost reduction of 12%</strong> vs. reference formulation</li>
    </ul>
    <p>All four project objectives have been met simultaneously. We recommend proceeding to wet-lab validation of the top 3 candidates.</p>
    <h2>2) Model Validation</h2>
    <p>The chart below shows predicted vs. actual SPF values across the held-out test set (n=490). The model demonstrates strong predictive accuracy with minimal systematic bias.</p>
    ${chartEmbed1}
    <p>The full prediction results are summarized in the table below. All formulations pass with absolute errors well within the 95% confidence intervals.</p>
    ${tableEmbed1}
    <h2>3) Optimization Results</h2>
    <p>Bayesian optimization across 1,000 iterations explored the 18-dimensional formulation space. The chart below shows the top Pareto-optimal candidates ranked by multi-objective score.</p>
    ${chartEmbed2}
    <h2>4) Top Formulation Recipes</h2>
    <p>Full ingredient specifications for the top 3 candidates, all compliant with EU Cosmetics Regulation 1223/2009:</p>
    ${tableEmbed2}
    <h2>5) Objective Achievement Summary</h2>
    <p>The following chart confirms that lead formulation R-047 meets or exceeds all four project objectives compared to the baseline formulation.</p>
    ${chartEmbed3}
    <h2>6) Recommendations and Next Steps</h2>
    <ol>
      <li><strong>Synthesize R-047</strong> — 500g batch for in-vitro SPF testing per ISO 24444:2019</li>
      <li><strong>Validate R-089 and R-124</strong> as backup candidates in parallel</li>
      <li><strong>Submit regulatory pre-assessment</strong> for EU market clearance</li>
      <li><strong>Schedule stability testing</strong> — 6-month accelerated aging protocol</li>
    </ol>
    <h2>7) Appendix</h2>
    <p>Model: XGBoost + RF Ensemble v3.0 · Training data: 2,447 formulations · 5-fold cross-validation · SHAP feature attribution analysis available on request.</p>
    <p><br></p>
  `;
  };

  const loadExampleReportTemplate = () => {
    const template = buildExampleReportHtml(projectName, currentStage);
    setReportTitle(`${projectName} — Analysis Report`);
    setReportBodyHtml(template);
    if (editorRef.current) {
      editorRef.current.innerHTML = template;
    }
  };

  useEffect(() => {
    if (initialReport?.contentHtml) {
      setReportTitle(initialReport.title);
      setReportBodyHtml(initialReport.contentHtml);
      if (editorRef.current) {
        editorRef.current.innerHTML = initialReport.contentHtml;
      }
    } else {
      // Only load the example if the editor is empty or just opened
      const plainText = plainTextFromHtml(reportBodyHtml);
      if (!plainText || plainText.length === 0 || open) {
        setReportTitle(`${projectName} — Analysis Report`);
        const starterHtml = buildExampleReportHtml(projectName, currentStage);
        setReportBodyHtml(starterHtml);
        if (editorRef.current) {
          editorRef.current.innerHTML = starterHtml;
        }
      }
    }
  }, [projectName, currentStage, open]);

  // Always compute assets so embedded charts in the template can render
  const assets = React.useMemo(
    () => buildReportAssets(currentStage, true, stageResults, customCharts),
    [currentStage, stageResults, customCharts],
  );

  const plainTextFromHtml = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return (temp.textContent || temp.innerText || '').trim();
  };

  const isEditorEmpty = plainTextFromHtml(reportBodyHtml).length === 0;

  const saveSelectionRange = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    const anchorNode = selection.anchorNode;
    if (anchorNode && editorRef.current.contains(anchorNode)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const restoreSelectionRange = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    const saved = savedRangeRef.current;
    if (saved) {
      selection.removeAllRanges();
      selection.addRange(saved);
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const insertListAtSelection = (ordered: boolean) => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    const selectedText = selection.toString().replace(/\r/g, '');
    const tag = ordered ? 'ol' : 'ul';
    const items = selectedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const html = items.length > 0
      ? `<${tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}><p><br></p>`
      : `<${tag}><li>List item</li></${tag}><p><br></p>`;

    document.execCommand('insertHTML', false, html);

    const insertedLists = editorRef.current.querySelectorAll(tag);
    const latestList = insertedLists[insertedLists.length - 1];
    const firstItem = latestList?.querySelector('li');
    if (!firstItem) return;

    const range = document.createRange();
    range.selectNodeContents(firstItem);
    selection.removeAllRanges();
    selection.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };

  const applyTextCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    restoreSelectionRange();

    if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
      insertListAtSelection(command === 'insertOrderedList');
    } else {
      document.execCommand(command, false, value);
    }

    saveSelectionRange();
    setReportBodyHtml(editorRef.current?.innerHTML ?? reportBodyHtml);
  };

  const insertAssetAtCursor = (asset: ReportAsset) => {
    editorRef.current?.focus();

    let blockHtml = '';

    if (asset.kind === 'chart' && asset.chart) {
      const embedId = createReportId('chart-embed');
      blockHtml = `
        <div contenteditable="false" data-asset-id="${asset.id}" data-asset-kind="chart" data-embed-id="${embedId}" style="margin:16px 0;position:relative;">
          <button type="button" data-remove-embed="true" aria-label="Remove chart" style="position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#ffffff;color:#64748b;font-size:14px;line-height:22px;cursor:pointer;">×</button>
          <div data-chart-host="true" data-embed-id="${embedId}" style="height:300px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;padding:10px;"></div>
        </div>
        <p><br></p>
      `;
    } else if (asset.kind === 'table' && asset.table) {
      const columns = asset.table.columns.slice(0, 6);
      const rows = asset.table.rows.slice(0, 6);
      const head = columns.map((column) => `<th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:left;background:#f8fafc;font-size:12px;color:#334155;">${String(column.label)}</th>`).join('');
      const body = rows.map((row) => {
        const cells = columns.map((column) => `<td style="border:1px solid #e2e8f0;padding:6px 8px;font-size:12px;color:#334155;">${String(row[column.key] ?? '')}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');

      blockHtml = `
        <div contenteditable="false" data-asset-id="${asset.id}" data-asset-kind="table" style="margin:16px 0;overflow:auto;position:relative;">
          <button type="button" data-remove-embed="true" aria-label="Remove table" style="position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#ffffff;color:#64748b;font-size:14px;line-height:22px;cursor:pointer;">×</button>
          <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;"> 
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
        <p><br></p>
      `;
    }

    if (!blockHtml) return;

    document.execCommand('insertHTML', false, blockHtml);
    setReportBodyHtml(editorRef.current?.innerHTML ?? reportBodyHtml);
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const hosts = editor.querySelectorAll<HTMLElement>('[data-chart-host="true"]');
    const activeEmbedIds = new Set<string>();

    hosts.forEach((host) => {
      const embedId = host.getAttribute('data-embed-id');
      const wrapper = host.closest('[data-asset-id]') as HTMLElement | null;
      const assetId = wrapper?.getAttribute('data-asset-id');
      if (!embedId || !assetId) return;

      const asset = assets.find((candidate) => candidate.id === assetId);
      if (!asset || asset.kind !== 'chart' || !asset.chart) return;

      activeEmbedIds.add(embedId);
      const existing = chartRootsRef.current.get(embedId);

      if (existing && existing.host === host) {
        existing.root.render(<ResultChart config={asset.chart} />);
        return;
      }

      if (existing) {
        existing.root.unmount();
        chartRootsRef.current.delete(embedId);
      }

      const root = createRoot(host);
      root.render(<ResultChart config={asset.chart} />);
      chartRootsRef.current.set(embedId, { host, root });
    });

    Array.from(chartRootsRef.current.entries()).forEach(([embedId, mounted]) => {
      if (!activeEmbedIds.has(embedId)) {
        mounted.root.unmount();
        chartRootsRef.current.delete(embedId);
      }
    });
  }, [assets, reportBodyHtml, open]);

  useEffect(() => () => {
    Array.from(chartRootsRef.current.values()).forEach((mounted) => mounted.root.unmount());
    chartRootsRef.current.clear();
  }, []);

  const inferReportType = (stage: number, textContent: string): SavedReport['type'] => {
    const lower = textContent.toLowerCase();
    if (lower.includes('regulatory') || lower.includes('compliance')) return 'regulatory';
    if (lower.includes('model') || lower.includes('validation') || stage === 3) return 'model';
    if (lower.includes('candidate') || lower.includes('recipe') || stage >= 5) return 'experiment';
    if (lower.includes('summary') || lower.includes('quarterly')) return 'project';
    return 'analysis';
  };

  const extractReportSections = (html: string, fallbackSummary: string): { title: string; preview: string }[] => {
    const root = document.createElement('div');
    root.innerHTML = html;

    const sections: { title: string; preview: string }[] = [];
    let currentTitle = '';
    let currentText = '';

    Array.from(root.children).forEach((node) => {
      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();

      if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
        if (currentTitle || currentText) {
          sections.push({
            title: currentTitle || 'Section',
            preview: (currentText.trim() || fallbackSummary).slice(0, 180),
          });
        }
        currentTitle = (element.textContent || '').trim();
        currentText = '';
        return;
      }

      const text = (element.textContent || '').trim();
      if (text) currentText += `${text} `;
    });

    if (currentTitle || currentText) {
      sections.push({
        title: currentTitle || 'Section',
        preview: (currentText.trim() || fallbackSummary).slice(0, 180),
      });
    }

    if (sections.length > 0) return sections.slice(0, 6);

    return [{ title: 'Executive Summary', preview: fallbackSummary.slice(0, 180) }];
  };

  const buildReportTags = (project: string, reportType: SavedReport['type'], embedCount: number): string[] => {
    const words = project
      .split(/\s+/)
      .map((word) => word.replace(/[^a-zA-Z0-9]/g, ''))
      .filter((word) => word.length > 2)
      .slice(0, 2)
      .map((word) => word.toLowerCase());

    const tags = [...words, reportType, 'workspace', embedCount > 0 ? 'with-charts' : 'text-only'];
    return Array.from(new Set(tags));
  };

  const inferReportAuthor = (project: string): string => {
    if (project.includes('Sunscreen')) return 'Noble AI Agent · Dr. Sarah Chen';
    if (project.includes('Surfactant')) return 'Noble AI Agent · Dr. R. Patel';
    if (project.includes('Emollient')) return 'Noble AI Agent · Dr. Emma Richardson';
    return 'Noble AI Agent';
  };

  /* ── AI-driven report generation ─────────────────────────── */
  const handleAIGenerateReport = () => {
    if (!aiPrompt.trim() || isGeneratingReport) return;
    const prompt = aiPrompt.trim();
    setAiPrompt('');
    setIsGeneratingReport(true);

    setTimeout(() => {
      const lc = prompt.toLowerCase();

      // Heuristically pick sections + assets based on prompt keywords
      const wantsExec     = !lc.includes('no summary') && !lc.includes('skip summary');
      const wantsModel    = lc.includes('model') || lc.includes('validation') || lc.includes('performance') || lc.includes('accuracy') || lc.includes('full');
      const wantsPareto   = lc.includes('pareto') || lc.includes('optimization') || lc.includes('candidate') || lc.includes('full');
      const wantsRecipes  = lc.includes('recipe') || lc.includes('formul') || lc.includes('ingredient') || lc.includes('full') || lc.includes('candidate');
      const wantsObjective = lc.includes('objective') || lc.includes('goal') || lc.includes('target') || lc.includes('full') || lc.includes('summary');
      const wantsNext     = lc.includes('next') || lc.includes('recommend') || lc.includes('step') || lc.includes('full');
      const execOnly      = lc.includes('executive') || lc.includes('summary only') || (!wantsModel && !wantsPareto && !wantsRecipes);

      const modelResult   = stageResults[3];
      const paretoResult  = stageResults[4];
      const recipeResult  = stageResults[5];
      const summaryResult = stageResults[6];

      // Summarise tone from prompt
      const isTechnical = lc.includes('technical') || lc.includes('detail') || lc.includes('full');
      const isBrief     = lc.includes('brief') || lc.includes('short') || lc.includes('quick') || execOnly;

      // Infer title from prompt
      const inferredTitle = (() => {
        if (lc.includes('executive')) return `${projectName} — Executive Summary`;
        if (lc.includes('model') || lc.includes('validation')) return `${projectName} — Model Validation Report`;
        if (lc.includes('recipe') || lc.includes('formul')) return `${projectName} — Formulation Candidates Report`;
        if (lc.includes('optimization') || lc.includes('pareto')) return `${projectName} — Optimization Report`;
        return `${projectName} — Analysis Report`;
      })();

      setReportTitle(inferredTitle);

      const ts = Date.now();
      let html = `<h1>${inferredTitle}</h1>\n`;

      if (wantsExec || execOnly) {
        const bullets = [
          isBrief ? '' : '<li><strong>SPF 52.3</strong> — +47% vs. baseline</li>',
          '<li><strong>Water Resistance 96.8%</strong> (target: &gt;90%)</li>',
          wantsRecipes || !isBrief ? '<li><strong>Stability 97.0%</strong> at 24 months</li>' : '',
          !isBrief ? '<li><strong>Cost reduction of 12%</strong> vs. reference</li>' : '',
        ].filter(Boolean).join('\n');
        html += `<h2>Executive Summary</h2>
<p>${isBrief ? 'A brief summary of key outcomes for ' : 'This report covers the complete analysis results for '}<strong>${projectName}</strong>. An XGBoost + Random Forest ensemble (R²=0.94) was used to identify optimal formulation candidates via multi-objective Bayesian optimization.</p>
<ul>${bullets}</ul>\n`;
      }

      if (wantsModel && modelResult) {
        html += `<h2>${wantsModel ? 'Model Validation' : ''}</h2>
<p>The model was validated against a held-out test set of 490 formulations${isTechnical ? ', achieving R²=0.940 and RMSE=2.31 with 5-fold cross-validation' : ''}. The chart below shows predicted vs. actual SPF values.</p>
<div contenteditable="false" data-asset-id="stage-chart-3" data-asset-kind="chart" data-embed-id="ai-chart-3-${ts}" style="margin:16px 0;position:relative;">
  <button type="button" data-remove-embed="true" aria-label="Remove chart" style="position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#ffffff;color:#64748b;font-size:14px;line-height:22px;cursor:pointer;">×</button>
  <div data-chart-host="true" data-embed-id="ai-chart-3-${ts}" style="height:300px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;padding:10px;"></div>
</div><p><br></p>
${isTechnical ? `<p>Full prediction results table (first 6 rows shown):</p>
<div contenteditable="false" data-asset-id="stage-table-3" data-asset-kind="table" style="margin:16px 0;overflow:auto;position:relative;">
  <button type="button" data-remove-embed="true" aria-label="Remove table" style="position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#ffffff;color:#64748b;font-size:14px;line-height:22px;cursor:pointer;">×</button>
  ${buildTableHtml(modelResult.table)}
</div><p><br></p>` : ''}\n`;
      }

      if (wantsPareto && paretoResult) {
        html += `<h2>Optimization Results</h2>
<p>Multi-objective Bayesian optimization${isTechnical ? ' over 1,000 iterations across the 18-dimensional formulation space' : ''} identified 47 Pareto-optimal candidates. The chart below shows the top candidates ranked by multi-objective score.</p>
<div contenteditable="false" data-asset-id="stage-chart-4" data-asset-kind="chart" data-embed-id="ai-chart-4-${ts}" style="margin:16px 0;position:relative;">
  <button type="button" data-remove-embed="true" aria-label="Remove chart" style="position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#ffffff;color:#64748b;font-size:14px;line-height:22px;cursor:pointer;">×</button>
  <div data-chart-host="true" data-embed-id="ai-chart-4-${ts}" style="height:300px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;padding:10px;"></div>
</div><p><br></p>\n`;
      }

      if (wantsRecipes && recipeResult) {
        html += `<h2>Top Formulation Recipes</h2>
<p>Full ingredient specifications for the top candidates${isTechnical ? ', all compliant with EU Cosmetics Regulation 1223/2009' : ''}:</p>
<div contenteditable="false" data-asset-id="stage-table-5" data-asset-kind="table" style="margin:16px 0;overflow:auto;position:relative;">
  <button type="button" data-remove-embed="true" aria-label="Remove table" style="position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#ffffff;color:#64748b;font-size:14px;line-height:22px;cursor:pointer;">×</button>
  ${buildTableHtml(recipeResult.table)}
</div><p><br></p>\n`;
      }

      if (wantsObjective && summaryResult) {
        html += `<h2>Objective Achievement</h2>
<p>Lead formulation R-047 meets or exceeds all four project objectives:</p>
<div contenteditable="false" data-asset-id="stage-chart-6" data-asset-kind="chart" data-embed-id="ai-chart-6-${ts}" style="margin:16px 0;position:relative;">
  <button type="button" data-remove-embed="true" aria-label="Remove chart" style="position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#ffffff;color:#64748b;font-size:14px;line-height:22px;cursor:pointer;">×</button>
  <div data-chart-host="true" data-embed-id="ai-chart-6-${ts}" style="height:300px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;padding:10px;"></div>
</div><p><br></p>\n`;
      }

      // Include custom charts if prompt asks for them
      Object.values(customCharts).forEach((cc) => {
        if (lc.includes(cc.name.toLowerCase()) || lc.includes('all charts') || lc.includes('custom')) {
          html += `<h2>${cc.name}</h2>
<div contenteditable="false" data-asset-id="custom-chart-${cc.id}" data-asset-kind="chart" data-embed-id="ai-custom-${cc.id}-${ts}" style="margin:16px 0;position:relative;">
  <button type="button" data-remove-embed="true" aria-label="Remove chart" style="position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#ffffff;color:#64748b;font-size:14px;line-height:22px;cursor:pointer;">×</button>
  <div data-chart-host="true" data-embed-id="ai-custom-${cc.id}-${ts}" style="height:300px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;padding:10px;"></div>
</div><p><br></p>\n`;
        }
      });

      if (wantsNext && !isBrief) {
        html += `<h2>Recommendations & Next Steps</h2>
<ol>
  <li><strong>Synthesize R-047</strong> — 500g batch for in-vitro SPF testing per ISO 24444:2019</li>
  <li><strong>Validate R-089 and R-124</strong> as backup candidates in parallel</li>
  <li><strong>Submit regulatory pre-assessment</strong> for EU market clearance</li>
  <li><strong>Schedule stability testing</strong> — 6-month accelerated aging protocol</li>
</ol>\n`;
      }

      html += `<p><br></p>`;

      setReportBodyHtml(html);
      if (editorRef.current) editorRef.current.innerHTML = html;
      setIsGeneratingReport(false);
    }, 1400);
  };

  const handleSaveReport = async () => {
    setIsSaving(true);
    try {
      const now = new Date();
      const reportId = initialReport?.id ?? createReportId('report');

      const contentHtml = editorRef.current?.innerHTML ?? reportBodyHtml;
      const textContent = plainTextFromHtml(contentHtml);
      const embedCount = (contentHtml.match(/data-asset-id=/g) ?? []).length;
      const summary = textContent.substring(0, 220) || 'Report summary';
      const reportType = inferReportType(currentStage, textContent);
      const sections = extractReportSections(contentHtml, summary);
      const tags = buildReportTags(projectName, reportType, embedCount);

      const subtitleByType: Record<SavedReport['type'], string> = {
        experiment: `Stage ${currentStage} experiment report with ${embedCount} embedded visuals`,
        regulatory: `Compliance and constraints report from workspace outputs`,
        model: `Model validation and performance write-up from workspace analysis`,
        analysis: `Analysis narrative generated from workspace charts and evidence`,
        project: `Project summary report with findings and recommended next steps`,
      };

      const savedReport: SavedReport = {
        id: reportId,
        title: reportTitle || `${projectName} Report`,
        subtitle: subtitleByType[reportType],
        type: reportType,
        status: 'draft',
        project: projectName,
        projectColor: '#3F98FF',
        author: inferReportAuthor(projectName),
        created: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        updated: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        pages: Math.max(1, Math.ceil(textContent.length / 1800)),
        tags,
        summary,
        sections,
        contentHtml,
      };

      onSaveReport(savedReport);
      setIsSaving(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save report:', error);
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[96vh] w-[98vw] max-w-[98vw] overflow-hidden border-0 bg-[#f5f7fb] p-0 sm:max-w-[98vw]">
        <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-[#183b73] px-6 py-5 text-left justify-between flex-row items-center">
          <div className="flex-1">
            <DialogTitle className="text-xl font-semibold text-white">Report Builder</DialogTitle>
            <DialogDescription className="text-sm text-slate-300">
              Write freely in a blank canvas, style your text, and insert charts/tables exactly where you want them.
            </DialogDescription>
          </div>
          <button
            onClick={handleSaveReport}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:bg-slate-400 shrink-0"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Save to Reports
              </>
            )}
          </button>
        </DialogHeader>

        <div className="flex h-[calc(96vh-89px)] min-h-0">
          <aside className="w-[250px] shrink-0 border-r border-slate-200 bg-white/85 p-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Document</div>
              <input
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#3F98FF]"
              />
              <button
                type="button"
                onClick={loadExampleReportTemplate}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                Load Example Template
              </button>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>{plainTextFromHtml(reportBodyHtml).length.toLocaleString()} chars</span>
                <span>{assets.length} assets</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Formatting</div>
              <div
                className="mt-3 grid grid-cols-2 gap-2"
                onMouseDown={(event) => {
                  if ((event.target as HTMLElement).closest('button')) event.preventDefault();
                }}
              >
                <button type="button" onClick={() => applyTextCommand('bold')} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Bold</button>
                <button type="button" onClick={() => applyTextCommand('italic')} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Italic</button>
                <button type="button" onClick={() => applyTextCommand('underline')} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Underline</button>
                <button type="button" onClick={() => applyTextCommand('removeFormat')} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Clear</button>
                <button type="button" onClick={() => applyTextCommand('formatBlock', 'H1')} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Heading 1</button>
                <button type="button" onClick={() => applyTextCommand('formatBlock', 'H2')} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Heading 2</button>
                <button type="button" onClick={() => applyTextCommand('insertUnorderedList')} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Bullets</button>
                <button type="button" onClick={() => applyTextCommand('insertOrderedList')} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Numbered</button>
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto p-5">
            <div className="mx-auto max-w-5xl">
              <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div
                  className="flex flex-wrap items-center gap-2"
                  onMouseDown={(event) => {
                    if ((event.target as HTMLElement).closest('button')) event.preventDefault();
                  }}
                >
                  <button type="button" onClick={() => applyTextCommand('bold')} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">B</button>
                  <button type="button" onClick={() => applyTextCommand('italic')} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">I</button>
                  <button type="button" onClick={() => applyTextCommand('underline')} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">U</button>
                  <div className="mx-1 h-5 w-px bg-slate-200" />
                  <button type="button" onClick={() => applyTextCommand('formatBlock', 'H1')} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">H1</button>
                  <button type="button" onClick={() => applyTextCommand('formatBlock', 'H2')} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">H2</button>
                  <button type="button" onClick={() => applyTextCommand('fontSize', '2')} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Small</button>
                  <button type="button" onClick={() => applyTextCommand('fontSize', '3')} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">Normal</button>
                  <button type="button" onClick={() => applyTextCommand('fontSize', '5')} className="rounded-md border border-slate-200 px-2 py-1 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">Large</button>
                  <button type="button" onClick={() => applyTextCommand('foreColor', '#1d4ed8')} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-blue-700 hover:bg-slate-50">Blue</button>
                  <button type="button" onClick={() => applyTextCommand('foreColor', '#15803d')} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-green-700 hover:bg-slate-50">Green</button>
                  <button type="button" onClick={() => applyTextCommand('insertUnorderedList')} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">• List</button>
                  <button type="button" onClick={() => applyTextCommand('insertOrderedList')} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">1. List</button>
                  <button type="button" onClick={() => applyTextCommand('removeFormat')} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">Clear</button>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm min-h-[740px] relative">
                {isEditorEmpty && (
                  <div className="pointer-events-none absolute left-8 top-8 text-slate-400 text-sm">
                    Start writing your report here. Use the toolbar to style text, then insert charts/tables from the asset library.
                  </div>
                )}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={saveSelectionRange}
                  onMouseUp={saveSelectionRange}
                  onKeyUp={saveSelectionRange}
                  onClick={(event) => {
                    const target = event.target as HTMLElement;
                    const removeButton = target.closest('[data-remove-embed="true"]') as HTMLElement | null;
                    if (!removeButton || !editorRef.current) return;

                    const embed = removeButton.closest('[data-asset-id]') as HTMLElement | null;
                    if (!embed) return;

                    embed.remove();
                    setReportBodyHtml(editorRef.current.innerHTML);
                    saveSelectionRange();
                  }}
                  onInput={(event) => setReportBodyHtml((event.target as HTMLDivElement).innerHTML)}
                  className="report-editor min-h-[680px] outline-none text-[15px] leading-7 text-slate-800 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1"
                />
              </div>
            </div>
          </main>

          <aside className="w-[320px] shrink-0 border-l border-slate-200 bg-white/92 flex flex-col overflow-hidden">

            {/* ── AI Prompt area ───────────────────────── */}
            <div className="shrink-0 border-b border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-5 h-5 bg-gradient-to-br from-[#3F98FF] to-[#7c3aed] rounded-md flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700">AI Report Builder</span>
              </div>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {[
                  { label: 'Full report', msg: 'Build a full analysis report with model validation, optimization results, top recipe candidates, and next steps' },
                  { label: 'Executive summary', msg: 'Build a concise executive summary with key outcomes' },
                  { label: 'Model validation', msg: 'Build a detailed model validation report with charts and performance tables' },
                  { label: 'Recipe candidates', msg: 'Build a report focused on top formulation recipe candidates with ingredient tables' },
                ].map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setAiPrompt(q.msg)}
                    className="px-2 py-1 text-[10px] font-medium bg-slate-100 hover:bg-[#3F98FF]/10 hover:text-[#3F98FF] text-slate-600 rounded-full border border-slate-200 hover:border-[#3F98FF]/30 transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAIGenerateReport(); }
                  }}
                  placeholder="Describe the report you want… (e.g. 'Build a brief executive summary with the optimization chart')"
                  rows={3}
                  className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-800 placeholder-slate-400 outline-none focus:border-[#3F98FF] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAIGenerateReport}
                  disabled={!aiPrompt.trim() || isGeneratingReport}
                  className="self-end w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-[#3F98FF] text-white hover:bg-[#2980e8] disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                  title="Generate report"
                >
                  {isGeneratingReport
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Send className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
              {isGeneratingReport && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#3F98FF]">
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                  <span>Generating your report…</span>
                </div>
              )}
            </div>

            {/* ── Asset Library ────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Asset Library</div>
              <p className="mt-2 text-sm text-slate-600">
                Insert generated charts and tables where your cursor is in the document.
              </p>
            </div>

            <div className="mt-4 space-y-3 pr-1">
              {assets.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Run analyses or build a custom chart first. Generated assets will appear here.
                </div>
              )}

              {assets.map((asset) => (
                <div key={asset.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{asset.kind === 'chart' ? 'Chart' : 'Table'}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{asset.title}</div>
                      <div className="mt-1 text-[12px] text-slate-500">{asset.source}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => insertAssetAtCursor(asset)}
                      className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
                    >
                      Insert
                    </button>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                    {asset.kind === 'chart' && asset.chart ? (
                      <div className="h-[160px] rounded-lg bg-white p-2">
                        <ResultChart config={asset.chart} />
                      </div>
                    ) : asset.table ? (
                      <div className="space-y-2 rounded-lg bg-white p-3 text-[12px] text-slate-600">
                        <div className="flex items-center justify-between"><span>Rows</span><span className="font-semibold text-slate-900">{asset.table.rows.length}</span></div>
                        <div className="flex items-center justify-between"><span>Columns</span><span className="font-semibold text-slate-900">{asset.table.columns.length}</span></div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {asset.table.columns.slice(0, 4).map((column) => (
                            <span key={column.key} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">{column.label}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            </div>{/* end flex-1 scroll area */}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Side Chat Panel ─────────────────────────────────────────── */

function SideChatPanel({
  messages, isAITyping, quickPrompts, onSendMessage,
  isGenerating, recipesGenerated, onGenerateRecipes,
}: {
  messages: ChatMessage[];
  isAITyping: boolean;
  quickPrompts: Array<{ label: string; message: string; emoji: string }>;
  onSendMessage: (msg: string) => void;
  isGenerating: boolean;
  recipesGenerated: boolean;
  onGenerateRecipes: () => void;
}) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAITyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isAITyping) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50/40">

      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-[#3F98FF]/5 to-transparent shrink-0 flex items-center gap-2">
        <div className="w-5 h-5 bg-gradient-to-br from-[#3F98FF] to-[#7c3aed] rounded-md flex items-center justify-center shrink-0">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-[11px] font-semibold text-gray-800">Noble AI Assistant</span>
        {isAITyping && (
          <div className="flex items-center gap-1 ml-auto text-[#3F98FF]">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[9px] font-medium">Thinking…</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
              msg.role === 'user' ? 'bg-gray-700' : 'bg-gradient-to-br from-[#3F98FF] to-[#7c3aed]'
            }`}>
              {msg.role === 'user'
                ? <User className="w-3 h-3 text-white" />
                : <Sparkles className="w-3 h-3 text-white" />}
            </div>
            <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gray-800 text-white rounded-tr-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
            }`}>
              {msg.content}
              {msg.timestamp && <div className="text-[9px] mt-1 text-gray-400">{msg.timestamp}</div>}
            </div>
          </div>
        ))}

        {isAITyping && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3F98FF] to-[#7c3aed] shrink-0 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-[#3F98FF] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      {/* Generate Recipes CTA */}
      <div className="px-3 py-2.5 border-t border-gray-100 shrink-0">
        <button
          onClick={onGenerateRecipes}
          disabled={isGenerating || isAITyping}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all shadow-sm ${
            isGenerating
              ? 'bg-[#3F98FF]/60 text-white cursor-not-allowed'
              : recipesGenerated
              ? 'bg-[#3F98FF] hover:bg-[#2563eb] text-white'
              : 'bg-[#3F98FF] hover:bg-[#2563eb] text-white'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating recipes…
            </>
          ) : recipesGenerated ? (
            <>
              <FlaskConical className="w-3.5 h-3.5" />
              Regenerate Recipes
            </>
          ) : (
            <>
              <FlaskConical className="w-3.5 h-3.5" />
              Generate Recipes
            </>
          )}
        </button>
        {recipesGenerated && !isGenerating && (
          <div className="flex items-center justify-center gap-1 mt-1.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
            <span className="text-[9px] text-green-600 font-medium">3 recipes generated · up to date</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-gray-200 bg-white shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isAITyping ? 'Noble AI is processing…' : 'Ask about formulations, models…'}
            disabled={isAITyping}
            className="flex-1 px-3 py-1.5 text-[11px] border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF] disabled:bg-gray-50 disabled:text-gray-400 bg-gray-50 hover:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isAITyping}
            className="w-7 h-7 flex items-center justify-center bg-[#3F98FF] text-white rounded-full hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {isAITyping
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}