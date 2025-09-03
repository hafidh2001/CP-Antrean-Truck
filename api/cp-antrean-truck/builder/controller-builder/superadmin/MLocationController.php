<?php

Yii::import("app.modules.superadmin.forms.mLocation.*");

class MLocationController extends Controller {
    public function filters() {
        // Use access control filter
        return ['accessControl'];
    }

    public function accessRules() {
        // Only allow authenticated users
        return [['allow', 'users' => ['@']],['deny']];
    }
    
    public function actionIndex() {
        $this->renderForm('SuperadminMLocationIndex');
    }

    public function actionEdit($id = null) {
        if(is_null($id)){
            $model = new SuperadminMLocationForm;    
        } else {
            $model = $this->loadModel($id, "SuperadminMLocationForm");       
        }
        
        if (isset($_POST["SuperadminMLocationForm"])) {
            $model->attributes = $_POST["SuperadminMLocationForm"];
            if ($model->save()) {
                $this->flash('Data Berhasil Disimpan');
                $this->redirect(['index']);
            }
        }
        $this->renderForm("SuperadminMLocationForm", $model);
    }

    public function actionDelete($id) {
        if (strpos($id, ',') > 0) {
            ActiveRecord::batchDelete("SuperadminMLocationForm", explode(",", $id));
            $this->flash('Data Berhasil Dihapus');
        } else {
            $model = $this->loadModel($id, "SuperadminMLocationForm");
            if (!is_null($model)) {
                $this->flash('Data Berhasil Dihapus');
                $model->delete();
            }
        }


        $this->redirect(['index']);
    }
    
}
