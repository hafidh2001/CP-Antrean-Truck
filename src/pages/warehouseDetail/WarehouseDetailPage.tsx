import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WarehouseFloorPlan } from './_components/WarehouseFloorPlan';
import { WarehouseToolbar } from './_components/WarehouseToolbar';
import { WarehouseHelper } from './_components/WarehouseHelper';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function WarehouseDetailPage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const { loadWarehouseFromApi, currentWarehouse, isLoading, error } = useMultiWarehouseStore();
  const loadingRef = useRef(false);

  useEffect(() => {
    if (warehouseId && !loadingRef.current) {
      loadingRef.current = true;
      loadWarehouseFromApi(parseInt(warehouseId));
    }
  }, [warehouseId]);

  const handleBack = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading warehouse...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={() => warehouseId && loadWarehouseFromApi(parseInt(warehouseId))}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!currentWarehouse) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Warehouse not found</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Header with warehouse name and back button */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
        <Button onClick={handleBack} size="sm" variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-lg font-semibold">{currentWarehouse.name}</h2>
      </div>
      
      <WarehouseToolbar />
      <WarehouseFloorPlan />
      <WarehouseHelper />
    </div>
  );
}