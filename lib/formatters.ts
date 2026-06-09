export function formatCurrency(
  value: number,
  currency: 'USD' | 'LYD' | 'EUR' = 'USD',
  exchangeRateLYD = 5.5,
  exchangeRateEUR = 0.92
): string {
  let converted = value
  let symbol = '$'
  let decimals = 3

  if (currency === 'LYD') {
    converted = value * exchangeRateLYD
    symbol = 'LYD'
    decimals = 2
  } else if (currency === 'EUR') {
    converted = value * exchangeRateEUR
    symbol = '€'
    decimals = 3
  }

  return `${symbol} ${converted.toFixed(decimals)}`
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`
}

export function getProfitColor(pct: number): string {
  if (pct >= 25)  return 'text-emerald-400'
  if (pct >= 10)  return 'text-yellow-400'
  if (pct >= 0)   return 'text-orange-400'
  return 'text-red-400'
}

export function getProfitBgColor(pct: number): string {
  if (pct >= 25)  return 'bg-emerald-500/10 border-emerald-500/30'
  if (pct >= 10)  return 'bg-yellow-500/10 border-yellow-500/30'
  if (pct >= 0)   return 'bg-orange-500/10 border-orange-500/30'
  return 'bg-red-500/10 border-red-500/30'
}
