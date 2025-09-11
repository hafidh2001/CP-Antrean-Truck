<?php

class MLocation extends ActiveRecord
{

	public function tableName()
	{
		return 'm_location';
	}

	public function rules()
	{
		return array(
			array('warehouse_id, label', 'required'),
			array('warehouse_id', 'numerical', 'integerOnly'=>true),
			array('label', 'length', 'max'=>256),
			array('type, x, y, width, height, type_storage, text_styling', 'safe'),
		);
	}

	public function relations()
	{
		return array(
			'warehouse' => array(self::BELONGS_TO, 'MWarehouse', 'warehouse_id'),
			'tStocks' => array(self::HAS_MANY, 'TStock', 'location_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'warehouse_id' => 'Warehouse',
			'label' => 'Label',
			'type' => 'Type',
			'x' => 'X Position',
			'y' => 'Y Position',
			'width' => 'Width',
			'height' => 'Height',
			'type_storage' => 'Type Storage',
			'text_styling' => 'Text Styling',
			'is_deleted' => 'Deleted',
		);
	}

	public function defaultScope()
	{
		// Default scope to exclude soft deleted records
		return array(
			'condition' => 'is_deleted = false',
		);
	}

	public function withDeleted()
	{
		// Method to include soft deleted records
		return $this->resetScope(false);
	}

	public static function getWarehouseLocations($params = [])
	{
		// Extract warehouse_id from params
		$warehouse_id = isset($params['warehouse_id']) ? $params['warehouse_id'] : null;
		
		if (!$warehouse_id) {
			return ['error' => 'warehouse_id is required'];
		}

		// Query untuk mengambil data warehouse
		$queryWarehouse = "SELECT id, name, description, status
							FROM m_warehouse
							WHERE id = :warehouse_id
							LIMIT 1";
		
		$warehouse = Yii::app()->db->createCommand($queryWarehouse)
			->bindParam(':warehouse_id', $warehouse_id, PDO::PARAM_INT)
			->queryRow();

		if (!$warehouse) {
			return ['error' => 'Warehouse not found'];
		}

		// Query untuk mengambil semua locations dari warehouse (hanya yang tidak soft deleted)
		$queryLocations = "SELECT id, warehouse_id, label, type, x, y, width, height, 
							type_storage, text_styling
							FROM m_location
							WHERE warehouse_id = :warehouse_id AND is_deleted = false
							ORDER BY id ASC";

		$locations = Yii::app()->db->createCommand($queryLocations)
			->bindParam(':warehouse_id', $warehouse_id, PDO::PARAM_INT)
			->queryAll();

		// Transform data locations ke format frontend
		$storage_units = [];
		foreach ($locations as $location) {
			// Parse text_styling dari JSON string
			$text_styling = json_decode($location['text_styling'], true);
			if (!$text_styling) {
				// Default text styling jika tidak ada atau invalid
				$text_styling = [
					'font_size' => 16,
					'font_family' => 'Arial, sans-serif',
					'rotation' => 0,
					'text_color' => '#000000'
				];
			}

			// Transform data sesuai format frontend
			$unit = [
				'id' => (int)$location['id'],
				'type' => $location['type'] ?: 'storage', // default ke 'storage' jika null
				'label' => $location['label'],
				'x' => (float)$location['x'],
				'y' => (float)$location['y'],
				'warehouse_id' => (int)$location['warehouse_id'],
				'text_styling' => $text_styling
			];

			// Tambahkan width, height, type_storage jika type adalah 'storage'
			if ($location['type'] === 'storage' || !$location['type']) {
				$unit['width'] = (float)$location['width'];
				$unit['height'] = (float)$location['height'];
				$unit['type_storage'] = $location['type_storage'] ?: 'warehouse'; // default ke 'warehouse'
			}

			$storage_units[] = $unit;
		}

		// Format response sesuai mock-data.json
		$response = [
			'id' => (int)$warehouse['id'],
			'name' => $warehouse['name'],
			'description' => $warehouse['description'],
			'storage_units' => $storage_units
		];

		return $response;
	}

	public static function saveWarehouseLocations($params = [])
	{
		// Extract parameters from params
		$warehouse_id = isset($params['warehouse_id']) ? $params['warehouse_id'] : null;
		$storage_units = isset($params['storage_units']) ? $params['storage_units'] : [];
		
		if (!$warehouse_id) {
			return ['error' => 'warehouse_id is required'];
		}

		if (!is_array($storage_units)) {
			return ['error' => 'storage_units must be an array'];
		}

		// Validasi warehouse exists
		$checkWarehouse = "SELECT id FROM m_warehouse WHERE id = :warehouse_id LIMIT 1";
		$warehouseExists = Yii::app()->db->createCommand($checkWarehouse)
			->bindParam(':warehouse_id', $warehouse_id, PDO::PARAM_INT)
			->queryScalar();

		if (!$warehouseExists) {
			return ['error' => 'Warehouse not found'];
		}

		// Mulai transaction
		$transaction = Yii::app()->db->beginTransaction();
		try {
			// Tracking results
			$updatedCount = 0;
			$insertedCount = 0;
			$deletedCount = 0;
			$errors = [];
			
			// 1. Get all existing locations from DB for this warehouse (hanya yang tidak soft deleted)
			$existingQuery = "SELECT id FROM m_location WHERE warehouse_id = :warehouse_id AND is_deleted = false";
			$existingIds = Yii::app()->db->createCommand($existingQuery)
				->bindParam(':warehouse_id', $warehouse_id, PDO::PARAM_INT)
				->queryColumn();
			
			// Create map of existing IDs (id => true)
			$existingMap = array_flip($existingIds);
			
			// Collect frontend IDs that have valid IDs
			$frontendIds = [];
			foreach ($storage_units as $unit) {
				if (isset($unit['id']) && is_numeric($unit['id']) && $unit['id'] > 0) {
					$frontendIds[] = (int)$unit['id'];
				}
			}
			
			// 2. Soft delete units that exist in DB but not in frontend
			$toDelete = array_diff($existingIds, $frontendIds);
			if (!empty($toDelete)) {
				$deleteQuery = "UPDATE m_location 
								SET is_deleted = true
								WHERE warehouse_id = :warehouse_id 
								AND id IN (" . implode(',', $toDelete) . ")
								AND is_deleted = false";
				$deleteCommand = Yii::app()->db->createCommand($deleteQuery);
				$deleteCommand->bindParam(':warehouse_id', $warehouse_id, PDO::PARAM_INT);
				$deletedCount = $deleteCommand->execute();
			}

			// 3. Process each storage unit
			foreach ($storage_units as $index => $unit) {
				// Validasi data unit
				if (!isset($unit['label']) || !isset($unit['x']) || !isset($unit['y'])) {
					$errors[] = "Unit index $index: missing required fields (label, x, y)";
					continue;
				}

				// Prepare common data
				$type = isset($unit['type']) ? $unit['type'] : 'storage';
				$label = $unit['label'];
				$x = (float)$unit['x'];
				$y = (float)$unit['y'];
				
				// Prepare text_styling as JSON
				$text_styling = isset($unit['text_styling']) ? json_encode($unit['text_styling']) : json_encode([
					'font_size' => 16,
					'font_family' => 'Arial, sans-serif',
					'rotation' => 0,
					'text_color' => '#000000'
				]);

				// Prepare width, height, type_storage (null for text type)
				$width = null;
				$height = null;
				$type_storage = null;
				
				if ($type === 'storage') {
					$width = isset($unit['width']) ? (float)$unit['width'] : null;
					$height = isset($unit['height']) ? (float)$unit['height'] : null;
					$type_storage = isset($unit['type_storage']) ? $unit['type_storage'] : 'warehouse';
				}
				
				// Check if unit has ID and exists in existing map
				if (isset($unit['id']) && is_numeric($unit['id']) && isset($existingMap[(int)$unit['id']])) {
					// UPDATE existing location
					$updateQuery = "UPDATE m_location 
									SET label = :label,
										type = :type,
										x = :x,
										y = :y,
										width = :width,
										height = :height,
										type_storage = :type_storage,
										text_styling = :text_styling
									WHERE id = :id AND warehouse_id = :warehouse_id";
					
					$command = Yii::app()->db->createCommand($updateQuery);
					$command->bindParam(':id', $unit['id'], PDO::PARAM_INT);
					$command->bindParam(':warehouse_id', $warehouse_id, PDO::PARAM_INT);
					$command->bindParam(':label', $label, PDO::PARAM_STR);
					$command->bindParam(':type', $type, PDO::PARAM_STR);
					$command->bindParam(':x', $x, PDO::PARAM_STR);
					$command->bindParam(':y', $y, PDO::PARAM_STR);
					$command->bindParam(':width', $width, PDO::PARAM_STR);
					$command->bindParam(':height', $height, PDO::PARAM_STR);
					$command->bindParam(':type_storage', $type_storage, PDO::PARAM_STR);
					$command->bindParam(':text_styling', $text_styling, PDO::PARAM_STR);
					
					try {
						if ($command->execute()) {
							$updatedCount++;
						}
					} catch (Exception $e) {
						$errors[] = "Failed to update unit ID {$unit['id']}: " . $e->getMessage();
					}
				} else {
					// INSERT new location (tanpa ID, biar auto_increment)
					$insertQuery = "INSERT INTO m_location 
									(warehouse_id, label, type, x, y, width, height, type_storage, text_styling)
									VALUES 
									(:warehouse_id, :label, :type, :x, :y, :width, :height, :type_storage, :text_styling)";
					
					$command = Yii::app()->db->createCommand($insertQuery);
					$command->bindParam(':warehouse_id', $warehouse_id, PDO::PARAM_INT);
					$command->bindParam(':label', $label, PDO::PARAM_STR);
					$command->bindParam(':type', $type, PDO::PARAM_STR);
					$command->bindParam(':x', $x, PDO::PARAM_STR);
					$command->bindParam(':y', $y, PDO::PARAM_STR);
					$command->bindParam(':width', $width, PDO::PARAM_STR);
					$command->bindParam(':height', $height, PDO::PARAM_STR);
					$command->bindParam(':type_storage', $type_storage, PDO::PARAM_STR);
					$command->bindParam(':text_styling', $text_styling, PDO::PARAM_STR);
					
					try {
						if ($command->execute()) {
							$insertedCount++;
						}
					} catch (Exception $e) {
						$errors[] = "Failed to insert unit '$label': " . $e->getMessage();
					}
				}
			}

			// Commit transaction
			$transaction->commit();

			// Return hasil operasi
			$response = [
				'success' => true,
				'message' => 'Warehouse locations saved successfully',
				'results' => [
					'updated' => $updatedCount,
					'inserted' => $insertedCount,
					'deleted' => $deletedCount,
					'total_sent' => count($storage_units),
					'errors' => $errors
				]
			];

			// Log untuk debugging (optional)
			if (!empty($errors)) {
				Yii::log('Warehouse save errors: ' . json_encode($errors), 'warning', 'application.warehouse');
			}

			return $response;

		} catch (Exception $e) {
			// Rollback transaction jika ada error
			$transaction->rollback();
			
			// Log error
			Yii::log('Failed to save warehouse locations: ' . $e->getMessage(), 'error', 'application.warehouse');
			
			return [
				'success' => false,
				'error' => 'Failed to save locations: ' . $e->getMessage()
			];
		}
	}

}
