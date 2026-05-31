const appConfig = JSON.parse(document.getElementById("app").dataset.gameConfig);
const engine = new GameEngine(window.CIVITAS_DATA);

const els = {
  eraLabel: document.getElementById("eraLabel"),
  resourceBar: document.getElementById("resourceBar"),
  mapGrid: document.getElementById("mapGrid"),
  queueBar: document.getElementById("queueBar"),
  settlementName: document.getElementById("settlementName"),
  eventLog: document.getElementById("eventLog"),
  overview: document.getElementById("overviewPanel"),
  buildings: document.getElementById("buildingsPanel"),
  technology: document.getElementById("technologyPanel"),
  objectives: document.getElementById("objectivesPanel"),
  settings: document.getElementById("settingsPanel"),
  dialog: document.getElementById("newGameDialog"),
  form: document.getElementById("newGameForm"),
  speed: document.getElementById("speedControl")
};

let selectedTileId = 0;

document.querySelector(".tabs").addEventListener("click", (event) => {
  const button = event.target.closest(".tab-button");
  if (!button) return;
  document.querySelectorAll(".tab-button").forEach((item) => item.classList.remove("active"));
  document.querySelectorAll(".panel").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  document.getElementById(`${button.dataset.panel}Panel`).classList.add("active");
});

document.getElementById("newGameButton").addEventListener("click", () => els.dialog.showModal());
els.speed.addEventListener("change", () => engine.setSpeed(els.speed.value));
els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  engine.newGame({
    name: document.getElementById("configName").value.trim() || "Aldea Nova",
    difficulty: document.getElementById("configDifficulty").value,
    resourceMode: document.getElementById("configResourceMode").value,
    goal: document.getElementById("configGoal").value
  });
  els.dialog.close();
});

function fmt(value) {
  return Math.floor(value).toLocaleString("ca-ES");
}

