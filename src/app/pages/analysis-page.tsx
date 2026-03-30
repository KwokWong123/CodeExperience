import { useState } from 'react';
import {
  Search, Plus, ChevronRight, BarChart3, TrendingUp, Activity,
  Filter, Download, Share2, Maximize2, Clock, Tag, Eye,
  SlidersHorizontal, LayoutGrid, List, ChevronDown, X,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid,
  ReferenceLine,
} from 'recharts';

/* ── Types ──────────────────────────────────────────────────── */

type ChartType = 'bar' | 'line' | 'scatter' | 'heatmap' | 'correlation';

interface AnalysisChart {
  id: string;
  name: string;
  description: string;
  type: ChartType;
  project: string;
  projectColor: string;
  tags: string[];
  created: string;
  author: string;
  category: string;
  pinned?: boolean;
}

/* ── Chart data ─────────────────────────────────────────────── */

const CHARTS: AnalysisChart[] = [
  {
    id: 'ch-1',
    name: 'Feature Correlation Matrix',
    description: 'Pearson correlation matrix across all 18 formulation features. Highlights strong positive correlation between zinc oxide concentration and SPF (r=0.82).',
    type: 'correlation',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    tags: ['correlation', 'features', 'SPF'],
    created: 'Mar 14, 2026',
    author: 'Dr. Sarah Chen',
    category: 'Correlation',
    pinned: true,
  },
  {
    id: 'ch-2',
    name: 'Cost vs. Predicted SPF',
    description: 'Bar chart comparing cost per kg vs. predicted SPF performance across candidate formulations. Identifies the Pareto-optimal cost-performance frontier.',
    type: 'bar',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    tags: ['cost', 'performance', 'Pareto', 'SPF'],
    created: 'Mar 14, 2026',
    author: 'Dr. Sarah Chen',
    category: 'Performance',
    pinned: true,
  },
  {
    id: 'ch-3',
    name: 'Emollient Concentration vs. SPF',
    description: 'SPF performance over increasing emollient concentration across 5 emollient types. Shows the dilution effect on UV filter efficacy.',
    type: 'line',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    tags: ['emollient', 'SPF', 'dilution', 'trend'],
    created: 'Mar 13, 2026',
    author: 'Dr. Sarah Chen',
    category: 'Trends',
  },
  {
    id: 'ch-4',
    name: 'Candidate Scatter — SPF vs. Water Resistance',
    description: 'Scatter plot of 100 candidate recipes showing SPF versus water resistance. Top 3 recipes (R-047, R-089, R-124) highlighted in blue.',
    type: 'scatter',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    tags: ['candidates', 'SPF', 'water-resistance', 'optimization'],
    created: 'Mar 14, 2026',
    author: 'Noble AI Agent',
    category: 'Optimization',
    pinned: true,
  },
  {
    id: 'ch-5',
    name: 'CMC Distribution by Surfactant Type',
    description: 'Average CMC values by ionic classification for 42 surfactant candidates used in the formulation pipeline.',
    type: 'bar',
    project: 'Surfactant CMC Prediction',
    projectColor: '#7c3aed',
    tags: ['CMC', 'surfactant', 'distribution'],
    created: 'Mar 5, 2026',
    author: 'Dr. R. Patel',
    category: 'Distribution',
  },
  {
    id: 'ch-6',
    name: 'Model v2 vs v3 Performance',
    description: 'Side-by-side comparison of R², RMSE, and MAE between SPF-XGB-Ensemble v2.0 and v3.0.',
    type: 'bar',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    tags: ['model', 'comparison', 'performance'],
    created: 'Mar 12, 2026',
    author: 'Dr. Sarah Chen',
    category: 'Performance',
  },
  {
    id: 'ch-7',
    name: 'UV Absorbance Spectrum — Avobenzone',
    description: 'Simulated UV absorbance spectrum for Avobenzone (Butyl Methoxydibenzoylmethane). Peak absorption at 357 nm in UVA range.',
    type: 'line',
    project: 'UV Filter Photo-Stability',
    projectColor: '#ea580c',
    tags: ['UV', 'absorbance', 'Avobenzone', 'spectrum'],
    created: 'Mar 8, 2026',
    author: 'Dr. T. Nakamura',
    category: 'Spectroscopy',
  },
  {
    id: 'ch-8',
    name: 'Sensory Score Distribution',
    description: 'Spreadability, silkiness, and greasiness score distributions across 445 emollient blends from trained panel evaluation.',
    type: 'bar',
    project: 'Emollient Texture Analysis',
    projectColor: '#059669',
    tags: ['sensory', 'emollient', 'scores', 'distribution'],
    created: 'Feb 28, 2026',
    author: 'Dr. L. Martin',
    category: 'Distribution',
  },
];

/* ── Mini chart renderers ───────────────────────────────────── */

