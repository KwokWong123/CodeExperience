import { useState } from 'react';
import { X, FileText, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';

interface Artifact {
  id: string;
  type: 'file' | 'chart';
  name: string;
  lines?: number;
  bytes?: number;
  codeBlock?: {
    fileName: string;
    content: string;
    lines?: number;
    bytes?: number;
  };
  chartBlock?: {
    title: string;
    data: any[];
    chartType: 'line' | 'bar' | 'area';
    xAxisKey: string;
    yAxisKeys: { key: string; color: string; name: string }[];
    description?: string;
  };
}

interface ArtifactsModalProps {
  artifacts: Artifact[];
  onClose: () => void;
  onSelectArtifact: (artifact: Artifact) => void;
}

export function ArtifactsModal({ artifacts, onClose, onSelectArtifact }: ArtifactsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded shadow-xl w-[600px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Artifacts</h2>
            <p className="text-sm text-gray-600 mt-1">{artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''} created</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Artifacts List */}
        <div className="flex-1 overflow-y-auto p-6">
          {artifacts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No artifacts created yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {artifacts.map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => {
                    onSelectArtifact(artifact);
                    onClose();
                  }}
                  className="w-full flex items-start gap-3 p-4 rounded border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded flex items-center justify-center ${
                    artifact.type === 'file' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {artifact.type === 'file' ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <BarChart3 className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{artifact.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="capitalize">{artifact.type}</span>
                      {artifact.lines && <span>{artifact.lines} lines</span>}
                      {artifact.bytes && <span>{(artifact.bytes / 1024).toFixed(1)} KB</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}