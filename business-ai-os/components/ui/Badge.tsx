import { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  children: ReactNode
  className?: string
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-[#2a2a42] text-[#818cf8]',
  success: 'bg-green-900/30 text-green-400 border border-green-800/30',
  warning: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/30',
  danger: 'bg-red-900/30 text-red-400 border border-red-800/30',
  info: 'bg-blue-900/30 text-blue-400 border border-blue-800/30',
  purple: 'bg-purple-900/30 text-purple-400 border border-purple-800/30',
}

export default function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}
