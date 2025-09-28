<?php

class MWarehouse extends ActiveRecord
{

	public function tableName()
	{
		return 'm_warehouse';
	}

	public function rules()
	{
		return array(
			array('name', 'required'),
			array('name', 'length', 'max'=>256),
		);
	}

	public function relations()
	{
		return array(
			'mGates' => array(self::HAS_MANY, 'MGate', 'warehouse_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'name' => 'Name',
		);
	}
	
	public static function saveFloorPlan($params){
	    vdump($params);
	    return true;
	}
	
	public static function getFloorPlan($params){
	    $w = MWarehouse::model()->findByPk($params['id']);
	    return $w->attributes;
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
				$unit['type_storage'] = $location['type_storage'] ?: 'warehouse'; //default ke 'warehouse'
				
				
				$qo = "SELECT * FROM t_opnam WHERE warehouse_id = '".$warehouse_id."' AND finished_time IS NOT NULL ORDER BY created_time DESC LIMIT 1";
				$lastOpnam = Yii::app()->db->createCommand($qo)->queryRow();
				
				$w = "";
				if($lastOpnam){
				    
				    $w = " AND o.id = ".$lastOpnam["id"];
				}
				// }else{
				    //stock
        				$q = "SELECT 
                              s.id, 
                              l.label as location_label, 
                              g.id as goods_id, 
                              g.kode as goods_code, 
                              s.qty as stock_qty, 
                              u.unit as stock_unit, 
                              
                              s.production_date as opnam_date,
                              u.id as uom_id,
                              s.from_last_opnam
                            FROM 
                              t_stock s 
                              INNER JOIN m_location l on l.id = s.location_id 
                              INNER JOIN m_goods g on g.id = s.goods_id 
                              INNER JOIN m_uom u on u.id = s.uom_id 
                              INNER JOIN t_opnam o on o.id = s.opnam_id
                            WHERE l.id = ".$location['id']." AND l.is_deleted = false
                             $w
                            ";
        				
        				$stock = Yii::app()->db->createCommand($q)->queryAll();
        				
        				$unit['stock'] = $stock;
				    
				    
				// }
				
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

		return($response);
	}
	
	public static function getOpnamLocations($params)
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
				$unit['type_storage'] = $location['type_storage'] ?: 'warehouse'; //default ke 'warehouse'
				
				
				
				$unit['stock'] = [];
				//Current Opnam Stock
				$qo = "SELECT * FROM t_opnam WHERE warehouse_id = '".$warehouse_id."' AND unlocked_time IS NOT NULL AND finished_time is NULL ORDER BY created_time DESC LIMIT 1";
				$currentOpnam = Yii::app()->db->createCommand($qo)->queryRow();
				
				$w = "";
				if($currentOpnam){
				    
				    $w = " AND o.id = ".$currentOpnam["id"];
				}
				
				$q = "SELECT 
                      s.id, 
                      l.label as location_label, 
                      g.id as goods_id, 
                      g.kode as goods_code, 
                      s.qty as stock_qty, 
                      u.unit as stock_unit, 
                      s.production_date as opnam_date,
                      u.id as uom_id,
                      s.from_last_opnam
                      
                    FROM 
                      t_stock s 
                      INNER JOIN m_location l on l.id = s.location_id 
                      INNER JOIN m_goods g on g.id = s.goods_id 
                      INNER JOIN m_uom u on u.id = s.uom_id 
                      INNER JOIN t_opnam o on o.id = s.opnam_id
                    WHERE l.id = ".$location['id']." AND l.is_deleted = false
                     $w
                    ";
				
				$stock = Yii::app()->db->createCommand($q)->queryAll();
				
				$unit['stock'] = $stock;
				
				
				//Last Opnam Stock
				
				$qo = "SELECT * FROM t_opnam WHERE warehouse_id = '".$warehouse_id."' AND finished_time IS NOT NULL ORDER BY created_time DESC LIMIT 1";
				
				$currentOpnam = Yii::app()->db->createCommand($qo)->queryRow();
				
				
				
				$w = "";
				if($currentOpnam){
				    
				    $w = " AND o.id = ".$currentOpnam["id"];
				}
				
				$q = "SELECT 
                      s.id, 
                      l.label as location_label, 
                      g.id as goods_id, 
                      g.kode as goods_code, 
                      s.qty as stock_qty, 
                      u.unit as stock_unit, 
                      s.production_date as opnam_date,
                      u.id as uom_id,
                      true as from_last_opnam
                    FROM 
                      t_stock s 
                      INNER JOIN m_location l on l.id = s.location_id 
                      INNER JOIN m_goods g on g.id = s.goods_id 
                      INNER JOIN m_uom u on u.id = s.uom_id 
                      INNER JOIN t_opnam o on o.id = s.opnam_id
                    WHERE l.id = ".$location['id']." AND l.is_deleted = false
                     $w
                    ";
				
				$stock = Yii::app()->db->createCommand($q)->queryAll();
				
				
				if(count($unit['stock'])<=0){
				    $unit['stock'] = $stock;    
				}
				
				
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

		return($response);
	}
	
	
	
	public static function getActiveOpnam($params=[]){
	    

	    $warehouse_id = isset($params['warehouse_id']) ? $params['warehouse_id'] : null;
	    $user_id = isset($params['user_id']) ? $params['user_id'] : null;
	    
	    if($warehouse_id==null || $user_id==null){
	        $response = [
    			'status' => false,
    			'message' => "Invalid Parameter!"
		    ];

		    return $response;
	    }
	    
	    $q = "SELECT *
                FROM t_opnam
                WHERE user_id = ".$user_id."
                  AND warehouse_id = ".$warehouse_id."
                  AND finished_time IS NULL;";
                  
        $opnam = Yii::app()->db->createCommand($q)
			->queryRow();
			
		
		if($opnam){
	        $response = [
    			'status' => true,
    			'message' => "Active Opnam Found!",
    			'data' => $opnam
		    ];

		    return $response;
	    }else{
	         $response = [
    			'status' => false,
    			'message' => "No Active Opnam",
    			'data' => null
		    ];

		    return $response;
	    }
          
	}
	
	public static function setEncrypt() {
        $plaintext="{\"warehouse_id\":5, \"user_id\":4}";
	    $key = "alfafukidialdio";
        $key = substr(hash('sha256', $key, true), 0, 32); // 256-bit key
        $iv  = openssl_random_pseudo_bytes(16); // 128-bit IV
        $ciphertext = openssl_encrypt($plaintext, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        return base64_encode($iv . $ciphertext); // simpan IV + data
    }

}
