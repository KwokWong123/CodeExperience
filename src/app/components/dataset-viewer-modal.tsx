import { useState } from 'react';
import {
  X, Database, TableIcon, List, BarChart2,
  CheckCircle2, AlertCircle, Clock, Download, ExternalLink,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────── */

export interface SchemaColumn {
  name: string;
  type: 'float' | 'integer' | 'string' | 'categorical' | 'boolean';
  role: 'Input' | 'Output' | 'ID' | 'Metadata';
  completeness: number;
  sample: string;
  min?: string;
  max?: string;
  unique?: number;
}

export interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  rows: number;
  columns: number;
  sizeMB: number;
  quality: number;
  source: string;
  format: string;
  lastUpdated: string;
  project: string;
  status: 'ready' | 'processing' | 'warning';
  schema: SchemaColumn[];
  preview: Record<string, string | number>[];
  qualityBreakdown: { label: string; value: number; color: string }[];
  tags: string[];
}

interface DatasetViewerModalProps {
  dataset: DatasetInfo;
  modelName: string;
  modelVersion: string;
  onClose: () => void;
}

/* ── Helpers ─────────────────────────────────────────────────── */

const TYPE_COLOR: Record<string, string> = {
  float:       'bg-blue-50 text-[#3F98FF]',
  integer:     'bg-purple-50 text-purple-600',
  string:      'bg-gray-100 text-gray-600',
  categorical: 'bg-amber-50 text-amber-600',
  boolean:     'bg-pink-50 text-pink-600',
};

const ROLE_COLOR: Record<string, string> = {
  Input:    'bg-[#3F98FF]/10 text-[#3F98FF]',
  Output:   'bg-green-50 text-green-700',
  ID:       'bg-gray-100 text-gray-500',
  Metadata: 'bg-gray-50 text-gray-400',
};

