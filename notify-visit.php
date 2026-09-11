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
// Sends via Resend's HTTP API (see notify-visit.secrets.example.php for the
// required config) since this host's PHP mail() reports success without
// actually delivering; falls back to mail() if Resend isn't configured or
// its call fails. This repo's local dev server (server.js) is plain Node
// and cannot execute this file — it only works once deployed to real PHP
// hosting.

$to = "roeygol@gmail.com, erezbabayan@gmail.com";
$toList = ["roeygol@gmail.com", "erezbabayan@gmail.com"];
// Deliberately short: only meant to absorb the handful of seconds it takes
// to click from one page to the next on the site. A visitor coming back
// even a few minutes later (e.g. 5 min) is a new visit and should email again.
$visitWindowSeconds = 60;

// PHP mail() on this host reports success (mailSent=yes in the debug log
// below) but Gmail silently drops the message — no bounce, no spam
// placement, it just never arrives. Same Resend account already wired up
// for the Cloudflare Worker migration (functions/_lib/email.js) sends
// through an authenticated HTTP API instead, which actually delivers.
// Falls back to mail() if notify-visit.secrets.php isn't present on the
// host yet, or if the Resend call itself fails.
$secretsFile = __DIR__ . DIRECTORY_SEPARATOR . "notify-visit.secrets.php";
$secrets = is_file($secretsFile) ? (include $secretsFile) : [];
$resendApiKey = getenv("RESEND_API_KEY") ?: ($secrets["RESEND_API_KEY"] ?? null);
$resendFrom = getenv("RESEND_FROM") ?: ($secrets["RESEND_FROM"] ?? null);

function send_via_resend($apiKey, $from, $to, $subject, $html, $text) {
    if (!$apiKey || !function_exists("curl_init")) {
        return false;
    }
    $payload = json_encode([
        "from" => $from ?: "AlonSite <onboarding@resend.dev>",
        "to" => $to,
        "subject" => $subject,
        "html" => $html,
        "text" => $text,
    ], JSON_UNESCAPED_UNICODE);

    $ch = curl_init("https://api.resend.com/emails");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer {$apiKey}",
            "Content-Type: application/json",
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
    ]);
    curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    return ["ok" => $status >= 200 && $status < 300, "status" => $status, "error" => $curlError];
}

function clean_header_value($value, $maxLength) {
    $value = (string) $value;
    $value = preg_replace("/[\r\n]+/", " ", $value);
    return mb_substr(trim($value), 0, $maxLength);
}

$page = isset($_GET["page"]) ? clean_header_value($_GET["page"], 100) : "unknown";
$referrer = isset($_SERVER["HTTP_REFERER"]) ? clean_header_value($_SERVER["HTTP_REFERER"], 300) : "-";
$userAgent = isset($_SERVER["HTTP_USER_AGENT"]) ? clean_header_value($_SERVER["HTTP_USER_AGENT"], 300) : "-";
$ip = isset($_SERVER["REMOTE_ADDR"]) ? $_SERVER["REMOTE_ADDR"] : "-";
// Explicit timezone rather than the host's default (which showed up 2-3
// hours behind real Israel time) — Israeli date convention is
// day.month.year, not ISO's year-month-day.
$nowDt = new DateTime("now", new DateTimeZone("Asia/Jerusalem"));
$time = $nowDt->format("d.m.Y, H:i:s");

// Date/time + page in the subject line (not just the body) so each
// notification is distinguishable at a glance in an inbox list, without
// opening the email.
$subjectText = "התבצעה כניסה חדשה לאתר ההנצחה של אלון בביאן - {$time} | דף: {$page}";
$subject = "=?UTF-8?B?" . base64_encode($subjectText) . "?=";

function h($value) {
    return htmlspecialchars((string) $value, ENT_QUOTES, "UTF-8");
}

// No Cloudflare `request.cf` here (this runs on plain PHP hosting, not
// behind the Worker), so this can only show what PHP itself has: page,
// time, referrer, device, IP. Matches the visual style of the Cloudflare
// Worker's version (functions/_lib/email.js) minus the geo/network chip.
function parse_device($ua) {
    if (!$ua || $ua === "-") return null;
    $os = "";
    if (stripos($ua, "iPad") !== false) $os = "iPad";
    elseif (stripos($ua, "iPhone") !== false) $os = "iPhone";
    elseif (stripos($ua, "Android") !== false) $os = "Android";
    elseif (stripos($ua, "Macintosh") !== false) $os = "Mac";
    elseif (stripos($ua, "Windows") !== false) $os = "Windows";
    elseif (stripos($ua, "Linux") !== false) $os = "Linux";

    $browser = "";
    if (preg_match('/Edg(A)?\//i', $ua)) $browser = "Edge";
    elseif (stripos($ua, "OPR/") !== false) $browser = "Opera";
    elseif (stripos($ua, "CriOS/") !== false) $browser = "Chrome";
    elseif (stripos($ua, "FxiOS/") !== false) $browser = "Firefox";
    elseif (stripos($ua, "Chrome/") !== false) $browser = "Chrome";
    elseif (stripos($ua, "Firefox/") !== false) $browser = "Firefox";
    elseif (preg_match('/Version\/.*Safari\//i', $ua)) $browser = "Safari";

    $parts = array_filter([$os, $browser]);
    return $parts ? implode(" · ", $parts) : null;
}

