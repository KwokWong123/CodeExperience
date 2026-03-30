import { X, ChevronLeft, ChevronRight, Lightbulb, MessageSquare, FileText, BarChart3 } from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: 'message' | 'file' | 'chart' | 'lightbulb';
}

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  onSelectSuggestion: (prompt: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function SuggestionsPanel({
  suggestions,
  onSelectSuggestion,
  isCollapsed,
  onToggleCollapse,
}: SuggestionsPanelProps) {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'file':
        return <FileText className="w-4 h-4" />;
      case 'chart':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-[#0d1117] border-l border-[#30363d] flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded transition-colors"
          title="Expand suggestions"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="mt-4 flex flex-col items-center gap-3">
          <Lightbulb className="w-5 h-5 text-[#58a6ff]" />
          <div className="text-[#8b949e] text-xs writing-mode-vertical transform rotate-180">
            Suggestions
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-[#0d1117] border-l border-[#30363d] flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-[#30363d] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[#58a6ff]" />
          <span className="text-white font-medium">Suggestions</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded transition-colors"
          title="Collapse panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => onSelectSuggestion(suggestion.prompt)}
              className="w-full text-left p-3 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[#58a6ff] group-hover:text-[#79c0ff]">
                  {getIcon(suggestion.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white mb-1">
                    {suggestion.title}
                  </div>
                  <div className="text-xs text-[#8b949e] leading-relaxed">
                    {suggestion.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {suggestions.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-[#30363d] mx-auto mb-3" />
            <p className="text-[#8b949e] text-sm">No suggestions available</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-12 border-t border-[#30363d] flex items-center justify-center px-4">
        <p className="text-xs text-[#8b949e]">
          Click a suggestion to auto-fill
        </p>
      </div>
    </div>
  );
}