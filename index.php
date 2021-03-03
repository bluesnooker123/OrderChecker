<?php

// echo "test";exit();

    header('Access-Control-Allow-Headers: *');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
	header('Access-Control-Max-Age: 2000');
	
	
    $store_hash = "shxhfy2z6";
    $auth = "d8ff88enlvmeagf9x1p0sumnv1kcqf0";
    $client = "g5hvag4wjfp3dwwdtijax4931fgnouz";

    $API_PATH = 'https://api.bigcommerce.com/stores/'.$store_hash;
    
    $headers = array(
        "accept: application/json",
        "content-type: application/json",
        "x-auth-client: ".$client,
        "x-auth-token: ".$auth
    );

    if(isset($_REQUEST["orderId"])){
        $orderId = $_REQUEST["orderId"];
        
        $url = $API_PATH."/v2/orders/".$orderId."/products?limit=250";
        
        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_CUSTOMREQUEST => "GET",
            CURLOPT_HTTPHEADER => $headers,
        ));    
        $response = curl_exec($curl);
        $err = curl_error($curl);    
        curl_close($curl);
    
        if ($err) {
            print_r(json_encode(array("err"=>$err, "status" => false )));
        } else {
            print_r(json_encode(array("data"=>$response, "status" => true )));
        }
    }

?>