'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import Topbar from '@/components/layout/Topbar'
import Dashboard from '@/components/dashboard/Dashboard'
import { BarChart2, Upload, Cloud } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { isLoaded, pullFromCloud } = useAppStore()

  // On page load, pull latest from cloud (so teammates see fresh data)
  useEffect(() => {
    if (!isLoaded) pullFromCloud()
  }, [])

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={isLoaded ? 'Manufacturing cost & profitability overview' : 'Pull latest data or upload new files'}
      />
      <div className="page-body">
        {isLoaded ? (
          <Dashboard />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={26} style={{ color: 'var(--text-3)' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 5 }}>No data loaded</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Upload your Excel files or pull the latest data from the cloud</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/upload" className="btn btn-primary"><Upload size={13} /> Upload Files</Link>
              <button className="btn btn-ghost" onClick={() => pullFromCloud()}><Cloud size={13} /> Pull from Cloud</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
