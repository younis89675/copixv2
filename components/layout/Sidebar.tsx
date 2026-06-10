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
  { group: 'Main', items: [
    { href: '/',          label: 'Dashboard',     Icon: LayoutDashboard },
    { href: '/products',  label: 'Products & BOM', Icon: Package },
    { href: '/quotation', label: 'Quotation',      Icon: FileText },
  ]},
  { group: 'Analysis', items: [
    { href: '/reports',   label: 'RM Impact Report', Icon: TrendingUp },
  ]},
  { group: 'Config', items: [
    { href: '/upload',    label: 'Upload Data',  Icon: Upload },
    { href: '/settings',  label: 'Settings',     Icon: Settings },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const { isLoaded, computedProducts, syncStatus, pullFromCloud, pushToCloud } = useAppStore()

  const syncColor = syncStatus === 'synced' ? 'var(--green)'
    : syncStatus === 'syncing' ? 'var(--accent)'
    : syncStatus === 'error'   ? 'var(--red)'
    : 'var(--text-3)'

  const syncLabel = syncStatus === 'synced'  ? 'Synced'
    : syncStatus === 'syncing' ? 'Syncing…'
    : syncStatus === 'error'   ? 'Sync error'
    : 'Not synced'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">CX</div>
        <div className="logo-title">COPIX</div>
        <div className="logo-sub">Manufacturing Cost Platform</div>
      </div>

      {/* Status */}
      {isLoaded && (
        <div style={{ margin: '10px 10px 0', padding: '8px 10px', borderRadius: 8,
          background: 'var(--green-bg)', border: '1px solid var(--green-mid)',
          display: 'flex', alignItems: 'center', gap: 7 }}>
          <div className="sync-dot" style={{ background: syncStatus === 'syncing' ? 'var(--accent)' : syncStatus === 'error' ? 'var(--red)' : 'var(--green)' }} />
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500, flex: 1 }}>
            {computedProducts.length} products · {syncLabel}
          </span>
          <button onClick={() => pullFromCloud()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', padding: 0 }}
            title="Pull latest from cloud">
            <RefreshCw size={12} style={{ display: 'block' }} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            <div className="nav-group-label">{group}</div>
            {items.map(({ href, label, Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link key={href} href={href}
                  className={`nav-link ${active ? 'active' : ''}`}>
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Sync + theme + footer */}
      <div style={{ padding: '10px 10px 6px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <button className="btn-icon" onClick={toggle} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        {isLoaded && (
          <button className="btn-icon" onClick={() => pushToCloud()} title="Push data to cloud" style={{ flex: 1 }}>
            {syncStatus === 'error' ? <WifiOff size={15} color="var(--red)" /> : <Wifi size={15} color={syncColor} />}
          </button>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="avatar">AY</div>
        <div style={{ flex: 1 }}>
          <div className="footer-name">Younis</div>
          <div className="footer-role">Admin · Costing</div>
        </div>
        <LogOut size={14} style={{ color: 'var(--text-3)', cursor: 'pointer' }} />
      </div>
    </aside>
  )
}
