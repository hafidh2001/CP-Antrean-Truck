<?php

Yii::import("app.modules.superadmin.forms.tDeliveryOrder.*");

class TDeliveryOrderController extends Controller {
    public function filters() {
        // Use access control filter
        return ['accessControl'];
    }

    public function accessRules() {
        // Only allow authenticated users
        return [['allow', 'users' => ['@']],['deny']];
    }
    
    public function actionIndex() {
        $this->renderForm('SuperadminTDeliveryOrderIndex');
    }

    public function actionEdit($id = null) {
        if(is_null($id)){
            $model = new SuperadminTDeliveryOrderForm;    
        } else {
            $model = $this->loadModel($id, "SuperadminTDeliveryOrderForm");       
        }
        
        if (isset($_POST["SuperadminTDeliveryOrderForm"])) {
            $model->attributes = $_POST["SuperadminTDeliveryOrderForm"];
            if ($model->save()) {
                $this->flash('Data Berhasil Disimpan');
                $this->redirect(['index']);
            }
        }
        $this->renderForm("SuperadminTDeliveryOrderForm", $model);
    }

    public function actionDelete($id) {
        if (strpos($id, ',') > 0) {
            ActiveRecord::batchDelete("SuperadminTDeliveryOrderForm", explode(",", $id));
            $this->flash('Data Berhasil Dihapus');
        } else {
            $model = $this->loadModel($id, "SuperadminTDeliveryOrderForm");
            if (!is_null($model)) {
                $this->flash('Data Berhasil Dihapus');
                $model->delete();
            }
        }


        $this->redirect(['index']);
    }
    
    public function actionView() {
        if (isset($_POST["SuperadminTDeliveryOrderView"])) {
            $post = $_POST["SuperadminTDeliveryOrderView"];
            
            
            $url = "https://cpipga.com/API_DO/getDataDO";
            $headers = [
                "Content-Type: application/json",
                "Token: GlqVo45k2q3D8b26dLZRCp5vFjNxKUtw"
            ];
            
            $body = [
                "nopol" => $post["nopol"]
            ];
    
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_POST, true); // POST
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));

            $response = curl_exec($ch);
            curl_close($ch);
    
            $data = json_decode($response, true);

            // check data
            if (!$data["status"]) {
                    $message = "Data tidak ditemukan";

                if (isset($data["message"]) && is_string($data["message"])) {
                    $message = $data["message"];
                }

                $this->flash($message, "error");
            }
            
            // insert
            foreach ($data["message"] as $row) {
                // Cek apakah no_do sudah ada
                $existingNoDo = TDeliveryOrder::model()->findByAttributes(["no_do" => $row["no_do"]]);

                if (!$existingNoDo) {
                    $do = new TDeliveryOrder();
                    $do->synced_time = date("Y-m-d H:i:s");
                    $do->status = "OPEN";
                    $do->id_sap = $row["id_data_do_fl"];
                    $do->plant = $row["plant"];
                    $do->truck_no = $row["truck_no"];
                    $do->out_date = $row["out_date"];
                    $do->no_do = $row["no_do"];
                    $do->delivery_date = $row["delivery_date"];
                    $do->sorg = $row["sorg"];
                    $do->customer_id = $row["customer_id"];
                    $do->sold_to_party = $row["sold_to_party"];
                    $do->created_by = $row["created_by"];
                    $do->created_date = $row["created_date"];
                    $do->shiptotext = $row["shiptotext"];
                    $do->cust_name = $row["cust_name"];
                    $do->cust_city = $row["cust_city"];
                    $do->cust_street = $row["cust_street"];
                    $do->cust_strsuppl = $row["cust_strsuppl"];
                    $do->sap_client = $row["sap_client"];
                    $do->date_inserted = $row["date_inserted"];
    
                    if ($do->save()) {
                        $idDo = $do->id;
                        // echo "<pre>";
                        // echo "DO berhasil disimpan. ID: " . $idDo . "\n";
                        // print_r($idDo);
                        // print_r($do->attributes);
                        // echo "</pre>";
                        // die();
                    } else {
                        $this->flash("Gagal simpan DO: " . json_encode($do->getErrors()), "error");
                        continue;
                        // echo "<pre>";
                        // echo "Gagal simpan DO:\n";
                        // print_r($do->getErrors());
                        // echo "</pre>";
                        // die();
                    }
                } else {
                    $idDo = $existingNoDo->id;
                }

                // Insert DO Line hanya jika DO berhasil disimpan/ditemukan
                if (isset($idDo)) {
                    $doLine = new TDeliveryOrderLine();
                    $doLine->do_id = $idDo;
                    $doLine->seq_number = $row["seq_number"];
                    $doLine->goods_code = $row["material"];
                    $doLine->qty_in_do = $row["qty_in_do"];
                    $doLine->uoe = $row["uoe"];
                    $doLine->div_qty = $row["div_qty"];
                    $doLine->su = $row["su"];
                    $doLine->ref_doc = $row["ref_doc"];
                    $doLine->ref_itm = $row["ref_itm"];
                    $doLine->batch = $row["batch"];
    
                    if (!$doLine->save()) {
                        $this->flash("Gagal simpan DO Line: " . json_encode($doLine->getErrors()), "error");
                        echo "<pre>";
                        echo "Gagal simpan DO LINE:\n";
                        print_r($doLine->getErrors());
                        echo "</pre>";
                        die();
                    }
                }
            }
            
            $this->flash("Data Berhasil Disimpan");
            return $this->redirect(["index"]);
        }
        
        $this->renderForm("SuperadminTDeliveryOrderView");
    }
    
}
