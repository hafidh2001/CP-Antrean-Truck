import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { StorageUnit } from '@/types/warehouse';
import { cn } from '@/lib/utils';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';

interface DraggableStorageUnitProps {
  unit: StorageUnit;
  onClick: () => void;
  onDoubleClick?: () => void;
  isDraggable?: boolean;
}

export function DraggableStorageUnit({ unit, onClick, onDoubleClick, isDraggable = true }: DraggableStorageUnitProps) {
  const { selectedUnit } = useMultiWarehouseStore();
  const isSelected = selectedUnit?.id === unit.id;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: unit.id,
    data: unit,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    left: unit.x,
    top: unit.y,
    width: unit.width,
    height: unit.height,
  };

  // Determine background color based on type or color property
  const backgroundColor = unit.type === 'rack' ? 'bg-yellow-100 border-yellow-300' : 
                         unit.type === 'warehouse' ? 'bg-blue-100 border-blue-300' :
                         unit.color || 'bg-blue-100 border-blue-300';

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "absolute border rounded flex items-center justify-center transition-all",
        isDraggable ? "cursor-move" : "cursor-pointer",
        "hover:border-gray-400",
        isDragging ? "opacity-50 z-50" : "opacity-100",
        isSelected ? "ring-2 ring-primary ring-offset-2" : "",
        backgroundColor
      )}
      {...listeners}
      {...attributes}
    >
      <span 
        className="text-sm font-medium text-center px-2 py-1 select-none"
        style={{
          transform: unit.rotation ? `rotate(${unit.rotation}deg)` : undefined,
          transformOrigin: 'center',
        }}
      >
        {unit.name}
      </span>
      {unit.stackLevel > 0 && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
          {unit.stackLevel}
        </div>
      )}
    </div>
  );
}