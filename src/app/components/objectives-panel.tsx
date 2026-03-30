import { Target, TrendingUp, TrendingDown, CheckCircle2, Clock, AlertCircle, Lock } from 'lucide-react';

interface Objective {
  id: string;
  attribute: string;
  target: 'maximize' | 'minimize' | 'range';
  value?: number | string;
  unit?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'achieved' | 'pending' | 'at-risk';
  progress?: number;
  currentValue?: number | string;
}

interface ObjectivesPanelProps {
  objectives: Objective[];
  projectTitle: string;
  isLocked?: boolean;
}

const STATUS_CONFIG = {
  active: { icon: <Clock className="w-3 h-3" />, color: 'text-[#3F98FF]', bg: 'bg-blue-50', label: 'Active' },
  achieved: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-green-600', bg: 'bg-green-50', label: 'Achieved' },
  pending: { icon: <Clock className="w-3 h-3" />, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Pending' },
  'at-risk': { icon: <AlertCircle className="w-3 h-3" />, color: 'text-amber-500', bg: 'bg-amber-50', label: 'At Risk' },
};

const PRIORITY_CONFIG = {
  high: { color: 'text-red-600', bg: 'bg-red-50', label: '● High' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-50', label: '● Med' },
  low: { color: 'text-gray-500', bg: 'bg-gray-100', label: '● Low' },
};

export function ObjectivesPanel({ objectives, projectTitle, isLocked = false }: ObjectivesPanelProps) {
  const achieved = objectives.filter(o => o.status === 'achieved').length;

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200 bg-gradient-to-r from-[#3F98FF]/5 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-[#3F98FF]/10 rounded-md flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-[#3F98FF]" />
          </div>
          <span className="text-xs font-bold text-gray-900">Objectives</span>
          {isLocked && <Lock className="w-3 h-3 text-gray-400 ml-auto" />}
        </div>
        <p className="text-[10px] text-gray-500 truncate">{projectTitle}</p>
        {objectives.length > 0 && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-gray-500">{achieved}/{objectives.length} achieved</span>
            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3F98FF] to-[#7c3aed] rounded-full transition-all"
                style={{ width: `${objectives.length ? (achieved / objectives.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Objectives list */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {objectives.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-3">
            <Target className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Objectives will appear here after the first demo step
            </p>
          </div>
        ) : (
          objectives.map(obj => {
            const status = STATUS_CONFIG[obj.status];
            const priority = PRIORITY_CONFIG[obj.priority];
            return (
              <div
                key={obj.id}
                className={`p-2.5 rounded-lg border transition-all ${
                  obj.status === 'achieved' ? 'border-green-200 bg-green-50/50' :
                  obj.status === 'at-risk' ? 'border-amber-200 bg-amber-50/50' :
                  obj.status === 'active' ? 'border-[#3F98FF]/20 bg-blue-50/30' :
                  'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {obj.target === 'maximize' ? (
                      <TrendingUp className="w-3 h-3 text-green-600 shrink-0" />
                    ) : obj.target === 'minimize' ? (
                      <TrendingDown className="w-3 h-3 text-orange-500 shrink-0" />
                    ) : (
                      <Target className="w-3 h-3 text-[#3F98FF] shrink-0" />
                    )}
                    <span className="text-[11px] font-semibold text-gray-800 leading-tight">{obj.attribute}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${status.color} ${status.bg}`}>
                    {status.label}
                  </span>
                </div>

                {obj.value && (
                  <div className="text-[10px] text-gray-600 mb-1.5 flex items-center gap-1">
                    <span className="capitalize text-gray-400">{obj.target}:</span>
                    <span className="font-semibold text-gray-700">{obj.value} {obj.unit || ''}</span>
                  </div>
                )}

                {obj.progress !== undefined && (
                  <div className="mb-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] text-gray-400">Progress</span>
                      <span className="text-[9px] font-semibold text-gray-700">{obj.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${obj.progress}%`,
                          backgroundColor: obj.progress >= 90 ? '#059669' : obj.progress >= 70 ? '#3F98FF' : '#f59e0b'
                        }}
                      />
                    </div>
                  </div>
                )}

                {obj.currentValue && (
                  <div className="text-[9px] text-gray-500 flex justify-between">
                    <span>Current:</span>
                    <span className="font-semibold text-gray-700">{obj.currentValue} {obj.unit || ''}</span>
                  </div>
                )}

                <div className="flex items-center mt-1.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${priority.color} ${priority.bg}`}>
                    {priority.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Score summary */}
      {objectives.length > 0 && (
        <div className="px-3 py-2.5 border-t border-gray-200 bg-gradient-to-r from-[#3F98FF]/5 to-transparent">
          <div className="text-[10px] font-semibold text-gray-700 mb-1.5">Optimization Score</div>
          <div className="text-2xl font-bold text-[#3F98FF] leading-none mb-0.5">
            {achieved > 0 ? Math.round((achieved / objectives.length) * 100) : '--'}<span className="text-sm font-medium text-gray-400">{achieved > 0 ? '%' : ''}</span>
          </div>
          <div className="text-[10px] text-gray-500">
            {objectives.filter(o => o.status === 'active').length} objectives in progress
          </div>
        </div>
      )}
    </div>
  );
}
