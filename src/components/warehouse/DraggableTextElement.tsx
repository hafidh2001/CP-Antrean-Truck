import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TextElement } from '@/types/warehouse';
import { cn } from '@/lib/utils';

interface DraggableTextElementProps {
  element: TextElement;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
  isDraggable?: boolean;
}

export function DraggableTextElement({ element, isSelected, onClick, onDoubleClick, isDraggable = true }: DraggableTextElementProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `text-${element.id}`,
    data: { ...element, elementType: 'text' },
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    left: element.x,
    top: element.y,
    fontSize: `${element.fontSize}px`,
    fontFamily: element.fontFamily,
    color: element.color || '#000000',
    lineHeight: 1.2,
  };

  const textStyle = {
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: 'center',
    display: 'inline-block',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "absolute select-none",
        isDraggable ? "cursor-move" : "cursor-pointer",
        isDragging ? "opacity-50 z-50" : "",
        "hover:opacity-80 transition-opacity"
      )}
      {...listeners}
      {...attributes}
    >
      <span style={textStyle}>
        {element.text}
      </span>
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-primary"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-primary"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-primary"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}