import { Button } from '@/components/ui/button';
import { useWarehouseStore } from '@/store/warehouseStore';
import { Save, Download, Trash2, Grid } from 'lucide-react';

export function WarehouseToolbar() {
  const { layout, setLayout } = useWarehouseStore();

  const handleSave = () => {
    // Save to localStorage for now
    localStorage.setItem('warehouseLayout', JSON.stringify(layout));
    alert('Layout saved!');
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('warehouseLayout');
    if (saved) {
      setLayout(JSON.parse(saved));
      alert('Layout loaded!');
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all storage units?')) {
      setLayout({
        ...layout,
        storageUnits: [],
      });
    }
  };

  const toggleGrid = () => {
    // This would toggle grid visibility - for now just a placeholder
    alert('Grid toggle functionality to be implemented');
  };

  return (
    <div className="flex gap-2 p-4 border-b">
      <Button onClick={handleSave} variant="outline" size="sm">
        <Save className="h-4 w-4 mr-2" />
        Save Layout
      </Button>
      <Button onClick={handleLoad} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Load Layout
      </Button>
      <Button onClick={handleClear} variant="outline" size="sm">
        <Trash2 className="h-4 w-4 mr-2" />
        Clear All
      </Button>
      <Button onClick={toggleGrid} variant="outline" size="sm">
        <Grid className="h-4 w-4 mr-2" />
        Toggle Grid
      </Button>
    </div>
  );
}