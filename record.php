<?php
$recordsFile = 'record.json';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($recordsFile)) {
        echo file_get_contents($recordsFile);
    } else {
        echo json_encode([]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON non valido']);
        exit();
    }
    if (file_exists($recordsFile)) {
        $recordsJson = file_get_contents($recordsFile);
        $records = json_decode($recordsJson, true);
        if (!is_array($records)) $records = [];
    } else {
        $records = [];
    }
    $records[] = $data;
    if (file_put_contents($recordsFile, json_encode($records, JSON_PRETTY_PRINT))) {
        echo json_encode(['message' => 'Record salvato con successo']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Errore nel salvataggio del record']);
    }
}
?>
