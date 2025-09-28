<?php

class TOpnam extends ActiveRecord
{
    public function tableName()
    {
        return "t_opnam";
    }

    public function rules()
    {
        return [
            ["warehouse_id, user_id, created_time", "required"],
            ["warehouse_id, user_id", "numerical", "integerOnly" => true],
            ["unlocked_time, finished_time", "safe"],
        ];
    }

    public function relations()
    {
        return [
            "user" => [self::BELONGS_TO, "User", "user_id"],
            "warehouse" => [self::BELONGS_TO, "MWarehouse", "warehouse_id"],
            "tStocks" => [self::HAS_MANY, "TStock", "opnam_id"],
        ];
    }

    public function attributeLabels()
    {
        return [
            "id" => "ID",
            "warehouse_id" => "Warehouse",
            "user_id" => "User",
            "created_time" => "Created Time",
            "unlocked_time" => "Unlocked Time",
            "finished_time" => "Finished Time",
        ];
    }

    public static function postFinishOpnam($params)
    {
        $warehouse_id = isset($params["warehouse_id"])
            ? $params["warehouse_id"]
            : null;
        $user_id = isset($params["user_id"]) ? $params["user_id"] : null;
        $opnam_id = isset($params["opnam_id"]) ? $params["opnam_id"] : null;

        if ($warehouse_id == null || $user_id == null || $opnam_id == null) {
            $response = [
                "status" => false,
                "message" => "Invalid Parameter!",
            ];

            return $response;
        }

        $opnam = TOpnam::model()->findByAttributes([
            "warehouse_id" => $warehouse_id,
            "user_id" => $user_id,
            "id" => $opnam_id,
        ]);

        //Check for unsubmitted

        //CURRENT OPNAM (TO BE FINISHED)

        $q =
            "SELECT 
				        l.id,
                      l.label AS location_label,
                      COALESCE(COUNT(s.id),0) AS stock
                    FROM  m_location l
                    LEFT JOIN t_stock s ON l.id = s.location_id AND s.opnam_id =" .
            $opnam_id .
            "
                    WHERE 
                      l.is_deleted = false
                    GROUP BY 
                      l.id, l.label
                    ORDER BY 
                      l.label;
                    ";

        $currentStock = Yii::app()
            ->db->createCommand($q)
            ->queryAll();

        //LAST OPNAM (BEFORE CURRENT ONE)
        $qo =
            "SELECT * FROM t_opnam WHERE warehouse_id = '" .
            $warehouse_id .
            "' AND finished_time IS NOT NULL ORDER BY created_time DESC LIMIT 1";

        $lastOpnam = Yii::app()
            ->db->createCommand($qo)
            ->queryRow();

        if ($lastOpnam) {
            $q =
                "SELECT 
				        l.id,
                      l.label AS location_label,
                      COALESCE(COUNT(s.id),0) AS stock
                    FROM  m_location l
                    LEFT JOIN t_stock s ON l.id = s.location_id AND s.opnam_id =" .
                $lastOpnam["id"] .
                "
                    WHERE 
                      l.is_deleted = false
                    GROUP BY 
                      l.id, l.label
                    ORDER BY 
                      l.label;
                    ";

            $lastStock = Yii::app()
                ->db->createCommand($q)
                ->queryAll();

            //check if there is zero in current stock and not zero in last stock

            // Convert lastStock to associative array keyed by location_id for fast lookup
            $lastStockMap = [];
            foreach ($lastStock as $stock) {
                $lastStockMap[$stock["id"]] = (int) $stock["stock"];
            }

            // Result: locations with stock missing in current opnam
            $missingLocations = [];

            foreach ($currentStock as $curr) {
                $locationId = $curr["id"];
                $currStock = (int) $curr["stock"];
                $lastStock = isset($lastStockMap[$locationId])
                    ? $lastStockMap[$locationId]
                    : 0;

                if ($currStock === 0 && $lastStock > 0) {
                    
                    
                    $lastStockItems = TStock::model()->findAllByAttributes([
                        "location_id" => $locationId,
                        "opnam_id" => $lastOpnam["id"],
                    ]);
                    
                    
                    foreach ($lastStockItems as $item) {
                        $copyStock = new TStock;
                        $copyAttributes = $item->attributes;
                        unset($copyAttributes['id']); // prevent primary key conflict
                        $copyStock->attributes = $copyAttributes;
                        
                        $copyStock->opnam_id = $opnam_id;
                        $copyStock->from_last_opnam = true;
                        
                        $copyStock->save();
                        
                    }
                    //foreach $lastStockItems
                }
            }
        }

        if ($opnam) {
            $opnam->finished_time = date("Y-m-d H:i:s");

            if ($opnam->save()) {
                return [
                    "status" => true,
                    "message" => "Opname Finished",
                    "data" => $opnam,
                ];
            } else {
                return [
                    "status" => false,
                    "message" => "Failed to Finish",
                    "data" => $opnam,
                ];
            }
        } else {
            return [
                "status" => false,
                "message" => "Opnam not found!",
                "data" => $opnam,
            ];
        }
    }

    public static function getActiveOpnam($params)
    {
        $warehouse_id = isset($params["warehouse_id"])
            ? $params["warehouse_id"]
            : null;
        $user_id = isset($params["user_id"]) ? $params["user_id"] : null;

        if ($warehouse_id == null || $user_id == null) {
            $response = [
                "status" => false,
                "message" => "Invalid Parameter!",
            ];

            return $response;
        }

        $q =
            "SELECT *
                FROM t_opnam
                WHERE user_id = " .
            $user_id .
            "
                  AND warehouse_id = " .
            $warehouse_id .
            "
                  AND finished_time IS NULL;";

        $opnam = Yii::app()
            ->db->createCommand($q)
            ->queryRow();

        if ($opnam) {
            $opnam2 = TOpnam::model()->findByAttributes(["id" => $opnam["id"]]);

            if (is_null($opnam2->unlocked_time)) {
                $opnam2->unlocked_time = date("Y-m-d H:i:s");
            }

            if ($opnam2->save()) {
                $response = [
                    "status" => true,
                    "message" => "Active Opnam Found!",
                    "data" => $opnam,
                ];
            } else {
                $response = [
                    "status" => false,
                    "message" => "Failed to start opnam!",
                    "data" => $opnam,
                ];
            }

            return $response;
        } else {
            $response = [
                "status" => false,
                "message" => "No Active Opnam",
                "data" => $opnam,
            ];

            return $response;
        }
    }
}
