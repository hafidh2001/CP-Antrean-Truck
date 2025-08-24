import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { IStorageUnit } from '@/types/warehouseDetail';
import { StorageTypeEnum } from '@/types';
import { cn } from '@/lib/utils';
import { useWarehouseDetailStore } from '@/store/warehouseDetailStore';

interface DraggableStorageUnitProps {
  unit: IStorageUnit;
  onClick: () => void;
  onDoubleClick?: () => void;
  isDraggable?: boolean;
}

export const DraggableStorageUnit = ({ unit, onClick, onDoubleClick, isDraggable = true }: DraggableStorageUnitProps) => {
  const { selectedUnit } = useWarehouseDetailStore();
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

  // Determine background color based on typeStorage
  const backgroundColor = unit.type_storage === StorageTypeEnum.RACK 
    ? 'bg-yellow-100 border-yellow-300' 
    : unit.type_storage === StorageTypeEnum.ECERAN
    ? 'bg-green-100 border-green-300'
    : 'bg-blue-100 border-blue-300';

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "absolute border rounded flex items-center justify-center transition-all",
        "cursor-move", // Always show move cursor since dragging is always enabled
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
          transform: unit.text_styling?.rotation ? `rotate(${unit.text_styling.rotation}deg)` : undefined,
          transformOrigin: 'center',
          fontSize: unit.text_styling?.font_size ? `${unit.text_styling.font_size}px` : undefined,
          fontFamily: unit.text_styling?.font_family,
          color: unit.text_styling?.text_color,
        }}
      >
        {unit.label}
      </span>
    </div>
  );
};