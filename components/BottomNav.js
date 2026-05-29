'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const path = usePathname()
  const tabs = [
    { name: 'Dashboard', icon: '📊', href: '/dashboard' },
    { name: 'Projects', icon: '🌍', href: '/projects' },
    { name: 'Portfolio', icon: '📈', href: '/portfolio' },
    { name: 'Wallet', icon: '👛', href: '/wallet' },
    { name: 'Impact', icon: '🌱', href: '/impact' },
    { name: 'Admin', icon: '👨‍💼', href: '/admin/projects' },  // ← ADD THIS
    { name: 'KYC', icon: '🔐', href: '/kyc' },  // ← ADD THIS LINE
  ]
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto">
      <div className="flex justify-around py-2">
        {tabs.map(tab => (
          <Link 
            key={tab.href} 
            href={tab.href} 
            className={`flex flex-col items-center py-1 px-3 rounded-lg ${path === tab.href ? 'text-green-600' : 'text-gray-500'}`}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className="text-xs">{tab.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}