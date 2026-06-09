// ─── Core Data Types ────────────────────────────────────────────────────────

export type ItemType = 'RM' | 'PK' | 'INT' | 'SFG' | 'FG'

export interface RawProduct {
  category: string
  code: string
  name: string
  unit: string
  netWeight: number
  companyPrice: number
}

export interface BOMLine {
  parentCode: string
  parentType: ItemType
  childCode: string
  childName: string
  childType: ItemType
  quantity: number
}

export interface PriceItem {
  code: string
  name: string
  type: ItemType
  unitCostUSD: number
}

// ─── Costing Engine Output ───────────────────────────────────────────────────

export interface CostBreakdown {
  rmCost: number       // Raw materials cost
  pkCost: number       // Packaging cost
  totalMaterialCost: number
  weightExpense: number
  totalCost: number    // RM + PK + weightExpense
  insurance: number    // 10% of totalCost
  totalCostWithInsurance: number
}

export interface BOMTreeNode {
  code: string
  name: string
  type: ItemType
  quantity: number
  unitCost: number
  totalCost: number
  children: BOMTreeNode[]
}

export interface ComputedProduct {
  // From raw data
  category: string
  code: string
  name: string
  unit: string
  netWeight: number
  companyPrice: number

  // Computed
  costs: CostBreakdown
  bomTree: BOMTreeNode[]

  // Profitability (with category discount)
  categoryDiscount: number       // 0-1
  netSalePrice: number           // companyPrice * (1 - discount)
  grossMarginRM: number          // netSale - totalMaterialCost
  grossMarginRMPct: number
  netProfit: number              // netSale - totalCostWithInsurance
  netProfitPct: number           // netProfit / netSale * 100
  profitabilityClass: 'high' | 'medium' | 'low' | 'negative'
}

// ─── App Settings ────────────────────────────────────────────────────────────

export interface WeightExpenseRange {
  minWeight: number
  maxWeight: number
  expense: number   // USD per unit
}

export interface CategoryDiscount {
  category: string
  discount: number  // 0-1
}

export interface AppSettings {
  exchangeRateLYD: number          // 1 USD = X LYD
  insuranceRate: number            // default 0.10
  weightExpenseRanges: WeightExpenseRange[]
  categoryDiscounts: CategoryDiscount[]
  displayCurrency: 'USD' | 'LYD' | 'EUR'
}

// ─── Quotation ───────────────────────────────────────────────────────────────

export interface QuotationLine {
  id: string
  product: ComputedProduct
  quantity: number
  unitPrice: number           // editable
  discount: number            // 0-1, editable
  currency: 'USD' | 'LYD' | 'EUR'
  notes?: string
}

export interface Quotation {
  id: string
  number: string
  date: string
  customerName: string
  customerRef?: string
  validityDays: number
  currency: 'USD' | 'LYD' | 'EUR'
  lines: QuotationLine[]
  notes?: string
  createdBy?: string
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface DashboardStats {
  totalProducts: number
  totalCategories: number
  categoriesAbove10Pct: number
  categoriesBelow10Pct: number
  highestProfitCategory: { name: string; avgProfitPct: number }
  lowestProfitCategory: { name: string; avgProfitPct: number }
  avgProfitability: number
  profitDistribution: { range: string; count: number }[]
  categoryBreakdown: { category: string; count: number; avgProfit: number }[]
}

// ─── Raw Material Impact ─────────────────────────────────────────────────────

export interface RMImpact {
  productCode: string
  productName: string
  category: string
  currentCost: number
  newCost: number
  costDelta: number
  currentProfitPct: number
  newProfitPct: number
  profitDelta: number
  impactPct: number   // % impact on profitability
}

// ─── Saved Quotation (extended) ──────────────────────────────────────────────

export interface SavedQuotation {
  id: string
  number: string
  date: string
  customerName: string
  customerRef: string
  validityDays: number
  currency: 'USD' | 'LYD' | 'EUR'
  preparedBy: string
  notes: string
  shippingCost: number        // مصاريف نقل
  lines: SavedQuotationLine[]
  totals: QuotationTotals
  createdAt: string
  updatedAt: string
}

export interface SavedQuotationLine {
  id: string
  productCode: string
  productName: string
  unit: string
  category: string
  quantity: number
  unitPrice: number
  discount: number
  totalCostWithInsurance: number   // for margin calc
  notes: string
}

export interface QuotationTotals {
  subtotalUSD: number
  shippingCost: number
  totalUSD: number
  totalCostUSD: number
  grossMargin: number
  grossMarginPct: number
}