function fmtRate(value) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}/s`;
}

function costText(cost) {
  return Object.entries(cost || {})
    .map(([key, value]) => `${window.CIVITAS_DATA.resources[key]?.label || key}: ${fmt(value)}`)
    .join(" · ");
}

function render(state) {
  const era = engine.getEra();
  const rates = engine.productionRates();
  els.eraLabel.textContent = era.label;
  els.settlementName.textContent = state.name;
  els.eventLog.textContent = state.log;

  els.resourceBar.innerHTML = Object.entries(window.CIVITAS_DATA.resources).map(([key, resource]) => `
    <div class="resource-pill ${key}">
      <span class="resource-icon ${resource.icon}"></span>
      <span>${resource.label}</span>
      <strong>${fmt(state.resources[key] || 0)}</strong>
      <small>${fmtRate(rates[key] || 0)}</small>
    </div>
  `).join("");

  renderMap(state);
  renderQueue(state);
  renderOverview(state, rates);
  renderBuildings(state);
  renderTechnology(state);
  renderObjectives(state);
  renderSettings(state);
}

function renderMap(state) {
  els.mapGrid.innerHTML = state.map.map((tile) => {
    const names = tile.types.map((type) => window.CIVITAS_DATA.tileTypes[type].label).join(" + ");
    const classes = tile.types.join(" ");
    const reserve = tile.reserve === null ? "∞" : fmt(tile.reserve);
    return `
      <button class="tile ${classes} ${tile.id === selectedTileId ? "selected" : ""}" data-tile="${tile.id}" style="--richness:${tile.richness}">
        <span class="tile-types">${names}</span>
        <span class="tile-meta">Niv. ${tile.development} · ${reserve}</span>
      </button>
    `;
  }).join("");

  els.mapGrid.querySelectorAll(".tile").forEach((tileButton) => {
    tileButton.addEventListener("click", () => {
      selectedTileId = Number(tileButton.dataset.tile);
      render(engine.state);
    });
  });
}

function renderQueue(state) {
  if (!state.queue.length) {
    els.queueBar.innerHTML = `<div class="empty-state">No hi ha accions en curs. Assigna treballadors a edificis, recerca o caselles.</div>`;
    return;
  }
  els.queueBar.innerHTML = state.queue.map((item) => {
    const progress = Math.max(0, Math.min(100, 100 - (item.remaining / item.total) * 100));
    return `
      <div class="queue-item">
        <div>
          <strong>${item.label}</strong>
          <small>${item.workers} treballadors · ${Math.ceil(item.remaining)}s</small>
        </div>
        <span class="progress"><i style="width:${progress}%"></i></span>
      </div>
    `;
  }).join("");
}

function renderOverview(state, rates) {
  const selectedTile = state.map.find((tile) => tile.id === selectedTileId);
  const freeWorkers = engine.freeWorkers();
  els.overview.innerHTML = `
    <h2>Estat</h2>
    <div class="metric-grid">
      <div><span>Poblacio</span><strong>${state.population}/${state.populationCap}</strong></div>
      <div><span>Treball lliure</span><strong>${freeWorkers}</strong></div>
      <div><span>Moral</span><strong>${fmt(state.morale)}%</strong></div>
      <div><span>Era</span><strong>${engine.getEra().label}</strong></div>
    </div>
    <h3>Casella seleccionada</h3>
    <div class="tile-card">
      <strong>${selectedTile.types.map((type) => window.CIVITAS_DATA.tileTypes[type].label).join(" + ")}</strong>
      <p>Riquesa ${selectedTile.richness.toFixed(1)} · Desenvolupament ${selectedTile.development}</p>
      <p>Reserva: ${selectedTile.reserve === null ? "il.limitada" : fmt(selectedTile.reserve)}</p>
      <button class="primary-button full" id="developTileButton">Millorar casella</button>
    </div>
    <h3>Produccio neta</h3>
    <div class="rate-list">
      ${Object.entries(rates).map(([key, value]) => `<span>${window.CIVITAS_DATA.resources[key]?.label || key}</span><strong>${fmtRate(value)}</strong>`).join("")}
    </div>
  `;
  document.getElementById("developTileButton").addEventListener("click", () => engine.developTile(selectedTileId));
}

function renderBuildings(state) {
  els.buildings.innerHTML = `<h2>Edificis</h2>` + Object.entries(window.CIVITAS_DATA.buildings).map(([id, building]) => {
    const level = state.buildings[id] || 0;
    const locked = !engine.hasRequirements(building.requires);
    const maxed = level >= building.maxLevel;
    const cost = engine.scaledCost(building.cost, level);
    const canStart = !locked && !maxed && engine.canAfford(cost) && engine.freeWorkers() >= building.workers;
    return `
      <article class="action-card ${locked ? "locked" : ""}">
        <div>
          <h3>${building.label} <span>Niv. ${level}/${building.maxLevel}</span></h3>
          <p>${building.description}</p>
          <small>${locked ? "Requereix: " + building.requires.join(", ") : costText(cost)}</small>
        </div>
        <button data-build="${id}" ${canStart ? "" : "disabled"}>Construir</button>
      </article>
    `;
  }).join("");

  els.buildings.querySelectorAll("[data-build]").forEach((button) => {
    button.addEventListener("click", () => engine.build(button.dataset.build));
  });
}

function renderTechnology(state) {
  els.technology.innerHTML = `<h2>Arbre inicial</h2>` + Object.entries(window.CIVITAS_DATA.technologies).map(([id, technology]) => {
    const done = state.technologies.includes(id);
    const locked = !engine.hasRequirements(technology.requires);
    const canStart = !done && !locked && engine.canAfford(technology.cost) && engine.freeWorkers() >= technology.workers;
    return `
      <article class="tech-node ${done ? "done" : ""} ${locked ? "locked" : ""}">
        <div>
          <h3>${technology.label}</h3>
          <p>${technology.description}</p>
          <small>${done ? "Assolit" : locked ? "Requereix: " + technology.requires.join(", ") : costText(technology.cost)}</small>
        </div>
        <button data-tech="${id}" ${canStart ? "" : "disabled"}>${done ? "Fet" : "Investigar"}</button>
      </article>
    `;
  }).join("");

  els.technology.querySelectorAll("[data-tech]").forEach((button) => {
    button.addEventListener("click", () => engine.research(button.dataset.tech));
  });
}

function renderObjectives(state) {
  const era = engine.getEra();
  const goal = era.unlockGoal || {};
  const techList = (goal.technologies || []).map((id) => {
    const done = state.technologies.includes(id);
    return `<li class="${done ? "done" : ""}">${window.CIVITAS_DATA.technologies[id]?.label || id}</li>`;
  }).join("");
  const buildingList = Object.entries(goal.buildings || {}).map(([id, level]) => {
    const done = (state.buildings[id] || 0) >= level;
    return `<li class="${done ? "done" : ""}">${window.CIVITAS_DATA.buildings[id]?.label || id} nivell ${level}</li>`;
  }).join("");

  els.objectives.innerHTML = `
    <h2>Objectius d'era</h2>
    <p>${era.description}</p>
    ${goal.population ? `
      <ul class="objective-list">
        <li class="${state.population >= goal.population ? "done" : ""}">Poblacio ${state.population}/${goal.population}</li>
        ${techList}
        ${buildingList}
      </ul>
    ` : `<div class="empty-state">Aquesta era encara esta preparada com a expansio de contingut.</div>`}
  `;
}

function renderSettings(state) {
  els.settings.innerHTML = `
    <h2>Partida</h2>
    <div class="settings-list">
      <span>Versio</span><strong>${appConfig.app.version}</strong>
      <span>Dificultat</span><strong>${state.difficulty}</strong>
      <span>Recursos</span><strong>${state.resourceMode === "finite" ? "Limitats" : "Il.limitats"}</strong>
      <span>Objectiu</span><strong>${state.goal}</strong>
      <span>Guardat</span><strong>LocalStorage</strong>
    </div>
    <button class="danger-button full" id="resetSaveButton">Esborrar guardat local</button>
  `;
  document.getElementById("resetSaveButton").addEventListener("click", () => {
    localStorage.removeItem("chronos-civitas-state");
    engine.newGame();
  });
}

engine.subscribe(render);
engine.load();
engine.start();
