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
      <Topbar title="RM Impact Simulator" breadcrumb="RM Impact Report"
        subtitle="Simulate raw material price changes and their effect on product profitability" />
      <div className="page-body">
        {isLoaded ? <RMImpactReport /> : (
          <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-3)' }}>
            <TrendingUp size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>No data loaded</div>
            <Link href="/upload" style={{ color: 'var(--accent)', fontSize: 13 }}>Upload files to run simulations</Link>
          </div>
        )}
      </div>
    </>
  )
}
