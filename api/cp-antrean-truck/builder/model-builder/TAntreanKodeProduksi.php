<?php

class TAntreanKodeProduksi extends ActiveRecord
{

	public function tableName()
	{
		return 't_antrean_kode_produksi';
	}

	public function rules()
	{
		return array(
			array('antrean_id, goods_id, kode_produksi', 'required'),
			array('antrean_id, goods_id', 'numerical', 'integerOnly'=>true),
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
			'antrean_id' => 'Antrean',
			'goods_id' => 'Goods',
			'kode_produksi' => 'Kode Produksi',
		);
	}

	/**
	 * Get Kode Produksi list for specific antrean and goods
	 * @param array $params
	 * @return array
	 */
	public static function getKodeProduksi($params = [])
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
		
		// Get kode produksi list
		$query = "SELECT id, kode_produksi FROM t_antrean_kode_produksi 
			WHERE antrean_id = :antrean_id AND goods_id = :goods_id
			ORDER BY id ASC";
		
		$command = Yii::app()->db->createCommand($query);
		$command->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
		$command->bindValue(':goods_id', $goods_id, PDO::PARAM_INT);
		$rows = $command->queryAll();
		
		$kodeProduksi = array();
		foreach ($rows as $row) {
			$kodeProduksi[] = array(
				'id' => (int)$row['id'],
				'kode_produksi' => $row['kode_produksi']
			);
		}
		
		// Count total kode produksi entries for this antrean-goods combination
		$countQuery = "SELECT COUNT(*) as total FROM t_antrean_kode_produksi 
			WHERE antrean_id = :antrean_id AND goods_id = :goods_id";
		
		$countCommand = Yii::app()->db->createCommand($countQuery);
		$countCommand->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
		$countCommand->bindValue(':goods_id', $goods_id, PDO::PARAM_INT);
		$countResult = $countCommand->queryRow();
		
		return array(
			'kode_produksi' => $kodeProduksi,
			'completed_entries' => (int)$countResult['total']
		);
	}

	/**
	 * Create Kode Produksi
	 * @param array $params
	 * @return array
	 */
	public static function createKodeProduksi($params = [])
	{
		$user_token = isset($params['user_token']) ? $params['user_token'] : null;
		$antrean_id = isset($params['antrean_id']) ? $params['antrean_id'] : null;
		$goods_id = isset($params['goods_id']) ? $params['goods_id'] : null;
		$kode_produksi = isset($params['kode_produksi']) ? $params['kode_produksi'] : null;
		
		// Validate user_token exists (for authentication)
		$userQuery = "SELECT id FROM p_user WHERE user_token = :user_token LIMIT 1";
		$userCommand = Yii::app()->db->createCommand($userQuery);
		$userCommand->bindValue(':user_token', $user_token, PDO::PARAM_STR);
		$user = $userCommand->queryRow();
		
		if (!$user) {
			return ['error' => 'Invalid user token'];
		}
		
		if (!$antrean_id || !$goods_id || !$kode_produksi) {
			return ['error' => 'antrean_id, goods_id and kode_produksi are required'];
		}

		// Create new (duplicates allowed)
		$model = new TAntreanKodeProduksi();
		$model->antrean_id = $antrean_id;
		$model->goods_id = $goods_id;
		$model->kode_produksi = $kode_produksi;
		
		if ($model->save()) {
			return array(
				'success' => true,
				'kode_produksi_id' => $model->id
			);
		} else {
			return array(
				'error' => 'Failed to save kode produksi',
				'details' => $model->getErrors()
			);
		}
	}

	/**
	 * Delete Kode Produksi
	 * @param array $params
	 * @return array
	 */
	public static function deleteKodeProduksi($params = [])
	{
		$user_token = isset($params['user_token']) ? $params['user_token'] : null;
		$kode_produksi_id = isset($params['kode_produksi_id']) ? $params['kode_produksi_id'] : null;
		
		// Validate user_token exists (for authentication)
		$userQuery = "SELECT id FROM p_user WHERE user_token = :user_token LIMIT 1";
		$userCommand = Yii::app()->db->createCommand($userQuery);
		$userCommand->bindValue(':user_token', $user_token, PDO::PARAM_STR);
		$user = $userCommand->queryRow();
		
		if (!$user) {
			return ['error' => 'Invalid user token'];
		}
		
		if (!$kode_produksi_id) {
			return ['error' => 'kode_produksi_id is required'];
		}
		
		$model = TAntreanKodeProduksi::model()->findByPk($kode_produksi_id);
		
		if (!$model) {
			return ['error' => 'Kode produksi not found'];
		}
		
		if ($model->delete()) {
			return array(
				'success' => true
			);
		} else {
			return array(
				'error' => 'Failed to delete kode produksi'
			);
		}
	}

}
