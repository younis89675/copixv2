'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useAppStore } from '@/store/appStore'
import {
  LayoutDashboard, Package, FileText, TrendingUp,
  Settings, Upload, Moon, Sun, Wifi, WifiOff, RefreshCw, LogOut,
  Database
} from 'lucide-react'

const NAV = [
  { group: 'Workspace', items: [
    { href: '/',          label: 'Dashboard',       Icon: LayoutDashboard },
    { href: '/products',  label: 'Products & BOM',  Icon: Package },
    { href: '/quotation', label: 'Quotation',        Icon: FileText },
  ]},
  { group: 'Intelligence', items: [
    { href: '/reports',   label: 'RM Impact Report', Icon: TrendingUp },
  ]},
  { group: 'Administration', items: [
    { href: '/upload',    label: 'Upload Data',      Icon: Upload },
    { href: '/settings',  label: 'Settings',         Icon: Settings },
  ]},
]

export default function Sidebar() {
  const pathname    = usePathname()
  const { theme, toggle } = useTheme()
  const { isLoaded, computedProducts, syncStatus, pullFromCloud, pushToCloud } = useAppStore()

  const syncColor = syncStatus === 'synced'  ? 'var(--green)'
    : syncStatus === 'syncing' ? 'var(--accent)'
    : syncStatus === 'error'   ? 'var(--red)'
    : 'rgba(255,255,255,.3)'

  const syncLabel = syncStatus === 'synced'  ? 'Cloud synced'
    : syncStatus === 'syncing' ? 'Syncing…'
    : syncStatus === 'error'   ? 'Sync error'
    : 'Not synced'

  return (
    <aside className="sidebar">

      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div className="logo-mark">CX</div>
        <div>
          <div className="logo-title">COPIX</div>
          <div className="logo-sub">Manufacturing ERP</div>
        </div>
      </div>

      {/* ── Data status chip ── */}
      {isLoaded && (
        <div style={{ margin: '10px 10px 0', padding: '7px 10px', borderRadius: 6,
          background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
          display: 'flex', alignItems: 'center', gap: 7 }}>
          <div className="sync-dot" style={{
            background: syncStatus === 'error' ? 'var(--red)' : syncStatus === 'syncing' ? 'var(--accent)' : 'var(--green)',
            animationPlayState: syncStatus === 'syncing' ? 'running' : 'running',
          }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', flex: 1, fontWeight: 500 }}>
            {computedProducts.length} products
          </span>
          <span style={{ fontSize: 10, color: syncColor }}>{syncLabel}</span>
          <button onClick={() => pullFromCloud()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', padding: 0, display: 'flex' }}
            title="Pull from cloud">
            <RefreshCw size={11} />
          </button>
        </div>
      )}

      {/* ── Nav ── */}
      <nav className="sidebar-nav">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            <div className="nav-group-label">{group}</div>
            {items.map(({ href, label, Icon }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
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

      {/* ── Bottom controls ── */}
      <div className="sidebar-bottom">
        <button className="btn-icon" onClick={toggle}
          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.5)' }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        {isLoaded && (
          <button onClick={() => pushToCloud()}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11,
              color: syncStatus === 'error' ? 'var(--red)' : 'rgba(255,255,255,.45)',
              fontFamily: 'inherit' }}>
            {syncStatus === 'error'
              ? <><WifiOff size={12} /> Retry sync</>
              : <><Wifi size={12} /> Push to cloud</>}
          </button>
        )}
      </div>

      {/* ── Footer user ── */}
      <div className="sidebar-footer">
        <div className="avatar">YA</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="footer-name">costing team</div>
          <div className="footer-role">Administrator</div>
        </div>
        <LogOut size={13} style={{ color: 'rgba(255,255,255,.3)', cursor: 'pointer', flexShrink: 0 }} />
      </div>
    </aside>
  )
}
