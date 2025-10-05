const missionDeck = [
  {
    id: 'repair-next-cycle',
    label: 'Repara un modulo danado',
    description: 'Soluciona cualquier modulo danado antes del siguiente ciclo orbital.',
    trigger: 'onDamage',
    timeLimit: 1,
    reward: { morale: 5, energy: 5 },
  },
  {
    id: 'oxygen-buffer',
    label: 'Mantener oxigeno alto',
    description: 'Sostener el oxigeno por encima del 70% durante tres ciclos consecutivos.',
    trigger: 'duringSimulation',
    timeLimit: 3,
    reward: { morale: 4, oxygen: 6 },
  },
  {
    id: 'deploy-support',
    label: 'Expandir soporte vital',
    description: 'Construye un nuevo modulo de soporte vital durante esta fase.',
    trigger: 'construction',
    timeLimit: 0,
    reward: { oxygen: 5 },
  },
  {
    id: 'stabilize-energy',
    label: 'Estabilizar energia',
    description: 'Mantener la energia por encima del 60% durante dos ciclos.',
    trigger: 'duringSimulation',
    timeLimit: 2,
    reward: { energy: 8, morale: 2 },
  },
]

export default missionDeck
