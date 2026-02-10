export default function GlobeBackground() {
  const arcs = Array.from({ length: 12 }).map((_, i) => {
    const startAngle = Math.random() * Math.PI * 2
    const endAngle = startAngle + (Math.random() * Math.PI / 1.2)
    const r = 180
    const cx = 200, cy = 200
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const ctrlX = cx + (Math.random() * 60 - 30)
    const ctrlY = cy - (Math.random() * 120 + 40)
    const colors = ["#06b6d4", "#3b82f6", "#6366f1"]
    const color = colors[Math.floor(Math.random() * colors.length)]
    return { d: `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`, color, idx: i }
  })

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <defs>
          <radialGradient id="globeGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#0a2a6b" />
            <stop offset="100%" stopColor="#062056" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="180" fill="url(#globeGrad)" />
        <circle cx="200" cy="200" r="190" fill="none" stroke="#ffffff" strokeOpacity="0.25" />
        {arcs.map(a => (
          <path key={a.idx} d={a.d} fill="none" stroke={a.color} strokeWidth="2"
            strokeDasharray="6 10" >
            <animate attributeName="stroke-dashoffset" from="40" to="0" dur="1s" repeatCount="indefinite" />
          </path>
        ))}
      </svg>
      <div className="absolute w-full bottom-0 inset-x-0 h-40 bg-gradient-to-b from-transparent to-white" />
    </div>
  )
}
