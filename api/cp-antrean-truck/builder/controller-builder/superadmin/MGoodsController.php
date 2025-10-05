<?php

Yii::import("app.modules.superadmin.forms.mGoods.*");

class MGoodsController extends Controller {
    public function filters() {
        // Use access control filter
        return ['accessControl'];
    }

    public function accessRules() {
        // Only allow authenticated users
        return [['allow', 'users' => ['@']],['deny']];
    }
    
    public function actionIndex() {
        $this->renderForm('SuperadminMGoodsIndex');
    }
    
    public function actionSync(){
        // Fetch
        $url = "https://cpipga.com/API_DO/getMaterial";
        $headers = [
            "Content-Type: application/json",
            "Token: GlqVo45k2q3D8b26dLZRCp5vFjNxKUtw"
        ];
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);
        
        
        if (!$data || !isset($data['status']) || !$data['status']) {
            echo "Gagal ambil data atau response invalid.";
            die();
        }
    
        $materials = $data['message'];

        // Sync
        foreach ($materials as $item) {
            $model = MGoods::model()->findByAttributes(['id_sap' => $item['id_material']]);
    
            if ($model === null) {
                $model = new MGoods;
            }
            
            $uom = MUom::model()->findByAttributes(['unit' => $item['jenis_pack']]);
    
            $model->id_sap = $item['id_material'];
            $model->kode = $item['material'];
            $model->weight = $item['berat_kg'];
            $model->smallest_unit = $uom->id;
            $model->save();
        }
        
        $this->flash('Berhasil TerSync');
        $this->redirect(['index']);
    }

    public function actionEdit($id = null) {
        if(is_null($id)){
            $model = new SuperadminMGoodsForm;    
        } else {
            $model = $this->loadModel($id, "SuperadminMGoodsForm");       
        }
        
        if (isset($_POST["SuperadminMGoodsForm"])) {
            $model->attributes = $_POST["SuperadminMGoodsForm"];
            
            if (trim($model->alias) === '') {
                $model->alias = null;
            }
    
            if ($model->save()) {
                $this->flash('Data Berhasil Disimpan');
                $this->redirect(['index']);
            }
        }
        $this->renderForm("SuperadminMGoodsForm", $model);
    }

    public function actionDelete($id) {
        if (strpos($id, ',') > 0) {
            ActiveRecord::batchDelete("SuperadminMGoodsForm", explode(",", $id));
            $this->flash('Data Berhasil Dihapus');
        } else {
            $model = $this->loadModel($id, "SuperadminMGoodsForm");
            if (!is_null($model)) {
                $this->flash('Data Berhasil Dihapus');
                $model->delete();
            }
        }


        $this->redirect(['index']);
    }
    
}
