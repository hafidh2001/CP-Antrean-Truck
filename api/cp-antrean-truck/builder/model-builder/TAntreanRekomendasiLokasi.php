<?php

class TAntreanRekomendasiLokasi extends ActiveRecord
{

	public function tableName()
	{
		return 't_antrean_rekomendasi_lokasi';
	}

	public function rules()
	{
		return array(
			array('antrean_id, goods_id, location_id, qty, uom_id', 'required'),
			array('antrean_id, goods_id, location_id, qty, uom_id, location_override_id, qty_override', 'numerical', 'integerOnly'=>true),
		);
	}

	public function relations()
	{
		return array(
			'antrean' => array(self::BELONGS_TO, 'TAntrean', 'antrean_id'),
			'goods' => array(self::BELONGS_TO, 'MGoods', 'goods_id'),
			'location' => array(self::BELONGS_TO, 'MLocation', 'location_id'),
			'uom' => array(self::BELONGS_TO, 'MUom', 'uom_id'),
			'locationOverride' => array(self::BELONGS_TO, 'MLocation', 'location_override_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'antrean_id' => 'Antrean',
			'goods_id' => 'Goods',
			'location_id' => 'Location',
			'qty' => 'Qty',
			'uom_id' => 'Uom',
			'location_override_id' => 'Location Override',
			'qty_override' => 'Qty Override',
		);
	}

	/**
	 * Get Antrean Kode Produksi for Production Code Page
	 * @param array $params
	 * @return array
	 */
	public static function getAntreanKodeProduksi($params = [])
	{
		$user_token = isset($params['user_token']) ? $params['user_token'] : null;
		$antrean_id = isset($params['antrean_id']) ? $params['antrean_id'] : null;
		
		// Validate user_token exists (for authentication)
		$userQuery = "SELECT id FROM p_user WHERE user_token = :user_token LIMIT 1";
		$userCommand = Yii::app()->db->createCommand($userQuery);
		$userCommand->bindValue(':user_token', $user_token, PDO::PARAM_STR);
		$user = $userCommand->queryRow();
		
		if (!$user) {
			return ['error' => 'Invalid user token'];
		}
		
		if (!$antrean_id) {
			return ['error' => 'antrean_id is required'];
		}
		
		// Get antrean info (nopol)
		$antreanQuery = "SELECT id, nopol FROM t_antrean WHERE id = :antrean_id LIMIT 1";
		$antreanCommand = Yii::app()->db->createCommand($antreanQuery);
		$antreanCommand->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
		$antrean = $antreanCommand->queryRow();
		
		if (!$antrean) {
			return ['error' => 'Antrean not found'];
		}
		
		// Get kode produksi data with goods info
		// Total entries calculated based on UOM: if convert_to is NULL (smallest unit) = 1, else = qty
		$query = "SELECT 
			tarl.goods_id as id,
			tarl.antrean_id,
			tarl.goods_id,
			mg.kode as goods_code
		FROM t_antrean_rekomendasi_lokasi tarl
		INNER JOIN m_goods mg ON tarl.goods_id = mg.id
		WHERE tarl.antrean_id = :antrean_id
		GROUP BY tarl.goods_id, tarl.antrean_id, mg.kode
		ORDER BY tarl.goods_id ASC";
		
		$command = Yii::app()->db->createCommand($query);
		$command->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
		$rows = $command->queryAll();
		
		// Count distinct goods_id
		$jenisBarangQuery = "SELECT COUNT(DISTINCT goods_id) as jenis_barang 
			FROM t_antrean_rekomendasi_lokasi 
			WHERE antrean_id = :antrean_id";
		$jenisCommand = Yii::app()->db->createCommand($jenisBarangQuery);
		$jenisCommand->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
		$jenisResult = $jenisCommand->queryRow();
		
		// Get quantities grouped by UOM for each goods
		$result = array(
			'nopol' => $antrean['nopol'],
			'jenis_barang' => (int)$jenisResult['jenis_barang'],
			'productionCodes' => array()
		);
		
		foreach ($rows as $row) {
			// Get quantities for this goods_id with UOM info
			$qtyQuery = "SELECT 
				tarl.qty,
				tarl.uom_id,
				mu.unit as uom_name,
				mu.convert_to
			FROM t_antrean_rekomendasi_lokasi tarl
			INNER JOIN m_uom mu ON tarl.uom_id = mu.id
			WHERE tarl.antrean_id = :antrean_id AND tarl.goods_id = :goods_id
			ORDER BY tarl.uom_id ASC";
			
			$qtyCommand = Yii::app()->db->createCommand($qtyQuery);
			$qtyCommand->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
			$qtyCommand->bindValue(':goods_id', $row['goods_id'], PDO::PARAM_INT);
			$qtyRows = $qtyCommand->queryAll();
			
			// Group quantities by UOM and calculate total_entries
			$quantities = array();
			$uomGroups = array();
			$total_entries = 0;
			
			foreach ($qtyRows as $qtyRow) {
				$uom_id = $qtyRow['uom_id'];
				if (!isset($uomGroups[$uom_id])) {
					$uomGroups[$uom_id] = array(
						'amount' => 0,
						'unit' => $qtyRow['uom_name'],
						'convert_to' => $qtyRow['convert_to']
					);
				}
				$uomGroups[$uom_id]['amount'] += (int)$qtyRow['qty'];
			}
			
			// Convert to array format and calculate total_entries
			foreach ($uomGroups as $uomData) {
				$quantities[] = array(
					'amount' => $uomData['amount'],
					'unit' => $uomData['unit']
				);
				
				// Calculate total_entries based on convert_to
				if ($uomData['convert_to'] === null) {
					// Smallest unit, count as 1
					$total_entries += 1;
				} else {
					// Larger unit, count as qty
					$total_entries += $uomData['amount'];
				}
			}
			
			// Get completed entries count from t_antrean_kode_produksi
			$completedQuery = "SELECT COUNT(*) as completed_count 
				FROM t_antrean_kode_produksi 
				WHERE antrean_id = :antrean_id AND goods_id = :goods_id";
			$completedCommand = Yii::app()->db->createCommand($completedQuery);
			$completedCommand->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
			$completedCommand->bindValue(':goods_id', $row['goods_id'], PDO::PARAM_INT);
			$completedResult = $completedCommand->queryRow();
			$completed_entries = (int)$completedResult['completed_count'];
			
			$result['productionCodes'][] = array(
				'id' => (int)$row['goods_id'],
				'goods_code' => $row['goods_code'],
				'quantities' => $quantities,
				'total_entries' => $total_entries,
				'completed_entries' => $completed_entries
			);
		}
		
		return $result;
	}

	/**
	 * Get Single Production Code Detail
	 * @param array $params
	 * @return array
	 */
	public static function getProductionCodeDetail($params = [])
	{
		$user_token = isset($params['user_token']) ? $params['user_token'] : null;
		$antrean_id = isset($params['antrean_id']) ? $params['antrean_id'] : null;
		$goods_id = isset($params['goods_id']) ? $params['goods_id'] : null;
		
		// Validate user_token exists (for authentication)
		$userQuery = "SELECT id FROM p_user WHERE user_token = :user_token LIMIT 1";
		$userCommand = Yii::app()->db->createCommand($userQuery);
		$userCommand->bindValue(':user_token', $user_token, PDO::PARAM_STR);
		$user = $userCommand->queryRow();
		
		if (!$user) {
			return ['error' => 'Invalid user token'];
		}
		
		if (!$antrean_id || !$goods_id) {
			return ['error' => 'antrean_id and goods_id are required'];
		}
		
		// Get antrean info
		$antreanQuery = "SELECT id, nopol FROM t_antrean WHERE id = :antrean_id LIMIT 1";
		$antreanCommand = Yii::app()->db->createCommand($antreanQuery);
		$antreanCommand->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
		$antrean = $antreanCommand->queryRow();
		
		if (!$antrean) {
			return ['error' => 'Antrean not found'];
		}
		
		// Get goods info
		$goodsQuery = "SELECT 
			mg.id,
			mg.alias as goods_name,
			mg.kode as goods_code
		FROM m_goods mg
		WHERE mg.id = :goods_id";
		
		$goodsCommand = Yii::app()->db->createCommand($goodsQuery);
		$goodsCommand->bindValue(':goods_id', $goods_id, PDO::PARAM_INT);
		$goodsRow = $goodsCommand->queryRow();
		
		if (!$goodsRow) {
			return ['error' => 'Goods not found'];
		}
		
		// Get quantities for this goods with UOM info
		$qtyQuery = "SELECT 
			tarl.qty,
			tarl.uom_id,
			mu.unit as uom_name,
			mu.convert_to
		FROM t_antrean_rekomendasi_lokasi tarl
		INNER JOIN m_uom mu ON tarl.uom_id = mu.id
		WHERE tarl.antrean_id = :antrean_id AND tarl.goods_id = :goods_id
		ORDER BY tarl.uom_id ASC";
		
		$qtyCommand = Yii::app()->db->createCommand($qtyQuery);
		$qtyCommand->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
		$qtyCommand->bindValue(':goods_id', $goods_id, PDO::PARAM_INT);
		$qtyRows = $qtyCommand->queryAll();
		
		// Group quantities by UOM and calculate total_entries
		$quantities = array();
		$uomGroups = array();
		$total_entries = 0;
		
		foreach ($qtyRows as $qtyRow) {
			$uom_id = $qtyRow['uom_id'];
			if (!isset($uomGroups[$uom_id])) {
				$uomGroups[$uom_id] = array(
					'amount' => 0,
					'unit' => $qtyRow['uom_name'],
					'convert_to' => $qtyRow['convert_to']
				);
			}
			$uomGroups[$uom_id]['amount'] += (int)$qtyRow['qty'];
		}
		
		// Convert to array format and calculate total_entries
		foreach ($uomGroups as $uomData) {
			$quantities[] = array(
				'amount' => $uomData['amount'],
				'unit' => $uomData['unit']
			);
			
			// Calculate total_entries based on convert_to
			if ($uomData['convert_to'] === null) {
				// Smallest unit, count as 1
				$total_entries += 1;
			} else {
				// Larger unit, count as qty
				$total_entries += $uomData['amount'];
			}
		}
		
		// Count distinct goods_id (jenis_barang)
		$jenisBarangQuery = "SELECT COUNT(DISTINCT goods_id) as jenis_barang 
			FROM t_antrean_rekomendasi_lokasi 
			WHERE antrean_id = :antrean_id";
		$jenisCommand = Yii::app()->db->createCommand($jenisBarangQuery);
		$jenisCommand->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
		$jenisResult = $jenisCommand->queryRow();
		
		return array(
			'nopol' => $antrean['nopol'],
			'jenis_barang' => (int)$jenisResult['jenis_barang'],
			'productionCode' => array(
				'id' => (int)$goods_id,
				'goods_code' => $goodsRow['goods_code'],
				'goods_name' => $goodsRow['goods_name'],
				'quantities' => $quantities,
				'total_entries' => $total_entries
			)
		);
	}

}