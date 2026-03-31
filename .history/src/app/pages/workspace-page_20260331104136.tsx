import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { createRoot, Root } from 'react-dom/client';
import { WorkspaceConfigPanel, Constraint as WorkspaceConstraint } from '../components/workspace-config-panel';
import { ChartConfig, TableConfig, ResultChart } from '../components/workspace-results';
import { InsightsPanel, Insight, ModelMetrics } from '../components/insights-panel';
import { ArtifactsLibrary, LibraryArtifact } from '../components/artifacts-library';
import { WorkspaceCanvas, LayoutToggle, ColumnCount, PanelView } from '../components/workspace-canvas';
import type { CanvasCard } from '../components/artifact-canvas';
import { ChatMessage } from '../components/compact-chat';
import { ChartBuilderModal, CustomChartConfig } from '../components/chart-builder-modal';
import { TableSelectorModal } from '../components/table-selector-modal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Package, Brain, RefreshCw,
  Sparkles, ArrowLeft, Share2, Send,
  MessageSquare, FlaskConical, User, Loader2, Zap, ChevronRight, PlusCircle, Table2, Download, CheckCircle2, ChevronLeft,
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
      subtitle: 'Components as columns · formulations as rows · EU Cosmetics Reg. 1223/2009 compliant',
      pinnedValue: 'R-047',
      columns: [
        { key: 'recipe',            label: 'Formulation',         width: '110px'                            },
        { key: 'zno',               label: 'ZnO %',               width: '72px',  align: 'right'            },
        { key: 'tio2',              label: 'TiO₂ %',              width: '72px',  align: 'right'            },
        { key: 'avobenzone',        label: 'Avobenzone %',        width: '92px',  align: 'right'            },
        { key: 'octocrylene',       label: 'Octocrylene %',       width: '92px',  align: 'right'            },
        { key: 'cyclopentasiloxane',label: 'Cyclopentasiloxane %',width: '132px', align: 'right'            },
        { key: 'dimethicone',       label: 'Dimethicone %',       width: '100px', align: 'right'            },
        { key: 'aqua',              label: 'Aqua %',              width: '72px',  align: 'right'            },
        { key: 'status',            label: 'Compliance',          width: '88px',  align: 'center', badge: true },
      ],
      rows: [
        { recipe: 'R-047', zno: 15.2, tio2: 8.5, avobenzone: 3.0, octocrylene: 2.2, cyclopentasiloxane: 12.0, dimethicone: 5.0, aqua: 54.1, status: '✓ Pass' },
        { recipe: 'R-089', zno: 14.8, tio2: 9.0, avobenzone: 2.8, octocrylene: 2.0, cyclopentasiloxane: 14.0, dimethicone: 0.0, aqua: 57.4, status: '✓ Pass' },
        { recipe: 'R-124', zno: 15.5, tio2: 8.0, avobenzone: 3.2, octocrylene: 0.0, cyclopentasiloxane: 0.0, dimethicone: 0.0, aqua: 56.3, status: '✓ Pass' },
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

const DEFAULT_LIVE_CONSTRAINTS: WorkspaceConstraint[] = [
  { id: 'c1', ingredient: 'Zinc Oxide', min: 5, max: 25, unit: '% w/w', type: 'regulatory' },
  { id: 'c2', ingredient: 'Titanium Dioxide', min: 0, max: 25, unit: '% w/w', type: 'regulatory' },
  { id: 'c3', ingredient: 'Avobenzone', min: 0, max: 5, unit: '% w/w', type: 'regulatory' },
  { id: 'c4', ingredient: 'Octocrylene', min: 0, max: 10, unit: '% w/w', type: 'regulatory' },
  { id: 'c5', ingredient: 'Total UV Filters', min: 5, max: 35, unit: '% w/w', type: 'process' },
  { id: 'c6', ingredient: 'pH', min: 5.0, max: 7.5, unit: '', type: 'process' },
];

type LiveRecipe = {
  id: string;
  zno: number;
  tio2: number;
  avobenzone: number;
  octocrylene: number;
  cyclopentasiloxane: number;
  dimethicone: number;
  aqua: number;
  spf: number;
  wr: number;
  stability: number;
  score: number;
  costDelta: number;
  isLead: boolean;
  isTop3: boolean;
  color: string;
};

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function parseTargetNumber(value?: number | string): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

function metricFromObjective(recipe: LiveRecipe, objective: Objective): number {
  const key = objective.attribute.toLowerCase();
  if (key.includes('spf')) return recipe.spf;
  if (key.includes('water')) return recipe.wr;
  if (key.includes('stability')) return recipe.stability;
  if (key.includes('cost')) return recipe.costDelta;
  return recipe.score;
}

function objectiveFitScore(recipe: LiveRecipe, objective: Objective, weight: number): number {
  const metric = metricFromObjective(recipe, objective);
  const target = parseTargetNumber(objective.value);

  let fit = 0.5;
  if (objective.target === 'maximize') {
    if (target && target > 0) fit = Math.max(0, Math.min(1, metric / target));
    else fit = Math.max(0, Math.min(1, (metric + 20) / 120));
  } else if (objective.target === 'minimize') {
    if (objective.attribute.toLowerCase().includes('cost')) {
      fit = Math.max(0, Math.min(1, (-metric) / 20));
    } else if (target && target > 0) {
      fit = Math.max(0, Math.min(1, target / Math.max(metric, 1e-6)));
    } else {
      fit = Math.max(0, Math.min(1, 1 - metric / 100));
    }
  }

  return fit * Math.max(1, weight);
}

function constraintPenalty(recipe: LiveRecipe, constraints: WorkspaceConstraint[]): number {
  const metricFor = (name: string): number | null => {
    const key = name.toLowerCase().trim();
    if (key.includes('zinc oxide')) return recipe.zno;
    if (key.includes('titanium dioxide')) return recipe.tio2;
    if (key.includes('avobenzone')) return recipe.avobenzone;
    if (key.includes('octocrylene')) return recipe.octocrylene;
    if (key.includes('total uv filters')) return recipe.zno + recipe.tio2 + recipe.avobenzone + recipe.octocrylene;
    if (key === 'ph') return 6.1;
    return null;
  };

  return constraints.reduce((sum, c) => {
    const metric = metricFor(c.ingredient);
    if (metric === null) return sum;

    let delta = 0;
    if (typeof c.min === 'number' && metric < c.min) delta += c.min - metric;
    if (typeof c.max === 'number' && metric > c.max) delta += metric - c.max;
    if (delta <= 0) return sum;

    const typeWeight = c.type === 'regulatory' ? 3.2 : c.type === 'process' ? 2.0 : 1.2;
    return sum + delta * typeWeight;
  }, 0);
}

function buildLiveStage5Result(
  objectives: Objective[],
  objectiveWeights: Record<string, number>,
  constraints: WorkspaceConstraint[],
  hiddenRecipeIds: Set<string>,
  starredRecipeIds: Set<string>,
): { chartData: any[]; tableRows: Record<string, any>[] } {
  const rand = seededRand(42);
  const recipes: LiveRecipe[] = [];

  for (let i = 0; i < 120; i += 1) {
    const zno = +(11 + rand() * 6.5).toFixed(1);
    const tio2 = +(6.5 + rand() * 4.5).toFixed(1);
    const avobenzone = +(2.1 + rand() * 1.5).toFixed(1);
    const octocrylene = +(1.1 + rand() * 2.5).toFixed(1);
    const cyclopentasiloxane = +(8 + rand() * 8).toFixed(1);
    const dimethicone = +(2 + rand() * 5).toFixed(1);
    const uvTotal = zno + tio2 + avobenzone + octocrylene;
    const aqua = +(100 - (uvTotal + cyclopentasiloxane + dimethicone)).toFixed(1);

    const recipe: LiveRecipe = {
      id: `R-${String(100 + i * 7).slice(-3)}`,
      zno,
      tio2,
      avobenzone,
      octocrylene,
      cyclopentasiloxane,
      dimethicone,
      aqua,
      spf: +(10 + zno * 1.85 + tio2 * 1.45 + avobenzone * 2.9 + octocrylene * 0.95 - Math.max(0, aqua - 58) * 0.18 + (rand() - 0.5) * 0.8).toFixed(1),
      wr: +(68 + zno * 1.05 + tio2 * 0.72 + octocrylene * 0.58 + cyclopentasiloxane * 0.2 + dimethicone * 0.13 + (rand() - 0.5) * 1.2).toFixed(1),
      stability: +(81 + tio2 * 0.92 + zno * 0.35 + octocrylene * 0.32 - Math.max(0, avobenzone - 3.0) * 1.8 + (rand() - 0.5) * 0.8).toFixed(1),
      score: 0,
      costDelta: +(-3 - zno * 0.36 - tio2 * 0.18 - avobenzone * 0.22 + cyclopentasiloxane * 0.05 + (rand() - 0.5) * 1.4).toFixed(1),
      isLead: false,
      isTop3: false,
      color: '#94a3b8',
    };

    const objectiveScore = objectives.reduce((sum, obj) => {
      const weight = objectiveWeights[obj.id] ?? (obj.priority === 'high' ? 85 : obj.priority === 'medium' ? 60 : 40);
      return sum + objectiveFitScore(recipe, obj, weight);
    }, 0);
    recipe.score = +(objectiveScore - constraintPenalty(recipe, constraints)).toFixed(1);
    recipes.push(recipe);
  }

  recipes.sort((a, b) => b.score - a.score);

  const rankColor = (index: number) => {
    const hue = Math.round((index * 137.5 + rand() * 47) % 360);
    const saturation = 64 + Math.round(rand() * 18);
    const lightness = 44 + Math.round(rand() * 8);
    return `hsl(${hue} ${saturation}% ${lightness}%)`;
  };

  const top25 = recipes.slice(0, 25).map((r, idx) => ({
    ...r,
    isTop3: idx < 3,
    isLead: idx === 0,
    color: rankColor(idx),
  }));
  const top3 = top25.slice(0, 3);
  const top25Ids = new Set(top25.map((r) => r.id));

  const baseline: LiveRecipe = {
    id: 'Baseline',
    zno: 10.5,
    tio2: 5.5,
    avobenzone: 2.0,
    octocrylene: 1.6,
    cyclopentasiloxane: 10.0,
    dimethicone: 3.2,
    aqua: 67.2,
    spf: 35.5,
    wr: 82.0,
    stability: 88.0,
    score: 0,
    costDelta: 0,
    isLead: false,
    isTop3: false,
    color: '#94a3b8',
  };

  const liveRecipeSeries = [
    baseline,
    ...top25,
    ...recipes.slice(25).map((r) => ({
      ...r,
      color: '#cbd5e1',
      isTop3: false,
      isLead: false,
    })),
  ];

  const historicalSeries = Array.from({ length: 75 }, (_, idx) => {
    const hRand = seededRand(900 + idx);
    const zno = +(8 + hRand() * 7).toFixed(1);
    const tio2 = +(4.5 + hRand() * 5).toFixed(1);
    const avobenzone = +(1.5 + hRand() * 2.2).toFixed(1);
    const octocrylene = +(0.9 + hRand() * 2.6).toFixed(1);
    const cyclopentasiloxane = +(7 + hRand() * 9).toFixed(1);
    const dimethicone = +(1.6 + hRand() * 4.8).toFixed(1);
    const uvTotal = zno + tio2 + avobenzone + octocrylene;
    const aqua = +(100 - (uvTotal + cyclopentasiloxane + dimethicone)).toFixed(1);

    return {
      id: `H-${String(idx + 1).padStart(3, '0')}`,
      zno,
      tio2,
      avobenzone,
      octocrylene,
      cyclopentasiloxane,
      dimethicone,
      aqua,
      spf: +(9 + zno * 1.55 + tio2 * 1.28 + avobenzone * 2.35 + octocrylene * 0.84 + (hRand() - 0.5) * 1.4).toFixed(1),
      wr: +(64 + zno * 0.88 + tio2 * 0.62 + octocrylene * 0.55 + cyclopentasiloxane * 0.24 + (hRand() - 0.5) * 1.5).toFixed(1),
      stability: +(79 + tio2 * 0.82 + zno * 0.27 + octocrylene * 0.29 - Math.max(0, avobenzone - 2.8) * 1.6 + (hRand() - 0.5) * 1.2).toFixed(1),
      score: 0,
      costDelta: +(-2.5 - zno * 0.31 - tio2 * 0.14 - avobenzone * 0.16 + cyclopentasiloxane * 0.07 + (hRand() - 0.5) * 1.8).toFixed(1),
      isLead: false,
      isTop3: false,
      color: '#9ca3af',
      isHistorical: true,
    };
  });

  const chartData = [...liveRecipeSeries, ...historicalSeries].map((r) => ({
    ...r,
    isHistorical: Boolean((r as any).isHistorical),
    isStarred: starredRecipeIds.has(r.id),
  }));

  const tableRows = top25.map((r) => ({
    starred: starredRecipeIds.has(r.id),
    visible: !hiddenRecipeIds.has(r.id),
    plotColor: r.color,
    recipe: r.id,
    zno: r.zno,
    tio2: r.tio2,
    avobenzone: r.avobenzone,
    octocrylene: r.octocrylene,
    cyclopentasiloxane: r.cyclopentasiloxane,
    dimethicone: r.dimethicone,
    aqua: r.aqua,
    status: '✓ Pass',
  }));

  return { chartData, tableRows };
}

/* ── Page component ─────────────────────────────────────────── */

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { demoStage, setDemoStage, saveReport, editingReport, setEditingReport } = useDemoStage();

  const projectName = PROJECT_NAMES[id || '1'] || editingReport?.project || 'Workspace';

  const [hasRun,           setHasRun]           = useState(false);
  const [isLoading,        setIsLoading]         = useState(false);
  const [messages,         setMessages]          = useState<ChatMessage[]>([{
    id: 'init-msg', role: 'assistant',
    content: '👋 Welcome to Noble AI VIP! This project has been initialized with 2,450 historical sunscreen formulations. Dataset analysis and correlation mapping are complete.\n\nObjectives are set: Maximize SPF ≥50, Water Resistance >90%, Stability, and minimize cost. Use the Chat tab to advance the workflow.',
    timestamp: '2 hours ago',
  }]);
  const [isAITyping,       setIsAITyping]        = useState(false);
  const [rightTab,         setRightTab]          = useState<'artifacts' | 'chat'>('chat');
  const [insights,         setInsights]          = useState<Insight[]>(INITIAL_INSIGHTS);
  const [modelMetrics,     setModelMetrics]      = useState<ModelMetrics | null>(null);
  const [recipesGenerated, setRecipesGenerated]  = useState(demoStage >= 5);
  const [isGenerating,     setIsGenerating]      = useState(false);
  const [isReportBuilderOpen, setIsReportBuilderOpen] = useState(!!editingReport);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);
  const [objectives,       setObjectives]        = useState<Objective[]>(
    OBJECTIVES_BY_STAGE[2] || OBJECTIVES_BASE.map((o) => ({ ...o, status: 'active' as const, progress: 15 }))
  );
  const [objectiveWeights, setObjectiveWeights] = useState<Record<string, number>>({});
  const [constraints, setConstraints] = useState<WorkspaceConstraint[]>(DEFAULT_LIVE_CONSTRAINTS);
  const [hiddenLiveRecipeIds, setHiddenLiveRecipeIds] = useState<string[]>([]);
  const [starredLiveRecipeIds, setStarredLiveRecipeIds] = useState<string[]>([]);

  // Multi-panel canvas state
  const [columnCount,  setColumnCount]  = useState<ColumnCount>(2);
  const [panelViews,   setPanelViews]   = useState<PanelView[]>(['live', 'table:live']);

  // Custom charts
  const [customCharts, setCustomCharts] = useState<Record<string, CustomChartConfig>>({});
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
        const next = [...pv];
        next[prev.panelIdx] = `custom:${cfg.id}` as PanelView;
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
    setPanelViews(prev => [...prev, 'live']);
  }, []);

  const handleAddTablePanel = useCallback((view: PanelView) => {
    setPanelViews(prev => [...prev, view]);
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

  const liveStage5 = useMemo(() => {
    return buildLiveStage5Result(
      objectives,
      objectiveWeights,
      constraints,
      new Set(hiddenLiveRecipeIds),
      new Set(starredLiveRecipeIds),
    );
  }, [objectives, objectiveWeights, constraints, hiddenLiveRecipeIds, starredLiveRecipeIds]);

  const stageResults = useMemo<Record<number, { chart: ChartConfig; table: TableConfig }>>(() => {
    return {
      ...STAGE_RESULTS,
      5: {
        chart: {
          ...STAGE_RESULTS[5].chart,
          subtitle: 'Live optimization from current objectives and constraints',
          data: liveStage5.chartData,
        },
        table: {
          ...STAGE_RESULTS[5].table,
          subtitle: 'Top 25 live candidates (re-ranked as objectives/constraints change)',
          columns: [
            { key: 'starred', label: 'Star', width: '48px', align: 'center' as const },
            { key: 'visible', label: 'View', width: '48px', align: 'center' as const },
            { key: 'plotColor', label: 'Plot', width: '48px', align: 'center' as const },
            ...STAGE_RESULTS[5].table.columns,
          ],
          pinnedValue: liveStage5.tableRows[0]?.recipe ?? 'R-047',
          rows: liveStage5.tableRows,
        },
      },
    };
  }, [liveStage5]);

  const currentResults = (hasRun || stageResults[demoStage]) ? (stageResults[demoStage] ?? null) : null;
  const effectiveHasRun = hasRun || !!stageResults[demoStage];

  useEffect(() => {
    setRecipesGenerated(demoStage >= 5);
  }, [demoStage]);

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
    setObjectiveWeights({});
    setConstraints(DEFAULT_LIVE_CONSTRAINTS);
    setHiddenLiveRecipeIds([]);
    setStarredLiveRecipeIds([]);
    setRightTab('chat');
    setCustomCharts({});
    setChartBuilderState({ open: false, panelIdx: 0, editingId: null });
    setColumnCount(2);
    setPanelViews(['live', 'table:live']);
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

  const handleOpenReportBuilder = useCallback(() => {
    if (!hasRun) return;
    setIsReportBuilderOpen(true);
  }, [hasRun]);

  const quickPrompts = QUICK_PROMPTS[demoStage] || [];
  const newInsightCount = insights.filter((i) => i.isNew).length;
  const canOpenReportBuilder = hasRun;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#1a1a2e]">

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
            stageResults={stageResults}
            currentStage={demoStage}
            isLoading={isLoading}
            hasRun={effectiveHasRun}
            hiddenRecipeIds={hiddenLiveRecipeIds}
            onToggleRecipeVisibility={(recipeId) => {
              setHiddenLiveRecipeIds((prev) =>
                prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
              );
            }}
            starredRecipeIds={starredLiveRecipeIds}
            onToggleRecipeStar={(recipeId) => {
              setStarredLiveRecipeIds((prev) =>
                prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
              );
            }}
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
              objectiveWeights={objectiveWeights}
              onObjectivesChange={(nextObjectives, nextWeights) => {
                setObjectives(nextObjectives);
                setObjectiveWeights(nextWeights);
              }}
              onWeightChange={(id, val) => {
                setObjectiveWeights((prev) => ({ ...prev, [id]: val }));
              }}
              onConstraintsChange={setConstraints}
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
        stageResults={stageResults}
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
        stageResults={stageResults}
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

          <aside className="w-[320px] shrink-0 border-l border-slate-200 bg-white/92 p-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Asset Library</div>
              <p className="mt-2 text-sm text-slate-600">
                Insert generated charts and tables where your cursor is in the document.
              </p>
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(96vh-220px)] pr-1">
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