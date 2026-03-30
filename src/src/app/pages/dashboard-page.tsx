import { useState, useCallback } from 'react';
import { GenerativeDashboard, DashboardItem } from '../components/generative-dashboard';
import { ObjectivesPanel } from '../components/objectives-panel';
import { InsightsPanel, Insight, ModelMetrics } from '../components/insights-panel';
import { ArtifactsLibrary, LibraryArtifact } from '../components/artifacts-library';
import { CompactChat, ChatMessage } from '../components/compact-chat';
import { LayoutGrid, Package, Brain, Download, RefreshCw, ChevronRight } from 'lucide-react';
import { useDemoStage } from '../context/demo-context';

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

const INITIAL_ITEMS: DashboardItem[] = [
  {
    id: 'spf-perf',
    type: 'chart-bar',
    title: 'SPF Performance vs. Formulation ID',
    subtitle: 'Historical dataset · n=2,450',
    chartData: {
      data: [
        { formula: 'F-101', spf: 28.5, wr: 78, stability: 91 },
        { formula: 'F-215', spf: 34.2, wr: 83, stability: 89 },
        { formula: 'F-334', spf: 42.1, wr: 91, stability: 93 },
        { formula: 'F-412', spf: 38.6, wr: 88, stability: 90 },
        { formula: 'F-521', spf: 47.3, wr: 94, stability: 95 },
        { formula: 'F-633', spf: 44.9, wr: 92, stability: 92 },
        { formula: 'F-718', spf: 50.2, wr: 96, stability: 97 },
      ],
      xAxisKey: 'formula',
      yAxisKeys: [
        { key: 'spf', color: '#3F98FF', name: 'SPF Value' },
        { key: 'wr', color: '#7c3aed', name: 'Water Resistance %' },
        { key: 'stability', color: '#059669', name: 'Stability %' },
      ],
    },
    layout: { x: 0, y: 0, w: 7, h: 4 },
  },
  {
    id: 'dataset-stats',
    type: 'stats',
    title: 'Dataset Overview',
    subtitle: 'Sunscreen formulation dataset',
    content: {
      stats: [
        { label: 'Total Experiments', value: '2,450', badge: 'Clean', badgeBg: '#f0fdf4', badgeColor: '#16a34a' },
        { label: 'Active Ingredients', value: '18', badge: 'Features', badgeBg: '#eff6ff', badgeColor: '#3F98FF' },
        { label: 'UV Filters Screened', value: '6', badge: 'Compounds', badgeBg: '#fdf4ff', badgeColor: '#7c3aed' },
        { label: 'Outliers Removed', value: '3', badge: 'QC Pass', badgeBg: '#f0fdf4', badgeColor: '#16a34a' },
        { label: 'SPF Range (data)', value: '10–68', trend: null },
        { label: 'Highest R² (EDA)', value: 'ZnO → SPF: 0.82', badge: '★ Key', badgeBg: '#fffbeb', badgeColor: '#d97706' },
      ],
    },
    layout: { x: 7, y: 0, w: 5, h: 4 },
  },
  {
    id: 'corr-heatmap',
    type: 'heatmap',
    title: 'Ingredient Correlation Matrix',
    subtitle: 'Pearson r — Spearman rho aligned',
    content: {
      labels: ['ZnO', 'TiO₂', 'Avo', 'Oct', 'Emol', 'pH', 'H₂O', 'SPF'],
      matrix: [
        [1.0, 0.42, 0.18, 0.22, -0.31, -0.12, 0.08, 0.82],
        [0.42, 1.0, 0.25, 0.31, -0.18, 0.05, -0.12, 0.74],
        [0.18, 0.25, 1.0, 0.56, 0.22, -0.08, 0.14, 0.61],
        [0.22, 0.31, 0.56, 1.0, 0.11, -0.15, 0.09, 0.58],
        [-0.31, -0.18, 0.22, 0.11, 1.0, 0.28, -0.22, -0.35],
        [-0.12, 0.05, -0.08, -0.15, 0.28, 1.0, 0.18, -0.28],
        [0.08, -0.12, 0.14, 0.09, -0.22, 0.18, 1.0, 0.15],
        [0.82, 0.74, 0.61, 0.58, -0.35, -0.28, 0.15, 1.0],
      ],
    },
    layout: { x: 0, y: 4, w: 6, h: 4 },
  },
  {
    id: 'stability-time',
    type: 'chart-line',
    title: 'Stability Over Time (24-Month Forecast)',
    subtitle: 'Three top candidate formulations',
    chartData: {
      data: [
        { month: 'M0', F101: 100, F521: 100, F718: 100 },
        { month: 'M3', F101: 97, F521: 98, F718: 99 },
        { month: 'M6', F101: 94, F521: 96, F718: 98 },
        { month: 'M9', F101: 91, F521: 94, F718: 97 },
        { month: 'M12', F101: 88, F521: 92, F718: 96 },
        { month: 'M18', F101: 83, F521: 89, F718: 95 },
        { month: 'M24', F101: 78, F521: 85, F718: 94 },
      ],
      xAxisKey: 'month',
      yAxisKeys: [
        { key: 'F101', color: '#94a3b8', name: 'F-101 (Control)' },
        { key: 'F521', color: '#7c3aed', name: 'F-521 (Standard)' },
        { key: 'F718', color: '#3F98FF', name: 'F-718 (Optimized)' },
      ],
    },
    layout: { x: 6, y: 4, w: 6, h: 4 },
  },
];

