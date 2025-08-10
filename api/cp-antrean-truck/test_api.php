<?php
/**
 * Test file untuk memverifikasi API methods
 * 
 * Cara test:
 * 1. Include file MLocation_final.php
 * 2. Call static methods dengan parameter yang sesuai
 */

// Simulasi class ActiveRecord dan Yii untuk testing
class ActiveRecord {
    public function tableName() {
        return 'm_location';
    }
}

// Mock Yii class untuk testing
class Yii {
    public static function app() {
        return new class {
            public function db() {
                return new class {
                    public function createCommand($query) {
                        echo "Query: $query\n";
                        return $this;
                    }
                    public function bindParam($param, $value, $type) {
                        echo "Bind: $param = $value\n";
                        return $this;
                    }
                    public function queryRow() {
                        // Mock data for testing
                        return [
                            'id' => 1,
                            'name' => 'Test Warehouse',
                            'description' => 'Test Description',
                            'status' => 'active'
                        ];
                    }
                    public function queryAll() {
                        // Mock data for testing
                        return [
                            [
                                'id' => 1,
                                'warehouse_id' => 1,
                                'label' => 'Storage 1',
                                'type' => 'storage',
                                'x' => 10,
                                'y' => 20,
                                'width' => 100,
                                'height' => 200,
                                'type_storage' => 'warehouse',
                                'text_styling' => json_encode(['font_size' => 16])
                            ]
                        ];
                    }
                    public function beginTransaction() {
                        return new class {
                            public function commit() {
                                echo "Transaction committed\n";
                            }
                            public function rollback() {
                                echo "Transaction rolled back\n";
                            }
                        };
                    }
                    public function execute() {
                        return 1; // Affected rows
                    }
                };
            }
            public static function log($message, $level, $category) {
                echo "Log [$level]: $message\n";
            }
        };
    }
}

// Include the actual model file
include_once 'MLocation_final.php';

// Test 1: Get Warehouse Locations
echo "\n=== Test 1: Get Warehouse Locations ===\n";
$params1 = ['warehouse_id' => 1];
$result1 = MLocation::getWarehouseLocations($params1);
echo "Result: " . $result1 . "\n";

// Test 2: Save Warehouse Locations
echo "\n=== Test 2: Save Warehouse Locations ===\n";
$params2 = [
    'warehouse_id' => 1,
    'storage_units' => [
        [
            'label' => 'Storage Unit 1',
            'type' => 'storage',
            'x' => 10,
            'y' => 20,
            'width' => 100,
            'height' => 200,
            'type_storage' => 'warehouse',
            'text_styling' => ['font_size' => 16]
        ],
        [
            'label' => 'Text Label',
            'type' => 'text',
            'x' => 50,
            'y' => 50,
            'text_styling' => ['font_size' => 20]
        ]
    ]
];
$result2 = MLocation::saveWarehouseLocations($params2);
echo "Result: " . $result2 . "\n";

// Test 3: Get Next Location ID
echo "\n=== Test 3: Get Next Location ID ===\n";
$result3 = MLocation::getNextLocationId();
echo "Result: " . $result3 . "\n";

echo "\n=== All tests completed ===\n";