import { X, Maximize2, Minimize2, BarChart3, Table, Atom, TrendingUp, FileText, GripVertical, Brain, FlaskConical, Activity } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ZAxis
} from 'recharts';
import type { DashboardItem } from './generative-dashboard';

interface DashboardArtifactProps {
  item: DashboardItem;
  onRemove?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  isDragging?: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'chart-bar': <BarChart3 className="w-3.5 h-3.5" />,
  'chart-line': <Activity className="w-3.5 h-3.5" />,
  'chart-area': <TrendingUp className="w-3.5 h-3.5" />,
  'scatter': <TrendingUp className="w-3.5 h-3.5" />,
  'radar': <Activity className="w-3.5 h-3.5" />,
  'table': <Table className="w-3.5 h-3.5" />,
  'molecule': <Atom className="w-3.5 h-3.5" />,
  'shap': <Brain className="w-3.5 h-3.5" />,
  'heatmap': <BarChart3 className="w-3.5 h-3.5" />,
  'recipe': <FlaskConical className="w-3.5 h-3.5" />,
  'stats': <TrendingUp className="w-3.5 h-3.5" />,
  'text': <FileText className="w-3.5 h-3.5" />,
};

const TYPE_BADGE: Record<string, string> = {
  'chart-bar': 'bg-blue-100 text-blue-700',
  'chart-line': 'bg-purple-100 text-purple-700',
  'chart-area': 'bg-teal-100 text-teal-700',
  'scatter': 'bg-orange-100 text-orange-700',
  'radar': 'bg-pink-100 text-pink-700',
  'table': 'bg-gray-100 text-gray-700',
  'molecule': 'bg-indigo-100 text-indigo-700',
  'shap': 'bg-violet-100 text-violet-700',
  'heatmap': 'bg-rose-100 text-rose-700',
  'recipe': 'bg-green-100 text-green-700',
  'stats': 'bg-cyan-100 text-cyan-700',
  'text': 'bg-amber-100 text-amber-700',
};

const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  fontSize: '11px',
  color: '#f1f5f9',
};

