<?php

Yii::import("app.modules.superadmin.forms.setting.user.*");

class UserController extends Controller {
    public function filters() {
        // Use access control filter
        return ['accessControl'];
    }

    public function accessRules() {
        // Only allow authenticated users
        return [['allow', 'users' => ['@']],['deny']];
    }
    
    public function actionIndex() {
        $this->renderForm('SuperadminUserIndex');
    }

    public function actionEdit($id = null) {
        if(is_null($id)){
            $model = new SuperadminUserForm;    
        } else {
            $model = $this->loadModel($id, "SuperadminUserForm");                 
            $model->r  = UserRole::model()->findByAttributes(['user_id' => $model->id])->role_id;
            
            
            $oldPassword = $model->password;
            $model->password = '';
            
            if ($model->is_deleted === true) {
                $model->is_deleted = 'Y';
            } else {
                $model->is_deleted = 'N';
            }

        }
        
        if (isset($_POST["SuperadminUserForm"])) {
            $err = false;
            $model->attributes = $_POST["SuperadminUserForm"];
            $post = $_POST["SuperadminUserForm"];
            var_dump($post['r']);

            if(isset($post['r']) && $post['r'] != ''){
                
            } else {
                $err = true;
                $model->addErrors(['r' => 'Tidak Boleh Kosong']);
            }

            if(isset($post['password']) && $post['password'] != ''){
                $model->password = Helper::hash($model->password);   
            } else {
                if(is_null($id)){
                    $err = true;
                    $model->addErrors(['password' => 'Tidak Boleh Kosong']);    
                } else {
                    $model->password = $oldPassword;
                }
            }
            
            if ($model->is_deleted === 'Y') {
                $model->is_deleted = true;
            } else {
                $model->is_deleted = false;
            }

            if (!$err) {
                if ($model->save()) {
                    $r = new UserRole;
                    $r->user_id = $model->id;
                    $r->role_id = $post['r'];
                    $r->is_default_role = 'Yes';
                    $r->save();
                    $this->flash('Data Berhasil Disimpan');
                    $this->redirect(['index']);
                } else {
                    $model->password = '';
                }
            } else {
                   $model->password = '';
            }
        }
        $this->renderForm("SuperadminUserForm", $model);
    }

    public function actionDelete($id) {
        if (strpos($id, ',') > 0) {
            ActiveRecord::batchDelete("SuperadminUserForm", explode(",", $id));
            $this->flash('Data Berhasil Dihapus');
        } else {
            $model = $this->loadModel($id, "SuperadminUserForm");
            if (!is_null($model)) {
                $this->flash('Data Berhasil Dihapus');
                $model->delete();
            }
        }


        $this->redirect(['index']);
    }
    
}
