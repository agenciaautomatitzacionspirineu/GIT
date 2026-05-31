<?php
declare(strict_types=1);

return [
    'app' => [
        'name' => 'Chronos Civitas',
        'version' => '0.1.0',
    ],
    'database' => [
        'driver' => 'mysql',
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'database' => getenv('DB_DATABASE') ?: 'chronos_civitas',
        'username' => getenv('DB_USERNAME') ?: 'root',
        'password' => getenv('DB_PASSWORD') ?: '',
        'charset' => 'utf8mb4',
    ],
];
