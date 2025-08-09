import { Button } from '@/components/ui/button';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { Save, Trash2, Type, Square, MousePointer } from 'lucide-react';

export const WarehouseToolbar = () => {
  const multiStore = useMultiWarehouseStore();
  const { toolMode, setToolMode, currentWarehouse, updateWarehouseLayout, saveWarehouseToStorage } = multiStore;

  const handleSave = () => {
    if (currentWarehouse) {
      saveWarehouseToStorage(currentWarehouse.id);
      
      // Show success feedback
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      toast.textContent = 'Layout saved successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all storage units?')) {
      if (currentWarehouse) {
        updateWarehouseLayout(currentWarehouse.id, {
          storageUnits: [],
        });
      }
    }
  };


  return (
    <div className="absolute top-4 right-4 z-10 flex gap-2">
      <div className="flex gap-1 bg-background border rounded-md p-1 mr-2">
        <Button 
          onClick={() => setToolMode('select')} 
          size="sm" 
          variant={toolMode === 'select' ? 'default' : 'ghost'}
          className="h-8 w-8 p-0"
          title="Select tool (V)"
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        <Button 
          onClick={() => setToolMode('rectangle')} 
          size="sm" 
          variant={toolMode === 'rectangle' ? 'default' : 'ghost'}
          className="h-8 w-8 p-0"
          title="Rectangle tool (R)"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button 
          onClick={() => setToolMode('text')} 
          size="sm" 
          variant={toolMode === 'text' ? 'default' : 'ghost'}
          className="h-8 w-8 p-0"
          title="Text tool (T)"
        >
          <Type className="h-4 w-4" />
        </Button>
      </div>
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
};