import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ChevronRight, ExternalLink, Database, BrainCircuit, BarChart3,
  FileText, CheckCircle2, AlertCircle, Circle, Clock, Users, Download,
  Tag, Eye, Activity, Zap, Shield, ArrowUpRight, Plus, TrendingUp,
  FlaskConical, Star, FileBarChart, BarChart2, GitBranch, Cpu,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';

/* ── Shared project meta ─────────────────────────────────────── */

const PROJECTS: Record<string, {
  id: string; name: string; domain: string; domainColor: string;
  description: string; status: 'active' | 'complete' | 'draft' | 'paused';
  currentStage: number; totalStages: number; owner: string;
  team: { initials: string; color: string }[];
  objective: string; targetMetric?: string; bestR2?: number; created: string;
}> = {
  '1': {
    id: '1', name: 'Sunscreen SPF Optimization', domain: 'UV Protection', domainColor: '#3F98FF',
    description: 'Multi-objective optimization of SPF 50+ sunscreen formulations targeting superior water resistance, 24-month stability, and cost efficiency using 2,450 historical experiments.',
    status: 'active', currentStage: 2, totalStages: 6, owner: 'Dr. Sarah Chen',
    team: [{ initials: 'SC', color: '#3F98FF' }, { initials: 'JP', color: '#7c3aed' }, { initials: 'MS', color: '#059669' }],
    objective: 'Maximize SPF ≥50, Water Resistance >90%, Stability >97%, minimize cost', targetMetric: 'SPF 50+', bestR2: 0.94, created: 'Jan 12, 2026',
  },
  '2': {
    id: '2', name: 'Surfactant CMC Prediction', domain: 'Surface Chemistry', domainColor: '#7c3aed',
    description: 'Machine learning model to predict critical micelle concentration (CMC) for novel surfactant candidates, enabling virtual screening before costly synthesis.',
    status: 'complete', currentStage: 6, totalStages: 6, owner: 'Dr. Sarah Chen',
    team: [{ initials: 'SC', color: '#3F98FF' }, { initials: 'AK', color: '#ea580c' }],
    objective: 'Predict CMC within 0.5 mM accuracy', targetMetric: 'CMC accuracy', bestR2: 0.887, created: 'Nov 5, 2025',
  },
  '3': {
    id: '3', name: 'Emollient Texture Analysis', domain: 'Sensory Science', domainColor: '#059669',
    description: 'Optimization of emollient blend ratios for luxury skincare to maximize sensory scores while maintaining rheological stability.',
    status: 'active', currentStage: 3, totalStages: 6, owner: 'Dr. Emma Richardson',
    team: [{ initials: 'ER', color: '#059669' }, { initials: 'JP', color: '#7c3aed' }],
    objective: 'Sensory score ≥8.5/10 at target cost', targetMetric: 'Sensory Score', bestR2: 0.912, created: 'Dec 20, 2025',
  },
  '4': {
    id: '4', name: 'UV Filter Photo-Stability', domain: 'Photochemistry', domainColor: '#ea580c',
    description: 'Predictive modeling of UV filter degradation kinetics under simulated solar radiation to identify stabilizer combinations that extend photostability.',
    status: 'active', currentStage: 2, totalStages: 6, owner: 'Dr. Sarah Chen',
    team: [{ initials: 'SC', color: '#3F98FF' }, { initials: 'YT', color: '#db2777' }],
    objective: 'Photostability T½ ≥ 4h under UV-A/B', targetMetric: 'Photo T½', created: 'Mar 10, 2026',
  },
  '5': {
    id: '5', name: 'Transdermal Penetration Model', domain: 'Drug Delivery', domainColor: '#0891b2',
    description: 'Mechanistic and data-driven model of active ingredient penetration through ex-vivo human skin (Franz diffusion cell).',
    status: 'draft', currentStage: 0, totalStages: 6, owner: 'Unassigned',
    team: [],
    objective: 'Flux rate optimization across stratum corneum', targetMetric: 'Flux (µg/cm²/h)', created: 'Mar 12, 2026',
  },
};

const STAGE_LABELS = ['Setup', 'Objectives', 'EDA', 'Modeling', 'Optimization', 'Recipes', 'Report'];

const STATUS_CONFIG = {
  active:   { label: 'Active',    color: '#3F98FF', bg: '#eff6ff' },
  complete: { label: 'Complete',  color: '#059669', bg: '#f0fdf4' },
  draft:    { label: 'Draft',     color: '#9ca3af', bg: '#f9fafb' },
  paused:   { label: 'Paused',    color: '#d97706', bg: '#fffbeb' },
};

/* ── Per-project data ────────────────────────────────────────── */

