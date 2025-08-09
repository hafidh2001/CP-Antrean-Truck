import { useState, useRef, useEffect } from 'react';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { IStorageUnit, ITextElement } from '@/types/warehouseDetail';
import { StorageTypeEnum } from '@/types';
import { cn } from '@/lib/utils';
import { StorageInfoModal } from './StorageInfoModal';

interface WarehouseViewFloorPlanProps {
  viewportWidth: number;
  viewportHeight: number;
}

export const WarehouseViewFloorPlan = ({ viewportWidth, viewportHeight }: WarehouseViewFloorPlanProps) => {
  const { currentWarehouse, getStorageUnits, getTextElements } = useMultiWarehouseStore();
  const [selectedUnit, setSelectedUnit] = useState<IStorageUnit | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  if (!currentWarehouse) {
    return <div>Loading...</div>;
  }

  const { layout } = currentWarehouse;

  // Calculate scale to fit the warehouse in the viewport
  useEffect(() => {
    const scaleX = viewportWidth / layout.width;
    const scaleY = viewportHeight / layout.height;
    const newScale = Math.min(scaleX, scaleY) * 0.95; // 0.95 for minimal padding
    setScale(newScale);
  }, [viewportWidth, viewportHeight, layout.width, layout.height]);

  const handleUnitClick = (unit: IStorageUnit) => {
    setSelectedUnit(unit);
    setModalOpen(true);
  };

  const getUnitStyle = (unit: IStorageUnit) => {
    const baseColor = unit.typeStorage === StorageTypeEnum.WAREHOUSE ? 'bg-blue-100' : 'bg-yellow-100';
    const borderColor = unit.typeStorage === StorageTypeEnum.WAREHOUSE ? 'border-blue-300' : 'border-yellow-300';
    
    return cn(
      "absolute border-2 flex items-center justify-center cursor-pointer transition-all hover:opacity-80",
      baseColor,
      borderColor,
      unit.stackLevel && unit.stackLevel > 0 && "shadow-lg"
    );
  };

  const getTextElementStyle = (element: ITextElement) => {
    return {
      left: element.x * scale,
      top: element.y * scale,
      fontSize: `${(element.textStyling?.fontSize || 16) * scale}px`,
      fontFamily: element.textStyling?.fontFamily || 'Arial, sans-serif',
      color: element.textStyling?.textColor || '#000000',
      transform: `rotate(${element.textStyling?.rotation || 0}deg)`,
      transformOrigin: 'center',
      whiteSpace: 'nowrap' as const,
    };
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div 
        ref={containerRef}
        className="relative bg-white"
        style={{
          width: layout.width * scale,
          height: layout.height * scale,
        }}
      >
        {/* Storage Units */}
        {getStorageUnits().map((unit) => (
          <div
            key={unit.id}
            className={getUnitStyle(unit)}
            style={{
              left: unit.x * scale,
              top: unit.y * scale,
              width: unit.width * scale,
              height: unit.height * scale,
              zIndex: unit.stackLevel || 0,
            }}
            onClick={() => handleUnitClick(unit)}
          >
            <span 
              className="text-center px-1 select-none"
              style={{
                fontSize: `${(unit.textStyling?.fontSize || 14) * scale}px`,
                fontFamily: unit.textStyling?.fontFamily || 'Arial, sans-serif',
                color: unit.textStyling?.textColor || '#000000',
                transform: `rotate(${unit.textStyling?.rotation || 0}deg)`,
                display: 'inline-block',
              }}
            >
              {unit.name}
            </span>
          </div>
        ))}

        {/* Text Elements */}
        {getTextElements().map((element) => (
          <div
            key={element.id}
            className="absolute select-none"
            style={getTextElementStyle(element)}
          >
            {element.name}
          </div>
        ))}
      </div>

      {/* Storage Info Modal */}
      <StorageInfoModal
        unit={selectedUnit}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};