import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Package } from 'lucide-react';
import { StorageUnit } from '@/types/warehouse';
import { cn } from '@/lib/utils';
import { useWarehouseStore } from '@/store/warehouseStore';

interface DraggableStorageUnitProps {
  unit: StorageUnit;
  onClick: () => void;
}

export function DraggableStorageUnit({ unit, onClick }: DraggableStorageUnitProps) {
  const { selectedUnit } = useWarehouseStore();
  const isSelected = selectedUnit?.id === unit.id;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: unit.id,
    data: unit,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    left: unit.x,
    top: unit.y,
    width: unit.width,
    height: unit.height,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "absolute border-2 rounded-md cursor-move flex flex-col items-center justify-center transition-all",
        "hover:shadow-lg hover:border-primary",
        isDragging ? "opacity-50 z-50" : "opacity-100",
        isSelected ? "ring-2 ring-primary ring-offset-2" : "",
        unit.color || "bg-blue-100 border-blue-300"
      )}
      {...listeners}
      {...attributes}
    >
      <Package className="h-6 w-6 text-gray-600 mb-1" />
      <span className="text-xs font-medium text-center px-1">{unit.name}</span>
      {unit.items.length > 0 && (
        <span className="text-xs text-gray-500">({unit.items.length} items)</span>
      )}
      {unit.stackLevel > 0 && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
          {unit.stackLevel}
        </div>
      )}
    </div>
  );
}