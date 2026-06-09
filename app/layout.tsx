import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

export const metadata: Metadata = {
  title: 'COPIX — Manufacturing Cost Platform',
  description: 'Professional manufacturing costing and profitability management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="app-shell">
            <Sidebar />
            <div className="main-area">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
