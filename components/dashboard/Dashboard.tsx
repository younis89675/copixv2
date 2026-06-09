'use client'
import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { computeDashboardStats } from '@/lib/costingEngine'
import { useAppStore } from '@/store/appStore'
import { Award, AlertTriangle, TrendingUp, TrendingDown, Package, Tag, BarChart2 } from 'lucide-react'
import CategoryChart from './CategoryChart'

const mc  = (p: number) => p >= 20 ? 'var(--green)' : p >= 10 ? 'var(--accent)' : p >= 0 ? 'var(--amber)' : 'var(--red)'
const mbg = (p: number) => p >= 20 ? 'var(--green-bg)' : p >= 10 ? 'var(--accent-bg)' : p >= 0 ? 'var(--amber-bg)' : 'var(--red-bg)'
const PIE  = ['#e24b4a','#ef9f27','#378add','#1d9e75','#534ab7']

export default function Dashboard() {
  const { computedProducts, isLoaded } = useAppStore()
  const stats = useMemo(
    () => isLoaded ? computeDashboardStats(computedProducts) : null,
    [computedProducts, isLoaded]
  )
  if (!isLoaded || !stats) return null

  const kpis = [
    { label: 'Total Products',    val: stats.totalProducts,                    color: 'var(--accent)',  bg: 'var(--accent-bg)',  Icon: Package,      delta: null },
    { label: 'Categories',        val: stats.totalCategories,                  color: 'var(--purple)',  bg: 'var(--purple-bg)',  Icon: Tag,           delta: null },
    { label: 'Avg. Net Margin',   val: `${stats.avgProfitability.toFixed(1)}%`,color: mc(stats.avgProfitability), bg: mbg(stats.avgProfitability), Icon: BarChart2, delta: { up: stats.avgProfitability >= 10, label: 'of net sale price' } },
    { label: 'Categories ≥ 10%', val: stats.categoriesAbove10Pct,             color: 'var(--green)',   bg: 'var(--green-bg)',   Icon: TrendingUp,    delta: { up: true,  label: `${Math.round(stats.categoriesAbove10Pct / stats.totalCategories * 100)}% of all` } },
    { label: 'Categories < 10%', val: stats.categoriesBelow10Pct,             color: 'var(--red)',     bg: 'var(--red-bg)',     Icon: TrendingDown,  delta: { up: false, label: 'Needs review' } },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: k.color, opacity: .5 }} />
            <div style={{ width: 30, height: 30, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <k.Icon size={14} color={k.color} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: k.color, letterSpacing: -.5, lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{k.label}</div>
            {k.delta && (
              <div style={{ fontSize: 11, fontWeight: 500, marginTop: 7, display: 'flex', alignItems: 'center', gap: 3, color: k.delta.up ? 'var(--green)' : 'var(--red)' }}>
                {k.delta.up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                {k.delta.label}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Highlight cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-mid)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(31,158,117,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Award size={18} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Highest Profit Category</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>
              {stats.highestProfitCategory.name.replace('فئة الصنف ','').replace('فئة ','')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
              {stats.highestProfitCategory.avgProfitPct.toFixed(1)}% average net margin
            </div>
          </div>
        </div>
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-mid)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(232,36,36,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} color="var(--red)" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Lowest Profit Category</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>
              {stats.lowestProfitCategory.name.replace('فئة الصنف ','').replace('فئة ','')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>
              {stats.lowestProfitCategory.avgProfitPct.toFixed(1)}% average net margin · urgent review
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>

        {/* Category chart - custom CSS bars */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>
            Average Net Margin by Category
          </div>
          <CategoryChart data={stats.categoryBreakdown} />
        </div>

        {/* Donut */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>
            Margin Distribution
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={stats.profitDistribution} dataKey="count" nameKey="range"
                cx="50%" cy="50%" outerRadius={60} innerRadius={36}>
                {stats.profitDistribution.map((_, i) => <Cell key={i} fill={PIE[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
            {stats.profitDistribution.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: PIE[i], flexShrink: 0, display: 'inline-block' }} />
                <span style={{ flex: 1, color: 'var(--text-2)' }}>{d.range}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--text-1)' }}>{d.count}</span>
                <span style={{ color: 'var(--text-3)', fontSize: 10, minWidth: 32, textAlign: 'right' }}>
                  {stats.totalProducts > 0 ? Math.round(d.count / stats.totalProducts * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
