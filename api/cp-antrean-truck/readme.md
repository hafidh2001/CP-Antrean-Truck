# CP Antrean Truck API Documentation

## Overview
API untuk sistem manajemen warehouse yang merupakan representasi dari backend yang dibuat menggunakan framework Yii PHP melalui Plansys online editor. 

Plansys adalah platform online code generator yang memungkinkan development aplikasi berbasis Yii Framework dengan visual interface. Backend yang dihasilkan menggunakan:
- **Framework**: Yii PHP Framework
- **Pattern**: ActiveRecord untuk model database
- **Architecture**: MVC (Model-View-Controller)
- **API Layer**: RESTful-like API dengan single endpoint

## Project Structure

```
api/cp-antrean-truck/
├── builder/                    # Generated code dari Plansys
│   ├── controller-builder/     # Controllers untuk berbagai role
│   └── model-builder/          # Model dengan API functions
├── db/                         # Database structure
│   └── dump-structure.txt      # SQL dump structure dari database
└── readme.md
```

## API Configuration

### Base URL
```
https://hachi.kamz-kun.id/cp_fifo/index.php?r=Api
```

### Request Format
Semua API menggunakan URL yang sama dengan POST method. Yang membedakan adalah `model` dan `function` yang digunakan.

```json
{
    "function": "<nama_function>",
    "mode": "function",
    "model": "<nama_model>",
    "params": {
        // parameters sesuai function
    },
    "token": "dctfvgybefvgyabdfhwuvjlnsd",
    "user_token": "dNS1f.f4HKgIXqH9GDs9F150nhSbK"
}
```

## API Usage Examples

### 1. Get Warehouse Locations

**Request:**
```json
{
    "function": "getWarehouseLocations",
    "mode": "function",
    "model": "MLocation",
    "params": {
        "warehouse_id": 1
    },
    "token": "dctfvgybefvgyabdfhwuvjlnsd",
    "user_token": "dNS1f.f4HKgIXqH9GDs9F150nhSbK"
}
```

**Response:**
```json
{
    "id": 1,
    "name": "Gudang Utama",
    "description": "Gudang untuk penyimpanan barang utama",
    "storage_units": [
        {
            "id": 38,
            "type": "storage",
            "label": "A-001",
            "x": 20,
            "y": 80,
            "warehouse_id": 1,
            "width": 140,
            "height": 240,
            "type_storage": "warehouse",
            "text_styling": {
                "font_size": 16,
                "font_family": "Arial, sans-serif",
                "rotation": 0,
                "text_color": "#000000"
            }
        }
    ]
}
```

### 2. Save Warehouse Locations

**Request:**
```json
{
    "function": "saveWarehouseLocations",
    "mode": "function",
    "model": "MLocation",
    "params": {
        "warehouse_id": 1,
        "storage_units": [
            {
                "id": 38,
                "type": "storage",
                "label": "A-001 Updated",
                "x": 25,
                "y": 85,
                "warehouse_id": 1,
                "width": 140,
                "height": 240,
                "type_storage": "warehouse",
                "text_styling": {
                    "font_size": 16,
                    "font_family": "Arial, sans-serif",
                    "rotation": 0,
                    "text_color": "#000000"
                }
            }
        ]
    },
    "token": "dctfvgybefvgyabdfhwuvjlnsd",
    "user_token": "dNS1f.f4HKgIXqH9GDs9F150nhSbK"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Warehouse locations saved successfully",
    "results": {
        "updated": 1,
        "inserted": 0,
        "deleted": 0,
        "total_sent": 1,
        "errors": []
    }
}
```

## General Information

### Naming Convention
- **Model**: Nama model mengikuti nama tabel database dengan format PascalCase
  - Prefix `M` untuk master data (MLocation → m_location, MWarehouse → m_warehouse)
  - Prefix `T` untuk transaksi (TStock → t_stock, TDeliveryOrder → t_delivery_order)
  - Model `TAntrean` merujuk pada tabel `t_antrean`
- **Controller**: Suffix `Controller`

### Save Logic (Update/Insert Strategy)
1. Get semua existing IDs dari database untuk warehouse
2. Delete units yang ada di DB tapi tidak ada di request
3. Untuk setiap unit di request:
   - Jika ID ada di DB → UPDATE (walau value sama)
   - Jika ID tidak ada atau tidak punya ID → INSERT tanpa ID (auto_increment)

### Important Notes
1. **Static Methods**: Semua API methods di Plansys harus dideklarasikan sebagai `static` karena API controller memanggilnya secara static menggunakan `$model::$func()`.

2. **Response Format**: Method harus return array (bukan JSON string). API controller akan otomatis mengkonversi ke JSON.

3. **Foreign Key Constraint**: Karena `t_stock` memiliki foreign key ke `m_location.id`, kita menggunakan Update/Insert strategy (bukan Full Replace) untuk menjaga integritas data.

4. **Transaction**: Semua operasi save menggunakan database transaction untuk memastikan atomicity.

### Error Handling
API akan mengembalikan error dalam format:
```json
{
    "error": "Error message here"
}
```

Atau untuk save operations:
```json
{
    "success": false,
    "error": "Failed to save locations: Error details"
}
```

### Authentication
Saat ini menggunakan static tokens:
- `token`: "dctfvgybefvgyabdfhwuvjlnsd"
- `user_token`: "dNS1f.f4HKgIXqH9GDs9F150nhSbK"

