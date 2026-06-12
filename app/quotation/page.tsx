'use client'
import { useAppStore } from '@/store/appStore'
import Topbar from '@/components/layout/Topbar'
import QuotationComp from '@/components/quotation/Quotation'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export default function QuotationPage() {
  const { isLoaded } = useAppStore()
  return (
    <>
      <Topbar title="Quotation Builder" breadcrumb="Quotation"
        subtitle="Create professional quotations with live EUR/USD conversion and margin analysis" />
      <div className="page-body">
        {isLoaded ? <QuotationComp /> : (
          <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-3)' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>No data loaded</div>
            <Link href="/upload" style={{ color: 'var(--accent)', fontSize: 13 }}>Upload files to build quotations</Link>
          </div>
        )}
      </div>
    </>
  )
}