const DEMO_STEPS = [
  {
    stage: 3,
    userMsg: 'Train a gradient boosted ensemble model (XGBoost + Random Forest) to predict SPF using 5-fold cross-validation',
    aiMsg: '✅ **Model training complete.** XGBoost + Random Forest ensemble trained on 2,447 formulations (80/20 split).\n\n📊 **Performance:** R²=0.94, RMSE=2.3, Accuracy=96.2% on held-out test set\n\n🔑 **Top drivers:** Zinc Oxide % (SHAP=0.68), TiO₂ % (0.54), Avobenzone % (0.42)\n\n⚠️ Caution: Formulations with >12% TiO₂ show reduced long-term stability — flagged in SHAP analysis.\n\nModel is ready for multi-objective optimization.',
    newItems: [
      {
        id: 'shap-importance',
        type: 'shap' as const,
        title: 'SHAP Feature Importance',
        subtitle: 'XGBoost model · Global Shapley values',
        content: {
          shapData: [
            { feature: 'Zinc Oxide %', value: 0.68 },
            { feature: 'Titanium Dioxide %', value: 0.54 },
            { feature: 'Avobenzone %', value: 0.42 },
            { feature: 'Octocrylene %', value: 0.35 },
            { feature: 'Emollient Type', value: -0.22 },
            { feature: 'pH Level', value: -0.18 },
            { feature: 'Water Content %', value: 0.12 },
            { feature: 'Viscosity Agent', value: -0.08 },
          ],
        },
        layout: { x: 0, y: 8, w: 5, h: 4 },
      },
      {
        id: 'model-metrics',
        type: 'radar' as const,
        title: 'Multi-Objective Model Scorecard',
        subtitle: 'Normalized performance across all targets',
        chartData: {
          data: [
            { metric: 'R² Score', F718: 94, F521: 87, F101: 72 },
            { metric: 'Accuracy', F718: 96, F521: 89, F101: 75 },
            { metric: 'Precision', F718: 95, F521: 88, F101: 71 },
            { metric: 'Recall', F718: 93, F521: 86, F101: 70 },
            { metric: 'F1 Score', F718: 94, F521: 87, F101: 70 },
            { metric: 'Stability', F718: 97, F521: 91, F101: 78 },
          ],
          xAxisKey: 'metric',
          yAxisKeys: [
            { key: 'F718', color: '#3F98FF', name: 'F-718 (Lead)' },
            { key: 'F521', color: '#7c3aed', name: 'F-521' },
          ],
        },
        layout: { x: 5, y: 8, w: 4, h: 4 },
      },
      {
        id: 'molecule-avo',
        type: 'molecule' as const,
        title: 'Avobenzone — UVA Filter',
        subtitle: '3.0% w/w · Key organic UV blocker',
        layout: { x: 9, y: 8, w: 3, h: 4 },
      },
    ],
    newInsights: [
      {
        id: 'ins-model',
        type: 'model' as const,
        title: 'Ensemble Model Trained',
        message: 'XGBoost + Random Forest ensemble achieves R²=0.94 on 2,447 formulations. 5-fold CV confirms stability of predictions across feature space.',
        confidence: 0.96,
        timestamp: 'Just now',
        isNew: true,
      },
      {
        id: 'ins-shap',
        type: 'prediction' as const,
        title: 'Key Predictor Identified',
        message: 'Zinc Oxide concentration is the dominant driver of SPF (SHAP=0.68, p<0.001). Increasing ZnO from 12→16% predicts a +8.4 SPF improvement.',
        confidence: 0.94,
        timestamp: 'Just now',
        isNew: true,
      },
      {
        id: 'ins-warn',
        type: 'warning' as const,
        title: 'TiO₂ Stability Trade-off',
        message: 'SHAP analysis reveals >12% TiO₂ correlates with −0.18 long-term stability score. Recommend capping at 10% in optimization constraints.',
        confidence: 0.88,
        timestamp: 'Just now',
        isNew: true,
      },
    ],
    modelMetrics: { r2Score: 0.94, rmse: 2.3, accuracy: 0.962, trainSamples: 2447, features: 18, modelType: 'XGBoost+RF' },
  },
  {
    stage: 4,
    userMsg: 'Run multi-objective Bayesian optimization across all 4 objectives: maximize SPF, water resistance, stability; minimize cost',
    aiMsg: '⚡ **Bayesian optimization complete — 1,000 iterations.** Explored 18-dimensional formulation space using Expected Improvement acquisition.\n\n🏆 **Results:** 47 Pareto-optimal candidates identified. Lead candidate **R-047** achieves:\n• SPF: 52.3 (+47% vs. baseline)\n• Water Resistance: 96.8%\n• Stability Index: 0.97 at 24 months\n• Cost: −12% vs. reference\n\nAll 4 objectives satisfied simultaneously. Recommend proceeding to recipe generation.',
    newItems: [
      {
        id: 'pareto-front',
        type: 'scatter' as const,
        title: 'Pareto Front — SPF vs. Cost',
        subtitle: '47 Pareto-optimal · R-047 is global lead ★',
        content: { paretoData: null },
        layout: { x: 0, y: 12, w: 7, h: 4.5 },
      },
      {
        id: 'top-candidates',
        type: 'table' as const,
        title: 'Top 10 Candidate Formulations',
        subtitle: 'Ranked by multi-objective composite score',
        content: {
          rows: [
            { Rank: '★ 1', ID: 'R-047', 'ZnO %': 15.2, 'TiO₂ %': 8.5, 'Avo %': 3.0, 'Pred. SPF': 52.3, 'Water Res.': '96.8%', Stability: '97.0%', Score: '98.2' },
            { Rank: '2', ID: 'R-089', 'ZnO %': 14.8, 'TiO₂ %': 9.0, 'Avo %': 2.8, 'Pred. SPF': 50.1, 'Water Res.': '95.2%', Stability: '96.5%', Score: '96.8' },
            { Rank: '3', ID: 'R-124', 'ZnO %': 15.5, 'TiO₂ %': 8.0, 'Avo %': 3.2, 'Pred. SPF': 51.8, 'Water Res.': '96.0%', Stability: '96.8%', Score: '96.4' },
            { Rank: '4', ID: 'R-203', 'ZnO %': 14.2, 'TiO₂ %': 9.5, 'Avo %': 2.5, 'Pred. SPF': 48.9, 'Water Res.': '94.8%', Stability: '95.9%', Score: '94.7' },
            { Rank: '5', ID: 'R-317', 'ZnO %': 16.0, 'TiO₂ %': 7.5, 'Avo %': 3.5, 'Pred. SPF': 53.1, 'Water Res.': '95.5%', Stability: '95.2%', Score: '94.1' },
          ],
        },
        layout: { x: 7, y: 12, w: 5, h: 4.5 },
      },
      {
        id: 'optim-convergence',
        type: 'chart-area' as const,
        title: 'Optimization Convergence',
        subtitle: 'Best composite score per iteration',
        chartData: {
          data: [
            { iter: 0, best: 62, mean: 58 },
            { iter: 100, best: 74, mean: 65 },
            { iter: 200, best: 82, mean: 72 },
            { iter: 300, best: 87, mean: 77 },
            { iter: 400, best: 91, mean: 82 },
            { iter: 500, best: 94, mean: 86 },
            { iter: 600, best: 96, mean: 89 },
            { iter: 700, best: 97, mean: 91 },
            { iter: 800, best: 97.8, mean: 93 },
            { iter: 900, best: 98.1, mean: 94 },
            { iter: 1000, best: 98.2, mean: 94.8 },
          ],
          xAxisKey: 'iter',
          yAxisKeys: [
            { key: 'best', color: '#3F98FF', name: 'Best Score' },
            { key: 'mean', color: '#7c3aed', name: 'Mean Score' },
          ],
        },
        layout: { x: 0, y: 16.5, w: 6, h: 3.5 },
      },
    ],
    newInsights: [
      {
        id: 'ins-opt1',
        type: 'recommendation' as const,
        title: 'Lead Candidate: R-047',
        message: 'R-047 achieves all 4 objectives simultaneously: SPF 52.3, WR 96.8%, Stability 97.0%, Cost −12%. This formulation sits at the Pareto frontier with the highest composite score.',
        confidence: 0.97,
        timestamp: 'Just now',
        isNew: true,
      },
      {
        id: 'ins-opt2',
        type: 'prediction' as const,
        title: '47 Pareto-Optimal Found',
        message: '47 formulations lie on the Pareto front. Top 3 differ primarily in ZnO:TiO₂ ratio. All achieve SPF ≥50 and water resistance ≥94%.',
        confidence: 0.95,
        timestamp: 'Just now',
        isNew: true,
      },
    ],
  },
  {
    stage: 5,
    userMsg: 'Generate detailed formulation recipes for the top 3 Pareto-optimal candidates with full ingredient specifications',
    aiMsg: '🧪 **3 formulation recipes generated.** Full specifications with predicted performance bounds and synthesis notes:\n\n**R-047 (LEAD):** ZnO 15.2%, TiO₂ 8.5%, Avobenzone 3.0%, Octocrylene 2.2%, Cyclopentasiloxane 12.0%, Dimethicone 5.0%, Aqua q.s. → Predicted SPF 52.3 ±1.8 (95% CI)\n\n**R-089 (BACKUP 1):** Similar profile, lower ZnO (14.8%), better sensory properties\n\n**R-124 (BACKUP 2):** Higher ZnO (15.5%), marginally higher SPF prediction (51.8) with excellent stability\n\nAll 3 meet EU Cosmetics Regulation 1223/2009 UV filter concentration limits.',
    newItems: [
      {
        id: 'recipe-047',
        type: 'recipe' as const,
        title: 'Recipe R-047 — Lead Candidate ★',
        subtitle: 'SPF 50+ · Predicted CI: 96.2% · Validated',
        content: {
          recipe: {
            id: 'R-047',
            name: 'SPF 50+ Optimized',
            spf: 52.3,
            wr: 96.8,
            stability: 97,
            cost: -12,
            ingredients: [
              { name: 'Zinc Oxide (nano)', pct: 15.2, role: 'Primary UV filter', color: '#3F98FF' },
              { name: 'Titanium Dioxide', pct: 8.5, role: 'Broad-spectrum UV', color: '#7c3aed' },
              { name: 'Avobenzone', pct: 3.0, role: 'UVA organic filter', color: '#059669' },
              { name: 'Octocrylene', pct: 2.2, role: 'UV stabilizer', color: '#ea580c' },
              { name: 'Cyclopentasiloxane', pct: 12.0, role: 'Emollient', color: '#0891b2' },
              { name: 'Dimethicone', pct: 5.0, role: 'Skin feel agent', color: '#db2777' },
              { name: 'Aqua / Water', pct: 54.1, role: 'Solvent base', color: '#6366f1' },
            ],
          },
        },
        layout: { x: 0, y: 20, w: 5, h: 4.5 },
      },
      {
        id: 'spf-comparison',
        type: 'chart-bar' as const,
        title: 'Top 3 Recipes — Performance Comparison',
        subtitle: 'Predicted values with 95% confidence intervals',
        chartData: {
          data: [
            { recipe: 'R-047', spf: 52.3, wr: 96.8, stability: 97.0 },
            { recipe: 'R-089', spf: 50.1, wr: 95.2, stability: 96.5 },
            { recipe: 'R-124', spf: 51.8, wr: 96.0, stability: 96.8 },
            { recipe: 'Baseline', spf: 35.5, wr: 82.0, stability: 88.0 },
          ],
          xAxisKey: 'recipe',
          yAxisKeys: [
            { key: 'spf', color: '#3F98FF', name: 'SPF Value' },
            { key: 'wr', color: '#7c3aed', name: 'Water Resistance %' },
            { key: 'stability', color: '#059669', name: 'Stability % (24M)' },
          ],
        },
        layout: { x: 5, y: 20, w: 7, h: 4.5 },
      },
    ],
    newInsights: [
      {
        id: 'ins-recipe',
        type: 'recommendation' as const,
        title: 'Ready for Wet Lab Validation',
        message: 'Top 3 recipes generated with full INCI specifications and synthesis notes. Recommend starting with R-047 (smallest batch: 500g) for in-vitro SPF testing per ISO 24444:2019.',
        confidence: 0.93,
        timestamp: 'Just now',
        isNew: true,
      },
      {
        id: 'ins-reg',
        type: 'info' as const,
        title: 'Regulatory Compliance',
        message: 'All 3 formulations comply with EU Cosmetics Regulation 1223/2009: ZnO ≤25%, TiO₂ ≤25%, Avobenzone ≤5%, Octocrylene ≤10%.',
        confidence: 0.99,
        timestamp: 'Just now',
        isNew: true,
      },
    ],
  },
  {
    stage: 6,
    userMsg: 'Generate a comprehensive R&D report summarizing all analyses, model performance, optimization results, and top formulation recommendations',
    aiMsg: '📄 **Report generated: \'Sunscreen SPF Optimization — R&D Summary v1.0\'**\n\n✅ 24 pages · 12 figures · 8 data tables · Executive summary included\n\n📋 **Contents:** Executive Summary · Dataset Analysis (n=2,450) · Model Performance (R²=0.94) · SHAP Interpretation · Bayesian Optimization Results · 3 Formulation Recipes · Regulatory Assessment · Appendix\n\n🔒 Report locked to project version. Ready for download as PDF or PPTX.',
    newItems: [
      {
        id: 'report-summary',
        type: 'text' as const,
        title: 'R&D Report — Executive Summary',
        subtitle: 'Sunscreen SPF Optimization v1.0 · March 2026',
        content: {
          lines: [
            { type: 'heading', text: 'Project Overview' },
            { type: 'paragraph', text: 'Multi-objective optimization of SPF 50+ sunscreen formulations using Noble AI VIP Platform. Dataset: 2,450 historical experiments across 18 ingredient features.' },
            { type: 'heading', text: 'Key Results' },
            { type: 'metric', label: 'Predictive Model R²', value: '0.94 (XGBoost+RF)' },
            { type: 'metric', label: 'Pareto Candidates Found', value: '47 formulations' },
            { type: 'metric', label: 'Lead Formulation SPF', value: '52.3 (target: ≥50 ✓)' },
            { type: 'metric', label: 'Water Resistance', value: '96.8% (target: >90% ✓)' },
            { type: 'metric', label: 'Stability at 24M', value: '97.0% (target: >97% ✓)' },
            { type: 'metric', label: 'Cost vs. Reference', value: '−12% (target: minimize ✓)' },
            { type: 'heading', text: 'Recommended Next Steps' },
            { type: 'bullet', text: 'Wet lab synthesis of R-047 (priority: high) · estimated 2 weeks' },
            { type: 'bullet', text: 'In-vitro SPF testing per ISO 24444:2019' },
            { type: 'bullet', text: 'Stability study at 40°C/75% RH (ICH Q1A guidance)' },
            { type: 'bullet', text: 'Submit for EU CPNP notification upon batch validation' },
          ],
        },
        layout: { x: 0, y: 24.5, w: 6, h: 5 },
      },
    ],
    newInsights: [
      {
        id: 'ins-complete',
        type: 'prediction' as const,
        title: 'Optimization Complete ✓',
        message: 'All 6 workflow stages completed. 4/4 objectives achieved by lead formulation R-047. Time from project setup to validated recipe: ~35 minutes with Noble AI VIP.',
        confidence: 0.99,
        timestamp: 'Just now',
        isNew: true,
      },
    ],
  },
];

