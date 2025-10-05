const clampPercentage = (value) => {
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

const ResourceBar = ({ label, value, color }) => {
  const safeValue = clampPercentage(value)

  const progressAngle = (safeValue / 100) * 360
  const percentageLabel = `${Math.round(safeValue)}%`

  return (
    <div
      className="resource-bar"
      style={{ '--resource-color': color, '--resource-angle': `${progressAngle}deg` }}
    >
      <div className="resource-bar__ring" role="img" aria-label={`${label} at ${percentageLabel}`}>
        <span className="resource-bar__value">{percentageLabel}</span>
      </div>
      <span className="resource-bar__label">{label}</span>
    </div>
  )
}

export default ResourceBar
