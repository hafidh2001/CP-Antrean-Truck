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
	 * Get gate antrean list with count up time
	 * For MC and Admin roles to monitor all gates
	 * Shows trucks with status: OPEN, LOADING, VERIFYING (ordered by priority)
	 * Count up starts from assigned_kerani_time (when status becomes LOADING)
	 * @param array $params
	 * @return array
	 */
	public static function getGateAntreanList($params = [])
	{
		$user_token = isset($params['user_token']) ? $params['user_token'] : null;
		
		// Validate user_token
		if (!$user_token) {
			return ['error' => 'user_token is required'];
		}
		
		// Validate user and check role (must be MC or Admin)
		$userQuery = "SELECT 
						u.id,
						u.username,
						r.role_name
					  FROM p_user u
					  INNER JOIN p_user_role ur ON u.id = ur.user_id
					  INNER JOIN p_role r ON ur.role_id = r.id
					  WHERE u.user_token = :user_token 
					  AND r.role_name IN ('mc', 'admin', 'MC', 'Admin', 'ADMIN')
					  LIMIT 1";
		
		$userCommand = Yii::app()->db->createCommand($userQuery);
		$userCommand->bindValue(':user_token', $user_token, PDO::PARAM_STR);
		$user = $userCommand->queryRow();
		
		if (!$user) {
			return ['error' => 'Unauthorized. Only MC and Admin can access this data.'];
		}
		
		// Get all gates from all warehouses
		$gateQuery = "SELECT 
						g.id, 
						g.code, 
						g.status,
						g.warehouse_id,
						w.name as warehouse_name
					  FROM m_gate g
					  INNER JOIN m_warehouse w ON g.warehouse_id = w.id
					  WHERE g.status = 'OPEN'
					  ORDER BY g.warehouse_id ASC, g.code ASC";
		
		$gateCommand = Yii::app()->db->createCommand($gateQuery);
		$gates = $gateCommand->queryAll();
		
		$result = array();
		
		foreach ($gates as $gate) {
			$gateData = array(
				'gate_id' => (int)$gate['id'],
				'gate_code' => $gate['code'],
				'warehouse_name' => $gate['warehouse_name'],
				'antrean_list' => array()
			);
			
			// Get antrean for this gate with status OPEN, LOADING, VERIFYING
			// Ordered by FIFO (t_antrean.id) as the system follows First In First Out
			$antreanQuery = "SELECT
								ta.id,
								ta.nopol,
								ta.assigned_kerani_time,
								ta.status
							FROM t_antrean ta
							INNER JOIN t_antrean_gate tag ON ta.id = tag.antrean_id
							WHERE tag.gate_id = :gate_id
								AND ta.status IN ('OPEN', 'LOADING', 'VERIFYING')
							ORDER BY
								CASE ta.status
									WHEN 'VERIFYING' THEN 1
									WHEN 'LOADING' THEN 2
									WHEN 'OPEN' THEN 3
									ELSE 4
								END ASC,
								ta.id ASC";
			
			$antreanCommand = Yii::app()->db->createCommand($antreanQuery);
			$antreanCommand->bindValue(':gate_id', $gate['id'], PDO::PARAM_INT);
			$antreanList = $antreanCommand->queryAll();

			foreach ($antreanList as $antrean) {
				// Calculate elapsed time (count up) from assigned_kerani_time
				$elapsedMinutes = 0;
				$hours = 0;
				$minutes = 0;
				$seconds = 0;

				// If assigned_kerani_time exists, calculate elapsed time
				if ($antrean['assigned_kerani_time']) {
					$assignedTime = strtotime($antrean['assigned_kerani_time']);
					$currentTime = time();
					$elapsedMinutes = ($currentTime - $assignedTime) / 60;

					// Format time for display (count up)
					$hours = floor($elapsedMinutes / 60);
					$minutes = floor($elapsedMinutes % 60);
					$seconds = floor(($elapsedMinutes * 60) % 60);
				}
				// Else: status OPEN, display 0:00:00 (default values already set)
				
				$antreanData = array(
					'antrean_id' => (int)$antrean['id'],
					'nopol' => $antrean['nopol'],
					'status' => $antrean['status'],
					'assigned_kerani_time' => $antrean['assigned_kerani_time'],
				'assigned_kerani_timestamp' => $antrean['assigned_kerani_time'] ? strtotime($antrean['assigned_kerani_time']) : null,
					'elapsed_minutes' => round($elapsedMinutes, 2),
					'remaining_time_formatted' => array(
						'hours' => $hours,
						'minutes' => $minutes,
						'seconds' => $seconds,
						'display' => $hours > 0
							? sprintf('%d JAM %d MENIT %d DETIK', $hours, $minutes, $seconds)
							: ($minutes > 0
								? sprintf('%d MENIT %d DETIK', $minutes, $seconds)
								: sprintf('%d DETIK', $seconds))
					)
				);
				
				// Include trucks with OPEN, LOADING, VERIFYING status
				// Count up time starts from assigned_kerani_time (LOADING status)
				$gateData['antrean_list'][] = $antreanData;
			}
			
			$result[] = $gateData;
		}
		
		return array(
			'gates' => $result,
			'server_time' => date('Y-m-d H:i:s'),
			'timestamp' => time()
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
