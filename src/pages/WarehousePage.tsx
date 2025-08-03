import { WarehouseFloorPlan } from '@/components/warehouse/WarehouseFloorPlan';
import { WarehouseToolbar } from '@/components/warehouse/WarehouseToolbar';
import { WarehouseHelper } from '@/components/warehouse/WarehouseHelper';

export function WarehousePage() {
  return (
    <div className="relative w-screen h-screen bg-background overflow-hidden">
      <WarehouseToolbar />
      <WarehouseFloorPlan />
      <WarehouseHelper />
    </div>
  );
}