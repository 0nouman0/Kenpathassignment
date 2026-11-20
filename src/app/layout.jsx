import '@/styles/globals.css'
import '@/styles/components.css'
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Sweety – Clinical Blood Glucose Tracker',
  description: 'Evidence-based blood glucose tracking, daily compliance, and analytical reporting for diabetes management.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-wrapper">
            <Navbar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
