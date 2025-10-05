<?php

class TrackingController extends Controller {
    public function filters() {
        // Use access control filter
        return ['accessControl'];
    }
    
    public function accessRules() {
        // Only allow authenticated users
        return [['allow', 'users' => ['@']], ['deny']];
    }
    
    public function actionIndex(){
        $this->renderForm('AppTracking');
    }

}