'use client'
import { useState } from 'react'
import { Save, Plus, Trash2, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { computeProducts } from '@/lib/costingEngine'
import type { AppSettings } from '@/types'

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
  const [local, setLocal]   = useState<AppSettings>({ ...settings })
  const [flash, setFlash]   = useState(false)
  const [recalc, setRecalc] = useState(false)

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

  const addDiscount = () => setLocal(s => ({ ...s, categoryDiscounts: [...s.categoryDiscounts, { category: '', discount: 0 }] }))
  const delDiscount = (i: number) => setLocal(s => ({ ...s, categoryDiscounts: s.categoryDiscounts.filter((_, j) => j !== i) }))
  const setDiscount = (i: number, field: string, val: string | number) => setLocal(s => {
    const arr = [...s.categoryDiscounts]; arr[i] = { ...arr[i], [field]: val }; return { ...s, categoryDiscounts: arr }
  })

  const categories = [...new Set(rawProducts.map(p => p.category))].sort()

  /* discount validation */
  const badDiscounts = local.categoryDiscounts.filter(d => d.discount > 1)

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
        <SH title="Weight Expense Ranges 1" desc="Industrial cost added per unit based on product net weight (USD)"
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
          {local.weightExpenseRanges.length > 0 && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 7, fontSize: 11, color: 'var(--text-3)' }}>
              💡 Ranges are applied to net weight of finished goods (FG) only. Make sure ranges are contiguous and cover all expected weights.
            </div>
          )}
        </div>
      </div>

      {/* ── CATEGORY DISCOUNTS ───────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <SH title="Category Discounts" desc="Applied to company price to derive net sale price"
          right={
            <button className="btn btn-primary" onClick={addDiscount} style={{ height: 28, fontSize: 11 }}>
              <Plus size={12} /> Add
            </button>
          } />
        <div style={{ padding: 16 }}>
          {badDiscounts.length > 0 && (
            <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: 'var(--amber-bg)', border: '1px solid var(--amber)', borderRadius: 7, marginBottom: 12, fontSize: 11, color: 'var(--amber)' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span><strong>Warning:</strong> Some discounts are &gt; 1 (should be 0–1 decimal, e.g. 0.10 = 10%). Check your entries.</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: '8px 10px', marginBottom: 8 }}>
            {['Category', 'Discount (0–1 decimal = %, e.g. 0.10)', ''].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{h}</div>
            ))}
          </div>
          {local.categoryDiscounts.length === 0 && (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              No discounts configured — sale price = company price for all categories
            </div>
          )}
          {local.categoryDiscounts.map((d, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: '6px 10px', marginBottom: 6, alignItems: 'center' }}>
              <select className="input" value={d.category} onChange={e => setDiscount(i, 'category', e.target.value)}>
                <option value="">Select category…</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ position: 'relative' }}>
                <input className="input" type="number" step={0.01} min={0} max={1} style={{ paddingRight: 60 }}
                  value={d.discount}
                  onChange={e => setDiscount(i, 'discount', parseFloat(e.target.value) || 0)} />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, color: d.discount > 1 ? 'var(--red)' : 'var(--text-3)', pointerEvents: 'none' }}>
                  = {(d.discount * 100).toFixed(1)}%
                </span>
              </div>
              <button onClick={() => delDiscount(i)}
                style={{ background: 'var(--red-bg)', border: '1px solid var(--red-mid)', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)', height: 34 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
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
