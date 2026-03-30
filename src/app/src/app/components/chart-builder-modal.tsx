import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X, BarChart2, TrendingUp, Activity,
  Zap, Lock, Check, Plus, Minus, Sparkles,
} from 'lucide-react';
import { ResultChart } from './workspace-results';
import type { ChartConfig, TableConfig } from './workspace-results';

/* ── Types ──────────────────────────────────────────────────── */

export interface CustomChartConfig {
  id: string;
  name: string;
  chartType: 'bar' | 'line' | 'area';
  dataSource: 'live' | 'stage-3' | 'stage-4' | 'stage-5' | 'stage-6';
  selectedYKeys: string[];
  referenceValue?: number;
  referenceLabel?: string;
}

type DataSourceKey = 'stage-3' | 'stage-4' | 'stage-5' | 'stage-6';

/* ── Static field metadata per data source ───────────────────── */

export const DATASOURCE_FIELDS: Record<DataSourceKey, {
  label: string;
  stage: number;
  xKey: string;
  xLabel: string;
  yOptions: { key: string; name: string; color: string }[];
}> = {
  'stage-3': {
    label: 'Model Validation',
    stage: 3,
    xKey: 'formula',
    xLabel: 'Formula ID',
    yOptions: [
      { key: 'actual',    name: 'Actual SPF',    color: '#94a3b8' },
      { key: 'predicted', name: 'Predicted SPF',  color: '#3F98FF' },
    ],
  },
  'stage-4': {
    label: 'Pareto Front',
    stage: 4,
    xKey: 'id',
    xLabel: 'Candidate ID',
    yOptions: [
      { key: 'spf',       name: 'Predicted SPF',     color: '#3F98FF' },
      { key: 'wr',        name: 'Water Resistance %', color: '#7c3aed' },
      { key: 'stability', name: 'Stability %',        color: '#059669' },
    ],
  },
  'stage-5': {
    label: 'Top Recipes',
    stage: 5,
    xKey: 'recipe',
    xLabel: 'Recipe',
    yOptions: [
      { key: 'spf',       name: 'Predicted SPF',     color: '#3F98FF' },
      { key: 'wr',        name: 'Water Resistance %', color: '#7c3aed' },
      { key: 'stability', name: 'Stability %',        color: '#059669' },
    ],
  },
  'stage-6': {
    label: 'Report Summary',
    stage: 6,
    xKey: 'objective',
    xLabel: 'Objective',
    yOptions: [
      { key: 'achieved',  name: 'R-047 Achieved', color: '#3F98FF' },
      { key: 'target',    name: 'Target',          color: '#059669' },
      { key: 'baseline',  name: 'Baseline',        color: '#94a3b8' },
    ],
  },
};

/* ── Resolve custom chart config → ChartConfig ───────────────── */

export function resolveCustomChart(
  cfg: CustomChartConfig,
  stageResults: Record<number, { chart: ChartConfig; table: TableConfig }>,
  currentStage: number,
  hasRun: boolean,
): ChartConfig | null {
  if (!hasRun) return null;

  let data: any[];
  let xKey: string;
  let availableY: { key: string; name: string; color: string }[];
  let subtitle: string;

  if (cfg.dataSource === 'live') {
    const liveChart = stageResults[currentStage]?.chart;
    if (!liveChart) return null;
    data = liveChart.data;
    xKey = liveChart.xAxisKey;
    availableY = liveChart.yAxisKeys;
    subtitle = `Live · Stage ${currentStage} data`;
  } else {
    const meta = DATASOURCE_FIELDS[cfg.dataSource as DataSourceKey];
    if (!meta) return null;
    if (currentStage < meta.stage) return null;
    const srcChart = stageResults[meta.stage]?.chart;
    if (!srcChart) return null;
    data = srcChart.data;
    xKey = meta.xKey;
    availableY = meta.yOptions;
    subtitle = `${meta.label} · Custom chart`;
  }

  const selectedKeys = cfg.selectedYKeys.filter(k => availableY.some(y => y.key === k));
  const yAxisKeys = selectedKeys.length > 0
    ? selectedKeys.map(k => availableY.find(y => y.key === k)!)
    : availableY;

  return {
    title: cfg.name,
    subtitle,
    type: cfg.chartType,
    data,
    xAxisKey: xKey,
    yAxisKeys,
    referenceLines: cfg.referenceValue != null ? [{
      y: cfg.referenceValue,
      label: cfg.referenceLabel || `Ref: ${cfg.referenceValue}`,
      color: '#059669',
    }] : undefined,
  };
}