const PROJECT_DATASETS: Record<string, {
  id: string; name: string; rows: number; columns: number;
  sizeMB: number; quality: number; format: string; tags: string[];
  lastUpdated: string; status: 'ready' | 'processing' | 'warning'; description: string;
}[]> = {
  '1': [
    { id: 'ds-1', name: 'Sunscreen Formulation Database', rows: 2450, columns: 18, sizeMB: 4.2, quality: 98.8, format: 'CSV', tags: ['sunscreen', 'SPF', 'UV filters'], lastUpdated: '2 days ago', status: 'ready', description: 'Historical R&D dataset of 2,450 sunscreen formulations with measured SPF, water resistance, and stability outcomes.' },
    { id: 'ds-2', name: 'UV Filter Ingredient Library', rows: 312, columns: 24, sizeMB: 0.8, quality: 97.1, format: 'CSV', tags: ['UV filters', 'INCI', 'regulatory'], lastUpdated: '1 week ago', status: 'ready', description: 'Curated library of 312 UV filter ingredients with regulatory limits, INCI names, and physicochemical properties.' },
  ],
  '2': [
    { id: 'ds-3', name: 'Surfactant CMC Dataset', rows: 1820, columns: 22, sizeMB: 2.1, quality: 96.3, format: 'CSV', tags: ['CMC', 'surfactant', 'surface tension'], lastUpdated: '3 weeks ago', status: 'ready', description: 'CMC measurements for 1,820 surfactant molecules across ionic classifications.' },
  ],
  '3': [
    { id: 'ds-4', name: 'Emollient Sensory Panel Results', rows: 445, columns: 14, sizeMB: 0.6, quality: 95.0, format: 'CSV', tags: ['sensory', 'emollient', 'panel'], lastUpdated: '2 weeks ago', status: 'ready', description: 'Trained panel scores for spreadability, silkiness, and greasiness across 445 emollient blends.' },
  ],
  '4': [
    { id: 'ds-5', name: 'Photostability Test Results', rows: 389, columns: 16, sizeMB: 1.1, quality: 93.4, format: 'CSV', tags: ['photostability', 'UV-A', 'UV-B', 'degradation'], lastUpdated: '1 week ago', status: 'warning', description: 'ISO 24444 photostability test results for UV filter combinations under simulated solar radiation.' },
  ],
  '5': [
    { id: 'ds-6', name: 'Franz Cell Permeation Data', rows: 128, columns: 12, sizeMB: 0.3, quality: 91.2, format: 'CSV', tags: ['permeation', 'Franz cell', 'skin'], lastUpdated: '3 days ago', status: 'processing', description: 'Ex-vivo human skin permeation data from Franz diffusion cell experiments.' },
  ],
};

const PROJECT_MODELS: Record<string, {
  id: string; name: string; version: string; type: string; framework: string;
  status: 'deployed' | 'staging' | 'archived' | 'training';
  r2: number; rmse: number; trainSamples: number; features: number;
  inferenceMs: number; lastRetrained: string; description: string; tags: string[];
}[]> = {
  '1': [
    { id: 'mdl-1', name: 'SPF-XGB-Ensemble', version: 'v3.0', type: 'XGBoost + Random Forest', framework: 'scikit-learn', status: 'deployed', r2: 0.940, rmse: 2.31, trainSamples: 1957, features: 18, inferenceMs: 12, lastRetrained: 'Mar 14, 2026', description: 'Ensemble model predicting SPF protection factor from 18 formulation features. Production model.', tags: ['ensemble', 'SPF', 'production'] },
    { id: 'mdl-2', name: 'SPF-XGB-Ensemble', version: 'v2.1', type: 'XGBoost + Random Forest', framework: 'scikit-learn', status: 'archived', r2: 0.912, rmse: 3.04, trainSamples: 1600, features: 15, inferenceMs: 11, lastRetrained: 'Jan 22, 2026', description: 'Previous ensemble model. Archived after v3.0 deployment.', tags: ['ensemble', 'SPF', 'archived'] },
    { id: 'mdl-3', name: 'WR-Stability-RF', version: 'v1.2', type: 'Random Forest', framework: 'scikit-learn', status: 'staging', r2: 0.881, rmse: 1.82, trainSamples: 1957, features: 18, inferenceMs: 8, lastRetrained: 'Mar 10, 2026', description: 'Jointly predicts water resistance and stability index from formulation inputs.', tags: ['stability', 'water resistance', 'staging'] },
  ],
  '2': [
    { id: 'mdl-4', name: 'CMC-GNN-v2', version: 'v2.0', type: 'Graph Neural Network', framework: 'PyTorch Geometric', status: 'deployed', r2: 0.887, rmse: 0.42, trainSamples: 1456, features: 22, inferenceMs: 45, lastRetrained: 'Feb 10, 2026', description: 'Graph neural network model for CMC prediction using molecular topology.', tags: ['GNN', 'CMC', 'graph'] },
    { id: 'mdl-5', name: 'CMC-MLP-Baseline', version: 'v1.0', type: 'Multi-Layer Perceptron', framework: 'scikit-learn', status: 'archived', r2: 0.821, rmse: 0.71, trainSamples: 1200, features: 18, inferenceMs: 3, lastRetrained: 'Oct 14, 2025', description: 'Baseline MLP. Replaced by GNN approach.', tags: ['MLP', 'CMC', 'baseline'] },
  ],
  '3': [
    { id: 'mdl-6', name: 'SensoryScore-RF', version: 'v1.1', type: 'Random Forest + SHAP', framework: 'scikit-learn', status: 'staging', r2: 0.912, rmse: 0.38, trainSamples: 356, features: 14, inferenceMs: 5, lastRetrained: 'Mar 5, 2026', description: 'Predicts composite sensory score from emollient blend parameters.', tags: ['sensory', 'random forest', 'SHAP'] },
  ],
  '4': [], '5': [],
};

