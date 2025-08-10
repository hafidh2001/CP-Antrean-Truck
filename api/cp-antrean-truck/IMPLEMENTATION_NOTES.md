# Implementation Notes - Full Replace Strategy

## API Method Requirements

**IMPORTANT**: All API methods in Plansys must be declared as `static` methods because the API controller calls them statically using `$model::$func()`.

## Kenapa Full Replace Strategy?

1. **Simplicity**: Tidak perlu complex logic untuk tracking perubahan
2. **Consistency**: Semua data selalu fresh dari frontend
3. **No ID Conflicts**: Tidak perlu worry tentang ID mapping
4. **Performance**: Untuk warehouse dengan < 1000 items, performance tetap bagus

## Flow Implementasi

### 1. Frontend Flow
```javascript
// User menambah/edit/hapus items di UI
// Semua perubahan disimpan di state
const [storageUnits, setStorageUnits] = useState([
  { id: Date.now(), type: 'storage', label: 'Storage 1', x: 20, y: 20, ... }
]);

// Ketika user klik Save
const handleSave = async () => {
  // Kirim semua data ke API (tanpa ID)
  const dataToSend = storageUnits.map(unit => {
    const { id, ...unitWithoutId } = unit;
    return unitWithoutId;
  });
  
  await warehouseApi.saveWarehouseLocations(warehouseId, dataToSend);
  
  // Refresh data dari server untuk mendapatkan ID yang benar
  const freshData = await warehouseApi.getWarehouseLocations(warehouseId);
  setStorageUnits(freshData.storage_units);
};
```

### 2. Backend Flow
```
1. DELETE all existing locations for warehouse_id
2. INSERT all new locations from request
3. Return success/error status
```

## Keuntungan

1. **No Sync Issues**: Data di frontend dan backend selalu sync
2. **Simple Logic**: Tidak perlu complex update logic
3. **Atomic Operation**: Semua berhasil atau semua gagal
4. **Clean State**: Tidak ada orphaned data

## Kelemahan & Solusinya

### 1. ID Berubah Setiap Save
**Problem**: ID di database akan selalu berubah
**Solusi**: Jangan gunakan ID database di frontend, gunakan temporary ID

### 2. Tidak Cocok untuk Relasi
**Problem**: Jika ada tabel lain yang reference ke m_location
**Solusi**: 
- Tambahkan soft delete jika ada relasi
- Atau gunakan position-based strategy

### 3. Race Condition
**Problem**: Jika multiple users edit warehouse bersamaan
**Solusi**: 
- Implementasi optimistic locking di warehouse level
- Atau warning system di frontend

## Frontend Adjustments

### Update multiWarehouseStore.ts
```typescript
// Saat save, jangan kirim ID
saveWarehouseToStorage: async () => {
  const state = get();
  if (!state.currentWarehouse) return;
  
  try {
    // Remove ID from storage units before sending
    const unitsToSave = state.currentWarehouse.storage_units.map(unit => {
      const { id, ...unitData } = unit;
      return unitData;
    });
    
    const result = await warehouseApi.saveWarehouseLocations(
      state.currentWarehouse.id,
      unitsToSave
    );
    
    if (result.success) {
      // Reload data to get new IDs from server
      const freshData = await warehouseApi.getWarehouseLocations(
        state.currentWarehouse.id
      );
      
      // Update current warehouse with fresh data
      set(state => ({
        ...state,
        currentWarehouse: freshData
      }));
    }
  } catch (error) {
    console.error('Failed to save warehouse:', error);
  }
};
```

## Alternative Strategies (Jika Diperlukan)

### 1. Position-Based Update
Jika perlu maintain ID:
```sql
-- Check berdasarkan posisi
SELECT id FROM m_location 
WHERE warehouse_id = ? AND x = ? AND y = ? AND type = ?
```

### 2. UUID Strategy
Jika perlu consistent ID:
```sql
ALTER TABLE m_location ADD COLUMN uuid VARCHAR(36) DEFAULT (UUID());
```

### 3. Soft Delete Strategy
Jika ada relasi:
```sql
ALTER TABLE m_location ADD COLUMN deleted_at TIMESTAMP NULL;
```

## Testing Checklist

- [ ] Test save warehouse kosong
- [ ] Test save dengan storage units only
- [ ] Test save dengan text elements only
- [ ] Test save dengan mixed types
- [ ] Test update existing warehouse
- [ ] Test concurrent updates
- [ ] Test error handling
- [ ] Test transaction rollback