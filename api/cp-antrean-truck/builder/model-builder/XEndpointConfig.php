<?php

class XEndpointConfig extends ActiveRecord
{

	public function tableName()
	{
		return 'x_endpoint_config';
	}

	public function rules()
	{
		return array(
			array('label, endpoint', 'length', 'max'=>256),
		);
	}

	public function relations()
	{
		return array(
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'label' => 'Label',
			'endpoint' => 'Endpoint',
		);
	}

	public static function getAntrean($params = [])
	{
	    return ['status' => 'Success', 'warehouse' => 'GUDANG TIMUR', 'timestamp' => date('Y-m-d H:i:s')];
	    
		$transaction = Yii::app()->db->beginTransaction();
		
		try {
			// ========================================
			// VALIDASI PARAMETER
			// ========================================
			if (!isset($params['nopol']) || empty($params['nopol'])) {
				throw new Exception('Parameter nopol wajib diisi');
			}
			
			$nopol = $params['nopol'];
			
			// ========================================
			// 1. FETCH DAN SIMPAN DELIVERY ORDER DARI API SAP
			// ========================================
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
			
			if (empty($savedDeliveryOrders)) {
				throw new Exception('Tidak ada delivery order yang ditemukan untuk nopol: ' . $nopol);
			}
			
			// ========================================
			// 2. ANALISIS BARANG YANG DIBUTUHKAN DARI SEMUA DO
			// ========================================
			$requiredGoods = array();
			
			foreach ($savedDeliveryOrders as $do) {
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
							'uom_id' => $goods->smallest_unit
						);
					}
					
					$requiredGoods[$goodsId]['total_qty'] += $qtyInSmallestUnit;
				}
			}
			
			$requiredGoods = array_values($requiredGoods);
			
			// ========================================
			// 3. CARI WAREHOUSE TERBAIK BERDASARKAN PRIORITAS
			// ========================================
			// Get all active warehouses
			$warehouses = MWarehouse::model()->findAllByAttributes(array('status' => 'OPEN'));
			
			$warehouseScores = array();
			
			foreach ($warehouses as $warehouse) {
				// ========================================
				// HITUNG SCORE UNTUK SETIAP WAREHOUSE
				// ========================================
				$canFulfillAll = true;
				$totalStock = 0;
				$oldestProductionDate = null;
				$locationDetails = array();
				
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
									'uom_id' => $required['uom_id']
								);
							}
						}
					}
					
					$totalStock += $totalAvailable;
					
					// Check if can fulfill this goods requirement
					if ($totalAvailable < $required['total_qty']) {
						$canFulfillAll = false;
					} else {
						// Add to location details
						$locationDetails = array_merge($locationDetails, $stockLocations);
					}
				}
				
				// Skip warehouse if it has no stock at all
				if ($totalStock == 0) {
					continue;
				}
				
				// ========================================
				// TENTUKAN PRIORITAS (1-4)
				// ========================================
				$priority = 4; // Default: least busy gate
				$score = 0;
				
				if ($canFulfillAll) {
					// Priority 1: Can fulfill all
					$priority = 1;
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
						$score = 500 + $goodsCount * 10;
					}
				}
				
				// Consider production date for priority 3 (FIFO)
				if ($priority > 1 && $oldestProductionDate) {
					$daysSinceProduction = (time() - strtotime($oldestProductionDate)) / (60 * 60 * 24);
					if ($daysSinceProduction > 30) { // If older than 30 days
						$priority = 3;
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
				
				$warehouseScores[] = array(
					'warehouse_id' => $warehouse->id,
					'warehouse_name' => $warehouse->name,
					'priority' => $priority,
					'score' => $score,
					'location_details' => $locationDetails
				);
			}
			
			if (empty($warehouseScores)) {
				throw new Exception('Tidak ada warehouse yang dapat memenuhi kebutuhan barang');
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
			
			$warehouseRecommendation = $warehouseScores[0];
			
			// ========================================
			// 4. BUAT ANTREAN BARU
			// ========================================
			$antrean = new TAntrean();
			$antrean->nopol = $nopol;
			$antrean->created_time = date('Y-m-d H:i:s');
			$antrean->warehouse_id = $warehouseRecommendation['warehouse_id'];
			$antrean->status = 'OPEN';
			
			if (!$antrean->save()) {
				throw new Exception('Gagal menyimpan antrean: ' . json_encode($antrean->getErrors()));
			}
			
			// ========================================
			// 5. SIMPAN REKOMENDASI LOKASI UNTUK SETIAP BARANG
			// ========================================
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
			
			// ========================================
			// 6. ASSIGN GATE YANG TERSEDIA
			// ========================================
			$gates = MGate::model()->findAllByAttributes(array(
				'warehouse_id' => $warehouseRecommendation['warehouse_id'],
				'status' => 'OPEN'
			));
			
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
					$antreanGate->antrean_id = $antrean->id;
					$antreanGate->gate_id = $gate->id;
					
					$antreanGate->save();
				}
			}
			
			$transaction->commit();
			
			// ========================================
			// RETURN ONLY WAREHOUSE_ID
			// ========================================
			return $warehouseRecommendation['warehouse_id'];
			
		} catch (Exception $e) {
			$transaction->rollback();
			throw new Exception($e->getMessage());
		}
	}
}
