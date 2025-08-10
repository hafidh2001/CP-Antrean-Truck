# API Response Format

## Important: API Methods Must Return Arrays (Not JSON)

Based on Plansys API architecture, the API controller handles JSON encoding automatically. Therefore:

### ✅ CORRECT - Return Array:
```php
public static function getWarehouseLocations($params = []) {
    // ... code ...
    
    $response = [
        'id' => (int)$warehouse['id'],
        'name' => $warehouse['name'],
        'description' => $warehouse['description'],
        'storage_units' => $storage_units
    ];
    
    return $response;  // Return array directly
}
```

### ❌ WRONG - Return JSON:
```php
public static function getWarehouseLocations($params = []) {
    // ... code ...
    
    return json_encode($response);  // This causes double encoding!
}
```

## Why This Happens

The Plansys API controller (ApiController.php) calls:
```php
echo json_encode($model::$func($api_params['params']));
```

This means it expects the method to return an array/object, which it then encodes to JSON.

## Current Frontend Workaround

The frontend currently handles both cases (in case of caching issues):
```javascript
// Parse the response - handle double encoding issue
let data = response.data;

// If the response is a string, it might be double-encoded JSON
if (typeof data === 'string') {
    try {
        data = JSON.parse(data);
    } catch (e) {
        console.error('Failed to parse JSON string:', e);
    }
}
```

## Summary

1. Always return arrays from API methods
2. Let Plansys handle JSON encoding
3. Frontend has fallback for double-encoded responses