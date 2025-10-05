import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import eventDeck from '../data/events.js'
import synergyRules from '../data/synergies.js'
import missionDeck from '../data/missions.js'

const GameContext = createContext(null)

const RESOURCE_KEYS = ['energy', 'oxygen', 'morale']

const clamp = (value, min = 0, max = 100) => {
  if (value < min) return min
  if (value > max) return max
  return value
}

const INITIAL_RESOURCES = {
  energy: 100,
  oxygen: 100,
  morale: 100,
}

const BASE_DECAY = {
  energy: 2,
  oxygen: 3,
  morale: 1,
}

const DEFAULT_PLANET_PROFILE = {
  habitatSlots: 10,
  resourceBaseline: INITIAL_RESOURCES,
  decayMultiplier: 1,
  decayOffset: { energy: 0, oxygen: 0, morale: 0 },
  eventChanceModifier: 0,
  incidentRiskModifier: 0,
  incidentSeverityModifier: 0,
  eventWeightAdjustments: {},
  environmentSummary: '',
}

const TICK_INTERVAL_MS = 5000
const BASE_EVENT_CHANCE = 0.25
const SURVIVAL_TARGET_TICKS = 12
const INCIDENT_LOSS_PENALTY = 1

const REPAIR_COST = { energy: -10, morale: -2 }
const REDIRECT_COST = { energy: -5, morale: -5 }

const DAMAGE_STATES = {
  operational: 'operational',
  damaged: 'damaged',
  lost: 'lost',
}

const INCIDENT_EFFECT_MAP = {
  oxygenDrain: { oxygen: -5 },
  moraleDrain: { morale: -2 },
  energyDrain: { energy: -6 },
}

const pickWeightedRandom = (items) => {
  if (!items.length) {
    return null
  }
  const totalWeight = items.reduce((total, item) => total + (item.weight ?? 1), 0)
  if (totalWeight <= 0) {
    return items[Math.floor(Math.random() * items.length)]
  }
  let roll = Math.random() * totalWeight
  for (const item of items) {
    const weight = item.weight ?? 1
    if (roll < weight) {
      return item
    }
    roll -= weight
  }
  return items[items.length - 1]
}

const applyResourceDeltaToState = (state, delta) => {
  const next = { ...state }
  RESOURCE_KEYS.forEach((key) => {
    if (delta[key]) {
      next[key] = clamp(next[key] + delta[key])
    }
  })
  return next
}

