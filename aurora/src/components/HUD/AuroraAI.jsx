import { useMemo } from 'react'
import { useGame } from '../../context/GameContext.jsx'

const summariseModifiers = (modifiers) => {
  const labels = {
    energy: 'En',
    oxygen: 'Ox',
    morale: 'Mo',
  }

  return Object.entries(modifiers)
    .map(([key, value]) => {
      if (value === 0) {
        return `${labels[key] ?? key}:0`
      }
      const prefix = value > 0 ? '+' : ''
      const rounded = Math.round(value * 10) / 10
      return `${labels[key] ?? key}:${prefix}${rounded}`
    })
    .join(' ')
}

const buildIncidentMessages = (incidents) => {
  if (!incidents.length) {
    return []
  }
  return incidents.map((incident) => `Active incident: ${incident.label} | Cycles remaining ${incident.cyclesRemaining}.`)
}

const AuroraAI = () => {
  const {
    energy,
    oxygen,
    morale,
    orbitalTime,
    phase,
    selectedPlanet,
    resourceModifiers,
    synergySummary,
    victoryAchieved,
    survivalTarget,
    gameOver,
    activeIncidents,
    eventLog,
    activeMission,
    pendingEvent,
  } = useGame()

  const messages = useMemo(() => {
    const output = []

    if (victoryAchieved) {
      output.push('Nominal protocols. Aurora is self-sustaining. Preparing a report for the fleet.')
      return output
    }

    if (phase !== 'simulation') {
      output.push('Construction in progress. Prepare the base before starting the simulation.')
      if (activeMission && activeMission.status === 'active') {
        output.push(`Priority mission: ${activeMission.description}`)
      }
      return output
    }

    if (gameOver) {
      output.push('Catastrophic failure detected. Awaiting protocol reset.')
      return output
    }

    if (energy < 50) {
      output.push('Detecting fluctuations in the solar reactors.')
    }
    if (oxygen < 50) {
      output.push('Oxygen levels are dropping to critical thresholds.')
    }
    if (morale < 50) {
      output.push('The crew is showing signs of exhaustion.')
    }

    if (output.length === 0) {
      output.push('All systems remain within safe parameters.')
    }

    if (pendingEvent) {
      output.push(`Early warning: ${pendingEvent.event.label} in ${pendingEvent.leadTime} cycle(s).`)
    }

    const incidentMessages = buildIncidentMessages(activeIncidents)
    output.push(...incidentMessages)

    if (activeMission && activeMission.status === 'active') {
      output.push(`Active objective: ${activeMission.description}`)
    }

    if (eventLog.length) {
      output.push(`Recent log: ${eventLog[0].message}`)
    }

      output.push(`Active modifiers -> ${summariseModifiers(resourceModifiers)}`)
    if (synergySummary.active?.length) {
      output.push('Modules are cooperating better than projected. Synergies remain active.')
    }
    output.push(`Survival progress: ${orbitalTime}/${survivalTarget} cycles`)

    return output
  }, [
    activeIncidents,
    activeMission,
    energy,
    eventLog,
    gameOver,
    morale,
    orbitalTime,
    oxygen,
    pendingEvent,
    phase,
    resourceModifiers,
    survivalTarget,
    synergySummary.active,
    victoryAchieved,
  ])

  return (
    <div className="aurora-ai">
      <div className="aurora-ai__header">
        <span className="aurora-ai__title">Aurora // Oversight AI</span>
        <span className="aurora-ai__time">Orbital time: {orbitalTime}</span>
        <span className="aurora-ai__context">
          Destination: {selectedPlanet ? selectedPlanet.name : 'Unassigned'}
        </span>
      </div>
      <div className="aurora-ai__body">
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
    </div>
  )
}

export default AuroraAI
