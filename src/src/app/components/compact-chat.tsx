import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ChevronDown, ChevronUp, Bot, User, Loader2, Zap, ChevronRight } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isTyping?: boolean;
}

interface QuickPrompt {
  label: string;
  message: string;
  emoji: string;
}

interface CompactChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  isAITyping?: boolean;
  quickPrompts?: QuickPrompt[];
  demoStage?: number;
}

export function CompactChat({ messages, onSendMessage, isExpanded = false, onToggleExpanded, isAITyping = false, quickPrompts = [] }: CompactChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isAITyping) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleQuickPrompt = (prompt: QuickPrompt) => {
    if (!isAITyping) {
      onSendMessage(prompt.message);
    }
  };

  return (
    <div className={`bg-white border-t border-gray-200 flex flex-col transition-all duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] ${isExpanded ? 'h-[340px]' : 'h-auto'}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gradient-to-r from-[#3F98FF]/5 to-transparent shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-[#3F98FF] to-[#7c3aed] rounded-md flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-semibold text-gray-800">Noble AI Assistant</span>
          {isAITyping && (
            <div className="flex items-center gap-1.5 text-[#3F98FF]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px] font-medium">Analyzing...</span>
            </div>
          )}
          {!isAITyping && messages.length > 0 && (
            <span className="text-[10px] text-gray-400">{messages.length} messages</span>
          )}
        </div>
        <button
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onToggleExpanded}
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Messages */}
      {isExpanded && (
        <div className="flex-1 overflow-auto px-4 py-3 space-y-3 bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-[#3F98FF] to-[#7c3aed] rounded-xl flex items-center justify-center mb-2">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                Click a demo step below or type your own message to generate AI-powered formulation artifacts
              </p>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                    msg.role === 'user' ? 'bg-gray-700' : 'bg-gradient-to-br from-[#3F98FF] to-[#7c3aed]'
                  }`}>
                    {msg.role === 'user' ? <User className="w-3 h-3 text-white" /> : <Sparkles className="w-3 h-3 text-white" />}
                  </div>
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gray-800 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.content}
                    {msg.timestamp && (
                      <div className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-gray-400' : 'text-gray-400'}`}>
                        {msg.timestamp}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isAITyping && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3F98FF] to-[#7c3aed] shrink-0 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 bg-[#3F98FF] rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      )}

      {/* Quick prompts */}
      {quickPrompts.length > 0 && (
        <div className="px-4 py-2.5 border-b border-gray-100 shrink-0 bg-gradient-to-r from-[#3F98FF]/5 to-[#7c3aed]/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1 shrink-0 uppercase tracking-wide">
              <Zap className="w-2.5 h-2.5 text-[#3F98FF]" /> Next step:
            </span>
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                disabled={isAITyping}
                onClick={() => handleQuickPrompt(prompt)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border-2 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed bg-[#3F98FF] border-[#3F98FF] text-white hover:bg-[#2563eb] hover:border-[#2563eb] shadow-md hover:shadow-lg active:scale-95 animate-pulse"
                style={{ animationDuration: '2.5s' }}
              >
                <span>{prompt.emoji}</span>
                {prompt.label}
                <ChevronRight className="w-3 h-3 opacity-80" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-2.5 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isAITyping ? "Noble AI is processing..." : "Ask AI to generate insights, models, or formulations..."}
            disabled={isAITyping}
            className="flex-1 px-3.5 py-2 text-[12px] border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF] disabled:bg-gray-50 disabled:text-gray-400 transition-all bg-gray-50 hover:bg-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || isAITyping}
            className="w-8 h-8 rounded-full bg-[#3F98FF] hover:bg-[#2563eb] disabled:bg-gray-200 disabled:text-gray-400 text-white flex items-center justify-center transition-colors shrink-0"
          >
            {isAITyping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}