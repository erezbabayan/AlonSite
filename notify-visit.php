<?php
// Lightweight visit-notification beacon. Embedded as a 1x1 tracking pixel
// near the top of every page (see the <img src="notify-visit.php?page=...">
// tag right after <body>). Emails the site owner on every single hit — no
// dedup or bot-filtering, by design: the owner asked to be notified of
// every visit, however frequent.
//
// Requires PHP + a working mail() transport on the host. This repo's local
// dev server (server.js) is plain Node and cannot execute this file —
// it only works once deployed to real PHP hosting.

$to = "roeygol@gmail.com, erezbabayan@gmail.com";

function clean_header_value($value, $maxLength) {
    $value = (string) $value;
    $value = preg_replace("/[\r\n]+/", " ", $value);
    return mb_substr(trim($value), 0, $maxLength);
}

$page = isset($_GET["page"]) ? clean_header_value($_GET["page"], 100) : "unknown";
$referrer = isset($_SERVER["HTTP_REFERER"]) ? clean_header_value($_SERVER["HTTP_REFERER"], 300) : "-";
$userAgent = isset($_SERVER["HTTP_USER_AGENT"]) ? clean_header_value($_SERVER["HTTP_USER_AGENT"], 300) : "-";
$ip = isset($_SERVER["REMOTE_ADDR"]) ? $_SERVER["REMOTE_ADDR"] : "-";
$time = date("Y-m-d H:i:s");

$subject = "=?UTF-8?B?" . base64_encode("כניסה חדשה לאתר אלון") . "?=";

$body = "מישהו נכנס לאתר ההנצחה של אלון.\n\n"
    . "דף: {$page}\n"
    . "זמן: {$time}\n"
    . "מפנה (referrer): {$referrer}\n"
    . "דפדפן: {$userAgent}\n"
    . "IP: {$ip}\n";

$domain = isset($_SERVER["SERVER_NAME"]) ? $_SERVER["SERVER_NAME"] : "alonsite.local";
$headers = "From: no-reply@{$domain}\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n";

@mail($to, $subject, $body, $headers);

// Always respond with a real 1x1 transparent GIF so the <img> beacon never
// shows a broken-image icon, regardless of whether the mail() call above
// succeeded.
header("Content-Type: image/gif");
header("Cache-Control: no-store, no-cache, must-revalidate");
echo base64_decode("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==");
