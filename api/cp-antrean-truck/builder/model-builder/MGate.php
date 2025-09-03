<?php

class MGate extends ActiveRecord
{

	public function tableName()
	{
		return 'm_gate';
	}

	public function rules()
	{
		return array(
			array('code, warehouse_id', 'required'),
			array('warehouse_id', 'numerical', 'integerOnly'=>true),
			array('code, status', 'length', 'max'=>256),
		);
	}

	public function relations()
	{
		return array(
			'warehouse' => array(self::BELONGS_TO, 'MWarehouse', 'warehouse_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'code' => 'Code',
			'warehouse_id' => 'Warehouse',
			'status' => 'Status',
		);
	}

	/**
	 * Get list of gates
	 * @param array $params
	 * @return array
	 */
	public static function getGateOptions($params = [])
	{
		$user_token = isset($params['user_token']) ? $params['user_token'] : null;
		
		// Validate user_token exists (for authentication)
		$userQuery = "SELECT id FROM p_user WHERE user_token = :user_token LIMIT 1";
		$userCommand = Yii::app()->db->createCommand($userQuery);
		$userCommand->bindValue(':user_token', $user_token, PDO::PARAM_STR);
		$user = $userCommand->queryRow();
		
		if (!$user) {
			return ['error' => 'Invalid user token'];
		}
		
		// Get all active gates
		$query = "SELECT 
			id,
			code
		FROM m_gate
		WHERE status = 'OPEN'
		ORDER BY code ASC";
		
		$command = Yii::app()->db->createCommand($query);
		$rows = $command->queryAll();
		
		$gates = array();
		foreach ($rows as $row) {
			$gates[] = array(
				'id' => (int)$row['id'],
				'code' => $row['code']
			);
		}
		
		return array(
			'gates' => $gates
		);
	}

}
