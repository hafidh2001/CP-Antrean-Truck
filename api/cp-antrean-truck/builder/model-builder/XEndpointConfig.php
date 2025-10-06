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
				// Cek apakah DO sudah ada
				$existingDO = TDeliveryOrder::model()->findByAttributes(array('no_do' => $row['delivery']));
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
							'weight' => $goods->weight,
							'smallest_unit' => $goods->smallest_unit,
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
					$weight = $required['weight'];
					$smallestUnitId = $required['smallest_unit'];

					// Get goods info for loading time calculation
					$goodsInfo = MGoods::model()->findByPk($goodsId);

					// For each requirement detail
					foreach ($required['details'] as $reqDetail) {
						$remainingQtyKg = $reqDetail['qty']; // Qty in KG from DO

						// Convert KG to base units (SACK or BOX)
						$totalUnitsNeeded = ceil($remainingQtyKg / $weight);

						// Determine if goods uses SACK or BOX
						$isSack = ($smallestUnitId == 1);

						// ========================================
						// STEP 1: HITUNG KEDUA OPSI (PK dan PB)
						// ========================================
						$palletOptions = array();

						if ($isSack) {
							$pkSackUom = MUom::model()->find("unit = 'PK-SACK'");
							$pbSackUom = MUom::model()->find("unit = 'PB-SACK'");
							$sackUom = MUom::model()->find("unit = 'SACK'");

							// Opsi 1: PK-SACK
							if ($pkSackUom && $pkSackUom->conversion > 0) {
								$pkPallets = floor($totalUnitsNeeded / $pkSackUom->conversion);
								$pkRemainder = $totalUnitsNeeded - ($pkPallets * $pkSackUom->conversion);

								$palletOptions['PK'] = array(
									'pallet_uom' => $pkSackUom,
									'pallet_qty' => $pkPallets,
									'remainder' => $pkRemainder,
									'smallest_uom' => $sackUom
								);
							}

							// Opsi 2: PB-SACK
							if ($pbSackUom && $pbSackUom->conversion > 0) {
								$pbPallets = floor($totalUnitsNeeded / $pbSackUom->conversion);
								$pbRemainder = $totalUnitsNeeded - ($pbPallets * $pbSackUom->conversion);

								$palletOptions['PB'] = array(
									'pallet_uom' => $pbSackUom,
									'pallet_qty' => $pbPallets,
									'remainder' => $pbRemainder,
									'smallest_uom' => $sackUom
								);
							}
						} else {
							$pkBoxUom = MUom::model()->find("unit = 'PK-BOX'");
							$pbBoxUom = MUom::model()->find("unit = 'PB-BOX'");
							$boxUom = MUom::model()->find("unit = 'BOX'");

							// Opsi 1: PK-BOX
							if ($pkBoxUom && $pkBoxUom->conversion > 0) {
								$pkPallets = floor($totalUnitsNeeded / $pkBoxUom->conversion);
								$pkRemainder = $totalUnitsNeeded - ($pkPallets * $pkBoxUom->conversion);

								$palletOptions['PK'] = array(
									'pallet_uom' => $pkBoxUom,
									'pallet_qty' => $pkPallets,
									'remainder' => $pkRemainder,
									'smallest_uom' => $boxUom
								);
							}

							// Opsi 2: PB-BOX
							if ($pbBoxUom && $pbBoxUom->conversion > 0) {
								$pbPallets = floor($totalUnitsNeeded / $pbBoxUom->conversion);
								$pbRemainder = $totalUnitsNeeded - ($pbPallets * $pbBoxUom->conversion);

								$palletOptions['PB'] = array(
									'pallet_uom' => $pbBoxUom,
									'pallet_qty' => $pbPallets,
									'remainder' => $pbRemainder,
									'smallest_uom' => $boxUom
								);
							}
						}

						// ========================================
						// STEP 2: PILIH SALAH SATU OPSI TERBAIK
						// ========================================
						$selectedOption = null;

						// Prioritas: PK jika remainder lebih kecil atau sama
						if (isset($palletOptions['PK']) && isset($palletOptions['PB'])) {
							if ($palletOptions['PK']['remainder'] <= $palletOptions['PB']['remainder']) {
								$selectedOption = $palletOptions['PK'];
							} else {
								$selectedOption = $palletOptions['PB'];
							}
						} else if (isset($palletOptions['PK'])) {
							$selectedOption = $palletOptions['PK'];
						} else if (isset($palletOptions['PB'])) {
							$selectedOption = $palletOptions['PB'];
						}

						// ========================================
						// STEP 3: CEK STOCK DAN SAVE
						// ========================================
						if ($selectedOption) {
							// Cek stock untuk pallet
							if ($selectedOption['pallet_qty'] > 0) {
								$palletStock = TStock::model()
									->with(array(
										'location' => array(
											'condition' => 'location.warehouse_id = :warehouse_id',
											'params' => array(':warehouse_id' => $warehouse->id)
										)
									))
									->find(array(
										'condition' => 't.goods_id = :goods_id AND t.uom_id = :uom_id AND t.opnam_id = :opnam_id AND t.qty >= :qty_needed',
										'params' => array(
											':goods_id' => $goodsId,
											':uom_id' => $selectedOption['pallet_uom']->id,
											':opnam_id' => $lastOpname->id,
											':qty_needed' => $selectedOption['pallet_qty']
										),
										'order' => 't.production_date ASC, location.label ASC'
									));

								if ($palletStock && $palletStock->location) {
									// Ada stock - save dengan location_id
									$locationDetails[] = array(
										'goods_id' => $goodsId,
										'location_id' => $palletStock->location_id,
										'qty' => $selectedOption['pallet_qty'],
										'uom_id' => $selectedOption['pallet_uom']->id,
										'production_date' => $palletStock->production_date
									);

									$totalStock += $selectedOption['pallet_qty'] * $selectedOption['pallet_uom']->conversion * $weight;

									if ($palletStock->production_date) {
										if (!$earliestProductionDate || $palletStock->production_date < $earliestProductionDate) {
											$earliestProductionDate = $palletStock->production_date;
										}
									}
								} else {
									// Tidak ada stock - save tanpa location_id
									$locationDetails[] = array(
										'goods_id' => $goodsId,
										'location_id' => null,
										'qty' => $selectedOption['pallet_qty'],
										'uom_id' => $selectedOption['pallet_uom']->id,
										'production_date' => null
									);
									$canFulfillAll = false;
								}
							}

							// Cek stock untuk remainder (SACK/BOX)
							if ($selectedOption['remainder'] > 0 && $selectedOption['smallest_uom']) {
								$smallestStock = TStock::model()
									->with(array(
										'location' => array(
											'condition' => 'location.warehouse_id = :warehouse_id',
											'params' => array(':warehouse_id' => $warehouse->id)
										)
									))
									->find(array(
										'condition' => 't.goods_id = :goods_id AND t.uom_id = :uom_id AND t.opnam_id = :opnam_id AND t.qty >= :qty_needed',
										'params' => array(
											':goods_id' => $goodsId,
											':uom_id' => $selectedOption['smallest_uom']->id,
											':opnam_id' => $lastOpname->id,
											':qty_needed' => $selectedOption['remainder']
										),
										'order' => 't.production_date ASC, location.label ASC'
									));

								if ($smallestStock && $smallestStock->location) {
									// Ada stock - save dengan location_id
									$locationDetails[] = array(
										'goods_id' => $goodsId,
										'location_id' => $smallestStock->location_id,
										'qty' => $selectedOption['remainder'],
										'uom_id' => $selectedOption['smallest_uom']->id,
										'production_date' => $smallestStock->production_date
									);

									$totalStock += $selectedOption['remainder'] * $weight;

									if ($smallestStock->production_date) {
										if (!$earliestProductionDate || $smallestStock->production_date < $earliestProductionDate) {
											$earliestProductionDate = $smallestStock->production_date;
										}
									}
								} else {
									// Tidak ada stock - save tanpa location_id
									$locationDetails[] = array(
										'goods_id' => $goodsId,
										'location_id' => null,
										'qty' => $selectedOption['remainder'],
										'uom_id' => $selectedOption['smallest_uom']->id,
										'production_date' => null
									);
									$canFulfillAll = false;
								}
							}
						}

						// Calculate loading time if goods info available
						if ($goodsInfo && $goodsInfo->loading_time && $totalStock > 0) {
							$qtyInTons = $totalStock / 1000;
							$totalLoadingTime += $qtyInTons * $goodsInfo->loading_time;
						}
					}
				}

				// Check if any location has actual stock (location_id not null)
				$hasActualStock = false;
				foreach ($locationDetails as $detail) {
					if (isset($detail['location_id']) && $detail['location_id'] !== null) {
						$hasActualStock = true;
						break;
					}
				}

				// If no actual stock locations, use warehouse_id = 1 (GUDANG TIMUR)
				$finalWarehouseId = $hasActualStock ? $warehouse->id : 1;
				$warehouseName = $hasActualStock ? $warehouse->name : '';

				$warehouseScores[] = array(
					'warehouse_id' => $finalWarehouseId,
					'warehouse_name' => $warehouseName,
					'priority' => $canFulfillAll ? 1 : 2,
					'score' => $canFulfillAll ? 10000 : $totalStock,
					'location_details' => $locationDetails,
					'best_gate_id' => null,
					'min_loading_time' => 0,
					'can_fulfill_all' => $canFulfillAll
				);
			}

			// Sort by priority and score
			usort($warehouseScores, function($a, $b) {
				if ($a['priority'] != $b['priority']) {
					return $a['priority'] - $b['priority'];
				}
				return $b['score'] - $a['score'];
			});

			$warehouseRecommendation = !empty($warehouseScores) ? $warehouseScores[0] : array(
				'warehouse_id' => 1,
				'warehouse_name' => '',
				'location_details' => array()
			);

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
				}
			}

			// ========================================
			// 6. ASSIGN GATE
			// ========================================
			$gates = MGate::model()->findAllByAttributes(array(
				'warehouse_id' => $warehouseRecommendation['warehouse_id'],
				'status' => 'OPEN'
			));

			if (!empty($gates)) {
				$antreanGate = new TAntreanGate();
				$antreanGate->antrean_id = $antrean->id;
				$antreanGate->gate_id = $gates[0]->id;
				$antreanGate->save();
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
