import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StorageUnit, Item } from '@/types/warehouse';
import { Plus, Trash2, Package } from 'lucide-react';
import { useWarehouseStore } from '@/store/warehouseStore';

interface StorageUnitDialogProps {
  unit: StorageUnit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StorageUnitDialog({ unit, open, onOpenChange }: StorageUnitDialogProps) {
  const { updateStorageUnit, removeStorageUnit } = useWarehouseStore();
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, unit: 'kg' });

  if (!unit) return null;

  const handleAddItem = () => {
    if (newItem.name && newItem.quantity > 0) {
      const item: Item = {
        id: Date.now().toString(),
        ...newItem,
      };
      updateStorageUnit(unit.id, {
        items: [...unit.items, item],
      });
      setNewItem({ name: '', quantity: 0, unit: 'kg' });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    updateStorageUnit(unit.id, {
      items: unit.items.filter((item) => item.id !== itemId),
    });
  };

  const handleDelete = () => {
    removeStorageUnit(unit.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {unit.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Position: ({unit.x}, {unit.y}) | Size: {unit.width}x{unit.height} | Stack Level: {unit.stackLevel}
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Items in Storage:</h4>
            {unit.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items in this storage unit</p>
            ) : (
              <ul className="space-y-2">
                {unit.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between bg-secondary p-2 rounded">
                    <span className="text-sm">
                      {item.name} - {item.quantity} {item.unit}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Add New Item:</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="Qty"
                value={newItem.quantity || ''}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                className="w-20 px-3 py-2 border rounded-md"
              />
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="kg">kg</option>
                <option value="ton">ton</option>
                <option value="pcs">pcs</option>
                <option value="box">box</option>
              </select>
              <Button onClick={handleAddItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="destructive" onClick={handleDelete}>
              Delete Storage Unit
            </Button>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}