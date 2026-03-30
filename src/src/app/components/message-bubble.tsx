import { User, ThumbsUp, ThumbsDown, Copy, RotateCcw, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { CodeBlock } from './code-block';
import { ChartBlock } from './chart-block';

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path>
  </svg>
);

interface MessageBubbleProps {
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
  onExpandCodeBlock?: (codeBlock: { fileName: string; content: string; lines?: number; bytes?: number }) => void;
  onExpandChartBlock?: (chartBlock: { 
    title: string;
    data: any[];
    chartType: 'line' | 'bar' | 'area';
    xAxisKey: string;
    yAxisKeys: { key: string; color: string; name: string }[];
    description?: string;
  }) => void;
  allMessages?: Array<{
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
  }>;
  onArtifactClick?: (artifactName: string) => void;
}

// Simple markdown parser for styling content
function parseMarkdown(text: string, onArtifactClick?: (artifactName: string) => void) {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle ## headers (h2)
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="text-base font-semibold text-gray-900 mt-4 mb-2 first:mt-0">
          {line.substring(3)}
        </h2>
      );
    }
    // Handle empty lines
    else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
    }
    // Handle regular text with **bold** and @artifact references
    else {
      // Split by both bold and @ patterns
      const parts = line.split(/(\*\*.*?\*\*|@[\w\-\.]+)/g);
      const formattedParts = parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={idx} className="font-semibold text-gray-900">
              {part.slice(2, -2)}
            </strong>
          );
        } else if (part.startsWith('@')) {
          const artifactName = part.substring(1);
          return (
            <button
              key={idx}
              onClick={() => onArtifactClick?.(artifactName)}
              className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm font-medium cursor-pointer border border-blue-200"
            >
              <FileIcon className="w-3 h-3" />
              {artifactName}
            </button>
          );
        }
        return <span key={idx}>{part}</span>;
      });
      
      elements.push(
        <p key={key++} className="text-gray-900 leading-relaxed">
          {formattedParts}
        </p>
      );
    }
  }

  return elements;
}

export function MessageBubble({ role, content, codeBlock, chartBlock, onExpandCodeBlock, onExpandChartBlock, allMessages, onArtifactClick }: MessageBubbleProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end py-6 px-6">
        <div className="max-w-[70%] bg-[#e8f1fd] rounded px-3 py-2">
          <p className="text-[#252a32] text-base leading-5">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-6">
      <div className="flex-1 pt-1">
        <div className="prose prose-sm max-w-none">
          {parseMarkdown(content, onArtifactClick)}
        </div>
        
        {codeBlock && (
          <CodeBlock
            fileName={codeBlock.fileName}
            content={codeBlock.content}
            lines={codeBlock.lines}
            bytes={codeBlock.bytes}
            onExpand={() => onExpandCodeBlock?.(codeBlock)}
          />
        )}
        
        {chartBlock && (
          <ChartBlock
            title={chartBlock.title}
            data={chartBlock.data}
            chartType={chartBlock.chartType}
            xAxisKey={chartBlock.xAxisKey}
            yAxisKeys={chartBlock.yAxisKeys}
            description={chartBlock.description}
            onExpand={() => onExpandChartBlock?.(chartBlock)}
          />
        )}
        
        <div className="flex items-center gap-1 mt-4">
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded text-gray-600 hover:text-gray-900">
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded text-gray-600 hover:text-gray-900">
            <ThumbsDown className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded text-gray-600 hover:text-gray-900">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded text-gray-600 hover:text-gray-900">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded px-2 text-gray-600 hover:text-gray-900">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}