<?php

Yii::import("app.modules.admin.forms.tAntrean.*");

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
        $this->renderForm('AdminTAntreanIndex');
    }
    
    public function actionHistory() {
        $this->renderForm('AdminTAntreanHistory');
    }
    
    public function actionFind($nopol) {
        $nopol = trim($nopol);
        
        $antrean = TAntrean::model()->find(
            "nopol = :nopol AND status = 'LOADING'",
            [":nopol" => $nopol]
        );
    
        if ($antrean !== null) {
            $this->redirect(['/admin/tAntrean/edit', 'id' => $antrean->id]);
        } else {
            Yii::app()->user->setFlash('error', 'Antrean tidak ada.');
             $this->redirect(['/admin/tAntrean/index']);
        }
    }
    
    public function actionSaveRec(){
        $rest_json = file_get_contents("php://input");
        $post = json_decode($rest_json, true);
        
        $idAntreanRecLoc = isset($post['data']['id']) ? $post['data']['id'] : null;

        if ($idAntreanRecLoc) {
            $model = TAntreanRekomendasiLokasi::model()->findByPk($idAntreanRecLoc);
            if ($model !== null) {
                $model->location_override_id = $post['data']['location_override_id'];
                $model->qty_override = $post['data']['qty_override'];   

                if ($model->save()) {
                    echo json_encode(['status' => 1, 'msg' => 'Updated Success']);
                } else {
                    echo json_encode(['status' => 0, 'msg' => 'Failed to update']);
                }
            } else {
                echo json_encode(['status' => 0, 'msg' => 'Data not found']);
            }
        } else {
            echo json_encode(['status' => 0, 'msg' => 'Missing ID']);
        }

        $this->renderForm("AdminTAntreanForm");
    }

    public function actionEdit($id = null) {
        if(is_null($id)){
            $model = new AdminTAntreanForm;    
        } else {
            $model = $this->loadModel($id, "AdminTAntreanForm");
            
            $gates = TAntreanGate::model()->findAll(
                "antrean_id = :id",
                [":id" => $id]
            );

            $model->gate_i_id = isset($gates[0]) ? $gates[0]->gate_id : null;
            $model->gate_ii_id = isset($gates[1]) ? $gates[1]->gate_id : null;
        }
        
        if (isset($_POST["AdminTAntreanForm"])) {
            $model->attributes = $_POST["AdminTAntreanForm"];
            
            $transaction = Yii::app()->db->beginTransaction();

            try {
                if ($model->save()) {
                    $antreanId = $model->id;
    
                    // Update t_antrean (warehouse)
                    $antrean = TAntrean::model()->findByPk($antreanId);
                    if ($antrean) {
                        $antrean->warehouse_id = isset($_POST["AdminTAntreanForm"]["warehouse_id"]) 
                            ? $_POST["AdminTAntreanForm"]["warehouse_id"]
                            : $antrean->warehouse_id;

                        $antrean->warehouse_override_id = isset($_POST["AdminTAntreanForm"]["warehouse_override_id"]) 
                            ? $_POST["AdminTAntreanForm"]["warehouse_override_id"] 
                            : $antrean->warehouse_override_id;
                        
                        if (isset($_POST["AdminTAntreanForm"]["kerani_id"])) {
                            $antrean->kerani_id = $_POST["AdminTAntreanForm"]["kerani_id"];
                            $antrean->assigned_kerani_time = date('Y-m-d H:i:s');
                            $antrean->status = "LOADING";
                        }
                        
                        if (isset($_POST["AdminTAntreanForm"]["admin_id"])) {
                            $antrean->admin_id = $_POST["AdminTAntreanForm"]["admin_id"];
                            $antrean->verifying_time = date('Y-m-d H:i:s');
                            $antrean->status = "VERIFIYING";
                        }

                        $antrean->save();
                    }
    
                    // Update t_antrean_gate
                    $gatesInput = [
                        isset($_POST["AdminTAntreanForm"]["gate_i_id"]) ? $_POST["AdminTAntreanForm"]["gate_i_id"] : null,
                        isset($_POST["AdminTAntreanForm"]["gate_ii_id"]) ? $_POST["AdminTAntreanForm"]["gate_ii_id"] : null,
                    ];

                    $gates = array_unique(array_filter($gatesInput));

                    TAntreanGate::model()->deleteAll("antrean_id = :id", [":id" => $antreanId]);

                    foreach ($gates as $gateId) {
                        $gate = new TAntreanGate();
                        $gate->antrean_id = $antreanId;
                        $gate->gate_id = $gateId;
                        $gate->save();
                    }
    
                    // Update t_antrean_rekomendasi_lokasi
                    $lokasi = TAntreanRekomendasiLokasi::model()->findAll(
                        "antrean_id = :id",
                        [":id" => $antreanId]
                    );

                    if (isset($lokasi)) {
                        foreach ($lokasi as $item) {
                            $item->location_id = isset($_POST["AdminTAntreanForm"]["location_id"])
                                ? $_POST["AdminTAntreanForm"]["location_id"] 
                                : $item->location_id;
                        
                            $item->location_override_id = isset($_POST["AdminTAntreanForm"]["location_override_id"])
                                ? $_POST["AdminTAntreanForm"]["location_override_id"] 
                                : $item->location_override_id;
                                
                            $item->qty = isset($_POST["AdminTAntreanForm"]["qty"])
                                ? $_POST["AdminTAntreanForm"]["qty"] 
                                : $item->qty;
                                
                             $item->qty_override_id = isset($_POST["AdminTAntreanForm"]["qty_override"])
                                ? $_POST["AdminTAntreanForm"]["qty_override"] 
                                : $item->qty_override_id;
                        
                            $item->save();
                        }
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

        $deliveryOrder = TDeliveryOrder::model()->find([
            'condition' => 'truck_no = :nopol',
            'params'    => [':nopol' => $model->nopol],
            'order'     => 'id ASC',
        ]);

        $jenis_truck = $deliveryOrder !== null ? $deliveryOrder->jenis_truck : null;

        $model->jenis_truck = $jenis_truck;

        $this->renderForm("AdminTAntreanForm", $model);
    }

    public function actionDelete($id) {
        if (strpos($id, ',') > 0) {
            ActiveRecord::batchDelete("AdminTAntreanForm", explode(",", $id));
            $this->flash('Data Berhasil Dihapus');
        } else {
            $model = $this->loadModel($id, "AdminTAntreanForm");
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
