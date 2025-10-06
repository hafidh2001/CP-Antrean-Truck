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
	 * Get gate antrean list with countdown time
	 * For MC and Admin roles to monitor all gates
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
			
			// Get antrean for this gate with status LOADING
			$antreanQuery = "SELECT 
								ta.id,
								ta.nopol,
								ta.assigned_kerani_time,
								ta.status
							FROM t_antrean ta
							INNER JOIN t_antrean_gate tag ON ta.id = tag.antrean_id
							WHERE tag.gate_id = :gate_id 
								AND ta.status IN ('LOADING', 'VERIFYING')
							ORDER BY ta.assigned_kerani_time ASC";
			
			$antreanCommand = Yii::app()->db->createCommand($antreanQuery);
			$antreanCommand->bindValue(':gate_id', $gate['id'], PDO::PARAM_INT);
			$antreanList = $antreanCommand->queryAll();
			
			$cumulativeMinutes = 0; // Track cumulative loading time
			
			foreach ($antreanList as $antrean) {
				// Skip if no assigned_kerani_time (not yet assigned to kerani)
				if (!$antrean['assigned_kerani_time']) {
					continue;
				}
				
				// Get goods and calculate total loading time for this truck
				$goodsQuery = "SELECT 
								tarl.goods_id,
								tarl.qty,
								tarl.uom_id,
								mg.kode as goods_code,
								mg.loading_time,
								mu.unit as uom_unit,
								mu.conversion,
								mu_base.unit as base_unit
							FROM t_antrean_rekomendasi_lokasi tarl
							INNER JOIN m_goods mg ON tarl.goods_id = mg.id
							LEFT JOIN m_uom mu ON tarl.uom_id = mu.id
							LEFT JOIN m_uom mu_base ON mu.convert_to = mu_base.id
							WHERE tarl.antrean_id = :antrean_id";
				
				$goodsCommand = Yii::app()->db->createCommand($goodsQuery);
				$goodsCommand->bindValue(':antrean_id', $antrean['id'], PDO::PARAM_INT);
				$goodsList = $goodsCommand->queryAll();
				
				$truckLoadingMinutes = 0;
				
				foreach ($goodsList as $goods) {
					// Calculate quantity in tons
					// If has conversion (e.g., from kg to ton), apply it
					// Assume: conversion field contains multiplier to base unit
					// Example: 1 ton = 1000 kg, so conversion = 1000
					$qtyInTons = $goods['qty'];
					
					// If unit has conversion (means it's not the base unit)
					if ($goods['conversion'] && $goods['conversion'] > 0) {
						// If base unit is kg and current is ton: qty * 1 (already in tons)
						// If base unit is ton and current is kg: qty / 1000
						if (strtolower($goods['uom_unit']) == 'kg') {
							$qtyInTons = $goods['qty'] / 1000; // Convert kg to tons
						} else if (strtolower($goods['uom_unit']) == 'ton') {
							$qtyInTons = $goods['qty']; // Already in tons
						} else {
							// For other units, use conversion factor
							$qtyInTons = $goods['qty'] * $goods['conversion'] / 1000;
						}
					}
					
					// Calculate loading time: qty_in_tons * loading_time_per_ton
					$loadingMinutes = $qtyInTons * ($goods['loading_time'] ?: 10); // Default 10 minutes per ton
					$truckLoadingMinutes += $loadingMinutes;
				}
				
				// Calculate remaining time
				$assignedTime = strtotime($antrean['assigned_kerani_time']);
				$currentTime = time();
				$elapsedMinutes = ($currentTime - $assignedTime) / 60;
				
				// For first truck in queue, calculate from its own loading time
				// For subsequent trucks, add cumulative time from trucks ahead
				$totalLoadingMinutes = $truckLoadingMinutes + $cumulativeMinutes;
				$remainingMinutes = max(0, $totalLoadingMinutes - $elapsedMinutes);
				
				// Add this truck's loading time to cumulative for next truck
				$cumulativeMinutes += $truckLoadingMinutes;
				
				// Format time for display
				$hours = floor($remainingMinutes / 60);
				$minutes = floor($remainingMinutes % 60);
				$seconds = floor(($remainingMinutes * 60) % 60);
				
				$antreanData = array(
					'antrean_id' => (int)$antrean['id'],
					'nopol' => $antrean['nopol'],
					'status' => $antrean['status'],
					'assigned_kerani_time' => $antrean['assigned_kerani_time'],
					'loading_time_minutes' => round($truckLoadingMinutes, 2),
					'remaining_minutes' => round($remainingMinutes, 2),
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
				
				// Always include trucks with LOADING/VERIFYING status
				// The frontend will handle display based on remaining time
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
