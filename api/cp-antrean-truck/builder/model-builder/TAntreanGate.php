<?php

class TAntreanGate extends ActiveRecord
{

	public function tableName()
	{
		return 't_antrean_gate';
	}

	public function rules()
	{
		return array(
			array('antrean_id, gate_id', 'required'),
			array('antrean_id, gate_id', 'numerical', 'integerOnly'=>true),
		);
	}

	public function relations()
	{
		return array(
			'gate' => array(self::BELONGS_TO, 'MGate', 'gate_id'),
			'antrean' => array(self::BELONGS_TO, 'TAntrean', 'antrean_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'antrean_id' => 'Antrean',
			'gate_id' => 'Gate',
		);
	}

}
