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
            // Batch soft delete
            $ids = explode(",", $id);
            foreach($ids as $locationId) {
                $this->softDeleteLocation(trim($locationId));
            }
            $this->flash('Data Berhasil Dihapus');
        } else {
            $this->softDeleteLocation($id);
            $this->flash('Data Berhasil Dihapus');
        }

        $this->redirect(['index']);
    }
    
    private function softDeleteLocation($id) {
        // Use raw SQL for soft delete to avoid model dependencies
        $sql = "UPDATE m_location SET is_deleted = true WHERE id = :id AND is_deleted = false";
        $command = Yii::app()->db->createCommand($sql);
        $command->bindParam(':id', $id, PDO::PARAM_INT);
        return $command->execute();
    }
    
}