function hostname_of($url) {
    if (!$url || $url === "-") return null;
    $host = parse_url($url, PHP_URL_HOST);
    return $host ?: null;
}

// Every row/table/cell repeats dir="rtl" (as an HTML attribute, not just
// CSS) and explicit text-align — Gmail's sanitizer strips <html>/<body> and
// re-wraps the content, which loses a dir="rtl" set only at the top, so RTL
// has to be nailed down at each nested table for it to survive.
function h_row($label, $valueHtml) {
    // <bdi> isolates the value from the surrounding bidi context and forces
    // it to read as one RTL block, even when the value is mostly Latin (an
    // IP, a raw user-agent string) — without it, a value that happens to
    // start with a Latin character can flip the row to render left-aligned
    // in some clients, despite dir="rtl" elsewhere.
    return '<tr dir="rtl"><td dir="rtl" align="right" style="padding:7px 0;color:#585f65;width:74px;vertical-align:top;">' . h($label) . '</td>'
        . '<td dir="rtl" align="right" style="padding:7px 0;color:#1A2E44;vertical-align:top;line-height:1.6;">'
        . '<bdi dir="rtl" style="unicode-bidi:isolate;direction:rtl;">' . $valueHtml . '</bdi></td></tr>';
}

function h_chip($title, $rowsHtml, $extraHtml = "") {
    if (!$rowsHtml) return "";
    return '<tr><td style="padding:12px 32px 0;">'
        . '<table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" style="background:#e6e9ec;border-radius:12px;border-collapse:separate;">'
        . '<tr><td align="right" style="padding:18px 20px;">'
        . '<div style="font-family:\'Heebo\',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#7C8CA0;margin:0 0 12px;text-align:right;">' . h($title) . '</div>'
        . '<table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">' . $rowsHtml . '</table>'
        . $extraHtml
        . '</td></tr></table></td></tr>';
}

$referrerHost = hostname_of($referrer);
$device = parse_device($userAgent);

$visitRows = h_row("דף", "<b>" . h($page) . "</b>") . h_row("זמן", h($time));
if ($referrer !== "-") {
    $visitRows .= h_row(
        "מפנה",
        h($referrerHost ?: $referrer)
            . ($referrerHost ? '<div style="font-size:12px;color:#7c828a;word-break:break-all;margin-top:2px;">' . h($referrer) . '</div>' : "")
    );
}
$visitChip = h_chip("הביקור", $visitRows);

$deviceRows = h_row(
    "מכשיר",
    ($device ? h($device) . "<br/>" : "") . '<span style="font-size:12px;color:#7c828a;word-break:break-all;">' . h($userAgent) . '</span>'
);
$deviceRows .= h_row("IP", "<b>" . h($ip) . "</b>");
$deviceExtra = "";
if ($ip !== "-") {
    $ipForUrl = rawurlencode($ip);
    $deviceExtra = '<div dir="rtl" style="margin-top:12px;text-align:right;">'
        . '<a href="https://mxtoolbox.com/SuperTool.aspx?action=ptr%3a' . $ipForUrl . '&run=toolpage" style="display:inline-block;padding:9px 16px;background:#ffffff;color:#1A2E44;border-radius:999px;font-size:12px;font-weight:700;text-decoration:none;">בדיקת IP</a>'
        . '</div>';
}
$deviceChip = h_chip("מכשיר", $deviceRows, $deviceExtra);

