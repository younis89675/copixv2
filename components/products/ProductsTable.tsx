'use client'
import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight, X, Download, Printer } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { formatCurrency, formatPct } from '@/lib/formatters'
import type { ComputedProduct, BOMTreeNode } from '@/types'
import * as XLSX from 'xlsx'

export default function ProductsTable() {
  const { computedProducts, settings } = useAppStore()
  const [search, setSearch]   = useState('')
  const [cat, setCat]         = useState('')
  const [prof, setProf]       = useState('')
  const [selected, setSelected] = useState<ComputedProduct | null>(null)

  const categories = useMemo(() => [...new Set(computedProducts.map(p => p.category))].sort(), [computedProducts])

  const filtered = useMemo(() => computedProducts.filter(p => {
    const s = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search)
    const c = !cat || p.category === cat
    const pr = !prof || p.profitabilityClass === prof
    return s && c && pr
  }), [computedProducts, search, cat, prof])

  const f = (v: number) => formatCurrency(v, settings.displayCurrency, settings.exchangeRateLYD)

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(p => ({
      Code: p.code, Name: p.name, Category: p.category, Unit: p.unit,
      Weight: p.netWeight, Price: p.companyPrice, 'Net Sale': p.netSalePrice,
      'RM Cost': p.costs.rmCost, 'PK Cost': p.costs.pkCost,
      'Wt.Exp': p.costs.weightExpense, 'Total Cost': p.costs.totalCost,
      Insurance: p.costs.insurance, 'Total+Ins': p.costs.totalCostWithInsurance,
      'Net Profit': p.netProfit, 'Profit %': +p.netProfitPct.toFixed(2),
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    XLSX.writeFile(wb, 'COPIX_Products.xlsx')
  }

  const profitClass = (p: ComputedProduct) =>
    p.netProfitPct >= 20 ? 'profit-high' : p.netProfitPct >= 10 ? 'profit-medium' : p.netProfitPct >= 0 ? 'profit-low' : 'profit-neg'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Toolbar */}
      <div className="card" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: 28 }} placeholder="Search name or code…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 180 }} value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c.replace('فئة الصنف ','').replace('فئة ','')}</option>)}
          </select>
          <select className="input" style={{ width: 130 }} value={prof} onChange={e => setProf(e.target.value)}>
            <option value="">All margins</option>
            <option value="high">High (≥20%)</option>
            <option value="medium">Good (10-20%)</option>
            <option value="low">Low (0-10%)</option>
            <option value="negative">Negative</option>
          </select>
          <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            {filtered.length} of {computedProducts.length}
          </span>
          <button className="btn btn-ghost" onClick={exportExcel} style={{ marginLeft: 'auto' }}>
            <Download size={13} /> Excel
          </button>
          <button className="btn btn-ghost" onClick={() => window.print()}>
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
          <table className="table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
              <tr>
                <th>Code</th><th>Product Name</th><th>Category</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Net Sale</th>
                <th style={{ textAlign: 'right' }}>RM Cost</th>
                <th style={{ textAlign: 'right' }}>PK Cost</th>
                <th style={{ textAlign: 'right' }}>Wt.Exp</th>
                <th style={{ textAlign: 'right' }}>Total Cost</th>
                <th style={{ textAlign: 'right' }}>Ins. 10%</th>
                <th style={{ textAlign: 'right' }}>Total+Ins</th>
                <th style={{ textAlign: 'right' }}>Net Profit</th>
                <th>Margin</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.code} style={{ cursor: 'pointer' }} onClick={() => setSelected(p)}>
                  <td><span className="num" style={{ color: 'var(--accent)', fontSize: 11 }}>{p.code}</span></td>
                  <td style={{ maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</td>
                  <td style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-3)', fontSize: 11 }}>
                    {p.category.replace('فئة الصنف ','').replace('فئة ','')}
                  </td>
                  <td className="num" style={{ textAlign: 'right' }}>{f(p.companyPrice)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{f(p.netSalePrice)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{f(p.costs.rmCost)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{f(p.costs.pkCost)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{f(p.costs.weightExpense)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{f(p.costs.totalCost)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{f(p.costs.insurance)}</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{f(p.costs.totalCostWithInsurance)}</td>
                  <td className={`num ${profitClass(p)}`} style={{ textAlign: 'right', fontWeight: 600 }}>{f(p.netProfit)}</td>
                  <td>
                    <span className={`badge ${p.profitabilityClass === 'high' ? 'badge-green' : p.profitabilityClass === 'medium' ? 'badge-blue' : p.profitabilityClass === 'low' ? 'badge-amber' : 'badge-red'}`}>
                      {formatPct(p.netProfitPct)}
                    </span>
                  </td>
                  <td><ChevronRight size={13} style={{ color: 'var(--text-3)' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <BOMModal product={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function BOMModal({ product, onClose }: { product: ComputedProduct; onClose: () => void }) {
  const { settings } = useAppStore()
  const f = (v: number) => formatCurrency(v, 'USD', settings.exchangeRateLYD)
  const pc = product.netProfitPct

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)' }}>{product.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{product.code} · {product.category}</div>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={15} /></button>
        </div>

        {/* Cost cards */}
        <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
          {[
            ['RM Cost',       f(product.costs.rmCost)],
            ['PK Cost',       f(product.costs.pkCost)],
            ['Weight Exp.',   f(product.costs.weightExpense)],
            ['Total Cost',    f(product.costs.totalCost)],
            ['Insurance 10%', f(product.costs.insurance)],
            ['Total + Ins.',  f(product.costs.totalCostWithInsurance)],
          ].map(([l,v]) => (
            <div key={l} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>{l}</div>
              <div className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Profitability bar */}
        <div style={{ margin: '0 20px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {[
            ['Company Price', f(product.companyPrice)],
            ['Discount', formatPct(product.categoryDiscount * 100)],
            ['Net Sale', f(product.netSalePrice)],
            ['Net Profit', f(product.netProfit)],
          ].map(([l,v]) => (
            <div key={l}>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{l}</div>
              <div className="num" style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{v}</div>
            </div>
          ))}
          <span className={`badge ${pc>=20?'badge-green':pc>=10?'badge-blue':pc>=0?'badge-amber':'badge-red'}`} style={{ marginLeft: 'auto', fontSize: 13, padding: '4px 12px' }}>
            {formatPct(pc)}
          </span>
        </div>

        {/* BOM Tree */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Bill of Materials</div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Component</th><th>Name</th><th>Type</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {product.bomTree.map(n => <BOMRow key={n.code} node={n} depth={0} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const TYPE_COLORS: Record<string,string> = { RM:'badge-blue', PK:'badge-amber', INT:'badge-purple', SFG:'badge-green', FG:'badge-blue' }

function BOMRow({ node, depth }: { node: BOMTreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2)
  const { settings } = useAppStore()
  const f = (v: number) => formatCurrency(v, 'USD', settings.exchangeRateLYD)
  return (
    <>
      <tr>
        <td style={{ paddingLeft: 12 + depth * 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {node.children.length > 0
              ? <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, display: 'flex' }}>
                  {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              : <span style={{ width: 16 }} />}
            <span className="num" style={{ color: 'var(--accent)', fontSize: 11 }}>{node.code}</span>
          </div>
        </td>
        <td style={{ fontSize: 12 }}>{node.name}</td>
        <td><span className={`badge ${TYPE_COLORS[node.type] ?? 'badge-blue'}`}>{node.type}</span></td>
        <td className="num" style={{ textAlign: 'right' }}>{node.quantity.toFixed(4)}</td>
        <td className="num" style={{ textAlign: 'right' }}>{f(node.unitCost)}</td>
        <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{f(node.totalCost)}</td>
      </tr>
      {open && node.children.map(c => <BOMRow key={c.code+depth} node={c} depth={depth+1} />)}
    </>
  )
}
