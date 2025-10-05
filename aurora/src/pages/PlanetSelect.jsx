import planets from '../data/planets.js'
import { useGame } from '../context/GameContext.jsx'

const PlanetSelect = ({ onConfirm, onBack }) => {
  const { selectPlanet } = useGame()

  const handleSelect = (planet) => {
    selectPlanet(planet)
    if (onConfirm) {
      onConfirm()
    }
  }

  return (
    <div className="planet-select">
      <header className="planet-select__header">
        <div>
          <span className="planet-select__eyebrow">Fase de despliegue</span>
          <h1>Selecciona tu entorno orbital</h1>
          <p>Evalua riesgos y recursos antes de iniciar la construccion.</p>
        </div>
        {onBack && (
          <button type="button" className="planet-select__back" onClick={onBack}>
            Volver
          </button>
        )}
      </header>

      <div className="planet-select__grid">
        {planets.map((planet) => (
          <button
            key={planet.id}
            type="button"
            className="planet-card"
            onClick={() => handleSelect(planet)}
          >
            <div className="planet-card__visual" style={{ background: planet.gradient }} />
            <div className="planet-card__body">
              <h2>{planet.name}</h2>
              <p>{planet.summary}</p>
              <span>{planet.conditions}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default PlanetSelect
