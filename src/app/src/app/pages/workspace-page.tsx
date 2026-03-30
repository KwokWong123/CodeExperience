import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { WorkspaceConfigPanel } from '../components/workspace-config-panel';
import { WorkspaceResults, ChartConfig, TableConfig } from '../components/workspace-results';
import { InsightsPanel, Insight, ModelMetrics } from '../components/insights-panel';
import { ArtifactsLibrary, LibraryArtifact } from '../components/artifacts-library';
import { WorkspaceCanvas, LayoutToggle, ColumnCount, PanelView } from '../components/workspace-canvas';
import type { CanvasCard } from '../components/artifact-canvas';
import { ChatMessage } from '../components/compact-chat';
import { ChartBuilderModal, CustomChartConfig } from '../components/chart-builder-modal';
import {
  Package, Brain, Download, RefreshCw,
  Sparkles, ArrowLeft, Share2, Send,
  MessageSquare, FlaskConical, User, Loader2, Zap, ChevronRight, PlusCircle,
} from 'lucide-react';
import { useDemoStage } from '../context/demo-context';

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

const QUICK_PROMPTS: Record<number, Array<{ label: string; message: string; emoji: string }>> = {
  2: [{ label: 'Train predictive model',       message: 'Train a gradient boosted ensemble model (XGBoost + Random Forest) to predict SPF using 5-fold cross-validation',                                                                  emoji: '🤖' }],
  3: [{ label: 'Run Bayesian optimization',    message: 'Run multi-objective Bayesian optimization across all 4 objectives: maximize SPF, water resistance, stability; minimize cost',                                                      emoji: '⚡' }],
  4: [{ label: 'Generate formulation recipes', message: 'Generate detailed formulation recipes for the top 3 Pareto-optimal candidates with full ingredient specifications',                                                                 emoji: '🧪' }],
  5: [{ label: 'Export R&D report',            message: 'Generate a comprehensive R&D report summarizing all analyses, model performance, optimization results, and top formulation recommendations',                                         emoji: '📄' }],
  6: [],
};

