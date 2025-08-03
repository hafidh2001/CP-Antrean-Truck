import { Info } from 'lucide-react';

export function WarehouseHelper() {
  return (
    <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 max-w-sm">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Click & Drag</strong> on empty space to create storage unit</p>
          <p><strong>Drag</strong> storage units to move them</p>
          <p><strong>Click</strong> on unit to manage inventory</p>
          <p><strong>Double-click</strong> on unit to rename quickly</p>
          <p><strong>Delete key</strong> to remove selected unit</p>
        </div>
      </div>
    </div>
  );
}