function renderChart(item: DashboardItem) {
  const { chartData, type } = item;
  if (!chartData) return null;

  if (type === 'chart-bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData.data} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={chartData.xAxisKey} tick={{ fontSize: 10, fill: '#64748b' }} stroke="#e2e8f0" />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#e2e8f0" />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
          {chartData.yAxisKeys.map(yk => (
            <Bar key={yk.key} dataKey={yk.key} name={yk.name} fill={yk.color} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'chart-line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData.data} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={chartData.xAxisKey} tick={{ fontSize: 10, fill: '#64748b' }} stroke="#e2e8f0" />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#e2e8f0" />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
          {chartData.yAxisKeys.map(yk => (
            <Line key={yk.key} type="monotone" dataKey={yk.key} name={yk.name} stroke={yk.color} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'chart-area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData.data} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
          <defs>
            {chartData.yAxisKeys.map(yk => (
              <linearGradient key={yk.key} id={`grad-${yk.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={yk.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={yk.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={chartData.xAxisKey} tick={{ fontSize: 10, fill: '#64748b' }} stroke="#e2e8f0" />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#e2e8f0" />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
          {chartData.yAxisKeys.map(yk => (
            <Area key={yk.key} type="monotone" dataKey={yk.key} name={yk.name} stroke={yk.color} fill={`url(#grad-${yk.key})`} strokeWidth={2} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'radar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData.data} margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey={chartData.xAxisKey} tick={{ fontSize: 10, fill: '#64748b' }} />
          <PolarRadiusAxis angle={90} tick={{ fontSize: 9, fill: '#94a3b8' }} domain={[0, 100]} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          {chartData.yAxisKeys.map(yk => (
            <Radar key={yk.key} name={yk.name} dataKey={yk.key} stroke={yk.color} fill={yk.color} fillOpacity={0.15} />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}

function renderTable(item: DashboardItem) {
  const data = item.content?.rows || item.content || [];
  if (!data.length) return <div className="p-4 text-sm text-gray-400">No data</div>;
  const keys = Object.keys(data[0]);
  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#f8fafc] sticky top-0">
            {keys.map(k => (
              <th key={k} className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">
                {k.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={i} className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${i === 0 ? 'bg-blue-50/30' : ''}`}>
              {keys.map(k => (
                <td key={k} className="px-3 py-2 text-gray-700">
                  {typeof row[k] === 'number'
                    ? (Number.isInteger(row[k]) ? row[k] : row[k].toFixed(2))
                    : row[k]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderSHAP(item: DashboardItem) {
  const data = item.content?.shapData || [
    { feature: 'Zinc Oxide %', value: 0.68 },
    { feature: 'Titanium Dioxide %', value: 0.54 },
    { feature: 'Avobenzone %', value: 0.42 },
    { feature: 'Octocrylene %', value: 0.35 },
    { feature: 'Emollient Type', value: -0.22 },
    { feature: 'pH Level', value: -0.18 },
    { feature: 'Water Content', value: 0.12 },
    { feature: 'Viscosity Agent', value: -0.08 },
  ];

  return (
    <div className="h-full flex flex-col p-3">
      <div className="text-[10px] text-gray-500 mb-2 flex items-center gap-2">
        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-[#3F98FF] rounded inline-block" /> Positive impact</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-[#f97316] rounded inline-block" /> Negative impact</span>
      </div>
      <div className="flex-1 space-y-1.5 overflow-auto">
        {data.map((d: any, i: number) => {
          const pct = Math.abs(d.value) / 0.8 * 100;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 w-32 shrink-0 text-right">{d.feature}</span>
              <div className="flex-1 flex items-center">
                <div className="relative h-4 flex-1 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="absolute inset-y-0 rounded transition-all"
                    style={{
                      left: d.value >= 0 ? '50%' : `calc(50% - ${pct / 2}%)`,
                      width: `${pct / 2}%`,
                      backgroundColor: d.value >= 0 ? '#3F98FF' : '#f97316',
                    }}
                  />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-gray-300" />
                </div>
                <span className={`ml-2 text-[10px] font-semibold w-8 ${d.value >= 0 ? 'text-[#3F98FF]' : 'text-[#f97316]'}`}>
                  {d.value > 0 ? '+' : ''}{d.value.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderHeatmap(item: DashboardItem) {
  const labels = item.content?.labels || ['ZnO', 'TiO₂', 'Avo', 'Oct', 'Emol', 'pH', 'H₂O', 'SPF'];
  const matrix = item.content?.matrix || [
    [1.00, 0.42, 0.18, 0.22, -0.31, -0.12, 0.08, 0.82],
    [0.42, 1.00, 0.25, 0.31, -0.18, 0.05, -0.12, 0.74],
    [0.18, 0.25, 1.00, 0.56, 0.22, -0.08, 0.14, 0.61],
    [0.22, 0.31, 0.56, 1.00, 0.11, -0.15, 0.09, 0.58],
    [-0.31, -0.18, 0.22, 0.11, 1.00, 0.28, -0.22, -0.35],
    [-0.12, 0.05, -0.08, -0.15, 0.28, 1.00, 0.18, -0.28],
    [0.08, -0.12, 0.14, 0.09, -0.22, 0.18, 1.00, 0.15],
    [0.82, 0.74, 0.61, 0.58, -0.35, -0.28, 0.15, 1.00],
  ];

  const getColor = (v: number) => {
    if (v === 1) return 'rgba(63,152,255,0.9)';
    if (v > 0) return `rgba(63,152,255,${v * 0.85 + 0.05})`;
    return `rgba(249,115,22,${Math.abs(v) * 0.85 + 0.05})`;
  };

  return (
    <div className="h-full p-2 overflow-auto">
      <div className="inline-block min-w-full">
        <div className="flex ml-8 mb-1">
          {labels.map((l: string) => (
            <div key={l} className="w-9 text-center text-[9px] text-gray-500 font-medium">{l}</div>
          ))}
        </div>
        {matrix.map((row: number[], ri: number) => (
          <div key={ri} className="flex items-center mb-0.5">
            <div className="w-8 text-[9px] text-gray-500 text-right pr-1 font-medium">{labels[ri]}</div>
            {row.map((val: number, ci: number) => (
              <div
                key={ci}
                className="w-9 h-7 flex items-center justify-center text-[9px] font-semibold rounded-sm mx-px transition-all hover:scale-110 cursor-default"
                style={{
                  backgroundColor: getColor(val),
                  color: Math.abs(val) > 0.55 ? 'white' : '#374151',
                }}
                title={`${labels[ri]} × ${labels[ci]}: r=${val.toFixed(2)}`}
              >
                {val.toFixed(2)}
              </div>
            ))}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2 ml-8">
          <div className="flex items-center gap-1">
            <div className="w-16 h-2 rounded" style={{ background: 'linear-gradient(to right, rgba(249,115,22,0.8), white, rgba(63,152,255,0.9))' }} />
          </div>
          <span className="text-[9px] text-gray-400">-1.0 → 0 → +1.0</span>
        </div>
      </div>
    </div>
  );
}

function renderRecipe(item: DashboardItem) {
  const r = item.content?.recipe || {
    id: 'R-047', name: 'SPF 50+ Optimized',
    spf: 52.3, wr: 96.8, stability: 97, cost: -12,
    ingredients: [
      { name: 'Zinc Oxide (nano)', pct: 15.2, role: 'Primary UV filter', color: '#3F98FF' },
      { name: 'Titanium Dioxide', pct: 8.5, role: 'Broad-spectrum UV', color: '#7c3aed' },
      { name: 'Avobenzone', pct: 3.0, role: 'UVA organic filter', color: '#059669' },
      { name: 'Octocrylene', pct: 2.2, role: 'UV stabilizer', color: '#ea580c' },
      { name: 'Cyclopentasiloxane', pct: 12.0, role: 'Emollient', color: '#0891b2' },
      { name: 'Dimethicone', pct: 5.0, role: 'Skin feel agent', color: '#db2777' },
      { name: 'Aqua / Water', pct: 54.1, role: 'Solvent base', color: '#6366f1' },
    ]
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="grid grid-cols-4 gap-2 p-3 border-b border-gray-100">
        {[
          { label: 'Pred. SPF', value: r.spf, unit: '', color: '#3F98FF', bg: 'bg-blue-50' },
          { label: 'Water Res.', value: r.wr + '%', unit: '', color: '#059669', bg: 'bg-green-50' },
          { label: 'Stability', value: r.stability + '%', unit: '', color: '#7c3aed', bg: 'bg-purple-50' },
          { label: 'Cost Δ', value: r.cost + '%', unit: '', color: '#ea580c', bg: 'bg-orange-50' },
        ].map(m => (
          <div key={m.label} className={`${m.bg} rounded-lg p-2 text-center`}>
            <div className="text-sm font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[9px] text-gray-500 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-1.5">
        {r.ingredients.map((ing: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ing.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-gray-800 truncate">{ing.name}</div>
              <div className="text-[9px] text-gray-400">{ing.role}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, ing.pct * 1.8)}%`, backgroundColor: ing.color }} />
              </div>
              <span className="text-[11px] font-semibold text-gray-700 w-9 text-right">{ing.pct}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[10px] text-gray-500">Total: 100.0% · CI: 96.2%</span>
        <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Validated</span>
      </div>
    </div>
  );
}

function renderStats(item: DashboardItem) {
  const stats = item.content?.stats || [];
  return (
    <div className="h-full p-3 flex flex-col gap-2 overflow-auto">
      {stats.map((s: any, i: number) => (
        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white">
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">{s.label}</div>
            <div className="text-sm font-bold" style={{ color: s.color || '#3F98FF' }}>{s.value}</div>
          </div>
          {s.badge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: s.badgeBg || '#eff6ff', color: s.badgeColor || '#3F98FF' }}>
              {s.badge}
            </span>
          )}
          {s.trend && (
            <span className={`text-[10px] font-medium ${s.trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {s.trend > 0 ? '▲' : '▼'} {Math.abs(s.trend)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function renderMolecule(item: DashboardItem) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f0f7ff] to-[#f5f0ff] p-2">
      <svg viewBox="0 0 360 175" className="w-full" style={{ maxHeight: '160px' }}>
        {/* Background */}
        <rect width="360" height="175" fill="#f0f7ff" rx="8" />

        {/* Title */}
        <text x="180" y="16" textAnchor="middle" fontSize="11" fill="#3F98FF" fontWeight="800">Avobenzone (UVA Filter)</text>
        <text x="180" y="27" textAnchor="middle" fontSize="8" fill="#6b7280">Enol form — λ max = 357 nm | MW = 310.4 g/mol</text>

        {/* Ring 1 hexagon - flat top, center (75,98), r=28 */}
        <polygon points="103,98 89,122 61,122 47,98 61,74 89,74" fill="#eff6ff" stroke="#1e293b" strokeWidth="1.8" />
        {/* Aromatic circle */}
        <circle cx="75" cy="98" r="13" fill="none" stroke="#3F98FF" strokeWidth="1" opacity="0.6" />

        {/* Ring 2 hexagon - flat top, center (278,98), r=28 */}
        <polygon points="306,98 292,122 264,122 250,98 264,74 292,74" fill="#f5f0ff" stroke="#1e293b" strokeWidth="1.8" />
        <circle cx="278" cy="98" r="13" fill="none" stroke="#7c3aed" strokeWidth="1" opacity="0.6" />

        {/* Chain from ring1.v0(103,98) to ring2.v3(250,98) */}
        {/* ring1 to C1 */}
        <line x1="103" y1="98" x2="128" y2="98" stroke="#1e293b" strokeWidth="1.8" />
        {/* C1=O double bond going UP */}
        <line x1="128" y1="98" x2="128" y2="76" stroke="#1e293b" strokeWidth="1.8" />
        <line x1="132" y1="98" x2="132" y2="76" stroke="#1e293b" strokeWidth="1.8" />
        {/* C1 to C2 */}
        <line x1="128" y1="98" x2="155" y2="98" stroke="#1e293b" strokeWidth="1.8" />
        {/* C2=C3 double bond */}
        <line x1="155" y1="98" x2="182" y2="98" stroke="#1e293b" strokeWidth="1.8" />
        <line x1="155" y1="94" x2="182" y2="94" stroke="#1e293b" strokeWidth="1.8" />
        {/* C3 to ring2 */}
        <line x1="182" y1="98" x2="250" y2="98" stroke="#1e293b" strokeWidth="1.8" />
        {/* C3-OH going DOWN */}
        <line x1="182" y1="98" x2="182" y2="118" stroke="#1e293b" strokeWidth="1.8" />

        {/* tBu from ring1.v3(47,98) going left */}
        <line x1="47" y1="98" x2="28" y2="98" stroke="#1e293b" strokeWidth="1.8" />
        {/* OMe from ring2.v0(306,98) going right */}
        <line x1="306" y1="98" x2="326" y2="98" stroke="#1e293b" strokeWidth="1.8" />

        {/* Atom Labels */}
        <text x="130" y="72" textAnchor="middle" fontSize="11" fill="#dc2626" fontWeight="700">O</text>
        <text x="153" y="110" textAnchor="middle" fontSize="9" fill="#374151">H</text>
        <text x="182" y="130" textAnchor="middle" fontSize="10" fill="#dc2626" fontWeight="700">OH</text>
        <text x="17" y="101" textAnchor="middle" fontSize="9" fill="#374151" fontWeight="600">tBu</text>
        <text x="336" y="101" textAnchor="middle" fontSize="9" fill="#dc2626" fontWeight="600">OCH₃</text>

        {/* UV absorption annotation */}
        <rect x="108" y="58" width="90" height="10" fill="#3F98FF" fillOpacity="0.08" rx="3" />
        <text x="153" y="66" textAnchor="middle" fontSize="8" fill="#3F98FF">β-diketone chelate</text>

        {/* Confidence badge */}
        <rect x="270" y="140" width="80" height="16" rx="8" fill="#dcfce7" />
        <text x="310" y="151" textAnchor="middle" fontSize="9" fill="#15803d" fontWeight="700">✓ SPF Active</text>
      </svg>
      <div className="flex gap-3 mt-2">
        {[['MW', '310.4 g/mol'], ['logP', '4.68'], ['λmax', '357 nm'], ['Conc.', '3.0% w/w']].map(([k, v]) => (
          <div key={k} className="text-center">
            <div className="text-[9px] text-gray-400">{k}</div>
            <div className="text-[10px] font-semibold text-gray-700">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderScatter(item: DashboardItem) {
  const data = item.content?.paretoData || [
    { spf: 28, cost: 0.95, stability: 82, id: 'F001', type: 'suboptimal' },
    { spf: 32, cost: 0.88, stability: 86, id: 'F002', type: 'suboptimal' },
    { spf: 38, cost: 0.82, stability: 89, id: 'F003', type: 'suboptimal' },
    { spf: 41, cost: 0.79, stability: 91, id: 'F004', type: 'candidate' },
    { spf: 43, cost: 0.75, stability: 93, id: 'F005', type: 'candidate' },
    { spf: 45, cost: 0.72, stability: 94, id: 'F006', type: 'pareto' },
    { spf: 48, cost: 0.70, stability: 95, id: 'F007', type: 'pareto' },
    { spf: 50, cost: 0.68, stability: 96, id: 'F008', type: 'pareto' },
    { spf: 52.3, cost: 0.65, stability: 97, id: 'R-047', type: 'optimal' },
    { spf: 49, cost: 0.67, stability: 96.5, id: 'F010', type: 'pareto' },
    { spf: 35, cost: 0.91, stability: 85, id: 'F011', type: 'suboptimal' },
    { spf: 30, cost: 0.93, stability: 83, id: 'F012', type: 'suboptimal' },
    { spf: 44, cost: 0.76, stability: 92, id: 'F013', type: 'candidate' },
    { spf: 46, cost: 0.71, stability: 94, id: 'F014', type: 'pareto' },
    { spf: 51, cost: 0.66, stability: 96.8, id: 'F015', type: 'pareto' },
  ];

  const typeColors: Record<string, string> = {
    suboptimal: '#94a3b8',
    candidate: '#fbbf24',
    pareto: '#3F98FF',
    optimal: '#059669',
  };

  const grouped = {
    suboptimal: data.filter(d => d.type === 'suboptimal'),
    candidate: data.filter(d => d.type === 'candidate'),
    pareto: data.filter(d => d.type === 'pareto'),
    optimal: data.filter(d => d.type === 'optimal'),
  };

  return (
    <div className="h-full p-3 flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        {Object.entries(typeColors).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1 text-[10px] text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c }} />
            {k === 'optimal' ? '★ R-047 (Lead)' : k.charAt(0).toUpperCase() + k.slice(1)}
          </span>
        ))}
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: -10, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="spf" name="SPF" type="number" domain={[25, 58]} label={{ value: 'SPF Value →', position: 'insideBottom', dy: 8, fontSize: 10, fill: '#64748b' }} tick={{ fontSize: 9, fill: '#64748b' }} stroke="#e2e8f0" />
            <YAxis dataKey="cost" name="Cost Index" type="number" domain={[0.6, 1.0]} label={{ value: '← Cost', angle: -90, position: 'insideLeft', dx: 12, fontSize: 10, fill: '#64748b' }} tick={{ fontSize: 9, fill: '#64748b' }} stroke="#e2e8f0" />
            <ZAxis dataKey="stability" range={[30, 120]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }} formatter={(v: any, name: string) => [name === 'Cost Index' ? v.toFixed(2) : v, name]} />
            {Object.entries(grouped).map(([type, points]) => (
              <Scatter key={type} data={points} fill={typeColors[type]} opacity={type === 'suboptimal' ? 0.6 : 0.85} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 text-[10px] text-gray-400 text-center">
        47 Pareto-optimal candidates · Bubble size = stability index · R-047 achieves all 4 objectives ★
      </div>
    </div>
  );
}

function renderText(item: DashboardItem) {
  const lines = item.content?.lines || [];
  return (
    <div className="h-full p-4 overflow-auto">
      <div className="prose prose-sm max-w-none space-y-2">
        {lines.map((line: any, i: number) => (
          <div key={i}>
            {line.type === 'heading' ? (
              <div className="text-sm font-semibold text-gray-800 mt-3 mb-1 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#3F98FF] rounded inline-block" />
                {line.text}
              </div>
            ) : line.type === 'bullet' ? (
              <div className="text-xs text-gray-700 flex items-start gap-2 ml-3">
                <span className="text-[#3F98FF] mt-0.5">•</span>
                {line.text}
              </div>
            ) : line.type === 'metric' ? (
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs text-gray-600">{line.label}</span>
                <span className="text-xs font-semibold text-gray-900">{line.value}</span>
              </div>
            ) : (
              <p className="text-xs text-gray-700 leading-relaxed">{line.text}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardArtifact({ item, onRemove, onMaximize, isMaximized, onDragStart, onResizeStart, isDragging }: DashboardArtifactProps) {
  const { type, title, subtitle } = item;

  const renderContent = () => {
    switch (type) {
      case 'chart-bar': return renderChart(item);
      case 'chart-line': return renderChart(item);
      case 'chart-area': return renderChart(item);
      case 'radar': return renderChart(item);
      case 'table': return renderTable(item);
      case 'molecule': return renderMolecule(item);
      case 'shap': return renderSHAP(item);
      case 'heatmap': return renderHeatmap(item);
      case 'recipe': return renderRecipe(item);
      case 'stats': return renderStats(item);
      case 'scatter': return renderScatter(item);
      case 'text': return renderText(item);
      default: return <div className="p-4 text-sm text-gray-400">Unknown artifact type</div>;
    }
  };

  return (
    <div className={`group h-full bg-white border rounded-xl shadow-sm flex flex-col overflow-hidden transition-shadow relative ${isDragging ? 'shadow-2xl border-[#3F98FF]/50' : 'border-gray-200 hover:shadow-md'} ${item.isNew ? 'ring-2 ring-[#3F98FF]/40' : ''}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white cursor-grab active:cursor-grabbing select-none shrink-0"
        onMouseDown={onDragStart}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <GripVertical className="w-3 h-3 text-gray-300 shrink-0" />
          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${TYPE_BADGE[type] || 'bg-gray-100 text-gray-600'}`}>
            {TYPE_ICONS[type]}
          </span>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate">{title}</div>
            {subtitle && <div className="text-[10px] text-gray-400 truncate">{subtitle}</div>}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 ml-2">
          {item.isNew && (
            <span className="text-[9px] font-medium text-[#3F98FF] bg-blue-50 px-1.5 py-0.5 rounded-full mr-1">NEW</span>
          )}
          {onMaximize && (
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              onClick={(e) => { e.stopPropagation(); onMaximize(); }}
              onMouseDown={e => e.stopPropagation()}
            >
              {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          )}
          {onRemove && (
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              onMouseDown={e => e.stopPropagation()}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>

      {/* Resize handle is now managed by the parent GenerativeDashboard */}
    </div>
  );
}