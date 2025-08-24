<?php

class TAntrean extends ActiveRecord
{

	public function tableName()
	{
		return 't_antrean';
	}

	public function rules()
	{
		return array(
			array('nopol, created_time, warehouse_id', 'required'),
			array('warehouse_id, kerani_id, mc_id, admin_id, warehouse_override_id', 'numerical', 'integerOnly'=>true),
			array('status', 'length', 'max'=>256),
			array('assigned_kerani_time, verifying_time, verified_time, closed_time', 'safe'),
		);
	}

	public function relations()
	{
		return array(
			'tAntreanGates' => array(self::HAS_MANY, 'TAntreanGate', 'antrean_id'),
			'tAntreanRekomendasiLokasis' => array(self::HAS_MANY, 'TAntreanRekomendasiLokasi', 'antrean_id'),
			'warehouse' => array(self::BELONGS_TO, 'MWarehouse', 'warehouse_id'),
			'kerani' => array(self::BELONGS_TO, 'User', 'kerani_id'),
			'mc' => array(self::BELONGS_TO, 'User', 'mc_id'),
			'admin' => array(self::BELONGS_TO, 'User', 'admin_id'),
			'warehouseOverride' => array(self::BELONGS_TO, 'MWarehouse', 'warehouse_override_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'nopol' => 'Nopol',
			'created_time' => 'Created Time',
			'warehouse_id' => 'Warehouse',
			'kerani_id' => 'Kerani',
			'assigned_kerani_time' => 'Assigned Kerani Time',
			'status' => 'Status',
			'verifying_time' => 'Verifying Time',
			'verified_time' => 'Verified Time',
			'closed_time' => 'Closed Time',
			'mc_id' => 'Mc',
			'admin_id' => 'Admin',
			'warehouse_override_id' => 'Warehouse Override',
		);
	}

	/**
	 * Get antrean untuk truck dengan logika prioritas rekomendasi warehouse
	 * @param array $params Parameter yang berisi nopol
	 * @return array Response hasil proses
	 */
	public static function getAntrean($params = [])
	{
		$transaction = Yii::app()->db->beginTransaction();
		
		try {
			// Validasi parameter
			if (!isset($params['nopol']) || empty($params['nopol'])) {
				throw new Exception('Parameter nopol wajib diisi');
			}
			
			$nopol = $params['nopol'];
			
			// 1. Panggil API SAP untuk mendapatkan dan menyimpan DO
			$deliveryOrders = self::fetchAndSaveDeliveryOrders($nopol);
			
			if (empty($deliveryOrders)) {
				throw new Exception('Tidak ada delivery order yang ditemukan untuk nopol: ' . $nopol);
			}
			
			// 2. Analisis barang yang dibutuhkan dari semua DO
			$requiredGoods = self::analyzeRequiredGoods($deliveryOrders);
			
			// 3. Cari warehouse terbaik berdasarkan prioritas
			$warehouseRecommendation = self::findBestWarehouse($requiredGoods);
			
			if (!$warehouseRecommendation) {
				throw new Exception('Tidak ada warehouse yang dapat memenuhi kebutuhan barang');
			}
			
			// 4. Buat antrean baru
			$antrean = new TAntrean();
			$antrean->nopol = $nopol;
			$antrean->created_time = date('Y-m-d H:i:s');
			$antrean->warehouse_id = $warehouseRecommendation['warehouse_id'];
			$antrean->status = 'OPEN';
			
			if (!$antrean->save()) {
				throw new Exception('Gagal menyimpan antrean: ' . json_encode($antrean->getErrors()));
			}
			
			// 5. Simpan rekomendasi lokasi untuk setiap barang
			foreach ($warehouseRecommendation['location_details'] as $detail) {
				$rekomendasi = new TAntreanRekomendasiLokasi();
				$rekomendasi->antrean_id = $antrean->id;
				$rekomendasi->goods_id = $detail['goods_id'];
				$rekomendasi->location_id = $detail['location_id'];
				$rekomendasi->qty = $detail['qty'];
				$rekomendasi->uom_id = $detail['uom_id'];
				
				if (!$rekomendasi->save()) {
					throw new Exception('Gagal menyimpan rekomendasi lokasi: ' . json_encode($rekomendasi->getErrors()));
				}
			}
			
			// 6. Assign gate yang tersedia
			$availableGates = self::assignAvailableGates($antrean->id, $warehouseRecommendation['warehouse_id']);
			
			$transaction->commit();
			
			// Return response
			return array(
				'success' => true,
				'antrean_id' => $antrean->id,
				'warehouse' => array(
					'id' => $warehouseRecommendation['warehouse_id'],
					'name' => $warehouseRecommendation['warehouse_name'],
					'priority_reason' => $warehouseRecommendation['priority_reason']
				),
				'locations' => $warehouseRecommendation['location_details'],
				'gates' => $availableGates,
				'delivery_orders' => count($deliveryOrders)
			);
			
		} catch (Exception $e) {
			$transaction->rollback();
			return array(
				'success' => false,
				'error' => $e->getMessage()
			);
		}
	}
	
	/**
	 * Fetch dan simpan delivery order dari API SAP
	 */
	private static function fetchAndSaveDeliveryOrders($nopol)
	{
		$url = "https://cpipga.com/API_DO/getDataDO";
		$headers = array(
			"Content-Type: application/json",
			"Token: GlqVo45k2q3D8b26dLZRCp5vFjNxKUtw"
		);
		
		$body = array(
			"nopol" => $nopol
		);
		
		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
		
		$response = curl_exec($ch);
		$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);
		
		if ($httpCode !== 200) {
			throw new Exception('API SAP error: HTTP ' . $httpCode);
		}
		
		$data = json_decode($response, true);
		
		if (!$data || !$data['status']) {
			$message = isset($data['message']) && is_string($data['message']) ? $data['message'] : 'Data tidak ditemukan';
			throw new Exception($message);
		}
		
		$savedDeliveryOrders = array();
		
		// Simpan DO dan DO Line
		foreach ($data['message'] as $row) {
			// Cek apakah DO sudah ada
			$existingDO = TDeliveryOrder::model()->findByAttributes(array('no_do' => $row['no_do']));
			
			if (!$existingDO) {
				$do = new TDeliveryOrder();
				$do->synced_time = date('Y-m-d H:i:s');
				$do->status = 'OPEN';
				$do->id_sap = $row['id_data_do_fl'];
				$do->plant = $row['plant'];
				$do->truck_no = $row['truck_no'];
				$do->out_date = $row['out_date'];
				$do->no_do = $row['no_do'];
				$do->delivery_date = $row['delivery_date'];
				$do->sorg = $row['sorg'];
				$do->customer_id = $row['customer_id'];
				$do->sold_to_party = $row['sold_to_party'];
				$do->created_by = $row['created_by'];
				$do->created_date = $row['created_date'];
				$do->shiptotext = $row['shiptotext'];
				$do->cust_name = $row['cust_name'];
				$do->cust_city = $row['cust_city'];
				$do->cust_street = $row['cust_street'];
				$do->cust_strsuppl = $row['cust_strsuppl'];
				$do->sap_client = $row['sap_client'];
				$do->date_inserted = $row['date_inserted'];
				$do->jenis_truck = isset($row['jenis_truck']) ? $row['jenis_truck'] : null;
				
				if (!$do->save()) {
					throw new Exception('Gagal simpan DO: ' . json_encode($do->getErrors()));
				}
				
				$doId = $do->id;
			} else {
				$doId = $existingDO->id;
				$do = $existingDO;
			}
			
			// Simpan DO Line
			$doLine = new TDeliveryOrderLine();
			$doLine->do_id = $doId;
			$doLine->seq_number = $row['seq_number'];
			$doLine->goods_code = $row['material'];
			$doLine->qty_in_do = $row['qty_in_do'];
			$doLine->uoe = $row['uoe'];
			$doLine->div_qty = $row['div_qty'];
			$doLine->su = isset($row['su']) ? $row['su'] : null;
			$doLine->ref_doc = isset($row['ref_doc']) ? $row['ref_doc'] : null;
			$doLine->ref_itm = isset($row['ref_itm']) ? $row['ref_itm'] : null;
			$doLine->batch = $row['batch'];
			
			if (!$doLine->save()) {
				throw new Exception('Gagal simpan DO Line: ' . json_encode($doLine->getErrors()));
			}
			
			$savedDeliveryOrders[$doId] = $do;
		}
		
		return $savedDeliveryOrders;
	}
	
