'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, TrendingDown, TrendingUp, AlertTriangle, BarChart2, Package, DollarSign, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid } from 'recharts'
import { analyzeRMImpact } from '@/lib/costingEngine'
import { useAppStore } from '@/store/appStore'

const mc = (p: number) => p >= 20 ? 'var(--green)' : p >= 10 ? 'var(--accent)' : p >= 0 ? 'var(--amber)' : 'var(--red)'
const mbg = (p: number) => p >= 20 ? 'var(--green-bg)' : p >= 10 ? 'var(--accent-bg)' : p >= 0 ? 'var(--amber-bg)' : 'var(--red-bg)'
const pct = (v: number) => `${v.toFixed(1)}%`
const SH = ({ title, right }: { title: string; right?: React.ReactNode }) => (
  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', borderRadius: 'var(--radius) var(--radius) 0 0' }}>
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-2)' }}>{title}</span>
    {right}
  </div>
)

export default function RMImpactReport() {
  const { computedProducts, bomLines, prices, settings } = useAppStore()
  const [rmCode, setRmCode]     = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [query, setQuery]       = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [results, setResults]   = useState<ReturnType<typeof analyzeRMImpact>>([])
  const [catFilter, setCatFilter] = useState('')
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!dropRef.current?.contains(e.target as Node)) setShowDrop(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const rawMaterials = useMemo(() =>
    prices.filter(p => p.type === 'RM' || p.type === 'INT').sort((a, b) => a.name.localeCompare(b.name)),
    [prices])

  const filtered = useMemo(() =>
    query.trim().length > 0
      ? rawMaterials.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.code.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
      : [],
    [query, rawMaterials])

  const selected = prices.find(p => p.code === rmCode)

  const run = () => {
    const np = parseFloat(newPrice)
    if (!rmCode || isNaN(np) || np < 0) return
    setResults(analyzeRMImpact(rmCode, np, computedProducts, bomLines, prices, settings))
  }

  const categories = useMemo(() => [...new Set(results.map(r => r.category))].sort(), [results])

  const displayResults = useMemo(() =>
    catFilter ? results.filter(r => r.category === catFilter) : results,
    [results, catFilter])

  const summary = useMemo(() => {
    if (!results.length) return null
    const neg = results.filter(r => r.profitDelta < -0.1).length
    const pos = results.filter(r => r.profitDelta > 0.1).length
    const avgDelta = results.reduce((s, r) => s + r.profitDelta, 0) / results.length
    const worstDelta = Math.min(...results.map(r => r.profitDelta))
    const worst = results.find(r => r.profitDelta === worstDelta)
    return { neg, pos, unchanged: results.length - neg - pos, avgDelta, worst }
  }, [results])

  const priceDelta = selected && newPrice ? parseFloat(newPrice) - selected.unitCostUSD : 0
  const priceDeltaPct = selected && selected.unitCostUSD > 0 && newPrice
    ? ((parseFloat(newPrice) - selected.unitCostUSD) / selected.unitCostUSD) * 100 : 0

  /* chart data — top 20 most impacted */
  const chartData = useMemo(() =>
    [...displayResults]
      .sort((a, b) => Math.abs(b.profitDelta) - Math.abs(a.profitDelta))
      .slice(0, 18)
      .map(r => ({
        name: r.productName.length > 18 ? r.productName.slice(0, 16) + '…' : r.productName,
        current: +r.currentProfitPct.toFixed(2),
        new: +r.newProfitPct.toFixed(2),
        delta: +r.profitDelta.toFixed(2),
      })),
    [displayResults])

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 11, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-1)' }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color }}>
            <span>{p.name === 'current' ? 'Current' : 'After change'}</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{p.value.toFixed(1)}%</span>
          </div>
        ))}
        {payload.length === 2 && (
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 5, paddingTop: 5, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <span style={{ color: 'var(--text-3)' }}>Δ</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: payload[1].value >= payload[0].value ? 'var(--green)' : 'var(--red)' }}>
              {(payload[1].value - payload[0].value).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── INPUT PANEL ─────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <SH title="Simulation Parameters" />
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'end' }}>

          {/* RM selector */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>
              Raw Material
            </label>
            <div ref={dropRef} style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
              <input className="input" style={{ paddingLeft: 28 }}
                placeholder="Search by name or code…"
                value={selected ? `${selected.code} — ${selected.name}` : query}
                onChange={e => { setQuery(e.target.value); setRmCode(''); setShowDrop(true) }}
                onFocus={() => query && setShowDrop(true)} />
              {showDrop && filtered.length > 0 && (
                <div style={{ position: 'absolute', zIndex: 50, left: 0, right: 0, top: '100%', marginTop: 3, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-md)', overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                  {filtered.map(r => (
                    <button key={r.code}
                      onClick={() => { setRmCode(r.code); setNewPrice(r.unitCostUSD.toFixed(3)); setQuery(''); setShowDrop(false) }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)', minWidth: 70, flexShrink: 0 }}>{r.code}</span>
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--text-1)' }}>{r.name}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>${r.unitCostUSD.toFixed(4)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prices side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Current Price (USD)</label>
              <div className="input" style={{ opacity: .65, userSelect: 'none', fontFamily: 'monospace', fontWeight: 600 }}>
                {selected ? `$${selected.unitCostUSD.toFixed(4)}` : '—'}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>New Price (USD)</label>
              <input className="input" type="number" step={0.001} min={0}
                placeholder="Enter new price…"
                value={newPrice} onChange={e => setNewPrice(e.target.value)}
                style={{ fontFamily: 'monospace' }} />
            </div>
          </div>

          {/* Delta preview + button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selected && newPrice && !isNaN(parseFloat(newPrice)) && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, padding: '6px 10px', borderRadius: 7, background: priceDelta >= 0 ? 'var(--red-bg)' : 'var(--green-bg)', border: `1px solid ${priceDelta >= 0 ? 'var(--red-mid)' : 'var(--green-mid)'}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>Price Δ</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: priceDelta >= 0 ? 'var(--red)' : 'var(--green)' }}>
                    {priceDelta >= 0 ? '+' : ''}${priceDelta.toFixed(4)}
                  </div>
                </div>
                <div style={{ flex: 1, padding: '6px 10px', borderRadius: 7, background: priceDelta >= 0 ? 'var(--red-bg)' : 'var(--green-bg)', border: `1px solid ${priceDelta >= 0 ? 'var(--red-mid)' : 'var(--green-mid)'}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>Change %</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: priceDelta >= 0 ? 'var(--red)' : 'var(--green)' }}>
                    {priceDeltaPct >= 0 ? '+' : ''}{priceDeltaPct.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
            <button className="btn btn-primary" onClick={run}
              disabled={!rmCode || !newPrice}
              style={{ width: '100%', justifyContent: 'center', opacity: (!rmCode || !newPrice) ? .5 : 1, height: 36 }}>
              <Activity size={14} /> Run Impact Analysis
            </button>
          </div>
        </div>
      </div>

      {/* ── RESULTS ─────────────────────────────────────────── */}
      {results.length > 0 && summary && (
        <>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Affected Products', val: results.length, color: 'var(--accent)', bg: 'var(--accent-bg)', Icon: Package },
              { label: 'Profit Decreases',  val: summary.neg,    color: 'var(--red)',    bg: 'var(--red-bg)',    Icon: TrendingDown },
              { label: 'Profit Increases',  val: summary.pos,    color: 'var(--green)',  bg: 'var(--green-bg)',  Icon: TrendingUp },
              { label: 'Avg. Profit Δ',     val: `${summary.avgDelta >= 0 ? '+' : ''}${pct(summary.avgDelta)}`, color: mc(summary.avgDelta + 15), bg: mbg(summary.avgDelta + 15), Icon: BarChart2 },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: '100%', background: k.color, borderRadius: '0 var(--radius) var(--radius) 0' }} />
                <div style={{ width: 30, height: 30, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <k.Icon size={14} color={k.color} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, color: k.color, letterSpacing: -.5, fontFamily: 'monospace' }}>{k.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* worst case alert */}
          {summary.worst && summary.worst.profitDelta < -2 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: 'var(--red-bg)', border: '1px solid var(--red-mid)', borderRadius: 'var(--radius)' }}>
              <AlertTriangle size={16} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 2 }}>Highest Impact Product</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  <strong>{summary.worst.productName}</strong> — profit margin drops from{' '}
                  <strong>{pct(summary.worst.currentProfitPct)}</strong> to{' '}
                  <strong style={{ color: 'var(--red)' }}>{pct(summary.worst.newProfitPct)}</strong>{' '}
                  (Δ <strong style={{ color: 'var(--red)' }}>{pct(summary.worst.profitDelta)}</strong>)
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <SH title={`Profit Margin Before vs After — Top ${chartData.length} Most Impacted`} />
            <div style={{ padding: '16px 16px 8px' }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 55 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-3)' }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="var(--border-2)" />
                  <ReferenceLine y={10} stroke="var(--amber)" strokeDasharray="4 4" strokeOpacity={.5} />
                  <Bar dataKey="current" name="current" fill="var(--accent)" opacity={.55} radius={[3,3,0,0]} barSize={12} />
                  <Bar dataKey="new" name="new" radius={[3,3,0,0]} barSize={12}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.new >= d.current ? '#1d9e75' : '#e24b4a'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'var(--accent)', opacity: .55, borderRadius: 2, display: 'inline-block' }} /> Current margin</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: '#1d9e75', borderRadius: 2, display: 'inline-block' }} /> After change (↑)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: '#e24b4a', borderRadius: 2, display: 'inline-block' }} /> After change (↓)</span>
              </div>
            </div>
          </div>

          {/* Detailed table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <SH title={`Detailed Impact — ${displayResults.length} Products`} right={
              <select className="input" style={{ width: 200, height: 28, fontSize: 11, padding: '2px 8px' }}
                value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c.replace('فئة الصنف ','').replace('فئة ','')}</option>)}
              </select>
            } />
            <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                  <tr>
                    {['Product Code','Product Name','Category','Cur. Cost','New Cost','Cost Δ','Cur. Margin%','New Margin%','Profit Δ','Impact'].map((h,i) => (
                      <th key={h} style={{ background: 'var(--surface-2)', color: 'var(--text-3)', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '7px 10px', borderBottom: '1px solid var(--border)', textAlign: i > 2 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayResults.map((r, i) => (
                    <tr key={r.productCode} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)' }}>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{r.productCode}</td>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.productName}</div>
                      </td>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11, maxWidth: 110 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.category.replace('فئة الصنف ','').replace('فئة ','')}</div>
                      </td>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'monospace', fontSize: 11 }}>${r.currentCost.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'monospace', fontSize: 11 }}>${r.newCost.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: r.costDelta > 0 ? 'var(--red)' : 'var(--green)' }}>
                        {r.costDelta > 0 ? '+' : ''}{r.costDelta.toFixed(4)}
                      </td>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'monospace' }}>{pct(r.currentProfitPct)}</td>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: mc(r.newProfitPct) }}>{pct(r.newProfitPct)}</td>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color: r.profitDelta < 0 ? 'var(--red)' : 'var(--green)' }}>
                          {r.profitDelta < 0 ? <TrendingDown size={11}/> : <TrendingUp size={11}/>}
                          {r.profitDelta >= 0 ? '+' : ''}{pct(r.profitDelta)}
                        </span>
                      </td>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <div style={{ width: 60, height: 4, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, r.impactPct)}%`, background: r.profitDelta < 0 ? 'var(--red)' : 'var(--green)', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-3)', minWidth: 38, textAlign: 'right' }}>{pct(r.impactPct)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
