import { useState } from 'react';
import { Plus, Sparkles, Database, Settings, HelpCircle, ChevronRight, FlaskConical, FileBarChart, FolderOpen, Star, Clock } from 'lucide-react';

interface WorkflowStage {
  id: number;
  label: string;
  description: string;
  icon: string;
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  { id: 0, label: 'Project Setup', description: 'Initialize project', icon: '⚙' },
  { id: 1, label: 'Objectives', description: 'Define KPIs & constraints', icon: '🎯' },
  { id: 2, label: 'Data Exploration', description: 'EDA & correlations', icon: '📊' },
  { id: 3, label: 'Model Training', description: 'Fit predictive model', icon: '🤖' },
  { id: 4, label: 'Optimization', description: 'Bayesian optimization', icon: '⚡' },
  { id: 5, label: 'Formulation', description: 'Generate recipes', icon: '🧪' },
  { id: 6, label: 'Report & Export', description: 'Compile & export', icon: '📄' },
];

const PROJECTS = [
  { id: '1', name: 'Sunscreen SPF Optimization', active: true, status: 'active', stage: 2 },
  { id: '2', name: 'Surfactant CMC Study', active: false, status: 'complete', stage: 6 },
  { id: '3', name: 'Emollient Texture Analysis', active: false, status: 'draft', stage: 0 },
];

interface ChatSidebarProps {
  currentStage: number;
  onStageClick?: (stage: number) => void;
}

export function ChatSidebar({ currentStage, onStageClick }: ChatSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`h-screen bg-[#0a1628] text-slate-300 flex flex-col border-r border-slate-800/80 transition-all duration-300 ${collapsed ? 'w-14' : 'w-[240px]'}`}>
      {/* Logo */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#3F98FF] via-[#2563eb] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-white tracking-tight leading-none">Noble AI</div>
              <div className="text-[10px] text-[#3F98FF] font-semibold tracking-wider mt-0.5">VIP PLATFORM</div>
            </div>
          )}
        </div>
        <button
          className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Workflow Progress */}
          <div className="p-3 border-b border-slate-800/60">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2.5">Workflow</div>
            <div className="space-y-0.5">
              {WORKFLOW_STAGES.map((stage, idx) => {
                const isActive = stage.id === currentStage;
                const isComplete = stage.id < currentStage;
                const isPending = stage.id > currentStage;
                return (
                  <button
                    key={stage.id}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all ${
                      isActive
                        ? 'bg-[#3F98FF]/15 text-[#3F98FF] border border-[#3F98FF]/30'
                        : isComplete
                        ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                        : 'text-slate-600 hover:bg-slate-800/30 hover:text-slate-500'
                    }`}
                    onClick={() => onStageClick?.(stage.id)}
                  >
                    <div className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[10px] ${
                      isComplete ? 'bg-[#059669] text-white' :
                      isActive ? 'bg-[#3F98FF] text-white' :
                      'bg-slate-700 text-slate-500'
                    }`}>
                      {isComplete ? '✓' : idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium leading-tight truncate">{stage.label}</div>
                    </div>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3F98FF] animate-pulse shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Projects */}
          <div className="flex-1 overflow-auto p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Projects</span>
              <button className="w-5 h-5 flex items-center justify-center rounded bg-[#3F98FF]/10 text-[#3F98FF] hover:bg-[#3F98FF]/20 transition-colors">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1">
              {PROJECTS.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${p.active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`}
                >
                  <FlaskConical className="w-3 h-3 shrink-0" />
                  <span className="text-[11px] truncate flex-1">{p.name}</span>
                  <span className={`text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${
                    p.status === 'active' ? 'bg-blue-900/60 text-[#3F98FF]' :
                    p.status === 'complete' ? 'bg-green-900/60 text-green-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {p.status === 'complete' ? '✓' : p.status === 'active' ? 'Live' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-3 border-t border-slate-800/60 space-y-0.5">
            {[
              { icon: Database, label: 'Data Library' },
              { icon: FileBarChart, label: 'Reports' },
              { icon: Settings, label: 'Model Config' },
              { icon: HelpCircle, label: 'Documentation' },
            ].map(({ icon: Icon, label }) => (
              <button key={label} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors text-[11px]">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* User */}
          <div className="p-3 border-t border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gradient-to-br from-[#2563eb] to-[#7c3aed] rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">DS</div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-slate-300 truncate">Dr. Sarah Chen</div>
                <div className="text-[9px] text-slate-500">Enterprise · R&D Lab</div>
              </div>
              <Star className="w-3 h-3 text-[#3F98FF] shrink-0" />
            </div>
          </div>
        </>
      )}

      {collapsed && (
        <div className="flex-1 flex flex-col items-center py-4 gap-3">
          {WORKFLOW_STAGES.map(stage => (
            <button
              key={stage.id}
              title={stage.label}
              onClick={() => onStageClick?.(stage.id)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] transition-colors ${
                stage.id === currentStage ? 'bg-[#3F98FF]/15 ring-1 ring-[#3F98FF]/40' :
                stage.id < currentStage ? 'opacity-60' : 'opacity-30'
              }`}
            >
              {stage.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
