const Home = ({ onStartMission }) => {
  return (
    <div className="home-screen">
      <div className="home-screen__content">
        <span className="home-screen__eyebrow">Aurora Initiative</span>
        <h1>Your Home in Space</h1>
        <p>Orbital design and survival simulator.</p>
        <button type="button" onClick={onStartMission}>
          Launch Mission
        </button>
      </div>
      <div className="home-screen__stars" aria-hidden="true" />
    </div>
  )
}

export default Home
