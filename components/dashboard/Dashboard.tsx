'use client'

import React, { useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { computeDashboardStats } from '@/lib/costingEngine'
import { Package, Tags, Percent, ArrowUpRight, ArrowDownRight, Award, AlertTriangle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import CategoryChart from './CategoryChart'

const COLORS = ['#dc2626', '#ea580c', '#0284c7', '#16a34a', '#4f46e5']

export default function Dashboard() {
  const { computedProducts, isLoaded } = useAppStore()

  const stats = useMemo(() => {
    if (!isLoaded || !computedProducts.length) return null
    return computeDashboardStats(computedProducts)
  }, [computedProducts, isLoaded])

  if (!isLoaded || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading dashboard data...</p>
      </div>
    )
  }

  const getMarginColorClass = (value: number) => {
    if (value >= 10) return 'text-green-600'
    if (value >= 0) return 'text-amber-600'
    return 'text-destructive'
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards Row باستخدام Tailwind CSS صافي لحل مشكلة الـ Import */}
      <div className="grid gap-4 md:grid-cols-5">
        
        {/* Total Products */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Total Products</h3>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold tabular-nums">{stats.totalProducts}</div>
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Categories</h3>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold tabular-nums">{stats.totalCategories}</div>
          </div>
        </div>

        {/* Avg. Net Margin */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Avg. Net Margin</h3>
            <Percent className={`h-4 w-4 ${getMarginColorClass(stats.avgProfitability)}`} />
          </div>
          <div className="p-6 pt-0">
            <div className={`text-2xl font-bold tabular-nums ${getMarginColorClass(stats.avgProfitability)}`}>
              {stats.avgProfitability.toFixed(1)}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full bg-current ${getMarginColorClass(stats.avgProfitability)}`} />
              of net sale price
            </p>
          </div>
        </div>

        {/* Categories >= 10% */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Categories ≥ 10%</h3>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-green-600 tabular-nums">{stats.categoriesAbove10Pct}</div>
            <p className="text-[10px] text-green-600 font-medium mt-1">
              ↑ {stats.totalCategories > 0 ? Math.round((stats.categoriesAbove10Pct / stats.totalCategories) * 100) : 0}% of all
            </p>
          </div>
        </div>

        {/* Categories < 10% */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Categories &lt; 10%</h3>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-destructive tabular-nums">{stats.categoriesBelow10Pct}</div>
            <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              Needs review
            </p>
          </div>
        </div>
      </div>

      {/* Highlight Cards Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Highest Profit Category */}
        <div className="rounded-xl border bg-white text-card-foreground shadow-sm border-l-4 border-l-green-600 relative overflow-hidden">
          <div className="p-6 flex items-center gap-4 pt-6">
            <div className="p-2 rounded-md bg-green-50 text-green-600">
              <Award className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-green-600 tracking-wider uppercase mb-0.5">Highest Profit Category</div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-slate-800">
                  {(stats.highestProfitCategory as any)?.name?.replace('فئة الصنف ', '').replace('فئة ', '') || 'N/A'}
                </span>
                <span className="text-sm font-bold text-green-600 tabular-nums">
                  {((stats.highestProfitCategory as any)?.avgProfitPct ?? (stats.highestProfitCategory as any)?.avgProfit ?? 0).toFixed(1)}% 
                  <span className="text-xs font-normal text-muted-foreground ml-1">margin</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lowest Profit Category */}
        <div className="rounded-xl border bg-white text-card-foreground shadow-sm border-l-4 border-l-destructive relative overflow-hidden">
          <div className="p-6 flex items-center gap-4 pt-6">
            <div className="p-2 rounded-md bg-red-50 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-destructive tracking-wider uppercase mb-0.5">Lowest Profit Category</div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-slate-800">
                  {(stats.lowestProfitCategory as any)?.name?.replace('فئة الصنف ', '').replace('فئة ', '') || 'N/A'}
                </span>
                <span className="text-sm font-bold text-destructive tabular-nums">
                  {((stats.lowestProfitCategory as any)?.avgProfitPct ?? (stats.lowestProfitCategory as any)?.avgProfit ?? 0).toFixed(1)}% 
                  <span className="text-xs font-normal text-destructive ml-1">· Urgent Review</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Main Category Chart */}
        <div className="rounded-xl border bg-white text-card-foreground shadow-sm md:col-span-2">
          <div className="p-6 flex flex-col space-y-1.5">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase border-b pb-2">
              Average Net Margin by Category
            </h3>
          </div>
          <div className="p-6 pt-0">
            <CategoryChart data={stats.categoryBreakdown as any} />
          </div>
        </div>

        {/* Donut Chart Distribution */}
        <div className="rounded-xl border bg-white text-card-foreground shadow-sm">
          <div className="p-6 flex flex-col space-y-1.5">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase border-b pb-2">
              Margin Distribution
            </h3>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div className="h-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.profitDistribution}
                    dataKey="count"
                    nameKey="range"
                    cx="50%"
                    cy="50%"
                    outerRadius={50}
                    innerRadius={35}
                  >
                    {stats.profitDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', fontSize: '11px', borderRadius: '4px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col gap-1.5">
              {stats.profitDistribution.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-1 rounded bg-slate-50 odd:bg-transparent">
                  <span className="h-2 w-2 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="flex-1 text-slate-600 font-medium">{d.range}</span>
                  <span className="font-bold text-slate-800 tabular-nums">{d.count}</span>
                  <span className="text-muted-foreground text-[10px] w-8 text-right tabular-nums">
                    {stats.totalProducts > 0 ? Math.round((d.count / stats.totalProducts) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}