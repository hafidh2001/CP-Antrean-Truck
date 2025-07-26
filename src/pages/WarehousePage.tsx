import { WarehouseFloorPlan } from '@/components/warehouse/WarehouseFloorPlan';
import { WarehouseToolbar } from '@/components/warehouse/WarehouseToolbar';
import { Warehouse } from 'lucide-react';

export function WarehousePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Warehouse className="h-8 w-8" />
            Warehouse Floor Plan Manager
          </h1>
          <p className="text-muted-foreground mt-2">
            Drag and drop storage units to organize your warehouse layout. Click on units to manage inventory.
          </p>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm border">
          <WarehouseToolbar />
          <WarehouseFloorPlan />
        </div>
      </div>
    </div>
  );
}