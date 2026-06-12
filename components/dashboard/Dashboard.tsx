'use client'
import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { computeDashboardStats } from '@/lib/costingEngine'
import { useAppStore } from '@/store/appStore'
import { TrendingUp, TrendingDown, Package, Tag, BarChart2, Award, AlertTriangle, Activity } from 'lucide-react'
import CategoryChart from './CategoryChart'

const mc  = (p: number) => p >= 20 ? 'var(--green)' : p >= 10 ? 'var(--accent)' : p >= 0 ? 'var(--amber)' : 'var(--red)'
const mbg = (p: number) => p >= 20 ? 'var(--green-bg)' : p >= 10 ? 'var(--accent-bg)' : p >= 0 ? 'var(--amber-bg)' : 'var(--red-bg)'
const PIE = ['#e53935','#fb8c00','#1e88e5','#0d7a4e','#5b4fcf']

export default function Dashboard() {
  const { computedProducts, isLoaded } = useAppStore()
  const stats = useMemo(
    () => isLoaded ? computeDashboardStats(computedProducts) : null,
    [computedProducts, isLoaded]
  )
  if (!isLoaded || !stats) return null

  const kpis = [
    {
      label: 'Total Products', val: stats.totalProducts.toLocaleString(),
      sub: `${stats.totalCategories} categories`,
      color: 'var(--accent)', Icon: Package,
      trend: null,
    },
    {
      label: 'Total Materials', val: '—',
      sub: 'RM, PK, INT, SFG',
      color: 'var(--teal)', Icon: Tag,
      trend: null,
    },
    {
      label: 'Average Margin', val: `${stats.avgProfitability.toFixed(1)}%`,
      sub: `Avg profit per unit`,
      color: mc(stats.avgProfitability), Icon: BarChart2,
      trend: { up: stats.avgProfitability >= 10, label: 'of net sale price' },
    },
    {
      label: 'Categories ≥ 10%', val: stats.categoriesAbove10Pct,
      sub: `${Math.round(stats.categoriesAbove10Pct / stats.totalCategories * 100)}% of all groups`,
      color: 'var(--green)', Icon: TrendingUp,
      trend: { up: true, label: 'Healthy' },
    },
    {
      label: 'Categories < 10%', val: stats.categoriesBelow10Pct,
      sub: 'Need pricing review',
      color: 'var(--red)', Icon: TrendingDown,
      trend: { up: false, label: 'Needs attention' },
    },
  ]

  const watchlist = [
    { label: 'Most profitable category', name: stats.highestProfitCategory.name.replace('فئة الصنف ','').replace('فئة ',''), val: `${stats.highestProfitCategory.avgProfitPct.toFixed(1)}%`, badgeClass: 'badge-green' },
    { label: 'Least profitable category', name: stats.lowestProfitCategory.name.replace('فئة الصنف ','').replace('فئة ',''), val: `${stats.lowestProfitCategory.avgProfitPct.toFixed(1)}%`, badgeClass: stats.lowestProfitCategory.avgProfitPct < 0 ? 'badge-red' : 'badge-amber' },
    { label: 'Products above target', name: '', val: stats.categoriesAbove10Pct * Math.round(stats.totalProducts / stats.totalCategories), badgeClass: 'badge-green', badge: 'Healthy' },
    { label: 'Products below target', name: '', val: stats.categoriesBelow10Pct * Math.round(stats.totalProducts / stats.totalCategories), badgeClass: 'badge-amber', badge: 'Review' },
    { label: 'Missing BOM prices', name: '', val: 0, badgeClass: 'badge-teal', badge: 'OK' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 14 }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-card-accent" style={{ background: k.color, opacity: .7 }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="kpi-label">{k.label}</div>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: mbg(typeof k.val === 'string' && k.val.includes('%') ? parseFloat(k.val) : 15), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <k.Icon size={13} color={k.color} />
              </div>
            </div>
            <div className="kpi-val" style={{ color: k.color }}>{k.val}</div>
            <div className="kpi-sub" style={{ marginTop: 4 }}>{k.sub}</div>
            {k.trend && (
              <div className="kpi-trend" style={{ color: k.trend.up ? 'var(--green)' : 'var(--red)' }}>
                {k.trend.up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                {k.trend.label}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Main Content Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>

        {/* Category profitability chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
          <div className="section-header">
            <span className="section-title">Category Profitability</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{stats.categoryBreakdown.length} groups</span>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <CategoryChart data={stats.categoryBreakdown} />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Management Watchlist */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
            <div className="section-header">
              <span className="section-title">Management Watchlist</span>
              <Activity size={13} color="var(--text-3)" />
            </div>
            <div style={{ padding: '6px 0' }}>
              {watchlist.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', borderBottom: i < watchlist.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{w.label}</div>
                    {w.name && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>{w.val}</span>
                    {w.badge && <span className={`badge ${w.badgeClass}`}>{w.badge}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Margin distribution */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
            <div className="section-header">
              <span className="section-title">Margin Distribution</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={stats.profitDistribution} dataKey="count" nameKey="range"
                    cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                    {stats.profitDistribution.map((_, i) => <Cell key={i} fill={PIE[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                {stats.profitDistribution.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE[i], flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--text-2)' }}>{d.range}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{d.count}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', minWidth: 30, textAlign: 'right' }}>
                      {stats.totalProducts > 0 ? Math.round(d.count / stats.totalProducts * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
