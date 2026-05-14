import { ReactNode } from 'react'

interface CardProps {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  glass?: boolean
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
}

export default function Card({
  header,
  footer,
  children,
  padding = 'md',
  className = '',
  glass = false,
}: CardProps) {
  const baseClasses = 'rounded-xl border border-[#2a2a42]'
  const bgClasses = glass
    ? 'backdrop-blur-sm bg-[#151524]/80'
    : 'bg-[#151524]'

  return (
    <div className={[baseClasses, bgClasses, className].filter(Boolean).join(' ')}>
      {header && (
        <div className="px-6 py-4 border-b border-[#2a2a42]">
          {header}
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-[#2a2a42]">
          {footer}
        </div>
      )}
    </div>
  )
}