	/**
	 * Analisis barang yang dibutuhkan dari semua DO
	 */
	private static function analyzeRequiredGoods($deliveryOrders)
	{
		$requiredGoods = array();
		
		foreach ($deliveryOrders as $do) {
			// Get DO lines
			$doLines = TDeliveryOrderLine::model()->findAllByAttributes(array('do_id' => $do->id));
			
			foreach ($doLines as $line) {
				// Cari goods berdasarkan kode
				$goods = MGoods::model()->findByAttributes(array('kode' => $line->goods_code));
				
				if (!$goods) {
					continue; // Skip jika barang tidak ditemukan di master
				}
				
				// Cari UOM berdasarkan unit
				$uom = MUom::model()->findByAttributes(array('unit' => $line->uoe));
				
				if (!$uom) {
					// Gunakan smallest unit dari goods jika UOM tidak ditemukan
					$uom = MUom::model()->findByPk($goods->smallest_unit);
				}
				
				if (!$uom) {
					continue; // Skip jika UOM tidak valid
				}
				
				// Konversi qty ke smallest unit
				$qtyInSmallestUnit = floatval($line->qty_in_do);
				if ($uom->conversion > 1) {
					$qtyInSmallestUnit = $qtyInSmallestUnit * $uom->conversion;
				}
				
				// Aggregate by goods_id
				$goodsId = $goods->id;
				if (!isset($requiredGoods[$goodsId])) {
					$requiredGoods[$goodsId] = array(
						'goods_id' => $goodsId,
						'goods_code' => $goods->kode,
						'total_qty' => 0,
						'uom_id' => $goods->smallest_unit,
						'lines' => array()
					);
				}
				
				$requiredGoods[$goodsId]['total_qty'] += $qtyInSmallestUnit;
				$requiredGoods[$goodsId]['lines'][] = array(
					'do_id' => $do->id,
					'do_no' => $do->no_do,
					'qty' => $qtyInSmallestUnit,
					'original_qty' => $line->qty_in_do,
					'original_uom' => $line->uoe
				);
			}
		}
		
		return array_values($requiredGoods);
	}
	
