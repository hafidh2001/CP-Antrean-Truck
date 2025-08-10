import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { WarehouseViewFloorPlan } from './_components/WarehouseViewFloorPlan';
import { ChevronLeft, Monitor, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/utils/routes';

export default function WarehouseViewPage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'desktop';
  const { loadWarehouseFromApi, currentWarehouse, isLoading, error } = useMultiWarehouseStore();
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const loadingRef = useRef(false);

  useEffect(() => {
    if (warehouseId && !loadingRef.current) {
      loadingRef.current = true;
      loadWarehouseFromApi(parseInt(warehouseId));
    }
  }, [warehouseId]);

  useEffect(() => {
    const updateViewportSize = () => {
      // Set viewport size based on mode
      if (mode === 'tablet') {
        // iPad landscape dimensions
        setViewportSize({ width: 1024, height: 768 });
      } else {
        // Desktop dimensions - adjusted height for better fit
        setViewportSize({ width: 1200, height: 700 });
      }
    };

    updateViewportSize();
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
          <Button onClick={() => warehouseId && loadWarehouseFromApi(parseInt(warehouseId))}>
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
                  View Mode • {mode === 'tablet' ? 'Tablet' : 'Desktop'} View
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {mode === 'tablet' ? (
                <Tablet className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Monitor className="h-5 w-5 text-muted-foreground" />
              )}
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