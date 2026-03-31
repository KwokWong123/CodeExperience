import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Label,
} from 'recharts';
import {
  Sparkles, Loader2, ChevronDown, Eye, EyeOff, Star,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────── */

export interface ChartConfig {
  title: string;
  subtitle: string;
  type: 'bar' | 'line' | 'area';
  data: any[];
  xAxisKey: string;
  yAxisKeys: { key: string; color: string; name: string }[];
  referenceLines?: { y: number; label: string; color: string }[];
  highlightKey?: string;
}

// Kept for backward-compat with workspace-page / canvas, but no longer rendered
export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  badge?: boolean;
  trend?: boolean;
}

export interface TableConfig {
  title: string;
  subtitle: string;
  columns: ColumnDef[];
  rows: Record<string, any>[];
  pinnedValue?: string;
}

// Keep CanvasCard / LibraryArtifact imports so callers don't break
import type { CanvasCard } from './artifact-canvas';
import type { LibraryArtifact } from './artifacts-library';

export interface WorkspaceResultsProps {
  chart: ChartConfig | null;
  table: TableConfig | null;
  displayMode?: 'chart' | 'table';
  isLoading?: boolean;
  hasRun: boolean;
  stage: number;
  hiddenRecipeIds?: string[];
  onToggleRecipeVisibility?: (recipeId: string) => void;
  starredRecipeIds?: string[];
  onToggleRecipeStar?: (recipeId: string) => void;
  canvasCards?: CanvasCard[];
  onRemoveCard?: (id: string) => void;
  onUpdateCard?: (id: string, patch: Partial<CanvasCard>) => void;
  onClearAll?: () => void;
  libraryArtifacts?: LibraryArtifact[];
  onAddToCanvas?: (artifactId: string) => void;
}

/* ── Axis options (stage-5 scatter) ─────────────────────────── */

const AXIS_OPTIONS = [
  { key: 'spf',       label: 'Predicted SPF',     unit: '',  domain: [33, 57]  as [number,number], refLine: { val: 50, label: 'SPF ≥50', color: '#059669' } },
  { key: 'wr',        label: 'Water Resistance %', unit: '%', domain: [80, 100] as [number,number], refLine: { val: 90, label: 'WR ≥90%', color: '#f59e0b' } },
  { key: 'stability', label: 'Stability %',        unit: '%', domain: [85, 100] as [number,number], refLine: null },
  { key: 'score',     label: 'Overall Score',      unit: '',  domain: [60, 100] as [number,number], refLine: null },
] as const;

type AxisKey = typeof AXIS_OPTIONS[number]['key'];

/* ── Scatter data (stage 5) ─────────────────────────────────── */

function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function buildTop100() {
  const rand = seededRand(42);
  const recipes: { id: string; spf: number; wr: number; stability: number; score: number; isLead: boolean; isTop3: boolean; color: string }[] = [];

  recipes.push({ id: 'Baseline', spf: 35.5, wr: 82.0, stability: 88.0, score: 0,    isLead: false, isTop3: false, color: '#94a3b8' });
  recipes.push({ id: 'R-047',    spf: 52.3, wr: 96.8, stability: 97.0, score: 98.2, isLead: true,  isTop3: true,  color: '#3F98FF' });
  recipes.push({ id: 'R-089',    spf: 50.1, wr: 95.2, stability: 96.5, score: 96.8, isLead: false, isTop3: true,  color: '#7c3aed' });
  recipes.push({ id: 'R-124',    spf: 51.8, wr: 96.0, stability: 96.8, score: 96.4, isLead: false, isTop3: true,  color: '#059669' });

  const ids = [317,203,441,568,612,703,801,912,44,155,229,338,451,502,614,718,823,911,33,148,261,374,489,531,647,752,864,918,22,136,245,357,468,579,681,792,854,963,11,124,237,348,459,561,672,783,845,956,88,192,303,415,527,638,749,851,962,66,177,281,392,413,524,635,746,857,968,55,169,272,383,494,515,626,737,848,959,44,158,262,373,484,595,16,127,238,349,451,572,683,794,815,926,37,148,259,361];
  ids.forEach((num) => {
    const spf  = 37 + rand() * 15;
    const wr   = 83 + rand() * 12;
    const stab = 87 + rand() * 9;
    const score = (spf / 52) * 40 + (wr / 97) * 35 + (stab / 97) * 25;
    recipes.push({ id: `R-${num}`, spf: +spf.toFixed(1), wr: +wr.toFixed(1), stability: +stab.toFixed(1), score: +score.toFixed(1), isLead: false, isTop3: false, color: '#94a3b8' });
  });
  return recipes;
}