const PROJECT_ANALYSIS: Record<string, {
  id: string; name: string; description: string;
  type: 'bar' | 'line' | 'scatter' | 'correlation';
  category: string; tags: string[]; created: string; author: string; pinned?: boolean;
  chartData?: unknown[];
}[]> = {
  '1': [
    { id: 'ch-1', name: 'Feature Correlation Matrix', description: 'Pearson correlation across 18 formulation features. Highlights ZnO ↔ SPF (r=0.82) and Emollient ↔ SPF (r=−0.35).', type: 'correlation', category: 'Correlation', tags: ['correlation', 'features', 'SPF'], created: 'Mar 14, 2026', author: 'Dr. Sarah Chen', pinned: true, chartData: [{ f: 'ZnO', v: 0.82 }, { f: 'TiO₂', v: 0.74 }, { f: 'Avo', v: 0.61 }, { f: 'Emol.', v: -0.35 }, { f: 'Oct.', v: 0.45 }] },
    { id: 'ch-2', name: 'Cost vs. Predicted SPF', description: 'Bar chart comparing cost per kg vs. predicted SPF across candidate formulations. Identifies the Pareto-optimal cost-performance frontier.', type: 'bar', category: 'Performance', tags: ['cost', 'performance', 'Pareto'], created: 'Mar 14, 2026', author: 'Dr. Sarah Chen', pinned: true, chartData: [{ id: 'R-047', spf: 52.3, cost: 18.4 }, { id: 'R-124', spf: 51.8, cost: 19.1 }, { id: 'R-089', spf: 50.1, cost: 17.9 }, { id: 'R-203', spf: 48.9, cost: 16.2 }, { id: 'Base', spf: 35.5, cost: 15.0 }] },
    { id: 'ch-3', name: 'Emollient Concentration vs. SPF', description: 'SPF performance over increasing emollient concentration across 5 emollient types. Shows the dilution effect on UV filter efficacy.', type: 'line', category: 'Trends', tags: ['emollient', 'SPF', 'dilution'], created: 'Mar 13, 2026', author: 'Dr. Sarah Chen', chartData: [{ x: 2, y: 51.2 }, { x: 5, y: 49.8 }, { x: 8, y: 47.1 }, { x: 12, y: 43.5 }, { x: 16, y: 38.9 }, { x: 20, y: 33.2 }] },
    { id: 'ch-4', name: 'Candidate Scatter — SPF vs. WR', description: 'Scatter plot of 100 candidate recipes showing SPF vs. water resistance. Top 3 (R-047, R-089, R-124) highlighted in blue.', type: 'scatter', category: 'Optimization', tags: ['candidates', 'SPF', 'water-resistance'], created: 'Mar 14, 2026', author: 'Noble AI Agent', pinned: true },
    { id: 'ch-6', name: 'Model v2 vs v3 Performance', description: 'Side-by-side comparison of R², RMSE, and MAE between SPF-XGB-Ensemble v2.0 and v3.0.', type: 'bar', category: 'Performance', tags: ['model', 'comparison'], created: 'Mar 12, 2026', author: 'Dr. Sarah Chen', chartData: [{ m: 'v2.1', r2: 0.912, rmse: 3.04 }, { m: 'v3.0', r2: 0.940, rmse: 2.31 }] },
  ],
  '2': [
    { id: 'ch-5', name: 'CMC Distribution by Surfactant Type', description: 'Average CMC values by ionic classification for 42 surfactant candidates.', type: 'bar', category: 'Distribution', tags: ['CMC', 'surfactant'], created: 'Mar 5, 2026', author: 'Dr. R. Patel', chartData: [{ t: 'Anionic', v: 1.2 }, { t: 'Cationic', v: 2.8 }, { t: 'Nonionic', v: 0.4 }, { t: 'Zwitterion', v: 1.8 }] },
  ],
  '3': [
    { id: 'ch-8', name: 'Sensory Score Distribution', description: 'Spreadability, silkiness, and greasiness score distributions across 445 emollient blends.', type: 'bar', category: 'Distribution', tags: ['sensory', 'emollient'], created: 'Feb 28, 2026', author: 'Dr. L. Martin', chartData: [{ s: 'Spread.', v: 7.8 }, { s: 'Silki.', v: 8.2 }, { s: 'Non-Gr.', v: 7.1 }, { s: 'Absorb.', v: 6.9 }] },
  ],
  '4': [
    { id: 'ch-7', name: 'UV Absorbance Spectrum — Avobenzone', description: 'Simulated UV absorbance spectrum for Avobenzone. Peak absorption at 357 nm in UVA range.', type: 'line', category: 'Spectroscopy', tags: ['UV', 'Avobenzone', 'spectrum'], created: 'Mar 8, 2026', author: 'Dr. T. Nakamura', chartData: [{ nm: 290, abs: 0.2 }, { nm: 310, abs: 0.6 }, { nm: 330, abs: 1.1 }, { nm: 350, abs: 1.8 }, { nm: 357, abs: 2.0 }, { nm: 370, abs: 1.5 }, { nm: 390, abs: 0.5 }, { nm: 400, abs: 0.2 }] },
  ],
  '5': [],
};

