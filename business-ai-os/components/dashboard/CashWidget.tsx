interface CashWidgetProps {
  label: string
  value: number
  currency?: string
  variation?: number
  color?: 'green' | 'red' | 'neutral' | 'blue'
  icon?: string
}

const colorClasses: Record<NonNullable<CashWidgetProps['color']>, string> = {
  green: 'text-green-400',
  red: 'text-red-400',
  neutral: 'text-gray-400',
  blue: 'text-[#818cf8]',
}

const variationBg: Record<'positive' | 'negative' | 'neutral', string> = {
  positive: 'bg-green-900/30 text-green-400',
  negative: 'bg-red-900/30 text-red-400',
  neutral: 'bg-[#2a2a42] text-gray-400',
}

function formatCurrency(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function CashWidget({
  label,
  value,
  currency = 'EUR',
  variation,
  color = 'neutral',
  icon,
}: CashWidgetProps) {
  const variationType =
    variation === undefined || variation === 0
      ? 'neutral'
      : variation > 0
      ? 'positive'
      : 'negative'

  return (
    <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-5 flex flex-col gap-3">
      {/* Header: icon + label */}
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-sm text-[#818cf8] font-medium">{label}</span>
      </div>

      {/* Value */}
      <div className={`text-2xl font-bold tabular-nums ${colorClasses[color]}`}>
        {formatCurrency(value, currency)}
      </div>

      {/* Variation badge */}
      {variation !== undefined && (
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
              variationBg[variationType]
            }`}
          >
            {variationType === 'positive' && '↑'}
            {variationType === 'negative' && '↓'}
            {variationType === 'neutral' && '→'}
            {Math.abs(variation).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500">vs période préc.</span>
        </div>
      )}
    </div>
  )
}
