<?php

class XEndpointConfig extends ActiveRecord
{

	public function tableName()
	{
		return 'x_endpoint_config';
	}

	public function rules()
	{
		return array(
			array('label, endpoint', 'length', 'max'=>256),
		);
	}

	public function relations()
	{
		return array(
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'label' => 'Label',
			'endpoint' => 'Endpoint',
		);
	}

}
