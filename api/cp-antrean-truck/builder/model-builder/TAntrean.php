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
			array('status, qr_code', 'length', 'max'=>256),
			array('assigned_kerani_time, verifying_time, verified_time, closed_time, pending_note', 'safe'),
		);
	}

	public function relations()
	{
		return array(
			'tAntreanGates' => array(self::HAS_MANY, 'TAntreanGate', 'antrean_id'),
			'tAntreanKodeProduksis' => array(self::HAS_MANY, 'TAntreanKodeProduksi', 'antrean_id'),
			'tAntreanRekomendasiLokasis' => array(self::HAS_MANY, 'TAntreanRekomendasiLokasi', 'antrean_id'),
			'tAntreanJebolans' => array(self::HAS_MANY, 'TAntreanJebolan', 'antrean_id'),
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
			'pending_note' => 'Pending Note',
			'qr_code' => 'Qr Code',
		);
	}
	
		
	public static function PrintSlip($id){
	    // Query get data t_antrean_rekomendasi_lokasi for print
	    $query = "
            SELECT 
                tar.id,
                tar.antrean_id,
                g.kode AS code,
                COALESCE(l2.label, l1.label) AS lokasi,
                COALESCE(tar.qty_override, tar.qty) AS jml,
                TO_CHAR(tar.tgl_produksi, 'DD/MM') AS tgl,
                ta.kerani_id,
                pu.username AS kerani_username
            FROM t_antrean_rekomendasi_lokasi tar
            INNER JOIN m_goods g ON tar.goods_id = g.id
            LEFT JOIN m_location l1 ON tar.location_id = l1.id
            LEFT JOIN m_location l2 ON tar.location_override_id = l2.id
            INNER JOIN t_antrean ta ON ta.id = tar.antrean_id
            LEFT JOIN p_user pu ON ta.kerani_id = pu.id
            WHERE tar.antrean_id = :antrean_id
            ORDER BY tar.id ASC
        ";
        
        $command = Yii::app()->db->createCommand($query);
        $command->bindValue(':antrean_id', $id, PDO::PARAM_INT);
        $rows = $command->queryAll();

        $mpdf = new \Mpdf\Mpdf([
            'mode' => 'utf-8',
            'format' => [55, 300], // lebar 80mm, tinggi contoh (bisa ditambah)
            'margin_left' => 5, 'margin_right' => 5, 'margin_top' => 5, 'margin_bottom' => 5
        ]);
        
        $html = '
        <style>
          body{font-family: Arial, sans-serif; color:#000;}
          .item{margin-bottom:8mm;}
          .kode{font-size:18pt; font-weight:700; margin-bottom:4px;}
          .info-table{width:100%; border-collapse:collapse; font-size:9pt;}
          .info-table td{padding:0; vertical-align:top;}
          .label{font-size:9pt;}
          .value{font-size:14pt; font-weight:600; padding-top:4px;}
          .divider{border-top:1px dashed #000; margin-top:6px;}
        </style>
        ';
        
       if (empty($rows)) {
            $html .= '<p style="text-align:center; font-size:12pt;">Data tidak tersedia</p>';
        } else {
            foreach ($rows as $it) {
                $html .= '<div class="item">';
                $html .= '<div class="kode">'.htmlspecialchars($it['code']).'</div>';
                $html .= '<table class="info-table">';
                $html .= '<tr>';
                $html .= '<td style="width:40%; text-align:left;"><span class="label">Lokasi</span></td>';
                $html .= '<td style="width:30%; text-align:center;"><span class="label">Jml</span></td>';
                $html .= '<td style="width:30%; text-align:right;"><span class="label">Tgl Prod</span></td>';
                $html .= '</tr>';
                $html .= '<tr>';
                $html .= '<td style="text-align:left;"><span class="value">'.htmlspecialchars($it['lokasi']).'</span></td>';
                $html .= '<td style="text-align:center;"><span class="value">'.htmlspecialchars($it['jml']).'</span></td>';
                $html .= '<td style="text-align:right;"><span class="value">'.htmlspecialchars($it['tgl']).'</span></td>';
                $html .= '</tr>';
                $html .= '</table>';
                $html .= '<div class="divider"></div>';
                $html .= '<br>';
                $html .= '</div>';
            }
        }
        
        $html .= '<br>';
        $html .= '<table class="info-table">';
        $html .= '<tr>';
        $html .= '<td style="text-align:right;"><span class="value">Kerani : '.htmlspecialchars($it['kerani_username']).'</span></td>';
        $html .= '</tr>';
        $html .= '</table>';
        $html .= '</div>';
        
        $mpdf->WriteHTML($html);
        $mpdf->Output();
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
