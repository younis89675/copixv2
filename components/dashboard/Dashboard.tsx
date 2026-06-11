'use client'
import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { computeDashboardStats } from '@/lib/costingEngine'
import { useAppStore } from '@/store/appStore'
import { Award, AlertTriangle, TrendingUp, TrendingDown, Package, Tag, BarChart2 } from 'lucide-react'
import CategoryChart from './CategoryChart'

const SAP_COLORS = {
  textMuted: '#6a7b8c',
  borderLight: '#e2e8f0',
  textDark: '#1e293b',
  neutralBg: '#f8fafc'
}

const PIE_ENTERPRISE = ['#dc2626', '#ea580c', '#0284c7', '#16a34a', '#4f46e5']

export default function Dashboard() {
  const { computedProducts, isLoaded } = useAppStore()
  
  const stats = useMemo(
    () => isLoaded ? computeDashboardStats(computedProducts) : null,
    [computedProducts, isLoaded]
  )
  
  if (!isLoaded || !stats) return null

  const getMarginColor = (p: number) => p >= 20 ? '#16a34a' : p >= 10 ? '#0284c7' : p >= 0 ? '#ca8a04' : '#dc2626'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10 }}>
        
        {/* Total Products */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${SAP_COLORS.borderLight}`, borderRadius: 4, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: SAP_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL PRODUCTS</span>
            <Package size={14} color={SAP_COLORS.textMuted} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: SAP_COLORS.textDark, fontVariantNumeric: 'tabular-nums' }}>{stats.totalProducts}</div>
        </div>

        {/* Categories */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${SAP_COLORS.borderLight}`, borderRadius: 4, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: SAP_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CATEGORIES</span>
            <Tag size={14} color={SAP_COLORS.textMuted} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: SAP_COLORS.textDark, fontVariantNumeric: 'tabular-nums' }}>{stats.totalCategories}</div>
        </div>

        {/* Avg. Net Margin */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${SAP_COLORS.borderLight}`, borderRadius: 4, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: SAP_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AVG. NET MARGIN</span>
            <BarChart2 size={14} color={getMarginColor(stats.avgProfitability)} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: getMarginColor(stats.avgProfitability), fontVariantNumeric: 'tabular-nums' }}>
            {stats.avgProfitability.toFixed(1)}%
          </div>
          <div style={{ fontSize: 10, color: SAP_COLORS.textMuted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: getMarginColor(stats.avgProfitability) }} />
            of net sale price
          </div>
        </div>

        {/* Categories >= 10% */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${SAP_COLORS.borderLight}`, borderRadius: 4, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: SAP_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CATEGORIES ≥ 10%</span>
            <TrendingUp size={14} color="#16a34a" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{stats.categoriesAbove10Pct}</div>
          <div style={{ fontSize: 10, color: '#16a34a', marginTop: 4, fontWeight: 500 }}>
            ↑ {stats.totalCategories > 0 ? Math.round(stats.categoriesAbove10Pct / stats.totalCategories * 100) : 0}% of all
          </div>
        </div>

        {/* Categories < 10% */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${SAP_COLORS.borderLight}`, borderRadius: 4, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: SAP_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CATEGORIES &lt; 10%</span>
            <TrendingDown size={14} color="#dc2626" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{stats.categoriesBelow10Pct}</div>
          <div style={{ fontSize: 10, color: '#dc2626', marginTop: 4, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
            Needs review
          </div>
        </div>

      </div>

      {/* Highlight cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        
        {/* Highest Profit */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${SAP_COLORS.borderLight}`, borderRadius: 4, padding: '12px 14px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: '#16a34a' }} />
          <div style={{ width: 32, height: 32, borderRadius: 4, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Award size={16} color="#16a34a" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>Highest Profit Category</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: SAP_COLORS.textDark }}>
                {stats.highestProfitCategory?.name?.replace('فئة الصنف ','').replace('فئة ','') || 'N/A'}
              </span>
              <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginLeft: 8 }}>
                {(stats.highestProfitCategory?.avgProfit || stats.highestProfitCategory?.avgProfitPct || 0).toFixed(1)}% <span style={{ fontSize: 10, fontWeight: 400, color: SAP_COLORS.textMuted }}>margin</span>
              </span>
            </div>
          </div>
        </div>

        {/* Lowest Profit */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${SAP_COLORS.borderLight}`, borderRadius: 4, padding: '12px 14px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: '#dc2626' }} />
          <div style={{ width: 32, height: 32, borderRadius: 4, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={16} color="#dc2626" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>Lowest Profit Category</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: SAP_COLORS.textDark }}>
                {stats.lowestProfitCategory?.name?.replace('فئة الصنف ','').replace('فئة ','') || 'N/A'}
              </span>
              <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginLeft: 8 }}>
                {(stats.lowestProfitCategory?.avgProfit || stats.lowestProfitCategory?.avgProfitPct || 0).toFixed(1)}% <span style={{ fontSize: 10, fontWeight: 400, color: '#dc2626' }}>· Urgent Review</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>

        {/* Category chart */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${SAP_COLORS.borderLight}`, borderRadius: 4, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: SAP_COLORS.textMuted, marginBottom: 12, borderBottom: `1px solid ${SAP_COLORS.neutralBg}`, paddingBottom: 6 }}>
            Average Net Margin by Category
          </div>
          <CategoryChart data={stats.categoryBreakdown} />
        </div>

        {/* Donut */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${SAP_COLORS.borderLight}`, borderRadius: 4, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: SAP_COLORS.textMuted, marginBottom: 12, borderBottom: `1px solid ${SAP_COLORS.neutralBg}`, paddingBottom: 6 }}>
            Margin Distribution
          </div>
          
          <div style={{ height: 110, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.profitDistribution} dataKey="count" nameKey="range"
                  cx="50%" cy="50%" outerRadius={50} innerRadius={35}>
                  {stats.profitDistribution.map((_, i) => <Cell key={i} fill={PIE_ENTERPRISE[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: `1px solid ${SAP_COLORS.borderLight}`, fontSize: 11, borderRadius: 4 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {stats.profitDistribution.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '3px 4px', borderRadius: 2, background: i % 2 === 0 ? SAP_COLORS.neutralBg : 'transparent' }}>
                <span style={{ width: 8, height: 8, borderRadius: 1, background: PIE_ENTERPRISE[i], flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#475569', fontWeight: 500 }}>{d.range}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: SAP_COLORS.textDark }}>{d.count}</span>
                <span style={{ color: SAP_COLORS.textMuted, fontSize: 10, minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
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