<?php

class TAntreanRekomendasiLokasi extends ActiveRecord
{

	public function tableName()
	{
		return 't_antrean_rekomendasi_lokasi';
	}

	public function rules()
	{
		return array(
			array('antrean_id, goods_id, location_id, qty, uom_id', 'required'),
			array('antrean_id, goods_id, location_id, qty, uom_id, location_override_id, qty_override', 'numerical', 'integerOnly'=>true),
		);
	}

	public function relations()
	{
		return array(
			'antrean' => array(self::BELONGS_TO, 'TAntrean', 'antrean_id'),
			'goods' => array(self::BELONGS_TO, 'MGoods', 'goods_id'),
			'location' => array(self::BELONGS_TO, 'MLocation', 'location_id'),
			'uom' => array(self::BELONGS_TO, 'MUom', 'uom_id'),
			'locationOverride' => array(self::BELONGS_TO, 'MLocation', 'location_override_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'antrean_id' => 'Antrean',
			'goods_id' => 'Goods',
			'location_id' => 'Location',
			'qty' => 'Qty',
			'uom_id' => 'Uom',
			'location_override_id' => 'Location Override',
			'qty_override' => 'Qty Override',
		);
	}

}
