import { useState, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { DraggableStorageUnit } from './DraggableStorageUnit';
import { DraggableTextElement } from './DraggableTextElement';
import { StorageUnitDialogV2 } from './StorageUnitDialogV2';
import { TextElementDialog } from './TextElementDialog';
import { StorageUnit, TextElement } from '@/types/warehouse';
import { cn } from '@/lib/utils';

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
    removeStorageUnit,
    updateStorageUnit,
    selectedTextElement,
    selectTextElement,
    moveTextElement,
    updateTextElement,
    removeTextElement,
    addTextElement,
    toolMode
  } = useMultiWarehouseStore();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
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

  const handleDragStart = () => {
    // When dragging starts, ensure we're in a mode that shows selection
    if (toolMode !== 'select') {
      // Optionally switch to select mode when dragging
      // This is a UX decision - uncomment if you want auto-switch
      // useMultiWarehouseStore.getState().setToolMode('select');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const activeData = active.data.current as any;
    
    if (activeData?.elementType === 'text') {
      // Handle text element drag
      const textElement = layout.textElements?.find((t: TextElement) => t.id === activeData.id);
      if (textElement) {
        const newX = snapToGrid(textElement.x + delta.x);
        const newY = snapToGrid(textElement.y + delta.y);
        
        // Keep within bounds
        const boundedX = Math.max(0, Math.min(newX, layout.width - 100));
        const boundedY = Math.max(0, Math.min(newY, layout.height - 50));
        
        moveTextElement(textElement.id, boundedX, boundedY);
      }
    } else {
      // Handle storage unit drag
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
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (toolMode === 'text') {
      // Create text immediately on click
      const newTextElement: TextElement = {
        id: `text-${Date.now()}`,
        text: 'New Text',
        x: x,
        y: y,
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        rotation: 0,
        color: '#000000',
      };
      addTextElement(newTextElement);
      selectTextElement(newTextElement);
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
      selectTextElement(null);
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
      const newUnit: StorageUnit = {
        id: Date.now().toString(),
        name: `Storage ${layout.storageUnits.length + 1}`,
        x: Math.min(drawingRect.startX, drawingRect.endX),
        y: Math.min(drawingRect.startY, drawingRect.endY),
        width,
        height,
        stackLevel: 0,
        color: 'bg-blue-100 border-blue-300',
      };
      addStorageUnit(newUnit);
      selectUnit(newUnit);
    }
    
    setIsDrawing(false);
    setDrawingRect(null);
  };

  const handleUnitClick = (unit: StorageUnit) => {
    selectUnit(unit);
    selectTextElement(null);
    if (toolMode === 'select') {
      setDialogOpen(true);
    }
  };

  const handleUnitDoubleClick = (unit: StorageUnit) => {
    // Quick rename on double click
    const newName = window.prompt('Enter new name for storage unit:', unit.name);
    if (newName && newName.trim() && newName !== unit.name) {
      updateStorageUnit(unit.id, { name: newName.trim() });
    }
  };

  const handleTextClick = (element: TextElement) => {
    selectTextElement(element);
    selectUnit(null);
    if (toolMode === 'select') {
      setTextDialogOpen(true);
    }
  };

  const handleTextDoubleClick = (element: TextElement) => {
    // Quick edit on double click
    const newText = window.prompt('Enter new text:', element.text);
    if (newText && newText.trim() && newText !== element.text) {
      updateTextElement(element.id, { text: newText.trim() });
    }
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
      
      // Delete shortcut
      if (e.key === 'Delete') {
        if (selectedUnit && !dialogOpen) {
          if (window.confirm(`Delete ${selectedUnit.name}?`)) {
            removeStorageUnit(selectedUnit.id);
            selectUnit(null);
          }
        } else if (selectedTextElement && !textDialogOpen) {
          if (window.confirm(`Delete text element?`)) {
            removeTextElement(selectedTextElement.id);
            selectTextElement(null);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUnit, selectedTextElement, dialogOpen, textDialogOpen, removeStorageUnit, removeTextElement, selectUnit, selectTextElement]);

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
          {layout.storageUnits.map((unit: StorageUnit) => (
            <DraggableStorageUnit
              key={unit.id}
              unit={unit}
              onClick={() => handleUnitClick(unit)}
              onDoubleClick={() => handleUnitDoubleClick(unit)}
              isDraggable={true}
            />
          ))}
          
          {layout.textElements?.map((element: TextElement) => (
            <DraggableTextElement
              key={element.id}
              element={element}
              isSelected={selectedTextElement?.id === element.id}
              onClick={() => handleTextClick(element)}
              onDoubleClick={() => handleTextDoubleClick(element)}
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
      
      <StorageUnitDialogV2
        unit={selectedUnit}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
      
      <TextElementDialog
        element={selectedTextElement}
        open={textDialogOpen}
        onOpenChange={setTextDialogOpen}
        onUpdate={updateTextElement}
        onDelete={(id) => {
          removeTextElement(id);
          selectTextElement(null);
        }}
      />
    </div>
  );
}