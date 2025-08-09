import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { WarehouseViewFloorPlan } from './_components/WarehouseViewFloorPlan';
import { ChevronLeft, Monitor, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WarehouseViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'desktop';
  const { setCurrentWarehouse, currentWarehouse, loadWarehouses } = useMultiWarehouseStore();
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    loadWarehouses();
    if (id) {
      setCurrentWarehouse(Number(id));
    }
  }, [id, setCurrentWarehouse, loadWarehouses]);

  useEffect(() => {
    const updateViewportSize = () => {
      // Set viewport size based on mode
      if (mode === 'tablet') {
        // iPad landscape dimensions
        setViewportSize({ width: 1024, height: 768 });
      } else {
        // Desktop dimensions
        setViewportSize({ width: 1200, height: 800 });
      }
    };

    updateViewportSize();
  }, [mode]);

  if (!currentWarehouse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading warehouse data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div 
            className="bg-white rounded-lg shadow-lg overflow-hidden"
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