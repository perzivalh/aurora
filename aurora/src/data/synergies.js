const synergyRules = [
  {
    id: 'energy-life-support-efficiency',
    label: 'Optimized support grid',
    modules: ['energy', 'life-support'],
    description: 'Energy management reduces overall consumption.',
    effects: {
      decayMultiplier: 0.9,
    },
    tone: 'positive',
  },
  {
    id: 'life-support-laboratory',
    label: 'Applied bioengineering',
    modules: ['life-support', 'laboratory'],
    description: 'Analysis accelerates oxygen recovery.',
    effects: {
      resourceBonus: { oxygen: 3 },
    },
    tone: 'positive',
  },
  {
    id: 'energy-laboratory',
    label: 'Predictive modeling',
    modules: ['energy', 'laboratory'],
    description: 'Simulations reduce the probability of failure.',
    effects: {
      eventRiskModifier: -0.1,
    },
    tone: 'positive',
  },
  {
    id: 'crew-life-support',
    label: 'Restored circadian cycles',
    modules: ['crew', 'life-support'],
    description: 'Morale climbs with clean air and rest.',
    effects: {
      resourceBonus: { morale: 3 },
    },
    tone: 'positive',
  },
  {
    id: 'laboratory-comms',
    label: 'Proactive probing',
    modules: ['laboratory', 'comms'],
    description: 'Detects events one cycle before they occur.',
    effects: {
      earlyWarning: 1,
    },
    tone: 'positive',
  },
  {
    id: 'maintenance-network',
    label: 'Automated maintenance',
    modules: ['maintenance'],
    description: 'Automatic repair every few cycles.',
    effects: {
      autoRepairInterval: 4,
    },
    tone: 'positive',
  },
  {
    id: 'control-center-boost',
    label: 'Total coordination',
    modules: ['control-center'],
    description: 'Boosts the efficiency of every positive synergy.',
    effects: {
      synergyAmplifier: 0.1,
    },
    tone: 'positive',
  },
  {
    id: 'energy-crew-noise',
    label: 'Reactor noise',
    modules: ['energy', 'crew'],
    description: 'Generators near crew quarters erode morale.',
    effects: {
      resourcePenalty: { morale: 2 },
    },
    tone: 'negative',
  },
  {
    id: 'experimental-risk',
    label: 'Latent instability',
    modules: ['experimental-reactor'],
    description: 'The experimental reactor increases incident risk.',
    effects: {
      eventRiskModifier: 0.15,
      extraDamage: 1,
    },
    tone: 'negative',
  },
]

export default synergyRules
