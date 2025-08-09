import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Warehouse } from 'lucide-react';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';


interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateWarehouse: (name: string, description: string) => void;
}

export const WarehouseDialog = ({ open, onOpenChange, onCreateWarehouse }: WarehouseDialogProps) => {
  const { warehouses } = useMultiWarehouseStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (name.trim()) {
      // Check for duplicate names
      const isDuplicate = warehouses.some(w => 
        w.name.toLowerCase() === name.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        setError('Gudang dengan nama ini sudah ada');
        return;
      }
      
      onCreateWarehouse(name.trim(), description.trim());
      // Reset form
      setName('');
      setDescription('');
      setError('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Tambah Gudang Baru
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nama Gudang <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(''); // Clear error when user types
              }}
              placeholder="contoh: Gudang J"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              required
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Deskripsi
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="contoh: Gudang untuk bahan kimia"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Buat Gudang
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};