<?php
declare(strict_types=1);

require_once __DIR__ . '/src/bootstrap.php';

$settings = require __DIR__ . '/config/game.php';
?>
<!DOCTYPE html>
<html lang="ca">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php echo htmlspecialchars($settings['app']['name'], ENT_QUOTES, 'UTF-8'); ?></title>
    <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
    <div id="app" class="game-shell" data-game-config="<?php echo e(json_encode($settings, JSON_UNESCAPED_UNICODE)); ?>">
        <header class="topbar">
            <div class="brand">
                <span class="brand-mark">C</span>
                <div>
                    <strong><?php echo e($settings['app']['name']); ?></strong>
                    <small id="eraLabel">Prehistoria</small>
                </div>
            </div>
            <div id="resourceBar" class="resource-bar" aria-label="Recursos principals"></div>
            <div class="clock-panel">
                <label for="speedControl">Velocitat</label>
                <select id="speedControl">
                    <option value="1">1x</option>
                    <option value="2">2x</option>
                    <option value="5" selected>5x</option>
                    <option value="10">10x</option>
                    <option value="25">25x</option>
                </select>
            </div>
        </header>

        <main class="layout">
            <aside class="side-panel" aria-label="Controls de ciutat">
                <nav class="tabs" aria-label="Seccions">
                    <button class="tab-button active" data-panel="overview">Ciutat</button>
                    <button class="tab-button" data-panel="buildings">Edificis</button>
                    <button class="tab-button" data-panel="technology">Tecnologia</button>
                    <button class="tab-button" data-panel="objectives">Objectius</button>
                    <button class="tab-button" data-panel="settings">Partida</button>
                </nav>

                <section id="overviewPanel" class="panel active"></section>
                <section id="buildingsPanel" class="panel"></section>
                <section id="technologyPanel" class="panel"></section>
                <section id="objectivesPanel" class="panel"></section>
                <section id="settingsPanel" class="panel"></section>
            </aside>

            <section class="world-stage" aria-label="Mapa de la ciutat">
                <div class="stage-header">
                    <div>
                        <h1 id="settlementName">Aldea Nova</h1>
                        <p id="eventLog">Comenca la partida i la comunitat busca estabilitat.</p>
                    </div>
                    <button id="newGameButton" class="primary-button">Nova partida</button>
                </div>
                <div id="mapGrid" class="map-grid" aria-label="Mapa 8 per 8"></div>
                <div id="queueBar" class="queue-bar" aria-label="Accions en curs"></div>
            </section>

            <aside id="detailPanel" class="detail-panel" aria-label="Detall de casella"></aside>
        </main>

        <dialog id="newGameDialog" class="modal">
            <form method="dialog" id="newGameForm">
                <div class="modal-head">
                    <h2>Configurar nova partida</h2>
                    <button class="icon-button" value="cancel" aria-label="Tancar">x</button>
                </div>
                <div class="form-grid">
                    <label>
                        Nom de la comunitat
                        <input id="configName" name="name" maxlength="32" value="Aldea Nova">
                    </label>
                    <label>
                        Dificultat
                        <select id="configDifficulty" name="difficulty">
                            <option value="calm">Tranquil</option>
                            <option value="balanced" selected>Equilibrat</option>
                            <option value="harsh">Dur</option>
                        </select>
                    </label>
                    <label>
                        Recursos del mapa
                        <select id="configResourceMode" name="resourceMode">
                            <option value="finite">Limitats</option>
                            <option value="infinite" selected>Il.limitats</option>
                        </select>
                    </label>
                    <label>
                        Objectiu inicial
                        <select id="configGoal" name="goal">
                            <option value="balanced" selected>Comunitat estable</option>
                            <option value="research">Descoberta rapida</option>
                            <option value="growth">Creixement poblacional</option>
                        </select>
                    </label>
                </div>
                <div class="modal-actions">
                    <button value="cancel">Cancel.lar</button>
                    <button id="startGameButton" class="primary-button" value="default">Comencar</button>
                </div>
            </form>
        </dialog>
    </div>
    <script src="assets/js/game-data.js"></script>
    <script src="assets/js/game-engine.js"></script>
    <script src="assets/js/ui.js"></script>
</body>
</html>
