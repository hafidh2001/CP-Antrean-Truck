import { useState } from 'react';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const WarehouseHelper = () => {
  // Always start expanded
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={cn(
        "absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border rounded-lg transition-all duration-300",
        isCollapsed ? "p-2" : "p-3 max-w-sm"
      )}
    >
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Expand helper"
        >
          <Info className="h-4 w-4" />
          <ChevronRight className="h-3 w-3" />
        </button>
      ) : (
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Keyboard Shortcuts</span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Collapse helper"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>V</strong> - Select tool (move elements)</p>
            <p><strong>R</strong> - Rectangle tool (draw storage units)</p>
            <p><strong>T</strong> - Text tool (click to add text)</p>
            <p><strong>Click selected element</strong> to edit properties</p>
            <p><strong>Delete key</strong> to remove selected element</p>
          </div>
        </div>
      )}
    </div>
  );
};