const missionDeck = [
  {
    id: 'repair-next-cycle',
    label: 'Repair a damaged module',
    description: 'Restore any damaged module before the next orbital cycle.',
    trigger: 'onDamage',
    timeLimit: 1,
    reward: { morale: 5, energy: 5 },
  },
  {
    id: 'oxygen-buffer',
    label: 'Keep oxygen high',
    description: 'Maintain oxygen above 70% for three consecutive cycles.',
    trigger: 'duringSimulation',
    timeLimit: 3,
    reward: { morale: 4, oxygen: 6 },
  },
  {
    id: 'deploy-support',
    label: 'Expand life support',
    description: 'Construct a new life support module during this phase.',
    trigger: 'construction',
    timeLimit: 0,
    reward: { oxygen: 5 },
  },
  {
    id: 'stabilize-energy',
    label: 'Stabilize energy',
    description: 'Keep energy above 60% for two cycles.',
    trigger: 'duringSimulation',
    timeLimit: 2,
    reward: { energy: 8, morale: 2 },
  },
]

export default missionDeck
