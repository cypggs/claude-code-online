'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  Settings,
  FolderGit2,
  LayoutDashboard,
} from 'lucide-react'

const menuItems = [
  {
    name: '概览',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: '聊天',
    href: '/dashboard/chat',
    icon: MessageSquare,
  },
  {
    name: '项目',
    href: '/dashboard/projects',
    icon: FolderGit2,
  },
  {
    name: '凭证设置',
    href: '/dashboard/credentials',
    icon: Settings,
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-65px)]">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-purple-50 text-purple-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
