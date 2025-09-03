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
		$warehouse_id = isset($params['warehouse_id']) ? $params['warehouse_id'] : null;
		$status = isset($params['status']) ? $params['status'] : 'OPEN';
		
		if (!$warehouse_id) {
			return ['error' => 'warehouse_id is required'];
		}

		// Query untuk mengambil data antrean truck
		$query = "SELECT 
					id,
					nopol,
					created_time,
					warehouse_id,
					kerani_id,
					status,
					warehouse_override_id
				FROM t_antrean
				WHERE warehouse_id = :warehouse_id
				AND status = :status
				ORDER BY created_time ASC";
		
		$antreanList = Yii::app()->db->createCommand($query)
			->bindParam(':warehouse_id', $warehouse_id, PDO::PARAM_INT)
			->bindParam(':status', $status, PDO::PARAM_STR)
			->queryAll();

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
				'warehouse_override_id' => $antrean['warehouse_override_id'] ? (int)$antrean['warehouse_override_id'] : null
			];
		}

		return $result;
	}

}