const PROJECT_REPORTS: Record<string, {
  id: string; title: string; subtitle: string; type: string; status: 'published' | 'draft' | 'review' | 'archived';
  author: string; created: string; updated: string; pages: number; tags: string[];
  summary: string; sections: { title: string; preview: string }[];
}[]> = {
  '1': [
    { id: 'rpt-1', title: 'SPF Optimization — Final Candidate Report', subtitle: 'Top 3 formulation candidates from multi-objective Bayesian optimization', type: 'experiment', status: 'published', author: 'Noble AI Agent · Dr. Sarah Chen', created: 'Mar 14, 2026', updated: 'Mar 14, 2026', pages: 12, tags: ['SPF', 'optimization', 'candidates', 'Bayesian'], summary: 'Three candidate formulations (R-047, R-089, R-124) identified via Bayesian optimization. R-047 achieves SPF 52.3 at $18.40/kg with 96.8% water resistance — the Pareto-optimal choice.', sections: [{ title: 'Executive Summary', preview: 'Bayesian optimization identified R-047 as lead candidate…' }, { title: 'Top 3 Formulations', preview: 'R-047: ZnO 15.2%, TiO₂ 8.5%, Avobenzone 3.0%…' }, { title: 'Model Confidence', preview: 'SPF-XGB-Ensemble v3.0 (R²=0.94, RMSE=2.31)…' }] },
    { id: 'rpt-2', title: 'Regulatory Compliance Assessment — EU 1223/2009', subtitle: 'UV filter concentration limits for R-047, R-089, R-124', type: 'regulatory', status: 'published', author: 'Noble AI Agent · Dr. Sarah Chen', created: 'Mar 14, 2026', updated: 'Mar 14, 2026', pages: 6, tags: ['regulatory', 'EU', 'compliance', 'UV filters'], summary: 'All three candidate formulations comply with EU Cosmetics Regulation 1223/2009. ZnO ≤25%, TiO₂ ≤25%, Avobenzone ≤5%, Octocrylene ≤10% — all within limits.', sections: [{ title: 'Regulatory Scope', preview: 'EU Cosmetics Regulation 1223/2009, Annex VI…' }, { title: 'Ingredient Assessment', preview: 'ZnO: 15.2% (limit 25%) ✓ · TiO₂: 8.5% (limit 25%) ✓…' }] },
    { id: 'rpt-3', title: 'Model Performance Report — SPF-XGB-Ensemble v3.0', subtitle: 'Training results, validation metrics, and SHAP feature importances', type: 'model', status: 'published', author: 'Noble AI Agent', created: 'Mar 14, 2026', updated: 'Mar 14, 2026', pages: 8, tags: ['model', 'XGBoost', 'SHAP', 'performance'], summary: 'XGBoost+RF ensemble trained on 2,447 formulations achieves R²=0.94, RMSE=2.31 on held-out test set. ZnO concentration is the top SHAP predictor (importance 0.68).', sections: [{ title: 'Training Summary', preview: '2,447 formulations · 80/20 split · 5-fold CV…' }, { title: 'SHAP Analysis', preview: 'Top features: ZnO (0.68), TiO₂ (0.54), Avobenzone (0.42)…' }] },
  ],
  '2': [
    { id: 'rpt-4', title: 'CMC-GNN v2.0 — Model Validation Report', subtitle: 'Graph neural network for critical micelle concentration prediction', type: 'model', status: 'published', author: 'Noble AI Agent · Dr. R. Patel', created: 'Feb 14, 2026', updated: 'Feb 14, 2026', pages: 10, tags: ['GNN', 'CMC', 'validation'], summary: 'GNN achieves R²=0.887 on held-out surfactant set. 12% improvement over MLP baseline. Ionic classification is the top structural predictor.', sections: [{ title: 'Architecture', preview: 'Message-passing GNN · 4 layers · 128 hidden dim…' }, { title: 'Benchmark vs. Baseline', preview: 'R² GNN: 0.887 vs. MLP: 0.821 (+8%)…' }] },
    { id: 'rpt-5', title: 'Surfactant CMC — Project Summary Report', subtitle: 'End-to-end project summary, model deployment, and recommendations', type: 'project', status: 'published', author: 'Dr. Sarah Chen', created: 'Feb 20, 2026', updated: 'Feb 20, 2026', pages: 18, tags: ['project', 'summary', 'CMC'], summary: 'Project successfully delivered a GNN-based CMC predictor enabling virtual screening of 3,200+ candidates/day. 90-day cycle time reduced from 6 weeks to 2 days.', sections: [{ title: 'Project Outcomes', preview: '3,200 candidates screened virtually · 6 weeks → 2 days…' }] },
  ],
  '3': [
    { id: 'rpt-6', title: 'Emollient Study — Interim Analysis', subtitle: 'Sensory panel results and model training progress', type: 'analysis', status: 'review', author: 'Dr. Emma Richardson', created: 'Mar 5, 2026', updated: 'Mar 10, 2026', pages: 7, tags: ['sensory', 'interim', 'emollient'], summary: 'Interim report covering 445 formulation evaluations. Model R²=0.912. Lead emollient ratio: Cyclopentasiloxane 18% + Isopropyl Myristate 6% achieves sensory score 8.7/10.', sections: [{ title: 'Panel Results', preview: 'Mean spreadability: 7.8/10 · Silkiness: 8.2/10…' }] },
  ],
  '4': [], '5': [],
};

