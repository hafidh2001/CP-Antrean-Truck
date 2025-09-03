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
	
	
	public static function postFinishOpnam($params){
	    $warehouse_id = isset($params['warehouse_id']) ? $params['warehouse_id'] : null;
	    $user_id = isset($params['user_id']) ? $params['user_id'] : null;
	    $opnam_id = isset($params['opnam_id']) ? $params['opnam_id'] : null;
	    
	    if($warehouse_id==null || $user_id==null || $opnam_id==null){
	        $response = [
    			'status' => false,
    			'message' => "Invalid Parameter!"
		    ];

		    return $response;
	    }
	    
	    
	    $opnam = TOpnam::model()->findByAttributes([
	        'warehouse_id' => $warehouse_id,
	        'user_id' => $user_id,
	        'id' => $opnam_id
	        ]);
	        
        if($opnam){
            $opnam->finished_time = date('Y-m-d H:i:s');
            
            if($opnam->save()){
                return [
        			'status' => true,
        			'message' => "Opname Finished",
        			'data' => $opnam
    		    ];
            }else{
              return [
        			'status' => false,
        			'message' => "Failed to Finish",
        			'data' => $opnam
    		    ];  
            }
            
        }else{
            return [
    			'status' => false,
    			'message' => "Opnam not found!",
    			'data' => $opnam
		    ];
        }
	    
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
		    $opnam2 = TOpnam::model()->findByAttributes(['id' => $opnam["id"]]);
		    
		    if(is_null($opnam2->unlocked_time)){
		        $opnam2->unlocked_time = date('Y-m-d H:i:s');
		    }
    	        
	        if($opnam2->save()){
	            $response = [
        			'status' => true,
        			'message' => "Active Opnam Found!",
        			'data' => $opnam
    		    ];
	            
	        }else{
	            $response = [
        			'status' => false,
        			'message' => "Failed to start opnam!",
        			'data' => $opnam
    		    ];
    	   }

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
