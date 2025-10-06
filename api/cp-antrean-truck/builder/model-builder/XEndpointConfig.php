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
					$do->customer_id = isset($row['customer']) ? $row['customer'] : null;
					$do->sold_to_party = isset($row['sold_to_party']) ? $row['sold_to_party'] : null;
					$do->created_by = $row['created_by'];
					$do->created_date = DateTime::createFromFormat('Ymd', $row['created_date'])->format('Y-m-d');
					$do->shiptotext = isset($row['shiptotext']) ? $row['shiptotext'] : null;
					$do->cust_name = isset($row['cust_name']) ? $row['cust_name'] : null;
					$do->cust_city = isset($row['cust_city']) ? $row['cust_city'] : null;
					$do->cust_street = isset($row['cust_street']) ? $row['cust_street'] : null;
					$do->cust_strsuppl = isset($row['cust_strsuppl']) ? $row['cust_strsuppl'] : null;
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
						
						// Get weight per unit from goods
						$KG_PER_UNIT = $goodsInfo->weight;
						
						// Get smallest unit for this goods (1=SACK, 2=BOX)
						$smallestUnitId = $goodsInfo->smallest_unit;
						$isSack = ($smallestUnitId == 1);
						
						// Convert KG to base units (SACK or BOX)
						$totalUnitsNeeded = ceil($remainingQtyKg / $KG_PER_UNIT);
						
						// Calculate pallet requirements
						$palletAllocation = array();
						
						if ($isSack) {
							// For SACK: check PK-SACK and PB-SACK
							$pkSackUom = MUom::model()->find("unit = 'PK-SACK'");
							$pbSackUom = MUom::model()->find("unit = 'PB-SACK'");
							$sackUom = MUom::model()->find("unit = 'SACK'");
							
							if ($pkSackUom && $pkSackUom->conversion) {
								$pkUnitsPerPallet = $pkSackUom->conversion;
								$pkUnitsNeeded = floor($totalUnitsNeeded / $pkUnitsPerPallet);
								if ($pkUnitsNeeded > 0) {
									$palletAllocation[] = array(
										'uom' => $pkSackUom,
										'qty_needed' => $pkUnitsNeeded,
										'units_per_pallet' => $pkUnitsPerPallet
									);
								}
							}
							
							if ($pbSackUom && $pbSackUom->conversion) {
								$pbUnitsPerPallet = $pbSackUom->conversion;
								$pbUnitsNeeded = floor($totalUnitsNeeded / $pbUnitsPerPallet);
								if ($pbUnitsNeeded > 0) {
									$palletAllocation[] = array(
										'uom' => $pbSackUom,
										'qty_needed' => $pbUnitsNeeded,
										'units_per_pallet' => $pbUnitsPerPallet
									);
								}
							}
						} else {
							// For BOX: check PK-BOX and PB-BOX
							$pkBoxUom = MUom::model()->find("unit = 'PK-BOX'");
							$pbBoxUom = MUom::model()->find("unit = 'PB-BOX'");
							$boxUom = MUom::model()->find("unit = 'BOX'");
							
							if ($pkBoxUom && $pkBoxUom->conversion) {
								$pkUnitsPerPallet = $pkBoxUom->conversion;
								$pkUnitsNeeded = floor($totalUnitsNeeded / $pkUnitsPerPallet);
								if ($pkUnitsNeeded > 0) {
									$palletAllocation[] = array(
										'uom' => $pkBoxUom,
										'qty_needed' => $pkUnitsNeeded,
										'units_per_pallet' => $pkUnitsPerPallet
									);
								}
							}
							
							if ($pbBoxUom && $pbBoxUom->conversion) {
								$pbUnitsPerPallet = $pbBoxUom->conversion;
								$pbUnitsNeeded = floor($totalUnitsNeeded / $pbUnitsPerPallet);
								if ($pbUnitsNeeded > 0) {
									$palletAllocation[] = array(
										'uom' => $pbBoxUom,
										'qty_needed' => $pbUnitsNeeded,
										'units_per_pallet' => $pbUnitsPerPallet
									);
								}
							}
						}
						
						// Try to allocate pallets first
						$allocatedUnits = 0;
						$palletAllocated = false;
						$recommendedAllocation = array(); // Track what should be allocated even if no stock
						
						foreach ($palletAllocation as $pallet) {
							if ($allocatedUnits >= $totalUnitsNeeded) break;
							
							$qtyToUse = min($pallet['qty_needed'], floor(($totalUnitsNeeded - $allocatedUnits) / $pallet['units_per_pallet']));
							if ($qtyToUse <= 0) continue;
							
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
										':qty_needed' => $qtyToUse
									),
									'order' => 't.production_date ASC, location.label ASC'
								));
							
							if (!empty($palletStock)) {
								$stock = $palletStock[0];
								if ($stock->location) {
									// Allocate this pallet WITH location
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
							} else {
								// No stock available but track the recommendation WITHOUT location
								$recommendedAllocation[] = array(
									'goods_id' => $goodsId,
									'location_id' => null,
									'qty' => $qtyToUse,
									'uom_id' => $pallet['uom']->id,
									'production_date' => null
								);
								$allocatedUnits += $qtyToUse * $pallet['units_per_pallet'];
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
									// No stock available but track the recommendation WITHOUT location
									$recommendedAllocation[] = array(
										'goods_id' => $goodsId,
										'location_id' => null,
										'qty' => $remainingUnits,
										'uom_id' => $smallestUom->id,
										'production_date' => null
									);
									$canFulfillAll = false;
								}
							}
						}
						
						// Merge recommended allocation (without location) with location details
						if (!empty($recommendedAllocation)) {
							foreach ($recommendedAllocation as $rec) {
								$locationDetails[] = $rec;
							}
						}
						
						// Calculate loading time if goods info available
						if ($goodsInfo && $goodsInfo->loading_time) {
							$qtyInTons = $totalStock / 1000; // Convert KG to tons
							$totalLoadingTime += $qtyInTons * $goodsInfo->loading_time;
						}
					}
				}
				
				// Don't skip warehouse even if no stock - we still want to save the allocation calculation
				// if ($totalStock == 0) {
				//	continue;
				// }
				
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
				// Calculate allocation requirements even without stock
				$locationDetails = array();
				
				foreach ($requiredGoods as $required) {
					$goodsId = $required['goods_id'];
					$goodsInfo = MGoods::model()->findByPk($goodsId);
					
					foreach ($required['details'] as $reqDetail) {
						$remainingQtyKg = $reqDetail['qty'];
						
						// Get weight per unit from goods
						$KG_PER_UNIT = $goodsInfo->weight;
						
						// Get smallest unit for this goods (1=SACK, 2=BOX)
						$smallestUnitId = $goodsInfo->smallest_unit;
						$isSack = ($smallestUnitId == 1);
						
						// Convert KG to base units (SACK or BOX)
						$totalUnitsNeeded = ceil($remainingQtyKg / $KG_PER_UNIT);
						
						if ($isSack) {
							$pkSackUom = MUom::model()->find("unit = 'PK-SACK'");
							$sackUom = MUom::model()->find("unit = 'SACK'");
							
							if ($pkSackUom && $pkSackUom->conversion) {
								$pkUnitsPerPallet = $pkSackUom->conversion;
								$pkUnitsNeeded = floor($totalUnitsNeeded / $pkUnitsPerPallet);
								if ($pkUnitsNeeded > 0) {
									$locationDetails[] = array(
										'goods_id' => $goodsId,
										'location_id' => null,
										'qty' => $pkUnitsNeeded,
										'uom_id' => $pkSackUom->id,
										'production_date' => null
									);
									$totalUnitsNeeded -= $pkUnitsNeeded * $pkUnitsPerPallet;
								}
							}
							
							// Remainder in SACK
							if ($totalUnitsNeeded > 0 && $sackUom) {
								$locationDetails[] = array(
									'goods_id' => $goodsId,
									'location_id' => null,
									'qty' => $totalUnitsNeeded,
									'uom_id' => $sackUom->id,
									'production_date' => null
								);
							}
						} else {
							$pkBoxUom = MUom::model()->find("unit = 'PK-BOX'");
							$boxUom = MUom::model()->find("unit = 'BOX'");
							
							if ($pkBoxUom && $pkBoxUom->conversion) {
								$pkUnitsPerPallet = $pkBoxUom->conversion;
								$pkUnitsNeeded = floor($totalUnitsNeeded / $pkUnitsPerPallet);
								if ($pkUnitsNeeded > 0) {
									$locationDetails[] = array(
										'goods_id' => $goodsId,
										'location_id' => null,
										'qty' => $pkUnitsNeeded,
										'uom_id' => $pkBoxUom->id,
										'production_date' => null
									);
									$totalUnitsNeeded -= $pkUnitsNeeded * $pkUnitsPerPallet;
								}
							}
							
							// Remainder in BOX
							if ($totalUnitsNeeded > 0 && $boxUom) {
								$locationDetails[] = array(
									'goods_id' => $goodsId,
									'location_id' => null,
									'qty' => $totalUnitsNeeded,
									'uom_id' => $boxUom->id,
									'production_date' => null
								);
							}
						}
					}
				}
				
				// Get first available warehouse
				$firstWarehouse = MWarehouse::model()->find(array(
					'condition' => 'status = :status',
					'params' => array(':status' => 'OPEN'),
					'order' => 'id ASC'
				));
				
				if ($firstWarehouse) {
					$warehouseScores[] = array(
						'warehouse_id' => $firstWarehouse->id,
						'warehouse_name' => '', // Empty when no stock available
						'priority' => 5,
						'score' => 0,
						'location_details' => $locationDetails,
						'best_gate_id' => null,
						'min_loading_time' => 0,
						'can_fulfill_all' => false
					);
				} else {
					// No warehouse at all, still save with null values
					$warehouseScores[] = array(
						'warehouse_id' => null,
						'warehouse_name' => '',
						'priority' => 5,
						'score' => 0,
						'location_details' => $locationDetails,
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
			// If warehouse_id is null, get first available warehouse for antrean
			if (empty($warehouseRecommendation['warehouse_id'])) {
				$defaultWarehouse = MWarehouse::model()->find(array(
					'condition' => 'status = :status',
					'params' => array(':status' => 'OPEN'),
					'order' => 'id ASC'
				));
				if ($defaultWarehouse) {
					$warehouseRecommendation['warehouse_id'] = $defaultWarehouse->id;
				}
			}
			
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
			// Save all recommendations (with or without location_id)
			$savedRecommendations = array();
			if (!empty($warehouseRecommendation['location_details'])) {
				foreach ($warehouseRecommendation['location_details'] as $detail) {
					$rekomendasi = new TAntreanRekomendasiLokasi();
					$rekomendasi->antrean_id = $antrean->id;
					$rekomendasi->goods_id = $detail['goods_id'];
					$rekomendasi->location_id = isset($detail['location_id']) ? $detail['location_id'] : null;
					$rekomendasi->qty = $detail['qty'];
					$rekomendasi->uom_id = $detail['uom_id'];
					if (isset($detail['production_date']) && $detail['production_date']) {
						$rekomendasi->tgl_produksi = $detail['production_date'];
					}
					
					if (!$rekomendasi->save()) {
						throw new Exception('Gagal menyimpan rekomendasi lokasi: ' . json_encode($rekomendasi->getErrors()));
					}
					$savedRecommendations[] = $rekomendasi;
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
			
			// Return single response object
			$response = array(
				'status' => 'Success',
				'warehouse' => !empty($warehouseRecommendation['warehouse_name']) ? $warehouseRecommendation['warehouse_name'] : '',
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