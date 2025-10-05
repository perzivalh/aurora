const Home = ({ onStartMission }) => {
  return (
    <div className="home-screen">
      <div className="home-screen__content">
        <span className="home-screen__eyebrow">Proyecto Aurora</span>
        <h1>Aurora // Your Home in Space</h1>
        <p>Simulador de diseno y supervivencia orbital.</p>
        <button type="button" onClick={onStartMission}>
          Iniciar Mision
        </button>
      </div>
      <div className="home-screen__stars" aria-hidden="true" />
    </div>
  )
}

export default Home
