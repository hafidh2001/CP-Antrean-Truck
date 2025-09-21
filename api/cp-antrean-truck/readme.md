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

##### getGateAntreanList
```php
// Model: MGate
// Function: getGateAntreanList
// Access: MC and Admin roles only
// Parameters:
{
  "user_token": "string"  // Must be MC or Admin user
}
// Returns: All gates from all warehouses with antrean queue and countdown
// Response structure:
{
  "gates": [
    {
      "gate_id": 1,
      "gate_code": "GATE 1",
      "warehouse_name": "Gudang Utama",
      "antrean_list": [
        {
          "antrean_id": 123,
          "nopol": "L 123 BA",
          "status": "LOADING",
          "assigned_kerani_time": "2024-01-12 10:00:00",
          "loading_time_minutes": 80,  // Total loading time for this truck
          "remaining_minutes": 30.5,    // Remaining time including queue
          "remaining_time_formatted": {
            "hours": 0,
            "minutes": 30,
            "seconds": 30,
            "display": "30 MENIT 30 DETIK"
          }
        },
        {
          "antrean_id": 124,
          "nopol": "AE 2112 BA",
          "status": "LOADING",
          "assigned_kerani_time": "2024-01-12 10:05:00",
          "loading_time_minutes": 40,
          "remaining_minutes": 70.5,    // Includes wait time for truck ahead
          "remaining_time_formatted": {
            "hours": 1,
            "minutes": 10,
            "seconds": 30,
            "display": "1 JAM 10 MENIT 30 DETIK"
          }
        }
      ]
    },
    {
      "gate_id": 2,
      "gate_code": "GATE 2",
      "antrean_list": [...]
    }
  ],
  "server_time": "2024-01-12 11:30:00",
  "timestamp": 1705033800
}
// Logic:
// - Role validation: Only MC and Admin can access
// - Shows ALL gates from ALL warehouses (no warehouse filter needed)
// - Only shows trucks with status LOADING or VERIFYING
// - Calculates loading time: qty_in_tons * loading_time_per_ton (default 10 min/ton)
// - Cumulative time: Each truck's remaining time includes all trucks ahead in queue
// - Auto-removes trucks when countdown reaches 0 (frontend handling)
```

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

## Development Guidelines

### Kapan Edit Model vs Model + Controller

#### **Edit Model Saja:**
Untuk operasi CRUD standar yang tidak melibatkan user action langsung:
- ✅ **CREATE operations**: Membuat data baru
- ✅ **UPDATE operations**: Mengupdate data existing  
- ✅ **SELECT operations**: Query dan filtering data
- ✅ **Business logic methods**: Static methods untuk API calls

**Contoh:**
```php
// Model: MLocation.php
public static function getWarehouseLocations($params) {
    // SELECT operation - cukup edit di model
    $sql = "SELECT * FROM m_location WHERE warehouse_id = :id AND is_deleted = false";
}

public static function saveWarehouseLocations($params) {
    // Bulk UPDATE/INSERT operation - business logic di model
    // Soft delete logic untuk units yang tidak ada di frontend
}
```

#### **Edit Model + Controller:**
Untuk operasi yang melibatkan user interaction langsung dan behavioral changes:
- ✅ **DELETE operations**: Karena ada direct user action (button click)
- ✅ **Behavioral changes**: Hard delete → Soft delete
- ✅ **Authentication/authorization logic**
- ✅ **Request handling & response**: Flash messages, redirects
- ✅ **Permission checks**: Access control

**Contoh:**
```php
// Controller: MLocationController.php
public function actionDelete($id) {
    // User clicks "Delete" button - handle user action
    if (strpos($id, ',') > 0) {
        // Batch delete handling
        $ids = explode(",", $id);
        foreach($ids as $locationId) {
            $this->softDeleteLocation(trim($locationId));
        }
    } else {
        $this->softDeleteLocation($id);
    }
    
    $this->flash('Data Berhasil Dihapus'); // User feedback
    $this->redirect(['index']); // Navigation
}

private function softDeleteLocation($id) {
    // Business logic - could also be moved to model
    $sql = "UPDATE m_location SET is_deleted = true WHERE id = :id";
    return Yii::app()->db->createCommand($sql)->execute();
}
```

### MVC Architecture Flow

```
User Action → Controller → Model → Database
     ↓           ↓          ↓        ↓
1. Click Delete → actionDelete() → softDeleteLocation() → UPDATE is_deleted=true
2. Flash message ← Controller response
3. Redirect ← Controller navigation
```

### Soft Delete Implementation Strategy

#### **Database Level:**
- ✅ Column `is_deleted boolean DEFAULT false NOT NULL` sudah ada
- ✅ Foreign keys tetap CASCADE (tidak ter-trigger karena tidak ada hard delete)

#### **Model Level:**
- ✅ **defaultScope()**: Otomatis filter `is_deleted = false` untuk semua query
- ✅ **withDeleted()**: Method untuk include soft deleted records jika diperlukan
- ✅ **Query updates**: Semua SELECT query ditambah `AND is_deleted = false`
- ✅ **Soft delete logic**: UPDATE `is_deleted = true` instead of DELETE

#### **Controller Level:**
- ✅ **User action handling**: Replace `$model->delete()` dengan `softDeleteLocation()`
- ✅ **Batch delete support**: Handle comma-separated IDs
- ✅ **User feedback**: Flash messages dan redirects
- ✅ **Consistency**: Semua delete operations menggunakan soft delete

### Implementation Example: m_location Soft Delete

#### **Why Both Model + Controller?**

1. **Different Delete Contexts:**
   - **Model method** (`saveWarehouseLocations`): Bulk operation saat user save layout
   - **Controller method** (`actionDelete`): Single operation saat user klik delete button

2. **User Interface Flow:**
   ```
   Frontend Warehouse Editor:
   User removes unit → removeUnit() → Save Layout → saveWarehouseLocations()
        ↓
   Soft delete via bulk save

   Admin Interface:
   User clicks Delete button → actionDelete() → softDeleteLocation()
        ↓
   Soft delete for consistency
   ```

3. **Separation of Concerns:**
   - **Controller**: Request handling, user feedback, navigation
   - **Model**: Business logic, database operations

#### **Benefits of Soft Delete:**
- 🔒 **Historical Data Preserved**: Semua location yang di-delete masih tersimpan
- 🔗 **Referential Integrity**: Records di `t_stock` dan `t_antrean_rekomendasi_lokasi` tetap valid
- 👥 **Seamless UX**: User experience tidak berubah
- 🔄 **Data Recovery**: Data bisa di-restore dengan `UPDATE m_location SET is_deleted = false`

### Best Practices

1. **Consistent Approach**: Jika implement soft delete, pastikan semua query dan operations konsisten
2. **Clear Documentation**: Dokumentasikan behavioral changes untuk team
3. **Testing**: Test both create/update/delete flows setelah perubahan
4. **Migration Plan**: Pertimbangkan existing data saat implement soft delete