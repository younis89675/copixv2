'use client'
import { useState } from 'react'
import { Save, Plus, Trash2, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { computeProducts } from '@/lib/costingEngine'
import type { AppSettings } from '@/types'

// تعريف هيكل مجموعة الخصم الجديدة داخل الملف
interface DiscountGroup {
  id: string
  name: string
  discountValue: number
  productCodes: string[]
}

const SH = ({ title, desc, right }: { title: string; desc?: string; right?: React.ReactNode }) => (
  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', borderRadius: 'var(--radius) var(--radius) 0 0' }}>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-2)' }}>{title}</div>
      {desc && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{desc}</div>}
    </div>
    {right}
  </div>
)

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>{children}</label>
)

export default function SettingsPanel() {
  const { settings, updateSettings, rawProducts, bomLines, prices, setComputedProducts, pushToCloud } = useAppStore()
  
  // دمج الحقل الجديد في الـ local state مع الحفاظ على البيانات القديمة
  const [local, setLocal] = useState<AppSettings & { discountGroups?: DiscountGroup[] }>({
    ...settings,
    discountGroups: (settings as any).discountGroups || []
  })
  
  const [flash, setFlash] = useState(false)
  const [recalc, setRecalc] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const save = async () => {
    setRecalc(true)
    updateSettings(local)
    if (rawProducts.length > 0) {
      const computed = computeProducts(rawProducts, bomLines, prices, local)
      setComputedProducts(computed)
      await pushToCloud()
    }
    setRecalc(false)
    setFlash(true)
    setTimeout(() => setFlash(false), 2500)
  }

  const addRange = () => setLocal(s => ({
    ...s,
    weightExpenseRanges: [...s.weightExpenseRanges, { minWeight: 0, maxWeight: 9999, expense: 0 }]
  }))
  const delRange = (i: number) => setLocal(s => ({ ...s, weightExpenseRanges: s.weightExpenseRanges.filter((_, j) => j !== i) }))
  const setRange = (i: number, field: string, val: number) => setLocal(s => {
    const arr = [...s.weightExpenseRanges]; arr[i] = { ...arr[i], [field]: val }; return { ...s, weightExpenseRanges: arr }
  })

  // ── دج الـ LOGIC الجديد لمجموعات الخصم ───────────────────
  const addDiscountGroup = () => setLocal(s => ({
    ...s,
    discountGroups: [...(s.discountGroups || []), { id: crypto.randomUUID(), name: '', discountValue: 0, productCodes: [] }]
  }))

  const delDiscountGroup = (id: string) => setLocal(s => ({
    ...s,
    discountGroups: (s.discountGroups || []).filter(g => g.id !== id)
  }))

  const setDiscountGroupField = (id: string, field: keyof DiscountGroup, val: any) => setLocal(s => ({
    ...s,
    discountGroups: (s.discountGroups || []).map(g => g.id === id ? { ...g, [field]: val } : g)
  }))

  const toggleProductInGroup = (groupId: string, productCode: string) => setLocal(s => ({
    ...s,
    discountGroups: (s.discountGroups || []).map(g => {
      if (g.id !== groupId) return g
      const currentCodes = g.productCodes || []
      const exists = currentCodes.includes(productCode)
      return {
        ...g,
        productCodes: exists ? currentCodes.filter(c => c !== productCode) : [...currentCodes, productCode]
      }
    })
  }))

  // دالة ذكية لتجميع كل الأكواد المحجوزة في مجموعات تانية لمنع تكرار المنتج
  const getAllAssignedCodesExcept = (currentGroupId: string) => {
    return (local.discountGroups || [])
      .filter(g => g.id !== currentGroupId)
      .reduce((acc, g) => [...acc, ...(g.productCodes || [])], [] as string[])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>

      {/* ── GENERAL ─────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <SH title="General Settings" desc="Exchange rate, insurance, default currency" />
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 20px' }}>
          <div>
            <Label>Exchange Rate (1 USD = X LYD)</Label>
            <input className="input" type="number" step={0.01} min={0}
              value={local.exchangeRateLYD}
              onChange={e => setLocal(s => ({ ...s, exchangeRateLYD: parseFloat(e.target.value) || 0 }))} />
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Used for LYD display across the app</div>
          </div>
          <div>
            <Label>Insurance Rate</Label>
            <div style={{ position: 'relative' }}>
              <input className="input" type="number" step={0.01} min={0} max={1} style={{ paddingRight: 36 }}
                value={local.insuranceRate}
                onChange={e => setLocal(s => ({ ...s, insuranceRate: parseFloat(e.target.value) || 0 }))} />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-3)', pointerEvents: 'none' }}>
                = {(local.insuranceRate * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Enter as decimal: 0.10 = 10%</div>
          </div>
          <div>
            <Label>Default Display Currency</Label>
            <select className="input" value={local.displayCurrency}
              onChange={e => setLocal(s => ({ ...s, displayCurrency: e.target.value as 'USD' | 'LYD' | 'EUR' }))}>
              <option value="USD">USD — US Dollar</option>
              <option value="LYD">LYD — Libyan Dinar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── WEIGHT EXPENSE ───────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <SH title="Weight Expense Ranges " desc="Industrial cost added per unit based on product net weight (USD)"
          right={
            <button className="btn btn-primary" onClick={addRange} style={{ height: 28, fontSize: 11 }}>
              <Plus size={12} /> Add Range
            </button>
          } />
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 36px', gap: '8px 10px', marginBottom: 8 }}>
            {['Min Weight (kg)', 'Max Weight (kg)', 'Expense (USD / unit)', ''].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{h}</div>
            ))}
          </div>
          {local.weightExpenseRanges.length === 0 && (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              No ranges defined — industrial expenses will be 0
            </div>
          )}
          {local.weightExpenseRanges.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 36px', gap: '6px 10px', marginBottom: 6 }}>
              <input className="input" type="number" step={0.1} min={0} value={r.minWeight}
                onChange={e => setRange(i, 'minWeight', parseFloat(e.target.value) || 0)} />
              <input className="input" type="number" step={0.1} min={0}
                value={r.maxWeight === 9999 ? '' : r.maxWeight} placeholder="∞"
                onChange={e => setRange(i, 'maxWeight', parseFloat(e.target.value) || 9999)} />
              <input className="input" type="number" step={0.01} min={0} value={r.expense}
                onChange={e => setRange(i, 'expense', parseFloat(e.target.value) || 0)} />
              <button onClick={() => delRange(i)}
                style={{ background: 'var(--red-bg)', border: '1px solid var(--red-mid)', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRODUCT DISCOUNT GROUPS (تعديل مجموعات الخصم الآمن) ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <SH title="Product Discount Groups" desc="Create custom groups and link specific products directly"
          right={
            <button className="btn btn-primary" onClick={addDiscountGroup} style={{ height: 28, fontSize: 11 }}>
              <Plus size={12} /> Add Group
            </button>
          } />
        
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(!local.discountGroups || local.discountGroups.length === 0) && (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              No discount groups configured — all products default to 0% discount
            </div>
          )}

          {(local.discountGroups || []).map((group) => {
            const forbiddenCodes = getAllAssignedCodesExcept(group.id)
            
            return (
              <div key={group.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, position: 'relative' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 36px', gap: 10, alignItems: 'center' }}>
                  
                  {/* اسم المجموعة */}
                  <input className="input" type="text" placeholder="Group Name (e.g., Cement 7%)" 
                    value={group.name} 
                    onChange={e => setDiscountGroupField(group.id, 'name', e.target.value)} />

                  {/* قيمة الخصم */}
                  <div style={{ position: 'relative' }}>
                    <input className="input" type="number" step={0.01} min={0} max={1} style={{ paddingRight: 45 }}
                      value={group.discountValue} 
                      onChange={e => setDiscountGroupField(group.id, 'discountValue', parseFloat(e.target.value) || 0)} />
                    <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>
                      ={(group.discountValue * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* قائمة إدارة المنتجات المنسدلة */}
                  <div style={{ position: 'relative' }}>
                    <button className="btn" style={{ width: '100%', fontSize: 11, background: 'var(--surface)', justifyContent: 'center', height: 34, border: '1px solid var(--border)' }}
                      onClick={() => setActiveDropdown(activeDropdown === group.id ? null : group.id)}>
                      📦 Products ({group.productCodes?.length || 0})
                    </button>

                    {activeDropdown === group.id && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 200, overflowY: 'auto', padding: 6, marginTop: 4 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', paddingBottom: 4, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>Select products:</div>
                        {rawProducts.map(p => {
                          const isChecked = group.productCodes?.includes(p.code || (p as any).CODE)
                          const isLocked = forbiddenCodes.includes(p.code || (p as any).CODE)
                          const pCode = p.code || (p as any).CODE
                          const pName = p.name || (p as any).PRODUCT_NAME || (p as any).name

                          return (
                            <label key={pCode} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4, cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.4 : 1, fontSize: 11, background: isChecked ? 'var(--surface-2)' : 'transparent' }}>
                              <input type="checkbox" checked={isChecked} disabled={isLocked}
                                onChange={() => toggleProductInGroup(group.id, pCode)} />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                [{pCode}] {pName}
                              </span>
                              {isLocked && <span style={{ fontSize: 8, color: 'var(--red)', fontWeight: 700, marginLeft: 'auto' }}>(Taken)</span>}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* حذف المجموعة */}
                  <button onClick={() => delDiscountGroup(group.id)}
                    style={{ background: 'var(--red-bg)', border: '1px solid var(--red-mid)', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)', height: 34 }}>
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* شارات المنتجات المختارة للعرض الفوري السريع */}
                {group.productCodes?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, borderTop: '1px dashed var(--border)', paddingTop: 8 }}>
                    {group.productCodes.map(c => {
                      const found = rawProducts.find(p => (p.code || (p as any).CODE) === c)
                      const nameDisplay = found ? (found.name || (found as any).PRODUCT_NAME || c) : c
                      return (
                        <span key={c} style={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 10, padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-2)' }}>
                          {nameDisplay}
                          <span style={{ color: 'var(--text-3)', cursor: 'pointer', fontWeight: 700 }} onClick={() => toggleProductInGroup(group.id, c)}>×</span>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SAVE BUTTON ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-primary" onClick={save} disabled={recalc}
          style={{ padding: '8px 20px', fontSize: 13, gap: 8 }}>
          {recalc
            ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Recalculating…</>
            : flash
            ? <><Check size={14} /> Saved & Recalculated!</>
            : <><Save size={14} /> Save Settings & Recalculate</>}
        </button>
        {rawProducts.length === 0 && (
          <span style={{ fontSize: 11, color: 'var(--amber)' }}>
            ⚠ No data loaded yet — settings will apply on next upload
          </span>
        )}
        {rawProducts.length > 0 && !recalc && !flash && (
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Will recalculate costs for {rawProducts.length} products and push to cloud
          </span>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}