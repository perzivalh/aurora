import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ResourceBar from '../components/HUD/ResourceBar.jsx'
import AuroraAI from '../components/HUD/AuroraAI.jsx'
import modulesCatalog from '../data/modules.js'
import { useGame } from '../context/GameContext.jsx'

const MODULE_ICONS = {
  energy: 0x26a1,
  'life-support': 0x1f33f,
  laboratory: 0x1f9ea,
  crew: 0x1f6cc,
  docking: 0x1f680,
  comms: 0x1f4e1,
  maintenance: 0x1f527,
  'cryo-storage': 0x2744,
  'control-center': 0x2699,
  'experimental-reactor': 0x2622,
}

const STATUS_META = {
  operational: { label: 'Operativo', tone: 'stable', symbol: '✔' },
  damaged: { label: 'Dañado', tone: 'warning', symbol: '⚠' },
  lost: { label: 'Perdido', tone: 'critical', symbol: '✖' },
}

const MISSION_STATUS_LABELS = {
  active: 'Activa',
  completed: 'Completada',
  failed: 'Fallida',
}

const formatEffects = (effects = {}) => {
  const labels = { energy: 'En', oxygen: 'Ox', morale: 'Mo' }
  const entries = Object.entries(effects).filter(([, value]) => value !== 0)
  if (!entries.length) {
    return 'Sin efecto directo'
  }
  return entries
    .map(([key, value]) => {
      const prefix = value > 0 ? '+' : ''
      return `${labels[key] ?? key} ${prefix}${value}`
    })
    .join(' / ')
}

const resolveIcon = (moduleId) => {
  const codePoint = MODULE_ICONS[moduleId]
  if (!codePoint) {
    return '?'
  }
  return String.fromCodePoint(codePoint)
}

