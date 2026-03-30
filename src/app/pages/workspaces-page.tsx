import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Search, LayoutDashboard, FlaskConical, Clock,
  ChevronRight, ExternalLink, MoreHorizontal, Layers,
  Cpu, MessageSquare, BarChart3, Sparkles, Archive,
  CheckCircle2, Circle, Zap, Users, PanelRight,
  X, Columns2, Columns3, Square, Brain, FolderOpen,
} from 'lucide-react';
import { PROJECTS, MODELS } from '../components/workspace-config-panel';

/* ── Types ──────────────────────────────────────────────────── */

type WsStatus = 'active' | 'saved' | 'archived';

interface Workspace {
  id: string;
  name: string;
  description: string;
  project: string | null;
  projectColor: string | null;
  status: WsStatus;
  panelCount: number;
  chatMessages: number;
  lastOpenedBy: string;
  lastOpened: string;
  created: string;
  columns: 1 | 2 | 3;
  tags: string[];
  aiInsights: number;
  artifacts: number;
}

/* ── Mock data ──────────────────────────────────────────────── */

const WORKSPACES: Workspace[] = [
  {
    id: '1',
    name: 'SPF Optimization — Run #4',
    description: 'Bayesian optimization pass over ZnO/TiO₂ concentration space. Pareto frontier mapped across SPF, water resistance, and cost. Top 3 candidates identified.',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    status: 'active',
    panelCount: 4,
    chatMessages: 38,
    lastOpenedBy: 'Dr. Sarah Chen',
    lastOpened: '2 hours ago',
    created: 'Mar 14, 2026',
    columns: 2,
    tags: ['Bayesian', 'SPF', 'candidates', 'Pareto'],
    aiInsights: 7,
    artifacts: 5,
  },
  {
    id: '4',
    name: 'UV Filter Degradation — ISO 24444',
    description: 'Photostability kinetics exploration across Avobenzone + stabilizer combinations. Degradation curves modeled at 290–400 nm simulated solar spectrum.',
    project: 'UV Filter Photo-Stability',
    projectColor: '#ea580c',
    status: 'active',
    panelCount: 3,
    chatMessages: 14,
    lastOpenedBy: 'Dr. T. Nakamura',
    lastOpened: 'Today, 9:42 AM',
    created: 'Mar 15, 2026',
    columns: 2,
    tags: ['photostability', 'Avobenzone', 'UV-A', 'degradation'],
    aiInsights: 3,
    artifacts: 2,
  },
  {
    id: '3',
    name: 'Texture Blend Exploration',
    description: 'Sensory score modelling for Cyclopentasiloxane / IPM blend ratios. SHAP analysis of top drivers of spreadability and silkiness.',
    project: 'Emollient Texture Analysis',
    projectColor: '#059669',
    status: 'saved',
    panelCount: 3,
    chatMessages: 22,
    lastOpenedBy: 'Dr. Emma Richardson',
    lastOpened: '1 week ago',
    created: 'Mar 7, 2026',
    columns: 2,
    tags: ['sensory', 'SHAP', 'emollient', 'silkiness'],
    aiInsights: 5,
    artifacts: 4,
  },
  {
    id: '2',
    name: 'CMC Screening — Batch 3',
    description: 'Virtual screening pass using CMC-GNN-v2. 320 novel surfactant candidates evaluated. Ionic classification cluster analysis performed.',
    project: 'Surfactant CMC Prediction',
    projectColor: '#7c3aed',
    status: 'saved',
    panelCount: 2,
    chatMessages: 31,
    lastOpenedBy: 'Dr. R. Patel',
    lastOpened: '3 weeks ago',
    created: 'Feb 18, 2026',
    columns: 3,
    tags: ['CMC', 'GNN', 'virtual screening', 'surfactant'],
    aiInsights: 6,
    artifacts: 3,
  },
  {
    id: '6',
    name: 'Free Exploration — Emollient Rheology',
    description: 'Ad-hoc analysis of viscosity profiles across 12 emollient blends. No project assigned. Standalone ideation session.',
    project: null,
    projectColor: null,
    status: 'saved',
    panelCount: 2,
    chatMessages: 9,
    lastOpenedBy: 'Dr. Sarah Chen',
    lastOpened: '5 days ago',
    created: 'Mar 11, 2026',
    columns: 1,
    tags: ['rheology', 'viscosity', 'exploratory'],
    aiInsights: 2,
    artifacts: 1,
  },
  {
    id: '5',
    name: 'SPF Optimization — Initial EDA',
    description: 'Early exploratory data analysis on the 2,450-row sunscreen dataset. Feature distributions, missing value audit, and correlation heatmap generated.',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    status: 'archived',
    panelCount: 3,
    chatMessages: 18,
    lastOpenedBy: 'Dr. Sarah Chen',
    lastOpened: '6 weeks ago',
    created: 'Jan 20, 2026',
    columns: 2,
    tags: ['EDA', 'correlation', 'feature analysis'],
    aiInsights: 4,
    artifacts: 2,
  },
];

