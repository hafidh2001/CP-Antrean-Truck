import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useWarehouseViewStore } from '@/store/warehouseViewStore';
import { WarehouseViewFloorPlan } from './_components/WarehouseViewFloorPlan';
import { ChevronLeft, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/utils/routes';

export default function WarehouseViewPage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'desktop';
  const { loadWarehouse, currentWarehouse, isLoading, error, reset } = useWarehouseViewStore();
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (warehouseId) {
      loadWarehouse(parseInt(warehouseId));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  useEffect(() => {
    const updateViewportSize = () => {
      // Set viewport size based on mode
      if (mode === 'tablet') {
        // iPad landscape dimensions
        setViewportSize({ width: 1024, height: 768 });
      } else {
        // Desktop responsive - full window size
        setViewportSize({ 
          width: window.innerWidth, 
          height: window.innerHeight 
        });
      }
    };

    updateViewportSize();
    
    // Add resize listener for desktop mode
    if (mode === 'desktop') {
      window.addEventListener('resize', updateViewportSize);
      return () => window.removeEventListener('resize', updateViewportSize);
    }
  }, [mode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading warehouse data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={() => warehouseId && loadWarehouse(parseInt(warehouseId))}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!currentWarehouse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Warehouse not found</p>
      </div>
    );
  }

  // Desktop mode: Full screen without padding
  if (mode === 'desktop') {
    return (
      <div className="w-screen h-screen overflow-hidden bg-white">
        <WarehouseViewFloorPlan 
          viewportWidth={viewportSize.width}
          viewportHeight={viewportSize.height}
        />
      </div>
    );
  }

  // Tablet mode: With header and container
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(ROUTES.base)}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{currentWarehouse.name}</h1>
                <p className="text-sm text-muted-foreground">
                  View Mode • Tablet View
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tablet className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 bg-gray-100" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <div className="flex justify-center items-center" style={{ minHeight: 'calc(100vh - 73px - 48px)' }}>
          <div 
            className="bg-white shadow-xl overflow-hidden rounded-lg border border-gray-200"
            style={{
              width: `${viewportSize.width}px`,
              height: `${viewportSize.height}px`,
            }}
          >
            <WarehouseViewFloorPlan 
              viewportWidth={viewportSize.width}
              viewportHeight={viewportSize.height}
            />
          </div>
        </div>
      </div>
    </div>
  );
}