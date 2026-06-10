import type {
  RawProduct, BOMLine, PriceItem, AppSettings,
  ComputedProduct, CostBreakdown, BOMTreeNode, ItemType
} from '@/types'

// تعريف واجهة مجموعة الخصم لتتوافق مع الـ Frontend الجديد
interface DiscountGroup {
  id: string
  name: string
  discountValue: number
  productCodes: string[]
}

// توسيع واجهة الـ AppSettings محلياً لتقرأ الحقل الجديد بأمان
type MappedAppSettings = AppSettings & {
  discountGroups?: DiscountGroup[]
}

const DEFAULT_SETTINGS: MappedAppSettings = {
  exchangeRateLYD: 5.5,
  insuranceRate: 0.10,
  weightExpenseRanges: [
    { minWeight: 0,    maxWeight: 1,    expense: 0.05 },
    { minWeight: 1,    maxWeight: 5,    expense: 0.10 },
    { minWeight: 5,    maxWeight: 10,   expense: 0.20 },
    { minWeight: 10,   maxWeight: 20,   expense: 0.35 },
    { minWeight: 20,   maxWeight: 30,   expense: 0.50 },
    { minWeight: 30,   maxWeight: 9999, expense: 0.70 },
  ],
  categoryDiscounts: [],
  discountGroups: [], // الحقل الجديد الافتراضي
  displayCurrency: 'USD',
}

// ─── Weight Expense Lookup ───────────────────────────────────────────────────
function getWeightExpense(weight: number, settings: AppSettings): number {
  const range = settings.weightExpenseRanges.find(
    (r) => weight >= r.minWeight && weight < r.maxWeight
  )
  return range?.expense ?? 0
}

// ─── Build lookup maps ───────────────────────────────────────────────────────
function buildMaps(bomLines: BOMLine[], prices: PriceItem[]) {
  const bomByParent = new Map<string, BOMLine[]>()
  for (const line of bomLines) {
    if (!bomByParent.has(line.parentCode)) bomByParent.set(line.parentCode, [])
    bomByParent.get(line.parentCode)!.push(line)
  }
  const priceMap = new Map<string, PriceItem>()
  for (const p of prices) priceMap.set(p.code, p)
  return { bomByParent, priceMap }
}

// ─── Recursive cost resolver ─────────────────────────────────────────────────
function resolveItem(
  code: string,
  qty: number,
  type: ItemType,
  name: string,
  bomByParent: Map<string, BOMLine[]>,
  priceMap: Map<string, PriceItem>,
  visited: Set<string> = new Set()
): { rmCost: number; pkCost: number; node: BOMTreeNode } {
  // Cycle detection
  if (visited.has(code)) {
    return { rmCost: 0, pkCost: 0, node: { code, name, type, quantity: qty, unitCost: 0, totalCost: 0, children: [] } }
  }
  const newVisited = new Set(visited).add(code)

  const children = bomByParent.get(code) ?? []

  // Leaf node (RM or PK with no BOM children, or not in BOM)
  if (children.length === 0) {
    const price = priceMap.get(code)
    const unitCost = price?.unitCostUSD ?? 0
    const totalCost = unitCost * qty
    const node: BOMTreeNode = { code, name, type, quantity: qty, unitCost, totalCost, children: [] }
    return {
      rmCost: type === 'RM' || type === 'INT' || type === 'SFG' ? totalCost : 0,
      pkCost: type === 'PK' ? totalCost : 0,
      node,
    }
  }

  // Composite node — expand children
  let totalRM = 0, totalPK = 0
  const childNodes: BOMTreeNode[] = []

  for (const child of children) {
    const childQty = child.quantity * qty
    const res = resolveItem(
      child.childCode, childQty, child.childType, child.childName,
      bomByParent, priceMap, newVisited
    )
    totalRM += res.rmCost
    totalPK += res.pkCost
    childNodes.push(res.node)
  }

  const unitCost = (totalRM + totalPK) / (qty || 1)
  const node: BOMTreeNode = {
    code, name, type, quantity: qty,
    unitCost,
    totalCost: totalRM + totalPK,
    children: childNodes,
  }

  return {
    rmCost: type === 'SFG' || type === 'INT' || type === 'FG' ? totalRM : (type === 'RM' ? totalRM + totalPK : 0),
    pkCost: type === 'FG' ? totalPK : (type === 'PK' ? totalPK : 0),
    node,
  }
}

