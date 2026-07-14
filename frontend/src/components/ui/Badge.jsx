function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
  }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${tones[tone]}`}>
      {children}
    </span>
  )
}
export default Badge