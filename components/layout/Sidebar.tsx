'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useAppStore } from '@/store/appStore'
import {
  LayoutDashboard, Package, FileText, TrendingUp,
  Settings, Upload, Moon, Sun, LogOut, Wifi, WifiOff, RefreshCw
} from 'lucide-react'

const NAV = [
  { group: 'MAIN', items: [
    { href: '/',         label: 'Dashboard',     Icon: LayoutDashboard },
    { href: '/products',  label: 'Products & BOM', Icon: Package },
    { href: '/quotation', label: 'Quotation',      Icon: FileText },
  ]},
  { group: 'ANALYSIS', items: [
    { href: '/reports',   label: 'RM Impact Report', Icon: TrendingUp },
  ]},
  { group: 'CONFIG', items: [
    { href: '/upload',    label: 'Upload Data',  Icon: Upload },
    { href: '/settings',  label: 'Settings',     Icon: Settings },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const { isLoaded, computedProducts, syncStatus, pullFromCloud, pushToCloud } = useAppStore()

  // تحديد ألوان الأيقونات وحالة المزامنة بناءً على الستيت
  const syncIconColor = syncStatus === 'synced' ? 'text-emerald-400'
    : syncStatus === 'syncing' ? 'text-sky-400'
    : syncStatus === 'error'   ? 'text-rose-400'
    : 'text-slate-400'

  const syncLabel = syncStatus === 'synced'  ? 'Synced'
    : syncStatus === 'syncing' ? 'Syncing…'
    : syncStatus === 'error'   ? 'Sync error'
    : 'Not synced'

  return (
    <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col h-screen border-r border-slate-800 font-sans select-none flex-shrink-0">
      {/* Logo Section */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/60">
        <div className="h-9 w-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-sm shadow-sky-600/20">
          CX
        </div>
        <div>
          <div className="font-bold text-white text-base tracking-wide leading-tight">COPIX</div>
          <div className="text-[10px] text-slate-400 font-medium tracking-tight">Manufacturing Cost Platform</div>
        </div>
      </div>

      {/* Cloud Status Indicator */}
      {isLoaded && (
        <div className="mx-4 mt-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/30 flex items-center gap-2.5">
          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${syncStatus === 'syncing' ? 'bg-sky-400 animate-pulse' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <span className="text-[11px] text-emerald-400/90 font-medium flex-1 tracking-wide">
            {computedProducts.length} products · {syncLabel}
          </span>
          <button 
            onClick={() => pullFromCloud()}
            className="text-emerald-400/70 hover:text-emerald-400 transition-colors p-0.5 rounded hover:bg-emerald-900/30"
            title="Pull latest from cloud"
          >
            <RefreshCw size={12} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {NAV.map(({ group, items }) => (
          <div key={group} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
              {group}
            </div>
            {items.map(({ href, label, Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-150 ${
                    active
                      ? 'bg-sky-600/15 text-sky-400 border-l-2 border-sky-500 rounded-l-none pl-2.5'
                      : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={15} className={active ? 'text-sky-400' : 'text-slate-500'} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Quick Actions (Theme + Sync) */}
      <div className="px-4 py-2 border-t border-slate-800/60 flex gap-2">
        <button 
          className="p-2 rounded-lg bg-slate-800/40 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center"
          onClick={toggle} 
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        
        {isLoaded && (
          <button 
            className="flex-1 py-2 px-3 rounded-lg bg-slate-800/40 border border-slate-800 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            onClick={() => pushToCloud()} 
            title="Push data to cloud"
          >
            {syncStatus === 'error' ? (
              <>
                <WifiOff size={14} className="text-rose-400" />
                <span className="text-[11px] font-medium text-rose-400">Offline</span>
              </>
            ) : (
              <>
                <Wifi size={14} className={syncIconColor} />
                <span className="text-[11px] font-medium text-slate-400">Push to Cloud</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* User Footer Section */}
      <div className="p-4 bg-[#0b111e] border-t border-slate-800/80 flex items-center gap-3">
        {/* دائرة AY المثالية المقاومة لأي تشويه أبعاد */}
        <div className="h-8 w-8 rounded-full bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xs font-bold tracking-wider flex-shrink-0">
          AY
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-200 truncate leading-tight">Younis</div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">Admin · Costing</div>
        </div>
        <button className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded hover:bg-slate-800/30">
          <LogOut size={13} />
        </button>
      </div>
    </aside>
  )
}