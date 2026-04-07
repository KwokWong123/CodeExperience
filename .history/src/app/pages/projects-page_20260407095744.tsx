import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Search, FlaskConical, Database, BrainCircuit, LayoutGrid, List,
  Clock, Users, ChevronRight, MoreHorizontal, CheckCircle2,
  AlertCircle, Circle, TrendingUp, Layers,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  domain: string;
  domainColor: string;
  description: string;
  status: 'active' | 'complete' | 'draft' | 'paused';
  currentStage: number;
  totalStages: number;
  owner: string;
  team: { initials: string; color: string }[];
  datasets: number;
  models: number;
  lastActivity: string;
  created: string;
  objective: string;
  bestR2?: number;
  targetMetric?: string;
  isCustom?: boolean;
}

const BASE_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Sunscreen SPF Optimization',
    domain: 'UV Protection',
    domainColor: '#3F98FF',
    description: 'Multi-objective optimization of SPF 50+ sunscreen formulations targeting superior water resistance, 24-month stability, and cost efficiency using 2,450 historical experiments.',
    status: 'active',
    currentStage: 2,
    totalStages: 6,
    owner: 'Dr. Sarah Chen',
    team: [
      { initials: 'SC', color: '#3F98FF' },
      { initials: 'JP', color: '#7c3aed' },
      { initials: 'MS', color: '#059669' },
    ],
    datasets: 2,
    models: 3,
    lastActivity: '2 hours ago',
    created: 'Jan 12, 2026',
    objective: 'Maximize SPF ≥50, WR >90%, Stability >97%',
    bestR2: 0.94,
    targetMetric: 'SPF 50+',
  },
  {
    id: '2',
    name: 'Surfactant CMC Prediction',
    domain: 'Surface Chemistry',
    domainColor: '#7c3aed',
    description: 'Machine learning model to predict critical micelle concentration (CMC) for novel surfactant candidates, enabling virtual screening before costly synthesis.',
    status: 'complete',
    currentStage: 6,
    totalStages: 6,
    owner: 'Dr. Sarah Chen',
    team: [
      { initials: 'SC', color: '#3F98FF' },
      { initials: 'AK', color: '#ea580c' },
    ],
    datasets: 1,
    models: 2,
    lastActivity: '2 weeks ago',
    created: 'Nov 5, 2025',
    objective: 'Predict CMC within 0.5 mM accuracy',
    bestR2: 0.887,
    targetMetric: 'CMC accuracy',
  },
  {
    id: '3',
    name: 'Emollient Texture Analysis',
    domain: 'Sensory Science',
    domainColor: '#059669',
    description: 'Optimization of emollient blend ratios for luxury skincare to maximize sensory scores (spreadability, silkiness, non-greasiness) while maintaining rheological stability.',
    status: 'active',
    currentStage: 3,
    totalStages: 6,
    owner: 'Dr. Emma Richardson',
    team: [
      { initials: 'ER', color: '#059669' },
      { initials: 'JP', color: '#7c3aed' },
    ],
    datasets: 1,
    models: 1,
    lastActivity: '1 week ago',
    created: 'Dec 20, 2025',
    objective: 'Sensory score ≥8.5/10 at target cost',
    bestR2: 0.912,
    targetMetric: 'Sensory Score',
  },
  {
    id: '4',
    name: 'UV Filter Photo-Stability',
    domain: 'Photochemistry',
    domainColor: '#ea580c',
    description: 'Predictive modeling of UV filter degradation kinetics under simulated solar radiation (ISO 24444), to identify stabilizer combinations that extend photostability lifetime.',
    status: 'active',
    currentStage: 2,
    totalStages: 6,
    owner: 'Dr. Sarah Chen',
    team: [
      { initials: 'SC', color: '#3F98FF' },
      { initials: 'YT', color: '#db2777' },
    ],
    datasets: 1,
    models: 0,
    lastActivity: 'Today',
    created: 'Mar 10, 2026',
    objective: 'Photostability T½ ≥ 4h under UV-A/B',
    targetMetric: 'Photo T½',
  },
  {
    id: '5',
    name: 'Transdermal Penetration Model',
    domain: 'Drug Delivery',
    domainColor: '#0891b2',
    description: 'Mechanistic and data-driven model of active ingredient penetration through ex-vivo human skin (Franz diffusion cell), to guide formulation of targeted topical drug delivery systems.',
    status: 'draft',
    currentStage: 0,
    totalStages: 6,
    owner: 'Unassigned',
    team: [],
    datasets: 1,
    models: 0,
    lastActivity: '3 days ago',
    created: 'Mar 12, 2026',
    objective: 'Flux rate optimization across stratum corneum',
    targetMetric: 'Flux (µg/cm²/h)',
  },
];

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#3F98FF', bg: '#eff6ff', icon: Circle },
  complete: { label: 'Complete', color: '#059669', bg: '#f0fdf4', icon: CheckCircle2 },
  draft: { label: 'Draft', color: '#9ca3af', bg: '#f9fafb', icon: Circle },
  paused: { label: 'Paused', color: '#d97706', bg: '#fffbeb', icon: AlertCircle },
};

