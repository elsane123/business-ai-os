'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/chat',     icon: '🧠', label: 'Brain'    },
  { href: '/focus',    icon: '⚡', label: "Auj'hui"  },
  { href: '/pipeline', icon: '👥', label: 'Pipeline' },
  { href: '/cash',     icon: '💰', label: 'Cash'     },
  { href: '/content',  icon: '📣', label: 'LinkedIn' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f0f1a] border-t border-[#2a2a42] z-50">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-3 flex-1 transition-colors ${
                isActive
                  ? 'text-[#818cf8]'
                  : 'text-[#4b5563] hover:text-[#6b7280]'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={`text-[10px] font-medium ${
                isActive ? 'text-[#818cf8]' : 'text-[#4b5563]'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-[#4f46e5] rounded-t-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
