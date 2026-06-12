'use client'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Search, Trash2, Printer, Download, RefreshCw, Save, FolderOpen, X, Check, Truck, Plus, ChevronRight, TrendingUp, DollarSign, Package } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useQuotationStore } from '@/store/quotationStore'
import type { ComputedProduct, SavedQuotation } from '@/types'
import * as XLSX from 'xlsx'

type Currency = 'USD' | 'LYD' | 'EUR'

interface Line {
  id: string; product: ComputedProduct
  quantity: number; unitPrice: number; discount: number; notes: string
}
interface Header {
  number: string; date: string; customer: string; ref: string
  validity: number; currency: Currency; preparedBy: string; notes: string; shippingCost: number
}

const freshHeader = (): Header => ({
  number: `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
  date: new Date().toISOString().split('T')[0],
  customer: '', ref: '', validity: 30, currency: 'USD', preparedBy: '', notes: '', shippingCost: 0,
})

/* ── tiny helpers ── */
const S = (style: React.CSSProperties) => style   // identity — just for readability
const mc = (p: number) => p >= 20 ? 'var(--green)' : p >= 10 ? 'var(--accent)' : p >= 0 ? 'var(--amber)' : 'var(--red)'
const mbg = (p: number) => p >= 20 ? 'var(--green-bg)' : p >= 10 ? 'var(--accent-bg)' : p >= 0 ? 'var(--amber-bg)' : 'var(--red-bg)'

export default function Quotation() {
  const { computedProducts, settings } = useAppStore()
  const { savedQuotations, saveQuotation, deleteQuotation } = useQuotationStore()

  const [lines, setLines]     = useState<Line[]>([])
  const [hdr, setHdr]         = useState<Header>(freshHeader())
  const [eurRate, setEurRate] = useState(0.92)
  const [loadEur, setLoadEur] = useState(false)
  const [query, setQuery]     = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [flash, setFlash]     = useState(false)
  const [editId, setEditId]   = useState<string | null>(null)   // which saved Q to overwrite
  const searchRef = useRef<HTMLDivElement>(null)

  /* close search on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!searchRef.current?.contains(e.target as Node)) setShowDrop(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  /* live EUR rate */
  const fetchEur = useCallback(async () => {
    setLoadEur(true)
    try { const d = await (await fetch('https://api.exchangerate-api.com/v4/latest/USD')).json(); setEurRate(d.rates?.EUR ?? 0.92) }
    catch { setEurRate(0.92) }
    finally { setLoadEur(false) }
  }, [])
  useEffect(() => { fetchEur() }, [fetchEur])

  const lyd = settings.exchangeRateLYD
  const conv = (usd: number, cur: Currency = hdr.currency) =>
    cur === 'LYD' ? usd * lyd : cur === 'EUR' ? usd * eurRate : usd
  const fmt = (usd: number, cur: Currency = hdr.currency) => {
    const v = conv(usd, cur); const d = cur === 'LYD' ? 2 : 3
    return `${cur === 'USD' ? '$' : cur === 'LYD' ? 'LYD\u00a0' : '€'}${v.toFixed(d)}`
  }

  /* line math */
  const lineNet   = (l: Line) => l.unitPrice * (1 - l.discount)
  const lineRev   = (l: Line) => lineNet(l) * l.quantity
  const lineCost  = (l: Line) => l.product.costs.totalCostWithInsurance * l.quantity
  const lineMargin = (l: Line) => lineRev(l) - lineCost(l)
  const lineMarginPct = (l: Line) => lineRev(l) > 0 ? (lineMargin(l) / lineRev(l)) * 100 : 0

  const totals = useMemo(() => {
    const revenue  = lines.reduce((s, l) => s + lineRev(l), 0)
    const cost     = lines.reduce((s, l) => s + lineCost(l), 0)
    const total    = revenue - hdr.shippingCost
    const margin   = total - cost
    const marginPct = total > 0 ? (margin / total) * 100 : 0
    return { revenue, cost, total, margin, marginPct, shipping: hdr.shippingCost }
  }, [lines, hdr.shippingCost])

  const results = useMemo(() =>
    query.trim().length > 1
      ? computedProducts.filter(p =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.code.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10)
      : [], [query, computedProducts])

  const addLine = (p: ComputedProduct) => {
    setLines(prev => [...prev, { id: `${p.code}-${Date.now()}`, product: p, quantity: 1, unitPrice: p.netSalePrice, discount: p.categoryDiscount, notes: '' }])
    setQuery(''); setShowDrop(false)
  }
  const upd = (id: string, patch: Partial<Line>) => setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  const del = (id: string) => setLines(prev => prev.filter(l => l.id !== id))

  const doSave = () => {
    const q: SavedQuotation = {
      id: editId ?? `q-${Date.now()}`,
      number: hdr.number, date: hdr.date, customerName: hdr.customer,
      customerRef: hdr.ref, validityDays: hdr.validity, currency: hdr.currency,
      preparedBy: hdr.preparedBy, notes: hdr.notes, shippingCost: hdr.shippingCost,
      lines: lines.map(l => ({
        id: l.id, productCode: l.product.code, productName: l.product.name,
        unit: l.product.unit, category: l.product.category,
        quantity: l.quantity, unitPrice: l.unitPrice, discount: l.discount,
        totalCostWithInsurance: l.product.costs.totalCostWithInsurance, notes: l.notes,
      })),
      totals: { subtotalUSD: totals.revenue, shippingCost: totals.shipping, totalUSD: totals.total, totalCostUSD: totals.cost, grossMargin: totals.margin, grossMarginPct: totals.marginPct },
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    saveQuotation(q); setEditId(q.id); setFlash(true); setTimeout(() => setFlash(false), 2000)
  }

  const loadQ = (q: SavedQuotation) => {
    setHdr({ number: q.number, date: q.date, customer: q.customerName, ref: q.customerRef ?? '', validity: q.validityDays, currency: q.currency, preparedBy: q.preparedBy ?? '', notes: q.notes ?? '', shippingCost: q.shippingCost ?? 0 })
    setLines(q.lines.map(sl => {
      const p = computedProducts.find(x => x.code === sl.productCode); if (!p) return null
      return { id: sl.id, product: p, quantity: sl.quantity, unitPrice: sl.unitPrice, discount: sl.discount, notes: sl.notes }
    }).filter(Boolean) as Line[])
    setEditId(q.id); setShowSaved(false)
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(lines.map((l, i) => ({
      '#': i+1, Code: l.product.code, Name: l.product.name, Unit: l.product.unit,
      Qty: l.quantity, 'Unit Price USD': +l.unitPrice.toFixed(3), 'Disc%': +(l.discount*100).toFixed(1),
      'Net Price USD': +lineNet(l).toFixed(3), 'Revenue USD': +lineRev(l).toFixed(3),
      'Cost USD': +lineCost(l).toFixed(3), 'Margin USD': +lineMargin(l).toFixed(3),
      'Margin%': +lineMarginPct(l).toFixed(1),
    })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Quotation')
    XLSX.writeFile(wb, `${hdr.number}.xlsx`)
  }

  /* ── section header ── */
  const SH = ({ title, right }: { title: string; right?: React.ReactNode }) => (
    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', borderRadius: 'var(--radius) var(--radius) 0 0' }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-2)' }}>{title}</span>
      {right}
    </div>
  )

  /* ── table header cell ── */
  const TH = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
    <th style={{ background: 'var(--surface-2)', color: 'var(--text-3)', fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', padding: '7px 10px', borderBottom: '1px solid var(--border)', textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap' }}>{children}</th>
  )

  /* ── editable cell input ── */
  const NumInput = ({ value, onChange, width = 72, step = 1 }: { value: number | string; onChange: (v: number) => void; width?: number; step?: number }) => (
    <input type="number" step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      style={{ width, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 6px', fontSize: 12, textAlign: 'right', color: 'var(--text-1)', outline: 'none', fontFamily: 'monospace' }} />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onClick={() => showDrop && setShowDrop(false)}>

      {/* ── ACTION BAR ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn btn-ghost" onClick={() => setShowSaved(s => !s)} style={{ position: 'relative' }}>
          <FolderOpen size={13} /> Saved Quotations
          {savedQuotations.length > 0 && (
            <span style={{ marginLeft: 4, background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '0 5px', lineHeight: '16px', display: 'inline-block' }}>{savedQuotations.length}</span>
          )}
        </button>
        <button className="btn btn-ghost" onClick={() => { setLines([]); setHdr(freshHeader()); setEditId(null) }}>
          New
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={exportExcel}><Download size={13} /> Export Excel</button>
        <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={13} /> Print</button>
        <button className="btn btn-primary" onClick={doSave}>
          {flash ? <><Check size={13} /> Saved!</> : <><Save size={13} /> {editId ? 'Update' : 'Save'}</>}
        </button>
      </div>

      {/* ── SAVED PANEL ──────────────────────────────────────── */}
      {showSaved && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <SH title={`Saved Quotations (${savedQuotations.length})`} right={<button className="btn-icon" onClick={() => setShowSaved(false)}><X size={14}/></button>} />
          {savedQuotations.length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>No saved quotations yet</div>
            : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>
                  {['Number','Customer','Date','Products','Total USD','Margin%',''].map(h => (
                    <th key={h} style={{ background: 'var(--surface-2)', color: 'var(--text-3)', fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', padding: '7px 12px', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {savedQuotations.map(q => (
                    <tr key={q.id} style={{ cursor: 'pointer' }} onClick={() => loadQ(q)}>
                      <td style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{q.number}</td>
                      <td style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>{q.customerName || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                      <td style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{q.date}</td>
                      <td style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)' }}>{q.lines.length}</td>
                      <td style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontFamily: 'monospace' }}>${q.totals.totalUSD.toFixed(2)}</td>
                      <td style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 700, color: mc(q.totals.grossMarginPct), fontFamily: 'monospace' }}>{q.totals.grossMarginPct.toFixed(1)}%</span>
                      </td>
                      <td style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>
                        <button onClick={e => { e.stopPropagation(); deleteQuotation(q.id) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', display: 'flex', padding: 2 }}>
                          <Trash2 size={13}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>}
        </div>
      )}

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <SH title="Quotation Details" right={
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)' }}>
            <span>LYD&nbsp;{lyd.toFixed(2)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              EUR&nbsp;{loadEur ? '…' : eurRate.toFixed(4)}
              <button onClick={fetchEur} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 0 }}><RefreshCw size={10}/></button>
            </span>
          </div>
        } />
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px 16px' }}>
          {[
            { label: 'Quotation No.',    key: 'number',      type: 'text' },
            { label: 'Date',             key: 'date',        type: 'date' },
            { label: 'Customer Name',    key: 'customer',    type: 'text', ph: 'Company / client name' },
            { label: 'Customer Ref.',    key: 'ref',         type: 'text', ph: 'PO / RFQ reference' },
            { label: 'Validity (days)',  key: 'validity',    type: 'number' },
            { label: 'Currency',         key: 'currency',    type: 'select' },
            { label: 'Prepared By',      key: 'preparedBy',  type: 'text', ph: 'Your name' },
            { label: 'Shipping Cost (USD)', key: 'shippingCost', type: 'number', icon: true },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>
                {f.icon && <Truck size={10}/>}{f.label}
              </label>
              {f.type === 'select'
                ? <select className="input" value={hdr.currency} onChange={e => setHdr(h => ({ ...h, currency: e.target.value as Currency }))}>
                    <option value="USD">USD — US Dollar</option>
                    <option value="LYD">LYD — Libyan Dinar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                : <input className="input" type={f.type} placeholder={(f as { ph?: string }).ph || ''}
                    value={(hdr as unknown as Record<string, string | number>)[f.key] as string | number}
                    onChange={e => setHdr(h => ({ ...h, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))} />
              }
            </div>
          ))}
        </div>
      </div>

      {/* ── PRODUCT SEARCH ───────────────────────────────────── */}
      <div ref={searchRef} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}/>
          <input className="input" style={{ paddingLeft: 34, height: 38, fontSize: 13 }}
            placeholder="Search products by name or code to add to quotation…"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDrop(true) }}
            onFocus={() => query && setShowDrop(true)}
            onClick={e => e.stopPropagation()} />
        </div>
        {showDrop && results.length > 0 && (
          <div style={{ position: 'absolute', zIndex: 60, left: 0, right: 0, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', overflow: 'hidden', maxHeight: 340, overflowY: 'auto' }}>
            {results.map(p => {
              const gm = p.netSalePrice > 0 ? ((p.netSalePrice - p.costs.totalCostWithInsurance) / p.netSalePrice * 100) : 0
              return (
                <button key={p.code} onClick={() => addLine(p)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)', minWidth: 80, flexShrink: 0 }}>{p.code}</span>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-1)' }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 90, textAlign: 'right', flexShrink: 0 }}>{p.unit}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, minWidth: 72, textAlign: 'right', flexShrink: 0 }}>${p.netSalePrice.toFixed(3)}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: mc(gm), minWidth: 50, textAlign: 'right', flexShrink: 0 }}>{gm.toFixed(1)}%</span>
                  <Plus size={13} style={{ color: 'var(--accent)', flexShrink: 0 }}/>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── LINES TABLE ──────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <SH title={`Line Items  (${lines.length})`} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <TH>#</TH><TH>Code</TH><TH>Product</TH><TH>Unit</TH>
                <TH right>Qty</TH><TH right>Unit Price</TH><TH right>Disc %</TH>
                <TH right>Net Price</TH><TH right>Revenue</TH>
                <TH right>Cost</TH><TH right>Margin</TH><TH right>Margin %</TH>
                <TH>Notes</TH><TH>{' '}</TH>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0
                ? <tr><td colSpan={14} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    Search and add products above to start building your quotation
                  </td></tr>
                : lines.map((l, i) => {
                    const rev = lineRev(l), cost = lineCost(l), margin = lineMargin(l), mp = lineMarginPct(l)
                    return (
                      <tr key={l.id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)' }}>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11 }}>{i+1}</td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)' }}>{l.product.code}</span>
                        </td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', maxWidth: 180 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{l.product.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{l.product.category.replace('فئة الصنف ','').replace('فئة ','')}</div>
                        </td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{l.product.unit}</td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                          <NumInput value={l.quantity} onChange={v => upd(l.id, { quantity: Math.max(0.001, v) })} width={64}/>
                        </td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                          <NumInput value={l.unitPrice.toFixed(3)} onChange={v => upd(l.id, { unitPrice: v })} width={90} step={0.001}/>
                        </td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                          <NumInput value={(l.discount*100).toFixed(1)} onChange={v => upd(l.id, { discount: Math.min(100, Math.max(0, v))/100 })} width={60} step={0.1}/>
                        </td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'monospace', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmt(lineNet(l))}</td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(rev)}</td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-3)', whiteSpace: 'nowrap', fontSize: 11 }}>${cost.toFixed(3)}</td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: mc(mp), whiteSpace: 'nowrap' }}>{fmt(margin)}</td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: mbg(mp), color: mc(mp) }}>{mp.toFixed(1)}%</span>
                        </td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)' }}>
                          <input style={{ width: 90, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: 'var(--text-2)', outline: 'none' }}
                            placeholder="—" value={l.notes} onChange={e => upd(l.id, { notes: e.target.value })}/>
                        </td>
                        <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)' }}>
                          <button onClick={() => del(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', display: 'flex', padding: 2 }}><Trash2 size={13}/></button>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TOTALS + SUMMARY ─────────────────────────────────── */}
      {lines.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>

          {/* Notes */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <SH title="Notes / Terms & Conditions" />
            <div style={{ padding: 14 }}>
              <textarea className="input" rows={5} style={{ resize: 'vertical', lineHeight: 1.6 }}
                placeholder="Payment terms, delivery conditions, warranty, notes…"
                value={hdr.notes} onChange={e => setHdr(h => ({ ...h, notes: e.target.value }))}/>
            </div>
          </div>

          {/* Totals card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <SH title="Financial Summary" />
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Row label="Products Subtotal" val={fmt(totals.revenue)} />
              <Row label={<span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Truck size={11}/> Shipping</span>} val={fmt(totals.shipping)} dim />
              <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }}/>
              <Row label="Total Revenue" val={fmt(totals.total)} bold big />
              <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }}/>
              <Row label="Total Cost (incl. ins.)" val={`$${totals.cost.toFixed(3)}`} dim />
              <Row label="Gross Margin" val={fmt(totals.margin)} color={mc(totals.marginPct)} bold />
              {/* big margin badge */}
              <div style={{ marginTop: 6, padding: '12px 14px', borderRadius: 8, background: mbg(totals.marginPct), border: `1px solid ${totals.marginPct >= 20 ? 'var(--green-mid)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: mc(totals.marginPct) }}>Gross Margin %</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>on total incl. shipping</div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', color: mc(totals.marginPct), letterSpacing: -1 }}>
                  {totals.marginPct.toFixed(1)}%
                </div>
              </div>
              {/* second currency hint */}
              {hdr.currency !== 'USD' && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginTop: 2 }}>
                  ≈ ${totals.total.toFixed(2)} USD
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT LAYOUT ─────────────────────────────────────── */}
      <style>{`@media print{.no-print{display:none!important}}`}</style>
    </div>
  )
}

function Row({ label, val, bold, big, dim, color }: { label: React.ReactNode; val: string; bold?: boolean; big?: boolean; dim?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 12, color: dim ? 'var(--text-3)' : 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontWeight: bold ? 700 : 500, fontSize: big ? 15 : 13, color: color ?? (dim ? 'var(--text-3)' : 'var(--text-1)'), whiteSpace: 'nowrap' }}>{val}</span>
    </div>
  )
}
