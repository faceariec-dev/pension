<?php
// VZOR. Zkopírujte jako poptavka-config.php, vyplňte a nahrajte ručně (WinSCP) vedle poptavka.php
// (nebo o úroveň výš, mimo veřejnou složku). Soubor NEPATŘÍ do Gitu a nasazení ho nepřepíše.
return [
    'smtp_host'   => 'smtp.forpsi.com',            // ověřte v administraci Forpsi (pošta)
    'smtp_port'   => 465,
    'smtp_secure' => 'ssl',                        // 'ssl' (465) nebo 'tls' (587)
    'smtp_user'   => 'web@pension48.cz',           // schránka na doméně pension48.cz
    'smtp_pass'   => 'DOPLNIT-HESLO',
    'from_email'  => 'web@pension48.cz',           // musí patřit k doméně / schránce
    'from_name'   => 'Web Pension 48',
    'to_email'    => 'pension48@centrum.cz',
    'min_seconds' => 3,                            // rychlejší odeslání se bere jako robot
];
