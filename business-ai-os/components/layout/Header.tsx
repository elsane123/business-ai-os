'use client'
import Link from 'next/link'
import { ReactNode } from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
  breadcrumb?: { label: string; href?: string }[]
  actions?: ReactNode
}

export default function Header({
  title,
  subtitle,
  breadcrumb,
  actions,
}: HeaderProps) {
  return (
    <header className="bg-[#0f0f1a]/80 backdrop-blur-sm border-b border-[#2a2a42] px-6 py-4 flex justify-between items-center gap-4 sticky top-0 z-10">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 mb-1" aria-label="Breadcrumb">
            {breadcrumb.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1.5">
                {index > 0 && (
                  <span className="text-gray-600 text-xs select-none">/</span>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-xs text-[#818cf8] hover:text-white transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-xs text-gray-500">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold text-white truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[#818cf8] mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </header>
  )
}
