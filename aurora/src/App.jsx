import { useState } from 'react'
import { GameProvider } from './context/GameContext.jsx'
import Home from './pages/Home.jsx'
import PlanetSelect from './pages/PlanetSelect.jsx'
import Game from './pages/Game.jsx'

const App = () => {
  const [view, setView] = useState('home')

  const handleStartMission = () => {
    setView('planetSelect')
  }

  const handlePlanetChosen = () => {
    setView('game')
  }

  const handleReturnHome = () => {
    setView('home')
  }

  return (
    <GameProvider>
      {view === 'home' && <Home onStartMission={handleStartMission} />}
      {view === 'planetSelect' && (
        <PlanetSelect onConfirm={handlePlanetChosen} onBack={handleReturnHome} />
      )}
      {view === 'game' && <Game onExitToMenu={handleReturnHome} />}
    </GameProvider>
  )
}

export default App