/* ── Helper: get Y options for a data source + current live stage */

function getYOptions(
  dataSource: string,
  currentStage: number,
  stageResults: Record<number, { chart: ChartConfig; table: TableConfig }>,
): { key: string; name: string; color: string }[] {
  if (dataSource === 'live') {
    const liveChart = stageResults[currentStage]?.chart;
    return liveChart?.yAxisKeys ?? [];
  }
  return DATASOURCE_FIELDS[dataSource as DataSourceKey]?.yOptions ?? [];
}

/* ── Chart type picker ───────────────────────────────────────── */

const CHART_TYPES = [
  { key: 'bar',  label: 'Bar',  icon: <BarChart2 className="w-4 h-4" /> },
  { key: 'line', label: 'Line', icon: <TrendingUp className="w-4 h-4" /> },
  { key: 'area', label: 'Area', icon: <Activity className="w-4 h-4" /> },
] as const;

/* ── Data source options ─────────────────────────────────────── */

const DATA_SOURCES: { key: string; label: string; stage: number | null; icon: React.ReactNode }[] = [
  { key: 'live',    label: 'Live (current stage)', stage: null, icon: <Zap className="w-3.5 h-3.5 text-[#3F98FF]" /> },
  { key: 'stage-3', label: 'Model Validation',    stage: 3,    icon: <BarChart2 className="w-3.5 h-3.5 text-[#7c3aed]" /> },
  { key: 'stage-4', label: 'Pareto Front',        stage: 4,    icon: <BarChart2 className="w-3.5 h-3.5 text-[#059669]" /> },
  { key: 'stage-5', label: 'Top Recipes',         stage: 5,    icon: <BarChart2 className="w-3.5 h-3.5 text-[#f59e0b]" /> },
  { key: 'stage-6', label: 'Report Summary',      stage: 6,    icon: <BarChart2 className="w-3.5 h-3.5 text-[#ec4899]" /> },
];

/* ── Modal component ─────────────────────────────────────────── */

interface ChartBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cfg: CustomChartConfig) => void;
  currentStage: number;
  hasRun: boolean;
  stageResults: Record<number, { chart: ChartConfig; table: TableConfig }>;
  editingConfig?: CustomChartConfig | null;
}

