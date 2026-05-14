'use client'
import { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
  hint?: string
}

export default function Input({
  label,
  error,
  icon,
  hint,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm text-[#818cf8] mb-1 font-medium"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#818cf8]">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          {...props}
          className={[
            'bg-[#1e1e30] border rounded-lg px-3 py-2.5 text-sm text-white w-full',
            'placeholder-gray-500 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30',
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-[#2a2a42] focus:border-[#4f46e5]',
            icon ? 'pl-10' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      )}
    </div>
  )
}
