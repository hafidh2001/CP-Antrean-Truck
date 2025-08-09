import { useState, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { ResizableStorageUnit } from './ResizableStorageUnit';
import { DraggableTextElement } from './DraggableTextElement';
import { StorageUnitDialog } from './StorageUnitDialog';
import { TextElementDialog } from './TextElementDialog';
import { IStorageUnit, ITextElement, IDrawingRect, TAnyStorageUnit } from '@/types/warehouseDetail';
import { ElementTypeEnum, StorageTypeEnum } from '@/types';
import { isStorageUnit, isTextElement } from '@/functions/warehouseHelpers';
import { cn } from '@/lib/utils';


export const WarehouseFloorPlan = () => {
  const { 
    currentWarehouse, 
    addUnit, 
    moveUnit, 
    selectUnit, 
    selectedUnit, 
    checkOverlap, 
    stackUnits, 
    removeUnit,
    updateUnit,
    toolMode,
    getStorageUnits,
    getTextElements
  } = useMultiWarehouseStore();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingRect, setDrawingRect] = useState<IDrawingRect | null>(null);
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

  const handleDragStart = () => {
    // When dragging starts, ensure we're in a mode that shows selection
    if (toolMode !== 'select') {
      // Optionally switch to select mode when dragging
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const activeData = active.data.current as TAnyStorageUnit | undefined;
    
    const unit = layout.storageUnits.find((u) => u.id === active.id || (activeData?.id && u.id === activeData.id));
    
    if (unit) {
      const newX = snapToGrid(unit.x + delta.x);
      const newY = snapToGrid(unit.y + delta.y);
      
      // Keep within bounds
      if (isStorageUnit(unit)) {
        const boundedX = Math.max(0, Math.min(newX, layout.width - unit.width));
        const boundedY = Math.max(0, Math.min(newY, layout.height - unit.height));
        
        // Check for overlap and offer stacking
        const overlappedUnit = checkOverlap(unit, boundedX, boundedY);
        if (overlappedUnit && window.confirm(`Stack on top of ${overlappedUnit.name}?`)) {
          stackUnits(unit.id, overlappedUnit.id);
        } else {
          moveUnit(unit.id, boundedX, boundedY);
        }
      } else {
        // Text element - allow positioning up to the edge
        const boundedX = Math.max(0, Math.min(newX, layout.width));
        const boundedY = Math.max(0, Math.min(newY, layout.height));
        moveUnit(unit.id, boundedX, boundedY);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (toolMode === 'text') {
      // Create text immediately on click
      const newTextElement: ITextElement = {
        id: Date.now(),
        type: ElementTypeEnum.TEXT,
        name: 'New Text',
        x: x,
        y: y,
        warehouseId: currentWarehouse.id,
        textStyling: {
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          rotation: 0,
          textColor: '#000000',
        }
      };
      addUnit(newTextElement);
      selectUnit(newTextElement);
      setTextDialogOpen(true);
    } else if (toolMode === 'rectangle') {
      // Start drawing rectangle
      const snappedX = snapToGrid(x);
      const snappedY = snapToGrid(y);
      setIsDrawing(true);
      setDrawingRect({
        startX: snappedX,
        startY: snappedY,
        endX: snappedX,
        endY: snappedY,
      });
    } else if (toolMode === 'select') {
      // Clear selection when clicking on empty space
      selectUnit(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawingRect || toolMode !== 'rectangle') return;
    
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
    if (!isDrawing || !drawingRect || toolMode !== 'rectangle') return;
    
    const width = Math.abs(drawingRect.endX - drawingRect.startX);
    const height = Math.abs(drawingRect.endY - drawingRect.startY);
    
    if (width >= layout.gridSize && height >= layout.gridSize) {
      const newUnit: IStorageUnit = {
        id: Date.now(),
        type: ElementTypeEnum.STORAGE,
        name: `Storage ${getStorageUnits().length + 1}`,
        x: Math.min(drawingRect.startX, drawingRect.endX),
        y: Math.min(drawingRect.startY, drawingRect.endY),
        warehouseId: currentWarehouse.id,
        width,
        height,
        stackLevel: 0,
        typeStorage: StorageTypeEnum.WAREHOUSE,
        textStyling: {
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          rotation: 0,
          textColor: '#000000',
        }
      };
      addUnit(newUnit);
      selectUnit(newUnit);
    }
    
    setIsDrawing(false);
    setDrawingRect(null);
  };

  const handleUnitClick = (unit: IStorageUnit) => {
    selectUnit(unit);
    setDialogOpen(true);
  };

  const handleTextClick = (element: ITextElement) => {
    selectUnit(element);
    setTextDialogOpen(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const store = useMultiWarehouseStore.getState();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts
      if (!dialogOpen && !textDialogOpen) {
        if (e.key === 'v' || e.key === 'V') {
          store.setToolMode('select');
        } else if (e.key === 'r' || e.key === 'R') {
          store.setToolMode('rectangle');
        } else if (e.key === 't' || e.key === 'T') {
          store.setToolMode('text');
        }
      }
      
      // Escape shortcut to deselect
      if (e.key === 'Escape') {
        if (selectedUnit && !dialogOpen && !textDialogOpen) {
          selectUnit(null);
        }
      }
      
      // Delete shortcut
      if (e.key === 'Delete') {
        if (selectedUnit && !dialogOpen && !textDialogOpen) {
          if (window.confirm(`Delete ${selectedUnit.name}?`)) {
            removeUnit(selectedUnit.id);
            selectUnit(null);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUnit, dialogOpen, textDialogOpen, removeUnit, selectUnit]);

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
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div 
          ref={containerRef}
          className={cn(
            "relative w-full h-full border border-gray-200 overflow-hidden bg-gray-50",
            toolMode === 'select' ? "cursor-default" : 
            toolMode === 'text' ? "cursor-text" : 
            "cursor-crosshair"
          )}
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e5e5 1px, transparent 1px),
              linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)
            `,
            backgroundSize: `${layout.gridSize}px ${layout.gridSize}px`,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {getStorageUnits().map((unit) => (
            <ResizableStorageUnit
              key={unit.id}
              unit={unit}
              onClick={() => handleUnitClick(unit)}
              isDraggable={true}
            />
          ))}
          
          {getTextElements().map((element) => (
            <DraggableTextElement
              key={element.id}
              element={element}
              isSelected={selectedUnit?.id === element.id}
              onClick={() => handleTextClick(element)}
              isDraggable={true}
            />
          ))}
          
          {isDrawing && drawingRect && (
            <div
              className="absolute border border-blue-500 bg-blue-500 opacity-10 pointer-events-none"
              style={getDrawingRectStyle()}
            />
          )}
        </div>
      </DndContext>
      
      <StorageUnitDialog
        unit={selectedUnit && isStorageUnit(selectedUnit) ? selectedUnit : null}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={(updates) => {
          if (selectedUnit) {
            updateUnit(selectedUnit.id, updates);
          }
        }}
        onDelete={() => {
          if (selectedUnit) {
            removeUnit(selectedUnit.id);
            setDialogOpen(false);
          }
        }}
      />
      
      <TextElementDialog
        element={selectedUnit && isTextElement(selectedUnit) ? selectedUnit : null}
        open={textDialogOpen}
        onOpenChange={setTextDialogOpen}
        onUpdate={(updates) => {
          if (selectedUnit) {
            updateUnit(selectedUnit.id, updates);
          }
        }}
        onDelete={() => {
          if (selectedUnit) {
            removeUnit(selectedUnit.id);
            setTextDialogOpen(false);
          }
        }}
      />
    </div>
  );
};