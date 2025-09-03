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