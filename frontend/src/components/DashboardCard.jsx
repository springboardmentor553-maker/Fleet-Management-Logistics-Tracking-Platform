function DashboardCard({ title, value, icon, color, subtitle }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-slate-200">
      
      <div className="flex items-center justify-between">
        
        {/* Text */}
        <div>
          <p className="text-sm text-slate-500 font-medium">
            {title}
          </p>

          <h2 className="text-3xl font-bold text-slate-800 mt-2">
            {value}
          </h2>

          {subtitle && (
            <p className="text-xs text-slate-400 mt-2">
              {subtitle}
            </p>
          )}
        </div>

        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl shadow-sm ${color}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

export default DashboardCard;