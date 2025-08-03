import { useState, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { DraggableStorageUnit } from './DraggableStorageUnit';
import { StorageUnitDialogV2 } from './StorageUnitDialogV2';
import { StorageUnit } from '@/types/warehouse';

interface DrawingRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function WarehouseFloorPlanV2() {
  const { 
    currentWarehouse, 
    addStorageUnit, 
    moveStorageUnit, 
    selectUnit, 
    selectedUnit, 
    checkOverlap, 
    stackUnits, 
    removeStorageUnit 
  } = useMultiWarehouseStore();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingRect, setDrawingRect] = useState<DrawingRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (!currentWarehouse) {
    return <div>Loading...</div>;
  }

  const { layout } = currentWarehouse;

  const snapToGrid = (value: number) => {
    return Math.round(value / layout.gridSize) * layout.gridSize;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const unit = layout.storageUnits.find((u: StorageUnit) => u.id === active.id);
    
    if (unit) {
      const newX = snapToGrid(unit.x + delta.x);
      const newY = snapToGrid(unit.y + delta.y);
      
      // Keep within bounds
      const boundedX = Math.max(0, Math.min(newX, layout.width - unit.width));
      const boundedY = Math.max(0, Math.min(newY, layout.height - unit.height));
      
      // Check for overlap and offer stacking
      const overlappedUnit = checkOverlap(unit, boundedX, boundedY);
      if (overlappedUnit && window.confirm(`Stack on top of ${overlappedUnit.name}?`)) {
        stackUnits(unit.id, overlappedUnit.id);
      } else {
        moveStorageUnit(unit.id, boundedX, boundedY);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left);
    const y = snapToGrid(e.clientY - rect.top);
    
    setIsDrawing(true);
    setDrawingRect({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawingRect) return;
    
    const rect = containerRef.current!.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left);
    const y = snapToGrid(e.clientY - rect.top);
    
    setDrawingRect({
      ...drawingRect,
      endX: x,
      endY: y,
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !drawingRect) return;
    
    const width = Math.abs(drawingRect.endX - drawingRect.startX);
    const height = Math.abs(drawingRect.endY - drawingRect.startY);
    
    if (width >= layout.gridSize && height >= layout.gridSize) {
      const newUnit: StorageUnit = {
        id: Date.now().toString(),
        name: `Storage ${layout.storageUnits.length + 1}`,
        x: Math.min(drawingRect.startX, drawingRect.endX),
        y: Math.min(drawingRect.startY, drawingRect.endY),
        width,
        height,
        items: [],
        stackLevel: 0,
        color: 'bg-blue-100 border-blue-300',
      };
      addStorageUnit(newUnit);
    }
    
    setIsDrawing(false);
    setDrawingRect(null);
  };

  const handleUnitClick = (unit: StorageUnit) => {
    selectUnit(unit);
    setDialogOpen(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedUnit && !dialogOpen) {
        if (window.confirm(`Delete ${selectedUnit.name}?`)) {
          removeStorageUnit(selectedUnit.id);
          selectUnit(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUnit, dialogOpen, removeStorageUnit, selectUnit]);

  const getDrawingRectStyle = () => {
    if (!drawingRect) return {};
    
    const x = Math.min(drawingRect.startX, drawingRect.endX);
    const y = Math.min(drawingRect.startY, drawingRect.endY);
    const width = Math.abs(drawingRect.endX - drawingRect.startX);
    const height = Math.abs(drawingRect.endY - drawingRect.startY);
    
    return {
      left: x,
      top: y,
      width,
      height,
    };
  };

  return (
    <div className="relative w-full h-full">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div 
          ref={containerRef}
          className="relative w-full h-full border-2 border-gray-300 overflow-hidden cursor-crosshair"
          style={{
            backgroundImage: `
              linear-gradient(to right, #f0f0f0 1px, transparent 1px),
              linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
            `,
            backgroundSize: `${layout.gridSize}px ${layout.gridSize}px`,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {layout.storageUnits.map((unit: StorageUnit) => (
            <DraggableStorageUnit
              key={unit.id}
              unit={unit}
              onClick={() => handleUnitClick(unit)}
            />
          ))}
          
          {isDrawing && drawingRect && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-200 opacity-30 pointer-events-none"
              style={getDrawingRectStyle()}
            />
          )}
        </div>
      </DndContext>
      
      <StorageUnitDialogV2
        unit={selectedUnit}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}