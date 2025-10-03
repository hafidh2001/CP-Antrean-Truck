<?php

class XApiLog extends ActiveRecord
{

	public function tableName()
	{
		return 'x_api_log';
	}

	public function rules()
	{
		return array(
			array('created_time, api', 'required'),
			array('payload, response', 'safe'),
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
			'created_time' => 'Created Time',
			'api' => 'Api',
			'payload' => 'Payload',
			'response' => 'Response',
			'id' => 'ID',
		);
	}

}
