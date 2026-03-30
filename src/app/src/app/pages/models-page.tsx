import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import {
  Search, Plus, ChevronRight, ChevronDown, LayoutGrid, List,
  CheckCircle2, Clock, AlertCircle, Zap, Download, Archive,
  MoreHorizontal, BrainCircuit, Activity, GitBranch, ExternalLink,
  Cpu, BarChart2, Terminal, Shield, RefreshCw, ArrowUpRight
} from 'lucide-react';

interface ModelVersion {
  version: string;
  date: string;
  r2: number;
  notes: string;
}

interface Model {
  id: string;
  name: string;
  version: string;
  type: string;
  framework: string;
  project: string;
  projectColor: string;
  status: 'deployed' | 'staging' | 'archived' | 'training';
  r2: number;
  rmse: number;
  trainSamples: number;
  testSamples: number;
  features: number;
  inferenceMs: number;
  fileSize: string;
  lastRetrained: string;
  deployedAt?: string;
  endpoint?: string;
  description: string;
  experiment: string;
  versions: ModelVersion[];
  tags: string[];
  regulatory?: string;
}

const MODELS: Model[] = [
  {
    id: 'mdl-1',
    name: 'SPF-XGB-Ensemble',
    version: 'v3.0',
    type: 'XGBoost + Random Forest',
    framework: 'scikit-learn',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    status: 'deployed',
    r2: 0.940,
    rmse: 2.31,
    trainSamples: 1957,
    testSamples: 490,
    features: 18,
    inferenceMs: 12,
    fileSize: '48 MB',
    lastRetrained: 'Mar 14, 2026',
    deployedAt: 'Mar 14, 2026',
    endpoint: 'https://api.nobleai.io/v1/models/spf-xgb-ensemble-v3',
    description: 'Production ensemble model combining XGBoost (60%) and Random Forest (40%) for SPF prediction. Trained on 1,957 validated formulations. Used in Bayesian optimization engine for multi-objective candidate search.',
    experiment: 'XGB-Ensemble-v3',
    tags: ['production', 'SPF', 'ensemble', 'ISO-validated'],
    regulatory: 'EU Cosmetics Reg. 1223/2009 · ISO 24444:2021 compliant predictions',
    versions: [
      { version: 'v3.0', date: 'Mar 14, 2026', r2: 0.940, notes: 'Production. Added RF ensemble component.' },
      { version: 'v2.1', date: 'Mar 12, 2026', r2: 0.921, notes: 'Grid search hyperparameter optimization.' },
      { version: 'v1.0', date: 'Feb 18, 2026', r2: 0.903, notes: 'Initial RF baseline.' },
    ],
  },
  {
    id: 'mdl-2',
    name: 'SPF-XGB-Ensemble',
    version: 'v2.1',
    type: 'XGBoost',
    framework: 'scikit-learn',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    status: 'staging',
    r2: 0.921,
    rmse: 2.89,
    trainSamples: 1957,
    testSamples: 490,
    features: 18,
    inferenceMs: 10,
    fileSize: '31 MB',
    lastRetrained: 'Mar 12, 2026',
    description: 'Previous production model — XGBoost only, no ensemble. Maintained in staging for A/B comparison against v3.0.',
    experiment: 'XGB-v2-grid-search',
    tags: ['staging', 'SPF'],
    versions: [
      { version: 'v2.1', date: 'Mar 12, 2026', r2: 0.921, notes: 'Grid search hyperparameter optimization.' },
      { version: 'v2.0', date: 'Mar 10, 2026', r2: 0.910, notes: 'Default XGBoost params.' },
    ],
  },
  {
    id: 'mdl-3',
    name: 'CMC-GP-Predictor',
    version: 'v1.2',
    type: 'Gaussian Process',
    framework: 'scikit-learn (GPy)',
    project: 'Surfactant CMC Prediction',
    projectColor: '#7c3aed',
    status: 'deployed',
    r2: 0.887,
    rmse: 0.24,
    trainSamples: 1456,
    testSamples: 364,
    features: 12,
    inferenceMs: 48,
    fileSize: '12 MB',
    lastRetrained: 'Feb 28, 2026',
    deployedAt: 'Mar 2, 2026',
    endpoint: 'https://api.nobleai.io/v1/models/cmc-gp-predictor-v1',
    description: 'Gaussian Process regression model for CMC prediction with calibrated uncertainty. RBF + White kernel, optimized with 10 random restarts. Provides mean prediction ± 95% CI for experimental design guidance.',
    experiment: 'GP-surrogate-CMC',
    tags: ['production', 'CMC', 'uncertainty-aware', 'GP'],
    versions: [
      { version: 'v1.2', date: 'Feb 28, 2026', r2: 0.887, notes: 'RBF+WhiteKernel, 10 restarts. Production.' },
      { version: 'v1.1', date: 'Feb 20, 2026', r2: 0.871, notes: 'Matern kernel. Worse on interpolation.' },
      { version: 'v1.0', date: 'Feb 12, 2026', r2: 0.842, notes: 'Baseline GP, default kernel.' },
    ],
  },
  {
    id: 'mdl-4',
    name: 'Texture-LGBM',
    version: 'v1.0',
    type: 'LightGBM',
    framework: 'LightGBM',
    project: 'Emollient Texture Analysis',
    projectColor: '#059669',
    status: 'staging',
    r2: 0.912,
    rmse: 0.42,
    trainSamples: 356,
    testSamples: 89,
    features: 22,
    inferenceMs: 8,
    fileSize: '22 MB',
    lastRetrained: 'Feb 22, 2026',
    description: 'Multi-output LightGBM model predicting three sensory scores (spreadability, silkiness, greasiness) from emollient blend composition and rheological properties. Pending HPO v2 comparison before production promotion.',
    experiment: 'LGBM-texture-v1',
    tags: ['staging', 'sensory', 'multi-output'],
    versions: [
      { version: 'v1.0', date: 'Feb 22, 2026', r2: 0.912, notes: 'Initial. Awaiting Optuna HPO v2.' },
    ],
  },
  {
    id: 'mdl-5',
    name: 'UV-DegradationXGB',
    version: 'v0.5-beta',
    type: 'XGBoost',
    framework: 'scikit-learn',
    project: 'UV Filter Photo-Stability',
    projectColor: '#ea580c',
    status: 'training',
    r2: 0,
    rmse: 0,
    trainSamples: 714,
    testSamples: 178,
    features: 16,
    inferenceMs: 0,
    fileSize: '—',
    lastRetrained: 'Mar 15, 2026',
    description: 'XGBoost model for predicting UV filter photodegradation rate (% loss per hour) under xenon arc exposure. Currently training with 5-fold CV. ETA: 22 minutes.',
    experiment: 'XGB-photostab-v1',
    tags: ['training', 'photostability', 'in-progress'],
    versions: [],
  },
  {
    id: 'mdl-6',
    name: 'SPF-Ridge-Baseline',
    version: 'v1.0',
    type: 'Ridge Regression',
    framework: 'scikit-learn',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    status: 'archived',
    r2: 0.724,
    rmse: 5.18,
    trainSamples: 1957,
    testSamples: 490,
    features: 18,
    inferenceMs: 1,
    fileSize: '0.2 MB',
    lastRetrained: 'Feb 18, 2026',
    description: 'Linear baseline model. Archived after XGBoost models demonstrated significantly superior performance. Maintained for interpretability reference and regulatory documentation.',
    experiment: 'LinReg-SPF-baseline',
    tags: ['archived', 'baseline', 'linear', 'interpretable'],
    versions: [
      { version: 'v1.0', date: 'Feb 18, 2026', r2: 0.724, notes: 'Ridge regression baseline. Archived.' },
    ],
  },
];