	/**
	 * Cari warehouse terbaik berdasarkan prioritas
	 */
	private static function findBestWarehouse($requiredGoods)
	{
		// Get all active warehouses
		$warehouses = MWarehouse::model()->findAllByAttributes(array('status' => 'OPEN'));
		
		$warehouseScores = array();
		
		foreach ($warehouses as $warehouse) {
			$score = self::calculateWarehouseScore($warehouse, $requiredGoods);
			if ($score !== null) {
				$warehouseScores[] = $score;
			}
		}
		
		if (empty($warehouseScores)) {
			return null;
		}
		
		// Sort by priority (1 is highest)
		usort($warehouseScores, function($a, $b) {
			// First sort by priority
			if ($a['priority'] != $b['priority']) {
				return $a['priority'] - $b['priority'];
			}
			// If same priority, sort by score (higher is better)
			return $b['score'] - $a['score'];
		});
		
		return $warehouseScores[0];
	}
	
	/**
	 * Hitung score warehouse berdasarkan ketersediaan barang
	 */
	private static function calculateWarehouseScore($warehouse, $requiredGoods)
	{
		$canFulfillAll = true;
		$totalStock = 0;
		$oldestProductionDate = null;
		$locationDetails = array();
		$unfulfillableGoods = array();
		
		foreach ($requiredGoods as $required) {
			// Get stock for this goods in this warehouse
			$stockQuery = TStock::model()
				->with(array(
					'location' => array(
						'condition' => 'location.warehouse_id = :warehouse_id',
						'params' => array(':warehouse_id' => $warehouse->id)
					)
				))
				->findAll(array(
					'condition' => 't.goods_id = :goods_id AND t.status = :status',
					'params' => array(
						':goods_id' => $required['goods_id'],
						':status' => 'ACTIVE'
					),
					'order' => 't.production_date ASC, t.id ASC' // FIFO
				));
			
			$totalAvailable = 0;
			$allocatedQty = 0;
			$stockLocations = array();
			
			foreach ($stockQuery as $stock) {
				if ($stock->location) {
					$totalAvailable += $stock->qty;
					
					// Track oldest production date
					if ($stock->production_date && (!$oldestProductionDate || $stock->production_date < $oldestProductionDate)) {
						$oldestProductionDate = $stock->production_date;
					}
					
					// Allocate stock (FIFO)
					if ($allocatedQty < $required['total_qty']) {
						$qtyToAllocate = min($stock->qty, $required['total_qty'] - $allocatedQty);
						$allocatedQty += $qtyToAllocate;
						
						$stockLocations[] = array(
							'goods_id' => $required['goods_id'],
							'location_id' => $stock->location_id,
							'qty' => $qtyToAllocate,
							'uom_id' => $required['uom_id'],
							'production_date' => $stock->production_date
						);
					}
				}
			}
			
			$totalStock += $totalAvailable;
			
			// Check if can fulfill this goods requirement
			if ($totalAvailable < $required['total_qty']) {
				$canFulfillAll = false;
				$unfulfillableGoods[] = array(
					'goods_code' => $required['goods_code'],
					'required' => $required['total_qty'],
					'available' => $totalAvailable
				);
			} else {
				// Add to location details
				$locationDetails = array_merge($locationDetails, $stockLocations);
			}
		}
		
		// Skip warehouse if it has no stock at all
		if ($totalStock == 0) {
			return null;
		}
		
		// Calculate priority and score
		$priority = 4; // Default: least busy gate
		$priorityReason = 'Gate tersedia';
		$score = 0;
		
		if ($canFulfillAll) {
			// Priority 1: Can fulfill all
			$priority = 1;
			$priorityReason = 'Dapat memenuhi semua kebutuhan barang';
			$score = 1000;
		} else {
			// Count how many different goods this warehouse has
			$goodsCount = 0;
			foreach ($requiredGoods as $required) {
				$hasStock = TStock::model()
					->with(array(
						'location' => array(
							'condition' => 'location.warehouse_id = :warehouse_id',
							'params' => array(':warehouse_id' => $warehouse->id)
						)
					))
					->exists(array(
						'condition' => 't.goods_id = :goods_id AND t.qty > 0 AND t.status = :status',
						'params' => array(
							':goods_id' => $required['goods_id'],
							':status' => 'ACTIVE'
						)
					));
				
				if ($hasStock) {
					$goodsCount++;
				}
			}
			
			if ($goodsCount > 0) {
				// Priority 2: Has most stock variety
				$priority = 2;
				$priorityReason = 'Memiliki ' . $goodsCount . ' dari ' . count($requiredGoods) . ' jenis barang';
				$score = 500 + $goodsCount * 10;
			}
		}
		
		// Consider production date for priority 3 (FIFO)
		if ($priority > 1 && $oldestProductionDate) {
			$daysSinceProduction = (time() - strtotime($oldestProductionDate)) / (60 * 60 * 24);
			if ($daysSinceProduction > 30) { // If older than 30 days
				$priority = 3;
				$priorityReason = 'Barang dengan produksi tertua (FIFO): ' . $oldestProductionDate;
				$score = 300 + $daysSinceProduction;
			}
		}
		
		// Calculate gate availability
		$busyGates = TAntreanGate::model()
			->with(array(
				'antrean' => array(
					'condition' => 'antrean.status NOT IN (:closed, :verified)',
					'params' => array(':closed' => 'CLOSED', ':verified' => 'VERIFIED')
				),
				'gate' => array(
					'condition' => 'gate.warehouse_id = :warehouse_id',
					'params' => array(':warehouse_id' => $warehouse->id)
				)
			))
			->count();
		
		$totalGates = MGate::model()->countByAttributes(array(
			'warehouse_id' => $warehouse->id,
			'status' => 'OPEN'
		));
		
		$availableGates = $totalGates - $busyGates;
		
		// Adjust score based on gate availability
		$score += $availableGates * 5;
		
		return array(
			'warehouse_id' => $warehouse->id,
			'warehouse_name' => $warehouse->name,
			'priority' => $priority,
			'priority_reason' => $priorityReason,
			'score' => $score,
			'can_fulfill_all' => $canFulfillAll,
			'total_stock' => $totalStock,
			'available_gates' => $availableGates,
			'location_details' => $locationDetails,
			'unfulfillable_goods' => $unfulfillableGoods
		);
	}
	
	/**
	 * Assign gate yang tersedia untuk antrean
	 */
	private static function assignAvailableGates($antreanId, $warehouseId)
	{
		// Get all gates for this warehouse
		$gates = MGate::model()->findAllByAttributes(array(
			'warehouse_id' => $warehouseId,
			'status' => 'OPEN'
		));
		
		$assignedGates = array();
		
		foreach ($gates as $gate) {
			// Check if gate is busy
			$isBusy = TAntreanGate::model()
				->with(array(
					'antrean' => array(
						'condition' => 'antrean.status NOT IN (:closed, :verified)',
						'params' => array(':closed' => 'CLOSED', ':verified' => 'VERIFIED')
					)
				))
				->exists(array(
					'condition' => 't.gate_id = :gate_id',
					'params' => array(':gate_id' => $gate->id)
				));
			
			if (!$isBusy) {
				// Assign this gate
				$antreanGate = new TAntreanGate();
				$antreanGate->antrean_id = $antreanId;
				$antreanGate->gate_id = $gate->id;
				
				if ($antreanGate->save()) {
					$assignedGates[] = array(
						'gate_id' => $gate->id,
						'gate_code' => $gate->code
					);
				}
			}
		}
		
		return $assignedGates;
	}

}
