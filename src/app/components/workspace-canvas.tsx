import React, { useState, useRef, useEffect } from 'react';
import { WorkspaceResults, ChartConfig, TableConfig, ResultChart } from './workspace-results';
import {
  ChevronDown, Zap, BarChart3, Target, FlaskConical,
  FileText, X, Maximize2, Minimize2, Package, Plus, Pencil, Sparkles, Table2, Database,
} from 'lucide-react';
import type { CanvasCard } from './artifact-canvas';
import type { LibraryArtifact } from './artifacts-library';
import { ArtifactPanelEmbed } from './artifacts-library';
import type { CustomChartConfig } from './chart-builder-modal';
import { resolveCustomChart } from './chart-builder-modal';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper to get panel label
function getPanelLabel(panel, libraryArtifacts, customCharts) {
  if (panel.startsWith('table:')) {
    // @ts-ignore
    return TABLE_VIEW_META[panel]?.label || panel;
  }
  if (panel.startsWith('artifact:')) {
    const id = panel.slice('artifact:'.length);
    const art = libraryArtifacts.find(a => a.id === id);
    return art ? art.name : panel;
  }
  if (panel.startsWith('custom:')) {
    const id = panel.slice('custom:'.length);
    return customCharts[id]?.name || 'Custom Chart';
  }
  // @ts-ignore
  return VIEW_META[panel]?.label || panel;
}

/* ── Types ──────────────────────────────────────────────────── */

export type ColumnCount = 1 | 2 | 3;
export type BasePanelView = 'live' | 'stage-2' | 'stage-3' | 'stage-4' | 'stage-5' | 'stage-6';
export type TablePanelView = `table:${BasePanelView}`;
export type PanelView = BasePanelView | TablePanelView | `artifact:${string}` | `custom:${string}`;

export interface StageResult { chart: ChartConfig; table: TableConfig }

export interface WorkspaceCanvasProps {
  columnCount:         ColumnCount;
  stageResults:        Record<number, StageResult>;
  currentStage:        number;
  isLoading:           boolean;
  hasRun:              boolean;
  liveActive:          boolean;
  panelViews:          PanelView[];
  onChangePanelView:   (idx: number, view: PanelView) => void;
  onAddPanel:          () => void;
  onRemovePanel:       (idx: number) => void;
  canvasCards:         CanvasCard[];
  onRemoveCard:        (id: string) => void;
  onUpdateCard:        (id: string, patch: Partial<CanvasCard>) => void;
  onClearAll:          () => void;
  libraryArtifacts:    LibraryArtifact[];
  onAddToCanvas:       (artifactId: string) => void;
  customCharts:        Record<string, CustomChartConfig>;
  onOpenChartBuilder:  (panelIdx: number, editingId?: string) => void;
  onRequestPanelChange?: (idx: number, panel: PanelView) => void;
}

/* ── View catalogue ─────────────────────────────────────────── */

export const VIEW_META: Record<string, { label: string; stage: number | null; icon: React.ReactNode; color: string }> = {
  'live':    { label: 'Live Result',       stage: null, icon: <Zap className="w-3 h-3" />,         color: '#3F98FF' },
  'stage-2': { label: 'Historical Data',   stage: 2,    icon: <Database className="w-3 h-3" />,     color: '#6366f1' },
  'stage-3': { label: 'Model Validation',  stage: 3,    icon: <BarChart3 className="w-3 h-3" />,    color: '#7c3aed' },
  'stage-4': { label: 'Pareto Front',      stage: 4,    icon: <Target className="w-3 h-3" />,       color: '#059669' },
  'stage-5': { label: 'Candidate Scatter', stage: 5,    icon: <FlaskConical className="w-3 h-3" />, color: '#f59e0b' },
  'stage-6': { label: 'Report Summary',    stage: 6,    icon: <FileText className="w-3 h-3" />,     color: '#ec4899' },
};

