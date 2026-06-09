'use client'
import Topbar from '@/components/layout/Topbar'
import SettingsPanel from '@/components/settings/SettingsPanel'

export default function SettingsPage() {
  return (
    <>
      <Topbar title="Settings" subtitle="Configure costing parameters, discounts, and exchange rates" />
      <div className="page-body">
        <SettingsPanel />
      </div>
    </>
  )
}
