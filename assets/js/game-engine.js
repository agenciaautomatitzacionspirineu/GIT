class GameEngine {
  constructor(data) {
    this.data = data;
    this.speed = 5;
    this.lastTick = performance.now();
    this.listeners = new Set();
    this.state = this.createNewState();
  }

  createNewState(options = {}) {
    const difficulty = options.difficulty || "balanced";
    const difficultyMap = {
      calm: { eventChance: 0.012, production: 1.18, consumption: 0.88 },
      balanced: { eventChance: 0.02, production: 1, consumption: 1 },
      harsh: { eventChance: 0.034, production: 0.88, consumption: 1.18 }
    };

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: options.name || "Aldea Nova",
      createdAt: Date.now(),
      difficulty,
      difficultyRules: difficultyMap[difficulty],
      resourceMode: options.resourceMode || "infinite",
      goal: options.goal || "balanced",
      eraIndex: 0,
      population: 12,
      populationCap: 18,
      morale: 74,
      resources: { food: 180, wood: 135, stone: 70, fiber: 55, knowledge: 8, safety: 36 },
      caps: { food: 420, wood: 360, stone: 360, fiber: 260, knowledge: 180, safety: 100 },
      buildings: { hearth: 1, gatherers: 1 },
      technologies: [],
      queue: [],
      activeEvent: null,
      eventCooldown: 30,
      log: "La comunitat s'ha assentat. Cal produir, guardar i aprendre.",
      map: this.createMap(options.resourceMode || "infinite")
    };
  }

  createMap(resourceMode) {
    const pattern = ["forest", "meadow", "quarry", "river", "hill"];
    return Array.from({ length: 64 }, (_, index) => {
      const x = index % 8;
      const y = Math.floor(index / 8);
      const primary = pattern[(x * 3 + y * 5 + index) % pattern.length];
      const secondary = pattern[(x + y * 2 + 2) % pattern.length];
      return {
        id: index,
        x,
        y,
        types: primary === secondary ? [primary] : [primary, secondary],
        richness: 0.7 + (((x + 1) * (y + 3)) % 7) / 10,
        reserve: resourceMode === "finite" ? 520 + ((index * 97) % 540) : null,
        development: 0
      };
    });
  }

  start() {
    this.lastTick = performance.now();
    window.setInterval(() => this.tick(), 250);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.state));
    this.persist();
  }

  persist() {
    localStorage.setItem("chronos-civitas-state", JSON.stringify(this.state));
  }

  load() {
    const saved = localStorage.getItem("chronos-civitas-state");
    if (!saved) return false;
    try {
      this.state = JSON.parse(saved);
      this.state.difficultyRules ||= { eventChance: 0.02, production: 1, consumption: 1 };
      this.notify();
      return true;
    } catch {
      return false;
    }
  }

  newGame(options) {
    this.state = this.createNewState(options);
    this.notify();
  }

  tick() {
    const now = performance.now();
    const elapsed = ((now - this.lastTick) / 1000) * this.speed;
    this.lastTick = now;
    if (elapsed <= 0) return;

    this.advanceQueue(elapsed);
    this.produce(elapsed);
    this.advanceEvent(elapsed);
    this.checkPopulation(elapsed);
    this.checkEraProgress();
    this.notify();
  }

  setSpeed(speed) {
    this.speed = Number(speed);
  }

  getEra() {
    return this.data.eras[this.state.eraIndex];
  }

  usedWorkers() {
    return this.state.queue.reduce((sum, item) => sum + item.workers, 0);
  }

  freeWorkers() {
    return Math.max(0, this.state.population - this.usedWorkers());
  }

  productionRates() {
    const rates = { food: 0.06, wood: 0.03, stone: 0.018, fiber: 0.018, knowledge: 0.012, safety: 0 };
    for (const tile of this.state.map) {
      if (this.state.resourceMode === "finite" && tile.reserve <= 0) continue;
      const tileWeight = (1 + tile.development * 0.08) * tile.richness / tile.types.length;
      for (const type of tile.types) {
        const definition = this.data.tileTypes[type];
        for (const [resource, value] of Object.entries(definition.yields)) {
          rates[resource] = (rates[resource] || 0) + value * tileWeight;
        }
      }
    }
    for (const [buildingId, level] of Object.entries(this.state.buildings)) {
      const effects = this.data.buildings[buildingId]?.effects || {};
      rates.food += (effects.foodRate || 0) * level;
      rates.wood += (effects.woodRate || 0) * level;
      rates.stone += (effects.stoneRate || 0) * level;
      rates.fiber += (effects.fiberRate || 0) * level;
      rates.knowledge += (effects.knowledgeRate || 0) * level;
      rates.safety += (effects.safety || 0) * 0.002 * level;
    }
    if (this.state.technologies.includes("tracking")) rates.food *= 1.12;
    if (this.state.technologies.includes("rituals")) rates.knowledge *= 1.18;
    if (this.state.activeEvent?.modifiers) {
      for (const [resource, modifier] of Object.entries(this.state.activeEvent.modifiers)) {
        rates[resource] = (rates[resource] || 0) * modifier;
      }
    }
    for (const key of Object.keys(rates)) {
      rates[key] *= this.state.difficultyRules.production;
    }
    return rates;
  }

  produce(seconds) {
    const rates = this.productionRates();
    const foodUseMultiplier = this.buildingEffect("foodUseMultiplier");
    const foodConsumption = this.state.population * 0.017 * this.state.difficultyRules.consumption * (1 + foodUseMultiplier);
    rates.food -= foodConsumption;

    for (const [resource, rate] of Object.entries(rates)) {
      this.addResource(resource, rate * seconds);
    }

    if (this.state.resourceMode === "finite") {
      const depletion = Math.max(0, rates.wood + rates.stone + rates.fiber + rates.food) * seconds * 0.18;
      for (const tile of this.state.map) {
        if (tile.reserve !== null && tile.reserve > 0) {
          tile.reserve = Math.max(0, tile.reserve - depletion / this.state.map.length);
        }
      }
    }
  }

  addResource(resource, amount) {
    const next = (this.state.resources[resource] || 0) + amount;
    this.state.resources[resource] = Math.max(0, Math.min(this.state.caps[resource] || 99999, next));
  }

  buildingEffect(effect) {
    return Object.entries(this.state.buildings).reduce((sum, [id, level]) => {
      return sum + ((this.data.buildings[id]?.effects?.[effect] || 0) * level);
    }, 0);
  }

  canAfford(cost) {
    return Object.entries(cost || {}).every(([resource, amount]) => (this.state.resources[resource] || 0) >= amount);
  }

  pay(cost) {
    for (const [resource, amount] of Object.entries(cost || {})) {
      this.state.resources[resource] -= amount;
    }
  }

  scaledCost(cost, level) {
    return Object.fromEntries(Object.entries(cost).map(([key, value]) => [key, Math.round(value * Math.pow(1.55, level))]));
  }

  hasRequirements(requirements = []) {
    return requirements.every((id) => this.state.technologies.includes(id));
  }

  build(buildingId) {
    const building = this.data.buildings[buildingId];
    const level = this.state.buildings[buildingId] || 0;
    if (!building || level >= building.maxLevel || !this.hasRequirements(building.requires)) return false;
    const cost = this.scaledCost(building.cost, level);
    if (!this.canAfford(cost) || this.freeWorkers() < building.workers) return false;
    this.pay(cost);
    this.state.queue.push({
      id: `build-${buildingId}-${Date.now()}`,
      type: "building",
      target: buildingId,
      label: `${building.label} ${level + 1}`,
      workers: building.workers,
      remaining: building.baseTime * Math.pow(1.18, level),
      total: building.baseTime * Math.pow(1.18, level)
    });
    this.state.log = `${building.label} s'ha posat en construccio.`;
    this.notify();
    return true;
  }

  research(technologyId) {
    const technology = this.data.technologies[technologyId];
    if (!technology || this.state.technologies.includes(technologyId) || !this.hasRequirements(technology.requires)) return false;
    if (!this.canAfford(technology.cost) || this.freeWorkers() < technology.workers) return false;
    this.pay(technology.cost);
    this.state.queue.push({
      id: `tech-${technologyId}-${Date.now()}`,
      type: "technology",
      target: technologyId,
      label: technology.label,
      workers: technology.workers,
      remaining: technology.time,
      total: technology.time
    });
    this.state.log = `La comunitat investiga: ${technology.label}.`;
    this.notify();
    return true;
  }

  developTile(tileId) {
    const tile = this.state.map.find((item) => item.id === tileId);
    if (!tile) return false;
    const cost = { food: 35 + tile.development * 20, wood: 30 + tile.development * 25, stone: 15 + tile.development * 15 };
    if (!this.canAfford(cost) || this.freeWorkers() < 2) return false;
    this.pay(cost);
    this.state.queue.push({
      id: `tile-${tileId}-${Date.now()}`,
      type: "tile",
      target: tileId,
      label: `Millora casella ${tileId + 1}`,
      workers: 2,
      remaining: 38 + tile.development * 18,
      total: 38 + tile.development * 18
    });
    this.state.log = `S'ha iniciat la millora d'una casella del mapa.`;
    this.notify();
    return true;
  }

  advanceQueue(seconds) {
    for (const item of [...this.state.queue]) {
      item.remaining -= seconds;
      if (item.remaining <= 0) {
        this.completeQueueItem(item);
        this.state.queue = this.state.queue.filter((queued) => queued.id !== item.id);
      }
    }
  }

  completeQueueItem(item) {
    if (item.type === "building") {
      this.state.buildings[item.target] = (this.state.buildings[item.target] || 0) + 1;
      this.applyBuildingCaps(item.target);
      this.state.log = `${this.data.buildings[item.target].label} ha pujat de nivell.`;
    }
    if (item.type === "technology") {
      this.state.technologies.push(item.target);
      this.state.log = `Descoberta assolida: ${this.data.technologies[item.target].label}.`;
    }
    if (item.type === "tile") {
      const tile = this.state.map.find((candidate) => candidate.id === item.target);
      if (tile) tile.development += 1;
      this.state.log = `Una casella produeix millor gracies a la nova organitzacio.`;
    }
  }

  applyBuildingCaps(buildingId) {
    const level = this.state.buildings[buildingId] || 0;
    const effects = this.data.buildings[buildingId]?.effects || {};
    if (effects.foodCap) this.state.caps.food += effects.foodCap;
    if (effects.materialCap) {
      this.state.caps.wood += effects.materialCap;
      this.state.caps.stone += effects.materialCap;
      this.state.caps.fiber += Math.round(effects.materialCap * 0.7);
    }
    if (buildingId === "hearth") this.state.populationCap += 2 + level;
    if (buildingId === "council") this.state.caps.knowledge += 160;
  }

  advanceEvent(seconds) {
    if (this.state.activeEvent) {
      this.state.activeEvent.remaining -= seconds;
      if (this.state.activeEvent.remaining <= 0) {
        this.state.log = `S'ha acabat: ${this.state.activeEvent.label}.`;
        this.state.activeEvent = null;
        this.state.eventCooldown = 40;
      }
      return;
    }
    this.state.eventCooldown -= seconds;
    if (this.state.eventCooldown <= 0 && Math.random() < this.state.difficultyRules.eventChance) {
      const event = this.data.disasters[Math.floor(Math.random() * this.data.disasters.length)];
      this.state.activeEvent = { ...event, remaining: event.duration };
      if (event.safetyHit) this.addResource("safety", -Math.max(0, event.safetyHit - this.state.resources.safety * 0.08));
      this.state.log = `Esdeveniment: ${event.label}.`;
    }
  }

  checkPopulation(seconds) {
    const food = this.state.resources.food;
    if (food <= 1) {
      this.state.morale = Math.max(0, this.state.morale - 0.05 * seconds);
      if (Math.random() < 0.01) this.state.population = Math.max(4, this.state.population - 1);
      return;
    }
    const growthPressure = this.state.morale / 100 + food / this.state.caps.food;
    if (this.state.population < this.state.populationCap && Math.random() < growthPressure * seconds * 0.0018) {
      this.state.population += 1;
      this.state.log = "La poblacio ha crescut.";
    }
    this.state.morale = Math.min(100, this.state.morale + 0.005 * seconds);
  }

  checkEraProgress() {
    const goal = this.getEra().unlockGoal;
    if (!goal?.population) return;
    const buildingsOk = Object.entries(goal.buildings || {}).every(([id, level]) => (this.state.buildings[id] || 0) >= level);
    const techOk = (goal.technologies || []).every((id) => this.state.technologies.includes(id));
    if (this.state.population >= goal.population && buildingsOk && techOk) {
      this.state.eraIndex = Math.min(this.state.eraIndex + 1, this.data.eras.length - 1);
      this.state.log = `Nova era desbloquejada: ${this.getEra().label}.`;
    }
  }
}
