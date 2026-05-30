'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const path = usePathname()

  const tabs = [
    { 
      name: 'Home', 
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Projects', 
      href: '/projects',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9" />
        </svg>
      )
    },
    { 
      name: 'Portfolio', 
      href: '/portfolio',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      name: 'Wallet', 
      href: '/wallet',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    { 
      name: 'Impact', 
      href: '/impact',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    }
  ]

  // Only show Admin tab for admin users (optional - check session)
  // For now, add it conditionally if you want
  const adminTab = { 
    name: 'Admin', 
    href: '/admin/projects',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-lg">
      <div className="flex justify-around items-center px-2 py-1 max-w-md mx-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all duration-200 ${
              path === tab.href 
                ? 'text-green-600 bg-green-50' 
                : 'text-gray-500 active:bg-gray-100'
            }`}
          >
            <div className={`transform transition-transform ${path === tab.href ? 'scale-110' : 'scale-100'}`}>
              {tab.icon}
            </div>
            <span className={`text-[10px] font-medium mt-1 ${path === tab.href ? 'text-green-600' : 'text-gray-500'}`}>
              {tab.name}
            </span>
          </Link>
        ))}
        
        {/* Optional: Add Admin tab - only show for admin users */}
        {/* Uncomment below if you want Admin tab always visible */}
        {/* <Link
          href="/admin/projects"
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all duration-200 ${
            path === '/admin/projects' 
              ? 'text-green-600 bg-green-50' 
              : 'text-gray-500 active:bg-gray-100'
          }`}
        >
          <div className={`transform transition-transform ${path === '/admin/projects' ? 'scale-110' : 'scale-100'}`}>
            {adminTab.icon}
          </div>
          <span className={`text-[10px] font-medium mt-1 ${path === '/admin/projects' ? 'text-green-600' : 'text-gray-500'}`}>
            Admin
          </span>
        </Link> */}
      </div>
    </div>
  )
}