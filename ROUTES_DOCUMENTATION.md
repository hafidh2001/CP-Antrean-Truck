# Routes Documentation

## URL Structure

### ✅ Current Routes Configuration

| Page | URL Pattern | Example | Description |
|------|-------------|---------|-------------|
| Home | `/` | `/` | Homepage dengan daftar warehouse |
| Warehouse Detail | `/warehouse/:warehouseId` | `/warehouse/1` | Detail warehouse untuk editing |
| Warehouse View - Desktop | `/warehouse/:warehouseId/view?mode=desktop` | `/warehouse/1/view?mode=desktop` | View warehouse - desktop mode |
| Warehouse View - Tablet | `/warehouse/:warehouseId/view?mode=tablet` | `/warehouse/1/view?mode=tablet` | View warehouse - tablet mode |

## Implementation Details

### 1. Routes Class (`src/utils/routes.ts`)
```typescript
export class ROUTES {
  static get base() { return `/` as const; }
  static get warehouse() { return `/warehouse` as const; }
  
  static warehouseDetail(warehouseId: string): string {
    return `${this.warehouse}/${warehouseId}` as const;
  }
  
  static warehouseView(warehouseId: string): string {
    return `${this.warehouse}/${warehouseId}/view` as const;
  }
}
```

### 2. App.tsx Route Configuration
```typescript
<Routes>
  <Route path={ROUTES.base} element={<HomePage />} />
  <Route path="/warehouse/:warehouseId" element={<WarehouseDetailPage />} />
  <Route path="/warehouse/:warehouseId/view" element={<WarehouseViewPage />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### 3. Navigation Usage

#### From HomePage:
```typescript
// Navigate to detail page
navigate(ROUTES.warehouseDetail(String(warehouse.id)));

// Navigate to view page - desktop
navigate(`${ROUTES.warehouseView(String(warehouse.id))}?mode=desktop`);

// Navigate to view page - tablet  
navigate(`${ROUTES.warehouseView(String(warehouse.id))}?mode=tablet`);
```

#### Back Navigation:
```typescript
// From detail/view pages back to home
navigate(ROUTES.base);
```

## URL Parameters

### Path Parameters
- `:warehouseId` - ID of the warehouse (number as string)

### Query Parameters  
- `mode` - View mode for warehouse view page
  - `desktop` (default) - Desktop view (1200x700)
  - `tablet` - Tablet view (1024x768)

## API Integration

### Data Loading Pattern:
```typescript
// Both detail and view pages use same API loading
useEffect(() => {
  if (warehouseId && !loadingRef.current) {
    loadingRef.current = true;
    loadWarehouseFromApi(parseInt(warehouseId));
  }
}, [warehouseId]);
```

## Fixes Applied

1. ✅ **Fixed App.tsx routes**: Used direct string patterns instead of ROUTES method calls
2. ✅ **Consistent navigation**: All pages use ROUTES class for navigation
3. ✅ **Import consistency**: Added ROUTES import to WarehouseDetailPage
4. ✅ **API integration**: Both detail and view pages use API loading

## Testing Checklist

- [ ] `/` loads homepage correctly
- [ ] `/warehouse/1` loads warehouse detail page with API data
- [ ] `/warehouse/1/view` loads warehouse view page (desktop mode)
- [ ] `/warehouse/1/view?mode=tablet` loads warehouse view page (tablet mode)
- [ ] Back buttons navigate to homepage
- [ ] 404 page shows for invalid URLs
- [ ] API loading works on direct URL access
- [ ] URL parameters are parsed correctly