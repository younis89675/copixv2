'use client'
import Topbar from '@/components/layout/Topbar'
import FileUpload from '@/components/upload/FileUpload'

export default function UploadPage() {
  return (
    <>
      <Topbar title="Upload Data" breadcrumb="Upload"
        subtitle="Load your three Excel files to populate the costing engine" />
      <div className="page-body">
        <div style={{ maxWidth: 720 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
            <div className="section-header">
              <span className="section-title">Data Import</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Excel (.xlsx / .xls)</span>
            </div>
            <div style={{ padding: 20 }}>
              <FileUpload />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
