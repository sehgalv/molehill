<?php

$json_string = json_encode($_REQUEST);

$table = htmlentities($_REQUEST["Table"]);
$prod_id = htmlentities($_REQUEST["ProdID"]);
$title = htmlentities($_REQUEST["Title"]);
$categ = htmlentities($_REQUEST["Category"]);
$d_unit = htmlentities($_REQUEST["D_Units"]);
$d_values = htmlentities($_REQUEST["D_Values"]);
$w_unit = htmlentities($_REQUEST["W_Units"]);
$w_value = htmlentities($_REQUEST["W_Value"]);
$url = htmlentities($_REQUEST["url"]);

$d_values = explode(",", $d_values);

$prod_id_name = '';

$connection = mysqli_connect("localhost", "root", "", "molehill_test");
if (!$connection) {
    echo "Error: Unable to connect to MySQL." . PHP_EOL;
    echo "Debugging errno: " . mysqli_connect_errno() . PHP_EOL;
    echo "Debugging error: " . mysqli_connect_error() . PHP_EOL;
}

$sql_string = '';
switch ($table) {
    case 'amazon_test': $sql_string = $table . ' (ASIN'; break;
    case 'walmart_test': $sql_string = $table . ' (walmart_id'; break;
}

$query = mysqli_query($connection,
    "INSERT INTO " . $sql_string . ",weight,d1,d2,d3,category,title,url) VALUES ('" .
    $prod_id . "'," .
    $w_value . "," .
    $d_values[0] . "," .
    $d_values[1] . "," .
    $d_values[2] . ",'" .
    $categ . "','" .
    $title . "','" .
    $url . "')");

echo $connection->affected_rows;

?>