const OBJECTIVES_BASE: Objective[] = [
  { id: 'o1', attribute: 'SPF Protection', target: 'maximize', value: 50, unit: '', priority: 'high', status: 'active', progress: 0 },
  { id: 'o2', attribute: 'Water Resistance', target: 'maximize', value: '90%', unit: '', priority: 'high', status: 'active', progress: 0 },
  { id: 'o3', attribute: 'Product Stability', target: 'maximize', value: '97% at 24M', priority: 'medium', status: 'active', progress: 0 },
  { id: 'o4', attribute: 'Production Cost', target: 'minimize', priority: 'medium', status: 'pending', progress: 0 },
];

const OBJECTIVES_BY_STAGE: Record<number, Objective[]> = {
  2: OBJECTIVES_BASE.map((o) => ({ ...o, status: 'active' as const, progress: 15 })),
  3: OBJECTIVES_BASE.map((o) => ({ ...o, status: 'active' as const, progress: 45 })),
  4: [
    { ...OBJECTIVES_BASE[0], status: 'achieved', progress: 100, currentValue: '52.3' },
    { ...OBJECTIVES_BASE[1], status: 'achieved', progress: 100, currentValue: '96.8%' },
    { ...OBJECTIVES_BASE[2], status: 'achieved', progress: 100, currentValue: '97.0%' },
    { ...OBJECTIVES_BASE[3], status: 'achieved', progress: 100, currentValue: '−12%' },
  ],
  5: [
    { ...OBJECTIVES_BASE[0], status: 'achieved', progress: 100, currentValue: '52.3' },
    { ...OBJECTIVES_BASE[1], status: 'achieved', progress: 100, currentValue: '96.8%' },
    { ...OBJECTIVES_BASE[2], status: 'achieved', progress: 100, currentValue: '97.0%' },
    { ...OBJECTIVES_BASE[3], status: 'achieved', progress: 100, currentValue: '−12%' },
  ],
  6: [
    { ...OBJECTIVES_BASE[0], status: 'achieved', progress: 100, currentValue: '52.3' },
    { ...OBJECTIVES_BASE[1], status: 'achieved', progress: 100, currentValue: '96.8%' },
    { ...OBJECTIVES_BASE[2], status: 'achieved', progress: 100, currentValue: '97.0%' },
    { ...OBJECTIVES_BASE[3], status: 'achieved', progress: 100, currentValue: '−12%' },
  ],
};

