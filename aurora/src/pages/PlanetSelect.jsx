import { useMemo, useState } from 'react'
import planets from '../data/planets.js'
import { useGame } from '../context/GameContext.jsx'

const PlanetSelect = ({ onConfirm, onBack }) => {
  const { selectPlanet } = useGame()
  const [selectedId, setSelectedId] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const selectedPlanet = useMemo(() => {
    if (!selectedId) {
      return null
    }
    return planets.find((planet) => planet.id === selectedId) ?? null
  }, [selectedId])

  const handleMarkerClick = (planet) => {
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
                selectedId === planet.id ? ' planet-marker--active' : ''
              }`}
              style={{
                left: `${planet.position.x}%`,
                top: `${planet.position.y}%`,
                width: `${planet.size}px`,
                height: `${planet.size}px`,
                background: planet.tint,
              }}
              onClick={() => handleMarkerClick(planet)}
              disabled={!planet.unlocked}
            >
              <span className="planet-marker__label" aria-hidden="true">
                {planet.shortName}
              </span>
              {!planet.unlocked && <span className="planet-marker__lock" aria-hidden="true">??</span>}
            </button>
          ))}
        </div>

        <aside className="planet-info">
          {selectedPlanet ? (
            <>
              <div className="planet-info__header">
                <h2>{selectedPlanet.name}</h2>
                <span
                  className={`planet-info__badge ${
                    selectedPlanet.unlocked ? 'planet-info__badge--ready' : 'planet-info__badge--locked'
                  }`}
                >
                  {selectedPlanet.unlocked ? 'Disponible' : 'Bloqueado'}
                </span>
              </div>
              <p>{selectedPlanet.summary}</p>
              <p className="planet-info__conditions">{selectedPlanet.conditions}</p>
              {!selectedPlanet.unlocked && selectedPlanet.lockedMessage && (
                <p className="planet-info__locked">{selectedPlanet.lockedMessage}</p>
              )}

              <div className="planet-info__actions">
                <button
                  type="button"
                  onClick={() => handleConfirm(selectedPlanet)}
                  disabled={!selectedPlanet.unlocked}
                >
                  {selectedPlanet.unlocked ? 'Confirmar orbita' : 'En desarrollo'}
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