/* ── Status config ───────────────────────────────────────────── */

const STATUS_CONFIG: Record<WsStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:   { label: 'Active',    color: '#3F98FF', bg: '#eff6ff',  icon: Zap         },
  saved:    { label: 'Saved',     color: '#059669', bg: '#f0fdf4',  icon: CheckCircle2},
  archived: { label: 'Archived',  color: '#9ca3af', bg: '#f9fafb',  icon: Archive     },
};

/* ── New Workspace Modal ────────────────────────────────────── */

interface NewWsConfig {
  wsName: string;
  description: string;
  projectId: string;
  modelId: string;
  modelVersion: string;
  columns: 1 | 2 | 3;
}

const PROJECT_COLORS: Record<string, string> = {
  '1': '#3F98FF',
  '2': '#7c3aed',
  '3': '#059669',
  '4': '#ea580c',
  '5': '#0891b2',
};

function NewWorkspaceModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (cfg: NewWsConfig) => void;
}) {
  const [wsName, setWsName]       = useState('');
  const [description, setDesc]    = useState('');
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const [modelId, setModelId]     = useState('');
  const [modelVersion, setVersion] = useState('');
  const [columns, setColumns]     = useState<1 | 2 | 3>(2);

  // Derived
  const projectModels = MODELS.filter(m => {
    const proj = PROJECTS.find(p => p.id === projectId);
    return proj && m.project === proj.name;
  });
  const availableModels = projectModels.length > 0 ? projectModels : MODELS;
  const activeModel = MODELS.find(m => m.id === modelId) ?? availableModels[0];

  // Reset whenever modal opens
  useEffect(() => {
    if (!open) return;
    setWsName('');
    setDesc('');
    const first = PROJECTS[0];
    setProjectId(first.id);
    const firstModel = MODELS.find(m => m.project === first.name) ?? MODELS[0];
    setModelId(firstModel.id);
    setVersion(firstModel.defaultVersion);
    setColumns(2);
  }, [open]);

  const handleProjectChange = (pid: string) => {
    setProjectId(pid);
    const proj = PROJECTS.find(p => p.id === pid);
    const first = MODELS.find(m => m.project === proj?.name) ?? MODELS[0];
    setModelId(first.id);
    setVersion(first.defaultVersion);
  };

  const handleModelChange = (mid: string) => {
    setModelId(mid);
    const m = MODELS.find(x => x.id === mid) ?? MODELS[0];
    setVersion(m.defaultVersion);
  };

  if (!open) return null;

  const canCreate = wsName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[620px] max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#3F98FF]/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#3F98FF]" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">New Workspace</div>
              <div className="text-[11px] text-slate-500">Set up a blank AI analysis canvas</div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Workspace Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={wsName}
              onChange={e => setWsName(e.target.value)}
              placeholder="e.g. SPF Optimization — Run #5"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3F98FF] focus:bg-white transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Description <span className="text-slate-300">optional</span></label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="What are you exploring in this session?"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3F98FF] focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Project + Model row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Project */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <FolderOpen className="w-3 h-3" /> Project
              </label>
              <select
                value={projectId}
                onChange={e => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-[#3F98FF] focus:bg-white transition-colors"
              >
                {PROJECTS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {/* project color swatch */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PROJECT_COLORS[projectId] ?? '#9ca3af' }} />
                <span className="text-[10px] text-slate-400">
                  {PROJECTS.find(p => p.id === projectId)?.status === 'active' ? 'Active project' : 'Draft project'}
                </span>
              </div>
            </div>

            {/* Model */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <Brain className="w-3 h-3" /> Model
              </label>
              <select
                value={modelId}
                onChange={e => handleModelChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-[#3F98FF] focus:bg-white transition-colors"
              >
                {availableModels.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              {activeModel && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">{activeModel.type} · {activeModel.features} features</span>
                </div>
              )}
            </div>
          </div>

          {/* Version selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Version</label>
            <div className="flex flex-wrap gap-2">
              {activeModel?.versions.map(v => (
                <button
                  key={v.version}
                  type="button"
                  onClick={() => setVersion(v.version)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    modelVersion === v.version
                      ? 'border-[#3F98FF] bg-[#3F98FF]/10 text-[#3F98FF]'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {v.version}
                  {v.status === 'deployed' && <span className="ml-1.5 px-1 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-semibold">Deployed</span>}
                  {v.status === 'staging'  && <span className="ml-1.5 px-1 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-semibold">Staging</span>}
                </button>
              ))}
            </div>
            {activeModel && (
              <div className="mt-2 text-[11px] text-slate-400">
                R² {activeModel.versions.find(v => v.version === modelVersion)?.r2 ?? '—'} · {activeModel.versions.find(v => v.version === modelVersion)?.trainSamples?.toLocaleString() ?? '—'} training samples
              </div>
            )}
          </div>

          {/* Layout */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Canvas Layout</label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColumns(c)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[11px] font-medium transition-colors ${
                    columns === c
                      ? 'border-[#3F98FF] bg-[#3F98FF]/10 text-[#3F98FF]'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {/* simple column preview */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: c }).map((_, i) => (
                      <div key={i} className={`h-5 rounded-sm ${columns === c ? 'bg-[#3F98FF]/30' : 'bg-slate-200'}`} style={{ width: c === 1 ? 32 : c === 2 ? 14 : 9 }} />
                    ))}
                  </div>
                  <span>{c === 1 ? '1 Column' : c === 2 ? '2 Columns' : '3 Columns'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => canCreate && onCreate({ wsName: wsName.trim(), description, projectId, modelId, modelVersion, columns })}
            disabled={!canCreate}
            className="px-5 py-2 rounded-xl bg-[#3F98FF] text-white text-sm font-semibold hover:bg-[#2980e8] disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
          >
            Create Workspace
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Workspace Card ──────────────────────────────────────────── */

function WorkspaceCard({ ws }: { ws: Workspace }) {
  const navigate = useNavigate();
  const sc = STATUS_CONFIG[ws.status];

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden group">
      {/* Color accent bar */}
      <div
        className="h-1"
        style={{ backgroundColor: ws.projectColor ?? '#e5e7eb' }}
      />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {/* Status */}
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ backgroundColor: sc.bg, color: sc.color }}
              >
                <sc.icon className="w-2.5 h-2.5" />
                {sc.label}
              </span>
              {/* Project badge */}
              {ws.project ? (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: (ws.projectColor ?? '#3F98FF') + '15', color: ws.projectColor ?? '#3F98FF' }}
                >
                  <Layers className="w-2.5 h-2.5" />
                  {ws.project}
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 flex items-center gap-1">
                  <Circle className="w-2.5 h-2.5" />
                  No project
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">{ws.name}</h3>
          </div>
          <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors shrink-0 opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{ws.description}</p>

        {/* Panel/config stats */}
        <div className="flex items-center gap-4 mb-4">
          {[
            { icon: PanelRight,    label: 'Panels',   value: ws.panelCount    },
            { icon: MessageSquare, label: 'Messages',  value: ws.chatMessages  },
            { icon: Sparkles,      label: 'Insights',  value: ws.aiInsights    },
            { icon: BarChart3,     label: 'Artifacts', value: ws.artifacts     },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="w-3 h-3 text-gray-300" />
              <span className="text-xs font-semibold text-gray-700">{value}</span>
              <span className="text-[9px] text-gray-400">{label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1 text-[9px] text-gray-400">
            <Cpu className="w-3 h-3" />
            {ws.columns}-col layout
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1 flex-wrap mb-4">
          {ws.tags.map(t => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{t}</span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <Users className="w-3 h-3" />
            <span>{ws.lastOpenedBy}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock className="w-3 h-3" />
            {ws.lastOpened}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => navigate(`/workspace/${ws.id}`)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              ws.status === 'archived'
                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                : 'bg-[#3F98FF] text-white hover:bg-[#2563eb] shadow-sm'
            }`}
          >
            <ExternalLink className="w-3 h-3" />
            {ws.status === 'archived' ? 'View Archive' : 'Open Workspace'}
          </button>
          {ws.project && (
            <button
              onClick={() => {
                const projectId = WORKSPACES.find(w => w.id === ws.id)?.id;
                navigate(`/projects/${projectId}`);
              }}
              className="flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Project
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */

type FilterStatus = 'all' | 'active' | 'saved' | 'archived';

const STATS = [
  { label: 'Total Sessions',  value: String(WORKSPACES.length),                                       icon: LayoutDashboard, color: '#3F98FF' },
  { label: 'Active',          value: String(WORKSPACES.filter(w => w.status === 'active').length),    icon: Zap,             color: '#059669' },
  { label: 'Panels Open',     value: String(WORKSPACES.reduce((s, w) => s + w.panelCount, 0)),        icon: PanelRight,      color: '#7c3aed' },
  { label: 'AI Messages',     value: String(WORKSPACES.reduce((s, w) => s + w.chatMessages, 0)),      icon: MessageSquare,   color: '#ea580c' },
  { label: 'Artifacts',       value: String(WORKSPACES.reduce((s, w) => s + w.artifacts, 0)),         icon: BarChart3,       color: '#0891b2' },
];

export function WorkspacesPage() {
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState<FilterStatus>('all');
  const [showNewModal, setShowNew]  = useState(false);
  const navigate = useNavigate();

  const handleCreate = (cfg: NewWsConfig) => {
    setShowNew(false);
    navigate('/workspace/new', { state: cfg });
  };

  const filtered = WORKSPACES.filter(w => {
    const matchSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.project ?? '').toLowerCase().includes(search.toLowerCase()) ||
      w.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === 'all' || w.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex-1 overflow-auto bg-gray-50 h-full">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span>Noble AI VIP</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-600 font-medium">Workspaces</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Workspaces</h1>
            <p className="text-sm text-gray-500 mt-0.5">AI lab canvas sessions — your active and saved working environments</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3F98FF] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Workspace
          </button>

          <NewWorkspaceModal open={showNewModal} onClose={() => setShowNew(false)} onCreate={handleCreate} />
        </div>

        {/* Stats */}
        <div className="flex gap-5">
          {STATS.map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '15' }}>
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 leading-tight">{s.value}</div>
                <div className="text-[10px] text-gray-400">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Filters & Search */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {(['all', 'active', 'saved', 'archived'] as FilterStatus[]).map(f => {
              const count = f === 'all' ? WORKSPACES.length : WORKSPACES.filter(w => w.status === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                    filter === f
                      ? 'bg-[#3F98FF] text-white shadow-sm'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {f === 'all' ? `All (${count})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${count})`}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF] bg-white w-56"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <LayoutDashboard className="w-7 h-7 text-gray-300" />
            </div>
            <div className="text-sm font-semibold text-gray-400">No workspaces found</div>
            <div className="text-xs text-gray-300 mt-1">Try adjusting your search or filter.</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(ws => (
              <WorkspaceCard key={ws.id} ws={ws} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
