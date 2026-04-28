const COLORS = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  red:    { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
}

export default function KpiCard({ label, value, sub, color = 'blue', icon }) {
  const c = COLORS[color] ?? COLORS.blue

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
      {icon && (
        <div className={`flex-shrink-0 rounded-lg w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-lg border ${c.bg} ${c.text} ${c.border}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{label}</p>
        <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
