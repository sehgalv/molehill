<?php

// function for calculating carbon offset cost
function calc_offset_cost($weight, $d1, $d2, $d3) {
    return round(fmod(($d1/1000) * ($d2/1000) * ($d3/1000) * $weight, 1), 2);
}

// input from client
$asin = htmlentities($_REQUEST['ASIN']);

// pull data from DB
$connection = mysqli_connect('localhost', 'root', '', 'molehill_test');
if (!$connection) {
    echo 'Error: Unable to connect to MySQL' . PHP_EOL;
    echo 'Debugging error number: ' . mysqli_connect_errno() . PHP_EOL;
    echo 'Debugging error: ' . mysqli_connect_error() . PHP_EOL;
}
$query = mysqli_query($connection,
    "SELECT * FROM amazon_test WHERE ASIN = '" . $asin . "'");

// send calculation result client
if ($query) {
    $data = $query->fetch_object();
    echo calc_offset_cost($data->weight, $data->d1, $data->d2, $data->d3);
} else {
    echo 'query failed';
}

?>
