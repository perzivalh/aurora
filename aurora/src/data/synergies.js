const synergyRules = [
  {
    id: 'energy-life-support-efficiency',
    label: 'Red de soporte optimizada',
    modules: ['energy', 'life-support'],
    description: 'La gestión energética reduce el consumo general.',
    effects: {
      decayMultiplier: 0.9,
    },
    tone: 'positive',
  },
  {
    id: 'life-support-laboratory',
    label: 'Bioingeniería aplicada',
    modules: ['life-support', 'laboratory'],
    description: 'El análisis acelera la recuperación de oxígeno.',
    effects: {
      resourceBonus: { oxygen: 3 },
    },
    tone: 'positive',
  },
  {
    id: 'energy-laboratory',
    label: 'Modelado predictivo',
    modules: ['energy', 'laboratory'],
    description: 'Las simulaciones reducen la probabilidad de fallos.',
    effects: {
      eventRiskModifier: -0.1,
    },
    tone: 'positive',
  },
  {
    id: 'crew-life-support',
    label: 'Ciclos circadianos restaurados',
    modules: ['crew', 'life-support'],
    description: 'La moral aumenta con aire limpio y descanso.',
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
    description: 'Reparación automática cada pocos ciclos.',
    effects: {
      autoRepairInterval: 4,
    },
    tone: 'positive',
  },
  {
    id: 'control-center-boost',
    label: 'Coordinación total',
    modules: ['control-center'],
    description: 'Potencia la eficiencia de cada sinergia positiva.',
    effects: {
      synergyAmplifier: 0.1,
    },
    tone: 'positive',
  },
  {
    id: 'energy-crew-noise',
    label: 'Ruido de reactor',
    modules: ['energy', 'crew'],
    description: 'Generadores cerca de la tripulación erosionan la moral.',
    effects: {
      resourcePenalty: { morale: 2 },
    },
    tone: 'negative',
  },
  {
    id: 'experimental-risk',
    label: 'Inestabilidad latente',
    modules: ['experimental-reactor'],
    description: 'El reactor experimental incrementa el riesgo de incidentes.',
    effects: {
      eventRiskModifier: 0.15,
      extraDamage: 1,
    },
    tone: 'negative',
  },
]

export default synergyRules
