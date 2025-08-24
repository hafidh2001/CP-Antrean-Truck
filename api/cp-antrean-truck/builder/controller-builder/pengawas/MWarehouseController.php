<?php

Yii::import("app.modules.pengawas.forms.mWarehouse.*");

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
        $this->renderForm('PengawasMWarehouseIndex');
    }

    public function actionEdit($id = null) {
        if(is_null($id)){
            $model = new PengawasMWarehouseForm;    
        } else {
            $model = $this->loadModel($id, "PengawasMWarehouseForm");       
        }
        
        if (isset($_POST["PengawasMWarehouseForm"])) {
            $model->attributes = $_POST["PengawasMWarehouseForm"];
            if ($model->save()) {
                $this->flash('Data Berhasil Disimpan');
                $this->redirect(['index']);
            }
        }
        $this->renderForm("PengawasMWarehouseForm", $model);
    }

    public function actionDelete($id) {
        if (strpos($id, ',') > 0) {
            ActiveRecord::batchDelete("PengawasMWarehouseForm", explode(",", $id));
            $this->flash('Data Berhasil Dihapus');
        } else {
            $model = $this->loadModel($id, "PengawasMWarehouseForm");
            if (!is_null($model)) {
                $this->flash('Data Berhasil Dihapus');
                $model->delete();
            }
        }


        $this->redirect(['index']);
    }
    
}