const formatModifier = (value) => {
  if (!value) {
    return '±0'
  }
  const rounded = Math.round(value * 10) / 10
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

const Game = ({ onExitToMenu }) => {
  const {
    energy,
    oxygen,
    morale,
    gameOver,
    resetGame,
    modulesBuilt,
    addModule,
    removeModule,
    phase,
    startSimulation,
    selectedPlanet,
    resourceModifiers,
    synergySummary,
    activeIncidents,
    eventLog,
    pendingEvent,
    activeMission,
    victoryAchieved,
    survivalTarget,
    orbitalTime,
    repairModule,
    redirectPower,
    ignoreDamage,
    maxHabitatSlots,
    planetProfile,
  } = useGame()

  const [recentModuleId, setRecentModuleId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const audioContextRef = useRef(null)

  const triggerTone = useCallback((frequency = 440) => {
    if (typeof window === 'undefined') {
      return
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) {
      return
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx()
    }

    const ctx = audioContextRef.current
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.04)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.5)

    oscillator.onended = () => {
      oscillator.disconnect()
      gainNode.disconnect()
    }
  }, [])

  const moduleCounts = useMemo(() => {
    return modulesBuilt.reduce((acc, module) => {
      acc[module.id] = (acc[module.id] ?? 0) + 1
      return acc
    }, {})
  }, [modulesBuilt])

  const incidentByModule = useMemo(() => {
    const map = new Map()
    activeIncidents.forEach((incident) => {
      map.set(incident.moduleInstanceId, incident)
    })
    return map
  }, [activeIncidents])

  const modifierSummary = useMemo(
    () => [
      { label: 'Energía', value: resourceModifiers.energy ?? 0 },
      { label: 'Oxígeno', value: resourceModifiers.oxygen ?? 0 },
      { label: 'Moral', value: resourceModifiers.morale ?? 0 },
    ],
    [resourceModifiers],
  )

  const simulationActive = phase === 'simulation'
  const constructionPhase = phase === 'construction'

  const canStartSimulation = modulesBuilt.length >= 3 && constructionPhase

  const handleExitToMenu = () => {
    resetGame()
    if (onExitToMenu) {
      onExitToMenu()
    }
  }

  const handleAddModule = (module) => {
    if (!constructionPhase) {
      return
    }

    if (modulesBuilt.length >= maxHabitatSlots) {
      setFeedback({
        id: 'habitat-capacity',
        type: 'warning',
        text: `Capacidad del hábitat alcanzada. Máximo de ${maxHabitatSlots} módulos.`,
      })
      triggerTone(180)
      return
    }

    const currentCount = moduleCounts[module.id] ?? 0
    const maxSlots = module.maxInstances ?? Number.POSITIVE_INFINITY
    if (currentCount >= maxSlots) {
      setFeedback({
        id: `${module.id}-limit`,
        type: 'warning',
        text: `Límite alcanzado para ${module.name}.`,
      })
      triggerTone(180)
      return
    }

    const created = addModule(module)
    if (!created) {
      return
    }

    setRecentModuleId(created.instanceId)
    setFeedback({
      id: created.instanceId,
      type: 'module',
      text: `${created.name} desplegado. ${created.role}.`,
    })
    triggerTone(module.tone ?? 440)
  }

  const handleRemoveModule = (instanceId) => {
    if (!constructionPhase) {
      return
    }

    const removed = removeModule(instanceId)
    if (!removed) {
      return
    }

    if (recentModuleId === instanceId) {
      setRecentModuleId(null)
    }

    setFeedback({
      id: `${instanceId}-removed`,
      type: 'module',
      text: `${removed.name} retirado del hábitat.`,
    })

    triggerTone(220)
  }

  const handleStartSimulation = () => {
    if (!canStartSimulation) {
      return
    }

    startSimulation()
    setFeedback({
      id: 'simulation-start',
      type: 'phase',
      text: 'Simulación iniciada. Aurora supervisa tus decisiones.',
    })
    triggerTone(320)
  }

  const handleRepair = (module) => {
    const success = repairModule(module.instanceId)
    setFeedback({
      id: `repair-${module.instanceId}`,
      type: success ? 'phase' : 'warning',
      text: success
        ? `${module.name} estabilizado manualmente.`
        : 'Recursos insuficientes para reparar.',
    })
    triggerTone(success ? 560 : 200)
  }

  const handleRedirect = (module) => {
    const success = redirectPower(module.instanceId)
    setFeedback({
      id: `redirect-${module.instanceId}`,
      type: success ? 'info' : 'warning',
      text: success
        ? `Energía redirigida a ${module.name}.`
        : 'Energía insuficiente para redirigir.',
    })
    triggerTone(success ? 480 : 200)
  }

  const handleIgnore = (module) => {
    const success = ignoreDamage(module.instanceId)
    if (success) {
      setFeedback({
        id: `ignore-${module.instanceId}`,
        type: 'warning',
        text: `Ignorando la falla de ${module.name}. Riesgo incrementado.`,
      })
      triggerTone(160)
    }
  }

  useEffect(() => {
    if (!feedback) {
      return undefined
    }

    const timeout = setTimeout(() => {
      setFeedback(null)
    }, 2600)

    return () => {
      clearTimeout(timeout)
    }
  }, [feedback])

  useEffect(() => {
    if (!recentModuleId) {
      return undefined
    }

    const timeout = setTimeout(() => {
      setRecentModuleId(null)
    }, 1200)

    return () => {
      clearTimeout(timeout)
    }
  }, [recentModuleId])

  const missionBanner = useMemo(() => {
    if (!activeMission) {
      return null
    }
    const statusClass = `mission-banner--${activeMission.status}`
    const cyclesInfo =
      typeof activeMission.cyclesRemaining === 'number'
        ? `Ciclos restantes: ${Math.max(activeMission.cyclesRemaining, 0)}`
        : null
    const progressInfo =
      activeMission.id === 'oxygen-buffer' || activeMission.id === 'stabilize-energy'
        ? `Progreso: ${activeMission.progress ?? 0}`
        : null

    return (
      <div className={`mission-banner ${statusClass}`}>
        <div>
          <h3>Aurora // Misión</h3>
          <p>{activeMission.description}</p>
        </div>
        <div className="mission-banner__meta">
          {cyclesInfo && <span>{cyclesInfo}</span>}
          {progressInfo && <span>{progressInfo}</span>}
          <span>Estado: {MISSION_STATUS_LABELS[activeMission.status] ?? activeMission.status}</span>
        </div>
      </div>
    )
  }, [activeMission])

  const synergyList = useMemo(() => synergySummary.active ?? [], [synergySummary])

  return (
    <div className="game-screen">
      <header className="game-screen__header">
        <div>
          <h1>Aurora // Tu hogar en el espacio</h1>
          <p>Monitoreando los recursos críticos de la estación.</p>
        </div>
        {selectedPlanet && (
          <span className="game-screen__badge">Destino: {selectedPlanet.name}</span>
        )}
        {onExitToMenu && (
          <button type="button" className="game-screen__back" onClick={handleExitToMenu}>
            Menú principal
          </button>
        )}
      </header>

      <main className="game-screen__main">
        <section className="game-screen__grid">
          <aside className="build-panel">
            <div className="build-panel__header">
              <h2>Gestión de módulos</h2>
              <p>
                Construye durante la fase de ensamblaje y coordina reparaciones bajo presión. Se requieren al menos tres módulos para iniciar la simulación.
              </p>
            </div>

            {selectedPlanet && (
              <div className="build-panel__planet-meta">
                <span className="build-panel__planet-capacity">Capacidad del hábitat: {maxHabitatSlots} módulos</span>
                {planetProfile.environmentSummary && (
                  <span className="build-panel__planet-hazard">{planetProfile.environmentSummary}</span>
                )}
              </div>
            )}

            {missionBanner}

            {pendingEvent && (
              <div className="mission-banner mission-banner--warning">
                <h3>Alerta temprana</h3>
                <p>
                  Aurora predice: {pendingEvent.event.label} en {pendingEvent.leadTime} ciclo(s).
                </p>
              </div>
            )}

            <div className="build-panel__options">
              {modulesCatalog.map((module) => {
                const currentCount = moduleCounts[module.id] ?? 0
                const maxSlots = module.maxInstances ?? Number.POSITIVE_INFINITY
                const limitLabel = module.maxInstances ?? '\u221e'
                const capacityReached = modulesBuilt.length >= maxHabitatSlots
                const canAdd = constructionPhase && currentCount < maxSlots && !capacityReached

                return (
                  <button
                    key={module.id}
                    type="button"
                    className={`build-panel__option${canAdd ? '' : ' build-panel__option--disabled'}`}
                    onClick={() => handleAddModule(module)}
                    disabled={!canAdd}
                  >
                    <div className="build-panel__option-summary">
                      <span className="build-panel__icon" aria-hidden="true">
                        {resolveIcon(module.id)}
                      </span>
                      <div className="build-panel__option-info">
                        <span className="build-panel__option-name">{module.name}</span>
                        <span className="build-panel__limit">{currentCount}/{limitLabel}</span>
                      </div>
                    </div>
                    <div className="build-panel__option-details">
                      <p>{module.description}</p>
                      <span className="build-panel__option-role">Rol: {module.role}</span>
                      <span className="build-panel__effects">Efectos: {formatEffects(module.effects)}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              className="build-panel__start"
              onClick={handleStartSimulation}
              disabled={!canStartSimulation}
            >
              {simulationActive
                ? 'Simulación en curso'
                : victoryAchieved
                ? 'Simulación completada'
                : 'Iniciar simulación'}
            </button>

            <div className="build-panel__footer">
              <span>Módulos desplegados: {modulesBuilt.length}/{maxHabitatSlots}</span>
              <div className="build-panel__modifiers">
                {modifierSummary.map((item) => (
                  <span key={item.label}>
                    {item.label}: {formatModifier(item.value)}
                  </span>
                ))}
              </div>
              <span>
                Objetivo: {Math.min(orbitalTime, survivalTarget)} / {survivalTarget} ciclos
              </span>
            </div>

            <div className="build-panel__synergies">
              <h3>Sinergias activas</h3>
              {synergyList.length === 0 ? (
                <p>Sin sinergias activas.</p>
              ) : (
                <ul>
                  {synergyList.map((item) => (
                    <li key={item.id} className={`synergy-item synergy-item--${item.tone}`}>
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {feedback && (
              <div className={`build-panel__message build-panel__message--${feedback.type}`}>
                {feedback.text}
              </div>
            )}
          </aside>

          <div className="game-screen__workspace">
            <section className="game-screen__habitat">
              <h2>Hábitat modular</h2>
              <div className="habitat-grid">
                {modulesBuilt.length === 0 ? (
                  <div className="habitat-grid__empty">
                    Selecciona un módulo para construir tu base inicial.
                  </div>
                ) : (
                  modulesBuilt.map((module, index) => {
                    const descriptor = STATUS_META[module.status] ?? STATUS_META.operational
                    const incident = incidentByModule.get(module.instanceId)
                    const cardClassNames = [
                      'habitat-grid__module',
                      module.instanceId === recentModuleId ? 'habitat-grid__module--recent' : '',
                      `habitat-grid__module--${descriptor.tone}`,
                      module.status === 'lost' ? 'habitat-grid__module--lost' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')

                    const editable = constructionPhase
                    const moduleClassName = editable
                      ? `${cardClassNames} habitat-grid__module--editable`
                      : cardClassNames

                    return (
                      <article key={module.instanceId} className={moduleClassName} tabIndex={0}>
                        {editable && (
                          <button
                            type="button"
                            className="habitat-grid__remove"
                            onClick={() => handleRemoveModule(module.instanceId)}
                            aria-label={`Retirar ${module.name}`}
                          >
                            ×
                          </button>
                        )}
                        <div className="habitat-grid__summary">
                          <span className="habitat-grid__icon" aria-hidden="true">
                            {resolveIcon(module.id)}
                          </span>
                          <span className="habitat-grid__name">{module.name}</span>
                          <span className="habitat-grid__slot">Espacio {index + 1}</span>
                        </div>

                        <div className="habitat-grid__details">
                          <div className={`module-status module-status--${descriptor.tone}`} aria-hidden="true">
                            <span className="module-status__symbol" aria-hidden="true">
                              {descriptor.symbol}
                            </span>
                            <span>{descriptor.label}</span>
                            {module.status === 'damaged' && module.damageCountdown != null && (
                              <span className="module-status__timer">/{module.damageCountdown}</span>
                            )}
                          </div>
                          <p>{module.description}</p>
                          <span className="habitat-grid__label">Estado</span>
                          <span className="habitat-grid__status">{descriptor.label}</span>
                          <span className="habitat-grid__label">Rol principal</span>
                          <span className="habitat-grid__status">{module.role}</span>
                          <span className="habitat-grid__label">Efectos</span>
                          <span className="habitat-grid__effects">{formatEffects(module.effects)}</span>

                          {incident && (
                            <div className="habitat-grid__incident">
                              <strong>{incident.label}</strong>
                              <span>Ciclos restantes: {incident.cyclesRemaining}</span>
                            </div>
                          )}

                          {module.status === 'damaged' && (
                            <div className="habitat-grid__actions">
                              <button type="button" onClick={() => handleRepair(module)}>
                                Reparar (-10 En, -2 Mo)
                              </button>
                              <button type="button" onClick={() => handleRedirect(module)}>
                                Redirigir energía (-5 En, -5 Mo)
                              </button>
                              <button type="button" onClick={() => handleIgnore(module)}>
                                Ignorar
                              </button>
                            </div>
                          )}

                          {module.status === 'lost' && (
                            <div className="habitat-grid__incident habitat-grid__incident--lost">
                              <strong>Falla crítica</strong>
                              <span>Módulo fuera de línea.</span>
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </section>

            <section className="game-screen__status-panel">
              <div className="event-feed">
                <h2>Registro de Aurora</h2>
                <ul>
                  {eventLog.slice(0, 6).map((entry) => (
                    <li key={entry.id} className={`event-feed__item event-feed__item--${entry.tone}`}>
                      <span>{entry.message}</span>
                    </li>
                  ))}
                  {eventLog.length === 0 && <li className="event-feed__item">Sin eventos registrados.</li>}
                </ul>
              </div>

              <div className="status-panel__resources" aria-label="Recursos de la estación">
                <ResourceBar label="Energía" value={energy} color="#ffd166" />
                <ResourceBar label="Oxígeno" value={oxygen} color="#06d6a0" />
                <ResourceBar label="Moral" value={morale} color="#118ab2" />
              </div>
            </section>
          </div>
        </section>
      </main>

      <AuroraAI />

      {victoryAchieved && (
        <div className="game-over">
          <div className="game-over__content game-over__content--victory">
            <h2>Hábitat estabilizado</h2>
            <p>Aurora mantiene el equilibrio tras {survivalTarget} ciclos orbitales. La tripulación por fin exhala.</p>
            <button type="button" onClick={resetGame}>
              Preparar nueva simulación
            </button>
          </div>
        </div>
      )}

      {gameOver && !victoryAchieved && (
        <div className="game-over">
          <div className="game-over__content">
            <h2>Simulación fallida</h2>
            <p>Los sistemas críticos se han agotado. Reinicia los protocolos.</p>
            <button type="button" onClick={resetGame}>
              Reiniciar simulación
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game



