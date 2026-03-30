import React, { useEffect, useMemo, useState } from 'react';
import { X, Table2, Database, Package } from 'lucide-react';
import type { LibraryArtifact } from './artifacts-library';
import type { BasePanelView, PanelView } from './workspace-canvas';

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (view: PanelView) => void;
  currentStage: number;
  hasRun: boolean;
  libraryArtifacts: LibraryArtifact[];
  panelViews: PanelView[];
}

const TABLE_SOURCE_OPTIONS: Array<{ key: `table:${BasePanelView}`; label: string; stage: number | null; subtitle: string }> = [
  { key: 'table:live', label: 'Live Data Table', stage: null, subtitle: 'Current stage table output' },
  { key: 'table:stage-3', label: 'Validation Table', stage: 3, subtitle: 'Model validation results' },
  { key: 'table:stage-4', label: 'Pareto Table', stage: 4, subtitle: 'Pareto candidate dataset' },
  { key: 'table:stage-5', label: 'Recipes Table', stage: 5, subtitle: 'Top recipe formulation specs' },
  { key: 'table:stage-6', label: 'Report Data Table', stage: 6, subtitle: 'Final report summary table' },
];

export function TableSelectorModal({
  isOpen,
  onClose,
  onConfirm,
  currentStage,
  hasRun,
  libraryArtifacts,
  panelViews,
}: TableSelectorModalProps) {
  const tableArtifacts = useMemo(
    () => libraryArtifacts.filter(artifact => artifact.type === 'table'),
    [libraryArtifacts],
  );

  const [selectedView, setSelectedView] = useState<PanelView>('table:live');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedView('table:live');
  }, [isOpen]);

  if (!isOpen) return null;

  const isStageOptionAvailable = (stage: number | null) => {
    if (stage === null) return true;
    return hasRun && currentStage >= stage;
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[760px] bg-[#171a2b] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-white">Add Data Table</div>
            <div className="text-[10px] text-white/45">Choose table data source or asset library table</div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-white/35 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 min-h-[360px]">
          <div className="p-4 border-b md:border-b-0 md:border-r border-white/10">
            <div className="flex items-center gap-1.5 mb-2">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Workspace Data</span>
            </div>

            <div className="space-y-1.5 max-h-[290px] overflow-auto pr-1">
              {TABLE_SOURCE_OPTIONS.map(option => {
                const available = isStageOptionAvailable(option.stage);
                const alreadyAdded = panelViews.includes(option.key);
                const isSelected = selectedView === option.key;
                return (
                  <button
                    key={option.key}
                    disabled={!available || alreadyAdded}
                    onClick={() => (available && !alreadyAdded) && setSelectedView(option.key)}
                    className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                      isSelected
                        ? 'border-emerald-400/70 bg-emerald-500/10'
                        : available && !alreadyAdded
                        ? 'border-white/10 bg-white/5 hover:bg-white/10'
                        : 'border-white/10 bg-white/5 opacity-45 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Table2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-white/50'}`} />
                      <span className={`text-[11px] font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>{option.label}</span>
                      {option.stage !== null && (
                        <span className="ml-auto text-[9px] text-white/35">Stage {option.stage}</span>
                      )}
                      {option.stage === null && (
                        <span className="ml-auto text-[9px] text-white/35">Live</span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/45 mt-1">{option.subtitle}</div>
                    {!available && (
                      <div className="text-[9px] text-amber-300/90 mt-1">Not available yet</div>
                    )}
                    {alreadyAdded && (
                      <div className="text-[9px] text-amber-300/90 mt-1">Already added</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Asset Library</span>
            </div>

            {tableArtifacts.length === 0 ? (
              <div className="h-[290px] rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-[11px] text-white/40 text-center px-6">
                No table artifacts available in the library.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[290px] overflow-auto pr-1">
                {tableArtifacts.map(artifact => {
                  const artifactView = `artifact:${artifact.id}` as PanelView;
                  const isSelected = selectedView === artifactView;
                  const alreadyAdded = panelViews.includes(artifactView);
                  return (
                    <button
                      key={artifact.id}
                      disabled={alreadyAdded}
                      onClick={() => !alreadyAdded && setSelectedView(artifactView)}
                      className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                        isSelected
                          ? 'border-[#f59e0b]/70 bg-[#f59e0b]/10'
                          : !alreadyAdded
                          ? 'border-white/10 bg-white/5 hover:bg-white/10'
                          : 'border-white/10 bg-white/5 opacity-45 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Table2 className={`w-3.5 h-3.5 ${isSelected ? 'text-[#f59e0b]' : 'text-white/50'}`} />
                        <span className={`text-[11px] font-semibold truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>{artifact.name}</span>
                      </div>
                      <div className="text-[10px] text-white/45 mt-1 flex items-center gap-2">
                        <span>{artifact.category}</span>
                        {artifact.size && <span>· {artifact.size}</span>}
                      </div>
                      {alreadyAdded && (
                        <div className="text-[9px] text-amber-300/90 mt-1">Already added</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="h-12 px-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-[11px] text-white/65 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedView)}
            className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-[#3F98FF] hover:bg-[#2563eb] text-white transition-colors"
          >
            Add Table
          </button>
        </div>
      </div>
    </div>
  );
}