const INITIAL_INSIGHTS: Insight[] = [
  { id: 'init-1', type: 'info', title: 'Dataset Loaded', message: '2,450 sunscreen formulations loaded from internal R&D database. 3 outliers removed (Mahalanobis distance >3σ). Data quality score: 98.8%.', confidence: 0.99, timestamp: '2 hours ago' },
  { id: 'init-2', type: 'recommendation', title: 'Key Correlation Found', message: 'Strong positive correlation: ZnO ↔ SPF (r=0.82), TiO₂ ↔ Stability (r=0.74). These are the primary levers for optimization.', confidence: 0.91, timestamp: '1 hour ago' },
  { id: 'init-3', type: 'warning', title: 'Negative Correlation Alert', message: 'Emollient concentration negatively correlates with SPF (r=−0.35). High emollient content may reduce UV filter efficacy through dilution effects.', confidence: 0.87, timestamp: '1 hour ago' },
];

const LIBRARY_ARTIFACTS: LibraryArtifact[] = [
  { id: 'lib-1', name: 'SPF Correlation Heatmap', type: 'heatmap', timestamp: '2h ago', category: 'Analysis', size: '18×18' },
  { id: 'lib-2', name: 'Historical Formulations Table', type: 'table', timestamp: 'Yesterday', category: 'Data', size: '2,450 rows' },
  { id: 'lib-3', name: 'Avobenzone Structure', type: 'molecule', timestamp: '3d ago', category: 'Molecules' },
  { id: 'lib-4', name: 'Zinc Oxide Nanoparticle', type: 'molecule', timestamp: '3d ago', category: 'Molecules' },
  { id: 'lib-5', name: 'Cost vs. Performance', type: 'chart-bar', timestamp: 'Last week', category: 'Analysis' },
  { id: 'lib-6', name: 'Regulatory Requirements EU', type: 'text', timestamp: 'Last week', category: 'Reports' },
  { id: 'lib-7', name: 'Surfactant CMC Dataset', type: 'table', timestamp: '2w ago', category: 'Data', size: '1,820 rows' },
  { id: 'lib-8', name: 'Previous SPF Model (v2)', type: 'stats', timestamp: '1mo ago', category: 'Models' },
  { id: 'lib-9', name: 'Emollient Study Results', type: 'chart-line', timestamp: '1mo ago', category: 'Analysis' },
];

