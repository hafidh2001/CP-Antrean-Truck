<?php

class MGoods extends ActiveRecord
{

	public function tableName()
	{
		return 'm_goods';
	}

	public function rules()
	{
		return array(
			array('kode, weight, smallest_unit', 'required'),
			array('smallest_unit', 'numerical', 'integerOnly'=>true),
			array('weight', 'numerical'),
			array('kode', 'length', 'max'=>256),
		);
	}

	public function relations()
	{
		return array(
			'tStocks' => array(self::HAS_MANY, 'TStock', 'goods_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'kode' => 'Kode',
			'weight' => 'Weight',
			'smallest_unit' => 'Smallest Unit',
		);
	}
	
	public static function getList(){
	    
	  $res = MGoods::model()->findAllByAttributes([]);  
	  
	  return array_column($res, 'attributes');
	}

}
