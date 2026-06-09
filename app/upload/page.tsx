'use client'
import Topbar from '@/components/layout/Topbar'
import FileUpload from '@/components/upload/FileUpload'

export default function UploadPage() {
  return (
    <>
      <Topbar title="Upload Data" subtitle="Load your three Excel files to start the costing engine" />
      <div className="page-body">
        <div className="card">
          <FileUpload />
        </div>
      </div>
    </>
  )
}
