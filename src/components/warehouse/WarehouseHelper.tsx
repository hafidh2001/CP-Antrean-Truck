import { Info } from 'lucide-react';

export function WarehouseHelper() {
  return (
    <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 max-w-sm">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>V</strong> - Select tool (move elements)</p>
          <p><strong>R</strong> - Rectangle tool (draw storage units)</p>
          <p><strong>T</strong> - Text tool (click to add text)</p>
          <p><strong>Double-click</strong> to quickly edit names</p>
          <p><strong>Delete key</strong> to remove selected element</p>
        </div>
      </div>
    </div>
  );
}