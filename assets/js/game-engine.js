class GameEngine {
  constructor(data) {
    this.data = data;
    this.speed = 100;
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

    const state = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: options.name || "Aldea Nova",
      createdAt: Date.now(),
      difficulty,
      difficultyRules: difficultyMap[difficulty],
      resourceMode: options.resourceMode || "infinite",
      goal: options.goal || "balanced",
      eraIndex: 0,
      calendar: { day: 1, year: 1, totalDays: 0 },
      demographics: { children: 3, adults: 8, elders: 1, ageProgress: 0 },
      population: 12,
      populationCap: 18,
      morale: 74,
      resources: { food: 180, wood: 135, stone: 70, fiber: 55, knowledge: 8, safety: 36 },
      caps: this.baseCaps(),
      buildings: { hearth: 1, gatherers: 1 },
      technologies: [],
      health: { sick: 0, lastChange: 0 },
      hotel: { attraction: 0, visitors: 0, visitorCap: 0, exchange: 0 },
      queue: [],
      activeEvent: null,
      eventCooldown: 30,
      log: "La comunitat s'ha assentat. Cal produir, guardar i aprendre.",
      map: this.createMap(options.resourceMode || "infinite")
    };
    this.state = state;
    this.recalculateDerivedCaps();
    return state;
  }

  createMap(resourceMode) {
    const pattern = ["forest", "meadow", "quarry", "river", "hill"];
    const specialTileByIndex = this.specialTileByIndex();
    return Array.from({ length: 64 }, (_, index) => {
      const x = index % 8;
      const y = Math.floor(index / 8);
      const special = specialTileByIndex[index];
      const primary = pattern[(x * 3 + y * 5 + index) % pattern.length];
      const secondary = pattern[(x + y * 2 + 2) % pattern.length];
      return {
        id: index,
        x,
        y,
        types: special ? [] : primary === secondary ? [primary] : [primary, secondary],
        special,
        richness: 0.7 + (((x + 1) * (y + 3)) % 7) / 10,
        reserve: special || resourceMode !== "finite" ? null : 520 + ((index * 97) % 540),
        development: 0
      };
    });
  }

  baseCaps() {
    return { food: 420, wood: 360, stone: 360, fiber: 260, knowledge: 180, safety: 100 };
  }

  specialTileByIndex() {
    const specials = this.data.specialTiles || [];
    const entries = [];
    for (let y = 2; y <= 5; y += 1) {
      for (let x = 2; x <= 5; x += 1) {
        entries.push(y * 8 + x);
      }
    }
    return Object.fromEntries(entries.map((index, position) => [index, specials[position]]));
  }

  normalizeState() {
    const specialTileByIndex = this.specialTileByIndex();
    this.state.map ||= this.createMap(this.state.resourceMode || "infinite");
    for (const tile of this.state.map) {
      const special = specialTileByIndex[tile.id];
      tile.special = special || null;
      if (special) {
        tile.types = [];
        tile.reserve = null;
      }
      tile.development ||= 0;
    }
    this.state.buildings ||= {};
    this.state.technologies ||= [];
    this.state.calendar ||= { day: 1, year: 1, totalDays: 0 };
    this.state.demographics ||= this.demographicsFromPopulation(this.state.population || 12);
    this.syncPopulationFromDemographics();
    this.state.health ||= { sick: 0, lastChange: 0 };
    this.state.hotel ||= { attraction: 0, visitors: 0, visitorCap: 0, exchange: 0 };
    this.state.queue ||= [];
    this.state.queue.forEach((item) => {
      item.groupKey ||= `${item.type}:${item.target}`;
      item.status ||= "waiting";
    });
    this.recalculateDerivedCaps();
    this.updateHotelStats(0);
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
      this.normalizeState();
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
    this.advanceCalendar(elapsed);
    this.produce(elapsed);
    this.updateHotelStats(elapsed);
    this.checkHealth(elapsed);
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

  demographicsFromPopulation(population) {
    return {
      children: Math.max(1, Math.round(population * 0.24)),
      adults: Math.max(1, Math.round(population * 0.66)),
      elders: Math.max(0, population - Math.max(1, Math.round(population * 0.24)) - Math.max(1, Math.round(population * 0.66))),
      ageProgress: 0
    };
  }

  syncPopulationFromDemographics() {
    const demographics = this.state.demographics;
    this.state.population = Math.max(0, Math.round(demographics.children + demographics.adults + demographics.elders));
  }

  advanceCalendar(seconds) {
    const dayGain = seconds / 20;
    this.state.calendar.totalDays += dayGain;
    const dayIndex = Math.floor(this.state.calendar.totalDays);
    this.state.calendar.year = 1 + Math.floor(dayIndex / 360);
    this.state.calendar.day = 1 + (dayIndex % 360);
    this.advanceAges(dayGain);
  }

  advanceAges(days) {
    const rules = this.data.configuration?.population || {};
    const daysPerYear = rules.ageDaysPerYear || 24;
    this.state.demographics.ageProgress = (this.state.demographics.ageProgress || 0) + days / daysPerYear;
    while (this.state.demographics.ageProgress >= 1) {
      this.state.demographics.ageProgress -= 1;
      const childrenToAdults = this.state.demographics.children / Math.max(1, rules.adultStartAge || 15);
      const adultsToElders = this.state.demographics.adults / Math.max(1, (rules.elderStartAge || 60) - (rules.adultStartAge || 15));
      const elderDeaths = this.state.demographics.elders * (rules.yearlyDeathRate || 0.018) * 2.2;
      this.state.demographics.children = Math.max(0, this.state.demographics.children - childrenToAdults);
      this.state.demographics.adults = Math.max(0, this.state.demographics.adults + childrenToAdults - adultsToElders);
      this.state.demographics.elders = Math.max(0, this.state.demographics.elders + adultsToElders - elderDeaths);
    }
    this.syncPopulationFromDemographics();
  }

  usedWorkers() {
    return this.activeQueueItems().reduce((sum, item) => sum + item.workers, 0);
  }

  healthyWorkers() {
    return Math.max(0, Math.floor(this.state.demographics.adults) - Math.ceil(this.state.health?.sick || 0));
  }

  freeWorkers() {
    return Math.max(0, this.healthyWorkers() - this.usedWorkers());
  }

  activeQueueItems() {
    const activeByGroup = new Map();
    for (const item of this.state.queue) {
      const groupKey = item.groupKey || `${item.type}:${item.target}`;
      if (!activeByGroup.has(groupKey)) activeByGroup.set(groupKey, item);
    }
    return [...activeByGroup.values()];
  }

  hasQueuedGroup(type, target) {
    const groupKey = `${type}:${target}`;
    return this.state.queue.some((item) => (item.groupKey || `${item.type}:${item.target}`) === groupKey);
  }

  productionRates() {
    const rates = { food: 0.06, wood: 0.03, stone: 0.018, fiber: 0.018, knowledge: 0.012, safety: 0 };
    for (const tile of this.state.map) {
      if (!tile.types?.length) continue;
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

  foodConsumptionRate() {
    const demographics = this.state.demographics || this.demographicsFromPopulation(this.state.population || 0);
    const rules = this.data.configuration?.population || {};
    const dependentFoodMultiplier = rules.dependentFoodMultiplier ?? 0.75;
    const adultFoodRate = rules.adultFoodRate || 0.017;
    const equivalentAdults =
      (demographics.adults || 0) +
      ((demographics.children || 0) + (demographics.elders || 0)) * dependentFoodMultiplier;
    const foodUseMultiplier = this.buildingEffect("foodUseMultiplier");
    return equivalentAdults * adultFoodRate * this.state.difficultyRules.consumption * (1 + foodUseMultiplier);
  }

  resourceFlows() {
    const production = this.productionRates();
    const consumption = { food: this.foodConsumptionRate() };
    const net = { ...production };
    net.food = (net.food || 0) - consumption.food;

    const hotelExchange = this.state.hotel.exchange || 0;
    net.knowledge = (net.knowledge || 0) + hotelExchange * 0.45;
    net.fiber = (net.fiber || 0) + hotelExchange * 0.25;
    net.food = (net.food || 0) + hotelExchange * 0.12;

    return { production, consumption, net };
  }

  produce(seconds) {
    const rates = this.resourceFlows().net;

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

  buildingQueuedCount(buildingId) {
    return this.state.queue.filter((item) => item.type === "building" && item.target === buildingId).length;
  }

  projectedBuildingLevel(buildingId) {
    return (this.state.buildings[buildingId] || 0) + this.buildingQueuedCount(buildingId);
  }

  hasRequirements(requirements = []) {
    return requirements.every((id) => this.state.technologies.includes(id));
  }

  build(buildingId) {
    const building = this.data.buildings[buildingId];
    const level = this.projectedBuildingLevel(buildingId);
    if (!building || level >= building.maxLevel || !this.hasRequirements(building.requires)) return false;
    const cost = this.scaledCost(building.cost, level);
    const samePlaceQueued = this.hasQueuedGroup("building", buildingId);
    if (!this.canAfford(cost) || (!samePlaceQueued && this.freeWorkers() < building.workers)) return false;
    this.pay(cost);
    this.state.queue.push({
      id: `build-${buildingId}-${Date.now()}`,
      type: "building",
      target: buildingId,
      groupKey: `building:${buildingId}`,
      status: "waiting",
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
      groupKey: `technology:${technologyId}`,
      status: "waiting",
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
    if (!tile || tile.special) return false;
    const cost = { food: 35 + tile.development * 20, wood: 30 + tile.development * 25, stone: 15 + tile.development * 15 };
    const sameTileQueued = this.hasQueuedGroup("tile", tileId);
    if (!this.canAfford(cost) || (!sameTileQueued && this.freeWorkers() < 2)) return false;
    this.pay(cost);
    this.state.queue.push({
      id: `tile-${tileId}-${Date.now()}`,
      type: "tile",
      target: tileId,
      groupKey: `tile:${tileId}`,
      status: "waiting",
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
    const activeItems = this.activeQueueItems();
    this.state.queue.forEach((item) => {
      item.status = activeItems.includes(item) ? "active" : "waiting";
    });
    for (const item of activeItems) {
      item.remaining -= seconds;
      if (item.remaining <= 0) {
        this.completeQueueItem(item);
        this.state.queue = this.state.queue.filter((queued) => queued.id !== item.id);
      }
    }
  }

  completeQueueItem(item) {
    if (item.type === "building") {
      const maxLevel = this.data.buildings[item.target]?.maxLevel || Infinity;
      this.state.buildings[item.target] = Math.min(maxLevel, (this.state.buildings[item.target] || 0) + 1);
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
    this.recalculateDerivedCaps();
  }

  houseCapacity(level) {
    const table = this.data.configuration?.population?.houseCapacityByLevel || [0, 8, 14, 22, 32, 44, 58, 72, 84, 94, 100];
    return table[Math.min(level, table.length - 1)] || 0;
  }

  recalculateDerivedCaps() {
    const caps = this.baseCaps();
    let populationCap = this.data.configuration?.population?.baseHousing || 10;
    for (const [buildingId, level] of Object.entries(this.state.buildings || {})) {
      const effects = this.data.buildings[buildingId]?.effects || {};
      if (effects.foodCap) caps.food += effects.foodCap * level;
      if (effects.materialCap) {
        caps.wood += effects.materialCap * level;
        caps.stone += effects.materialCap * level;
        caps.fiber += Math.round(effects.materialCap * 0.7) * level;
      }
      if (effects.housing) populationCap += this.houseCapacity(level);
      if (buildingId === "hearth") {
        for (let builtLevel = 1; builtLevel <= level; builtLevel += 1) {
          populationCap += 2 + builtLevel;
        }
      }
      if (buildingId === "council") caps.knowledge += 160 * level;
    }
    this.state.caps = caps;
    this.state.populationCap = populationCap;
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

  occupiedTileCount() {
    return this.state.map.filter((tile) => {
      if (tile.special?.buildingId) return (this.state.buildings[tile.special.buildingId] || 0) > 0;
      if (tile.special?.label) return true;
      return (tile.development || 0) > 0;
    }).length;
  }

  resourceFullness() {
    const keys = ["food", "wood", "stone", "fiber", "knowledge", "safety"];
    const total = keys.reduce((sum, key) => {
      const cap = this.state.caps[key] || 1;
      return sum + Math.min(1, (this.state.resources[key] || 0) / cap);
    }, 0);
    return total / keys.length;
  }

  updateHotelStats(seconds) {
    const hotelLevel = this.state.buildings.hotel || 0;
    const rules = this.data.configuration?.hotel || {};
    const attraction = Math.round(
      hotelLevel * (rules.levelWeight || 18) +
      this.occupiedTileCount() * (rules.occupiedTileWeight || 2) +
      this.resourceFullness() * (rules.resourceWeight || 35) +
      this.state.population * (rules.populationWeight || 0.8) +
      this.state.morale * (rules.moraleWeight || 0.25)
    );
    const visitorCap = hotelLevel * (this.data.buildings.hotel?.effects?.visitorCap || 8);
    const targetVisitors = hotelLevel > 0 ? Math.min(visitorCap, attraction / 6) : 0;
    const drift = Math.min(1, seconds * (rules.visitorDrift || 0.015));
    const visitors = this.state.hotel.visitors + (targetVisitors - this.state.hotel.visitors) * drift;
    const exchange = visitors * (this.data.buildings.hotel?.effects?.exchangeRate || 0.018) * (1 + hotelLevel * 0.12);
    this.state.hotel = { attraction, visitorCap, visitors: Math.max(0, visitors), exchange };
  }

  checkHealth(seconds) {
    const hospitalLevel = this.state.buildings.hospital || 0;
    const lowFoodThreshold = this.data.configuration?.population?.lowFoodThreshold || 0.18;
    const foodRatio = (this.state.resources.food || 0) / Math.max(1, this.state.caps.food || 1);
    const starvationPressure = Math.max(0, lowFoodThreshold - foodRatio) / lowFoodThreshold;
    const moralePressure = Math.max(0, 55 - this.state.morale) / 55;
    const eventPressure = this.state.activeEvent?.kind === "penalty" ? 0.2 : 0;
    const resistance = Math.min(0.78, hospitalLevel * (this.data.buildings.hospital?.effects?.sicknessResistance || 0.08));
    const sicknessRate = (0.0012 + starvationPressure * 0.01 + moralePressure * 0.003 + eventPressure * 0.002) * (1 - resistance);
    const recoveryRate = 0.002 + hospitalLevel * (this.data.buildings.hospital?.effects?.recoveryRate || 0.018);
    const sick = this.state.health.sick || 0;
    const adultCount = Math.max(0, this.state.demographics.adults || 0);
    const newSick = Math.max(0, adultCount - sick) * sicknessRate * seconds;
    const recovered = sick * recoveryRate * seconds;
    const nextSick = Math.max(0, Math.min(adultCount, sick + newSick - recovered));
    if (Math.floor(nextSick) > Math.floor(sick)) this.state.log = "Algunes persones han emmalaltit i hi ha menys treballadors disponibles.";
    if (Math.floor(nextSick) < Math.floor(sick)) this.state.log = "Part de la poblacio malalta s'ha recuperat.";
    this.state.health.sick = nextSick;
  }

  checkPopulation(seconds) {
    const food = this.state.resources.food;
    if (food <= 1) {
      this.state.morale = Math.max(0, this.state.morale - 0.05 * seconds);
      if (Math.random() < 0.01) this.state.demographics.elders = Math.max(0, this.state.demographics.elders - 1);
      this.syncPopulationFromDemographics();
      return;
    }
    const freeHousing = Math.max(0, this.state.populationCap - this.state.population);
    const rules = this.data.configuration?.population || {};
    const hotelPull = Math.min(1.8, (this.state.hotel.attraction || 0) / 120 + (this.state.hotel.visitors || 0) / 80);
    const growthPressure = (this.state.morale / 100 + food / this.state.caps.food + hotelPull) * (freeHousing > 0 ? 1 : 0);
    const birthChance = (rules.yearlyBirthRate || 0.045) * seconds / 480;
    const migrationChance = (rules.yearlyMigrationRate || 0.08) * growthPressure * seconds / 420;
    if (freeHousing > 0 && Math.random() < birthChance * Math.max(1, this.state.demographics.adults / 8)) {
      this.state.demographics.children += 1;
      this.syncPopulationFromDemographics();
      this.state.log = "Ha nascut un infant a la comunitat.";
    }
    if (freeHousing > 0 && Math.random() < migrationChance) {
      this.state.demographics.adults += 1;
      this.syncPopulationFromDemographics();
      this.state.log = "Una persona adulta s'ha instal.lat a la ciutat.";
    }
    if (freeHousing <= 0) this.state.morale = Math.max(0, this.state.morale - 0.002 * seconds);
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
