<?php
/**
 * Poptávkový formulář Pension 48.
 * Validace, honeypot, časová pojistka a odeslání přes SMTP (PHPMailer).
 * Přihlašovací údaje jsou v poptavka-config.php (mimo Git, nahrává se ručně).
 */
declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

header('X-Robots-Tag: noindex');
$ajax = ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch';

function out(bool $ok, string $msg, int $code, bool $ajax): never
{
    http_response_code($code);
    if ($ajax) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'error' => $ok ? null : $msg], JSON_UNESCAPED_UNICODE);
    } else {
        header('Content-Type: text/html; charset=utf-8');
        $m = htmlspecialchars($msg, ENT_QUOTES);
        echo '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            . '<title>Pension 48</title><body style="font-family:system-ui;max-width:36rem;margin:3rem auto;padding:0 1rem">'
            . "<p>$m</p><p><a href=\"/\">Pension 48</a></p>";
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    out(false, 'Method not allowed', 405, $ajax);
}

$lang = in_array($_POST['lang'] ?? '', ['cs', 'en', 'de'], true) ? $_POST['lang'] : 'cs';
$msgs = [
    'cs' => ['ok' => 'Děkujeme, poptávka byla odeslána.', 'invalid' => 'Vyplňte prosím příjezd, odjezd, jméno a e-mail nebo telefon.', 'err' => 'Odeslání se nepodařilo. Zkuste to prosím znovu, nebo nám zavolejte.'],
    'en' => ['ok' => 'Thank you, your enquiry has been sent.', 'invalid' => 'Please fill in arrival, departure, your name and an e-mail or phone number.', 'err' => 'Sending failed. Please try again or call us.'],
    'de' => ['ok' => 'Vielen Dank, Ihre Anfrage wurde gesendet.', 'invalid' => 'Bitte geben Sie An- und Abreise, Ihren Namen sowie E-Mail oder Telefon an.', 'err' => 'Das Senden ist fehlgeschlagen. Bitte versuchen Sie es erneut oder rufen Sie uns an.'],
][$lang];

// Honeypot a časová pojistka: robotovi předstíráme úspěch
$ts = (int) ($_POST['ts'] ?? 0) / 1000;
$cfgFile = is_file(__DIR__ . '/poptavka-config.php') ? __DIR__ . '/poptavka-config.php' : __DIR__ . '/../poptavka-config.php';
$cfg = is_file($cfgFile) ? require $cfgFile : null;
$minSec = (int) ($cfg['min_seconds'] ?? 3);
if (trim((string) ($_POST['web'] ?? '')) !== '' || ($ts > 0 && time() - $ts < $minSec)) {
    out(true, $msgs['ok'], 200, $ajax);
}

$clean = static function (string $k, int $max = 200): string {
    $v = (string) ($_POST[$k] ?? '');
    $v = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '');
    return mb_substr($v, 0, $max);
};
$noLines = static fn (string $s): string => preg_replace('/[\r\n]+/', ' ', $s) ?? '';

$first = $noLines($clean('first_name', 80));
$last = $noLines($clean('last_name', 80));
$phone = $noLines($clean('phone', 40));
$email = $noLines($clean('email', 120));
$arrival = $clean('arrival', 10);
$departure = $clean('departure', 10);
$adults = max(1, min(30, (int) ($_POST['adults'] ?? 1)));
$kids = max(0, min(30, (int) ($_POST['kids'] ?? 0)));
$dog = ['none' => 'bez psa', 'small' => 'pes do 10 kg', 'large' => 'pes nad 10 kg'][$_POST['dog'] ?? 'none'] ?? 'bez psa';
$message = $clean('message', 3000);
$estimate = $noLines($clean('estimate', 300));

$dateOk = static fn (string $d): bool => (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) && checkdate((int) substr($d, 5, 2), (int) substr($d, 8, 2), (int) substr($d, 0, 4));
$emailOk = $email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
if ($first === '' || !$dateOk($arrival) || !$dateOk($departure) || $departure <= $arrival || !$emailOk || ($email === '' && $phone === '')) {
    out(false, $msgs['invalid'], 422, $ajax);
}
if (!$cfg) {
    error_log('poptavka.php: chybí poptavka-config.php');
    out(false, $msgs['err'], 500, $ajax);
}

$body = "Nová poptávka z webu pension48.cz\n\n"
    . "Jméno: $first $last\nE-mail: " . ($email ?: '-') . "\nTelefon: " . ($phone ?: '-') . "\n\n"
    . "Příjezd: $arrival\nOdjezd: $departure\nDospělí: $adults\nDěti 2–10 let: $kids\nPes: $dog\n\n"
    . 'Orientační cena (spočítal web, pouze odhad): ' . ($estimate ?: '-') . "\n\n"
    . "Zpráva:\n" . ($message ?: '-') . "\n\nJazyk webu: $lang\n";

try {
    require __DIR__ . '/_mail/Exception.php';
    require __DIR__ . '/_mail/PHPMailer.php';
    require __DIR__ . '/_mail/SMTP.php';
    $m = new PHPMailer(true);
    $m->CharSet = 'UTF-8';
    $m->isSMTP();
    $m->Host = $cfg['smtp_host'];
    $m->Port = (int) $cfg['smtp_port'];
    $m->SMTPAuth = true;
    $m->Username = $cfg['smtp_user'];
    $m->Password = $cfg['smtp_pass'];
    $m->SMTPSecure = $cfg['smtp_secure'] === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
    $m->setFrom($cfg['from_email'], $cfg['from_name']);
    $m->addAddress($cfg['to_email']);
    if ($email !== '') {
        $m->addReplyTo($email, trim("$first $last"));
    }
    $m->Subject = "Poptávka $arrival – $departure ($first $last)";
    $m->Body = $body;
    $m->send();
} catch (Exception $e) {
    error_log('poptavka.php: ' . $e->getMessage());
    out(false, $msgs['err'], 500, $ajax);
}
out(true, $msgs['ok'], 200, $ajax);
