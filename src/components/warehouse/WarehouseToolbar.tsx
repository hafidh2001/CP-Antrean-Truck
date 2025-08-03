import { Button } from '@/components/ui/button';
import { useWarehouseStore } from '@/store/warehouseStore';
import { Save, Trash2 } from 'lucide-react';

export function WarehouseToolbar() {
  const { layout, setLayout } = useWarehouseStore();

  const handleSave = () => {
    localStorage.setItem('warehouseLayout', JSON.stringify(layout));
    // Show success feedback
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
    toast.textContent = 'Layout saved successfully!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all storage units?')) {
      setLayout({
        ...layout,
        storageUnits: [],
      });
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex gap-2">
      <Button onClick={handleSave} size="sm">
        <Save className="h-4 w-4 mr-2" />
        Save
      </Button>
      <Button onClick={handleClear} variant="destructive" size="sm">
        <Trash2 className="h-4 w-4 mr-2" />
        Clear
      </Button>
    </div>
  );
}