import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import { ToastProvider } from '@/components/shared/Toast'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Will's Tutoring · Product Demo",
  description: 'A role-based tutoring management platform — Product demo by Will Zhai',
  openGraph: {
    title: "Will's Tutoring · Product Demo",
    description: 'A role-based tutoring management platform built to eliminate coordination chaos.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <AppProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  )
}