/* ── Chart mini-preview ──────────────────────────────────────── */

function MiniChart({ type, data, color }: { type: string; data: unknown[] | undefined; color: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-16 flex items-center justify-center">
        <span className="text-[10px] text-gray-300 italic">No preview</span>
      </div>
    );
  }

  const c = color;
  if (type === 'bar' || type === 'correlation') {
    const vals = data as { [k: string]: string | number }[];
    const vk = Object.keys(vals[0]).find(k => typeof vals[0][k] === 'number') ?? 'v';
    const lk = Object.keys(vals[0]).find(k => typeof vals[0][k] === 'string') ?? 'l';
    return (
      <ResponsiveContainer width="100%" height={56}>
        <BarChart data={vals} margin={{ top: 2, right: 4, bottom: 2, left: -24 }}>
          <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ fontSize: 10, padding: '2px 6px' }} />
          <Bar dataKey={vk} radius={[2, 2, 0, 0]}>
            {vals.map((entry, i) => (
              <Cell
                key={i}
                fill={typeof entry[vk] === 'number' && (entry[vk] as number) < 0 ? '#ef4444' : c}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === 'line') {
    const vals = data as { [k: string]: number }[];
    const xk = Object.keys(vals[0])[0];
    const yk = Object.keys(vals[0])[1];
    return (
      <ResponsiveContainer width="100%" height={56}>
        <LineChart data={vals} margin={{ top: 2, right: 4, bottom: 2, left: -24 }}>
          <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ fontSize: 10, padding: '2px 6px' }} />
          <Line type="monotone" dataKey={yk} stroke={c} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <div className="h-14 flex items-center justify-center bg-gray-50 rounded">
      <span className="text-[10px] text-gray-300">Scatter</span>
    </div>
  );
}

/* ── Dataset card ────────────────────────────────────────────── */

function DatasetCard({ ds, color }: { ds: typeof PROJECT_DATASETS['1'][0]; color: string }) {
  const STATUS = {
    ready:      { label: 'Ready',      color: '#059669', bg: '#f0fdf4', icon: CheckCircle2 },
    processing: { label: 'Processing', color: '#3F98FF', bg: '#eff6ff', icon: Activity },
    warning:    { label: 'Warning',    color: '#d97706', bg: '#fffbeb', icon: AlertCircle },
  };
  const s = STATUS[ds.status];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-gray-300">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
            <Database className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-tight">{ds.name}</div>
            <div className="text-[10px] text-gray-400">{ds.format} · Updated {ds.lastUpdated}</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: s.bg, color: s.color }}>
          <s.icon className="w-2.5 h-2.5" /> {s.label}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{ds.description}</p>
      <div className="flex items-center gap-4 mb-3">
        {[
          { label: 'Rows', value: ds.rows.toLocaleString() },
          { label: 'Cols', value: ds.columns },
          { label: 'Size', value: `${ds.sizeMB} MB` },
        ].map(s => (
          <div key={s.label}>
            <div className="text-xs font-bold text-gray-900">{s.value}</div>
            <div className="text-[9px] text-gray-400">{s.label}</div>
          </div>
        ))}
        <div className="ml-auto">
          <div className="text-xs font-bold" style={{ color: ds.quality >= 97 ? '#059669' : '#d97706' }}>{ds.quality}%</div>
          <div className="text-[9px] text-gray-400">Quality</div>
        </div>
      </div>
      {/* Quality bar */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full" style={{ width: `${ds.quality}%`, backgroundColor: ds.quality >= 97 ? '#059669' : '#d97706' }} />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {ds.tags.map(t => (
          <span key={t} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{t}</span>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button className="flex items-center gap-1 text-[11px] text-[#3F98FF] hover:underline font-medium">
          <Eye className="w-3 h-3" /> Preview
        </button>
        <button className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700">
          <Download className="w-3 h-3" /> Export
        </button>
      </div>
    </div>
  );
}

