'use client'

import React, { useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { computeDashboardStats } from '@/lib/costingEngine'
import CategoryChart from './CategoryChart'

// التعديل السحري هنا: الـ Interface متظبطة بالملي زي ما الـ CategoryChart طالبها بالظبط!
interface CategoryStat {
  category: string   // الـ Chart طالبها category مش name
  count: number
  avgProfit: number
}

interface ProfitDistribution {
  range: string
  count: number
}

interface DashboardStats {
  totalProducts: number
  totalCategories: number
  avgProfitability: number
  categoriesAbove10Pct: number
  categoriesBelow10Pct: number
  highestProfitCategory: { category: string; count: number; avgProfit: number } | null
  lowestProfitCategory: { category: string; count: number; avgProfit: number } | null
  categoryBreakdown: CategoryStat[]
  profitDistribution: ProfitDistribution[]
}

export default function Dashboard() {
  const { computedProducts, isLoaded } = useAppStore()

  // عمل كاستنج للبيانات وتحويل الأسامي للـ Format اللي بيفهمه الـ CategoryChart
  const stats = useMemo(() => {
    if (!isLoaded || !computedProducts || !computedProducts.length) return null
    
    const rawStats = computeDashboardStats(computedProducts) as any
    
    // هنا بنضمن إن كل الـ Breakdown والـ Highlights واخدين كلمة category بدل name عشان الـ TypeScript والـ Chart يرضوا عننا
    const categoryBreakdown = (rawStats.categoryBreakdown || []).map((item: any) => ({
      category: item.name || item.category || '',
      count: item.count || 0,
      avgProfit: item.avgProfit || 0
    }))

    return {
      totalProducts: rawStats.totalProducts || 0,
      totalCategories: rawStats.totalCategories || 0,
      avgProfitability: rawStats.avgProfitability || 0,
      categoriesAbove10Pct: rawStats.categoriesAbove10Pct || 0,
      categoriesBelow10Pct: rawStats.categoriesBelow10Pct || 0,
      highestProfitCategory: rawStats.highestProfitCategory ? {
        category: rawStats.highestProfitCategory.name || rawStats.highestProfitCategory.category || '',
        count: rawStats.highestProfitCategory.count || 0,
        avgProfit: rawStats.highestProfitCategory.avgProfit || 0
      } : null,
      lowestProfitCategory: rawStats.lowestProfitCategory ? {
        category: rawStats.lowestProfitCategory.name || rawStats.lowestProfitCategory.category || '',
        count: rawStats.lowestProfitCategory.count || 0,
        avgProfit: rawStats.lowestProfitCategory.avgProfit || 0
      } : null,
      categoryBreakdown,
      profitDistribution: rawStats.profitDistribution || []
    } as DashboardStats
  }, [computedProducts, isLoaded])

  if (!isLoaded || !stats) {
    return (
      <div className="flex items-center justify-center h-full p-10">
        <p className="text-slate-500 text-sm animate-pulse">Loading dashboard data...</p>
      </div>
    )
  }

  const getMarginColorClass = (value: number) => {
    if (value >= 10) return 'text-green-600'
    if (value >= 0) return 'text-amber-600'
    return 'text-red-600'
  }

  // ألوان الـ Donut Chart
  const COLORS = ['#dc2626', '#ea580c', '#0284c7', '#16a34a', '#4f46e5']

  return (
    <div className="space-y-4 p-1 text-slate-800">
      {/* KPI Cards Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
        
        {/* Total Products */}
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Total Products</h3>
            <span className="text-lg">📦</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900">{stats.totalProducts}</div>
        </div>

        {/* Categories */}
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Categories</h3>
            <span className="text-lg">🏷️</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900">{stats.totalCategories}</div>
        </div>

        {/* Avg. Net Margin */}
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Avg. Net Margin</h3>
            <span className="text-lg">📊</span>
          </div>
          <div>
            <div className={`text-2xl font-bold tabular-nums ${getMarginColorClass(stats.avgProfitability)}`}>
              {stats.avgProfitability.toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              of net sale price
            </p>
          </div>
        </div>

        {/* Categories >= 10% */}
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Categories ≥ 10%</h3>
            <span className="text-sm text-green-600 font-bold">▲</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 tabular-nums">{stats.categoriesAbove10Pct}</div>
            <p className="text-[10px] text-green-600 font-medium mt-1">
              ↑ {stats.totalCategories > 0 ? Math.round((stats.categoriesAbove10Pct / stats.totalCategories) * 100) : 0}% of all
            </p>
          </div>
        </div>

        {/* Categories < 10% */}
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Categories &lt; 10%</h3>
            <span className="text-sm text-red-600 font-bold">▼</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 tabular-nums">{stats.categoriesBelow10Pct}</div>
            <p className="text-[10px] text-red-500 font-medium mt-1">
              Needs review
            </p>
          </div>
        </div>
      </div>

      {/* Highlight Cards Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Highest Profit Category */}
        <div className="rounded-xl border bg-white shadow-sm border-l-4 border-l-green-600 overflow-hidden p-6 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-green-50 text-green-600 text-xl font-bold">
            🏆
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-green-600 tracking-wider uppercase mb-0.5">Highest Profit Category</div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-slate-800">
                {stats.highestProfitCategory?.category?.replace('فئة الصنف ', '').replace('فئة ', '') || 'N/A'}
              </span>
              <span className="text-sm font-bold text-green-600 tabular-nums">
                {(stats.highestProfitCategory?.avgProfit ?? 0).toFixed(1)}% 
                <span className="text-xs font-normal text-slate-400 ml-1">margin</span>
              </span>
            </div>
          </div>
        </div>

        {/* Lowest Profit Category */}
        <div className="rounded-xl border bg-white shadow-sm border-l-4 border-l-red-600 overflow-hidden p-6 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xl font-bold">
            ⚠️
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-red-600 tracking-wider uppercase mb-0.5">Lowest Profit Category</div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-slate-800">
                {stats.lowestProfitCategory?.category?.replace('فئة الصنف ', '').replace('فئة ', '') || 'N/A'}
              </span>
              <span className="text-sm font-bold text-red-600 tabular-nums">
                {(stats.lowestProfitCategory?.avgProfit ?? 0).toFixed(1)}% 
                <span className="text-xs font-normal text-red-400 ml-1">· Urgent Review</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Main Category Chart */}
        <div className="rounded-xl border bg-white shadow-sm md:col-span-2 p-6">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase border-b pb-2 mb-4">
            Average Net Margin by Category
          </h3>
          <CategoryChart data={stats.categoryBreakdown} />
        </div>

        {/* Margin Distribution List */}
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase border-b pb-2 mb-4">
            Margin Distribution
          </h3>
          <div className="flex flex-col gap-2">
            {stats.profitDistribution.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="flex-1 text-slate-600 font-medium">{d.range}</span>
                <span className="font-bold text-slate-800 tabular-nums">{d.count}</span>
                <span className="text-slate-400 text-[10px] w-8 text-right tabular-nums">
                  {stats.totalProducts > 0 ? Math.round((d.count / stats.totalProducts) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}