const ALL_RECIPES = buildTop100();

/* ── Scatter tooltip ─────────────────────────────────────────── */

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-[11px] min-w-[140px]">
      <div className="font-semibold text-gray-800 mb-1.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
        {d.isLead && <span className="text-amber-400">★</span>}
        {d.id}
        {d.isLead && <span className="text-[9px] px-1.5 py-0.5 bg-[#3F98FF]/10 text-[#3F98FF] rounded-full">Lead</span>}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4"><span className="text-gray-500">Pred. SPF</span><span className="font-semibold">{d.spf}</span></div>
        <div className="flex justify-between gap-4"><span className="text-gray-500">Water Res.</span><span className="font-semibold">{d.wr}%</span></div>
        <div className="flex justify-between gap-4"><span className="text-gray-500">Stability</span><span className="font-semibold">{d.stability}%</span></div>
        {d.score > 0 && <div className="flex justify-between gap-4"><span className="text-gray-500">Score</span><span className="font-semibold text-[#3F98FF]">{d.score}/100</span></div>}
      </div>
    </div>
  );
}

/* ── Axis selector ───────────────────────────────────────────── */

function AxisSelect({ label, value, onChange, exclude }: { label: string; value: AxisKey; onChange: (k: AxisKey) => void; exclude: AxisKey }) {
  const [open, setOpen] = useState(false);
  const current = AXIS_OPTIONS.find((o) => o.key === value)!;
  return (
    <div className="relative">
      <div className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wider">{label}</div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
      >
        {current.label}
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[170px]">
          {AXIS_OPTIONS.filter((o) => o.key !== exclude).map((opt) => (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center justify-between gap-2 ${opt.key === value ? 'bg-[#3F98FF]/8 text-[#3F98FF] font-semibold' : 'text-gray-700 hover:bg-gray-50 font-medium'}`}
            >
              {opt.label}
              {opt.key === value && <span className="w-1.5 h-1.5 rounded-full bg-[#3F98FF]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Stage-5 scatter plot (chart-only, no formulation tab) ──── */

function RecipeScatterPlot({ recipes, hiddenRecipeIds = [], starredRecipeIds = [] }: { recipes?: any[]; hiddenRecipeIds?: string[]; starredRecipeIds?: string[] }) {
  const [xKey, setXKey] = useState<AxisKey>('spf');
  const [yKey, setYKey] = useState<AxisKey>('wr');
  const [selectedRecipe, setSelectedRecipe] = useState<string>('R-047');

  const xOpt = AXIS_OPTIONS.find((o) => o.key === xKey)!;
  const yOpt = AXIS_OPTIONS.find((o) => o.key === yKey)!;
  const hidden = new Set(hiddenRecipeIds);
  const starred = new Set(starredRecipeIds);
  const data = (recipes?.length ? recipes : ALL_RECIPES)
    .filter((r: any) => r.id === 'Baseline' || !hidden.has(r.id))
    .map((r: any) => ({ ...r, isStarred: Boolean(r.isStarred) || starred.has(r.id) }));
  const historicalData = data.filter((r: any) => r.isHistorical);
  const recipeData = data.filter((r: any) => !r.isHistorical);

  useEffect(() => {
    const lead = recipeData.find((r: any) => r.isLead)?.id;
    if (lead) {
      setSelectedRecipe(lead);
      return;
    }
    if (!recipeData.some((r: any) => r.id === selectedRecipe)) {
      const firstRecipe = recipeData.find((r: any) => r.id !== 'Baseline')?.id;
      if (firstRecipe) setSelectedRecipe(firstRecipe);
    }
  }, [recipeData, selectedRecipe]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const r = payload as any;
    const isSelected = r.id === selectedRecipe;
    const isHighlighted = r.isTop3 || r.id === 'Baseline';
    const clickable = r.id !== 'Baseline';
    const baseR = r.isTop3 ? 9 : r.id === 'Baseline' ? 7 : 5;
    const size = isSelected ? baseR * 1.5 : baseR;

    return (
      <g onClick={() => clickable && setSelectedRecipe(r.id)} style={{ cursor: clickable ? 'pointer' : 'default' }} pointerEvents="all">
        <circle cx={cx} cy={cy} r={Math.max(size + 8, 12)} fill="transparent" />
        {isSelected && <circle cx={cx} cy={cy} r={size + 6} fill={r.color} fillOpacity={0.18} stroke={r.color} strokeWidth={1.5} strokeDasharray="3 2" />}
        {r.isStarred ? (
          <text x={cx} y={cy + 3} textAnchor="middle" fontSize={Math.max(10, size + 3)} fontWeight={700} fill={r.color} stroke={isSelected ? 'white' : 'none'} strokeWidth={isSelected ? 1.2 : 0}>
            ★
          </text>
        ) : (
          <circle cx={cx} cy={cy} r={size} fill={r.color} fillOpacity={isHighlighted || isSelected ? (isSelected ? 1 : 0.85) : 0.45} stroke={isHighlighted || isSelected ? 'white' : 'none'} strokeWidth={isSelected ? 2.5 : 1.5} />
        )}
        {(isHighlighted || isSelected) && (
          <text x={cx} y={cy - size - 6} textAnchor="middle" fontSize={isSelected ? 10 : 9} fontWeight={isSelected ? 700 : 600} fill={r.color} pointerEvents="none">
            {r.isLead ? `★ ${r.id}` : r.id}
          </text>
        )}
      </g>
    );
  };

  const LEGEND_ITEMS = recipeData.filter((r: any) => r.isTop3 || r.id === 'Baseline');

  return (
    <div className="flex flex-col h-full">
      {/* Controls row */}
      <div className="shrink-0 px-3 pt-2 pb-2 border-b border-gray-100 flex items-end justify-between gap-3">
        <div className="flex items-end gap-2">
          <AxisSelect label="X Axis" value={xKey} onChange={setXKey} exclude={yKey} />
          <span className="text-gray-300 pb-1 text-sm">vs</span>
          <AxisSelect label="Y Axis" value={yKey} onChange={setYKey} exclude={xKey} />
        </div>
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {LEGEND_ITEMS.map((r) => (
            <button key={r.id} onClick={() => r.id !== 'Baseline' && setSelectedRecipe(r.id)}
              className={`flex items-center gap-1 text-[10px] font-semibold transition-opacity whitespace-nowrap ${r.id === 'Baseline' ? 'cursor-default opacity-50' : 'cursor-pointer hover:opacity-75'}`}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
              <span style={{ color: r.color }}>{r.isLead ? `★ ${r.id}` : r.id}</span>
            </button>
          ))}
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />Other
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />Historical
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-2 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 24, right: 52, bottom: 32, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis type="number" dataKey={xKey} domain={xOpt.domain} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}>
              <Label value={xOpt.label} offset={-12} position="insideBottom" style={{ fontSize: 10, fill: '#9ca3af' }} />
            </XAxis>
            <YAxis type="number" dataKey={yKey} domain={yOpt.domain} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={38}>
              <Label value={yOpt.label} angle={-90} position="insideLeft" offset={10} style={{ fontSize: 10, fill: '#9ca3af' }} />
            </YAxis>
            <ZAxis type="number" dataKey="stability" range={[40, 200]} />
            <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            {xOpt.refLine && <ReferenceLine x={xOpt.refLine.val} stroke={xOpt.refLine.color} strokeDasharray="4 3" label={{ value: xOpt.refLine.label, fill: xOpt.refLine.color, fontSize: 10, position: 'top' }} />}
            {yOpt.refLine && <ReferenceLine y={yOpt.refLine.val} stroke={yOpt.refLine.color} strokeDasharray="4 3" label={{ value: yOpt.refLine.label, fill: yOpt.refLine.color, fontSize: 10, position: 'insideRight' }} />}
            <Scatter data={historicalData} fill="#9ca3af" name="Historical" isAnimationActive={false} />
            <Scatter data={recipeData} shape={<CustomDot />} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Generic chart ───────────────────────────────────────────── */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-[11px]">
      <div className="font-semibold text-gray-700 mb-1.5 pb-1 border-b border-gray-100">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-800">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ResultChart({ config }: { config: ChartConfig }) {
  const commonProps = { data: config.data, margin: { top: 8, right: 24, left: 0, bottom: 4 } };
  const axisStyle = { fontSize: 11, fill: '#9ca3af' };

  const renderBars = () =>
    config.yAxisKeys.map((yk) => (
      <Bar key={yk.key} dataKey={yk.key} name={yk.name} fill={yk.color} radius={[3, 3, 0, 0]} maxBarSize={32}>
        {config.highlightKey && config.data.map((entry: any, idx: number) => (
          <Cell key={`cell-${idx}`} fill={entry[config.xAxisKey] === config.highlightKey ? yk.color : `${yk.color}99`} />
        ))}
      </Bar>
    ));

  const renderLines = () =>
    config.yAxisKeys.map((yk) => (
      <Line key={yk.key} type="monotone" dataKey={yk.key} name={yk.name} stroke={yk.color} strokeWidth={2} dot={{ fill: yk.color, r: 3 }} activeDot={{ r: 5 }} />
    ));

  const renderAreas = () =>
    config.yAxisKeys.map((yk, i) => (
      <Area key={yk.key} type="monotone" dataKey={yk.key} name={yk.name} stroke={yk.color} fill={yk.color} fillOpacity={i === 0 ? 0.15 : 0.08} strokeWidth={2} />
    ));

  const chartContent = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
      <XAxis dataKey={config.xAxisKey} tick={axisStyle} axisLine={false} tickLine={false} />
      <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
      <Tooltip content={<CustomTooltip />} />
      {config.referenceLines?.map((rl) => (
        <ReferenceLine key={rl.label} y={rl.y} stroke={rl.color} strokeDasharray="4 3" label={{ value: rl.label, fill: rl.color, fontSize: 10 }} />
      ))}
    </>
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      {config.type === 'bar' ? (
        <BarChart {...commonProps}>{chartContent}{renderBars()}</BarChart>
      ) : config.type === 'area' ? (
        <AreaChart {...commonProps}>{chartContent}{renderAreas()}</AreaChart>
      ) : (
        <LineChart {...commonProps}>{chartContent}{renderLines()}</LineChart>
      )}
    </ResponsiveContainer>
  );
}

/* ── Empty / Loading ─────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3F98FF]/10 to-[#7c3aed]/10 border border-[#3F98FF]/20 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-[#3F98FF]" />
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-700 mb-1">No results yet</div>
        <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
          Configure your workspace settings and use the Chat tab to run the AI analysis. Charts will appear here.
        </p>
      </div>
      <div className="flex flex-col gap-1.5 w-full max-w-xs">
        {['Set project & experiment type', 'Choose a model & version', 'Send a message in Chat to run'].map((step, i) => (
          <div key={i} className="flex items-center gap-2.5 text-left">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-[#3F98FF] text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
            <span className="text-[11px] text-gray-500">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-7 h-7 text-[#3F98FF] animate-spin" />
      <div className="text-[12px] text-gray-500 font-medium">Running analysis…</div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#3F98FF] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}

function ResultTable({ config, onToggleRecipeVisibility, onToggleRecipeStar }: { config: TableConfig; onToggleRecipeVisibility?: (recipeId: string) => void; onToggleRecipeStar?: (recipeId: string) => void }) {
  const getAlignClass = (align?: 'left' | 'right' | 'center') => {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  };

  const isPinnedRow = (row: Record<string, any>) => {
    if (!config.pinnedValue) return false;
    return Object.values(row).some(value => String(value) === config.pinnedValue);
  };

  const renderCellValue = (value: any, column: ColumnDef, row: Record<string, any>) => {
    if (column.key === 'visible') {
      const recipeId = String(row.recipe ?? '');
      const visible = Boolean(value);
      return (
        <button
          type="button"
          onClick={() => recipeId && onToggleRecipeVisibility?.(recipeId)}
          className="inline-flex items-center justify-center w-full text-gray-500 hover:text-[#3F98FF] transition-colors"
          title={visible ? 'Hide on scatter' : 'Show on scatter'}
        >
          {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      );
    }

    if (column.key === 'starred') {
      const recipeId = String(row.recipe ?? '');
      const starred = Boolean(value);
      return (
        <button
          type="button"
          onClick={() => recipeId && onToggleRecipeStar?.(recipeId)}
          className={`inline-flex items-center justify-center w-full transition-colors ${starred ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-amber-500'}`}
          title={starred ? 'Unstar recipe' : 'Star recipe'}
        >
          <Star className={`w-3.5 h-3.5 ${starred ? 'fill-current' : ''}`} />
        </button>
      );
    }

    if (column.key === 'plotColor') {
      const color = typeof value === 'string' && value ? value : '#94a3b8';
      return (
        <span className="inline-flex items-center justify-center w-full">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        </span>
      );
    }

    if (column.badge) {
      const text = String(value);
      const isPass = text.toLowerCase().includes('pass');
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
          isPass ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {text}
        </span>
      );
    }

    if (column.trend) {
      const text = String(value);
      const isPositive = text.startsWith('+');
      const isNegative = text.startsWith('-');
      return (
        <span className={`${
          isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-500' : 'text-gray-700'
        } font-semibold`}>
          {text}
        </span>
      );
    }

    return <span>{value}</span>;
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="text-[12px] font-semibold text-gray-800">{config.title}</div>
        <div className="text-[10px] text-gray-400">{config.subtitle}</div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-[10px]">
          <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
            <tr>
              {config.columns.map(column => (
                <th
                  key={column.key}
                  className={`px-2.5 py-2 border-b border-gray-200 text-[9px] uppercase tracking-wide font-semibold text-gray-500 ${getAlignClass(column.align)}`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {config.rows.map((row, rowIndex) => {
              const pinned = isPinnedRow(row);
              return (
                <tr
                  key={rowIndex}
                  className={`${
                    pinned
                      ? 'bg-[#3F98FF]/8 hover:bg-[#3F98FF]/12'
                      : rowIndex % 2 === 0
                      ? 'bg-white hover:bg-gray-50/70'
                      : 'bg-gray-50/35 hover:bg-gray-50/70'
                  } transition-colors`}
                >
                  {config.columns.map(column => (
                    <td
                      key={`${rowIndex}-${column.key}`}
                      className={`px-2.5 py-2 border-b border-gray-100 text-gray-700 whitespace-nowrap ${getAlignClass(column.align)}`}
                    >
                      {renderCellValue(row[column.key], column, row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export function WorkspaceResults({ chart, table, displayMode = 'chart', isLoading, hasRun, stage, hiddenRecipeIds = [], onToggleRecipeVisibility, starredRecipeIds = [], onToggleRecipeStar }: WorkspaceResultsProps) {
  if (isLoading) {
    return <div className="h-full flex flex-col bg-[#f8f9fb]"><LoadingState /></div>;
  }

  if (!hasRun) {
    return <div className="h-full flex flex-col bg-[#f8f9fb]"><EmptyState /></div>;
  }

  if (displayMode === 'table') {
    if (!table) {
      return <div className="h-full flex flex-col bg-[#f8f9fb]"><EmptyState /></div>;
    }
    return <ResultTable config={table} onToggleRecipeVisibility={onToggleRecipeVisibility} onToggleRecipeStar={onToggleRecipeStar} />;
  }

  if (!chart) {
    return <div className="h-full flex flex-col bg-[#f8f9fb]"><EmptyState /></div>;
  }

  /* Stage 5 — full-screen scatter plot */
  if (stage === 5) {
    return (
      <div className="h-full flex flex-col bg-white overflow-hidden">
        <div className="shrink-0 px-4 pt-3 pb-1">
          <div className="text-[12px] font-semibold text-gray-800">{chart.title}</div>
          <div className="text-[10px] text-gray-400">{chart.subtitle}</div>
        </div>
        <div className="flex-1 min-h-0">
          <RecipeScatterPlot recipes={chart.data} hiddenRecipeIds={hiddenRecipeIds} starredRecipeIds={starredRecipeIds} />
        </div>
      </div>
    );
  }

  /* All other stages — full-screen chart */
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="shrink-0 px-4 pt-3 pb-1 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] font-semibold text-gray-800">{chart.title}</div>
            <div className="text-[10px] text-gray-400">{chart.subtitle}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#3F98FF] rounded-full animate-pulse" />
            <span className="text-[9px] font-semibold text-[#3F98FF] uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 px-4 py-3">
        <ResultChart config={chart} />
      </div>
    </div>
  );
}