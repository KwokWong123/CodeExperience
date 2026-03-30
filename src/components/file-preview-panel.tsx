import { Maximize2, MoreHorizontal, X, Package } from 'lucide-react';
import { Button } from './ui/button';
import { SpreadsheetViewer } from './spreadsheet-viewer';
import { ChartViewer } from './chart-viewer';
import { useState, useRef, useEffect } from 'react';

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path>
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path>
  </svg>
);

interface PreviewFile {
  fileName: string;
  content?: string;
  lines?: number;
  bytes?: number;
  type?: 'file' | 'chart';
  prompt?: string;
  messageId?: string;
  chartData?: {
    data: any[];
    chartType: 'line' | 'bar' | 'area';
    xAxisKey: string;
    yAxisKeys: { key: string; color: string; name: string }[];
    title?: string;
  };
}

interface FilePreviewPanelProps {
  files: PreviewFile[];
  activeFile: string;
  onSelectFile: (fileName: string) => void;
  onCloseFile: (fileName: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onNavigateToMessage?: (messageId: string) => void;
  onClose?: () => void;
}

export function FilePreviewPanel({ files, activeFile, onSelectFile, onCloseFile, isExpanded, onToggleExpand, onNavigateToMessage, onClose }: FilePreviewPanelProps) {
  const currentFile = files.find(f => f.fileName === activeFile);
  const [width, setWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'artifacts'>('artifacts');
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Show panel if there are any files
  if (files.length === 0) return null;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate new width based on distance from right edge of viewport
      const newWidth = window.innerWidth - e.clientX;
      
      // Clamp width between 300px and leave at least 400px for chat area + sidebar
      const minWidth = 300;
      const maxWidth = window.innerWidth - 400; // Reserve 400px for left side (sidebar + chat area minimum)
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      // Only update if the width actually changed
      setWidth(prevWidth => {
        if (prevWidth === clampedWidth) return prevWidth;
        return clampedWidth;
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while resizing
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Determine if file should be shown as spreadsheet
  const isSpreadsheet = currentFile.fileName.endsWith('.csv') || currentFile.fileName.endsWith('.tsv');

  return (
    <div 
      ref={panelRef}
      className={`h-screen bg-white border-l border-gray-300 flex flex-col relative transition-[flex] duration-300 ease-in-out overflow-hidden ${isExpanded ? 'flex-1' : 'flex-shrink-0'}`}
      style={{ width: isExpanded ? undefined : `${width}px`, minWidth: isExpanded ? undefined : `${width}px`, maxWidth: isExpanded ? undefined : `${width}px` }}
    >
      {/* Resize Handle */}
      {!isExpanded && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 hover:w-1 z-50 group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <button
          onClick={() => setViewMode('artifacts')}
          className={`flex items-center gap-2 transition-colors flex-shrink-0 ${
            viewMode === 'artifacts' 
              ? 'text-blue-600' 
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <Package className="w-5 h-5 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-sm font-semibold whitespace-nowrap">All Artifacts</div>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full flex-shrink-0">
              {files.length}
            </span>
          </div>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 flex-shrink-0"
            onClick={onToggleExpand}
          >
            <Maximize2 className="w-4 h-4 text-gray-600" />
          </Button>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 flex-shrink-0"
              onClick={onClose}
            >
              <X className="w-4 h-4 text-gray-600" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-gray-200 overflow-x-auto bg-white">
        <div className="flex">
          {files.map((file, index) => (
            <button
              key={file.fileName}
              onClick={() => {
                onSelectFile(file.fileName);
                setViewMode('file');
              }}
              className={`group flex items-center gap-2 px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeFile === file.fileName && viewMode === 'file'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {file.type === 'chart' ? (
                  <ChartIcon />
                ) : (
                  <FileIcon />
                )}
                <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                  {file.fileName}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Section - shown when viewing a file */}
      {viewMode === 'file' && currentFile?.prompt && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-500 mb-1">Generated from prompt:</div>
              <div className="text-sm text-gray-700">{currentFile.prompt}</div>
            </div>
            {currentFile.messageId && onNavigateToMessage && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-7 px-2 text-xs"
                onClick={() => onNavigateToMessage(currentFile.messageId!)}
              >
                View in chat
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white">
        {viewMode === 'artifacts' ? (
          <div className="h-full overflow-auto p-4">
            <div className="space-y-2 max-w-full">
              {files.map((file, index) => (
                <div
                  key={file.fileName}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors max-w-full"
                  onClick={() => {
                    setViewMode('preview');
                    onSelectFile(file.fileName);
                  }}
                >
                  {file.type === 'chart' ? (
                    <div className="flex-shrink-0 w-10 h-10 rounded bg-blue-50 flex items-center justify-center">
                      <ChartIcon className="w-5 h-5 text-blue-600" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-10 h-10 rounded bg-blue-50 flex items-center justify-center">
                      <FileIcon className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {file.fileName}
                    </div>
                    {file.prompt && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {file.prompt}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-0.5">
                      {file.type === 'chart' ? (
                        <span>{file.chartData?.chartType || 'Chart'} · {file.chartData?.data.length || 0} data points</span>
                      ) : (
                        <span>{file.lines} lines · {file.bytes} bytes</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : currentFile && isSpreadsheet ? (
          <SpreadsheetViewer content={currentFile.content} fileName={currentFile.fileName} />
        ) : currentFile && currentFile.type === 'chart' ? (
          <ChartViewer chartData={currentFile.chartData} />
        ) : currentFile ? (
          <div className="font-mono text-sm h-full overflow-auto">
            {currentFile.content?.split('\n').map((line, index) => (
              <div key={index} className="flex hover:bg-gray-50 px-4 py-0.5">
                <span className="text-gray-400 select-none mr-6 w-8 text-right flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-gray-900">{line || ' '}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {!isSpreadsheet && currentFile && currentFile.type !== 'chart' && viewMode === 'preview' && (
        <div className="px-4 py-2 text-xs text-gray-600 border-t border-gray-200 bg-gray-50">
          <span className="text-gray-500">Use </span>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Control</kbd>
          <span className="text-gray-500"> + </span>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Shift</kbd>
          <span className="text-gray-500"> + </span>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">m</kbd>
          <span className="text-gray-500"> to toggle the </span>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">tab</kbd>
          <span className="text-gray-500"> key moving focus. Alternatively, use </span>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">esc</kbd>
          <span className="text-gray-500"> then </span>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">tab</kbd>
          <span className="text-gray-500"> to move to the next interactive element on the page.</span>
        </div>
      )}
    </div>
  );
}