$fontStack = "'Heebo',Arial,Helvetica,sans-serif";
$htmlBody = '<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"/>'
    . '<style>@import url(\'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap\');</style>'
    . '</head>'
    . '<body dir="rtl" style="margin:0;padding:0;background:#eef0f2;font-family:' . $fontStack . ';direction:rtl;">'
    . '<table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f2;padding:40px 16px;"><tr><td align="center">'
    . '<table role="presentation" dir="rtl" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;max-width:480px;box-shadow:0 20px 40px rgba(27,28,25,0.08);font-family:' . $fontStack . ';">'
    . '<tr><td style="height:4px;line-height:4px;font-size:0;background:#1A2E44;">&nbsp;</td></tr>'
    . '<tr><td align="right" style="padding:34px 32px 4px;">'
    . '<div style="font-family:' . $fontStack . ';font-size:12px;font-weight:700;letter-spacing:0.08em;color:#7C8CA0;margin:0 0 10px;text-align:right;">האתר של אלון בביאן</div>'
    . '<div style="font-family:' . $fontStack . ';font-size:25px;font-weight:800;color:#1A2E44;line-height:1.4;text-align:right;">כניסה חדשה לאתר ההנצחה</div>'
    . '</td></tr>'
    . $visitChip
    . $deviceChip
    . '<tr><td style="padding:26px 32px 24px;" align="right">'
    . '<div style="font-family:' . $fontStack . ';font-size:12px;color:#a7adb3;text-align:right;">אתר ההנצחה של סגן אלון אברהם-חי בביאן ז״ל</div>'
    . '</td></tr>'
    . '</table>'
    . '</td></tr></table>'
    . '</body></html>';

// U+200F (RLM) at the start of each line: plain-text clients auto-detect
// paragraph direction from the first strong character, and a line like
// "IP: 89.138.70.62" can otherwise get judged LTR since the visible first
// characters read as Latin/neutral.
$rlm = "\xE2\x80\x8F";
$plainBody = $rlm . "כניסה חדשה לאתר ההנצחה של אלון בביאן\n\n"
    . $rlm . "דף: {$page}\n"
    . $rlm . "זמן: {$time}\n"
    . ($referrer !== "-" ? $rlm . "מפנה: {$referrer}\n" : "")
    . $rlm . "מכשיר: " . ($device ? "{$device} — " : "") . "{$userAgent}\n"
    . $rlm . "IP: {$ip}\n";

// A bare HTML-only body (no MIME-Version, no plain-text alternative) is a
// classic spam-filter trigger: mail() still reports success because it
// handed the message to the local MTA, but receiving servers like Gmail
// can silently drop or spam-box it. Send a real multipart/alternative
// message instead so both a plain-text and HTML part are present.
$domain = isset($_SERVER["SERVER_NAME"]) ? clean_header_value($_SERVER["SERVER_NAME"], 255) : "alonsite.local";
$fromAddress = "no-reply@{$domain}";
$boundary = "alt-" . bin2hex(random_bytes(16));
$headers = "From: no-reply@{$domain}\r\n"
    . "MIME-Version: 1.0\r\n"
    . "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

$body = "--{$boundary}\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n"
    . "Content-Transfer-Encoding: 8bit\r\n\r\n"
    . $plainBody . "\r\n"
    . "--{$boundary}\r\n"
    . "Content-Type: text/html; charset=UTF-8\r\n"
    . "Content-Transfer-Encoding: 8bit\r\n\r\n"
    . $htmlBody . "\r\n"
    . "--{$boundary}--";

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

$sendMethod = "-";
$mailSent = null;
if (!$recentByCookie && !$recentlySeen) {
    // Resend's sandbox address (*.resend.dev) can only deliver to the
    // account owner's own email until a sending domain is verified — the
    // second recipient makes Resend reject the whole request in that case.
    // Drop back to both once RESEND_FROM points at a verified domain.
    $resendTo = (strpos((string) $resendFrom, "@resend.dev") !== false)
        ? ["roeygol@gmail.com"]
        : $toList;
    $resendResult = send_via_resend($resendApiKey, $resendFrom, $resendTo, $subjectText, $htmlBody, $plainBody);
    if ($resendResult && $resendResult["ok"]) {
        $sendMethod = "resend";
        $mailSent = true;
    } else {
        // No Resend key configured, or the Resend call itself failed —
        // fall back to mail() so a visit notification still has a chance
        // of going out rather than none at all.
        $sendMethod = "mail_fallback";
        $mailSent = @mail($to, $subject, $body, $headers, "-f{$fromAddress}");
    }
}

// Temporary diagnostic log to figure out why an expected email didn't go
// out. Safe to delete this block (and data/notify-debug.log) once resolved.
@file_put_contents(
    __DIR__ . DIRECTORY_SEPARATOR . "data" . DIRECTORY_SEPARATOR . "notify-debug.log",
    sprintf(
        "[%s] ip=%s page=%s recentByCookie=%s recentlySeen=%s mailAttempted=%s method=%s mailSent=%s resendStatus=%s lastError=%s\n",
        $time,
        $ip,
        $page,
        $recentByCookie ? "yes" : "no",
        $recentlySeen ? "yes" : "no",
        $mailSent === null ? "no" : "yes",
        $sendMethod,
        $mailSent === null ? "-" : ($mailSent ? "yes" : "no"),
        isset($resendResult) && $resendResult ? ($resendResult["status"] . " " . $resendResult["error"]) : "-",
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
