import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WarehouseFloorPlanV2 } from '@/components/warehouse/WarehouseFloorPlanV2';
import { WarehouseToolbar } from '@/components/warehouse/WarehouseToolbar';
import { WarehouseHelper } from '@/components/warehouse/WarehouseHelper';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export interface WarehousePageProps {}

export default function WarehousePage(_props: WarehousePageProps = {}) {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const { loadWarehouses, setCurrentWarehouse, currentWarehouse } = useMultiWarehouseStore();

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  useEffect(() => {
    if (warehouseId) {
      setCurrentWarehouse(warehouseId);
    }
  }, [warehouseId, setCurrentWarehouse]);

  const handleBack = () => {
    navigate('/');
  };

  if (!currentWarehouse) {
    return <div>Loading warehouse...</div>;
  }

  return (
    <div className="relative w-screen h-screen bg-background overflow-hidden">
      {/* Header with warehouse name and back button */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
        <Button onClick={handleBack} size="sm" variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-lg font-semibold">{currentWarehouse.name}</h2>
      </div>
      
      <WarehouseToolbar />
      <WarehouseFloorPlanV2 />
      <WarehouseHelper />
    </div>
  );
}