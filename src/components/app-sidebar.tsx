import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Database, FlaskConical, Settings, HelpCircle, ChevronRight, Star, Plus,
  BrainCircuit, FileBarChart, Sparkles, Bell, ExternalLink, BarChart3,
  Layers, LayoutDashboard, Zap, CheckCircle2, Archive,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/workspaces', label: 'Workspaces', icon: LayoutDashboard },
  { path: '/projects',   label: 'Projects',   icon: Layers           },
  { path: '/datasets',   label: 'Datasets',   icon: Database         },
  { path: '/models',     label: 'Models',     icon: BrainCircuit     },
  { path: '/analysis',   label: 'Analysis',   icon: BarChart3        },
  { path: '/reports',    label: 'Reports',    icon: FileBarChart      },
];

const RECENT_WORKSPACES = [
  { id: '1', name: 'SPF Optimization — Run #4',        status: 'active',   color: '#3F98FF' },
  { id: '4', name: 'UV Filter Degradation — ISO 24444', status: 'active',   color: '#ea580c' },
  { id: '3', name: 'Texture Blend Exploration',         status: 'saved',    color: '#059669' },
  { id: '2', name: 'CMC Screening — Batch 3',           status: 'saved',    color: '#7c3aed' },
];

const STATUS_DOT: Record<string, { icon: React.ElementType; color: string }> = {
  active:   { icon: Zap,           color: '#3F98FF' },
  saved:    { icon: CheckCircle2,  color: '#059669' },
  archived: { icon: Archive,       color: '#9ca3af' },
};

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/projects') {
      return location.pathname === '/projects' || location.pathname.startsWith('/projects/');
    }
    return location.pathname === path;
  };

  return (
    <div
      className={`h-screen bg-[#0a1628] text-slate-300 flex flex-col border-r border-slate-800/80 transition-all duration-300 shrink-0 ${collapsed ? 'w-14' : 'w-[220px]'}`}
    >
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
          {/* Main Navigation */}
          <div className="p-2 border-b border-slate-800/60">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-all mb-0.5 ${
                  isActive(path)
                    ? 'bg-[#3F98FF]/15 text-[#3F98FF] border border-[#3F98FF]/25'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[12px] font-medium">{label}</span>
                {isActive(path) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3F98FF] animate-pulse shrink-0" />
                )}
              </Link>
            ))}
          </div>

          {/* Recent Workspace Sessions */}
          <div className="flex-1 overflow-auto p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Recent Sessions</span>
              <button
                onClick={() => navigate('/workspaces')}
                className="w-5 h-5 flex items-center justify-center rounded bg-[#3F98FF]/10 text-[#3F98FF] hover:bg-[#3F98FF]/20 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-0.5">
              {RECENT_WORKSPACES.map((ws) => {
                const dot = STATUS_DOT[ws.status];
                return (
                  <button
                    key={ws.id}
                    onClick={() => navigate(`/workspace/${ws.id}`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 group"
                  >
                    <FlaskConical className="w-3 h-3 shrink-0" style={{ color: ws.color + 'aa' }} />
                    <span className="text-[10px] truncate flex-1 text-left">{ws.name}</span>
                    <dot.icon className="w-2.5 h-2.5 shrink-0" style={{ color: dot.color }} />
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Nav */}
          <div className="p-3 border-t border-slate-800/60 space-y-0.5">
            {[
              { icon: Bell,       label: 'Notifications' },
              { icon: Settings,   label: 'Settings'      },
              { icon: HelpCircle, label: 'Documentation' },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors text-[11px]"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* User */}
          <div className="p-3 border-t border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gradient-to-br from-[#2563eb] to-[#7c3aed] rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                SC
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-slate-300 truncate">Dr. Sarah Chen</div>
                <div className="text-[9px] text-slate-500">Enterprise · R&D Lab</div>
              </div>
              <Star className="w-3 h-3 text-[#3F98FF] shrink-0" />
            </div>
          </div>
        </>
      )}

      {/* Collapsed state */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center py-3 gap-1">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              title={label}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                isActive(path)
                  ? 'bg-[#3F98FF]/15 text-[#3F98FF] ring-1 ring-[#3F98FF]/30'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
