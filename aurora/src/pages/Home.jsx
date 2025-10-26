const Home = ({ onStartMission }) => {
  return (
    <div className="home-screen">
      <div className="home-screen__content">
        <span className="home-screen__eyebrow">Proyecto Aurora</span>
        <h1>Tu hogar en el espacio</h1>
        <p>Simulador de diseño y supervivencia orbital.</p>
        <button type="button" onClick={onStartMission}>
          Iniciar misión
        </button>
      </div>
      <div className="home-screen__stars" aria-hidden="true" />
    </div>
  )
}

export default Home
