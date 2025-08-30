import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IStorageUnit } from '@/types/warehouseDetail';
import { Package, Palette, Info } from 'lucide-react';
import { StorageTypeEnum } from '@/types';

interface StorageInfoModalProps {
  unit: IStorageUnit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StorageInfoModal = ({ unit, open, onOpenChange }: StorageInfoModalProps) => {
  if (!unit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Storage Unit Information
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">{unit.label}</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Position:</span>
                <span className="font-medium">({unit.x}, {unit.y})</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">{unit.width} × {unit.height}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Palette className={cn(
                  "h-4 w-4",
                  unit.type_storage === StorageTypeEnum.WAREHOUSE 
                    ? "text-blue-500" 
                    : "text-yellow-500"
                )} />
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">
                  {unit.type_storage === StorageTypeEnum.WAREHOUSE ? 'Warehouse' : 'Rack'}
                </span>
              </div>
              
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            View mode - Read only
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function
const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');