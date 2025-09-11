<?php

Yii::import("app.modules.superadmin.forms.mWarehouse.*");

class MWarehouseController extends Controller {
    public function filters() {
        // Use access control filter
        return ['accessControl'];
    }

    public function accessRules() {
        // Only allow authenticated users
        return [['allow', 'users' => ['@']],['deny']];
    }
    
    public function actionIndex() {
        $this->renderForm('SuperadminMWarehouseIndex');
    }

    public function actionEdit($id = null) {
        $params = [];
        if(is_null($id)){
            $model = new SuperadminMWarehouseForm;    
        } else {
            $model = $this->loadModel($id, "SuperadminMWarehouseForm");     
            $params['preview'] = "https://server.kamz-kun.id:8282/warehouse/".$id."/view?mode=desktop";
        }
        
        if (isset($_POST["SuperadminMWarehouseForm"])) {
            $model->attributes = $_POST["SuperadminMWarehouseForm"];
            if ($model->save()) {
                $this->flash('Data Berhasil Disimpan');
                $this->redirect(['index']);
            }
        }

        $this->renderForm("SuperadminMWarehouseForm", $model, $params);
    }

    public function actionDelete($id) {
        if (strpos($id, ',') > 0) {
            ActiveRecord::batchDelete("SuperadminMWarehouseForm", explode(",", $id));
            $this->flash('Data Berhasil Dihapus');
        } else {
            $model = $this->loadModel($id, "SuperadminMWarehouseForm");
            if (!is_null($model)) {
                $this->flash('Data Berhasil Dihapus');
                $model->delete();
            }
        }


        $this->redirect(['index']);
    }
    
}
