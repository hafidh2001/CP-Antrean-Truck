<?php

class HomeController extends Controller {
    public function filters() {
        // Use access control filter
        return ['accessControl'];
    }
    
    public function accessRules() {
        // Only allow authenticated users
        return [['allow', 'users' => ['@']], ['deny']];
    }
    
    public function actionIndex(){
        // echo 'haloalioaa';
        if(isset($_POST['SuperadminHome'])){
            vdump($_POST['SuperadminHome']);
            die();
        }
        $this->renderForm('SuperadminHome');
    }

}