const ALL_VIEWS: BasePanelView[] = ['live', 'stage-2', 'stage-3', 'stage-4', 'stage-5', 'stage-6'];
const TABLE_VIEWS: TablePanelView[] = ALL_VIEWS.map(v => `table:${v}` as TablePanelView);

export const TABLE_VIEW_META: Record<TablePanelView, { label: string; source: BasePanelView }> = {
  'table:live': { label: 'Live Data Table', source: 'live' },
  'table:stage-2': { label: 'Historical Data Table', source: 'stage-2' },
  'table:stage-3': { label: 'Validation Table', source: 'stage-3' },
  'table:stage-4': { label: 'Pareto Table', source: 'stage-4' },
  'table:stage-5': { label: 'Recipes Table', source: 'stage-5' },
  'table:stage-6': { label: 'Report Data Table', source: 'stage-6' },
};

/* ── View-picker dropdown ───────────────────────────────────── */

function ViewPicker({
  value, idx, currentStage, hasRun, onChange, libraryArtifacts, customCharts,
}: {
  value: PanelView; idx: number; currentStage: number; hasRun: boolean;
  onChange: (v: PanelView) => void;
  libraryArtifacts: LibraryArtifact[];
  customCharts: Record<string, CustomChartConfig>;
}) {
  const [open, setOpen] = useState(false);
  const [artifactSearch, setArtifactSearch] = useState('');
  const isArtifact = value.startsWith('artifact:');
  const isTableView = value.startsWith('table:');
  const artifactId = isArtifact ? value.slice('artifact:'.length) : null;
  const selectedArt = artifactId ? libraryArtifacts.find(a => a.id === artifactId) : null;
  const tableMeta = isTableView ? TABLE_VIEW_META[value as TablePanelView] : null;
  const meta = (!isArtifact && !value.startsWith('custom:') && !isTableView)
    ? VIEW_META[value as BasePanelView]
    : null;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setArtifactSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isAvailable = (v: PanelView) => {
    if (v === 'live' || v.startsWith('artifact:') || v.startsWith('custom:')) return true;
    const sourceView: BasePanelView = v.startsWith('table:')
      ? (v.slice('table:'.length) as BasePanelView)
      : (v as BasePanelView);
    const stage = VIEW_META[sourceView]?.stage;
    if (stage === null || stage === undefined) return true;
    return hasRun && currentStage >= stage;
  };

  const filteredArtifacts = libraryArtifacts.filter(a =>
    a.name.toLowerCase().includes(artifactSearch.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-white/80 hover:text-white"
      >
        {isArtifact ? (
          <>
            <span style={{ color: '#f59e0b' }}><Package className="w-3 h-3" /></span>
            <span className="text-[11px] font-semibold truncate max-w-[120px]">{selectedArt?.name ?? 'Artifact'}</span>
          </>
        ) : value.startsWith('custom:') ? (
          <>
            <span style={{ color: '#f59e0b' }}><Sparkles className="w-3 h-3" /></span>
            <span className="text-[11px] font-semibold truncate max-w-[120px]">
              {customCharts[value.slice('custom:'.length)]?.name ?? 'Custom Chart'}
            </span>
          </>
        ) : isTableView ? (
          <>
            <span style={{ color: '#22c55e' }}><Table2 className="w-3 h-3" /></span>
            <span className="text-[11px] font-semibold truncate max-w-[120px]">
              {tableMeta?.label ?? 'Data Table'}
            </span>
          </>
        ) : (
          <>
            <span style={{ color: meta!.color }}>{meta!.icon}</span>
            <span className="text-[11px] font-semibold">{meta!.label}</span>
            {value === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-0.5" />}
          </>
        )}
        <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#1e2035] border border-white/10 rounded-lg shadow-2xl py-1 min-w-[220px] max-h-[380px] overflow-y-auto">
          {ALL_VIEWS.map(v => {
            const m = VIEW_META[v];
            const avail = isAvailable(v);
            return (
              <button
                key={v}
                disabled={!avail}
                onClick={() => { if (avail) { onChange(v); setOpen(false); setArtifactSearch(''); } }}
                className={`w-full text-left px-3 py-2 text-[11px] flex items-center gap-2.5 transition-colors ${
                  v === value
                    ? 'bg-white/10 text-white font-semibold'
                    : avail
                    ? 'text-white/70 hover:bg-white/8 hover:text-white font-medium'
                    : 'text-white/25 cursor-not-allowed font-medium'
                }`}
              >
                <span style={{ color: avail ? m.color : 'rgba(255,255,255,0.2)' }}>{m.icon}</span>
                <span className="flex-1">{m.label}</span>
                {v === value && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />}
                {!avail && <span className="text-[9px] text-white/25">Not run</span>}
                {v === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
              </button>
            );
          })}

          <div className="mx-2 my-1 border-t border-white/10" />
          <div className="px-3 py-1.5 flex items-center gap-1.5">
            <Table2 className="w-3 h-3 text-green-400" />
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Data Tables</span>
          </div>
          {TABLE_VIEWS.map(v => {
            const source = TABLE_VIEW_META[v].source;
            const avail = isAvailable(v);
            const isSelected = value === v;
            return (
              <button
                key={v}
                disabled={!avail}
                onClick={() => { if (avail) { onChange(v); setOpen(false); setArtifactSearch(''); } }}
                className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 transition-colors ${
                  isSelected
                    ? 'bg-white/10 text-white font-semibold'
                    : avail
                    ? 'text-white/70 hover:bg-white/8 hover:text-white font-medium'
                    : 'text-white/25 cursor-not-allowed font-medium'
                }`}
              >
                <span className="text-green-400 shrink-0"><Table2 className="w-3 h-3" /></span>
                <span className="flex-1">{TABLE_VIEW_META[v].label}</span>
                <span className="text-[9px] text-white/30 shrink-0">{source === 'live' ? 'Live' : `S${source.replace('stage-', '')}`}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />}
                {!avail && <span className="text-[9px] text-white/25">Not run</span>}
              </button>
            );
          })}

          {libraryArtifacts.length > 0 && (
            <>
              <div className="mx-2 my-1 border-t border-white/10" />
              <div className="px-3 py-1.5 flex items-center gap-1.5">
                <Package className="w-3 h-3 text-[#f59e0b]" />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">From Library</span>
              </div>
              <div className="px-2 pb-1">
                <input
                  type="text"
                  placeholder="Search artifacts…"
                  value={artifactSearch}
                  onChange={e => setArtifactSearch(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="w-full bg-white/8 border border-white/10 rounded-md px-2 py-1 text-[10px] text-white/70 placeholder-white/25 focus:outline-none focus:border-[#3F98FF]/60 focus:text-white"
                />
              </div>
              {filteredArtifacts.length === 0 && (
                <div className="px-3 py-2 text-[10px] text-white/30 italic">No matches</div>
              )}
              {filteredArtifacts.map(a => {
                const artifactView = `artifact:${a.id}` as PanelView;
                const isSelected = value === artifactView;
                return (
                  <button
                    key={a.id}
                    onClick={() => { onChange(artifactView); setOpen(false); setArtifactSearch(''); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 transition-colors ${
                      isSelected ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:bg-white/8 hover:text-white font-medium'
                    }`}
                  >
                    <span className="text-[#f59e0b] shrink-0"><Package className="w-3 h-3" /></span>
                    <span className="flex-1 truncate">{a.name}</span>
                    <span className="text-[9px] text-white/30 shrink-0">{a.category}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />}
                  </button>
                );
              })}
            </>
          )}

          {Object.keys(customCharts).length > 0 && (
            <>
              <div className="mx-2 my-1 border-t border-white/10" />
              <div className="px-3 py-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#f59e0b]" />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Custom Charts</span>
              </div>
              {Object.keys(customCharts).map(id => {
                const chartView = `custom:${id}` as PanelView;
                const isSelected = value === chartView;
                return (
                  <button
                    key={id}
                    onClick={() => { onChange(chartView); setOpen(false); setArtifactSearch(''); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 transition-colors ${
                      isSelected ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:bg-white/8 hover:text-white font-medium'
                    }`}
                  >
                    <span className="text-[#f59e0b] shrink-0"><Sparkles className="w-3 h-3" /></span>
                    <span className="flex-1 truncate">{customCharts[id].name}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Resolve props for a panel ──────────────────────────────── */

function resolvePanel(
  view: PanelView,
  stageResults: Record<number, StageResult>,
  currentStage: number,
  isLoading: boolean,
  hasRun: boolean,
  customCharts: Record<string, CustomChartConfig>,
  liveActive: boolean,
): { chart: ChartConfig | null; table: TableConfig | null; isLoading: boolean; hasRun: boolean; stage: number } {
  const sourceView: BasePanelView = view.startsWith('table:')
    ? (view.slice('table:'.length) as BasePanelView)
    : (view as BasePanelView);

  if (sourceView === 'live') {
    return { chart: stageResults[currentStage]?.chart ?? null, table: stageResults[currentStage]?.table ?? null, isLoading, hasRun, stage: currentStage };
  }
  const stageNum = VIEW_META[sourceView].stage!;
  // A stage panel is reachable if: demo has run past it, OR liveActive and we have data for it
  const reached  = (hasRun && currentStage >= stageNum) || (liveActive && !!stageResults[stageNum]);
  return {
    chart:     reached ? (stageResults[stageNum]?.chart ?? null) : null,
    table:     reached ? (stageResults[stageNum]?.table ?? null) : null,
    isLoading: false,
    hasRun:    reached,
    stage:     stageNum,
  };
}

/* ── Panel frame ─────────────────────────────────────────────── */

function PanelFrame({
  view, idx, currentStage, isLoading, hasRun, liveActive, stageResults,
  onChangeView, canRemove, onRemove,
  canvasCards, onRemoveCard, onUpdateCard, onClearAll,
  libraryArtifacts, onAddToCanvas,
  customCharts, onOpenChartBuilder,
}: {
  view: PanelView; idx: number; currentStage: number;
  isLoading: boolean; hasRun: boolean; liveActive: boolean;
  stageResults: Record<number, StageResult>;
  onChangeView: (v: PanelView) => void;
  canRemove: boolean;
  onRemove: () => void;
  canvasCards: CanvasCard[];
  onRemoveCard: (id: string) => void;
  onUpdateCard: (id: string, patch: Partial<CanvasCard>) => void;
  onClearAll: () => void;
  libraryArtifacts: LibraryArtifact[];
  onAddToCanvas: (artifactId: string) => void;
  customCharts: Record<string, CustomChartConfig>;
  onOpenChartBuilder: (panelIdx: number, editingId?: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isArtifactView = view.startsWith('artifact:');
  const isCustomView   = view.startsWith('custom:');
  const isTableView    = view.startsWith('table:');
  const artifactId = isArtifactView ? view.slice('artifact:'.length) : null;
  const customChartId  = isCustomView  ? view.slice('custom:'.length)   : null;
  const embeddedArtifact = artifactId ? libraryArtifacts.find(a => a.id === artifactId) ?? null : null;
  const panelProps = (!isArtifactView && !isCustomView) ? resolvePanel(view, stageResults, currentStage, isLoading, hasRun, customCharts, liveActive) : null;

  // Resolve custom chart
  const customCfg      = customChartId ? customCharts[customChartId] : null;
  const resolvedCustom = customCfg ? resolveCustomChart(customCfg, stageResults, currentStage, hasRun) : null;

  return (
    <div
      className={`flex flex-col overflow-hidden bg-white border border-white/[0.06] ${
        isExpanded ? 'fixed inset-4 z-[100] rounded-xl shadow-2xl' : 'h-full'
      }`}
    >
      {/* Header bar */}
      <div className="shrink-0 h-8 bg-[#1a1a2e] border-b border-white/[0.06] flex items-center px-2 gap-1">
        <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/40 shrink-0">
          {idx + 1}
        </span>


        {/* Panel name and change button */}
        <span className="text-[11px] font-semibold text-white/90 truncate max-w-[120px]">
          {getPanelLabel(view, libraryArtifacts, customCharts)}
        </span>
        <button
          className="ml-2 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-white/70 border border-white/10"
          onClick={() => {
            if (typeof onRequestPanelChange === 'function') onRequestPanelChange(idx, view);
          }}
          title="Change panel"
        >
          Change
        </button>

        <div className="flex-1" />

        {/* Expand toggle */}
        <button
          onClick={() => setIsExpanded(v => !v)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
          title={isExpanded ? 'Restore' : 'Expand panel'}
        >
          {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>

        {/* Remove panel */}
        {canRemove && (
          <button
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
            title="Remove panel"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isArtifactView ? (
          embeddedArtifact ? (
            <ArtifactPanelEmbed artifact={embeddedArtifact} isExpanded={isExpanded} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-6">
              <Package className="w-6 h-6 text-gray-300" />
              <div className="text-[11px] text-gray-400">Artifact not found in library</div>
            </div>
          )
        ) : isCustomView ? (
          resolvedCustom ? (
            <div className="h-full flex flex-col bg-white overflow-hidden">
              {/* Custom chart header */}
              <div className="shrink-0 px-4 pt-3 pb-1 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-semibold text-gray-800">{resolvedCustom.title}</div>
                    <div className="text-[10px] text-gray-400">{resolvedCustom.subtitle}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenChartBuilder(idx, customChartId!)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#3F98FF]/8 hover:bg-[#3F98FF]/15 text-[#3F98FF] transition-colors"
                      title="Edit chart"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-semibold uppercase tracking-wider">Edit</span>
                    </button>
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    <span className="text-[9px] font-semibold text-amber-500 uppercase tracking-wider">Custom</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0 px-4 py-3">
                <ResultChart config={resolvedCustom} />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6 bg-white">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-gray-600 mb-1">
                  {customCfg ? 'Data not available yet' : 'Custom chart not found'}
                </div>
                <p className="text-[10px] text-gray-400 max-w-[180px] leading-relaxed">
                  {customCfg
                    ? `This chart needs Stage ${customCfg.dataSource === 'live' ? 'results' : customCfg.dataSource.replace('stage-', '')} data. Advance the analysis to unlock it.`
                    : 'The chart configuration may have been removed.'}
                </p>
              </div>
              {customCfg && (
                <button
                  onClick={() => onOpenChartBuilder(idx, customChartId!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3F98FF]/10 hover:bg-[#3F98FF]/20 text-[#3F98FF] rounded-lg text-[11px] font-semibold transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit chart
                </button>
              )}
            </div>
          )
        ) : (
          <WorkspaceResults
            chart={panelProps!.chart}
            table={panelProps!.table}
            displayMode={isTableView ? 'table' : 'chart'}
            isLoading={panelProps!.isLoading}
            hasRun={panelProps!.hasRun}
            stage={panelProps!.stage}
            canvasCards={canvasCards}
            onRemoveCard={onRemoveCard}
            onUpdateCard={onUpdateCard}
            onClearAll={onClearAll}
            libraryArtifacts={libraryArtifacts}
            onAddToCanvas={onAddToCanvas}
          />
        )}
      </div>
    </div>
  );
}

/* ── Add-panel ghost cell ────────────────────────────────────── */

function AddPanelCell({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-full min-h-[220px] flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-[#3F98FF]/50 hover:bg-[#3F98FF]/5 rounded-sm transition-all group"
    >
      <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#3F98FF]/20 flex items-center justify-center transition-colors">
        <Plus className="w-4 h-4 text-white/30 group-hover:text-[#3F98FF] transition-colors" />
      </div>
      <span className="text-[11px] text-white/25 group-hover:text-[#3F98FF]/70 font-medium transition-colors">Add panel</span>
    </button>
  );
}

/* ── Main canvas ─────────────────────────────────────────────── */

export function WorkspaceCanvas({
  columnCount, stageResults, currentStage, isLoading, hasRun, liveActive,
  panelViews, onChangePanelView, onAddPanel, onRemovePanel,
  canvasCards, onRemoveCard, onUpdateCard, onClearAll,
  libraryArtifacts, onAddToCanvas,
  customCharts, onOpenChartBuilder,
}: WorkspaceCanvasProps) {
  const canRemove = panelViews.length > 1;

  // Calculate rows based only on actual panels (no ghost cell)
  const rows = Math.ceil(panelViews.length / columnCount);

  // Row height: if panels fit in one row use 100%, else min 420px
  const rowHeight = rows === 1 ? '100%' : `max(420px, calc(${100 / rows}% - ${(rows - 1) * 4 / rows}px))`;

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = Number(active.id);
      const newIndex = Number(over.id);
      // Use a special action for reordering
      onChangePanelView && onChangePanelView('reorder', arrayMove(panelViews, oldIndex, newIndex));
    }
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden"
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={panelViews.map((_, idx) => idx.toString())} strategy={verticalListSortingStrategy}>
          <div
            className="min-h-full p-1 gap-1"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              gridAutoRows: rowHeight,
            }}
          >
            {panelViews.map((view, idx) => (
              <SortablePanelFrame
                key={idx}
                id={idx.toString()}
                idx={idx}
                view={view}
                currentStage={currentStage}
                isLoading={isLoading}
                hasRun={hasRun}
                liveActive={liveActive}
                stageResults={stageResults}
                onChangeView={v => onChangePanelView(idx, v)}
                canRemove={canRemove}
                onRemove={() => onRemovePanel(idx)}
                canvasCards={canvasCards}
                onRemoveCard={onRemoveCard}
                onUpdateCard={onUpdateCard}
                onClearAll={onClearAll}
                libraryArtifacts={libraryArtifacts}
                onAddToCanvas={onAddToCanvas}
                customCharts={customCharts}
                onOpenChartBuilder={onOpenChartBuilder}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/* ── Layout / column toggle (exported for titlebar) ──────────── */

export function LayoutToggle({
  value,
  onChange,
  panelCount,
  onAddPanel,
}: {
  value: ColumnCount;
  onChange: (c: ColumnCount) => void;
  panelCount: number;
  onAddPanel: () => void;
}) {
  const cols: { key: ColumnCount; title: string; icon: React.ReactNode }[] = [
    {
      key: 1,
      title: '1 column',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="1" width="10" height="12" rx="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      key: 2,
      title: '2 columns',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1"   y="1" width="5.5" height="12" rx="1.5" fill="currentColor" />
          <rect x="7.5" y="1" width="5.5" height="12" rx="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      key: 3,
      title: '3 columns',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1"   y="1" width="3.5" height="12" rx="1" fill="currentColor" />
          <rect x="5.25" y="1" width="3.5" height="12" rx="1" fill="currentColor" />
          <rect x="9.5" y="1" width="3.5" height="12" rx="1" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {/* Column picker */}
      <div className="flex items-center gap-0.5 bg-white/5 rounded-md p-0.5">
        {cols.map(c => (
          <button
            key={c.key}
            title={c.title}
            onClick={() => onChange(c.key)}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              value === c.key
                ? 'bg-[#3F98FF] text-white shadow-sm'
                : 'text-white/40 hover:text-white/70 hover:bg-white/10'
            }`}
          >
            {c.icon}
          </button>
        ))}
      </div>

      {/* Panel count badge + add button */}
      <div className="flex items-center gap-1 bg-white/5 rounded-md px-1.5 py-0.5">
        <span className="text-[10px] text-white/40 font-mono">{panelCount}</span>
        <button
          onClick={onAddPanel}
          title="Add panel"
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#3F98FF]/30 text-white/40 hover:text-[#3F98FF] transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// Sortable wrapper for PanelFrame
function SortablePanelFrame(props: any) {
  const { id, idx, ...rest } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: { idx } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PanelFrame idx={idx} {...rest} />
    </div>
  );
}