const STATUS_CFG = {
  ready:      { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-green-600', label: 'Ready' },
  processing: { icon: <Clock className="w-3 h-3" />,        color: 'text-amber-500', label: 'Processing' },
  warning:    { icon: <AlertCircle className="w-3 h-3" />,  color: 'text-red-500',   label: 'Warning' },
};

function CompletenessBar({ value }: { value: number }) {
  const color = value >= 98 ? '#059669' : value >= 90 ? '#3F98FF' : value >= 75 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-[9px] font-semibold shrink-0" style={{ color }}>{value.toFixed(0)}%</span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export function DatasetViewerModal({ dataset, modelName, modelVersion, onClose }: DatasetViewerModalProps) {
  const [tab, setTab] = useState<'schema' | 'preview' | 'quality'>('schema');

  const previewCols = dataset.preview.length > 0 ? Object.keys(dataset.preview[0]) : [];
  const statusCfg = STATUS_CFG[dataset.status];

  const inputs   = dataset.schema.filter((c) => c.role === 'Input');
  const outputs  = dataset.schema.filter((c) => c.role === 'Output');
  const other    = dataset.schema.filter((c) => c.role !== 'Input' && c.role !== 'Output');

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-3xl"
           style={{ maxHeight: '88vh' }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#3F98FF]/5 to-transparent shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#3F98FF]/10 border border-[#3F98FF]/20 flex items-center justify-center shrink-0">
                <Database className="w-4.5 h-4.5 text-[#3F98FF]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-gray-900 leading-tight">{dataset.name}</h2>
                  <span className={`flex items-center gap-1 text-[9px] font-semibold ${statusCfg.color}`}>
                    {statusCfg.icon}{statusCfg.label}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Training dataset for <span className="font-semibold text-gray-600">{modelName} {modelVersion}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-3 h-3" />
                Export
              </button>
              <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-[#3F98FF] border border-[#3F98FF]/30 rounded-lg hover:bg-blue-50 transition-colors">
                <ExternalLink className="w-3 h-3" />
                Open
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {[
              { label: 'Rows',     value: dataset.rows.toLocaleString() },
              { label: 'Columns', value: dataset.columns },
              { label: 'Size',    value: `${dataset.sizeMB} MB` },
              { label: 'Source',  value: dataset.source },
              { label: 'Format',  value: dataset.format },
              { label: 'Updated', value: dataset.lastUpdated },
            ].map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">{s.label}</span>
                <span className="text-[11px] font-semibold text-gray-700">{s.value}</span>
              </div>
            ))}
            <div className="ml-auto flex flex-col items-end">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Quality Score</span>
              <span className="text-[11px] font-bold" style={{ color: dataset.quality >= 97 ? '#059669' : dataset.quality >= 90 ? '#3F98FF' : '#f59e0b' }}>
                {dataset.quality}%
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed line-clamp-2">{dataset.description}</p>

          {/* Tags */}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {dataset.tags.map((t) => (
              <span key={t} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{t}</span>
            ))}
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────── */}
        <div className="flex border-b border-gray-100 shrink-0 bg-white">
          {([
            { id: 'schema',  label: 'Schema',       icon: <List className="w-3 h-3" />      },
            { id: 'preview', label: 'Data Preview',  icon: <TableIcon className="w-3 h-3" /> },
            { id: 'quality', label: 'Data Quality',  icon: <BarChart2 className="w-3 h-3" /> },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold transition-colors ${
                tab === t.id
                  ? 'text-[#3F98FF] border-b-2 border-[#3F98FF] bg-blue-50/30'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── Tab body ────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden">

          {/* Schema tab */}
          {tab === 'schema' && (
            <div className="h-full overflow-y-auto">
              {/* Summary pills */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex-wrap">
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Feature split:</span>
                {[
                  { label: `${inputs.length} Inputs`,   color: 'bg-[#3F98FF]/10 text-[#3F98FF]'  },
                  { label: `${outputs.length} Outputs`, color: 'bg-green-50 text-green-700'       },
                  { label: `${other.length} Other`,     color: 'bg-gray-100 text-gray-500'        },
                ].map((p) => (
                  <span key={p.label} className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${p.color}`}>{p.label}</span>
                ))}
              </div>

              <table className="w-full text-[11px]">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Column', 'Type', 'Role', 'Range / Unique', 'Sample', 'Completeness'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataset.schema.map((col, i) => (
                    <tr
                      key={col.name}
                      className={`border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                        col.role === 'Output' ? 'bg-green-50/30' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <td className="px-3 py-2 font-mono font-semibold text-gray-800 whitespace-nowrap">{col.name}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${TYPE_COLOR[col.type] || 'bg-gray-100 text-gray-500'}`}>
                          {col.type}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${ROLE_COLOR[col.role]}`}>
                          {col.role}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-[10px] whitespace-nowrap">
                        {col.unique !== undefined
                          ? `${col.unique} categories`
                          : col.min !== undefined && col.max !== undefined
                          ? `${col.min} – ${col.max}`
                          : '—'}
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-600 text-[10px]">{col.sample}</td>
                      <td className="px-3 py-2">
                        <CompletenessBar value={col.completeness} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Preview tab */}
          {tab === 'preview' && (
            <div className="h-full flex flex-col">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 shrink-0 flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Showing first {dataset.preview.length} rows of {dataset.rows.toLocaleString()}</span>
                <span className="text-[9px] bg-[#3F98FF]/10 text-[#3F98FF] font-semibold px-1.5 py-0.5 rounded ml-auto">
                  {previewCols.length} columns shown
                </span>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-[11px]" style={{ minWidth: previewCols.length * 110 }}>
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap w-8">#</th>
                      {previewCols.map((col) => {
                        const schemaCol = dataset.schema.find((s) => s.name === col);
                        return (
                          <th key={col} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {col}
                              {schemaCol && (
                                <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${ROLE_COLOR[schemaCol.role]}`}>
                                  {schemaCol.role[0]}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.preview.map((row, i) => (
                      <tr key={i} className={`border-b border-gray-50 hover:bg-blue-50/20 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-3 py-2 text-[9px] text-gray-300 font-mono">{i + 1}</td>
                        {previewCols.map((col) => {
                          const schemaCol = dataset.schema.find((s) => s.name === col);
                          const val = row[col];
                          return (
                            <td key={col} className={`px-3 py-2 whitespace-nowrap font-mono ${
                              schemaCol?.role === 'Output' ? 'font-semibold text-green-700' : 'text-gray-700'
                            }`}>
                              {typeof val === 'number' ? val.toLocaleString() : val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quality tab */}
          {tab === 'quality' && (
            <div className="h-full overflow-y-auto p-5 space-y-5">
              {/* Overall score */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={dataset.quality >= 97 ? '#059669' : dataset.quality >= 90 ? '#3F98FF' : '#f59e0b'}
                      strokeWidth="3"
                      strokeDasharray={`${dataset.quality} ${100 - dataset.quality}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-gray-800">{dataset.quality}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">
                    {dataset.quality >= 97 ? 'Excellent' : dataset.quality >= 90 ? 'Good' : 'Needs Review'}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Overall data quality score</div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {dataset.rows.toLocaleString()} rows · {dataset.columns} columns · {dataset.format}
                  </div>
                </div>
              </div>

              {/* Quality dimensions */}
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Quality Dimensions</div>
                <div className="space-y-3">
                  {dataset.qualityBreakdown.map((q) => (
                    <div key={q.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-gray-700">{q.label}</span>
                        <span className="text-[11px] font-bold" style={{ color: q.color }}>{q.value}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${q.value}%`, backgroundColor: q.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completeness by column */}
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Completeness by Column</div>
                <div className="space-y-1.5">
                  {[...dataset.schema]
                    .sort((a, b) => a.completeness - b.completeness)
                    .map((col) => (
                      <div key={col.name} className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-gray-500 w-36 truncate shrink-0">{col.name}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${col.completeness}%`,
                              backgroundColor: col.completeness >= 98 ? '#059669' : col.completeness >= 90 ? '#3F98FF' : '#f59e0b',
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-semibold w-8 text-right shrink-0" style={{
                          color: col.completeness >= 98 ? '#059669' : col.completeness >= 90 ? '#3F98FF' : '#f59e0b',
                        }}>{col.completeness.toFixed(0)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
