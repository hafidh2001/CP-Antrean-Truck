import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StorageUnit } from '@/types/warehouse';
import { Package, Pencil, RotateCw, Palette } from 'lucide-react';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface StorageUnitDialogProps {
  unit: StorageUnit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StorageUnitDialogV2({ unit, open, onOpenChange }: StorageUnitDialogProps) {
  const { updateStorageUnit, removeStorageUnit } = useMultiWarehouseStore();
  const [unitName, setUnitName] = useState(unit?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [rotation, setRotation] = useState(unit?.rotation || 0);
  const [unitType, setUnitType] = useState(unit?.type || 'warehouse');

  // Update local state when unit changes
  useEffect(() => {
    if (unit) {
      setUnitName(unit.name);
      setRotation(unit.rotation || 0);
      setUnitType(unit.type || 'warehouse');
    }
  }, [unit]);

  if (!unit) return null;

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    updateStorageUnit(unit.id, { rotation: newRotation });
  };

  const handleTypeChange = (newType: 'warehouse' | 'rack') => {
    setUnitType(newType);
    updateStorageUnit(unit.id, { type: newType });
  };

  const handleDelete = () => {
    removeStorageUnit(unit.id);
    onOpenChange(false);
  };

  const handleSaveName = () => {
    if (unitName.trim() && unitName !== unit.name) {
      updateStorageUnit(unit.id, { name: unitName.trim() });
    }
    setIsEditingName(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setUnitName(unit.name);
                      setIsEditingName(false);
                    }
                  }}
                  className="px-2 py-1 border rounded text-sm"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveName}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  setUnitName(unit.name);
                  setIsEditingName(false);
                }}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{unit.name}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  title="Click to edit name"
                  className="hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Position: ({unit.x}, {unit.y}) | Size: {unit.width}x{unit.height}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Text Rotation</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="flex items-center gap-2"
                >
                  <RotateCw className="h-4 w-4" />
                  {rotation}°
                </Button>
                <span className="text-sm text-muted-foreground">Click to rotate text</span>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Storage Type</Label>
              <RadioGroup value={unitType} onValueChange={handleTypeChange} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="warehouse" id="warehouse" />
                  <Label htmlFor="warehouse" className="flex items-center gap-2 cursor-pointer">
                    <Palette className="h-4 w-4 text-blue-500" />
                    Warehouse (Blue)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rack" id="rack" />
                  <Label htmlFor="rack" className="flex items-center gap-2 cursor-pointer">
                    <Palette className="h-4 w-4 text-yellow-500" />
                    Rack (Yellow)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="destructive" onClick={handleDelete}>
              Delete Storage Unit
            </Button>
            <Button onClick={() => onOpenChange(false)}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}