'use client'
import { useAppStore } from '@/store/appStore'
import { RefreshCw, Download, Printer } from 'lucide-react'
import { format } from 'date-fns'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { syncStatus, lastSyncAt, pushToCloud, isLoaded } = useAppStore()

  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        {isLoaded && lastSyncAt && (
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Synced {format(new Date(lastSyncAt), 'HH:mm')}
          </span>
        )}
        {isLoaded && (
          <button className="btn-icon" onClick={() => pushToCloud()}
            title="Push to cloud"
            style={{ color: syncStatus === 'syncing' ? 'var(--accent)' : syncStatus === 'error' ? 'var(--red)' : 'var(--text-2)' }}>
            <RefreshCw size={14} style={{ animation: syncStatus === 'syncing' ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        )}
        {actions}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
