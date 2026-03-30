import { ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { ChartViewer } from './chart-viewer';

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
    <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path>
  </svg>
);

interface ChartBlockProps {
  title: string;
  data: any[];
  chartType: 'line' | 'bar' | 'area';
  xAxisKey: string;
  yAxisKeys: { key: string; color: string; name: string }[];
  description?: string;
  onExpand?: () => void;
}

export function ChartBlock({ title, data, chartType, xAxisKey, yAxisKeys, description, onExpand }: ChartBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-4 border border-gray-300 rounded overflow-hidden bg-white">
      {/* Header */}
      <div 
        className={`flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${
          isExpanded ? 'border-b border-gray-300' : ''
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-100">
            <ChartIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{title}</div>
            {description && (
              <div className="text-xs text-gray-600">{description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expand
              </>
            )}
          </Button>
          {onExpand && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3"
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
            >
              <Maximize2 className="w-4 h-4 mr-1" />
              Full Screen
            </Button>
          )}
        </div>
      </div>

      {/* Chart Content */}
      {isExpanded && (
        <div className="p-4" style={{ height: '400px' }}>
          <ChartViewer
            data={data}
            chartType={chartType}
            xAxisKey={xAxisKey}
            yAxisKeys={yAxisKeys}
          />
        </div>
      )}
    </div>
  );
}