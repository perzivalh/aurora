import { useMemo, useState } from 'react'
import planets from '../data/planets.js'
import { useGame } from '../context/GameContext.jsx'

const ORBIT_RADII = Array.from(new Set(planets.map((planet) => planet.layout?.orbitRadius))).sort((a, b) => a - b)

const toCartesian = (orbitRadius, angle) => {
  const radians = (angle * Math.PI) / 180
  const radius = orbitRadius / 2
  const x = 50 + radius * Math.cos(radians)
  const y = 50 + radius * Math.sin(radians)
  return { x, y }
}

const PlanetSelect = ({ onConfirm, onBack }) => {
  const { selectPlanet } = useGame()
  const [activePlanetId, setActivePlanetId] = useState(() => {
    const unlocked = planets.find((planet) => planet.unlocked)
    return unlocked ? unlocked.id : planets[0]?.id
  })

  const activePlanet = useMemo(() => planets.find((planet) => planet.id === activePlanetId) ?? planets[0], [activePlanetId])

  const handleSelect = (planet) => {
    if (!planet.unlocked) {
      return
    }
    selectPlanet(planet)
    onConfirm?.()
  }

  const handleActivate = (planet) => {
    setActivePlanetId(planet.id)
  }

  return (
    <div className="planet-select planet-select--map">
      <header className="planet-select__header">
        <div>
          <span className="planet-select__eyebrow">Fase de despliegue</span>
          <h1>Selecciona tu entorno orbital</h1>
          <p>Visualiza el sistema y elige dónde establecer la plataforma Aurora.</p>
        </div>
        {onBack && (
          <button type="button" className="planet-select__back" onClick={onBack}>
            Volver
          </button>
        )}
      </header>

      <div className="planet-select__layout">
        <div className="solar-map" role="listbox" aria-label="Seleccionar planeta">
          <div className="solar-map__sun">
            <span>Sol</span>
          </div>

          {ORBIT_RADII.map((orbit) => (
            <div key={orbit} className="solar-orbit" style={{ width: `${orbit}%`, height: `${orbit}%` }} />
          ))}

          {planets.map((planet) => {
            const { orbitRadius, angle, size, color } = planet.layout
            const position = toCartesian(orbitRadius, angle)
            return (
              <button
                key={planet.id}
                type="button"
                role="option"
                aria-selected={activePlanet?.id === planet.id}
                className={`planet-node${planet.unlocked ? '' : ' planet-node--locked'}${activePlanet?.id === planet.id ? ' planet-node--active' : ''}`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  background: color,
                }}
                onMouseEnter={() => handleActivate(planet)}
                onFocus={() => handleActivate(planet)}
                onMouseLeave={() => {}}
                onBlur={() => {}}
                onClick={() => handleSelect(planet)}
                disabled={!planet.unlocked}
              >
                <span className="planet-node__label" aria-hidden="true">
                  {planet.shortName}
                </span>
                {!planet.unlocked && <span className="planet-node__lock" aria-hidden="true">??</span>}
              </button>
            )
          })}
        </div>

        <aside className="planet-info" aria-live="polite">
          <div className="planet-info__header">
            <h2>{activePlanet?.name}</h2>
            <span
              className={`planet-info__badge ${activePlanet?.unlocked ? 'planet-info__badge--ready' : 'planet-info__badge--locked'}`}
            >
              {activePlanet?.unlocked ? 'Disponible' : 'Bloqueado'}
            </span>
          </div>
          <p>{activePlanet?.summary}</p>
          <p className="planet-info__conditions">{activePlanet?.conditions}</p>
          {!activePlanet?.unlocked && activePlanet?.lockedMessage && (
            <p className="planet-info__locked">{activePlanet.lockedMessage}</p>
          )}

          <div className="planet-info__actions">
            <button
              type="button"
              onClick={() => activePlanet && handleSelect(activePlanet)}
              disabled={!activePlanet?.unlocked}
            >
              {activePlanet?.unlocked ? 'Confirmar órbita' : 'En desarrollo'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default PlanetSelect


