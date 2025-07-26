import { useState } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useWarehouseStore } from '@/store/warehouseStore';
import { DraggableStorageUnit } from './DraggableStorageUnit';
import { StorageUnitDialog } from './StorageUnitDialog';
import { Button } from '@/components/ui/button';
import { Square, RectangleHorizontal } from 'lucide-react';
import { StorageUnit } from '@/types/warehouse';

export function WarehouseFloorPlan() {
  const { layout, addStorageUnit, moveStorageUnit, selectUnit, selectedUnit, checkOverlap, stackUnits } = useWarehouseStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const addNewStorageUnit = (type: 'square' | 'rectangle') => {
    const size = type === 'square' ? 80 : { width: 120, height: 80 };
    const newUnit: StorageUnit = {
      id: Date.now().toString(),
      name: `Storage ${layout.storageUnits.length + 1}`,
      x: snapToGrid(Math.random() * (layout.width - 100)),
      y: snapToGrid(Math.random() * (layout.height - 100)),
      width: type === 'square' ? size : (size as any).width,
      height: type === 'square' ? size : (size as any).height,
      items: [],
      stackLevel: 0,
      color: type === 'square' ? 'bg-blue-100 border-blue-300' : 'bg-green-100 border-green-300',
    };
    addStorageUnit(newUnit);
  };

  const handleUnitClick = (unit: StorageUnit) => {
    selectUnit(unit);
    setDialogOpen(true);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-2">
        <Button onClick={() => addNewStorageUnit('square')} variant="outline">
          <Square className="h-4 w-4 mr-2" />
          Add Square Storage
        </Button>
        <Button onClick={() => addNewStorageUnit('rectangle')} variant="outline">
          <RectangleHorizontal className="h-4 w-4 mr-2" />
          Add Rectangle Storage
        </Button>
      </div>
      
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div 
          className="relative border-2 border-gray-300 rounded-lg overflow-hidden"
          style={{
            width: layout.width,
            height: layout.height,
            backgroundImage: `
              linear-gradient(to right, #f0f0f0 1px, transparent 1px),
              linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
            `,
            backgroundSize: `${layout.gridSize}px ${layout.gridSize}px`,
          }}
        >
          {layout.storageUnits.map((unit: StorageUnit) => (
            <DraggableStorageUnit
              key={unit.id}
              unit={unit}
              onClick={() => handleUnitClick(unit)}
            />
          ))}
        </div>
      </DndContext>
      
      <StorageUnitDialog
        unit={selectedUnit}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}