import React, { useState, useEffect } from 'react';
import { X, BrainCircuit, FolderOpen, GitBranch, Check } from 'lucide-react';
import { PROJECTS, MODELS, MODEL_STATUS_CONFIG } from './workspace-config-panel';

interface ModelProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (projectId: string, modelId: string, modelVersion: string) => void;
  defaultProjectId: string;
  defaultModelId: string;
  defaultModelVersion: string;
}

export function ModelProjectModal({
  isOpen,
  onClose,
  onConfirm,
  defaultProjectId,
  defaultModelId,
  defaultModelVersion,
}: ModelProjectModalProps) {
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [modelId, setModelId] = useState(defaultModelId);
  const [modelVersion, setModelVersion] = useState(defaultModelVersion);

  useEffect(() => {
    if (isOpen) {
      setProjectId(defaultProjectId);
      setModelId(defaultModelId);
      setModelVersion(defaultModelVersion);
    }
  }, [isOpen, defaultProjectId, defaultModelId, defaultModelVersion]);

  const handleModelChange = (id: string) => {
    setModelId(id);
    const model = MODELS.find((m) => m.id === id);
    setModelVersion(model?.defaultVersion ?? model?.versions[0]?.version ?? '');
  };

  const selectedModel = MODELS.find((m) => m.id === modelId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Compact modal */}
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-[700px] max-h-[70vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <span className="text-[12px] font-semibold text-gray-800">Select Model & Project</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3-column body */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* ── Column 1: Project ─────────────────────── */}
          <div className="w-[220px] shrink-0 border-r border-gray-100 flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 shrink-0">
              <FolderOpen className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Project</span>
            </div>
            <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
              {PROJECTS.map((p) => {
                const isSelected = projectId === p.id;
                const statusLabel =
                  p.status === 'active'   ? '● Live' :
                  p.status === 'complete' ? '✓ Done' : '○ Draft';
                const statusColor =
                  p.status === 'active'   ? 'text-[#3F98FF]' :
                  p.status === 'complete' ? 'text-green-600' : 'text-gray-400';
                return (
                  <button
                    key={p.id}
                    onClick={() => setProjectId(p.id)}
                    className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-left transition-all ${
                      isSelected ? 'bg-[#3F98FF]/8 text-[#3F98FF]' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${isSelected ? 'border-[#3F98FF] bg-[#3F98FF]' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[11px] font-medium leading-tight ${isSelected ? 'text-[#3F98FF]' : 'text-gray-700'}`}>{p.name}</div>
                      <div className={`text-[9px] mt-0.5 ${statusColor}`}>{statusLabel}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Column 2: Model ───────────────────────── */}
          <div className="w-[220px] shrink-0 border-r border-gray-100 flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 shrink-0">
              <BrainCircuit className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Model</span>
            </div>
            <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
              {MODELS.map((m) => {
                const isSelected = modelId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModelChange(m.id)}
                    className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-left transition-all ${
                      isSelected ? 'bg-[#3F98FF]/8' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${isSelected ? 'border-[#3F98FF] bg-[#3F98FF]' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[11px] font-semibold leading-tight ${isSelected ? 'text-[#3F98FF]' : 'text-gray-800'}`}>{m.label}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">{m.type}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Column 3: Version ─────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 shrink-0">
              <GitBranch className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Version</span>
            </div>
            <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
              {selectedModel ? selectedModel.versions.map((ver, idx) => {
                const isSelected = modelVersion === ver.version;
                const isLatest = idx === 0;
                const vCfg = MODEL_STATUS_CONFIG[ver.status];
                const maxSamples = Math.max(...selectedModel.versions.map((v) => v.trainSamples));
                const pct = Math.round((ver.trainSamples / maxSamples) * 100);
                return (
                  <button
                    key={ver.version}
                    onClick={() => setModelVersion(ver.version)}
                    className={`w-full flex items-start gap-2 px-2 py-2 rounded-md text-left transition-all ${
                      isSelected ? 'bg-[#3F98FF]/8' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${isSelected ? 'border-[#3F98FF] bg-[#3F98FF]' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[11px] font-bold font-mono ${isSelected ? 'text-[#3F98FF]' : 'text-gray-700'}`}>{ver.version}</span>
                        {isLatest && <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-[#3F98FF]/10 text-[#3F98FF]">latest</span>}
                        <span className={`ml-auto text-[8px] font-semibold ${vCfg.color}`}>{vCfg.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: isSelected ? '#3F98FF' : '#9ca3af' }} />
                        </div>
                        <span className={`text-[8px] font-bold shrink-0 ${isSelected ? 'text-[#3F98FF]' : 'text-gray-400'}`}>{ver.trainSamples.toLocaleString()}</span>
                      </div>
                      {isSelected && ver.r2 != null && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold" style={{ color: ver.r2 >= 0.90 ? '#059669' : '#3F98FF' }}>R² {ver.r2.toFixed(3)}</span>
                          {ver.rmse != null && <span className="text-[9px] font-bold text-purple-600">RMSE {ver.rmse.toFixed(2)}</span>}
                        </div>
                      )}
                    </div>
                  </button>
                );
              }) : (
                <div className="text-[11px] text-gray-400 px-3 py-4 text-center">Select a model first</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 shrink-0 bg-gray-50/60">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(projectId, modelId, modelVersion); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#3F98FF] rounded-md hover:bg-[#2980e8] transition-colors shadow-sm"
          >
            <Check className="w-3 h-3" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
