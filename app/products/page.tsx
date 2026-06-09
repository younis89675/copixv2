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
      <Topbar
        title="Products & BOM"
        subtitle={isLoaded ? `${computedProducts.length} products — click any row for BOM drill-down` : 'No data loaded'}
      />
      <div className="page-body">
        {isLoaded
          ? <ProductsTable />
          : (
            <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-3)', fontSize: 13 }}>
              <Package size={32} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-3)' }} />
              <Link href="/upload" style={{ color: 'var(--accent)' }}>Upload data</Link> first to view products.
            </div>
          )}
      </div>
    </>
  )
}