/* ── Page component ─────────────────────────────────────────── */

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { demoStage, setDemoStage } = useDemoStage();

  const projectName = PROJECT_NAMES[id || '1'] || 'Workspace';

  const [hasRun,           setHasRun]           = useState(false);
  const [isLoading,        setIsLoading]         = useState(false);
  const [messages,         setMessages]          = useState<ChatMessage[]>([{
    id: 'init-msg', role: 'assistant',
    content: '👋 Welcome to Noble AI VIP! This project has been initialized with 2,450 historical sunscreen formulations. Dataset analysis and correlation mapping are complete.\n\nObjectives are set: Maximize SPF ≥50, Water Resistance >90%, Stability, and minimize cost. Use the Chat tab to advance the workflow.',
    timestamp: '2 hours ago',
  }]);
  const [isAITyping,       setIsAITyping]        = useState(false);
  const [rightTab,         setRightTab]          = useState<'insights' | 'artifacts' | 'chat'>('chat');
  const [insights,         setInsights]          = useState<Insight[]>(INITIAL_INSIGHTS);
  const [modelMetrics,     setModelMetrics]      = useState<ModelMetrics | null>(null);
  const [recipesGenerated, setRecipesGenerated]  = useState(false);
  const [isGenerating,     setIsGenerating]      = useState(false);
  const [objectives,       setObjectives]        = useState<Objective[]>(
    OBJECTIVES_BY_STAGE[2] || OBJECTIVES_BASE.map((o) => ({ ...o, status: 'active' as const, progress: 15 }))
  );

  // Multi-panel canvas state
  const [columnCount,  setColumnCount]  = useState<ColumnCount>(2);
  const [panelViews,   setPanelViews]   = useState<PanelView[]>(['live', 'stage-3', 'stage-4', 'stage-5', 'stage-6', 'live']);

  // Custom charts
  const [customCharts, setCustomCharts] = useState<Record<string, CustomChartConfig>>({});
  const [chartBuilderState, setChartBuilderState] = useState<{ open: boolean; panelIdx: number; editingId: string | null }>({
    open: false, panelIdx: 0, editingId: null,
  });

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

  const handleChangePanelView = useCallback((idx: number, view: PanelView) => {
    setPanelViews(prev => { const next = [...prev]; next[idx] = view; return next; });
  }, []);

  const handleAddPanel = useCallback(() => {
    setPanelViews(prev => [...prev, 'live']);
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

  const currentResults = hasRun ? (STAGE_RESULTS[demoStage] ?? null) : null;

  const handleSendMessage = useCallback((content: string) => {
    if (isAITyping) return;
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content, timestamp: 'Just now' };
    setMessages((prev) => [...prev, userMsg]);
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
          const nextObjectives = OBJECTIVES_BY_STAGE[step.stage];
          if (nextObjectives) setObjectives(nextObjectives);
          setHasRun(true);
          setIsLoading(false);
          setRightTab('insights');
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
        setRightTab('insights');
        setTimeout(() => setInsights((prev) => prev.map((i) => ({ ...i, isNew: false }))), 4000);
      }, 600);
    }, 2000);
  }, [isAITyping, isGenerating, setDemoStage]);

  const quickPrompts = QUICK_PROMPTS[demoStage] || [];
  const newInsightCount = insights.filter((i) => i.isNew).length;

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
              const newIdx = panelViews.length;
              handleAddPanel();
              setChartBuilderState({ open: true, panelIdx: newIdx, editingId: null });
            }}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#3F98FF] hover:text-white hover:bg-[#3F98FF] border border-[#3F98FF]/30 hover:border-[#3F98FF] rounded-md transition-all"
            title="Add a custom chart panel"
          >
            <PlusCircle className="w-3 h-3" />
            <span className="hidden sm:block">New Chart</span>
          </button>

          <button
            onClick={handleResetDemo}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:block">Reset</span>
          </button>

          <button className="flex items-center gap-1 px-2 py-1 text-[11px] text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors">
            <Share2 className="w-3 h-3" />
            <span className="hidden sm:block">Share</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-white bg-[#3F98FF] hover:bg-[#2563eb] rounded-md transition-colors font-medium shadow-sm">
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </div>

      {/* ── Main Workspace Body ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left: Config Panel */}
        <div className="w-[260px] shrink-0">
          <WorkspaceConfigPanel
            objectives={objectives}
            isLocked={demoStage >= 1}
            recipesGenerated={recipesGenerated}
            isGenerating={isGenerating}
            onGenerate={handleGenerateRecipes}
          />
        </div>

        {/* Center: Results */}
        <div className="flex-1 overflow-hidden min-w-0 flex flex-col">
          <WorkspaceCanvas
            columnCount={columnCount}
            stageResults={STAGE_RESULTS}
            currentStage={demoStage}
            isLoading={isLoading}
            hasRun={hasRun}
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

        {/* Right: Insights / Library / Chat */}
        <div className="w-[300px] shrink-0 flex flex-col border-l border-gray-200 bg-white overflow-hidden">

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
              className={`flex-1 flex items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${rightTab === 'insights' ? 'text-[#3F98FF] border-b-2 border-[#3F98FF] bg-blue-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setRightTab('insights')}
            >
              <Brain className="w-3 h-3" />
              Insights
              {newInsightCount > 0 && (
                <span className="w-3.5 h-3.5 bg-[#3F98FF] text-white rounded-full text-[8px] flex items-center justify-center">
                  {newInsightCount}
                </span>
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
            {rightTab === 'insights' ? (
              <InsightsPanel insights={insights} modelMetrics={modelMetrics} />
            ) : rightTab === 'artifacts' ? (
              <ArtifactsLibrary artifacts={LIBRARY_ARTIFACTS} onAddToCanvas={handleAddToCanvas} />
            ) : (
              <SideChatPanel
                messages={messages}
                isAITyping={isAITyping}
                quickPrompts={quickPrompts}
                onSendMessage={handleSendMessage}
              />
            )}
          </div>
        </div>
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
    </div>
  );
}

/* ── Side Chat Panel ─────────────────────────────────────────── */

function SideChatPanel({
  messages, isAITyping, quickPrompts, onSendMessage,
}: {
  messages: ChatMessage[];
  isAITyping: boolean;
  quickPrompts: Array<{ label: string; message: string; emoji: string }>;
  onSendMessage: (msg: string) => void;
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
      {quickPrompts.length > 0 && (
        <div className="px-3 py-2.5 border-t border-gray-100 bg-gradient-to-r from-[#3F98FF]/5 to-[#7c3aed]/5 shrink-0">
          <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-[#3F98FF]" /> Next step
          </div>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              disabled={isAITyping}
              onClick={() => { onSendMessage(prompt.message); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#3F98FF] border-[#3F98FF] text-white hover:bg-[#2563eb] shadow-sm active:scale-95 animate-pulse"
              style={{ animationDuration: '2.5s' }}
            >
              <span>{prompt.emoji}</span>
              <span className="flex-1 text-left">{prompt.label}</span>
              <ChevronRight className="w-3 h-3 opacity-80 shrink-0" />
            </button>
          ))}
        </div>
      )}

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