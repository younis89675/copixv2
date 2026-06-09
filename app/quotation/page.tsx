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
      <Topbar title="Quotation Builder" subtitle="Create professional quotations with live EUR/USD conversion" />
      <div className="page-body">
        {isLoaded
          ? <QuotationComp />
          : (
            <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-3)', fontSize: 13 }}>
              <FileText size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
              <Link href="/upload" style={{ color: 'var(--accent)' }}>Upload data</Link> first to build quotations.
            </div>
          )}
      </div>
    </>
  )
}
