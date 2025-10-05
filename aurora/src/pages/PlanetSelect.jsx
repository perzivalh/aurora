import { useMemo, useState } from 'react'
import planets from '../data/planets.js'
import { useGame } from '../context/GameContext.jsx'

const PlanetSelect = ({ onConfirm, onBack }) => {
  const { selectPlanet } = useGame()
  const [selectedId, setSelectedId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const selectedPlanet = useMemo(() => {
    if (!selectedId) {
      return null
    }
    return planets.find((planet) => planet.id === selectedId) ?? null
  }, [selectedId])

  const displayPlanet = useMemo(() => {
    const activeId = hoveredId ?? selectedId
    if (!activeId) {
      return null
    }
    return planets.find((planet) => planet.id === activeId) ?? null
  }, [hoveredId, selectedId])

  const handleMarkerClick = (planet) => {
    if (!planet.unlocked) {
      return
    }
    setSelectedId(planet.id)
  }

  const handleConfirm = (planet) => {
    if (!planet?.unlocked) {
      return
    }
    setSelectedId(planet.id)
    selectPlanet(planet)
    onConfirm?.()
  }

  const handleHover = (planet) => {
    setHoveredId(planet.id)
  }

  const handleHoverEnd = () => {
    setHoveredId(null)
  }

  const toggleFullscreen = () => {
    setIsFullscreen((value) => !value)
  }

  return (
    <div className={`planet-select planet-select--map${isFullscreen ? ' planet-select--fullscreen' : ''}`}>
      <header className="planet-select__header">
        <div>
          <span className="planet-select__eyebrow">Fase de despliegue</span>
          <h1>Selecciona tu entorno orbital</h1>
          <p>Visualiza el sistema y elige donde establecer la plataforma Aurora.</p>
        </div>
        <div className="planet-select__controls">
          <button
            type="button"
            className="planet-select__toggle"
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? 'Cerrar vista expandida' : 'Vista expandida'}
          </button>
          {onBack && (
            <button type="button" className="planet-select__back" onClick={onBack}>
              Volver
            </button>
          )}
        </div>
      </header>

      <div className="planet-select__layout">
        <div className="solar-canvas" role="listbox" aria-label="Seleccionar planeta">
          <div className="solar-canvas__bg" />
          <div className="solar-canvas__sun" aria-hidden="true">
            <span>Sol</span>
          </div>

          {planets.map((planet) => (
            <button
              key={planet.id}
              type="button"
              role="option"
              aria-selected={selectedId === planet.id}
              className={`planet-marker${planet.unlocked ? '' : ' planet-marker--locked'}${
                displayPlanet?.id === planet.id ? ' planet-marker--active' : ''
              }`}
              style={{
                left: `${planet.position.x}%`,
                top: `${planet.position.y}%`,
                width: `${planet.size}px`,
                height: `${planet.size}px`,
                background: planet.tint,
              }}
              onMouseEnter={() => handleHover(planet)}
              onFocus={() => handleHover(planet)}
              onMouseLeave={handleHoverEnd}
              onBlur={handleHoverEnd}
              onClick={() => handleMarkerClick(planet)}
              disabled={!planet.unlocked}
            >
              <span className="planet-marker__label" aria-hidden="true">
                {planet.shortName}
              </span>
              {!planet.unlocked && <span className="planet-marker__lock" aria-hidden="true">??</span>}
            </button>
          ))}

          {displayPlanet && (
            <div
              className="planet-tooltip"
              style={{
                left: `${displayPlanet.position.x}%`,
                top: `${displayPlanet.position.y}%`,
              }}
            >
              <strong>{displayPlanet.name}</strong>
              <span>{displayPlanet.summary}</span>
              <small>{displayPlanet.conditions}</small>
              {!displayPlanet.unlocked && displayPlanet.lockedMessage && (
                <em>{displayPlanet.lockedMessage}</em>
              )}
            </div>
          )}
        </div>

        <aside className="planet-info">
          {displayPlanet ? (
            <>
              <div className="planet-info__header">
                <h2>{displayPlanet.name}</h2>
                <span
                  className={`planet-info__badge ${
                    displayPlanet.unlocked ? 'planet-info__badge--ready' : 'planet-info__badge--locked'
                  }`}
                >
                  {displayPlanet.unlocked ? 'Disponible' : 'Bloqueado'}
                </span>
              </div>
              <p>{displayPlanet.summary}</p>
              <p className="planet-info__conditions">{displayPlanet.conditions}</p>
              {!displayPlanet.unlocked && displayPlanet.lockedMessage && (
                <p className="planet-info__locked">{displayPlanet.lockedMessage}</p>
              )}

              <div className="planet-info__actions">
                <button
                  type="button"
                  onClick={() => handleConfirm(displayPlanet)}
                  disabled={!displayPlanet.unlocked}
                >
                  {displayPlanet.unlocked ? 'Confirmar orbita' : 'En desarrollo'}
                </button>
              </div>
            </>
          ) : (
            <div className="planet-info__empty">
              <h2>Selecciona un planeta</h2>
              <p>Explora el sistema para ver su informacion y confirmar tu destino.</p>
            </div>
          )}
        </aside>
      </div>

      {isFullscreen && selectedPlanet?.unlocked && (
        <div className="planet-select__floating-action">
          <button type="button" onClick={() => handleConfirm(selectedPlanet)}>
            Confirmar orbita en {selectedPlanet.name}
          </button>
        </div>
      )}
    </div>
  )
}

export default PlanetSelect
