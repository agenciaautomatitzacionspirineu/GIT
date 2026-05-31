<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$payload = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($payload)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

$_SESSION['game_state'] = $payload;

echo json_encode([
    'ok' => true,
    'savedAt' => gmdate('c'),
]);
