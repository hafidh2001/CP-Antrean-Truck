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
					$goodsCode = $required['goods_code'];
					$weight = $required['weight'];
					$smallestUnitId = $required['smallest_unit'];

					// Get goods info for loading time calculation (ambil salah satu saja untuk loading_time)
					$goodsInfo = MGoods::model()->findByAttributes(array('kode' => $goodsCode));

					// AGGREGATE total qty dari semua DO lines untuk goods ini
					$totalQtyKg = 0;
					foreach ($required['details'] as $reqDetail) {
						$totalQtyKg += $reqDetail['qty'];
					}

					// Convert KG to base units (SACK or BOX) - SEKALI saja untuk semua DO lines
					$totalUnitsNeeded = ceil($totalQtyKg / $weight);

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
					// STEP 2: CEK STOCK UNTUK PK DAN PB (menggunakan raw SQL seperti getTracking)
					// ========================================
					$pkStockAvailable = false;
					$pbStockAvailable = false;
					$pkStockData = null;
					$pbStockData = null;

					// Cek stock PK
					if (isset($palletOptions['PK']) && $palletOptions['PK']['pallet_qty'] > 0) {
						$pkUomUnit = $palletOptions['PK']['pallet_uom']->unit;
						$pkQtyNeeded = $palletOptions['PK']['pallet_qty'];

						$sql = "SELECT s.id, s.goods_id, s.location_id, s.qty, s.production_date, s.uom_id,
						               l.label as location_label, l.warehouse_id
						        FROM m_goods g
						        INNER JOIN t_stock s ON s.goods_id = g.id
						        INNER JOIN m_location l ON l.id = s.location_id
						        INNER JOIN m_uom u ON u.id = s.uom_id
						        WHERE g.kode = :kode
						          AND u.unit = :unit
						          AND s.opnam_id = :opnam_id
						          AND s.qty >= :qty_needed
						          AND l.warehouse_id = :warehouse_id
						        ORDER BY s.production_date ASC NULLS FIRST, l.label ASC
						        LIMIT 1";

						$pkStockData = Yii::app()->db->createCommand($sql)->queryRow(true, array(
							':kode' => $goodsCode,
							':unit' => $pkUomUnit,
							':opnam_id' => $lastOpname->id,
							':qty_needed' => $pkQtyNeeded,
							':warehouse_id' => $warehouse->id
						));

						if ($pkStockData) {
							$pkStockAvailable = true;
							$palletOptions['PK']['stock_data'] = $pkStockData;
						}
					}

					// Cek stock PB
					if (isset($palletOptions['PB']) && $palletOptions['PB']['pallet_qty'] > 0) {
						$pbUomUnit = $palletOptions['PB']['pallet_uom']->unit;
						$pbQtyNeeded = $palletOptions['PB']['pallet_qty'];

						$sql = "SELECT s.id, s.goods_id, s.location_id, s.qty, s.production_date, s.uom_id,
						               l.label as location_label, l.warehouse_id
						        FROM m_goods g
						        INNER JOIN t_stock s ON s.goods_id = g.id
						        INNER JOIN m_location l ON l.id = s.location_id
						        INNER JOIN m_uom u ON u.id = s.uom_id
						        WHERE g.kode = :kode
						          AND u.unit = :unit
						          AND s.opnam_id = :opnam_id
						          AND s.qty >= :qty_needed
						          AND l.warehouse_id = :warehouse_id
						        ORDER BY s.production_date ASC NULLS FIRST, l.label ASC
						        LIMIT 1";

						$pbStockData = Yii::app()->db->createCommand($sql)->queryRow(true, array(
							':kode' => $goodsCode,
							':unit' => $pbUomUnit,
							':opnam_id' => $lastOpname->id,
							':qty_needed' => $pbQtyNeeded,
							':warehouse_id' => $warehouse->id
						));

						if ($pbStockData) {
							$pbStockAvailable = true;
							$palletOptions['PB']['stock_data'] = $pbStockData;
						}
					}

					// ========================================
					// STEP 3: PILIH OPSI TERBAIK
					// ========================================
					$selectedOption = null;

					// PRIORITAS UTAMA: SELALU PK jika ada stock
					// PB hanya digunakan jika PK tidak ada stock sama sekali
					if ($pkStockAvailable) {
						$selectedOption = $palletOptions['PK'];
					} else if ($pbStockAvailable) {
						$selectedOption = $palletOptions['PB'];
					} else {
						// TIDAK ada stock: SELALU gunakan PK sebagai default
						if (isset($palletOptions['PK'])) {
							$selectedOption = $palletOptions['PK'];
						} else if (isset($palletOptions['PB'])) {
							$selectedOption = $palletOptions['PB'];
						}
					}

					// ========================================
					// STEP 4: SAVE LOCATION DETAILS
					// ========================================
					if ($selectedOption) {
						// Save pallet
						if ($selectedOption['pallet_qty'] > 0) {
							if (isset($selectedOption['stock_data'])) {
								// Ada stock - save dengan location_id
								$locationDetails[] = array(
									'goods_id' => $selectedOption['stock_data']['goods_id'],
									'location_id' => $selectedOption['stock_data']['location_id'],
									'qty' => $selectedOption['pallet_qty'],
									'uom_id' => $selectedOption['pallet_uom']->id,
									'production_date' => $selectedOption['stock_data']['production_date']
								);

								$totalStock += $selectedOption['pallet_qty'] * $selectedOption['pallet_uom']->conversion * $weight;

								if ($selectedOption['stock_data']['production_date']) {
									if (!$earliestProductionDate || $selectedOption['stock_data']['production_date'] < $earliestProductionDate) {
										$earliestProductionDate = $selectedOption['stock_data']['production_date'];
									}
								}
							} else {
								// Tidak ada stock - save tanpa location_id, ambil goods_id pertama
								$firstGoods = MGoods::model()->findByAttributes(array('kode' => $goodsCode));
								$locationDetails[] = array(
									'goods_id' => $firstGoods ? $firstGoods->id : null,
									'location_id' => null,
									'qty' => $selectedOption['pallet_qty'],
									'uom_id' => $selectedOption['pallet_uom']->id,
									'production_date' => null
								);
								$canFulfillAll = false;
							}
						}

						// Save remainder (SACK/BOX)
						if ($selectedOption['remainder'] > 0 && $selectedOption['smallest_uom']) {
							$smallestUomUnit = $selectedOption['smallest_uom']->unit;
							$remainderQtyNeeded = $selectedOption['remainder'];

							$sql = "SELECT s.id, s.goods_id, s.location_id, s.qty, s.production_date, s.uom_id,
							               l.label as location_label, l.warehouse_id
							        FROM m_goods g
							        INNER JOIN t_stock s ON s.goods_id = g.id
							        INNER JOIN m_location l ON l.id = s.location_id
							        INNER JOIN m_uom u ON u.id = s.uom_id
							        WHERE g.kode = :kode
							          AND u.unit = :unit
							          AND s.opnam_id = :opnam_id
							          AND s.qty >= :qty_needed
							          AND l.warehouse_id = :warehouse_id
							        ORDER BY s.production_date ASC NULLS FIRST, l.label ASC
							        LIMIT 1";

							$smallestStockData = Yii::app()->db->createCommand($sql)->queryRow(true, array(
								':kode' => $goodsCode,
								':unit' => $smallestUomUnit,
								':opnam_id' => $lastOpname->id,
								':qty_needed' => $remainderQtyNeeded,
								':warehouse_id' => $warehouse->id
							));

							if ($smallestStockData) {
								// Ada stock - save dengan location_id
								$locationDetails[] = array(
									'goods_id' => $smallestStockData['goods_id'],
									'location_id' => $smallestStockData['location_id'],
									'qty' => $selectedOption['remainder'],
									'uom_id' => $selectedOption['smallest_uom']->id,
									'production_date' => $smallestStockData['production_date']
								);

								$totalStock += $selectedOption['remainder'] * $weight;

								if ($smallestStockData['production_date']) {
									if (!$earliestProductionDate || $smallestStockData['production_date'] < $earliestProductionDate) {
										$earliestProductionDate = $smallestStockData['production_date'];
									}
								}
							} else {
								// Tidak ada stock - save tanpa location_id
								$firstGoods = MGoods::model()->findByAttributes(array('kode' => $goodsCode));
								$locationDetails[] = array(
									'goods_id' => $firstGoods ? $firstGoods->id : null,
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
			// 6. ASSIGN GATE WITH PRIORITY LOGIC
			// ========================================
			// Get all gates from selected warehouse
			$gateQuery = "SELECT
			                g.id,
			                g.code,
			                g.status,
			                g.warehouse_id,
			                w.name as warehouse_name
			              FROM m_gate g
			              INNER JOIN m_warehouse w ON g.warehouse_id = w.id
			              WHERE g.status = 'OPEN' AND g.warehouse_id = :warehouse_id
			              ORDER BY g.code ASC";

			$gates = Yii::app()->db->createCommand($gateQuery)->queryAll(true, array(
				':warehouse_id' => $warehouseRecommendation['warehouse_id']
			));

			$recommendedGateId = null;

			if (!empty($gates)) {
				$gateAnalysis = array();

				foreach ($gates as $gate) {
					// Get antrean count and status breakdown for this gate
					// Status ada di t_antrean, bukan di t_antrean_gate
					$antreanQuery = "SELECT
					                    COUNT(*) as total_antrean,
					                    SUM(CASE WHEN ta.status = 'OPEN' THEN 1 ELSE 0 END) as open_count,
					                    SUM(CASE WHEN ta.status = 'LOADING' THEN 1 ELSE 0 END) as loading_count,
					                    SUM(CASE WHEN ta.status = 'VERIFYING' THEN 1 ELSE 0 END) as verifying_count
					                 FROM t_antrean_gate tag
					                 INNER JOIN t_antrean ta ON tag.antrean_id = ta.id
					                 WHERE tag.gate_id = :gate_id
					                   AND ta.status IN ('OPEN', 'LOADING', 'VERIFYING')";

					$antreanStats = Yii::app()->db->createCommand($antreanQuery)->queryRow(true, array(
						':gate_id' => $gate['id']
					));

					$totalAntrean = intval($antreanStats['total_antrean']);
					$openCount = intval($antreanStats['open_count']);
					$loadingCount = intval($antreanStats['loading_count']);
					$verifyingCount = intval($antreanStats['verifying_count']);

					// Calculate priority score
					// Lower score = higher priority
					// Priority 1: Empty gates (total_antrean = 0) get score 0
					// Priority 2: Gates with queue - score based on total and status composition
					//   - VERIFYING status weighted lowest (will finish soon)
					//   - LOADING status weighted medium
					//   - OPEN status weighted highest (will take longest)
					$priorityScore = 0;

					if ($totalAntrean == 0) {
						// Empty gate - highest priority
						$priorityScore = 0;
					} else {
						// Gate with queue - calculate weighted score
						// OPEN = 3 points, LOADING = 2 points, VERIFYING = 1 point
						$weightedScore = ($openCount * 3) + ($loadingCount * 2) + ($verifyingCount * 1);
						// Add total count as base score (multiplied by 10 to maintain hierarchy)
						$priorityScore = ($totalAntrean * 10) + $weightedScore;
					}

					$gateAnalysis[] = array(
						'gate_id' => $gate['id'],
						'gate_code' => $gate['code'],
						'total_antrean' => $totalAntrean,
						'open_count' => $openCount,
						'loading_count' => $loadingCount,
						'verifying_count' => $verifyingCount,
						'priority_score' => $priorityScore
					);
				}

				// Sort by priority_score ascending (lower score = higher priority)
				usort($gateAnalysis, function($a, $b) {
					return $a['priority_score'] - $b['priority_score'];
				});

				// Select the gate with highest priority (lowest score)
				$recommendedGateId = $gateAnalysis[0]['gate_id'];

				// Save to t_antrean_gate
				$antreanGate = new TAntreanGate();
				$antreanGate->antrean_id = $antrean->id;
				$antreanGate->gate_id = $recommendedGateId;
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
