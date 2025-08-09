import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { IWarehouse } from '@/types/home';

interface DeleteWarehouseDialogProps {
  warehouse: IWarehouse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const DeleteWarehouseDialog = ({ 
  warehouse, 
  open, 
  onOpenChange, 
  onConfirm 
}: DeleteWarehouseDialogProps) => {
  
  if (!warehouse) return null;

  const hasStorageUnits = warehouse.layout.storageUnits.length > 0;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Hapus Gudang
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm">
            Apakah Anda yakin ingin menghapus <strong>{warehouse.name}</strong>?
          </p>
          
          {hasStorageUnits && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-sm text-amber-800">
                <strong>Perhatian:</strong> Gudang ini memiliki {warehouse.layout.storageUnits.length} storage unit
                yang akan ikut terhapus.
              </p>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Hapus Gudang
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};