const QUICK_PROMPTS: Record<number, Array<{ label: string; message: string; emoji: string }>> = {
  2: [{ label: 'Train predictive model', message: 'Train a gradient boosted ensemble model (XGBoost + Random Forest) to predict SPF using 5-fold cross-validation', emoji: '🤖' }],
  3: [{ label: 'Run Bayesian optimization', message: 'Run multi-objective Bayesian optimization across all 4 objectives: maximize SPF, water resistance, stability; minimize cost', emoji: '⚡' }],
  4: [{ label: 'Generate formulation recipes', message: 'Generate detailed formulation recipes for the top 3 Pareto-optimal candidates with full ingredient specifications', emoji: '🧪' }],
  5: [{ label: 'Export R&D report', message: 'Generate a comprehensive R&D report summarizing all analyses, model performance, optimization results, and top formulation recommendations', emoji: '📄' }],
  6: [],
};

export function DashboardPage() {
  const { demoStage, setDemoStage } = useDemoStage();
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>(INITIAL_ITEMS);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content: '👋 Welcome to Noble AI VIP! This project has been initialized with 2,450 historical sunscreen formulations. Dataset analysis and correlation mapping are complete.\n\nObjectives are set: Maximize SPF ≥50, Water Resistance >90%, Stability, and minimize cost. Use the quick prompt below to advance the workflow.',
      timestamp: '2 hours ago',
    },
  ]);
  const [isAITyping, setIsAITyping] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [rightTab, setRightTab] = useState<'insights' | 'artifacts'>('insights');
  const [insights, setInsights] = useState<Insight[]>(INITIAL_INSIGHTS);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>(
    OBJECTIVES_BY_STAGE[2] || OBJECTIVES_BASE.map((o) => ({ ...o, status: 'active' as const, progress: 15 }))
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      if (isAITyping) return;
      const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content, timestamp: 'Just now' };
      setMessages((prev) => [...prev, userMsg]);
      setIsAITyping(true);
      if (!isChatExpanded) setIsChatExpanded(true);

      const step = DEMO_STEPS.find((s) => s.userMsg === content);

      setTimeout(() => {
        const aiContent =
          step?.aiMsg ||
          `I'll analyze that request. Based on the current formulation dataset and optimization framework, I can generate relevant insights. Let me process your query against the 2,450 historical formulations...`;
        const aiMsg: ChatMessage = { id: `ai-${Date.now()}`, role: 'assistant', content: aiContent, timestamp: 'Just now' };
        setMessages((prev) => [...prev, aiMsg]);
        setIsAITyping(false);

        if (step) {
          setTimeout(() => {
            const newWithFlag = step.newItems.map((item) => ({ ...item, isNew: true }));
            setDashboardItems((prev) => [...prev, ...(newWithFlag as DashboardItem[])]);
            setInsights((prev) => [...step.newInsights.map((i) => ({ ...i, isNew: true })), ...prev.map((i) => ({ ...i, isNew: false }))]);
            if (step.modelMetrics) setModelMetrics(step.modelMetrics);
            setDemoStage(step.stage);
            const nextObjectives = OBJECTIVES_BY_STAGE[step.stage];
            if (nextObjectives) setObjectives(nextObjectives);
            setRightTab('insights');
            setTimeout(() => {
              setDashboardItems((prev) => prev.map((item) => ({ ...item, isNew: false })));
              setInsights((prev) => prev.map((i) => ({ ...i, isNew: false })));
            }, 4000);
          }, 600);
        }
      }, 1800);
    },
    [isAITyping, isChatExpanded, setDemoStage]
  );

  const handleLayoutChange = useCallback((updatedItems: DashboardItem[]) => {
    setDashboardItems(updatedItems);
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setDashboardItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleAddToCanvas = useCallback(
    (artifactId: string) => {
      const artifact = LIBRARY_ARTIFACTS.find((a) => a.id === artifactId);
      if (!artifact) return;
      const maxY = dashboardItems.reduce((max, item) => Math.max(max, item.layout.y + item.layout.h), 0);
      const newItem: DashboardItem = { id: `lib-${artifactId}-${Date.now()}`, type: artifact.type, title: artifact.name, isNew: true, layout: { x: 0, y: maxY + 0.5, w: 6, h: 3.5 } };
      setDashboardItems((prev) => [...prev, newItem]);
    },
    [dashboardItems]
  );

  const handleResetDemo = useCallback(() => {
    setDemoStage(2);
    setDashboardItems(INITIAL_ITEMS);
    setMessages([{ id: 'init-msg', role: 'assistant', content: '👋 Welcome to Noble AI VIP! This project has been initialized with 2,450 historical sunscreen formulations. Dataset analysis and correlation mapping are complete.\n\nObjectives are set: Maximize SPF ≥50, Water Resistance >90%, Stability, and minimize cost. Use the quick prompt below to advance the workflow.', timestamp: '2 hours ago' }]);
    setInsights(INITIAL_INSIGHTS);
    setModelMetrics(null);
    setObjectives(OBJECTIVES_BY_STAGE[2] || OBJECTIVES_BASE.map((o) => ({ ...o, status: 'active' as const, progress: 15 })));
    setIsChatExpanded(false);
    setRightTab('insights');
  }, [setDemoStage]);

  const quickPrompts = QUICK_PROMPTS[demoStage] || [];

  return (
    <>
      {/* Objectives Panel */}
      <div className="w-[200px] shrink-0">
        <ObjectivesPanel objectives={objectives} projectTitle="Sunscreen SPF Optimization" isLocked={demoStage >= 1} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-4 h-4 text-[#3F98FF]" />
            <h1 className="text-sm font-bold text-gray-900">Generative Dashboard</h1>
            <div className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">Sunscreen SPF Optimization</span>
            </div>
            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {dashboardItems.length} artifact{dashboardItems.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-semibold text-green-700">Noble AI Active</span>
            </div>
            <button onClick={handleResetDemo} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
              <RefreshCw className="w-3 h-3" />
              Reset Demo
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-white bg-[#3F98FF] hover:bg-[#2563eb] rounded-lg transition-colors shadow-sm">
              <Download className="w-3 h-3" />
              Export
            </button>
          </div>
        </div>

        {/* Dashboard Canvas */}
        <div className="flex-1 overflow-hidden">
          <GenerativeDashboard items={dashboardItems} onLayoutChange={handleLayoutChange} onRemoveItem={handleRemoveItem} />
        </div>

        {/* Compact Chat */}
        <CompactChat
          messages={messages}
          onSendMessage={handleSendMessage}
          isExpanded={isChatExpanded}
          onToggleExpanded={() => setIsChatExpanded(!isChatExpanded)}
          isAITyping={isAITyping}
          quickPrompts={quickPrompts}
          demoStage={demoStage}
        />
      </div>

      {/* Right Panel */}
      <div className="w-[268px] shrink-0 flex flex-col border-l border-gray-200 bg-white overflow-hidden">
        <div className="flex border-b border-gray-200 shrink-0">
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${rightTab === 'insights' ? 'text-[#3F98FF] border-b-2 border-[#3F98FF] bg-blue-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setRightTab('insights')}
          >
            <Brain className="w-3.5 h-3.5" />
            Insights
            {insights.filter((i) => i.isNew).length > 0 && (
              <span className="w-4 h-4 bg-[#3F98FF] text-white rounded-full text-[9px] flex items-center justify-center">
                {insights.filter((i) => i.isNew).length}
              </span>
            )}
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${rightTab === 'artifacts' ? 'text-[#3F98FF] border-b-2 border-[#3F98FF] bg-blue-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setRightTab('artifacts')}
          >
            <Package className="w-3.5 h-3.5" />
            Library
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {rightTab === 'insights' ? (
            <InsightsPanel insights={insights} modelMetrics={modelMetrics} />
          ) : (
            <ArtifactsLibrary artifacts={LIBRARY_ARTIFACTS} onAddToCanvas={handleAddToCanvas} />
          )}
        </div>
      </div>
    </>
  );
}
