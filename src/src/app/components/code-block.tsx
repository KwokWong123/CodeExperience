import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Button } from './ui/button';

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path>
  </svg>
);

interface CodeBlockProps {
  fileName: string;
  content: string;
  language?: string;
  lines?: number;
  bytes?: number;
  onExpand?: () => void;
}

export function CodeBlock({ fileName, content, lines, bytes, onExpand }: CodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className="border border-gray-300 rounded overflow-hidden bg-white my-3 max-w-xl cursor-pointer hover:border-gray-400 transition-colors"
      onClick={onExpand}
    >
      <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <FileIcon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">{fileName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          <Maximize2 className="w-3.5 h-3.5 text-gray-600" />
        </Button>
      </div>
      
      <div className="bg-[#f6f8fa] p-3">
        <div className="font-mono text-xs">
          {content.split('\n').map((line, index) => (
            <div key={index} className="flex">
              <span className="text-gray-400 select-none mr-4 w-6 text-right">
                {index + 1}
              </span>
              <span className="text-gray-900">{line || ' '}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}