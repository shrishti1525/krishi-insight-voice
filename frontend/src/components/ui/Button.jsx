function Button({ children, variant = "primary", ...props }) {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors duration-150"
  const variants = {
    primary: "bg-primary text-white hover:bg-green-800",
    secondary: "bg-white text-primary border border-primary hover:bg-green-50",
    ghost: "text-text hover:bg-gray-100",
  }
  return (
    <button className={`${base} ${variants[variant]}`} {...props}>
      {children}
    </button>
  )
}
export default Button