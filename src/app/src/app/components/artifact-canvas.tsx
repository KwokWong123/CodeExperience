import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  BarChart3, Activity, TrendingUp, Table, Atom, Brain,
  FlaskConical, FileText, Package, X, Maximize2, Minimize2,
  GripVertical, RotateCcw, Trash2, Pin, PinOff, ZoomIn, ZoomOut,
  MousePointer2, Move,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import type { LibraryArtifact } from './artifacts-library';

/* ── Types ──────────────────────────────────────────────────── */

export interface CanvasCard {
  id: string;          // unique instance id
  artifactId: string;
  artifact: LibraryArtifact;
  x: number;
  y: number;
  w: number;
  h: number;
  pinned: boolean;
  collapsed: boolean;
  zIndex: number;
}

interface ArtifactCanvasProps {
  artifacts: LibraryArtifact[];
  cards: CanvasCard[];
  onAddCard: (artifact: LibraryArtifact) => void;
  onRemoveCard: (cardId: string) => void;
  onUpdateCard: (cardId: string, patch: Partial<CanvasCard>) => void;
  onClearAll: () => void;
}

/* ── Colour / icon maps (mirrors library) ───────────────────── */

const TYPE_COLORS: Record<string, { icon: string; bg: string; border: string; text: string }> = {
  'chart-bar':  { icon: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  'chart-line': { icon: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' },
  'chart-area': { icon: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', text: '#0f766e' },
  'scatter':    { icon: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
  'table':      { icon: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', text: '#374151' },
  'molecule':   { icon: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', text: '#3730a3' },
  'shap':       { icon: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', text: '#6d28d9' },
  'heatmap':    { icon: '#e11d48', bg: '#fff1f2', border: '#fecdd3', text: '#be123c' },
  'recipe':     { icon: '#059669', bg: '#f0fdf4', border: '#bbf7d0', text: '#047857' },
  'stats':      { icon: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', text: '#0e7490' },
  'radar':      { icon: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', text: '#be185d' },
  'text':       { icon: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
};

function typeIcon(type: string, className = 'w-3.5 h-3.5') {
  const iconMap: Record<string, React.ReactNode> = {
    'chart-bar':  <BarChart3    className={className} />,
    'chart-line': <Activity     className={className} />,
    'chart-area': <TrendingUp   className={className} />,
    'scatter':    <TrendingUp   className={className} />,
    'table':      <Table        className={className} />,
    'molecule':   <Atom         className={className} />,
    'shap':       <Brain        className={className} />,
    'heatmap':    <BarChart3    className={className} />,
    'recipe':     <FlaskConical className={className} />,
    'stats':      <TrendingUp   className={className} />,
    'radar':      <Activity     className={className} />,
    'text':       <FileText     className={className} />,
  };
  return iconMap[type] ?? <Package className={className} />;
}

/* ── Mini sparkline preview data ────────────────────────────── */

const PREVIEW_DATA = [
  [40, 55, 48, 72, 63, 80, 75],
  [30, 42, 38, 55, 60, 52, 70],
  [60, 48, 55, 45, 65, 70, 68],
  [25, 35, 45, 40, 55, 65, 72],
];

function MiniPreview({ artifact }: { artifact: LibraryArtifact }) {
  const seed = artifact.id.charCodeAt(artifact.id.length - 1) % 4;
  const data = PREVIEW_DATA[seed].map((v, i) => ({ i, v }));
  const colors = TYPE_COLORS[artifact.type] ?? TYPE_COLORS['stats'];

  if (artifact.type === 'table') {
    return (
      <div className="w-full h-full flex flex-col gap-1 p-1">
        {[0,1,2,3].map(r => (
          <div key={r} className="flex gap-1">
            {[0,1,2].map(c => (
              <div key={c} className={`h-2 rounded-sm flex-1 ${r === 0 ? 'opacity-60' : 'opacity-25'}`}
                style={{ background: colors.icon }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (artifact.type === 'molecule') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 80 60" className="w-full h-full opacity-60">
          <circle cx="40" cy="30" r="8" fill={colors.icon} opacity="0.8" />
          <circle cx="18" cy="18" r="6" fill={colors.icon} opacity="0.6" />
          <circle cx="62" cy="18" r="6" fill={colors.icon} opacity="0.6" />
          <circle cx="18" cy="42" r="6" fill={colors.icon} opacity="0.6" />
          <circle cx="62" cy="42" r="6" fill={colors.icon} opacity="0.6" />
          <line x1="40" y1="30" x2="18" y2="18" stroke={colors.icon} strokeWidth="2" opacity="0.5" />
          <line x1="40" y1="30" x2="62" y2="18" stroke={colors.icon} strokeWidth="2" opacity="0.5" />
          <line x1="40" y1="30" x2="18" y2="42" stroke={colors.icon} strokeWidth="2" opacity="0.5" />
          <line x1="40" y1="30" x2="62" y2="42" stroke={colors.icon} strokeWidth="2" opacity="0.5" />
        </svg>
      </div>
    );
  }

  if (artifact.type === 'heatmap') {
    const vals = [0.9, 0.4, 0.7, 0.2, 0.8, 0.3, 0.6, 0.5, 0.85];
    return (
      <div className="w-full h-full grid grid-cols-3 gap-0.5 p-1">
        {vals.map((v, i) => (
          <div key={i} className="rounded-sm" style={{ background: colors.icon, opacity: v * 0.9 + 0.1 }} />
        ))}
      </div>
    );
  }

  if (artifact.type === 'text') {
    return (
      <div className="w-full h-full flex flex-col gap-1 p-1.5 justify-center">
        {[1, 0.7, 0.85, 0.5].map((w, i) => (
          <div key={i} className="h-1.5 rounded-full" style={{ background: colors.icon, opacity: 0.3, width: `${w * 100}%` }} />
        ))}
      </div>
    );
  }

  if (artifact.type === 'chart-bar' || artifact.type === 'stats') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
          <Bar dataKey="v" fill={colors.icon} opacity={0.8} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
        <Line type="monotone" dataKey="v" stroke={colors.icon} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── Individual draggable card ───────────────────────────────── */

function CanvasCardItem({
  card, isSelected, onSelect, onRemove, onPinToggle, onCollapseToggle,
  onDragStart, onResizeStart,
}: {
  card: CanvasCard;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onPinToggle: () => void;
  onCollapseToggle: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  const colors = TYPE_COLORS[card.artifact.type] ?? TYPE_COLORS['stats'];
  const h = card.collapsed ? 36 : card.h;

  return (
    <div
      style={{
        position: 'absolute',
        left: card.x,
        top: card.y,
        width: card.w,
        height: h,
        zIndex: card.zIndex,
        transition: 'box-shadow 0.15s',
      }}
      className={`rounded-xl border-2 bg-white overflow-hidden flex flex-col select-none ${
        isSelected
          ? 'border-[#3F98FF] shadow-[0_0_0_3px_rgba(63,152,255,0.2),0_4px_20px_rgba(0,0,0,0.15)]'
          : 'border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300'
      } ${card.pinned ? 'ring-1 ring-amber-400/60' : ''}`}
      onClick={onSelect}
    >
      {/* Header / drag handle */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-100 shrink-0 cursor-grab active:cursor-grabbing"
        style={{ background: colors.bg }}
        onMouseDown={card.pinned ? undefined : onDragStart}
      >
        <span style={{ color: colors.icon }} className="shrink-0">
          {typeIcon(card.artifact.type, 'w-3 h-3')}
        </span>
        <span className="text-[10px] font-semibold truncate flex-1" style={{ color: colors.text }}>
          {card.artifact.name}
        </span>

        {/* Card controls */}
        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onCollapseToggle}
            title={card.collapsed ? 'Expand' : 'Collapse'}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-black/10 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {card.collapsed ? <Maximize2 className="w-2.5 h-2.5" /> : <Minimize2 className="w-2.5 h-2.5" />}
          </button>
          <button
            onClick={onPinToggle}
            title={card.pinned ? 'Unpin' : 'Pin in place'}
            className={`w-4 h-4 flex items-center justify-center rounded hover:bg-black/10 transition-colors ${card.pinned ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {card.pinned ? <Pin className="w-2.5 h-2.5" /> : <PinOff className="w-2.5 h-2.5" />}
          </button>
          <button
            onClick={onRemove}
            title="Remove from canvas"
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Content / preview */}
      {!card.collapsed && (
        <div className="flex-1 min-h-0 overflow-hidden p-2">
          <MiniPreview artifact={card.artifact} />
        </div>
      )}

      {/* Resize handle */}
      {!card.collapsed && !card.pinned && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end pb-0.5 pr-0.5"
          onMouseDown={e => { e.stopPropagation(); onResizeStart(e); }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

/* ── Main canvas component ───────────────────────────────────── */

export function ArtifactCanvas({
  cards, onRemoveCard, onUpdateCard, onClearAll,
}: ArtifactCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [tool, setTool] = useState<'select' | 'pan'>('select');

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ cardId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ cardId: string; startX: number; startY: number; origW: number; origH: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; origPanX: number; origPanY: number } | null>(null);
  const zIndexRef = useRef(100);

  const bringToFront = useCallback((cardId: string) => {
    zIndexRef.current += 1;
    onUpdateCard(cardId, { zIndex: zIndexRef.current });
  }, [onUpdateCard]);

  /* ── Mouse move / up for drag & resize & pan ── */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const { cardId, startX, startY, origX, origY } = dragRef.current;
        const dx = (e.clientX - startX) / zoom;
        const dy = (e.clientY - startY) / zoom;
        onUpdateCard(cardId, { x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) });
      }
      if (resizeRef.current) {
        const { cardId, startX, startY, origW, origH } = resizeRef.current;
        const dx = (e.clientX - startX) / zoom;
        const dy = (e.clientY - startY) / zoom;
        onUpdateCard(cardId, { w: Math.max(140, origW + dx), h: Math.max(100, origH + dy) });
      }
      if (panRef.current) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        setPan({ x: panRef.current.origPanX + dx, y: panRef.current.origPanY + dy });
      }
    };
    const onUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
      panRef.current = null;
      setIsPanning(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [zoom, onUpdateCard]);

  const handleCardDragStart = useCallback((e: React.MouseEvent, card: CanvasCard) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront(card.id);
    setSelectedId(card.id);
    dragRef.current = { cardId: card.id, startX: e.clientX, startY: e.clientY, origX: card.x, origY: card.y };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [bringToFront]);

  const handleCardResizeStart = useCallback((e: React.MouseEvent, card: CanvasCard) => {
    e.preventDefault();
    resizeRef.current = { cardId: card.id, startX: e.clientX, startY: e.clientY, origW: card.w, origH: card.h };
    document.body.style.cursor = 'se-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setSelectedId(null);
      if (tool === 'pan' || e.button === 1) {
        panRef.current = { startX: e.clientX, startY: e.clientY, origPanX: pan.x, origPanY: pan.y };
        setIsPanning(true);
        document.body.style.cursor = 'grabbing';
      }
    }
  }, [tool, pan]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.3, Math.min(3, z * delta)));
  }, []);

  const handleZoomIn  = () => setZoom(z => Math.min(3,   Math.round((z + 0.1) * 10) / 10));
  const handleZoomOut = () => setZoom(z => Math.max(0.3, Math.round((z - 0.1) * 10) / 10));
  const handleResetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  /* ── Empty state ── */
  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#fafbfc] p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Package className="w-6 h-6 text-gray-300" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-gray-500">Canvas is empty</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
            Open the Library tab and click <span className="font-bold">+</span> on any artifact to pin it here
          </p>
        </div>
        <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
          {['SPF Correlation Heatmap', 'Pareto Candidates', 'R-047 Recipe'].map(name => (
            <div key={name} className="h-7 rounded-lg bg-gray-100 animate-pulse opacity-60 flex items-center px-3">
              <div className="w-3 h-3 rounded bg-gray-200 mr-2 shrink-0" />
              <div className="h-2 bg-gray-200 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#f1f5f9]">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border-b border-gray-200">
        {/* Tool toggle */}
        <div className="flex bg-gray-100 rounded-md p-0.5 gap-0.5">
          <button
            title="Select tool"
            onClick={() => setTool('select')}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${tool === 'select' ? 'bg-white shadow-sm text-[#3F98FF]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MousePointer2 className="w-3 h-3" />
          </button>
          <button
            title="Pan tool"
            onClick={() => setTool('pan')}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${tool === 'pan' ? 'bg-white shadow-sm text-[#3F98FF]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Move className="w-3 h-3" />
          </button>
        </div>

        <div className="w-px h-4 bg-gray-200" />

        {/* Zoom */}
        <button onClick={handleZoomOut} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors">
          <ZoomOut className="w-3 h-3" />
        </button>
        <span className="text-[10px] font-semibold text-gray-500 w-8 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={handleZoomIn} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors">
          <ZoomIn className="w-3 h-3" />
        </button>
        <button onClick={handleResetView} title="Reset view" className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 transition-colors">
          <RotateCcw className="w-3 h-3" />
        </button>

        <div className="flex-1" />

        <span className="text-[10px] text-gray-400">{cards.length} artifact{cards.length !== 1 ? 's' : ''}</span>

        <div className="w-px h-4 bg-gray-200" />

        <button
          onClick={onClearAll}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-red-500 hover:bg-red-50 rounded-md transition-colors font-medium"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={canvasRef}
        className={`flex-1 relative overflow-hidden canvas-bg ${isPanning ? 'cursor-grabbing' : tool === 'pan' ? 'cursor-grab' : 'cursor-default'}`}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Cards layer */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            inset: 0,
          }}
        >
          {cards.map(card => (
            <CanvasCardItem
              key={card.id}
              card={card}
              isSelected={selectedId === card.id}
              onSelect={() => { setSelectedId(card.id); bringToFront(card.id); }}
              onRemove={() => { onRemoveCard(card.id); if (selectedId === card.id) setSelectedId(null); }}
              onPinToggle={() => onUpdateCard(card.id, { pinned: !card.pinned })}
              onCollapseToggle={() => onUpdateCard(card.id, { collapsed: !card.collapsed })}
              onDragStart={e => handleCardDragStart(e, card)}
              onResizeStart={e => handleCardResizeStart(e, card)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
