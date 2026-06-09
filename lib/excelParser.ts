import * as XLSX from 'xlsx'
import type { RawProduct, BOMLine, PriceItem, ItemType } from '@/types'

// ─── Product File Parser ────────────────────────────────────────────────────
export function parseProductFile(buffer: ArrayBuffer): RawProduct[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

  return rows
    .filter((r) => r['Final Product Code'] || r['Product Category'])
    .map((r) => ({
      category:     String(r['Product Category'] ?? '').trim(),
      code:         String(r['Final Product Code'] ?? '').trim(),
      name:         String(r['Product Name'] ?? '').trim(),
      unit:         String(r['Unit'] ?? '').trim(),
      netWeight:    parseFloat(String(r['Net Weight'] ?? '0')) || 0,
      companyPrice: parseFloat(String(r['Company Price'] ?? '0')) || 0,
    }))
    .filter((p) => p.code && p.companyPrice > 0)
}

// ─── BOM File Parser ────────────────────────────────────────────────────────
export function parseBOMFile(buffer: ArrayBuffer): BOMLine[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  // find sheet named bom or first sheet
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes('bom')) ?? wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

  return rows
    .filter((r) => r['Internal Reference'] && r['BOM Line'])
    .map((r) => ({
      parentCode: String(r['Internal Reference'] ?? '').trim(),
      parentType: normalizeType(String(r['Type Internal Reference'] ?? '')),
      childCode:  String(r['BOM Line'] ?? '').trim(),
      childName:  String(r['BOM Line Name'] ?? '').trim(),
      childType:  normalizeType(String(r['Type BOM Line'] ?? '')),
      quantity:   parseFloat(String(r['Quantity'] ?? '0')) || 0,
    }))
    .filter((b) => b.parentCode && b.childCode && b.quantity > 0)
}

// ─── Price File Parser ──────────────────────────────────────────────────────
export function parsePriceFile(buffer: ArrayBuffer): PriceItem[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

  return rows
    .filter((r) => r['Item Code'])
    .map((r) => ({
      code:        String(r['Item Code'] ?? '').trim(),
      name:        String(r['Item Name'] ?? '').trim(),
      type:        normalizeType(String(r['Item Type'] ?? '')),
      unitCostUSD: parseFloat(String(r['Unit Cost USD'] ?? '0')) || 0,
    }))
    .filter((p) => p.code && p.unitCostUSD > 0)
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function normalizeType(raw: string): ItemType {
  const t = raw.trim().toUpperCase()
  if (t === 'RM')  return 'RM'
  if (t === 'PK')  return 'PK'
  if (t === 'INT') return 'INT'
  if (t === 'SFG') return 'SFG'
  if (t === 'FG')  return 'FG'
  return 'RM'
}
