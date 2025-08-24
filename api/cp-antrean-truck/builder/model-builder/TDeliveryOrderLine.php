<?php

class TDeliveryOrderLine extends ActiveRecord
{

	public function tableName()
	{
		return 't_delivery_order_line';
	}

	public function rules()
	{
		return array(
			array('do_id, goods_code, seq_number, qty_in_do, uoe, div_qty, batch', 'required'),
			array('do_id', 'numerical', 'integerOnly'=>true),
			array('goods_code, seq_number, qty_in_do, uoe, div_qty, su, ref_doc, ref_itm, batch', 'length', 'max'=>256),
		);
	}

	public function relations()
	{
		return array(
			'do' => array(self::BELONGS_TO, 'TDeliveryOrder', 'do_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'do_id' => 'Do',
			'goods_code' => 'Goods Code',
			'seq_number' => 'Seq Number',
			'qty_in_do' => 'Qty In Do',
			'uoe' => 'Uoe',
			'div_qty' => 'Div Qty',
			'su' => 'Su',
			'ref_doc' => 'Ref Doc',
			'ref_itm' => 'Ref Itm',
			'batch' => 'Batch',
		);
	}

}