Authentication handling dilakukan di level API controller Plansys.

## Backend Architecture (PHP Yii Framework)

### Database Schema

#### Core Tables:
- **t_antrean**: Truck queue records
  - id, nopol, status (OPEN, LOADING, VERIFYING, VERIFIED, CLOSED), created_time
- **t_antrean_rekomendasi_lokasi**: Recommended locations with goods
  - id, antrean_id, goods_id, qty, uom_id, location_id
- **t_antrean_kode_produksi**: Production code entries
  - id, antrean_id, goods_id, production_code, qty, uom_id
- **t_antrean_jebolan**: Jebolan (spillage) records
  - id, antrean_id, goods_id, jebolan
- **t_antrean_gate**: Gate assignments
  - id, antrean_id, gate_id, position

#### Master Tables:
- **m_goods**: Master goods data (id, kode, alias)
- **m_gate**: Master gate data (id, code)
- **m_uom**: Master unit of measure (id, unit, convert_to)
- **m_location**: Master location data

### API Endpoints Documentation

#### 1. Antrean Management

##### getAntreanTruck
```php
// Model: TAntrean
// Function: getAntreanTruck
// Parameters:
{
  "user_token": "string",
  "status": "string[]" // Optional, defaults to all statuses
}
// Returns: Array of antrean with id, nopol, created_time, jenis_barang
```

##### getAntreanKodeProduksi  
```php
// Model: TAntreanRekomendasiLokasi
// Function: getAntreanKodeProduksi
// Parameters:
{
  "user_token": "string",
  "antrean_id": "integer"
}
// Returns: { nopol, jenis_barang, productionCodes[] }
// Note: Uses goods_id as ID, groups by goods_id
```

##### getProductionCodeDetail
```php
// Model: TAntreanRekomendasiLokasi
// Function: getProductionCodeDetail
// Parameters:
{
  "user_token": "string",
  "antrean_id": "integer",
  "goods_id": "integer"
}
// Returns: { nopol, jenis_barang, productionCode }
```

#### 2. Production Code Entry

##### saveKodeProduksi
```php
// Model: TAntreanKodeProduksi
// Function: saveKodeProduksi
// Parameters:
{
  "user_token": "string",
  "antrean_id": "integer",
  "goods_id": "integer",
  "entries": [
    {
      "production_code": "string",
      "qty": "number",
      "uom_id": "integer"
    }
  ]
}
// Returns: { success, message }
// Logic: Delete all existing entries, then insert new ones
```

##### getKodeProduksi
```php
// Model: TAntreanKodeProduksi
// Function: getKodeProduksi
// Parameters:
{
  "user_token": "string",
  "antrean_id": "integer",
  "goods_id": "integer"
}
// Returns: { entries[], total_saved }
```

#### 3. Jebolan Management

##### getJebolan
```php
// Model: TAntreanJebolan
// Function: getJebolan
// Parameters:
{
  "user_token": "string",
  "antrean_id": "integer",
  "goods_id": "integer"
}
// Returns: { jebolan[] }
```

##### saveJebolan
```php
// Model: TAntreanJebolan
// Function: saveJebolan
// Parameters:
{
  "user_token": "string",
  "antrean_id": "integer",
  "goods_id": "integer",
  "jebolan": "string"
}
// Returns: { success, message }
```

##### deleteJebolan
```php
// Model: TAntreanJebolan
// Function: deleteJebolan
// Parameters:
{
  "user_token": "string",
  "antrean_id": "integer",
  "goods_id": "integer"
}
// Returns: { success, message }
```

#### 4. Gate Management

##### getGateOptions
```php
// Model: MGate
// Function: getGateOptions
// Parameters:
{
  "user_token": "string"
}
// Returns: { gates[] } with id and code
```

##### getAntreanGate
```php
// Model: TAntreanGate
// Function: getAntreanGate
// Parameters:
{
  "user_token": "string",
  "antrean_id": "integer"
}
// Returns: { gates[] } array where index 0 = Gate 1, index 1 = Gate 2
```

##### setAntreanGate
```php
// Model: TAntreanGate
// Function: setAntreanGate
// Parameters:
{
  "user_token": "string",
  "antrean_id": "integer",
  "gate_id": "integer",
  "position": "integer" // 1 or 2
}
// Returns: { success, message }
```

##### deleteAntreanGate
```php
// Model: TAntreanGate
// Function: deleteAntreanGate
// Parameters:
{
  "user_token": "string",
  "antrean_id": "integer"
}
// Returns: { success, message }
// Logic: Only deletes gate 2 (second item in array)
```

### Business Logic Rules

1. **Queue Status Flow**: 
   - OPEN → LOADING → VERIFYING → VERIFIED → CLOSED
   - Frontend only shows LOADING status

2. **UOM Hierarchy**: 
   - Items with `convert_to = NULL` are smallest units
   - Smallest units count as 1 entry
   - Larger units count as their quantity
   - Sort order: Items with convert_to first, then NULL items

3. **Gate Logic**: 
   - Gate 1 must be selected before Gate 2
   - No duplicate gates allowed
   - Stored as array: position 0 = Gate 1, position 1 = Gate 2

4. **Entry Counting**: 
   - Based on UOM type
   - Completed entries tracked in t_antrean_kode_produksi

### Error Codes
- "Invalid user token" - Authentication failed
- "antrean_id and goods_id are required" - Missing parameters
- "Antrean not found" - Invalid ID
- Database errors will include SQL error messages