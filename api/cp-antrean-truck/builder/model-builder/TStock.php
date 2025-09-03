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
	
	public static function deleteStock($params){
	    $model = TStock::model()->findByPk($params['id']);
	    
	    if($model->delete()){
            return ['status' => true];
        }else{
            return ['status' => false, 'errors' => $model->errors];
        }
	    
	}

}
