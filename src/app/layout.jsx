import '@/styles/globals.css'
import '@/styles/components.css'
import { AuthProvider } from '@/context/AuthContext'
import { UnitProvider } from '@/context/UnitContext'
import Navbar from '@/components/Navbar'
import MemoryNoticeBanner from '@/components/MemoryNoticeBanner'

export const metadata = {
  title: 'Sweety – Clinical Blood Glucose Tracker',
  description: 'Evidence-based blood glucose tracking, daily compliance, and analytical reporting for diabetes management.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
  },
}

export const viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <UnitProvider>
            <div className="app-wrapper">
              <MemoryNoticeBanner />
              <Navbar />
              <main className="main-content">
                {children}
              </main>
            </div>
          </UnitProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
