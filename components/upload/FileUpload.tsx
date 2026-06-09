'use client'
import { useCallback, useState } from 'react'
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet, RefreshCw, Cloud } from 'lucide-react'
import { parseProductFile, parseBOMFile, parsePriceFile } from '@/lib/excelParser'
import { computeProducts } from '@/lib/costingEngine'
import { useAppStore } from '@/store/appStore'

type FileKey = 'product' | 'bom' | 'price'

const FILE_CONFIGS: { key: FileKey; label: string; desc: string; color: string }[] = [
  { key: 'product', label: 'Products File',  desc: 'Product codes, categories, weights, prices', color: 'var(--accent)' },
  { key: 'bom',     label: 'BOM File',        desc: 'Bill of Materials — parent/child relationships', color: 'var(--purple)' },
  { key: 'price',   label: 'Price List',      desc: 'Raw material & packaging unit costs (USD)', color: 'var(--green)' },
]

export default function FileUpload() {
  const { settings, setRawData, setComputedProducts, reset, pushToCloud } = useAppStore()
  const [files, setFiles] = useState<Record<FileKey, File | null>>({ product: null, bom: null, price: null })
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  const onDrop = useCallback((key: FileKey, file: File) => {
    setFiles(f => ({ ...f, [key]: file }))
    setStatus('idle')
  }, [])

  const allLoaded = files.product && files.bom && files.price

  const handleProcess = async () => {
    if (!allLoaded) return
    setStatus('processing')
    setError('')
    try {
      setProgress('Reading Excel files…')
      const [pb, bb, prb] = await Promise.all([
        files.product!.arrayBuffer(),
        files.bom!.arrayBuffer(),
        files.price!.arrayBuffer(),
      ])
      setProgress('Parsing data…')
      const products = parseProductFile(pb)
      const bom      = parseBOMFile(bb)
      const prices   = parsePriceFile(prb)

      setProgress(`Computing costs for ${products.length} products…`)
      setRawData(products, bom, prices)
      const computed = computeProducts(products, bom, prices, settings)
      setComputedProducts(computed)

      setProgress('Syncing to cloud…')
      await pushToCloud()

      setStatus('done')
      setProgress('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Processing failed')
      setStatus('error')
      setProgress('')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {FILE_CONFIGS.map(({ key, label, desc, color }) => (
          <DropZone key={key} label={label} desc={desc} color={color}
            file={files[key]} onDrop={f => onDrop(key, f)} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="btn btn-primary"
          onClick={handleProcess}
          disabled={!allLoaded || status === 'processing'}
          style={{ opacity: !allLoaded ? .5 : 1 }}>
          {status === 'processing'
            ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> {progress || 'Processing…'}</>
            : <><Upload size={13} /> Process & Calculate</>}
        </button>

        {status === 'done' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
            <CheckCircle size={14} />
            <span>Done! Data pushed to cloud — teammates will see it on refresh.</span>
            <Cloud size={13} />
          </div>
        )}
        {status === 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--red)' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-3)' }}>
          Reset
        </button>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function DropZone({ label, desc, file, color, onDrop }: {
  label: string; desc: string; file: File | null; color: string; onDrop: (f: File) => void
}) {
  const [dragging, setDragging] = useState(false)
  return (
    <label
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onDrop(f) }}
      style={{
        display: 'block', cursor: 'pointer', padding: '20px 16px', borderRadius: 'var(--radius)',
        border: `1.5px dashed ${dragging ? color : file ? 'var(--green)' : 'var(--border-2)'}`,
        background: dragging ? 'var(--accent-bg)' : file ? 'var(--green-bg)' : 'var(--surface-2)',
        textAlign: 'center', transition: 'all .15s',
      }}>
      <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onDrop(f) }} />
      <FileSpreadsheet size={22} style={{ color: file ? 'var(--green)' : color, display: 'block', margin: '0 auto 8px' }} />
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>{label}</div>
      {file
        ? <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>{file.name}</div>
        : <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{desc}</div>}
    </label>
  )
}
