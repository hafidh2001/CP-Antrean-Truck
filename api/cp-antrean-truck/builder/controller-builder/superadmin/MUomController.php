<?php

Yii::import("app.modules.superadmin.forms.mUom.*");

class MUomController extends Controller {
    public function filters() {
        // Use access control filter
        return ['accessControl'];
    }

    public function accessRules() {
        // Only allow authenticated users
        return [['allow', 'users' => ['@']],['deny']];
    }
    
    public function actionIndex() {
        $this->renderForm('SuperadminMUomIndex');
    }

    public function actionEdit($id = null) {
        if(is_null($id)){
            $model = new SuperadminMUomForm;    
        } else {
            $model = $this->loadModel($id, "SuperadminMUomForm");       
        }
        
        if (isset($_POST["SuperadminMUomForm"])) {
            $model->attributes = $_POST["SuperadminMUomForm"];
            if ($model->save()) {
                $this->flash('Data Berhasil Disimpan');
                $this->redirect(['index']);
            }
        }
        $this->renderForm("SuperadminMUomForm", $model);
    }

    public function actionDelete($id) {
        if (strpos($id, ',') > 0) {
            ActiveRecord::batchDelete("SuperadminMUomForm", explode(",", $id));
            $this->flash('Data Berhasil Dihapus');
        } else {
            $model = $this->loadModel($id, "SuperadminMUomForm");
            if (!is_null($model)) {
                $this->flash('Data Berhasil Dihapus');
                $model->delete();
            }
        }


        $this->redirect(['index']);
    }
    
}
