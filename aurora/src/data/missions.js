const missionDeck = [
  {
    id: 'repair-next-cycle',
    label: 'Repara un módulo dañado',
    description: 'Restaura cualquier módulo dañado antes del siguiente ciclo orbital.',
    trigger: 'onDamage',
    timeLimit: 1,
    reward: { morale: 5, energy: 5 },
  },
  {
    id: 'oxygen-buffer',
    label: 'Mantén el oxígeno alto',
    description: 'Mantén el oxígeno por encima del 70% durante tres ciclos consecutivos.',
    trigger: 'duringSimulation',
    timeLimit: 3,
    reward: { morale: 4, oxygen: 6 },
  },
  {
    id: 'deploy-support',
    label: 'Amplía el soporte vital',
    description: 'Construye un nuevo módulo de soporte vital durante esta fase.',
    trigger: 'construction',
    timeLimit: 0,
    reward: { oxygen: 5 },
  },
  {
    id: 'stabilize-energy',
    label: 'Estabiliza la energía',
    description: 'Mantén la energía por encima del 60% durante dos ciclos.',
    trigger: 'duringSimulation',
    timeLimit: 2,
    reward: { energy: 8, morale: 2 },
  },
]

export default missionDeck
