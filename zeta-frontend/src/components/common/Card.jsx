const Card = ({ children, className = '', hover = false, gradient = false }) => {
  const baseClasses = "bg-white rounded-xl shadow-soft p-6 transition-all duration-200";
  const hoverClasses = hover ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer" : "";
  const gradientClasses = gradient ? "bg-gradient-to-br from-primary-500 to-primary-700 text-white" : "";

  return (
    <div className={`${baseClasses} ${hoverClasses} ${gradientClasses} ${className}`}>
      {children}
    </div>
  );
};

export default Card;