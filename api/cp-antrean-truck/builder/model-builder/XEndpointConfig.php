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

	/**
	 * Recommendation getAntrean with priority logic
	 * @param array $params
	 * @return mixed
	 */
	public static function getAntrean($params = [])
	{
		$xlog = new XApiLog;
		$xlog->created_time = date('Y-m-d H:i:s');
		$xlog->api = 'getAntrean';
		$xlog->payload = json_encode($params);
		$xlog->save();
		$logId = $xlog->id;
		$response = array();
		
		$transaction = Yii::app()->db->beginTransaction();
		
		try {
			// ========================================
			// VALIDASI PARAMETER
			// ========================================
			if (!isset($params['plat']) || empty($params['plat'])) {
				throw new Exception('Parameter plat wajib diisi');
			}
		
			$nopol = $params['plat'];
			$barcode_fg = isset($params['barcode_fg']) ? $params['barcode_fg'] : null;
			
			$savedDeliveryOrders = array();
			
			$dos = $params['do'];
			// Simpan DO dan DO Line
			foreach ($dos as $row) {
				// Cek apakah DO sudah ada dengan mempertimbangkan plat nomor dan tanggal
				$existingDO = TDeliveryOrder::model()->find(array(
					'condition' => 'no_do = :no_do AND truck_no = :truck_no',
					'params' => array(
						':no_do' => $row['delivery'],
						':truck_no' => $row['truck_numb']
					)
				));
				if (!$existingDO) {
					$do = new TDeliveryOrder();
					$do->synced_time = date('Y-m-d H:i:s');
					$do->status = 'OPEN';
					$do->id_sap = $row['delivery'];
					$do->plant = $row['plnt'];
					$do->truck_no = $row['truck_numb'];
					$do->out_date = DateTime::createFromFormat('d.m.Y', $row['out_date'])->format('Y-m-d');
					$do->no_do = $row['delivery'];
					$do->delivery_date = DateTime::createFromFormat('d.m.Y', $row['deliv_date'])->format('Y-m-d');
					$do->sorg = $row['sorg'];
					$do->customer_id = $row['customer'];
					$do->sold_to_party = $row['sold_to_party'];
					$do->created_by = $row['created_by'];
					$do->created_date = DateTime::createFromFormat('Ymd', $row['created_date'])->format('Y-m-d');
					$do->shiptotext = $row['shiptotext'];
					$do->cust_name = $row['cust_name'];
					$do->cust_city = $row['cust_city'];
					$do->cust_street = $row['cust_street'];
					$do->cust_strsuppl = $row['cust_strsuppl'];
					$do->sap_client = $row['sap_client'];
					$do->date_inserted = date('Y-m-d H:i:s');
					$do->jenis_truck = $params['jenis_truck'];
					
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
				$doLine->batch = '-';
				
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
				$doLines = TDeliveryOrderLine::model()->findAllByAttributes(array('do_id' => $do->id));
				
				foreach ($doLines as $line) {
					$goods = MGoods::model()->findByAttributes(array('kode' => $line->goods_code));
					
					if (!$goods) {
						continue;
					}
					
					$uom = MUom::model()->findByAttributes(array('unit' => $line->uoe));
					if (!$uom) {
						$uom = MUom::model()->findByPk($goods->smallest_unit);
					}
					if (!$uom) {
						continue;
					}
					
					$goodsId = $goods->id;
					if (!isset($requiredGoods[$goodsId])) {
						$requiredGoods[$goodsId] = array(
							'goods_id' => $goodsId,
							'goods_code' => $goods->kode,
							'details' => array()
						);
					}
					
					// Store requirement with its original UOM
					$requiredGoods[$goodsId]['details'][] = array(
						'qty' => floatval($line->qty_in_do),
						'uom_id' => $uom->id,
						'uom_unit' => $uom->unit,
						'conversion' => $uom->conversion,
						'convert_to' => $uom->convert_to
					);
				}
			}
			
			$requiredGoods = array_values($requiredGoods);
			
			// ========================================
			// 3. CARI WAREHOUSE TERBAIK BERDASARKAN PRIORITAS
			// ========================================
			$warehouses = MWarehouse::model()->findAllByAttributes(array('status' => 'OPEN'));
			$warehouseScores = array();
			
			foreach ($warehouses as $warehouse) {
				// ========================================
				// GET LAST COMPLETED OPNAME FOR THIS WAREHOUSE
				// ========================================
				$lastOpname = TOpnam::model()->find(array(
					'condition' => 'warehouse_id = :warehouse_id AND finished_time IS NOT NULL',
					'params' => array(':warehouse_id' => $warehouse->id),
					'order' => 'finished_time DESC'
				));
				
				// Skip warehouse if no completed opname exists
				if (!$lastOpname) {
					continue;
				}
				$canFulfillAll = true;
				$totalStock = 0;
				$earliestProductionDate = null;
				$locationDetails = array();
				$totalLoadingTime = 0;
				
				foreach ($requiredGoods as $required) {
					$goodsId = $required['goods_id'];
					
					// Get goods info for loading time calculation
					$goodsInfo = MGoods::model()->findByPk($goodsId);
					
					// For each requirement detail
					foreach ($required['details'] as $reqDetail) {
						$remainingQtyKg = $reqDetail['qty']; // Qty in KG from DO
						$targetUom = MUom::model()->findByPk($reqDetail['uom_id']);
						
						// ========================================
						// NEW SMART ALLOCATION STRATEGY
						// ========================================
						// 1. Determine if goods uses SACK or BOX from smallest_unit
						// 2. Calculate pallet requirement first (PK/PB)
						// 3. Allocate from pallet first, then remainder from smallest unit
						
						// Conversion: 1 SACK or 1 BOX = 50 KG
						$KG_PER_UNIT = 50;
						
						// Get smallest unit for this goods (1=SACK, 2=BOX)
						$smallestUnitId = $goodsInfo->smallest_unit;
						$isSack = ($smallestUnitId == 1);
						
						// Convert KG to base units (SACK or BOX)
						$totalUnitsNeeded = ceil($remainingQtyKg / $KG_PER_UNIT);
						
						// Calculate pallet requirements
						$palletAllocation = array();
						
						if ($isSack) {
							// For SACK: check PK-SACK (48 units) and PB-SACK (56 units)
							$pkSackUom = MUom::model()->find("unit = 'PK-SACK'");
							$pbSackUom = MUom::model()->find("unit = 'PB-SACK'");
							$sackUom = MUom::model()->find("unit = 'SACK'");
							
							if ($pkSackUom) {
								$pkUnitsNeeded = floor($totalUnitsNeeded / 48);
								if ($pkUnitsNeeded > 0) {
									$palletAllocation[] = array(
										'uom' => $pkSackUom,
										'qty_needed' => $pkUnitsNeeded,
										'units_per_pallet' => 48
									);
								}
							}
							
							if ($pbSackUom) {
								$pbUnitsNeeded = floor($totalUnitsNeeded / 56);
								if ($pbUnitsNeeded > 0) {
									$palletAllocation[] = array(
										'uom' => $pbSackUom,
										'qty_needed' => $pbUnitsNeeded,
										'units_per_pallet' => 56
									);
								}
							}
						} else {
							// For BOX: check PK-BOX (24 units) and PB-BOX (56 units)
							$pkBoxUom = MUom::model()->find("unit = 'PK-BOX'");
							$pbBoxUom = MUom::model()->find("unit = 'PB-BOX'");
							$boxUom = MUom::model()->find("unit = 'BOX'");
							
							if ($pkBoxUom) {
								$pkUnitsNeeded = floor($totalUnitsNeeded / 24);
								if ($pkUnitsNeeded > 0) {
									$palletAllocation[] = array(
										'uom' => $pkBoxUom,
										'qty_needed' => $pkUnitsNeeded,
										'units_per_pallet' => 24
									);
								}
							}
							
							if ($pbBoxUom) {
								$pbUnitsNeeded = floor($totalUnitsNeeded / 56);
								if ($pbUnitsNeeded > 0) {
									$palletAllocation[] = array(
										'uom' => $pbBoxUom,
										'qty_needed' => $pbUnitsNeeded,
										'units_per_pallet' => 56
									);
								}
							}
						}
						
						// Try to allocate pallets first
						$allocatedUnits = 0;
						$palletAllocated = false;
						
						foreach ($palletAllocation as $pallet) {
							if ($allocatedUnits >= $totalUnitsNeeded) break;
							
							// Find available pallet stock with oldest production date
							$palletStock = TStock::model()
								->with(array(
									'location' => array(
										'condition' => 'location.warehouse_id = :warehouse_id',
										'params' => array(':warehouse_id' => $warehouse->id)
									)
								))
								->findAll(array(
									'condition' => 't.goods_id = :goods_id AND t.uom_id = :uom_id AND t.opnam_id = :opnam_id AND t.qty >= :qty_needed',
									'params' => array(
										':goods_id' => $goodsId,
										':uom_id' => $pallet['uom']->id,
										':opnam_id' => $lastOpname->id,
										':qty_needed' => $pallet['qty_needed']
									),
									'order' => 't.production_date ASC, location.label ASC'
								));
							
							if (!empty($palletStock)) {
								$stock = $palletStock[0];
								if ($stock->location) {
									// Allocate this pallet
									$qtyToUse = min($pallet['qty_needed'], floor(($totalUnitsNeeded - $allocatedUnits) / $pallet['units_per_pallet']));
									
									$locationDetails[] = array(
										'goods_id' => $goodsId,
										'location_id' => $stock->location_id,
										'qty' => $qtyToUse,
										'uom_id' => $pallet['uom']->id,
										'production_date' => $stock->production_date
									);
									
									$allocatedUnits += $qtyToUse * $pallet['units_per_pallet'];
									$palletAllocated = true;
									$totalStock += $qtyToUse * $pallet['units_per_pallet'] * $KG_PER_UNIT;
									
									// Track production date
									if ($stock->production_date) {
										if (!$earliestProductionDate || $stock->production_date < $earliestProductionDate) {
											$earliestProductionDate = $stock->production_date;
										}
									}
								}
							}
						}
						
						// Calculate remaining units needed after pallet allocation
						$remainingUnits = $totalUnitsNeeded - $allocatedUnits;
						
						// Allocate remaining from smallest unit (SACK or BOX)
						if ($remainingUnits > 0) {
							$smallestUom = $isSack ? $sackUom : $boxUom;
							
							if ($smallestUom) {
								// Prefer location that already has pallet if possible
								$preferredLocationId = null;
								if (!empty($locationDetails)) {
									$preferredLocationId = $locationDetails[count($locationDetails)-1]['location_id'];
								}
								
								// Find stock with priority: same location > oldest production > least busy line
								$stockQuery = TStock::model()
									->with(array(
										'location' => array(
											'condition' => 'location.warehouse_id = :warehouse_id',
											'params' => array(':warehouse_id' => $warehouse->id)
										)
									))
									->findAll(array(
										'condition' => 't.goods_id = :goods_id AND t.uom_id = :uom_id AND t.opnam_id = :opnam_id AND t.qty >= :qty_needed',
										'params' => array(
											':goods_id' => $goodsId,
											':uom_id' => $smallestUom->id,
											':opnam_id' => $lastOpname->id,
											':qty_needed' => $remainingUnits
										),
										'order' => 't.production_date IS NULL DESC, t.production_date ASC, location.label ASC'
									));
								
								// Try to find stock in same location first
								$selectedStock = null;
								if ($preferredLocationId) {
									foreach ($stockQuery as $stock) {
										if ($stock->location_id == $preferredLocationId) {
											$selectedStock = $stock;
											break;
										}
									}
								}
								
								// If not found in same location, use first available
								if (!$selectedStock && !empty($stockQuery)) {
									$selectedStock = $stockQuery[0];
								}
								
								if ($selectedStock && $selectedStock->location) {
									$locationDetails[] = array(
										'goods_id' => $goodsId,
										'location_id' => $selectedStock->location_id,
										'qty' => $remainingUnits,
										'uom_id' => $smallestUom->id,
										'production_date' => $selectedStock->production_date
									);
									
									$totalStock += $remainingUnits * $KG_PER_UNIT;
									
									// Track production date
									if ($selectedStock->production_date) {
										if (!$earliestProductionDate || $selectedStock->production_date < $earliestProductionDate) {
											$earliestProductionDate = $selectedStock->production_date;
										}
									}
								} else {
									// Could not fulfill remaining units
									$canFulfillAll = false;
								}
							}
						}
						
						// Calculate loading time if goods info available
						if ($goodsInfo && $goodsInfo->loading_time) {
							$qtyInTons = $totalStock / 1000; // Convert KG to tons
							$totalLoadingTime += $qtyInTons * $goodsInfo->loading_time;
						}
					}
				}
				
				// Skip warehouse if it has no stock at all
				if ($totalStock == 0) {
					continue;
				}
				
				// ========================================
				// CALCULATE GATE LOADING TIME FOR PRIORITY 4
				// ========================================
				$gateLoadingTimes = array();
				$gates = MGate::model()->findAllByAttributes(array(
					'warehouse_id' => $warehouse->id,
					'status' => 'OPEN'
				));
				
				foreach ($gates as $gate) {
					// Calculate total loading time for this gate
					$gateLoadingTime = 0;
					
					// Get trucks currently at this gate
					$antreanAtGate = TAntreanGate::model()
						->with(array(
							'antrean' => array(
								'condition' => 'antrean.status IN (:loading, :verifying)',
								'params' => array(':loading' => 'LOADING', ':verifying' => 'VERIFYING')
							)
						))
						->findAll(array(
							'condition' => 't.gate_id = :gate_id',
							'params' => array(':gate_id' => $gate->id)
						));
					
					foreach ($antreanAtGate as $ag) {
						if (!$ag->antrean) continue;
						
						// Get goods for this truck to calculate loading time
						$antreanGoods = TAntreanRekomendasiLokasi::model()
							->with('goods')
							->findAll(array(
								'condition' => 't.antrean_id = :antrean_id',
								'params' => array(':antrean_id' => $ag->antrean->id)
							));
						
						foreach ($antreanGoods as $agItem) {
							if ($agItem->goods && $agItem->goods->loading_time) {
								// Convert qty to tons
								$qtyInTons = $agItem->qty;
								$uom = MUom::model()->findByPk($agItem->uom_id);
								if ($uom) {
									if (strtolower($uom->unit) == 'kg') {
										$qtyInTons = $agItem->qty / 1000;
									} else if ($uom->conversion) {
										$qtyInTons = ($agItem->qty * $uom->conversion) / 1000;
									}
								}
								$gateLoadingTime += $qtyInTons * $agItem->goods->loading_time;
							}
						}
					}
					
					$gateLoadingTimes[$gate->id] = $gateLoadingTime;
				}
				
				// Find gate with minimum loading time
				$minLoadingTime = PHP_INT_MAX;
				$bestGateId = null;
				foreach ($gateLoadingTimes as $gateId => $loadingTime) {
					if ($loadingTime < $minLoadingTime) {
						$minLoadingTime = $loadingTime;
						$bestGateId = $gateId;
					}
				}
				
				// ========================================
				// DETERMINE PRIORITY (1-4)
				// ========================================
				$priority = 4; // Default: least busy gate (by loading time)
				$score = 0;
				
				if ($canFulfillAll) {
					// Priority 1: Can fulfill all
					$priority = 1;
					$score = 10000;
				} else {
					// Count fulfilled goods variety
					$fulfilledCount = 0;
					$partialFulfilledCount = 0;
					
					foreach ($requiredGoods as $req) {
						$hasStock = false;
						foreach ($locationDetails as $loc) {
							if ($loc['goods_id'] == $req['goods_id']) {
								$hasStock = true;
								break;
							}
						}
						if ($hasStock) {
							$partialFulfilledCount++;
						}
					}
					
					if ($partialFulfilledCount == count($requiredGoods)) {
						// Can fulfill all types but not all quantities
						$priority = 2;
						$score = 5000 + ($totalStock * 10);
					} else if ($partialFulfilledCount > 0) {
						// Can partially fulfill some types
						$priority = 2;
						$score = 3000 + ($partialFulfilledCount * 100);
					}
				}
				
				// Adjust score for Priority 3 (earliest production date)
				if ($earliestProductionDate) {
					$daysSinceProduction = (time() - strtotime($earliestProductionDate)) / (60 * 60 * 24);
					if ($priority != 1) {
						$priority = 3;
						$score += $daysSinceProduction * 10; // Older stock gets higher score
					}
				}
				
				// Adjust score based on gate loading time (lower is better)
				if ($minLoadingTime < PHP_INT_MAX) {
					$score += (1000 - min(1000, $minLoadingTime)); // Inverse of loading time
				}
				
				$warehouseScores[] = array(
					'warehouse_id' => $warehouse->id,
					'warehouse_name' => $warehouse->name,
					'priority' => $priority,
					'score' => $score,
					'location_details' => $locationDetails,
					'best_gate_id' => $bestGateId,
					'min_loading_time' => $minLoadingTime,
					'can_fulfill_all' => $canFulfillAll
				);
			}
			
			// ========================================
			// HANDLE CASE WHERE NO WAREHOUSE CAN FULFILL
			// ========================================
			if (empty($warehouseScores)) {
				// Return all warehouses even if they can't fulfill
				// Just pick the one with most variety of goods
				foreach ($warehouses as $warehouse) {
					// Get last completed opname
					$lastOpname = TOpnam::model()->find(array(
						'condition' => 'warehouse_id = :warehouse_id AND finished_time IS NOT NULL',
						'params' => array(':warehouse_id' => $warehouse->id),
						'order' => 'finished_time DESC'
					));
					
					if (!$lastOpname) {
						continue;
					}
					
					$locationDetails = array();
					$goodsVariety = 0;
					
					foreach ($requiredGoods as $required) {
						$hasStock = TStock::model()
							->with(array(
								'location' => array(
									'condition' => 'location.warehouse_id = :warehouse_id',
									'params' => array(':warehouse_id' => $warehouse->id)
								)
							))
							->exists(array(
								'condition' => 't.goods_id = :goods_id AND t.opnam_id = :opnam_id AND t.qty > 0',
								'params' => array(
									':goods_id' => $required['goods_id'],
									':opnam_id' => $lastOpname->id
								)
							));
						
						if ($hasStock) {
							$goodsVariety++;
						}
					}
					
					if ($goodsVariety > 0) {
						$warehouseScores[] = array(
							'warehouse_id' => $warehouse->id,
							'warehouse_name' => $warehouse->name,
							'priority' => 4,
							'score' => $goodsVariety,
							'location_details' => array(), // Will be empty, no specific recommendations
							'best_gate_id' => null,
							'min_loading_time' => 0,
							'can_fulfill_all' => false
						);
					}
				}
			}
			
			// If still no warehouses, just return first warehouse with completed opname
			if (empty($warehouseScores)) {
				$firstWarehouse = MWarehouse::model()->find(array(
					'condition' => 'status = :status AND EXISTS (
						SELECT 1 FROM t_opnam 
						WHERE t_opnam.warehouse_id = t.id 
						AND t_opnam.finished_time IS NOT NULL
					)',
					'params' => array(':status' => 'OPEN')
				));
				if ($firstWarehouse) {
					$warehouseScores[] = array(
						'warehouse_id' => $firstWarehouse->id,
						'warehouse_name' => $firstWarehouse->name,
						'priority' => 4,
						'score' => 0,
						'location_details' => array(),
						'best_gate_id' => null,
						'min_loading_time' => 0,
						'can_fulfill_all' => false
					);
				}
			}
			
			// Sort by priority and score
			usort($warehouseScores, function($a, $b) {
				if ($a['priority'] != $b['priority']) {
					return $a['priority'] - $b['priority'];
				}
				return $b['score'] - $a['score'];
			});
			
			$warehouseRecommendation = $warehouseScores[0];
			
			// Get first DO ID from saved delivery orders
			$firstDoId = null;
			if (!empty($savedDeliveryOrders)) {
				$firstDoId = array_keys($savedDeliveryOrders)[0];
			}
			
			// ========================================
			// 4. CREATE ANTREAN
			// ========================================
			$antrean = new TAntrean();
			$antrean->nopol = $nopol;
			$antrean->created_time = date('Y-m-d H:i:s');
			$antrean->warehouse_id = $warehouseRecommendation['warehouse_id'];
			$antrean->status = 'OPEN';
			$antrean->qr_code = $barcode_fg;
			$antrean->do_id = $firstDoId;
			
			if (!$antrean->save()) {
				throw new Exception('Gagal menyimpan antrean: ' . json_encode($antrean->getErrors()));
			}
			
			// ========================================
			// 5. SAVE LOCATION RECOMMENDATIONS
			// ========================================
			// Save recommendations with or without location_id
			if (!empty($warehouseRecommendation['location_details'])) {
				// Save recommendations WITH location_id
				foreach ($warehouseRecommendation['location_details'] as $detail) {
					$rekomendasi = new TAntreanRekomendasiLokasi();
					$rekomendasi->antrean_id = $antrean->id;
					$rekomendasi->goods_id = $detail['goods_id'];
					$rekomendasi->location_id = $detail['location_id'];
					$rekomendasi->qty = $detail['qty'];
					$rekomendasi->uom_id = $detail['uom_id'];
					if (isset($detail['production_date'])) {
						$rekomendasi->tgl_produksi = $detail['production_date'];
					}
					
					if (!$rekomendasi->save()) {
						throw new Exception('Gagal menyimpan rekomendasi lokasi: ' . json_encode($rekomendasi->getErrors()));
					}
				}
			} else {
				// Save recommendations WITHOUT location_id (just the goods requirements)
				foreach ($requiredGoods as $required) {
					foreach ($required['details'] as $detail) {
						$rekomendasi = new TAntreanRekomendasiLokasi();
						$rekomendasi->antrean_id = $antrean->id;
						$rekomendasi->goods_id = $required['goods_id'];
						$rekomendasi->location_id = null; // No location available
						$rekomendasi->qty = $detail['qty'];
						$rekomendasi->uom_id = $detail['uom_id'];
						
						if (!$rekomendasi->save()) {
							throw new Exception('Gagal menyimpan rekomendasi lokasi: ' . json_encode($rekomendasi->getErrors()));
						}
					}
				}
			}
			
			// ========================================
			// 6. ASSIGN BEST GATE
			// ========================================
			if ($warehouseRecommendation['best_gate_id']) {
				$antreanGate = new TAntreanGate();
				$antreanGate->antrean_id = $antrean->id;
				$antreanGate->gate_id = $warehouseRecommendation['best_gate_id'];
				$antreanGate->save();
			} else {
				// Fallback: assign any available gate
				$gates = MGate::model()->findAllByAttributes(array(
					'warehouse_id' => $warehouseRecommendation['warehouse_id'],
					'status' => 'OPEN'
				));
				
				foreach ($gates as $gate) {
					$antreanGate = new TAntreanGate();
					$antreanGate->antrean_id = $antrean->id;
					$antreanGate->gate_id = $gate->id;
					
					if ($antreanGate->save()) {
						break;
					}
				}
			}
			
			$transaction->commit();
			
			$response = array(
				'status' => 'Success',
				'warehouse' => $warehouseRecommendation['warehouse_name'],
				'timestamp' => date('Y-m-d H:i:s')
			);
			
			$xlog = XApiLog::model()->findByPk($logId);
			if ($xlog) {
				$xlog->response = json_encode($response);
				$xlog->save();
			}
			
			return $response;
			
		} catch (Exception $e) {
			$transaction->rollback();
			
			$response = array(
				'status' => 'Failed',
				'message' => $e->getMessage(),
				'timestamp' => date('Y-m-d H:i:s')
			);
			
			$xlog = XApiLog::model()->findByPk($logId);
			if ($xlog) {
				$xlog->response = json_encode($response);
				$xlog->save();
			}
			
			return $response;
		}
	}
}