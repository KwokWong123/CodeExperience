import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Search, LayoutDashboard, FlaskConical, Clock,
  ChevronRight, ExternalLink, MoreHorizontal, Layers,
  Cpu, MessageSquare, BarChart3, Sparkles, Archive,
  CheckCircle2, Circle, Zap, Users, PanelRight,
} from 'lucide-react';

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
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const navigate = useNavigate();

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
            onClick={() => navigate('/workspace/1')}
            className="flex items-center gap-2 px-4 py-2 bg-[#3F98FF] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Workspace
          </button>
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
