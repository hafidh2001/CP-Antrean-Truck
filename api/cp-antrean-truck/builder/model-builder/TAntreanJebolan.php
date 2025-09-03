<?php

class TAntreanJebolan extends ActiveRecord
{

	public function tableName()
	{
		return 't_antrean_jebolan';
	}

	public function rules()
	{
		return array(
			array('antrean_id, goods_id, qty', 'required'),
			array('antrean_id, goods_id, qty', 'numerical', 'integerOnly'=>true),
		);
	}

	public function relations()
	{
		return array(
			'antrean' => array(self::BELONGS_TO, 'TAntrean', 'antrean_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'antrean_id' => 'Antrean',
			'goods_id' => 'Goods',
			'qty' => 'Qty',
		);
	}

	/**
	 * Get Jebolan for specific antrean and goods
	 * @param array $params
	 * @return array
	 */
	public static function getJebolan($params = [])
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
		
		// Get jebolan list
		$query = "SELECT id, qty FROM t_antrean_jebolan 
			WHERE antrean_id = :antrean_id AND goods_id = :goods_id
			ORDER BY id ASC";
		
		$command = Yii::app()->db->createCommand($query);
		$command->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
		$command->bindValue(':goods_id', $goods_id, PDO::PARAM_INT);
		$rows = $command->queryAll();
		
		$jebolan = array();
		foreach ($rows as $row) {
			$jebolan[] = array(
				'id' => (int)$row['id'],
				'qty' => (int)$row['qty']
			);
		}
		
		return array(
			'jebolan' => $jebolan
		);
	}

	/**
	 * Create or Update Jebolan
	 * @param array $params
	 * @return array
	 */
	public static function saveJebolan($params = [])
	{
		$user_token = isset($params['user_token']) ? $params['user_token'] : null;
		$antrean_id = isset($params['antrean_id']) ? $params['antrean_id'] : null;
		$goods_id = isset($params['goods_id']) ? $params['goods_id'] : null;
		$qty = isset($params['qty']) ? $params['qty'] : null;
		$jebolan_id = isset($params['jebolan_id']) ? $params['jebolan_id'] : null;
		
		// Validate user_token exists (for authentication)
		$userQuery = "SELECT id FROM p_user WHERE user_token = :user_token LIMIT 1";
		$userCommand = Yii::app()->db->createCommand($userQuery);
		$userCommand->bindValue(':user_token', $user_token, PDO::PARAM_STR);
		$user = $userCommand->queryRow();
		
		if (!$user) {
			return ['error' => 'Invalid user token'];
		}
		
		if (!$antrean_id || !$goods_id || !$qty) {
			return ['error' => 'antrean_id, goods_id and qty are required'];
		}
		
		if ($jebolan_id) {
			// Update existing
			$model = TAntreanJebolan::model()->findByPk($jebolan_id);
			if (!$model) {
				return ['error' => 'Jebolan not found'];
			}
		} else {
			// Create new
			$model = new TAntreanJebolan();
			$model->antrean_id = $antrean_id;
			$model->goods_id = $goods_id;
		}
		
		$model->qty = $qty;
		
		if ($model->save()) {
			return array(
				'success' => true,
				'jebolan_id' => $model->id
			);
		} else {
			return array(
				'error' => 'Failed to save jebolan',
				'details' => $model->getErrors()
			);
		}
	}

	/**
	 * Delete Jebolan
	 * @param array $params
	 * @return array
	 */
	public static function deleteJebolan($params = [])
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
		
		// Delete all jebolan for this antrean-goods combination
		$deleteQuery = "DELETE FROM t_antrean_jebolan 
			WHERE antrean_id = :antrean_id AND goods_id = :goods_id";
		
		$deleteCommand = Yii::app()->db->createCommand($deleteQuery);
		$deleteCommand->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
		$deleteCommand->bindValue(':goods_id', $goods_id, PDO::PARAM_INT);
		
		if ($deleteCommand->execute() !== false) {
			return array(
				'success' => true
			);
		} else {
			return array(
				'error' => 'Failed to delete jebolan'
			);
		}
	}

}
