import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Warehouse, Plus } from 'lucide-react';
import warehouseData from '@/data/mockWarehouses.json';
import { Warehouse as WarehouseType } from '@/types/warehouse';

export function HomePage() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);

  useEffect(() => {
    // Load from localStorage if exists, otherwise use mock data
    const savedData = localStorage.getItem('allWarehouses');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setWarehouses(parsed);
      } catch (error) {
        console.error('Failed to parse saved warehouses:', error);
        setWarehouses(warehouseData.warehouses as WarehouseType[]);
      }
    } else {
      setWarehouses(warehouseData.warehouses as WarehouseType[]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">CP Antrean Truck</h1>
          <p className="text-xl text-muted-foreground">
            Sistem Manajemen Gudang dan Antrian Truk
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Pilih Gudang</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {warehouses.map((warehouse) => (
              <Link
                key={warehouse.id}
                to={`/warehouse/${warehouse.id}`}
                className="group"
              >
                <div className="border rounded-lg p-6 bg-card hover:bg-accent hover:border-primary transition-all cursor-pointer h-full">
                  <div className="flex items-center justify-between mb-4">
                    <Warehouse className="h-8 w-8 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {warehouse.layout.storageUnits.length} units
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{warehouse.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {warehouse.description || 'No description'}
                  </p>
                </div>
              </Link>
            ))}
            
            {/* Add new warehouse card - for future implementation */}
            <div className="border-2 border-dashed rounded-lg p-6 bg-card/50 flex items-center justify-center cursor-not-allowed opacity-50">
              <div className="text-center">
                <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Tambah Gudang Baru</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}