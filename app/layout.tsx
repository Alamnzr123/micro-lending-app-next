import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Micro Lending AR System',
  description: 'Accounts Receivable Management System for Micro Lending Company',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}