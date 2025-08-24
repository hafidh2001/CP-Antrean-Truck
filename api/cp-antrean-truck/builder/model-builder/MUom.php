<?php

class MUom extends ActiveRecord
{

	public function tableName()
	{
		return 'm_uom';
	}

	public function rules()
	{
		return array(
			array('unit, conversion', 'required'),
			array('conversion, convert_to', 'numerical', 'integerOnly'=>true),
			array('unit', 'length', 'max'=>256),
		);
	}

	public function relations()
	{
		return array(
			'convertTo' => array(self::BELONGS_TO, 'MUom', 'convert_to'),
			'mUoms' => array(self::HAS_MANY, 'MUom', 'convert_to'),
			'tStocks' => array(self::HAS_MANY, 'TStock', 'uom_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'unit' => 'Unit',
			'conversion' => 'Conversion',
			'convert_to' => 'Convert To',
		);
	}
	
	public static function getList(){
	    
	  $res = MUom::model()->findAllByAttributes([]);  
	  
	  return array_column($res, 'attributes');
	}

}
