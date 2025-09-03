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
			array('smallest_unit, id_sap', 'numerical', 'integerOnly'=>true),
			array('weight', 'numerical'),
			array('kode, alias', 'length', 'max'=>256),
		);
	}

	public function relations()
	{
		return array(
			'tStocks' => array(self::HAS_MANY, 'TStock', 'goods_id'),
			'smallestUnit' => array(self::BELONGS_TO, 'MUom', 'smallest_unit'),
			'tAntreanRekomendasiLokasis' => array(self::HAS_MANY, 'TAntreanRekomendasiLokasi', 'goods_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'kode' => 'Kode',
			'weight' => 'Weight',
			'smallest_unit' => 'Smallest Unit',
			'id_sap' => 'Id Sap',
			'alias' => 'Alias',
		);
	}
	
	public static function getList(){
	    
	  $res = MGoods::model()->findAllByAttributes([]);  
	  
	  return array_column($res, 'attributes');
	}


}
