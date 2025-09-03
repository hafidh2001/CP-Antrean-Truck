<?php

class TAntreanGate extends ActiveRecord
{

	public function tableName()
	{
		return 't_antrean_gate';
	}

	public function rules()
	{
		return array(
			array('antrean_id, gate_id', 'required'),
			array('antrean_id, gate_id', 'numerical', 'integerOnly'=>true),
		);
	}

	public function relations()
	{
		return array(
			'gate' => array(self::BELONGS_TO, 'MGate', 'gate_id'),
			'antrean' => array(self::BELONGS_TO, 'TAntrean', 'antrean_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'antrean_id' => 'Antrean',
			'gate_id' => 'Gate',
		);
	}

	/**
	 * Get Gates for specific antrean
	 * @param array $params
	 * @return array
	 */
	public static function getAntreanGate($params = [])
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
		
		// Get gates for this antrean ordered by id (gate 1 = first, gate 2 = second)
		$query = "SELECT 
			tag.id,
			tag.gate_id,
			mg.code as gate_code
		FROM t_antrean_gate tag
		INNER JOIN m_gate mg ON tag.gate_id = mg.id
		WHERE tag.antrean_id = :antrean_id
		ORDER BY tag.id ASC";
		
		$command = Yii::app()->db->createCommand($query);
		$command->bindValue(':antrean_id', $antrean_id, PDO::PARAM_INT);
		$rows = $command->queryAll();
		
		$gates = array();
		foreach ($rows as $row) {
			$gates[] = array(
				'id' => (int)$row['id'],
				'gate_id' => (int)$row['gate_id'],
				'gate_code' => $row['gate_code']
			);
		}
		
		return array(
			'gates' => $gates
		);
	}

	/**
	 * Set Gate for antrean (add or update)
	 * @param array $params
	 * @return array
	 */
	public static function setAntreanGate($params = [])
	{
		$user_token = isset($params['user_token']) ? $params['user_token'] : null;
		$antrean_id = isset($params['antrean_id']) ? $params['antrean_id'] : null;
		$gate_id = isset($params['gate_id']) ? $params['gate_id'] : null;
		$position = isset($params['position']) ? $params['position'] : null; // 1 or 2
		
		// Validate user_token exists (for authentication)
		$userQuery = "SELECT id FROM p_user WHERE user_token = :user_token LIMIT 1";
		$userCommand = Yii::app()->db->createCommand($userQuery);
		$userCommand->bindValue(':user_token', $user_token, PDO::PARAM_STR);
		$user = $userCommand->queryRow();
		
		if (!$user) {
			return ['error' => 'Invalid user token'];
		}
		
		if (!$antrean_id || !$gate_id || !$position) {
			return ['error' => 'antrean_id, gate_id and position are required'];
		}
		
		if ($position != 1 && $position != 2) {
			return ['error' => 'position must be 1 or 2'];
		}
		
		// Get current gates
		$currentGates = self::getAntreanGate(['user_token' => $user_token, 'antrean_id' => $antrean_id]);
		if (isset($currentGates['error'])) {
			return $currentGates;
		}
		
		$gates = $currentGates['gates'];
		
		// Handle based on position
		if ($position == 1) {
			// Setting gate 1
			if (count($gates) >= 1) {
				// Update existing gate 1
				$model = TAntreanGate::model()->findByPk($gates[0]['id']);
			} else {
				// Create new gate 1
				$model = new TAntreanGate();
				$model->antrean_id = $antrean_id;
			}
		} else {
			// Setting gate 2
			if (count($gates) >= 2) {
				// Update existing gate 2
				$model = TAntreanGate::model()->findByPk($gates[1]['id']);
			} else {
				// Create new gate 2
				$model = new TAntreanGate();
				$model->antrean_id = $antrean_id;
			}
		}
		
		if (!$model) {
			return ['error' => 'Failed to find or create gate model'];
		}
		
		$model->gate_id = $gate_id;
		
		if ($model->save()) {
			return array(
				'success' => true,
				'gate_id' => $model->id
			);
		} else {
			return array(
				'error' => 'Failed to save gate',
				'details' => $model->getErrors()
			);
		}
	}

	/**
	 * Delete Gate 2 for antrean (only gate 2 can be deleted from frontend)
	 * @param array $params
	 * @return array
	 */
	public static function deleteAntreanGate($params = [])
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
		
		// Get current gates
		$currentGates = self::getAntreanGate(['user_token' => $user_token, 'antrean_id' => $antrean_id]);
		if (isset($currentGates['error'])) {
			return $currentGates;
		}
		
		$gates = $currentGates['gates'];
		
		// Only delete gate 2 if it exists (second gate in the array)
		if (count($gates) >= 2) {
			$deleteId = $gates[1]['id'];
			$model = TAntreanGate::model()->findByPk($deleteId);
			if ($model) {
				$model->delete();
			}
		}
		
		return array('success' => true);
	}

}