const STATUS_CONFIG = {
  deployed: { label: 'Deployed', color: '#059669', bg: '#f0fdf4', icon: CheckCircle2, dot: 'bg-green-500' },
  staging: { label: 'Staging', color: '#3F98FF', bg: '#eff6ff', icon: Activity, dot: 'bg-blue-400' },
  archived: { label: 'Archived', color: '#9ca3af', bg: '#f9fafb', icon: Archive, dot: 'bg-gray-400' },
  training: { label: 'Training', color: '#d97706', bg: '#fffbeb', icon: RefreshCw, dot: 'bg-amber-400 animate-pulse' },
};

const FRAMEWORK_COLORS: Record<string, string> = {
  'scikit-learn': '#f97316',
  'LightGBM': '#22c55e',
  'scikit-learn (GPy)': '#8b5cf6',
};

export function ModelsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const location = useLocation();

  // Auto-select a model when navigated here via "Go to asset"
  useEffect(() => {
    const state = location.state as { selectedId?: string } | null;
    if (state?.selectedId) {
      setSelectedId(state.selectedId);
      // Scroll the selected model card into view after a tick
      setTimeout(() => {
        const el = document.getElementById(`model-card-${state.selectedId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [location.state]);

  const filtered = MODELS.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase()) ||
      m.project.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const selectedModel = MODELS.find((m) => m.id === selectedId);

  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span>Noble AI VIP</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-600 font-medium">Models</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Model Registry</h1>
            <p className="text-sm text-gray-500 mt-0.5">Versioned model store — deploy, monitor, and manage production models</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#3F98FF] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Register Model
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6">
          {[
            { label: 'Total Models', value: MODELS.length, color: '#3F98FF' },
            { label: 'Deployed', value: MODELS.filter((m) => m.status === 'deployed').length, color: '#059669' },
            { label: 'Staging', value: MODELS.filter((m) => m.status === 'staging').length, color: '#3F98FF' },
            { label: 'Archived', value: MODELS.filter((m) => m.status === 'archived').length, color: '#9ca3af' },
            { label: 'Training', value: MODELS.filter((m) => m.status === 'training').length, color: '#d97706' },
            { label: 'Avg. R² (deployed)', value: (MODELS.filter((m) => m.status === 'deployed').reduce((a, m) => a + m.r2, 0) / MODELS.filter((m) => m.status === 'deployed').length).toFixed(3), color: '#059669' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col">
              <div className="text-sm font-bold leading-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: model list */}
        <div className={`${selectedId ? 'w-[55%]' : 'flex-1'} overflow-auto p-6 transition-all duration-300`}>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF] bg-white w-52"
              />
            </div>
            <div className="flex items-center gap-1">
              {['all', 'deployed', 'staging', 'training', 'archived'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => setViewMode('grid')} className={`w-7 h-7 flex items-center justify-center rounded border transition-colors ${viewMode === 'grid' ? 'border-[#3F98FF] bg-[#3F98FF]/10 text-[#3F98FF]' : 'border-gray-200 text-gray-400'}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`w-7 h-7 flex items-center justify-center rounded border transition-colors ${viewMode === 'list' ? 'border-[#3F98FF] bg-[#3F98FF]/10 text-[#3F98FF]' : 'border-gray-200 text-gray-400'}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Grid view */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map((model) => {
                const cfg = STATUS_CONFIG[model.status];
                const isSelected = selectedId === model.id;
                return (
                  <div
                    key={model.id}
                    id={`model-card-${model.id}`}
                    onClick={() => setSelectedId(isSelected ? null : model.id)}
                    className={`bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-[#3F98FF] shadow-md shadow-[#3F98FF]/10' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3F98FF]/10 to-[#7c3aed]/10 flex items-center justify-center shrink-0">
                            <BrainCircuit className="w-4.5 h-4.5 text-[#3F98FF]" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 leading-tight">{model.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{model.version}</div>
                          </div>
                        </div>
                        <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Status + Type */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ backgroundColor: model.projectColor + '15', color: model.projectColor }}>
                          {model.type}
                        </span>
                        <span className="text-[10px] text-gray-400 px-2 py-1 rounded-full bg-gray-50" style={{ color: FRAMEWORK_COLORS[model.framework] || '#9ca3af' }}>
                          {model.framework}
                        </span>
                      </div>

                      {/* Project */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: model.projectColor }} />
                        <span className="text-[11px] text-gray-500 truncate">{model.project}</span>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {model.status !== 'training' ? (
                          <>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <div className="text-sm font-bold" style={{ color: model.r2 >= 0.90 ? '#059669' : model.r2 >= 0.80 ? '#3F98FF' : '#9ca3af' }}>{model.r2.toFixed(3)}</div>
                              <div className="text-[9px] text-gray-400">R²</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <div className="text-sm font-bold text-gray-700">{model.rmse.toFixed(2)}</div>
                              <div className="text-[9px] text-gray-400">RMSE</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <div className="text-sm font-bold text-gray-700">{model.inferenceMs || '—'}<span className="text-[9px] font-normal text-gray-400">ms</span></div>
                              <div className="text-[9px] text-gray-400">Inference</div>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-3 bg-amber-50 rounded-lg p-2 text-center flex items-center justify-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                            <span className="text-xs font-medium text-amber-700">Training in progress…</span>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {model.lastRetrained}
                        </div>
                        <div className="flex items-center gap-1">
                          {model.status === 'deployed' && (
                            <span className="flex items-center gap-0.5 text-[9px] text-green-600 font-medium">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Live API
                            </span>
                          )}
                          <ChevronRight className="w-3 h-3 text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="grid grid-cols-[1.8fr_1.2fr_0.8fr_0.8fr_0.6fr_0.6fr_0.8fr_0.8fr] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <div>Model</div>
                <div>Project</div>
                <div>Status</div>
                <div>Type</div>
                <div>R²</div>
                <div>RMSE</div>
                <div>Inference</div>
                <div>Updated</div>
              </div>
              {filtered.map((model) => {
                const cfg = STATUS_CONFIG[model.status];
                return (
                  <div
                    key={model.id}
                    className={`grid grid-cols-[1.8fr_1.2fr_0.8fr_0.8fr_0.6fr_0.6fr_0.8fr_0.8fr] gap-3 px-5 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors items-center ${selectedId === model.id ? 'bg-blue-50/40' : ''}`}
                    onClick={() => setSelectedId(selectedId === model.id ? null : model.id)}
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{model.name} <span className="font-mono text-[10px] text-gray-400">{model.version}</span></div>
                      <div className="text-[10px] text-gray-400">{model.framework}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: model.projectColor }} />
                      <span className="text-xs text-gray-600 truncate">{model.project.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                    <div>
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full w-fit" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">{model.type.split(' ')[0]}</div>
                    <div className="text-sm font-bold" style={{ color: model.r2 >= 0.90 ? '#059669' : model.r2 >= 0.80 ? '#3F98FF' : '#9ca3af' }}>
                      {model.status === 'training' ? '—' : model.r2.toFixed(3)}
                    </div>
                    <div className="text-sm text-gray-600">{model.status === 'training' ? '—' : model.rmse.toFixed(2)}</div>
                    <div className="text-xs text-gray-600">{model.inferenceMs ? `${model.inferenceMs} ms` : '—'}</div>
                    <div className="text-xs text-gray-400">{model.lastRetrained}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Model detail panel */}
        {selectedModel && (
          <div className="w-[45%] border-l border-gray-200 bg-white overflow-auto flex flex-col shrink-0">
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
                      style={{ backgroundColor: STATUS_CONFIG[selectedModel.status].bg, color: STATUS_CONFIG[selectedModel.status].color }}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedModel.status].dot}`} />
                      {STATUS_CONFIG[selectedModel.status].label}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">{selectedModel.name}</h2>
                  <div className="text-xs text-gray-500 font-mono">{selectedModel.version} · {selectedModel.type}</div>
                </div>
                <button onClick={() => setSelectedId(null)} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 transition-colors text-lg leading-none">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              {/* Description */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{selectedModel.description}</p>
              </div>

              {/* Performance metrics */}
              {selectedModel.status !== 'training' && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Performance Metrics</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'R² Score', value: selectedModel.r2.toFixed(3), color: selectedModel.r2 >= 0.90 ? '#059669' : '#3F98FF' },
                      { label: 'RMSE', value: selectedModel.rmse.toFixed(3), color: '#7c3aed' },
                      { label: 'Train Samples', value: selectedModel.trainSamples.toLocaleString(), color: '#3F98FF' },
                      { label: 'Test Samples', value: selectedModel.testSamples.toLocaleString(), color: '#3F98FF' },
                      { label: 'Features', value: selectedModel.features, color: '#059669' },
                      { label: 'Inference', value: selectedModel.inferenceMs ? `${selectedModel.inferenceMs} ms` : '—', color: '#ea580c' },
                    ].map((m) => (
                      <div key={m.label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <div className="text-sm font-bold" style={{ color: m.color }}>{m.value}</div>
                        <div className="text-[9px] text-gray-400 mt-0.5">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Endpoint (if deployed) */}
              {selectedModel.endpoint && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">API Endpoint</h4>
                  <div className="bg-gray-900 rounded-lg p-3 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <code className="text-[10px] text-green-300 break-all">{selectedModel.endpoint}</code>
                    <ExternalLink className="w-3 h-3 text-gray-400 shrink-0 ml-auto cursor-pointer hover:text-gray-200" />
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">
                    Deployed: {selectedModel.deployedAt} · REST API · JSON I/O · Auth: Bearer token
                  </div>
                </div>
              )}

              {/* Regulatory */}
              {selectedModel.regulatory && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-green-800 leading-relaxed">{selectedModel.regulatory}</div>
                </div>
              )}

              {/* Tags */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedModel.tags.map((t) => (
                    <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">{t}</span>
                  ))}
                </div>
              </div>

              {/* Version history */}
              {selectedModel.versions.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3" />
                    Version History
                  </h4>
                  <div className="space-y-2">
                    {selectedModel.versions.map((v, i) => (
                      <div key={v.version} className={`flex items-center gap-3 p-2.5 rounded-lg border ${i === 0 ? 'border-[#3F98FF]/30 bg-blue-50/40' : 'border-gray-100 bg-gray-50'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${i === 0 ? 'bg-[#3F98FF] text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {i === 0 ? '★' : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800 font-mono">{v.version}</span>
                            <span className="text-[10px] text-gray-400">{v.date}</span>
                            <span className="text-xs font-bold ml-auto" style={{ color: v.r2 >= 0.90 ? '#059669' : '#3F98FF' }}>R² {v.r2.toFixed(3)}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{v.notes}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-2">
              {selectedModel.status === 'staging' && (
                <button className="flex items-center gap-1.5 px-3 py-2 bg-[#059669] text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
                  <Zap className="w-3 h-3" />
                  Deploy to Production
                </button>
              )}
              {selectedModel.status === 'deployed' && (
                <button className="flex items-center gap-1.5 px-3 py-2 bg-[#3F98FF] text-white text-xs font-semibold rounded-lg hover:bg-[#2563eb] transition-colors">
                  <Activity className="w-3 h-3" />
                  Monitor Live
                </button>
              )}
              <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <Download className="w-3 h-3" />
                Download
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <RefreshCw className="w-3 h-3" />
                Re-train
              </button>
              {selectedModel.status !== 'archived' && (
                <button className="flex items-center gap-1.5 px-3 py-2 border border-red-100 text-xs text-red-500 rounded-lg hover:bg-red-50 transition-colors ml-auto">
                  <Archive className="w-3 h-3" />
                  Archive
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}