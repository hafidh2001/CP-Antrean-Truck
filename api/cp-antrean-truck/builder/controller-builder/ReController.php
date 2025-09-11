<?php

class ReController extends Controller {
    
    private $key = "alfafukidialdio";
    
    public function filters() {
        // Use access control filter
        return ['accessControl'];
    }
    
    public function accessRules() {
        // Only allow authenticated users
        return [['allow', 'users' => ['@']], ['deny']];
    }
    
    public function actionFloorPlan($id){
        $endpoint = XEndpointConfig::model()->findByAttributes(['label' => 'floor_plan'])->endpoint;
        $user_token = User::model()->findByPk(Yii::app()->user->id)->user_token;
        $res = [
                'user_token' => $user_token,
                'warehouse_id' => $id
            ];
        $plain = json_encode($res);
        $enc = Self::encryptAES($plain);
        
        header("Location: " .$endpoint.'warehouse?key='.$enc);
        exit;
	}
	
	public function actionFormKerani(){
        $endpoint = XEndpointConfig::model()->findByAttributes(['label' => 'floor_plan'])->endpoint;
        $user_token = User::model()->findByPk(Yii::app()->user->id)->user_token;
        $res = [
                'user_token' => $user_token
            ];
        $plain = json_encode($res);
        $enc = Self::encryptAES($plain);
        
        header("Location: " .$endpoint.'antrean-truck?key='.$enc);
        exit;
	}
	
	public function actionViewStock($id){
        $endpoint = XEndpointConfig::model()->findByAttributes(['label' => 'opname'])->endpoint;
        $res = [
                'user_id' => Yii::app()->user->id,
                'warehouse_id' => $id
            ];
        $plain = json_encode($res);
        $enc = Self::encryptAES($plain);
        header("Location: " .$endpoint.'pages/warehouse?key='.$enc);
        exit;
	}
	
	public function actionOpnam($id){
        $endpoint = XEndpointConfig::model()->findByAttributes(['label' => 'opname'])->endpoint;
        // $user_token = User::model()->findByPk(Yii::app()->user->id)->user_token;
        //cek apakah ada opnam aktif
        $opnam = TOpnam::model()->findByAttributes(['warehouse_id' => $id], ['condition' => 'finished_time IS NULL']);
        if(!$opnam){
            $opnam = new TOpnam;    
            $opnam->warehouse_id = $id;
            $opnam->user_id = Yii::app()->user->id;
            $opnam->created_time = date('Y-m-d H:i:s');
            $opnam->save();
        }
        
        $res = [
                'user_id' => Yii::app()->user->id,
                'warehouse_id' => $id
            ];
        $plain = json_encode($res);
        $enc = Self::encryptAES($plain);
        header("Location: " .$endpoint.'pages/opnam?key='.$enc);
        exit;
	}
	
	function encryptAES($plaintext) {
	    $key = $this->key;
        $key = substr(hash('sha256', $key, true), 0, 32); // 256-bit key
        $iv  = openssl_random_pseudo_bytes(16); // 128-bit IV
        $ciphertext = openssl_encrypt($plaintext, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        return base64_encode($iv . $ciphertext); // simpan IV + data
    }
    
    function actionEncrypt() {
        $plaintext="{\"warehouse_id\":1, \"user_id\":2}";
	    $key = $this->key;
        $key = substr(hash('sha256', $key, true), 0, 32); // 256-bit key
        $iv  = openssl_random_pseudo_bytes(16); // 128-bit IV
        $ciphertext = openssl_encrypt($plaintext, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        return base64_encode($iv . $ciphertext); // simpan IV + data
    }

}