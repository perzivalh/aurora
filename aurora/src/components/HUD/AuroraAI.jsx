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
  return incidents.map((incident) => `Incidente activo: ${incident.label} | Ciclos restantes ${incident.cyclesRemaining}.`)
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
      output.push('Protocolos nominales. Aurora es autosuficiente. Preparando informe para la flota.')
      return output
    }

    if (phase !== 'simulation') {
      output.push('Construccion en curso. Prepara la base antes de iniciar la simulacion.')
      if (activeMission && activeMission.status === 'active') {
        output.push(`Mision prioritaria: ${activeMission.description}`)
      }
      return output
    }

    if (gameOver) {
      output.push('Fallo catastrofico detectado. Esperando reinicio de protocolos.')
      return output
    }

    if (energy < 50) {
      output.push('Detecto fluctuaciones en los reactores solares.')
    }
    if (oxygen < 50) {
      output.push('Los niveles de oxigeno descienden peligrosamente.')
    }
    if (morale < 50) {
      output.push('La tripulacion muestra signos de agotamiento.')
    }

    if (output.length === 0) {
      output.push('Todos los sistemas se mantienen dentro de parametros seguros.')
    }

    if (pendingEvent) {
      output.push(`Advertencia temprana: ${pendingEvent.event.label} en ${pendingEvent.leadTime} ciclo(s).`)
    }

    const incidentMessages = buildIncidentMessages(activeIncidents)
    output.push(...incidentMessages)

    if (activeMission && activeMission.status === 'active') {
      output.push(`Objetivo vigente: ${activeMission.description}`)
    }

    if (eventLog.length) {
      output.push(`Bitacora reciente: ${eventLog[0].message}`)
    }

    output.push(`Modificadores activos -> ${summariseModifiers(resourceModifiers)}`)
    if (synergySummary.active?.length) {
      output.push('Los modulos cooperan mejor de lo esperado. Manteniendo sinergias activas.')
    }
    output.push(`Progreso de supervivencia: ${orbitalTime}/${survivalTarget} ciclos`)

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
        <span className="aurora-ai__title">Aurora // IA de supervision</span>
        <span className="aurora-ai__time">Tiempo orbital: {orbitalTime}</span>
        <span className="aurora-ai__context">
          Destino: {selectedPlanet ? selectedPlanet.name : 'Sin asignar'}
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
