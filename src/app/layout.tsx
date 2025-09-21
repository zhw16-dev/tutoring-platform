import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const lora = Lora({ 
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap'
})

export const metadata: Metadata = {
  title: "Will's Tutoring",
  description: 'Connect students with qualified tutors - Professional tutoring platform',
  keywords: 'tutoring, education, learning, academic support, homework help',
  authors: [{ name: "Will's Tutoring" }],
  openGraph: {
    title: "Will's Tutoring",
    description: 'Connect students with qualified tutors',
    type: 'website',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}