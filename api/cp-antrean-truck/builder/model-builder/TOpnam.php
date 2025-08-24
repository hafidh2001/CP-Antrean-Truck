<?php

class TOpnam extends ActiveRecord
{

	public function tableName()
	{
		return 't_opnam';
	}

	public function rules()
	{
		return array(
			array('warehouse_id, user_id, created_time', 'required'),
			array('warehouse_id, user_id', 'numerical', 'integerOnly'=>true),
			array('unlocked_time, finished_time', 'safe'),
		);
	}

	public function relations()
	{
		return array(
			'user' => array(self::BELONGS_TO, 'User', 'user_id'),
			'warehouse' => array(self::BELONGS_TO, 'MWarehouse', 'warehouse_id'),
			'tStocks' => array(self::HAS_MANY, 'TStock', 'opnam_id'),
		);
	}

	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'warehouse_id' => 'Warehouse',
			'user_id' => 'User',
			'created_time' => 'Created Time',
			'unlocked_time' => 'Unlocked Time',
			'finished_time' => 'Finished Time',
		);
	}
	
	public static function getActiveOpnam($params){
	    
	    $warehouse_id = isset($params['warehouse_id']) ? $params['warehouse_id'] : null;
	    $user_id = isset($params['user_id']) ? $params['user_id'] : null;
	    
	    if($warehouse_id==null || $user_id==null){
	        $response = [
    			'status' => false,
    			'message' => "Invalid Parameter!"
		    ];

		    return $response;
	    }
	    
	    $q = "SELECT *
                FROM t_opnam
                WHERE user_id = ".$user_id."
                  AND warehouse_id = ".$warehouse_id."
                  AND finished_time IS NULL;";
                  
        $opnam = Yii::app()->db->createCommand($q)
			->queryRow();
			
		
		if($opnam){
	        $response = [
    			'status' => true,
    			'message' => "Active Opnam Found!",
    			'data' => $opnam
		    ];

		    return $response;
	    }else{
	         $response = [
    			'status' => false,
    			'message' => "No Active Opnam",
    			'data' => $opnam
		    ];

		    return $response;
	    }
          
	}

}
