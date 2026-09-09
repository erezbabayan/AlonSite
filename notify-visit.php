<?php
// Lightweight visit-notification beacon. Embedded as a 1x1 tracking pixel
// near the top of every page (see the <img src="notify-visit.php?page=...">
// tag right after <body>). Emails the site owner once per visit — clicking
// between pages of the site within $visitWindowSeconds does NOT re-email,
// but coming back even a few minutes later counts as a new visit and does.
// Two dedup layers, both scoped to that same short window, because relying
// on either alone doesn't hold up in the field:
//   1. A browser cookie (`alon_visited`, storing the last-visit time and
//      expiring after $visitWindowSeconds) — cheap, but some browsers/
//      privacy extensions strip Set-Cookie from 1x1-pixel-shaped responses
//      like this one, which made every single page navigation re-send the
//      email even seconds apart.
//   2. A server-side IP + time-window record (data/visits.json) — the real
//      backstop. If this IP was seen within $visitWindowSeconds, skip,
//      regardless of whether the cookie survived.
//
// Requires PHP + a working mail() transport on the host. This repo's local
// dev server (server.js) is plain Node and cannot execute this file —
// it only works once deployed to real PHP hosting.

$to = "roeygol@gmail.com, erezbabayan@gmail.com";
// Deliberately short: only meant to absorb the handful of seconds it takes
// to click from one page to the next on the site. A visitor coming back
// even a few minutes later (e.g. 5 min) is a new visit and should email again.
$visitWindowSeconds = 60;

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

// Date/time + page/IP in the subject line (not just the body) so each
// notification is distinguishable at a glance in an inbox list, without
// opening the email.
$subjectText = "התבצעה כניסה חדשה לאתר ההנצחה של אלון בביאן - {$time} | דף: {$page} | IP: {$ip}";
$subject = "=?UTF-8?B?" . base64_encode($subjectText) . "?=";

function h($value) {
    return htmlspecialchars((string) $value, ENT_QUOTES, "UTF-8");
}

$ipLinksHtml = "";
if ($ip !== "-") {
    $ipForUrl = rawurlencode($ip);
    $ipLinksHtml = '<tr><td style="padding:14px 0 0;" colspan="2">'
        . '<a href="https://mxtoolbox.com/SuperTool.aspx?action=ptr%3a' . $ipForUrl . '&run=toolpage" style="display:inline-block;margin-inline-end:10px;padding:8px 14px;background:#eef0f2;color:#1A2E44;border-radius:8px;font-size:13px;text-decoration:none;">בדיקת IP (MXToolbox)</a>'
        . '<a href="https://whatismyipaddress.com/ip/' . $ipForUrl . '" style="display:inline-block;padding:8px 14px;background:#eef0f2;color:#1A2E44;border-radius:8px;font-size:13px;text-decoration:none;">מיקום גיאוגרפי (WhatIsMyIPAddress)</a>'
        . '</td></tr>';
}

$body = '<!DOCTYPE html><html dir="rtl" lang="he"><body style="margin:0;padding:0;background:#eef0f2;font-family:Arial, Helvetica, sans-serif;">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f2;padding:24px 0;"><tr><td align="center">'
    . '<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;">'
    . '<tr><td style="background:#1A2E44;padding:20px 24px;"><span style="color:#ffffff;font-size:17px;font-weight:bold;">כניסה חדשה לאתר ההנצחה של אלון בביאן</span></td></tr>'
    . '<tr><td style="padding:24px;">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#1A2E44;border-collapse:collapse;">'
    . '<tr><td style="padding:6px 0;color:#585f65;width:90px;vertical-align:top;">דף</td><td style="padding:6px 0;font-weight:bold;">' . h($page) . '</td></tr>'
    . '<tr><td style="padding:6px 0;color:#585f65;vertical-align:top;">זמן</td><td style="padding:6px 0;">' . h($time) . '</td></tr>'
    . '<tr><td style="padding:6px 0;color:#585f65;vertical-align:top;">מפנה</td><td style="padding:6px 0;word-break:break-all;">' . h($referrer) . '</td></tr>'
    . '<tr><td style="padding:6px 0;color:#585f65;vertical-align:top;">דפדפן</td><td style="padding:6px 0;word-break:break-all;">' . h($userAgent) . '</td></tr>'
    . '<tr><td style="padding:6px 0;color:#585f65;vertical-align:top;">IP</td><td style="padding:6px 0;font-weight:bold;">' . h($ip) . '</td></tr>'
    . $ipLinksHtml
    . '</table>'
    . '</td></tr>'
    . '</table>'
    . '</td></tr></table>'
    . '</body></html>';

$domain = isset($_SERVER["SERVER_NAME"]) ? clean_header_value($_SERVER["SERVER_NAME"], 255) : "alonsite.local";
$headers = "From: no-reply@{$domain}\r\n"
    . "Content-Type: text/html; charset=UTF-8\r\n";

$now = time();
$cookieLastVisit = isset($_COOKIE["alon_visited"]) ? (int) $_COOKIE["alon_visited"] : 0;
$recentByCookie = ($now - $cookieLastVisit) < $visitWindowSeconds;
setcookie("alon_visited", (string) $now, $now + $visitWindowSeconds, "/");

$recentlySeen = false;
if ($ip !== "-") {
    $dataDir = __DIR__ . DIRECTORY_SEPARATOR . "data";
    $visitsFile = $dataDir . DIRECTORY_SEPARATOR . "visits.json";
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0755, true);
    }

    $fp = @fopen($visitsFile, "c+");
    if ($fp) {
        flock($fp, LOCK_EX);
        $raw = stream_get_contents($fp);
        $visits = json_decode($raw, true);
        if (!is_array($visits)) {
            $visits = array();
        }

        $lastSeen = isset($visits[$ip]) ? (int) $visits[$ip] : 0;
        $recentlySeen = ($now - $lastSeen) < $visitWindowSeconds;

        // Prune stale entries so the file doesn't grow forever.
        foreach ($visits as $seenIp => $seenAt) {
            if (($now - (int) $seenAt) >= $visitWindowSeconds) {
                unset($visits[$seenIp]);
            }
        }
        $visits[$ip] = $now;

        rewind($fp);
        ftruncate($fp, 0);
        fwrite($fp, json_encode($visits, JSON_UNESCAPED_UNICODE));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}

$mailSent = null;
if (!$recentByCookie && !$recentlySeen) {
    $mailSent = @mail($to, $subject, $body, $headers);
}

// Temporary diagnostic log to figure out why an expected email didn't go
// out. Safe to delete this block (and data/notify-debug.log) once resolved.
@file_put_contents(
    __DIR__ . DIRECTORY_SEPARATOR . "data" . DIRECTORY_SEPARATOR . "notify-debug.log",
    sprintf(
        "[%s] ip=%s page=%s recentByCookie=%s recentlySeen=%s mailAttempted=%s mailSent=%s lastError=%s\n",
        $time,
        $ip,
        $page,
        $recentByCookie ? "yes" : "no",
        $recentlySeen ? "yes" : "no",
        $mailSent === null ? "no" : "yes",
        $mailSent === null ? "-" : ($mailSent ? "yes" : "no"),
        $mailSent === false ? json_encode(error_get_last()) : "-"
    ),
    FILE_APPEND
);

// Always respond with a real 1x1 transparent GIF so the <img> beacon never
// shows a broken-image icon, regardless of whether the mail() call above
// succeeded.
header("Content-Type: image/gif");
header("Cache-Control: no-store, no-cache, must-revalidate");
echo base64_decode("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==");
