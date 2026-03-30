import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
// You may want to use a drag-and-drop library like react-beautiful-dnd or dnd-kit

interface SortPanelsModalProps {
  open: boolean;
  onClose: () => void;
  panelViews: string[];
  panelLabels: string[];
  onReorder: (newOrder: string[]) => void;
}

export const SortPanelsModal: React.FC<SortPanelsModalProps> = ({
  open,
  onClose,
  panelViews,
  panelLabels,
  onReorder,
}) => {
  // For now, just show a static list. Drag-and-drop to be added.
  const [order, setOrder] = useState(panelViews);

  useEffect(() => {
    setOrder(panelViews);
  }, [panelViews]);


  // dnd-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = order.indexOf(active.id);
      const newIndex = order.indexOf(over.id);
      setOrder((items) => arrayMove(items, oldIndex, newIndex));
    }
  }

  function SortableItem({ id, label }: { id: string; label: string }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 10 : undefined,
    };
    return (
      <div ref={setNodeRef} style={style} className="p-2 bg-muted rounded border flex items-center">
        <span className="flex-1">{label}</span>
        <span className="cursor-move text-gray-400" {...attributes} {...listeners}>≡</span>
      </div>
    );
  }

  const handleSave = () => {
    onReorder(order);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sort Panels</DialogTitle>
        </DialogHeader>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2 py-2">
              {order.map((panel, idx) => (
                <SortableItem key={panel} id={panel} label={panelLabels[panelViews.indexOf(panel)] || panel} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
