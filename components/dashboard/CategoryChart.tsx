'use client'
import { useState } from 'react'

interface CatData { category: string; count: number; avgProfit: number }

const mc  = (p: number) => p >= 20 ? '#1d9e75' : p >= 10 ? '#378add' : p >= 0 ? '#ef9f27' : '#e24b4a'
const mcv = (p: number) => p >= 20 ? 'var(--green)' : p >= 10 ? 'var(--accent)' : p >= 0 ? 'var(--amber)' : 'var(--red)'
const mbg = (p: number) => p >= 20 ? 'var(--green-bg)' : p >= 10 ? 'var(--accent-bg)' : p >= 0 ? 'var(--amber-bg)' : 'var(--red-bg)'

export default function CategoryChart({ data }: { data: CatData[] }) {
  const [view, setView] = useState<'bars' | 'table'>('bars')
  const sorted = [...data].sort((a, b) => b.avgProfit - a.avgProfit)
  const maxVal  = Math.max(...sorted.map(d => Math.abs(d.avgProfit)), 1)

  const shortName = (s: string) =>
    s.replace('فئة الصنف ', '').replace('فئة ', '')

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {(['bars','table'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)',
              background: view === v ? 'var(--accent)' : 'transparent',
              color:      view === v ? '#fff'          : 'var(--text-3)' }}>
            {v === 'bars' ? 'Bar Chart' : 'Table'}
          </button>
        ))}
      </div>

      {view === 'bars' ? (
        /* ── Custom bar chart with CSS ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', maxHeight: 340, paddingRight: 4 }}>
          {sorted.map(d => {
            const barW = Math.abs(d.avgProfit) / maxVal * 100
            const isNeg = d.avgProfit < 0
            return (
              <div key={d.category} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 28 }}>
                {/* label */}
                <div style={{ width: 130, flexShrink: 0, fontSize: 11, color: 'var(--text-2)', textAlign: 'right', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={shortName(d.category)}>
                  {shortName(d.category)}
                </div>
                {/* bar track */}
                <div style={{ flex: 1, height: 18, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: 0, bottom: 0,
                    left: isNeg ? `${50 - barW/2}%` : '0%',
                    width: `${barW/2}%`,
                    background: mc(d.avgProfit),
                    borderRadius: 4,
                    transition: 'width .3s',
                  }} />
                </div>
                {/* value */}
                <div style={{ width: 46, flexShrink: 0, fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: mcv(d.avgProfit), textAlign: 'right' }}>
                  {d.avgProfit.toFixed(1)}%
                </div>
                {/* count */}
                <div style={{ width: 22, flexShrink: 0, fontSize: 10, color: 'var(--text-3)', textAlign: 'right' }}>
                  {d.count}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Table view ── */
        <div style={{ overflowY: 'auto', maxHeight: 340 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['#', 'Category', 'Products', 'Avg Margin', 'Bar', 'Status'].map(h => (
                  <th key={h} style={{ background: 'var(--surface-2)', color: 'var(--text-3)', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '6px 10px', borderBottom: '1px solid var(--border)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => {
                const w = Math.min(100, Math.max(0, (d.avgProfit / 40) * 100))
                const status = d.avgProfit >= 20 ? ['badge-green','Healthy'] : d.avgProfit >= 10 ? ['badge-blue','Good'] : d.avgProfit >= 0 ? ['badge-amber','Low'] : ['badge-red','Negative']
                return (
                  <tr key={d.category} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)' }}>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11 }}>{i+1}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', maxWidth: 160 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{shortName(d.category)}</div>
                    </td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{d.count}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', fontFamily: 'monospace', fontWeight: 700, color: mcv(d.avgProfit), textAlign: 'right' }}>{d.avgProfit.toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', minWidth: 80 }}>
                      <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${w}%`, background: mc(d.avgProfit), borderRadius: 99 }} />
                      </div>
                    </td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
                      <span className={`badge ${status[0]}`}>{status[1]}</span>
                    </td>
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