const STAGE_LABELS = ['Setup', 'Objectives', 'EDA', 'Modeling', 'Optimization', 'Recipes', 'Report'];

const CUSTOM_PROJECTS_STORAGE_KEY = 'noble-ai-custom-projects';

const DOMAIN_COLORS = ['#3F98FF', '#7c3aed', '#059669', '#ea580c', '#0891b2', '#db2777'];

type FilterStatus = 'all' | 'active' | 'complete' | 'draft';

export function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDomain, setNewProjectDomain] = useState('Formulation Science');
  const [newProjectObjective, setNewProjectObjective] = useState('Define target product profile and optimize formulation.');
  const [newProjectDescription, setNewProjectDescription] = useState('New project created from Projects tab.');
  const [newProjectOwner, setNewProjectOwner] = useState('Unassigned');
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_PROJECTS_STORAGE_KEY);
      const custom = raw ? (JSON.parse(raw) as Project[]) : [];
      return [...custom, ...BASE_PROJECTS];
    } catch {
      return BASE_PROJECTS;
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    const custom = projects.filter((p) => p.isCustom);
    localStorage.setItem(CUSTOM_PROJECTS_STORAGE_KEY, JSON.stringify(custom));
  }, [projects]);

  const resetCreateForm = () => {
    setNewProjectName('');
    setNewProjectDomain('Formulation Science');
    setNewProjectObjective('Define target product profile and optimize formulation.');
    setNewProjectDescription('New project created from Projects tab.');
    setNewProjectOwner('Unassigned');
  };

  const handleCreateProject = () => {
    const trimmedName = newProjectName.trim();
    if (!trimmedName) return;

    const id = `custom-${Date.now()}`;
    const owner = newProjectOwner.trim() || 'Unassigned';
    const initials = owner
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'NA';
    const color = DOMAIN_COLORS[id.length % DOMAIN_COLORS.length];
    const createdDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const newProject: Project = {
      id,
      name: trimmedName,
      domain: newProjectDomain.trim() || 'General',
      domainColor: color,
      description: newProjectDescription.trim() || 'New project created from Projects tab.',
      status: 'draft',
      currentStage: 0,
      totalStages: 6,
      owner,
      team: owner === 'Unassigned' ? [] : [{ initials, color }],
      datasets: 0,
      models: 0,
      lastActivity: 'Just now',
      created: createdDate,
      objective: newProjectObjective.trim() || 'Define project objective',
      targetMetric: 'TBD',
      isCustom: true,
    };

    setProjects((prev) => [newProject, ...prev]);
    setFilter('all');
    setSearch('');
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  const totalModels = projects.reduce((sum, p) => sum + p.models, 0);
  const totalDatasets = projects.reduce((sum, p) => sum + p.datasets, 0);
  const estimatedDataPoints = (totalDatasets * 1500).toLocaleString();
  const stats = [
    { label: 'Total Projects', value: String(projects.length), icon: Layers, color: '#3F98FF' },
    { label: 'Active', value: String(projects.filter((p) => p.status === 'active').length), icon: TrendingUp, color: '#059669' },
    { label: 'Models Trained', value: String(totalModels), icon: BrainCircuit, color: '#7c3aed' },
    { label: 'Datasets', value: String(totalDatasets), icon: Database, color: '#ea580c' },
    { label: 'Data Points', value: estimatedDataPoints, icon: FlaskConical, color: '#0891b2' },
  ];

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.domain.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex-1 overflow-auto bg-gray-50 h-full">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span>Noble AI VIP</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-600 font-medium">Projects</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">R&D initiatives — manage your datasets, models, analysis, and reports by project</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3F98FF] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '15' }}>
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 leading-tight">{s.value}</div>
                <div className="text-[10px] text-gray-400">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Filters & Search */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {(['all', 'active', 'complete', 'draft'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? 'bg-[#3F98FF] text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'}`}
              >
                {f === 'all' ? `All (${projects.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${projects.filter((p) => p.status === f).length})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF] bg-white w-52"
              />
            </div>
            <button onClick={() => setViewMode('grid')} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${viewMode === 'grid' ? 'border-[#3F98FF] bg-[#3F98FF]/10 text-[#3F98FF]' : 'border-gray-200 text-gray-400 hover:text-gray-600'}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode('list')} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${viewMode === 'list' ? 'border-[#3F98FF] bg-[#3F98FF]/10 text-[#3F98FF]' : 'border-gray-200 text-gray-400 hover:text-gray-600'}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-3'}>
          {filtered.map((project) => {
            const cfg = STATUS_CONFIG[project.status];

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden"
              >
                {/* Color accent bar */}
                <div className="h-1" style={{ backgroundColor: project.domainColor }} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: project.domainColor + '15', color: project.domainColor }}
                        >
                          {project.domain}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.color + '40' }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">{project.name}</h3>
                    </div>
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors shrink-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{project.description}</p>

                  {/* Workflow progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-gray-400 font-medium">Workflow</span>
                      <span className="text-[10px] font-semibold text-gray-600">
                        Stage {project.currentStage}/{project.totalStages}
                        {project.currentStage > 0 && ' · ' + STAGE_LABELS[project.currentStage]}
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: project.totalStages }).map((_, i) => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full transition-colors"
                          style={{
                            backgroundColor:
                              i < project.currentStage
                                ? project.domainColor
                                : i === project.currentStage
                                ? project.domainColor + '50'
                                : '#e5e7eb',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-4 mb-4">
                    {[
                      { icon: Database, label: 'Datasets', value: project.datasets },
                      { icon: BrainCircuit, label: 'Models', value: project.models },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-700">{value}</span>
                        <span className="text-[10px] text-gray-400">{label}</span>
                      </div>
                    ))}
                    {project.bestR2 && (
                      <div className="ml-auto flex items-center gap-1">
                        <span className="text-[10px] text-gray-400">Best R²</span>
                        <span className="text-xs font-bold text-[#3F98FF]">{project.bestR2}</span>
                      </div>
                    )}
                  </div>

                  {/* Team & Activity */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {project.team.length > 0 ? (
                          project.team.map((member, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-white"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.initials}
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Users className="w-3 h-3" />
                            <span className="text-[10px]">Unassigned</span>
                          </div>
                        )}
                      </div>
                      {project.team.length > 0 && (
                        <span className="text-[10px] text-gray-400">{project.owner}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px]">{project.lastActivity}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        if (project.isCustom) {
                          navigate(`/workspace/${project.id}`);
                        } else {
                          navigate(`/projects/${project.id}`);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#3F98FF] text-white text-xs font-semibold rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm"
                    >
                      {project.isCustom ? 'Open Workspace' : 'View Project'}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button className="flex items-center justify-center px-3 py-1.5 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 transition-colors gap-1">
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-xl border border-gray-200 shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Create New Project</h2>
              <p className="text-xs text-gray-500 mt-0.5">Set up a project shell and start in Draft mode.</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600">Project Name</label>
                <input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Mineral Sunscreen Texture Optimization"
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600">Domain</label>
                  <input
                    value={newProjectDomain}
                    onChange={(e) => setNewProjectDomain(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600">Owner</label>
                  <input
                    value={newProjectOwner}
                    onChange={(e) => setNewProjectOwner(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600">Objective</label>
                <input
                  value={newProjectObjective}
                  onChange={(e) => setNewProjectObjective(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600">Description</label>
                <textarea
                  rows={3}
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF]"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetCreateForm();
                }}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#3F98FF] text-white hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}