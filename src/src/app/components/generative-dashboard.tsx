import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { DashboardArtifact } from './dashboard-artifact';
import { LayoutGrid, Sparkles } from 'lucide-react';

export interface Layout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardItem {
  id: string;
  type: 'chart-bar' | 'chart-line' | 'chart-area' | 'scatter' | 'table' | 'molecule' | 'shap' | 'heatmap' | 'recipe' | 'stats' | 'radar' | 'text';
  title: string;
  subtitle?: string;
  content?: any;
  chartData?: {
    data: any[];
    xAxisKey: string;
    yAxisKeys: { key: string; color: string; name: string }[];
  };
  isNew?: boolean;
  layout: Layout;
}

interface GenerativeDashboardProps {
  items: DashboardItem[];
  onLayoutChange?: (items: DashboardItem[]) => void;
  onRemoveItem?: (itemId: string) => void;
}

const ROW_PX = 92;      // px per layout.h unit
const MIN_H = 260;      // minimum panel height in px
const GAP = 12;         // gap between panels in px

export function GenerativeDashboard({ items, onLayoutChange, onRemoveItem }: GenerativeDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [maximizedId, setMaximizedId] = useState<string | null>(null);

  // Heights keyed by item id (in px). Falls back to layout.h * ROW_PX.
  const [itemHeights, setItemHeights] = useState<Record<string, number>>({});

  // Vertical resize state
  const [resizing, setResizing] = useState<{
    id: string;
    startY: number;
    startH: number;
  } | null>(null);

  // Row drag-to-reorder state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // Items sorted by layout.y for stable display order
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.layout.y - b.layout.y),
    [items]
  );

  const getH = useCallback(
    (id: string, layoutH: number) => itemHeights[id] ?? layoutH * ROW_PX,
    [itemHeights]
  );

  // ── Resize handlers ──────────────────────────────────────────────────────

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, id: string, layoutH: number) => {
      e.preventDefault();
      e.stopPropagation();
      setResizing({ id, startY: e.clientY, startH: getH(id, layoutH) });
    },
    [getH]
  );

  // ── Drag-to-reorder handlers ─────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setDraggingId(id);
    setDropIndex(null);
  }, []);

  // Compute which drop-slot the cursor is nearest to during drag
  const computeDropIndex = useCallback(
    (clientY: number) => {
      let bestIndex = sortedItems.length;
      let bestDist = Infinity;

      sortedItems.forEach((item, idx) => {
        const el = rowRefs.current[item.id];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(clientY - mid);
        if (dist < bestDist) {
          bestDist = dist;
          // drop before this item if cursor is above mid, after if below
          bestIndex = clientY < mid ? idx : idx + 1;
        }
      });

      return bestIndex;
    },
    [sortedItems]
  );

  // ── Global mouse move / up ───────────────────────────────────────────────

  useEffect(() => {
    if (!draggingId && !resizing) return;

    const onMove = (e: MouseEvent) => {
      if (resizing) {
        const dy = e.clientY - resizing.startY;
        const newH = Math.max(MIN_H, resizing.startH + dy);
        setItemHeights((prev) => ({ ...prev, [resizing.id]: newH }));
      }
      if (draggingId) {
        setDropIndex(computeDropIndex(e.clientY));
      }
    };

    const onUp = () => {
      if (draggingId && dropIndex !== null) {
        const fromIdx = sortedItems.findIndex((i) => i.id === draggingId);
        if (fromIdx !== -1) {
          const newOrder = [...sortedItems];
          const [moved] = newOrder.splice(fromIdx, 1);
          // Adjust target index for the removal
          const adjustedTarget = dropIndex > fromIdx ? dropIndex - 1 : dropIndex;
          newOrder.splice(adjustedTarget, 0, moved);
          // Write back updated y positions
          const updated = newOrder.map((item, idx) => ({
            ...item,
            layout: { ...item.layout, y: idx * 5, x: 0, w: 12 },
          }));
          onLayoutChange?.(updated);
        }
      }
      setDraggingId(null);
      setDropIndex(null);
      setResizing(null);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [draggingId, resizing, sortedItems, dropIndex, computeDropIndex, onLayoutChange]);

  // ── Maximized view ───────────────────────────────────────────────────────

  if (maximizedId) {
    const item = items.find((i) => i.id === maximizedId);
    if (item) {
      return (
        <div className="h-full w-full p-4 bg-[#f0f4f8]">
          <DashboardArtifact
            item={item}
            onRemove={onRemoveItem ? () => onRemoveItem(item.id) : undefined}
            onMaximize={() => setMaximizedId(null)}
            isMaximized={true}
            onDragStart={() => {}}
            onResizeStart={() => {}}
            isDragging={false}
          />
        </div>
      );
    }
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center bg-[#f8fafd]"
        style={{
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[#3F98FF] to-[#7c3aed] rounded-2xl flex items-center justify-center shadow-2xl">
            <LayoutGrid className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Generative Canvas</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            Start the demo flow using the chat below — AI-generated artifacts will appear here
          </p>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#3F98FF]" />
            <span className="text-xs text-[#3F98FF] font-medium">Noble AI VIP Platform</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-auto"
      style={{
        backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        backgroundColor: '#f8fafd',
        cursor: draggingId ? 'grabbing' : 'default',
        userSelect: draggingId || resizing ? 'none' : 'auto',
      }}
    >
      <div
        className="flex flex-col w-full p-4"
        style={{ gap: GAP }}
      >
        {sortedItems.map((item, idx) => {
          const isDragging = draggingId === item.id;
          const height = getH(item.id, item.layout.h);

          // Show drop indicator above this item
          const showDropAbove = dropIndex === idx && draggingId && draggingId !== item.id;
          // Show drop indicator below the last item
          const showDropBelow =
            idx === sortedItems.length - 1 &&
            dropIndex === sortedItems.length &&
            draggingId &&
            draggingId !== item.id;

          return (
            <div key={item.id}>
              {/* Drop indicator — above */}
              {showDropAbove && (
                <div className="w-full h-1 rounded-full bg-[#3F98FF] mb-2 shadow-sm shadow-[#3F98FF]/40 transition-all" />
              )}

              {/* Panel row */}
              <div
                ref={(el) => { rowRefs.current[item.id] = el; }}
                className={`w-full relative flex flex-col transition-all duration-150 ${item.isNew ? 'animate-artifact-appear' : ''} ${isDragging ? 'opacity-40 scale-[0.995]' : 'opacity-100'}`}
                style={{ height }}
              >
                <DashboardArtifact
                  item={item}
                  onRemove={onRemoveItem ? () => onRemoveItem(item.id) : undefined}
                  onMaximize={() => setMaximizedId(item.id)}
                  isMaximized={false}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onResizeStart={(e) => handleResizeStart(e, item.id, item.layout.h)}
                  isDragging={isDragging}
                />

                {/* Full-width vertical resize handle at the bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-row-resize z-10 flex items-center justify-center group/resize"
                  onMouseDown={(e) => handleResizeStart(e, item.id, item.layout.h)}
                >
                  <div className="w-12 h-1 bg-gray-200 rounded-full group-hover/resize:bg-[#3F98FF] group-hover/resize:w-20 transition-all duration-150" />
                </div>
              </div>

              {/* Drop indicator — below last item */}
              {showDropBelow && (
                <div className="w-full h-1 rounded-full bg-[#3F98FF] mt-2 shadow-sm shadow-[#3F98FF]/40 transition-all" />
              )}
            </div>
          );
        })}

        {/* Bottom padding so last resize handle is accessible */}
        <div className="h-8 shrink-0" />
      </div>
    </div>
  );
}
