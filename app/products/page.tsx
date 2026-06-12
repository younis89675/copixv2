'use client'
import { useAppStore } from '@/store/appStore'
import Topbar from '@/components/layout/Topbar'
import ProductsTable from '@/components/products/ProductsTable'
import { Package } from 'lucide-react'
import Link from 'next/link'

export default function ProductsPage() {
  const { isLoaded, computedProducts } = useAppStore()
  return (
    <>
      <Topbar title="Products & BOM" breadcrumb="Products"
        subtitle={isLoaded ? `${computedProducts.length} finished goods — click any row for BOM drill-down` : 'No data loaded'} />
      <div className="page-body">
        {isLoaded ? <ProductsTable /> : (
          <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-3)' }}>
            <Package size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>No data loaded</div>
            <Link href="/upload" style={{ color: 'var(--accent)', fontSize: 13 }}>Upload files to view products</Link>
          </div>
        )}
      </div>
    </>
  )
}
