'use client'
import { useState } from 'react'

interface CatData { category: string; count: number; avgProfit: number }

const mc  = (p: number) => p >= 20 ? '#0d7a4e' : p >= 10 ? '#0066cc' : p >= 0 ? '#92640a' : '#c0392b'
const fill = (p: number) => p >= 20 ? '#0d9e6a' : p >= 10 ? '#1a7cde' : p >= 0 ? '#f0a030' : '#e53935'
const badge = (p: number) => p >= 20 ? ['badge-green','Healthy'] : p >= 10 ? ['badge-blue','Good'] : p >= 0 ? ['badge-amber','Review'] : ['badge-red','Loss']

const shortName = (s: string) =>
  s.replace('فئة الصنف ', '').replace('فئة ', '')

export default function CategoryChart({ data }: { data: CatData[] }) {
  const [view, setView] = useState<'bars' | 'table'>('bars')
  const sorted  = [...data].sort((a, b) => b.avgProfit - a.avgProfit)
  const maxAbs  = Math.max(...sorted.map(d => Math.abs(d.avgProfit)), 1)
  const hasNeg  = sorted.some(d => d.avgProfit < 0)
  const zeroPct = hasNeg ? (maxAbs / (maxAbs * 2)) * 100 : 0 // zero line position

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['bars','table'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{ padding: '3px 12px', fontSize: 11, fontWeight: 600, borderRadius: 99,
              cursor: 'pointer', fontFamily: 'inherit',
              background: view === v ? 'var(--accent)' : 'transparent',
              color:      view === v ? '#fff' : 'var(--text-3)',
              border:     view === v ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
            {v === 'bars' ? 'Chart' : 'Table'}
          </button>
        ))}
      </div>

      {view === 'bars' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: 360, paddingRight: 2 }}>
          {sorted.map(d => {
            const barW = (Math.abs(d.avgProfit) / maxAbs) * (hasNeg ? 50 : 100)
            const isNeg = d.avgProfit < 0
            return (
              <div key={d.category} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 26 }}>
                {/* label */}
                <div style={{ width: 160, flexShrink: 0, fontSize: 12, color: 'var(--text-2)', textAlign: 'right',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}
                  title={shortName(d.category)}>
                  {shortName(d.category)}
                </div>
                {/* bar track */}
                <div style={{ flex: 1, height: 20, position: 'relative', borderRadius: 4, overflow: 'hidden',
                  background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  {/* zero line */}
                  {hasNeg && (
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${zeroPct}%`, width: 1, background: 'var(--border-2)', zIndex: 2 }} />
                  )}
                  {/* bar */}
                  <div style={{
                    position: 'absolute', top: 2, bottom: 2, borderRadius: 3,
                    left:  hasNeg ? (isNeg ? `${zeroPct - barW}%` : `${zeroPct}%`) : 0,
                    width: `${barW}%`,
                    background: fill(d.avgProfit),
                    transition: 'width .3s ease',
                  }} />
                </div>
                {/* value */}
                <div style={{ width: 48, flexShrink: 0, fontSize: 12, fontWeight: 700,
                  fontFamily: 'monospace', color: mc(d.avgProfit), textAlign: 'right' }}>
                  {d.avgProfit.toFixed(1)}%
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ overflowY: 'auto', maxHeight: 360, borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Products</th>
                <th style={{ textAlign: 'right' }}>Avg Margin</th>
                <th>Bar</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => {
                const w = Math.min(100, Math.max(0, (d.avgProfit / 50) * 100))
                const [cls, lbl] = badge(d.avgProfit)
                return (
                  <tr key={d.category}>
                    <td style={{ color: 'var(--text-3)', width: 32 }}>{i+1}</td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {shortName(d.category)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }} className="num">{d.count}</td>
                    <td style={{ textAlign: 'right' }} className="num">
                      <span style={{ fontWeight: 700, color: mc(d.avgProfit) }}>{d.avgProfit.toFixed(1)}%</span>
                    </td>
                    <td style={{ minWidth: 80 }}>
                      <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden', width: 80 }}>
                        <div style={{ height: '100%', width: `${Math.max(0,w)}%`, background: fill(d.avgProfit), borderRadius: 99 }} />
                      </div>
                    </td>
                    <td><span className={`badge ${cls}`}>{lbl}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
