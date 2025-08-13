import { useState, useRef, useEffect } from 'react';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { IStorageUnit, ITextElement } from '@/types/warehouseDetail';
import { StorageTypeEnum } from '@/types';
import { cn } from '@/lib/utils';
import { StorageInfoModal } from './StorageInfoModal';
import { WAREHOUSE_CONSTANTS } from '@/constants/warehouse';

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

  // Calculate scale to fit the warehouse in the viewport
  useEffect(() => {
    const scaleX = viewportWidth / WAREHOUSE_CONSTANTS.WIDTH;
    const scaleY = viewportHeight / WAREHOUSE_CONSTANTS.HEIGHT;
    const newScale = Math.min(scaleX, scaleY) * 0.95; // 0.95 for minimal padding
    setScale(newScale);
  }, [viewportWidth, viewportHeight]);

  const handleUnitClick = (unit: IStorageUnit) => {
    setSelectedUnit(unit);
    setModalOpen(true);
  };

  const getUnitStyle = (unit: IStorageUnit) => {
    let baseColor = 'bg-blue-100';
    let borderColor = 'border-blue-300';
    
    if (unit.type_storage === StorageTypeEnum.RACK) {
      baseColor = 'bg-yellow-100';
      borderColor = 'border-yellow-300';
    } else if (unit.type_storage === StorageTypeEnum.ECERAN) {
      baseColor = 'bg-green-100';
      borderColor = 'border-green-300';
    }
    
    return cn(
      "absolute border-2 flex items-center justify-center cursor-pointer transition-all hover:opacity-80 rounded-lg",
      baseColor,
      borderColor
    );
  };

  const getTextElementStyle = (element: ITextElement) => {
    return {
      left: element.x * scale,
      top: element.y * scale,
      fontSize: `${(element.text_styling?.font_size || 16) * scale}px`,
      fontFamily: element.text_styling?.font_family || 'Arial, sans-serif',
      color: element.text_styling?.text_color || '#000000',
      transform: `rotate(${element.text_styling?.rotation || 0}deg)`,
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
          width: WAREHOUSE_CONSTANTS.WIDTH * scale,
          height: WAREHOUSE_CONSTANTS.HEIGHT * scale,
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
            }}
            onClick={() => handleUnitClick(unit)}
          >
            <span 
              className="text-center px-1 select-none"
              style={{
                fontSize: `${(unit.text_styling?.font_size || 14) * scale}px`,
                fontFamily: unit.text_styling?.font_family || 'Arial, sans-serif',
                color: unit.text_styling?.text_color || '#000000',
                transform: `rotate(${unit.text_styling?.rotation || 0}deg)`,
                display: 'inline-block',
              }}
            >
              {unit.label}
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
            {element.label}
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