export function ChartBuilderModal({
  isOpen, onClose, onSave,
  currentStage, hasRun, stageResults,
  editingConfig,
}: ChartBuilderModalProps) {
  const isEditing = !!editingConfig;

  const [name,       setName]       = useState('');
  const [chartType,  setChartType]  = useState<'bar' | 'line' | 'area'>('bar');
  const [dataSource, setDataSource] = useState<string>('live');
  const [selectedY,  setSelectedY]  = useState<string[]>([]);
  const [showRef,    setShowRef]    = useState(false);
  const [refValue,   setRefValue]   = useState<string>('');
  const [refLabel,   setRefLabel]   = useState<string>('');

  /* Reset form when opening */
  useEffect(() => {
    if (!isOpen) return;
    if (editingConfig) {
      setName(editingConfig.name);
      setChartType(editingConfig.chartType);
      setDataSource(editingConfig.dataSource);
      setSelectedY(editingConfig.selectedYKeys);
      setShowRef(editingConfig.referenceValue != null);
      setRefValue(editingConfig.referenceValue != null ? String(editingConfig.referenceValue) : '');
      setRefLabel(editingConfig.referenceLabel ?? '');
    } else {
      setName('');
      setChartType('bar');
      setDataSource('live');
      setSelectedY([]);
      setShowRef(false);
      setRefValue('');
      setRefLabel('');
    }
  }, [isOpen, editingConfig]);

  /* Reset Y selection when data source changes */
  const prevSource = useRef(dataSource);
  useEffect(() => {
    if (prevSource.current !== dataSource && !editingConfig) {
      setSelectedY([]);
    }
    prevSource.current = dataSource;
  }, [dataSource, editingConfig]);

  const yOptions = useMemo(
    () => getYOptions(dataSource, currentStage, stageResults),
    [dataSource, currentStage, stageResults],
  );

  /* Toggle Y key */
  const toggleY = (key: string) => {
    setSelectedY(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    );
  };

  /* Is data source available? */
  const isSourceAvailable = (src: typeof DATA_SOURCES[0]) => {
    if (src.stage === null) return hasRun;
    return hasRun && currentStage >= src.stage;
  };

  /* Build preview config */
  const previewConfig = useMemo((): ChartConfig | null => {
    if (!hasRun) return null;
    const fakeCfg: CustomChartConfig = {
      id: 'preview',
      name: name || 'Preview',
      chartType,
      dataSource: dataSource as CustomChartConfig['dataSource'],
      selectedYKeys: selectedY,
      referenceValue: showRef && refValue ? parseFloat(refValue) : undefined,
      referenceLabel: refLabel || undefined,
    };
    return resolveCustomChart(fakeCfg, stageResults, currentStage, hasRun);
  }, [name, chartType, dataSource, selectedY, showRef, refValue, refLabel, stageResults, currentStage, hasRun]);

  const canSave = name.trim().length > 0 && yOptions.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const cfg: CustomChartConfig = {
      id: editingConfig?.id ?? `custom-${Date.now()}`,
      name: name.trim(),
      chartType,
      dataSource: dataSource as CustomChartConfig['dataSource'],
      selectedYKeys: selectedY,
      referenceValue: showRef && refValue ? parseFloat(refValue) : undefined,
      referenceLabel: showRef && refLabel ? refLabel : undefined,
    };
    onSave(cfg);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[860px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '88vh' }}>

        {/* Header */}
        <div className="shrink-0 px-6 py-4 bg-gradient-to-r from-[#0f1629] to-[#1a1a2e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#3F98FF] to-[#7c3aed] rounded-lg flex items-center justify-center shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {isEditing ? 'Edit Custom Chart' : 'Build Custom Chart'}
              </h2>
              <p className="text-[11px] text-white/50">Synced to live workspace results</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: two-column */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Left: Config ───────────────────────────────────── */}
          <div className="w-[340px] shrink-0 flex flex-col overflow-y-auto border-r border-gray-100 bg-gray-50/40">
            <div className="p-5 space-y-5">

              {/* Chart name */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Chart Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. SPF vs Stability Comparison"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF] bg-white placeholder-gray-300 transition-colors"
                />
              </div>

              {/* Chart type */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Chart Type
                </label>
                <div className="flex gap-2">
                  {CHART_TYPES.map(ct => (
                    <button
                      key={ct.key}
                      onClick={() => setChartType(ct.key)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-[11px] font-semibold transition-all ${
                        chartType === ct.key
                          ? 'border-[#3F98FF] bg-[#3F98FF]/8 text-[#3F98FF] shadow-sm'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {ct.icon}
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data source */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Data Source
                </label>
                <div className="space-y-1">
                  {DATA_SOURCES.map(src => {
                    const avail = isSourceAvailable(src);
                    return (
                      <button
                        key={src.key}
                        disabled={!avail}
                        onClick={() => avail && setDataSource(src.key)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all border ${
                          dataSource === src.key
                            ? 'border-[#3F98FF] bg-[#3F98FF]/8 text-[#3F98FF]'
                            : avail
                            ? 'border-transparent bg-white hover:border-gray-200 text-gray-700 hover:text-gray-900'
                            : 'border-transparent bg-white/50 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {src.icon}
                        <span className="flex-1 text-left">{src.label}</span>
                        {src.key === 'live' && avail && (
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        )}
                        {!avail && <Lock className="w-3 h-3 text-gray-300" />}
                        {dataSource === src.key && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
                {dataSource === 'live' && (
                  <p className="mt-1.5 text-[10px] text-[#3F98FF]/70 leading-relaxed">
                    Live charts update automatically as you advance through analysis stages.
                  </p>
                )}
              </div>

              {/* Y-axis series */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Series to Plot
                  <span className="ml-1 font-normal text-gray-400">(select one or more)</span>
                </label>
                {yOptions.length === 0 ? (
                  <div className="text-[11px] text-gray-400 italic py-2 px-3 bg-gray-100 rounded-lg">
                    {hasRun ? 'No data for this source yet' : 'Run analysis first to see available series'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {yOptions.map(opt => {
                      const active = selectedY.includes(opt.key);
                      return (
                        <button
                          key={opt.key}
                          onClick={() => toggleY(opt.key)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all border ${
                            active
                              ? 'border-transparent'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                          style={active ? {
                            backgroundColor: `${opt.color}12`,
                            borderColor: `${opt.color}50`,
                            color: opt.color,
                          } : {}}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0 flex items-center justify-center border-2"
                            style={{
                              backgroundColor: active ? opt.color : 'transparent',
                              borderColor: active ? opt.color : '#d1d5db',
                            }}
                          >
                            {active && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
                          </span>
                          <span
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{ backgroundColor: opt.color }}
                          />
                          <span className="flex-1 text-left">{opt.name}</span>
                        </button>
                      );
                    })}
                    <div className="pt-1 flex gap-1.5">
                      <button
                        onClick={() => setSelectedY(yOptions.map(o => o.key))}
                        className="text-[10px] text-gray-400 hover:text-[#3F98FF] underline transition-colors"
                      >
                        Select all
                      </button>
                      <span className="text-gray-200">·</span>
                      <button
                        onClick={() => setSelectedY([])}
                        className="text-[10px] text-gray-400 hover:text-gray-600 underline transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reference line */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    Reference Line
                  </label>
                  <button
                    onClick={() => setShowRef(v => !v)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                      showRef
                        ? 'bg-[#059669]/10 text-[#059669] border border-[#059669]/30'
                        : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {showRef ? <Minus className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                    {showRef ? 'Remove' : 'Add'}
                  </button>
                </div>
                {showRef && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 mb-0.5 block">Value</label>
                      <input
                        type="number"
                        value={refValue}
                        onChange={e => setRefValue(e.target.value)}
                        placeholder="e.g. 50"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] bg-white"
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="text-[10px] text-gray-400 mb-0.5 block">Label</label>
                      <input
                        type="text"
                        value={refLabel}
                        onChange={e => setRefLabel(e.target.value)}
                        placeholder="e.g. Target ≥50"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Preview ─────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col bg-white overflow-hidden">
            {/* Preview header */}
            <div className="shrink-0 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-gray-700">
                  {name || <span className="text-gray-300 italic">Untitled chart</span>}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {previewConfig ? previewConfig.subtitle : 'Configure chart to see preview'}
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#3F98FF]/8 border border-[#3F98FF]/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-[#3F98FF] rounded-full" />
                <span className="text-[9px] font-semibold text-[#3F98FF] uppercase tracking-wider">Preview</span>
              </div>
            </div>

            {/* Chart area */}
            <div className="flex-1 min-h-0 px-5 py-4">
              {previewConfig ? (
                <ResultChart config={previewConfig} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3F98FF]/10 to-[#7c3aed]/10 border border-[#3F98FF]/15 flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-[#3F98FF]/50" />
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-gray-400 mb-1">No preview yet</div>
                    <p className="text-[10px] text-gray-300 max-w-[200px] leading-relaxed">
                      {!hasRun
                        ? 'Run the AI analysis first to unlock chart data'
                        : 'Select a data source and series to see a live preview'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Series legend */}
            {previewConfig && previewConfig.yAxisKeys.length > 0 && (
              <div className="shrink-0 px-5 pb-3 flex items-center gap-3 flex-wrap">
                {previewConfig.yAxisKeys.map(yk => (
                  <div key={yk.key} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: yk.color }} />
                    <span className="text-[10px] text-gray-500">{yk.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-3.5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3">
          <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#3F98FF]" />
            Chart auto-updates when live results change
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-[12px] font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`px-5 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                canSave
                  ? 'bg-[#3F98FF] hover:bg-[#2563eb] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              {isEditing ? 'Update Chart' : 'Add to Canvas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}