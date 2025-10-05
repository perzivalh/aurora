const synergyRules = [
  {
    id: 'energy-life-support-efficiency',
    label: 'Red de soporte optimizada',
    modules: ['energy', 'life-support'],
    description: 'La gestion energetica reduce el consumo global.',
    effects: {
      decayMultiplier: 0.9,
    },
    tone: 'positive',
  },
  {
    id: 'life-support-laboratory',
    label: 'Bioingenieria aplicada',
    modules: ['life-support', 'laboratory'],
    description: 'Los analisis aceleran la recuperacion de oxigeno.',
    effects: {
      resourceBonus: { oxygen: 3 },
    },
    tone: 'positive',
  },
  {
    id: 'energy-laboratory',
    label: 'Modelado predictivo',
    modules: ['energy', 'laboratory'],
    description: 'Simulaciones reducen la probabilidad de fallo.',
    effects: {
      eventRiskModifier: -0.1,
    },
    tone: 'positive',
  },
  {
    id: 'crew-life-support',
    label: 'Ciclos circadianos restaurados',
    modules: ['crew', 'life-support'],
    description: 'La moral sube con aire puro y descanso.',
    effects: {
      resourceBonus: { morale: 3 },
    },
    tone: 'positive',
  },
  {
    id: 'laboratory-comms',
    label: 'Sondeo proactivo',
    modules: ['laboratory', 'comms'],
    description: 'Detecta eventos un ciclo antes de que ocurran.',
    effects: {
      earlyWarning: 1,
    },
    tone: 'positive',
  },
  {
    id: 'maintenance-network',
    label: 'Mantenimiento automatizado',
    modules: ['maintenance'],
    description: 'Reparacion automatica cada pocos ciclos.',
    effects: {
      autoRepairInterval: 4,
    },
    tone: 'positive',
  },
  {
    id: 'control-center-boost',
    label: 'Coordinacion total',
    modules: ['control-center'],
    description: 'Aumenta la eficiencia de todas las sinergias positivas.',
    effects: {
      synergyAmplifier: 0.1,
    },
    tone: 'positive',
  },
  {
    id: 'energy-crew-noise',
    label: 'Ruido de reactores',
    modules: ['energy', 'crew'],
    description: 'Los generadores cerca de los habitaculos reducen la moral.',
    effects: {
      resourcePenalty: { morale: 2 },
    },
    tone: 'negative',
  },
  {
    id: 'experimental-risk',
    label: 'Inestabilidad latente',
    modules: ['experimental-reactor'],
    description: 'El reactor experimental aumenta el riesgo de incidentes.',
    effects: {
      eventRiskModifier: 0.15,
      extraDamage: 1,
    },
    tone: 'negative',
  },
]

export default synergyRules
