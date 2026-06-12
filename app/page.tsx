'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import Topbar from '@/components/layout/Topbar'
import Dashboard from '@/components/dashboard/Dashboard'
import { BarChart2, Upload, Cloud } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { isLoaded, pullFromCloud } = useAppStore()

  useEffect(() => { if (!isLoaded) pullFromCloud() }, [])

  return (
    <>
      <Topbar
        title="Executive Dashboard"
        subtitle="Control center for costing, profitability, and manufacturing intelligence"
        breadcrumb="Dashboard"
      />
      <div className="page-body">
        {isLoaded ? (
          <Dashboard />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 20, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <BarChart2 size={28} style={{ color: 'var(--text-3)' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6, letterSpacing: '-.3px' }}>No data loaded</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 320 }}>Upload your Excel files or pull the latest snapshot from the cloud to get started.</div>
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
