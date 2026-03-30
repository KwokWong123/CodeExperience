import { useState } from 'react';
import { Brain, TrendingUp, AlertCircle, Lightbulb, Info, ChevronDown, ChevronUp, Zap, BarChart2, Activity } from 'lucide-react';

export interface Insight {
  id: string;
  type: 'model' | 'prediction' | 'recommendation' | 'warning' | 'info';
  title: string;
  message: string;
  confidence?: number;
  timestamp?: string;
  isNew?: boolean;
}

export interface ModelMetrics {
  r2Score: number;
  rmse: number;
  accuracy: number;
  trainSamples?: number;
  features?: number;
  modelType?: string;
}

interface InsightsPanelProps {
  insights: Insight[];
  modelMetrics?: ModelMetrics | null;
  activeTab?: 'insights' | 'artifacts';
  onTabChange?: (tab: 'insights' | 'artifacts') => void;
}

const INSIGHT_CONFIG = {
  model: { icon: <Brain className="w-3.5 h-3.5" />, color: 'text-[#3F98FF]', bg: 'bg-blue-50', border: 'border-blue-200' },
  prediction: { icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  recommendation: { icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  warning: { icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  info: { icon: <Info className="w-3.5 h-3.5" />, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
};

function MetricGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-14 h-14">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
          <circle
            cx="28" cy="28" r={r} fill="none"
            stroke={color} strokeWidth="4"
            strokeDasharray={c} strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 28 28)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold" style={{ color }}>{(value * 100).toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-[9px] text-gray-500 mt-0.5 text-center">{label}</span>
    </div>
  );
}

export function InsightsPanel({ insights, modelMetrics }: InsightsPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']));

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#3F98FF]/10 rounded-md flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-[#3F98FF]" />
          </div>
          <span className="text-xs font-bold text-gray-900">AI Insights</span>
          {insights.filter(i => i.isNew).length > 0 && (
            <span className="ml-auto text-[9px] font-medium bg-[#3F98FF] text-white px-1.5 py-0.5 rounded-full">
              {insights.filter(i => i.isNew).length} new
            </span>
          )}
        </div>
      </div>

      {/* Model Metrics */}
      {modelMetrics && (
        <div className="p-3 border-b border-gray-200 bg-gradient-to-br from-[#3F98FF]/5 via-transparent to-[#7c3aed]/5">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Activity className="w-3 h-3 text-[#3F98FF]" />
            <span className="text-[10px] font-bold text-gray-700">Model Performance</span>
            <span className="ml-auto text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
              ✓ Deployed
            </span>
          </div>
          <div className="flex items-center justify-between">
            <MetricGauge value={modelMetrics.r2Score} label="R² Score" color="#3F98FF" />
            <MetricGauge value={modelMetrics.accuracy} label="Accuracy" color="#059669" />
            <MetricGauge value={1 - (modelMetrics.rmse / 20)} label="RMSE inv." color="#7c3aed" />
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            {[
              { label: 'RMSE', value: modelMetrics.rmse.toFixed(2), icon: '📉' },
              { label: 'Model', value: modelMetrics.modelType || 'XGBoost+RF', icon: '🤖' },
              { label: 'Train N', value: (modelMetrics.trainSamples || 2447).toLocaleString(), icon: '📊' },
              { label: 'Features', value: modelMetrics.features || 18, icon: '🔢' },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-lg px-2 py-1.5 border border-gray-100 flex items-center gap-1.5">
                <span className="text-[10px]">{m.icon}</span>
                <div>
                  <div className="text-[9px] text-gray-400">{m.label}</div>
                  <div className="text-[10px] font-semibold text-gray-800">{m.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights list */}
      <div className="flex-1 overflow-auto p-2 space-y-1.5">
        {insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-3">
            <Zap className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-[11px] text-gray-400 leading-relaxed">
              AI insights will appear as you progress through the workflow
            </p>
          </div>
        ) : (
          insights.map(insight => {
            const config = INSIGHT_CONFIG[insight.type];
            const expanded = expandedIds.has(insight.id);
            return (
              <div
                key={insight.id}
                className={`rounded-lg border transition-all ${config.bg} ${config.border} ${insight.isNew ? 'ring-2 ring-[#3F98FF]/20' : ''}`}
              >
                <button
                  className="w-full flex items-start gap-2 p-2.5 text-left"
                  onClick={() => toggleExpand(insight.id)}
                >
                  <span className={`mt-0.5 shrink-0 ${config.color}`}>{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-gray-800 leading-tight truncate">{insight.title}</span>
                      {insight.isNew && <span className="text-[8px] bg-[#3F98FF] text-white px-1 py-0.5 rounded font-medium shrink-0">NEW</span>}
                    </div>
                  </div>
                  <span className={`shrink-0 ${config.color}`}>
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </span>
                </button>

                {expanded && (
                  <div className="px-2.5 pb-2.5">
                    <p className="text-[10px] text-gray-700 leading-relaxed">{insight.message}</p>
                    {insight.confidence !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[9px] text-gray-500">Confidence</span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${insight.confidence * 100}%`, backgroundColor: insight.confidence > 0.9 ? '#059669' : '#3F98FF' }}
                          />
                        </div>
                        <span className="text-[9px] font-semibold text-gray-600">{(insight.confidence * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    {insight.timestamp && (
                      <div className="mt-1.5 text-[9px] text-gray-400">{insight.timestamp}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-gray-600 font-medium">Noble AI Engine Active</span>
          <span className="ml-auto text-[9px] text-gray-400">v3.2.1</span>
        </div>
      </div>
    </div>
  );
}