// ─── Main compute function ───────────────────────────────────────────────────
export function computeProducts(
  products: RawProduct[],
  bomLines: BOMLine[],
  prices: PriceItem[],
  settings: MappedAppSettings = DEFAULT_SETTINGS
): ComputedProduct[] {
  const { bomByParent, priceMap } = buildMaps(bomLines, prices)

  // بناء خريطة بحث سريعة جداً للمنتجات المربوطة بمجموعات الخصم بدلاً من الفئات القديمة
  const productDiscountMap = new Map<string, number>()
  
  if (settings.discountGroups && Array.isArray(settings.discountGroups)) {
    for (const group of settings.discountGroups) {
      const discount = group.discountValue || 0
      if (group.productCodes && Array.isArray(group.productCodes)) {
        for (const code of group.productCodes) {
          productDiscountMap.set(code, discount)
        }
      }
    }
  }

  return products.map((product) => {
    // Resolve BOM for this FG product
    const fgChildren = bomByParent.get(product.code) ?? []
    let totalRM = 0, totalPK = 0
    const bomTree: BOMTreeNode[] = []

    for (const child of fgChildren) {
      const res = resolveItem(
        child.childCode, child.quantity, child.childType, child.childName,
        bomByParent, priceMap, new Set([product.code])
      )
      totalRM += res.rmCost
      totalPK += res.pkCost
      bomTree.push(res.node)
    }

    const totalMaterialCost = totalRM + totalPK
    const weightExpense = getWeightExpense(product.netWeight, settings)
    const totalCost = totalMaterialCost + weightExpense
    const insurance = totalCost * settings.insuranceRate
    const totalCostWithInsurance = totalCost + insurance

    const costs: CostBreakdown = {
      rmCost: totalRM,
      pkCost: totalPK,
      totalMaterialCost,
      weightExpense,
      totalCost,
      insurance,
      totalCostWithInsurance,
    }

    // Profitability ── التعديل هنا: البحث عن خصم كود المنتج المباشر بدلاً من الفئة العامة
    const productDiscount = productDiscountMap.get(product.code) ?? 0
    const netSalePrice = product.companyPrice * (1 - productDiscount)
    
    const grossMarginRM = netSalePrice - totalMaterialCost
    const grossMarginRMPct = netSalePrice > 0 ? (grossMarginRM / netSalePrice) * 100 : 0
    const netProfit = netSalePrice - totalCostWithInsurance
    const netProfitPct = netSalePrice > 0 ? (netProfit / netSalePrice) * 100 : 0

    let profitabilityClass: ComputedProduct['profitabilityClass'] = 'negative'
    if (netProfitPct >= 25) profitabilityClass = 'high'
    else if (netProfitPct >= 10) profitabilityClass = 'medium'
    else if (netProfitPct >= 0) profitabilityClass = 'low'

    return {
      ...product,
      costs,
      bomTree,
      categoryDiscount: productDiscount, // حافظنا على اسم المتغير في النوع تلافياً لتغيير ملف الـ types
      netSalePrice,
      grossMarginRM,
      grossMarginRMPct,
      netProfit,
      netProfitPct,
      profitabilityClass,
    }
  })
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export function computeDashboardStats(products: ComputedProduct[]) {
  const fgProducts = products
  const categories = [...new Set(fgProducts.map((p) => p.category))]

  const categoryStats = categories.map((cat) => {
    const prods = fgProducts.filter((p) => p.category === cat)
    const avgProfit = prods.reduce((s, p) => s + p.netProfitPct, 0) / prods.length
    return { category: cat, count: prods.length, avgProfit }
  })

  const sorted = [...categoryStats].sort((a, b) => b.avgProfit - a.avgProfit)
  const highest = sorted[0]
  const lowest = sorted[sorted.length - 1]

  const above10 = categoryStats.filter((c) => c.avgProfit >= 10).length
  const below10 = categoryStats.filter((c) => c.avgProfit < 10).length

  const avgProfitability =
    fgProducts.reduce((s, p) => s + p.netProfitPct, 0) / fgProducts.length

  const profitBuckets = [
    { range: '< 0%',     min: -Infinity, max: 0 },
    { range: '0-10%',    min: 0,         max: 10 },
    { range: '10-20%',   min: 10,        max: 20 },
    { range: '20-30%',   min: 20,        max: 30 },
    { range: '> 30%',    min: 30,        max: Infinity },
  ]

  const profitDistribution = profitBuckets.map(({ range, min, max }) => ({
    range,
    count: fgProducts.filter((p) => p.netProfitPct >= min && p.netProfitPct < max).length,
  }))

  return {
    totalProducts: fgProducts.length,
    totalCategories: categories.length,
    categoriesAbove10Pct: above10,
    categoriesBelow10Pct: below10,
    highestProfitCategory: { name: highest?.category ?? '-', avgProfitPct: highest?.avgProfit ?? 0 },
    lowestProfitCategory:  { name: lowest?.category  ?? '-', avgProfitPct: lowest?.avgProfit  ?? 0 },
    avgProfitability,
    profitDistribution,
    categoryBreakdown: categoryStats,
  }
}

// ─── Raw Material Impact Analysis ────────────────────────────────────────────
export function analyzeRMImpact(
  rmCode: string,
  newPrice: number,
  products: ComputedProduct[],
  bomLines: BOMLine[],
  prices: PriceItem[],
  settings: MappedAppSettings = DEFAULT_SETTINGS
) {
  const affected = products.filter((p) => productUsesRM(p.code, rmCode, bomLines, new Set()))
  const newPrices = prices.map((p) => (p.code === rmCode ? { ...p, unitCostUSD: newPrice } : p))

  const recomputed = computeProducts(
    affected.map((p) => ({
      category: p.category, code: p.code, name: p.name,
      unit: p.unit, netWeight: p.netWeight, companyPrice: p.companyPrice
    })),
    bomLines, newPrices, settings
  )

  return affected.map((orig, i) => {
    const neu = recomputed[i]
    return {
      productCode:       orig.code,
      productName:       orig.name,
      category:          orig.category,
      currentCost:       orig.costs.totalCostWithInsurance,
      newCost:           neu.costs.totalCostWithInsurance,
      costDelta:         neu.costs.totalCostWithInsurance - orig.costs.totalCostWithInsurance,
      currentProfitPct:  orig.netProfitPct,
      newProfitPct:      neu.netProfitPct,
      profitDelta:       neu.netProfitPct - orig.netProfitPct,
      impactPct:         orig.netProfitPct !== 0
        ? Math.abs((neu.netProfitPct - orig.netProfitPct) / orig.netProfitPct) * 100
        : 0,
    }
  }).sort((a, b) => Math.abs(b.profitDelta) - Math.abs(a.profitDelta))
}

function productUsesRM(
  productCode: string, rmCode: string,
  bomLines: BOMLine[], visited: Set<string>
): boolean {
  if (visited.has(productCode)) return false
  visited.add(productCode)
  const children = bomLines.filter((b) => b.parentCode === productCode)
  for (const child of children) {
    if (child.childCode === rmCode) return true
    if (productUsesRM(child.childCode, rmCode, bomLines, visited)) return true
  }
  return false
}

export { DEFAULT_SETTINGS }