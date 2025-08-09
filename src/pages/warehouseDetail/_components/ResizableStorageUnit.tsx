import { useState, useRef, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { StorageUnit } from '@/types/warehouse';
import { cn } from '@/lib/utils';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';

interface ResizableStorageUnitProps {
  unit: StorageUnit;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isDraggable?: boolean;
}

type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | null;

export const ResizableStorageUnit = ({
  unit,
  onClick,
  onDoubleClick,
  isDraggable = true,
}: ResizableStorageUnitProps) => {
  const { updateStorageUnit, currentWarehouse } = useMultiWarehouseStore();
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  const [hoveredDirection, setHoveredDirection] = useState<ResizeDirection>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const gridSize = currentWarehouse?.layout.gridSize || 20;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: unit.id,
    disabled: !isDraggable || isResizing || hoveredDirection !== null,
  });

  const snapToGrid = (value: number) => {
    return Math.round(value / gridSize) * gridSize;
  };

  const getResizeDirection = (e: React.MouseEvent<HTMLDivElement>): ResizeDirection => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    
    // Half grid size = 10px (since grid is 20px)
    const halfGrid = gridSize / 2;
    
    // Use half grid for all sizes - consistent small resize area
    const adjustedEdge = Math.min(halfGrid, 10);
    const adjustedCorner = Math.min(halfGrid, 10);
    
    // Check corners first
    if (x < adjustedCorner && y < adjustedCorner) return 'nw';
    if (x > width - adjustedCorner && y < adjustedCorner) return 'ne';
    if (x > width - adjustedCorner && y > height - adjustedCorner) return 'se';
    if (x < adjustedCorner && y > height - adjustedCorner) return 'sw';
    
    // Then edges
    if (y < adjustedEdge) return 'n';
    if (x > width - adjustedEdge) return 'e';
    if (y > height - adjustedEdge) return 's';
    if (x < adjustedEdge) return 'w';
    
    return null;
  };

  const getCursor = (direction: ResizeDirection): string => {
    if (!direction) return 'move';
    const cursors: Record<NonNullable<ResizeDirection>, string> = {
      'n': 'ns-resize',
      's': 'ns-resize',
      'e': 'ew-resize',
      'w': 'ew-resize',
      'nw': 'nwse-resize',
      'se': 'nwse-resize',
      'ne': 'nesw-resize',
      'sw': 'nesw-resize',
    };
    return cursors[direction];
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isResizing) {
      const direction = getResizeDirection(e);
      setHoveredDirection(direction);
    }
  }, [isResizing]);

  const startResize = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const direction = getResizeDirection(e);
    if (direction) {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeDirection(direction);
      
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = unit.width;
      const startHeight = unit.height;
      const startLeft = unit.x;
      const startTop = unit.y;
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!currentWarehouse) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newX = startLeft;
        let newY = startTop;
        let newWidth = startWidth;
        let newHeight = startHeight;
        
        // Calculate new dimensions based on resize direction
        if (direction.includes('e')) {
          newWidth = Math.max(gridSize * 2, snapToGrid(startWidth + deltaX));
        }
        if (direction.includes('w')) {
          const potentialWidth = startWidth - deltaX;
          if (potentialWidth >= gridSize * 2) {
            newWidth = snapToGrid(potentialWidth);
            newX = snapToGrid(startLeft + deltaX);
          }
        }
        if (direction.includes('s')) {
          newHeight = Math.max(gridSize * 2, snapToGrid(startHeight + deltaY));
        }
        if (direction.includes('n')) {
          const potentialHeight = startHeight - deltaY;
          if (potentialHeight >= gridSize * 2) {
            newHeight = snapToGrid(potentialHeight);
            newY = snapToGrid(startTop + deltaY);
          }
        }
        
        // Constrain to canvas bounds
        newX = Math.max(0, Math.min(newX, currentWarehouse.layout.width - newWidth));
        newY = Math.max(0, Math.min(newY, currentWarehouse.layout.height - newHeight));
        
        // Update dimensions
        updateStorageUnit(unit.id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      };
      
      const handleMouseUp = () => {
        setIsResizing(false);
        setResizeDirection(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [unit, currentWarehouse, gridSize, updateStorageUnit]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isResizing && !getResizeDirection(e)) {
      e.stopPropagation();
      onClick?.();
    }
  }, [isResizing, onClick]);

  const style = {
    position: 'absolute' as const,
    left: unit.x,
    top: unit.y,
    width: unit.width,
    height: unit.height,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: unit.stackLevel * 10 + (isDragging ? 1000 : 0),
    cursor: getCursor(hoveredDirection),
  };

  const unitColor = unit.type === 'rack' ? 'bg-yellow-100 border-yellow-500' : 'bg-blue-100 border-blue-500';

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node as HTMLDivElement;
      }}
      style={style}
      className={cn(
        'border-2 rounded flex items-center justify-center transition-all select-none relative',
        unitColor,
        isDragging && 'opacity-50',
        'hover:shadow-md'
      )}
      onMouseDown={startResize}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredDirection(null)}
      onClick={handleClick}
      onDoubleClick={(e) => {
        if (!isResizing) {
          e.stopPropagation();
          onDoubleClick?.();
        }
      }}
      {...(isDraggable && !isResizing && !hoveredDirection ? listeners : {})}
      {...attributes}
    >
      <span 
        className="text-xs font-medium text-center px-1 pointer-events-none"
        style={{
          transform: unit.rotation ? `rotate(${unit.rotation}deg)` : undefined,
        }}
      >
        {unit.name}
      </span>

      {/* Visual indicators for resize areas - half grid size (10px) */}
      {hoveredDirection && (
        <div className="absolute inset-0 pointer-events-none">
          {hoveredDirection.includes('n') && (
            <div 
              className="absolute top-0 left-0 right-0 bg-blue-500 opacity-20" 
              style={{ height: `${gridSize / 2}px` }}
            />
          )}
          {hoveredDirection.includes('s') && (
            <div 
              className="absolute bottom-0 left-0 right-0 bg-blue-500 opacity-20"
              style={{ height: `${gridSize / 2}px` }}
            />
          )}
          {hoveredDirection.includes('e') && (
            <div 
              className="absolute right-0 top-0 bottom-0 bg-blue-500 opacity-20"
              style={{ width: `${gridSize / 2}px` }}
            />
          )}
          {hoveredDirection.includes('w') && (
            <div 
              className="absolute left-0 top-0 bottom-0 bg-blue-500 opacity-20"
              style={{ width: `${gridSize / 2}px` }}
            />
          )}
        </div>
      )}
    </div>
  );
};