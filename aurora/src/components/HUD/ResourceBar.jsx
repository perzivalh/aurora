const clampPercentage = (value) => {
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

const ResourceBar = ({ label, value, color }) => {
  const safeValue = clampPercentage(value)

  return (
    <div className="resource-bar">
      <div className="resource-bar__header">
        <span className="resource-bar__label">{label}</span>
        <span className="resource-bar__value">{Math.round(safeValue)}%</span>
      </div>
      <div className="resource-bar__track">
        <div
          className="resource-bar__fill"
          style={{ width: `${safeValue}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default ResourceBar
