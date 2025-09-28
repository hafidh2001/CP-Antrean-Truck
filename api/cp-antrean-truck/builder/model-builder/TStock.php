<?php

class TStock extends ActiveRecord
{

	public function tableName()
	{
		return 't_stock';
	}

	public function rules()
	{
		return array(
			array('location_id, goods_id, qty, uom_id, created_by, opnam_id', 'required'),
			array('location_id, goods_id, qty, uom_id, created_by, opnam_id', 'numerical', 'integerOnly'=>true),
			array('status', 'length', 'max'=>256),
			array('production_date, from_last_opnam', 'safe'),
		);
	}

	public function relations()
	{
		return array(
			'goods' => array(self::BELONGS_TO, 'MGoods', 'goods_id'),
			'uom' => array(self::BELONGS_TO, 'MUom', 'uom_id'),
			'createdBy' => array(self::BELONGS_TO, 'User', 'created_by'),
			'opnam' => array(self::BELONGS_TO, 'TOpnam', 'opnam_id'),
			'location' => array(self::BELONGS_TO, 'MLocation', 'location_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'location_id' => 'Location',
			'goods_id' => 'Goods',
			'qty' => 'Qty',
			'uom_id' => 'Uom',
			'status' => 'Status',
			'created_by' => 'Created By',
			'opnam_id' => 'Opnam',
			'production_date' => 'Production Date',
			'from_last_opnam' => 'From Last Opnam',
		);
	}
	
	public static function getTracking($params){
	    if(isset($params[':kode']) && $params[':kode'] != ''){
	        $kode = $params[':kode'];    
	    } else {
	        return '';
	    }
	    
	    $allwh = MWarehouse::model()->findAllByAttributes(['status' => 'OPEN']);
	    $opnams = [];
	    foreach($allwh as $k => $v){
	        $opnam = TOpnam::model()->findByAttributes(['warehouse_id' => $v->id], ['condition'=> 'finished_time IS NOT NULL','order' => 'id DESC']);
	        if($opnam){
	            $opnams[] = $opnam->id;    
	        }
	        
	    }
	    
	    $w_opnam = implode(',', $opnams);
	    
	    $sql = "SELECT g.id, 
                       l.label as lokasi, 
                       s.production_date, 
                       g.kode, 
                       s.qty, 
                       uo.unit, 
                       (uo.conversion * s.qty) as jumlah,  
                       h.name as wh,
                       o.created_time,
                       o.id as opnam_id,
                       (s.production_date + g.umur * INTERVAL '1 day')::date AS tanggal_kadaluarsa,
                       GREATEST(0,  g.umur - (NOW()::date - s.production_date)) AS sisa_umur
                FROM m_goods g
                INNER JOIN t_stock s ON s.goods_id = g.id
                INNER JOIN m_location l ON l.id = s.location_id
                INNER JOIN t_opnam o ON o.id = s.opnam_id
                INNER JOIN m_uom uo ON uo.id = s.uom_id
                INNER JOIN m_warehouse h ON h.id = o.warehouse_id
                WHERE g.kode = '$kode' AND o.id IN ($w_opnam)
                ORDER BY production_date ASC NULLS FIRST";
                
        return $sql;
        
	}
	
	
	
	
	
	public static function addStock($params){
	    $md = new TStock;
        
        $md->location_id = $params['location_id'];
        $md->goods_id = $params['goods_id'];
        $md->qty = $params['qty'];
        $md->uom_id = $params['uom_id'];
        $md->status = 'Active';
        $md->created_by = 2;
        $md->opnam_id = $params['opnam_id'];
        $md->production_date = $params['production_date'];
        
        if($md->save()){
            return ['status' => true, 'returnId' => $md->id];
        }else{
            return ['status' => false, 'errors' => $md->errors];
        }
        
	}
	
	
	public static function addMultipleStock($params){
	    
	    //Params looks like this
	    //
	   //  {
    //         "location_id": 86, -> location_id
    //          "opnam_id"
    //         "stock": [
    //             {
    //                 "id": 43,
    //                 "location_label": "A-001",
    //                 "goods_id": 29,
    //                 "goods_code": "HG11B",
    //                 "stock_qty": 0,
    //                 "stock_unit": "SACK",
    //                 "opnam_date": "2025-08-25 09:46:11",
    //                 "is_last_opnam": true
    //             },
    //             {
    //                 "id": 42,
    //                 "location_label": "A-001",
    //                 "goods_id": 26,
    //                 "goods_code": "535R",
    //                 "stock_qty": 3,
    //                 "stock_unit": "BOX",
    //                 "opnam_date": "2025-08-25 09:46:11",
    //                 "is_last_opnam": true
    //             }
    //         ]
    //     }
    
    
    
        $tsc = Yii::app()->db->beginTransaction();
        
        
        //DELETE EXISTING RECORD TO AVOID DUPE
        
        $dq = "DELETE FROM t_stock WHERE opnam_id = ".$params["opnam_id"]." AND location_id = ".$params["location_id"];
        
        Yii::app()->db->createCommand($dq)->execute();
        
        if(isset($params['stock'])){
            if(count($params['stock'])>0)
            foreach($params['stock'] as $stock){
                $md = new TStock;
                
                $md->location_id = $params["location_id"];
                $md->goods_id = $stock['goods_id'];
                $md->qty = $stock['stock_qty'];
                $md->uom_id = $stock['uom_id'];
                $md->status = 'Active';
                if(isset($stock['created_by'])){
                    $md->created_by = $stock['created_by'];
                }else{
                    $md->created_by = 2;
                }
                
                $md->opnam_id = $params["opnam_id"];
                if($stock['opnam_date'] != ''){
                    $md->production_date = $stock['opnam_date'];    
                } else {
                    $md->production_date = null;
                }
                
                
                
                if(isset($stock['from_last_opnam'])){
                    $md->from_last_opnam = $stock['from_last_opnam'];
                }else{
                    $md->from_last_opnam = false;
                }
                
                //
                
                
                
                if(!$md->save()){
                    $tsc->rollback();
                    return ['status' => false, 'message' => $md->errors];
                }
            }
        }
    
    
	    $tsc->commit();
        return ['status' => true, 'message' => "Berhasil"];
        
        
	}
	
	public static function deleteStock($params){
	    $model = TStock::model()->findByPk($params['id']);
	    
	    if($model->delete()){
            return ['status' => true];
        }else{
            return ['status' => false, 'errors' => $model->errors];
        }
	    
	}

}