/* ── Model card ──────────────────────────────────────────────── */

function ModelCard({ mdl, color }: { mdl: typeof PROJECT_MODELS['1'][0]; color: string }) {
  const STATUS_M = {
    deployed: { label: 'Deployed', color: '#059669', bg: '#f0fdf4' },
    staging:  { label: 'Staging',  color: '#3F98FF', bg: '#eff6ff' },
    archived: { label: 'Archived', color: '#9ca3af', bg: '#f9fafb' },
    training: { label: 'Training', color: '#7c3aed', bg: '#f5f3ff' },
  };
  const s = STATUS_M[mdl.status];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-gray-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
            <BrainCircuit className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900">{mdl.name}</span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{mdl.version}</span>
            </div>
            <div className="text-[10px] text-gray-400">{mdl.type} · {mdl.framework}</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{mdl.description}</p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'R²', value: mdl.r2.toFixed(3), color: mdl.r2 > 0.9 ? '#059669' : '#d97706' },
          { label: 'RMSE', value: mdl.rmse.toFixed(2), color: '#3F98FF' },
          { label: 'Features', value: mdl.features, color: '#7c3aed' },
        ].map(m => (
          <div key={m.label} className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
            <div className="text-sm font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[9px] text-gray-400">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-3">
        <Clock className="w-3 h-3" /> Retrained {mdl.lastRetrained}
        <span className="ml-auto flex items-center gap-1"><Cpu className="w-3 h-3" /> {mdl.inferenceMs}ms</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {mdl.tags.map(t => (
          <span key={t} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{t}</span>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button className="flex items-center gap-1 text-[11px] text-[#3F98FF] hover:underline font-medium">
          <BarChart2 className="w-3 h-3" /> Performance
        </button>
        <button className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700">
          <GitBranch className="w-3 h-3" /> Lineage
        </button>
        {mdl.status === 'deployed' && (
          <button className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 ml-auto">
            <Zap className="w-3 h-3" /> API
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Analysis card ───────────────────────────────────────────── */

const CHART_ICON: Record<string, React.ReactNode> = {
  bar:         <BarChart3 className="w-3.5 h-3.5" />,
  line:        <TrendingUp className="w-3.5 h-3.5" />,
  scatter:     <Activity className="w-3.5 h-3.5" />,
  correlation: <BarChart2 className="w-3.5 h-3.5" />,
};

function AnalysisCard({ ch, color }: { ch: typeof PROJECT_ANALYSIS['1'][0]; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all hover:border-gray-300">
      {/* Mini chart preview */}
      <div className="px-4 pt-3 pb-1 bg-gray-50 border-b border-gray-100">
        <MiniChart type={ch.type} data={ch.chartData} color={color} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-1.5">
            {ch.pinned && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
            <span className="text-sm font-bold text-gray-900 leading-tight">{ch.name}</span>
          </div>
          <span className="text-[9px] flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full shrink-0 ml-2" style={{ color }}>
            {CHART_ICON[ch.type]}
            <span className="capitalize">{ch.type}</span>
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-2">{ch.description}</p>
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {ch.tags.map(t => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{t}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
          <span className="text-[10px] text-gray-400">{ch.author} · {ch.created}</span>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 text-[11px] text-[#3F98FF] hover:underline font-medium"><Eye className="w-3 h-3" /> Open</button>
            <button className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600"><Download className="w-3 h-3" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Report card ─────────────────────────────────────────────── */

function ReportCard({ rpt }: { rpt: typeof PROJECT_REPORTS['1'][0] }) {
  const STATUS_R = {
    published: { label: 'Published', color: '#059669', bg: '#f0fdf4', icon: CheckCircle2 },
    draft:     { label: 'Draft',     color: '#9ca3af', bg: '#f9fafb', icon: Circle },
    review:    { label: 'In Review', color: '#d97706', bg: '#fffbeb', icon: AlertCircle },
    archived:  { label: 'Archived',  color: '#6b7280', bg: '#f3f4f6', icon: Circle },
  };
  const TYPE_ICON: Record<string, React.ReactNode> = {
    experiment:  <FlaskConical className="w-3.5 h-3.5 text-[#3F98FF]" />,
    regulatory:  <Shield className="w-3.5 h-3.5 text-[#059669]" />,
    model:       <BrainCircuit className="w-3.5 h-3.5 text-[#7c3aed]" />,
    analysis:    <BarChart3 className="w-3.5 h-3.5 text-[#ea580c]" />,
    project:     <FileBarChart className="w-3.5 h-3.5 text-[#0891b2]" />,
  };
  const s = STATUS_R[rpt.status];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-gray-300">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
            {TYPE_ICON[rpt.type]}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-tight">{rpt.title}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{rpt.subtitle}</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ml-2" style={{ backgroundColor: s.bg, color: s.color }}>
          <s.icon className="w-2.5 h-2.5" /> {s.label}
        </span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">{rpt.summary}</p>
      {/* Sections */}
      <div className="space-y-1 mb-3">
        {rpt.sections.slice(0, 2).map(sec => (
          <div key={sec.title} className="flex items-start gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] font-semibold text-gray-700 shrink-0">{sec.title}</span>
            <span className="text-[10px] text-gray-400 truncate">{sec.preview}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {rpt.tags.map(t => (
          <span key={t} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{t}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
        <span className="text-[10px] text-gray-400">{rpt.author} · {rpt.pages}p · {rpt.updated}</span>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 text-[11px] text-[#3F98FF] hover:underline font-medium"><Eye className="w-3 h-3" /> View</button>
          <button className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600"><Download className="w-3 h-3" /> PDF</button>
        </div>
      </div>
    </div>
  );
}

/* ── Overview tab ────────────────────────────────────────────── */

function OverviewTab({ project }: { project: typeof PROJECTS['1'] }) {
  const datasets = PROJECT_DATASETS[project.id] ?? [];
  const models   = PROJECT_MODELS[project.id] ?? [];
  const analysis = PROJECT_ANALYSIS[project.id] ?? [];
  const reports  = PROJECT_REPORTS[project.id] ?? [];

  const kpis = [
    { label: 'Datasets',    value: datasets.length, icon: Database,     color: '#3F98FF' },
    { label: 'Models',      value: models.length,   icon: BrainCircuit, color: '#7c3aed' },
    { label: 'Analyses',    value: analysis.length,  icon: BarChart3,    color: '#059669' },
    { label: 'Reports',     value: reports.length,  icon: FileText,     color: '#ea580c' },
    ...(project.bestR2 ? [{ label: 'Best R²', value: project.bestR2, icon: TrendingUp, color: '#059669' }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-5 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: k.color + '15' }}>
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
            </div>
            <div className="text-xl font-bold text-gray-900">{k.value}</div>
            <div className="text-[10px] text-gray-400">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Objective & Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Project Objective</div>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">{project.objective}</p>
          <div className="space-y-2">
            {[
              { label: 'Target Metric', value: project.targetMetric ?? '—' },
              { label: 'Owner',         value: project.owner },
              { label: 'Created',       value: project.created },
              { label: 'Domain',        value: project.domain },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-[11px] text-gray-400">{r.label}</span>
                <span className="text-[11px] font-semibold text-gray-800">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage timeline */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Workflow Progress</div>
          <div className="space-y-2">
            {STAGE_LABELS.map((label, i) => {
              const done = i < project.currentStage;
              const current = i === project.currentStage;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                    style={{
                      backgroundColor: done ? project.domainColor : current ? project.domainColor + '20' : '#f3f4f6',
                      color: done ? '#fff' : current ? project.domainColor : '#9ca3af',
                      border: current ? `2px solid ${project.domainColor}` : 'none',
                    }}
                  >
                    {done ? '✓' : i}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`text-xs font-medium ${done ? 'text-gray-700' : current ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                      {label}
                    </span>
                    {current && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: project.domainColor + '15', color: project.domainColor }}>
                        In Progress
                      </span>
                    )}
                    {done && <span className="text-[9px] text-gray-400">Complete</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team */}
      {project.team.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Team</div>
          <div className="flex items-center gap-4">
            {project.team.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: m.color }}>
                  {m.initials}
                </div>
                <span className="text-xs text-gray-600">{m.initials}</span>
              </div>
            ))}
            <button className="ml-auto flex items-center gap-1 text-xs text-[#3F98FF] hover:underline">
              <Plus className="w-3 h-3" /> Invite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────── */

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-gray-300" />
      </div>
      <div className="text-sm font-medium text-gray-400">No {label} yet</div>
      <div className="text-xs text-gray-300 mt-1">They'll appear here once created in this project.</div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

type Tab = 'overview' | 'datasets' | 'models' | 'analysis' | 'reports';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = PROJECTS[id ?? ''];
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-sm font-medium text-gray-600">Project not found</div>
          <button onClick={() => navigate('/projects')} className="mt-3 text-xs text-[#3F98FF] hover:underline">Back to Projects</button>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[project.status];
  const datasets = PROJECT_DATASETS[id ?? ''] ?? [];
  const models   = PROJECT_MODELS[id ?? ''] ?? [];
  const analysis = PROJECT_ANALYSIS[id ?? ''] ?? [];
  const reports  = PROJECT_REPORTS[id ?? ''] ?? [];

  const TABS: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'overview',  label: 'Overview',  icon: TrendingUp,   count: 0 },
    { id: 'datasets',  label: 'Datasets',  icon: Database,     count: datasets.length },
    { id: 'models',    label: 'Models',    icon: BrainCircuit, count: models.length },
    { id: 'analysis',  label: 'Analysis',  icon: BarChart3,    count: analysis.length },
    { id: 'reports',   label: 'Reports',   icon: FileText,     count: reports.length },
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 h-full flex flex-col">

      {/* ── Project header ─────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        {/* Breadcrumb + actions */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <button onClick={() => navigate('/projects')} className="hover:text-[#3F98FF] transition-colors">Projects</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium truncate max-w-[260px]">{project.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              <Download className="w-3 h-3" /> Export
            </button>
            <button
              onClick={() => navigate(`/workspace/${project.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#3F98FF] text-white rounded-lg font-medium hover:bg-[#2563eb] transition-colors shadow-sm"
            >
              <ExternalLink className="w-3 h-3" /> Open Workspace
            </button>
          </div>
        </div>

        {/* Project identity */}
        <div className="px-6 py-4">
          {/* Color accent */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: project.domainColor + '15' }}>
              <FlaskConical className="w-5 h-5" style={{ color: project.domainColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: project.domainColor + '15', color: project.domainColor }}>
                  {project.domain}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border" style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.color + '40' }}>
                  {cfg.label}
                </span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight mb-1">{project.name}</h1>
              <p className="text-xs text-gray-500 leading-relaxed">{project.description}</p>
            </div>

            {/* Stage progress */}
            <div className="shrink-0 text-right">
              <div className="text-[10px] text-gray-400 mb-1 font-medium">
                Stage {project.currentStage}/{project.totalStages} · {STAGE_LABELS[project.currentStage] ?? 'Complete'}
              </div>
              <div className="flex gap-0.5 justify-end">
                {Array.from({ length: project.totalStages }).map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: i < project.currentStage ? project.domainColor : i === project.currentStage ? project.domainColor + '40' : '#e5e7eb',
                    }}
                  />
                ))}
              </div>
              {project.team.length > 0 && (
                <div className="flex justify-end mt-2 -space-x-1">
                  {project.team.map((m, i) => (
                    <div key={i} className="w-5 h-5 rounded-full ring-2 ring-white flex items-center justify-center text-[7px] font-bold text-white" style={{ backgroundColor: m.color }}>{m.initials}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-6 gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#3F98FF] text-[#3F98FF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-[#3F98FF]/10 text-[#3F98FF]' : 'bg-gray-100 text-gray-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────── */}
      <div className="flex-1 p-6">

        {activeTab === 'overview' && <OverviewTab project={project} />}

        {activeTab === 'datasets' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-gray-800">{datasets.length} Dataset{datasets.length !== 1 ? 's' : ''}</div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#3F98FF] text-white rounded-lg font-medium hover:bg-[#2563eb] transition-colors">
                <Plus className="w-3 h-3" /> Add Dataset
              </button>
            </div>
            {datasets.length === 0
              ? <EmptyState icon={Database} label="datasets" />
              : <div className="grid grid-cols-2 gap-4">{datasets.map(ds => <DatasetCard key={ds.id} ds={ds} color={project.domainColor} />)}</div>
            }
          </div>
        )}

        {activeTab === 'models' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-gray-800">{models.length} Model{models.length !== 1 ? 's' : ''}</div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#3F98FF] text-white rounded-lg font-medium hover:bg-[#2563eb] transition-colors">
                <Plus className="w-3 h-3" /> Train New Model
              </button>
            </div>
            {models.length === 0
              ? <EmptyState icon={BrainCircuit} label="models" />
              : <div className="grid grid-cols-2 gap-4">{models.map(m => <ModelCard key={m.id} mdl={m} color={project.domainColor} />)}</div>
            }
          </div>
        )}

        {activeTab === 'analysis' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-gray-800">{analysis.length} Chart{analysis.length !== 1 ? 's' : ''}</div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#3F98FF] text-white rounded-lg font-medium hover:bg-[#2563eb] transition-colors">
                <Plus className="w-3 h-3" /> New Analysis
              </button>
            </div>
            {analysis.length === 0
              ? <EmptyState icon={BarChart3} label="analyses" />
              : <div className="grid grid-cols-2 gap-4">{analysis.map(ch => <AnalysisCard key={ch.id} ch={ch} color={project.domainColor} />)}</div>
            }
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-gray-800">{reports.length} Report{reports.length !== 1 ? 's' : ''}</div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#3F98FF] text-white rounded-lg font-medium hover:bg-[#2563eb] transition-colors">
                <Plus className="w-3 h-3" /> Generate Report
              </button>
            </div>
            {reports.length === 0
              ? <EmptyState icon={FileText} label="reports" />
              : <div className="grid grid-cols-1 gap-4">{reports.map(r => <ReportCard key={r.id} rpt={r} />)}</div>
            }
          </div>
        )}

      </div>
    </div>
  );
}