function MiniBarChart({ color }: { color: string }) {
  const data = [
    { id: 'R-047', v: 52.3 }, { id: 'R-089', v: 50.1 },
    { id: 'R-124', v: 51.8 }, { id: 'R-031', v: 44.6 }, { id: 'R-072', v: 41.2 },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -24 }}>
        <XAxis dataKey="id" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip wrapperStyle={{ fontSize: 10 }} />
        <Bar dataKey="v" radius={[2, 2, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={i === 0 ? color : color + '55'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniLineChart({ color }: { color: string }) {
  const data = [2, 4, 6, 8, 10, 12, 14].map((pct) => ({
    pct, v: 52 - pct * 0.8, v2: 50 - pct * 0.6,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -24 }}>
        <XAxis dataKey="pct" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="v2" stroke={color + '88'} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MiniScatterChart({ color }: { color: string }) {
  const seed = (n: number) => ((n * 9301 + 49297) % 233280) / 233280;
  const data = Array.from({ length: 40 }, (_, i) => ({
    x: 30 + seed(i * 3) * 35, y: 60 + seed(i * 7) * 38,
  }));
  const top = [{ x: 52.3, y: 91.2 }, { x: 50.1, y: 88.7 }, { x: 51.8, y: 90.5 }];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 4, right: 4, bottom: 4, left: -24 }}>
        <XAxis type="number" dataKey="x" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[25, 70]} />
        <YAxis type="number" dataKey="y" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[55, 100]} />
        <Scatter data={data} fill={color + '44'} />
        <Scatter data={top} fill={color} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function MiniCorrelationChart({ color }: { color: string }) {
  const data = [
    { name: 'ZnO', r: 0.82 }, { name: 'TiO₂', r: 0.71 },
    { name: 'Octo', r: 0.58 }, { name: 'Emol', r: -0.35 }, { name: 'H₂O', r: -0.18 },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 4, bottom: 4, left: 28 }}>
        <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={32} />
        <ReferenceLine x={0} stroke="#e5e7eb" />
        <Bar dataKey="r" radius={[0, 2, 2, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.r >= 0 ? color : '#f87171'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartPreview({ chart }: { chart: AnalysisChart }) {
  const color = chart.projectColor;
  if (chart.type === 'scatter') return <MiniScatterChart color={color} />;
  if (chart.type === 'line') return <MiniLineChart color={color} />;
  if (chart.type === 'correlation') return <MiniCorrelationChart color={color} />;
  return <MiniBarChart color={color} />;
}

const TYPE_ICON: Record<ChartType, React.ReactNode> = {
  bar:         <BarChart3 className="w-3 h-3" />,
  line:        <TrendingUp className="w-3 h-3" />,
  scatter:     <Activity className="w-3 h-3" />,
  heatmap:     <BarChart3 className="w-3 h-3" />,
  correlation: <SlidersHorizontal className="w-3 h-3" />,
};

const TYPE_LABEL: Record<ChartType, string> = {
  bar: 'Bar Chart', line: 'Line Chart', scatter: 'Scatter Plot',
  heatmap: 'Heatmap', correlation: 'Correlation',
};

const TYPE_COLOR: Record<ChartType, string> = {
  bar: 'text-blue-600 bg-blue-50',
  line: 'text-purple-600 bg-purple-50',
  scatter: 'text-orange-600 bg-orange-50',
  heatmap: 'text-rose-600 bg-rose-50',
  correlation: 'text-teal-600 bg-teal-50',
};

const CATEGORIES = ['All', 'Performance', 'Optimization', 'Correlation', 'Trends', 'Distribution', 'Spectroscopy'];

/* ── Detail panel ───────────────────────────────────────────── */

function ChartDetail({ chart, onClose }: { chart: AnalysisChart; onClose: () => void }) {
  return (
    <div className="w-[44%] border-l border-gray-200 bg-white overflow-auto flex flex-col shrink-0">
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${TYPE_COLOR[chart.type]}`}>
              {TYPE_ICON[chart.type]}{TYPE_LABEL[chart.type]}
            </span>
            {chart.pinned && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">★ Pinned</span>
            )}
          </div>
          <h2 className="text-base font-bold text-gray-900 leading-tight">{chart.name}</h2>
          <div className="text-xs text-gray-500 mt-0.5">{chart.project}</div>
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Large preview */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Maximize2 className="w-3 h-3" /> Preview
        </div>
        <div className="bg-gray-50 rounded-xl p-4 h-52">
          <ChartPreview chart={chart} />
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">
        {/* Description */}
        <div>
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</h4>
          <p className="text-xs text-gray-600 leading-relaxed">{chart.description}</p>
        </div>

        {/* Details */}
        <div>
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Details</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Category', value: chart.category },
              { label: 'Created', value: chart.created },
              { label: 'Author', value: chart.author },
              { label: 'Project', value: chart.project.split(' ').slice(0, 2).join(' ') },
            ].map((d) => (
              <div key={d.label} className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">{d.label}</div>
                <div className="text-[11px] font-semibold text-gray-800">{d.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {chart.tags.map((t) => (
              <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">#{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
        <button className="flex items-center gap-1.5 px-3 py-2 bg-[#3F98FF] text-white text-xs font-semibold rounded-lg hover:bg-[#2563eb] transition-colors">
          <Maximize2 className="w-3 h-3" /> Open Full View
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <Download className="w-3 h-3" /> Export
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <Share2 className="w-3 h-3" /> Share
        </button>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */

export function AnalysisPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState('All');

  const projects = ['All', ...Array.from(new Set(CHARTS.map((c) => c.project)))];

  const filtered = CHARTS.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === 'All' || c.category === category;
    const matchProject = projectFilter === 'All' || c.project === projectFilter;
    return matchSearch && matchCat && matchProject;
  });

  const selectedChart = CHARTS.find((c) => c.id === selectedId) ?? null;

  const pinnedCharts = filtered.filter((c) => c.pinned);
  const otherCharts = filtered.filter((c) => !c.pinned);

  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span>Noble AI VIP</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-600 font-medium">Analysis</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Analysis Library</h1>
            <p className="text-sm text-gray-500 mt-0.5">Charts, plots, and visual analyses generated across all projects</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#3F98FF] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              New Chart
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6">
          {[
            { label: 'Total Charts', value: CHARTS.length, color: '#3F98FF' },
            { label: 'Pinned', value: CHARTS.filter((c) => c.pinned).length, color: '#f59e0b' },
            { label: 'Projects', value: new Set(CHARTS.map((c) => c.project)).size, color: '#059669' },
            { label: 'Chart Types', value: new Set(CHARTS.map((c) => c.type)).size, color: '#7c3aed' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col">
              <div className="text-sm font-bold leading-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        <div className={`${selectedId ? 'w-[56%]' : 'flex-1'} overflow-auto p-6 transition-all duration-300`}>

          {/* Filters row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search charts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF] bg-white w-52"
              />
            </div>

            {/* Project dropdown */}
            <div className="relative">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF] cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p} value={p}>{p === 'All' ? 'All Projects' : p.split(' ').slice(0, 3).join(' ')}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
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

          {/* Category tabs */}
          <div className="flex gap-1 mb-5 flex-wrap">
            {CATEGORIES.filter((cat) => cat === 'All' || CHARTS.some((c) => c.category === cat)).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-colors font-medium ${
                  category === cat
                    ? 'bg-[#3F98FF] text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <BarChart3 className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No charts match your filters</p>
            </div>
          ) : viewMode === 'grid' ? (
            <>
              {/* Pinned */}
              {pinnedCharts.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">★ Pinned</span>
                    <div className="flex-1 h-px bg-amber-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {pinnedCharts.map((chart) => (
                      <ChartCard key={chart.id} chart={chart} selected={selectedId === chart.id} onClick={() => setSelectedId(selectedId === chart.id ? null : chart.id)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Others */}
              {otherCharts.length > 0 && (
                <div>
                  {pinnedCharts.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">All Charts</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {otherCharts.map((chart) => (
                      <ChartCard key={chart.id} chart={chart} selected={selectedId === chart.id} onClick={() => setSelectedId(selectedId === chart.id ? null : chart.id)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* List view */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="grid grid-cols-[2fr_1fr_0.8fr_0.8fr_1fr_80px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <div>Chart</div><div>Project</div><div>Type</div><div>Category</div><div>Created</div><div>Actions</div>
              </div>
              {filtered.map((chart) => (
                <div
                  key={chart.id}
                  className={`grid grid-cols-[2fr_1fr_0.8fr_0.8fr_1fr_80px] gap-3 px-5 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors items-center ${selectedId === chart.id ? 'bg-blue-50/40' : ''}`}
                  onClick={() => setSelectedId(selectedId === chart.id ? null : chart.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLOR[chart.type]}`}>
                      {TYPE_ICON[chart.type]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{chart.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">{chart.description.slice(0, 55)}…</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: chart.projectColor }} />
                    <span className="text-xs text-gray-600 truncate">{chart.project.split(' ').slice(0, 2).join(' ')}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TYPE_COLOR[chart.type]}`}>{TYPE_LABEL[chart.type]}</span>
                  </div>
                  <div className="text-xs text-gray-600">{chart.category}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{chart.created}</div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#3F98FF] transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#3F98FF] transition-colors"><Download className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedChart && (
          <ChartDetail chart={selectedChart} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  );
}

/* ── Chart card ─────────────────────────────────────────────── */

function ChartCard({ chart, selected, onClick }: {
  chart: AnalysisChart; selected: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-md group ${selected ? 'border-[#3F98FF] shadow-md shadow-[#3F98FF]/10' : 'border-gray-200 hover:border-gray-300'}`}
    >
      {/* Chart preview area */}
      <div className="h-32 p-3 bg-gray-50 rounded-t-xl border-b border-gray-100">
        <ChartPreview chart={chart} />
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-gray-900 leading-snug truncate">{chart.name}</div>
          </div>
          {chart.pinned && <span className="text-amber-400 text-[11px] shrink-0">★</span>}
        </div>

        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${TYPE_COLOR[chart.type]}`}>
            {TYPE_ICON[chart.type]}{TYPE_LABEL[chart.type]}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{chart.category}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: chart.projectColor }} />
            <span className="text-[10px] text-gray-500 truncate">{chart.project.split(' ').slice(0, 3).join(' ')}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock className="w-2.5 h-2.5" />{chart.created.split(',')[0]}
          </div>
        </div>
      </div>
    </div>
  );
}
