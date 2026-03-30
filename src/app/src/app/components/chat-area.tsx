import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Send, MessageSquare, Paperclip, Plus, Package, Lightbulb, Download, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { MessageBubble } from './message-bubble';
import { TaggedInput } from './tagged-input';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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
  referencedArtifacts?: string[];
}

interface Artifact {
  fileName: string;
  type: 'file' | 'chart';
}

interface Tag {
  id: string;
  fileName: string;
  type: 'file' | 'chart';
}

interface ChatAreaProps {
  messages: Message[];
  chatTitle: string;
  onSendMessage: (message: string, referencedArtifacts: string[]) => void;
  onExpandCodeBlock?: (codeBlock: { fileName: string; content: string; lines?: number; bytes?: number }) => void;
  onExpandChartBlock?: (chartBlock: { 
    title: string;
    data: any[];
    chartType: 'line' | 'bar' | 'area';
    xAxisKey: string;
    yAxisKeys: { key: string; color: string; name: string }[];
    description?: string;
  }) => void;
  availableArtifacts?: Artifact[];
  onSelectFile?: (fileName: string) => void;
  onToggleArtifacts?: () => void;
  showArtifacts?: boolean;
  onToggleSuggestions?: () => void;
  showSuggestions?: boolean;
}

export function ChatArea({ messages, chatTitle, onSendMessage, onExpandCodeBlock, onExpandChartBlock, availableArtifacts, onSelectFile, onToggleArtifacts, showArtifacts, onToggleSuggestions, showSuggestions }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || tags.length > 0) {
      const referencedArtifacts = tags.map(tag => tag.fileName);
      onSendMessage(input, referencedArtifacts);
      setInput('');
      setTags([]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#059669] rounded-full"></div>
            <h1 className="text-sm font-semibold text-gray-900">{chatTitle}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-3 gap-2 text-gray-700 hover:bg-gray-100"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-3 gap-2 text-gray-700 hover:bg-gray-100"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </Button>
              <div className="w-px h-5 bg-gray-300 mx-1"></div>
            </>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 px-3 gap-2 transition-colors ${showArtifacts ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={onToggleArtifacts}
          >
            <Package className="w-4 h-4" />
            Artifacts
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 px-3 gap-2 transition-colors ${showSuggestions ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={onToggleSuggestions}
          >
            <Lightbulb className="w-4 h-4" />
            Suggestions
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">Start your research inquiry</h2>
              <p className="text-gray-600">Ask scientific questions, request data analysis, or explore research topics.</p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <div key={message.id} id={`message-${message.id}`} className="transition-colors duration-500">
                <MessageBubble
                  role={message.role}
                  content={message.content}
                  codeBlock={message.codeBlock}
                  chartBlock={message.chartBlock}
                  onExpandCodeBlock={onExpandCodeBlock}
                  onExpandChartBlock={onExpandChartBlock}
                  allMessages={messages}
                  onArtifactClick={(artifactName) => {
                    if (onSelectFile) {
                      onSelectFile(artifactName);
                    }
                  }}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="p-4">
          <div className="relative">
            <TaggedInput
              value={input}
              onChange={setInput}
              onSubmit={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
              placeholder="Ask a research question... (type @ to reference artifacts)"
              tags={tags}
              onAddTag={(tag) => setTags([...tags, tag])}
              onRemoveTag={(id) => setTags(tags.filter(tag => tag.id !== id))}
              availableArtifacts={availableArtifacts}
            />
            
            <Button
              type="submit"
              size="sm"
              className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700"
              disabled={!input.trim() && tags.length === 0}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-gray-600">
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-gray-600">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-gray-600">
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-gray-600">
                <Package className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>GPT-5.2</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}