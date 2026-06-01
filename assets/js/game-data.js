window.CIVITAS_DATA = {
  resources: {
    food: { label: "Menjar", icon: "grain", capKey: "granary" },
    wood: { label: "Fusta", icon: "forest", capKey: "warehouse" },
    stone: { label: "Pedra", icon: "quarry", capKey: "warehouse" },
    fiber: { label: "Fibra", icon: "reeds", capKey: "warehouse" },
    knowledge: { label: "Coneixement", icon: "spark", capKey: "lore" },
    safety: { label: "Seguretat", icon: "shield", capKey: "safety" }
  },
  eras: [
    {
      id: "prehistory",
      label: "Prehistoria",
      description: "Petites bandes sedentaries aprenen a produir, guardar i protegir recursos.",
      unlockGoal: { population: 32, technologies: ["fire", "storage", "rituals"], buildings: { council: 1 } }
    },
    { id: "mesopotamia", label: "Mesopotamia", description: "Regadiu, escriptura i ciutats-estat.", unlockGoal: {} },
    { id: "egypt", label: "Egipte", description: "Administracio, monuments i agricultura del riu.", unlockGoal: {} },
    { id: "greece", label: "Grecia", description: "Polis, filosofia i navegacio.", unlockGoal: {} },
    { id: "rome", label: "Roma", description: "Enginyeria, llei i xarxes comercials.", unlockGoal: {} },
    { id: "middle_ages", label: "Edat mitjana", description: "Gremis, castells i coneixement monastic.", unlockGoal: {} },
    { id: "industrial", label: "Revolucio industrial", description: "Maquines, vapor i produccio intensiva.", unlockGoal: {} },
    { id: "pre_computing", label: "Epoca preinformatica", description: "Electricitat, telecomunicacions i calcul mecanic.", unlockGoal: {} },
    { id: "millennium", label: "Anys 2000", description: "Xarxes globals i informacio digital.", unlockGoal: {} },
    { id: "modern", label: "Epoca moderna", description: "Automatitzacio, energia neta i ciutats connectades.", unlockGoal: {} },
    { id: "future", label: "Era futurista", description: "Societats planetaries i recerca especulativa.", unlockGoal: {} }
  ],
  buildings: {
    hearth: {
      label: "Fogar",
      description: "Millora el benestar i redueix el consum de menjar.",
      maxLevel: 5,
      baseTime: 35,
      workers: 2,
      cost: { wood: 35, stone: 12 },
      effects: { foodUseMultiplier: -0.03, safety: 2 },
      requires: []
    },
    gatherers: {
      label: "Campament de recol.lectors",
      description: "Organitza la recollida de menjar, fibra i materials simples.",
      maxLevel: 8,
      baseTime: 30,
      workers: 3,
      cost: { wood: 30, fiber: 15 },
      effects: { foodRate: 0.22, fiberRate: 0.08 },
      requires: []
    },
    woodcutters: {
      label: "Talladors",
      description: "Augmenta l'extraccio de fusta dels boscos.",
      maxLevel: 8,
      baseTime: 40,
      workers: 3,
      cost: { food: 20, wood: 45, stone: 10 },
      effects: { woodRate: 0.24 },
      requires: ["stone_tools"]
    },
    quarry: {
      label: "Pedrera",
      description: "Permet treballar afloraments de pedra amb mes eficiencia.",
      maxLevel: 8,
      baseTime: 48,
      workers: 4,
      cost: { food: 30, wood: 35 },
      effects: { stoneRate: 0.22 },
      requires: ["stone_tools"]
    },
    granary: {
      label: "Graner",
      description: "Amplia la capacitat de menjar i protegeix reserves.",
      maxLevel: 10,
      baseTime: 42,
      workers: 3,
      cost: { wood: 70, fiber: 25 },
      effects: { foodCap: 220 },
      requires: ["storage"]
    },
    warehouse: {
      label: "Magatzem",
      description: "Augmenta la capacitat de materials.",
      maxLevel: 10,
      baseTime: 45,
      workers: 3,
      cost: { wood: 90, stone: 35 },
      effects: { materialCap: 500 },
      requires: ["storage"]
    },
    palisade: {
      label: "Palisada",
      description: "Redueix danys de fauna, tempestes i accidents.",
      maxLevel: 6,
      baseTime: 55,
      workers: 5,
      cost: { wood: 120, stone: 40 },
      effects: { safety: 12 },
      requires: ["palisade"]
    },
    council: {
      label: "Consell",
      description: "Coordina objectius, coneixement i pas d'era.",
      maxLevel: 3,
      baseTime: 80,
      workers: 6,
      cost: { wood: 180, stone: 130, knowledge: 40 },
      effects: { knowledgeRate: 0.12 },
      requires: ["rituals", "storage"]
    },
    hotel: {
      label: "Hotel",
      description: "Atrau visitants i augmenta l'intercanvi amb altres comunitats.",
      maxLevel: 8,
      baseTime: 70,
      workers: 4,
      cost: { wood: 140, stone: 95, fiber: 45, food: 80 },
      effects: { visitorCap: 8, exchangeRate: 0.018 },
      requires: ["storage"]
    },
    hospital: {
      label: "Hospital",
      description: "Redueix malalties i accelera la recuperacio dels treballadors.",
      maxLevel: 8,
      baseTime: 75,
      workers: 5,
      cost: { wood: 160, stone: 120, fiber: 70, knowledge: 35 },
      effects: { sicknessResistance: 0.08, recoveryRate: 0.018 },
      requires: ["rituals"]
    },
    house_1: {
      label: "Casa nord",
      description: "Habitatges escalables que limiten quanta poblacio pot viure a la ciutat.",
      maxLevel: 10,
      baseTime: 46,
      workers: 3,
      cost: { wood: 85, stone: 35, fiber: 30, food: 35 },
      effects: { housing: true },
      requires: []
    },
    house_2: {
      label: "Casa est",
      description: "Habitatges escalables que limiten quanta poblacio pot viure a la ciutat.",
      maxLevel: 10,
      baseTime: 50,
      workers: 3,
      cost: { wood: 95, stone: 42, fiber: 34, food: 40 },
      effects: { housing: true },
      requires: []
    },
    house_3: {
      label: "Casa sud",
      description: "Habitatges escalables que limiten quanta poblacio pot viure a la ciutat.",
      maxLevel: 10,
      baseTime: 54,
      workers: 4,
      cost: { wood: 105, stone: 48, fiber: 38, food: 45 },
      effects: { housing: true },
      requires: []
    },
    house_4: {
      label: "Casa oest",
      description: "Habitatges escalables que limiten quanta poblacio pot viure a la ciutat.",
      maxLevel: 10,
      baseTime: 58,
      workers: 4,
      cost: { wood: 115, stone: 55, fiber: 42, food: 50 },
      effects: { housing: true },
      requires: []
    },
    school: {
      label: "Escola",
      description: "Augmenta el coneixement i prepara els nens per convertir-se en adults productius.",
      maxLevel: 10,
      baseTime: 64,
      workers: 4,
      cost: { wood: 130, stone: 80, fiber: 50, knowledge: 25 },
      effects: { knowledgeRate: 0.08, education: 0.05 },
      requires: ["rituals"]
    }
  },
  technologies: {
    fire: {
      label: "Domini del foc",
      description: "Millora la supervivencia i obre el fogar avancat.",
      cost: { knowledge: 20, wood: 30 },
      time: 45,
      workers: 1,
      unlocks: ["hearth"]
    },
    stone_tools: {
      label: "Eines de pedra",
      description: "Fa viables talladors i pedreres especialitzades.",
      cost: { knowledge: 28, stone: 55 },
      time: 55,
      workers: 2,
      unlocks: ["woodcutters", "quarry"]
    },
    storage: {
      label: "Emmagatzematge",
      description: "Obre graners i magatzems.",
      cost: { knowledge: 36, wood: 80, fiber: 35 },
      time: 60,
      workers: 2,
      unlocks: ["granary", "warehouse"]
    },
    tracking: {
      label: "Rastreig",
      description: "Incrementa l'entrada de menjar i anticipa animals perillosos.",
      cost: { knowledge: 32, food: 90 },
      time: 52,
      workers: 2,
      unlocks: []
    },
    palisade: {
      label: "Defenses primitives",
      description: "Permet construir palissades contra fauna i temporals.",
      cost: { knowledge: 48, wood: 110, stone: 45 },
      time: 70,
      workers: 3,
      unlocks: ["palisade"],
      requires: ["stone_tools"]
    },
    rituals: {
      label: "Relats i rituals",
      description: "Accelera el coneixement i dona cohesio social.",
      cost: { knowledge: 64, food: 120, fiber: 45 },
      time: 85,
      workers: 2,
      unlocks: ["council"],
      requires: ["fire"]
    }
  },
  tileTypes: {
    forest: { label: "Bosc", yields: { wood: 0.08, food: 0.02 }, color: "#3f7f4f" },
    meadow: { label: "Prat", yields: { food: 0.07, fiber: 0.03 }, color: "#78a85a" },
    quarry: { label: "Aflorament", yields: { stone: 0.07 }, color: "#8c8b81" },
    river: { label: "Riera", yields: { food: 0.04, fiber: 0.04 }, color: "#4c93a8" },
    hill: { label: "Turons", yields: { stone: 0.04, wood: 0.03 }, color: "#897455" }
  },
  specialTiles: [
    { id: "warehouse", label: "Magatzem", buildingId: "warehouse", stat: "materialCap" },
    { id: "granary", label: "Graner", buildingId: "granary", stat: "foodCap" },
    { id: "market", label: "Mercat" },
    { id: "safety", label: "Seguretat" },
    { id: "townHall", label: "Ajuntament" },
    { id: "mainSquare", label: "Placa Major" },
    { id: "hotel", label: "Hotel", buildingId: "hotel", stat: "visitors" },
    { id: "hospital", label: "Hospital", buildingId: "hospital", stat: "health" },
    { id: "house-1", label: "Casa nord", buildingId: "house_1", stat: "housing" },
    { id: "house-2", label: "Casa est", buildingId: "house_2", stat: "housing" },
    { id: "house-3", label: "Casa sud", buildingId: "house_3", stat: "housing" },
    { id: "house-4", label: "Casa oest", buildingId: "house_4", stat: "housing" },
    { id: "school", label: "Escola", buildingId: "school", stat: "education" },
    { id: "empty-6", label: "" },
    { id: "empty-7", label: "" },
    { id: "empty-8", label: "" }
  ],
  disasters: [
    { label: "Pluges generoses", kind: "bonus", duration: 70, modifiers: { food: 1.25, fiber: 1.1 } },
    { label: "Sequera curta", kind: "penalty", duration: 65, modifiers: { food: 0.72, wood: 0.92 } },
    { label: "Animals propers", kind: "danger", duration: 55, modifiers: { food: 0.88 }, safetyHit: 8 },
    { label: "Fred intens", kind: "penalty", duration: 60, modifiers: { food: 0.82, knowledge: 0.9 } }
  ],
  configuration: {
    map: {
      size: 8,
      specialZone: { fromX: 2, toX: 5, fromY: 2, toY: 5 },
      allowMixedTiles: true,
      allowFiniteResources: true
    },
    population: {
      baseWorkersPerPerson: 1,
      lowFoodThreshold: 0.18,
      starvationSicknessMultiplier: 2.4,
      baseHousing: 10,
      ageDaysPerYear: 24,
      adultStartAge: 15,
      elderStartAge: 60,
      yearlyBirthRate: 0.045,
      yearlyDeathRate: 0.018,
      yearlyMigrationRate: 0.08,
      houseCapacityByLevel: [0, 8, 14, 22, 32, 44, 58, 72, 84, 94, 100]
    },
    hotel: {
      visitorDrift: 0.015,
      resourceWeight: 35,
      populationWeight: 0.8,
      occupiedTileWeight: 2,
      moraleWeight: 0.25,
      levelWeight: 18
    }
  }
};
