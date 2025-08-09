import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ITextElement } from '@/types/warehouseDetail';
import { cn } from '@/lib/utils';

interface DraggableTextElementProps {
  element: ITextElement;
  isSelected: boolean;
  onClick: () => void;
  isDraggable?: boolean;
}

export const DraggableTextElement = ({ element, isSelected, onClick, isDraggable = true }: DraggableTextElementProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element.id,
    data: element,
    disabled: !isDraggable,
  });

  const rotation = element.textStyling?.rotation || 0;
  
  const style = {
    transform: CSS.Translate.toString(transform),
    left: element.x,
    top: element.y,
  };

  const innerStyle = {
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center',
    display: 'inline-block',
    fontSize: `${element.textStyling?.fontSize || 16}px`,
    fontFamily: element.textStyling?.fontFamily || 'Arial, sans-serif',
    color: element.textStyling?.textColor || '#000000',
    lineHeight: 1.2,
    whiteSpace: 'nowrap' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute select-none",
        "cursor-move", // Always show move cursor since dragging is always enabled
        isDragging ? "opacity-50 z-50" : "",
        "hover:opacity-80 transition-opacity"
      )}
      {...listeners}
      {...attributes}
    >
      <div 
        style={innerStyle}
        className={cn(
          isSelected && "outline outline-2 outline-primary outline-offset-2"
        )}
      >
        {element.name}
      </div>
    </div>
  );
};