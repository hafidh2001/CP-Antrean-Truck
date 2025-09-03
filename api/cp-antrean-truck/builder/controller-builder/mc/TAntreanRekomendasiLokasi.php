<?php

Yii::import("app.modules.mc.forms.tAntreanRekomendasiLokasi.*");

class TAntreanRekomendasiLokasiController extends Controller {
    public function filters() {
        // Use access control filter
        return ['accessControl'];
    }

    public function accessRules() {
        // Only allow authenticated users
        return [['allow', 'users' => ['@']],['deny']];
    }
    
    public function actionIndex() {
        $this->renderForm('McTAntreanRekomendasiLokasiIndex');
    }

    public function actionEdit($id = null) {
        if(is_null($id)){
            $model = new McTAntreanRekomendasiLokasiForm;    
        } else {
            $model = $this->loadModel($id, "McTAntreanRekomendasiLokasiForm");       
        }
        
        if (isset($_POST["McTAntreanRekomendasiLokasiForm"])) {
            $model->attributes = $_POST["McTAntreanRekomendasiLokasiForm"];
            if ($model->save()) {
                $this->flash('Data Berhasil Disimpan');
                $this->redirect(['index']);
            }
        }
        $this->renderForm("McTAntreanRekomendasiLokasiForm", $model);
    }

    public function actionDelete($id) {
        if (strpos($id, ',') > 0) {
            ActiveRecord::batchDelete("McTAntreanRekomendasiLokasiForm", explode(",", $id));
            $this->flash('Data Berhasil Dihapus');
        } else {
            $model = $this->loadModel($id, "McTAntreanRekomendasiLokasiForm");
            if (!is_null($model)) {
                $this->flash('Data Berhasil Dihapus');
                $model->delete();
            }
        }


        $this->redirect(['index']);
    }
    
}
