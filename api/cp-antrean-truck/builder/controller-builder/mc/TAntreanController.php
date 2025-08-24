<?php

Yii::import("app.modules.mc.forms.tAntrean.*");

class TAntreanController extends Controller {
    public function filters() {
        // Use access control filter
        return ['accessControl'];
    }

    public function accessRules() {
        // Only allow authenticated users
        return [['allow', 'users' => ['@']],['deny']];
    }
    
    public function actionIndex() {
        $this->renderForm('McTAntreanIndex');
    }
    
    public function actionSaveRec(){
        $rest_json = file_get_contents("php://input");
        $post = json_decode($rest_json, true);
        
        // vdump($post);
        echo json_encode(['st' => 1, 'msg' => 'Success']);
    }

    public function actionEdit($id = null) {
        if (is_null($id)) {
            $model = new McTAntreanForm;    
        } else {
            $model = $this->loadModel($id, "McTAntreanForm"); 
        }
    
        if (isset($_POST["McTAntreanForm"])) {
            $model->attributes = $_POST["McTAntreanForm"];

            $transaction = Yii::app()->db->beginTransaction();
            try {
                if ($model->save()) {
                    $antreanId = $model->id;
    
                    // Update t_antrean (warehouse)
                    $antrean = TAntrean::model()->findByPk($antreanId);
                    if ($antrean) {
                        $antrean->warehouse_id = isset($_POST["McTAntreanForm"]["warehouse_id"]) 
                            ? $_POST["McTAntreanForm"]["warehouse_id"]
                            : $antrean->warehouse_id;

                        $antrean->warehouse_override_id = isset($_POST["McTAntreanForm"]["warehouse_override_id"]) 
                            ? $_POST["McTAntreanForm"]["warehouse_override_id"] 
                            : $antrean->warehouse_override_id;
                            
                        $antrean->kerani_id = isset($_POST["McTAntreanForm"]["kerani_id"])
                            ? $_POST["McTAntreanForm"]["kerani_id"]
                            : $antrean->kerani_id;
                            

                        $antrean->save();
                    }
    
                    // Update t_antrean_gate
                    $gate = TAntreanGate::model()->find("antrean_id = :id", [":id" => $antreanId]);
                    $gate->gate_id = $_POST["McTAntreanForm"]["gate_id"] ? $_POST["McTAntreanForm"]["gate_id"] : $gate->gate_id;
                    $gate->save();
    
                    // Update t_antrean_rekomendasi_lokasi
                    $lokasi = TAntreanRekomendasiLokasi::model()->findAll(
                        "antrean_id = :id",
                        [":id" => $antreanId]
                    );
                    
                    foreach ($lokasi as $item) {
                        $item->location_id = $_POST["McTAntreanForm"]["location_id"] 
                            ? $_POST["McTAntreanForm"]["location_id"] 
                            : $item->location_id;
                    
                        $item->location_override_id = $_POST["McTAntreanForm"]["location_override_id"] 
                            ? $_POST["McTAntreanForm"]["location_override_id"] 
                            : $item->location_override_id;
                            
                        $item->qty = $_POST["McTAntreanForm"]["qty"] 
                            ? $_POST["McTAntreanForm"]["qty"] 
                            : $item->qty;
                            
                         $item->qty_override_id = $_POST["McTAntreanForm"]["qty_override_id"] 
                            ? $_POST["McTAntreanForm"]["qty_override_id"] 
                            : $item->qty_override_id;
                    
                        $item->save();
                    }

                    $transaction->commit();
    
                    $this->flash('Data Berhasil Disimpan');
                    $this->redirect(['index']);
                }
            } catch (Exception $e) {
                $transaction->rollback();
                throw $e;
            }
        }
    
        $this->renderForm("McTAntreanForm", $model);
    }

    public function actionDelete($id) {
        if (strpos($id, ',') > 0) {
            ActiveRecord::batchDelete("McTAntreanForm", explode(",", $id));
            $this->flash('Data Berhasil Dihapus');
        } else {
            $model = $this->loadModel($id, "McTAntreanForm");
            if (!is_null($model)) {
                $this->flash('Data Berhasil Dihapus');
                $model->delete();
            }
        }


        $this->redirect(['index']);
    }
    
    public function actionPrint($id) {
        vdump($id);
        die();
    }
                    
}
