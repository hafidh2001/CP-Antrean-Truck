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

}
