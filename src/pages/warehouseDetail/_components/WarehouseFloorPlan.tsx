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
import useModal from '@/hooks/useModal';
import { ConfirmationModal } from '@/components/confirmationModal';
import { WAREHOUSE_CONSTANTS } from '@/constants/warehouse';


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
  const { isShown: isShownDelete, toggle: toggleDelete } = useModal();
  const { isShown: isShownStack, toggle: toggleStack } = useModal();
  const [pendingDelete, setPendingDelete] = useState<TAnyStorageUnit | null>(null);
  const [pendingStack, setPendingStack] = useState<{ unit: IStorageUnit; overlappedUnit: IStorageUnit } | null>(null);
  
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

  const snapToGrid = (value: number) => {
    return Math.round(value / WAREHOUSE_CONSTANTS.GRID_SIZE) * WAREHOUSE_CONSTANTS.GRID_SIZE;
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
    
    const unit = currentWarehouse.storageUnits.find((u) => u.id === active.id || (activeData?.id && u.id === activeData.id));
    
    if (unit) {
      const newX = snapToGrid(unit.x + delta.x);
      const newY = snapToGrid(unit.y + delta.y);
      
      // Keep within bounds
      if (isStorageUnit(unit)) {
        const boundedX = Math.max(0, Math.min(newX, WAREHOUSE_CONSTANTS.WIDTH - unit.width));
        const boundedY = Math.max(0, Math.min(newY, WAREHOUSE_CONSTANTS.HEIGHT - unit.height));
        
        // Check for overlap and offer stacking
        const overlappedUnit = checkOverlap(unit, boundedX, boundedY);
        if (overlappedUnit) {
          setPendingStack({ unit, overlappedUnit });
          toggleStack(true);
        } else {
          moveUnit(unit.id, boundedX, boundedY);
        }
      } else {
        // Text element - consider approximate text height (fontSize + padding)
        const textHeight = ((unit as ITextElement).textStyling?.fontSize || 16) + 10;
        const boundedX = Math.max(0, Math.min(newX, WAREHOUSE_CONSTANTS.WIDTH - 50)); // 50px buffer for text width
        const boundedY = Math.max(0, Math.min(newY, WAREHOUSE_CONSTANTS.HEIGHT - textHeight));
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
      const fontSize = 16;
      const textHeight = fontSize + 10;
      const maxY = Math.min(y, WAREHOUSE_CONSTANTS.HEIGHT - textHeight);
      const maxX = Math.min(x, WAREHOUSE_CONSTANTS.WIDTH - 50);
      
      const newTextElement: ITextElement = {
        id: Date.now(),
        type: ElementTypeEnum.TEXT,
        name: 'New Text',
        x: maxX,
        y: maxY,
        warehouseId: currentWarehouse.id,
        textStyling: {
          fontSize: fontSize,
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
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Constrain to bounds
    const x = snapToGrid(Math.max(0, Math.min(rawX, WAREHOUSE_CONSTANTS.WIDTH)));
    const y = snapToGrid(Math.max(0, Math.min(rawY, WAREHOUSE_CONSTANTS.HEIGHT)));
    
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
    
    if (width >= WAREHOUSE_CONSTANTS.GRID_SIZE && height >= WAREHOUSE_CONSTANTS.GRID_SIZE) {
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
          e.preventDefault();
          setPendingDelete(selectedUnit);
          toggleDelete(true);
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
    <div className="relative w-full h-full flex items-center justify-center overflow-auto p-4">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div 
          ref={containerRef}
          className={cn(
            "relative border border-gray-200 bg-gray-50",
            toolMode === 'select' ? "cursor-default" : 
            toolMode === 'text' ? "cursor-text" : 
            "cursor-crosshair"
          )}
          style={{
            width: WAREHOUSE_CONSTANTS.WIDTH,
            height: WAREHOUSE_CONSTANTS.HEIGHT,
            backgroundImage: `
              linear-gradient(to right, #e5e5e5 1px, transparent 1px),
              linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)
            `,
            backgroundSize: `${WAREHOUSE_CONSTANTS.GRID_SIZE}px ${WAREHOUSE_CONSTANTS.GRID_SIZE}px`,
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
      
      <ConfirmationModal
        isShown={isShownDelete}
        toggle={toggleDelete}
        title="Delete Element"
        description={pendingDelete ? `Are you sure you want to delete "${pendingDelete.name}"? This action cannot be undone.` : ''}
        onConfirm={() => {
          if (pendingDelete) {
            removeUnit(pendingDelete.id);
            selectUnit(null);
            setPendingDelete(null);
          }
        }}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
      
      <ConfirmationModal
        isShown={isShownStack}
        toggle={toggleStack}
        title="Stack Storage Units"
        description={pendingStack ? `Do you want to stack this unit on top of "${pendingStack.overlappedUnit.name}"?` : ''}
        onConfirm={() => {
          if (pendingStack) {
            stackUnits(pendingStack.unit.id, pendingStack.overlappedUnit.id);
            setPendingStack(null);
          }
        }}
        onCancel={() => {
          if (pendingStack) {
            const { unit } = pendingStack;
            const boundedX = Math.max(0, Math.min(unit.x, WAREHOUSE_CONSTANTS.WIDTH - unit.width));
            const boundedY = Math.max(0, Math.min(unit.y, WAREHOUSE_CONSTANTS.HEIGHT - unit.height));
            moveUnit(unit.id, boundedX, boundedY);
            setPendingStack(null);
          }
        }}
        confirmText="Stack"
        cancelText="Cancel"
        confirmVariant="default"
      />
    </div>
  );
};