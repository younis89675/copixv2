'use client'
import Topbar from '@/components/layout/Topbar'
import SettingsPanel from '@/components/settings/SettingsPanel'

export default function SettingsPage() {
  return (
    <>
      <Topbar title="Settings" breadcrumb="Settings"
        subtitle="Configure costing parameters, category discounts, and exchange rates" />
      <div className="page-body">
        <SettingsPanel />
      </div>
    </>
  )
}
