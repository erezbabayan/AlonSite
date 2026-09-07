<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(204);
  exit;
}

$dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . "data";
$file = $dir . DIRECTORY_SEPARATOR . "candles.json";
if (!is_dir($dir)) {
  mkdir($dir, 0755, true);
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
  $raw = is_file($file) ? file_get_contents($file) : "[]";
  $data = json_decode($raw, true);
  echo json_encode(is_array($data) ? $data : array(), JSON_UNESCAPED_UNICODE);
  exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(array("error" => "method not allowed"));
  exit;
}

$body = json_decode(file_get_contents("php://input"), true);
$name = isset($body["name"]) ? trim($body["name"]) : "";
$message = isset($body["message"]) ? trim($body["message"]) : "";
if ($name === "") {
  http_response_code(400);
  echo json_encode(array("error" => "name is required"));
  exit;
}

$name = function_exists("mb_substr") ? mb_substr($name, 0, 200) : substr($name, 0, 200);
$message = function_exists("mb_substr") ? mb_substr($message, 0, 2000) : substr($message, 0, 2000);

$fp = fopen($file, "c+");
if (!$fp) {
  http_response_code(500);
  echo json_encode(array("error" => "cannot write"));
  exit;
}

flock($fp, LOCK_EX);
$raw = stream_get_contents($fp);
$candles = json_decode($raw, true);
if (!is_array($candles)) {
  $candles = array();
}
$entry = array(
  "name" => $name,
  "message" => $message,
  "date" => gmdate("c"),
);
$candles[] = $entry;
rewind($fp);
ftruncate($fp, 0);
fwrite($fp, json_encode($candles, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

http_response_code(201);
echo json_encode($entry, JSON_UNESCAPED_UNICODE);
