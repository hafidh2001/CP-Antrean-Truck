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
			array('production_date', 'safe'),
		);
	}

	public function relations()
	{
		return array(
			'goods' => array(self::BELONGS_TO, 'MGoods', 'goods_id'),
			'location' => array(self::BELONGS_TO, 'MLocation', 'location_id'),
			'uom' => array(self::BELONGS_TO, 'MUom', 'uom_id'),
			'opnam' => array(self::BELONGS_TO, 'TOpnam', 'opnam_id'),
			'createdBy' => array(self::BELONGS_TO, 'User', 'created_by'),
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
		);
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
            
            
            
            if(!$md->save()){
                $tsc->rollback();
                return ['status' => false, 'message' => $md->errors];
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
