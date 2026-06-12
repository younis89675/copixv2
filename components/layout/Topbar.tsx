'use client'
import { useAppStore } from '@/store/appStore'
import { useTheme } from './ThemeProvider'
import { RefreshCw, Search, Sun, Moon } from 'lucide-react'
import { format } from 'date-fns'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  breadcrumb?: string
}

export default function Topbar({ title, subtitle, actions, breadcrumb }: TopbarProps) {
  const { syncStatus, lastSyncAt, pushToCloud, isLoaded } = useAppStore()
  const { theme, toggle } = useTheme()

  return (
    <div className="topbar">
      {/* Title area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {breadcrumb && (
          <div className="topbar-breadcrumb">
            <span>COPIX</span>
            <span className="topbar-breadcrumb-sep">/</span>
            <span>{breadcrumb}</span>
          </div>
        )}
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>

      {/* Search bar */}
      <div className="topbar-search" style={{ marginLeft: 20 }}>
        <Search size={13} />
        <span>Search products, codes, categories…</span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        {isLoaded && lastSyncAt && (
          <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            Synced {format(new Date(lastSyncAt), 'HH:mm')}
          </span>
        )}
        {isLoaded && (
          <button className="btn-icon" onClick={() => pushToCloud()} title="Sync to cloud"
            style={{ color: syncStatus === 'error' ? 'var(--red)' : 'var(--text-2)' }}>
            <RefreshCw size={13} style={{ animation: syncStatus === 'syncing' ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        )}
        <button className="btn-icon" onClick={toggle} title="Toggle theme">
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
        {actions}
      </div>
    </div>
  )
}