const createModuleInstance = (module) => ({
  ...module,
  instanceId: `${module.id}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  status: DAMAGE_STATES.operational,
  damageCountdown: null,
  stabilizedBuffer: 0,
})

const resolvePlanetProfile = (planet) => {
  if (!planet) {
    return {
      ...DEFAULT_PLANET_PROFILE,
      resourceBaseline: { ...INITIAL_RESOURCES },
      decayOffset: { ...DEFAULT_PLANET_PROFILE.decayOffset },
      eventWeightAdjustments: { ...DEFAULT_PLANET_PROFILE.eventWeightAdjustments },
    }
  }

  const hazards = planet.hazards ?? {}
  const decayOffset = {
    energy: hazards.decayOffset?.energy ?? 0,
    oxygen: hazards.decayOffset?.oxygen ?? 0,
    morale: hazards.decayOffset?.morale ?? 0,
  }

  return {
    habitatSlots: planet.habitatSlots ?? DEFAULT_PLANET_PROFILE.habitatSlots,
    resourceBaseline: { ...INITIAL_RESOURCES, ...(planet.resourceBaseline ?? {}) },
    decayMultiplier: hazards.decayMultiplier ?? DEFAULT_PLANET_PROFILE.decayMultiplier,
    decayOffset,
    eventChanceModifier: hazards.eventChanceModifier ?? DEFAULT_PLANET_PROFILE.eventChanceModifier,
    incidentRiskModifier: hazards.incidentRiskModifier ?? DEFAULT_PLANET_PROFILE.incidentRiskModifier,
    incidentSeverityModifier: hazards.incidentSeverityModifier ?? DEFAULT_PLANET_PROFILE.incidentSeverityModifier,
    eventWeightAdjustments: { ...DEFAULT_PLANET_PROFILE.eventWeightAdjustments, ...(hazards.eventWeightAdjustments ?? {}) },
    environmentSummary: planet.environmentSummary ?? DEFAULT_PLANET_PROFILE.environmentSummary,
  }
}

const deriveModuleEffects = (modules) => {
  const modifier = { energy: 0, oxygen: 0, morale: 0 }
  modules.forEach((module) => {
    const multiplier = module.status === DAMAGE_STATES.operational ? 1 : module.status === DAMAGE_STATES.damaged ? 0.5 : 0
    RESOURCE_KEYS.forEach((key) => {
      if (module.effects[key]) {
        modifier[key] += module.effects[key] * multiplier
      }
    })
  })
  return modifier
}

const calculateSynergySummary = (modules) => {
  const availableModuleIds = new Set(
    modules.filter((module) => module.status !== DAMAGE_STATES.lost).map((module) => module.id),
  )

  const activeRules = []
  let amplifier = 0

  synergyRules.forEach((rule) => {
    const meetsRequirement = rule.modules.every((id) => availableModuleIds.has(id))
    if (!meetsRequirement) {
      return
    }
    activeRules.push(rule)
    if (rule.effects?.synergyAmplifier) {
      amplifier += rule.effects.synergyAmplifier
    }
  })

  const amplifierFactor = 1 + amplifier

  let decayMultiplier = 1
  let eventRiskModifier = 0
  let resourceBonus = { energy: 0, oxygen: 0, morale: 0 }
  let resourcePenalty = { energy: 0, oxygen: 0, morale: 0 }
  let earlyWarning = 0
  let autoRepairInterval = null
  let extraDamage = 0

  activeRules.forEach((rule) => {
    const effects = rule.effects ?? {}
    const toneFactor = rule.tone === 'positive' ? amplifierFactor : 1

    if (effects.decayMultiplier) {
      const reduction = 1 - effects.decayMultiplier
      const adjusted = 1 - reduction * toneFactor
      decayMultiplier *= adjusted
    }

    if (effects.resourceBonus) {
      RESOURCE_KEYS.forEach((key) => {
        if (effects.resourceBonus[key]) {
          resourceBonus[key] += effects.resourceBonus[key] * toneFactor
        }
      })
    }

    if (effects.resourcePenalty) {
      RESOURCE_KEYS.forEach((key) => {
        if (effects.resourcePenalty[key]) {
          resourcePenalty[key] += effects.resourcePenalty[key]
        }
      })
    }

    if (effects.eventRiskModifier) {
      eventRiskModifier += effects.eventRiskModifier * toneFactor
    }

    if (effects.earlyWarning) {
      earlyWarning = Math.max(earlyWarning, effects.earlyWarning)
    }

    if (effects.autoRepairInterval) {
      autoRepairInterval = autoRepairInterval
        ? Math.min(autoRepairInterval, effects.autoRepairInterval)
        : effects.autoRepairInterval
    }

    if (effects.extraDamage) {
      extraDamage += effects.extraDamage
    }
  })

  return {
    active: activeRules.map((rule) => ({
      id: rule.id,
      label: rule.label,
      description: rule.description,
      tone: rule.tone,
    })),
    decayMultiplier,
    eventRiskModifier,
    resourceBonus,
    resourcePenalty,
    earlyWarning,
    autoRepairInterval,
    extraDamage,
  }
}

const deriveResourceState = (modules) => {
  const moduleEffects = deriveModuleEffects(modules)
  const synergySummary = calculateSynergySummary(modules)

  const resourceModifiers = { ...moduleEffects }
  RESOURCE_KEYS.forEach((key) => {
    resourceModifiers[key] += synergySummary.resourceBonus[key] ?? 0
    resourceModifiers[key] -= synergySummary.resourcePenalty[key] ?? 0
  })

  return { resourceModifiers, synergySummary }
}

const applyMissionReward = (reward) => {
  const delta = { energy: 0, oxygen: 0, morale: 0 }
  RESOURCE_KEYS.forEach((key) => {
    if (reward?.[key]) {
      delta[key] += reward[key]
    }
  })
  return delta
}

const buildMissionState = (definition, extras = {}) => ({
  ...definition,
  status: 'active',
  cyclesRemaining: definition.timeLimit ?? null,
  progress: 0,
  metadata: extras,
})

export const GameProvider = ({ children }) => {
  const [resources, setResources] = useState(() => ({ ...INITIAL_RESOURCES }))
  const [orbitalTime, setOrbitalTime] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [modulesBuilt, setModulesBuilt] = useState([])
  const [phase, setPhase] = useState('construction')
  const [victoryAchieved, setVictoryAchieved] = useState(false)
  const [activeIncidents, setActiveIncidents] = useState([])
  const [pendingEvent, setPendingEvent] = useState(null)
  const [eventLog, setEventLog] = useState([])
  const [derivedState, setDerivedState] = useState(() => deriveResourceState([]))
  const [activeMission, setActiveMission] = useState(null)
  const [autoRepairTicker, setAutoRepairTicker] = useState(0)

  const modulesRef = useRef(modulesBuilt)
  const incidentsRef = useRef(activeIncidents)
  const pendingEventRef = useRef(pendingEvent)
  const missionRef = useRef(activeMission)
  const resourcesRef = useRef(resources)

  const planetProfile = useMemo(() => resolvePlanetProfile(selectedPlanet), [selectedPlanet])

  const planetEventDeck = useMemo(() => {
    const adjustments = planetProfile.eventWeightAdjustments ?? {}
    if (!adjustments || Object.keys(adjustments).length === 0) {
      return eventDeck
    }

    return eventDeck.map((event) => {
      const baseWeight = event.weight ?? 1
      const multiplier = adjustments[event.id]
      if (!multiplier || multiplier === 1) {
        return event
      }
      const adjustedWeight = Math.max(0, baseWeight * multiplier)
      return { ...event, weight: adjustedWeight }
    })
  }, [planetProfile.eventWeightAdjustments])

  useEffect(() => {
    modulesRef.current = modulesBuilt
  }, [modulesBuilt])

  useEffect(() => {
    incidentsRef.current = activeIncidents
  }, [activeIncidents])

  useEffect(() => {
    pendingEventRef.current = pendingEvent
  }, [pendingEvent])

  useEffect(() => {
    missionRef.current = activeMission
  }, [activeMission])

  useEffect(() => {
    resourcesRef.current = resources
  }, [resources])

  const logEvent = useCallback((message, tone = 'neutral') => {
    setEventLog((prev) => {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        message,
        tone,
        timestamp: Date.now(),
      }
      return [entry, ...prev].slice(0, 10)
    })
  }, [])

  const applyResourceDelta = useCallback((delta) => {
    setResources((prev) => applyResourceDeltaToState(prev, delta))
  }, [])

  const resetGame = useCallback(() => {
    setResources(() => ({ ...INITIAL_RESOURCES }))
    setOrbitalTime(0)
    setGameOver(false)
    setSelectedPlanet(null)
    setModulesBuilt([])
    setPhase('construction')
    setVictoryAchieved(false)
    setActiveIncidents([])
    setPendingEvent(null)
    setEventLog([])
    setDerivedState(deriveResourceState([]))
    setActiveMission(null)
    setAutoRepairTicker(0)
  }, [])

  const selectPlanet = useCallback((planet) => {
    const profile = resolvePlanetProfile(planet)

    setSelectedPlanet(planet)
    setModulesBuilt([])
    setPhase('construction')
    setResources(() => ({ ...profile.resourceBaseline }))
    setOrbitalTime(0)
    setGameOver(false)
    setVictoryAchieved(false)
    setActiveIncidents([])
    setPendingEvent(null)
    setDerivedState(deriveResourceState([]))
    setActiveMission(null)
    setAutoRepairTicker(0)

    setEventLog(() => {
      if (!planet) {
        return []
      }
      const message = planet.environmentSummary
        ? `Aurora calibrates for ${planet.name}. ${planet.environmentSummary}`
        : `Aurora calibrates for ${planet.name}.`
      return [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
          message,
          tone: 'info',
          timestamp: Date.now(),
        },
      ]
    })
  }, [])

  const addModule = useCallback((module) => {
    let createdInstance = null

    setModulesBuilt((prev) => {
      if (prev.length >= planetProfile.habitatSlots) {
        createdInstance = null
        return prev
      }

      const currentOfType = prev.filter((item) => item.id === module.id).length
      const limit = module.maxInstances ?? Infinity
      if (currentOfType >= limit) {
        createdInstance = null
        return prev
      }

      const instance = createModuleInstance(module)
      createdInstance = instance
      const nextModules = [...prev, instance]
      setDerivedState(deriveResourceState(nextModules))
      return nextModules
    })

    if (createdInstance && missionRef.current && missionRef.current.id === 'deploy-support') {
      if (createdInstance.id === 'life-support') {
        setActiveMission((prev) => {
          if (!prev || prev.id !== 'deploy-support' || prev.status !== 'active') {
            return prev
          }
          const rewardDelta = applyMissionReward(prev.reward)
          applyResourceDelta(rewardDelta)
          logEvent('Aurora confirms the life support expansion.', 'positive')
          return { ...prev, status: 'completed' }
        })
      }
    }

    return createdInstance
  }, [applyResourceDelta, logEvent, planetProfile.habitatSlots])

  const removeModule = useCallback((instanceId) => {
    let removedInstance = null

    setModulesBuilt((prev) => {
      const index = prev.findIndex((module) => module.instanceId === instanceId)
      if (index === -1) {
        removedInstance = null
        return prev
      }

      const nextModules = prev.filter((module) => module.instanceId !== instanceId)
      removedInstance = prev[index]
      setDerivedState(deriveResourceState(nextModules))
      return nextModules
    })

    return removedInstance
  }, [])

  const startSimulation = useCallback(() => {
    setPhase('simulation')
    setOrbitalTime(0)
    setVictoryAchieved(false)
    setPendingEvent(null)
    setActiveIncidents([])
    setAutoRepairTicker(0)
    if (!missionRef.current || missionRef.current.trigger !== 'duringSimulation') {
      const candidates = missionDeck.filter((mission) => mission.trigger === 'duringSimulation')
      const selected = pickWeightedRandom(candidates)
      if (selected) {
        setActiveMission(buildMissionState(selected))
        logEvent(`Aurora assigns mission: ${selected.label}.`, 'info')
      }
    }
  }, [logEvent])

  useEffect(() => {
    setDerivedState(deriveResourceState(modulesBuilt))
  }, [modulesBuilt])

  const scheduleRepairMission = useCallback((moduleInstanceId, moduleName) => {
    const definition = missionDeck.find((mission) => mission.id === 'repair-next-cycle')
    if (!definition) {
      return
    }
    const missionState = buildMissionState(definition, { targetModuleId: moduleInstanceId })
    setActiveMission(missionState)
    logEvent(`Aurora issues priority: ${definition.label}.`, 'warning')
    logEvent(`Failure detected in ${moduleName}.`, 'warning')
  }, [logEvent])

  const resolveMissionCompletion = useCallback((mission) => {
    if (!mission) {
      return
    }
    const rewardDelta = applyMissionReward(mission.reward)
    applyResourceDelta(rewardDelta)
    logEvent(`Mission completed: ${mission.label}.`, 'positive')
    setActiveMission({ ...mission, status: 'completed' })
  }, [applyResourceDelta, logEvent])

  const resolveMissionFailure = useCallback((mission) => {
    if (!mission) {
      return
    }
    applyResourceDelta({ morale: -4 })
    logEvent(`Mission failed: ${mission.label}.`, 'critical')
    setActiveMission({ ...mission, status: 'failed' })
  }, [applyResourceDelta, logEvent])

  const repairModule = useCallback((instanceId) => {
    const moduleTarget = modulesRef.current.find((module) => module.instanceId === instanceId)
    if (!moduleTarget || moduleTarget.status !== DAMAGE_STATES.damaged) {
      return false
    }

    const currentResources = resourcesRef.current
    if (currentResources.energy < Math.abs(REPAIR_COST.energy) || currentResources.morale < Math.abs(REPAIR_COST.morale)) {
      logEvent('Insufficient resources to repair the module.', 'warning')
      return false
    }

    applyResourceDelta(REPAIR_COST)

    setModulesBuilt((prev) => {
      const updated = prev.map((module) => {
        if (module.instanceId !== instanceId) {
          return module
        }
        return {
          ...module,
          status: DAMAGE_STATES.operational,
          damageCountdown: null,
          stabilizedBuffer: 0,
        }
      })
      setDerivedState(deriveResourceState(updated))
      return updated
    })

    setActiveIncidents((prev) => prev.filter((incident) => incident.moduleInstanceId !== instanceId))

    logEvent(`Module ${moduleTarget.name} manually stabilized.`, 'positive')

    setActiveMission((prev) => {
      if (!prev || prev.id !== 'repair-next-cycle' || prev.status !== 'active') {
        return prev
      }
      if (prev.metadata?.targetModuleId === instanceId) {
        resolveMissionCompletion(prev)
      }
      return prev
    })

    return true
  }, [applyResourceDelta, logEvent, resolveMissionCompletion])

  const redirectPower = useCallback((instanceId) => {
    const moduleTarget = modulesRef.current.find((module) => module.instanceId === instanceId)
    if (!moduleTarget || moduleTarget.status !== DAMAGE_STATES.damaged) {
      return false
    }

    const currentResources = resourcesRef.current
    if (currentResources.energy < Math.abs(REDIRECT_COST.energy) || currentResources.morale < Math.abs(REDIRECT_COST.morale)) {
      logEvent('No surplus energy available to redirect.', 'warning')
      return false
    }

    applyResourceDelta(REDIRECT_COST)

    setActiveIncidents((prev) => prev.map((incident) => {
      if (incident.moduleInstanceId !== instanceId) {
        return incident
      }
      return {
        ...incident,
        stabilizedBuffer: (incident.stabilizedBuffer ?? 0) + 1,
      }
    }))

    setModulesBuilt((prev) => prev.map((module) => {
      if (module.instanceId !== instanceId) {
        return module
      }
      return { ...module, stabilizedBuffer: (module.stabilizedBuffer ?? 0) + 1 }
    }))

    logEvent(`Power rerouted to module ${moduleTarget.name}.`, 'info')
    return true
  }, [applyResourceDelta, logEvent])

  const ignoreDamage = useCallback((instanceId) => {
    const moduleTarget = modulesRef.current.find((module) => module.instanceId === instanceId)
    if (!moduleTarget || moduleTarget.status !== DAMAGE_STATES.damaged) {
      return false
    }

    setActiveIncidents((prev) => prev.map((incident) => {
      if (incident.moduleInstanceId !== instanceId) {
        return incident
      }
      return {
        ...incident,
        cyclesRemaining: Math.max(1, incident.cyclesRemaining - 1),
      }
    }))

    setModulesBuilt((prev) => prev.map((module) => {
      if (module.instanceId !== instanceId) {
        return module
      }
      const nextCountdown = Math.max(1, (module.damageCountdown ?? 1) - 1)
      return { ...module, damageCountdown: nextCountdown }
    }))

    logEvent(`Ignoring ${moduleTarget.name}'s failure. Risk is increasing.`, 'critical')
    return true
  }, [logEvent])

  const attemptAutoRepair = useCallback((modules, incidents, synergy) => {
    if (!synergy.autoRepairInterval) {
      return { modules, incidents, repaired: false }
    }

    const damaged = modules.find((module) => module.status === DAMAGE_STATES.damaged)
    if (!damaged) {
      return { modules, incidents, repaired: false }
    }

    const updatedModules = modules.map((module) => {
      if (module.instanceId !== damaged.instanceId) {
        return module
      }
      return {
        ...module,
        status: DAMAGE_STATES.operational,
        damageCountdown: null,
        stabilizedBuffer: 0,
      }
    })

    const updatedIncidents = incidents.filter((incident) => incident.moduleInstanceId !== damaged.instanceId)
    logEvent(`Maintenance drone stabilizes ${damaged.name}.`, 'positive')
    return { modules: updatedModules, incidents: updatedIncidents, repaired: true }
  }, [logEvent])

  const applyEventToState = useCallback((event, modules, incidents, synergy) => {
    const candidates = modules.filter((module) => module.status !== DAMAGE_STATES.lost)
    let target = null
    if (event.preferredTargets?.length) {
      target = candidates.find((module) => event.preferredTargets.includes(module.id))
    }
    if (!target && candidates.length) {
      target = candidates[Math.floor(Math.random() * candidates.length)]
    }

    const impactDelta = { energy: 0, oxygen: 0, morale: 0 }
    RESOURCE_KEYS.forEach((key) => {
      if (event.impact?.[key]) {
        impactDelta[key] += event.impact[key]
      }
    })

    let updatedModules = modules.map((module) => ({ ...module }))
    let updatedIncidents = incidents.map((incident) => ({ ...incident }))

    if (target) {
      const countdownBase = event.damage?.escalateAfter ?? 2
      const countdown = Math.max(
        1,
        countdownBase - (synergy.extraDamage ?? 0) - (planetProfile.incidentSeverityModifier ?? 0),
      )

      updatedModules = updatedModules.map((module) => {
        if (module.instanceId !== target.instanceId) {
          return module
        }
        return {
          ...module,
          status: DAMAGE_STATES.damaged,
          damageCountdown: countdown,
          stabilizedBuffer: 0,
        }
      })

      updatedIncidents.push({
        id: `incident-${event.id}-${Date.now()}`,
        eventId: event.id,
        moduleId: target.id,
        moduleInstanceId: target.instanceId,
        cyclesRemaining: countdown,
        ongoingEffect: event.ongoingEffect ?? null,
        stabilizedBuffer: 0,
        label: event.label,
      })

      scheduleRepairMission(target.instanceId, target.name)
      logEvent(event.auroraMessage, 'critical')
    } else {
      logEvent(event.auroraMessage, 'warning')
    }

    return { modules: updatedModules, incidents: updatedIncidents, impactDelta }
  }, [logEvent, planetProfile.incidentSeverityModifier, scheduleRepairMission])

  const processIncidents = useCallback((modules, incidents) => {
    const delta = { energy: 0, oxygen: 0, morale: 0 }
    const updatedModules = modules.map((module) => ({ ...module }))
    const remainingIncidents = []
    const lostModules = []

    incidents.forEach((incident) => {
      const moduleIndex = updatedModules.findIndex((module) => module.instanceId === incident.moduleInstanceId)
      if (moduleIndex === -1) {
        return
      }

      const module = updatedModules[moduleIndex]
      if (module.status === DAMAGE_STATES.lost) {
        return
      }

      if (incident.ongoingEffect) {
        const effectDelta = INCIDENT_EFFECT_MAP[incident.ongoingEffect.type]
        if (effectDelta) {
          RESOURCE_KEYS.forEach((key) => {
            if (effectDelta[key]) {
              delta[key] += effectDelta[key]
            }
          })
        }
      }

      const stabilizedBuffer = Math.max((incident.stabilizedBuffer ?? 0) - 1, 0)
      const holdCountdown = stabilizedBuffer > 0 || module.stabilizedBuffer > 0
      const nextCountdown = holdCountdown ? incident.cyclesRemaining : incident.cyclesRemaining - 1

      if (nextCountdown <= 0) {
        module.status = DAMAGE_STATES.lost
        module.damageCountdown = null
        module.stabilizedBuffer = 0
        lostModules.push(module)
        return
      }

      module.damageCountdown = nextCountdown
      module.stabilizedBuffer = Math.max((module.stabilizedBuffer ?? 0) - 1, 0)
      remainingIncidents.push({
        ...incident,
        cyclesRemaining: nextCountdown,
        stabilizedBuffer,
      })
    })

    return { modules: updatedModules, incidents: remainingIncidents, delta, lostModules }
  }, [])

  const runCycle = useCallback(() => {
    let modules = modulesRef.current.map((module) => ({ ...module }))
    let incidents = incidentsRef.current.map((incident) => ({ ...incident }))
    let pending = pendingEventRef.current ? { ...pendingEventRef.current } : null

    let evaluation = deriveResourceState(modules)
    let { resourceModifiers, synergySummary } = evaluation

    let eventToApply = null
    let predictedEventMessage = null

    if (pending) {
      if (pending.leadTime > 0) {
        pending.leadTime -= 1
          predictedEventMessage = `Upcoming event detected: ${pending.event.label}.`
      } else {
        eventToApply = pending.event
        pending = null
      }
    }

    const lostModulesCount = modules.filter((module) => module.status === DAMAGE_STATES.lost).length
    const totalRiskFromModules =
      modules.reduce((acc, module) => acc + (module.riskFactor ?? 0) * 0.05, 0) +
      (planetProfile.incidentRiskModifier ?? 0)
    const baseEventChance = BASE_EVENT_CHANCE + (planetProfile.eventChanceModifier ?? 0)
    const effectiveEventChance = Math.max(
      0,
      Math.min(0.9, baseEventChance + synergySummary.eventRiskModifier + totalRiskFromModules),
    )

    if (!eventToApply && Math.random() < effectiveEventChance) {
      const selectedEvent = pickWeightedRandom(planetEventDeck)
      if (selectedEvent) {
        if (synergySummary.earlyWarning && !pending) {
          pending = { event: selectedEvent, leadTime: synergySummary.earlyWarning }
          predictedEventMessage = `Aurora predicts: ${selectedEvent.label} in ${synergySummary.earlyWarning} cycle(s).`
        } else {
          eventToApply = selectedEvent
        }
      }
    }

    if (predictedEventMessage) {
      logEvent(predictedEventMessage, 'info')
    }

    let eventImpactDelta = { energy: 0, oxygen: 0, morale: 0 }
    if (eventToApply) {
      const result = applyEventToState(eventToApply, modules, incidents, synergySummary)
      modules = result.modules
      incidents = result.incidents
      eventImpactDelta = result.impactDelta
    }

    const incidentResolution = processIncidents(modules, incidents)
    modules = incidentResolution.modules
    incidents = incidentResolution.incidents
    const incidentDelta = incidentResolution.delta

    incidentResolution.lostModules.forEach((module) => {
      logEvent(`Module ${module.name} has been lost. The void reclaims the slot.`, 'critical')
    })

    let autoTicker = autoRepairTicker + 1
    if (synergySummary.autoRepairInterval && autoTicker >= synergySummary.autoRepairInterval) {
      const autoResult = attemptAutoRepair(modules, incidents, synergySummary)
      if (autoResult.repaired) {
        modules = autoResult.modules
        incidents = autoResult.incidents
        autoTicker = 0
      }
    }
    setAutoRepairTicker(autoTicker)

    evaluation = deriveResourceState(modules)
    resourceModifiers = evaluation.resourceModifiers
    synergySummary = evaluation.synergySummary

    const combinedDecayMultiplier = (synergySummary.decayMultiplier ?? 1) * (planetProfile.decayMultiplier ?? 1)
    const decayBase = {
      energy: BASE_DECAY.energy + (planetProfile.decayOffset.energy ?? 0),
      oxygen: BASE_DECAY.oxygen + (planetProfile.decayOffset.oxygen ?? 0),
      morale: BASE_DECAY.morale + (planetProfile.decayOffset.morale ?? 0),
    }
    const decay = {
      energy: decayBase.energy * combinedDecayMultiplier + INCIDENT_LOSS_PENALTY * lostModulesCount,
      oxygen: decayBase.oxygen * combinedDecayMultiplier + INCIDENT_LOSS_PENALTY * lostModulesCount,
      morale: decayBase.morale * combinedDecayMultiplier + INCIDENT_LOSS_PENALTY * lostModulesCount,
    }

    const totalDelta = { energy: 0, oxygen: 0, morale: 0 }
    RESOURCE_KEYS.forEach((key) => {
      totalDelta[key] += resourceModifiers[key] ?? 0
      totalDelta[key] -= decay[key]
      totalDelta[key] += eventImpactDelta[key] ?? 0
      totalDelta[key] += incidentDelta[key] ?? 0
    })

    applyResourceDelta(totalDelta)

    setModulesBuilt(modules)
    setActiveIncidents(incidents)
    setPendingEvent(pending)
    setDerivedState(evaluation)

    setOrbitalTime((prev) => prev + 1)

    if (!gameOver && !victoryAchieved && orbitalTime + 1 >= SURVIVAL_TARGET_TICKS) {
      setVictoryAchieved(true)
      setPhase('victory')
      logEvent('Aurora holds equilibrium. You have survived.', 'positive')
    }

    const currentMission = missionRef.current
    if (currentMission && currentMission.status === 'active') {
      if (currentMission.id === 'repair-next-cycle') {
        const targetModule = modules.find((module) => module.instanceId === currentMission.metadata?.targetModuleId)
        if (!targetModule || targetModule.status === DAMAGE_STATES.operational) {
          resolveMissionCompletion(currentMission)
        } else if (currentMission.cyclesRemaining <= 0) {
          resolveMissionFailure(currentMission)
        } else {
          setActiveMission({ ...currentMission, cyclesRemaining: currentMission.cyclesRemaining - 1 })
        }
      } else if (currentMission.id === 'oxygen-buffer') {
        const oxygenHigh = resourcesRef.current.oxygen >= 70
        const nextProgress = oxygenHigh ? currentMission.progress + 1 : 0
        if (nextProgress >= 3) {
          resolveMissionCompletion({ ...currentMission, progress: nextProgress })
        } else {
          setActiveMission({ ...currentMission, progress: nextProgress })
        }
      } else if (currentMission.id === 'stabilize-energy') {
        const energyHigh = resourcesRef.current.energy >= 60
        const nextProgress = energyHigh ? currentMission.progress + 1 : 0
        if (nextProgress >= 2) {
          resolveMissionCompletion({ ...currentMission, progress: nextProgress })
        } else {
          setActiveMission({ ...currentMission, progress: nextProgress })
        }
      }
    }
  }, [
    applyEventToState,
    applyResourceDelta,
    attemptAutoRepair,
    autoRepairTicker,
    gameOver,
    logEvent,
    orbitalTime,
    planetEventDeck,
    planetProfile.decayMultiplier,
    planetProfile.decayOffset.energy,
    planetProfile.decayOffset.morale,
    planetProfile.decayOffset.oxygen,
    planetProfile.eventChanceModifier,
    planetProfile.incidentRiskModifier,
    processIncidents,
    resolveMissionCompletion,
    resolveMissionFailure,
    victoryAchieved,
  ])

  useEffect(() => {
    if (Object.values(resources).some((value) => value <= 0) && !gameOver) {
      setGameOver(true)
      setPhase('game-over')
      logEvent('Critical systems depleted. Aurora requires a reboot.', 'critical')
    }
  }, [gameOver, logEvent, resources])

  useEffect(() => {
    if (phase !== 'simulation' || gameOver || victoryAchieved) {
      return undefined
    }

    const intervalId = setInterval(() => {
      runCycle()
    }, TICK_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
    }
  }, [gameOver, phase, runCycle, victoryAchieved])

  const adjustResource = useCallback((key, delta) => {
    setResources((prev) => {
      const nextValue = clamp(prev[key] + delta)
      if (nextValue === prev[key]) {
        return prev
      }
      return { ...prev, [key]: nextValue }
    })
  }, [])

  const increaseEnergy = useCallback((amount = 5) => {
    adjustResource('energy', Math.abs(amount))
  }, [adjustResource])

  const decreaseEnergy = useCallback((amount = 5) => {
    adjustResource('energy', -Math.abs(amount))
  }, [adjustResource])

  const increaseOxygen = useCallback((amount = 5) => {
    adjustResource('oxygen', Math.abs(amount))
  }, [adjustResource])

  const decreaseOxygen = useCallback((amount = 5) => {
    adjustResource('oxygen', -Math.abs(amount))
  }, [adjustResource])

  const increaseMorale = useCallback((amount = 5) => {
    adjustResource('morale', Math.abs(amount))
  }, [adjustResource])

  const decreaseMorale = useCallback((amount = 5) => {
    adjustResource('morale', -Math.abs(amount))
  }, [adjustResource])

  const value = useMemo(() => ({
    energy: resources.energy,
    oxygen: resources.oxygen,
    morale: resources.morale,
    orbitalTime,
    gameOver,
    selectedPlanet,
    modulesBuilt,
    phase,
    resourceModifiers: derivedState.resourceModifiers,
    synergySummary: derivedState.synergySummary,
    activeIncidents,
    pendingEvent,
    victoryAchieved,
    survivalTarget: SURVIVAL_TARGET_TICKS,
    maxHabitatSlots: planetProfile.habitatSlots,
    planetProfile,
    eventLog,
    activeMission,
    increaseEnergy,
    decreaseEnergy,
    increaseOxygen,
    decreaseOxygen,
    increaseMorale,
    decreaseMorale,
    selectPlanet,
    addModule,
    removeModule,
    startSimulation,
    resetGame,
    repairModule,
    redirectPower,
    ignoreDamage,
  }), [
    activeIncidents,
    activeMission,
    addModule,
    removeModule,
    planetProfile,
    decreaseEnergy,
    decreaseMorale,
    decreaseOxygen,
    derivedState.resourceModifiers,
    derivedState.synergySummary,
    eventLog,
    gameOver,
    ignoreDamage,
    increaseEnergy,
    increaseMorale,
    increaseOxygen,
    modulesBuilt,
    orbitalTime,
    pendingEvent,
    redirectPower,
    repairModule,
    resetGame,
    resources.energy,
    resources.morale,
    resources.oxygen,
    selectPlanet,
    startSimulation,
    phase,
    selectedPlanet,
    victoryAchieved,
  ])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}


