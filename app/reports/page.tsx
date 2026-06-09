'use client'
import { useAppStore } from '@/store/appStore'
import Topbar from '@/components/layout/Topbar'
import RMImpactReport from '@/components/reports/RMImpactReport'
import { TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
  const { isLoaded } = useAppStore()
  return (
    <>
      <Topbar title="RM Impact Report" subtitle="Simulate how raw material price changes affect product profitability" />
      <div className="page-body">
        {isLoaded
          ? <RMImpactReport />
          : (
            <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-3)', fontSize: 13 }}>
              <TrendingUp size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
              <Link href="/upload" style={{ color: 'var(--accent)' }}>Upload data</Link> first to run impact analysis.
            </div>
          )}
      </div>
    </>
  )
}
