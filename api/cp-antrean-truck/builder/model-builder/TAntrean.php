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

	public static function getAntreanTruck($params = [])
	{
		// Extract parameters from params
		$user_token = isset($params['user_token']) ? $params['user_token'] : null;
		$status = isset($params['status']) ? $params['status'] : array(); // Always treat as array
		
		if (!$user_token) {
			return ['error' => 'user_token is required'];
		}
		
		// Convert single status to array for consistent handling
		if (!empty($status) && !is_array($status)) {
			$status = array($status);
		}

		// Validate user_token exists (for authentication)
		$userQuery = "SELECT id FROM p_user WHERE user_token = :user_token LIMIT 1";
		$user = Yii::app()->db->createCommand($userQuery)
			->bindParam(':user_token', $user_token, PDO::PARAM_STR)
			->queryRow();

		if (!$user) {
			return ['error' => 'Invalid user_token'];
		}

		// Query untuk mengambil semua data antrean truck (tidak filter berdasarkan kerani)
		$query = "SELECT 
					ta.id,
					ta.nopol,
					ta.created_time,
					ta.warehouse_id,
					ta.kerani_id,
					ta.status,
					ta.warehouse_override_id,
					COUNT(DISTINCT tarl.goods_id) as jenis_barang
				FROM t_antrean ta
				LEFT JOIN t_antrean_rekomendasi_lokasi tarl ON ta.id = tarl.antrean_id";
		
		// Add status filter only if status array is not empty
		$whereClause = array();
		$bindParams = array();
		
		if (!empty($status)) {
			// Always use IN clause for consistency
			$statusPlaceholders = array();
			foreach ($status as $idx => $s) {
				$placeholder = ":status_" . $idx;
				$statusPlaceholders[] = $placeholder;
				$bindParams[$placeholder] = $s;
			}
			$whereClause[] = "ta.status IN (" . implode(',', $statusPlaceholders) . ")";
		}
		
		if (!empty($whereClause)) {
			$query .= " WHERE " . implode(' AND ', $whereClause);
		}
		
		$query .= " GROUP BY ta.id, ta.nopol, ta.created_time, ta.warehouse_id, ta.kerani_id, ta.status, ta.warehouse_override_id";
		$query .= " ORDER BY ta.created_time ASC";
		
		$command = Yii::app()->db->createCommand($query);
		
		// Bind all parameters
		foreach ($bindParams as $key => $value) {
			$command->bindValue($key, $value, PDO::PARAM_STR);
		}
		
		$antreanList = $command->queryAll();

		// Transform data ke format frontend
		$result = [];
		foreach ($antreanList as $antrean) {
			$result[] = [
				'id' => (int)$antrean['id'],
				'nopol' => $antrean['nopol'],
				'created_time' => $antrean['created_time'],
				'warehouse_id' => (int)$antrean['warehouse_id'],
				'kerani_id' => $antrean['kerani_id'] ? (int)$antrean['kerani_id'] : null,
				'status' => $antrean['status'],
				'warehouse_override_id' => $antrean['warehouse_override_id'] ? (int)$antrean['warehouse_override_id'] : null,
				'jenis_barang' => (int)$antrean['jenis_barang']
			];
		}

		return $result;
	}

}
